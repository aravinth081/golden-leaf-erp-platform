// ──────────────────────────────────────────────────
// Golden Leaf Finance — Button Component
// Premium gold-themed button with variants & states
// ──────────────────────────────────────────────────

import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-gold hover:shadow-gold-lg hover:brightness-110 active:scale-[0.98]',
  secondary:
    'bg-rich-black text-white hover:bg-rich-charcoal active:scale-[0.98]',
  outline:
    'bg-transparent text-gold-600 border-2 border-gold-500 hover:bg-gold-500 hover:text-white hover:shadow-gold active:scale-[0.98]',
  ghost:
    'bg-transparent text-rich-gray hover:bg-surface-cream hover:text-rich-black active:scale-[0.98]',
  danger:
    'bg-status-error text-white hover:bg-red-700 shadow-sm hover:shadow-md active:scale-[0.98]',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-2 min-h-[36px] text-xs rounded-lg gap-1.5 cursor-pointer',
  md: 'px-5 py-2.5 min-h-[44px] text-sm rounded-xl gap-2 cursor-pointer',
  lg: 'px-7 py-3.5 min-h-[48px] text-base rounded-xl gap-2.5 cursor-pointer',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      className={clsx(
        'inline-flex items-center justify-center font-semibold font-body',
        'transition-all duration-250 ease-out',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={isDisabled}
      {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
    >
      {loading && (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </motion.button>
  );
};
