// ──────────────────────────────────────────────────
// Golden Leaf Finance — Collection Types
// ──────────────────────────────────────────────────

import type { GeoLocation, SoftDelete, Timestamps } from './common.types';

export interface Collection extends Timestamps, SoftDelete {
  id: string;
  companyId: string;
  branchId: string;
  loanId: string;
  customerId: string;
  customerName: string;       // Denormalized
  agentId: string;
  agentName: string;          // Denormalized

  // Collection details
  date: string;               // YYYY-MM-DD
  weekNumber: number;         // Which week of the loan schedule
  amount: number;
  expectedAmount: number;
  status: CollectionStatus;

  // NC (Non-Collection) details
  ncReasonCode?: NCReasonCode;
  ncRemarks?: string;
  ncPhotoProofUrl?: string;

  // Geolocation (captured at collection time)
  geoLocation?: GeoLocation;

  // Verification
  verifiedBy?: string;
  verifiedAt?: Date;
  isReconciled: boolean;       // Part of daily closing
}

export type CollectionStatus =
  | 'scheduled'    // Auto-planned, not yet collected
  | 'collected'    // Full payment received
  | 'partial'      // Partial payment
  | 'advance'      // Customer paid ahead
  | 'pending'      // Collection pending / not attempted
  | 'nc';          // Non-Collection (with reason)

export type NCReasonCode =
  | 'not_home'
  | 'refused'
  | 'closed_business'
  | 'relocated'
  | 'financial_difficulty'
  | 'dispute'
  | 'natural_disaster'
  | 'other';

export const NC_REASON_LABELS: Record<NCReasonCode, string> = {
  not_home: 'Customer Not at Home',
  refused: 'Customer Refused to Pay',
  closed_business: 'Business Closed',
  relocated: 'Customer Relocated',
  financial_difficulty: 'Financial Difficulty',
  dispute: 'Payment Dispute',
  natural_disaster: 'Natural Disaster / Emergency',
  other: 'Other',
};

export interface CollectionFormData {
  loanId: string;
  customerId: string;
  amount: number;
  status: 'collected' | 'partial' | 'advance' | 'nc';
  ncReasonCode?: NCReasonCode;
  ncRemarks?: string;
  ncPhotoProof?: File;
}

export interface DailyCollectionPlan {
  id: string;
  date: string;              // YYYY-MM-DD
  agentId: string;
  branchId: string;
  items: DailyCollectionItem[];
  totalExpected: number;
  totalCollected: number;
  completionPercentage: number;
  generatedAt: Date;
}

export interface DailyCollectionItem {
  loanId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  weekNumber: number;
  expectedAmount: number;
  collectionId?: string;      // Set once collection is recorded
  status: CollectionStatus;
  routeOrder: number;         // Order in the route
  geoLocation?: GeoLocation;
}

export interface CollectionSummary {
  date: string;
  branchId: string;
  totalScheduled: number;
  totalCollected: number;
  totalAmount: number;
  totalExpected: number;
  collectionRate: number;     // percentage
  ncCount: number;
  partialCount: number;
  advanceCount: number;
}

export interface DailyClosing extends Timestamps {
  id: string;
  branchId: string;
  date: string;
  closedBy: string;          // Branch Manager UID
  totalCollections: number;
  totalAmount: number;
  totalNC: number;
  cashInHand: number;
  discrepancy: number;        // cashInHand vs totalAmount
  remarks?: string;
  isLocked: boolean;          // Once locked, no more edits for the day
}
