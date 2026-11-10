import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any fast-changing value (e.g. search queries).
 * Delays updating the debounced value until after the specified delay has elapsed
 * since the last time the value changed.
 *
 * @param value The value to debounce
 * @param delay Milliseconds to wait before updating (default 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
