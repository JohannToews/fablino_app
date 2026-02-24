import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useResultsPage, LevelInfo, BadgeInfo } from "@/hooks/useResultsPage";
import { translateLevelName, translateBadgeName, translateBadgeMessage } from "@/lib/levelTranslations";
import BackButton from "@/components/BackButton";
import FablinoMascot from "@/components/FablinoMascot";
import SpeechBubble from "@/components/SpeechBubble";

// ── Translations ──

type Lang = string;

const resultsT: Record<string, Record<string, string>> = {
  de: {
    currentLevel: "Aktuelle Stufe",
    highestLevel: "Höchste Stufe",
    starsRemaining: "Noch {n} Sterne bis {emoji} {name}",
    highestReached: "🏆 Du hast die höchste Stufe erreicht!",
    roadmapTitle: "🗺️ Dein Weg zum Meister",
    badgesTitle: "🏷️ Sticker & Badges",
    allCollected: "🎉 Alle Sticker gesammelt!",
    firstStory: "Lies eine Geschichte, um deinen ersten Sticker zu verdienen!",
    // Fablino messages
    welcome: "Willkommen, {name}! Lies deine erste Geschichte! 📖",
    meister: "Wow, {name}! Du bist {level}! 👑",
    streakMsg: "{streak} Tage in Folge, {name}! 🔥 Noch {n} Sterne bis {level}!",
    almostThere: "Fast geschafft, {name}! 🎉 Nur noch {n} Sterne!",
    keepGoing: "Toll gemacht, {name}! Noch {n} Sterne bis {level}. Lies weiter! 🧡",
  },
  fr: {
    currentLevel: "Niveau actuel",
    highestLevel: "Niveau maximum",
    starsRemaining: "Encore {n} étoiles pour {emoji} {name}",
    highestReached: "🏆 Tu as atteint le niveau maximum !",
    roadmapTitle: "🗺️ Ton chemin vers le sommet",
    badgesTitle: "🏷️ Stickers & Badges",
    allCollected: "🎉 Tous les stickers collectionnés !",
    firstStory: "Lis une histoire pour gagner ton premier sticker !",
    welcome: "Bienvenue, {name} ! Lis ta première histoire ! 📖",
    meister: "Wow, {name} ! Tu es {level} ! 👑",
    streakMsg: "{streak} jours d'affilée, {name} ! 🔥 Encore {n} étoiles pour {level} !",
    almostThere: "Presque, {name} ! 🎉 Plus que {n} étoiles !",
    keepGoing: "Bravo, {name} ! Encore {n} étoiles pour {level}. Continue ! 🧡",
  },
  en: {
    currentLevel: "Current Level",
    highestLevel: "Highest Level",
    starsRemaining: "{n} more stars to {emoji} {name}",
    highestReached: "🏆 You reached the highest level!",
    roadmapTitle: "🗺️ Your path to the top",
    badgesTitle: "🏷️ Stickers & Badges",
    allCollected: "🎉 All stickers collected!",
    firstStory: "Read a story to earn your first sticker!",
    welcome: "Welcome, {name}! Read your first story! 📖",
    meister: "Wow, {name}! You are {level}! 👑",
    streakMsg: "{streak} days in a row, {name}! 🔥 {n} more stars to {level}!",
    almostThere: "Almost there, {name}! 🎉 Only {n} more stars!",
    keepGoing: "Well done, {name}! {n} more stars to {level}. Keep reading! 🧡",
  },
  es: {
    currentLevel: "Nivel actual",
    highestLevel: "Nivel máximo",
    starsRemaining: "{n} estrellas más para {emoji} {name}",
    highestReached: "🏆 ¡Has alcanzado el nivel máximo!",
    roadmapTitle: "🗺️ Tu camino a la cima",
    badgesTitle: "🏷️ Stickers & Badges",
    allCollected: "🎉 ¡Todos los stickers recopilados!",
    firstStory: "¡Lee una historia para ganar tu primer sticker!",
    welcome: "¡Bienvenido, {name}! ¡Lee tu primera historia! 📖",
    meister: "¡Wow, {name}! ¡Eres {level}! 👑",
    streakMsg: "¡{streak} días seguidos, {name}! 🔥 ¡{n} estrellas más para {level}!",
    almostThere: "¡Casi, {name}! 🎉 ¡Solo {n} estrellas más!",
    keepGoing: "¡Bien hecho, {name}! {n} estrellas más para {level}. ¡Sigue leyendo! 🧡",
  },
  nl: {
    currentLevel: "Huidig niveau",
    highestLevel: "Hoogste niveau",
    starsRemaining: "Nog {n} sterren tot {emoji} {name}",
    highestReached: "🏆 Je hebt het hoogste niveau bereikt!",
    roadmapTitle: "🗺️ Jouw weg naar de top",
    badgesTitle: "🏷️ Stickers & Badges",
    allCollected: "🎉 Alle stickers verzameld!",
    firstStory: "Lees een verhaal om je eerste sticker te verdienen!",
    welcome: "Welkom, {name}! Lees je eerste verhaal! 📖",
    meister: "Wow, {name}! Je bent {level}! 👑",
    streakMsg: "{streak} dagen op rij, {name}! 🔥 Nog {n} sterren tot {level}!",
    almostThere: "Bijna, {name}! 🎉 Nog maar {n} sterren!",
    keepGoing: "Goed gedaan, {name}! Nog {n} sterren tot {level}. Blijf lezen! 🧡",
  },
  it: {
    currentLevel: "Livello attuale",
    highestLevel: "Livello massimo",
    starsRemaining: "Ancora {n} stelle per {emoji} {name}",
    highestReached: "🏆 Hai raggiunto il livello massimo!",
    roadmapTitle: "🗺️ Il tuo percorso verso la vetta",
    badgesTitle: "🏷️ Sticker & Badge",
    allCollected: "🎉 Tutti gli sticker raccolti!",
    firstStory: "Leggi una storia per guadagnare il tuo primo sticker!",
    welcome: "Benvenuto, {name}! Leggi la tua prima storia! 📖",
    meister: "Wow, {name}! Sei {level}! 👑",
    streakMsg: "{streak} giorni di fila, {name}! 🔥 Ancora {n} stelle per {level}!",
    almostThere: "Quasi, {name}! 🎉 Solo {n} stelle ancora!",
    keepGoing: "Bravo, {name}! Ancora {n} stelle per {level}. Continua a leggere! 🧡",
  },
  bs: {
    currentLevel: "Trenutni nivo",
    highestLevel: "Najviši nivo",
    starsRemaining: "Još {n} zvjezdica do {emoji} {name}",
    highestReached: "🏆 Dostigao/la si najviši nivo!",
    roadmapTitle: "🗺️ Tvoj put do vrha",
    badgesTitle: "🏷️ Naljepnice i bedževi",
    allCollected: "🎉 Sve naljepnice prikupljene!",
    firstStory: "Pročitaj priču da zaradiš svoju prvu naljepnicu!",
    welcome: "Dobrodošao/la, {name}! Pročitaj svoju prvu priču! 📖",
    meister: "Wow, {name}! Ti si {level}! 👑",
    streakMsg: "{streak} dana zaredom, {name}! 🔥 Još {n} zvjezdica do {level}!",
    almostThere: "Skoro, {name}! 🎉 Još samo {n} zvjezdica!",
    keepGoing: "Bravo, {name}! Još {n} zvjezdica do {level}. Nastavi čitati! 🧡",
  },
  tr: {
    currentLevel: "Mevcut seviye",
    highestLevel: "En yüksek seviye",
    starsRemaining: "{emoji} {name} için {n} yıldız daha",
    highestReached: "🏆 En yüksek seviyeye ulaştın!",
    roadmapTitle: "🗺️ Zirveye giden yolun",
    badgesTitle: "🏷️ Çıkartmalar ve Rozetler",
    allCollected: "🎉 Tüm çıkartmalar toplandı!",
    firstStory: "İlk çıkartmanı kazanmak için bir hikaye oku!",
    welcome: "Hoş geldin, {name}! İlk hikayeni oku! 📖",
    meister: "Vay, {name}! Sen {level} oldun! 👑",
    streakMsg: "Üst üste {streak} gün, {name}! 🔥 {level} için {n} yıldız daha!",
    almostThere: "Neredeyse, {name}! 🎉 Sadece {n} yıldız daha!",
    keepGoing: "Harika, {name}! {level} için {n} yıldız daha. Okumaya devam! 🧡",
  },
  bg: {
    currentLevel: "Текущо ниво",
    highestLevel: "Най-високо ниво",
    starsRemaining: "Още {n} звезди до {emoji} {name}",
    highestReached: "🏆 Достигна най-високото ниво!",
    roadmapTitle: "🗺️ Твоят път към върха",
    badgesTitle: "🏷️ Стикери и значки",
    allCollected: "🎉 Всички стикери събрани!",
    firstStory: "Прочети история, за да спечелиш първия си стикер!",
    welcome: "Добре дошъл, {name}! Прочети първата си история! 📖",
    meister: "Уау, {name}! Ти си {level}! 👑",
    streakMsg: "{streak} дни поред, {name}! 🔥 Още {n} звезди до {level}!",
    almostThere: "Почти, {name}! 🎉 Само {n} звезди още!",
    keepGoing: "Браво, {name}! Още {n} звезди до {level}. Продължавай! 🧡",
  },
  ro: {
    currentLevel: "Nivel actual",
    highestLevel: "Nivel maxim",
    starsRemaining: "Încă {n} stele până la {emoji} {name}",
    highestReached: "🏆 Ai atins nivelul maxim!",
    roadmapTitle: "🗺️ Drumul tău spre vârf",
    badgesTitle: "🏷️ Stickere și insigne",
    allCollected: "🎉 Toate stickerele colectate!",
    firstStory: "Citește o poveste pentru a câștiga primul tău sticker!",
    welcome: "Bine ai venit, {name}! Citește prima ta poveste! 📖",
    meister: "Wow, {name}! Ești {level}! 👑",
    streakMsg: "{streak} zile la rând, {name}! 🔥 Încă {n} stele până la {level}!",
    almostThere: "Aproape, {name}! 🎉 Doar {n} stele!",
    keepGoing: "Bravo, {name}! Încă {n} stele până la {level}. Continuă! 🧡",
  },
  pl: {
    currentLevel: "Aktualny poziom",
    highestLevel: "Najwyższy poziom",
    starsRemaining: "Jeszcze {n} gwiazdek do {emoji} {name}",
    highestReached: "🏆 Osiągnąłeś najwyższy poziom!",
    roadmapTitle: "🗺️ Twoja droga na szczyt",
    badgesTitle: "🏷️ Naklejki i odznaki",
    allCollected: "🎉 Wszystkie naklejki zebrane!",
    firstStory: "Przeczytaj historię, aby zdobyć pierwszą naklejkę!",
    welcome: "Witaj, {name}! Przeczytaj swoją pierwszą historię! 📖",
    meister: "Wow, {name}! Jesteś {level}! 👑",
    streakMsg: "{streak} dni z rzędu, {name}! 🔥 Jeszcze {n} gwiazdek do {level}!",
    almostThere: "Prawie, {name}! 🎉 Tylko {n} gwiazdek!",
    keepGoing: "Świetnie, {name}! Jeszcze {n} gwiazdek do {level}. Czytaj dalej! 🧡",
  },
  lt: {
    currentLevel: "Dabartinis lygis",
    highestLevel: "Aukščiausias lygis",
    starsRemaining: "Dar {n} žvaigždučių iki {emoji} {name}",
    highestReached: "🏆 Pasiekei aukščiausią lygį!",
    roadmapTitle: "🗺️ Tavo kelias į viršūnę",
    badgesTitle: "🏷️ Lipdukai ir ženkliukai",
    allCollected: "🎉 Visi lipdukai surinkti!",
    firstStory: "Perskaityk istoriją, kad gautum pirmą lipduką!",
    welcome: "Sveiki, {name}! Perskaityk pirmą istoriją! 📖",
    meister: "Oho, {name}! Tu esi {level}! 👑",
    streakMsg: "{streak} dienos iš eilės, {name}! 🔥 Dar {n} žvaigždučių iki {level}!",
    almostThere: "Beveik, {name}! 🎉 Tik {n} žvaigždučių!",
    keepGoing: "Puiku, {name}! Dar {n} žvaigždučių iki {level}. Skaityk toliau! 🧡",
  },
  hu: {
    currentLevel: "Jelenlegi szint",
    highestLevel: "Legmagasabb szint",
    starsRemaining: "Még {n} csillag a(z) {emoji} {name} eléréséhez",
    highestReached: "🏆 Elérted a legmagasabb szintet!",
    roadmapTitle: "🗺️ Utad a csúcsra",
    badgesTitle: "🏷️ Matricák és jelvények",
    allCollected: "🎉 Minden matrica összegyűjtve!",
    firstStory: "Olvass egy mesét az első matricádért!",
    welcome: "Üdv, {name}! Olvasd el az első mesédet! 📖",
    meister: "Hűha, {name}! Te vagy {level}! 👑",
    streakMsg: "{streak} nap egymás után, {name}! 🔥 Még {n} csillag a(z) {level} eléréséhez!",
    almostThere: "Majdnem, {name}! 🎉 Már csak {n} csillag!",
    keepGoing: "Szuper, {name}! Még {n} csillag a(z) {level} eléréséhez. Olvass tovább! 🧡",
  },
  ca: {
    currentLevel: "Nivell actual",
    highestLevel: "Nivell màxim",
    starsRemaining: "Encara {n} estrelles per {emoji} {name}",
    highestReached: "🏆 Has assolit el nivell màxim!",
    roadmapTitle: "🗺️ El teu camí cap al cim",
    badgesTitle: "🏷️ Adhesius i insígnies",
    allCollected: "🎉 Tots els adhesius recollits!",
    firstStory: "Llegeix una història per guanyar el teu primer adhesiu!",
    welcome: "Benvingut, {name}! Llegeix la teva primera història! 📖",
    meister: "Uau, {name}! Ets {level}! 👑",
    streakMsg: "{streak} dies seguits, {name}! 🔥 Encara {n} estrelles per {level}!",
    almostThere: "Gairebé, {name}! 🎉 Només {n} estrelles més!",
    keepGoing: "Molt bé, {name}! Encara {n} estrelles per {level}. Segueix llegint! 🧡",
  },
  sl: {
    currentLevel: "Trenutna raven",
    highestLevel: "Najvišja raven",
    starsRemaining: "Še {n} zvezdic do {emoji} {name}",
    highestReached: "🏆 Dosegel/a si najvišjo raven!",
    roadmapTitle: "🗺️ Tvoja pot do vrha",
    badgesTitle: "🏷️ Nalepke in značke",
    allCollected: "🎉 Vse nalepke zbrane!",
    firstStory: "Preberi zgodbo, da zaslužiš prvo nalepko!",
    welcome: "Dobrodošel/a, {name}! Preberi svojo prvo zgodbo! 📖",
    meister: "Vau, {name}! Ti si {level}! 👑",
    streakMsg: "{streak} dni zapored, {name}! 🔥 Še {n} zvezdic do {level}!",
    almostThere: "Skoraj, {name}! 🎉 Le še {n} zvezdic!",
    keepGoing: "Odlično, {name}! Še {n} zvezdic do {level}. Beri naprej! 🧡",
  },
  pt: {
    currentLevel: "Nível atual",
    highestLevel: "Nível máximo",
    starsRemaining: "Mais {n} estrelas para {emoji} {name}",
    highestReached: "🏆 Atingiste o nível máximo!",
    roadmapTitle: "🗺️ O teu caminho até ao topo",
    badgesTitle: "🏷️ Autocolantes e crachás",
    allCollected: "🎉 Todos os autocolantes colecionados!",
    firstStory: "Lê uma história para ganhar o teu primeiro autocolante!",
    welcome: "Bem-vindo, {name}! Lê a tua primeira história! 📖",
    meister: "Uau, {name}! Tu és {level}! 👑",
    streakMsg: "{streak} dias seguidos, {name}! 🔥 Mais {n} estrelas para {level}!",
    almostThere: "Quase, {name}! 🎉 Só mais {n} estrelas!",
    keepGoing: "Muito bem, {name}! Mais {n} estrelas para {level}. Continua a ler! 🧡",
  },
  sk: {
    currentLevel: "Aktuálna úroveň",
    highestLevel: "Najvyššia úroveň",
    starsRemaining: "Ešte {n} hviezdičiek do {emoji} {name}",
    highestReached: "🏆 Dosiahol/a si najvyššiu úroveň!",
    roadmapTitle: "🗺️ Tvoja cesta na vrchol",
    badgesTitle: "🏷️ Nálepky a odznaky",
    allCollected: "🎉 Všetky nálepky zozbierané!",
    firstStory: "Prečítaj príbeh a získaj svoju prvú nálepku!",
    welcome: "Vitaj, {name}! Prečítaj si svoj prvý príbeh! 📖",
    meister: "Wow, {name}! Si {level}! 👑",
    streakMsg: "{streak} dní v rade, {name}! 🔥 Ešte {n} hviezdičiek do {level}!",
    almostThere: "Skoro, {name}! 🎉 Len {n} hviezdičiek!",
    keepGoing: "Výborne, {name}! Ešte {n} hviezdičiek do {level}. Čítaj ďalej! 🧡",
  },
};

function getT(lang: Lang) {
  return resultsT[lang] || resultsT.de;
}

// ── Helpers ──

function getLevelProgress(levels: LevelInfo[], totalStars: number) {
  const sorted = [...levels].sort((a, b) => a.sort_order - b.sort_order);
  let current = sorted[0];
  let next: LevelInfo | null = null;
  for (let i = 0; i < sorted.length; i++) {
    if (totalStars >= sorted[i].stars_required) {
      current = sorted[i];
      next = sorted[i + 1] || null;
    }
  }
  return { current, next, sorted };
}

function getFablinoMessage(
  t: Record<string, string>,
  name: string,
  totalStars: number,
  streak: number,
  current: LevelInfo,
  next: LevelInfo | null,
) {
  if (totalStars === 0) {
    return t.welcome.replace("{name}", name);
  }
  if (!next) {
    return t.meister.replace("{name}", name).replace("{level}", `${current.emoji} ${current.name}`);
  }
  const remaining = next.stars_required - totalStars;
  const levelStr = `${next.emoji} ${next.name}`;
  if (streak >= 5) {
    return t.streakMsg.replace("{streak}", String(streak)).replace("{name}", name).replace("{n}", String(remaining)).replace("{level}", levelStr);
  }
  if (remaining <= 10) {
    return t.almostThere.replace("{name}", name).replace("{n}", String(remaining));
  }
  return t.keepGoing.replace("{name}", name).replace("{n}", String(remaining)).replace("{level}", levelStr);
}


// ── Animated Counter Hook ──

function useAnimatedCounter(target: number, duration = 1000, enabled = true) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);
  useEffect(() => {
    if (!enabled) return;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, enabled]);
  return value;
}

// ── Skeleton Loader ──

const SkeletonCard = ({ className = "" }: { className?: string }) => (
  <div className={`bg-white rounded-[20px] p-5 animate-pulse ${className}`} style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
    <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
    <div className="h-8 bg-gray-200 rounded w-2/3 mb-3" />
    <div className="h-3 bg-gray-100 rounded w-full mb-2" />
    <div className="h-3 bg-gray-100 rounded w-4/5" />
  </div>
);

// ── Section 1: Fablino Message ──

const FablinoSection = ({ message, delay }: { message: string; delay: number }) => (
  <div
    className="flex items-center gap-3 px-1"
    style={{ animation: `fadeSlideUp 0.5s ease-out ${delay}s both` }}
  >
    <FablinoMascot src="/mascot/6_Onboarding.png" size="sm" />
    <div className="flex-1 min-w-0">
      <SpeechBubble>{message}</SpeechBubble>
    </div>
  </div>
);

// ── Section 2: Level Card ──

const LevelCard = ({
  current,
  next,
  totalStars,
  delay,
  t,
}: {
  current: LevelInfo;
  next: LevelInfo | null;
  totalStars: number;
  delay: number;
  t: Record<string, string>;
}) => {
  const progressMin = current.stars_required;
  const progressMax = next ? next.stars_required : current.stars_required;
  const targetPct = next
    ? Math.min(100, ((totalStars - progressMin) / (progressMax - progressMin)) * 100)
    : 100;

  const animatedStars = useAnimatedCounter(totalStars, 1200);
  const [barPct, setBarPct] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setBarPct(targetPct), 300);
    return () => clearTimeout(timer);
  }, [targetPct]);

  const isMeister = !next;

  return (
    <div
      className="bg-white rounded-[20px] p-5 relative overflow-hidden"
      style={{
        boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
        animation: `fadeSlideUp 0.5s ease-out ${delay}s both`,
      }}
    >
      <div className="absolute inset-0 opacity-[0.07] rounded-[20px]" style={{ background: current.color }} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-1">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: current.color }}>
              {isMeister ? t.highestLevel : t.currentLevel}
            </span>
            <h2 className="font-fredoka text-[24px] font-bold leading-tight" style={{ color: "#2D1810" }}>
              {current.emoji} {current.name}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <span className="text-[15px]">⭐</span>
            <span className="font-bold text-[15px]" style={{ color: "#2D1810" }}>{animatedStars}</span>
          </div>
        </div>

        {!isMeister ? (
          <div className="mt-4">
            <div className="flex justify-between text-[11px] font-semibold mb-1.5" style={{ color: "#888" }}>
              <span>{current.emoji} {current.stars_required}⭐</span>
              {next && <span>{next.emoji} {next.stars_required}⭐</span>}
            </div>
            <div className="relative h-[14px] bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${barPct}%`,
                  background: next
                    ? `linear-gradient(90deg, ${current.color}, ${next.color})`
                    : current.color,
                  transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                  animation: "shimmer 2.5s infinite",
                }}
              />
            </div>
            {next && (
              <p className="text-center text-[12px] font-medium mt-2" style={{ color: "#888" }}>
                {t.starsRemaining.replace("{n}", String(next.stars_required - totalStars)).replace("{emoji}", next.emoji).replace("{name}", next.name)}
              </p>
            )}
          </div>
        ) : (
          <p className="text-center text-[13px] font-semibold mt-3" style={{ color: current.color }}>
            {t.highestReached}
          </p>
        )}
      </div>
    </div>
  );
};

// ── Section 3: Level Roadmap ──

const LevelRoadmap = ({
  levels,
  totalStars,
  delay,
  t,
}: {
  levels: LevelInfo[];
  totalStars: number;
  delay: number;
  t: Record<string, string>;
}) => {
  const sorted = [...levels].sort((a, b) => a.sort_order - b.sort_order);
  const currentIdx = sorted.reduce((acc, l, i) => (totalStars >= l.stars_required ? i : acc), 0);

  return (
    <div
      className="bg-white rounded-[20px] p-5"
      style={{
        boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
        animation: `fadeSlideUp 0.5s ease-out ${delay}s both`,
      }}
    >
      <h3 className="font-fredoka text-[17px] font-bold mb-4" style={{ color: "#2D1810" }}>
        {t.roadmapTitle}
      </h3>

      <div className="overflow-x-auto pb-2 -mx-1">
        <div className="flex items-center gap-0 min-w-max px-1">
          {sorted.map((level, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isFuture = idx > currentIdx;
            const isLast = idx === sorted.length - 1;

            return (
              <div
                key={level.id}
                className="flex items-center"
                style={{ animation: `fadeSlideUp 0.4s ease-out ${delay + 0.1 * idx}s both` }}
              >
                <div className="flex flex-col items-center" style={{ width: 64 }}>
                  <div
                    className="relative flex items-center justify-center rounded-full transition-all"
                    style={{
                      width: isCurrent ? 52 : 42,
                      height: isCurrent ? 52 : 42,
                      background: isFuture ? "#F3F4F6" : level.color,
                      border: isFuture ? "2px dashed #D1D5DB" : `3px solid ${level.color}`,
                      boxShadow: isCurrent ? `0 0 0 4px ${level.color}33` : "none",
                      animation: isCurrent ? "pulse-ring 2s infinite" : "none",
                    }}
                  >
                    <span className="text-[20px]" style={{ opacity: isFuture ? 0.35 : 1 }}>
                      {level.emoji}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-bold mt-1.5 text-center leading-tight"
                    style={{ color: isFuture ? "#aaa" : "#2D1810", maxWidth: 60 }}
                  >
                    {level.name}
                  </span>
                  <span className="text-[9px] font-medium" style={{ color: isFuture ? "#ccc" : "#888" }}>
                    {level.stars_required}⭐
                  </span>
                </div>

                {!isLast && (
                  <div className="relative w-8 h-[3px] mx-0.5" style={{ background: "#E5E7EB" }}>
                    <div
                      className="absolute inset-y-0 left-0 transition-all duration-500"
                      style={{
                        width: isCompleted ? "100%" : isCurrent ? "50%" : "0%",
                        background: sorted[idx].color,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Hint Text Templates (multi-language) ──

const hintTemplates: Record<string, Record<string, string>> = {
  de: {
    total_stars: "Sammle {value} Sterne",
    weekly_stories: "Lies {value} Stories in einer Woche",
    streak_days: "Lies {value} Tage in Folge",
    total_stories_read: "Lies {value} Stories",
    consecutive_perfect_quiz: "Schaffe {value} perfekte Quizze hintereinander",
    total_perfect_quiz: "Schaffe {value} perfekte Quizze",
    series_completed: "Schließe eine Serie ab",
    languages_read: "Lies Stories in {value} Sprachen",
    generic: "Weiter so — bald geschafft!",
  },
  fr: {
    total_stars: "Collecte {value} étoiles",
    weekly_stories: "Lis {value} histoires en une semaine",
    streak_days: "Lis {value} jours de suite",
    total_stories_read: "Lis {value} histoires",
    consecutive_perfect_quiz: "Réussis {value} quiz parfaits d'affilée",
    total_perfect_quiz: "Réussis {value} quiz parfaits",
    series_completed: "Termine une série",
    languages_read: "Lis des histoires dans {value} langues",
    generic: "Continue comme ça !",
  },
  en: {
    total_stars: "Collect {value} stars",
    weekly_stories: "Read {value} stories in one week",
    streak_days: "Read {value} days in a row",
    total_stories_read: "Read {value} stories",
    consecutive_perfect_quiz: "Get {value} perfect quizzes in a row",
    total_perfect_quiz: "Get {value} perfect quizzes",
    series_completed: "Complete a series",
    languages_read: "Read stories in {value} languages",
    generic: "Keep going — almost there!",
  },
  es: {
    total_stars: "Recopila {value} estrellas",
    weekly_stories: "Lee {value} historias en una semana",
    streak_days: "Lee {value} días seguidos",
    total_stories_read: "Lee {value} historias",
    consecutive_perfect_quiz: "Consigue {value} quizzes perfectos seguidos",
    total_perfect_quiz: "Consigue {value} quizzes perfectos",
    series_completed: "Completa una serie",
    languages_read: "Lee historias en {value} idiomas",
    generic: "¡Sigue así!",
  },
  nl: {
    total_stars: "Verzamel {value} sterren",
    weekly_stories: "Lees {value} verhalen in een week",
    streak_days: "Lees {value} dagen achter elkaar",
    total_stories_read: "Lees {value} verhalen",
    consecutive_perfect_quiz: "Haal {value} perfecte quizzen op rij",
    total_perfect_quiz: "Haal {value} perfecte quizzen",
    series_completed: "Voltooi een serie",
    languages_read: "Lees verhalen in {value} talen",
    generic: "Ga zo door!",
  },
  it: {
    total_stars: "Raccogli {value} stelle",
    weekly_stories: "Leggi {value} storie in una settimana",
    streak_days: "Leggi {value} giorni di fila",
    total_stories_read: "Leggi {value} storie",
    consecutive_perfect_quiz: "Fai {value} quiz perfetti di fila",
    total_perfect_quiz: "Fai {value} quiz perfetti",
    series_completed: "Completa una serie",
    languages_read: "Leggi storie in {value} lingue",
    generic: "Continua così!",
  },
  bs: {
    total_stars: "Sakupi {value} zvjezdica",
    weekly_stories: "Pročitaj {value} priča u jednoj sedmici",
    streak_days: "Čitaj {value} dana zaredom",
    total_stories_read: "Pročitaj {value} priča",
    consecutive_perfect_quiz: "Ostvari {value} savršenih kvizova zaredom",
    total_perfect_quiz: "Ostvari {value} savršenih kvizova",
    series_completed: "Završi seriju",
    languages_read: "Čitaj priče na {value} jezika",
    generic: "Nastavi tako!",
  },
  tr: {
    total_stars: "{value} yıldız topla",
    weekly_stories: "Bir haftada {value} hikaye oku",
    streak_days: "Üst üste {value} gün oku",
    total_stories_read: "{value} hikaye oku",
    consecutive_perfect_quiz: "Üst üste {value} mükemmel quiz yap",
    total_perfect_quiz: "{value} mükemmel quiz yap",
    series_completed: "Bir seriyi tamamla",
    languages_read: "{value} dilde hikaye oku",
    generic: "Böyle devam!",
  },
  bg: {
    total_stars: "Събери {value} звезди",
    weekly_stories: "Прочети {value} истории за седмица",
    streak_days: "Чети {value} дни поред",
    total_stories_read: "Прочети {value} истории",
    consecutive_perfect_quiz: "Направи {value} перфектни куиза поред",
    total_perfect_quiz: "Направи {value} перфектни куиза",
    series_completed: "Завърши серия",
    languages_read: "Чети истории на {value} езика",
    generic: "Продължавай така!",
  },
  ro: {
    total_stars: "Colectează {value} stele",
    weekly_stories: "Citește {value} povești într-o săptămână",
    streak_days: "Citește {value} zile la rând",
    total_stories_read: "Citește {value} povești",
    consecutive_perfect_quiz: "Obține {value} quizuri perfecte la rând",
    total_perfect_quiz: "Obține {value} quizuri perfecte",
    series_completed: "Finalizează o serie",
    languages_read: "Citește povești în {value} limbi",
    generic: "Continuă!",
  },
  pl: {
    total_stars: "Zbierz {value} gwiazdek",
    weekly_stories: "Przeczytaj {value} historii w jednym tygodniu",
    streak_days: "Czytaj {value} dni z rzędu",
    total_stories_read: "Przeczytaj {value} historii",
    consecutive_perfect_quiz: "Zdobądź {value} perfekcyjnych quizów z rzędu",
    total_perfect_quiz: "Zdobądź {value} perfekcyjnych quizów",
    series_completed: "Ukończ serię",
    languages_read: "Czytaj historie w {value} językach",
    generic: "Tak trzymaj!",
  },
  lt: {
    total_stars: "Surink {value} žvaigždučių",
    weekly_stories: "Perskaityk {value} istorijų per savaitę",
    streak_days: "Skaityk {value} dienas iš eilės",
    total_stories_read: "Perskaityk {value} istorijų",
    consecutive_perfect_quiz: "Atlik {value} tobulų viktorinų iš eilės",
    total_perfect_quiz: "Atlik {value} tobulų viktorinų",
    series_completed: "Užbaik seriją",
    languages_read: "Skaityk istorijas {value} kalbomis",
    generic: "Taip ir toliau!",
  },
  hu: {
    total_stars: "Gyűjts {value} csillagot",
    weekly_stories: "Olvass {value} mesét egy héten belül",
    streak_days: "Olvass {value} napig egymás után",
    total_stories_read: "Olvass el {value} mesét",
    consecutive_perfect_quiz: "Érj el {value} tökéletes kvízt egymás után",
    total_perfect_quiz: "Érj el {value} tökéletes kvízt",
    series_completed: "Fejezz be egy sorozatot",
    languages_read: "Olvass meséket {value} nyelven",
    generic: "Így tovább!",
  },
  ca: {
    total_stars: "Recull {value} estrelles",
    weekly_stories: "Llegeix {value} històries en una setmana",
    streak_days: "Llegeix {value} dies seguits",
    total_stories_read: "Llegeix {value} històries",
    consecutive_perfect_quiz: "Aconsegueix {value} qüestionaris perfectes seguits",
    total_perfect_quiz: "Aconsegueix {value} qüestionaris perfectes",
    series_completed: "Completa una sèrie",
    languages_read: "Llegeix històries en {value} idiomes",
    generic: "Segueix així!",
  },
  sl: {
    total_stars: "Zberi {value} zvezdic",
    weekly_stories: "Preberi {value} zgodb v enem tednu",
    streak_days: "Beri {value} dni zapored",
    total_stories_read: "Preberi {value} zgodb",
    consecutive_perfect_quiz: "Doseži {value} popolnih kvizov zapored",
    total_perfect_quiz: "Doseži {value} popolnih kvizov",
    series_completed: "Zaključi serijo",
    languages_read: "Beri zgodbe v {value} jezikih",
    generic: "Tako naprej!",
  },
  pt: {
    total_stars: "Recolhe {value} estrelas",
    weekly_stories: "Lê {value} histórias numa semana",
    streak_days: "Lê {value} dias seguidos",
    total_stories_read: "Lê {value} histórias",
    consecutive_perfect_quiz: "Faz {value} quizzes perfeitos seguidos",
    total_perfect_quiz: "Faz {value} quizzes perfeitos",
    series_completed: "Completa uma série",
    languages_read: "Lê histórias em {value} línguas",
    generic: "Continua!",
  },
  sk: {
    total_stars: "Zozbieraj {value} hviezdičiek",
    weekly_stories: "Prečítaj {value} príbehov za týždeň",
    streak_days: "Čítaj {value} dní v rade",
    total_stories_read: "Prečítaj {value} príbehov",
    consecutive_perfect_quiz: "Dosiahni {value} perfektných kvízov v rade",
    total_perfect_quiz: "Dosiahni {value} perfektných kvízov",
    series_completed: "Dokonči sériu",
    languages_read: "Čítaj príbehy v {value} jazykoch",
    generic: "Tak ďalej!",
  },
};

function getConditionHint(conditionType: string, conditionValue: number, lang: string): string {
  const templates = hintTemplates[lang] || hintTemplates.de;
  const template = templates[conditionType] || templates.generic;
  return template.replace("{value}", String(conditionValue));
}

// ── Category config ──

const BADGE_CATEGORIES = [
  { key: "milestone", emoji: "⭐", de: "Meilensteine", fr: "Étapes", en: "Milestones", es: "Hitos", nl: "Mijlpalen", it: "Traguardi", bs: "Prekretnice", tr: "Kilometre Taşları", bg: "Етапи", ro: "Etape", pl: "Kamienie milowe", lt: "Etapai", hu: "Mérföldkövek", ca: "Fites", sl: "Mejniki", pt: "Marcos", sk: "Míľniky" },
  { key: "weekly",    emoji: "🔥", de: "Wochen-Badges", fr: "Badges semaine", en: "Weekly Badges", es: "Badges semanales", nl: "Week-badges", it: "Badge settimanali", bs: "Sedmični bedževi", tr: "Haftalık Rozetler", bg: "Седмични значки", ro: "Insigne săptămânale", pl: "Tygodniowe odznaki", lt: "Savaitiniai ženkliukai", hu: "Heti jelvények", ca: "Insígnies setmanals", sl: "Tedenske značke", pt: "Crachás semanais", sk: "Týždenné odznaky" },
  { key: "streak",    emoji: "🔗", de: "Serien-Badges", fr: "Badges série", en: "Streak Badges", es: "Badges de racha", nl: "Reeks-badges", it: "Badge serie", bs: "Bedževi serija", tr: "Seri Rozetleri", bg: "Серийни значки", ro: "Insigne serie", pl: "Odznaki serii", lt: "Serijos ženkliukai", hu: "Sorozat jelvények", ca: "Insígnies de sèrie", sl: "Serijske značke", pt: "Crachás de série", sk: "Odznaky série" },
  { key: "special",   emoji: "🎯", de: "Spezial-Badges", fr: "Badges spéciaux", en: "Special Badges", es: "Badges especiales", nl: "Speciale badges", it: "Badge speciali", bs: "Posebni bedževi", tr: "Özel Rozetler", bg: "Специални значки", ro: "Insigne speciale", pl: "Specjalne odznaki", lt: "Specialūs ženkliukai", hu: "Különleges jelvények", ca: "Insígnies especials", sl: "Posebne značke", pt: "Crachás especiais", sk: "Špeciálne odznaky" },
];

const BADGE_CATEGORY_STYLES: Record<string, { bg: string; border: string; headerBg: string }> = {
  milestone: { bg: "#FFF7ED", border: "#FDBA74", headerBg: "linear-gradient(135deg, #FFF7ED, #FEF3C7)" },
  weekly:    { bg: "#FEF2F2", border: "#FCA5A5", headerBg: "linear-gradient(135deg, #FEF2F2, #FFE4E6)" },
  streak:    { bg: "#F5F3FF", border: "#C4B5FD", headerBg: "linear-gradient(135deg, #F5F3FF, #EDE9FE)" },
  special:   { bg: "#F0F9FF", border: "#93C5FD", headerBg: "linear-gradient(135deg, #F0F9FF, #DBEAFE)" },
};

// ── Badge Detail Modal ──

const BadgeDetailModal = ({
  badge,
  lang,
  currentProgress,
  onClose,
}: {
  badge: BadgeInfo;
  lang: string;
  currentProgress: number;
  onClose: () => void;
}) => {
  const isEarned = badge.earned;
  const frameColor = badge.frame_color || "#F97316";
  const style = BADGE_CATEGORY_STYLES[badge.category] || BADGE_CATEGORY_STYLES.milestone;
  const catInfo = BADGE_CATEGORIES.find(c => c.key === badge.category);
  const catLabel = catInfo ? (catInfo as any)[lang] || catInfo.de : "";

  const progressPct = badge.condition_value > 0
    ? Math.min(100, (currentProgress / badge.condition_value) * 100)
    : 0;

  const dateStr = badge.earned_at
    ? new Date(badge.earned_at).toLocaleDateString(lang === "de" ? "de-DE" : lang === "fr" ? "fr-FR" : lang === "en" ? "en-US" : lang === "es" ? "es-ES" : lang === "nl" ? "nl-NL" : lang === "it" ? "it-IT" : "de-DE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div
      className="fixed inset-0 z-[998] flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[20px] max-w-[300px] w-full p-5 text-center relative"
        style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Category pill */}
        <div className="flex justify-center mb-2">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full text-white"
            style={{ background: style.border }}
          >
            {catLabel}
          </span>
        </div>

        {/* Emoji with ring */}
        <div
          className="mx-auto mb-3 flex items-center justify-center"
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: isEarned ? `4px solid ${frameColor}` : "3px dashed #D1D5DB",
            background: isEarned ? "white" : "#F9FAFB",
            boxShadow: isEarned ? `0 0 16px ${frameColor}33` : "none",
          }}
        >
          <span style={{ fontSize: 44, lineHeight: 1, filter: isEarned ? "none" : "grayscale(1) opacity(0.3)" }}>
            {isEarned ? badge.emoji : "?"}
          </span>
        </div>

        {/* Name */}
        <h3 className="font-fredoka text-[18px] font-bold mb-1" style={{ color: "#2D1810" }}>
          {badge.name}
        </h3>

        {/* Description */}
        {badge.fablino_message && isEarned && (
          <p className="text-[13px] font-medium mb-2" style={{ color: "#92400E" }}>
            {badge.fablino_message}
          </p>
        )}

        {/* Condition hint for unearned */}
        {!isEarned && (
          <div className="mb-3">
            <p className="text-[13px] font-semibold mb-2" style={{ color: "#6B7280" }}>
              {getConditionHint(badge.condition_type, badge.condition_value, lang)}
            </p>
            {badge.condition_value > 0 && (
              <div className="relative h-[8px] bg-gray-100 rounded-full overflow-hidden mx-4">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${progressPct}%`,
                    background: `linear-gradient(90deg, ${style.border}, ${frameColor || style.border})`,
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            )}
            <p className="text-[11px] font-medium mt-1" style={{ color: "#aaa" }}>
              {currentProgress} / {badge.condition_value}
            </p>
          </div>
        )}

        {/* Earned info */}
        {isEarned && (
          <div className="mb-3 space-y-1">
            {dateStr && (
              <p className="text-[12px] font-medium" style={{ color: "#aaa" }}>
                {dateStr}
              </p>
            )}
            {badge.times_earned > 1 && (
              <p className="text-[13px] font-bold" style={{ color: frameColor }}>
                {badge.times_earned}x {({ de: "geschafft", fr: "obtenu", en: "earned", es: "ganado", nl: "behaald", it: "ottenuto", bs: "ostvareno", tr: "kazanıldı", bg: "спечелено", ro: "obținut", pl: "zdobyto", lt: "pasiekta", hu: "elérve", ca: "aconseguit", sl: "doseženo", pt: "obtido", sk: "dosiahnuté" } as Record<string, string>)[lang] || "geschafft"}!
              </p>
            )}
            {badge.bonus_stars > 0 && (
              <p className="text-[13px] font-bold" style={{ color: "#F59E0B" }}>
                +{badge.bonus_stars} ⭐
              </p>
            )}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-bold text-white text-[14px] mt-1"
          style={{ background: isEarned ? `linear-gradient(135deg, ${frameColor}, ${style.border})` : "#D1D5DB" }}
        >
          OK
        </button>
      </div>
    </div>
  );
};

// ── Section 4: Badges ──

const BadgesSection = ({
  badges,
  totalStars,
  totalStoriesRead,
  currentStreak,
  totalPerfectQuizzes,
  newBadgeIds,
  delay,
  t,
  lang,
}: {
  badges: BadgeInfo[];
  totalStars: number;
  totalStoriesRead: number;
  currentStreak: number;
  totalPerfectQuizzes: number;
  newBadgeIds: Set<string>;
  delay: number;
  t: Record<string, string>;
  lang: string;
}) => {
  const [selectedBadge, setSelectedBadge] = useState<BadgeInfo | null>(null);

  const earnedCount = badges.filter(b => b.earned).length;
  const totalCount = badges.length;
  const allEarned = earnedCount === totalCount && totalCount > 0;

  const getProgress = (badge: BadgeInfo): number => {
    switch (badge.condition_type) {
      case "total_stars": return totalStars;
      case "total_stories_read": return totalStoriesRead;
      case "streak_days": return currentStreak;
      case "total_perfect_quiz": return totalPerfectQuizzes;
      case "consecutive_perfect_quiz": return totalPerfectQuizzes;
      case "weekly_stories": return 0; // no live weekly progress here
      default: return 0;
    }
  };

  // Group badges by category
  const groupedBadges = BADGE_CATEGORIES.map((cat) => ({
    ...cat,
    badges: badges.filter((b) => b.category === cat.key).sort((a, b) => a.sort_order - b.sort_order),
  })).filter((g) => g.badges.length > 0);

  return (
    <div
      className="bg-white rounded-[20px] p-5"
      style={{
        boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
        animation: `fadeSlideUp 0.5s ease-out ${delay}s both`,
      }}
    >
      {/* Header + Counter */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-fredoka text-[17px] font-bold" style={{ color: "#2D1810" }}>
          {t.badgesTitle}
        </h3>
        <span className="text-[13px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#FFF7ED", color: "#92400E" }}>
          {earnedCount} / {totalCount}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-[6px] bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: totalCount > 0 ? `${(earnedCount / totalCount) * 100}%` : "0%",
            background: "linear-gradient(90deg, #F97316, #FBBF24)",
            transition: "width 0.8s ease",
          }}
        />
      </div>

      {allEarned && (
        <div className="text-center py-3 mb-4 rounded-xl" style={{ background: "linear-gradient(135deg, #FEF3C7, #FFF7ED)" }}>
          <p className="text-[15px] font-bold" style={{ color: "#92400E" }}>{t.allCollected}</p>
        </div>
      )}

      {/* Category sections */}
      {groupedBadges.map((group, gi) => {
        const catStyle = BADGE_CATEGORY_STYLES[group.key] || BADGE_CATEGORY_STYLES.milestone;
        const catLabel = (group as any)[lang] || group.de;

        return (
          <div key={group.key} className="mb-4 last:mb-0">
            {/* Category header */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg mb-2.5"
              style={{ background: catStyle.headerBg }}
            >
              <span className="text-[14px]">{group.emoji}</span>
              <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: catStyle.border }}>
                {catLabel}
              </span>
              <span className="text-[11px] font-medium ml-auto" style={{ color: catStyle.border }}>
                {group.badges.filter(b => b.earned).length}/{group.badges.length}
              </span>
            </div>

            {/* Badge grid: 3 mobile, 4 tablet */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2.5">
              {group.badges.map((badge) => {
                const isNew = newBadgeIds.has(badge.id);
                const frameColor = badge.frame_color || catStyle.border;

                if (badge.earned) {
                  return (
                    <button
                      key={badge.id}
                      onClick={() => setSelectedBadge(badge)}
                      className="relative flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all hover:shadow-md active:scale-95"
                      style={{
                        background: catStyle.bg,
                        borderColor: frameColor,
                        borderWidth: 2,
                        animation: isNew ? "newBadgeGlow 1.5s ease-in-out infinite" : undefined,
                      }}
                    >
                      {/* "Neu" badge */}
                      {isNew && (
                        <div className="absolute -top-2 -left-1 bg-yellow-400 text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full shadow-sm z-10">
                          {({ de: "Neu", fr: "Nouveau", en: "New", es: "Nuevo", nl: "Nieuw", it: "Nuovo", bs: "Novo", tr: "Yeni", bg: "Ново", ro: "Nou", pl: "Nowy", lt: "Nauja", hu: "Új", ca: "Nou", sl: "Novo", pt: "Novo", sk: "Nové" } as Record<string, string>)[lang] || "Neu"}
                        </div>
                      )}
                      {/* times_earned */}
                      {badge.times_earned > 1 && (
                        <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-orange-500 border-2 border-white flex items-center justify-center z-10">
                          <span className="text-[9px] font-bold text-white">{badge.times_earned}x</span>
                        </div>
                      )}
                      <span className="text-[28px] leading-none">{badge.emoji}</span>
                      <span className="text-[10px] font-bold text-center leading-tight" style={{ color: "#2D1810" }}>
                        {badge.name}
                      </span>
                    </button>
                  );
                }

                // Unearned badge
                return (
                  <button
                    key={badge.id}
                    onClick={() => setSelectedBadge(badge)}
                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-dashed transition-all hover:shadow-sm active:scale-95"
                    style={{ borderColor: "#D1D5DB", background: "#FAFAFA" }}
                  >
                    <span className="text-[24px] leading-none" style={{ filter: "grayscale(1)", opacity: 0.25 }}>
                      {badge.emoji}
                    </span>
                    <span className="text-[9px] font-medium text-center leading-tight" style={{ color: "#aaa" }}>
                      {getConditionHint(badge.condition_type, badge.condition_value, lang)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {badges.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-4">{t.firstStory}</p>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          lang={lang}
          currentProgress={getProgress(selectedBadge)}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
};

// ── Main Page ──

const ResultsPage = () => {
  const navigate = useNavigate();
  const { selectedProfileId, kidAppLanguage } = useKidProfile();
  const { data, loading } = useResultsPage(selectedProfileId);
  const t = getT(kidAppLanguage);
  const [newBadgeIds, setNewBadgeIds] = useState<Set<string>>(new Set());

  // Load is_new badge IDs separately (not in RPC)
  useEffect(() => {
    if (!selectedProfileId || !data) return;
    const loadNewBadges = async () => {
      try {
        const { data: newRows } = await supabase
          .from("user_badges")
          .select("badge_id")
          .eq("child_id", selectedProfileId)
          .eq("is_new", true);
        if (newRows && newRows.length > 0) {
          setNewBadgeIds(new Set(newRows.map((r: any) => r.badge_id)));
        }
      } catch {
        // Silent fail
      }
    };
    loadNewBadges();
  }, [selectedProfileId, data]);

  // Clear is_new after 2 seconds of viewing
  useEffect(() => {
    if (!selectedProfileId || newBadgeIds.size === 0) return;
    const timer = setTimeout(async () => {
      try {
        await supabase
          .from("user_badges")
          .update({ is_new: false })
          .eq("child_id", selectedProfileId)
          .eq("is_new", true);
        setNewBadgeIds(new Set());
      } catch {
        // Silent fail
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [selectedProfileId, newBadgeIds]);

  // Translate levels and badges to app language
  const translatedLevels = useMemo(() => 
    (data?.levels || []).map(l => ({ ...l, name: translateLevelName(l.name, kidAppLanguage) })),
    [data?.levels, kidAppLanguage]
  );
  const translatedBadges = useMemo(() =>
    (data?.badges || []).map(b => ({
      ...b,
      name: translateBadgeName(b.name, kidAppLanguage),
      fablino_message: translateBadgeMessage(b.name, kidAppLanguage) || b.fablino_message,
    })),
    [data?.badges, kidAppLanguage]
  );

  if (loading || !data) {
    return (
      <div className="min-h-screen pb-safe">
        <div className="max-w-lg mx-auto px-4 space-y-4 pt-3">
          <div className="flex items-center gap-3 px-1">
            <BackButton to="/" />
          </div>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard className="h-[120px]" />
          <SkeletonCard className="h-[200px]" />
        </div>
      </div>
    );
  }

  const { current, next, sorted } = getLevelProgress(translatedLevels, data.total_stars);
  const fablinoMsg = getFablinoMessage(t, data.child_name, data.total_stars, data.current_streak, current, next);

  return (
    <div
      className="min-h-screen pb-safe"
    >
      <div className="max-w-lg mx-auto px-4 space-y-4 pt-3 pb-8">
        {/* Nav + Fablino in one row */}
        <div
          className="flex items-center gap-3 px-1"
          style={{ animation: `fadeSlideUp 0.5s ease-out 0s both` }}
        >
          <BackButton to="/" />
          <FablinoMascot src="/mascot/6_Onboarding.png" size="sm" />
          <div className="flex-1 min-w-0">
            <SpeechBubble>{fablinoMsg}</SpeechBubble>
          </div>
        </div>
        <LevelCard current={current} next={next} totalStars={data.total_stars} delay={0.1} t={t} />
        <LevelRoadmap levels={sorted} totalStars={data.total_stars} delay={0.2} t={t} />
        <BadgesSection
          badges={translatedBadges}
          totalStars={data.total_stars}
          totalStoriesRead={data.total_stories_read}
          currentStreak={data.current_streak}
          totalPerfectQuizzes={data.total_perfect_quizzes}
          newBadgeIds={newBadgeIds}
          delay={0.3}
          t={t}
          lang={kidAppLanguage}
        />
      </div>
    </div>
  );
};

export default ResultsPage;
