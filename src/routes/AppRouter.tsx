// ──────────────────────────────────────────────────
// Golden Leaf Finance — App Router Configuration
// Strict Role-Based Access Control (RBAC) Routing Engine
// ──────────────────────────────────────────────────

import React, { Suspense, useState, useEffect } from 'react';
import { createBrowserRouter, Navigate, useRouteError, useNavigate, useLocation, Link } from 'react-router-dom';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from '../components/guards/ProtectedRoute';
import { PageSkeleton, ErrorBoundary } from '../components/ui';
import { useAuthStore } from '../store';
import { lazyWithRetry, clearLazyModuleCache, isModuleLoadError } from '../utils/lazyWithRetry';

// Auth Pages
import LoginPage from '../modules/auth/LoginPage';
const ForgotPasswordPage = lazyWithRetry(() => import('../modules/auth/ForgotPasswordPage'), 'forgot-password');

// Role Dashboards
const AdminDashboard = lazyWithRetry(() => import('../modules/dashboard/AdminDashboard'), 'dashboard/admin');
const BranchDashboard = lazyWithRetry(() => import('../modules/dashboard/BranchDashboard'), 'dashboard/branch');
const CreditDashboard = lazyWithRetry(() => import('../modules/dashboard/CreditDashboard'), 'dashboard/credit');
const AgentDashboard = lazyWithRetry(() => import('../modules/dashboard/AgentDashboard'), 'dashboard/agent');
const HRPayrollDashboardPage = lazyWithRetry(() => import('../modules/hr/HRPayrollDashboardPage'), 'hr-payroll');

// Admin Modules
const InvestorListPage = lazyWithRetry(() => import('../modules/investor/InvestorListPage'), 'investors');
const FDListPage = lazyWithRetry(() => import('../modules/fd/FDListPage'), 'fixed-deposits');
const FDRateSlabPage = lazyWithRetry(() => import('../modules/fd/FDRateSlabPage'), 'fixed-deposits/rates');
const GroupLoanRateSlabsPage = lazyWithRetry(() => import('../modules/admin/GroupLoanRateSlabsPage'), 'admin/loans/rate-slabs');
const FDReferralPage = lazyWithRetry(() => import('../modules/fd/FDReferralPage'), 'fixed-deposits/referral');
const BusinessLoanPage = lazyWithRetry(() => import('../modules/loans/business/BusinessLoanPage'), 'business-loans');
const GoldLoanPage = lazyWithRetry(() => import('../modules/loans/gold/GoldLoanPage'), 'gold-loans');
const BranchListPage = lazyWithRetry(() => import('../modules/branch/BranchListPage'), 'branches');
const BranchDashboardPage = lazyWithRetry(() => import('../modules/branch/BranchDashboardPage'), 'branches/detail');
const EmployeeListPage = lazyWithRetry(() => import('../modules/employee/EmployeeListPage'), 'employees');
const SystemMonitoringPage = lazyWithRetry(() => import('../modules/monitoring/SystemMonitoringPage'), 'monitoring');
const AuditLogPage = lazyWithRetry(() => import('../modules/audit/AuditLogPage'), 'audit-logs');
const SettingsPage = lazyWithRetry(() => import('../modules/settings/SettingsPage'), 'settings');

// Admin Monitoring Pages
const CustomerMonitoringPage = lazyWithRetry(() => import('../modules/customer/CustomerMonitoringPage'), 'monitoring/customers');
const LoanMonitoringPage = lazyWithRetry(() => import('../modules/loan/LoanMonitoringPage'), 'monitoring/loans');
const SanctionLetterPage = lazyWithRetry(() => import('../modules/loan/SanctionLetterPage'), 'monitoring/sanction');
const CollectionMonitoringPage = lazyWithRetry(() => import('../modules/collection/CollectionMonitoringPage'), 'monitoring/collections');
const AttendanceMonitoringPage = lazyWithRetry(() => import('../modules/attendance/AttendanceMonitoringPage'), 'monitoring/attendance');

// Admin Roles & Security Pages
const RolesPermissionsPage = lazyWithRetry(() => import('../modules/employee/RolesPermissionsPage'), 'roles');
const StaffProfileManagementPage = lazyWithRetry(() => import('../modules/admin/StaffProfileManagementPage'), 'admin/staff-profiles');
const CompensationManagementPage = lazyWithRetry(() => import('../modules/admin/CompensationManagementPage'), 'admin/compensation');
const MyPayslipsPage = lazyWithRetry(() => import('../modules/employee/MyPayslipsPage'), 'my-payslips');
const SecurityPage = lazyWithRetry(() => import('../modules/settings/SecurityPage'), 'settings/security');

// Branch Manager & Operations Modules
const CustomerListPage = lazyWithRetry(() => import('../modules/customer/CustomerListPage'), 'customers');
const CustomerProfilePage = lazyWithRetry(() => import('../modules/customer/CustomerProfilePage'), 'customers/profile');
const CustomerRegistrationPage = lazyWithRetry(() => import('../modules/customer/CustomerRegistrationPage'), 'customer/registration');
const ClientManagementDashboard = lazyWithRetry(() => import('../modules/customer/ClientManagementDashboard'), 'client/management');
const CollectionGroupsPage = lazyWithRetry(() => import('../modules/collection/CollectionGroupsPage'), 'collections/groups');
const DailyClosingPage = lazyWithRetry(() => import('../modules/collection/DailyClosingPage'), 'collections/closing');
const PrintingPage = lazyWithRetry(() => import('../modules/printing/PrintingPage'), 'printing');

// Credit Manager Verification Module
const CreditVerificationPage = lazyWithRetry(() => import('../modules/approval/CreditVerificationPage'), 'credit/verification');
const ApprovalQueuePage = lazyWithRetry(() => import('../modules/approval/ApprovalQueuePage'), 'approval/queue');

// Collections Modules (Weekly, Advance, Pending, History, Dashboard)
const CollectionsDashboard = lazyWithRetry(() => import('../modules/collection/CollectionsDashboard'), 'collections');
const WeeklyCollectionPage = lazyWithRetry(() => import('../modules/collection/WeeklyCollectionPage'), 'collections/weekly');
const AdvanceCollectionPage = lazyWithRetry(() => import('../modules/collection/AdvanceCollectionPage'), 'collections/advance');
const PendingCollectionPage = lazyWithRetry(() => import('../modules/collection/PendingCollectionPage'), 'collections/pending');
const CollectionListPage = lazyWithRetry(() => import('../modules/collection/CollectionListPage'), 'collections/history');
const DemandCollectionPage = lazyWithRetry(() => import('../modules/collection/DemandCollectionPage'), 'demand/collection');
const LateCollectionPage = lazyWithRetry(() => import('../modules/collection/LateCollectionPage'), 'collections/late');
const EODPage = lazyWithRetry(() => import('../modules/collection/EODPage'), 'collections/eod');

// Common & Shared Modules
const AttendancePage = lazyWithRetry(() => import('../modules/attendance/AttendancePage'), 'attendance');
const ReportViewPage = lazyWithRetry(() => import('../modules/reports/ReportViewPage'), 'reports/view');
const ReportsPage = lazyWithRetry(() => import('../modules/reports/ReportsPage'), 'reports');
const ClientSearchPage = lazyWithRetry(() => import('../modules/search/ClientSearchPage'), 'search');
const LocateCenterPage = lazyWithRetry(() => import('../modules/search/LocateCenterPage'), 'locate-center');
const ResetPasswordPage = lazyWithRetry(() => import('../modules/employee/ResetPasswordPage'), 'reset-password');

// Role-Aware Dynamic Dashboard Router for 10 Enterprise Roles
const DashboardRouter: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const role = user?.customClaims?.role || 'admin';

  switch (role) {
    case 'admin':
    case 'area_manager':
      return <AdminDashboard />;
    case 'hr_payroll_manager':
      return <HRPayrollDashboardPage />;
    case 'branch_manager':
    case 'accountant':
      return <BranchDashboard />;
    case 'credit_manager':
    case 'auditor':
      return <CreditDashboard />;
    case 'collection_agent':
    case 'recovery_officer':
      return <AgentDashboard />;
    default:
      return <AdminDashboard />;
  }
};

const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError() as any;
  const navigate = useNavigate();
  const isChunkError = isModuleLoadError(error);

  const handleRetry = () => {
    clearLazyModuleCache();
    if (isChunkError && typeof window !== 'undefined') {
      window.location.reload();
      return;
    }
    // Retry route rendering within client router smoothly without disruptive full browser reload
    navigate(window.location.pathname + window.location.search, { replace: true });
  };

  const handleGoDashboard = () => {
    clearLazyModuleCache();
    if (isChunkError && typeof window !== 'undefined') {
      window.location.assign('/dashboard');
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] py-16 px-6 font-sans">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-[#D4AF37]">
        <AlertTriangle size={30} />
      </div>
      <h3 className="text-xl font-bold text-[#0F1F38] tracking-tight mb-2">
        {isChunkError
          ? 'Page Resource Notice'
          : 'Navigation Interrupted'}
      </h3>
      <p className="text-xs sm:text-sm text-[#64748B] text-center max-w-md mb-6 leading-relaxed">
        {isChunkError
          ? 'A newer optimized module is available. Click below to load the updated view smoothly.'
          : error?.message || 'A temporary transition glitch occurred. Click below to proceed smoothly.'}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#162D4A] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer active:scale-[0.98]"
        >
          <RefreshCcw size={14} />
          Try Again
        </button>
        <button
          type="button"
          onClick={handleGoDashboard}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] text-[#0B1F3A] font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer active:scale-[0.98]"
        >
          <Home size={14} />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <ErrorBoundary
      resetKey={location.pathname + location.search}
      onNavigateDashboard={() => navigate('/dashboard', { replace: true })}
    >
      <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
    </ErrorBoundary>
  );
};

const RootRoute: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasUser = useAuthStore((s) => !!s.user);
  if (isAuthenticated && hasUser) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LoginPage />;
};

export const router = createBrowserRouter([
  // Auth routes
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: '/',
        element: <RootRoute />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/forgot-password',
        element: <SuspenseWrapper><ForgotPasswordPage /></SuspenseWrapper>,
      },
    ],
  },

  // Protected application routes
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      // Shared Universal Dashboard Route (Automatically adapts to user's role)
      {
        path: '/dashboard',
        element: <SuspenseWrapper><DashboardRouter /></SuspenseWrapper>,
      },
      {
        path: '/admin',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: '/hr',
        element: <Navigate to="/hr-payroll" replace />,
      },
      {
        path: '/branch',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: '/credit',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: '/credit-manager',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: '/agent',
        element: <Navigate to="/dashboard" replace />,
      },

      // ── HR & PAYROLL FINANCE SUITE (COMPANY-WIDE) ──
      {
        path: '/hr-payroll',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager']}>
            <SuspenseWrapper><HRPayrollDashboardPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },

      // ── ADMIN EXCLUSIVE & MULTI-BRANCH ROUTES ──
      // ── INVESTOR & FIXED DEPOSIT (FD) MODULES ──
      {
        path: '/investors',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'area_manager']}>
            <SuspenseWrapper><InvestorListPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/fixed-deposits',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'area_manager', 'branch_manager']}>
            <SuspenseWrapper><FDListPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/fixed-deposits/rates',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'area_manager']}>
            <SuspenseWrapper><FDRateSlabPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/fixed-deposits/referral',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'area_manager', 'branch_manager', 'credit_manager', 'collection_agent']}>
            <SuspenseWrapper><FDReferralPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },

      // ── BUSINESS LOANS & GOLD LOANS MODULES ──
      {
        path: '/loans',
        element: <Navigate to="/loans/business" replace />,
      },
      {
        path: '/loans/business',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'area_manager', 'branch_manager', 'credit_manager', 'collection_agent']}>
            <SuspenseWrapper><BusinessLoanPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/loans/gold',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'area_manager', 'branch_manager', 'credit_manager', 'collection_agent']}>
            <SuspenseWrapper><GoldLoanPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/loans/rate-slabs',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'branch_manager', 'credit_manager', 'area_manager']}>
            <SuspenseWrapper><GroupLoanRateSlabsPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/companies',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: '/branches',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'area_manager', 'auditor']}>
            <SuspenseWrapper><BranchListPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/branches/add',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SuspenseWrapper><BranchListPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/branches/edit',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SuspenseWrapper><BranchListPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/branches/:branchId/dashboard',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'area_manager', 'auditor']}>
            <SuspenseWrapper><BranchDashboardPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/branches/:branchId/dashboard',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'area_manager', 'auditor']}>
            <SuspenseWrapper><BranchDashboardPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/employees',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'area_manager', 'auditor']}>
            <SuspenseWrapper><EmployeeListPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/employees/add',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager']}>
            <SuspenseWrapper><EmployeeListPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/system-monitoring',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'auditor']}>
            <SuspenseWrapper><SystemMonitoringPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/audit-logs',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'area_manager', 'auditor']}>
            <SuspenseWrapper><AuditLogPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/settings',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SuspenseWrapper><SettingsPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },

      // ── ADMIN MONITORING ROUTES ──
      {
        path: '/admin/monitoring',
        element: <Navigate to="/admin/customers" replace />,
      },
      {
        path: '/admin/customers',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SuspenseWrapper><CustomerMonitoringPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/loans',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SuspenseWrapper><LoanMonitoringPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/collections',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SuspenseWrapper><CollectionMonitoringPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/attendance',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SuspenseWrapper><AttendanceMonitoringPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/eod',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'area_manager', 'auditor']}>
            <SuspenseWrapper><EODPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/roles-permissions',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SuspenseWrapper><RolesPermissionsPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/staff-profiles',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SuspenseWrapper><StaffProfileManagementPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/compensation',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SuspenseWrapper><CompensationManagementPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/security',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SuspenseWrapper><SecurityPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },

      // ── BRANCH MANAGER & OPERATIONS ROUTES ──
      {
        path: '/customers',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'area_manager', 'branch_manager', 'credit_manager', 'accountant', 'auditor']}>
            <SuspenseWrapper><CustomerListPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/customer/list',
        element: <Navigate to="/customers" replace />,
      },
      {
        path: '/customers/new',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'branch_manager', 'collection_agent']}>
            <SuspenseWrapper><CustomerRegistrationPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/customers/:customerId',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'area_manager', 'branch_manager', 'credit_manager', 'collection_agent', 'recovery_officer', 'auditor', 'accountant']}>
            <SuspenseWrapper><CustomerProfilePage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/collection-groups',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'area_manager', 'branch_manager']}>
            <SuspenseWrapper><CollectionGroupsPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/daily-closing',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'area_manager', 'branch_manager', 'accountant', 'auditor']}>
            <SuspenseWrapper><DailyClosingPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/printing',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'area_manager', 'branch_manager', 'accountant']}>
            <SuspenseWrapper><PrintingPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/approvals',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'area_manager', 'branch_manager', 'credit_manager']}>
            <SuspenseWrapper><ApprovalQueuePage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/sanction-letter',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'area_manager', 'branch_manager', 'credit_manager', 'auditor']}>
            <SuspenseWrapper><SanctionLetterPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/sanction-letter/:loanId',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'area_manager', 'branch_manager', 'credit_manager', 'auditor']}>
            <SuspenseWrapper><SanctionLetterPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },

      // ── CREDIT MANAGER & LOAN VERIFICATION ROUTES ──
      {
        path: '/verification/customer',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'credit_manager']}>
            <SuspenseWrapper><CreditVerificationPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/verification/kyc',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'credit_manager']}>
            <SuspenseWrapper><CreditVerificationPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/verification/docs',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'credit_manager']}>
            <SuspenseWrapper><CreditVerificationPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/verification/recommend',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'credit_manager']}>
            <SuspenseWrapper><CreditVerificationPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/verification/approval',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'credit_manager', 'branch_manager', 'area_manager']}>
            <SuspenseWrapper><CreditVerificationPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },

      // ── CLIENT MANAGEMENT ROUTES ──
      {
        path: '/client',
        element: <Navigate to="/client/enrollment" replace />,
      },
      {
        path: '/client/dashboard',
        element: <Navigate to="/client/enrollment" replace />,
      },
      {
        path: '/client/enrollment',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'branch_manager', 'collection_agent']}>
            <SuspenseWrapper><CustomerRegistrationPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/client/kyc-documents',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'branch_manager', 'credit_manager']}>
            <SuspenseWrapper><CreditVerificationPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/client/kyc-update',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'branch_manager', 'credit_manager']}>
            <SuspenseWrapper><CustomerListPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/client/loan-onboarding',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'branch_manager', 'credit_manager']}>
            <SuspenseWrapper><CustomerRegistrationPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },

      // ── COLLECTION ROUTES ──
      {
        path: '/collections',
        element: <Navigate to="/collections/weekly" replace />,
      },
      {
        path: '/collections/dashboard',
        element: <Navigate to="/collections/weekly" replace />,
      },
      {
        path: '/collections/weekly',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'area_manager', 'branch_manager', 'credit_manager', 'collection_agent', 'recovery_officer', 'accountant']}>
            <SuspenseWrapper><WeeklyCollectionPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/collections/advance',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'area_manager', 'branch_manager', 'credit_manager', 'collection_agent', 'recovery_officer', 'accountant']}>
            <SuspenseWrapper><AdvanceCollectionPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/collections/pending',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'area_manager', 'branch_manager', 'credit_manager', 'collection_agent', 'recovery_officer', 'accountant']}>
            <SuspenseWrapper><PendingCollectionPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/collections/history',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'area_manager', 'branch_manager', 'credit_manager', 'collection_agent', 'recovery_officer', 'accountant', 'auditor']}>
            <SuspenseWrapper><CollectionListPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/collections/daily',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'area_manager', 'branch_manager', 'collection_agent', 'recovery_officer']}>
            <SuspenseWrapper><DemandCollectionPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/collections/demand',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'area_manager', 'branch_manager', 'collection_agent', 'recovery_officer']}>
            <SuspenseWrapper><DemandCollectionPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/collections/late',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'area_manager', 'branch_manager', 'credit_manager', 'recovery_officer', 'collection_agent', 'accountant']}>
            <SuspenseWrapper><LateCollectionPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/collections/eod',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'area_manager', 'branch_manager', 'credit_manager', 'collection_agent', 'recovery_officer', 'accountant', 'auditor']}>
            <SuspenseWrapper><EODPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },

      // ── ATTENDANCE & SEARCH (Operational Staff Only — Admin is exempt) ──
      {
        path: '/attendance',
        element: (
          <ProtectedRoute allowedRoles={['hr_payroll_manager', 'branch_manager', 'credit_manager', 'collection_agent']}>
            <SuspenseWrapper><AttendancePage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/client-search',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'area_manager', 'branch_manager', 'credit_manager', 'collection_agent', 'recovery_officer', 'auditor', 'accountant']}>
            <SuspenseWrapper><ClientSearchPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/locate-center',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'area_manager', 'branch_manager', 'credit_manager', 'collection_agent', 'recovery_officer', 'auditor', 'accountant']}>
            <SuspenseWrapper><LocateCenterPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/employee-reset',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'area_manager', 'branch_manager']}>
            <SuspenseWrapper><ResetPasswordPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/my-payslips',
        element: (
          <ProtectedRoute allowedRoles={['hr_payroll_manager', 'branch_manager', 'credit_manager', 'collection_agent', 'area_manager', 'auditor', 'accountant', 'recovery_officer']}>
            <SuspenseWrapper><MyPayslipsPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },

      // ── REPORTS ──
      {
        path: '/reports',
        element: <Navigate to="/reports/all" replace />,
      },
      {
        path: '/reports/all',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'area_manager', 'branch_manager', 'credit_manager', 'accountant', 'auditor']}>
            <SuspenseWrapper><ReportsPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/reports/:reportType',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'hr_payroll_manager', 'area_manager', 'branch_manager', 'credit_manager', 'accountant', 'auditor']}>
            <SuspenseWrapper><ReportViewPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },

      // ── UNAUTHORIZED ACCESS FALLBACK ──
      {
        path: '/unauthorized',
        element: (
          <div className="flex flex-col items-center justify-center py-20 font-body">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 text-amber-600">
              <span className="text-3xl">🔒</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-[#0B1F3A]">Access Restricted</h1>
            <p className="mt-2 text-sm text-gray-500 max-w-sm text-center">
              Your role does not possess authorization to access this panel. Please navigate to your permitted dashboard.
            </p>
            <Link
              to="/dashboard"
              className="mt-6 px-6 py-2.5 rounded-[10px] bg-[#D4AF37] hover:bg-[#C9A227] text-white font-semibold text-xs transition-colors shadow-sm"
            >
              Return to Authorized Dashboard
            </Link>
          </div>
        ),
      },
    ],
  },

  // Catch-all
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

export default router;
