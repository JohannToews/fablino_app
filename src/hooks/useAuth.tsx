import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { getTranslations, Language } from "@/lib/translations";

export type UserRole = 'admin' | 'standard';
export type AuthMode = 'supabase' | 'legacy' | null;

export interface UserSettings {
  id: string;
  username: string;
  displayName: string;
  adminLanguage: Language;
  appLanguage: Language;
  textLanguage: Language;
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

  const t = () => {
    const lang = (user?.adminLanguage || navigator.language?.slice(0, 2) || 'de') as Language;
    return getTranslations(lang);
  };

  // Fetch user profile from user_profiles table (for Supabase Auth users)
  const fetchUserProfile = async (authUser: User): Promise<UserSettings | null> => {
    const withTimeout = async <T,>(task: () => Promise<T>, ms = 10000): Promise<T> => {
      return await Promise.race([
        task(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`timeout_after_${ms}ms`)), ms)
        ),
      ]);
    };

    const mapProfile = async (profile: any): Promise<UserSettings> => {
      const { data: roleData, error: roleError } = await withTimeout(
        async () => await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id)
          .maybeSingle(),
        8000
      );

      if (roleError) {
        console.warn('Error fetching user role, using fallback role=standard:', roleError.message);
      }

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
    };

    try {
      const { data: profileByAuthId, error: authIdError } = await withTimeout(
        async () => await supabase
          .from('user_profiles')
          .select('id, username, display_name, email, auth_id, auth_migrated, admin_language, app_language, text_language, system_prompt, created_at, updated_at')
          .eq('auth_id', authUser.id)
          .order('auth_migrated', { ascending: false })
          .limit(1)
          .maybeSingle(),
        10000
      );

      if (profileByAuthId) {
        return await mapProfile(profileByAuthId);
      }

      if (authIdError) {
        console.error('Error fetching user profile by auth_id:', authIdError);
      }

      // Fallback path for policy/session timing edge cases
      const { data: profileId, error: profileIdError } = await withTimeout(
        async () => await supabase.rpc('get_user_profile_id'),
        8000
      );

      if (profileIdError || !profileId) {
        if (profileIdError) console.error('Error resolving profile id:', profileIdError);
        return null;
      }

      const { data: profileById, error: profileByIdError } = await withTimeout(
        async () => await supabase
          .from('user_profiles')
          .select('id, username, display_name, email, auth_id, auth_migrated, admin_language, app_language, text_language, system_prompt, created_at, updated_at')
          .eq('id', profileId)
          .maybeSingle(),
        10000
      );

      if (profileByIdError || !profileById) {
        if (profileByIdError) console.error('Error fetching user profile by id:', profileByIdError);
        return null;
      }

      return await mapProfile(profileById);
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
    let isMounted = true;

    // Check if migration banner was dismissed this session
    const dismissed = sessionStorage.getItem(MIGRATION_DISMISSED_KEY) === 'true';
    setMigrationBannerDismissed(dismissed);

    const applyLegacyFallback = () => {
      const legacyUser = checkLegacySession();
      if (legacyUser) {
        const legacyToken = sessionStorage.getItem(LEGACY_SESSION_KEY)
          || localStorage.getItem(LEGACY_SESSION_KEY)
          || 'legacy-token';
        const mockSession = {
          access_token: legacyToken,
          refresh_token: '',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: legacyUser.id } as any,
        } as Session;

        setSession(mockSession);
        setUser(legacyUser);
        setAuthMode('legacy');
      } else {
        setSession(null);
        setUser(null);
        setAuthMode(null);
      }
      setIsLoading(false);
    };

    const loadSupabaseProfile = (authUser: User) => {
      if (isMounted) setIsLoading(true);

      void (async () => {
        try {
          let profile = await fetchUserProfile(authUser);

          // Retry once: on some domains/storage restore paths auth token can lag briefly
          // and the first profile query returns null.
          if (!profile) {
            await new Promise((resolve) => setTimeout(resolve, 700));
            profile = await fetchUserProfile(authUser);
          }

          if (!isMounted) return;
          setUser((prev) => profile ?? prev ?? null);
        } catch (error) {
          console.error('Error loading Supabase profile:', error);
          if (!isMounted) return;
          setUser((prev) => prev ?? null);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      })();
    };

    // Track the last loaded auth user id to avoid redundant profile fetches
    let lastLoadedAuthUserId: string | null = null;

    // Set up auth state listener FIRST
    // IMPORTANT: callback must stay synchronous (no async/await + no Supabase calls directly here)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Auth state changed:', event, newSession?.user?.email);
      if (!isMounted) return;

      if (newSession?.user) {
        setSession(newSession);
        setAuthMode('supabase');
        // Only reload profile on actual sign-in or if user changed
        // TOKEN_REFRESHED with same user doesn't need a profile refetch
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || newSession.user.id !== lastLoadedAuthUserId) {
          lastLoadedAuthUserId = newSession.user.id;
          loadSupabaseProfile(newSession.user);
        }
        return;
      }

      if (event === 'SIGNED_OUT' || !newSession) {
        lastLoadedAuthUserId = null;
        applyLegacyFallback();
      }
    });

    // THEN check for existing session
    const initAuth = async () => {
      try {
        const { data: { session: existingSession } } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('auth_init_timeout')), 10000)
          ),
        ]);

        if (!isMounted) return;

        if (existingSession?.user) {
          setSession(existingSession);
          setAuthMode('supabase');
          loadSupabaseProfile(existingSession.user);
        } else {
          applyLegacyFallback();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) applyLegacyFallback();
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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
        let profile = await fetchUserProfile(data.user);

        // Extra retry window right after password sign-in (session restore/race)
        if (!profile) {
          await new Promise((resolve) => setTimeout(resolve, 900));
          profile = await fetchUserProfile(data.user);
        }

        if (!profile) {
          // Do not force sign-out here; auth listener may still hydrate shortly.
          return { success: false, error: t().hookProfileNotFound };
        }

        setSession(data.session);
        setUser(profile);
        setAuthMode('supabase');
        // Clear any legacy session data
        clearLegacySession();
        return { success: true };
      }

      return { success: false, error: t().hookLoginFailed };
    } catch (error) {
      console.error('Email login error:', error);
      return { success: false, error: t().authGenericError };
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
        return { success: false, error: t().hookLoginFailed };
      }

      // If user is migrated, block legacy login and show hint
      if (data?.migrated) {
        const emailHint = data.email ? ` (${data.email})` : '';
        return { success: false, error: `${t().hookAccountMigrated}${emailHint}` };
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

        // If we got an authToken, establish a real Supabase Auth session
        // This is needed so auth.uid() works in RLS policies
        if (data.authToken) {
          try {
            const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
              token_hash: data.authToken,
              type: 'magiclink',
            });
            if (!otpError && otpData?.session) {
              setSession(otpData.session);
              setUser(userData);
              setAuthMode('legacy');
              saveLegacySession(otpData.session.access_token, userData);
              return { success: true };
            }
            console.error('OTP verification failed:', otpError);
          } catch (otpErr) {
            console.error('Error verifying auth token:', otpErr);
          }
        }

        // Fallback: Save to sessionStorage for persistence (no real auth session)
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

      return { success: false, error: data?.error || t().hookInvalidCredentials };
    } catch (error) {
      console.error('Username login error:', error);
      return { success: false, error: t().authGenericError };
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

export const useAuthOptional = () => useContext(AuthContext) ?? null;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
