import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Trash2, Users, RefreshCw, UserPlus, Shield, User } from "lucide-react";
import { Language, useTranslations } from "@/lib/translations";

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  admin_language: string;
  created_at: string;
  role?: string;
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
  const [isCreating, setIsCreating] = useState(false);
  
  // New user form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"standard" | "admin">("standard");

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

  const createUser = async () => {
    if (!newUsername.trim() || !newDisplayName.trim() || !newPassword.trim()) {
      toast.error(language === 'de' ? 'Alle Felder ausfüllen!' : 
                  language === 'es' ? '¡Completa todos los campos!' :
                  language === 'nl' ? 'Vul alle velden in!' :
                  language === 'fr' ? 'Remplir tous les champs !' :
                  'Fill all fields!');
      return;
    }

    if (newPassword.length < 4) {
      toast.error(language === 'de' ? 'Passwort muss mindestens 4 Zeichen haben' : 
                  language === 'es' ? 'La contraseña debe tener al menos 4 caracteres' :
                  language === 'nl' ? 'Wachtwoord moet minimaal 4 tekens bevatten' :
                  language === 'fr' ? 'Le mot de passe doit avoir au moins 4 caractères' :
                  'Password must be at least 4 characters');
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { 
          action: "create", 
          username: newUsername.trim(),
          displayName: newDisplayName.trim(),
          password: newPassword,
          role: newRole
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(language === 'de' ? 'Benutzer erstellt!' : 
                      language === 'es' ? '¡Usuario creado!' :
                      language === 'nl' ? 'Gebruiker aangemaakt!' :
                      language === 'fr' ? 'Utilisateur créé !' :
                      'User created!');
        setNewUsername("");
        setNewDisplayName("");
        setNewPassword("");
        setNewRole("standard");
        setShowCreateForm(false);
        loadUsers();
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(t.error);
    }
    setIsCreating(false);
  };

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

  const getRoleLabel = (role: string) => {
    if (role === 'admin') {
      return language === 'de' ? 'Admin' : language === 'fr' ? 'Admin' : 'Admin';
    }
    return language === 'de' ? 'Standard' : language === 'fr' ? 'Standard' : 'Standard';
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              {language === 'de' ? 'Neu' : language === 'fr' ? 'Nouveau' : 'New'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadUsers}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create User Form */}
        {showCreateForm && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newDisplayName">
                    {language === 'de' ? 'Anzeigename' : 
                     language === 'fr' ? 'Nom affiché' : 'Display Name'}
                  </Label>
                  <Input
                    id="newDisplayName"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder={language === 'de' ? 'z.B. Diego' : 'e.g. Diego'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newUsername">
                    {language === 'de' ? 'Benutzername' : 
                     language === 'fr' ? 'Identifiant' : 'Username'}
                  </Label>
                  <Input
                    id="newUsername"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    placeholder={language === 'de' ? 'z.B. diego' : 'e.g. diego'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">
                    {language === 'de' ? 'Passwort' : 
                     language === 'fr' ? 'Mot de passe' : 'Password'}
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newRole">
                    {language === 'de' ? 'Rolle' : 
                     language === 'fr' ? 'Rôle' : 'Role'}
                  </Label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as "standard" | "admin")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Standard
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowCreateForm(false)}>
                  {language === 'de' ? 'Abbrechen' : language === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button size="sm" onClick={createUser} disabled={isCreating}>
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" />
                      {language === 'de' ? 'Erstellen' : language === 'fr' ? 'Créer' : 'Create'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User List */}
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
                    {language === 'de' ? 'Rolle' : 
                     language === 'fr' ? 'Rôle' : 'Role'}
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
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {user.role === 'admin' ? (
                          <Shield className="h-4 w-4 text-orange-500" />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={user.role === 'admin' ? 'text-orange-500 font-medium' : ''}>
                          {getRoleLabel(user.role || 'standard')}
                        </span>
                      </div>
                    </TableCell>
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
