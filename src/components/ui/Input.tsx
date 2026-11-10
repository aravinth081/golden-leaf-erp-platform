// ──────────────────────────────────────────────────
// Golden Leaf Finance — Input Component
// Gold-accented form input with label & validation
// ──────────────────────────────────────────────────

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, containerClassName, className, id, ...props }, ref) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-rich-charcoal font-body"
          >
            {label}
            {props.required && <span className="text-status-error ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rich-silver">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full px-4 py-2.5 min-h-[44px] rounded-xl',
              'bg-white border text-rich-black placeholder:text-rich-silver',
              'transition-all duration-250',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'hover:border-gold-400',
              'font-body text-sm',
              error
                ? 'border-status-error focus:border-status-error focus:ring-status-error/20'
                : 'border-rich-light/50 focus:border-gold-500 focus:ring-gold-500/20',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              props.disabled && 'bg-surface-cream cursor-not-allowed opacity-60',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-rich-silver">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="flex items-center gap-1 text-xs text-status-error font-body">
            <AlertCircle size={12} />
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-rich-silver font-body">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
