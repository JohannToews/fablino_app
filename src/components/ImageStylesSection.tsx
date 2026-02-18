import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Palette, Plus, Pencil, Save, Trash2, Upload, GripVertical, Loader2 } from "lucide-react";

interface ImageStyle {
  id: string;
  style_key: string;
  labels: Record<string, string>;
  description: Record<string, string>;
  imagen_prompt_snippet: string;
  age_groups: string[];
  default_for_ages: string[];
  age_modifiers: Record<string, string>;
  sort_order: number;
  is_active: boolean;
  preview_image_url: string | null;
  created_at: string;
  updated_at: string;
}

const ALL_AGE_GROUPS = ["6-7", "8-9", "10-11"];

const LANGUAGES = [
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "bs", label: "Bosanski", flag: "🇧🇦" },
];

const emptyStyle = (): Omit<ImageStyle, "id" | "created_at" | "updated_at"> => ({
  style_key: "",
  labels: { de: "", fr: "", en: "" },
  description: { de: "", en: "" },
  imagen_prompt_snippet: "",
  age_groups: ["6-7", "8-9", "10-11"],
  default_for_ages: [],
  age_modifiers: {},
  sort_order: 100,
  is_active: true,
  preview_image_url: null,
});

interface Props {
  language: string;
}

const ImageStylesSection = ({ language }: Props) => {
  const [styles, setStyles] = useState<ImageStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editStyle, setEditStyle] = useState<Partial<ImageStyle> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStyles = async () => {
    const { data, error } = await supabase
      .from("image_styles")
      .select("*")
      .order("sort_order");

    if (error) {
      toast.error("Fehler beim Laden der Bildstile");
      console.error(error);
    } else {
      setStyles((data || []).map(s => ({
        ...s,
        labels: (s.labels ?? {}) as Record<string, string>,
        description: (s.description ?? {}) as Record<string, string>,
        age_modifiers: (s.age_modifiers ?? {}) as Record<string, string>,
        age_groups: s.age_groups as string[],
        default_for_ages: (s.default_for_ages ?? []) as string[],
        is_active: s.is_active ?? true,
        sort_order: s.sort_order ?? 0,
        preview_image_url: s.preview_image_url ?? null,
        created_at: s.created_at ?? "",
        updated_at: s.updated_at ?? "",
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStyles();
  }, []);

  const handleToggleActive = async (style: ImageStyle) => {
    const { error } = await supabase
      .from("image_styles")
      .update({ is_active: !style.is_active })
      .eq("id", style.id);

    if (error) {
      toast.error("Fehler beim Aktualisieren");
    } else {
      setStyles(prev => prev.map(s => s.id === style.id ? { ...s, is_active: !s.is_active } : s));
    }
  };

  const handleEdit = (style: ImageStyle) => {
    setEditStyle({ ...style });
    setIsNew(false);
  };

  const handleCreate = () => {
    setEditStyle(emptyStyle());
    setIsNew(true);
  };

  const handleDelete = async (style: ImageStyle) => {
    if (!confirm(`Stil "${style.labels?.de || style.style_key}" wirklich löschen?`)) return;

    const { error } = await supabase
      .from("image_styles")
      .delete()
      .eq("id", style.id);

    if (error) {
      toast.error("Fehler beim Löschen");
    } else {
      toast.success("Stil gelöscht");
      setStyles(prev => prev.filter(s => s.id !== style.id));
    }
  };

  const handleSave = async () => {
    if (!editStyle) return;

    if (!editStyle.style_key?.trim()) {
      toast.error("Style Key ist erforderlich");
      return;
    }

    setSaving(true);

    const payload = {
      style_key: editStyle.style_key,
      labels: editStyle.labels || {},
      description: editStyle.description || {},
      imagen_prompt_snippet: editStyle.imagen_prompt_snippet || "",
      age_groups: editStyle.age_groups || [],
      default_for_ages: editStyle.default_for_ages || [],
      age_modifiers: editStyle.age_modifiers || {},
      sort_order: editStyle.sort_order ?? 100,
      is_active: editStyle.is_active ?? true,
      preview_image_url: editStyle.preview_image_url || null,
    };

    if (isNew) {
      const { data, error } = await supabase
        .from("image_styles")
        .insert(payload)
        .select()
        .single();

      if (error) {
        toast.error("Fehler beim Erstellen: " + error.message);
      } else {
        toast.success("Stil erstellt");
        const mapped = { ...data, labels: (data.labels ?? {}) as Record<string, string>, description: (data.description ?? {}) as Record<string, string>, age_modifiers: (data.age_modifiers ?? {}) as Record<string, string>, age_groups: data.age_groups as string[], default_for_ages: (data.default_for_ages ?? []) as string[] };
        setStyles(prev => [...prev, mapped].sort((a, b) => a.sort_order - b.sort_order));
        setEditStyle(null);
      }
    } else {
      const { error } = await supabase
        .from("image_styles")
        .update(payload)
        .eq("id", editStyle.id);

      if (error) {
        toast.error("Fehler beim Speichern: " + error.message);
      } else {
        toast.success("Stil gespeichert");
        setStyles(prev => prev.map(s => s.id === editStyle.id ? { ...s, ...payload } : s).sort((a, b) => a.sort_order - b.sort_order));
        setEditStyle(null);
      }
    }

    setSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editStyle) return;

    setUploading(true);
    const ext = file.name.split(".").pop() || "webp";
    const path = `style-previews/${editStyle.style_key || "new"}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("public")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Upload fehlgeschlagen: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("public").getPublicUrl(path);

    setEditStyle(prev => prev ? { ...prev, preview_image_url: urlData.publicUrl } : prev);
    toast.success("Bild hochgeladen");
    setUploading(false);
  };

  const updateLabel = (lang: string, value: string) => {
    setEditStyle(prev => prev ? {
      ...prev,
      labels: { ...(prev.labels || {}), [lang]: value },
    } : prev);
  };

  const updateDescription = (lang: string, value: string) => {
    setEditStyle(prev => prev ? {
      ...prev,
      description: { ...(prev.description || {}), [lang]: value },
    } : prev);
  };

  const updateAgeModifier = (ageGroup: string, value: string) => {
    setEditStyle(prev => prev ? {
      ...prev,
      age_modifiers: { ...(prev.age_modifiers || {}), [ageGroup]: value },
    } : prev);
  };

  const toggleAgeGroup = (ageGroup: string) => {
    setEditStyle(prev => {
      if (!prev) return prev;
      const current = prev.age_groups || [];
      const updated = current.includes(ageGroup)
        ? current.filter(g => g !== ageGroup)
        : [...current, ageGroup];
      return { ...prev, age_groups: updated };
    });
  };

  const toggleDefaultAge = (ageGroup: string) => {
    setEditStyle(prev => {
      if (!prev) return prev;
      const current = prev.default_for_ages || [];
      const updated = current.includes(ageGroup)
        ? current.filter(g => g !== ageGroup)
        : [...current, ageGroup];
      return { ...prev, default_for_ages: updated };
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Bildstile verwalten</CardTitle>
          </div>
          <Button size="sm" onClick={handleCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Neuer Stil
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {styles.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine Bildstile gefunden. Erstelle einen neuen Stil.
            </p>
          )}

          {styles.map((style) => (
            <div
              key={style.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                style.is_active ? "bg-white" : "bg-muted/40 opacity-60"
              }`}
            >
              {/* Preview */}
              <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden">
                {style.preview_image_url ? (
                  <img src={style.preview_image_url} alt="" className="h-12 w-12 object-cover rounded-lg" />
                ) : (
                  <Palette className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">
                    {style.labels?.[language] || style.labels?.de || style.style_key}
                  </p>
                  {style.default_for_ages?.length > 0 && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                      ★ Default {style.default_for_ages.join(", ")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  Alter: {style.age_groups?.join(", ") || "–"} · Key: {style.style_key}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={style.is_active}
                  onCheckedChange={() => handleToggleActive(style)}
                />
                <Button variant="ghost" size="icon" onClick={() => handleEdit(style)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(style)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Edit / Create Dialog */}
      <Dialog open={!!editStyle} onOpenChange={(open) => { if (!open) setEditStyle(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Neuen Bildstil erstellen" : "Bildstil bearbeiten"}</DialogTitle>
          </DialogHeader>

          {editStyle && (
            <div className="space-y-6 py-2">
              {/* Style Key */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Style Key (eindeutig)</Label>
                <Input
                  value={editStyle.style_key || ""}
                  onChange={(e) => setEditStyle(prev => prev ? { ...prev, style_key: e.target.value.replace(/[^a-z0-9_]/g, "") } : prev)}
                  placeholder="z.B. manga_anime"
                  disabled={!isNew}
                  className="font-mono text-sm"
                />
              </div>

              {/* Preview Image */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Vorschaubild</Label>
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
                    {editStyle.preview_image_url ? (
                      <img src={editStyle.preview_image_url} alt="" className="h-16 w-16 object-cover" />
                    ) : (
                      <Palette className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="gap-1.5"
                    >
                      {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      {uploading ? "Hochladen..." : "Bild hochladen"}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    {editStyle.preview_image_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive"
                        onClick={() => setEditStyle(prev => prev ? { ...prev, preview_image_url: null } : prev)}
                      >
                        Entfernen
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Labels (per language) */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Name (mehrsprachig)</Label>
                <div className="grid grid-cols-1 gap-2">
                  {LANGUAGES.map(lang => (
                    <div key={lang.code} className="flex items-center gap-2">
                      <span className="text-sm w-6 shrink-0">{lang.flag}</span>
                      <Input
                        value={(editStyle.labels as Record<string, string>)?.[lang.code] || ""}
                        onChange={(e) => updateLabel(lang.code, e.target.value)}
                        placeholder={`Name (${lang.label})`}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Descriptions (DE + EN are the most important) */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Beschreibung (mehrsprachig)</Label>
                <div className="grid grid-cols-1 gap-2">
                  {LANGUAGES.map(lang => (
                    <div key={lang.code} className="flex items-start gap-2">
                      <span className="text-sm w-6 shrink-0 mt-2">{lang.flag}</span>
                      <Input
                        value={(editStyle.description as Record<string, string>)?.[lang.code] || ""}
                        onChange={(e) => updateDescription(lang.code, e.target.value)}
                        placeholder={`Beschreibung (${lang.label})`}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Imagen Prompt Snippet */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Imagen Prompt Snippet (Englisch)
                </Label>
                <Textarea
                  value={editStyle.imagen_prompt_snippet || ""}
                  onChange={(e) => setEditStyle(prev => prev ? { ...prev, imagen_prompt_snippet: e.target.value } : prev)}
                  placeholder="Soft watercolor children's book illustration, rounded shapes..."
                  rows={4}
                  className="text-sm font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  Dieser Text wird dem Bildgenerator als Stil-Anweisung übergeben. Immer auf Englisch.
                </p>
              </div>

              {/* Age Groups */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Altersgruppen (sichtbar für)</Label>
                <div className="flex gap-4">
                  {ALL_AGE_GROUPS.map(ag => (
                    <label key={ag} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={editStyle.age_groups?.includes(ag) || false}
                        onCheckedChange={() => toggleAgeGroup(ag)}
                      />
                      <span className="text-sm">{ag} Jahre</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Default for Ages */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Default-Stil für Altersgruppen</Label>
                <div className="flex gap-4">
                  {ALL_AGE_GROUPS.map(ag => (
                    <label key={ag} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={editStyle.default_for_ages?.includes(ag) || false}
                        onCheckedChange={() => toggleDefaultAge(ag)}
                      />
                      <span className="text-sm">★ {ag}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Nur ein Stil sollte Default pro Altersgruppe sein.
                </p>
              </div>

              {/* Age Modifiers */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Alters-Modifikatoren (optional, Englisch)
                </Label>
                {ALL_AGE_GROUPS.map(ag => (
                  <div key={ag} className="flex items-start gap-2">
                    <span className="text-xs font-medium w-10 shrink-0 mt-2 text-muted-foreground">{ag}</span>
                    <Input
                      value={(editStyle.age_modifiers as Record<string, string>)?.[ag] || ""}
                      onChange={(e) => updateAgeModifier(ag, e.target.value)}
                      placeholder={`Modifier for age ${ag} (optional)`}
                      className="text-sm"
                    />
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground">
                  Feinjustierung des Prompts pro Altersgruppe, z.B. "extra simple backgrounds" für 6-7.
                </p>
              </div>

              {/* Sort Order + Active */}
              <div className="flex items-center gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sortierung</Label>
                  <Input
                    type="number"
                    value={editStyle.sort_order ?? 100}
                    onChange={(e) => setEditStyle(prev => prev ? { ...prev, sort_order: parseInt(e.target.value) || 0 } : prev)}
                    className="w-20 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Aktiv</Label>
                  <div className="pt-1">
                    <Switch
                      checked={editStyle.is_active ?? true}
                      onCheckedChange={(checked) => setEditStyle(prev => prev ? { ...prev, is_active: checked } : prev)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStyle(null)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isNew ? "Erstellen" : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageStylesSection;
