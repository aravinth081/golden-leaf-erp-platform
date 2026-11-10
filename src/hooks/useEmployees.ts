// ──────────────────────────────────────────────────
// Golden Leaf Finance — Employee React Query Hooks
// Caching, mutations, and real-time sync for employees
// ──────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { Employee, EmployeeFormData, EmployeeStatus } from '../types';
import type { UserRole } from '../types/auth.types';
import * as employeeService from '../services/employeeService';

const QUERY_KEYS = {
  all: ['employees'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
  agents: (branchId: string) => [...QUERY_KEYS.all, 'agents', branchId] as const,
  branch: (branchId: string) => [...QUERY_KEYS.all, 'branch', branchId] as const,
};

// ─── Queries ───

/**
 * Hook to fetch a single employee by UID.
 */
export function useEmployee(uid: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(uid || ''),
    queryFn: () => employeeService.getEmployee(uid!),
    enabled: !!uid,
  });
}

/**
 * Hook to fetch employees with filters.
 */
export function useEmployees(filters?: {
  branchId?: string;
  role?: UserRole;
  status?: EmployeeStatus;
  companyId?: string;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.list(filters as Record<string, unknown>),
    queryFn: () => employeeService.getEmployees(filters),
  });
}

/**
 * Hook to fetch Customer Relationship Officers (CROs) for a branch.
 */
export function useCollectionAgents(branchId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.agents(branchId || ''),
    queryFn: () => employeeService.getCollectionAgents(branchId!),
    enabled: !!branchId,
  });
}

/**
 * Hook to fetch all employees for a branch.
 */
export function useBranchEmployees(branchId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.branch(branchId || ''),
    queryFn: () => employeeService.getBranchEmployees(branchId!),
    enabled: !!branchId,
  });
}

// ─── Real-time Listener ───

/**
 * Hook for real-time employee data.
 */
export function useEmployeeRealtime(uid: string | undefined) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = employeeService.listenToEmployee(uid, (data) => {
      setEmployee(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  return { data: employee, isLoading };
}

// ─── Mutations ───

/**
 * Hook to create a new employee.
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      uid: string;
      formData: EmployeeFormData;
      companyId: string;
    }) =>
      employeeService.createEmployee(params.uid, params.formData, params.companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}

/**
 * Hook to update an employee.
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { uid: string; formData: Partial<EmployeeFormData> }) =>
      employeeService.updateEmployee(params.uid, params.formData),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.uid) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

/**
 * Hook to update employee status.
 */
export function useUpdateEmployeeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { uid: string; status: EmployeeStatus }) =>
      employeeService.updateEmployeeStatus(params.uid, params.status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.uid) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

/**
 * Hook to delete (soft-delete) an employee.
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { uid: string; deletedBy: string }) =>
      employeeService.deleteEmployee(params.uid, params.deletedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}
