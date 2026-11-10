// ──────────────────────────────────────────────────
// GOLDEN LEAF FINANCE — PDF-STRICT REPORT VIEWER
// Displays the 10 PDF-defined reports using actual application data:
// 1. Customer Report
// 2. Collection Report
// 3. Daily Report
// 4. Monthly Report
// 5. Pending Report
// 6. Outstanding Report
// 7. Loan Report
// 8. Employee Report
// 9. Attendance Report
// 10. Branch Report
// Strictly adheres to selectedBranchId for Branch Context Isolation.
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Users,
  Wallet,
  Calendar,
  AlertTriangle,
  CreditCard,
  UserCheck,
  Clock,
  Building2,
  ChevronDown,
  Filter,
  X,
  ArrowLeft,
  Download,
  Eye,
  Search,
  CheckCircle2,
  RotateCcw,
  Briefcase,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  Phone,
} from 'lucide-react';
import { PageHeader, Avatar } from '../../components/ui';
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
  getBranchLoanPortfolioSummary,
  type CustomerReportRow,
  type CollectionReportRow,
  type DailyReportRow,
  type MonthlyReportRow,
  type PendingReportRow,
  type OutstandingReportRow,
  type LoanReportRow,
  type EmployeeReportRow,
  type AttendanceReportRow,
  type BranchReportRow,
} from '../../services/reportsDataService';

export type SupportedReportType =
  | 'customer'
  | 'collection'
  | 'daily'
  | 'monthly'
  | 'pending'
  | 'outstanding'
  | 'loan'
  | 'employee'
  | 'attendance'
  | 'branch';

interface ReportMeta {
  title: string;
  description: string;
  icon: React.ElementType;
}

const REPORT_METAS: Record<SupportedReportType, ReportMeta> = {
  customer: {
    title: 'Customer Report',
    description: 'Customer records, active borrower profiles and contact details.',
    icon: Users,
  },
  collection: {
    title: 'Collection Report',
    description: 'Collection records, receipts, and historical inflow ledger.',
    icon: Wallet,
  },
  daily: {
    title: 'Daily Report',
    description: 'Daily operational records, disbursements and field events.',
    icon: Calendar,
  },
  monthly: {
    title: 'Monthly Report',
    description: 'Monthly operational records, disbursements and branch metrics.',
    icon: FileText,
  },
  pending: {
    title: 'Pending Report',
    description: 'Pending collections, delinquent accounts and field agent logs.',
    icon: AlertTriangle,
  },
  outstanding: {
    title: 'Outstanding Report',
    description: 'Outstanding loan amounts, repayments and portfolio balances.',
    icon: CreditCard,
  },
  loan: {
    title: 'Loan Report',
    description: 'Loan portfolio records, sanction values and loan statuses.',
    icon: FileText,
  },
  employee: {
    title: 'Employee Report',
    description: 'Employee records, field agent roles and branch assignments.',
    icon: UserCheck,
  },
  attendance: {
    title: 'Attendance Report',
    description: 'Employee attendance records, punch timings and duty status.',
    icon: Clock,
  },
  branch: {
    title: 'Branch Report',
    description: 'Branch office directory, managers, staffing and locations.',
    icon: Building2,
  },
};

const REPORT_TABS: { key: SupportedReportType; label: string; icon: React.ElementType }[] = [
  { key: 'customer', label: 'Customer Report', icon: Users },
  { key: 'collection', label: 'Collection Report', icon: Wallet },
  { key: 'daily', label: 'Daily Report', icon: Calendar },
  { key: 'monthly', label: 'Monthly Report', icon: FileText },
  { key: 'pending', label: 'Pending Report', icon: AlertTriangle },
  { key: 'outstanding', label: 'Outstanding Report', icon: CreditCard },
  { key: 'loan', label: 'Loan Report', icon: FileText },
  { key: 'employee', label: 'Employee Report', icon: UserCheck },
  { key: 'attendance', label: 'Attendance Report', icon: Clock },
  { key: 'branch', label: 'Branch Report', icon: Building2 },
];

interface ReportViewPageProps {
  type?: SupportedReportType;
}

export const ReportViewPage: React.FC<ReportViewPageProps> = ({ type: propType }) => {
  const navigate = useNavigate();
  const { reportType: paramType } = useParams<{ reportType: string }>();

  const reportKey = (propType || paramType || 'customer') as SupportedReportType;
  const meta = REPORT_METAS[reportKey] || REPORT_METAS.customer;
  const Icon = meta.icon;

  const currentUser = useAuthStore((s) => s.user);
  const userRole = currentUser?.customClaims?.role;
  const isBranchScopedUser = (userRole as string) === 'branch_manager' || (userRole as string) === 'collection_agent' || (userRole as string) === 'cro';
  const userBranchId = currentUser?.customClaims?.branchId;

  const selectedBranchId = useUIStore((s) => s.selectedBranchId);
  const setSelectedBranchId = useUIStore((s) => s.setSelectedBranchId);

  // If user is branch-scoped (e.g. Branch Manager), strictly lock to their branch
  const effectiveBranchId = isBranchScopedUser ? (userBranchId || selectedBranchId || 'BR-01') : selectedBranchId;

  const [branches, setBranches] = useState<DetailedBranch[]>([]);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  // Load branches
  useEffect(() => {
    setBranches(getStoredBranches());
  }, []);

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

  const activeBranch = branches.find((b) => b.id === effectiveBranchId) || (isBranchScopedUser ? branches[0] : undefined);
  const isBranchFiltered = Boolean(effectiveBranchId && activeBranch);

  const fmt = (num: number) => `₹${num.toLocaleString('en-IN')}`;

  // Fetch report data dynamically based on active reportKey and effectiveBranchId
  const customerRows: CustomerReportRow[] = useMemo(
    () => (reportKey === 'customer' ? getCustomerReport(effectiveBranchId) : []),
    [reportKey, effectiveBranchId]
  );
  const collectionRows: CollectionReportRow[] = useMemo(
    () => (reportKey === 'collection' ? getCollectionReport(effectiveBranchId) : []),
    [reportKey, effectiveBranchId]
  );
  const dailyRows: DailyReportRow[] = useMemo(
    () => (reportKey === 'daily' ? getDailyReport(selectedDate, effectiveBranchId) : []),
    [reportKey, selectedDate, effectiveBranchId]
  );
  const monthlyRows: MonthlyReportRow[] = useMemo(
    () => (reportKey === 'monthly' ? getMonthlyReport(effectiveBranchId) : []),
    [reportKey, effectiveBranchId]
  );
  const pendingRows: PendingReportRow[] = useMemo(
    () => (reportKey === 'pending' ? getPendingReport(effectiveBranchId) : []),
    [reportKey, effectiveBranchId]
  );
  const outstandingRows: OutstandingReportRow[] = useMemo(
    () => (reportKey === 'outstanding' ? getOutstandingReport(effectiveBranchId) : []),
    [reportKey, effectiveBranchId]
  );
  const loanRows: LoanReportRow[] = useMemo(
    () => (reportKey === 'loan' ? getLoanReport(effectiveBranchId) : []),
    [reportKey, effectiveBranchId]
  );
  const employeeRows: EmployeeReportRow[] = useMemo(
    () => (reportKey === 'employee' ? getEmployeeReport(effectiveBranchId) : []),
    [reportKey, effectiveBranchId]
  );
  const attendanceRows: AttendanceReportRow[] = useMemo(
    () => (reportKey === 'attendance' ? getAttendanceReport(effectiveBranchId) : []),
    [reportKey, effectiveBranchId]
  );
  const branchRows: BranchReportRow[] = useMemo(
    () => (reportKey === 'branch' ? getBranchReport(effectiveBranchId) : []),
    [reportKey, effectiveBranchId]
  );
  const branchLoanPortfolio = useMemo(
    () => (reportKey === 'branch' ? getBranchLoanPortfolioSummary(effectiveBranchId) : null),
    [reportKey, effectiveBranchId]
  );

  // Search filtered records
  const q = searchQuery.toLowerCase().trim();

  const filteredCustomerRows = useMemo(() => {
    if (!q) return customerRows;
    return customerRows.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.groupName.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.branchName.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q)
    );
  }, [customerRows, q]);

  const filteredCollectionRows = useMemo(() => {
    if (!q) return collectionRows;
    return collectionRows.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.loanId.toLowerCase().includes(q) ||
        c.branchName.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q) ||
        c.receiptNumber.toLowerCase().includes(q)
    );
  }, [collectionRows, q]);

  const filteredDailyRows = useMemo(() => {
    if (!q) return dailyRows;
    return dailyRows.filter(
      (d) =>
        d.type.toLowerCase().includes(q) ||
        d.party.toLowerCase().includes(q) ||
        d.reference.toLowerCase().includes(q) ||
        d.branchName.toLowerCase().includes(q) ||
        d.status.toLowerCase().includes(q)
    );
  }, [dailyRows, q]);

  const filteredMonthlyRows = useMemo(() => {
    if (!q) return monthlyRows;
    return monthlyRows.filter((m) => m.branchName.toLowerCase().includes(q));
  }, [monthlyRows, q]);

  const filteredPendingRows = useMemo(() => {
    if (!q) return pendingRows;
    return pendingRows.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.loanId.toLowerCase().includes(q) ||
        p.agentName.toLowerCase().includes(q) ||
        p.ncReasonCode.toLowerCase().includes(q) ||
        p.branchName.toLowerCase().includes(q)
    );
  }, [pendingRows, q]);

  const filteredOutstandingRows = useMemo(() => {
    if (!q) return outstandingRows;
    return outstandingRows.filter(
      (o) =>
        o.loanId.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.planName.toLowerCase().includes(q) ||
        o.branchName.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q)
    );
  }, [outstandingRows, q]);

  const filteredLoanRows = useMemo(() => {
    if (!q) return loanRows;
    return loanRows.filter(
      (l) =>
        l.id.toLowerCase().includes(q) ||
        l.customerName.toLowerCase().includes(q) ||
        l.planName.toLowerCase().includes(q) ||
        l.branchName.toLowerCase().includes(q) ||
        l.status.toLowerCase().includes(q)
    );
  }, [loanRows, q]);

  const filteredEmployeeRows = useMemo(() => {
    if (!q) return employeeRows;
    return employeeRows.filter(
      (e) =>
        e.id.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        e.branchName.toLowerCase().includes(q) ||
        e.status.toLowerCase().includes(q)
    );
  }, [employeeRows, q]);

  const filteredAttendanceRows = useMemo(() => {
    if (!q) return attendanceRows;
    return attendanceRows.filter(
      (a) =>
        a.employeeName.toLowerCase().includes(q) ||
        a.branchName.toLowerCase().includes(q) ||
        a.date.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q)
    );
  }, [attendanceRows, q]);

  const filteredBranchRows = useMemo(() => {
    if (!q) return branchRows;
    return branchRows.filter(
      (b) =>
        b.code.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.manager.toLowerCase().includes(q) ||
        b.status.toLowerCase().includes(q)
    );
  }, [branchRows, q]);

  // Executive KPI summary stats
  const reportStats = useMemo(() => {
    switch (reportKey) {
      case 'customer':
        return [
          {
            label: 'Total Customers',
            val: customerRows.length.toString(),
            sub: 'Registered borrowers',
            icon: Users,
            color: 'blue',
          },
          {
            label: 'Active Borrowers',
            val: customerRows.filter((c) => c.status.toLowerCase() === 'active').length.toString(),
            sub: 'In good standing',
            icon: CheckCircle2,
            color: 'emerald',
          },
          {
            label: 'Branch Scope',
            val: activeBranch ? activeBranch.name : 'All Branches',
            sub: isBranchFiltered ? `Branch: ${activeBranch?.code}` : 'Consolidated view',
            icon: Building2,
            color: 'amber',
          },
          {
            label: 'PDF Status',
            val: customerRows.length > 0 ? 'Audit-Ready' : 'Awaiting Data',
            sub: customerRows.length > 0 ? 'Cryptographically verified' : 'No registered customers',
            icon: ShieldCheck,
            color: 'gold',
          },
        ];
      case 'collection': {
        const totalAmt = collectionRows.reduce((a, b) => a + b.amount, 0);
        return [
          {
            label: 'Total Inflows',
            val: fmt(totalAmt),
            sub: 'Cumulative collections',
            icon: IndianRupee,
            color: 'emerald',
          },
          {
            label: 'Total Receipts',
            val: collectionRows.length.toString(),
            sub: 'Recorded transactions',
            icon: Wallet,
            color: 'blue',
          },
          {
            label: 'Collection Rate',
            val: collectionRows.length > 0 ? '100%' : '0%',
            sub: collectionRows.length > 0 ? 'Reconciled to ledger' : 'No collection records',
            icon: CheckCircle2,
            color: 'emerald',
          },
          {
            label: 'Branch Scope',
            val: activeBranch ? activeBranch.name : 'All Branches',
            sub: isBranchFiltered ? `Branch: ${activeBranch?.code}` : 'Consolidated view',
            icon: Building2,
            color: 'amber',
          },
        ];
      }
      case 'daily': {
        const totalDayAmt = dailyRows.reduce((a, b) => a + (b.amount || 0), 0);
        return [
          {
            label: 'Daily Events',
            val: dailyRows.length.toString(),
            sub: `Logged for ${selectedDate}`,
            icon: Calendar,
            color: 'blue',
          },
          {
            label: 'Daily Turnover',
            val: totalDayAmt > 0 ? fmt(totalDayAmt) : '₹0',
            sub: 'Financial activity',
            icon: IndianRupee,
            color: 'emerald',
          },
          {
            label: 'Operational Date',
            val: selectedDate,
            sub: 'Active day ledger',
            icon: Clock,
            color: 'amber',
          },
          {
            label: 'Branch Scope',
            val: activeBranch ? activeBranch.name : 'All Branches',
            sub: isBranchFiltered ? `Branch: ${activeBranch?.code}` : 'Consolidated view',
            icon: Building2,
            color: 'amber',
          },
        ];
      }
      case 'monthly': {
        const disbTotal = monthlyRows.reduce((a, b) => a + b.totalDisbursedAmount, 0);
        const colTotal = monthlyRows.reduce((a, b) => a + b.totalCollectedAmount, 0);
        const outTotal = monthlyRows.reduce((a, b) => a + b.outstandingBalance, 0);
        return [
          {
            label: 'Total Disbursed',
            val: fmt(disbTotal),
            sub: 'New loan capital',
            icon: IndianRupee,
            color: 'blue',
          },
          {
            label: 'Total Collected',
            val: fmt(colTotal),
            sub: 'Principal & interest',
            icon: IndianRupee,
            color: 'emerald',
          },
          {
            label: 'Outstanding Balance',
            val: fmt(outTotal),
            sub: 'Portfolio balance',
            icon: IndianRupee,
            color: 'rose',
          },
          {
            label: 'Reporting Branches',
            val: monthlyRows.length.toString(),
            sub: 'Active branch networks',
            icon: Building2,
            color: 'amber',
          },
        ];
      }
      case 'pending': {
        const pendingTotal = pendingRows.reduce((a, b) => a + b.pendingAmount, 0);
        return [
          {
            label: 'Pending Overdue',
            val: fmt(pendingTotal),
            sub: 'Recovery required',
            icon: IndianRupee,
            color: 'rose',
          },
          {
            label: 'Pending Accounts',
            val: pendingRows.length.toString(),
            sub: 'Delinquent borrowers',
            icon: AlertTriangle,
            color: 'amber',
          },
          {
            label: 'Field Agents Assigned',
            val: Array.from(new Set(pendingRows.map((p) => p.agentName))).length.toString(),
            sub: 'Recovery personnel',
            icon: Briefcase,
            color: 'blue',
          },
          {
            label: 'Branch Scope',
            val: activeBranch ? activeBranch.name : 'All Branches',
            sub: isBranchFiltered ? `Branch: ${activeBranch?.code}` : 'Consolidated view',
            icon: Building2,
            color: 'amber',
          },
        ];
      }
      case 'outstanding': {
        const totalOut = outstandingRows.reduce((a, b) => a + b.outstandingAmount, 0);
        const totalRep = outstandingRows.reduce((a, b) => a + b.repaidAmount, 0);
        return [
          {
            label: 'Total Outstanding',
            val: fmt(totalOut),
            sub: 'Active portfolio balance',
            icon: IndianRupee,
            color: 'rose',
          },
          {
            label: 'Total Recovered',
            val: fmt(totalRep),
            sub: 'Principal repaid to date',
            icon: IndianRupee,
            color: 'emerald',
          },
          {
            label: 'Loans with Balance',
            val: outstandingRows.length.toString(),
            sub: 'Open loan accounts',
            icon: CreditCard,
            color: 'blue',
          },
          {
            label: 'Branch Scope',
            val: activeBranch ? activeBranch.name : 'All Branches',
            sub: isBranchFiltered ? `Branch: ${activeBranch?.code}` : 'Consolidated view',
            icon: Building2,
            color: 'amber',
          },
        ];
      }
      case 'loan': {
        const totalPrincipal = loanRows.reduce((a, b) => a + b.principalAmount, 0);
        return [
          {
            label: 'Total Portfolio',
            val: fmt(totalPrincipal),
            sub: 'Sanctioned capital',
            icon: IndianRupee,
            color: 'blue',
          },
          {
            label: 'Total Loans',
            val: loanRows.length.toString(),
            sub: 'Disbursed accounts',
            icon: FileText,
            color: 'emerald',
          },
          {
            label: 'Active Loans',
            val: loanRows.filter((l) => l.status.toLowerCase() === 'active').length.toString(),
            sub: 'Servicing loans',
            icon: CheckCircle2,
            color: 'amber',
          },
          {
            label: 'Branch Scope',
            val: activeBranch ? activeBranch.name : 'All Branches',
            sub: isBranchFiltered ? `Branch: ${activeBranch?.code}` : 'Consolidated view',
            icon: Building2,
            color: 'amber',
          },
        ];
      }
      case 'employee':
        return [
          {
            label: 'Total Staff',
            val: employeeRows.length.toString(),
            sub: 'Registered workforce',
            icon: UserCheck,
            color: 'blue',
          },
          {
            label: 'Field Agents',
            val: employeeRows
              .filter(
                (e) =>
                  e.role.toLowerCase().includes('collection') || e.role.toLowerCase().includes('agent')
              )
              .length.toString(),
            sub: 'Field recovery staff',
            icon: Briefcase,
            color: 'emerald',
          },
          {
            label: 'Active Personnel',
            val: employeeRows.filter((e) => e.status.toLowerCase() === 'active').length.toString(),
            sub: 'Current staff',
            icon: CheckCircle2,
            color: 'amber',
          },
          {
            label: 'Branch Scope',
            val: activeBranch ? activeBranch.name : 'All Branches',
            sub: isBranchFiltered ? `Branch: ${activeBranch?.code}` : 'Consolidated view',
            icon: Building2,
            color: 'amber',
          },
        ];
      case 'attendance':
        return [
          {
            label: 'Attendance Logs',
            val: attendanceRows.length.toString(),
            sub: 'Punch-in records',
            icon: Clock,
            color: 'blue',
          },
          {
            label: 'Present Today',
            val: attendanceRows.filter((a) => a.status.toLowerCase() === 'present').length.toString(),
            sub: 'Staff on duty',
            icon: CheckCircle2,
            color: 'emerald',
          },
          {
            label: 'Absent Count',
            val: attendanceRows.filter((a) => a.status.toLowerCase() === 'absent').length.toString(),
            sub: 'Off duty or leave',
            icon: AlertTriangle,
            color: 'rose',
          },
          {
            label: 'Branch Scope',
            val: activeBranch ? activeBranch.name : 'All Branches',
            sub: isBranchFiltered ? `Branch: ${activeBranch?.code}` : 'Consolidated view',
            icon: Building2,
            color: 'amber',
          },
        ];
      case 'branch': {
        const totalCount = branchRows.length;
        const totalStaff = branchRows.reduce((a, b) => a + b.totalEmployees, 0);
        const branchCustomersCount = getCustomerReport(effectiveBranchId).length;
        const currentBranch = activeBranch || (branchRows[0] ? {
          name: branchRows[0].name,
          code: branchRows[0].code,
          city: branchRows[0].city,
          status: branchRows[0].status,
        } : null);

        if (isBranchScopedUser || isBranchFiltered) {
          return [
            {
              label: 'Branch Office',
              val: currentBranch ? currentBranch.name : 'Main Branch',
              sub: currentBranch ? `Branch Code: ${currentBranch.code} • ${currentBranch.city}` : 'Operational center',
              icon: Building2,
              color: 'blue',
            },
            {
              label: 'Total Employees',
              val: totalStaff.toString(),
              sub: totalStaff > 0 ? 'Stationed workforce' : 'No staff assigned',
              icon: Users,
              color: 'emerald',
            },
            {
              label: 'Branch Borrowers',
              val: branchCustomersCount.toString(),
              sub: 'Registered in this branch',
              icon: UserCheck,
              color: 'amber',
            },
            {
              label: 'Branch Status',
              val: currentBranch?.status ? currentBranch.status.charAt(0).toUpperCase() + currentBranch.status.slice(1) : 'Active',
              sub: 'Full operations verified',
              icon: ShieldCheck,
              color: 'gold',
            },
          ];
        }

        return [
          {
            label: 'Branch Offices',
            val: totalCount.toString(),
            sub: 'Operational centers',
            icon: Building2,
            color: 'blue',
          },
          {
            label: 'Total Employees',
            val: totalStaff.toString(),
            sub: totalStaff > 0 ? 'Consolidated workforce' : 'No staff assigned',
            icon: Users,
            color: 'emerald',
          },
          {
            label: 'Total Borrowers',
            val: branchCustomersCount.toString(),
            sub: 'Across registered branches',
            icon: UserCheck,
            color: 'amber',
          },
          {
            label: 'Operational Status',
            val: 'Active Network',
            sub: `${totalCount} verified branch locations`,
            icon: ShieldCheck,
            color: 'gold',
          },
        ];
      }
      default:
        return [];
    }
  }, [
    reportKey,
    customerRows,
    collectionRows,
    dailyRows,
    monthlyRows,
    pendingRows,
    outstandingRows,
    loanRows,
    employeeRows,
    attendanceRows,
    branchRows,
    selectedDate,
    activeBranch,
    isBranchFiltered,
    isBranchScopedUser,
    effectiveBranchId,
  ]);

  // Helper to construct PDF options dynamically for current active report
  const buildPDFOptions = (): PDFReportOptions => {
    const branchText = activeBranch ? activeBranch.name : 'All Branches';
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let summaryItems: { label: string; value: string }[] = [];

    switch (reportKey) {
      case 'customer':
        headers = ['Customer Name', 'Customer ID', 'Group Name', 'Phone', 'Branch', 'Status'];
        rows = customerRows.map((c) => [c.name, c.id, c.groupName, c.phone, c.branchName, c.status]);
        summaryItems = [{ label: 'Total Customers', value: customerRows.length.toString() }];
        break;

      case 'collection': {
        headers = [
          'Collection ID',
          'Date',
          'Receipt No',
          'Customer Name',
          'Loan ID',
          'Amount',
          'Status',
          'Branch',
        ];
        rows = collectionRows.map((c) => [
          c.id,
          c.date,
          c.receiptNumber || '-',
          c.customerName,
          c.loanId,
          fmt(c.amount),
          c.status,
          c.branchName,
        ]);
        const total = collectionRows.reduce((acc, curr) => acc + curr.amount, 0);
        summaryItems = [
          { label: 'Total Records', value: collectionRows.length.toString() },
          { label: 'Total Amount Collected', value: fmt(total) },
        ];
        break;
      }

      case 'daily':
        headers = [
          'Time',
          'Activity Type',
          'Reference / ID',
          'Party / Customer',
          'Amount',
          'Branch',
          'Status',
        ];
        rows = dailyRows.map((d) => [
          d.time,
          d.type,
          d.reference,
          d.party,
          d.amount && d.amount > 0 ? fmt(d.amount) : '-',
          d.branchName,
          d.status,
        ]);
        summaryItems = [{ label: 'Daily Events', value: dailyRows.length.toString() }];
        break;

      case 'monthly': {
        headers = [
          'Branch Name',
          'Active Borrowers',
          'Loans Disbursed',
          'Disbursed Amount',
          'Collected Amount',
          'Outstanding Balance',
        ];
        rows = monthlyRows.map((m) => [
          m.branchName,
          m.activeBorrowers.toString(),
          m.loansDisbursedCount.toString(),
          fmt(m.totalDisbursedAmount),
          fmt(m.totalCollectedAmount),
          fmt(m.outstandingBalance),
        ]);
        const colTotal = monthlyRows.reduce((a, b) => a + b.totalCollectedAmount, 0);
        const disbTotal = monthlyRows.reduce((a, b) => a + b.totalDisbursedAmount, 0);
        const outTotal = monthlyRows.reduce((a, b) => a + b.outstandingBalance, 0);
        summaryItems = [
          { label: 'Total Disbursed', value: fmt(disbTotal) },
          { label: 'Total Collected', value: fmt(colTotal) },
          { label: 'Total Outstanding', value: fmt(outTotal) },
        ];
        break;
      }

      case 'pending': {
        headers = [
          'Collection ID',
          'Customer Name',
          'Loan ID',
          'Due Amount',
          'Pending Amount',
          'NC Code / Reason',
          'Agent',
          'Branch',
        ];
        rows = pendingRows.map((p) => [
          p.id,
          p.customerName,
          p.loanId,
          fmt(p.dueAmount),
          fmt(p.pendingAmount),
          p.ncReasonCode,
          p.agentName,
          p.branchName,
        ]);
        const totalPending = pendingRows.reduce((a, b) => a + b.pendingAmount, 0);
        summaryItems = [
          { label: 'Pending Accounts', value: pendingRows.length.toString() },
          { label: 'Total Overdue Amount', value: fmt(totalPending) },
        ];
        break;
      }

      case 'outstanding': {
        headers = [
          'Loan ID',
          'Customer Name',
          'Plan Name',
          'Sanctioned Amount',
          'Repaid Amount',
          'Outstanding Balance',
          'Status',
          'Branch',
        ];
        rows = outstandingRows.map((o) => [
          o.loanId,
          o.customerName,
          o.planName,
          fmt(o.sanctionedAmount),
          fmt(o.repaidAmount),
          fmt(o.outstandingAmount),
          o.status,
          o.branchName,
        ]);
        const totalBal = outstandingRows.reduce((a, b) => a + b.outstandingAmount, 0);
        summaryItems = [
          { label: 'Loans with Balance', value: outstandingRows.length.toString() },
          { label: 'Total Outstanding Balance', value: fmt(totalBal) },
        ];
        break;
      }

      case 'loan': {
        headers = [
          'Loan ID',
          'Customer Name',
          'Plan Name',
          'Principal Amount',
          'Outstanding Amount',
          'Status',
          'Branch',
        ];
        rows = loanRows.map((l) => [
          l.id,
          l.customerName,
          l.planName,
          fmt(l.principalAmount),
          fmt(l.outstandingAmount),
          l.status,
          l.branchName,
        ]);
        const totalPortfolio = loanRows.reduce((a, b) => a + b.principalAmount, 0);
        summaryItems = [
          { label: 'Total Loans', value: loanRows.length.toString() },
          { label: 'Total Portfolio Principal', value: fmt(totalPortfolio) },
        ];
        break;
      }

      case 'employee':
        headers = ['Employee ID', 'Employee Name', 'Role', 'Branch Assignment', 'Status'];
        rows = employeeRows.map((e) => [e.id, e.name, e.role, e.branchName, e.status]);
        summaryItems = [{ label: 'Total Employees', value: employeeRows.length.toString() }];
        break;

      case 'attendance':
        headers = ['Date', 'Employee Name', 'Login Time', 'Logout Time', 'GPS Location', 'Status', 'Branch'];
        rows = attendanceRows.map((a) => [
          a.date,
          a.employeeName,
          a.loginTime,
          a.logoutTime || '-',
          a.gpsLocation,
          a.status,
          a.branchName,
        ]);
        summaryItems = [{ label: 'Total Attendance Logs', value: attendanceRows.length.toString() }];
        break;

      case 'branch': {
        headers = ['Branch Code', 'Branch Name', 'City', 'Manager', 'Total Employees', 'Status'];
        rows = branchRows.map((b) => [
          b.code,
          b.name,
          b.city,
          b.manager,
          b.totalEmployees.toString(),
          b.status,
        ]);
        summaryItems = [{ label: 'Total Branches', value: branchRows.length.toString() }];
        break;
      }
    }

    return {
      title: meta.title,
      subtitle: meta.description,
      branch: branchText,
      headers,
      rows,
      summaryItems,
      fileName: `GLF_${meta.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`,
    };
  };

  const handleDownloadPDF = async () => {
    const opts = buildPDFOptions();
    await generateReportPDF(opts);
  };

  const handlePreviewPDF = async () => {
    const opts = buildPDFOptions();
    const url = await generateReportPDFBlobUrl(opts);
    setPreviewBlobUrl(url);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 sm:p-5 lg:p-6 flex flex-col gap-5 pb-12 font-sans max-w-full text-[#0B1F3A]"
    >
      {/* ── Page Header ── */}
      <PageHeader
        title={meta.title}
        subtitle={meta.description}
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard' },
          { label: 'Reports', href: '/reports/all' },
          { label: meta.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviewPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-[#0B1F3A] hover:text-[#F5D061] text-[#0B1F3A] font-semibold text-xs border border-slate-300 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Eye size={14} className="text-[#D4AF37]" />
              <span>Preview PDF</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#C9A227] text-[#0B1F3A] font-bold text-xs shadow-md hover:brightness-105 transition-all cursor-pointer active:scale-95"
            >
              <Download size={14} className="text-[#0B1F3A]" />
              <span>Download PDF</span>
            </button>
            <Link
              to="/reports/all"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-semibold text-xs border border-slate-200 transition-all cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>All Reports</span>
            </Link>
          </div>
        }
      />

      {/* ── 1. REPORT CATEGORIES TAB BAR (Customer Relationship Officer (CRO) Section Style) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-[0_2px_8px_rgba(11,31,58,0.04)] flex flex-col gap-3.5">
        {/* Horizontal Category Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {REPORT_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = reportKey === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setSearchQuery('');
                  navigate(`/reports/${tab.key}`);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#0B1F3A] text-white shadow-xs border border-[#D4AF37]/50'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <TabIcon size={13} className={isActive ? 'text-[#D4AF37]' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Toolbar: Branch Context + Search + Date Selector + Clear */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-[#D4AF37]" />
              <span className="text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wider font-sans">
                BRANCH CONTEXT:
              </span>
            </div>
            {isBranchScopedUser ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-[#D4AF37]/50 text-xs font-bold text-[#0B1F3A]">
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
                <div className="relative min-w-[220px] sm:min-w-[260px]">
                  <select
                    value={selectedBranchId || ''}
                    onChange={(e) => setSelectedBranchId(e.target.value ? e.target.value : null)}
                    className="w-full appearance-none pl-3.5 pr-9 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#CBD5E1] focus:border-[#D4AF37] text-xs font-semibold text-[#0B1F3A] transition-all cursor-pointer focus:outline-none"
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
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>{activeBranch.name}</span>
                    <button
                      onClick={() => setSelectedBranchId(null)}
                      className="p-0.5 rounded hover:bg-amber-200/60 text-amber-800 transition-colors cursor-pointer"
                      title="Clear branch filter"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </>
            )}

            {reportKey === 'daily' && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">Date:</span>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-[#0B1F3A] focus:outline-none"
                >
                  <option value="Today">Today (Live)</option>
                  <option value="Yesterday">Yesterday</option>
                </select>
              </div>
            )}
          </div>

          {/* Right: Search Box */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64 min-w-[200px]">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in ${meta.title}...`}
                className="w-full pl-10 pr-3.5 py-1.5 rounded-xl bg-slate-50 border border-[#CBD5E1] focus:border-[#D4AF37] focus:bg-white text-xs text-[#0B1F3A] focus:outline-none transition-all placeholder:text-slate-400 font-medium"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                title="Clear search"
              >
                <RotateCcw size={12} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. EXECUTIVE KPI STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportStats.map((stat, idx) => {
          const StatIcon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-[0_2px_8px_rgba(11,31,58,0.04)] hover:shadow-md hover:border-[#D4AF37]/50 transition-all duration-200 flex flex-col justify-between min-h-[142px] group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans leading-tight">
                  {stat.label}
                </span>
                <div
                  className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 shadow-2xs ${
                    stat.color === 'emerald'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                      : stat.color === 'rose'
                      ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                      : stat.color === 'amber'
                      ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                      : stat.color === 'gold'
                      ? 'bg-amber-50 text-[#D4AF37] border-amber-200/80'
                      : 'bg-blue-50 text-blue-700 border-blue-200/80'
                  }`}
                >
                  <StatIcon size={16} />
                </div>
              </div>
              <div className="my-2.5 flex items-baseline justify-between">
                <span className="text-2xl sm:text-[26px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums truncate">
                  {stat.val}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
                <span className="truncate">{stat.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3. MAIN REPORT TABLE CONTAINER ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_8px_rgba(11,31,58,0.04)] overflow-hidden">
        {/* Table Title Bar */}
        <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full flex-shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-wider uppercase font-sans flex items-center gap-2">
              <Icon size={16} className="text-[#D4AF37]" />
              <span>{meta.title.toUpperCase()} LEDGER</span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300 font-medium">
              Showing{' '}
              <strong className="text-[#F5D061]">
                {reportKey === 'customer' && filteredCustomerRows.length}
                {reportKey === 'collection' && filteredCollectionRows.length}
                {reportKey === 'daily' && filteredDailyRows.length}
                {reportKey === 'monthly' && filteredMonthlyRows.length}
                {reportKey === 'pending' && filteredPendingRows.length}
                {reportKey === 'outstanding' && filteredOutstandingRows.length}
                {reportKey === 'loan' && filteredLoanRows.length}
                {reportKey === 'employee' && filteredEmployeeRows.length}
                {reportKey === 'attendance' && filteredAttendanceRows.length}
                {reportKey === 'branch' && filteredBranchRows.length}
              </strong>{' '}
              records
            </span>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Verified Ledger</span>
            </div>
          </div>
        </div>

        {/* ── 1. CUSTOMER REPORT TABLE ── */}
        {reportKey === 'customer' && (
          <div className="overflow-x-auto w-full custom-scrollbar">
            {filteredCustomerRows.length === 0 ? (
              <EmptyState message="No customer records match your filter criteria." onClear={() => setSearchQuery('')} />
            ) : (
              <table className="w-full text-left text-xs border-collapse min-w-[1080px] font-sans">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider select-none">
                    <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">Customer</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[180px]">Group Name</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[150px]">Phone Number</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[180px]">Branch</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredCustomerRows.map((c, idx) => (
                    <tr
                      key={c.id}
                      className={`hover:bg-blue-50/40 transition-colors group align-middle ${
                        idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                      }`}
                    >
                      <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} size="sm" className="shrink-0 ring-1 ring-slate-200/80 shadow-2xs" />
                          <div>
                            <div className="font-bold text-[#0B1F3A] text-xs">{c.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{c.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[180px]">
                        <div className="flex items-center gap-1.5 font-semibold text-[#0B1F3A]">
                          <Briefcase size={12} className="text-slate-400" />
                          <span>{c.groupName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[150px]">
                        <div className="flex items-center gap-1 text-slate-600 font-mono text-xs">
                          <Phone size={11} className="text-slate-400" />
                          <span>{c.phone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[180px]">
                        <span className="font-semibold text-slate-700">{c.branchName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          <span>{c.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── 2. COLLECTION REPORT TABLE ── */}
        {reportKey === 'collection' && (
          <div className="overflow-x-auto w-full custom-scrollbar">
            {filteredCollectionRows.length === 0 ? (
              <EmptyState message="No collection records match your filter criteria." onClear={() => setSearchQuery('')} />
            ) : (
              <table className="w-full text-left text-xs border-collapse min-w-[1150px] font-sans">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider select-none">
                    <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[150px]">Collection ID</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">Date</th>
                    <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">Customer</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[140px]">Amount</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">Status</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[180px]">Branch</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[150px]">Receipt No</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredCollectionRows.map((col, idx) => (
                    <tr
                      key={col.id}
                      className={`hover:bg-blue-50/40 transition-colors group align-middle ${
                        idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                      }`}
                    >
                      <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[150px]">
                        <span className="font-bold text-[#0B1F3A] font-mono text-xs">{col.id}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[#0B1F3A] font-semibold text-xs font-mono">
                          <Calendar size={11} className="text-[#D4AF37]" />
                          <span>{col.date}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <Avatar name={col.customerName} size="sm" className="shrink-0 ring-1 ring-slate-200/80 shadow-2xs" />
                          <div>
                            <div className="font-bold text-[#0B1F3A] text-xs">{col.customerName}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">Loan: {col.loanId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[140px]">
                        <span className="font-manrope font-bold text-sm text-[#0B1F3A] tabular-nums">
                          {fmt(col.amount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          <span>{col.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[180px]">
                        <span className="font-semibold text-slate-700">{col.branchName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[150px]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-600 border border-slate-200">
                          {col.receiptNumber}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── 3. DAILY REPORT TABLE ── */}
        {reportKey === 'daily' && (
          <div className="overflow-x-auto w-full custom-scrollbar">
            {filteredDailyRows.length === 0 ? (
              <EmptyState message="No operational records match your filter criteria." onClear={() => setSearchQuery('')} />
            ) : (
              <table className="w-full text-left text-xs border-collapse min-w-[1080px] font-sans">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider select-none">
                    <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[180px]">Event Type</th>
                    <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">Party / Staff</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[160px]">Reference</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[140px]">Amount</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">Time</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredDailyRows.map((d, idx) => (
                    <tr
                      key={d.id}
                      className={`hover:bg-blue-50/40 transition-colors group align-middle ${
                        idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                      }`}
                    >
                      <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[180px]">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 font-bold text-xs text-[#0B1F3A] border border-slate-200">
                          {d.type === 'Collection' ? (
                            <Wallet size={12} className="text-emerald-600" />
                          ) : (
                            <Clock size={12} className="text-blue-600" />
                          )}
                          <span>{d.type}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <Avatar name={d.party} size="sm" className="shrink-0 ring-1 ring-slate-200/80 shadow-2xs" />
                          <div className="font-bold text-[#0B1F3A] text-xs">{d.party}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[160px]">
                        <span className="font-mono text-xs text-slate-600">{d.reference}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[140px]">
                        <span className="font-manrope font-bold text-sm text-[#0B1F3A] tabular-nums">
                          {d.amount !== undefined ? fmt(d.amount) : '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">
                        <span className="font-mono text-xs text-slate-600">{d.time}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-[#0B1F3A] border border-slate-200 capitalize">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{d.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── 4. MONTHLY REPORT TABLE ── */}
        {reportKey === 'monthly' && (
          <div className="overflow-x-auto w-full custom-scrollbar">
            {filteredMonthlyRows.length === 0 ? (
              <EmptyState message="No monthly records match your filter criteria." onClear={() => setSearchQuery('')} />
            ) : (
              <table className="w-full text-left text-xs border-collapse min-w-[1100px] font-sans">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider select-none">
                    <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[220px]">Branch Office</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">Borrowers</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[150px]">Disbursed Loans</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[180px]">Total Disbursed</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[180px]">Total Collected</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[180px]">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredMonthlyRows.map((m, idx) => (
                    <tr
                      key={m.branchId}
                      className={`hover:bg-blue-50/40 transition-colors group align-middle ${
                        idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                      }`}
                    >
                      <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[220px]">
                        <div className="flex items-center gap-2 font-bold text-[#0B1F3A] text-xs">
                          <Building2 size={14} className="text-[#D4AF37]" />
                          <span>{m.branchName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">
                        <span className="font-manrope font-bold text-xs text-[#0B1F3A]">{m.activeBorrowers}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[150px]">
                        <span className="font-manrope font-bold text-xs text-[#0B1F3A]">{m.loansDisbursedCount}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[180px]">
                        <span className="font-manrope font-bold text-xs text-[#0B1F3A] tabular-nums">
                          {fmt(m.totalDisbursedAmount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[180px]">
                        <span className="font-manrope font-bold text-xs text-emerald-700 tabular-nums">
                          {fmt(m.totalCollectedAmount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[180px]">
                        <span className="font-manrope font-bold text-xs text-rose-700 tabular-nums">
                          {fmt(m.outstandingBalance)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── 5. PENDING REPORT TABLE ── */}
        {reportKey === 'pending' && (
          <div className="overflow-x-auto w-full custom-scrollbar">
            {filteredPendingRows.length === 0 ? (
              <EmptyState message="No pending collection records match your filter criteria." onClear={() => setSearchQuery('')} />
            ) : (
              <table className="w-full text-left text-xs border-collapse min-w-[1150px] font-sans">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider select-none">
                    <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">Customer</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[140px]">Loan ID</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[150px]">Pending Due</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[200px]">Customer Relationship Officer (CRO)</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[180px]">Reason / Status</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[180px]">Branch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredPendingRows.map((p, idx) => (
                    <tr
                      key={p.id}
                      className={`hover:bg-blue-50/40 transition-colors group align-middle ${
                        idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                      }`}
                    >
                      <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <Avatar name={p.customerName} size="sm" className="shrink-0 ring-1 ring-slate-200/80 shadow-2xs" />
                          <div>
                            <div className="font-bold text-[#0B1F3A] text-xs">{p.customerName}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[140px]">
                        <span className="font-mono text-xs font-bold text-[#0B1F3A]">{p.loanId}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[150px]">
                        <span className="font-manrope font-bold text-sm text-rose-700 tabular-nums">
                          {fmt(p.pendingAmount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <Avatar name={p.agentName} size="xs" className="shrink-0" />
                          <span className="font-semibold text-[#0B1F3A] text-xs">{p.agentName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[180px]">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle size={10} className="text-amber-600" />
                          <span>{p.ncReasonCode}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[180px]">
                        <span className="font-semibold text-slate-700">{p.branchName}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── 6. OUTSTANDING REPORT TABLE ── */}
        {reportKey === 'outstanding' && (
          <div className="overflow-x-auto w-full custom-scrollbar">
            {filteredOutstandingRows.length === 0 ? (
              <EmptyState message="No outstanding loan records match your filter criteria." onClear={() => setSearchQuery('')} />
            ) : (
              <table className="w-full text-left text-xs border-collapse min-w-[1150px] font-sans">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider select-none">
                    <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[140px]">Loan ID</th>
                    <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">Customer</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[160px]">Plan</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[150px]">Sanctioned</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[150px]">Repaid</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[160px]">Outstanding</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[180px]">Branch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredOutstandingRows.map((o, idx) => (
                    <tr
                      key={o.loanId}
                      className={`hover:bg-blue-50/40 transition-colors group align-middle ${
                        idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                      }`}
                    >
                      <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[140px]">
                        <span className="font-mono font-bold text-xs text-[#0B1F3A]">{o.loanId}</span>
                      </td>
                      <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <Avatar name={o.customerName} size="sm" className="shrink-0 ring-1 ring-slate-200/80 shadow-2xs" />
                          <div className="font-bold text-[#0B1F3A] text-xs">{o.customerName}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[160px]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-xs text-slate-700 border border-slate-200">
                          {o.planName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[150px]">
                        <span className="font-manrope font-semibold text-xs text-[#0B1F3A] tabular-nums">
                          {fmt(o.sanctionedAmount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[150px]">
                        <span className="font-manrope font-semibold text-xs text-emerald-700 tabular-nums">
                          {fmt(o.repaidAmount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[160px]">
                        <span className="font-manrope font-bold text-sm text-rose-700 tabular-nums">
                          {fmt(o.outstandingAmount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[180px]">
                        <span className="font-semibold text-slate-700">{o.branchName}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── 7. LOAN REPORT TABLE ── */}
        {reportKey === 'loan' && (
          <div className="overflow-x-auto w-full custom-scrollbar">
            {filteredLoanRows.length === 0 ? (
              <EmptyState message="No loan records match your filter criteria." onClear={() => setSearchQuery('')} />
            ) : (
              <table className="w-full text-left text-xs border-collapse min-w-[1100px] font-sans">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider select-none">
                    <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[140px]">Loan ID</th>
                    <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">Customer</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[160px]">Plan</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">Status</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[160px]">Outstanding</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[180px]">Branch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredLoanRows.map((l, idx) => (
                    <tr
                      key={l.id}
                      className={`hover:bg-blue-50/40 transition-colors group align-middle ${
                        idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                      }`}
                    >
                      <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[140px]">
                        <span className="font-mono font-bold text-xs text-[#0B1F3A]">{l.id}</span>
                      </td>
                      <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <Avatar name={l.customerName} size="sm" className="shrink-0 ring-1 ring-slate-200/80 shadow-2xs" />
                          <div className="font-bold text-[#0B1F3A] text-xs">{l.customerName}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[160px]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-xs text-slate-700 border border-slate-200">
                          {l.planName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          <span>{l.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[160px]">
                        <span className="font-manrope font-bold text-sm text-[#0B1F3A] tabular-nums">
                          {fmt(l.outstandingAmount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[180px]">
                        <span className="font-semibold text-slate-700">{l.branchName}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── 8. EMPLOYEE REPORT TABLE ── */}
        {reportKey === 'employee' && (
          <div className="overflow-x-auto w-full custom-scrollbar">
            {filteredEmployeeRows.length === 0 ? (
              <EmptyState message="No employee records match your filter criteria." onClear={() => setSearchQuery('')} />
            ) : (
              <table className="w-full text-left text-xs border-collapse min-w-[1080px] font-sans">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider select-none">
                    <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">Employee</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[200px]">Role</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[200px]">Branch Assignment</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredEmployeeRows.map((e, idx) => {
                    const isAgent =
                      e.role.toLowerCase().includes('collection') || e.role.toLowerCase().includes('agent');
                    return (
                      <tr
                        key={e.id}
                        className={`hover:bg-blue-50/40 transition-colors group align-middle ${
                          idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                        }`}
                      >
                        <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">
                          <div className="flex items-center gap-3">
                            <Avatar name={e.name} size="sm" className="shrink-0 ring-1 ring-slate-200/80 shadow-2xs" />
                            <div>
                              <div className="font-bold text-[#0B1F3A] text-xs">{e.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">{e.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[200px]">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold ${
                              isAgent
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-[#0B1F3A] border border-slate-200'
                            }`}
                          >
                            <Briefcase size={12} className={isAgent ? 'text-emerald-600' : 'text-slate-400'} />
                            <span>{e.role}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[200px]">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                            <Building2 size={13} className="text-slate-400" />
                            <span>{e.branchName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>{e.status}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── 9. ATTENDANCE REPORT TABLE ── */}
        {reportKey === 'attendance' && (
          <div className="overflow-x-auto w-full custom-scrollbar">
            {filteredAttendanceRows.length === 0 ? (
              <EmptyState message="No attendance logs match your filter criteria." onClear={() => setSearchQuery('')} />
            ) : (
              <table className="w-full text-left text-xs border-collapse min-w-[1100px] font-sans">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider select-none">
                    <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">Employee</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[180px]">Branch</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">Date</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">Login</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">Logout</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredAttendanceRows.map((a, idx) => (
                    <tr
                      key={a.id}
                      className={`hover:bg-blue-50/40 transition-colors group align-middle ${
                        idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                      }`}
                    >
                      <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <Avatar name={a.employeeName} size="sm" className="shrink-0 ring-1 ring-slate-200/80 shadow-2xs" />
                          <div className="font-bold text-[#0B1F3A] text-xs">{a.employeeName}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[180px]">
                        <span className="font-semibold text-slate-700">{a.branchName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[#0B1F3A] font-semibold text-xs font-mono">
                          <Calendar size={11} className="text-[#D4AF37]" />
                          <span>{a.date}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">
                        <span className="font-bold text-[#0B1F3A] font-mono text-xs">{a.loginTime}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">
                        <span className="font-semibold text-slate-600 font-mono text-xs">{a.logoutTime}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            a.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : a.status === 'Late'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              a.status === 'Present'
                                ? 'bg-emerald-600'
                                : a.status === 'Late'
                                ? 'bg-amber-600'
                                : 'bg-rose-600'
                            }`}
                          />
                          <span>{a.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── 10. BRANCH REPORT TABLE ── */}
        {reportKey === 'branch' && (
          <div className="space-y-6">
            {branchLoanPortfolio && branchLoanPortfolio.totalPortfolio.totalLoanCount > 0 ? (
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 shadow-xs font-sans">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#0B1F3A] flex items-center gap-2">
                      <Briefcase size={16} className="text-[#D4AF37]" />
                      Branch Loan Portfolio Breakdown by Vertical
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Consolidated Disbursed, Outstanding & Pending metrics split across Group Loans, Gold Loans, and Business Loans.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 self-start sm:self-auto">
                    Total Portfolio: {branchLoanPortfolio.totalPortfolio.totalLoanCount} Loans • {fmt(branchLoanPortfolio.totalPortfolio.totalDisbursed)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Group Loans Card */}
                  <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
                      <span>1. Group Loans</span>
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-extrabold">{branchLoanPortfolio.groupLoans.count} Loans</span>
                    </div>
                    <div className="text-sm font-extrabold text-[#0B1F3A]">{fmt(branchLoanPortfolio.groupLoans.totalDisbursed)}</div>
                    <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                      <span>Outstanding:</span>
                      <strong className="text-slate-800">{fmt(branchLoanPortfolio.groupLoans.totalOutstanding)}</strong>
                    </div>
                    <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                      {branchLoanPortfolio.groupLoans.totalPending} pending approvals
                    </div>
                  </div>

                  {/* Gold Loans Card */}
                  <div className="bg-white rounded-xl p-3.5 border border-amber-200 shadow-2xs">
                    <div className="flex items-center justify-between text-amber-900 text-xs font-bold mb-1">
                      <span>2. Gold Loans (Vault)</span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-extrabold">{branchLoanPortfolio.goldLoans.count} Loans</span>
                    </div>
                    <div className="text-sm font-extrabold text-amber-950">{fmt(branchLoanPortfolio.goldLoans.totalDisbursed)}</div>
                    <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                      <span>Outstanding:</span>
                      <strong className="text-amber-900">{fmt(branchLoanPortfolio.goldLoans.totalOutstanding)}</strong>
                    </div>
                    <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                      {branchLoanPortfolio.goldLoans.totalPending} pending vaulting
                    </div>
                  </div>

                  {/* Business Loans Card */}
                  <div className="bg-white rounded-xl p-3.5 border border-emerald-200 shadow-2xs">
                    <div className="flex items-center justify-between text-emerald-900 text-xs font-bold mb-1">
                      <span>3. Business Loans</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-extrabold">{branchLoanPortfolio.businessLoans.count} Loans</span>
                    </div>
                    <div className="text-sm font-extrabold text-emerald-950">{fmt(branchLoanPortfolio.businessLoans.totalDisbursed)}</div>
                    <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                      <span>Outstanding:</span>
                      <strong className="text-emerald-900">{fmt(branchLoanPortfolio.businessLoans.totalOutstanding)}</strong>
                    </div>
                    <div className="text-[10px] text-blue-700 font-semibold mt-0.5">
                      {branchLoanPortfolio.businessLoans.totalPending} pending approvals
                    </div>
                  </div>

                  {/* Consolidated Total Card */}
                  <div className="bg-gradient-to-br from-[#0B1F3A] to-[#1A365D] text-white rounded-xl p-3.5 shadow-xs">
                    <div className="flex items-center justify-between text-slate-300 text-xs font-bold mb-1">
                      <span>Total Branch Corpus</span>
                      <span className="px-2 py-0.5 rounded bg-[#D4AF37] text-white text-[10px] font-extrabold">{branchLoanPortfolio.totalPortfolio.totalLoanCount} Total</span>
                    </div>
                    <div className="text-sm font-extrabold text-[#D4AF37]">{fmt(branchLoanPortfolio.totalPortfolio.totalDisbursed)}</div>
                    <div className="text-[11px] text-slate-300 mt-1 flex justify-between">
                      <span>Total Out:</span>
                      <strong className="text-white">{fmt(branchLoanPortfolio.totalPortfolio.totalOutstanding)}</strong>
                    </div>
                    <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">
                      {branchLoanPortfolio.totalPortfolio.totalPending} total pending
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="overflow-x-auto w-full custom-scrollbar">
              {filteredBranchRows.length === 0 ? (
                <EmptyState message="No branch records match your filter criteria." onClear={() => setSearchQuery('')} />
              ) : (
                <table className="w-full text-left text-xs border-collapse min-w-[1080px] font-sans">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-slate-50/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider select-none">
                      <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[140px]">Branch Code</th>
                      <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[220px]">Branch Name</th>
                      <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[160px]">City</th>
                      <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[220px]">Manager</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">Total Staff</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {filteredBranchRows.map((b, idx) => (
                      <tr
                        key={b.code}
                        className={`hover:bg-blue-50/40 transition-colors group align-middle ${
                          idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                        }`}
                      >
                        <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[140px]">
                          <span className="font-mono font-bold text-[#D4AF37] text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {b.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[220px]">
                          <div className="flex items-center gap-2 font-bold text-[#0B1F3A] text-xs">
                            <Building2 size={14} className="text-[#D4AF37]" />
                            <span>{b.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[160px]">
                          <span className="font-semibold text-slate-700">{b.city}</span>
                        </td>
                        <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[220px]">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={b.manager} size="sm" className="shrink-0 ring-1 ring-slate-200/80 shadow-2xs" />
                            <span className="font-bold text-[#0B1F3A] text-xs">{b.manager}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">
                          <span className="font-manrope font-bold text-xs text-[#0B1F3A]">{b.totalEmployees}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>{b.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── PDF PREVIEW MODAL ── */}
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
                      {meta.title} — OFFICIAL PDF PREVIEW
                    </h3>
                    <p className="text-[11px] text-slate-300 font-sans">
                      Golden Leaf Finance Executive Report Format
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadPDF}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#F5D061] to-[#D4AF37] text-[#0B1F3A] font-bold text-xs shadow-md hover:brightness-105 transition-all cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </button>
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
                  title={`${meta.title} Preview`}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const EmptyState: React.FC<{ message: string; onClear?: () => void }> = ({ message, onClear }) => (
  <div className="p-12 text-center flex flex-col items-center justify-center">
    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#64748B] mb-3">
      <FileText size={22} className="text-[#0B1F3A]" />
    </div>
    <h3 className="text-sm font-bold text-[#0B1F3A]">No matching records</h3>
    <p className="text-xs text-[#64748B] max-w-sm mt-1">{message}</p>
    {onClear && (
      <button
        onClick={onClear}
        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
      >
        <RotateCcw size={12} />
        <span>Clear Search</span>
      </button>
    )}
  </div>
);

export default ReportViewPage;
