import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import FablinoPageHeader from "@/components/FablinoPageHeader";
import AppearanceSlotPicker from "@/components/appearance/AppearanceSlotPicker";
import { useKidProfile } from "@/hooks/useKidProfile";
import { getTranslations, Language } from "@/lib/translations";
import { APPEARANCE_SLOTS, CURRENT_PHASE, type AppearanceData } from "@/config/appearanceSlots";
import { toast } from "sonner";
import { motion } from "framer-motion";

/** Maps v2 slot keys to legacy kid_appearance column names */
const LEGACY_COLUMN_MAP: Record<string, string> = {
  skin_tone: 'skin_tone',
  eye_color: 'eye_color',
  glasses: 'glasses',
  hair_color: 'hair_color',
  hair_type: 'hair_type',
  hair_length: 'hair_length',
  hair_style: 'hair_style',
  body_type: 'body_type',
};

export default function MyLookPageV2() {
  const { selectedProfile, selectedProfileId, kidAppLanguage } = useKidProfile();
  const lang = (kidAppLanguage || "de") as Language;
  const t = getTranslations(lang);

  const [data, setData] = useState<AppearanceData>({});
  const [savedData, setSavedData] = useState<AppearanceData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const gender = (selectedProfile?.gender as 'male' | 'female' | null) || null;

  // Load appearance data
  useEffect(() => {
    if (!selectedProfileId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data: row } = await (supabase as any)
        .from("kid_appearance")
        .select("*")
        .eq("kid_profile_id", selectedProfileId)
        .maybeSingle();

      if (cancelled) return;

      let initial: AppearanceData = {};

      if (row) {
        // Prefer appearance_data JSONB if populated
        const jsonData = row.appearance_data as Record<string, unknown> | null;
        if (jsonData && typeof jsonData === 'object' && Object.keys(jsonData).length > 0) {
          initial = jsonData as AppearanceData;
        } else {
          // Fallback: build from legacy columns
          initial = {
            skin_tone: row.skin_tone || 'medium',
            eye_color: row.eye_color || 'brown',
            glasses: String(!!row.glasses),
            hair_color: row.hair_color || 'brown',
            hair_type: row.hair_type || 'straight',
            hair_length: row.hair_length || 'medium',
            hair_style: row.hair_style || 'loose',
            body_type: row.body_type || 'average',
          };
        }
      }

      setData(initial);
      setSavedData(initial);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [selectedProfileId]);

  const hasChanges = JSON.stringify(data) !== JSON.stringify(savedData);

  const handleChange = useCallback((key: string, value: string | boolean) => {
    setData(prev => ({ ...prev, [key]: typeof value === 'boolean' ? String(value) : value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedProfileId || !hasChanges) return;
    setSaving(true);

    // Build legacy columns object
    const legacyCols: Record<string, unknown> = {};
    for (const [slotKey, colName] of Object.entries(LEGACY_COLUMN_MAP)) {
      const val = data[slotKey];
      if (val !== undefined) {
        if (colName === 'glasses') {
          legacyCols[colName] = val === 'true' || val === true;
        } else {
          legacyCols[colName] = val;
        }
      }
    }

    const { error } = await (supabase as any).from("kid_appearance").upsert(
      {
        kid_profile_id: selectedProfileId,
        appearance_data: data,
        ...legacyCols,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "kid_profile_id" }
    );

    setSaving(false);
    if (error) {
      console.error("[MyLookPageV2] Save error:", error.message);
      toast.error("Fehler beim Speichern");
      return;
    }
    setSavedData({ ...data });
    toast.success(t.appearanceSaved || "Gespeichert! ✨");
  }, [selectedProfileId, data, hasChanges, t.appearanceSaved]);

  // Filter slots for current phase
  const visibleSlots = APPEARANCE_SLOTS.filter(slot => slot.phase <= CURRENT_PHASE);

  if (!selectedProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(40,20%,98%)] pb-24">
      <div className="max-w-lg mx-auto px-4 pt-2">
        <FablinoPageHeader
          mascotImage="/mascot/6_Onboarding.png"
          message={t.appearanceMascotMessage || "Gestalte deinen Look!"}
          mascotSize="sm"
          showBackButton
          backTo="/"
        />

        <h1 className="font-baloo text-xl font-bold text-[hsl(20,50%,12%)] mb-1">
          {t.appearanceTitle || "Mein Look"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {t.appearanceSubtitle || "So sehe ich in meinen Geschichten aus"}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-muted-foreground">{t.loading}</span>
          </div>
        ) : (
          <>
            {visibleSlots.map(slot => (
              <AppearanceSlotPicker
                key={slot.key}
                slot={slot}
                value={data[slot.key]}
                onChange={(val) => handleChange(slot.key, val)}
                ageCategory="child"
                gender={gender}
                language={lang}
              />
            ))}

            {/* Sticky save button */}
            <div className="sticky bottom-4 pt-4">
              <motion.button
                type="button"
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={`w-full py-3.5 rounded-2xl text-base font-bold shadow-md transition-all ${
                  hasChanges
                    ? "bg-[#F97316] text-white hover:bg-[#EA6C10]"
                    : "bg-[hsl(0,0%,88%)] text-[hsl(0,0%,60%)] cursor-not-allowed"
                }`}
                whileTap={hasChanges ? { scale: 0.97 } : {}}
              >
                {saving ? "..." : `💾 ${t.appearanceSave || "Speichern"}`}
              </motion.button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
