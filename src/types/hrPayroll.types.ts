// ──────────────────────────────────────────────────
// Golden Leaf Finance — HR & Payroll Finance Types
// Enterprise HR Master, CTC Builder, Statutory Compliance,
// Maker-Checker, F&F Settlement, and Audit Trail Definitions
// ──────────────────────────────────────────────────

export type EmploymentType = 'full_time' | 'consultant' | 'intern';
export type BgvStatus = 'pending' | 'in_progress' | 'verified' | 'failed';
export type CostCenter = 'Tech' | 'Operations' | 'Compliance' | 'Sales' | 'HR' | 'Finance' | 'Management' | 'Credit' | 'Collections';

export interface DocumentVault {
  employeeId?: string;
  panNumber: string;
  panUrl?: string;
  panVerified: boolean;
  aadhaarNumber: string;
  aadhaarUrl?: string;
  aadhaarVerified: boolean;
  offerLetterUrl?: string;
  issuedDate?: string;
  bgvStatus: BgvStatus;
  employmentType: EmploymentType;
  costCenter: CostCenter;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
    status: 'pending_checker' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: string;
  };
}

export interface BankDetailChangeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  requestedBy: string; // Maker
  requestedAt: string;
  currentBank: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  };
  proposedBank: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string; // Checker (cannot be requestedBy)
  approvedAt?: string;
  rejectionReason?: string;
}

export interface SalaryRevision {
  id: string;
  employeeId: string;
  designation: string;
  ctcAnnual: number;
  baseMonthly: number;
  hraMonthly: number;
  specialAllowance: number;
  variablePayMonthly?: number; // Variable incentive / commission
  costCenter?: CostCenter;
  employmentType?: EmploymentType;
  pfEmployerMonthly: number;
  pfEmployeeMonthly: number;
  esiEmployerMonthly: number;
  esiEmployeeMonthly: number;
  ptMonthly: number;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo: string | null; // null represents active revision
  createdBy: string;
  createdAt: string;
  revisionReason: string;
}

export interface PayrollRun {
  id: string;
  period: string; // YYYY-MM
  totalEmployees: number;
  grossPayout: number;
  totalDeductions: number;
  netPayout: number;
  fixedBurn?: number; // Fixed base burn
  variableIncentiveTotal?: number; // Variable incentive payouts
  status: 'draft' | 'under_review' | 'approved' | 'posted' | 'locked';
  initiatedBy: string; // Maker
  initiatedAt: string;
  approvedBy?: string; // Checker (Must not be initiatedBy)
  approvedAt?: string;
  lockedBy?: string;
  lockedAt?: string;
  payoutMode: 'NEFT' | 'ACH' | 'IMPS';
}

export interface PayrollSlip {
  id: string;
  runId: string;
  employeeId: string;
  employeeName: string;
  branchId: string;
  designation: string;
  costCenter?: CostCenter;
  employmentType?: EmploymentType;
  period: string; // YYYY-MM
  totalMonthDays: number;
  workingDays: number;
  presentDays: number;
  lopDays: number;
  baseMonthly: number;
  hraMonthly: number;
  specialAllowance: number;
  variableIncentive?: number;
  proRataGross: number;
  arrears: number;
  pfDeduction: number;
  esiDeduction: number;
  tdsDeduction: number;
  ptDeduction: number;
  recoveries: number;
  netSalary: number;
  bankAccountNumber: string;
  bankIfsc: string;
  bankName: string;
  paymentStatus: 'pending' | 'credited' | 'failed';
}

export interface StatutoryFiling {
  id: string;
  type: 'TDS' | 'PF' | 'ESI' | 'PROFESSIONAL_TAX' | '194J' | '194C';
  period: string;
  dueDate: string;
  totalAmount: number;
  status: 'upcoming' | 'filed' | 'overdue';
  challanNumber?: string;
  filedBy?: string;
  filedAt?: string;
}

export interface ExpenseClaim {
  id: string;
  employeeId: string;
  employeeName: string;
  branchId: string;
  category: 'travel' | 'lodging' | 'meals' | 'client_visit' | 'client_entertainment' | 'office_supplies' | 'software_tools';
  amount: number;
  date: string;
  description: string;
  glCode: string;
  hasGstItc: boolean;
  gstin?: string;
  itcAmount?: number;
  status: 'submitted' | 'manager_approved' | 'finance_approved' | 'rejected';
  managerApprovedBy?: string; // Step 1 (Branch Manager)
  managerApprovedAt?: string;
  financeApprovedBy?: string; // Step 2 (HR & Payroll Finance Manager)
  financeApprovedAt?: string;
  rejectionReason?: string;
}

export interface FnFSettlement {
  id: string;
  employeeId: string;
  employeeName: string;
  resignationDate: string;
  lastWorkingDay: string;
  offboardingChecklist: {
    laptopRevoked: boolean;
    dbCredentialsRevoked: boolean;
    financialAccessRevoked: boolean;
    revokedByAdminId?: string;
    revokedAt?: string;
  };
  gratuityAmount: number;
  leaveEncashmentAmount: number;
  noticePeriodRecovery: number;
  unpaidSalary: number;
  netSettlementAmount: number;
  settlementStatus: 'pending_checklist' | 'ready_for_payout' | 'completed';
  settledBy?: string;
  settledAt?: string;
}

export interface HiringProjection {
  id: string;
  roleName: string;
  department: string;
  headcountTarget: number;
  targetHiringMonth: string;
  budgetedMonthlyCtc: number;
  projectedAnnualBurn: number;
}

export interface EsopGrant {
  id: string;
  employeeId: string;
  employeeName: string;
  grantDate: string;
  optionsGranted: number;
  vestingPeriodYears: number;
  strikePrice: number;
  vestedOptions: number;
}

export interface PayrollJournalEntry {
  id: string;
  period: string;
  entryDate: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  narration: string;
  isPosted: boolean;
}

export interface HRAuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601 UTC
  userId: string;
  userRole: string;
  action:
    | 'salary_revision'
    | 'bank_detail_change'
    | 'bank_detail_approval'
    | 'permission_grant'
    | 'role_change'
    | 'payroll_initiate'
    | 'payroll_approval'
    | 'payroll_lock'
    | 'fnf_checklist_revoke'
    | 'fnf_settlement';
  entity: 'salary' | 'bank_detail' | 'permission' | 'role' | 'payroll_run' | 'fnf_settlement';
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string;
}

