// ──────────────────────────────────────────────────
// Golden Leaf Finance — Customer Types
// ──────────────────────────────────────────────────

import type { SoftDelete, Timestamps } from './common.types';

export interface Customer extends Timestamps, SoftDelete {
  id: string;
  companyId: string;
  branchId: string;
  groupId?: string;           // Collection group/route assignment
  registeredBy: string;       // Agent UID who registered

  // Personal Info
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';

  // Address
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;

  // KYC
  kyc: KYCData;

  // Nominee
  nominee?: NomineeData;

  // Photos
  photoUrl?: string;

  // Status tracking
  status: CustomerStatus;
  approvalStatus: CustomerApprovalStatus;
  rejectionReason?: string;

  // Metadata
  totalLoans: number;
  activeLoans: number;
  totalCollected: number;
}

export type CustomerStatus = 'active' | 'inactive' | 'blacklisted';

export type CustomerApprovalStatus =
  | 'pending_registration'
  | 'pending_kyc_verification'
  | 'kyc_verified'
  | 'kyc_rejected'
  | 'approved'
  | 'rejected';

export interface KYCData {
  // Aadhaar (encrypted at rest, masked in UI — only last 4 shown)
  aadhaarNumber?: string;        // Encrypted in Firestore
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;

  // PAN
  panNumber?: string;

  // Voter ID (optional)
  voterIdNumber?: string;

  // Verification
  status: KYCStatus;
  verifiedBy?: string;           // Credit Manager UID
  verifiedAt?: Date;
  rejectionReason?: string;
  remarks?: string;

  // Mobile verification
  isMobileVerified: boolean;
}

export type KYCStatus = 'pending' | 'verified' | 'rejected';

export interface NomineeData {
  name: string;
  relation: string;
  phone: string;
  photoUrl?: string;
}

export interface CustomerFormData {
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  photo?: File;

  // KYC
  aadhaarNumber?: string;
  aadhaarFront?: File;
  aadhaarBack?: File;
  panNumber?: string;
  voterIdNumber?: string;

  // Nominee
  nomineeName?: string;
  nomineeRelation?: string;
  nomineePhone?: string;
  nomineePhoto?: File;
}

export interface CollectionGroup {
  id: string;
  branchId: string;
  name: string;
  area: string;
  agentId: string;
  customerIds: string[];
  routeOrder: number;
}

export interface CustomerSearchFilters {
  query?: string;            // Fuzzy search text
  branchId?: string;
  status?: CustomerStatus;
  approvalStatus?: CustomerApprovalStatus;
  groupId?: string;
  agentId?: string;
}
