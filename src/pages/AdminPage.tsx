import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Save, Image, BookOpen, Trash2, Upload, LogOut } from "lucide-react";
import StoryGenerator from "@/components/StoryGenerator";
import PointsConfigSection from "@/components/PointsConfigSection";
import LevelConfigSection from "@/components/LevelConfigSection";
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
    <div className="min-h-screen gradient-admin p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="rounded-full hover:bg-primary/20"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-baloo text-foreground">
                {t.adminArea} 🔧
              </h1>
              {user && (
                <p className="text-sm text-muted-foreground">
                  {user.displayName} • {adminLang.toUpperCase()}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Story Generator Section */}
        <div className="mb-8">
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
        </div>

        {/* New Story Section */}
        <Card className="mb-8 border-2 border-sunshine/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-5 w-5 text-primary" />
              {t.newStory}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">{t.title}</label>
              <Input
                placeholder="z.B. Le petit chat"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                {t.coverImage}
              </label>
              <div className="flex items-center gap-4">
                <label className="btn-secondary-kid cursor-pointer flex items-center gap-2">
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
                    className="h-20 w-20 object-cover rounded-xl shadow-soft"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                {t.readingText}
              </label>
              <Textarea
                placeholder="Le petit chat dort sur le canapé..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] text-lg"
              />
            </div>

            <Button
              onClick={saveStory}
              disabled={isLoading}
              className="btn-primary-kid w-full"
            >
              <Save className="h-5 w-5 mr-2" />
              {isLoading ? t.saving : t.saveStory}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Stories */}
        <Card className="border-2 border-mint/50">
          <CardHeader>
            <CardTitle className="text-xl">{t.existingStories}</CardTitle>
          </CardHeader>
          <CardContent>
            {stories.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t.noStoriesYet}
              </p>
            ) : (
              <div className="space-y-4">
                {stories.map((story) => (
                  <div
                    key={story.id}
                    className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border"
                  >
                    {story.cover_image_url ? (
                      <img
                        src={story.cover_image_url}
                        alt={story.title}
                        className="h-16 w-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                        <Image className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-baloo font-bold">{story.title}</h3>
                      <p className="text-sm text-muted-foreground truncate max-w-md">
                        {story.content}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteStory(story.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Points Configuration */}
        <PointsConfigSection language={adminLang} />

        {/* Level Configuration */}
        <LevelConfigSection language={adminLang} />
      </div>
    </div>
  );
};

export default AdminPage;
