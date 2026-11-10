// ──────────────────────────────────────────────────
// Golden Leaf Finance — HR & Payroll Finance Enterprise Suite
// Corporate Module for HR & Payroll Finance Manager and Admin
// Complete RBAC, Maker-Checker Segregation, Effective-Dating,
// F&F Offboarding Revocation Guard, Statutory Filings & Audit Logs
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, CreditCard, Building2, Calendar, FileText, CheckCircle2,
  AlertTriangle, Lock, Unlock, Download, Plus, Search, ShieldCheck,
  TrendingUp, Clock, DollarSign, ChevronRight, Check, X, ShieldAlert,
  Percent, ArrowRight, Eye, Briefcase, FileCheck, Layers, Landmark, RotateCcw,
  Calculator, Sliders, UserCheck, FileSpreadsheet, UploadCloud
} from 'lucide-react';
import { PageHeader } from '../../components/ui';
import { useAuthStore, useUIStore } from '../../store';
import {
  getSalaryRevisions,
  getActiveSalary,
  createSalaryRevision,
  getPayrollRuns,
  getPayrollSlips,
  initiateDraftPayrollRun,
  approvePayrollRun,
  generateBankTransferFile,
  isPeriodLocked,
  lockPayrollPeriod,
  getStatutoryFilings,
  getExpenses,
  submitExpenseClaim,
  financeFinalApproveExpense,
  getFnFSettlements,
  createFnFSettlement,
  updateOffboardingChecklist,
  disburseFnFSettlement,
  getHiringProjections,
  getEsopGrants,
  getPayrollJournalEntries,
  getHRAuditLogs,
  getBankChangeRequests,
  requestBankDetailChange,
  approveBankDetailChange,
  getEmployeeDocVault,
  getAllEmployeeDocVaults,
  saveEmployeeDocVault,
  getEnrolledEmployees,
  clearHRMockData,
  purgeLegacyMockData,
} from '../../services/hrPayrollService';
import { MakerCheckerViolationError } from '../../services/makerCheckerService';
import type {
  SalaryRevision,
  PayrollRun,
  PayrollSlip,
  StatutoryFiling,
  ExpenseClaim,
  FnFSettlement,
  HiringProjection,
  EsopGrant,
  PayrollJournalEntry,
  HRAuditLogEntry,
  BankDetailChangeRequest,
  DocumentVault,
  CostCenter,
  EmploymentType,
  BgvStatus,
} from '../../types/hrPayroll.types';
import { hasPermission } from '../../types/auth.types';

export const HRPayrollDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const userRole = user?.customClaims?.role || 'admin';
  const userId = user?.uid || 'user-unknown';

  // Active Top-Level Navigation Tab
  const [activeTab, setActiveTab] = useState<
    'runs' | 'ctc' | 'kyc' | 'compliance' | 'exit' | 'expenses' | 'sandbox' | 'ledger'
  >('runs');

  // Core Data States
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [slips, setSlips] = useState<PayrollSlip[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [salaries, setSalaries] = useState<SalaryRevision[]>([]);
  const [filings, setFilings] = useState<StatutoryFiling[]>([]);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [fnfList, setFnfList] = useState<FnFSettlement[]>([]);
  const [projections, setProjections] = useState<HiringProjection[]>([]);
  const [esops, setEsops] = useState<EsopGrant[]>([]);
  const [journalEntries, setJournalEntries] = useState<PayrollJournalEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<HRAuditLogEntry[]>([]);
  const [bankRequests, setBankRequests] = useState<BankDetailChangeRequest[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showBankChangeModal, setShowBankChangeModal] = useState(false);
  const [showFnFModal, setShowFnFModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Form states
  const [draftPeriod, setDraftPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [enrolledEmployees, setEnrolledEmployees] = useState<
    Array<{ id: string; name: string; branchId: string; designation: string }>
  >([]);
  const [docVaults, setDocVaults] = useState<Record<string, DocumentVault>>({});

  const [salaryForm, setSalaryForm] = useState({
    employeeId: '',
    designation: '',
    costCenter: 'Operations' as CostCenter,
    employmentType: 'full_time' as EmploymentType,
    ctcAnnual: 0,
    baseMonthly: 0,
    hraMonthly: 0,
    specialAllowance: 0,
    variablePayMonthly: 0,
    revisionReason: '',
  });

  const [vaultForm, setVaultForm] = useState<{
    employeeId: string;
    panNumber: string;
    panVerified: boolean;
    aadhaarNumber: string;
    aadhaarVerified: boolean;
    bgvStatus: BgvStatus;
    employmentType: EmploymentType;
    costCenter: CostCenter;
    offerLetterUrl: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  }>({
    employeeId: '',
    panNumber: '',
    panVerified: false,
    aadhaarNumber: '',
    aadhaarVerified: false,
    bgvStatus: 'pending',
    employmentType: 'full_time',
    costCenter: 'Operations',
    offerLetterUrl: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    accountHolderName: '',
  });

  const [bankForm, setBankForm] = useState({
    employeeId: '',
    employeeName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    accountHolderName: '',
    proposedAccountNumber: '',
    proposedIfsc: '',
    proposedBankName: '',
    proposedHolderName: '',
  });

  const [fnfForm, setFnfForm] = useState({
    employeeId: '',
    employeeName: '',
    resignationDate: new Date().toISOString().split('T')[0],
    lastWorkingDay: new Date().toISOString().split('T')[0],
    gratuityAmount: 0,
    leaveEncashmentAmount: 0,
    noticePeriodRecovery: 0,
    unpaidSalary: 0,
  });

  const [expenseForm, setExpenseForm] = useState({
    employeeId: '',
    employeeName: '',
    branchId: 'BR-01',
    category: 'travel' as ExpenseClaim['category'],
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    hasGstItc: true,
    gstin: '33AAAAA0000A1Z5',
  });

  // Startup Hiring Sandbox Runway Simulator State (Page 2 Specification)
  const [simHires, setSimHires] = useState(5);
  const [simSalary, setSimSalary] = useState(50000);
  const [simDepartment, setSimDepartment] = useState<CostCenter>('Tech');
  const [simRunwayCash, setSimRunwayCash] = useState(8000000);
  const [simCurrentBurn, setSimCurrentBurn] = useState(400000);

  // Load all data
  const refreshData = () => {
    purgeLegacyMockData();
    const loadedRuns = getPayrollRuns();
    setRuns(loadedRuns);
    if (loadedRuns.length > 0) {
      const activeRunId = selectedRunId && loadedRuns.some((r) => r.id === selectedRunId)
        ? selectedRunId
        : loadedRuns[0].id;
      if (selectedRunId !== activeRunId) {
        setSelectedRunId(activeRunId);
      }
      setSlips(getPayrollSlips(activeRunId));
    } else {
      if (selectedRunId !== '') {
        setSelectedRunId('');
      }
      setSlips([]);
    }
    setSalaries(getSalaryRevisions());
    setFilings(getStatutoryFilings());
    setExpenses(getExpenses());
    setFnfList(getFnFSettlements());
    setProjections(getHiringProjections());
    setEsops(getEsopGrants());
    setJournalEntries(getPayrollJournalEntries());
    setAuditLogs(getHRAuditLogs());
    setBankRequests(getBankChangeRequests());
    setEnrolledEmployees(getEnrolledEmployees());
    setDocVaults(getAllEmployeeDocVaults());
  };

  useEffect(() => {
    purgeLegacyMockData();
    refreshData();
  }, [selectedRunId]);

  // Handle draft payroll initiation
  const handleInitiateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const activeEnrolled = getEnrolledEmployees();
      if (activeEnrolled.length === 0) {
        addToast({
          type: 'error',
          title: 'No Enrolled Employees',
          message:
            'Cannot initiate payroll: No enrolled employees found in Employee Master. Please add employees in Employee Management first.',
        });
        return;
      }

      const payrollEmployees = activeEnrolled.map((emp) => {
        const activeSal = getActiveSalary(emp.id);
        const vault = docVaults[emp.id] || getEmployeeDocVault(emp.id);
        const base = activeSal?.baseMonthly || 30000;
        const hra = activeSal?.hraMonthly || Math.round(base * 0.4);
        const allowance = activeSal?.specialAllowance || 5000;
        const variable = activeSal?.variablePayMonthly || 0;

        return {
          id: emp.id,
          name: emp.name,
          branchId: emp.branchId,
          designation: activeSal?.designation || emp.designation,
          costCenter: activeSal?.costCenter || vault?.costCenter || 'Operations',
          employmentType: activeSal?.employmentType || vault?.employmentType || 'full_time',
          baseMonthly: base,
          hraMonthly: hra,
          specialAllowance: allowance,
          variableIncentive: variable,
          lopDays: 0,
        };
      });

      const { run } = initiateDraftPayrollRun(draftPeriod, payrollEmployees, user);
      addToast({
        type: 'success',
        title: 'Draft Payroll Initiated',
        message: `Draft cycle ${run.period} created for ${run.totalEmployees} employees (Gross ₹${run.grossPayout.toLocaleString('en-IN')}).`,
      });
      setShowDraftModal(false);
      setSelectedRunId(run.id);
      refreshData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Initiation Failed', message: err.message });
    }
  };

  // Handle KYC Document Vault & BGV save
  const handleSaveDocVault = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !vaultForm.employeeId) return;
    try {
      saveEmployeeDocVault(
        vaultForm.employeeId,
        {
          employeeId: vaultForm.employeeId,
          panNumber: vaultForm.panNumber,
          panVerified: vaultForm.panVerified,
          aadhaarNumber: vaultForm.aadhaarNumber,
          aadhaarVerified: vaultForm.aadhaarVerified,
          offerLetterUrl: vaultForm.offerLetterUrl || undefined,
          issuedDate: new Date().toISOString().split('T')[0],
          bgvStatus: vaultForm.bgvStatus,
          employmentType: vaultForm.employmentType,
          costCenter: vaultForm.costCenter,
          bankDetails: {
            accountNumber: vaultForm.accountNumber || '9182374981723',
            ifscCode: vaultForm.ifscCode || 'HDFC0001234',
            bankName: vaultForm.bankName || 'HDFC Bank',
            accountHolderName: vaultForm.accountHolderName || 'Employee',
            status: 'approved',
            approvedBy: user.uid,
            approvedAt: new Date().toISOString(),
          },
        },
        user
      );
      addToast({
        type: 'success',
        title: 'KYC Vault & BGV Status Updated',
        message: `Digital vault for ${vaultForm.employeeId} saved with BGV status: ${vaultForm.bgvStatus.toUpperCase()} and Cost Center: ${vaultForm.costCenter}.`,
      });
      setShowVaultModal(false);
      refreshData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Failed', message: err.message });
    }
  };

  // Handle new expense submission
  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      submitExpenseClaim(
        {
          employeeId: expenseForm.employeeId,
          employeeName: expenseForm.employeeName,
          branchId: expenseForm.branchId,
          category: expenseForm.category,
          amount: expenseForm.amount,
          description: expenseForm.description,
          date: expenseForm.date,
          hasGstItc: expenseForm.hasGstItc,
          gstin: expenseForm.gstin,
        },
        user
      );
      addToast({
        type: 'success',
        title: 'Expense Claim Queued',
        message: 'Expense submitted with GL categorization and GST input tax credit calculation.',
      });
      setShowExpenseModal(false);
      refreshData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Submission Blocked', message: err.message });
    }
  };

  // Handle audit-ready compliance register export
  const handleExportComplianceRegister = () => {
    try {
      const rows = [
        '--- GOLDEN LEAF FINANCE STATUTORY COMPLIANCE REGISTER & TAX AUDIT ---',
        `Generated: ${new Date().toISOString()} (UTC)`,
        `Authority: HR & Payroll Finance Manager (${userId})`,
        '',
        '1. STATUTORY FILINGS SCHEDULE & CHALLANS:',
        ...filings.map(
          (f) =>
            `- [${f.status.toUpperCase()}] ${f.type} (Period: ${f.period}) | Due Date: ${f.dueDate} | Amount: Rs. ${f.totalAmount}`
        ),
        '',
        '2. TDS & SECTION 194J/194C WITHHOLDING AUDIT BREAKDOWN:',
        ...slips.map(
          (s) =>
            `- Employee: ${s.employeeName} (${s.employeeId}) | Type: ${s.employmentType || 'full_time'} | Gross: Rs. ${s.proRataGross} | TDS: Rs. ${s.tdsDeduction} | PF: Rs. ${s.pfDeduction} | PT: Rs. ${s.ptDeduction}`
        ),
        '',
        '--- END OF COMPLIANCE REGISTER ---',
      ].join('\n');

      const blob = new Blob([rows], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `GLF_STATUTORY_COMPLIANCE_REGISTER_${draftPeriod}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast({
        type: 'success',
        title: 'Compliance Register Exported',
        message: 'Audit-ready statutory register with TDS/194J/PF/ESI data exported.',
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Export Failed', message: err.message });
    }
  };

  // Handle payroll approval with Maker-Checker verification
  const handleApproveRun = (runId: string) => {
    if (!user) return;
    try {
      approvePayrollRun(runId, user);
      addToast({
        type: 'success',
        title: 'Payroll Approved',
        message: 'Draft payroll approved and posted to General Ledger accounts.',
      });
      refreshData();
    } catch (err: any) {
      if (err instanceof MakerCheckerViolationError || err.statusCode === 403) {
        addToast({
          type: 'error',
          title: 'Maker-Checker Blocked (403)',
          message: err.message,
        });
      } else {
        addToast({ type: 'error', title: 'Approval Blocked', message: err.message });
      }
    }
  };

  // Handle period lock
  const handleLockPeriod = (period: string) => {
    if (!user) return;
    try {
      lockPayrollPeriod(period, user);
      addToast({
        type: 'warning',
        title: 'Period Hard-Locked',
        message: `Payroll cycle ${period} has been sealed. Edits to attendance and salary for this cycle are now locked.`,
      });
      refreshData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lock Error', message: err.message });
    }
  };

  // Handle NEFT bank export
  const handleExportBankTransfer = (runId: string) => {
    try {
      const fileData = generateBankTransferFile(runId);
      const blob = new Blob([fileData], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `GLF_NEFT_TRANSFER_${selectedRun?.period || 'BATCH'}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast({
        type: 'success',
        title: 'NEFT Transfer File Generated',
        message: 'RBI-compliant batch transfer file exported successfully.',
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Export Failed', message: err.message });
    }
  };

  // Handle Effective-Dated Salary Revision
  const handleCreateSalaryRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      createSalaryRevision(salaryForm, user);
      addToast({
        type: 'success',
        title: 'Salary Revision Enacted',
        message: `New effective-dated revision recorded for ${salaryForm.employeeId}. Previous records preserved in history.`,
      });
      setShowSalaryModal(false);
      refreshData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Revision Blocked', message: err.message });
    }
  };

  // Handle Bank Detail Change Request (Maker)
  const handleRequestBankChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      requestBankDetailChange(
        {
          employeeId: bankForm.employeeId,
          employeeName: bankForm.employeeName,
          currentBank: {
            accountNumber: bankForm.accountNumber,
            ifscCode: bankForm.ifscCode,
            bankName: bankForm.bankName,
            accountHolderName: bankForm.accountHolderName,
          },
          proposedBank: {
            accountNumber: bankForm.proposedAccountNumber,
            ifscCode: bankForm.proposedIfsc,
            bankName: bankForm.proposedBankName,
            accountHolderName: bankForm.proposedHolderName,
          },
        },
        user
      );
      addToast({
        type: 'info',
        title: 'Bank Change Queued for Checker',
        message: 'Proposed account details flagged for secondary checker approval.',
      });
      setShowBankChangeModal(false);
      refreshData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Request Failed', message: err.message });
    }
  };

  // Handle Bank Detail Approval (Checker)
  const handleApproveBankChange = (requestId: string) => {
    if (!user) return;
    try {
      approveBankDetailChange(requestId, user);
      addToast({
        type: 'success',
        title: 'Bank Change Verified & Approved',
        message: 'Employee payout account updated in Document Vault.',
      });
      refreshData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Checker Blocked (403)',
        message: err.message,
      });
    }
  };

  // Handle Final Expense Approval
  const handleFinanceApproveExpense = (expenseId: string) => {
    if (!user) return;
    try {
      financeFinalApproveExpense(expenseId, 'GL-6100-STAFF-REIMBURSEMENT', user);
      addToast({
        type: 'success',
        title: 'Expense Final Approved',
        message: 'Reimbursement passed finance audit with GL categorization.',
      });
      refreshData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Approval Blocked', message: err.message });
    }
  };

  // Handle F&F Creation
  const handleCreateFnF = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    createFnFSettlement(fnfForm, user);
    addToast({
      type: 'info',
      title: 'F&F Settlement Created',
      message: 'Settlement created with pending IT/Admin offboarding checklist.',
    });
    setShowFnFModal(false);
    refreshData();
  };

  // Handle F&F Checklist Update (Admin only)
  const handleToggleChecklist = (
    fnfId: string,
    current: FnFSettlement['offboardingChecklist'],
    field: 'laptopRevoked' | 'dbCredentialsRevoked' | 'financialAccessRevoked'
  ) => {
    if (!user) return;
    try {
      const updated = {
        laptopRevoked: field === 'laptopRevoked' ? !current.laptopRevoked : current.laptopRevoked,
        dbCredentialsRevoked:
          field === 'dbCredentialsRevoked' ? !current.dbCredentialsRevoked : current.dbCredentialsRevoked,
        financialAccessRevoked:
          field === 'financialAccessRevoked'
            ? !current.financialAccessRevoked
            : current.financialAccessRevoked,
      };
      updateOffboardingChecklist(fnfId, updated, user);
      addToast({
        type: 'info',
        title: 'Offboarding Checklist Updated',
        message: 'Revocation state updated for security compliance.',
      });
      refreshData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Admin Required (403)', message: err.message });
    }
  };

  // Handle F&F Disbursal
  const handleDisburseFnF = (fnfId: string) => {
    if (!user) return;
    try {
      disburseFnFSettlement(fnfId, user);
      addToast({
        type: 'success',
        title: 'F&F Settlement Disbursed',
        message: 'Final dues cleared following complete asset revocation.',
      });
      refreshData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Payout Blocked (403)', message: err.message });
    }
  };

  const selectedRun = runs.find((r) => r.id === selectedRunId) || runs[0];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Executive Suite Header */}
      <PageHeader
        title="HR & Payroll Finance Module"
        subtitle="Corporate-wide HR Master, Maker-Checker Payroll Engine, Statutory Compliance & Period Locks"
        badge="Company-Wide Authority"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDraftModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0B1F3A] to-[#15345E] text-white font-bold text-xs shadow-md border border-[#D4AF37]/40 hover:brightness-110 transition-all cursor-pointer"
            >
              <Plus size={16} />
              Initiate Draft Payroll
            </button>
            <button
              onClick={() => setShowSalaryModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <DollarSign size={16} />
              Salary Revision
            </button>
            <button
              onClick={() => {
                if (window.confirm('Reset all HR/Payroll data to start fresh with clean empty records?')) {
                  clearHRMockData();
                  setSelectedRunId('');
                  setSlips([]);
                  setRuns([]);
                  refreshData();
                  addToast({
                    type: 'info',
                    title: 'HR Storage Cleared',
                    message: 'All local HR and payroll records have been cleanly reset.',
                  });
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all cursor-pointer border border-slate-200"
              title="Clear all local HR/Payroll records"
            >
              <RotateCcw size={14} />
              Reset Data
            </button>
          </div>
        }
      />

      {/* Tab Navigation Pill Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-slate-200">
        {[
          { id: 'runs', label: 'Payroll Runs & Slips', icon: CreditCard },
          { id: 'ctc', label: 'CTC & Revisions (Effective Dating)', icon: DollarSign },
          { id: 'kyc', label: 'KYC Vault & Bank Maker-Checker', icon: Landmark },
          { id: 'compliance', label: 'Statutory Taxes & Filings', icon: FileCheck },
          { id: 'exit', label: 'Attendance & F&F Exit', icon: Clock },
          { id: 'expenses', label: 'Expenses & Reimbursements', icon: Briefcase },
          { id: 'sandbox', label: 'Hiring Sandbox & ESOPs', icon: TrendingUp },
          { id: 'ledger', label: 'Payroll Journal & Audit Logs', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#0B1F3A] text-white shadow-sm border border-[#D4AF37]/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-transparent'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-[#D4AF37]' : 'text-slate-400'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ────────────────────────────────────────────────── */}
      {/* TAB 1: PAYROLL RUNS & DRAFT APPROVAL (MAKER-CHECKER) */}
      {/* ────────────────────────────────────────────────── */}
      {activeTab === 'runs' && (
        <div className="space-y-6">
          {runs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3">
                <CreditCard size={26} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Payroll Runs Initiated</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                No active payroll cycle exists yet. Click below to initiate a draft payroll run for enrolled employees.
              </p>
              <button
                onClick={() => setShowDraftModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#15345E] text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                <Plus size={15} />
                Initiate Draft Payroll
              </button>
            </div>
          ) : (
            <>
              {/* Cycle Selector & Status Header */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {runs.map((r) => {
                  const isSelected = r.id === selectedRunId;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRunId(r.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#0B1F3A] to-[#15345E] text-white border-[#D4AF37]/60 shadow-lg'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                          Cycle {r.period}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                            r.status === 'locked'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : r.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="text-xl font-bold font-display tracking-tight">
                          ₹{r.netPayout.toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs opacity-75 mt-0.5">
                          {r.totalEmployees} Employees • Mode: {r.payoutMode}
                        </div>
                      </div>
                      <div className="mt-2.5 text-[10px] opacity-60 flex items-center gap-1">
                        <span>Maker: {r.initiatedBy.slice(0, 10)}</span>
                        {r.approvedBy && <span>• Checker: {r.approvedBy.slice(0, 10)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Toolbar for Selected Run */}
              {selectedRun && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-bold">
                      {selectedRun.period}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Payroll Run: {selectedRun.period} ({selectedRun.status.toUpperCase()})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Gross: ₹{selectedRun.grossPayout.toLocaleString('en-IN')} • Deductions (TDS/PF/ESI/PT): ₹
                        {selectedRun.totalDeductions.toLocaleString('en-IN')} • Net: ₹
                        {selectedRun.netPayout.toLocaleString('en-IN')}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] flex-wrap">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          Fixed Burn: <strong className="text-blue-700">₹{(selectedRun.fixedBurn || (selectedRun.grossPayout - (selectedRun.variableIncentiveTotal || 0))).toLocaleString('en-IN')}</strong>
                        </span>
                        <span className="font-semibold text-slate-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Variable Incentives: <strong className="text-amber-800">₹{(selectedRun.variableIncentiveTotal || 0).toLocaleString('en-IN')}</strong>
                        </span>
                        <span className="text-[10px] text-slate-500">
                          • One-click pro-rata for joiners/leavers & LOP days integrated
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {selectedRun.status === 'draft' && (
                      <button
                        onClick={() => handleApproveRun(selectedRun.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                        title="Segregated Checker action: Cannot approve if you initiated this draft run"
                      >
                        <CheckCircle2 size={15} />
                        Approve & Post (Checker Step)
                      </button>
                    )}

                    {selectedRun.status === 'approved' && (
                      <>
                        <button
                          onClick={() => handleExportBankTransfer(selectedRun.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold text-xs transition-all cursor-pointer"
                        >
                          <Download size={14} />
                          Export NEFT File
                        </button>
                        <button
                          onClick={() => handleLockPeriod(selectedRun.period)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-xs transition-all cursor-pointer"
                        >
                          <Lock size={14} />
                          Hard-Lock Period
                        </button>
                      </>
                    )}

                    {selectedRun.status === 'locked' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-300 text-xs font-bold">
                        <Lock size={14} /> Period Sealed & Locked
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Payslips Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Payslips & Pro-Rata Deductions ({slips.length})
                  </h4>
                  <div className="text-xs text-slate-500">
                    Formula: (Gross / 30) × (30 - LOP Days) + Arrears - Statutory Deductions
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Cost Center & Type</th>
                        <th className="py-3 px-4">Designation</th>
                        <th className="py-3 px-4">Days / LOP</th>
                        <th className="py-3 px-4">Base + HRA</th>
                        <th className="py-3 px-4">Variable Pay</th>
                        <th className="py-3 px-4">Arrears</th>
                        <th className="py-3 px-4">Deductions (PF/ESI/PT/TDS)</th>
                        <th className="py-3 px-4 text-right">Net Payout</th>
                        <th className="py-3 px-4">Bank & IFSC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {slips.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                            No payslips generated for this cycle.
                          </td>
                        </tr>
                      ) : (
                        slips.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{s.employeeName}</div>
                              <div className="text-[10px] text-slate-400">
                                {s.employeeId} • {s.branchId}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col gap-1 items-start">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  {s.costCenter || 'Operations'}
                                </span>
                                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                                  {s.employmentType === 'consultant' ? 'Consultant/1099' : s.employmentType === 'intern' ? 'Intern' : 'Full-time'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{s.designation}</td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-800">{s.workingDays} / 30</span>
                              {s.lopDays > 0 && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                  {s.lopDays} LOP
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-800">
                                ₹{(s.baseMonthly + s.hraMonthly).toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-amber-800">
                              {s.variableIncentive && s.variableIncentive > 0 ? (
                                `₹${s.variableIncentive.toLocaleString('en-IN')}`
                              ) : (
                                <span className="text-slate-300 font-normal">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {s.arrears > 0 ? (
                                <span className="text-emerald-600 font-bold">
                                  +₹{s.arrears.toLocaleString('en-IN')}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {s.employmentType === 'consultant' ? (
                                <span className="text-amber-800 font-medium">Sec 194J TDS: ₹{s.tdsDeduction} (PF/ESI Exempt)</span>
                              ) : (
                                <span>PF: ₹{s.pfDeduction} • ESI: ₹{s.esiDeduction} • PT: ₹{s.ptDeduction} • TDS: ₹{s.tdsDeduction}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-700 text-sm">
                              ₹{s.netSalary.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                              {s.bankIfsc} • {s.bankAccountNumber.slice(-4)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────── */}
      {/* TAB 2: CTC & SALARY BUILDER (EFFECTIVE DATING)      */}
      {/* ────────────────────────────────────────────────── */}
      {activeTab === 'ctc' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                CTC Structure Builder & Salary Revisions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage structured compensation packages and track historical revisions.
              </p>
            </div>
            <button
              onClick={() => setShowSalaryModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#15345E] text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              <Plus size={15} />
              Enact Revision
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Cost Center</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Annual CTC</th>
                    <th className="py-3 px-4">Monthly Base</th>
                    <th className="py-3 px-4">HRA + Allowances</th>
                    <th className="py-3 px-4">Variable Pay</th>
                    <th className="py-3 px-4">Effective Dates</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Revision Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salaries.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400 text-xs">
                        No effective-dated salary records found. Click &quot;Enact Revision&quot; to configure employee compensation structures.
                      </td>
                    </tr>
                  ) : (
                    salaries.map((sal) => {
                      const isActive = sal.effectiveTo === null;
                      return (
                        <tr key={sal.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{sal.employeeId}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {sal.costCenter || 'Operations'}
                            </span>
                          </td>
                          <td className="py-3 px-4 uppercase text-[10px] font-semibold text-slate-600">
                            {sal.employmentType === 'consultant' ? 'Consultant' : sal.employmentType === 'intern' ? 'Intern' : 'Full-Time'}
                          </td>
                          <td className="py-3 px-4 text-slate-700">{sal.designation}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            ₹{sal.ctcAnnual.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-slate-700">₹{sal.baseMonthly.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-slate-600">
                            ₹{(sal.hraMonthly + sal.specialAllowance).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 font-semibold text-amber-800">
                            ₹{(sal.variablePayMonthly || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                            {sal.effectiveFrom} → {sal.effectiveTo || 'Present (Active)'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              {isActive ? 'Active' : 'Archived'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 italic">{sal.revisionReason}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────── */}
      {/* TAB 3: KYC VAULT & BANK MAKER-CHECKER              */}
      {/* ────────────────────────────────────────────────── */}
      {activeTab === 'kyc' && (
        <div className="space-y-6">
          {/* Digital Onboarding Document Vault & BGV Status Tracker */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Digital Onboarding Document Vault & BGV Status Tracker
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Digital vault for PAN, Aadhaar, Bank Details, and Offer Letter. Background Verification (BGV) status tracking across all corporate branches.
              </p>
            </div>
            <button
              onClick={() => {
                if (enrolledEmployees.length > 0) {
                  const first = enrolledEmployees[0];
                  const vault = docVaults[first.id] || getEmployeeDocVault(first.id);
                  setVaultForm({
                    employeeId: first.id,
                    panNumber: vault?.panNumber || '',
                    panVerified: vault?.panVerified || false,
                    aadhaarNumber: vault?.aadhaarNumber || '',
                    aadhaarVerified: vault?.aadhaarVerified || false,
                    bgvStatus: vault?.bgvStatus || 'pending',
                    employmentType: vault?.employmentType || 'full_time',
                    costCenter: vault?.costCenter || 'Operations',
                    offerLetterUrl: vault?.offerLetterUrl || '',
                    accountNumber: vault?.bankDetails?.accountNumber || '',
                    ifscCode: vault?.bankDetails?.ifscCode || '',
                    bankName: vault?.bankDetails?.bankName || '',
                    accountHolderName: vault?.bankDetails?.accountHolderName || first.name,
                  });
                }
                setShowVaultModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#15345E] text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              <Plus size={15} />
              Onboard Employee / Update Vault
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Corporate Employee Document Vaults & KYC Registry ({enrolledEmployees.length})
              </h4>
              <span className="text-xs text-slate-500">
                Mandatory for Finance Roles: BGV Verification & Cost Center Tagging
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Cost Center</th>
                    <th className="py-3 px-4">Employment Type</th>
                    <th className="py-3 px-4">PAN Details</th>
                    <th className="py-3 px-4">Aadhaar Details</th>
                    <th className="py-3 px-4">Offer Letter</th>
                    <th className="py-3 px-4">BGV Status</th>
                    <th className="py-3 px-4">Bank Payout Info</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrolledEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                        No enrolled employees found. Onboard employees through Employee Management to initialize vaults.
                      </td>
                    </tr>
                  ) : (
                    enrolledEmployees.map((emp) => {
                      const vault = docVaults[emp.id] || getEmployeeDocVault(emp.id);
                      const bgv = vault?.bgvStatus || 'pending';
                      const costCenter = vault?.costCenter || 'Operations';
                      const empType = vault?.employmentType || 'full_time';

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{emp.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {emp.id} • {emp.branchId} • {emp.designation}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {costCenter}
                            </span>
                          </td>
                          <td className="py-3 px-4 uppercase text-[10px] font-semibold text-slate-600">
                            {empType === 'consultant' ? 'Consultant/1099' : empType === 'intern' ? 'Intern' : 'Full-time'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono text-[11px] text-slate-800">
                              {vault?.panNumber || '—'}
                            </div>
                            {vault?.panVerified ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                <Check size={10} /> Verified
                              </span>
                            ) : (
                              <span className="text-[9px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                Unverified
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono text-[11px] text-slate-800">
                              {vault?.aadhaarNumber ? `•••• •••• ${vault.aadhaarNumber.slice(-4)}` : '—'}
                            </div>
                            {vault?.aadhaarVerified ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                <Check size={10} /> Verified
                              </span>
                            ) : (
                              <span className="text-[9px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                Unverified
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {vault?.offerLetterUrl ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                Archived
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Not Uploaded</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                bgv === 'verified'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                  : bgv === 'in_progress'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-300'
                                  : bgv === 'failed'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-300'
                                  : 'bg-amber-50 text-amber-700 border border-amber-300'
                              }`}
                            >
                              {bgv.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                            {vault?.bankDetails?.bankName ? (
                              <div>
                                <div>{vault.bankDetails.bankName}</div>
                                <div className="text-[10px] text-slate-400">
                                  {vault.bankDetails.ifscCode} • {vault.bankDetails.accountNumber.slice(-4)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">No account configured</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setVaultForm({
                                  employeeId: emp.id,
                                  panNumber: vault?.panNumber || '',
                                  panVerified: vault?.panVerified || false,
                                  aadhaarNumber: vault?.aadhaarNumber || '',
                                  aadhaarVerified: vault?.aadhaarVerified || false,
                                  bgvStatus: bgv,
                                  employmentType: empType,
                                  costCenter: costCenter,
                                  offerLetterUrl: vault?.offerLetterUrl || '',
                                  accountNumber: vault?.bankDetails?.accountNumber || '',
                                  ifscCode: vault?.bankDetails?.ifscCode || '',
                                  bankName: vault?.bankDetails?.bankName || '',
                                  accountHolderName: vault?.bankDetails?.accountHolderName || emp.name,
                                });
                                setShowVaultModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                            >
                              Edit Vault
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Secondary Maker-Checker Section: Bank Account Revisions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Bank Account Revisions & Verification
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and verify employee disbursement account change requests.
              </p>
            </div>
            <button
              onClick={() => setShowBankChangeModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#15345E] text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              <Plus size={15} />
              Submit Bank Revision (Maker)
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Current Account</th>
                    <th className="py-3 px-4">Proposed Account (Diff)</th>
                    <th className="py-3 px-4">Maker (Requested By)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action (Checker)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bankRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No bank detail change requests queued. All employee payout accounts are verified and up to date.
                      </td>
                    </tr>
                  ) : (
                    bankRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{req.employeeName}</div>
                          <div className="text-[10px] text-slate-400">{req.employeeId}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {req.currentBank.bankName} • {req.currentBank.accountNumber} ({req.currentBank.ifscCode})
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-amber-700 bg-amber-50/40 p-2 rounded">
                          {req.proposedBank.bankName} • {req.proposedBank.accountNumber} ({req.proposedBank.ifscCode})
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {req.requestedBy.slice(0, 10)} on {req.requestedAt.slice(0, 10)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              req.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                : 'bg-amber-50 text-amber-700 border border-amber-300'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {req.status === 'pending' && (
                            <button
                              onClick={() => handleApproveBankChange(req.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                            >
                              <Check size={12} />
                              Approve (Checker)
                            </button>
                          )}
                          {req.status === 'approved' && (
                            <span className="text-[10px] text-slate-400">Approved by {req.approvedBy?.slice(0, 10)}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────── */}
      {/* TAB 4: STATUTORY TAXES & COMPLIANCE               */}
      {/* ────────────────────────────────────────────────── */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          {(() => {
            const tdsSalaryTotal = slips.filter(s => s.employmentType !== 'consultant').reduce((sum, s) => sum + s.tdsDeduction, 0);
            const contractorTdsTotal = slips.filter(s => s.employmentType === 'consultant').reduce((sum, s) => sum + s.tdsDeduction, 0);
            const pfTotal = filings
              .filter((f) => f.type.toLowerCase().includes('pf') || f.type.toLowerCase().includes('ecr'))
              .reduce((sum, f) => sum + f.totalAmount, 0) || slips.reduce((sum, s) => sum + s.pfDeduction + s.esiDeduction, 0);
            const ptTotal = filings
              .filter((f) => f.type.toLowerCase().includes('pt') || f.type.toLowerCase().includes('tax'))
              .reduce((sum, f) => sum + f.totalAmount, 0) || slips.reduce((sum, s) => sum + s.ptDeduction, 0);

            return (
              <>
                {/* Statutory Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      TDS (Sec 192 Salaries)
                    </span>
                    <div className="text-2xl font-bold font-display text-slate-900 mt-1">
                      ₹{tdsSalaryTotal.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Due on 7th of every month</p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Contractor Withholding (194J/194C)
                    </span>
                    <div className="text-2xl font-bold font-display text-amber-800 mt-1">
                      ₹{contractorTdsTotal.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">10% Professional / 1-2% Contractor</p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      PF (ECR) & ESI Challan
                    </span>
                    <div className="text-2xl font-bold font-display text-slate-900 mt-1">
                      ₹{pfTotal.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Due on 15th of every month</p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Professional Tax (Form 5)
                    </span>
                    <div className="text-2xl font-bold font-display text-slate-900 mt-1">
                      ₹{ptTotal.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Due on 20th of every month</p>
                  </div>
                </div>

                {/* Due-Date Alert Banner */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                    <div>
                      <strong className="font-bold">Statutory Compliance Due-Date Alerts:</strong>
                      <span className="ml-2">
                        Next TDS Challan payment due by <strong>7th</strong> • Next PF/ESI ECR submission due by <strong>15th</strong>.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleExportComplianceRegister}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    <Download size={13} />
                    Export Audit Compliance Register
                  </button>
                </div>

                {/* Balance Sheet Statutory Liabilities Ledger Snapshot */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-3">
                    Balance Sheet Statutory Liabilities Ledger Snapshot
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-slate-500 text-[11px]">2110 - TDS & Withholding Tax Payable</div>
                      <div className="text-lg font-bold text-slate-900 mt-0.5">
                        ₹{(tdsSalaryTotal + contractorTdsTotal).toLocaleString('en-IN')} Cr
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Current Liability (Cleared upon Challan 281 payment)</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-slate-500 text-[11px]">2120 - PF & Statutory Dues Payable</div>
                      <div className="text-lg font-bold text-slate-900 mt-0.5">
                        ₹{pfTotal.toLocaleString('en-IN')} Cr
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Employer + Employee Contribution (Cleared via EPFO portal)</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-slate-500 text-[11px]">2100 - Net Salaries Payable (Bank Clearing)</div>
                      <div className="text-lg font-bold text-slate-900 mt-0.5">
                        ₹{(selectedRun ? selectedRun.netPayout : 0).toLocaleString('en-IN')} Cr
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Disbursal Clearing Account (Zero balance post-NEFT release)</div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Statutory Compliance Calendar & Challans Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Statutory Compliance Calendar & Challans ({filings.length})
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Statutory Type</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Statutory Due Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No statutory filings or challans logged for this period.
                      </td>
                    </tr>
                  ) : (
                    filings.map((filing) => (
                      <tr key={filing.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{filing.type}</td>
                        <td className="py-3 px-4 text-slate-600">{filing.period}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{filing.dueDate}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          ₹{filing.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-300">
                            {filing.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────── */}
      {/* TAB 5: ATTENDANCE, LEAVE & F&F SETTLEMENT          */}
      {/* ────────────────────────────────────────────────── */}
      {activeTab === 'exit' && (
        <div className="space-y-6">
          {/* Leave Accrual & LOP Deduction Intelligence Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Accrued Leave Liability Provision
              </span>
              <div className="text-2xl font-bold font-display text-slate-900 mt-1">
                ₹{((salaries.filter(s => !s.effectiveTo).reduce((sum, s) => sum + (s.baseMonthly / 30) * 15, 0)) || 145000).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Balance Sheet provision for unavailed Earned Leaves across all branches
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                LOP-to-Payroll Deduction Linkage
              </span>
              <div className="text-lg font-bold text-emerald-700 mt-1.5 flex items-center gap-1.5">
                <CheckCircle2 size={18} /> Active Auto-Deduction Engine
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Formula: <span className="font-mono text-slate-700 font-bold">(Gross / 30) × Approved LOP Days</span> deducted automatically
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Leave Encashment & F&F Calculator
              </span>
              <div className="text-lg font-bold text-blue-900 mt-1.5 flex items-center gap-1.5">
                <Clock size={18} className="text-blue-600" /> Statutory Terminal Calculator
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Includes Gratuity + Unpaid Salary + Encashment - Notice Recovery
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Full & Final (F&F) Exit Settlements
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete settlement statements, gratuity calculation, and exit clearance verification.
              </p>
            </div>
            <button
              onClick={() => setShowFnFModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#15345E] text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              <Plus size={15} />
              Initiate F&F Settlement
            </button>
          </div>

          {fnfList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-xs">
              No active Full &amp; Final (F&amp;F) exit settlements in progress.
            </div>
          ) : (
            <div className="space-y-4">
            {fnfList.map((fnf) => {
              const chk = fnf.offboardingChecklist;
              const allRevoked = chk.laptopRevoked && chk.dbCredentialsRevoked && chk.financialAccessRevoked;

              return (
                <div
                  key={fnf.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{fnf.employeeName}</h4>
                      <span className="text-xs text-slate-500 font-mono">({fnf.employeeId})</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          fnf.settlementStatus === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : allRevoked
                            ? 'bg-blue-50 text-blue-700 border border-blue-300'
                            : 'bg-rose-50 text-rose-700 border border-rose-300'
                        }`}
                      >
                        {fnf.settlementStatus}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Resigned: {fnf.resignationDate} • LWD: {fnf.lastWorkingDay} • Net Dues: ₹
                      {fnf.netSettlementAmount.toLocaleString('en-IN')}
                    </div>

                    {/* IT/Admin Checklist Pills */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleToggleChecklist(fnf.id, chk, 'laptopRevoked')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                          chk.laptopRevoked
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                        title="Click to toggle (Admin permission enforced)"
                      >
                        {chk.laptopRevoked ? <Check size={12} /> : <X size={12} />}
                        Laptop Hardware
                      </button>
                      <button
                        onClick={() => handleToggleChecklist(fnf.id, chk, 'dbCredentialsRevoked')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                          chk.dbCredentialsRevoked
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                        title="Click to toggle (Admin permission enforced)"
                      >
                        {chk.dbCredentialsRevoked ? <Check size={12} /> : <X size={12} />}
                        DB Credentials
                      </button>
                      <button
                        onClick={() => handleToggleChecklist(fnf.id, chk, 'financialAccessRevoked')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                          chk.financialAccessRevoked
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                        title="Click to toggle (Admin permission enforced)"
                      >
                        {chk.financialAccessRevoked ? <Check size={12} /> : <X size={12} />}
                        Financial Access
                      </button>
                    </div>
                  </div>

                  <div>
                    {fnf.settlementStatus !== 'completed' ? (
                      <button
                        onClick={() => handleDisburseFnF(fnf.id)}
                        disabled={!allRevoked}
                        className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 ${
                          allRevoked
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <DollarSign size={14} />
                        Disburse Settlement
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={16} /> Disbursed by {fnf.settledBy?.slice(0, 10)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────── */}
      {/* TAB 6: EXPENSES & REIMBURSEMENTS (TWO-STEP APPROVAL) */}
      {/* ────────────────────────────────────────────────── */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Corporate Expenses & Reimbursements (Two-Step Approval)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Step 1: Branch Manager approval (own branch only) → Step 2: Final Finance approval with GL code & GST
                ITC tagging (HR & Payroll Finance Manager).
              </p>
            </div>
            <button
              onClick={() => {
                if (enrolledEmployees.length > 0) {
                  setExpenseForm({
                    ...expenseForm,
                    employeeId: enrolledEmployees[0].id,
                    employeeName: enrolledEmployees[0].name,
                    branchId: enrolledEmployees[0].branchId,
                  });
                }
                setShowExpenseModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#15345E] text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              <Plus size={15} />
              Submit Expense Claim (with Receipt)
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Category & GL Account</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">GSTIN & Input Tax Credit</th>
                    <th className="py-3 px-4">Payout Route</th>
                    <th className="py-3 px-4">Workflow Status</th>
                    <th className="py-3 px-4 text-right">Finance Clearance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No employee reimbursement claims submitted. Click &quot;Submit Expense Claim&quot; to log claims with receipts.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{exp.employeeName}</div>
                          <div className="text-[10px] text-slate-400">{exp.branchId} • {exp.date}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="uppercase text-slate-800 font-bold">{exp.category}</div>
                          <div className="font-mono text-[10px] text-slate-500">{exp.glCode}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">₹{exp.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4">
                          {exp.hasGstItc ? (
                            <div>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ITC ₹{exp.itcAmount} (18%)
                              </span>
                              <div className="font-mono text-[9px] text-slate-400 mt-0.5">GSTIN: {exp.gstin || 'VERIFIED'}</div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No ITC / Exempt</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                            Pay via Next Payroll Run
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              exp.status === 'finance_approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                : exp.status === 'manager_approved'
                                ? 'bg-blue-50 text-blue-700 border border-blue-300'
                                : 'bg-amber-50 text-amber-700 border border-amber-300'
                            }`}
                          >
                            {exp.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {exp.status === 'manager_approved' && (
                            <button
                              onClick={() => handleFinanceApproveExpense(exp.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                            >
                              <Check size={12} />
                              Finance Approve (Step 2)
                            </button>
                          )}
                          {exp.status === 'submitted' && (
                            <span className="text-[10px] text-slate-400 italic">Awaiting Manager 1st Step</span>
                          )}
                          {exp.status === 'finance_approved' && (
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center justify-end gap-1">
                              <CheckCircle2 size={13} /> Cleared for GL
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────── */}
      {/* TAB 7: HIRING SANDBOX & ESOP TRACKING              */}
      {/* ────────────────────────────────────────────────── */}
      {activeTab === 'sandbox' && (
        <div className="space-y-6">
          {/* Interactive Hiring Runway & Burn-Rate Simulator */}
          <div className="bg-gradient-to-br from-slate-900 via-[#0B1F3A] to-[#15345E] p-6 rounded-2xl text-white shadow-lg border border-[#D4AF37]/30 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Calculator size={18} className="text-[#D4AF37]" />
                  <h3 className="font-bold text-sm text-white">
                    Hiring Sandbox & Burn-Rate Runway Modeler
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Simulate planned headcount additions (salary, benefits, cost center) and instantly forecast institutional cash runway impact.
                </p>
              </div>
              <div className="px-3 py-1 rounded-xl bg-amber-500/20 text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold">
                Runway Simulator Engine Active
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Target Additional Headcount:</span>
                  <span className="text-[#D4AF37] font-bold text-sm">{simHires} Hires</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={simHires}
                  onChange={(e) => setSimHires(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>1 hire</span>
                  <span>25 hires</span>
                  <span>50 hires</span>
                </div>
              </div>

              <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Avg Monthly CTC / Hire:</span>
                  <span className="text-[#D4AF37] font-bold text-sm">₹{simSalary.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="20000"
                  max="250000"
                  step="5000"
                  value={simSalary}
                  onChange={(e) => setSimSalary(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>₹20k/mo</span>
                  <span>₹125k/mo</span>
                  <span>₹250k/mo</span>
                </div>
              </div>

              <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Target Cost Center:</span>
                  <span className="text-blue-300 font-bold">{simDepartment}</span>
                </div>
                <select
                  value={simDepartment}
                  onChange={(e) => setSimDepartment(e.target.value as CostCenter)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 text-white border border-slate-700 text-xs focus:outline-none"
                >
                  <option value="Tech">Tech / Engineering</option>
                  <option value="Operations">Operations</option>
                  <option value="Compliance">Compliance & Legal</option>
                  <option value="Sales">Sales & Distribution</option>
                </select>
                <div className="text-[10px] text-slate-400">
                  Tagged under GL-5100 with departmental cost center segregation
                </div>
              </div>
            </div>

            {/* Live Calculation Cards */}
            {(() => {
              const addedMonthlyBurn = simHires * simSalary;
              const newTotalMonthlyBurn = simCurrentBurn + addedMonthlyBurn;
              const currentRunwayMonths = simRunwayCash / simCurrentBurn;
              const projectedRunwayMonths = simRunwayCash / newTotalMonthlyBurn;
              const runwayReduction = currentRunwayMonths - projectedRunwayMonths;

              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-white/10 border border-white/10">
                    <div className="text-[11px] text-slate-300">Incremental Monthly Burn</div>
                    <div className="text-lg font-bold text-amber-300 mt-0.5">
                      +₹{addedMonthlyBurn.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">₹{(addedMonthlyBurn * 12).toLocaleString('en-IN')} / year</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/10 border border-white/10">
                    <div className="text-[11px] text-slate-300">New Total Monthly Burn</div>
                    <div className="text-lg font-bold text-white mt-0.5">
                      ₹{newTotalMonthlyBurn.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Base ₹{simCurrentBurn.toLocaleString('en-IN')} + Incremental</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/10 border border-white/10">
                    <div className="text-[11px] text-slate-300">Baseline Runway</div>
                    <div className="text-lg font-bold text-emerald-400 mt-0.5">
                      {currentRunwayMonths.toFixed(1)} Months
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Reserves: ₹{(simRunwayCash / 100000).toFixed(1)}L</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
                    <div className="text-[11px] text-amber-200">Post-Hiring Projected Runway</div>
                    <div className="text-lg font-bold text-[#D4AF37] mt-0.5">
                      {projectedRunwayMonths.toFixed(1)} Months
                    </div>
                    <div className="text-[10px] text-rose-300 mt-1 font-semibold">
                      - {runwayReduction.toFixed(1)} Months shortened
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Headcount & Burn Rate Sandbox */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-3">
                Corporate Headcount Projections & Cost Center Budget
              </h3>
              <div className="space-y-3">
                {projections.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No active headcount burn-rate projections configured.
                  </div>
                ) : (
                  projections.map((p) => (
                    <div key={p.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{p.roleName}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {p.headcountTarget} Positions
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Department: {p.department} • Target: {p.targetHiringMonth}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-xs font-semibold">
                        <span className="text-slate-600">Projected Annual Burn:</span>
                        <span className="text-amber-800 font-bold">
                          ₹{p.projectedAnnualBurn.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Read-Only ESOP Tracking */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-3">
                Institutional Equity & ESOP Tracking (Read-Only)
              </h3>
              <div className="space-y-3">
                {esops.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No institutional ESOP grants recorded.
                  </div>
                ) : (
                  esops.map((esop) => (
                    <div key={esop.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{esop.employeeName}</span>
                        <span className="text-xs font-mono font-bold text-emerald-700">
                          {esop.vestedOptions} / {esop.optionsGranted} Options Vested
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Granted: {esop.grantDate} • Vesting: {esop.vestingPeriodYears} Years • Strike: ₹{esop.strikePrice}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────── */}
      {/* TAB 8: PAYROLL JOURNAL ENTRIES & IMMUTABLE AUDIT   */}
      {/* ────────────────────────────────────────────────── */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          {/* Figure 1: 4-Stage Operational Pipeline Diagram */}
          <div className="bg-gradient-to-r from-slate-900 via-[#0B1F3A] to-[#15345E] p-5 rounded-2xl text-white border border-[#D4AF37]/30 shadow-md">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#D4AF37] mb-3">
              Figure 1: Corporate HR & Payroll Finance Operational Pipeline
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-slate-900 flex items-center justify-center text-[10px] font-extrabold">1</span>
                  Employee Master & KYC
                </div>
                <div className="text-[11px] text-slate-300 mt-1.5">
                  PAN, Aadhaar, Bank Details Vault, BGV Status & Cost Center Mapping (Tech/Ops/Compliance/Sales).
                </div>
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-slate-900 flex items-center justify-center text-[10px] font-extrabold">2</span>
                  Payroll & Comp Engine
                </div>
                <div className="text-[11px] text-slate-300 mt-1.5">
                  Draft Initiation (Maker), Pro-rata joiner/leaver, LOP integration, Checker Verification (403 block on self-approval).
                </div>
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-slate-900 flex items-center justify-center text-[10px] font-extrabold">3</span>
                  Statutory & GL Posting
                </div>
                <div className="text-[11px] text-slate-300 mt-1.5">
                  Auto-generates 5 General Ledger Accounts (5100, 5120, 2110, 2120, 2100). Period hard-lock freezes edits.
                </div>
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-slate-900 flex items-center justify-center text-[10px] font-extrabold">4</span>
                  Banking & Offboarding
                </div>
                <div className="text-[11px] text-slate-300 mt-1.5">
                  RBI NEFT Batch Transfer File Export. F&F Exit gated by 3-step IT/Admin hardware & credential revocation.
                </div>
              </div>
            </div>
          </div>

          {/* Automated General Ledger Posting Template (5 Accounts) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Automated General Ledger Posting Template (5 Accounts)
              </h4>
              <span className="text-xs text-slate-500 font-mono">
                Triggered upon Checker Approval
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Account Code & Name</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Ledger Category</th>
                    <th className="py-2.5 px-4">Posting Amount Formula</th>
                    <th className="py-2.5 px-4">Corporate Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-bold text-blue-800">5100 - Salaries & Wages Expense</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-700">Debit (Dr)</td>
                    <td className="py-2.5 px-4 font-sans text-slate-700">Operating Expense</td>
                    <td className="py-2.5 px-4 text-slate-900 font-bold">[GrossCTC]</td>
                    <td className="py-2.5 px-4 font-sans text-slate-500">Gross employee CTC cost tagged by departmental Cost Center</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-bold text-blue-800">5120 - Employer Statutory Contribution Expense</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-700">Debit (Dr)</td>
                    <td className="py-2.5 px-4 font-sans text-slate-700">Operating Expense</td>
                    <td className="py-2.5 px-4 text-slate-900 font-bold">[EmployerContrib]</td>
                    <td className="py-2.5 px-4 font-sans text-slate-500">Employer PF (12%) and ESI (3.25%) statutory liability cost</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-bold text-purple-800">2110 - TDS / Withholding Income Tax Payable</td>
                    <td className="py-2.5 px-4 font-bold text-rose-700">Credit (Cr)</td>
                    <td className="py-2.5 px-4 font-sans text-slate-700">Current Liability</td>
                    <td className="py-2.5 px-4 text-slate-900 font-bold">[TaxDeducted]</td>
                    <td className="py-2.5 px-4 font-sans text-slate-500">Section 192 (Salaries) and Section 194J/194C (Contractors) tax payable</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-bold text-purple-800">2120 - Provident Fund & Statutory Dues Payable</td>
                    <td className="py-2.5 px-4 font-bold text-rose-700">Credit (Cr)</td>
                    <td className="py-2.5 px-4 font-sans text-slate-700">Current Liability</td>
                    <td className="py-2.5 px-4 text-slate-900 font-bold">[TotalPF_ESI]</td>
                    <td className="py-2.5 px-4 font-sans text-slate-500">EPFO & ESIC challan dues (Employee + Employer contributions)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-bold text-purple-800">2100 - Net Salaries Payable (Bank Clearing)</td>
                    <td className="py-2.5 px-4 font-bold text-rose-700">Credit (Cr)</td>
                    <td className="py-2.5 px-4 font-sans text-slate-700">Current Liability</td>
                    <td className="py-2.5 px-4 text-slate-900 font-bold">[NetTakeHome]</td>
                    <td className="py-2.5 px-4 font-sans text-slate-500">Disbursal clearing account; zeroed upon NEFT batch execution</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payroll GL Journal Postings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Payroll General Ledger Journal Postings (Read-Only)
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">JE ID</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Debit Account</th>
                    <th className="py-3 px-4">Credit Account</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Narration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {journalEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-sans text-xs">
                        No General Ledger journal entries posted yet. Entries are automatically generated when a draft payroll run is approved by Checker.
                      </td>
                    </tr>
                  ) : (
                    journalEntries.map((je) => (
                      <tr key={je.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-bold text-slate-900">{je.id}</td>
                        <td className="py-3 px-4 text-slate-700">{je.period}</td>
                        <td className="py-3 px-4 text-blue-700">{je.debitAccount}</td>
                        <td className="py-3 px-4 text-purple-700">{je.creditAccount}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">₹{je.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 font-sans text-xs text-slate-600">{je.narration}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Immutable Append-Only Audit Trail */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Immutable HR & Payroll Audit Trail (Append-Only)
              </h4>
            </div>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold sticky top-0">
                  <tr>
                    <th className="py-3 px-4">Timestamp (UTC)</th>
                    <th className="py-3 px-4">User & Role</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-sans text-xs">
                        No HR &amp; Payroll audit events logged yet. All actions (revisions, approvals, locks) are immutably recorded here.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 font-mono text-[11px]">
                        <td className="py-3 px-4 text-slate-500">{log.timestamp}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900">{log.userId.slice(0, 10)}</span>{' '}
                          <span className="text-slate-400">({log.userRole})</span>
                        </td>
                        <td className="py-3 px-4 font-sans font-bold text-slate-800 uppercase text-[10px]">
                          {log.action.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{log.entity}</td>
                        <td className="py-3 px-4 text-slate-400">{log.ipAddress}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────── */}
      {/* MODAL: INITIATE DRAFT PAYROLL                      */}
      {/* ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showDraftModal && (
          <div
            onClick={() => setShowDraftModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 w-[min(94vw,480px)] p-6 shadow-2xl space-y-4"
            >
              <h3 className="font-bold text-slate-900 text-sm">Initiate Draft Payroll Run</h3>
              <form onSubmit={handleInitiateDraft} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payroll Cycle (YYYY-MM)</label>
                  <input
                    type="month"
                    value={draftPeriod}
                    onChange={(e) => setDraftPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
                  <div>• Computes pro-rata for joiners and leavers</div>
                  <div>• Integrates LOP days deduction</div>
                  <div>• Deducts PF (12%), ESI (0.75%), PT, and TDS</div>
                  <div>• Segregates Maker: you cannot approve this draft yourself</div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDraftModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#15345E] text-white font-bold"
                  >
                    Initiate Draft
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────── */}
      {/* MODAL: EFFECTIVE-DATED SALARY REVISION             */}
      {/* ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSalaryModal && (
          <div
            onClick={() => setShowSalaryModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 w-[min(94vw,560px)] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Enact Effective-Dated Salary Revision</h3>
                <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                  Immutable Record Versioning
                </span>
              </div>
              <form onSubmit={handleCreateSalaryRevision} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Employee</label>
                    {enrolledEmployees.length > 0 ? (
                      <select
                        value={salaryForm.employeeId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const emp = enrolledEmployees.find((x) => x.id === selectedId);
                          setSalaryForm({
                            ...salaryForm,
                            employeeId: selectedId,
                            designation: emp?.designation || salaryForm.designation,
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                        required
                      >
                        <option value="">-- Select Employee --</option>
                        {enrolledEmployees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.id})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. EMP-101"
                        value={salaryForm.employeeId}
                        onChange={(e) => setSalaryForm({ ...salaryForm, employeeId: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                        required
                      />
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Credit Manager"
                      value={salaryForm.designation}
                      onChange={(e) => setSalaryForm({ ...salaryForm, designation: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cost Center Mapping</label>
                    <select
                      value={salaryForm.costCenter}
                      onChange={(e) => setSalaryForm({ ...salaryForm, costCenter: e.target.value as CostCenter })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="Tech">Tech / Engineering</option>
                      <option value="Operations">Operations</option>
                      <option value="Compliance">Compliance & Legal</option>
                      <option value="Sales">Sales & Distribution</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Employment Type</label>
                    <select
                      value={salaryForm.employmentType}
                      onChange={(e) => setSalaryForm({ ...salaryForm, employmentType: e.target.value as EmploymentType })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="full_time">Full-Time Employee</option>
                      <option value="consultant">Consultant / 1099 (Sec 194J)</option>
                      <option value="intern">Intern / Trainee</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Annual CTC (₹)</label>
                    <input
                      type="number"
                      value={salaryForm.ctcAnnual}
                      onChange={(e) => setSalaryForm({ ...salaryForm, ctcAnnual: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Monthly Base (₹)</label>
                    <input
                      type="number"
                      value={salaryForm.baseMonthly}
                      onChange={(e) => setSalaryForm({ ...salaryForm, baseMonthly: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">HRA Monthly (₹)</label>
                    <input
                      type="number"
                      value={salaryForm.hraMonthly}
                      onChange={(e) => setSalaryForm({ ...salaryForm, hraMonthly: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Special Allowance (₹)</label>
                    <input
                      type="number"
                      value={salaryForm.specialAllowance}
                      onChange={(e) => setSalaryForm({ ...salaryForm, specialAllowance: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Variable Pay (₹)</label>
                    <input
                      type="number"
                      value={salaryForm.variablePayMonthly}
                      onChange={(e) => setSalaryForm({ ...salaryForm, variablePayMonthly: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Revision Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Annual Appraisal, Promotion, Cost Center Realignment"
                    value={salaryForm.revisionReason}
                    onChange={(e) => setSalaryForm({ ...salaryForm, revisionReason: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowSalaryModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#0B1F3A] text-white font-bold cursor-pointer"
                  >
                    Save Revision
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────── */}
      {/* MODAL: BANK DETAIL CHANGE REQUEST (MAKER)          */}
      {/* ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBankChangeModal && (
          <div
            onClick={() => setShowBankChangeModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 w-[min(94vw,520px)] p-6 shadow-2xl space-y-4"
            >
              <h3 className="font-bold text-slate-900 text-sm">Request Bank Detail Revision (Maker Step)</h3>
              <form onSubmit={handleRequestBankChange} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Employee</label>
                    {enrolledEmployees.length > 0 ? (
                      <select
                        value={bankForm.employeeId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const emp = enrolledEmployees.find((x) => x.id === selectedId);
                          setBankForm({
                            ...bankForm,
                            employeeId: selectedId,
                            employeeName: emp?.name || bankForm.employeeName,
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                        required
                      >
                        <option value="">-- Select Employee --</option>
                        {enrolledEmployees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.id})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. EMP-101"
                        value={bankForm.employeeId}
                        onChange={(e) => setBankForm({ ...bankForm, employeeId: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                        required
                      />
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Employee Name</label>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={bankForm.employeeName}
                      onChange={(e) => setBankForm({ ...bankForm, employeeName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                  <div className="font-bold text-amber-900 text-[11px]">Proposed New Bank Details</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Proposed Account Number"
                      value={bankForm.proposedAccountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, proposedAccountNumber: e.target.value })}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Proposed IFSC Code"
                      value={bankForm.proposedIfsc}
                      onChange={(e) => setBankForm({ ...bankForm, proposedIfsc: e.target.value })}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Bank Name"
                      value={bankForm.proposedBankName}
                      onChange={(e) => setBankForm({ ...bankForm, proposedBankName: e.target.value })}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Account Holder Name"
                      value={bankForm.proposedHolderName}
                      onChange={(e) => setBankForm({ ...bankForm, proposedHolderName: e.target.value })}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBankChangeModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#0B1F3A] text-white font-bold"
                  >
                    Submit for Checker
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────── */}
      {/* MODAL: INITIATE F&F SETTLEMENT                    */}
      {/* ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFnFModal && (
          <div
            onClick={() => setShowFnFModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 w-[min(94vw,500px)] p-6 shadow-2xl space-y-4"
            >
              <h3 className="font-bold text-slate-900 text-sm">Initiate Full & Final (F&F) Settlement</h3>
              <form onSubmit={handleCreateFnF} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Employee</label>
                    {enrolledEmployees.length > 0 ? (
                      <select
                        value={fnfForm.employeeId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const emp = enrolledEmployees.find((x) => x.id === selectedId);
                          setFnfForm({
                            ...fnfForm,
                            employeeId: selectedId,
                            employeeName: emp?.name || fnfForm.employeeName,
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                        required
                      >
                        <option value="">-- Select Employee --</option>
                        {enrolledEmployees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.id})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. EMP-101"
                        value={fnfForm.employeeId}
                        onChange={(e) => setFnfForm({ ...fnfForm, employeeId: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                        required
                      />
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Employee Name</label>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={fnfForm.employeeName}
                      onChange={(e) => setFnfForm({ ...fnfForm, employeeName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Resignation Date</label>
                    <input
                      type="date"
                      value={fnfForm.resignationDate}
                      onChange={(e) => setFnfForm({ ...fnfForm, resignationDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Last Working Day</label>
                    <input
                      type="date"
                      value={fnfForm.lastWorkingDay}
                      onChange={(e) => setFnfForm({ ...fnfForm, lastWorkingDay: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gratuity (₹)</label>
                    <input
                      type="number"
                      value={fnfForm.gratuityAmount}
                      onChange={(e) => setFnfForm({ ...fnfForm, gratuityAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Leave Encashment (₹)</label>
                    <input
                      type="number"
                      value={fnfForm.leaveEncashmentAmount}
                      onChange={(e) =>
                        setFnfForm({ ...fnfForm, leaveEncashmentAmount: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFnFModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#0B1F3A] text-white font-bold cursor-pointer"
                  >
                    Initiate Exit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────── */}
      {/* MODAL: DIGITAL DOCUMENT VAULT & BGV TRACKER        */}
      {/* ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showVaultModal && (
          <div
            onClick={() => setShowVaultModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 w-[min(94vw,580px)] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">
                  Digital KYC Vault & Background Verification (BGV)
                </h3>
              </div>

              <form onSubmit={handleSaveDocVault} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee</label>
                  {enrolledEmployees.length > 0 ? (
                    <select
                      value={vaultForm.employeeId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const emp = enrolledEmployees.find((x) => x.id === selectedId);
                        const vault = docVaults[selectedId] || getEmployeeDocVault(selectedId);
                        setVaultForm({
                          employeeId: selectedId,
                          panNumber: vault?.panNumber || '',
                          panVerified: vault?.panVerified || false,
                          aadhaarNumber: vault?.aadhaarNumber || '',
                          aadhaarVerified: vault?.aadhaarVerified || false,
                          bgvStatus: vault?.bgvStatus || 'pending',
                          employmentType: vault?.employmentType || 'full_time',
                          costCenter: vault?.costCenter || 'Operations',
                          offerLetterUrl: vault?.offerLetterUrl || '',
                          accountNumber: vault?.bankDetails?.accountNumber || '',
                          ifscCode: vault?.bankDetails?.ifscCode || '',
                          bankName: vault?.bankDetails?.bankName || '',
                          accountHolderName: vault?.bankDetails?.accountHolderName || emp?.name || '',
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      required
                    >
                      <option value="">-- Select Employee --</option>
                      {enrolledEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.id}) • {emp.branchId}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. EMP-101"
                      value={vaultForm.employeeId}
                      onChange={(e) => setVaultForm({ ...vaultForm, employeeId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      required
                    />
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">BGV Status</label>
                    <select
                      value={vaultForm.bgvStatus}
                      onChange={(e) => setVaultForm({ ...vaultForm, bgvStatus: e.target.value as BgvStatus })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                    >
                      <option value="pending">PENDING</option>
                      <option value="in_progress">IN PROGRESS</option>
                      <option value="verified">VERIFIED</option>
                      <option value="failed">FAILED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cost Center</label>
                    <select
                      value={vaultForm.costCenter}
                      onChange={(e) => setVaultForm({ ...vaultForm, costCenter: e.target.value as CostCenter })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="Tech">Tech</option>
                      <option value="Operations">Operations</option>
                      <option value="Compliance">Compliance</option>
                      <option value="Sales">Sales</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Employment Type</label>
                    <select
                      value={vaultForm.employmentType}
                      onChange={(e) => setVaultForm({ ...vaultForm, employmentType: e.target.value as EmploymentType })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="full_time">Full-Time</option>
                      <option value="consultant">Consultant/1099</option>
                      <option value="intern">Intern</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="font-bold text-slate-800 text-[11px]">Government ID Documents</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-600 mb-1">PAN Number</label>
                      <input
                        type="text"
                        placeholder="ABCDE1234F"
                        value={vaultForm.panNumber}
                        onChange={(e) => setVaultForm({ ...vaultForm, panNumber: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 uppercase font-mono bg-white"
                      />
                      <label className="inline-flex items-center gap-1.5 mt-1 text-[10px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={vaultForm.panVerified}
                          onChange={(e) => setVaultForm({ ...vaultForm, panVerified: e.target.checked })}
                          className="rounded text-blue-600"
                        />
                        Verified with NSDL / Income Tax API
                      </label>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-600 mb-1">Aadhaar Number</label>
                      <input
                        type="text"
                        placeholder="12-digit Aadhaar"
                        value={vaultForm.aadhaarNumber}
                        onChange={(e) => setVaultForm({ ...vaultForm, aadhaarNumber: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono bg-white"
                      />
                      <label className="inline-flex items-center gap-1.5 mt-1 text-[10px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={vaultForm.aadhaarVerified}
                          onChange={(e) => setVaultForm({ ...vaultForm, aadhaarVerified: e.target.checked })}
                          className="rounded text-blue-600"
                        />
                        UIDAI Biometric / OTP Verified
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Offer Letter Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. docs/vault/offer_letter_emp101.pdf"
                      value={vaultForm.offerLetterUrl}
                      onChange={(e) => setVaultForm({ ...vaultForm, offerLetterUrl: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800 text-[11px]">Primary Payout Bank Account</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Bank Account Number"
                      value={vaultForm.accountNumber}
                      onChange={(e) => setVaultForm({ ...vaultForm, accountNumber: e.target.value })}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="IFSC Code (e.g. HDFC0001234)"
                      value={vaultForm.ifscCode}
                      onChange={(e) => setVaultForm({ ...vaultForm, ifscCode: e.target.value.toUpperCase() })}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 uppercase font-mono bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Bank Name (e.g. HDFC Bank)"
                      value={vaultForm.bankName}
                      onChange={(e) => setVaultForm({ ...vaultForm, bankName: e.target.value })}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Account Holder Name"
                      value={vaultForm.accountHolderName}
                      onChange={(e) => setVaultForm({ ...vaultForm, accountHolderName: e.target.value })}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowVaultModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#0B1F3A] text-white font-bold cursor-pointer"
                  >
                    Save Vault & KYC
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────── */}
      {/* MODAL: SUBMIT EXPENSE CLAIM (TWO-STEP WORKFLOW)   */}
      {/* ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showExpenseModal && (
          <div
            onClick={() => setShowExpenseModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 w-[min(94vw,520px)] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">
                  Submit Employee Reimbursement Claim
                </h3>
                <span className="text-[10px] font-mono bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                  GL & GST ITC Engine
                </span>
              </div>

              <form onSubmit={handleSubmitExpense} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Employee</label>
                    {enrolledEmployees.length > 0 ? (
                      <select
                        value={expenseForm.employeeId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const emp = enrolledEmployees.find((x) => x.id === selectedId);
                          setExpenseForm({
                            ...expenseForm,
                            employeeId: selectedId,
                            employeeName: emp?.name || expenseForm.employeeName,
                            branchId: emp?.branchId || expenseForm.branchId,
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                        required
                      >
                        <option value="">-- Select Employee --</option>
                        {enrolledEmployees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.id})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="EMP-101"
                        value={expenseForm.employeeId}
                        onChange={(e) => setExpenseForm({ ...expenseForm, employeeId: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                        required
                      />
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Branch ID</label>
                    <input
                      type="text"
                      value={expenseForm.branchId}
                      onChange={(e) => setExpenseForm({ ...expenseForm, branchId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category & GL Account</label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="travel">Travel (GL-6101)</option>
                      <option value="lodging">Lodging (GL-6101)</option>
                      <option value="client_entertainment">Client Entertainment (GL-6102)</option>
                      <option value="meals">Meals (GL-6102)</option>
                      <option value="software_tools">Software & Tools (GL-6103)</option>
                      <option value="office_supplies">Office Supplies (GL-6100)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Claim Amount (₹)</label>
                    <input
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description & Receipt Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Enter claim purpose, vendor name, invoice reference, and receipt notes..."
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    required
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={expenseForm.hasGstItc}
                      onChange={(e) => setExpenseForm({ ...expenseForm, hasGstItc: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    Eligible for GST Input Tax Credit (ITC @ 18%)
                  </label>
                  {expenseForm.hasGstItc && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Vendor GSTIN (15 chars)"
                        value={expenseForm.gstin}
                        onChange={(e) => setExpenseForm({ ...expenseForm, gstin: e.target.value.toUpperCase() })}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 uppercase font-mono bg-white text-xs"
                      />
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center justify-between text-xs">
                        <span>Calculated ITC:</span>
                        <span>₹{Math.round(expenseForm.amount * 0.18).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#0B1F3A] text-white font-bold cursor-pointer"
                  >
                    Submit Claim
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HRPayrollDashboardPage;
