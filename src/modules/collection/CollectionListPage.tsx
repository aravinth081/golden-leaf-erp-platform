// ──────────────────────────────────────────────────
// Golden Leaf Finance — Customer Relationship Officer (CRO): Collection History
// Strictly aligned with Finance Collection & Loan Management System PDF
// Single source of truth, real-time historical collection ledger
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Search,
  Calendar,
  User,
  Users,
  Building2,
  FileText,
  ArrowUpDown,
  Eye,
  Loader2,
  SearchX,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  CreditCard,
  Banknote,
  Landmark,
  X,
  Phone,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore, useUIStore } from '../../store';
import {
  getMonitoredCustomers,
  getMonitoredLoans,
  getMonitoredCollections,
  type MonitoredCustomer,
  type MonitoredLoan,
  type MonitoredCollection,
} from '../../services/monitoringDataService';
import {
  generateBillPDF,
  generateBillPDFBlobUrl,
  generateReportPDF,
  type PDFBillOptions,
} from '../../utils/pdfGenerator';

export interface HistoryRecordItem {
  id: string; // e.g. 'COL-9011' or 'ADV-1001'
  customerId: string;
  customerName: string;
  customerPhone: string;
  loanId: string;
  centerName: string;
  groupName: string;
  branchId: string;
  branchName: string;
  agentName: string;
  expectedAmount: number;
  collectedAmount: number;
  collectionDate: string;
  collectionTime?: string;
  status: 'collected' | 'partial' | 'advance' | 'nc' | 'pending';
  paymentMode: string;
  receiptNumber: string;
  ncReason?: string;
  ncRemarks?: string;
  rawCollection: MonitoredCollection;
}

type SortField = 'id' | 'customer' | 'agent' | 'expected' | 'collected' | 'date' | 'status';
type SortOrder = 'asc' | 'desc';

export const CollectionListPage: React.FC = () => {
  const currentUser = useAuthStore((s) => s.user);
  const { addToast } = useUIStore();

  // Core Data States
  const [records, setRecords] = useState<HistoryRecordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(''); // empty = all dates
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Receipt Modal States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPreviewOpen) {
        setIsPreviewOpen(false);
        if (previewBlobUrl) {
          URL.revokeObjectURL(previewBlobUrl);
          setPreviewBlobUrl(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewOpen, previewBlobUrl]);

  // ── 1. LOAD COLLECTION TRANSACTIONS FROM SINGLE SOURCE OF TRUTH (Section 3, 5, 13) ──
  const loadHistoryData = () => {
    try {
      setIsLoading(true);
      setDataError(false);

      const allCusts = getMonitoredCustomers(null);
      const allLoans = getMonitoredLoans(null);
      const allCollections = getMonitoredCollections(null);

      // Customer Map
      const custMap = new Map<string, MonitoredCustomer>();
      allCusts.forEach((c) => {
        if (c.id) custMap.set(c.id, c);
      });

      // Loan Map
      const loanMap = new Map<string, MonitoredLoan>();
      allLoans.forEach((l) => {
        if (l.id) loanMap.set(l.id, l);
      });

      const items: HistoryRecordItem[] = allCollections.map((col) => {
        const cust = custMap.get(col.customerId);
        const loan = loanMap.get(col.loanId);

        // Normalize status
        let normalizedStatus: 'collected' | 'partial' | 'advance' | 'nc' | 'pending' = 'collected';
        if (col.status === 'advance') {
          normalizedStatus = 'advance';
        } else if (col.status === 'nc') {
          normalizedStatus = 'nc';
        } else if (col.status === 'partial') {
          normalizedStatus = 'partial';
        } else if (col.status === 'pending' || col.status === 'delayed') {
          normalizedStatus = 'pending';
        } else {
          normalizedStatus = 'collected';
        }

        // Expected amount: scheduled dueAmount or expectedAmount
        const expAmt = col.dueAmount ?? col.expectedAmount ?? 2500;

        // Collected amount: if NC or Pending without collection, 0
        const colAmt =
          normalizedStatus === 'nc' || (normalizedStatus === 'pending' && (!col.collectedAmount || col.collectedAmount === 0))
            ? 0
            : col.collectedAmount ?? 0;

        // Formatted date string
        let dateStr = col.date;
        if (dateStr === 'Today') {
          dateStr = new Date().toISOString().slice(0, 10);
        } else if (dateStr === 'Tomorrow') {
          const tomorrow = new Date(Date.now() + 86400000);
          dateStr = tomorrow.toISOString().slice(0, 10);
        }

        return {
          id: col.id,
          customerId: col.customerId,
          customerName: col.customerName || cust?.name || 'Registered Customer',
          customerPhone: col.customerPhone || cust?.phone || '+91 98401 11222',
          loanId: col.loanId || (loan ? loan.id : 'GLF-L-2001'),
          centerName: col.area || cust?.centerName || 'Center 01 - Anna Nagar East',
          groupName: col.groupName || cust?.groupName || 'Malar Magalir Sangam',
          branchId: col.branchId || 'BR-01',
          branchName: col.branchName || 'Main Branch - Anna Nagar',
          agentName: col.agentName || 'Authorized Officer',
          expectedAmount: expAmt,
          collectedAmount: colAmt,
          collectionDate: dateStr,
          collectionTime: col.time || '10:00 AM',
          status: normalizedStatus,
          paymentMode: col.paymentMode || 'Cash at Center',
          receiptNumber:
            col.receiptNumber && col.receiptNumber !== 'Pending'
              ? col.receiptNumber
              : `RCP-HIST-${col.id.slice(-4)}`,
          ncReason: col.ncReasonCode,
          ncRemarks: col.ncRemarks,
          rawCollection: col,
        };
      });

      setRecords(items);
    } catch (err) {
      console.error('Failed to load collection history:', err);
      setDataError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistoryData();

    const handleCollectionsUpdated = () => {
      loadHistoryData();
    };
    window.addEventListener('glf-collections-updated', handleCollectionsUpdated);
    return () => {
      window.removeEventListener('glf-collections-updated', handleCollectionsUpdated);
    };
  }, []);

  // ── 2. DYNAMIC AGENT OPTIONS (Section 25) ──
  const uniqueAgents = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.agentName) set.add(r.agentName);
    });
    return Array.from(set).sort();
  }, [records]);

  // ── 3. SEARCH & FILTERING (Section 22, 23, 24, 25, 26, 30) ──
  const filteredRecords = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase();
    const queryDigits = searchQuery.replace(/\D/g, '');

    const filtered = records.filter((r) => {
      // Status Filter
      if (selectedStatus !== 'all' && r.status !== selectedStatus) {
        return false;
      }

      // Agent Filter
      if (selectedAgent !== 'all' && r.agentName !== selectedAgent) {
        return false;
      }

      // Date Filter (Section 26)
      if (selectedDate && r.collectionDate !== selectedDate) {
        return false;
      }

      // Search Query
      if (!rawQuery) return true;

      const nameMatch = r.customerName.toLowerCase().includes(rawQuery);
      const idMatch = r.id.toLowerCase().includes(rawQuery) || r.customerId.toLowerCase().includes(rawQuery);
      const loanMatch = r.loanId.toLowerCase().includes(rawQuery);
      const phoneMatch =
        queryDigits.length >= 3
          ? r.customerPhone.replace(/\D/g, '').includes(queryDigits)
          : r.customerPhone.toLowerCase().includes(rawQuery);

      return nameMatch || idMatch || loanMatch || phoneMatch;
    });

    // Sorting (Section 30)
    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'id') {
        comparison = a.id.localeCompare(b.id);
      } else if (sortField === 'customer') {
        comparison = a.customerName.localeCompare(b.customerName);
      } else if (sortField === 'agent') {
        comparison = a.agentName.localeCompare(b.agentName);
      } else if (sortField === 'expected') {
        comparison = a.expectedAmount - b.expectedAmount;
      } else if (sortField === 'collected') {
        comparison = a.collectedAmount - b.collectedAmount;
      } else if (sortField === 'date') {
        comparison = a.collectionDate.localeCompare(b.collectionDate);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [records, searchQuery, selectedStatus, selectedAgent, selectedDate, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // ── 4. DYNAMIC FILTERED KPI COMPUTATIONS (Section 18, 19, 20, 21, 28, 45) ──
  // Formula: TOTAL COLLECTED = SUM(actual collected amounts) within current filter scope
  const totalCollected = useMemo(
    () => filteredRecords.reduce((acc, r) => acc + (r.collectedAmount || 0), 0),
    [filteredRecords]
  );

  // Formula: TOTAL EXPECTED = SUM(expected amounts) within current filter scope
  const totalExpected = useMemo(
    () => filteredRecords.reduce((acc, r) => acc + (r.expectedAmount || 0), 0),
    [filteredRecords]
  );

  // Formula: PENDING ACCOUNTS = COUNT(pending, partial, nc)
  const pendingAccountsCount = useMemo(
    () => filteredRecords.filter((r) => r.status === 'pending' || r.status === 'partial' || r.status === 'nc').length,
    [filteredRecords]
  );

  // Formula: COMPLETED COLLECTIONS = COUNT(collected, advance)
  const completedCollectionsCount = useMemo(
    () => filteredRecords.filter((r) => r.status === 'collected' || r.status === 'advance').length,
    [filteredRecords]
  );

  // ── 5. RESET FILTERS (Section 27, 60) ──
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedAgent('all');
    setSelectedDate('');
  };

  // ── 6. OFFICIAL A4 RECEIPT PREVIEW & DOWNLOAD (Section 11, 28) ──
  const getReceiptOptions = (r: HistoryRecordItem): PDFBillOptions => {
    const cust = getMonitoredCustomers(null).find((c) => c.id === r.customerId);
    const loan = getMonitoredLoans(null).find((l) => l.id === r.loanId);

    const outstanding =
      loan?.outstandingAmount ??
      cust?.outstandingBalance ??
      (r.status === 'advance' ? 35000 : 37500);

    return {
      receiptNo: r.receiptNumber,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: r.collectionTime || '10:45 AM',
      customerName: r.customerName,
      customerId: r.customerId,
      phone: r.customerPhone || cust?.phone || '—',
      spouseName: cust?.nomineeName || '—',
      groupName: r.groupName || cust?.groupName || '—',
      centerName: r.centerName || cust?.centerName || '—',
      loanId: r.loanId,
      installmentNo: r.rawCollection?.installment || '04 / 20',
      demandAmount: r.expectedAmount,
      collectedAmount: r.collectedAmount,
      paymentMode: r.paymentMode,
      status: r.status === 'collected' ? 'Collected' : r.status === 'advance' ? 'Advance' : 'Partial',
      agentName: r.agentName,
      branchName: r.branchName || 'Main Branch - Anna Nagar',
      fileName: `Receipt_${r.customerId}_${r.id}.pdf`,
      outstandingBalance: outstanding,
      totalLoanAmount: loan?.principalAmount ?? cust?.activeLoanAmount ?? 50000,
      transactionRef: `CBS-TXN-2026-${r.id.replace(/\D/g, '') || '9010'}`,
      address: cust?.address ? `${cust.address}, ${cust.city} - ${cust.pincode}` : undefined,
      loanProduct: loan?.planName || 'Micro Business Loan (JLG)',
    };
  };

  const handlePreviewReceipt = async (r: HistoryRecordItem) => {
    try {
      const opts = getReceiptOptions(r);
      const url = await generateBillPDFBlobUrl(opts);
      setPreviewBlobUrl(url);
      setPreviewTitle(`Collection Receipt — ${r.customerName} (${r.id})`);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Failed to preview receipt:', err);
      addToast({
        type: 'error',
        title: 'Preview Failed',
        message: 'Unable to open receipt preview.',
      });
    }
  };

  const handleDownloadReceipt = async (r: HistoryRecordItem) => {
    try {
      const opts = getReceiptOptions(r);
      await generateBillPDF(opts);
      addToast({
        type: 'success',
        title: 'Receipt Downloaded',
        message: `Official collection receipt for ${r.customerName} downloaded.`,
      });
    } catch (err) {
      console.error('Failed to download receipt:', err);
      addToast({
        type: 'error',
        title: 'Download Failed',
        message: 'Could not download receipt PDF.',
      });
    }
  };

  // ── 7. EXPORT PDF REPORT (Section 31, 61: Reflects CURRENT FILTERED DATASET) ──
  const handleExportPDF = () => {
    try {
      generateReportPDF({
        title: 'Collection History Register Statement',
        subtitle: `Activity Record — Date: ${selectedDate || 'All Dates'} (${filteredRecords.length} records)`,
        startDate: selectedDate || undefined,
        endDate: selectedDate || undefined,
        branch: 'Main Branch - Anna Nagar',
        agent: selectedAgent === 'all' ? 'All CROs' : selectedAgent,
        headers: [
          'Collection ID',
          'Customer Details',
          'Loan ID',
          'Assigned Officer (CRO)',
          'Expected (₹)',
          'Collected (₹)',
          'Collection Date',
          'Status',
        ],
        rows: filteredRecords.map((r) => [
          r.id,
          `${r.customerName} (${r.customerId})`,
          r.loanId,
          r.agentName,
          r.expectedAmount.toLocaleString('en-IN'),
          r.collectedAmount.toLocaleString('en-IN'),
          r.collectionDate,
          r.status.toUpperCase(),
        ]),
        summaryItems: [
          { label: 'Total Expected', value: `₹${totalExpected.toLocaleString('en-IN')}` },
          { label: 'Total Collected', value: `₹${totalCollected.toLocaleString('en-IN')}` },
          { label: 'Pending Accounts', value: String(pendingAccountsCount) },
          { label: 'Completed Collections', value: String(completedCollectionsCount) },
        ],
        fileName: `collection_history_${selectedDate || 'all'}.pdf`,
      });

      addToast({
        type: 'success',
        title: 'PDF Downloaded',
        message: 'Collection History Register generated and downloaded successfully.',
      });
    } catch (err) {
      console.error('PDF export failed:', err);
      addToast({
        type: 'error',
        title: 'PDF Export Failed',
        message: 'Could not generate PDF. Please try again.',
      });
    }
  };

  // ── 8. EXPORT CSV (Section 32, 61: Reflects CURRENT FILTERED DATASET) ──
  const handleExportCSV = () => {
    try {
      const headers = [
        'Collection ID',
        'Customer Name',
        'Customer ID',
        'Phone',
        'Loan ID',
        'Center',
        'Group',
        'Assigned Officer (CRO)',
        'Expected Amount',
        'Collected Amount',
        'Collection Date',
        'Status',
        'Payment Mode',
        'Receipt Number',
      ];

      const rows = filteredRecords.map((r) => [
        r.id,
        `"${r.customerName}"`,
        r.customerId,
        `"${r.customerPhone}"`,
        r.loanId,
        `"${r.centerName}"`,
        `"${r.groupName}"`,
        `"${r.agentName}"`,
        r.expectedAmount,
        r.collectedAmount,
        r.collectionDate,
        r.status.toUpperCase(),
        `"${r.paymentMode}"`,
        r.receiptNumber,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `collection_history_${selectedDate || 'all'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast({
        type: 'success',
        title: 'CSV Downloaded',
        message: 'Filtered collection history exported successfully as CSV.',
      });
    } catch (err) {
      console.error('CSV export failed:', err);
      addToast({
        type: 'error',
        title: 'CSV Export Failed',
        message: 'Could not export CSV file.',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col w-full gap-6 pb-16 font-body text-[#0B1F3A]"
    >
      {/* ── SEARCH & FILTER FORM CARD (Section 22, 23, 24, 25, 26) ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_10px_rgba(11,31,58,0.04)] overflow-hidden flex-shrink-0"
      >
        <div className="bg-[#0B1F3A] px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200/10 flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4 bg-[#D4AF37] rounded-full" />
            <h2 className="text-sm font-semibold tracking-wide uppercase font-body">
              Collection Management
            </h2>
          </div>
          <span className="text-xs font-medium text-[#D4AF37]">
            Historical Collection Ledger
          </span>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Customer Search */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                Customer Name / Loan ID
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by customer, loan ID, phone..."
                  className="w-full pl-10 pr-4 py-2.5 min-h-[42px] rounded-xl bg-gray-50 border border-gray-200 text-[#0B1F3A] placeholder:text-gray-400 text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 focus:bg-white transition-all shadow-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Status Select (Section 13, 24) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                Collection Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[42px] rounded-xl bg-gray-50 border border-gray-200 text-[#0B1F3A] text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 focus:bg-white transition-all shadow-xs cursor-pointer"
              >
                <option value="all">ALL STATUSES</option>
                <option value="collected">COLLECTED</option>
                <option value="partial">PARTIAL</option>
                <option value="advance">ADVANCE</option>
                <option value="nc">NOT COLLECTED (NC)</option>
                <option value="pending">PENDING</option>
              </select>
            </div>

            {/* CRO Select (Section 25: Dynamic CRO List) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                Customer Relationship Officer (CRO)
              </label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[42px] rounded-xl bg-gray-50 border border-gray-200 text-[#0B1F3A] text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 focus:bg-white transition-all shadow-xs cursor-pointer"
              >
                <option value="all">ALL CROS</option>
                {uniqueAgents.map((ag) => (
                  <option key={ag} value={ag}>
                    {ag}
                  </option>
                ))}
              </select>
            </div>

            {/* Collection Date Filter (Section 26) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                  Collection Date
                </label>
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate('')}
                    className="text-[10px] font-bold text-gray-400 hover:text-gray-600"
                  >
                    Clear Date
                  </button>
                )}
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[42px] rounded-xl bg-gray-50 border border-gray-200 text-[#0B1F3A] text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 focus:bg-white transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 pt-5 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[40px] rounded-xl bg-red-50 text-[#DC2626] hover:bg-red-100 font-bold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw size={15} />
              <span>Reset Filters</span>
            </button>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleExportPDF}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[40px] rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer touch-target"
              >
                <FileText size={15} />
                <span>Export to PDF</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[40px] rounded-xl bg-[#0B1F3A] hover:bg-[#162D4A] text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer touch-target"
              >
                <Download size={15} className="text-[#D4AF37]" />
                <span>Export to CSV</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 4 SUMMARY KPI CARDS (Section 18, 19, 20, 21, 28, 45: Real Filtered Data) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Collected */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-[0_2px_8px_rgba(11,31,58,0.03)] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Total Collected</p>
            <p className="text-2xl font-black text-[#16A37A] mt-1 tracking-tight">
              ₹{totalCollected.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] font-semibold text-gray-400 mt-0.5">Sum of verified inflows</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#16A37A] flex items-center justify-center">
            <CheckCircle size={22} />
          </div>
        </div>

        {/* Card 2: Total Expected */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-[0_2px_8px_rgba(11,31,58,0.03)] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Total Expected</p>
            <p className="text-2xl font-black text-[#0B1F3A] mt-1 tracking-tight">
              ₹{totalExpected.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] font-semibold text-gray-400 mt-0.5">Scheduled demand total</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#D4AF37] flex items-center justify-center">
            <Wallet size={22} />
          </div>
        </div>

        {/* Card 3: Pending Accounts */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-[0_2px_8px_rgba(11,31,58,0.03)] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Pending Accounts</p>
            <p className="text-2xl font-black text-[#D99A19] mt-1 tracking-tight">
              {pendingAccountsCount}
            </p>
            <p className="text-[11px] font-semibold text-gray-400 mt-0.5">Partial / NC / Pending</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#D99A19] flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>

        {/* Card 4: Completed Collections */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-[0_2px_8px_rgba(11,31,58,0.03)] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Completed Collections</p>
            <p className="text-2xl font-black text-[#2563EB] mt-1 tracking-tight">
              {completedCollectionsCount}
            </p>
            <p className="text-[11px] font-semibold text-gray-400 mt-0.5">Collected & Advance records</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <CheckCircle size={22} />
          </div>
        </div>
      </div>

      {/* ── TABLE CARD (Section 29, 46, 47: Precision Alignment) ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_10px_rgba(11,31,58,0.04)] overflow-hidden flex-1"
      >
        {/* Table Top Header */}
        <div className="bg-[#0B1F3A] px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4 bg-[#D4AF37] rounded-full" />
            <h2 className="text-sm font-semibold tracking-wide font-body">
              Collection Records ({filteredRecords.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[36px] rounded-xl bg-[#D4AF37] text-white hover:bg-[#C9A227] text-xs font-bold font-body transition-all shadow-xs cursor-pointer"
          >
            <FileText size={14} />
            <span>Download PDF</span>
          </button>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 size={32} className="animate-spin text-[#D4AF37]" />
            <p className="text-sm font-medium text-[#64748B]">Loading collection history records...</p>
          </div>
        ) : dataError ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-[#DC2626]">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-base font-bold text-[#0B1F3A]">Unable to load collection history.</h3>
            <p className="text-xs text-[#64748B] max-w-md">
              There was a problem retrieving collection transaction records.
            </p>
            <button
              type="button"
              onClick={loadHistoryData}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[10px] bg-[#D4AF37] text-white text-xs font-semibold hover:bg-[#C9A227] transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#F8F9FA] border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8]">
              <SearchX size={28} />
            </div>
            <h3 className="text-base font-bold text-[#0B1F3A]">
              {records.length === 0 ? 'No collection records found' : 'No matching collection records found'}
            </h3>
            <p className="text-xs text-[#64748B] max-w-md">
              {records.length === 0
                ? 'Collection history will appear here after collection transactions are recorded.'
                : 'Try adjusting your search criteria, selected CRO, or clearing the date filter.'}
            </p>
            {(searchQuery || selectedStatus !== 'all' || selectedAgent !== 'all' || selectedDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-[10px] bg-[#0B1F3A] text-white text-xs font-semibold hover:bg-[#15345e] transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs font-body border-collapse min-w-[1400px]">
                <thead className="bg-[#F8F9FA] border-b border-[#E5E7EB]">
                  <tr className="text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
                    <th
                      className="py-3.5 px-4 text-left cursor-pointer hover:text-[#0B1F3A] whitespace-nowrap min-w-[120px]"
                      onClick={() => toggleSort('id')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Collection ID</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 text-left cursor-pointer hover:text-[#0B1F3A] whitespace-nowrap min-w-[200px]"
                      onClick={() => toggleSort('customer')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Customer Details</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[170px]">Contact No</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[130px]">Loan ID</th>
                    <th
                      className="py-3.5 px-4 text-left cursor-pointer hover:text-[#0B1F3A] whitespace-nowrap min-w-[160px]"
                      onClick={() => toggleSort('agent')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Assigned Officer (CRO)</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 text-right cursor-pointer hover:text-[#0B1F3A] whitespace-nowrap min-w-[130px]"
                      onClick={() => toggleSort('expected')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Expected (₹)</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 text-right cursor-pointer hover:text-[#0B1F3A] whitespace-nowrap min-w-[130px]"
                      onClick={() => toggleSort('collected')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Collected (₹)</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 text-center cursor-pointer hover:text-[#0B1F3A] whitespace-nowrap min-w-[140px]"
                      onClick={() => toggleSort('date')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Collection Date</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 text-center cursor-pointer hover:text-[#0B1F3A] whitespace-nowrap min-w-[140px]"
                      onClick={() => toggleSort('status')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Status</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group">
                      {/* Collection ID (Monospace) */}
                      <td className="py-4 px-4 font-mono text-xs font-bold text-blue-600 hover:text-blue-700 whitespace-nowrap min-w-[120px]">
                        {r.id}
                      </td>

                      {/* Customer Details */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[200px]">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.customerName} size="sm" />
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-[#0B1F3A] group-hover:text-blue-600 transition-colors whitespace-nowrap">
                              {r.customerName}
                            </div>
                            <div className="text-[11px] text-[#64748B] font-mono font-semibold mt-0.5 whitespace-nowrap">
                              {r.customerId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact No */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[170px]">
                        <a
                          href={`tel:${r.customerPhone.replace(/[^0-9+]/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 font-mono text-xs text-[#0B1F3A] hover:text-blue-600 hover:underline transition-colors cursor-pointer group/call"
                          title={`Click to call ${r.customerPhone}`}
                        >
                          <Phone size={12} className="text-[#94A3B8] group-hover/call:text-blue-600 transition-colors shrink-0" />
                          <span>{r.customerPhone}</span>
                        </a>
                      </td>

                      {/* Loan ID */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[130px]">
                        <span className="font-mono text-xs font-semibold text-[#0B1F3A] bg-gray-100 hover:text-blue-600 hover:border-blue-300 px-2.5 py-1 rounded border border-gray-200 whitespace-nowrap inline-block transition-colors">
                          {r.loanId}
                        </span>
                      </td>

                      {/* Assigned Officer (CRO) */}
                      <td className="py-4 px-4 whitespace-nowrap text-xs font-semibold text-gray-700 min-w-[160px]">
                        {r.agentName}
                      </td>

                      {/* Expected Amount (Right-aligned currency) */}
                      <td className="py-4 px-4 text-right font-mono text-xs text-gray-600 whitespace-nowrap tabular-nums min-w-[130px]">
                        ₹{r.expectedAmount.toLocaleString('en-IN')}
                      </td>

                      {/* Collected Amount (Right-aligned currency) */}
                      <td className="py-4 px-4 text-right font-mono text-sm font-black whitespace-nowrap text-[#0B1F3A] tabular-nums min-w-[130px]">
                        ₹{r.collectedAmount.toLocaleString('en-IN')}
                      </td>

                      {/* Collection Date */}
                      <td className="py-4 px-4 text-center whitespace-nowrap text-xs text-gray-600 min-w-[140px]">
                        <p className="font-semibold text-[#0B1F3A]">{r.collectionDate}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{r.collectionTime}</p>
                      </td>

                      {/* Status Badge (Section 13, 47: Restrained Status Badges) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap min-w-[140px]">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            r.status === 'collected'
                              ? 'bg-[#ECFDF5] text-[#16A37A] border-[#A7F3D0]'
                              : r.status === 'advance'
                              ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                              : r.status === 'partial'
                              ? 'bg-[#FFFBEB] text-[#D99A19] border-[#FDE68A]'
                              : r.status === 'nc'
                              ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {r.status === 'nc'
                            ? 'NC'
                            : r.status.toUpperCase()}
                        </span>
                        {r.ncReason && (
                          <p className="text-[10px] text-gray-400 mt-0.5 max-w-[120px] truncate" title={r.ncRemarks || r.ncReason}>
                            {r.ncReason}
                          </p>
                        )}
                      </td>

                      {/* Official Receipt Action (Section 11, 28) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap min-w-[120px]">
                        {r.expectedAmount > 0 || r.collectedAmount > 0 ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handlePreviewReceipt(r)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors cursor-pointer border border-blue-200"
                              title="Preview A4 Receipt"
                            >
                              <Eye size={12} className="text-blue-700" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadReceipt(r)}
                              className="p-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 transition-colors cursor-pointer"
                              title="Download Receipt PDF"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-300 font-medium">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Responsive Stacked Cards (Section 48) */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredRecords.map((r) => (
                <div key={r.id} className="p-4 space-y-3 hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.customerName} size="sm" />
                      <div>
                        <h4 className="text-sm font-bold text-[#0B1F3A]">{r.customerName}</h4>
                        <p className="text-[11px] text-[#64748B] font-mono">
                          {r.customerId}
                        </p>
                        <a
                          href={`tel:${r.customerPhone.replace(/[^0-9+]/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-[#0B1F3A] hover:text-blue-600 hover:underline transition-colors cursor-pointer mt-0.5"
                          title={`Click to call ${r.customerPhone}`}
                        >
                          <Phone size={10} className="text-[#94A3B8] shrink-0" />
                          <span>{r.customerPhone}</span>
                        </a>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        r.status === 'collected'
                          ? 'bg-[#ECFDF5] text-[#16A37A] border-[#A7F3D0]'
                          : r.status === 'advance'
                          ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                          : r.status === 'partial'
                          ? 'bg-[#FFFBEB] text-[#D99A19] border-[#FDE68A]'
                          : r.status === 'nc'
                          ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      {r.status === 'nc' ? 'NC' : r.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#F8F9FA] p-2.5 rounded-xl border border-[#E2E8F0]">
                    <div>
                      <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Collection ID</span>
                      <span className="font-mono font-bold text-blue-600 block">{r.id}</span>
                      <span className="font-mono text-[11px] text-gray-600 block">{r.loanId}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Collected / Expected</span>
                      <span className="font-black text-sm text-[#0B1F3A] block">
                        ₹{r.collectedAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-gray-400 block">
                        Exp: ₹{r.expectedAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Assigned Officer (CRO)</span>
                      <span className="font-semibold text-gray-700 truncate block">{r.agentName}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Date & Time</span>
                      <span className="font-semibold text-[#0B1F3A] block">{r.collectionDate}</span>
                      <span className="text-gray-400 text-[10px] block">{r.collectionTime}</span>
                    </div>
                  </div>

                  {(r.expectedAmount > 0 || r.collectedAmount > 0) && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handlePreviewReceipt(r)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-xs hover:bg-blue-100 transition-colors"
                      >
                        <Eye size={13} />
                        <span>View Receipt</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadReceipt(r)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors shadow-xs"
                      >
                        <Download size={13} />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* ── OFFICIAL A4 RECEIPT MODAL (Section 11, 28) ── */}
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
              onClick={() => {
                setIsPreviewOpen(false);
                if (previewBlobUrl) {
                  URL.revokeObjectURL(previewBlobUrl);
                  setPreviewBlobUrl(null);
                }
              }}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs cursor-pointer"
              aria-label="Close preview backdrop"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-slate-200 relative z-10 select-text"
            >
              {/* Modal Header */}
              <div className="bg-[#0B1F3A] px-5 py-4 flex items-center justify-between border-b border-[#D4AF37]/30 text-white rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white p-1 border border-[#D4AF37] flex items-center justify-center overflow-hidden">
                    <img
                      src="/pwa-512x512.png"
                      alt="Golden Leaf Logo"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as any).src = '/logo.png';
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">
                      {previewTitle}
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Golden Leaf Finance Official Collection Transaction Receipt (A4 Standard)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    if (previewBlobUrl) {
                      URL.revokeObjectURL(previewBlobUrl);
                      setPreviewBlobUrl(null);
                    }
                  }}
                  className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body: PDF Viewer */}
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

export { CollectionListPage as CollectionHistoryPage };
export default CollectionListPage;
