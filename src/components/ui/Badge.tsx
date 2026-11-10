// ──────────────────────────────────────────────────
// Golden Leaf Finance — Badge Component
// Status pills with semantic colors
// ──────────────────────────────────────────────────

import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'success' | 'error' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<string, string> = {
  gold: 'bg-gold-100 text-gold-700 border-gold-200',
  success: 'bg-status-success-light text-status-success border-green-200',
  error: 'bg-status-error-light text-status-error border-red-200',
  warning: 'bg-status-warning-light text-status-warning border-orange-200',
  info: 'bg-status-info-light text-status-info border-blue-200',
  neutral: 'bg-gray-100 text-rich-gray border-gray-200',
};

const dotColors: Record<string, string> = {
  gold: 'bg-gold-500',
  success: 'bg-status-success',
  error: 'bg-status-error',
  warning: 'bg-status-warning',
  info: 'bg-status-info',
  neutral: 'bg-rich-silver',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gold',
  size = 'sm',
  dot = false,
  className,
}) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full border',
        size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-3 py-1 text-sm gap-1.5',
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  );
};

// Predefined status badges for common loan/KYC/collection statuses
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    // Loan statuses
    pending_approval: { variant: 'warning', label: 'Pending Approval' },
    active: { variant: 'success', label: 'Active' },
    overdue: { variant: 'error', label: 'Overdue' },
    closed: { variant: 'neutral', label: 'Closed' },
    defaulted: { variant: 'error', label: 'Defaulted' },
    rejected: { variant: 'error', label: 'Rejected' },

    // KYC statuses
    pending: { variant: 'warning', label: 'Pending' },
    verified: { variant: 'success', label: 'Verified' },

    // Collection statuses
    scheduled: { variant: 'info', label: 'Scheduled' },
    collected: { variant: 'success', label: 'Collected' },
    partial: { variant: 'warning', label: 'Partial' },
    advance: { variant: 'gold', label: 'Advance' },
    nc: { variant: 'error', label: 'NC' },

    // Employee/Branch statuses
    inactive: { variant: 'neutral', label: 'Inactive' },
    suspended: { variant: 'error', label: 'Suspended' },
    disabled: { variant: 'neutral', label: 'Disabled' },

    // Approval statuses
    draft: { variant: 'neutral', label: 'Draft' },
    pending_recommendation: { variant: 'warning', label: 'Pending Review' },
    recommended: { variant: 'info', label: 'Recommended' },
    recommendation_rejected: { variant: 'error', label: 'Review Rejected' },
    pending_final_approval: { variant: 'warning', label: 'Final Approval' },
    approved: { variant: 'success', label: 'Approved' },
    final_rejected: { variant: 'error', label: 'Rejected' },
    disbursed: { variant: 'success', label: 'Disbursed' },

    // Customer statuses
    pending_registration: { variant: 'warning', label: 'Registration Pending' },
    pending_kyc_verification: { variant: 'warning', label: 'KYC Pending' },
    kyc_verified: { variant: 'success', label: 'KYC Verified' },
    kyc_rejected: { variant: 'error', label: 'KYC Rejected' },
    blacklisted: { variant: 'error', label: 'Blacklisted' },
  };

  const { variant, label } = config[status] || { variant: 'neutral' as const, label: status };

  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  );
};
