// ──────────────────────────────────────────────────
// Golden Leaf Finance — Auth Listener & Presence Heartbeat Hook
// Synchronizes persistent local session with Zustand auth store
// Maintains live Online / Offline presence in Supabase across ALL roles
// ──────────────────────────────────────────────────

import { useEffect } from 'react';
import { useAuthStore } from '../store';
import {
  HEARTBEAT_INTERVAL_MS,
  markUserOnline,
  markUserOfflineKeepalive,
} from '../services/presenceService';

export function useAuthListener() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    // Synchronously ensure auth session is marked ready on first tick
    setLoading(false);
  }, [setLoading]);

  useEffect(() => {
    if (!isAuthenticated || !user?.uid) {
      return;
    }

    let cancelled = false;

    const sendHeartbeat = () => {
      if (!cancelled && useAuthStore.getState().isAuthenticated) {
        void markUserOnline(user);
      }
    };

    // Mark Online immediately on mount / login, and confirm shortly after in case of page refresh
    sendHeartbeat();
    const refreshConfirmTimer = window.setTimeout(sendHeartbeat, 1500);

    // Periodic heartbeat keeps user Online while logged in across all roles
    const heartbeatTimer = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    const handlePageHide = () => {
      if (useAuthStore.getState().isAuthenticated) {
        markUserOfflineKeepalive(user);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      cancelled = true;
      window.clearTimeout(refreshConfirmTimer);
      window.clearInterval(heartbeatTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [isAuthenticated, user]);
}
