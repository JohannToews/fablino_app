import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Save, Image, Key, BookOpen, Trash2, Upload } from "lucide-react";

interface Story {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);

  useEffect(() => {
    loadApiKey();
    loadStories();
  }, []);

  const loadApiKey = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "gemini_api_key")
      .single();
    
    if (data) {
      setApiKey(data.value);
    }
  };

  const loadStories = async () => {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) {
      setStories(data);
    }
  };

  const saveApiKey = async () => {
    setIsSavingKey(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "gemini_api_key", value: apiKey }, { onConflict: "key" });
    
    setIsSavingKey(false);
    if (error) {
      toast.error("Fehler beim Speichern des API-Keys");
    } else {
      toast.success("API-Key gespeichert!");
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
      toast.error("Bitte Titel und Text eingeben");
      return;
    }

    setIsLoading(true);
    let coverUrl: string | null = null;

    // Upload image if selected
    if (coverImage) {
      const fileExt = coverImage.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(fileName, coverImage);
      
      if (uploadError) {
        toast.error("Fehler beim Hochladen des Bildes");
        setIsLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("covers")
        .getPublicUrl(fileName);
      
      coverUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("stories").insert({
      title,
      content,
      cover_image_url: coverUrl,
    });

    setIsLoading(false);

    if (error) {
      toast.error("Fehler beim Speichern der Geschichte");
    } else {
      toast.success("Geschichte gespeichert!");
      setTitle("");
      setContent("");
      setCoverImage(null);
      setCoverPreview(null);
      loadStories();
    }
  };

  const deleteStory = async (id: string) => {
    const { error } = await supabase.from("stories").delete().eq("id", id);
    
    if (error) {
      toast.error("Fehler beim Löschen");
    } else {
      toast.success("Geschichte gelöscht");
      loadStories();
    }
  };

  return (
    <div className="min-h-screen gradient-admin p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full hover:bg-primary/20"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl md:text-4xl font-baloo text-foreground">
            Admin-Bereich 🔧
          </h1>
        </div>

        {/* API Key Section */}
        <Card className="mb-8 border-2 border-lavender/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Key className="h-5 w-5 text-primary" />
              Gemini API-Key
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Input
              type="password"
              placeholder="API-Key eingeben..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={saveApiKey} 
              disabled={isSavingKey}
              className="btn-primary-kid"
            >
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </Button>
          </CardContent>
        </Card>

        {/* New Story Section */}
        <Card className="mb-8 border-2 border-sunshine/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-5 w-5 text-primary" />
              Neue Leseübung erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Titel</label>
              <Input
                placeholder="z.B. Le petit chat"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Titelbild
              </label>
              <div className="flex items-center gap-4">
                <label className="btn-secondary-kid cursor-pointer flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Bild auswählen
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
                Lesetext (Französisch)
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
              {isLoading ? "Speichere..." : "Geschichte speichern"}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Stories */}
        <Card className="border-2 border-mint/50">
          <CardHeader>
            <CardTitle className="text-xl">Vorhandene Geschichten</CardTitle>
          </CardHeader>
          <CardContent>
            {stories.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Noch keine Geschichten vorhanden
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
      </div>
    </div>
  );
};

export default AdminPage;
