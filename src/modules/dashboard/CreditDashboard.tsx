// ──────────────────────────────────────────────────
// Golden Leaf Finance — Credit Manager Dashboard Overview
// ULTRA-PREMIUM FINANCIAL SAAS OPERATIONAL DASHBOARD
// PDF Scope: 1. Customer Verification  2. KYC Verification
//            3. Document Verification  4. Loan Recommendation
//            5. Customer Approval
// Workflow: Customer Relationship Officer (CRO) → Credit Manager → Branch Manager → Loan Disbursement
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, ShieldCheck, FileCheck, TrendingUp, CheckCircle2,
  Clock, Search, ArrowRight, X, AlertCircle, Eye, Download,
  Building, Phone, MapPin, DollarSign, Calendar,
  FileText, Check, AlertTriangle, ChevronRight, UserCheck,
  RefreshCw, User, Image as ImageIcon, Sparkles, Filter, CheckCircle,
  ZoomIn, ZoomOut, RotateCw, ExternalLink
} from 'lucide-react';
import {
  creditManagerService,
  createPdfCompliantDocuments,
  type CreditApplicant,
  type VerificationDocument
} from '../../services/creditManagerService';
import { useUIStore, useAuthStore } from '../../store';
import { Avatar } from '../../components/ui/Avatar';

type FilterStage =
  | 'all'
  | 'customer_verification'
  | 'kyc_verification'
  | 'doc_verification'
  | 'loan_recommendation'
  | 'customer_approval';

export const CreditDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const currentUser = useAuthStore((s) => s.user);

  const [applicants, setApplicants] = useState<CreditApplicant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<FilterStage>('all');
  const [selectedApplicant, setSelectedApplicant] = useState<CreditApplicant | null>(null);
  const [detailsApplicant, setDetailsApplicant] = useState<CreditApplicant | null>(null);

  const selectedApplicantRef = useRef(selectedApplicant);
  selectedApplicantRef.current = selectedApplicant;
  const detailsApplicantRef = useRef(detailsApplicant);
  detailsApplicantRef.current = detailsApplicant;

  // In-drawer action states
  const [activeActionStage, setActiveActionStage] = useState<
    'view' | 'customer_verify' | 'kyc_verify' | 'loan_recommend' | 'customer_approve'
  >('view');
  const [actionRemarks, setActionRemarks] = useState('');
  const [recAmount, setRecAmount] = useState<number>(0);
  const [recTenor, setRecTenor] = useState<number>(25);

  const loadData = useCallback((silent = false) => {
    if (!silent) setIsLoading(true);
    setLoadError(null);
    try {
      const list = creditManagerService.getApplicants();
      setApplicants([...list]);
      if (selectedApplicantRef.current) {
        const updated = list.find((a) => a.id === selectedApplicantRef.current?.id);
        if (updated) setSelectedApplicant(updated);
      }
      if (detailsApplicantRef.current) {
        const updated = list.find((a) => a.id === detailsApplicantRef.current?.id);
        if (updated) setDetailsApplicant(updated);
      }
    } catch (err: any) {
      setLoadError(err?.message || 'Unable to load verification records');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = creditManagerService.subscribe(() => {
      loadData(true);
    });
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'glf_credit_manager_applicants_v5') {
        creditManagerService.reloadFromStorage();
        loadData(true);
      }
    };
    const handleCustomUpdate = () => {
      loadData(true);
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('glf_credit_manager_updated', handleCustomUpdate);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('glf_credit_manager_updated', handleCustomUpdate);
    };
  }, [loadData]);

  // Document Lightbox preview state
  const [previewDocument, setPreviewDocument] = useState<{
    title: string;
    url: string;
    fileName?: string;
    docName?: string;
    customerName?: string;
    status?: string;
  } | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const [previewRotation, setPreviewRotation] = useState<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewDocument) {
        setPreviewDocument(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewDocument]);


  // ──────────────────────────────────────────────────
  // 5 STRICT PDF-SUPPORTED OPERATIONAL COUNTS (Calculated dynamically)
  // ──────────────────────────────────────────────────
  const counts = useMemo(() => {
    const pendingCustomer = applicants.filter((a) => a.customerVerificationStatus === 'Pending').length;
    const pendingKyc = applicants.filter((a) => a.kycStatus === 'Pending').length;
    const pendingDocs = applicants.filter(
      (a) => a.documentStatus === 'Pending' || a.documentStatus === 'Incomplete'
    ).length;
    const pendingRecommend = applicants.filter((a) => a.recommendationStatus === 'Pending').length;
    const pendingApproval = applicants.filter(
      (a) => a.finalApprovalStatus === 'Pending' && a.recommendationStatus === 'Approved'
    ).length;

    // Applications currently requiring Credit Manager action
    const creditManagerActive = applicants.filter(
      (a) =>
        a.branchManagerApprovalStatus === 'Not Reached' &&
        (a.customerVerificationStatus === 'Pending' ||
          a.kycStatus === 'Pending' ||
          a.documentStatus === 'Pending' ||
          a.documentStatus === 'Incomplete' ||
          a.recommendationStatus === 'Pending' ||
          a.finalApprovalStatus === 'Pending')
    ).length;

    const branchManagerPending = applicants.filter(
      (a) => a.branchManagerApprovalStatus === 'Pending'
    ).length;

    const readyForDisbursement = applicants.filter(
      (a) => a.branchManagerApprovalStatus === 'Approved'
    ).length;

    return {
      pendingCustomer,
      pendingKyc,
      pendingDocs,
      pendingRecommend,
      pendingApproval,
      creditManagerActive,
      branchManagerPending,
      readyForDisbursement,
      total: applicants.length,
    };
  }, [applicants]);

  // ──────────────────────────────────────────────────
  // QUEUE FILTERING & SEARCH
  // ──────────────────────────────────────────────────
  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        app.customerName.toLowerCase().includes(q) ||
        app.customerId.toLowerCase().includes(q) ||
        app.id.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterStage === 'customer_verification') return app.customerVerificationStatus === 'Pending';
      if (filterStage === 'kyc_verification') return app.kycStatus === 'Pending';
      if (filterStage === 'doc_verification')
        return app.documentStatus === 'Pending' || app.documentStatus === 'Incomplete';
      if (filterStage === 'loan_recommendation') return app.recommendationStatus === 'Pending';
      if (filterStage === 'customer_approval')
        return app.finalApprovalStatus === 'Pending' && app.recommendationStatus === 'Approved';

      return true;
    });
  }, [applicants, searchQuery, filterStage]);

  // Helper to determine the applicant's current active workflow stage
  const getActiveStage = (app: CreditApplicant) => {
    if (app.customerVerificationStatus === 'Pending') {
      return {
        stage: 'Customer Verification',
        color: 'blue',
        actionLabel: 'Verify Customer',
        actionType: 'customer_verify' as const,
        route: '/verification/customer',
        bgBadge: 'bg-blue-50/90 text-blue-700 border-blue-200/90',
        btnBg: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
      };
    }
    if (app.kycStatus === 'Pending') {
      return {
        stage: 'KYC Verification',
        color: 'amber',
        actionLabel: 'Verify KYC',
        actionType: 'kyc_verify' as const,
        route: '/verification/kyc',
        bgBadge: 'bg-amber-50/90 text-amber-800 border-amber-200/90',
        btnBg: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
      };
    }
    if (app.documentStatus === 'Pending' || app.documentStatus === 'Incomplete') {
      return {
        stage: 'Document Verification',
        color: 'purple',
        actionLabel: 'Verify Documents',
        actionType: 'view' as const,
        route: '/verification/docs',
        bgBadge: 'bg-purple-50/90 text-purple-700 border-purple-200/90',
        btnBg: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
      };
    }
    if (app.recommendationStatus === 'Pending') {
      return {
        stage: 'Loan Recommendation',
        color: 'indigo',
        actionLabel: 'Review Recommendation',
        actionType: 'loan_recommend' as const,
        route: '/verification/recommend',
        bgBadge: 'bg-indigo-50/90 text-indigo-700 border-indigo-200/90',
        btnBg: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
      };
    }
    if (app.finalApprovalStatus === 'Pending') {
      return {
        stage: 'Customer Approval',
        color: 'emerald',
        actionLabel: 'Approve Customer',
        actionType: 'customer_approve' as const,
        route: '/verification/approval',
        bgBadge: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/90',
        btnBg: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
      };
    }
    if (app.branchManagerApprovalStatus === 'Pending') {
      return {
        stage: 'Branch Manager',
        color: 'slate',
        actionLabel: 'View Details',
        actionType: 'view' as const,
        route: null,
        bgBadge: 'bg-slate-100 text-slate-700 border-slate-200/90',
        btnBg: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs'
      };
    }
    if (app.branchManagerApprovalStatus === 'Approved') {
      return {
        stage: 'Loan Disbursement',
        color: 'emerald',
        actionLabel: 'View Details',
        actionType: 'view' as const,
        route: null,
        bgBadge: 'bg-emerald-50/90 text-emerald-700 border-emerald-200/90',
        btnBg: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs'
      };
    }
    return {
      stage: 'Completed',
      color: 'slate',
      actionLabel: 'View Details',
      actionType: 'view' as const,
      route: null,
      bgBadge: 'bg-slate-100 text-slate-700 border-slate-200/90',
      btnBg: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs'
    };
  };

  // Helper to format Aadhaar cleanly (masking unformatted strings consistently)
  const formatAadhaar = (val?: string) => {
    if (!val) return '—';
    if (val.startsWith('XXXX-XXXX-')) return val;
    const clean = val.replace(/[\s-]+/g, '');
    if (clean.length >= 4) {
      return `XXXX-XXXX-${clean.slice(-4)}`;
    }
    return val;
  };

  // Helper to format text with clean Title Case
  const formatCapitalize = (str?: string) => {
    if (!str) return '—';
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Helper for 4-digit grouped spaced Aadhaar number
  const formatAadhaarSpaced = (val?: string) => {
    if (!val) return '—';
    const clean = val.replace(/\s+/g, '');
    if (clean.length === 12) {
      return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8)}`;
    }
    return clean.replace(/(\d{4})/g, '$1 ').trim();
  };

  // Helper for address formatting with clean spacing after commas and proper capitalization
  const formatAddressClean = (addr?: string, city?: string) => {
    if (!addr) return city || '—';
    const parts = addr.split(',').map((s) => s.trim()).filter(Boolean);
    const formatted = parts.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
    return city ? `${formatted}, ${city}` : formatted;
  };

  // Helper for clean phone number formatting
  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return '—';
    const clean = phone.replace(/[^\d]/g, '');
    if (clean.length === 10) {
      return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
    }
    return `+91 ${phone.replace(/\s+/g, ' ').trim()}`;
  };

  // Helper for customer initials avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Open drawer with optional immediate action mode
  const openApplicantDrawer = (
    app: CreditApplicant,
    action: 'view' | 'customer_verify' | 'kyc_verify' | 'loan_recommend' | 'customer_approve' = 'view'
  ) => {
    setSelectedApplicant(app);
    setActiveActionStage(action);
    setActionRemarks('');
    setRecAmount(app.loanAmount);
    setRecTenor(app.tenorWeeks);
  };

  // ──────────────────────────────────────────────────
  // IN-DRAWER ACTIONS (Connected to creditManagerService)
  // ──────────────────────────────────────────────────
  const handleCustomerVerify = (status: 'Verified' | 'Rejected') => {
    if (!selectedApplicant) return;
    if (status === 'Rejected' && !actionRemarks.trim()) {
      addToast({ type: 'warning', title: 'Remarks Required', message: 'Please provide reason for customer rejection.' });
      return;
    }
    const managerName = currentUser?.displayName || 'Credit Manager';
    creditManagerService.updateCustomerVerification(
      selectedApplicant.id,
      status,
      actionRemarks || 'Customer profile & residence verified.',
      managerName
    );
    addToast({
      type: status === 'Verified' ? 'success' : 'error',
      title: `Customer ${status}`,
      message: `${selectedApplicant.customerName}'s customer verification marked as ${status}.`,
    });
    setActiveActionStage('view');
    loadData(true);
  };

  const handleKycVerify = (status: 'Verified' | 'Rejected') => {
    if (!selectedApplicant) return;
    if (status === 'Rejected' && !actionRemarks.trim()) {
      addToast({ type: 'warning', title: 'Remarks Required', message: 'Please provide reason for KYC rejection.' });
      return;
    }
    const managerName = currentUser?.displayName || 'Credit Manager';
    creditManagerService.updateKycVerification(
      selectedApplicant.id,
      status,
      actionRemarks || 'Aadhaar, PAN & Digital KYC records validated.',
      managerName
    );
    addToast({
      type: status === 'Verified' ? 'success' : 'error',
      title: `KYC ${status}`,
      message: `${selectedApplicant.customerName}'s Digital KYC marked as ${status}.`,
    });
    setActiveActionStage('view');
    loadData(true);
  };

  const handleToggleDoc = (docId: string, status: 'verified' | 'rejected' | 'pending') => {
    if (!selectedApplicant) return;
    creditManagerService.updateDocumentStatus(selectedApplicant.id, docId, status);
    addToast({
      type: status === 'verified' ? 'success' : 'warning',
      title: 'Document Updated',
      message: `Document status set to ${status.toUpperCase()}.`,
    });
    loadData(true);
  };

  const handleLoanRecommend = (status: 'Approved' | 'Rejected') => {
    if (!selectedApplicant) return;
    if (!actionRemarks.trim()) {
      addToast({ type: 'warning', title: 'Notes Required', message: 'Please enter recommendation notes.' });
      return;
    }
    const managerName = currentUser?.displayName || 'Credit Manager';
    creditManagerService.updateLoanRecommendation(
      selectedApplicant.id,
      status,
      actionRemarks,
      recAmount || selectedApplicant.loanAmount,
      recTenor || selectedApplicant.tenorWeeks,
      managerName
    );
    addToast({
      type: status === 'Approved' ? 'success' : 'error',
      title: `Recommendation ${status}`,
      message: `Loan recommendation for ${selectedApplicant.customerName} marked as ${status}.`,
    });
    setActiveActionStage('view');
    loadData(true);
  };

  const handleCustomerApproval = (status: 'Approved' | 'Rejected') => {
    if (!selectedApplicant) return;
    if (status === 'Rejected' && !actionRemarks.trim()) {
      addToast({ type: 'warning', title: 'Remarks Required', message: 'Please enter remarks for rejection.' });
      return;
    }
    const managerName = currentUser?.displayName || 'Credit Manager';
    creditManagerService.finalizeCustomerApproval(
      selectedApplicant.id,
      status,
      actionRemarks || 'Customer approved by Credit Manager for Branch Manager review.',
      managerName
    );
    addToast({
      type: status === 'Approved' ? 'success' : 'error',
      title: `Customer ${status}`,
      message: status === 'Approved'
        ? `${selectedApplicant.customerName} approved. Moved to Branch Manager queue.`
        : `${selectedApplicant.customerName} rejected.`,
    });
    setActiveActionStage('view');
    loadData(true);
  };

  return (
    <div className="space-y-6 font-body pb-14 pr-1 max-w-full overflow-x-hidden">
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER (Sophisticated Executive Banking Header)      */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800/40 shadow-[0_4px_25px_rgba(11,31,58,0.12)] overflow-hidden bg-gradient-to-r from-[#071326] via-[#0B1F3A] to-[#122B4D] border-t-2 border-t-[#D4AF37]">
        <div className="px-6 sm:px-8 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-gradient-to-b from-[#F3D375] via-[#D4AF37] to-[#AA8214] rounded-full shadow-xs shrink-0"></div>
              <div className="flex items-center">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase font-body leading-none">
                  Credit Manager Dashboard
                </h1>
              </div>
            </div>
            <p className="text-xs text-slate-300/90 pl-4.5 font-normal leading-relaxed">
              Customer Verification <span className="text-[#D4AF37]/70 mx-1.5">•</span> 
              KYC Verification <span className="text-[#D4AF37]/70 mx-1.5">•</span> 
              Document Verification <span className="text-[#D4AF37]/70 mx-1.5">•</span> 
              Loan Recommendation <span className="text-[#D4AF37]/70 mx-1.5">•</span> 
              Customer Approval
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="h-10 bg-white/10 backdrop-blur-md px-4 rounded-xl border border-white/15 text-xs text-slate-200 hidden md:flex items-center gap-2.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
              <span>Credit Manager: <strong className="text-white capitalize">{currentUser?.displayName || 'Credit Manager'}</strong></span>
            </div>
            <button
              onClick={() => window.location.reload()}
              title="Refresh Page (F5)"
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/15 transition-all cursor-pointer shadow-xs active:scale-95 hover:rotate-180 duration-300"
            >
              <RefreshCw size={15} />
            </button>
            <button
              onClick={() => navigate('/verification/customer')}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#B89220] text-[#071326] font-bold text-xs uppercase tracking-wider transition-all shadow-[0_2px_10px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_16px_rgba(212,175,55,0.45)] active:scale-[0.98] cursor-pointer flex items-center gap-2"
            >
              <UserCheck size={16} className="text-[#071326]" />
              <span>Open Verifications →</span>
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. WORKFLOW STEPPER PIPELINE (Interactive & Dynamic)        */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(11,31,58,0.04)]">
        <div className="flex items-center justify-between gap-2 sm:gap-3 overflow-x-auto pb-1 text-xs font-semibold custom-scrollbar">
          {/* Step 1: Customer Relationship Officer (CRO) */}
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex-1 min-w-[200px] h-[58px]">
            <div className="w-7 h-7 rounded-full bg-white border border-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-2xs">
              01
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-800 truncate leading-tight">Customer Relationship Officer (CRO)</span>
              <span className="text-[11px] text-slate-500 font-medium truncate leading-tight mt-0.5">Application Intake</span>
            </div>
          </div>

          <ChevronRight size={18} className="text-slate-300 shrink-0 mx-0.5" />

          {/* Step 2: Credit Manager (Active Stage) */}
          <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-blue-50/90 border border-blue-500/60 ring-2 ring-blue-500/15 flex-1 min-w-[220px] h-[58px] shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#0B1F3A] text-[#D4AF37] flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-2xs">
                02
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="text-xs font-bold text-[#0B1F3A] truncate">Credit Manager</span>
                  <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Active</span>
                </div>
                <span className="text-[11px] text-blue-800/90 font-medium truncate leading-tight mt-0.5">
                  {counts.creditManagerActive} Awaiting Credit Action
                </span>
              </div>
            </div>
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold font-mono flex items-center justify-center shrink-0 shadow-2xs">
              {counts.creditManagerActive}
            </span>
          </div>

          <ChevronRight size={18} className="text-slate-300 shrink-0 mx-0.5" />

          {/* Step 3: Branch Manager */}
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex-1 min-w-[200px] h-[58px]">
            <div className="w-7 h-7 rounded-full bg-white border border-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-2xs">
              03
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-800 truncate leading-tight">Branch Manager</span>
              <span className="text-[11px] text-slate-500 font-medium truncate leading-tight mt-0.5">Final Sanction ({counts.branchManagerPending})</span>
            </div>
          </div>

          <ChevronRight size={18} className="text-slate-300 shrink-0 mx-0.5" />

          {/* Step 4: Loan Disbursement */}
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex-1 min-w-[200px] h-[58px]">
            <div className="w-7 h-7 rounded-full bg-white border border-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-2xs">
              04
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-800 truncate leading-tight">Loan Disbursement</span>
              <span className="text-[11px] text-slate-500 font-medium truncate leading-tight mt-0.5">Disbursement Ready ({counts.readyForDisbursement})</span>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. FIVE OPERATIONAL SUMMARY CARDS (Dynamic & Tabular)      */}
      {/* ────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 min-h-[130px] animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              <div className="h-8 bg-slate-200 rounded w-1/3"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* CARD 1: Customer Verification */}
          <div
            onClick={() => setFilterStage((prev) => (prev === 'customer_verification' ? 'all' : 'customer_verification'))}
            className="bg-white rounded-2xl p-4.5 sm:p-5 h-[152px] border border-slate-200/90 shadow-[0_2px_10px_rgba(11,31,58,0.04)] flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 min-h-[38px]">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider leading-snug">
                Customer Verification
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs shrink-0">
                <Users size={18} />
              </div>
            </div>
            <div className="my-auto py-1">
              <p className="text-3xl sm:text-4xl font-black text-[#0B1F3A] tracking-tight tabular-nums font-mono leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {counts.pendingCustomer}
              </p>
            </div>
            <div className="min-h-[32px] flex items-center">
              <p className="text-[11px] text-blue-700 font-medium leading-tight flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                <span>Awaiting customer verification</span>
              </p>
            </div>
          </div>

          {/* CARD 2: KYC Verification */}
          <div
            onClick={() => setFilterStage((prev) => (prev === 'kyc_verification' ? 'all' : 'kyc_verification'))}
            className="bg-white rounded-2xl p-4.5 sm:p-5 h-[152px] border border-slate-200/90 shadow-[0_2px_10px_rgba(11,31,58,0.04)] flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 min-h-[38px]">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider leading-snug">
                KYC Verification
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs shrink-0">
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="my-auto py-1">
              <p className="text-3xl sm:text-4xl font-black text-[#0B1F3A] tracking-tight tabular-nums font-mono leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {counts.pendingKyc}
              </p>
            </div>
            <div className="min-h-[32px] flex items-center">
              <p className="text-[11px] text-amber-700 font-medium leading-tight flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
                <span>Awaiting KYC verification</span>
              </p>
            </div>
          </div>

          {/* CARD 3: Document Verification */}
          <div
            onClick={() => setFilterStage((prev) => (prev === 'doc_verification' ? 'all' : 'doc_verification'))}
            className="bg-white rounded-2xl p-4.5 sm:p-5 h-[152px] border border-slate-200/90 shadow-[0_2px_10px_rgba(11,31,58,0.04)] flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 min-h-[38px]">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider leading-snug">
                Document Verification
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs shrink-0">
                <FileCheck size={18} />
              </div>
            </div>
            <div className="my-auto py-1">
              <p className="text-3xl sm:text-4xl font-black text-[#0B1F3A] tracking-tight tabular-nums font-mono leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {counts.pendingDocs}
              </p>
            </div>
            <div className="min-h-[32px] flex items-center">
              <p className="text-[11px] text-purple-700 font-medium leading-tight flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0"></span>
                <span>Awaiting document verification</span>
              </p>
            </div>
          </div>

          {/* CARD 4: Loan Recommendation */}
          <div
            onClick={() => setFilterStage((prev) => (prev === 'loan_recommendation' ? 'all' : 'loan_recommendation'))}
            className="bg-white rounded-2xl p-4.5 sm:p-5 h-[152px] border border-slate-200/90 shadow-[0_2px_10px_rgba(11,31,58,0.04)] flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 min-h-[38px]">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider leading-snug">
                Loan Recommendation
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs shrink-0">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="my-auto py-1">
              <p className="text-3xl sm:text-4xl font-black text-[#0B1F3A] tracking-tight tabular-nums font-mono leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {counts.pendingRecommend}
              </p>
            </div>
            <div className="min-h-[32px] flex items-center">
              <p className="text-[11px] text-indigo-700 font-medium leading-tight flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0"></span>
                <span>Awaiting loan recommendation</span>
              </p>
            </div>
          </div>

          {/* CARD 5: Customer Approval */}
          <div
            onClick={() => setFilterStage((prev) => (prev === 'customer_approval' ? 'all' : 'customer_approval'))}
            className="bg-white rounded-2xl p-4.5 sm:p-5 h-[152px] border border-slate-200/90 shadow-[0_2px_10px_rgba(11,31,58,0.04)] flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 min-h-[38px]">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider leading-snug">
                Customer Approval
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs shrink-0">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="my-auto py-1">
              <p className="text-3xl sm:text-4xl font-black text-emerald-700 tracking-tight tabular-nums font-mono leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {counts.pendingApproval}
              </p>
            </div>
            <div className="min-h-[32px] flex items-center">
              <p className="text-[11px] text-emerald-700 font-medium leading-tight flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                <span>Awaiting customer approval</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. CREDIT MANAGER WORK QUEUE (Elevated Visual Layout)       */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(11,31,58,0.06)] overflow-hidden">
        {/* Queue Top Header */}
        <div className="bg-gradient-to-r from-[#071326] via-[#0B1F3A] to-[#122B4D] px-6 sm:px-8 py-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-1.5 h-7 bg-gradient-to-b from-[#E5C158] to-[#D4AF37] rounded-full shrink-0 shadow-xs"></div>
            <div>
              <div className="flex items-center">
                <h2 className="text-base font-extrabold text-white tracking-wider uppercase font-body">
                  Verification & Approval Queue
                </h2>
              </div>
              <p className="text-xs text-slate-200 font-normal mt-1 leading-normal">
                Operational queue for Customer Verification, KYC, Documents, Recommendation & Approval
              </p>
            </div>
          </div>

          {/* Real-time Search Input */}
          <div className="relative w-full sm:w-80 shrink-0">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            <input
              type="text"
              placeholder="Search customer name, ID, loan ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/25 focus:border-[#D4AF37] text-xs text-white placeholder-slate-300 focus:outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Queue Stage Filter Pills (Sub-bar) */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 sm:px-8 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <button
              onClick={() => setFilterStage('all')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all min-h-[34px] cursor-pointer tabular-nums flex items-center gap-1.5 ${
                filterStage === 'all'
                  ? 'bg-[#0B1F3A] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>All</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/15 text-[11px]">{counts.total}</span>
            </button>
            <button
              onClick={() => setFilterStage('customer_verification')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all min-h-[34px] cursor-pointer tabular-nums flex items-center gap-1.5 ${
                filterStage === 'customer_verification'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>Customer</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/15 text-[11px]">{counts.pendingCustomer}</span>
            </button>
            <button
              onClick={() => setFilterStage('kyc_verification')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all min-h-[34px] cursor-pointer tabular-nums flex items-center gap-1.5 ${
                filterStage === 'kyc_verification'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>KYC</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/15 text-[11px]">{counts.pendingKyc}</span>
            </button>
            <button
              onClick={() => setFilterStage('doc_verification')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all min-h-[34px] cursor-pointer tabular-nums flex items-center gap-1.5 ${
                filterStage === 'doc_verification'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>Docs</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/15 text-[11px]">{counts.pendingDocs}</span>
            </button>
            <button
              onClick={() => setFilterStage('loan_recommendation')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all min-h-[34px] cursor-pointer tabular-nums flex items-center gap-1.5 ${
                filterStage === 'loan_recommendation'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>Recommend</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/15 text-[11px]">{counts.pendingRecommend}</span>
            </button>
            <button
              onClick={() => setFilterStage('customer_approval')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all min-h-[34px] cursor-pointer tabular-nums flex items-center gap-1.5 ${
                filterStage === 'customer_approval'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>Approval</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/15 text-[11px]">{counts.pendingApproval}</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            Showing <strong>{filteredApplicants.length}</strong> of <strong>{applicants.length}</strong> applicants
          </span>
        </div>

        {/* Error State */}
        {loadError && (
          <div className="p-10 text-center space-y-3 bg-red-50/50">
            <AlertCircle size={36} className="mx-auto text-red-500" />
            <p className="text-sm font-bold text-red-800">{loadError}</p>
            <button
              onClick={() => loadData()}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !loadError && (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        )}

        {/* Queue Table */}
        {!isLoading && !loadError && (
          <div className="overflow-x-auto custom-scrollbar">
            {filteredApplicants.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 space-y-3">
                <FileText size={36} className="mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  No Pending Verification in this Queue
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  There are currently no applicant records requiring action for the selected filter or search query.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs font-body border-collapse min-w-[1550px]">
                <thead className="bg-[#F8FAFC] border-b border-slate-200">
                  <tr className="text-slate-500 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-3.5 px-4 sm:px-5 text-left whitespace-nowrap min-w-[200px]">Customer</th>
                    <th className="py-3.5 px-3 sm:px-4 text-left whitespace-nowrap min-w-[125px]">Applied Date</th>
                    <th className="py-3.5 px-3 sm:px-4 text-left whitespace-nowrap min-w-[170px]">Center</th>
                    <th className="py-3.5 px-3 sm:px-4 text-left whitespace-nowrap min-w-[165px]">Customer Verification</th>
                    <th className="py-3.5 px-3 sm:px-4 text-left whitespace-nowrap min-w-[145px]">KYC Status</th>
                    <th className="py-3.5 px-3 sm:px-4 text-left whitespace-nowrap min-w-[145px]">Document Status</th>
                    <th className="py-3.5 px-3 sm:px-4 text-left whitespace-nowrap min-w-[210px]">Loan Information</th>
                    <th className="py-3.5 px-3 sm:px-4 text-left whitespace-nowrap min-w-[165px]">Current Stage</th>
                    <th className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap min-w-[260px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplicants.map((app) => {
                    const activeInfo = getActiveStage(app);

                    return (
                      <tr key={app.id} className="hover:bg-blue-50/30 transition-colors group">
                        {/* 1. Customer Column */}
                        <td className="py-4 px-4 sm:px-5 align-middle whitespace-nowrap min-w-[200px]">
                          <div className="flex items-center gap-3">
                            <Avatar name={app.customerName} size="sm" className="!rounded-xl !w-10 !h-10 shadow-2xs shrink-0" />
                            <div className="min-w-0">
                              <div className="font-extrabold text-[#0B1F3A] text-sm group-hover:text-blue-600 transition-colors whitespace-nowrap leading-tight">
                                {app.customerName}
                              </div>
                              <div className="text-slate-500 text-[11px] font-mono tabular-nums mt-1 whitespace-nowrap">
                                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold text-[10px] border border-slate-200/90">
                                  {app.customerId}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Applied Date Column */}
                        <td className="py-4 px-3 sm:px-4 align-middle whitespace-nowrap min-w-[125px]">
                          <div className="inline-flex items-center gap-1.5 text-slate-700 font-mono text-[11.5px] font-semibold tabular-nums">
                            <Calendar size={12} className="text-slate-400 shrink-0" />
                            <span>{app.appliedDate}</span>
                          </div>
                        </td>

                        {/* 3. Center Column */}
                        <td className="py-4 px-3 sm:px-4 align-middle whitespace-nowrap min-w-[170px]">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={12} className="text-blue-500 shrink-0" />
                            <span className="text-xs font-bold text-slate-800 whitespace-nowrap">{app.centerName}</span>
                          </div>
                          {app.groupName && (
                            <div className="text-[10.5px] text-slate-500 font-medium mt-0.5 pl-4 whitespace-nowrap truncate max-w-[160px]">
                              {app.groupName}
                            </div>
                          )}
                        </td>

                        {/* 4. Customer Verification */}
                        <td className="py-4 px-3 sm:px-4 align-middle whitespace-nowrap min-w-[165px]">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-2xs ${
                              app.customerVerificationStatus === 'Verified'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/90'
                                : app.customerVerificationStatus === 'Rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/90'
                                : 'bg-amber-50 text-amber-700 border border-amber-200/90'
                            }`}
                          >
                            {app.customerVerificationStatus === 'Verified' ? <Check size={11} className="stroke-[2.5]" /> : <Clock size={11} className="stroke-[2.5]" />}
                            <span>{app.customerVerificationStatus}</span>
                          </span>
                          {app.customerVerificationStatus === 'Verified' && app.customerVerifiedBy ? (
                            <div className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1 whitespace-nowrap">
                              <User size={11} className="text-slate-400 shrink-0" />
                              <span>by {app.customerVerifiedBy.split(' ')[0]}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 font-medium mt-1 whitespace-nowrap">
                              {app.customerVerificationStatus === 'Pending' ? 'Awaiting review' : 'Disapproved'}
                            </div>
                          )}
                        </td>

                        {/* 5. KYC Status */}
                        <td className="py-4 px-3 sm:px-4 align-middle whitespace-nowrap min-w-[145px]">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-2xs ${
                              app.kycStatus === 'Verified'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/90'
                                : app.kycStatus === 'Rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/90'
                                : 'bg-amber-50 text-amber-700 border border-amber-200/90'
                            }`}
                          >
                            {app.kycStatus === 'Verified' ? <Check size={11} className="stroke-[2.5]" /> : <Clock size={11} className="stroke-[2.5]" />}
                            <span>{app.kycStatus}</span>
                          </span>
                          <div className="text-[11px] font-mono text-slate-600 font-semibold mt-1 tabular-nums whitespace-nowrap">
                            {formatAadhaar(app.aadhaarNumber)}
                          </div>
                        </td>

                        {/* 6. Document Status */}
                        <td className="py-4 px-3 sm:px-4 align-middle whitespace-nowrap min-w-[145px]">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-2xs ${
                              app.documentStatus === 'Verified'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/90'
                                : app.documentStatus === 'Rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/90'
                                : 'bg-purple-50 text-purple-700 border border-purple-200/90'
                            }`}
                          >
                            <FileText size={11} className="stroke-[2.5]" />
                            <span>{app.documentStatus}</span>
                          </span>
                          <div className="text-[11px] text-slate-500 font-medium mt-1 tabular-nums whitespace-nowrap">
                            {app.documents.filter((d) => d.status === 'verified').length} of {app.documents.length} Docs
                          </div>
                        </td>

                        {/* 7. Loan Information */}
                        <td className="py-4 px-3 sm:px-4 align-middle whitespace-nowrap min-w-[210px]">
                          <div className="font-mono text-slate-400 text-[10px] tabular-nums font-semibold tracking-wider uppercase whitespace-nowrap leading-none">
                            {app.id}
                          </div>
                          <div className="font-extrabold text-[#0B1F3A] text-[15px] tabular-nums whitespace-nowrap my-0.5 leading-snug">
                            ₹{app.loanAmount.toLocaleString('en-IN')}
                          </div>
                          <div className="text-slate-500 text-[11px] font-medium tabular-nums whitespace-nowrap truncate flex items-center gap-1">
                            <span>{app.loanProduct}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-800 font-bold">₹{app.proposedEmi?.toLocaleString('en-IN')}/wk</span>
                          </div>
                        </td>

                        {/* 8. Current Workflow Stage */}
                        <td className="py-4 px-3 sm:px-4 align-middle whitespace-nowrap min-w-[165px]">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border whitespace-nowrap shadow-2xs ${activeInfo.bgBadge}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
                            <span>{activeInfo.stage}</span>
                          </span>
                        </td>

                        {/* 9. Context-Specific Action */}
                        <td className="py-4 px-4 sm:px-5 text-right align-middle whitespace-nowrap min-w-[260px]">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeInfo.route) {
                                  navigate(`${activeInfo.route}?search=${encodeURIComponent(app.customerName)}`);
                                } else {
                                  openApplicantDrawer(app, 'view');
                                }
                              }}
                              className={`min-w-[170px] px-5 h-[34px] rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                                activeInfo.route
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 hover:shadow-md hover:shadow-blue-600/25'
                                  : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0B1F3A] border border-slate-200/90 hover:border-slate-300 shadow-2xs'
                              }`}
                              title={activeInfo.route ? `Go to ${activeInfo.stage} for ${app.customerName}` : `View details for ${app.customerName}`}
                            >
                              <span>{activeInfo.actionLabel}</span>
                              <ArrowRight size={13} className="shrink-0" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailsApplicant(app);
                              }}
                              className="h-[34px] w-[34px] rounded-xl text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200/90 hover:border-blue-300 transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 shrink-0"
                              title={`View ${app.customerName}'s Full Details`}
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4.5 DEDICATED CUSTOMER DETAILS MODAL (OPENED BY EYE ICON)  */}
      {/* ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {detailsApplicant && typeof document !== 'undefined' && createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDetailsApplicant(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.16 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-[min(96vw,1040px)] overflow-hidden font-body max-h-[92dvh] flex flex-col text-[#12233F]"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#061224] via-[#0B1F3A] to-[#122A4E] px-5 py-3.5 sm:px-7 sm:py-4 flex items-center justify-between text-white border-b border-[#D4AF37]/35 flex-shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-full bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center gap-3.5 sm:gap-4 relative z-10 min-w-0">
                  <Avatar name={detailsApplicant.customerName} size="lg" className="!rounded-2xl !w-12 !h-12 sm:!w-14 sm:!h-14 shadow-lg border-2 border-white/20 shrink-0" />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-[#D4AF37] px-2 py-0.5 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/30">
                        Customer Dossier
                      </span>
                      <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        {getActiveStage(detailsApplicant).stage}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight truncate leading-tight">
                      {detailsApplicant.customerName}
                    </h3>

                    <div className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap font-sans">
                      <span className="bg-white/10 px-2 py-0.5 rounded-md text-[11px] font-mono text-[#F3D375] font-bold border border-white/10">
                        Cust ID: {detailsApplicant.customerId}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="bg-white/10 px-2 py-0.5 rounded-md text-[11px] font-mono text-cyan-300 font-bold border border-white/10">
                        Loan ID: {detailsApplicant.id}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-200 text-[11px] font-medium">
                        {detailsApplicant.branchId} • {detailsApplicant.centerName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 relative z-10 shrink-0 ml-3">
                  <div className="hidden sm:flex flex-col items-end text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loan Request</span>
                    <span className="text-base sm:text-lg font-black text-[#F3D375] tabular-nums font-body leading-tight">
                      ₹{(detailsApplicant.loanAmount || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {detailsApplicant.tenorWeeks} wks @ ₹{(detailsApplicant.proposedEmi || 0).toLocaleString('en-IN')}/wk
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDetailsApplicant(null)}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/15 active:scale-95 ml-1"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Status Progression Summary Bar */}
              <div className="bg-[#F8FAFC] border-b border-slate-200/90 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2.5 flex-wrap">
                <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Verification Breakdown:
                </span>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                    detailsApplicant.customerVerificationStatus === 'Verified'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    Profile: {detailsApplicant.customerVerificationStatus}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                    detailsApplicant.kycStatus === 'Verified'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    KYC: {detailsApplicant.kycStatus}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                    detailsApplicant.documentStatus === 'Verified'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    Docs: {detailsApplicant.documentStatus}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                    detailsApplicant.recommendationStatus === 'Approved'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}>
                    Rec: {detailsApplicant.recommendationStatus}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                    detailsApplicant.branchManagerApprovalStatus === 'Approved'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    BM: {detailsApplicant.branchManagerApprovalStatus}
                  </span>
                </div>
              </div>

              {/* Modal Body: 4 Structured Customer Detail Panels */}
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar bg-[#F8FAFC]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: Personal & Contact Profile */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-all">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shadow-2xs shrink-0">
                          <Users size={14} />
                        </div>
                        <span className="font-extrabold text-xs text-[#0B1F3A] uppercase tracking-wider">
                          Personal & Contact Profile
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Profile Details</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Guardian / Spouse</span>
                        <strong className="text-slate-900 font-bold text-xs mt-0.5 block truncate capitalize">{formatCapitalize(detailsApplicant.fatherOrSpouseName)}</strong>
                      </div>
                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Primary Phone</span>
                        <strong className="text-slate-900 font-bold text-xs mt-0.5 block font-mono tabular-nums">{formatPhoneNumber(detailsApplicant.phone)}</strong>
                      </div>
                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Occupation</span>
                        <strong className="text-slate-900 font-bold text-xs mt-0.5 block truncate">{detailsApplicant.occupation}</strong>
                      </div>
                      <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-200/80">
                        <span className="text-blue-700 text-[10px] block font-extrabold uppercase tracking-wider">Monthly Income</span>
                        <strong className="text-[#0B1F3A] text-xs font-black tabular-nums mt-0.5 block">₹{(detailsApplicant.monthlyIncome || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="col-span-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Residence Address</span>
                        <p className="text-slate-800 font-semibold text-xs leading-snug mt-0.5 flex items-start gap-1.5">
                          <MapPin size={12} className="text-blue-600 shrink-0 mt-0.5" />
                          <span>{formatAddressClean(detailsApplicant.address, detailsApplicant.city)}</span>
                        </p>
                      </div>
                      {detailsApplicant.customerVerificationRemarks && (
                        <div className="col-span-2 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/80 text-[11px] text-emerald-900 font-medium">
                          <span className="font-bold">Verification Note:</span> {detailsApplicant.customerVerificationRemarks}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Digital KYC & ID Verification */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shadow-2xs shrink-0">
                          <ShieldCheck size={14} />
                        </div>
                        <span className="font-extrabold text-xs text-[#0B1F3A] uppercase tracking-wider">
                          Digital KYC & Identity Records
                        </span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        detailsApplicant.kycStatus === 'Verified'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {detailsApplicant.kycStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Aadhaar Number</span>
                        <strong className="font-mono text-slate-900 font-bold text-xs mt-0.5 block tabular-nums tracking-wider">{formatAadhaarSpaced(detailsApplicant.aadhaarNumber)}</strong>
                      </div>
                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">PAN Number</span>
                        <strong className="font-mono text-slate-900 font-bold text-xs mt-0.5 block tracking-wider uppercase">{detailsApplicant.panNumber?.toUpperCase() || '—'}</strong>
                      </div>
                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Voter ID</span>
                        <strong className="font-mono text-slate-900 font-bold text-xs mt-0.5 block tracking-wider uppercase truncate">{detailsApplicant.voterId?.toUpperCase() || '—'}</strong>
                      </div>
                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Ration Card</span>
                        <strong className="font-mono text-slate-900 font-bold text-xs mt-0.5 block tracking-wider uppercase truncate">{detailsApplicant.rationCard?.toUpperCase() || '—'}</strong>
                      </div>
                      <div className="col-span-2 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/80 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                        <span className="text-[11px] text-emerald-950 font-semibold leading-tight">
                          {detailsApplicant.kycRemarks || 'UIDAI biometric & photo match confirmed with 100% address alignment.'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Loan Details & Financial Terms */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-amber-300 transition-all">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shadow-2xs shrink-0">
                          <TrendingUp size={14} />
                        </div>
                        <span className="font-extrabold text-xs text-[#0B1F3A] uppercase tracking-wider">
                          Loan Proposal & Financials
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Assessment</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                      <div className="bg-[#0B1F3A] text-white p-2.5 rounded-xl border border-slate-800 shadow-2xs">
                        <span className="text-slate-300 text-[9.5px] block font-extrabold uppercase tracking-wider">Requested Loan</span>
                        <strong className="text-sm sm:text-base font-black text-[#F3D375] tabular-nums mt-0.5 block leading-tight">
                          ₹{(detailsApplicant.loanAmount || 0).toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200/80 shadow-2xs">
                        <span className="text-blue-700 text-[9.5px] block font-extrabold uppercase tracking-wider">Proposed Weekly EMI</span>
                        <strong className="text-sm sm:text-base font-black text-[#0B1F3A] tabular-nums mt-0.5 block leading-tight">
                          ₹{(detailsApplicant.proposedEmi || 0).toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Loan Product</span>
                        <strong className="text-slate-900 font-bold text-xs mt-0.5 block leading-snug truncate" title={detailsApplicant.loanProduct}>
                          {detailsApplicant.loanProduct}
                        </strong>
                      </div>
                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Tenor</span>
                        <strong className="text-slate-900 font-bold text-xs mt-0.5 block tabular-nums">{detailsApplicant.tenorWeeks} Weeks</strong>
                      </div>
                      <div className="col-span-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Loan Purpose</span>
                        <p className="text-slate-800 font-semibold text-xs leading-snug mt-0.5">{detailsApplicant.loanPurpose}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Uploaded Verification Documents */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-purple-300 transition-all">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shadow-2xs shrink-0">
                          <FileCheck size={14} />
                        </div>
                        <span className="font-extrabold text-xs text-[#0B1F3A] uppercase tracking-wider">
                          Uploaded Verification Documents
                        </span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        detailsApplicant.documentStatus === 'Verified'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-purple-50 text-purple-800 border-purple-200'
                      }`}>
                        {detailsApplicant.documentStatus}
                      </span>
                    </div>

                    <div className="space-y-1.5 mt-3">
                      {(detailsApplicant.documents && detailsApplicant.documents.length === 4
                        ? detailsApplicant.documents
                        : createPdfCompliantDocuments(detailsApplicant, detailsApplicant.documents || [])
                      ).map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2 px-3 rounded-xl bg-slate-50/80 hover:bg-purple-50/30 border border-slate-200/80 text-xs transition-colors shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-6 h-6 rounded-lg bg-purple-100/70 text-purple-700 flex items-center justify-center shrink-0">
                              <FileText size={12} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-900 leading-tight truncate text-[11.5px]">{doc.name}</p>
                              <span className="text-[10px] text-slate-500 font-mono font-medium truncate block">{doc.fileName}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                              doc.status === 'verified'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : doc.status === 'rejected'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {doc.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewZoom(1);
                                setPreviewRotation(0);
                                setPreviewDocument({
                                  title: `${detailsApplicant.customerName} • ${doc.name}`,
                                  url: doc.fileUrl || '',
                                  fileName: doc.fileName,
                                  docName: doc.name,
                                  customerName: detailsApplicant.customerName,
                                  status: doc.status,
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                              title="Preview Document"
                            >
                              <Eye size={11} />
                              <span>View</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-white px-5 py-3 sm:px-6 sm:py-3.5 border-t border-slate-200/90 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span>Applied: <strong className="font-mono text-slate-900 font-bold">{detailsApplicant.appliedDate}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>Center: <strong className="text-slate-900 font-semibold">{detailsApplicant.centerName}</strong></span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const target = detailsApplicant;
                      setDetailsApplicant(null);
                      openApplicantDrawer(target, 'view');
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <span>Proceed to Verification File</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailsApplicant(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer border border-slate-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. FULL DETAILS & ACTION DRAWER / MODAL                     */}
      {/* ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedApplicant && typeof document !== 'undefined' && createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedApplicant(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-slate-700/30 shadow-2xl w-[min(96vw,1060px)] overflow-hidden font-body max-h-[92dvh] flex flex-col text-[#12233F]"
            >
              {/* Drawer Header */}
              <div className="bg-gradient-to-r from-[#061224] via-[#0A1E38] to-[#122A4E] px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between text-white border-b border-[#D4AF37]/30 flex-shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-full bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center gap-3.5 relative z-10 min-w-0">
                  {/* Customer Avatar */}
                  <Avatar name={selectedApplicant.customerName} size="md" className="!rounded-xl !w-11 !h-11 shadow-md border-2 border-white/20 shrink-0" />

                  <div className="min-w-0">
                    {/* Top Row: Title, Active Stage */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-xs sm:text-sm font-black text-white tracking-wider uppercase font-body leading-tight">
                        Applicant Verification & Approval File
                      </h3>
                      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-500/25 text-blue-200 border border-blue-400/35 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        {getActiveStage(selectedApplicant).stage}
                      </span>
                    </div>

                    {/* Bottom Row: Customer Name, Cust ID, Loan ID, Branch */}
                    <div className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                      <span className="text-white font-extrabold text-sm sm:text-base tracking-wide leading-none">{selectedApplicant.customerName}</span>
                      <span className="text-slate-500">•</span>
                      <span className="bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-md text-[11px] text-slate-200 font-mono border border-white/10 flex items-center gap-1">
                        Cust ID: <strong className="text-[#F3D375] font-bold">{selectedApplicant.customerId}</strong>
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-md text-[11px] text-slate-200 font-mono border border-white/10 flex items-center gap-1">
                        Loan ID: <strong className="text-cyan-300 font-bold">{selectedApplicant.id}</strong>
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-md text-[11px] text-slate-200 border border-white/10 flex items-center gap-1">
                        Branch: <strong className="text-white font-bold">{selectedApplicant.branchId}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 relative z-10 shrink-0 ml-3">
                  {/* Direct Link to Stage Page */}
                  {getActiveStage(selectedApplicant).route && (
                    <button
                      type="button"
                      onClick={() => {
                        const stage = getActiveStage(selectedApplicant);
                        if (stage.route) {
                          setSelectedApplicant(null);
                          navigate(`${stage.route}?search=${encodeURIComponent(selectedApplicant.customerName)}`);
                        }
                      }}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 border border-blue-400/30"
                      title={`Open full ${getActiveStage(selectedApplicant).stage} module`}
                    >
                      <span>Go to {getActiveStage(selectedApplicant).stage}</span>
                      <ExternalLink size={13} />
                    </button>
                  )}

                  {/* Loan Amount Preview Badge */}
                  <div className="hidden sm:flex flex-col items-end text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loan Request</span>
                    <span className="text-base sm:text-lg font-black text-[#F3D375] tabular-nums font-body leading-tight">
                      ₹{(selectedApplicant.loanAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedApplicant(null)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/15 active:scale-95 ml-1"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="p-3.5 sm:p-4 space-y-3 overflow-y-auto flex-1 custom-scrollbar bg-[#F8FAFC]">
                {/* 1. Workflow Progression Stepper */}
                {(() => {
                  const isCreditDone =
                    selectedApplicant.customerVerificationStatus === 'Verified' &&
                    selectedApplicant.kycStatus === 'Verified' &&
                    selectedApplicant.documentStatus === 'Verified' &&
                    selectedApplicant.recommendationStatus === 'Approved';
                  const isBmApproved = selectedApplicant.branchManagerApprovalStatus === 'Approved';
                  const isBmActive = isCreditDone && !isBmApproved;

                  return (
                    <div className="px-4 py-2 rounded-xl bg-white border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">Current Stage:</span>
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-800 border border-blue-200/90 shadow-2xs flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                          {getActiveStage(selectedApplicant).stage}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-700 font-bold overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mr-1">Pipeline:</span>
                        
                        {/* Step 1: Customer Relationship Officer (CRO) */}
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold shrink-0">
                          <Check size={12} className="text-emerald-700 stroke-[2.5]" />
                          <span>Customer Relationship Officer (CRO)</span>
                        </div>
                        
                        <ChevronRight size={13} className="text-slate-400 shrink-0" />
                        
                        {/* Step 2: Credit Manager */}
                        {isCreditDone ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold shrink-0">
                            <Check size={12} className="text-emerald-700 stroke-[2.5]" />
                            <span>Credit Manager</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 text-white font-extrabold text-[11px] shadow-xs shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>Credit Manager</span>
                          </div>
                        )}

                        <ChevronRight size={13} className="text-slate-400 shrink-0" />

                        {/* Step 3: Branch Manager */}
                        {isBmApproved ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold shrink-0">
                            <Check size={12} className="text-emerald-700 stroke-[2.5]" />
                            <span>Branch Manager</span>
                          </div>
                        ) : isBmActive ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 text-white font-extrabold text-[11px] shadow-xs shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>Branch Manager</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-bold shrink-0">
                            <span>Branch Manager</span>
                          </div>
                        )}

                        <ChevronRight size={13} className="text-slate-400 shrink-0" />

                        {/* Step 4: Disbursement */}
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold shrink-0 ${
                          isBmApproved
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          <span>Disbursement</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Four Information Panels (Balanced 2x2 Grid with Distinct SaaS Colors & High-Contrast Text) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Panel A: Customer Profile & Residence */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shadow-2xs shrink-0">
                            <Users size={13} />
                          </div>
                          <span className="font-extrabold text-xs text-[#0B1F3A] uppercase tracking-wider">Customer Profile & Residence</span>
                        </div>
                        <span
                          className={`text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            selectedApplicant.customerVerificationStatus === 'Verified'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : selectedApplicant.customerVerificationStatus === 'Rejected'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {selectedApplicant.customerVerificationStatus === 'Verified' ? <Check size={11} className="stroke-[2.5]" /> : <Clock size={11} className="stroke-[2.5]" />}
                          <span>{selectedApplicant.customerVerificationStatus}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Guardian</span>
                          <strong className="text-slate-900 font-bold text-xs mt-0.5 block truncate capitalize">{formatCapitalize(selectedApplicant.fatherOrSpouseName)}</strong>
                        </div>
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Contact Number</span>
                          <strong className="text-slate-900 font-bold text-xs mt-0.5 block font-mono tabular-nums">{formatPhoneNumber(selectedApplicant.phone)}</strong>
                        </div>
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Occupation</span>
                          <strong className="text-slate-900 font-bold text-xs mt-0.5 block truncate">{selectedApplicant.occupation}</strong>
                        </div>
                        <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-200/80">
                          <span className="text-blue-700 text-[10px] block font-extrabold uppercase tracking-wider">Monthly Income</span>
                          <strong className="text-[#0B1F3A] text-xs font-black tabular-nums mt-0.5 block font-body">₹{(selectedApplicant.monthlyIncome || 0).toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="col-span-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Residence Address</span>
                          <p className="text-slate-800 font-semibold text-xs leading-snug mt-0.5 flex items-start gap-1.5">
                            <MapPin size={12} className="text-blue-600 shrink-0 mt-0.5" />
                            <span>{formatAddressClean(selectedApplicant.address, selectedApplicant.city)}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Panel B: Digital KYC Information */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shadow-2xs shrink-0">
                            <ShieldCheck size={13} />
                          </div>
                          <span className="font-extrabold text-xs text-[#0B1F3A] uppercase tracking-wider">Digital KYC Records</span>
                        </div>
                        <span
                          className={`text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            selectedApplicant.kycStatus === 'Verified'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : selectedApplicant.kycStatus === 'Rejected'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {selectedApplicant.kycStatus === 'Verified' ? <Check size={11} className="stroke-[2.5]" /> : <Clock size={11} className="stroke-[2.5]" />}
                          <span>{selectedApplicant.kycStatus}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Aadhaar Number</span>
                          <strong className="font-mono text-slate-900 font-bold text-xs mt-0.5 block tabular-nums tracking-wider">{formatAadhaarSpaced(selectedApplicant.aadhaarNumber)}</strong>
                        </div>
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">PAN Number</span>
                          <strong className="font-mono text-slate-900 font-bold text-xs mt-0.5 block tracking-wider uppercase">{selectedApplicant.panNumber?.toUpperCase() || '—'}</strong>
                        </div>
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Voter ID</span>
                          <strong className="font-mono text-slate-900 font-bold text-xs mt-0.5 block tracking-wider uppercase truncate">{selectedApplicant.voterId?.toUpperCase() || '—'}</strong>
                        </div>
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Ration Card</span>
                          <strong className="font-mono text-slate-900 font-bold text-xs mt-0.5 block tracking-wider uppercase truncate">{selectedApplicant.rationCard?.toUpperCase() || '—'}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="text-[10.5px] text-emerald-900 font-semibold bg-emerald-50/90 p-2 rounded-xl border border-emerald-200/90 mt-2.5 flex items-center gap-2 shadow-2xs">
                      <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                      <p className="leading-tight">{selectedApplicant.kycRemarks || 'UIDAI biometric & photo match confirmed with 100% address alignment.'}</p>
                    </div>
                  </div>

                  {/* Panel C: Document Audit Checklist */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-purple-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shadow-2xs shrink-0">
                            <FileCheck size={13} />
                          </div>
                          <span className="font-extrabold text-xs text-[#0B1F3A] uppercase tracking-wider">Document Verification</span>
                        </div>
                        <span
                          className={`text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            selectedApplicant.documentStatus === 'Verified'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-purple-50 text-purple-800 border border-purple-200'
                          }`}
                        >
                          {selectedApplicant.documentStatus === 'Verified' ? <Check size={11} className="stroke-[2.5]" /> : <Clock size={11} className="stroke-[2.5]" />}
                          <span>{selectedApplicant.documentStatus}</span>
                        </span>
                      </div>

                      <div className="space-y-1.5 mt-3">
                        {(selectedApplicant.documents && selectedApplicant.documents.length === 4
                          ? selectedApplicant.documents
                          : createPdfCompliantDocuments(selectedApplicant, selectedApplicant.documents || [])
                        ).map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-2 px-3 rounded-xl bg-slate-50/80 hover:bg-purple-50/30 border border-slate-200/80 text-xs transition-colors shadow-2xs"
                          >
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                setPreviewZoom(1);
                                setPreviewRotation(0);
                                setPreviewDocument({
                                  title: `${selectedApplicant.customerName} • ${doc.name}`,
                                  url: doc.fileUrl || '',
                                  fileName: doc.fileName,
                                  docName: doc.name,
                                  customerName: selectedApplicant.customerName,
                                  status: doc.status,
                                });
                              }}
                              className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
                              title="Click to view document image"
                            >
                              <div className="w-6 h-6 rounded-lg bg-purple-100/70 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-[#0B1F3A] group-hover:text-white transition-colors">
                                <Eye size={12} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-900 leading-tight truncate text-[11.5px] group-hover:text-blue-600 transition-colors">{doc.name}</p>
                                <span className="text-[10px] text-slate-500 font-mono font-medium truncate block">{doc.fileName}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewZoom(1);
                                  setPreviewRotation(0);
                                  setPreviewDocument({
                                    title: `${selectedApplicant.customerName} • ${doc.name}`,
                                    url: doc.fileUrl || '',
                                    fileName: doc.fileName,
                                    docName: doc.name,
                                    customerName: selectedApplicant.customerName,
                                    status: doc.status,
                                  });
                                }}
                                className="px-2 py-1 rounded-lg text-[10.5px] font-bold text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-200/80 transition-colors cursor-pointer flex items-center gap-1"
                                title="View Document Image"
                              >
                                <Eye size={12} />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleDoc(doc.id, doc.status === 'verified' ? 'pending' : 'verified')}
                                className={`px-3 py-1 rounded-lg text-[10.5px] font-extrabold cursor-pointer transition-all shrink-0 shadow-2xs flex items-center gap-1.5 active:scale-95 ${
                                  doc.status === 'verified'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                                }`}
                              >
                                {doc.status === 'verified' ? (
                                  <>
                                    <Check size={11} className="stroke-[2.5]" />
                                    <span>Verified</span>
                                  </>
                                ) : (
                                  <span>Mark Verified</span>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Panel D: Loan Information & Recommendation */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-amber-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shadow-2xs shrink-0">
                            <TrendingUp size={13} />
                          </div>
                          <span className="font-extrabold text-xs text-[#0B1F3A] uppercase tracking-wider">Loan Details & Recommendation</span>
                        </div>
                        <span
                          className={`text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            selectedApplicant.recommendationStatus === 'Approved'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {selectedApplicant.recommendationStatus === 'Approved' ? <Check size={11} className="stroke-[2.5]" /> : <Clock size={11} className="stroke-[2.5]" />}
                          <span>Rec: {selectedApplicant.recommendationStatus}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                        <div className="bg-[#0B1F3A] text-white p-2.5 rounded-xl border border-slate-800 shadow-2xs">
                          <span className="text-slate-300 text-[9.5px] block font-extrabold uppercase tracking-wider">Requested Loan</span>
                          <strong className="text-sm sm:text-base font-black text-[#F3D375] tabular-nums mt-0.5 block leading-tight font-body">
                            ₹{(selectedApplicant.loanAmount || 0).toLocaleString('en-IN')}
                          </strong>
                        </div>
                        <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200/80 shadow-2xs">
                          <span className="text-blue-700 text-[9.5px] block font-extrabold uppercase tracking-wider">Proposed EMI</span>
                          <strong className="text-sm sm:text-base font-black text-[#0B1F3A] tabular-nums mt-0.5 block leading-tight font-body">
                            ₹{(selectedApplicant.proposedEmi || 0).toLocaleString('en-IN')} <span className="text-[10px] font-bold text-slate-500">/ week</span>
                          </strong>
                        </div>
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Loan Plan</span>
                          <strong className="text-slate-900 font-bold text-xs mt-0.5 block leading-snug break-words" title={selectedApplicant.loanProduct}>
                            {selectedApplicant.loanProduct}
                          </strong>
                        </div>
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Tenor</span>
                          <strong className="text-slate-900 font-bold text-xs mt-0.5 block tabular-nums">{selectedApplicant.tenorWeeks} Weeks</strong>
                        </div>
                        <div className="col-span-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-slate-500 text-[10px] block font-extrabold uppercase tracking-wider">Loan Purpose</span>
                          <p className="text-slate-800 font-semibold text-xs leading-snug mt-0.5 truncate">{selectedApplicant.loanPurpose}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Direct In-Drawer Action Card (Executive Command Center) */}
                {(() => {
                  const isAllCreditAuditDone =
                    selectedApplicant.customerVerificationStatus === 'Verified' &&
                    selectedApplicant.kycStatus === 'Verified' &&
                    selectedApplicant.documentStatus === 'Verified' &&
                    selectedApplicant.recommendationStatus === 'Approved';

                  if (isAllCreditAuditDone && activeActionStage === 'view') {
                    return (
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 border border-emerald-300 text-slate-900 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <CheckCircle2 size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-black text-emerald-950 text-xs uppercase tracking-wide">
                                Credit Manager Sanctions & Approvals Completed
                              </h4>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
                                BM Review Queued
                              </span>
                            </div>
                            <p className="text-emerald-900 font-medium text-[11px] mt-0.5 leading-snug">
                              Customer profile, KYC records, documents, and loan recommendation validated. File queued for <strong className="font-black">Branch Manager</strong> sanction.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-extrabold text-xs shadow-2xs">
                            <Check size={12} className="text-emerald-700 stroke-[2.5]" />
                            Sanction Ready
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-white to-slate-50 border border-blue-200/90 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                        <h4 className="font-extrabold text-xs text-[#0B1F3A] uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.7)] animate-pulse shrink-0" />
                          <span>Credit Manager Action:</span>
                          <span className="text-blue-700 font-black">
                            {activeActionStage === 'customer_verify'
                              ? '1. Customer Verification'
                              : activeActionStage === 'kyc_verify'
                              ? '2. KYC Verification'
                              : activeActionStage === 'loan_recommend'
                              ? '4. Loan Recommendation'
                              : activeActionStage === 'customer_approve'
                              ? '5. Customer Approval'
                              : 'Operational Audit & Actions'}
                          </span>
                        </h4>
                      </div>

                      {/* Stage 1 Form: Customer Verification */}
                      {activeActionStage === 'customer_verify' && (
                        <div className="space-y-2.5 text-xs">
                          <div>
                            <label className="font-extrabold text-slate-700 text-xs block mb-1">Customer Verification Remarks</label>
                            <input
                              type="text"
                              placeholder="e.g. Physical residence and business verified. In good community standing."
                              value={actionRemarks}
                              onChange={(e) => setActionRemarks(e.target.value)}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-semibold text-slate-900 placeholder:text-slate-400 shadow-2xs"
                            />
                          </div>
                          <div className="flex items-center gap-2.5 pt-0.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleCustomerVerify('Verified')}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95 transition-all text-xs"
                            >
                              <Check size={13} className="stroke-[2.5]" />
                              <span>Confirm Customer Verification</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCustomerVerify('Rejected')}
                              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 hover:border-rose-600 font-extrabold cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all shadow-2xs text-xs"
                            >
                              <X size={13} className="stroke-[2.5]" />
                              <span>Reject Customer</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveActionStage('view')}
                              className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold cursor-pointer active:scale-95 transition-all text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Stage 2 Form: KYC Verification */}
                      {activeActionStage === 'kyc_verify' && (
                        <div className="space-y-2.5 text-xs">
                          <div>
                            <label className="font-extrabold text-slate-700 text-xs block mb-1">Digital KYC Verification Remarks</label>
                            <input
                              type="text"
                              placeholder="e.g. Aadhaar & PAN details validated with repository."
                              value={actionRemarks}
                              onChange={(e) => setActionRemarks(e.target.value)}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-semibold text-slate-900 placeholder:text-slate-400 shadow-2xs"
                            />
                          </div>
                          <div className="flex items-center gap-2.5 pt-0.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleKycVerify('Verified')}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95 transition-all text-xs"
                            >
                              <Check size={13} className="stroke-[2.5]" />
                              <span>Confirm KYC Verification</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleKycVerify('Rejected')}
                              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 hover:border-rose-600 font-extrabold cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all shadow-2xs text-xs"
                            >
                              <X size={13} className="stroke-[2.5]" />
                              <span>Reject KYC</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveActionStage('view')}
                              className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold cursor-pointer active:scale-95 transition-all text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Stage 4 Form: Loan Recommendation */}
                      {activeActionStage === 'loan_recommend' && (
                        <div className="space-y-2.5 text-xs">
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="font-extrabold text-slate-700 text-xs block mb-1">Recommended Amount (₹)</label>
                              <input
                                type="number"
                                value={recAmount}
                                onChange={(e) => setRecAmount(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 tabular-nums text-xs font-bold text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="font-extrabold text-slate-700 text-xs block mb-1">Recommended Tenor (Weeks)</label>
                              <input
                                type="number"
                                value={recTenor}
                                onChange={(e) => setRecTenor(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 tabular-nums text-xs font-bold text-slate-900"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="font-extrabold text-slate-700 text-xs block mb-1">Recommendation Notes</label>
                            <input
                              type="text"
                              placeholder="e.g. Recommended for ₹35,000 based on verified repayment capacity and group guarantee."
                              value={actionRemarks}
                              onChange={(e) => setActionRemarks(e.target.value)}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-semibold text-slate-900 placeholder:text-slate-400 shadow-2xs"
                            />
                          </div>
                          <div className="flex items-center gap-2.5 pt-0.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleLoanRecommend('Approved')}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95 transition-all text-xs"
                            >
                              <Check size={13} className="stroke-[2.5]" />
                              <span>Submit Loan Recommendation</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLoanRecommend('Rejected')}
                              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 hover:border-rose-600 font-extrabold cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all shadow-2xs text-xs"
                            >
                              <X size={13} className="stroke-[2.5]" />
                              <span>Decline Recommendation</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveActionStage('view')}
                              className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold cursor-pointer active:scale-95 transition-all text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Stage 5 Form: Customer Approval */}
                      {activeActionStage === 'customer_approve' && (
                        <div className="space-y-2.5 text-xs">
                          <div>
                            <label className="font-extrabold text-slate-700 text-xs block mb-1">Credit Manager Approval Remarks</label>
                            <input
                              type="text"
                              placeholder="e.g. All 4 verification stages completed and validated. Approved for Branch Manager sanction."
                              value={actionRemarks}
                              onChange={(e) => setActionRemarks(e.target.value)}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-semibold text-slate-900 placeholder:text-slate-400 shadow-2xs"
                            />
                          </div>
                          <div className="flex items-center gap-2.5 pt-0.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleCustomerApproval('Approved')}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95 transition-all text-xs"
                            >
                              <Check size={13} className="stroke-[2.5]" />
                              <span>Approve Customer → Send to Branch Manager</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCustomerApproval('Rejected')}
                              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 hover:border-rose-600 font-extrabold cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all shadow-2xs text-xs"
                            >
                              <X size={13} className="stroke-[2.5]" />
                              <span>Reject Customer</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveActionStage('view')}
                              className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold cursor-pointer active:scale-95 transition-all text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Default View Mode: Available Quick Actions */}
                      {activeActionStage === 'view' && (
                        <div>
                          <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
                            <p className="text-slate-700 font-bold text-[11px]">
                              Choose a verification or decision action to execute for this applicant:
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {selectedApplicant.customerVerificationStatus === 'Pending' && (
                                <button
                                  type="button"
                                  onClick={() => setActiveActionStage('customer_verify')}
                                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold cursor-pointer shadow-xs transition-colors text-xs active:scale-95"
                                >
                                  Verify Customer
                                </button>
                              )}
                              {selectedApplicant.kycStatus === 'Pending' && (
                                <button
                                  type="button"
                                  onClick={() => setActiveActionStage('kyc_verify')}
                                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold cursor-pointer shadow-xs transition-colors text-xs active:scale-95"
                                >
                                  Verify KYC
                                </button>
                              )}
                              {(selectedApplicant.documentStatus === 'Pending' || selectedApplicant.documentStatus === 'Incomplete') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const appDocs = selectedApplicant.documents && selectedApplicant.documents.length === 4
                                      ? selectedApplicant.documents
                                      : createPdfCompliantDocuments(selectedApplicant, selectedApplicant.documents || []);
                                    appDocs.forEach((d) => {
                                      if (d.status !== 'verified') {
                                        creditManagerService.updateDocumentStatus(selectedApplicant.id, d.id, 'verified');
                                      }
                                    });
                                    addToast({
                                      type: 'success',
                                      title: 'All Documents Verified',
                                      message: `All uploaded documents for ${selectedApplicant.customerName} marked as verified.`,
                                    });
                                    loadData(true);
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold cursor-pointer shadow-xs transition-colors text-xs active:scale-95"
                                >
                                  Verify All Documents
                                </button>
                              )}
                              {selectedApplicant.recommendationStatus === 'Pending' && (
                                <button
                                  type="button"
                                  onClick={() => setActiveActionStage('loan_recommend')}
                                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold cursor-pointer shadow-xs transition-colors text-xs active:scale-95"
                                >
                                  Review Recommendation
                                </button>
                              )}
                              {selectedApplicant.finalApprovalStatus === 'Pending' && selectedApplicant.recommendationStatus === 'Approved' && (
                                <button
                                  type="button"
                                  onClick={() => setActiveActionStage('customer_approve')}
                                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold cursor-pointer shadow-xs transition-colors text-xs active:scale-95"
                                >
                                  Approve Customer
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Drawer Footer */}
              <div className="bg-white px-5 py-3 sm:px-6 sm:py-3.5 border-t border-slate-200/90 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold">
                    <Building size={12} className="text-blue-600 shrink-0" />
                    <span>Branch: <strong className="text-[#0B1F3A] font-extrabold">{selectedApplicant.branchId}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold">
                    <Calendar size={12} className="text-slate-500 shrink-0" />
                    <span>Applied: <strong className="text-slate-900 font-mono font-extrabold">{selectedApplicant.appliedDate}</strong></span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedApplicant(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95 border border-slate-300"
                >
                  Close File
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* DOCUMENT LIGHTBOX MODAL */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {previewDocument && (
            <motion.div
              key="credit-dashboard-lightbox-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setPreviewDocument(null);
                }
              }}
              className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[99999] flex flex-col items-center justify-between p-3 sm:p-5 bg-slate-950/95 backdrop-blur-md cursor-pointer select-none"
            >
            {/* Top Toolbar / Header */}
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-4xl bg-[#0B1F3A]/95 backdrop-blur-md px-4 sm:px-6 py-3 rounded-2xl border border-white/10 flex items-center justify-between gap-3 text-white shadow-2xl cursor-default shrink-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-2 h-6 bg-[#D4AF37] rounded-full shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider truncate">
                      {previewDocument.docName || previewDocument.title}
                    </span>
                    {previewDocument.customerName && (
                      <span className="text-[11px] text-slate-300 font-medium truncate hidden sm:inline">
                        • {previewDocument.customerName}
                      </span>
                    )}
                    {previewDocument.status && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        previewDocument.status === 'verified'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {previewDocument.status}
                      </span>
                    )}
                  </div>
                  {previewDocument.fileName && (
                    <p className="text-[10.5px] text-slate-400 font-mono truncate mt-0.5">
                      {previewDocument.fileName}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                  className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(1)}
                  className="px-2 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white font-mono text-[11px] font-bold transition-colors cursor-pointer"
                  title="Reset Zoom"
                >
                  {Math.round(previewZoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                  className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewRotation((r) => (r + 90) % 360)}
                  className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Rotate 90°"
                >
                  <RotateCw size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => window.open(previewDocument.url, '_blank')}
                  className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer hidden sm:flex"
                  title="Open Image in New Tab"
                >
                  <ExternalLink size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDocument(null)}
                  className="p-1.5 sm:p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/30 transition-colors shrink-0 cursor-pointer"
                  title="Close (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>

            {/* Central Dedicated Image Viewer */}
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setPreviewDocument(null);
                }
              }}
              className="flex-1 w-full max-w-5xl flex items-center justify-center p-2 sm:p-4 overflow-hidden"
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative max-w-full max-h-[78vh] flex items-center justify-center cursor-default"
              >
                <img
                  src={previewDocument.url}
                  alt={previewDocument.title}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230B1F3A"/><rect x="20" y="20" width="560" height="360" rx="12" fill="%23132B4F" stroke="%23D4AF37" stroke-width="2"/><text x="300" y="180" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23D4AF37" text-anchor="middle">${encodeURIComponent(previewDocument.docName || previewDocument.title)}</text><text x="300" y="220" font-family="sans-serif" font-size="14" fill="%2394A3B8" text-anchor="middle">Golden Leaf Finance • Document Verification</text></svg>`;
                  }}
                  onDoubleClick={() => setPreviewZoom((z) => (z > 1 ? 1 : 1.75))}
                  style={{
                    transform: `scale(${previewZoom}) rotate(${previewRotation}deg)`,
                    transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
                  }}
                  className="max-w-full max-h-[74vh] object-contain rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.7)] select-none border border-white/10"
                />
              </motion.div>
            </div>

            {/* Bottom Floating Info / Keyboard Hints */}
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-4xl bg-[#0B1F3A]/85 backdrop-blur-md px-4 sm:px-6 py-2.5 rounded-2xl border border-white/10 flex items-center justify-between text-xs text-slate-300 shadow-xl cursor-default shrink-0"
            >
              <span className="text-[11px] font-medium text-slate-400">
                Golden Leaf Finance • Confidential Identity Document
              </span>
              <div className="flex items-center gap-3 text-[11px] text-slate-300">
                <span className="hidden sm:inline text-slate-400">
                  Tip: Double-click to zoom • Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px] text-white">ESC</kbd> or click backdrop to close
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewDocument(null)}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </div>
  );
};

export default CreditDashboard;
