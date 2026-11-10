// ──────────────────────────────────────────────────
// Golden Leaf Finance — Print Collection Sheets (Branch Manager)
// PDF-Strict • Production-Ready • Data-Driven • SaaS-Level
// Source of Truth: Finance Collection & Loan Management System PDF
// Module 13 — Printing: Collection Sheet
// ──────────────────────────────────────────────────

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer, FileText, Download, Calendar, Users,
  Building, Filter, RotateCcw, CheckCircle2,
  Search, ShieldCheck, Eye, X, ChevronDown, Check,
  AlertTriangle, MapPin, Layers
} from 'lucide-react';
import { useUIStore, useAuthStore } from '../../store';
import { getStoredBranches, type DetailedBranch } from '../../services/branchService';
import { normalizeBranchId } from '../../services/creditManagerService';
import {
  getMonitoredCollections,
  getMonitoredCustomers,
  type MonitoredCollection,
} from '../../services/monitoringDataService';
import {
  generateCollectionSheetPDF,
  generateCollectionSheetPDFBlobUrl,
  type PDFCollectionSheetOptions,
} from '../../utils/pdfGenerator';
import { SanctionLetterPage } from '../loan/SanctionLetterPage';

export interface CollectionSheetRow {
  slNo: number;
  customerId: string;
  customerName: string;
  spouseName: string;
  phone: string;
  loanId: string;
  installmentNo: string;
  demandAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  mode: string;
  status: string;
}

export const PrintingPage: React.FC = () => {
  const { addToast, selectedBranchId, setSelectedBranchId } = useUIStore();
  const currentUser = useAuthStore((s) => s.user);
  const userBranchClaim = currentUser?.customClaims?.branchId;

  // Top Module Tab: Collection Sheet vs Sanction Letter & Terms
  const [activePrintTab, setActivePrintTab] = useState<'sheet' | 'sanction'>('sheet');

  // Load all system branches
  const branches = useMemo(() => getStoredBranches(), []);

  // Determine active branch selection
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

  // System Date / Selected Collection Date (YYYY-MM-DD)
  const todayDateStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);

  // Filter States
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedCenter, setSelectedCenter] = useState<string>('all');

  // Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Branch Switcher dropdown state
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [focusedBranchIndex, setFocusedBranchIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const listboxContainerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Fetch actual collection records for the active branch
  const branchCollections = useMemo(() => {
    return getMonitoredCollections(activeBranch.id, 'all');
  }, [activeBranch.id]);

  // Fetch customers for the active branch to enrich spouse/phone info
  const branchCustomers = useMemo(() => {
    return getMonitoredCustomers(activeBranch.id);
  }, [activeBranch.id]);

  // Customer lookup map
  const customerMap = useMemo(() => {
    const map = new Map<string, { spouseName: string; phone: string }>();
    branchCustomers.forEach((c) => {
      map.set(c.id, {
        spouseName: (c as any).spouseName || (c as any).guardianName || '—',
        phone: c.phone || '—',
      });
    });
    return map;
  }, [branchCustomers]);

  // Dynamically derive unique agents for this branch
  const availableAgents = useMemo(() => {
    const set = new Set<string>();
    branchCollections.forEach((c) => {
      if (c.agentName) set.add(c.agentName);
    });
    return Array.from(set).sort();
  }, [branchCollections]);

  // Dynamically derive unique groups for this branch
  const availableGroups = useMemo(() => {
    const map = new Map<string, string>(); // name -> label
    branchCollections.forEach((c) => {
      if (c.groupName) {
        map.set(c.groupName, c.groupId ? `${c.groupName} (${c.groupId})` : c.groupName);
      }
    });
    return Array.from(map.entries()).map(([name, label]) => ({ name, label }));
  }, [branchCollections]);

  // Dynamically derive unique centers / routes for this branch
  const availableCenters = useMemo(() => {
    const set = new Set<string>();
    branchCollections.forEach((c) => {
      if (c.areaRoute) set.add(c.areaRoute);
      else if (c.area) set.add(c.area);
    });
    return Array.from(set).sort();
  }, [branchCollections]);

  // Filter collections by Date + Agent + Group + Center
  const filteredRows = useMemo<CollectionSheetRow[]>(() => {
    let list = branchCollections;

    // 1. Date Filter
    if (selectedDate === todayDateStr) {
      list = list.filter((c) => c.date === 'Today' || c.date === todayDateStr);
    } else {
      list = list.filter((c) => c.date === selectedDate);
    }

    // 2. Agent Filter
    if (selectedAgent !== 'all') {
      list = list.filter((c) => c.agentName === selectedAgent);
    }

    // 3. Group Filter
    if (selectedGroup !== 'all') {
      list = list.filter((c) => c.groupName === selectedGroup || c.groupId === selectedGroup);
    }

    // 4. Center Filter
    if (selectedCenter !== 'all') {
      list = list.filter((c) => c.areaRoute === selectedCenter || c.area === selectedCenter);
    }

    return list.map((c, idx) => {
      const custInfo = customerMap.get(c.customerId);
      const demand = Number(c.dueAmount || c.expectedAmount || 0);
      const collected = Number(c.collectedAmount || 0);
      const pending = Number(c.pendingAmount !== undefined ? c.pendingAmount : Math.max(0, demand - collected));

      let formattedStatus = 'Pending';
      if (c.status === 'collected') formattedStatus = 'Collected';
      else if (c.status === 'advance') formattedStatus = 'Advance';
      else if (c.status === 'partial') formattedStatus = 'Partial';
      else if (c.status === 'delayed') formattedStatus = 'Delayed';
      else if (c.status === 'nc') formattedStatus = 'Pending (NC)';

      return {
        slNo: idx + 1,
        customerId: c.customerId,
        customerName: c.customerName,
        spouseName: custInfo?.spouseName || '—',
        phone: c.customerPhone || custInfo?.phone || '—',
        loanId: c.loanId,
        installmentNo: c.installment || '01 / 20',
        demandAmount: demand,
        collectedAmount: collected,
        pendingAmount: pending,
        mode: c.paymentMode || 'Cash',
        status: formattedStatus,
      };
    });
  }, [branchCollections, selectedDate, selectedAgent, selectedGroup, selectedCenter, todayDateStr, customerMap]);

  // Totals calculated strictly from filtered records
  const totalDemand = useMemo(() => filteredRows.reduce((sum, r) => sum + r.demandAmount, 0), [filteredRows]);
  const totalCollected = useMemo(() => filteredRows.reduce((sum, r) => sum + r.collectedAmount, 0), [filteredRows]);
  const totalPending = useMemo(() => filteredRows.reduce((sum, r) => sum + r.pendingAmount, 0), [filteredRows]);

  // Reset filters
  const handleResetFilters = () => {
    setSelectedDate(todayDateStr);
    setSelectedAgent('all');
    setSelectedGroup('all');
    setSelectedCenter('all');
  };

  // Branch dropdown handlers
  const handleSelectBranch = useCallback((branch: DetailedBranch) => {
    setActiveBranchId(branch.id);
    setSelectedBranchId(branch.id);
    setBranchDropdownOpen(false);
    setFocusedBranchIndex(-1);
    // Reset filters on branch switch to ensure clean data
    setSelectedAgent('all');
    setSelectedGroup('all');
    setSelectedCenter('all');
    triggerButtonRef.current?.focus();
  }, [setSelectedBranchId]);

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

  // PDF Options Builder
  const getSheetPdfOptions = useCallback((): PDFCollectionSheetOptions => {
    const agentLabel = selectedAgent === 'all' ? 'All Branch CROs' : selectedAgent;
    const groupLabel = selectedGroup === 'all' ? 'All Collection Groups' : selectedGroup;
    const centerLabel = selectedCenter === 'all' ? 'All Centers' : selectedCenter;

    return {
      sheetRef: `GLF-SHT-${selectedDate.replace(/-/g, '')}-01`,
      date: selectedDate,
      agentName: agentLabel,
      groupName: groupLabel,
      centerName: centerLabel,
      branchName: activeBranch.name,
      rows: filteredRows.map((r) => ({
        slNo: r.slNo,
        customerId: r.customerId,
        customerName: r.customerName,
        spouseName: r.spouseName,
        phone: r.phone,
        loanId: r.loanId,
        installmentNo: r.installmentNo,
        demandAmount: r.demandAmount,
        collectedAmount: r.collectedAmount,
        mode: r.mode,
        status: r.status,
      })),
      fileName: `GLF_Collection_Sheet_${selectedDate}_${activeBranch.code || activeBranch.id}.pdf`,
    };
  }, [selectedDate, selectedAgent, selectedGroup, selectedCenter, activeBranch, filteredRows]);

  // Actions
  const handlePrint = () => {
    if (filteredRows.length === 0) return;
    window.print();
  };

  const handlePreviewSheetPDF = async () => {
    if (filteredRows.length === 0) return;
    try {
      setIsGeneratingPDF(true);
      const opts = getSheetPdfOptions();
      const url = await generateCollectionSheetPDFBlobUrl(opts);
      setPreviewBlobUrl(url);
      setIsPreviewOpen(true);
    } catch (e) {
      console.error('Failed to generate preview PDF:', e);
      addToast({ type: 'error', title: 'Preview Error', message: 'Failed to generate PDF preview.' });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadSheetPDF = async () => {
    if (filteredRows.length === 0) return;
    try {
      setIsGeneratingPDF(true);
      const opts = getSheetPdfOptions();
      await generateCollectionSheetPDF(opts);
      addToast({
        type: 'success',
        title: 'PDF Downloaded',
        message: `Collection sheet for ${activeBranch.name} downloaded.`,
      });
    } catch (e) {
      console.error('Failed to download PDF:', e);
      addToast({ type: 'error', title: 'Download Error', message: 'Failed to generate collection sheet PDF.' });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
  };

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPreviewOpen) {
        handleClosePreview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewOpen, previewBlobUrl]);

  const handleExportCSV = () => {
    if (filteredRows.length === 0) return;
    const headers = [
      'Sl No,Customer ID,Customer Name,Guardian,Phone,Loan ID,Installment,Demand (INR),Collected (INR),Pending (INR),Payment Mode,Status,Branch,Date'
    ];
    const rows = filteredRows.map(
      (r) =>
        `${r.slNo},${r.customerId},"${r.customerName}","${r.spouseName}","${r.phone}",${r.loanId},"${r.installmentNo}",${r.demandAmount},${r.collectedAmount},${r.pendingAmount},"${r.mode}","${r.status}","${activeBranch.name}","${selectedDate}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `GLF_Collection_Sheet_${selectedDate}_${activeBranch.code || activeBranch.id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast({
      type: 'success',
      title: 'CSV Exported',
      message: `${filteredRows.length} collection records exported as CSV.`,
    });
  };

  // Formatted date for display
  const displayFormattedDate = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch {
      // fallback
    }
    return selectedDate;
  }, [selectedDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 font-body pb-20 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 w-full min-w-0"
    >
      {/* ────────────────────────────────────────────────────────── */}
      {/* TOP MODULE SELECTOR: Collection Sheet vs Sanction Letter   */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="print:hidden bg-white rounded-2xl p-1.5 border border-gray-200 shadow-xs flex items-center gap-1.5 max-w-md">
        <button
          type="button"
          onClick={() => setActivePrintTab('sheet')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activePrintTab === 'sheet'
              ? 'bg-[#0B1F3A] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Printer size={14} />
          <span>Daily Collection Sheet</span>
        </button>
        <button
          type="button"
          onClick={() => setActivePrintTab('sanction')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activePrintTab === 'sanction'
              ? 'bg-[#0B1F3A] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <FileText size={14} className={activePrintTab === 'sanction' ? 'text-[#D4AF37]' : ''} />
          <span>Sanction Letter & T&C</span>
        </button>
      </div>

      {activePrintTab === 'sanction' ? (
        <SanctionLetterPage />
      ) : (
        <>
          {/* ────────────────────────────────────────────────────────── */}
          {/* 1. HEADER & ACTION BAR (Hidden when printing)              */}
          {/* ────────────────────────────────────────────────────────── */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-[0_2px_10px_rgba(11,31,58,0.04)] relative z-30 print:hidden">
        <div className="bg-[#0B1F3A] rounded-2xl px-4 sm:px-6 lg:px-8 py-5 text-white border-b border-[#E5E7EB]/10 relative z-30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Title & PDF Responsibility */}
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-1.5 h-8 bg-[#D4AF37] rounded-full shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase font-body">
                  PRINT COLLECTION SHEETS
                </h1>
                <p className="text-xs text-[#9CA3AF] mt-0.5 font-body">
                  Generate, preview and print official collection sheets for branch collection operations
                </p>
              </div>
            </div>

            {/* Right: Branch Selector & Print Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Branch Selector */}
              <div className="relative z-40" ref={dropdownRef}>
                <button
                  ref={triggerButtonRef}
                  type="button"
                  onClick={() => setBranchDropdownOpen((prev) => !prev)}
                  onKeyDown={handleTriggerKeyDown}
                  aria-haspopup="listbox"
                  aria-expanded={branchDropdownOpen}
                  aria-label={`Select branch. Currently selected: ${activeBranch.name}`}
                  className="inline-flex items-center justify-between gap-2.5 px-3 py-2 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/20 hover:border-[#D4AF37]/50 rounded-xl text-xs font-bold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer min-h-[38px]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building size={14} className="text-[#D4AF37] shrink-0" />
                    <span className="truncate max-w-[150px] sm:max-w-[200px]">{activeBranch.name}</span>
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

              {/* Action: Preview */}
              <button
                type="button"
                onClick={handlePreviewSheetPDF}
                disabled={filteredRows.length === 0 || isGeneratingPDF}
                className="px-3 py-2 min-h-[38px] rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-white/20 shadow-xs"
                title="Preview Collection Sheet"
              >
                <Eye size={14} className="text-[#D4AF37]" />
                <span>Preview</span>
              </button>

              {/* Action: Download PDF */}
              <button
                type="button"
                onClick={handleDownloadSheetPDF}
                disabled={filteredRows.length === 0 || isGeneratingPDF}
                className="px-3.5 py-2 min-h-[38px] rounded-xl bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#C9A227] hover:brightness-105 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-[#0B1F3A] font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                title="Download Collection Sheet as PDF"
              >
                <Download size={14} />
                <span>Download PDF</span>
              </button>

              {/* Action: Print A4 */}
              <button
                type="button"
                onClick={handlePrint}
                disabled={filteredRows.length === 0}
                className="px-3 py-2 min-h-[38px] rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 disabled:pointer-events-none text-[#0B1F3A] font-bold text-xs uppercase tracking-wider transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                title="Print via Browser"
              >
                <Printer size={14} />
                <span>Print A4</span>
              </button>

              {/* Action: CSV */}
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={filteredRows.length === 0}
                className="px-3 py-2 min-h-[38px] rounded-xl bg-white/5 hover:bg-white/15 active:bg-white/20 disabled:opacity-40 disabled:pointer-events-none text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-white/10"
                title="Export filtered records as CSV spreadsheet"
              >
                <FileText size={14} />
                <span>CSV</span>
              </button>
            </div>

          </div>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* Filter Controls (All working together)                     */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="p-4 sm:p-6 bg-[#FAFBFD] border-b border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* 1. Date Filter */}
          <div>
            <label className="text-gray-500 font-bold uppercase text-[10px] block mb-1">
              Collection Date
            </label>
            <div className="relative inline-flex items-center w-full">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2.5 pl-8 min-h-[42px] rounded-xl bg-white border border-gray-200 text-[#0B1F3A] font-semibold focus:outline-none focus:border-[#D4AF37] shadow-xs cursor-pointer"
              />
              <Calendar size={13} className="text-[#D4AF37] absolute left-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 2. Customer Relationship Officer (CRO) Filter */}
          <div>
            <label className="text-gray-500 font-bold uppercase text-[10px] block mb-1">
              Customer Relationship Officer (CRO)
            </label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-3 py-2 min-h-[42px] rounded-xl bg-white border border-gray-200 text-[#0B1F3A] font-semibold focus:outline-none focus:border-[#D4AF37] shadow-xs cursor-pointer"
            >
              <option value="all">All CROs ({availableAgents.length})</option>
              {availableAgents.map((ag) => (
                <option key={ag} value={ag}>
                  {ag}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Collection Group Filter */}
          <div>
            <label className="text-gray-500 font-bold uppercase text-[10px] block mb-1">
              Collection Group
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 min-h-[42px] rounded-xl bg-white border border-gray-200 text-[#0B1F3A] font-semibold focus:outline-none focus:border-[#D4AF37] shadow-xs cursor-pointer"
            >
              <option value="all">All Groups ({availableGroups.length})</option>
              {availableGroups.map((g) => (
                <option key={g.name} value={g.name}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Center / Area Route Filter */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-gray-500 font-bold uppercase text-[10px] block">
                Center / Route
              </label>
              {(selectedAgent !== 'all' || selectedGroup !== 'all' || selectedCenter !== 'all' || selectedDate !== todayDateStr) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[10px] font-bold text-[#D4AF37] hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <RotateCcw size={10} />
                  <span>Reset</span>
                </button>
              )}
            </div>
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="w-full px-3 py-2 min-h-[42px] rounded-xl bg-white border border-gray-200 text-[#0B1F3A] font-semibold focus:outline-none focus:border-[#D4AF37] shadow-xs cursor-pointer"
            >
              <option value="all">All Centers ({availableCenters.length})</option>
              {availableCenters.map((ctr) => (
                <option key={ctr} value={ctr}>
                  {ctr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. PRINTABLE SHEET DOCUMENT CONTAINER                      */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 sm:p-8 rounded-2xl border border-gray-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 w-full">
        {/* Letterhead Header with Branding */}
        <div className="border-b-2 border-[#0B1F3A] pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-[#D4AF37] shadow-sm flex-shrink-0 overflow-hidden p-0.5">
              <img
                src="/logo.png"
                alt="Golden Leaf Logo"
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  (e.target as any).src = '/logo-icon.png';
                }}
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-display font-extrabold text-[#0B1F3A] tracking-wider uppercase leading-none">
                GOLDEN LEAF FINANCE
              </h2>
              <p className="text-[9px] sm:text-[10px] font-bold text-[#D4AF37] tracking-[0.25em] uppercase mt-0.5">
                MICROFINANCE ENTERPRISE SYSTEMS
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {activeBranch.name} ({activeBranch.code || activeBranch.id}) • Official Collection Sheet
              </p>
            </div>
          </div>

          <div className="sm:text-right text-xs">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Sheet Reference</span>
            <strong className="font-mono text-[#0B1F3A]">GLF-SHT-{selectedDate.replace(/-/g, '')}-01</strong>
            <p className="text-gray-500 text-[11px] mt-0.5">
              Date: <strong>{displayFormattedDate}</strong>
            </p>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#FAFBFD] p-4 rounded-xl border border-gray-200 mb-6 text-xs">
          <div>
            <span className="text-gray-400 text-[10px] uppercase font-bold block">Assigned Officer (CRO)</span>
            <strong className="text-[#0B1F3A]">
              {selectedAgent === 'all' ? 'All Branch CROs' : selectedAgent}
            </strong>
          </div>
          <div>
            <span className="text-gray-400 text-[10px] uppercase font-bold block">Collection Center</span>
            <strong className="text-[#0B1F3A]">
              {selectedCenter === 'all' ? 'All Centers' : selectedCenter}
            </strong>
          </div>
          <div>
            <span className="text-gray-400 text-[10px] uppercase font-bold block">Group Name</span>
            <strong className="text-[#0B1F3A]">
              {selectedGroup === 'all' ? 'All Collection Groups' : selectedGroup}
            </strong>
          </div>
          <div>
            <span className="text-gray-400 text-[10px] uppercase font-bold block">Total Demand</span>
            <strong className="text-emerald-700 font-mono text-sm font-bold">
              ₹{totalDemand.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* 3. COLLECTION SHEET DATA TABLE (Or Empty State)            */}
        {/* ────────────────────────────────────────────────────────── */}
        {filteredRows.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-500 font-body space-y-2 border border-dashed border-gray-200 rounded-xl">
            <div className="p-3 bg-gray-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-gray-400">
              <FileText size={20} />
            </div>
            <div className="font-bold text-gray-800 text-sm uppercase tracking-wide">
              NO COLLECTION RECORDS FOUND
            </div>
            <div className="text-gray-400 max-w-sm mx-auto">
              No collection records are available for the selected filters. Change date, agent, group, or center to view records.
            </div>
          </div>
        ) : (
          <>
            {/* Desktop & Tablet Table */}
            <div className="hidden sm:block overflow-x-auto custom-scrollbar border border-gray-200 rounded-xl">
              <table className="w-full text-xs text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-[#0B1F3A] text-white">
                    <th className="py-3 px-3.5 font-bold uppercase text-[10px] rounded-tl-lg">#</th>
                    <th className="py-3 px-3.5 font-bold uppercase text-[10px]">Customer ID</th>
                    <th className="py-3 px-3.5 font-bold uppercase text-[10px]">Customer Name</th>
                    <th className="py-3 px-3.5 font-bold uppercase text-[10px]">Loan ID</th>
                    <th className="py-3 px-3.5 font-bold uppercase text-[10px]">Installment</th>
                    <th className="py-3 px-3.5 font-bold uppercase text-[10px] text-right">Demand (₹)</th>
                    <th className="py-3 px-3.5 font-bold uppercase text-[10px] text-right">Collected (₹)</th>
                    <th className="py-3 px-3.5 font-bold uppercase text-[10px] text-right">Pending (₹)</th>
                    <th className="py-3 px-3.5 font-bold uppercase text-[10px] text-center rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRows.map((row) => (
                    <tr key={row.slNo} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-gray-500">{row.slNo}</td>
                      <td className="py-3 px-3.5 font-mono font-bold text-[#0B1F3A]">{row.customerId}</td>
                      <td className="py-3 px-3.5 font-semibold text-gray-900">{row.customerName}</td>
                      <td className="py-3 px-3.5 font-mono text-gray-600">{row.loanId}</td>
                      <td className="py-3 px-3.5 font-mono text-gray-700">{row.installmentNo}</td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-gray-900">
                        ₹{row.demandAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-[#16A37A]">
                        ₹{row.collectedAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-[#D99A19]">
                        ₹{row.pendingAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            row.status === 'Collected'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : row.status === 'Advance'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : row.status === 'Partial'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : row.status === 'Delayed'
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold text-[#0B1F3A] border-t-2 border-[#0B1F3A]">
                    <td colSpan={5} className="py-3 px-3.5 text-right uppercase text-[11px]">
                      Totals:
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-sm text-gray-900">
                      ₹{totalDemand.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-sm text-[#16A37A]">
                      ₹{totalCollected.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-sm text-[#D99A19]">
                      ₹{totalPending.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3.5 text-center text-xs text-gray-500 font-normal">
                      {filteredRows.length} Accounts
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Responsive Cards (Zero horizontal page scroll) */}
            <div className="sm:hidden space-y-3">
              {filteredRows.map((row) => (
                <div
                  key={row.slNo}
                  className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2 text-xs font-body"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-[#0B1F3A] text-sm">{row.customerName}</div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        #{row.slNo} • {row.customerId} • {row.loanId}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                        row.status === 'Collected'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : row.status === 'Advance'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : row.status === 'Partial'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : row.status === 'Delayed'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {row.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-600">
                    Installment: <strong className="font-mono">{row.installmentNo}</strong>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200/60 font-mono">
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">Demand</span>
                      <span className="font-bold text-gray-900 text-xs">
                        ₹{row.demandAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">Collected</span>
                      <span className="font-bold text-[#16A37A] text-xs">
                        ₹{row.collectedAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block uppercase">Pending</span>
                      <span className="font-bold text-[#D99A19] text-xs">
                        ₹{row.pendingAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Mobile Totals Summary Card */}
              <div className="p-4 rounded-xl bg-[#0B1F3A] text-white space-y-2 font-body">
                <div className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                  Collection Sheet Totals ({filteredRows.length} Records)
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-1 border-t border-white/10">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Total Demand</span>
                    <span className="font-bold text-white">₹{totalDemand.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Total Collected</span>
                    <span className="font-bold text-[#16A37A]">₹{totalCollected.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block uppercase">Total Pending</span>
                    <span className="font-bold text-[#D99A19]">₹{totalPending.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. HIGH QUALITY PDF PREVIEW MODAL                           */}
      {/* ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isPreviewOpen && previewBlobUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none"
            role="dialog"
            aria-modal="true"
          >
            {/* Clickable Backdrop Overlay — Clicking anywhere outside closes preview */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={handleClosePreview}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs cursor-pointer"
              aria-label="Close preview backdrop"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-slate-200 relative z-10 select-text"
            >
              {/* Modal Header */}
              <div className="bg-[#0B1F3A] px-4 sm:px-6 py-4 flex items-center justify-between gap-3 border-b border-[#D4AF37]/30 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white p-1 border border-[#D4AF37] flex items-center justify-center overflow-hidden">
                    <img
                      src="/logo.png"
                      alt="Logo"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as any).src = '/logo-icon.png';
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-body">
                      Collection Sheet Preview
                    </h3>
                    <p className="text-[11px] text-slate-300 font-body">
                      {activeBranch.name} • {displayFormattedDate} ({filteredRows.length} Records)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSheetPDF}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#F5D061] to-[#D4AF37] text-[#0B1F3A] font-bold text-xs shadow-md hover:brightness-105 transition-all cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClosePreview}
                    className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                    title="Close preview"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body: PDF Viewer iFrame */}
              <div className="flex-1 bg-slate-100 p-2 overflow-hidden">
                <iframe
                  src={previewBlobUrl}
                  className="w-full h-full rounded-xl border border-slate-300 shadow-inner"
                  title="Collection Sheet Preview"
                />
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

export default PrintingPage;
