// ──────────────────────────────────────────────────
// Golden Leaf Finance — Gold Loan & Safe Vault Workspace
// Full Appraisal, Dual-Custody Vault Register, Overdue Notices & Redemption
// ──────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins, Search, Plus, ShieldCheck, Lock, Sparkles,
  TrendingUp, Award, Calendar, FileText, CheckCircle2,
  AlertTriangle, Eye, Printer, RefreshCw, Send, Check,
  Clock, ArrowUpRight, Scale, ChevronRight, UserCheck
} from 'lucide-react';
import { goldLoanService } from '../../../services/goldLoanService';
import {
  type GoldLoanRecord,
  type GoldLoanStatus,
  type CroGoldReferral,
} from '../../../types/goldLoan.types';
import { useAuthStore, useUIStore } from '../../../store';
import { type UserRole } from '../../../types';

// Modals & Components
import { CroGoldReferralForm } from './components/CroGoldReferralForm';
import { AdminGoldRateMasterModal } from './components/AdminGoldRateMasterModal';
import { GoldLoanAppraisalModal } from './components/GoldLoanAppraisalModal';
import { GoldLoanPawnTicketModal } from './components/GoldLoanPawnTicketModal';
import { GoldLoanRedemptionModal } from './components/GoldLoanRedemptionModal';

export const GoldLoanPage: React.FC = () => {
  const currentUser = useAuthStore((s) => s.user);
  const userRole = (currentUser?.customClaims?.role || 'admin') as UserRole;
  const { addToast } = useUIStore();

  // If user is strictly a CRO / Collection Agent: render 3-Field Referral View Only
  if (userRole === 'collection_agent') {
    return <CroGoldReferralForm />;
  }

  // State
  const [activeTab, setActiveTab] = useState<'referrals' | 'active' | 'overdue' | 'redemption'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals state
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isAppraisalModalOpen, setIsAppraisalModalOpen] = useState(false);
  const [selectedReferralForAppraisal, setSelectedReferralForAppraisal] = useState<CroGoldReferral | null>(null);
  const [selectedLoanForPawnTicket, setSelectedLoanForPawnTicket] = useState<GoldLoanRecord | null>(null);
  const [selectedLoanForRedemption, setSelectedLoanForRedemption] = useState<GoldLoanRecord | null>(null);

  // UTR Quick modal for Admin
  const [utrModalLoan, setUtrModalLoan] = useState<GoldLoanRecord | null>(null);
  const [utrNumber, setUtrNumber] = useState('');

  // Live Data
  const rateMaster = goldLoanService.getRateMaster();
  const allLoans = goldLoanService.getLoans();
  const allReferrals = goldLoanService.getCroReferrals();
  const vaultStats = goldLoanService.getVaultStats();

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  // Filtered Loans based on search query
  const filteredLoans = useMemo(() => {
    return goldLoanService.searchLoans(searchQuery);
  }, [searchQuery, refreshKey]);

  // Tab 1: Referrals filtered
  const filteredReferrals = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allReferrals;
    return allReferrals.filter(
      (r) =>
        r.customerName.toLowerCase().includes(q) ||
        r.customerMobile.includes(q) ||
        r.employeeId.toLowerCase().includes(q)
    );
  }, [allReferrals, searchQuery, refreshKey]);

  // Tab 3: Overdue Loans
  const overdueLoans = useMemo(() => {
    return filteredLoans.filter(
      (l) => l.status === 'OVERDUE_NOTICE_1' || l.status === 'OVERDUE_NOTICE_2' || l.status === 'AUCTION_INTIMATION'
    );
  }, [filteredLoans]);

  // Tab 4: Redemption & Released
  const redemptionLoans = useMemo(() => {
    return filteredLoans.filter(
      (l) => l.status === 'REDEEMED_PACKET_RELEASED' || l.status === 'ACTIVE_IN_VAULT'
    );
  }, [filteredLoans]);

  // Handlers
  const handleDualSign = (loanId: string) => {
    try {
      const role = userRole === 'credit_manager' ? 'credit_manager' : 'branch_manager';
      const signerName = currentUser?.displayName || (role === 'credit_manager' ? 'Credit Manager' : 'Branch Manager');
      goldLoanService.dualCustodyVaultSign(loanId, role, signerName);
      addToast({
        type: 'success',
        title: 'Dual-Custody Vault Signed',
        message: `Successfully verified and recorded digital signature as ${role.replace('_', ' ').toUpperCase()}.`,
      });
      handleRefresh();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Sign-off Failed', message: e.message });
    }
  };

  const handleDisburseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrModalLoan || !utrNumber.trim()) {
      addToast({ type: 'error', title: 'UTR Required', message: 'Enter valid Bank Realization UTR / Cheque clearance reference.' });
      return;
    }
    try {
      goldLoanService.disburseGoldLoan(
        utrModalLoan.id,
        utrNumber.trim(),
        currentUser?.displayName || 'Administrator'
      );
      addToast({
        type: 'success',
        title: 'Gold Loan Disbursed',
        message: `Sanctioned amount ₹${utrModalLoan.sanctionedLoanAmount.toLocaleString('en-IN')} released to borrower account.`,
      });
      setUtrModalLoan(null);
      setUtrNumber('');
      handleRefresh();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Disbursement Failed', message: e.message });
    }
  };

  const handleSendNotice = (loanId: string, stage: 'NOTICE_1' | 'NOTICE_2' | 'AUCTION_INTIMATION') => {
    try {
      const loan = goldLoanService.getLoanById(loanId);
      const interestDue = (loan?.monthlyInterestAmount || 1200) * 2;
      goldLoanService.generateOverdueNotice(loanId, stage, interestDue);
      addToast({
        type: 'success',
        title: `${stage.replace('_', ' ')} Dispatched`,
        message: `Official overdue legal notice intimation sent to customer ${loan?.customerName} via Registered SMS.`,
      });
      handleRefresh();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Notice Failed', message: e.message });
    }
  };

  const getStatusBadge = (status: GoldLoanStatus) => {
    switch (status) {
      case 'APPRAISED_AWAITING_VAULT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Appraised • Awaiting Vault</span>;
      case 'VAULT_LOCKED_PENDING_UTR':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Dual-Locked • Pending UTR</span>;
      case 'ACTIVE_IN_VAULT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Active • Sealed in Vault</span>;
      case 'OVERDUE_NOTICE_1':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">Overdue (Notice 1)</span>;
      case 'OVERDUE_NOTICE_2':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Overdue (Notice 2)</span>;
      case 'AUCTION_INTIMATION':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">Auction Scheduled</span>;
      case 'REDEEMED_PACKET_RELEASED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">Redeemed • Packet Released</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 font-body pb-12">
      {/* ── Top Header & Bullion Rates ── */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-xl bg-[#0B1F3A] text-[#D4AF37] shadow-xs">
              <Coins size={22} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-extrabold text-[#0B1F3A]">
                Gold Loan & Safe Vault Register
              </h1>
              <p className="text-xs text-gray-500">
                Daily Bullion Rates, Multi-Item Appraisal, Dual-Custody Safe Storage & Redemption Management
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Daily 22K Market Rate Badge */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-amber-50/80 border border-amber-200 text-[#0B1F3A]">
            <Sparkles size={16} className="text-[#D4AF37]" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                Today's 22K Gold Rate
              </div>
              <div className="text-sm font-extrabold text-[#0B1F3A]">
                ₹{rateMaster.daily22KRatePerGram.toLocaleString('en-IN')}/g <span className="text-[11px] font-medium text-amber-700">(Max {rateMaster.maxPermittedLtvPercent}% LTV)</span>
              </div>
            </div>
          </div>

          {/* Update Bullion Rates (Admin exclusive) */}
          {userRole === 'admin' ? (
            <button
              onClick={() => setIsRateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#163359] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RefreshCw size={14} className="text-[#D4AF37]" />
              Update Daily Rate
            </button>
          ) : (
            <button
              onClick={() => setIsRateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Eye size={14} />
              View Rate Slabs
            </button>
          )}

          {/* New Gold Appraisal Button */}
          <button
            onClick={() => {
              setSelectedReferralForAppraisal(null);
              setIsAppraisalModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus size={16} />
            New Gold Appraisal
          </button>
        </div>
      </div>

      {/* ── Top-Level Vault KPI Ribbon ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Active Vault Packets</span>
            <Lock size={18} className="text-[#0B1F3A]" />
          </div>
          <div className="text-2xl font-extrabold text-[#0B1F3A] font-display">
            {vaultStats.totalPacketsInSafe} <span className="text-xs font-medium text-gray-500">Packets</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ShieldCheck size={12} /> Double-Custody Locked
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Total Gross Weight</span>
            <Scale size={18} className="text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#0B1F3A] font-display">
            {vaultStats.totalGrossWeight.toFixed(2)} <span className="text-xs font-medium text-gray-500">grams</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Physical ornaments pledged
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Total Net Gold Weight</span>
            <Sparkles size={18} className="text-[#D4AF37]" />
          </div>
          <div className="text-2xl font-extrabold text-[#0B1F3A] font-display">
            {vaultStats.totalNetWeight.toFixed(2)} <span className="text-xs font-medium text-gray-500">grams</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-700 font-semibold">
            Pure gold backing corpus
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Disbursed Gold Corpus</span>
            <TrendingUp size={18} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#0B1F3A] font-display">
            ₹{vaultStats.totalDisbursedCorpus.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Active loan portfolio
          </div>
        </div>
      </div>

      {/* ── Instant Customer & Packet Identification Bar ── */}
      <div className="bg-white rounded-2xl p-3 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Scan / Search by Mobile No., Customer Name, Gold Loan ID (GLF-GL-...), or Packet Serial (GLF-PKT-...)"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-xs focus:outline-none focus:border-[#0B1F3A] focus:bg-white transition-all text-[#0B1F3A]"
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 shrink-0 font-medium"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* ── 4 Operational Tabs ── */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 px-4 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'active'
              ? 'border-[#0B1F3A] text-[#0B1F3A]'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Lock size={15} />
          Active Gold Loans & Vault Register
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-bold">
            {allLoans.filter((l) => l.status === 'ACTIVE_IN_VAULT' || l.status.startsWith('APPRAISED') || l.status.startsWith('VAULT_LOCKED')).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('referrals')}
          className={`pb-3 px-4 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'referrals'
              ? 'border-[#0B1F3A] text-[#0B1F3A]'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Send size={15} />
          CRO Referrals & Appraisals
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 font-bold">
            {allReferrals.filter((r) => r.status === 'PENDING').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`pb-3 px-4 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overdue'
              ? 'border-[#0B1F3A] text-[#0B1F3A]'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <AlertTriangle size={15} />
          Overdue Interest & Renewals
          {overdueLoans.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 font-bold">
              {overdueLoans.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('redemption')}
          className={`pb-3 px-4 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'redemption'
              ? 'border-[#0B1F3A] text-[#0B1F3A]'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <CheckCircle2 size={15} />
          Redemption & Safe Packet Release
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold">
            {allLoans.filter((l) => l.status === 'REDEEMED_PACKET_RELEASED').length}
          </span>
        </button>
      </div>

      {/* ── TAB 1: CRO REFERRALS & NEW APPRAISALS ── */}
      {activeTab === 'referrals' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#0B1F3A]">CRO Lead Referrals Queue</h3>
              <p className="text-[11px] text-gray-500">
                Customer leads referred by CROs from the field. Convert into gold appraisal with 1-click.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedReferralForAppraisal(null);
                setIsAppraisalModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#0B1F3A] hover:bg-[#163359] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} className="text-[#D4AF37]" />
              Direct Walk-In Appraisal
            </button>
          </div>

          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full text-left text-xs min-w-[1100px]">
              <thead className="bg-gray-100/70 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Referral ID</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Referring CRO</th>
                  <th className="py-3 px-4">Referred On</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No referrals found matching the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReferrals.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0B1F3A]">{r.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-[#0B1F3A]">{r.customerName}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{r.customerMobile}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold text-[11px]">
                          {r.employeeId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-[11px]">{r.referredAt}</td>
                      <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate text-[11px]">{r.notes || '—'}</td>
                      <td className="py-3.5 px-4">
                        {r.status === 'PENDING' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            PENDING CONTACT
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            CONVERTED: {r.convertedGoldLoanId}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {r.status === 'PENDING' ? (
                          <button
                            onClick={() => {
                              setSelectedReferralForAppraisal(r);
                              setIsAppraisalModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#C9A227] text-white text-[11px] font-bold transition-colors shadow-xs"
                          >
                            Appraise Loan
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (r.convertedGoldLoanId) {
                                setSearchQuery(r.convertedGoldLoanId);
                                setActiveTab('active');
                              }
                            }}
                            className="text-xs text-[#0B1F3A] hover:underline font-bold"
                          >
                            View Gold Loan
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: ACTIVE GOLD LOANS & VAULT REGISTER ── */}
      {activeTab === 'active' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-[#0B1F3A]">
                Digital Safe Vault Register & Pledged Inventory
              </h3>
              <p className="text-[11px] text-gray-500">
                Dual-Custody Lock System: Credit Manager Appraiser + Branch Manager Key Custodian Sign-off
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Vault Active • Total Pledged: {vaultStats.totalGrossWeight.toFixed(2)} g
            </div>
          </div>

          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full text-left text-xs min-w-[1100px]">
              <thead className="bg-gray-100/70 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Loan ID & Date</th>
                  <th className="py-3 px-4">Tamper-Proof Packet</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Weight & Ornaments</th>
                  <th className="py-3 px-4">Safe Location</th>
                  <th className="py-3 px-4">Sanction & Scheme</th>
                  <th className="py-3 px-4">Dual-Custody Sign</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-400">
                      No gold loans found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => {
                    const cmSigned = loan.dualCustodySignoff.isCreditManagerAppraised;
                    const bmSigned = loan.dualCustodySignoff.isBranchManagerVaultLocked;
                    const bothSigned = cmSigned && bmSigned;

                    return (
                      <tr key={loan.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-[#0B1F3A]">{loan.id}</div>
                          <div className="text-[10px] text-gray-400">{loan.createdAt.slice(0, 10)}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-extrabold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block text-[11px]">
                            {loan.tamperProofPacketSerialNo}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-[#0B1F3A]">{loan.customerName}</div>
                          <div className="text-[11px] text-gray-500 font-mono">{loan.customerMobile}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-800">
                            {loan.totalNetWeightGrams.toFixed(2)} g Net{' '}
                            <span className="text-[10px] text-gray-400 font-normal">
                              ({loan.totalGrossWeightGrams.toFixed(2)} g Gross)
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {loan.totalQuantity} items ({loan.items.map((i) => i.ornamentType).slice(0, 2).join(', ')}
                            {loan.items.length > 2 ? '...' : ''})
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0B1F3A] text-[11px]">
                            {loan.safeVaultLocation.safeNumber}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {loan.safeVaultLocation.rackCabinet} • {loan.safeVaultLocation.traySlot}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-[#0B1F3A]">
                            ₹{loan.sanctionedLoanAmount.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            ₹{loan.monthlyInterestAmount}/mo ({loan.interestRateAnnual}% p.a.)
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                                cmSigned ? 'text-emerald-700' : 'text-gray-400'
                              }`}
                            >
                              {cmSigned ? '✓ CM Sign' : '○ CM Sign'}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                                bmSigned ? 'text-emerald-700' : 'text-gray-400'
                              }`}
                            >
                              {bmSigned ? '✓ BM Sign' : '○ BM Sign'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(loan.status)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Pawn Ticket Print */}
                            <button
                              onClick={() => setSelectedLoanForPawnTicket(loan)}
                              title="Official Pawn Ticket & Pledge Receipt"
                              className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <Printer size={13} />
                              Ticket
                            </button>

                            {/* Dual Custody Sign if pending */}
                            {!bothSigned && (
                              <button
                                onClick={() => handleDualSign(loan.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#163359] text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                              >
                                <Lock size={12} className="text-[#D4AF37]" />
                                Sign
                              </button>
                            )}

                            {/* Admin Disburse UTR */}
                            {userRole === 'admin' && bothSigned && loan.status === 'VAULT_LOCKED_PENDING_UTR' && (
                              <button
                                onClick={() => {
                                  setUtrModalLoan(loan);
                                  setUtrNumber(`UTR${Date.now().toString().slice(-8)}`);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                              >
                                <Sparkles size={12} />
                                Disburse
                              </button>
                            )}

                            {/* Redemption / Packet Release */}
                            {loan.status === 'ACTIVE_IN_VAULT' && (
                              <button
                                onClick={() => setSelectedLoanForRedemption(loan)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                              >
                                <Award size={12} />
                                Redeem
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: OVERDUE INTEREST & RENEWALS ── */}
      {activeTab === 'overdue' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-rose-50/40 border-b border-rose-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#0B1F3A]">Overdue Interest Escalation & Statutory Notices</h3>
              <p className="text-[11px] text-gray-500">
                3-Tier Statutory Warning Cycle: Notice 1 (7-Day) → Notice 2 (15-Day) → Auction Intimation (30-Day)
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
              {overdueLoans.length} Loans Under Escalation
            </span>
          </div>

          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full text-left text-xs min-w-[1100px]">
              <thead className="bg-gray-100/70 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Loan ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Sanction Amount</th>
                  <th className="py-3 px-4">Maturity Date</th>
                  <th className="py-3 px-4">Notices Issued</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-right">Escalation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {overdueLoans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No gold loans currently flagged as overdue.
                    </td>
                  </tr>
                ) : (
                  overdueLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50/70">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0B1F3A]">{loan.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-[#0B1F3A]">{loan.customerName}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{loan.customerMobile}</div>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#0B1F3A]">
                        ₹{loan.sanctionedLoanAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 font-medium">{loan.maturityDate}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-semibold text-gray-700">
                          {loan.overdueNotices.length} Notice(s) Sent
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(loan.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSendNotice(loan.id, 'NOTICE_1')}
                            className="px-2.5 py-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-900 text-[11px] font-bold"
                          >
                            Send Notice 1
                          </button>
                          <button
                            onClick={() => handleSendNotice(loan.id, 'NOTICE_2')}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 text-[11px] font-bold"
                          >
                            Send Notice 2
                          </button>
                          <button
                            onClick={() => handleSendNotice(loan.id, 'AUCTION_INTIMATION')}
                            className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold"
                          >
                            Auction Intimation
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
      )}

      {/* ── TAB 4: REDEMPTION & GOLD PACKET RELEASE ── */}
      {activeTab === 'redemption' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#0B1F3A]">
                Redemption & Safe Vault Release Acknowledgment
              </h3>
              <p className="text-[11px] text-gray-500">
                Physical Ornament Handover • Original Pawn Ticket Surrender • Sample 12 Part B Compliant
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-500">
              Closed Vault Records: {allLoans.filter((l) => l.status === 'REDEEMED_PACKET_RELEASED').length}
            </span>
          </div>

          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full text-left text-xs min-w-[1100px]">
              <thead className="bg-gray-100/70 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Loan ID</th>
                  <th className="py-3 px-4">Packet Serial</th>
                  <th className="py-3 px-4">Borrower Name</th>
                  <th className="py-3 px-4">Net Gold Weight</th>
                  <th className="py-3 px-4">Redemption Status</th>
                  <th className="py-3 px-4">Release Receipt / NOC</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {redemptionLoans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No loans available in redemption ledger.
                    </td>
                  </tr>
                ) : (
                  redemptionLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50/70">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0B1F3A]">{loan.id}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-900">
                        {loan.tamperProofPacketSerialNo}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-[#0B1F3A]">{loan.customerName}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{loan.customerMobile}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-800">
                        {loan.totalNetWeightGrams.toFixed(2)} g
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(loan.status)}</td>
                      <td className="py-3.5 px-4">
                        {loan.redemption ? (
                          <div className="text-[11px]">
                            <div className="font-bold text-emerald-800">{loan.redemption.receiptNo}</div>
                            <div className="text-[10px] text-gray-500">{loan.redemption.redemptionDate.slice(0, 10)}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11px]">Active in Vault</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {loan.status === 'REDEEMED_PACKET_RELEASED' ? (
                          <button
                            onClick={() => setSelectedLoanForRedemption(loan)}
                            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold flex items-center gap-1 transition-colors ml-auto"
                          >
                            <Printer size={13} />
                            Print Release Slip
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedLoanForRedemption(loan)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1 transition-colors ml-auto"
                          >
                            <Award size={13} />
                            Execute Release
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modals Integration ── */}
      {/* 1. Daily Bullion Rate Modal */}
      <AdminGoldRateMasterModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        onRateUpdated={handleRefresh}
      />

      {/* 2. Full Gold Appraisal & Vault Pledge Modal */}
      <GoldLoanAppraisalModal
        isOpen={isAppraisalModalOpen}
        onClose={() => setIsAppraisalModalOpen(false)}
        initialReferral={selectedReferralForAppraisal}
        onSuccess={(newLoan) => {
          setIsAppraisalModalOpen(false);
          handleRefresh();
          setSelectedLoanForPawnTicket(newLoan);
        }}
      />

      {/* 3. Official Pawn Ticket & Pledge Receipt Modal (Sample 12 Part A) */}
      <GoldLoanPawnTicketModal
        isOpen={!!selectedLoanForPawnTicket}
        onClose={() => setSelectedLoanForPawnTicket(null)}
        loan={selectedLoanForPawnTicket}
      />

      {/* 4. Gold Redemption & Release Acknowledgment Modal (Sample 12 Part B) */}
      <GoldLoanRedemptionModal
        isOpen={!!selectedLoanForRedemption}
        onClose={() => setSelectedLoanForRedemption(null)}
        loan={selectedLoanForRedemption}
        onRedemptionSuccess={() => {
          handleRefresh();
        }}
      />

      {/* 5. Admin UTR Disbursement Modal */}
      {utrModalLoan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200">
            <h3 className="text-base font-extrabold text-[#0B1F3A] mb-1">
              Release Gold Loan Disbursement
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter Bank Realization UTR / NEFT / IMPS reference to release{' '}
              <strong>₹{utrModalLoan.sanctionedLoanAmount.toLocaleString('en-IN')}</strong> to{' '}
              <strong>{utrModalLoan.customerName}</strong>.
            </p>

            <form onSubmit={handleDisburseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Bank Realization UTR / Reference No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. UTR8829103984"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:border-[#0B1F3A] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUtrModalLoan(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Confirm & Disburse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoldLoanPage;
