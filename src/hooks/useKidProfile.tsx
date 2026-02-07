import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type KidLanguage = 'de' | 'fr' | 'en' | 'es' | 'nl' | 'it' | 'bs';

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
}

// Derive app language from school_system (legacy fallback)
export const getKidLanguage = (schoolSystem: string | undefined): KidLanguage => {
  if (!schoolSystem) return 'fr';
  const lang = schoolSystem.toLowerCase();
  if (['de', 'fr', 'en', 'es', 'nl', 'it', 'bs'].includes(lang)) {
    return lang as KidLanguage;
  }
  return 'fr';
};

// Get language as KidLanguage from string (with validation)
const toKidLanguage = (lang: string | undefined): KidLanguage => {
  if (!lang) return 'fr';
  const lower = lang.toLowerCase();
  if (['de', 'fr', 'en', 'es', 'nl', 'it', 'bs'].includes(lower)) {
    return lower as KidLanguage;
  }
  return 'fr';
};

interface KidProfileContextType {
  kidProfiles: KidProfile[];
  selectedProfileId: string | null;
  selectedProfile: KidProfile | null;
  setSelectedProfileId: (id: string | null) => void;
  hasMultipleProfiles: boolean;
  isLoading: boolean;
  refreshProfiles: () => Promise<void>;
  kidAppLanguage: KidLanguage;
  /** The language stories should be generated/read in */
  kidReadingLanguage: KidLanguage;
  /** The language word explanations should be given in */
  kidExplanationLanguage: KidLanguage;
  /** Languages spoken at home */
  kidHomeLanguages: string[];
}

const KidProfileContext = createContext<KidProfileContextType | undefined>(undefined);

export const KidProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [kidProfiles, setKidProfiles] = useState<KidProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(() => {
    // Try to restore from sessionStorage
    return sessionStorage.getItem('selected_kid_profile_id');
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadKidProfiles = useCallback(async () => {
    if (!user) {
      setKidProfiles([]);
      setSelectedProfileId(null);
      setIsLoading(false);
      return;
    }

    const { data } = await supabase
      .from("kid_profiles")
      .select("*")
      .eq("user_id", user.id)
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
        content_safety_level: (d as any).content_safety_level ?? 2,
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
  const kidAppLanguage = getKidLanguage(selectedProfile?.school_system);
  const kidReadingLanguage = getKidLanguage(selectedProfile?.school_system);

  
  // Use explicit explanation_language if available, default to 'de'
  const kidExplanationLanguage = selectedProfile?.explanation_language
    ? toKidLanguage(selectedProfile.explanation_language)
    : 'de' as KidLanguage;
  
  // Home languages from profile, default to ['de']
  const kidHomeLanguages = selectedProfile?.home_languages || ['de'];

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
