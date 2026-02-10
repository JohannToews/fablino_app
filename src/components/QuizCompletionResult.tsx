import FablinoMascot from "./FablinoMascot";

interface QuizCompletionResultProps {
  correctCount: number;
  totalCount: number;
  starsEarned: number;
  appLanguage: string;
  onContinue: () => void;
}

// Translations for quiz completion
const quizResultLabels: Record<string, {
  perfect: string;
  passed: string;
  failed: string;
  perfectMessage: string;
  passedMessage: string;
  failedMessage: string;
  starsLabel: string;
  continueBtn: string;
}> = {
  de: {
    perfect: "Perfekt! 🌟",
    passed: "Sehr gut! ✅",
    failed: "Gut versucht! 💪",
    perfectMessage: "Alle Fragen richtig! Du bist ein Meister!",
    passedMessage: "Du hast die Geschichte gemeistert!",
    failedMessage: "Nächstes Mal klappt's bestimmt!",
    starsLabel: "Sterne",
    continueBtn: "Weiter",
  },
  fr: {
    perfect: "Parfait ! 🌟",
    passed: "Très bien ! ✅",
    failed: "Bien essayé ! 💪",
    perfectMessage: "Toutes les réponses correctes ! Tu es un champion !",
    passedMessage: "Tu as maîtrisé cette histoire !",
    failedMessage: "La prochaine fois, ça marchera !",
    starsLabel: "Étoiles",
    continueBtn: "Continuer",
  },
  en: {
    perfect: "Perfect! 🌟",
    passed: "Great job! ✅",
    failed: "Nice try! 💪",
    perfectMessage: "All answers correct! You're a master!",
    passedMessage: "You've mastered this story!",
    failedMessage: "You'll get it next time!",
    starsLabel: "Stars",
    continueBtn: "Continue",
  },
  es: {
    perfect: "¡Perfecto! 🌟",
    passed: "¡Muy bien! ✅",
    failed: "¡Buen intento! 💪",
    perfectMessage: "¡Todas las respuestas correctas! ¡Eres un campeón!",
    passedMessage: "¡Has dominado esta historia!",
    failedMessage: "¡La próxima vez lo lograrás!",
    starsLabel: "Estrellas",
    continueBtn: "Continuar",
  },
  nl: {
    perfect: "Perfect! 🌟",
    passed: "Heel goed! ✅",
    failed: "Goed geprobeerd! 💪",
    perfectMessage: "Alle antwoorden goed! Je bent een meester!",
    passedMessage: "Je hebt dit verhaal onder de knie!",
    failedMessage: "Volgende keer lukt het!",
    starsLabel: "Sterren",
    continueBtn: "Doorgaan",
  },
  it: {
    perfect: "Perfetto! 🌟",
    passed: "Ottimo! ✅",
    failed: "Buon tentativo! 💪",
    perfectMessage: "Tutte le risposte corrette! Sei un maestro!",
    passedMessage: "Hai padroneggiato questa storia!",
    failedMessage: "La prossima volta andrà meglio!",
    starsLabel: "Stelle",
    continueBtn: "Continua",
  },
  bs: {
    perfect: "Savršeno! 🌟",
    passed: "Odlično! ✅",
    failed: "Dobar pokušaj! 💪",
    perfectMessage: "Svi odgovori tačni! Pravi si majstor!",
    passedMessage: "Savladao/la si ovu priču!",
    failedMessage: "Sljedeći put će biti bolje!",
    starsLabel: "Zvijezde",
    continueBtn: "Nastavi",
  },
};

// Score ring SVG component
function ScoreRing({ correct, total }: { correct: number; total: number }) {
  const pct = total > 0 ? correct / total : 0;
  const circumference = 2 * Math.PI * 45; // r=45
  const offset = circumference * (1 - pct);
  const isPerfect = correct === total && total > 0;
  const isPassed = pct >= 0.5;
  const ringColor = isPerfect ? '#16A34A' : isPassed ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
      <svg width="120" height="120" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="8" />
        {/* Progress arc */}
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke={ringColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{
            '--ring-offset': String(offset),
            strokeDashoffset: circumference,
            animation: 'scoreRingFill 1s ease-out 0.3s forwards',
            transformOrigin: 'center',
            transform: 'rotate(-90deg)',
          } as React.CSSProperties}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-extrabold leading-none" style={{ color: '#2D1810' }}>
          {correct}/{total}
        </span>
      </div>
    </div>
  );
}

const QuizCompletionResult = ({
  correctCount,
  totalCount,
  starsEarned,
  appLanguage,
  onContinue,
}: QuizCompletionResultProps) => {
  const pct = totalCount > 0 ? correctCount / totalCount : 0;
  const isPerfect = correctCount === totalCount && totalCount > 0;
  const isPassed = pct >= 0.5;
  const labels = quizResultLabels[appLanguage] || quizResultLabels.de;

  // Mascot image based on performance
  const mascotSrc = isPerfect
    ? '/mascot/1_happy_success.png'
    : isPassed
      ? '/mascot/1_happy_success.png'
      : '/mascot/2_encouriging_wrong_answer.png';

  // Star display
  const starEmojis = starsEarned >= 2 ? '⭐⭐' : starsEarned >= 1 ? '⭐' : '';

  return (
    <div
      className="rounded-[20px] p-6 text-center"
      style={{
        background: isPerfect
          ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)'
          : isPassed
            ? 'linear-gradient(135deg, #FFF7ED, #FEF3C7)'
            : 'linear-gradient(135deg, #FEF2F2, #FFE4E6)',
        border: isPerfect
          ? '2px solid #6EE7B7'
          : isPassed
            ? '2px solid #FDBA74'
            : '2px solid #FCA5A5',
      }}
    >
      {/* Fablino + Speech */}
      <div className="flex items-center gap-3 mb-4">
        <FablinoMascot src={mascotSrc} size="sm" bounce={false} className="flex-shrink-0" />
        <div
          className="flex-1 rounded-xl px-3 py-2 text-left"
          style={{
            background: 'white',
            border: '1px solid #E5E7EB',
          }}
        >
          <p className="text-[13px] font-semibold" style={{ color: '#2D1810' }}>
            {isPerfect ? labels.perfectMessage : isPassed ? labels.passedMessage : labels.failedMessage}
          </p>
        </div>
      </div>

      {/* Score ring */}
      <div className="flex justify-center mb-3">
        <ScoreRing correct={correctCount} total={totalCount} />
      </div>

      {/* Title */}
      <h2 className="text-[22px] font-extrabold mb-1" style={{ color: '#2D1810' }}>
        {isPerfect ? labels.perfect : isPassed ? labels.passed : labels.failed}
      </h2>

      {/* Stars earned */}
      {starsEarned > 0 ? (
        <p className="text-[18px] font-bold mb-3" style={{ color: '#F59E0B' }}>
          {starEmojis} +{starsEarned} {labels.starsLabel}!
        </p>
      ) : (
        <p className="text-[14px] font-medium mb-3" style={{ color: '#9CA3AF' }}>
          {labels.failedMessage}
        </p>
      )}

      {/* Answer dots */}
      <div className="flex justify-center gap-1.5 mb-4">
        {Array.from({ length: totalCount }, (_, i) => (
          <div
            key={`dot-${i}`}
            className="rounded-full"
            style={{
              width: 10,
              height: 10,
              background: i < correctCount ? '#16A34A' : '#EF4444',
              opacity: 0.8,
            }}
          />
        ))}
      </div>

      {/* Continue button */}
      <button
        onClick={onContinue}
        className="w-full py-3 rounded-xl font-bold text-white text-[16px] active:scale-95 transition-transform"
        style={{
          background: isPassed
            ? 'linear-gradient(135deg, #FF8C42, #FF6B00)'
            : '#9CA3AF',
        }}
      >
        {labels.continueBtn}
      </button>
    </div>
  );
};

export default QuizCompletionResult;
