import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Star, Save, Loader2 } from "lucide-react";
import { useTranslations, Language } from "@/lib/translations";

interface LevelSetting {
  id: string;
  level_number: number;
  title: string;
  min_points: number;
}

interface LevelConfigSectionProps {
  language: Language;
}

const LevelConfigSection = ({ language }: LevelConfigSectionProps) => {
  const t = useTranslations(language);
  const [levels, setLevels] = useState<LevelSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadLevels();
  }, []);

  const loadLevels = async () => {
    const { data, error } = await supabase
      .from("level_settings")
      .select("*")
      .order("level_number");

    if (data) {
      setLevels(data);
    }
    setIsLoading(false);
  };

  const updateLevel = (id: string, field: 'title' | 'min_points', value: string | number) => {
    setLevels(prev =>
      prev.map(l => l.id === id ? { ...l, [field]: value } : l)
    );
  };

  const saveLevels = async () => {
    setIsSaving(true);

    try {
      for (const level of levels) {
        const { error } = await supabase
          .from("level_settings")
          .update({ 
            title: level.title, 
            min_points: level.min_points 
          })
          .eq("id", level.id);

        if (error) {
          console.error("Error saving level:", error);
          toast.error(t.errorSaving);
          setIsSaving(false);
          return;
        }
      }

      toast.success(t.levelConfigSaved);
    } catch (err) {
      console.error("Error:", err);
      toast.error(t.errorSaving);
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-lavender/50 mt-8">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-lavender/50 mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Star className="h-5 w-5 text-primary" />
          {t.levelConfiguration}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          {t.defineLevels}
        </p>
        
        <div className="space-y-3">
          {levels.map((level, index) => (
            <div key={level.id} className="grid grid-cols-[auto_1fr_auto] gap-4 items-center p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/20">
                <span className="font-baloo font-bold text-primary">{level.level_number}</span>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t.title}</Label>
                <Input
                  value={level.title}
                  onChange={(e) => updateLevel(level.id, 'title', e.target.value)}
                  placeholder="z.B. Débutant"
                  className="font-semibold"
                />
              </div>
              <div className="space-y-1 w-24">
                <Label className="text-xs text-muted-foreground">{t.fromPoints}</Label>
                <Input
                  type="number"
                  min={0}
                  value={level.min_points}
                  onChange={(e) => updateLevel(level.id, 'min_points', parseInt(e.target.value) || 0)}
                  className="text-center font-bold"
                  disabled={index === 0} // First level always starts at 0
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={saveLevels}
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
                {t.saveLevelConfig}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LevelConfigSection;