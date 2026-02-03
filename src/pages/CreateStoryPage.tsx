import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Sparkles } from "lucide-react";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useColorPalette } from "@/hooks/useColorPalette";
import { Language } from "@/lib/translations";
import VoiceInputField from "@/components/VoiceInputField";

interface Character {
  id: string;
  name: string;
  description: string;
}

// Translations for the create story page
const createStoryTranslations: Record<Language, {
  title: string;
  back: string;
  characterName: string;
  characterNamePlaceholder: string;
  addCharacter: string;
  characterDescription: string;
  characterDescriptionPlaceholder: string;
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
  removeCharacter: string;
  describeCharacter: string;
}> = {
  de: {
    title: "Eigene Geschichte erstellen",
    back: "Zurück",
    characterName: "Name der Hauptperson",
    characterNamePlaceholder: "z.B. Max, Luna, Finn...",
    addCharacter: "Weitere Person hinzufügen",
    characterDescription: "Beschreibe die Hauptpersonen",
    characterDescriptionPlaceholder: "Wie stehen sie zueinander? (Geschwister, Eltern, Freunde, andere bekannte Menschen...)",
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
    removeCharacter: "Entfernen",
    describeCharacter: "Willst du diese Person beschreiben?",
  },
  fr: {
    title: "Créer ta propre histoire",
    back: "Retour",
    characterName: "Nom du personnage principal",
    characterNamePlaceholder: "ex. Max, Luna, Finn...",
    addCharacter: "Ajouter un autre personnage",
    characterDescription: "Décris les personnages principaux",
    characterDescriptionPlaceholder: "Quelle est leur relation? (Frères et sœurs, parents, amis, autres connaissances...)",
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
    removeCharacter: "Supprimer",
    describeCharacter: "Veux-tu décrire ce personnage?",
  },
  en: {
    title: "Create Your Own Story",
    back: "Back",
    characterName: "Main Character Name",
    characterNamePlaceholder: "e.g. Max, Luna, Finn...",
    addCharacter: "Add Another Character",
    characterDescription: "Describe the main characters",
    characterDescriptionPlaceholder: "How are they related? (Siblings, parents, friends, other acquaintances...)",
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
    removeCharacter: "Remove",
    describeCharacter: "Do you want to describe this character?",
  },
  es: {
    title: "Crea tu propia historia",
    back: "Volver",
    characterName: "Nombre del personaje principal",
    characterNamePlaceholder: "ej. Max, Luna, Finn...",
    addCharacter: "Añadir otro personaje",
    characterDescription: "Describe los personajes principales",
    characterDescriptionPlaceholder: "¿Cuál es su relación? (Hermanos, padres, amigos, otros conocidos...)",
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
    removeCharacter: "Eliminar",
    describeCharacter: "¿Quieres describir este personaje?",
  },
  nl: {
    title: "Maak je eigen verhaal",
    back: "Terug",
    characterName: "Naam van het hoofdpersonage",
    characterNamePlaceholder: "bijv. Max, Luna, Finn...",
    addCharacter: "Nog een personage toevoegen",
    characterDescription: "Beschrijf de hoofdpersonages",
    characterDescriptionPlaceholder: "Wat is hun relatie? (Broers en zussen, ouders, vrienden, andere bekenden...)",
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
    removeCharacter: "Verwijderen",
    describeCharacter: "Wil je dit personage beschrijven?",
  },
  it: {
    title: "Crea la tua storia",
    back: "Indietro",
    characterName: "Nome del personaggio principale",
    characterNamePlaceholder: "es. Max, Luna, Finn...",
    addCharacter: "Aggiungi un altro personaggio",
    characterDescription: "Descrivi i personaggi principali",
    characterDescriptionPlaceholder: "Qual è la loro relazione? (Fratelli, genitori, amici, altri conoscenti...)",
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
    removeCharacter: "Rimuovi",
    describeCharacter: "Vuoi descrivere questo personaggio?",
  },
};

const CreateStoryPage = () => {
  const navigate = useNavigate();
  const { kidAppLanguage, selectedProfile } = useKidProfile();
  const { colors: paletteColors } = useColorPalette();
  const t = createStoryTranslations[kidAppLanguage] || createStoryTranslations.de;

  // Get language from school system
  const storyLanguage = selectedProfile?.school_system || "de";

  const [characters, setCharacters] = useState<Character[]>([
    { id: crypto.randomUUID(), name: "", description: "" }
  ]);
  const [storyDescription, setStoryDescription] = useState("");
  const [length, setLength] = useState("medium");
  const [difficulty, setDifficulty] = useState("medium");

  const addCharacter = () => {
    if (characters.length < 3) {
      setCharacters([...characters, { id: crypto.randomUUID(), name: "", description: "" }]);
    }
  };

  const removeCharacter = (id: string) => {
    if (characters.length > 1) {
      setCharacters(characters.filter(c => c.id !== id));
    }
  };

  const updateCharacter = (id: string, field: keyof Character, value: string) => {
    setCharacters(characters.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const canCreate = characters.some(c => c.name.trim()) && storyDescription.trim();

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
        {characters.map((character, index) => (
          <Card key={character.id} className="border-2 border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-baloo">
                  {t.characterName} {characters.length > 1 ? `#${index + 1}` : ""}
                </CardTitle>
                {characters.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCharacter(character.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t.removeCharacter}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Character Name */}
              <VoiceInputField
                value={character.name}
                onChange={(value) => updateCharacter(character.id, "name", value)}
                placeholder={t.characterNamePlaceholder}
                language={storyLanguage}
              />

              {/* Character Description - only show if name is filled */}
              {character.name.trim() && (
                <VoiceInputField
                  label={t.characterDescription}
                  value={character.description}
                  onChange={(value) => updateCharacter(character.id, "description", value)}
                  placeholder={t.characterDescriptionPlaceholder}
                  language={storyLanguage}
                  multiline
                />
              )}
            </CardContent>
          </Card>
        ))}

        {/* Add Character Button */}
        {characters.length < 3 && (
          <Button
            variant="outline"
            onClick={addCharacter}
            className="w-full border-dashed border-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t.addCharacter}
          </Button>
        )}

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
          </CardContent>
        </Card>

        {/* Create Button */}
        <Button
          onClick={() => {
            // TODO: Generate story with these inputs
            console.log({ characters, storyDescription, length, difficulty, storyLanguage });
          }}
          disabled={!canCreate}
          className="w-full h-14 text-lg font-baloo btn-primary-kid"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          {t.createStory}
        </Button>
      </div>
    </div>
  );
};

export default CreateStoryPage;
