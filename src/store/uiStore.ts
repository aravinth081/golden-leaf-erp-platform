// ──────────────────────────────────────────────────
// Golden Leaf Finance — Zustand UI Store
// Global UI state management
// ──────────────────────────────────────────────────

import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface UIStore {
  // Sidebar
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Loading
  globalLoading: boolean;
  loadingMessage: string;
  setGlobalLoading: (loading: boolean, message?: string) => void;

  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Modal
  activeModal: string | null;
  modalData: unknown;
  openModal: (modalId: string, data?: unknown) => void;
  closeModal: () => void;

  // Mobile
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;

  // Selected branch (for Admin cross-branch views)
  selectedBranchId: string | null;
  setSelectedBranchId: (branchId: string | null) => void;
}

const getInitialIsMobile = () => (typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

export const useUIStore = create<UIStore>()((set, get) => {
  const isMobileInitial = getInitialIsMobile();
  return {
    // Sidebar
    isSidebarOpen: !isMobileInitial,
    isSidebarCollapsed: false,
    toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
    setSidebarOpen: (open) => set({ isSidebarOpen: open }),
    setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

    // Loading
    globalLoading: false,
    loadingMessage: '',
    setGlobalLoading: (loading, message = '') =>
      set({ globalLoading: loading, loadingMessage: message }),

    // Toasts
    toasts: [],
    addToast: (toast) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const newToast = { ...toast, id, duration: toast.duration ?? 5000 };
      set((s) => ({ toasts: [...s.toasts, newToast] }));

      // Auto-remove after duration
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    },
    removeToast: (id) =>
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    // Modal
    activeModal: null,
    modalData: null,
    openModal: (modalId, data) => set({ activeModal: modalId, modalData: data }),
    closeModal: () => set({ activeModal: null, modalData: null }),

    // Mobile
    isMobile: isMobileInitial,
    setIsMobile: (isMobile) => set({ isMobile }),

    // Selected branch
    selectedBranchId: null,
    setSelectedBranchId: (branchId) => set({ selectedBranchId: branchId }),
  };
});
