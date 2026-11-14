// ──────────────────────────────────────────────────
// Golden Leaf Finance — Branch Service & Data Layer
// Complete CRUD, State Synchronization & Metrics
// Source of truth for Branch Management & Branch Dashboard
// ──────────────────────────────────────────────────

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface BranchActivity {
  id: string;
  userName: string;
  userRole: string;
  action: string;
  date: string;
  time: string;
  type: 'customer' | 'loan' | 'collection' | 'attendance' | 'system';
}

export interface BranchAttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  loginTime: string;
  logoutTime: string;
  gpsLocation: {
    lat: number;
    lng: number;
    address: string;
    withinGeofence: boolean;
  };
  selfieVerified: boolean;
  status: 'Present' | 'Late' | 'Field Visit' | 'Absent' | 'On Leave';
}

export interface BranchAgentPerformance {
  agentId: string;
  agentName: string;
  centerOrRoute: string;
  targetAmount: number;
  collectedAmount: number;
  collectionsCount: number;
  efficiencyPercentage: number;
  status: 'Active' | 'Completed' | 'Pending';
}

export interface BranchPendingLoan {
  loanId: string;
  customerName: string;
  groupName: string;
  amount: number;
  appliedDate: string;
  stage: 'KYC Verification' | 'Credit Appraisal' | 'Manager Review' | 'Field Inspection';
}

export interface BranchDisbursedLoan {
  loanId: string;
  customerName: string;
  product: string;
  sanctionedAmount: number;
  disbursedDate: string;
  mode: 'NEFT / Direct Bank' | 'IMPS' | 'Cheque';
}

export interface DetailedBranch {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  manager: string;
  openingDate: string;
  maxCapacity: number;
  status: 'Active' | 'Disabled';
  
  // Dashboard Metrics
  totalEmployees: number;
  activeEmployees: number;
  presentEmployees: number;
  absentEmployees: number;
  attendancePercentage: number;
  
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  pendingVerificationCustomers: number;
  
  totalLoanApplications: number;
  activeLoans: number;
  pendingLoans: number;
  approvedLoans: number;
  rejectedLoans: number;
  
  todayCollection: number;
  weeklyCollection: number;
  monthlyCollection: number;
  pendingCollection: number;
  totalCollectionAmount: number;

  monthlyTrend: { month: string; collection: number; target: number }[];
  recentActivities: BranchActivity[];

  // PDF-Required Branch Dashboard Modules
  attendanceRecords: BranchAttendanceRecord[];
  agentPerformance: BranchAgentPerformance[];
  pendingLoansList: BranchPendingLoan[];
  disbursedLoansList: BranchDisbursedLoan[];
}

const STORAGE_KEY = 'golden_leaf_branches_master';
const LEGACY_MOCK_BRANCH_IDS = new Set(['BR-02', 'BR-03', 'BR-04', 'BR-05']);

export const INITIAL_BRANCHES: DetailedBranch[] = [
  {
    id: 'BR-01',
    code: 'GL-BR-001',
    name: 'Main Branch - Anna Nagar',
    address: 'Plot 45, 2nd Avenue, Anna Nagar East',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600102',
    phone: '+91 44 2621 8899',
    email: 'annanagar@goldenleaf.finance',
    manager: 'Unassigned',
    openingDate: '2022-04-15',
    maxCapacity: 25,
    status: 'Active',

    totalEmployees: 0,
    activeEmployees: 0,
    presentEmployees: 0,
    absentEmployees: 0,
    attendancePercentage: 0,

    totalCustomers: 0,
    newCustomers: 0,
    activeCustomers: 0,
    pendingVerificationCustomers: 0,

    totalLoanApplications: 0,
    activeLoans: 0,
    pendingLoans: 0,
    approvedLoans: 0,
    rejectedLoans: 0,

    todayCollection: 0,
    weeklyCollection: 0,
    monthlyCollection: 0,
    pendingCollection: 0,
    totalCollectionAmount: 0,

    monthlyTrend: [],
    recentActivities: [],
    attendanceRecords: [],
    agentPerformance: [],
    pendingLoansList: [],
    disbursedLoansList: [],
  },
];

export const getStoredBranches = (): DetailedBranch[] => {
  try {
    const storage = typeof window !== 'undefined' ? window.localStorage : (globalThis as any).localStorage;
    if (storage) {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: DetailedBranch[] = JSON.parse(raw);
        // Automatically purge legacy mock seed branches (BR-02, BR-03, BR-04, BR-05)
        const cleaned = parsed.filter((b) => !LEGACY_MOCK_BRANCH_IDS.has(b.id));
        const activeList = cleaned.length > 0 ? cleaned : INITIAL_BRANCHES;
        if (cleaned.length !== parsed.length) {
          storage.setItem(STORAGE_KEY, JSON.stringify(activeList));
        }
        return activeList.map((b) => ({
          ...b,
          attendanceRecords: b.attendanceRecords || [],
          agentPerformance: b.agentPerformance || [],
          pendingLoansList: b.pendingLoansList || [],
          disbursedLoansList: b.disbursedLoansList || [],
          recentActivities: b.recentActivities || [],
          monthlyTrend: b.monthlyTrend || [],
        }));
      }
      storage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BRANCHES));
    }
  } catch (e) {
    console.error('Failed to load branches from localStorage:', e);
  }
  return INITIAL_BRANCHES;
};

export const fetchBranchesFromSupabase = async (): Promise<DetailedBranch[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: rows, error } = await supabase
        .from('documents')
        .select('data')
        .eq('collection', 'branches')
        .eq('is_deleted', false);

      if (!error && Array.isArray(rows) && rows.length > 0) {
        const cloudBranches = rows.map((r: any) => r.data).filter(Boolean);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudBranches));
        } catch {}
        return cloudBranches;
      } else if (!error && Array.isArray(rows) && rows.length === 0) {
        // Seed initial branches to Supabase
        const initial = getStoredBranches();
        const upsertRows = initial.map((b) => ({
          collection: 'branches',
          id: b.id,
          data: b,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        await supabase.from('documents').upsert(upsertRows);
      }
    } catch (e) {
      console.warn('[Supabase] Failed to fetch branches from cloud:', e);
    }
  }
  return getStoredBranches();
};

export const saveStoredBranches = (branches: DetailedBranch[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(branches));
  } catch (e) {
    console.error('Failed to save branches to localStorage:', e);
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const upsertRows = branches.map((b) => ({
        collection: 'branches',
        id: b.id,
        data: b,
        is_deleted: b.status === 'Disabled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      supabase.from('documents').upsert(upsertRows).then();
    } catch (e) {
      console.warn('[Supabase] Branch sync error:', e);
    }
  }
};

export const getBranchById = (id: string): DetailedBranch | undefined => {
  const branches = getStoredBranches();
  return branches.find(b => b.id === id || b.code === id);
};

export const createNewBranch = (data: Partial<DetailedBranch>): DetailedBranch => {
  const branches = getStoredBranches();
  const newCode = data.code || `GL-BR-00${branches.length + 1}`;
  const newBranchId = `BR-${Date.now().toString().slice(-4)}`;
  const cityName = data.city || 'Chennai';
  const branchName = data.name || 'New Branch';

  const newBranch: DetailedBranch = {
    id: newBranchId,
    code: newCode,
    name: branchName,
    address: data.address || '',
    city: cityName,
    state: data.state || 'Tamil Nadu',
    pincode: data.pincode || '600001',
    phone: data.phone || '+91 44 0000 0000',
    email: data.email || `${newCode.toLowerCase()}@goldenleaf.finance`,
    manager: data.manager || 'Unassigned',
    openingDate: data.openingDate || new Date().toISOString().split('T')[0],
    maxCapacity: data.maxCapacity || 20,
    status: (data.status as 'Active' | 'Disabled') || 'Active',

    totalEmployees: 0,
    activeEmployees: 0,
    presentEmployees: 0,
    absentEmployees: 0,
    attendancePercentage: 0,

    totalCustomers: 0,
    newCustomers: 0,
    activeCustomers: 0,
    pendingVerificationCustomers: 0,

    totalLoanApplications: 0,
    activeLoans: 0,
    pendingLoans: 0,
    approvedLoans: 0,
    rejectedLoans: 0,

    todayCollection: 0,
    weeklyCollection: 0,
    monthlyCollection: 0,
    pendingCollection: 0,
    totalCollectionAmount: 0,

    monthlyTrend: [],
    recentActivities: [
      {
        id: `ACT-${Date.now()}`,
        userName: 'Admin',
        userRole: 'Admin',
        action: `Branch ${branchName} registered and activated`,
        date: 'Today',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'system',
      },
    ],
    attendanceRecords: [],
    agentPerformance: [],
    pendingLoansList: [],
    disbursedLoansList: [],
  };

  const updated = [...branches, newBranch];
  saveStoredBranches(updated);
  return newBranch;
};

export const updateExistingBranch = (id: string, updates: Partial<DetailedBranch>): DetailedBranch | null => {
  const branches = getStoredBranches();
  const index = branches.findIndex(b => b.id === id);
  if (index === -1) return null;

  const updatedBranch: DetailedBranch = {
    ...branches[index],
    ...updates,
  };

  branches[index] = updatedBranch;
  saveStoredBranches(branches);
  return updatedBranch;
};

export const toggleBranchStatus = (id: string): { branch: DetailedBranch; newStatus: 'Active' | 'Disabled' } | null => {
  const branches = getStoredBranches();
  const index = branches.findIndex(b => b.id === id);
  if (index === -1) return null;

  const current = branches[index];
  const newStatus = current.status === 'Active' ? 'Disabled' : 'Active';

  const updatedBranch: DetailedBranch = {
    ...current,
    status: newStatus,
    activeEmployees: newStatus === 'Active' ? current.totalEmployees : 0,
    recentActivities: [
      {
        id: `ACT-${Date.now()}`,
        userName: 'Admin',
        userRole: 'Admin',
        action: `Branch status changed to ${newStatus}`,
        date: 'Today',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'system',
      },
      ...current.recentActivities,
    ],
  };

  branches[index] = updatedBranch;
  saveStoredBranches(branches);
  return { branch: updatedBranch, newStatus };
};
