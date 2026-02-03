import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Sparkles, BookOpen } from "lucide-react";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useColorPalette } from "@/hooks/useColorPalette";
import { Language } from "@/lib/translations";
import VoiceInputField from "@/components/VoiceInputField";

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
}> = {
  de: {
    title: "Eigene Geschichte erstellen",
    back: "Zurück",
    charactersTitle: "Hauptpersonen",
    charactersPlaceholder: "Beschreibe die Hauptpersonen und wie sie zueinander stehen (Geschwister, Eltern, Freunde, bekannte Menschen...)",
    storyDescription: "Worum soll es in der Geschichte gehen?",
    storyDescriptionPlaceholder: "Beschreibe kurz deine Idee (Monster und Superhelden, Fantasiegeschichten, Herausforderungen des Alltags...)",
    length: "Länge",
    difficulty: "Schwierigkeitsgrad",
    easy: "Einfach",
    medium: "Mittel",
    hard: "Schwer",
    veryShort: "Sehr kurz (150-200 Wörter)",
    short: "Kurz (250-300 Wörter)",
    mediumLength: "Mittel (300-350 Wörter)",
    long: "Lang (350-450 Wörter)",
    veryLong: "Sehr lang (500-600 Wörter)",
    createStory: "Geschichte erstellen",
    seriesMode: "Serie erstellen",
    seriesDescription: "Geschichte endet mit Cliffhanger und kann fortgesetzt werden",
    episode: "Episode",
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
    veryShort: "Très court (150-200 mots)",
    short: "Court (250-300 mots)",
    mediumLength: "Moyen (300-350 mots)",
    long: "Long (350-450 mots)",
    veryLong: "Très long (500-600 mots)",
    createStory: "Créer l'histoire",
    seriesMode: "Créer une série",
    seriesDescription: "L'histoire se termine par un cliffhanger et peut être continuée",
    episode: "Épisode",
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
    veryShort: "Very short (150-200 words)",
    short: "Short (250-300 words)",
    mediumLength: "Medium (300-350 words)",
    long: "Long (350-450 words)",
    veryLong: "Very long (500-600 words)",
    createStory: "Create Story",
    seriesMode: "Create series",
    seriesDescription: "Story ends with a cliffhanger and can be continued",
    episode: "Episode",
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
    veryShort: "Muy corto (150-200 palabras)",
    short: "Corto (250-300 palabras)",
    mediumLength: "Medio (300-350 palabras)",
    long: "Largo (350-450 palabras)",
    veryLong: "Muy largo (500-600 palabras)",
    createStory: "Crear historia",
    seriesMode: "Crear serie",
    seriesDescription: "La historia termina con un cliffhanger y puede continuarse",
    episode: "Episodio",
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
    veryShort: "Zeer kort (150-200 woorden)",
    short: "Kort (250-300 woorden)",
    mediumLength: "Gemiddeld (300-350 woorden)",
    long: "Lang (350-450 woorden)",
    veryLong: "Zeer lang (500-600 woorden)",
    createStory: "Verhaal maken",
    seriesMode: "Serie maken",
    seriesDescription: "Verhaal eindigt met een cliffhanger en kan worden voortgezet",
    episode: "Aflevering",
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
    veryShort: "Molto corto (150-200 parole)",
    short: "Corto (250-300 parole)",
    mediumLength: "Medio (300-350 parole)",
    long: "Lungo (350-450 parole)",
    veryLong: "Molto lungo (500-600 parole)",
    createStory: "Crea storia",
    seriesMode: "Crea serie",
    seriesDescription: "La storia finisce con un cliffhanger e può essere continuata",
    episode: "Episodio",
  },
};

const CreateStoryPage = () => {
  const navigate = useNavigate();
  const { kidAppLanguage, selectedProfile } = useKidProfile();
  const { colors: paletteColors } = useColorPalette();
  const t = createStoryTranslations[kidAppLanguage] || createStoryTranslations.de;

  // Get language from school system
  const storyLanguage = selectedProfile?.school_system || "de";

  const [charactersDescription, setCharactersDescription] = useState("");
  const [storyDescription, setStoryDescription] = useState("");
  const [length, setLength] = useState("medium");
  const [difficulty, setDifficulty] = useState("medium");
  const [isSeries, setIsSeries] = useState(false);

  const canCreate = charactersDescription.trim() && storyDescription.trim();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-baloo font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t.title}
          </h1>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Characters Section */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-baloo">{t.charactersTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <VoiceInputField
              value={charactersDescription}
              onChange={setCharactersDescription}
              placeholder={t.charactersPlaceholder}
              language={storyLanguage}
              multiline
            />
          </CardContent>
        </Card>

        {/* Story Description */}
        <Card className="border-2 border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-baloo">{t.storyDescription}</CardTitle>
          </CardHeader>
          <CardContent>
            <VoiceInputField
              value={storyDescription}
              onChange={setStoryDescription}
              placeholder={t.storyDescriptionPlaceholder}
              language={storyLanguage}
              multiline
            />
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="border-2 border-muted">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Length */}
              <div className="space-y-2">
                <Label>{t.length}</Label>
                <Select value={length} onValueChange={setLength}>
                  <SelectTrigger>
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

              {/* Difficulty */}
              <div className="space-y-2">
                <Label>{t.difficulty}</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">{t.easy}</SelectItem>
                    <SelectItem value="medium">{t.medium}</SelectItem>
                    <SelectItem value="difficult">{t.hard}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Series Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-accent" />
                <div>
                  <Label htmlFor="series-mode" className="font-medium cursor-pointer">
                    {t.seriesMode}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.seriesDescription}
                  </p>
                </div>
              </div>
              <Switch
                id="series-mode"
                checked={isSeries}
                onCheckedChange={setIsSeries}
              />
            </div>
          </CardContent>
        </Card>

        {/* Create Button */}
        <Button
          onClick={() => {
            // TODO: Generate story with these inputs
            console.log({ 
              charactersDescription, 
              storyDescription, 
              length, 
              difficulty, 
              storyLanguage,
              isSeries,
              endingType: isSeries ? 'C' : null, // Cliffhanger for series
              episodeNumber: isSeries ? 1 : null
            });
          }}
          disabled={!canCreate}
          className="w-full h-14 text-lg font-baloo btn-primary-kid"
        >
          {isSeries ? (
            <>
              <BookOpen className="h-5 w-5 mr-2" />
              {t.seriesMode} - {t.episode} 1
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              {t.createStory}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateStoryPage;
