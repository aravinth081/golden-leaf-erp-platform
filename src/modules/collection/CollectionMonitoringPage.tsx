// ──────────────────────────────────────────────────
// GOLDEN LEAF FINANCE — COLLECTION MONITORING
// PDF-Strict Daily Collection, Route Planner & Delay Oversight
// Modules: Collection Management + Daily Collection Planner
// Read-only oversight of Today, Tomorrow, Area Route, Advance, NC & Delays
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Search,
  Eye,
  X,
  IndianRupee,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Briefcase,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Navigation,
  Copy,
  Check,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Keyboard,
} from 'lucide-react';
import { MonitoringNav } from '../monitoring/MonitoringNav';
import { useUIStore } from '../../store';
import { Avatar } from '../../components/ui';
import {
  getMonitoredCollections,
  type MonitoredCollection,
  type MonitoredCollectionCategory,
} from '../../services/monitoringDataService';

export const CollectionMonitoringPage: React.FC = () => {
  const selectedBranchId = useUIStore((s) => s.selectedBranchId);
  const [collections, setCollections] = useState<MonitoredCollection[]>([]);
  const [activeCategory, setActiveCategory] = useState<MonitoredCollectionCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<MonitoredCollection | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(0);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Load branch-filtered and category-filtered collections
  useEffect(() => {
    const list = getMonitoredCollections(selectedBranchId, activeCategory);
    setCollections(list);
  }, [selectedBranchId, activeCategory]);

  // Keep focusedRowIndex within bounds
  useEffect(() => {
    setFocusedRowIndex((prev) => {
      if (collections.length === 0) return 0;
      return Math.min(prev, Math.max(0, collections.length - 1));
    });
  }, [collections.length]);

  const fmt = (num: number) => `₹${num.toLocaleString('en-IN')}`;

  // Distinct agent options
  const agentOptions = useMemo(() => {
    return Array.from(new Set(collections.map((c) => c.agentName))).filter(Boolean);
  }, [collections]);

  // Search & dropdown filter
  const filteredCollections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return collections.filter((c) => {
      const matchSearch =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.customerId.toLowerCase().includes(q) ||
        c.agentName.toLowerCase().includes(q) ||
        c.areaRoute.toLowerCase().includes(q) ||
        c.loanId.toLowerCase().includes(q) ||
        (c.receiptNumber && c.receiptNumber.toLowerCase().includes(q));

      const matchAgent = agentFilter === 'all' || c.agentName === agentFilter;
      const matchStatus = statusFilter === 'all' || c.status.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchAgent && matchStatus;
    });
  }, [collections, searchQuery, agentFilter, statusFilter]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalExpected = collections.reduce((a, b) => a + b.expectedAmount, 0);
    const totalCollected = collections.reduce((a, b) => a + b.collectedAmount, 0);
    const totalPending = collections.reduce((a, b) => a + b.pendingAmount, 0);
    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 100;
    const ncCount = collections.filter((c) => c.status === 'nc' || c.status === 'delayed').length;
    const activeAgents = Array.from(new Set(collections.map((c) => c.agentName))).filter(Boolean);

    const latestCollection = collections.find(
      (c) => c.status === 'collected' && c.collectedAmount > 0
    );

    return {
      totalExpected,
      totalCollected,
      totalPending,
      collectionRate,
      ncCount,
      agentCount: activeAgents.length,
      latestCollection,
    };
  }, [collections]);

  // Category Tabs Definition
  const categories: { key: MonitoredCollectionCategory; label: string }[] = [
    { key: 'all', label: 'All Inflows' },
    { key: 'today', label: "Today's Collection" },
    { key: 'tomorrow', label: 'Tomorrow Collection' },
    { key: 'area_route', label: 'Area-wise Route' },
    { key: 'advance', label: 'Advance Collection' },
    { key: 'pending_nc', label: 'Pending (NC)' },
    { key: 'delay_tracking', label: 'Delay Tracking' },
    { key: 'history', label: 'Collection History' },
  ];

  const isAnyFilterActive =
    searchQuery !== '' || agentFilter !== 'all' || statusFilter !== 'all' || activeCategory !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setAgentFilter('all');
    setStatusFilter('all');
    setActiveCategory('all');
  };

  // Keyboard Navigation: Up/Down row highlight, Enter to inspect, Esc to close, Left/Right in modal, '[' & ']' for categories
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
        if (selectedRecord) {
          setSelectedRecord(null);
          return;
        }
        if (isInput) {
          target?.blur();
          return;
        }
      }

      // If user presses '/' when not in input, focus search box
      if (e.key === '/' && !isInput && !selectedRecord) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (isInput) return;

      // Inside Modal: Left / Right / Up / Down / PageUp / PageDown cycles records
      if (selectedRecord) {
        const curIdx = filteredCollections.findIndex((c) => c.id === selectedRecord.id);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
          e.preventDefault();
          if (filteredCollections.length > 0) {
            const nextIdx = curIdx >= 0 && curIdx < filteredCollections.length - 1 ? curIdx + 1 : 0;
            setSelectedRecord(filteredCollections[nextIdx]);
            setFocusedRowIndex(nextIdx);
            rowRefs.current[nextIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
          e.preventDefault();
          if (filteredCollections.length > 0) {
            const prevIdx = curIdx > 0 ? curIdx - 1 : filteredCollections.length - 1;
            setSelectedRecord(filteredCollections[prevIdx]);
            setFocusedRowIndex(prevIdx);
            rowRefs.current[prevIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }
        return;
      }

      // '[' and ']' cycle collection categories
      if (e.key === '[' || (e.shiftKey && e.key === 'ArrowLeft')) {
        e.preventDefault();
        const catIdx = categories.findIndex((c) => c.key === activeCategory);
        const prevCat = catIdx > 0 ? categories[catIdx - 1].key : categories[categories.length - 1].key;
        setActiveCategory(prevCat);
        return;
      } else if (e.key === ']' || (e.shiftKey && e.key === 'ArrowRight')) {
        e.preventDefault();
        const catIdx = categories.findIndex((c) => c.key === activeCategory);
        const nextCat = catIdx >= 0 && catIdx < categories.length - 1 ? categories[catIdx + 1].key : categories[0].key;
        setActiveCategory(nextCat);
        return;
      }

      // Table Row navigation when modal is NOT open
      if (filteredCollections.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRowIndex((prev) => {
          const next = Math.min(filteredCollections.length - 1, prev + 1);
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
        const item = filteredCollections[focusedRowIndex];
        if (item) setSelectedRecord(item);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRecord, filteredCollections, focusedRowIndex, activeCategory, categories]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 sm:p-5 lg:p-6 flex flex-col gap-5 pb-16 font-sans max-w-full text-[#0B1F3A]"
    >
      {/* Shared Navigation Header */}
      <MonitoringNav currentTab="collections" />

      {/* ── 1. EXECUTIVE KPI SUMMARY (LIVE COLLECTION METRICS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Collected Inflows */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-[0_2px_8px_rgba(11,31,58,0.04)] hover:shadow-md hover:border-[#D4AF37]/50 transition-all duration-200 flex flex-col justify-between min-h-[142px] group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans leading-tight">
              Collected Inflow
            </span>
            <div className="w-8.5 h-8.5 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/80 shadow-2xs group-hover:scale-105 transition-transform">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="my-2.5 flex items-baseline justify-between">
            <span className="text-2xl sm:text-[26px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums">
              {fmt(stats.totalCollected)}
            </span>
            <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {stats.collectionRate}% Rate
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block shrink-0" />
            <span className="truncate">Real-time reconciled collections</span>
          </div>
        </div>

        {/* Card 2: Expected Target */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-[0_2px_8px_rgba(11,31,58,0.04)] hover:shadow-md hover:border-[#D4AF37]/50 transition-all duration-200 flex flex-col justify-between min-h-[142px] group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans leading-tight">
              Expected Target
            </span>
            <div className="w-8.5 h-8.5 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80 shadow-2xs group-hover:scale-105 transition-transform">
              <Wallet size={16} />
            </div>
          </div>
          <div className="my-2.5 flex items-baseline justify-between">
            <span className="text-2xl sm:text-[26px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums">
              {fmt(stats.totalExpected)}
            </span>
            <span className="text-[10.5px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {collections.length} Dues
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span className="truncate">Scheduled field &amp; center collections</span>
          </div>
        </div>

        {/* Card 3: Pending & NC Delinquency */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-[0_2px_8px_rgba(11,31,58,0.04)] hover:shadow-md hover:border-[#D4AF37]/50 transition-all duration-200 flex flex-col justify-between min-h-[142px] group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans leading-tight">
              Pending &amp; Delays
            </span>
            <div className="w-8.5 h-8.5 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200/80 shadow-2xs group-hover:scale-105 transition-transform">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="my-2.5 flex items-baseline justify-between">
            <span className="text-2xl sm:text-[26px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums">
              {fmt(stats.totalPending)}
            </span>
            <span className="text-[10.5px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              {stats.ncCount} Overdue
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span className="truncate">Non-collection codes logged</span>
          </div>
        </div>

        {/* Card 4: Field Beat Status */}
        <div className="bg-gradient-to-br from-[#0B1F3A] to-[#163864] text-white rounded-2xl p-5 shadow-[0_2px_10px_rgba(11,31,58,0.15)] flex flex-col justify-between min-h-[142px] relative overflow-hidden group">
          <Wallet size={80} className="absolute -right-4 -bottom-4 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
              Field Beat Live
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="my-2.5">
            <div className="text-sm font-bold text-white truncate">
              {stats.latestCollection?.customerName || 'Field Recovery Active'}
            </div>
            <div className="text-[11.5px] text-[#D4AF37] font-semibold mt-0.5">
              {stats.latestCollection
                ? `${fmt(stats.latestCollection.collectedAmount)} • ${stats.latestCollection.agentName}`
                : `${stats.agentCount} Officers (CROs) on Route`}
            </div>
          </div>
          <div className="pt-2 border-t border-white/10 text-[10.5px] text-slate-300 flex items-center gap-1.5 truncate">
            <Sparkles size={11} className="text-[#D4AF37] shrink-0" />
            <span className="truncate">
              {stats.latestCollection?.areaRoute || 'Real-time GPS reconciliation active'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. FILTER & CONTROLS TOOLBAR ── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-[0_1px_3px_rgba(11,31,58,0.04)] flex flex-col gap-3.5">
        {/* TOP SUB-ROW: PDF COLLECTION CATEGORIES (Section 17) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0B1F3A] text-white shadow-xs border border-[#D4AF37]/50'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* BOTTOM SUB-ROW: SEARCH, AGENT FILTER, STATUS FILTER & RESET */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Left: Search Box */}
          <div className="relative flex-1 sm:max-w-md min-w-[240px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, CRO, route, loan ID... (Press '/' to focus)"
              className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 border border-[#CBD5E1] focus:border-[#D4AF37] focus:bg-white text-xs text-[#0B1F3A] focus:outline-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Right: Filters & Reset Button */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Agent Filter */}
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-[#CBD5E1] text-xs font-semibold text-[#0B1F3A] focus:outline-none cursor-pointer max-w-[170px] truncate"
              title="Filter by Customer Relationship Officer (CRO)"
            >
              <option value="all">All CROs ({agentOptions.length})</option>
              {agentOptions.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-[#CBD5E1] text-xs font-semibold text-[#0B1F3A] focus:outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="collected">Collected</option>
              <option value="advance">Advance</option>
              <option value="partial">Partial</option>
              <option value="nc">Pending (NC)</option>
              <option value="delayed">Delayed</option>
            </select>

            {/* Reset Filters Button */}
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
              Showing <strong className="text-[#0B1F3A] font-manrope">{filteredCollections.length}</strong> records
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. MAIN COLLECTION TABLE ── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04)] overflow-hidden">
        {/* Table Title Bar */}
        <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full flex-shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-wider uppercase font-sans">
              Collection Monitoring &amp; Field Recovery Ledger
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300 font-medium">
              Showing <strong className="text-[#F5D061]">{filteredCollections.length}</strong> of {collections.length} records
            </span>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Sync Active</span>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto w-full custom-scrollbar">
          {filteredCollections.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                <Wallet size={22} className="text-[#0B1F3A]" />
              </div>
              <h3 className="text-sm font-bold text-[#0B1F3A]">No collection records found</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {selectedBranchId
                  ? 'No collection records found for the selected branch context.'
                  : 'No collection records match your active category or search filter.'}
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
            <table className="w-full text-left text-xs border-collapse min-w-[1200px] font-sans">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider select-none">
                  <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[160px]">Collection ID</th>
                  <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">Customer</th>
                  <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[220px]">Area / Route</th>
                  <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[200px]">Customer Relationship Officer (CRO)</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[130px]">Expected</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[130px]">Collected</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">Status</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[100px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredCollections.map((col, idx) => {
                  const isFocused = focusedRowIndex === idx;
                  return (
                    <tr
                      key={col.id}
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
                      {/* 1. COLLECTION ID */}
                      <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[160px]">
                        <div className="flex items-center gap-2">
                          {isFocused && (
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full shrink-0 -ml-2 animate-pulse" title="Focused row (Enter to view)" />
                          )}
                          <div>
                            <div className="font-bold text-[#0B1F3A] font-mono text-xs">{col.id}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                              <Calendar size={10} className="text-[#D4AF37]" />
                              <span>{col.date}</span>
                              {col.time && <span>• {col.time}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                    {/* 2. CUSTOMER */}
                    <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">
                      <div className="flex items-center gap-3">
                        <Avatar name={col.customerName} size="sm" className="shrink-0 ring-1 ring-slate-200/80 shadow-2xs" />
                        <div>
                          <div className="font-bold text-[#0B1F3A] text-xs">{col.customerName}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">Loan: {col.loanId}</div>
                        </div>
                      </div>
                    </td>

                    {/* 3. AREA / ROUTE */}
                    <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[220px]">
                      <div className="flex items-center gap-1.5 font-semibold text-[#0B1F3A] text-xs leading-snug">
                        <MapPin size={13} className="text-emerald-600 shrink-0" />
                        <span>{col.areaRoute}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 pl-4.5">
                        {col.branchName || 'Anna Nagar'}
                      </div>
                    </td>

                    {/* 4. AGENT */}
                    <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <Avatar name={col.agentName} size="xs" className="shrink-0 ring-1 ring-slate-200" />
                        <div>
                          <div className="font-bold text-[#0B1F3A] text-xs">
                            {col.agentName}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 5. EXPECTED */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[130px]">
                      <span className="font-manrope font-bold text-xs text-[#0B1F3A] tabular-nums">
                        {fmt(col.expectedAmount)}
                      </span>
                    </td>

                    {/* 6. COLLECTED */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[130px]">
                      <span
                        className={`font-manrope font-bold text-sm tabular-nums ${
                          col.collectedAmount > 0 ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        {fmt(col.collectedAmount)}
                      </span>
                    </td>

                    {/* 7. STATUS */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                          col.status === 'collected'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : col.status === 'advance'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : col.status === 'partial'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : col.status === 'nc'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : col.status === 'delayed'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            col.status === 'collected'
                              ? 'bg-emerald-600'
                              : col.status === 'advance'
                              ? 'bg-blue-600'
                              : col.status === 'partial'
                              ? 'bg-amber-600'
                              : col.status === 'nc'
                              ? 'bg-rose-600'
                              : col.status === 'delayed'
                              ? 'bg-purple-600'
                              : 'bg-slate-500'
                          }`}
                        />
                        <span>
                          {col.status === 'nc'
                            ? 'Pending (NC)'
                            : col.status === 'delayed'
                            ? 'Delayed'
                            : col.status}
                        </span>
                      </span>
                    </td>

                    {/* 8. ACTION */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[100px]">
                      <button
                        onClick={() => setSelectedRecord(col)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0B1F3A] hover:text-[#F5D061] text-[#0B1F3A] text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-2xs active:scale-95 group-hover:border-slate-300"
                        title={`View collection details for ${col.customerName}`}
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

      {/* ── 4. COLLECTION DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedRecord && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Collection Details Modal"
            onClick={() => setSelectedRecord(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs cursor-pointer font-sans"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#E2E8F0] w-[min(96vw,680px)] max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl relative font-sans cursor-default"
            >
              {/* Modal Header */}
              <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4.5 flex items-center justify-between text-white shrink-0 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-[#D4AF37] rounded-full shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-black uppercase tracking-wider font-mono text-white">
                        COLLECTION ENTRY: {selectedRecord.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold capitalize ${
                          selectedRecord.status === 'collected'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                            : selectedRecord.status === 'advance'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                            : selectedRecord.status === 'partial'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                            : selectedRecord.status === 'nc'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-400/40'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>
                          {selectedRecord.status === 'nc'
                            ? 'Pending (NC)'
                            : selectedRecord.status === 'delayed'
                            ? 'Delayed'
                            : selectedRecord.status}
                        </span>
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-medium flex items-center gap-2 mt-1">
                      <span className="text-white font-semibold">{selectedRecord.customerName}</span>
                      <span>•</span>
                      <span className="text-[#D4AF37] font-mono">{selectedRecord.branchName}</span>
                      <span>•</span>
                      <span className="text-slate-400">{selectedRecord.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Prev / Next record navigation buttons */}
                  <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        const curIdx = filteredCollections.findIndex((c) => c.id === selectedRecord.id);
                        const prevIdx = curIdx > 0 ? curIdx - 1 : filteredCollections.length - 1;
                        setSelectedRecord(filteredCollections[prevIdx]);
                        setFocusedRowIndex(prevIdx);
                        rowRefs.current[prevIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                      }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Previous Collection (← or ↑)"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[11px] font-mono text-slate-300 px-1.5 select-none">
                      {filteredCollections.findIndex((c) => c.id === selectedRecord.id) + 1}/{filteredCollections.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const curIdx = filteredCollections.findIndex((c) => c.id === selectedRecord.id);
                        const nextIdx = curIdx >= 0 && curIdx < filteredCollections.length - 1 ? curIdx + 1 : 0;
                        setSelectedRecord(filteredCollections[nextIdx]);
                        setFocusedRowIndex(nextIdx);
                        rowRefs.current[nextIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                      }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Next Collection (→ or ↓)"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedRecord(null)}
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
                  {/* Card 1: Expected Due */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-[0_2px_8px_rgba(11,31,58,0.04)] min-h-[116px] flex flex-col justify-between hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Expected Due
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 shrink-0">
                        <CreditCard size={12} strokeWidth={2.2} />
                      </div>
                    </div>
                    <div className="my-1">
                      <span className="text-2xl font-black text-[#0B1F3A] font-manrope tabular-nums tracking-tight block">
                        {fmt(selectedRecord.expectedAmount)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[10.5px]">
                      <span className="font-medium text-slate-400">Scheduled Demand</span>
                      <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200/70 text-[10px]">
                        Installment
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Collected Inflow */}
                  <div className="bg-white rounded-2xl border border-emerald-200/90 p-4 shadow-[0_2px_8px_rgba(16,185,129,0.04)] min-h-[116px] flex flex-col justify-between hover:border-emerald-300 transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                        Collected Inflow
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0">
                        <IndianRupee size={12} strokeWidth={2.4} />
                      </div>
                    </div>
                    <div className="my-1">
                      <span className="text-2xl font-black text-emerald-600 font-manrope tabular-nums tracking-tight block">
                        {fmt(selectedRecord.collectedAmount)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-emerald-100/70 flex items-center justify-between gap-1 text-[10.5px]">
                      <span className="font-medium text-slate-400">Realized Inflow</span>
                      <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px]">
                        {selectedRecord.collectedAmount >= selectedRecord.expectedAmount
                          ? '100% Paid'
                          : selectedRecord.collectedAmount > 0
                          ? `${Math.round((selectedRecord.collectedAmount / selectedRecord.expectedAmount) * 100)}% Recovered`
                          : 'Uncollected'}
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Pending Balance */}
                  <div
                    className={`bg-white rounded-2xl border p-4 min-h-[116px] flex flex-col justify-between transition-all ${
                      selectedRecord.pendingAmount > 0
                        ? 'border-rose-200/90 shadow-[0_2px_8px_rgba(244,63,94,0.04)] hover:border-rose-300'
                        : 'border-slate-200/90 shadow-[0_2px_8px_rgba(11,31,58,0.04)] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          selectedRecord.pendingAmount > 0 ? 'text-rose-800' : 'text-slate-500'
                        }`}
                      >
                        Pending Balance
                      </span>
                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                          selectedRecord.pendingAmount > 0
                            ? 'bg-rose-50 border-rose-200/80 text-rose-600'
                            : 'bg-emerald-50 border-emerald-200/80 text-emerald-600'
                        }`}
                      >
                        {selectedRecord.pendingAmount > 0 ? (
                          <AlertTriangle size={12} strokeWidth={2.2} />
                        ) : (
                          <CheckCircle2 size={12} strokeWidth={2.2} />
                        )}
                      </div>
                    </div>
                    <div className="my-1">
                      <span
                        className={`text-2xl font-black font-manrope tabular-nums tracking-tight block ${
                          selectedRecord.pendingAmount > 0 ? 'text-rose-600' : 'text-[#0B1F3A]'
                        }`}
                      >
                        {fmt(selectedRecord.pendingAmount)}
                      </span>
                    </div>
                    <div
                      className={`pt-2 border-t flex items-center justify-between gap-1 text-[10.5px] ${
                        selectedRecord.pendingAmount > 0 ? 'border-rose-100/70' : 'border-slate-100'
                      }`}
                    >
                      <span className="font-medium text-slate-400">Arrears Due</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                          selectedRecord.pendingAmount > 0
                            ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                        }`}
                      >
                        {selectedRecord.pendingAmount > 0 ? 'Overdue Due' : 'Zero Arrears'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Customer & Loan Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <Avatar name={selectedRecord.customerName} size="md" className="shrink-0 ring-2 ring-slate-100 shadow-2xs" />
                      <div>
                        <div className="font-extrabold text-[#0B1F3A] text-sm flex items-center gap-2">
                          <span>{selectedRecord.customerName}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10.5px] font-semibold">
                            {selectedRecord.customerId}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          Registered Borrower • Primary Account
                        </div>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B1F3A] text-[#F5D061] text-xs font-mono font-bold shadow-2xs">
                      <span>Loan:</span>
                      <span>{selectedRecord.loanId}</span>
                    </div>
                  </div>

                  {/* 4 Structured Tiles for operational details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                    {/* Tile 1: Route & Center */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <MapPin size={12} className="text-emerald-600" />
                        <span>Area / Route Beat</span>
                      </div>
                      <div className="font-bold text-[#0B1F3A] text-xs leading-snug">
                        {selectedRecord.areaRoute}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {selectedRecord.branchName}
                      </div>
                    </div>

                    {/* Tile 2: Customer Relationship Officer (CRO) */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <Briefcase size={12} className="text-blue-600" />
                        <span>Customer Relationship Officer (CRO)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Avatar name={selectedRecord.agentName} size="xs" className="shrink-0" />
                        <span className="font-bold text-[#0B1F3A] text-xs">{selectedRecord.agentName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Verified Customer Relationship Officer (CRO)
                      </div>
                    </div>

                    {/* Tile 3: Payment Mode & Receipt */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <Wallet size={12} className="text-[#D4AF37]" />
                        <span>Payment Mode &amp; Receipt</span>
                      </div>
                      <div className="font-bold text-[#0B1F3A] text-xs capitalize flex items-center gap-2">
                        <span>{selectedRecord.paymentMode || 'Cash Collection'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="px-2 py-0.5 rounded bg-white text-slate-700 font-mono text-[10.5px] font-bold border border-slate-200">
                          {selectedRecord.receiptNumber || 'N/A'}
                        </span>
                        {selectedRecord.receiptNumber && (
                          <button
                            type="button"
                            onClick={() => handleCopy(selectedRecord.receiptNumber)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Copy receipt number"
                          >
                            {copiedText === selectedRecord.receiptNumber ? (
                              <Check size={11} className="text-emerald-600" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tile 4: Tamper-Proof GPS Coordinates */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <Navigation size={12} className="text-teal-600" />
                        <span>Tamper-Proof GPS Punch</span>
                      </div>
                      {selectedRecord.geoLocation ? (
                        <>
                          <div className="font-mono text-xs font-bold text-[#0B1F3A]">
                            {selectedRecord.geoLocation}
                          </div>
                          <div className="text-[10.5px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                            <ShieldCheck size={11} />
                            <span>Encrypted location captured</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-slate-400 text-xs italic">
                          Location capture pending
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Non-Collection / Delay Audit (if applicable) */}
                {(selectedRecord.ncReasonCode || selectedRecord.ncRemarks || selectedRecord.delayedDays) && (
                  <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 text-amber-950 space-y-2 text-xs">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-900">
                      <AlertTriangle size={14} className="text-amber-600" />
                      <span>Non-Collection (NC) &amp; Delay Audit Record</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px] pt-1">
                      {selectedRecord.ncReasonCode && (
                        <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200">
                          <span className="text-[10px] font-bold text-amber-800 uppercase block">Reason Code</span>
                          <span className="font-bold text-amber-950 text-xs mt-0.5 block">{selectedRecord.ncReasonCode}</span>
                        </div>
                      )}
                      {selectedRecord.delayedDays !== undefined && (
                        <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200">
                          <span className="text-[10px] font-bold text-amber-800 uppercase block">Days Overdue</span>
                          <span className="font-bold text-rose-700 text-xs mt-0.5 block">{selectedRecord.delayedDays} Days Late</span>
                        </div>
                      )}
                    </div>
                    {selectedRecord.ncRemarks && (
                      <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200 text-xs">
                        <span className="text-[10px] font-bold text-amber-800 uppercase block">Collection Officer Remarks</span>
                        <p className="text-slate-800 mt-0.5 font-medium leading-relaxed">{selectedRecord.ncRemarks}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 font-mono">
                  GLF Real-Time Inflow System • Tamper-Proof Audit
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(null)}
                    className="py-2 px-5 rounded-xl bg-[#0B1F3A] hover:bg-[#163864] text-white font-bold cursor-pointer text-xs transition-all shadow-md active:scale-95"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CollectionMonitoringPage;
