// ──────────────────────────────────────────────────
// Golden Leaf Finance — Loading Skeleton Components
// ──────────────────────────────────────────────────

import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  lines,
}) => {
  if (lines) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              'skeleton-shimmer rounded',
              i === lines - 1 ? 'w-2/3' : 'w-full',
              'h-3.5'
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'skeleton-shimmer',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded',
        variant === 'rectangular' && 'rounded-xl',
        className
      )}
      style={{
        width: width || (variant === 'circular' ? 40 : '100%'),
        height: height || (variant === 'text' ? 14 : variant === 'circular' ? 40 : 40),
      }}
    />
  );
};

// Preset skeletons for common use cases
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('bg-white rounded-2xl border border-surface-muted/50 shadow-card p-6', className)}>
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-3">
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="text" width="30%" />
      </div>
      <Skeleton variant="circular" width={40} height={40} />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div className="overflow-hidden rounded-2xl border border-surface-muted bg-white">
    <div className="bg-surface-cream px-4 py-3 flex gap-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" width={`${100 / columns}%`} height={12} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="px-4 py-3.5 border-t border-surface-muted flex gap-4">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} variant="text" width={`${100 / columns}%`} height={14} />
        ))}
      </div>
    ))}
  </div>
);

export const PageSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton variant="text" width={200} height={28} />
      <Skeleton variant="rectangular" width={120} height={36} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
    <TableSkeleton />
  </div>
);
