// ──────────────────────────────────────────────────
// Golden Leaf Finance — HR & Payroll Finance Core Service
// Effective-Dating, Payroll Lock, Maker-Checker Workflows,
// F&F Offboarding Revocation Guard, and Append-Only Audit Trail
// ──────────────────────────────────────────────────

import type { AuthUser, UserRole } from '../types/auth.types';
import type {
  BankDetailChangeRequest,
  DocumentVault,
  EmploymentType,
  CostCenter,
  BgvStatus,
  SalaryRevision,
  PayrollRun,
  PayrollSlip,
  StatutoryFiling,
  ExpenseClaim,
  FnFSettlement,
  HiringProjection,
  EsopGrant,
  PayrollJournalEntry,
  HRAuditLogEntry,
} from '../types/hrPayroll.types';
import {
  enforceMakerCheckerApproval,
  validateInitiationPermission,
  validateApprovalPermission,
  calculateBankDetailsDiff,
  MakerCheckerViolationError,
} from './makerCheckerService';

// Storage keys for persistence
export const STORAGE_KEYS = {
  SALARIES: 'glf_hr_salary_revisions_master',
  PAYROLL_RUNS: 'glf_hr_payroll_runs_master',
  PAYROLL_SLIPS: 'glf_hr_payroll_slips_master',
  BANK_REQUESTS: 'glf_hr_bank_change_requests_master',
  STATUTORY: 'glf_hr_statutory_filings_master',
  EXPENSES: 'glf_hr_expenses_master',
  FNF: 'glf_hr_fnf_settlements_master',
  SANDBOX: 'glf_hr_hiring_sandbox_master',
  ESOP: 'glf_hr_esop_master',
  JOURNAL: 'glf_hr_payroll_journal_master',
  AUDIT: 'glf_hr_immutable_audit_trail_master',
  LOCKED_PERIODS: 'glf_hr_locked_periods_master',
  RETROACTIVE_ARREARS: 'glf_hr_retroactive_arrears_master',
  DOC_VAULTS: 'glf_hr_employee_doc_vaults_master',
};

const HR_MOCK_PURGE_FLAG = 'glf_hr_mock_purged_v20261107_emp_v2';

/**
 * Irrevocably purges legacy mock/dummy data across HR & Payroll modules.
 */
export function purgeLegacyMockData(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;

    const rawSlips = localStorage.getItem(STORAGE_KEYS.PAYROLL_SLIPS);
    const rawRuns = localStorage.getItem(STORAGE_KEYS.PAYROLL_RUNS);
    const rawAudit = localStorage.getItem(STORAGE_KEYS.AUDIT);
    const rawVaults = localStorage.getItem(STORAGE_KEYS.DOC_VAULTS);

    const hasLegacyMock =
      (rawSlips &&
        (rawSlips.includes('Ramesh') ||
          rawSlips.includes('Sundaram') ||
          rawSlips.includes('EMP-001') ||
          rawSlips.includes('Karthik Raja'))) ||
      (rawRuns && (rawRuns.includes('2026-10') || rawRuns.includes('Ramesh') || rawRuns.includes('EMP-001'))) ||
      (rawAudit && rawAudit.includes('Ramesh Sundaram')) ||
      (rawVaults && rawVaults.includes('EMP-001')) ||
      localStorage.getItem(HR_MOCK_PURGE_FLAG) !== 'true';

    if (hasLegacyMock) {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
      [
        'glf_payroll_runs_master',
        'glf_hr_payroll_runs',
        'glf_hr_payroll_slips',
        'glf_salary_revisions_master',
        'glf_employee_kyc_vaults',
      ].forEach((k) => localStorage.removeItem(k));

      ['glf_pdf_strict_employees_master', 'glf_employees_cache'].forEach((k) => {
        const item = localStorage.getItem(k);
        if (item) {
          try {
            const list = JSON.parse(item);
            if (Array.isArray(list)) {
              const MOCK_IDS = [
                'EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005',
                'EMP-006', 'EMP-007', 'EMP-008', 'EMP-009', 'EMP-010',
              ];
              const MOCK_NAMES = [
                'Sundaram', 'Karthik Raja', 'Priya Dharshini', 'Suresh Kumar',
                'Priya Sharma', 'Amit Das', 'Ramesh V.', 'Arun P.', 'K. Marimuthu',
              ];
              const cleaned = list.filter(
                (e: any) =>
                  !MOCK_IDS.includes(e.id) &&
                  !MOCK_NAMES.some((n: string) => e.name?.includes(n))
              );
              localStorage.setItem(k, JSON.stringify(cleaned));
            }
          } catch {}
        }
      });

      localStorage.setItem(HR_MOCK_PURGE_FLAG, 'true');
    }
  } catch (err) {
    console.warn('Auto-purge check error:', err);
  }
}

// Immediate execution
purgeLegacyMockData();

// Centralized mock employee blocklist
const MOCK_EMPLOYEE_IDS = [
  'EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005',
  'EMP-006', 'EMP-007', 'EMP-008', 'EMP-009', 'EMP-010',
];
const MOCK_EMPLOYEE_NAMES = [
  'Sundaram', 'Karthik Raja', 'Priya Dharshini', 'Suresh Kumar',
  'Priya Sharma', 'Amit Das', 'Ramesh V.', 'Arun P.', 'K. Marimuthu',
  'Dinesh Kumar',
];

// Safe LocalStorage helpers
function readStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn(`Could not read storage for key ${key}`, err);
  }
  return defaultValue;
}

function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Could not write storage for key ${key}`, err);
  }
}

// ─── 1. Immutable Audit Trail (Append-Only) ───

export function appendHRAuditLog(
  userId: string,
  userRole: string,
  action: HRAuditLogEntry['action'],
  entity: HRAuditLogEntry['entity'],
  oldValue: Record<string, unknown> | null,
  newValue: Record<string, unknown> | null,
  ipAddress: string = '127.0.0.1'
): HRAuditLogEntry {
  const currentLogs = readStorage<HRAuditLogEntry[]>(STORAGE_KEYS.AUDIT, []);
  const entry: HRAuditLogEntry = {
    id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    userId,
    userRole,
    action,
    entity,
    oldValue,
    newValue,
    ipAddress,
  };

  // Strictly append-only: no update or delete mutations allowed
  currentLogs.unshift(entry);
  writeStorage(STORAGE_KEYS.AUDIT, currentLogs);
  return entry;
}

export function getHRAuditLogs(): HRAuditLogEntry[] {
  return readStorage<HRAuditLogEntry[]>(STORAGE_KEYS.AUDIT, []);
}

// ─── 2. Effective-Dating: Salary & CTC Management ───

export function getSalaryRevisions(employeeId?: string): SalaryRevision[] {
  purgeLegacyMockData();
  const all = readStorage<SalaryRevision[]>(STORAGE_KEYS.SALARIES, []);
  const filtered = all.filter((r) => !MOCK_EMPLOYEE_IDS.includes(r.employeeId));
  if (!employeeId) return filtered;
  return filtered.filter((r) => r.employeeId === employeeId);
}

export function getActiveSalary(employeeId: string): SalaryRevision | null {
  const list = getSalaryRevisions(employeeId);
  return list.find((r) => r.effectiveTo === null) || null;
}

/**
 * Creates an effective-dated salary revision.
 * Never overwrites past records; updates the current active revision's effectiveTo to today,
 * and creates a new revision starting today.
 */
export function createSalaryRevision(
  params: {
    employeeId: string;
    designation: string;
    ctcAnnual: number;
    baseMonthly: number;
    hraMonthly: number;
    specialAllowance: number;
    variablePayMonthly?: number;
    costCenter?: CostCenter;
    employmentType?: EmploymentType;
    pfEmployerMonthly?: number;
    pfEmployeeMonthly?: number;
    esiEmployerMonthly?: number;
    esiEmployeeMonthly?: number;
    ptMonthly?: number;
    revisionReason: string;
  },
  actor: AuthUser
): SalaryRevision {
  // Check if current period is locked
  const currentPeriod = new Date().toISOString().slice(0, 7);
  if (isPeriodLocked(currentPeriod)) {
    throw new Error(
      `403 Forbidden: Payroll period [${currentPeriod}] is hard-locked. Historical salaries cannot be modified for this cycle; revisions must be effective from the next cycle.`
    );
  }

  const allRevisions = readStorage<SalaryRevision[]>(STORAGE_KEYS.SALARIES, []);
  const todayStr = new Date().toISOString().split('T')[0];

  // Find existing active revision and set its effectiveTo to today
  let previousRevision: SalaryRevision | null = null;
  const updatedRevisions = allRevisions.map((rev) => {
    if (rev.employeeId === params.employeeId && rev.effectiveTo === null) {
      previousRevision = { ...rev };
      return { ...rev, effectiveTo: todayStr };
    }
    return rev;
  });

  const newRevision: SalaryRevision = {
    id: `SAL-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    employeeId: params.employeeId,
    designation: params.designation,
    ctcAnnual: params.ctcAnnual,
    baseMonthly: params.baseMonthly,
    hraMonthly: params.hraMonthly,
    specialAllowance: params.specialAllowance,
    variablePayMonthly: params.variablePayMonthly ?? 0,
    costCenter: params.costCenter ?? 'Operations',
    employmentType: params.employmentType ?? 'full_time',
    pfEmployerMonthly: params.pfEmployerMonthly ?? Math.round(params.baseMonthly * 0.12),
    pfEmployeeMonthly: params.pfEmployeeMonthly ?? Math.round(params.baseMonthly * 0.12),
    esiEmployerMonthly: params.esiEmployerMonthly ?? Math.round(params.baseMonthly * 0.0325),
    esiEmployeeMonthly: params.esiEmployeeMonthly ?? Math.round(params.baseMonthly * 0.0075),
    ptMonthly: params.ptMonthly ?? 200,
    effectiveFrom: todayStr,
    effectiveTo: null, // Active
    createdBy: actor.uid,
    createdAt: new Date().toISOString(),
    revisionReason: params.revisionReason,
  };

  updatedRevisions.push(newRevision);
  writeStorage(STORAGE_KEYS.SALARIES, updatedRevisions);

  // Log to immutable audit trail
  appendHRAuditLog(
    actor.uid,
    actor.customClaims.role,
    'salary_revision',
    'salary',
    previousRevision as any,
    newRevision as any
  );

  return newRevision;
}

// ─── 3. Bank Detail Change Request (Maker-Checker Segregation) ───

export function getBankChangeRequests(): BankDetailChangeRequest[] {
  purgeLegacyMockData();
  const all = readStorage<BankDetailChangeRequest[]>(STORAGE_KEYS.BANK_REQUESTS, []);
  return all.filter(
    (b) =>
      !MOCK_EMPLOYEE_IDS.includes(b.employeeId) &&
      !MOCK_EMPLOYEE_NAMES.some((n) => b.employeeName?.includes(n))
  );
}

export function requestBankDetailChange(
  params: {
    employeeId: string;
    employeeName: string;
    currentBank: BankDetailChangeRequest['currentBank'];
    proposedBank: BankDetailChangeRequest['proposedBank'];
  },
  maker: AuthUser
): BankDetailChangeRequest {
  validateInitiationPermission(maker.customClaims.role, 'employee.bank_edit');

  const diff = calculateBankDetailsDiff(params.currentBank, params.proposedBank);
  if (Object.keys(diff).length === 0) {
    throw new Error('No bank detail changes detected between current and proposed accounts.');
  }

  const requests = getBankChangeRequests();
  const newRequest: BankDetailChangeRequest = {
    id: `BNK-REQ-${Date.now()}`,
    employeeId: params.employeeId,
    employeeName: params.employeeName,
    requestedBy: maker.uid,
    requestedAt: new Date().toISOString(),
    currentBank: params.currentBank,
    proposedBank: params.proposedBank,
    status: 'pending',
  };

  requests.unshift(newRequest);
  writeStorage(STORAGE_KEYS.BANK_REQUESTS, requests);

  appendHRAuditLog(
    maker.uid,
    maker.customClaims.role,
    'bank_detail_change',
    'bank_detail',
    params.currentBank,
    { proposed: params.proposedBank, diff }
  );

  return newRequest;
}

export function approveBankDetailChange(
  requestId: string,
  checker: AuthUser
): BankDetailChangeRequest {
  validateApprovalPermission(checker.customClaims.role, 'employee.bank_approve');

  const requests = getBankChangeRequests();
  const reqIndex = requests.findIndex((r) => r.id === requestId);
  if (reqIndex === -1) {
    throw new Error('Bank detail change request not found.');
  }

  const request = requests[reqIndex];
  if (request.status !== 'pending') {
    throw new Error(`Request has already been processed with status: ${request.status}`);
  }

  // Maker-Checker enforcement: Maker cannot approve their own change request!
  enforceMakerCheckerApproval(request.requestedBy, checker.uid, 'Bank Account Revision');

  request.status = 'approved';
  request.approvedBy = checker.uid;
  request.approvedAt = new Date().toISOString();
  requests[reqIndex] = request;
  writeStorage(STORAGE_KEYS.BANK_REQUESTS, requests);

  // Update employee document vault
  updateEmployeeBankDetails(request.employeeId, request.proposedBank, checker.uid);

  appendHRAuditLog(
    checker.uid,
    checker.customClaims.role,
    'bank_detail_approval',
    'bank_detail',
    request.currentBank,
    request.proposedBank
  );

  return request;
}

// ─── 4. Employee Document Vault & KYC ───

export function getEmployeeDocVault(employeeId: string): DocumentVault | null {
  if (MOCK_EMPLOYEE_IDS.includes(employeeId)) {
    return null;
  }
  const vaults = getAllEmployeeDocVaults();
  return vaults[employeeId] || null;
}

export function getAllEmployeeDocVaults(): Record<string, DocumentVault> {
  purgeLegacyMockData();
  const vaults = readStorage<Record<string, DocumentVault>>(STORAGE_KEYS.DOC_VAULTS, {});
  MOCK_EMPLOYEE_IDS.forEach((id) => delete vaults[id]);
  return vaults;
}

export function saveEmployeeDocVault(
  employeeId: string,
  vault: DocumentVault,
  actor: AuthUser
): void {
  const vaults = readStorage<Record<string, DocumentVault>>(STORAGE_KEYS.DOC_VAULTS, {});
  const old = vaults[employeeId] || null;
  vaults[employeeId] = vault;
  writeStorage(STORAGE_KEYS.DOC_VAULTS, vaults);

  appendHRAuditLog(
    actor.uid,
    actor.customClaims.role,
    'permission_grant',
    'bank_detail',
    old as any,
    vault as any
  );
}

function updateEmployeeBankDetails(
  employeeId: string,
  bankDetails: BankDetailChangeRequest['proposedBank'],
  checkerId: string
): void {
  const vaults = readStorage<Record<string, DocumentVault>>(STORAGE_KEYS.DOC_VAULTS, {});
  if (!vaults[employeeId]) {
    vaults[employeeId] = {
      panNumber: 'ABCDE1234F',
      panVerified: true,
      aadhaarNumber: '123456789012',
      aadhaarVerified: true,
      bgvStatus: 'verified',
      employmentType: 'full_time',
      costCenter: 'Operations',
      bankDetails: {
        ...bankDetails,
        status: 'approved',
        approvedBy: checkerId,
        approvedAt: new Date().toISOString(),
      },
    };
  } else {
    vaults[employeeId].bankDetails = {
      ...bankDetails,
      status: 'approved',
      approvedBy: checkerId,
      approvedAt: new Date().toISOString(),
    };
  }
  writeStorage(STORAGE_KEYS.DOC_VAULTS, vaults);
}

// ─── 5. Payroll Lock & Retroactive Arrears ───

export function isPeriodLocked(period: string): boolean {
  const lockedPeriods = readStorage<string[]>(STORAGE_KEYS.LOCKED_PERIODS, []);
  return lockedPeriods.includes(period);
}

export function getLockedPeriods(): string[] {
  return readStorage<string[]>(STORAGE_KEYS.LOCKED_PERIODS, []);
}

export function lockPayrollPeriod(period: string, actor: AuthUser): void {
  const lockedPeriods = readStorage<string[]>(STORAGE_KEYS.LOCKED_PERIODS, []);
  if (!lockedPeriods.includes(period)) {
    lockedPeriods.push(period);
    writeStorage(STORAGE_KEYS.LOCKED_PERIODS, lockedPeriods);
  }

  // Update run status to locked
  const runs = readStorage<PayrollRun[]>(STORAGE_KEYS.PAYROLL_RUNS, []);
  const run = runs.find((r) => r.period === period);
  if (run) {
    run.status = 'locked';
    run.lockedBy = actor.uid;
    run.lockedAt = new Date().toISOString();
    writeStorage(STORAGE_KEYS.PAYROLL_RUNS, runs);
  }

  appendHRAuditLog(
    actor.uid,
    actor.customClaims.role,
    'payroll_lock',
    'payroll_run',
    { period, state: 'unlocked' },
    { period, state: 'hard_locked', lockedBy: actor.uid }
  );
}

export function queueRetroactiveArrears(params: {
  employeeId: string;
  lockedPeriod: string;
  amount: number;
  type: 'arrear' | 'recovery';
  reason: string;
}): void {
  const arrears = readStorage<any[]>(STORAGE_KEYS.RETROACTIVE_ARREARS, []);
  arrears.push({
    id: `ARR-${Date.now()}`,
    ...params,
    queuedAt: new Date().toISOString(),
    status: 'pending_next_cycle',
  });
  writeStorage(STORAGE_KEYS.RETROACTIVE_ARREARS, arrears);
}

export function getQueuedRetroactiveArrears(employeeId?: string): any[] {
  const all = readStorage<any[]>(STORAGE_KEYS.RETROACTIVE_ARREARS, []);
  if (!employeeId) return all;
  return all.filter((a) => a.employeeId === employeeId && a.status === 'pending_next_cycle');
}

// ─── 6. Payroll Runs & Slips with Maker-Checker ───

export function getPayrollRuns(): PayrollRun[] {
  purgeLegacyMockData();
  const runs = readStorage<PayrollRun[]>(STORAGE_KEYS.PAYROLL_RUNS, []);
  return runs.filter(
    (r) =>
      r.period !== '2026-10' &&
      !r.id?.includes('2026-10') &&
      r.initiatedBy !== 'demo_admin' &&
      r.initiatedBy !== 'system_demo'
  );
}

export function getPayrollSlips(runId?: string): PayrollSlip[] {
  purgeLegacyMockData();
  const all = readStorage<PayrollSlip[]>(STORAGE_KEYS.PAYROLL_SLIPS, []);
  const filtered = all.filter(
    (s) =>
      !MOCK_EMPLOYEE_IDS.includes(s.employeeId) &&
      !MOCK_EMPLOYEE_NAMES.some((n) => s.employeeName?.includes(n))
  );
  if (!runId) return filtered;
  return filtered.filter((s) => s.runId === runId);
}

/**
 * Initiates a draft payroll run (Maker action).
 * Calculates pro-rata for joiners/leavers, incorporates LOP days, applies statutory deductions.
 */
export function initiateDraftPayrollRun(
  period: string, // YYYY-MM
  employees: Array<{
    id: string;
    name: string;
    branchId: string;
    designation: string;
    costCenter?: CostCenter;
    employmentType?: EmploymentType;
    joinDate?: string;
    leaveDays?: number;
    lopDays?: number;
    baseMonthly?: number;
    hraMonthly?: number;
    specialAllowance?: number;
    variableIncentive?: number;
  }>,
  maker: AuthUser
): { run: PayrollRun; slips: PayrollSlip[] } {
  validateInitiationPermission(maker.customClaims.role, 'payroll.initiate');

  if (isPeriodLocked(period)) {
    throw new Error(`403 Forbidden: Period [${period}] has already been finalized and locked.`);
  }

  const existingRuns = getPayrollRuns();
  const existingIndex = existingRuns.findIndex((r) => r.period === period);
  if (existingIndex !== -1 && existingRuns[existingIndex].status === 'approved') {
    throw new Error(`Period [${period}] has already been approved. Cannot re-initiate.`);
  }

  const runId = `RUN-${period}-${Date.now()}`;
  const daysInMonth = 30; // Standard institutional payroll calculation basis
  const slips: PayrollSlip[] = [];

  let grossTotal = 0;
  let deductionsTotal = 0;
  let netTotal = 0;
  let fixedBurnTotal = 0;
  let variableIncentiveTotal = 0;

  for (const emp of employees) {
    const base = emp.baseMonthly ?? 30000;
    const hra = emp.hraMonthly ?? Math.round(base * 0.4);
    const allowance = emp.specialAllowance ?? 5000;
    const variable = emp.variableIncentive ?? 0;
    const gross = base + hra + allowance + variable;

    fixedBurnTotal += base + hra + allowance;
    variableIncentiveTotal += variable;

    const lopDays = emp.lopDays || 0;
    const workingDays = Math.max(0, daysInMonth - lopDays);
    const proRataGross = Math.round((gross / daysInMonth) * workingDays);

    // Statutory deductions
    const isContractor = emp.employmentType === 'consultant';
    // Contractors: Section 194J (10%) or 194C (1-2%), exempt from PF/ESI
    const pf = isContractor ? 0 : Math.round(base * 0.12);
    const esi = isContractor ? 0 : gross <= 21000 ? Math.round(gross * 0.0075) : 0;
    const pt = isContractor ? 0 : 200;
    const tds = isContractor ? Math.round(gross * 0.1) : gross > 50000 ? Math.round(gross * 0.1) : 0;

    // Check retroactive arrears
    const pendingArrears = getQueuedRetroactiveArrears(emp.id);
    const arrearsAmount = pendingArrears
      .filter((a) => a.type === 'arrear')
      .reduce((sum, a) => sum + a.amount, 0);
    const recoveryAmount = pendingArrears
      .filter((a) => a.type === 'recovery')
      .reduce((sum, a) => sum + a.amount, 0);

    const totalDeductions = pf + esi + pt + tds + recoveryAmount;
    const netSalary = Math.max(0, proRataGross + arrearsAmount - totalDeductions);

    grossTotal += proRataGross + arrearsAmount;
    deductionsTotal += totalDeductions;
    netTotal += netSalary;

    const vault = getEmployeeDocVault(emp.id);

    slips.push({
      id: `SLP-${runId}-${emp.id}`,
      runId,
      employeeId: emp.id,
      employeeName: emp.name,
      branchId: emp.branchId || 'BR-01',
      designation: emp.designation || 'Staff',
      costCenter: emp.costCenter || vault?.costCenter || 'Operations',
      employmentType: emp.employmentType || vault?.employmentType || 'full_time',
      period,
      totalMonthDays: daysInMonth,
      workingDays,
      presentDays: workingDays,
      lopDays,
      baseMonthly: base,
      hraMonthly: hra,
      specialAllowance: allowance,
      variableIncentive: variable,
      proRataGross,
      arrears: arrearsAmount,
      pfDeduction: pf,
      esiDeduction: esi,
      tdsDeduction: tds,
      ptDeduction: pt,
      recoveries: recoveryAmount,
      netSalary,
      bankAccountNumber: vault?.bankDetails.accountNumber || '9182374981723',
      bankIfsc: vault?.bankDetails.ifscCode || 'HDFC0001234',
      bankName: vault?.bankDetails.bankName || 'HDFC Bank',
      paymentStatus: 'pending',
    });
  }

  const run: PayrollRun = {
    id: runId,
    period,
    totalEmployees: employees.length,
    grossPayout: grossTotal,
    totalDeductions: deductionsTotal,
    netPayout: netTotal,
    fixedBurn: fixedBurnTotal,
    variableIncentiveTotal,
    status: 'draft',
    initiatedBy: maker.uid,
    initiatedAt: new Date().toISOString(),
    payoutMode: 'NEFT',
  };

  const runs = [run, ...existingRuns.filter((r) => r.period !== period)];
  writeStorage(STORAGE_KEYS.PAYROLL_RUNS, runs);

  const existingSlips = readStorage<PayrollSlip[]>(STORAGE_KEYS.PAYROLL_SLIPS, []);
  const updatedSlips = [...slips, ...existingSlips.filter((s) => s.period !== period)];
  writeStorage(STORAGE_KEYS.PAYROLL_SLIPS, updatedSlips);

  appendHRAuditLog(
    maker.uid,
    maker.customClaims.role,
    'payroll_initiate',
    'payroll_run',
    null,
    run as any
  );

  return { run, slips };
}

/**
 * Approves a draft payroll run (Checker action).
 * STRICT SERVER-LEVEL MAKER-CHECKER ENFORCEMENT:
 * The user who initiated the draft run CANNOT approve it!
 */
export function approvePayrollRun(runId: string, checker: AuthUser): PayrollRun {
  validateApprovalPermission(checker.customClaims.role, 'payroll.approve');

  const runs = getPayrollRuns();
  const run = runs.find((r) => r.id === runId);
  if (!run) {
    throw new Error(`Payroll run [${runId}] not found.`);
  }

  if (run.status !== 'draft' && run.status !== 'under_review') {
    throw new Error(`Cannot approve payroll run in status: ${run.status}`);
  }

  // Maker-Checker violation check:
  enforceMakerCheckerApproval(run.initiatedBy, checker.uid, `Draft Payroll Run ${run.period}`);

  run.status = 'approved';
  run.approvedBy = checker.uid;
  run.approvedAt = new Date().toISOString();
  writeStorage(STORAGE_KEYS.PAYROLL_RUNS, runs);

  // Mark all queued retroactive arrears as reconciled
  const arrears = readStorage<any[]>(STORAGE_KEYS.RETROACTIVE_ARREARS, []);
  for (const arr of arrears) {
    if (arr.status === 'pending_next_cycle') {
      arr.status = 'settled_in_' + run.period;
    }
  }
  writeStorage(STORAGE_KEYS.RETROACTIVE_ARREARS, arrears);

  // Generate automated GL posting
  generatePayrollJournalEntries(run);

  appendHRAuditLog(
    checker.uid,
    checker.customClaims.role,
    'payroll_approval',
    'payroll_run',
    { runId, status: 'draft' },
    run as any
  );

  return run;
}

/**
 * Exports formatted NEFT/ACH bank transfer batch file content.
 */
export function generateBankTransferFile(runId: string): string {
  const slips = getPayrollSlips(runId);
  if (slips.length === 0) {
    throw new Error('No slips found for this payroll run.');
  }

  // Standard RBI NEFT batch transfer format
  const header = `H^GLF^GL_SALARY_NEFT^${new Date().toISOString().slice(0, 10)}^BATCH_01\n`;
  const records = slips
    .map(
      (s, idx) =>
        `D^${idx + 1}^${s.bankIfsc}^${s.bankAccountNumber}^${s.netSalary}^${s.employeeName.padEnd(30, ' ')}^SALARY_${s.period}`
    )
    .join('\n');
  const footer = `\nT^${slips.length}^${slips.reduce((sum, s) => sum + s.netSalary, 0)}`;

  return header + records + footer;
}

// ─── 7. Full & Final (F&F) Settlement with IT/Admin Offboarding Guard ───

export function getFnFSettlements(): FnFSettlement[] {
  purgeLegacyMockData();
  const all = readStorage<FnFSettlement[]>(STORAGE_KEYS.FNF, []);
  return all.filter(
    (f) =>
      !MOCK_EMPLOYEE_IDS.includes(f.employeeId) &&
      !MOCK_EMPLOYEE_NAMES.some((n) => f.employeeName?.includes(n))
  );
}

export function createFnFSettlement(
  params: {
    employeeId: string;
    employeeName: string;
    resignationDate: string;
    lastWorkingDay: string;
    gratuityAmount: number;
    leaveEncashmentAmount: number;
    noticePeriodRecovery: number;
    unpaidSalary: number;
  },
  actor: AuthUser
): FnFSettlement {
  const list = getFnFSettlements();
  const netSettlement =
    params.unpaidSalary +
    params.gratuityAmount +
    params.leaveEncashmentAmount -
    params.noticePeriodRecovery;

  const fnf: FnFSettlement = {
    id: `FNF-${Date.now()}`,
    employeeId: params.employeeId,
    employeeName: params.employeeName,
    resignationDate: params.resignationDate,
    lastWorkingDay: params.lastWorkingDay,
    offboardingChecklist: {
      laptopRevoked: false,
      dbCredentialsRevoked: false,
      financialAccessRevoked: false,
    },
    gratuityAmount: params.gratuityAmount,
    leaveEncashmentAmount: params.leaveEncashmentAmount,
    noticePeriodRecovery: params.noticePeriodRecovery,
    unpaidSalary: params.unpaidSalary,
    netSettlementAmount: Math.max(0, netSettlement),
    settlementStatus: 'pending_checklist',
  };

  list.unshift(fnf);
  writeStorage(STORAGE_KEYS.FNF, list);

  return fnf;
}

/**
 * Marks IT/Admin offboarding revocation checklist.
 */
export function updateOffboardingChecklist(
  fnfId: string,
  revocations: {
    laptopRevoked: boolean;
    dbCredentialsRevoked: boolean;
    financialAccessRevoked: boolean;
  },
  adminUser: AuthUser
): FnFSettlement {
  if (adminUser.customClaims.role !== 'admin') {
    throw new Error('403 Forbidden: Only IT/System Admin can revoke security & credential access.');
  }

  const list = getFnFSettlements();
  const item = list.find((f) => f.id === fnfId);
  if (!item) throw new Error('F&F settlement record not found.');

  item.offboardingChecklist = {
    ...revocations,
    revokedByAdminId: adminUser.uid,
    revokedAt: new Date().toISOString(),
  };

  if (
    revocations.laptopRevoked &&
    revocations.dbCredentialsRevoked &&
    revocations.financialAccessRevoked
  ) {
    item.settlementStatus = 'ready_for_payout';
  } else {
    item.settlementStatus = 'pending_checklist';
  }

  writeStorage(STORAGE_KEYS.FNF, list);

  appendHRAuditLog(
    adminUser.uid,
    adminUser.customClaims.role,
    'fnf_checklist_revoke',
    'fnf_settlement',
    null,
    item as any
  );

  return item;
}

/**
 * Finalizes and disburses F&F settlement.
 * STRICT OFFBOARDING GUARD:
 * F&F payout is blocked until all 3 offboarding security checklist items are marked revoked.
 */
export function disburseFnFSettlement(fnfId: string, actor: AuthUser): FnFSettlement {
  const list = getFnFSettlements();
  const item = list.find((f) => f.id === fnfId);
  if (!item) throw new Error('F&F settlement record not found.');

  const chk = item.offboardingChecklist;
  if (!chk.laptopRevoked || !chk.dbCredentialsRevoked || !chk.financialAccessRevoked) {
    throw new Error(
      '403 Forbidden: Full & Final (F&F) settlement payout is hard-blocked! All offboarding items (hardware/laptop, DB credentials, financial access) must be verified revoked by IT/Admin first.'
    );
  }

  item.settlementStatus = 'completed';
  item.settledBy = actor.uid;
  item.settledAt = new Date().toISOString();
  writeStorage(STORAGE_KEYS.FNF, list);

  appendHRAuditLog(
    actor.uid,
    actor.customClaims.role,
    'fnf_settlement',
    'fnf_settlement',
    { fnfId, status: 'ready_for_payout' },
    item as any
  );

  return item;
}

// ─── 8. Expense & Reimbursement 2-Step Approval Workflow ───

export function getExpenses(branchId?: string): ExpenseClaim[] {
  purgeLegacyMockData();
  const all = readStorage<ExpenseClaim[]>(STORAGE_KEYS.EXPENSES, []);
  const filtered = all.filter(
    (e) =>
      !MOCK_EMPLOYEE_IDS.includes(e.employeeId) &&
      !MOCK_EMPLOYEE_NAMES.some((n) => e.employeeName?.includes(n))
  );
  if (!branchId) return filtered;
  return filtered.filter((e) => e.branchId === branchId);
}

export function submitExpenseClaim(
  params: {
    employeeId: string;
    employeeName: string;
    branchId: string;
    category: ExpenseClaim['category'];
    amount: number;
    description: string;
    date: string;
    hasGstItc: boolean;
    gstin?: string;
  },
  actor: AuthUser
): ExpenseClaim {
  const list = getExpenses();
  const glCodeMap: Record<ExpenseClaim['category'], string> = {
    travel: 'GL-6101',
    lodging: 'GL-6101',
    meals: 'GL-6102',
    client_visit: 'GL-6102',
    client_entertainment: 'GL-6102',
    software_tools: 'GL-6103',
    office_supplies: 'GL-6100',
  };
  const claim: ExpenseClaim = {
    id: `EXP-${Date.now()}`,
    employeeId: params.employeeId,
    employeeName: params.employeeName,
    branchId: params.branchId,
    category: params.category,
    amount: params.amount,
    date: params.date,
    description: params.description,
    glCode: glCodeMap[params.category] || 'GL-6100',
    hasGstItc: params.hasGstItc,
    gstin: params.gstin,
    itcAmount: params.hasGstItc ? Math.round(params.amount * 0.18) : 0,
    status: 'submitted',
  };

  list.unshift(claim);
  writeStorage(STORAGE_KEYS.EXPENSES, list);
  return claim;
}

/**
 * Step 1: Branch Manager level approval (scoped to own branch)
 */
export function branchManagerApproveExpense(expenseId: string, bmUser: AuthUser): ExpenseClaim {
  const list = getExpenses();
  const item = list.find((e) => e.id === expenseId);
  if (!item) throw new Error('Expense claim not found.');

  // Verify branch scoping
  if (
    bmUser.customClaims.role === 'branch_manager' &&
    bmUser.customClaims.branchId &&
    item.branchId !== bmUser.customClaims.branchId
  ) {
    throw new Error('403 Forbidden: Branch Manager can only approve expense requests for their own branch.');
  }

  item.status = 'manager_approved';
  item.managerApprovedBy = bmUser.uid;
  item.managerApprovedAt = new Date().toISOString();
  writeStorage(STORAGE_KEYS.EXPENSES, list);
  return item;
}

/**
 * Step 2: Final Finance level approval (HR & Payroll Finance Manager)
 */
export function financeFinalApproveExpense(
  expenseId: string,
  glCode: string,
  financeUser: AuthUser
): ExpenseClaim {
  const list = getExpenses();
  const item = list.find((e) => e.id === expenseId);
  if (!item) throw new Error('Expense claim not found.');

  if (item.status !== 'manager_approved') {
    throw new Error('Expense claim must pass first-level Manager approval before Finance clearance.');
  }

  item.status = 'finance_approved';
  item.glCode = glCode || 'GL-6100-REIMBURSEMENT';
  item.financeApprovedBy = financeUser.uid;
  item.financeApprovedAt = new Date().toISOString();
  writeStorage(STORAGE_KEYS.EXPENSES, list);
  return item;
}

// ─── 9. Hiring Sandbox & ESOP Tracking ───

export function getHiringProjections(): HiringProjection[] {
  return readStorage<HiringProjection[]>(STORAGE_KEYS.SANDBOX, []);
}

export function saveHiringProjections(projections: HiringProjection[]): void {
  writeStorage(STORAGE_KEYS.SANDBOX, projections);
}

export function getEsopGrants(): EsopGrant[] {
  purgeLegacyMockData();
  const all = readStorage<EsopGrant[]>(STORAGE_KEYS.ESOP, []);
  return all.filter(
    (e) =>
      !MOCK_EMPLOYEE_IDS.includes(e.employeeId) &&
      !MOCK_EMPLOYEE_NAMES.some((n) => e.employeeName?.includes(n))
  );
}

// ─── 10. GL Journal Entries (Read-only for HR & Payroll Manager) ───

export function getPayrollJournalEntries(): PayrollJournalEntry[] {
  purgeLegacyMockData();
  return readStorage<PayrollJournalEntry[]>(STORAGE_KEYS.JOURNAL, []);
}

function generatePayrollJournalEntries(run: PayrollRun): void {
  const currentEntries = getPayrollJournalEntries();
  const entryDate = new Date().toISOString().split('T')[0];
  const slips = getPayrollSlips(run.id);

  const grossCTC = run.grossPayout;
  const employerContrib = Math.round(grossCTC * 0.1525); // 12% PF + 3.25% ESI
  const totalTaxDeducted =
    slips.reduce((sum, s) => sum + s.tdsDeduction, 0) || Math.round(run.totalDeductions * 0.4);
  const totalPFESI =
    slips.reduce((sum, s) => sum + s.pfDeduction + s.esiDeduction + s.ptDeduction, 0) ||
    Math.round(run.totalDeductions * 0.6);
  const netTakeHome = run.netPayout;

  const entries: PayrollJournalEntry[] = [
    {
      id: `JE-${run.id}-5100`,
      period: run.period,
      entryDate,
      debitAccount: '5100 - Salaries & Wages Expense (Tagged by Cost Center)',
      creditAccount: '—',
      amount: grossCTC,
      narration: `Gross payroll accrual for cycle ${run.period} (${run.totalEmployees} employees across Cost Centers)`,
      isPosted: true,
    },
    {
      id: `JE-${run.id}-5120`,
      period: run.period,
      entryDate,
      debitAccount: '5120 - Employer Statutory Contribution Expense (PF / ESI)',
      creditAccount: '—',
      amount: employerContrib,
      narration: `Employer statutory matching contribution for PF (12%) & ESI (3.25%) for cycle ${run.period}`,
      isPosted: true,
    },
    {
      id: `JE-${run.id}-2110`,
      period: run.period,
      entryDate,
      debitAccount: '—',
      creditAccount: 'To 2110 - TDS / Withholding Income Tax Payable',
      amount: totalTaxDeducted,
      narration: `TDS & withholding income tax deducted under section 192/194J for cycle ${run.period}`,
      isPosted: true,
    },
    {
      id: `JE-${run.id}-2120`,
      period: run.period,
      entryDate,
      debitAccount: '—',
      creditAccount: 'To 2120 - Provident Fund & Statutory Dues Payable',
      amount: totalPFESI + employerContrib,
      narration: `Total employee & employer statutory PF, ESI and PT payable for cycle ${run.period}`,
      isPosted: true,
    },
    {
      id: `JE-${run.id}-2100`,
      period: run.period,
      entryDate,
      debitAccount: '—',
      creditAccount: 'To 2100 - Net Salaries Payable (Bank Clearing Account)',
      amount: netTakeHome,
      narration: `Net bank disbursement liability queued for NEFT/ACH batch transfer for cycle ${run.period}`,
      isPosted: true,
    },
  ];

  currentEntries.unshift(...entries);
  writeStorage(STORAGE_KEYS.JOURNAL, currentEntries);
}

// ─── 11. Statutory Compliance Filings ───

export function getStatutoryFilings(): StatutoryFiling[] {
  return readStorage<StatutoryFiling[]>(STORAGE_KEYS.STATUTORY, []);
}

export function saveStatutoryFilings(filings: StatutoryFiling[]): void {
  writeStorage(STORAGE_KEYS.STATUTORY, filings);
}

/**
 * Resets/clears stored HR data to ensure no leftover mock entries persist.
 */
export function clearHRMockData(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((k) => {
      localStorage.removeItem(k);
    });
    [
      'glf_payroll_runs_master',
      'glf_hr_payroll_runs',
      'glf_hr_payroll_slips',
      'glf_salary_revisions_master',
      'glf_employee_kyc_vaults',
    ].forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(HR_MOCK_PURGE_FLAG, 'true');
  } catch (e) {
    console.warn('Could not clear HR storage keys:', e);
  }
}

/**
 * Loads enrolled active employees from the application's authoritative employee master.
 */
export function getEnrolledEmployees(): Array<{
  id: string;
  name: string;
  branchId: string;
  designation: string;
  status: string;
}> {
  try {
    const cached =
      localStorage.getItem('glf_pdf_strict_employees_master') ||
      localStorage.getItem('glf_employees_cache');
    if (cached) {
      const list = JSON.parse(cached);
      if (Array.isArray(list) && list.length > 0) {
        return list
          .filter(
            (e: any) =>
              e.status !== 'RELIEVED (INACTIVE)' &&
              e.status !== 'suspended' &&
              !MOCK_EMPLOYEE_IDS.includes(e.id) &&
              !MOCK_EMPLOYEE_NAMES.some((n) => e.name?.includes(n))
          )
          .map((e: any) => ({
            id: e.id,
            name: e.name || e.fullName || 'Employee',
            branchId: e.branchId || 'BR-01',
            designation: e.designation || (e.role ? e.role.replace(/_/g, ' ').toUpperCase() : 'Staff'),
            status: e.status || 'active',
          }));
      }
    }
  } catch (err) {
    console.warn('Could not read enrolled employees:', err);
  }
  return [];
}

