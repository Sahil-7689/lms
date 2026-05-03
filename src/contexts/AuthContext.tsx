// ─── AuthContext ──────────────────────────────────────────────────────────────
//
// Provides authentication state + actions to the entire app.
//
// State machine:
//   isLoading=true  → startup: checking stored token
//   isLoading=false, isAuthenticated=false → show Login / Register
//   isLoading=false, isAuthenticated=true  → show Dashboard
//
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import authService from '../services/authService';
import type { User, AuthResponse } from '../types/auth';

// ─── Context shape ────────────────────────────────────────────────────────────

export interface AuthContextType {
  /** Currently logged-in user, or null if unauthenticated */
  user: User | null;
  isAuthenticated: boolean;
  /** True while the app is checking the stored token on startup */
  isLoading: boolean;

  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (username: string, email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  /** Re-fetch profile from server and update context */
  refreshUser: () => Promise<void>;
  updateAvatar: (uri: string) => Promise<void>;
}

// ─── Context + hook ───────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Auto-login on startup ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const restoredUser = await authService.restoreSession();
        if (!cancelled) {
          setUser(restoredUser);
        }
      } catch (err) {
        console.error('[AuthContext] Session restore error:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────

  const login = useCallback(async (
    email: string,
    password: string,
  ): Promise<AuthResponse> => {
    const result = await authService.login(email, password);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────

  const register = useCallback(async (
    username: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> => {
    const result = await authService.register(username, email, password);
    if (result.success && result.user) {
      // FreeAPI doesn't return token on register, user needs to login.
      // So don't set user state here to avoid unauthenticated dashboard state.
    }
    return result;
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────

  const logout = useCallback(async (): Promise<void> => {
    await authService.logout();
    setUser(null);
  }, []);

  // ── Refresh user profile ──────────────────────────────────────────────────

  const refreshUser = useCallback(async (): Promise<void> => {
    const freshUser = await authService.fetchProfile();
    if (freshUser) setUser(freshUser);
  }, []);

  // ── Update Avatar locally ─────────────────────────────────────────────────

  const updateAvatar = useCallback(async (uri: string): Promise<void> => {
    const updatedUser = await authService.updateAvatar(uri);
    if (updatedUser) setUser(updatedUser);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    updateAvatar,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
