import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export type UserRole = 'admin' | 'standard';
export type AuthMode = 'supabase' | 'legacy' | null;

export interface UserSettings {
  id: string;
  username: string;
  displayName: string;
  adminLanguage: 'de' | 'fr' | 'en' | 'es' | 'nl' | 'it' | 'bs';
  appLanguage: 'de' | 'fr' | 'en' | 'es' | 'nl' | 'it' | 'bs';
  textLanguage: 'de' | 'fr' | 'en' | 'es' | 'nl' | 'it' | 'bs';
  systemPrompt: string | null;
  role: UserRole;
  email?: string | null;
  authMigrated?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserSettings | null;
  session: Session | null;
  isLoading: boolean;
  authMode: AuthMode;
  needsMigration: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  dismissMigrationBanner: () => void;
  migrationBannerDismissed: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session storage keys for legacy auth
const LEGACY_SESSION_KEY = 'liremagie_session';
const LEGACY_USER_KEY = 'liremagie_user';
const MIGRATION_DISMISSED_KEY = 'migration_banner_dismissed';
const REMEMBER_ME_KEY = 'liremagie_remember';

// Helper to get the right storage based on remember-me preference
const getStorage = (): Storage => {
  return localStorage.getItem(REMEMBER_ME_KEY) === 'true' ? localStorage : sessionStorage;
};
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [migrationBannerDismissed, setMigrationBannerDismissed] = useState(false);

  // Check if legacy user needs migration (no email set)
  const needsMigration = authMode === 'legacy' && user !== null && !user.email;

  // Fetch user profile from user_profiles table (for Supabase Auth users)
  const fetchUserProfile = async (authUser: User): Promise<UserSettings | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (error || !profile) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.id)
        .single();

      return {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        adminLanguage: profile.admin_language as UserSettings['adminLanguage'],
        appLanguage: profile.app_language as UserSettings['appLanguage'],
        textLanguage: profile.text_language as UserSettings['textLanguage'],
        systemPrompt: profile.system_prompt,
        role: (roleData?.role as UserRole) || 'standard',
        email: profile.email,
        authMigrated: profile.auth_migrated,
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  const refreshUserProfile = async () => {
    if (session?.user && authMode === 'supabase') {
      const profile = await fetchUserProfile(session.user);
      setUser(profile);
    }
  };

  // Dismiss migration banner for this session
  const dismissMigrationBanner = () => {
    sessionStorage.setItem(MIGRATION_DISMISSED_KEY, 'true');
    setMigrationBannerDismissed(true);
  };

  // Check for legacy session in storage
  const checkLegacySession = (): UserSettings | null => {
    try {
      // Check both storages
      const storage = getStorage();
      let legacySession = storage.getItem(LEGACY_SESSION_KEY);
      let legacyUserStr = storage.getItem(LEGACY_USER_KEY);
      
      // Fallback: check the other storage too
      if (!legacySession) {
        const otherStorage = storage === localStorage ? sessionStorage : localStorage;
        legacySession = otherStorage.getItem(LEGACY_SESSION_KEY);
        legacyUserStr = otherStorage.getItem(LEGACY_USER_KEY);
      }
      
      if (legacySession && legacyUserStr) {
        const legacyUser = JSON.parse(legacyUserStr);
        return {
          id: legacyUser.id,
          username: legacyUser.username,
          displayName: legacyUser.displayName,
          adminLanguage: legacyUser.adminLanguage || 'de',
          appLanguage: legacyUser.appLanguage || 'fr',
          textLanguage: legacyUser.textLanguage || 'fr',
          systemPrompt: legacyUser.systemPrompt || null,
          role: legacyUser.role || 'standard',
          email: legacyUser.email || null,
          authMigrated: false,
        };
      }
    } catch (error) {
      console.error('Error parsing legacy session:', error);
    }
    return null;
  };

  // Save legacy session to storage
  const saveLegacySession = (token: string, userData: UserSettings) => {
    const storage = getStorage();
    storage.setItem(LEGACY_SESSION_KEY, token);
    storage.setItem(LEGACY_USER_KEY, JSON.stringify(userData));
  };

  // Clear legacy session from both storages
  const clearLegacySession = () => {
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    sessionStorage.removeItem(LEGACY_USER_KEY);
    sessionStorage.removeItem(MIGRATION_DISMISSED_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
  };

  useEffect(() => {
    // Check if migration banner was dismissed this session
    const dismissed = sessionStorage.getItem(MIGRATION_DISMISSED_KEY) === 'true';
    setMigrationBannerDismissed(dismissed);

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.email);
        
        if (newSession?.user) {
          setSession(newSession);
          setAuthMode('supabase');
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(async () => {
            const profile = await fetchUserProfile(newSession.user);
            setUser(profile);
            setIsLoading(false);
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          // Check for legacy session as fallback
          const legacyUser = checkLegacySession();
          if (legacyUser) {
            setUser(legacyUser);
            setAuthMode('legacy');
          } else {
            setSession(null);
            setUser(null);
            setAuthMode(null);
          }
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    const initAuth = async () => {
      try {
        // First check Supabase Auth session
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession?.user) {
          setSession(existingSession);
          setAuthMode('supabase');
          const profile = await fetchUserProfile(existingSession.user);
          setUser(profile);
          setIsLoading(false);
        } else {
          // No Supabase session - check for legacy session
          const legacyUser = checkLegacySession();
          if (legacyUser) {
            setUser(legacyUser);
            setAuthMode('legacy');
            // Create a mock session for legacy
            const mockSession = {
              access_token: sessionStorage.getItem(LEGACY_SESSION_KEY) || 'legacy-token',
              refresh_token: '',
              expires_in: 3600,
              token_type: 'bearer',
              user: { id: legacyUser.id } as any
            } as Session;
            setSession(mockSession);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsLoading(false);
      }
    };

    initAuth();

    return () => subscription.unsubscribe();
  }, []);

  // Login via Supabase Auth (email/password)
  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const profile = await fetchUserProfile(data.user);
        if (!profile) {
          await supabase.auth.signOut();
          return { success: false, error: 'Benutzerprofil nicht gefunden' };
        }
        setSession(data.session);
        setUser(profile);
        setAuthMode('supabase');
        // Clear any legacy session data
        clearLegacySession();
        return { success: true };
      }

      return { success: false, error: 'Login fehlgeschlagen' };
    } catch (error) {
      console.error('Email login error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten' };
    }
  };

  // Login via simple username/password (legacy approach)
  const loginWithUsername = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-login', {
        body: { username, password }
      });

      if (error) {
        console.error('Username login error:', error);
        return { success: false, error: 'Login fehlgeschlagen' };
      }

      if (data?.success && data?.user) {
        const userData: UserSettings = {
          id: data.user.id,
          username: data.user.username,
          displayName: data.user.displayName,
          adminLanguage: data.user.adminLanguage || 'de',
          appLanguage: data.user.appLanguage || 'fr',
          textLanguage: data.user.textLanguage || 'fr',
          systemPrompt: data.user.systemPrompt || null,
          role: data.user.role || 'standard',
          email: data.user.email || null,
          authMigrated: false,
        };

        // Save to sessionStorage for persistence
        saveLegacySession(data.token || 'legacy-auth-token', userData);

        // Create a mock session for legacy login
        const mockSession = {
          access_token: data.token || 'legacy-auth-token',
          refresh_token: '',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: data.user.id } as any
        } as Session;
        
        setSession(mockSession);
        setUser(userData);
        setAuthMode('legacy');
        return { success: true };
      }

      return { success: false, error: data?.error || 'Ungültige Anmeldedaten' };
    } catch (error) {
      console.error('Username login error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten' };
    }
  };

  // Dual login: detect email vs username
  const login = async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const isEmail = identifier.includes('@');
    
    if (isEmail) {
      return loginWithEmail(identifier, password);
    } else {
      return loginWithUsername(identifier, password);
    }
  };

  const logout = async () => {
    // Sign out from Supabase Auth if applicable
    if (authMode === 'supabase') {
      await supabase.auth.signOut();
    }
    
    // Clear legacy session data
    clearLegacySession();
    
    setSession(null);
    setUser(null);
    setAuthMode(null);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: !!session && !!user, 
      user, 
      session,
      isLoading,
      authMode,
      needsMigration,
      login, 
      logout,
      refreshUserProfile,
      dismissMigrationBanner,
      migrationBannerDismissed,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
