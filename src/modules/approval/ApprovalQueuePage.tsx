// ──────────────────────────────────────────────────
// Golden Leaf Finance — Branch Manager Loan Approval Panel
// PDF-Strict • Data-Driven • Branch-Isolated • Workflow-Gated
// Data Source: creditManagerService (CreditApplicant[])
// Workflow: Credit Manager (Stages 1–5) → Branch Manager Approval (Stage 6) → Loan Disbursement
// ──────────────────────────────────────────────────

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Eye, Search, RotateCcw, Clock,
  ShieldCheck, User, FileText, X, Building, ArrowRight,
  CheckSquare, FileCheck, AlertTriangle, ChevronDown, Check,
  Layers, MapPin
} from 'lucide-react';
import { useUIStore, useAuthStore } from '../../store';
import { creditManagerService, normalizeBranchId, type CreditApplicant } from '../../services/creditManagerService';
import { getStoredBranches, type DetailedBranch } from '../../services/branchService';
import { SanctionLetterModal } from '../loan/components/SanctionLetterModal';
import { type SanctionLetterRecord } from '../../types/sanctionLetter.types';

// ─── Audit Log Helper ───
const AUDIT_STORAGE_KEY = 'glf_bm_approval_audit_log';

interface BMAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: 'approve' | 'reject';
  entity: string;
  entityId: string;
  details: string;
  branch: string;
  changes: { field: string; oldVal: string; newVal: string }[];
}

function addBMAuditEntry(entry: Omit<BMAuditEntry, 'id' | 'timestamp'>): void {
  try {
    const existing = JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY) || '[]');
    const newEntry: BMAuditEntry = {
      ...entry,
      id: `BM-AL-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      }),
    };
    existing.unshift(newEntry);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(existing.slice(0, 200)));
  } catch (e) {
    console.warn('Failed to write BM audit entry:', e);
  }
}

// ─── Status Badge Component ───
const StatusBadge: React.FC<{ status: CreditApplicant['branchManagerApprovalStatus'] }> = ({ status }) => {
  const config = {
    Pending: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500', label: 'Pending BM Approval' },
    Approved: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'BM Approved' },
    Rejected: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', dot: 'bg-red-500', label: 'BM Rejected' },
    'Not Reached': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', dot: 'bg-gray-400', label: 'Not Reached' },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${config.bg} ${config.border} ${config.text} border`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

// ─── Verification Pill Component ───
const VerificationPill: React.FC<{ label: string; status: string }> = ({ label, status }) => {
  const isVerified = status === 'Verified' || status === 'verified';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
      isVerified
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-amber-50 text-amber-700 border border-amber-200'
    }`}>
      {isVerified ? <CheckCircle2 size={10} /> : <Clock size={10} />}
      {label}
    </span>
  );
};

// ─── Main Component ───
export const ApprovalQueuePage: React.FC = () => {
  const { addToast, selectedBranchId, setSelectedBranchId } = useUIStore();
  const currentUser = useAuthStore((s) => s.user);
  const userBranchClaim = currentUser?.customClaims?.branchId;

  // Load all system branches from branchService
  const branches = useMemo(() => getStoredBranches(), []);

  // Determine initial branch selection
  const defaultBranchId = useMemo(() => {
    if (selectedBranchId) return selectedBranchId;
    if (userBranchClaim) return normalizeBranchId(userBranchClaim);
    return 'BR-01';
  }, [selectedBranchId, userBranchClaim]);

  // Active selected branch state
  const [activeBranchId, setActiveBranchId] = useState<string>(defaultBranchId);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [focusedBranchIndex, setFocusedBranchIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const branchOptionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Active branch object
  const activeBranch = useMemo(() => {
    if (activeBranchId === 'all') return null;
    return branches.find(
      (b) =>
        normalizeBranchId(b.id) === normalizeBranchId(activeBranchId) ||
        normalizeBranchId(b.code) === normalizeBranchId(activeBranchId)
    );
  }, [branches, activeBranchId]);

  // Handle switching branch
  const handleBranchSelect = (branchId: string) => {
    setActiveBranchId(branchId);
    setSelectedBranchId(branchId);
    setIsBranchDropdownOpen(false);

    if (branchId === 'all') {
      addToast({
        type: 'info',
        title: 'All Branches View',
        message: 'Viewing loan applications across all operating branches.',
      });
    } else {
      const b = branches.find((item) => normalizeBranchId(item.id) === normalizeBranchId(branchId));
      addToast({
        type: 'info',
        title: 'Branch Switched',
        message: `Active branch switched to ${b ? b.name : branchId}`,
      });
    }
  };

  // Force re-render after mutations
  const [refreshKey, setRefreshKey] = useState(0);

  // Tab state
  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Rejected' | 'All'>('Pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Action Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    app: CreditApplicant | null;
    action: 'Approved' | 'Rejected';
  }>({ isOpen: false, app: null, action: 'Approved' });
  const [remarksInput, setRemarksInput] = useState('');

  // View Details Modal
  const [viewDetailsApp, setViewDetailsApp] = useState<CreditApplicant | null>(null);

  // Sanction Letter Modal State
  const [sanctionModalApp, setSanctionModalApp] = useState<CreditApplicant | null>(null);

  const getSanctionLetterData = useCallback((app: CreditApplicant): Partial<SanctionLetterRecord> => {
    const loanAmt = app.recommendedAmount || app.loanAmount || 100000;
    const docCharges = Math.round(loanAmt * 0.02);
    const gst = Math.round(docCharges * 0.18);
    const lifeIns = Math.round(loanAmt * 0.008);
    const genIns = 300;
    const totalDeductions = docCharges + gst + lifeIns + genIns;
    const net = loanAmt - totalDeductions;
    const branchObj = branches.find((b) => normalizeBranchId(b.id) === normalizeBranchId(app.branchId));

    return {
      loanAccountNo: app.sanctionLetterNo || `GLF-SAN-${app.id.replace(/[^0-9]/g, '').padStart(4, '0')}`,
      applicationFormNo: app.id,
      applicationDate: app.appliedDate || '30/07/2025',
      sanctionDate: app.approvedAt ? app.approvedAt.slice(0, 10) : new Date().toLocaleDateString('en-IN'),
      place: branchObj ? `${branchObj.city.toUpperCase()} GLFL` : 'CHENNAI GLFL',
      branchName: branchObj ? branchObj.name : 'Main Branch',
      branchCode: app.branchId,
      applicantName: app.customerName,
      applicantPhone: app.phone,
      applicantAddress: app.address,
      applicantPan: app.panNumber || 'ABCDE1234F',
      applicantAadhaarMasked: app.aadhaarNumber,
      coApplicant1Name: app.fatherOrSpouseName || 'Co-Applicant',
      coApplicant1Relation: 'Spouse / Co-Borrower',
      coApplicant2Name: app.nomineeName || 'None',
      coApplicant2Relation: app.nomineeRelation || 'Nominee',
      loanProduct: app.loanProduct || 'Vyapaar Vriddhi Loan / Business Loan',
      loanPurpose: app.loanPurpose || 'RETAIL TRADE & WORKING CAPITAL',
      fixedRoi: 24.5,
      loanAmount: loanAmt,
      tenureMonths: 24,
      numberOfEmis: 24,
      tentativeEmiAmount: app.proposedEmi || Math.round(loanAmt / 20),
      documentationCharges: docCharges,
      gstOnCharges: gst,
      lifeInsurancePremium: lifeIns,
      generalInsurancePremium: genIns,
      stampDutyCharges: 0,
      totalChargesDeducted: totalDeductions,
      existingLoanForeclosureAmount: 0,
      netDisbursementAmount: net,
      repaymentMode: 'NACH (National Automated Clearing House)',
      repaymentFrequency: 'Monthly',
      emiDueDate: 3,
      moratorium: 'NO (Not Applicable)',
      penalChargesText: '2% per month of the unpaid EMI or Rs. 300 whichever is higher',
      chequeBounceChargesText: '7.5% of the EMI outstanding + GST (minimum Rs. 400 + GST; maximum Rs. 1000 + GST)',
      swapChargesText: 'INR 500/- + GST as applicable',
      foreclosureChargesText: '4% of the principal outstanding amount + GST. For Micro & small tagged applications – Nil charge',
      foreclosureLockInDays: 180,
      partPaymentChargesText: '4% of Principal Loan Outstanding + GST as applicable',
      authorisedOfficerName: app.approvedBy?.split(' (')[0] || 'Authorised Branch Officer',
      authorisedOfficerEmpId: 'GLF-OFFICER',
      isElectronicallySigned: true,
      eSignTimestamp: `${app.appliedDate || new Date().toLocaleDateString('en-GB')} 04:30 PM`,
      eSignOtpReference: `OTP-${app.customerId?.replace(/[^0-9]/g, '').slice(0, 6) || 'SECURE'}`,
      eSignSignerName: app.customerName,
    };
  }, [branches]);

  // ─── Data from real service (Branch-Aware) ───
  const allBMQueue = useMemo(() => {
    return creditManagerService.getBranchManagerQueue(activeBranchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranchId, refreshKey]);

  const pendingApps = useMemo(() => {
    return creditManagerService.getApplicationsForBranchManagerApproval(activeBranchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranchId, refreshKey]);

  const approvedApps = useMemo(() => allBMQueue.filter(a => a.branchManagerApprovalStatus === 'Approved'), [allBMQueue]);
  const rejectedApps = useMemo(() => allBMQueue.filter(a => a.branchManagerApprovalStatus === 'Rejected'), [allBMQueue]);

  const counts = {
    Pending: pendingApps.length,
    Approved: approvedApps.length,
    Rejected: rejectedApps.length,
    All: allBMQueue.length,
  };

  // Branch pending counts for dropdown badges
  const branchPendingMap = useMemo(() => {
    const pendingList = creditManagerService.getApplicationsForBranchManagerApproval('all');
    const map: Record<string, number> = { all: pendingList.length };
    branches.forEach((b) => {
      map[b.id] = pendingList.filter((a) => normalizeBranchId(a.branchId) === normalizeBranchId(b.id)).length;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches, refreshKey]);

  // Combined options list for keyboard navigation
  const dropdownOptions = useMemo(() => [
    {
      id: 'all',
      name: 'All Operating Branches',
      subtitle: 'Cross-Branch Queue View',
      count: branchPendingMap['all'] ?? 0,
    },
    ...branches.map((b) => ({
      id: b.id,
      name: b.name,
      subtitle: `${b.id} • ${b.code} • ${b.city}`,
      count: branchPendingMap[b.id] ?? 0,
    })),
  ], [branches, branchPendingMap]);

  // Scroll helper that only adjusts dropdown list container without scrolling page/window
  const scrollToOption = (idx: number) => {
    const container = listboxRef.current;
    const item = branchOptionRefs.current[idx];
    if (!container || !item) return;

    const itemRect = item.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    if (itemRect.top < containerRect.top) {
      container.scrollTop -= (containerRect.top - itemRect.top);
    } else if (itemRect.bottom > containerRect.bottom) {
      container.scrollTop += (itemRect.bottom - containerRect.bottom);
    }
  };

  // Auto-focus selected item when dropdown opens
  useEffect(() => {
    if (isBranchDropdownOpen) {
      const activeIdx = dropdownOptions.findIndex((opt) =>
        opt.id === 'all'
          ? activeBranchId === 'all'
          : normalizeBranchId(activeBranchId) === normalizeBranchId(opt.id)
      );
      const targetIdx = activeIdx >= 0 ? activeIdx : 0;
      setFocusedBranchIndex(targetIdx);
      setTimeout(() => {
        scrollToOption(targetIdx);
      }, 50);
    }
  }, [isBranchDropdownOpen, activeBranchId, dropdownOptions]);

  // Keyboard navigation handler for branch switcher
  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (!isBranchDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsBranchDropdownOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedBranchIndex((prev) => {
        const next = (prev + 1) % dropdownOptions.length;
        scrollToOption(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedBranchIndex((prev) => {
        const next = (prev - 1 + dropdownOptions.length) % dropdownOptions.length;
        scrollToOption(next);
        return next;
      });
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusedBranchIndex(0);
      scrollToOption(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = dropdownOptions.length - 1;
      setFocusedBranchIndex(last);
      scrollToOption(last);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focusedBranchIndex >= 0 && focusedBranchIndex < dropdownOptions.length) {
        handleBranchSelect(dropdownOptions[focusedBranchIndex].id);
        triggerButtonRef.current?.focus();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsBranchDropdownOpen(false);
      triggerButtonRef.current?.focus();
    } else if (e.key === 'Tab') {
      setIsBranchDropdownOpen(false);
    }
  };

  // ─── Active list based on tab ───
  const activeList = useMemo(() => {
    const list = activeTab === 'Pending' ? pendingApps
      : activeTab === 'Approved' ? approvedApps
      : activeTab === 'Rejected' ? rejectedApps
      : allBMQueue;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(app =>
      app.customerName.toLowerCase().includes(q) ||
      app.customerId.toLowerCase().includes(q) ||
      app.id.toLowerCase().includes(q) ||
      app.phone.includes(q)
    );
  }, [activeTab, pendingApps, approvedApps, rejectedApps, allBMQueue, searchQuery]);

  // ─── Action Handlers ───
  const handleOpenActionModal = useCallback((app: CreditApplicant, action: 'Approved' | 'Rejected') => {
    setModalState({ isOpen: true, app, action });
    setRemarksInput('');
  }, []);

  const handleExecuteAction = useCallback(() => {
    if (!modalState.app) return;
    const { action, app } = modalState;
    const remarks = remarksInput.trim();

    // Validation: reject requires remarks
    if (action === 'Rejected' && !remarks) {
      addToast({ type: 'warning', title: 'Remarks Required', message: 'Please enter a rejection reason before proceeding.' });
      return;
    }

    const managerName = currentUser?.displayName || 'Branch Manager';
    const branchId = app.branchId || activeBranchId || 'BR-01';
    const finalRemarks = remarks || `${action} by ${managerName}`;

    // Execute via service
    if (action === 'Approved') {
      creditManagerService.branchManagerApprove(app.id, finalRemarks, managerName, branchId);
    } else {
      creditManagerService.branchManagerReject(app.id, finalRemarks, managerName, branchId);
    }

    // Audit log entry
    addBMAuditEntry({
      actor: managerName,
      role: 'Branch Manager',
      action: action === 'Approved' ? 'approve' : 'reject',
      entity: 'Loan Application',
      entityId: app.id,
      details: `${action} loan application for ${app.customerName} (${app.customerId}) — ₹${app.loanAmount.toLocaleString('en-IN')} ${app.loanProduct}. Remarks: ${finalRemarks}`,
      branch: app.centerName,
      changes: [{
        field: 'branchManagerApprovalStatus',
        oldVal: 'Pending',
        newVal: action,
      }],
    });

    // Toast notification
    addToast({
      type: action === 'Approved' ? 'success' : 'error',
      title: `Loan Application ${action}`,
      message: action === 'Approved'
        ? `${app.customerName}'s loan of ₹${app.loanAmount.toLocaleString('en-IN')} has been approved. Application is now ready for Loan Disbursement.`
        : `${app.customerName}'s loan application has been rejected. Reason: ${finalRemarks}`,
    });

    // Reset state & trigger re-render
    setModalState({ isOpen: false, app: null, action: 'Approved' });
    setRefreshKey(k => k + 1);
  }, [modalState, remarksInput, currentUser, activeBranchId, addToast]);

  // ─── Tab config ───
  const tabConfig = [
    { key: 'Pending' as const, icon: Clock, label: 'Pending Approval' },
    { key: 'Approved' as const, icon: CheckCircle2, label: 'Approved' },
    { key: 'Rejected' as const, icon: XCircle, label: 'Rejected' },
    { key: 'All' as const, icon: FileText, label: 'All Applications' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 sm:p-5 lg:p-6 space-y-5 font-body pb-16 max-w-full">
      {/* ═══ Header Card (overflow-visible to prevent clipping floating dropdown) ═══ */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_10px_rgba(11,31,58,0.04)] relative z-30">
        <div className="bg-[#0B1F3A] rounded-t-2xl px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-30">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-[#D4AF37] rounded-full" />
              <h1 className="text-sm sm:text-base font-bold !text-white text-white tracking-wide uppercase font-body">
                Branch Manager • Loan Approval Queue
              </h1>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 pl-4">
              Review and approve loan applications verified by Credit Manager
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-bold px-3 py-2 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/20">
              {counts.Pending} Pending Action
            </span>

            {/* ═══ Executive Branch Selector Dropdown (Replaces static Branch: b1) ═══ */}
            <div className="relative" ref={dropdownRef} onKeyDown={handleDropdownKeyDown}>
              <button
                ref={triggerButtonRef}
                type="button"
                onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                className="text-[11px] font-mono px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 hover:text-white border border-white/15 hover:border-[#D4AF37]/50 flex items-center gap-2 transition-all cursor-pointer shadow-sm group min-h-[38px] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                aria-haspopup="listbox"
                aria-expanded={isBranchDropdownOpen}
                aria-label="Select Operating Branch"
                title="Click or press Arrow Down to switch operating branch"
              >
                <Building size={13} className="text-[#D4AF37] transition-transform shrink-0" />
                <span className="font-semibold tracking-wide">
                  {activeBranchId === 'all'
                    ? 'Branch: All Branches'
                    : activeBranch
                    ? `Branch: ${activeBranch.name.split(' - ')[0]} (${activeBranch.id})`
                    : `Branch: ${activeBranchId}`}
                </span>
                <ChevronDown
                  size={13}
                  className={`text-gray-400 group-hover:text-[#D4AF37] transition-transform duration-200 shrink-0 ${
                    isBranchDropdownOpen ? 'rotate-180 text-[#D4AF37]' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isBranchDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-2 w-[min(92vw,360px)] bg-white rounded-2xl shadow-[0_20px_60px_rgba(11,31,58,0.35)] border border-[#E2E8F0] z-[100] p-2 ring-1 ring-black/5"
                  >
                    {/* Dropdown Header */}
                    <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Building size={14} className="text-[#D4AF37]" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 font-mono">
                          Select Operating Branch
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#0B1F3A] bg-blue-50 px-2.5 py-0.5 rounded-full font-mono border border-blue-100">
                        {branches.length} Branches
                      </span>
                    </div>

                    {/* Keyboard navigation hint */}
                    <div className="px-3.5 py-1 text-[10px] text-gray-400 flex items-center justify-between border-b border-slate-50 mb-1 font-mono">
                      <span>↑ / ↓ Navigate</span>
                      <span>↵ Select</span>
                      <span>Esc Close</span>
                    </div>

                    {/* Branch Options List */}
                    <div
                      ref={listboxRef}
                      role="listbox"
                      tabIndex={-1}
                      aria-label="Authorized Operating Branches"
                      className="max-h-72 overflow-y-auto p-0.5 space-y-1 custom-scrollbar focus:outline-none"
                    >
                      {dropdownOptions.map((opt, idx) => {
                        const isSelected =
                          opt.id === 'all'
                            ? activeBranchId === 'all'
                            : normalizeBranchId(activeBranchId) === normalizeBranchId(opt.id);
                        const isFocused = idx === focusedBranchIndex;

                        return (
                          <button
                            key={opt.id}
                            ref={(el) => { branchOptionRefs.current[idx] = el; }}
                            role="option"
                            aria-selected={isSelected}
                            type="button"
                            onMouseEnter={() => setFocusedBranchIndex(idx)}
                            onClick={() => {
                              handleBranchSelect(opt.id);
                              triggerButtonRef.current?.focus();
                            }}
                            className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs flex items-center justify-between transition-all cursor-pointer outline-none ${
                              isFocused
                                ? isSelected
                                  ? 'bg-amber-100 text-[#0B1F3A] font-bold border border-amber-300 ring-2 ring-[#D4AF37] shadow-xs'
                                  : 'bg-slate-100 text-[#0B1F3A] ring-2 ring-[#D4AF37]/70 font-semibold'
                                : isSelected
                                ? 'bg-amber-50/90 text-[#0B1F3A] font-bold border border-amber-200/80 shadow-xs'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className={`text-xs ${isSelected ? 'font-bold text-[#0B1F3A]' : 'font-semibold text-slate-800'}`}>
                                {opt.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {opt.subtitle}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold border ${
                                opt.count > 0
                                  ? 'bg-amber-100/70 text-amber-800 border-amber-200'
                                  : 'bg-gray-100 text-gray-500 border-gray-200'
                              }`}>
                                {opt.count} Pending
                              </span>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-[#D4AF37] flex items-center justify-center text-white shrink-0 shadow-xs">
                                  <Check size={12} strokeWidth={2.5} />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Tab Navigation (with rounded-b-2xl for smooth corners) */}
        <div className="p-3 sm:p-4 bg-[#FAFBFD] rounded-b-2xl border-b border-gray-200 flex flex-wrap items-center gap-2 relative z-10">
          {tabConfig.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 min-h-[44px] ${
                activeTab === key
                  ? 'bg-[#0B1F3A] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-[#D4AF37]/40'
              }`}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{key}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === key ? 'bg-[#D4AF37] text-[#0B1F3A]' : 'bg-gray-100 text-gray-700'
              }`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Search Bar ═══ */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, ID, or application #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 min-h-[44px] rounded-xl bg-gray-50 border border-gray-200 text-xs text-[#0B1F3A] focus:outline-none focus:border-[#D4AF37] focus:bg-white transition-all"
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="p-2.5 min-h-[44px] min-w-[44px] rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-500 flex items-center justify-center cursor-pointer"
            title="Clear Search"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {/* ═══ Application Cards ═══ */}
      <div className="space-y-4">
        {activeList.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
            <CheckSquare size={36} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-sm font-bold text-gray-700">
              {searchQuery
                ? 'No applications match your search'
                : activeTab === 'Pending'
                ? 'No applications pending your approval'
                : `No ${activeTab.toLowerCase()} applications`}
            </h3>
            <p className="text-xs text-gray-400 mt-1.5">
              {activeTab === 'Pending'
                ? 'Applications will appear here once Credit Manager completes all verification stages.'
                : 'Try switching branches or tabs, or clearing your search.'}
            </p>
          </div>
        ) : (
          activeList.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-[#D4AF37]/40 transition-all overflow-hidden"
            >
              {/* Card Header */}
              <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-gray-100">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-[#0B1F3A] font-body">{app.customerName}</h3>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200">
                      {app.id}
                    </span>
                    <StatusBadge status={app.branchManagerApprovalStatus} />
                    {/* Branch Badge on Card */}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1 font-semibold">
                      <Building size={10} />
                      {branches.find(b => normalizeBranchId(b.id) === normalizeBranchId(app.branchId))?.name.split(' - ')[0] || app.branchId}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    <span className="font-semibold text-gray-600">{app.customerId}</span>
                    <span className="mx-1.5">•</span>
                    {app.groupName}
                    <span className="mx-1.5">•</span>
                    Applied: {app.appliedDate}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setViewDetailsApp(app)}
                    className="px-3 py-2 min-h-[44px] rounded-xl bg-gray-100 hover:bg-gray-200 text-[#0B1F3A] font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    <Eye size={13} /> Details
                  </button>

                  <button
                    type="button"
                    onClick={() => setSanctionModalApp(app)}
                    className="px-3 py-2 min-h-[44px] rounded-xl bg-amber-50 hover:bg-amber-100/80 text-[#0B1F3A] border border-amber-200 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider"
                    title="Generate & View Official Sanction Letter (English & தமிழ்)"
                  >
                    <FileText size={13} className="text-[#D4AF37]" />
                    <span>Sanction Letter</span>
                  </button>

                  {app.branchManagerApprovalStatus === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleOpenActionModal(app, 'Approved')}
                        className="px-4 py-2 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={13} /> Approve
                      </button>
                      <button
                        onClick={() => handleOpenActionModal(app, 'Rejected')}
                        className="px-3.5 py-2 min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Card Body: Key Metrics */}
              <div className="px-4 sm:px-5 py-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold mb-0.5">Loan Product</span>
                    <strong className="text-[#0B1F3A] block truncate" title={app.loanProduct}>{app.loanProduct}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold mb-0.5">Sanction Amount</span>
                    <strong className="text-emerald-700 text-sm">₹{(app.recommendedAmount || app.loanAmount).toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold mb-0.5">Tenor & EMI</span>
                    <strong className="text-[#0B1F3A]">{app.recommendedTenor || app.tenorWeeks} wks • ₹{app.proposedEmi.toLocaleString('en-IN')}/wk</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold mb-0.5">Verifications</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      <VerificationPill label="KYC" status={app.kycStatus} />
                      <VerificationPill label="Docs" status={app.documentStatus} />
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold mb-0.5">CM Recommendation</span>
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <ShieldCheck size={12} /> Recommended by {app.recommendedBy || 'Credit Manager'}
                    </span>
                  </div>
                </div>
              </div>

              {/* CM Recommendation Notes (if available) */}
              {app.recommendationNotes && (
                <div className="px-4 sm:px-5 pb-4">
                  <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
                    <span className="text-blue-500 font-bold uppercase text-[10px] block mb-0.5">Credit Manager Notes</span>
                    <span className="text-blue-900">{app.recommendationNotes}</span>
                  </div>
                </div>
              )}

              {/* BM Decision (if already acted) */}
              {app.branchManagerApprovalStatus !== 'Pending' && app.branchManagerApprovalStatus !== 'Not Reached' && app.branchManagerRemarks && (
                <div className="px-4 sm:px-5 pb-4">
                  <div className={`p-2.5 rounded-xl border text-xs ${
                    app.branchManagerApprovalStatus === 'Approved'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <span className={`font-bold uppercase text-[10px] block mb-0.5 ${
                      app.branchManagerApprovalStatus === 'Approved' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      Branch Manager Decision ({app.branchManagerApprovedBy} — {app.branchManagerApprovedAt})
                    </span>
                    <span className={app.branchManagerApprovalStatus === 'Approved' ? 'text-emerald-900' : 'text-red-900'}>
                      {app.branchManagerRemarks}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* ═══ Action Confirmation Modal ═══ */}
      <AnimatePresence>
        {modalState.isOpen && modalState.app && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm font-body">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-[min(94vw,520px)] max-h-[90dvh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className={`px-5 sm:px-6 py-4 flex items-center justify-between border-b flex-shrink-0 ${
                modalState.action === 'Approved'
                  ? 'bg-emerald-700 border-emerald-600'
                  : 'bg-red-700 border-red-600'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-4 bg-white/30 rounded-full" />
                  <h3 className="text-sm font-bold !text-white text-white tracking-wide uppercase font-body truncate">
                    {modalState.action === 'Approved' ? 'Approve' : 'Reject'} Loan Application
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalState({ isOpen: false, app: null, action: 'Approved' })}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/70 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
                {/* Warning for rejection */}
                {modalState.action === 'Rejected' && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <span>This action will reject the loan application. The applicant will not proceed to disbursement. This action cannot be undone.</span>
                  </div>
                )}

                {/* Application Summary */}
                <div className="p-3.5 rounded-xl bg-[#FAFBFD] border border-gray-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Application:</span>
                    <strong className="text-[#0B1F3A] font-mono">{modalState.app.id}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer:</span>
                    <strong className="text-[#0B1F3A]">{modalState.app.customerName} ({modalState.app.customerId})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Loan Product:</span>
                    <strong className="text-[#0B1F3A]">{modalState.app.loanProduct}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sanction Amount:</span>
                    <strong className="text-emerald-700">₹{(modalState.app.recommendedAmount || modalState.app.loanAmount).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tenor:</span>
                    <strong className="text-[#0B1F3A]">{modalState.app.recommendedTenor || modalState.app.tenorWeeks} weeks</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Recommended By:</span>
                    <strong className="text-blue-700">{modalState.app.recommendedBy || 'Credit Manager'}</strong>
                  </div>
                </div>

                {/* Workflow indicator */}
                {modalState.action === 'Approved' && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <ArrowRight size={14} />
                    <span>On approval, this application moves to <strong>Loan Disbursement</strong> stage. Funds will NOT be auto-disbursed.</span>
                  </div>
                )}

                {/* Remarks */}
                <div>
                  <label className="text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wider block mb-1.5">
                    Branch Manager Remarks {modalState.action === 'Rejected' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    rows={3}
                    value={remarksInput}
                    onChange={(e) => setRemarksInput(e.target.value)}
                    placeholder={
                      modalState.action === 'Approved'
                        ? 'Enter approval endorsement (e.g., Verified and sanctioned for disbursement)...'
                        : 'Enter rejection rationale (mandatory)...'
                    }
                    className="w-full p-3 rounded-xl bg-white border border-gray-200 text-xs text-[#0B1F3A] focus:outline-none focus:border-[#D4AF37] resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalState({ isOpen: false, app: null, action: 'Approved' })}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold uppercase min-h-[44px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteAction}
                    className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs uppercase shadow cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 ${
                      modalState.action === 'Approved'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {modalState.action === 'Approved' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    Confirm {modalState.action === 'Approved' ? 'Approval' : 'Rejection'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ Full Details Modal ═══ */}
      <AnimatePresence>
        {viewDetailsApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm font-body">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-[min(94vw,620px)] max-h-[90dvh] flex flex-col overflow-hidden"
            >
              {/* Details Header */}
              <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex items-center justify-between text-white border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full shrink-0" />
                  <h3 className="text-sm font-bold !text-white text-white tracking-wide uppercase font-body truncate">
                    Application Dossier • {viewDetailsApp.id}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewDetailsApp(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-300 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto custom-scrollbar flex-1">
                {/* Customer Profile */}
                <div>
                  <h4 className="text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User size={12} /> Customer Profile
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 bg-[#FAFBFD] p-3.5 rounded-xl border border-gray-200">
                    <div><span className="text-gray-400 block text-[10px] uppercase">Name</span><strong>{viewDetailsApp.customerName}</strong></div>
                    <div><span className="text-gray-400 block text-[10px] uppercase">Customer ID</span><strong className="font-mono">{viewDetailsApp.customerId}</strong></div>
                    <div><span className="text-gray-400 block text-[10px] uppercase">Operating Branch</span><strong className="text-blue-900">{branches.find(b => normalizeBranchId(b.id) === normalizeBranchId(viewDetailsApp.branchId))?.name || viewDetailsApp.branchId}</strong></div>
                    <div><span className="text-gray-400 block text-[10px] uppercase">Center Name</span><strong>{viewDetailsApp.centerName}</strong></div>
                    <div><span className="text-gray-400 block text-[10px] uppercase">Father/Spouse</span><strong>{viewDetailsApp.fatherOrSpouseName}</strong></div>
                    <div><span className="text-gray-400 block text-[10px] uppercase">Phone</span><strong>{viewDetailsApp.phone}</strong></div>
                    <div><span className="text-gray-400 block text-[10px] uppercase">Occupation</span><strong>{viewDetailsApp.occupation}</strong></div>
                    <div><span className="text-gray-400 block text-[10px] uppercase">Group</span><strong>{viewDetailsApp.groupName}</strong></div>
                    <div className="col-span-2"><span className="text-gray-400 block text-[10px] uppercase">Address</span><strong>{viewDetailsApp.address}, {viewDetailsApp.city}</strong></div>
                  </div>
                </div>

                {/* Loan Details */}
                <div>
                  <h4 className="text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText size={12} /> Loan Details
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 bg-[#FAFBFD] p-3.5 rounded-xl border border-gray-200">
                    <div><span className="text-gray-400 block text-[10px] uppercase">Loan Product</span><strong>{viewDetailsApp.loanProduct}</strong></div>
                    <div><span className="text-gray-400 block text-[10px] uppercase">Applied Amount</span><strong className="text-emerald-700">₹{viewDetailsApp.loanAmount.toLocaleString('en-IN')}</strong></div>
                    <div><span className="text-gray-400 block text-[10px] uppercase">Recommended Amount</span><strong className="text-emerald-700">₹{(viewDetailsApp.recommendedAmount || viewDetailsApp.loanAmount).toLocaleString('en-IN')}</strong></div>
                    <div><span className="text-gray-400 block text-[10px] uppercase">Tenor</span><strong>{viewDetailsApp.recommendedTenor || viewDetailsApp.tenorWeeks} weeks</strong></div>
                    <div><span className="text-gray-400 block text-[10px] uppercase">Weekly EMI</span><strong>₹{viewDetailsApp.proposedEmi.toLocaleString('en-IN')}</strong></div>
                    <div><span className="text-gray-400 block text-[10px] uppercase">Applied Date</span><strong>{viewDetailsApp.appliedDate}</strong></div>
                  </div>
                </div>

                {/* Verification Status */}
                <div>
                  <h4 className="text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShieldCheck size={12} /> Verification Status
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Customer Verification */}
                    <div className={`p-3 rounded-xl border ${viewDetailsApp.customerVerificationStatus === 'Verified' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase text-gray-500">Customer Verification</span>
                        <VerificationPill label={viewDetailsApp.customerVerificationStatus} status={viewDetailsApp.customerVerificationStatus} />
                      </div>
                      {viewDetailsApp.customerVerifiedBy && (
                        <p className="text-[10px] text-gray-500">By: {viewDetailsApp.customerVerifiedBy}</p>
                      )}
                      {viewDetailsApp.customerVerificationRemarks && (
                        <p className="text-[11px] text-gray-700 mt-1">{viewDetailsApp.customerVerificationRemarks}</p>
                      )}
                    </div>

                    {/* KYC */}
                    <div className={`p-3 rounded-xl border ${viewDetailsApp.kycStatus === 'Verified' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase text-gray-500">KYC Verification</span>
                        <VerificationPill label={viewDetailsApp.kycStatus} status={viewDetailsApp.kycStatus} />
                      </div>
                      {viewDetailsApp.kycVerifiedBy && (
                        <p className="text-[10px] text-gray-500">By: {viewDetailsApp.kycVerifiedBy}</p>
                      )}
                    </div>

                    {/* Documents */}
                    <div className={`p-3 rounded-xl border ${viewDetailsApp.documentStatus === 'Verified' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase text-gray-500">Documents ({viewDetailsApp.documents.length})</span>
                        <VerificationPill label={viewDetailsApp.documentStatus} status={viewDetailsApp.documentStatus} />
                      </div>
                      <div className="space-y-1 mt-1">
                        {viewDetailsApp.documents.map(doc => (
                          <div key={doc.id} className="flex items-center gap-1.5 text-[10px]">
                            <FileCheck size={10} className={doc.status === 'verified' ? 'text-emerald-600' : 'text-amber-500'} />
                            <span className="text-gray-700">{doc.name}</span>
                            <span className={`font-semibold ml-auto ${doc.status === 'verified' ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CM Recommendation */}
                    <div className={`p-3 rounded-xl border ${viewDetailsApp.recommendationStatus === 'Approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase text-gray-500">CM Recommendation</span>
                        <VerificationPill label={viewDetailsApp.recommendationStatus} status={viewDetailsApp.recommendationStatus === 'Approved' ? 'Verified' : 'Pending'} />
                      </div>
                      {viewDetailsApp.recommendedBy && (
                        <p className="text-[10px] text-gray-500">By: {viewDetailsApp.recommendedBy} — {viewDetailsApp.recommendedAt}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* CM Notes */}
                {viewDetailsApp.recommendationNotes && (
                  <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200">
                    <span className="text-blue-600 font-bold uppercase text-[10px] block mb-0.5">Credit Manager Recommendation Notes</span>
                    <p className="text-blue-900 text-xs">{viewDetailsApp.recommendationNotes}</p>
                  </div>
                )}

                {/* BM Decision (if acted upon) */}
                {viewDetailsApp.branchManagerApprovalStatus !== 'Pending' && viewDetailsApp.branchManagerApprovalStatus !== 'Not Reached' && (
                  <div className={`p-3 rounded-xl border ${
                    viewDetailsApp.branchManagerApprovalStatus === 'Approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <span className={`font-bold uppercase text-[10px] block mb-0.5 ${
                      viewDetailsApp.branchManagerApprovalStatus === 'Approved' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      Branch Manager Decision
                    </span>
                    <p className="text-[10px] text-gray-500 mb-1">
                      {viewDetailsApp.branchManagerApprovedBy} — {viewDetailsApp.branchManagerApprovedAt}
                    </p>
                    <p className={`text-xs ${viewDetailsApp.branchManagerApprovalStatus === 'Approved' ? 'text-emerald-900' : 'text-red-900'}`}>
                      {viewDetailsApp.branchManagerRemarks || 'No remarks recorded.'}
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const target = viewDetailsApp;
                      setViewDetailsApp(null);
                      setSanctionModalApp(target);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider min-h-[44px] cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <FileText size={14} /> View Sanction Letter (EN / தமிழ்)
                  </button>
                  <button
                    onClick={() => setViewDetailsApp(null)}
                    className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] text-white font-bold text-xs uppercase tracking-wider min-h-[44px] cursor-pointer"
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ Sanction Letter & Terms Modal ═══ */}
      <SanctionLetterModal
        isOpen={!!sanctionModalApp}
        onClose={() => setSanctionModalApp(null)}
        loanData={sanctionModalApp ? getSanctionLetterData(sanctionModalApp) : undefined}
      />
    </motion.div>
  );
};

export default ApprovalQueuePage;
