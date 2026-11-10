// ──────────────────────────────────────────────────
// Golden Leaf Finance — Customer Relationship Officer (CRO): Pending Collection
// Strictly aligned with Finance Collection & Loan Management System PDF
// Real-time pending collections, delay tracking & payment clearance
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  AlertTriangle,
  RotateCcw,
  Download,
  CheckCircle2,
  X,
  Phone,
  Calendar,
  Search,
  Filter,
  User,
  Users,
  Building2,
  DollarSign,
  CreditCard,
  Banknote,
  Landmark,
  ShieldCheck,
  AlertCircle,
  Eye,
  Loader2,
  SearchX,
  RefreshCw,
  TrendingUp,
  ArrowUpDown,
  FileText,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore, useUIStore } from '../../store';
import {
  getMonitoredCustomers,
  getMonitoredLoans,
  getMonitoredCollections,
  saveMonitoredCollections,
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

export interface PendingRecordItem {
  id: string; // e.g. 'COL-9027'
  customerId: string;
  customerName: string;
  customerPhone: string;
  loanId: string;
  loanPlan?: string;
  centerName: string;
  groupName: string;
  branchId: string;
  branchName: string;
  installment: string;
  dueDate: string;
  dueAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  status: 'Pending' | 'Partial' | 'Pending (NC)' | 'Delayed';
  isDelayed: boolean;
  delayDays: number;
  ncReason?: string;
  ncRemarks?: string;
  rawCollection: MonitoredCollection;
}

type SortField = 'customer' | 'dueDate' | 'pendingAmount';
type SortOrder = 'asc' | 'desc';

export const PendingCollectionPage: React.FC = () => {
  const currentUser = useAuthStore((s) => s.user);
  const { addToast } = useUIStore();

  // Core Data States
  const [records, setRecords] = useState<PendingRecordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'Pending' | 'Partial' | 'Pending (NC)' | 'Delayed'>('all');
  const [sortField, setSortField] = useState<SortField>('pendingAmount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Collect Modal States
  const [selectedRecord, setSelectedRecord] = useState<PendingRecordItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collectionAmountInput, setCollectionAmountInput] = useState('');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('Cash');
  const [collectionRemarks, setCollectionRemarks] = useState('');
  const [formValidationError, setFormValidationError] = useState('');

  // PDF Preview States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  // ── Keyboard accessibility (close modals on Escape) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen && !isSubmitting) setIsModalOpen(false);
        if (isPreviewOpen) handleClosePreview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isSubmitting, isPreviewOpen]);

  // ── 1. LOAD PENDING COLLECTIONS FROM CENTRAL SOURCE OF TRUTH (Section 4, 5, 8, 12) ──
  const loadPendingData = () => {
    try {
      setIsLoading(true);
      setDataError(false);

      const allCusts = getMonitoredCustomers(null);
      const allLoans = getMonitoredLoans(null);
      const allCollections = getMonitoredCollections(null);

      // Build customer map
      const custMap = new Map<string, MonitoredCustomer>();
      allCusts.forEach((c) => {
        if (c.id) custMap.set(c.id, c);
      });

      // Build loan map and track closed loans (Section 51 Test 8)
      const loanMap = new Map<string, MonitoredLoan>();
      const closedLoanIds = new Set<string>();
      allLoans.forEach((l) => {
        if (l.id) {
          loanMap.set(l.id, l);
          if (l.status === 'Closed') {
            closedLoanIds.add(l.id);
          }
        }
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const pendingItems: PendingRecordItem[] = [];

      for (const col of allCollections) {
        // Exclude closed loans (Section 51 Test 8)
        if (col.loanId && closedLoanIds.has(col.loanId)) {
          continue;
        }

        // Exclude advance collections (Section 14 & 15 of Advance module)
        if (col.status === 'advance') {
          continue;
        }

        // Calculate pending: Math.max(0, dueAmount - collectedAmount) (Section 8)
        const due = col.dueAmount ?? col.expectedAmount ?? 2500;
        const collected = col.collectedAmount ?? 0;
        const pending = Math.max(0, due - collected);

        // A record is pending if pendingAmount > 0 and status is not 'collected'
        if (pending <= 0 || col.status === 'collected') {
          continue;
        }

        const cust = custMap.get(col.customerId);
        const loan = loanMap.get(col.loanId);

        // Delay Tracking (Section 12, 13)
        let isDelayed = false;
        let delayDays = 0;

        if (col.status === 'delayed' || (col.delayedDays !== undefined && col.delayedDays > 0)) {
          isDelayed = true;
          delayDays = col.delayedDays || 1;
        } else if (col.date && col.date !== 'Today' && col.date !== 'Tomorrow') {
          const parsedDueDate = new Date(col.date);
          if (!isNaN(parsedDueDate.getTime())) {
            parsedDueDate.setHours(0, 0, 0, 0);
            if (today.getTime() > parsedDueDate.getTime()) {
              isDelayed = true;
              delayDays = Math.max(1, Math.floor((today.getTime() - parsedDueDate.getTime()) / (1000 * 60 * 60 * 24)));
            }
          }
        }

        // Determine PDF Status (Section 27: Pending, Partial, Pending (NC), Delayed)
        let derivedStatus: 'Pending' | 'Partial' | 'Pending (NC)' | 'Delayed' = 'Pending';
        if (col.status === 'nc') {
          derivedStatus = 'Pending (NC)';
        } else if (isDelayed) {
          derivedStatus = 'Delayed';
        } else if (collected > 0 && pending > 0) {
          derivedStatus = 'Partial';
        } else {
          derivedStatus = 'Pending';
        }

        pendingItems.push({
          id: col.id,
          customerId: col.customerId,
          customerName: col.customerName || cust?.name || 'Registered Customer',
          customerPhone: col.customerPhone || cust?.phone || '',
          loanId: col.loanId || (loan ? loan.id : ''),
          loanPlan: loan?.planName || 'Micro-Loan',
          centerName: col.area || cust?.centerName || 'Center',
          groupName: col.groupName || cust?.groupName || 'General Group',
          branchId: col.branchId || 'BR-01',
          branchName: col.branchName || 'Main Branch',
          installment: col.installment || 'Weekly Installment',
          dueDate: col.date === 'Today' ? new Date().toISOString().slice(0, 10) : col.date,
          dueAmount: due,
          collectedAmount: collected,
          pendingAmount: pending,
          status: derivedStatus,
          isDelayed,
          delayDays,
          ncReason: col.ncReasonCode,
          ncRemarks: col.ncRemarks,
          rawCollection: col,
        });
      }

      setRecords(pendingItems);
    } catch (err) {
      console.error('Failed to load pending collections:', err);
      setDataError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingData();

    const handleCollectionsUpdated = () => {
      loadPendingData();
    };
    window.addEventListener('glf-collections-updated', handleCollectionsUpdated);
    return () => {
      window.removeEventListener('glf-collections-updated', handleCollectionsUpdated);
    };
  }, []);

  // ── 2. DYNAMIC SUMMARY COMPUTATIONS (Section 28, 29, 30, 33: Backed by Actual Data) ──
  const totalPendingAmount = useMemo(
    () => records.reduce((acc, r) => acc + r.pendingAmount, 0),
    [records]
  );
  const pendingCasesCount = useMemo(() => records.length, [records]);
  const delayedCasesCount = useMemo(
    () => records.filter((r) => r.isDelayed || r.status === 'Delayed').length,
    [records]
  );

  // Dynamic Center list for filter (Section 25)
  const uniqueCenters = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.centerName) set.add(r.centerName);
    });
    return Array.from(set).sort();
  }, [records]);

  // ── 3. SEARCH & FILTERING (Section 24, 25, 26, 35) ──
  const filteredRecords = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase();
    const queryDigits = searchQuery.replace(/\D/g, '');

    const filtered = records.filter((r) => {
      // Center Filter
      if (selectedCenter !== 'all' && r.centerName !== selectedCenter) {
        return false;
      }

      // Status Filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'Delayed' && !(r.isDelayed || r.status === 'Delayed')) {
          return false;
        } else if (selectedStatus !== 'Delayed' && r.status !== selectedStatus) {
          return false;
        }
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

    // Sorting (Section 35)
    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'customer') {
        comparison = a.customerName.localeCompare(b.customerName);
      } else if (sortField === 'dueDate') {
        comparison = a.dueDate.localeCompare(b.dueDate);
      } else if (sortField === 'pendingAmount') {
        comparison = a.pendingAmount - b.pendingAmount;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [records, searchQuery, selectedCenter, selectedStatus, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // ── 4. RECORD COLLECTION ACTION (Section 18, 19, 20, 21, 37, 38) ──
  const handleOpenCollectModal = (record: PendingRecordItem) => {
    setSelectedRecord(record);
    setCollectionAmountInput(String(record.pendingAmount)); // Default to full pending due
    setSelectedPaymentMode('Cash');
    setCollectionRemarks('');
    setFormValidationError('');
    setIsModalOpen(true);
  };

  const handleCollectPending = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedRecord) return;

    // Validation 1: Amount must be numeric and > 0
    const amtNum = parseFloat(collectionAmountInput);
    if (isNaN(amtNum) || amtNum <= 0) {
      setFormValidationError('Please enter a valid collection amount greater than ₹0.');
      return;
    }

    // Validation 2: Amount cannot exceed pending amount
    if (amtNum > selectedRecord.pendingAmount) {
      setFormValidationError(
        `Collection amount cannot exceed remaining pending amount of ₹${selectedRecord.pendingAmount.toLocaleString('en-IN')}.`
      );
      return;
    }

    setFormValidationError('');
    setIsSubmitting(true);

    try {
      const generatedReceipt = `RCP-PND-${Date.now().toString().slice(-4)}`;
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

      const newTotalCollected = selectedRecord.collectedAmount + amtNum;
      const newRemainingPending = Math.max(0, selectedRecord.dueAmount - newTotalCollected);
      const isFullyCollected = newRemainingPending === 0;

      // 1. Update MonitoredCollection in central master (glf_monitored_collections_master)
      const allCollections = getMonitoredCollections(null);
      const existingIdx = allCollections.findIndex((c) => c.id === selectedRecord.id);

      const updatedRecord: MonitoredCollection = {
        ...selectedRecord.rawCollection,
        collectedAmount: newTotalCollected,
        pendingAmount: newRemainingPending,
        status: isFullyCollected ? 'collected' : 'partial',
        paymentMode: `${selectedPaymentMode} (Pending Clearance)`,
        receiptNumber: generatedReceipt,
        date: 'Today',
        time: nowTime,
        agentName: currentUser?.displayName || 'Customer Relationship Officer (CRO)',
        ncRemarks: collectionRemarks || (isFullyCollected ? 'Full pending cleared' : 'Partial pending clearance'),
      };

      if (existingIdx >= 0) {
        allCollections[existingIdx] = updatedRecord;
      } else {
        allCollections.unshift(updatedRecord);
      }
      saveMonitoredCollections(allCollections);

      // 2. Update Loan record in master (glf_monitored_loans_master)
      const allLoans = getMonitoredLoans(null);
      const loanIdx = allLoans.findIndex((l) => l.id === selectedRecord.loanId);
      if (loanIdx >= 0) {
        const l = allLoans[loanIdx];
        allLoans[loanIdx] = {
          ...l,
          paidAmount: (l.paidAmount || 0) + amtNum,
          outstandingAmount: Math.max(0, (l.outstandingAmount || 0) - amtNum),
        };
        try {
          localStorage.setItem('glf_monitored_loans_master', JSON.stringify(allLoans));
        } catch {}
      }

      // 3. Update Customer History in master (glf_monitored_customers_master)
      const allCustomers = getMonitoredCustomers(null);
      const custIdx = allCustomers.findIndex((c) => c.id === selectedRecord.customerId);
      if (custIdx >= 0) {
        const c = allCustomers[custIdx];
        const historyEntry = {
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          event: `Pending Collection Clearance — ₹${amtNum.toLocaleString('en-IN')}`,
          remarks: `Collected via ${selectedPaymentMode}${collectionRemarks ? ' (' + collectionRemarks + ')' : ''} [${generatedReceipt}]`,
        };
        allCustomers[custIdx] = {
          ...c,
          history: [historyEntry, ...(c.history || [])],
          outstandingBalance: Math.max(0, (c.outstandingBalance || 0) - amtNum),
        };
        try {
          localStorage.setItem('glf_monitored_customers_master', JSON.stringify(allCustomers));
        } catch {}
      }

      // 4. Update Credit Manager applicant history if present
      try {
        const cmStored = localStorage.getItem('glf_credit_manager_applicants_v5');
        if (cmStored) {
          const parsed = JSON.parse(cmStored);
          if (Array.isArray(parsed)) {
            const historyItem = {
              date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
              event: `Pending Clearance — ₹${amtNum.toLocaleString('en-IN')}`,
              remarks: `Collected by ${currentUser?.displayName || 'Authorized CRO'} via ${selectedPaymentMode} [${generatedReceipt}]`,
            };
            const updatedApplicants = parsed.map((app: any) => {
              if (
                app.id === selectedRecord.customerId ||
                app.customerId === selectedRecord.customerId ||
                app.customerName?.toLowerCase() === selectedRecord.customerName.toLowerCase()
              ) {
                return {
                  ...app,
                  history: [historyItem, ...(app.history || [])],
                };
              }
              return app;
            });
            localStorage.setItem('glf_credit_manager_applicants_v5', JSON.stringify(updatedApplicants));
            window.dispatchEvent(new CustomEvent('glf_credit_manager_updated'));
          }
        }
      } catch {}

      // 5. Update Local State (If fully collected, leaves active pending queue; if partial, updates in place)
      if (isFullyCollected) {
        setRecords((prev) => prev.filter((r) => r.id !== selectedRecord.id));
      } else {
        setRecords((prev) =>
          prev.map((r) =>
            r.id === selectedRecord.id
              ? {
                  ...r,
                  collectedAmount: newTotalCollected,
                  pendingAmount: newRemainingPending,
                  status: 'Partial',
                  rawCollection: updatedRecord,
                }
              : r
          )
        );
      }

      setIsModalOpen(false);

      addToast({
        type: 'success',
        title: isFullyCollected ? 'Pending Clearance Completed' : 'Partial Payment Recorded',
        message: `Successfully collected ₹${amtNum.toLocaleString('en-IN')} for ${selectedRecord.customerName}.`,
      });

      // Trigger official A4 receipt preview (Section 11, 28)
      handlePreviewReceipt({
        receiptNumber: generatedReceipt,
        customerName: selectedRecord.customerName,
        customerId: selectedRecord.customerId,
        customerPhone: selectedRecord.customerPhone,
        groupName: selectedRecord.groupName,
        centerName: selectedRecord.centerName,
        loanId: selectedRecord.loanId,
        installment: selectedRecord.installment,
        dueAmount: selectedRecord.dueAmount,
        collectedAmount: amtNum,
        paymentMode: selectedPaymentMode,
        branchName: selectedRecord.branchName,
        agentName: currentUser?.displayName || 'Authorized CRO',
      });

      setSelectedRecord(null);
      setCollectionAmountInput('');
      setCollectionRemarks('');
    } catch (err) {
      console.error('Failed to collect pending dues:', err);
      addToast({
        type: 'error',
        title: 'Collection Error',
        message: 'Unable to record collection.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 5. RECEIPT PREVIEW & DOWNLOAD (Section 28) ──
  const getReceiptOptions = (info: any): PDFBillOptions => {
    const cust = getMonitoredCustomers(null).find((c) => c.id === info.customerId);
    const loan = getMonitoredLoans(null).find((l) => l.id === info.loanId);

    const rawRec = info.receiptNumber || info.rawCollection?.receiptNumber;
    const receiptNo =
      rawRec && rawRec.toLowerCase() !== 'pending'
        ? rawRec
        : `SLIP-2026-${info.id?.replace(/\D/g, '') || info.customerId?.replace(/\D/g, '') || '9010'}`;

    const demandAmt = info.dueAmount || info.pendingAmount || 2500;
    const collectedAmt =
      info.collectedAmount !== undefined && info.collectedAmount > 0
        ? info.collectedAmount
        : demandAmt;

    const isPending = !info.collectedAmount || info.collectedAmount === 0;

    return {
      receiptNo,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      customerName: info.customerName,
      customerId: info.customerId,
      phone: info.customerPhone || cust?.phone || '—',
      spouseName: cust?.nomineeName || '—',
      groupName: info.groupName || cust?.groupName || '—',
      centerName: info.centerName || cust?.centerName || '—',
      loanId: info.loanId,
      installmentNo: info.installment || '01 / 20',
      demandAmount: demandAmt,
      collectedAmount: collectedAmt,
      paymentMode: info.paymentMode || 'Cash at Center',
      status: isPending ? 'Pending' : 'Collected',
      agentName: info.agentName || currentUser?.displayName || 'Authorized Officer',
      branchName: info.branchName || 'Main Branch - Anna Nagar',
      fileName: `Demand_Slip_${info.customerId}_${receiptNo}.pdf`,
      outstandingBalance: loan?.outstandingAmount ?? cust?.outstandingBalance ?? 35000,
      totalLoanAmount: loan?.principalAmount ?? cust?.activeLoanAmount ?? 50000,
      loanProduct: loan?.planName || 'Micro Business Loan (JLG)',
    };
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
  };

  const handlePreviewReceipt = async (info: any) => {
    try {
      const opts = getReceiptOptions(info);
      const url = await generateBillPDFBlobUrl(opts);
      setPreviewBlobUrl(url);
      setPreviewTitle(`Collection Demand Slip — ${info.customerName}`);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Failed to preview receipt:', err);
      addToast({
        type: 'error',
        title: 'Preview Failed',
        message: 'Could not generate demand slip preview.',
      });
    }
  };

  // ── 6. EXPORT PENDING COLLECTIONS PDF (Section 48: Pending Report Integration) ──
  const handleExportPDF = () => {
    try {
      generateReportPDF({
        title: 'Pending Collections Register Statement',
        subtitle: `Official Pending Collection Report (${filteredRecords.length} records)`,
        branch: 'Main Branch - Anna Nagar',
        agent: currentUser?.displayName || 'Authorized Officer',
        headers: [
          'Customer Name',
          'Customer ID',
          'Loan ID',
          'Center / Group',
          'Installment',
          'Due (₹)',
          'Collected (₹)',
          'Pending (₹)',
          'Due Date',
          'Status',
        ],
        rows: filteredRecords.map((r) => [
          r.customerName,
          r.customerId,
          r.loanId,
          `${r.groupName} (${r.centerName})`,
          r.installment,
          r.dueAmount.toLocaleString('en-IN'),
          r.collectedAmount.toLocaleString('en-IN'),
          r.pendingAmount.toLocaleString('en-IN'),
          r.dueDate,
          r.status + (r.isDelayed ? ` (${r.delayDays}d)` : ''),
        ]),
        summaryItems: [
          { label: 'Total Pending Collection', value: `₹${totalPendingAmount.toLocaleString('en-IN')}` },
          { label: 'Pending Cases', value: String(filteredRecords.length) },
          { label: 'Delayed Collections', value: String(delayedCasesCount) },
        ],
      });
      addToast({
        type: 'success',
        title: 'Report Exported',
        message: 'Pending collection statement downloaded successfully.',
      });
    } catch (err) {
      console.error('Failed to export pending report:', err);
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Unable to export report.',
      });
    }
  };

  return (
    <div className="space-y-6 font-body pb-16">
      {/* ── HEADER BANNER (Section 42) ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#DC2626] uppercase tracking-wider mb-1">
            <Clock size={16} />
            Collection Operations Module
          </div>
          <h1 className="text-2xl font-black text-[#0B1F3A] font-body tracking-tight">
            Pending Collection & Delay Tracking
          </h1>
          <p className="text-sm text-[#64748B]">
            Track pending customer collections, monitor overdue delays, and record installment clearances.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-[#0B1F3A] hover:bg-[#162D4A] text-white px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer touch-target"
          >
            <Download size={16} className="text-[#D4AF37]" />
            <span>Export Pending Report</span>
          </button>
        </div>
      </div>

      {/* ── TOP 3 SUMMARY METRIC CARDS (Section 28, 29, 30, 33: PDF-First, Backed by Actual Data) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Pending Collection */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-[0_2px_10px_rgba(11,31,58,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              TOTAL PENDING COLLECTION
            </span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#FEF2F2] text-[#DC2626]">
              <Clock size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#DC2626] font-body tracking-tight">
              ₹{totalPendingAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] font-semibold text-[#64748B] mt-1.5">
              Outstanding demand balance
            </div>
          </div>
        </div>

        {/* Card 2: Pending Cases */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-[0_2px_10px_rgba(11,31,58,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              PENDING CASES
            </span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#EFF6FF] text-[#2563EB]">
              <FileText size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#0B1F3A] font-body tracking-tight">
              {pendingCasesCount} Cases
            </div>
            <div className="text-[11px] font-semibold text-[#64748B] mt-1.5">
              Scheduled active dues
            </div>
          </div>
        </div>

        {/* Card 3: Delayed Collections */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-[0_2px_10px_rgba(11,31,58,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              DELAYED COLLECTIONS
            </span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#FFFBEB] text-[#D99A19]">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#D99A19] font-body tracking-tight">
              {delayedCasesCount} Delayed
            </div>
            <div className="text-[11px] font-semibold text-[#64748B] mt-1.5">
              Due date elapsed
            </div>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER BAR (Section 24, 25, 26) ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer, loan ID, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 min-h-[40px] bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#0B1F3A] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Center Filter (Section 25) */}
          {uniqueCenters.length > 0 && (
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="px-3 py-2 min-h-[40px] bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#0B1F3A] focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 cursor-pointer"
            >
              <option value="all">All Centers</option>
              {uniqueCenters.map((center) => (
                <option key={center} value={center}>
                  {center}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter (Section 26: Only real statuses) */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-3 py-2 min-h-[40px] bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#0B1F3A] focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Partial">Partial</option>
            <option value="Pending (NC)">Pending (NC)</option>
            <option value="Delayed">Delayed</option>
          </select>

          {(searchQuery || selectedCenter !== 'all' || selectedStatus !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCenter('all');
                setSelectedStatus('all');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN TABLE CARD (Section 34, 43: Precision Alignment) ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_10px_rgba(11,31,58,0.04)] overflow-hidden">
        {/* Dark Navy Section Header */}
        <div className="bg-[#0B1F3A] px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-[#DC2626] rounded-full" />
            <h3 className="text-sm font-semibold uppercase tracking-wider font-body">
              Pending Collection Queue ({filteredRecords.length})
            </h3>
          </div>
          <span className="text-xs font-medium text-[#D4AF37]">
            Active Scheduled Dues
          </span>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 size={32} className="animate-spin text-[#D4AF37]" />
            <p className="text-sm font-medium text-[#64748B]">Loading pending collection records...</p>
          </div>
        ) : dataError ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-[#DC2626]">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-base font-bold text-[#0B1F3A]">Unable to load pending collections.</h3>
            <p className="text-xs text-[#64748B] max-w-md">
              There was a problem retrieving pending collection records from the system.
            </p>
            <button
              type="button"
              onClick={loadPendingData}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[10px] bg-[#D4AF37] text-white text-xs font-semibold hover:bg-[#C9A227] transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#16A37A]">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-base font-bold text-[#0B1F3A]">
              {records.length === 0 ? 'No pending collections' : 'No matching pending collections found'}
            </h3>
            <p className="text-xs text-[#64748B] max-w-md">
              {records.length === 0
                ? 'All scheduled collections are currently up to date.'
                : 'Try adjusting your search criteria or resetting filters.'}
            </p>
            {(searchQuery || selectedCenter !== 'all' || selectedStatus !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCenter('all');
                  setSelectedStatus('all');
                }}
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
              <table className="w-full text-left text-xs font-body border-collapse min-w-[1360px]">
                <thead className="bg-[#F8F9FA] border-b border-[#E5E7EB]">
                  <tr className="text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
                    <th
                      className="py-3.5 px-4 text-left cursor-pointer hover:text-[#0B1F3A] whitespace-nowrap min-w-[200px]"
                      onClick={() => toggleSort('customer')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Customer</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[170px]">Contact</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[190px]">Group / Center</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[130px]">Loan ID & Scheme</th>
                    <th
                      className="py-3.5 px-4 text-left cursor-pointer hover:text-[#0B1F3A] whitespace-nowrap min-w-[140px]"
                      onClick={() => toggleSort('dueDate')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Due Date & Delay</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[110px]">Due (₹)</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[110px]">Collected (₹)</th>
                    <th
                      className="py-3.5 px-4 text-right cursor-pointer hover:text-[#0B1F3A] whitespace-nowrap min-w-[110px]"
                      onClick={() => toggleSort('pendingAmount')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Pending (₹)</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">Status</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group">
                      {/* Customer */}
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

                      {/* Contact */}
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

                      {/* Group / Center */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[190px]">
                        <div className="font-semibold text-[#0B1F3A] flex items-center gap-1.5">
                          <Users size={12} className="text-[#94A3B8] shrink-0" />
                          <span className="truncate">{r.groupName}</span>
                        </div>
                        <div className="text-[#64748B] text-[11px] flex items-center gap-1.5 mt-0.5">
                          <Building2 size={12} className="text-[#94A3B8] shrink-0" />
                          <span className="truncate">{r.centerName}</span>
                        </div>
                      </td>

                      {/* Loan ID & Scheme */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[130px]">
                        <span className="font-mono text-xs font-semibold text-[#0B1F3A] bg-gray-100 hover:text-blue-600 hover:border-blue-300 px-2.5 py-1 rounded border border-gray-200 whitespace-nowrap inline-block transition-colors">
                          {r.loanId}
                        </span>
                        <div className="text-[11px] font-mono text-blue-600 font-semibold mt-1 whitespace-nowrap">
                          {r.installment}
                        </div>
                      </td>

                      {/* Due Date & Delay Tracking (Section 12, 13) */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[140px]">
                        <div className="font-semibold text-[#0B1F3A] whitespace-nowrap">{r.dueDate}</div>
                        {r.isDelayed ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold whitespace-nowrap">
                            <AlertTriangle size={10} className="shrink-0" />
                            <span>{r.delayDays}d Delayed</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">On Schedule</div>
                        )}
                      </td>

                      {/* Due Amount (Right-aligned currency) */}
                      <td className="py-4 px-4 text-right font-semibold text-gray-700 whitespace-nowrap tabular-nums min-w-[110px]">
                        ₹{r.dueAmount.toLocaleString('en-IN')}
                      </td>

                      {/* Collected Amount (Right-aligned currency) */}
                      <td className="py-4 px-4 text-right font-medium text-[#16A37A] whitespace-nowrap tabular-nums min-w-[110px]">
                        ₹{r.collectedAmount.toLocaleString('en-IN')}
                      </td>

                      {/* Remaining Pending Amount (Right-aligned currency in bold red) */}
                      <td className="py-4 px-4 text-right font-black text-sm text-[#DC2626] whitespace-nowrap tabular-nums min-w-[110px]">
                        ₹{r.pendingAmount.toLocaleString('en-IN')}
                      </td>

                      {/* Status Badge (Section 27) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap min-w-[120px]">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            r.status === 'Delayed'
                              ? 'bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3]'
                              : r.status === 'Pending (NC)'
                              ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                              : r.status === 'Partial'
                              ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                              : 'bg-[#FFFBEB] text-[#D99A19] border-[#FDE68A]'
                          }`}
                        >
                          {r.status}
                        </span>
                        {r.ncReason && (
                          <p className="text-[10px] text-gray-400 mt-0.5 max-w-[120px] truncate" title={r.ncRemarks || r.ncReason}>
                            {r.ncReason}
                          </p>
                        )}
                      </td>

                      {/* Action Button (Section 18, 19) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap min-w-[170px]">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePreviewReceipt(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200 transition-colors cursor-pointer"
                            title="Preview Official Demand Slip / Receipt"
                          >
                            <Eye size={12} className="text-blue-700" />
                            <span>Slip</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCollectModal(r)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[34px] bg-[#0B1F3A] hover:bg-[#162D4A] text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer touch-target"
                          >
                            <DollarSign size={13} className="text-blue-400" />
                            <span>Collect</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Responsive Cards (Section 44) */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredRecords.map((r) => (
                <div key={r.id} className="p-4 space-y-3 hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.customerName} size="sm" />
                      <div>
                        <h4 className="text-sm font-bold text-[#0B1F3A]">{r.customerName}</h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mt-0.5">
                          <span className="font-mono font-semibold">{r.customerId}</span>
                          <span>•</span>
                          <a
                            href={`tel:${r.customerPhone.replace(/[^0-9+]/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 font-mono text-[#64748B] hover:text-blue-600 hover:underline transition-colors cursor-pointer"
                            title={`Click to call ${r.customerPhone}`}
                          >
                            <Phone size={10} className="text-[#94A3B8]" />
                            <span>{r.customerPhone}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        r.status === 'Delayed'
                          ? 'bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3]'
                          : r.status === 'Pending (NC)'
                          ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                          : r.status === 'Partial'
                          ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                          : 'bg-[#FFFBEB] text-[#D99A19] border-[#FDE68A]'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#F8F9FA] p-2.5 rounded-xl border border-[#E2E8F0]">
                    <div>
                      <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Loan & Installment</span>
                      <span className="font-mono font-bold text-blue-600 block">{r.loanId}</span>
                      <span className="text-[11px] text-[#0B1F3A] block">{r.installment}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Remaining Pending</span>
                      <span className="font-black text-sm text-[#DC2626] block">₹{r.pendingAmount.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-gray-500 block">Due ₹{r.dueAmount}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Group / Center</span>
                      <span className="font-medium text-[#0B1F3A] truncate block">{r.groupName}</span>
                      <span className="text-[#64748B] text-[11px] truncate block">{r.centerName}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Due Date & Delay</span>
                      <span className="font-semibold text-[#0B1F3A] block">{r.dueDate}</span>
                      {r.isDelayed ? (
                        <span className="text-rose-600 font-bold text-[10px] block">{r.delayDays}d Delayed</span>
                      ) : (
                        <span className="text-gray-400 text-[10px] block">On Schedule</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handlePreviewReceipt(r)}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-2.5 min-h-[44px] bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-xs rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <Eye size={13} />
                      <span>View Slip</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenCollectModal(r)}
                      className="flex-2 flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] bg-[#0B1F3A] hover:bg-[#162D4A] text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer touch-target"
                    >
                      <DollarSign size={14} className="text-blue-400" />
                      <span>Collect (₹{r.pendingAmount.toLocaleString('en-IN')})</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── COLLECT PENDING PAYMENT MODAL (Section 18, 19, 20, 21, 38) ── */}
      <AnimatePresence>
        {isModalOpen && selectedRecord && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none"
            role="dialog"
            aria-modal="true"
          >
            {/* Clickable Backdrop Overlay — Clicking anywhere outside closes popup */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => {
                if (!isSubmitting) setIsModalOpen(false);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
              aria-label="Close modal backdrop"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-[min(94vw,500px)] max-h-[92dvh] overflow-hidden shadow-2xl border border-gray-200 relative z-10 flex flex-col font-body select-text"
            >
              {/* Modal Header */}
              <div className="bg-[#0B1F3A] px-5 py-4 flex items-center justify-between text-white border-b border-[#D4AF37]/30 rounded-t-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wide">Record Pending Clearance</h3>
                    <p className="text-[11px] text-gray-300">
                      Clear pending scheduled installment dues for active loan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCollectPending} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                {/* Account Details Box */}
                <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-gray-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Customer:</span>
                    <strong className="text-[#0B1F3A] font-bold">
                      {selectedRecord.customerName} ({selectedRecord.customerId})
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Active Loan:</span>
                    <span className="font-mono font-bold text-[#D4AF37]">
                      {selectedRecord.loanId} • {selectedRecord.installment}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Center / Group:</span>
                    <span className="font-semibold text-gray-700">
                      {selectedRecord.groupName} ({selectedRecord.centerName})
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-gray-200 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-1.5 rounded-lg border border-gray-100">
                      <span className="text-[10px] text-gray-500 block uppercase">Scheduled</span>
                      <span className="font-bold text-[#0B1F3A]">₹{selectedRecord.dueAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-gray-100">
                      <span className="text-[10px] text-gray-500 block uppercase">Paid So Far</span>
                      <span className="font-bold text-[#16A37A]">₹{selectedRecord.collectedAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-gray-100">
                      <span className="text-[10px] text-rose-600 block uppercase font-bold">Remaining</span>
                      <span className="font-black text-[#DC2626]">₹{selectedRecord.pendingAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Collection Amount Input (Section 20) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                      Collection Amount (₹) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setCollectionAmountInput(String(selectedRecord.pendingAmount))}
                      className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-[#0B1F3A] font-bold rounded border border-gray-200 text-[10px] cursor-pointer"
                    >
                      Full Due (₹{selectedRecord.pendingAmount.toLocaleString('en-IN')})
                    </button>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={selectedRecord.pendingAmount}
                    step="1"
                    required
                    placeholder="Enter collected amount in ₹..."
                    value={collectionAmountInput}
                    onChange={(e) => {
                      setCollectionAmountInput(e.target.value);
                      if (formValidationError) setFormValidationError('');
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-[#0B1F3A] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-xs"
                  />
                </div>

                {/* Payment Mode Selection (Section 21: Existing modes) */}
                <div>
                  <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-1">
                    Payment Mode *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Cash', 'UPI', 'Bank Transfer'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSelectedPaymentMode(mode)}
                        className={`py-2 px-2 min-h-[40px] rounded-xl font-semibold text-xs border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          selectedPaymentMode === mode
                            ? 'bg-[#0B1F3A] text-white border-[#0B1F3A] shadow-xs'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {mode === 'Cash' ? (
                          <Banknote size={13} />
                        ) : mode === 'UPI' ? (
                          <CreditCard size={13} />
                        ) : (
                          <Landmark size={13} />
                        )}
                        <span>{mode}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Collection Remarks / Notes */}
                <div>
                  <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-1">
                    Remarks / Receipt Reference (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cleared at center visit, UPI Ref #..."
                    value={collectionRemarks}
                    onChange={(e) => setCollectionRemarks(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-[#0B1F3A] focus:bg-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Validation Error Alert */}
                {formValidationError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-[#DC2626] font-medium flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{formValidationError}</span>
                  </div>
                )}

                {/* Action Buttons (Section 38: Double Submission Protected) */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 min-h-[44px] border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 min-h-[44px] bg-[#0B1F3A] hover:bg-[#162D4A] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Loader2 size={15} className="animate-spin text-[#D4AF37]" />
                    ) : (
                      <ShieldCheck size={15} className="text-[#D4AF37]" />
                    )}
                    <span>{isSubmitting ? 'Recording Clearance...' : 'Confirm & Clear Dues'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── OFFICIAL A4 RECEIPT BILL PREVIEW MODAL (Section 28) ── */}
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
                      Golden Leaf Finance Official Collection Clearance Receipt (A4 Standard)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                  title="Close preview"
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
    </div>
  );
};

export default PendingCollectionPage;
