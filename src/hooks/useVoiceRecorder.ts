import { useState, useRef, useCallback, useEffect } from 'react';
import { useEdgeFunctionHeaders } from './useEdgeFunctionHeaders';
import { useToast } from './use-toast';

export type VoiceRecorderState = 'idle' | 'recording' | 'processing' | 'result' | 'error';
export type VoiceErrorType = 'mic_denied' | 'empty' | 'failed';

interface UseVoiceRecorderOptions {
  language?: string;
  maxDuration?: number; // seconds
}

interface UseVoiceRecorderReturn {
  state: VoiceRecorderState;
  transcript: string;
  duration: number;
  maxDuration: number;
  errorType: VoiceErrorType | null;
  analyser: AnalyserNode | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  retry: () => void;
  confirm: () => void;
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const { language = 'de', maxDuration = 30 } = options;
  const { getHeaders } = useEdgeFunctionHeaders();
  const { toast } = useToast();

  const [state, setState] = useState<VoiceRecorderState>('idle');
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [errorType, setErrorType] = useState<VoiceErrorType | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup all resources
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (_) { /* ignore */ }
    }
    mediaRecorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (_) { /* ignore */ }
      audioContextRef.current = null;
    }
    setAnalyser(null);
    chunksRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  // Detect best supported MIME type
  const getMimeType = (): string => {
    if (typeof MediaRecorder === 'undefined') return 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
    if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
    return 'audio/webm';
  };

  // Send audio to Gladia via edge function
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setState('processing');
    console.log(`[VoiceRecorder] Transcribing ${audioBlob.size} bytes, language: ${language}`);

    try {
      const formData = new FormData();
      const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
      formData.append('audio', audioBlob, `recording.${ext}`);
      formData.append('language', language);

      // Use raw fetch instead of supabase.functions.invoke to avoid
      // Content-Type issues with FormData on repeated calls
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const extraHeaders = getHeaders();

      const response = await fetch(`${supabaseUrl}/functions/v1/speech-to-text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          ...extraHeaders,
          // Do NOT set Content-Type – browser sets multipart boundary automatically
        },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('[VoiceRecorder] Edge function error:', response.status, errText);
        setErrorType('failed');
        setState('error');
        return;
      }

      const data = await response.json();

      const text = (data?.text || '').trim();
      console.log(`[VoiceRecorder] Transcript: "${text}"`);

      if (!text) {
        setErrorType('empty');
        setState('error');
        return;
      }

      setTranscript(text);
      setState('result');
    } catch (err) {
      console.error('[VoiceRecorder] Transcription error:', err);
      setErrorType('failed');
      setState('error');
    }
  }, [language, getHeaders]);

  // Start recording
  const startRecording = useCallback(async () => {
    cleanup();
    setTranscript('');
    setErrorType(null);
    setDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Set up Web Audio API for waveform visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      setAnalyser(analyserNode);

      // Set up MediaRecorder
      const mimeType = getMimeType();
      console.log(`[VoiceRecorder] Starting with mimeType: ${mimeType}`);
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        console.log(`[VoiceRecorder] Recording stopped, blob size: ${blob.size}`);
        if (blob.size > 0) {
          transcribeAudio(blob);
        } else {
          setErrorType('empty');
          setState('error');
        }
      };

      // Start recording with timeslice for smooth stop
      recorder.start(100);
      startTimeRef.current = Date.now();
      setState('recording');

      // Duration timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);

        // Auto-stop at maxDuration
        if (elapsed >= maxDuration) {
          console.log(`[VoiceRecorder] Auto-stop at ${maxDuration}s`);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      }, 200);

    } catch (err: any) {
      console.error('[VoiceRecorder] getUserMedia error:', err);
      cleanup();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorType('mic_denied');
      } else {
        setErrorType('failed');
      }
      setState('error');
    }
  }, [cleanup, maxDuration, transcribeAudio]);

  // Stop recording manually
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    // Stream + AudioContext cleanup happens after onstop → transcribeAudio
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (_) { /* ignore */ }
      audioContextRef.current = null;
    }
    setAnalyser(null);
  }, []);

  // Retry: go back to idle
  const retry = useCallback(() => {
    cleanup();
    setTranscript('');
    setErrorType(null);
    setDuration(0);
    setState('idle');
  }, [cleanup]);

  // Confirm: stay in result state (parent reads transcript)
  const confirm = useCallback(() => {
    // No-op internally; parent handles via onTranscript
  }, []);

  return {
    state,
    transcript,
    duration,
    maxDuration,
    errorType,
    analyser,
    startRecording,
    stopRecording,
    retry,
    confirm,
  };
}
