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
  kidProfileId: string;
  kidName: string;
}

/** A deduplicated person card combining kid_characters + optional appearance */
interface PersonCard {
  /** Dedup key: name__relation */
  key: string;
  name: string;
  role: string;
  relation: string | null;
  age: number | null;
  ageCategory: AgeCategory;
  gender: 'male' | 'female' | null;
  /** If set, this person has appearance data */
  characterAppearanceId: string | null;
  /** Full appearance row (if loaded) */
  appearance: CharacterAppearance | null;
  /** Which kids use this character */
  usedByKids: LinkedKid[];
  /** All kid_characters row IDs for this person */
  kidCharacterIds: string[];
}

// ─── Relation options ───────────────────────────────────────────────────────

const RELATION_KEYS = [
  { key: 'Mama', translationKey: 'myPeopleRelationMom' as const, role: 'family' },
  { key: 'Papa', translationKey: 'myPeopleRelationDad' as const, role: 'family' },
  { key: 'Oma', translationKey: 'myPeopleRelationGrandma' as const, role: 'family' },
  { key: 'Opa', translationKey: 'myPeopleRelationGrandpa' as const, role: 'family' },
  { key: 'Bruder', translationKey: 'myPeopleRelationBrother' as const, role: 'family' },
  { key: 'Schwester', translationKey: 'myPeopleRelationSister' as const, role: 'family' },
  { key: 'Tante', translationKey: 'myPeopleRelationAunt' as const, role: 'family' },
  { key: 'Onkel', translationKey: 'myPeopleRelationUncle' as const, role: 'family' },
  { key: 'Cousin', translationKey: 'myPeopleRelationCousinM' as const, role: 'family' },
  { key: 'Cousine', translationKey: 'myPeopleRelationCousinF' as const, role: 'family' },
  { key: 'Freund', translationKey: 'myPeopleRelationFriendM' as const, role: 'friend' },
  { key: 'Freundin', translationKey: 'myPeopleRelationFriendF' as const, role: 'friend' },
  { key: 'Sonstige', translationKey: 'myPeopleRelationOther' as const, role: 'friend' },
];

// ─── Age category labels ────────────────────────────────────────────────────

// Age category labels - now use translation keys
const AGE_CATEGORY_KEYS: Record<string, string> = {
  child: 'myPeopleAgeChild',
  teen: 'myPeopleAgeTeen',
  adult: 'myPeopleAgeAdult',
  senior: 'myPeopleAgeSenior',
};

// ─── Main Component ─────────────────────────────────────────────────────────

type Screen = 'overview' | 'editor';

export default function MyPeoplePage() {
  const { user } = useAuth();
  const { kidProfiles, kidAppLanguage } = useKidProfile();
  const lang = (kidAppLanguage || 'de') as Language;
  const t = getTranslations(lang);
  const userId = user?.id;

  const [persons, setPersons] = useState<PersonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>('overview');
  const [editingChar, setEditingChar] = useState<CharacterAppearance | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // ─── Load & deduplicate characters ──────────────────────────────────────

  const loadCharacters = useCallback(async () => {
    if (!userId || kidProfiles.length === 0) {
      setPersons([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const kidIds = kidProfiles.map(p => p.id);

      // 1. All kid_characters for this user's kids
      const { data: allChars, error: charsErr } = await (supabase as any)
        .from('kid_characters')
        .select('id, kid_profile_id, name, role, relation, age, description, is_active, character_appearance_id')
        .in('kid_profile_id', kidIds)
        .eq('is_active', true);

      if (charsErr) {
        console.error('[MyPeoplePage] kid_characters load error:', charsErr.message);
      }

      // 2. All character_appearances for this user
      const { data: allAppearances, error: appErr } = await (supabase as any)
        .from('character_appearances')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (appErr) {
        console.error('[MyPeoplePage] character_appearances load error:', appErr.message);
      }

      const appearanceMap = new Map<string, CharacterAppearance>();
      for (const a of (allAppearances || [])) {
        appearanceMap.set(a.id, a as CharacterAppearance);
      }

      // 3. Deduplicate kid_characters by (name + relation)
      const personMap = new Map<string, PersonCard>();

      for (const char of (allChars || [])) {
        const key = `${(char.name || '').trim().toLowerCase()}__${(char.relation || '').trim().toLowerCase()}`;
        const kidName = kidProfiles.find(p => p.id === char.kid_profile_id)?.name || '?';

        if (!personMap.has(key)) {
          const ageCat = inferAgeCategory(char.role || 'friend', char.relation);
          const gender = inferGenderFromRelation(char.relation);

          // Check if character_appearance_id points to an existing appearance
          let validAppearanceId: string | null = null;
          let appearance: CharacterAppearance | null = null;
          if (char.character_appearance_id && appearanceMap.has(char.character_appearance_id)) {
            validAppearanceId = char.character_appearance_id;
            appearance = appearanceMap.get(char.character_appearance_id) || null;
          }

          personMap.set(key, {
            key,
            name: char.name,
            role: char.role || 'friend',
            relation: char.relation,
            age: char.age,
            ageCategory: ageCat,
            gender,
            characterAppearanceId: validAppearanceId,
            appearance,
            usedByKids: [],
            kidCharacterIds: [],
          });
        }

        const person = personMap.get(key)!;
        person.usedByKids.push({ kidProfileId: char.kid_profile_id, kidName });
        person.kidCharacterIds.push(char.id);

        // If this entry has a valid appearance and the person doesn't yet, adopt it
        if (char.character_appearance_id && appearanceMap.has(char.character_appearance_id) && !person.characterAppearanceId) {
          person.characterAppearanceId = char.character_appearance_id;
          person.appearance = appearanceMap.get(char.character_appearance_id) || null;
        }
      }

      // 4. Also include character_appearances that have NO kid_characters link (orphaned appearances)
      const linkedAppIds = new Set<string>();
      for (const p of personMap.values()) {
        if (p.characterAppearanceId) linkedAppIds.add(p.characterAppearanceId);
      }
      for (const [appId, app] of appearanceMap.entries()) {
        if (!linkedAppIds.has(appId)) {
          const key = `${(app.character_name || '').trim().toLowerCase()}__${(app.relation || '').trim().toLowerCase()}`;
          if (!personMap.has(key)) {
            personMap.set(key, {
              key,
              name: app.character_name,
              role: app.role,
              relation: app.relation,
              age: null,
              ageCategory: (app.age_category as AgeCategory) || 'adult',
              gender: app.gender as 'male' | 'female' | null,
              characterAppearanceId: app.id,
              appearance: app,
              usedByKids: [],
              kidCharacterIds: [],
            });
          }
        }
      }

      const sorted = Array.from(personMap.values()).sort((a, b) => {
        // Family first, then friends
        if (a.role === 'family' && b.role !== 'family') return -1;
        if (a.role !== 'family' && b.role === 'family') return 1;
        return a.name.localeCompare(b.name);
      });

      setPersons(sorted);
    } catch (err) {
      console.error('[MyPeoplePage] loadCharacters crashed:', err);
      setPersons([]);
    } finally {
      setLoading(false);
    }
  }, [userId, kidProfiles]);

  useEffect(() => { loadCharacters(); }, [loadCharacters]);

  // ─── Create appearance for a person that doesn't have one ──────────────

  const createAppearanceForPerson = async (person: PersonCard) => {
    if (!userId) return;

    const { data: newApp, error } = await (supabase as any)
      .from('character_appearances')
      .insert({
        user_id: userId,
        character_name: person.name,
        role: person.role,
        relation: person.relation,
        age_category: person.ageCategory,
        gender: person.gender,
        appearance_data: {},
        is_active: true,
      })
      .select()
      .single();

    if (error || !newApp) {
      console.error('[MyPeoplePage] Create appearance error:', error?.message);
      toast.error(t.myPeopleCreateError);
      return;
    }

    // Link all kid_characters of this person
    if (person.kidCharacterIds.length > 0) {
      await (supabase as any)
        .from('kid_characters')
        .update({ character_appearance_id: newApp.id })
        .in('id', person.kidCharacterIds);
    }

    // Navigate to editor
    setEditingChar(newApp as CharacterAppearance);
    setScreen('editor');
  };

  // ─── Navigate to editor ─────────────────────────────────────────────────

  const openEditor = (person: PersonCard) => {
    if (person.appearance) {
      setEditingChar(person.appearance);
      setScreen('editor');
    } else {
      createAppearanceForPerson(person);
    }
  };

  const openEditorDirect = (char: CharacterAppearance) => {
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
      persons={persons}
      kidProfiles={kidProfiles}
      loading={loading}
      language={lang}
      userId={userId || ''}
      onEdit={openEditor}
      onEditDirect={openEditorDirect}
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
  persons: PersonCard[];
  kidProfiles: any[];
  loading: boolean;
  language: string;
  userId: string;
  onEdit: (p: PersonCard) => void;
  onEditDirect: (c: CharacterAppearance) => void;
  onAdd: () => void;
  onRefresh: () => void;
  t: any;
  showAddDialog: boolean;
  setShowAddDialog: (v: boolean) => void;
}

function OverviewScreen({
  persons, kidProfiles, loading, language, userId,
  onEdit, onEditDirect, onAdd, onRefresh, t, showAddDialog, setShowAddDialog,
}: OverviewProps) {
  const familyPersons = persons.filter(p => p.role === 'family');
  const friendPersons = persons.filter(p => p.role !== 'family');

  const getAgeBadge = (cat: string) => {
    const key = AGE_CATEGORY_KEYS[cat] || AGE_CATEGORY_KEYS.adult;
    return (t as any)[key] || cat;
  };

  const getGenderIcon = (gender: 'male' | 'female' | null, ageCategory: string) => {
    if (ageCategory === 'senior') return gender === 'male' ? '👴' : gender === 'female' ? '👵' : '🧓';
    if (ageCategory === 'adult') return gender === 'male' ? '👨' : gender === 'female' ? '👩' : '🧑';
    return gender === 'male' ? '👦' : gender === 'female' ? '👧' : '🧒';
  };

  const getAppearancePreview = (app: CharacterAppearance | null) => {
    if (!app?.appearance_data || typeof app.appearance_data !== 'object') return null;
    const data = app.appearance_data as AppearanceData;
    if (Object.keys(data).length === 0) return null;
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
    return parts.length > 0 ? parts.slice(0, 4).join(', ') + (parts.length > 4 ? '…' : '') : null;
  };

  const renderPersonCard = (person: PersonCard) => {
    const preview = getAppearancePreview(person.appearance);
    const hasAppearance = !!person.characterAppearanceId && preview !== null;
    const hasAppearanceNoData = !!person.characterAppearanceId && preview === null;

    return (
      <motion.div
        key={person.key}
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[hsl(30,20%,90%)] bg-white p-4 shadow-sm"
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-[hsl(20,50%,12%)] text-base">
              {getGenderIcon(person.gender, person.ageCategory)} {person.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {person.relation || person.role}
            </p>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-[hsl(30,80%,30%)]">
            {getAgeBadge(person.ageCategory)}
          </span>
        </div>

        {hasAppearance ? (
          <p className="text-xs text-emerald-600 mb-2 flex items-center gap-1">
            ✅ <span>{preview}</span>
          </p>
        ) : hasAppearanceNoData ? (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-2">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{t.myPeopleAppearanceIncomplete}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-2">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{t.myPeopleNoAppearance}</span>
          </div>
        )}

        {person.usedByKids.length > 0 && (
          <p className="text-xs text-muted-foreground mb-2">
            {t.myPeopleUsedBy} {person.usedByKids.map(k => k.kidName).join(', ')}
          </p>
        )}

        <button
          onClick={() => onEdit(person)}
          className="flex items-center gap-1 text-sm font-medium text-[#F97316] hover:text-[#EA6C10] transition-colors"
        >
          {hasAppearance || hasAppearanceNoData ? t.myPeopleEditAppearance : t.myPeopleDefineAppearance}
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
          message={t.myPeopleHeaderMessage}
          mascotSize="sm"
          showBackButton
          backTo="/"
        />

        <h1 className="font-baloo text-xl font-bold text-[hsl(20,50%,12%)] mb-6">
          {t.myPeople}
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-muted-foreground">{t.loading}</span>
          </div>
        ) : persons.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-16 text-center"
          >
            <img src="/mascot/5_new_story.png" alt="Fablino" className="w-24 h-24 mb-4 object-contain" />
            <p className="text-muted-foreground text-sm mb-2">
              {t.myPeopleEmpty}
            </p>
            <p className="text-muted-foreground text-xs mb-6 max-w-xs">
              {t.myPeopleEmptyHint}
            </p>
            <Button onClick={onAdd} className="bg-[#F97316] hover:bg-[#EA6C10] text-white rounded-2xl gap-2">
              <UserPlus className="w-4 h-4" />
              {t.myPeopleAddPerson}
            </Button>
          </motion.div>
        ) : (
          <>
            {familyPersons.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-[#F97316]" />
                  <h2 className="text-sm font-semibold text-[hsl(20,50%,12%)]">{t.myPeopleFamily}</h2>
                  <span className="text-xs text-muted-foreground">({familyPersons.length})</span>
                </div>
                <div className="space-y-3">
                  {familyPersons.map(renderPersonCard)}
                </div>
              </div>
            )}

            {friendPersons.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🧒</span>
                  <h2 className="text-sm font-semibold text-[hsl(20,50%,12%)]">{t.myPeopleFriends}</h2>
                  <span className="text-xs text-muted-foreground">({friendPersons.length})</span>
                </div>
                <div className="space-y-3">
                  {friendPersons.map(renderPersonCard)}
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
        t={t}
        onCreated={(char) => {
          setShowAddDialog(false);
          onRefresh();
        }}
        onEdit={(char) => {
          setShowAddDialog(false);
          onEditDirect(char);
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
  t: any;
}

function AddPersonDialog({ open, onOpenChange, userId, kidProfiles, language, onCreated, onEdit, t }: AddPersonDialogProps) {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [selectedKids, setSelectedKids] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setRelation('');
      setGender(null);
      setSelectedKids(kidProfiles.map(k => k.id));
    }
  }, [open, kidProfiles]);

  useEffect(() => {
    if (relation) {
      const detected = inferGenderFromRelation(relation);
      setGender(detected);
    }
  }, [relation]);

  const roleForRelation = RELATION_KEYS.find(r => r.key === relation)?.role || 'friend';

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
      toast.error(t.myPeopleAddError);
      setSaving(false);
      return;
    }

    // 2. Link to selected kid_profiles
    for (const kidId of selectedKids) {
      const { data: existing } = await (supabase as any)
        .from('kid_characters')
        .select('id')
        .eq('kid_profile_id', kidId)
        .eq('name', name.trim())
        .eq('is_active', true)
        .maybeSingle();

      if (existing) {
        await (supabase as any)
          .from('kid_characters')
          .update({ character_appearance_id: newChar.id })
          .eq('id', existing.id);
      } else {
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
    toast.success(t.myPeoplePersonAdded);
    onEdit(newChar as CharacterAppearance);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[hsl(20,50%,12%)]">{t.myPeopleAddPerson}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="char-name" className="text-sm font-medium">{t.myPeopleNameLabel} *</Label>
            <Input
              id="char-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.myPeopleNamePlaceholder}
              className="mt-1 rounded-xl"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">{t.myPeopleRelationLabel} *</Label>
            <Select value={relation} onValueChange={setRelation}>
              <SelectTrigger className="mt-1 rounded-xl">
                <SelectValue placeholder={t.myPeopleSelectPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {RELATION_KEYS.map(opt => (
                  <SelectItem key={opt.key} value={opt.key}>{(t as any)[opt.translationKey]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">{t.myPeopleGenderLabel}</Label>
            <div className="flex gap-2 mt-1">
              {([
                { val: 'male' as const, label: t.myPeopleGenderMale },
                { val: 'female' as const, label: t.myPeopleGenderFemale },
                { val: null, label: t.myPeopleGenderNone },
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
              <Label className="text-sm font-medium">{t.myPeopleForWhichKids}</Label>
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
            {saving ? '...' : t.myPeopleAddAndDefine}
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
      toast.error(t.myPeopleSaveError);
      return;
    }
    setSavedData({ ...data });
    toast.success(t.appearanceSaved || 'Gespeichert! ✨');
  };

  const visibleSlots = APPEARANCE_SLOTS.filter(s => s.phase <= CURRENT_PHASE);

  const ageBadge = (t as any)[AGE_CATEGORY_KEYS[ageCategory] || 'myPeopleAgeAdult'] || ageCategory;

  return (
    <div className="min-h-screen bg-[hsl(40,20%,98%)] pb-24">
      <div className="max-w-lg mx-auto px-4 pt-2">
        <FablinoPageHeader
          mascotImage="/mascot/6_Onboarding.png"
          message={t.myPeopleEditorHeader.replace('{name}', character.character_name)}
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
            <Select value={ageCategory} onValueChange={(v) => setAgeCategory(v as AgeCategory)}>
              <SelectTrigger className="w-auto min-w-[120px] h-8 text-xs rounded-xl border-orange-200 bg-orange-50">
                <SelectValue>{ageBadge}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(['child', 'teen', 'adult', 'senior'] as AgeCategory[]).map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {(t as any)[AGE_CATEGORY_KEYS[cat] || 'myPeopleAgeAdult'] || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
                <SelectItem value="male">{t.myPeopleGenderMale}</SelectItem>
                <SelectItem value="female">{t.myPeopleGenderFemale}</SelectItem>
                <SelectItem value="none">{t.myPeopleGenderNone}</SelectItem>
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
