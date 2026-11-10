// ──────────────────────────────────────────────────
// Golden Leaf Finance — Search Input Component
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { clsx } from 'clsx';

export interface SearchInputProps {
  value?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  autoFocus?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value: externalValue,
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
  className,
  autoFocus = false,
}) => {
  const [internalValue, setInternalValue] = useState(externalValue || '');

  useEffect(() => {
    if (externalValue !== undefined) setInternalValue(externalValue);
  }, [externalValue]);

  // Debounced search with sequence tracking to prevent stale results
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(internalValue);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onSearch]);

  const handleClear = useCallback(() => {
    setInternalValue('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className={clsx('relative', className)}>
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rich-silver pointer-events-none" />
      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && internalValue) {
            e.preventDefault();
            handleClear();
          }
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={clsx(
          'w-full pl-10 pr-10 py-2.5 min-h-[44px] rounded-xl',
          'bg-white border border-rich-light/50 text-rich-black',
          'placeholder:text-rich-silver text-xs sm:text-sm font-body',
          'transition-all duration-250',
          'focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20',
          'hover:border-gold-400 shadow-xs'
        )}
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-rich-silver hover:text-rich-black hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
