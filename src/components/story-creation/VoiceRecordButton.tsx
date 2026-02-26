import { Mic, Square, RotateCcw, Check, Loader2 } from 'lucide-react';
import { FABLINO_COLORS } from '@/constants/design-tokens';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import type { VoiceErrorType } from '@/hooks/useVoiceRecorder';
import WaveformVisualizer from './WaveformVisualizer';

// ── Multilingual labels ────────────────────────────────────────────────
const VOICE_LABELS: Record<string, {
  speak: string;
  listening: string;
  retry: string;
  confirm: string;
  mic_denied: string;
  empty: string;
  failed: string;
}> = {
  de: {
    speak: 'Sprich deinen Wunsch!',
    listening: 'Fablino hört zu...',
    retry: 'Nochmal',
    confirm: 'Passt!',
    mic_denied: 'Fablino braucht dein Mikrofon! Frag deine Eltern um Hilfe.',
    empty: 'Hmm, Fablino hat dich nicht verstanden. Versuch es nochmal!',
    failed: 'Etwas ist schiefgelaufen. Versuch es nochmal!',
  },
  fr: {
    speak: 'Dis ton souhait !',
    listening: 'Fablino écoute...',
    retry: 'Encore',
    confirm: "C'est bon !",
    mic_denied: 'Fablino a besoin du micro ! Demande à tes parents.',
    empty: "Hmm, Fablino n'a pas compris. Réessaie !",
    failed: "Quelque chose n'a pas marché. Réessaie !",
  },
  es: {
    speak: '¡Di tu deseo!',
    listening: 'Fablino escucha...',
    retry: 'Otra vez',
    confirm: '¡Listo!',
    mic_denied: '¡Fablino necesita tu micrófono! Pide ayuda a tus padres.',
    empty: 'Hmm, Fablino no te entendió. ¡Inténtalo de nuevo!',
    failed: 'Algo salió mal. ¡Inténtalo de nuevo!',
  },
  en: {
    speak: 'Say your wish!',
    listening: 'Fablino is listening...',
    retry: 'Again',
    confirm: 'Perfect!',
    mic_denied: 'Fablino needs your microphone! Ask your parents for help.',
    empty: "Hmm, Fablino didn't understand. Try again!",
    failed: 'Something went wrong. Try again!',
  },
  nl: {
    speak: 'Zeg je wens!',
    listening: 'Fablino luistert...',
    retry: 'Opnieuw',
    confirm: 'Past!',
    mic_denied: 'Fablino heeft je microfoon nodig! Vraag je ouders om hulp.',
    empty: 'Hmm, Fablino begreep je niet. Probeer het nog eens!',
    failed: 'Er ging iets mis. Probeer het nog eens!',
  },
  it: {
    speak: 'Di il tuo desiderio!',
    listening: 'Fablino ascolta...',
    retry: 'Ancora',
    confirm: 'Perfetto!',
    mic_denied: 'Fablino ha bisogno del microfono! Chiedi ai tuoi genitori.',
    empty: 'Hmm, Fablino non ha capito. Riprova!',
    failed: 'Qualcosa è andato storto. Riprova!',
  },
  uk: {
    speak: 'Скажи своє бажання!',
    listening: 'Фабліно слухає...',
    retry: 'Ще раз',
    confirm: 'Прийняти!',
    mic_denied: 'Фабліно потрібен мікрофон! Попроси батьків про допомогу.',
    empty: 'Хм, Фабліно не зрозумів. Спробуй ще раз!',
    failed: 'Щось пішло не так. Спробуй ще раз!',
  },
  ru: {
    speak: 'Скажи своё желание!',
    listening: 'Фабліно слушает...',
    retry: 'Ещё раз',
    confirm: 'Принять!',
    mic_denied: 'Фабліно нужен микрофон! Попроси родителей о помощи.',
    empty: 'Хм, Фабліно не понял. Попробуй ещё раз!',
    failed: 'Что-то пошло не так. Попробуй ещё раз!',
  },
};

const getLabels = (lang: string) => VOICE_LABELS[lang] || VOICE_LABELS.de;

const getErrorMessage = (labels: typeof VOICE_LABELS['de'], errorType: VoiceErrorType | null): string => {
  if (errorType === 'mic_denied') return labels.mic_denied;
  if (errorType === 'empty') return labels.empty;
  return labels.failed;
};

// Format seconds as m:ss
const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// ── Component ──────────────────────────────────────────────────────────
interface VoiceRecordButtonProps {
  language: string;
  onTranscript: (text: string) => void;
  className?: string;
}

const VoiceRecordButton = ({ language, onTranscript, className = '' }: VoiceRecordButtonProps) => {
  const {
    state,
    transcript,
    duration,
    maxDuration,
    errorType,
    errorDetail,
    debugInfo,
    analyser,
    startRecording,
    stopRecording,
    retry,
  } = useVoiceRecorder({ language });

  const labels = getLabels(language);

  const handleConfirm = () => {
    if (transcript) {
      onTranscript(transcript);
    }
    retry(); // Reset to idle after confirm
  };

  // ── IDLE ─────────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <button
          type="button"
          onClick={startRecording}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 shadow-md"
          style={{ backgroundColor: FABLINO_COLORS.primary }}
          aria-label={labels.speak}
        >
          <Mic className="h-5 w-5 text-white" />
        </button>
      </div>
    );
  }

  // ── RECORDING ────────────────────────────────────────────────────
  if (state === 'recording') {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={stopRecording}
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 shadow-md animate-pulse"
            style={{ backgroundColor: '#EF4444' }}
            aria-label="Stop"
          >
            <Square className="h-5 w-5 text-white fill-white" />
          </button>
          {analyser && (
            <WaveformVisualizer analyser={analyser} isRecording={true} />
          )}
        </div>
        <span
          className="text-xs font-mono tabular-nums"
          style={{ color: FABLINO_COLORS.textMuted }}
        >
          {formatTime(duration)}/{formatTime(maxDuration)}
        </span>
      </div>
    );
  }

  // ── PROCESSING ───────────────────────────────────────────────────
  if (state === 'processing') {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: FABLINO_COLORS.primary }}
        />
        <span
          className="text-sm font-medium"
          style={{ color: FABLINO_COLORS.primary }}
        >
          {labels.listening}
        </span>
      </div>
    );
  }

  // ── RESULT ───────────────────────────────────────────────────────
  if (state === 'result') {
    return (
      <div className={`flex flex-col items-center gap-4 ${className}`}>
        <p
          className="text-sm text-center max-w-[280px] leading-relaxed rounded-xl py-2 px-3"
          style={{
            color: FABLINO_COLORS.text,
            backgroundColor: FABLINO_COLORS.secondary,
          }}
        >
          "{transcript}"
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={retry}
            className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: '#F3F4F6',
              color: FABLINO_COLORS.textMuted,
            }}
          >
            <RotateCcw className="h-4 w-4" />
            {labels.retry}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-base font-bold text-white transition-all duration-150 hover:scale-105 active:scale-95 shadow-lg"
            style={{ backgroundColor: '#22C55E', minHeight: '48px' }}
          >
            <Check className="h-5 w-5" />
            {labels.confirm}
          </button>
        </div>
      </div>
    );
  }

  // ── ERROR ────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <p
          className="text-sm text-center px-4 max-w-[280px] leading-relaxed"
          style={{ color: FABLINO_COLORS.text }}
        >
          {getErrorMessage(labels, errorType)}
        </p>
        {errorDetail && (
          <p className="text-xs text-red-400 text-center max-w-[300px] break-all leading-tight px-2">
            {errorDetail}
          </p>
        )}
        <button
          type="button"
          onClick={retry}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-150 hover:scale-105 active:scale-95 shadow-md"
          style={{ backgroundColor: FABLINO_COLORS.primary }}
        >
          <RotateCcw className="h-4 w-4" />
          {labels.retry}
        </button>
      </div>
    );
  }

  return null;
};

export default VoiceRecordButton;
