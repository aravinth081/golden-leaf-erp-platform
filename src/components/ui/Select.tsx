// ──────────────────────────────────────────────────
// Golden Leaf Finance — Select Dropdown Component
// ──────────────────────────────────────────────────

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { AlertCircle, ChevronDown } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
  selectSize?: 'sm' | 'md' | 'lg';
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, containerClassName, selectSize = 'md', className, id, ...props }, ref) => {
    const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs min-h-[38px]',
      md: 'px-4 py-2.5 text-sm min-h-[44px]',
      lg: 'px-4 py-3 text-base min-h-[48px]',
    };

    return (
      <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-rich-charcoal font-body">
            {label}
            {props.required && <span className="text-status-error ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              'w-full rounded-xl appearance-none',
              'bg-white border text-rich-black',
              'transition-all duration-250',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'hover:border-gold-400',
              'font-body pr-10',
              error
                ? 'border-status-error focus:border-status-error focus:ring-status-error/20'
                : 'border-rich-light/50 focus:border-gold-500 focus:ring-gold-500/20',
              props.disabled && 'bg-surface-cream cursor-not-allowed opacity-60',
              sizeStyles[selectSize],
              className
            )}
            aria-invalid={!!error}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-rich-silver pointer-events-none"
          />
        </div>
        {error && (
          <p className="flex items-center gap-1 text-xs text-status-error font-body">
            <AlertCircle size={12} />
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-rich-silver font-body">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
