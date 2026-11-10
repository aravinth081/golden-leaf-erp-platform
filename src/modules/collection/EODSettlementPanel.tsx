// ──────────────────────────────────────────────────
// Golden Leaf Finance — End of the Day (EOD) Settlement Panel
// Integrated Multi-Tier Architecture:
// 1. CRO (Customer Relationship Officer): Enters collected currency note counts (500, 2000, 100, 50, etc.)
// 2. Branch Manager: Inspects physical notes, verifies reconciliation, and accepts into safe vault
// 3. Admin: Reviews consolidated settlements across branches and exports official PDF audit reports
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Banknote,
  Coins,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  ArrowRight,
  Download,
  Eye,
  FileText,
  Filter,
  Search,
  Plus,
  Minus,
  RefreshCw,
  Send,
  Lock,
  Archive,
  Check,
  X,
  CreditCard,
  QrCode,
  DollarSign,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import { getStoredBranches, type DetailedBranch } from '../../services/branchService';
import {
  getStoredEODSettlements,
  submitEODSettlement,
  verifyEODSettlement,
  rejectEODSettlement,
  calculatePhysicalCashTotal,
  type EODSettlementRecord,
  type DenominationBreakdown,
  type EODSettlementStatus,
} from '../../services/eodService';
import {
  generateEODSettlementPDF,
  generateEODSettlementPDFBlobUrl,
  generateConsolidatedEODPDF,
} from '../../utils/pdfGenerator';
import { getMonitoredCollections } from '../../services/monitoringDataService';

export const EODSettlementPanel: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);

  const userRole = (user?.customClaims?.role || 'collection_agent') as string;
  const isCRO = userRole === 'collection_agent';
  const isBranchManager = userRole === 'branch_manager';
  const isAdmin = userRole === 'admin' || userRole === 'area_manager';

  // Identity
  const employeeId = user?.uid || 'EMP-001';
  const employeeName = user?.displayName || user?.email?.split('@')[0] || (isCRO ? 'CRO Officer' : isBranchManager ? 'Branch Manager' : 'Administrator');
  const branchId = user?.customClaims?.branchId || 'BR-01';
  const branchName = user?.customClaims?.branchName || 'Main Branch';

  // State
  const [settlements, setSettlements] = useState<EODSettlementRecord[]>([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [branches, setBranches] = useState<DetailedBranch[]>([]);

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<'cro_entry' | 'bm_verifications' | 'admin_audit'>(
    isCRO ? 'cro_entry' : isBranchManager ? 'bm_verifications' : 'admin_audit'
  );

  // CRO Denomination Form State (Prominently includes 500, 2000, 100, 50 as requested)
  const [denominations, setDenominations] = useState<DenominationBreakdown>({
    notes2000: 0,
    notes500: 0,
    notes200: 0,
    notes100: 0,
    notes50: 0,
    notes20: 0,
    notes10: 0,
    coins: 0,
  });

  const [centersCovered, setCentersCovered] = useState('');
  const [upiCount, setUpiCount] = useState<number>(0);
  const [upiAmount, setUpiAmount] = useState<number>(0);
  const [croRemarks, setCroRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification Modal for Branch Manager
  const [inspectModal, setInspectModal] = useState<{
    isOpen: boolean;
    record: EODSettlementRecord | null;
    bmRemarks: string;
    safeLocker: string;
    actionType: 'VERIFY' | 'REJECT';
  }>({
    isOpen: false,
    record: null,
    bmRemarks: 'Physical currency notes inspected, counted, and deposited into safe locker.',
    safeLocker: 'Main Safe Vault Locker #01',
    actionType: 'VERIFY',
  });

  // PDF Preview Modal
  const [pdfPreview, setPdfPreview] = useState<{
    isOpen: boolean;
    url: string | null;
    title: string;
  }>({
    isOpen: false,
    url: null,
    title: '',
  });

  // Load settlements & branches
  const loadData = () => {
    setSettlements(getStoredEODSettlements());
    setBranches(getStoredBranches());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('glf_eod_updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('glf_eod_updated', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  // System Cash Collections for CRO Today
  const systemMetrics = useMemo(() => {
    const allCollections = getMonitoredCollections(branchId);
    // Filter for today & this agent (or fallback to active collections)
    let totalCash = 0;
    let totalUPI = 0;
    let count = 0;

    allCollections.forEach((c) => {
      if (c.status === 'collected') {
        count++;
        if (c.paymentMode?.toLowerCase().includes('upi') || c.paymentMode?.toLowerCase().includes('bank')) {
          totalUPI += c.collectedAmount;
        } else {
          totalCash += c.collectedAmount;
        }
      }
    });

    return { totalCash, totalUPI, totalCollected: totalCash + totalUPI, count };
  }, [branchId]);

  // Real-time Physical Cash Total calculation
  const physicalCashTotal = useMemo(() => {
    return calculatePhysicalCashTotal(denominations);
  }, [denominations]);

  // Variance calculation (Physical Cash - System Expected Cash)
  const cashVariance = useMemo(() => {
    return physicalCashTotal - systemMetrics.totalCash;
  }, [physicalCashTotal, systemMetrics.totalCash]);

  // Quick helper to increment/decrement notes
  const updateNoteCount = (key: keyof DenominationBreakdown, delta: number) => {
    setDenominations((prev) => ({
      ...prev,
      [key]: Math.max(0, (Number(prev[key]) || 0) + delta),
    }));
  };

  const setNoteDirect = (key: keyof DenominationBreakdown, val: string) => {
    const parsed = parseInt(val, 10);
    setDenominations((prev) => ({
      ...prev,
      [key]: isNaN(parsed) ? 0 : Math.max(0, parsed),
    }));
  };

  // Preset button to quickly populate exact count for demonstration
  const handleQuickMatch = () => {
    // 43,000 = 80 x 500 (40,000) + 10 x 200 (2,000) + 8 x 100 (800) + 4 x 50 (200)
    setDenominations({
      notes2000: 0,
      notes500: 80,
      notes200: 10,
      notes100: 8,
      notes50: 4,
      notes20: 0,
      notes10: 0,
      coins: 0,
    });
    addToast({
      type: 'info',
      title: 'Denominations Filled',
      message: '₹43,000 note counts populated (₹500 x 80, ₹200 x 10, ₹100 x 8, ₹50 x 4).',
    });
  };

  // Submit EOD Settlement by CRO
  const handleCROSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (physicalCashTotal === 0 && upiAmount === 0) {
      addToast({
        type: 'warning',
        title: 'Empty Cash Settlement',
        message: 'Please enter physical note counts for the day before submitting.',
      });
      return;
    }

    if (cashVariance !== 0 && croRemarks.trim().length < 10) {
      addToast({
        type: 'warning',
        title: 'Variance Explanation Required',
        message: 'A cash variance was detected. Please provide detailed comments explaining the shortage or excess.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      submitEODSettlement({
        agentId: employeeId,
        agentName: employeeName,
        agentRole: 'Customer Relationship Officer (CRO)',
        branchId,
        branchName,
        centersCovered: centersCovered.trim() || 'Center Field Route',
        date: dateFilter,
        systemExpectedCash: systemMetrics.totalCash,
        systemDigitalAmount: upiAmount,
        totalReceiptsCount: systemMetrics.count,
        denominations,
        upiTransactionCount: upiCount,
        upiTotalAmount: upiAmount,
        croRemarks: croRemarks.trim() || 'All physical cash counted and handover ready for safe deposit.',
      });

      addToast({
        type: 'success',
        title: 'EOD Settlement Submitted',
        message: 'Cash note counts submitted. Awaiting Branch Manager physical verification & safe deposit.',
      });

      // Reset form
      setCroRemarks('');
    } catch (err) {
      console.error('Failed to submit EOD:', err);
      addToast({
        type: 'error',
        title: 'Submission Error',
        message: 'Could not submit EOD settlement. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Branch Manager Action (Verify / Reject)
  const handleConfirmBMAction = () => {
    if (!inspectModal.record) return;

    if (inspectModal.actionType === 'VERIFY') {
      verifyEODSettlement({
        settlementId: inspectModal.record.id,
        bmId: employeeId,
        bmName: employeeName,
        bmRole: 'Branch Manager',
        bmRemarks: inspectModal.bmRemarks.trim(),
        safeBoxReference: inspectModal.safeLocker.trim(),
      });

      addToast({
        type: 'success',
        title: 'Physical Cash Verified & Locked',
        message: `${inspectModal.record.agentName}'s settlement verified and deposited into ${inspectModal.safeLocker}.`,
      });
    } else {
      if (!inspectModal.bmRemarks.trim()) {
        addToast({
          type: 'warning',
          title: 'Reason Required',
          message: 'Please provide remarks stating why physical cash was returned for recount.',
        });
        return;
      }

      rejectEODSettlement(
        inspectModal.record.id,
        employeeName,
        'Branch Manager',
        inspectModal.bmRemarks.trim()
      );

      addToast({
        type: 'info',
        title: 'Recount Requested',
        message: 'Settlement returned to CRO for denomination recounting.',
      });
    }

    setInspectModal({ isOpen: false, record: null, bmRemarks: '', safeLocker: '', actionType: 'VERIFY' });
  };

  // PDF Preview Action
  const handleOpenPDFPreview = async (rec: EODSettlementRecord) => {
    try {
      const url = await generateEODSettlementPDFBlobUrl(rec);
      setPdfPreview({
        isOpen: true,
        url,
        title: `EOD Settlement — ${rec.id} (${rec.agentName})`,
      });
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      addToast({
        type: 'error',
        title: 'PDF Generation Error',
        message: 'Could not create PDF preview.',
      });
    }
  };

  // Filtered lists
  const mySettlements = useMemo(() => {
    return settlements.filter((s) => s.agentId === employeeId || s.agentName === employeeName);
  }, [settlements, employeeId, employeeName]);

  const pendingBMQueue = useMemo(() => {
    return settlements.filter((s) => s.status === 'PENDING_BRANCH_MANAGER' && (isBranchManager ? s.branchId === branchId : true));
  }, [settlements, isBranchManager, branchId]);

  const verifiedSettlements = useMemo(() => {
    return settlements.filter((s) => {
      if (selectedBranchFilter !== 'all' && s.branchId !== selectedBranchFilter) return false;
      return true;
    });
  }, [settlements, selectedBranchFilter]);

  // Admin KPI metrics
  const adminKPIs = useMemo(() => {
    const totalPhysicalCash = verifiedSettlements
      .filter((s) => s.status === 'VERIFIED')
      .reduce((acc, s) => acc + s.physicalCashTotal, 0);

    const totalDigital = verifiedSettlements
      .filter((s) => s.status === 'VERIFIED')
      .reduce((acc, s) => acc + s.systemDigitalAmount, 0);

    const notes500Total = verifiedSettlements
      .filter((s) => s.status === 'VERIFIED')
      .reduce((acc, s) => acc + (s.denominations.notes500 || 0), 0);

    const notes2000Total = verifiedSettlements
      .filter((s) => s.status === 'VERIFIED')
      .reduce((acc, s) => acc + (s.denominations.notes2000 || 0), 0);

    const verifiedCount = verifiedSettlements.filter((s) => s.status === 'VERIFIED').length;
    const pendingCount = verifiedSettlements.filter((s) => s.status === 'PENDING_BRANCH_MANAGER').length;

    return {
      totalPhysicalCash,
      totalDigital,
      grandTotal: totalPhysicalCash + totalDigital,
      notes500Total,
      notes2000Total,
      verifiedCount,
      pendingCount,
    };
  }, [verifiedSettlements]);

  return (
    <div className="w-full flex flex-col gap-6 font-sans text-[#0B1F3A]">
      {/* ── 1. HEADER WITH ROLE CONTEXT & WORKFLOW EXPLANATION ── */}
      <div className="bg-gradient-to-r from-[#0B1F3A] via-[#162D4A] to-[#0A331E] rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-[#D4AF37]/20 text-[#F5D061] border border-[#D4AF37]/40 flex items-center justify-center shadow-inner shrink-0">
              <Banknote size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-manrope">
                  End of the Day (EOD) Cash &amp; Collection Settlement
                </h1>
                <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-[#0B1F3A] uppercase tracking-wider">
                  Denomination Verified
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {isCRO ? (
                  <>
                    <strong className="text-white">Officer Protocol:</strong> Enter your physical currency notes count (₹500, ₹2000, ₹100, ₹50) collected from field centers. Your handover will be submitted to{' '}
                    <span className="text-[#F5D061] font-semibold">the Branch Manager</span> for safe vault verification.
                  </>
                ) : isBranchManager ? (
                  <>
                    <strong className="text-white">Branch Manager Authority:</strong> Physically count and verify CRO currency denominations before locking cash in the branch safe. Verified settlements are permanently archived for Admin review.
                  </>
                ) : (
                  <>
                    <strong className="text-white">Executive Oversight:</strong> Consolidated audit register of daily verified cash settlements, denomination counts across all branches, safe vault deposits, and official PDF exports.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Stats or Actions */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {isAdmin && (
              <button
                type="button"
                onClick={() => generateConsolidatedEODPDF(verifiedSettlements, selectedBranchFilter === 'all' ? 'All Branches' : selectedBranchFilter, dateFilter)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#E5C158] hover:to-[#B8860B] text-[#0B1F3A] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Download size={15} />
                <span>Export Consolidated PDF</span>
              </button>
            )}

            {isCRO && (
              <button
                type="button"
                onClick={handleQuickMatch}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Fill note counts matching ₹43,000 for demonstration"
              >
                <Sparkles size={14} className="text-[#F5D061]" />
                <span>Quick Auto-Count Preset</span>
              </button>
            )}
          </div>
        </div>

        {/* Segmented Tab Navigation for Roles */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-2 flex-wrap">
          {isCRO && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('cro_entry')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'cro_entry'
                    ? 'bg-white text-[#0B1F3A] shadow-md font-extrabold'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <Banknote size={15} />
                <span>Denomination Cash Entry</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('admin_audit')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'admin_audit'
                    ? 'bg-white text-[#0B1F3A] shadow-md font-extrabold'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <Archive size={15} />
                <span>My Past EOD Settlements</span>
              </button>
            </>
          )}

          {isBranchManager && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('bm_verifications')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
                  activeTab === 'bm_verifications'
                    ? 'bg-white text-[#0B1F3A] shadow-md font-extrabold'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <ShieldCheck size={15} />
                <span>Pending CRO Cash Verifications</span>
                {pendingBMQueue.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black leading-none animate-pulse">
                    {pendingBMQueue.length} Pending
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('admin_audit')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'admin_audit'
                    ? 'bg-white text-[#0B1F3A] shadow-md font-extrabold'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <CheckCircle2 size={15} />
                <span>Verified Safe Vault Archive</span>
              </button>
            </>
          )}

          {isAdmin && (
            <div className="flex items-center gap-2 text-xs font-bold text-white/90">
              <Building2 size={16} className="text-[#D4AF37]" />
              <span>Executive Multi-Branch EOD Audit Register</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. CRO DENOMINATION ENTRY FORM ── */}
      {activeTab === 'cro_entry' && (
        <form onSubmit={handleCROSubmit} className="flex flex-col gap-6">
          {/* System Collection Bar */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                System Cash Expected
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#0B1F3A] font-manrope block mt-1">
                ₹{systemMetrics.totalCash.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                From field borrower collections
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Digital / UPI Collections
              </span>
              <span className="text-xl sm:text-2xl font-black text-blue-700 font-manrope block mt-1">
                ₹{upiAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-blue-600 mt-0.5 block font-medium">
                {upiCount} QR Transactions Verified
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Total Day Recovery
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700 font-manrope block mt-1">
                ₹{(systemMetrics.totalCash + upiAmount).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-600 mt-0.5 block font-medium">
                {systemMetrics.count} Borrower Receipts
              </span>
            </div>

            {/* Reconciliation Live Status Box */}
            <div
              className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                cashVariance === 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : cashVariance < 0
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider block">
                  Reconciliation Status
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  {cashVariance === 0 ? (
                    <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
                  ) : (
                    <AlertTriangle size={18} className="text-rose-700 shrink-0" />
                  )}
                  <strong className="text-sm font-extrabold">
                    {cashVariance === 0
                      ? 'Exact Match (100% Balanced)'
                      : cashVariance < 0
                      ? `Shortage of ₹${Math.abs(cashVariance).toLocaleString('en-IN')}`
                      : `Excess of ₹${cashVariance.toLocaleString('en-IN')}`}
                  </strong>
                </div>
              </div>
              <span className="text-[10px] opacity-80 mt-1 block">
                Physical Cash: ₹{physicalCashTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* DENOMINATION NOTE COUNTING GRID (Specifically Highlighting 500, 2000, 100, 50) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-3.5 sm:p-6 lg:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-5 border-b border-slate-200/80">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#0B1F3A] font-manrope flex items-center gap-2">
                  <Banknote className="text-[#D4AF37] shrink-0" size={22} />
                  <span>Physical Currency Denominations &amp; Notes Count</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter note-by-note count for physical cash bundle handover to the Branch Manager.
                </p>
              </div>

              {/* Running Physical Total Badge */}
              <div className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-[#0B1F3A] text-white flex items-center justify-between sm:justify-start gap-2.5 shadow-sm">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-300">
                  Total Physical Cash:
                </span>
                <span className="text-lg font-black text-[#F5D061] font-mono">
                  ₹{physicalCashTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* PRIMARY REQUIRED DENOMINATIONS: ₹500, ₹100, ₹50 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mt-4 sm:mt-6">
              {/* ₹500 Notes Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70 transition-all flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-extrabold text-xs font-mono tracking-wide shrink-0">
                    ₹500 NOTE
                  </span>
                  <span className="text-xs font-bold text-emerald-900 font-mono text-right truncate">
                    = ₹{((denominations.notes500 || 0) * 500).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="mt-3">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    Number of ₹500 Notes
                  </label>
                  <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => updateNoteCount('notes500', -1)}
                      className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100 active:scale-95 transition-all cursor-pointer touch-target min-w-[32px]"
                      title="Decrease ₹500 notes"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={denominations.notes500 || ''}
                      onChange={(e) => setNoteDirect('notes500', e.target.value)}
                      placeholder="0"
                      className="flex-1 min-w-0 h-9 px-2 sm:px-3 rounded-xl bg-white border border-slate-300 text-center font-extrabold text-slate-900 text-sm focus:outline-none focus:border-emerald-600 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => updateNoteCount('notes500', 1)}
                      className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100 active:scale-95 transition-all cursor-pointer touch-target min-w-[32px]"
                      title="Increase ₹500 notes"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    {[10, 20, 50].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => updateNoteCount('notes500', step)}
                        className="flex-1 py-1 rounded-lg bg-white/90 hover:bg-white text-[11px] font-bold text-emerald-800 border border-emerald-200 shadow-2xs transition-all active:scale-95 cursor-pointer touch-target min-h-[30px]"
                      >
                        +{step}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ₹100 Notes Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl border-2 border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50/70 transition-all flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-700 text-white font-extrabold text-xs font-mono tracking-wide shrink-0">
                    ₹100 NOTE
                  </span>
                  <span className="text-xs font-bold text-indigo-900 font-mono text-right truncate">
                    = ₹{((denominations.notes100 || 0) * 100).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="mt-3">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    Number of ₹100 Notes
                  </label>
                  <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => updateNoteCount('notes100', -1)}
                      className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100 active:scale-95 transition-all cursor-pointer touch-target min-w-[32px]"
                      title="Decrease ₹100 notes"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={denominations.notes100 || ''}
                      onChange={(e) => setNoteDirect('notes100', e.target.value)}
                      placeholder="0"
                      className="flex-1 min-w-0 h-9 px-2 sm:px-3 rounded-xl bg-white border border-slate-300 text-center font-extrabold text-slate-900 text-sm focus:outline-none focus:border-indigo-600 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => updateNoteCount('notes100', 1)}
                      className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100 active:scale-95 transition-all cursor-pointer touch-target min-w-[32px]"
                      title="Increase ₹100 notes"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    {[5, 10, 20].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => updateNoteCount('notes100', step)}
                        className="flex-1 py-1 rounded-lg bg-white/90 hover:bg-white text-[11px] font-bold text-indigo-800 border border-indigo-200 shadow-2xs transition-all active:scale-95 cursor-pointer touch-target min-h-[30px]"
                      >
                        +{step}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ₹50 Notes Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl border-2 border-teal-300 bg-teal-50/40 hover:bg-teal-50/70 transition-all flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-teal-700 text-white font-extrabold text-xs font-mono tracking-wide shrink-0">
                    ₹50 NOTE
                  </span>
                  <span className="text-xs font-bold text-teal-900 font-mono text-right truncate">
                    = ₹{((denominations.notes50 || 0) * 50).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="mt-3">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    Number of ₹50 Notes
                  </label>
                  <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => updateNoteCount('notes50', -1)}
                      className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100 active:scale-95 transition-all cursor-pointer touch-target min-w-[32px]"
                      title="Decrease ₹50 notes"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={denominations.notes50 || ''}
                      onChange={(e) => setNoteDirect('notes50', e.target.value)}
                      placeholder="0"
                      className="flex-1 min-w-0 h-9 px-2 sm:px-3 rounded-xl bg-white border border-slate-300 text-center font-extrabold text-slate-900 text-sm focus:outline-none focus:border-teal-600 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => updateNoteCount('notes50', 1)}
                      className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100 active:scale-95 transition-all cursor-pointer touch-target min-w-[32px]"
                      title="Increase ₹50 notes"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    {[5, 10, 20].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => updateNoteCount('notes50', step)}
                        className="flex-1 py-1 rounded-lg bg-white/90 hover:bg-white text-[11px] font-bold text-teal-800 border border-teal-200 shadow-2xs transition-all active:scale-95 cursor-pointer touch-target min-h-[30px]"
                      >
                        +{step}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SECONDARY DENOMINATIONS: ₹200, ₹20, ₹10, COINS */}
            <div className="mt-4 pt-4 border-t border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
                Other Currency Denominations (₹200, ₹20, ₹10, Coins)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* ₹200 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>₹200 Note</span>
                    <span className="font-mono text-orange-700">₹{((denominations.notes200 || 0) * 200).toLocaleString()}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={denominations.notes200 || ''}
                    onChange={(e) => setNoteDirect('notes200', e.target.value)}
                    placeholder="Count"
                    className="w-full min-w-0 h-8 px-2.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* ₹20 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>₹20 Note</span>
                    <span className="font-mono text-amber-700">₹{((denominations.notes20 || 0) * 20).toLocaleString()}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={denominations.notes20 || ''}
                    onChange={(e) => setNoteDirect('notes20', e.target.value)}
                    placeholder="Count"
                    className="w-full min-w-0 h-8 px-2.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* ₹10 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>₹10 Note</span>
                    <span className="font-mono text-amber-800">₹{((denominations.notes10 || 0) * 10).toLocaleString()}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={denominations.notes10 || ''}
                    onChange={(e) => setNoteDirect('notes10', e.target.value)}
                    placeholder="Count"
                    className="w-full min-w-0 h-8 px-2.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Coins Total Amount */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Mixed Coins Total</span>
                    <span className="font-mono text-slate-600">₹{(denominations.coins || 0).toLocaleString()}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={denominations.coins || ''}
                    onChange={(e) => setNoteDirect('coins', e.target.value)}
                    placeholder="₹ Amount"
                    className="w-full min-w-0 h-8 px-2.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DIGITAL COLLECTION DETAILS & REMARKS SECTION */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field Routes / Centers covered */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Field Centers &amp; Route Covered Today
                </label>
                <input
                  type="text"
                  value={centersCovered}
                  onChange={(e) => setCentersCovered(e.target.value)}
                  placeholder="e.g. Center 01 (Anna Nagar), Center 03 (Shenoy Nagar)"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0B1F3A]"
                  required
                />
              </div>

              {/* Digital UPI Amount confirmation */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Digital / QR UPI Verified Receipts Amount (INR)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(Number(e.target.value) || 0)}
                    className="flex-1 h-10 px-3.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0B1F3A]"
                  />
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                    ({upiCount} Txns)
                  </span>
                </div>
              </div>
            </div>

            {/* CRO Closing Remarks */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                CRO Closing Comments &amp; Physical Cash Handover Notes
              </label>
              <textarea
                rows={3}
                value={croRemarks}
                onChange={(e) => setCroRemarks(e.target.value)}
                placeholder="Mention any borrower discrepancies, center recovery highlights, or bundle packing details..."
                className="w-full p-3.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#0B1F3A] resize-none font-medium leading-relaxed"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                This declaration will be permanently recorded and verified by the Branch Manager.
              </p>
            </div>

            {/* Submission Actions */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
              <div className="text-xs text-slate-600 flex items-center gap-2">
                <Lock size={15} className="text-emerald-700" />
                <span>
                  Physical Cash: <strong className="text-slate-900 font-mono">₹{physicalCashTotal.toLocaleString('en-IN')}</strong> + UPI: <strong className="text-blue-700 font-mono">₹{upiAmount.toLocaleString('en-IN')}</strong> = Total <strong className="text-emerald-800 font-mono">₹{(physicalCashTotal + upiAmount).toLocaleString('en-IN')}</strong>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDenominations({ notes2000: 0, notes500: 0, notes200: 0, notes100: 0, notes50: 0, notes20: 0, notes10: 0, coins: 0 })}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Reset Counts
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#162D4A] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
                >
                  <Send size={14} />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit EOD to Branch Manager'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── 3. BRANCH MANAGER VERIFICATION QUEUE ── */}
      {activeTab === 'bm_verifications' && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="text-lg font-black text-[#0B1F3A] font-manrope">
                Pending CRO End of Day Cash Submissions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect physical currency notes handed over by CROs before depositing into the branch safe vault.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              {pendingBMQueue.length} Awaiting Verification
            </span>
          </div>

          {pendingBMQueue.length === 0 ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={28} />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                All CRO End of Day Settlements Verified
              </h4>
              <p className="text-xs text-slate-400 max-w-sm">
                No CRO settlements are pending physical cash verification in this branch.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingBMQueue.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border-2 border-slate-200 hover:border-[#D4AF37]/60 p-5 sm:p-6 transition-all shadow-xs flex flex-col gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-sm">
                        {item.agentName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-[#0B1F3A]">{item.agentName}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                            {item.agentId}
                          </span>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {item.agentRole}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.branchName} • Handover Time: {item.displayTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 flex items-center gap-1.5">
                        <Clock size={12} className="text-amber-600 animate-pulse" />
                        Pending BM Verification
                      </span>
                    </div>
                  </div>

                  {/* Notes Breakdown Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/70 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        ₹500 Notes
                      </span>
                      <span className="text-sm font-extrabold text-slate-800 mt-0.5 block font-mono">
                        {item.denominations.notes500 || 0} notes (₹{((item.denominations.notes500 || 0) * 500).toLocaleString('en-IN')})
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        ₹200 Notes
                      </span>
                      <span className="text-sm font-extrabold text-slate-800 mt-0.5 block font-mono">
                        {item.denominations.notes200 || 0} notes (₹{((item.denominations.notes200 || 0) * 200).toLocaleString('en-IN')})
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        ₹100 Notes
                      </span>
                      <span className="text-sm font-extrabold text-slate-800 mt-0.5 block font-mono">
                        {item.denominations.notes100 || 0} notes (₹{((item.denominations.notes100 || 0) * 100).toLocaleString('en-IN')})
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        ₹50 Notes
                      </span>
                      <span className="text-sm font-extrabold text-slate-800 mt-0.5 block font-mono">
                        {item.denominations.notes50 || 0} notes (₹{((item.denominations.notes50 || 0) * 50).toLocaleString('en-IN')})
                      </span>
                    </div>
                  </div>

                  {/* Summary row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="text-xs space-y-0.5">
                      <p className="text-slate-600">
                        Physical Cash: <strong className="text-slate-900 font-mono">₹{item.physicalCashTotal.toLocaleString('en-IN')}</strong> | Digital UPI: <strong className="text-blue-700 font-mono">₹{item.systemDigitalAmount.toLocaleString('en-IN')}</strong>
                      </p>
                      <p className="text-slate-500 italic text-[11px]">
                        CRO Remarks: "{item.croRemarks || 'No issues reported.'}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenPDFPreview(item)}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="View PDF"
                      >
                        <Eye size={13} />
                        <span>Preview PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInspectModal({ isOpen: true, record: item, bmRemarks: 'Physical notes verified and accepted into safe vault.', safeLocker: 'Main Safe Vault Locker #01', actionType: 'VERIFY' })}
                        className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <ShieldCheck size={14} />
                        <span>Inspect &amp; Deposit to Safe</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInspectModal({ isOpen: true, record: item, bmRemarks: 'Cash count mismatch observed. Please recount physical bundle.', safeLocker: '', actionType: 'REJECT' })}
                        className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <XCircle size={13} />
                        <span>Reject / Recount</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 4. ADMIN & BM AUDIT ARCHIVE REGISTER ── */}
      {(activeTab === 'admin_audit' || isAdmin) && (
        <div className="flex flex-col gap-5">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Physical Cash in Safes
              </span>
              <div className="my-2">
                <span className="text-2xl sm:text-[26px] font-black text-[#0B1F3A] font-manrope">
                  ₹{adminKPIs.totalPhysicalCash.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck size={13} />
                <span>Verified in branch lockers</span>
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Digital UPI Collections
              </span>
              <div className="my-2">
                <span className="text-2xl sm:text-[26px] font-black text-blue-700 font-manrope">
                  ₹{adminKPIs.totalDigital.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                <QrCode size={13} />
                <span>Direct account deposits</span>
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                ₹500 Notes in Safe Vaults
              </span>
              <div className="my-2">
                <span className="text-2xl sm:text-[26px] font-black text-[#D4AF37] font-manrope">
                  {adminKPIs.notes500Total.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-semibold text-slate-400 ml-1.5">Notes Counted</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Value: ₹{(adminKPIs.notes500Total * 500).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Settlements Audit Status
              </span>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-[26px] font-black text-emerald-700 font-manrope">
                  {adminKPIs.verifiedCount}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  / {adminKPIs.verifiedCount + adminKPIs.pendingCount} Verified
                </span>
              </div>
              <span className="text-[11px] text-amber-600 font-semibold">
                {adminKPIs.pendingCount} Pending BM verification
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Branch:</span>
                  <select
                    value={selectedBranchFilter}
                    onChange={(e) => setSelectedBranchFilter(e.target.value)}
                    className="h-8 px-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50"
                  >
                    <option value="all">All Branches</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Date:</span>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="h-8 px-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 cursor-pointer"
                />
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => generateConsolidatedEODPDF(verifiedSettlements, selectedBranchFilter === 'all' ? 'All Branches' : selectedBranchFilter, dateFilter)}
                className="px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#162D4A] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Download size={14} />
                <span>Download Consolidated Report (PDF)</span>
              </button>
            )}
          </div>

          {/* Settlements Data Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Settlement Ref</th>
                    <th className="py-3 px-4">Date &amp; Officer</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Key Notes (500 / 200 / 100 / 50)</th>
                    <th className="py-3 px-4 text-right">Physical Cash</th>
                    <th className="py-3 px-4 text-right">Digital UPI</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Branch Verification</th>
                    <th className="py-3 px-4 text-center">Official PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {verifiedSettlements.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No EOD cash settlements found for the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    verifiedSettlements.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0B1F3A]">
                          {r.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900">{r.agentName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {r.displayTime}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-semibold">
                          {r.branchName.split('-')[0].trim()}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-200">
                              500x{r.denominations.notes500 || 0}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-800 text-[10px] font-mono font-bold border border-orange-200">
                              200x{r.denominations.notes200 || 0}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 text-[10px] font-mono font-bold border border-indigo-200">
                              100x{r.denominations.notes100 || 0}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] font-mono font-bold border border-teal-200">
                              50x{r.denominations.notes50 || 0}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                          ₹{r.physicalCashTotal.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-blue-700 font-bold">
                          ₹{r.systemDigitalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {r.status === 'VERIFIED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 size={11} /> Verified
                            </span>
                          ) : r.status === 'REJECTED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                              <XCircle size={11} /> Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                              <Clock size={11} /> Pending BM
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {r.verifiedBy ? (
                            <div>
                              <span className="font-bold text-slate-800 block">
                                {r.verifiedBy.userName}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {r.safeBoxReference || 'Safe Vault'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Awaiting Inspection</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenPDFPreview(r)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="Preview Official PDF"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => generateEODSettlementPDF(r)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer"
                              title="Download PDF Document"
                            >
                              <Download size={14} />
                            </button>
                          </div>
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

      {/* ── 5. BRANCH MANAGER VERIFICATION & SAFE DEPOSIT MODAL ── */}
      <AnimatePresence>
        {inspectModal.isOpen && inspectModal.record && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden text-[#0B1F3A]"
            >
              {/* Modal Header */}
              <div
                className={`p-5 text-white flex items-center justify-between ${
                  inspectModal.actionType === 'VERIFY'
                    ? 'bg-gradient-to-r from-[#0F3822] to-[#166534]'
                    : 'bg-rose-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 text-[#F5D061] flex items-center justify-center">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold">
                      {inspectModal.actionType === 'VERIFY'
                        ? 'Verify Physical Currency & Deposit to Safe Vault'
                        : 'Reject Cash Settlement for Recount'}
                    </h3>
                    <p className="text-xs text-white/80">
                      Settlement Ref: {inspectModal.record.id} • {inspectModal.record.agentName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectModal({ isOpen: false, record: null, bmRemarks: '', safeLocker: '', actionType: 'VERIFY' })}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Physical Denominations Review Grid */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Currency Notes Handed Over by CRO
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-emerald-800 block">₹500 Notes</span>
                      <strong className="text-base font-black text-slate-900 block font-mono">
                        {inspectModal.record.denominations.notes500 || 0}
                      </strong>
                      <span className="text-[9.5px] text-slate-500 block">
                        = ₹{((inspectModal.record.denominations.notes500 || 0) * 500).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-orange-800 block">₹200 Notes</span>
                      <strong className="text-base font-black text-slate-900 block font-mono">
                        {inspectModal.record.denominations.notes200 || 0}
                      </strong>
                      <span className="text-[9.5px] text-slate-500 block">
                        = ₹{((inspectModal.record.denominations.notes200 || 0) * 200).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-indigo-800 block">₹100 Notes</span>
                      <strong className="text-base font-black text-slate-900 block font-mono">
                        {inspectModal.record.denominations.notes100 || 0}
                      </strong>
                      <span className="text-[9.5px] text-slate-500 block">
                        = ₹{((inspectModal.record.denominations.notes100 || 0) * 100).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-teal-800 block">₹50 Notes</span>
                      <strong className="text-base font-black text-slate-900 block font-mono">
                        {inspectModal.record.denominations.notes50 || 0}
                      </strong>
                      <span className="text-[9.5px] text-slate-500 block">
                        = ₹{((inspectModal.record.denominations.notes50 || 0) * 50).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Cash and Variance Summary */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 font-bold block">Total Physical Cash Handover:</span>
                    <strong className="text-base font-extrabold text-[#0B1F3A] font-mono">
                      ₹{inspectModal.record.physicalCashTotal.toLocaleString('en-IN')}
                    </strong>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 font-bold block">Reconciliation Status:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px]">
                      <CheckCircle2 size={12} />
                      {inspectModal.record.variance === 0 ? 'Exact Match (Balanced)' : `Variance: ₹${inspectModal.record.variance}`}
                    </span>
                  </div>
                </div>

                {/* CRO Comments */}
                <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
                  <span className="font-bold text-slate-500 block mb-0.5">CRO Submitted Remarks:</span>
                  <p className="italic">"{inspectModal.record.croRemarks}"</p>
                </div>

                {/* Safe Locker Vault Selection (For Verification) */}
                {inspectModal.actionType === 'VERIFY' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Target Branch Safe Vault Locker Reference
                    </label>
                    <input
                      type="text"
                      value={inspectModal.safeLocker}
                      onChange={(e) => setInspectModal((prev) => ({ ...prev, safeLocker: e.target.value }))}
                      placeholder="e.g. Main Safe Vault Locker #01"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                )}

                {/* Manager Verification Remarks */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    {inspectModal.actionType === 'VERIFY'
                      ? 'Branch Manager Physical Inspection Remarks'
                      : 'Reason for Rejection / Recount Notes'}
                  </label>
                  <textarea
                    rows={2}
                    value={inspectModal.bmRemarks}
                    onChange={(e) => setInspectModal((prev) => ({ ...prev, bmRemarks: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 resize-none font-medium"
                    required
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setInspectModal({ isOpen: false, record: null, bmRemarks: '', safeLocker: '', actionType: 'VERIFY' })}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmBMAction}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                    inspectModal.actionType === 'VERIFY'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {inspectModal.actionType === 'VERIFY' ? (
                    <>
                      <ShieldCheck size={15} />
                      <span>Verify &amp; Accept to Safe Vault</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={15} />
                      <span>Confirm Rejection</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 6. OFFICIAL PDF PREVIEW MODAL ── */}
      <AnimatePresence>
        {pdfPreview.isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
            onMouseDown={() => setPdfPreview({ isOpen: false, url: null, title: '' })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onMouseDown={(e) => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-3xl w-[min(96vw,840px)] h-[88vh] flex flex-col overflow-hidden shadow-2xl relative"
            >
              <div className="bg-[#FAF9F6] px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <FileText size={17} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0B1F3A]">{pdfPreview.title}</h4>
                    <span className="text-[11px] text-slate-500">Official EOD Safe Handover Document</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {pdfPreview.url && (
                    <a
                      href={pdfPreview.url}
                      download="EOD_Settlement.pdf"
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setPdfPreview({ isOpen: false, url: null, title: '' })}
                    className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-100">
                {pdfPreview.url ? (
                  <iframe src={pdfPreview.url} className="w-full h-full border-0" title="PDF Document" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                    Generating official document preview...
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EODSettlementPanel;
