import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trophy, Save, Loader2 } from "lucide-react";
import { useTranslations, Language } from "@/lib/translations";

interface PointSetting {
  setting_key: string;
  value: string;
  description: string | null;
}

interface PointsConfigSectionProps {
  language: Language;
}

const settingLabels: Record<string, string> = {
  stars_story_read: "⭐ Story gelesen",
  stars_quiz_perfect: "🏆 Quiz 100%",
  stars_quiz_passed: "✅ Quiz bestanden",
  stars_quiz_failed: "❌ Quiz nicht bestanden",
  quiz_pass_threshold: "📊 Bestehens-Schwelle (%)",
  weekly_bonus_3: "📅 Wochen-Bonus (3 Stories)",
  weekly_bonus_5: "📅 Wochen-Bonus (5 Stories)",
  weekly_bonus_7: "📅 Wochen-Bonus (7 Stories)",
};

const PointsConfigSection = ({ language }: PointsConfigSectionProps) => {
  const t = useTranslations(language);
  const [settings, setSettings] = useState<PointSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from("point_settings")
      .select("setting_key, value, description");

    if (data) {
      setSettings(data);
    }
    setIsLoading(false);
  };

  const updateValue = (key: string, value: string) => {
    setSettings(prev =>
      prev.map(s => s.setting_key === key ? { ...s, value } : s)
    );
  };

  const saveSettings = async () => {
    setIsSaving(true);

    try {
      for (const setting of settings) {
        const { error } = await supabase
          .from("point_settings")
          .update({ value: setting.value })
          .eq("setting_key", setting.setting_key);

        if (error) {
          console.error("Error saving setting:", error);
          toast.error(t.errorSaving);
          setIsSaving(false);
          return;
        }
      }

      toast.success(t.pointsConfigSaved);
    } catch (err) {
      console.error("Error:", err);
      toast.error(t.errorSaving);
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-sunshine/50 mt-8">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-sunshine/50 mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Trophy className="h-5 w-5 text-primary" />
          {t.pointsConfiguration}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.map(setting => (
          <div key={setting.setting_key} className="flex items-center gap-4">
            <Label className="w-64 text-sm font-medium">
              {settingLabels[setting.setting_key] || setting.setting_key}
            </Label>
            <Input
              type="number"
              min={0}
              value={setting.value}
              onChange={(e) => updateValue(setting.setting_key, e.target.value)}
              className="w-24 text-center font-bold"
            />
            {setting.description && (
              <span className="text-xs text-muted-foreground">{setting.description}</span>
            )}
          </div>
        ))}

        <div className="pt-4 border-t">
          <Button
            onClick={saveSettings}
            disabled={isSaving}
            className="w-full btn-primary-kid"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {t.saving}
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                {t.savePointsConfig}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PointsConfigSection;
