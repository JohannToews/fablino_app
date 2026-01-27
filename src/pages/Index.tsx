import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Settings, Sparkles, Star, BookText, Brain, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/hero-reading.jpg";

interface KidProfile {
  name: string;
  hobbies: string;
  color_palette: string;
  cover_image_url: string | null;
}

const PALETTE_COLORS: Record<string, { primary: string; accent: string; bg: string }> = {
  sunshine: { primary: 'from-amber-400/30', accent: 'bg-amber-400/20', bg: 'from-amber-50 via-orange-50 to-yellow-50' },
  mint: { primary: 'from-emerald-400/30', accent: 'bg-emerald-400/20', bg: 'from-emerald-50 via-teal-50 to-green-50' },
  lavender: { primary: 'from-purple-400/30', accent: 'bg-purple-400/20', bg: 'from-purple-50 via-violet-50 to-fuchsia-50' },
  ocean: { primary: 'from-blue-400/30', accent: 'bg-blue-400/20', bg: 'from-blue-50 via-cyan-50 to-sky-50' },
  sunset: { primary: 'from-orange-400/30', accent: 'bg-orange-400/20', bg: 'from-orange-50 via-red-50 to-pink-50' },
  forest: { primary: 'from-green-600/30', accent: 'bg-green-600/20', bg: 'from-green-50 via-emerald-50 to-teal-50' },
};

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kidProfile, setKidProfile] = useState<KidProfile | null>(null);

  useEffect(() => {
    if (user) {
      loadKidProfile();
    }
  }, [user]);

  const loadKidProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("kid_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setKidProfile(data);
    }
  };

  const paletteColors = PALETTE_COLORS[kidProfile?.color_palette || 'sunshine'];
  const displayImage = kidProfile?.cover_image_url || heroImage;
  const childName = kidProfile?.name;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg} overflow-hidden`}>
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-10 left-10 w-20 h-20 ${paletteColors.accent} rounded-full blur-2xl animate-bounce-soft`} />
        <div className={`absolute top-40 right-20 w-32 h-32 ${paletteColors.accent} rounded-full blur-3xl animate-bounce-soft`} style={{ animationDelay: "0.5s" }} />
        <div className={`absolute bottom-40 left-1/4 w-24 h-24 ${paletteColors.accent} rounded-full blur-2xl animate-bounce-soft`} style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative container max-w-4xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center min-h-screen">
        {/* Admin Icon - Top Right */}
        <button
          onClick={() => navigate("/admin")}
          className="absolute top-4 right-4 p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:bg-muted transition-colors"
          title="Admin (Papa)"
        >
          <Settings className="h-5 w-5 text-muted-foreground" />
        </button>

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
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 font-nunito">
            Apprends à lire avec plaisir! ✨
          </p>

          {/* Hero Image */}
          <div className="relative mb-10">
            <div className={`absolute inset-0 ${paletteColors.primary} rounded-3xl blur-2xl transform scale-105`} />
            <img
              src={displayImage}
              alt="Magical reading adventure"
              className="relative w-full max-w-lg h-auto rounded-3xl shadow-card object-cover"
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