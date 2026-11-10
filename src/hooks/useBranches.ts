// ──────────────────────────────────────────────────
// Golden Leaf Finance — Branch React Query Hooks
// Caching, mutations, and real-time sync for branches
// ──────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DetailedBranch } from '../services/branchService';
import * as branchService from '../services/branchService';

const QUERY_KEYS = {
  all: ['branches'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
};

export function useBranch(branchId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(branchId || ''),
    queryFn: () => branchService.getBranchById(branchId!),
    enabled: !!branchId,
  });
}

export function useBranches() {
  return useQuery({
    queryKey: QUERY_KEYS.lists(),
    queryFn: () => branchService.getStoredBranches(),
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: Partial<DetailedBranch>) =>
      Promise.resolve(branchService.createNewBranch(formData)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { branchId: string; formData: Partial<DetailedBranch> }) =>
      Promise.resolve(branchService.updateExistingBranch(params.branchId, params.formData)),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.branchId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

export function useToggleBranchStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (branchId: string) =>
      Promise.resolve(branchService.toggleBranchStatus(branchId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}

