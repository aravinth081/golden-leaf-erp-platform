// ──────────────────────────────────────────────────
// Golden Leaf Finance — GPS Attendance Service
// localStorage-based GPS + Selfie attendance records
// Geofencing via Haversine distance calculation
// ──────────────────────────────────────────────────

import { getStoredBranches, saveStoredBranches } from './branchService';

const GPS_ATTENDANCE_KEY = 'glf_gps_attendance_records';

export interface GPSLocation {
  lat: number;
  lng: number;
  address: string;
  accuracy: number;
}

export interface GPSAttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  branchId: string;
  branchName: string;
  date: string; // YYYY-MM-DD

  // Punch In
  punchInTime: string; // ISO timestamp
  punchInGPS: GPSLocation;
  punchInSelfie: string; // base64 data URL
  punchInWithinGeofence: boolean;

  // Punch Out (filled later)
  punchOutTime?: string;
  punchOutGPS?: GPSLocation;
  punchOutSelfie?: string;
  punchOutWithinGeofence?: boolean;

  // Calculated
  totalHoursWorked?: string; // "8h 30m"
  totalMinutes?: number;
  status: 'present' | 'late' | 'absent' | 'outside_location' | 'half_day';
}

// ── Helpers ──

export const getTodayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getNowISO = (): string => new Date().toISOString();

export const formatTime = (iso: string): string => {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return iso;
  }
};

export const formatHoursWorked = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
};

/**
 * Haversine formula to calculate distance between two GPS coordinates.
 * Returns distance in meters.
 */
export const calculateDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if a location is within the branch geofence.
 */
export const isWithinGeofence = (
  empLat: number, empLng: number,
  branchLat: number, branchLng: number,
  radiusMeters: number = 200
): boolean => {
  const distance = calculateDistance(empLat, empLng, branchLat, branchLng);
  return distance <= radiusMeters;
};

// ── CRUD ──

/**
 * Get all GPS attendance records from localStorage.
 */
export const getAllGPSRecords = (): GPSAttendanceRecord[] => {
  try {
    const raw = localStorage.getItem(GPS_ATTENDANCE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveAllRecords = (records: GPSAttendanceRecord[]): void => {
  localStorage.setItem(GPS_ATTENDANCE_KEY, JSON.stringify(records));
};

/**
 * Get today's GPS attendance record for an employee.
 */
export const getTodayGPSRecord = (employeeId: string): GPSAttendanceRecord | null => {
  const today = getTodayStr();
  const records = getAllGPSRecords();
  return records.find(r => r.employeeId === employeeId && r.date === today) || null;
};

/**
 * Check if employee has punched in today.
 */
export const hasPunchedInToday = (employeeId: string): boolean => {
  return getTodayGPSRecord(employeeId) !== null;
};

/**
 * Check if employee has punched out today.
 */
export const hasPunchedOutToday = (employeeId: string): boolean => {
  const record = getTodayGPSRecord(employeeId);
  return record !== null && !!record.punchOutTime;
};

/**
 * Determine attendance status based on punch-in time and geofence.
 */
const determineStatus = (
  punchInTime: string,
  withinGeofence: boolean,
  lateThresholdHour: number = 9,
  lateThresholdMinute: number = 30
): GPSAttendanceRecord['status'] => {
  if (!withinGeofence) return 'outside_location';
  const d = new Date(punchInTime);
  const h = d.getHours();
  const m = d.getMinutes();
  if (h > lateThresholdHour || (h === lateThresholdHour && m > lateThresholdMinute)) {
    return 'late';
  }
  return 'present';
};

/**
 * Punch In — create a new attendance record for today.
 */
export const gpsPunchIn = (data: {
  employeeId: string;
  employeeName: string;
  role: string;
  branchId: string;
  branchName: string;
  gps: GPSLocation;
  selfie: string;
  withinGeofence: boolean;
}): GPSAttendanceRecord => {
  const today = getTodayStr();
  const now = getNowISO();

  // Prevent duplicate punch-in
  if (hasPunchedInToday(data.employeeId)) {
    throw new Error('Already punched in today.');
  }

  const status = determineStatus(now, data.withinGeofence);

  const record: GPSAttendanceRecord = {
    id: `GATT-${data.employeeId}-${today}`,
    employeeId: data.employeeId,
    employeeName: data.employeeName,
    role: data.role,
    branchId: data.branchId,
    branchName: data.branchName,
    date: today,
    punchInTime: now,
    punchInGPS: data.gps,
    punchInSelfie: data.selfie,
    punchInWithinGeofence: data.withinGeofence,
    status,
  };

  const existing = getAllGPSRecords();
  saveAllRecords([record, ...existing]);

  return record;
};

/**
 * Punch Out — update today's record with checkout data.
 */
export const gpsPunchOut = (data: {
  employeeId: string;
  gps: GPSLocation;
  selfie: string;
  withinGeofence: boolean;
}): GPSAttendanceRecord => {
  const today = getTodayStr();
  const now = getNowISO();
  const records = getAllGPSRecords();

  const idx = records.findIndex(r => r.employeeId === data.employeeId && r.date === today);
  if (idx === -1) {
    throw new Error('No punch-in record found for today. Cannot punch out.');
  }
  if (records[idx].punchOutTime) {
    throw new Error('Already punched out today.');
  }

  // Calculate total hours
  const punchInMs = new Date(records[idx].punchInTime).getTime();
  const punchOutMs = new Date(now).getTime();
  const totalMinutes = Math.max(0, (punchOutMs - punchInMs) / (1000 * 60));

  // Update status based on total hours
  let status = records[idx].status;
  if (totalMinutes < 240) { // Less than 4 hours
    status = 'half_day';
  }

  records[idx] = {
    ...records[idx],
    punchOutTime: now,
    punchOutGPS: data.gps,
    punchOutSelfie: data.selfie,
    punchOutWithinGeofence: data.withinGeofence,
    totalHoursWorked: formatHoursWorked(totalMinutes),
    totalMinutes: Math.round(totalMinutes),
    status,
  };

  saveAllRecords(records);
  return records[idx];
};

/**
 * Record or update live GPS attendance for an employee (from Attendance modal punch).
 * Automatically updates GPS records, branch attendance, and fires reactive events.
 */
export const recordLiveGPSAttendance = (data: {
  employeeId: string;
  employeeName: string;
  role: string;
  branchId: string;
  branchName: string;
  gps: GPSLocation;
  selfie?: string;
  withinGeofence?: boolean;
  customTime?: string;
  hoursWorked?: string;
  date?: string;
}): GPSAttendanceRecord => {
  const today = data.date || getTodayStr();
  const now = getNowISO();
  const records = getAllGPSRecords();

  const isLate = () => {
    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes();
    return h > 9 || (h === 9 && m > 30);
  };

  const status: GPSAttendanceRecord['status'] = (data.withinGeofence ?? true)
    ? (isLate() ? 'late' : 'present')
    : 'outside_location';

  const existingIdx = records.findIndex(
    (r) => (r.employeeId === data.employeeId || r.employeeName.toLowerCase() === data.employeeName.toLowerCase()) && r.date === today
  );

  const record: GPSAttendanceRecord = {
    id: existingIdx >= 0 ? records[existingIdx].id : `GATT-${data.employeeId}-${today}`,
    employeeId: data.employeeId,
    employeeName: data.employeeName,
    role: data.role,
    branchId: data.branchId,
    branchName: data.branchName,
    date: today,
    punchInTime: existingIdx >= 0 ? records[existingIdx].punchInTime : now,
    punchInGPS: data.gps,
    punchInSelfie: data.selfie || (existingIdx >= 0 ? records[existingIdx].punchInSelfie : ''),
    punchInWithinGeofence: data.withinGeofence ?? true,
    totalHoursWorked: data.hoursWorked || (existingIdx >= 0 ? records[existingIdx].totalHoursWorked : '8h 00m'),
    status: status,
  };

  if (existingIdx >= 0) {
    records[existingIdx] = record;
  } else {
    records.unshift(record);
  }

  saveAllRecords(records);

  // Sync with stored branches
  try {
    const branches = getStoredBranches();
    let branchUpdated = false;
    branches.forEach((b) => {
      const match =
        b.id === data.branchId ||
        b.name.toLowerCase().includes(data.branchName.toLowerCase()) ||
        b.id === 'BR-01';
      if (match) {
        if (!b.attendanceRecords) b.attendanceRecords = [];
        const attIdx = b.attendanceRecords.findIndex(
          (a) =>
            a.employeeId === data.employeeId ||
            a.employeeName.toLowerCase() === data.employeeName.toLowerCase()
        );
        const attEntry: any = {
          id: `ATT-${data.employeeId}-${today}`,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          role: data.role === 'collection_agent' ? 'Customer Relationship Officer (CRO)' : data.role,
          loginTime: data.customTime || formatTime(record.punchInTime),
          logoutTime: '05:00 PM',
          gpsLocation: {
            lat: data.gps.lat,
            lng: data.gps.lng,
            address: data.gps.address,
            withinGeofence: data.withinGeofence ?? true,
          },
          selfieVerified: true,
          status: 'Present' as const,
        };
        if (attIdx >= 0) {
          b.attendanceRecords[attIdx] = attEntry;
        } else {
          b.attendanceRecords.unshift(attEntry);
        }
        branchUpdated = true;
      }
    });
    if (branchUpdated) {
      saveStoredBranches(branches);
    }
  } catch (err) {
    console.error('Failed syncing to stored branches:', err);
  }

  // Dispatch events for real-time reactivity
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('glf-attendance-updated', { detail: record }));
  }

  return record;
};

/**
 * Get records for a specific employee (history).
 */
export const getEmployeeRecords = (employeeId: string): GPSAttendanceRecord[] => {
  return getAllGPSRecords().filter(r => r.employeeId === employeeId);
};

/**
 * Get records with filters (for admin report).
 */
export const getFilteredRecords = (filters?: {
  employeeId?: string;
  branchId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  search?: string;
}): GPSAttendanceRecord[] => {
  let records = getAllGPSRecords();

  if (filters?.employeeId) {
    records = records.filter(r => r.employeeId === filters.employeeId);
  }
  if (filters?.branchId && filters.branchId !== 'all') {
    records = records.filter(r => r.branchId === filters.branchId);
  }
  if (filters?.date) {
    records = records.filter(r => r.date === filters.date);
  }
  if (filters?.dateFrom) {
    records = records.filter(r => r.date >= filters.dateFrom!);
  }
  if (filters?.dateTo) {
    records = records.filter(r => r.date <= filters.dateTo!);
  }
  if (filters?.status && filters.status !== 'all') {
    records = records.filter(r => r.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    records = records.filter(r =>
      r.employeeName.toLowerCase().includes(q) ||
      r.employeeId.toLowerCase().includes(q) ||
      r.branchName.toLowerCase().includes(q)
    );
  }

  return records;
};

/**
 * Seed demo records (Neutralized - 100% Real Attendance only).
 */
export const seedDemoGPSRecords = (): void => {
  // Mock data completely disabled - production real attendance only
};
