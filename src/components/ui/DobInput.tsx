// ──────────────────────────────────────────────────
// Golden Leaf Finance — Normal DOB Input Component
// Allows standard text typing (DD-MM-YYYY) without native date-picker
// blue highlight segments or year-editing glitches, with optional calendar picker.
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { clsx } from 'clsx';
import { Calendar, AlertCircle } from 'lucide-react';
import {
  parseDobToDate,
  calculateAge,
  formatToStandardDob,
  formatDobToIso,
} from '../../utils/dateUtils';

export interface DobInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  error?: string;
  hint?: string;
  value?: string;
  onChange?: (e: { target: { name: string; value: string } }) => void;
  onAgeCalculated?: (age: number) => void;
  containerClassName?: string;
  showCalendarPicker?: boolean;
}

export const DobInput = forwardRef<HTMLInputElement, DobInputProps>(
  (
    {
      label,
      error,
      hint,
      value = '',
      onChange,
      onAgeCalculated,
      containerClassName,
      className,
      name = 'dob',
      id,
      placeholder = 'DD-MM-YYYY',
      showCalendarPicker = true,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || `dob-input-${name}`;
    const hiddenDateRef = useRef<HTMLInputElement>(null);

    // Format display value to DD-MM-YYYY (e.g. if ISO '1980-01-01' is passed in)
    const [displayVal, setDisplayVal] = useState<string>(() => formatToStandardDob(value));

    // Keep internal display synced with external value changes
    useEffect(() => {
      const formatted = formatToStandardDob(value);
      setDisplayVal(formatted);
      if (formatted && onAgeCalculated) {
        const age = calculateAge(formatted);
        if (age > 0) {
          onAgeCalculated(age);
        }
      }
    }, [value, onAgeCalculated]);

    // Handle user typing naturally
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const cursorPos = e.target.selectionStart || raw.length;

      // Allow only digits, dashes, and slashes
      let cleaned = raw.replace(/[^\d\-/]/g, '').slice(0, 10);

      // Smart auto-dash ONLY when typing forward at the end of the text
      const isAppending = cursorPos === raw.length;
      if (isAppending) {
        // When typing e.g. "15" and next is digit "0" -> auto-insert dash "15-0"
        if (/^\d{2}$/.test(cleaned)) {
          cleaned = `${cleaned}-`;
        } else if (/^\d{2}[-/]\d{2}$/.test(cleaned)) {
          cleaned = `${cleaned}-`;
        }
      }

      setDisplayVal(cleaned);

      // Trigger external onChange
      onChange?.({
        target: {
          name,
          value: cleaned,
        },
      });

      // Calculate age if valid date
      if (onAgeCalculated) {
        const age = calculateAge(cleaned);
        if (age > 0 && age < 120) {
          onAgeCalculated(age);
        }
      }
    };

    // On blur: format cleanly to DD-MM-YYYY if user typed 8 raw digits or slashes
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      props.onBlur?.(e);
      if (!displayVal) return;

      const formatted = formatToStandardDob(displayVal);
      if (formatted !== displayVal) {
        setDisplayVal(formatted);
        onChange?.({
          target: {
            name,
            value: formatted,
          },
        });
        if (onAgeCalculated) {
          const age = calculateAge(formatted);
          if (age > 0 && age < 120) {
            onAgeCalculated(age);
          }
        }
      }
    };

    // Calendar picker button click: open native popup cleanly without blue segment UI
    const handleOpenCalendar = () => {
      if (disabled) return;
      if (hiddenDateRef.current) {
        try {
          if (typeof hiddenDateRef.current.showPicker === 'function') {
            hiddenDateRef.current.showPicker();
          } else {
            hiddenDateRef.current.focus();
            hiddenDateRef.current.click();
          }
        } catch {
          hiddenDateRef.current.focus();
          hiddenDateRef.current.click();
        }
      }
    };

    // When date is picked from the calendar popup
    const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isoVal = e.target.value; // YYYY-MM-DD
      if (!isoVal) return;

      const formatted = formatToStandardDob(isoVal);
      setDisplayVal(formatted);

      onChange?.({
        target: {
          name,
          value: formatted,
        },
      });

      if (onAgeCalculated) {
        const age = calculateAge(formatted);
        if (age > 0 && age < 120) {
          onAgeCalculated(age);
        }
      }
    };

    // ISO value for hidden input
    const hiddenIsoVal = formatDobToIso(displayVal) || '';

    return (
      <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider font-body"
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          <input
            ref={ref}
            id={inputId}
            name={name}
            type="text"
            inputMode="numeric"
            placeholder={placeholder}
            maxLength={10}
            value={displayVal}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={disabled}
            className={clsx(
              'w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm',
              'bg-white border text-[#0B1F3A] placeholder:text-gray-400',
              'focus:outline-none focus:ring-1',
              showCalendarPicker && 'pr-10',
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50/20'
                : 'border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]',
              disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
              className
            )}
            {...props}
          />

          {showCalendarPicker && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
              <button
                type="button"
                tabIndex={-1}
                onClick={handleOpenCalendar}
                disabled={disabled}
                title="Select date from calendar"
                className="p-1 rounded-md text-gray-400 hover:text-[#0B1F3A] hover:bg-gray-100 transition-colors focus:outline-none"
              >
                <Calendar size={16} />
              </button>

              {/* Invisible native date picker off-screen for calendar popover */}
              <input
                ref={hiddenDateRef}
                type="date"
                tabIndex={-1}
                aria-hidden="true"
                value={hiddenIsoVal}
                onChange={handleCalendarChange}
                className="sr-only opacity-0 pointer-events-none absolute w-0 h-0"
              />
            </div>
          )}
        </div>

        {error && (
          <p className="flex items-center gap-1 text-xs text-red-500 font-body">
            <AlertCircle size={12} />
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-gray-500 font-body">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

DobInput.displayName = 'DobInput';
