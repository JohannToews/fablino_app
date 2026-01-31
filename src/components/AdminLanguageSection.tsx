import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Globe, Loader2 } from "lucide-react";
import { Language } from "@/lib/translations";
import { useAuth } from "@/hooks/useAuth";

interface AdminLanguageSectionProps {
  language: Language;
  userId: string;
}

const AdminLanguageSection = ({ language, userId }: AdminLanguageSectionProps) => {
  const { user, login } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(user?.adminLanguage || 'de');

  const languages = [
    { value: 'de', label: 'Deutsch' },
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'nl', label: 'Nederlands' },
  ];

  const handleLanguageChange = async (newLang: Language) => {
    setIsSaving(true);
    setSelectedLanguage(newLang);

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ admin_language: newLang })
        .eq("id", userId);

      if (error) {
        console.error("Error updating admin language:", error);
        toast.error(
          language === 'de' ? "Fehler beim Speichern" :
          language === 'fr' ? "Erreur lors de la sauvegarde" :
          "Error saving"
        );
        setSelectedLanguage(user?.adminLanguage || 'de');
      } else {
        // Update session with new language
        if (user) {
          const updatedUser = { ...user, adminLanguage: newLang };
          const token = sessionStorage.getItem('liremagie_session') || '';
          login(token, updatedUser);
        }
        toast.success(
          newLang === 'de' ? "Sprache geändert" :
          newLang === 'fr' ? "Langue modifiée" :
          newLang === 'en' ? "Language changed" :
          newLang === 'es' ? "Idioma cambiado" :
          "Taal gewijzigd"
        );
      }
    } catch (err) {
      console.error("Error:", err);
      setSelectedLanguage(user?.adminLanguage || 'de');
    } finally {
      setIsSaving(false);
    }
  };

  const getTitle = () => {
    switch (language) {
      case 'de': return 'Admin-Sprache';
      case 'fr': return 'Langue Admin';
      case 'es': return 'Idioma Admin';
      case 'nl': return 'Beheerder Taal';
      default: return 'Admin Language';
    }
  };

  const getDescription = () => {
    switch (language) {
      case 'de': return 'Die Sprache der Administrationsoberfläche für alle Benutzer mit Admin-Rechten.';
      case 'fr': return "La langue de l'interface d'administration pour tous les utilisateurs admin.";
      case 'es': return 'El idioma de la interfaz de administración para todos los usuarios admin.';
      case 'nl': return 'De taal van de beheerinterface voor alle admin-gebruikers.';
      default: return 'The language of the administration interface for all admin users.';
    }
  };

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5 text-primary" />
          {getTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {getDescription()}
        </p>

        <div className="flex items-center gap-4">
          <Select
            value={selectedLanguage}
            onValueChange={(value) => handleLanguageChange(value as Language)}
            disabled={isSaving}
          >
            <SelectTrigger className="w-[200px]">
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>...</span>
                </div>
              ) : (
                <SelectValue />
              )}
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminLanguageSection;
