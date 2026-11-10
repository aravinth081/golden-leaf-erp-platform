// ──────────────────────────────────────────────────
// Golden Leaf Finance — Attendance Zustand Store
// Tracks daily punch-in/punch-out state for the session
// ──────────────────────────────────────────────────

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getTodayStr,
  getTodayGPSRecord,
  type GPSAttendanceRecord,
} from '../services/gpsAttendanceService';

interface AttendanceStore {
  // State
  todayDate: string;
  todayRecord: GPSAttendanceRecord | null;
  hasPunchedIn: boolean;
  hasPunchedOut: boolean;
  showPunchInGate: boolean;  // Should we show the mandatory punch-in modal?
  showPunchOutGate: boolean; // Should we show punch-out before logout?

  // Actions
  setPunchInRecord: (record: GPSAttendanceRecord) => void;
  setPunchOutRecord: (record: GPSAttendanceRecord) => void;
  setShowPunchInGate: (show: boolean) => void;
  setShowPunchOutGate: (show: boolean) => void;
  syncWithStorage: (employeeId: string) => void;
  resetDaily: () => void;
}

export const useAttendanceStore = create<AttendanceStore>()(
  persist(
    (set, get) => ({
      todayDate: getTodayStr(),
      todayRecord: null,
      hasPunchedIn: false,
      hasPunchedOut: false,
      showPunchInGate: false,
      showPunchOutGate: false,

      setPunchInRecord: (record) =>
        set({
          todayRecord: record,
          hasPunchedIn: true,
          hasPunchedOut: false,
          showPunchInGate: false,
          todayDate: getTodayStr(),
        }),

      setPunchOutRecord: (record) =>
        set({
          todayRecord: record,
          hasPunchedOut: true,
          showPunchOutGate: false,
        }),

      setShowPunchInGate: (show) => set({ showPunchInGate: show }),
      setShowPunchOutGate: (show) => set({ showPunchOutGate: show }),

      syncWithStorage: (employeeId: string) => {
        const today = getTodayStr();
        const storedDate = get().todayDate;

        // Auto-reset on new day
        if (storedDate !== today) {
          set({
            todayDate: today,
            todayRecord: null,
            hasPunchedIn: false,
            hasPunchedOut: false,
            showPunchInGate: false,
            showPunchOutGate: false,
          });
        }

        // Sync from localStorage
        const record = getTodayGPSRecord(employeeId);
        if (record) {
          set({
            todayRecord: record,
            hasPunchedIn: true,
            hasPunchedOut: !!record.punchOutTime,
          });
        }
      },

      resetDaily: () =>
        set({
          todayDate: getTodayStr(),
          todayRecord: null,
          hasPunchedIn: false,
          hasPunchedOut: false,
          showPunchInGate: false,
          showPunchOutGate: false,
        }),
    }),
    {
      name: 'glf-attendance-state',
      partialize: (state) => ({
        todayDate: state.todayDate,
        hasPunchedIn: state.hasPunchedIn,
        hasPunchedOut: state.hasPunchedOut,
      }),
    }
  )
);
