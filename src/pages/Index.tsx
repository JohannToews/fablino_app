import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Settings, Sparkles, Star } from "lucide-react";
import heroImage from "@/assets/hero-reading.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-sunshine/30 rounded-full blur-2xl animate-bounce-soft" />
        <div className="absolute top-40 right-20 w-32 h-32 bg-cotton-candy/40 rounded-full blur-3xl animate-bounce-soft" style={{ animationDelay: "0.5s" }} />
        <div className="absolute bottom-40 left-1/4 w-24 h-24 bg-sky-blue/40 rounded-full blur-2xl animate-bounce-soft" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative container max-w-4xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center min-h-screen">
        {/* Header with Admin Link */}
        <div className="w-full flex justify-end mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin")}
            className="rounded-full hover:bg-primary/20"
            title="Admin-Bereich"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Button>
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
            LireMagie
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 font-nunito">
            Apprends à lire avec plaisir! ✨
          </p>

          {/* Hero Image */}
          <div className="relative mb-10">
            <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-2xl transform scale-105" />
            <img
              src={heroImage}
              alt="Magical reading adventure"
              className="relative w-full max-w-lg h-auto rounded-3xl shadow-card object-cover"
            />
          </div>

          {/* CTA Button */}
          <Button
            onClick={() => navigate("/stories")}
            className="btn-primary-kid text-xl px-10 py-6 shadow-glow hover:shadow-card group"
          >
            <BookOpen className="h-6 w-6 mr-3 group-hover:animate-bounce-soft" />
            Commencer à lire
            <Sparkles className="h-5 w-5 ml-3 animate-sparkle" />
          </Button>

          {/* Subtitle */}
          <p className="mt-6 text-muted-foreground">
            Wähle eine Geschichte und lerne neue Wörter
          </p>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 pb-4 text-center">
          <p className="text-sm text-muted-foreground/60">
            Made with ❤️ für kleine Leseratten
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
