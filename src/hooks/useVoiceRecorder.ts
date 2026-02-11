import { useState, useRef, useCallback, useEffect } from 'react';
import { useEdgeFunctionHeaders } from './useEdgeFunctionHeaders';

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
  errorDetail: string;
  analyser: AnalyserNode | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  retry: () => void;
  confirm: () => void;
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const { language = 'de', maxDuration = 30 } = options;
  const { getHeaders } = useEdgeFunctionHeaders();

  const [state, setState] = useState<VoiceRecorderState>('idle');
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [errorType, setErrorType] = useState<VoiceErrorType | null>(null);
  const [errorDetail, setErrorDetail] = useState('');
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup all resources (important on mobile where mic can stay "busy")
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop recorder without triggering transcription (detach handlers first)
    if (mediaRecorderRef.current) {
      const recorder = mediaRecorderRef.current;
      try {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      } catch (_) {
        /* ignore */
      }
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (_) {
        /* ignore */
      }
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (_) {
        /* ignore */
      }
      audioContextRef.current = null;
    }

    setAnalyser(null);
    chunksRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Detect best supported MIME type
  const getMimeType = (): string => {
    if (typeof MediaRecorder === 'undefined') return 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
    if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
    return 'audio/webm';
  };

  // Send audio to edge function for transcription
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setState('processing');
    setErrorDetail('');

    try {
      const formData = new FormData();
      const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
      formData.append('audio', audioBlob, `recording.${ext}`);
      formData.append('language', language);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const extraHeaders = getHeaders();

      const response = await fetch(`${supabaseUrl}/functions/v1/speech-to-text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          ...extraHeaders,
        },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        setErrorDetail(`HTTP ${response.status}: ${errText.substring(0, 200)}`);
        setErrorType('failed');
        setState('error');
        return;
      }

      const data = await response.json();
      const text = (data?.text || '').trim();

      if (!text) {
        setErrorDetail(`Response: ${JSON.stringify(data).substring(0, 200)}`);
        setErrorType('empty');
        setState('error');
        return;
      }

      setTranscript(text);
      setState('result');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorDetail(`Fetch: ${message}`);
      setErrorType('failed');
      setState('error');
    }
  }, [language, getHeaders]);

  // Start recording
  const startRecording = useCallback(async () => {
    // ALWAYS cleanup previous session first
    cleanup();

    // Small delay for mobile browsers to fully release mic hardware
    await new Promise((r) => setTimeout(r, 300));

    setTranscript('');
    setErrorType(null);
    setErrorDetail('');
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

      // ALWAYS create a fresh AudioContext
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      setAnalyser(analyserNode);

      // Set up MediaRecorder
      const mimeType = getMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const chunks = [...chunksRef.current];
        const blob = new Blob(chunks, { type: mimeType });

        // Release mic resources ASAP
        try {
          streamRef.current?.getTracks().forEach((t) => t.stop());
        } catch (_) { /* ignore */ }
        streamRef.current = null;

        try {
          audioContextRef.current?.close();
        } catch (_) { /* ignore */ }
        audioContextRef.current = null;
        setAnalyser(null);
        mediaRecorderRef.current = null;

        if (blob.size > 0) {
          transcribeAudio(blob);
        } else {
          setErrorDetail(`Blob size: 0, chunks: ${chunks.length}`);
          setErrorType('empty');
          setState('error');
        }
      };

      recorder.start(100);
      startTimeRef.current = Date.now();
      setState('recording');

      // Duration timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);

        if (elapsed >= maxDuration) {
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
      cleanup();
      const message = err instanceof Error ? err.message : String(err);
      setErrorDetail(`getUserMedia: ${message} (name: ${err?.name})`);
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
    // stream/audioContext are released in recorder.onstop
  }, []);

  // Retry: reset everything back to idle
  const retry = useCallback(() => {
    cleanup();
    setTranscript('');
    setErrorType(null);
    setErrorDetail('');
    setDuration(0);
    setState('idle');
  }, [cleanup]);

  // Confirm: no-op internally; parent reads transcript
  const confirm = useCallback(() => {}, []);

  return {
    state,
    transcript,
    duration,
    maxDuration,
    errorType,
    errorDetail,
    analyser,
    startRecording,
    stopRecording,
    retry,
    confirm,
  };
}
