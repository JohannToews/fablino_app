export interface AppLanguage {
  code: string;           // ISO 639-1
  nameNative: string;     // Name in der Sprache selbst
  nameEN: string;         // Englischer Name
  flag: string;           // Emoji Flag
  uiSupported: boolean;   // Hat UI-Übersetzungen (translations.ts)
  storySupported: boolean; // Kann Stories generieren
  tier: 'core' | 'beta' | 'planned';
}

export const LANGUAGES: AppLanguage[] = [
  // Core — Full UI + Stories (7 Sprachen, bestehend)
  { code: 'de', nameNative: 'Deutsch',     nameEN: 'German',     flag: '🇩🇪', uiSupported: true,  storySupported: true, tier: 'core' },
  { code: 'fr', nameNative: 'Français',    nameEN: 'French',     flag: '🇫🇷', uiSupported: true,  storySupported: true, tier: 'core' },
  { code: 'en', nameNative: 'English',     nameEN: 'English',    flag: '🇬🇧', uiSupported: true,  storySupported: true, tier: 'core' },
  { code: 'es', nameNative: 'Español',     nameEN: 'Spanish',    flag: '🇪🇸', uiSupported: true,  storySupported: true, tier: 'core' },
  { code: 'nl', nameNative: 'Nederlands',  nameEN: 'Dutch',      flag: '🇳🇱', uiSupported: true,  storySupported: true, tier: 'core' },
  { code: 'it', nameNative: 'Italiano',    nameEN: 'Italian',    flag: '🇮🇹', uiSupported: true,  storySupported: true, tier: 'core' },
  { code: 'bs', nameNative: 'Bosanski',    nameEN: 'Bosnian',    flag: '🇧🇦', uiSupported: true,  storySupported: true, tier: 'core' },

  // Beta — UI uses EN fallback until real translations land (10 Sprachen)
  { code: 'tr', nameNative: 'Türkçe',      nameEN: 'Turkish',    flag: '🇹🇷', uiSupported: true, storySupported: true, tier: 'beta' },
  { code: 'bg', nameNative: 'Български',   nameEN: 'Bulgarian',  flag: '🇧🇬', uiSupported: true, storySupported: true, tier: 'beta' },
  { code: 'ro', nameNative: 'Română',      nameEN: 'Romanian',   flag: '🇷🇴', uiSupported: true, storySupported: true, tier: 'beta' },
  { code: 'pl', nameNative: 'Polski',      nameEN: 'Polish',     flag: '🇵🇱', uiSupported: true, storySupported: true, tier: 'beta' },
  { code: 'lt', nameNative: 'Lietuvių',    nameEN: 'Lithuanian', flag: '🇱🇹', uiSupported: true, storySupported: true, tier: 'beta' },
  { code: 'hu', nameNative: 'Magyar',      nameEN: 'Hungarian',  flag: '🇭🇺', uiSupported: true, storySupported: true, tier: 'beta' },
  { code: 'ca', nameNative: 'Català',      nameEN: 'Catalan',    flag: '🏴', uiSupported: true, storySupported: true, tier: 'beta' },
  { code: 'sl', nameNative: 'Slovenščina', nameEN: 'Slovenian',  flag: '🇸🇮', uiSupported: true, storySupported: true, tier: 'beta' },
  { code: 'pt', nameNative: 'Português',   nameEN: 'Portuguese', flag: '🇵🇹', uiSupported: true, storySupported: true, tier: 'beta' },
  { code: 'sk', nameNative: 'Slovenčina',  nameEN: 'Slovak',     flag: '🇸🇰', uiSupported: true, storySupported: true, tier: 'beta' },
];

export const STORY_LANGUAGES = LANGUAGES.filter(l => l.storySupported);
export const UI_LANGUAGES = LANGUAGES.filter(l => l.uiSupported);
export const BETA_LANGUAGES = LANGUAGES.filter(l => l.tier === 'beta');
export const getLanguage = (code: string) => LANGUAGES.find(l => l.code === code);
