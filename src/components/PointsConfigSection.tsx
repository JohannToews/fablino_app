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
  id: string;
  category: string;
  difficulty: string;
  points: number;
}

interface PointsConfigSectionProps {
  language: Language;
}

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
      .select("*")
      .order("category")
      .order("difficulty");

    if (data) {
      setSettings(data);
    }
    setIsLoading(false);
  };

  const updatePoints = (id: string, points: number) => {
    setSettings(prev => 
      prev.map(s => s.id === id ? { ...s, points: Math.max(0, points) } : s)
    );
  };

  const saveSettings = async () => {
    setIsSaving(true);
    
    try {
      for (const setting of settings) {
        const { error } = await supabase
          .from("point_settings")
          .update({ points: setting.points })
          .eq("id", setting.id);
        
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

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'story': return `📖 ${t.storyRead}`;
      case 'question': return `❓ ${t.comprehensionQuestion}`;
      case 'quiz': return `🧠 ${t.quizPerCorrectAnswer}`;
      default: return category;
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return t.easy;
      case 'medium': return t.medium;
      case 'difficult': return t.hard;
      default: return difficulty;
    }
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

  // Group settings by category
  const groupedSettings: Record<string, PointSetting[]> = {};
  settings.forEach(s => {
    if (!groupedSettings[s.category]) {
      groupedSettings[s.category] = [];
    }
    groupedSettings[s.category].push(s);
  });

  return (
    <Card className="border-2 border-sunshine/50 mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Trophy className="h-5 w-5 text-primary" />
          {t.pointsConfiguration}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedSettings).map(([category, categorySettings]) => (
          <div key={category} className="space-y-3">
            <h3 className="font-semibold text-lg">{getCategoryLabel(category)}</h3>
            <div className="grid grid-cols-3 gap-4">
              {categorySettings
                .sort((a, b) => {
                  const order = ['easy', 'medium', 'difficult'];
                  return order.indexOf(a.difficulty) - order.indexOf(b.difficulty);
                })
                .map(setting => (
                <div key={setting.id} className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    {getDifficultyLabel(setting.difficulty)}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={setting.points}
                    onChange={(e) => updatePoints(setting.id, parseInt(e.target.value) || 0)}
                    className="text-center font-bold"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            <strong>{language === 'de' ? 'Hinweis' : language === 'en' ? 'Note' : 'Remarque'}:</strong> {t.pointsNote}
          </p>
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