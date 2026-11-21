// ──────────────────────────────────────────────────
// Golden Leaf Finance — Enterprise Resilient Lazy Loading & Route Preloader
// Automatic Exponential Retries, Chunk Error Recovery & Preload Registry
// Prevents dynamic import race conditions, chunk failures, and navigation lag
// ──────────────────────────────────────────────────

import React, { lazy, type ComponentType } from 'react';

// Registry of route component loaders for instant preloading
type ComponentFactory = () => Promise<{ default: ComponentType<any> }>;
const routeLoaderRegistry = new Map<string, ComponentFactory>();
const loadedModuleCache = new Map<string, Promise<{ default: ComponentType<any> }>>();

/**
 * Register a route loader factory and return a resilient lazy-loaded component
 * with progressive auto-retry on network/chunk errors.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  routeKey?: string,
  maxRetries = 3,
  delayMs = 250
): React.LazyExoticComponent<T> {
  if (routeKey) {
    routeLoaderRegistry.set(routeKey, factory as ComponentFactory);
  }

  return lazy((): Promise<{ default: T }> => {
    // If already preloaded or in flight, return existing promise
    if (routeKey && loadedModuleCache.has(routeKey)) {
      return loadedModuleCache.get(routeKey)! as Promise<{ default: T }>;
    }

    const loaderPromise = new Promise<{ default: T }>((resolve, reject) => {
      let attempts = 0;

      const runAttempt = () => {
        attempts++;
        factory()
          .then((module) => {
            resolve(module);
          })
          .catch((error: any) => {
            const isChunkOrNetworkError =
              error?.name === 'ChunkLoadError' ||
              (error?.message && (
                /Failed to fetch dynamically imported module/i.test(error.message) ||
                /Loading chunk/i.test(error.message) ||
                /Importing a module script failed/i.test(error.message) ||
                /NetworkError/i.test(error.message) ||
                /Load failed/i.test(error.message)
              ));

            if (attempts <= maxRetries) {
              const backoff = delayMs * Math.pow(1.5, attempts - 1);
              console.warn(
                `[lazyWithRetry] Retrying module "${routeKey || 'unknown'}" (${attempts}/${maxRetries}) in ${Math.round(backoff)}ms...`
              );
              setTimeout(runAttempt, backoff);
            } else if (isChunkOrNetworkError) {
              // If repeated retries fail due to server deployment hash changes,
              // safely trigger a clean reload to sync the browser cache
              const reloadKey = 'glf_chunk_reload_sync';
              const last = sessionStorage.getItem(reloadKey);
              const now = Date.now();
              if (!last || now - Number(last) > 10000) {
                sessionStorage.setItem(reloadKey, String(now));
                window.location.reload();
                return;
              }
              reject(error);
            } else {
              reject(error);
            }
          });
      };

      runAttempt();
    });

    if (routeKey) {
      loadedModuleCache.set(routeKey, loaderPromise as Promise<{ default: ComponentType<any> }>);
    }

    return loaderPromise;
  });
}

/**
 * Preload a route component on hover, focus, or idle
 */
export function preloadRoute(routePathOrKey: string): void {
  if (!routePathOrKey) return;
  const clean = routePathOrKey.replace(/^\//, '').split('?')[0];

  const factory = routeLoaderRegistry.get(clean) || routeLoaderRegistry.get(routePathOrKey);
  if (factory && !loadedModuleCache.has(clean)) {
    const promise = factory().catch((err) => {
      loadedModuleCache.delete(clean);
      console.warn(`[Preload] Module preload failed for "${routePathOrKey}":`, err);
      return Promise.reject(err);
    });
    loadedModuleCache.set(clean, promise);
  }
}

/**
 * Preload an array of high-priority routes during browser idle time
 */
export function preloadPriorityRoutes(keys: string[]): void {
  const runPreload = () => {
    keys.forEach((key) => {
      preloadRoute(key);
    });
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(runPreload, { timeout: 2500 });
  } else {
    setTimeout(runPreload, 1200);
  }
}
