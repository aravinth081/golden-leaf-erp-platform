// ──────────────────────────────────────────────────
// Golden Leaf Finance — Leave & On-Duty (OD) Management Service
// Multi-Tier Approval Workflow:
// 1. CRO & Credit Manager -> Approved by Branch Manager
// 2. Branch Manager -> Granted by System Admin
// 3. Admin does not apply for leave
// ──────────────────────────────────────────────────

import type { UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type LeaveCategory = 'LEAVE' | 'OD';

export type LeaveType =
  // Standard Leaves (Total 12 days quota per year)
  | 'Casual Leave (CL)'
  | 'Sick / Medical Leave (SL)'
  | 'Emergency Leave'
  | 'Compensatory Off'
  // On-Duty (OD) Field Operations
  | 'Field Center Meeting & Collection'
  | 'Client Onboarding & KYC Field Audit'
  | 'Recovery Drive / Irregular Accounts'
  | 'Bank Deposit & Cash Transit'
  | 'Regional / Head Office Training'
  | 'Legal / Court Hearing'
  | 'Other Official Duty';

export type LeaveStatus =
  | 'PENDING_BRANCH_MANAGER' // Awaiting Branch Manager confirmation (for CRO & Credit Manager)
  | 'PENDING_ADMIN'          // Awaiting Admin permission (for Branch Manager)
  | 'APPROVED'               // Fully Approved
  | 'REJECTED'               // Rejected
  | 'CANCELLED';             // Cancelled by applicant

export interface LeaveODRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  role: UserRole;
  roleTitle: string;
  branchId: string;
  branchName: string;
  category: LeaveCategory;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  durationDays: number;
  isHalfDay: boolean;
  halfDaySession?: 'Morning' | 'Afternoon';
  reason: string; // Comment registered by applicant explaining why they are taking leave/OD
  destinationLocation?: string; // For OD operations
  emergencyContact?: string;
  status: LeaveStatus;
  appliedAt: string; // ISO
  appliedAtDisplay: string;
  approverRole: 'branch_manager' | 'admin';
  approvedBy?: string;
  approvalRemarks?: string; // Comments from approver explaining decision
  actionedAt?: string;
  actionedAtDisplay?: string;
}

export interface LeaveBalance {
  totalAnnualLeave: { total: number; used: number; remaining: number };
  casualLeave: { total: number; used: number; remaining: number };
  sickLeave: { total: number; used: number; remaining: number };
  onDutyDaysThisMonth: number;
}

const STORAGE_KEY = 'glf_leave_od_records_v12';

const SEED_REQUESTS: LeaveODRequest[] = [];
let isLeaveCloudSynced = false;

export function getStoredLeaveRequests(): LeaveODRequest[] {
  if (!isLeaveCloudSynced && isSupabaseConfigured() && supabase) {
    isLeaveCloudSynced = true;
    void (async () => {
      try {
        const { data: rows, error } = await supabase!
          .from('documents')
          .select('data')
          .eq('collection', 'leave_requests')
          .eq('is_deleted', false);
        if (!error && Array.isArray(rows) && rows.length > 0) {
          const cloudRecords = rows.map((r: any) => r.data).filter(Boolean);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudRecords));
          } catch {}
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('glf_leave_updated', { detail: { records: cloudRecords } }));
          }
        }
      } catch (e) {
        console.warn('[Supabase] Failed to fetch leave requests:', e);
      }
    })();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Failed to parse leave requests:', e);
    return [];
  }
}

export function saveStoredLeaveRequests(records: LeaveODRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('glf_leave_updated', { detail: { records } }));
    }
  } catch (e) {
    console.error('Failed to save leave requests:', e);
  }

  if (isSupabaseConfigured() && supabase && records.length > 0) {
    const upsertRows = records.map((rec) => ({
      collection: 'leave_requests',
      id: rec.id,
      data: rec,
      is_deleted: false,
      created_at: rec.appliedAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    void supabase.from('documents').upsert(upsertRows);
  }
}

export interface CreateLeaveInput {
  employeeId: string;
  employeeName: string;
  role: UserRole;
  roleTitle: string;
  branchId: string;
  branchName: string;
  category: LeaveCategory;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  durationDays: number;
  isHalfDay: boolean;
  halfDaySession?: 'Morning' | 'Afternoon';
  reason: string;
  destinationLocation?: string;
  emergencyContact?: string;
}

export function submitLeaveODRequest(input: CreateLeaveInput): LeaveODRequest {
  const current = getStoredLeaveRequests();
  const now = new Date();
  const appliedAtDisplay = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  // WORKFLOW RULE:
  // Branch Manager -> PENDING_ADMIN (requires Admin permission)
  // CRO or Credit Manager -> PENDING_BRANCH_MANAGER (requires Branch Manager confirmation)
  const isBranchManager = input.role === 'branch_manager';
  const status: LeaveStatus = isBranchManager ? 'PENDING_ADMIN' : 'PENDING_BRANCH_MANAGER';
  const approverRole: 'branch_manager' | 'admin' = isBranchManager ? 'admin' : 'branch_manager';

  const newRecord: LeaveODRequest = {
    id: `LOD-${now.getFullYear()}-${String(current.length + 1).padStart(3, '0')}`,
    ...input,
    status,
    approverRole,
    appliedAt: now.toISOString(),
    appliedAtDisplay,
  };

  const updated = [newRecord, ...current];
  saveStoredLeaveRequests(updated);
  return newRecord;
}

export function approveLeaveODRequest(
  requestId: string,
  approverName: string,
  approverRole: string,
  approvalRemarks?: string
): LeaveODRequest | null {
  const current = getStoredLeaveRequests();
  const idx = current.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;

  const now = new Date();
  const actionedAtDisplay = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const updatedRecord: LeaveODRequest = {
    ...current[idx],
    status: 'APPROVED',
    approvedBy: `${approverName} (${approverRole})`,
    approvalRemarks: approvalRemarks || 'Approved and granted authorization.',
    actionedAt: now.toISOString(),
    actionedAtDisplay,
  };

  current[idx] = updatedRecord;
  saveStoredLeaveRequests(current);
  return updatedRecord;
}

export function rejectLeaveODRequest(
  requestId: string,
  approverName: string,
  approverRole: string,
  approvalRemarks: string
): LeaveODRequest | null {
  const current = getStoredLeaveRequests();
  const idx = current.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;

  const now = new Date();
  const actionedAtDisplay = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const updatedRecord: LeaveODRequest = {
    ...current[idx],
    status: 'REJECTED',
    approvedBy: `${approverName} (${approverRole})`,
    approvalRemarks: approvalRemarks || 'Application could not be approved at this time.',
    actionedAt: now.toISOString(),
    actionedAtDisplay,
  };

  current[idx] = updatedRecord;
  saveStoredLeaveRequests(current);
  return updatedRecord;
}

export function cancelLeaveODRequest(requestId: string): boolean {
  const current = getStoredLeaveRequests();
  const idx = current.findIndex((r) => r.id === requestId);
  if (idx === -1) return false;

  current[idx].status = 'CANCELLED';
  saveStoredLeaveRequests(current);
  return true;
}

export function getLeaveBalance(employeeId: string): LeaveBalance {
  const all = getStoredLeaveRequests();
  const approved = all.filter((r) => r.employeeId === employeeId && r.status === 'APPROVED');

  let clUsed = 0;
  let slUsed = 0;
  let otherUsed = 0;
  let odCount = 0;

  approved.forEach((r) => {
    if (r.category === 'OD') {
      odCount += r.durationDays;
    } else {
      if (r.leaveType.includes('Casual')) clUsed += r.durationDays;
      else if (r.leaveType.includes('Sick') || r.leaveType.includes('Medical')) slUsed += r.durationDays;
      else otherUsed += r.durationDays;
    }
  });

  // Policy: Total leave for a year is strictly 12 days (6 Casual Leave + 6 Sick Leave)
  const totalAnnualQuota = 12;
  const clTotal = 6;
  const slTotal = 6;
  const totalUsed = clUsed + slUsed + otherUsed;

  return {
    totalAnnualLeave: {
      total: totalAnnualQuota,
      used: totalUsed,
      remaining: Math.max(0, totalAnnualQuota - totalUsed),
    },
    casualLeave: {
      total: clTotal,
      used: clUsed,
      remaining: Math.max(0, clTotal - clUsed),
    },
    sickLeave: {
      total: slTotal,
      used: slUsed,
      remaining: Math.max(0, slTotal - slUsed),
    },
    onDutyDaysThisMonth: odCount,
  };
}
