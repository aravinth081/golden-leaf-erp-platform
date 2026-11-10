// ──────────────────────────────────────────────────
// Golden Leaf Finance — Attendance Service
// Firestore CRUD + Cloudinary selfie uploads
// ──────────────────────────────────────────────────

import type {
  AttendanceRecord,
  AttendanceStatus,
  AttendanceSummary,
} from '../types';
import type { GeoLocation } from '../types/common.types';
import {
  createDocument,
  getDocument,
  updateDocument,
  queryDocuments,
  listenToCollection,
  type FirestoreFilter,
  type Unsubscribe,
} from './firestore';
import { uploadAttendanceSelfie } from './cloudinary';

const COLLECTION = 'attendance';

// ─── Check In ───

/**
 * Record employee check-in with selfie and geolocation.
 * Uploads selfie to Cloudinary, then saves attendance to Firestore.
 */
export async function checkIn(
  employeeId: string,
  branchId: string,
  geoLocation: GeoLocation,
  selfieFile: File,
  isWithinGeofence: boolean
): Promise<string> {
  // Upload selfie to Cloudinary
  const selfieUrl = await uploadAttendanceSelfie(selfieFile, employeeId);

  const today = new Date().toISOString().slice(0, 10);

  const attendanceData: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'> = {
    employeeId,
    branchId,
    date: today,
    checkIn: {
      time: new Date(),
      geoLocation,
      selfieUrl,
      isWithinGeofence,
    },
    status: 'present',
  };

  return createDocument<AttendanceRecord>(COLLECTION, attendanceData as any);
}

// ─── Check Out ───

/**
 * Record employee check-out with geolocation.
 * Calculates total hours worked.
 */
export async function checkOut(
  attendanceId: string,
  geoLocation: GeoLocation,
  isWithinGeofence: boolean
): Promise<void> {
  const record = await getDocument<AttendanceRecord>(COLLECTION, attendanceId);
  if (!record) throw new Error(`Attendance record ${attendanceId} not found`);

  const checkOutTime = new Date();
  const checkInTime = new Date(record.checkIn.time);
  const totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

  await updateDocument(COLLECTION, attendanceId, {
    checkOut: {
      time: checkOutTime,
      geoLocation,
      isWithinGeofence,
    },
    totalHours: Math.round(totalHours * 100) / 100,
    status: totalHours < 4 ? 'half_day' : 'present',
  });
}

// ─── Read ───

/**
 * Get today's attendance for an employee.
 */
export async function getTodayAttendance(
  employeeId: string
): Promise<AttendanceRecord | null> {
  const today = new Date().toISOString().slice(0, 10);
  const records = await queryDocuments<AttendanceRecord>(COLLECTION, {
    filters: [
      { field: 'employeeId', operator: '==', value: employeeId },
      { field: 'date', operator: '==', value: today },
    ],
    limitCount: 1,
  }, false); // Attendance doesn't have soft-delete field

  return records.length > 0 ? records[0] : null;
}

/**
 * Get attendance records with filters.
 */
export async function getAttendanceRecords(filters?: {
  employeeId?: string;
  branchId?: string;
  date?: string;
  status?: AttendanceStatus;
}): Promise<AttendanceRecord[]> {
  const queryFilters: FirestoreFilter[] = [];

  if (filters?.employeeId) {
    queryFilters.push({ field: 'employeeId', operator: '==', value: filters.employeeId });
  }
  if (filters?.branchId) {
    queryFilters.push({ field: 'branchId', operator: '==', value: filters.branchId });
  }
  if (filters?.date) {
    queryFilters.push({ field: 'date', operator: '==', value: filters.date });
  }
  if (filters?.status) {
    queryFilters.push({ field: 'status', operator: '==', value: filters.status });
  }

  return queryDocuments<AttendanceRecord>(COLLECTION, {
    filters: queryFilters,
    sort: { field: 'date', direction: 'desc' },
  }, false);
}

/**
 * Get today's attendance for all employees in a branch.
 */
export async function getBranchAttendanceToday(branchId: string): Promise<AttendanceRecord[]> {
  const today = new Date().toISOString().slice(0, 10);
  return getAttendanceRecords({ branchId, date: today });
}

/**
 * Get attendance summary for an employee for a given month.
 */
export async function getAttendanceSummary(
  employeeId: string,
  month: string // YYYY-MM
): Promise<AttendanceSummary> {
  // Get all records for the month by filtering dates that start with the month prefix
  const allRecords = await queryDocuments<AttendanceRecord>(COLLECTION, {
    filters: [
      { field: 'employeeId', operator: '==', value: employeeId },
      { field: 'date', operator: '>=', value: `${month}-01` },
      { field: 'date', operator: '<=', value: `${month}-31` },
    ],
  }, false);

  const summary: AttendanceSummary = {
    employeeId,
    month,
    totalPresent: allRecords.filter((r) => r.status === 'present').length,
    totalAbsent: allRecords.filter((r) => r.status === 'absent').length,
    totalHalfDay: allRecords.filter((r) => r.status === 'half_day').length,
    totalLeave: allRecords.filter((r) => r.status === 'on_leave').length,
    totalWorkingHours: allRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0),
    attendancePercentage: 0,
  };

  const totalDays = summary.totalPresent + summary.totalAbsent + summary.totalHalfDay + summary.totalLeave;
  if (totalDays > 0) {
    summary.attendancePercentage = Math.round(
      ((summary.totalPresent + summary.totalHalfDay * 0.5) / totalDays) * 100
    );
  }

  return summary;
}

// ─── Update ───

/**
 * Mark attendance status (e.g., for leave marking by manager).
 */
export async function markAttendanceStatus(
  attendanceId: string,
  status: AttendanceStatus
): Promise<void> {
  await updateDocument(COLLECTION, attendanceId, { status });
}

// ─── Real-time Listeners ───

/**
 * Listen to today's attendance for a branch in real-time.
 */
export function listenToBranchAttendance(
  branchId: string,
  date: string,
  callback: (records: AttendanceRecord[]) => void
): Unsubscribe {
  return listenToCollection<AttendanceRecord>(
    COLLECTION,
    {
      filters: [
        { field: 'branchId', operator: '==', value: branchId },
        { field: 'date', operator: '==', value: date },
      ],
    },
    callback,
    false // Attendance doesn't use soft-delete
  );
}

/**
 * Listen to an employee's attendance today.
 */
export function listenToEmployeeAttendance(
  employeeId: string,
  date: string,
  callback: (records: AttendanceRecord[]) => void
): Unsubscribe {
  return listenToCollection<AttendanceRecord>(
    COLLECTION,
    {
      filters: [
        { field: 'employeeId', operator: '==', value: employeeId },
        { field: 'date', operator: '==', value: date },
      ],
    },
    callback,
    false
  );
}
