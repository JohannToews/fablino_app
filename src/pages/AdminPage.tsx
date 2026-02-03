import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Image, BookOpen, Trash2, Upload, LogOut, User, Settings, Sparkles, Library, FileEdit, Star, TrendingUp, CreditCard, Mail, Lock, UserX, Receipt, Crown, Wrench, Users } from "lucide-react";
import StoryGenerator from "@/components/StoryGenerator";
import PointsConfigSection from "@/components/PointsConfigSection";
import LevelConfigSection from "@/components/LevelConfigSection";
import KidProfileSection from "@/components/KidProfileSection";
import UserManagementSection from "@/components/UserManagementSection";
import SystemPromptSection from "@/components/SystemPromptSection";
import { useAuth } from "@/hooks/useAuth";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useTranslations, Language } from "@/lib/translations";

interface Story {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  user_id: string | null;
  kid_profile_id: string | null;
}

interface GeneratedQuestion {
  question: string;
  expectedAnswer: string;
}

interface GeneratedVocabulary {
  word: string;
  explanation: string;
}

interface GeneratedStory {
  title: string;
  content: string;
  questions?: GeneratedQuestion[];
  vocabulary?: GeneratedVocabulary[];
  coverImageBase64?: string;
  storyImages?: string[]; // Additional progress images (base64)
  difficulty?: string; // The difficulty level selected during generation
  textType?: string; // fiction or non-fiction
  prompt?: string; // The user's generation prompt
  textLanguage?: string; // The language of the story text (fr, de, en, etc.)
}

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { selectedProfileId, selectedProfile, kidProfiles, hasMultipleProfiles, setSelectedProfileId } = useKidProfile();
  const adminLang = (user?.adminLanguage || 'de') as Language;
  const t = useTranslations(adminLang);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [generatedCoverBase64, setGeneratedCoverBase64] = useState<string | null>(null);
  const [generatedStoryImages, setGeneratedStoryImages] = useState<string[]>([]);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [generatedVocabulary, setGeneratedVocabulary] = useState<GeneratedVocabulary[]>([]);
  const [generatedDifficulty, setGeneratedDifficulty] = useState<string>("medium");
  const [generatedTextType, setGeneratedTextType] = useState<string>("fiction");
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [generatedTextLanguage, setGeneratedTextLanguage] = useState<string>("fr");
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [storySubTab, setStorySubTab] = useState("generator");
  const [settingsSubTab, setSettingsSubTab] = useState("points");
  const [accountSubTab, setAccountSubTab] = useState("management");

  useEffect(() => {
    if (user) {
      loadStories();
    }
  }, [user]);

  const loadStories = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("stories")
      .select("id, title, content, cover_image_url, user_id, kid_profile_id")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });
    
    if (data) {
      setStories(data);
    }
  };

  const updateStoryKidProfile = async (storyId: string, kidProfileId: string | null) => {
    const { error } = await supabase
      .from("stories")
      .update({ kid_profile_id: kidProfileId })
      .eq("id", storyId);
    
    if (error) {
      toast.error(adminLang === 'de' ? 'Zuordnung fehlgeschlagen' : 'Assignment failed');
    } else {
      toast.success(adminLang === 'de' ? 'Kind zugeordnet' : 'Child assigned');
      loadStories();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const saveStory = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error(t.enterTitleAndText);
      return;
    }

    setIsLoading(true);
    let coverUrl: string | null = null;

    // Upload image if selected (manual upload takes priority)
    if (coverImage) {
      const fileExt = coverImage.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(fileName, coverImage);
      
      if (uploadError) {
        toast.error(t.imageUploadError);
        setIsLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("covers")
        .getPublicUrl(fileName);
      
      coverUrl = urlData.publicUrl;
    } else if (generatedCoverBase64) {
      // Upload the generated base64 image
      try {
        const base64Data = generatedCoverBase64.replace(/^data:image\/\w+;base64,/, "");
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "image/png" });
        
        const fileName = `${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from("covers")
          .upload(fileName, blob);
        
        if (uploadError) {
          console.error("Cover upload error:", uploadError);
          toast.warning(t.imageUploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from("covers")
            .getPublicUrl(fileName);
          coverUrl = urlData.publicUrl;
        }
      } catch (err) {
        console.error("Error processing generated cover:", err);
      }
    }

    // Upload additional story images (progress images)
    const storyImageUrls: string[] = [];
    if (generatedStoryImages.length > 0) {
      for (let i = 0; i < generatedStoryImages.length; i++) {
        try {
          const base64Data = generatedStoryImages[i].replace(/^data:image\/\w+;base64,/, "");
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let j = 0; j < binaryString.length; j++) {
            bytes[j] = binaryString.charCodeAt(j);
          }
          const blob = new Blob([bytes], { type: "image/png" });
          
          const fileName = `story_${Date.now()}_${i}.png`;
          const { error: uploadError } = await supabase.storage
            .from("covers")
            .upload(fileName, blob);
          
          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("covers")
              .getPublicUrl(fileName);
            storyImageUrls.push(urlData.publicUrl);
          }
        } catch (err) {
          console.error(`Error uploading story image ${i}:`, err);
        }
      }
    }

    // Insert story with user_id, kid_profile_id, story_images, difficulty, text_type, prompt, and text_language
    const { data: insertedStory, error } = await supabase.from("stories").insert({
      title,
      content,
      cover_image_url: coverUrl,
      user_id: user?.id,
      kid_profile_id: selectedProfileId,
      story_images: storyImageUrls.length > 0 ? storyImageUrls : null,
      difficulty: generatedDifficulty,
      text_type: generatedTextType,
      prompt: generatedPrompt || null,
      text_language: generatedTextLanguage,
    } as any).select().single();

    if (error || !insertedStory) {
      toast.error(t.storySaveError);
      setIsLoading(false);
      return;
    }

    // Use pre-generated questions if available, otherwise generate new ones
    if (generatedQuestions.length > 0) {
      // Save pre-generated questions to DB
      const questionsToInsert = generatedQuestions.map((q, index) => ({
        story_id: insertedStory.id,
        question: q.question,
        expected_answer: q.expectedAnswer,
        order_index: index,
      }));

      const { error: insertError } = await supabase
        .from("comprehension_questions")
        .insert(questionsToInsert);

      if (insertError) {
        console.error("Failed to save questions:", insertError);
        toast.warning(t.questionsCouldNotBeSaved);
      } else {
        toast.success(t.storyAndQuestionsSaved);
      }
    } else {
      // Generate comprehension questions using LLM (fallback for manual stories)
      toast.info(t.generatingQuestions);
      try {
        const { data: questionsData, error: questionsError } = await supabase.functions.invoke(
          "generate-comprehension-questions",
          {
            body: { storyContent: content, storyTitle: title, language: generatedTextLanguage },
          }
        );

        if (questionsError) {
          console.error("Questions generation error:", questionsError);
          toast.warning(t.questionsCouldNotBeSaved);
        } else if (questionsData?.questions) {
          // Save questions to DB
          const questionsToInsert = questionsData.questions.map((q: { question: string; expectedAnswer: string }, index: number) => ({
            story_id: insertedStory.id,
            question: q.question,
            expected_answer: q.expectedAnswer,
            order_index: index,
          }));

          const { error: insertError } = await supabase
            .from("comprehension_questions")
            .insert(questionsToInsert);

          if (insertError) {
            console.error("Failed to save questions:", insertError);
            toast.warning(t.questionsCouldNotBeSaved);
          } else {
            toast.success(t.storyAndQuestionsSaved);
          }
        }
      } catch (err) {
        console.error("Error generating questions:", err);
        toast.warning(t.questionsGenerationFailed);
      }
    }

    // Save pre-generated vocabulary to marked_words
    console.log("Vocabulary to save:", generatedVocabulary);
    if (generatedVocabulary.length > 0) {
      // Always use 'normal' difficulty for vocabulary so words appear in quiz
      // (The quiz filters out 'easy' words - those are only for manually marked simple words)
      const vocabToInsert = generatedVocabulary.map((v) => ({
        story_id: insertedStory.id,
        word: v.word,
        explanation: v.explanation,
        difficulty: "normal",
        is_learned: false,
      }));

      console.log("Inserting vocabulary:", vocabToInsert);
      const { error: vocabError } = await supabase
        .from("marked_words")
        .insert(vocabToInsert);

      if (vocabError) {
        console.error("Failed to save vocabulary:", vocabError);
        toast.warning(
          adminLang === 'de' ? "Vokabeln konnten nicht gespeichert werden" :
          adminLang === 'fr' ? "Les mots de vocabulaire n'ont pas pu être sauvegardés" :
          "Vocabulary could not be saved"
        );
      } else {
        console.log(`Saved ${vocabToInsert.length} vocabulary words to marked_words`);
        toast.success(
          adminLang === 'de' ? `${vocabToInsert.length} Vokabeln automatisch hinzugefügt!` :
          adminLang === 'fr' ? `${vocabToInsert.length} mots de vocabulaire ajoutés !` :
          `${vocabToInsert.length} vocabulary words added!`
        );
      }
    } else {
      console.log("No vocabulary to save (generatedVocabulary is empty)");
    }

    setIsLoading(false);
    setTitle("");
    setContent("");
    setCoverImage(null);
    setCoverPreview(null);
    setGeneratedCoverBase64(null);
    setGeneratedQuestions([]);
    setGeneratedVocabulary([]);
    setGeneratedDifficulty("medium");
    setGeneratedTextType("fiction");
    setGeneratedTextLanguage("fr");
    loadStories();
  };

  const deleteStory = async (id: string) => {
    const { error } = await supabase.from("stories").delete().eq("id", id);
    
    if (error) {
      toast.error(t.deleteError);
    } else {
      toast.success(t.storyDeleted);
      loadStories();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen flex flex-col gradient-admin overflow-hidden">
      {/* Compact Header */}
      <header className="flex-none flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full hover:bg-primary/20 h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-baloo font-bold text-foreground">
              {t.adminArea}
            </h1>
            {user && (
              <p className="text-xs text-muted-foreground">
                {user.displayName}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* Tab Navigation - Native App Style */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className={`flex-none grid mx-4 mt-3 h-12 bg-muted/50 ${user?.role === 'admin' ? 'grid-cols-5' : 'grid-cols-3'}`}>
          <TabsTrigger value="profile" className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{t.kidProfile}</span>
          </TabsTrigger>
          <TabsTrigger value="stories" className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">{t.newStory}</span>
          </TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="settings" className="flex items-center gap-2 text-sm font-medium">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t.settings}</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="account" className="flex items-center gap-2 text-sm font-medium">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">{t.account}</span>
          </TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="system" className="flex items-center gap-2 text-sm font-medium">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">System</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab Content - Scrollable within each tab */}
        <div className="flex-1 overflow-hidden p-4">
          {/* Profile Tab */}
          <TabsContent value="profile" className="h-full overflow-y-auto m-0 pr-2">
            <div className="max-w-3xl mx-auto">
              {user && (
                <KidProfileSection 
                  language={adminLang} 
                  userId={user.id}
                />
              )}
            </div>
          </TabsContent>

          {/* Stories Tab */}
          <TabsContent value="stories" className="h-full overflow-hidden m-0">
            <div className="h-full flex flex-col max-w-4xl mx-auto">
              {/* Kid Profile Selector - Always show if profiles exist */}
              {kidProfiles.length > 0 && (
                <div className="flex-none mb-4 flex items-center justify-center gap-2 bg-card/60 backdrop-blur-sm rounded-xl p-3">
                  <span className="text-sm text-muted-foreground mr-2">
                    {adminLang === 'de' ? 'Geschichte für:' : adminLang === 'fr' ? 'Histoire pour:' : 'Story for:'}
                  </span>
                  {kidProfiles.length === 1 ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground">
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-border">
                        {kidProfiles[0].cover_image_url ? (
                          <img src={kidProfiles[0].cover_image_url} alt={kidProfiles[0].name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Users className="w-3 h-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-sm">{kidProfiles[0].name}</span>
                    </div>
                  ) : (
                    <Select 
                      value={selectedProfileId || ''} 
                      onValueChange={(value) => setSelectedProfileId(value)}
                    >
                      <SelectTrigger className="w-[200px] bg-card">
                        <SelectValue placeholder={adminLang === 'de' ? 'Kind auswählen...' : adminLang === 'fr' ? 'Choisir enfant...' : 'Select child...'}>
                          {selectedProfile && (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full overflow-hidden border border-border">
                                {selectedProfile.cover_image_url ? (
                                  <img src={selectedProfile.cover_image_url} alt={selectedProfile.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <Users className="w-3 h-3 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <span>{selectedProfile.name}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border z-50">
                        {kidProfiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full overflow-hidden border border-border">
                                {profile.cover_image_url ? (
                                  <img src={profile.cover_image_url} alt={profile.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <Users className="w-3 h-3 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <span>{profile.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
              
              {/* Sub-Tab Navigation */}
              <div className="flex-none flex gap-2 mb-4">
                <Button
                  variant={storySubTab === "generator" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStorySubTab("generator")}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {t.generator}
                </Button>
                <Button
                  variant={storySubTab === "editor" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStorySubTab("editor")}
                  className="flex items-center gap-2"
                >
                  <FileEdit className="h-4 w-4" />
                  {t.editor}
                </Button>
                <Button
                  variant={storySubTab === "library" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStorySubTab("library")}
                  className="flex items-center gap-2"
                >
                  <Library className="h-4 w-4" />
                  {t.library}
                  {stories.length > 0 && (
                    <span className="ml-1 bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">
                      {stories.length}
                    </span>
                  )}
                </Button>
              </div>

              {/* Sub-Tab Content */}
              <div className="flex-1 overflow-y-auto pr-2">
                {/* Generator Sub-Tab */}
                {storySubTab === "generator" && (
                  <StoryGenerator
                    onStoryGenerated={(story) => {
                      console.log("Story generated with vocabulary:", story.vocabulary, "difficulty:", story.difficulty, "textLanguage:", story.textLanguage);
                      setTitle(story.title);
                      setContent(story.content);
                      if (story.difficulty) {
                        setGeneratedDifficulty(story.difficulty);
                      }
                      if (story.textType) {
                        setGeneratedTextType(story.textType);
                      }
                      if (story.prompt) {
                        setGeneratedPrompt(story.prompt);
                      }
                      if (story.textLanguage) {
                        setGeneratedTextLanguage(story.textLanguage);
                      }
                      if (story.questions && story.questions.length > 0) {
                        setGeneratedQuestions(story.questions);
                      }
                      if (story.vocabulary && story.vocabulary.length > 0) {
                        setGeneratedVocabulary(story.vocabulary);
                        toast.info(
                          adminLang === 'de' ? `${story.vocabulary.length} Vokabeln wurden erkannt` :
                          adminLang === 'fr' ? `${story.vocabulary.length} mots de vocabulaire détectés` :
                          `${story.vocabulary.length} vocabulary words detected`
                        );
                      }
                      if (story.coverImageBase64) {
                        setGeneratedCoverBase64(story.coverImageBase64);
                        setCoverPreview(story.coverImageBase64);
                      }
                      if (story.storyImages && story.storyImages.length > 0) {
                        setGeneratedStoryImages(story.storyImages);
                      }
                      setStorySubTab("editor");
                      toast.info(t.storyTransferred);
                    }}
                  />
                )}

                {/* Editor Sub-Tab */}
                {storySubTab === "editor" && (
                  <Card className="border-2 border-primary/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BookOpen className="h-5 w-5 text-primary" />
                        {t.newStory}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1.5">{t.title}</label>
                          <Input
                            placeholder="z.B. Le petit chat"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">{t.coverImage}</label>
                          <div className="flex items-center gap-3">
                            <label className="btn-secondary-kid cursor-pointer flex items-center gap-2 text-sm py-2 px-3">
                              <Upload className="h-4 w-4" />
                              {t.selectImage}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                              />
                            </label>
                            {coverPreview && (
                              <img
                                src={coverPreview}
                                alt="Preview"
                                className="h-10 w-10 object-cover rounded-lg shadow-soft"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1.5">{t.readingText}</label>
                        <Textarea
                          placeholder="Le petit chat dort sur le canapé..."
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          className="min-h-[200px] text-base"
                        />
                      </div>

                      {generatedQuestions.length > 0 && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            ✓ {generatedQuestions.length} {t.questionsReady}
                          </p>
                        </div>
                      )}

                      <Button
                        onClick={saveStory}
                        disabled={isLoading}
                        className="btn-primary-kid w-full"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? t.saving : t.saveStory}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Library Sub-Tab */}
                {storySubTab === "library" && (
                  <Card className="border-2 border-muted">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{t.existingStories}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stories.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8 text-sm">
                          {t.noStoriesYet}
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {stories.map((story) => {
                            const assignedKid = kidProfiles.find(p => p.id === story.kid_profile_id);
                            return (
                              <div
                                key={story.id}
                                className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50"
                              >
                                {story.cover_image_url ? (
                                  <img
                                    src={story.cover_image_url}
                                    alt={story.title}
                                    className="h-14 w-14 object-cover rounded-lg flex-none"
                                  />
                                ) : (
                                  <div className="h-14 w-14 bg-muted rounded-lg flex items-center justify-center flex-none">
                                    <Image className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-baloo font-bold text-sm truncate">{story.title}</h3>
                                  <Select
                                    value={story.kid_profile_id || "none"}
                                    onValueChange={(value) => updateStoryKidProfile(story.id, value === "none" ? null : value)}
                                  >
                                    <SelectTrigger className="h-7 text-xs w-full mt-1">
                                      <SelectValue>
                                        {assignedKid ? (
                                          <span className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {assignedKid.name}
                                          </span>
                                        ) : (
                                          <span className="text-muted-foreground">
                                            {adminLang === 'de' ? 'Kind zuordnen...' : 'Assign child...'}
                                          </span>
                                        )}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">
                                        {adminLang === 'de' ? '— Kein Kind —' : '— No child —'}
                                      </SelectItem>
                                      {kidProfiles.map((profile) => (
                                        <SelectItem key={profile.id} value={profile.id}>
                                          {profile.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteStory(story.id)}
                                  className="text-destructive hover:bg-destructive/10 flex-none h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="h-full overflow-hidden m-0">
            <div className="h-full flex flex-col max-w-4xl mx-auto">
              {/* Sub-Tab Navigation */}
              <div className="flex-none flex gap-2 mb-4">
                <Button
                  variant={settingsSubTab === "points" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettingsSubTab("points")}
                  className="flex items-center gap-2"
                >
                  <Star className="h-4 w-4" />
                  Punkte
                </Button>
                <Button
                  variant={settingsSubTab === "levels" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettingsSubTab("levels")}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Level
                </Button>
              </div>

              {/* Sub-Tab Content */}
              <div className="flex-1 overflow-y-auto pr-2">
                {settingsSubTab === "points" && (
                  <PointsConfigSection language={adminLang} />
                )}
                {settingsSubTab === "levels" && (
                  <LevelConfigSection language={adminLang} />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="h-full overflow-hidden m-0">
            <div className="h-full flex flex-col max-w-4xl mx-auto">
              {/* Sub-Tab Navigation */}
              <div className="flex-none flex gap-2 mb-4">
                <Button
                  variant={accountSubTab === "management" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAccountSubTab("management")}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Konto
                </Button>
                <Button
                  variant={accountSubTab === "subscription" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAccountSubTab("subscription")}
                  className="flex items-center gap-2"
                >
                  <Crown className="h-4 w-4" />
                  Abo & Plan
                </Button>
              </div>

              {/* Sub-Tab Content */}
              <div className="flex-1 overflow-y-auto pr-2">
                {/* Account Management */}
                {accountSubTab === "management" && (
                  <Card className="border-2 border-primary/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Konto-Verwaltung</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Email */}
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">E-Mail ändern</p>
                            <p className="text-xs text-muted-foreground">Aktuelle E-Mail aktualisieren</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                          Ändern
                        </Button>
                      </div>

                      {/* Password */}
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Lock className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Passwort ändern</p>
                            <p className="text-xs text-muted-foreground">Neues Passwort setzen</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                          Ändern
                        </Button>
                      </div>

                      {/* Delete Account */}
                      <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-xl border border-destructive/30">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
                            <UserX className="h-5 w-5 text-destructive" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-destructive">Account löschen</p>
                            <p className="text-xs text-muted-foreground">DSGVO: Alle Daten werden gelöscht</p>
                          </div>
                        </div>
                        <Button variant="destructive" size="sm" disabled>
                          Löschen
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground text-center pt-2">
                        ⚠️ Diese Funktionen werden in einer zukünftigen Version aktiviert
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Subscription */}
                {accountSubTab === "subscription" && (
                  <Card className="border-2 border-primary/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Abo & Plan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Current Plan */}
                      <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/30">
                        <div className="flex items-center gap-3 mb-2">
                          <Crown className="h-6 w-6 text-primary" />
                          <div>
                            <p className="font-bold">Aktueller Plan</p>
                            <p className="text-sm text-muted-foreground">Kostenlos / Free</p>
                          </div>
                        </div>
                      </div>

                      {/* Upgrade */}
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Upgrade / Downgrade</p>
                            <p className="text-xs text-muted-foreground">Plan wechseln</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                          Pläne ansehen
                        </Button>
                      </div>

                      {/* Payment Method */}
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Zahlungsmethode</p>
                            <p className="text-xs text-muted-foreground">Kreditkarte oder PayPal verwalten</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                          Verwalten
                        </Button>
                      </div>

                      {/* Invoices */}
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Receipt className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Rechnungen</p>
                            <p className="text-xs text-muted-foreground">Invoices einsehen & herunterladen</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                          Anzeigen
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground text-center pt-2">
                        ⚠️ Stripe-Integration wird in einer zukünftigen Version aktiviert
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* System Tab - Admin Only */}
          {user?.role === 'admin' && (
            <TabsContent value="system" className="h-full overflow-y-auto m-0 pr-2">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* System Prompt Editor */}
                <SystemPromptSection language={adminLang} />
                
                {/* User Management */}
                <UserManagementSection 
                  language={adminLang}
                  currentUserId={user.id}
                />
              </div>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default AdminPage;
