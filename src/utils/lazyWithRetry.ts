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

const MODULE_LOAD_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|Loading chunk [\w\d_-]+ failed|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|not a valid JavaScript MIME type/i;

/**
 * Checks whether an error was caused by a failed/stale dynamic chunk or lazy module import.
 */
export function isModuleLoadError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { name?: string; message?: string };
  if (err.name === 'ChunkLoadError') return true;
  return Boolean(err.message && MODULE_LOAD_ERROR_PATTERN.test(err.message));
}

/**
 * Clears cached lazy module promises so a retry performs a clean import attempt.
 */
export function clearLazyModuleCache(routeKey?: string): void {
  if (routeKey) {
    loadedModuleCache.delete(routeKey);
  } else {
    loadedModuleCache.clear();
  }
}

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

  const createRetryingPromise = (): Promise<{ default: T }> => {
    return new Promise<{ default: T }>((resolve, reject) => {
      let attempts = 0;

      const runAttempt = () => {
        attempts++;
        factory()
          .then((module) => {
            if (!module || typeof module !== 'object' || !module.default) {
              const invalidErr = new Error(
                `ChunkLoadError: Lazy module "${routeKey || 'unknown'}" resolved without a valid default export.`
              );
              invalidErr.name = 'ChunkLoadError';
              throw invalidErr;
            }
            resolve(module);
          })
          .catch((error: any) => {
            if (attempts <= maxRetries) {
              const backoff = delayMs * Math.pow(1.5, attempts - 1);
              console.warn(
                `[lazyWithRetry] Retrying module "${routeKey || 'unknown'}" (${attempts}/${maxRetries}) in ${Math.round(backoff)}ms...`
              );
              setTimeout(runAttempt, backoff);
            } else {
              if (routeKey) loadedModuleCache.delete(routeKey);
              // Cleanly reject so React ErrorBoundary can handle recovery
              reject(error);
            }
          });
      };

      runAttempt();
    });
  };

  return lazy((): Promise<{ default: T }> => {
    // If already preloaded or in flight, return existing promise with eviction fallback
    if (routeKey && loadedModuleCache.has(routeKey)) {
      const cached = loadedModuleCache.get(routeKey)!;
      return cached.catch(() => {
        loadedModuleCache.delete(routeKey);
        const retryPromise = createRetryingPromise();
        loadedModuleCache.set(routeKey, retryPromise as Promise<{ default: ComponentType<any> }>);
        return retryPromise;
      }) as Promise<{ default: T }>;
    }

    const loaderPromise = createRetryingPromise();

    if (routeKey) {
      loadedModuleCache.set(routeKey, loaderPromise as Promise<{ default: ComponentType<any> }>);
    }

    return loaderPromise;
  });
}

/**
 * Preload a route component on hover, focus, or idle.
 * Never resolves cached promises to null on transient failures.
 */
export function preloadRoute(routePathOrKey: string): void {
  if (!routePathOrKey) return;
  const clean = routePathOrKey.replace(/^\//, '').split('?')[0];

  const factory = routeLoaderRegistry.get(clean) || routeLoaderRegistry.get(routePathOrKey);
  if (factory && !loadedModuleCache.has(clean)) {
    const promise = factory().then((module) => {
      if (!module || typeof module !== 'object' || !module.default) {
        throw new Error(`Invalid module preload for "${routePathOrKey}"`);
      }
      return module;
    });

    // Prevent unhandled promise rejections in background while clearing stale cache on failure
    promise.catch((err) => {
      if (loadedModuleCache.get(clean) === promise) {
        loadedModuleCache.delete(clean);
      }
      console.warn(`[Preload] Module preload deferred for "${routePathOrKey}":`, err);
    });

    loadedModuleCache.set(clean, promise);
  }
}

/**
 * Preload an array of high-priority routes sequentially during true browser idle time
 * Staggers loading to eliminate network congestion, memory spikes, and CPU freezing.
 */
export function preloadPriorityRoutes(keys: string[]): void {
  if (typeof window === 'undefined') return;

  // Protect mobile and low-resource devices from memory exhaustion & OOM crashes (Error 39)
  const isMobile = window.innerWidth < 1024;
  const isSaveData = (navigator as any)?.connection?.saveData === true;
  if (isMobile || isSaveData) {
    // Rely exclusively on onMouseEnter / onFocus preloading
    return;
  }

  const runSequentialPreload = () => {
    // Preload one module every 1.5 seconds to keep main thread completely unblocked
    keys.forEach((key, index) => {
      setTimeout(() => {
        preloadRoute(key);
      }, (index + 1) * 1500);
    });
  };

  // Wait 4 seconds after page load before starting background preloading
  if ('requestIdleCallback' in window) {
    setTimeout(() => {
      (window as any).requestIdleCallback(runSequentialPreload, { timeout: 4000 });
    }, 3500);
  } else {
    setTimeout(runSequentialPreload, 4000);
  }
}
