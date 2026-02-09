import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFECD2 100%)' }}>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg px-8 py-10">
        {/* Mascot */}
        <div className="flex justify-center mb-3">
          <img
            src="/mascot/6_Onboarding.png"
            alt="Fablino"
            className="h-[120px] w-auto drop-shadow-md"
            style={{ animation: "gentleBounce 2.2s ease-in-out infinite" }}
          />
        </div>

        {/* Title */}
        <h1 className="text-center text-3xl font-bold mb-1" style={{ color: '#E8863A' }}>
          Fablino
        </h1>
        <p className="text-center text-sm mb-8" style={{ color: 'rgba(45, 24, 16, 0.6)' }}>
          Histoires magiques pour petits lecteurs ✨
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="identifier" className="text-base font-medium text-foreground">
              E-Mail oder Benutzername
            </Label>
            <Input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="E-Mail oder Benutzername"
              className="text-base h-12 rounded-xl border-2 focus:ring-2"
              style={{
                borderColor: 'rgba(232, 134, 58, 0.3)',
                // @ts-ignore
                '--tw-ring-color': 'rgba(232, 134, 58, 0.2)',
              }}
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-base font-medium text-foreground">
              Passwort
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Dein Passwort..."
                className="text-base h-12 rounded-xl border-2 pr-12 focus:ring-2"
                style={{
                  borderColor: 'rgba(232, 134, 58, 0.3)',
                  // @ts-ignore
                  '--tw-ring-color': 'rgba(232, 134, 58, 0.2)',
                }}
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
              className="data-[state=checked]:bg-[#E8863A] data-[state=checked]:border-[#E8863A]"
            />
            <Label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer">
              Angemeldet bleiben
            </Label>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg text-white"
            style={{ backgroundColor: '#E8863A' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D4752E')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E8863A')}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="h-5 w-5" /> Anmelden
              </span>
            )}
          </Button>

          <div className="text-center">
            <Link
              to="/reset-password"
              className="text-sm transition-colors underline"
              style={{ color: '#E8863A' }}
            >
              Passwort vergessen?
            </Link>
          </div>

          <div className="text-center pt-2 border-t border-border mt-4">
            <p className="text-sm text-muted-foreground pt-4">
              Noch kein Konto?{" "}
              <Link
                to="/register"
                className="font-medium hover:underline"
                style={{ color: '#E8863A' }}
              >
                Jetzt registrieren
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes gentleBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
