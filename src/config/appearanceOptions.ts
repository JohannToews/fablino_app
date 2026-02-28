/**
 * Kid appearance options for "Mein Look" avatar builder.
 * Keys match DB columns; label_key for translations.
 */

export const SKIN_TONES = [
  { key: 'light', color: '#FDEBD0', label_key: 'appearance.skin_light' },
  { key: 'medium_light', color: '#E8C39E', label_key: 'appearance.skin_medium_light' },
  { key: 'medium', color: '#C68E56', label_key: 'appearance.skin_medium' },
  { key: 'medium_dark', color: '#8D5524', label_key: 'appearance.skin_medium_dark' },
  { key: 'dark', color: '#4A2C0A', label_key: 'appearance.skin_dark' },
] as const;

export const HAIR_LENGTHS_GIRL = [
  { key: 'very_short', icon: '✂️', label_key: 'appearance.hair_very_short' },
  { key: 'short', icon: '✂️', label_key: 'appearance.hair_short' },
  { key: 'medium', icon: '💇', label_key: 'appearance.hair_medium' },
  { key: 'long', icon: '💇‍♀️', label_key: 'appearance.hair_long' },
] as const;

export const HAIR_LENGTHS_BOY = [
  { key: 'very_short', icon: '✂️', label_key: 'appearance.hair_very_short' },
  { key: 'short', icon: '✂️', label_key: 'appearance.hair_short' },
  { key: 'medium', icon: '💇', label_key: 'appearance.hair_medium' },
] as const;

// Keep backward-compatible alias
export const HAIR_LENGTHS = HAIR_LENGTHS_GIRL;

export const HAIR_TYPES = [
  { key: 'straight', label_key: 'appearance.hair_straight' },
  { key: 'wavy', label_key: 'appearance.hair_wavy' },
  { key: 'curly', label_key: 'appearance.hair_curly' },
  { key: 'tight_curly', label_key: 'appearance.hair_tight_curly' },
  { key: 'coily', label_key: 'appearance.hair_coily' },
] as const;

/**
 * Gender × HairType → available hairstyles.
 * Each entry: { key: DB value, label_key: translation key, anchorTemplate: English anchor phrase }
 * In anchorTemplate, {type} is replaced by the hair type descriptor.
 */
export type HairStyleOption = {
  key: string;
  label_key: string;
  anchorTemplate: string;
};

const GIRL_STYLES: Record<string, HairStyleOption[]> = {
  straight: [
    { key: 'loose', label_key: 'appearance.style_loose', anchorTemplate: 'loose {type}' },
    { key: 'braid', label_key: 'appearance.style_braid', anchorTemplate: 'braided {type}' },
    { key: 'ponytail', label_key: 'appearance.style_ponytail', anchorTemplate: '{type} in a ponytail' },
    { key: 'bob', label_key: 'appearance.style_bob', anchorTemplate: 'bob cut with {type}' },
  ],
  wavy: [
    { key: 'loose', label_key: 'appearance.style_loose', anchorTemplate: 'loose {type}' },
    { key: 'ponytail', label_key: 'appearance.style_ponytail', anchorTemplate: '{type} in a ponytail' },
    { key: 'half_up', label_key: 'appearance.style_half_up', anchorTemplate: 'half-up {type}' },
    { key: 'two_braids', label_key: 'appearance.style_two_braids', anchorTemplate: '{type} in two braids' },
  ],
  curly: [
    { key: 'loose', label_key: 'appearance.style_loose', anchorTemplate: 'loose {type}' },
    { key: 'ponytail', label_key: 'appearance.style_ponytail', anchorTemplate: '{type} in a ponytail' },
    { key: 'two_braids', label_key: 'appearance.style_two_braids', anchorTemplate: '{type} in two braids' },
    { key: 'updo', label_key: 'appearance.style_updo', anchorTemplate: '{type} in an updo' },
  ],
  tight_curly: [
    { key: 'loose', label_key: 'appearance.style_loose', anchorTemplate: 'loose {type}' },
    { key: 'ponytail', label_key: 'appearance.style_ponytail', anchorTemplate: '{type} in a ponytail' },
    { key: 'two_braids', label_key: 'appearance.style_two_braids', anchorTemplate: '{type} in two braids' },
    { key: 'updo', label_key: 'appearance.style_updo', anchorTemplate: '{type} in an updo' },
  ],
  coily: [
    { key: 'short_afro', label_key: 'appearance.style_short_afro', anchorTemplate: 'short afro' },
    { key: 'afro', label_key: 'appearance.style_afro', anchorTemplate: 'afro hairstyle' },
    { key: 'afro_puffs', label_key: 'appearance.style_afro_puffs', anchorTemplate: 'afro puffs' },
    { key: 'braids', label_key: 'appearance.style_braids', anchorTemplate: 'braided hair' },
  ],
};

const BOY_STYLES: Record<string, HairStyleOption[]> = {
  straight: [
    { key: 'short', label_key: 'appearance.style_boy_short', anchorTemplate: 'short {type}' },
    { key: 'side_part', label_key: 'appearance.style_side_part', anchorTemplate: 'side-parted {type}' },
    { key: 'undercut', label_key: 'appearance.style_undercut', anchorTemplate: 'undercut with {type} on top' },
    { key: 'buzz_cut', label_key: 'appearance.style_buzz_cut', anchorTemplate: 'buzz cut' },
  ],
  wavy: [
    { key: 'short', label_key: 'appearance.style_boy_short', anchorTemplate: 'short {type}' },
    { key: 'medium_length', label_key: 'appearance.style_medium_length', anchorTemplate: 'medium-length {type}' },
    { key: 'surfer', label_key: 'appearance.style_surfer', anchorTemplate: 'medium-length tousled wavy hair' },
    { key: 'side_part', label_key: 'appearance.style_side_part', anchorTemplate: 'side-parted {type}' },
  ],
  curly: [
    { key: 'short', label_key: 'appearance.style_boy_short', anchorTemplate: 'short {type}' },
    { key: 'medium_length', label_key: 'appearance.style_medium_length', anchorTemplate: 'medium-length {type}' },
    { key: 'curls_loose', label_key: 'appearance.style_curls_loose', anchorTemplate: 'loose curly hair' },
    { key: 'side_part', label_key: 'appearance.style_side_part', anchorTemplate: 'side-parted {type}' },
  ],
  tight_curly: [
    { key: 'short', label_key: 'appearance.style_boy_short', anchorTemplate: 'short {type}' },
    { key: 'medium_length', label_key: 'appearance.style_medium_length', anchorTemplate: 'medium-length {type}' },
    { key: 'twist_out', label_key: 'appearance.style_twist_out', anchorTemplate: 'twist-out curly hair' },
    { key: 'tapered', label_key: 'appearance.style_tapered', anchorTemplate: 'tapered curly hair' },
  ],
  coily: [
    { key: 'buzz_cut', label_key: 'appearance.style_buzz_cut', anchorTemplate: 'buzz cut' },
    { key: 'short_afro', label_key: 'appearance.style_short_afro', anchorTemplate: 'short afro' },
    { key: 'afro', label_key: 'appearance.style_afro', anchorTemplate: 'afro hairstyle' },
    { key: 'braids', label_key: 'appearance.style_braids', anchorTemplate: 'braided hair' },
  ],
};

export function getHairStyles(gender: string | null, hairType: string): HairStyleOption[] {
  const map = gender === 'male' ? BOY_STYLES : GIRL_STYLES;
  return map[hairType] || map['straight'] || [];
}

export function getHairLengths(gender: string | null) {
  return gender === 'male' ? HAIR_LENGTHS_BOY : HAIR_LENGTHS_GIRL;
}

export const HAIR_STYLES = [
  { key: 'loose', label_key: 'appearance.style_loose' },
  { key: 'ponytail', label_key: 'appearance.style_ponytail' },
  { key: 'braids', label_key: 'appearance.style_braids' },
  { key: 'pigtails', label_key: 'appearance.style_pigtails' },
  { key: 'bun', label_key: 'appearance.style_bun' },
  { key: 'bangs', label_key: 'appearance.style_bangs' },
] as const;

export const HAIR_COLORS = [
  { key: 'black', color: '#1a1a1a' },
  { key: 'brown', color: '#6a3e1e' },
  { key: 'light_brown', color: '#a67b5b' },
  { key: 'blonde', color: '#d4a843' },
  { key: 'light_blonde', color: '#f0d58c' },
  { key: 'red', color: '#a52a2a' },
  { key: 'ginger', color: '#c45e28' },
] as const;

export const EYE_COLORS = [
  { key: 'brown', color: '#8B4513', label_key: 'appearance.eye_brown' },
  { key: 'dark_brown', color: '#3B1E08', label_key: 'appearance.eye_dark_brown' },
  { key: 'green', color: '#2E8B57', label_key: 'appearance.eye_green' },
  { key: 'blue', color: '#4682B4', label_key: 'appearance.eye_blue' },
  { key: 'gray', color: '#808080', label_key: 'appearance.eye_gray' },
] as const;

export type SkinToneKey = (typeof SKIN_TONES)[number]['key'];
export type HairLengthKey = (typeof HAIR_LENGTHS_GIRL)[number]['key'] | (typeof HAIR_LENGTHS_BOY)[number]['key'];
export type HairTypeKey = (typeof HAIR_TYPES)[number]['key'];
export type HairStyleKey = string; // dynamic now
export type HairColorKey = (typeof HAIR_COLORS)[number]['key'];
export type EyeColorKey = (typeof EYE_COLORS)[number]['key'];
