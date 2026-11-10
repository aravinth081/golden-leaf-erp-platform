import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css';
import './lib/i18n';
import App from './App';

// Auto-reload on dynamic import chunk error (handles Vite content hash updates across builds)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error detected, reloading page to fetch latest version...', event);
  window.location.reload();
});

window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason &&
    (event.reason.name === 'ChunkLoadError' ||
     /Failed to fetch dynamically imported module/i.test(event.reason.message || '') ||
     /Importing a module script failed/i.test(event.reason.message || ''))
  ) {
    const key = 'chunk_reload_count';
    const lastReload = sessionStorage.getItem(key);
    if (!lastReload || Date.now() - Number(lastReload) > 10000) {
      sessionStorage.setItem(key, String(Date.now()));
      window.location.reload();
    }
  }
});

// Auto-purge legacy mock/dummy data from browser storage across all roles
(() => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;

    const MASTER_PURGE_KEY = 'glf_total_clean_all_roles_v20261108_manual_entry_master';
    const isCleaned = localStorage.getItem(MASTER_PURGE_KEY);

    const ALL_MOCK_STORAGE_KEYS = [
      'glf_monitored_customers_master',
      'glf_monitored_loans_master',
      'glf_monitored_collections_master',
      'glf_collection_groups_master',
      'glf_gps_attendance_records',
      'glf_resignation_records_v2',
      'glf_business_loans_v2',
      'glf_cro_gold_referrals_v1',
      'glf_gold_loans_v1',
      'glf_credit_manager_applicants_v5',
      'glf_leave_od_records_v12',
      'glf_eod_settlement_records_v2',
      'glf_fixed_deposits_cache_v1',
      'glf_fd_referrals_cache_v1',
      'glf_investors_master',
      'glf_investors_cache',
      'golden_leaf_roles_user_accounts_master',
      'glf_all_registered_clients_v1',
      'glf_customers_cache',
      'glf_customer_vault',
      // HR & Payroll keys
      'glf_hr_salary_revisions_master',
      'glf_hr_payroll_runs_master',
      'glf_hr_payroll_slips_master',
      'glf_hr_bank_change_requests_master',
      'glf_hr_statutory_filings_master',
      'glf_hr_expenses_master',
      'glf_hr_fnf_settlements_master',
      'glf_hr_hiring_sandbox_master',
      'glf_hr_esop_master',
      'glf_hr_payroll_journal_master',
      'glf_hr_immutable_audit_trail_master',
      'glf_hr_locked_periods_master',
      'glf_hr_retroactive_arrears_master',
      'glf_hr_employee_doc_vaults_master',
      'glf_payroll_runs_master',
      'glf_hr_payroll_runs',
      'glf_hr_payroll_slips',
      'glf_salary_revisions_master',
      'glf_employee_kyc_vaults',
    ];

    if (!isCleaned) {
      ALL_MOCK_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));

      // Sanitize employee storage
      ['glf_pdf_strict_employees_master', 'glf_employees_cache'].forEach((k) => {
        const item = localStorage.getItem(k);
        if (item) {
          try {
            const list = JSON.parse(item);
            if (Array.isArray(list)) {
              const mockIds = [
                'EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005',
                'EMP-006', 'EMP-007', 'EMP-008', 'EMP-009', 'EMP-010',
              ];
              const mockNames = [
                'Sundaram', 'Karthik Raja', 'Priya Dharshini', 'Suresh Kumar',
                'Priya Sharma', 'Amit Das', 'Ramesh V.', 'Arun P.', 'K. Marimuthu',
                'Sunita Raman', 'Ravi Kumar',
              ];
              const cleaned = list.filter(
                (e: any) =>
                  !mockIds.includes(e.id) &&
                  !mockNames.some((n) => e.name?.includes(n))
              );
              localStorage.setItem(k, JSON.stringify(cleaned));
            }
          } catch {}
        }
      });

      // Sanitize branches
      const branchRaw = localStorage.getItem('golden_leaf_branches_master');
      if (branchRaw) {
        try {
          const branches = JSON.parse(branchRaw);
          if (Array.isArray(branches)) {
            const cleanBranches = branches.map((b: any) => ({
              ...b,
              totalEmployees: 0,
              activeEmployees: 0,
              presentEmployees: 0,
              absentEmployees: 0,
              attendancePercentage: 0,
              totalCustomers: 0,
              newCustomers: 0,
              activeCustomers: 0,
              pendingVerificationCustomers: 0,
              totalLoanApplications: 0,
              activeLoans: 0,
              pendingLoans: 0,
              approvedLoans: 0,
              rejectedLoans: 0,
              todayCollection: 0,
              weeklyCollection: 0,
              monthlyCollection: 0,
              pendingCollection: 0,
              totalCollectionAmount: 0,
              monthlyTrend: [],
              recentActivities: [],
              attendanceRecords: [],
              agentPerformance: [],
              pendingLoansList: [],
              disbursedLoansList: [],
            }));
            localStorage.setItem('golden_leaf_branches_master', JSON.stringify(cleanBranches));
          }
        } catch {}
      }

      localStorage.setItem(MASTER_PURGE_KEY, 'true');
    }
  } catch (e) {
    console.warn('Startup storage purge error:', e);
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)