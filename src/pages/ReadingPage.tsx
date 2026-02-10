import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, X, Loader2, BookOpen, MessageCircleQuestion, CheckCircle2, HelpCircle, Save, RotateCcw } from "lucide-react";
import ShareStoryButton from "@/components/story-sharing/ShareStoryButton";
import ComprehensionQuiz from "@/components/ComprehensionQuiz";
import QuizCompletionResult from "@/components/QuizCompletionResult";
import StoryAudioPlayer from "@/components/StoryAudioPlayer";
import StoryFeedbackDialog from "@/components/StoryFeedbackDialog";
import ReadingSettings, { FontSizeLevel, LineSpacingLevel, getReadingTextClasses } from "@/components/ReadingSettings";
import SyllableText, { isSyllableModeSupported } from "@/components/SyllableText";
import { useAuth } from "@/hooks/useAuth";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useGamification } from "@/hooks/useGamification";
import FablinoReaction from "@/components/FablinoReaction";
import BadgeCelebrationModal, { EarnedBadge } from "@/components/BadgeCelebrationModal";
import PageHeader from "@/components/PageHeader";
import { Language, getTranslations } from "@/lib/translations";

// UI labels for word explanation popup in different languages
const readingLabels: Record<string, {
  thinking: string;
  noExplanation: string;
  retry: string;
  save: string;
  saved: string;
  explain: string;
  touchWord: string;
  finishedReading: string;
  listeningMode: string;
  comprehensionQuestions: string;
  storyCompleted: string;
  continueStory: string;
  generatingContinuation: string;
  episode: string;
}> = {
  de: {
    thinking: "Ich denke nach...",
    noExplanation: "Keine Erklärung gefunden.",
    retry: "Erneut versuchen",
    save: "Speichern",
    saved: "Gespeichert!",
    explain: "Erklären",
    touchWord: "Tippe auf ein Wort, um seine Bedeutung zu erfahren",
    finishedReading: "Fertig gelesen",
    listeningMode: "Höre die Geschichte...",
    comprehensionQuestions: "Verständnisfragen",
    storyCompleted: "Super! Du hast fertig gelesen!",
    continueStory: "Wie geht es weiter?",
    generatingContinuation: "Fortsetzung wird erstellt...",
    episode: "Episode",
  },
  fr: {
    thinking: "Je réfléchis...",
    noExplanation: "Pas d'explication trouvée.",
    retry: "Réessayer",
    save: "Sauvegarder",
    saved: "Sauvegardé!",
    explain: "Expliquer",
    touchWord: "Touche un mot pour découvrir sa signification",
    finishedReading: "J'ai fini de lire",
    listeningMode: "Écoute l'histoire...",
    comprehensionQuestions: "Questions de compréhension",
    storyCompleted: "Super! Tu as fini de lire!",
    continueStory: "Que se passe-t-il ensuite?",
    generatingContinuation: "Création de la suite...",
    episode: "Épisode",
  },
  en: {
    thinking: "Thinking...",
    noExplanation: "No explanation found.",
    retry: "Try again",
    save: "Save",
    saved: "Saved!",
    explain: "Explain",
    touchWord: "Tap a word to discover its meaning",
    finishedReading: "I finished reading",
    listeningMode: "Listen to the story...",
    comprehensionQuestions: "Comprehension questions",
    storyCompleted: "Great! You finished reading!",
    continueStory: "What happens next?",
    generatingContinuation: "Creating continuation...",
    episode: "Episode",
  },
  es: {
    thinking: "Pensando...",
    noExplanation: "No se encontró explicación.",
    retry: "Reintentar",
    save: "Guardar",
    saved: "¡Guardado!",
    explain: "Explicar",
    touchWord: "Toca una palabra para descubrir su significado",
    finishedReading: "Terminé de leer",
    listeningMode: "Escucha la historia...",
    comprehensionQuestions: "Preguntas de comprensión",
    storyCompleted: "¡Genial! ¡Terminaste de leer!",
    continueStory: "¿Qué pasa después?",
    generatingContinuation: "Creando continuación...",
    episode: "Episodio",
  },
  nl: {
    thinking: "Ik denk na...",
    noExplanation: "Geen uitleg gevonden.",
    retry: "Opnieuw proberen",
    save: "Opslaan",
    saved: "Opgeslagen!",
    explain: "Uitleggen",
    touchWord: "Tik op een woord om de betekenis te ontdekken",
    finishedReading: "Ik ben klaar met lezen",
    listeningMode: "Luister naar het verhaal...",
    comprehensionQuestions: "Begripsvragen",
    storyCompleted: "Super! Je bent klaar met lezen!",
    continueStory: "Wat gebeurt er nu?",
    generatingContinuation: "Vervolg wordt gemaakt...",
    episode: "Aflevering",
  },
  it: {
    thinking: "Sto pensando...",
    noExplanation: "Nessuna spiegazione trovata.",
    retry: "Riprova",
    save: "Salva",
    saved: "Salvato!",
    explain: "Spiega",
    touchWord: "Tocca una parola per scoprire il suo significato",
    finishedReading: "Ho finito di leggere",
    listeningMode: "Ascolta la storia...",
    comprehensionQuestions: "Domande di comprensione",
    storyCompleted: "Fantastico! Hai finito di leggere!",
    continueStory: "Cosa succede dopo?",
    generatingContinuation: "Creazione del seguito...",
    episode: "Episodio",
  },
  bs: {
    thinking: "Razmišljam...",
    noExplanation: "Objašnjenje nije pronađeno.",
    retry: "Pokušaj ponovo",
    save: "Sačuvaj",
    saved: "Sačuvano!",
    explain: "Objasni",
    touchWord: "Dodirni riječ da saznaš njeno značenje",
    finishedReading: "Završio/la sam čitanje",
    listeningMode: "Slušaj priču...",
    comprehensionQuestions: "Pitanja razumijevanja",
    storyCompleted: "Super! Završio/la si čitanje!",
    continueStory: "Šta se dalje dešava?",
    generatingContinuation: "Kreiranje nastavka...",
    episode: "Epizoda",
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
  kid_profile_id?: string | null;
}

// French stop words that should not be marked/highlighted
const FRENCH_STOP_WORDS = new Set([
  // Articles
  "le", "la", "les", "l", "un", "une", "des", "du", "de", "d",
  // Pronouns
  "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
  "me", "te", "se", "lui", "leur", "moi", "toi", "soi",
  // Possessives
  "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses",
  "notre", "nos", "votre", "vos", "leur", "leurs",
  // Demonstratives
  "ce", "cet", "cette", "ces", "ça", "c",
  // Prepositions & conjunctions
  "à", "au", "aux", "en", "dans", "sur", "sous", "avec", "sans", "pour",
  "par", "vers", "chez", "entre", "et", "ou", "mais", "donc", "car", "ni",
  "que", "qui", "quoi", "dont", "où", "si", "ne", "pas", "plus", "moins",
  // Common verbs (conjugated)
  "est", "sont", "a", "ai", "as", "ont", "été", "être", "avoir",
  "fait", "faire", "dit", "dire", "va", "vais", "vont", "aller",
  // Other common short words
  "y", "n", "s", "t", "qu", "j", "m"
]);

const MIN_WORD_LENGTH = 3;

const isStopWord = (word: string): boolean => {
  const clean = word.toLowerCase().replace(/[.,!?;:'"«»]/g, "");
  return FRENCH_STOP_WORDS.has(clean) || clean.length < MIN_WORD_LENGTH;
};

const ReadingPage = () => {
  const { user } = useAuth();
  const { selectedProfile, kidAppLanguage, kidExplanationLanguage } = useKidProfile();
  const { actions, pendingLevelUp, clearPendingLevelUp, starRewards, state: gamificationState, refreshProgress } = useGamification();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  const [quizResult, setQuizResult] = useState<{ correctCount: number; totalCount: number } | null>(null);
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
  // Syllable mode for reading assistance (German only)
  const [syllableMode, setSyllableMode] = useState(false);
  // Badge celebration
  const [pendingBadges, setPendingBadges] = useState<EarnedBadge[]>([]);
  // Series continuation state
  const [isGeneratingContinuation, setIsGeneratingContinuation] = useState(false);
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

  useEffect(() => {
    if (id) {
      loadStory();
      loadCachedExplanations();
      checkForQuestions();
    }
  }, [id]);

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
      setStory(data);
      if (data.prompt) {
        setStoryPrompt(data.prompt);
      }
    } else {
      toast.error("Histoire non trouvée");
      navigate("/stories");
    }
    setIsLoading(false);
  };

  // Handle series continuation
  const handleContinueSeries = async () => {
    if (!user?.id) {
      toast.error("Bitte melde dich erneut an");
      return;
    }
    if (!story || !story.series_id) return;

    setIsGeneratingContinuation(true);
    toast.info(readingLabels[textLang]?.generatingContinuation || "Creating continuation...");

    try {
      console.log("Starting continuation generation...");
      console.log("User ID:", user?.id);
      console.log("Story:", story?.id, story?.series_id, story?.episode_number);
      
      const nextEpisodeNumber = (story.episode_number || 1) + 1;
      console.log("Next episode:", nextEpisodeNumber);
      
      // Create continuation prompt with previous story context
      const continuationPrompt = `Fortsetzung von "${story.title}" (Episode ${story.episode_number || 1}):\n\nVorherige Geschichte (Zusammenfassung):\n${story.content.slice(0, 500)}...\n\nUrsprüngliche Idee: ${story.prompt || ""}`;

      // Call generate-story with continuation context
      console.log("Calling generate-story edge function...");
      const { data, error } = await supabase.functions.invoke("generate-story", {
        body: {
          length: "medium",
          difficulty: story.difficulty || "medium",
          description: continuationPrompt,
          textType: story.text_type || "fiction",
          textLanguage: (story.text_language || "de").toUpperCase(),
          customSystemPrompt,
          endingType: "C", // Keep as cliffhanger for continuing series
          episodeNumber: nextEpisodeNumber,
          previousStoryId: story.id,
          seriesId: story.series_id,
          userId: user?.id,
        },
      });

      console.log("Edge function response - error:", error);
      console.log("Edge function response - data keys:", data ? Object.keys(data) : "null");
      console.log("Edge function response - title:", data?.title);
      console.log("Edge function response - has content:", !!data?.content);

      if (error) {
        console.error("Generation error:", error);
        toast.error("Fehler beim Erstellen der Fortsetzung: " + (error.message || JSON.stringify(error)));
        return;
      }

      if (data?.error) {
        console.error("API error:", data.error);
        toast.error(data.error);
        return;
      }

      if (!user?.id) {
        console.error("User not authenticated");
        toast.error("Bitte melde dich erneut an");
        return;
      }
      
      if (!data?.title || !data?.content) {
        console.error("Missing title or content in response:", data);
        toast.error("Keine Story-Daten erhalten");
        return;
      }

      if (data?.title && data?.content) {
      // FIRST: Save the story to database (without images)
      console.log("Saving story to database FIRST (without images)...");
      console.log("Insert data:", {
        title: data.title,
        contentLength: data.content?.length,
        difficulty: story.difficulty,
        user_id: user.id,
        kid_profile_id: story.kid_profile_id,
        episode_number: nextEpisodeNumber,
        series_id: story.series_id,
      });
      
      const { data: newStory, error: storyError } = await supabase
        .from("stories")
        .insert({
          title: data.title,
          content: data.content,
          difficulty: story.difficulty,
          text_type: story.text_type || "fiction",
          text_language: story.text_language,
          prompt: story.prompt,
          cover_image_url: null, // Will update after upload
          cover_image_status: 'pending',
          story_images: null,     // Will update after upload
          story_images_status: 'pending',
          user_id: user.id,
          kid_profile_id: story.kid_profile_id,
          ending_type: "C",
          episode_number: nextEpisodeNumber,
          series_id: story.series_id,
        })
        .select()
        .single();

      console.log("Story save result - error:", storyError);
      console.log("Story save result - newStory:", newStory?.id);

      if (storyError) {
        console.error("Error saving continuation:", storyError);
        toast.error("Fehler beim Speichern: " + storyError.message);
        return;
      }

      // Helper to upload base64 image - with robust error handling
      const uploadBase64Image = async (base64: string | undefined | null, prefix: string): Promise<string | null> => {
        if (!base64 || typeof base64 !== 'string') {
          console.log(`${prefix}: No valid base64 data provided`);
          return null;
        }
        try {
          console.log(`Uploading ${prefix} image (length: ${base64.length})...`);
          let b64Data = base64;
          // Remove data URL prefix if present
          if (b64Data.includes(',')) {
            b64Data = b64Data.split(',')[1];
          }
          // Remove any whitespace
          b64Data = b64Data.replace(/\s/g, '');
          
          // Validate base64
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

      // THEN: Upload images in background (non-blocking)
      try {
        let coverUrl = null;
        if (data.coverImageBase64) {
          console.log("Uploading cover image...");
          coverUrl = await uploadBase64Image(data.coverImageBase64, "cover");
        }

        const storyImageUrls: string[] = [];
        if (data.storyImages && Array.isArray(data.storyImages)) {
          console.log(`Uploading ${data.storyImages.length} story images...`);
          for (let i = 0; i < data.storyImages.length; i++) {
            const url = await uploadBase64Image(data.storyImages[i], `story-${i}`);
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

        toast.success(`Episode ${nextEpisodeNumber} erstellt! 🎉`);
        navigate(`/read/${newStory.id}`);
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Fehler beim Erstellen der Fortsetzung");
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
        body: { word: text, language: storyLang, explanationLanguage: storyLang },
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
      toast.error("Erreur lors de la sauvegarde");
      return;
    }

    setTotalMarkedCount(prev => prev + 1);
    setCachedExplanations(prev => new Map(prev.set(selectedWord.toLowerCase(), explanation)));
    setIsSaved(true);
    // Clear unsaved tracking since this is now saved
    setUnsavedPositions(new Set());
    toast.success("Explication sauvegardée! ⚽");
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

    // Normalize escaped newlines and split into paragraphs
    const normalizedContent = story.content
      .replace(/\\n\\n/g, '\n\n')
      .replace(/\\n/g, '\n');
    const paragraphs = normalizedContent.split(/\n\n+/).filter(p => p.trim());
    const storyImages = story.story_images || [];

    // Build insertion map: paragraphIndex → imageIndex
    const imageInsertionMap = getImageInsertionMap(paragraphs.length, storyImages.length);

    const elements: React.ReactNode[] = [];

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
                className={`${shouldBold ? "font-bold" : ""} ${shouldItalic ? "italic text-foreground" : ""}`}
              >
                {words.map((word, wIndex) => {
                  const positionKey = `${pIndex}-${sIndex}-${wIndex}`;
                  const isSingleWordMarked = singleWordPositions.has(positionKey);
                  const isPhraseMarked = phrasePositions.has(positionKey);
                  const isSpace = /^\s+$/.test(word);
                  const canBeMarked = !isStopWord(word);

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

                  if (!canBeMarked) {
                    /* Syllable mode disabled for now
                    return syllableMode ? (
                      <SyllableText
                        key={wIndex}
                        text={word}
                        dataPosition={positionKey}
                        className={markingClass}
                        language={textLang}
                      />
                    ) : ( */
                    return (
                      <span
                        key={wIndex}
                        data-position={positionKey}
                        className={markingClass}
                      >
                        {word}
                      </span>
                    );
                  }

                  /* Syllable mode disabled for now
                  return syllableMode ? (
                    <SyllableText
                      key={wIndex}
                      text={word}
                      dataPosition={positionKey}
                      onClick={(e) => handleWordClick(word, e)}
                      className={`word-highlight ${markingClass}`}
                      language={textLang}
                      data-word-clickable
                    />
                  ) : ( */
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
            />
          </div>
        );
      }
    });

    return elements;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg, #FFF7ED 0%, #FEF3C7 50%, #EFF6FF 100%)" }}>
        <div className="animate-bounce-soft">
          <Sparkles className="h-16 w-16 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #FFF7ED 0%, #FEF3C7 50%, #EFF6FF 100%)" }}>
      <PageHeader 
        title={story?.title || ""}
        backTo="/stories"
        rightContent={
          <div className="flex items-center gap-2">
            {/* Star counter */}
            {gamificationState && (
              <div className="flex items-center gap-1 text-primary font-bold text-sm bg-primary/10 px-2.5 py-1 rounded-full">
                <span>⭐</span>
                <span>{gamificationState.stars}</span>
              </div>
            )}
            {story && (
              <ShareStoryButton 
                storyId={story.id} 
                language={kidAppLanguage as any}
              />
            )}
            <Button
              onClick={() => navigate("/quiz")}
              className="btn-accent-kid flex items-center gap-2"
            >
              <BookOpen className="h-5 w-5" />
              <span className="hidden sm:inline">Quiz</span>
            </Button>
          </div>
        }
      />

      <div className="container max-w-7xl p-4 md:p-8" onClick={handleBackgroundClick}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Reading Area - wider for tablets */}
          <div className="lg:col-span-3">
            {/* Cover image above the text */}
            {story?.cover_image_url && (
              <div className="mb-6 rounded-2xl overflow-hidden shadow-card bg-muted/30">
                <img 
                  src={story.cover_image_url} 
                  alt={story.title}
                  className="w-full h-40 md:h-52 object-contain"
                />
              </div>
            )}
            
            {/* Audio Player disabled for now
            {story && user?.username === 'papa' && (
              <div className="mb-6">
                <StoryAudioPlayer
                  storyContent={story.content}
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
                // Syllable mode disabled for now
                // syllableMode={syllableMode}
                // onSyllableModeChange={setSyllableMode}
                showSyllableOption={false /* isSyllableModeSupported(textLang) */}
              />
            </div>

            {/* Reading Card */}
            <div className={`bg-card rounded-2xl p-6 md:p-10 shadow-card relative`}>
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

              {/* Mobile Popup backdrop - click to close */}
              {selectedWord && mobilePopupY !== null && (
                <div 
                  className="lg:hidden fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeExplanation();
                  }}
                />
              )}

              {/* Mobile Popup for word explanation - only visible on mobile/tablet */}
              {selectedWord && mobilePopupY !== null && (
                <div 
                  data-mobile-popup
                  className="lg:hidden fixed left-4 right-4 z-50 animate-in fade-in zoom-in-95 duration-200"
                  style={{
                    top: `${Math.min(Math.max(mobilePopupY - 80, 100), window.innerHeight - 250)}px`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-card rounded-2xl p-5 shadow-xl border-2 border-[#F0E8E0]">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-baloo text-xl font-bold break-words max-w-[200px]">
                        {selectedWord}
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={closeExplanation}
                        className="rounded-full -mt-1 -mr-1 flex-shrink-0"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    
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
                      <div className="space-y-3">
                        <p className="text-lg leading-relaxed">{explanation}</p>
                        
                        {!isSaved && explanation && (
                          <Button
                            onClick={handleSaveExplanation}
                            size="sm"
                            className="w-full btn-secondary-kid flex items-center gap-2"
                          >
                            <Save className="h-4 w-4" />
                            {readingLabels[textLang]?.save || readingLabels.fr.save}
                          </Button>
                        )}
                        
                        {isSaved && (
                          <div className="flex items-center gap-2 text-secondary font-medium text-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            {readingLabels[textLang]?.saved || readingLabels.fr.saved}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div 
                ref={textContainerRef}
                className={`reading-text select-text ${getReadingTextClasses(fontSize, lineSpacing)}`}
              >
                {renderFormattedText()}
              </div>

              {/* "Text fertig gelesen" button at the bottom */}
              <div className="mt-10 pt-6 border-t border-border flex justify-center">
                <Button
                  onClick={() => setShowFeedbackDialog(true)}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setShowFeedbackDialog(true);
                  }}
                  className="btn-accent-kid flex items-center gap-3 text-lg py-4 px-8 min-h-[56px] touch-manipulation"
                >
                  <CheckCircle2 className="h-6 w-6" />
                  {readingLabels[textLang]?.finishedReading || readingLabels.fr.finishedReading}
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

                    // Log activity via RPC (handles stars, streak, badges, user_results)
                    try {
                      const result = await supabase.rpc('log_activity', {
                        p_child_id: childId,
                        p_activity_type: 'story_read',
                        p_stars: starRewards.stars_story_read,
                        p_metadata: { story_id: id, difficulty: story?.difficulty || 'medium' },
                      });

                      const data = result.data as any;
                      if (data?.new_badges?.length > 0) {
                        setPendingBadges(data.new_badges);
                      }
                    } catch (e) {
                      // Silent fail – gamification should not block UX
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

                      setQuizResult({ correctCount, totalCount });
                      setQuizCompleted(true);

                      const childId = story?.kid_profile_id || selectedProfile?.id || null;

                      // Log activity via RPC (handles stars, streak, badges, user_results)
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

                        const data = result.data as any;
                        if (data?.new_badges?.length > 0) {
                          setPendingBadges(data.new_badges);
                        }
                      } catch (e) {
                        // Silent fail – gamification should not block UX
                      }
                      refreshProgress();

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
                    appLanguage={textLang}
                    onContinue={() => navigate("/stories")}
                  />
                  
                  {/* Continue Series Button - shown for series with cliffhanger ending */}
                  {story?.ending_type === 'C' && story?.series_id && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <Button
                        onClick={handleContinueSeries}
                        disabled={isGeneratingContinuation}
                        className="w-full btn-primary-kid flex items-center justify-center gap-3 text-lg py-5"
                      >
                        {isGeneratingContinuation ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            {readingLabels[textLang]?.generatingContinuation || "Creating..."}
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
                  )}
                </div>
              )}
              
              {/* Series continuation for stories without quiz */}
              {!showQuiz && !hasQuestions && story?.ending_type === 'C' && story?.series_id && (
                <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-4">
                  <p className="text-muted-foreground text-center">
                    {textLang === 'de' ? 'Diese Geschichte ist Teil einer Serie!' : 
                     textLang === 'fr' ? 'Cette histoire fait partie d\'une série!' :
                     'This story is part of a series!'}
                  </p>
                  <Button
                    onClick={handleContinueSeries}
                    disabled={isGeneratingContinuation}
                    className="btn-primary-kid flex items-center justify-center gap-3 text-lg py-5 px-8"
                  >
                    {isGeneratingContinuation ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {readingLabels[textLang]?.generatingContinuation || "Creating..."}
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
              )}
            </div>
          </div>

          {/* Explanation Panel - Desktop only */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              {selectedWord ? (
                <div className="explanation-panel animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-baloo text-2xl font-bold break-words max-w-[200px]">
                      {selectedWord}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={closeExplanation}
                      className="rounded-full -mt-1 -mr-1 flex-shrink-0"
                    >
                      <X className="h-5 w-5" />
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
                    <div className="space-y-4">
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
            // After story celebration: show quiz or go back
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

      {/* Level Up Overlay */}
      {pendingLevelUp && (
        <FablinoReaction
          type="levelUp"
          message={t.fablinoLevelUp.replace('{title}', pendingLevelUp.title)}
          buttonLabel={t.continueButton}
          onClose={clearPendingLevelUp}
        />
      )}

      {/* Badge Celebration Modal */}
      {pendingBadges.length > 0 && (
        <BadgeCelebrationModal
          badges={pendingBadges}
          onDismiss={() => setPendingBadges([])}
          language={textLang}
        />
      )}
    </div>
  );
};

export default ReadingPage;
