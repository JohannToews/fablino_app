import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Settings, Sparkles, Star, Brain, Trophy, Hand, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useColorPalette } from "@/hooks/useColorPalette";
import heroImage from "@/assets/hero-reading.jpg";

interface KidProfile {
  id: string;
  name: string;
  cover_image_url: string | null;
}

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors: paletteColors } = useColorPalette();
  const [kidProfiles, setKidProfiles] = useState<KidProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadKidProfiles();
    }
  }, [user]);

  const loadKidProfiles = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("kid_profiles")
      .select("id, name, cover_image_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      setKidProfiles(data);
      // Auto-select first profile if none selected
      if (!selectedProfileId) {
        setSelectedProfileId(data[0].id);
      }
    }
  };

  const selectedProfile = kidProfiles.find(p => p.id === selectedProfileId) || kidProfiles[0];
  const displayImage = selectedProfile?.cover_image_url || heroImage;
  const childName = selectedProfile?.name;
  const hasMultipleProfiles = kidProfiles.length > 1;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg} overflow-hidden`}>
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-10 left-10 w-20 h-20 ${paletteColors.accent} rounded-full blur-2xl animate-bounce-soft`} />
        <div className={`absolute top-40 right-20 w-32 h-32 ${paletteColors.accent} rounded-full blur-3xl animate-bounce-soft`} style={{ animationDelay: "0.5s" }} />
        <div className={`absolute bottom-40 left-1/4 w-24 h-24 ${paletteColors.accent} rounded-full blur-2xl animate-bounce-soft`} style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative container max-w-4xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center min-h-screen">
        {/* Top Right Icons */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => navigate("/words")}
            className="p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:bg-muted transition-colors"
            title="Wörter verwalten"
          >
            <Hand className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:bg-muted transition-colors"
            title="Admin (Papa)"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {/* Logo / Title */}
          <div className="mb-6 flex items-center gap-2">
            <Star className="h-8 w-8 text-primary animate-sparkle" />
            <Star className="h-6 w-6 text-cotton-candy animate-sparkle" style={{ animationDelay: "0.3s" }} />
            <Star className="h-8 w-8 text-primary animate-sparkle" style={{ animationDelay: "0.6s" }} />
          </div>

          <h1 className="text-5xl md:text-7xl font-baloo font-bold text-foreground mb-4 tracking-tight">
            {childName ? `Salut ${childName}!` : 'LireMagie'}
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-6 font-nunito">
            Apprends à lire avec plaisir! ✨
          </p>

          {/* Profile Selector - show when multiple kids */}
          {hasMultipleProfiles && (
            <div className="flex items-center justify-center gap-3 mb-6">
              {kidProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedProfileId(profile.id)}
                  className={`
                    flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200
                    ${selectedProfileId === profile.id 
                      ? 'bg-primary/20 ring-2 ring-primary scale-105' 
                      : 'bg-card/60 hover:bg-card/80 hover:scale-102'
                    }
                  `}
                >
                  <div className={`
                    w-14 h-14 rounded-full overflow-hidden border-2 
                    ${selectedProfileId === profile.id ? 'border-primary' : 'border-border'}
                  `}>
                    {profile.cover_image_url ? (
                      <img 
                        src={profile.cover_image_url} 
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Users className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <span className={`
                    text-sm font-medium
                    ${selectedProfileId === profile.id ? 'text-primary' : 'text-muted-foreground'}
                  `}>
                    {profile.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Hero Image - wide aspect ratio for tablet */}
          <div className="relative w-full max-w-2xl mb-6">
            <div className={`absolute inset-0 ${paletteColors.primary} rounded-2xl blur-2xl transform scale-105`} />
            <img
              src={displayImage}
              alt="Magical reading adventure"
              className="relative w-full h-auto max-h-[30vh] rounded-2xl shadow-card object-cover"
            />
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
            {/* Lire une Histoire */}
            <Card 
              onClick={() => navigate("/stories")}
              className="cursor-pointer border-2 border-primary/30 hover:border-primary hover:shadow-card transition-all duration-300 group touch-manipulation"
            >
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-baloo font-bold text-lg mb-1">Lire une Histoire</h3>
                <p className="text-sm text-muted-foreground">Lis et apprends de nouveaux mots</p>
              </CardContent>
            </Card>

            {/* Quiz des Mots */}
            <Card 
              onClick={() => navigate("/quiz")}
              className="cursor-pointer border-2 border-accent/30 hover:border-accent hover:shadow-card transition-all duration-300 group touch-manipulation"
            >
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Brain className="h-8 w-8 text-accent-foreground" />
                </div>
                <h3 className="font-baloo font-bold text-lg mb-1">Quiz des Mots</h3>
                <p className="text-sm text-muted-foreground">Teste ton vocabulaire</p>
              </CardContent>
            </Card>

            {/* Meine Resultate */}
            <Card 
              onClick={() => navigate("/results")}
              className="cursor-pointer border-2 border-sunshine/50 hover:border-sunshine hover:shadow-card transition-all duration-300 group touch-manipulation"
            >
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-sunshine/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Trophy className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="font-baloo font-bold text-lg mb-1">Mes Résultats</h3>
                <p className="text-sm text-muted-foreground">Points et progrès</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 pb-4 text-center">
          <p className="text-sm text-muted-foreground/60">
            Fait avec ❤️ pour les petits lecteurs
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;