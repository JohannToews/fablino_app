import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Save, Image, BookOpen, Trash2, Upload, LogOut, User, Settings, Sparkles } from "lucide-react";
import StoryGenerator from "@/components/StoryGenerator";
import PointsConfigSection from "@/components/PointsConfigSection";
import LevelConfigSection from "@/components/LevelConfigSection";
import KidProfileSection from "@/components/KidProfileSection";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations, Language } from "@/lib/translations";

interface Story {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  user_id: string | null;
}

interface GeneratedQuestion {
  question: string;
  expectedAnswer: string;
}

interface GeneratedStory {
  title: string;
  content: string;
  questions?: GeneratedQuestion[];
  coverImageBase64?: string;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const adminLang = (user?.adminLanguage || 'de') as Language;
  const t = useTranslations(adminLang);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [generatedCoverBase64, setGeneratedCoverBase64] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (user) {
      loadStories();
    }
  }, [user]);

  const loadStories = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("stories")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (data) {
      setStories(data);
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

    // Insert story with user_id
    const { data: insertedStory, error } = await supabase.from("stories").insert({
      title,
      content,
      cover_image_url: coverUrl,
      user_id: user?.id,
    }).select().single();

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
            body: { storyContent: content, storyTitle: title },
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

    setIsLoading(false);
    setTitle("");
    setContent("");
    setCoverImage(null);
    setCoverPreview(null);
    setGeneratedCoverBase64(null);
    setGeneratedQuestions([]);
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
        <TabsList className="flex-none grid grid-cols-3 mx-4 mt-3 h-12 bg-muted/50">
          <TabsTrigger value="profile" className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{t.kidProfile}</span>
            <span className="sm:hidden">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="stories" className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">{t.newStory}</span>
            <span className="sm:hidden">Stories</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 text-sm font-medium">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Einstellungen</span>
            <span className="sm:hidden">Config</span>
          </TabsTrigger>
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
          <TabsContent value="stories" className="h-full overflow-y-auto m-0 pr-2">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Story Generator */}
              <StoryGenerator
                onStoryGenerated={(story) => {
                  setTitle(story.title);
                  setContent(story.content);
                  if (story.questions && story.questions.length > 0) {
                    setGeneratedQuestions(story.questions);
                  }
                  if (story.coverImageBase64) {
                    setGeneratedCoverBase64(story.coverImageBase64);
                    setCoverPreview(story.coverImageBase64);
                  }
                  toast.info(t.storyTransferred);
                }}
              />

              {/* New Story Form */}
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
                      className="min-h-[120px] text-base"
                    />
                  </div>

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

              {/* Existing Stories */}
              <Card className="border-2 border-muted">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t.existingStories}</CardTitle>
                </CardHeader>
                <CardContent>
                  {stories.length === 0 ? (
                    <p className="text-muted-foreground text-center py-6 text-sm">
                      {t.noStoriesYet}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {stories.map((story) => (
                        <div
                          key={story.id}
                          className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50"
                        >
                          {story.cover_image_url ? (
                            <img
                              src={story.cover_image_url}
                              alt={story.title}
                              className="h-12 w-12 object-cover rounded-lg flex-none"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center flex-none">
                              <Image className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-baloo font-bold text-sm truncate">{story.title}</h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {story.content.substring(0, 60)}...
                            </p>
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
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="h-full overflow-y-auto m-0 pr-2">
            <div className="max-w-3xl mx-auto space-y-6">
              <PointsConfigSection language={adminLang} />
              <LevelConfigSection language={adminLang} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AdminPage;
