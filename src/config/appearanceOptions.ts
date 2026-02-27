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

export const HAIR_LENGTHS = [
  { key: 'very_short', icon: '✂️', label_key: 'appearance.hair_very_short' },
  { key: 'short', icon: '✂️', label_key: 'appearance.hair_short' },
  { key: 'medium', icon: '💇', label_key: 'appearance.hair_medium' },
  { key: 'long', icon: '💇‍♀️', label_key: 'appearance.hair_long' },
] as const;

export const HAIR_TYPES = [
  { key: 'straight', label_key: 'appearance.hair_straight' },
  { key: 'wavy', label_key: 'appearance.hair_wavy' },
  { key: 'curly', label_key: 'appearance.hair_curly' },
  { key: 'coily', label_key: 'appearance.hair_coily' },
] as const;

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
  { key: 'dark_brown', color: '#3b2314' },
  { key: 'brown', color: '#6a3e1e' },
  { key: 'light_brown', color: '#a67b5b' },
  { key: 'blonde', color: '#d4a843' },
  { key: 'light_blonde', color: '#f0d58c' },
  { key: 'red', color: '#a52a2a' },
  { key: 'auburn', color: '#7c3a1a' },
  { key: 'ginger', color: '#c45e28' },
] as const;

export type SkinToneKey = (typeof SKIN_TONES)[number]['key'];
export type HairLengthKey = (typeof HAIR_LENGTHS)[number]['key'];
export type HairTypeKey = (typeof HAIR_TYPES)[number]['key'];
export type HairStyleKey = (typeof HAIR_STYLES)[number]['key'];
export type HairColorKey = (typeof HAIR_COLORS)[number]['key'];
