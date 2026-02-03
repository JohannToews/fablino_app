import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Sparkles, BookOpen, Loader2 } from "lucide-react";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useColorPalette } from "@/hooks/useColorPalette";
import { useAuth } from "@/hooks/useAuth";
import { Language } from "@/lib/translations";
import VoiceInputField from "@/components/VoiceInputField";
import HorizontalImageCarousel from "@/components/HorizontalImageCarousel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Character images - diverse representation
import boyImg from "@/assets/characters/boy.jpg";
import girlImg from "@/assets/characters/girl.jpg";
import blackGirlImg from "@/assets/characters/black-girl.jpg";
import asianBoyImg from "@/assets/characters/asian-boy.jpg";
import robotImg from "@/assets/characters/robot.jpg";
import grandmaImg from "@/assets/characters/grandma.jpg";
import grandpaImg from "@/assets/characters/grandpa.jpg";
import foxImg from "@/assets/characters/fox.jpg";
import superheroImg from "@/assets/characters/superhero.jpg";
import wizardCatImg from "@/assets/characters/wizard-cat.jpg";
import familyImg from "@/assets/characters/family.jpg";
import boysFriendsImg from "@/assets/characters/boys-friends.jpg";
import girlsFriendsImg from "@/assets/characters/girls-friends.jpg";

// Setting images
import spaceImg from "@/assets/settings/space.jpg";
import mountainsImg from "@/assets/settings/mountains.jpg";
import arenaImg from "@/assets/settings/arena.jpg";
import desertImg from "@/assets/settings/desert.jpg";
import deepseaImg from "@/assets/settings/deepsea.jpg";
import jungleImg from "@/assets/settings/jungle.jpg";
import castleImg from "@/assets/settings/castle.jpg";
import futureCityImg from "@/assets/settings/future-city.jpg";

const characterImages = [
  boyImg, blackGirlImg, asianBoyImg, girlImg, familyImg, 
  boysFriendsImg, girlsFriendsImg, grandmaImg, grandpaImg, 
  foxImg, robotImg, superheroImg, wizardCatImg
];
const settingImages = [spaceImg, mountainsImg, arenaImg, desertImg, deepseaImg, jungleImg, castleImg, futureCityImg];

// Translations for the create story page
const createStoryTranslations: Record<Language, {
  title: string;
  back: string;
  charactersTitle: string;
  charactersPlaceholder: string;
  storyDescription: string;
  storyDescriptionPlaceholder: string;
  length: string;
  difficulty: string;
  easy: string;
  medium: string;
  hard: string;
  veryShort: string;
  short: string;
  mediumLength: string;
  long: string;
  veryLong: string;
  createStory: string;
  seriesMode: string;
  seriesDescription: string;
  episode: string;
  generating: string;
  success: string;
  error: string;
}> = {
  de: {
    title: "Eigene Geschichte erstellen",
    back: "Zurück",
    charactersTitle: "Hauptpersonen",
    charactersPlaceholder: "Beschreibe die Hauptpersonen und wie sie zueinander stehen (Geschwister, Eltern, Freunde, bekannte Menschen...)",
    storyDescription: "Worum soll es in der Geschichte gehen?",
    storyDescriptionPlaceholder: "Beschreibe kurz deine Idee (Monster und Superhelden, Fantasiegeschichten, Herausforderungen des Alltags...)",
    length: "Länge",
    difficulty: "Schwierigkeit",
    easy: "Einfach",
    medium: "Mittel",
    hard: "Schwer",
    veryShort: "Sehr kurz",
    short: "Kurz",
    mediumLength: "Mittel",
    long: "Lang",
    veryLong: "Sehr lang",
    createStory: "Geschichte erstellen",
    seriesMode: "Serie erstellen",
    seriesDescription: "Geschichte endet mit Cliffhanger und kann fortgesetzt werden",
    episode: "Episode",
    generating: "Geschichte wird erstellt...",
    success: "Geschichte erstellt!",
    error: "Fehler beim Erstellen der Geschichte",
  },
  fr: {
    title: "Créer ta propre histoire",
    back: "Retour",
    charactersTitle: "Personnages principaux",
    charactersPlaceholder: "Décris les personnages principaux et leur relation (frères et sœurs, parents, amis, connaissances...)",
    storyDescription: "De quoi doit parler l'histoire?",
    storyDescriptionPlaceholder: "Décris brièvement ton idée (Monstres et super-héros, histoires fantastiques, défis du quotidien...)",
    length: "Longueur",
    difficulty: "Difficulté",
    easy: "Facile",
    medium: "Moyen",
    hard: "Difficile",
    veryShort: "Très court",
    short: "Court",
    mediumLength: "Moyen",
    long: "Long",
    veryLong: "Très long",
    createStory: "Créer l'histoire",
    seriesMode: "Créer une série",
    seriesDescription: "L'histoire se termine par un cliffhanger et peut être continuée",
    episode: "Épisode",
    generating: "Création de l'histoire...",
    success: "Histoire créée!",
    error: "Erreur lors de la création",
  },
  en: {
    title: "Create Your Own Story",
    back: "Back",
    charactersTitle: "Main Characters",
    charactersPlaceholder: "Describe the main characters and their relationships (siblings, parents, friends, acquaintances...)",
    storyDescription: "What should the story be about?",
    storyDescriptionPlaceholder: "Briefly describe your idea (Monsters and superheroes, fantasy stories, everyday challenges...)",
    length: "Length",
    difficulty: "Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    veryShort: "Very short",
    short: "Short",
    mediumLength: "Medium",
    long: "Long",
    veryLong: "Very long",
    createStory: "Create Story",
    seriesMode: "Create series",
    seriesDescription: "Story ends with a cliffhanger and can be continued",
    episode: "Episode",
    generating: "Creating story...",
    success: "Story created!",
    error: "Error creating story",
  },
  es: {
    title: "Crea tu propia historia",
    back: "Volver",
    charactersTitle: "Personajes principales",
    charactersPlaceholder: "Describe los personajes principales y su relación (hermanos, padres, amigos, conocidos...)",
    storyDescription: "¿De qué debe tratar la historia?",
    storyDescriptionPlaceholder: "Describe brevemente tu idea (Monstruos y superhéroes, historias fantásticas, desafíos cotidianos...)",
    length: "Longitud",
    difficulty: "Dificultad",
    easy: "Fácil",
    medium: "Medio",
    hard: "Difícil",
    veryShort: "Muy corto",
    short: "Corto",
    mediumLength: "Medio",
    long: "Largo",
    veryLong: "Muy largo",
    createStory: "Crear historia",
    seriesMode: "Crear serie",
    seriesDescription: "La historia termina con un cliffhanger y puede continuarse",
    episode: "Episodio",
    generating: "Creando historia...",
    success: "¡Historia creada!",
    error: "Error al crear la historia",
  },
  nl: {
    title: "Maak je eigen verhaal",
    back: "Terug",
    charactersTitle: "Hoofdpersonages",
    charactersPlaceholder: "Beschrijf de hoofdpersonages en hun relatie (broers en zussen, ouders, vrienden, bekenden...)",
    storyDescription: "Waar moet het verhaal over gaan?",
    storyDescriptionPlaceholder: "Beschrijf kort je idee (Monsters en superhelden, fantasieverhalen, dagelijkse uitdagingen...)",
    length: "Lengte",
    difficulty: "Moeilijkheid",
    easy: "Makkelijk",
    medium: "Gemiddeld",
    hard: "Moeilijk",
    veryShort: "Zeer kort",
    short: "Kort",
    mediumLength: "Gemiddeld",
    long: "Lang",
    veryLong: "Zeer lang",
    createStory: "Verhaal maken",
    seriesMode: "Serie maken",
    seriesDescription: "Verhaal eindigt met een cliffhanger en kan worden voortgezet",
    episode: "Aflevering",
    generating: "Verhaal wordt gemaakt...",
    success: "Verhaal gemaakt!",
    error: "Fout bij het maken van het verhaal",
  },
  it: {
    title: "Crea la tua storia",
    back: "Indietro",
    charactersTitle: "Personaggi principali",
    charactersPlaceholder: "Descrivi i personaggi principali e la loro relazione (fratelli, genitori, amici, conoscenti...)",
    storyDescription: "Di cosa dovrebbe parlare la storia?",
    storyDescriptionPlaceholder: "Descrivi brevemente la tua idea (Mostri e supereroi, storie fantastiche, sfide quotidiane...)",
    length: "Lunghezza",
    difficulty: "Difficoltà",
    easy: "Facile",
    medium: "Medio",
    hard: "Difficile",
    veryShort: "Molto corto",
    short: "Corto",
    mediumLength: "Medio",
    long: "Lungo",
    veryLong: "Molto lungo",
    createStory: "Crea storia",
    seriesMode: "Crea serie",
    seriesDescription: "La storia finisce con un cliffhanger e può essere continuata",
    episode: "Episodio",
    generating: "Creazione della storia...",
    success: "Storia creata!",
    error: "Errore durante la creazione",
  },
  bs: {
    title: "Kreiraj svoju priču",
    back: "Nazad",
    charactersTitle: "Glavni likovi",
    charactersPlaceholder: "Opiši glavne likove i njihov odnos (braća i sestre, roditelji, prijatelji, poznanici...)",
    storyDescription: "O čemu treba biti priča?",
    storyDescriptionPlaceholder: "Kratko opiši svoju ideju (Čudovišta i superheroji, fantastične priče, svakodnevni izazovi...)",
    length: "Dužina",
    difficulty: "Težina",
    easy: "Lako",
    medium: "Srednje",
    hard: "Teško",
    veryShort: "Vrlo kratko",
    short: "Kratko",
    mediumLength: "Srednje",
    long: "Dugo",
    veryLong: "Vrlo dugo",
    createStory: "Kreiraj priču",
    seriesMode: "Kreiraj seriju",
    seriesDescription: "Priča završava s cliffhangerom i može se nastaviti",
    episode: "Epizoda",
    generating: "Kreiranje priče...",
    success: "Priča kreirana!",
    error: "Greška pri kreiranju",
  },
};

const CreateStoryPage = () => {
  const navigate = useNavigate();
  const { kidAppLanguage, selectedProfile } = useKidProfile();
  const { user } = useAuth();
  const { colors: paletteColors } = useColorPalette();
  const t = createStoryTranslations[kidAppLanguage] || createStoryTranslations.de;

  // Get language from school system
  const storyLanguage = selectedProfile?.school_system || "de";

  const [charactersDescription, setCharactersDescription] = useState("");
  const [storyDescription, setStoryDescription] = useState("");
  const [length, setLength] = useState("medium");
  const [difficulty, setDifficulty] = useState("medium");
  const [isSeries, setIsSeries] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customSystemPrompt, setCustomSystemPrompt] = useState("");

  const canCreate = charactersDescription.trim() && storyDescription.trim() && !isGenerating;

  // Load system prompt
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
      } else {
        // Fallback to German
        const { data: fallbackData } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "system_prompt_de")
          .maybeSingle();
        
        if (fallbackData) {
          setCustomSystemPrompt(fallbackData.value);
        }
      }
    };
    loadSystemPrompt();
  }, [kidAppLanguage]);

  // Get a filter color based on the palette for monochromatic effect
  const getFilterColor = () => {
    return "hsl(var(--primary) / 0.6)";
  };

  const handleCreateStory = async () => {
    if (!canCreate) return;

    setIsGenerating(true);
    toast.info(t.generating + " ✨📖");

    try {
      // Combine characters and story description into a single prompt
      const fullDescription = `Hauptpersonen: ${charactersDescription}\n\nGeschichte: ${storyDescription}`;

      // Call the generate-story edge function
      const { data, error } = await supabase.functions.invoke("generate-story", {
        body: {
          length,
          difficulty,
          description: fullDescription,
          textType: "fiction",
          textLanguage: storyLanguage.toUpperCase(),
          customSystemPrompt,
          // Series mode parameters
          endingType: isSeries ? "C" : null,
          episodeNumber: isSeries ? 1 : null,
        },
      });

      if (error) {
        console.error("Generation error:", error);
        toast.error(t.error);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.title && data?.content) {
        // Upload cover image if available
        let coverUrl = null;
        if (data.coverImageBase64) {
          const base64Data = data.coverImageBase64.replace(/^data:image\/\w+;base64,/, "");
          const fileName = `${Date.now()}-cover.png`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("covers")
            .upload(fileName, Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)), {
              contentType: "image/png",
            });
          
          if (!uploadError && uploadData) {
            const { data: urlData } = supabase.storage.from("covers").getPublicUrl(fileName);
            coverUrl = urlData.publicUrl;
          }
        }

        // Save story to database
        const { data: storyData, error: storyError } = await supabase
          .from("stories")
          .insert({
            title: data.title,
            content: data.content,
            difficulty,
            text_type: "fiction",
            text_language: storyLanguage.toLowerCase(),
            prompt: fullDescription,
            cover_image_url: coverUrl,
            story_images: data.storyImages || [],
            user_id: user?.id,
            kid_profile_id: selectedProfile?.id,
            ending_type: isSeries ? "C" : null,
            episode_number: isSeries ? 1 : null,
          })
          .select()
          .single();

        if (storyError) {
          console.error("Error saving story:", storyError);
          toast.error(t.error);
          return;
        }

        // If series, update series_id to point to itself (first episode)
        if (isSeries && storyData) {
          await supabase
            .from("stories")
            .update({ series_id: storyData.id })
            .eq("id", storyData.id);
        }

        // Save comprehension questions if available
        if (data.questions && data.questions.length > 0 && storyData) {
          const questionsToInsert = data.questions.map((q: { question: string; expectedAnswer: string }, idx: number) => ({
            story_id: storyData.id,
            question: q.question,
            expected_answer: q.expectedAnswer,
            order_index: idx,
          }));

          await supabase.from("comprehension_questions").insert(questionsToInsert);
        }

        // Save vocabulary words if available
        if (data.vocabulary && data.vocabulary.length > 0 && storyData) {
          const wordsToInsert = data.vocabulary.map((v: { word: string; explanation: string }) => ({
            story_id: storyData.id,
            word: v.word,
            explanation: v.explanation,
            difficulty: "medium",
          }));

          await supabase.from("marked_words").insert(wordsToInsert);
        }

        toast.success(t.success + " 🎉");
        
        // Navigate to reading page with the new story
        navigate(`/read/${storyData.id}`);
      } else {
        toast.error(t.error);
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(t.error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`min-h-screen md:h-screen md:overflow-hidden bg-gradient-to-br ${paletteColors.bg}`}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-2 md:py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} disabled={isGenerating}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg md:text-xl font-baloo font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            {t.title}
          </h1>
        </div>
      </div>

      <div className="relative md:h-[calc(100vh-52px)] md:flex md:flex-col md:justify-center">
        {/* Characters Section with Horizontal Carousel Behind */}
        <div className="relative py-3 md:py-4">
          {/* Horizontal Character Carousel - Behind the card */}
          <div className="absolute inset-0 flex items-center z-0 overflow-hidden">
            <HorizontalImageCarousel 
              images={characterImages} 
              direction="left" 
              speed={60}
              imageSize="medium"
              className="w-full"
              filterColor={getFilterColor()}
            />
          </div>

          {/* Main Content - Characters Card */}
          <div className="container max-w-lg mx-auto px-4 relative z-10">
            <Card className="border-2 border-primary/20 bg-card/95 backdrop-blur-sm shadow-xl ring-1 ring-primary/10">
              <CardHeader className="pb-1 pt-3 md:pt-4">
                <CardTitle className="text-base md:text-lg font-baloo">{t.charactersTitle}</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <VoiceInputField
                  value={charactersDescription}
                  onChange={setCharactersDescription}
                  placeholder={t.charactersPlaceholder}
                  language={storyLanguage}
                  multiline
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Story Description Section with Horizontal Carousel Behind */}
        <div className="relative py-3 md:py-4">
          {/* Horizontal Settings Carousel - Behind the card */}
          <div className="absolute inset-0 flex items-center z-0 overflow-hidden">
            <HorizontalImageCarousel 
              images={settingImages} 
              direction="right" 
              speed={55}
              imageSize="medium"
              className="w-full"
              filterColor={getFilterColor()}
            />
          </div>

          {/* Main Content - Story Description Card */}
          <div className="container max-w-lg mx-auto px-4 relative z-10">
            <Card className="border-2 border-accent/20 bg-card/95 backdrop-blur-sm shadow-xl ring-1 ring-accent/10">
              <CardHeader className="pb-1 pt-3 md:pt-4">
                <CardTitle className="text-base md:text-lg font-baloo">{t.storyDescription}</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <VoiceInputField
                  value={storyDescription}
                  onChange={setStoryDescription}
                  placeholder={t.storyDescriptionPlaceholder}
                  language={storyLanguage}
                  multiline
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Settings & Create Button */}
        <div className="container max-w-lg mx-auto px-4 py-3 md:py-4 space-y-3">
          {/* Compact Options Row */}
          <div className="flex items-center gap-2 bg-card/95 backdrop-blur-sm rounded-xl p-2 border border-muted shadow-sm">
            {/* Length */}
            <div className="flex items-center gap-1.5 flex-1">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">{t.length}</Label>
              <Select value={length} onValueChange={setLength} disabled={isGenerating}>
                <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="very_short">{t.veryShort}</SelectItem>
                  <SelectItem value="short">{t.short}</SelectItem>
                  <SelectItem value="medium">{t.mediumLength}</SelectItem>
                  <SelectItem value="long">{t.long}</SelectItem>
                  <SelectItem value="very_long">{t.veryLong}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-px h-6 bg-border" />

            {/* Difficulty */}
            <div className="flex items-center gap-1.5 flex-1">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">{t.difficulty}</Label>
              <Select value={difficulty} onValueChange={setDifficulty} disabled={isGenerating}>
                <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">{t.easy}</SelectItem>
                  <SelectItem value="medium">{t.medium}</SelectItem>
                  <SelectItem value="difficult">{t.hard}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-px h-6 bg-border" />

            {/* Series Toggle - Compact */}
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-accent hidden sm:block" />
              <Label htmlFor="series-mode" className="text-xs cursor-pointer whitespace-nowrap">
                {t.seriesMode}
              </Label>
              <Switch
                id="series-mode"
                checked={isSeries}
                onCheckedChange={setIsSeries}
                disabled={isGenerating}
                className="scale-90"
              />
            </div>
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreateStory}
            disabled={!canCreate}
            className="w-full h-12 text-base md:text-lg font-baloo btn-primary-kid"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 md:h-5 md:w-5 mr-2 animate-spin" />
                {t.generating}
              </>
            ) : isSeries ? (
              <>
                <BookOpen className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                {t.seriesMode} - {t.episode} 1
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                {t.createStory}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateStoryPage;
