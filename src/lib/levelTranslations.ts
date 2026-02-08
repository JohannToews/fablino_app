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
    buecherfuchs: "Petit Renard",
    geschichtenentdecker: "Explorateur d'histoires",
    leseheld: "Héros lecteur",
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
    buecherfuchs: "Zorrito lector",
    geschichtenentdecker: "Explorador de historias",
    leseheld: "Héroe lector",
    wortmagier: "Mago de palabras",
    fablinoMeister: "Maestro Fablino",
  },
  nl: {
    buecherfuchs: "Boekenvos",
    geschichtenentdecker: "Verhaalontdekker",
    leseheld: "Leesheld",
    wortmagier: "Woordmagiër",
    fablinoMeister: "Fablino Meester",
  },
  bs: {
    buecherfuchs: "Lisica čitač",
    geschichtenentdecker: "Istraživač priča",
    leseheld: "Heroj čitanja",
    wortmagier: "Čarobnjak riječi",
    fablinoMeister: "Fablino Majstor",
  },
  it: {
    buecherfuchs: "Volpe lettrice",
    geschichtenentdecker: "Esploratore di storie",
    leseheld: "Eroe lettore",
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
