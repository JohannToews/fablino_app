import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, UserPlus, Loader2 } from "lucide-react";

type AdminLanguage = 'de' | 'fr' | 'en' | 'es' | 'nl' | 'it';

const RegisterPage = () => {
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminLanguage, setAdminLanguage] = useState<AdminLanguage>("de");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const getLabels = () => {
    const labels = {
      de: {
        title: "Neuen Benutzer erstellen",
        subtitle: "Erstelle ein Konto für Le Petit Lecteur",
        name: "Name",
        namePlaceholder: "Dein Name",
        password: "Passwort",
        passwordPlaceholder: "Wähle ein Passwort",
        confirmPassword: "Passwort bestätigen",
        confirmPlaceholder: "Passwort wiederholen",
        language: "App-Sprache",
        register: "Registrieren",
        haveAccount: "Bereits ein Konto?",
        login: "Anmelden",
        errors: {
          fillAll: "Bitte alle Felder ausfüllen",
          passwordMatch: "Passwörter stimmen nicht überein",
          passwordLength: "Passwort muss mindestens 4 Zeichen lang sein",
          failed: "Registrierung fehlgeschlagen",
        },
        welcome: "Willkommen",
      },
      fr: {
        title: "Créer un nouveau compte",
        subtitle: "Créez un compte pour Le Petit Lecteur",
        name: "Nom",
        namePlaceholder: "Votre nom",
        password: "Mot de passe",
        passwordPlaceholder: "Choisissez un mot de passe",
        confirmPassword: "Confirmer le mot de passe",
        confirmPlaceholder: "Répétez le mot de passe",
        language: "Langue de l'application",
        register: "S'inscrire",
        haveAccount: "Déjà un compte ?",
        login: "Se connecter",
        errors: {
          fillAll: "Veuillez remplir tous les champs",
          passwordMatch: "Les mots de passe ne correspondent pas",
          passwordLength: "Le mot de passe doit contenir au moins 4 caractères",
          failed: "Échec de l'inscription",
        },
        welcome: "Bienvenue",
      },
      en: {
        title: "Create New Account",
        subtitle: "Create an account for Le Petit Lecteur",
        name: "Name",
        namePlaceholder: "Your name",
        password: "Password",
        passwordPlaceholder: "Choose a password",
        confirmPassword: "Confirm Password",
        confirmPlaceholder: "Repeat password",
        language: "App Language",
        register: "Register",
        haveAccount: "Already have an account?",
        login: "Log in",
        errors: {
          fillAll: "Please fill in all fields",
          passwordMatch: "Passwords do not match",
          passwordLength: "Password must be at least 4 characters",
          failed: "Registration failed",
        },
        welcome: "Welcome",
      },
      es: {
        title: "Crear nueva cuenta",
        subtitle: "Crea una cuenta para Le Petit Lecteur",
        name: "Nombre",
        namePlaceholder: "Tu nombre",
        password: "Contraseña",
        passwordPlaceholder: "Elige una contraseña",
        confirmPassword: "Confirmar contraseña",
        confirmPlaceholder: "Repetir contraseña",
        language: "Idioma de la aplicación",
        register: "Registrarse",
        haveAccount: "¿Ya tienes cuenta?",
        login: "Iniciar sesión",
        errors: {
          fillAll: "Por favor, rellena todos los campos",
          passwordMatch: "Las contraseñas no coinciden",
          passwordLength: "La contraseña debe tener al menos 4 caracteres",
          failed: "Error en el registro",
        },
        welcome: "Bienvenido",
      },
      nl: {
        title: "Nieuw account aanmaken",
        subtitle: "Maak een account voor Le Petit Lecteur",
        name: "Naam",
        namePlaceholder: "Je naam",
        password: "Wachtwoord",
        passwordPlaceholder: "Kies een wachtwoord",
        confirmPassword: "Bevestig wachtwoord",
        confirmPlaceholder: "Herhaal wachtwoord",
        language: "App-taal",
        register: "Registreren",
        haveAccount: "Heb je al een account?",
        login: "Inloggen",
        errors: {
          fillAll: "Vul alle velden in",
          passwordMatch: "Wachtwoorden komen niet overeen",
          passwordLength: "Wachtwoord moet minimaal 4 tekens bevatten",
          failed: "Registratie mislukt",
        },
        welcome: "Welkom",
      },
      it: {
        title: "Crea nuovo account",
        subtitle: "Crea un account per Le Petit Lecteur",
        name: "Nome",
        namePlaceholder: "Il tuo nome",
        password: "Password",
        passwordPlaceholder: "Scegli una password",
        confirmPassword: "Conferma password",
        confirmPlaceholder: "Ripeti password",
        language: "Lingua app",
        register: "Registrati",
        haveAccount: "Hai già un account?",
        login: "Accedi",
        errors: {
          fillAll: "Compila tutti i campi",
          passwordMatch: "Le password non corrispondono",
          passwordLength: "La password deve essere di almeno 4 caratteri",
          failed: "Registrazione fallita",
        },
        welcome: "Benvenuto",
      },
    };
    return labels[adminLanguage];
  };

  const l = getLabels();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = displayName.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedName || !trimmedPassword || !confirmPassword.trim()) {
      toast({
        title: "Error",
        description: l.errors.fillAll,
        variant: "destructive",
      });
      return;
    }

    if (trimmedPassword !== confirmPassword.trim()) {
      toast({
        title: "Error",
        description: l.errors.passwordMatch,
        variant: "destructive",
      });
      return;
    }

    if (trimmedPassword.length < 4) {
      toast({
        title: "Error",
        description: l.errors.passwordLength,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('register-user', {
        body: { 
          displayName: trimmedName, 
          password: trimmedPassword,
          adminLanguage,
        }
      });

      if (error) throw error;

      if (data.success) {
        login(data.token, data.user);
        toast({
          title: l.welcome + "!",
          description: `${l.welcome}, ${data.user.displayName}!`,
        });
        navigate("/admin", { replace: true });
      } else {
        toast({
          title: "Error",
          description: data.error || l.errors.failed,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: l.errors.failed,
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
              <UserPlus className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            Le Petit Lecteur
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </CardTitle>
          <CardDescription className="text-base">{l.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Language Selection first - so user can see labels in their language */}
            <div className="space-y-2">
              <Label htmlFor="language" className="text-base font-medium">
                🌍 {l.language}
              </Label>
              <Select value={adminLanguage} onValueChange={(v) => setAdminLanguage(v as AdminLanguage)}>
                <SelectTrigger className="h-12 border-2 border-violet-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="es">🇪🇸 Español</SelectItem>
                  <SelectItem value="nl">🇳🇱 Nederlands</SelectItem>
                  <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                  <SelectItem value="bs">🇧🇦 Bosanski</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-base font-medium">
                {l.name}
              </Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={l.namePlaceholder}
                className="text-lg h-12 border-2 border-violet-200 focus:border-violet-400"
                maxLength={50}
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium">
                {l.password}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={l.passwordPlaceholder}
                className="text-lg h-12 border-2 border-violet-200 focus:border-violet-400"
                maxLength={100}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-base font-medium">
                {l.confirmPassword}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={l.confirmPlaceholder}
                className="text-lg h-12 border-2 border-violet-200 focus:border-violet-400"
                maxLength={100}
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 text-xl font-bold bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  ✨ {l.register}
                </span>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground pt-2">
              {l.haveAccount}{" "}
              <Link to="/login" className="text-violet-600 hover:underline font-medium">
                {l.login}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;