/**
 * Immersive Reader — Localization Labels
 *
 * Following the codebase pattern of local label maps per component
 * (like readingLabels in ReadingPage.tsx).
 */

export interface ImmersiveLabels {
  tapToContinue: string;
  chapterOf: string;
  chapterComplete: string;
  seriesComplete: string;
  startNextChapter: string;
  quizRequired: string;
  quizNotPassed: string;
  readAgain: string;
  newStory: string;
  startQuiz: string;
  myStories: string;
  fullscreen: string;
  syllablesOn: string;
  syllablesOff: string;
  fontSmall: string;
  fontMedium: string;
  fontLarge: string;
  chapter: string;
  starsEarned: string;
  streakDay: string;
  weeklyBonus: string;
  totalStars: string;
  startNewChapterStory: string;
  quizCorrect: string;
  encouragement: string;
  wellDone: string;
}

export const immersiveLabels: Record<string, ImmersiveLabels> = {
  de: {
    tapToContinue: 'Tippen um weiterzulesen →',
    chapterOf: 'Kapitel {current} von {total}',
    chapterComplete: 'Kapitel {number} geschafft!',
    seriesComplete: 'Geschichte geschafft!',
    startNextChapter: 'Nächstes Kapitel starten ➡️',
    quizRequired: 'Beantworte das Quiz um das nächste Kapitel freizuschalten',
    quizNotPassed: 'Lies das Kapitel nochmal und versuch das Quiz erneut 📖',
    readAgain: 'Nochmal lesen',
    newStory: 'Neue Geschichte',
    startQuiz: 'Quiz starten 📝',
    myStories: 'Meine Geschichten 📚',
    fullscreen: 'Vollbild',
    syllablesOn: 'Silbenfarben AN',
    syllablesOff: 'Silbenfarben AUS',
    fontSmall: 'Klein',
    fontMedium: 'Mittel',
    fontLarge: 'Groß',
    chapter: 'Kapitel',
    starsEarned: '⭐ {count} Sterne verdient!',
    streakDay: '🔥 Tag {count}!',
    weeklyBonus: '+{count} Bonus-Sterne! ({stories} Geschichten diese Woche)',
    totalStars: 'Gesamt: {count} ⭐',
    startNewChapterStory: 'Neue Kapitelgeschichte starten 📖',
    quizCorrect: '{correct} von {total} richtig',
    encouragement: 'Super gemacht!',
    wellDone: 'Toll!',
  },
  fr: {
    tapToContinue: 'Touche pour continuer →',
    chapterOf: 'Chapitre {current} sur {total}',
    chapterComplete: 'Chapitre {number} terminé !',
    seriesComplete: 'Histoire terminée !',
    startNextChapter: 'Commencer le prochain chapitre ➡️',
    quizRequired: 'Réponds au quiz pour débloquer le prochain chapitre',
    quizNotPassed: 'Relis le chapitre et retente le quiz 📖',
    readAgain: 'Relire',
    newStory: 'Nouvelle histoire',
    startQuiz: 'Commencer le quiz 📝',
    myStories: 'Mes histoires 📚',
    fullscreen: 'Plein écran',
    syllablesOn: 'Syllabes couleurs ON',
    syllablesOff: 'Syllabes couleurs OFF',
    fontSmall: 'Petit',
    fontMedium: 'Moyen',
    fontLarge: 'Grand',
    chapter: 'Chapitre',
    starsEarned: '⭐ {count} étoiles gagnées !',
    streakDay: '🔥 Jour {count} !',
    weeklyBonus: '+{count} étoiles bonus ! ({stories} histoires cette semaine)',
    totalStars: 'Total : {count} ⭐',
    startNewChapterStory: 'Commencer une nouvelle histoire à chapitres 📖',
    quizCorrect: '{correct} sur {total} correct',
    encouragement: 'Super !',
    wellDone: 'Bravo !',
  },
  en: {
    tapToContinue: 'Tap to continue reading →',
    chapterOf: 'Chapter {current} of {total}',
    chapterComplete: 'Chapter {number} complete!',
    seriesComplete: 'Story complete!',
    startNextChapter: 'Start next chapter ➡️',
    quizRequired: 'Answer the quiz to unlock the next chapter',
    quizNotPassed: 'Read the chapter again and try the quiz once more 📖',
    readAgain: 'Read again',
    newStory: 'New story',
    startQuiz: 'Start Quiz 📝',
    myStories: 'My Stories 📚',
    fullscreen: 'Fullscreen',
    syllablesOn: 'Syllable colors ON',
    syllablesOff: 'Syllable colors OFF',
    fontSmall: 'Small',
    fontMedium: 'Medium',
    fontLarge: 'Large',
    chapter: 'Chapter',
    starsEarned: '⭐ {count} stars earned!',
    streakDay: '🔥 Day {count}!',
    weeklyBonus: '+{count} bonus stars! ({stories} stories this week)',
    totalStars: 'Total: {count} ⭐',
    startNewChapterStory: 'Start new chapter story 📖',
    quizCorrect: '{correct} of {total} correct',
    encouragement: 'Great job!',
    wellDone: 'Well done!',
  },
  es: {
    tapToContinue: 'Toca para seguir leyendo →',
    chapterOf: 'Capítulo {current} de {total}',
    chapterComplete: '¡Capítulo {number} completado!',
    seriesComplete: '¡Historia completada!',
    startNextChapter: 'Empezar el siguiente capítulo ➡️',
    quizRequired: 'Responde al quiz para desbloquear el siguiente capítulo',
    quizNotPassed: 'Lee el capítulo de nuevo e intenta el quiz otra vez 📖',
    readAgain: 'Leer de nuevo',
    newStory: 'Nueva historia',
    startQuiz: 'Empezar quiz 📝',
    myStories: 'Mis historias 📚',
    fullscreen: 'Pantalla completa',
    syllablesOn: 'Colores de sílabas ON',
    syllablesOff: 'Colores de sílabas OFF',
    fontSmall: 'Pequeño',
    fontMedium: 'Mediano',
    fontLarge: 'Grande',
    chapter: 'Capítulo',
    starsEarned: '⭐ ¡{count} estrellas ganadas!',
    streakDay: '🔥 ¡Día {count}!',
    weeklyBonus: '+{count} estrellas bonus ({stories} historias esta semana)',
    totalStars: 'Total: {count} ⭐',
    startNewChapterStory: 'Empezar nueva historia por capítulos 📖',
    quizCorrect: '{correct} de {total} correctas',
    encouragement: '¡Muy bien!',
    wellDone: '¡Genial!',
  },
  nl: {
    tapToContinue: 'Tik om verder te lezen →',
    chapterOf: 'Hoofdstuk {current} van {total}',
    chapterComplete: 'Hoofdstuk {number} klaar!',
    seriesComplete: 'Verhaal klaar!',
    startNextChapter: 'Volgend hoofdstuk starten ➡️',
    quizRequired: 'Beantwoord de quiz om het volgende hoofdstuk vrij te spelen',
    quizNotPassed: 'Lees het hoofdstuk opnieuw en probeer de quiz nog eens 📖',
    readAgain: 'Opnieuw lezen',
    newStory: 'Nieuw verhaal',
    startQuiz: 'Quiz starten 📝',
    myStories: 'Mijn verhalen 📚',
    fullscreen: 'Volledig scherm',
    syllablesOn: 'Lettergreepkleuren AAN',
    syllablesOff: 'Lettergreepkleuren UIT',
    fontSmall: 'Klein',
    fontMedium: 'Gemiddeld',
    fontLarge: 'Groot',
    chapter: 'Hoofdstuk',
    starsEarned: '⭐ {count} sterren verdiend!',
    streakDay: '🔥 Dag {count}!',
    weeklyBonus: '+{count} bonussterren! ({stories} verhalen deze week)',
    totalStars: 'Totaal: {count} ⭐',
    startNewChapterStory: 'Nieuw hoofdstukverhaal starten 📖',
    quizCorrect: '{correct} van {total} goed',
    encouragement: 'Goed gedaan!',
    wellDone: 'Knap!',
  },
  it: {
    tapToContinue: 'Tocca per continuare a leggere →',
    chapterOf: 'Capitolo {current} di {total}',
    chapterComplete: 'Capitolo {number} completato!',
    seriesComplete: 'Storia completata!',
    startNextChapter: 'Inizia il prossimo capitolo ➡️',
    quizRequired: 'Rispondi al quiz per sbloccare il prossimo capitolo',
    quizNotPassed: 'Rileggi il capitolo e riprova il quiz 📖',
    readAgain: 'Leggi di nuovo',
    newStory: 'Nuova storia',
    startQuiz: 'Inizia il quiz 📝',
    myStories: 'Le mie storie 📚',
    fullscreen: 'Schermo intero',
    syllablesOn: 'Colori sillabe ON',
    syllablesOff: 'Colori sillabe OFF',
    fontSmall: 'Piccolo',
    fontMedium: 'Medio',
    fontLarge: 'Grande',
    chapter: 'Capitolo',
    starsEarned: '⭐ {count} stelle guadagnate!',
    streakDay: '🔥 Giorno {count}!',
    weeklyBonus: '+{count} stelle bonus! ({stories} storie questa settimana)',
    totalStars: 'Totale: {count} ⭐',
    startNewChapterStory: 'Inizia una nuova storia a capitoli 📖',
    quizCorrect: '{correct} su {total} corrette',
    encouragement: 'Ottimo lavoro!',
    wellDone: 'Bravo!',
  },
  bs: {
    tapToContinue: 'Dodirni za nastavak čitanja →',
    chapterOf: 'Poglavlje {current} od {total}',
    chapterComplete: 'Poglavlje {number} završeno!',
    seriesComplete: 'Priča završena!',
    startNextChapter: 'Pokreni sljedeće poglavlje ➡️',
    quizRequired: 'Odgovori na kviz da otključaš sljedeće poglavlje',
    quizNotPassed: 'Pročitaj poglavlje ponovo i pokušaj kviz još jednom 📖',
    readAgain: 'Čitaj ponovo',
    newStory: 'Nova priča',
    startQuiz: 'Pokreni kviz 📝',
    myStories: 'Moje priče 📚',
    fullscreen: 'Puni ekran',
    syllablesOn: 'Boje slogova UKLJUČENE',
    syllablesOff: 'Boje slogova ISKLJUČENE',
    fontSmall: 'Malo',
    fontMedium: 'Srednje',
    fontLarge: 'Veliko',
    chapter: 'Poglavlje',
    starsEarned: '⭐ {count} zvjezdica zarađeno!',
    streakDay: '🔥 Dan {count}!',
    weeklyBonus: '+{count} bonus zvjezdice! ({stories} priča ove sedmice)',
    totalStars: 'Ukupno: {count} ⭐',
    startNewChapterStory: 'Pokreni novu priču s poglavljima 📖',
    quizCorrect: '{correct} od {total} tačno',
    encouragement: 'Odlično!',
    wellDone: 'Svaka čast!',
  },
};

/**
 * Get labels for a given language code, with English fallback.
 */
export function getImmersiveLabels(language?: string | null): ImmersiveLabels {
  if (!language) return immersiveLabels.en;
  const key = language.toLowerCase().substring(0, 2);
  return immersiveLabels[key] || immersiveLabels.en;
}

/**
 * Simple template interpolation: replaces {key} placeholders.
 */
export function t(template: string, values: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(`{${key}}`, String(value));
  }
  return result;
}
