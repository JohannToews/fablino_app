import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import FablinoPageHeader from "@/components/FablinoPageHeader";
import { useKidProfile } from "@/hooks/useKidProfile";
import { getTranslations } from "@/lib/translations";
import { Language } from "@/lib/translations";
import {
  SKIN_TONES,
  HAIR_LENGTHS,
  HAIR_TYPES,
  HAIR_STYLES,
  HAIR_COLORS,
  type SkinToneKey,
  type HairLengthKey,
  type HairTypeKey,
  type HairStyleKey,
  type HairColorKey,
} from "@/config/appearanceOptions";
import { toast } from "sonner";
import { motion } from "framer-motion";

type KidAppearance = {
  skinTone: SkinToneKey;
  hairLength: HairLengthKey;
  hairType: HairTypeKey;
  hairStyle: HairStyleKey;
  hairColor: HairColorKey;
  glasses: boolean;
};

const DEFAULT_APPEARANCE: KidAppearance = {
  skinTone: "medium",
  hairLength: "medium",
  hairType: "straight",
  hairStyle: "loose",
  hairColor: "brown",
  glasses: false,
};

export default function MyLookPage() {
  const navigate = useNavigate();
  const { selectedProfile, selectedProfileId, kidAppLanguage } = useKidProfile();
  const t = getTranslations((kidAppLanguage || "de") as Language);

  const [appearance, setAppearance] = useState<KidAppearance>(DEFAULT_APPEARANCE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedAppearance, setSavedAppearance] = useState<KidAppearance>(DEFAULT_APPEARANCE);

  const handleSave = useCallback(async () => {
    if (!selectedProfileId) return;
    setSaving(true);
    const { error } = await (supabase as any).from("kid_appearance").upsert(
      {
        kid_profile_id: selectedProfileId,
        skin_tone: appearance.skinTone,
        hair_length: appearance.hairLength,
        hair_type: appearance.hairType,
        hair_style: appearance.hairStyle,
        hair_color: appearance.hairColor,
        glasses: appearance.glasses,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "kid_profile_id" }
    );
    setSaving(false);
    if (error) {
      console.error("[MyLookPage] Save error:", error.message);
      return;
    }
    setSavedAppearance(appearance);
    setHasChanges(false);
    toast.success(t.appearanceSaved);
  }, [selectedProfileId, appearance, t.appearanceSaved]);

  useEffect(() => {
    if (!selectedProfileId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await (supabase as any)
        .from("kid_appearance")
        .select("*")
        .eq("kid_profile_id", selectedProfileId)
        .maybeSingle();
      if (!cancelled && data) {
        const loaded: KidAppearance = {
          skinTone: (data.skin_tone as SkinToneKey) || "medium",
          hairLength: (data.hair_length as HairLengthKey) || "medium",
          hairType: (data.hair_type as HairTypeKey) || "straight",
          hairStyle: (data.hair_style as HairStyleKey) || "loose",
          hairColor: (data.hair_color as HairColorKey) || "brown",
          glasses: !!data.glasses,
        };
        setAppearance(loaded);
        setSavedAppearance(loaded);
      } else if (!cancelled) {
        setAppearance(DEFAULT_APPEARANCE);
        setSavedAppearance(DEFAULT_APPEARANCE);
      }
      if (!cancelled) {
        setLoading(false);
        setHasChanges(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedProfileId]);

  const update = useCallback(<K extends keyof KidAppearance>(key: K, value: KidAppearance[K]) => {
    setAppearance((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  if (!selectedProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">{t.loading}</p>
      </div>
    );
  }

  const pickerRing = "ring-2 ring-[#E8863A] ring-offset-2";
  const sectionClass = "rounded-2xl p-4 bg-white border border-[#F0E8E0] shadow-sm mb-4";

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24">
      <div className="max-w-lg mx-auto px-4 pt-2">
        <FablinoPageHeader
          mascotImage="/mascot/6_Onboarding.png"
          message={t.appearanceMascotMessage}
          mascotSize="sm"
          showBackButton
          backTo="/"
        />

        <h1 className="font-baloo text-xl font-bold text-[#2D1810] mb-1">{t.appearanceTitle}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t.appearanceSubtitle}</p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-muted-foreground">{t.loading}</span>
          </div>
        ) : (
          <>
            {/* Skin tone */}
            <section className={sectionClass}>
              <h2 className="text-sm font-semibold text-[#2D1810] mb-3">{t.appearanceSkin}</h2>
              <div className="flex flex-wrap gap-3 justify-center">
                {SKIN_TONES.map((opt) => (
                  <motion.button
                    key={opt.key}
                    type="button"
                    onClick={() => update("skinTone", opt.key)}
                    className={`w-12 h-12 rounded-full border-2 border-[#E0E0E0] transition-all ${appearance.skinTone === opt.key ? pickerRing : ""}`}
                    style={{ backgroundColor: opt.color }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={opt.key}
                  />
                ))}
              </div>
            </section>

            {/* Hair length */}
            <section className={sectionClass}>
              <h2 className="text-sm font-semibold text-[#2D1810] mb-3">{t.appearanceHairLengthLabel}</h2>
              <div className="flex flex-wrap gap-3 justify-center">
                {HAIR_LENGTHS.map((opt) => (
                  <motion.button
                    key={opt.key}
                    type="button"
                    onClick={() => update("hairLength", opt.key)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all min-w-[72px] ${
                      appearance.hairLength === opt.key
                        ? "border-[#E8863A] bg-orange-50"
                        : "border-[#E0E0E0] bg-white"
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-xs font-medium text-[#2D1810]">
                      {(
                        (t as unknown as Record<string, string>)
                      )[`appearanceHair${opt.key === "very_short" ? "VeryShort" : opt.key.charAt(0).toUpperCase() + opt.key.slice(1)}`] ?? opt.key}
                    </span>
                  </motion.button>
                ))}
              </div>
            </section>

            {/* Hair type */}
            <section className={sectionClass}>
              <h2 className="text-sm font-semibold text-[#2D1810] mb-3">{t.appearanceHairTypeLabel}</h2>
              <div className="flex flex-wrap gap-2 justify-center">
                {HAIR_TYPES.map((opt) => (
                  <motion.button
                    key={opt.key}
                    type="button"
                    onClick={() => update("hairType", opt.key)}
                    className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      appearance.hairType === opt.key
                        ? "border-[#E8863A] bg-orange-50 text-[#92400E]"
                        : "border-[#E0E0E0] bg-white text-[#2D1810]"
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    {(t as unknown as Record<string, string>)[`appearanceHair${opt.key.charAt(0).toUpperCase() + opt.key.slice(1)}`] ?? opt.key}
                  </motion.button>
                ))}
              </div>
            </section>

            {/* Hair style */}
            <section className={sectionClass}>
              <h2 className="text-sm font-semibold text-[#2D1810] mb-3">{t.appearanceHairStyleLabel}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {HAIR_STYLES.map((opt) => (
                  <motion.button
                    key={opt.key}
                    type="button"
                    onClick={() => update("hairStyle", opt.key)}
                    className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      appearance.hairStyle === opt.key
                        ? "border-[#E8863A] bg-orange-50 text-[#92400E]"
                        : "border-[#E0E0E0] bg-white text-[#2D1810]"
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    {(t as unknown as Record<string, string>)[`appearanceStyle${opt.key.charAt(0).toUpperCase() + opt.key.slice(1)}`] ?? opt.key}
                  </motion.button>
                ))}
              </div>
            </section>

            {/* Hair color */}
            <section className={sectionClass}>
              <h2 className="text-sm font-semibold text-[#2D1810] mb-3">{t.appearanceHairColorLabel}</h2>
              <div className="flex flex-wrap gap-3 justify-center">
                {HAIR_COLORS.map((opt) => (
                  <motion.button
                    key={opt.key}
                    type="button"
                    onClick={() => update("hairColor", opt.key)}
                    className={`w-10 h-10 rounded-full border-2 border-[#E0E0E0] transition-all ${appearance.hairColor === opt.key ? pickerRing : ""}`}
                    style={{ backgroundColor: opt.color }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={opt.key}
                  />
                ))}
              </div>
            </section>

            {/* Glasses */}
            <section className={sectionClass}>
              <h2 className="text-sm font-semibold text-[#2D1810] mb-3">{t.appearanceGlassesLabel}</h2>
              <div className="flex gap-3 justify-center">
                <motion.button
                  type="button"
                  onClick={() => update("glasses", false)}
                  className={`flex-1 max-w-[140px] py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    !appearance.glasses ? "border-[#E8863A] bg-orange-50 text-[#92400E]" : "border-[#E0E0E0] bg-white text-[#2D1810]"
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  {t.appearanceGlassesNo}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => update("glasses", true)}
                  className={`flex-1 max-w-[140px] py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    appearance.glasses ? "border-[#E8863A] bg-orange-50 text-[#92400E]" : "border-[#E0E0E0] bg-white text-[#2D1810]"
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  {t.appearanceGlassesYes}
                </motion.button>
              </div>
            </section>

            {/* Save button */}
            <div className="sticky bottom-4 pt-4">
              <motion.button
                type="button"
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={`w-full py-3.5 rounded-2xl text-base font-bold shadow-md transition-all ${
                  hasChanges
                    ? "bg-[#E8863A] text-white hover:bg-[#D47730]"
                    : "bg-[#E0E0E0] text-[#999] cursor-not-allowed"
                }`}
                whileTap={hasChanges ? { scale: 0.97 } : {}}
              >
                {saving ? "..." : "💾 Speichern"}
              </motion.button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
