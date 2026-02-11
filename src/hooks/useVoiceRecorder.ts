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
  debugInfo: string;
  analyser: AnalyserNode | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  retry: () => void;
  confirm: () => void;
}

// Hardcoded fallbacks to avoid undefined env vars on some devices
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://bafzwrvgffyxbiqfbitm.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const { language = 'de', maxDuration = 30 } = options;
  const { getHeaders } = useEdgeFunctionHeaders();

  const [state, setState] = useState<VoiceRecorderState>('idle');
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [errorType, setErrorType] = useState<VoiceErrorType | null>(null);
  const [errorDetail, setErrorDetail] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Use refs for values needed in recorder.onstop to avoid stale closures
  const languageRef = useRef(language);
  const getHeadersRef = useRef(getHeaders);
  useEffect(() => { languageRef.current = language; }, [language]);
  useEffect(() => { getHeadersRef.current = getHeaders; }, [getHeaders]);

  // Cleanup all resources
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current) {
      const recorder = mediaRecorderRef.current;
      try {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      } catch (_) { /* ignore */ }
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (_) { /* ignore */ }
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (_) { /* ignore */ }
      audioContextRef.current = null;
    }

    setAnalyser(null);
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    return () => { cleanup(); };
  }, [cleanup]);

  const getMimeType = (): string => {
    if (typeof MediaRecorder === 'undefined') return 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
    if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
    return 'audio/webm';
  };

  // Transcribe function – NOT a useCallback, called from onstop via ref
  const doTranscribe = async (audioBlob: Blob) => {
    setState('processing');
    setErrorDetail('');

    const url = `${SUPABASE_URL}/functions/v1/speech-to-text`;
    const blobInfo = `Blob:${audioBlob.size}b type:${audioBlob.type} url:${SUPABASE_URL ? 'ok' : 'MISSING'}`;
    setDebugInfo(blobInfo);

    if (!audioBlob || audioBlob.size === 0) {
      setErrorDetail('Aufnahme ist leer (0 bytes)');
      setErrorType('empty');
      setState('error');
      return;
    }

    try {
      // WebKit/Safari Fix: Blob-Daten explizit kopieren
      // Safari invalidiert Blob-Referenzen nach dem ersten fetch.
      // ArrayBuffer-Kopie erzwingt eine echte Datenkopie.
      const arrayBuffer = await audioBlob.arrayBuffer();
      const freshBlob = new Blob([arrayBuffer], { type: audioBlob.type });
      const audioFile = new File([freshBlob], `recording.${audioBlob.type.includes('mp4') ? 'mp4' : 'webm'}`, { 
        type: freshBlob.type,
        lastModified: Date.now() 
      });

      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('language', languageRef.current);

      // Only auth headers – NO Content-Type (browser sets multipart boundary)
      const extraHeaders = getHeadersRef.current();
      const fetchHeaders: Record<string, string> = {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
      };
      // Add only legacy headers if present
      if (extraHeaders['x-legacy-token']) {
        fetchHeaders['x-legacy-token'] = extraHeaders['x-legacy-token'];
      }
      if (extraHeaders['x-legacy-user-id']) {
        fetchHeaders['x-legacy-user-id'] = extraHeaders['x-legacy-user-id'];
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: fetchHeaders,
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
      const name = err instanceof Error ? err.constructor.name : 'unknown';
      const message = err instanceof Error ? err.message : String(err);
      setErrorDetail(`${name}: ${message}`);
      setErrorType('failed');
      setState('error');
    }
  };

  // Keep a ref to doTranscribe so onstop always calls the latest version
  const transcribeRef = useRef(doTranscribe);
  transcribeRef.current = doTranscribe;

  const startRecording = useCallback(async () => {
    cleanup();
    await new Promise((r) => setTimeout(r, 350));

    setTranscript('');
    setErrorType(null);
    setErrorDetail('');
    setDebugInfo('');
    setDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      setAnalyser(analyserNode);

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
        // Sofort Blob erstellen und chunks leeren
        const chunks = [...chunksRef.current];
        chunksRef.current = [];

        // Release mic resources ASAP
        try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch (_) { /* */ }
        streamRef.current = null;
        try { audioContextRef.current?.close(); } catch (_) { /* */ }
        audioContextRef.current = null;
        setAnalyser(null);
        mediaRecorderRef.current = null;

        if (chunks.length === 0) {
          setDebugInfo(`chunks: 0, blob: 0b`);
          setErrorDetail('Keine Audio-Daten aufgenommen');
          setErrorType('empty');
          setState('error');
          return;
        }

        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size > 0) {
          // Use ref to always call latest transcribe function (no stale closure)
          transcribeRef.current(blob);
        } else {
          setDebugInfo(`chunks: ${chunks.length}, blob: 0b`);
          setErrorDetail(`Blob size: 0, chunks: ${chunks.length}`);
          setErrorType('empty');
          setState('error');
        }
      };

      recorder.start(100);
      startTimeRef.current = Date.now();
      setState('recording');

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
  }, [cleanup, maxDuration]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const retry = useCallback(() => {
    cleanup();
    setTranscript('');
    setErrorType(null);
    setErrorDetail('');
    setDebugInfo('');
    setDuration(0);
    setState('idle');
  }, [cleanup]);

  const confirm = useCallback(() => {}, []);

  return {
    state, transcript, duration, maxDuration,
    errorType, errorDetail, debugInfo, analyser,
    startRecording, stopRecording, retry, confirm,
  };
}
