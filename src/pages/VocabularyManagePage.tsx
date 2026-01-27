import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, CheckCircle2, XCircle, Minus, Save, Loader2 } from "lucide-react";
import { useColorPalette } from "@/hooks/useColorPalette";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations, Language } from "@/lib/translations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MarkedWord {
  id: string;
  word: string;
  explanation: string | null;
  quiz_history: string[] | null;
  is_learned: boolean | null;
  story_id: string;
  created_at: string;
}

interface Story {
  id: string;
  title: string;
}

const VocabularyManagePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors: paletteColors } = useColorPalette();
  const adminLang = (user?.adminLanguage || 'de') as Language;
  const t = useTranslations(adminLang);
  
  const [words, setWords] = useState<MarkedWord[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newWord, setNewWord] = useState("");
  const [newExplanation, setNewExplanation] = useState("");
  const [selectedStoryId, setSelectedStoryId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    // Load stories for this user
    const { data: storiesData } = await supabase
      .from("stories")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (storiesData) {
      setStories(storiesData);
      if (storiesData.length > 0 && !selectedStoryId) {
        setSelectedStoryId(storiesData[0].id);
      }
    }

    // Load all marked words from user's stories
    const { data: wordsData } = await supabase
      .from("marked_words")
      .select("*, stories!inner(user_id)")
      .order("created_at", { ascending: false });
    
    if (wordsData) {
      // Filter to only show words from user's stories
      const userWords = wordsData.filter((w: any) => w.stories?.user_id === user.id);
      setWords(userWords as MarkedWord[]);
    }
    
    setIsLoading(false);
  };

  const generateExplanation = async () => {
    if (!newWord.trim()) {
      toast.error(adminLang === 'de' ? "Bitte Wort eingeben" : "Please enter a word");
      return;
    }

    setIsGeneratingExplanation(true);
    try {
      const { data, error } = await supabase.functions.invoke("explain-word", {
        body: { word: newWord.trim() },
      });

      if (error) throw error;
      
      if (data?.explanation) {
        setNewExplanation(data.explanation);
        toast.success(adminLang === 'de' ? "Erklärung generiert" : "Explanation generated");
      }
    } catch (err) {
      console.error("Error generating explanation:", err);
      toast.error(adminLang === 'de' ? "Fehler beim Generieren" : "Error generating");
    }
    setIsGeneratingExplanation(false);
  };

  const addWord = async () => {
    if (!newWord.trim() || !selectedStoryId) {
      toast.error(adminLang === 'de' ? "Bitte Wort und Geschichte auswählen" : "Please enter word and select story");
      return;
    }

    setIsSaving(true);
    
    let explanation = newExplanation.trim();
    
    // If no explanation provided, generate one
    if (!explanation) {
      try {
        const { data, error } = await supabase.functions.invoke("explain-word", {
          body: { word: newWord.trim() },
        });
        if (!error && data?.explanation) {
          explanation = data.explanation;
        }
      } catch (err) {
        console.error("Error generating explanation:", err);
      }
    }

    const { error } = await supabase.from("marked_words").insert({
      word: newWord.trim().toLowerCase(),
      explanation: explanation || null,
      story_id: selectedStoryId,
    });

    if (error) {
      toast.error(adminLang === 'de' ? "Fehler beim Speichern" : "Error saving");
    } else {
      toast.success(adminLang === 'de' ? "Wort hinzugefügt" : "Word added");
      setNewWord("");
      setNewExplanation("");
      loadData();
    }
    setIsSaving(false);
  };

  const deleteWord = async (id: string) => {
    const { error } = await supabase.from("marked_words").delete().eq("id", id);
    
    if (error) {
      toast.error(adminLang === 'de' ? "Fehler beim Löschen" : "Error deleting");
    } else {
      toast.success(adminLang === 'de' ? "Wort entfernt" : "Word removed");
      setWords(words.filter(w => w.id !== id));
    }
  };

  const renderQuizHistory = (history: string[] | null) => {
    if (!history || history.length === 0) {
      return <span className="text-muted-foreground text-sm">—</span>;
    }

    // Show last 3 results
    const last3 = history.slice(-3);
    return (
      <div className="flex items-center gap-1">
        {last3.map((result, idx) => (
          result === 'correct' ? (
            <CheckCircle2 key={idx} className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle key={idx} className="h-5 w-5 text-red-400" />
          )
        ))}
      </div>
    );
  };

  const getStoryTitle = (storyId: string) => {
    const story = stories.find(s => s.id === storyId);
    return story?.title || "—";
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg} flex items-center justify-center`}>
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full hover:bg-primary/20"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-baloo text-foreground">
            {adminLang === 'de' ? 'Wörter verwalten' : adminLang === 'fr' ? 'Gérer les mots' : 'Manage Words'}
          </h1>
        </div>
      </div>

      <div className="container max-w-4xl p-4 md:p-8">
        {/* Add new word section */}
        <div className="bg-card rounded-2xl p-6 shadow-card mb-8 border-2 border-primary/20">
          <h2 className="text-xl font-baloo mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            {adminLang === 'de' ? 'Neues Wort hinzufügen' : adminLang === 'fr' ? 'Ajouter un nouveau mot' : 'Add new word'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {adminLang === 'de' ? 'Wort' : adminLang === 'fr' ? 'Mot' : 'Word'}
              </label>
              <Input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder={adminLang === 'de' ? 'z.B. château' : 'e.g. château'}
                className="text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {adminLang === 'de' ? 'Geschichte' : adminLang === 'fr' ? 'Histoire' : 'Story'}
              </label>
              <select
                value={selectedStoryId}
                onChange={(e) => setSelectedStoryId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-base"
              >
                {stories.map((story) => (
                  <option key={story.id} value={story.id}>
                    {story.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {adminLang === 'de' ? 'Erklärung (optional)' : adminLang === 'fr' ? 'Explication (optionnel)' : 'Explanation (optional)'}
            </label>
            <div className="flex gap-2">
              <Input
                value={newExplanation}
                onChange={(e) => setNewExplanation(e.target.value)}
                placeholder={adminLang === 'de' ? 'Wird automatisch generiert wenn leer' : 'Will be auto-generated if empty'}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={generateExplanation}
                disabled={isGeneratingExplanation || !newWord.trim()}
                className="shrink-0"
              >
                {isGeneratingExplanation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  adminLang === 'de' ? 'Generieren' : 'Generate'
                )}
              </Button>
            </div>
          </div>

          <Button
            onClick={addWord}
            disabled={isSaving || !newWord.trim() || !selectedStoryId}
            className="btn-primary-kid"
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            {adminLang === 'de' ? 'Wort speichern' : adminLang === 'fr' ? 'Enregistrer' : 'Save word'}
          </Button>
        </div>

        {/* Words table */}
        <div className="bg-card rounded-2xl p-6 shadow-card">
          <h2 className="text-xl font-baloo mb-4">
            {adminLang === 'de' ? `Alle Wörter (${words.length})` : adminLang === 'fr' ? `Tous les mots (${words.length})` : `All words (${words.length})`}
          </h2>

          {words.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {adminLang === 'de' ? 'Noch keine Wörter vorhanden' : adminLang === 'fr' ? 'Pas encore de mots' : 'No words yet'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-baloo">
                      {adminLang === 'de' ? 'Wort' : adminLang === 'fr' ? 'Mot' : 'Word'}
                    </TableHead>
                    <TableHead className="font-baloo">
                      {adminLang === 'de' ? 'Erklärung' : adminLang === 'fr' ? 'Explication' : 'Explanation'}
                    </TableHead>
                    <TableHead className="font-baloo text-center">
                      {adminLang === 'de' ? 'Quiz (letzte 3)' : adminLang === 'fr' ? 'Quiz (3 derniers)' : 'Quiz (last 3)'}
                    </TableHead>
                    <TableHead className="font-baloo text-center">
                      {adminLang === 'de' ? 'Gelernt' : adminLang === 'fr' ? 'Appris' : 'Learned'}
                    </TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {words.map((word) => (
                    <TableRow key={word.id}>
                      <TableCell className="font-medium text-lg">{word.word}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {word.explanation || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {renderQuizHistory(word.quiz_history)}
                      </TableCell>
                      <TableCell className="text-center">
                        {word.is_learned ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <Minus className="h-5 w-5 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteWord(word.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VocabularyManagePage;
