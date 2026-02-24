// i18n system — split into per-language files

export type Language = 'de' | 'en' | 'fr' | 'es' | 'nl' | 'it' | 'bs' | 'tr' | 'bg' | 'ro' | 'pl' | 'lt' | 'hu' | 'ca' | 'sl' | 'pt' | 'sk';

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
  createButton: string;
  saveConfig: string;
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
  gender: string;
  age: string;
  genderMale: string;
  genderFemale: string;
  genderDiverse: string;
  storyLanguagesLabel: string;
  storyLanguagesHint: string;
  
  // Kid Characters (Profile)
  importantCharacters: string;
  addCharacterBtn: string;
  characterType: string;
  typeFamily: string;
  typeFriend: string;
  typeKnownFigure: string;
  relationMama: string;
  relationPapa: string;
  relationBrother: string;
  relationSister: string;
  relationGrandma: string;
  relationGrandpa: string;
  relationCousin: string;
  relationCousine: string;
  relationAunt: string;
  relationUncle: string;
  characterName: string;
  characterAge: string;
  characterRelation: string;
  maxFriendsReached: string;
  
  // Accordion section titles (Kid Profile)
  accordionBasics: string;
  accordionLanguages: string;
  accordionPeople: string;
  accordionAppearance: string;
  
  // Account tab labels
  accountManagement: string;
  changeEmail: string;
  changeEmailSub: string;
  changePassword: string;
  changePasswordSub: string;
  deleteAccount: string;
  deleteAccountSub: string;
  comingSoon: string;
  adminLanguageLabel: string;
  adminLanguageSub: string;
  
  // Character duplicate warning
  characterExists: string;

  // Image styles
  imageStyleCute: string;
  imageStyleWatercolor: string;
  imageStyleComic: string;
  imageStyleRealistic: string;
  imageStyleAnime: string;
  
  // Color palettes (8 distinct)
  paletteOcean: string;
  paletteSunset: string;
  paletteForest: string;
  paletteLavender: string;
  paletteSunshine: string;
  paletteCocoa: string;
  paletteRose: string;
  paletteMidnight: string;
  
  // Story status (shared by StorySelectPage, SeriesGrid)
  statusToRead: string;
  statusCompleted: string;
  statusAlreadyRead: string;
  
  // Story difficulty (shared)
  difficultyEasy: string;
  difficultyMedium: string;
  difficultyHard: string;
  
  // Story tabs
  tabFiction: string;
  tabNonFiction: string;
  tabSeries: string;
  
  // Series
  seriesEpisode: string;
  seriesNextEpisode: string;
  seriesNoSeries: string;
  seriesGenerating: string;
  seriesReadFirst: string;
  
  // Shared page labels
  noStoriesForProfile: string;
  addStory: string;
  loadMoreStories: string;
  loadingMore: string;
  chooseStory: string;
  noCategoryStories: string;
  allStoriesRead: string;
  noStoriesRead: string;
  
  // Toast messages (shared by CreateStoryPage, StorySelectPage)
  toastGeneratingStory: string;
  toastGenerationError: string;
  toastSaveError: string;
  toastStoryCreated: string;
  
  // Wizard entry (Block 2.3e)
  wizardEntryTitle: string;
  wizardPathFree: string;
  wizardPathFreeHint: string;
  wizardPathGuided: string;
  wizardPathGuidedHint: string;
  
  // Vocabulary manage
  vocabManageTitle: string;
  vocabManageAdd: string;
  vocabManageAddPlaceholder: string;
  vocabManageAdding: string;
  vocabManageEmpty: string;
  vocabManageDelete: string;
  vocabManageDeleteConfirm: string;
  vocabManageLearned: string;
  vocabManageNotLearned: string;
  vocabManageWords: string;
  vocabWord: string;
  vocabExplanation: string;
  vocabQuizLast3: string;
  vocabAddButton: string;
  vocabCreateStoryFirst: string;
  vocabEnterWord: string;
  vocabSaveError: string;
  vocabWordAdded: string;
  vocabWordAddedCorrected: string;
  vocabDeleteError: string;
  vocabWordRemoved: string;
  vocabAllWords: string;

  // Parent Settings Panel – Learning Themes
  parentSettingsTab: string;
  learningThemesTitle: string;
  learningThemesDescription: string;
  learningThemesMax3: string;
  learningThemesLimitReached: string;
  learningFrequency: string;
  frequencyOccasional: string;
  frequencyRegular: string;
  frequencyFrequent: string;
  frequencyEvery4th: string;
  frequencyEvery3rd: string;
  frequencyEvery2nd: string;
  categorySocial: string;
  categoryEmotional: string;
  categoryCharacter: string;
  categoryCognitive: string;

  // Parent Settings Panel – Content Guardrails
  contentGuardrailsTitle: string;
  contentGuardrailsDescription: string;
  guardrailLevel1: string;
  guardrailLevel1Desc: string;
  guardrailLevel2: string;
  guardrailLevel2Desc: string;
  guardrailLevel3: string;
  guardrailLevel3Desc: string;
  guardrailLevel4: string;
  guardrailLevel4Desc: string;
  guardrailAllowed: string;
  guardrailNotAllowed: string;
  guardrailGlobalExclusions: string;
  guardrailGlobalExclusionsDesc: string;
  parentSettingsSaved: string;
  parentSettingsSaveError: string;
  noKidProfileSelected: string;

  // Level titles
  levelBuecherfuchs: string;
  levelGeschichtenentdecker: string;
  levelLeseheld: string;
  levelWortmagier: string;
  levelFablinoMeister: string;

  // Fablino messages
  fablinoWelcome: string;
  fablinoStreak: string;
  fablinoStoryDone: string;
  fablinoQuizPerfect: string;
  fablinoQuizGood: string;
  fablinoEncourage: string;
  fablinoQuizEncourage: string;
  fablinoNewSticker: string;
  fablinoLevelUp: string;
  fablinoWordLearned: string;
  fablinoWordsCount: string;
  fablinoWelcomeBack: string;
  fablinoAlreadyRead: string;

  // Pages (StickerBook, MyWords)
  stickerBook: string;
  myWords: string;
  storiesCollected: string;
  wordsKnown: string;
  stillLearning: string;
  nextStory: string;

  // Gamification UI
  stars: string;
  streak: string;
  continueButton: string;
  wordQuiz: string;
  createStory: string;
  readStory: string;

  // Word List Panel (Reading Page)
  wordsButton: string;
  wordsTitle: string;
  wordsEmpty: string;
  wordKnown: string;

  // Custom Learning Themes
  customThemeTitle: string;
  customThemePlaceholder: string;
  customThemePrepare: string;
  customThemePreparing: string;
  customThemeAccept: string;
  customThemeEdit: string;
  customThemeDelete: string;
  customThemeActive: string;

  // Subscription & Plan
  subscriptionTitle: string;
  currentPlan: string;
  freePlan: string;
  storiesPerMonth: string;
  childProfiles: string;
  imagesPerStory: string;
  allLanguages: string;
  quizzes: string;
  learningThemesFeature: string;
  chapterStories: string;
  coCreate: string;
  upgradeButton: string;
  availablePlans: string;
  selectPlan: string;
  activePlan: string;
  mostPopular: string;
  perMonth: string;
  invoices: string;
  noInvoices: string;
  betaUpgradeToast: string;

  // Hooks
  hookLoginFailed: string;
  hookProfileNotFound: string;
  hookInvalidCredentials: string;
  hookAccountMigrated: string;
  hookPerfectQuiz: string;

    // Auth & Onboarding
  authError: string;
  authFillAllFields: string;
  authInvalidEmail: string;
  authPasswordMin6: string;
  authPasswordsNoMatch: string;
  authGenericError: string;
  authTryAgain: string;
  authWelcomeSubtitle: string;
  authTabRegister: string;
  authTabLogin: string;
  authEmailLabel: string;
  authEmailPlaceholder: string;
  authPasswordLabel: string;
  authPasswordPlaceholderNew: string;
  authPasswordPlaceholderExisting: string;
  authRememberMe: string;
  authForgotPassword: string;
  authCreateAccount: string;
  authSignInButton: string;
  authLegalPrefix: string;
  authPrivacyPolicy: string;
  authAnd: string;
  authTerms: string;
  authRegFailed: string;
  authEmailAlreadyRegistered: string;
  authEmailAlreadyRegisteredTitle: string;
  authEmailAlreadyRegisteredHint: string;
  authWrongCredentials: string;
  authConfirmEmailTitle: string;
  authConfirmEmailSent: string;
  authConfirmEmailClick: string;
  authConfirmEmailSpam: string;
  authRegisterSubtitle: string;
  authNameLabel: string;
  authNamePlaceholder: string;
  authConfirmPasswordLabel: string;
  authRepeatPasswordPlaceholder: string;
  authRegCreateButton: string;
  authRegAlreadyHaveAccount: string;
  authRegWelcome: string;
  authRegSuccess: string;
  authRegInvalidEmail: string;
  authRegPasswordReq: string;
  authBackToSignIn: string;
  authEmailOrUsername: string;
  authLoginWelcome: string;
  authLoginSuccess: string;
  authLoginFailed: string;
  authLoginEnterCredentials: string;
  authNoAccount: string;
  authRegisterNow: string;
  authResetTitle: string;
  authResetDescription: string;
  authResetEmailLabel: string;
  authResetSend: string;
  authResetBackToLogin: string;
  authResetSentTitle: string;
  authResetSentDesc: string;
  authResetClickLink: string;
  authResetNoEmail: string;
  authResetCheckSpam: string;
  authResetEnterEmail: string;
  authUpdateTitle: string;
  authUpdateDescription: string;
  authUpdateNewPw: string;
  authUpdateSave: string;
  authUpdateSuccess: string;
  authUpdateSuccessDesc: string;
  authUpdateFailed: string;
  authUpdateEnterPw: string;
  authLinkInvalid: string;
  authLinkExpired: string;
  authRequestNewLink: string;
  onboardingWelcomeTitle: string;
  onboardingProfileTitle: string;
  onboardingStoryTypeTitle: string;
  onboardingAdminLangSub: string;
  onboardingProfileSub: string;
  onboardingAdminLangLabel: string;
  onboardingAdminLangHint: string;
  onboardingSelectLang: string;
  onboardingDisplayName: string;
  onboardingDisplayNameHint: string;
  onboardingDisplayNamePlaceholder: string;
  onboardingNext: string;
  onboardingBack: string;
  onboardingChildName: string;
  onboardingChildNamePlaceholder: string;
  onboardingAge: string;
  onboardingGender: string;
  onboardingGenderGirl: string;
  onboardingGenderBoy: string;
  onboardingGenderOther: string;
  onboardingSchoolLang: string;
  onboardingSchoolLangHint: string;
  onboardingExtraLangs: string;
  onboardingExtraLangsOptional: string;
  onboardingExtraLangsHint: string;
  onboardingExtraLangsPlaceholder: string;
  onboardingSelectName: string;
  onboardingSelectAge: string;
  onboardingSelectGender: string;
  onboardingSelectSchoolLang: string;
  onboardingSelectLangFirst: string;
  onboardingSelectStory: string;
  onboardingProfileSaveError: string;
  onboardingLetsGo: string;
  onboardingCategoryAdventure: string;
  onboardingCategoryFantasy: string;
  onboardingStoryLang: string;
  onboardingStoryLangHint: string;
  onboardingNotSupported: string;
  onboardingSpeechNotSupported: string;
  onboardingNoMicAccess: string;
  onboardingMicDenied: string;
  onboardingListening: string;
  onboardingStopRecording: string;
  onboardingStartRecording: string;
  onboardingStoryDone: string;
  onboardingStoryCreatingFor: string;
  onboardingStoryCreating: string;
  onboardingStoryReady: string;
  onboardingStoryRead: string;
  onboardingStoryError: string;
  onboardingStoryTryAgain: string;
  onboardingStoryRetry: string;
  onboardingStep2of2: string;
  onboardingProgress1: string;
  onboardingProgress2: string;
  onboardingProgress3: string;
  onboardingProgress4: string;


  // Hooks
  hookAuthProfileNotFound: string;
  hookAuthLoginFailed: string;
  hookAuthGenericError: string;
  hookAuthInvalidCredentials: string;
  hookAuthMigrated: string;
  hookCollectionPerfectQuiz: string;

  // ReadingPage toast/error messages
  readingStoryNotFound: string;
  readingPleaseLogin: string;
  readingEpisodeExists: string;
  readingContinuationError: string;
  readingNoStoryData: string;
  readingSaveError: string;
  readingEpisodeCreated: string;
  readingBranchSaveError: string;
  readingWordSaveError: string;
  readingWordSaved: string;
  readingYourChoices: string;
  readingSeriesPart: string;

  // CreateStoryPage
  createDailyLimitReached: string;
  createTimeoutError: string;

  // AdminPage
  adminLangUpdated: string;
  adminLangUpdateError: string;
  adminFavSaveError: string;
  adminAssignFailed: string;
  adminChildAssigned: string;
  adminStoryFor: string;
  adminSelectChild: string;
  adminSearchStories: string;
  adminFilterAll: string;
  adminNoMatches: string;
  adminAssignChild: string;
  adminNoChild: string;
  adminPoints: string;
  adminLevels: string;
  adminImageGenConfig: string;
  adminImageGenConfigDesc: string;

  // StickerBookPage
  stickerStoriesCollectedFallback: string;

}

import de from './de';
import en from './en';
import fr from './fr';
import es from './es';
import nl from './nl';
import it from './it';
import bs from './bs';
import tr from './tr';
import bg from './bg';
import ro from './ro';
import pl from './pl';
import lt from './lt';
import hu from './hu';
import ca from './ca';
import sl from './sl';
import pt from './pt';
import sk from './sk';

const translations: Record<Language, Translations> = {
  de,
  en,
  fr,
  es,
  nl,
  it,
  bs,
  tr,
  bg,
  ro,
  pl,
  lt,
  hu,
  ca,
  sl,
  pt,
  sk,
};

const FALLBACK_CHAIN: Language[] = ['en', 'de'];

export const getTranslations = (lang: Language): Translations => {
  if (translations[lang]) return translations[lang];
  for (const fb of FALLBACK_CHAIN) {
    if (translations[fb]) return translations[fb];
  }
  return translations.de;
};

export const useTranslations = (lang: Language) => {
  return getTranslations(lang);
};
