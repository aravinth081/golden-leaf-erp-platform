// ──────────────────────────────────────────────────
// Golden Leaf Finance — Loan React Query Hooks
// Caching, mutations, and real-time sync for loans
// ──────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { Loan, LoanFormData, LoanPlan, LoanStatus, LoanApprovalStatus } from '../types';
import * as loanService from '../services/loanService';

const QUERY_KEYS = {
  all: ['loans'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
  plans: ['loanPlans'] as const,
  pending: (branchId: string) => [...QUERY_KEYS.all, 'pending', branchId] as const,
};

// ─── Queries ───

/**
 * Hook to fetch a single loan.
 */
export function useLoan(loanId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(loanId || ''),
    queryFn: () => loanService.getLoan(loanId!),
    enabled: !!loanId,
  });
}

/**
 * Hook to fetch loans with filters.
 */
export function useLoans(filters?: {
  customerId?: string;
  branchId?: string;
  agentId?: string;
  status?: LoanStatus;
  approvalStatus?: LoanApprovalStatus;
}, limitCount?: number) {
  return useQuery({
    queryKey: QUERY_KEYS.list(filters as Record<string, unknown>),
    queryFn: () => loanService.getLoans(filters, limitCount),
  });
}

/**
 * Hook to fetch customer loans.
 */
export function useCustomerLoans(customerId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.lists(), 'customer', customerId],
    queryFn: () => loanService.getCustomerLoans(customerId!),
    enabled: !!customerId,
  });
}

/**
 * Hook to fetch pending loans for approval.
 */
export function usePendingLoans(branchId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.pending(branchId || ''),
    queryFn: () => loanService.getPendingLoans(branchId!),
    enabled: !!branchId,
  });
}

/**
 * Hook to fetch loan plans.
 */
export function useLoanPlans(companyId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.plans,
    queryFn: () => loanService.getLoanPlans(companyId!),
    enabled: !!companyId,
  });
}

// ─── Real-time Listener ───

/**
 * Hook for real-time loan data.
 */
export function useLoanRealtime(loanId: string | undefined) {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loanId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = loanService.listenToLoan(loanId, (data) => {
      setLoan(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [loanId]);

  return { data: loan, isLoading };
}

// ─── Mutations ───

/**
 * Hook to create a new loan.
 */
export function useCreateLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      formData: LoanFormData;
      plan: LoanPlan;
      companyId: string;
      branchId: string;
      customerName: string;
    }) =>
      loanService.createLoan(
        params.formData,
        params.plan,
        params.companyId,
        params.branchId,
        params.customerName
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}

/**
 * Hook to recommend a loan (Credit Manager).
 */
export function useRecommendLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { loanId: string; recommendedBy: string; remarks?: string }) =>
      loanService.recommendLoan(params.loanId, params.recommendedBy, params.remarks),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

/**
 * Hook to approve a loan (Branch Manager).
 */
export function useApproveLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { loanId: string; approvedBy: string; remarks?: string }) =>
      loanService.approveLoan(params.loanId, params.approvedBy, params.remarks),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

/**
 * Hook to reject a loan.
 */
export function useRejectLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { loanId: string; rejectedBy: string; reason: string }) =>
      loanService.rejectLoan(params.loanId, params.rejectedBy, params.reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

/**
 * Hook to disburse a loan.
 */
export function useDisburseLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { loanId: string; disbursementDate: Date }) =>
      loanService.disburseLoan(params.loanId, params.disbursementDate),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

/**
 * Hook to close a loan.
 */
export function useCloseLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      loanId: string;
      closureType: 'natural' | 'foreclosure';
      foreclosureAmount?: number;
    }) =>
      loanService.closeLoan(params.loanId, params.closureType, params.foreclosureAmount),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}
