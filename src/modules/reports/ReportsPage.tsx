import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Wallet, Calendar, AlertTriangle, CreditCard,
  FileText, UserCheck, Clock, Building2, ArrowRight,
  Filter, ChevronDown, X, Download, Eye, Search, ShieldCheck, Sparkles, RotateCcw
} from 'lucide-react';
import { PageHeader } from '../../components/ui';
import { useUIStore, useAuthStore } from '../../store';
import { getStoredBranches, type DetailedBranch } from '../../services/branchService';
import {
  generateReportPDF,
  generateReportPDFBlobUrl,
  type PDFReportOptions,
} from '../../utils/pdfGenerator';
import {
  getCustomerReport,
  getCollectionReport,
  getDailyReport,
  getMonthlyReport,
  getPendingReport,
  getOutstandingReport,
  getLoanReport,
  getEmployeeReport,
  getAttendanceReport,
  getBranchReport,
} from '../../services/reportsDataService';

interface ReportCardItem {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  path: string;
}

const PDF_REPORT_CARDS: ReportCardItem[] = [
  {
    id: 'customer',
    name: 'Customer Report',
    description: 'Customer records and profile information.',
    icon: Users,
    path: '/reports/customer',
  },
  {
    id: 'collection',
    name: 'Collection Report',
    description: 'Collection records and collection history.',
    icon: Wallet,
    path: '/reports/collection',
  },
  {
    id: 'daily',
    name: 'Daily Report',
    description: 'Daily operational records.',
    icon: Calendar,
    path: '/reports/daily',
  },
  {
    id: 'monthly',
    name: 'Monthly Report',
    description: 'Monthly operational records.',
    icon: FileText,
    path: '/reports/monthly',
  },
  {
    id: 'pending',
    name: 'Pending Report',
    description: 'Pending collection records.',
    icon: AlertTriangle,
    path: '/reports/pending',
  },
  {
    id: 'outstanding',
    name: 'Outstanding Report',
    description: 'Outstanding loan amounts.',
    icon: CreditCard,
    path: '/reports/outstanding',
  },
  {
    id: 'loan',
    name: 'Loan Report',
    description: 'Loan records and loan status.',
    icon: FileText,
    path: '/reports/loan',
  },
  {
    id: 'employee',
    name: 'Employee Report',
    description: 'Employee records, roles and branch assignments.',
    icon: UserCheck,
    path: '/reports/employee',
  },
  {
    id: 'attendance',
    name: 'Attendance Report',
    description: 'Employee attendance records.',
    icon: Clock,
    path: '/reports/attendance',
  },
  {
    id: 'branch',
    name: 'Branch Report',
    description: 'Branch records and branch information.',
    icon: Building2,
    path: '/reports/branch',
  },
];

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const userRole = currentUser?.customClaims?.role;
  const isBranchScopedUser = (userRole as string) === 'branch_manager' || (userRole as string) === 'collection_agent' || (userRole as string) === 'cro';
  const userBranchId = currentUser?.customClaims?.branchId;

  const selectedBranchId = useUIStore((s) => s.selectedBranchId);
  const setSelectedBranchId = useUIStore((s) => s.setSelectedBranchId);

  // If user is branch-scoped (e.g. Branch Manager), strictly lock to their branch
  const effectiveBranchId = isBranchScopedUser ? (userBranchId || selectedBranchId || 'BR-01') : selectedBranchId;

  const [branches, setBranches] = useState<DetailedBranch[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setBranches(getStoredBranches());
  }, []);

  const activeBranch = branches.find((b) => b.id === effectiveBranchId) || (isBranchScopedUser ? branches[0] : undefined);
  const isBranchFiltered = Boolean(effectiveBranchId && activeBranch);
  const fmt = (num: number) => `₹${num.toLocaleString('en-IN')}`;

  // Dynamic record counts per report category for effectiveBranchId scope
  const reportCounts = React.useMemo(() => {
    const custCount = getCustomerReport(effectiveBranchId).length;
    const colCount = getCollectionReport(effectiveBranchId).length;
    const dailyCount = getDailyReport('Today', effectiveBranchId).length;
    const monthlyCount = getMonthlyReport(effectiveBranchId).length;
    const pendingCount = getPendingReport(effectiveBranchId).length;
    const outCount = getOutstandingReport(effectiveBranchId).length;
    const loanCount = getLoanReport(effectiveBranchId).length;
    const empCount = getEmployeeReport(effectiveBranchId).length;
    const attCount = getAttendanceReport(effectiveBranchId).length;
    const branchCount = getBranchReport(effectiveBranchId).length;

    const totalRecords =
      custCount + colCount + dailyCount + pendingCount + outCount + loanCount + empCount + attCount;

    return {
      customer: custCount,
      collection: colCount,
      daily: dailyCount,
      monthly: monthlyCount,
      pending: pendingCount,
      outstanding: outCount,
      loan: loanCount,
      employee: empCount,
      attendance: attCount,
      branch: branchCount,
      totalRecords,
      activeModulesCount: [
        custCount,
        colCount,
        dailyCount,
        monthlyCount,
        pendingCount,
        outCount,
        loanCount,
        empCount,
        attCount,
        branchCount,
      ].filter((c) => c > 0).length,
    };
  }, [effectiveBranchId]);

  const buildPDFOptionsForReport = (reportId: string, reportName: string, description: string): PDFReportOptions => {
    const branchText = activeBranch ? activeBranch.name : 'All Branches';
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let summaryItems: { label: string; value: string }[] = [];

    switch (reportId) {
      case 'customer': {
        const list = getCustomerReport(effectiveBranchId);
        headers = ['Customer Name', 'Customer ID', 'Group Name', 'Phone', 'Branch', 'Status'];
        rows = list.map((c) => [c.name, c.id, c.groupName, c.phone, c.branchName, c.status]);
        summaryItems = [{ label: 'Total Customers', value: list.length.toString() }];
        break;
      }
      case 'collection': {
        const list = getCollectionReport(effectiveBranchId);
        headers = ['Collection ID', 'Date', 'Receipt No', 'Customer Name', 'Loan ID', 'Amount', 'Status', 'Branch'];
        rows = list.map((c) => [c.id, c.date, c.receiptNumber || '-', c.customerName, c.loanId, fmt(c.amount), c.status, c.branchName]);
        const total = list.reduce((a, b) => a + b.amount, 0);
        summaryItems = [
          { label: 'Total Records', value: list.length.toString() },
          { label: 'Total Amount Collected', value: fmt(total) }
        ];
        break;
      }
      case 'daily': {
        const list = getDailyReport('Today', effectiveBranchId);
        headers = ['Time', 'Activity Type', 'Reference / ID', 'Party / Customer', 'Amount', 'Branch', 'Status'];
        rows = list.map((d) => [d.time, d.type, d.reference, d.party, (d.amount && d.amount > 0) ? fmt(d.amount) : '-', d.branchName, d.status]);
        summaryItems = [{ label: 'Daily Events', value: list.length.toString() }];
        break;
      }
      case 'monthly': {
        const list = getMonthlyReport(effectiveBranchId);
        headers = ['Branch Name', 'Active Borrowers', 'Loans Disbursed', 'Disbursed Amount', 'Collected Amount', 'Outstanding Balance'];
        rows = list.map((m) => [m.branchName, m.activeBorrowers.toString(), m.loansDisbursedCount.toString(), fmt(m.totalDisbursedAmount), fmt(m.totalCollectedAmount), fmt(m.outstandingBalance)]);
        const colTotal = list.reduce((a, b) => a + b.totalCollectedAmount, 0);
        const disbTotal = list.reduce((a, b) => a + b.totalDisbursedAmount, 0);
        const outTotal = list.reduce((a, b) => a + b.outstandingBalance, 0);
        summaryItems = [
          { label: 'Total Disbursed', value: fmt(disbTotal) },
          { label: 'Total Collected', value: fmt(colTotal) },
          { label: 'Total Outstanding', value: fmt(outTotal) }
        ];
        break;
      }
      case 'pending': {
        const list = getPendingReport(effectiveBranchId);
        headers = ['Collection ID', 'Customer Name', 'Loan ID', 'Due Amount', 'Pending Amount', 'NC Code / Reason', 'Agent', 'Branch'];
        rows = list.map((p) => [p.id, p.customerName, p.loanId, fmt(p.dueAmount), fmt(p.pendingAmount), p.ncReasonCode, p.agentName, p.branchName]);
        const totalPending = list.reduce((a, b) => a + b.pendingAmount, 0);
        summaryItems = [
          { label: 'Pending Accounts', value: list.length.toString() },
          { label: 'Total Overdue Amount', value: fmt(totalPending) }
        ];
        break;
      }
      case 'outstanding': {
        const list = getOutstandingReport(effectiveBranchId);
        headers = ['Loan ID', 'Customer Name', 'Plan Name', 'Sanctioned Amount', 'Repaid Amount', 'Outstanding Balance', 'Status', 'Branch'];
        rows = list.map((o) => [o.loanId, o.customerName, o.planName, fmt(o.sanctionedAmount), fmt(o.repaidAmount), fmt(o.outstandingAmount), o.status, o.branchName]);
        const totalBal = list.reduce((a, b) => a + b.outstandingAmount, 0);
        summaryItems = [
          { label: 'Loans with Balance', value: list.length.toString() },
          { label: 'Total Outstanding Balance', value: fmt(totalBal) }
        ];
        break;
      }
      case 'loan': {
        const list = getLoanReport(effectiveBranchId);
        headers = ['Loan ID', 'Customer Name', 'Plan Name', 'Principal Amount', 'Outstanding Amount', 'Status', 'Branch'];
        rows = list.map((l) => [l.id, l.customerName, l.planName, fmt(l.principalAmount), fmt(l.outstandingAmount), l.status, l.branchName]);
        const totalPort = list.reduce((a, b) => a + b.principalAmount, 0);
        summaryItems = [
          { label: 'Total Loans', value: list.length.toString() },
          { label: 'Total Portfolio Principal', value: fmt(totalPort) }
        ];
        break;
      }
      case 'employee': {
        const list = getEmployeeReport(effectiveBranchId);
        headers = ['Employee ID', 'Employee Name', 'Role', 'Branch Assignment', 'Status'];
        rows = list.map((e) => [e.id, e.name, e.role, e.branchName, e.status]);
        summaryItems = [{ label: 'Total Employees', value: list.length.toString() }];
        break;
      }
      case 'attendance': {
        const list = getAttendanceReport(effectiveBranchId);
        headers = ['Date', 'Employee Name', 'Login Time', 'Logout Time', 'GPS Location', 'Status', 'Branch'];
        rows = list.map((a) => [a.date, a.employeeName, a.loginTime, a.logoutTime || '-', a.gpsLocation, a.status, a.branchName]);
        summaryItems = [{ label: 'Total Attendance Logs', value: list.length.toString() }];
        break;
      }
      case 'branch': {
        const list = getBranchReport(effectiveBranchId);
        headers = ['Branch Code', 'Branch Name', 'City', 'Manager', 'Total Employees', 'Status'];
        rows = list.map((b) => [b.code, b.name, b.city, b.manager, b.totalEmployees.toString(), b.status]);
        summaryItems = [
          { label: 'Total Branches', value: list.length.toString() }
        ];
        break;
      }
    }

    return {
      title: reportName,
      subtitle: description,
      branch: branchText,
      headers,
      rows,
      summaryItems,
      fileName: `GLF_${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`,
    };
  };

  const handleDownloadCardPDF = async (e: React.MouseEvent, card: ReportCardItem) => {
    e.stopPropagation();
    const opts = buildPDFOptionsForReport(card.id, card.name, card.description);
    await generateReportPDF(opts);
  };

  const handlePreviewCardPDF = async (e: React.MouseEvent, card: ReportCardItem) => {
    e.stopPropagation();
    const opts = buildPDFOptionsForReport(card.id, card.name, card.description);
    const url = await generateReportPDFBlobUrl(opts);
    setPreviewBlobUrl(url);
    setPreviewTitle(card.name);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
  };

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPreviewOpen) {
        handleClosePreview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewOpen, previewBlobUrl]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 sm:p-5 lg:p-6 flex flex-col gap-5 pb-12 font-sans max-w-full text-[#0B1F3A]"
    >
      {/* ── Page Header (Section 23, 42) ── */}
      <PageHeader
        title="All Reports"
        subtitle="View, preview, and download official system reports in PDF format."
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard' },
          { label: 'Reports' },
          { label: 'All Reports' },
        ]}
      />

      {/* ── 1. EXECUTIVE KPI SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Reports */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-[0_2px_8px_rgba(11,31,58,0.04)] hover:shadow-md hover:border-[#D4AF37]/50 transition-all duration-200 flex flex-col justify-between min-h-[148px] group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans leading-tight">
              System Statements
            </span>
            <div className="w-8.5 h-8.5 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80 shadow-2xs group-hover:scale-105 transition-transform">
              <FileText size={16} />
            </div>
          </div>
          <div className="my-2.5 flex items-center">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-[26px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums">
                {PDF_REPORT_CARDS.length}
              </span>
              <span className="text-xs font-semibold text-slate-400">Reports</span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            <span className="truncate">Standardized institutional reporting statements</span>
          </div>
        </div>

        {/* Card 2: Branch Scope */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-[0_2px_8px_rgba(11,31,58,0.04)] hover:shadow-md hover:border-[#D4AF37]/50 transition-all duration-200 flex flex-col justify-between min-h-[148px] group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans leading-tight">
              Active Scope
            </span>
            <div className="w-8.5 h-8.5 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/80 shadow-2xs group-hover:scale-105 transition-transform">
              <Building2 size={16} />
            </div>
          </div>
          <div className="my-2.5 flex items-center">
            <span className="text-lg sm:text-xl font-extrabold text-[#0B1F3A] font-manrope tracking-tight truncate">
              {activeBranch ? activeBranch.name : 'All Branches'}
            </span>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span className="truncate">{isBranchFiltered ? `Branch ID: ${activeBranch?.code}` : 'Consolidated multi-branch view'}</span>
          </div>
        </div>

        {/* Card 3: Audit Records */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-[0_2px_8px_rgba(11,31,58,0.04)] hover:shadow-md hover:border-[#D4AF37]/50 transition-all duration-200 flex flex-col justify-between min-h-[148px] group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans leading-tight">
              Audit Records
            </span>
            <div className="w-8.5 h-8.5 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/80 shadow-2xs group-hover:scale-105 transition-transform">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="my-2.5 flex items-center">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-[26px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums">
                {reportCounts.totalRecords}
              </span>
              <span className="text-xs font-semibold text-slate-400">Records</span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">
              {reportCounts.totalRecords > 0
                ? `${reportCounts.activeModulesCount} reporting modules with data`
                : 'No ledger transactions recorded yet'}
            </span>
          </div>
        </div>

        {/* Card 4: Executive Status */}
        <div className="bg-gradient-to-br from-[#0B1F3A] to-[#163864] text-white rounded-2xl p-5 shadow-[0_2px_10px_rgba(11,31,58,0.15)] flex flex-col justify-between min-h-[148px] relative overflow-hidden group">
          <FileText size={80} className="absolute -right-4 -bottom-4 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
              Ledger Engine
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          </div>
          <div className="my-2.5 flex items-center justify-between gap-2">
            <span className="text-lg sm:text-xl font-extrabold text-white font-manrope tracking-tight whitespace-nowrap truncate">
              {reportCounts.totalRecords > 0 ? 'Active Ledger Sync' : 'Ledger Initialized'}
            </span>
          </div>
          <div className="pt-2.5 border-t border-white/10 text-[11.5px] text-slate-300 flex items-center gap-1.5 truncate">
            <Sparkles size={11} className="text-[#D4AF37] shrink-0" />
            <span className="truncate">
              {reportCounts.totalRecords > 0
                ? `${reportCounts.totalRecords} records ready for PDF export`
                : 'Direct PDF statements & printouts'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. BRANCH CONTEXT & SEARCH TOOLBAR ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-[0_2px_8px_rgba(11,31,58,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Branch Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-[#D4AF37]" />
            <span className="text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wider font-sans">
              BRANCH CONTEXT:
            </span>
          </div>

          {isBranchScopedUser ? (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-[#D4AF37]/50 text-xs font-bold text-[#0B1F3A]">
              <Building2 size={13} className="text-[#D4AF37]" />
              <span>{activeBranch?.name || 'Main Branch - Anna Nagar'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                {activeBranch?.code || 'GL-BR-001'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium ml-1">
                (Branch Scoped)
              </span>
            </div>
          ) : (
            <>
              <div className="relative min-w-[240px] sm:min-w-[280px]">
                <select
                  value={selectedBranchId || ''}
                  onChange={(e) => setSelectedBranchId(e.target.value ? e.target.value : null)}
                  className="w-full appearance-none pl-3.5 pr-9 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#CBD5E1] focus:border-[#D4AF37] text-xs font-semibold text-[#0B1F3A] transition-all cursor-pointer focus:outline-none"
                >
                  <option value="">All Branches (Complete Organization View)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
              </div>

              {isBranchFiltered && activeBranch && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>
                    Filtered to: <strong>{activeBranch.name}</strong>
                  </span>
                  <button
                    onClick={() => setSelectedBranchId(null)}
                    className="ml-1 p-0.5 rounded hover:bg-amber-200/60 text-amber-800 transition-colors cursor-pointer"
                    title="View All Branches"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Search Box */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64 min-w-[220px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by title or keyword..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 border border-[#CBD5E1] focus:border-[#D4AF37] focus:bg-white text-xs text-[#0B1F3A] focus:outline-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
              title="Clear search"
            >
              <RotateCcw size={12} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 3. 10 REPORTS GRID (Section 42-43) ── */}
      {PDF_REPORT_CARDS.filter(
        (c) =>
          !searchQuery ||
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase())
      ).length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
            <FileText size={22} className="text-[#0B1F3A]" />
          </div>
          <h3 className="text-sm font-bold text-[#0B1F3A]">No matching reports found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            No report category matches &quot;{searchQuery}&quot;. Clear your search query to see all available reports.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Clear Search</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {PDF_REPORT_CARDS.filter(
            (c) =>
              !searchQuery ||
              c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.description.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((card) => {
            const Icon = card.icon;
            const count = reportCounts[card.id as keyof typeof reportCounts] ?? 0;
            return (
              <div
                key={card.id}
                onClick={() => navigate(card.path)}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-[0_1px_3px_rgba(11,31,58,0.04)] hover:shadow-lg hover:border-[#D4AF37]/60 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 group-hover:bg-[#0B1F3A] group-hover:border-[#0B1F3A] flex items-center justify-center transition-colors shadow-2xs">
                      <Icon size={18} className="text-[#0B1F3A] group-hover:text-[#D4AF37] transition-colors" />
                    </div>
                    <span
                      className={`text-[10.5px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded border ${
                        count > 0
                          ? 'text-[#D4AF37] bg-amber-50 border-amber-200'
                          : 'text-slate-500 bg-slate-100 border-slate-200'
                      }`}
                    >
                      {count > 0 ? `${count} ${count === 1 ? 'Record' : 'Records'} • PDF Ready` : '0 Records'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#0B1F3A] group-hover:text-[#0B1F3A] transition-colors mb-1 font-sans">
                    {card.name}
                  </h3>
                  <p className="text-xs text-[#64748B] font-sans leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handlePreviewCardPDF(e, card)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#0B1F3A] hover:text-[#F5D061] text-[#0B1F3A] font-semibold text-[11px] border border-slate-200 transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="Preview PDF"
                    >
                      <Eye size={12} className="text-[#D4AF37]" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={(e) => handleDownloadCardPDF(e, card)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#F5D061] to-[#D4AF37] hover:brightness-105 text-[#0B1F3A] font-bold text-[11px] transition-all cursor-pointer shadow-xs active:scale-95"
                      title="Download PDF"
                    >
                      <Download size={12} />
                      <span>PDF</span>
                    </button>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-[#0B1F3A] flex items-center justify-center transition-colors">
                    <ArrowRight size={13} className="text-[#0B1F3A] group-hover:text-[#D4AF37] transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── GLOBAL PDF PREVIEW MODAL ON ALL REPORTS LANDING ── */}
      <AnimatePresence>
        {isPreviewOpen && previewBlobUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none"
            role="dialog"
            aria-modal="true"
          >
            {/* Clickable Backdrop Overlay — Clicking anywhere outside closes preview */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={handleClosePreview}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs cursor-pointer"
              aria-label="Close preview backdrop"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-slate-200 relative z-10 select-text"
            >
              {/* Modal Header */}
              <div className="bg-[#0B1F3A] px-5 py-4 flex items-center justify-between border-b border-[#D4AF37]/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                      {previewTitle} — OFFICIAL PDF PREVIEW
                    </h3>
                    <p className="text-[11px] text-slate-300 font-sans">
                      Golden Leaf Finance Executive Report Format
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClosePreview}
                    className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                    title="Close preview"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body: PDF Viewer iFrame */}
              <div className="flex-1 bg-slate-100 p-2 overflow-hidden">
                <iframe
                  src={previewBlobUrl}
                  className="w-full h-full rounded-xl border border-slate-300 shadow-inner"
                  title={`${previewTitle} Preview`}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ReportsPage;

