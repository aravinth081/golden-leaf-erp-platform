// ──────────────────────────────────────────────────
// GOLDEN LEAF FINANCE — REPORTS DATA SERVICE
// Single source of truth for the 10 PDF-Strict Reports:
// 1. Customer Report
// 2. Collection Report
// 3. Daily Report
// 4. Monthly Report
// 5. Pending Report
// 6. Outstanding Report
// 7. Loan Report
// 8. Employee Report
// 9. Attendance Report
// 10. Branch Report
// Strictly respects selectedBranchId (Branch Context Isolation).
// ──────────────────────────────────────────────────

import { getStoredBranches, type DetailedBranch } from './branchService';
import { businessLoanService } from './businessLoanService';
import { goldLoanService } from './goldLoanService';
import {
  getMonitoredCustomers,
  getMonitoredLoans,
  getMonitoredCollections,
  getMonitoredAttendance,
  type MonitoredCustomer,
  type MonitoredLoan,
  type MonitoredCollection,
  type MonitoredAttendance,
} from './monitoringDataService';

// ── 1. Customer Report Row ──
export interface CustomerReportRow {
  id: string;
  name: string;
  groupName: string;
  phone: string;
  branchName: string;
  status: string;
}

export function getCustomerReport(branchId?: string | null): CustomerReportRow[] {
  const customers = getMonitoredCustomers(branchId);
  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    groupName: c.groupName,
    phone: c.phone,
    branchName: c.branchName,
    status: c.status,
  }));
}

// ── 2. Collection Report Row ──
export interface CollectionReportRow {
  id: string;
  date: string;
  customerName: string;
  loanId: string;
  amount: number;
  status: string;
  branchName: string;
  receiptNumber: string;
}

export function getCollectionReport(branchId?: string | null): CollectionReportRow[] {
  const collections = getMonitoredCollections(branchId, 'all');
  return collections.map((col) => ({
    id: col.id,
    date: col.date,
    customerName: col.customerName,
    loanId: col.loanId,
    amount: col.collectedAmount,
    status: col.status,
    branchName: col.branchName,
    receiptNumber: col.receiptNumber,
  }));
}

// ── 3. Daily Report Row ──
export interface DailyReportRow {
  id: string;
  type: 'Collection' | 'Loan Disbursement' | 'Attendance Punch';
  reference: string;
  party: string;
  amount?: number;
  time: string;
  branchName: string;
  status: string;
}

export function getDailyReport(dateStr: string = 'Today', branchId?: string | null): DailyReportRow[] {
  const collections = getMonitoredCollections(branchId, 'today');
  const attendance = getMonitoredAttendance(branchId);

  const rows: DailyReportRow[] = [];

  collections.forEach((c) => {
    rows.push({
      id: c.id,
      type: 'Collection',
      reference: c.receiptNumber || c.id,
      party: c.customerName,
      amount: c.collectedAmount,
      time: c.time,
      branchName: c.branchName,
      status: c.status,
    });
  });

  attendance.forEach((a) => {
    rows.push({
      id: `ATT-${a.employeeId}`,
      type: 'Attendance Punch',
      reference: a.employeeId,
      party: a.employeeName,
      time: a.loginTime,
      branchName: a.branchName,
      status: a.status,
    });
  });

  return rows;
}

// ── 4. Monthly Report Row ──
export interface MonthlyReportRow {
  branchId: string;
  branchName: string;
  activeBorrowers: number;
  loansDisbursedCount: number;
  totalDisbursedAmount: number;
  totalCollectedAmount: number;
  outstandingBalance: number;
}

export function getMonthlyReport(branchId?: string | null): MonthlyReportRow[] {
  const branches = getStoredBranches();
  const targetBranches = branchId
    ? branches.filter((b) => b.id === branchId || b.name === branchId)
    : branches;

  return targetBranches.map((b) => {
    const custs = getMonitoredCustomers(b.id);
    const loans = getMonitoredLoans(b.id);
    const collections = getMonitoredCollections(b.id, 'all');

    const totalDisbursed = loans.reduce((s, l) => s + l.principalAmount, 0);
    const totalCollected = collections.reduce((s, c) => s + c.collectedAmount, 0);
    const totalOutstanding = loans.reduce((s, l) => s + l.outstandingAmount, 0);

    return {
      branchId: b.id,
      branchName: b.name,
      activeBorrowers: custs.filter((c) => c.status === 'Active').length,
      loansDisbursedCount: loans.length,
      totalDisbursedAmount: totalDisbursed,
      totalCollectedAmount: totalCollected,
      outstandingBalance: totalOutstanding,
    };
  });
}

// ── 5. Pending Report Row (NC Collections) ──
export interface PendingReportRow {
  id: string;
  customerName: string;
  loanId: string;
  dueAmount: number;
  pendingAmount: number;
  agentName: string;
  ncReasonCode: string;
  branchName: string;
}

export function getPendingReport(branchId?: string | null): PendingReportRow[] {
  const collections = getMonitoredCollections(branchId, 'pending_nc');
  return collections.map((col) => ({
    id: col.id,
    customerName: col.customerName,
    loanId: col.loanId,
    dueAmount: col.expectedAmount,
    pendingAmount: col.pendingAmount,
    agentName: col.agentName,
    ncReasonCode: col.ncReasonCode || 'Pending Collection',
    branchName: col.branchName,
  }));
}

// ── 6. Outstanding Report Row ──
export interface OutstandingReportRow {
  loanId: string;
  customerName: string;
  planName: string;
  sanctionedAmount: number;
  repaidAmount: number;
  outstandingAmount: number;
  branchName: string;
  status: string;
}

export function getOutstandingReport(branchId?: string | null): OutstandingReportRow[] {
  const loans = getMonitoredLoans(branchId);
  return loans
    .filter((l) => l.outstandingAmount > 0)
    .map((l) => ({
      loanId: l.id,
      customerName: l.customerName,
      planName: l.planName,
      sanctionedAmount: l.principalAmount,
      repaidAmount: l.paidAmount,
      outstandingAmount: l.outstandingAmount,
      branchName: l.branchName,
      status: l.status,
    }));
}

// ── 7. Loan Report Row ──
export interface LoanReportRow {
  id: string;
  customerName: string;
  planName: string;
  principalAmount: number;
  outstandingAmount: number;
  status: string;
  branchName: string;
}

export function getLoanReport(branchId?: string | null): LoanReportRow[] {
  const groupLoans = getMonitoredLoans(branchId).map((l) => ({
    id: l.id,
    customerName: l.customerName,
    planName: `Group: ${l.planName}`,
    principalAmount: l.principalAmount,
    outstandingAmount: l.outstandingAmount,
    status: l.status,
    branchName: l.branchName,
  }));

  const allBizLoans = businessLoanService.getLoans();
  const bizFiltered = branchId
    ? allBizLoans.filter((b) => b.branchId === branchId || b.branchName.toLowerCase().includes(branchId.toLowerCase()))
    : allBizLoans;

  const bizLoans: LoanReportRow[] = bizFiltered.map((b) => ({
    id: b.id,
    customerName: b.customerName,
    planName: `Business: ${b.businessName}`,
    principalAmount: b.sanctionedAmount,
    outstandingAmount: b.pendingOutstandingBalance,
    status: b.status.replace(/_/g, ' '),
    branchName: b.branchName,
  }));

  const allGoldLoans = goldLoanService.getLoans();
  const goldFiltered = branchId
    ? allGoldLoans.filter((g) => g.branchId === branchId || g.branchName.toLowerCase().includes(branchId.toLowerCase()))
    : allGoldLoans;

  const goldLoans: LoanReportRow[] = goldFiltered.map((g) => ({
    id: g.id,
    customerName: g.customerName,
    planName: `Gold: ${g.totalNetWeightGrams.toFixed(1)}g Net (${g.tamperProofPacketSerialNo})`,
    principalAmount: g.sanctionedLoanAmount,
    outstandingAmount: g.status === 'REDEEMED_PACKET_RELEASED' ? 0 : g.sanctionedLoanAmount,
    status: g.status.replace(/_/g, ' '),
    branchName: g.branchName,
  }));

  return [...groupLoans, ...bizLoans, ...goldLoans];
}

// ── 7B. Branch Loan Portfolio Breakdown (Group, Gold, Business Loans) ──
export interface BranchLoanPortfolioSummary {
  groupLoans: { count: number; totalDisbursed: number; totalOutstanding: number; totalPending: number };
  goldLoans: { count: number; totalDisbursed: number; totalOutstanding: number; totalPending: number };
  businessLoans: { count: number; totalDisbursed: number; totalOutstanding: number; totalPending: number };
  totalPortfolio: { totalLoanCount: number; totalDisbursed: number; totalOutstanding: number; totalPending: number };
}

export function getBranchLoanPortfolioSummary(branchId?: string | null): BranchLoanPortfolioSummary {
  // 1. Group Loans
  const groupList = getMonitoredLoans(branchId);
  const groupCount = groupList.length;
  const groupDisbursed = groupList.reduce((acc, l) => acc + (l.principalAmount || 0), 0);
  const groupOutstanding = groupList.reduce((acc, l) => acc + (l.outstandingAmount || 0), 0);
  const groupPending = groupList.filter((l) => l.status === 'Pending Approval').length;

  // 2. Business Loans
  const bizAll = businessLoanService.getLoans();
  const bizList = branchId
    ? bizAll.filter((b) => b.branchId === branchId || b.branchName.toLowerCase().includes(branchId.toLowerCase()))
    : bizAll;
  const bizCount = bizList.length;
  const bizDisbursed = bizList.reduce((acc, b) => acc + (b.sanctionedAmount || 0), 0);
  const bizOutstanding = bizList.reduce((acc, b) => acc + (b.pendingOutstandingBalance || 0), 0);
  const bizPending = bizList.filter((b) => b.status === 'SUBMITTED_BY_CRO' || b.status === 'BRANCH_VERIFIED').length;

  // 3. Gold Loans
  const goldAll = goldLoanService.getLoans();
  const goldList = branchId
    ? goldAll.filter((g) => g.branchId === branchId || g.branchName.toLowerCase().includes(branchId.toLowerCase()))
    : goldAll;
  const goldCount = goldList.length;
  const goldDisbursed = goldList.reduce((acc, g) => acc + (g.sanctionedLoanAmount || 0), 0);
  const goldOutstanding = goldList.reduce((acc, g) => acc + (g.status === 'REDEEMED_PACKET_RELEASED' ? 0 : g.sanctionedLoanAmount), 0);
  const goldPending = goldList.filter((g) => g.status === 'APPRAISED_AWAITING_VAULT' || g.status === 'VAULT_LOCKED_PENDING_UTR').length;

  return {
    groupLoans: { count: groupCount, totalDisbursed: groupDisbursed, totalOutstanding: groupOutstanding, totalPending: groupPending },
    goldLoans: { count: goldCount, totalDisbursed: goldDisbursed, totalOutstanding: goldOutstanding, totalPending: goldPending },
    businessLoans: { count: bizCount, totalDisbursed: bizDisbursed, totalOutstanding: bizOutstanding, totalPending: bizPending },
    totalPortfolio: {
      totalLoanCount: groupCount + goldCount + bizCount,
      totalDisbursed: groupDisbursed + goldDisbursed + bizDisbursed,
      totalOutstanding: groupOutstanding + goldOutstanding + bizOutstanding,
      totalPending: groupPending + goldPending + bizPending,
    },
  };
}

// ── 8. Employee Report Row ──
export interface EmployeeReportRow {
  id: string;
  name: string;
  role: string;
  branchName: string;
  status: string;
}

export function getEmployeeReport(branchId?: string | null): EmployeeReportRow[] {
  const employeesMasterStr = localStorage.getItem('glf_pdf_strict_employees_master');
  let employees: any[] = [];
  if (employeesMasterStr) {
    try {
      employees = JSON.parse(employeesMasterStr);
    } catch (e) {
      console.warn('Failed to parse employee master', e);
    }
  }

  // If no employees enrolled yet, return empty list
  if (employees.length === 0) {
    return [];
  }

  const branches = getStoredBranches();
  const resolveBranch = (bId: string) => {
    const found = branches.find((b) => b.id === bId || b.name === bId);
    return found ? found.name : bId;
  };

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    branch_manager: 'Branch Manager',
    credit_manager: 'Credit Manager',
    collection_agent: 'Customer Relationship Officer (CRO)',
  };

  let filtered = employees;
  if (branchId) {
    filtered = employees.filter((e) => e.branchId === branchId || resolveBranch(e.branchId) === branchId);
  }

  return filtered.map((e) => ({
    id: e.id,
    name: e.name,
    role: roleLabels[e.role] || e.role,
    branchName: resolveBranch(e.branchId),
    status: e.status,
  }));
}

// ── 9. Attendance Report Row ──
export interface AttendanceReportRow {
  id: string;
  employeeName: string;
  branchName: string;
  date: string;
  loginTime: string;
  logoutTime: string;
  status: string;
  gpsLocation: string;
  selfieVerified: boolean;
}

export function getAttendanceReport(branchId?: string | null): AttendanceReportRow[] {
  const attendance = getMonitoredAttendance(branchId);
  return attendance.map((a) => ({
    id: a.id,
    employeeName: a.employeeName,
    branchName: a.branchName,
    date: a.date,
    loginTime: a.loginTime,
    logoutTime: a.logoutTime,
    status: a.status,
    gpsLocation: a.gpsLocation,
    selfieVerified: a.selfieVerified,
  }));
}

// ── 10. Branch Report Row ──
export interface BranchReportRow {
  code: string;
  name: string;
  city: string;
  manager: string;
  totalEmployees: number;
  status: string;
}

export function getBranchReport(branchId?: string | null): BranchReportRow[] {
  const branches = getStoredBranches();
  let list = branches;
  if (branchId) {
    list = branches.filter((b) => b.id === branchId || b.name === branchId);
  }

  // Dynamically resolve actual staff counts & assigned Branch Manager from staff profiles
  let staffProfiles: any[] = [];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('glf_staff_profiles_master');
      if (stored) {
        staffProfiles = JSON.parse(stored).filter((p: any) => !p.deletedAt);
      }
    }
  } catch (e) {
    console.warn('Error reading staff profiles', e);
  }

  return list.map((b) => {
    const branchStaff = staffProfiles.filter(
      (p: any) => p.branchId === b.id || p.branchName === b.name || p.branchId === b.code
    );
    const branchManager = branchStaff.find((p: any) => p.role === 'branch_manager');
    const totalStaff = branchStaff.length > 0 ? branchStaff.length : (b.totalEmployees || 0);
    const managerName = branchManager
      ? branchManager.fullName
      : (b.manager && b.manager !== 'Unassigned' ? b.manager : 'Unassigned');

    return {
      code: b.code,
      name: b.name,
      city: b.city,
      manager: managerName,
      totalEmployees: totalStaff,
      status: b.status,
    };
  });
}
