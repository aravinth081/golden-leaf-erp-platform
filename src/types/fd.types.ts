// ──────────────────────────────────────────────────
// Golden Leaf Finance — Fixed Deposit (FD) Types
// Comprehensive Functional Specification Types
// ──────────────────────────────────────────────────

export type FDHoldingPattern =
  | 'Single Holder'
  | 'Joint Holder (Either or Survivor)'
  | 'Joint Holder (Anyone or Survivor)';

export type FDSchemeType = 'non-cumulative' | 'cumulative';

export type FDPayoutFrequency = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly' | 'At Maturity';

export type FDPayoutDate = '1st' | '5th' | 'Anniversary';

export type FDFundingMode =
  | 'NEFT'
  | 'RTGS'
  | 'IMPS'
  | 'UPI'
  | 'Cheque'
  | 'Demand Draft'
  | 'Cash';

export type FDMaturityInstruction =
  | 'Auto-Close & Credit to Bank'
  | 'Auto-Renew Principal + Interest'
  | 'Auto-Renew Principal Only';

export type FDStatus =
  | 'Pending Approval'
  | 'Active'
  | 'Maturing Soon'
  | 'Pre-Close Requested'
  | 'Lien Marked'
  | 'Matured & Settled';

export type CertificateTitleOption =
  | 'Fixed Deposit (FD) Bond'
  | 'Member Deposit Receipt'
  | 'Subordinated Debt / Investor Promissory Note';

export interface FDNominee {
  fullName: string;
  relationship: string;
  dob: string;
  guardianName?: string;
}

export interface FDJointApplicant {
  fullName: string;
  pan?: string;
  aadhaar?: string;
  documentUrl?: string;
}

export interface FDLienDetails {
  isLienMarked: boolean;
  loanAmount: number;
  loanInterestRate: number; // FD rate + 2.0%
  lienMarkedDate: string;
  reason?: string;
  loanReferenceNo?: string;
  markedBy?: string;
}

export interface FDPrematureDetails {
  isPreclosed: boolean;
  requestedDate: string;
  effectiveRunDays: number;
  originalRate: number;
  penaltyRatePercent: number; // e.g. 1.0% or 2.0% lower
  recalculatedRate: number;
  recalculatedInterest: number;
  totalMonthlyInterestPaid: number;
  tdsDeducted: number;
  netRefundablePayout: number;
  surrenderedBondProofUrl?: string;
  approvedBy?: string;
  approvalDate?: string;
}

export interface FixedDeposit {
  id: string;
  fdNumber: string; // e.g. GLF/FD/2026/0001
  companyId: string;
  branchId: string;
  branchName: string;
  branchCode?: string;

  // Depositor / Investor
  investorId: string; // e.g. GLF-INV-0001
  investorName: string;
  investorMobile: string;
  investorPan: string;
  holdingPattern: FDHoldingPattern;
  jointApplicant?: FDJointApplicant;

  // Scheme & Terms
  scheme: FDSchemeType;
  payoutFrequency: FDPayoutFrequency;
  payoutDate: FDPayoutDate;
  principal: number;
  tenureYears: number;
  tenureMonths: number;
  tenureDays: number;
  totalDays: number;

  // Rates
  baseRate: number;
  boosterRate: number;
  effectiveRate: number;
  isSeniorCitizen: boolean;
  isStaff: boolean;
  isRenewal: boolean;

  // Dates & Returns
  valueDate: string; // Start Date
  maturityDate: string;
  periodicPayoutAmount: number; // Monthly / Quarterly cash payout
  monthlyPayout?: number;
  totalGrossInterest: number;
  tdsStatus: '15G' | '15H' | 'Standard TDS';
  isTDSExempt?: boolean;
  tdsPercentage?: number;
  estimatedTDS: number;
  netMaturityValue: number;

  // Funding Receipt
  fundingMode: FDFundingMode;
  utrNumber: string;
  paymentDate: string;
  depositSlipUrl?: string;

  // Nominee & Instructions
  nominee: FDNominee;
  maturityInstruction: FDMaturityInstruction;

  // Status & Maker-Checker Audit
  status: FDStatus;
  bondIssued: boolean;
  bondIssuedAt?: any;
  approvedBy?: string;
  approvedAt?: any;
  bookedBy?: string;

  // LAFD & Premature
  lienDetails?: FDLienDetails;
  prematureDetails?: FDPrematureDetails;

  isDeleted?: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface FDRateSlab {
  id: string;
  label: string;
  minDays: number;
  maxDays: number;
  baseRate: number; // % p.a.
  isActive: boolean;
}

export interface FDReferral {
  id: string;
  companyId: string;
  branchId: string;
  branchName?: string;
  customerName: string;
  customerPhone: string;
  employeeCode: string;
  referredByUid: string;
  referredByName: string;
  status: 'Pending' | 'Followed Up' | 'Booked' | 'Closed';
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface InterestLedgerEntry {
  id: string;
  fdId: string;
  fdNumber: string;
  investorId: string;
  payoutDate: string;
  grossInterest: number;
  tdsDeducted: number;
  netInterestPaid: number;
  bankUtr: string;
  status: 'Paid' | 'Pending' | 'Failed';
  payoutBatchId?: string;
}
