import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Loader2, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useTranslations, Language } from "@/lib/translations";
import { LANGUAGES } from "@/lib/languages";

function detectLanguage(): Language {
  const browserLang = navigator.language?.slice(0, 2)?.toLowerCase();
  const supported = LANGUAGES.filter(l => l.uiSupported).map(l => l.code);
  return (supported.includes(browserLang) ? browserLang : 'en') as Language;
}

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const t = useTranslations(detectLanguage());

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim();
    const trimmedDisplayName = displayName.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedEmail || !trimmedPassword || !trimmedDisplayName) {
      toast({ title: t.authError, description: t.authFillAllFields, variant: "destructive" });
      return;
    }

    if (!trimmedEmail.includes('@')) {
      toast({ title: t.authError, description: t.authInvalidEmail, variant: "destructive" });
      return;
    }

    if (trimmedPassword.length < 6) {
      toast({ title: t.authError, description: t.authPasswordMin6, variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: t.authError, description: t.authPasswordsNoMatch, variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          data: { display_name: trimmedDisplayName },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error('Registration error:', error);
        let errorMessage = t.authRegFailed;
        if (error.message.includes("already registered")) {
          errorMessage = t.authEmailAlreadyRegistered;
        } else if (error.message.includes("Invalid email")) {
          errorMessage = t.authRegInvalidEmail;
        } else if (error.message.includes("Password")) {
          errorMessage = t.authRegPasswordReq;
        }
        toast({ title: t.authError, description: errorMessage, variant: "destructive" });
        return;
      }

      if (data.user) {
        if (data.session === null) {
          setIsSuccess(true);
        } else {
          toast({ title: t.authRegWelcome, description: t.authRegSuccess });
          navigate("/", { replace: true });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({ title: t.authError, description: t.authGenericError, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFECD2 100%)' }}>
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg px-8 py-10 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full shadow-lg" style={{ background: 'linear-gradient(135deg, #4ade80, #16a34a)' }}>
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">{t.authConfirmEmailTitle}</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(45, 24, 16, 0.6)' }}>
            {t.authConfirmEmailSent} <strong>{email}</strong>. {t.authConfirmEmailClick}
          </p>
          <div className="bg-muted/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">{t.authConfirmEmailSpam}</p>
          </div>
          <Button
            onClick={() => navigate("/login")}
            variant="outline"
            className="w-full h-12 rounded-2xl text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.authBackToSignIn}
          </Button>
        </div>
      </div>
    );
  }

  const inputStyle = {
    borderColor: 'rgba(232, 134, 58, 0.3)',
    '--tw-ring-color': 'rgba(232, 134, 58, 0.2)',
  } as React.CSSProperties;

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
          {t.authRegisterSubtitle}
        </p>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-base font-medium text-foreground">
              {t.authNameLabel}
            </Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t.authNamePlaceholder}
              className="text-base h-12 rounded-xl border-2 focus:ring-2"
              style={inputStyle}
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-medium text-foreground">
              {t.authEmailLabel}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.authEmailPlaceholder}
              className="text-base h-12 rounded-xl border-2 focus:ring-2"
              style={inputStyle}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-base font-medium text-foreground">
              {t.authPasswordLabel}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.authPasswordPlaceholderNew}
                className="text-base h-12 rounded-xl border-2 pr-12 focus:ring-2"
                style={inputStyle}
                autoComplete="new-password"
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-base font-medium text-foreground">
              {t.authConfirmPasswordLabel}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t.authRepeatPasswordPlaceholder}
              className="text-base h-12 rounded-xl border-2 focus:ring-2"
              style={inputStyle}
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg text-white mt-2"
            style={{ backgroundColor: '#E8863A' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D4752E')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E8863A')}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" /> {t.authRegCreateButton}
              </span>
            )}
          </Button>

          <div className="text-center pt-2 border-t border-border mt-4">
            <p className="text-sm text-muted-foreground pt-4">
              {t.authRegAlreadyHaveAccount}{" "}
              <Link to="/login" className="font-medium hover:underline" style={{ color: '#E8863A' }}>
                {t.authTabLogin}
              </Link>
            </p>
          </div>
        </form>
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

export default RegisterPage;
