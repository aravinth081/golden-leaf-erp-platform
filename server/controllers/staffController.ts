// ──────────────────────────────────────────────────
// Golden Leaf Finance — Staff Profile Controller
// Admin Endpoints for Staff Provisioning & Management
// ──────────────────────────────────────────────────

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { toStaffUserDTO, StaffUserRecord, StaffRoleEnum, StaffStatusEnum } from '../models/staffModel';
import crypto from 'crypto';

// In-Memory simulated DB store (synchronizes with SQL DB in production)
const staffDatabase: StaffUserRecord[] = [];
const auditDatabase: Array<{
  id: string;
  timestamp: string;
  actorId: string;
  action: string;
  targetId: string;
  payload: any;
}> = [];

// Helper: Secure password hashing
function hashPassword(password: string): string {
  const salt = 'GLF_SECURE_SALT_V1_';
  return crypto.createHash('sha256').update(salt + password).digest('hex');
}

function validateComplexity(password: string): boolean {
  if (!password || password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) return false;
  return true;
}

/**
 * POST /api/admin/staff
 * Create Staff Profile (Admin Only)
 */
export async function createStaff(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      fullName,
      employeeId,
      email,
      mobile,
      role,
      branchId,
      username,
      password,
      status,
      mustChangePassword,
    } = req.body;

    // 1. Role validation (Admin cannot be created here)
    const allowedRoles: StaffRoleEnum[] = ['HR', 'BRANCH_MANAGER', 'CREDIT_MANAGER', 'CRO'];
    if (!allowedRoles.includes(role)) {
      res.status(400).json({
        success: false,
        error: '400 Bad Request: Invalid staff role. Admin role cannot be created from this endpoint.',
      });
      return;
    }

    // 2. Required fields
    if (!fullName || !employeeId || !email || !mobile || !username || !password) {
      res.status(400).json({
        success: false,
        error: '400 Bad Request: All required fields must be supplied.',
      });
      return;
    }

    // 3. Branch required for BM, CM, CRO
    if (role !== 'HR' && !branchId) {
      res.status(400).json({
        success: false,
        error: `400 Bad Request: Branch is required for role ${role}.`,
      });
      return;
    }

    // 4. Password Complexity
    if (!validateComplexity(password)) {
      res.status(400).json({
        success: false,
        error: '400 Bad Request: Password must be min 8 chars with uppercase, lowercase, number and special char.',
      });
      return;
    }

    // 5. Uniqueness
    const cleanUser = username.trim().toLowerCase();
    const cleanEmpId = employeeId.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = staffDatabase.find(
      (s) => s.deleted_at === null && s.username.toLowerCase() === cleanUser
    );
    if (existingUser) {
      res.status(409).json({ success: false, error: `Username @${username} is already taken.` });
      return;
    }

    const existingEmp = staffDatabase.find(
      (s) => s.deleted_at === null && s.employee_id.toUpperCase() === cleanEmpId
    );
    if (existingEmp) {
      res.status(409).json({ success: false, error: `Employee ID "${employeeId}" is already registered.` });
      return;
    }

    const existingEmail = staffDatabase.find(
      (s) => s.deleted_at === null && s.email.toLowerCase() === cleanEmail
    );
    if (existingEmail) {
      res.status(409).json({ success: false, error: `Email "${email}" is already registered.` });
      return;
    }

    const newRecord: StaffUserRecord = {
      id: `STF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      full_name: fullName.trim(),
      employee_id: cleanEmpId,
      email: cleanEmail,
      mobile: mobile.replace(/\D/g, ''),
      role,
      branch_id: branchId || null,
      username: cleanUser,
      password_hash: hashPassword(password),
      status: (status as StaffStatusEnum) || 'active',
      must_change_password: mustChangePassword ?? true,
      created_by: req.user?.uid || 'admin',
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    };

    staffDatabase.unshift(newRecord);

    // Audit log
    auditDatabase.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: req.user?.uid || 'admin',
      action: 'CREATE_STAFF',
      targetId: newRecord.id,
      payload: { username: newRecord.username, role: newRecord.role },
    });

    res.status(201).json({
      success: true,
      message: 'Staff profile created successfully.',
      data: {
        profile: toStaffUserDTO(newRecord),
        // One-time plain password for Admin to share
        plainPassword: password,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}

/**
 * GET /api/admin/staff
 * List staff profiles with search, filter, and pagination
 */
export async function getStaffList(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { search, role, status, page = '1', pageSize = '10' } = req.query;

    let filtered = staffDatabase.filter((s) => s.deleted_at === null);

    if (search && typeof search === 'string') {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          s.username.toLowerCase().includes(q) ||
          s.employee_id.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    if (role && typeof role === 'string' && role !== 'all') {
      filtered = filtered.filter((s) => s.role === role);
    }

    if (status && typeof status === 'string' && status !== 'all') {
      filtered = filtered.filter((s) => s.status === status);
    }

    const total = filtered.length;
    const p = Math.max(1, parseInt(page as string, 10) || 1);
    const limit = Math.max(1, parseInt(pageSize as string, 10) || 10);
    const totalPages = Math.ceil(total / limit) || 1;

    const startIndex = (p - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit).map(toStaffUserDTO);

    res.json({
      success: true,
      data: {
        profiles: paginated,
        total,
        page: p,
        pageSize: limit,
        totalPages,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}

/**
 * GET /api/admin/staff/:id
 * Get single profile
 */
export async function getStaffById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const staff = staffDatabase.find((s) => s.id === id && s.deleted_at === null);
  if (!staff) {
    res.status(404).json({ success: false, error: 'Staff profile not found.' });
    return;
  }
  res.json({ success: true, data: toStaffUserDTO(staff) });
}

/**
 * PUT /api/admin/staff/:id
 * Update staff details
 */
export async function updateStaff(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { fullName, email, mobile, role, branchId } = req.body;

  const staff = staffDatabase.find((s) => s.id === id && s.deleted_at === null);
  if (!staff) {
    res.status(404).json({ success: false, error: 'Staff profile not found.' });
    return;
  }

  if (email) staff.email = email.trim().toLowerCase();
  if (fullName) staff.full_name = fullName.trim();
  if (mobile) staff.mobile = mobile.replace(/\D/g, '');
  if (role) staff.role = role;
  if (branchId !== undefined) staff.branch_id = branchId;
  staff.updated_at = new Date();

  res.json({ success: true, message: 'Profile updated successfully.', data: toStaffUserDTO(staff) });
}

/**
 * PATCH /api/admin/staff/:id/status
 * Activate / Deactivate account
 */
export async function updateStaffStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'active' && status !== 'inactive') {
    res.status(400).json({ success: false, error: 'Status must be active or inactive.' });
    return;
  }

  const staff = staffDatabase.find((s) => s.id === id && s.deleted_at === null);
  if (!staff) {
    res.status(404).json({ success: false, error: 'Staff profile not found.' });
    return;
  }

  staff.status = status;
  staff.updated_at = new Date();

  res.json({
    success: true,
    message: `Account has been ${status === 'active' ? 'activated' : 'deactivated'}.`,
    data: toStaffUserDTO(staff),
  });
}

/**
 * PATCH /api/admin/staff/:id/reset-password
 * Reset password (Admin Only)
 */
export async function resetPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!validateComplexity(newPassword)) {
    res.status(400).json({
      success: false,
      error: 'Password must be min 8 chars with uppercase, lowercase, number and special char.',
    });
    return;
  }

  const staff = staffDatabase.find((s) => s.id === id && s.deleted_at === null);
  if (!staff) {
    res.status(404).json({ success: false, error: 'Staff profile not found.' });
    return;
  }

  staff.password_hash = hashPassword(newPassword);
  staff.must_change_password = true;
  staff.updated_at = new Date();

  res.json({
    success: true,
    message: 'Password reset successfully.',
    data: {
      profile: toStaffUserDTO(staff),
      plainPassword: newPassword,
    },
  });
}

/**
 * DELETE /api/admin/staff/:id
 * Soft delete profile
 */
export async function deleteStaff(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const staff = staffDatabase.find((s) => s.id === id && s.deleted_at === null);
  if (!staff) {
    res.status(404).json({ success: false, error: 'Staff profile not found.' });
    return;
  }

  staff.deleted_at = new Date();
  staff.updated_at = new Date();

  res.json({ success: true, message: 'Staff profile soft deleted.' });
}

