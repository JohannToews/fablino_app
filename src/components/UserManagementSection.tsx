import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Trash2, Users, RefreshCw } from "lucide-react";
import { Language, useTranslations } from "@/lib/translations";

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  admin_language: string;
  created_at: string;
}

interface UserManagementSectionProps {
  language: Language;
  currentUserId: string;
}

const UserManagementSection = ({ language, currentUserId }: UserManagementSectionProps) => {
  const t = useTranslations(language);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "list" },
      });

      if (error) throw error;
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error(t.error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const deleteUser = async (userId: string, username: string) => {
    if (userId === currentUserId) {
      toast.error(language === 'de' ? 'Du kannst dich nicht selbst löschen!' : 
                  language === 'es' ? '¡No puedes eliminarte a ti mismo!' :
                  language === 'nl' ? 'Je kunt jezelf niet verwijderen!' :
                  language === 'fr' ? 'Vous ne pouvez pas vous supprimer!' :
                  'You cannot delete yourself!');
      return;
    }

    const confirmMsg = language === 'de' ? `Benutzer "${username}" wirklich löschen? Alle Daten werden gelöscht!` :
                       language === 'es' ? `¿Eliminar usuario "${username}"? ¡Se eliminarán todos los datos!` :
                       language === 'nl' ? `Gebruiker "${username}" verwijderen? Alle gegevens worden verwijderd!` :
                       language === 'fr' ? `Supprimer l'utilisateur "${username}" ? Toutes les données seront supprimées !` :
                       `Delete user "${username}"? All data will be deleted!`;

    if (!confirm(confirmMsg)) return;

    setDeletingId(userId);
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "delete", userId },
      });

      if (error) throw error;

      toast.success(language === 'de' ? 'Benutzer gelöscht' : 
                    language === 'es' ? 'Usuario eliminado' :
                    language === 'nl' ? 'Gebruiker verwijderd' :
                    language === 'fr' ? 'Utilisateur supprimé' :
                    'User deleted');
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(t.error);
    }
    setDeletingId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === 'de' ? 'de-DE' : 
      language === 'es' ? 'es-ES' :
      language === 'nl' ? 'nl-NL' :
      language === 'fr' ? 'fr-FR' : 'en-US',
      { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    );
  };

  const getLanguageFlag = (lang: string) => {
    const flags: Record<string, string> = {
      de: '🇩🇪',
      fr: '🇫🇷',
      en: '🇬🇧',
      es: '🇪🇸',
      nl: '🇳🇱',
    };
    return flags[lang] || '🌍';
  };

  return (
    <Card className="border-2 border-orange-500/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5 text-orange-500" />
            {language === 'de' ? 'Benutzerverwaltung' : 
             language === 'es' ? 'Gestión de usuarios' :
             language === 'nl' ? 'Gebruikersbeheer' :
             language === 'fr' ? 'Gestion des utilisateurs' :
             'User Management'}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadUsers}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {language === 'de' ? 'Keine Benutzer gefunden' : 
             language === 'es' ? 'No se encontraron usuarios' :
             language === 'nl' ? 'Geen gebruikers gevonden' :
             language === 'fr' ? 'Aucun utilisateur trouvé' :
             'No users found'}
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {language === 'de' ? 'Anzeigename' : 
                     language === 'es' ? 'Nombre' :
                     language === 'nl' ? 'Weergavenaam' :
                     language === 'fr' ? 'Nom affiché' :
                     'Display Name'}
                  </TableHead>
                  <TableHead>
                    {language === 'de' ? 'Benutzername' : 
                     language === 'es' ? 'Usuario' :
                     language === 'nl' ? 'Gebruikersnaam' :
                     language === 'fr' ? 'Identifiant' :
                     'Username'}
                  </TableHead>
                  <TableHead>
                    {language === 'de' ? 'Sprache' : 
                     language === 'es' ? 'Idioma' :
                     language === 'nl' ? 'Taal' :
                     language === 'fr' ? 'Langue' :
                     'Language'}
                  </TableHead>
                  <TableHead>
                    {language === 'de' ? 'Erstellt' : 
                     language === 'es' ? 'Creado' :
                     language === 'nl' ? 'Gemaakt' :
                     language === 'fr' ? 'Créé' :
                     'Created'}
                  </TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className={user.id === currentUserId ? 'bg-primary/5' : ''}>
                    <TableCell className="font-medium">
                      {user.display_name}
                      {user.id === currentUserId && (
                        <span className="ml-2 text-xs text-primary">(Du)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.username}</TableCell>
                    <TableCell>{getLanguageFlag(user.admin_language)} {user.admin_language.toUpperCase()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteUser(user.id, user.username)}
                        disabled={deletingId === user.id || user.id === currentUserId}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        {deletingId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagementSection;
