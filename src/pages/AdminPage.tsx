import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Image, Trash2, LogOut, User, Settings, Library, Star, TrendingUp, Wrench, Users, BookHeart, Mail, Lock, UserX, Loader2, Search, Filter, Check, Crown, Flag, RefreshCw } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PLANS, type PlanKey } from "@/config/plans";
import BackButton from "@/components/BackButton";
import { getThumbnailUrl } from "@/lib/imageUtils";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelper";
import PointsConfigSection from "@/components/PointsConfigSection";
import LevelConfigSection from "@/components/LevelConfigSection";
import KidProfileSection from "@/components/KidProfileSection";
import ParentSettingsPanel from "@/components/ParentSettingsPanel";
import UserManagementSection from "@/components/UserManagementSection";
import SystemPromptSection from "@/components/SystemPromptSection";
import AgeRulesSection from "@/components/AgeRulesSection";
import ImageStylesSection from "@/components/ImageStylesSection";
import { useAuth } from "@/hooks/useAuth";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useTranslations, Language } from "@/lib/translations";

interface Story {
  id: string;
  title: string;
  cover_image_url: string | null;
  kid_profile_id: string | null;
  is_favorite: boolean;
  created_at: string;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUserProfile } = useAuth();
  const { selectedProfileId, selectedProfile, kidProfiles, hasMultipleProfiles, setSelectedProfileId } = useKidProfile();
  const adminLang = (user?.adminLanguage || 'de') as Language;
  const t = useTranslations(adminLang);
  
  const [stories, setStories] = useState<Story[]>([]);
  const [storyStatuses, setStoryStatuses] = useState<Map<string, boolean>>(new Map());
  const [activeTab, setActiveTab] = useState("profile");
  const [settingsSubTab, setSettingsSubTab] = useState("points");
  const [accountSubTab, setAccountSubTab] = useState("management");
  const [updatingLang, setUpdatingLang] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "read" | "unread">("all");
  const [inspirationPromptsLoading, setInspirationPromptsLoading] = useState(false);
  const [inspirationPromptsResult, setInspirationPromptsResult] = useState<{ processed: number; errors: number; details?: string[] } | null>(null);
  const [inspirationPromptsList, setInspirationPromptsList] = useState<{ id: string; teaser: string; full_prompt: string; batch_date: string; active: boolean }[]>([]);
  const [inspirationPromptsListLoading, setInspirationPromptsListLoading] = useState(false);

  const languages: { value: Language; label: string; flag: string }[] = [
    { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'es', label: 'Español', flag: '🇪🇸' },
    { value: 'nl', label: 'Nederlands', flag: '🇳🇱' },
    { value: 'it', label: 'Italiano', flag: '🇮🇹' },
    { value: 'bs', label: 'Bosanski', flag: '🇧🇦' },
    { value: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { value: 'bg', label: 'Български', flag: '🇧🇬' },
    { value: 'ro', label: 'Română', flag: '🇷🇴' },
    { value: 'pl', label: 'Polski', flag: '🇵🇱' },
    { value: 'lt', label: 'Lietuvių', flag: '🇱🇹' },
    { value: 'hu', label: 'Magyar', flag: '🇭🇺' },
    { value: 'ca', label: 'Català', flag: '🏴' },
    { value: 'sl', label: 'Slovenščina', flag: '🇸🇮' },
    { value: 'pt', label: 'Português', flag: '🇵🇹' },
    { value: 'sk', label: 'Slovenčina', flag: '🇸🇰' },
    { value: 'uk', label: 'Українська', flag: '🇺🇦' },
    { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  ];

  const handleAdminLanguageChange = async (newLang: Language) => {
    if (!user) return;
    setUpdatingLang(true);
    try {
      // Try refreshing the Supabase session first
      await supabase.auth.refreshSession();
      
      // Method 1: Try edge function (works for legacy + supabase auth)
      let success = false;
      try {
        const { error } = await invokeEdgeFunction("manage-users", {
          action: "updateLanguages",
          userId: user.id,
          adminLanguage: newLang,
        });
        if (!error) success = true;
        else console.warn("Edge function failed, trying direct DB:", error);
      } catch (e) {
        console.warn("Edge function error, trying direct DB:", e);
      }

      // Method 2: Fallback to direct DB update (works for supabase auth with valid session)
      if (!success) {
        const { error: dbError } = await supabase
          .from('user_profiles')
          .update({ admin_language: newLang, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        if (dbError) throw dbError;
      }

      await refreshUserProfile();
      toast.success(t.adminLangUpdated);
    } catch (error) {
      console.error("Error updating language:", error);
      toast.error(t.adminLangUpdateError);
    }
    setUpdatingLang(false);
  };

  useEffect(() => {
    if (user) {
      loadStories();
    }
  }, [user, selectedProfileId]);

  useEffect(() => {
    if (activeTab === "system" && user?.role === "admin") {
      loadInspirationPrompts();
    }
  }, [activeTab, user?.role, adminLang]);

  const loadStories = async () => {
    if (!user) return;
    
    try {
      const [storiesResult, resultsResult] = await Promise.all([
        supabase
          .rpc("get_my_stories", {
            p_profile_id: selectedProfileId || null,
            p_limit: 500,
            p_offset: 0,
          })
          .select("id, title, cover_image_url, kid_profile_id, is_favorite, created_at"),
        supabase.rpc("get_my_results"),
      ]);
      
      if (storiesResult.error) {
        console.error("[AdminPage] loadStories error:", storiesResult.error);
        return;
      }
      
      const storiesData = storiesResult.data || [];
      setStories(storiesData);
      
      // Build read-status map
      const storyIdSet = new Set(storiesData.map((s: any) => s.id));
      const statusMap = new Map<string, boolean>();
      resultsResult.data?.forEach((r: any) => {
        if (r.reference_id && storyIdSet.has(r.reference_id)) {
          statusMap.set(r.reference_id, true);
        }
      });
      setStoryStatuses(statusMap);
    } catch (err) {
      console.error("[AdminPage] loadStories crash:", err);
    }
  };

  const toggleFavorite = async (storyId: string, currentValue: boolean) => {
    const { error } = await supabase
      .from("stories")
      .update({ is_favorite: !currentValue })
      .eq("id", storyId);
    
    if (error) {
      toast.error(t.adminFavSaveError);
    } else {
      setStories(prev => prev.map(s => s.id === storyId ? { ...s, is_favorite: !currentValue } : s));
    }
  };

  const filteredStories = useMemo(() => {
    return stories.filter(s => {
      // Text filter
      if (searchFilter && !s.title.toLowerCase().includes(searchFilter.toLowerCase())) return false;
      // Status filter
      if (statusFilter === "read" && !storyStatuses.get(s.id)) return false;
      if (statusFilter === "unread" && storyStatuses.get(s.id)) return false;
      return true;
    });
  }, [stories, searchFilter, statusFilter, storyStatuses]);

  const updateStoryKidProfile = async (storyId: string, kidProfileId: string | null) => {
    const { error } = await supabase
      .from("stories")
      .update({ kid_profile_id: kidProfileId })
      .eq("id", storyId);
    
    if (error) {
      toast.error(t.adminAssignFailed);
    } else {
      toast.success(t.adminChildAssigned);
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

  const loadInspirationPrompts = async () => {
    if (user?.role !== "admin" || !adminLang) return;
    setInspirationPromptsListLoading(true);
    try {
      const { data, error } = await invokeEdgeFunction("get-inspiration-prompts", { language: adminLang });
      if (error) {
        setInspirationPromptsList([]);
      } else {
        setInspirationPromptsList(Array.isArray(data) ? data : []);
      }
    } catch {
      setInspirationPromptsList([]);
    }
    setInspirationPromptsListLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen flex flex-col bg-[#FFF8F0] overflow-hidden">
      {/* Orange-branded Header */}
      <header className="flex-none flex items-center justify-between px-4 py-3 border-b border-orange-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <BackButton to="/" />
          <div className="flex items-center gap-2">
            <img src="/mascot/6_Onboarding.png" alt="" className="h-8 w-8 object-contain" />
            <h1 className="text-xl font-baloo font-bold text-[#2D1810]">
              {t.adminArea}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Language switch in header */}
          <Select
            value={adminLang}
            onValueChange={(v) => handleAdminLanguageChange(v as Language)}
            disabled={updatingLang}
          >
            <SelectTrigger className="w-[52px] h-9 border-orange-200 bg-white px-2">
              {updatingLang ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="text-base">{languages.find(l => l.value === adminLang)?.flag || '🌐'}</span>
              )}
            </SelectTrigger>
            <SelectContent className="bg-white border border-orange-100 z-50">
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span className="text-sm">{lang.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2 text-[#2D1810]/60 hover:text-[#2D1810] hover:bg-orange-50"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Tab Navigation - Orange Theme */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="flex-none flex mx-4 mt-3 h-12 bg-orange-50 rounded-xl overflow-x-auto scrollbar-hide gap-0.5 p-1">
          <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white text-orange-600 rounded-lg whitespace-nowrap px-2.5 sm:px-3 min-h-[36px]">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{t.kidProfile}</span>
          </TabsTrigger>
          <TabsTrigger value="parenting" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white text-orange-600 rounded-lg whitespace-nowrap px-2.5 sm:px-3 min-h-[36px]">
            <BookHeart className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{t.parentSettingsTab}</span>
          </TabsTrigger>
          <TabsTrigger value="stories" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white text-orange-600 rounded-lg whitespace-nowrap px-2.5 sm:px-3 min-h-[36px]">
            <Library className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{t.library}</span>
          </TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="settings" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white text-orange-600 rounded-lg whitespace-nowrap px-2.5 sm:px-3 min-h-[36px]">
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{t.settings}</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="account" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white text-orange-600 rounded-lg whitespace-nowrap px-2.5 sm:px-3 min-h-[36px]">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{t.account}</span>
          </TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="system" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white text-orange-600 rounded-lg whitespace-nowrap px-2.5 sm:px-3 min-h-[36px]">
              <Wrench className="h-4 w-4 flex-shrink-0" />
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

          {/* Parenting / Education Tab - All Users */}
          <TabsContent value="parenting" className="h-full overflow-y-auto m-0 pr-2">
            <div className="max-w-3xl mx-auto">
              <ParentSettingsPanel language={adminLang} />
            </div>
          </TabsContent>

          {/* Stories Tab */}
          <TabsContent value="stories" className="h-full overflow-hidden m-0">
            <div className="h-full flex flex-col max-w-4xl mx-auto">
              {/* Kid Profile Selector - Always show if profiles exist */}
              {kidProfiles.length > 0 && (
                <div className="flex-none mb-4 flex items-center justify-center gap-2 bg-card/60 backdrop-blur-sm rounded-xl p-3">
                  <span className="text-sm text-muted-foreground mr-2">
                    {t.adminStoryFor}
                  </span>
                  {kidProfiles.length === 1 ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500 text-white">
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
                        <SelectValue placeholder={t.adminSelectChild}>
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
              
              {/* Filter Bar */}
              <div className="flex-none mb-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t.adminSearchStories}
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-9 h-10 rounded-xl bg-card"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger className="w-[180px] h-10 rounded-xl bg-card">
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.adminFilterAll}</SelectItem>
                    <SelectItem value="read">{t.statusAlreadyRead}</SelectItem>
                    <SelectItem value="unread">{t.statusToRead}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Library Content */}
              <div className="flex-1 overflow-y-auto pr-2">
                {filteredStories.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-base">
                      {stories.length === 0 ? t.noStoriesYet : t.adminNoMatches}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {filteredStories.map((story) => {
                      const assignedKid = kidProfiles.find(p => p.id === story.kid_profile_id);
                      const isRead = storyStatuses.get(story.id);
                      return (
                        <div
                          key={story.id}
                          className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border/50 shadow-sm"
                        >
                          {/* Cover */}
                          {story.cover_image_url ? (
                            <img
                              src={getThumbnailUrl(story.cover_image_url, 112, 50)}
                              alt={story.title}
                              loading="lazy"
                              className="h-16 w-16 object-cover rounded-xl flex-none"
                            />
                          ) : (
                            <div className="h-16 w-16 bg-muted rounded-xl flex items-center justify-center flex-none">
                              <Image className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          {/* Info */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <h3 className="font-baloo font-bold text-base truncate">{story.title}</h3>
                            <div className="flex items-center gap-3 flex-wrap">
                              <Select
                                value={story.kid_profile_id || "none"}
                                onValueChange={(value) => updateStoryKidProfile(story.id, value === "none" ? null : value)}
                              >
                                <SelectTrigger className="h-7 text-xs w-[140px]">
                                  <SelectValue>
                                    {assignedKid ? (
                                      <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {assignedKid.name}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        {t.adminAssignChild}
                                      </span>
                                    )}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">
                                    {t.adminNoChild}
                                  </SelectItem>
                                  {kidProfiles.map((profile) => (
                                    <SelectItem key={profile.id} value={profile.id}>
                                      {profile.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {/* Read status badge */}
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                isRead
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                                {isRead ? t.statusCompleted : t.statusToRead}
                              </span>
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-none">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleFavorite(story.id, story.is_favorite)}
                              className="h-9 w-9"
                            >
                              <Star className={`h-5 w-5 ${story.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteStory(story.id)}
                              className="text-destructive hover:bg-destructive/10 h-9 w-9"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                  {t.adminPoints}
                </Button>
                <Button
                  variant={settingsSubTab === "levels" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettingsSubTab("levels")}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  {t.adminLevels}
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

          {/* Account Tab — Accordions: Konto-Verwaltung + Abo & Plan */}
          <TabsContent value="account" className="h-full overflow-y-auto m-0 pr-2">
            <div className="max-w-3xl mx-auto">
              <Accordion type="multiple" defaultValue={[]} className="space-y-3">

                {/* Akkordeon 1: Konto-Verwaltung */}
                <AccordionItem value="account-management" className="border border-orange-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-orange-50/50">
                    <div className="flex items-center gap-2 text-left">
                      <span className="text-lg">👤</span>
                      <p className="font-semibold text-[#2D1810]">{t.accountManagement}</p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <div className="space-y-3">
                      {/* Email */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-orange-50/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-[#2D1810]">{t.changeEmail}</p>
                            <p className="text-xs text-[#2D1810]/50">{t.changeEmailSub}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" disabled className="border-orange-200">
                          {t.edit}
                        </Button>
                      </div>

                      {/* Password */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-orange-50/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <Lock className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-[#2D1810]">{t.changePassword}</p>
                            <p className="text-xs text-[#2D1810]/50">{t.changePasswordSub}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" disabled className="border-orange-200">
                          {t.edit}
                        </Button>
                      </div>

                      {/* Delete Account */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-red-50/50 rounded-xl border border-red-200/50">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <UserX className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-red-700">{t.deleteAccount}</p>
                            <p className="text-xs text-[#2D1810]/50">{t.deleteAccountSub}</p>
                          </div>
                        </div>
                        <Button variant="destructive" size="sm" disabled>
                          {t.delete}
                        </Button>
                      </div>

                      <p className="text-xs text-[#2D1810]/40 text-center pt-2">
                        ⚠️ {t.comingSoon}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Akkordeon 2: Abo & Plan */}
                <AccordionItem value="subscription" className="border border-orange-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-orange-50/50">
                    <div className="flex items-center gap-2 text-left">
                      <span className="text-lg">⭐</span>
                      <p className="font-semibold text-[#2D1810]">{t.subscriptionTitle}</p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <div className="space-y-4">
                      {/* Current plan highlight */}
                      <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                        <p className="text-xs text-[#2D1810]/50 mb-1">{t.currentPlan}</p>
                        <p className="font-bold text-[#2D1810] text-lg flex items-center gap-2">
                          🦊 STARTER <span className="text-sm font-normal text-[#2D1810]/50">({t.freePlan})</span>
                        </p>
                        <div className="mt-2 space-y-1 text-xs text-[#2D1810]/60">
                          <p>• {PLANS.starter.stories_per_month} {t.storiesPerMonth}</p>
                          <p>• {PLANS.starter.child_profiles} {t.childProfiles}</p>
                          <p>• {PLANS.starter.images_per_story} {t.imagesPerStory}</p>
                        </div>
                      </div>

                      {/* Upgrade CTA */}
                      <Button
                        onClick={() => toast.info(t.betaUpgradeToast)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl h-11"
                      >
                        {t.upgradeButton} — {PLANS.standard.price_monthly}€{t.perMonth}
                      </Button>

                      {/* Plan comparison */}
                      <div>
                        <p className="text-sm font-semibold text-[#2D1810] mb-3">{t.availablePlans}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {(Object.keys(PLANS) as PlanKey[]).map((planKey) => {
                            const plan = PLANS[planKey];
                            const isStarter = planKey === 'starter';
                            const isMostPopular = 'most_popular' in plan && (plan as any).most_popular;

                            return (
                              <div
                                key={planKey}
                                className={`relative p-3 rounded-xl border-2 text-center ${
                                  isStarter
                                    ? 'border-orange-400 bg-orange-50'
                                    : isMostPopular
                                    ? 'border-orange-300 bg-white'
                                    : 'border-orange-100 bg-white'
                                }`}
                              >
                                {isMostPopular && (
                                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-orange-500 text-white text-[10px] border-0 px-2 py-0.5">
                                      {t.mostPopular}
                                    </Badge>
                                  </div>
                                )}
                                <p className="font-bold text-sm text-[#2D1810] mt-1">{plan.name[adminLang] || plan.name.de}</p>
                                <p className="text-lg font-bold text-orange-600 mt-1">
                                  {plan.price_monthly}€
                                  <span className="text-[10px] font-normal text-[#2D1810]/40">{t.perMonth}</span>
                                </p>
                                <div className="mt-2 space-y-1 text-[11px] text-[#2D1810]/60 text-left">
                                  <p className="flex items-center gap-1">
                                    <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                                    {plan.stories_per_month} {t.storiesPerMonth}
                                  </p>
                                  <p className="flex items-center gap-1">
                                    <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                                    {plan.child_profiles} {t.childProfiles}
                                  </p>
                                  <p className="flex items-center gap-1">
                                    <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                                    {plan.images_per_story} {t.imagesPerStory}
                                  </p>
                                  {plan.learning_themes && (
                                    <p className="flex items-center gap-1">
                                      <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                                      {t.learningThemesFeature}
                                    </p>
                                  )}
                                  {plan.chapter_stories && (
                                    <p className="flex items-center gap-1">
                                      <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                                      {t.chapterStories}
                                    </p>
                                  )}
                                  {plan.co_create && (
                                    <p className="flex items-center gap-1">
                                      <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                                      {t.coCreate}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  onClick={() => !isStarter && toast.info(t.betaUpgradeToast)}
                                  variant={isStarter ? "outline" : "default"}
                                  size="sm"
                                  disabled={isStarter}
                                  className={`w-full mt-3 text-xs ${
                                    isStarter
                                      ? 'border-orange-200 text-orange-600'
                                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                                  }`}
                                >
                                  {isStarter ? t.activePlan : t.selectPlan}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Invoices */}
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-sm font-medium text-[#2D1810]/60">{t.invoices}</p>
                        <p className="text-xs text-[#2D1810]/40 mt-1">{t.noInvoices}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* System Tab - Admin Only */}
          {user?.role === 'admin' && (
            <TabsContent value="system" className="h-full overflow-y-auto m-0 pr-2">
              <div className="max-w-4xl mx-auto">
                <Accordion type="multiple" defaultValue={[]} className="space-y-4">
                  {/* Image Generation Config Link */}
                  <AccordionItem value="image-gen-config" className="border rounded-lg bg-card shadow-sm">
                    <AccordionTrigger className="px-4">
                      <div className="flex items-center gap-2">
                        <Image className="h-5 w-5 text-orange-500" />
                        <span className="font-semibold text-sm">{t.adminImageGenConfig}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <p className="text-xs text-muted-foreground mb-3">{t.adminImageGenConfigDesc}</p>
                      <Button size="sm" variant="outline" onClick={() => navigate('/admin/config')}>Konfiguration öffnen</Button>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Image Styles Management */}
                  <AccordionItem value="image-styles" className="border rounded-lg bg-card shadow-sm">
                    <AccordionTrigger className="px-4">
                      <div className="flex items-center gap-2">
                        <Image className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-sm">Bildstile verwalten</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <ImageStylesSection language={adminLang} />
                    </AccordionContent>
                  </AccordionItem>

                  {/* System Prompt Editor */}
                  <AccordionItem value="system-prompt" className="border rounded-lg bg-card shadow-sm">
                    <AccordionTrigger className="px-4">
                      <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-orange-500" />
                        <span className="font-semibold text-sm">System Prompt</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <SystemPromptSection language={adminLang} />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Age Rules Editor */}
                  <AccordionItem value="age-rules" className="border rounded-lg bg-card shadow-sm">
                    <AccordionTrigger className="px-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-orange-500" />
                        <span className="font-semibold text-sm">Altersregeln</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <AgeRulesSection language={adminLang} />
                    </AccordionContent>
                  </AccordionItem>

                  {/* User Management */}
                  <AccordionItem value="user-mgmt" className="border rounded-lg bg-card shadow-sm">
                    <AccordionTrigger className="px-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-orange-500" />
                        <span className="font-semibold text-sm">Benutzerverwaltung</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <UserManagementSection 
                        language={adminLang}
                        currentUserId={user.id}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Feature Flags */}
                  <AccordionItem value="feature-flags" className="border rounded-lg bg-card shadow-sm">
                    <AccordionTrigger className="px-4">
                      <div className="flex items-center gap-2">
                        <Flag className="h-5 w-5 text-orange-500" />
                        <span className="font-semibold text-sm">Feature Flags</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <p className="text-xs text-muted-foreground mb-3">Features wie Emotion-Flow und Comic-Strip pro User oder global aktivieren.</p>
                      <Button size="sm" variant="outline" onClick={() => navigate('/admin/feature-flags')}>Feature Flags öffnen</Button>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Inspiration Prompts — after Feature Flags, collapsed by default */}
                  <AccordionItem value="inspiration-prompts" className="border rounded-lg bg-card shadow-sm">
                    <AccordionTrigger className="px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-orange-500">✨</span>
                        <span className="font-semibold text-sm">Inspiration Prompts</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <p className="text-xs text-muted-foreground mb-3">
                        Generates anonymized & translated inspiration prompts from the latest 5-star stories. Results appear in the table below after generation.
                      </p>
                      <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        disabled={inspirationPromptsLoading}
                        onClick={async () => {
                          setInspirationPromptsResult(null);
                          setInspirationPromptsLoading(true);
                          try {
                            const { data, error } = await invokeEdgeFunction("generate-inspiration-prompts", {});
                            if (error) {
                              setInspirationPromptsResult({ processed: 0, errors: 1, details: [error.message || "Unknown error"] });
                              toast.error("Generate inspiration prompts failed");
                            } else {
                              const result = data as { processed?: number; errors?: number; details?: string[] } | null;
                              const processed = result?.processed ?? 0;
                              const errCount = result?.errors ?? 0;
                              setInspirationPromptsResult({
                                processed,
                                errors: errCount,
                                details: result?.details,
                              });
                              toast.success(`✅ ${processed} prompts processed, ${errCount} errors`);
                              loadInspirationPrompts();
                            }
                          } catch (e) {
                            const msg = e instanceof Error ? e.message : String(e);
                            setInspirationPromptsResult({ processed: 0, errors: 1, details: [msg] });
                            toast.error("Generate inspiration prompts failed");
                          }
                          setInspirationPromptsLoading(false);
                        }}
                      >
                        {inspirationPromptsLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        🔄 Generate Inspiration Prompts
                      </Button>
                      {inspirationPromptsResult != null && (
                        <div className="mt-3 text-sm text-muted-foreground">
                          <p>{inspirationPromptsResult.processed} prompts processed, {inspirationPromptsResult.errors} errors.</p>
                          {inspirationPromptsResult.details && inspirationPromptsResult.details.length > 0 && (
                            <ul className="mt-1 list-disc list-inside text-xs">
                              {inspirationPromptsResult.details.slice(0, 5).map((d, i) => (
                                <li key={i}>{d}</li>
                              ))}
                              {inspirationPromptsResult.details.length > 5 && (
                                <li>… and {inspirationPromptsResult.details.length - 5} more</li>
                              )}
                            </ul>
                          )}
                        </div>
                      )}
                      <div className="mt-4">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          {inspirationPromptsListLoading ? "Loading…" : `${inspirationPromptsList.filter((p) => p.active).length} active prompts`}
                        </p>
                        {inspirationPromptsListLoading ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                          </div>
                        ) : inspirationPromptsList.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2">No inspiration prompts for this language yet.</p>
                        ) : (
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-muted/50 border-b">
                                  <th className="text-left p-2 font-medium">Teaser</th>
                                  <th className="text-left p-2 font-medium">Full prompt</th>
                                  <th className="text-left p-2 font-medium">Batch date</th>
                                  <th className="text-left p-2 font-medium w-20">Active</th>
                                </tr>
                              </thead>
                              <tbody>
                                {inspirationPromptsList.map((row) => (
                                  <tr key={row.id} className="border-b last:border-0">
                                    <td className="p-2 max-w-[140px] truncate" title={row.teaser}>{row.teaser}</td>
                                    <td className="p-2 max-w-[240px] truncate" title={row.full_prompt}>{row.full_prompt}</td>
                                    <td className="p-2 whitespace-nowrap">{row.batch_date}</td>
                                    <td className="p-2">
                                      <Switch
                                        checked={row.active}
                                        onCheckedChange={async (checked) => {
                                          const { error: err } = await invokeEdgeFunction("manage-users", {
                                            action: "setInspirationPromptActive",
                                            id: row.id,
                                            active: checked,
                                          });
                                          if (err) toast.error(err.message || "Update failed");
                                          else loadInspirationPrompts();
                                        }}
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default AdminPage;
