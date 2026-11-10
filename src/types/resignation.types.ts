// ──────────────────────────────────────────────────
// Golden Leaf Finance — Employee Resignation & Exit Module Types
// 3-Stage Approval • Mandatory Portfolio Reassignment • Working-Day Counter • Relieving Letters
// ──────────────────────────────────────────────────

import { type UserRole } from './index';

export type ResignationCategory = 'STANDARD_NOTICE' | 'IMMEDIATE_EMERGENCY';

export type ResignationStatus =
  | 'SUBMITTED_STAGE_1_PENDING'       // Initiated by Employee, awaiting BM Portfolio Reassignment & Clearance
  | 'STAGE_1_APPROVED_STAGE_2_PENDING' // BM approved, serving notice / HR attendance gate
  | 'STAGE_2_APPROVED_STAGE_3_PENDING' // HR approved working days / medical waiver, awaiting Admin final approval
  | 'STAGE_3_APPROVED_RELIEVED'        // Admin approved, login deactivated, exit documents unlocked
  | 'WITHDRAWN'                        // Withdrawn by employee before final relieving
  | 'REJECTED';                        // Rejected by authority

export interface ResignationPortfolioItem {
  id: string;
  type: 'GROUP_LOAN' | 'BUSINESS_LOAN' | 'PENDING_VERIFICATION' | 'VAULT_CUSTODY';
  customerName: string;
  customerMobile: string;
  loanId?: string;
  centerGroup?: string;
  balanceAmount?: number;
}

export interface Stage1BranchManagerApproval {
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
  portfolioReassigned: boolean;
  replacementEmployeeId?: string;
  replacementEmployeeName?: string;
  transferredItemsCount: number;
  reassignedRouteDetails?: string;
  fieldCashZeroDuesConfirmed: boolean;
  receiptBooksSurrendered: boolean;
  vaultKeysAppraisalFilesHandedOver: boolean;
}

export interface Stage2HRApproval {
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
  workingDaysServedVerified: boolean;
  medicalEmergencyWaiverApproved: boolean;
  companyIdCardAssetsReturned: boolean;
  leaveOdFnfSettlementCalculated: boolean;
}

export interface Stage3AdminApproval {
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
  loginDeactivated: boolean;
  relievedAt?: string;
  officialRelievingLetterRefNo?: string;
}

export interface ResignationRecord {
  id: string; // e.g. GLF/EXIT/2026/001
  employeeId: string; // e.g. GLF-EMP-004
  employeeName: string;
  designation: 'Customer Relationship Officer (CRO)' | 'Credit Manager' | 'HR Official' | 'Branch Manager';
  role: UserRole;
  branchId: string;
  branchName: string;
  dateOfJoining: string; // YYYY-MM-DD
  initiationDate: string; // YYYY-MM-DD
  resignationDate: string; // YYYY-MM-DD
  category: ResignationCategory;
  roleNoticeRequirementDays: 30 | 60 | 90; // CRO: 30, CM/HR: 60, BM: 90
  actualWorkingDaysServed: number;
  finalLastWorkingDay: string; // YYYY-MM-DD
  reason: string;

  // Emergency / Medical Proof
  emergencyMedicalRefNo?: string; // e.g. MED-REF-4091
  emergencyHospitalDetails?: string;
  emergencyProofDocUrl?: string;

  // Status & 3-Stage Approvals
  status: ResignationStatus;
  stage1: Stage1BranchManagerApproval;
  stage2: Stage2HRApproval;
  stage3: Stage3AdminApproval;

  // Portfolio items assigned to this employee
  activePortfolioItems: ResignationPortfolioItem[];

  createdAt: string;
  updatedAt: string;
  withdrawnAt?: string;
  withdrawalReason?: string;
}
