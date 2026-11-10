// ──────────────────────────────────────────────────
// GOLDEN LEAF FINANCE — MONITORING DATA SERVICE
// Authoritative single source of truth for Admin Monitoring views:
// • Customer Monitoring (Customer Management + Digital KYC)
// • Loan Monitoring (Loan Management + 4-Stage Approval Workflow)
// • Collection Monitoring (Daily Collections, Planner & Delay Tracking)
// • Attendance Monitoring (GPS, Selfie, Login/Logout & Reports)
// All data strictly honors branch context (selectedBranchId).
// ──────────────────────────────────────────────────

import { getStoredBranches, type DetailedBranch } from './branchService';
import { getAllGPSRecords, formatTime, type GPSAttendanceRecord } from './gpsAttendanceService';
import { getAttendanceRecords } from './attendanceGateService';

// ══════════════════════════════════════════════════════════
// 1. CUSTOMER MONITORING DATA TYPES & METHODS
// ══════════════════════════════════════════════════════════

export interface MonitoredCustomer {
  id: string;
  name: string;
  phone: string;
  branchId: string;
  branchName: string;
  centerName: string;
  groupName: string;
  groupId?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  // Digital KYC (Strictly PDF-defined)
  aadhaarNumber: string;
  aadhaarFrontAvailable: boolean;
  aadhaarFrontUrl?: string;
  aadhaarBackAvailable: boolean;
  aadhaarBackUrl?: string;
  panNumber: string;
  voterId: string;
  customerPhotoAvailable: boolean;
  customerPhotoUrl?: string;
  nomineePhotoAvailable: boolean;
  nomineePhotoUrl?: string;
  nomineeName: string;
  nomineeRelation: string;
  nomineePhone: string;
  kycStatus: 'Verified' | 'Pending' | 'Incomplete' | 'Rejected';
  // Customer Status
  status: 'Active' | 'Inactive';
  registrationDate: string;
  activeLoanId?: string;
  activeLoanAmount?: number;
  outstandingBalance?: number;
  history: {
    date: string;
    event: string;
    remarks: string;
  }[];
}

const SEED_CUSTOMERS: MonitoredCustomer[] = [];


const CUSTOMER_STORAGE_KEY = 'glf_monitored_customers_master';
const GROUPS_STORAGE_KEY = 'glf_collection_groups_master';

export interface BranchCollectionGroup {
  id: string;
  name: string;
  branchId: string;
  branchName?: string;
}

export const SEED_COLLECTION_GROUPS: BranchCollectionGroup[] = [];

export function getBranchCollectionGroups(branchId?: string | null): BranchCollectionGroup[] {
  let list: BranchCollectionGroup[] = [];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(GROUPS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          list = parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Error reading collection groups', e);
  }
  if (!branchId || branchId === 'all') return list;
  return list.filter(
    (g) =>
      g.branchId.toLowerCase() === branchId.toLowerCase() ||
      g.branchName?.toLowerCase() === branchId.toLowerCase() ||
      (branchId === 'BR-01' && (g.branchId === 'b1' || g.branchName?.toLowerCase().includes('anna nagar')))
  );
}

export function saveBranchCollectionGroups(groups: BranchCollectionGroup[]): void {
  try {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
    window.dispatchEvent(new CustomEvent('glf-collection-groups-updated'));
  } catch (e) {
    console.error('Failed to save collection groups to localStorage:', e);
  }
}

export function generateNextGroupId(branchId?: string): string {
  const all = getBranchCollectionGroups(null);
  const numericIds = all
    .map((g) => {
      const match = g.id.match(/\d+$/);
      return match ? parseInt(match[0], 10) : 0;
    })
    .filter((n) => !isNaN(n));
  const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  return `GRP-${String(maxId + 1).padStart(3, '0')}`;
}

export function addBranchCollectionGroup(group: BranchCollectionGroup): BranchCollectionGroup {
  const all = getBranchCollectionGroups(null);
  const updated = [...all, group];
  saveBranchCollectionGroups(updated);
  return group;
}

export function updateBranchCollectionGroup(
  groupId: string,
  patch: Partial<BranchCollectionGroup>
): BranchCollectionGroup | null {
  const all = getBranchCollectionGroups(null);
  const index = all.findIndex((g) => g.id === groupId);
  if (index === -1) return null;
  const existing = all[index];
  const updatedGroup: BranchCollectionGroup = {
    ...existing,
    ...patch,
    id: groupId,
  };
  all[index] = updatedGroup;
  saveBranchCollectionGroups(all);

  // If group name changed, synchronize with customers assigned to this group
  if (patch.name && patch.name !== existing.name) {
    const customers = getMonitoredCustomers(null);
    let customerChanged = false;
    const updatedCusts = customers.map((c) => {
      if (c.groupId === groupId || c.groupName === existing.name) {
        customerChanged = true;
        return { ...c, groupId, groupName: patch.name! };
      }
      return c;
    });
    if (customerChanged) {
      saveMonitoredCustomers(updatedCusts);
    }
  }

  return updatedGroup;
}

export function deleteBranchCollectionGroup(groupId: string): boolean {
  const all = getBranchCollectionGroups(null);
  const filtered = all.filter((g) => g.id !== groupId);
  if (filtered.length === all.length) return false;
  saveBranchCollectionGroups(filtered);
  return true;
}

// ══════════════════════════════════════════════════════════
// BRANCH-ISOLATED AGENT RESOLUTION (PDF-STRICT & LIVE DYNAMIC)
// ══════════════════════════════════════════════════════════

const SEED_EMPLOYEES_FALLBACK: Array<{ id: string; name: string; role: string; branchId: string; status: string }> = [];

export function getBranchAgents(branchId?: string | null): string[] {
  const agentsSet = new Set<string>();

  // 1. Agents from collection records for this branch
  try {
    const collections = getMonitoredCollections(branchId, 'all');
    collections.forEach((c) => {
      if (c.agentName && c.agentName.trim()) {
        agentsSet.add(c.agentName.trim());
      }
    });
  } catch (e) {
    console.warn('Could not load collections for agent list', e);
  }

  // 2. Agents from Employee Master (localStorage 'glf_pdf_strict_employees_master' or 'glf_employees_cache')
  try {
    let empList: any[] = [];
    const storageObj = typeof window !== 'undefined' ? window.localStorage : (globalThis as any).localStorage;
    if (storageObj) {
      const stored = storageObj.getItem('glf_pdf_strict_employees_master') || storageObj.getItem('glf_employees_cache');
      if (stored) {
        empList = JSON.parse(stored);
      }
    }

    if (Array.isArray(empList)) {
      empList.forEach((emp: any) => {
        if (!emp || !emp.name) return;
        if (emp.status === 'suspended' || emp.status === 'resigned') return;

        const matchesBranch =
          !branchId ||
          branchId === 'all' ||
          emp.branchId?.toLowerCase() === branchId.toLowerCase() ||
          (branchId.toUpperCase() === 'BR-01' &&
            (emp.branchId?.toLowerCase() === 'b1' || emp.branchName?.toLowerCase()?.includes('anna nagar')));

        if (matchesBranch) {
          if (
            emp.role === 'collection_agent' ||
            emp.role === 'agent' ||
            emp.role === 'field_officer' ||
            (emp.role && typeof emp.role === 'string' && emp.role.toLowerCase().includes('agent'))
          ) {
            agentsSet.add(emp.name.trim());
          }
        }
      });
    }
  } catch (e) {
    console.warn('Error fetching branch agents from employee master:', e);
  }

  // 4. Agents from Branch Service (agentPerformance & attendanceRecords)
  try {
    const branches = getStoredBranches();
    branches.forEach((b) => {
      const matchesBranch = !branchId || branchId === 'all' || b.id.toLowerCase() === branchId.toLowerCase();
      if (matchesBranch) {
        if (b.agentPerformance && Array.isArray(b.agentPerformance)) {
          b.agentPerformance.forEach((ap) => {
            if (ap.agentName && ap.agentName.trim()) {
              agentsSet.add(ap.agentName.trim());
            }
          });
        }
        if (b.attendanceRecords && Array.isArray(b.attendanceRecords)) {
          b.attendanceRecords.forEach((att) => {
            if (att.role?.toLowerCase().includes('agent') && att.employeeName) {
              agentsSet.add(att.employeeName.trim());
            }
          });
        }
      }
    });
  } catch (e) {
    // Ignore
  }

  return Array.from(agentsSet).sort();
}


export function getMonitoredCustomers(branchId?: string | null): MonitoredCustomer[] {
  let list: MonitoredCustomer[] = [];
  try {
    const stored = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        list = parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading customer records', e);
  }

  if (!branchId || branchId === 'all') return list;

  return list.filter((c) => c.branchId === branchId || c.branchName === branchId);
}

export function saveMonitoredCustomers(customers: MonitoredCustomer[]): void {
  try {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customers));
    window.dispatchEvent(new CustomEvent('glf-customers-updated'));
  } catch (e) {
    console.error('Failed to save customers to localStorage:', e);
  }
}

export function addMonitoredCustomer(customer: MonitoredCustomer): MonitoredCustomer {
  const all = getMonitoredCustomers(null);
  const updated = [customer, ...all];
  saveMonitoredCustomers(updated);
  return customer;
}

export function updateMonitoredCustomer(customerId: string, patch: Partial<MonitoredCustomer>): MonitoredCustomer | null {
  const all = getMonitoredCustomers(null);
  const index = all.findIndex((c) => c.id === customerId);
  if (index === -1) return null;
  const existing = all[index];
  const updatedCust: MonitoredCustomer = {
    ...existing,
    ...patch,
    id: customerId, // Preserve customer ID
  };
  all[index] = updatedCust;
  saveMonitoredCustomers(all);
  return updatedCust;
}

// ══════════════════════════════════════════════════════════
// 2. LOAN MONITORING DATA TYPES & METHODS
// ══════════════════════════════════════════════════════════

export type ApprovalStage = 'Customer Relationship Officer (CRO)' | 'Credit Manager' | 'Branch Manager' | 'Loan Disbursement';

export interface MonitoredLoan {
  id: string;
  customerId: string;
  customerName: string;
  branchId: string;
  branchName: string;
  planName: string;
  principalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  weeklyAmount: number;
  tenorWeeks: number;
  weeksCompleted: number;
  startDate: string;
  status: 'Active' | 'Closed' | 'Pending Approval' | 'Disbursed';
  approvalStage: ApprovalStage;
  approvalStageProgress: {
    agentOriginated: boolean;
    creditManagerVerified: boolean;
    branchManagerApproved: boolean;
    disbursed: boolean;
  };
  schedule: {
    week: number;
    dueDate: string;
    expectedAmount: number;
    status: 'Paid' | 'Pending' | 'Upcoming';
  }[];
}

const SEED_LOANS: MonitoredLoan[] = [];

const LOAN_STORAGE_KEY = 'glf_monitored_loans_master';

export function getMonitoredLoans(branchId?: string | null): MonitoredLoan[] {
  let list: MonitoredLoan[] = [];
  try {
    const stored = localStorage.getItem(LOAN_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        list = parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading loan records', e);
  }

  if (!branchId || branchId === 'all') return list;

  return list.filter((l) => l.branchId === branchId || l.branchName === branchId);
}

// ══════════════════════════════════════════════════════════
// 3. COLLECTION MONITORING DATA TYPES & METHODS
// ══════════════════════════════════════════════════════════

export type MonitoredCollectionCategory =
  | 'all'
  | 'today'
  | 'tomorrow'
  | 'area_route'
  | 'advance'
  | 'pending_nc'
  | 'delay_tracking'
  | 'history';

export interface MonitoredCollection {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  branchId: string;
  branchName: string;
  areaRoute: string;
  area?: string;
  groupId?: string;
  groupName?: string;
  loanId: string;
  installment?: string;
  expectedAmount: number;
  dueAmount?: number;
  collectedAmount: number;
  pendingAmount: number;
  agentName: string;
  agentId?: string;
  date: string; // 'Today' | 'Tomorrow' | YYYY-MM-DD
  time: string;
  status: 'collected' | 'partial' | 'advance' | 'pending' | 'nc' | 'delayed';
  // PDF NC / Delay fields
  ncReasonCode?: string;
  ncRemarks?: string;
  delayedDays?: number;
  paymentMode: string;
  receiptNumber: string;
  geoLocation?: string;
}

const SEED_COLLECTIONS: MonitoredCollection[] = [];

const COLLECTION_STORAGE_KEY = 'glf_monitored_collections_master';

export function saveMonitoredCollections(collections: MonitoredCollection[]): void {
  try {
    localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(collections));
    window.dispatchEvent(new CustomEvent('glf-collections-updated'));
  } catch (e) {
    console.error('Failed to save collections to localStorage:', e);
  }
}

export function getMonitoredCollections(
  branchId?: string | null,
  category: MonitoredCollectionCategory = 'all',
  targetDate?: string | null
): MonitoredCollection[] {
  let list: MonitoredCollection[] = [];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(COLLECTION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          list = parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Error reading collection records', e);
  }

  // Filter by branch (STRICT branch isolation)
  if (branchId && branchId !== 'all') {
    list = list.filter(
      (c) =>
        c.branchId.toLowerCase() === branchId.toLowerCase() ||
        c.branchName?.toLowerCase() === branchId.toLowerCase() ||
        (branchId.toUpperCase() === 'BR-01' && (c.branchId.toLowerCase() === 'b1' || c.branchName?.toLowerCase().includes('anna nagar')))
    );
  }

  // If a specific targetDate is provided (e.g. YYYY-MM-DD)
  if (targetDate) {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const tomorrow = new Date(now.getTime() + 86400000);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    list = list.filter((c) => {
      if (targetDate === todayStr) {
        return c.date === 'Today' || c.date === todayStr;
      }
      if (targetDate === tomorrowStr) {
        return c.date === 'Tomorrow' || c.date === tomorrowStr;
      }
      return c.date === targetDate;
    });
  }

  // Filter by category
  switch (category) {
    case 'today':
      return list.filter((c) => c.date === 'Today');
    case 'tomorrow':
      return list.filter((c) => c.date === 'Tomorrow');
    case 'advance':
      return list.filter((c) => c.status === 'advance');
    case 'pending_nc':
      return list.filter((c) => c.status === 'nc' || c.status === 'pending');
    case 'delay_tracking':
      return list.filter((c) => c.status === 'delayed' || (c.delayedDays !== undefined && c.delayedDays > 0));
    case 'history':
      return list.filter((c) => c.date !== 'Tomorrow' && c.date !== 'Today');
    case 'area_route':
      return list; // All route-indexed items
    default:
      return list;
  }
}

// ══════════════════════════════════════════════════════════
// 4. ATTENDANCE MONITORING DATA TYPES & METHODS
// ══════════════════════════════════════════════════════════

export interface MonitoredAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  branchId: string;
  branchName: string;
  date: string;
  rawDate?: string;
  loginTime: string;
  logoutTime: string;
  status: 'Present' | 'Late' | 'Absent';
  gpsLocation: string;
  lat?: number;
  lng?: number;
  address?: string;
  accuracy?: number;
  punchTimeISO?: string;
  selfieVerified: boolean;
  historyReport: {
    date: string;
    loginTime: string;
    logoutTime: string;
    status: string;
    gpsLocation: string;
    lat?: number;
    lng?: number;
  }[];
}

export function getMonitoredAttendance(
  branchId?: string | null,
  selectedDate?: string | null
): MonitoredAttendance[] {
  const branches = getStoredBranches();
  const gpsRecords: GPSAttendanceRecord[] = getAllGPSRecords();
  const gateRecords = getAttendanceRecords();

  const results: MonitoredAttendance[] = [];
  const processedEmployeeKeys = new Set<string>();

  // Determine today string
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const isAllDates = selectedDate === 'all';
  let targetDate = todayStr;
  if (selectedDate && selectedDate !== 'today' && selectedDate !== 'all') {
    if (selectedDate === 'yesterday') {
      const y = new Date(d);
      y.setDate(y.getDate() - 1);
      targetDate = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    } else {
      targetDate = selectedDate;
    }
  }

  // Helper to format date string nicely
  const formatDateDisplay = (dateVal: string) => {
    try {
      const dt = new Date(dateVal.includes('T') ? dateVal : `${dateVal}T00:00:00`);
      if (!isNaN(dt.getTime())) {
        const formatted = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        if (dateVal === todayStr) return `Today (${formatted})`;
        return formatted;
      }
    } catch {}
    return dateVal;
  };

  // 1. IF 'all': Show all historical attendance records across all dates
  if (isAllDates) {
    gpsRecords.forEach((g) => {
      const branchMatch = !branchId || g.branchId === branchId || (g.branchName && g.branchName.toLowerCase().includes(branchId.toLowerCase()));
      if (!branchMatch) return;

      const lat = g.punchInGPS?.lat || 13.0827;
      const lng = g.punchInGPS?.lng || 80.2707;
      const address = g.punchInGPS?.address || 'Anna Nagar Main Branch, Chennai';
      const punchTimeFormatted = g.punchInTime ? formatTime(g.punchInTime) : '09:00 AM';
      const punchOutFormatted = g.punchOutTime ? formatTime(g.punchOutTime) : (g.date === todayStr ? 'In Progress' : '05:00 PM');

      results.push({
        id: g.id,
        employeeId: g.employeeId,
        employeeName: g.employeeName,
        role: g.role === 'collection_agent' ? 'Customer Relationship Officer (CRO)' : g.role,
        branchId: g.branchId || 'BR-01',
        branchName: g.branchName || 'Anna Nagar Main Branch',
        date: formatDateDisplay(g.date),
        rawDate: g.date,
        loginTime: punchTimeFormatted,
        logoutTime: punchOutFormatted,
        status: g.status === 'late' ? 'Late' : g.status === 'present' ? 'Present' : 'Absent',
        gpsLocation: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E • ${address}`,
        lat,
        lng,
        address,
        accuracy: g.punchInGPS?.accuracy || 15,
        punchTimeISO: g.punchInTime,
        selfieVerified: true,
        historyReport: [],
      });
    });

    return results;
  }

  // 2. FOR SPECIFIC DATE (e.g. targetDate):
  // First, gather all actual punches on targetDate from GPS records
  gpsRecords.forEach((g) => {
    if (g.date === targetDate) {
      const branchMatch = !branchId || g.branchId === branchId || (g.branchName && g.branchName.toLowerCase().includes(branchId.toLowerCase()));
      if (!branchMatch) return;

      const key = g.employeeId.toLowerCase();
      processedEmployeeKeys.add(key);
      if (g.employeeName) processedEmployeeKeys.add(g.employeeName.toLowerCase());

      const lat = g.punchInGPS?.lat || 13.0827;
      const lng = g.punchInGPS?.lng || 80.2707;
      const address = g.punchInGPS?.address || 'Anna Nagar Main Branch, Chennai';
      const punchTimeFormatted = g.punchInTime ? formatTime(g.punchInTime) : '09:00 AM';
      const punchOutFormatted = g.punchOutTime ? formatTime(g.punchOutTime) : (targetDate === todayStr ? 'In Progress' : '05:00 PM');

      results.push({
        id: g.id,
        employeeId: g.employeeId,
        employeeName: g.employeeName,
        role: g.role === 'collection_agent' ? 'Customer Relationship Officer (CRO)' : g.role,
        branchId: g.branchId || 'BR-01',
        branchName: g.branchName || 'Anna Nagar Main Branch',
        date: formatDateDisplay(targetDate),
        rawDate: targetDate,
        loginTime: punchTimeFormatted,
        logoutTime: punchOutFormatted,
        status: g.status === 'late' ? 'Late' : 'Present',
        gpsLocation: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E • ${address}`,
        lat,
        lng,
        address,
        accuracy: g.punchInGPS?.accuracy || 15,
        punchTimeISO: g.punchInTime,
        selfieVerified: true,
        historyReport: [],
      });
    }
  });

  // Also check gate check-ins on targetDate
  gateRecords.forEach((gr) => {
    if (gr.date === targetDate) {
      const key = gr.user_id.toLowerCase();
      if (!processedEmployeeKeys.has(key) && (!gr.userName || !processedEmployeeKeys.has(gr.userName.toLowerCase()))) {
        processedEmployeeKeys.add(key);
        if (gr.userName) processedEmployeeKeys.add(gr.userName.toLowerCase());

        results.unshift({
          id: `GATE-${gr.user_id}-${targetDate}`,
          employeeId: gr.user_id,
          employeeName: gr.userName,
          role: gr.role === 'collection_agent' ? 'Customer Relationship Officer (CRO)' : gr.role,
          branchId: 'BR-01',
          branchName: 'Anna Nagar Main Branch',
          date: formatDateDisplay(targetDate),
          rawDate: targetDate,
          loginTime: gr.check_in_time,
          logoutTime: targetDate === todayStr ? 'In Progress' : '05:00 PM',
          status: 'Present',
          gpsLocation: '13.0827° N, 80.2707° E • Anna Nagar Main Branch, Chennai',
          lat: 13.0827,
          lng: 80.2707,
          address: 'Anna Nagar Main Branch, Chennai',
          accuracy: 15,
          selfieVerified: true,
          historyReport: [],
        });
      }
    }
  });

  // Now process real staff candidates
  const allStaffCandidates: Array<{ id: string; name: string; role: string; branchId: string; status: string }> = [];
  try {
    const storageObj = typeof window !== 'undefined' ? window.localStorage : (globalThis as any).localStorage;
    if (storageObj) {
      const stored = storageObj.getItem('glf_pdf_strict_employees_master') || storageObj.getItem('glf_employees_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((emp: any) => {
            if (emp && emp.id && emp.name && emp.status !== 'suspended' && emp.status !== 'resigned') {
              allStaffCandidates.push({
                id: emp.id,
                name: emp.name,
                role: emp.role || 'employee',
                branchId: emp.branchId || 'BR-01',
                status: emp.status || 'active',
              });
            }
          });
        }
      }
    }
  } catch (e) {
    console.warn('Could not read real employees for attendance', e);
  }

  branches.forEach((b) => {
    (b.attendanceRecords || []).forEach((att) => {
      if (!allStaffCandidates.some((c) => c.id === att.employeeId)) {
        allStaffCandidates.push({
          id: att.employeeId,
          name: att.employeeName,
          role: att.role,
          branchId: b.id,
          status: 'active',
        });
      }
    });
  });

  allStaffCandidates.forEach((emp) => {
    const key = emp.id.toLowerCase();
    const nameKey = emp.name ? emp.name.toLowerCase() : '';
    if (processedEmployeeKeys.has(key) || (nameKey && processedEmployeeKeys.has(nameKey))) {
      return;
    }
    processedEmployeeKeys.add(key);
    if (nameKey) processedEmployeeKeys.add(nameKey);

    const branchMatch = !branchId || emp.branchId === branchId;
    if (!branchMatch) return;

    // Find if employee had any punch on targetDate in GPS records
    const empGps = gpsRecords.filter(
      (g) => g.employeeId.toLowerCase() === key || (nameKey && g.employeeName && g.employeeName.toLowerCase() === nameKey)
    );
    const datePunch = empGps.find((g) => g.date === targetDate);

    const historyReport = empGps.map((g) => ({
      date: g.date,
      loginTime: g.punchInTime ? formatTime(g.punchInTime) : '—',
      logoutTime: g.punchOutTime ? formatTime(g.punchOutTime) : '05:00 PM',
      status: g.status === 'present' ? 'Present' : g.status === 'late' ? 'Late' : g.status,
      gpsLocation: g.punchInGPS ? `${g.punchInGPS.lat.toFixed(4)}° N, ${g.punchInGPS.lng.toFixed(4)}° E • ${g.punchInGPS.address}` : '—',
      lat: g.punchInGPS?.lat,
      lng: g.punchInGPS?.lng,
    }));

    const roleName = emp.role === 'collection_agent'
      ? 'Customer Relationship Officer (CRO)'
      : emp.role === 'branch_manager'
      ? 'Branch Manager'
      : emp.role === 'credit_manager'
      ? 'Credit Manager'
      : emp.role;

    const branchObj = branches.find((b) => b.id === emp.branchId);
    const branchName = branchObj ? branchObj.name : 'Anna Nagar Main Branch';

    if (datePunch) {
      const lat = datePunch.punchInGPS?.lat || 13.0827;
      const lng = datePunch.punchInGPS?.lng || 80.2707;
      const address = datePunch.punchInGPS?.address || `${branchName}, Chennai`;
      results.push({
        id: datePunch.id,
        employeeId: emp.id,
        employeeName: emp.name,
        role: roleName,
        branchId: emp.branchId,
        branchName: branchName,
        date: formatDateDisplay(targetDate),
        rawDate: targetDate,
        loginTime: datePunch.punchInTime ? formatTime(datePunch.punchInTime) : '09:00 AM',
        logoutTime: datePunch.punchOutTime ? formatTime(datePunch.punchOutTime) : (targetDate === todayStr ? 'In Progress' : '05:00 PM'),
        status: datePunch.status === 'late' ? 'Late' : 'Present',
        gpsLocation: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E • ${address}`,
        lat,
        lng,
        address,
        accuracy: datePunch.punchInGPS?.accuracy || 15,
        punchTimeISO: datePunch.punchInTime,
        selfieVerified: true,
        historyReport,
      });
    } else {
      // Unpunched on this date
      results.push({
        id: `ATT-${emp.id}-${targetDate}`,
        employeeId: emp.id,
        employeeName: emp.name,
        role: roleName,
        branchId: emp.branchId,
        branchName: branchName,
        date: formatDateDisplay(targetDate),
        rawDate: targetDate,
        loginTime: '—',
        logoutTime: '—',
        status: 'Absent',
        gpsLocation: 'Location pending punch',
        selfieVerified: false,
        historyReport,
      });
    }
  });

  if (!branchId) return results;
  return results.filter((a) => a.branchId === branchId || a.branchName === branchId);
}
