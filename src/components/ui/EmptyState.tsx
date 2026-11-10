// ──────────────────────────────────────────────────
// Golden Leaf Finance — Empty State Component
// ──────────────────────────────────────────────────

import React from 'react';
import { clsx } from 'clsx';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-16 px-6', className)}>
      {/* Gold line-art illustration */}
      <div className="w-20 h-20 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center mb-4">
        {icon || <Inbox size={32} className="text-gold-400" />}
      </div>
      <h3 className="text-lg font-display font-semibold text-rich-black">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-rich-silver font-body text-center max-w-md">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          variant="primary"
          size="md"
          className="mt-5"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
