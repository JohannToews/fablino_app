// Level name translations for the gamification system
// Keys match LEVELS[].title in useGamification.tsx

export const levelTitleTranslations: Record<string, Record<string, string>> = {
  de: {
    buecherfuchs: "Bücherfuchs",
    geschichtenentdecker: "Geschichtenentdecker",
    leseheld: "Leseheld",
    wortmagier: "Wortmagier",
    fablinoMeister: "Fablino-Meister",
  },
  fr: {
    buecherfuchs: "Renard des livres",
    geschichtenentdecker: "Explorateur d'histoires",
    leseheld: "Héros de lecture",
    wortmagier: "Magicien des mots",
    fablinoMeister: "Maître Fablino",
  },
  en: {
    buecherfuchs: "Book Fox",
    geschichtenentdecker: "Story Explorer",
    leseheld: "Reading Hero",
    wortmagier: "Word Wizard",
    fablinoMeister: "Fablino Master",
  },
  es: {
    buecherfuchs: "Zorro de libros",
    geschichtenentdecker: "Explorador de historias",
    leseheld: "Héroe lector",
    wortmagier: "Mago de palabras",
    fablinoMeister: "Maestro Fablino",
  },
  nl: {
    buecherfuchs: "Boekenvos",
    geschichtenentdecker: "Verhalenontdekker",
    leseheld: "Leesheld",
    wortmagier: "Woordmagiër",
    fablinoMeister: "Fablino-Meester",
  },
  bs: {
    buecherfuchs: "Knjižna lisica",
    geschichtenentdecker: "Istraživač priča",
    leseheld: "Heroj čitanja",
    wortmagier: "Čarobnjak riječi",
    fablinoMeister: "Fablino Majstor",
  },
  it: {
    buecherfuchs: "Volpe dei libri",
    geschichtenentdecker: "Esploratore di storie",
    leseheld: "Eroe della lettura",
    wortmagier: "Mago delle parole",
    fablinoMeister: "Maestro Fablino",
  },
};

// Number-based lookup (legacy, used by existing components)
export const levelTranslations: Record<string, Record<number, string>> = {};
const titleOrder = ['buecherfuchs', 'geschichtenentdecker', 'leseheld', 'wortmagier', 'fablinoMeister'];
for (const lang of Object.keys(levelTitleTranslations)) {
  levelTranslations[lang] = {};
  titleOrder.forEach((key, idx) => {
    levelTranslations[lang][idx + 1] = levelTitleTranslations[lang][key];
  });
}

export const getTranslatedLevelName = (levelNumber: number, language: string): string => {
  const translations = levelTranslations[language] || levelTranslations.de;
  return translations[levelNumber] || levelTranslations.de[levelNumber] || `Level ${levelNumber}`;
};

/** Get translated level title by key (matches LEVELS[].title) */
export const getTranslatedLevelTitle = (titleKey: string, language: string): string => {
  const translations = levelTitleTranslations[language] || levelTitleTranslations.de;
  return translations[titleKey] || levelTitleTranslations.de[titleKey] || titleKey;
};

// ── DB level name translation (match German DB name → translated) ──

const levelNameMap: Record<string, string> = {
  "Bücherfuchs": "buecherfuchs",
  "Geschichtenentdecker": "geschichtenentdecker",
  "Leseheld": "leseheld",
  "Wortmagier": "wortmagier",
  "Fablino-Meister": "fablinoMeister",
};

/** Translate a level name from DB (German) to the target language */
export const translateLevelName = (germanName: string, language: string): string => {
  const key = levelNameMap[germanName];
  if (!key) return germanName;
  const translations = levelTitleTranslations[language] || levelTitleTranslations.de;
  return translations[key] || germanName;
};

// ── Badge name & message translations ──

export const badgeTranslations: Record<string, Record<string, { name: string; message: string }>> = {
  de: {
    "Bronzener Leser": { name: "Bronzener Leser", message: "Dein erstes Abzeichen! Stark!" },
    "Blitzstart": { name: "Blitzstart", message: "Du bist echt schnell dabei!" },
    "Silberner Leser": { name: "Silberner Leser", message: "Silber! Du wirst zum Profi!" },
    "Kristall-Leser": { name: "Kristall-Leser", message: "Ein echter Kristall-Leser!" },
    "Goldener Leser": { name: "Goldener Leser", message: "GOLD! Das schaffen nicht viele!" },
    "Magischer Leser": { name: "Magischer Leser", message: "Deine Lesekraft ist magisch!" },
    "Diamant-Leser": { name: "Diamant-Leser", message: "Diamant! Unzerstörbar!" },
    "Sternensammler": { name: "Sternensammler", message: "200 Sterne leuchten für dich!" },
    "Legenden-Leser": { name: "Legenden-Leser", message: "Du bist eine Legende!" },
    "Flammen-Leser": { name: "Flammen-Leser", message: "3 Stories diese Woche! Du brennst!" },
    "Blitz-Leser": { name: "Blitz-Leser", message: "5 Stories! Blitzschnell!" },
    "Sturm-Leser": { name: "Sturm-Leser", message: "7 Stories! Unaufhaltsam!" },
    "Ketten-Leser": { name: "Ketten-Leser", message: "3 Tage am Stück! Weiter so!" },
    "Feuer-Kette": { name: "Feuer-Kette", message: "Eine Woche am Stück! Feuer!" },
    "Unaufhaltsam": { name: "Unaufhaltsam", message: "14 Tage! Niemand stoppt dich!" },
    "Diamant-Streak": { name: "Diamant-Streak", message: "30 Tage! Diamant-Status!" },
    "Fablinos Freund": { name: "Fablinos Freund", message: "Deine erste Geschichte! Willkommen!" },
    "Perfektionist": { name: "Perfektionist", message: "3x perfekt hintereinander!" },
    "Super-Hirn": { name: "Super-Hirn", message: "10 perfekte Quizze! Genial!" },
    "Bücherwurm": { name: "Bücherwurm", message: "10 Geschichten gelesen!" },
    "Vielleser": { name: "Vielleser", message: "25 Geschichten! Wahnsinn!" },
    "Serien-Fan": { name: "Serien-Fan", message: "Erste Serie komplett!" },
    "Sprach-Entdecker": { name: "Sprach-Entdecker", message: "Stories in 2 Sprachen! Toll!" },
  },
  fr: {
    "Bronzener Leser": { name: "Lecteur bronze", message: "Ton premier badge ! Bravo !" },
    "Blitzstart": { name: "Départ éclair", message: "Tu es vraiment rapide !" },
    "Silberner Leser": { name: "Lecteur argent", message: "Argent ! Tu deviens un pro !" },
    "Kristall-Leser": { name: "Lecteur cristal", message: "Un vrai lecteur cristal !" },
    "Goldener Leser": { name: "Lecteur or", message: "OR ! Peu y arrivent !" },
    "Magischer Leser": { name: "Lecteur magique", message: "Ta force de lecture est magique !" },
    "Diamant-Leser": { name: "Lecteur diamant", message: "Diamant ! Indestructible !" },
    "Sternensammler": { name: "Collectionneur d'étoiles", message: "200 étoiles brillent pour toi !" },
    "Legenden-Leser": { name: "Lecteur légendaire", message: "Tu es une légende !" },
    "Flammen-Leser": { name: "Lecteur en feu", message: "3 histoires cette semaine ! Tu brûles !" },
    "Blitz-Leser": { name: "Lecteur éclair", message: "5 histoires ! Ultra rapide !" },
    "Sturm-Leser": { name: "Lecteur tempête", message: "7 histoires ! Inarrêtable !" },
    "Ketten-Leser": { name: "Lecteur en chaîne", message: "3 jours de suite ! Continue !" },
    "Feuer-Kette": { name: "Chaîne de feu", message: "Une semaine de suite ! En feu !" },
    "Unaufhaltsam": { name: "Inarrêtable", message: "14 jours ! Personne ne t'arrête !" },
    "Diamant-Streak": { name: "Série diamant", message: "30 jours ! Statut diamant !" },
    "Fablinos Freund": { name: "Ami de Fablino", message: "Ta première histoire ! Bienvenue !" },
    "Perfektionist": { name: "Perfectionniste", message: "3x parfait d'affilée !" },
    "Super-Hirn": { name: "Super cerveau", message: "10 quiz parfaits ! Génial !" },
    "Bücherwurm": { name: "Rat de bibliothèque", message: "10 histoires lues !" },
    "Vielleser": { name: "Grand lecteur", message: "25 histoires ! Incroyable !" },
    "Serien-Fan": { name: "Fan de séries", message: "Première série terminée !" },
    "Sprach-Entdecker": { name: "Explorateur de langues", message: "Histoires en 2 langues ! Super !" },
  },
  en: {
    "Bronzener Leser": { name: "Bronze Reader", message: "Your first badge! Awesome!" },
    "Blitzstart": { name: "Quick Start", message: "You're really fast!" },
    "Silberner Leser": { name: "Silver Reader", message: "Silver! You're becoming a pro!" },
    "Kristall-Leser": { name: "Crystal Reader", message: "A true crystal reader!" },
    "Goldener Leser": { name: "Gold Reader", message: "GOLD! Not many achieve this!" },
    "Magischer Leser": { name: "Magic Reader", message: "Your reading power is magical!" },
    "Diamant-Leser": { name: "Diamond Reader", message: "Diamond! Unbreakable!" },
    "Sternensammler": { name: "Star Collector", message: "200 stars shining for you!" },
    "Legenden-Leser": { name: "Legendary Reader", message: "You are a legend!" },
    "Flammen-Leser": { name: "Flame Reader", message: "3 stories this week! On fire!" },
    "Blitz-Leser": { name: "Lightning Reader", message: "5 stories! Lightning fast!" },
    "Sturm-Leser": { name: "Storm Reader", message: "7 stories! Unstoppable!" },
    "Ketten-Leser": { name: "Chain Reader", message: "3 days in a row! Keep going!" },
    "Feuer-Kette": { name: "Fire Chain", message: "A whole week! On fire!" },
    "Unaufhaltsam": { name: "Unstoppable", message: "14 days! Nobody stops you!" },
    "Diamant-Streak": { name: "Diamond Streak", message: "30 days! Diamond status!" },
    "Fablinos Freund": { name: "Fablino's Friend", message: "Your first story! Welcome!" },
    "Perfektionist": { name: "Perfectionist", message: "3x perfect in a row!" },
    "Super-Hirn": { name: "Super Brain", message: "10 perfect quizzes! Brilliant!" },
    "Bücherwurm": { name: "Bookworm", message: "10 stories read!" },
    "Vielleser": { name: "Avid Reader", message: "25 stories! Amazing!" },
    "Serien-Fan": { name: "Series Fan", message: "First series complete!" },
    "Sprach-Entdecker": { name: "Language Explorer", message: "Stories in 2 languages! Great!" },
  },
  es: {
    "Bronzener Leser": { name: "Lector bronce", message: "¡Tu primera insignia! ¡Genial!" },
    "Blitzstart": { name: "Inicio rápido", message: "¡Eres muy rápido!" },
    "Silberner Leser": { name: "Lector plata", message: "¡Plata! ¡Te conviertes en un pro!" },
    "Kristall-Leser": { name: "Lector cristal", message: "¡Un verdadero lector cristal!" },
    "Goldener Leser": { name: "Lector oro", message: "¡ORO! ¡Pocos lo logran!" },
    "Magischer Leser": { name: "Lector mágico", message: "¡Tu poder de lectura es mágico!" },
    "Diamant-Leser": { name: "Lector diamante", message: "¡Diamante! ¡Indestructible!" },
    "Sternensammler": { name: "Coleccionista de estrellas", message: "¡200 estrellas brillan para ti!" },
    "Legenden-Leser": { name: "Lector legendario", message: "¡Eres una leyenda!" },
    "Flammen-Leser": { name: "Lector en llamas", message: "¡3 historias esta semana! ¡Ardiendo!" },
    "Blitz-Leser": { name: "Lector relámpago", message: "¡5 historias! ¡Rapidísimo!" },
    "Sturm-Leser": { name: "Lector tormenta", message: "¡7 historias! ¡Imparable!" },
    "Ketten-Leser": { name: "Lector en cadena", message: "¡3 días seguidos! ¡Sigue así!" },
    "Feuer-Kette": { name: "Cadena de fuego", message: "¡Una semana seguida! ¡En llamas!" },
    "Unaufhaltsam": { name: "Imparable", message: "¡14 días! ¡Nadie te detiene!" },
    "Diamant-Streak": { name: "Racha diamante", message: "¡30 días! ¡Estatus diamante!" },
    "Fablinos Freund": { name: "Amigo de Fablino", message: "¡Tu primera historia! ¡Bienvenido!" },
    "Perfektionist": { name: "Perfeccionista", message: "¡3x perfecto seguido!" },
    "Super-Hirn": { name: "Súper cerebro", message: "¡10 quizzes perfectos! ¡Genial!" },
    "Bücherwurm": { name: "Ratón de biblioteca", message: "¡10 historias leídas!" },
    "Vielleser": { name: "Gran lector", message: "¡25 historias! ¡Increíble!" },
    "Serien-Fan": { name: "Fan de series", message: "¡Primera serie completa!" },
    "Sprach-Entdecker": { name: "Explorador de idiomas", message: "¡Historias en 2 idiomas! ¡Genial!" },
  },
  nl: {
    "Bronzener Leser": { name: "Bronzen lezer", message: "Je eerste badge! Sterk!" },
    "Blitzstart": { name: "Bliksemstart", message: "Je bent echt snel!" },
    "Silberner Leser": { name: "Zilveren lezer", message: "Zilver! Je wordt een pro!" },
    "Kristall-Leser": { name: "Kristallen lezer", message: "Een echte kristallen lezer!" },
    "Goldener Leser": { name: "Gouden lezer", message: "GOUD! Dat lukt niet veel mensen!" },
    "Magischer Leser": { name: "Magische lezer", message: "Je leeskracht is magisch!" },
    "Diamant-Leser": { name: "Diamanten lezer", message: "Diamant! Onverwoestbaar!" },
    "Sternensammler": { name: "Sterrenverzamelaar", message: "200 sterren schijnen voor jou!" },
    "Legenden-Leser": { name: "Legendarische lezer", message: "Je bent een legende!" },
    "Flammen-Leser": { name: "Vlammenlezer", message: "3 verhalen deze week! Je brandt!" },
    "Blitz-Leser": { name: "Bliksemlezer", message: "5 verhalen! Bliksemsnel!" },
    "Sturm-Leser": { name: "Stormlezer", message: "7 verhalen! Niet te stoppen!" },
    "Ketten-Leser": { name: "Kettinglezer", message: "3 dagen achter elkaar! Ga zo door!" },
    "Feuer-Kette": { name: "Vuurketting", message: "Een hele week! In vuur en vlam!" },
    "Unaufhaltsam": { name: "Onstuitbaar", message: "14 dagen! Niemand stopt je!" },
    "Diamant-Streak": { name: "Diamanten reeks", message: "30 dagen! Diamantstatus!" },
    "Fablinos Freund": { name: "Fablino's vriend", message: "Je eerste verhaal! Welkom!" },
    "Perfektionist": { name: "Perfectionist", message: "3x perfect achter elkaar!" },
    "Super-Hirn": { name: "Superbrein", message: "10 perfecte quizzen! Geniaal!" },
    "Bücherwurm": { name: "Boekenwurm", message: "10 verhalen gelezen!" },
    "Vielleser": { name: "Veellezer", message: "25 verhalen! Waanzin!" },
    "Serien-Fan": { name: "Seriefan", message: "Eerste serie compleet!" },
    "Sprach-Entdecker": { name: "Taalontdekker", message: "Verhalen in 2 talen! Geweldig!" },
  },
  it: {
    "Bronzener Leser": { name: "Lettore bronzo", message: "Il tuo primo badge! Forte!" },
    "Blitzstart": { name: "Partenza lampo", message: "Sei davvero veloce!" },
    "Silberner Leser": { name: "Lettore argento", message: "Argento! Stai diventando un pro!" },
    "Kristall-Leser": { name: "Lettore cristallo", message: "Un vero lettore cristallo!" },
    "Goldener Leser": { name: "Lettore oro", message: "ORO! Non tutti ci riescono!" },
    "Magischer Leser": { name: "Lettore magico", message: "La tua forza di lettura è magica!" },
    "Diamant-Leser": { name: "Lettore diamante", message: "Diamante! Indistruttibile!" },
    "Sternensammler": { name: "Collezionista di stelle", message: "200 stelle brillano per te!" },
    "Legenden-Leser": { name: "Lettore leggendario", message: "Sei una leggenda!" },
    "Flammen-Leser": { name: "Lettore in fiamme", message: "3 storie questa settimana! Fuoco!" },
    "Blitz-Leser": { name: "Lettore fulmine", message: "5 storie! Velocissimo!" },
    "Sturm-Leser": { name: "Lettore tempesta", message: "7 storie! Inarrestabile!" },
    "Ketten-Leser": { name: "Lettore a catena", message: "3 giorni di fila! Continua!" },
    "Feuer-Kette": { name: "Catena di fuoco", message: "Una settimana di fila! Fuoco!" },
    "Unaufhaltsam": { name: "Inarrestabile", message: "14 giorni! Nessuno ti ferma!" },
    "Diamant-Streak": { name: "Serie diamante", message: "30 giorni! Status diamante!" },
    "Fablinos Freund": { name: "Amico di Fablino", message: "La tua prima storia! Benvenuto!" },
    "Perfektionist": { name: "Perfezionista", message: "3x perfetto di fila!" },
    "Super-Hirn": { name: "Super cervello", message: "10 quiz perfetti! Geniale!" },
    "Bücherwurm": { name: "Topo di biblioteca", message: "10 storie lette!" },
    "Vielleser": { name: "Grande lettore", message: "25 storie! Incredibile!" },
    "Serien-Fan": { name: "Fan delle serie", message: "Prima serie completata!" },
    "Sprach-Entdecker": { name: "Esploratore di lingue", message: "Storie in 2 lingue! Fantastico!" },
  },
  bs: {
    "Bronzener Leser": { name: "Brončani čitač", message: "Tvoja prva značka! Svaka čast!" },
    "Blitzstart": { name: "Munjeviti start", message: "Zaista si brz/a!" },
    "Silberner Leser": { name: "Srebrni čitač", message: "Srebro! Postaješ profesionalac!" },
    "Kristall-Leser": { name: "Kristalni čitač", message: "Pravi kristalni čitač!" },
    "Goldener Leser": { name: "Zlatni čitač", message: "ZLATO! To ne uspije svako!" },
    "Magischer Leser": { name: "Magični čitač", message: "Tvoja čitalačka snaga je magična!" },
    "Diamant-Leser": { name: "Dijamantski čitač", message: "Dijamant! Neuništiv/a!" },
    "Sternensammler": { name: "Sakupljač zvijezda", message: "200 zvijezda sjaji za tebe!" },
    "Legenden-Leser": { name: "Legendarni čitač", message: "Ti si legenda!" },
    "Flammen-Leser": { name: "Plameni čitač", message: "3 priče ove sedmice! Goriš!" },
    "Blitz-Leser": { name: "Munjeviti čitač", message: "5 priča! Munjevito brz!" },
    "Sturm-Leser": { name: "Olujni čitač", message: "7 priča! Nezaustavljiv/a!" },
    "Ketten-Leser": { name: "Lančani čitač", message: "3 dana zaredom! Nastavi!" },
    "Feuer-Kette": { name: "Vatreni lanac", message: "Cijela sedmica! Vatra!" },
    "Unaufhaltsam": { name: "Nezaustavljiv/a", message: "14 dana! Niko te ne zaustavlja!" },
    "Diamant-Streak": { name: "Dijamantski niz", message: "30 dana! Dijamantski status!" },
    "Fablinos Freund": { name: "Fablinov prijatelj", message: "Tvoja prva priča! Dobrodošao/la!" },
    "Perfektionist": { name: "Perfekcionista", message: "3x savršeno zaredom!" },
    "Super-Hirn": { name: "Super mozak", message: "10 savršenih kvizova! Genijalno!" },
    "Bücherwurm": { name: "Knjigoljubac", message: "10 priča pročitano!" },
    "Vielleser": { name: "Veliki čitač", message: "25 priča! Ludilo!" },
    "Serien-Fan": { name: "Fan serija", message: "Prva serija završena!" },
    "Sprach-Entdecker": { name: "Jezički istraživač", message: "Priče na 2 jezika! Sjajno!" },
  },
};

/** Translate a badge name from DB (German) to the target language */
export const translateBadgeName = (germanName: string, language: string): string => {
  const langBadges = badgeTranslations[language] || badgeTranslations.de;
  return langBadges[germanName]?.name || germanName;
};

/** Translate a badge fablino_message from DB (German) to the target language */
export const translateBadgeMessage = (germanName: string, language: string): string => {
  const langBadges = badgeTranslations[language] || badgeTranslations.de;
  return langBadges[germanName]?.message || "";
};
