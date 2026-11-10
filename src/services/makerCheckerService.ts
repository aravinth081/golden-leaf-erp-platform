// ──────────────────────────────────────────────────
// Golden Leaf Finance — Maker-Checker Service
// Strict Server-Level Segregation of Duties Enforcement
// Blocks self-approval of payroll, CTC, and bank revisions
// ──────────────────────────────────────────────────

import type { UserRole } from '../types/auth.types';
import { hasPermission } from '../types/auth.types';
import type { BankDetailChangeRequest } from '../types/hrPayroll.types';

export class MakerCheckerViolationError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = 'MakerCheckerViolationError';
    this.statusCode = 403;
  }
}

/**
 * Validates maker-checker compliance for approval actions.
 * Throws a 403 Forbidden error if initiator attempts self-approval.
 * Admin also holds approval permission but is strictly subject to the same self-approval block.
 */
export function enforceMakerCheckerApproval(
  initiatorUserId: string,
  approverUserId: string,
  actionLabel: string = 'this record'
): void {
  if (!initiatorUserId || !approverUserId) {
    throw new MakerCheckerViolationError(
      '403 Forbidden: Incomplete audit identity for maker-checker verification.'
    );
  }

  if (initiatorUserId.trim().toLowerCase() === approverUserId.trim().toLowerCase()) {
    throw new MakerCheckerViolationError(
      `403 Forbidden: Maker-Checker violation. Initiator/creator cannot approve their own record (${actionLabel}). Requires a segregated checker.`
    );
  }
}

/**
 * Validates permission authority for initiating an action.
 */
export function validateInitiationPermission(
  userRole: UserRole,
  permission: 'payroll.initiate' | 'employee.bank_edit'
): void {
  if (!hasPermission(userRole, permission)) {
    throw new MakerCheckerViolationError(
      `403 Forbidden: User role [${userRole}] lacks initiation permission [${permission}].`
    );
  }
}

/**
 * Validates permission authority for approving an action.
 */
export function validateApprovalPermission(
  userRole: UserRole,
  permission: 'payroll.approve' | 'employee.bank_approve'
): void {
  if (!hasPermission(userRole, permission)) {
    throw new MakerCheckerViolationError(
      `403 Forbidden: User role [${userRole}] lacks approval permission [${permission}].`
    );
  }
}

/**
 * Generates an audit diff between current and proposed bank details.
 */
export function calculateBankDetailsDiff(
  current: BankDetailChangeRequest['currentBank'],
  proposed: BankDetailChangeRequest['proposedBank']
): Record<string, { oldValue: string; newValue: string }> {
  const diff: Record<string, { oldValue: string; newValue: string }> = {};

  if (current.accountNumber !== proposed.accountNumber) {
    diff.accountNumber = { oldValue: current.accountNumber, newValue: proposed.accountNumber };
  }
  if (current.ifscCode !== proposed.ifscCode) {
    diff.ifscCode = { oldValue: current.ifscCode, newValue: proposed.ifscCode };
  }
  if (current.bankName !== proposed.bankName) {
    diff.bankName = { oldValue: current.bankName, newValue: proposed.bankName };
  }
  if (current.accountHolderName !== proposed.accountHolderName) {
    diff.accountHolderName = { oldValue: current.accountHolderName, newValue: proposed.accountHolderName };
  }

  return diff;
}

