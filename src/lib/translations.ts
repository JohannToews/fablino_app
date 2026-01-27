// Translations for the application
export type Language = 'de' | 'fr' | 'en';

export interface Translations {
  // Common
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  loading: string;
  error: string;
  success: string;
  
  // Admin
  adminArea: string;
  newStory: string;
  title: string;
  coverImage: string;
  selectImage: string;
  readingText: string;
  saveStory: string;
  saving: string;
  existingStories: string;
  noStoriesYet: string;
  pointsConfig: string;
  levelConfig: string;
  
  // Story Generator
  storyGenerator: string;
  generateNewStory: string;
  textType: string;
  fiction: string;
  nonFiction: string;
  textLanguage: string;
  globalLanguage: string;
  childAge: string;
  years: string;
  schoolLevel: string;
  difficulty: string;
  easy: string;
  medium: string;
  hard: string;
  textLength: string;
  short: string;
  long: string;
  systemPrompt: string;
  showSystemPrompt: string;
  hideSystemPrompt: string;
  savePrompt: string;
  generateStory: string;
  generating: string;
  storyTransferred: string;
  
  // Messages
  enterTitleAndText: string;
  imageUploadError: string;
  storySaveError: string;
  questionsCouldNotBeSaved: string;
  storyAndQuestionsSaved: string;
  generatingQuestions: string;
  questionsGenerationFailed: string;
  storyDeleted: string;
  deleteError: string;
  
  // Points Config
  pointsConfiguration: string;
  comprehensionQuestion: string;
  quizPerCorrectAnswer: string;
  storyRead: string;
  pointsNote: string;
  savePointsConfig: string;
  errorSaving: string;
  pointsConfigSaved: string;
  
  // Level Config
  levelConfiguration: string;
  defineLevels: string;
  fromPoints: string;
  saveLevelConfig: string;
  levelConfigSaved: string;
}

const translations: Record<Language, Translations> = {
  de: {
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    loading: 'Lädt...',
    error: 'Fehler',
    success: 'Erfolg',
    
    adminArea: 'Admin-Bereich',
    newStory: 'Neue Leseübung erstellen',
    title: 'Titel',
    coverImage: 'Titelbild',
    selectImage: 'Bild auswählen',
    readingText: 'Lesetext',
    saveStory: 'Geschichte speichern',
    saving: 'Speichere...',
    existingStories: 'Vorhandene Geschichten',
    noStoriesYet: 'Noch keine Geschichten vorhanden',
    pointsConfig: 'Punkte-Konfiguration',
    levelConfig: 'Level-Konfiguration',
    
    storyGenerator: 'Geschichte generieren',
    generateNewStory: 'Neue Geschichte mit KI generieren',
    textType: 'Art des Textes',
    fiction: 'Fiktion',
    nonFiction: 'Sachgeschichte',
    textLanguage: 'Sprache des Textes',
    globalLanguage: 'Globale Sprache',
    childAge: 'Alter des Kindes',
    years: 'Jahre',
    schoolLevel: 'Schulstufe',
    difficulty: 'Schwierigkeit',
    easy: 'Leicht',
    medium: 'Mittel',
    hard: 'Schwer',
    textLength: 'Textlänge',
    short: 'Kurz',
    long: 'Lang',
    systemPrompt: 'System-Prompt',
    showSystemPrompt: 'System-Prompt anzeigen',
    hideSystemPrompt: 'System-Prompt verbergen',
    savePrompt: 'Prompt speichern',
    generateStory: 'Geschichte generieren',
    generating: 'Generiere...',
    storyTransferred: 'Geschichte wurde in das Formular übernommen. Du kannst sie jetzt bearbeiten und speichern.',
    
    enterTitleAndText: 'Bitte Titel und Text eingeben',
    imageUploadError: 'Fehler beim Hochladen des Bildes',
    storySaveError: 'Fehler beim Speichern der Geschichte',
    questionsCouldNotBeSaved: 'Fragen konnten nicht gespeichert werden',
    storyAndQuestionsSaved: 'Geschichte und Fragen gespeichert! 🎉',
    generatingQuestions: 'Generiere Verständnisfragen...',
    questionsGenerationFailed: 'Fragen-Generierung fehlgeschlagen',
    storyDeleted: 'Geschichte gelöscht',
    deleteError: 'Fehler beim Löschen',
    
    // Points Config
    pointsConfiguration: 'Punktekonfiguration',
    comprehensionQuestion: 'Verständnisfrage',
    quizPerCorrectAnswer: 'Quiz (pro richtige Antwort)',
    storyRead: 'Geschichte gelesen',
    pointsNote: 'Quiz-Punkte werden nur vergeben, wenn das Quiz insgesamt bestanden wird (4/5 oder 8/10).',
    savePointsConfig: 'Punktekonfiguration speichern',
    errorSaving: 'Fehler beim Speichern',
    pointsConfigSaved: 'Punktekonfiguration gespeichert! 🎯',
    
    // Level Config
    levelConfiguration: 'Niveau-Konfiguration',
    defineLevels: 'Definiere die Niveaustufen und die benötigten Punkte.',
    fromPoints: 'Ab Punkte',
    saveLevelConfig: 'Niveau-Konfiguration speichern',
    levelConfigSaved: 'Niveau-Konfiguration gespeichert! ⭐',
  },
  
  en: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    
    adminArea: 'Admin Area',
    newStory: 'Create New Reading Exercise',
    title: 'Title',
    coverImage: 'Cover Image',
    selectImage: 'Select Image',
    readingText: 'Reading Text',
    saveStory: 'Save Story',
    saving: 'Saving...',
    existingStories: 'Existing Stories',
    noStoriesYet: 'No stories yet',
    pointsConfig: 'Points Configuration',
    levelConfig: 'Level Configuration',
    
    storyGenerator: 'Story Generator',
    generateNewStory: 'Generate New Story with AI',
    textType: 'Text Type',
    fiction: 'Fiction',
    nonFiction: 'Non-Fiction',
    textLanguage: 'Text Language',
    globalLanguage: 'Global Language',
    childAge: 'Child Age',
    years: 'years',
    schoolLevel: 'School Level',
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    textLength: 'Text Length',
    short: 'Short',
    long: 'Long',
    systemPrompt: 'System Prompt',
    showSystemPrompt: 'Show System Prompt',
    hideSystemPrompt: 'Hide System Prompt',
    savePrompt: 'Save Prompt',
    generateStory: 'Generate Story',
    generating: 'Generating...',
    storyTransferred: 'Story has been transferred to the form. You can now edit and save it.',
    
    enterTitleAndText: 'Please enter title and text',
    imageUploadError: 'Error uploading image',
    storySaveError: 'Error saving story',
    questionsCouldNotBeSaved: 'Questions could not be saved',
    storyAndQuestionsSaved: 'Story and questions saved! 🎉',
    generatingQuestions: 'Generating comprehension questions...',
    questionsGenerationFailed: 'Question generation failed',
    storyDeleted: 'Story deleted',
    deleteError: 'Error deleting',
    
    // Points Config
    pointsConfiguration: 'Points Configuration',
    comprehensionQuestion: 'Comprehension Question',
    quizPerCorrectAnswer: 'Quiz (per correct answer)',
    storyRead: 'Story Read',
    pointsNote: 'Quiz points are only awarded when the quiz is passed overall (4/5 or 8/10).',
    savePointsConfig: 'Save Points Configuration',
    errorSaving: 'Error saving',
    pointsConfigSaved: 'Points configuration saved! 🎯',
    
    // Level Config
    levelConfiguration: 'Level Configuration',
    defineLevels: 'Define the levels and required points.',
    fromPoints: 'From Points',
    saveLevelConfig: 'Save Level Configuration',
    levelConfigSaved: 'Level configuration saved! ⭐',
  },
  
  fr: {
    save: 'Sauvegarder',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    
    adminArea: 'Zone Admin',
    newStory: 'Créer un nouvel exercice de lecture',
    title: 'Titre',
    coverImage: 'Image de couverture',
    selectImage: 'Choisir une image',
    readingText: 'Texte de lecture',
    saveStory: 'Sauvegarder l\'histoire',
    saving: 'Sauvegarde...',
    existingStories: 'Histoires existantes',
    noStoriesYet: 'Pas encore d\'histoires',
    pointsConfig: 'Configuration des points',
    levelConfig: 'Configuration des niveaux',
    
    storyGenerator: 'Générateur d\'histoires',
    generateNewStory: 'Générer une nouvelle histoire avec l\'IA',
    textType: 'Type de texte',
    fiction: 'Fiction',
    nonFiction: 'Documentaire',
    textLanguage: 'Langue du texte',
    globalLanguage: 'Langue globale',
    childAge: 'Âge de l\'enfant',
    years: 'ans',
    schoolLevel: 'Niveau scolaire',
    difficulty: 'Difficulté',
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
    textLength: 'Longueur du texte',
    short: 'Court',
    long: 'Long',
    systemPrompt: 'Prompt système',
    showSystemPrompt: 'Afficher le prompt système',
    hideSystemPrompt: 'Masquer le prompt système',
    savePrompt: 'Sauvegarder le prompt',
    generateStory: 'Générer l\'histoire',
    generating: 'Génération...',
    storyTransferred: 'L\'histoire a été transférée dans le formulaire. Vous pouvez maintenant la modifier et la sauvegarder.',
    
    enterTitleAndText: 'Veuillez entrer le titre et le texte',
    imageUploadError: 'Erreur lors du téléchargement de l\'image',
    storySaveError: 'Erreur lors de la sauvegarde de l\'histoire',
    questionsCouldNotBeSaved: 'Les questions n\'ont pas pu être sauvegardées',
    storyAndQuestionsSaved: 'Histoire et questions sauvegardées ! 🎉',
    generatingQuestions: 'Génération des questions de compréhension...',
    questionsGenerationFailed: 'Échec de la génération des questions',
    storyDeleted: 'Histoire supprimée',
    deleteError: 'Erreur lors de la suppression',
    
    // Points Config
    pointsConfiguration: 'Configuration des points',
    comprehensionQuestion: 'Question de compréhension',
    quizPerCorrectAnswer: 'Quiz (par réponse correcte)',
    storyRead: 'Histoire lue',
    pointsNote: 'Les points de quiz ne sont attribués que si le quiz est réussi (4/5 ou 8/10).',
    savePointsConfig: 'Sauvegarder la configuration des points',
    errorSaving: 'Erreur lors de la sauvegarde',
    pointsConfigSaved: 'Configuration des points sauvegardée ! 🎯',
    
    // Level Config
    levelConfiguration: 'Configuration des niveaux',
    defineLevels: 'Définissez les niveaux et les points requis.',
    fromPoints: 'À partir de',
    saveLevelConfig: 'Sauvegarder la configuration des niveaux',
    levelConfigSaved: 'Configuration des niveaux sauvegardée ! ⭐',
  },
};

export const getTranslations = (lang: Language): Translations => {
  return translations[lang] || translations.de;
};

export const useTranslations = (lang: Language) => {
  return getTranslations(lang);
};