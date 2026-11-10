// ──────────────────────────────────────────────────
// Golden Leaf Finance — Customer React Query Hooks
// Caching, mutations, and real-time sync for customers
// ──────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { Customer, CustomerFormData, CustomerSearchFilters } from '../types';
import * as customerService from '../services/customerService';

const QUERY_KEYS = {
  all: ['customers'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters?: CustomerSearchFilters) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
};

// ─── Queries ───

/**
 * Hook to fetch a single customer by ID.
 */
export function useCustomer(customerId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(customerId || ''),
    queryFn: () => customerService.getCustomer(customerId!),
    enabled: !!customerId,
  });
}

/**
 * Hook to fetch customers with filters.
 */
export function useCustomers(filters?: CustomerSearchFilters, limitCount?: number) {
  return useQuery({
    queryKey: QUERY_KEYS.list(filters),
    queryFn: () => customerService.getCustomers(filters, limitCount),
  });
}

/**
 * Hook to fetch customers for a specific branch.
 */
export function useCustomersByBranch(branchId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.lists(), 'branch', branchId],
    queryFn: () => customerService.getCustomersByBranch(branchId!),
    enabled: !!branchId,
  });
}

// ─── Real-time Listener Hook ───

/**
 * Hook for real-time customer data.
 * Uses Firestore onSnapshot under the hood.
 */
export function useCustomerRealtime(customerId: string | undefined) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!customerId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = customerService.listenToCustomer(customerId, (data) => {
      setCustomer(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [customerId]);

  return { data: customer, isLoading, error };
}

// ─── Mutations ───

/**
 * Hook to create a new customer.
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      formData: CustomerFormData;
      companyId: string;
      branchId: string;
      registeredBy: string;
    }) =>
      customerService.createCustomer(
        params.formData,
        params.companyId,
        params.branchId,
        params.registeredBy
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}

/**
 * Hook to update a customer.
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { customerId: string; formData: Partial<CustomerFormData> }) =>
      customerService.updateCustomer(params.customerId, params.formData),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.customerId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

/**
 * Hook to verify customer KYC.
 */
export function useVerifyKYC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      customerId: string;
      verifiedBy: string;
      status: 'verified' | 'rejected';
      remarks?: string;
      rejectionReason?: string;
    }) =>
      customerService.verifyCustomerKYC(
        params.customerId,
        params.verifiedBy,
        params.status,
        params.remarks,
        params.rejectionReason
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.customerId) });
    },
  });
}

/**
 * Hook to delete (soft-delete) a customer.
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { customerId: string; deletedBy: string }) =>
      customerService.deleteCustomer(params.customerId, params.deletedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}
