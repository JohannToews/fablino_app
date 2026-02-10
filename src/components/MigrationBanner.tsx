import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, X, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Language } from "@/lib/translations";

interface MigrationBannerProps {
  language?: Language;
}

const translations: Record<Language, {
  title: string;
  description: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  passwordHint: string;
  submitButton: string;
  laterButton: string;
  successTitle: string;
  successMessage: string;
  errorInvalidEmail: string;
  errorPasswordTooShort: string;
  errorGeneric: string;
}> = {
  de: {
    title: "Sichere deinen Account!",
    description: "Hinterlege eine E-Mail-Adresse und wähle ein neues Passwort, damit du dein Passwort zurücksetzen kannst und dein Account besser geschützt ist.",
    emailLabel: "E-Mail",
    emailPlaceholder: "deine@email.com",
    passwordLabel: "Neues Passwort",
    passwordPlaceholder: "Neues Passwort",
    passwordHint: "Mindestens 6 Zeichen",
    submitButton: "Account sichern",
    laterButton: "Später",
    successTitle: "Erfolgreich!",
    successMessage: "Dein Account ist jetzt gesichert! ✅",
    errorInvalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein.",
    errorPasswordTooShort: "Das Passwort muss mindestens 6 Zeichen lang sein.",
    errorGeneric: "Migration fehlgeschlagen. Bitte versuche es später erneut.",
  },
  fr: {
    title: "Sécurise ton compte !",
    description: "Ajoute une adresse e-mail et choisis un nouveau mot de passe pour pouvoir réinitialiser ton mot de passe et mieux protéger ton compte.",
    emailLabel: "E-mail",
    emailPlaceholder: "ton@email.com",
    passwordLabel: "Nouveau mot de passe",
    passwordPlaceholder: "Nouveau mot de passe",
    passwordHint: "Au moins 6 caractères",
    submitButton: "Sécuriser le compte",
    laterButton: "Plus tard",
    successTitle: "Succès !",
    successMessage: "Ton compte est maintenant sécurisé ! ✅",
    errorInvalidEmail: "Veuillez entrer une adresse e-mail valide.",
    errorPasswordTooShort: "Le mot de passe doit contenir au moins 6 caractères.",
    errorGeneric: "La migration a échoué. Veuillez réessayer plus tard.",
  },
  en: {
    title: "Secure your account!",
    description: "Add an email address and choose a new password so you can reset your password and keep your account safe.",
    emailLabel: "Email",
    emailPlaceholder: "your@email.com",
    passwordLabel: "New password",
    passwordPlaceholder: "New password",
    passwordHint: "At least 6 characters",
    submitButton: "Secure account",
    laterButton: "Later",
    successTitle: "Success!",
    successMessage: "Your account is now secured! ✅",
    errorInvalidEmail: "Please enter a valid email address.",
    errorPasswordTooShort: "Password must be at least 6 characters.",
    errorGeneric: "Migration failed. Please try again later.",
  },
  es: {
    title: "¡Asegura tu cuenta!",
    description: "Agrega una dirección de correo y elige una nueva contraseña para poder restablecer tu contraseña y mantener tu cuenta segura.",
    emailLabel: "Correo",
    emailPlaceholder: "tu@correo.com",
    passwordLabel: "Nueva contraseña",
    passwordPlaceholder: "Nueva contraseña",
    passwordHint: "Al menos 6 caracteres",
    submitButton: "Asegurar cuenta",
    laterButton: "Más tarde",
    successTitle: "¡Éxito!",
    successMessage: "¡Tu cuenta ahora está segura! ✅",
    errorInvalidEmail: "Por favor ingresa un correo válido.",
    errorPasswordTooShort: "La contraseña debe tener al menos 6 caracteres.",
    errorGeneric: "La migración falló. Intenta de nuevo más tarde.",
  },
  nl: {
    title: "Beveilig je account!",
    description: "Voeg een e-mailadres toe en kies een nieuw wachtwoord zodat je je wachtwoord kunt resetten en je account veilig blijft.",
    emailLabel: "E-mail",
    emailPlaceholder: "jouw@email.com",
    passwordLabel: "Nieuw wachtwoord",
    passwordPlaceholder: "Nieuw wachtwoord",
    passwordHint: "Minimaal 6 tekens",
    submitButton: "Account beveiligen",
    laterButton: "Later",
    successTitle: "Gelukt!",
    successMessage: "Je account is nu beveiligd! ✅",
    errorInvalidEmail: "Voer een geldig e-mailadres in.",
    errorPasswordTooShort: "Het wachtwoord moet minimaal 6 tekens bevatten.",
    errorGeneric: "Migratie mislukt. Probeer het later opnieuw.",
  },
  it: {
    title: "Proteggi il tuo account!",
    description: "Aggiungi un indirizzo email e scegli una nuova password per poter reimpostare la password e mantenere il tuo account sicuro.",
    emailLabel: "Email",
    emailPlaceholder: "tua@email.com",
    passwordLabel: "Nuova password",
    passwordPlaceholder: "Nuova password",
    passwordHint: "Almeno 6 caratteri",
    submitButton: "Proteggi account",
    laterButton: "Più tardi",
    successTitle: "Successo!",
    successMessage: "Il tuo account è ora protetto! ✅",
    errorInvalidEmail: "Inserisci un indirizzo email valido.",
    errorPasswordTooShort: "La password deve avere almeno 6 caratteri.",
    errorGeneric: "Migrazione fallita. Riprova più tardi.",
  },
  bs: {
    title: "Osiguraj svoj račun!",
    description: "Dodaj e-mail adresu i odaberi novu lozinku kako bi mogao resetirati lozinku i zaštititi svoj račun.",
    emailLabel: "E-mail",
    emailPlaceholder: "tvoj@email.com",
    passwordLabel: "Nova lozinka",
    passwordPlaceholder: "Nova lozinka",
    passwordHint: "Najmanje 6 znakova",
    submitButton: "Osiguraj račun",
    laterButton: "Kasnije",
    successTitle: "Uspjeh!",
    successMessage: "Tvoj račun je sada osiguran! ✅",
    errorInvalidEmail: "Unesi važeću e-mail adresu.",
    errorPasswordTooShort: "Lozinka mora imati najmanje 6 znakova.",
    errorGeneric: "Migracija nije uspjela. Pokušaj ponovo kasnije.",
  },
};

const MigrationBanner = ({ language = 'de' }: MigrationBannerProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { user, dismissMigrationBanner, needsMigration, migrationBannerDismissed, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  
  const t = translations[language] || translations.de;

  if (!needsMigration || migrationBannerDismissed || isSuccess) {
    return null;
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim();
    
    if (!validateEmail(trimmedEmail)) {
      toast({ title: "Error", description: t.errorInvalidEmail, variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Error", description: t.errorPasswordTooShort, variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('migrate-user-auth', {
        body: { 
          userId: user?.id,
          email: trimmedEmail,
          newPassword: password,
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Migration failed');
      }

      setIsSuccess(true);
      toast({ title: t.successTitle, description: t.successMessage });
      await refreshUserProfile();

      if (data.autoLogin) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast({ title: "Error", description: t.errorGeneric, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5 shadow-lg">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                🔒 {t.title}
              </h3>
              <button
                onClick={dismissMigrationBanner}
                className="p-1 rounded-full hover:bg-muted transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              {t.description}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="w-full">
                <Label htmlFor="migration-email" className="sr-only">
                  {t.emailLabel}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="migration-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="pl-10 h-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="w-full">
                <Label htmlFor="migration-password" className="sr-only">
                  {t.passwordLabel}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="migration-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="pl-10 pr-10 h-10"
                    disabled={isLoading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t.passwordHint}</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isLoading || !email.trim() || password.length < 6}
                  className="h-10 px-4 flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t.submitButton
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={dismissMigrationBanner}
                  className="h-10 px-4"
                  disabled={isLoading}
                >
                  {t.laterButton}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MigrationBanner;
