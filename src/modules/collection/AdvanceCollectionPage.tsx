// ──────────────────────────────────────────────────
// Golden Leaf Finance — Customer Relationship Officer (CRO): Advance Collection
// Strictly aligned with Finance Collection & Loan Management System PDF
// Real-time advance payments against active loans, single source of truth
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Filter,
  Download,
  Plus,
  CheckCircle2,
  Clock,
  RotateCcw,
  Search,
  Calendar,
  User,
  Users,
  Building2,
  FileText,
  TrendingUp,
  X,
  ShieldCheck,
  AlertCircle,
  Eye,
  Loader2,
  CreditCard,
  Banknote,
  Landmark,
  SearchX,
  RefreshCw,
  Phone,
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

export interface AdvanceRecordItem {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  loanId: string;
  centerName: string;
  groupName: string;
  branchId: string;
  branchName: string;
  weeklyDemand: number;
  advanceAmount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer';
  collectionDate: string;
  collectionTime?: string;
  collectedBy: string;
  receiptNumber: string;
  status: 'Advance Recorded';
  remarks?: string;
}

export const AdvanceCollectionPage: React.FC = () => {
  const currentUser = useAuthStore((s) => s.user);
  const { addToast } = useUIStore();

  // Core Data States
  const [records, setRecords] = useState<AdvanceRecordItem[]>([]);
  const [customersList, setCustomersList] = useState<MonitoredCustomer[]>([]);
  const [loansList, setLoansList] = useState<MonitoredLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States for New Advance Collection
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [advanceAmountInput, setAdvanceAmountInput] = useState('');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('Cash');
  const [transactionRemarks, setTransactionRemarks] = useState('');
  const [formValidationError, setFormValidationError] = useState('');

  // PDF Preview States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Close modal and reset modal-specific temporary states
  const handleCloseModal = useCallback(() => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setFormValidationError('');
    setIsCustomerDropdownOpen(false);
  }, [isSubmitting]);

  // Close PDF preview modal
  const handleClosePreview = useCallback(() => {
    setIsPreviewOpen(false);
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
  }, [previewBlobUrl]);

  // ── 1. LOAD ADVANCE COLLECTIONS FROM SINGLE SOURCE OF TRUTH ──
  const loadAdvanceData = () => {
    try {
      setIsLoading(true);
      setDataError(false);

      const allCusts = getMonitoredCustomers(null);
      const allLoans = getMonitoredLoans(null);
      const allCollections = getMonitoredCollections(null);

      setCustomersList(allCusts);
      setLoansList(allLoans);

      // Build customer map
      const customerMap = new Map<string, MonitoredCustomer>();
      for (const c of allCusts) {
        if (c.id) customerMap.set(c.id, c);
      }

      // Build loan map
      const loanMap = new Map<string, MonitoredLoan>();
      for (const l of allLoans) {
        if (l.id) loanMap.set(l.id, l);
        if (l.customerId && !loanMap.has(l.customerId)) {
          loanMap.set(l.customerId, l);
        }
      }

      // Filter collections that are classified as advance
      // (status === 'advance' or collectedAmount > dueAmount)
      const advanceItems: AdvanceRecordItem[] = [];

      for (const col of allCollections) {
        const isAdvance =
          col.status === 'advance' ||
          (col.dueAmount !== undefined && col.collectedAmount > col.dueAmount);

        if (!isAdvance) continue;

        const cust = customerMap.get(col.customerId);
        const loan = loanMap.get(col.loanId) || (cust ? loanMap.get(cust.id) : undefined);

        // Advance amount: if status === 'advance', the collectedAmount is the recorded advance
        const advAmt =
          col.status === 'advance'
            ? col.collectedAmount
            : col.dueAmount !== undefined && col.collectedAmount > col.dueAmount
            ? col.collectedAmount - col.dueAmount
            : col.collectedAmount;

        const pMode: 'Cash' | 'UPI' | 'Bank Transfer' = col.paymentMode?.toLowerCase().includes('upi')
          ? 'UPI'
          : col.paymentMode?.toLowerCase().includes('bank')
          ? 'Bank Transfer'
          : 'Cash';

        advanceItems.push({
          id: col.id.startsWith('COL-') ? col.id.replace('COL-', 'ADV-') : col.id,
          customerId: col.customerId,
          customerName: col.customerName || cust?.name || 'Registered Customer',
          customerPhone: col.customerPhone || cust?.phone || '',
          loanId: col.loanId || (loan ? loan.id : ''),
          centerName: col.area || cust?.centerName || 'Center',
          groupName: col.groupName || cust?.groupName || 'General Group',
          branchId: col.branchId || 'BR-01',
          branchName: col.branchName || 'Main Branch',
          weeklyDemand: col.dueAmount || loan?.weeklyAmount || 0,
          advanceAmount: advAmt > 0 ? advAmt : col.collectedAmount,
          paymentMode: pMode,
          collectionDate: col.date === 'Today' ? new Date().toISOString().slice(0, 10) : col.date,
          collectionTime: col.time || '',
          collectedBy: col.agentName || currentUser?.displayName || 'Collection Officer',
          receiptNumber: col.receiptNumber && col.receiptNumber !== 'Pending' ? col.receiptNumber : `RCP-ADV-${col.id.slice(-4)}`,
          status: 'Advance Recorded',
          remarks: col.ncRemarks,
        });
      }

      setRecords(advanceItems);
    } catch (err) {
      console.error('Failed to load advance collections:', err);
      setDataError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdvanceData();

    const handleCollectionsUpdated = () => {
      loadAdvanceData();
    };
    window.addEventListener('glf-collections-updated', handleCollectionsUpdated);
    return () => {
      window.removeEventListener('glf-collections-updated', handleCollectionsUpdated);
    };
  }, []);

  // Close customer dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isModalOpen && !isPreviewOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPreviewOpen) {
          handleClosePreview();
        } else if (isModalOpen && !isSubmitting) {
          handleCloseModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isPreviewOpen, isSubmitting, handleCloseModal, handleClosePreview]);

  // ── 2. DYNAMIC SUMMARY COMPUTATIONS (Section 22, 23, 36: Backed by Actual Data) ──
  const totalAdvanceCollected = useMemo(() => records.reduce((acc, r) => acc + r.advanceAmount, 0), [records]);
  const totalTransactionsCount = useMemo(() => records.length, [records]);
  const uniqueAdvanceClientsCount = useMemo(() => {
    const set = new Set(records.map((r) => r.customerId));
    return set.size;
  }, [records]);

  // Unique centers for filter
  const uniqueCenters = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.centerName) set.add(r.centerName);
    });
    return Array.from(set).sort();
  }, [records]);

  // ── 3. SEARCH & FILTERING (Section 24, 25: Functional & Case-Insensitive) ──
  const filteredRecords = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase();
    const queryDigits = searchQuery.replace(/\D/g, '');

    return records.filter((r) => {
      // Center Filter
      if (selectedCenter !== 'all' && r.centerName !== selectedCenter) {
        return false;
      }

      // Search Query
      if (!rawQuery) return true;

      const nameMatch = r.customerName.toLowerCase().includes(rawQuery);
      const idMatch = r.id.toLowerCase().includes(rawQuery) || r.customerId.toLowerCase().includes(rawQuery);
      const loanMatch = r.loanId.toLowerCase().includes(rawQuery);
      const phoneMatch = queryDigits.length >= 3
        ? r.customerPhone.replace(/\D/g, '').includes(queryDigits)
        : r.customerPhone.toLowerCase().includes(rawQuery);

      return nameMatch || idMatch || loanMatch || phoneMatch;
    });
  }, [records, searchQuery, selectedCenter]);

  // ── 4. CUSTOMER & ACTIVE LOAN SELECTION LOGIC (Section 6, 7) ──
  const selectedCustomer = useMemo(() => {
    return customersList.find((c) => c.id === selectedCustomerId) || null;
  }, [customersList, selectedCustomerId]);

  const activeLoanForCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return (
      loansList.find(
        (l) =>
          (l.customerId === selectedCustomerId ||
            (selectedCustomer && l.customerName?.toLowerCase() === selectedCustomer.name.toLowerCase())) &&
          (l.status === 'Active' || l.approvalStage === 'Loan Disbursement')
      ) || null
    );
  }, [loansList, selectedCustomerId, selectedCustomer]);

  const matchingCustomers = useMemo(() => {
    if (!customerSearchTerm.trim()) return customersList.slice(0, 8);
    const q = customerSearchTerm.trim().toLowerCase();
    const digits = customerSearchTerm.replace(/\D/g, '');

    return customersList.filter((c) => {
      const nMatch = c.name.toLowerCase().includes(q);
      const idMatch = c.id.toLowerCase().includes(q);
      const pMatch = digits.length >= 3 ? c.phone.replace(/\D/g, '').includes(digits) : c.phone.toLowerCase().includes(q);
      return nMatch || idMatch || pMatch;
    }).slice(0, 10);
  }, [customersList, customerSearchTerm]);

  const handleSelectCustomer = (cust: MonitoredCustomer) => {
    setSelectedCustomerId(cust.id);
    setCustomerSearchTerm(`${cust.name} (${cust.id})`);
    setIsCustomerDropdownOpen(false);
    setFormValidationError('');

    // Pre-fill default advance amount suggestion (e.g. 1 weekly installment)
    const matchingLoan = loansList.find(
      (l) =>
        (l.customerId === cust.id || l.customerName?.toLowerCase() === cust.name.toLowerCase()) &&
        (l.status === 'Active' || l.approvalStage === 'Loan Disbursement')
    );
    if (matchingLoan) {
      setAdvanceAmountInput(String(matchingLoan.weeklyAmount || 2500));
    } else {
      setAdvanceAmountInput('');
    }
  };

  // ── 5. RECORD ADVANCE TRANSACTION (Section 5, 8, 11, 29: Double Submission Protected) ──
  const handleRecordAdvance = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double-clicking
    if (isSubmitting) return;

    // Validation 1: Customer must be selected
    if (!selectedCustomer) {
      setFormValidationError('Please select an existing registered customer.');
      return;
    }

    // Validation 2: Active Loan must exist (Section 7)
    if (!activeLoanForCustomer) {
      setFormValidationError('No active loan available for advance collection. Cannot proceed.');
      return;
    }

    // Validation 3: Advance Amount > 0 (Section 8)
    const amtNum = parseFloat(advanceAmountInput);
    if (isNaN(amtNum) || amtNum <= 0) {
      setFormValidationError('Please enter a valid advance collection amount greater than ₹0.');
      return;
    }

    setFormValidationError('');
    setIsSubmitting(true);

    try {
      const generatedReceipt = `RCP-ADV-${Date.now().toString().slice(-4)}`;
      const generatedAdvId = `ADV-${Date.now().toString().slice(-4)}`;
      const todayISO = new Date().toISOString().slice(0, 10);
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

      // 1. Create MonitoredCollection record in central repository
      const allCollections = getMonitoredCollections(null);
      const newCollectionRecord: MonitoredCollection = {
        id: `COL-${generatedAdvId}`,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        branchId: selectedCustomer.branchId || 'BR-01',
        branchName: selectedCustomer.branchName || 'Main Branch - Anna Nagar',
        areaRoute: selectedCustomer.centerName,
        area: selectedCustomer.centerName,
        groupId: selectedCustomer.groupId || 'GRP-001',
        groupName: selectedCustomer.groupName,
        loanId: activeLoanForCustomer.id,
        installment: 'Advance Collection',
        expectedAmount: activeLoanForCustomer.weeklyAmount || 2500,
        dueAmount: activeLoanForCustomer.weeklyAmount || 2500,
        collectedAmount: amtNum,
        pendingAmount: 0,
        agentName: currentUser?.displayName || 'Customer Relationship Officer (CRO)',
        agentId: 'EMP-004',
        date: 'Today',
        time: nowTime,
        status: 'advance',
        paymentMode: `${selectedPaymentMode} (Advance Collection)`,
        receiptNumber: generatedReceipt,
        ncRemarks: transactionRemarks || 'Advance collection payment received',
      };

      const updatedCollections = [newCollectionRecord, ...allCollections];
      saveMonitoredCollections(updatedCollections);

      // 2. Add to Customer History (Section 12, 31)
      const allCustomers = getMonitoredCustomers(null);
      const custIdx = allCustomers.findIndex((c) => c.id === selectedCustomer.id);
      if (custIdx >= 0) {
        const c = allCustomers[custIdx];
        const historyEntry = {
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          event: `Advance Collection — ₹${amtNum.toLocaleString('en-IN')}`,
          remarks: `Advance payment received via ${selectedPaymentMode}${transactionRemarks ? ' (' + transactionRemarks + ')' : ''} [${generatedReceipt}]`,
        };
        allCustomers[custIdx] = {
          ...c,
          history: [historyEntry, ...(c.history || [])],
        };
        try {
          localStorage.setItem('glf_monitored_customers_master', JSON.stringify(allCustomers));
        } catch {}
      }

      // Also sync to credit manager applicants if present
      try {
        const cmStored = localStorage.getItem('glf_credit_manager_applicants_v5');
        if (cmStored) {
          const parsed = JSON.parse(cmStored);
          if (Array.isArray(parsed)) {
            const historyItem = {
              date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
              event: `Advance Collection Received — ₹${amtNum.toLocaleString('en-IN')}`,
              remarks: `Advance payment collected by ${currentUser?.displayName || 'Authorized CRO'} via ${selectedPaymentMode} [${generatedReceipt}]`,
            };
            const updated = parsed.map((app: any) => {
              if (
                app.id === selectedCustomer.id ||
                app.customerId === selectedCustomer.id ||
                app.customerName?.toLowerCase() === selectedCustomer.name.toLowerCase()
              ) {
                return {
                  ...app,
                  history: [historyItem, ...(app.history || [])],
                };
              }
              return app;
            });
            localStorage.setItem('glf_credit_manager_applicants_v5', JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('glf_credit_manager_updated'));
          }
        }
      } catch (e) {
        console.warn('Applicant history sync skipped:', e);
      }

      // 3. Update Local Records List
      const newRecordItem: AdvanceRecordItem = {
        id: generatedAdvId,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        loanId: activeLoanForCustomer.id,
        centerName: selectedCustomer.centerName,
        groupName: selectedCustomer.groupName,
        branchId: selectedCustomer.branchId || 'BR-01',
        branchName: selectedCustomer.branchName || 'Main Branch - Anna Nagar',
        weeklyDemand: activeLoanForCustomer.weeklyAmount || 2500,
        advanceAmount: amtNum,
        paymentMode: selectedPaymentMode,
        collectionDate: todayISO,
        collectionTime: nowTime,
        collectedBy: currentUser?.displayName || 'Customer Relationship Officer (CRO)',
        receiptNumber: generatedReceipt,
        status: 'Advance Recorded',
        remarks: transactionRemarks,
      };

      setRecords((prev) => [newRecordItem, ...prev]);
      setIsModalOpen(false);

      // Reset form
      setSelectedCustomerId('');
      setCustomerSearchTerm('');
      setAdvanceAmountInput('');
      setTransactionRemarks('');

      addToast({
        type: 'success',
        title: 'Advance Recorded Successfully',
        message: `Advance collection of ₹${amtNum.toLocaleString('en-IN')} recorded for ${selectedCustomer.name}.`,
      });

      // Automatically trigger receipt preview
      handlePreviewBill(newRecordItem);
    } catch (err) {
      console.error('Failed to record advance payment:', err);
      addToast({
        type: 'error',
        title: 'Transaction Error',
        message: 'Unable to record advance collection.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 6. RECEIPT BILL PREVIEW & DOWNLOAD (Section 28) ──
  const getAdvanceBillOptions = (r: AdvanceRecordItem): PDFBillOptions => {
    const cust = getMonitoredCustomers(null).find((c) => c.id === r.customerId);
    const loan = getMonitoredLoans(null).find((l) => l.id === r.loanId);

    return {
      receiptNo: r.receiptNumber,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: r.collectionTime || '11:00 AM',
      customerName: r.customerName,
      customerId: r.customerId,
      phone: r.customerPhone || cust?.phone || '—',
      spouseName: cust?.nomineeName || '—',
      groupName: r.groupName || cust?.groupName || '—',
      centerName: r.centerName || cust?.centerName || '—',
      loanId: r.loanId,
      installmentNo: 'Advance Collection',
      demandAmount: r.weeklyDemand,
      collectedAmount: r.advanceAmount,
      paymentMode: r.paymentMode,
      status: 'Advance Received',
      agentName: r.collectedBy,
      branchName: r.branchName || 'Main Branch - Anna Nagar',
      fileName: `Advance_Receipt_${r.customerId}_${r.id}.pdf`,
      outstandingBalance: loan?.outstandingAmount ?? cust?.outstandingBalance ?? 35000,
      totalLoanAmount: loan?.principalAmount ?? cust?.activeLoanAmount ?? 50000,
      loanProduct: loan?.planName || 'Micro Business Loan (JLG)',
    };
  };

  const handlePreviewBill = async (r: AdvanceRecordItem) => {
    try {
      const opts = getAdvanceBillOptions(r);
      const url = await generateBillPDFBlobUrl(opts);
      setPreviewBlobUrl(url);
      setPreviewTitle(`Advance Payment Receipt — ${r.customerName}`);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Failed to preview advance bill:', err);
      addToast({
        type: 'error',
        title: 'Preview Error',
        message: 'Could not generate advance receipt preview.',
      });
    }
  };

  const handleDownloadBill = async (r: AdvanceRecordItem) => {
    try {
      const opts = getAdvanceBillOptions(r);
      await generateBillPDF(opts);
      addToast({
        type: 'success',
        title: 'Receipt Downloaded',
        message: `Official advance receipt for ${r.customerName} downloaded.`,
      });
    } catch (err) {
      console.error('Failed to download advance receipt:', err);
      addToast({
        type: 'error',
        title: 'Download Error',
        message: 'Could not download receipt PDF.',
      });
    }
  };

  // ── 7. EXPORT ADVANCE REGISTER PDF (Section 27) ──
  const handleExportPDF = () => {
    try {
      generateReportPDF({
        title: 'Advance Collection Register Statement',
        subtitle: `Official Advance Collections Record (${filteredRecords.length} transactions)`,
        branch: 'Main Branch - Anna Nagar',
        agent: currentUser?.displayName || 'Authorized CRO',
        headers: ['Adv ID', 'Customer Name', 'Customer ID', 'Loan ID', 'Center / Group', 'Advance (₹)', 'Payment Mode', 'Date', 'Status'],
        rows: filteredRecords.map((r) => [
          r.id,
          r.customerName,
          r.customerId,
          r.loanId,
          `${r.groupName} (${r.centerName})`,
          r.advanceAmount.toLocaleString('en-IN'),
          r.paymentMode,
          r.collectionDate,
          'ADVANCE',
        ]),
        summaryItems: [
          { label: 'Total Advance Collections', value: `₹${totalAdvanceCollected.toLocaleString('en-IN')}` },
          { label: 'Total Advance Transactions', value: String(filteredRecords.length) },
          { label: 'Unique Advance Clients', value: String(uniqueAdvanceClientsCount) },
        ],
      });
      addToast({
        type: 'success',
        title: 'Report Exported',
        message: 'Advance collection statement downloaded successfully.',
      });
    } catch (err) {
      console.error('Failed to export advance report:', err);
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Unable to export report.',
      });
    }
  };

  return (
    <div className="space-y-6 font-body pb-16">
      {/* ── HEADER BANNER (Section 35) ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-1">
            <TrendingUp size={16} />
            Collection Operations Module
          </div>
          <h1 className="text-2xl font-black text-[#0B1F3A] font-body tracking-tight">
            Advance Collection
          </h1>
          <p className="text-sm text-[#64748B]">
            Record, view, and manage advance collection transactions for registered borrowers with active loans.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setFormValidationError('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#C9A227] text-white px-5 py-2.5 min-h-[44px] rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer touch-target"
          >
            <Plus size={16} />
            <span>Record Advance Payment</span>
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-[#0B1F3A] hover:bg-[#162D4A] text-white px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer touch-target"
          >
            <Download size={16} className="text-[#D4AF37]" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* ── TOP SUMMARY METRIC CARDS (Section 22, 23, 36: Real Production Data) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Advance Collections */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-[0_2px_10px_rgba(11,31,58,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              TOTAL ADVANCE COLLECTIONS
            </span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#ECFDF5] text-[#16A37A]">
              <Wallet size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#16A37A] font-body tracking-tight">
              ₹{totalAdvanceCollected.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] font-semibold text-[#64748B] mt-1.5">
              Cumulative advance transactions
            </div>
          </div>
        </div>

        {/* Card 2: Advance Transactions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-[0_2px_10px_rgba(11,31,58,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              ADVANCE TRANSACTIONS
            </span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#FFFBEB] text-[#D4AF37]">
              <Clock size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#0B1F3A] font-body tracking-tight">
              {totalTransactionsCount}
            </div>
            <div className="text-[11px] font-semibold text-[#64748B] mt-1.5">
              Recorded advance payments
            </div>
          </div>
        </div>

        {/* Card 3: Customers With Advance */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-[0_2px_10px_rgba(11,31,58,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              CUSTOMERS WITH ADVANCE
            </span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#EFF6FF] text-[#2563EB]">
              <Users size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#2563EB] font-body tracking-tight">
              {uniqueAdvanceClientsCount}
            </div>
            <div className="text-[11px] font-semibold text-[#64748B] mt-1.5">
              Active borrower accounts
            </div>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER BAR (Section 24, 25) ── */}
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

          {(searchQuery || selectedCenter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCenter('all');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN TABLE CARD (Section 18, 37: Clean Column Alignment) ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_10px_rgba(11,31,58,0.04)] overflow-hidden">
        {/* Dark Navy Section Header */}
        <div className="bg-[#0B1F3A] px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
            <h3 className="text-sm font-semibold uppercase tracking-wider font-body">
              Advance Collection Records ({filteredRecords.length})
            </h3>
          </div>
          <span className="text-xs font-medium text-[#D4AF37]">
            Legitimate Advance Payments
          </span>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 size={32} className="animate-spin text-[#D4AF37]" />
            <p className="text-sm font-medium text-[#64748B]">Loading advance collection records...</p>
          </div>
        ) : dataError ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-[#DC2626]">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-base font-bold text-[#0B1F3A]">Unable to load advance collection records.</h3>
            <p className="text-xs text-[#64748B] max-w-md">
              There was a problem retrieving advance records from the system.
            </p>
            <button
              type="button"
              onClick={loadAdvanceData}
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
              {records.length === 0 ? 'No advance collections recorded' : 'No matching advance records found'}
            </h3>
            <p className="text-xs text-[#64748B] max-w-md">
              {records.length === 0
                ? 'Advance collection transactions will appear here after they are recorded against an eligible active loan.'
                : 'Try a different customer name, ID, mobile number or loan reference.'}
            </p>
            {records.length === 0 ? (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#D4AF37] text-white text-xs font-semibold hover:bg-[#C9A227] transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Record Advance Payment</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCenter('all');
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
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[110px]">Advance ID</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[200px]">Customer</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[170px]">Contact</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[190px]">Group / Center</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[130px]">Loan ID</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[130px]">Advance Amount</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">Payment Mode</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">Collection Date</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">Status</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">Receipt Bill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group">
                      {/* Advance ID */}
                      <td className="py-4 px-4 font-mono text-xs font-bold text-blue-600 hover:text-blue-700 whitespace-nowrap min-w-[110px]">
                        {r.id}
                      </td>

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

                      {/* Loan ID */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[130px]">
                        <span className="font-mono text-xs font-semibold text-[#0B1F3A] bg-gray-100 hover:text-blue-600 hover:border-blue-300 px-2.5 py-1 rounded border border-gray-200 whitespace-nowrap inline-block transition-colors">
                          {r.loanId}
                        </span>
                      </td>

                      {/* Advance Amount (Right-aligned currency) */}
                      <td className="py-4 px-4 text-right font-bold text-sm text-[#16A37A] whitespace-nowrap tabular-nums min-w-[130px]">
                        ₹{r.advanceAmount.toLocaleString('en-IN')}
                      </td>

                      {/* Payment Mode */}
                      <td className="py-4 px-4 text-center whitespace-nowrap min-w-[130px]">
                        <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-[#0B1F3A] border border-gray-200">
                          {r.paymentMode === 'UPI' ? (
                            <CreditCard size={11} className="text-blue-600" />
                          ) : r.paymentMode === 'Bank Transfer' ? (
                            <Landmark size={11} className="text-[#2563EB]" />
                          ) : (
                            <Banknote size={11} className="text-[#16A37A]" />
                          )}
                          <span>{r.paymentMode}</span>
                        </span>
                      </td>

                      {/* Collection Date */}
                      <td className="py-4 px-4 text-center text-xs text-gray-500 whitespace-nowrap min-w-[130px]">
                        <p className="font-semibold text-[#0B1F3A]">{r.collectionDate}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">By {r.collectedBy}</p>
                      </td>

                      {/* Status Badge (Section 38) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap min-w-[140px]">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#93C5FD]/40">
                          {r.status}
                        </span>
                      </td>

                      {/* Receipt Bill Actions (Section 28) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap min-w-[140px]">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePreviewBill(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors cursor-pointer border border-blue-200"
                            title="Preview Bill Receipt"
                          >
                            <Eye size={12} className="text-blue-700" />
                            <span>Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadBill(r)}
                            className="p-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 transition-colors cursor-pointer"
                            title="Download Bill PDF"
                          >
                            <Download size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Responsive Cards (Section 40) */}
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
                            className="inline-flex items-center gap-1 font-mono text-[#64748B] hover:text-[#0B1F3A] hover:underline transition-colors cursor-pointer"
                            title={`Click to call ${r.customerPhone}`}
                          >
                            <Phone size={10} className="text-[#94A3B8]" />
                            <span>{r.customerPhone}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#93C5FD]/40">
                      {r.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#F8F9FA] p-2.5 rounded-xl border border-[#E2E8F0]">
                    <div>
                      <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Advance ID / Loan</span>
                      <span className="font-mono font-bold text-blue-600 block">{r.id}</span>
                      <span className="font-mono text-[11px] text-[#0B1F3A] block">{r.loanId}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Advance Collected</span>
                      <span className="font-black text-sm text-[#16A37A] block">₹{r.advanceAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Group / Center</span>
                      <span className="font-medium text-[#0B1F3A] truncate block">{r.groupName}</span>
                      <span className="text-[#64748B] text-[11px] truncate block">{r.centerName}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Payment Mode & Date</span>
                      <span className="font-semibold text-[#0B1F3A] block">{r.paymentMode}</span>
                      <span className="text-gray-400 text-[11px] block">{r.collectionDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handlePreviewBill(r)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-xs hover:bg-blue-100 transition-colors"
                    >
                      <Eye size={13} />
                      <span>Preview Receipt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadBill(r)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors shadow-xs"
                    >
                      <Download size={13} />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── RECORD ADVANCE PAYMENT MODAL (Section 5, 6, 7, 8, 9) ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none"
            role="dialog"
            aria-modal="true"
          >
            {/* Clickable Backdrop Overlay — Clicking anywhere outside closes the popup */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
              aria-label="Close modal backdrop"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-[min(94vw,520px)] max-h-[92dvh] overflow-hidden shadow-2xl border border-gray-200 relative z-10 flex flex-col font-body select-text"
            >
              {/* Modal Header */}
              <div className="bg-[#0B1F3A] px-5 py-4 flex items-center justify-between text-white border-b border-[#D4AF37]/30 rounded-t-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wide">Record Advance Collection</h3>
                    <p className="text-[11px] text-gray-300">
                      Record an advance installment payment against an existing active loan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleRecordAdvance} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                {/* Customer Selection Field (Section 6: Existing Customer Records) */}
                <div className="relative" ref={customerDropdownRef}>
                  <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-1">
                    Select Customer *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search existing customer by name, ID or phone..."
                      value={customerSearchTerm}
                      onFocus={() => setIsCustomerDropdownOpen(true)}
                      onChange={(e) => {
                        setCustomerSearchTerm(e.target.value);
                        setIsCustomerDropdownOpen(true);
                        if (selectedCustomerId) setSelectedCustomerId('');
                      }}
                      className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#D4AF37] shadow-xs"
                    />
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    {customerSearchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSearchTerm('');
                          setSelectedCustomerId('');
                          setIsCustomerDropdownOpen(true);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Customer Dropdown Menu */}
                  {isCustomerDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-gray-100 custom-scrollbar">
                      {matchingCustomers.length === 0 ? (
                        <div className="p-3 text-center text-xs text-gray-400 font-medium">
                          No matching registered customers found
                        </div>
                      ) : (
                        matchingCustomers.map((cust) => (
                          <div
                            key={cust.id}
                            onClick={() => handleSelectCustomer(cust)}
                            className="p-2.5 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar name={cust.name} size="sm" />
                              <div>
                                <p className="text-xs font-bold text-[#0B1F3A]">{cust.name}</p>
                                <p className="text-[10px] text-gray-500 font-mono">
                                  {cust.id} • {cust.phone}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">
                              {cust.centerName}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Active Loan Details Card (Section 7) */}
                {selectedCustomer && (
                  <div className="p-3 bg-[#F8F9FA] rounded-xl border border-gray-200 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Selected Customer:</span>
                      <strong className="text-[#0B1F3A] font-bold">
                        {selectedCustomer.name} ({selectedCustomer.id})
                      </strong>
                    </div>

                    {activeLoanForCustomer ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-medium">Active Loan Reference:</span>
                          <span className="font-mono font-bold text-[#D4AF37]">
                            {activeLoanForCustomer.id}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-medium">Loan Plan / Scheme:</span>
                          <span className="font-semibold text-[#0B1F3A]">
                            {activeLoanForCustomer.planName || 'Standard Weekly Plan'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-medium">Weekly Scheduled Installment:</span>
                          <span className="font-bold text-[#16A37A]">
                            ₹{(activeLoanForCustomer.weeklyAmount || 2500).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="pt-2 text-[#DC2626] font-bold flex items-center gap-1.5">
                        <AlertCircle size={15} />
                        <span>No active loan available for advance collection.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Advance Amount Input (Section 8) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                      Advance Amount (₹) *
                    </label>
                    {activeLoanForCustomer && (
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setAdvanceAmountInput(String(activeLoanForCustomer.weeklyAmount || 2500))}
                          className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-[#0B1F3A] font-bold rounded border border-gray-200"
                        >
                          1 Wk (₹{activeLoanForCustomer.weeklyAmount || 2500})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdvanceAmountInput(String((activeLoanForCustomer.weeklyAmount || 2500) * 2))}
                          className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-[#0B1F3A] font-bold rounded border border-gray-200"
                        >
                          2 Wks (₹{(activeLoanForCustomer.weeklyAmount || 2500) * 2})
                        </button>
                      </div>
                    )}
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="Enter advance amount in ₹..."
                    value={advanceAmountInput}
                    onChange={(e) => {
                      setAdvanceAmountInput(e.target.value);
                      if (formValidationError) setFormValidationError('');
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-[#0B1F3A] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-xs"
                  />
                </div>

                {/* Payment Mode Selection (Section 9) */}
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

                {/* Transaction Remarks (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-1">
                    Remarks / Transaction Ref (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Advance for festival week, UPI Ref #123456..."
                    value={transactionRemarks}
                    onChange={(e) => setTransactionRemarks(e.target.value)}
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

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleCloseModal}
                    className="px-4 py-2.5 min-h-[44px] border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || (!!selectedCustomer && !activeLoanForCustomer)}
                    className="px-5 py-2.5 min-h-[44px] bg-[#0B1F3A] hover:bg-[#162D4A] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Loader2 size={15} className="animate-spin text-[#D4AF37]" />
                    ) : (
                      <ShieldCheck size={15} className="text-[#D4AF37]" />
                    )}
                    <span>{isSubmitting ? 'Recording...' : 'Confirm & Save Advance'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── OFFICIAL A4 RECEIPT BILL PREVIEW MODAL ── */}
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
                      Golden Leaf Finance Official Advance Collection Receipt (A4 Standard)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClosePreview}
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
    </div>
  );
};

export default AdvanceCollectionPage;
