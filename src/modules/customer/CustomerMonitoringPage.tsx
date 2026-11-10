// ──────────────────────────────────────────────────
// GOLDEN LEAF FINANCE — CUSTOMER MONITORING
// PDF-Strict Customer Oversight & Digital KYC Verification
// Module: Customer Management + Digital KYC
// Read-only inspection of Customer Profile, History, Group & Digital KYC
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Eye,
  X,
  User,
  Phone,
  MapPin,
  ShieldCheck,
  Clock,
  CheckCircle2,
  FileText,
  Users,
  Sparkles,
  RotateCcw,
  Building2,
  CreditCard,
  Calendar,
  Check,
  AlertTriangle,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Keyboard,
} from 'lucide-react';
import { MonitoringNav } from '../monitoring/MonitoringNav';
import { useUIStore } from '../../store';
import { Avatar } from '../../components/ui';
import {
  getMonitoredCustomers,
  type MonitoredCustomer,
} from '../../services/monitoringDataService';

export const CustomerMonitoringPage: React.FC = () => {
  const selectedBranchId = useUIStore((s) => s.selectedBranchId);
  const [customers, setCustomers] = useState<MonitoredCustomer[]>([]);
  const [kycFilter, setKycFilter] = useState<'all' | 'Verified' | 'Pending' | 'Active'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<MonitoredCustomer | null>(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(0);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load branch-filtered customers
  useEffect(() => {
    const list = getMonitoredCustomers(selectedBranchId);
    setCustomers(list);
  }, [selectedBranchId]);

  // Keep focusedRowIndex within bounds when list length changes
  useEffect(() => {
    setFocusedRowIndex((prev) => {
      if (customers.length === 0) return 0;
      return Math.min(prev, Math.max(0, customers.length - 1));
    });
  }, [customers.length]);

  const fmt = (num?: number) => (typeof num === 'number' ? `₹${num.toLocaleString('en-IN')}` : '₹0');

  // Customer portfolio KPI metrics
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const verifiedCount = customers.filter((c) => c.kycStatus === 'Verified').length;
    const pendingKycCount = customers.filter((c) => c.kycStatus === 'Pending').length;
    const activeAccountsCount = customers.filter((c) => c.status === 'Active').length;
    const distinctGroupsCount = new Set(customers.map((c) => c.groupName)).size;
    const distinctCentersCount = new Set(customers.map((c) => c.centerName)).size;
    const totalExposure = customers.reduce((acc, c) => acc + (c.activeLoanAmount || 0), 0);
    const kycComplianceRate = totalCustomers > 0 ? Math.round((verifiedCount / totalCustomers) * 100) : 0;

    return {
      totalCustomers,
      verifiedCount,
      pendingKycCount,
      activeAccountsCount,
      distinctGroupsCount,
      distinctCentersCount,
      totalExposure,
      kycComplianceRate,
    };
  }, [customers]);

  // Search & filter
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return customers.filter((c) => {
      let matchesFilter = true;
      if (kycFilter === 'Verified') matchesFilter = c.kycStatus === 'Verified';
      else if (kycFilter === 'Pending') matchesFilter = c.kycStatus === 'Pending';
      else if (kycFilter === 'Active') matchesFilter = c.status === 'Active';

      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.groupName.toLowerCase().includes(q) ||
        c.centerName.toLowerCase().includes(q) ||
        (c.branchName && c.branchName.toLowerCase().includes(q)) ||
        (c.activeLoanId && c.activeLoanId.toLowerCase().includes(q));

      return matchesFilter && matchesSearch;
    });
  }, [customers, kycFilter, searchQuery]);

  const isAnyFilterActive = kycFilter !== 'all' || searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setKycFilter('all');
    setSearchQuery('');
  };

  // Keyboard Navigation: Up/Down row highlight, Enter to inspect, Esc to close, Left/Right in modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (e.key === 'Escape') {
        if (selectedCustomer) {
          setSelectedCustomer(null);
          return;
        }
        if (isInput) {
          target?.blur();
          return;
        }
      }

      // If user presses '/' when not in input, focus search box
      if (e.key === '/' && !isInput && !selectedCustomer) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (isInput) return;

      // Inside Modal: Left / Right / Up / Down / PageUp / PageDown cycles records
      if (selectedCustomer) {
        const curIdx = filteredCustomers.findIndex((c) => c.id === selectedCustomer.id);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
          e.preventDefault();
          if (filteredCustomers.length > 0) {
            const nextIdx = curIdx >= 0 && curIdx < filteredCustomers.length - 1 ? curIdx + 1 : 0;
            setSelectedCustomer(filteredCustomers[nextIdx]);
            setFocusedRowIndex(nextIdx);
            rowRefs.current[nextIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
          e.preventDefault();
          if (filteredCustomers.length > 0) {
            const prevIdx = curIdx > 0 ? curIdx - 1 : filteredCustomers.length - 1;
            setSelectedCustomer(filteredCustomers[prevIdx]);
            setFocusedRowIndex(prevIdx);
            rowRefs.current[prevIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }
        return;
      }

      // Table Row navigation when modal is NOT open
      if (filteredCustomers.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRowIndex((prev) => {
          const next = Math.min(filteredCustomers.length - 1, prev + 1);
          rowRefs.current[next]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRowIndex((prev) => {
          const next = Math.max(0, prev - 1);
          rowRefs.current[next]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return next;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filteredCustomers[focusedRowIndex];
        if (item) setSelectedCustomer(item);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCustomer, filteredCustomers, focusedRowIndex]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 sm:p-5 lg:p-6 flex flex-col gap-5 pb-12 font-sans max-w-full text-[#0B1F3A]"
    >
      {/* Shared Navigation Header */}
      <MonitoringNav currentTab="customers" />

      {/* ── 1. EXECUTIVE KPI SUMMARY (CUSTOMER & DIGITAL KYC METRICS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Enrolled Borrowers */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-[0_2px_8px_rgba(11,31,58,0.04)] hover:shadow-md hover:border-[#D4AF37]/50 transition-all duration-200 flex flex-col justify-between min-h-[142px] group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans leading-tight">
              Enrolled Borrowers
            </span>
            <div className="w-8.5 h-8.5 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80 shadow-2xs group-hover:scale-105 transition-transform">
              <Users size={16} />
            </div>
          </div>
          <div className="my-2.5 flex items-baseline justify-between">
            <span className="text-2xl sm:text-[26px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums">
              {stats.totalCustomers}
            </span>
            <span className="text-[10.5px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {stats.activeAccountsCount} Active
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block shrink-0" />
            <span className="truncate">Total registered borrower network</span>
          </div>
        </div>

        {/* Card 2: Digital KYC Compliance */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-[0_2px_8px_rgba(11,31,58,0.04)] hover:shadow-md hover:border-[#D4AF37]/50 transition-all duration-200 flex flex-col justify-between min-h-[142px] group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans leading-tight">
              Digital KYC Compliance
            </span>
            <div className="w-8.5 h-8.5 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/80 shadow-2xs group-hover:scale-105 transition-transform">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="my-2.5 flex items-baseline justify-between">
            <span className="text-2xl sm:text-[26px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums">
              {stats.verifiedCount}
            </span>
            <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {stats.kycComplianceRate}% Verified
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block shrink-0" />
            <span className="truncate">Aadhaar &amp; biometric validated records</span>
          </div>
        </div>

        {/* Card 3: Lending Circles & Groups */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-[0_2px_8px_rgba(11,31,58,0.04)] hover:shadow-md hover:border-[#D4AF37]/50 transition-all duration-200 flex flex-col justify-between min-h-[142px] group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans leading-tight">
              Lending Circles &amp; Groups
            </span>
            <div className="w-8.5 h-8.5 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/80 shadow-2xs group-hover:scale-105 transition-transform">
              <Building2 size={16} />
            </div>
          </div>
          <div className="my-2.5 flex items-baseline justify-between">
            <span className="text-2xl sm:text-[26px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums">
              {stats.distinctGroupsCount} Groups
            </span>
            <span className="text-[10.5px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {stats.distinctCentersCount} Centers
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span className="truncate">Self-Help &amp; Joint Liability Groups</span>
          </div>
        </div>

        {/* Card 4: Total Active Credit Exposure */}
        <div className="bg-gradient-to-br from-[#0B1F3A] to-[#163864] text-white rounded-2xl p-5 shadow-[0_2px_10px_rgba(11,31,58,0.15)] flex flex-col justify-between min-h-[142px] relative overflow-hidden group">
          <CreditCard size={80} className="absolute -right-4 -bottom-4 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
              Total Credit Exposure
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="my-2.5">
            <div className="text-2xl sm:text-[26px] font-extrabold text-white font-manrope tracking-tight tabular-nums">
              {fmt(stats.totalExposure)}
            </div>
            <div className="text-[11.5px] text-[#D4AF37] font-semibold mt-0.5">
              Live active loans sanctioned
            </div>
          </div>
          <div className="pt-2 border-t border-white/10 text-[10.5px] text-slate-300 flex items-center gap-1.5 truncate">
            <Sparkles size={11} className="text-[#D4AF37] shrink-0" />
            <span className="truncate">Active borrower principal balances</span>
          </div>
        </div>
      </div>

      {/* ── 2. FILTER & CONTROLS TOOLBAR ── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-[0_1px_3px_rgba(11,31,58,0.04)] flex flex-col gap-3.5">
        {/* TOP SUB-ROW: QUICK KYC & ACCOUNT TABS */}
        <div className="w-full overflow-x-auto no-scrollbar scrollbar-none py-0.5 touch-pan-x">
          <div className="flex items-center gap-1.5 min-w-max">
            {[
              { key: 'all', label: 'All Customers', count: customers.length },
              { key: 'Verified', label: 'KYC Verified', count: stats.verifiedCount },
              { key: 'Pending', label: 'KYC Pending', count: stats.pendingKycCount },
              { key: 'Active', label: 'Active Borrowers', count: stats.activeAccountsCount },
            ].map((tab) => {
              const isActive = kycFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setKycFilter(tab.key as any)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                    isActive
                      ? 'bg-[#0B1F3A] text-white shadow-xs border border-[#D4AF37]/50'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-white/20 text-[#D4AF37]' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* BOTTOM SUB-ROW: SEARCH, RESET & RECORD COUNT */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-md min-w-[240px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, ID, phone, group, or center... (Press '/' to focus)"
              className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 border border-[#CBD5E1] focus:border-[#D4AF37] focus:bg-white text-xs text-[#0B1F3A] focus:outline-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                title="Reset all filters"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}

            <span className="text-xs text-slate-400 font-semibold pl-1 hidden sm:inline">
              Showing <strong className="text-[#0B1F3A] font-manrope">{filteredCustomers.length}</strong> of{' '}
              {customers.length} customer records
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. MAIN CUSTOMER MONITORING DIRECTORY TABLE ── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04)] overflow-hidden">
        {/* Table Title Bar */}
        <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full flex-shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-wider uppercase font-sans">
              CUSTOMER MONITORING &amp; DIGITAL KYC DIRECTORY
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300 font-medium">
              Showing <strong className="text-[#F5D061]">{filteredCustomers.length}</strong> of{' '}
              {customers.length} records
            </span>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Sync Active</span>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto w-full custom-scrollbar">
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                <User size={22} className="text-[#0B1F3A]" />
              </div>
              <h3 className="text-sm font-bold text-[#0B1F3A]">No customer records found</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {selectedBranchId
                  ? 'No customers found for the selected branch context.'
                  : 'No customer records match your current search query or filter.'}
              </p>
              {isAnyFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse min-w-[1240px] font-sans">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider select-none">
                  <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[220px]">CUSTOMER / BORROWER</th>
                  <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[220px]">GROUP &amp; CENTER</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[150px]">DIGITAL KYC STATUS</th>
                  <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[160px]">MOBILE NUMBER</th>
                  <th className="py-3.5 px-5 text-right whitespace-nowrap min-w-[180px]">ACTIVE LOAN &amp; EXPOSURE</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">ACCOUNT STATUS</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[110px]">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredCustomers.map((cust, idx) => {
                  const isFocused = focusedRowIndex === idx;
                  return (
                    <tr
                      key={cust.id}
                      ref={(el) => { rowRefs.current[idx] = el; }}
                      onClick={() => setFocusedRowIndex(idx)}
                      className={`transition-all group align-middle cursor-pointer ${
                        isFocused
                          ? 'bg-blue-50/90 ring-2 ring-blue-500/80 shadow-xs'
                          : idx % 2 === 1
                          ? 'bg-slate-50/30 hover:bg-blue-50/40'
                          : 'bg-white hover:bg-blue-50/40'
                      }`}
                    >
                      {/* 1. CUSTOMER / BORROWER */}
                      <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[220px]">
                        <div className="flex items-center gap-3">
                          {isFocused && (
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full shrink-0 -ml-2 animate-pulse" title="Focused row (Enter to view)" />
                          )}
                          <Avatar
                            name={cust.name}
                            size="sm"
                            className="shrink-0 ring-1 ring-slate-200/80 shadow-2xs"
                          />
                        <div>
                          <div className="font-bold text-[#0B1F3A] text-xs">{cust.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            ID: {cust.id}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                            <Calendar size={10} className="text-[#D4AF37]" />
                            <span>Reg: {cust.registrationDate}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. GROUP & CENTER */}
                    <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[220px]">
                      <div className="font-bold text-[#0B1F3A] text-xs">{cust.groupName}</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                        <MapPin size={11} className="text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[170px]">{cust.centerName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 pl-3.5">
                        {cust.branchName}
                      </div>
                    </td>

                    {/* 3. DIGITAL KYC STATUS */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[150px]">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          cust.kycStatus === 'Verified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border border-amber-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            cust.kycStatus === 'Verified' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        <span>{cust.kycStatus}</span>
                        {cust.kycStatus === 'Verified' && (
                          <BadgeCheck size={12} className="text-emerald-600 shrink-0" />
                        )}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        {cust.aadhaarNumber ? 'Aadhaar Verified' : 'Documents Pending'}
                      </div>
                    </td>

                    {/* 4. MOBILE NUMBER */}
                    <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[160px]">
                      <a
                        href={`tel:${cust.phone.replace(/[^+\d]/g, '')}`}
                        className="inline-flex items-center gap-2 font-mono text-xs font-bold text-[#0B1F3A] hover:text-blue-600 transition-all group/phone cursor-pointer"
                        title={`Click to call ${cust.phone}`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0 group-hover/phone:bg-blue-600 group-hover/phone:text-white transition-all shadow-2xs group-hover/phone:scale-105">
                          <Phone size={11} />
                        </div>
                        <span className="group-hover/phone:underline underline-offset-2">{cust.phone}</span>
                      </a>
                      <div className="text-[10.5px] text-slate-400 font-medium mt-0.5 pl-8">
                        Primary SMS Notification
                      </div>
                    </td>

                    {/* 5. ACTIVE LOAN & EXPOSURE */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap min-w-[180px]">
                      {cust.activeLoanId ? (
                        <>
                          <div className="font-mono text-xs font-bold text-[#0B1F3A]">
                            {cust.activeLoanId}
                          </div>
                          <div className="font-manrope font-bold text-xs text-slate-700 mt-0.5">
                            Sanctioned: {fmt(cust.activeLoanAmount)}
                          </div>
                          <div className="text-[10.5px] text-rose-700 font-semibold font-manrope">
                            Bal: {fmt(cust.outstandingBalance)}
                          </div>
                        </>
                      ) : (
                        <div className="text-slate-400 text-xs italic">No active loan</div>
                      )}
                    </td>

                    {/* 6. ACCOUNT STATUS */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          cust.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            cust.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        <span>{cust.status}</span>
                      </span>
                    </td>

                    {/* 7. ACTION */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[110px]">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0B1F3A] hover:text-[#F5D061] text-[#0B1F3A] text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-2xs active:scale-95 group-hover:border-slate-300"
                        title={`Inspect customer details for ${cust.name}`}
                      >
                        <Eye size={13} className="text-[#D4AF37]" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── 4. CUSTOMER PROFILE & DIGITAL KYC INSPECTION MODAL ── */}
      <AnimatePresence>
        {selectedCustomer && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Customer Profile Modal"
            onClick={() => setSelectedCustomer(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs cursor-pointer font-sans"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#E2E8F0] w-[min(96vw,720px)] max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl relative font-sans cursor-default"
            >
              {/* Modal Header */}
              <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4.5 flex items-center justify-between text-white shrink-0 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-[#D4AF37] rounded-full shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-black uppercase tracking-wider font-mono text-white">
                        CUSTOMER PROFILE: {selectedCustomer.name}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold capitalize ${
                          selectedCustomer.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                            : 'bg-slate-500/20 text-slate-300 border border-slate-400/40'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{selectedCustomer.status}</span>
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-medium flex items-center gap-2 mt-1">
                      <span className="text-[#D4AF37] font-mono">{selectedCustomer.id}</span>
                      <span>•</span>
                      <span className="text-white font-semibold">{selectedCustomer.branchName}</span>
                      <span>•</span>
                      <span className="text-slate-300">Reg: {selectedCustomer.registrationDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Prev / Next record navigation buttons */}
                  <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        const curIdx = filteredCustomers.findIndex((c) => c.id === selectedCustomer.id);
                        const prevIdx = curIdx > 0 ? curIdx - 1 : filteredCustomers.length - 1;
                        setSelectedCustomer(filteredCustomers[prevIdx]);
                        setFocusedRowIndex(prevIdx);
                        rowRefs.current[prevIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                      }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Previous Customer (← or ↑)"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[11px] font-mono text-slate-300 px-1.5 select-none">
                      {filteredCustomers.findIndex((c) => c.id === selectedCustomer.id) + 1}/{filteredCustomers.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const curIdx = filteredCustomers.findIndex((c) => c.id === selectedCustomer.id);
                        const nextIdx = curIdx >= 0 && curIdx < filteredCustomers.length - 1 ? curIdx + 1 : 0;
                        setSelectedCustomer(filteredCustomers[nextIdx]);
                        setFocusedRowIndex(nextIdx);
                        rowRefs.current[nextIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                      }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Next Customer (→ or ↓)"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Close (Esc)"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar scroll-smooth overscroll-contain flex-1 text-xs font-sans">
                {/* 1. Amounts Breakdown / Account Overview Cards */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Active Loan
                    </span>
                    <span className="text-sm sm:text-base font-black text-[#0B1F3A] font-mono mt-1 block">
                      {selectedCustomer.activeLoanId || 'None'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 mt-0.5 block">
                      {selectedCustomer.activeLoanAmount ? fmt(selectedCustomer.activeLoanAmount) : 'No Outlay'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Digital KYC
                    </span>
                    <span className="text-sm sm:text-base font-black text-emerald-700 font-manrope mt-1 block">
                      {selectedCustomer.kycStatus}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      Biometric Validated
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Outstanding Arrears
                    </span>
                    <span className="text-sm sm:text-base font-black text-[#0B1F3A] font-manrope tabular-nums mt-1 block">
                      {fmt(selectedCustomer.outstandingBalance || 0)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 mt-0.5 block">
                      Current Due Balance
                    </span>
                  </div>
                </div>

                {/* 2. Customer Bio & Group Assignment Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={selectedCustomer.name}
                        size="md"
                        className="shrink-0 ring-2 ring-slate-100 shadow-2xs"
                      />
                      <div>
                        <div className="font-extrabold text-[#0B1F3A] text-sm flex items-center gap-2">
                          <span>{selectedCustomer.name}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10.5px] font-semibold">
                            {selectedCustomer.id}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium flex items-center gap-1.5">
                          <a
                            href={`tel:${selectedCustomer.phone.replace(/[^+\d]/g, '')}`}
                            className="inline-flex items-center gap-1.5 font-mono font-bold text-[#0B1F3A] hover:text-blue-600 transition-colors cursor-pointer group/modalphone"
                            title={`Click to call ${selectedCustomer.phone}`}
                          >
                            <Phone size={11} className="text-[#D4AF37] group-hover/modalphone:text-blue-600 transition-colors" />
                            <span className="group-hover/modalphone:underline underline-offset-2">{selectedCustomer.phone}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B1F3A] text-[#F5D061] text-xs font-mono font-bold shadow-2xs">
                      <span>Group:</span>
                      <span>{selectedCustomer.groupName}</span>
                    </div>
                  </div>

                  {/* 3 Structured Details Tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <MapPin size={11} className="text-emerald-600" />
                        <span>Center &amp; Area</span>
                      </div>
                      <div className="font-bold text-[#0B1F3A] text-xs leading-snug">
                        {selectedCustomer.centerName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {selectedCustomer.branchName}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Building2 size={11} className="text-blue-600" />
                        <span>Residential Location</span>
                      </div>
                      <div className="font-bold text-[#0B1F3A] text-xs leading-snug">
                        {selectedCustomer.city}, {selectedCustomer.state}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5 font-mono">
                        Pin: {selectedCustomer.pincode}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Calendar size={11} className="text-[#D4AF37]" />
                        <span>Enrolled Since</span>
                      </div>
                      <div className="font-bold text-[#0B1F3A] text-xs font-mono">
                        {selectedCustomer.registrationDate}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                        Verified Primary Member
                      </div>
                    </div>
                  </div>

                  {/* Full Address */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Full Residential Address
                    </span>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.state} -{' '}
                      {selectedCustomer.pincode}
                    </p>
                  </div>
                </div>

                {/* 3. Digital KYC Identity Documents (Section 4 & 6) */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-[#D4AF37]" />
                      <span>Digital KYC Identity Artifacts &amp; Biometrics</span>
                    </h4>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        selectedCustomer.kycStatus === 'Verified'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {selectedCustomer.kycStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Aadhaar */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Aadhaar Number
                      </span>
                      <span className="font-mono font-bold text-[#0B1F3A] text-xs block">
                        {selectedCustomer.aadhaarNumber || 'Not Logged'}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 mt-1">
                        <Check size={11} />
                        <span>
                          {selectedCustomer.aadhaarFrontAvailable ? 'Front & Back Uploaded' : 'Pending'}
                        </span>
                      </span>
                    </div>

                    {/* PAN */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        PAN Card Number
                      </span>
                      <span className="font-mono font-bold text-[#0B1F3A] text-xs block">
                        {selectedCustomer.panNumber || 'Not Logged'}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 mt-1">
                        <Check size={11} />
                        <span>Income Tax DB Verified</span>
                      </span>
                    </div>

                    {/* Voter ID / Biometric */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Voter ID / Biometric
                      </span>
                      <span className="font-mono font-bold text-[#0B1F3A] text-xs block">
                        {selectedCustomer.voterId || 'Biometric Punch'}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 mt-1">
                        <Check size={11} />
                        <span>
                          {selectedCustomer.customerPhotoAvailable ? 'Live Selfie Verified' : 'Standard'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Nominee Details */}
                  {selectedCustomer.nomineeName && (
                    <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Nominee Name</span>
                        <span className="font-bold text-[#0B1F3A] text-xs mt-0.5 block">
                          {selectedCustomer.nomineeName}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Relationship</span>
                        <span className="font-semibold text-slate-700 text-xs mt-0.5 block">
                          {selectedCustomer.nomineeRelation}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Nominee Phone</span>
                        {selectedCustomer.nomineePhone && selectedCustomer.nomineePhone !== 'N/A' ? (
                          <a
                            href={`tel:${selectedCustomer.nomineePhone.replace(/[^+\d]/g, '')}`}
                            className="font-mono font-bold text-[#0B1F3A] hover:text-blue-600 text-xs mt-0.5 inline-flex items-center gap-1 cursor-pointer transition-colors"
                            title={`Click to call nominee ${selectedCustomer.nomineePhone}`}
                          >
                            <Phone size={10} className="text-[#D4AF37]" />
                            <span className="hover:underline">{selectedCustomer.nomineePhone}</span>
                          </a>
                        ) : (
                          <span className="font-mono font-bold text-slate-400 text-xs mt-0.5 block">N/A</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Customer History & Audit Timeline */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Clock size={13} className="text-[#D4AF37]" />
                    <span>Customer Enrolment &amp; Loan Audit Timeline</span>
                  </h4>

                  {selectedCustomer.history && selectedCustomer.history.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                      {selectedCustomer.history.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200 text-xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-[#0B1F3A]">{h.event}</span>
                              <span className="text-[10.5px] text-slate-400 font-mono">{h.date}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5 font-medium leading-relaxed">
                              {h.remarks}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs italic">
                      Enrolled and verified via Field Officer mobile beat.
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 font-mono">
                  GLF Customer Master Directory • Tamper-Proof Audit
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="py-2 px-5 rounded-xl bg-[#0B1F3A] hover:bg-[#163864] text-white font-bold cursor-pointer text-xs transition-all shadow-md active:scale-95"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CustomerMonitoringPage;
