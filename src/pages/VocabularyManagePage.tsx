import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, CheckCircle2, XCircle, Minus, Save, Loader2, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useKidProfile } from "@/hooks/useKidProfile";
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
  const { selectedProfileId, selectedProfile, kidProfiles, hasMultipleProfiles, setSelectedProfileId } = useKidProfile();
  const adminLang = (user?.adminLanguage || 'de') as Language;
  const t = useTranslations(adminLang);
  
  const [words, setWords] = useState<MarkedWord[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newWord, setNewWord] = useState("");
  const [defaultStoryId, setDefaultStoryId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [user, selectedProfileId]);

  const loadData = async () => {
    if (!user) return;
    
    // Use RPC to bypass RLS overhead
    const { data: storiesData } = await supabase
      .rpc("get_my_stories", {
        p_profile_id: selectedProfileId || null,
        p_limit: 500,
        p_offset: 0,
      })
      .select("id, title");
    
    if (storiesData && storiesData.length > 0) {
      setStories(storiesData);
      setDefaultStoryId(storiesData[0].id);
    } else {
      setStories([]);
      setDefaultStoryId("");
    }

    // Get story IDs for filtering words
    const storyIds = storiesData?.map(s => s.id) || [];
    
    if (storyIds.length === 0) {
      setWords([]);
      setIsLoading(false);
      return;
    }

    // Load all marked words from filtered stories
    const { data: wordsData } = await supabase
      .from("marked_words")
      .select("*")
      .in("story_id", storyIds)
      .order("created_at", { ascending: false });
    
    if (wordsData) {
      setWords(wordsData as MarkedWord[]);
    } else {
      setWords([]);
    }
    
    setIsLoading(false);
  };

  const addWord = async () => {
    if (!newWord.trim() || !defaultStoryId) {
      toast.error(t.vocabEnterWord);
      return;
    }

    setIsSaving(true);
    
    try {
      // Call explain-word which will also correct spelling and generate explanation
      const { data, error } = await supabase.functions.invoke("explain-word", {
        body: { word: newWord.trim() },
      });

      // Use corrected word if available, otherwise use input
      const correctedWord = (data?.correctedWord || newWord.trim()).toLowerCase();
      const explanation = data?.explanation || null;

      const { error: insertError } = await supabase.from("marked_words").insert({
        word: correctedWord,
        explanation: explanation,
        story_id: defaultStoryId,
      });

      if (insertError) {
        toast.error(t.vocabSaveError);
      } else {
        const message = correctedWord !== newWord.trim().toLowerCase() 
          ? `"${correctedWord}" ${t.vocabWordAddedCorrected}`
          : t.vocabWordAdded;
        toast.success(message);
        setNewWord("");
        loadData();
      }
    } catch (err) {
      console.error("Error adding word:", err);
      toast.error(t.vocabSaveError);
    }
    
    setIsSaving(false);
  };

  const deleteWord = async (id: string) => {
    const { error } = await supabase.from("marked_words").delete().eq("id", id);
    
    if (error) {
      toast.error(t.vocabDeleteError);
    } else {
      toast.success(t.vocabWordRemoved);
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
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
            {t.vocabManageTitle}
          </h1>
        </div>
      </div>

      <div className="container max-w-4xl p-4 md:p-8">
        {/* Kid Profile Selector */}
        {hasMultipleProfiles && (
          <div className="mb-6 flex items-center justify-center gap-2 bg-card/60 backdrop-blur-sm rounded-xl p-2">
            {kidProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelectedProfileId(profile.id)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                  ${selectedProfileId === profile.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                  }
                `}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-border">
                  {profile.cover_image_url ? (
                    <img src={profile.cover_image_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <span className="font-medium text-sm">{profile.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Add new word section */}
        <div className="bg-card rounded-2xl p-6 shadow-card mb-8 border-2 border-primary/20">
          <h2 className="text-xl font-baloo mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            {t.vocabManageAdd}
            {selectedProfile && <span className="text-sm text-muted-foreground ml-2">({selectedProfile.name})</span>}
          </h2>
          
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                {t.vocabWord}
              </label>
              <Input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addWord()}
                placeholder={t.vocabManageAddPlaceholder}
                className="text-lg"
              />
            </div>
            <Button
              onClick={addWord}
              disabled={isSaving || !newWord.trim() || !defaultStoryId}
              className="btn-primary-kid"
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Plus className="h-5 w-5 mr-2" />
              )}
              {t.vocabAddButton}
            </Button>
          </div>
          
          {!defaultStoryId && (
            <p className="text-sm text-muted-foreground mt-2">
              {t.vocabCreateStoryFirst}
              {selectedProfile && ` ${adminLang === 'de' ? 'für' : adminLang === 'fr' ? 'pour' : 'for'} ${selectedProfile.name}`}
            </p>
          )}
        </div>

        {/* Words table */}
        <div className="bg-card rounded-2xl p-6 shadow-card">
          <h2 className="text-xl font-baloo mb-4">
            {`${t.vocabAllWords} (${words.length})`}
            {selectedProfile && <span className="text-sm text-muted-foreground ml-2">- {selectedProfile.name}</span>}
          </h2>

          {words.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t.vocabManageEmpty}
              {selectedProfile && ` ${adminLang === 'de' ? 'für' : adminLang === 'fr' ? 'pour' : 'for'} ${selectedProfile.name}`}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-baloo">
                      {t.vocabWord}
                    </TableHead>
                    <TableHead className="font-baloo">
                      {t.vocabExplanation}
                    </TableHead>
                    <TableHead className="font-baloo text-center">
                      {t.vocabQuizLast3}
                    </TableHead>
                    <TableHead className="font-baloo text-center">
                      {t.vocabManageLearned}
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
