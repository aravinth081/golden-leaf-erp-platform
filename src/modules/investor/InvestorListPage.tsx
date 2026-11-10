// ──────────────────────────────────────────────────
// Golden Leaf Finance — Investor Master Directory Page
// Visible in Admin Row Only (Section 1 & 3 of Functional Spec)
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Filter, Download, Eye,
  ShieldCheck, ShieldAlert, DollarSign, TrendingUp, AlertCircle
} from 'lucide-react';
import type { Investor, InvestorCategory } from '../../types/investor.types';
import type { FixedDeposit } from '../../types/fd.types';
import { getInvestors, getInvestorMetrics } from '../../services/investorService';
import { getFixedDeposits, getFDKPIMetrics } from '../../services/fdService';
import { formatINR } from '../../utils/fdCalculations';
import { FDKPIRibbon } from '../fd/components/FDKPIRibbon';
import { Investor360Drawer } from './components/Investor360Drawer';
import { InvestorRegistrationModal } from './components/InvestorRegistrationModal';
import { FDBondCertificateModal } from '../fd/components/FDBondCertificateModal';
import { FDBookingModal } from '../fd/components/FDBookingModal';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuthStore } from '../../store';

export const InvestorListPage: React.FC = () => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [fds, setFDs] = useState<FixedDeposit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modals & Drawers state
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [bookingInvestor, setBookingInvestor] = useState<Investor | null>(null);
  const [viewingBondFD, setViewingBondFD] = useState<FixedDeposit | null>(null);

  const user = useAuthStore((s) => s.user);
  const role = user?.customClaims?.role || 'admin';
  const isAdmin = role === 'admin' || role === 'area_manager';

  const loadData = async () => {
    try {
      setLoading(true);
      const [invList, fdList] = await Promise.all([
        getInvestors(),
        getFixedDeposits(),
      ]);
      setInvestors(invList);
      setFDs(fdList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const fdMetrics = getFDKPIMetrics();

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
    return matchesSearch && matchesCategory;
  });

  const totalCapitalShown = filteredInvestors.reduce((s, i) => s + (i.totalPrincipal || 0), 0);
  const totalMonthlyShown = filteredInvestors.reduce((s, i) => s + (i.monthlyInterest || 0), 0);

  const handleExportCSV = () => {
    if (filteredInvestors.length === 0) return;
    const headers = ['Investor ID', 'Full Name', 'Branch', 'Category', 'Mobile', 'PAN', 'Active FDs', 'Total Invested (INR)', 'Monthly Outflow (INR)', 'TDS Declaration', 'KYC Status'];
    const rows = filteredInvestors.map((i) => [
      i.investorId,
      `"${(i.fullName || '').replace(/"/g, '""')}"`,
      `"${(i.branchName || '').replace(/"/g, '""')}"`,
      i.category,
      i.primaryMobile,
      i.pan,
      i.activeFDsCount || 0,
      i.totalPrincipal || 0,
      i.monthlyInterest || 0,
      i.taxDeclaration || 'None',
      i.kycStatus || 'Pending'
    ]);
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

      {/* Top-Level KPI Ribbon */}
      <FDKPIRibbon metrics={fdMetrics} />

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

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-[#64748B]" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#0B1F3A] bg-white outline-none"
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
          <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
            <thead className="bg-[#FAF7F0] border-b border-[#E2E8F0] text-[#8C6808] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Investor ID</th>
                <th className="p-3.5">Full Name & Branch</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Mobile No.</th>
                <th className="p-3.5">PAN No.</th>
                <th className="p-3.5 text-right">Active FDs</th>
                <th className="p-3.5 text-right">Total Invested (Rs.)</th>
                <th className="p-3.5 text-right">Monthly Outflow (Rs.)</th>
                <th className="p-3.5">TDS / 15G</th>
                <th className="p-3.5">KYC Status</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredInvestors.length > 0 ? (
                filteredInvestors.map((inv) => (
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

                    {/* Active FDs Count */}
                    <td className="p-3.5 text-right font-bold text-[#059669]">
                      {inv.activeFDsCount}
                    </td>

                    {/* Total Principal */}
                    <td className="p-3.5 text-right font-mono font-bold text-[#0B1F3A]">
                      {formatINR(inv.totalPrincipal)}
                    </td>

                    {/* Monthly Interest */}
                    <td className="p-3.5 text-right font-mono font-semibold text-[#1E40AF]">
                      {formatINR(inv.monthlyInterest)}
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
                      <button
                        onClick={() => setSelectedInvestor(inv)}
                        className="px-2.5 py-1 rounded-lg bg-[#FAF7F0] hover:bg-[#F3EAD3] text-[#8C6808] border border-[#D4AF37]/40 text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-sm whitespace-nowrap"
                      >
                        <Eye size={12} /> View 360°
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-[#64748B]">
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
          fds={fds.filter((f) => f.investorId === selectedInvestor.investorId)}
          onClose={() => setSelectedInvestor(null)}
          onBookFD={(inv) => {
            setSelectedInvestor(null);
            setBookingInvestor(inv);
          }}
          onViewBond={(fd) => setViewingBondFD(fd)}
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
          }}
        />
      )}

      {/* FD Booking Modal */}
      {bookingInvestor && (
        <FDBookingModal
          initialInvestor={bookingInvestor}
          onClose={() => setBookingInvestor(null)}
          onSuccess={(newFD) => {
            setBookingInvestor(null);
            loadData();
            setViewingBondFD(newFD);
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
    </div>
  );
};

export default InvestorListPage;
