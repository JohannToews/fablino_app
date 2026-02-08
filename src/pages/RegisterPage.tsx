import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, UserPlus, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim();
    const trimmedDisplayName = displayName.trim();
    const trimmedPassword = password.trim();
    
    // Validation
    if (!trimmedEmail || !trimmedPassword || !trimmedDisplayName) {
      toast({
        title: "Fehler",
        description: "Bitte alle Felder ausfüllen.",
        variant: "destructive",
      });
      return;
    }

    if (!trimmedEmail.includes('@')) {
      toast({
        title: "Fehler",
        description: "Bitte eine gültige E-Mail-Adresse eingeben.",
        variant: "destructive",
      });
      return;
    }

    if (trimmedPassword.length < 6) {
      toast({
        title: "Fehler",
        description: "Das Passwort muss mindestens 6 Zeichen lang sein.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Fehler",
        description: "Die Passwörter stimmen nicht überein.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          data: {
            display_name: trimmedDisplayName,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error('Registration error:', error);
        let errorMessage = "Registrierung fehlgeschlagen.";
        
        if (error.message.includes("already registered")) {
          errorMessage = "Diese E-Mail-Adresse ist bereits registriert.";
        } else if (error.message.includes("Invalid email")) {
          errorMessage = "Ungültige E-Mail-Adresse.";
        } else if (error.message.includes("Password")) {
          errorMessage = "Das Passwort erfüllt nicht die Anforderungen.";
        }
        
        toast({
          title: "Fehler",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.session === null) {
          // Email confirmation required
          setIsSuccess(true);
        } else {
          // Auto-confirmed (shouldn't happen with our settings)
          toast({
            title: "Willkommen!",
            description: "Registrierung erfolgreich.",
          });
          navigate("/", { replace: true });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten. Bitte erneut versuchen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Success state - show email confirmation message
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-cyan-50 to-teal-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[10%] left-[8%] text-5xl opacity-20 animate-bounce" style={{ animationDuration: '4s' }}>📧</div>
          <div className="absolute top-[15%] right-[12%] text-4xl opacity-15 animate-bounce" style={{ animationDelay: '1s', animationDuration: '5s' }}>✉️</div>
          <div className="absolute bottom-[20%] left-[15%] text-4xl opacity-20 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '4.5s' }}>📬</div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-secondary/10 to-transparent rounded-tr-full" />
        </div>

        <Card className="w-full max-w-md shadow-2xl border-2 border-green-500/30 bg-white/95 backdrop-blur relative z-10">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-green-400 to-green-600 p-4 rounded-full shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              E-Mail bestätigen
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Fast geschafft! Wir haben dir eine E-Mail an <strong>{email}</strong> gesendet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Klicke auf den Bestätigungslink in der E-Mail, um dein Konto zu aktivieren.
              </p>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>Keine E-Mail erhalten?</p>
              <p className="mt-1">Überprüfe deinen Spam-Ordner.</p>
            </div>

            <Button
              onClick={() => navigate("/login")}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zum Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-cyan-50 to-teal-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Reading-themed background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[8%] text-5xl opacity-20 animate-bounce" style={{ animationDuration: '4s' }}>📖</div>
        <div className="absolute top-[15%] right-[12%] text-4xl opacity-15 animate-bounce" style={{ animationDelay: '1s', animationDuration: '5s' }}>📚</div>
        <div className="absolute bottom-[20%] left-[15%] text-4xl opacity-20 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '4.5s' }}>📕</div>
        <div className="absolute bottom-[15%] right-[10%] text-5xl opacity-15 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '5s' }}>📗</div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-secondary/10 to-transparent rounded-tr-full" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-2 border-primary/20 bg-white/95 backdrop-blur relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-primary to-secondary p-4 rounded-full shadow-lg">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center justify-center gap-2">
            <span className="text-2xl">📖</span>
            Le Petit Lecteur
            <span className="text-2xl">📖</span>
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">Neues Konto erstellen</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-base font-medium text-foreground">
                Name
              </Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dein Name..."
                className="text-base h-11 border-2 border-primary/20 focus:border-primary"
                autoComplete="name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium text-foreground">
                E-Mail-Adresse
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.com"
                className="text-base h-11 border-2 border-primary/20 focus:border-primary"
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium text-foreground">
                Passwort
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen..."
                className="text-base h-11 border-2 border-primary/20 focus:border-primary"
                autoComplete="new-password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-base font-medium text-foreground">
                Passwort bestätigen
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort wiederholen..."
                className="text-base h-11 border-2 border-primary/20 focus:border-primary"
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-lg font-bold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" /> Registrieren
                </span>
              )}
            </Button>
            
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                Bereits ein Konto?{" "}
                <Link 
                  to="/login" 
                  className="text-primary hover:underline font-medium"
                >
                  Anmelden
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
