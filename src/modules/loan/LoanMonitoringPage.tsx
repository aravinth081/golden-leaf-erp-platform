// ──────────────────────────────────────────────────
// GOLDEN LEAF FINANCE — LOAN MONITORING
// PDF-Strict Loan Portfolio Oversight & 4-Stage Approval Workflow Tracker
// Modules: Module 6 (Loan Management) + Module 7 (Approval Workflow)
// Read-only oversight of Plans, Schedules, Outstanding & Approval Stages
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Search,
  Eye,
  X,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Check,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  Building2,
  User,
  ArrowUpRight,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Keyboard,
} from 'lucide-react';
import { MonitoringNav } from '../monitoring/MonitoringNav';
import { useUIStore } from '../../store';
import { Avatar } from '../../components/ui';
import {
  getMonitoredLoans,
  type MonitoredLoan,
} from '../../services/monitoringDataService';

export const LoanMonitoringPage: React.FC = () => {
  const selectedBranchId = useUIStore((s) => s.selectedBranchId);
  const [loans, setLoans] = useState<MonitoredLoan[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Closed' | 'Pending Approval'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<MonitoredLoan | null>(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(0);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load branch-filtered loans
  useEffect(() => {
    const list = getMonitoredLoans(selectedBranchId);
    setLoans(list);
  }, [selectedBranchId]);

  // Keep focusedRowIndex within bounds
  useEffect(() => {
    setFocusedRowIndex((prev) => {
      if (loans.length === 0) return 0;
      return Math.min(prev, Math.max(0, loans.length - 1));
    });
  }, [loans.length]);

  const fmt = (num: number) => `₹${num.toLocaleString('en-IN')}`;

  // Portfolio KPI metrics
  const stats = useMemo(() => {
    const totalPrincipal = loans.reduce((acc, l) => acc + (l.principalAmount || 0), 0);
    const totalOutstanding = loans.reduce((acc, l) => acc + (l.outstandingAmount || 0), 0);
    const totalRepaid = loans.reduce((acc, l) => acc + (l.paidAmount || 0), 0);
    const activeCount = loans.filter((l) => l.status === 'Active').length;
    const closedCount = loans.filter((l) => l.status === 'Closed').length;
    const pendingCount = loans.filter((l) => l.status === 'Pending Approval').length;
    const weeklyDemand = loans
      .filter((l) => l.status === 'Active')
      .reduce((acc, l) => acc + (l.weeklyAmount || 0), 0);
    const recoveryRate = totalPrincipal > 0 ? Math.round((totalRepaid / totalPrincipal) * 100) : 0;

    return {
      totalPrincipal,
      totalOutstanding,
      totalRepaid,
      activeCount,
      closedCount,
      pendingCount,
      weeklyDemand,
      recoveryRate,
    };
  }, [loans]);

  // Filter loans
  const filteredLoans = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return loans.filter((l) => {
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
      const matchesSearch =
        !q ||
        l.id.toLowerCase().includes(q) ||
        l.customerName.toLowerCase().includes(q) ||
        l.customerId.toLowerCase().includes(q) ||
        l.planName.toLowerCase().includes(q) ||
        (l.branchName && l.branchName.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [loans, statusFilter, searchQuery]);

  const isAnyFilterActive = statusFilter !== 'all' || searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setStatusFilter('all');
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
        if (selectedLoan) {
          setSelectedLoan(null);
          return;
        }
        if (isInput) {
          target?.blur();
          return;
        }
      }

      // If user presses '/' when not in input, focus search box
      if (e.key === '/' && !isInput && !selectedLoan) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (isInput) return;

      // Inside Modal: Left / Right / Up / Down / PageUp / PageDown cycles records
      if (selectedLoan) {
        const curIdx = filteredLoans.findIndex((l) => l.id === selectedLoan.id);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
          e.preventDefault();
          if (filteredLoans.length > 0) {
            const nextIdx = curIdx >= 0 && curIdx < filteredLoans.length - 1 ? curIdx + 1 : 0;
            setSelectedLoan(filteredLoans[nextIdx]);
            setFocusedRowIndex(nextIdx);
            rowRefs.current[nextIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
          e.preventDefault();
          if (filteredLoans.length > 0) {
            const prevIdx = curIdx > 0 ? curIdx - 1 : filteredLoans.length - 1;
            setSelectedLoan(filteredLoans[prevIdx]);
            setFocusedRowIndex(prevIdx);
            rowRefs.current[prevIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }
        return;
      }

      // Table Row navigation when modal is NOT open
      if (filteredLoans.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRowIndex((prev) => {
          const next = Math.min(filteredLoans.length - 1, prev + 1);
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
        const item = filteredLoans[focusedRowIndex];
        if (item) setSelectedLoan(item);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLoan, filteredLoans, focusedRowIndex]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 sm:p-5 lg:p-6 flex flex-col gap-5 pb-12 font-sans max-w-full text-[#0B1F3A]"
    >
      {/* Shared Navigation Header */}
      <MonitoringNav currentTab="loans" />

      {/* ── 1. EXECUTIVE KPI SUMMARY (LIVE PORTFOLIO METRICS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Portfolio Outlay */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-[0_2px_8px_rgba(11,31,58,0.04)] hover:shadow-md hover:border-[#D4AF37]/50 transition-all duration-200 flex flex-col justify-between min-h-[142px] group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans leading-tight">
              Total Portfolio Outlay
            </span>
            <div className="w-8.5 h-8.5 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80 shadow-2xs group-hover:scale-105 transition-transform">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="my-2.5 flex items-baseline justify-between">
            <span className="text-2xl sm:text-[26px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums">
              {fmt(stats.totalPrincipal)}
            </span>
            <span className="text-[10.5px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {loans.length} Loans
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block shrink-0" />
            <span className="truncate">Total sanctioned loan capital</span>
          </div>
        </div>

        {/* Card 2: Active Outstanding */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-[0_2px_8px_rgba(11,31,58,0.04)] hover:shadow-md hover:border-[#D4AF37]/50 transition-all duration-200 flex flex-col justify-between min-h-[142px] group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans leading-tight">
              Active Outstanding
            </span>
            <div className="w-8.5 h-8.5 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/80 shadow-2xs group-hover:scale-105 transition-transform">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="my-2.5 flex items-baseline justify-between">
            <span className="text-2xl sm:text-[26px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums">
              {fmt(stats.totalOutstanding)}
            </span>
            <span className="text-[10.5px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {stats.activeCount} Active
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span className="truncate">Remaining uncollected balance</span>
          </div>
        </div>

        {/* Card 3: Recovered Capital */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-[0_2px_8px_rgba(11,31,58,0.04)] hover:shadow-md hover:border-[#D4AF37]/50 transition-all duration-200 flex flex-col justify-between min-h-[142px] group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans leading-tight">
              Recovered Capital
            </span>
            <div className="w-8.5 h-8.5 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/80 shadow-2xs group-hover:scale-105 transition-transform">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="my-2.5 flex items-baseline justify-between">
            <span className="text-2xl sm:text-[26px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums">
              {fmt(stats.totalRepaid)}
            </span>
            <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {stats.recoveryRate}% Ratio
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block shrink-0" />
            <span className="truncate">Principal &amp; interest repaid to date</span>
          </div>
        </div>

        {/* Card 4: Weekly Demand Run */}
        <div className="bg-gradient-to-br from-[#0B1F3A] to-[#163864] text-white rounded-2xl p-5 shadow-[0_2px_10px_rgba(11,31,58,0.15)] flex flex-col justify-between min-h-[142px] relative overflow-hidden group">
          <CreditCard size={80} className="absolute -right-4 -bottom-4 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
              Weekly Demand Run
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="my-2.5">
            <div className="text-2xl sm:text-[26px] font-extrabold text-white font-manrope tracking-tight tabular-nums">
              {fmt(stats.weeklyDemand)}
            </div>
            <div className="text-[11.5px] text-[#D4AF37] font-semibold mt-0.5">
              Weekly scheduled field collections
            </div>
          </div>
          <div className="pt-2 border-t border-white/10 text-[10.5px] text-slate-300 flex items-center gap-1.5 truncate">
            <Sparkles size={11} className="text-[#D4AF37] shrink-0" />
            <span className="truncate">{stats.activeCount} active borrowers in current cycle</span>
          </div>
        </div>
      </div>

      {/* ── 2. FILTER & CONTROLS TOOLBAR ── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-[0_1px_3px_rgba(11,31,58,0.04)] flex flex-col gap-3.5">
        {/* TOP SUB-ROW: LOAN STATUS TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {[
            { key: 'all', label: 'All Loans', count: loans.length },
            { key: 'Active', label: 'Active Loans', count: stats.activeCount },
            { key: 'Closed', label: 'Closed Loans', count: stats.closedCount },
            { key: 'Pending Approval', label: 'Under Review', count: stats.pendingCount },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
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
              placeholder="Search loan ID, customer name, customer ID, or plan... (Press '/' to focus)"
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
              Showing <strong className="text-[#0B1F3A] font-manrope">{filteredLoans.length}</strong> of{' '}
              {loans.length} loans
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. MAIN LOAN MONITORING TABLE ── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04)] overflow-hidden">
        {/* Table Title Bar */}
        <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full flex-shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-wider uppercase font-sans">
              LOAN MONITORING &amp; DISBURSEMENT PORTFOLIO
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300 font-medium">
              Showing <strong className="text-[#F5D061]">{filteredLoans.length}</strong> of {loans.length} loans
            </span>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Sync Active</span>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto w-full custom-scrollbar">
          {filteredLoans.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                <CreditCard size={22} className="text-[#0B1F3A]" />
              </div>
              <h3 className="text-sm font-bold text-[#0B1F3A]">No loan data available</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {selectedBranchId
                  ? 'No loans found for the selected branch context.'
                  : 'No loan records match your current search query or status filter.'}
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
            <table className="w-full text-left text-xs border-collapse min-w-[1360px] font-sans">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider select-none">
                  <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[130px]">LOAN ACCOUNT</th>
                  <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[140px]">DISBURSED DATE</th>
                  <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[180px]">BRANCH</th>
                  <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[220px]">BORROWER / CUSTOMER</th>
                  <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[210px]">FINANCING PLAN</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">APPROVAL &amp; STATUS</th>
                  <th className="py-3.5 px-5 text-right whitespace-nowrap min-w-[170px]">OUTSTANDING &amp; REPAID</th>
                  <th className="py-3.5 px-5 text-center whitespace-nowrap min-w-[150px]">WEEKLY SCHEDULE</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[100px]">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredLoans.map((loan, idx) => {
                  const paidPct =
                    loan.principalAmount > 0
                      ? Math.min(100, Math.round((loan.paidAmount / loan.principalAmount) * 100))
                      : 0;

                  const isFocused = focusedRowIndex === idx;

                  return (
                    <tr
                      key={loan.id}
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
                      {/* 1. LOAN ACCOUNT */}
                      <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[130px]">
                        <div className="flex items-center gap-2">
                          {isFocused && (
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full shrink-0 -ml-2 animate-pulse" title="Focused row (Enter to view)" />
                          )}
                          <div>
                            <div className="font-bold text-[#0B1F3A] font-mono text-xs tracking-wider">{loan.id}</div>
                            <div className="text-[10px] font-bold text-blue-700 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-200/60 inline-flex items-center gap-1 mt-1">
                              <CreditCard size={10} className="text-blue-600" />
                              <span>Loan ID</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. DISBURSED DATE */}
                      <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[140px]">
                        <div className="font-bold text-[#0B1F3A] font-manrope text-xs flex items-center gap-1.5">
                          <Calendar size={12} className="text-[#D4AF37] shrink-0" />
                          <span>{loan.startDate}</span>
                        </div>
                        <div className="text-[10.5px] text-slate-400 font-sans mt-0.5">
                          Disbursement Date
                        </div>
                      </td>

                      {/* 3. BRANCH */}
                      <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[180px]">
                        <div className="font-bold text-[#0B1F3A] text-xs flex items-center gap-1.5 truncate max-w-[180px]">
                          <Building2 size={12} className="text-[#D4AF37] shrink-0" />
                          <span>{loan.branchName.split('-')[0]?.trim() || loan.branchName}</span>
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-sans mt-0.5">
                          {loan.branchName.includes('-') ? loan.branchName.split('-')[1]?.trim() : loan.branchId}
                        </div>
                      </td>

                      {/* 2. BORROWER / CUSTOMER */}
                      <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={loan.customerName}
                            size="sm"
                            className="shrink-0 ring-1 ring-slate-200/80 shadow-2xs"
                          />
                          <div>
                            <div className="font-bold text-[#0B1F3A] text-xs">{loan.customerName}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              ID: {loan.customerId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. FINANCING PLAN */}
                      <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[220px]">
                        <span className="font-bold text-[#0B1F3A] text-xs block">{loan.planName}</span>
                        <div className="text-[11px] text-slate-500 font-manrope font-semibold mt-0.5">
                          Principal: <span className="text-[#0B1F3A] font-bold">{fmt(loan.principalAmount)}</span>
                        </div>
                      </td>

                      {/* 4. APPROVAL & STATUS */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[150px]">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            loan.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                              : loan.status === 'Closed'
                              ? 'bg-blue-50 text-blue-700 border border-blue-300'
                              : 'bg-amber-50 text-amber-800 border border-amber-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              loan.status === 'Active'
                                ? 'bg-emerald-500 animate-pulse'
                                : loan.status === 'Closed'
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          <span>{loan.status}</span>
                        </span>
                        <div className="text-[10.5px] text-slate-400 font-medium mt-1">
                          {loan.approvalStage || 'Disbursed'}
                        </div>
                      </td>

                      {/* 5. OUTSTANDING & REPAID */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap min-w-[180px]">
                        <div className="font-manrope font-extrabold text-sm text-[#0B1F3A] tabular-nums">
                          {fmt(loan.outstandingAmount)}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-manrope font-semibold mt-0.5">
                          Repaid: {fmt(loan.paidAmount)}
                        </div>
                        {/* Repayment Progress Bar */}
                        <div className="w-28 ml-auto mt-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${paidPct}%` }}
                          />
                        </div>
                      </td>

                      {/* 6. WEEKLY SCHEDULE */}
                      <td className="py-3.5 px-5 text-center whitespace-nowrap min-w-[170px]">
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-[#0B1F3A] font-manrope font-bold text-xs">
                          <span>{loan.weeksCompleted}</span>
                          <span className="text-slate-400">/</span>
                          <span>{loan.tenorWeeks} Wks</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-manrope font-semibold mt-1">
                          {fmt(loan.weeklyAmount)} / wk
                        </div>
                      </td>

                      {/* 7. ACTION */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[110px]">
                        <button
                          onClick={() => setSelectedLoan(loan)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0B1F3A] hover:text-[#F5D061] text-[#0B1F3A] text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-2xs active:scale-95 group-hover:border-slate-300"
                          title={`Inspect loan details for ${loan.id}`}
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

      {/* ── 4. LOAN DETAIL & APPROVAL WORKFLOW MODAL ── */}
      <AnimatePresence>
        {selectedLoan && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Loan Details Modal"
            onClick={() => setSelectedLoan(null)}
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
                        LOAN ACCOUNT: {selectedLoan.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold capitalize ${
                          selectedLoan.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                            : selectedLoan.status === 'Closed'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{selectedLoan.status}</span>
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-medium flex items-center gap-2 mt-1">
                      <span className="text-white font-semibold">{selectedLoan.customerName}</span>
                      <span>•</span>
                      <span className="text-[#D4AF37] font-mono">{selectedLoan.customerId}</span>
                      <span>•</span>
                      <span className="text-slate-300">{selectedLoan.branchName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Prev / Next record navigation buttons */}
                  <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        const curIdx = filteredLoans.findIndex((l) => l.id === selectedLoan.id);
                        const prevIdx = curIdx > 0 ? curIdx - 1 : filteredLoans.length - 1;
                        setSelectedLoan(filteredLoans[prevIdx]);
                        setFocusedRowIndex(prevIdx);
                        rowRefs.current[prevIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                      }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Previous Loan (← or ↑)"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[11px] font-mono text-slate-300 px-1.5 select-none">
                      {filteredLoans.findIndex((l) => l.id === selectedLoan.id) + 1}/{filteredLoans.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const curIdx = filteredLoans.findIndex((l) => l.id === selectedLoan.id);
                        const nextIdx = curIdx >= 0 && curIdx < filteredLoans.length - 1 ? curIdx + 1 : 0;
                        setSelectedLoan(filteredLoans[nextIdx]);
                        setFocusedRowIndex(nextIdx);
                        rowRefs.current[nextIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                      }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Next Loan (→ or ↓)"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedLoan(null)}
                    className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Close (Esc)"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar scroll-smooth overscroll-contain flex-1 text-xs font-sans">
                {/* 1. Amounts Breakdown (3 Premium Executive Metric Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Card 1: Principal Disbursed */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-[0_2px_8px_rgba(11,31,58,0.04)] min-h-[116px] flex flex-col justify-between hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Principal Disbursed
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 shrink-0">
                        <CreditCard size={12} strokeWidth={2.2} />
                      </div>
                    </div>
                    <div className="my-1">
                      <span className="text-2xl font-black text-[#0B1F3A] font-manrope tabular-nums tracking-tight block">
                        {fmt(selectedLoan.principalAmount)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[10.5px]">
                      <span className="font-medium text-slate-400">Sanctioned Capital</span>
                      <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200/70 text-[10px]">
                        Disbursed
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Total Repaid */}
                  <div className="bg-white rounded-2xl border border-emerald-200/90 p-4 shadow-[0_2px_8px_rgba(16,185,129,0.04)] min-h-[116px] flex flex-col justify-between hover:border-emerald-300 transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                        Total Repaid
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0">
                        <IndianRupee size={12} strokeWidth={2.4} />
                      </div>
                    </div>
                    <div className="my-1">
                      <span className="text-2xl font-black text-emerald-600 font-manrope tabular-nums tracking-tight block">
                        {fmt(selectedLoan.paidAmount)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-emerald-100/70 flex items-center justify-between gap-1 text-[10.5px]">
                      <span className="font-medium text-slate-400">Recovery Ratio</span>
                      <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px]">
                        {selectedLoan.principalAmount > 0
                          ? `${Math.round((selectedLoan.paidAmount / selectedLoan.principalAmount) * 100)}% Repaid`
                          : '0%'}
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Outstanding Balance */}
                  <div
                    className={`bg-white rounded-2xl border p-4 min-h-[116px] flex flex-col justify-between transition-all ${
                      selectedLoan.outstandingAmount > 0
                        ? 'border-rose-200/90 shadow-[0_2px_8px_rgba(244,63,94,0.04)] hover:border-rose-300'
                        : 'border-slate-200/90 shadow-[0_2px_8px_rgba(11,31,58,0.04)] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          selectedLoan.outstandingAmount > 0 ? 'text-rose-800' : 'text-slate-500'
                        }`}
                      >
                        Outstanding Balance
                      </span>
                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                          selectedLoan.outstandingAmount > 0
                            ? 'bg-rose-50 border-rose-200/80 text-rose-600'
                            : 'bg-emerald-50 border-emerald-200/80 text-emerald-600'
                        }`}
                      >
                        {selectedLoan.outstandingAmount > 0 ? (
                          <AlertTriangle size={12} strokeWidth={2.2} />
                        ) : (
                          <CheckCircle2 size={12} strokeWidth={2.2} />
                        )}
                      </div>
                    </div>
                    <div className="my-1">
                      <span
                        className={`text-2xl font-black font-manrope tabular-nums tracking-tight block ${
                          selectedLoan.outstandingAmount > 0 ? 'text-rose-600' : 'text-[#0B1F3A]'
                        }`}
                      >
                        {fmt(selectedLoan.outstandingAmount)}
                      </span>
                    </div>
                    <div
                      className={`pt-2 border-t flex items-center justify-between gap-1 text-[10.5px] ${
                        selectedLoan.outstandingAmount > 0 ? 'border-rose-100/70' : 'border-slate-100'
                      }`}
                    >
                      <span className="font-medium text-slate-400">Residual Debt</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                          selectedLoan.outstandingAmount > 0
                            ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                        }`}
                      >
                        {selectedLoan.outstandingAmount > 0 ? 'Active Debt' : 'Fully Settled'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Borrower & Financing Plan Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={selectedLoan.customerName}
                        size="md"
                        className="shrink-0 ring-2 ring-slate-100 shadow-2xs"
                      />
                      <div>
                        <div className="font-extrabold text-[#0B1F3A] text-sm flex items-center gap-2">
                          <span>{selectedLoan.customerName}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10.5px] font-semibold">
                            {selectedLoan.customerId}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          Borrower Jurisdiction • {selectedLoan.branchName}
                        </div>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B1F3A] text-[#F5D061] text-xs font-mono font-bold shadow-2xs">
                      <span>Plan:</span>
                      <span>{selectedLoan.planName}</span>
                    </div>
                  </div>

                  {/* Operational Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Weekly Installment
                      </div>
                      <div className="font-bold text-[#0B1F3A] text-sm font-manrope">
                        {fmt(selectedLoan.weeklyAmount)} / wk
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Scheduled weekly EMI
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Tenure &amp; Progress
                      </div>
                      <div className="font-bold text-[#0B1F3A] text-sm font-manrope">
                        {selectedLoan.weeksCompleted} of {selectedLoan.tenorWeeks} Weeks
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                        {Math.round((selectedLoan.weeksCompleted / selectedLoan.tenorWeeks) * 100)}% Duration elapsed
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Loan Start Date
                      </div>
                      <div className="font-bold text-[#0B1F3A] text-xs font-mono">
                        {selectedLoan.startDate}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Disbursement timestamp
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. 4-Stage Approval Workflow Tracker (Module 7) */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#D4AF37]" />
                    <span>Module 7 — 4-Stage Approval Workflow Pipeline</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      {
                        stage: '1. Origination',
                        label: 'Customer Relationship Officer (CRO)',
                        done: selectedLoan.approvalStageProgress.agentOriginated,
                      },
                      {
                        stage: '2. Appraisal',
                        label: 'Credit Manager',
                        done: selectedLoan.approvalStageProgress.creditManagerVerified,
                      },
                      {
                        stage: '3. Sanction',
                        label: 'Branch Manager',
                        done: selectedLoan.approvalStageProgress.branchManagerApproved,
                      },
                      {
                        stage: '4. Disbursement',
                        label: 'Accounts Disbursed',
                        done: selectedLoan.approvalStageProgress.disbursed,
                      },
                    ].map((step, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                          step.done
                            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {step.stage}
                          </span>
                          {step.done ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                              <Check size={12} strokeWidth={3} />
                            </span>
                          ) : (
                            <Clock size={14} className="text-slate-300" />
                          )}
                        </div>
                        <span className="text-xs font-bold">{step.label}</span>
                        <span
                          className={`text-[9.5px] font-semibold mt-1 ${
                            step.done ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {step.done ? 'Verified & Completed' : 'Pending Verification'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Weekly Schedule & Installment Breakdown */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#D4AF37]" />
                      <span>Weekly Installment Schedule Matrix</span>
                    </h4>
                    <span className="text-[10.5px] font-semibold text-slate-500 font-mono">
                      {selectedLoan.schedule.length} Installments Logged
                    </span>
                  </div>

                  {selectedLoan.schedule.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-x-auto custom-scrollbar bg-white max-h-48">
                      <table className="w-full text-left text-xs min-w-[360px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[10.5px] uppercase sticky top-0 bg-slate-100">
                            <th className="py-2.5 px-3.5">Week</th>
                            <th className="py-2.5 px-3.5">Due Date</th>
                            <th className="py-2.5 px-3.5 text-right">Expected EMI</th>
                            <th className="py-2.5 px-3.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedLoan.schedule.map((item) => (
                            <tr key={item.week} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3.5 font-bold text-[#0B1F3A] font-mono">
                                Week {String(item.week).padStart(2, '0')}
                              </td>
                              <td className="py-2.5 px-3.5 text-slate-600 font-mono">{item.dueDate}</td>
                              <td className="py-2.5 px-3.5 text-right font-manrope font-bold text-[#0B1F3A]">
                                {fmt(item.expectedAmount)}
                              </td>
                              <td className="py-2.5 px-3.5 text-center">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    item.status === 'Paid'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : item.status === 'Pending'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs italic">
                      Weekly schedule active upon sanction and final disbursement.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 font-mono">
                  GLF Real-Time Loan Portfolio • 4-Stage Verified Audit
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLoan(null)}
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

export default LoanMonitoringPage;
