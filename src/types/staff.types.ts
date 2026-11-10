// ──────────────────────────────────────────────────
// Golden Leaf Finance — Staff Profile Types
// Staff credential administration, role constraints & audit models
// ──────────────────────────────────────────────────

import type { UserRole } from './auth.types';

export type StaffRole = 'HR' | 'BRANCH_MANAGER' | 'CREDIT_MANAGER' | 'CRO';

export type StaffStatus = 'active' | 'inactive';

export interface StaffProfile {
  id: string;
  fullName: string;
  employeeId: string;
  email: string;
  mobile: string;
  role: StaffRole;
  branchId: string | null;
  branchName: string | null;
  username: string;
  passwordHash: string;
  status: StaffStatus;
  mustChangePassword: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface StaffProfileCreateDTO {
  fullName: string;
  employeeId: string;
  email: string;
  mobile: string;
  role: StaffRole;
  branchId?: string | null;
  username: string;
  password: string;
  confirmPassword?: string;
  status: StaffStatus;
  mustChangePassword?: boolean;
}

export interface StaffProfileUpdateDTO {
  fullName?: string;
  email?: string;
  mobile?: string;
  role?: StaffRole;
  branchId?: string | null;
}

export interface StaffFilterParams {
  search?: string;
  role?: 'all' | StaffRole;
  status?: 'all' | StaffStatus;
  page?: number;
  pageSize?: number;
}

export interface StaffPaginatedResponse {
  profiles: StaffProfile[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StaffAuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: string;
  action: 'CREATE' | 'UPDATE' | 'STATUS_CHANGE' | 'RESET_PASSWORD' | 'DELETE';
  targetStaffId: string;
  targetUsername: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string;
}

// Role Metadata and Institutional Mapping
export const STAFF_ROLE_META: Record<
  StaffRole,
  {
    label: string;
    description: string;
    internalRole: UserRole;
    badgeClass: string;
    requiresBranch: boolean;
    landingPath: string;
  }
> = {
  HR: {
    label: 'HR & Payroll Finance Manager',
    description: 'Corporate HR, CTC structures, payroll runs, statutory compliance',
    internalRole: 'hr_payroll_manager',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    requiresBranch: false,
    landingPath: '/hr-payroll',
  },
  BRANCH_MANAGER: {
    label: 'Branch Manager',
    description: 'Branch collections, attendance review & staff operations',
    internalRole: 'branch_manager',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-300',
    requiresBranch: true,
    landingPath: '/dashboard',
  },
  CREDIT_MANAGER: {
    label: 'Credit Manager',
    description: 'Underwriting desk, KYC documents & risk assessment',
    internalRole: 'credit_manager',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-300',
    requiresBranch: true,
    landingPath: '/credit-manager',
  },
  CRO: {
    label: 'Customer Relationship Officer (CRO)',
    description: 'Route collections, center receipts & field reconciliation',
    internalRole: 'collection_agent',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    requiresBranch: true,
    landingPath: '/collections',
  },
};

