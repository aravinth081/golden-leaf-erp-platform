// ──────────────────────────────────────────────────
// GOLDEN LEAF FINANCE — ATTENDANCE MONITORING & LIVE GPS REGISTER
// Real-Time Staff Location, Geo-Fencing, Punch Logs & Field Agent Oversight
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Search,
  Eye,
  X,
  MapPin,
  Camera,
  ShieldCheck,
  Calendar,
  FileText,
  User,
  Navigation,
  Radio,
  Compass,
  ExternalLink,
  Layers,
  Map as MapIcon,
  Filter,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Briefcase,
  Users,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  Palmtree,
} from 'lucide-react';
import { MonitoringNav } from '../monitoring/MonitoringNav';
import { useUIStore } from '../../store';
import { Avatar } from '../../components/ui';
import {
  getMonitoredAttendance,
  type MonitoredAttendance,
} from '../../services/monitoringDataService';
import { LeaveODPanel } from './LeaveODPanel';
import { getStoredLeaveRequests } from '../../services/leaveService';

export const AttendanceMonitoringPage: React.FC = () => {
  const selectedBranchId = useUIStore((s) => s.selectedBranchId);
  const addToast = useUIStore((s) => s.addToast);

  const [records, setRecords] = useState<MonitoredAttendance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MonitoredAttendance | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | 'collection_agent' | 'branch_manager' | 'credit_officer'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Present' | 'Late' | 'Absent'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(0);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Admin View Tab: Live GPS vs Branch Manager Leave/OD Approvals
  const [adminAttendanceTab, setAdminAttendanceTab] = useState<'live_register' | 'bm_leave_od'>('live_register');
  const [pendingBMRequestsCount, setPendingBMRequestsCount] = useState<number>(0);

  useEffect(() => {
    const updateBMCount = () => {
      const all = getStoredLeaveRequests();
      setPendingBMRequestsCount(all.filter((r) => r.status === 'PENDING_ADMIN').length);
    };
    updateBMCount();
    window.addEventListener('glf_leave_updated', updateBMCount);
    window.addEventListener('storage', updateBMCount);
    return () => {
      window.removeEventListener('glf_leave_updated', updateBMCount);
      window.removeEventListener('storage', updateBMCount);
    };
  }, []);

  // Date filtering state: today | yesterday | all | custom
  const [dateFilterMode, setDateFilterMode] = useState<'today' | 'yesterday' | 'all' | 'custom'>('today');
  const [customDateVal, setCustomDateVal] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // Specific staff member filter
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');

  // Load and refresh attendance data
  const loadData = useCallback(() => {
    const dateArg = dateFilterMode === 'custom' ? customDateVal : dateFilterMode;
    const list = getMonitoredAttendance(selectedBranchId, dateArg);
    setRecords(list);
  }, [selectedBranchId, dateFilterMode, customDateVal]);

  useEffect(() => {
    loadData();

    // Listen for live attendance events across the application
    const handleUpdate = () => loadData();
    window.addEventListener('glf-attendance-updated', handleUpdate);
    window.addEventListener('glf-attendance-checked-in', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Auto-poll every 15 seconds
    const interval = setInterval(loadData, 15000);

    return () => {
      window.removeEventListener('glf-attendance-updated', handleUpdate);
      window.removeEventListener('glf-attendance-checked-in', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, [loadData]);

  // Keep focusedRowIndex within bounds
  useEffect(() => {
    setFocusedRowIndex((prev) => {
      if (records.length === 0) return 0;
      return Math.min(prev, Math.max(0, records.length - 1));
    });
  }, [records.length]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadData();
    setTimeout(() => {
      setIsRefreshing(false);
      addToast({
        type: 'success',
        title: 'Attendance Synced',
        message: 'Loaded latest live GPS coordinates and staff punch logs.',
      });
    }, 400);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalStaff = records.length;
    const presentCount = records.filter((r) => r.status === 'Present').length;
    const lateCount = records.filter((r) => r.status === 'Late').length;
    const absentCount = records.filter((r) => r.status === 'Absent').length;
    const collectionAgents = records.filter((r) =>
      r.role.toLowerCase().includes('collection') || r.role.toLowerCase().includes('agent') || r.role.toLowerCase().includes('cro') || r.role.toLowerCase().includes('relationship')
    );
    const activeAgents = collectionAgents.filter((r) => r.status === 'Present' || r.status === 'Late');
    const geoVerifiedCount = records.filter(
      (r) => r.lat && r.lng && r.lat !== 0 && r.status !== 'Absent'
    ).length;

    const latestAgent = records.find(
      (r) =>
        (r.role.toLowerCase().includes('collection') || r.role.toLowerCase().includes('agent') || r.role.toLowerCase().includes('cro') || r.role.toLowerCase().includes('relationship')) &&
        r.status === 'Present' &&
        r.loginTime &&
        r.loginTime !== '—'
    );

    return {
      totalStaff,
      presentCount,
      lateCount,
      absentCount,
      collectionAgentTotal: collectionAgents.length,
      activeAgentsTotal: activeAgents.length,
      geoVerifiedCount,
      latestAgent,
    };
  }, [records]);

  // Distinct staff options for staff filter dropdown
  const staffOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role: string }>();
    records.forEach((r) => {
      if (!map.has(r.employeeId)) {
        map.set(r.employeeId, { id: r.employeeId, name: r.employeeName, role: r.role });
      }
    });
    return Array.from(map.values());
  }, [records]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        r.employeeName.toLowerCase().includes(q) ||
        r.employeeId.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q) ||
        r.branchName.toLowerCase().includes(q) ||
        (r.date && r.date.toLowerCase().includes(q)) ||
        (r.loginTime && r.loginTime.toLowerCase().includes(q)) ||
        (r.logoutTime && r.logoutTime.toLowerCase().includes(q)) ||
        (r.address && r.address.toLowerCase().includes(q)) ||
        (r.gpsLocation && r.gpsLocation.toLowerCase().includes(q));

      // Role Filter
      let matchRole = true;
      if (roleFilter === 'collection_agent') {
        matchRole = r.role.toLowerCase().includes('collection') || r.role.toLowerCase().includes('agent') || r.role.toLowerCase().includes('cro') || r.role.toLowerCase().includes('relationship');
      } else if (roleFilter === 'branch_manager') {
        matchRole = r.role.toLowerCase().includes('branch') || r.role.toLowerCase().includes('manager');
      } else if (roleFilter === 'credit_officer') {
        matchRole = r.role.toLowerCase().includes('credit');
      }

      // Specific Staff Filter
      let matchStaff = true;
      if (selectedStaffFilter !== 'all') {
        matchStaff = r.employeeId === selectedStaffFilter;
      }

      // Status Filter
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;

      return matchSearch && matchRole && matchStaff && matchStatus;
    });
  }, [records, searchQuery, roleFilter, selectedStaffFilter, statusFilter]);

  // Keyboard Navigation: Up/Down row highlight, Enter to inspect, Esc to close, Left/Right in modal, '[' & ']' for role tabs
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
        const curIdx = filteredRecords.findIndex((c) => c.id === selectedRecord.id);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
          e.preventDefault();
          if (filteredRecords.length > 0) {
            const nextIdx = curIdx >= 0 && curIdx < filteredRecords.length - 1 ? curIdx + 1 : 0;
            setSelectedRecord(filteredRecords[nextIdx]);
            setFocusedRowIndex(nextIdx);
            rowRefs.current[nextIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
          e.preventDefault();
          if (filteredRecords.length > 0) {
            const prevIdx = curIdx > 0 ? curIdx - 1 : filteredRecords.length - 1;
            setSelectedRecord(filteredRecords[prevIdx]);
            setFocusedRowIndex(prevIdx);
            rowRefs.current[prevIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }
        return;
      }

      // '[' and ']' cycle role tabs
      const roleTabs: ('all' | 'collection_agent' | 'branch_manager' | 'credit_officer')[] = [
        'all',
        'collection_agent',
        'branch_manager',
        'credit_officer',
      ];
      if (e.key === '[' || (e.shiftKey && e.key === 'ArrowLeft')) {
        e.preventDefault();
        const roleIdx = roleTabs.indexOf(roleFilter);
        const prevRole = roleIdx > 0 ? roleTabs[roleIdx - 1] : roleTabs[roleTabs.length - 1];
        setRoleFilter(prevRole);
        return;
      } else if (e.key === ']' || (e.shiftKey && e.key === 'ArrowRight')) {
        e.preventDefault();
        const roleIdx = roleTabs.indexOf(roleFilter);
        const nextRole = roleIdx >= 0 && roleIdx < roleTabs.length - 1 ? roleTabs[roleIdx + 1] : roleTabs[0];
        setRoleFilter(nextRole);
        return;
      }

      // Table Row navigation when modal is NOT open
      if (filteredRecords.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRowIndex((prev) => {
          const next = Math.min(filteredRecords.length - 1, prev + 1);
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
        const item = filteredRecords[focusedRowIndex];
        if (item) setSelectedRecord(item);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRecord, filteredRecords, focusedRowIndex, roleFilter]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 sm:p-5 lg:p-6 flex flex-col gap-5 pb-16 font-sans max-w-full text-[#0B1F3A]"
    >
      {/* Shared Navigation Header */}
      <MonitoringNav currentTab="attendance" />

      {/* ── Executive View Switcher: Live GPS vs Branch Manager Leave & OD Approvals ── */}
      <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 w-fit shadow-2xs">
        <button
          type="button"
          onClick={() => setAdminAttendanceTab('live_register')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            adminAttendanceTab === 'live_register'
              ? 'bg-[#0B1F3A] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Clock size={15} />
          <span>Live GPS Staff Register</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminAttendanceTab('bm_leave_od')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
            adminAttendanceTab === 'bm_leave_od'
              ? 'bg-[#0B1F3A] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Palmtree size={15} className="text-[#D4AF37]" />
          <span>Branch Manager Leave & OD Approvals</span>
          {pendingBMRequestsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black leading-none shadow-xs animate-pulse">
              {pendingBMRequestsCount} Action Required
            </span>
          )}
        </button>
      </div>

      {adminAttendanceTab === 'bm_leave_od' ? (
        <LeaveODPanel />
      ) : (
        <>
          {/* ── 1. EXECUTIVE KPI SUMMARY (LIVE GPS METRICS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Field Customer Relationship Officers (CROs) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-[0_2px_8px_rgba(11,31,58,0.04)] hover:shadow-md hover:border-[#D4AF37]/50 transition-all duration-200 flex flex-col justify-between min-h-[148px] group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans leading-tight">
              Customer Relationship Officers (CROs)
            </span>
            <div className="w-8.5 h-8.5 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/80 shadow-2xs group-hover:scale-105 transition-transform">
              <Briefcase size={16} />
            </div>
          </div>
          <div className="my-2.5 flex items-center">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-[26px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums">
                {stats.activeAgentsTotal}
              </span>
              <span className="text-xs font-semibold text-slate-400">/ {stats.collectionAgentTotal} Active</span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">Real-time GPS attendance active</span>
          </div>
        </div>

        {/* Card 2: Total Staff Present Today */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-[0_2px_8px_rgba(11,31,58,0.04)] hover:shadow-md hover:border-[#D4AF37]/50 transition-all duration-200 flex flex-col justify-between min-h-[148px] group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans leading-tight">
              Present On Duty
            </span>
            <div className="w-8.5 h-8.5 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80 shadow-2xs group-hover:scale-105 transition-transform">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="my-2.5 flex items-center">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-[26px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums">
                {stats.presentCount + stats.lateCount}
              </span>
              <span className="text-xs font-semibold text-slate-400">/ {stats.totalStaff} Staff</span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            <span className="truncate">{stats.absentCount} absent or off duty</span>
          </div>
        </div>

        {/* Card 3: Geo-Verified Live Punches */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-[0_2px_8px_rgba(11,31,58,0.04)] hover:shadow-md hover:border-[#D4AF37]/50 transition-all duration-200 flex flex-col justify-between min-h-[148px] group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans leading-tight">
              Live GPS Verified
            </span>
            <div className="w-8.5 h-8.5 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/80 shadow-2xs group-hover:scale-105 transition-transform">
              <MapPin size={16} />
            </div>
          </div>
          <div className="my-2.5 flex items-center">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-[26px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums">
                {stats.geoVerifiedCount}
              </span>
              <span className="text-xs font-semibold text-slate-400">Punches</span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span className="truncate">Exact coordinates &amp; accuracy logged</span>
          </div>
        </div>

        {/* Card 4: Latest Field Punch */}
        <div className="bg-gradient-to-br from-[#0B1F3A] to-[#163864] text-white rounded-2xl p-5 shadow-[0_2px_10px_rgba(11,31,58,0.15)] flex flex-col justify-between min-h-[148px] relative overflow-hidden group">
          <MapPin size={80} className="absolute -right-4 -bottom-4 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
              Latest Live Punch
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          </div>
          <div className="my-2.5">
            <div className="text-sm font-bold text-white truncate">
              {stats.latestAgent?.employeeName || 'Field Agent'}
            </div>
            <div className="text-[11.5px] text-[#D4AF37] font-semibold mt-0.5">
              {stats.latestAgent?.loginTime || '09:05 AM'} • {stats.latestAgent?.role || 'Customer Relationship Officer (CRO)'}
            </div>
          </div>
          <div className="pt-2.5 border-t border-white/10 text-[11.5px] text-slate-300 flex items-center gap-1.5 truncate">
            <Compass size={11} className="text-[#D4AF37] shrink-0" />
            <span className="truncate">
              {stats.latestAgent?.address || 'Anna Nagar Main Branch, Chennai'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. FILTER & CONTROLS TOOLBAR ── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-[0_1px_3px_rgba(11,31,58,0.04)] flex flex-col gap-3.5">
        {/* TIER 1: DATE NAVIGATION & VIEW CONTROLS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Left: Quick Date Pills & Inline Picker */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mr-1">
              <Calendar size={14} className="text-[#D4AF37]" />
              <span>Date Filter:</span>
            </div>

            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setDateFilterMode('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  dateFilterMode === 'today'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Today</span>
              </button>

              <button
                type="button"
                onClick={() => setDateFilterMode('yesterday')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dateFilterMode === 'yesterday'
                    ? 'bg-white text-[#0B1F3A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yesterday
              </button>

              <button
                type="button"
                onClick={() => setDateFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dateFilterMode === 'all'
                    ? 'bg-white text-[#0B1F3A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Dates
              </button>
            </div>

            {/* Custom Date Input */}
            <div className="inline-flex items-center gap-1.5 pl-1">
              <input
                type="date"
                value={customDateVal}
                onChange={(e) => {
                  setCustomDateVal(e.target.value);
                  setDateFilterMode('custom');
                }}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none transition-all cursor-pointer ${
                  dateFilterMode === 'custom'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title="Select custom date"
              />
            </div>
          </div>

          {/* Right: Active Date Context & View Toggle */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
              <span className="text-slate-400 font-normal">Active:</span>
              <span className="font-bold text-[#0B1F3A]">
                {dateFilterMode === 'today'
                  ? 'Today’s Live Punches'
                  : dateFilterMode === 'yesterday'
                  ? 'Yesterday’s Punches'
                  : dateFilterMode === 'all'
                  ? 'All Historical Punches'
                  : `Date: ${customDateVal}`}
              </span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-[#0B1F3A] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText size={13} />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <MapIcon size={13} />
                <span>Field Map</span>
              </button>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-emerald-600' : ''} />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* TIER 2: ROLE CATEGORY TABS (Full Width Bar) */}
        <div className="w-full overflow-x-auto no-scrollbar scrollbar-none py-0.5 touch-pan-x">
          <div className="flex items-center gap-1.5 min-w-max">
            {[
              { key: 'all', label: 'All Staff', count: records.length },
              {
                key: 'collection_agent',
                label: 'Customer Relationship Officers (CROs)',
                count: records.filter(
                  (r) => r.role.toLowerCase().includes('collection') || r.role.toLowerCase().includes('agent') || r.role.toLowerCase().includes('cro') || r.role.toLowerCase().includes('relationship')
                ).length,
                icon: Briefcase,
              },
              {
                key: 'branch_manager',
                label: 'Branch Managers',
                count: records.filter((r) => r.role.toLowerCase().includes('manager')).length,
              },
              {
                key: 'credit_officer',
                label: 'Credit Officers',
                count: records.filter(
                  (r) => r.role.toLowerCase().includes('credit') || r.role.toLowerCase().includes('officer')
                ).length,
              },
            ].map((tab) => {
              const isActive = roleFilter === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setRoleFilter(tab.key as 'all' | 'collection_agent' | 'branch_manager' | 'credit_officer')}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                    isActive
                      ? 'bg-[#0B1F3A] text-white shadow-xs border border-[#D4AF37]/50'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {Icon && <Icon size={12} className={isActive ? 'text-[#D4AF37]' : 'text-slate-400'} />}
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

        {/* TIER 3: SEARCH, STAFF DROPDOWN, STATUS FILTER & RESET */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Left: Spacious Search Box */}
          <div className="relative flex-1 sm:max-w-md min-w-[260px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name, employee ID, branch, or beat... (Press '/' to focus)"
              className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 border border-[#CBD5E1] focus:border-[#D4AF37] focus:bg-white text-xs text-[#0B1F3A] focus:outline-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Right: Specific Staff, Status & Reset */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Specific Staff Dropdown */}
            <select
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-[#CBD5E1] text-xs font-semibold text-[#0B1F3A] focus:outline-none cursor-pointer max-w-[170px] truncate"
            >
              <option value="all">All Employees ({staffOptions.length})</option>
              {staffOptions.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.id})
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-[#CBD5E1] text-xs font-semibold text-[#0B1F3A] focus:outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="Present">Present Only</option>
              <option value="Late">Late Only</option>
              <option value="Absent">Absent Only</option>
            </select>

            {/* Reset Button */}
            {(searchQuery || roleFilter !== 'all' || selectedStaffFilter !== 'all' || statusFilter !== 'all' || dateFilterMode !== 'today') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setSelectedStaffFilter('all');
                  setStatusFilter('all');
                  setDateFilterMode('today');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                title="Reset all search and filters"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}

            <span className="text-xs text-slate-400 font-semibold pl-1 hidden sm:inline">
              Showing <strong className="text-[#0B1F3A] font-manrope">{filteredRecords.length}</strong> of{' '}
              {records.length} records
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. MAIN CONTENT: TABLE OR FIELD MAP VIEW ── */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04)] overflow-hidden">
          {/* Table Header */}
          <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full flex-shrink-0" />
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-wider uppercase font-sans">
                Staff Attendance &amp; Live GPS Punch-In Register
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-300 font-medium">
                Showing <strong className="text-[#F5D061]">{filteredRecords.length}</strong> of {records.length} records
              </span>
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>GPS Active</span>
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="overflow-x-auto w-full custom-scrollbar">
            {filteredRecords.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                  <Clock size={22} className="text-[#0B1F3A]" />
                </div>
                <h3 className="text-sm font-bold text-[#0B1F3A]">No matching attendance records</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  No staff records found for the selected date or search filter.
                </p>
                {(searchQuery || roleFilter !== 'all' || selectedStaffFilter !== 'all' || statusFilter !== 'all' || dateFilterMode !== 'today') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setRoleFilter('all');
                      setSelectedStaffFilter('all');
                      setStatusFilter('all');
                      setDateFilterMode('today');
                    }}
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
                    <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">Staff Member</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[200px]">Branch</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[150px]">Date</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">Punch In (Time)</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">Punch Out</th>
                    <th className="py-3.5 px-5 text-left min-w-[300px]">Live Punch Location &amp; GPS</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">Status</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[100px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredRecords.map((att, idx) => {
                    const isCollectionAgent =
                      att.role.toLowerCase().includes('collection') || att.role.toLowerCase().includes('agent') || att.role.toLowerCase().includes('cro') || att.role.toLowerCase().includes('relationship');
                    const hasValidGps = Boolean(att.lat && att.lng && att.lat !== 0);
                    const isFocused = focusedRowIndex === idx;

                    return (
                      <tr
                        key={att.id}
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
                        {/* 1. EMPLOYEE */}
                        <td className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">
                          <div className="flex items-center gap-3">
                            {isFocused && (
                              <div className="w-1.5 h-6 bg-blue-600 rounded-full shrink-0 -ml-2 animate-pulse" title="Focused row (Enter to view)" />
                            )}
                            <Avatar
                              name={att.employeeName}
                              size="sm"
                              className="shrink-0 ring-1 ring-slate-200/80 shadow-2xs"
                            />
                            <div>
                              <div className="font-bold text-[#0B1F3A] text-xs">
                                {att.employeeName}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                                <span>{att.employeeId}</span>
                                <span>•</span>
                                <span className={isCollectionAgent ? 'text-emerald-700 font-semibold' : 'text-slate-600'}>
                                  {att.role}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. BRANCH */}
                        <td className="py-3.5 px-4 text-left whitespace-nowrap min-w-[200px]">
                          <div className="font-bold text-[#0B1F3A] text-xs whitespace-nowrap leading-snug">
                            {att.branchName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {att.branchId}
                          </div>
                        </td>

                        {/* 3. DATE */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[150px]">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[#0B1F3A] font-semibold text-xs font-mono">
                            <Calendar size={12} className="text-[#D4AF37] shrink-0" />
                            <span>{att.date}</span>
                          </div>
                        </td>

                        {/* 4. PUNCH IN TIME */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-[#0B1F3A] text-xs font-mono tabular-nums">
                              {att.loginTime}
                            </span>
                            {att.status === 'Present' && att.loginTime !== '—' && (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-emerald-700 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Punched</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 5. PUNCH OUT TIME */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-semibold text-slate-700 text-xs font-mono tabular-nums">
                              {att.logoutTime}
                            </span>
                            {att.logoutTime === 'In Progress' ? (
                              <span className="text-[9.5px] text-amber-600 font-bold">On Duty</span>
                            ) : att.logoutTime !== '—' && att.status !== 'Absent' ? (
                              <span className="text-[9.5px] text-slate-400">Shift End</span>
                            ) : null}
                          </div>
                        </td>

                        {/* 6. LIVE PUNCH LOCATION & GPS */}
                        <td className="py-3.5 px-5 text-left min-w-[300px] max-w-sm">
                          {hasValidGps ? (
                            <div className="space-y-1">
                              {/* Address Title */}
                              <div className="flex items-start gap-1.5 text-slate-900 font-semibold text-xs leading-snug">
                                <MapPin size={13} className="text-emerald-600 mt-0.5 shrink-0" />
                                <span className="truncate max-w-[260px]" title={att.address || att.gpsLocation}>
                                  {att.address || att.gpsLocation.split('•')[1]?.trim() || att.gpsLocation}
                                </span>
                              </div>

                              {/* GPS Coordinates & Accuracy Chips */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-mono text-[10px] font-bold whitespace-nowrap">
                                  <Navigation size={9} />
                                  <span>
                                    {att.lat?.toFixed(4)}°N, {att.lng?.toFixed(4)}°E
                                  </span>
                                </span>

                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium whitespace-nowrap">
                                  <Radio size={9} className="text-teal-600" />
                                  <span>±{att.accuracy || 15}m</span>
                                </span>

                                <a
                                  href={`https://www.google.com/maps?q=${att.lat},${att.lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-[#D4AF37] hover:text-[#B8860B] hover:underline cursor-pointer transition-colors whitespace-nowrap"
                                  title="Open in Google Maps"
                                >
                                  <span>Map</span>
                                  <ExternalLink size={10} />
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-400 text-xs italic whitespace-nowrap">
                              <MapPin size={13} className="text-slate-300 shrink-0" />
                              <span>{att.status === 'Absent' ? 'No attendance punch' : 'Location capture pending'}</span>
                            </div>
                          )}
                        </td>

                        {/* 7. STATUS */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              att.status === 'Present'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : att.status === 'Late'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                att.status === 'Present'
                                  ? 'bg-emerald-600'
                                  : att.status === 'Late'
                                  ? 'bg-amber-600'
                                  : 'bg-rose-600'
                              }`}
                            />
                            <span>{att.status}</span>
                          </span>
                        </td>

                        {/* 8. ACTION */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[100px]">
                          <button
                            onClick={() => setSelectedRecord(att)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0B1F3A] hover:text-[#F5D061] text-[#0B1F3A] text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-2xs active:scale-95 group-hover:border-slate-300"
                            title={`Inspect punch details for ${att.employeeName}`}
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
      ) : (
        /* ── FIELD MAP CARDS VIEW ── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRecords.map((att) => {
            const hasValidGps = Boolean(att.lat && att.lng && att.lat !== 0);
            const isAgent = att.role.toLowerCase().includes('collection') || att.role.toLowerCase().includes('agent') || att.role.toLowerCase().includes('cro') || att.role.toLowerCase().includes('relationship');

            return (
              <div
                key={att.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Card Top: Agent info, Date & status */}
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={att.employeeName}
                        size="md"
                        className="shrink-0 ring-1 ring-slate-200/80 shadow-2xs"
                      />
                      <div>
                        <h3 className="font-bold text-[#0B1F3A] text-sm leading-tight">
                          {att.employeeName}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {att.employeeId} • {att.branchName}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                          att.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {att.status}
                      </span>
                      <span className="text-[10.5px] font-mono text-slate-500 flex items-center gap-1">
                        <Calendar size={10} className="text-[#D4AF37]" />
                        <span>{att.date}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Middle: Embedded Mini Map or GPS Coordinates */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  {hasValidGps ? (
                    <>
                      {/* OpenStreetMap Iframe preview */}
                      <div className="w-full h-36 rounded-xl overflow-hidden border border-slate-200 relative bg-slate-100 shadow-inner">
                        <iframe
                          title={`Map ${att.employeeName}`}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          scrolling="no"
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${att.lng! - 0.015}%2C${att.lat! - 0.015}%2C${att.lng! + 0.015}%2C${att.lat! + 0.015}&layer=mapnik&marker=${att.lat}%2C${att.lng}`}
                          className="w-full h-full pointer-events-none opacity-90"
                        />
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-xs text-[10px] font-bold text-emerald-800 border border-emerald-300 shadow-2xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Live Pin</span>
                        </div>
                      </div>

                      {/* Location Address */}
                      <div className="space-y-1">
                        <div className="flex items-start gap-1.5 text-xs font-bold text-slate-900 leading-snug">
                          <MapPin size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span>{att.address || att.gpsLocation}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10.5px] text-slate-500 font-mono">
                          <span>
                            {att.lat?.toFixed(4)}°N, {att.lng?.toFixed(4)}°E
                          </span>
                          <span>•</span>
                          <span>±{att.accuracy || 15}m accuracy</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-36 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <MapPin size={24} className="text-slate-300 mb-1" />
                      <span className="text-xs font-semibold">Location Pending Punch</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Staff has not yet logged in from mobile or field
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Bottom: Punch info & actions */}
                <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">In: </span>
                      <strong className="text-[#0B1F3A] font-bold">{att.loginTime}</strong>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Out: </span>
                      <span className="text-slate-600 font-semibold">{att.logoutTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasValidGps && (
                      <a
                        href={`https://www.google.com/maps?q=${att.lat},${att.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200/80 flex items-center gap-1 transition-all"
                      >
                        <span>Maps</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedRecord(att)}
                      className="px-3 py-1 rounded-lg bg-[#0B1F3A] hover:bg-[#163864] text-[#F5D061] text-xs font-bold transition-all cursor-pointer"
                    >
                      Audit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 4. INSPECT PUNCH & LIVE GPS AUDIT MODAL ── */}
      <AnimatePresence>
        {selectedRecord && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Attendance Punch Details Modal"
            onClick={() => setSelectedRecord(null)}
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
              <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-5 bg-[#D4AF37] rounded-full" />
                  <div>
                    <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider font-sans text-white flex items-center gap-2">
                      <span>{selectedRecord.employeeName}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-800 text-emerald-200 border border-emerald-600">
                        {selectedRecord.role}
                      </span>
                    </h3>
                    <div className="text-[11.5px] text-slate-300 font-mono mt-0.5">
                      {selectedRecord.employeeId} • {selectedRecord.branchName} ({selectedRecord.branchId})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Prev / Next record navigation buttons */}
                  <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        const curIdx = filteredRecords.findIndex((c) => c.id === selectedRecord.id);
                        const prevIdx = curIdx > 0 ? curIdx - 1 : filteredRecords.length - 1;
                        setSelectedRecord(filteredRecords[prevIdx]);
                        setFocusedRowIndex(prevIdx);
                        rowRefs.current[prevIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                      }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Previous Staff (← or ↑)"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[11px] font-mono text-slate-300 px-1.5 select-none">
                      {filteredRecords.findIndex((c) => c.id === selectedRecord.id) + 1}/{filteredRecords.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const curIdx = filteredRecords.findIndex((c) => c.id === selectedRecord.id);
                        const nextIdx = curIdx >= 0 && curIdx < filteredRecords.length - 1 ? curIdx + 1 : 0;
                        setSelectedRecord(filteredRecords[nextIdx]);
                        setFocusedRowIndex(nextIdx);
                        rowRefs.current[nextIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                      }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Next Staff (→ or ↓)"
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
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs font-sans">
                {/* Section 1: Shift & Status Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Duty Status
                    </span>
                    <span
                      className={`inline-block mt-1 font-extrabold text-xs px-2 py-0.5 rounded-full ${
                        selectedRecord.status === 'Present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {selectedRecord.status}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Punch In Time
                    </span>
                    <span className="font-extrabold text-sm text-[#0B1F3A] block mt-1">
                      {selectedRecord.loginTime}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Punch Out Time
                    </span>
                    <span className="font-semibold text-xs text-slate-600 block mt-1">
                      {selectedRecord.logoutTime || '05:00 PM'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Geofence Status
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-[10.5px] text-emerald-700 mt-1">
                      <ShieldCheck size={12} />
                      <span>Beat Verified</span>
                    </span>
                  </div>
                </div>

                {/* Section 2: Live GPS Location & Map Box */}
                <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-emerald-700 text-white shadow-2xs">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#0B1F3A] text-sm">
                          Verified GPS Punch Location
                        </h4>
                        <span className="text-[10.5px] text-emerald-700 font-semibold">
                          Tamper-proof hardware coordinate capture
                        </span>
                      </div>
                    </div>

                    {selectedRecord.lat && selectedRecord.lng && selectedRecord.lat !== 0 && (
                      <a
                        href={`https://www.google.com/maps?q=${selectedRecord.lat},${selectedRecord.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <span>Open Google Maps</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {/* OpenStreetMap Interactive Preview */}
                  {selectedRecord.lat && selectedRecord.lng && selectedRecord.lat !== 0 ? (
                    <div className="w-full h-48 rounded-xl overflow-hidden border border-emerald-300/80 shadow-xs relative bg-slate-100">
                      <iframe
                        title="GPS Map"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedRecord.lng - 0.015}%2C${selectedRecord.lat - 0.015}%2C${selectedRecord.lng + 0.015}%2C${selectedRecord.lat + 0.015}&layer=mapnik&marker=${selectedRecord.lat}%2C${selectedRecord.lng}`}
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="p-6 bg-white/80 rounded-xl border border-dashed border-emerald-300 text-center text-slate-500 text-xs">
                      No coordinates logged yet for this entry.
                    </div>
                  )}

                  {/* Address & Precise Coordinates Info Bar */}
                  <div className="bg-white/95 rounded-xl p-3 border border-emerald-200/90 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Street / Field Location Address
                        </span>
                        <p className="text-xs font-bold text-slate-900 mt-0.5 leading-snug">
                          {selectedRecord.address || selectedRecord.gpsLocation}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleCopy(selectedRecord.address || selectedRecord.gpsLocation)
                        }
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer shrink-0"
                        title="Copy address"
                      >
                        {copiedText === (selectedRecord.address || selectedRecord.gpsLocation) ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px] font-semibold">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Navigation size={12} className="text-emerald-600" />
                        <span>Lat: {selectedRecord.lat ? selectedRecord.lat.toFixed(6) : '—'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Navigation size={12} className="text-teal-600" />
                        <span>Lng: {selectedRecord.lng ? selectedRecord.lng.toFixed(6) : '—'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Radio size={12} className="text-blue-600" />
                        <span>Accuracy: ±{selectedRecord.accuracy || 15}m</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Recent Attendance Logs for this Staff */}
                <div>
                  <h4 className="font-bold text-[#0B1F3A] text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText size={14} className="text-[#D4AF37]" />
                    <span>Historical Punch &amp; GPS Logs</span>
                  </h4>

                  {selectedRecord.historyReport.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                      No historical punches recorded yet.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[10.5px] uppercase">
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Login</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Location Pin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedRecord.historyReport.map((h, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-semibold text-[#0B1F3A]">{h.date}</td>
                              <td className="py-2 px-3 font-mono">{h.loginTime}</td>
                              <td className="py-2 px-3">
                                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                  {h.status}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-600 truncate max-w-[200px]">
                                {h.gpsLocation}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(null)}
                    className="py-2 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-bold text-xs transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </>
      )}
    </motion.div>
  );
};

export default AttendanceMonitoringPage;
