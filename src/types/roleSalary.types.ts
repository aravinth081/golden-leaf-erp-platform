// ──────────────────────────────────────────────────
// Golden Leaf Finance — Role & Employee Salary Types
// Admin Salary Fixation, Role Packages & Payslip Models
// ──────────────────────────────────────────────────

import type { UserRole } from './auth.types';
import type { CostCenter, EmploymentType, PayrollSlip } from './hrPayroll.types';

export interface RoleSalaryConfig {
  role: UserRole;
  roleTitle: string;
  description: string;
  baseMonthly: number;
  hraMonthly: number;
  specialAllowance: number;
  variablePayMonthly: number;
  pfEmployeeMonthly: number;
  esiEmployeeMonthly: number;
  ptMonthly: number;
  tdsMonthly: number;
  costCenter: CostCenter;
  employmentType: EmploymentType;
  updatedAt: string;
  updatedBy: string;
}

export interface EmployeeSalaryConfig {
  employeeId: string;
  employeeName: string;
  role: UserRole;
  branchId?: string;
  branchName?: string;
  baseMonthly: number;
  hraMonthly: number;
  specialAllowance: number;
  variablePayMonthly: number;
  pfEmployeeMonthly: number;
  esiEmployeeMonthly: number;
  ptMonthly: number;
  tdsMonthly: number;
  costCenter: CostCenter;
  employmentType: EmploymentType;
  effectiveFrom: string;
  effectiveTo: string | null;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface SalaryBreakdown {
  grossMonthly: number;
  totalDeductions: number;
  netSalary: number;
  annualCtc: number;
}

export interface PayslipDownloadData extends PayrollSlip {
  employeePan?: string;
  uanNumber?: string;
  esiNumber?: string;
  dateOfJoining?: string;
  branchName?: string;
}

