import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";

type Mode = "login" | "register";

const WelcomePage = () => {
  const [mode, setMode] = useState<Mode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // If already logged in → check for kid profiles and redirect
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      handleAuthRedirect();
    }
  }, [isAuthenticated, authLoading]);

  const handleAuthRedirect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user profile id
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("auth_id", session.user.id)
        .maybeSingle();

      if (!profile) return;

      const { data: kids } = await supabase
        .from("kid_profiles")
        .select("id")
        .eq("user_id", profile.id)
        .limit(1);

      if (kids && kids.length > 0) {
        navigate("/", { replace: true });
      } else {
        navigate("/onboarding/kind", { replace: true });
      }
    } catch {
      navigate("/", { replace: true });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      toast({ title: "Fehler", description: "Bitte alle Felder ausfüllen.", variant: "destructive" });
      return;
    }
    if (!trimmedEmail.includes("@")) {
      toast({ title: "Fehler", description: "Bitte eine gültige E-Mail-Adresse eingeben.", variant: "destructive" });
      return;
    }
    if (trimmedPassword.length < 6) {
      toast({ title: "Fehler", description: "Passwort muss mindestens 6 Zeichen lang sein.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/welcome`,
        },
      });

      if (error) {
        let msg = "Registrierung fehlgeschlagen.";
        if (error.message.includes("already registered")) msg = "Diese E-Mail ist bereits registriert.";
        toast({ title: "Fehler", description: msg, variant: "destructive" });
        return;
      }

      if (data.session) {
        // Auto-confirmed → redirect
        await handleAuthRedirect();
      } else if (data.user && !data.session) {
        // Check if this is a repeated signup (user already exists but unconfirmed or existing)
        // Supabase returns identities array - if empty, user already exists
        const identities = data.user.identities;
        if (identities && identities.length === 0) {
          // User already exists - switch to login mode with clear hint
          setMode("login");
          toast({
            title: "E-Mail bereits registriert",
            description: "Melde dich einfach mit deinem Passwort an.",
          });
        } else {
          // New user - email confirmation required
          setShowEmailConfirm(true);
        }
      }
    } catch {
      toast({ title: "Fehler", description: "Ein Fehler ist aufgetreten.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      toast({ title: "Fehler", description: "Bitte alle Felder ausfüllen.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (error) {
        toast({ title: "Fehler", description: "E-Mail oder Passwort falsch.", variant: "destructive" });
        return;
      }

      if (data.user) {
        await handleAuthRedirect();
      }
    } catch {
      toast({ title: "Fehler", description: "Ein Fehler ist aufgetreten.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    borderColor: "rgba(232, 134, 58, 0.35)",
  };

  // Email confirmation screen
  if (showEmailConfirm) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(180deg, #FFF8F0 0%, #FFECD2 100%)" }}>
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg px-8 py-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-5 rounded-full shadow-md" style={{ background: "linear-gradient(135deg, #4ade80, #16a34a)" }}>
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-3" style={{ color: "#E8863A" }}>E-Mail bestätigen</h2>
          <p className="text-base mb-3 leading-relaxed" style={{ color: "rgba(45, 24, 16, 0.65)" }}>
            Wir haben eine Bestätigungs-E-Mail an
          </p>
          <p className="text-base font-bold mb-4" style={{ color: "rgba(45, 24, 16, 0.85)" }}>{email}</p>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: "rgba(45, 24, 16, 0.6)" }}>
            Klicke auf den Link in der E-Mail, um dein Konto zu aktivieren. Du wirst danach automatisch eingeloggt. ✨
          </p>
          <p className="text-xs" style={{ color: "rgba(45, 24, 16, 0.4)" }}>Keine E-Mail erhalten? Prüfe deinen Spam-Ordner.</p>
        </div>
        <style>{`@keyframes gentleBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }`}</style>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #FFF8F0 0%, #FFECD2 100%)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#E8863A" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(180deg, #FFF8F0 0%, #FFECD2 100%)" }}>
      <div className="w-full max-w-sm">
        {/* Mascot + Logo */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/mascot/6_Onboarding.png"
            alt="Fablino Fuchs"
            className="h-28 w-auto drop-shadow-md"
            style={{ animation: "gentleBounce 2.2s ease-in-out infinite" }}
          />
          <h1 className="text-3xl font-bold mt-2" style={{ color: "#E8863A" }}>Fablino</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(45, 24, 16, 0.6)" }}>
            Magische Geschichten für junge Leser ✨
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg px-8 py-8">
          {/* Tab switcher */}
          <div className="flex rounded-2xl overflow-hidden border mb-6" style={{ borderColor: "rgba(232, 134, 58, 0.25)" }}>
            <button
              onClick={() => setMode("register")}
              className="flex-1 py-2.5 text-sm font-semibold transition-all"
              style={{
                background: mode === "register" ? "#E8863A" : "transparent",
                color: mode === "register" ? "white" : "rgba(45,24,16,0.5)",
              }}
            >
              Registrieren
            </button>
            <button
              onClick={() => setMode("login")}
              className="flex-1 py-2.5 text-sm font-semibold transition-all"
              style={{
                background: mode === "login" ? "#E8863A" : "transparent",
                color: mode === "login" ? "white" : "rgba(45,24,16,0.5)",
              }}
            >
              Anmelden
            </button>
          </div>

          {/* Form */}
          <form onSubmit={mode === "register" ? handleRegister : handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.com"
                className="h-12 rounded-xl border-2 text-base"
                style={inputStyle}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Passwort</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Mindestens 6 Zeichen..." : "Dein Passwort..."}
                  className="h-12 rounded-xl border-2 pr-12 text-base"
                  style={inputStyle}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "login" && (
              <div className="text-right">
                <a
                  href="/reset-password"
                  className="text-xs underline"
                  style={{ color: "#E8863A" }}
                >
                  Passwort vergessen?
                </a>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-13 text-base font-semibold rounded-2xl text-white shadow-md mt-1"
              style={{ backgroundColor: "#E8863A", height: "52px" }}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : mode === "register" ? (
                "Konto erstellen 🚀"
              ) : (
                "Anmelden →"
              )}
            </Button>

            {mode === "register" && (
              <p className="text-xs text-center" style={{ color: "rgba(45,24,16,0.45)" }}>
                Mit der Anmeldung akzeptierst du unsere{" "}
                <a href="https://fablino.eu/datenschutz" target="_blank" rel="noopener" className="underline">Datenschutzerklärung</a>
                {" "}und{" "}
                <a href="https://fablino.eu/agb" target="_blank" rel="noopener" className="underline">AGB</a>.
              </p>
            )}
          </form>
        </div>
      </div>

      <style>{`
        @keyframes gentleBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;
