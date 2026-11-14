// ──────────────────────────────────────────────────
// Golden Leaf Finance — App Router Configuration
// Strict Role-Based Access Control (RBAC) Routing Engine
// ──────────────────────────────────────────────────

import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, useRouteError } from 'react-router-dom';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from '../components/guards/ProtectedRoute';
import { PageSkeleton } from '../components/ui';
import { useAuthStore } from '../store';

// Auth Pages
import LoginPage from '../modules/auth/LoginPage';
const ForgotPasswordPage = lazy(() => import('../modules/auth/ForgotPasswordPage'));

// Role Dashboards
const AdminDashboard = lazy(() => import('../modules/dashboard/AdminDashboard'));
const BranchDashboard = lazy(() => import('../modules/dashboard/BranchDashboard'));
const CreditDashboard = lazy(() => import('../modules/dashboard/CreditDashboard'));
const AgentDashboard = lazy(() => import('../modules/dashboard/AgentDashboard'));
const HRPayrollDashboardPage = lazy(() => import('../modules/hr/HRPayrollDashboardPage'));

// Admin Modules
const InvestorListPage = lazy(() => import('../modules/investor/InvestorListPage'));
const FDListPage = lazy(() => import('../modules/fd/FDListPage'));
const FDRateSlabPage = lazy(() => import('../modules/fd/FDRateSlabPage'));
const FDReferralPage = lazy(() => import('../modules/fd/FDReferralPage'));
const BusinessLoanPage = lazy(() => import('../modules/loans/business/BusinessLoanPage'));
const GoldLoanPage = lazy(() => import('../modules/loans/gold/GoldLoanPage'));
const BranchListPage = lazy(() => import('../modules/branch/BranchListPage'));
const BranchDashboardPage = lazy(() => import('../modules/branch/BranchDashboardPage'));
const EmployeeListPage = lazy(() => import('../modules/employee/EmployeeListPage'));
const SystemMonitoringPage = lazy(() => import('../modules/monitoring/SystemMonitoringPage'));
const AuditLogPage = lazy(() => import('../modules/audit/AuditLogPage'));
const SettingsPage = lazy(() => import('../modules/settings/SettingsPage'));

// Admin Monitoring Pages
const CustomerMonitoringPage = lazy(() => import('../modules/customer/CustomerMonitoringPage'));
const LoanMonitoringPage = lazy(() => import('../modules/loan/LoanMonitoringPage'));
const SanctionLetterPage = lazy(() => import('../modules/loan/SanctionLetterPage'));
const CollectionMonitoringPage = lazy(() => import('../modules/collection/CollectionMonitoringPage'));
const AttendanceMonitoringPage = lazy(() => import('../modules/attendance/AttendanceMonitoringPage'));

// Admin Roles & Security Pages
const RolesPermissionsPage = lazy(() => import('../modules/employee/RolesPermissionsPage'));
const StaffProfileManagementPage = lazy(() => import('../modules/admin/StaffProfileManagementPage'));
const CompensationManagementPage = lazy(() => import('../modules/admin/CompensationManagementPage'));
const MyPayslipsPage = lazy(() => import('../modules/employee/MyPayslipsPage'));
const SecurityPage = lazy(() => import('../modules/settings/SecurityPage'));

// Branch Manager & Operations Modules
const CustomerListPage = lazy(() => import('../modules/customer/CustomerListPage'));
const CustomerProfilePage = lazy(() => import('../modules/customer/CustomerProfilePage'));
const CustomerRegistrationPage = lazy(() => import('../modules/customer/CustomerRegistrationPage'));
const ClientManagementDashboard = lazy(() => import('../modules/customer/ClientManagementDashboard'));
const CollectionGroupsPage = lazy(() => import('../modules/collection/CollectionGroupsPage'));
const DailyClosingPage = lazy(() => import('../modules/collection/DailyClosingPage'));
const PrintingPage = lazy(() => import('../modules/printing/PrintingPage'));

// Credit Manager Verification Module
const CreditVerificationPage = lazy(() => import('../modules/approval/CreditVerificationPage'));
const ApprovalQueuePage = lazy(() => import('../modules/approval/ApprovalQueuePage'));

// Collections Modules (Weekly, Advance, Pending, History, Dashboard)
const CollectionsDashboard = lazy(() => import('../modules/collection/CollectionsDashboard'));
const WeeklyCollectionPage = lazy(() => import('../modules/collection/WeeklyCollectionPage'));
const AdvanceCollectionPage = lazy(() => import('../modules/collection/AdvanceCollectionPage'));
const PendingCollectionPage = lazy(() => import('../modules/collection/PendingCollectionPage'));
const CollectionListPage = lazy(() => import('../modules/collection/CollectionListPage'));
const DemandCollectionPage = lazy(() => import('../modules/collection/DemandCollectionPage'));
const LateCollectionPage = lazy(() => import('../modules/collection/LateCollectionPage'));
const EODPage = lazy(() => import('../modules/collection/EODPage'));

// Common & Shared Modules
const AttendancePage = lazy(() => import('../modules/attendance/AttendancePage'));
const ReportViewPage = lazy(() => import('../modules/reports/ReportViewPage'));
const ReportsPage = lazy(() => import('../modules/reports/ReportsPage'));
const ClientSearchPage = lazy(() => import('../modules/search/ClientSearchPage'));
const LocateCenterPage = lazy(() => import('../modules/search/LocateCenterPage'));
const ResetPasswordPage = lazy(() => import('../modules/employee/ResetPasswordPage'));

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
  const isChunkError =
    error?.message &&
    (/Failed to fetch dynamically imported module/i.test(error.message) ||
     /Loading chunk/i.test(error.message) ||
     /Importing a module script failed/i.test(error.message));

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] py-16 px-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-[#D4AF37]">
        <AlertTriangle size={32} />
      </div>
      <h3 className="text-xl font-bold text-[#0F1F38] tracking-tight mb-2">
        {isChunkError ? 'New Update Available' : 'Something went wrong'}
      </h3>
      <p className="text-sm text-[#64748B] text-center max-w-md mb-6">
        {isChunkError
          ? 'A newer version of this module has been deployed. Please reload the page to load the latest update.'
          : error?.message || 'An unexpected error occurred while loading this page.'}
      </p>
      <button
        onClick={handleRefresh}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#b89528] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
      >
        <RefreshCcw size={16} />
        Reload Page
      </button>
    </div>
  );
};

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
);

const RootRoute: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) {
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
            <a
              href="/dashboard"
              className="mt-6 px-6 py-2.5 rounded-[10px] bg-[#D4AF37] hover:bg-[#C9A227] text-white font-semibold text-xs transition-colors shadow-sm"
            >
              Return to Authorized Dashboard
            </a>
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
