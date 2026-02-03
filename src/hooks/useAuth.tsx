import { useState, useEffect, createContext, useContext, ReactNode } from "react";

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
  login: (token: string, user: UserSettings) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!sessionStorage.getItem('liremagie_session');
  });
  
  const [user, setUser] = useState<UserSettings | null>(() => {
    const stored = sessionStorage.getItem('liremagie_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (token: string, userData: UserSettings) => {
    sessionStorage.setItem('liremagie_session', token);
    sessionStorage.setItem('liremagie_user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem('liremagie_session');
    sessionStorage.removeItem('liremagie_user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
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