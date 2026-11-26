// ──────────────────────────────────────────────────
// Golden Leaf Finance — Investor Master Directory Page
// Visible in Admin Row Only (Section 1 & 3 of Functional Spec)
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Filter, Download, Eye,
  ShieldCheck, ShieldAlert, DollarSign, TrendingUp, AlertCircle, Award, Building2
} from 'lucide-react';
import type { Investor, InvestorCategory } from '../../types/investor.types';
import type { FixedDeposit } from '../../types/fd.types';
import { getInvestors, getLocalInvestors, getInvestorMetrics } from '../../services/investorService';
import { getFixedDeposits, getLocalFDs } from '../../services/fdService';
import { getStoredBranches, fetchBranchesFromSupabase, type DetailedBranch } from '../../services/branchService';
import { formatINR } from '../../utils/fdCalculations';
import { Investor360Drawer } from './components/Investor360Drawer';
import { InvestorRegistrationModal } from './components/InvestorRegistrationModal';
import { InvestorBondCertificateModal } from './components/InvestorBondCertificateModal';
import { FDBondCertificateModal } from '../fd/components/FDBondCertificateModal';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuthStore } from '../../store';

export const InvestorListPage: React.FC = () => {
  const [investors, setInvestors] = useState<Investor[]>(() => {
    try {
      return getLocalInvestors();
    } catch {
      return [];
    }
  });
  const [fds, setFDs] = useState<FixedDeposit[]>(() => {
    try {
      return getLocalFDs();
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [branches, setBranches] = useState<DetailedBranch[]>(() => {
    try {
      return getStoredBranches();
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  // Modals & Drawers state
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [viewingBondFD, setViewingBondFD] = useState<FixedDeposit | null>(null);
  const [viewingInvestorBond, setViewingInvestorBond] = useState<Investor | null>(null);

  const user = useAuthStore((s) => s.user);
  const role = user?.customClaims?.role || 'admin';
  const isAdmin = role === 'admin' || role === 'area_manager';

  const loadData = async (silent = true) => {
    try {
      if (!silent) setLoading(true);
      const [invList, fdList] = await Promise.all([
        getInvestors(),
        getFixedDeposits(),
      ]);
      setInvestors(invList);
      setFDs(fdList);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    fetchBranchesFromSupabase().then((b) => {
      if (b && b.length > 0) setBranches(b);
    }).catch(() => {});

    const handleSync = () => loadData(true);
    const handleBranches = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setBranches(e.detail);
      else setBranches(getStoredBranches());
    };
    window.addEventListener('glf_fd_updated', handleSync);
    window.addEventListener('glf_investor_updated', handleSync);
    window.addEventListener('glf-branches-updated', handleBranches);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('glf_fd_updated', handleSync);
      window.removeEventListener('glf_investor_updated', handleSync);
      window.removeEventListener('glf-branches-updated', handleBranches);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Helper to dynamically resolve capital metrics per investor
  const getInvestorStats = (inv: Investor) => {
    // Dynamic matching to all linked FDs across investorId, pan, mobile, or name
    const linked = fds.filter((f) => {
      if (f.investorId && (
        f.investorId.trim().toUpperCase() === inv.investorId.trim().toUpperCase() ||
        f.investorId === inv.id
      )) return true;
      if (f.investorPan && inv.pan && f.investorPan.trim().toUpperCase() === inv.pan.trim().toUpperCase()) return true;
      if (f.investorMobile && inv.primaryMobile && f.investorMobile.replace(/\D/g, '') === inv.primaryMobile.replace(/\D/g, '')) return true;
      if (f.investorName && inv.fullName && f.investorName.trim().toLowerCase() === inv.fullName.trim().toLowerCase()) return true;
      return false;
    });

    const activeFDs = linked.filter((f) => f.status === 'Active' || f.status === 'Maturing Soon' || f.status === 'Lien Marked');
    const activeFDsCount = activeFDs.length;

    const fdPrincipal = linked.reduce((sum, f) => sum + (Number(f.principal) || 0), 0);
    const directPrincipal = Number(inv.investmentAmount) || Number(inv.totalPrincipal) || 0;
    const principal = fdPrincipal > 0 ? fdPrincipal : directPrincipal;

    let monthly = 0;
    if (activeFDs.length > 0) {
      monthly = activeFDs.reduce((sum, f) => {
        if (f.monthlyPayout && f.monthlyPayout > 0) return sum + Number(f.monthlyPayout);
        if (f.periodicPayoutAmount && f.payoutFrequency === 'Monthly') return sum + Number(f.periodicPayoutAmount);
        if (f.periodicPayoutAmount && f.payoutFrequency === 'Quarterly') return sum + Math.round(Number(f.periodicPayoutAmount) / 3);
        if (f.periodicPayoutAmount && f.payoutFrequency === 'Yearly') return sum + Math.round(Number(f.periodicPayoutAmount) / 12);
        return sum + Math.round((Number(f.principal) * (Number(f.effectiveRate) / 100)) / 12);
      }, 0);
    } else if (principal > 0) {
      const rate = Number(inv.interestRate) || (inv.category === 'Senior Citizen' ? 10.0 : 12.0);
      monthly = Number(inv.monthlyInterest) > 0 ? Number(inv.monthlyInterest) : Math.round((principal * (rate / 100)) / 12);
    }

    let rate = Number(inv.interestRate) || 0;
    if (activeFDs.length > 0 && fdPrincipal > 0) {
      rate = activeFDs.reduce((sum, f) => sum + (Number(f.principal) * Number(f.effectiveRate)), 0) / fdPrincipal;
    }
    if (rate <= 0) {
      rate = inv.category === 'Senior Citizen' ? 10.0 : 12.0;
    }

    const tenure = inv.tenureMonths
      ? `${inv.tenureMonths}M (${inv.payoutFrequency || 'Monthly'})`
      : (inv.tenureYears ? `${inv.tenureYears}Y (${inv.payoutFrequency || 'Monthly'})` : '12M (Monthly)');

    return { principal, rate, monthly, tenure, activeFDsCount, linkedFDs: linked };
  };

  // Filtered investors
  const filteredInvestors = investors.filter((inv) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      inv.fullName.toLowerCase().includes(q) ||
      inv.primaryMobile.includes(q) ||
      inv.pan.toLowerCase().includes(q) ||
      inv.investorId.toLowerCase().includes(q);

    const matchesCategory = categoryFilter === 'all' || inv.category === categoryFilter;
    const matchesBranch =
      branchFilter === 'all' ||
      inv.branchId === branchFilter ||
      inv.branchName === branchFilter ||
      branches.find((b) => b.id === branchFilter)?.name === inv.branchName;

    return matchesSearch && matchesCategory && matchesBranch;
  });

  const totalCapitalAll = investors.reduce((s, i) => s + getInvestorStats(i).principal, 0);
  const totalMonthlyAll = investors.reduce((s, i) => s + getInvestorStats(i).monthly, 0);
  const avgRateAll = investors.length > 0
    ? investors.reduce((s, i) => s + getInvestorStats(i).rate, 0) / investors.length
    : 12.0;

  const totalCapitalShown = filteredInvestors.reduce((s, i) => s + getInvestorStats(i).principal, 0);
  const totalMonthlyShown = filteredInvestors.reduce((s, i) => s + getInvestorStats(i).monthly, 0);

  const handleExportCSV = () => {
    if (filteredInvestors.length === 0) return;
    const headers = ['Investor ID', 'Full Name', 'Branch', 'Category', 'Mobile', 'PAN', 'Active FDs', 'Total Invested (INR)', 'Monthly Outflow (INR)', 'Agreed Rate', 'Tenure / Payout', 'TDS Declaration', 'KYC Status'];
    const rows = filteredInvestors.map((i) => {
      const stats = getInvestorStats(i);
      return [
        i.investorId,
        `"${(i.fullName || '').replace(/"/g, '""')}"`,
        `"${(i.branchName || '').replace(/"/g, '""')}"`,
        i.category,
        i.primaryMobile,
        i.pan,
        stats.activeFDsCount,
        stats.principal,
        stats.monthly,
        `${stats.rate.toFixed(2)}%`,
        `"${stats.tenure}"`,
        i.taxDeclaration || 'None',
        i.kycStatus || 'Pending'
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `investor_master_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Security guard for Admin only
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-3xl bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-center text-[#DC2626] mb-4">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-display font-bold text-[#0B1F3A]">
          Architectural Security: Access Restricted
        </h2>
        <p className="text-xs text-[#64748B] mt-1.5 max-w-md">
          The <strong>INVESTOR</strong> Master column is strictly restricted to the Admin navigation row only to protect company-wide capital contributor net worth and equity privacy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#0B1F3A] flex items-center gap-2.5">
            <Users className="text-[#D4AF37]" size={26} />
            Investor Master Directory
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Registered Directors, Promoters, Shareholders & High-Net-Worth (HNW) Capital Contributors
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#CBD5E1] text-[#334155] font-semibold text-xs hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            disabled={filteredInvestors.length === 0}
          >
            <Download size={14} /> Export Directory
          </button>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md"
          >
            <Plus size={15} /> + Register New Investor
          </button>
        </div>
      </div>

      {/* Top-Level Investor Capital Portfolio KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Capital Deployed */}
        <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              1. Total Capital Contributed
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FFFDF0] flex items-center justify-center text-[#8C6808] border border-[#D4AF37]/30">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl font-display font-extrabold text-[#0B1F3A]">
            {formatINR(totalCapitalAll)}
          </div>
          <div className="text-[11px] text-[#8C6808] font-medium mt-1">
            Company-Wide Contributed Capital Pool
          </div>
        </div>

        {/* Card 2: Active Capital Contributors */}
        <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              2. Active Investors
            </span>
            <div className="w-8 h-8 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#059669] border border-[#A7F3D0]">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-display font-extrabold text-[#059669]">
            {investors.length} <span className="text-xs font-medium text-[#64748B]">Contributors</span>
          </div>
          <div className="text-[11px] text-[#059669] font-medium mt-1">
            Promoters, Directors & HNW Individuals
          </div>
        </div>

        {/* Card 3: Monthly Commitment */}
        <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              3. Monthly Outflow
            </span>
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] border border-[#BFDBFE]">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-display font-extrabold text-[#1E40AF]">
            {formatINR(totalMonthlyAll)}
          </div>
          <div className="text-[11px] text-[#2563EB] font-medium mt-1">
            Monthly Capital Return Commitment
          </div>
        </div>

        {/* Card 4: Average Return Yield */}
        <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              4. Average Agreed Return
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FAF5FF] flex items-center justify-center text-[#7C3AED] border border-[#DDD6FE]">
              <Award size={16} />
            </div>
          </div>
          <div className="text-2xl font-display font-extrabold text-[#7C3AED]">
            {avgRateAll.toFixed(2)}% <span className="text-xs font-medium text-[#64748B]">p.a.</span>
          </div>
          <div className="text-[11px] text-[#7C3AED] font-medium mt-1">
            Portfolio Weighted Annual Return Yield
          </div>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Investor ID, Name, Mobile, or PAN..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0B1F3A] outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-[#64748B]" />
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#0B1F3A] bg-white outline-none cursor-pointer"
          >
            <option value="all">All Branches ({branches.length})</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#0B1F3A] bg-white outline-none cursor-pointer"
          >
            <option value="all">All Categories ({investors.length})</option>
            <option value="Individual">Individual</option>
            <option value="Company Director">Company Director</option>
            <option value="Promoter">Promoter</option>
            <option value="Shareholder">Shareholder</option>
            <option value="Partnership Firm">Partnership Firm</option>
            <option value="Senior Citizen">Senior Citizen</option>
          </select>
        </div>
      </div>

      {/* Admin Master Investor Directory Table (Section 3) */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead className="bg-[#FAF7F0] border-b border-[#E2E8F0] text-[#8C6808] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Investor ID</th>
                <th className="p-3.5">Full Name & Branch</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Mobile No.</th>
                <th className="p-3.5">PAN No.</th>
                <th className="p-3.5 text-center">Active FDs</th>
                <th className="p-3.5 text-right">Total Invested (Rs.)</th>
                <th className="p-3.5 text-right">Monthly Outflow (Rs.)</th>
                <th className="p-3.5 text-right">Agreed Rate</th>
                <th className="p-3.5">TDS / 15G</th>
                <th className="p-3.5">KYC Status</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredInvestors.length > 0 ? (
                filteredInvestors.map((inv) => {
                  const stats = getInvestorStats(inv);
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvestor(inv)}
                      className="hover:bg-[#FFFDF7] transition-colors cursor-pointer group"
                    >
                      {/* Investor ID */}
                      <td className="p-3.5 font-mono font-bold text-[#8C6808] whitespace-nowrap">
                        {inv.investorId}
                      </td>

                      {/* Name & Branch */}
                      <td className="p-3.5">
                        <div className="font-display font-bold text-[#0B1F3A] text-xs group-hover:text-[#D4AF37] transition-colors">
                          {inv.fullName}
                        </div>
                        <div className="text-[10px] text-[#64748B] mt-0.5">{inv.branchName}</div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF7F0] text-[#8C6808] border border-[#D4AF37]/30 whitespace-nowrap">
                          {inv.category}
                        </span>
                      </td>

                      {/* Mobile */}
                      <td className="p-3.5 font-mono text-[#334155] whitespace-nowrap">
                        {inv.primaryMobile}
                      </td>

                      {/* PAN */}
                      <td className="p-3.5 font-mono font-semibold text-[#0B1F3A]">
                        {inv.pan}
                      </td>

                      {/* Active FDs */}
                      <td className="p-3.5 text-center font-mono">
                        <span
                          className={`inline-flex items-center justify-center min-w-[28px] px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            stats.activeFDsCount > 0
                              ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] font-extrabold'
                              : 'bg-[#F1F5F9] text-[#64748B]'
                          }`}
                        >
                          {stats.activeFDsCount}
                        </span>
                      </td>

                      {/* Total Principal */}
                      <td className="p-3.5 text-right font-mono font-bold text-[#0B1F3A]">
                        {formatINR(stats.principal)}
                      </td>

                      {/* Monthly Outflow */}
                      <td className="p-3.5 text-right font-mono font-semibold text-[#1E40AF]">
                        {formatINR(stats.monthly)}
                      </td>

                      {/* Agreed Rate */}
                      <td className="p-3.5 text-right font-mono font-bold text-[#059669]">
                        {stats.rate.toFixed(2)}% p.a.
                      </td>

                      {/* TDS / 15G */}
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.taxDeclaration === '15G' || inv.taxDeclaration === '15H'
                              ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                              : 'bg-[#F1F5F9] text-[#64748B]'
                          }`}
                        >
                          {inv.taxDeclaration}
                        </span>
                      </td>

                      {/* KYC */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.kycStatus === 'Verified'
                              ? 'bg-[#D1FAE5] text-[#065F46] border border-[#34D399]'
                              : 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]'
                          }`}
                        >
                          {inv.kycStatus === 'Verified' ? '✓ VERIFIED' : '⏳ PENDING'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="p-3.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedInvestor(inv)}
                            className="px-2.5 py-1 rounded-lg bg-[#FAF7F0] hover:bg-[#F3EAD3] text-[#8C6808] border border-[#D4AF37]/40 text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-sm whitespace-nowrap cursor-pointer"
                          >
                            <Eye size={12} /> View 360°
                          </button>
                          <button
                            onClick={() => setViewingInvestorBond(inv)}
                            className="px-2.5 py-1 rounded-lg bg-[#0B1F3A] hover:bg-[#1E3A8A] text-white border border-[#D4AF37]/40 text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-sm whitespace-nowrap cursor-pointer"
                            title="Print & Download Official Investor Bond Certificate"
                          >
                            <Award size={12} className="text-[#D4AF37]" /> Bond
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-[#64748B]">
                    <Users size={32} className="mx-auto mb-2 text-[#CBD5E1]" />
                    <p className="font-semibold text-sm">No investors found matching the search criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="p-4 bg-[#FAF7F0] border-t border-[#E2E8F0] flex flex-wrap items-center justify-between text-xs text-[#64748B] gap-4">
          <div className="flex items-center gap-2">
            <span>Total Investors Shown: <strong className="text-[#0B1F3A]">{filteredInvestors.length}</strong></span>
          </div>
          <div className="flex items-center gap-6">
            <span>
              Total Capital Deployed: <strong className="font-mono text-[#0B1F3A]">{formatINR(totalCapitalShown)}</strong>
            </span>
            <span>
              Total Monthly Commitment: <strong className="font-mono text-[#1E40AF]">{formatINR(totalMonthlyShown)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 360° Drawer */}
      {selectedInvestor && (
        <Investor360Drawer
          investor={selectedInvestor}
          fds={fds.filter((f) => {
            if (f.investorId && (
              f.investorId.trim().toUpperCase() === selectedInvestor.investorId.trim().toUpperCase() ||
              f.investorId === selectedInvestor.id
            )) return true;
            if (f.investorPan && selectedInvestor.pan && f.investorPan.trim().toUpperCase() === selectedInvestor.pan.trim().toUpperCase()) return true;
            if (f.investorMobile && selectedInvestor.primaryMobile && f.investorMobile.replace(/\D/g, '') === selectedInvestor.primaryMobile.replace(/\D/g, '')) return true;
            if (f.investorName && selectedInvestor.fullName && f.investorName.trim().toLowerCase() === selectedInvestor.fullName.trim().toLowerCase()) return true;
            return false;
          })}
          onClose={() => setSelectedInvestor(null)}
          onViewBond={(fd) => setViewingBondFD(fd)}
          onViewInvestorBond={(inv) => setViewingInvestorBond(inv)}
          onUpdateInvestor={(updated) => {
            setSelectedInvestor(updated);
            setInvestors((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          }}
        />
      )}

      {/* Register Modal */}
      {isRegisterOpen && (
        <InvestorRegistrationModal
          onClose={() => setIsRegisterOpen(false)}
          onSuccess={(newInv) => {
            setIsRegisterOpen(false);
            loadData();
            setSelectedInvestor(newInv);
            setViewingInvestorBond(newInv); // Instantly open Official Investor Bond!
          }}
        />
      )}

      {/* FD Bond Certificate Modal */}
      {viewingBondFD && (
        <FDBondCertificateModal
          fd={viewingBondFD}
          investor={investors.find((i) => i.investorId === viewingBondFD.investorId) || null}
          onClose={() => setViewingBondFD(null)}
        />
      )}

      {/* Official Investor Bond Certificate Modal */}
      {viewingInvestorBond && (
        <InvestorBondCertificateModal
          investor={viewingInvestorBond}
          onClose={() => setViewingInvestorBond(null)}
        />
      )}
    </div>
  );
};

export default InvestorListPage;
