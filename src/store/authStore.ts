// ──────────────────────────────────────────────────
// Golden Leaf Finance — Zustand Auth Store
// Persistent authentication state management
// Rule: Page refresh NEVER logs out; only explicit logout clears session
// ──────────────────────────────────────────────────

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type AuthUser, type UserRole, normalizeUserRole } from '../types';
import { useUIStore } from './uiStore';
import { markUserOffline, markUserOnline } from '../services/presenceService';

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
    const rawRole = (clone as any).role || 'branch_manager';
    clone.customClaims = {
      role: normalizeUserRole(rawRole),
      companyId: 'default',
      branchId: (clone as any).branchId,
      branchName: (clone as any).branchName,
    };
  } else {
    clone.customClaims = { ...clone.customClaims };
    if (clone.customClaims.role) {
      clone.customClaims.role = normalizeUserRole(clone.customClaims.role);
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
        const prevUser = get().user;
        const user = sanitizeUser(rawUser);
        if (user) {
          try {
            sessionStorage.setItem('glf_user_session', JSON.stringify(user));
          } catch (e) {
            console.warn('Failed to cache session user:', e);
          }
          void markUserOnline(user);
        } else {
          if (prevUser) {
            void markUserOffline(prevUser);
          }
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

      updateLastActivity: () => {
        const now = Date.now();
        // Throttle state update to at most once per 15 seconds to prevent component re-render thrashing
        if (now - get().lastActivity > 15000) {
          set({ lastActivity: now });
        }
      },

      // Terminate active session and purge storage
      logout: () => {
        const prevUser = get().user;
        if (prevUser) {
          void markUserOffline(prevUser);
        }
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

      hasRole: (role) => {
        const currentRole = get().user?.customClaims?.role;
        if (!currentRole) return false;
        return normalizeUserRole(currentRole) === normalizeUserRole(role);
      },

      getBranchId: () => get().user?.customClaims?.branchId,
    }),
    {
      name: 'glf-session-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionTimeout: state.sessionTimeout,
      }),
    }
  )
);
