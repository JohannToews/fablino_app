// Translations for the application
export type Language = 'de' | 'fr' | 'en' | 'es' | 'nl';

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
  settings: string;
  account: string;
  
  // Story Sub-tabs
  generator: string;
  editor: string;
  library: string;
  questionsReady: string;
  
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
  
  // Kid Profile
  kidProfile: string;
  kidProfileDescription: string;
  kidName: string;
  kidAge: string;
  hobbies: string;
  hobbiesPlaceholder: string;
  colorPalette: string;
  generateCover: string;
  generatingCover: string;
  saveProfile: string;
  profileSaved: string;
  coverGenerated: string;
  addChild: string;
  schoolSystem: string;
  schoolClass: string;
  imageStyle: string;
  
  // Color palettes (5 distinct)
  paletteOcean: string;
  paletteSunset: string;
  paletteForest: string;
  paletteLavender: string;
  paletteSunshine: string;
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
    settings: 'Einstellungen',
    account: 'Konto',
    
    generator: 'Generator',
    editor: 'Bearbeiten',
    library: 'Bibliothek',
    questionsReady: 'Verständnisfragen bereit',
    
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
    
    pointsConfiguration: 'Punktekonfiguration',
    comprehensionQuestion: 'Verständnisfrage',
    quizPerCorrectAnswer: 'Quiz (pro richtige Antwort)',
    storyRead: 'Geschichte gelesen',
    pointsNote: 'Quiz-Punkte werden nur vergeben, wenn das Quiz insgesamt bestanden wird (4/5 oder 8/10).',
    savePointsConfig: 'Punktekonfiguration speichern',
    errorSaving: 'Fehler beim Speichern',
    pointsConfigSaved: 'Punktekonfiguration gespeichert! 🎯',
    
    levelConfiguration: 'Niveau-Konfiguration',
    defineLevels: 'Definiere die Niveaustufen und die benötigten Punkte.',
    fromPoints: 'Ab Punkte',
    saveLevelConfig: 'Niveau-Konfiguration speichern',
    levelConfigSaved: 'Niveau-Konfiguration gespeichert! ⭐',
    
    kidProfile: 'Kinderprofil',
    kidProfileDescription: 'Definiere das Profil des Kindes für personalisierte Inhalte.',
    kidName: 'Name des Kindes',
    kidAge: 'Alter',
    hobbies: 'Hobbies & Interessen',
    hobbiesPlaceholder: 'z.B. Fußball, Dinosaurier, Weltraum, Malen...',
    colorPalette: 'Farbpalette',
    generateCover: 'Titelbild generieren',
    generatingCover: 'Generiere Bild...',
    saveProfile: 'Profil speichern',
    profileSaved: 'Profil gespeichert! 🎨',
    coverGenerated: 'Titelbild wurde generiert! 🖼️',
    addChild: 'Kind hinzufügen',
    schoolSystem: 'Schulsystem',
    schoolClass: 'Schulklasse',
    imageStyle: 'Bild-Stil',
    
    paletteOcean: 'Ozean',
    paletteSunset: 'Sonnenuntergang',
    paletteForest: 'Wald',
    paletteLavender: 'Lavendel',
    paletteSunshine: 'Sonne',
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
    settings: 'Settings',
    account: 'Account',
    
    generator: 'Generator',
    editor: 'Edit',
    library: 'Library',
    questionsReady: 'comprehension questions ready',
    
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
    
    pointsConfiguration: 'Points Configuration',
    comprehensionQuestion: 'Comprehension Question',
    quizPerCorrectAnswer: 'Quiz (per correct answer)',
    storyRead: 'Story Read',
    pointsNote: 'Quiz points are only awarded when the quiz is passed overall (4/5 or 8/10).',
    savePointsConfig: 'Save Points Configuration',
    errorSaving: 'Error saving',
    pointsConfigSaved: 'Points configuration saved! 🎯',
    
    levelConfiguration: 'Level Configuration',
    defineLevels: 'Define the levels and required points.',
    fromPoints: 'From Points',
    saveLevelConfig: 'Save Level Configuration',
    levelConfigSaved: 'Level configuration saved! ⭐',
    
    kidProfile: 'Kid Profile',
    kidProfileDescription: 'Define the child\'s profile for personalized content.',
    kidName: 'Child\'s Name',
    kidAge: 'Age',
    hobbies: 'Hobbies & Interests',
    hobbiesPlaceholder: 'e.g. Soccer, Dinosaurs, Space, Painting...',
    colorPalette: 'Color Palette',
    generateCover: 'Generate Cover Image',
    generatingCover: 'Generating image...',
    saveProfile: 'Save Profile',
    profileSaved: 'Profile saved! 🎨',
    coverGenerated: 'Cover image generated! 🖼️',
    addChild: 'Add child',
    schoolSystem: 'School system',
    schoolClass: 'Grade',
    imageStyle: 'Image Style',
    
    paletteOcean: 'Ocean',
    paletteSunset: 'Sunset',
    paletteForest: 'Forest',
    paletteLavender: 'Lavender',
    paletteSunshine: 'Sunshine',
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
    settings: 'Paramètres',
    account: 'Compte',
    
    generator: 'Générateur',
    editor: 'Éditer',
    library: 'Bibliothèque',
    questionsReady: 'questions de compréhension prêtes',
    
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
    
    pointsConfiguration: 'Configuration des points',
    comprehensionQuestion: 'Question de compréhension',
    quizPerCorrectAnswer: 'Quiz (par réponse correcte)',
    storyRead: 'Histoire lue',
    pointsNote: 'Les points de quiz ne sont attribués que si le quiz est réussi (4/5 ou 8/10).',
    savePointsConfig: 'Sauvegarder la configuration des points',
    errorSaving: 'Erreur lors de la sauvegarde',
    pointsConfigSaved: 'Configuration des points sauvegardée ! 🎯',
    
    levelConfiguration: 'Configuration des niveaux',
    defineLevels: 'Définissez les niveaux et les points requis.',
    fromPoints: 'À partir de',
    saveLevelConfig: 'Sauvegarder la configuration des niveaux',
    levelConfigSaved: 'Configuration des niveaux sauvegardée ! ⭐',
    
    kidProfile: 'Profil de l\'enfant',
    kidProfileDescription: 'Définissez le profil de l\'enfant pour un contenu personnalisé.',
    kidName: 'Prénom de l\'enfant',
    kidAge: 'Âge',
    hobbies: 'Loisirs & Intérêts',
    hobbiesPlaceholder: 'ex. Football, Dinosaures, Espace, Peinture...',
    colorPalette: 'Palette de couleurs',
    generateCover: 'Générer l\'image de couverture',
    generatingCover: 'Génération de l\'image...',
    saveProfile: 'Sauvegarder le profil',
    profileSaved: 'Profil sauvegardé ! 🎨',
    coverGenerated: 'Image de couverture générée ! 🖼️',
    addChild: 'Ajouter un enfant',
    schoolSystem: 'Système scolaire',
    schoolClass: 'Classe',
    imageStyle: 'Style d\'image',
    
    paletteOcean: 'Océan',
    paletteSunset: 'Coucher de soleil',
    paletteForest: 'Forêt',
    paletteLavender: 'Lavande',
    paletteSunshine: 'Soleil',
  },
  
  es: {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    
    adminArea: 'Área de Administración',
    newStory: 'Crear nuevo ejercicio de lectura',
    title: 'Título',
    coverImage: 'Imagen de portada',
    selectImage: 'Seleccionar imagen',
    readingText: 'Texto de lectura',
    saveStory: 'Guardar historia',
    saving: 'Guardando...',
    existingStories: 'Historias existentes',
    noStoriesYet: 'Aún no hay historias',
    pointsConfig: 'Configuración de puntos',
    levelConfig: 'Configuración de niveles',
    settings: 'Configuración',
    account: 'Cuenta',
    
    generator: 'Generador',
    editor: 'Editar',
    library: 'Biblioteca',
    questionsReady: 'preguntas de comprensión listas',
    
    storyGenerator: 'Generador de historias',
    generateNewStory: 'Generar nueva historia con IA',
    textType: 'Tipo de texto',
    fiction: 'Ficción',
    nonFiction: 'No ficción',
    textLanguage: 'Idioma del texto',
    globalLanguage: 'Idioma global',
    childAge: 'Edad del niño',
    years: 'años',
    schoolLevel: 'Nivel escolar',
    difficulty: 'Dificultad',
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil',
    textLength: 'Longitud del texto',
    short: 'Corto',
    long: 'Largo',
    systemPrompt: 'Prompt del sistema',
    showSystemPrompt: 'Mostrar prompt del sistema',
    hideSystemPrompt: 'Ocultar prompt del sistema',
    savePrompt: 'Guardar prompt',
    generateStory: 'Generar historia',
    generating: 'Generando...',
    storyTransferred: 'La historia ha sido transferida al formulario. Ahora puedes editarla y guardarla.',
    
    enterTitleAndText: 'Por favor ingresa título y texto',
    imageUploadError: 'Error al subir la imagen',
    storySaveError: 'Error al guardar la historia',
    questionsCouldNotBeSaved: 'Las preguntas no pudieron guardarse',
    storyAndQuestionsSaved: '¡Historia y preguntas guardadas! 🎉',
    generatingQuestions: 'Generando preguntas de comprensión...',
    questionsGenerationFailed: 'Falló la generación de preguntas',
    storyDeleted: 'Historia eliminada',
    deleteError: 'Error al eliminar',
    
    pointsConfiguration: 'Configuración de puntos',
    comprehensionQuestion: 'Pregunta de comprensión',
    quizPerCorrectAnswer: 'Quiz (por respuesta correcta)',
    storyRead: 'Historia leída',
    pointsNote: 'Los puntos del quiz solo se otorgan cuando el quiz se aprueba (4/5 o 8/10).',
    savePointsConfig: 'Guardar configuración de puntos',
    errorSaving: 'Error al guardar',
    pointsConfigSaved: '¡Configuración de puntos guardada! 🎯',
    
    levelConfiguration: 'Configuración de niveles',
    defineLevels: 'Define los niveles y los puntos requeridos.',
    fromPoints: 'Desde puntos',
    saveLevelConfig: 'Guardar configuración de niveles',
    levelConfigSaved: '¡Configuración de niveles guardada! ⭐',
    
    kidProfile: 'Perfil del niño',
    kidProfileDescription: 'Define el perfil del niño para contenido personalizado.',
    kidName: 'Nombre del niño',
    kidAge: 'Edad',
    hobbies: 'Hobbies e intereses',
    hobbiesPlaceholder: 'ej. Fútbol, Dinosaurios, Espacio, Pintura...',
    colorPalette: 'Paleta de colores',
    generateCover: 'Generar imagen de portada',
    generatingCover: 'Generando imagen...',
    saveProfile: 'Guardar perfil',
    profileSaved: '¡Perfil guardado! 🎨',
    coverGenerated: '¡Imagen de portada generada! 🖼️',
    addChild: 'Añadir niño',
    schoolSystem: 'Sistema escolar',
    schoolClass: 'Grado',
    imageStyle: 'Estilo de imagen',
    
    paletteOcean: 'Océano',
    paletteSunset: 'Atardecer',
    paletteForest: 'Bosque',
    paletteLavender: 'Lavanda',
    paletteSunshine: 'Sol',
  },
  
  nl: {
    save: 'Opslaan',
    cancel: 'Annuleren',
    delete: 'Verwijderen',
    edit: 'Bewerken',
    loading: 'Laden...',
    error: 'Fout',
    success: 'Succes',
    
    adminArea: 'Admin Gebied',
    newStory: 'Nieuwe leesoefening maken',
    title: 'Titel',
    coverImage: 'Omslagafbeelding',
    selectImage: 'Afbeelding selecteren',
    readingText: 'Leestekst',
    saveStory: 'Verhaal opslaan',
    saving: 'Opslaan...',
    existingStories: 'Bestaande verhalen',
    noStoriesYet: 'Nog geen verhalen',
    pointsConfig: 'Puntenconfiguratie',
    levelConfig: 'Niveauconfiguratie',
    settings: 'Instellingen',
    account: 'Account',
    
    generator: 'Generator',
    editor: 'Bewerken',
    library: 'Bibliotheek',
    questionsReady: 'begripsvragen klaar',
    
    storyGenerator: 'Verhaalgenerator',
    generateNewStory: 'Nieuw verhaal genereren met AI',
    textType: 'Teksttype',
    fiction: 'Fictie',
    nonFiction: 'Non-fictie',
    textLanguage: 'Teksttaal',
    globalLanguage: 'Globale taal',
    childAge: 'Leeftijd kind',
    years: 'jaar',
    schoolLevel: 'Schoolniveau',
    difficulty: 'Moeilijkheid',
    easy: 'Makkelijk',
    medium: 'Gemiddeld',
    hard: 'Moeilijk',
    textLength: 'Tekstlengte',
    short: 'Kort',
    long: 'Lang',
    systemPrompt: 'Systeemprompt',
    showSystemPrompt: 'Systeemprompt tonen',
    hideSystemPrompt: 'Systeemprompt verbergen',
    savePrompt: 'Prompt opslaan',
    generateStory: 'Verhaal genereren',
    generating: 'Genereren...',
    storyTransferred: 'Verhaal is overgebracht naar het formulier. Je kunt het nu bewerken en opslaan.',
    
    enterTitleAndText: 'Voer titel en tekst in',
    imageUploadError: 'Fout bij uploaden afbeelding',
    storySaveError: 'Fout bij opslaan verhaal',
    questionsCouldNotBeSaved: 'Vragen konden niet worden opgeslagen',
    storyAndQuestionsSaved: 'Verhaal en vragen opgeslagen! 🎉',
    generatingQuestions: 'Begripsvragen genereren...',
    questionsGenerationFailed: 'Vragen genereren mislukt',
    storyDeleted: 'Verhaal verwijderd',
    deleteError: 'Fout bij verwijderen',
    
    pointsConfiguration: 'Puntenconfiguratie',
    comprehensionQuestion: 'Begripsvraag',
    quizPerCorrectAnswer: 'Quiz (per correct antwoord)',
    storyRead: 'Verhaal gelezen',
    pointsNote: 'Quizpunten worden alleen toegekend als de quiz wordt gehaald (4/5 of 8/10).',
    savePointsConfig: 'Puntenconfiguratie opslaan',
    errorSaving: 'Fout bij opslaan',
    pointsConfigSaved: 'Puntenconfiguratie opgeslagen! 🎯',
    
    levelConfiguration: 'Niveauconfiguratie',
    defineLevels: 'Definieer de niveaus en vereiste punten.',
    fromPoints: 'Vanaf punten',
    saveLevelConfig: 'Niveauconfiguratie opslaan',
    levelConfigSaved: 'Niveauconfiguratie opgeslagen! ⭐',
    
    kidProfile: 'Kindprofiel',
    kidProfileDescription: 'Definieer het profiel van het kind voor gepersonaliseerde inhoud.',
    kidName: 'Naam van het kind',
    kidAge: 'Leeftijd',
    hobbies: 'Hobby\'s & Interesses',
    hobbiesPlaceholder: 'bijv. Voetbal, Dinosaurussen, Ruimte, Schilderen...',
    colorPalette: 'Kleurenpalet',
    generateCover: 'Omslagafbeelding genereren',
    generatingCover: 'Afbeelding genereren...',
    saveProfile: 'Profiel opslaan',
    profileSaved: 'Profiel opgeslagen! 🎨',
    coverGenerated: 'Omslagafbeelding gegenereerd! 🖼️',
    addChild: 'Kind toevoegen',
    schoolSystem: 'Schoolsysteem',
    schoolClass: 'Groep',
    imageStyle: 'Afbeeldingsstijl',
    
    paletteOcean: 'Oceaan',
    paletteSunset: 'Zonsondergang',
    paletteForest: 'Bos',
    paletteLavender: 'Lavendel',
    paletteSunshine: 'Zon',
  },
};

export const getTranslations = (lang: Language): Translations => {
  return translations[lang] || translations.de;
};

export const useTranslations = (lang: Language) => {
  return getTranslations(lang);
};
