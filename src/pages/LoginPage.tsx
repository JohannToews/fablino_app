import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Lock, Loader2 } from "lucide-react";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedUsername || !trimmedPassword) {
      toast({
        title: "Error",
        description: "Please enter username and password.",
        variant: "destructive",
      });
      return;
    }

    if (trimmedUsername.length > 50 || trimmedPassword.length > 100) {
      toast({
        title: "Error",
        description: "Input too long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-login', {
        body: { username: trimmedUsername, password: trimmedPassword }
      });

      if (error) throw error;

      if (data.success) {
        login(data.token, data.user);
        toast({
          title: "Welcome!",
          description: `Hello, ${data.user.displayName}!`,
        });
        navigate("/", { replace: true });
      } else {
        toast({
          title: "Error",
          description: data.error || "Login failed.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
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
              <Label htmlFor="username" className="text-lg font-medium text-foreground">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username..."
                className="text-lg h-12 border-2 border-primary/20 focus:border-primary"
                maxLength={50}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-lg font-medium text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="text-lg h-12 border-2 border-primary/20 focus:border-primary"
                maxLength={100}
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 text-xl font-bold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg"
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

            <p className="text-center text-sm text-muted-foreground pt-4">
              Noch kein Konto?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Neuen Benutzer erstellen
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;