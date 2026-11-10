// ──────────────────────────────────────────────────
// Golden Leaf Finance — Auth Listener Hook
// Synchronizes persistent local session with Zustand auth store
// 100% Free of Firebase Auth • Zero Logout on Page Refresh
// ──────────────────────────────────────────────────

import { useEffect } from 'react';
import { useAuthStore } from '../store';

export function useAuthListener() {
  const { setLoading } = useAuthStore();

  useEffect(() => {
    // Synchronously ensure auth session is marked ready on first tick
    setLoading(false);
  }, [setLoading]);
}
