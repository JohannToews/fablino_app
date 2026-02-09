import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Lock, Loader2, Eye, EyeOff } from "lucide-react";
const LoginPage = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('liremagie_remember') === 'true';
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  
  // Check if input looks like an email (for "Forgot password" link)
  const isEmailInput = identifier.includes('@');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedIdentifier || !trimmedPassword) {
      toast({
        title: "Error",
        description: "Bitte E-Mail/Benutzername und Passwort eingeben.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(trimmedIdentifier, trimmedPassword);

      if (result.success) {
        toast({
          title: "Willkommen!",
          description: "Login erfolgreich.",
        });
        navigate("/", { replace: true });
      } else {
        toast({
          title: "Error",
          description: result.error || "Login fehlgeschlagen.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "Ein Fehler ist aufgetreten. Bitte erneut versuchen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-cyan-50 to-teal-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Reading-themed background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating books */}
        <div className="absolute top-[10%] left-[8%] text-5xl opacity-20 animate-bounce" style={{ animationDuration: '4s' }}>📖</div>
        <div className="absolute top-[15%] right-[12%] text-4xl opacity-15 animate-bounce" style={{ animationDelay: '1s', animationDuration: '5s' }}>📚</div>
        <div className="absolute bottom-[20%] left-[15%] text-4xl opacity-20 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '4.5s' }}>📕</div>
        <div className="absolute bottom-[15%] right-[10%] text-5xl opacity-15 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '5s' }}>📗</div>
        
        {/* Subtle reading elements */}
        <div className="absolute top-[40%] left-[5%] text-3xl opacity-10">✏️</div>
        <div className="absolute top-[60%] right-[8%] text-3xl opacity-10">🔍</div>
        
        {/* Abstract shapes suggesting pages */}
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
          <CardDescription className="text-base text-muted-foreground">Bitte anmelden</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-lg font-medium text-foreground">
                E-Mail oder Benutzername
              </Label>
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="E-Mail oder Benutzername"
                className="text-lg h-12 border-2 border-primary/20 focus:border-primary"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-lg font-medium text-foreground">
                Passwort
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Dein Passwort..."
                  className="text-lg h-12 border-2 border-primary/20 focus:border-primary pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => {
                  const val = checked === true;
                  setRememberMe(val);
                  localStorage.setItem('liremagie_remember', val ? 'true' : 'false');
                }}
              />
              <Label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer">
                Angemeldet bleiben
              </Label>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 text-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="h-5 w-5" /> Anmelden
                </span>
              )}
            </Button>
            
            {/* Forgot password link - only show when email is entered */}
            {isEmailInput && (
              <div className="text-center">
                <Link 
                  to="/reset-password"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
                >
                  Passwort vergessen?
                </Link>
              </div>
            )}
            
            {/* Registration link */}
            <div className="text-center pt-2 border-t border-border mt-4">
              <p className="text-sm text-muted-foreground pt-4">
                Noch kein Konto?{" "}
                <Link 
                  to="/register" 
                  className="text-primary hover:underline font-medium"
                >
                  Jetzt registrieren
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
export default LoginPage;
