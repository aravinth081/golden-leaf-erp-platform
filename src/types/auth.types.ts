// ──────────────────────────────────────────────────
// Golden Leaf Finance — Auth Types
// Authentication and role-based access types
// ──────────────────────────────────────────────────

export type UserRole =
  | 'admin'
  | 'hr_payroll_manager'
  | 'area_manager'
  | 'branch_manager'
  | 'credit_manager'
  | 'collection_agent'
  | 'recovery_officer'
  | 'auditor'
  | 'accountant';

export interface CustomClaims {
  role: UserRole;
  branchId?: string;
  branchName?: string;
  companyId: string;
}

export interface AuthUser {
  uid: string;
  employeeId?: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
  customClaims: CustomClaims;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PhoneLoginCredentials {
  phoneNumber: string;
  otp: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
};

// ── Role Hierarchy Rank Table (Admin > HR & Payroll Finance Manager > Branch Manager > Staff) ──
export const ROLE_HIERARCHY_RANK: Record<UserRole, number> = {
  admin: 100,
  hr_payroll_manager: 80,
  area_manager: 70,
  branch_manager: 60,
  credit_manager: 50,
  accountant: 45,
  auditor: 40,
  recovery_officer: 20,
  collection_agent: 10,
};

/**
 * Validates whether an actor can manage, edit, or provision a target user role.
 * Rule: Actors can ONLY manage roles strictly lower in hierarchy rank.
 * Rule: Nobody except Admin can manage Admin; non-admins cannot manage peers or superiors.
 */
export function canManageUser(actorRole: UserRole, targetRole: UserRole): boolean {
  if (actorRole === 'admin') {
    return true;
  }
  if (targetRole === 'admin' || targetRole === actorRole) {
    return false;
  }
  return (ROLE_HIERARCHY_RANK[actorRole] ?? 0) > (ROLE_HIERARCHY_RANK[targetRole] ?? 0);
}

/**
 * Determines if a role operates company-wide across ALL branches without branch scoping.
 */
export function isCompanyWideRole(role: UserRole): boolean {
  return role === 'admin' || role === 'hr_payroll_manager' || role === 'auditor';
}

// Permission matrix per role (Centralized RBAC across institutional roles)
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'company:manage',
    'branch:manage', 'branch:view',
    'employee:manage', 'employee:view', 'employee:create', 'employee:edit', 'employee:delete',
    'employee:doc_vault', 'employee:bgv', 'employee:type_tag', 'employee:cost_center',
    'employee.bank_edit', 'employee.bank_approve',
    'customer:manage', 'customer:view',
    'loan:manage', 'loan:view', 'loan:approve',
    'collection:manage', 'collection:view',
    'kyc:manage', 'kyc:verify',
    'report:all', 'report:export',
    'settings:manage',
    'audit:view',
    'dashboard:admin', 'dashboard:hr',
    'attendance:view', 'attendance:manage',
    'notification:manage',
    'daily_closing:manage',
    'print:manage',
    'payroll:ctc_manage', 'payroll:initiate', 'payroll.initiate', 'payroll:approve', 'payroll.approve',
    'payroll:prorata', 'payroll:payslip', 'payroll:bank_export', 'payroll:view', 'payroll:manage',
    'compliance:statutory_manage', 'compliance:calendar', 'compliance:tax_certs',
    'leave:configure', 'leave:approve_all', 'leave:first_approve', 'attendance:lop_linkage', 'leave:encashment', 'settlement:fnf_manage',
    'expense:finance_approve', 'expense:manager_approve', 'expense:gl_categorize', 'expense:tax_flags', 'expense:view',
    'hiring:sandbox', 'esop:view', 'ledger:payroll_view',
  ],
  hr_payroll_manager: [
    // 1. Employee Master & KYC
    'employee:manage', 'employee:view', 'employee:create', 'employee:edit',
    'employee:doc_vault', 'employee:bgv', 'employee:type_tag', 'employee:cost_center',
    'employee.bank_edit', 'employee.bank_approve',
    // 2. Payroll & Compensation (Maker-Checker granular permissions)
    'payroll:ctc_manage', 'payroll:initiate', 'payroll.initiate', 'payroll:approve', 'payroll.approve',
    'payroll:prorata', 'payroll:payslip', 'payroll:bank_export', 'payroll:view',
    // 3. Statutory Compliance
    'compliance:statutory_manage', 'compliance:calendar', 'compliance:tax_certs',
    // 4. Attendance, Leave & Payouts (Company-wide)
    'leave:configure', 'leave:approve_all', 'attendance:lop_linkage', 'leave:encashment', 'settlement:fnf_manage',
    'attendance:view', 'attendance:manage',
    // 5. Expenses & Reimbursements (Final Finance step)
    'expense:finance_approve', 'expense:gl_categorize', 'expense:tax_flags', 'expense:view',
    // 6. Hiring Sandbox & ESOP Tracking
    'hiring:sandbox', 'esop:view',
    // 7. GL Ledger Read Access
    'ledger:payroll_view',
    // Branch Manager baseline operations across all branches
    'branch:view',
    'customer:manage', 'customer:view',
    'loan:view', 'loan:approve',
    'collection:manage', 'collection:view',
    'kyc:view',
    'report:branch', 'report:all', 'report:export',
    'dashboard:branch', 'dashboard:hr',
    'daily_closing:manage', 'daily_closing:view',
    'print:manage',
    // DENIED: settings:manage, admin:manage, roles:configure, gl:manual_edit
  ],
  area_manager: [
    'branch:view', 'branch:manage',
    'employee:view',
    'customer:manage', 'customer:view',
    'loan:view', 'loan:approve',
    'collection:manage', 'collection:view',
    'kyc:view',
    'report:all', 'report:export',
    'dashboard:admin',
    'attendance:view',
    'audit:view',
    'daily_closing:manage',
    'print:manage',
  ],
  branch_manager: [
    'branch:view',
    'employee:view',
    'customer:manage', 'customer:view',
    'loan:view', 'loan:approve',
    'collection:manage', 'collection:view',
    'kyc:view',
    'report:branch', 'report:export',
    'settings:branch',
    'dashboard:branch',
    'attendance:view', 'attendance:manage',
    'daily_closing:manage',
    'print:manage',
    // Branch Manager adjustments: first-level Manager step on leave and expenses
    'leave:first_approve',
    'expense:manager_approve',
    'expense:view',
    // STRICTLY DENIED: payroll:view, payroll:manage, salary:view, bank:view, hiring:sandbox
  ],
  credit_manager: [
    'customer:view',
    'kyc:verify', 'kyc:manage',
    'loan:recommend', 'loan:view', 'loan:approve',
    'collection:view',
    'report:branch',
    'dashboard:branch',
    'approvals:view',
  ],
  collection_agent: [
    'customer:register', 'customer:view',
    'collection:create', 'collection:view',
    'attendance:self',
    'dashboard:agent',
    'report:self',
  ],
  recovery_officer: [
    'customer:view',
    'collection:create', 'collection:view',
    'attendance:self',
    'dashboard:agent',
    'report:self',
    'recovery:manage',
  ],
  auditor: [
    'branch:view',
    'employee:view',
    'customer:view',
    'loan:view',
    'collection:view',
    'kyc:view',
    'report:all', 'report:export',
    'audit:view',
    'monitoring:view',
    'dashboard:admin',
    'attendance:view',
    'daily_closing:view',
  ],
  accountant: [
    'branch:view',
    'customer:view',
    'loan:view',
    'collection:view',
    'daily_closing:manage',
    'print:manage',
    'report:all', 'report:export',
    'dashboard:branch',
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isRolePermitted(userRole: UserRole | undefined, allowedRoles?: UserRole[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Super Admin',
  hr_payroll_manager: 'HR & Payroll Finance Manager',
  area_manager: 'Area Manager',
  branch_manager: 'Branch Manager',
  credit_manager: 'Credit Manager',
  collection_agent: 'Customer Relationship Officer (CRO)',
  recovery_officer: 'Recovery Officer',
  auditor: 'Internal Auditor',
  accountant: 'Finance & Accounts Officer',
};
