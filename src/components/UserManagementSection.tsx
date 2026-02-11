import { useState, useEffect } from "react";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Trash2, Users, RefreshCw, UserPlus, Shield, User, ChevronDown, ChevronRight } from "lucide-react";
import { Language, useTranslations } from "@/lib/translations";
import { useAuth } from "@/hooks/useAuth";

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  admin_language: string;
  app_language: string;
  created_at: string;
  role?: string;
}

interface UserManagementSectionProps {
  language: Language;
  currentUserId: string;
}

const UserManagementSection = ({ language, currentUserId }: UserManagementSectionProps) => {
  const t = useTranslations(language);
  const { user: currentUser, refreshUserProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingLangId, setUpdatingLangId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // New user form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"standard" | "admin">("standard");
  const [newAdminLanguage, setNewAdminLanguage] = useState<Language>("de");

  const languages: { value: Language; label: string; flag: string }[] = [
    { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'es', label: 'Español', flag: '🇪🇸' },
    { value: 'nl', label: 'Nederlands', flag: '🇳🇱' },
    { value: 'it', label: 'Italiano', flag: '🇮🇹' },
    { value: 'bs', label: 'Bosanski', flag: '🇧🇦' },
  ];

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const result = await invokeEdgeFunction("manage-users", {
        action: "list",
      });

      if (result?.error) {
        console.error("Error loading users:", result.error);
        toast.error(t.error);
        setUsers([]);
        setIsLoading(false);
        return;
      }
      setUsers(result?.data?.users || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error(t.error);
      setUsers([]);
    }
    setIsLoading(false);
  };

  // Only load users when the collapsible is opened
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

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
      const { data, error } = await invokeEdgeFunction("manage-users", {
        action: "create", 
        username: newUsername.trim(),
        displayName: newDisplayName.trim(),
        password: newPassword,
        role: newRole,
        adminLanguage: newAdminLanguage,
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
        setNewAdminLanguage("de");
        setShowCreateForm(false);
        loadUsers();
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(t.error);
    }
    setIsCreating(false);
  };

  const updateUserLanguage = async (userId: string, langType: 'admin' | 'app', newLang: Language) => {
    setUpdatingLangId(`${userId}-${langType}`);
    try {
      const { error } = await invokeEdgeFunction("manage-users", {
        action: "updateLanguages", 
        userId,
        adminLanguage: langType === 'admin' ? newLang : undefined,
        appLanguage: langType === 'app' ? newLang : undefined,
      });

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { 
          ...u, 
          ...(langType === 'admin' ? { admin_language: newLang } : { app_language: newLang })
        } : u
      ));

      // If this is the current user, refresh their profile
      if (userId === currentUserId) {
        await refreshUserProfile();
      }

      toast.success(
        newLang === 'de' ? 'Sprache aktualisiert' :
        newLang === 'fr' ? 'Langue mise à jour' :
        newLang === 'en' ? 'Language updated' :
        newLang === 'es' ? 'Idioma actualizado' :
        newLang === 'it' ? 'Lingua aggiornata' :
        'Taal bijgewerkt'
      );
    } catch (error) {
      console.error("Error updating language:", error);
      toast.error(t.error);
    }
    setUpdatingLangId(null);
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
      const { data, error } = await invokeEdgeFunction("manage-users", {
        action: "delete", userId,
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

  const getRoleLabel = (role: string) => {
    if (role === 'admin') {
      return language === 'de' ? 'Admin' : language === 'fr' ? 'Admin' : 'Admin';
    }
    return language === 'de' ? 'Standard' : language === 'fr' ? 'Standard' : 'Standard';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-2 border-orange-500/30">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xl">
                {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <Users className="h-5 w-5 text-orange-500" />
                {language === 'de' ? 'Benutzerverwaltung' : 
                 language === 'es' ? 'Gestión de usuarios' :
                 language === 'nl' ? 'Gebruikersbeheer' :
                 language === 'fr' ? 'Gestion des utilisateurs' :
                 'User Management'}
                <span className="text-sm font-normal text-muted-foreground">
                  ({users.length})
                </span>
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); setShowCreateForm(!showCreateForm); }}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                {language === 'de' ? 'Neu' : language === 'fr' ? 'Nouveau' : 'New'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); loadUsers(); }}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
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
              <div className="grid grid-cols-3 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="newAdminLanguage">
                    {language === 'de' ? 'Sprache' : 
                     language === 'fr' ? 'Langue' : 'Language'}
                  </Label>
                  <Select value={newAdminLanguage} onValueChange={(v) => setNewAdminLanguage(v as Language)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                          </div>
                        </SelectItem>
                      ))}
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
                    {language === 'de' ? 'Admin' : 
                     language === 'it' ? 'Admin' :
                     'Admin'}
                  </TableHead>
                  <TableHead>
                    {language === 'de' ? 'App' : 
                     language === 'it' ? 'App' :
                     'App'}
                  </TableHead>
                  <TableHead></TableHead>
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
                    <TableCell>
                      <Select 
                        value={user.admin_language} 
                        onValueChange={(v) => updateUserLanguage(user.id, 'admin', v as Language)}
                        disabled={updatingLangId === `${user.id}-admin`}
                      >
                        <SelectTrigger className="w-[110px] h-8">
                          {updatingLangId === `${user.id}-admin` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              <div className="flex items-center gap-2">
                                <span>{lang.flag}</span>
                                <span className="text-xs">{lang.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={user.app_language || 'fr'} 
                        onValueChange={(v) => updateUserLanguage(user.id, 'app', v as Language)}
                        disabled={updatingLangId === `${user.id}-app`}
                      >
                        <SelectTrigger className="w-[110px] h-8">
                          {updatingLangId === `${user.id}-app` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              <div className="flex items-center gap-2">
                                <span>{lang.flag}</span>
                                <span className="text-xs">{lang.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default UserManagementSection;
