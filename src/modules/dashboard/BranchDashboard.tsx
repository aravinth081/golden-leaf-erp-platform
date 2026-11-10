// ──────────────────────────────────────────────────
// Golden Leaf Finance — Branch Manager Dashboard
// Strict PDF-Compliant SaaS Implementation (Module 12)
// Enhanced Typography, Perfect Alignment & Custom Dropdown matching Reference Images
// Fonts: Plus Jakarta Sans (Primary UI & Labels), Manrope (Tabular Numerics)
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, Clock, CreditCard, UserCheck, Users,
  Grid, CheckSquare, Lock, Printer, FileText,
  ArrowRight, ArrowUpRight, Building2, AlertCircle, RefreshCw, ChevronDown, MapPin,
  Calendar, Sun, CheckCircle2, Check, User, X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { motion } from 'framer-motion';
import { useAuthStore, useUIStore } from '../../store';
import {
  getStoredBranches,
  type DetailedBranch,
  type BranchAgentPerformance,
} from '../../services/branchService';

// Bar Chart Colors strictly matching Reference Image 2:
// Bar 1: Coral Red, Bar 2: Slate Grey, Bar 3: Salmon Light Coral, Bar 4: Warm Orange, Bar 5: Cornflower Blue
const INFOGRAPHIC_COLORS = [
  { primary: '#EF5350', start: '#EF5350', end: '#D32F2F', name: 'Coral Red' },
  { primary: '#9CA3AF', start: '#9CA3AF', end: '#6B7280', name: 'Slate Grey' },
  { primary: '#F87171', start: '#F87171', end: '#E53E3E', name: 'Salmon Coral' },
  { primary: '#F27438', start: '#F27438', end: '#EA580C', name: 'Warm Orange' },
  { primary: '#6BA3E8', start: '#6BA3E8', end: '#3B82F6', name: 'Cornflower Blue' },
  { primary: '#10B981', start: '#10B981', end: '#059669', name: 'Emerald' },
  { primary: '#8B5CF6', start: '#8B5CF6', end: '#6D28D9', name: 'Violet' },
  { primary: '#D4AF37', start: '#D4AF37', end: '#B89324', name: 'Golden Leaf Gold' },
];

const formatCompactINR = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  if (val >= 10000000) {
    const cr = val / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    const l = val / 100000;
    return `₹${l % 1 === 0 ? l.toFixed(0) : l.toFixed(2)} L`;
  }
  return `₹${Number(val).toLocaleString('en-IN')}`;
};

const formatFullINR = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  return `₹${Number(val).toLocaleString('en-IN')}`;
};

export const BranchDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const selectedBranchId = useUIStore((s) => s.selectedBranchId);
  const setSelectedBranchId = useUIStore((s) => s.setSelectedBranchId);
  const addToast = useUIStore((s) => s.addToast);

  const [branches, setBranches] = useState<DetailedBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<DetailedBranch | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Custom Dropdown State & Click-Outside Ref
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState<boolean>(false);
  const [focusedBranchIndex, setFocusedBranchIndex] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live real-time clock & date display matching SaaS Reference Top Bar
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close custom dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Comprehensive keyboard navigation for branch switcher dropdown
  useEffect(() => {
    if (!isBranchDropdownOpen || branches.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedBranchIndex((prev) => (prev + 1) % branches.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedBranchIndex((prev) => (prev - 1 + branches.length) % branches.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const target = branches[focusedBranchIndex];
        if (target) {
          handleBranchChange(target.id);
          setIsBranchDropdownOpen(false);
        }
      } else if (e.key === 'Escape' || e.key === 'Tab') {
        e.preventDefault();
        setIsBranchDropdownOpen(false);
      } else if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        const char = e.key.toLowerCase();
        const found = branches.findIndex(
          (b) =>
            b.name.toLowerCase().startsWith(char) ||
            b.city.toLowerCase().startsWith(char) ||
            b.code.toLowerCase().startsWith(char)
        );
        if (found !== -1) {
          setFocusedBranchIndex(found);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBranchDropdownOpen, focusedBranchIndex, branches]);

  const loadData = () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const list = getStoredBranches();
      setBranches(list);

      const userBranchClaim = user?.customClaims?.branchId;
      let target: DetailedBranch | undefined;

      // 1. If user has previously selected a branch in the UI store
      if (selectedBranchId) {
        target = list.find((b) => b.id === selectedBranchId || b.code === selectedBranchId);
      }

      // 2. If not found, match authenticated user's assigned branch
      if (!target && userBranchClaim) {
        target = list.find(
          (b) =>
            b.id.toLowerCase() === userBranchClaim.toLowerCase() ||
            b.code.toLowerCase() === userBranchClaim.toLowerCase() ||
            (userBranchClaim === 'b1' && (b.id === 'BR-01' || b.code === 'GL-BR-001'))
        );
      }

      // 3. Fallback to first branch in list
      if (!target && list.length > 0) {
        target = list[0];
      }

      if (target) {
        setCurrentBranch(target);
        if (selectedBranchId !== target.id) {
          setSelectedBranchId(target.id);
        }
      } else {
        setLoadError('No branch records found in system.');
      }
    } catch (err) {
      console.error('Failed to load Branch Dashboard data:', err);
      setLoadError('Unable to load branch data. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Immediate branch switching without browser reload
  const handleBranchChange = (newId: string) => {
    const found = branches.find((b) => b.id === newId);
    if (found) {
      setCurrentBranch(found);
      setSelectedBranchId(found.id);
      addToast({
        type: 'info',
        title: 'Branch Switched',
        message: `Now viewing ${found.name} (${found.code})`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 font-jakarta pb-16">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 animate-pulse">
          <div className="h-6 w-64 bg-slate-200 rounded mb-2" />
          <div className="h-4 w-96 bg-slate-100 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 h-[148px] animate-pulse">
              <div className="h-4 w-24 bg-slate-200 rounded mb-4" />
              <div className="h-8 w-32 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-20 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 h-80 animate-pulse" />
      </div>
    );
  }

  if (loadError || !currentBranch) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-lg mx-auto my-12 shadow-sm font-jakarta">
        <AlertCircle size={40} className="text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-[#0B1F3A] mb-1">Dashboard Load Issue</h2>
        <p className="text-xs text-[#64748B] mb-4">{loadError || 'Branch details are currently unavailable.'}</p>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1F3A] text-white text-xs font-bold hover:bg-[#142B4E] transition-colors cursor-pointer"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  // 1. Collection Today (actual branch value)
  const todayCollection = currentBranch.todayCollection ?? 0;

  // 2. Pending Loans (actual pending loan count and amount)
  const pendingLoansList = currentBranch.pendingLoansList || [];
  const pendingLoansCount = pendingLoansList.length > 0
    ? pendingLoansList.length
    : (currentBranch.pendingLoans ?? 0);
  const totalPendingAmount = pendingLoansList.reduce((sum, l) => sum + (l.amount || 0), 0);

  // 3. Loan Disbursed (actual disbursed loan count and amount)
  const disbursedList = currentBranch.disbursedLoansList || [];
  const totalDisbursedAmount = disbursedList.reduce((sum, l) => sum + (l.sanctionedAmount || 0), 0);
  const disbursedCount = disbursedList.length;

  // 4. Attendance (actual employee present and total counts)
  const presentEmployees = currentBranch.presentEmployees ?? 0;
  const totalEmployees = currentBranch.totalEmployees ?? 0;
  const attendanceRate = currentBranch.attendancePercentage ?? 0;

  // 5. Customer Relationship Officer (CRO) Performance (actual CRO records)
  const agentPerformanceList: BranchAgentPerformance[] = currentBranch.agentPerformance || [];
  const totalAgentCollected = agentPerformanceList.reduce((sum, a) => sum + (a.collectedAmount || 0), 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-5 font-jakarta pb-16 pr-1">
      {/* ── TOP HEADER CARD & LIVE STATUS BAR ── */}
      <div className="bg-[#0B1F3A] rounded-2xl border border-[#243E66] shadow-[0_1px_3px_rgba(15,23,42,0.04)] relative z-10 overflow-hidden">
        <div className="bg-[#0B1F3A] rounded-t-2xl px-4 py-3 sm:px-6 sm:py-3.5 border-b border-[#243E66] flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <div className="w-1.5 h-4 sm:h-5 bg-[#D4AF37] rounded-full shrink-0" />
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-white tracking-tight font-jakarta whitespace-nowrap">
                Branch Manager Dashboard
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#F5D061] border border-[#D4AF37]/40 font-jakarta tabular-nums shrink-0">
                {currentBranch.code}
              </span>
            </div>
          </div>

          {/* Live Status Capsule & Custom Branch Switcher (Perfect Compact Alignment) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 w-full xl:w-auto self-start xl:self-center shrink-0">
            {/* Live Capsule Pill */}
            <div className="w-full sm:w-auto overflow-x-auto no-scrollbar py-1 px-2.5 sm:px-3 rounded-xl bg-[#071324]/95 border border-white/[0.14] text-[11px] font-jakarta shadow-inner flex items-center justify-between sm:justify-start gap-2 shrink-0 touch-pan-x min-h-[34px]">
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-[10.5px] uppercase tracking-wider shrink-0 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
              <span className="text-white/25 shrink-0">•</span>
              <span className="inline-flex items-center gap-1 text-amber-300 font-medium text-[11px] shrink-0 whitespace-nowrap">
                <Calendar size={11} className="text-[#D4AF37] shrink-0" />
                <span className="hidden sm:inline">{currentDate || 'Live'}</span>
                <span className="sm:hidden">{currentDate ? currentDate.replace(/^[A-Za-z]+, /, '') : 'Live'}</span>
              </span>
              <span className="text-white/25 shrink-0">•</span>
              <span className="inline-flex items-center gap-1 text-white font-manrope font-bold text-[11px] tabular-nums shrink-0 whitespace-nowrap">
                <Clock size={11} className="text-[#D4AF37] shrink-0" />
                {currentTime}
              </span>
              <span className="text-white/25 shrink-0">•</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-400/20 text-[#F5D061] text-[9.5px] font-bold uppercase tracking-wider shrink-0 whitespace-nowrap">
                <Sun size={9} className="shrink-0" />
                Shift
              </span>
            </div>

            {/* Custom SaaS Branch Switcher Dropdown (With Full Keyboard Navigation) */}
            <div className="relative w-full sm:w-auto" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => {
                  if (isBranchDropdownOpen) {
                    setIsBranchDropdownOpen(false);
                  } else {
                    const curIdx = branches.findIndex((b) => b.id === currentBranch.id);
                    setFocusedBranchIndex(curIdx >= 0 ? curIdx : 0);
                    setIsBranchDropdownOpen(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (!isBranchDropdownOpen) {
                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      const curIdx = branches.findIndex((b) => b.id === currentBranch.id);
                      setFocusedBranchIndex(curIdx >= 0 ? curIdx : 0);
                      setIsBranchDropdownOpen(true);
                    }
                  }
                }}
                className={`w-full sm:w-auto min-h-[34px] flex items-center justify-between sm:justify-start gap-2 px-3 py-1 rounded-xl text-xs font-jakarta font-semibold transition-all cursor-pointer outline-none ${
                  isBranchDropdownOpen
                    ? 'bg-white/[0.16] border border-[#D4AF37] ring-2 ring-[#D4AF37]/40 text-white shadow-sm'
                    : 'bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 hover:border-white/40 text-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/40'
                }`}
                aria-haspopup="listbox"
                aria-expanded={isBranchDropdownOpen}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 size={13} className="text-[#D4AF37] shrink-0" />
                  <span className="font-bold text-xs text-white truncate max-w-[200px] sm:max-w-[190px]">
                    {currentBranch.name} ({currentBranch.code})
                  </span>
                </div>
                <ChevronDown
                  size={13}
                  className={`text-slate-300 shrink-0 transition-transform duration-200 ${
                    isBranchDropdownOpen ? 'rotate-180 text-[#D4AF37]' : ''
                  }`}
                />
              </button>

              {/* Floating Menu with Clean SaaS Styling & Full Keyboard Navigation */}
              {isBranchDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-[#0B1F3A] border border-[#243E66] shadow-[0_20px_50px_rgba(0,0,0,0.65)] rounded-2xl overflow-hidden py-1.5 z-50 font-jakarta animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-white/[0.08] text-[10.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Select Branch</span>
                    <span className="text-[#D4AF37] text-[10px] font-semibold">{branches.length} Branches</span>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto no-scrollbar py-1 divide-y divide-white/[0.04]">
                    {branches.map((b, idx) => {
                      const isSelected = b.id === currentBranch.id;
                      const isFocused = idx === focusedBranchIndex;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onMouseEnter={() => setFocusedBranchIndex(idx)}
                          onClick={() => {
                            handleBranchChange(b.id);
                            setIsBranchDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs transition-all cursor-pointer outline-none ${
                            isFocused
                              ? 'bg-white/[0.15] ring-1 ring-inset ring-[#D4AF37]'
                              : isSelected
                              ? 'bg-[#D4AF37]/15'
                              : 'hover:bg-white/[0.08]'
                          } ${isSelected ? 'text-[#F5D061] font-bold' : 'text-white'}`}
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <div className="truncate font-bold text-xs text-white flex items-center gap-2">
                              <span>{b.name}</span>
                              {isFocused && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[#D4AF37] font-semibold">{b.code}</span>
                              <span>•</span>
                              <span>{b.city}</span>
                              {b.status === 'Disabled' && (
                                <span className="text-rose-400 font-semibold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[10px]">
                                  Disabled
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <Check size={16} className="text-[#D4AF37] shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Branch Metadata Bar (Slim & Elegant) */}
        <div className="px-4 py-2 sm:px-6 sm:py-2.5 bg-[#F8FAFC] rounded-b-2xl border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5 text-[11.5px] sm:text-xs font-jakarta text-[#64748B]">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <span className="font-semibold text-[#0B1F3A]">
              Current Branch: <strong className="text-[#0B1F3A] font-bold">{currentBranch.name}</strong>
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1 font-medium">
              <MapPin size={12} className="text-[#D4AF37]" />
              {currentBranch.city}, {currentBranch.state}
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1 font-medium">
              <User size={12} className="text-[#0B1F3A]" />
              Manager: <strong className="text-[#0B1F3A] font-semibold">{currentBranch.manager}</strong>
            </span>
          </div>

          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {currentBranch.status}
          </span>
        </div>
      </div>

      {/* ── 5 PRIMARY PDF-DEFINED KPI CARDS (Matching Image 2 Style & Spacing) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* CARD 1: Collection Today */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md transition-all flex flex-col justify-between min-h-[148px] h-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 font-jakarta tracking-normal truncate">
              Collection Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shrink-0">
              <Wallet size={16} className="text-emerald-600" />
            </div>
          </div>
          <div className="my-auto py-1">
            <div
              className="text-2xl xl:text-[28px] font-extrabold text-[#0B1F3A] font-manrope tabular-nums tracking-tight truncate"
              title={formatFullINR(todayCollection)}
            >
              {formatCompactINR(todayCollection)}
            </div>
          </div>
          <div className="text-[11.5px] font-medium text-slate-400 font-jakarta truncate flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
            Today's branch collection
          </div>
        </div>

        {/* CARD 2: Pending Loans */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md transition-all flex flex-col justify-between min-h-[148px] h-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 font-jakarta tracking-normal truncate">
              Pending Loans
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0">
              <Clock size={16} className="text-amber-600" />
            </div>
          </div>
          <div className="my-auto py-1">
            <div className="text-2xl xl:text-[28px] font-extrabold text-amber-600 font-manrope tabular-nums tracking-tight truncate">
              {pendingLoansCount}
            </div>
          </div>
          <div className="text-[11.5px] font-medium text-slate-400 font-jakarta truncate">
            {totalPendingAmount > 0
              ? `${formatCompactINR(totalPendingAmount)} pending approval`
              : 'Awaiting manager approval'}
          </div>
        </div>

        {/* CARD 3: Loan Disbursed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md transition-all flex flex-col justify-between min-h-[148px] h-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 font-jakarta tracking-normal truncate">
              Loan Disbursed
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center shrink-0">
              <CreditCard size={16} className="text-[#B8860B]" />
            </div>
          </div>
          <div className="my-auto py-1">
            <div
              className="text-2xl xl:text-[28px] font-extrabold text-[#B8860B] font-manrope tabular-nums tracking-tight truncate"
              title={formatFullINR(totalDisbursedAmount)}
            >
              {totalDisbursedAmount > 0 ? formatCompactINR(totalDisbursedAmount) : '₹0'}
            </div>
          </div>
          <div className="text-[11.5px] font-medium text-slate-400 font-jakarta truncate">
            {disbursedCount} loans disbursed
          </div>
        </div>

        {/* CARD 4: Attendance */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md transition-all flex flex-col justify-between min-h-[148px] h-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 font-jakarta tracking-normal truncate">
              Attendance
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shrink-0">
              <UserCheck size={16} className="text-emerald-600" />
            </div>
          </div>
          <div className="my-auto py-1">
            <div className="text-2xl xl:text-[28px] font-extrabold text-emerald-600 font-manrope tabular-nums tracking-tight truncate">
              {totalEmployees > 0 ? `${presentEmployees} / ${totalEmployees}` : 'Not Available'}
            </div>
          </div>
          <div className="text-[11.5px] font-medium text-slate-400 font-jakarta truncate">
            {attendanceRate}% present today
          </div>
        </div>

        {/* CARD 5: Customer Relationship Officer (CRO) Performance */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md transition-all flex flex-col justify-between min-h-[148px] h-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 font-jakarta tracking-normal truncate">
              Customer Relationship Officers (CROs)
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <Users size={16} className="text-[#0B1F3A]" />
            </div>
          </div>
          <div className="my-auto py-1">
            <div className="text-2xl xl:text-[28px] font-extrabold text-[#0B1F3A] font-manrope tabular-nums tracking-tight truncate">
              {agentPerformanceList.length > 0 ? `${agentPerformanceList.length} Active` : 'No Data'}
            </div>
          </div>
          <div className="text-[11.5px] font-medium text-slate-400 font-jakarta truncate">
            {agentPerformanceList.length > 0 ? `${formatCompactINR(totalAgentCollected)} collected today` : 'No collection activity'}
          </div>
        </div>
      </div>

      {/* ── CUSTOMER RELATIONSHIP OFFICER (CRO) PERFORMANCE SECTION ── */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="bg-[#0B1F3A] px-5 py-4 border-b border-[#243E66] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full shrink-0" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-jakarta">
              Customer Relationship Officer (CRO) Performance
            </h2>
          </div>
          <span className="text-xs text-slate-300 font-jakarta font-medium px-2.5 py-0.5 rounded-full bg-white/[0.08] border border-white/10">
            {agentPerformanceList.length} Active Officers (CROs) • {currentBranch.name}
          </span>
        </div>

        <div className="p-5 lg:p-6 space-y-6">
          {agentPerformanceList.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Users size={22} />
              </div>
              <p className="text-sm font-bold text-[#0B1F3A] font-jakarta">No Customer Relationship Officer (CRO) data available</p>
              <p className="text-xs text-[#64748B] mt-1 font-jakarta font-medium">
                No Customer Relationship Officer (CRO) activity recorded for {currentBranch.name} today.
              </p>
            </div>
          ) : (
            /* Agent Activity Table (SaaS Elevation: Table-Fixed, Proportional Widths, Manrope Financial Numbers) */
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs">
              {/* Table Header Capsule */}
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#0B1F3A] text-[#D4AF37] flex items-center justify-center shadow-xs shrink-0">
                      <Users size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[13px] font-extrabold text-[#0B1F3A] uppercase tracking-wider font-jakarta">
                          Field Officer (CRO) Roster & Daily Breakdown
                        </h3>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live Sync
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-400 font-jakarta mt-0.5">
                        Daily individual officer collection performance & territory route tracking
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-[#0B1F3A] text-white px-3.5 py-1.5 rounded-xl border border-[#D4AF37]/40 shadow-xs flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-300 font-jakarta uppercase tracking-wider">
                        Total Verified:
                      </span>
                      <span className="text-[14px] font-black text-[#D4AF37] font-manrope tabular-nums">
                        {formatFullINR(totalAgentCollected)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto w-full custom-scrollbar">
                  <table className="w-full text-left text-xs font-jakarta table-fixed min-w-[760px]">
                    <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
                      <tr>
                        <th className="w-[26%] py-4 px-6 text-left">
                          Customer Relationship Officer (CRO)
                        </th>
                        <th className="w-[32%] py-4 px-5 text-left">
                          Assigned Center / Route
                        </th>
                        <th className="w-[14%] py-4 px-4 text-center">
                          Collections
                        </th>
                        <th className="w-[16%] py-4 px-6 text-right">
                          Today's Collection
                        </th>
                        <th className="w-[12%] py-4 px-5 text-center">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {agentPerformanceList.map((agent, index) => {
                        const col = INFOGRAPHIC_COLORS[index % INFOGRAPHIC_COLORS.length];
                        return (
                          <tr
                            key={agent.agentId || index}
                            className="hover:bg-slate-50/90 border-l-4 border-transparent hover:border-[#D4AF37] transition-all duration-150"
                          >
                            {/* Agent Name + Color Badge */}
                            <td className="py-4 px-6 text-left">
                              <div className="flex items-center gap-3.5">
                                <div
                                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 shadow-xs select-none ring-2 ring-white"
                                  style={{ backgroundColor: col.primary }}
                                >
                                  {agent.agentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-[13.5px] text-[#0B1F3A] font-jakarta tracking-tight truncate">
                                      {agent.agentName}
                                    </span>
                                  </div>
                                  <div className="text-[11px] font-medium text-slate-400 font-jakarta flex items-center gap-1.5 mt-0.5">
                                    <User size={11} className="text-slate-400" />
                                    <span>Field Officer</span>
                                    <span className="text-slate-300">•</span>
                                    <span className="font-manrope font-semibold text-slate-500 tabular-nums">#{String(index + 101)}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Route / Center */}
                            <td className="py-4 px-5 text-left">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 border border-slate-200/60 flex items-center justify-center shrink-0">
                                  <MapPin size={13} />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[12.5px] font-semibold text-slate-700 font-jakarta block truncate">
                                    {agent.centerOrRoute || 'Assigned Center Route'}
                                  </span>
                                  <span className="text-[10px] font-medium text-slate-400 font-jakarta flex items-center gap-1 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    Field Route Territory
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Collections (Count) */}
                            <td className="py-4 px-4 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <div className="inline-flex items-baseline gap-1 font-manrope">
                                  <span className="font-black text-[15px] text-[#0B1F3A] tabular-nums">
                                    {agent.collectionsCount}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-400 font-jakarta uppercase">
                                    txns
                                  </span>
                                </div>
                                <span className="text-[10px] font-medium text-slate-400 font-jakarta">
                                  Receipts Logged
                                </span>
                              </div>
                            </td>

                            {/* Today's Collection (Amount) */}
                            <td className="py-4 px-6 text-right">
                              <div className="flex flex-col items-end">
                                <div className="font-manrope font-black text-[15.5px] text-[#0B1F3A] tabular-nums tracking-tight">
                                  {formatFullINR(agent.collectedAmount)}
                                </div>
                                <div className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-600 font-jakarta mt-0.5">
                                  <CheckCircle2 size={11} className="text-emerald-500" />
                                  <span>Cash Verified</span>
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-5 text-center">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs font-jakarta">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {agent.status || 'Active'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gradient-to-r from-slate-50 via-[#F8FAFC] to-slate-50 border-t-2 border-slate-200 font-jakarta">
                      <tr>
                        <td colSpan={2} className="py-4 px-6 text-left">
                          <div className="flex items-center gap-2.5">
                            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
                            <span className="text-xs font-black text-[#0B1F3A] uppercase tracking-wider">
                              Branch Field Total
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 hidden md:inline">
                              ({agentPerformanceList.length} Active Officers Reconciled)
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center justify-center font-manrope">
                            <div className="inline-flex items-baseline gap-1">
                              <span className="font-black text-[14px] text-[#0B1F3A] tabular-nums">
                                {agentPerformanceList.reduce((acc, curr) => acc + (Number(curr.collectionsCount) || 0), 0)}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500 font-jakarta uppercase">
                                txns
                              </span>
                            </div>
                            <span className="text-[9.5px] font-semibold text-slate-400 font-jakarta">
                              Total Logs
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-manrope">
                          <div className="flex flex-col items-end">
                            <span className="font-black text-[16px] text-[#0B1F3A] tabular-nums tracking-tight">
                              {formatFullINR(totalAgentCollected)}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 font-jakarta">
                              100% Reconciled
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full shadow-2xs font-jakarta">
                            <Check size={12} className="stroke-[2.5]" />
                            <span>Synced</span>
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
          )}
        </div>
      </div>

      {/* ── CORE OPERATIONS & QUICK ACCESS SECTION (8 PDF-DEFINED MODULES) ── */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider font-jakarta">
                  Core Operational Modules & Quick Access
                </h2>
                <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-jakarta">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-[11.5px] text-slate-500 font-jakarta font-medium mt-0.5">
                Direct access to core Branch Manager operational modules • Module 12 PDF compliant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-semibold text-slate-500 font-jakarta tabular-nums px-3 py-1 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              8 Standard Workflows
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              id: 'customers',
              title: 'Manage Customers',
              category: 'Clientele',
              desc: 'KYC records, borrower directory & profile verification.',
              icon: <Users size={20} />,
              iconBox: 'bg-amber-50 border-amber-200/90 text-amber-700 group-hover:bg-amber-100 group-hover:border-amber-300 group-hover:text-amber-900 group-hover:shadow-xs',
              topGradient: 'from-amber-400 via-[#D4AF37] to-amber-600',
              glowColor: 'bg-amber-400/15',
              badge: currentBranch.totalCustomers ? `${currentBranch.totalCustomers} Customers` : undefined,
              badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/70',
              actionText: 'Browse Directory',
              path: '/customers',
            },
            {
              id: 'collection-groups',
              title: 'Collection Groups',
              category: 'Center Routes',
              desc: 'Center mapping, group leaders & recurring schedules.',
              icon: <Grid size={20} />,
              iconBox: 'bg-slate-100/90 border-slate-200/90 text-[#0B1F3A] group-hover:bg-slate-200 group-hover:border-slate-300 group-hover:text-[#0B1F3A] group-hover:shadow-xs',
              topGradient: 'from-[#0B1F3A] via-[#1E3A8A] to-[#0B1F3A]',
              glowColor: 'bg-blue-500/15',
              badge: undefined,
              badgeClass: '',
              actionText: 'Manage Centers',
              path: '/collection-groups',
            },
            {
              id: 'daily-collections',
              title: 'Daily Collections',
              category: 'Cashflow',
              desc: 'Real-time field receipts, collection posting & audit.',
              icon: <Wallet size={20} />,
              iconBox: 'bg-emerald-50 border-emerald-200/90 text-emerald-700 group-hover:bg-emerald-100 group-hover:border-emerald-300 group-hover:text-emerald-900 group-hover:shadow-xs',
              topGradient: 'from-emerald-400 via-emerald-500 to-teal-600',
              glowColor: 'bg-emerald-400/15',
              badge: todayCollection > 0 ? `${formatCompactINR(todayCollection)} Today` : undefined,
              badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/70 font-bold',
              hasLiveDot: true,
              actionText: 'Post & Review',
              path: '/collections/daily',
            },
            {
              id: 'loan-approval',
              title: 'Loan Approval',
              category: 'Underwriting',
              desc: 'Underwriting queue, applicant limits & branch sanction.',
              icon: <CheckSquare size={20} />,
              iconBox: 'bg-blue-50 border-blue-200/90 text-blue-700 group-hover:bg-blue-100 group-hover:border-blue-300 group-hover:text-blue-900 group-hover:shadow-xs',
              topGradient: 'from-blue-400 via-indigo-500 to-blue-600',
              glowColor: 'bg-blue-400/15',
              badge: pendingLoansCount > 0 ? `${pendingLoansCount} Pending` : undefined,
              badgeClass: 'bg-amber-50 text-amber-800 border-amber-300/80 font-bold',
              actionText: 'Verify Proposals',
              path: '/approvals',
            },
            {
              id: 'daily-closing',
              title: 'Daily Closing',
              category: 'EOD Settlement',
              desc: 'Vault reconciliation, cash balance & day lock protocol.',
              icon: <Lock size={20} />,
              iconBox: 'bg-orange-50 border-orange-200/90 text-orange-700 group-hover:bg-orange-100 group-hover:border-orange-300 group-hover:text-orange-900 group-hover:shadow-xs',
              topGradient: 'from-amber-500 via-orange-500 to-amber-600',
              glowColor: 'bg-amber-500/15',
              badge: undefined,
              badgeClass: '',
              actionText: 'Perform Settlement',
              path: '/daily-closing',
            },
            {
              id: 'collection-sheets',
              title: 'Collection Sheets',
              category: 'Logistics Desk',
              desc: 'Batch generation & printouts for field collection staff.',
              icon: <Printer size={20} />,
              iconBox: 'bg-slate-100 border-slate-200 text-slate-700 group-hover:bg-slate-200 group-hover:border-slate-300 group-hover:text-slate-900 group-hover:shadow-xs',
              topGradient: 'from-slate-400 via-slate-600 to-slate-800',
              glowColor: 'bg-slate-400/15',
              badge: undefined,
              badgeClass: '',
              actionText: 'Generate Sheets',
              path: '/printing',
            },
            {
              id: 'attendance',
              title: 'Staff Attendance',
              category: 'Operations',
              desc: 'Field agent shift punch, check-in log & branch roll.',
              icon: <Clock size={20} />,
              iconBox: 'bg-indigo-50 border-indigo-200/90 text-indigo-700 group-hover:bg-indigo-100 group-hover:border-indigo-300 group-hover:text-indigo-900 group-hover:shadow-xs',
              topGradient: 'from-indigo-400 via-indigo-500 to-purple-600',
              glowColor: 'bg-indigo-400/15',
              badge: totalEmployees > 0 ? `${presentEmployees}/${totalEmployees} Present` : undefined,
              badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200/70 font-bold',
              actionText: 'Monitor Roster',
              path: '/attendance',
            },
            {
              id: 'reports',
              title: 'Reports & Statements',
              category: 'Intelligence',
              desc: 'Loan portfolio reports, overdue analysis & export.',
              icon: <FileText size={20} />,
              iconBox: 'bg-purple-50 border-purple-200/90 text-purple-700 group-hover:bg-purple-100 group-hover:border-purple-300 group-hover:text-purple-900 group-hover:shadow-xs',
              topGradient: 'from-purple-400 via-fuchsia-500 to-purple-600',
              glowColor: 'bg-purple-400/15',
              badge: undefined,
              badgeClass: '',
              actionText: 'View Statements',
              path: '/reports/all',
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.path)}
              className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between min-h-[175px] shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:border-slate-300 transition-colors duration-200 cursor-pointer group"
            >

              <div>
                {/* Header Row: Icon + Category Tag + Live Badge */}
                <div className="flex items-start justify-between gap-2 mb-3.5">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 ${item.iconBox}`}>
                    {item.icon}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-slate-400 font-jakarta">
                      {item.category}
                    </span>
                    {item.badge && (
                      <span className={`inline-flex items-center gap-1.5 text-[10.5px] px-2.5 py-0.5 rounded-full border font-jakarta ${item.badgeClass}`}>
                        {item.hasLiveDot && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        <span>{item.badge}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Microcopy */}
                <h3 className="font-bold text-sm text-[#0B1F3A] group-hover:text-[#0B1F3A] transition-colors font-jakarta tracking-tight">
                  {item.title}
                </h3>
                <p className="text-[11.5px] text-slate-500 mt-1 line-clamp-2 font-jakarta leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>

              {/* Action Bar (Bespoke Action Label + High-End ArrowUpRight Circular Launcher) */}
              <div className="pt-3.5 mt-2 border-t border-slate-100/90 flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-slate-500 group-hover:text-[#0B1F3A] transition-colors font-jakarta">
                  {item.actionText}
                </span>

                <div className="w-7 h-7 rounded-lg bg-slate-100/80 border border-slate-200/60 text-slate-500 group-hover:bg-[#0B1F3A] group-hover:text-[#D4AF37] group-hover:border-[#0B1F3A] group-hover:shadow-xs flex items-center justify-center transition-all duration-200">
                  <ArrowUpRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default BranchDashboard;
