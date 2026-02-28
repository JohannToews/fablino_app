import { useState } from 'react';
import { Mic, Square, RotateCcw, Check, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FABLINO_COLORS } from '@/constants/design-tokens';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import type { VoiceErrorType } from '@/hooks/useVoiceRecorder';
import WaveformVisualizer from './WaveformVisualizer';
import FablinoMascot from '@/components/FablinoMascot';
import { Textarea } from '@/components/ui/textarea';

// ── Multilingual labels ────────────────────────────────────────────────
const VOICE_LABELS: Record<string, {
  speak: string;
  listening: string;
  retry: string;
  confirm: string;
  mic_denied: string;
  empty: string;
  failed: string;
  modalHeader: string;
}> = {
  de: {
    speak: 'Sprich deinen Wunsch!',
    listening: 'Fablino hört zu...',
    retry: 'Nochmal versuchen',
    confirm: 'Übernehmen',
    mic_denied: 'Fablino braucht dein Mikrofon! Frag deine Eltern um Hilfe.',
    empty: 'Hmm, Fablino hat dich nicht verstanden. Versuch es nochmal!',
    failed: 'Etwas ist schiefgelaufen. Versuch es nochmal!',
    modalHeader: 'Das habe ich verstanden:',
  },
  fr: {
    speak: 'Dis ton souhait !',
    listening: 'Fablino écoute...',
    retry: 'Réessayer',
    confirm: 'Accepter',
    mic_denied: 'Fablino a besoin du micro ! Demande à tes parents.',
    empty: "Hmm, Fablino n'a pas compris. Réessaie !",
    failed: "Quelque chose n'a pas marché. Réessaie !",
    modalHeader: 'Voici ce que j\'ai compris :',
  },
  es: {
    speak: '¡Di tu deseo!',
    listening: 'Fablino escucha...',
    retry: 'Intentar de nuevo',
    confirm: 'Aceptar',
    mic_denied: '¡Fablino necesita tu micrófono! Pide ayuda a tus padres.',
    empty: 'Hmm, Fablino no te entendió. ¡Inténtalo de nuevo!',
    failed: 'Algo salió mal. ¡Inténtalo de nuevo!',
    modalHeader: 'Esto es lo que entendí:',
  },
  en: {
    speak: 'Say your wish!',
    listening: 'Fablino is listening...',
    retry: 'Try again',
    confirm: 'Accept',
    mic_denied: 'Fablino needs your microphone! Ask your parents for help.',
    empty: "Hmm, Fablino didn't understand. Try again!",
    failed: 'Something went wrong. Try again!',
    modalHeader: "Here's what I understood:",
  },
  nl: {
    speak: 'Zeg je wens!',
    listening: 'Fablino luistert...',
    retry: 'Opnieuw proberen',
    confirm: 'Overnemen',
    mic_denied: 'Fablino heeft je microfoon nodig! Vraag je ouders om hulp.',
    empty: 'Hmm, Fablino begreep je niet. Probeer het nog eens!',
    failed: 'Er ging iets mis. Probeer het nog eens!',
    modalHeader: 'Dit heb ik begrepen:',
  },
  it: {
    speak: 'Di il tuo desiderio!',
    listening: 'Fablino ascolta...',
    retry: 'Riprova',
    confirm: 'Accetta',
    mic_denied: 'Fablino ha bisogno del microfono! Chiedi ai tuoi genitori.',
    empty: 'Hmm, Fablino non ha capito. Riprova!',
    failed: 'Qualcosa è andato storto. Riprova!',
    modalHeader: 'Ecco cosa ho capito:',
  },
  uk: {
    speak: 'Скажи своє бажання!',
    listening: 'Фабліно слухає...',
    retry: 'Ще раз',
    confirm: 'Прийняти',
    mic_denied: 'Фабліно потрібен мікрофон! Попроси батьків про допомогу.',
    empty: 'Хм, Фабліно не зрозумів. Спробуй ще раз!',
    failed: 'Щось пішло не так. Спробуй ще раз!',
    modalHeader: 'Ось що я зрозумів:',
  },
  ru: {
    speak: 'Скажи своё желание!',
    listening: 'Фабліно слушает...',
    retry: 'Ещё раз',
    confirm: 'Принять',
    mic_denied: 'Фабліно нужен микрофон! Попроси родителей о помощи.',
    empty: 'Хм, Фабліно не понял. Попробуй ещё раз!',
    failed: 'Что-то пошло не так. Попробуй ещё раз!',
    modalHeader: 'Вот что я понял:',
  },
  bs: {
    speak: 'Govori svoju želju',
    listening: 'Slušam...',
    retry: 'Pokušaj ponovo',
    confirm: 'Prihvati',
    mic_denied: 'Mikrofon nije dozvoljen',
    empty: 'Nisam ništa čuo/čula. Pokušaj ponovo.',
    failed: 'Greška. Pokušaj ponovo.',
    modalHeader: 'Evo šta sam razumio/razumjela:',
  },
};

const getLabels = (lang: string) => VOICE_LABELS[lang] || VOICE_LABELS.de;

const getErrorMessage = (labels: typeof VOICE_LABELS['de'], errorType: VoiceErrorType | null): string => {
  if (errorType === 'mic_denied') return labels.mic_denied;
  if (errorType === 'empty') return labels.empty;
  return labels.failed;
};

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
    analyser,
    startRecording,
    stopRecording,
    retry,
  } = useVoiceRecorder({ language });

  const labels = getLabels(language);
  const [editedText, setEditedText] = useState('');

  // Sync editedText when transcript changes (new result)
  const [lastTranscript, setLastTranscript] = useState('');
  if (transcript !== lastTranscript) {
    setLastTranscript(transcript);
    setEditedText(transcript);
  }

  const handleConfirm = () => {
    if (editedText.trim()) {
      onTranscript(editedText.trim());
    }
    retry();
  };

  const handleRetry = () => {
    retry();
    // Small delay then restart recording
    setTimeout(() => startRecording(), 200);
  };

  const handleDismiss = () => {
    retry();
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

  // ── RESULT — Modal Overlay ──────────────────────────────────────
  if (state === 'result') {
    return (
      <>
        {/* Keep mic button placeholder so layout doesn't jump */}
        <div className={`flex flex-col items-center ${className}`}>
          <div className="w-11 h-11" />
        </div>

        {/* Modal overlay */}
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={handleDismiss}
            />

            {/* Modal card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-6 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                type="button"
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>

              {/* Header with mascot */}
              <div className="flex items-center gap-3 mb-4">
                <FablinoMascot src="/mascot/1_happy_success.png" size="sm" />
                <p className="text-base font-bold" style={{ color: FABLINO_COLORS.text }}>
                  {labels.modalHeader}
                </p>
              </div>

              {/* Editable text */}
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full min-h-[80px] max-h-[200px] text-lg leading-relaxed rounded-xl border-2 border-amber-200 focus:border-amber-400 resize-none"
                autoFocus
              />

              {/* Actions */}
              <div className="mt-5 space-y-2">
                {/* Primary: Accept */}
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!editedText.trim()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold text-white transition-all duration-150 hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-40 disabled:pointer-events-none"
                  style={{ backgroundColor: FABLINO_COLORS.primary }}
                >
                  <Check className="h-5 w-5" />
                  {labels.confirm}
                </button>

                {/* Secondary: Try again */}
                <button
                  type="button"
                  onClick={handleRetry}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 hover:bg-gray-100 active:scale-95"
                  style={{ color: FABLINO_COLORS.textMuted }}
                >
                  <RotateCcw className="h-4 w-4" />
                  {labels.retry}
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      </>
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
