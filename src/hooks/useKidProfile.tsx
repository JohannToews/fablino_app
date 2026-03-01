import { useState, useEffect, useRef, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthOptional } from "./useAuth";
import type { Language } from "@/lib/translations";

export type KidLanguage = 'de' | 'fr' | 'en' | 'es' | 'nl' | 'it' | 'bs'
  | 'tr' | 'bg' | 'ro' | 'pl' | 'lt' | 'hu' | 'ca' | 'sl' | 'pt' | 'sk' | 'uk' | 'ru'
  | 'ar' | 'fa';

export interface KidProfile {
  id: string;
  name: string;
  cover_image_url: string | null;
  color_palette: string;
  school_class: string;
  school_system: string;
  hobbies: string;
  image_style: string | null;
  // Optional multilingual fields (may not exist in DB yet)
  ui_language?: string;
  reading_language?: string;
  explanation_language?: string;
  home_languages?: string[];
  content_safety_level?: number;
  difficulty_level?: number;
  age?: number | null;
  gender?: string | null;
  story_languages?: string[];
}

// Derive app language from school_system (legacy fallback)
const VALID_LANGUAGES = ['de', 'fr', 'en', 'es', 'nl', 'it', 'bs', 'tr', 'bg', 'ro', 'pl', 'lt', 'hu', 'ca', 'sl', 'pt', 'sk', 'uk', 'ru', 'ar', 'fa'];

const SCHOOL_SYSTEM_TO_LANG: Record<string, KidLanguage> = {
  iran: 'fa',
  afghanistan: 'fa',
};

export const getKidLanguage = (schoolSystem: string | undefined): KidLanguage => {
  if (!schoolSystem) return 'fr';
  const lang = schoolSystem.toLowerCase();
  if (VALID_LANGUAGES.includes(lang)) {
    return lang as KidLanguage;
  }
  return 'fr';
};

const toKidLanguage = (lang: string | undefined): KidLanguage => {
  if (!lang) return 'en';
  const lower = lang.toLowerCase();
  if (SCHOOL_SYSTEM_TO_LANG[lower]) return SCHOOL_SYSTEM_TO_LANG[lower];
  if (VALID_LANGUAGES.includes(lower)) return lower as KidLanguage;
  return 'en';
};

interface KidProfileContextType {
  kidProfiles: KidProfile[];
  selectedProfileId: string | null;
  selectedProfile: KidProfile | null;
  setSelectedProfileId: (id: string | null) => void;
  hasMultipleProfiles: boolean;
  isLoading: boolean;
  refreshProfiles: () => Promise<void>;
  kidAppLanguage: Language;
  /** The language stories should be generated/read in */
  kidReadingLanguage: Language;
  /** The language word explanations should be given in */
  kidExplanationLanguage: Language;
  /** Languages spoken at home */
  kidHomeLanguages: string[];
  /** Languages available for story generation */
  kidStoryLanguages: string[];
}

const KidProfileContext = createContext<KidProfileContextType | undefined>(undefined);

export const KidProfileProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthOptional();
  const user = auth?.user ?? null;
  const [kidProfiles, setKidProfiles] = useState<KidProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(() => {
    // Try to restore from sessionStorage
    return sessionStorage.getItem('selected_kid_profile_id');
  });
  const [isLoading, setIsLoading] = useState(true);
  // Track whether we've done the initial load to avoid re-showing loading spinner
  const hasLoadedOnce = useRef(false);

  const loadKidProfiles = useCallback(async () => {
    if (!user) {
      setKidProfiles([]);
      setSelectedProfileId(null);
      setIsLoading(false);
      return;
    }

    // Only show loading spinner on INITIAL load.
    // Background refreshes (e.g. auth token refresh) must NOT set loading=true
    // because ProtectedRoute would unmount children (losing wizard state).
    if (!hasLoadedOnce.current) {
      setIsLoading(true);
    }

    const { data } = await supabase
      .from("kid_profiles")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      // Map DB data to KidProfile type (handle optional fields)
      const mappedProfiles: KidProfile[] = data.map(d => ({
        id: d.id,
        name: d.name,
        cover_image_url: d.cover_image_url,
        color_palette: d.color_palette,
        school_class: d.school_class,
        school_system: d.school_system,
        hobbies: d.hobbies,
        image_style: d.image_style,
        // Optional fields - use fallbacks if not in DB
        ui_language: (d as any).ui_language || d.school_system,
        reading_language: (d as any).reading_language || d.school_system,
        explanation_language: (d as any).explanation_language || 'de',
        home_languages: (d as any).home_languages || ['de'],
        content_safety_level: (() => { const v = (d as any).content_safety_level ?? 2; return Math.min(4, Math.max(1, Number(v) || 2)); })(),
        difficulty_level: (() => { const v = (d as any).difficulty_level ?? 2; return Math.min(3, Math.max(1, Number(v) || 2)); })(),
        age: (d as any).age ?? null,
        gender: (d as any).gender ?? null,
        story_languages: (d as any).story_languages || [(d as any).reading_language || d.school_system],
      }));
      setKidProfiles(mappedProfiles);
      
      // Auto-select first profile if none selected or selected doesn't exist
      const currentSelection = sessionStorage.getItem('selected_kid_profile_id');
      const profileExists = data.some(p => p.id === currentSelection);
      
      if (!currentSelection || !profileExists) {
        setSelectedProfileId(data[0].id);
        sessionStorage.setItem('selected_kid_profile_id', data[0].id);
      }
    } else {
      setKidProfiles([]);
      setSelectedProfileId(null);
      sessionStorage.removeItem('selected_kid_profile_id');
    }
    hasLoadedOnce.current = true;
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadKidProfiles();
  }, [loadKidProfiles]);

  // Persist selection to sessionStorage
  const handleSetSelectedProfileId = (id: string | null) => {
    setSelectedProfileId(id);
    if (id) {
      sessionStorage.setItem('selected_kid_profile_id', id);
    } else {
      sessionStorage.removeItem('selected_kid_profile_id');
    }
  };

  const selectedProfile = kidProfiles.find(p => p.id === selectedProfileId) || null;
  const hasMultipleProfiles = kidProfiles.length > 1;
  
  // Derive app language: school_system is the primary source (set via the UI dropdown).
  // ui_language/reading_language in DB are kept in sync but school_system is what the user
  // actually changes, so it must take priority.
  const kidAppLanguage = getKidLanguage(selectedProfile?.school_system) as Language;
  const kidReadingLanguage = getKidLanguage(selectedProfile?.school_system) as Language;

  
  // Use explicit explanation_language if available, default to 'de'
  const kidExplanationLanguage = (selectedProfile?.explanation_language
    ? toKidLanguage(selectedProfile.explanation_language)
    : 'de') as Language;
  
  // Home languages from profile, default to ['de']
  const kidHomeLanguages = selectedProfile?.home_languages || ['de'];
  
  // Story languages from profile, default to [reading_language]
  const kidStoryLanguages = selectedProfile?.story_languages || [kidReadingLanguage];

  return (
    <KidProfileContext.Provider value={{
      kidProfiles,
      selectedProfileId,
      selectedProfile,
      setSelectedProfileId: handleSetSelectedProfileId,
      hasMultipleProfiles,
      isLoading,
      refreshProfiles: loadKidProfiles,
      kidAppLanguage,
      kidReadingLanguage,
      kidExplanationLanguage,
      kidHomeLanguages,
      kidStoryLanguages,
    }}>
      {children}
    </KidProfileContext.Provider>
  );
};

export const useKidProfile = () => {
  const context = useContext(KidProfileContext);
  if (context === undefined) {
    throw new Error('useKidProfile must be used within a KidProfileProvider');
  }
  return context;
};
