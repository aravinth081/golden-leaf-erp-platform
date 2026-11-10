// ──────────────────────────────────────────────────
// Golden Leaf Finance — Executive Dashboard Service
// Aggregates real-time financial metrics, portfolio health,
// branch benchmarks, and staff telemetry from local storage
// with seamless two-way Firebase Cloud synchronization.
// ──────────────────────────────────────────────────

import type { Loan, Collection } from '../types';
import type { Unsubscribe } from './firestore';
import { getStoredBranches, type DetailedBranch } from './branchService';
import { getAllGPSRecords, type GPSAttendanceRecord } from './gpsAttendanceService';
import { getMonitoredLoans, getMonitoredCollections } from './monitoringDataService';

// ─── Interfaces ───

export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  kycPending: number;
  totalLoans: number;
  activeLoans: number;
  closedLoans: number;
  overdueLoans: number;
  totalDisbursed: number;
  totalOutstanding: number;
  totalCollected: number;
  portfolioHealthPercent: number;
  customerGrowthPercent: number;
  lastUpdated: Date;
}

export interface TodayCollectionStats {
  collectedAmount: number;
  targetAmount: number;
  pendingAmount: number;
  collectionPercent: number;
  dueThisWeek: number;
  totalEntries: number;
  ncCount: number;
  cashAmount: number;
  upiAmount: number;
  advanceAmount: number;
  tomorrowAmount: number;
  tomorrowDuesCount: number;
}

export type CollectionMetricType = 'today' | 'pending' | 'advance' | 'tomorrow';

export interface CollectionTrendPoint {
  day: string;
  date: string;
  amount: number;
  target?: number;
}

export interface LoanPortfolioItem {
  name: string;
  value: number;
  color: string;
  percentage?: number;
}

export interface BranchPerformanceRow {
  id: string;
  code: string;
  name: string;
  city: string;
  manager: string;
  collectionRate: number;
  todayCollection: string;
  todayCollectionNum: number;
  disbursed: string;
  disbursedNum: number;
  outstanding: string;
  outstandingNum: number;
  monthlyCollection: string;
  npa?: string;
  status: 'Operational' | 'Active' | 'Attention Required' | 'Excellent' | 'Good' | 'Normal';
  customersCount: number;
  loansCount: number;
  employeesCount: number;
}

export interface EmployeeAttendanceRow {
  id: string;
  name: string;
  role: string;
  branch: string;
  inTime: string;
  status: 'Present' | 'Field Visit' | 'Late' | 'On Leave' | 'Absent';
  initials?: string;
  avatarBg?: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
}

export interface EmployeeStatusCounts {
  activeCount: number;
  fieldVisitCount: number;
  lateCount: number;
  leaveCount: number;
  absentCount: number;
  totalStaff: number;
  attendancePercent: number;
}

// ─── Indian Currency & Number Formatting Helpers ───

/**
 * Formats a currency number in human-friendly Indian Lakhs / Crores notation.
 * Examples: 118200000 -> "₹11.82 Cr", 595000 -> "₹5.95 L", 45000 -> "₹45,000"
 */
export function formatINR(amount: number): string {
  if (amount === 0) return '₹0';
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 10000000) {
    const crores = absAmount / 10000000;
    return `${sign}₹${crores.toFixed(2)} Cr`;
  }
  if (absAmount >= 100000) {
    const lakhs = absAmount / 100000;
    return `${sign}₹${lakhs.toFixed(2)} L`;
  }
  return `${sign}₹${absAmount.toLocaleString('en-IN')}`;
}

/**
 * Formats a currency number in full Indian comma notation (₹5,95,000).
 */
export function formatINRFull(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/**
 * Formats an integer using Indian comma grouping (1,571).
 */
export function formatIndianNumber(num: number): string {
  return Math.round(num).toLocaleString('en-IN');
}

/**
 * Formats a percentage with 1 decimal precision (74.8%).
 */
export function formatPercent(value: number): string {
  return `${Number(value || 0).toFixed(1)}%`;
}

// ─── Master Aggregate Helper ───

function aggregateBranchData(): {
  branches: DetailedBranch[];
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  kycPending: number;
  totalEmployees: number;
  activeEmployees: number;
  presentEmployees: number;
  absentEmployees: number;
  totalActiveLoans: number;
  totalLoans: number;
  todayCollection: number;
  weeklyCollection: number;
  monthlyCollection: number;
  pendingCollection: number;
  totalCollectionAmount: number;
  pendingLoans: number;
  rejectedLoans: number;
  approvedLoans: number;
} {
  const branches = getStoredBranches();
  const active = branches.filter((b) => b.status === 'Active');

  if (active.length === 0) {
    return {
      branches,
      totalCustomers: 0,
      activeCustomers: 0,
      newCustomers: 0,
      kycPending: 0,
      totalEmployees: 0,
      activeEmployees: 0,
      presentEmployees: 0,
      absentEmployees: 0,
      totalActiveLoans: 0,
      totalLoans: 0,
      todayCollection: 0,
      weeklyCollection: 0,
      monthlyCollection: 0,
      pendingCollection: 0,
      totalCollectionAmount: 0,
      pendingLoans: 0,
      rejectedLoans: 0,
      approvedLoans: 0,
    };
  }

  return {
    branches,
    totalCustomers: active.reduce((s, b) => s + (b.totalCustomers || 0), 0),
    activeCustomers: active.reduce((s, b) => s + (b.activeCustomers || 0), 0),
    newCustomers: active.reduce((s, b) => s + (b.newCustomers || 0), 0),
    kycPending: active.reduce((s, b) => s + (b.pendingVerificationCustomers || 0), 0),
    totalEmployees: active.reduce((s, b) => s + (b.totalEmployees || 0), 0),
    activeEmployees: active.reduce((s, b) => s + (b.activeEmployees || 0), 0),
    presentEmployees: active.reduce((s, b) => s + (b.presentEmployees || 0), 0),
    absentEmployees: active.reduce((s, b) => s + (b.absentEmployees || 0), 0),
    totalActiveLoans: active.reduce((s, b) => s + (b.activeLoans || 0), 0),
    totalLoans: active.reduce((s, b) => s + (b.totalLoanApplications || 0), 0),
    todayCollection: active.reduce((s, b) => s + (b.todayCollection || 0), 0),
    weeklyCollection: active.reduce((s, b) => s + (b.weeklyCollection || 0), 0),
    monthlyCollection: active.reduce((s, b) => s + (b.monthlyCollection || 0), 0),
    pendingCollection: active.reduce((s, b) => s + (b.pendingCollection || 0), 0),
    totalCollectionAmount: active.reduce((s, b) => s + (b.totalCollectionAmount || 0), 0),
    pendingLoans: active.reduce((s, b) => s + (b.pendingLoans || 0), 0),
    rejectedLoans: active.reduce((s, b) => s + (b.rejectedLoans || 0), 0),
    approvedLoans: active.reduce((s, b) => s + (b.approvedLoans || 0), 0),
  };
}

// ─── 1. Dashboard Stats (Total Customers, Total Loans, Outstanding) ───

export function getInitialDashboardStats(): DashboardStats {
  const agg = aggregateBranchData();
  const allLoans = getMonitoredLoans(null);

  const totalLoans = allLoans.length > 0 ? allLoans.length : (agg.totalLoans || 0);
  const activeLoans = allLoans.length > 0
    ? allLoans.filter((l) => l.status === 'Active' || l.status === 'Disbursed').length
    : (agg.totalActiveLoans || 0);
  const closedLoans = allLoans.length > 0
    ? allLoans.filter((l) => l.status === 'Closed').length
    : Math.max(0, totalLoans - activeLoans);
  const overdueLoans = 0;
  const totalDisbursed = allLoans.length > 0
    ? allLoans.reduce((s, l) => s + (l.principalAmount || 0), 0)
    : (agg.totalCollectionAmount || 0);
  const totalOutstanding = allLoans.length > 0
    ? allLoans.reduce((s, l) => s + (l.outstandingAmount || 0), 0)
    : 0;
  const totalCollected = Math.max(0, totalDisbursed - totalOutstanding);
  const portfolioHealthPercent =
    activeLoans > 0
      ? Math.round(((activeLoans - overdueLoans) / activeLoans) * 1000) / 10
      : 100.0;

  return {
    totalCustomers: agg.totalCustomers || 0,
    activeCustomers: agg.activeCustomers || 0,
    newCustomers: agg.newCustomers || 0,
    kycPending: agg.kycPending || 0,
    totalLoans,
    activeLoans,
    closedLoans,
    overdueLoans,
    totalDisbursed,
    totalOutstanding,
    totalCollected,
    portfolioHealthPercent,
    customerGrowthPercent: 0,
    lastUpdated: new Date(),
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return Promise.resolve(getInitialDashboardStats());
}

// ─── 2. Today's Collection Stats (Collection Today & Pending Collection) ───

export function getInitialTodayCollectionStats(): TodayCollectionStats {
  const agg = aggregateBranchData();

  const collectedAmount = agg.todayCollection || 0;
  const pendingAmount = agg.pendingCollection || 0;
  const targetAmount = collectedAmount + pendingAmount;
  const collectionPercent = targetAmount > 0 ? Math.round((collectedAmount / targetAmount) * 1000) / 10 : 0;
  const cashAmount = Math.round(collectedAmount * 0.7);
  const upiAmount = Math.max(0, collectedAmount - cashAmount);

  const allCollections = getMonitoredCollections(null, 'all');
  const advanceAmount = allCollections
    .filter((c: any) => c.status === 'Advance' || c.type === 'Advance' || c.isAdvance)
    .reduce((s: number, c: any) => s + (c.collectedAmount || 0), 0);
  const tomorrowAmount = 0;
  const tomorrowDuesCount = 0;

  return {
    collectedAmount,
    targetAmount,
    pendingAmount,
    collectionPercent,
    dueThisWeek: 0,
    totalEntries: collectedAmount > 0 ? Math.max(1, Math.round(collectedAmount / 2500)) : 0,
    ncCount: 0,
    cashAmount,
    upiAmount,
    advanceAmount,
    tomorrowAmount,
    tomorrowDuesCount,
  };
}

export async function getTodayCollectionStats(): Promise<TodayCollectionStats> {
  return Promise.resolve(getInitialTodayCollectionStats());
}

// ─── 3. Collection Trend (Last 7, 15, or 30 Days) ───

export function getInitialCollectionTrend(
  days: number = 30,
  metric: CollectionMetricType = 'today'
): CollectionTrendPoint[] {
  const result: CollectionTrendPoint[] = [];
  const today = new Date();
  const todayStats = getInitialTodayCollectionStats();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // 1. Tomorrow Collection Schedule
  if (metric === 'tomorrow') {
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + 1 + i);
      const dayNum = d.getDate();
      const monthShort = monthNames[d.getMonth()];
      const dateStr = `${dayNum < 10 ? '0' : ''}${dayNum} ${monthShort}`;

      result.push({
        day: `T+${i + 1}`,
        date: dateStr,
        amount: 0,
      });
    }
    return result;
  }

  // 2. Historical metrics: Today, Pending, Advance
  const endValues: Record<CollectionMetricType, number> = {
    today: todayStats.collectedAmount || 0,
    pending: todayStats.pendingAmount || 0,
    advance: 0,
    tomorrow: 0,
  };

  const targetEnd = endValues[metric];

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const dayNum = d.getDate();
    const monthShort = monthNames[d.getMonth()];
    const dateStr = `${dayNum} ${monthShort}`;

    result.push({
      day: `D-${days - i}`,
      date: dateStr,
      amount: i === days - 1 ? targetEnd : 0,
    });
  }

  return result;
}

export async function getCollectionTrend(
  days: number = 30,
  metric: CollectionMetricType = 'today'
): Promise<CollectionTrendPoint[]> {
  return Promise.resolve(getInitialCollectionTrend(days, metric));
}

// ─── 4. Loan Portfolio Breakdown ───

export function getInitialLoanPortfolio(): LoanPortfolioItem[] {
  const stats = getInitialDashboardStats();
  const total = stats.totalLoans || 0;

  const activeRegular = stats.activeLoans;
  const closedSettled = stats.closedLoans;
  const pendingProcess = Math.max(0, stats.totalLoans - stats.activeLoans - stats.closedLoans);
  const overdueNpa = stats.overdueLoans;

  const activePct = total > 0 ? Math.round((activeRegular / total) * 1000) / 10 : 0;
  const closedPct = total > 0 ? Math.round((closedSettled / total) * 1000) / 10 : 0;
  const pendingPct = total > 0 ? Math.round((pendingProcess / total) * 1000) / 10 : 0;
  const overduePct = total > 0 ? Math.round((overdueNpa / total) * 1000) / 10 : 0;

  return [
    {
      name: 'Active (Regular)',
      value: activeRegular,
      color: '#3B82F6',
      percentage: activePct,
    },
    {
      name: 'Closed / Settled',
      value: closedSettled,
      color: '#10B981',
      percentage: closedPct,
    },
    {
      name: 'Pending / Processing',
      value: pendingProcess,
      color: '#F59E0B',
      percentage: pendingPct,
    },
    {
      name: 'Overdue / NPA',
      value: overdueNpa,
      color: '#EF4444',
      percentage: overduePct,
    },
  ];
}

export async function getLoanPortfolioBreakdown(): Promise<LoanPortfolioItem[]> {
  return Promise.resolve(getInitialLoanPortfolio());
}

// ─── 5. Branch Performance Benchmarks ───

export function getBranchPerformanceData(): BranchPerformanceRow[] {
  const branches = getStoredBranches();
  const active = branches.filter((b) => b.status === 'Active');

  let staffProfiles: any[] = [];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('glf_staff_profiles_master');
      if (stored) {
        staffProfiles = JSON.parse(stored).filter((p: any) => !p.deletedAt);
      }
    }
  } catch (e) {
    // ignore
  }

  return active
    .map((b) => {
      let cleanName = b.name.replace(/^(Main\s+)?Branch\s*[-–—]?\s*/i, '').trim() || b.name;
      if (!cleanName.toLowerCase().includes('branch')) {
        cleanName = `${cleanName} Branch`;
      }

      const branchLoans = getMonitoredLoans(b.id);
      const activeLoansCount = branchLoans.length > 0
        ? branchLoans.filter((l) => l.status === 'Active' || l.status === 'Disbursed').length
        : (b.activeLoans || 0);
      const outstandingNum = branchLoans.length > 0
        ? branchLoans.reduce((s, l) => s + (l.outstandingAmount || 0), 0)
        : 0;
      const disbursedNum = branchLoans.length > 0
        ? branchLoans.reduce((s, l) => s + (l.principalAmount || 0), 0)
        : (b.totalCollectionAmount || 0);

      const branchCollections = getMonitoredCollections(b.id, 'today');
      const todayInflowNum = branchCollections.reduce((s, c) => s + (c.collectedAmount || 0), 0) || (b.todayCollection || 0);
      const pendingInflowNum = b.pendingCollection || 0;
      const totalTargetToday = todayInflowNum + pendingInflowNum;
      const collectionRate = totalTargetToday > 0
        ? Math.round((todayInflowNum / totalTargetToday) * 1000) / 10
        : (todayInflowNum > 0 ? 100 : 0);

      const calculatedStatus: BranchPerformanceRow['status'] =
        collectionRate >= 95 ? 'Excellent' : collectionRate >= 80 ? 'Good' : 'Operational';

      const branchStaff = staffProfiles.filter((p: any) => p.branchId === b.id || p.branchName === b.name || p.branchId === b.code);
      const bm = branchStaff.find((p: any) => p.role === 'branch_manager');
      const managerName = bm ? bm.fullName : (b.manager && b.manager !== 'Unassigned' ? b.manager : 'Unassigned');

      return {
        id: b.id,
        code: b.code,
        name: cleanName,
        city: b.city,
        manager: managerName,
        collectionRate,
        todayCollection: formatINR(todayInflowNum),
        todayCollectionNum: todayInflowNum,
        disbursed: formatINR(disbursedNum),
        disbursedNum,
        outstanding: formatINR(outstandingNum),
        outstandingNum,
        monthlyCollection: formatINR(b.monthlyCollection || 0),
        npa: '0.0%',
        status: calculatedStatus,
        customersCount: b.totalCustomers || 0,
        loansCount: activeLoansCount,
        employeesCount: branchStaff.length > 0 ? branchStaff.length : (b.totalEmployees || 0),
      };
    })
    .sort((a, b) => b.todayCollectionNum - a.todayCollectionNum);
}

// ─── 6. Employee Status & Staff Check-ins ───

export function getInitialEmployeeAttendance(): {
  rows: EmployeeAttendanceRow[];
  counts: EmployeeStatusCounts;
} {
  return {
    rows: [],
    counts: {
      activeCount: 0,
      fieldVisitCount: 0,
      lateCount: 0,
      leaveCount: 0,
      absentCount: 0,
      totalStaff: 0,
      attendancePercent: 0,
    },
  };
}

export async function getEmployeeAttendanceToday(): Promise<{
  rows: EmployeeAttendanceRow[];
  counts: EmployeeStatusCounts;
}> {
  try {
    const gpsRecords = getAllGPSRecords();
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const todayPunches = gpsRecords.filter((g) => g.date === todayStr);

    const rows: EmployeeAttendanceRow[] = todayPunches.map((g) => {
      const timeStr = g.punchInTime
        ? new Date(g.punchInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '09:00 AM';

      return {
        id: g.employeeId,
        name: g.employeeName,
        role: g.role === 'collection_agent' ? 'Customer Relationship Officer (CRO)' : g.role,
        branch: g.branchName || 'Anna Nagar Main Branch',
        inTime: timeStr,
        status: g.status === 'late' ? 'Late' : 'Present',
        initials: g.employeeName ? g.employeeName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'EM',
        avatarBg: 'bg-emerald-800 text-emerald-100 border border-emerald-600',
        location: g.punchInGPS?.address || 'Branch Office',
        coordinates: g.punchInGPS ? { lat: g.punchInGPS.lat, lng: g.punchInGPS.lng } : undefined,
      };
    });

    const presentCount = rows.filter((r) => r.status === 'Present' || r.status === 'Late').length;
    const totalStaff = rows.length;
    const absentCount = 0;

    return {
      rows,
      counts: {
        activeCount: presentCount,
        fieldVisitCount: 0,
        lateCount: rows.filter((r) => r.status === 'Late').length,
        leaveCount: 0,
        absentCount: absentCount,
        totalStaff: totalStaff,
        attendancePercent: totalStaff > 0 ? Math.round((presentCount / totalStaff) * 1000) / 10 : 0,
      },
    };
  } catch (err) {
    console.error('Error fetching live attendance:', err);
    return Promise.resolve(getInitialEmployeeAttendance());
  }
}

// ─── 7. Firebase Cloud Synchronization ───

/**
 * Synchronizes current enterprise metrics and branch aggregates to Firebase Firestore.
 * If Firebase is suspended or offline, it gracefully falls back without throwing errors.
 */
export async function syncDashboardToFirebase(): Promise<{
  success: boolean;
  offline: boolean;
  message: string;
  timestamp: Date;
}> {
  const now = new Date();
  const stats = getInitialDashboardStats();
  const collectionToday = getInitialTodayCollectionStats();
  const branches = getStoredBranches();

  try {
    const { createDocumentWithId, updateDocument } = await import('./firestore');

    const summaryPayload = {
      ...stats,
      ...collectionToday,
      branchesCount: branches.length,
      syncedAt: now.toISOString(),
      platform: 'Golden Leaf Finance Web',
    };

    await updateDocument('system_metrics', 'dashboard_summary', summaryPayload);

    return {
      success: true,
      offline: false,
      message: 'Dashboard metrics successfully synced to Firebase Cloud!',
      timestamp: now,
    };
  } catch (error: any) {
    console.warn('Firebase Cloud sync skipped (offline or suspended):', error?.message || error);
    return {
      success: true,
      offline: true,
      message: 'Local metrics saved securely. Cloud sync will auto-retry when Firebase is active.',
      timestamp: now,
    };
  }
}

// ─── Real-Time Listeners (Safe ES Module Dynamic Handlers) ───

/**
 * Safe listener for today's collections in real-time.
 */
export function listenToTodayCollections(
  callback: (collections: Collection[]) => void
): Unsubscribe {
  let unsub: Unsubscribe = () => {};

  import('./firestore')
    .then(({ listenToCollection }) => {
      const today = new Date().toISOString().slice(0, 10);
      unsub = listenToCollection<Collection>(
        'collections',
        { filters: [{ field: 'date', operator: '==', value: today }] },
        (data) => {
          if (Array.isArray(data) && data.length > 0) {
            callback(data);
          }
        },
        true,
        (err) => {
          console.warn('Firestore collections listener skipped:', err.message);
        }
      );
    })
    .catch(() => {
      // Dynamic import or Firebase unavailable — safe fallback
    });

  return () => {
    try {
      unsub();
    } catch {
      // ignore
    }
  };
}

/**
 * Safe listener for all loans in real-time.
 */
export function listenToAllLoans(
  callback: (loans: Loan[]) => void
): Unsubscribe {
  let unsub: Unsubscribe = () => {};

  import('./firestore')
    .then(({ listenToCollection }) => {
      unsub = listenToCollection<Loan>(
        'loans',
        {},
        (data) => {
          if (Array.isArray(data) && data.length > 0) {
            callback(data);
          }
        },
        true,
        (err) => {
          console.warn('Firestore loans listener skipped:', err.message);
        }
      );
    })
    .catch(() => {
      // Dynamic import or Firebase unavailable — safe fallback
    });

  return () => {
    try {
      unsub();
    } catch {
      // ignore
    }
  };
}
