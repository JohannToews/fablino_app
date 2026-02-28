import { useState, useEffect, useCallback, useRef } from "react"; // rebuild trigger
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams, Navigate } from "react-router-dom";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";
import LeaveReadingDialog from "@/components/LeaveReadingDialog";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, X, Loader2, BookOpen, MessageCircleQuestion, CheckCircle2, HelpCircle, Save, RotateCcw, BookOpenText, ScrollText } from "lucide-react";
import ShareStoryButton from "@/components/story-sharing/ShareStoryButton";
import ComprehensionQuiz from "@/components/ComprehensionQuiz";
import QuizCompletionResult from "@/components/QuizCompletionResult";
import StoryAudioPlayer from "@/components/StoryAudioPlayer";
import StoryFeedbackDialog from "@/components/StoryFeedbackDialog";
import ReadingSettings, { FontSizeLevel, LineSpacingLevel, getReadingTextClasses } from "@/components/ReadingSettings";
import SyllableText, { countSyllables } from "@/components/SyllableText";
import { preloadSyllables, isFrenchReady, isSyllableSupported } from "@/lib/syllabify";
import { useAuth } from "@/hooks/useAuth";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useGamification } from "@/hooks/useGamification";
import FablinoReaction from "@/components/FablinoReaction";
import BadgeCelebrationModal, { EarnedBadge } from "@/components/BadgeCelebrationModal";
import PageHeader from "@/components/PageHeader";
import BackButton from "@/components/BackButton";
import { Language, getTranslations } from "@/lib/translations";
import BranchDecisionScreen from "@/components/story-creation/BranchDecisionScreen";
import type { BranchOption as BranchOptionType } from "@/components/story-creation/BranchDecisionScreen";
import ImmersiveReader from "@/components/immersive-reader/ImmersiveReader";
import WordListPanel from "@/components/WordListPanel";
import { cropComicGrids, cropComicPanels, type CroppedPanel } from "@/utils/cropComicPanels";
import { isRTL, rtlProps, rtlClasses } from "@/lib/rtlUtils";

// UI labels for word explanation popup in different languages
const readingLabels: Record<string, {
  thinking: string;
  noExplanation: string;
  retry: string;
  save: string;
  saved: string;
  explain: string;
  dismiss: string;
  touchWord: string;
  finishedReading: string;
  alreadyRead: string;
  listeningMode: string;
  comprehensionQuestions: string;
  storyCompleted: string;
  continueStory: string;
  generatingContinuation: string;
  generatingSeriesContinuation: string;
  seriesCompleted: string;
  backToLibrary: string;
  episode: string;
}> = {
  de: {
    thinking: "Ich denke nach...",
    noExplanation: "Keine Erklärung gefunden.",
    retry: "Erneut versuchen",
    save: "Speichern",
    saved: "Gespeichert!",
    explain: "Erklären",
    dismiss: "Verwerfen",
    touchWord: "Tippe auf ein Wort, um seine Bedeutung zu erfahren",
    finishedReading: "Fertig gelesen",
    alreadyRead: "Bereits gelesen ✓",
    listeningMode: "Höre die Geschichte...",
    comprehensionQuestions: "Verständnisfragen",
    storyCompleted: "Super! Du hast fertig gelesen!",
    continueStory: "Wie geht es weiter?",
    generatingContinuation: "Fortsetzung wird erstellt...",
    generatingSeriesContinuation: "Fablino schreibt das nächste Kapitel...",
    seriesCompleted: "Serie abgeschlossen! 🦊🎉",
    backToLibrary: "Zurück zur Bibliothek",
    episode: "Episode",
  },
  fr: {
    thinking: "Je réfléchis...",
    noExplanation: "Pas d'explication trouvée.",
    retry: "Réessayer",
    save: "Sauvegarder",
    saved: "Sauvegardé!",
    explain: "Expliquer",
    dismiss: "Fermer",
    touchWord: "Touche un mot pour découvrir sa signification",
    finishedReading: "J'ai fini de lire",
    alreadyRead: "Déjà lu ✓",
    listeningMode: "Écoute l'histoire...",
    comprehensionQuestions: "Questions de compréhension",
    storyCompleted: "Super! Tu as fini de lire!",
    continueStory: "Que se passe-t-il ensuite?",
    generatingContinuation: "Création de la suite...",
    generatingSeriesContinuation: "Fablino écrit le prochain chapitre...",
    seriesCompleted: "Série terminée ! 🦊🎉",
    backToLibrary: "Retour à la bibliothèque",
    episode: "Épisode",
  },
  en: {
    thinking: "Thinking...",
    noExplanation: "No explanation found.",
    retry: "Try again",
    save: "Save",
    saved: "Saved!",
    explain: "Explain",
    dismiss: "Dismiss",
    touchWord: "Tap a word to discover its meaning",
    finishedReading: "I finished reading",
    alreadyRead: "Already read ✓",
    listeningMode: "Listen to the story...",
    comprehensionQuestions: "Comprehension questions",
    storyCompleted: "Great! You finished reading!",
    continueStory: "What happens next?",
    generatingContinuation: "Creating continuation...",
    generatingSeriesContinuation: "Fablino is writing the next chapter...",
    seriesCompleted: "Series completed! 🦊🎉",
    backToLibrary: "Back to library",
    episode: "Episode",
  },
  es: {
    thinking: "Pensando...",
    noExplanation: "No se encontró explicación.",
    retry: "Reintentar",
    save: "Guardar",
    saved: "¡Guardado!",
    explain: "Explicar",
    dismiss: "Descartar",
    touchWord: "Toca una palabra para descubrir su significado",
    finishedReading: "Terminé de leer",
    alreadyRead: "Ya leído ✓",
    listeningMode: "Escucha la historia...",
    comprehensionQuestions: "Preguntas de comprensión",
    storyCompleted: "¡Genial! ¡Terminaste de leer!",
    continueStory: "¿Qué pasa después?",
    generatingContinuation: "Creando continuación...",
    generatingSeriesContinuation: "Fablino está escribiendo el siguiente capítulo...",
    seriesCompleted: "¡Serie completada! 🦊🎉",
    backToLibrary: "Volver a la biblioteca",
    episode: "Episodio",
  },
  nl: {
    thinking: "Ik denk na...",
    noExplanation: "Geen uitleg gevonden.",
    retry: "Opnieuw proberen",
    save: "Opslaan",
    saved: "Opgeslagen!",
    explain: "Uitleggen",
    dismiss: "Sluiten",
    touchWord: "Tik op een woord om de betekenis te ontdekken",
    finishedReading: "Ik ben klaar met lezen",
    alreadyRead: "Al gelezen ✓",
    listeningMode: "Luister naar het verhaal...",
    comprehensionQuestions: "Begripsvragen",
    storyCompleted: "Super! Je bent klaar met lezen!",
    continueStory: "Wat gebeurt er nu?",
    generatingContinuation: "Vervolg wordt gemaakt...",
    generatingSeriesContinuation: "Fablino schrijft het volgende hoofdstuk...",
    seriesCompleted: "Serie voltooid! 🦊🎉",
    backToLibrary: "Terug naar de bibliotheek",
    episode: "Aflevering",
  },
  it: {
    thinking: "Sto pensando...",
    noExplanation: "Nessuna spiegazione trovata.",
    retry: "Riprova",
    save: "Salva",
    saved: "Salvato!",
    explain: "Spiega",
    dismiss: "Chiudi",
    touchWord: "Tocca una parola per scoprire il suo significato",
    finishedReading: "Ho finito di leggere",
    alreadyRead: "Già letto ✓",
    listeningMode: "Ascolta la storia...",
    comprehensionQuestions: "Domande di comprensione",
    storyCompleted: "Fantastico! Hai finito di leggere!",
    continueStory: "Cosa succede dopo?",
    generatingContinuation: "Creazione del seguito...",
    generatingSeriesContinuation: "Fablino sta scrivendo il prossimo capitolo...",
    seriesCompleted: "Serie completata! 🦊🎉",
    backToLibrary: "Torna alla biblioteca",
    episode: "Episodio",
  },
  bs: {
    thinking: "Razmišljam...",
    noExplanation: "Objašnjenje nije pronađeno.",
    retry: "Pokušaj ponovo",
    save: "Sačuvaj",
    saved: "Sačuvano!",
    explain: "Objasni",
    dismiss: "Odbaci",
    touchWord: "Dodirni riječ da saznaš njeno značenje",
    finishedReading: "Završio/la sam čitanje",
    alreadyRead: "Već pročitano ✓",
    listeningMode: "Slušaj priču...",
    comprehensionQuestions: "Pitanja razumijevanja",
    storyCompleted: "Super! Završio/la si čitanje!",
    continueStory: "Šta se dalje dešava?",
    generatingContinuation: "Kreiranje nastavka...",
    generatingSeriesContinuation: "Fablino piše sljedeće poglavlje...",
    seriesCompleted: "Serija završena! 🦊🎉",
    backToLibrary: "Nazad u biblioteku",
    episode: "Epizoda",
  },
  pt: {
    thinking: "A pensar...",
    noExplanation: "Nenhuma explicação encontrada.",
    retry: "Tentar novamente",
    save: "Guardar",
    saved: "Guardado!",
    explain: "Explicar",
    dismiss: "Descartar",
    touchWord: "Toca numa palavra para descobrir o seu significado",
    finishedReading: "Acabei de ler",
    alreadyRead: "Já lido ✓",
    listeningMode: "Ouve a história...",
    comprehensionQuestions: "Perguntas de compreensão",
    storyCompleted: "Ótimo! Acabaste de ler!",
    continueStory: "O que acontece a seguir?",
    generatingContinuation: "A criar continuação...",
    generatingSeriesContinuation: "O Fablino está a escrever o próximo capítulo...",
    seriesCompleted: "Série concluída! 🦊🎉",
    backToLibrary: "Voltar à biblioteca",
    episode: "Episódio",
  },
  sk: {
    thinking: "Premýšľam...",
    noExplanation: "Vysvetlenie sa nenašlo.",
    retry: "Skúsiť znova",
    save: "Uložiť",
    saved: "Uložené!",
    explain: "Vysvetliť",
    dismiss: "Zavrieť",
    touchWord: "Ťukni na slovo a zisti jeho význam",
    finishedReading: "Dočítal/a som",
    alreadyRead: "Už prečítané ✓",
    listeningMode: "Počúvaj príbeh...",
    comprehensionQuestions: "Otázky na porozumenie",
    storyCompleted: "Super! Dočítal/a si!",
    continueStory: "Čo sa stane ďalej?",
    generatingContinuation: "Vytvára sa pokračovanie...",
    generatingSeriesContinuation: "Fablino píše ďalšiu kapitolu...",
    seriesCompleted: "Séria dokončená! 🦊🎉",
    backToLibrary: "Späť do knižnice",
    episode: "Epizóda",
  },
  tr: {
    thinking: "Düşünüyorum...",
    noExplanation: "Açıklama bulunamadı.",
    retry: "Tekrar dene",
    save: "Kaydet",
    saved: "Kaydedildi!",
    explain: "Açıkla",
    dismiss: "Kapat",
    touchWord: "Anlamını öğrenmek için bir kelimeye dokun",
    finishedReading: "Okumayı bitirdim",
    alreadyRead: "Zaten okundu ✓",
    listeningMode: "Hikâyeyi dinle...",
    comprehensionQuestions: "Anlama soruları",
    storyCompleted: "Harika! Okumayı bitirdin!",
    continueStory: "Sonra ne olacak?",
    generatingContinuation: "Devamı oluşturuluyor...",
    generatingSeriesContinuation: "Fablino bir sonraki bölümü yazıyor...",
    seriesCompleted: "Seri tamamlandı! 🦊🎉",
    backToLibrary: "Kütüphaneye dön",
    episode: "Bölüm",
  },
  bg: {
    thinking: "Мисля...",
    noExplanation: "Не е намерено обяснение.",
    retry: "Опитай отново",
    save: "Запази",
    saved: "Запазено!",
    explain: "Обясни",
    dismiss: "Затвори",
    touchWord: "Докосни дума, за да разбереш значението ѝ",
    finishedReading: "Приключих с четенето",
    alreadyRead: "Вече прочетено ✓",
    listeningMode: "Слушай историята...",
    comprehensionQuestions: "Въпроси за разбиране",
    storyCompleted: "Страхотно! Приключи с четенето!",
    continueStory: "Какво следва?",
    generatingContinuation: "Създава се продължение...",
    generatingSeriesContinuation: "Фаблино пише следващата глава...",
    seriesCompleted: "Серията е завършена! 🦊🎉",
    backToLibrary: "Обратно към библиотеката",
    episode: "Епизод",
  },
  ro: {
    thinking: "Mă gândesc...",
    noExplanation: "Nu s-a găsit nicio explicație.",
    retry: "Încearcă din nou",
    save: "Salvează",
    saved: "Salvat!",
    explain: "Explică",
    dismiss: "Închide",
    touchWord: "Atinge un cuvânt pentru a-i descoperi sensul",
    finishedReading: "Am terminat de citit",
    alreadyRead: "Deja citit ✓",
    listeningMode: "Ascultă povestea...",
    comprehensionQuestions: "Întrebări de înțelegere",
    storyCompleted: "Super! Ai terminat de citit!",
    continueStory: "Ce se întâmplă mai departe?",
    generatingContinuation: "Se creează continuarea...",
    generatingSeriesContinuation: "Fablino scrie următorul capitol...",
    seriesCompleted: "Serie completă! 🦊🎉",
    backToLibrary: "Înapoi la bibliotecă",
    episode: "Episod",
  },
  pl: {
    thinking: "Myślę...",
    noExplanation: "Nie znaleziono wyjaśnienia.",
    retry: "Spróbuj ponownie",
    save: "Zapisz",
    saved: "Zapisano!",
    explain: "Wyjaśnij",
    dismiss: "Odrzuć",
    touchWord: "Dotknij słowa, aby poznać jego znaczenie",
    finishedReading: "Skończyłem/am czytać",
    alreadyRead: "Już przeczytane ✓",
    listeningMode: "Posłuchaj opowieści...",
    comprehensionQuestions: "Pytania ze zrozumienia",
    storyCompleted: "Super! Skończyłeś/aś czytać!",
    continueStory: "Co będzie dalej?",
    generatingContinuation: "Tworzenie kontynuacji...",
    generatingSeriesContinuation: "Fablino pisze kolejny rozdział...",
    seriesCompleted: "Seria ukończona! 🦊🎉",
    backToLibrary: "Powrót do biblioteki",
    episode: "Odcinek",
  },
  lt: {
    thinking: "Galvoju...",
    noExplanation: "Paaiškinimas nerastas.",
    retry: "Bandyti dar kartą",
    save: "Išsaugoti",
    saved: "Išsaugota!",
    explain: "Paaiškinti",
    dismiss: "Atmesti",
    touchWord: "Palieskite žodį, kad sužinotumėte jo reikšmę",
    finishedReading: "Baigiau skaityti",
    alreadyRead: "Jau perskaityta ✓",
    listeningMode: "Klausyk istorijos...",
    comprehensionQuestions: "Supratimo klausimai",
    storyCompleted: "Puiku! Baigei skaityti!",
    continueStory: "Kas bus toliau?",
    generatingContinuation: "Kuriamas tęsinys...",
    generatingSeriesContinuation: "Fablino rašo kitą skyrių...",
    seriesCompleted: "Serija baigta! 🦊🎉",
    backToLibrary: "Grįžti į biblioteką",
    episode: "Epizodas",
  },
  hu: {
    thinking: "Gondolkodom...",
    noExplanation: "Nem található magyarázat.",
    retry: "Próbáld újra",
    save: "Mentés",
    saved: "Mentve!",
    explain: "Magyarázd el",
    dismiss: "Elvetés",
    touchWord: "Érintsd meg a szót, hogy megtudd a jelentését",
    finishedReading: "Befejeztem az olvasást",
    alreadyRead: "Már olvasva ✓",
    listeningMode: "Hallgasd a történetet...",
    comprehensionQuestions: "Megértési kérdések",
    storyCompleted: "Szuper! Befejezted az olvasást!",
    continueStory: "Mi történik ezután?",
    generatingContinuation: "Folytatás készítése...",
    generatingSeriesContinuation: "Fablino írja a következő fejezetet...",
    seriesCompleted: "Sorozat befejezve! 🦊🎉",
    backToLibrary: "Vissza a könyvtárba",
    episode: "Epizód",
  },
  ca: {
    thinking: "Estic pensant...",
    noExplanation: "No s'ha trobat cap explicació.",
    retry: "Torna-ho a provar",
    save: "Desa",
    saved: "Desat!",
    explain: "Explica",
    dismiss: "Descarta",
    touchWord: "Toca una paraula per descobrir el seu significat",
    finishedReading: "He acabat de llegir",
    alreadyRead: "Ja llegit ✓",
    listeningMode: "Escolta la història...",
    comprehensionQuestions: "Preguntes de comprensió",
    storyCompleted: "Genial! Has acabat de llegir!",
    continueStory: "Què passa després?",
    generatingContinuation: "Creant la continuació...",
    generatingSeriesContinuation: "Fablino està escrivint el proper capítol...",
    seriesCompleted: "Sèrie completada! 🦊🎉",
    backToLibrary: "Tornar a la biblioteca",
    episode: "Episodi",
  },
  sl: {
    thinking: "Razmišljam...",
    noExplanation: "Razlaga ni bila najdena.",
    retry: "Poskusi znova",
    save: "Shrani",
    saved: "Shranjeno!",
    explain: "Razloži",
    dismiss: "Opusti",
    touchWord: "Dotakni se besede, da izveš njen pomen",
    finishedReading: "Končal/a sem z branjem",
    alreadyRead: "Že prebrano ✓",
    listeningMode: "Poslušaj zgodbo...",
    comprehensionQuestions: "Vprašanja za razumevanje",
    storyCompleted: "Super! Končal/a si z branjem!",
    continueStory: "Kaj se zgodi potem?",
    generatingContinuation: "Ustvarjanje nadaljevanja...",
    generatingSeriesContinuation: "Fablino piše naslednje poglavje...",
    seriesCompleted: "Serija zaključena! 🦊🎉",
    backToLibrary: "Nazaj v knjižnico",
    episode: "Epizoda",
  },
  uk: {
    thinking: "Думаю...",
    noExplanation: "Пояснення не знайдено.",
    retry: "Спробувати знову",
    save: "Зберегти",
    saved: "Збережено!",
    explain: "Пояснити",
    dismiss: "Закрити",
    touchWord: "Натисни на слово, щоб дізнатися його значення",
    finishedReading: "Прочитав/ла",
    alreadyRead: "Вже прочитано ✓",
    listeningMode: "Слухай історію...",
    comprehensionQuestions: "Питання на розуміння",
    storyCompleted: "Супер! Ти прочитав/ла!",
    continueStory: "Що далі?",
    generatingContinuation: "Створення продовження...",
    generatingSeriesContinuation: "Фабліно пише наступний розділ...",
    seriesCompleted: "Серію завершено! 🦊🎉",
    backToLibrary: "Назад до бібліотеки",
    episode: "Серія",
  },
  ru: {
    thinking: "Думаю...",
    noExplanation: "Объяснение не найдено.",
    retry: "Попробовать снова",
    save: "Сохранить",
    saved: "Сохранено!",
    explain: "Объяснить",
    dismiss: "Закрыть",
    touchWord: "Нажми на слово, чтобы узнать его значение",
    finishedReading: "Прочитал/а",
    alreadyRead: "Уже прочитано ✓",
    listeningMode: "Слушай историю...",
    comprehensionQuestions: "Вопросы на понимание",
    storyCompleted: "Супер! Ты прочитал/а!",
    continueStory: "Что дальше?",
    generatingContinuation: "Создание продолжения...",
    generatingSeriesContinuation: "Фабліно пишет следующую главу...",
    seriesCompleted: "Серия завершена! 🦊🎉",
    backToLibrary: "Назад в библиотеку",
    episode: "Серия",
  },
};

interface Story {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  difficulty?: string;
  story_images?: string[] | null;
  text_type?: string;
  text_language?: string;
  prompt?: string;
  ending_type?: 'A' | 'B' | 'C' | null;
  episode_number?: number | null;
  series_id?: string | null;
  series_mode?: 'normal' | 'interactive' | null;
  kid_profile_id?: string | null;
  completed?: boolean | null;
  comic_full_image?: string | null;
  comic_full_image_2?: string | null;
  comic_layout_key?: string | null;
  comic_panel_count?: number | null;
  comic_grid_plan?: any | null;
}

interface BranchOption {
  option_id: string;
  title: string;
  preview: string;
  direction: string;
  image_hint?: string;
}


const ReadingPage = () => {
  const { user } = useAuth();
  const { selectedProfile, kidAppLanguage, kidExplanationLanguage } = useKidProfile();
  const { actions, pendingLevelUp, clearPendingLevelUp, starRewards, state: gamificationState, refreshProgress } = useGamification();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  // ── View Mode: immersive or classic ─────────────────────
  // Classic reader is the default for ALL users (including admin).
  // Admin can switch to immersive via toggle; non-admin cannot.
  const isAdmin = user?.role === 'admin';
  const modeParam = searchParams.get('mode');
  const [viewMode, setViewMode] = useState<'immersive' | 'classic'>(
    modeParam === 'immersive' && isAdmin ? 'immersive' : 'classic'
  );

  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comicCroppedPanels, setComicCroppedPanels] = useState<string[] | null>(null);
  const [comicCroppedPanelsWithMeta, setComicCroppedPanelsWithMeta] = useState<CroppedPanel[] | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanationError, setExplanationError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Session-only marked positions (visual highlighting only for current session)
  const [singleWordPositions, setSingleWordPositions] = useState<Set<string>>(new Set());
  const [phrasePositions, setPhrasePositions] = useState<Set<string>>(new Set());
  const [markedTexts, setMarkedTexts] = useState<Map<string, string>>(new Map());
  // Saved positions (permanently marked after saving)
  const [savedSingleWordPositions, setSavedSingleWordPositions] = useState<Set<string>>(new Set());
  const [savedPhrasePositions, setSavedPhrasePositions] = useState<Set<string>>(new Set());
  // DB cached explanations (for avoiding re-fetching from LLM)
  const [cachedExplanations, setCachedExplanations] = useState<Map<string, string>>(new Map());
  // Total marked words count from DB (for display)
  const [totalMarkedCount, setTotalMarkedCount] = useState(0);
  const [showWordPanel, setShowWordPanel] = useState(false);
  // Current text selection for phrase marking
  const [currentSelection, setCurrentSelection] = useState<string | null>(null);
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  // Show comprehension quiz after reading
  const [showQuiz, setShowQuiz] = useState(false);
  const [hasQuestions, setHasQuestions] = useState(false);
  // Quiz completion state
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResult, setQuizResult] = useState<{ correctCount: number; totalCount: number; starsEarned: number } | null>(null);
  // Current word position for saving
  const [currentPositionKey, setCurrentPositionKey] = useState<string | null>(null);
  // Mobile popup position (Y coordinate for positioning)
  const [mobilePopupY, setMobilePopupY] = useState<number | null>(null);
  // Current unsaved positions (to clear when selecting new word)
  const [unsavedPositions, setUnsavedPositions] = useState<Set<string>>(new Set());
  // Audio listening mode
  const [isListeningMode, setIsListeningMode] = useState(false);
  // Feedback dialog state
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  // Story prompt (from generator if available)
  const [storyPrompt, setStoryPrompt] = useState<string | undefined>(undefined);
  // Reading settings (font size and line spacing)
  const [fontSize, setFontSize] = useState<FontSizeLevel>(2);
  const [lineSpacing, setLineSpacing] = useState<LineSpacingLevel>(2);
  // Syllable mode for reading assistance
  const [syllableMode, setSyllableMode] = useState(false);
  const [syllablesReady, setSyllablesReady] = useState(true);
  // Badge celebration
  const [pendingBadges, setPendingBadges] = useState<EarnedBadge[]>([]);
  // Track if story is already marked as read
  const [isMarkedAsRead, setIsMarkedAsRead] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  // Series continuation state
  const [isGeneratingContinuation, setIsGeneratingContinuation] = useState(false);
  // AbortController for continuation generation — prevents orphaned requests
  const abortControllerRef = useRef<AbortController | null>(null);
  useEffect(() => { return () => { abortControllerRef.current?.abort(); }; }, []);
  // Interactive series: branch options for current episode
  const [branchOptions, setBranchOptions] = useState<BranchOption[] | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null); // story_branches row id
  const [showBranchDecision, setShowBranchDecision] = useState(false); // show decision screen before quiz
  const [branchChosen, setBranchChosen] = useState(false); // child has picked an option
  // Interactive series finale: all past choices for recap
  const [branchHistory, setBranchHistory] = useState<{ episode_number: number; chosen_title: string }[]>([]);
  // System prompt for story generation
  const [customSystemPrompt, setCustomSystemPrompt] = useState("");
  // Fablino feedback overlay
  const [fablinoReaction, setFablinoReaction] = useState<{
    type: 'celebrate' | 'encourage' | 'perfect';
    message: string;
    stars?: number;
    autoClose?: number;
  } | null>(null);

  // Get text language from story for UI labels and explanations
  const textLang = story?.text_language || 'fr';
  const t = getTranslations(kidAppLanguage as Language);

  // ── Navigation Guard: prevent accidental exits while reading ──
  const shouldBlockNavigation = !!story && !isMarkedAsRead && !isGeneratingContinuation;
  const blocker = useNavigationGuard(shouldBlockNavigation);

  useEffect(() => {
    if (id) {
      loadStory();
      loadCachedExplanations();
      checkForQuestions();
    }
  }, [id]);

  // Optional: load Farsi (Vazirmatn) font when story is RTL
  useEffect(() => {
    if (!isRTL(story?.text_language)) return;
    const id = 'vazirmatn-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.href = 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, [story?.text_language]);

  // FR syllable preload: cache words when syllable mode is enabled for a French story
  useEffect(() => {
    if (!story || !syllableMode) return;
    const lang = (story.text_language || 'de').toLowerCase().substring(0, 2);
    if (lang !== 'fr') {
      setSyllablesReady(true);
      return;
    }
    if (isFrenchReady()) {
      setSyllablesReady(true);
      return;
    }
    setSyllablesReady(false);
    let cancelled = false;
    preloadSyllables(storyContent, 'fr').then(() => {
      if (!cancelled) setSyllablesReady(true);
    });
    return () => { cancelled = true; };
  }, [story?.id, story?.text_language, syllableMode]);

  const effectiveSyllableMode = syllableMode && syllablesReady;

  // Load system prompt for continuation
  useEffect(() => {
    const loadSystemPrompt = async () => {
      const promptKey = `system_prompt_${kidAppLanguage}`;
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", promptKey)
        .maybeSingle();

      if (data) {
        setCustomSystemPrompt(data.value);
      }
    };
    loadSystemPrompt();
  }, [kidAppLanguage]);

  const checkForQuestions = async () => {
    const { count } = await supabase
      .from("comprehension_questions")
      .select("*", { count: "exact", head: true })
      .eq("story_id", id);
    
    setHasQuestions((count || 0) > 0);
  };

  // Listen for selection changes - improved for tablet touch
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        // Don't hide immediately - give time for button click
        return;
      }

      const selectedText = selection.toString().trim();
      
      // Only show button for selections with at least 2 words
      const wordCount = selectedText.split(/\s+/).filter(w => w.length > 0).length;
      if (!selectedText || wordCount < 2) {
        setCurrentSelection(null);
        setSelectionPosition(null);
        return;
      }

      // Check if selection is within our text container
      if (textContainerRef.current) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = textContainerRef.current.getBoundingClientRect();
        
        // Check if selection is inside the container
        if (rect.top >= containerRect.top - 50 && rect.bottom <= containerRect.bottom + 100) {
          setCurrentSelection(selectedText);
          setSelectionRange(range.cloneRange());
          // Position button above selection, centered
          setSelectionPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 15
          });
        }
      }
    };

    // Use both selectionchange and mouseup/touchend for better tablet support
    document.addEventListener('selectionchange', handleSelectionChange);
    
    const handleTouchEnd = () => {
      setTimeout(handleSelectionChange, 100);
    };
    
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('mouseup', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mouseup', handleSelectionChange);
    };
  }, []);

  // Clear selection button when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-selection-button]') && !window.getSelection()?.toString().trim()) {
        setCurrentSelection(null);
        setSelectionPosition(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const loadStory = async () => {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("id", id)
      .single();
    
    if (data) {
      setStory(data as Story);
      if (data.completed) setIsMarkedAsRead(true);
      if (data.prompt) {
        setStoryPrompt(data.prompt);
      }
      // Load branch options for interactive series (Ep1-4)
      // Check both series_mode AND story_branches table (defensive: series_mode may be null due to earlier bug)
      if ((data.episode_number || 0) >= 1 && (data.episode_number || 0) < 5) {
        const { data: branchData } = await supabase
          .from("story_branches")
          .select("id, options, chosen_option_id")
          .eq("story_id", data.id)
          .maybeSingle();
        if (branchData && branchData.options && !branchData.chosen_option_id) {
          setBranchOptions(branchData.options as unknown as BranchOption[]);
          setBranchId(branchData.id);
          console.log('[ReadingPage] Loaded branch options for story', data.id, ':', (branchData.options as any[]).length, 'options');
        } else {
          setBranchOptions(null);
          setBranchId(null);
        }
      }
      // Load branch history for interactive series finale (Ep5)
      const isInteractive = (data as any).series_mode === 'interactive';
      if (isInteractive && (data.episode_number || 0) >= 5 && data.series_id) {
        const { data: allBranches } = await (supabase as any)
          .from("story_branches")
          .select("episode_number, options, chosen_option_id")
          .eq("series_id", data.series_id)
          .order("episode_number", { ascending: true });
        if (allBranches) {
          const history = allBranches
            .filter((b: any) => b.chosen_option_id && b.options)
            .map((b: any) => {
              const opts = b.options as BranchOption[];
              const chosen = opts.find((o) => o.option_id === b.chosen_option_id);
              return {
                episode_number: b.episode_number,
                chosen_title: chosen?.title || b.chosen_option_id,
              };
            });
          setBranchHistory(history);
        }
      }
    } else {
      toast.error(t.readingStoryNotFound);
      navigate("/stories");
    }
    setIsLoading(false);
  };

  // ── Comic-Strip Frontend Cropping (supports 8-panel dual-grid) ──
  useEffect(() => {
    if (!story?.comic_full_image) {
      setComicCroppedPanels(null);
      setComicCroppedPanelsWithMeta(null);
      return;
    }

    let cancelled = false;

    // New path: comic_grid_plan exists → use cropComicGrids for 8-panel support
    if (story.comic_grid_plan) {
      console.log('[ReadingPage] Starting cropComicGrids with grid_plan', {
        grid1: story.comic_full_image?.substring(0, 60),
        grid2: story.comic_full_image_2?.substring(0, 60),
        planKeys: Object.keys(story.comic_grid_plan),
      });
      cropComicGrids(
        story.comic_full_image!,
        story.comic_full_image_2 || null,
        story.comic_grid_plan,
      ).then(panels => {
        console.log('[ReadingPage] cropComicGrids SUCCESS:', panels.length, 'panels');
        if (!cancelled) {
          setComicCroppedPanelsWithMeta(panels);
          setComicCroppedPanels(panels.map(p => p.dataUrl));
        }
      }).catch(err => {
        console.error('[ReadingPage] Comic grid cropping failed, using fallback', err);
        if (!cancelled) {
          setComicCroppedPanels(null);
          setComicCroppedPanelsWithMeta(null);
        }
      });
    } else if (story.comic_layout_key) {
      // Legacy path: crop without plan metadata, but support dual grids
      (async () => {
        const panels1 = await cropComicPanels(story.comic_full_image!, story.comic_layout_key!);
        if (story.comic_full_image_2) {
          const panels2 = await cropComicPanels(story.comic_full_image_2, story.comic_layout_key!);
          return [...panels1, ...panels2];
        }
        return panels1;
      })().then(panels => {
        if (!cancelled) {
          setComicCroppedPanels(panels);
          setComicCroppedPanelsWithMeta(null);
        }
      }).catch(err => {
        console.error('[ReadingPage] Comic cropping failed, using fallback', err);
        if (!cancelled) {
          setComicCroppedPanels(null);
          setComicCroppedPanelsWithMeta(null);
        }
      });
    } else {
      setComicCroppedPanels(null);
      setComicCroppedPanelsWithMeta(null);
    }

    return () => { cancelled = true; };
  }, [story?.comic_full_image, story?.comic_full_image_2, story?.comic_layout_key, story?.comic_grid_plan]);

  // Handle series continuation
  const handleContinueSeries = async () => {
    if (!user?.id) {
      toast.error(t.readingPleaseLogin);
      return;
    }
    // Allow continuation from Episode 1 (series_id is null, but episode_number is 1)
    if (!story) return;
    if (!story.series_id && !story.episode_number) return;

    setIsGeneratingContinuation(true);
    toast.info(readingLabels[textLang]?.generatingSeriesContinuation || readingLabels[textLang]?.generatingContinuation || "Creating continuation...");

    try {
      console.log("Starting continuation generation...");
      console.log("User ID:", user?.id);
      console.log("Story:", story?.id, story?.series_id, story?.episode_number);
      
      const nextEpisodeNumber = (story.episode_number || 1) + 1;
      console.log("Next episode:", nextEpisodeNumber);

      // Check if episode already exists (race condition protection)
      const { data: existingEpisode } = await supabase
        .from("stories")
        .select("id")
        .eq("series_id", story.series_id || story.id)
        .eq("episode_number", nextEpisodeNumber)
        .maybeSingle();
      
      if (existingEpisode) {
        console.log("Episode already exists, navigating to it");
        toast.info(t.readingEpisodeExists);
        navigate(`/read/${existingEpisode.id}`);
        setIsGeneratingContinuation(false);
        return;
      }
      
      // Create continuation prompt with previous story context
      const continuationPrompt = `Fortsetzung von "${story.title}" (Episode ${story.episode_number || 1}):\n\nVorherige Geschichte (Zusammenfassung):\n${storyContent.slice(0, 500)}...\n\nUrsprüngliche Idee: ${story.prompt || ""}`;

      // B-14: Placeholder story row for incremental status/metrics
      let placeholderStoryIdReading: string | null = null;
      const { data: placeholderRowReading, error: placeholderErrReading } = await supabase
        .from("stories")
        .insert({
          title: "Generating...",
          content: "",
          user_id: user.id,
          kid_profile_id: story.kid_profile_id,
          generation_status: "generating",
          difficulty: story.difficulty || "medium",
          text_type: story.text_type || "fiction",
          text_language: story.text_language || "de",
          prompt: story.prompt,
          ending_type: nextEpisodeNumber >= 5 ? "A" : "C",
          episode_number: nextEpisodeNumber,
          story_length: (story as any).story_length || "medium",
          series_id: story.series_id || story.id,
          series_mode: story.series_mode || null,
        })
        .select("id")
        .single();
      if (!placeholderErrReading && placeholderRowReading?.id) placeholderStoryIdReading = placeholderRowReading.id;

      // Call generate-story with continuation context (120s timeout)
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), 120_000);
      console.log("Calling generate-story edge function...");
      const { data, error } = await supabase.functions.invoke("generate-story", {
        body: {
          length: "medium",
          difficulty: story.difficulty || "medium",
          description: continuationPrompt,
          textType: story.text_type || "fiction",
          textLanguage: (story.text_language || "de").toUpperCase(),
          customSystemPrompt,
          endingType: nextEpisodeNumber >= 5 ? "A" : "C", // Finale at Episode 5
          episodeNumber: nextEpisodeNumber,
          previousStoryId: story.id,
          seriesId: story.series_id || story.id, // First episode uses own id as series_id
          userId: user?.id,
          isSeries: true,
          seriesMode: story.series_mode || 'normal',
          storyLength: (story as any).story_length || 'medium',
          storyLanguage: story.text_language || "de",
          kidProfileId: story.kid_profile_id,
          ...(placeholderStoryIdReading ? { story_id: placeholderStoryIdReading } : {}),
        },
      });
      clearTimeout(timeoutId);

      console.log("Edge function response - error:", error);
      console.log("Edge function response - data keys:", data ? Object.keys(data) : "null");
      console.log("Edge function response - title:", data?.title);
      console.log("Edge function response - has content:", !!data?.content);
      // ── SERIES-DEBUG: Log series fields from Edge Function response ──
      console.log("[SERIES-DEBUG] Edge Function response series fields:", {
        episode_summary: data?.episode_summary ?? "MISSING",
        episode_summary_type: typeof data?.episode_summary,
        continuity_state: data?.continuity_state ? JSON.stringify(data.continuity_state).substring(0, 200) : "MISSING",
        continuity_state_type: typeof data?.continuity_state,
        visual_style_sheet: data?.visual_style_sheet ? "present" : "MISSING",
        usedNewPromptPath: data?.usedNewPromptPath,
      });

      if (error) {
        console.error("Generation error:", error);
        toast.error(t.readingContinuationError + ": " + (error.message || JSON.stringify(error)));
        return;
      }

      if (data?.error) {
        console.error("API error:", data.error);
        toast.error(data.error);
        return;
      }

      if (!user?.id) {
        console.error("User not authenticated");
        toast.error(t.readingPleaseLogin);
        return;
      }
      
      if (!data?.title || !data?.content) {
        console.error("Missing title or content in response:", data);
        toast.error(t.readingNoStoryData);
        return;
      }

      if (data?.title && data?.content) {
      // B-14: Update placeholder or insert (continuation). When updating, omit image fields so we keep EF Phase 3 write.
      const useUpdateReading = !!(placeholderStoryIdReading && (data.story_id ?? placeholderStoryIdReading));
      const basePayload = {
        title: data.title,
        content: data.content,
        difficulty: story.difficulty,
        text_type: story.text_type || "fiction",
        text_language: story.text_language,
        prompt: story.prompt,
        user_id: user.id,
        kid_profile_id: story.kid_profile_id,
        ending_type: (nextEpisodeNumber >= 5 ? "A" : "C") as "A" | "B" | "C",
        episode_number: nextEpisodeNumber,
        story_length: (story as any).story_length || 'medium',
        series_id: story.series_id || story.id,
        series_mode: data.series_mode || story.series_mode || null,
        episode_summary: data.episode_summary ?? null,
        continuity_state: data.continuity_state ?? null,
        visual_style_sheet: data.visual_style_sheet ?? null,
        image_style_key: data.image_style_key ?? null,
        generation_status: data.imageWarning ? (data.imageWarning === 'cover_generation_failed' ? 'images_failed' : 'images_partial') : 'verified',
        structure_beginning: data.structure_beginning ?? null,
        structure_middle: data.structure_middle ?? null,
        structure_ending: data.structure_ending ?? null,
        emotional_coloring: data.emotional_coloring ?? null,
        emotional_secondary: data.emotional_secondary ?? null,
        humor_level: data.humor_level ?? null,
        emotional_depth: data.emotional_depth ?? null,
        moral_topic: data.moral_topic ?? null,
        concrete_theme: data.concrete_theme ?? null,
        learning_theme_applied: data.learning_theme_applied ?? null,
        parent_prompt_text: data.parent_prompt_text ?? null,
        generation_time_ms: data.performance?.total_ms ?? null,
        story_generation_ms: data.performance?.story_generation_ms ?? null,
        image_generation_ms: data.performance?.image_generation_ms ?? null,
        consistency_check_ms: data.performance?.consistency_check_ms ?? null,
        comic_layout_key: data.comic_layout_key ?? null,
        comic_full_image: data.comic_full_image ?? null,
        comic_full_image_2: data.comic_full_image_2 ?? null,
        comic_panel_count: data.comic_panel_count ?? null,
        comic_grid_plan: data.comic_grid_plan ?? null,
      };
      const storyPayloadReading = useUpdateReading
        ? basePayload
        : { ...basePayload, cover_image_url: null as string | null, cover_image_status: 'pending' as const, story_images: null as string[] | null, story_images_status: 'pending' as const };
      const storyIdToUseReading = (data.story_id ?? placeholderStoryIdReading) as string | null;
      const { data: newStory, error: storyError } = useUpdateReading && storyIdToUseReading
        ? await supabase.from("stories").update(storyPayloadReading).eq("id", storyIdToUseReading).select().single()
        : await supabase.from("stories").insert(storyPayloadReading).select().single();

      console.log("Story save result - error:", storyError);
      console.log("Story save result - newStory:", newStory?.id);

      if (storyError) {
        console.error("Error saving continuation:", storyError);
        toast.error(t.readingSaveError + ": " + storyError.message);
        return;
      }

      // Helper: if already a URL (from backend Storage upload), use directly; else upload base64
      const resolveImageUrl = async (imgData: string | undefined | null, prefix: string): Promise<string | null> => {
        if (!imgData || typeof imgData !== 'string') {
          console.log(`${prefix}: No valid image data provided`);
          return null;
        }
        // Already a URL (backend uploaded to Storage) → use directly
        if (imgData.startsWith('http://') || imgData.startsWith('https://')) {
          console.log(`${prefix}: Already a URL, using directly`);
          return imgData;
        }
        // Fallback: upload base64 client-side
        try {
          console.log(`Uploading ${prefix} image (length: ${imgData.length})...`);
          let b64Data = imgData;
          if (b64Data.includes(',')) {
            b64Data = b64Data.split(',')[1];
          }
          b64Data = b64Data.replace(/\s/g, '');
          
          if (!b64Data || b64Data.length === 0) {
            console.error(`${prefix}: Empty base64 after processing`);
            return null;
          }
          
          const imageData = Uint8Array.from(atob(b64Data), c => c.charCodeAt(0));
          const fileName = `${prefix}-${Date.now()}-${crypto.randomUUID()}.png`;
          const { error: uploadError } = await supabase.storage
            .from("covers")
            .upload(fileName, imageData, { contentType: "image/png" });
          
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from("covers").getPublicUrl(fileName);
            console.log(`${prefix} uploaded successfully:`, urlData.publicUrl);
            return urlData.publicUrl;
          }
          console.error(`Upload error for ${prefix}:`, uploadError);
        } catch (imgErr) {
          console.error(`Error uploading ${prefix} image:`, imgErr);
        }
        return null;
      };

      // Resolve images: backend now returns Storage URLs, fallback to client-side upload for base64
      try {
        let coverUrl = null;
        if (data.coverImageBase64) {
          coverUrl = await resolveImageUrl(data.coverImageBase64, "cover");
        }

        const storyImageUrls: string[] = [];
        if (data.storyImages && Array.isArray(data.storyImages)) {
          console.log(`Resolving ${data.storyImages.length} story images...`);
          for (let i = 0; i < data.storyImages.length; i++) {
            const url = await resolveImageUrl(data.storyImages[i], `story-${i}`);
            if (url) storyImageUrls.push(url);
          }
        }

        // Update story with image URLs
        if (coverUrl || storyImageUrls.length > 0) {
          console.log("Updating story with image URLs...");
          await supabase
            .from("stories")
            .update({
              cover_image_url: coverUrl,
              cover_image_status: coverUrl ? 'complete' : 'pending',
              story_images: storyImageUrls.length > 0 ? storyImageUrls : null,
              story_images_status: storyImageUrls.length > 0 ? 'complete' : 'pending',
            })
            .eq("id", newStory.id);
        }
      } catch (imgError) {
        console.error("Error uploading images (story already saved):", imgError);
        // Don't fail - story is already saved
      }

        // Save comprehension questions if available (multiple choice format)
        if (data.questions && data.questions.length > 0 && newStory) {
          const questionsToInsert = data.questions.map((q: { question: string; correctAnswer?: string; expectedAnswer?: string; options?: string[] }, idx: number) => ({
            story_id: newStory.id,
            question: q.question,
            expected_answer: q.correctAnswer || q.expectedAnswer || '',
            options: q.options || [],
            order_index: idx,
          }));

          await supabase.from("comprehension_questions").insert(questionsToInsert);
        }

        // Save vocabulary words if available
        if (data.vocabulary && data.vocabulary.length > 0 && newStory) {
          const wordsToInsert = data.vocabulary.map((v: { word: string; explanation: string }) => ({
            story_id: newStory.id,
            word: v.word,
            explanation: v.explanation,
            difficulty: "medium",
          }));

          await supabase.from("marked_words").insert(wordsToInsert);
        }

        toast.success(t.readingEpisodeCreated.replace('{n}', String(nextEpisodeNumber)));
        navigate(`/read/${newStory.id}`);
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(t.readingContinuationError);
    } finally {
      setIsGeneratingContinuation(false);
    }
  };

  // Step 1: Child selects a branch option → save choice, then show quiz
  const handleBranchSelect = async (option: BranchOption) => {
    if (!story || !branchId) return;

    try {
      // Save choice to story_branches
      await supabase
        .from("story_branches")
        .update({
          chosen_option_id: option.option_id,
          chosen_at: new Date().toISOString(),
        } as any)
        .eq("id", branchId);

      // Save branch_chosen on the story
      await supabase
        .from("stories")
        .update({ branch_chosen: option.title } as any)
        .eq("id", story.id);

      console.log('[ReadingPage] Branch choice saved:', option.option_id, option.title);

      // Mark as chosen
      setBranchChosen(true);
      setShowBranchDecision(false);

      // Now show quiz if available, otherwise generate next episode directly
      if (hasQuestions) {
        setShowQuiz(true);
      } else {
        // No quiz – generate next episode immediately
        handleGenerateInteractiveEpisode(option.title);
      }
    } catch (err) {
      console.error("Error saving branch choice:", err);
      toast.error(t.readingBranchSaveError);
    }
  };

  // Step 2: Generate next interactive episode (called after quiz or directly if no quiz)
  const handleGenerateInteractiveEpisode = async (chosenTitle?: string) => {
    if (!story || !user?.id) return;

    setIsGeneratingContinuation(true);
    toast.info(readingLabels[textLang]?.generatingSeriesContinuation || "Creating next episode...");

    try {
      const nextEpisodeNumber = (story.episode_number || 1) + 1;

      // Check if episode already exists (race condition protection)
      const { data: existingEp } = await supabase
        .from("stories")
        .select("id")
        .eq("series_id", story.series_id || story.id)
        .eq("episode_number", nextEpisodeNumber)
        .maybeSingle();
      
      if (existingEp) {
        toast.info(t.readingEpisodeExists);
        navigate(`/read/${existingEp.id}`);
        setIsGeneratingContinuation(false);
        return;
      }

      const continuationPrompt = `Fortsetzung von "${story.title}" (Episode ${story.episode_number || 1}):\n\nVorherige Geschichte (Zusammenfassung):\n${storyContent.slice(0, 500)}...\n\nUrsprüngliche Idee: ${story.prompt || ""}`;

      // Resolve chosen title: from parameter, from story.branch_chosen, or reload from DB
      let branchTitle = chosenTitle || (story as any).branch_chosen;
      if (!branchTitle && branchId) {
        const { data: branchRow } = await supabase
          .from("story_branches")
          .select("options, chosen_option_id")
          .eq("id", branchId)
          .maybeSingle();
        if (branchRow?.chosen_option_id && branchRow?.options) {
          const opts = branchRow.options as unknown as BranchOption[];
          const chosen = opts.find(o => o.option_id === branchRow.chosen_option_id);
          branchTitle = chosen?.title;
        }
      }

      // B-14: Placeholder for interactive episode (incremental status/metrics)
      let placeholderStoryIdInteractive: string | null = null;
      const { data: placeholderRowInteractive, error: placeholderErrInteractive } = await supabase
        .from("stories")
        .insert({
          title: "Generating...",
          content: "",
          user_id: user.id,
          kid_profile_id: story.kid_profile_id,
          generation_status: "generating",
          difficulty: story.difficulty || "medium",
          text_type: story.text_type || "fiction",
          text_language: story.text_language || "de",
          prompt: story.prompt,
          ending_type: nextEpisodeNumber >= 5 ? "A" : "C",
          episode_number: nextEpisodeNumber,
          story_length: (story as any).story_length || "medium",
          series_id: story.series_id || story.id,
          series_mode: "interactive",
        })
        .select("id")
        .single();
      if (!placeholderErrInteractive && placeholderRowInteractive?.id) placeholderStoryIdInteractive = placeholderRowInteractive.id;

      // 120s timeout for interactive episode generation
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      const timeoutIdInteractive = setTimeout(() => abortControllerRef.current?.abort(), 120_000);

      const { data: genData, error } = await supabase.functions.invoke("generate-story", {
        body: {
          length: "medium",
          difficulty: story.difficulty || "medium",
          description: continuationPrompt,
          textType: story.text_type || "fiction",
          textLanguage: (story.text_language || "de").toUpperCase(),
          customSystemPrompt,
          endingType: nextEpisodeNumber >= 5 ? "A" : "C",
          episodeNumber: nextEpisodeNumber,
          previousStoryId: story.id,
          seriesId: story.series_id || story.id,
          userId: user.id,
          isSeries: true,
          seriesMode: 'interactive',
          storyLength: (story as any).story_length || 'medium',
          branchChosen: branchTitle,
          storyLanguage: story.text_language || "de",
          kidProfileId: story.kid_profile_id,
          ...(placeholderStoryIdInteractive ? { story_id: placeholderStoryIdInteractive } : {}),
        },
      });

      clearTimeout(timeoutIdInteractive);

      if (error || genData?.error) {
        console.error("Generation error:", error || genData?.error);
        toast.error(t.readingContinuationError);
        return;
      }

      if (genData?.title && genData?.content) {
        // Helper: if already a URL (from backend Storage upload), use directly; else upload base64
        const resolveImageUrlInteractive = async (imgData: string | undefined | null, prefix: string): Promise<string | null> => {
          if (!imgData || typeof imgData !== 'string') return null;
          if (imgData.startsWith('http://') || imgData.startsWith('https://')) {
            return imgData; // Already a Storage URL
          }
          try {
            let b64Data = imgData;
            if (b64Data.includes(',')) b64Data = b64Data.split(',')[1];
            b64Data = b64Data.replace(/\s/g, '');
            if (!b64Data || b64Data.length === 0) return null;
            const imageData = Uint8Array.from(atob(b64Data), c => c.charCodeAt(0));
            const fileName = `${prefix}-${Date.now()}-${crypto.randomUUID()}.png`;
            const { error: uploadError } = await supabase.storage
              .from("covers")
              .upload(fileName, imageData, { contentType: "image/png" });
            if (!uploadError) {
              const { data: urlData } = supabase.storage.from("covers").getPublicUrl(fileName);
              console.log(`[Interactive-Episode] ${prefix} uploaded:`, urlData.publicUrl);
              return urlData.publicUrl;
            }
            console.error(`[Interactive-Episode] Upload error for ${prefix}:`, uploadError);
          } catch (imgErr) {
            console.error(`[Interactive-Episode] Error uploading ${prefix}:`, imgErr);
          }
          return null;
        };

        // Resolve images: backend now returns Storage URLs, fallback to client-side upload for base64
        let coverUrl: string | null = null;
        if (genData.coverImageBase64) {
          coverUrl = await resolveImageUrlInteractive(genData.coverImageBase64, "cover");
        }
        let storyImageUrls: string[] | null = null;
        if (genData.storyImages && Array.isArray(genData.storyImages)) {
          const urls: string[] = [];
          for (let i = 0; i < genData.storyImages.length; i++) {
            const url = await resolveImageUrlInteractive(genData.storyImages[i], `story-${i}`);
            if (url) urls.push(url);
          }
          if (urls.length > 0) storyImageUrls = urls;
        }

        // B-14: Update placeholder or insert (interactive episode)
        const useUpdateInteractive = !!(placeholderStoryIdInteractive && (genData.story_id ?? placeholderStoryIdInteractive));
        const storyPayloadInteractive = {
          title: genData.title,
          content: genData.content,
          difficulty: story.difficulty,
          text_type: story.text_type || "fiction",
          text_language: story.text_language,
          prompt: story.prompt,
          cover_image_url: coverUrl,
          cover_image_status: coverUrl ? 'complete' : 'pending',
          story_images: storyImageUrls,
          story_images_status: storyImageUrls ? 'complete' : 'pending',
          user_id: user.id,
          kid_profile_id: story.kid_profile_id,
          ending_type: (nextEpisodeNumber >= 5 ? "A" : "C") as "A" | "B" | "C",
          episode_number: nextEpisodeNumber,
          story_length: (story as any).story_length || 'medium',
          series_id: story.series_id || story.id,
          series_mode: 'interactive' as const,
          episode_summary: genData.episode_summary ?? null,
          continuity_state: genData.continuity_state ?? null,
          visual_style_sheet: genData.visual_style_sheet ?? null,
          image_style_key: genData.image_style_key ?? null,
          generation_status: genData.imageWarning ? (genData.imageWarning === 'cover_generation_failed' ? 'images_failed' : 'images_partial') : 'verified',
          structure_beginning: genData.structure_beginning ?? null,
          structure_middle: genData.structure_middle ?? null,
          structure_ending: genData.structure_ending ?? null,
          emotional_coloring: genData.emotional_coloring ?? null,
          emotional_secondary: genData.emotional_secondary ?? null,
          humor_level: genData.humor_level ?? null,
          emotional_depth: genData.emotional_depth ?? null,
          moral_topic: genData.moral_topic ?? null,
          concrete_theme: genData.concrete_theme ?? null,
          learning_theme_applied: genData.learning_theme_applied ?? null,
          parent_prompt_text: genData.parent_prompt_text ?? null,
          generation_time_ms: genData.performance?.total_ms ?? null,
          story_generation_ms: genData.performance?.story_generation_ms ?? null,
          image_generation_ms: genData.performance?.image_generation_ms ?? null,
          consistency_check_ms: genData.performance?.consistency_check_ms ?? null,
          comic_layout_key: genData.comic_layout_key ?? null,
          comic_full_image: genData.comic_full_image ?? null,
          comic_full_image_2: genData.comic_full_image_2 ?? null,
          comic_panel_count: genData.comic_panel_count ?? null,
          comic_grid_plan: genData.comic_grid_plan ?? null,
        };
        const storyIdToUseInteractive = (genData.story_id ?? placeholderStoryIdInteractive) as string | null;
        const { data: newStory, error: storyError } = useUpdateInteractive && storyIdToUseInteractive
          ? await supabase.from("stories").update(storyPayloadInteractive).eq("id", storyIdToUseInteractive).select().single()
          : await supabase.from("stories").insert(storyPayloadInteractive).select().single();

        if (storyError) {
          console.error("Save error:", storyError);
          toast.error(t.readingSaveError);
          return;
        }

        // Save branch options for the new episode (if not Episode 5)
        if (genData.branch_options && newStory && nextEpisodeNumber < 5) {
          await supabase.from("story_branches").insert({
            story_id: newStory.id,
            series_id: story.series_id || story.id,
            episode_number: nextEpisodeNumber,
            options: genData.branch_options,
          } as any);
        }

        toast.success(t.readingEpisodeCreated.replace('{n}', String(nextEpisodeNumber)));
        navigate(`/read/${newStory.id}`);
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(t.readingContinuationError);
    } finally {
      setIsGeneratingContinuation(false);
    }
  };

  const loadCachedExplanations = async () => {
    const { data, count } = await supabase
      .from("marked_words")
      .select("word, explanation", { count: "exact" })
      .eq("story_id", id);
    
    if (data) {
      const explanationMap = new Map<string, string>();
      data.forEach((w) => {
        if (w.explanation) {
          explanationMap.set(w.word.toLowerCase(), w.explanation);
        }
      });
      setCachedExplanations(explanationMap);
    }
    if (count !== null) {
      setTotalMarkedCount(count);
    }
  };

  const fetchExplanation = async (text: string): Promise<string | null> => {
    try {
      // Use story's text_language for both word context and explanation language
      const storyLang = story?.text_language || 'fr';
      const { data, error } = await supabase.functions.invoke("explain-word", {
        body: { word: text, language: storyLang, explanationLanguage: storyLang, kidProfileId: selectedProfile?.id, storyId: story?.id },
      });

      if (error) {
        console.error("Error:", error);
        return null;
      }
      
      if (data?.explanation) {
        return data.explanation;
      }
      
      return null;
    } catch (err) {
      console.error("Error:", err);
      return null;
    }
  };

  const handleExplainSelection = async () => {
    if (!currentSelection || !selectionRange) return;

    const cleanText = currentSelection
      .replace(/[.,!?;:"«»\n\r]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    if (!cleanText || cleanText.length < 3) return;

    // Capture selection position for mobile popup
    const rect = selectionRange.getBoundingClientRect();
    setMobilePopupY(rect.top + rect.height / 2);

    // Clear previous unsaved markings
    if (unsavedPositions.size > 0) {
      setSingleWordPositions(prev => {
        const newSet = new Set(prev);
        unsavedPositions.forEach(pos => newSet.delete(pos));
        return newSet;
      });
      setPhrasePositions(prev => {
        const newSet = new Set(prev);
        unsavedPositions.forEach(pos => newSet.delete(pos));
        return newSet;
      });
      setUnsavedPositions(new Set());
    }

    // Find all word elements within the selection and get their positions
    const selectedPositions: string[] = [];
    if (textContainerRef.current) {
      const allWordSpans = textContainerRef.current.querySelectorAll('[data-position]');
      allWordSpans.forEach(span => {
        if (selectionRange.intersectsNode(span)) {
          const position = span.getAttribute('data-position');
          if (position) {
            selectedPositions.push(position);
          }
        }
      });
    }
    
    // Clear the selection UI
    window.getSelection()?.removeAllRanges();
    setCurrentSelection(null);
    setSelectionPosition(null);
    setSelectionRange(null);

    setSelectedWord(cleanText);
    setExplanation(null);
    setIsExplaining(true);
    setExplanationError(false);
    setIsSaved(false);
    
    // Mark all selected positions as phrase in current session
    setPhrasePositions(prev => {
      const newSet = new Set(prev);
      selectedPositions.forEach(pos => newSet.add(pos));
      return newSet;
    });
    // Track as unsaved
    setUnsavedPositions(new Set(selectedPositions));
    
    // Store the phrase text for the first position
    if (selectedPositions.length > 0) {
      setMarkedTexts(prev => new Map(prev.set(selectedPositions[0], cleanText)));
      setCurrentPositionKey(selectedPositions[0]);
    }

    // Check if already cached
    const existingExplanation = cachedExplanations.get(cleanText);
    
    if (existingExplanation) {
      setExplanation(existingExplanation);
      setIsExplaining(false);
      setIsSaved(true); // Already in DB
      return;
    }

    // Get explanation from LLM
    const result = await fetchExplanation(cleanText);
    
    if (result) {
      setExplanation(result);
    } else {
      setExplanationError(true);
    }
    setIsExplaining(false);
  };

  const handleWordClick = async (word: string, event: React.MouseEvent) => {
    // Check if there's a multi-word text selection - if so, don't handle the click
    // Allow single-word selections (browser auto-selects clicked word on some devices)
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || '';
    const wordCount = selectedText.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount > 1) {
      return;
    }
    // Clear any single-word selection from the browser
    if (selection && !selection.isCollapsed) {
      selection.removeAllRanges();
    }
    
    const cleanWord = word.replace(/[.,!?;:"«»]/g, "").toLowerCase();
    
    if (!cleanWord) return;

    // Capture click position for mobile popup
    const clickY = event.clientY;
    setMobilePopupY(clickY);

    // Clear previous unsaved markings
    if (unsavedPositions.size > 0) {
      setSingleWordPositions(prev => {
        const newSet = new Set(prev);
        unsavedPositions.forEach(pos => newSet.delete(pos));
        return newSet;
      });
      setPhrasePositions(prev => {
        const newSet = new Set(prev);
        unsavedPositions.forEach(pos => newSet.delete(pos));
        return newSet;
      });
      setUnsavedPositions(new Set());
    }

    // Create unique position key using event target data attributes
    const target = event.currentTarget;
    const positionKey = target.getAttribute('data-position') || `click-${Date.now()}`;

    setSelectedWord(cleanWord);
    setExplanation(null);
    setIsExplaining(true);
    setExplanationError(false);
    setIsSaved(false);
    setCurrentPositionKey(positionKey);
    
    // Mark position as single word in current session
    setSingleWordPositions(prev => new Set([...prev, positionKey]));
    setMarkedTexts(prev => new Map(prev.set(positionKey, cleanWord)));
    // Track as unsaved
    setUnsavedPositions(new Set([positionKey]));

    // Check if already cached
    const existingExplanation = cachedExplanations.get(cleanWord);
    
    if (existingExplanation) {
      setExplanation(existingExplanation);
      setIsExplaining(false);
      setIsSaved(true); // Already in DB
      return;
    }

    // Get explanation from LLM
    const result = await fetchExplanation(cleanWord);
    
    if (result) {
      setExplanation(result);
    } else {
      setExplanationError(true);
    }
    setIsExplaining(false);
  };

  const handleRetry = async () => {
    if (!selectedWord) return;
    
    setIsExplaining(true);
    setExplanationError(false);
    
    const result = await fetchExplanation(selectedWord);
    
    if (result) {
      setExplanation(result);
    } else {
      setExplanationError(true);
    }
    setIsExplaining(false);
  };

  const handleSaveExplanation = async () => {
    if (!selectedWord || !explanation || !id) return;

    // Save to DB
    const { error } = await supabase.from("marked_words").insert({
      story_id: id,
      word: selectedWord,
      explanation: explanation,
    });

    if (error) {
      toast.error(t.readingWordSaveError);
      return;
    }

    console.log("[Analytics] word_saved", { storyId: id, word: selectedWord, language: kidAppLanguage });
    setTotalMarkedCount(prev => prev + 1);
    setCachedExplanations(prev => new Map(prev.set(selectedWord.toLowerCase(), explanation)));
    setIsSaved(true);
    // Clear unsaved tracking since this is now saved
    setUnsavedPositions(new Set());
    toast.success(t.readingWordSaved);
  };

  const closeExplanation = () => {
    // Clear unsaved markings when closing
    if (unsavedPositions.size > 0) {
      setSingleWordPositions(prev => {
        const newSet = new Set(prev);
        unsavedPositions.forEach(pos => newSet.delete(pos));
        return newSet;
      });
      setPhrasePositions(prev => {
        const newSet = new Set(prev);
        unsavedPositions.forEach(pos => newSet.delete(pos));
        return newSet;
      });
      setUnsavedPositions(new Set());
    }
    
    setSelectedWord(null);
    setExplanation(null);
    setExplanationError(false);
    setIsSaved(false);
    setCurrentPositionKey(null);
    setMobilePopupY(null);
  };

  // Handle click outside popup to close it
  const handleBackgroundClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't close if clicking on interactive elements
    if (target.closest('[data-word-clickable]') || 
        target.closest('.explanation-panel') ||
        target.closest('[data-mobile-popup]')) {
      return;
    }
    // Close the explanation if open
    if (selectedWord) {
      closeExplanation();
    }
  };

  /**
   * Distribute scene images evenly between paragraphs.
   * Works for any number of images (1, 2, 3, ...).
   * Returns a map: paragraphIndex → imageIndex (insert AFTER that paragraph).
   */
  const getImageInsertionMap = (totalParagraphs: number, imageCount: number): Map<number, number> => {
    const map = new Map<number, number>();
    if (imageCount === 0 || totalParagraphs <= 1) return map;

    // Evenly space images through the text
    // For N images in P paragraphs, insert after paragraph at positions P/(N+1), 2P/(N+1), ...
    for (let i = 0; i < imageCount; i++) {
      const insertAfterParagraph = Math.floor(((i + 1) * totalParagraphs) / (imageCount + 1)) - 1;
      // Clamp: don't insert after last paragraph (would be at the very end)
      const clamped = Math.min(Math.max(insertAfterParagraph, 0), totalParagraphs - 2);
      // Avoid duplicates: if this slot is taken, shift forward
      let slot = clamped;
      while (map.has(slot) && slot < totalParagraphs - 1) slot++;
      if (slot < totalParagraphs - 1) {
        map.set(slot, i);
      }
    }
    return map;
  };

  const renderFormattedText = () => {
    if (!story) return null;
    if (storyContent === '') {
      const msg: Record<string, string> = {
        de: 'Diese Geschichte konnte nicht geladen werden.',
        fr: 'Cette histoire n’a pas pu être chargée.',
        en: 'This story could not be loaded.',
        es: 'Esta historia no pudo cargarse.',
        nl: 'Dit verhaal kon niet worden geladen.',
        it: 'Questa storia non è stata caricata.',
        bs: 'Ova priča nije mogla biti učitana.',
      };
      const text = msg[kidAppLanguage as string] || msg.en;
      return <p className="text-muted-foreground py-8 text-center">{text}</p>;
    }

    // Normalize escaped newlines and split into paragraphs
    const normalizedContent = storyContent
      .replace(/\\n\\n/g, '\n\n')
      .replace(/\\n/g, '\n');
    const paragraphs = normalizedContent.split(/\n\n+/).filter(p => p.trim());

    // ── Comic 8-panel distribution (with metadata) ──
    if (comicCroppedPanelsWithMeta && comicCroppedPanelsWithMeta.length > 0) {
      return renderTextWithComicPanels(paragraphs);
    }

    // ── Fallback: legacy comic panels or story_images ──
    // Skip first panel (used as cover) when distributing comic panels in text
    const storyImages = comicCroppedPanels && comicCroppedPanels.length > 1
      ? comicCroppedPanels.slice(1)
      : comicCroppedPanels && comicCroppedPanels.length > 0
        ? comicCroppedPanels
        : (story.story_images || []);

    // Build insertion map: paragraphIndex → imageIndex
    const imageInsertionMap = getImageInsertionMap(paragraphs.length, storyImages.length);

    const elements: React.ReactNode[] = [];

    // Running color offset for continuous syllable color alternation across ALL text
    let globalColorOffset = 0;

    paragraphs.forEach((paragraph, pIndex) => {
      const sentences = paragraph.split(/(?<=[.!?])\s+/);

      elements.push(
        <p key={`p-${pIndex}`} className="mb-4 leading-relaxed">
          {sentences.map((sentence, sIndex) => {
            const shouldBold = sIndex === 0 && pIndex === 0;
            const shouldItalic = sentence.includes("«") || sentence.includes("»");

            const words = sentence.split(/(\s+)/);

            return (
              <span
                key={sIndex}
                className={`${shouldBold ? "font-bold" : ""} ${shouldItalic ? "italic" : ""}`}
              >
                {words.map((word, wIndex) => {
                  const positionKey = `${pIndex}-${sIndex}-${wIndex}`;
                  const isSingleWordMarked = singleWordPositions.has(positionKey);
                  const isPhraseMarked = phrasePositions.has(positionKey);
                  const isSpace = /^\s+$/.test(word);

                  if (isSpace) {
                    const prevKey = `${pIndex}-${sIndex}-${wIndex - 1}`;
                    const nextKey = `${pIndex}-${sIndex}-${wIndex + 1}`;
                    const isInPhrase = phrasePositions.has(prevKey) && phrasePositions.has(nextKey);
                    return (
                      <span
                        key={wIndex}
                        className={isInPhrase ? "phrase-marked" : ""}
                      >
                        {word}
                      </span>
                    );
                  }

                  const markingClass = isSingleWordMarked ? "word-marked" : (isPhraseMarked ? "phrase-marked" : "");

                  // When syllable mode is ON (and FR preload is done), ALL words go through SyllableText
                  if (effectiveSyllableMode) {
                    const currentOffset = globalColorOffset;
                    globalColorOffset += countSyllables(word, textLang);
                    return (
                      <SyllableText
                        key={`syl-${wIndex}-${currentOffset}`}
                        text={word}
                        colorOffset={currentOffset}
                        dataPosition={positionKey}
                        onClick={(e) => handleWordClick(word, e)}
                        className={`word-highlight ${markingClass}`.trim()}
                        language={textLang}
                      />
                    );
                  }

                  // syllableMode OFF — every word is clickable for explanations
                  return (
                    <span
                      key={wIndex}
                      data-position={positionKey}
                      data-word-clickable
                      onClick={(e) => handleWordClick(word, e)}
                      className={`word-highlight ${markingClass}`}
                    >
                      {word}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </p>
      );

      // Insert scene image after this paragraph if scheduled
      if (imageInsertionMap.has(pIndex)) {
        const imgIdx = imageInsertionMap.get(pIndex)!;
        elements.push(
          <div key={`scene-img-${imgIdx}`} className="my-6 flex justify-center">
            <img
              src={storyImages[imgIdx]}
              alt={`Story illustration ${imgIdx + 1}`}
              className="rounded-xl shadow-md max-w-full sm:max-w-[85%] md:max-w-[90%] max-h-64 md:max-h-96 lg:max-h-[28rem] object-contain"
              loading="lazy"
              onError={(e) => { e.currentTarget.src = '/fallback-illustration.svg'; }}
            />
          </div>
        );
      }
    });

    return elements;
  };

  /**
   * Render text with comic panels distributed:
   * Panel 1 → cover (shown above text area, not here).
   * Last panel with role 'ending' → shown after all text.
   * Remaining panels → evenly distributed between paragraphs.
   */
  const renderTextWithComicPanels = (paragraphs: string[]) => {
    const panels = comicCroppedPanelsWithMeta!;
    const elements: React.ReactNode[] = [];

    // First panel is used as cover image (displayed above text area), skip it here.
    // Ending panel (if any) is shown after all text, also skip from inner distribution.
    const endingPanel = panels.find(p => p.role === 'ending');
    const innerPanels = panels.slice(1).filter(p => p !== endingPanel);
    const total = paragraphs.length;

    // Pre-compute target paragraph indices for even distribution
    // Ensures minimum 1 paragraph gap between images and no back-to-back panels
    const panelPositions: number[] = [];
    if (innerPanels.length > 0) {
      const step = total / (innerPanels.length + 1);
      for (let i = 0; i < innerPanels.length; i++) {
        let pos = Math.round(step * (i + 1)) - 1; // 0-indexed paragraph AFTER which to insert
        // Ensure minimum gap of 1 from previous panel position
        if (panelPositions.length > 0) {
          const prevPos = panelPositions[panelPositions.length - 1];
          if (pos <= prevPos) pos = prevPos + 1;
        }
        // Clamp to valid range
        if (pos >= total) pos = total - 1;
        panelPositions.push(pos);
      }
    }

    let nextPanelIndex = 0;
    let globalColorOffset = 0;

    paragraphs.forEach((paragraph, pIndex) => {
      const sentences = paragraph.split(/(?<=[.!?])\s+/);

      elements.push(
        <p key={`p-${pIndex}`} className="mb-4 leading-relaxed">
          {sentences.map((sentence, sIndex) => {
            const shouldBold = sIndex === 0 && pIndex === 0;
            const shouldItalic = sentence.includes("«") || sentence.includes("»");
            const words = sentence.split(/(\s+)/);

            return (
              <span
                key={sIndex}
                className={`${shouldBold ? "font-bold" : ""} ${shouldItalic ? "italic" : ""}`}
              >
                {words.map((word, wIndex) => {
                  const positionKey = `${pIndex}-${sIndex}-${wIndex}`;
                  const isSingleWordMarked = singleWordPositions.has(positionKey);
                  const isPhraseMarked = phrasePositions.has(positionKey);
                  const isSpace = /^\s+$/.test(word);

                  if (isSpace) {
                    const prevKey = `${pIndex}-${sIndex}-${wIndex - 1}`;
                    const nextKey = `${pIndex}-${sIndex}-${wIndex + 1}`;
                    const isInPhrase = phrasePositions.has(prevKey) && phrasePositions.has(nextKey);
                    return <span key={wIndex} className={isInPhrase ? "phrase-marked" : ""}>{word}</span>;
                  }

                  const markingClass = isSingleWordMarked ? "word-marked" : (isPhraseMarked ? "phrase-marked" : "");

                  if (effectiveSyllableMode) {
                    const currentOffset = globalColorOffset;
                    globalColorOffset += countSyllables(word, textLang);
                    return (
                      <SyllableText
                        key={`syl-${wIndex}-${currentOffset}`}
                        text={word}
                        colorOffset={currentOffset}
                        dataPosition={positionKey}
                        onClick={(e) => handleWordClick(word, e)}
                        className={`word-highlight ${markingClass}`.trim()}
                        language={textLang}
                      />
                    );
                  }

                  return (
                    <span
                      key={wIndex}
                      data-position={positionKey}
                      data-word-clickable
                      onClick={(e) => handleWordClick(word, e)}
                      className={`word-highlight ${markingClass}`}
                    >
                      {word}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </p>
      );

      // Insert inner panel after this paragraph if it's the right position
      if (nextPanelIndex < innerPanels.length && panelPositions[nextPanelIndex] === pIndex) {
        const panel = innerPanels[nextPanelIndex];
        elements.push(
          <img
            key={`comic-inner-${panel.position}`}
            src={panel.dataUrl}
            alt={`Story illustration ${panel.position}`}
            className="block mx-auto my-4 w-full max-w-[500px] rounded-md"
            loading="lazy"
          />
        );
        nextPanelIndex++;
      }
    });

    // Any remaining inner panels that couldn't be placed (more panels than paragraphs)
    while (nextPanelIndex < innerPanels.length) {
      const panel = innerPanels[nextPanelIndex];
      elements.push(
        <img
          key={`comic-inner-${panel.position}`}
          src={panel.dataUrl}
          alt={`Story illustration ${panel.position}`}
          className="block mx-auto my-4 w-full max-w-[500px] rounded-md"
          loading="lazy"
        />
      );
      nextPanelIndex++;
    }

    // Ending panel → displayed after all text
    if (endingPanel) {
      elements.push(
        <img
          key="comic-ending"
          src={endingPanel.dataUrl}
          alt="Story ending"
          className="block mx-auto my-4 w-full max-w-[500px] rounded-md"
          loading="lazy"
        />
      );
    }

    return elements;
  };

   if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-bounce-soft">
          <Sparkles className="h-16 w-16 text-primary" />
        </div>
      </div>
    );
  }

  // Story not found (e.g. invalid id or load error) — avoid rendering content with null story
  if (!story) {
    return <Navigate to="/stories" replace />;
  }

  const storyContent = story.content ?? '';

  // ── Immersive Reader Mode ─────────────────────────────────
  if (viewMode === 'immersive') {
    return (
      <div className="min-h-screen relative">
        {/* Mode toggle: switch back to classic */}
        <button
          onClick={() => setViewMode('classic')}
          className="fixed top-3 left-3 z-50 bg-background/80 backdrop-blur-sm border rounded-full p-2 shadow-sm hover:bg-muted transition-colors"
          title="Classic mode"
        >
          <ScrollText className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Back button — triggers confirmation if story not finished */}
        <BackButton
          onClick={shouldBlockNavigation ? () => setShowLeaveDialog(true) : undefined}
          to={shouldBlockNavigation ? undefined : "/stories"}
          className="fixed top-3 left-14 z-50"
        />

        <ImmersiveReader
          story={{ ...story, content: storyContent }}
          kidProfile={selectedProfile ? {
            id: selectedProfile.id,
            name: selectedProfile.name,
            age: selectedProfile.age,
            explanation_language: kidExplanationLanguage,
          } : null}
          accountTier="standard"
          hasQuiz={hasQuestions}
          quizPassThreshold={starRewards.quiz_pass_threshold}
          onComplete={async () => {
            const childId = story.kid_profile_id || selectedProfile?.id || null;

            // Mark story as completed
            await actions.markStoryComplete(id!);
            setIsMarkedAsRead(true);
            queryClient.invalidateQueries({ queryKey: ['stories'] });

            // Log activity via RPC with retry
            let logSuccess = false;
            for (let attempt = 0; attempt < 3 && !logSuccess; attempt++) {
              try {
                const result = await supabase.rpc('log_activity', {
                  p_child_id: childId,
                  p_activity_type: 'story_read',
                  p_stars: starRewards.stars_story_read,
                  p_metadata: { story_id: id, difficulty: story.difficulty || 'medium', language: story.text_language || 'de' },
                });
                if (result.error) {
                  console.error(`[Immersive] log_activity attempt ${attempt + 1} failed:`, result.error.message);
                  if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                  continue;
                }
                logSuccess = true;
                const data = result.data as any;
                if (data?.new_badges?.length > 0) {
                  setPendingBadges(data.new_badges);
                }
              } catch (e) {
                console.error(`[Immersive] log_activity attempt ${attempt + 1} threw:`, e);
                if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
              }
            }
            refreshProgress();

            // Show Fablino celebration
            setFablinoReaction({
              type: 'celebrate',
              message: t.fablinoStoryDone,
              stars: starRewards.stars_story_read,
            });
          }}
          onQuizComplete={async (correctCount, totalCount) => {
            const percentage = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
            const isPerfect = correctCount === totalCount && totalCount > 0;
            const passed = percentage >= starRewards.quiz_pass_threshold;
            const quizStars = !passed ? starRewards.stars_quiz_failed
              : isPerfect ? starRewards.stars_quiz_perfect
              : starRewards.stars_quiz_passed;

            const childId = story.kid_profile_id || selectedProfile?.id || null;

            // Log quiz activity via RPC with retry
            for (let attempt = 0; attempt < 3; attempt++) {
              try {
                const result = await supabase.rpc('log_activity', {
                  p_child_id: childId,
                  p_activity_type: 'quiz_complete',
                  p_stars: quizStars,
                  p_metadata: {
                    quiz_id: id,
                    score: correctCount,
                    max_score: totalCount,
                    score_percent: Math.round(percentage),
                    difficulty: story.difficulty || 'medium',
                  },
                });
                if (!result.error) {
                  const data = result.data as any;
                  if (data?.new_badges?.length > 0) {
                    setPendingBadges(data.new_badges);
                  }
                  break;
                }
                if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
              } catch (e) {
                if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
              }
            }
            refreshProgress();

            if (isPerfect) {
              setFablinoReaction({ type: 'perfect', message: t.fablinoQuizPerfect, stars: quizStars });
            } else if (passed) {
              setFablinoReaction({
                type: 'celebrate',
                message: t.fablinoQuizGood.replace('{correct}', String(correctCount)).replace('{total}', String(totalCount)),
                stars: quizStars,
              });
            } else {
              setFablinoReaction({ type: 'encourage', message: t.fablinoQuizEncourage, stars: 0 });
            }
          }}
          onNavigateToStories={() => navigate('/stories')}
          onNextChapter={() => handleContinueSeries()}
          onNewStory={() => navigate('/stories')}
        />

        {/* Fablino Feedback Overlay (shared with classic mode) */}
        {fablinoReaction && (
          <FablinoReaction
            type={fablinoReaction.type}
            message={fablinoReaction.message}
            stars={fablinoReaction.stars}
            autoClose={fablinoReaction.autoClose}
            buttonLabel={t.continueButton}
            onClose={() => {
              const wasStoryDone = fablinoReaction.type === 'celebrate' && fablinoReaction.message === t.fablinoStoryDone;
              setFablinoReaction(null);
              if (wasStoryDone) {
                if (hasQuestions) {
                  setShowQuiz(true);
                } else {
                  navigate("/stories");
                }
              }
            }}
          />
        )}

        {/* Badge / Level-Up overlays */}
        {pendingBadges.length > 0 && !fablinoReaction && (
          <BadgeCelebrationModal
            badges={pendingBadges}
            onDismiss={() => setPendingBadges([])}
            language={textLang}
          />
        )}
        {pendingLevelUp && !fablinoReaction && pendingBadges.length === 0 && (
          <FablinoReaction
            type="levelUp"
            message={t.fablinoLevelUp.replace('{title}', pendingLevelUp.title)}
            levelEmoji={pendingLevelUp.icon}
            levelTitle={pendingLevelUp.title}
            buttonLabel={t.continueButton}
            onClose={clearPendingLevelUp}
          />
        )}

        {/* Navigation guard dialog (blocker) */}
        <LeaveReadingDialog
          open={blocker.state === 'blocked' || showLeaveDialog}
          language={kidAppLanguage}
          onStay={() => {
            if (blocker.state === 'blocked') blocker.reset?.();
            setShowLeaveDialog(false);
          }}
          onLeave={() => {
            if (blocker.state === 'blocked') {
              blocker.proceed?.();
            } else {
              setShowLeaveDialog(false);
              navigate('/stories');
            }
          }}
        />
      </div>
    );
  }

  // ── Classic Reading Mode ──────────────────────────────────
  return (
    <div className="min-h-screen">
      <PageHeader 
        title={story?.title || ""}
        backTo="/stories"
        onBack={shouldBlockNavigation ? () => setShowLeaveDialog(true) : undefined}
        rightContent={
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mode toggle: switch to immersive (admin only) */}
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('immersive')}
                title="Immersive Reader"
                className="h-9 w-9"
              >
                <BookOpenText className="h-4 w-4" />
              </Button>
            )}
            {/* Star counter — compact */}
            {gamificationState && (
              <div className="flex items-center gap-1 text-primary font-bold text-xs sm:text-sm bg-primary/10 px-2 py-1 rounded-full">
                <span>⭐</span>
                <span>{gamificationState.stars}</span>
              </div>
            )}
            {/* Words panel toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWordPanel(true)}
              className="h-9 px-2.5 text-xs font-semibold text-orange-600 hover:bg-orange-50 gap-1"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t.wordsButton}
              </span>
              {totalMarkedCount > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {totalMarkedCount}
                </span>
              )}
            </Button>
            {/* Share — icon-only on mobile */}
            {story && (
              <ShareStoryButton 
                storyId={story.id} 
                language={kidAppLanguage as any}
              />
            )}
          </div>
        }
      />

      <div className="w-full max-w-7xl mx-auto px-4 py-4 md:p-8" onClick={handleBackgroundClick}>
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Reading Area - wider for tablets */}
          <div className="xl:col-span-3">
            {/* Cover image — use first cropped panel for comic stories, otherwise full cover */}
            {(() => {
              const isComicStory = !!(story?.comic_full_image && story?.comic_grid_plan);
              
              if (isComicStory) {
                // Comic story: ONLY show cropped panel 1 as cover, never the full 2x2 grid
                const croppedCover = comicCroppedPanelsWithMeta?.[0]?.dataUrl || comicCroppedPanels?.[0];
                if (!croppedCover) {
                  // Cropping still in progress — show skeleton
                  return (
                    <div className="mb-6 animate-pulse">
                      <div className="w-full max-w-[500px] mx-auto h-[200px] md:h-[300px] bg-muted rounded-md" />
                    </div>
                  );
                }
                return (
                  <img 
                    src={croppedCover} 
                    alt={story?.title || ''}
                    className="block mx-auto mb-6 w-full max-w-[500px] rounded-md"
                    onError={(e) => { e.currentTarget.src = '/fallback-illustration.svg'; }}
                  />
                );
              }
              
              // Non-comic story: use cover_image_url directly
              if (!story?.cover_image_url) return null;
              return (
                <div className="mb-6 rounded-xl overflow-hidden shadow-card bg-[#FAFAF8]">
                  <img 
                    src={story.cover_image_url} 
                    alt={story?.title || ''}
                    className="w-full max-h-[250px] md:max-h-[400px] object-cover"
                    onError={(e) => { e.currentTarget.src = '/fallback-illustration.svg'; }}
                  />
                </div>
              );
            })()}
            
            {/* Audio Player disabled for now
            {story && user?.username === 'papa' && (
              <div className="mb-6">
                <StoryAudioPlayer
                  storyContent={storyContent}
                  storyTitle={story.title}
                  isListeningMode={isListeningMode}
                  onModeChange={setIsListeningMode}
                />
              </div>
            )}
            */}

            {/* Reading Settings */}
            <div className="mb-4">
              <ReadingSettings
                fontSize={fontSize}
                lineSpacing={lineSpacing}
                onFontSizeChange={setFontSize}
                onLineSpacingChange={setLineSpacing}
                language={textLang}
                syllableMode={syllableMode}
                onSyllableModeChange={setSyllableMode}
                showSyllableOption={isSyllableSupported(textLang)}
              />
            </div>

            {/* Reading Card */}
            <div className={`bg-card rounded-2xl p-4 sm:p-6 md:p-10 shadow-card relative`}>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Sparkles className="h-4 w-4" />
                <span>{readingLabels[textLang]?.touchWord || readingLabels.fr.touchWord}</span>
              </div>
              
              {/* Floating button for phrase selection - optimized for touch */}
              {currentSelection && selectionPosition && (
                <div 
                  data-selection-button
                  className="fixed z-50 animate-in fade-in zoom-in-95"
                  style={{
                    left: `${Math.min(Math.max(selectionPosition.x, 80), window.innerWidth - 80)}px`,
                    top: `${Math.max(selectionPosition.y, 60)}px`,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  <Button
                    onClick={handleExplainSelection}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleExplainSelection();
                    }}
                    className="btn-primary-kid shadow-lg flex items-center gap-2 text-base py-3 px-5 min-h-[52px] min-w-[140px] touch-manipulation"
                  >
                    <MessageCircleQuestion className="h-5 w-5" />
                    {readingLabels[textLang]?.explain || readingLabels.fr.explain}
                  </Button>
                </div>
              )}

              {/* Mobile/Tablet Popup backdrop - click to close */}
              {selectedWord && mobilePopupY !== null && (
                <div 
                  className="xl:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeExplanation();
                  }}
                />
              )}

              {/* Mobile/Tablet Popup for word explanation — centered */}
              {selectedWord && mobilePopupY !== null && (
                <div 
                  data-mobile-popup
                  className="xl:hidden fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-card rounded-2xl p-5 shadow-xl border-2 border-border/50 max-w-sm w-full pointer-events-auto animate-in fade-in zoom-in-95 duration-200" {...rtlProps(story?.text_language)}>
                    <h3 className={`font-baloo text-xl font-bold break-words mb-3 ${rtlClasses(story?.text_language)}`}>
                      {selectedWord}
                    </h3>
                    
                    {isExplaining ? (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>{readingLabels[textLang]?.thinking || readingLabels.fr.thinking}</span>
                      </div>
                    ) : explanationError ? (
                      <div className="space-y-3">
                        <p className="text-destructive text-sm">{readingLabels[textLang]?.noExplanation || readingLabels.fr.noExplanation}</p>
                        <Button
                          onClick={handleRetry}
                          variant="outline"
                          size="sm"
                          className="w-full flex items-center gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          {readingLabels[textLang]?.retry || readingLabels.fr.retry}
                        </Button>
                      </div>
                    ) : (
                      <div className={`space-y-3 ${rtlClasses(story?.text_language)}`}>
                        <p className="text-lg leading-relaxed">{explanation}</p>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={closeExplanation}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            {readingLabels[textLang]?.dismiss || readingLabels.fr.dismiss}
                          </Button>
                          {!isSaved && explanation && (
                            <Button
                              onClick={handleSaveExplanation}
                              size="sm"
                              className="flex-1 btn-secondary-kid flex items-center justify-center gap-2"
                            >
                              <Save className="h-4 w-4" />
                              {readingLabels[textLang]?.save || readingLabels.fr.save}
                            </Button>
                          )}
                          {isSaved && (
                            <div className="flex-1 flex items-center justify-center gap-2 text-secondary font-medium text-sm">
                              <CheckCircle2 className="h-4 w-4" />
                              {readingLabels[textLang]?.saved || readingLabels.fr.saved}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
<div
                ref={textContainerRef}
                className={`reading-text select-text story-text-container ${getReadingTextClasses(fontSize)} ${rtlClasses(story?.text_language)}`}
                {...rtlProps(story?.text_language)}
              >
                {renderFormattedText()}
              </div>

              {/* "Text fertig gelesen" button at the bottom */}
              <div className="mt-10 pt-6 border-t border-border flex justify-center">
                <Button
                  onClick={() => !isMarkedAsRead && setShowFeedbackDialog(true)}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    if (!isMarkedAsRead) setShowFeedbackDialog(true);
                  }}
                  disabled={isMarkedAsRead}
                  className={`flex items-center gap-3 text-lg py-4 px-8 min-h-[56px] touch-manipulation ${
                    isMarkedAsRead 
                      ? 'bg-green-500/20 text-green-700 border-green-300 cursor-default' 
                      : 'btn-accent-kid'
                  }`}
                >
                  <CheckCircle2 className="h-6 w-6" />
                  {isMarkedAsRead 
                    ? (readingLabels[textLang]?.alreadyRead || readingLabels.en.alreadyRead)
                    : (readingLabels[textLang]?.finishedReading || readingLabels.en.finishedReading)
                  }
                </Button>
              </div>

              {/* Feedback Dialog */}
              {story && user && (
                <StoryFeedbackDialog
                  open={showFeedbackDialog}
                  onClose={() => setShowFeedbackDialog(false)}
                  onSubmit={async () => {
                    setShowFeedbackDialog(false);
                    
                    const childId = story?.kid_profile_id || selectedProfile?.id || null;

                    // Mark story as completed in stories table
                    await actions.markStoryComplete(id!);
                    setIsMarkedAsRead(true);
                    // Invalidate stories cache so SeriesGrid sees updated completion status
                    queryClient.invalidateQueries({ queryKey: ['stories'] });

                    // Log activity via RPC (handles stars, streak, badges, user_results)
                    // M13: Retry up to 2 times if log_activity fails — stars must not be lost
                    let logSuccess = false;
                    for (let attempt = 0; attempt < 3 && !logSuccess; attempt++) {
                      try {
                        const result = await supabase.rpc('log_activity', {
                          p_child_id: childId,
                          p_activity_type: 'story_read',
                          p_stars: starRewards.stars_story_read,
                          p_metadata: { story_id: id, difficulty: story?.difficulty || 'medium', language: story?.text_language || 'de' },
                        });

                        if (result.error) {
                          console.error(`[M13] log_activity attempt ${attempt + 1} failed:`, result.error.message);
                          if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                          continue;
                        }

                        logSuccess = true;
                        const data = result.data as any;
                        if (data?.new_badges?.length > 0) {
                          setPendingBadges(data.new_badges);
                        }
                      } catch (e) {
                        console.error(`[M13] log_activity attempt ${attempt + 1} threw:`, e);
                        if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                      }
                    }
                    if (!logSuccess) {
                      console.error('[M13] log_activity failed after 3 attempts — stars may need manual recovery for story', id);
                    }
                    refreshProgress();
                    
                    // Show Fablino celebration
                    setFablinoReaction({
                      type: 'celebrate',
                      message: t.fablinoStoryDone,
                      stars: starRewards.stars_story_read,
                    });
                  }}
                  storyId={story.id}
                  storyTitle={story.title}
                  storyPrompt={storyPrompt}
                  userId={user.id}
                  kidProfileId={selectedProfile?.id}
                  kidName={selectedProfile?.name}
                  kidSchoolClass={selectedProfile?.school_class}
                  kidSchoolSystem={selectedProfile?.school_system}
                  language={textLang as Language}
                />
              )}

              {/* Branch Decision Screen – shown BEFORE quiz for interactive series */}
              {showBranchDecision && branchOptions && branchOptions.length > 0 && !branchChosen && (
                <div className="mt-8 pt-8 border-t-2 border-[#F0E8E0]">
                  <BranchDecisionScreen
                    options={branchOptions}
                    onSelect={handleBranchSelect}
                    isLoading={false}
                  />
                </div>
              )}

              {/* Comprehension Quiz Section */}
              {showQuiz && !quizCompleted && (
                <div className="mt-8 pt-8 border-t-2 border-[#F0E8E0]">
                  <div className="flex items-center gap-3 mb-6">
                    <HelpCircle className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-baloo font-bold">{readingLabels[textLang]?.comprehensionQuestions || readingLabels.fr.comprehensionQuestions}</h2>
                  </div>
                  <ComprehensionQuiz 
                    storyId={id!}
                    storyDifficulty={story?.difficulty || "medium"}
                    storyLanguage={story?.text_language || "fr"}
                    onComplete={async (correctCount, totalCount) => {
                      const percentage = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
                      const isPerfect = correctCount === totalCount && totalCount > 0;
                      const passed = percentage >= starRewards.quiz_pass_threshold;

                      let quizStars: number;
                      let activityType: string;

                      if (isPerfect) {
                        quizStars = starRewards.stars_quiz_perfect;
                        activityType = 'quiz_complete';
                      } else if (passed) {
                        quizStars = starRewards.stars_quiz_passed;
                        activityType = 'quiz_complete';
                      } else {
                        quizStars = starRewards.stars_quiz_failed;
                        activityType = 'quiz_complete';
                      }

                      const childId = story?.kid_profile_id || selectedProfile?.id || null;

                      // Log activity via RPC (handles stars, streak, badges, user_results)
                      // M13: Retry up to 2 times if log_activity fails — stars must not be lost
                      let actualStarsEarned = quizStars;
                      let quizLogSuccess = false;
                      for (let attempt = 0; attempt < 3 && !quizLogSuccess; attempt++) {
                        try {
                          const result = await supabase.rpc('log_activity', {
                            p_child_id: childId,
                            p_activity_type: activityType,
                            p_stars: quizStars,
                            p_metadata: {
                              quiz_id: id,
                              score: correctCount,
                              max_score: totalCount,
                              score_percent: Math.round(percentage),
                              difficulty: story?.difficulty || 'medium',
                            },
                          });

                          if (result.error) {
                            console.error(`[M13] quiz log_activity attempt ${attempt + 1} failed:`, result.error.message);
                            if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                            continue;
                          }

                          quizLogSuccess = true;
                          const data = result.data as any;
                          if (data?.stars_earned != null) {
                            actualStarsEarned = data.stars_earned;
                          }
                          if (data?.new_badges?.length > 0) {
                            setPendingBadges(data.new_badges);
                          }
                        } catch (e) {
                          console.error(`[M13] quiz log_activity attempt ${attempt + 1} threw:`, e);
                          if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                        }
                      }
                      if (!quizLogSuccess) {
                        console.error('[M13] quiz log_activity failed after 3 attempts');
                      }
                      refreshProgress();

                      setQuizResult({ correctCount, totalCount, starsEarned: actualStarsEarned });
                      setQuizCompleted(true);

                      // Fablino-Feedback mit korrekten Stern-Zahlen
                      if (isPerfect) {
                        setFablinoReaction({
                          type: 'perfect',
                          message: t.fablinoQuizPerfect,
                          stars: quizStars,
                        });
                      } else if (passed) {
                        setFablinoReaction({
                          type: 'celebrate',
                          message: t.fablinoQuizGood
                            .replace('{correct}', String(correctCount))
                            .replace('{total}', String(totalCount)),
                          stars: quizStars,
                        });
                      } else {
                        setFablinoReaction({
                          type: 'encourage',
                          message: t.fablinoQuizEncourage,
                          stars: 0,
                        });
                      }
                    }}
                    onWrongAnswer={() => {
                      setFablinoReaction({
                        type: 'encourage',
                        message: t.fablinoEncourage,
                        autoClose: 1500,
                      });
                    }}
                  />
                </div>
              )}
              
              {/* Quiz Completion Result */}
              {quizCompleted && quizResult && (
                <div className="mt-8 pt-8 border-t-2 border-[#F0E8E0]">
                  <QuizCompletionResult
                    correctCount={quizResult.correctCount}
                    totalCount={quizResult.totalCount}
                    starsEarned={quizResult.starsEarned}
                    appLanguage={textLang}
                    onContinue={() => navigate("/stories")}
                  />
                  
                  {/* Series continuation after quiz – Ep1-4 */}
                  {(story?.series_id || story?.episode_number) && (story?.episode_number || 0) >= 1 && (story?.episode_number || 0) < 5 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      {/* Interactive Series: branch was already chosen before quiz → generate next episode */}
                      {branchChosen ? (
                        <Button
                          onClick={() => handleGenerateInteractiveEpisode()}
                          disabled={isGeneratingContinuation}
                          className="w-full btn-primary-kid flex items-center justify-center gap-3 text-lg py-5"
                        >
                          {isGeneratingContinuation ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              {readingLabels[textLang]?.generatingSeriesContinuation || readingLabels[textLang]?.generatingContinuation || "Creating..."}
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-5 w-5" />
                              {readingLabels[textLang]?.continueStory || "What happens next?"} 
                              <span className="text-sm opacity-80">
                                ({readingLabels[textLang]?.episode || "Episode"} {(story.episode_number || 1) + 1})
                              </span>
                            </>
                          )}
                        </Button>
                      ) : (
                        /* Normal Series: Continue Button */
                        <Button
                          onClick={handleContinueSeries}
                          disabled={isGeneratingContinuation}
                          className="w-full btn-primary-kid flex items-center justify-center gap-3 text-lg py-5"
                        >
                          {isGeneratingContinuation ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              {readingLabels[textLang]?.generatingSeriesContinuation || readingLabels[textLang]?.generatingContinuation || "Creating..."}
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-5 w-5" />
                              {readingLabels[textLang]?.continueStory || "What happens next?"} 
                              <span className="text-sm opacity-80">
                                ({readingLabels[textLang]?.episode || "Episode"} {(story.episode_number || 1) + 1})
                              </span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Series completed message for Episode 5+ */}
                  {(story?.series_id || story?.episode_number) && (story?.episode_number || 0) >= 5 && (
                    <div className="mt-6 pt-6 border-t border-border text-center">
                      <p className="text-lg font-semibold text-primary">
                        {readingLabels[textLang]?.seriesCompleted || "Series completed! 🦊🎉"}
                      </p>
                      {/* Interactive series: recap of all branch choices */}
                      {story?.series_mode === 'interactive' && branchHistory.length > 0 && (
                        <div className="mt-4 bg-gradient-to-b from-[#FFF8F0] to-[#FEF1E1] rounded-2xl p-4 text-left">
                          <p className="text-sm font-semibold text-[#92400E] mb-2">
                            {t.readingYourChoices}
                          </p>
                          <ul className="space-y-1.5">
                            {branchHistory.map((b) => (
                              <li key={b.episode_number} className="flex items-start gap-2 text-xs text-[#2D1810]/70">
                                <span className="font-bold text-[#E8863A] shrink-0">Ep.{b.episode_number}:</span>
                                <span>{b.chosen_title}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <Button
                        onClick={() => navigate("/stories")}
                        className="mt-3 btn-primary-kid"
                      >
                        {readingLabels[textLang]?.backToLibrary || "Back to library"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Series continuation for stories without quiz – Ep1-4 (normal series only; interactive uses the decision screen above) */}
              {!showQuiz && !hasQuestions && !showBranchDecision && !branchChosen && (story?.series_id || story?.episode_number) && (story?.episode_number || 0) >= 1 && (story?.episode_number || 0) < 5 && !(branchOptions && branchOptions.length > 0) && (
                <div className="mt-8 pt-6 border-t border-border">
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-muted-foreground text-center">
                        {t.readingSeriesPart}
                      </p>
                      <Button
                        onClick={handleContinueSeries}
                        disabled={isGeneratingContinuation}
                        className="btn-primary-kid flex items-center justify-center gap-3 text-lg py-5 px-8"
                      >
                        {isGeneratingContinuation ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            {readingLabels[textLang]?.generatingSeriesContinuation || readingLabels[textLang]?.generatingContinuation || "Creating..."}
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" />
                            {readingLabels[textLang]?.continueStory || "What happens next?"} 
                            <span className="text-sm opacity-80">
                              ({readingLabels[textLang]?.episode || "Episode"} {(story.episode_number || 1) + 1})
                            </span>
                          </>
                        )}
                      </Button>
                    </div>
                </div>
              )}
            </div>
          </div>

          {/* Explanation Panel - Large Desktop only (xl+) */}
          <div className="hidden xl:block xl:col-span-1">
            <div className="sticky top-24">
              {selectedWord ? (
                <div className="explanation-panel animate-in fade-in slide-in-from-right-4 duration-300" {...rtlProps(story?.text_language)}>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className={`font-baloo text-2xl font-bold break-words max-w-[200px] ${rtlClasses(story?.text_language)}`}>
                      {selectedWord}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={closeExplanation}
                      className="flex-shrink-0"
                    >
                      {readingLabels[textLang]?.dismiss || readingLabels.fr.dismiss}
                    </Button>
                  </div>
                  
                  {isExplaining ? (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{readingLabels[textLang]?.thinking || readingLabels.fr.thinking}</span>
                    </div>
                  ) : explanationError ? (
                    <div className="space-y-4">
                      <p className="text-destructive">{readingLabels[textLang]?.noExplanation || readingLabels.fr.noExplanation}</p>
                      <Button
                        onClick={handleRetry}
                        variant="outline"
                        className="w-full flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {readingLabels[textLang]?.retry || readingLabels.fr.retry}
                      </Button>
                    </div>
                  ) : (
                    <div className={`space-y-4 ${rtlClasses(story?.text_language)}`}>
                      <p className="text-xl leading-relaxed">{explanation}</p>
                      
                      {!isSaved && explanation && (
                        <Button
                          onClick={handleSaveExplanation}
                          className="w-full btn-secondary-kid flex items-center gap-2"
                        >
                          <Save className="h-5 w-5" />
                          {readingLabels[textLang]?.save || readingLabels.fr.save}
                        </Button>
                      )}
                      
                      {isSaved && (
                        <div className="flex items-center gap-2 text-secondary font-medium">
                          <CheckCircle2 className="h-5 w-5" />
                          {readingLabels[textLang]?.saved || readingLabels.fr.saved}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="explanation-panel text-center py-12">
                  <Sparkles className="h-12 w-12 text-primary/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {readingLabels[textLang]?.touchWord || readingLabels.fr.touchWord}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fablino Feedback Overlay */}
      {fablinoReaction && (
        <FablinoReaction
          type={fablinoReaction.type}
          message={fablinoReaction.message}
          stars={fablinoReaction.stars}
          autoClose={fablinoReaction.autoClose}
          buttonLabel={t.continueButton}
          onClose={() => {
            const wasStoryDone = fablinoReaction.type === 'celebrate' && fablinoReaction.message === t.fablinoStoryDone;
            setFablinoReaction(null);
            // After story celebration: interactive series → decision screen first, then quiz
            if (wasStoryDone) {
              const isInteractiveSeries = branchOptions && branchOptions.length > 0 && (story?.episode_number || 0) < 5;
              if (isInteractiveSeries) {
                // Show branch decision screen BEFORE quiz
                setShowBranchDecision(true);
              } else if (hasQuestions) {
                setShowQuiz(true);
              } else {
                // No quiz, no branch decision – check if series continuation is available
                const isSeries = !!(story?.series_id || story?.episode_number) && (story?.episode_number || 0) >= 1 && (story?.episode_number || 0) < 5;
                if (!isSeries) {
                  navigate("/stories");
                }
                // If series: stay on page, continuation buttons are already rendered below
              }
            }
          }}
        />
      )}

      {/* Badge Celebration Modal – shows after Fablino reward is dismissed */}
      {pendingBadges.length > 0 && !fablinoReaction && (
        <BadgeCelebrationModal
          badges={pendingBadges}
          onDismiss={() => setPendingBadges([])}
          language={textLang}
        />
      )}

      {/* Level Up Overlay – shows last, after badges are dismissed */}
      {pendingLevelUp && !fablinoReaction && pendingBadges.length === 0 && (
        <FablinoReaction
          type="levelUp"
          message={t.fablinoLevelUp.replace('{title}', pendingLevelUp.title)}
          levelEmoji={pendingLevelUp.icon}
          levelTitle={pendingLevelUp.title}
          buttonLabel={t.continueButton}
          onClose={clearPendingLevelUp}
        />
      )}

      {/* Inline Word List Panel */}
      <WordListPanel
        storyId={id || ""}
        language={kidAppLanguage}
        open={showWordPanel}
        onClose={() => setShowWordPanel(false)}
      />

      {/* Navigation guard dialog (blocker) */}
      <LeaveReadingDialog
        open={blocker.state === 'blocked' || showLeaveDialog}
        language={kidAppLanguage}
        onStay={() => {
          if (blocker.state === 'blocked') blocker.reset?.();
          setShowLeaveDialog(false);
        }}
        onLeave={() => {
          if (blocker.state === 'blocked') {
            blocker.proceed?.();
          } else {
            setShowLeaveDialog(false);
            navigate('/stories');
          }
        }}
      />
    </div>
  );
};

export default ReadingPage;
