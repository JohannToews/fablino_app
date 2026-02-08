import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export type UserRole = 'admin' | 'standard';

export interface UserSettings {
  id: string;
  username: string;
  displayName: string;
  adminLanguage: 'de' | 'fr' | 'en' | 'es' | 'nl' | 'it' | 'bs';
  appLanguage: 'de' | 'fr' | 'en' | 'es' | 'nl' | 'it' | 'bs';
  textLanguage: 'de' | 'fr' | 'en' | 'es' | 'nl' | 'it' | 'bs';
  systemPrompt: string | null;
  role: UserRole;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserSettings | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from user_profiles table
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
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  const refreshUserProfile = async () => {
    if (session?.user) {
      const profile = await fetchUserProfile(session.user);
      setUser(profile);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.email);
        setSession(newSession);
        
        if (newSession?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(async () => {
            const profile = await fetchUserProfile(newSession.user);
            setUser(profile);
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (existingSession?.user) {
        setSession(existingSession);
        fetchUserProfile(existingSession.user).then((profile) => {
          setUser(profile);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

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
        // Create a mock session for simple login
        const mockSession = {
          access_token: data.token || 'simple-auth-token',
          refresh_token: '',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: data.user.id } as any
        } as Session;
        
        setSession(mockSession);
        setUser({
          id: data.user.id,
          username: data.user.username,
          displayName: data.user.displayName,
          adminLanguage: data.user.adminLanguage,
          appLanguage: data.user.appLanguage,
          textLanguage: data.user.textLanguage,
          systemPrompt: data.user.systemPrompt,
          role: data.user.role || 'standard',
        });
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
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: !!session && !!user, 
      user, 
      session,
      isLoading,
      login, 
      logout,
      refreshUserProfile,
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
