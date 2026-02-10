import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Image, Trash2, LogOut, User, Settings, Library, Star, TrendingUp, CreditCard, Wrench, Users, BookHeart, Crown, Mail, Lock, UserX, Receipt, Globe, Loader2 } from "lucide-react";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelper";
import PointsConfigSection from "@/components/PointsConfigSection";
import LevelConfigSection from "@/components/LevelConfigSection";
import KidProfileSection from "@/components/KidProfileSection";
import ParentSettingsPanel from "@/components/ParentSettingsPanel";
import UserManagementSection from "@/components/UserManagementSection";
import SystemPromptSection from "@/components/SystemPromptSection";
import { useAuth } from "@/hooks/useAuth";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useTranslations, Language } from "@/lib/translations";

interface Story {
  id: string;
  title: string;
  cover_image_url: string | null;
  kid_profile_id: string | null;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUserProfile } = useAuth();
  const { selectedProfileId, selectedProfile, kidProfiles, hasMultipleProfiles, setSelectedProfileId } = useKidProfile();
  const adminLang = (user?.adminLanguage || 'de') as Language;
  const t = useTranslations(adminLang);
  
  const [stories, setStories] = useState<Story[]>([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [settingsSubTab, setSettingsSubTab] = useState("points");
  const [accountSubTab, setAccountSubTab] = useState("management");
  const [updatingLang, setUpdatingLang] = useState(false);

  const languages: { value: Language; label: string; flag: string }[] = [
    { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'es', label: 'Español', flag: '🇪🇸' },
    { value: 'nl', label: 'Nederlands', flag: '🇳🇱' },
    { value: 'it', label: 'Italiano', flag: '🇮🇹' },
  ];

  const handleAdminLanguageChange = async (newLang: Language) => {
    if (!user) return;
    setUpdatingLang(true);
    try {
      const { error } = await invokeEdgeFunction("manage-users", {
        action: "updateLanguages",
        userId: user.id,
        adminLanguage: newLang,
      });
      if (error) throw error;
      await refreshUserProfile();
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
      toast.error("Error updating language");
    }
    setUpdatingLang(false);
  };

  useEffect(() => {
    if (user) {
      loadStories();
    }
  }, [user]);

  const loadStories = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("stories")
      .select("id, title, cover_image_url, kid_profile_id")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });
    
    if (data) {
      setStories(data);
    }
  };

  const updateStoryKidProfile = async (storyId: string, kidProfileId: string | null) => {
    const { error } = await supabase
      .from("stories")
      .update({ kid_profile_id: kidProfileId })
      .eq("id", storyId);
    
    if (error) {
      toast.error(adminLang === 'de' ? 'Zuordnung fehlgeschlagen' : 'Assignment failed');
    } else {
      toast.success(adminLang === 'de' ? 'Kind zugeordnet' : 'Child assigned');
      loadStories();
    }
  };


  const deleteStory = async (id: string) => {
    const { error } = await supabase.from("stories").delete().eq("id", id);
    
    if (error) {
      toast.error(t.deleteError);
    } else {
      toast.success(t.storyDeleted);
      loadStories();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen flex flex-col gradient-admin overflow-hidden">
      {/* Compact Header */}
      <header className="flex-none flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full hover:bg-primary/20 h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-baloo font-bold text-foreground">
              {t.adminArea}
            </h1>
            {user && (
              <p className="text-xs text-muted-foreground">
                {user.displayName}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* Tab Navigation - Native App Style */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className={`flex-none grid mx-4 mt-3 h-12 bg-muted/50 ${user?.role === 'admin' ? 'grid-cols-6' : 'grid-cols-3'}`}>
          <TabsTrigger value="profile" className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{t.kidProfile}</span>
          </TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="parenting" className="flex items-center gap-2 text-sm font-medium">
              <BookHeart className="h-4 w-4" />
              <span className="hidden sm:inline">{t.parentSettingsTab}</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="stories" className="flex items-center gap-2 text-sm font-medium">
            <Library className="h-4 w-4" />
            <span className="hidden sm:inline">{t.library}</span>
          </TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="settings" className="flex items-center gap-2 text-sm font-medium">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t.settings}</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="account" className="flex items-center gap-2 text-sm font-medium">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">{t.account}</span>
          </TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="system" className="flex items-center gap-2 text-sm font-medium">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">System</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab Content - Scrollable within each tab */}
        <div className="flex-1 overflow-hidden p-4">
          {/* Profile Tab */}
          <TabsContent value="profile" className="h-full overflow-y-auto m-0 pr-2">
            <div className="max-w-3xl mx-auto">
              {user && (
                <KidProfileSection 
                  language={adminLang} 
                  userId={user.id}
                />
              )}
            </div>
          </TabsContent>

          {/* Parenting / Education Tab - Admin Only */}
          {user?.role === 'admin' && (
            <TabsContent value="parenting" className="h-full overflow-y-auto m-0 pr-2">
              <div className="max-w-3xl mx-auto">
                <ParentSettingsPanel language={adminLang} />
              </div>
            </TabsContent>
          )}

          {/* Stories Tab */}
          <TabsContent value="stories" className="h-full overflow-hidden m-0">
            <div className="h-full flex flex-col max-w-4xl mx-auto">
              {/* Kid Profile Selector - Always show if profiles exist */}
              {kidProfiles.length > 0 && (
                <div className="flex-none mb-4 flex items-center justify-center gap-2 bg-card/60 backdrop-blur-sm rounded-xl p-3">
                  <span className="text-sm text-muted-foreground mr-2">
                    {adminLang === 'de' ? 'Geschichte für:' : adminLang === 'fr' ? 'Histoire pour:' : 'Story for:'}
                  </span>
                  {kidProfiles.length === 1 ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground">
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-border">
                        {kidProfiles[0].cover_image_url ? (
                          <img src={kidProfiles[0].cover_image_url} alt={kidProfiles[0].name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Users className="w-3 h-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-sm">{kidProfiles[0].name}</span>
                    </div>
                  ) : (
                    <Select 
                      value={selectedProfileId || ''} 
                      onValueChange={(value) => setSelectedProfileId(value)}
                    >
                      <SelectTrigger className="w-[200px] bg-card">
                        <SelectValue placeholder={adminLang === 'de' ? 'Kind auswählen...' : adminLang === 'fr' ? 'Choisir enfant...' : 'Select child...'}>
                          {selectedProfile && (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full overflow-hidden border border-border">
                                {selectedProfile.cover_image_url ? (
                                  <img src={selectedProfile.cover_image_url} alt={selectedProfile.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <Users className="w-3 h-3 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <span>{selectedProfile.name}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border z-50">
                        {kidProfiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full overflow-hidden border border-border">
                                {profile.cover_image_url ? (
                                  <img src={profile.cover_image_url} alt={profile.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <Users className="w-3 h-3 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <span>{profile.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
              
              {/* Library Content - directly shown without sub-tabs */}
              <div className="flex-1 overflow-y-auto pr-2">
                <Card className="border-2 border-muted">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{t.existingStories}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stories.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8 text-sm">
                        {t.noStoriesYet}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {stories.map((story) => {
                          const assignedKid = kidProfiles.find(p => p.id === story.kid_profile_id);
                          return (
                            <div
                              key={story.id}
                              className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50"
                            >
                              {story.cover_image_url ? (
                                <img
                                  src={story.cover_image_url}
                                  alt={story.title}
                                  className="h-14 w-14 object-cover rounded-lg flex-none"
                                />
                              ) : (
                                <div className="h-14 w-14 bg-muted rounded-lg flex items-center justify-center flex-none">
                                  <Image className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-baloo font-bold text-sm truncate">{story.title}</h3>
                                <Select
                                  value={story.kid_profile_id || "none"}
                                  onValueChange={(value) => updateStoryKidProfile(story.id, value === "none" ? null : value)}
                                >
                                  <SelectTrigger className="h-7 text-xs w-full mt-1">
                                    <SelectValue>
                                      {assignedKid ? (
                                        <span className="flex items-center gap-1">
                                          <Users className="h-3 w-3" />
                                          {assignedKid.name}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">
                                          {adminLang === 'de' ? 'Kind zuordnen...' : 'Assign child...'}
                                        </span>
                                      )}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">
                                      {adminLang === 'de' ? '— Kein Kind —' : '— No child —'}
                                    </SelectItem>
                                    {kidProfiles.map((profile) => (
                                      <SelectItem key={profile.id} value={profile.id}>
                                        {profile.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteStory(story.id)}
                                className="text-destructive hover:bg-destructive/10 flex-none h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab - Admin Only */}
          {user?.role === 'admin' && (
          <TabsContent value="settings" className="h-full overflow-hidden m-0">
            <div className="h-full flex flex-col max-w-4xl mx-auto">
              {/* Sub-Tab Navigation */}
              <div className="flex-none flex gap-2 mb-4">
                <Button
                  variant={settingsSubTab === "points" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettingsSubTab("points")}
                  className="flex items-center gap-2"
                >
                  <Star className="h-4 w-4" />
                  Punkte
                </Button>
                <Button
                  variant={settingsSubTab === "levels" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettingsSubTab("levels")}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Level
                </Button>
              </div>

              {/* Sub-Tab Content */}
              <div className="flex-1 overflow-y-auto pr-2">
                {settingsSubTab === "points" && (
                  <PointsConfigSection language={adminLang} />
                )}
                {settingsSubTab === "levels" && (
                  <LevelConfigSection language={adminLang} />
                )}
              </div>
            </div>
          </TabsContent>
          )}

          {/* Account Tab */}
          <TabsContent value="account" className="h-full overflow-hidden m-0">
            <div className="h-full flex flex-col max-w-4xl mx-auto">
              {/* Sub-Tab Navigation */}
              <div className="flex-none flex gap-2 mb-4">
                <Button
                  variant={accountSubTab === "management" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAccountSubTab("management")}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Konto
                </Button>
                <Button
                  variant={accountSubTab === "subscription" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAccountSubTab("subscription")}
                  className="flex items-center gap-2"
                >
                  <Crown className="h-4 w-4" />
                  Abo & Plan
                </Button>
              </div>

              {/* Sub-Tab Content */}
              <div className="flex-1 overflow-y-auto pr-2">
                {/* Account Management */}
                {accountSubTab === "management" && (
                  <Card className="border-2 border-primary/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Konto-Verwaltung</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Admin Language */}
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Globe className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {adminLang === 'de' ? 'Sprache' : adminLang === 'fr' ? 'Langue' : adminLang === 'es' ? 'Idioma' : adminLang === 'nl' ? 'Taal' : adminLang === 'it' ? 'Lingua' : 'Language'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {adminLang === 'de' ? 'Admin-Oberfläche' : adminLang === 'fr' ? 'Interface admin' : 'Admin interface'}
                            </p>
                          </div>
                        </div>
                        <Select
                          value={adminLang}
                          onValueChange={(v) => handleAdminLanguageChange(v as Language)}
                          disabled={updatingLang}
                        >
                          <SelectTrigger className="w-[140px]">
                            {updatingLang ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent className="bg-card border border-border z-50">
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

                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">E-Mail ändern</p>
                            <p className="text-xs text-muted-foreground">Aktuelle E-Mail aktualisieren</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                          Ändern
                        </Button>
                      </div>

                      {/* Password */}
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Lock className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Passwort ändern</p>
                            <p className="text-xs text-muted-foreground">Neues Passwort setzen</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                          Ändern
                        </Button>
                      </div>

                      {/* Delete Account */}
                      <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-xl border border-destructive/30">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
                            <UserX className="h-5 w-5 text-destructive" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-destructive">Account löschen</p>
                            <p className="text-xs text-muted-foreground">DSGVO: Alle Daten werden gelöscht</p>
                          </div>
                        </div>
                        <Button variant="destructive" size="sm" disabled>
                          Löschen
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground text-center pt-2">
                        ⚠️ Diese Funktionen werden in einer zukünftigen Version aktiviert
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Subscription */}
                {accountSubTab === "subscription" && (
                  <Card className="border-2 border-primary/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Abo & Plan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Current Plan */}
                      <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/30">
                        <div className="flex items-center gap-3 mb-2">
                          <Crown className="h-6 w-6 text-primary" />
                          <div>
                            <p className="font-bold">Aktueller Plan</p>
                            <p className="text-sm text-muted-foreground">Kostenlos / Free</p>
                          </div>
                        </div>
                      </div>

                      {/* Upgrade */}
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Upgrade / Downgrade</p>
                            <p className="text-xs text-muted-foreground">Plan wechseln</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                          Pläne ansehen
                        </Button>
                      </div>

                      {/* Payment Method */}
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Zahlungsmethode</p>
                            <p className="text-xs text-muted-foreground">Kreditkarte oder PayPal verwalten</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                          Verwalten
                        </Button>
                      </div>

                      {/* Invoices */}
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Receipt className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Rechnungen</p>
                            <p className="text-xs text-muted-foreground">Invoices einsehen & herunterladen</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                          Anzeigen
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground text-center pt-2">
                        ⚠️ Stripe-Integration wird in einer zukünftigen Version aktiviert
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* System Tab - Admin Only */}
          {user?.role === 'admin' && (
            <TabsContent value="system" className="h-full overflow-y-auto m-0 pr-2">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* System Prompt Editor */}
                <SystemPromptSection language={adminLang} />
                
                {/* Consistency Check Statistics */}
                
                {/* User Management */}
                <UserManagementSection 
                  language={adminLang}
                  currentUserId={user.id}
                />
              </div>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default AdminPage;
