import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

const ResetPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      toast({
        title: "Fehler",
        description: "Bitte E-Mail-Adresse eingeben.",
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

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        console.error('Reset password error:', error);
        // Don't reveal if email exists or not for security
        toast({
          title: "Fehler",
          description: "Ein Fehler ist aufgetreten. Bitte erneut versuchen.",
          variant: "destructive",
        });
        return;
      }

      // Always show success, even if email doesn't exist (security best practice)
      setIsSuccess(true);
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten. Bitte erneut versuchen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-cyan-50 to-teal-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[10%] left-[8%] text-5xl opacity-20 animate-bounce" style={{ animationDuration: '4s' }}>📧</div>
          <div className="absolute top-[15%] right-[12%] text-4xl opacity-15 animate-bounce" style={{ animationDelay: '1s', animationDuration: '5s' }}>🔑</div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-secondary/10 to-transparent rounded-tr-full" />
        </div>

        <Card className="w-full max-w-md shadow-2xl border-2 border-green-200 bg-white/95 backdrop-blur relative z-10">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-green-400 to-green-600 p-4 rounded-full shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              E-Mail gesendet
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Falls ein Konto mit <strong>{email}</strong> existiert, haben wir dir einen Link zum Zurücksetzen des Passworts gesendet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Klicke auf den Link in der E-Mail, um dein neues Passwort festzulegen.
              </p>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>Keine E-Mail erhalten?</p>
              <p className="mt-1">Überprüfe deinen Spam-Ordner oder versuche es mit einer anderen E-Mail-Adresse.</p>
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
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[8%] text-5xl opacity-20 animate-bounce" style={{ animationDuration: '4s' }}>📖</div>
        <div className="absolute top-[15%] right-[12%] text-4xl opacity-15 animate-bounce" style={{ animationDelay: '1s', animationDuration: '5s' }}>🔑</div>
        <div className="absolute bottom-[20%] left-[15%] text-4xl opacity-20 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '4.5s' }}>📧</div>
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
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Passwort vergessen?
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Kein Problem! Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-5">
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

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-lg font-bold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Mail className="h-5 w-5" /> Link senden
                </span>
              )}
            </Button>
            
            <div className="text-center pt-2">
              <Link 
                to="/login" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Zurück zum Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
