// ──────────────────────────────────────────────────
// Golden Leaf Finance — StatCard Component
// Dashboard KPI card with icon, value, and trend
// ──────────────────────────────────────────────────

import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  variant?: 'default' | 'gold' | 'success' | 'warning' | 'error';
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

const iconBgStyles: Record<string, string> = {
  default: 'bg-surface-cream text-rich-gray',
  gold: 'bg-gold-100 text-gold-600',
  success: 'bg-status-success-light text-status-success',
  warning: 'bg-status-warning-light text-status-warning',
  error: 'bg-status-error-light text-status-error',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  loading = false,
  className,
  onClick,
}) => {
  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
        ? TrendingDown
        : Minus
    : null;

  const trendColor = trend
    ? trend.value > 0
      ? 'text-status-success'
      : trend.value < 0
        ? 'text-status-error'
        : 'text-rich-silver'
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      
      className={clsx(
        'bg-white rounded-2xl border border-surface-muted/50 shadow-card p-5',
        'transition-all duration-250',
        onClick && 'cursor-pointer hover:shadow-card-hover hover:border-gold-300/50',
        className
      )}
      onClick={onClick}
    >
      {loading ? (
        <div className="space-y-3">
          <div className="h-4 w-20 skeleton-shimmer rounded" />
          <div className="h-8 w-28 skeleton-shimmer rounded" />
          <div className="h-3 w-16 skeleton-shimmer rounded" />
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-rich-silver uppercase tracking-wide font-body truncate">
              {title}
            </p>
            <p className="mt-1.5 text-2xl font-bold text-rich-black font-display truncate">
              {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              {trend && TrendIcon && (
                <span className={clsx('inline-flex items-center gap-0.5 text-xs font-medium', trendColor)}>
                  <TrendIcon size={12} />
                  {Math.abs(trend.value)}%
                </span>
              )}
              {(subtitle || trend?.label) && (
                <span className="text-xs text-rich-silver truncate">
                  {subtitle || trend?.label}
                </span>
              )}
            </div>
          </div>
          {icon && (
            <div
              className={clsx(
                'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                iconBgStyles[variant]
              )}
            >
              {icon}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
