// ──────────────────────────────────────────────────
// Golden Leaf Finance — Attendance Gate & Check-In Service
// Enforces mandatory daily attendance check-in for non-admin roles
// ──────────────────────────────────────────────────

import type { AuthUser } from '../types';

export interface AttendanceCheckInRecord {
  user_id: string;
  userName: string;
  role: string;
  date: string; // YYYY-MM-DD
  check_in_time: string; // e.g. "09:05 AM"
  timestamp: number;
  status: 'present';
}

const STORAGE_KEY = 'glf_attendance_records';
const EMPLOYEES_STORAGE_KEY = 'golden_leaf_attendance';

export const getTodayDateString = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const getNowTimeString = (): string => {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

/**
 * Retrieve all check-in attendance records from storage
 */
export const getAttendanceRecords = (): AttendanceCheckInRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse attendance records:', err);
  }
  return [];
};

/**
 * Checks if the given user has marked attendance / checked in for today.
 * Admin role is always exempt and returns true.
 */
export const isAttendanceMarkedToday = (user?: AuthUser | null): boolean => {
  if (!user) return false;
  
  // Admin, Area Manager and Auditor roles are exempt from attendance gating
  const role = user.customClaims?.role;
  if (role === 'admin' || role === 'area_manager' || role === 'auditor') {
    return true;
  }

  const todayStr = getTodayDateString();

  const userDisplayName = user.displayName || '';

  // 1. Check in dedicated attendance records table
  const records = getAttendanceRecords();
  const hasDedicatedRecord = records.some(
    (r) => (r.user_id === user.uid || (userDisplayName && r.userName.toLowerCase() === userDisplayName.toLowerCase())) && r.date === todayStr && r.status === 'present'
  );
  if (hasDedicatedRecord) return true;

  // 2. Check in golden_leaf_attendance employee profiles
  try {
    const rawEmps = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (rawEmps) {
      const emps = JSON.parse(rawEmps);
      const matchedEmp = emps.find((e: any) =>
        e.id === user.uid ||
        (userDisplayName && e.name?.toLowerCase() === userDisplayName.toLowerCase())
      );
      if (matchedEmp?.records?.[todayStr]?.status === 'present' && matchedEmp?.records?.[todayStr]?.checkIn) {
        return true;
      }
    }
  } catch (err) {
    console.error('Failed to read employee attendance:', err);
  }

  return false;
};

/**
 * Get today's check-in details for the user if available
 */
export const getTodayCheckInRecord = (user?: AuthUser | null): AttendanceCheckInRecord | null => {
  if (!user) return null;
  const todayStr = getTodayDateString();
  const records = getAttendanceRecords();
  const userDisplayName = user.displayName || '';
  const record = records.find(
    (r) => (r.user_id === user.uid || (userDisplayName && r.userName.toLowerCase() === userDisplayName.toLowerCase())) && r.date === todayStr
  );
  return record || null;
};

/**
 * Mark Attendance / Check In for today
 */
export const markAttendanceToday = (
  user: AuthUser,
  customTime?: string
): AttendanceCheckInRecord => {
  const todayStr = getTodayDateString();
  const timeStr = customTime || getNowTimeString();

  const record: AttendanceCheckInRecord = {
    user_id: user.uid,
    userName: user.displayName || user.email || 'User',
    role: user.customClaims?.role || 'collection_agent',
    date: todayStr,
    check_in_time: timeStr,
    timestamp: Date.now(),
    status: 'present',
  };

  // 1. Save to dedicated check-in table
  try {
    const existing = getAttendanceRecords().filter(
      (r) => !(r.user_id === user.uid && r.date === todayStr)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...existing]));
  } catch (err) {
    console.error('Failed to save check-in record:', err);
  }

  // 2. Sync to golden_leaf_attendance employee table
  try {
    const rawEmps = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (rawEmps) {
      const emps = JSON.parse(rawEmps);
      const dayNum = new Date().getDate();
      const userDisplayName = user.displayName || '';
      const updatedEmps = emps.map((emp: any) => {
        const matches =
          emp.id === user.uid ||
          (userDisplayName && emp.name?.toLowerCase() === userDisplayName.toLowerCase());

        if (matches) {
          const currentRec = emp.records?.[todayStr] || {};
          return {
            ...emp,
            records: {
              ...emp.records,
              [todayStr]: {
                dateStr: todayStr,
                dayNumber: dayNum,
                status: 'present',
                checkIn: currentRec.checkIn || timeStr,
                checkOut: currentRec.checkOut,
                workingHours: currentRec.checkOut ? 'Completed' : 'In Progress',
                notes: currentRec.notes || 'Daily Morning Check-In',
              },
            },
          };
        }
        return emp;
      });
      localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(updatedEmps));
    }
  } catch (err) {
    console.error('Failed to sync employee record:', err);
  }

  // Fire event to notify listeners & reactive UI
  window.dispatchEvent(new CustomEvent('glf-attendance-checked-in', { detail: record }));

  return record;
};

/**
 * Service/API layer middleware check.
 * Throws an error if a non-admin user attempts an operation without marking attendance.
 */
export const assertAttendanceMarked = (user?: AuthUser | null, operationName?: string): void => {
  if (!user) {
    throw new Error('Unauthorized: Authentication required.');
  }
  const role = user.customClaims?.role;
  if (role === 'admin' || role === 'area_manager' || role === 'auditor') {
    return; // Administrative and oversight roles exempt
  }
  if (!isAttendanceMarkedToday(user)) {
    throw new Error(
      `Attendance Required: You must mark attendance / check-in before performing "${operationName || 'this action'}".`
    );
  }
};
