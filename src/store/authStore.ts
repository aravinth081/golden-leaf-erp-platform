// ──────────────────────────────────────────────────
// Golden Leaf Finance — Zustand Auth Store
// Persistent authentication state management
// Rule: Page refresh NEVER logs out; only explicit logout clears session
// ──────────────────────────────────────────────────

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser, UserRole } from '../types';
import { useUIStore } from './uiStore';

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

// Helper to ensure role titles, custom claims and branch scope are consistent
const sanitizeUser = (user: AuthUser | null): AuthUser | null => {
  if (!user) return null;
  const clone = { ...user };

  // Normalize customClaims
  if (!clone.customClaims) {
    const rawRole = ((clone as any).role || 'branch_manager').toString().toLowerCase();
    clone.customClaims = {
      role: (rawRole === 'bm' ? 'branch_manager' : rawRole === 'cm' ? 'credit_manager' : rawRole) as UserRole,
      companyId: 'default',
      branchId: (clone as any).branchId,
      branchName: (clone as any).branchName,
    };
  } else {
    clone.customClaims = { ...clone.customClaims };
    if (clone.customClaims.role) {
      const rawRole = clone.customClaims.role.toString().toLowerCase();
      clone.customClaims.role = (rawRole === 'bm' ? 'branch_manager' : rawRole === 'cm' ? 'credit_manager' : rawRole) as UserRole;
    }
  }

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

// Purge legacy persistent localStorage tokens so closing the tab forces re-login
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('glf-auth');
    localStorage.removeItem('glf_user_session');
  }
} catch (e) {
  // Ignore in non-browser or sandbox environments
}

// Synchronously retrieve cached session from sessionStorage on frame 0 (tab-isolated)
const getInitialStoredAuth = (): { user: AuthUser | null; isAuthenticated: boolean } => {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const raw = sessionStorage.getItem('glf-session-auth') || sessionStorage.getItem('glf_user_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        const rawUser = parsed.state?.user || parsed.user || parsed;
        const user = sanitizeUser(rawUser);
        const isAuth = parsed.state?.isAuthenticated ?? !!user;
        if (user && user.uid) {
          return { user, isAuthenticated: isAuth };
        }
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached session auth:', e);
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
      sessionTimeout: 15, // 15 minutes banking/finance inactivity timeout
      lastActivity: Date.now(),

      setUser: (rawUser) => {
        const user = sanitizeUser(rawUser);
        if (user) {
          try {
            sessionStorage.setItem('glf_user_session', JSON.stringify(user));
          } catch (e) {
            console.warn('Failed to cache session user:', e);
          }
        } else {
          try {
            sessionStorage.removeItem('glf_user_session');
            sessionStorage.removeItem('glf-session-auth');
          } catch (e) {
            console.warn('Failed to remove session user:', e);
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

      // Terminate active session and purge storage
      logout: () => {
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('glf-session-auth');
            sessionStorage.removeItem('glf_user_session');
            localStorage.removeItem('glf-auth');
            localStorage.removeItem('glf_user_session');
          }
          useUIStore.getState().setSelectedBranchId(null);
        } catch (e) {
          console.warn('Failed to clear auth storage on logout:', e);
        }
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          lastActivity: Date.now(),
        });
      },

      hasRole: (role) => get().user?.customClaims?.role === role,

      getBranchId: () => get().user?.customClaims?.branchId,
    }),
    {
      name: 'glf-session-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionTimeout: state.sessionTimeout,
        lastActivity: state.lastActivity,
      }),
    }
  )
);
