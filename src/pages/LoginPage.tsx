import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, Lock } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-b from-violet-100 via-pink-50 to-yellow-50 flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="fixed top-10 left-10 text-6xl animate-bounce opacity-50">✨</div>
      <div className="fixed top-20 right-20 text-4xl animate-pulse opacity-50">🌟</div>
      <div className="fixed bottom-20 left-20 text-5xl animate-bounce opacity-50" style={{ animationDelay: '0.5s' }}>🦋</div>
      <div className="fixed bottom-10 right-10 text-4xl animate-pulse opacity-50" style={{ animationDelay: '0.3s' }}>🌈</div>

      <Card className="w-full max-w-md shadow-2xl border-4 border-violet-200 bg-white/90 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-violet-500 to-pink-500 p-4 rounded-full">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            LireMagie
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </CardTitle>
          <p className="text-muted-foreground">Please sign in</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-lg font-medium">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username..."
                className="text-lg h-12 border-2 border-violet-200 focus:border-violet-400"
                maxLength={50}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-lg font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="text-lg h-12 border-2 border-violet-200 focus:border-violet-400"
                maxLength={100}
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 text-xl font-bold bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Loading...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  🔓 Sign In
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;