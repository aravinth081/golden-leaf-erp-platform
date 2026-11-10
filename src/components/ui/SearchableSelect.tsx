import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, Search, Plus, AlertCircle } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SearchableSelectProps {
  label?: string;
  name?: string;
  value: string;
  onChange: (e: { target: { name: string; value: string } }) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  allowAdd?: boolean;
  error?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  name = '',
  value,
  onChange,
  options,
  placeholder = '-- SELECT --',
  className,
  allowAdd = false,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const displayItems = [{ value: 'select', label: '-- SELECT --' }];
  filteredOptions.forEach(opt => {
    if (opt.value !== 'select') displayItems.push(opt);
  });

  const canAdd = allowAdd && search.length > 0 && !options.some(o => o.label.toLowerCase() === search.toLowerCase());
  if (canAdd) {
    displayItems.push({ value: search, label: `Add "${search}"`, isAdd: true } as any);
  }

  useEffect(() => {
    setHighlightedIndex(0);
  }, [search, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const el = document.getElementById('searchable-select-item-highlighted');
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (val: string) => {
    onChange({ target: { name, value: val } });
    setIsOpen(false);
    setSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < displayItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < displayItems.length) {
        handleSelect(displayItems[highlightedIndex].value);
      }
    }
  };

  return (
    <div className={clsx('flex flex-col gap-1.5 relative', className)} ref={wrapperRef}>
      {label && (
        <label className="text-sm font-medium text-[#0B1F3A] font-body">
          {label}
        </label>
      )}
      
      <div 
        id={name}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={clsx(
          'w-full min-h-[44px] rounded-xl appearance-none flex items-center justify-between',
          'bg-white border text-rich-black px-4 py-2.5 text-sm cursor-pointer',
          'transition-all duration-250',
          isOpen 
            ? 'border-[#C9A227] ring-1 ring-[#C9A227] outline-none' 
            : error 
              ? 'border-status-error ring-1 ring-status-error/50' 
              : 'border-gray-300 hover:border-gray-400'
        )}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            setIsOpen(false);
          } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : (value && value !== 'select' ? value : placeholder)}</span>
        <ChevronDown size={18} className="text-gray-400 pointer-events-none" />
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs text-status-error font-body -mt-0.5">
          <AlertCircle size={12} />
          {error}
        </p>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 top-full bg-white border border-gray-200 rounded-sm shadow-lg overflow-hidden flex flex-col max-h-60">
          <div className="p-1.5 border-b border-gray-100 flex items-center gap-2 sticky top-0 bg-white">
            <input 
              type="text" 
              className="w-full text-sm outline-none border border-gray-300 rounded-sm px-2 py-1.5"
              placeholder=""
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto">
            {displayItems.length > 0 ? displayItems.map((item, index) => {
              if ((item as any).isAdd) {
                return (
                  <div 
                    key={`add-${index}`}
                    id={index === highlightedIndex ? 'searchable-select-item-highlighted' : undefined}
                    className={clsx(
                      "px-4 py-2 text-sm cursor-pointer flex items-center gap-2 border-t border-gray-100",
                      index === highlightedIndex ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-blue-50 text-blue-600 font-medium"
                    )}
                    onClick={() => handleSelect(item.value)}
                  >
                    <Plus size={16} /> {item.label}
                  </div>
                );
              }

              if (item.value === 'select') {
                return (
                  <div 
                    key="select"
                    id={index === highlightedIndex ? 'searchable-select-item-highlighted' : undefined}
                    className={clsx(
                      "px-4 py-2 text-sm cursor-pointer",
                      index === highlightedIndex ? "bg-blue-100 text-blue-800" : "hover:bg-gray-100 bg-gray-200 text-gray-700"
                    )}
                    onClick={() => handleSelect('select')}
                  >
                    -- SELECT --
                  </div>
                );
              }

              return (
                <div 
                  key={item.value}
                  id={index === highlightedIndex ? 'searchable-select-item-highlighted' : undefined}
                  className={clsx(
                    "px-4 py-2 text-sm cursor-pointer",
                    index === highlightedIndex ? "bg-blue-100 text-blue-800" : "hover:bg-gray-100",
                    item.value === value && "bg-blue-50 text-blue-600 font-medium"
                  )}
                  onClick={() => handleSelect(item.value)}
                >
                  {item.label}
                </div>
              );
            }) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
