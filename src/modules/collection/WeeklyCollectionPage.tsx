// ──────────────────────────────────────────────────
// Golden Leaf Finance — Customer Relationship Officer (CRO): Weekly Collection
// Strictly aligned with Finance Collection & Loan Management System PDF
// Dynamic weekly installment demand, real-time ledger, and receipt generation
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  Search,
  Download,
  Eye,
  RotateCcw,
  Wallet,
  Building2,
  Users,
  ChevronRight,
  Filter,
  X,
  CreditCard,
  Banknote,
  Landmark,
  FileCheck2,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Loader2,
  RefreshCw,
  SearchX,
  FileText,
} from 'lucide-react';
import { PageHeader } from '../../components/ui';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore, useUIStore } from '../../store';
import {
  getMonitoredCustomers,
  saveMonitoredCustomers,
  getMonitoredLoans,
  saveMonitoredLoans,
  getMonitoredCollections,
  saveMonitoredCollections,
  type MonitoredCustomer,
  type MonitoredLoan,
  type MonitoredCollection,
} from '../../services/monitoringDataService';
import {
  generateBillPDF,
  generateBillPDFBlobUrl,
  type PDFBillOptions,
  generateReportPDF,
  generateReportPDFBlobUrl,
  type PDFReportOptions,
} from '../../utils/pdfGenerator';

export interface WeeklyBorrowerRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  branchId: string;
  branchName: string;
  centerName: string;
  groupName: string;
  loanId: string;
  installmentNo: string;
  weekNumber: number;
  tenorWeeks: number;
  dueAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  advanceAmount: number;
  paymentMode?: 'Cash' | 'UPI' | 'Bank Transfer';
  status: 'Collected' | 'Pending' | 'Partial' | 'Advance';
  collectionDate?: string;
  collectionTime?: string;
  receiptNumber?: string;
  remarks?: string;
  agentName: string;
  totalOutstanding?: number;
}

export const WeeklyCollectionPage: React.FC = () => {
  const currentUser = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);

  // Core Data States
  const [borrowers, setBorrowers] = useState<WeeklyBorrowerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Partial' | 'Collected' | 'Advance'>('all');
  const [groupFilter, setGroupFilter] = useState('all');

  // Collection Action Modal States
  const [selectedBorrower, setSelectedBorrower] = useState<WeeklyBorrowerRecord | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('Cash');
  const [remarks, setRemarks] = useState('');
  const [collectError, setCollectError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // PDF Preview Modal States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // ── Keyboard accessibility (close modals on Escape) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedBorrower) setSelectedBorrower(null);
        if (isPreviewOpen) handleClosePreview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBorrower, isPreviewOpen]);

  // ── 1. LOAD WEEKLY COLLECTION DATA FROM CENTRAL REPOSITORIES ──
  const loadWeeklyCollections = () => {
    try {
      setIsLoading(true);
      setDataError(false);

      const customers = getMonitoredCustomers(null);
      const loans = getMonitoredLoans(null);
      const collections = getMonitoredCollections(null);

      // Index customers by id
      const customerMap = new Map<string, MonitoredCustomer>();
      for (const c of customers) {
        if (c.id) customerMap.set(c.id, c);
      }

      // Index collections by loanId and customerId
      const collectionMap = new Map<string, MonitoredCollection>();
      for (const col of collections) {
        if (col.loanId) collectionMap.set(col.loanId, col);
        if (col.customerId && !collectionMap.has(col.customerId)) {
          collectionMap.set(col.customerId, col);
        }
      }

      const items: WeeklyBorrowerRecord[] = [];
      const processedLoanIds = new Set<string>();

      // 1. Process from Active Loans (Scheduled Weekly Demand)
      for (const loan of loans) {
        if (loan.status !== 'Active') continue;
        processedLoanIds.add(loan.id);

        const customer = customerMap.get(loan.customerId);
        const existingCol = collectionMap.get(loan.id) || (customer ? collectionMap.get(customer.id) : undefined);

        const tenor = loan.tenorWeeks || 20;
        const week = Math.min(tenor, (loan.weeksCompleted || 0) + 1);
        const installmentStr = `${String(week).padStart(2, '0')} / ${tenor}`;
        const dueAmt = loan.weeklyAmount || 2500;

        let colAmt = 0;
        let pMode: 'Cash' | 'UPI' | 'Bank Transfer' | undefined = undefined;
        let rcptNo: string | undefined = undefined;
        let colDate: string | undefined = undefined;
        let colTime: string | undefined = undefined;
        let rems: string | undefined = undefined;

        if (existingCol) {
          colAmt = existingCol.collectedAmount || 0;
          pMode = existingCol.paymentMode?.toLowerCase().includes('upi')
            ? 'UPI'
            : existingCol.paymentMode?.toLowerCase().includes('bank')
            ? 'Bank Transfer'
            : 'Cash';
          rcptNo = existingCol.receiptNumber && existingCol.receiptNumber !== 'Pending' ? existingCol.receiptNumber : undefined;
          colDate = existingCol.date;
          colTime = existingCol.time;
          rems = existingCol.ncRemarks;
        }

        // Section 8, 9, 10, 11: Pending & Status Logic
        const pendAmt = Math.max(0, dueAmt - colAmt);
        const advAmt = Math.max(0, colAmt - dueAmt);

        let calcStatus: WeeklyBorrowerRecord['status'] = 'Pending';
        if (colAmt === 0) {
          calcStatus = 'Pending';
        } else if (colAmt < dueAmt) {
          calcStatus = 'Partial';
        } else if (colAmt === dueAmt) {
          calcStatus = 'Collected';
        } else {
          calcStatus = 'Advance';
        }

        items.push({
          id: existingCol?.id || `COL-W-${loan.id.replace(/\D/g, '')}-${week}`,
          customerId: loan.customerId,
          customerName: loan.customerName || customer?.name || 'Registered Customer',
          customerPhone: customer?.phone || '',
          branchId: loan.branchId || 'BR-01',
          branchName: loan.branchName || customer?.branchName || 'Main Branch',
          centerName: customer?.centerName || 'Center 01',
          groupName: customer?.groupName || 'General Group',
          loanId: loan.id,
          installmentNo: installmentStr,
          weekNumber: week,
          tenorWeeks: tenor,
          dueAmount: dueAmt,
          collectedAmount: colAmt,
          pendingAmount: pendAmt,
          advanceAmount: advAmt,
          paymentMode: colAmt > 0 ? pMode : undefined,
          status: calcStatus,
          collectionDate: colDate,
          collectionTime: colTime,
          receiptNumber: rcptNo,
          remarks: rems,
          agentName: existingCol?.agentName || currentUser?.displayName || 'Collection Officer',
          totalOutstanding: loan.outstandingAmount || 0,
        });
      }

      // 2. Include any additional collection records not yet in loans
      for (const col of collections) {
        if (processedLoanIds.has(col.loanId)) continue;
        processedLoanIds.add(col.loanId);

        const customer = customerMap.get(col.customerId);
        const dueAmt = col.dueAmount || col.expectedAmount || 2500;
        const colAmt = col.collectedAmount || 0;
        const pendAmt = Math.max(0, dueAmt - colAmt);
        const advAmt = Math.max(0, colAmt - dueAmt);

        let calcStatus: WeeklyBorrowerRecord['status'] = 'Pending';
        if (colAmt === 0) {
          calcStatus = 'Pending';
        } else if (colAmt < dueAmt) {
          calcStatus = 'Partial';
        } else if (colAmt === dueAmt) {
          calcStatus = 'Collected';
        } else {
          calcStatus = 'Advance';
        }

        const pMode: 'Cash' | 'UPI' | 'Bank Transfer' = col.paymentMode?.toLowerCase().includes('upi')
          ? 'UPI'
          : col.paymentMode?.toLowerCase().includes('bank')
          ? 'Bank Transfer'
          : 'Cash';

        items.push({
          id: col.id,
          customerId: col.customerId,
          customerName: col.customerName,
          customerPhone: col.customerPhone || customer?.phone || '',
          branchId: col.branchId || 'BR-01',
          branchName: col.branchName || 'Main Branch',
          centerName: col.area || customer?.centerName || 'Center 01',
          groupName: col.groupName || customer?.groupName || 'General Group',
          loanId: col.loanId,
          installmentNo: col.installment || '01 / 20',
          weekNumber: 1,
          tenorWeeks: 20,
          dueAmount: dueAmt,
          collectedAmount: colAmt,
          pendingAmount: pendAmt,
          advanceAmount: advAmt,
          paymentMode: colAmt > 0 ? pMode : undefined,
          status: calcStatus,
          collectionDate: col.date,
          collectionTime: col.time,
          receiptNumber: col.receiptNumber && col.receiptNumber !== 'Pending' ? col.receiptNumber : undefined,
          remarks: col.ncRemarks,
          agentName: col.agentName || currentUser?.displayName || 'Authorized CRO',
          totalOutstanding: customer?.outstandingBalance || 0,
        });
      }

      setBorrowers(items);
    } catch (err) {
      console.error('Failed to load weekly collections:', err);
      setDataError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWeeklyCollections();

    const handleCollectionsUpdated = () => {
      loadWeeklyCollections();
    };
    window.addEventListener('glf-collections-updated', handleCollectionsUpdated);
    return () => {
      window.removeEventListener('glf-collections-updated', handleCollectionsUpdated);
    };
  }, []);

  // ── 2. DYNAMIC KPI COMPUTATIONS (Real Production Data) ──
  const totalDemand = useMemo(() => borrowers.reduce((s, b) => s + b.dueAmount, 0), [borrowers]);
  const totalCollected = useMemo(() => borrowers.reduce((s, b) => s + b.collectedAmount, 0), [borrowers]);
  const totalPending = useMemo(() => borrowers.reduce((s, b) => s + b.pendingAmount, 0), [borrowers]);
  const completedCount = useMemo(
    () => borrowers.filter((b) => b.status === 'Collected' || b.status === 'Advance').length,
    [borrowers]
  );
  const pendingCount = useMemo(
    () => borrowers.filter((b) => b.status === 'Pending' || b.status === 'Partial').length,
    [borrowers]
  );
  const advanceCount = useMemo(
    () => borrowers.filter((b) => b.status === 'Advance').length,
    [borrowers]
  );

  // Distinct groups & centers for filter dropdown
  const uniqueGroups = useMemo(() => {
    const set = new Set<string>();
    borrowers.forEach((b) => {
      if (b.groupName) set.add(b.groupName);
    });
    return Array.from(set).sort();
  }, [borrowers]);

  // ── 3. FILTER & SEARCH LOGIC (Section 13, 14: Functional & Normalized) ──
  const filteredBorrowers = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase();
    const queryDigits = searchQuery.replace(/\D/g, '');

    return borrowers.filter((b) => {
      // Status Filter
      if (statusFilter !== 'all' && b.status !== statusFilter) {
        return false;
      }

      // Group Filter
      if (groupFilter !== 'all' && b.groupName !== groupFilter) {
        return false;
      }

      // Search Query Normalization
      if (!rawQuery) return true;

      const nameMatch = b.customerName.toLowerCase().includes(rawQuery);
      const idMatch = b.customerId.toLowerCase().includes(rawQuery) || b.loanId.toLowerCase().includes(rawQuery);
      const groupMatch = b.groupName.toLowerCase().includes(rawQuery) || b.centerName.toLowerCase().includes(rawQuery);
      const phoneMatch = queryDigits.length >= 3
        ? b.customerPhone.replace(/\D/g, '').includes(queryDigits)
        : b.customerPhone.toLowerCase().includes(rawQuery);

      return nameMatch || idMatch || groupMatch || phoneMatch;
    });
  }, [borrowers, searchQuery, statusFilter, groupFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setGroupFilter('all');
  };

  // ── 4. COLLECTION MODAL HANDLERS ──
  const handleOpenCollect = (b: WeeklyBorrowerRecord) => {
    setSelectedBorrower(b);
    // Pre-fill with remaining pending amount if positive, else scheduled due
    const suggestedAmt = b.pendingAmount > 0 ? b.pendingAmount : b.dueAmount;
    setCollectAmount(String(suggestedAmt));
    setPaymentMode('Cash');
    setRemarks('');
    setCollectError('');
  };

  const handleSaveCollection = async () => {
    if (!selectedBorrower) return;

    const enteredAmt = parseFloat(collectAmount);
    if (isNaN(enteredAmt) || enteredAmt <= 0) {
      setCollectError('Please enter a valid collection amount greater than ₹0.');
      return;
    }
    setCollectError('');
    setIsSaving(true);

    try {
      const prevCol = selectedBorrower.collectedAmount || 0;
      const newTotalCol = prevCol + enteredAmt;
      const dueAmt = selectedBorrower.dueAmount;
      const newPending = Math.max(0, dueAmt - newTotalCol);
      const newAdvance = Math.max(0, newTotalCol - dueAmt);

      let newStatus: WeeklyBorrowerRecord['status'] = 'Collected';
      if (newTotalCol < dueAmt) newStatus = 'Partial';
      else if (newTotalCol === dueAmt) newStatus = 'Collected';
      else newStatus = 'Advance';

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      const nowDate = 'Today';
      const generatedReceipt = `RCP-2026-${Date.now().toString().slice(-4)}`;

      // 1. Update/Add in glf_monitored_collections_master
      const allCollections = getMonitoredCollections(null);
      const updatedColList = [...allCollections];
      const existingIndex = updatedColList.findIndex(
        (c) =>
          c.id === selectedBorrower.id ||
          (c.customerId === selectedBorrower.customerId && c.loanId === selectedBorrower.loanId)
      );

      const updatedColRecord: MonitoredCollection = {
        id: existingIndex >= 0 ? updatedColList[existingIndex].id : selectedBorrower.id,
        customerId: selectedBorrower.customerId,
        customerName: selectedBorrower.customerName,
        customerPhone: selectedBorrower.customerPhone,
        branchId: selectedBorrower.branchId,
        branchName: selectedBorrower.branchName,
        areaRoute: selectedBorrower.centerName,
        area: selectedBorrower.centerName,
        groupId: 'GRP-001',
        groupName: selectedBorrower.groupName,
        loanId: selectedBorrower.loanId,
        installment: selectedBorrower.installmentNo,
        expectedAmount: dueAmt,
        dueAmount: dueAmt,
        collectedAmount: newTotalCol,
        pendingAmount: newPending,
        agentName: currentUser?.displayName || selectedBorrower.agentName || 'Authorized CRO',
        agentId: 'EMP-004',
        date: nowDate,
        time: nowTime,
        status: (newStatus.toLowerCase() === 'collected' ? 'collected' : newStatus.toLowerCase()) as any,
        paymentMode: `${paymentMode} Collection`,
        receiptNumber: generatedReceipt,
        ncRemarks: remarks || undefined,
      };

      if (existingIndex >= 0) {
        updatedColList[existingIndex] = updatedColRecord;
      } else {
        updatedColList.unshift(updatedColRecord);
      }
      saveMonitoredCollections(updatedColList);

      // 2. Update Loan record
      const allLoans = getMonitoredLoans(null);
      const loanIndex = allLoans.findIndex((l) => l.id === selectedBorrower.loanId);
      if (loanIndex >= 0) {
        const l = allLoans[loanIndex];
        allLoans[loanIndex] = {
          ...l,
          paidAmount: (l.paidAmount || 0) + enteredAmt,
          outstandingAmount: Math.max(0, (l.outstandingAmount || 0) - enteredAmt),
        };
        try {
          saveMonitoredLoans(allLoans);
        } catch {}
      }

      // 3. Update Customer History
      const allCustomers = getMonitoredCustomers(null);
      const custIndex = allCustomers.findIndex((c) => c.id === selectedBorrower.customerId);
      if (custIndex >= 0) {
        const cust = allCustomers[custIndex];
        const historyEntry = {
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          event: `Weekly Collection — ₹${enteredAmt.toLocaleString('en-IN')}`,
          remarks: `Collected via ${paymentMode}${remarks ? ' (' + remarks + ')' : ''} [${generatedReceipt}]`,
        };
        allCustomers[custIndex] = {
          ...cust,
          history: [historyEntry, ...(cust.history || [])],
          outstandingBalance: Math.max(0, (cust.outstandingBalance || 0) - enteredAmt),
        };
        try {
          saveMonitoredCustomers(allCustomers);
        } catch {}
      }

      // 4. Update local state
      const updatedRecord: WeeklyBorrowerRecord = {
        ...selectedBorrower,
        collectedAmount: newTotalCol,
        pendingAmount: newPending,
        advanceAmount: newAdvance,
        status: newStatus,
        paymentMode,
        receiptNumber: generatedReceipt,
        collectionDate: nowDate,
        collectionTime: nowTime,
        remarks,
      };

      setBorrowers((prev) =>
        prev.map((b) => (b.id === selectedBorrower.id || b.loanId === selectedBorrower.loanId ? updatedRecord : b))
      );

      addToast({
        type: 'success',
        title: 'Collection Recorded',
        message: `₹${enteredAmt.toLocaleString('en-IN')} received via ${paymentMode} from ${selectedBorrower.customerName}`,
      });

      setSelectedBorrower(null);

      // Auto trigger official PDF bill preview
      handlePreviewBill(updatedRecord);
    } catch (err) {
      console.error('Failed to save collection:', err);
      addToast({
        type: 'error',
        title: 'Collection Failed',
        message: 'Unable to record collection payment. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ── 5. RECEIPT BILL PREVIEW & DOWNLOAD (Section 19: Real PDF Generator) ──
  const getBorrowerBillOptions = (b: WeeklyBorrowerRecord): PDFBillOptions => {
    const cust = getMonitoredCustomers(null).find((c) => c.id === b.customerId);
    const loan = getMonitoredLoans(null).find((l) => l.id === b.loanId);

    return {
      receiptNo: b.receiptNumber || `RCP-2026-${b.id.replace(/\D/g, '').slice(-4) || '8801'}`,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: b.collectionTime || '11:00 AM',
      customerName: b.customerName,
      customerId: b.customerId,
      phone: b.customerPhone || cust?.phone || '—',
      spouseName: cust?.nomineeName || '—',
      groupName: b.groupName || cust?.groupName || '—',
      centerName: b.centerName || cust?.centerName || '—',
      loanId: b.loanId,
      installmentNo: b.installmentNo,
      demandAmount: b.dueAmount,
      collectedAmount: b.collectedAmount > 0 ? b.collectedAmount : b.dueAmount,
      paymentMode: b.paymentMode || 'Cash at Center',
      status: b.status === 'Pending' ? 'Pending' : 'Success',
      agentName: b.agentName || currentUser?.displayName || 'Customer Relationship Officer (CRO)',
      branchName: b.branchName || 'Main Branch - Anna Nagar',
      fileName: `Receipt_${b.customerId}_${b.customerName.replace(/\s+/g, '_')}.pdf`,
      outstandingBalance: loan?.outstandingAmount ?? cust?.outstandingBalance ?? 35000,
      totalLoanAmount: loan?.principalAmount ?? cust?.activeLoanAmount ?? 50000,
      loanProduct: loan?.planName || 'Micro Business Loan (JLG)',
    };
  };

  const handlePreviewBill = async (b: WeeklyBorrowerRecord) => {
    try {
      const opts = getBorrowerBillOptions(b);
      const url = await generateBillPDFBlobUrl(opts);
      setPreviewBlobUrl(url);
      setPreviewTitle(`Payment Receipt Bill — ${b.customerName}`);
      setPreviewFileName(opts.fileName || `Receipt_${b.customerId}.pdf`);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Failed to preview bill:', err);
      addToast({
        type: 'error',
        title: 'Preview Failed',
        message: 'Could not generate bill preview.',
      });
    }
  };

  const handleDownloadBill = async (b: WeeklyBorrowerRecord) => {
    try {
      const opts = getBorrowerBillOptions(b);
      await generateBillPDF(opts);
      addToast({
        type: 'success',
        title: 'PDF Bill Downloaded',
        message: `Official receipt for ${b.customerName} downloaded successfully.`,
      });
    } catch (err) {
      console.error('Failed to download bill:', err);
      addToast({
        type: 'error',
        title: 'Download Failed',
        message: 'Could not download receipt PDF.',
      });
    }
  };

  // ── 6. WEEKLY COLLECTION REPORT PDF GENERATOR & EXPORT HANDLERS ──
  const buildWeeklyReportOptions = (): PDFReportOptions => {
    const listToExport = filteredBorrowers;
    const isFiltered = statusFilter !== 'all' || groupFilter !== 'all' || searchQuery.trim() !== '';

    let filterDesc = '';
    if (statusFilter !== 'all') filterDesc += `Status: ${statusFilter}  `;
    if (groupFilter !== 'all') filterDesc += `Group: ${groupFilter}  `;
    if (searchQuery.trim()) filterDesc += `Query: "${searchQuery.trim()}"`;

    const subTitle = isFiltered
      ? `Filtered Collection Ledger (${listToExport.length} accounts | ${filterDesc.trim()})`
      : `Complete Scheduled Weekly Demand & Collection Ledger (${listToExport.length} accounts)`;

    const totalExpDemand = listToExport.reduce((s, b) => s + b.dueAmount, 0);
    const totalExpCollected = listToExport.reduce((s, b) => s + b.collectedAmount, 0);
    const totalExpPending = listToExport.reduce((s, b) => s + b.pendingAmount, 0);
    const completedExp = listToExport.filter((b) => b.status === 'Collected' || b.status === 'Advance').length;
    const recoveryRate = totalExpDemand > 0 ? Math.round((totalExpCollected / totalExpDemand) * 100) : 0;

    const headers = [
      '#',
      'CLIENT ID',
      'BORROWER NAME',
      'CONTACT',
      'GROUP / CENTER',
      'EMI NO',
      'DEMAND (Rs.)',
      'COLLECTED (Rs.)',
      'PENDING (Rs.)',
      'STATUS',
      'MODE',
    ];

    const rows = listToExport.map((b, idx) => [
      (idx + 1).toString(),
      b.customerId,
      b.customerName,
      b.customerPhone || '-',
      `${b.groupName} - ${b.centerName}`,
      b.installmentNo,
      `Rs. ${b.dueAmount.toLocaleString('en-IN')}`,
      `Rs. ${b.collectedAmount.toLocaleString('en-IN')}`,
      `Rs. ${b.pendingAmount.toLocaleString('en-IN')}`,
      b.status,
      b.collectedAmount > 0 ? (b.paymentMode || 'Cash') : '-',
    ]);

    const activeBranchName =
      listToExport[0]?.branchName || 'Main Branch - Anna Nagar';

    const safeFilterSuffix = statusFilter !== 'all' ? `_${statusFilter}` : '';
    const dateStamp = new Date().toISOString().slice(0, 10);

    return {
      title: 'Weekly Collection Schedule & Recovery Report',
      subtitle: subTitle,
      startDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      endDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      branch: activeBranchName,
      agent: currentUser?.displayName || 'Customer Relationship Officer (CRO)',
      headers,
      rows,
      orientation: 'landscape',
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 24, fontStyle: 'bold' },
        2: { cellWidth: 38, fontStyle: 'bold' },
        3: { cellWidth: 26 },
        4: { cellWidth: 44 },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
        7: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] },
        8: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [217, 119, 6] },
        9: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        10: { cellWidth: 15, halign: 'center' },
      },
      summaryItems: [
        { label: 'Total Borrowers', value: `${listToExport.length} Accounts` },
        { label: 'Scheduled Demand', value: `Rs. ${totalExpDemand.toLocaleString('en-IN')}` },
        { label: 'Total Collected', value: `Rs. ${totalExpCollected.toLocaleString('en-IN')}` },
        { label: 'Pending Recovery', value: `Rs. ${totalExpPending.toLocaleString('en-IN')}` },
        { label: 'Recovery Rate', value: `${recoveryRate}% (${completedExp} Paid)` },
      ],
      fileName: `Weekly_Collection_Report${safeFilterSuffix}_${dateStamp}.pdf`,
    };
  };

  const handleExportReportPDF = async () => {
    if (filteredBorrowers.length === 0) {
      addToast({
        type: 'warning',
        title: 'No Data to Export',
        message: 'No weekly collection records match the current filter criteria.',
      });
      return;
    }

    try {
      setIsExporting(true);
      const opts = buildWeeklyReportOptions();
      await generateReportPDF(opts);
      addToast({
        type: 'success',
        title: 'Report Downloaded',
        message: `Weekly Collection Report (${filteredBorrowers.length} accounts) downloaded successfully as PDF.`,
      });
    } catch (err) {
      console.error('Failed to export weekly collection PDF:', err);
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not generate weekly collection PDF report. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreviewReportPDF = async () => {
    if (filteredBorrowers.length === 0) {
      addToast({
        type: 'warning',
        title: 'No Data to Preview',
        message: 'No weekly collection records match the current filter criteria.',
      });
      return;
    }

    try {
      const opts = buildWeeklyReportOptions();
      const url = await generateReportPDFBlobUrl(opts);
      setPreviewBlobUrl(url);
      setPreviewTitle('Weekly Collection Schedule & Recovery Report');
      setPreviewFileName(opts.fileName || 'Weekly_Collection_Report.pdf');
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Failed to preview weekly collection PDF:', err);
      addToast({
        type: 'error',
        title: 'Preview Failed',
        message: 'Could not generate report preview.',
      });
    }
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    setPreviewFileName('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 font-body pb-16">
      {/* ── TOP PAGE HEADER WITH EXPORT ACTIONS ── */}
      <PageHeader
        title="Weekly Collection"
        subtitle="Scheduled weekly borrower installment demand, real-time ledger, and instant receipt generation."
        breadcrumbs={[
          { label: 'Collections', href: '/collections/weekly' },
          { label: 'Weekly Collection' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              to="/collections/eod"
              className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-[10px] bg-[#0B1F3A] hover:bg-[#1E3A8A] text-white font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer"
              title="Go to End of Day (EOD) Currency Counter & Settlement"
            >
              <Banknote size={15} className="text-[#D4AF37]" />
              <span>EOD Settlement</span>
            </Link>
            <button
              type="button"
              onClick={handlePreviewReportPDF}
              disabled={filteredBorrowers.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-[10px] bg-white border border-[#CBD5E1] text-[#0B1F3A] hover:bg-slate-50 font-bold text-xs shadow-2xs hover:border-[#94A3B8] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Preview Weekly Collection Report PDF"
            >
              <Eye size={15} className="text-[#64748B]" />
              <span>Preview Report</span>
            </button>
            <button
              type="button"
              disabled={isExporting || filteredBorrowers.length === 0}
              onClick={handleExportReportPDF}
              className="inline-flex items-center gap-2 px-5 py-2 min-h-[40px] rounded-[10px] bg-[#D4AF37] hover:bg-[#C9A227] text-[#0B1F3A] font-extrabold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download Weekly Collection Report as PDF"
            >
              {isExporting ? (
                <Loader2 size={15} className="animate-spin text-[#0B1F3A]" />
              ) : (
                <Download size={15} className="text-[#0B1F3A]" />
              )}
              <span>Export PDF Report</span>
            </button>
          </div>
        }
      />

      {/* ── KPI METRIC CARDS (Real Production Data) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Weekly Scheduled Demand */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] p-5 shadow-[0_2px_10px_rgba(11,31,58,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              WEEKLY SCHEDULED DEMAND
            </span>
            <div className="p-2 rounded-[8px] bg-[#FFFBEB] text-[#D4AF37]">
              <Calendar size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#0B1F3A]">
            ₹{totalDemand.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-[#64748B] mt-1 font-medium">
            {borrowers.length} Assigned {borrowers.length === 1 ? 'Borrower' : 'Borrowers'}
          </div>
        </div>

        {/* Card 2: Total Collected */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] p-5 shadow-[0_2px_10px_rgba(11,31,58,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              TOTAL COLLECTED
            </span>
            <div className="p-2 rounded-[8px] bg-[#ECFDF5] text-[#16A37A]">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#16A37A]">
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-[#16A37A] mt-1 font-medium">
            {completedCount} Completed {advanceCount > 0 ? `(${advanceCount} Advance)` : 'on schedule'}
          </div>
        </div>

        {/* Card 3: Pending Recovery (NC) */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] p-5 shadow-[0_2px_10px_rgba(11,31,58,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              PENDING RECOVERY (NC)
            </span>
            <div className="p-2 rounded-[8px] bg-[#FEF2F2] text-[#DC2626]">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#DC2626]">
            ₹{totalPending.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-[#DC2626] mt-1 font-medium">
            {pendingCount} Pending {pendingCount === 1 ? 'Account' : 'Accounts'}
          </div>
        </div>
      </div>

      {/* ── MAIN TABLE CONTAINER CARD ── */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-[0_2px_10px_rgba(11,31,58,0.04)] overflow-hidden">
        {/* Dark Navy Section Header (Section 15: Weekly Schedule Context) */}
        <div className="bg-[#0B1F3A] px-4 sm:px-6 lg:px-8 py-4 border-b border-[#E5E7EB]/10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-[#D4AF37] rounded-full shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-[#FFFFFF] tracking-wide uppercase">
                Weekly Collection Schedule
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Scheduled weekly installment demand, borrower ledger, and instant receipt generation.
              </p>
            </div>
          </div>

          {/* Quick Search & Direct Export PDF */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search customer, ID, phone or group..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 min-h-[40px] rounded-[10px] bg-[#142B4E] border border-[#243E66] text-xs font-body text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 shadow-sm transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white p-1 rounded-full cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={isExporting || filteredBorrowers.length === 0}
              onClick={handleExportReportPDF}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[40px] rounded-[10px] bg-[#D4AF37] hover:bg-[#C9A227] text-[#0B1F3A] font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download Weekly Collection Report as PDF"
            >
              {isExporting ? (
                <Loader2 size={14} className="animate-spin text-[#0B1F3A]" />
              ) : (
                <Download size={14} className="text-[#0B1F3A]" />
              )}
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Filters & Export Toolbar */}
        <div className="px-4 sm:px-6 lg:px-8 py-3 bg-[#F8F9FA] border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 text-[#64748B] font-semibold">
              <Filter size={13} />
              <span>Status:</span>
            </div>
            {(['all', 'Pending', 'Partial', 'Collected', 'Advance'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-[#0B1F3A] text-white shadow-xs'
                    : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-gray-100'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}

            {/* Group selector */}
            {uniqueGroups.length > 0 && (
              <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
                <span className="text-[#64748B] font-semibold">Group:</span>
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#0B1F3A] focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 cursor-pointer"
                >
                  <option value="all">All Groups</option>
                  {uniqueGroups.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right Action Group: Reset Filters & Export Options */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Reset Filters */}
            {(searchQuery || statusFilter !== 'all' || groupFilter !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs text-[#DC2626] font-semibold hover:underline cursor-pointer mr-1"
              >
                <RotateCcw size={13} />
                <span>Reset Filters</span>
              </button>
            )}

            {/* Preview Report Button */}
            <button
              type="button"
              onClick={handlePreviewReportPDF}
              disabled={filteredBorrowers.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[#0B1F3A] hover:bg-slate-50 font-semibold text-xs shadow-2xs hover:border-[#94A3B8] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Preview Weekly Collection Report PDF"
            >
              <Eye size={13} className="text-[#64748B]" />
              <span>Preview Report</span>
            </button>

            {/* Export / Download Report PDF Button */}
            <button
              type="button"
              disabled={isExporting || filteredBorrowers.length === 0}
              onClick={handleExportReportPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#C9A227] text-[#0B1F3A] font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download Weekly Collection Report as PDF"
            >
              {isExporting ? (
                <Loader2 size={13} className="animate-spin text-[#0B1F3A]" />
              ) : (
                <Download size={13} className="text-[#0B1F3A]" />
              )}
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* ── DATA STATE HANDLERS ── */}
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 size={32} className="animate-spin text-[#D4AF37]" />
            <p className="text-sm font-medium text-[#64748B]">Loading weekly collection schedule...</p>
          </div>
        ) : dataError ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-[#DC2626]">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-base font-bold text-[#0B1F3A]">Unable to load collection records.</h3>
            <p className="text-xs text-[#64748B] max-w-md">
              There was a problem retrieving weekly collection schedules from the system.
            </p>
            <button
              type="button"
              onClick={loadWeeklyCollections}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[10px] bg-[#D4AF37] text-white text-xs font-semibold hover:bg-[#C9A227] transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
          </div>
        ) : filteredBorrowers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#F8F9FA] border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8]">
              <SearchX size={28} />
            </div>
            <h3 className="text-base font-bold text-[#0B1F3A]">
              {borrowers.length === 0 ? 'No weekly collections scheduled' : 'No matching customers found'}
            </h3>
            <p className="text-xs text-[#64748B] max-w-md">
              {borrowers.length === 0
                ? 'There are no collection records available for the selected schedule.'
                : 'Try a different customer name, ID, mobile number or group.'}
            </p>
            {(searchQuery || statusFilter !== 'all' || groupFilter !== 'all') && (
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
            {/* ── DESKTOP & TABLET VIEW: SaaS Table (Section 30: Column Alignment) ── */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs font-body border-collapse min-w-[1360px]">
                <thead className="bg-[#F8F9FA] border-b border-[#E5E7EB]">
                  <tr className="text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[200px]">Borrower</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[170px]">Contact</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[190px]">Group / Center</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[130px]">Installment</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[120px]">Due Demand</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[120px]">Collected</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[110px]">Pending</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[110px]">Status</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">Payment Mode</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">Receipt Bill</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[160px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBorrowers.map((b) => (
                    <tr key={b.id} className="hover:bg-blue-50/30 transition-colors group">
                      {/* Borrower */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[200px]">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={b.customerName} size="sm" />
                          <div className="min-w-0">
                            <div className="font-bold text-[#0B1F3A] text-sm group-hover:text-blue-600 transition-colors whitespace-nowrap">
                              {b.customerName}
                            </div>
                            <div className="text-[11px] text-[#64748B] font-mono font-semibold mt-0.5 whitespace-nowrap">
                              {b.customerId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[170px]">
                        <a
                          href={`tel:${b.customerPhone.replace(/[^0-9+]/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 font-mono text-xs text-[#0B1F3A] hover:text-blue-600 hover:underline transition-colors cursor-pointer group/call"
                          title={`Click to call ${b.customerPhone}`}
                        >
                          <Phone size={12} className="text-[#94A3B8] group-hover/call:text-blue-600 transition-colors shrink-0" />
                          <span>{b.customerPhone}</span>
                        </a>
                      </td>

                      {/* Group / Center */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[190px]">
                        <div className="font-semibold text-[#0B1F3A] flex items-center gap-1.5">
                          <Users size={12} className="text-[#94A3B8] shrink-0" />
                          <span className="truncate">{b.groupName}</span>
                        </div>
                        <div className="text-[#64748B] text-[11px] flex items-center gap-1.5 mt-0.5">
                          <Building2 size={12} className="text-[#94A3B8] shrink-0" />
                          <span className="truncate">{b.centerName}</span>
                        </div>
                      </td>

                      {/* Installment / Loan */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[130px]">
                        <div className="font-semibold text-[#0B1F3A]">
                          Week {b.installmentNo}
                        </div>
                        <div className="text-[11px] font-mono text-blue-600 font-semibold mt-0.5">
                          {b.loanId}
                        </div>
                      </td>

                      {/* Due Demand (Right-aligned currency) */}
                      <td className="py-4 px-4 text-right font-bold text-[#0B1F3A] text-sm whitespace-nowrap tabular-nums min-w-[120px]">
                        ₹{b.dueAmount.toLocaleString('en-IN')}
                      </td>

                      {/* Collected Amount (Right-aligned currency) */}
                      <td className="py-4 px-4 text-right font-bold text-[#16A37A] text-sm whitespace-nowrap tabular-nums min-w-[120px]">
                        ₹{b.collectedAmount.toLocaleString('en-IN')}
                      </td>

                      {/* Pending Amount (Right-aligned currency) */}
                      <td className="py-4 px-4 text-right font-bold text-sm whitespace-nowrap tabular-nums min-w-[110px]">
                        <span className={b.pendingAmount > 0 ? 'text-[#DC2626]' : 'text-[#64748B]'}>
                          ₹{b.pendingAmount.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Status (Center-aligned badge per Section 31) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap min-w-[110px]">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            b.status === 'Collected'
                              ? 'bg-[#ECFDF5] text-[#059669] border-[#10B981]/30'
                              : b.status === 'Advance'
                              ? 'bg-[#EFF6FF] text-[#2563EB] border-[#93C5FD]/40'
                              : b.status === 'Partial'
                              ? 'bg-[#FFFBEB] text-[#D97706] border-[#F59E0B]/30'
                              : 'bg-[#FEF2F2] text-[#DC2626] border-[#EF4444]/30'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>

                      {/* Payment Mode (Only when collection exists per Section 18) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap min-w-[120px]">
                        {b.collectedAmount > 0 && b.paymentMode ? (
                          <span className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-[#0B1F3A] bg-[#F8F9FA] px-2.5 py-0.5 rounded border border-[#E2E8F0]">
                            {b.paymentMode === 'UPI' ? (
                              <CreditCard size={11} className="text-blue-600" />
                            ) : (
                              <Banknote size={11} className="text-[#16A37A]" />
                            )}
                            <span>{b.paymentMode}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Receipt Bill Actions (Section 19) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap min-w-[140px]">
                        {b.collectedAmount > 0 ? (
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handlePreviewBill(b)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors cursor-pointer border border-blue-200"
                              title="Preview Bill Receipt"
                            >
                              <Eye size={12} className="text-blue-700" />
                              <span>Preview</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadBill(b)}
                              className="p-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 transition-colors cursor-pointer"
                              title="Download Bill PDF"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePreviewBill(b)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50/70 hover:bg-blue-100 text-blue-700 font-medium text-[11px] transition-colors cursor-pointer border border-blue-200/80"
                            title="Preview Collection Demand Slip"
                          >
                            <Eye size={12} className="text-blue-700" />
                            <span>Demand Slip</span>
                          </button>
                        )}
                      </td>

                      {/* Collection Action Button (Section 16) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap min-w-[160px]">
                        <button
                          type="button"
                          onClick={() => handleOpenCollect(b)}
                          className="inline-flex items-center justify-center gap-1 px-3.5 py-1.5 min-h-[36px] w-full max-w-[150px] rounded-[8px] bg-[#D4AF37] hover:bg-[#C9A227] text-white font-bold text-xs shadow-xs hover:shadow-sm transition-all cursor-pointer"
                        >
                          <span>{b.status === 'Collected' ? 'Re-collect / Advance' : 'Collect EMI'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── MOBILE VIEW: Responsive Cards (Section 36: Responsive Design) ── */}
            <div className="md:hidden divide-y divide-[#E5E7EB]">
              {filteredBorrowers.map((b) => (
                <div key={b.id} className="p-4 space-y-3 hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={b.customerName} size="sm" />
                      <div>
                        <h4 className="text-sm font-bold text-[#0B1F3A]">{b.customerName}</h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mt-0.5">
                          <span className="font-mono font-semibold">{b.customerId}</span>
                          <span>•</span>
                          <a
                            href={`tel:${b.customerPhone.replace(/[^0-9+]/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 font-mono text-[#64748B] hover:text-[#0B1F3A] hover:underline transition-colors cursor-pointer"
                            title={`Click to call ${b.customerPhone}`}
                          >
                            <Phone size={10} className="text-[#94A3B8]" />
                            <span>{b.customerPhone}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        b.status === 'Collected'
                          ? 'bg-[#ECFDF5] text-[#059669] border-[#10B981]/30'
                          : b.status === 'Advance'
                          ? 'bg-[#EFF6FF] text-[#2563EB] border-[#93C5FD]/40'
                          : b.status === 'Partial'
                          ? 'bg-[#FFFBEB] text-[#D97706] border-[#F59E0B]/30'
                          : 'bg-[#FEF2F2] text-[#DC2626] border-[#EF4444]/30'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#F8F9FA] p-2.5 rounded-xl border border-[#E2E8F0]">
                    <div>
                      <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Group / Center</span>
                      <span className="font-medium text-[#0B1F3A] truncate block">{b.groupName}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Installment</span>
                      <span className="font-medium text-[#0B1F3A] block">Week {b.installmentNo}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Due Demand</span>
                      <span className="font-bold text-[#0B1F3A] block">₹{b.dueAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Collected / Pending</span>
                      <span className="font-bold text-[#16A37A]">₹{b.collectedAmount.toLocaleString('en-IN')}</span>
                      {b.pendingAmount > 0 && (
                        <span className="text-[#DC2626] font-bold text-[11px] ml-1">
                          (₹{b.pendingAmount.toLocaleString('en-IN')} due)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 pt-1">
                    {b.collectedAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => handlePreviewBill(b)}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-xs hover:bg-blue-100 transition-colors"
                      >
                        <Eye size={13} />
                        <span>Preview Bill</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenCollect(b)}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#C9A227] text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <span>{b.status === 'Collected' ? 'Collect / Advance' : 'Collect EMI'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── COLLECT EMI MODAL (Section 16, 17, 18: Real Validation & Flow) ── */}
      <AnimatePresence>
        {selectedBorrower && (
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
              onClick={() => setSelectedBorrower(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
              aria-label="Close popup backdrop"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-[#E5E7EB] w-[min(94vw,480px)] max-h-[92dvh] overflow-hidden shadow-2xl relative z-10 font-body flex flex-col select-text"
            >
              {/* Modal Header */}
              <div className="bg-[#0B1F3A] px-5 py-4 flex items-center justify-between text-white border-b border-[#D4AF37]/30 rounded-t-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide">
                      Collect EMI — {selectedBorrower.customerName}
                    </h3>
                    <p className="text-[11px] text-gray-300">
                      ID: {selectedBorrower.customerId} • Loan: {selectedBorrower.loanId}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBorrower(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 space-y-4 text-xs font-body overflow-y-auto flex-1 custom-scrollbar">
                {/* Ledger Snapshot Card */}
                <div className="p-3.5 bg-[#F8F9FA] rounded-[12px] space-y-2 border border-[#E5E7EB]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Weekly Scheduled Demand:</span>
                    <strong className="text-[#0B1F3A] font-bold text-sm">
                      ₹{selectedBorrower.dueAmount.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Already Collected This Week:</span>
                    <span className="font-bold text-[#16A37A]">
                      ₹{selectedBorrower.collectedAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-200">
                    <span className="text-gray-600 font-bold">Remaining Pending:</span>
                    <strong className="font-bold text-sm text-[#DC2626]">
                      ₹{selectedBorrower.pendingAmount.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                {/* Collection Amount Input */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0B1F3A] tracking-wide uppercase">
                      Collection Amount (₹) *
                    </label>
                    {/* Quick fill buttons */}
                    <div className="flex items-center gap-1.5">
                      {selectedBorrower.pendingAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => setCollectAmount(String(selectedBorrower.pendingAmount))}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#0B1F3A]/5 text-[#0B1F3A] hover:bg-[#0B1F3A]/10 border border-[#0B1F3A]/10 cursor-pointer"
                        >
                          Due ₹{selectedBorrower.pendingAmount}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setCollectAmount(String(selectedBorrower.dueAmount))}
                        className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#0B1F3A]/5 text-[#0B1F3A] hover:bg-[#0B1F3A]/10 border border-[#0B1F3A]/10 cursor-pointer"
                      >
                        Weekly ₹{selectedBorrower.dueAmount}
                      </button>
                    </div>
                  </div>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={collectAmount}
                    onChange={(e) => {
                      setCollectAmount(e.target.value);
                      if (collectError) setCollectError('');
                    }}
                    placeholder="Enter collected amount in ₹..."
                    className={`w-full px-4 py-3 rounded-[10px] bg-[#FFFFFF] border text-[#0B1F3A] font-body text-base font-bold transition-all duration-200 focus:outline-none shadow-sm ${
                      collectError
                        ? 'border-[#DC2626] ring-1 ring-[#DC2626]'
                        : 'border-[#E5E7EB] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]'
                    }`}
                  />

                  {/* Validation Error message */}
                  {collectError && (
                    <p className="text-xs text-[#DC2626] font-medium flex items-center gap-1 mt-1">
                      <AlertCircle size={13} />
                      <span>{collectError}</span>
                    </p>
                  )}

                  {/* Real-time feedback calculation */}
                  {parseFloat(collectAmount) > 0 && (
                    <div className="text-[11px] text-[#64748B] bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                      {parseFloat(collectAmount) < selectedBorrower.pendingAmount ? (
                        <span className="text-[#D97706] font-medium">
                          • Partial payment: ₹{(selectedBorrower.pendingAmount - parseFloat(collectAmount)).toLocaleString('en-IN')} will remain pending.
                        </span>
                      ) : parseFloat(collectAmount) === selectedBorrower.pendingAmount ? (
                        <span className="text-[#16A37A] font-medium">
                          • Full pending installment covered (₹0 pending).
                        </span>
                      ) : (
                        <span className="text-[#2563EB] font-medium">
                          • Full installment covered + ₹{(parseFloat(collectAmount) - selectedBorrower.pendingAmount).toLocaleString('en-IN')} allocated as future advance.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Mode Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#0B1F3A] tracking-wide uppercase">
                    Payment Mode *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Cash', 'UPI', 'Bank Transfer'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        className={`py-2.5 px-2 min-h-[44px] rounded-[10px] font-semibold text-xs border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                          paymentMode === mode
                            ? 'bg-[#0B1F3A] text-white border-[#0B1F3A] shadow-xs'
                            : 'bg-[#F8F9FA] text-[#64748B] border-[#E5E7EB] hover:bg-gray-100'
                        }`}
                      >
                        {mode === 'Cash' ? (
                          <Banknote size={14} />
                        ) : mode === 'UPI' ? (
                          <CreditCard size={14} />
                        ) : (
                          <Landmark size={14} />
                        )}
                        <span>{mode}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Remarks / Reference Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#0B1F3A] tracking-wide uppercase">
                    Transaction Remarks / Ref No. (Optional)
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. UPI Ref #123456 or center receipt notes..."
                    className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#FFFFFF] border border-[#E5E7EB] text-[#0B1F3A] placeholder:text-[#94A3B8] font-body text-xs transition-all duration-200 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                  />
                </div>

                {/* Modal Action Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setSelectedBorrower(null)}
                    className="flex-1 py-3 min-h-[44px] rounded-[10px] bg-[#F8F9FA] hover:bg-[#E5E7EB] text-gray-700 font-semibold text-xs border border-[#E5E7EB] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveCollection}
                    className="flex-1 py-3 min-h-[44px] rounded-[10px] bg-[#D4AF37] hover:bg-[#C9A227] text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <FileCheck2 size={16} />}
                    <span>{isSaving ? 'Recording...' : 'Confirm & Print Bill'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── OFFICIAL A4 BILL PREVIEW MODAL ── */}
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
              <div className="bg-[#0B1F3A] px-5 py-4 flex items-center justify-between border-b border-[#D4AF37]/30 rounded-t-2xl">
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
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      {previewTitle}
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Golden Leaf Finance Official Payment Receipt (A4 Standard)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewBlobUrl}
                    download={previewFileName || 'Golden_Leaf_Document.pdf'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] text-[#0B1F3A] font-bold text-xs transition-colors cursor-pointer"
                    title="Download this PDF"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </a>
                  <button
                    type="button"
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

export default WeeklyCollectionPage;
