// ──────────────────────────────────────────────────
// Golden Leaf Finance — Live User Presence Service
// Tracks real login / logout / heartbeat presence across ALL roles
// Uses Supabase `documents` (`user_presence`) + Supabase Realtime Presence
// ──────────────────────────────────────────────────

import type { RealtimeChannel } from '@supabase/supabase-js';
import type { AuthUser } from '../types/auth.types';
import {
  supabase,
  isSupabaseConfigured,
  supabaseUrl,
  supabaseAnonKey,
} from '../lib/supabase';

export const PRESENCE_COLLECTION = 'user_presence';
const PRESENCE_CACHE_KEY = 'glf_user_presence_cache_v1';
const TAB_SESSION_KEY = 'glf_presence_tab_session_id';
const PRESENCE_CHANNEL_NAME = 'glf-global-online-presence';

export const HEARTBEAT_INTERVAL_MS = 25 * 1000; // 25s heartbeat while logged in
export const PRESENCE_TTL_MS = 75 * 1000; // Consider offline if no heartbeat in 75s

export interface UserPresenceRecord {
  userId: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  isOnline: boolean;
  sessionId: string;
  loginAt: string;
  lastHeartbeatAt: string;
  logoutAt: string | null;
  updatedAt: string;
}

export type PresenceSubscriber = (
  records: UserPresenceRecord[],
  realtimeOnlineMap: Map<string, string>
) => void;

const subscribers = new Set<PresenceSubscriber>();
let sharedChannel: RealtimeChannel | null = null;
let sharedChannelSubscribed = false;
let activeSessionUser: AuthUser | null = null;
let activeLoginTimestamp: string | null = null;
let latestCachedRecords: UserPresenceRecord[] = [];
let realtimeOnlineMap = new Map<string, string>(); // key -> onlineAt ISO

export function normalizePresenceKey(val?: string | null): string {
  return (val || '')
    .trim()
    .toLowerCase()
    .replace(/^@+|@+$/g, '')
    .replace(/[\s._-]+/g, '');
}

function getTabSessionId(): string {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      let existing = sessionStorage.getItem(TAB_SESSION_KEY);
      if (!existing) {
        existing = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        sessionStorage.setItem(TAB_SESSION_KEY, existing);
      }
      return existing;
    }
  } catch {
    // Ignore storage errors
  }
  return `sess-mem-${Date.now()}`;
}

function resolveUsernameFromLocalProfiles(user: AuthUser): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem('glf_staff_profiles_master_v3');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const match = list.find(
            (p: any) =>
              p &&
              (p.id === user.uid ||
                (user.email && p.email?.toLowerCase() === user.email.toLowerCase()))
          );
          if (match?.username) {
            return String(match.username).replace(/^@+|@+$/g, '').trim();
          }
        }
      }
    }
  } catch {
    // Ignore parse errors
  }

  if (user.email && user.email.includes('@')) {
    return user.email.split('@')[0].trim();
  }
  return (user.displayName || user.uid || '').trim();
}

export function readCachedPresenceRecords(): UserPresenceRecord[] {
  if (latestCachedRecords.length > 0) {
    return latestCachedRecords;
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(PRESENCE_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          latestCachedRecords = parsed;
          return parsed;
        }
      }
    }
  } catch {
    // Ignore cache read error
  }
  return [];
}

function writeCachedPresenceRecords(records: UserPresenceRecord[]): void {
  latestCachedRecords = records;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(PRESENCE_CACHE_KEY, JSON.stringify(records));
    }
  } catch {
    // Ignore storage quota errors
  }
}

function upsertCachedRecord(record: UserPresenceRecord): void {
  const existing = readCachedPresenceRecords();
  const next = existing.filter((r) => r.userId !== record.userId);
  next.unshift(record);
  writeCachedPresenceRecords(next);
}

function notifyAllSubscribers(): void {
  const records = readCachedPresenceRecords();
  const rtCopy = new Map(realtimeOnlineMap);
  subscribers.forEach((cb) => {
    try {
      cb(records, rtCopy);
    } catch (e) {
      console.warn('[Presence] Subscriber error:', e);
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('glf-presence-updated'));
  }
}

function extractRealtimeOnlineKeys(): Map<string, string> {
  const next = new Map<string, string>();
  if (!sharedChannel) return next;
  try {
    const state = sharedChannel.presenceState<Record<string, any>>();
    Object.values(state).forEach((presences) => {
      if (!Array.isArray(presences)) return;
      presences.forEach((entry: any) => {
        const onlineAt = entry?.onlineAt || new Date().toISOString();
        if (entry?.userId) {
          next.set(String(entry.userId), onlineAt);
        }
        const uKey = normalizePresenceKey(entry?.username);
        if (uKey) {
          next.set(`user:${uKey}`, onlineAt);
        }
        if (entry?.email) {
          next.set(`email:${String(entry.email).trim().toLowerCase()}`, onlineAt);
        }
      });
    });
  } catch {
    // Ignore channel state errors
  }
  return next;
}

function ensureRealtimeChannel(): RealtimeChannel | null {
  if (!isSupabaseConfigured() || !supabase) return null;
  if (sharedChannel) return sharedChannel;

  const channel = supabase.channel(PRESENCE_CHANNEL_NAME, {
    config: {
      presence: {
        key: getTabSessionId(),
      },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      realtimeOnlineMap = extractRealtimeOnlineKeys();
      notifyAllSubscribers();
    })
    .on('presence', { event: 'join' }, () => {
      realtimeOnlineMap = extractRealtimeOnlineKeys();
      notifyAllSubscribers();
    })
    .on('presence', { event: 'leave' }, () => {
      realtimeOnlineMap = extractRealtimeOnlineKeys();
      notifyAllSubscribers();
    })
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'documents',
        filter: `collection=eq.${PRESENCE_COLLECTION}`,
      },
      (payload: any) => {
        const row = payload?.new;
        if (row?.data && row.data.userId) {
          upsertCachedRecord(row.data as UserPresenceRecord);
          notifyAllSubscribers();
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        sharedChannelSubscribed = true;
        if (activeSessionUser) {
          void trackCurrentUserOnChannel(activeSessionUser);
        }
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        sharedChannelSubscribed = false;
      }
    });

  sharedChannel = channel;
  return channel;
}

function teardownChannelIfIdle(): void {
  if (!activeSessionUser && subscribers.size === 0 && sharedChannel && supabase) {
    try {
      void supabase.removeChannel(sharedChannel);
    } catch {
      // Ignore cleanup error
    }
    sharedChannel = null;
    sharedChannelSubscribed = false;
    realtimeOnlineMap = new Map();
  }
}

async function trackCurrentUserOnChannel(user: AuthUser, explicitUsername?: string): Promise<void> {
  const channel = ensureRealtimeChannel();
  if (!channel || !sharedChannelSubscribed) return;

  const username = explicitUsername || resolveUsernameFromLocalProfiles(user);
  try {
    await channel.track({
      userId: user.uid,
      username,
      email: user.email || '',
      role: user.customClaims?.role || 'collection_agent',
      sessionId: getTabSessionId(),
      onlineAt: activeLoginTimestamp || new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Presence] Realtime track failed:', err);
  }
}

/**
 * Marks the currently authenticated user as Online in Supabase + Realtime Presence.
 * Applies identically to all roles (Admin, HR, BM, CM, CRO, etc.).
 */
export async function markUserOnline(
  user: AuthUser,
  explicitUsername?: string
): Promise<void> {
  if (!user || !user.uid) return;

  activeSessionUser = user;
  const nowIso = new Date().toISOString();
  if (!activeLoginTimestamp) {
    activeLoginTimestamp = nowIso;
  }

  const username = (explicitUsername || resolveUsernameFromLocalProfiles(user))
    .replace(/^@+|@+$/g, '')
    .trim();

  const record: UserPresenceRecord = {
    userId: user.uid,
    username,
    displayName: user.displayName || username || 'Staff User',
    email: (user.email || '').trim().toLowerCase(),
    role: user.customClaims?.role || 'collection_agent',
    isOnline: true,
    sessionId: getTabSessionId(),
    loginAt: activeLoginTimestamp,
    lastHeartbeatAt: nowIso,
    logoutAt: null,
    updatedAt: nowIso,
  };

  upsertCachedRecord(record);
  notifyAllSubscribers();

  ensureRealtimeChannel();
  void trackCurrentUserOnChannel(user, username);

  if (isSupabaseConfigured() && supabase) {
    supabase
      .from('documents')
      .upsert({
        collection: PRESENCE_COLLECTION,
        id: user.uid,
        data: record,
        is_deleted: false,
        created_at: record.loginAt,
        updated_at: nowIso,
      })
      .then(
        ({ error }) => {
          if (error) {
            console.warn('[Supabase] Online presence upsert error:', error.message);
          }
        },
        (err: unknown) => {
          console.warn('[Supabase] Online presence upsert failed:', err);
        }
      );
  }
}

/**
 * Marks the specified user as Offline in Supabase + untracks Realtime Presence.
 */
export async function markUserOffline(user: AuthUser): Promise<void> {
  if (!user || !user.uid) return;

  if (activeSessionUser?.uid === user.uid) {
    activeSessionUser = null;
    activeLoginTimestamp = null;
  }

  const nowIso = new Date().toISOString();
  const username = resolveUsernameFromLocalProfiles(user);
  const existing = readCachedPresenceRecords().find((r) => r.userId === user.uid);

  const offlineRecord: UserPresenceRecord = {
    userId: user.uid,
    username,
    displayName: user.displayName || existing?.displayName || username || 'Staff User',
    email: (user.email || existing?.email || '').trim().toLowerCase(),
    role: user.customClaims?.role || existing?.role || 'collection_agent',
    isOnline: false,
    sessionId: getTabSessionId(),
    loginAt: existing?.loginAt || nowIso,
    lastHeartbeatAt: existing?.lastHeartbeatAt || nowIso,
    logoutAt: nowIso,
    updatedAt: nowIso,
  };

  upsertCachedRecord(offlineRecord);

  if (sharedChannel) {
    try {
      await sharedChannel.untrack();
    } catch {
      // Ignore untrack error
    }
  }

  notifyAllSubscribers();
  teardownChannelIfIdle();

  if (isSupabaseConfigured() && supabase) {
    supabase
      .from('documents')
      .upsert({
        collection: PRESENCE_COLLECTION,
        id: user.uid,
        data: offlineRecord,
        is_deleted: false,
        created_at: offlineRecord.loginAt,
        updated_at: nowIso,
      })
      .then(
        ({ error }) => {
          if (error) {
            console.warn('[Supabase] Offline presence upsert error:', error.message);
          }
        },
        (err: unknown) => {
          console.warn('[Supabase] Offline presence upsert failed:', err);
        }
      );
  }
}

/**
 * Marks any target user Offline by identity (e.g. when placed On Hold by Admin).
 */
export async function markUserOfflineByIdentity(identity: {
  userId: string;
  username?: string;
  displayName?: string;
  email?: string;
  role?: string;
}): Promise<void> {
  if (!identity.userId) return;

  const nowIso = new Date().toISOString();
  const existing = readCachedPresenceRecords().find((r) => r.userId === identity.userId);

  const offlineRecord: UserPresenceRecord = {
    userId: identity.userId,
    username: (identity.username || existing?.username || '').replace(/^@+|@+$/g, '').trim(),
    displayName: identity.displayName || existing?.displayName || 'Staff User',
    email: (identity.email || existing?.email || '').trim().toLowerCase(),
    role: identity.role || existing?.role || 'collection_agent',
    isOnline: false,
    sessionId: existing?.sessionId || '',
    loginAt: existing?.loginAt || nowIso,
    lastHeartbeatAt: existing?.lastHeartbeatAt || nowIso,
    logoutAt: nowIso,
    updatedAt: nowIso,
  };

  upsertCachedRecord(offlineRecord);
  notifyAllSubscribers();

  if (isSupabaseConfigured() && supabase) {
    supabase
      .from('documents')
      .upsert({
        collection: PRESENCE_COLLECTION,
        id: identity.userId,
        data: offlineRecord,
        is_deleted: false,
        created_at: offlineRecord.loginAt,
        updated_at: nowIso,
      })
      .then(
        ({ error }) => {
          if (error) {
            console.warn('[Supabase] Target offline presence update error:', error.message);
          }
        },
        (err: unknown) => {
          console.warn('[Supabase] Target offline presence update failed:', err);
        }
      );
  }
}

/**
 * Fires a keepalive REST request on tab close (`pagehide`) so closing the tab
 * marks the session Offline immediately without waiting for heartbeat timeout.
 */
export function markUserOfflineKeepalive(user: AuthUser): void {
  if (!user || !user.uid || !isSupabaseConfigured()) return;

  const nowIso = new Date().toISOString();
  const username = resolveUsernameFromLocalProfiles(user);
  const existing = readCachedPresenceRecords().find((r) => r.userId === user.uid);

  const offlineRecord: UserPresenceRecord = {
    userId: user.uid,
    username,
    displayName: user.displayName || existing?.displayName || username || 'Staff User',
    email: (user.email || existing?.email || '').trim().toLowerCase(),
    role: user.customClaims?.role || existing?.role || 'collection_agent',
    isOnline: false,
    sessionId: getTabSessionId(),
    loginAt: existing?.loginAt || activeLoginTimestamp || nowIso,
    lastHeartbeatAt: existing?.lastHeartbeatAt || nowIso,
    logoutAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    void fetch(`${supabaseUrl}/rest/v1/documents`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        collection: PRESENCE_COLLECTION,
        id: user.uid,
        data: offlineRecord,
        is_deleted: false,
        created_at: offlineRecord.loginAt,
        updated_at: nowIso,
      }),
    });
  } catch {
    // Ignore unload fetch failures
  }
}

/**
 * Fetches all presence records directly from Supabase (no stale query cache).
 */
export async function fetchAllPresenceRecords(): Promise<UserPresenceRecord[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return readCachedPresenceRecords();
  }

  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id, data, updated_at')
      .eq('collection', PRESENCE_COLLECTION)
      .eq('is_deleted', false);

    if (error) {
      console.warn('[Supabase] Fetch presence records error:', error.message);
      return readCachedPresenceRecords();
    }

    const records: UserPresenceRecord[] = [];
    if (Array.isArray(data)) {
      data.forEach((row: any) => {
        if (row?.data && typeof row.data === 'object') {
          records.push({
            ...row.data,
            userId: row.data.userId || row.id,
          } as UserPresenceRecord);
        }
      });
    }

    writeCachedPresenceRecords(records);
    return records;
  } catch (err) {
    console.warn('[Supabase] Failed to fetch user presence:', err);
    return readCachedPresenceRecords();
  }
}

/**
 * Subscribes to live presence changes (Realtime + DB changes + 10s sync poll).
 */
export function subscribeToPresenceUpdates(onChange: PresenceSubscriber): () => void {
  subscribers.add(onChange);
  ensureRealtimeChannel();

  const emitLatest = () => {
    realtimeOnlineMap = extractRealtimeOnlineKeys();
    onChange(readCachedPresenceRecords(), new Map(realtimeOnlineMap));
  };

  const syncNow = () => {
    void fetchAllPresenceRecords().then(() => {
      if (subscribers.has(onChange)) {
        emitLatest();
      }
    });
  };

  emitLatest();
  syncNow();

  const pollTimer = window.setInterval(syncNow, 10 * 1000);
  const handleLocalEvent = () => emitLatest();
  window.addEventListener('glf-presence-updated', handleLocalEvent);

  return () => {
    subscribers.delete(onChange);
    window.clearInterval(pollTimer);
    window.removeEventListener('glf-presence-updated', handleLocalEvent);
    teardownChannelIfIdle();
  };
}

function formatPresenceTime(isoString?: string | null): string {
  if (!isoString) return '';
  const dt = new Date(isoString);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function isSameAuthUser(
  account: { id: string; username?: string; email?: string },
  currentUser: AuthUser
): boolean {
  if (account.id && currentUser.uid && account.id === currentUser.uid) {
    return true;
  }
  const accEmail = (account.email || '').trim().toLowerCase();
  const curEmail = (currentUser.email || '').trim().toLowerCase();
  if (accEmail && curEmail && accEmail === curEmail) {
    return true;
  }
  const accUserKey = normalizePresenceKey(account.username);
  const curResolvedKey = normalizePresenceKey(resolveUsernameFromLocalProfiles(currentUser));
  if (accUserKey && curResolvedKey && accUserKey === curResolvedKey) {
    return true;
  }
  return false;
}

/**
 * Resolves true Online / Offline presence for any staff account across all roles.
 */
export function resolveAccountPresence(
  account: { id: string; username?: string; email?: string; status: string },
  records: UserPresenceRecord[],
  realtimeMap: Map<string, string>,
  currentUser: AuthUser | null,
  isAuthenticated: boolean
): { isOnline: boolean; lastSeen: string } {
  // 1. Suspended / On-Hold accounts are always Offline
  if (account.status === 'on_hold' || account.status === 'inactive') {
    return { isOnline: false, lastSeen: 'Account on hold' };
  }

  // 2. Currently authenticated user in this browser session is always Online
  if (currentUser && isAuthenticated && isSameAuthUser(account, currentUser)) {
    return { isOnline: true, lastSeen: 'Online now' };
  }

  const accUserKey = normalizePresenceKey(account.username);
  const accEmail = (account.email || '').trim().toLowerCase();

  // Find latest matching presence record from Supabase
  const matching = records.filter((r) => {
    if (r.userId && account.id && r.userId === account.id) return true;
    const rUserKey = normalizePresenceKey(r.username);
    if (accUserKey && rUserKey && accUserKey === rUserKey) return true;
    const rEmail = (r.email || '').trim().toLowerCase();
    if (accEmail && rEmail && accEmail === rEmail) return true;
    return false;
  });

  matching.sort((a, b) => {
    const ta = new Date(a.updatedAt || a.lastHeartbeatAt || 0).getTime();
    const tb = new Date(b.updatedAt || b.lastHeartbeatAt || 0).getTime();
    return tb - ta;
  });

  const record = matching[0];

  // Check Realtime Presence channel
  const realtimeOnlineAt =
    realtimeMap.get(account.id) ||
    (accUserKey ? realtimeMap.get(`user:${accUserKey}`) : undefined) ||
    (accEmail ? realtimeMap.get(`email:${accEmail}`) : undefined);

  if (record) {
    if (!record.isOnline) {
      // Explicit logout or tab close recorded. Only treat as Online if a newer Realtime join exists.
      if (realtimeOnlineAt && record.logoutAt) {
        const rtMs = new Date(realtimeOnlineAt).getTime();
        const outMs = new Date(record.logoutAt).getTime();
        if (!Number.isNaN(rtMs) && !Number.isNaN(outMs) && rtMs > outMs + 2000) {
          return { isOnline: true, lastSeen: 'Online now' };
        }
      }
      const formattedLogout = formatPresenceTime(record.logoutAt || record.updatedAt);
      return {
        isOnline: false,
        lastSeen: formattedLogout ? `Logged out • ${formattedLogout}` : 'Offline',
      };
    }

    // Record claims Online — verify heartbeat freshness (TTL) OR active Realtime presence
    const hbTime = new Date(record.lastHeartbeatAt || record.updatedAt).getTime();
    const ageMs = Date.now() - hbTime;
    if ((!Number.isNaN(ageMs) && ageMs <= PRESENCE_TTL_MS) || Boolean(realtimeOnlineAt)) {
      return { isOnline: true, lastSeen: 'Online now' };
    }

    const formattedLastSeen = formatPresenceTime(record.lastHeartbeatAt || record.updatedAt);
    return {
      isOnline: false,
      lastSeen: formattedLastSeen ? `Last seen • ${formattedLastSeen}` : 'Offline',
    };
  }

  // No DB presence record yet — check Realtime fallback
  if (realtimeOnlineAt) {
    return { isOnline: true, lastSeen: 'Online now' };
  }

  return { isOnline: false, lastSeen: 'Offline' };
}
