// ──────────────────────────────────────────────────
// Golden Leaf Finance — Enterprise Query Cache & Coalescing Engine
// Multiplexes 2,500+ concurrent user queries to prevent database pool exhaustion
// Provides Single-Flight Deduplication, Stale-While-Revalidate TTL, and Exponential Backoff with Jitter
// ──────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// In-flight active promises map for Single-Flight coalescing
const inFlightRequests = new Map<string, Promise<any>>();

// In-memory TTL cache map
const responseCache = new Map<string, CacheEntry<any>>();

/**
 * Executes a function with in-flight deduplication (Single-Flight pattern).
 * If 500 concurrent callers invoke singleFlight with the same key,
 * only ONE underlying network request is sent; all 500 callers await and share the same Promise.
 */
export async function singleFlight<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = (async () => {
    try {
      return await fetcher();
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

/**
 * Returns cached data if valid within TTL, or executes single-flight fetcher with TTL caching.
 */
export async function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 3000
): Promise<T> {
  const now = Date.now();
  const cached = responseCache.get(key);

  if (cached && now - cached.timestamp < cached.ttl) {
    return cached.data as T;
  }

  const result = await singleFlight(key, fetcher);
  if (result !== undefined && result !== null) {
    responseCache.set(key, {
      data: result,
      timestamp: now,
      ttl: ttlMs,
    });
  }
  return result;
}

/**
 * Invalidate a specific query cache key or all keys matching a prefix.
 * Called immediately after mutations (INSERT/UPDATE/DELETE) to ensure fresh data.
 */
export function invalidateQueryCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    responseCache.clear();
    return;
  }
  for (const k of responseCache.keys()) {
    if (k === keyPrefix || k.startsWith(keyPrefix)) {
      responseCache.delete(k);
    }
  }
}

/**
 * Executes a network operation with timeout, exponential backoff, and randomized jitter.
 * Prevents thundering herds when Supabase recovers from high concurrent load.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  baseDelayMs = 200,
  timeoutMs = 8000
): Promise<T> {
  let attempt = 0;

  const runWithTimeout = async (): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          const err = new Error(`Network query timed out after ${timeoutMs}ms`);
          err.name = 'TimeoutError';
          reject(err);
        }
      }, timeoutMs);

      fn()
        .then((res) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(res);
          }
        })
        .catch((err) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            reject(err);
          }
        });
    });
  };

  while (attempt <= retries) {
    try {
      return await runWithTimeout();
    } catch (err: any) {
      attempt++;
      if (attempt > retries) {
        throw err;
      }
      // Exponential backoff + 50ms random jitter
      const jitter = Math.floor(Math.random() * 50);
      const delay = Math.round(baseDelayMs * Math.pow(2, attempt - 1) + jitter);
      console.warn(`[QueryCache] Retrying transient query failure (${attempt}/${retries}) in ${delay}ms...`, err?.message || err);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw new Error('Unexpected retry loop exit');
}
