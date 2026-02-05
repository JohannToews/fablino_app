import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useColorPalette } from "@/hooks/useColorPalette";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import StoryTypeSelectionScreen from "@/components/story-creation/StoryTypeSelectionScreen";
import CharacterSelectionScreen from "@/components/story-creation/CharacterSelectionScreen";
import SettingSelectionScreen from "@/components/story-creation/SettingSelectionScreen";
import {
  StoryType,
  StorySubElement,
  EducationalTopic,
  SelectedCharacter,
  SpecialAttribute,
  LocationType,
  TimePeriod,
  storyTypeSelectionTranslations,
  characterSelectionTranslations,
  settingSelectionTranslations,
  StoryLength,
  StoryDifficulty,
} from "@/components/story-creation/types";
import { StorySettings } from "@/components/story-creation/StoryTypeSelectionScreen";
import { toast } from "sonner";
import StoryGenerationProgress from "@/components/story-creation/StoryGenerationProgress";

// Screen states for the wizard
type WizardScreen = "story-type" | "characters" | "setting" | "generating";

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
      other: customTopic || "Interessantes Thema",
    },
    fr: {
      nature: "Nature et animaux",
      monuments: "Monuments célèbres et histoire",
      countries: "Pays et villes du monde",
      science: "Science et découvertes",
      other: customTopic || "Sujet intéressant",
    },
    en: {
      nature: "Nature and animals",
      monuments: "Famous monuments and history",
      countries: "Countries and cities of the world",
      science: "Science and discoveries",
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
  const { kidAppLanguage, selectedProfile } = useKidProfile();
  const { colors: paletteColors } = useColorPalette();

  // Wizard state
  const [currentScreen, setCurrentScreen] = useState<WizardScreen>("story-type");
  const [selectedStoryType, setSelectedStoryType] = useState<StoryType | null>(null);
  const [storySettings, setStorySettings] = useState<StorySettings | null>(null);
  const [humorLevel, setHumorLevel] = useState<number | undefined>(undefined);
  const [educationalTopic, setEducationalTopic] = useState<EducationalTopic | undefined>(undefined);
  const [customTopic, setCustomTopic] = useState<string | undefined>(undefined);
  const [selectedCharacters, setSelectedCharacters] = useState<SelectedCharacter[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<SpecialAttribute[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<LocationType[]>([]);
  const [selectedTime, setSelectedTime] = useState<TimePeriod>("today");
  const [selectedSubElements, setSelectedSubElements] = useState<StorySubElement[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Translations
  const storyTypeTranslations = storyTypeSelectionTranslations[kidAppLanguage] || storyTypeSelectionTranslations.de;
  const characterTranslations = characterSelectionTranslations[kidAppLanguage] || characterSelectionTranslations.de;
  const settingTranslations = settingSelectionTranslations[kidAppLanguage] || settingSelectionTranslations.de;

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
    const textLanguage = kidAppLanguage.toUpperCase();

    toast.info(
      kidAppLanguage === "de" ? "Geschichte wird erstellt... 📚" :
      kidAppLanguage === "fr" ? "Création de l'histoire... 📚" :
      "Creating story... 📚"
    );

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
          userId: user.id,
          // Modular prompt system: CORE + KINDER-MODUL
          source: 'kid',
          isSeries: storySettings?.isSeries || false,
          storyType: "educational",
          kidName: selectedProfile?.name,
          kidHobbies: selectedProfile?.hobbies,
        },
      });

      if (error) {
        console.error("Generation error:", error);
        toast.error(
          kidAppLanguage === "de" ? "Fehler bei der Generierung" :
          kidAppLanguage === "fr" ? "Erreur lors de la génération" :
          "Error generating story"
        );
        setIsGenerating(false);
        setCurrentScreen("story-type");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setIsGenerating(false);
        setCurrentScreen("story-type");
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
            story_images: data.storyImages || null,
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
          })
          .select()
          .single();

        if (saveError) {
          console.error("Save error:", saveError);
          toast.error(
            kidAppLanguage === "de" ? "Geschichte erstellt, aber Speicherfehler" :
            kidAppLanguage === "fr" ? "Histoire créée, mais erreur de sauvegarde" :
            "Story created, but save error"
          );
          setIsGenerating(false);
          setCurrentScreen("story-type");
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
          }));
          await supabase.from("marked_words").insert(wordsToInsert);
        }

        toast.success(
          kidAppLanguage === "de" ? "Geschichte erstellt! 🎉" :
          kidAppLanguage === "fr" ? "Histoire créée! 🎉" :
          "Story created! 🎉"
        );

        // Navigate to reading page
        navigate(`/read/${savedStory.id}`);
      } else {
        toast.error(
          kidAppLanguage === "de" ? "Fehler bei der Generierung" :
          kidAppLanguage === "fr" ? "Erreur lors de la génération" :
          "Error generating story"
        );
        setIsGenerating(false);
        setCurrentScreen("story-type");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(
        kidAppLanguage === "de" ? "Fehler bei der Generierung" :
        kidAppLanguage === "fr" ? "Erreur lors de la génération" :
        "Error generating story"
      );
      setIsGenerating(false);
      setCurrentScreen("story-type");
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

  // Handle character selection complete
  const handleCharactersComplete = (
    characters: SelectedCharacter[],
    attributes: SpecialAttribute[]
  ) => {
    setSelectedCharacters(characters);
    setSelectedAttributes(attributes);
    setCurrentScreen("setting");
  };
  // Handle setting selection complete
  const handleSettingComplete = async (
    locations: LocationType[],
    timePeriod: TimePeriod
  ) => {
    setSelectedLocations(locations);
    setSelectedTime(timePeriod);
    
    // Generate the story with all collected data
    await generateFictionStory(locations, timePeriod);
  };

  // Generate fiction story (adventure, detective, friendship, funny)
  const generateFictionStory = async (
    locations: LocationType[],
    timePeriod: TimePeriod
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
    const locationNames = locations.join(", ");
    const attributeNames = selectedAttributes.join(", ");
    
    const storyTypeLabels: Record<StoryType, Record<string, string>> = {
      fantasy: { de: "Märchen- & Fantasiegeschichte", fr: "Conte & fantaisie", en: "Fairy tale & fantasy story" },
      action: { de: "Abenteuer- & Actiongeschichte", fr: "Histoire d'aventure & action", en: "Adventure & action story" },
      animals: { de: "Tiergeschichte", fr: "Histoire d'animaux", en: "Animal story" },
      everyday: { de: "Alltagsgeschichte", fr: "Histoire du quotidien", en: "Everyday story" },
      humor: { de: "Lustige Geschichte", fr: "Histoire drôle", en: "Funny story" },
      educational: { de: "Sachgeschichte", fr: "Histoire éducative", en: "Educational story" },
    };
    
    const storyTypeLabel = storyTypeLabels[selectedStoryType || "fantasy"][kidAppLanguage] || storyTypeLabels[selectedStoryType || "fantasy"].de;
    
    // Build rich description for the story generator
    let description = `${storyTypeLabel} mit ${characterNames}`;
    if (locationNames) description += ` in ${locationNames}`;
    if (timePeriod !== "today") description += ` (Zeitepoche: ${timePeriod})`;
    if (attributeNames) description += `. Besondere Elemente: ${attributeNames}`;
    if (selectedSubElements.length > 0) description += `. Themen-Elemente: ${selectedSubElements.join(", ")}`;
    if (humorLevel && humorLevel > 50) description += `. Humor-Level: ${humorLevel}%`;

    const difficulty = getDifficultyFromSchoolClass(selectedProfile?.school_class || "3");
    const textLanguage = kidAppLanguage.toUpperCase();

    toast.info(
      kidAppLanguage === "de" ? "Geschichte wird erstellt... 📚" :
      kidAppLanguage === "fr" ? "Création de l'histoire... 📚" :
      "Creating story... 📚"
    );

    try {
      const storyLength = storySettings?.length || "medium";
      const storyDifficulty = storySettings?.difficulty || difficulty;
      const isSeries = storySettings?.isSeries || false;
      
      const { data, error } = await supabase.functions.invoke("generate-story", {
        body: {
          length: storyLength,
          difficulty: storyDifficulty,
          description,
          textType: "fiction",
          textLanguage,
          userId: user.id,
          // Modular prompt system: CORE + KINDER-MODUL (+ SERIEN-MODUL if series)
          source: 'kid',
          isSeries,
          storyType: selectedStoryType,
          // Character and setting data for richer generation
          characters: selectedCharacters.map(c => ({
            name: c.name,
            type: c.type,
            age: c.age,
            gender: c.gender,
          })),
          locations,
          timePeriod,
          specialAttributes: selectedAttributes,
          subElements: selectedSubElements,
          humorLevel,
          // Kid profile for personalization
          kidName: selectedProfile?.name,
          kidHobbies: selectedProfile?.hobbies,
          // Series settings
          endingType: isSeries ? 'C' : 'A', // Cliffhanger for series, closed for standalone
        },
      });

      if (error) {
        console.error("Generation error:", error);
        toast.error(
          kidAppLanguage === "de" ? "Fehler bei der Generierung" :
          kidAppLanguage === "fr" ? "Erreur lors de la génération" :
          "Error generating story"
        );
        setIsGenerating(false);
        setCurrentScreen("story-type");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setIsGenerating(false);
        setCurrentScreen("story-type");
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
            story_images: data.storyImages || null,
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
          })
          .select()
          .single();

        if (saveError) {
          console.error("Save error:", saveError);
          toast.error(
            kidAppLanguage === "de" ? "Geschichte erstellt, aber Speicherfehler" :
            kidAppLanguage === "fr" ? "Histoire créée, mais erreur de sauvegarde" :
            "Story created, but save error"
          );
          setIsGenerating(false);
          setCurrentScreen("story-type");
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
          }));
          await supabase.from("marked_words").insert(wordsToInsert);
        }

        toast.success(
          kidAppLanguage === "de" ? "Geschichte erstellt! 🎉" :
          kidAppLanguage === "fr" ? "Histoire créée! 🎉" :
          "Story created! 🎉"
        );

        // Navigate to reading page
        navigate(`/read/${savedStory.id}`);
      } else {
        toast.error(
          kidAppLanguage === "de" ? "Fehler bei der Generierung" :
          kidAppLanguage === "fr" ? "Erreur lors de la génération" :
          "Error generating story"
        );
        setIsGenerating(false);
        setCurrentScreen("story-type");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(
        kidAppLanguage === "de" ? "Fehler bei der Generierung" :
        kidAppLanguage === "fr" ? "Erreur lors de la génération" :
        "Error generating story"
      );
      setIsGenerating(false);
      setCurrentScreen("story-type");
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentScreen === "story-type") {
      navigate("/");
    } else if (currentScreen === "characters") {
      setCurrentScreen("story-type");
    } else if (currentScreen === "setting") {
      setCurrentScreen("characters");
    }
  };

  // Loading screen while generating
  if (currentScreen === "generating" || isGenerating) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg} flex items-center justify-center`}>
        <StoryGenerationProgress language={kidAppLanguage} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg}`}>
      {currentScreen === "story-type" && (
        <StoryTypeSelectionScreen
          translations={storyTypeTranslations}
          onComplete={handleStoryTypeComplete}
          onBack={handleBack}
        />
      )}

      {currentScreen === "characters" && (
        <CharacterSelectionScreen
          translations={characterTranslations}
          onComplete={handleCharactersComplete}
          onBack={handleBack}
        />
      )}

      {currentScreen === "setting" && (
        <SettingSelectionScreen
          translations={settingTranslations}
          onComplete={handleSettingComplete}
          onBack={handleBack}
        />
      )}
    </div>
  );
};

export default CreateStoryPage;
