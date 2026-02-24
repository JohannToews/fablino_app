import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Flag, ShieldCheck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";

interface UserRow {
  id: string;
  display_name: string;
  email: string | null;
  username: string;
}

type FeatureKey = "emotion_flow_enabled_users" | "comic_strip_enabled_users" | "premium_ui_enabled_users";

const FEATURES_CONFIG: { key: FeatureKey; label: string; globalLabel: string }[] = [
  { key: "emotion_flow_enabled_users", label: "Emotion-Flow", globalLabel: "Emotion-Flow für ALLE aktivieren" },
  { key: "comic_strip_enabled_users", label: "Comic-Strip", globalLabel: "Comic-Strip für ALLE aktivieren" },
  { key: "premium_ui_enabled_users", label: "Premium UI", globalLabel: "Premium UI für ALLE aktivieren" },
];

const FeatureFlagsPage = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [flags, setFlags] = useState<Record<FeatureKey, string[]>>({
    emotion_flow_enabled_users: [],
    comic_strip_enabled_users: [],
    premium_ui_enabled_users: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, usersRes] = await Promise.all([
        (supabase as any).from("app_settings").select("key, value").in("key", [
          "emotion_flow_enabled_users",
          "comic_strip_enabled_users",
          "premium_ui_enabled_users",
        ]),
        (supabase as any).from("user_profiles").select("id, display_name, email, username").order("display_name"),
      ]);

      if (settingsRes.data) {
        const parsed: Record<string, string[]> = {};
        for (const row of settingsRes.data) {
          try {
            parsed[row.key] = JSON.parse(row.value);
          } catch {
            parsed[row.key] = [];
          }
        }
        setFlags({
          emotion_flow_enabled_users: parsed.emotion_flow_enabled_users || [],
          comic_strip_enabled_users: parsed.comic_strip_enabled_users || [],
          premium_ui_enabled_users: parsed.premium_ui_enabled_users || [],
        });
      }

      if (usersRes.data) {
        setUsers(usersRes.data as UserRow[]);
      }
    } catch (err) {
      console.error("[FeatureFlags] Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const isGlobal = (key: FeatureKey) => flags[key].includes("*");
  const isUserEnabled = (key: FeatureKey, userId: string) => isGlobal(key) || flags[key].includes(userId);

  const saveFlag = async (key: FeatureKey, value: string[]) => {
    const newFlags = { ...flags, [key]: value };
    setFlags(newFlags);

    const { error } = await (supabase as any)
      .from("app_settings")
      .update({ value: JSON.stringify(value), updated_at: new Date().toISOString() })
      .eq("key", key);

    if (error) {
      toast.error("Fehler beim Speichern: " + error.message);
      loadData(); // revert
    }
  };

  const toggleGlobal = (key: FeatureKey) => {
    if (isGlobal(key)) {
      saveFlag(key, []);
    } else {
      saveFlag(key, ["*"]);
    }
  };

  const toggleUser = (key: FeatureKey, userId: string) => {
    if (isGlobal(key)) return;
    const current = flags[key];
    if (current.includes(userId)) {
      saveFlag(key, current.filter((id) => id !== userId));
    } else {
      saveFlag(key, [...current, userId]);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.display_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q)
    );
  }, [users, search]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <ShieldCheck className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Zugriff verweigert</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <BackButton to="/admin" />
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Feature Flags
          </h1>
          <p className="text-xs text-muted-foreground">Features pro User oder global aktivieren</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        {/* Global Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Globale Aktivierung</CardTitle>
            <CardDescription>Aktiviert das Feature für alle Benutzer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {FEATURES_CONFIG.map((feat) => (
              <div key={feat.key} className="flex items-center justify-between">
                <Label className="text-sm font-medium">{feat.globalLabel}</Label>
                <Switch checked={isGlobal(feat.key)} onCheckedChange={() => toggleGlobal(feat.key)} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* User Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pro-User Aktivierung</CardTitle>
            <CardDescription>Einzelne User hinzufügen/entfernen. Bei globaler Aktivierung sind alle aktiv.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="User suchen…"
                className="pl-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Separator />

            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
              <span>Name / Email</span>
              {FEATURES_CONFIG.map((f) => (
                <span key={f.key} className="w-20 text-center">{f.label}</span>
              ))}
            </div>

            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {filteredUsers.map((u) => (
                <div key={u.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center py-1.5 px-1 rounded hover:bg-muted/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.display_name || u.username}</p>
                    {u.email && <p className="text-xs text-muted-foreground truncate">{u.email}</p>}
                  </div>
                  {FEATURES_CONFIG.map((feat) => (
                    <div key={feat.key} className="w-20 flex justify-center">
                      <Switch
                        checked={isUserEnabled(feat.key, u.id)}
                        disabled={isGlobal(feat.key)}
                        onCheckedChange={() => toggleUser(feat.key, u.id)}
                      />
                    </div>
                  ))}
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Keine User gefunden</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FeatureFlagsPage;
