import { Language } from "@/lib/translations";

export type CharacterType = 
  | "me" 
  | "family" 
  | "siblings" 
  | "friends" 
  | "famous" 
  | "surprise";

export type FamilyMember = "mama" | "papa" | "oma" | "opa" | "other";

export type SiblingGender = "brother" | "sister";

export type SpecialAttribute = 
  | "superpowers" 
  | "magic" 
  | "heroes_villains" 
  | "transformations" 
  | "talents" 
  | "normal";

export type LocationType = 
  | "deepsea" 
  | "mountains" 
  | "space" 
  | "magic" 
  | "nature" 
  | "home" 
  | "surprise";

export type TimePeriod = 
  | "dinosaurs" 
  | "stoneage" 
  | "egypt" 
  | "pirates" 
  | "medieval" 
  | "wildwest" 
  | "vintage" 
  | "today" 
  | "nearfuture" 
  | "farfuture";

export interface SettingSelectionTranslations {
  header: string;
  locationHeader: string;
  timeHeader: string;
  deepsea: string;
  mountains: string;
  space: string;
  magicWorlds: string;
  nature: string;
  home: string;
  surprise: string;
  dinosaurs: string;
  stoneage: string;
  egypt: string;
  pirates: string;
  medieval: string;
  wildwest: string;
  vintage: string;
  today: string;
  nearfuture: string;
  farfuture: string;
  continue: string;
  back: string;
  maxLocations: string;
}

export const settingSelectionTranslations: Record<Language, SettingSelectionTranslations> = {
  de: {
    header: "Welt & Setting",
    locationHeader: "Wo findet die Geschichte statt?",
    timeHeader: "In welcher Zeit spielt die Geschichte?",
    deepsea: "Tiefsee & Meer",
    mountains: "In den Bergen",
    space: "Weltraum & Planeten",
    magicWorlds: "Magische Welten",
    nature: "Dschungel",
    home: "Alltag & Schule",
    surprise: "Überrasch mich",
    dinosaurs: "Dinosaurier",
    stoneage: "Steinzeit",
    egypt: "Ägypten",
    pirates: "Piraten",
    medieval: "Mittelalter",
    wildwest: "Wilder Westen",
    vintage: "1930er-50er",
    today: "Heute",
    nearfuture: "Nahe Zukunft",
    farfuture: "Ferne Zukunft",
    continue: "Weiter",
    back: "Zurück",
    maxLocations: "Max. 3 Orte",
  },
  fr: {
    header: "Monde & Cadre",
    locationHeader: "Où se déroule l'histoire?",
    timeHeader: "À quelle époque se passe l'histoire?",
    deepsea: "Océan profond",
    mountains: "Montagnes",
    space: "Espace & Planètes",
    magicWorlds: "Mondes magiques",
    nature: "Jungle",
    home: "Quotidien & École",
    surprise: "Surprends-moi",
    dinosaurs: "Dinosaures",
    stoneage: "Âge de pierre",
    egypt: "Égypte",
    pirates: "Pirates",
    medieval: "Moyen Âge",
    wildwest: "Far West",
    vintage: "Années 30-50",
    today: "Aujourd'hui",
    nearfuture: "Futur proche",
    farfuture: "Futur lointain",
    continue: "Continuer",
    back: "Retour",
    maxLocations: "Max. 3 lieux",
  },
  en: {
    header: "World & Setting",
    locationHeader: "Where does the story take place?",
    timeHeader: "When does the story take place?",
    deepsea: "Deep Sea & Ocean",
    mountains: "In the Mountains",
    space: "Space & Planets",
    magicWorlds: "Magical Worlds",
    nature: "Jungle",
    home: "Everyday & School",
    surprise: "Surprise Me",
    dinosaurs: "Dinosaurs",
    stoneage: "Stone Age",
    egypt: "Egypt",
    pirates: "Pirates",
    medieval: "Medieval",
    wildwest: "Wild West",
    vintage: "1930s-50s",
    today: "Today",
    nearfuture: "Near Future",
    farfuture: "Far Future",
    continue: "Continue",
    back: "Back",
    maxLocations: "Max. 3 locations",
  },
  es: {
    header: "Mundo & Escenario",
    locationHeader: "¿Dónde ocurre la historia?",
    timeHeader: "¿En qué época ocurre la historia?",
    deepsea: "Mar profundo",
    mountains: "Montañas",
    space: "Espacio & Planetas",
    magicWorlds: "Mundos mágicos",
    nature: "Selva",
    home: "Vida diaria & Escuela",
    surprise: "Sorpréndeme",
    dinosaurs: "Dinosaurios",
    stoneage: "Edad de Piedra",
    egypt: "Egipto",
    pirates: "Piratas",
    medieval: "Medieval",
    wildwest: "Salvaje Oeste",
    vintage: "Años 30-50",
    today: "Hoy",
    nearfuture: "Futuro cercano",
    farfuture: "Futuro lejano",
    continue: "Continuar",
    back: "Volver",
    maxLocations: "Máx. 3 lugares",
  },
  nl: {
    header: "Wereld & Setting",
    locationHeader: "Waar speelt het verhaal zich af?",
    timeHeader: "In welke tijd speelt het verhaal?",
    deepsea: "Diepzee & Oceaan",
    mountains: "Bergen",
    space: "Ruimte & Planeten",
    magicWorlds: "Magische werelden",
    nature: "Jungle",
    home: "Dagelijks & School",
    surprise: "Verras me",
    dinosaurs: "Dinosaurussen",
    stoneage: "Steentijd",
    egypt: "Egypte",
    pirates: "Piraten",
    medieval: "Middeleeuwen",
    wildwest: "Wilde Westen",
    vintage: "Jaren 30-50",
    today: "Vandaag",
    nearfuture: "Nabije toekomst",
    farfuture: "Verre toekomst",
    continue: "Verder",
    back: "Terug",
    maxLocations: "Max. 3 locaties",
  },
  it: {
    header: "Mondo & Ambientazione",
    locationHeader: "Dove si svolge la storia?",
    timeHeader: "In quale epoca si svolge la storia?",
    deepsea: "Mare profondo",
    mountains: "Montagne",
    space: "Spazio & Pianeti",
    magicWorlds: "Mondi magici",
    nature: "Giungla",
    home: "Quotidiano & Scuola",
    surprise: "Sorprendimi",
    dinosaurs: "Dinosauri",
    stoneage: "Età della pietra",
    egypt: "Egitto",
    pirates: "Pirati",
    medieval: "Medioevo",
    wildwest: "Selvaggio West",
    vintage: "Anni 30-50",
    today: "Oggi",
    nearfuture: "Futuro prossimo",
    farfuture: "Futuro lontano",
    continue: "Continua",
    back: "Indietro",
    maxLocations: "Max. 3 luoghi",
  },
  bs: {
    header: "Svijet & Okruženje",
    locationHeader: "Gdje se priča odvija?",
    timeHeader: "U koje doba se priča odvija?",
    deepsea: "Duboko more",
    mountains: "Planine",
    space: "Svemir & Planeti",
    magicWorlds: "Magični svjetovi",
    nature: "Džungla",
    home: "Svakodnevica & Škola",
    surprise: "Iznenadi me",
    dinosaurs: "Dinosaurusi",
    stoneage: "Kameno doba",
    egypt: "Egipat",
    pirates: "Pirati",
    medieval: "Srednji vijek",
    wildwest: "Divlji zapad",
    vintage: "Godine 30-50",
    today: "Danas",
    nearfuture: "Bliska budućnost",
    farfuture: "Daleka budućnost",
    continue: "Nastavi",
    back: "Nazad",
    maxLocations: "Maks. 3 lokacije",
  },
};

// Main story categories
export type StoryType = 
  | "fantasy"      // Märchen & Fantasie
  | "action"       // Abenteuer & Action
  | "animals"      // Tiergeschichten
  | "everyday"     // Alltag & Gefühle
  | "humor"        // Humor & Chaos
  | "educational"; // Wissen & Entdecken

// Sub-elements for each category
export type StorySubElement = 
  // Fantasy
  | "witches" | "fairies" | "wizards" | "dragons" | "royalty" | "magic_objects" | "talking_animals"
  // Action
  | "pirates" | "ninjas" | "detectives" | "superheroes" | "explorers" | "treasure_hunts" | "knights" | "space_travel"
  // Animals
  | "pets" | "wild_animals" | "farm_animals" | "animal_friends" | "humanized_animals" | "animal_communities"
  // Everyday
  | "family" | "school" | "friendship" | "conflict_resolution" | "emotions" | "first_experiences"
  // Humor
  | "silly_stories" | "absurd_characters" | "mishaps" | "cheeky_kids" | "crazy_animals" | "wordplay";

export const getCategorySubElements = (category: StoryType): StorySubElement[] => {
  switch (category) {
    case "fantasy":
      return ["witches", "fairies", "wizards", "dragons", "royalty", "magic_objects", "talking_animals"];
    case "action":
      return ["pirates", "ninjas", "detectives", "superheroes", "explorers", "treasure_hunts", "knights", "space_travel"];
    case "animals":
      return ["pets", "wild_animals", "farm_animals", "animal_friends", "humanized_animals", "animal_communities"];
    case "everyday":
      return ["family", "school", "friendship", "conflict_resolution", "emotions", "first_experiences"];
    case "humor":
      return ["silly_stories", "absurd_characters", "mishaps", "cheeky_kids", "crazy_animals", "wordplay"];
    default:
      return [];
  }
};

export type EducationalTopic = 
  | "nature" 
  | "monuments" 
  | "countries" 
  | "science" 
  | "other";

export type StoryLength = "short" | "medium" | "long";
export type StoryDifficulty = "easy" | "medium" | "hard";

export interface StoryTypeSelectionTranslations {
  header: string;
  // Story settings (length, difficulty, series)
  settingsHeader: string;
  lengthLabel: string;
  lengthShort: string;
  lengthMedium: string;
  lengthLong: string;
  difficultyLabel: string;
  difficultyEasy: string;
  difficultyMedium: string;
  difficultyHard: string;
  seriesLabel: string;
  seriesYes: string;
  seriesNo: string;
  // Main categories
  fantasy: string;
  action: string;
  animals: string;
  everyday: string;
  humor: string;
  educational: string;
  surprise: string;
  // Sub-element selection
  subElementHeader: string;
  subElementHint: string;
  selectedElements: string;
  // Fantasy sub-elements
  subElement_witches: string;
  subElement_fairies: string;
  subElement_wizards: string;
  subElement_dragons: string;
  subElement_royalty: string;
  subElement_magic_objects: string;
  subElement_talking_animals: string;
  // Action sub-elements
  subElement_pirates: string;
  subElement_ninjas: string;
  subElement_detectives: string;
  subElement_superheroes: string;
  subElement_explorers: string;
  subElement_treasure_hunts: string;
  subElement_knights: string;
  subElement_space_travel: string;
  // Animals sub-elements
  subElement_pets: string;
  subElement_wild_animals: string;
  subElement_farm_animals: string;
  subElement_animal_friends: string;
  subElement_humanized_animals: string;
  subElement_animal_communities: string;
  // Everyday sub-elements
  subElement_family: string;
  subElement_school: string;
  subElement_friendship: string;
  subElement_conflict_resolution: string;
  subElement_emotions: string;
  subElement_first_experiences: string;
  // Humor sub-elements
  subElement_silly_stories: string;
  subElement_absurd_characters: string;
  subElement_mishaps: string;
  subElement_cheeky_kids: string;
  subElement_crazy_animals: string;
  subElement_wordplay: string;
  // Humor slider
  humorSliderTitle: string;
  humorLow: string;
  humorMid: string;
  humorHigh: string;
  continue: string;
  back: string;
  // Educational topics
  educationalTopicHeader: string;
  natureAnimals: string;
  monumentsHistory: string;
  countriesCities: string;
  science: string;
  other: string;
  specifyTopic: string;
  placeholderNature: string;
  placeholderMonuments: string;
  placeholderCountries: string;
  placeholderScience: string;
  placeholderOther: string;
}

export const storyTypeSelectionTranslations: Record<Language, StoryTypeSelectionTranslations> = {
  de: {
    header: "Was für eine Geschichte möchtest du?",
    settingsHeader: "Einstellungen",
    lengthLabel: "Länge",
    lengthShort: "Kurz",
    lengthMedium: "Mittel",
    lengthLong: "Lang",
    difficultyLabel: "Schwierigkeit",
    difficultyEasy: "Leicht",
    difficultyMedium: "Mittel",
    difficultyHard: "Schwer",
    seriesLabel: "Serie",
    seriesYes: "Ja",
    seriesNo: "Nein",
    // Main categories
    fantasy: "Märchen & Fantasie",
    action: "Abenteuer & Action",
    animals: "Tiergeschichten",
    everyday: "Alltag & Gefühle",
    humor: "Humor & Chaos",
    educational: "Wissen & Entdecken",
    surprise: "Überrasch mich",
    // Sub-element selection
    subElementHeader: "Wähle Elemente",
    subElementHint: "Wähle bis zu 3 Elemente (optional)",
    selectedElements: "Ausgewählt",
    // Fantasy
    subElement_witches: "🧙‍♀️ Hexen",
    subElement_fairies: "🧚 Feen",
    subElement_wizards: "🧙 Zauberer",
    subElement_dragons: "🐉 Drachen",
    subElement_royalty: "👑 Prinzen & Prinzessinnen",
    subElement_magic_objects: "✨ Magische Gegenstände",
    subElement_talking_animals: "🗣️ Sprechende Tiere",
    // Action
    subElement_pirates: "🏴‍☠️ Piraten",
    subElement_ninjas: "🥷 Ninjas",
    subElement_detectives: "🔍 Detektive",
    subElement_superheroes: "🦸 Superhelden",
    subElement_explorers: "🧭 Entdecker",
    subElement_treasure_hunts: "💎 Schatzsuchen",
    subElement_knights: "⚔️ Ritter",
    subElement_space_travel: "🚀 Weltraumabenteuer",
    // Animals
    subElement_pets: "🐕 Haustiere",
    subElement_wild_animals: "🦁 Wildtiere",
    subElement_farm_animals: "🐄 Bauernhoftiere",
    subElement_animal_friends: "🐾 Tierfreunde",
    subElement_humanized_animals: "🐻 Vermenschlichte Tiere",
    subElement_animal_communities: "🐝 Tiergemeinschaften",
    // Everyday
    subElement_family: "👨‍👩‍👧 Familie",
    subElement_school: "🏫 Schule",
    subElement_friendship: "🤝 Freundschaft",
    subElement_conflict_resolution: "🤗 Streit & Versöhnung",
    subElement_emotions: "💖 Gefühle",
    subElement_first_experiences: "🌟 Erste Erfahrungen",
    // Humor
    subElement_silly_stories: "🤪 Quatschgeschichten",
    subElement_absurd_characters: "👽 Absurde Figuren",
    subElement_mishaps: "💥 Missgeschicke",
    subElement_cheeky_kids: "😜 Freche Kinder",
    subElement_crazy_animals: "🦊 Verrückte Tiere",
    subElement_wordplay: "📝 Sprachwitz",
    // Humor slider
    humorSliderTitle: "Wie lustig soll es sein?",
    humorLow: "Normal lustig",
    humorMid: "Richtig lustig",
    humorHigh: "Total verrückt",
    continue: "Weiter",
    back: "Zurück",
    // Educational topics
    educationalTopicHeader: "Was möchtest du lernen?",
    natureAnimals: "Natur & Tiere",
    monumentsHistory: "Monumente & Geschichte",
    countriesCities: "Länder & Städte",
    science: "Wissenschaft",
    other: "Anderes Thema",
    specifyTopic: "Was genau interessiert dich?",
    placeholderNature: "z.B. Dinosaurier, Delfine, Regenwald...",
    placeholderMonuments: "z.B. Pyramiden, Eiffelturm, Kolosseum...",
    placeholderCountries: "z.B. Japan, Brasilien, Australien...",
    placeholderScience: "z.B. Planeten, Vulkane, Roboter...",
    placeholderOther: "z.B. Musik, Sport, Kochen...",
  },
  fr: {
    header: "Quel type d'histoire veux-tu?",
    settingsHeader: "Paramètres",
    lengthLabel: "Longueur",
    lengthShort: "Court",
    lengthMedium: "Moyen",
    lengthLong: "Long",
    difficultyLabel: "Difficulté",
    difficultyEasy: "Facile",
    difficultyMedium: "Moyen",
    difficultyHard: "Difficile",
    seriesLabel: "Série",
    seriesYes: "Oui",
    seriesNo: "Non",
    fantasy: "Contes & Fantaisie",
    action: "Aventure & Action",
    animals: "Histoires d'animaux",
    everyday: "Quotidien & Émotions",
    humor: "Humour & Chaos",
    educational: "Savoir & Découvrir",
    surprise: "Surprends-moi",
    subElementHeader: "Choisis des éléments",
    subElementHint: "Choisis jusqu'à 3 éléments (optionnel)",
    selectedElements: "Sélectionnés",
    subElement_witches: "🧙‍♀️ Sorcières",
    subElement_fairies: "🧚 Fées",
    subElement_wizards: "🧙 Magiciens",
    subElement_dragons: "🐉 Dragons",
    subElement_royalty: "👑 Princes & Princesses",
    subElement_magic_objects: "✨ Objets magiques",
    subElement_talking_animals: "🗣️ Animaux parlants",
    subElement_pirates: "🏴‍☠️ Pirates",
    subElement_ninjas: "🥷 Ninjas",
    subElement_detectives: "🔍 Détectives",
    subElement_superheroes: "🦸 Super-héros",
    subElement_explorers: "🧭 Explorateurs",
    subElement_treasure_hunts: "💎 Chasses au trésor",
    subElement_knights: "⚔️ Chevaliers",
    subElement_space_travel: "🚀 Aventures spatiales",
    subElement_pets: "🐕 Animaux domestiques",
    subElement_wild_animals: "🦁 Animaux sauvages",
    subElement_farm_animals: "🐄 Animaux de ferme",
    subElement_animal_friends: "🐾 Amis animaux",
    subElement_humanized_animals: "🐻 Animaux humanisés",
    subElement_animal_communities: "🐝 Communautés animales",
    subElement_family: "👨‍👩‍👧 Famille",
    subElement_school: "🏫 École",
    subElement_friendship: "🤝 Amitié",
    subElement_conflict_resolution: "🤗 Conflits & Réconciliation",
    subElement_emotions: "💖 Émotions",
    subElement_first_experiences: "🌟 Premières expériences",
    subElement_silly_stories: "🤪 Histoires absurdes",
    subElement_absurd_characters: "👽 Personnages absurdes",
    subElement_mishaps: "💥 Mésaventures",
    subElement_cheeky_kids: "😜 Enfants espiègles",
    subElement_crazy_animals: "🦊 Animaux fous",
    subElement_wordplay: "📝 Jeux de mots",
    humorSliderTitle: "À quel point drôle?",
    humorLow: "Normalement drôle",
    humorMid: "Très drôle",
    humorHigh: "Totalement fou",
    continue: "Continuer",
    back: "Retour",
    educationalTopicHeader: "Que veux-tu apprendre?",
    natureAnimals: "Nature & Animaux",
    monumentsHistory: "Monuments & Histoire",
    countriesCities: "Pays & Villes",
    science: "Science",
    other: "Autre sujet",
    specifyTopic: "Qu'est-ce qui t'intéresse exactement?",
    placeholderNature: "ex. Dinosaures, Dauphins, Forêt tropicale...",
    placeholderMonuments: "ex. Pyramides, Tour Eiffel, Colisée...",
    placeholderCountries: "ex. Japon, Brésil, Australie...",
    placeholderScience: "ex. Planètes, Volcans, Robots...",
    placeholderOther: "ex. Musique, Sport, Cuisine...",
  },
  en: {
    header: "What kind of story do you want?",
    settingsHeader: "Settings",
    lengthLabel: "Length",
    lengthShort: "Short",
    lengthMedium: "Medium",
    lengthLong: "Long",
    difficultyLabel: "Difficulty",
    difficultyEasy: "Easy",
    difficultyMedium: "Medium",
    difficultyHard: "Hard",
    seriesLabel: "Series",
    seriesYes: "Yes",
    seriesNo: "No",
    fantasy: "Fairy Tales & Fantasy",
    action: "Adventure & Action",
    animals: "Animal Stories",
    everyday: "Everyday & Feelings",
    humor: "Humor & Chaos",
    educational: "Learn & Discover",
    surprise: "Surprise me",
    subElementHeader: "Choose elements",
    subElementHint: "Choose up to 3 elements (optional)",
    selectedElements: "Selected",
    subElement_witches: "🧙‍♀️ Witches",
    subElement_fairies: "🧚 Fairies",
    subElement_wizards: "🧙 Wizards",
    subElement_dragons: "🐉 Dragons",
    subElement_royalty: "👑 Princes & Princesses",
    subElement_magic_objects: "✨ Magic Objects",
    subElement_talking_animals: "🗣️ Talking Animals",
    subElement_pirates: "🏴‍☠️ Pirates",
    subElement_ninjas: "🥷 Ninjas",
    subElement_detectives: "🔍 Detectives",
    subElement_superheroes: "🦸 Superheroes",
    subElement_explorers: "🧭 Explorers",
    subElement_treasure_hunts: "💎 Treasure Hunts",
    subElement_knights: "⚔️ Knights",
    subElement_space_travel: "🚀 Space Adventures",
    subElement_pets: "🐕 Pets",
    subElement_wild_animals: "🦁 Wild Animals",
    subElement_farm_animals: "🐄 Farm Animals",
    subElement_animal_friends: "🐾 Animal Friends",
    subElement_humanized_animals: "🐻 Humanized Animals",
    subElement_animal_communities: "🐝 Animal Communities",
    subElement_family: "👨‍👩‍👧 Family",
    subElement_school: "🏫 School",
    subElement_friendship: "🤝 Friendship",
    subElement_conflict_resolution: "🤗 Conflict & Resolution",
    subElement_emotions: "💖 Emotions",
    subElement_first_experiences: "🌟 First Experiences",
    subElement_silly_stories: "🤪 Silly Stories",
    subElement_absurd_characters: "👽 Absurd Characters",
    subElement_mishaps: "💥 Mishaps",
    subElement_cheeky_kids: "😜 Cheeky Kids",
    subElement_crazy_animals: "🦊 Crazy Animals",
    subElement_wordplay: "📝 Wordplay",
    humorSliderTitle: "How funny should it be?",
    humorLow: "Normally funny",
    humorMid: "Really funny",
    humorHigh: "Totally crazy",
    continue: "Continue",
    back: "Back",
    educationalTopicHeader: "What do you want to learn?",
    natureAnimals: "Nature & Animals",
    monumentsHistory: "Monuments & History",
    countriesCities: "Countries & Cities",
    science: "Science",
    other: "Other topic",
    specifyTopic: "What exactly interests you?",
    placeholderNature: "e.g. Dinosaurs, Dolphins, Rainforest...",
    placeholderMonuments: "e.g. Pyramids, Eiffel Tower, Colosseum...",
    placeholderCountries: "e.g. Japan, Brazil, Australia...",
    placeholderScience: "e.g. Planets, Volcanoes, Robots...",
    placeholderOther: "e.g. Music, Sports, Cooking...",
  },
  es: {
    header: "¿Qué tipo de historia quieres?",
    settingsHeader: "Configuración",
    lengthLabel: "Longitud",
    lengthShort: "Corto",
    lengthMedium: "Medio",
    lengthLong: "Largo",
    difficultyLabel: "Dificultad",
    difficultyEasy: "Fácil",
    difficultyMedium: "Medio",
    difficultyHard: "Difícil",
    seriesLabel: "Serie",
    seriesYes: "Sí",
    seriesNo: "No",
    fantasy: "Cuentos & Fantasía",
    action: "Aventura & Acción",
    animals: "Historias de animales",
    everyday: "Cotidiano & Emociones",
    humor: "Humor & Caos",
    educational: "Saber & Descubrir",
    surprise: "Sorpréndeme",
    subElementHeader: "Elige elementos",
    subElementHint: "Elige hasta 3 elementos (opcional)",
    selectedElements: "Seleccionados",
    subElement_witches: "🧙‍♀️ Brujas",
    subElement_fairies: "🧚 Hadas",
    subElement_wizards: "🧙 Magos",
    subElement_dragons: "🐉 Dragones",
    subElement_royalty: "👑 Príncipes & Princesas",
    subElement_magic_objects: "✨ Objetos mágicos",
    subElement_talking_animals: "🗣️ Animales parlantes",
    subElement_pirates: "🏴‍☠️ Piratas",
    subElement_ninjas: "🥷 Ninjas",
    subElement_detectives: "🔍 Detectives",
    subElement_superheroes: "🦸 Superhéroes",
    subElement_explorers: "🧭 Exploradores",
    subElement_treasure_hunts: "💎 Búsqueda del tesoro",
    subElement_knights: "⚔️ Caballeros",
    subElement_space_travel: "🚀 Aventuras espaciales",
    subElement_pets: "🐕 Mascotas",
    subElement_wild_animals: "🦁 Animales salvajes",
    subElement_farm_animals: "🐄 Animales de granja",
    subElement_animal_friends: "🐾 Amigos animales",
    subElement_humanized_animals: "🐻 Animales humanizados",
    subElement_animal_communities: "🐝 Comunidades animales",
    subElement_family: "👨‍👩‍👧 Familia",
    subElement_school: "🏫 Escuela",
    subElement_friendship: "🤝 Amistad",
    subElement_conflict_resolution: "🤗 Conflictos & Reconciliación",
    subElement_emotions: "💖 Emociones",
    subElement_first_experiences: "🌟 Primeras experiencias",
    subElement_silly_stories: "🤪 Historias tontas",
    subElement_absurd_characters: "👽 Personajes absurdos",
    subElement_mishaps: "💥 Percances",
    subElement_cheeky_kids: "😜 Niños traviesos",
    subElement_crazy_animals: "🦊 Animales locos",
    subElement_wordplay: "📝 Juegos de palabras",
    humorSliderTitle: "¿Qué tan gracioso?",
    humorLow: "Normalmente gracioso",
    humorMid: "Muy gracioso",
    humorHigh: "Totalmente loco",
    continue: "Continuar",
    back: "Volver",
    educationalTopicHeader: "¿Qué quieres aprender?",
    natureAnimals: "Naturaleza & Animales",
    monumentsHistory: "Monumentos & Historia",
    countriesCities: "Países & Ciudades",
    science: "Ciencia",
    other: "Otro tema",
    specifyTopic: "¿Qué te interesa exactamente?",
    placeholderNature: "ej. Dinosaurios, Delfines, Selva...",
    placeholderMonuments: "ej. Pirámides, Torre Eiffel, Coliseo...",
    placeholderCountries: "ej. Japón, Brasil, Australia...",
    placeholderScience: "ej. Planetas, Volcanes, Robots...",
    placeholderOther: "ej. Música, Deporte, Cocina...",
  },
  nl: {
    header: "Wat voor verhaal wil je?",
    settingsHeader: "Instellingen",
    lengthLabel: "Lengte",
    lengthShort: "Kort",
    lengthMedium: "Gemiddeld",
    lengthLong: "Lang",
    difficultyLabel: "Moeilijkheid",
    difficultyEasy: "Makkelijk",
    difficultyMedium: "Gemiddeld",
    difficultyHard: "Moeilijk",
    seriesLabel: "Serie",
    seriesYes: "Ja",
    seriesNo: "Nee",
    fantasy: "Sprookjes & Fantasie",
    action: "Avontuur & Actie",
    animals: "Dierenverhalen",
    everyday: "Dagelijks & Gevoelens",
    humor: "Humor & Chaos",
    educational: "Leren & Ontdekken",
    surprise: "Verras me",
    subElementHeader: "Kies elementen",
    subElementHint: "Kies maximaal 3 elementen (optioneel)",
    selectedElements: "Geselecteerd",
    subElement_witches: "🧙‍♀️ Heksen",
    subElement_fairies: "🧚 Feeën",
    subElement_wizards: "🧙 Tovenaars",
    subElement_dragons: "🐉 Draken",
    subElement_royalty: "👑 Prinsen & Prinsessen",
    subElement_magic_objects: "✨ Magische voorwerpen",
    subElement_talking_animals: "🗣️ Sprekende dieren",
    subElement_pirates: "🏴‍☠️ Piraten",
    subElement_ninjas: "🥷 Ninja's",
    subElement_detectives: "🔍 Detectives",
    subElement_superheroes: "🦸 Superhelden",
    subElement_explorers: "🧭 Ontdekkers",
    subElement_treasure_hunts: "💎 Schattenjachten",
    subElement_knights: "⚔️ Ridders",
    subElement_space_travel: "🚀 Ruimteavonturen",
    subElement_pets: "🐕 Huisdieren",
    subElement_wild_animals: "🦁 Wilde dieren",
    subElement_farm_animals: "🐄 Boerderijdieren",
    subElement_animal_friends: "🐾 Dierenvrienden",
    subElement_humanized_animals: "🐻 Vermenselijkte dieren",
    subElement_animal_communities: "🐝 Dierengemeenschappen",
    subElement_family: "👨‍👩‍👧 Familie",
    subElement_school: "🏫 School",
    subElement_friendship: "🤝 Vriendschap",
    subElement_conflict_resolution: "🤗 Conflicten & Verzoening",
    subElement_emotions: "💖 Emoties",
    subElement_first_experiences: "🌟 Eerste ervaringen",
    subElement_silly_stories: "🤪 Gekke verhalen",
    subElement_absurd_characters: "👽 Absurde figuren",
    subElement_mishaps: "💥 Ongelukjes",
    subElement_cheeky_kids: "😜 Brutale kinderen",
    subElement_crazy_animals: "🦊 Gekke dieren",
    subElement_wordplay: "📝 Woordspelingen",
    humorSliderTitle: "Hoe grappig moet het zijn?",
    humorLow: "Normaal grappig",
    humorMid: "Echt grappig",
    humorHigh: "Totaal gek",
    continue: "Verder",
    back: "Terug",
    educationalTopicHeader: "Wat wil je leren?",
    natureAnimals: "Natuur & Dieren",
    monumentsHistory: "Monumenten & Geschiedenis",
    countriesCities: "Landen & Steden",
    science: "Wetenschap",
    other: "Ander onderwerp",
    specifyTopic: "Wat interesseert je precies?",
    placeholderNature: "bijv. Dinosaurussen, Dolfijnen, Regenwoud...",
    placeholderMonuments: "bijv. Piramides, Eiffeltoren, Colosseum...",
    placeholderCountries: "bijv. Japan, Brazilië, Australië...",
    placeholderScience: "bijv. Planeten, Vulkanen, Robots...",
    placeholderOther: "bijv. Muziek, Sport, Koken...",
  },
  it: {
    header: "Che tipo di storia vuoi?",
    settingsHeader: "Impostazioni",
    lengthLabel: "Lunghezza",
    lengthShort: "Breve",
    lengthMedium: "Medio",
    lengthLong: "Lungo",
    difficultyLabel: "Difficoltà",
    difficultyEasy: "Facile",
    difficultyMedium: "Medio",
    difficultyHard: "Difficile",
    seriesLabel: "Serie",
    seriesYes: "Sì",
    seriesNo: "No",
    fantasy: "Fiabe & Fantasia",
    action: "Avventura & Azione",
    animals: "Storie di animali",
    everyday: "Quotidiano & Emozioni",
    humor: "Umorismo & Caos",
    educational: "Sapere & Scoprire",
    surprise: "Sorprendimi",
    subElementHeader: "Scegli elementi",
    subElementHint: "Scegli fino a 3 elementi (opzionale)",
    selectedElements: "Selezionati",
    subElement_witches: "🧙‍♀️ Streghe",
    subElement_fairies: "🧚 Fate",
    subElement_wizards: "🧙 Maghi",
    subElement_dragons: "🐉 Draghi",
    subElement_royalty: "👑 Principi & Principesse",
    subElement_magic_objects: "✨ Oggetti magici",
    subElement_talking_animals: "🗣️ Animali parlanti",
    subElement_pirates: "🏴‍☠️ Pirati",
    subElement_ninjas: "🥷 Ninja",
    subElement_detectives: "🔍 Detective",
    subElement_superheroes: "🦸 Supereroi",
    subElement_explorers: "🧭 Esploratori",
    subElement_treasure_hunts: "💎 Caccia al tesoro",
    subElement_knights: "⚔️ Cavalieri",
    subElement_space_travel: "🚀 Avventure spaziali",
    subElement_pets: "🐕 Animali domestici",
    subElement_wild_animals: "🦁 Animali selvatici",
    subElement_farm_animals: "🐄 Animali della fattoria",
    subElement_animal_friends: "🐾 Amici animali",
    subElement_humanized_animals: "🐻 Animali umanizzati",
    subElement_animal_communities: "🐝 Comunità animali",
    subElement_family: "👨‍👩‍👧 Famiglia",
    subElement_school: "🏫 Scuola",
    subElement_friendship: "🤝 Amicizia",
    subElement_conflict_resolution: "🤗 Conflitti & Riconciliazione",
    subElement_emotions: "💖 Emozioni",
    subElement_first_experiences: "🌟 Prime esperienze",
    subElement_silly_stories: "🤪 Storie sciocche",
    subElement_absurd_characters: "👽 Personaggi assurdi",
    subElement_mishaps: "💥 Disavventure",
    subElement_cheeky_kids: "😜 Bambini birichini",
    subElement_crazy_animals: "🦊 Animali pazzi",
    subElement_wordplay: "📝 Giochi di parole",
    humorSliderTitle: "Quanto divertente?",
    humorLow: "Normalmente divertente",
    humorMid: "Molto divertente",
    humorHigh: "Totalmente pazzo",
    continue: "Continua",
    back: "Indietro",
    educationalTopicHeader: "Cosa vuoi imparare?",
    natureAnimals: "Natura & Animali",
    monumentsHistory: "Monumenti & Storia",
    countriesCities: "Paesi & Città",
    science: "Scienza",
    other: "Altro argomento",
    specifyTopic: "Cosa ti interessa esattamente?",
    placeholderNature: "es. Dinosauri, Delfini, Foresta pluviale...",
    placeholderMonuments: "es. Piramidi, Torre Eiffel, Colosseo...",
    placeholderCountries: "es. Giappone, Brasile, Australia...",
    placeholderScience: "es. Pianeti, Vulcani, Robot...",
    placeholderOther: "es. Musica, Sport, Cucina...",
  },
  bs: {
    header: "Kakvu priču želiš?",
    settingsHeader: "Postavke",
    lengthLabel: "Dužina",
    lengthShort: "Kratko",
    lengthMedium: "Srednje",
    lengthLong: "Dugo",
    difficultyLabel: "Težina",
    difficultyEasy: "Lako",
    difficultyMedium: "Srednje",
    difficultyHard: "Teško",
    seriesLabel: "Serija",
    seriesYes: "Da",
    seriesNo: "Ne",
    fantasy: "Bajke & Fantazija",
    action: "Avantura & Akcija",
    animals: "Priče o životinjama",
    everyday: "Svakodnevica & Osjećaji",
    humor: "Humor & Kaos",
    educational: "Znanje & Otkrivanje",
    surprise: "Iznenadi me",
    subElementHeader: "Odaberi elemente",
    subElementHint: "Odaberi do 3 elementa (opcionalno)",
    selectedElements: "Odabrano",
    subElement_witches: "🧙‍♀️ Vještice",
    subElement_fairies: "🧚 Vile",
    subElement_wizards: "🧙 Čarobnjaci",
    subElement_dragons: "🐉 Zmajevi",
    subElement_royalty: "👑 Prinčevi & Princeze",
    subElement_magic_objects: "✨ Magični predmeti",
    subElement_talking_animals: "🗣️ Životinje koje govore",
    subElement_pirates: "🏴‍☠️ Pirati",
    subElement_ninjas: "🥷 Nindže",
    subElement_detectives: "🔍 Detektivi",
    subElement_superheroes: "🦸 Superheroji",
    subElement_explorers: "🧭 Istraživači",
    subElement_treasure_hunts: "💎 Potraga za blagom",
    subElement_knights: "⚔️ Vitezovi",
    subElement_space_travel: "🚀 Svemirske avanture",
    subElement_pets: "🐕 Kućni ljubimci",
    subElement_wild_animals: "🦁 Divlje životinje",
    subElement_farm_animals: "🐄 Životinje s farme",
    subElement_animal_friends: "🐾 Životinjski prijatelji",
    subElement_humanized_animals: "🐻 Ljudske životinje",
    subElement_animal_communities: "🐝 Životinjske zajednice",
    subElement_family: "👨‍👩‍👧 Porodica",
    subElement_school: "🏫 Škola",
    subElement_friendship: "🤝 Prijateljstvo",
    subElement_conflict_resolution: "🤗 Sukob & Pomirenje",
    subElement_emotions: "💖 Emocije",
    subElement_first_experiences: "🌟 Prva iskustva",
    subElement_silly_stories: "🤪 Lude priče",
    subElement_absurd_characters: "👽 Apsurdni likovi",
    subElement_mishaps: "💥 Nezgode",
    subElement_cheeky_kids: "😜 Nestašna djeca",
    subElement_crazy_animals: "🦊 Lude životinje",
    subElement_wordplay: "📝 Igra riječima",
    humorSliderTitle: "Koliko smiješno?",
    humorLow: "Normalno smiješno",
    humorMid: "Jako smiješno",
    humorHigh: "Totalno ludo",
    continue: "Nastavi",
    back: "Nazad",
    educationalTopicHeader: "Šta želiš naučiti?",
    natureAnimals: "Priroda & Životinje",
    monumentsHistory: "Spomenici & Povijest",
    countriesCities: "Zemlje & Gradovi",
    science: "Nauka",
    other: "Druga tema",
    specifyTopic: "Šta te tačno zanima?",
    placeholderNature: "npr. Dinosauri, Delfini, Prašuma...",
    placeholderMonuments: "npr. Piramide, Eiffelov toranj, Koloseum...",
    placeholderCountries: "npr. Japan, Brazil, Australija...",
    placeholderScience: "npr. Planete, Vulkani, Roboti...",
    placeholderOther: "npr. Muzika, Sport, Kuhanje...",
  },
};

export interface SelectedCharacter {
  id: string;
  type: CharacterType | FamilyMember | SiblingGender;
  name: string;
  label: string;
  age?: number;
  gender?: SiblingGender;
}

export interface CharacterSelectionTranslations {
  header: string;
  me: string;
  family: string;
  siblings: string;
  friends: string;
  famous: string;
  surprise: string;
  mama: string;
  papa: string;
  oma: string;
  opa: string;
  other: string;
  back: string;
  addMore: string;
  yourCharacters: string;
  continue: string;
  nameModalTitle: string;
  save: string;
  cancel: string;
  nameSaved: string;
  bonusQuestion: string;
  superpowers: string;
  magic: string;
  heroesVillains: string;
  transformations: string;
  talents: string;
  normal: string;
  skip: string;
  brother: string;
  sister: string;
  siblingAge: string;
  selectOrName: string;
  useDefaultName: string;
  enterCustomName: string;
}

export const characterSelectionTranslations: Record<Language, CharacterSelectionTranslations> = {
  de: {
    header: "Wer sind die Hauptpersonen in deiner Geschichte?",
    me: "Ich",
    family: "Meine Familie",
    siblings: "Meine Geschwister",
    friends: "Meine Freunde",
    famous: "Bekannte Figuren",
    surprise: "Überrasch mich",
    mama: "Mama",
    papa: "Papa",
    oma: "Oma",
    opa: "Opa",
    other: "Weitere...",
    back: "Zurück",
    addMore: "Hinzufügen",
    yourCharacters: "Deine Hauptpersonen:",
    continue: "Weiter",
    nameModalTitle: "Wie heißt",
    save: "Speichern",
    cancel: "Abbrechen",
    nameSaved: "gespeichert",
    bonusQuestion: "Sollen manche Hauptpersonen besondere Eigenschaften haben?",
    superpowers: "Superkräfte",
    magic: "Magische Kräfte",
    heroesVillains: "Helden & Bösewichte",
    transformations: "Verwandlungen",
    talents: "Besondere Talente",
    normal: "Nein, ganz normal",
    skip: "Überspringen",
    brother: "Bruder",
    sister: "Schwester",
    siblingAge: "Alter",
    selectOrName: "Auswählen oder Name eingeben",
    useDefaultName: "Als",
    enterCustomName: "Eigener Name",
  },
  fr: {
    header: "Qui sont les personnages principaux de ton histoire?",
    me: "Moi",
    family: "Ma famille",
    siblings: "Mes frères et sœurs",
    friends: "Mes amis",
    famous: "Personnages connus",
    surprise: "Surprends-moi",
    mama: "Maman",
    papa: "Papa",
    oma: "Mamie",
    opa: "Papy",
    other: "Autres...",
    back: "Retour",
    addMore: "Ajouter",
    yourCharacters: "Tes personnages:",
    continue: "Continuer",
    nameModalTitle: "Comment s'appelle",
    save: "Enregistrer",
    cancel: "Annuler",
    nameSaved: "enregistré",
    bonusQuestion: "Certains personnages doivent-ils avoir des propriétés spéciales?",
    superpowers: "Super pouvoirs",
    magic: "Pouvoirs magiques",
    heroesVillains: "Héros & Méchants",
    transformations: "Transformations",
    talents: "Talents spéciaux",
    normal: "Non, tout à fait normal",
    skip: "Passer",
    brother: "Frère",
    sister: "Sœur",
    siblingAge: "Âge",
    selectOrName: "Sélectionner ou entrer un nom",
    useDefaultName: "Comme",
    enterCustomName: "Nom personnalisé",
  },
  en: {
    header: "Who are the main characters in your story?",
    me: "Me",
    family: "My Family",
    siblings: "My Siblings",
    friends: "My Friends",
    famous: "Famous Characters",
    surprise: "Surprise Me",
    mama: "Mom",
    papa: "Dad",
    oma: "Grandma",
    opa: "Grandpa",
    other: "Others...",
    back: "Back",
    addMore: "Add",
    yourCharacters: "Your characters:",
    continue: "Continue",
    nameModalTitle: "What is the name of",
    save: "Save",
    cancel: "Cancel",
    nameSaved: "saved",
    bonusQuestion: "Should some characters have special abilities?",
    superpowers: "Superpowers",
    magic: "Magical Powers",
    heroesVillains: "Heroes & Villains",
    transformations: "Transformations",
    talents: "Special Talents",
    normal: "No, just normal",
    skip: "Skip",
    brother: "Brother",
    sister: "Sister",
    siblingAge: "Age",
    selectOrName: "Select or enter a name",
    useDefaultName: "As",
    enterCustomName: "Custom name",
  },
  es: {
    header: "¿Quiénes son los personajes principales de tu historia?",
    me: "Yo",
    family: "Mi familia",
    siblings: "Mis hermanos",
    friends: "Mis amigos",
    famous: "Personajes famosos",
    surprise: "Sorpréndeme",
    mama: "Mamá",
    papa: "Papá",
    oma: "Abuela",
    opa: "Abuelo",
    other: "Otros...",
    back: "Volver",
    addMore: "Añadir",
    yourCharacters: "Tus personajes:",
    continue: "Continuar",
    nameModalTitle: "¿Cómo se llama",
    save: "Guardar",
    cancel: "Cancelar",
    nameSaved: "guardado",
    bonusQuestion: "¿Deberían algunos personajes tener habilidades especiales?",
    superpowers: "Superpoderes",
    magic: "Poderes mágicos",
    heroesVillains: "Héroes y villanos",
    transformations: "Transformaciones",
    talents: "Talentos especiales",
    normal: "No, normal",
    skip: "Saltar",
    brother: "Hermano",
    sister: "Hermana",
    siblingAge: "Edad",
    selectOrName: "Seleccionar o ingresar nombre",
    useDefaultName: "Como",
    enterCustomName: "Nombre personalizado",
  },
  nl: {
    header: "Wie zijn de hoofdpersonen in je verhaal?",
    me: "Ik",
    family: "Mijn familie",
    siblings: "Mijn broers en zussen",
    friends: "Mijn vrienden",
    famous: "Bekende figuren",
    surprise: "Verras me",
    mama: "Mama",
    papa: "Papa",
    oma: "Oma",
    opa: "Opa",
    other: "Anderen...",
    back: "Terug",
    addMore: "Toevoegen",
    yourCharacters: "Je personages:",
    continue: "Verder",
    nameModalTitle: "Hoe heet",
    save: "Opslaan",
    cancel: "Annuleren",
    nameSaved: "opgeslagen",
    bonusQuestion: "Moeten sommige personages speciale eigenschappen hebben?",
    superpowers: "Superkrachten",
    magic: "Magische krachten",
    heroesVillains: "Helden & schurken",
    transformations: "Transformaties",
    talents: "Speciale talenten",
    normal: "Nee, gewoon normaal",
    skip: "Overslaan",
    brother: "Broer",
    sister: "Zus",
    siblingAge: "Leeftijd",
    selectOrName: "Selecteer of voer naam in",
    useDefaultName: "Als",
    enterCustomName: "Eigen naam",
  },
  it: {
    header: "Chi sono i personaggi principali della tua storia?",
    me: "Io",
    family: "La mia famiglia",
    siblings: "I miei fratelli",
    friends: "I miei amici",
    famous: "Personaggi famosi",
    surprise: "Sorprendimi",
    mama: "Mamma",
    papa: "Papà",
    oma: "Nonna",
    opa: "Nonno",
    other: "Altri...",
    back: "Indietro",
    addMore: "Aggiungi",
    yourCharacters: "I tuoi personaggi:",
    continue: "Continua",
    nameModalTitle: "Come si chiama",
    save: "Salva",
    cancel: "Annulla",
    nameSaved: "salvato",
    bonusQuestion: "Alcuni personaggi dovrebbero avere abilità speciali?",
    superpowers: "Superpoteri",
    magic: "Poteri magici",
    heroesVillains: "Eroi e cattivi",
    transformations: "Trasformazioni",
    talents: "Talenti speciali",
    normal: "No, normale",
    skip: "Salta",
    brother: "Fratello",
    sister: "Sorella",
    siblingAge: "Età",
    selectOrName: "Seleziona o inserisci nome",
    useDefaultName: "Come",
    enterCustomName: "Nome personalizzato",
  },
  bs: {
    header: "Ko su glavni likovi u tvojoj priči?",
    me: "Ja",
    family: "Moja porodica",
    siblings: "Moja braća i sestre",
    friends: "Moji prijatelji",
    famous: "Poznati likovi",
    surprise: "Iznenadi me",
    mama: "Mama",
    papa: "Tata",
    oma: "Baka",
    opa: "Djed",
    other: "Drugi...",
    back: "Nazad",
    addMore: "Dodaj",
    yourCharacters: "Tvoji likovi:",
    continue: "Nastavi",
    nameModalTitle: "Kako se zove",
    save: "Spremi",
    cancel: "Otkaži",
    nameSaved: "spremljeno",
    bonusQuestion: "Trebaju li neki likovi imati posebne sposobnosti?",
    superpowers: "Supermoći",
    magic: "Magične moći",
    heroesVillains: "Heroji i zlikovci",
    transformations: "Transformacije",
    talents: "Posebni talenti",
    normal: "Ne, normalno",
    skip: "Preskoči",
    brother: "Brat",
    sister: "Sestra",
    siblingAge: "Dob",
    selectOrName: "Odaberi ili unesi ime",
    useDefaultName: "Kao",
    enterCustomName: "Vlastito ime",
  },
};
