import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import StoryTypeSelectionScreen from "@/components/story-creation/StoryTypeSelectionScreen";
import CharacterSelectionScreen from "@/components/story-creation/CharacterSelectionScreen";
import SpecialEffectsScreen, { StorySettingsFromEffects } from "@/components/story-creation/SpecialEffectsScreen";
import {
  StoryType,
  StorySubElement,
  EducationalTopic,
  SelectedCharacter,
  SpecialAttribute,
  storyTypeSelectionTranslations,
  characterSelectionTranslations,
  StoryLength,
  StoryDifficulty,
} from "@/components/story-creation/types";
import { StorySettings } from "@/components/story-creation/StoryTypeSelectionScreen";
import { toast } from "sonner";
import { useTranslations } from "@/lib/translations";
import StoryGenerationProgress from "@/components/story-creation/StoryGenerationProgress";
import FablinoPageHeader from "@/components/FablinoPageHeader";
import { FABLINO_STYLES, FABLINO_COLORS } from "@/constants/design-tokens";

// Fablino messages for the entry screen (per language)
const FABLINO_ENTRY_MSG: Record<string, (name: string) => string> = {
  fr: (n) => n ? `Super ${n} ! Comment on crée ton histoire ? 🎨` : `Super ! Comment on crée ton histoire ? 🎨`,
  de: (n) => n ? `Super ${n}! Wie soll deine Geschichte entstehen? 🎨` : `Super! Wie soll deine Geschichte entstehen? 🎨`,
  en: (n) => n ? `Awesome ${n}! How shall we create your story? 🎨` : `Awesome! How shall we create your story? 🎨`,
  es: (n) => n ? `¡Genial ${n}! ¿Cómo creamos tu historia? 🎨` : `¡Genial! ¿Cómo creamos tu historia? 🎨`,
  nl: (n) => n ? `Super ${n}! Hoe maken we jouw verhaal? 🎨` : `Super! Hoe maken we jouw verhaal? 🎨`,
  it: (n) => n ? `Fantastico ${n}! Come creiamo la tua storia? 🎨` : `Fantastico! Come creiamo la tua storia? 🎨`,
  bs: (n) => n ? `Super ${n}! Kako pravimo tvoju priču? 🎨` : `Super! Kako pravimo tvoju priču? 🎨`,
};

const FABLINO_THEME_MSG: Record<string, string> = {
  fr: "Quel monde on explore aujourd'hui ? 🌍",
  de: "Welche Welt erkunden wir heute? 🌍",
  en: "What world shall we explore today? 🌍",
  es: "¿Qué mundo exploramos hoy? 🌍",
  nl: "Welke wereld verkennen we vandaag? 🌍",
  it: "Che mondo esploriamo oggi? 🌍",
  bs: "Koji svijet istražujemo danas? 🌍",
};

const FABLINO_CHARACTERS_MSG: Record<string, string> = {
  fr: "Qui vient avec toi dans l'aventure ? 👫",
  de: "Wer kommt mit auf das Abenteuer? 👫",
  en: "Who's coming on the adventure? 👫",
  es: "¿Quién viene a la aventura? 👫",
  nl: "Wie gaat er mee op avontuur? 👫",
  it: "Chi viene nell'avventura? 👫",
  bs: "Ko ide s tobom u avanturu? 👫",
};

const FABLINO_EFFECTS_MSG: Record<string, string> = {
  fr: "Et si on ajoutait un peu de magie ? ✨",
  de: "Wie wäre es mit etwas Magie? ✨",
  en: "How about some magic? ✨",
  es: "¿Y si añadimos un poco de magia? ✨",
  nl: "Zullen we wat magie toevoegen? ✨",
  it: "E se aggiungessimo un po' di magia? ✨",
  bs: "Šta kažeš na malo magije? ✨",
};

// Screen states for the wizard
type WizardScreen = "entry" | "story-type" | "characters" | "effects" | "generating";

// Wizard path: free (Weg A) or guided (Weg B)
type WizardPath = "free" | "guided" | null;

// Map school class to difficulty
const getDifficultyFromSchoolClass = (schoolClass: string): string => {
  const classNum = parseInt(schoolClass.replace(/\D/g, ''), 10);
  if (isNaN(classNum)) return "medium";
  if (classNum <= 2) return "easy";
  if (classNum <= 4) return "medium";
  return "hard";
};

// Map educational topic to description
const getEducationalDescription = (
  topic: EducationalTopic,
  customTopic: string | undefined,
  language: string
): string => {
  const topicLabels: Record<string, Record<EducationalTopic, string>> = {
    de: {
      nature: "Natur und Tiere",
      monuments: "Berühmte Monumente und Geschichte",
      countries: "Länder und Städte der Welt",
      science: "Wissenschaft und Entdeckungen",
      music: "Musik und Kunst",
      other: customTopic || "Interessantes Thema",
    },
    fr: {
      nature: "Nature et animaux",
      monuments: "Monuments célèbres et histoire",
      countries: "Pays et villes du monde",
      science: "Science et découvertes",
      music: "Musique et art",
      other: customTopic || "Sujet intéressant",
    },
    en: {
      nature: "Nature and animals",
      monuments: "Famous monuments and history",
      countries: "Countries and cities of the world",
      science: "Science and discoveries",
      music: "Music and art",
      other: customTopic || "Interesting topic",
    },
  };

  const labels = topicLabels[language] || topicLabels.de;
  const baseLabel = labels[topic] || labels.other;
  
  // If custom topic is provided, combine it with the category
  if (customTopic && topic !== "other") {
    return `${baseLabel}: ${customTopic}`;
  }
  
  return baseLabel;
};

const CreateStoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    kidAppLanguage, 
    kidReadingLanguage, 
    kidExplanationLanguage, 
    kidHomeLanguages, 
    kidStoryLanguages, 
    selectedProfile,
    selectedProfileId,
  } = useKidProfile();

  // Wizard state
  const [currentScreen, setCurrentScreen] = useState<WizardScreen>("entry");
  const [wizardPath, setWizardPath] = useState<WizardPath>(null);
  const [selectedStoryType, setSelectedStoryType] = useState<StoryType | null>(null);
  const [storySettings, setStorySettings] = useState<StorySettings | null>(null);
  const [humorLevel, setHumorLevel] = useState<number | undefined>(undefined);
  const [educationalTopic, setEducationalTopic] = useState<EducationalTopic | undefined>(undefined);
  const [customTopic, setCustomTopic] = useState<string | undefined>(undefined);
  const [selectedCharacters, setSelectedCharacters] = useState<SelectedCharacter[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<SpecialAttribute[]>([]);
  const [additionalDescription, setAdditionalDescription] = useState<string>("");
  const [selectedSubElements, setSelectedSubElements] = useState<StorySubElement[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Translations
  const t = useTranslations(kidAppLanguage);
  const storyTypeTranslations = storyTypeSelectionTranslations[kidAppLanguage] || storyTypeSelectionTranslations.de;
  const characterTranslations = characterSelectionTranslations[kidAppLanguage] || characterSelectionTranslations.de;

  // Compute available languages for story generation from story_languages (Block 2.3d+)
  const availableLanguages = kidStoryLanguages.length > 0
    ? kidStoryLanguages
    : [kidReadingLanguage];

  // Generate educational story directly
  const generateEducationalStory = async (
    topic: EducationalTopic,
    customTopicText: string | undefined
  ) => {
    if (!user?.id) {
      toast.error("Bitte melde dich erneut an");
      navigate("/");
      return;
    }

    setIsGenerating(true);
    setCurrentScreen("generating");

    const description = getEducationalDescription(topic, customTopicText, kidAppLanguage);
    const difficulty = getDifficultyFromSchoolClass(selectedProfile?.school_class || "3");
    // Use storyLanguage from wizard settings if available, fallback to reading_language
    const effectiveLanguage = storySettings?.storyLanguage || kidReadingLanguage;
    const textLanguage = effectiveLanguage.toUpperCase();

    toast.info(t.toastGeneratingStory);

    try {
      // Use story settings from wizard if available, otherwise defaults
      const storyLength = storySettings?.length || "medium";
      const storyDifficulty = storySettings?.difficulty || difficulty;
      
      const { data, error } = await supabase.functions.invoke("generate-story", {
        body: {
          length: storyLength,
          difficulty: storyDifficulty,
          description,
          textType: "non-fiction",
          textLanguage,
          globalLanguage: kidAppLanguage,
          userId: user.id,
          // Modular prompt system: CORE + KINDER-MODUL
          source: 'kid',
          isSeries: storySettings?.isSeries || false,
          storyType: "educational",
          kidName: selectedProfile?.name,
          kidHobbies: selectedProfile?.hobbies,
          // Block 2.3d: New wizard parameters (camelCase to match Edge Function)
          storyLanguage: effectiveLanguage,
          kidProfileId: selectedProfile?.id,
          kidAge: selectedProfile?.age,
          difficultyLevel: selectedProfile?.difficulty_level,
          contentSafetyLevel: selectedProfile?.content_safety_level,
        },
      });

      if (error) {
        console.error("Generation error:", error);
        toast.error(t.toastGenerationError);
        setIsGenerating(false);
        setCurrentScreen("entry");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setIsGenerating(false);
        setCurrentScreen("entry");
        return;
      }

      if (data?.title && data?.content) {
        // Use story settings from wizard if available
        const storyLength = storySettings?.length || "medium";
        const storyDifficulty = storySettings?.difficulty || difficulty;
        const isSeries = storySettings?.isSeries || false;
        
        // Save the story to database
        // For series: first episode has series_id = null, episode_number = 1
        const { data: savedStory, error: saveError } = await supabase
          .from("stories")
          .insert({
            title: data.title,
            content: data.content,
            cover_image_url: data.coverImageBase64 || null,
            cover_image_status: data.coverImageBase64 ? 'complete' : 'pending',
            story_images: data.storyImages || null,
            story_images_status: (data.storyImages && data.storyImages.length > 0) ? 'complete' : 'pending',
            image_count: data.image_count || 1,
            difficulty: storyDifficulty,
            text_type: "non-fiction",
            text_language: textLanguage.toLowerCase(),
            prompt: description,
            user_id: user.id,
            kid_profile_id: selectedProfile?.id,
            generation_status: "verified",
            ending_type: isSeries ? 'C' : 'A',
            episode_number: isSeries ? 1 : null,
            series_id: null,
            // Block 2.3c: Story classification metadata
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
          })
          .select()
          .single();

        if (saveError) {
          console.error("Save error:", saveError);
          toast.error(t.toastSaveError);
          setIsGenerating(false);
          setCurrentScreen("entry");
          return;
        }

        // Save comprehension questions if available
        if (data.questions?.length > 0 && savedStory) {
          const questionsToInsert = data.questions.map((q: { question: string; correctAnswer?: string; expectedAnswer?: string; options?: string[] }, idx: number) => ({
            story_id: savedStory.id,
            question: q.question,
            expected_answer: q.correctAnswer || q.expectedAnswer || '',
            options: q.options || [],
            order_index: idx,
            question_language: kidReadingLanguage,
          }));
          await supabase.from("comprehension_questions").insert(questionsToInsert);
        }

        // Save vocabulary words if available
        if (data.vocabulary?.length > 0 && savedStory) {
          const wordsToInsert = data.vocabulary.map((v: { word: string; explanation: string }) => ({
            story_id: savedStory.id,
            word: v.word,
            explanation: v.explanation,
            difficulty: "medium",
            word_language: kidReadingLanguage,
            explanation_language: kidExplanationLanguage,
          }));
          await supabase.from("marked_words").insert(wordsToInsert);
        }

        toast.success(t.toastStoryCreated);

        // Navigate to reading page
        navigate(`/read/${savedStory.id}`);
      } else {
        toast.error(t.toastGenerationError);
        setIsGenerating(false);
        setCurrentScreen("entry");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(t.toastGenerationError);
      setIsGenerating(false);
      setCurrentScreen("entry");
    }
  };

  // Handle story type selection complete
  const handleStoryTypeComplete = async (
    storyType: StoryType, 
    settings: StorySettings,
    humor?: number, 
    topic?: EducationalTopic, 
    customTopicText?: string,
    subElements?: StorySubElement[]
  ) => {
    setSelectedStoryType(storyType);
    setStorySettings(settings);
    setHumorLevel(humor);
    setEducationalTopic(topic);
    setCustomTopic(customTopicText);
    setSelectedSubElements(subElements || []);

    // For educational stories, generate directly without character/setting screens
    if (storyType === "educational" && topic) {
      await generateEducationalStory(topic, customTopicText);
      return;
    }

    // For other story types, continue to character selection
    setCurrentScreen("characters");
  };

  // Track surprise_characters flag (Block 2.3e)
  const [surpriseCharactersFlag, setSurpriseCharactersFlag] = useState(false);

  // Handle character selection complete
  const handleCharactersComplete = (characters: SelectedCharacter[], surpriseChars?: boolean) => {
    setSelectedCharacters(characters);
    setSurpriseCharactersFlag(surpriseChars || false);
    setCurrentScreen("effects");
  };
  
  // Handle special effects selection complete
  const handleEffectsComplete = async (
    attributes: SpecialAttribute[],
    description: string,
    settingsFromEffects?: StorySettingsFromEffects
  ) => {
    setSelectedAttributes(attributes);
    setAdditionalDescription(description);
    
    // For Weg A (free path), settings come from the effects screen
    if (settingsFromEffects) {
      setStorySettings({
        length: settingsFromEffects.length,
        difficulty: settingsFromEffects.difficulty,
        isSeries: settingsFromEffects.isSeries,
        storyLanguage: settingsFromEffects.storyLanguage,
      });
    }
    
    // Generate the story with all collected data
    await generateFictionStory(attributes, description, settingsFromEffects);
  };

  // Generate fiction story (adventure, detective, friendship, funny)
  const generateFictionStory = async (
    effectAttributes: SpecialAttribute[],
    userDescription: string,
    settingsOverride?: StorySettingsFromEffects
  ) => {
    if (!user?.id) {
      toast.error("Bitte melde dich erneut an");
      navigate("/");
      return;
    }

    setIsGenerating(true);
    setCurrentScreen("generating");

    // Build description from all wizard selections
    const characterNames = selectedCharacters.map(c => c.name).join(", ");
    const allAttributes = [...new Set([...selectedAttributes, ...effectAttributes])];
    const attributeNames = allAttributes.filter(a => a !== "normal").join(", ");
    
    const storyTypeLabels: Record<StoryType, Record<string, string>> = {
      fantasy: { de: "Märchen- & Fantasiegeschichte", fr: "Conte & fantaisie", en: "Fairy tale & fantasy story" },
      action: { de: "Abenteuer- & Actiongeschichte", fr: "Histoire d'aventure & action", en: "Adventure & action story" },
      animals: { de: "Tiergeschichte", fr: "Histoire d'animaux", en: "Animal story" },
      everyday: { de: "Alltagsgeschichte", fr: "Histoire du quotidien", en: "Everyday story" },
      humor: { de: "Lustige Geschichte", fr: "Histoire drôle", en: "Funny story" },
      educational: { de: "Sachgeschichte", fr: "Histoire éducative", en: "Educational story" },
      surprise: { de: "Überraschungsgeschichte", fr: "Histoire surprise", en: "Surprise story" },
    };
    
    // For Weg A, storyType may be null – build description accordingly
    const effectiveStoryType = selectedStoryType;
    let description = "";
    if (effectiveStoryType) {
      const storyTypeLabel = storyTypeLabels[effectiveStoryType][kidAppLanguage] || storyTypeLabels[effectiveStoryType].de;
      description = characterNames ? `${storyTypeLabel} mit ${characterNames}` : storyTypeLabel;
    } else if (characterNames) {
      description = characterNames;
    }
    if (attributeNames) description += description ? `. Besondere Eigenschaften: ${attributeNames}` : `Besondere Eigenschaften: ${attributeNames}`;
    if (selectedSubElements.length > 0) description += `. Themen-Elemente: ${selectedSubElements.join(", ")}`;
    if (humorLevel && humorLevel > 50) description += `. Humor-Level: ${humorLevel}%`;
    if (userDescription) description += description ? `. Zusätzliche Wünsche: ${userDescription}` : userDescription;

    const difficulty = getDifficultyFromSchoolClass(selectedProfile?.school_class || "3");
    // Use storyLanguage from settings override (Weg A) or wizard settings or fallback
    const effectiveLanguage = settingsOverride?.storyLanguage || storySettings?.storyLanguage || kidReadingLanguage;
    const textLanguage = effectiveLanguage.toUpperCase();

    toast.info(t.toastGeneratingStory);

    try {
      const storyLength = settingsOverride?.length || storySettings?.length || "medium";
      const storyDifficulty = settingsOverride?.difficulty || storySettings?.difficulty || difficulty;
      const isSeries = settingsOverride?.isSeries || storySettings?.isSeries || false;

      // Determine include_self from character selection
      const includeSelf = selectedCharacters.some(c => c.type === "me");
      
      const { data, error } = await supabase.functions.invoke("generate-story", {
        body: {
          length: storyLength,
          difficulty: storyDifficulty,
          description,
          textType: "fiction",
          textLanguage,
          globalLanguage: kidAppLanguage,
          userId: user.id,
          // Modular prompt system: CORE + KINDER-MODUL (+ SERIEN-MODUL if series)
          source: 'kid',
          isSeries,
          storyType: selectedStoryType,
          // Character data for richer generation
          characters: selectedCharacters.map(c => ({
            name: c.name,
            type: c.type,
            age: c.age,
            gender: c.gender,
            role: c.role,
            relation: c.relation,
            description: c.description,
          })),
          specialAttributes: allAttributes,
          subElements: selectedSubElements,
          humorLevel,
          additionalDescription: userDescription,
          // Kid profile for personalization
          kidName: selectedProfile?.name,
          kidHobbies: selectedProfile?.hobbies,
          // Series settings
          endingType: isSeries ? 'C' : 'A', // Cliffhanger for series, closed for standalone
          // Block 2.3d: New wizard parameters (camelCase to match Edge Function)
          storyLanguage: effectiveLanguage,
          includeSelf,
          surprise_characters: surpriseCharactersFlag,
          kidProfileId: selectedProfile?.id,
          kidAge: selectedProfile?.age,
          difficultyLevel: selectedProfile?.difficulty_level,
          contentSafetyLevel: selectedProfile?.content_safety_level,
        },
      });

      if (error) {
        console.error("Generation error:", error);
        toast.error(t.toastGenerationError);
        setIsGenerating(false);
        setCurrentScreen("entry");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setIsGenerating(false);
        setCurrentScreen("entry");
        return;
      }

      if (data?.title && data?.content) {
        // Save the story to database
        // For series: first episode has series_id = null, episode_number = 1
        // Subsequent episodes will reference this story's id as series_id
        const { data: savedStory, error: saveError } = await supabase
          .from("stories")
          .insert({
            title: data.title,
            content: data.content,
            cover_image_url: data.coverImageBase64 || null,
            cover_image_status: data.coverImageBase64 ? 'complete' : 'pending',
            story_images: data.storyImages || null,
            story_images_status: (data.storyImages && data.storyImages.length > 0) ? 'complete' : 'pending',
            image_count: data.image_count || 1,
            difficulty: storyDifficulty,
            text_type: "fiction",
            text_language: textLanguage.toLowerCase(),
            prompt: description,
            user_id: user.id,
            kid_profile_id: selectedProfile?.id,
            generation_status: "verified",
            ending_type: isSeries ? 'C' : 'A',
            // Series setup: first episode is the series root
            episode_number: isSeries ? 1 : null,
            series_id: null, // First episode doesn't have a series_id - it IS the series
            // Block 2.3c: Story classification metadata
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
          })
          .select()
          .single();

        if (saveError) {
          console.error("Save error:", saveError);
          toast.error(t.toastSaveError);
          setIsGenerating(false);
          setCurrentScreen("entry");
          return;
        }

        // Save comprehension questions if available
        if (data.questions?.length > 0 && savedStory) {
          const questionsToInsert = data.questions.map((q: { question: string; correctAnswer?: string; expectedAnswer?: string; options?: string[] }, idx: number) => ({
            story_id: savedStory.id,
            question: q.question,
            expected_answer: q.correctAnswer || q.expectedAnswer || '',
            options: q.options || [],
            order_index: idx,
            question_language: kidReadingLanguage,
          }));
          await supabase.from("comprehension_questions").insert(questionsToInsert);
        }

        // Save vocabulary words if available
        if (data.vocabulary?.length > 0 && savedStory) {
          const wordsToInsert = data.vocabulary.map((v: { word: string; explanation: string }) => ({
            story_id: savedStory.id,
            word: v.word,
            explanation: v.explanation,
            difficulty: "medium",
            word_language: kidReadingLanguage,
            explanation_language: kidExplanationLanguage,
          }));
          await supabase.from("marked_words").insert(wordsToInsert);
        }

        toast.success(t.toastStoryCreated);

        // Navigate to reading page
        navigate(`/read/${savedStory.id}`);
      } else {
        toast.error(t.toastGenerationError);
        setIsGenerating(false);
        setCurrentScreen("entry");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(t.toastGenerationError);
      setIsGenerating(false);
      setCurrentScreen("entry");
    }
  };

  // Handle entry screen path selection
  const handlePathSelect = (path: WizardPath) => {
    setWizardPath(path);
    if (path === "free") {
      // Weg A: Skip to effects screen directly
      setCurrentScreen("effects");
    } else {
      // Weg B: Normal guided flow
      setCurrentScreen("story-type");
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentScreen === "entry") {
      navigate("/");
    } else if (currentScreen === "story-type") {
      setCurrentScreen("entry");
    } else if (currentScreen === "characters") {
      setCurrentScreen("story-type");
    } else if (currentScreen === "effects") {
      if (wizardPath === "free") {
        // Weg A: go back to entry
        setCurrentScreen("entry");
      } else {
        setCurrentScreen("characters");
      }
    }
  };

  // Loading screen while generating
  if (currentScreen === "generating" || isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg, #FFF7ED 0%, #FEF3C7 50%, #EFF6FF 100%)" }}>
        <StoryGenerationProgress language={kidAppLanguage} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center font-nunito" style={{ background: "linear-gradient(160deg, #FFF7ED 0%, #FEF3C7 50%, #EFF6FF 100%)" }}>
      {currentScreen === "entry" && (
        <div className="w-full max-w-[480px] px-5 py-6 flex flex-col mx-auto">
          {/* Back button */}
          <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-lg hover:bg-white/30 transition-colors w-fit mb-1">
            <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>

          {/* Fablino greeting – same position as homepage */}
          <FablinoPageHeader
            mascotImage="/mascot/5_new_story.png"
            message={(FABLINO_ENTRY_MSG[kidAppLanguage] || FABLINO_ENTRY_MSG.de)(selectedProfile?.name || "")}
            mascotSize="md"
          />

          {/* Two path cards */}
          <div className="flex flex-col items-center gap-3 w-full mt-4">
            {/* Weg A: Free */}
            <button
              onClick={() => handlePathSelect("free")}
              className="w-full bg-white rounded-2xl shadow-sm border border-[#E8863A]/10 p-5 text-left cursor-pointer transition-all hover:shadow-md hover:border-[#E8863A]/30"
            >
              <div className="flex flex-row items-center gap-4">
                <span className="text-[32px] flex-shrink-0 w-10 text-center">✏️</span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold" style={{ color: FABLINO_COLORS.text }}>
                    {t.wizardPathFree}
                  </h2>
                  <p className="text-sm mt-0.5" style={{ color: `${FABLINO_COLORS.text}99` }}>
                    {t.wizardPathFreeHint}
                  </p>
                </div>
              </div>
            </button>

            {/* Weg B: Guided */}
            <button
              onClick={() => handlePathSelect("guided")}
              className="w-full bg-white rounded-2xl shadow-sm border border-[#E8863A]/10 p-5 text-left cursor-pointer transition-all hover:shadow-md hover:border-[#E8863A]/30"
            >
              <div className="flex flex-row items-center gap-4">
                <span className="text-[32px] flex-shrink-0 w-10 text-center">🧩</span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold" style={{ color: FABLINO_COLORS.text }}>
                    {t.wizardPathGuided}
                  </h2>
                  <p className="text-sm mt-0.5" style={{ color: `${FABLINO_COLORS.text}99` }}>
                    {t.wizardPathGuidedHint}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {currentScreen === "story-type" && (
        <StoryTypeSelectionScreen
          translations={storyTypeTranslations}
          availableLanguages={availableLanguages}
          defaultLanguage={kidReadingLanguage}
          uiLanguage={kidAppLanguage}
          onComplete={handleStoryTypeComplete}
          onBack={handleBack}
          fablinoMessage={(FABLINO_THEME_MSG[kidAppLanguage] || FABLINO_THEME_MSG.de)}
        />
      )}

      {currentScreen === "characters" && (
        <CharacterSelectionScreen
          translations={characterTranslations}
          kidProfileId={selectedProfile?.id ?? selectedProfileId ?? undefined}
          kidName={selectedProfile?.name}
          kidAge={selectedProfile?.age}
          onComplete={handleCharactersComplete}
          onBack={handleBack}
          fablinoMessage={(FABLINO_CHARACTERS_MSG[kidAppLanguage] || FABLINO_CHARACTERS_MSG.de)}
        />
      )}

      {currentScreen === "effects" && (
        <SpecialEffectsScreen
          onComplete={handleEffectsComplete}
          onBack={handleBack}
          showSettings={true}
          availableLanguages={availableLanguages}
          defaultLanguage={kidReadingLanguage}
          fablinoMessage={(FABLINO_EFFECTS_MSG[kidAppLanguage] || FABLINO_EFFECTS_MSG.de)}
        />
      )}
    </div>
  );
};

export default CreateStoryPage;
