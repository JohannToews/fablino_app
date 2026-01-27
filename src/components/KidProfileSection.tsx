import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { User, Palette, Save, Loader2, Sparkles } from "lucide-react";
import { useTranslations, Language } from "@/lib/translations";

interface KidProfile {
  id?: string;
  name: string;
  age: number;
  hobbies: string;
  color_palette: string;
  cover_image_url: string | null;
}

interface KidProfileSectionProps {
  language: Language;
  userId: string;
  onProfileUpdate?: (profile: KidProfile) => void;
}

const COLOR_PALETTES = [
  { id: 'sunshine', color: 'bg-amber-400', border: 'border-amber-500' },
  { id: 'mint', color: 'bg-emerald-400', border: 'border-emerald-500' },
  { id: 'lavender', color: 'bg-purple-400', border: 'border-purple-500' },
  { id: 'ocean', color: 'bg-blue-500', border: 'border-blue-600' },
  { id: 'sunset', color: 'bg-orange-400', border: 'border-orange-500' },
  { id: 'forest', color: 'bg-green-700', border: 'border-green-800' },
  { id: 'sky', color: 'bg-sky-400', border: 'border-sky-500' },
  { id: 'berry', color: 'bg-pink-600', border: 'border-pink-700' },
  { id: 'earth', color: 'bg-amber-700', border: 'border-amber-800' },
  { id: 'candy', color: 'bg-pink-400', border: 'border-pink-500' },
  { id: 'arctic', color: 'bg-cyan-300', border: 'border-cyan-400' },
  { id: 'tropical', color: 'bg-teal-500', border: 'border-teal-600' },
];

const KidProfileSection = ({ language, userId, onProfileUpdate }: KidProfileSectionProps) => {
  const t = useTranslations(language);
  const [profile, setProfile] = useState<KidProfile>({
    name: '',
    age: 8,
    hobbies: '',
    color_palette: 'sunshine',
    cover_image_url: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from("kid_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      setProfile(data);
      if (data.cover_image_url) {
        setCoverPreview(data.cover_image_url);
      }
    }
    setIsLoading(false);
  };

  const getPaletteLabel = (paletteId: string) => {
    switch (paletteId) {
      case 'sunshine': return t.paletteSunshine;
      case 'mint': return t.paletteMint;
      case 'lavender': return t.paletteLavender;
      case 'ocean': return t.paletteOcean;
      case 'sunset': return t.paletteSunset;
      case 'forest': return t.paletteForest;
      case 'sky': return t.paletteSky;
      case 'berry': return t.paletteBerry;
      case 'earth': return t.paletteEarth;
      case 'candy': return t.paletteCandy;
      case 'arctic': return t.paletteArctic;
      case 'tropical': return t.paletteTropical;
      default: return paletteId;
    }
  };

  const generateCoverImage = async () => {
    if (!profile.name.trim()) {
      toast.error(language === 'de' ? 'Bitte gib einen Namen ein' : language === 'en' ? 'Please enter a name' : 'Veuillez entrer un prénom');
      return;
    }

    setIsGeneratingCover(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-profile-cover", {
        body: {
          name: profile.name,
          age: profile.age,
          hobbies: profile.hobbies,
          colorPalette: profile.color_palette,
        },
      });

      if (error) throw error;

      if (data?.imageBase64) {
        setCoverPreview(data.imageBase64);
        toast.success(t.coverGenerated);
      }
    } catch (error) {
      console.error("Error generating cover:", error);
      toast.error(t.errorSaving);
    }
    setIsGeneratingCover(false);
  };

  const saveProfile = async () => {
    setIsSaving(true);
    
    try {
      let coverUrl = profile.cover_image_url;

      // If we have a new generated cover (base64), upload it
      if (coverPreview && coverPreview.startsWith('data:image')) {
        const base64Data = coverPreview.replace(/^data:image\/\w+;base64,/, "");
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "image/png" });
        
        const fileName = `profile-cover-${userId}-${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from("covers")
          .upload(fileName, blob);
        
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("covers")
            .getPublicUrl(fileName);
          coverUrl = urlData.publicUrl;
        }
      }

      const profileData = {
        user_id: userId,
        name: profile.name,
        age: profile.age,
        hobbies: profile.hobbies,
        color_palette: profile.color_palette,
        cover_image_url: coverUrl,
      };

      // Upsert the profile
      const { data, error } = await supabase
        .from("kid_profiles")
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      if (coverUrl) {
        setCoverPreview(coverUrl);
      }
      
      onProfileUpdate?.(data);
      toast.success(t.profileSaved);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(t.errorSaving);
    }
    
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-primary/30">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/30 mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <User className="h-5 w-5 text-primary" />
          {t.kidProfile}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          {t.kidProfileDescription}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column: Inputs */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kidName">{t.kidName}</Label>
                <Input
                  id="kidName"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder={language === 'de' ? 'z.B. Emma' : language === 'en' ? 'e.g. Emma' : 'ex. Emma'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kidAge">{t.kidAge}</Label>
                <Input
                  id="kidAge"
                  type="number"
                  min={3}
                  max={14}
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 8 })}
                  className="text-center"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hobbies">{t.hobbies}</Label>
              <Textarea
                id="hobbies"
                value={profile.hobbies}
                onChange={(e) => setProfile({ ...profile, hobbies: e.target.value })}
                placeholder={t.hobbiesPlaceholder}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                {t.colorPalette}
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {COLOR_PALETTES.map((palette) => (
                  <button
                    key={palette.id}
                    onClick={() => setProfile({ ...profile, color_palette: palette.id })}
                    className={`p-3 rounded-lg border-2 transition-all ${palette.color} ${
                      profile.color_palette === palette.id 
                        ? `${palette.border} ring-2 ring-offset-2 ring-primary` 
                        : 'border-transparent hover:border-muted'
                    }`}
                  >
                    <span className="text-xs font-medium text-white drop-shadow-md">
                      {getPaletteLabel(palette.id).split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: Cover preview */}
          <div className="space-y-4">
            <Label>{t.coverImage}</Label>
            <div className="relative aspect-video bg-muted rounded-xl overflow-hidden border-2 border-dashed border-muted-foreground/30">
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Profile cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <Sparkles className="h-12 w-12" />
                </div>
              )}
            </div>
            <Button
              onClick={generateCoverImage}
              disabled={isGeneratingCover || !profile.name.trim()}
              variant="outline"
              className="w-full"
            >
              {isGeneratingCover ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.generatingCover}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t.generateCover}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={saveProfile}
            disabled={isSaving}
            className="w-full btn-primary-kid"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {t.saving}
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                {t.saveProfile}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default KidProfileSection;