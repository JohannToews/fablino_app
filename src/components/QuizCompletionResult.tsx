import FablinoMascot from "./FablinoMascot";

interface QuizCompletionResultProps {
  correctCount: number;
  totalCount: number;
  starsEarned: number;
  appLanguage: string;
  onContinue: () => void;
}

const quizResultLabels: Record<string, {
  perfect: string;
  good: string;
  retry: string;
  perfectSub: string;
  goodSub: string;
  retrySub: string;
  starsLabel: string;
  continueBtn: string;
}> = {
  de: {
    perfect: "Fantastisch! 🌟",
    good: "Gut gemacht! ⭐",
    retry: "Gut versucht! 💪",
    perfectSub: "Du hast alles verstanden!",
    goodSub: "Fast perfekt!",
    retrySub: "Beim nächsten Mal klappt's!",
    starsLabel: "Sterne",
    continueBtn: "Weiter",
  },
  fr: {
    perfect: "Fantastique ! 🌟",
    good: "Bien joué ! ⭐",
    retry: "Bien essayé ! 💪",
    perfectSub: "Tu as tout compris !",
    goodSub: "Presque parfait !",
    retrySub: "La prochaine fois, ça marchera !",
    starsLabel: "Étoiles",
    continueBtn: "Continuer",
  },
  en: {
    perfect: "Fantastic! 🌟",
    good: "Well done! ⭐",
    retry: "Nice try! 💪",
    perfectSub: "You understood everything!",
    goodSub: "Almost perfect!",
    retrySub: "You'll get it next time!",
    starsLabel: "Stars",
    continueBtn: "Continue",
  },
  es: {
    perfect: "¡Fantástico! 🌟",
    good: "¡Bien hecho! ⭐",
    retry: "¡Buen intento! 💪",
    perfectSub: "¡Lo has entendido todo!",
    goodSub: "¡Casi perfecto!",
    retrySub: "¡La próxima vez lo lograrás!",
    starsLabel: "Estrellas",
    continueBtn: "Continuar",
  },
  nl: {
    perfect: "Fantastisch! 🌟",
    good: "Goed gedaan! ⭐",
    retry: "Goed geprobeerd! 💪",
    perfectSub: "Je hebt alles begrepen!",
    goodSub: "Bijna perfect!",
    retrySub: "Volgende keer lukt het!",
    starsLabel: "Sterren",
    continueBtn: "Doorgaan",
  },
  it: {
    perfect: "Fantastico! 🌟",
    good: "Ben fatto! ⭐",
    retry: "Buon tentativo! 💪",
    perfectSub: "Hai capito tutto!",
    goodSub: "Quasi perfetto!",
    retrySub: "La prossima volta andrà meglio!",
    starsLabel: "Stelle",
    continueBtn: "Continua",
  },
  bs: {
    perfect: "Fantastično! 🌟",
    good: "Svaka čast! ⭐",
    retry: "Dobar pokušaj! 💪",
    perfectSub: "Sve si razumio/la!",
    goodSub: "Skoro savršeno!",
    retrySub: "Sljedeći put će biti bolje!",
    starsLabel: "Zvijezde",
    continueBtn: "Nastavi",
  },
  pt: {
    perfect: "Fantástico! 🌟",
    good: "Muito bem! ⭐",
    retry: "Boa tentativa! 💪",
    perfectSub: "Percebeste tudo!",
    goodSub: "Quase perfeito!",
    retrySub: "Da próxima vez consegues!",
    starsLabel: "Estrelas",
    continueBtn: "Continuar",
  },
  sk: {
    perfect: "Fantastické! 🌟",
    good: "Výborne! ⭐",
    retry: "Dobrý pokus! 💪",
    perfectSub: "Všetkému si rozumel/a!",
    goodSub: "Skoro perfektné!",
    retrySub: "Nabudúce to zvládneš!",
    starsLabel: "Hviezdy",
    continueBtn: "Ďalej",
  },
  bg: {
    perfect: "Фантастично! 🌟",
    good: "Браво! ⭐",
    retry: "Добър опит! 💪",
    perfectSub: "Разбра всичко!",
    goodSub: "Почти перфектно!",
    retrySub: "Следващия път ще се получи!",
    starsLabel: "Звезди",
    continueBtn: "Напред",
  },
  ca: {
    perfect: "Fantàstic! 🌟",
    good: "Molt bé! ⭐",
    retry: "Bon intent! 💪",
    perfectSub: "Ho has entès tot!",
    goodSub: "Gairebé perfecte!",
    retrySub: "La propera vegada ho aconseguiràs!",
    starsLabel: "Estrelles",
    continueBtn: "Continuar",
  },
  hu: {
    perfect: "Fantasztikus! 🌟",
    good: "Szép munka! ⭐",
    retry: "Jó próbálkozás! 💪",
    perfectSub: "Mindent megértettél!",
    goodSub: "Majdnem tökéletes!",
    retrySub: "Legközelebb sikerülni fog!",
    starsLabel: "Csillagok",
    continueBtn: "Tovább",
  },
  lt: {
    perfect: "Fantastiškai! 🌟",
    good: "Puikiai! ⭐",
    retry: "Geras bandymas! 💪",
    perfectSub: "Viską supratai!",
    goodSub: "Beveik tobulai!",
    retrySub: "Kitą kartą pavyks!",
    starsLabel: "Žvaigždės",
    continueBtn: "Toliau",
  },
  pl: {
    perfect: "Fantastycznie! 🌟",
    good: "Świetnie! ⭐",
    retry: "Dobra próba! 💪",
    perfectSub: "Wszystko zrozumiałeś/aś!",
    goodSub: "Prawie idealnie!",
    retrySub: "Następnym razem się uda!",
    starsLabel: "Gwiazdki",
    continueBtn: "Dalej",
  },
  ro: {
    perfect: "Fantastic! 🌟",
    good: "Bravo! ⭐",
    retry: "Bună încercare! 💪",
    perfectSub: "Ai înțeles totul!",
    goodSub: "Aproape perfect!",
    retrySub: "Data viitoare va fi mai bine!",
    starsLabel: "Stele",
    continueBtn: "Mai departe",
  },
  sl: {
    perfect: "Fantastično! 🌟",
    good: "Odlično! ⭐",
    retry: "Dober poskus! 💪",
    perfectSub: "Vse si razumel/a!",
    goodSub: "Skoraj popolno!",
    retrySub: "Naslednjič bo šlo!",
    starsLabel: "Zvezdice",
    continueBtn: "Naprej",
  },
  tr: {
    perfect: "Harika! 🌟",
    good: "Aferin! ⭐",
    retry: "İyi deneme! 💪",
    perfectSub: "Her şeyi anladın!",
    goodSub: "Neredeyse mükemmel!",
    retrySub: "Bir dahaki sefere olacak!",
    starsLabel: "Yıldızlar",
    continueBtn: "Devam",
  },
  ru: {
    perfect: "Фантастика! 🌟",
    good: "Молодец! ⭐",
    retry: "Хорошая попытка! 💪",
    perfectSub: "Ты всё понял(а)!",
    goodSub: "Почти идеально!",
    retrySub: "В следующий раз получится!",
    starsLabel: "Звёзды",
    continueBtn: "Дальше",
  },
  uk: {
    perfect: "Фантастично! 🌟",
    good: "Молодець! ⭐",
    retry: "Гарна спроба! 💪",
    perfectSub: "Ти все зрозумів/ла!",
    goodSub: "Майже ідеально!",
    retrySub: "Наступного разу вийде!",
    starsLabel: "Зірки",
    continueBtn: "Далі",
  },
};

type ScoreTier = 'perfect' | 'good' | 'retry';

function getScoreTier(correct: number, total: number): ScoreTier {
  if (total <= 0) return 'retry';
  if (correct === total) return 'perfect';
  const pct = correct / total;
  if (pct >= 0.6) return 'good';
  return 'retry';
}

const tierConfig: Record<ScoreTier, {
  bg: string;
  border: string;
  ringColor: string;
  titleColor: string;
  mascot: string;
}> = {
  perfect: {
    bg: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
    border: '2px solid #86EFAC',
    ringColor: '#16A34A',
    titleColor: '#15803D',
    mascot: '/mascot/1_happy_success.png',
  },
  good: {
    bg: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
    border: '2px solid #FDBA74',
    ringColor: '#F59E0B',
    titleColor: '#C2410C',
    mascot: '/mascot/1_happy_success.png',
  },
  retry: {
    bg: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
    border: '2px solid #FCD34D',
    ringColor: '#F59E0B',
    titleColor: '#B45309',
    mascot: '/mascot/2_encouriging_wrong_answer.png',
  },
};

function ScoreRing({ correct, total, color }: { correct: number; total: number; color: string }) {
  const pct = total > 0 ? correct / total : 0;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
      <svg width="120" height="120" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke={color}
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
  const tier = getScoreTier(correctCount, totalCount);
  const config = tierConfig[tier];
  const labels = quizResultLabels[appLanguage] || quizResultLabels.de;

  const title = labels[tier];
  const subtitle = tier === 'perfect' ? labels.perfectSub
    : tier === 'good' ? labels.goodSub
    : labels.retrySub;

  const starEmojis = starsEarned >= 2 ? '⭐⭐' : starsEarned >= 1 ? '⭐' : '';

  return (
    <div
      className="rounded-[20px] p-4 sm:p-6 text-center w-full"
      style={{ background: config.bg, border: config.border }}
    >
      {/* Fablino + Speech */}
      <div className="flex items-center gap-3 mb-4">
        <FablinoMascot src={config.mascot} size="sm" bounce={false} className="flex-shrink-0" />
        <div className="flex-1 rounded-xl px-3 py-2 text-left bg-white border border-gray-200">
          <p className="text-[13px] font-semibold" style={{ color: '#2D1810' }}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* Score ring */}
      <div className="flex justify-center mb-3">
        <ScoreRing correct={correctCount} total={totalCount} color={config.ringColor} />
      </div>

      {/* Title */}
      <h2 className="text-[22px] font-extrabold mb-1" style={{ color: config.titleColor }}>
        {title}
      </h2>

      {/* Stars earned */}
      {starsEarned > 0 && (
        <p className="text-[18px] font-bold mb-3" style={{ color: '#F59E0B' }}>
          {starEmojis} +{starsEarned} {labels.starsLabel}!
        </p>
      )}
      {starsEarned === 0 && (
        <p className="text-[14px] font-medium mb-3" style={{ color: '#92400E' }}>
          {labels.retrySub}
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
              background: i < correctCount ? '#16A34A' : '#FBBF24',
              opacity: 0.8,
            }}
          />
        ))}
      </div>

      {/* Continue button — ALWAYS orange */}
      <button
        onClick={onContinue}
        className="w-full py-3 rounded-xl font-bold text-white text-sm sm:text-[16px] active:scale-95 transition-transform min-h-[48px]"
        style={{ background: 'linear-gradient(135deg, #FF8C42, #FF6B00)' }}
      >
        {labels.continueBtn}
      </button>
    </div>
  );
};

export default QuizCompletionResult;
