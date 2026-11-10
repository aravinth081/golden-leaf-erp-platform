// ──────────────────────────────────────────────────
// Golden Leaf Finance — Employee Types
// ──────────────────────────────────────────────────

import type { UserRole } from './auth.types';
import type { GeoLocation, SoftDelete, Timestamps } from './common.types';

export interface Employee extends Timestamps, SoftDelete {
  id: string;         // Same as Firebase Auth UID
  companyId: string;
  branchId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  photoUrl?: string;
  idProofUrl?: string;
  address?: string;
  status: EmployeeStatus;
  lastLoginAt?: Date;
}

export type EmployeeStatus = 'active' | 'inactive' | 'suspended';

export interface EmployeeFormData {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  branchId: string;
  password: string;
  photo?: File;
  idProof?: File;
  address?: string;
}

export interface AttendanceRecord extends Timestamps {
  id: string;
  employeeId: string;
  branchId: string;
  date: string;        // YYYY-MM-DD
  checkIn: {
    time: Date;
    geoLocation: GeoLocation;
    selfieUrl: string;
    isWithinGeofence: boolean;
  };
  checkOut?: {
    time: Date;
    geoLocation: GeoLocation;
    isWithinGeofence: boolean;
  };
  totalHours?: number;
  status: AttendanceStatus;
}

export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'on_leave';

export interface AttendanceSummary {
  employeeId: string;
  month: string;       // YYYY-MM
  totalPresent: number;
  totalAbsent: number;
  totalHalfDay: number;
  totalLeave: number;
  totalWorkingHours: number;
  attendancePercentage: number;
}
