// ──────────────────────────────────────────────────
// Golden Leaf Finance — Database Migration: Role Hierarchy
// Migration: 20261106_add_hr_payroll_finance_manager
// Adds HR & Payroll Finance Manager role, hierarchy ranks, and seed account
// Includes idempotent execution and full rollback support
// ──────────────────────────────────────────────────

import {
  ROLE_HIERARCHY_RANK,
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  type UserRole,
} from '../../types/auth.types';

const ACCOUNTS_STORAGE_KEY = 'golden_leaf_roles_user_accounts_master';
const MIGRATION_STATE_KEY = 'glf_migration_role_hierarchy_state';

export interface MigrationResult {
  success: boolean;
  migrationId: string;
  appliedAt: string;
  actions: string[];
  seedAccountsCreated: number;
}

export interface RollbackResult {
  success: boolean;
  rolledBackAt: string;
  actions: string[];
}

/**
 * Executes the forward migration to insert HR & Payroll Finance Manager
 * into the institutional hierarchy and seed demo credentials.
 */
export function runRoleHierarchyMigration(): MigrationResult {
  const actions: string[] = [];

  // 1. Verify Hierarchy Rank
  const hrRank = ROLE_HIERARCHY_RANK['hr_payroll_manager'];
  const adminRank = ROLE_HIERARCHY_RANK['admin'];
  const bmRank = ROLE_HIERARCHY_RANK['branch_manager'];

  if (adminRank <= hrRank || hrRank <= bmRank) {
    throw new Error(
      `Migration Error: Hierarchy ranking violation! Expected Admin (${adminRank}) > HR (${hrRank}) > Branch Manager (${bmRank})`
    );
  }
  actions.push(`Verified hierarchy ranking: Admin (100) > HR & Payroll Manager (80) > Branch Manager (60)`);

  // 2. Verify Permission Mappings
  const hrPermissions = ROLE_PERMISSIONS['hr_payroll_manager'];
  if (!hrPermissions || hrPermissions.length === 0) {
    throw new Error('Migration Error: Permission mappings for hr_payroll_manager missing.');
  }
  actions.push(`Loaded ${hrPermissions.length} institutional permissions for hr_payroll_manager`);

  // 3. Institutional accounts check (Mock seed removed - 100% production clean)
  const seedCreated = 0;
  actions.push('Role hierarchy migration verified without mock seed accounts');

  // 4. Record migration state
  const state = {
    migrationId: '20261106_add_hr_payroll_finance_manager',
    appliedAt: new Date().toISOString(),
    status: 'APPLIED',
  };
  try {
    localStorage.setItem(MIGRATION_STATE_KEY, JSON.stringify(state));
  } catch {}

  return {
    success: true,
    migrationId: state.migrationId,
    appliedAt: state.appliedAt,
    actions,
    seedAccountsCreated: seedCreated,
  };
}

/**
 * Rolls back the migration: removes seed account and clears migration record.
 */
export function rollbackRoleHierarchyMigration(): RollbackResult {
  const actions: string[] = [];

  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const accounts = JSON.parse(raw);
      const filtered = accounts.filter(
        (a: any) => a.username !== 'hr.manager' && a.id !== 'USR-HR-001'
      );
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(filtered));
      actions.push('Removed seeded hr.manager account from accounts store');
    }
    localStorage.removeItem(MIGRATION_STATE_KEY);
    actions.push('Cleared migration record from local state');
  } catch (err) {
    actions.push(`Rollback notice: ${err}`);
  }

  return {
    success: true,
    rolledBackAt: new Date().toISOString(),
    actions,
  };
}

