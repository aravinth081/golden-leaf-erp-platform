// ──────────────────────────────────────────────────
// Golden Leaf Finance — Branch Manager Daily Closing
// PDF-Strict • Production-Ready • Data-Driven • SaaS-Level
// Source of Truth: Finance Collection & Loan Management System PDF
// Responsibilities: Daily Closing, Branch-Aware, Real Collections Data
// ──────────────────────────────────────────────────

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building, ChevronDown, Calendar, Wallet, AlertTriangle,
  CheckCircle2, Clock, ShieldCheck, FileText, X,
  Check, Layers, Info, RotateCcw
} from 'lucide-react';
import { useUIStore, useAuthStore } from '../../store';
import { getStoredBranches, type DetailedBranch } from '../../services/branchService';
import { normalizeBranchId } from '../../services/creditManagerService';
import {
  getMonitoredCollections,
  type MonitoredCollection,
} from '../../services/monitoringDataService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

// ─── Local Storage Keys ───
const DAILY_CLOSING_STORAGE_KEY = 'glf_daily_closings';
const AUDIT_STORAGE_KEY = 'glf_bm_approval_audit_log';

// ─── Types ───
export interface DailyClosingRecord {
  closingId: string;
  branchId: string;
  branchName: string;
  closingDate: string; // YYYY-MM-DD
  status: 'OPEN FOR CLOSING' | 'CONFIRMED';
  totalCollections: number;
  totalPending: number;
  totalDisbursements: number | null; // null indicates N/A (no disbursement data source)
  collectionCount: number;
  pendingCount: number;
  confirmedBy: {
    userId: string;
    userName: string;
    role: string;
  };
  confirmedAt: string;
}

interface BMAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: 'DAILY_CLOSING_CONFIRMED' | 'approve' | 'reject';
  entity: string;
  entityId: string;
  details: string;
  branch: string;
  changes: { field: string; oldVal: string; newVal: string }[];
}

// ─── Helper Functions ───
let isDailyClosingCloudSynced = false;

function getStoredDailyClosings(): DailyClosingRecord[] {
  if (!isDailyClosingCloudSynced && isSupabaseConfigured() && supabase) {
    isDailyClosingCloudSynced = true;
    void (async () => {
      try {
        const { data: rows, error } = await supabase!
          .from('documents')
          .select('data')
          .eq('collection', 'daily_closings')
          .eq('is_deleted', false);
        if (!error && Array.isArray(rows) && rows.length > 0) {
          const cloudRecords = rows.map((r: any) => r.data).filter(Boolean);
          try {
            localStorage.setItem(DAILY_CLOSING_STORAGE_KEY, JSON.stringify(cloudRecords));
          } catch {}
          window.dispatchEvent(new CustomEvent('glf-daily-closing-synced'));
        }
      } catch (e) {
        console.warn('[Supabase] Daily closing cloud fetch warning:', e);
      }
    })();
  }

  try {
    const raw = localStorage.getItem(DAILY_CLOSING_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load daily closings:', e);
  }
  return [];
}

function saveDailyClosingRecord(record: DailyClosingRecord): void {
  try {
    const existing = getStoredDailyClosings();
    const filtered = existing.filter(
      (r) => !(r.branchId === record.branchId && r.closingDate === record.closingDate)
    );
    filtered.unshift(record);
    localStorage.setItem(DAILY_CLOSING_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('glf-daily-closing-updated', { detail: record }));
  } catch (e) {
    console.error('Failed to save daily closing record:', e);
  }

  if (isSupabaseConfigured() && supabase) {
    void supabase
      .from('documents')
      .upsert({
        collection: 'daily_closings',
        id: `dc_${record.branchId}_${record.closingDate}`,
        data: record,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
  }
}

function addDailyClosingAuditLog(entry: {
  branchId: string;
  branchName: string;
  closingDate: string;
  actor: string;
  userId: string;
  role: string;
  totalCollections: number;
  totalPending: number;
}): void {
  try {
    const existing: BMAuditEntry[] = JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY) || '[]');
    const newEntry: BMAuditEntry = {
      id: `BM-DC-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      }),
      actor: entry.actor,
      role: entry.role,
      action: 'DAILY_CLOSING_CONFIRMED',
      entity: 'DAILY_CLOSING',
      entityId: `${entry.branchId}-${entry.closingDate}`,
      branch: `${entry.branchName} (${entry.branchId})`,
      details: `Daily closing confirmed for ${entry.branchName} (${entry.branchId}) for ${entry.closingDate}. Total Collections: ₹${entry.totalCollections.toLocaleString('en-IN')}, Pending Collection: ₹${entry.totalPending.toLocaleString('en-IN')}.`,
      changes: [
        { field: 'status', oldVal: 'OPEN FOR CLOSING', newVal: 'CONFIRMED' },
        { field: 'confirmedBy', oldVal: 'None', newVal: `${entry.actor} (${entry.userId})` },
      ],
    };
    existing.unshift(newEntry);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(existing.slice(0, 200)));
  } catch (e) {
    console.warn('Failed to write daily closing audit entry:', e);
  }
}

export const DailyClosingPage: React.FC = () => {
  const { addToast, selectedBranchId, setSelectedBranchId } = useUIStore();
  const currentUser = useAuthStore((s) => s.user);
  const userBranchClaim = currentUser?.customClaims?.branchId;
  const userRole = (currentUser?.customClaims?.role || 'branch_manager').toLowerCase();

  // Load all system branches
  const branches = useMemo(() => getStoredBranches(), []);

  // Determine active branch selection (defaults to selectedBranchId or user branch or BR-01)
  const [activeBranchId, setActiveBranchId] = useState<string>(() => {
    if (selectedBranchId) return selectedBranchId;
    if (userBranchClaim) return normalizeBranchId(userBranchClaim);
    return 'BR-01';
  });

  // Keep in sync if global selectedBranchId changes
  useEffect(() => {
    if (selectedBranchId && selectedBranchId !== activeBranchId) {
      setActiveBranchId(selectedBranchId);
    }
  }, [selectedBranchId]);

  // Find active branch details
  const activeBranch = useMemo(() => {
    return (
      branches.find((b) => b.id === activeBranchId) ||
      branches[0] || {
        id: activeBranchId,
        name: 'Main Branch - Anna Nagar',
        code: 'BR-01',
        city: 'Chennai',
      }
    );
  }, [branches, activeBranchId]);

  // System Date / Closing Date state (YYYY-MM-DD)
  const todayDateStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [closingDate, setClosingDate] = useState<string>(todayDateStr);

  // Trigger state for real-time reactivity
  const [refreshKey, setRefreshKey] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Branch Switcher dropdown state
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [focusedBranchIndex, setFocusedBranchIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const listboxContainerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Listen for external collection updates
  useEffect(() => {
    const handleUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener('glf-collections-updated', handleUpdate);
    window.addEventListener('glf-daily-closing-updated', handleUpdate);
    return () => {
      window.removeEventListener('glf-collections-updated', handleUpdate);
      window.removeEventListener('glf-daily-closing-updated', handleUpdate);
    };
  }, []);

  // Fetch actual collection records for the active branch
  const branchCollections = useMemo(() => {
    // getMonitoredCollections filters by branchId and category
    return getMonitoredCollections(activeBranch.id, 'all');
  }, [activeBranch.id, refreshKey]);

  // Filter collections for the selected closing date
  const filteredCollections = useMemo(() => {
    return branchCollections.filter((c) => {
      if (closingDate === todayDateStr) {
        return c.date === 'Today' || c.date === todayDateStr;
      }
      return c.date === closingDate;
    });
  }, [branchCollections, closingDate, todayDateStr]);

  // Calculate actual TOTAL COLLECTIONS from valid finalized/recorded collections
  const totalCollections = useMemo(() => {
    return filteredCollections
      .filter((c) => c.status === 'collected' || c.status === 'partial' || c.status === 'advance')
      .reduce((sum, c) => sum + (Number(c.collectedAmount) || 0), 0);
  }, [filteredCollections]);

  // Count of valid collection transactions
  const collectionTransactionsCount = useMemo(() => {
    return filteredCollections.filter(
      (c) => (c.status === 'collected' || c.status === 'partial' || c.status === 'advance') && c.collectedAmount > 0
    ).length;
  }, [filteredCollections]);

  // Calculate actual PENDING COLLECTION from actual pending/NC records
  const totalPending = useMemo(() => {
    return filteredCollections
      .filter((c) => c.status === 'nc' || c.status === 'pending' || c.status === 'delayed' || (c.pendingAmount && c.pendingAmount > 0))
      .reduce((sum, c) => sum + (Number(c.pendingAmount) || 0), 0);
  }, [filteredCollections]);

  // Count of pending/delayed/NC items
  const pendingCount = useMemo(() => {
    return filteredCollections.filter(
      (c) => c.status === 'nc' || c.status === 'pending' || c.status === 'delayed' || (c.pendingAmount && c.pendingAmount > 0)
    ).length;
  }, [filteredCollections]);

  // Check stored Daily Closing status for active branch & closing date
  const existingClosingRecord = useMemo(() => {
    const all = getStoredDailyClosings();
    return all.find((r) => r.branchId === activeBranch.id && r.closingDate === closingDate) || null;
  }, [activeBranch.id, closingDate, refreshKey]);

  const isConfirmed = existingClosingRecord?.status === 'CONFIRMED';

  // Handle branch change
  const handleSelectBranch = useCallback((branch: DetailedBranch) => {
    setActiveBranchId(branch.id);
    setSelectedBranchId(branch.id);
    setBranchDropdownOpen(false);
    setFocusedBranchIndex(-1);
    triggerButtonRef.current?.focus();
  }, [setSelectedBranchId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBranchDropdownOpen(false);
        setFocusedBranchIndex(-1);
      }
    };
    if (branchDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [branchDropdownOpen]);

  // Keyboard navigation for branch switcher
  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setBranchDropdownOpen(true);
      setFocusedBranchIndex(0);
      if (listboxContainerRef.current) {
        listboxContainerRef.current.scrollTop = 0;
      }
    } else if (e.key === 'Escape') {
      setBranchDropdownOpen(false);
    }
  };

  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setBranchDropdownOpen(false);
      setFocusedBranchIndex(-1);
      triggerButtonRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedBranchIndex((prev) => (prev < branches.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedBranchIndex((prev) => (prev > 0 ? prev - 1 : branches.length - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusedBranchIndex(0);
      if (listboxContainerRef.current) {
        listboxContainerRef.current.scrollTop = 0;
      }
    } else if (e.key === 'End') {
      e.preventDefault();
      setFocusedBranchIndex(branches.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focusedBranchIndex >= 0 && focusedBranchIndex < branches.length) {
        handleSelectBranch(branches[focusedBranchIndex]);
      }
    }
  };

  // When opening dropdown, always start at the 1st branch (index 0) and scroll to top
  useEffect(() => {
    if (branchDropdownOpen) {
      setFocusedBranchIndex(0);
      if (listboxContainerRef.current) {
        listboxContainerRef.current.scrollTop = 0;
      }
    } else {
      setFocusedBranchIndex(-1);
    }
  }, [branchDropdownOpen]);

  useEffect(() => {
    if (branchDropdownOpen && focusedBranchIndex >= 0 && optionRefs.current[focusedBranchIndex]) {
      optionRefs.current[focusedBranchIndex]?.focus({ preventScroll: true });
    }
  }, [focusedBranchIndex, branchDropdownOpen]);

  // Confirm Daily Closing Handler
  const handleConfirmClosing = useCallback(() => {
    if (isConfirmed) {
      addToast({
        type: 'warning',
        title: 'Already Confirmed',
        message: `This branch has already been confirmed for ${closingDate}. Duplicate closings are prohibited.`,
      });
      setShowConfirmModal(false);
      return;
    }

    const actorName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Branch Manager';
    const actorId = currentUser?.uid || 'BM-AUTH';
    const actorRole = 'Branch Manager';

    const newRecord: DailyClosingRecord = {
      closingId: `DC-${activeBranch.id}-${closingDate}-${Date.now()}`,
      branchId: activeBranch.id,
      branchName: activeBranch.name,
      closingDate,
      status: 'CONFIRMED',
      totalCollections,
      totalPending,
      totalDisbursements: null, // N/A (no disbursement source)
      collectionCount: collectionTransactionsCount,
      pendingCount,
      confirmedBy: {
        userId: actorId,
        userName: actorName,
        role: actorRole,
      },
      confirmedAt: new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
      }),
    };

    // 1. Save closing record
    saveDailyClosingRecord(newRecord);

    // 2. Write audit log entry
    addDailyClosingAuditLog({
      branchId: activeBranch.id,
      branchName: activeBranch.name,
      closingDate,
      actor: actorName,
      userId: actorId,
      role: actorRole,
      totalCollections,
      totalPending,
    });

    // 3. UI feedback
    setRefreshKey((k) => k + 1);
    setShowConfirmModal(false);

    addToast({
      type: 'success',
      title: 'Daily Closing Confirmed',
      message: `Daily closing confirmed successfully for ${activeBranch.name} (${closingDate}). Total Collections: ₹${totalCollections.toLocaleString('en-IN')}`,
    });
  }, [
    isConfirmed, activeBranch, closingDate, totalCollections, totalPending,
    collectionTransactionsCount, pendingCount, currentUser, addToast
  ]);

  // Formatted display date
  const displayFormattedDate = useMemo(() => {
    try {
      const parts = closingDate.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch {
      // fallback
    }
    return closingDate;
  }, [closingDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 font-body pb-20 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6"
    >
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. HEADER: Branch Context, System Date & Closing Control    */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-[0_2px_10px_rgba(11,31,58,0.04)] relative z-30">
        <div className="bg-[#0B1F3A] rounded-2xl px-4 sm:px-6 lg:px-8 py-5 text-white border-b border-[#E5E7EB]/10 relative z-30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Title & PDF Subtitle */}
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-1.5 h-8 bg-[#D4AF37] rounded-full shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase font-body">
                  DAILY CLOSING
                </h1>
                <p className="text-xs text-[#9CA3AF] mt-0.5 font-body">
                  Review and confirm daily branch collection operations
                </p>
              </div>
            </div>

            {/* Branch Context Selector + Date Selector */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Branch Selector */}
              <div className="relative z-40" ref={dropdownRef}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">
                  Active Branch
                </div>
                <button
                  ref={triggerButtonRef}
                  type="button"
                  onClick={() => setBranchDropdownOpen((prev) => !prev)}
                  onKeyDown={handleTriggerKeyDown}
                  aria-haspopup="listbox"
                  aria-expanded={branchDropdownOpen}
                  aria-label={`Select branch. Currently selected: ${activeBranch.name}`}
                  className="inline-flex items-center justify-between gap-2.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/20 hover:border-[#D4AF37]/50 rounded-xl text-xs font-bold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer min-w-[220px]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building size={14} className="text-[#D4AF37] shrink-0" />
                    <span className="truncate">{activeBranch.name}</span>
                    <span className="text-[10px] text-[#D4AF37] font-semibold">({activeBranch.code || activeBranch.id})</span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-white/70 transition-transform duration-200 shrink-0 ${branchDropdownOpen ? 'rotate-180 text-[#D4AF37]' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {branchDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-2 w-[min(92vw,360px)] bg-white rounded-2xl shadow-[0_20px_60px_rgba(11,31,58,0.35)] border border-[#E2E8F0] z-[100] p-2 ring-1 ring-black/5"
                    >
                      {/* Dropdown Header */}
                      <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Building size={14} className="text-[#D4AF37]" />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 font-mono">
                            Select Operating Branch
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#0B1F3A] bg-blue-50 px-2.5 py-0.5 rounded-full font-mono border border-blue-100">
                          {branches.length} Branches
                        </span>
                      </div>

                      {/* Navigation hint */}
                      <div className="px-3.5 py-1 text-[10px] text-gray-400 flex items-center justify-between border-b border-slate-50 mb-1 font-mono">
                        <span>↑ / ↓ Navigate</span>
                        <span>↵ Select</span>
                        <span>Esc Close</span>
                      </div>

                      {/* Branch Options List */}
                      <div
                        ref={listboxContainerRef}
                        role="listbox"
                        tabIndex={-1}
                        aria-label="Operating Branches"
                        onKeyDown={handleDropdownKeyDown}
                        className="max-h-72 overflow-y-auto p-0.5 space-y-1 custom-scrollbar focus:outline-none"
                      >
                        {branches.map((b, idx) => {
                          const isSelected = b.id === activeBranch.id;
                          const isFocused = idx === focusedBranchIndex;
                          return (
                            <button
                              key={b.id}
                              ref={(el) => {
                                optionRefs.current[idx] = el;
                              }}
                              role="option"
                              aria-selected={isSelected}
                              type="button"
                              onClick={() => handleSelectBranch(b)}
                              onMouseEnter={() => setFocusedBranchIndex(idx)}
                              className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs flex items-center justify-between transition-all cursor-pointer outline-none ${
                                isFocused
                                  ? isSelected
                                    ? 'bg-amber-100 text-[#0B1F3A] font-bold border border-amber-300 ring-2 ring-[#D4AF37] shadow-xs'
                                    : 'bg-slate-100 text-[#0B1F3A] ring-2 ring-[#D4AF37]/70 font-semibold'
                                  : isSelected
                                  ? 'bg-amber-50/90 text-[#0B1F3A] font-bold border border-amber-200/80 shadow-xs'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex flex-col truncate pr-2">
                                <span className={`text-xs truncate ${isSelected ? 'font-bold text-[#0B1F3A]' : 'font-semibold text-slate-800'}`}>
                                  {b.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {b.code || b.id} • {b.city || 'Tamil Nadu'}
                                </span>
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-[#D4AF37] flex items-center justify-center text-white shrink-0 shadow-xs">
                                  <Check size={12} strokeWidth={2.5} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Business / Closing Date Selector */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">
                  Closing Date
                </div>
                <div className="relative inline-flex items-center">
                  <input
                    type="date"
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                    aria-label="Select Closing Date"
                    className="px-3 py-2 pl-8 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-[#D4AF37] rounded-xl text-xs font-bold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer"
                  />
                  <Calendar size={13} className="text-[#D4AF37] absolute left-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. TODAY'S CLOSING SUMMARY (Strict PDF Metrics)           */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-[#D4AF37]" />
            <h2 className="text-xs sm:text-sm font-bold text-[#0B1F3A] uppercase tracking-wider font-body">
              TODAY'S CLOSING SUMMARY
            </h2>
          </div>
          <span className="text-[11px] text-[#6B7280] font-medium font-body">
            Branch: <strong className="text-[#0B1F3A]">{activeBranch.name}</strong> • Date: <strong className="text-[#0B1F3A]">{displayFormattedDate}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: TOTAL COLLECTIONS */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-[0_2px_10px_rgba(11,31,58,0.03)] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-body">
                TOTAL COLLECTIONS
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Wallet size={18} />
              </div>
            </div>
            
            {filteredCollections.length === 0 ? (
              <div className="py-2">
                <div className="text-sm font-semibold text-gray-400 font-body">
                  No collection transactions recorded
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  for this branch and date
                </div>
              </div>
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#16A37A] font-body tracking-tight font-mono">
                  ₹{totalCollections.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-gray-500 mt-2 font-body flex items-center justify-between">
                  <span>Actual Recorded Receipts:</span>
                  <strong className="text-[#0B1F3A] font-bold">{collectionTransactionsCount} transactions</strong>
                </div>
              </>
            )}
          </div>

          {/* Card 2: PENDING COLLECTION */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-[0_2px_10px_rgba(11,31,58,0.03)] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-body">
                PENDING COLLECTION
              </span>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle size={18} />
              </div>
            </div>

            {filteredCollections.length === 0 ? (
              <div className="py-2">
                <div className="text-sm font-semibold text-gray-400 font-body">
                  No pending dues
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  for this branch and date
                </div>
              </div>
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#D99A19] font-body tracking-tight font-mono">
                  ₹{totalPending.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-gray-500 mt-2 font-body flex items-center justify-between">
                  <span>Non-Collection (NC) / Delay:</span>
                  <strong className="text-[#0B1F3A] font-bold">{pendingCount} accounts</strong>
                </div>
              </>
            )}
          </div>

          {/* Card 3: TOTAL DISBURSEMENTS (Strictly PDF-Compliant: N/A without fabrication) */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-[0_2px_10px_rgba(11,31,58,0.03)] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-body">
                TOTAL DISBURSEMENTS
              </span>
              <div className="p-2.5 rounded-xl bg-gray-100 text-gray-500">
                <FileText size={18} />
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold text-[#6B7280] font-body tracking-tight">
              N/A
            </div>
            <div className="text-xs text-gray-500 mt-2 font-body flex items-center gap-1.5">
              <Info size={13} className="text-gray-400 shrink-0" />
              <span>No disbursement records for this date</span>
            </div>
          </div>

        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. CLOSING STATUS & AUTHORIZATION                         */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_2px_10px_rgba(11,31,58,0.04)] overflow-hidden">
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#12233F] px-4 sm:px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB]/10">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={18} className="text-[#D4AF37]" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-body text-white">
              CLOSING STATUS & AUTHORIZATION
            </h3>
          </div>
          
          {/* Status Badge */}
          <div>
            {isConfirmed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                <CheckCircle2 size={13} />
                CONFIRMED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 font-mono">
                <Clock size={13} />
                OPEN FOR CLOSING
              </span>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50/80 border border-gray-100 text-xs font-body">
            <div>
              <span className="text-gray-500 block text-[11px] font-semibold uppercase tracking-wider">Branch Scope</span>
              <span className="font-bold text-[#0B1F3A] text-sm mt-0.5 block">{activeBranch.name}</span>
              <span className="text-[11px] text-gray-500 font-mono">{activeBranch.code || activeBranch.id}</span>
            </div>

            <div>
              <span className="text-gray-500 block text-[11px] font-semibold uppercase tracking-wider">Business Date</span>
              <span className="font-bold text-[#0B1F3A] text-sm mt-0.5 block">{displayFormattedDate}</span>
              <span className="text-[11px] text-gray-500 font-mono">{closingDate}</span>
            </div>

            <div>
              <span className="text-gray-500 block text-[11px] font-semibold uppercase tracking-wider">Closing State</span>
              <span className={`font-bold text-sm mt-0.5 block ${isConfirmed ? 'text-[#16A37A]' : 'text-[#D99A19]'}`}>
                {isConfirmed ? 'CONFIRMED' : 'OPEN FOR CLOSING'}
              </span>
              <span className="text-[11px] text-gray-500">
                {isConfirmed ? 'Day operations confirmed & sealed' : 'Day is available for review'}
              </span>
            </div>

            <div>
              <span className="text-gray-500 block text-[11px] font-semibold uppercase tracking-wider">Closing Authority</span>
              {isConfirmed && existingClosingRecord ? (
                <div>
                  <span className="font-bold text-[#0B1F3A] text-xs mt-0.5 block truncate">
                    {existingClosingRecord.confirmedBy.userName}
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    Confirmed: {existingClosingRecord.confirmedAt}
                  </span>
                </div>
              ) : (
                <div>
                  <span className="font-bold text-[#0B1F3A] text-xs mt-0.5 block truncate">
                    {currentUser?.displayName || currentUser?.email || 'Branch Manager'}
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    Role: Branch Manager
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. TODAY'S COLLECTION RECORDS (Clean Transaction Table)    */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_2px_10px_rgba(11,31,58,0.04)] overflow-hidden">
        <div className="bg-[#0B1F3A] px-4 sm:px-6 py-4 text-white flex items-center justify-between border-b border-[#E5E7EB]/10">
          <div className="flex items-center gap-2.5">
            <FileText size={18} className="text-[#D4AF37]" />
            <div>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-body text-white">
                TODAY'S COLLECTION RECORDS
              </h3>
              <p className="text-[11px] text-gray-300 font-normal">
                Actual collection records for {activeBranch.name} ({displayFormattedDate})
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-[#D4AF37] bg-white/10 px-3 py-1 rounded-full border border-white/15">
            {filteredCollections.length} Records
          </span>
        </div>

        <div className="p-4 sm:p-6">
          {filteredCollections.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500 font-body space-y-1.5">
              <div className="p-3 bg-gray-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-gray-400">
                <FileText size={20} />
              </div>
              <div className="font-bold text-gray-700 text-sm">No collection records found</div>
              <div className="text-gray-400">No collection transactions recorded for this branch and date.</div>
            </div>
          ) : (
            <>
              {/* Desktop & Tablet Table */}
              <div className="hidden sm:block overflow-x-auto custom-scrollbar border border-[#E5E7EB] rounded-xl">
                <table className="w-full text-left text-xs font-body min-w-[640px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-[#E5E7EB] text-[#6B7280] font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">Receipt / Record ID</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Loan / Group</th>
                      <th className="py-3.5 px-4 text-right">Collected (₹)</th>
                      <th className="py-3.5 px-4 text-right">Pending (₹)</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCollections.map((col) => {
                      const isAdvance = col.status === 'advance';
                      const isCollected = col.status === 'collected';
                      const isPartial = col.status === 'partial';
                      const isDelayed = col.status === 'delayed';

                      return (
                        <tr key={col.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#0B1F3A]">
                            {col.receiptNumber || col.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#0B1F3A]">{col.customerName}</div>
                            <div className="text-[10px] text-gray-500 font-mono">{col.customerId}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-gray-800">{col.loanId}</div>
                            <div className="text-[10px] text-gray-500">{col.groupName || col.groupId || '—'}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-[#16A37A]">
                            ₹{col.collectedAmount?.toLocaleString('en-IN') || 0}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-[#D99A19]">
                            ₹{col.pendingAmount?.toLocaleString('en-IN') || 0}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                isCollected
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isAdvance
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : isPartial
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : isDelayed
                                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {col.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Responsive Cards (No horizontal scroll) */}
              <div className="sm:hidden space-y-3">
                {filteredCollections.map((col) => {
                  const isAdvance = col.status === 'advance';
                  const isCollected = col.status === 'collected';
                  const isPartial = col.status === 'partial';
                  const isDelayed = col.status === 'delayed';

                  return (
                    <div
                      key={col.id}
                      className="p-4 rounded-xl border border-[#E5E7EB] bg-gray-50/50 space-y-2.5 text-xs font-body"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-[#0B1F3A] text-sm">{col.customerName}</div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            ID: {col.customerId} • {col.loanId}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                            isCollected
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isAdvance
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : isPartial
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : isDelayed
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {col.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-600">
                        Group: <strong>{col.groupName || col.groupId || '—'}</strong>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 font-mono">
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase">Collected</span>
                          <span className="font-bold text-[#16A37A] text-sm">
                            ₹{col.collectedAmount?.toLocaleString('en-IN') || 0}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 block uppercase">Pending</span>
                          <span className="font-bold text-[#D99A19] text-sm">
                            ₹{col.pendingAmount?.toLocaleString('en-IN') || 0}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-gray-400 font-mono pt-1">
                        Receipt: {col.receiptNumber || col.id}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. CLOSING CONFIRMATION ACTION                             */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_2px_10px_rgba(11,31,58,0.03)]">
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] flex items-center gap-1.5">
            {isConfirmed ? (
              <>
                <CheckCircle2 size={16} className="text-[#16A37A]" />
                <span className="text-[#16A37A]">Daily Closing Confirmed</span>
              </>
            ) : (
              <>
                <Clock size={16} className="text-[#D99A19]" />
                <span>Pending Daily Closing Confirmation</span>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {isConfirmed
              ? `Confirmed by ${existingClosingRecord?.confirmedBy.userName} on ${existingClosingRecord?.confirmedAt}`
              : `Review collection totals for ${activeBranch.name} and seal the daily register.`}
          </p>
        </div>

        <div>
          {!isConfirmed ? (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] active:bg-[#B38F24] text-[#0B1F3A] font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer font-body min-h-[46px]"
            >
              <ShieldCheck size={16} />
              <span>CONFIRM DAILY CLOSING</span>
            </button>
          ) : (
            <div className="px-6 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider flex items-center gap-2 font-mono">
              <CheckCircle2 size={16} className="text-[#16A37A]" />
              <span>DAILY CLOSING CONFIRMED</span>
            </div>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 6. CONFIRMATION MODAL DIALOG                               */}
      {/* ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-md overflow-hidden font-body"
            >
              {/* Modal Header */}
              <div className="bg-[#0B1F3A] px-6 py-4 text-white flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-5 bg-[#D4AF37] rounded-full" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Confirm Daily Closing
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 text-xs font-body">
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                    <span className="text-gray-500 font-semibold">Branch:</span>
                    <span className="font-bold text-[#0B1F3A] text-right">
                      {activeBranch.name} ({activeBranch.code || activeBranch.id})
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                    <span className="text-gray-500 font-semibold">Closing Date:</span>
                    <span className="font-bold text-[#0B1F3A]">{displayFormattedDate}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                    <span className="text-gray-500 font-semibold">Total Collections:</span>
                    <span className="font-bold text-[#16A37A] font-mono text-sm">
                      ₹{totalCollections.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                    <span className="text-gray-500 font-semibold">Pending Collection:</span>
                    <span className="font-bold text-[#D99A19] font-mono text-sm">
                      ₹{totalPending.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500 font-semibold">Total Disbursements:</span>
                    <span className="font-bold text-gray-500">N/A</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 text-blue-900 flex items-start gap-2">
                  <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">
                    Confirming daily closing will mark this branch/date as closed. This action is auditable and seals the daily register.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClosing}
                  className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] text-[#0B1F3A] font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck size={16} />
                  <span>Confirm Closing</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default DailyClosingPage;
