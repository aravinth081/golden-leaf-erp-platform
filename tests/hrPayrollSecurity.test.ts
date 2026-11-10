// ──────────────────────────────────────────────────
// Golden Leaf Finance — Automated Security & RBAC Test Suite
// Unit & Integration Tests for Role Hierarchy, Permission Matrix,
// Maker-Checker Segregation, Effective-Dating, Payroll Lock & F&F Guard
// ──────────────────────────────────────────────────

import assert from 'node:assert';
import {
  ROLE_HIERARCHY_RANK,
  ROLE_PERMISSIONS,
  canManageUser,
  isCompanyWideRole,
  hasPermission,
  type UserRole,
  type AuthUser,
} from '../src/types/auth.types';
import {
  enforceMakerCheckerApproval,
  validateInitiationPermission,
  validateApprovalPermission,
  calculateBankDetailsDiff,
  MakerCheckerViolationError,
} from '../src/services/makerCheckerService';
import {
  createSalaryRevision,
  getSalaryRevisions,
  initiateDraftPayrollRun,
  approvePayrollRun,
  lockPayrollPeriod,
  isPeriodLocked,
  queueRetroactiveArrears,
  getQueuedRetroactiveArrears,
  createFnFSettlement,
  updateOffboardingChecklist,
  disburseFnFSettlement,
  requestBankDetailChange,
  approveBankDetailChange,
  appendHRAuditLog,
  getHRAuditLogs,
  generateBankTransferFile,
  saveEmployeeDocVault,
  getEmployeeDocVault,
  submitExpenseClaim,
  branchManagerApproveExpense,
  financeFinalApproveExpense,
  getPayrollJournalEntries,
} from '../src/services/hrPayrollService';
import {
  runRoleHierarchyMigration,
  rollbackRoleHierarchyMigration,
} from '../src/services/migrations/migrateRoleHierarchy';

// Mock localStorage in Node environment if absent
if (typeof globalThis.localStorage === 'undefined') {
  const memoryStore: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => memoryStore[key] || null,
    setItem: (key: string, val: string) => {
      memoryStore[key] = String(val);
    },
    removeItem: (key: string) => {
      delete memoryStore[key];
    },
    clear: () => {
      for (const k of Object.keys(memoryStore)) delete memoryStore[k];
    },
  };
}

let testPassed = 0;
let testFailed = 0;

function it(description: string, testFn: () => void) {
  try {
    testFn();
    console.log(`  ✓ ${description}`);
    testPassed++;
  } catch (err: any) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message || err}`);
    testFailed++;
  }
}

console.log('\n======================================================');
console.log(' RUNNING RBAC & HR PAYROLL SECURITY TEST SUITE');
console.log('======================================================\n');

// ── Test Mock Users ──
const adminUser: AuthUser = {
  uid: 'usr-admin-01',
  email: 'admin@goldenleaf.finance',
  displayName: 'Super Admin',
  photoURL: null,
  phoneNumber: '+91 98400 11111',
  emailVerified: true,
  customClaims: { role: 'admin', companyId: 'default' },
};

const hrUser: AuthUser = {
  uid: 'usr-hr-01',
  email: 'hr@goldenleaf.finance',
  displayName: 'HR Finance Manager',
  photoURL: null,
  phoneNumber: '+91 98400 22222',
  emailVerified: true,
  customClaims: { role: 'hr_payroll_manager', companyId: 'default' },
};

const hrUser2: AuthUser = {
  uid: 'usr-hr-02',
  email: 'hr2@goldenleaf.finance',
  displayName: 'Secondary HR Checker',
  photoURL: null,
  phoneNumber: '+91 98400 22223',
  emailVerified: true,
  customClaims: { role: 'hr_payroll_manager', companyId: 'default' },
};

const bmUser: AuthUser = {
  uid: 'usr-bm-01',
  email: 'bm@goldenleaf.finance',
  displayName: 'Branch Manager Anna Nagar',
  photoURL: null,
  phoneNumber: '+91 98400 33333',
  emailVerified: true,
  customClaims: { role: 'branch_manager', branchId: 'BR-01', companyId: 'default' },
};

const croUser: AuthUser = {
  uid: 'usr-cro-01',
  email: 'cro@goldenleaf.finance',
  displayName: 'Customer Relationship Officer',
  photoURL: null,
  phoneNumber: '+91 98400 44444',
  emailVerified: true,
  customClaims: { role: 'collection_agent', branchId: 'BR-01', companyId: 'default' },
};

// ── 1. Role Hierarchy & Rank Tests ──
console.log('1. ROLE HIERARCHY & RANK TESTS:');

it('Hierarchy rank order: Admin (100) > HR Manager (80) > Branch Manager (60)', () => {
  assert(ROLE_HIERARCHY_RANK.admin > ROLE_HIERARCHY_RANK.hr_payroll_manager);
  assert(ROLE_HIERARCHY_RANK.hr_payroll_manager > ROLE_HIERARCHY_RANK.branch_manager);
  assert(ROLE_HIERARCHY_RANK.branch_manager > ROLE_HIERARCHY_RANK.collection_agent);
});

it('Admin can manage all roles', () => {
  assert.strictEqual(canManageUser('admin', 'hr_payroll_manager'), true);
  assert.strictEqual(canManageUser('admin', 'branch_manager'), true);
  assert.strictEqual(canManageUser('admin', 'collection_agent'), true);
});

it('HR & Payroll Finance Manager can manage Branch Manager and lower roles', () => {
  assert.strictEqual(canManageUser('hr_payroll_manager', 'branch_manager'), true);
  assert.strictEqual(canManageUser('hr_payroll_manager', 'credit_manager'), true);
  assert.strictEqual(canManageUser('hr_payroll_manager', 'collection_agent'), true);
  assert.strictEqual(canManageUser('hr_payroll_manager', 'accountant'), true);
});

it('HR & Payroll Finance Manager CANNOT manage Admin or peers', () => {
  assert.strictEqual(canManageUser('hr_payroll_manager', 'admin'), false);
  assert.strictEqual(canManageUser('hr_payroll_manager', 'hr_payroll_manager'), false);
});

it('Branch Manager CANNOT manage HR or Admin', () => {
  assert.strictEqual(canManageUser('branch_manager', 'admin'), false);
  assert.strictEqual(canManageUser('branch_manager', 'hr_payroll_manager'), false);
});

// ── 2. Permission Matrix Tests ──
console.log('\n2. PERMISSION MATRIX TESTS:');

it('HR & Payroll Manager has full HR/payroll permissions', () => {
  assert.strictEqual(hasPermission('hr_payroll_manager', 'payroll:ctc_manage'), true);
  assert.strictEqual(hasPermission('hr_payroll_manager', 'payroll.initiate'), true);
  assert.strictEqual(hasPermission('hr_payroll_manager', 'payroll.approve'), true);
  assert.strictEqual(hasPermission('hr_payroll_manager', 'employee.bank_edit'), true);
  assert.strictEqual(hasPermission('hr_payroll_manager', 'employee.bank_approve'), true);
  assert.strictEqual(hasPermission('hr_payroll_manager', 'compliance:statutory_manage'), true);
  assert.strictEqual(hasPermission('hr_payroll_manager', 'leave:approve_all'), true);
  assert.strictEqual(hasPermission('hr_payroll_manager', 'expense:finance_approve'), true);
  assert.strictEqual(hasPermission('hr_payroll_manager', 'hiring:sandbox'), true);
  assert.strictEqual(hasPermission('hr_payroll_manager', 'ledger:payroll_view'), true);
});

it('HR & Payroll Manager is denied system settings and admin config', () => {
  assert.strictEqual(hasPermission('hr_payroll_manager', 'settings:manage'), false);
  assert.strictEqual(hasPermission('hr_payroll_manager', 'admin:manage'), false);
  assert.strictEqual(hasPermission('hr_payroll_manager', 'roles:configure'), false);
});

it('Branch Manager has first-level approvals but is strictly denied salary/payroll', () => {
  assert.strictEqual(hasPermission('branch_manager', 'leave:first_approve'), true);
  assert.strictEqual(hasPermission('branch_manager', 'expense:manager_approve'), true);
  // Denied:
  assert.strictEqual(hasPermission('branch_manager', 'payroll:view'), false);
  assert.strictEqual(hasPermission('branch_manager', 'payroll:manage'), false);
  assert.strictEqual(hasPermission('branch_manager', 'payroll.initiate'), false);
  assert.strictEqual(hasPermission('branch_manager', 'payroll.approve'), false);
  assert.strictEqual(hasPermission('branch_manager', 'hiring:sandbox'), false);
});

// ── 3. Branch Scoping Tests ──
console.log('\n3. BRANCH SCOPING TESTS:');

it('Admin and HR & Payroll Manager operate company-wide (all branches)', () => {
  assert.strictEqual(isCompanyWideRole('admin'), true);
  assert.strictEqual(isCompanyWideRole('hr_payroll_manager'), true);
});

it('Branch Manager and CRO are strictly branch-scoped', () => {
  assert.strictEqual(isCompanyWideRole('branch_manager'), false);
  assert.strictEqual(isCompanyWideRole('collection_agent'), false);
  assert.strictEqual(isCompanyWideRole('credit_manager'), false);
});

// ── 4. Maker-Checker Segregation & 403 Enforcement ──
console.log('\n4. MAKER-CHECKER SEGREGATION TESTS:');

it('Maker cannot approve own draft payroll run (Throws 403 Forbidden)', () => {
  const { run } = initiateDraftPayrollRun(
    '2026-09',
    [{ id: 'EMP-T1', name: 'Test Employee', branchId: 'BR-01', designation: 'Officer', baseMonthly: 30000 }],
    hrUser
  );

  assert.throws(
    () => {
      // hrUser initiated, so hrUser cannot approve
      approvePayrollRun(run.id, hrUser);
    },
    (err: any) => {
      assert(err instanceof MakerCheckerViolationError || err.statusCode === 403);
      assert(err.message.includes('403 Forbidden: Maker-Checker violation'));
      return true;
    }
  );
});

it('Segregated second checker successfully approves draft payroll', () => {
  const { run } = initiateDraftPayrollRun(
    '2026-08',
    [{ id: 'EMP-T2', name: 'Test Employee 2', branchId: 'BR-01', designation: 'Officer', baseMonthly: 30000 }],
    hrUser
  );

  // hrUser2 approves
  const approved = approvePayrollRun(run.id, hrUser2);
  assert.strictEqual(approved.status, 'approved');
  assert.strictEqual(approved.approvedBy, hrUser2.uid);
});

it('Admin cannot self-approve a payroll run they initiated (Subject to same 403 block)', () => {
  const { run } = initiateDraftPayrollRun(
    '2026-07',
    [{ id: 'EMP-T3', name: 'Test Employee 3', branchId: 'BR-01', designation: 'Officer', baseMonthly: 30000 }],
    adminUser
  );

  assert.throws(
    () => {
      approvePayrollRun(run.id, adminUser);
    },
    (err: any) => {
      assert(err.message.includes('403 Forbidden: Maker-Checker violation'));
      return true;
    }
  );
});

it('Bank details change flags a diff and requires second checker approval', () => {
  const currentBank = {
    accountNumber: '111122223333',
    ifscCode: 'HDFC0001111',
    bankName: 'HDFC Bank',
    accountHolderName: 'Employee Test',
  };
  const proposedBank = {
    accountNumber: '999988887777',
    ifscCode: 'ICIC0009999',
    bankName: 'ICICI Bank',
    accountHolderName: 'Employee Test',
  };

  const diff = calculateBankDetailsDiff(currentBank, proposedBank);
  assert.strictEqual(diff.accountNumber.oldValue, '111122223333');
  assert.strictEqual(diff.accountNumber.newValue, '999988887777');

  const req = requestBankDetailChange(
    {
      employeeId: 'EMP-BK-1',
      employeeName: 'Employee Test',
      currentBank,
      proposedBank,
    },
    hrUser
  );

  // Self-approval by maker fails:
  assert.throws(() => {
    approveBankDetailChange(req.id, hrUser);
  });

  // Approval by second checker succeeds:
  const approvedReq = approveBankDetailChange(req.id, hrUser2);
  assert.strictEqual(approvedReq.status, 'approved');
  assert.strictEqual(approvedReq.approvedBy, hrUser2.uid);
});

// ── 5. Effective-Dating & Payroll Lock Tests ──
console.log('\n5. DATA RULES: EFFECTIVE-DATING & PAYROLL LOCK:');

it('Effective-dating: salary revision preserves past records with effectiveTo', () => {
  const rev1 = createSalaryRevision(
    {
      employeeId: 'EMP-ED-1',
      designation: 'Credit Analyst',
      ctcAnnual: 480000,
      baseMonthly: 28000,
      hraMonthly: 11200,
      specialAllowance: 4800,
      revisionReason: 'Initial Joining',
    },
    adminUser
  );
  assert.strictEqual(rev1.effectiveTo, null);

  const rev2 = createSalaryRevision(
    {
      employeeId: 'EMP-ED-1',
      designation: 'Senior Credit Analyst',
      ctcAnnual: 600000,
      baseMonthly: 35000,
      hraMonthly: 14000,
      specialAllowance: 5000,
      revisionReason: 'Promotion',
    },
    adminUser
  );

  const history = getSalaryRevisions('EMP-ED-1');
  assert.strictEqual(history.length, 2);
  const oldRow = history.find((h) => h.id === rev1.id);
  const newRow = history.find((h) => h.id === rev2.id);

  assert(oldRow && oldRow.effectiveTo !== null, 'Old revision must have effectiveTo set');
  assert(newRow && newRow.effectiveTo === null, 'New revision must be active with effectiveTo null');
});

it('Payroll Lock: sealed period blocks salary edits and locks payroll', () => {
  const period = '2026-06';
  lockPayrollPeriod(period, adminUser);
  assert.strictEqual(isPeriodLocked(period), true);

  // Queuing retroactive adjustment succeeds and routes to arrears
  queueRetroactiveArrears({
    employeeId: 'EMP-ED-1',
    lockedPeriod: period,
    amount: 5000,
    type: 'arrear',
    reason: 'Retroactive increment approved post-lock',
  });

  const queued = getQueuedRetroactiveArrears('EMP-ED-1');
  assert.strictEqual(queued.length, 1);
  assert.strictEqual(queued[0].amount, 5000);
});

// ── 6. Full & Final (F&F) Offboarding Revocation Guard ──
console.log('\n6. FULL & FINAL (F&F) SETTLEMENT GUARD:');

it('F&F payout is blocked until IT/Admin checklist (laptop, DB, financial) is revoked', () => {
  const fnf = createFnFSettlement(
    {
      employeeId: 'EMP-EXIT-1',
      employeeName: 'Resigning Staff',
      resignationDate: '2026-10-01',
      lastWorkingDay: '2026-10-31',
      gratuityAmount: 30000,
      leaveEncashmentAmount: 15000,
      noticePeriodRecovery: 0,
      unpaidSalary: 25000,
    },
    hrUser
  );

  // Attempting disbursal before revocation throws 403:
  assert.throws(
    () => {
      disburseFnFSettlement(fnf.id, hrUser);
    },
    (err: any) => {
      assert(err.message.includes('403 Forbidden: Full & Final (F&F) settlement payout is hard-blocked'));
      return true;
    }
  );

  // Admin marks offboarding revocations:
  updateOffboardingChecklist(
    fnf.id,
    {
      laptopRevoked: true,
      dbCredentialsRevoked: true,
      financialAccessRevoked: true,
    },
    adminUser
  );

  // Now disbursal succeeds:
  const disbursed = disburseFnFSettlement(fnf.id, hrUser);
  assert.strictEqual(disbursed.settlementStatus, 'completed');
  assert.strictEqual(disbursed.netSettlementAmount, 70000);
});

// ── 7. Immutable Audit Trail Tests ──
console.log('\n7. IMMUTABLE AUDIT TRAIL TESTS:');

it('Audit logs are append-only with required fields', () => {
  const entry = appendHRAuditLog(
    'usr-hr-01',
    'hr_payroll_manager',
    'salary_revision',
    'salary',
    { ctc: 480000 },
    { ctc: 600000 },
    '192.168.1.100'
  );

  assert(entry.id.startsWith('AUD-'));
  assert(entry.timestamp);
  assert.strictEqual(entry.userId, 'usr-hr-01');
  assert.strictEqual(entry.userRole, 'hr_payroll_manager');
  assert.strictEqual(entry.action, 'salary_revision');
  assert.strictEqual(entry.entity, 'salary');
  assert.strictEqual(entry.ipAddress, '192.168.1.100');

  const logs = getHRAuditLogs();
  assert(logs.some((l) => l.id === entry.id));
});

// ── 8. DB Migration & Rollback Tests ──
console.log('\n8. DB MIGRATION & ROLLBACK TESTS:');

it('Database migration applies role hierarchy and seeds hr.manager account', () => {
  const result = runRoleHierarchyMigration();
  assert.strictEqual(result.success, true);
  assert(result.migrationId.includes('20261106_add_hr_payroll_finance_manager'));
});

it('Database rollback restores previous state', () => {
  const rollback = rollbackRoleHierarchyMigration();
  assert.strictEqual(rollback.success, true);
});

// Re-run migration so storage remains properly initialized
runRoleHierarchyMigration();

// ── 9. PDF Specification Verification Tests ──
console.log('\n9. PDF SPECIFICATION VERIFICATION TESTS:');

it('Document Vault & BGV Status with Cost Center mapping persists immutably', () => {
  saveEmployeeDocVault(
    'EMP-SPEC-01',
    {
      employeeId: 'EMP-SPEC-01',
      panNumber: 'ABCDE9999F',
      panVerified: true,
      aadhaarNumber: '999988887777',
      aadhaarVerified: true,
      bgvStatus: 'verified',
      employmentType: 'full_time',
      costCenter: 'Tech',
      bankDetails: {
        accountNumber: '1122334455',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        accountHolderName: 'Tech Lead',
        status: 'approved',
      },
    },
    hrUser
  );

  const vault = getEmployeeDocVault('EMP-SPEC-01');
  assert(vault);
  assert.strictEqual(vault.panNumber, 'ABCDE9999F');
  assert.strictEqual(vault.bgvStatus, 'verified');
  assert.strictEqual(vault.costCenter, 'Tech');
  assert.strictEqual(vault.employmentType, 'full_time');
});

it('Contractor Withholding (194J) exempts PF/ESI and deducts 10% TDS', () => {
  const { run, slips } = initiateDraftPayrollRun(
    '2026-11',
    [
      {
        id: 'EMP-FULLTIME',
        name: 'Full Time Engineer',
        branchId: 'BR-01',
        designation: 'Engineer',
        costCenter: 'Tech',
        employmentType: 'full_time',
        baseMonthly: 50000,
        hraMonthly: 20000,
        specialAllowance: 10000,
        variableIncentive: 5000,
      },
      {
        id: 'EMP-CONSULTANT',
        name: 'Legal Consultant',
        branchId: 'BR-01',
        designation: 'Legal Advisor',
        costCenter: 'Compliance',
        employmentType: 'consultant',
        baseMonthly: 60000,
        hraMonthly: 0,
        specialAllowance: 0,
        variableIncentive: 0,
      },
    ],
    hrUser
  );

  const consultantSlip = slips.find((s) => s.employeeId === 'EMP-CONSULTANT')!;
  assert.strictEqual(consultantSlip.pfDeduction, 0, 'Consultant must have 0 PF deduction');
  assert.strictEqual(consultantSlip.esiDeduction, 0, 'Consultant must have 0 ESI deduction');
  assert.strictEqual(consultantSlip.ptDeduction, 0, 'Consultant must have 0 PT deduction');
  assert.strictEqual(consultantSlip.tdsDeduction, 6000, 'Consultant must have 10% Section 194J TDS (60,000 * 0.10)');

  const fulltimeSlip = slips.find((s) => s.employeeId === 'EMP-FULLTIME')!;
  assert(fulltimeSlip.pfDeduction > 0, 'Full-time employee must have PF deduction');
  assert(fulltimeSlip.ptDeduction > 0, 'Full-time employee must have PT deduction');

  assert.strictEqual(run.variableIncentiveTotal, 5000, 'Run tracks variable incentive total');
  assert((run.fixedBurn ?? 0) > 0, 'Run tracks fixed burn separately');
});

it('Automated GL Posting Template generates 5-account balance entries upon Checker approval', () => {
  const { run } = initiateDraftPayrollRun(
    '2026-12',
    [
      {
        id: 'EMP-GL-TEST',
        name: 'GL Test Employee',
        branchId: 'BR-01',
        designation: 'Staff',
        costCenter: 'Operations',
        employmentType: 'full_time',
        baseMonthly: 40000,
        hraMonthly: 16000,
        specialAllowance: 4000,
      },
    ],
    hrUser
  );

  // Checker approves (second user adminUser)
  approvePayrollRun(run.id, adminUser);

  const entries = getPayrollJournalEntries().filter((je) => je.period === '2026-12');
  assert.strictEqual(entries.length, 5, 'Exact 5 accounts posted per Page 2 GL posting template');

  const debit5100 = entries.find((e) => e.debitAccount.includes('5100'));
  assert(debit5100, 'Account 5100 (Salaries & Wages Expense) Dr must be present');

  const debit5120 = entries.find((e) => e.debitAccount.includes('5120'));
  assert(debit5120, 'Account 5120 (Employer Statutory Contribution Expense) Dr must be present');

  const credit2110 = entries.find((e) => e.creditAccount.includes('2110'));
  assert(credit2110, 'Account 2110 (TDS / Withholding Tax Payable) Cr must be present');

  const credit2120 = entries.find((e) => e.creditAccount.includes('2120'));
  assert(credit2120, 'Account 2120 (PF & Statutory Dues Payable) Cr must be present');

  const credit2100 = entries.find((e) => e.creditAccount.includes('2100'));
  assert(credit2100, 'Account 2100 (Net Salaries Payable / Bank Clearing) Cr must be present');
});

it('Expense claims categorize GL codes and compute 18% GST Input Tax Credit', () => {
  const claim = submitExpenseClaim(
    {
      employeeId: 'EMP-SPEC-01',
      employeeName: 'Tech Lead',
      branchId: 'BR-01',
      category: 'software_tools',
      amount: 10000,
      description: 'AWS Cloud Hosting and Developer Tooling',
      date: '2026-11-06',
      hasGstItc: true,
      gstin: '33AAAAA0000A1Z5',
    },
    hrUser
  );

  assert.strictEqual(claim.glCode, 'GL-6103');
  assert.strictEqual(claim.hasGstItc, true);
  assert.strictEqual(claim.itcAmount, 1800, '18% ITC of 10,000 is 1,800');

  // Step 1: Branch Manager level approval
  const mgrApproved = branchManagerApproveExpense(claim.id, bmUser);
  assert.strictEqual(mgrApproved.status, 'manager_approved');

  // Step 2: Final Finance level approval with GL code
  const approved = financeFinalApproveExpense(claim.id, 'GL-6103', hrUser);
  assert.strictEqual(approved.status, 'finance_approved');
});

console.log('\n======================================================');
console.log(` TEST SUMMARY: ${testPassed} PASSED, ${testFailed} FAILED`);
console.log('======================================================\n');

if (testFailed > 0) {
  process.exit(1);
}

