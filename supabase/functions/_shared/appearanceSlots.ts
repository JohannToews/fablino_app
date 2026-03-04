/**
 * Fablino Avatar v2 — Slot-based appearance config.
 * appearance_data (JSONB) keys and options with anchor fragments for image prompts.
 * No DB queries, no UI; config-only.
 */

// ─── Interfaces ─────────────────────────────────────────────────────────────

export type AgeCategory = 'child' | 'teen' | 'adult' | 'senior';
export type SlotCategory = 'face' | 'hair' | 'body' | 'accessories' | 'details';
export type PickerType = 'color' | 'icon_carousel' | 'toggle' | 'size_slider' | 'button_group';

export interface AppearanceOption {
  value: string;
  label: Record<string, string>;
  icon?: string;
  hex?: string;
  anchorFragment: string;
}

export interface AppearanceSlot {
  key: string;
  label: Record<string, string>;
  category: SlotCategory;
  pickerType: PickerType;
  options: AppearanceOption[];
  availableFor: AgeCategory[];
  genderFilter?: ('male' | 'female' | null)[];
  phase: number;
  required: boolean;
}

/** What is stored in JSONB appearance_data: slot key → option value (string or boolean for toggle). */
export type AppearanceData = Record<string, string | boolean>;

// ─── Constants ─────────────────────────────────────────────────────────────

export const CURRENT_PHASE = 1;

// ─── Phase 1 Slots ──────────────────────────────────────────────────────────

const SLOT_SKIN_TONE: AppearanceSlot = {
  key: 'skin_tone',
  label: { de: 'Hautton', en: 'Skin tone' },
  category: 'face',
  pickerType: 'color',
  phase: 1,
  required: true,
  availableFor: ['child', 'teen', 'adult', 'senior'],
  options: [
    { value: 'light', label: { de: 'Hell', en: 'Light' }, hex: '#FDDBB4', anchorFragment: 'light skin' },
    { value: 'medium_light', label: { de: 'Hell-Mittel', en: 'Light medium' }, hex: '#E8B88A', anchorFragment: 'light-medium skin' },
    { value: 'medium', label: { de: 'Mittel', en: 'Medium' }, hex: '#C68E6A', anchorFragment: 'medium skin tone' },
    { value: 'medium_dark', label: { de: 'Mittel-Dunkel', en: 'Medium dark' }, hex: '#A0674B', anchorFragment: 'medium-dark skin' },
    { value: 'dark', label: { de: 'Dunkel', en: 'Dark' }, hex: '#6B3F2E', anchorFragment: 'dark skin' },
  ],
};

const SLOT_EYE_COLOR: AppearanceSlot = {
  key: 'eye_color',
  label: { de: 'Augenfarbe', en: 'Eye color' },
  category: 'face',
  pickerType: 'color',
  phase: 1,
  required: false,
  availableFor: ['child', 'teen', 'adult', 'senior'],
  options: [
    { value: 'brown', label: { de: 'Braun', en: 'Brown' }, anchorFragment: 'brown eyes' },
    { value: 'dark_brown', label: { de: 'Dunkelbraun', en: 'Dark brown' }, anchorFragment: 'dark brown eyes' },
    { value: 'green', label: { de: 'Grün', en: 'Green' }, anchorFragment: 'green eyes' },
    { value: 'blue', label: { de: 'Blau', en: 'Blue' }, anchorFragment: 'blue eyes' },
    { value: 'gray', label: { de: 'Grau', en: 'Gray' }, anchorFragment: 'gray eyes' },
    { value: 'hazel', label: { de: 'Haselnuss', en: 'Hazel' }, anchorFragment: 'hazel eyes' },
  ],
};

const SLOT_GLASSES: AppearanceSlot = {
  key: 'glasses',
  label: { de: 'Brille', en: 'Glasses' },
  category: 'face',
  pickerType: 'toggle',
  phase: 1,
  required: false,
  availableFor: ['child', 'teen', 'adult', 'senior'],
  options: [
    { value: 'false', label: { de: 'Keine', en: 'None' }, anchorFragment: '' },
    { value: 'true', label: { de: 'Brille', en: 'Glasses' }, anchorFragment: 'wearing glasses' },
  ],
};

const SLOT_HAIR_COLOR: AppearanceSlot = {
  key: 'hair_color',
  label: { de: 'Haarfarbe', en: 'Hair color' },
  category: 'hair',
  pickerType: 'color',
  phase: 1,
  required: true,
  availableFor: ['child', 'teen', 'adult', 'senior'],
  options: [
    { value: 'black', label: { de: 'Schwarz', en: 'Black' }, anchorFragment: 'black hair' },
    { value: 'dark_brown', label: { de: 'Dunkelbraun', en: 'Dark brown' }, anchorFragment: 'dark brown hair' },
    { value: 'brown', label: { de: 'Braun', en: 'Brown' }, anchorFragment: 'brown hair' },
    { value: 'light_brown', label: { de: 'Hellbraun', en: 'Light brown' }, anchorFragment: 'light brown hair' },
    { value: 'blonde', label: { de: 'Blond', en: 'Blonde' }, anchorFragment: 'blonde hair' },
    { value: 'light_blonde', label: { de: 'Hellblond', en: 'Light blonde' }, anchorFragment: 'light blonde hair' },
    { value: 'red', label: { de: 'Rot', en: 'Red' }, anchorFragment: 'red hair' },
    { value: 'auburn', label: { de: 'Kastanienbraun', en: 'Auburn' }, anchorFragment: 'auburn hair' },
    { value: 'ginger', label: { de: 'Ingwer', en: 'Ginger' }, anchorFragment: 'ginger hair' },
    { value: 'gray', label: { de: 'Grau', en: 'Gray' }, anchorFragment: 'gray hair' },
    { value: 'white', label: { de: 'Weiß', en: 'White' }, anchorFragment: 'white hair' },
    { value: 'silver', label: { de: 'Silber', en: 'Silver' }, anchorFragment: 'silver hair' },
  ],
};

const SLOT_HAIR_TYPE: AppearanceSlot = {
  key: 'hair_type',
  label: { de: 'Haartyp', en: 'Hair type' },
  category: 'hair',
  pickerType: 'button_group',
  phase: 1,
  required: true,
  availableFor: ['child', 'teen', 'adult', 'senior'],
  options: [
    { value: 'straight', label: { de: 'Glatt', en: 'Straight' }, anchorFragment: 'straight' },
    { value: 'wavy', label: { de: 'Wellig', en: 'Wavy' }, anchorFragment: 'wavy' },
    { value: 'curly', label: { de: 'Lockig', en: 'Curly' }, anchorFragment: 'curly' },
    { value: 'tight_curly', label: { de: 'Krauses', en: 'Tight curly' }, anchorFragment: 'tight curly' },
    { value: 'coily', label: { de: 'Afro', en: 'Coily' }, anchorFragment: 'afro-textured' },
  ],
};

const SLOT_HAIR_LENGTH: AppearanceSlot = {
  key: 'hair_length',
  label: { de: 'Haarlänge', en: 'Hair length' },
  category: 'hair',
  pickerType: 'button_group',
  phase: 1,
  required: true,
  availableFor: ['child', 'teen', 'adult', 'senior'],
  options: [
    { value: 'very_short', label: { de: 'Sehr kurz', en: 'Very short' }, anchorFragment: 'very short' },
    { value: 'short', label: { de: 'Kurz', en: 'Short' }, anchorFragment: 'short' },
    { value: 'medium', label: { de: 'Mittel', en: 'Medium' }, anchorFragment: 'medium-length' },
    { value: 'long', label: { de: 'Lang', en: 'Long' }, anchorFragment: 'long' },
    { value: 'very_long', label: { de: 'Sehr lang', en: 'Very long' }, anchorFragment: 'very long' },
  ],
};

const SLOT_HAIR_STYLE: AppearanceSlot = {
  key: 'hair_style',
  label: { de: 'Frisur', en: 'Hair style' },
  category: 'hair',
  pickerType: 'button_group',
  phase: 1,
  required: true,
  availableFor: ['child', 'teen', 'adult', 'senior'],
  options: [
    // ── All ages, all genders ──
    { value: 'loose', label: { de: 'Offen', en: 'Loose' }, anchorFragment: 'worn loose' },
    { value: 'side_part', label: { de: 'Seitenscheitel', en: 'Side part' }, anchorFragment: 'with a side part' },
    { value: 'ponytail', label: { de: 'Pferdeschwanz', en: 'Ponytail' }, anchorFragment: 'in a ponytail' },
    { value: 'braids', label: { de: 'Zöpfe', en: 'Braids' }, anchorFragment: 'in braids' },
    { value: 'two_braids', label: { de: 'Zwei Zöpfe', en: 'Two braids' }, anchorFragment: 'in two braids' },
    { value: 'bun', label: { de: 'Dutt', en: 'Bun' }, anchorFragment: 'in a bun' },
    { value: 'bob', label: { de: 'Bob', en: 'Bob' }, anchorFragment: 'bob cut' },
    { value: 'afro', label: { de: 'Afro', en: 'Afro' }, anchorFragment: 'afro hairstyle' },
    { value: 'afro_puffs', label: { de: 'Afro Puffs', en: 'Afro puffs' }, anchorFragment: 'in afro puffs' },
    { value: 'twist_out', label: { de: 'Twist-Out', en: 'Twist out' }, anchorFragment: 'twist-out style' },
    { value: 'buzz_cut', label: { de: 'Buzz Cut', en: 'Buzz cut' }, anchorFragment: 'buzz cut' },
    // ── child + teen only ──
    { value: 'pigtails', label: { de: 'Zöpfchen', en: 'Pigtails' }, anchorFragment: 'in pigtails' },
    // ── adult + senior, female ──
    { value: 'updo', label: { de: 'Hochsteckfrisur', en: 'Updo' }, anchorFragment: 'in an elegant updo' },
    { value: 'low_bun', label: { de: 'Tiefer Dutt', en: 'Low bun' }, anchorFragment: 'in a low bun' },
    { value: 'pixie_cut', label: { de: 'Pixie Cut', en: 'Pixie cut' }, anchorFragment: 'pixie cut' },
    { value: 'shoulder_layered', label: { de: 'Stufenschnitt', en: 'Shoulder layered' }, anchorFragment: 'layered shoulder-length cut' },
    // ── adult + senior, male ──
    { value: 'slicked_back', label: { de: 'Nach hinten', en: 'Slicked back' }, anchorFragment: 'slicked back' },
    { value: 'crew_cut', label: { de: 'Crew Cut', en: 'Crew cut' }, anchorFragment: 'crew cut' },
    { value: 'comb_over', label: { de: 'Rübergekämmt', en: 'Comb over' }, anchorFragment: 'combed over to one side' },
    // ── adult + senior, male (hair loss) ──
    { value: 'receding', label: { de: 'Geheimratsecken', en: 'Receding' }, anchorFragment: 'with a receding hairline' },
    { value: 'bald_top', label: { de: 'Halbglatze', en: 'Bald on top' }, anchorFragment: 'bald on top with hair on the sides' },
    { value: 'bald', label: { de: 'Glatze', en: 'Bald' }, anchorFragment: 'bald head' },
    // ── senior, female ──
    { value: 'short_permed', label: { de: 'Dauerwelle', en: 'Short permed' }, anchorFragment: 'short permed curls' },
    { value: 'low_bun_senior', label: { de: 'Oma-Dutt', en: 'Low bun with wisps' }, anchorFragment: 'in a low bun with wisps at the temples' },
    // ── senior, male ──
    { value: 'thin_side_part', label: { de: 'Dünner Scheitel', en: 'Thin side part' }, anchorFragment: 'thin sparse hair with a side part' },
    { value: 'white_buzz', label: { de: 'Kurz geschoren', en: 'Short buzzed' }, anchorFragment: 'very short buzzed thin hair' },
  ],
};

const SLOT_BODY_TYPE: AppearanceSlot = {
  key: 'body_type',
  label: { de: 'Körperstatur', en: 'Body type' },
  category: 'body',
  pickerType: 'button_group',
  phase: 1,
  required: false,
  availableFor: ['child', 'teen', 'adult', 'senior'],
  options: [
    { value: 'slim', label: { de: 'Schlank', en: 'Slim' }, anchorFragment: 'slim build' },
    { value: 'average', label: { de: 'Normal', en: 'Average' }, anchorFragment: 'average build' },
    { value: 'stocky', label: { de: 'Kräftig', en: 'Stocky' }, anchorFragment: 'stocky build' },
  ],
};

const SLOT_FACIAL_HAIR: AppearanceSlot = {
  key: 'facial_hair',
  label: { de: 'Bart', en: 'Facial hair' },
  category: 'details',
  pickerType: 'button_group',
  phase: 1,
  required: false,
  availableFor: ['adult', 'senior'],
  genderFilter: ['male'],
  options: [
    { value: 'none', label: { de: 'Kein Bart', en: 'None' }, anchorFragment: '' },
    { value: 'stubble', label: { de: 'Dreitagebart', en: 'Stubble' }, anchorFragment: 'with stubble' },
    { value: 'short_beard', label: { de: 'Kurzbart', en: 'Short beard' }, anchorFragment: 'with a short beard' },
    { value: 'full_beard', label: { de: 'Vollbart', en: 'Full beard' }, anchorFragment: 'with a full beard' },
    { value: 'mustache', label: { de: 'Schnurrbart', en: 'Mustache' }, anchorFragment: 'with a mustache' },
  ],
};

export const APPEARANCE_SLOTS: AppearanceSlot[] = [
  SLOT_SKIN_TONE,
  SLOT_EYE_COLOR,
  SLOT_GLASSES,
  SLOT_HAIR_COLOR,
  SLOT_HAIR_TYPE,
  SLOT_HAIR_LENGTH,
  SLOT_HAIR_STYLE,
  SLOT_BODY_TYPE,
  SLOT_FACIAL_HAIR,
];

// ─── Filtering ──────────────────────────────────────────────────────────────

const HAIR_COLOR_AGE_RESTRICTED = new Set(['gray', 'white', 'silver']);

const HAIR_STYLE_BASE = new Set([
  'loose', 'side_part', 'ponytail', 'braids', 'two_braids', 'bun', 'bob',
  'afro', 'afro_puffs', 'twist_out', 'buzz_cut',
]);
const HAIR_STYLE_CHILD_TEEN_ONLY = new Set(['pigtails']);
const HAIR_STYLE_ADULT_FEMALE = new Set(['updo', 'low_bun', 'pixie_cut', 'shoulder_layered']);
const HAIR_STYLE_SENIOR_FEMALE = new Set(['short_permed', 'low_bun_senior']);
const HAIR_STYLE_ADULT_MALE = new Set(['slicked_back', 'crew_cut', 'comb_over', 'receding', 'bald_top', 'bald']);
const HAIR_STYLE_SENIOR_MALE = new Set(['thin_side_part', 'white_buzz']);

/**
 * Returns options for a slot given age category and gender.
 * Applies availableFor, genderFilter, and special rules for hair_color / hair_style.
 */
export function getFilteredOptions(
  slot: AppearanceSlot,
  ageCategory: AgeCategory,
  gender: 'male' | 'female' | null
): AppearanceOption[] {
  if (!slot.availableFor.includes(ageCategory)) {
    return [];
  }
  if (slot.genderFilter != null && slot.genderFilter.length > 0) {
    const allowed = slot.genderFilter.includes(gender);
    if (!allowed) return [];
  }

  let options = slot.options;

  if (slot.key === 'hair_color') {
    const isAdultOrSenior = ageCategory === 'adult' || ageCategory === 'senior';
    if (!isAdultOrSenior) {
      options = options.filter((opt) => !HAIR_COLOR_AGE_RESTRICTED.has(opt.value));
    }
  }

  if (slot.key === 'hair_style') {
    const isChildOrTeen = ageCategory === 'child' || ageCategory === 'teen';
    const isAdultOrSenior = ageCategory === 'adult' || ageCategory === 'senior';
    const isSenior = ageCategory === 'senior';

    const allowed = new Set(HAIR_STYLE_BASE);

    if (isChildOrTeen) {
      for (const v of HAIR_STYLE_CHILD_TEEN_ONLY) allowed.add(v);
    }

    if (isAdultOrSenior) {
      if (gender === 'female') {
        for (const v of HAIR_STYLE_ADULT_FEMALE) allowed.add(v);
        if (isSenior) {
          for (const v of HAIR_STYLE_SENIOR_FEMALE) allowed.add(v);
        }
      } else if (gender === 'male') {
        for (const v of HAIR_STYLE_ADULT_MALE) allowed.add(v);
        if (isSenior) {
          for (const v of HAIR_STYLE_SENIOR_MALE) allowed.add(v);
        }
      } else {
        // gender === null → show all adult/senior options
        for (const v of HAIR_STYLE_ADULT_FEMALE) allowed.add(v);
        for (const v of HAIR_STYLE_ADULT_MALE) allowed.add(v);
        if (isSenior) {
          for (const v of HAIR_STYLE_SENIOR_FEMALE) allowed.add(v);
          for (const v of HAIR_STYLE_SENIOR_MALE) allowed.add(v);
        }
      }
    }

    options = options.filter((opt) => allowed.has(opt.value));
  }

  return options;
}

// ─── Age & gender inference ─────────────────────────────────────────────────

const SENIOR_RELATIONS = [
  'Oma', 'Opa', 'Grand-mère', 'Grand-père', 'Grandma', 'Grandpa',
  'Abuela', 'Abuelo', 'Nonna', 'Nonno', 'Babcia', 'Dziadek', 'Бабуся', 'Дідусь',
];
const PARENT_RELATIONS = [
  'Mama', 'Papa', 'Maman', 'Mom', 'Dad', 'Mamá', 'Papá',
  'Mamma', 'Papà', 'Мама', 'Тато',
];
const SIBLING_RELATIONS = [
  'Bruder', 'Schwester', 'Frère', 'Sœur', 'Brother', 'Sister',
  'Hermano', 'Hermana', 'Brat', 'Sestra',
];

function matchesOne(relation: string | null | undefined, list: string[]): boolean {
  if (relation == null || relation === '') return false;
  const r = relation.trim().toLowerCase();
  return list.some((x) => x.toLowerCase() === r);
}

/**
 * Infers age category from role and relation (e.g. for character_appearances).
 */
export function inferAgeCategory(
  role: string,
  relation: string | null | undefined
): AgeCategory {
  const rel = relation?.trim() ?? '';
  const roleLower = role.trim().toLowerCase();
  if (matchesOne(rel, SENIOR_RELATIONS)) return 'senior';
  if (matchesOne(rel, PARENT_RELATIONS)) return 'adult';
  if (matchesOne(rel, SIBLING_RELATIONS)) return 'child';
  if (roleLower === 'friend') return 'child';
  return 'adult';
}

const MALE_RELATIONS = [
  'Papa', 'Opa', 'Dad', 'Grandpa', 'Grand-père', 'Abuelo', 'Papá', 'Nonno', 'Dziadek', 'Тато', 'Дідусь',
  'Bruder', 'Frère', 'Brother', 'Hermano', 'Brat',
];
const FEMALE_RELATIONS = [
  'Mama', 'Oma', 'Mom', 'Grandma', 'Grand-mère', 'Abuela', 'Mamá', 'Nonna', 'Babcia', 'Мама', 'Бабуся',
  'Schwester', 'Sœur', 'Sister', 'Hermana', 'Sestra',
];

/**
 * Infers gender from relation string when possible.
 */
export function inferGenderFromRelation(relation: string | null | undefined): 'male' | 'female' | null {
  if (relation == null || relation === '') return null;
  const r = relation.trim().toLowerCase();
  if (MALE_RELATIONS.some((x) => x.toLowerCase() === r)) return 'male';
  if (FEMALE_RELATIONS.some((x) => x.toLowerCase() === r)) return 'female';
  return null;
}
