// ──────────────────────────────────────────────────
// Golden Leaf Finance — Business Loan Management Hub
// Instant Customer Identification Bar • 6 Operational Queue Tabs • 4-Box Layout
// ──────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Search, Plus, Filter, RotateCcw, AlertTriangle,
  CheckCircle2, Clock, DollarSign, FileText, ChevronRight,
  TrendingUp, Award, ShieldCheck, User, Building, MapPin,
  Calendar, Layers, Sparkles
} from 'lucide-react';
import { businessLoanService } from '../../../services/businessLoanService';
import {
  type BusinessLoanRecord,
  type BusinessLoanStatus,
} from '../../../types/businessLoan.types';
import { BusinessLoanApplicationModal } from './components/BusinessLoanApplicationModal';
import { BusinessLoanDetailModal } from './components/BusinessLoanDetailModal';
import { BusinessLoanSanctionLetterModal } from './components/BusinessLoanSanctionLetterModal';
import { BusinessLoanReceiptModal } from './components/BusinessLoanReceiptModal';
import { BusinessLoanNOCModal } from './components/BusinessLoanNOCModal';
import { useAuthStore, useUIStore } from '../../../store';

type BusinessQueueTab =
  | 'active'
  | 'pending_cm'
  | 'returned_cro'
  | 'pending_admin'
  | 'today_collection'
  | 'pre_closure';

export const BusinessLoanPage: React.FC = () => {
  const currentUser = useAuthStore((s) => s.user);
  const userRole = currentUser?.customClaims?.role || 'admin';
  const { addToast } = useUIStore();

  // Search & Active Tab
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<BusinessQueueTab>('active');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals state
  const [isNewApplicationOpen, setIsNewApplicationOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<BusinessLoanRecord | null>(null);
  const [sanctionModalLoan, setSanctionModalLoan] = useState<BusinessLoanRecord | null>(null);
  const [receiptModalData, setReceiptModalData] = useState<{
    loan: BusinessLoanRecord;
    receipt: any;
  } | null>(null);
  const [nocModalLoan, setNocModalLoan] = useState<BusinessLoanRecord | null>(null);

  // Load all loans
  const allLoans = useMemo(() => {
    return businessLoanService.getLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Live KPI metrics
  const kpiStats = useMemo(() => {
    return businessLoanService.getLiveCollectionStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLoans, refreshKey]);

  // Tab Counts
  const tabCounts = useMemo(() => {
    return {
      active: allLoans.filter((l) => l.status === 'ACTIVE_COLLECTING').length,
      pending_cm: allLoans.filter((l) => l.status === 'SUBMITTED_BY_CRO').length,
      returned_cro: allLoans.filter((l) => l.status === 'RETURNED_TO_CRO').length,
      pending_admin: allLoans.filter((l) => l.status === 'BRANCH_VERIFIED').length,
      today_collection: allLoans.filter((l) => l.status === 'ACTIVE_COLLECTING' && l.collections && l.collections.length > 0).length,
      pre_closure: allLoans.filter((l) => l.status === 'PRE_CLOSURE_REQUESTED' || l.status === 'CLOSED_NOC_ISSUED').length,
    };
  }, [allLoans]);

  // Filtered List according to Search and Active Tab
  const filteredList = useMemo(() => {
    let list = allLoans;

    // Filter by tab
    if (activeTab === 'active') {
      list = list.filter((l) => l.status === 'ACTIVE_COLLECTING');
    } else if (activeTab === 'pending_cm') {
      list = list.filter((l) => l.status === 'SUBMITTED_BY_CRO');
    } else if (activeTab === 'returned_cro') {
      list = list.filter((l) => l.status === 'RETURNED_TO_CRO');
    } else if (activeTab === 'pending_admin') {
      list = list.filter((l) => l.status === 'BRANCH_VERIFIED');
    } else if (activeTab === 'today_collection') {
      list = list.filter((l) => l.status === 'ACTIVE_COLLECTING' && l.collections && l.collections.length > 0);
    } else if (activeTab === 'pre_closure') {
      list = list.filter((l) => l.status === 'PRE_CLOSURE_REQUESTED' || l.status === 'CLOSED_NOC_ISSUED');
    }

    // Filter by search term
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (l) =>
          l.customerName.toLowerCase().includes(q) ||
          l.primaryMobile.includes(q) ||
          l.id.toLowerCase().includes(q) ||
          l.businessName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allLoans, activeTab, searchTerm]);

  return (
    <div className="space-y-6 pb-16 font-body text-gray-900">
      {/* ─── Hero Banner ─── */}
      <div className="bg-gradient-to-r from-[#0B1F3A] via-[#132c4e] to-[#0B1F3A] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold tracking-wide uppercase">
              <Store size={14} className="text-[#D4AF37]" />
              Business Loan Management • Retail Trade & Working Capital
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-serif text-white">
              Business Loan Portfolio & Field Operations
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Originate 4-Box field applications, verify live nameboard photos, track daily/weekly/monthly repayments, and manage 3-step pre-closures with official NOCs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsNewApplicationOpen(true)}
              className="px-5 py-3 rounded-2xl bg-[#D4AF37] hover:bg-[#c49f27] text-[#0B1F3A] font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus size={16} />
              <span>New Business Loan Form</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Top KPI Ribbon (Admin & Live Collection Sequence) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Active Portfolio</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-[#0B1F3A]">{kpiStats.activeLoansCount} Loans</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Active Pool
            </span>
          </div>
          <p className="text-[10px] text-gray-400">Daily, Weekly & Monthly Collections</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-500 block">Today's Total Collection</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-emerald-700 font-mono">
              ₹{kpiStats.todayCollected.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Live Day Total
            </span>
          </div>
          <p className="text-[10px] text-gray-400">Step 1 in Admin Sequence</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Collected Till Time</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-blue-900 font-mono">
              ₹{kpiStats.totalCollectedTillTime.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Realized
            </span>
          </div>
          <p className="text-[10px] text-gray-400">Step 2 in Admin Sequence</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-500 block">Pending Collection Balance</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-amber-700 font-mono">
              ₹{kpiStats.pendingCollection.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              Outstanding
            </span>
          </div>
          <p className="text-[10px] text-gray-400">Step 3 in Admin Sequence</p>
        </div>
      </div>

      {/* ─── INSTANT CUSTOMER IDENTIFICATION BAR ─── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Enter 10-Digit Mobile No., Customer Name, or Business Loan ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#0B1F3A] outline-none transition-all"
            />
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Showing <strong className="text-[#0B1F3A]">{filteredList.length}</strong> matching loans
          </div>
        </div>

        {/* ─── Operational Queue Tabs ─── */}
        <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
          {[
            { id: 'active', label: 'Active Loans', count: tabCounts.active, color: 'text-emerald-700' },
            { id: 'pending_cm', label: 'Pending CM Verification', count: tabCounts.pending_cm, color: 'text-blue-700' },
            { id: 'returned_cro', label: 'Returned to CRO', count: tabCounts.returned_cro, color: 'text-amber-700' },
            { id: 'pending_admin', label: 'Pending Admin Disbursement', count: tabCounts.pending_admin, color: 'text-purple-700' },
            { id: 'today_collection', label: "Today's Collection", count: tabCounts.today_collection, color: 'text-emerald-700' },
            { id: 'pre_closure', label: 'Pre-Closure Queue', count: tabCounts.pre_closure, color: 'text-red-700' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as BusinessQueueTab)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#0B1F3A] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── LOANS LISTING CARDS ─── */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 space-y-3">
            <Store className="mx-auto text-gray-300" size={42} />
            <h3 className="font-bold text-[#0B1F3A] text-sm">No Business Loans in this queue</h3>
            <p className="text-gray-500 text-xs max-w-md mx-auto">
              There are no loan applications matching your search or active filter tab.
            </p>
          </div>
        ) : (
          filteredList.map((loan) => (
            <motion.div
              key={loan.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs hover:border-[#D4AF37]/50 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-extrabold text-[#0B1F3A] text-sm sm:text-base">
                      {loan.customerName}
                    </h3>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                      {loan.id}
                    </span>
                    {/* Status Badge */}
                    {loan.status === 'ACTIVE_COLLECTING' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        ✓ ACTIVE – COLLECTING
                      </span>
                    )}
                    {loan.status === 'SUBMITTED_BY_CRO' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        ● SUBMITTED BY CRO
                      </span>
                    )}
                    {loan.status === 'RETURNED_TO_CRO' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                        ⚠ RETURNED TO CRO
                      </span>
                    )}
                    {loan.status === 'BRANCH_VERIFIED' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                        ★ BRANCH VERIFIED
                      </span>
                    )}
                    {loan.status === 'PRE_CLOSURE_REQUESTED' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-800 border border-red-300">
                        ⧗ PRE-CLOSURE REQUESTED
                      </span>
                    )}
                    {loan.status === 'CLOSED_NOC_ISSUED' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                        ✔ CLOSED & NOC ISSUED
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs">
                    <strong className="text-gray-800">{loan.businessName}</strong> ({loan.businessCategory}) • {loan.branchName} • Originated by {loan.originatingCroName}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => setSanctionModalLoan(loan)}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#0B1F3A] font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <FileText size={13} className="text-[#D4AF37]" />
                    <span>Sanction KFS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedLoan(loan)}
                    className="px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#132c4e] text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    <span>Manage / Review</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs pt-1">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Sanctioned Amount</span>
                  <strong className="text-emerald-800 text-sm font-bold">₹{loan.sanctionedAmount.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Installment (Mode)</span>
                  <strong className="text-[#0B1F3A]">
                    ₹{loan.exactEmiPerPeriod.toLocaleString('en-IN')} / {loan.collectionFrequency === 'Daily' ? 'Day' : loan.collectionFrequency === 'Weekly' ? 'Wk' : 'Mo'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Tenure</span>
                  <strong className="text-gray-800">
                    {loan.tenureUnits} {loan.collectionFrequency === 'Daily' ? 'Days' : loan.collectionFrequency === 'Weekly' ? 'Weeks' : 'Months'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Collected / Balance</span>
                  <strong className="text-gray-900 font-mono">
                    ₹{loan.totalCollectedTillDate.toLocaleString('en-IN')} / <span className="text-red-700">₹{loan.pendingOutstandingBalance.toLocaleString('en-IN')}</span>
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">5-Doc Verification</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                    <ShieldCheck size={11} /> 5/5 Attached
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ─── MODALS ─── */}
      <BusinessLoanApplicationModal
        isOpen={isNewApplicationOpen}
        onClose={() => setIsNewApplicationOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      <BusinessLoanDetailModal
        isOpen={!!selectedLoan}
        onClose={() => setSelectedLoan(null)}
        loan={selectedLoan}
        onLoanUpdated={(updated) => {
          setSelectedLoan(updated);
          setRefreshKey((k) => k + 1);
        }}
        onOpenSanctionLetter={(l) => setSanctionModalLoan(l)}
        onOpenReceipt={(l, r) => setReceiptModalData({ loan: l, receipt: r })}
        onOpenNOC={(l) => setNocModalLoan(l)}
      />

      <BusinessLoanSanctionLetterModal
        isOpen={!!sanctionModalLoan}
        onClose={() => setSanctionModalLoan(null)}
        loan={sanctionModalLoan}
      />

      <BusinessLoanReceiptModal
        isOpen={!!receiptModalData}
        onClose={() => setReceiptModalData(null)}
        loan={receiptModalData?.loan || null}
        receipt={receiptModalData?.receipt || null}
      />

      <BusinessLoanNOCModal
        isOpen={!!nocModalLoan}
        onClose={() => setNocModalLoan(null)}
        loan={nocModalLoan}
      />
    </div>
  );
};

export default BusinessLoanPage;
