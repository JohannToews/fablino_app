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

type FeatureKey =
  | "emotion_flow_enabled_users"
  | "comic_strip_enabled_users"
  | "premium_ui_enabled_users"
  | "farsi_enabled_users"
  | "avatar_builder_enabled_users"
  | "visual_director_enabled_users"
  | "avatar_v2_enabled_users"
  | "story_generator_model";

const FEATURES_CONFIG: { key: FeatureKey; label: string; globalLabel: string; description?: string }[] = [
  { key: "emotion_flow_enabled_users", label: "Emotion-Flow", globalLabel: "Emotion-Flow für ALLE" },
  { key: "comic_strip_enabled_users", label: "Comic-Strip", globalLabel: "Comic-Strip für ALLE" },
  { key: "premium_ui_enabled_users", label: "Premium UI", globalLabel: "Premium UI für ALLE" },
  { key: "farsi_enabled_users", label: "Farsi (فارسی)", globalLabel: "Farsi für ALLE" },
  { key: "avatar_builder_enabled_users", label: "Avatar Builder", globalLabel: "Avatar Builder für ALLE" },
  { key: "visual_director_enabled_users", label: "Visual Director", globalLabel: "Visual Director für ALLE" },
  { key: "avatar_v2_enabled_users", label: "Avatar v2", globalLabel: "Avatar v2 für ALLE" },
  { key: "story_generator_model", label: "Sonnet 4.6", globalLabel: "Sonnet 4.6 für ALLE", description: "Claude Sonnet 4.6 statt Gemini für Story-Text" },
];

// These flags are global-only (no per-user column in the grid)
const GLOBAL_ONLY_KEYS: FeatureKey[] = [
  "premium_ui_enabled_users",
  "avatar_builder_enabled_users",
  "visual_director_enabled_users",
];

const PER_USER_FEATURES = FEATURES_CONFIG.filter((f) => !GLOBAL_ONLY_KEYS.includes(f.key));

const ALL_SETTING_KEYS = FEATURES_CONFIG.map((f) => f.key);

const FeatureFlagsPage = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [flags, setFlags] = useState<Record<FeatureKey, string[]>>(() => {
    const init: any = {};
    for (const k of ALL_SETTING_KEYS) init[k] = [];
    return init;
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
        (supabase as any).from("app_settings").select("key, value").in("key", ALL_SETTING_KEYS),
        (supabase as any).from("user_profiles").select("id, display_name, email, username").order("display_name"),
      ]);

      if (settingsRes.data) {
        const parsed: Record<string, string[]> = {};
        for (const row of settingsRes.data) {
          try {
            const val = JSON.parse(row.value);
            if (row.key === "story_generator_model") {
              // Convert from object format {"userId": "sonnet"} to array format
              if (typeof val === "object" && !Array.isArray(val) && val !== null) {
                if (val["*"]) {
                  parsed[row.key] = ["*"];
                } else {
                  parsed[row.key] = Object.keys(val).filter((k) => val[k] === "sonnet");
                }
              } else if (Array.isArray(val)) {
                parsed[row.key] = val;
              } else {
                parsed[row.key] = [];
              }
            } else {
              parsed[row.key] = Array.isArray(val) ? val : [];
            }
          } catch {
            parsed[row.key] = [];
          }
        }
        const newFlags: any = {};
        for (const k of ALL_SETTING_KEYS) newFlags[k] = parsed[k] || [];
        setFlags(newFlags);
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

    // For story_generator_model, convert array back to object format for edge function compatibility
    let dbValue: string;
    if (key === "story_generator_model") {
      if (value.includes("*")) {
        dbValue = JSON.stringify({ "*": "sonnet" });
      } else {
        const obj: Record<string, string> = {};
        for (const uid of value) obj[uid] = "sonnet";
        dbValue = JSON.stringify(obj);
      }
    } else {
      dbValue = JSON.stringify(value);
    }

    const { error } = await (supabase as any)
      .from("app_settings")
      .upsert(
        { key, value: dbValue, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (error) {
      toast.error("Fehler beim Speichern: " + error.message);
      loadData();
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

  // Count enabled users per feature (for badges)
  const enabledCount = (key: FeatureKey) => {
    if (isGlobal(key)) return users.length;
    return flags[key].length;
  };

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

  const globalOnlyFeatures = FEATURES_CONFIG.filter((f) => GLOBAL_ONLY_KEYS.includes(f.key));
  const perUserFeatures = PER_USER_FEATURES;

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

      <div className="max-w-4xl mx-auto p-4 space-y-6 pb-24">
        {/* Global-Only Toggles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🌐 Globale Features</CardTitle>
            <CardDescription>Diese Features können nur global aktiviert werden.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {globalOnlyFeatures.map((feat) => (
                <div
                  key={feat.key}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <Label className="text-sm font-medium">{feat.label}</Label>
                    {feat.description && (
                      <p className="text-xs text-muted-foreground">{feat.description}</p>
                    )}
                  </div>
                  <Switch checked={isGlobal(feat.key)} onCheckedChange={() => toggleGlobal(feat.key)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Per-User Global Overrides */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">⚡ Pro-User Features — Globaler Override</CardTitle>
            <CardDescription>Aktiviert das Feature für ALLE User gleichzeitig.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {perUserFeatures.map((feat) => {
                const count = enabledCount(feat.key);
                const global = isGlobal(feat.key);
                return (
                  <div
                    key={feat.key}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                      global ? "bg-primary/10 border border-primary/20" : "bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <Label className="text-sm font-medium">{feat.label}</Label>
                        {feat.description && (
                          <p className="text-xs text-muted-foreground">{feat.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {global ? "alle" : `${count} User`}
                      </span>
                    </div>
                    <Switch checked={global} onCheckedChange={() => toggleGlobal(feat.key)} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Per-User Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">👤 Pro-User Aktivierung</CardTitle>
            <CardDescription>Einzelne User hinzufügen/entfernen.</CardDescription>
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

            {/* Table Header */}
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid gap-2 text-xs font-medium text-muted-foreground px-1 py-2 border-b"
                  style={{ gridTemplateColumns: `1fr repeat(${perUserFeatures.length}, 72px)` }}
                >
                  <span>Name / Email</span>
                  {perUserFeatures.map((f) => (
                    <span key={f.key} className="text-center leading-tight">{f.label}</span>
                  ))}
                </div>

                <div className="space-y-0 max-h-[60vh] overflow-y-auto">
                  {filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      className="grid gap-2 items-center py-2 px-1 rounded hover:bg-muted/40 transition-colors border-b border-border/30 last:border-0"
                      style={{ gridTemplateColumns: `1fr repeat(${perUserFeatures.length}, 72px)` }}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.display_name || u.username}</p>
                        {u.email && <p className="text-xs text-muted-foreground truncate">{u.email}</p>}
                      </div>
                      {perUserFeatures.map((feat) => (
                        <div key={feat.key} className="flex justify-center">
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
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FeatureFlagsPage;
