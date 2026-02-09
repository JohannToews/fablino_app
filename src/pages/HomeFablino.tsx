import { useNavigate } from "react-router-dom";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";
import { Settings, BarChart3 } from "lucide-react";
import { useMemo, useState, useRef, useEffect } from "react";

// ═══ Speech Bubble ═══
const SpeechBubble = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">
    <div
      className="relative rounded-[20px] px-6 py-4 bg-white text-center animate-speech-bubble"
      style={{
        boxShadow: "0 3px 16px rgba(0,0,0,0.07)",
        animationDelay: "0.1s",
        animationFillMode: "both",
      }}
    >
      <span className="font-nunito text-[19px] font-bold leading-snug" style={{ color: "#2D1810" }}>
        {children}
      </span>
    </div>
    {/* Triangle pointing down-left toward Fablino */}
    <div
      className="absolute -bottom-2.5 left-[30%]"
      style={{
        width: 0, height: 0,
        borderLeft: "12px solid transparent",
        borderRight: "12px solid transparent",
        borderTop: "12px solid white",
      }}
    />
  </div>
);

// ═══ Localized texts ═══
const GREETINGS: Record<string, { withName: (name: string) => string; withoutName: string }> = {
  fr: { withName: (n) => `Bonjour ${n},\nenvie d'une histoire ?`, withoutName: "Bonjour !\nEnvie d'une histoire ?" },
  de: { withName: (n) => `Hallo ${n},\nLust auf eine Geschichte?`, withoutName: "Hallo!\nLust auf eine Geschichte?" },
  en: { withName: (n) => `Hi ${n},\nready for a story?`, withoutName: "Hi!\nReady for a story?" },
  es: { withName: (n) => `¡Hola ${n}!\n¿Quieres un cuento?`, withoutName: "¡Hola!\n¿Quieres un cuento?" },
  nl: { withName: (n) => `Hoi ${n},\nzin in een verhaal?`, withoutName: "Hoi!\nZin in een verhaal?" },
  it: { withName: (n) => `Ciao ${n},\nvoglia di una storia?`, withoutName: "Ciao!\nVoglia di una storia?" },
  bs: { withName: (n) => `Zdravo ${n},\nželiš li priču?`, withoutName: "Zdravo!\nŽeliš li priču?" },
};

const UI_TEXTS: Record<string, { newStory: string; myStories: string; collection: string; stars: string; stories: string; quiz: string; stickers: string }> = {
  fr: { newStory: 'Créer une\nhistoire !', myStories: 'Ta\nbibliothèque', collection: 'Ta collection', stars: 'Étoiles', stories: 'Histoires', quiz: 'Quiz', stickers: 'Voir tous les stickers →' },
  de: { newStory: 'Erstell eine\nneue!', myStories: 'Deine\nBibliothek', collection: 'Deine Sammlung', stars: 'Sterne', stories: 'Geschichten', quiz: 'Quiz', stickers: 'Alle Sticker ansehen →' },
  en: { newStory: 'Create a\nnew one!', myStories: 'Your\nlibrary', collection: 'Your collection', stars: 'Stars', stories: 'Stories', quiz: 'Quiz', stickers: 'See all stickers →' },
  es: { newStory: '¡Crea una\nnueva!', myStories: 'Tu\nbiblioteca', collection: 'Tu colección', stars: 'Estrellas', stories: 'Historias', quiz: 'Quiz', stickers: 'Ver todos los stickers →' },
  nl: { newStory: 'Maak een\nnieuw!', myStories: 'Jouw\nbibliotheek', collection: 'Jouw verzameling', stars: 'Sterren', stories: 'Verhalen', quiz: 'Quiz', stickers: 'Alle stickers bekijken →' },
  it: { newStory: 'Crea una\nnuova!', myStories: 'La tua\nbiblioteca', collection: 'La tua collezione', stars: 'Stelle', stories: 'Storie', quiz: 'Quiz', stickers: 'Vedi tutti gli sticker →' },
  bs: { newStory: 'Napravi\nnovu!', myStories: 'Tvoja\nbiblioteka', collection: 'Tvoja kolekcija', stars: 'Zvjezdice', stories: 'Priče', quiz: 'Kviz', stickers: 'Pogledaj sve stikere →' },
};

const FABLINO_TIPS: Record<string, string[]> = {
  fr: ["Plus tu lis, plus tu gagnes de stickers ! 🌟", "Une histoire par jour fait de toi un pro ! 📚", "Après chaque histoire, il y a un quiz ! 💪"],
  de: ["Je mehr du liest, desto mehr Sticker sammelst du! 🌟", "Jeden Tag eine Geschichte macht dich zum Leseprofi! 📚", "Nach jeder Geschichte gibt es ein Quiz! 💪"],
  en: ["The more you read, the more stickers you collect! 🌟", "A story every day makes you a reading pro! 📚", "After every story there's a quiz! 💪"],
  es: ["¡Cuanto más leas, más stickers coleccionas! 🌟", "¡Una historia al día te hace experto! 📚", "¡Después de cada historia hay un quiz! 💪"],
  nl: ["Hoe meer je leest, hoe meer stickers! 🌟", "Elke dag een verhaal maakt je een expert! 📚", "Na elk verhaal is er een quiz! 💪"],
  it: ["Più leggi, più sticker collezioni! 🌟", "Una storia al giorno ti rende esperto! 📚", "Dopo ogni storia c'è un quiz! 💪"],
  bs: ["Što više čitaš, više stikera skupiš! 🌟", "Priča svaki dan čini te profesionalcem! 📚", "Nakon svake priče dolazi kviz! 💪"],
};

// ═══ Main Component ═══
const HomeFablino = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    kidProfiles, selectedProfile, selectedProfileId,
    setSelectedProfileId, hasMultipleProfiles, kidAppLanguage,
  } = useKidProfile();
  const { state: gamificationState } = useGamification();

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowProfileDropdown(false);
    };
    if (showProfileDropdown) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showProfileDropdown]);

  const lang = kidAppLanguage || 'de';
  const greet = GREETINGS[lang] || GREETINGS['de'];
  const ui = UI_TEXTS[lang] || UI_TEXTS['de'];
  const tips = FABLINO_TIPS[lang] || FABLINO_TIPS['de'];
  const randomTip = useMemo(() => tips[Math.floor(Math.random() * tips.length)], [tips]);

  const kidName = selectedProfile?.name || "";
  const greeting = kidName ? greet.withName(kidName) : greet.withoutName;
  const stars = gamificationState?.stars ?? 0;
  const storiesCompleted = gamificationState?.storiesCompleted ?? 0;
  const quizzesPassed = gamificationState?.quizzesPassed ?? 0;

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center font-nunito overflow-hidden"
      style={{ background: "linear-gradient(160deg, #FFF7ED 0%, #FEF3C7 50%, #EFF6FF 100%)" }}
    >
      <div className="w-full max-w-[600px] px-6 py-4 flex flex-col relative">

        {/* ═══ TOP BAR ═══ */}
        <div className="flex items-center justify-between mb-2">
          {hasMultipleProfiles ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowProfileDropdown(prev => !prev)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-[16px] bg-white/70 backdrop-blur border border-orange-100 hover:bg-orange-50 transition-colors text-[13px] font-bold"
                style={{ color: "#92400E" }}
              >
                {selectedProfile?.name || "Kind"} ▼
              </button>
              {showProfileDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-orange-100 py-1 min-w-[150px] z-20" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                  {kidProfiles.map((p) => (
                    <button key={p.id} onClick={() => { setSelectedProfileId(p.id); setShowProfileDropdown(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-orange-50 transition-colors">
                      <span className="font-nunito text-[13px] font-semibold flex-1" style={{ color: p.id === selectedProfileId ? "#FF8C42" : "#2D1810" }}>{p.name}</span>
                      {p.id === selectedProfileId && <span style={{ color: "#FF8C42" }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : <div />}
          <div className="flex items-center gap-1.5">
            {user?.role === 'admin' && (
              <button onClick={() => navigate("/feedback-stats")} className="p-2 rounded-full bg-white/60 backdrop-blur border border-orange-100 hover:bg-orange-50 transition-colors">
                <BarChart3 className="h-4 w-4 text-orange-400" />
              </button>
            )}
            <button onClick={() => navigate("/admin")} className="p-2 rounded-full bg-white/60 backdrop-blur border border-orange-100 hover:bg-orange-50 transition-colors">
              <Settings className="h-4 w-4 text-orange-400" />
            </button>
          </div>
        </div>

        {/* ═══ HERO: Fablino + Speech Bubble + Buttons ═══ */}
        <div className="flex items-start gap-2 mt-2">
          {/* Fablino — large, left-aligned */}
          <div className="flex-shrink-0 -mr-4 z-10" style={{ animation: "gentleBounce 2.2s ease-in-out infinite" }}>
            <img
              src="/mascot/6_onboarding_vec.svg"
              alt="Fablino"
              className="w-[180px] h-[180px] object-contain drop-shadow-lg"
            />
          </div>

          {/* Right side: speech bubble + action buttons */}
          <div className="flex-1 flex flex-col gap-3 pt-1">
            <SpeechBubble>
              {greeting.split('\n').map((line, i) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </SpeechBubble>

            {/* Two buttons side by side */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/create-story")}
                className="flex-1 py-3.5 px-3 rounded-2xl text-white font-extrabold text-[15px] leading-tight text-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] whitespace-pre-line"
                style={{
                  background: "linear-gradient(135deg, #FF8C42, #FF6B00)",
                  boxShadow: "0 4px 14px rgba(255,107,0,0.25)",
                }}
              >
                {ui.newStory}
              </button>
              <button
                onClick={() => navigate("/stories")}
                className="flex-1 py-3.5 px-3 rounded-2xl font-extrabold text-[15px] leading-tight text-center border-2 transition-all duration-200 hover:bg-orange-50 hover:scale-[1.03] active:scale-[0.97] whitespace-pre-line"
                style={{ background: "white", borderColor: "#FF8C42", color: "#FF8C42" }}
              >
                {ui.myStories}
              </button>
            </div>
          </div>
        </div>

        {/* ═══ COLLECTION CARD ═══ */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-5 mt-5 border border-orange-100" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
          <h3 className="font-extrabold text-[15px] mb-3 text-center" style={{ color: "#92400E" }}>
            {ui.collection}
          </h3>

          <div className="flex justify-around mb-4 text-[13px] font-semibold" style={{ color: "#2D1810" }}>
            <span>⭐ {stars} {ui.stars}</span>
            <span>📖 {storiesCompleted} {ui.stories}</span>
            <span>🎯 {quizzesPassed} {ui.quiz}</span>
          </div>

          <div className="flex justify-center gap-2.5 mb-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center text-[12px] font-bold"
                style={{ background: "#FFF7ED", borderColor: "#D1D5DB", color: "#9CA3AF" }}>
                ?
              </div>
            ))}
          </div>

          <button onClick={() => navigate("/sticker-buch")} className="w-full text-center font-bold text-[12px] hover:underline" style={{ color: "#FF8C42" }}>
            {ui.stickers}
          </button>
        </div>

        {/* ═══ FABLINO TIP ═══ */}
        <div className="flex items-center gap-2.5 mt-4 px-1">
          <img src="/mascot/head_only.png" alt="Fablino" className="w-9 h-9 object-contain flex-shrink-0" />
          <div className="flex-1 bg-orange-50 border border-orange-100 rounded-xl px-4 py-2.5">
            <span className="font-nunito text-[12px] font-semibold" style={{ color: "#2D1810" }}>{randomTip}</span>
          </div>
        </div>
      </div>

      {/* ═══ Keyframes ═══ */}
      <style>{`
        @keyframes gentleBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes speechBubbleIn {
          0% { transform: scale(0.6); opacity: 0; }
          70% { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-speech-bubble {
          animation: speechBubbleIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default HomeFablino;
