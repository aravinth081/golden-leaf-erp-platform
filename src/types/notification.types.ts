// ──────────────────────────────────────────────────
// Golden Leaf Finance — Notification Types
// ──────────────────────────────────────────────────

import type { Timestamps } from './common.types';

export interface Notification extends Timestamps {
  id: string;
  userId: string;             // Recipient UID
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, string>;  // Contextual data (loanId, customerId, etc.)
  read: boolean;
  readAt?: Date;
  actionUrl?: string;         // Deep-link within the app
}

export type NotificationType =
  | 'approval_required'
  | 'approval_approved'
  | 'approval_rejected'
  | 'collection_reminder'
  | 'overdue_alert'
  | 'attendance_reminder'
  | 'daily_target'
  | 'system_alert'
  | 'loan_disbursed'
  | 'kyc_status_change';
