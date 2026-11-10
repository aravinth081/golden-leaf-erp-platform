// ──────────────────────────────────────────────────
// Golden Leaf Finance — Card Component
// Premium off-white card with soft shadow
// ──────────────────────────────────────────────────

import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'outlined' | 'gold';
  onClick?: () => void;
}

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantStyles: Record<string, string> = {
  default: 'bg-white border border-surface-muted/50 shadow-card',
  elevated: 'bg-white shadow-card-hover',
  outlined: 'bg-white border-2 border-gold-200',
  gold: 'bg-gradient-card border border-gold-200/50 shadow-card',
};

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  padding = 'md',
  variant = 'default',
  onClick,
}) => {
  return (
    <motion.div
      
      className={clsx(
        'rounded-2xl transition-all duration-250',
        variantStyles[variant],
        paddingStyles[padding],
        hoverable && 'cursor-pointer hover:border-gold-300/50',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};
