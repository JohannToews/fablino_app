import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User, Palette, Save, Loader2, Sparkles, Plus, Trash2 } from "lucide-react";
import { useTranslations, Language } from "@/lib/translations";

interface KidProfile {
  id?: string;
  name: string;
  school_system: string;
  school_class: string;
  hobbies: string;
  color_palette: string;
  cover_image_url: string | null;
}

interface SchoolSystem {
  name: string;
  classes: string[];
}

interface SchoolSystems {
  [key: string]: SchoolSystem;
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

const DEFAULT_SCHOOL_SYSTEMS: SchoolSystems = {
  fr: { name: "Français", classes: ["2e primaire / CE1", "3e primaire / CE2", "4e primaire / CM1", "5e primaire / CM2"] },
  de: { name: "Deutsch", classes: ["2. Klasse / Grundschule", "3. Klasse / Grundschule", "4. Klasse / Grundschule", "5. Klasse / Grundschule"] },
  es: { name: "Español", classes: ["2º Primaria", "3º Primaria", "4º Primaria", "5º Primaria"] },
  nl: { name: "Nederlands", classes: ["Groep 4", "Groep 5", "Groep 6", "Groep 7"] },
  en: { name: "English", classes: ["Grade 2", "Grade 3", "Grade 4", "Grade 5"] },
};

const KidProfileSection = ({ language, userId, onProfileUpdate }: KidProfileSectionProps) => {
  const t = useTranslations(language);
  const [profiles, setProfiles] = useState<KidProfile[]>([]);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number>(0);
  const [schoolSystems, setSchoolSystems] = useState<SchoolSystems>(DEFAULT_SCHOOL_SYSTEMS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const currentProfile = profiles[selectedProfileIndex] || {
    name: '',
    school_system: 'fr',
    school_class: 'CE1',
    hobbies: '',
    color_palette: 'sunshine',
    cover_image_url: null,
  };

  useEffect(() => {
    loadProfiles();
    loadSchoolSystems();
  }, [userId]);

  const loadSchoolSystems = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "school_systems")
      .maybeSingle();

    if (data?.value) {
      try {
        setSchoolSystems(JSON.parse(data.value));
      } catch (e) {
        console.error("Error parsing school systems:", e);
      }
    }
  };

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from("kid_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      const mappedProfiles = data.map(d => ({
        id: d.id,
        name: d.name,
        school_system: d.school_system,
        school_class: d.school_class,
        hobbies: d.hobbies,
        color_palette: d.color_palette,
        cover_image_url: d.cover_image_url,
      }));
      setProfiles(mappedProfiles);
      if (mappedProfiles[0]?.cover_image_url) {
        setCoverPreview(mappedProfiles[0].cover_image_url);
      }
    } else {
      // Create default empty profile
      setProfiles([{
        name: '',
        school_system: 'fr',
        school_class: 'CE1',
        hobbies: '',
        color_palette: 'sunshine',
        cover_image_url: null,
      }]);
    }
    setIsLoading(false);
  };

  const updateCurrentProfile = (updates: Partial<KidProfile>) => {
    setProfiles(prev => {
      const newProfiles = [...prev];
      newProfiles[selectedProfileIndex] = { ...newProfiles[selectedProfileIndex], ...updates };
      return newProfiles;
    });
  };

  const handleSchoolSystemChange = (value: string) => {
    const classes = schoolSystems[value]?.classes || [];
    updateCurrentProfile({
      school_system: value,
      school_class: classes[0] || '',
    });
  };

  const addNewProfile = () => {
    const newProfile: KidProfile = {
      name: '',
      school_system: 'fr',
      school_class: 'CE1',
      hobbies: '',
      color_palette: 'sunshine',
      cover_image_url: null,
    };
    setProfiles(prev => [...prev, newProfile]);
    setSelectedProfileIndex(profiles.length);
    setCoverPreview(null);
  };

  const deleteProfile = async (index: number) => {
    const profile = profiles[index];
    if (profile.id) {
      const { error } = await supabase
        .from("kid_profiles")
        .delete()
        .eq("id", profile.id);
      
      if (error) {
        toast.error(t.errorSaving);
        return;
      }
    }
    
    setProfiles(prev => prev.filter((_, i) => i !== index));
    if (selectedProfileIndex >= profiles.length - 1) {
      setSelectedProfileIndex(Math.max(0, profiles.length - 2));
    }
    toast.success(t.delete + " ✓");
  };

  const selectProfile = (index: number) => {
    setSelectedProfileIndex(index);
    const profile = profiles[index];
    setCoverPreview(profile?.cover_image_url || null);
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
    if (!currentProfile.name.trim()) {
      toast.error(t.kidName);
      return;
    }

    setIsGeneratingCover(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-profile-cover", {
        body: {
          name: currentProfile.name,
          schoolClass: currentProfile.school_class,
          hobbies: currentProfile.hobbies,
          colorPalette: currentProfile.color_palette,
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
      let coverUrl = currentProfile.cover_image_url;

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
        name: currentProfile.name,
        school_system: currentProfile.school_system,
        school_class: currentProfile.school_class,
        hobbies: currentProfile.hobbies,
        color_palette: currentProfile.color_palette,
        cover_image_url: coverUrl,
      };

      let savedData;
      if (currentProfile.id) {
        // Update existing
        const { data, error } = await supabase
          .from("kid_profiles")
          .update(profileData)
          .eq("id", currentProfile.id)
          .select()
          .single();
        
        if (error) throw error;
        savedData = data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("kid_profiles")
          .insert(profileData)
          .select()
          .single();
        
        if (error) throw error;
        savedData = data;
      }

      // Update local state
      const updatedProfile: KidProfile = {
        id: savedData.id,
        name: savedData.name,
        school_system: savedData.school_system,
        school_class: savedData.school_class,
        hobbies: savedData.hobbies,
        color_palette: savedData.color_palette,
        cover_image_url: savedData.cover_image_url,
      };

      setProfiles(prev => {
        const newProfiles = [...prev];
        newProfiles[selectedProfileIndex] = updatedProfile;
        return newProfiles;
      });

      if (coverUrl) {
        setCoverPreview(coverUrl);
      }
      
      onProfileUpdate?.(updatedProfile);
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

  const availableClasses = schoolSystems[currentProfile.school_system]?.classes || [];

  return (
    <Card className="border-2 border-primary/30 mb-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5 text-primary" />
            {t.kidProfile}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addNewProfile}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            {t.addChild}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Tabs */}
        {profiles.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {profiles.map((profile, index) => (
              <div key={index} className="flex items-center gap-1">
                <Button
                  variant={selectedProfileIndex === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectProfile(index)}
                >
                  {profile.name || `${t.kidProfile} ${index + 1}`}
                </Button>
                {profiles.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => deleteProfile(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          {t.kidProfileDescription}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column: Inputs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kidName">{t.kidName}</Label>
              <Input
                id="kidName"
                value={currentProfile.name}
                onChange={(e) => updateCurrentProfile({ name: e.target.value })}
                placeholder={language === 'de' ? 'z.B. Emma' : language === 'es' ? 'ej. Emma' : language === 'nl' ? 'bijv. Emma' : language === 'en' ? 'e.g. Emma' : 'ex. Emma'}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.schoolSystem}</Label>
                <Select value={currentProfile.school_system} onValueChange={handleSchoolSystemChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(schoolSystems).map(([key, system]) => (
                      <SelectItem key={key} value={key}>
                        {system.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.schoolClass}</Label>
                <Select 
                  value={currentProfile.school_class} 
                  onValueChange={(value) => updateCurrentProfile({ school_class: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClasses.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hobbies">{t.hobbies}</Label>
              <Textarea
                id="hobbies"
                value={currentProfile.hobbies}
                onChange={(e) => updateCurrentProfile({ hobbies: e.target.value })}
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
                    onClick={() => updateCurrentProfile({ color_palette: palette.id })}
                    className={`p-3 rounded-lg border-2 transition-all ${palette.color} ${
                      currentProfile.color_palette === palette.id 
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
              disabled={isGeneratingCover || !currentProfile.name.trim()}
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