// ──────────────────────────────────────────────────
// Golden Leaf Finance — Loan Types
// ──────────────────────────────────────────────────

import type { SoftDelete, Timestamps } from './common.types';

export interface Loan extends Timestamps, SoftDelete {
  id: string;
  companyId: string;
  branchId: string;
  customerId: string;
  customerName: string;       // Denormalized for quick display
  planId: string;
  agentId: string;            // Assigned Customer Relationship Officer (CRO)

  // Financials
  principal: number;
  interestRate: number;
  interestType: InterestType;
  tenure: number;             // in weeks
  weeklyInstallment: number;  // Auto-calculated
  totalPayable: number;       // Principal + total interest
  totalInterest: number;
  totalCollected: number;
  outstanding: number;        // Server-computed, never trust client

  // Schedule
  disbursementDate?: Date;
  firstInstallmentDate?: Date;
  lastInstallmentDate?: Date;
  schedule: RepaymentScheduleItem[];

  // Status
  status: LoanStatus;
  approvalStatus: LoanApprovalStatus;

  // Approval workflow
  recommendedBy?: string;     // Credit Manager UID
  recommendedAt?: Date;
  recommendationRemarks?: string;
  approvedBy?: string;        // Branch Manager UID
  approvedAt?: Date;
  approvalRemarks?: string;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;

  // Closure
  closureDate?: Date;
  closureType?: 'natural' | 'foreclosure';
  foreclosureAmount?: number;
  closureCertificateUrl?: string;

  // Overdue tracking
  overdueWeeks: number;
  lastCollectionDate?: Date;
  npaCategory?: NPACategory;
}

export type InterestType = 'flat' | 'reducing';

export type LoanStatus =
  | 'pending_approval'
  | 'active'
  | 'overdue'
  | 'closed'
  | 'defaulted'
  | 'rejected';

export type LoanApprovalStatus =
  | 'draft'
  | 'pending_recommendation'   // Waiting for Credit Manager
  | 'recommended'              // Credit Manager approved, waiting for Branch Manager
  | 'recommendation_rejected'  // Credit Manager rejected
  | 'pending_final_approval'   // Waiting for Branch Manager
  | 'approved'                 // Branch Manager approved
  | 'final_rejected'           // Branch Manager rejected
  | 'disbursed';               // Funds disbursed, loan active

export type NPACategory = 'standard' | 'substandard' | 'doubtful' | 'loss';

export interface RepaymentScheduleItem {
  weekNumber: number;
  dueDate: string;           // YYYY-MM-DD
  installmentAmount: number;
  principalComponent: number;
  interestComponent: number;
  status: InstallmentStatus;
  paidAmount: number;
  paidDate?: string;
  collectionId?: string;
  balanceAfterPayment: number;
}

export type InstallmentStatus = 'upcoming' | 'due' | 'paid' | 'partial' | 'overdue' | 'advance';

export interface LoanPlan extends Timestamps {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  minPrincipal: number;
  maxPrincipal: number;
  interestRate: number;
  interestType: InterestType;
  tenureWeeks: number;
  processingFee?: number;
  processingFeeType?: 'fixed' | 'percentage';
  isActive: boolean;
}

export interface LoanFormData {
  customerId: string;
  planId: string;
  principal: number;
  agentId: string;
  remarks?: string;
}

export interface LoanCalculation {
  principal: number;
  interestRate: number;
  interestType: InterestType;
  tenureWeeks: number;
  weeklyInstallment: number;
  totalInterest: number;
  totalPayable: number;
}

// Utility: Calculate loan details
export function calculateLoan(
  principal: number,
  interestRate: number,
  interestType: InterestType,
  tenureWeeks: number
): LoanCalculation {
  let totalInterest: number;

  if (interestType === 'flat') {
    // Flat interest: simple calculation on full principal
    totalInterest = (principal * interestRate * tenureWeeks) / (52 * 100);
  } else {
    // Reducing balance: approximate using standard reducing formula
    const weeklyRate = interestRate / (52 * 100);
    const factor = Math.pow(1 + weeklyRate, tenureWeeks);
    const weeklyPayment = principal * (weeklyRate * factor) / (factor - 1);
    totalInterest = (weeklyPayment * tenureWeeks) - principal;
  }

  const totalPayable = principal + totalInterest;
  const weeklyInstallment = Math.ceil(totalPayable / tenureWeeks);

  return {
    principal,
    interestRate,
    interestType,
    tenureWeeks,
    weeklyInstallment,
    totalInterest: Math.round(totalInterest),
    totalPayable: Math.round(totalPayable),
  };
}
