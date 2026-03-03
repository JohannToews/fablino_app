import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useAuth } from "@/hooks/useAuth";
import { getTranslations, Language } from "@/lib/translations";
import {
  APPEARANCE_SLOTS, CURRENT_PHASE,
  type AppearanceData, type AgeCategory,
  inferAgeCategory, inferGenderFromRelation, getFilteredOptions,
} from "@/config/appearanceSlots";
import FablinoPageHeader from "@/components/FablinoPageHeader";
import AppearanceSlotPicker from "@/components/appearance/AppearanceSlotPicker";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronRight, AlertCircle, Users, UserPlus } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CharacterAppearance {
  id: string;
  user_id: string;
  character_name: string;
  role: string;
  relation: string | null;
  gender: string | null;
  age_category: string;
  appearance_data: AppearanceData | null;
  is_active: boolean;
  sort_order: number | null;
  icon_url: string | null;
}

interface LinkedKid {
  kid_profile_id: string;
  kid_name: string;
}

// ─── Relation options ───────────────────────────────────────────────────────

const RELATION_OPTIONS = [
  { value: 'Mama', role: 'family' },
  { value: 'Papa', role: 'family' },
  { value: 'Oma', role: 'family' },
  { value: 'Opa', role: 'family' },
  { value: 'Bruder', role: 'family' },
  { value: 'Schwester', role: 'family' },
  { value: 'Tante', role: 'family' },
  { value: 'Onkel', role: 'family' },
  { value: 'Cousin', role: 'family' },
  { value: 'Cousine', role: 'family' },
  { value: 'Freund', role: 'friend' },
  { value: 'Freundin', role: 'friend' },
  { value: 'Sonstige', role: 'friend' },
];

// ─── Age category labels ────────────────────────────────────────────────────

const AGE_LABELS: Record<string, Record<string, string>> = {
  child: { de: 'Kind', en: 'Child', fr: 'Enfant' },
  teen: { de: 'Jugendlich', en: 'Teen', fr: 'Ado' },
  adult: { de: 'Erwachsen', en: 'Adult', fr: 'Adulte' },
  senior: { de: 'Senior', en: 'Senior', fr: 'Senior' },
};

// ─── Main Component ─────────────────────────────────────────────────────────

type Screen = 'overview' | 'editor';

export default function MyPeoplePage() {
  const { user } = useAuth();
  const { kidProfiles, kidAppLanguage } = useKidProfile();
  const lang = (kidAppLanguage || 'de') as Language;
  const t = getTranslations(lang);
  const userId = user?.id;

  const [characters, setCharacters] = useState<CharacterAppearance[]>([]);
  const [linkedKids, setLinkedKids] = useState<Record<string, LinkedKid[]>>({});
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>('overview');
  const [editingChar, setEditingChar] = useState<CharacterAppearance | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // ─── Load characters ────────────────────────────────────────────────────

  const loadCharacters = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data } = await (supabase as any)
      .from('character_appearances')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order')
      .order('character_name');

    const chars: CharacterAppearance[] = data || [];
    setCharacters(chars);

    // Load linked kids for each character
    if (chars.length > 0) {
      const charIds = chars.map(c => c.id);
      const { data: links } = await (supabase as any)
        .from('kid_characters')
        .select('character_appearance_id, kid_profile_id, kid_profiles!inner(name)')
        .in('character_appearance_id', charIds)
        .eq('is_active', true);

      const linkMap: Record<string, LinkedKid[]> = {};
      for (const link of (links || [])) {
        const caId = link.character_appearance_id;
        if (!linkMap[caId]) linkMap[caId] = [];
        linkMap[caId].push({
          kid_profile_id: link.kid_profile_id,
          kid_name: (link.kid_profiles as any)?.name || '?',
        });
      }
      setLinkedKids(linkMap);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => { loadCharacters(); }, [loadCharacters]);

  // ─── Navigate to editor ─────────────────────────────────────────────────

  const openEditor = (char: CharacterAppearance) => {
    setEditingChar(char);
    setScreen('editor');
  };

  const backToOverview = () => {
    setScreen('overview');
    setEditingChar(null);
    loadCharacters();
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  if (screen === 'editor' && editingChar) {
    return (
      <AppearanceEditor
        character={editingChar}
        language={lang}
        onBack={backToOverview}
        t={t}
      />
    );
  }

  return (
    <OverviewScreen
      characters={characters}
      linkedKids={linkedKids}
      kidProfiles={kidProfiles}
      loading={loading}
      language={lang}
      userId={userId || ''}
      onEdit={openEditor}
      onAdd={() => setShowAddDialog(true)}
      onRefresh={loadCharacters}
      t={t}
      showAddDialog={showAddDialog}
      setShowAddDialog={setShowAddDialog}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Screen 1: Overview
// ═══════════════════════════════════════════════════════════════════════════

interface OverviewProps {
  characters: CharacterAppearance[];
  linkedKids: Record<string, LinkedKid[]>;
  kidProfiles: any[];
  loading: boolean;
  language: string;
  userId: string;
  onEdit: (c: CharacterAppearance) => void;
  onAdd: () => void;
  onRefresh: () => void;
  t: any;
  showAddDialog: boolean;
  setShowAddDialog: (v: boolean) => void;
}

function OverviewScreen({
  characters, linkedKids, kidProfiles, loading, language, userId,
  onEdit, onAdd, onRefresh, t, showAddDialog, setShowAddDialog,
}: OverviewProps) {
  const familyChars = characters.filter(c => c.role === 'family');
  const friendChars = characters.filter(c => c.role === 'friend');

  const getAgeBadge = (cat: string) => {
    const labels = AGE_LABELS[cat] || AGE_LABELS.adult;
    return labels[language] || labels.en || labels.de;
  };

  const getGenderIcon = (gender: string | null) => {
    if (gender === 'male') return '♂';
    if (gender === 'female') return '♀';
    return '⚪';
  };

  const getPreview = (data: AppearanceData | null) => {
    if (!data || Object.keys(data).length === 0) return null;
    const parts: string[] = [];
    for (const slot of APPEARANCE_SLOTS) {
      const val = data[slot.key];
      if (val && slot.pickerType !== 'toggle') {
        const opt = slot.options.find(o => o.value === val);
        if (opt) {
          const label = opt.label[language] || opt.label.en || opt.label.de;
          parts.push(label);
        }
      }
    }
    return parts.slice(0, 4).join(', ') + (parts.length > 4 ? '…' : '');
  };

  const renderCard = (char: CharacterAppearance) => {
    const kids = linkedKids[char.id] || [];
    const preview = getPreview(char.appearance_data);
    const hasAppearance = preview !== null;

    return (
      <motion.div
        key={char.id}
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[hsl(30,20%,90%)] bg-white p-4 shadow-sm"
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-[hsl(20,50%,12%)] text-base">
              🧑 {char.character_name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {char.relation || char.role} · {getGenderIcon(char.gender)}
            </p>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-[hsl(30,80%,30%)]">
            {getAgeBadge(char.age_category)}
          </span>
        </div>

        {hasAppearance ? (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{preview}</p>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-3">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Noch kein Aussehen definiert</span>
          </div>
        )}

        {kids.length > 0 && (
          <p className="text-xs text-muted-foreground mb-2">
            Genutzt von: {kids.map(k => k.kid_name).join(', ')} ✓
          </p>
        )}

        <button
          onClick={() => onEdit(char)}
          className="flex items-center gap-1 text-sm font-medium text-[#F97316] hover:text-[#EA6C10] transition-colors"
        >
          {hasAppearance ? 'Aussehen bearbeiten' : 'Aussehen definieren'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[hsl(40,20%,98%)] pb-24">
      <div className="max-w-lg mx-auto px-4 pt-2">
        <FablinoPageHeader
          mascotImage="/mascot/6_Onboarding.png"
          message="Gestalte das Aussehen deiner Familie und Freunde!"
          mascotSize="sm"
          showBackButton
          backTo="/"
        />

        <h1 className="font-baloo text-xl font-bold text-[hsl(20,50%,12%)] mb-6">
          Meine Leute
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-muted-foreground">{t.loading}</span>
          </div>
        ) : characters.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-16 text-center"
          >
            <img src="/mascot/5_new_story.png" alt="Fablino" className="w-24 h-24 mb-4 object-contain" />
            <p className="text-muted-foreground text-sm mb-6">
              Füge deine Familie und Freunde hinzu!
            </p>
            <Button onClick={onAdd} className="bg-[#F97316] hover:bg-[#EA6C10] text-white rounded-2xl gap-2">
              <UserPlus className="w-4 h-4" />
              Person hinzufügen
            </Button>
          </motion.div>
        ) : (
          <>
            {familyChars.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-[#F97316]" />
                  <h2 className="text-sm font-semibold text-[hsl(20,50%,12%)]">Familie</h2>
                </div>
                <div className="space-y-3">
                  {familyChars.map(renderCard)}
                </div>
              </div>
            )}

            {friendChars.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🧒</span>
                  <h2 className="text-sm font-semibold text-[hsl(20,50%,12%)]">Freunde</h2>
                </div>
                <div className="space-y-3">
                  {friendChars.map(renderCard)}
                </div>
              </div>
            )}

            {/* FAB */}
            <div className="sticky bottom-4 pt-4 flex justify-end">
              <motion.button
                onClick={onAdd}
                className="w-14 h-14 rounded-full bg-[#F97316] text-white shadow-lg flex items-center justify-center hover:bg-[#EA6C10] transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                <Plus className="w-6 h-6" />
              </motion.button>
            </div>
          </>
        )}
      </div>

      <AddPersonDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        userId={userId}
        kidProfiles={kidProfiles}
        language={language}
        onCreated={(char) => {
          setShowAddDialog(false);
          onRefresh();
          // Navigate to editor for the new character
          if (char) {
            // Small delay to let the overview refresh
            setTimeout(() => {
              // Find and open the new char — handled by parent
            }, 200);
          }
        }}
        onEdit={(char) => {
          setShowAddDialog(false);
          onEdit(char);
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Dialog: Add Person
// ═══════════════════════════════════════════════════════════════════════════

interface AddPersonDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  kidProfiles: any[];
  language: string;
  onCreated: (char: CharacterAppearance | null) => void;
  onEdit: (char: CharacterAppearance) => void;
}

function AddPersonDialog({ open, onOpenChange, userId, kidProfiles, language, onCreated, onEdit }: AddPersonDialogProps) {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [selectedKids, setSelectedKids] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setRelation('');
      setGender(null);
      setSelectedKids(kidProfiles.map(k => k.id));
    }
  }, [open, kidProfiles]);

  // Auto-detect gender from relation
  useEffect(() => {
    if (relation) {
      const detected = inferGenderFromRelation(relation);
      setGender(detected);
    }
  }, [relation]);

  const roleForRelation = RELATION_OPTIONS.find(r => r.value === relation)?.role || 'friend';

  const handleSave = async () => {
    if (!name.trim() || !relation) return;
    setSaving(true);

    const ageCat = inferAgeCategory(roleForRelation, relation);

    // 1. Insert character_appearances
    const { data: newChar, error } = await (supabase as any)
      .from('character_appearances')
      .insert({
        user_id: userId,
        character_name: name.trim(),
        role: roleForRelation,
        relation,
        gender,
        age_category: ageCat,
        appearance_data: {},
        is_active: true,
      })
      .select()
      .single();

    if (error || !newChar) {
      console.error('[AddPerson] Insert error:', error?.message);
      toast.error('Fehler beim Hinzufügen');
      setSaving(false);
      return;
    }

    // 2. Link to selected kid_profiles
    for (const kidId of selectedKids) {
      // Check if kid_characters already has entry with same name
      const { data: existing } = await (supabase as any)
        .from('kid_characters')
        .select('id')
        .eq('kid_profile_id', kidId)
        .eq('name', name.trim())
        .eq('is_active', true)
        .maybeSingle();

      if (existing) {
        // Update existing entry
        await (supabase as any)
          .from('kid_characters')
          .update({ character_appearance_id: newChar.id })
          .eq('id', existing.id);
      } else {
        // Insert new kid_characters entry
        await (supabase as any)
          .from('kid_characters')
          .insert({
            kid_profile_id: kidId,
            name: name.trim(),
            role: roleForRelation,
            relation,
            character_appearance_id: newChar.id,
            is_active: true,
          });
      }
    }

    setSaving(false);
    toast.success('Person hinzugefügt! ✨');
    onEdit(newChar as CharacterAppearance);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[hsl(20,50%,12%)]">Person hinzufügen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="char-name" className="text-sm font-medium">Name *</Label>
            <Input
              id="char-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Mama, Opa Hans, Emma..."
              className="mt-1 rounded-xl"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Beziehung *</Label>
            <Select value={relation} onValueChange={setRelation}>
              <SelectTrigger className="mt-1 rounded-xl">
                <SelectValue placeholder="Wählen..." />
              </SelectTrigger>
              <SelectContent>
                {RELATION_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Geschlecht</Label>
            <div className="flex gap-2 mt-1">
              {([
                { val: 'male' as const, label: '♂ Männlich' },
                { val: 'female' as const, label: '♀ Weiblich' },
                { val: null, label: '⚪ k.A.' },
              ]).map(({ val, label }) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setGender(val)}
                  className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                    gender === val
                      ? 'border-[#F97316] bg-orange-50 text-[hsl(30,80%,30%)]'
                      : 'border-[hsl(30,20%,88%)] bg-white text-[hsl(20,50%,12%)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {kidProfiles.length > 1 && (
            <div>
              <Label className="text-sm font-medium">Für welche Kinder?</Label>
              <div className="space-y-2 mt-2">
                {kidProfiles.map(kid => (
                  <label key={kid.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={selectedKids.includes(kid.id)}
                      onCheckedChange={(checked) => {
                        setSelectedKids(prev =>
                          checked
                            ? [...prev, kid.id]
                            : prev.filter(id => id !== kid.id)
                        );
                      }}
                    />
                    {kid.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !relation || saving}
            className="w-full bg-[#F97316] hover:bg-[#EA6C10] text-white rounded-2xl font-bold"
          >
            {saving ? '...' : 'Hinzufügen & Aussehen definieren →'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Screen 2: Appearance Editor
// ═══════════════════════════════════════════════════════════════════════════

interface EditorProps {
  character: CharacterAppearance;
  language: string;
  onBack: () => void;
  t: any;
}

function AppearanceEditor({ character, language, onBack, t }: EditorProps) {
  const [data, setData] = useState<AppearanceData>(
    (character.appearance_data && typeof character.appearance_data === 'object'
      ? character.appearance_data
      : {}) as AppearanceData
  );
  const [savedData, setSavedData] = useState<AppearanceData>(
    (character.appearance_data && typeof character.appearance_data === 'object'
      ? character.appearance_data
      : {}) as AppearanceData
  );
  const [ageCategory, setAgeCategory] = useState<AgeCategory>(
    (character.age_category as AgeCategory) || 'adult'
  );
  const [gender, setGender] = useState<'male' | 'female' | null>(
    character.gender as 'male' | 'female' | null
  );
  const [saving, setSaving] = useState(false);

  const hasChanges = JSON.stringify(data) !== JSON.stringify(savedData);

  const handleChange = useCallback((key: string, value: string | boolean) => {
    setData(prev => ({ ...prev, [key]: typeof value === 'boolean' ? String(value) : value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);

    const { error } = await (supabase as any)
      .from('character_appearances')
      .update({
        appearance_data: data,
        age_category: ageCategory,
        gender,
        updated_at: new Date().toISOString(),
      })
      .eq('id', character.id);

    setSaving(false);
    if (error) {
      console.error('[AppearanceEditor] Save error:', error.message);
      toast.error('Fehler beim Speichern');
      return;
    }
    setSavedData({ ...data });
    toast.success(t.appearanceSaved || 'Gespeichert! ✨');
  };

  const visibleSlots = APPEARANCE_SLOTS.filter(s => s.phase <= CURRENT_PHASE);

  const ageBadge = AGE_LABELS[ageCategory]?.[language] || AGE_LABELS[ageCategory]?.de || ageCategory;

  return (
    <div className="min-h-screen bg-[hsl(40,20%,98%)] pb-24">
      <div className="max-w-lg mx-auto px-4 pt-2">
        <FablinoPageHeader
          mascotImage="/mascot/6_Onboarding.png"
          message={`So sieht ${character.character_name} aus!`}
          mascotSize="sm"
          showBackButton
          onBack={onBack}
        />

        {/* Character info header */}
        <div className="rounded-2xl border border-[hsl(30,20%,90%)] bg-white p-4 shadow-sm mb-4">
          <h1 className="font-baloo text-xl font-bold text-[hsl(20,50%,12%)]">
            {character.character_name}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 mb-3">
            {character.relation || character.role}
          </p>

          <div className="flex gap-2 flex-wrap">
            {/* Age category selector */}
            <Select value={ageCategory} onValueChange={(v) => setAgeCategory(v as AgeCategory)}>
              <SelectTrigger className="w-auto min-w-[120px] h-8 text-xs rounded-xl border-orange-200 bg-orange-50">
                <SelectValue>{ageBadge}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(['child', 'teen', 'adult', 'senior'] as AgeCategory[]).map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {AGE_LABELS[cat]?.[language] || AGE_LABELS[cat]?.de || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Gender selector */}
            <Select
              value={gender || 'none'}
              onValueChange={(v) => setGender(v === 'none' ? null : v as 'male' | 'female')}
            >
              <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs rounded-xl border-orange-200 bg-orange-50">
                <SelectValue>
                  {gender === 'male' ? '♂' : gender === 'female' ? '♀' : '⚪'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">♂ Männlich</SelectItem>
                <SelectItem value="female">♀ Weiblich</SelectItem>
                <SelectItem value="none">⚪ k.A.</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Slot pickers */}
        {visibleSlots.map(slot => (
          <AppearanceSlotPicker
            key={slot.key}
            slot={slot}
            value={data[slot.key]}
            onChange={(val) => handleChange(slot.key, val)}
            ageCategory={ageCategory}
            gender={gender}
            language={language}
          />
        ))}

        {/* Save button */}
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
            {saving ? '...' : `💾 ${t.appearanceSave || 'Speichern'}`}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
