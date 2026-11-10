// ──────────────────────────────────────────────────
// Golden Leaf Finance — Zustand Auth Store
// Persistent authentication state management
// Rule: Page refresh NEVER logs out; only explicit logout clears session
// ──────────────────────────────────────────────────

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, UserRole } from '../types';

interface AuthStore {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionTimeout: number; // minutes
  lastActivity: number;

  // Actions
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateLastActivity: () => void;
  logout: () => void;

  // Derived
  hasRole: (role: UserRole) => boolean;
  getBranchId: () => string | undefined;
}

// Helper to ensure role titles and agent display names are modern and consistent
const sanitizeUser = (user: AuthUser | null): AuthUser | null => {
  if (!user) return null;
  const clone = { ...user };
  if (clone.displayName) {
    if (clone.displayName.trim().toLowerCase() === 'agent' || clone.displayName.trim().toLowerCase() === 'collection agent') {
      clone.displayName = 'Customer Relationship Officer (CRO)';
    } else {
      clone.displayName = clone.displayName.replace(/collection\s*agent/gi, 'Customer Relationship Officer (CRO)').replace(/\bagent\b/gi, 'CRO');
    }
  } else if (clone.customClaims?.role === 'collection_agent') {
    clone.displayName = 'Customer Relationship Officer (CRO)';
  }
  return clone;
};

// Synchronously retrieve cached session from localStorage on frame 0
const getInitialStoredAuth = (): { user: AuthUser | null; isAuthenticated: boolean } => {
  try {
    const raw = localStorage.getItem('glf-auth') || localStorage.getItem('glf_user_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      const rawUser = parsed.state?.user || parsed.user || parsed;
      const user = sanitizeUser(rawUser);
      const isAuth = parsed.state?.isAuthenticated ?? !!user;
      if (user && user.uid) {
        return { user, isAuthenticated: isAuth };
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached auth:', e);
  }
  return { user: null, isAuthenticated: false };
};

const initialAuth = getInitialStoredAuth();

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: initialAuth.user,
      isAuthenticated: initialAuth.isAuthenticated,
      isLoading: false, // Frame-0 ready, no skeleton or auth flicker
      error: null,
      sessionTimeout: 60 * 24 * 30, // 30 days persistent session
      lastActivity: Date.now(),

      setUser: (rawUser) => {
        const user = sanitizeUser(rawUser);
        if (user) {
          try {
            localStorage.setItem('glf_user_session', JSON.stringify(user));
          } catch (e) {
            console.warn('Failed to cache user session:', e);
          }
        } else {
          try {
            localStorage.removeItem('glf_user_session');
          } catch (e) {
            console.warn('Failed to remove user session:', e);
          }
        }
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          error: null,
          lastActivity: Date.now(),
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),

      updateLastActivity: () => set({ lastActivity: Date.now() }),

      // STRICT: Logout ONLY occurs when user explicitly clicks logout button
      logout: () => {
        try {
          localStorage.removeItem('glf-auth');
          localStorage.removeItem('glf_user_session');
        } catch (e) {
          console.warn('Failed to clear auth storage on logout:', e);
        }
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      hasRole: (role) => get().user?.customClaims?.role === role,

      getBranchId: () => get().user?.customClaims?.branchId,
    }),
    {
      name: 'glf-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionTimeout: state.sessionTimeout,
      }),
    }
  )
);
