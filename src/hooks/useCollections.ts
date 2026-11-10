// ──────────────────────────────────────────────────
// Golden Leaf Finance — Collection React Query Hooks
// Caching, mutations, and real-time sync for collections
// ──────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { Collection, CollectionFormData, CollectionSummary } from '../types';
import * as collectionService from '../services/collectionService';

const QUERY_KEYS = {
  all: ['collections'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...QUERY_KEYS.lists(), filters] as const,
  today: (agentId: string) => [...QUERY_KEYS.all, 'today', agentId] as const,
  summary: (branchId: string, date: string) => [...QUERY_KEYS.all, 'summary', branchId, date] as const,
  loan: (loanId: string) => [...QUERY_KEYS.all, 'loan', loanId] as const,
};

// ─── Queries ───

/**
 * Hook to fetch collections with filters.
 */
export function useCollections(filters?: {
  loanId?: string;
  customerId?: string;
  agentId?: string;
  branchId?: string;
  date?: string;
}, limitCount?: number) {
  return useQuery({
    queryKey: QUERY_KEYS.list(filters as Record<string, unknown>),
    queryFn: () => collectionService.getCollections(filters, limitCount),
  });
}

/**
 * Hook to fetch today's collections for an agent.
 */
export function useTodayCollections(agentId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.today(agentId || ''),
    queryFn: () => collectionService.getTodayCollections(agentId!),
    enabled: !!agentId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Hook to fetch collections for a loan.
 */
export function useLoanCollections(loanId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.loan(loanId || ''),
    queryFn: () => collectionService.getLoanCollections(loanId!),
    enabled: !!loanId,
  });
}

/**
 * Hook to fetch collection summary for a branch on a given date.
 */
export function useCollectionSummary(branchId: string | undefined, date: string) {
  return useQuery({
    queryKey: QUERY_KEYS.summary(branchId || '', date),
    queryFn: () => collectionService.getCollectionSummary(branchId!, date),
    enabled: !!branchId,
  });
}

// ─── Real-time Listener ───

/**
 * Hook for real-time daily collections for a branch.
 */
export function useDailyCollectionsRealtime(branchId: string | undefined, date: string) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!branchId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = collectionService.listenToDailyCollections(
      branchId,
      date,
      (data) => {
        setCollections(data);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [branchId, date]);

  return { data: collections, isLoading };
}

// ─── Mutations ───

/**
 * Hook to record a collection entry.
 */
export function useRecordCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      formData: CollectionFormData;
      agentId: string;
      agentName: string;
      companyId: string;
      branchId: string;
      customerName: string;
      weekNumber: number;
      expectedAmount: number;
      geoLocation?: { latitude: number; longitude: number; accuracy?: number };
    }) =>
      collectionService.recordCollection(
        params.formData,
        params.agentId,
        params.agentName,
        params.companyId,
        params.branchId,
        params.customerName,
        params.weekNumber,
        params.expectedAmount,
        params.geoLocation
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['loans'] }); // Also invalidate loans (totals updated)
    },
  });
}

/**
 * Hook to verify a collection.
 */
export function useVerifyCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { collectionId: string; verifiedBy: string }) =>
      collectionService.verifyCollection(params.collectionId, params.verifiedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}

/**
 * Hook to create daily closing.
 */
export function useCreateDailyClosing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      branchId: string;
      date: string;
      closedBy: string;
      cashInHand: number;
      remarks?: string;
    }) =>
      collectionService.createDailyClosing(
        params.branchId,
        params.date,
        params.closedBy,
        params.cashInHand,
        params.remarks
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}
