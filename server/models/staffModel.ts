// ──────────────────────────────────────────────────
// Golden Leaf Finance — Staff Model & SQL Repository
// Database schema mapping & query abstraction
// ──────────────────────────────────────────────────

export type StaffRoleEnum = 'ADMIN' | 'HR' | 'BRANCH_MANAGER' | 'CREDIT_MANAGER' | 'CRO';
export type StaffStatusEnum = 'active' | 'inactive';

export interface StaffUserRecord {
  id: string;
  full_name: string;
  employee_id: string;
  email: string;
  mobile: string;
  role: StaffRoleEnum;
  branch_id: string | null;
  username: string;
  password_hash: string;
  status: StaffStatusEnum;
  must_change_password: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface StaffUserDTO {
  id: string;
  fullName: string;
  employeeId: string;
  email: string;
  mobile: string;
  role: StaffRoleEnum;
  branchId: string | null;
  username: string;
  status: StaffStatusEnum;
  mustChangePassword: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transforms database snake_case row to camelCase DTO,
 * strictly stripping out password_hash.
 */
export function toStaffUserDTO(row: StaffUserRecord): StaffUserDTO {
  return {
    id: row.id,
    fullName: row.full_name,
    employeeId: row.employee_id,
    email: row.email,
    mobile: row.mobile,
    role: row.role,
    branchId: row.branch_id,
    username: row.username,
    status: row.status,
    mustChangePassword: row.must_change_password,
    createdBy: row.created_by,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

