// ──────────────────────────────────────────────────
// Golden Leaf Finance — Branch Types
// ──────────────────────────────────────────────────

import type { GeoLocation, SoftDelete, Timestamps } from './common.types';

export interface Branch extends Timestamps, SoftDelete {
  id: string;
  companyId: string;
  code: string;       // Auto-generated branch code (e.g., "GL-BR-001")
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  geoLocation: GeoLocation;
  geofenceRadius: number;  // meters, for attendance geo-fence validation
  managerId?: string;      // UID of assigned branch manager
  status: BranchStatus;
}

export type BranchStatus = 'active' | 'inactive' | 'disabled';

export interface BranchDashboardData {
  branchId: string;
  totalCustomers: number;
  activeLoans: number;
  collectionToday: number;
  collectionTarget: number;
  pendingCollections: number;
  totalOutstanding: number;
  agentCount: number;
  attendanceToday: number;
  loansDisbursedThisMonth: number;
  npaPercentage: number;
}

export interface BranchFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  geoLocation?: GeoLocation;
  geofenceRadius: number;
  managerId?: string;
}
