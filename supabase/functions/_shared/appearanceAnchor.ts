/**
 * Build an English appearance description for the image generation character_anchor.
 * Used when the kid has set "Mein Look" so they appear like themselves in story illustrations.
 */
export function buildAppearanceAnchor(
  kidName: string,
  kidAge: number,
  kidGender: string,
  appearance: {
    skin_tone: string;
    hair_length: string;
    hair_type: string;
    hair_style: string;
    hair_color: string;
    glasses: boolean;
    eye_color?: string;
  } | null
): string {
  // Normalize so m/boy/male → boy, f/girl/female → girl (kid_profiles may send "m"/"f" or caller may pass "child" when missing)
  const normalized =
    kidGender === "male" || kidGender === "m" || kidGender === "boy"
      ? "male"
      : kidGender === "female" || kidGender === "f" || kidGender === "girl"
        ? "female"
        : "";
  const genderWord = normalized === "female" ? "girl" : normalized === "male" ? "boy" : "child";
  if (!appearance) {
    return `${kidAge}-year-old ${genderWord} named ${kidName}`;
  }

  const parts: string[] = [];
  const genderAdj = normalized === "female" ? "girlish" : normalized === "male" ? "boyish" : "";
  parts.push(genderAdj ? `${kidAge}-year-old ${genderWord} with a ${genderAdj} face` : `${kidAge}-year-old ${genderWord}`);

  const skinMap: Record<string, string> = {
    light: "very fair, light skin",
    medium_light: "light-medium skin",
    medium: "medium brown skin tone",
    medium_dark: "deep brown, medium-dark skin",
    dark: "very dark brown, deep ebony skin",
  };
  if (appearance.skin_tone && skinMap[appearance.skin_tone]) {
    parts.push(`${skinMap[appearance.skin_tone]}`);
  }

  // Eye color
  const eyeMap: Record<string, string> = {
    brown: "brown eyes",
    dark_brown: "dark brown eyes",
    green: "green eyes",
    blue: "blue eyes",
    gray: "gray eyes",
  };
  if (appearance.eye_color && eyeMap[appearance.eye_color]) {
    parts.push(eyeMap[appearance.eye_color]);
  }

  const lengthMap: Record<string, string> = {
    very_short: "very short",
    short: "short",
    medium: "medium-length",
    long: "long",
    very_long: "very long",
  };
  const typeMap: Record<string, string> = {
    straight: "straight",
    wavy: "wavy",
    curly: "curly",
    tight_curly: "tight curly",
    coily: "afro-textured",
  };
  const colorMap: Record<string, string> = {
    black: "black",
    dark_brown: "dark brown",
    brown: "brown",
    light_brown: "light brown",
    blonde: "blonde",
    light_blonde: "light blonde",
    red: "red",
    auburn: "auburn",
    ginger: "ginger",
  };

  const hairLength = lengthMap[appearance.hair_length] || "";
  const hairType = typeMap[appearance.hair_type] || "";
  const hairColor = colorMap[appearance.hair_color] || "";

  // Build hair description using style anchor templates
  // Import style mapping for anchor generation
  const styleAnchors: Record<string, string> = {
    // Girl styles
    loose: `loose ${hairType}`,
    braid: `braided ${hairType}`,
    ponytail: `${hairType} in a ponytail`,
    bob: `bob cut with ${hairType}`,
    half_up: `half-up ${hairType}`,
    two_braids: `${hairType} in two braids`,
    updo: `${hairType} in an updo`,
    short_afro: "short afro",
    afro: "afro hairstyle",
    afro_puffs: "afro puffs",
    braids: "braided hair",
    // Boy styles
    short: `short ${hairType}`,
    side_part: `side-parted ${hairType}`,
    undercut: `undercut with ${hairType} on top`,
    buzz_cut: "buzz cut",
    medium_length: `medium-length ${hairType}`,
    surfer: "medium-length tousled wavy hair",
    curls_loose: "loose curly hair",
    twist_out: "twist-out curly hair",
    tapered: "tapered curly hair",
  };

  const stylePhrase = styleAnchors[appearance.hair_style];

  if (stylePhrase) {
    // For styles that already describe length (like buzz cut, short afro), skip length prefix
    const skipLength = ["short_afro", "afro", "afro_puffs", "braids", "buzz_cut", "surfer", "curls_loose", "twist_out", "tapered"].includes(appearance.hair_style);
    if (skipLength) {
      parts.push(`${hairColor} hair, ${stylePhrase}`);
    } else {
      parts.push(`${hairLength} ${hairColor} hair, ${stylePhrase}`);
    }
  } else {
    // Fallback: just describe hair without style
    const hairParts = [hairLength, hairType, hairColor, "hair"].filter(Boolean);
    parts.push(hairParts.join(" "));
  }

  if (appearance.glasses) {
    parts.push("wearing glasses");
  }

  // Gender-appropriate clothing hint for visual reinforcement
  if (normalized === "male") {
    parts.push("wearing a casual t-shirt");
  } else if (normalized === "female") {
    parts.push("wearing a colorful top");
  }

  return parts.join(", ");
}

/**
 * Extracts clothing/accessory portion from a full character anchor string.
 * Used to separate LLM's clothing description from physical features,
 * so we can merge My Look (physical) with LLM (clothing).
 */
export function extractClothingFromAnchor(fullAnchor: string): string {
  // Match from "wearing", "dressed in", "clothed in" to end of string
  const clothingMatch = fullAnchor.match(/,?\s*(wearing|dressed in|clothed in)[\s\S]*/i);
  if (clothingMatch) {
    return clothingMatch[0].replace(/^,?\s*/, '');
  }
  return '';
}

// ═══ AVATAR V2 ═══

import { APPEARANCE_SLOTS, type AppearanceData, CURRENT_PHASE } from './appearanceSlots.ts';
import type { AppearanceSlot } from './appearanceSlots.ts';

function getOptionFragment(slot: AppearanceSlot, value: string | boolean): string {
  const str = value === true ? 'true' : value === false ? 'false' : String(value ?? '');
  const opt = slot.options.find((o) => o.value === str);
  return opt?.anchorFragment ?? '';
}

/**
 * Builds an English appearance anchor from Avatar v2 slot-based appearance_data.
 * No clothing hint; LLM invents outfit.
 */
export function buildAnchorFromSlots(
  name: string,
  age: number | string,
  gender: 'male' | 'female' | null,
  ageCategory: 'child' | 'teen' | 'adult' | 'senior',
  appearanceData: AppearanceData,
): string {
  const parts: string[] = [];

  // 1. PREFIX
  const ageNum = typeof age === 'number' ? age : Number(age);
  const hasNumericAge = !Number.isNaN(ageNum) && ageNum > 0;
  const useAgeInPrefix = ageCategory !== 'senior' && hasNumericAge;

  if (ageCategory === 'senior') {
    if (gender === 'female') parts.push(`elderly woman named ${name}`);
    else if (gender === 'male') parts.push(`elderly man named ${name}`);
    else parts.push(`elderly person named ${name}`);
  } else if (ageCategory === 'adult') {
    if (gender === 'female') parts.push(`woman named ${name}`);
    else if (gender === 'male') parts.push(`man named ${name}`);
    else parts.push(`person named ${name}`);
  } else {
    if (useAgeInPrefix) {
      if (gender === 'female') parts.push(`${ageNum}-year-old girl named ${name}`);
      else if (gender === 'male') parts.push(`${ageNum}-year-old boy named ${name}`);
      else parts.push(`${ageNum}-year-old child named ${name}`);
    } else {
      if (gender === 'female') parts.push(`girl named ${name}`);
      else if (gender === 'male') parts.push(`boy named ${name}`);
      else parts.push(`child named ${name}`);
    }
  }

  const FACE_KEYS = new Set(['skin_tone', 'eye_color', 'glasses']);

  // 2. SLOTS: face first (skin, eyes, glasses), then hair (step 3), then body
  for (const slot of APPEARANCE_SLOTS) {
    if (slot.phase > CURRENT_PHASE) continue;
    if (!FACE_KEYS.has(slot.key)) continue;

    const raw = appearanceData[slot.key];
    const value = raw === true ? 'true' : raw === false ? 'false' : (raw != null && raw !== '' ? String(raw) : '');
    if (value === '' || value === 'false' || value === 'none') continue;

    const fragment = getOptionFragment(slot, value);
    if (fragment) parts.push(fragment);
  }

  // 3. HAIR STRING
  const hairColorSlot = APPEARANCE_SLOTS.find((s) => s.key === 'hair_color')!;
  const hairTypeSlot = APPEARANCE_SLOTS.find((s) => s.key === 'hair_type')!;
  const hairLengthSlot = APPEARANCE_SLOTS.find((s) => s.key === 'hair_length')!;
  const hairStyleSlot = APPEARANCE_SLOTS.find((s) => s.key === 'hair_style')!;

  const hairStyleRaw = appearanceData.hair_style;
  const hairStyle = hairStyleRaw === true || hairStyleRaw === false ? '' : String(hairStyleRaw ?? '').trim();
  const hairLength = getOptionFragment(hairLengthSlot, appearanceData.hair_length ?? '');
  const hairType = getOptionFragment(hairTypeSlot, appearanceData.hair_type ?? '');
  const hairColorFragment = getOptionFragment(hairColorSlot, appearanceData.hair_color ?? '');
  const hairStyleFragment = getOptionFragment(hairStyleSlot, hairStyle) || 'worn loose';
  const colorWord = hairColorFragment.replace(/\s*hair\s*$/i, '').trim();

  if (hairStyle === 'bald') {
    parts.push('bald head');
  } else if (hairStyle === 'bald_top') {
    parts.push('bald on top with hair on the sides');
  } else if (hairStyle === 'buzz_cut') {
    parts.push(colorWord ? `${colorWord} buzz cut` : 'buzz cut');
  } else if (hairStyle === 'afro' || hairStyle === 'afro_puffs') {
    parts.push(colorWord ? `${colorWord} ${hairStyleFragment}` : hairStyleFragment);
  } else {
    const segs: string[] = [];
    if (colorWord) segs.push(colorWord);
    if (hairLength) segs.push(hairLength);
    if (hairType) segs.push(hairType);
    segs.push('hair');
    parts.push(`${segs.join(' ')}, ${hairStyleFragment}`);
  }

  // 4. BODY SLOTS (body_type) + facial_hair with color injection
  const facialHairSlot = APPEARANCE_SLOTS.find((s) => s.key === 'facial_hair');
  const bodyTypeSlot = APPEARANCE_SLOTS.find((s) => s.key === 'body_type');

  // facial_hair with beard color = hair color
  if (facialHairSlot) {
    const fhRaw = appearanceData.facial_hair;
    const fhValue = fhRaw === true ? 'true' : fhRaw === false ? 'false' : (fhRaw != null && fhRaw !== '' ? String(fhRaw) : '');
    if (fhValue && fhValue !== 'none' && fhValue !== 'false' && fhValue !== '') {
      const BEARD_COLOR_MAP: Record<string, (c: string) => string> = {
        stubble: (c) => c ? `with ${c} stubble` : 'with stubble',
        short_beard: (c) => c ? `with a short ${c} beard` : 'with a short beard',
        full_beard: (c) => c ? `with a full ${c} beard` : 'with a full beard',
        mustache: (c) => c ? `with a ${c} mustache` : 'with a mustache',
      };
      const builder = BEARD_COLOR_MAP[fhValue];
      if (builder) {
        parts.push(builder(colorWord));
      } else {
        const fragment = getOptionFragment(facialHairSlot, fhValue);
        if (fragment) parts.push(fragment);
      }
    }
  }

  // body_type
  if (bodyTypeSlot) {
    const btRaw = appearanceData.body_type;
    const btValue = btRaw === true ? 'true' : btRaw === false ? 'false' : (btRaw != null && btRaw !== '' ? String(btRaw) : '');
    if (btValue && btValue !== 'false' && btValue !== 'none' && btValue !== '') {
      const fragment = getOptionFragment(bodyTypeSlot, btValue);
      if (fragment) parts.push(fragment);
    }
  }

  return parts.join(', ');
}

/**
 * Converts v1 kid appearance columns to Avatar v2 AppearanceData (for backward compat).
 */
export function legacyAppearanceToSlotData(appearance: {
  skin_tone: string;
  hair_length: string;
  hair_type: string;
  hair_style: string;
  hair_color: string;
  glasses: boolean;
  eye_color?: string;
  body_type?: string;
}): AppearanceData {
  const data: AppearanceData = {
    skin_tone: appearance.skin_tone ?? '',
    hair_length: appearance.hair_length ?? '',
    hair_type: appearance.hair_type ?? '',
    hair_style: appearance.hair_style ?? '',
    hair_color: appearance.hair_color ?? '',
    glasses: String(appearance.glasses) as 'true' | 'false',
    eye_color: appearance.eye_color ?? '',
    body_type: appearance.body_type ?? '',
  };
  return data;
}
