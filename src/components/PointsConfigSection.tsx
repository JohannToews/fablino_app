import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trophy, Save, Loader2 } from "lucide-react";

interface PointSetting {
  id: string;
  category: string;
  difficulty: string;
  points: number;
}

const PointsConfigSection = () => {
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
          toast.error("Fehler beim Speichern");
          setIsSaving(false);
          return;
        }
      }
      
      toast.success("Punktekonfiguration gespeichert! 🎯");
    } catch (err) {
      console.error("Error:", err);
      toast.error("Fehler beim Speichern");
    }
    
    setIsSaving(false);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'story': return '📖 Geschichte gelesen';
      case 'question': return '❓ Verständnisfrage';
      case 'quiz': return '🧠 Quiz (pro richtige Antwort)';
      default: return category;
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Einfach';
      case 'medium': return 'Mittel';
      case 'difficult': return 'Schwer';
      default: return difficulty;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-sunshine/50">
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
    <Card className="border-2 border-sunshine/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Trophy className="h-5 w-5 text-primary" />
          Punktekonfiguration
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
            <strong>Hinweis:</strong> Quiz-Punkte werden nur vergeben, wenn das Quiz insgesamt bestanden wird (4/5 oder 8/10).
          </p>
          <Button
            onClick={saveSettings}
            disabled={isSaving}
            className="w-full btn-primary-kid"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Speichere...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Punktekonfiguration speichern
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PointsConfigSection;
