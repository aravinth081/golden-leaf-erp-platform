// ──────────────────────────────────────────────────
// Golden Leaf Finance — Attendance React Query Hooks
// Caching, mutations, and real-time sync for attendance
// ──────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { AttendanceRecord, AttendanceSummary } from '../types';
import type { GeoLocation } from '../types/common.types';
import * as attendanceService from '../services/attendanceService';

const QUERY_KEYS = {
  all: ['attendance'] as const,
  today: (employeeId: string) => [...QUERY_KEYS.all, 'today', employeeId] as const,
  branch: (branchId: string, date: string) => [...QUERY_KEYS.all, 'branch', branchId, date] as const,
  records: (filters?: Record<string, unknown>) => [...QUERY_KEYS.all, 'records', filters] as const,
  summary: (employeeId: string, month: string) => [...QUERY_KEYS.all, 'summary', employeeId, month] as const,
};

// ─── Queries ───

/**
 * Hook to fetch today's attendance for an employee.
 */
export function useTodayAttendance(employeeId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.today(employeeId || ''),
    queryFn: () => attendanceService.getTodayAttendance(employeeId!),
    enabled: !!employeeId,
    refetchInterval: 60000, // Refresh every minute
  });
}

/**
 * Hook to fetch today's branch attendance.
 */
export function useBranchAttendanceToday(branchId: string | undefined) {
  const today = new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: QUERY_KEYS.branch(branchId || '', today),
    queryFn: () => attendanceService.getBranchAttendanceToday(branchId!),
    enabled: !!branchId,
  });
}

/**
 * Hook to fetch attendance records with filters.
 */
export function useAttendanceRecords(filters?: {
  employeeId?: string;
  branchId?: string;
  date?: string;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.records(filters as Record<string, unknown>),
    queryFn: () => attendanceService.getAttendanceRecords(filters),
  });
}

/**
 * Hook to fetch attendance summary for a month.
 */
export function useAttendanceSummary(employeeId: string | undefined, month: string) {
  return useQuery({
    queryKey: QUERY_KEYS.summary(employeeId || '', month),
    queryFn: () => attendanceService.getAttendanceSummary(employeeId!, month),
    enabled: !!employeeId,
  });
}

// ─── Real-time Listener ───

/**
 * Hook for real-time branch attendance today.
 */
export function useBranchAttendanceRealtime(branchId: string | undefined, date: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!branchId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = attendanceService.listenToBranchAttendance(
      branchId,
      date,
      (data) => {
        setRecords(data);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [branchId, date]);

  return { data: records, isLoading };
}

// ─── Mutations ───

/**
 * Hook for employee check-in.
 */
export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      employeeId: string;
      branchId: string;
      geoLocation: GeoLocation;
      selfieFile: File;
      isWithinGeofence: boolean;
    }) =>
      attendanceService.checkIn(
        params.employeeId,
        params.branchId,
        params.geoLocation,
        params.selfieFile,
        params.isWithinGeofence
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.today(variables.employeeId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}

/**
 * Hook for employee check-out.
 */
export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      attendanceId: string;
      geoLocation: GeoLocation;
      isWithinGeofence: boolean;
    }) =>
      attendanceService.checkOut(
        params.attendanceId,
        params.geoLocation,
        params.isWithinGeofence
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}

/**
 * Hook to mark attendance status (for managers).
 */
export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { attendanceId: string; status: 'present' | 'absent' | 'half_day' | 'on_leave' }) =>
      attendanceService.markAttendanceStatus(params.attendanceId, params.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}
