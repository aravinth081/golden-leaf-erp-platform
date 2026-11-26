// ──────────────────────────────────────────────────
// Golden Leaf Finance — App Entry Point
// ──────────────────────────────────────────────────

import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes/AppRouter';
import { ToastContainer, ErrorBoundary } from './components/ui';
import { useAuthListener } from './hooks/useAuthListener';
import { fetchBranchesFromSupabase } from './services/branchService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const AppInner: React.FC = () => {
  // Listen to Firebase Auth state changes and sync with Zustand store
  useAuthListener();

  // Fetch branches from Supabase on mount to ensure all branches (e.g. GOBI MAIN BRANCH) are loaded
  useEffect(() => {
    fetchBranchesFromSupabase().catch((err) =>
      console.warn('[App] Initial branches load warning:', err)
    );
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppInner />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

