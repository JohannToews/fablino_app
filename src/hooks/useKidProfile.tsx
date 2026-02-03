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
}

// Derive app language from school_system
export const getKidLanguage = (schoolSystem: string | undefined): KidLanguage => {
  if (!schoolSystem) return 'fr';
  const lang = schoolSystem.toLowerCase();
  if (['de', 'fr', 'en', 'es', 'nl', 'it', 'bs'].includes(lang)) {
    return lang as KidLanguage;
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
      setKidProfiles(data);
      
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
  const kidAppLanguage = getKidLanguage(selectedProfile?.school_system);

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
