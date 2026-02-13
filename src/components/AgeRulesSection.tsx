import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Save, Trash2, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { Label } from "@/components/ui/label";

interface AgeRule {
  id: string;
  language: string;
  min_age: number;
  max_age: number;
  max_sentence_length: number;
  min_word_count: number;
  max_word_count: number;
  allowed_tenses: string[];
  sentence_structures: string;
  narrative_guidelines: string;
  narrative_perspective: string | null;
  paragraph_length: string | null;
  dialogue_ratio: string | null;
  example_sentences: string[] | null;
}

const LANGUAGES = [
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'it', label: 'Italiano', flag: '🇮🇹' },
  { value: 'bs', label: 'Bosanski', flag: '🇧🇦' },
];

const emptyRule = (): Omit<AgeRule, 'id'> => ({
  language: 'de',
  min_age: 14,
  max_age: 16,
  max_sentence_length: 22,
  min_word_count: 800,
  max_word_count: 1200,
  allowed_tenses: [],
  sentence_structures: '',
  narrative_guidelines: '',
  narrative_perspective: 'dritte Person',
  paragraph_length: '4-6 Sätze',
  dialogue_ratio: '20-30%',
  example_sentences: [],
});

interface Props {
  language: string;
}

const AgeRulesSection = ({ language }: Props) => {
  const [rules, setRules] = useState<AgeRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLang, setFilterLang] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<(AgeRule | (Omit<AgeRule, 'id'> & { id?: string })) | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('age_rules')
      .select('*')
      .order('language')
      .order('min_age');
    
    if (error) {
      toast.error('Fehler beim Laden der Age Rules');
      console.error(error);
    } else {
      setRules(data || []);
    }
    setLoading(false);
  };

  const filteredRules = filterLang === 'all' 
    ? rules 
    : rules.filter(r => r.language === filterLang);

  const handleSave = async () => {
    if (!editingRule) return;
    setSaving(true);

    const { id, ...ruleData } = editingRule as AgeRule;
    
    try {
      if (id) {
        // Update existing
        const { error } = await supabase
          .from('age_rules')
          .update(ruleData)
          .eq('id', id);
        if (error) throw error;
        toast.success('Rule aktualisiert');
      } else {
        // Insert new
        const { error } = await supabase
          .from('age_rules')
          .insert(ruleData);
        if (error) throw error;
        toast.success('Neue Rule erstellt');
      }
      setEditingRule(null);
      await loadRules();
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Speichern');
      console.error(error);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Diese Age Rule wirklich löschen?')) return;
    const { error } = await supabase.from('age_rules').delete().eq('id', id);
    if (error) {
      toast.error('Fehler beim Löschen');
    } else {
      toast.success('Rule gelöscht');
      loadRules();
    }
  };

  const handleDuplicate = (rule: AgeRule) => {
    const { id, ...rest } = rule;
    setEditingRule({ ...rest, min_age: rest.max_age + 1, max_age: rest.max_age + 3 });
    setExpandedId(null);
  };

  const langFlag = (code: string) => LANGUAGES.find(l => l.value === code)?.flag || code;
  const langLabel = (code: string) => LANGUAGES.find(l => l.value === code)?.label || code;

  const renderRuleEditor = (rule: typeof editingRule) => {
    if (!rule) return null;

    const update = (field: string, value: any) => {
      setEditingRule({ ...rule, [field]: value });
    };

    return (
      <Card className="border-2 border-primary/50 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>{rule.id ? '✏️ Rule bearbeiten' : '➕ Neue Rule erstellen'}</span>
            <Button variant="ghost" size="sm" onClick={() => setEditingRule(null)}>✕</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Row 1: Language + Age Range */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Sprache</Label>
              <Select value={rule.language} onValueChange={(v) => update('language', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border border-border z-50">
                  {LANGUAGES.map(l => (
                    <SelectItem key={l.value} value={l.value}>{l.flag} {l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Min Alter</Label>
              <Input type="number" value={rule.min_age} onChange={(e) => update('min_age', parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <Label className="text-xs">Max Alter</Label>
              <Input type="number" value={rule.max_age} onChange={(e) => update('max_age', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          {/* Row 2: Word counts + sentence length */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Min Wörter</Label>
              <Input type="number" value={rule.min_word_count} onChange={(e) => update('min_word_count', parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <Label className="text-xs">Max Wörter</Label>
              <Input type="number" value={rule.max_word_count} onChange={(e) => update('max_word_count', parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <Label className="text-xs">Max Satzlänge</Label>
              <Input type="number" value={rule.max_sentence_length} onChange={(e) => update('max_sentence_length', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          {/* Row 3: Perspective, Paragraph, Dialogue */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Erzählperspektive</Label>
              <Input value={rule.narrative_perspective || ''} onChange={(e) => update('narrative_perspective', e.target.value)} placeholder="z.B. dritte Person" />
            </div>
            <div>
              <Label className="text-xs">Absatzlänge</Label>
              <Input value={rule.paragraph_length || ''} onChange={(e) => update('paragraph_length', e.target.value)} placeholder="z.B. 3-4 Sätze" />
            </div>
            <div>
              <Label className="text-xs">Dialoganteil</Label>
              <Input value={rule.dialogue_ratio || ''} onChange={(e) => update('dialogue_ratio', e.target.value)} placeholder="z.B. 20-35%" />
            </div>
          </div>

          {/* Allowed Tenses */}
          <div>
            <Label className="text-xs">Erlaubte Zeiten (kommagetrennt)</Label>
            <Input 
              value={(rule.allowed_tenses || []).join(', ')} 
              onChange={(e) => update('allowed_tenses', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
              placeholder="Präsens, Perfekt, Präteritum"
            />
          </div>

          {/* Sentence Structures */}
          <div>
            <Label className="text-xs">Satzstrukturen</Label>
            <Textarea 
              value={rule.sentence_structures} 
              onChange={(e) => update('sentence_structures', e.target.value)} 
              rows={3}
              placeholder="Beschreibung der erlaubten Satzstrukturen..."
            />
          </div>

          {/* Narrative Guidelines */}
          <div>
            <Label className="text-xs">Narrative Guidelines</Label>
            <Textarea 
              value={rule.narrative_guidelines} 
              onChange={(e) => update('narrative_guidelines', e.target.value)} 
              rows={6}
              placeholder="Ausführliche Erzählrichtlinien..."
            />
          </div>

          {/* Example Sentences */}
          <div>
            <Label className="text-xs">Beispielsätze (einer pro Zeile)</Label>
            <Textarea 
              value={(rule.example_sentences || []).join('\n')} 
              onChange={(e) => update('example_sentences', e.target.value.split('\n').filter(Boolean))} 
              rows={4}
              placeholder="Ein Beispielsatz pro Zeile..."
            />
          </div>

          {/* Save */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Speichern...' : 'Speichern'}
            </Button>
            <Button variant="outline" onClick={() => setEditingRule(null)}>Abbrechen</Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">📏 Age Rules</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filterLang} onValueChange={setFilterLang}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border z-50">
                <SelectItem value="all">Alle Sprachen</SelectItem>
                {LANGUAGES.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.flag} {l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setEditingRule(emptyRule())}>
              <Plus className="h-4 w-4 mr-1" /> Neue Rule
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Editor for new/edit */}
        {editingRule && renderRuleEditor(editingRule)}

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Laden...</p>
        ) : filteredRules.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Keine Rules gefunden</p>
        ) : (
          filteredRules.map((rule) => {
            const isExpanded = expandedId === rule.id;
            return (
              <div key={rule.id} className="border border-border rounded-xl overflow-hidden">
                {/* Summary Row */}
                <button
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left"
                  onClick={() => setExpandedId(isExpanded ? null : rule.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{langFlag(rule.language)}</span>
                    <span className="font-medium text-sm">
                      {langLabel(rule.language)} — Alter {rule.min_age}–{rule.max_age}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {rule.min_word_count}–{rule.max_word_count} Wörter | Max {rule.max_sentence_length} Wörter/Satz
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-border p-4 bg-muted/10 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Perspektive:</span> {rule.narrative_perspective || '–'}</div>
                      <div><span className="text-muted-foreground">Absatzlänge:</span> {rule.paragraph_length || '–'}</div>
                      <div><span className="text-muted-foreground">Dialoganteil:</span> {rule.dialogue_ratio || '–'}</div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Erlaubte Zeiten:</p>
                      <div className="flex flex-wrap gap-1">
                        {(rule.allowed_tenses || []).map((t, i) => (
                          <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Satzstrukturen:</p>
                      <p className="text-sm bg-card p-2 rounded-lg">{rule.sentence_structures}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Narrative Guidelines:</p>
                      <p className="text-sm bg-card p-2 rounded-lg whitespace-pre-wrap max-h-40 overflow-y-auto">{rule.narrative_guidelines}</p>
                    </div>

                    {rule.example_sentences && rule.example_sentences.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Beispielsätze:</p>
                        <ul className="text-sm bg-card p-2 rounded-lg space-y-1">
                          {rule.example_sentences.map((s, i) => (
                            <li key={i} className="text-sm italic">„{s}"</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditingRule({ ...rule }); setExpandedId(null); }}>
                        ✏️ Bearbeiten
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDuplicate(rule)}>
                        <Copy className="h-3 w-3 mr-1" /> Duplizieren
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(rule.id)}>
                        <Trash2 className="h-3 w-3 mr-1" /> Löschen
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default AgeRulesSection;
