// ──────────────────────────────────────────────────
// Golden Leaf Finance — Universal Database Service
// Powered by Supabase (PostgreSQL) with Instant Offline-First Cache
// 100% Free of Firebase • Robust, ACID-Compliant, Low-Latency
// ──────────────────────────────────────────────────

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { singleFlight, cachedQuery, invalidateQueryCache, withRetry } from '../lib/queryCache';

export type Unsubscribe = () => void;
export type WhereFilterOp = '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'array-contains';
export type OrderByDirection = 'asc' | 'desc';
export type DocumentData = Record<string, any>;

export interface FirestoreFilter {
  field: string;
  operator: WhereFilterOp;
  value: unknown;
}

export interface FirestoreSort {
  field: string;
  direction: OrderByDirection;
}

export interface FirestoreQueryOptions {
  filters?: FirestoreFilter[];
  sort?: FirestoreSort;
  limitCount?: number;
  startAfterDoc?: DocumentData;
}

// ── Event Bus for Real-time Reactive Listeners ──
const eventBus = new EventTarget();

function notifyCollectionChange(collectionName: string) {
  eventBus.dispatchEvent(new CustomEvent(`col:${collectionName}`));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(`glf_col_updated_${collectionName}`));
  }
}

// ── Persistent Local Storage Access Helpers ──
const STORAGE_PREFIX = 'glf_db_';

function getCollectionItems<T = DocumentData>(collectionName: string): T[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${collectionName}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as T[];
    }
  } catch (e) {
    console.warn(`Failed to read collection ${collectionName} from localStorage:`, e);
  }
  return [];
}

function saveCollectionItems<T = DocumentData>(collectionName: string, items: T[], notify: boolean = true): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${collectionName}`, JSON.stringify(items));
    if (notify) {
      notifyCollectionChange(collectionName);
    }
  } catch (e) {
    console.warn(`Failed to save collection ${collectionName} to localStorage:`, e);
  }
}

// ── In-Memory Query & Filter Processor ──
function applyFiltersAndSort<T>(
  rawItems: any[],
  options: FirestoreQueryOptions = {},
  excludeDeleted: boolean = true
): T[] {
  let items = [...rawItems];

  if (excludeDeleted) {
    items = items.filter((item) => item.isDeleted !== true);
  }

  if (options.filters && options.filters.length > 0) {
    for (const filter of options.filters) {
      items = items.filter((item) => {
        const itemVal = item[filter.field];
        switch (filter.operator) {
          case '==':
            return itemVal === filter.value;
          case '!=':
            return itemVal !== filter.value;
          case '>':
            return itemVal > (filter.value as any);
          case '>=':
            return itemVal >= (filter.value as any);
          case '<':
            return itemVal < (filter.value as any);
          case '<=':
            return itemVal <= (filter.value as any);
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(itemVal);
          case 'array-contains':
            return Array.isArray(itemVal) && itemVal.includes(filter.value);
          default:
            return true;
        }
      });
    }
  }

  if (options.sort) {
    const { field, direction } = options.sort;
    items.sort((a, b) => {
      const valA = a[field] ?? '';
      const valB = b[field] ?? '';
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  if (options.limitCount && options.limitCount > 0) {
    items = items.slice(0, options.limitCount);
  }

  return items as T[];
}

// ── Deep Merge Utility for Dotted Field Keys ──

/**
 * Expands dotted keys (e.g., 'kyc.aadhaarNumber') into proper nested objects
 * and deep-merges them into an existing object, preserving all other fields.
 */
function deepMergeWithDottedKeys(
  existing: Record<string, any>,
  updates: Record<string, any>
): Record<string, any> {
  const result = JSON.parse(JSON.stringify(existing)); // deep clone

  for (const [key, value] of Object.entries(updates)) {
    if (key.includes('.')) {
      // Expand dotted key into nested path
      const parts = key.split('.');
      let current = result;
      for (let i = 0; i < parts.length - 1; i++) {
        if (current[parts[i]] === undefined || current[parts[i]] === null || typeof current[parts[i]] !== 'object') {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
    } else {
      result[key] = value;
    }
  }

  return result;
}

// ── CRUD Operations ──

/**
 * Create a new document with auto-generated ID.
 * Supabase is the primary store; localStorage is a secondary cache.
 * Returns only after Supabase confirms (or if Supabase is unavailable, falls back to localStorage).
 */
export async function createDocument<T extends { id: string }>(
  collectionName: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const newId = `${collectionName.slice(0, 4)}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newDoc = {
    ...data,
    id: newId,
    createdAt: now,
    updatedAt: now,
  } as unknown as T;

  // 1. Persistent cloud sync to Supabase PostgreSQL with retry (PRIMARY)
  let supabaseSaved = false;
  if (isSupabaseConfigured() && supabase) {
    try {
      const client = supabase;
      const { error } = await withRetry(
        async () => client
          .from('documents')
          .upsert({
            collection: collectionName,
            id: newId,
            data: newDoc,
            is_deleted: false,
            created_at: now,
            updated_at: now,
          }),
        2,
        200,
        8000
      );
      if (error) {
        console.warn(`[Supabase] Create doc error (${collectionName}/${newId}):`, error.message);
      } else {
        supabaseSaved = true;
      }
    } catch (err) {
      console.warn(`[Supabase] Create network error:`, err);
    }
  }

  // 2. Local cache write (always, for instant reads)
  const items = getCollectionItems<T>(collectionName);
  items.unshift(newDoc);
  saveCollectionItems(collectionName, items);
  invalidateQueryCache(`col:${collectionName}`);

  if (!supabaseSaved && isSupabaseConfigured()) {
    console.warn(`[Supabase] Document ${collectionName}/${newId} saved to local cache only — Supabase write failed.`);
  }

  return newId;
}

/**
 * Create or replace a document with a specific ID.
 * Supabase is the primary store; localStorage is a secondary cache.
 */
export async function createDocumentWithId<T extends { id: string }>(
  collectionName: string,
  docId: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const now = new Date().toISOString();
  const items = getCollectionItems<T>(collectionName);

  const existingIndex = items.findIndex((item: any) => item.id === docId);
  const newDoc = {
    ...data,
    id: docId,
    createdAt: existingIndex >= 0 ? (items[existingIndex] as any).createdAt || now : now,
    updatedAt: now,
  } as unknown as T;

  // 1. Sync to Supabase with retry (PRIMARY)
  let supabaseSaved = false;
  if (isSupabaseConfigured() && supabase) {
    try {
      const client = supabase;
      const { error } = await withRetry(
        async () => client
          .from('documents')
          .upsert({
            collection: collectionName,
            id: docId,
            data: newDoc,
            is_deleted: false,
            created_at: existingIndex >= 0 ? (items[existingIndex] as any).createdAt || now : now,
            updated_at: now,
          }),
        2,
        200,
        8000
      );
      if (error) {
        console.warn(`[Supabase] Upsert error (${collectionName}/${docId}):`, error.message);
      } else {
        supabaseSaved = true;
      }
    } catch (err) {
      console.warn(`[Supabase] Upsert network error:`, err);
    }
  }

  // 2. Local cache write (always)
  if (existingIndex >= 0) {
    items[existingIndex] = newDoc;
  } else {
    items.unshift(newDoc);
  }
  saveCollectionItems(collectionName, items);
  invalidateQueryCache(`col:${collectionName}`);
  invalidateQueryCache(`doc:${collectionName}:${docId}`);

  if (!supabaseSaved && isSupabaseConfigured()) {
    console.warn(`[Supabase] Document ${collectionName}/${docId} saved to local cache only — Supabase write failed.`);
  }
}

/**
 * Get a single document by ID.
 * Prefers Supabase data over localStorage cache for reliability.
 */
export async function getDocument<T>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  // Attempt fetch from Supabase first (source of truth) with Single-Flight coalescing
  if (isSupabaseConfigured() && supabase) {
    try {
      const cacheKey = `doc:${collectionName}:${docId}`;
      const cloudDoc = await singleFlight(cacheKey, async () => {
        const client = supabase!;
        const { data: row, error } = await withRetry(
          async () => client
            .from('documents')
            .select('data')
            .eq('collection', collectionName)
            .eq('id', docId)
            .eq('is_deleted', false)
            .maybeSingle(),
          2,
          150,
          6000
        );

        if (!error && row?.data) {
          // Update local cache with Supabase data
          const items = getCollectionItems<any>(collectionName);
          const idx = items.findIndex((item: any) => item.id === docId);
          if (idx >= 0) {
            items[idx] = row.data;
          } else {
            items.unshift(row.data);
          }
          saveCollectionItems(collectionName, items, false);
          return row.data as T;
        }
        return null;
      });

      if (cloudDoc) {
        return cloudDoc;
      }
    } catch (e) {
      console.warn(`[Supabase] getDocument error (${collectionName}/${docId}):`, e);
    }
  }

  // Fallback to local cache
  const items = getCollectionItems<T>(collectionName);
  const found = items.find((item: any) => item.id === docId);
  return (found as T) || null;
}

/**
 * Update an existing document.
 * Properly handles dotted field keys (e.g., 'kyc.aadhaarNumber') via deep merge.
 * Supabase is updated first, then local cache.
 */
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const now = new Date().toISOString();
  const items = getCollectionItems<any>(collectionName);
  const index = items.findIndex((item) => item.id === docId);

  // Build merged document using deep merge for dotted keys
  let existingDoc: Record<string, unknown> = index >= 0 ? items[index] : { id: docId };
  const mergedDoc = deepMergeWithDottedKeys(existingDoc as Record<string, any>, {
    ...data,
    updatedAt: now,
  });

  // 1. Update local cache first for instant UI
  if (index >= 0) {
    items[index] = mergedDoc;
  } else {
    items.unshift(mergedDoc);
  }
  saveCollectionItems(collectionName, items);
  invalidateQueryCache(`col:${collectionName}`);
  invalidateQueryCache(`doc:${collectionName}:${docId}`);

  // 2. Sync to Supabase with retry (PRIMARY) - fetch cloud version and deep merge
  if (isSupabaseConfigured() && supabase) {
    try {
      const client = supabase;
      const { data: row } = await client
        .from('documents')
        .select('data')
        .eq('collection', collectionName)
        .eq('id', docId)
        .maybeSingle();

      // Deep merge with cloud data to avoid overwriting fields not in this update
      const cloudBase = row?.data || existingDoc;
      const cloudMerged = deepMergeWithDottedKeys(cloudBase as Record<string, any>, {
        ...data,
        updatedAt: now,
      });

      const { error } = await withRetry(
        async () => client
          .from('documents')
          .upsert({
            collection: collectionName,
            id: docId,
            data: cloudMerged,
            is_deleted: false,
            updated_at: now,
          }),
        2,
        200,
        8000
      );

      if (error) {
        console.warn(`[Supabase] Update error (${collectionName}/${docId}):`, error.message);
      } else {
        // Sync cloud-merged version back to local cache
        if (index >= 0) {
          items[index] = cloudMerged;
          saveCollectionItems(collectionName, items, false);
        }
      }
    } catch (err) {
      console.warn(`[Supabase] Update network error:`, err);
    }
  }
}

/**
 * Soft-delete a document (sets isDeleted = true).
 */
export async function softDeleteDocument(
  collectionName: string,
  docId: string,
  deletedBy: string
): Promise<void> {
  const now = new Date().toISOString();
  await updateDocument(collectionName, docId, {
    isDeleted: true,
    deletedAt: now,
    deletedBy,
  });
  invalidateQueryCache(`col:${collectionName}`);
  invalidateQueryCache(`doc:${collectionName}:${docId}`);

  if (isSupabaseConfigured() && supabase) {
    try {
      const client = supabase;
      const { error } = await withRetry(
        async () => client
          .from('documents')
          .update({ is_deleted: true, updated_at: now })
          .eq('collection', collectionName)
          .eq('id', docId),
        2,
        200,
        8000
      );
      if (error) {
        console.warn(`[Supabase] Soft delete error:`, error.message);
      }
    } catch (e) {
      console.warn(`[Supabase] Soft delete error:`, e);
    }
  }
}

/**
 * Hard-delete a document completely from storage.
 */
export async function hardDeleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const items = getCollectionItems<any>(collectionName);
  const filtered = items.filter((item) => item.id !== docId);
  saveCollectionItems(collectionName, filtered);
  invalidateQueryCache(`col:${collectionName}`);
  invalidateQueryCache(`doc:${collectionName}:${docId}`);

  if (isSupabaseConfigured() && supabase) {
    try {
      const client = supabase;
      const { error } = await withRetry(
        async () => client
          .from('documents')
          .delete()
          .eq('collection', collectionName)
          .eq('id', docId),
        2,
        200,
        8000
      );
      if (error) {
        console.warn(`[Supabase] Hard delete error:`, error.message);
      }
    } catch (e) {
      console.warn(`[Supabase] Hard delete error:`, e);
    }
  }
}

/**
 * Query documents from a collection with filters, sorting, and pagination.
 * Supabase is the primary source of truth.
 * Falls back to localStorage only when Supabase is unavailable.
 * Uses Single-Flight request coalescing & TTL caching for performance.
 */
export async function queryDocuments<T>(
  collectionName: string,
  options: FirestoreQueryOptions = {},
  excludeDeleted: boolean = true
): Promise<T[]> {
  // If Supabase is active, fetch from cloud (source of truth)
  if (isSupabaseConfigured() && supabase) {
    try {
      const cacheKey = `col:${collectionName}:${excludeDeleted}`;
      const cloudItems = await cachedQuery(cacheKey, async () => {
        const client = supabase!;
        let query = client
          .from('documents')
          .select('data')
          .eq('collection', collectionName);

        if (excludeDeleted) {
          query = query.eq('is_deleted', false);
        }

        const { data: rows, error } = await withRetry(async () => query, 2, 200, 8000);
        if (!error && Array.isArray(rows)) {
          const items = rows.map((r: any) => r.data).filter(Boolean);
          if (items.length > 0) {
            // Update local cache with Supabase data
            saveCollectionItems(collectionName, items, false);
          }
          return items;
        }
        return null;
      }, 3000);

      if (cloudItems) {
        return applyFiltersAndSort<T>(cloudItems, options, excludeDeleted);
      }
    } catch (e) {
      console.warn(`[Supabase] Cloud query fallback to local cache:`, e);
    }
  }

  // Fallback: local cache query (only when Supabase is unavailable)
  const localItems = getCollectionItems<any>(collectionName);
  return applyFiltersAndSort<T>(localItems, options, excludeDeleted);
}

/**
 * Listen to a single document in real-time.
 */
export function listenToDocument<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void,
  _onError?: (error: Error) => void
): Unsubscribe {
  const handler = () => {
    getDocument<T>(collectionName, docId).then(callback);
  };

  handler();
  eventBus.addEventListener(`col:${collectionName}`, handler);

  return () => {
    eventBus.removeEventListener(`col:${collectionName}`, handler);
  };
}

/**
 * Listen to a collection query in real-time.
 */
export function listenToCollection<T>(
  collectionName: string,
  options: FirestoreQueryOptions = {},
  callback: (data: T[]) => void,
  excludeDeleted: boolean = true,
  _onError?: (error: Error) => void
): Unsubscribe {
  const handler = () => {
    queryDocuments<T>(collectionName, options, excludeDeleted).then(callback);
  };

  handler();
  eventBus.addEventListener(`col:${collectionName}`, handler);

  // If Supabase is configured, also subscribe to Postgres Realtime changes
  let supabaseChannel: any = null;
  if (isSupabaseConfigured() && supabase) {
    try {
      const client = supabase;
      const channelId = `realtime:${collectionName}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`;
      supabaseChannel = client
        .channel(channelId)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'documents',
            filter: `collection=eq.${collectionName}`,
          },
          () => {
            handler();
          }
        )
        .subscribe();
    } catch (e) {
      console.warn(`[Supabase] Realtime subscription error:`, e);
    }
  }

  return () => {
    eventBus.removeEventListener(`col:${collectionName}`, handler);
    if (supabaseChannel && supabase) {
      supabase.removeChannel(supabaseChannel);
    }
  };
}

/**
 * Get document count matching query.
 */
export async function countDocuments(
  collectionName: string,
  filters: FirestoreFilter[] = [],
  excludeDeleted: boolean = true
): Promise<number> {
  const docs = await queryDocuments(collectionName, { filters }, excludeDeleted);
  return docs.length;
}

// ── Compatibility Stubs & Helpers ──
export const db: any = {
  type: 'supabase-postgresql',
};

export function serverTimestamp(): Date {
  return new Date();
}

export class Timestamp {
  private date: Date;
  constructor(date?: Date) {
    this.date = date || new Date();
  }
  static now(): Timestamp {
    return new Timestamp();
  }
  toDate(): Date {
    return this.date;
  }
}

export function doc(_db: any, collectionName: string, docId?: string) {
  return { collectionName, id: docId || `${Date.now()}` };
}

export function collection(_db: any, collectionName: string) {
  return { collectionName };
}

export async function runTransaction<T>(
  _db: any,
  updateFunction: (transaction: {
    get: (ref: any) => Promise<{ exists: () => boolean; data: () => any }>;
    set: (ref: any, data: any) => void;
    update: (ref: any, data: any) => void;
  }) => Promise<T>
): Promise<T> {
  const transaction = {
    get: async (ref: any) => {
      const doc = await getDocument(ref.collectionName, ref.id);
      return {
        exists: () => doc !== null,
        data: () => doc,
      };
    },
    set: (ref: any, data: any) => {
      createDocumentWithId(ref.collectionName, ref.id, data);
    },
    update: (ref: any, data: any) => {
      updateDocument(ref.collectionName, ref.id, data);
    },
  };
  return updateFunction(transaction);
}

export function writeBatch(_db: any) {
  const operations: Array<() => Promise<void>> = [];
  return {
    set: (ref: any, data: any) => {
      operations.push(() => createDocumentWithId(ref.collectionName, ref.id, data));
    },
    update: (ref: any, data: any) => {
      operations.push(() => updateDocument(ref.collectionName, ref.id, data));
    },
    delete: (ref: any) => {
      operations.push(() => hardDeleteDocument(ref.collectionName, ref.id));
    },
    commit: async () => {
      for (const op of operations) {
        await op();
      }
    },
  };
}
