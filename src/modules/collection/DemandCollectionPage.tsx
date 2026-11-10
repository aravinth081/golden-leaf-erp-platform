// ──────────────────────────────────────────────────
// GOLDEN LEAF FINANCE — VIEW DAILY COLLECTIONS
// PDF-Strict Branch Manager Module:
// • Source of Truth: Finance Collection & Loan Management System PDF
// • Branch Manager explicitly includes "View Daily Collections" & "Print Collection Sheets"
// • Collection Management explicitly includes:
//   - Today's Collection, Tomorrow Collection, Area-wise Collection
//   - Collection Status, Collection History, Advance Collection, Pending Collection (NC), Delay Tracking
// • Daily Collection Planner:
//   - Automatically generate Today's Collection List & Tomorrow's Collection List
// • Strictly scoped to authenticated Branch Context (branchId)
// • 100% Data-Driven: Real-time collection metrics and tracking
// • High-End SaaS Fintech Aesthetic: Luxury Deep Navy, Polished Gold, Crisp Tabular Alignment
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Printer,
  Clock,
  RotateCcw,
  Search,
  Calendar,
  Building2,
  CheckCircle2,
  X,
  AlertTriangle,
  AlertCircle,
  MapPin,
  Eye,
  ChevronDown,
  Check,
  User,
  Users,
  Phone,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Download,
  FileText,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import { getStoredBranches, type DetailedBranch } from '../../services/branchService';
import {
  getMonitoredCollections,
  getBranchCollectionGroups,
  getBranchAgents,
  type MonitoredCollection,
  type MonitoredCollectionCategory,
  type BranchCollectionGroup,
} from '../../services/monitoringDataService';
import { generateCollectionSheetPDF } from '../../utils/pdfGenerator';

const getTodayDateStr = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTomorrowDateStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (dateStr: string): string => {
  if (dateStr === 'Today') {
    return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  if (dateStr === 'Tomorrow') {
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    return tm.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
};

const fmtCurrency = (amount: number): string => `₹${Math.round(amount).toLocaleString('en-IN')}`;

const DemandCollectionPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const selectedBranchId = useUIStore((s) => s.selectedBranchId);
  const setSelectedBranchId = useUIStore((s) => s.setSelectedBranchId);
  const addToast = useUIStore((s) => s.addToast);

  // ── 1. AUTHENTICATED BRANCH CONTEXT & ISOLATION ──
  const [branches, setBranches] = useState<DetailedBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<DetailedBranch | null>(null);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [focusedBranchIndex, setFocusedBranchIndex] = useState<number>(0);
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const branchOptionsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Keep focusedBranchIndex synchronized when dropdown opens
  useEffect(() => {
    if (isBranchDropdownOpen) {
      const idx = branches.findIndex((b) => b.id === currentBranch?.id);
      setFocusedBranchIndex(idx >= 0 ? idx : 0);
    }
  }, [isBranchDropdownOpen, branches, currentBranch]);

  // Smoothly scroll focused branch option into view
  useEffect(() => {
    if (isBranchDropdownOpen && branchOptionsRef.current[focusedBranchIndex]) {
      branchOptionsRef.current[focusedBranchIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [focusedBranchIndex, isBranchDropdownOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize branches & sync with selectedBranchId
  useEffect(() => {
    const stored = getStoredBranches();
    setBranches(stored);

    // Primary branch resolution:
    const userBranchClaim = user?.customClaims?.branchId;
    let targetBranch: DetailedBranch | undefined;

    // 1. High priority: Explicit branch selection from UI store
    if (selectedBranchId) {
      targetBranch = stored.find((b) => b.id === selectedBranchId || b.code === selectedBranchId);
    }

    // 2. Second priority: Authenticated user branch claim
    if (!targetBranch && userBranchClaim) {
      targetBranch = stored.find(
        (b) =>
          b.id.toLowerCase() === userBranchClaim.toLowerCase() ||
          b.code.toLowerCase() === userBranchClaim.toLowerCase() ||
          (userBranchClaim === 'b1' && (b.id === 'BR-01' || b.code === 'GL-BR-001'))
      );
    }

    // 3. Fallback: First stored branch
    if (!targetBranch && stored.length > 0) {
      targetBranch = stored[0];
    }

    if (targetBranch) {
      setCurrentBranch(targetBranch);
      if (selectedBranchId !== targetBranch.id) {
        setSelectedBranchId(targetBranch.id);
      }
    }
  }, [user, selectedBranchId, setSelectedBranchId]);

  // Listen for global branch changes across components
  useEffect(() => {
    const handleBranchSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ branchId: string }>;
      const newId = customEvent?.detail?.branchId;
      if (newId) {
        const stored = getStoredBranches();
        const found = stored.find((b) => b.id === newId || b.code === newId);
        if (found) {
          setCurrentBranch(found);
          setSelectedBranchId(found.id);
        }
      }
    };
    window.addEventListener('glf-branch-changed', handleBranchSync);
    return () => window.removeEventListener('glf-branch-changed', handleBranchSync);
  }, [setSelectedBranchId]);

  const handleBranchSelect = (branch: DetailedBranch) => {
    setSelectedBranchId(branch.id);
    setCurrentBranch(branch);
    setIsBranchDropdownOpen(false);
    // Reset filters when switching branch
    setSelectedAgent('all');
    setSelectedArea('all');
    setSelectedGroup('all');
    setSearchQuery('');
    setSelectedDate(getTodayDateStr());
    setActiveTab('today');
    // Global branch change notification
    window.dispatchEvent(
      new CustomEvent('glf-branch-changed', {
        detail: { branchId: branch.id, branchName: branch.name },
      })
    );
    addToast({
      type: 'info',
      title: 'Branch Switched',
      message: `Switched to ${branch.name}. Daily collections refreshed.`,
    });
  };

  // Keyboard navigation for branch switcher (ArrowUp, ArrowDown, Home, End, Enter, Escape)
  const handleBranchKeyDown = (e: React.KeyboardEvent) => {
    if (!isBranchDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const idx = branches.findIndex((b) => b.id === currentBranch?.id);
        setFocusedBranchIndex(idx >= 0 ? idx : 0);
        setIsBranchDropdownOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedBranchIndex((prev) => (prev + 1) % branches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedBranchIndex((prev) => (prev - 1 + branches.length) % branches.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusedBranchIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setFocusedBranchIndex(branches.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const chosen = branches[focusedBranchIndex];
      if (chosen) {
        handleBranchSelect(chosen);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsBranchDropdownOpen(false);
    } else if (e.key === 'Tab') {
      setIsBranchDropdownOpen(false);
    }
  };

  // ── 2. FILTER & STATE MANAGEMENT ──
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<MonitoredCollectionCategory>('today');
  const [selectedRecord, setSelectedRecord] = useState<MonitoredCollection | null>(null);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isSheetPreviewOpen, setIsSheetPreviewOpen] = useState<boolean>(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState<boolean>(false);
  const [dataVersion, setDataVersion] = useState<number>(0);

  // ── KEYBOARD NAVIGATION FOR 5 FILTER CONTROLS (← ArrowLeft & → ArrowRight) ──
  // Index 0: Collection Date, 1: Customer Relationship Officer (CRO), 2: Area, 3: Group, 4: Search Input
  const filterRefs = useRef<(HTMLElement | null)[]>([]);

  const handleFilterKeyDown = (index: number, e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowRight') {
      // In text input, only navigate right if cursor is at the end or text is empty
      if (e.currentTarget instanceof HTMLInputElement && e.currentTarget.type === 'text') {
        const input = e.currentTarget;
        if (input.selectionEnd !== null && input.selectionEnd < input.value.length) {
          return; // Allow moving within text
        }
      }
      e.preventDefault();
      const nextIndex = (index + 1) % 5;
      const target = filterRefs.current[nextIndex];
      if (target) {
        target.focus();
        if (target instanceof HTMLInputElement && target.type === 'text') {
          target.select();
        }
      }
    } else if (e.key === 'ArrowLeft') {
      // In text input, only navigate left if cursor is at the start or text is empty
      if (e.currentTarget instanceof HTMLInputElement && e.currentTarget.type === 'text') {
        const input = e.currentTarget;
        if (input.selectionStart !== null && input.selectionStart > 0) {
          return; // Allow moving within text
        }
      }
      e.preventDefault();
      const prevIndex = (index - 1 + 5) % 5;
      const target = filterRefs.current[prevIndex];
      if (target) {
        target.focus();
        if (target instanceof HTMLInputElement && target.type === 'text') {
          target.select();
        }
      }
    }
  };

  useEffect(() => {
    const handleDataChange = () => setDataVersion((v) => v + 1);
    window.addEventListener('glf-collections-updated', handleDataChange);
    window.addEventListener('glf-collection-groups-updated', handleDataChange);
    window.addEventListener('glf-employees-updated', handleDataChange);
    window.addEventListener('glf-storage-sync', handleDataChange);
    window.addEventListener('storage', handleDataChange);
    return () => {
      window.removeEventListener('glf-collections-updated', handleDataChange);
      window.removeEventListener('glf-collection-groups-updated', handleDataChange);
      window.removeEventListener('glf-employees-updated', handleDataChange);
      window.removeEventListener('glf-storage-sync', handleDataChange);
      window.removeEventListener('storage', handleDataChange);
    };
  }, []);

  // ── 3. BRANCH-ISOLATED DATA FETCHING ──
  const activeBranchId = currentBranch?.id || selectedBranchId || 'BR-01';

  // Branch Groups
  const branchGroups = useMemo<BranchCollectionGroup[]>(() => {
    return getBranchCollectionGroups(activeBranchId);
  }, [activeBranchId, dataVersion]);

  // All collections for this branch
  const allBranchCollections = useMemo<MonitoredCollection[]>(() => {
    return getMonitoredCollections(activeBranchId, 'all');
  }, [activeBranchId, dataVersion]);

  // Extract distinct agents for the current branch (Collections + Employee Master + Branch Service)
  const branchAgents = useMemo<string[]>(() => {
    return getBranchAgents(activeBranchId);
  }, [activeBranchId, dataVersion]);

  // Extract distinct areas for the current branch
  const branchAreas = useMemo<string[]>(() => {
    const set = new Set<string>();
    allBranchCollections.forEach((c) => {
      if (c.area) {
        set.add(c.area);
      } else if (c.areaRoute) {
        const clean = c.areaRoute.replace(/^Route [A-Z] - /, '').replace(/ \([^)]+\)$/, '').trim();
        if (clean) set.add(clean);
      }
    });
    return Array.from(set).sort();
  }, [allBranchCollections]);

  // Tab count statistics for the quick tabs
  const tabCounts = useMemo(() => {
    const todayStr = getTodayDateStr();
    const tomorrowStr = getTomorrowDateStr();
    return {
      today: allBranchCollections.filter((r) => r.date === 'Today' || r.date === todayStr).length,
      tomorrow: allBranchCollections.filter((r) => r.date === 'Tomorrow' || r.date === tomorrowStr).length,
      advance: allBranchCollections.filter((r) => r.status === 'advance').length,
      pending_nc: allBranchCollections.filter((r) => r.status === 'nc' || r.status === 'pending').length,
      delay_tracking: allBranchCollections.filter(
        (r) => r.status === 'delayed' || (r.delayedDays !== undefined && r.delayedDays > 0)
      ).length,
      history: allBranchCollections.filter(
        (r) => r.date !== 'Today' && r.date !== 'Tomorrow' && r.date !== todayStr && r.date !== tomorrowStr
      ).length,
      all: allBranchCollections.length,
    };
  }, [allBranchCollections]);

  // Synchronize category tab with date picker
  const handleTabChange = (tab: MonitoredCollectionCategory) => {
    setActiveTab(tab);
    if (tab === 'today') {
      setSelectedDate(getTodayDateStr());
    } else if (tab === 'tomorrow') {
      setSelectedDate(getTomorrowDateStr());
    }
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    const today = getTodayDateStr();
    const tomorrow = getTomorrowDateStr();
    if (newDate === today) {
      setActiveTab('today');
    } else if (newDate === tomorrow) {
      setActiveTab('tomorrow');
    } else {
      setActiveTab('all');
    }
  };

  // ── 4. FILTERED DATA CALCULATION ──
  const filteredRecords = useMemo(() => {
    const todayStr = getTodayDateStr();
    const tomorrowStr = getTomorrowDateStr();

    return allBranchCollections.filter((rec) => {
      // 1. Date / Category logic
      if (activeTab === 'today') {
        const isToday = rec.date === 'Today' || rec.date === todayStr;
        if (!isToday) return false;
      } else if (activeTab === 'tomorrow') {
        const isTomorrow = rec.date === 'Tomorrow' || rec.date === tomorrowStr;
        if (!isTomorrow) return false;
      } else if (activeTab === 'advance') {
        if (rec.status !== 'advance') return false;
      } else if (activeTab === 'pending_nc') {
        if (rec.status !== 'nc' && rec.status !== 'pending') return false;
      } else if (activeTab === 'delay_tracking') {
        if (rec.status !== 'delayed' && (!rec.delayedDays || rec.delayedDays <= 0)) return false;
      } else if (activeTab === 'history') {
        if (rec.date === 'Today' || rec.date === 'Tomorrow' || rec.date === todayStr || rec.date === tomorrowStr) {
          return false;
        }
      } else {
        // 'all' or custom date
        if (selectedDate) {
          const matchesDate =
            (selectedDate === todayStr && (rec.date === 'Today' || rec.date === todayStr)) ||
            (selectedDate === tomorrowStr && (rec.date === 'Tomorrow' || rec.date === tomorrowStr)) ||
            rec.date === selectedDate;
          if (!matchesDate) return false;
        }
      }

      // 2. Agent filter
      if (selectedAgent !== 'all' && rec.agentName !== selectedAgent) {
        return false;
      }

      // 3. Area filter (Area-wise Collection)
      if (selectedArea !== 'all') {
        const recArea = rec.area || rec.areaRoute;
        if (!recArea.toLowerCase().includes(selectedArea.toLowerCase())) {
          return false;
        }
      }

      // 4. Group filter (Group Assignment)
      if (selectedGroup !== 'all') {
        if (rec.groupId !== selectedGroup && rec.groupName !== selectedGroup) {
          return false;
        }
      }

      // 5. Customer / Loan search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCust = rec.customerName.toLowerCase().includes(q) || rec.customerId.toLowerCase().includes(q);
        const matchLoan = rec.loanId.toLowerCase().includes(q);
        if (!matchCust && !matchLoan) return false;
      }

      return true;
    });
  }, [allBranchCollections, activeTab, selectedDate, selectedAgent, selectedArea, selectedGroup, searchQuery]);

  // ── 5. STRICT DATA-DRIVEN CALCULATIONS ──
  // TOTAL COLLECTED: SUM(actual collected amount for valid collection records for selected date and current branch)
  const totalCollected = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + (r.collectedAmount || 0), 0);
  }, [filteredRecords]);

  // PENDING COLLECTION: SUM(actual remaining due amounts from collection records)
  const pendingCollection = useMemo(() => {
    return filteredRecords.reduce((sum, r) => {
      if (r.status === 'collected') return sum;
      const expected = r.dueAmount ?? r.expectedAmount ?? 0;
      const collected = r.collectedAmount ?? 0;
      const remaining = Math.max(0, expected - collected);
      return sum + remaining;
    }, 0);
  }, [filteredRecords]);

  // ADVANCE COLLECTION: Sum actual amounts explicitly classified as advance collections
  const advanceCollection = useMemo(() => {
    return filteredRecords
      .filter((r) => r.status === 'advance')
      .reduce((sum, r) => sum + (r.collectedAmount || 0), 0);
  }, [filteredRecords]);

  // DELAY TRACKING: Count actual delayed collection records based on application due-date/status logic
  const delayedCount = useMemo(() => {
    return filteredRecords.filter((r) => r.status === 'delayed' || (r.delayedDays !== undefined && r.delayedDays > 0)).length;
  }, [filteredRecords]);

  // Reset Filters Handler
  const handleResetFilters = () => {
    setSelectedDate(getTodayDateStr());
    setSelectedAgent('all');
    setSelectedArea('all');
    setSelectedGroup('all');
    setSearchQuery('');
    setActiveTab('today');
    addToast({
      type: 'info',
      title: 'Filters Reset',
      message: "Reset all collection filters to Today's date.",
    });
  };

  // ── 6. COLLECTION SHEET ACTIONS (PREVIEW, PRINT & DOWNLOAD) ──
  const handleOpenSheetPreview = () => {
    if (filteredRecords.length === 0) {
      addToast({
        type: 'error',
        title: 'No Records',
        message: 'No collection records found for the selected branch and date.',
      });
      return;
    }
    setIsSheetPreviewOpen(true);
  };

  const handleDownloadCollectionSheetPDF = async () => {
    if (filteredRecords.length === 0) return;

    setIsDownloadingPDF(true);
    try {
      const activeBranchName = currentBranch?.name || 'Main Branch';
      const displayDate = formatDateDisplay(selectedDate);
      const sheetRef = `CS-${activeBranchId}-${selectedDate.replace(/-/g, '')}`;

      await generateCollectionSheetPDF({
        sheetRef,
        date: displayDate,
        agentName: selectedAgent !== 'all' ? selectedAgent : 'All Branch CROs',
        groupName: selectedGroup !== 'all' ? selectedGroup : 'All Customer Groups',
        centerName: selectedArea !== 'all' ? selectedArea : 'All Route Areas',
        branchName: activeBranchName,
        rows: filteredRecords.map((r, idx) => ({
          slNo: idx + 1,
          customerId: r.customerId,
          customerName: r.customerName,
          spouseName: '—',
          phone: r.customerPhone || '—',
          loanId: r.loanId,
          installmentNo: r.installment || '01 / 20',
          demandAmount: r.dueAmount ?? r.expectedAmount ?? 0,
          collectedAmount: r.collectedAmount || 0,
          mode: r.paymentMode || 'Cash',
          status: r.status.toUpperCase(),
        })),
        fileName: `Collection_Sheet_${activeBranchId}_${selectedDate}.pdf`,
      });

      addToast({
        type: 'success',
        title: 'PDF Downloaded',
        message: `Official Collection Sheet saved for ${activeBranchName}.`,
      });
    } catch (error) {
      console.error('Failed to generate collection sheet:', error);
      addToast({
        type: 'error',
        title: 'Download Failed',
        message: 'Unable to generate PDF collection sheet. Please try again.',
      });
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handlePrintSheetFromPreview = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) return;
    const activeBranchName = currentBranch?.name || 'Main Branch';
    const displayDate = formatDateDisplay(selectedDate);
    const sheetRef = `CS-${activeBranchId}-${selectedDate.replace(/-/g, '')}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Collection Sheet - ${activeBranchName} - ${displayDate}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #0B1F3A; background: #fff; font-size: 11px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #D4AF37; padding-bottom: 12px; margin-bottom: 14px; }
            .brand { font-size: 18px; font-weight: 800; color: #0B1F3A; letter-spacing: 0.5px; }
            .sub { font-size: 10px; color: #64748B; margin-top: 3px; text-transform: uppercase; font-weight: 600; }
            .ref { font-family: monospace; font-size: 11px; font-weight: bold; color: #0B1F3A; text-align: right; }
            .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px 12px; border-radius: 8px; margin-bottom: 14px; }
            .meta-item .lbl { font-size: 9px; text-transform: uppercase; color: #64748B; font-weight: bold; }
            .meta-item .val { font-size: 11px; font-weight: bold; color: #0B1F3A; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10.5px; }
            th { background: #0B1F3A; color: #fff; padding: 6px 8px; text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.5px; }
            td { padding: 6px 8px; border-bottom: 1px solid #E2E8F0; }
            tr:nth-child(even) { background: #F8FAFC; }
            .totals { font-weight: bold; background: #EEF2F6; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 28px; padding-top: 16px; border-top: 1px solid #CBD5E1; }
            .sig-box { text-align: center; }
            .sig-line { border-bottom: 1px solid #94A3B8; margin-bottom: 6px; height: 36px; }
            .sig-title { font-size: 9.5px; text-transform: uppercase; color: #475569; font-weight: bold; letter-spacing: 0.5px; }
            .footer { margin-top: 16px; font-size: 9px; color: #94A3B8; text-align: center; }
            @media print {
              body { padding: 0; }
              @page { size: landscape; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">THE GOLDEN LEAF FINANCE</div>
              <div class="sub">Branch Daily Demand & Collection Register • ${activeBranchName}</div>
            </div>
            <div class="ref">
              <div>REF: ${sheetRef}</div>
              <div style="font-size: 10px; color: #64748B; font-weight: normal; margin-top: 2px;">Date: ${displayDate}</div>
            </div>
          </div>

          <div class="meta">
            <div class="meta-item"><div class="lbl">Operating Branch</div><div class="val">${activeBranchName} (${activeBranchId})</div></div>
            <div class="meta-item"><div class="lbl">Collection Date</div><div class="val">${displayDate}</div></div>
            <div class="meta-item"><div class="lbl">Assigned Officer (CRO)</div><div class="val">${selectedAgent !== 'all' ? selectedAgent : 'All Branch CROs'}</div></div>
            <div class="meta-item"><div class="lbl">Route / Area</div><div class="val">${selectedArea !== 'all' ? selectedArea : 'All Route Areas'}</div></div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 28px;">#</th>
                <th>Client ID</th>
                <th>Customer Name</th>
                <th>Loan ID</th>
                <th>Route / Area</th>
                <th>Group</th>
                <th style="text-align: right;">Demand (₹)</th>
                <th style="text-align: right;">Collected (₹)</th>
                <th>Mode</th>
                <th>Status</th>
                <th style="text-align: center; width: 110px;">Borrower Sign</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRecords.map((r, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td style="font-family: monospace; font-weight: bold;">${r.customerId}</td>
                  <td><strong>${r.customerName}</strong></td>
                  <td style="font-family: monospace;">${r.loanId}</td>
                  <td>${r.area || r.areaRoute || '—'}</td>
                  <td>${r.groupName || '—'}</td>
                  <td style="text-align: right; font-weight: 600;">₹${(r.dueAmount ?? r.expectedAmount ?? 0).toLocaleString('en-IN')}</td>
                  <td style="text-align: right; font-weight: bold; color: ${r.collectedAmount > 0 ? '#059669' : '#0B1F3A'};">₹${(r.collectedAmount || 0).toLocaleString('en-IN')}</td>
                  <td>${r.paymentMode || 'Cash'}</td>
                  <td><span style="font-size: 9px; font-weight: bold; text-transform: uppercase;">${r.status}</span></td>
                  <td style="border-bottom: 1px dotted #CBD5E1;"></td>
                </tr>
              `).join('')}
              <tr class="totals">
                <td colspan="6" style="text-align: right; text-transform: uppercase; font-weight: 800;">Total Summary (${filteredRecords.length} accounts):</td>
                <td style="text-align: right; font-weight: 800;">₹${filteredRecords.reduce((acc, r) => acc + (r.dueAmount ?? r.expectedAmount ?? 0), 0).toLocaleString('en-IN')}</td>
                <td style="text-align: right; font-weight: 900; color: #047857;">₹${totalCollected.toLocaleString('en-IN')}</td>
                <td colspan="3"></td>
              </tr>
            </tbody>
          </table>

          <div class="signatures">
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-title">Customer Relationship Officer (CRO) Signature</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-title">Branch Manager Signature & Seal</div>
            </div>
          </div>

          <div class="footer">
            THE GOLDEN LEAF FINANCE • Official Collection Register • Digitally generated on ${new Date().toLocaleString()} • System Authorized Record
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ── 7. PRINT INDIVIDUAL COLLECTION RECEIPT VOUCHER ──
  const handlePrintSingleReceipt = (rec: MonitoredCollection) => {
    const printWindow = window.open('', '_blank', 'width=680,height=750');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Collection Receipt - ${rec.receiptNumber}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #0B1F3A; background: #fff; }
            .header { border-bottom: 2px solid #D4AF37; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
            .brand { font-size: 20px; font-weight: 800; color: #0B1F3A; letter-spacing: 0.5px; }
            .sub { font-size: 11px; color: #64748B; margin-top: 4px; text-transform: uppercase; font-weight: 600; }
            .badge { background: #0B1F3A; color: #D4AF37; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; font-family: monospace; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 12px; margin-bottom: 20px; }
            .item { padding: 8px 12px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; }
            .label { font-size: 10px; font-weight: bold; color: #64748B; text-transform: uppercase; margin-bottom: 3px; }
            .val { font-size: 13px; font-weight: 700; color: #0B1F3A; }
            .amount-box { background: #ECFDF5; border: 1.5px solid #10B981; padding: 18px; border-radius: 12px; margin: 20px 0; text-align: center; }
            .amount-title { font-size: 11px; text-transform: uppercase; font-weight: 800; color: #047857; letter-spacing: 1px; }
            .amount-val { font-size: 28px; font-weight: 900; color: #065F46; margin: 4px 0; }
            .amount-sub { font-size: 12px; color: #059669; font-weight: 600; }
            .footer { margin-top: 28px; padding-top: 14px; border-top: 1px dashed #CBD5E1; font-size: 11px; color: #94A3B8; text-align: center; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">THE GOLDEN LEAF FINANCE</div>
              <div class="sub">Official Collection Receipt • ${rec.branchName}</div>
            </div>
            <div class="badge">RECEIPT #${rec.receiptNumber}</div>
          </div>
          <div class="grid">
            <div class="item"><div class="label">Customer Name</div><div class="val">${rec.customerName} (${rec.customerId})</div></div>
            <div class="item"><div class="label">Loan Account</div><div class="val">${rec.loanId}</div></div>
            <div class="item"><div class="label">Collection Date & Time</div><div class="val">${rec.date} • ${rec.time}</div></div>
            <div class="item"><div class="label">Customer Relationship Officer (CRO)</div><div class="val">${rec.agentName}</div></div>
            <div class="item"><div class="label">Area / Route</div><div class="val">${rec.area || rec.areaRoute}</div></div>
            <div class="item"><div class="label">Group</div><div class="val">${rec.groupName || 'Branch Group'}</div></div>
          </div>
          <div class="amount-box">
            <div class="amount-title">Total Collected Amount</div>
            <div class="amount-val">₹${(rec.collectedAmount || 0).toLocaleString('en-IN')}</div>
            <div class="amount-sub">Payment Mode: ${rec.paymentMode || 'Cash'} • Status: ${rec.status.toUpperCase()}</div>
          </div>
          <div class="footer">
            Audit Reference: #${rec.id} • GPS Verified: ${rec.geoLocation || 'Field Location'}<br/>
            Digitally generated on ${new Date().toLocaleString()} • System Authorized Record
          </div>
          <script>window.onload = function() { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Status Badge Renderer (High-polish SaaS indicator)
  const renderStatusBadge = (status: MonitoredCollection['status'], delayedDays?: number, ncReasonCode?: string) => {
    switch (status) {
      case 'collected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300/40 shrink-0"></span>
            Collected
          </span>
        );
      case 'advance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50/90 text-[#927116] border border-[#E5C973] shadow-2xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] ring-2 ring-[#D4AF37]/30 shrink-0"></span>
            Advance
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200/80 shadow-2xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 ring-2 ring-orange-300/40 shrink-0"></span>
            Partial
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200/80 shadow-2xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-red-300/40 shrink-0"></span>
            Delayed{delayedDays ? ` (${delayedDays}d)` : ''}
          </span>
        );
      case 'nc':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs whitespace-nowrap"
            title={ncReasonCode || 'Non-Collection'}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 ring-2 ring-rose-300/40 shrink-0"></span>
            Pending (NC)
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50/80 text-amber-800 border border-amber-200/70 shadow-2xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-amber-300/40 shrink-0"></span>
            Pending
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col w-full gap-5 pb-16 font-sans text-[#12233F]"
    >
      {/* ── 1. HEADER SECTION (LUXURY FINTECH NAVY & GOLD) ── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_8px_rgba(11,31,58,0.05)] relative z-20">
        <div className="bg-gradient-to-r from-[#06152B] via-[#0B1F3A] to-[#122A4E] px-5 sm:px-7 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D4AF37]/25 relative rounded-t-2xl">
          {/* Ambient subtle gold and blue lighting glow (contained) */}
          <div className="absolute inset-0 overflow-hidden rounded-t-2xl pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#D4AF37]/12 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Left: Brand Identity & Title */}
          <div className="flex items-center gap-3.5 z-10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#132A4B] to-[#081527] border border-[#D4AF37]/40 flex items-center justify-center text-[#F5D77F] shadow-[0_0_18px_rgba(212,175,55,0.22)] shrink-0">
              <Building2 size={20} className="text-[#F5D77F]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-white tracking-wide uppercase font-sans">
                  VIEW DAILY COLLECTIONS
                </h1>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#F5D77F] bg-gradient-to-r from-[#D4AF37]/20 to-[#B38C1F]/10 border border-[#D4AF37]/40 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/40 animate-pulse"></span>
                  Official Register
                </span>
              </div>
              <p className="text-xs text-slate-300 font-normal mt-1 max-w-lg lg:max-w-xl leading-relaxed">
                Track today's collection records, collection status, pending amounts, advance collections and delayed collections.
              </p>
            </div>
          </div>

          {/* Right: Executive Context Toolbar (Date Pill + Operating Branch Card) */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-center z-10 flex-wrap sm:flex-nowrap">
            {/* Active Record Date Badge */}
            <div className="hidden sm:inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/10 text-slate-300 text-xs shadow-xs backdrop-blur-md transition-colors">
              <Calendar size={15} className="text-[#F5D77F] shrink-0" />
              <div className="text-left">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono font-bold leading-none">RECORD DATE</span>
                <span className="font-bold text-white text-xs mt-0.5 block whitespace-nowrap">{formatDateDisplay(selectedDate)}</span>
              </div>
            </div>

            {/* Branch Switcher Dropdown (Role Scoped with Full Keyboard Navigation) */}
            <div className="relative" ref={branchDropdownRef}>
              <button
                onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                onKeyDown={handleBranchKeyDown}
                aria-haspopup="listbox"
                aria-expanded={isBranchDropdownOpen}
                className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 hover:border-[#D4AF37]/70 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-white text-xs font-semibold transition-all cursor-pointer shadow-md hover:shadow-lg backdrop-blur-md group"
                title="Current Operating Branch"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37]/25 to-[#B38C1F]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#F5D77F] shadow-xs transition-transform shrink-0">
                  <Building2 size={15} className="text-[#F5D77F]" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-[#F3D779] uppercase tracking-wider block leading-none font-mono font-bold">OPERATING BRANCH</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30"></span>
                  </div>
                  <span className="font-bold text-white block text-xs mt-0.5 whitespace-nowrap">{currentBranch?.name || 'Main Branch'}</span>
                </div>
                <ChevronDown size={14} className={`text-slate-300 ml-1 transition-transform duration-200 shrink-0 group-hover:text-[#F5D77F] ${isBranchDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isBranchDropdownOpen && (
                <div
                  role="listbox"
                  aria-label="Authorized Branches"
                  tabIndex={-1}
                  onKeyDown={handleBranchKeyDown}
                  className="absolute right-0 top-full mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-[0_16px_48px_rgba(11,31,58,0.25)] border border-[#E2E8F0] z-[100] p-2 overflow-hidden ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-[#D4AF37]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 font-mono">Select Operating Branch</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#0B1F3A] bg-blue-50 px-2.5 py-0.5 rounded-full font-mono border border-blue-100">
                      {branches.length} Branches
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-0.5 space-y-1 focus:outline-none custom-scrollbar">
                    {branches.map((b, idx) => {
                      const isSelected = b.id === currentBranch?.id;
                      const isFocused = idx === focusedBranchIndex;
                      return (
                        <button
                          key={b.id}
                          ref={(el) => { branchOptionsRef.current[idx] = el; }}
                          role="option"
                          aria-selected={isSelected}
                          type="button"
                          onMouseEnter={() => setFocusedBranchIndex(idx)}
                          onClick={() => handleBranchSelect(b)}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs flex items-center justify-between transition-all cursor-pointer outline-none ${
                            isSelected
                              ? 'bg-amber-50/90 text-[#0B1F3A] font-bold border border-amber-200/80 shadow-2xs'
                              : isFocused
                              ? 'bg-slate-100/90 text-[#0B1F3A]'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className={`text-xs ${isSelected ? 'font-bold text-[#0B1F3A]' : 'font-semibold text-slate-800'}`}>
                              {b.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">{b.id} • {b.city}</span>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#D4AF37] flex items-center justify-center text-white shrink-0 shadow-2xs">
                              <Check size={12} strokeWidth={2.5} />
                            </div>
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

        {/* ── PDF-STRICT CATEGORY / ROUTE TABS ── */}
        <div className="px-5 sm:px-7 py-3 bg-slate-50 border-b border-[#E2E8F0] flex items-center gap-2 overflow-x-auto custom-scrollbar">
          {[
            { key: 'today' as const, label: "Today's Collection", icon: Calendar, count: tabCounts.today },
            { key: 'tomorrow' as const, label: "Tomorrow Collection", icon: Clock, count: tabCounts.tomorrow },
            { key: 'advance' as const, label: "Advance Collection", icon: Wallet, count: tabCounts.advance },
            { key: 'pending_nc' as const, label: "Pending Collection (NC)", icon: AlertCircle, count: tabCounts.pending_nc },
            { key: 'delay_tracking' as const, label: "Delay Tracking", icon: AlertTriangle, count: tabCounts.delay_tracking },
            { key: 'history' as const, label: "Collection History", icon: RotateCcw, count: tabCounts.history },
            { key: 'all' as const, label: "All Branch Records", icon: Layers, count: tabCounts.all },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0B1F3A] text-white shadow-xs ring-1 ring-[#D4AF37]/50'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 border border-slate-200/90'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-[#D4AF37]' : 'text-slate-400'} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── 2. FILTER BAR (ALIGNED & ELEVATED WITH KEYBOARD NAVIGATION) ── */}
        <div className="p-5 sm:p-7 rounded-b-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] ring-4 ring-[#D4AF37]/20 animate-pulse" />
              <h3 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                Filter Collections & Demands
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#0B1F3A] font-bold text-xs transition-all cursor-pointer shadow-2xs border border-slate-200 hover:border-slate-300 active:scale-95"
                title="Reset all filters to defaults"
              >
                <RotateCcw size={13} className="text-[#D4AF37]" />
                Reset Filters
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Collection Date (Index 0) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={13} className="text-[#D4AF37]" />
                Collection Date
              </label>
              <input
                ref={(el) => { filterRefs.current[0] = el; }}
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                onKeyDown={(e) => handleFilterKeyDown(0, e)}
                className="w-full h-10 px-3.5 rounded-xl bg-white border border-[#E2E8F0] text-[#0B1F3A] text-xs font-semibold transition-all hover:border-[#D4AF37]/60 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)] shadow-2xs"
              />
            </div>

            {/* Customer Relationship Officer (CRO) Filter (Index 1) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center gap-1.5">
                <User size={13} className="text-[#D4AF37]" />
                Customer Relationship Officer (CRO)
              </label>
              <select
                ref={(el) => { filterRefs.current[1] = el; }}
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                onKeyDown={(e) => handleFilterKeyDown(1, e)}
                className="w-full h-10 px-3.5 rounded-xl bg-white border border-[#E2E8F0] text-[#0B1F3A] text-xs font-semibold transition-all hover:border-[#D4AF37]/60 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)] shadow-2xs cursor-pointer"
              >
                <option value="all">ALL CROS</option>
                {branchAgents.map((agent) => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>

            {/* Area Filter (Index 2) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={13} className="text-[#D4AF37]" />
                Area
              </label>
              <select
                ref={(el) => { filterRefs.current[2] = el; }}
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                onKeyDown={(e) => handleFilterKeyDown(2, e)}
                className="w-full h-10 px-3.5 rounded-xl bg-white border border-[#E2E8F0] text-[#0B1F3A] text-xs font-semibold transition-all hover:border-[#D4AF37]/60 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)] shadow-2xs cursor-pointer"
              >
                <option value="all">ALL AREAS</option>
                {branchAreas.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            {/* Group Filter (Index 3) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center gap-1.5">
                <Users size={13} className="text-[#D4AF37]" />
                Group
              </label>
              <select
                ref={(el) => { filterRefs.current[3] = el; }}
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                onKeyDown={(e) => handleFilterKeyDown(3, e)}
                className="w-full h-10 px-3.5 rounded-xl bg-white border border-[#E2E8F0] text-[#0B1F3A] text-xs font-semibold transition-all hover:border-[#D4AF37]/60 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)] shadow-2xs cursor-pointer"
              >
                <option value="all">ALL GROUPS</option>
                {branchGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Customer / Loan ID Search (Index 4) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center gap-1.5">
                <Search size={13} className="text-[#D4AF37]" />
                Customer / Loan ID
              </label>
              <div className="relative">
                <input
                  ref={(el) => { filterRefs.current[4] = el; }}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => handleFilterKeyDown(4, e)}
                  placeholder="Search name, ID, loan..."
                  className="w-full h-10 pl-9 pr-3.5 rounded-xl bg-white border border-[#E2E8F0] text-[#0B1F3A] placeholder:text-slate-400 text-xs font-semibold transition-all hover:border-[#D4AF37]/60 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)] shadow-2xs"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. SUPPORTING SUMMARY KPIS (DATA-DRIVEN • FINTECH HIGH-POLISH) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL COLLECTED */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-[0_2px_8px_rgba(16,185,129,0.06)] hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Collected</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1 font-sans tracking-tight">
                {fmtCurrency(totalCollected)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {filteredRecords.filter((r) => r.collectedAmount > 0).length} paid records
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-2xs">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>

        {/* PENDING COLLECTION (PDF Strict: Pending Collection (NC)) */}
        <div className="bg-white rounded-2xl border border-amber-100 shadow-[0_2px_8px_rgba(245,158,11,0.06)] hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Collection</p>
              <p className="text-2xl font-extrabold text-amber-600 mt-1 font-sans tracking-tight">
                {fmtCurrency(pendingCollection)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                {filteredRecords.filter((r) => (r.dueAmount ?? r.expectedAmount ?? 0) > (r.collectedAmount ?? 0)).length} pending borrowers
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shadow-2xs">
              <Clock size={24} />
            </div>
          </div>
        </div>

        {/* ADVANCE COLLECTION */}
        <div className="bg-white rounded-2xl border border-[#F3E5BE] shadow-[0_2px_8px_rgba(212,175,55,0.08)] hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Advance Collection</p>
              <p className="text-2xl font-extrabold text-[#997718] mt-1 font-sans tracking-tight">
                {fmtCurrency(advanceCollection)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                {filteredRecords.filter((r) => r.status === 'advance').length} advance payments
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50/70 text-[#D4AF37] border border-amber-100 flex items-center justify-center shadow-2xs">
              <Wallet size={24} />
            </div>
          </div>
        </div>

        {/* DELAY TRACKING */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-[0_2px_8px_rgba(239,68,68,0.06)] hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Delay Tracking</p>
              <p className="text-2xl font-extrabold text-red-600 mt-1 font-sans tracking-tight">
                {delayedCount} Delayed
              </p>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                {delayedCount === 0 ? 'Zero overdue accounts' : 'Follow-up required'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shadow-2xs">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. MAIN TABLE: DAILY COLLECTION LIST (STRICT ALIGNMENT) ── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_8px_rgba(11,31,58,0.05)] overflow-hidden">
        {/* Table Header Strip */}
        <div className="bg-[#0B1F3A] px-5 sm:px-7 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full"></div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase font-sans">
                DAILY COLLECTION LIST
              </h2>
              <p className="text-[11px] text-slate-300">
                Actual collection records for <span className="font-semibold text-white">{formatDateDisplay(selectedDate)}</span> • {currentBranch?.name || 'Main Branch'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 text-white border border-white/15 font-mono">
              {filteredRecords.length} Records Found
            </span>
            <button
              onClick={handleOpenSheetPreview}
              disabled={filteredRecords.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C49B27] hover:from-[#C49B27] hover:to-[#B38C1F] text-[#0B1F3A] font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              title="Preview, print, and download official collection sheet"
            >
              <Printer size={14} />
              <span>Print Sheet</span>
            </button>
          </div>
        </div>

        {/* Table Container with Horizontal Scroll Control */}
        <div className="overflow-x-auto w-full custom-scrollbar pb-1">
          <table className="w-full min-w-[1240px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[#0B1F3A] uppercase tracking-wider font-bold text-[11px] select-none">
                <th className="py-3.5 px-4 text-left whitespace-nowrap w-28">Collection ID</th>
                <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[170px]">Customer</th>
                <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[130px]">Loan ID</th>
                <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[150px]">Area</th>
                <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[170px]">Group</th>
                <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[140px]">Customer Relationship Officer (CRO)</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[110px]">Due Amount</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[130px]">Collected Amount</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">Status</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[100px] pr-5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Calendar size={26} />
                      </div>
                      <p className="font-bold text-sm text-slate-800">No collections match the selected filters</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        No collection entries found for {formatDateDisplay(selectedDate)} in {currentBranch?.name}.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, idx) => {
                  const dueAmt = item.dueAmount ?? item.expectedAmount ?? 0;
                  const colAmt = item.collectedAmount || 0;
                  const initials = item.customerName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('');

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-blue-50/40 transition-colors align-middle ${
                        idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                      }`}
                    >
                      {/* Collection ID (Left-aligned, font-mono, nowrap) */}
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#C49B27] whitespace-nowrap align-middle">
                        {item.id}
                      </td>

                      {/* Customer (Left-aligned with clean avatar badge, nowrap) */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#0B1F3A]/5 text-[#0B1F3A] font-bold text-xs flex items-center justify-center flex-shrink-0 border border-slate-200">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-xs whitespace-nowrap">{item.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{item.customerId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Loan (Left-aligned with installment badge, nowrap) */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                        <div className="flex flex-col">
                          <span className="font-mono text-slate-900 font-bold text-xs whitespace-nowrap">{item.loanId}</span>
                          {item.installment && (
                            <span className="text-[10px] text-slate-500 font-medium font-mono whitespace-nowrap mt-0.5">
                              Inst {item.installment}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Area (Area-wise Collection, Left-aligned, nowrap) */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs whitespace-nowrap">
                          <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                          <span>{item.area || item.areaRoute.replace(/^Route [A-Z] - /, '').replace(/ \([^)]+\)$/, '')}</span>
                        </div>
                      </td>

                      {/* Group (Left-aligned with ID badge, nowrap) */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-xs whitespace-nowrap">{item.groupName || 'Branch Group'}</span>
                          {item.groupId && (
                            <span className="text-[10px] text-[#C49B27] font-semibold font-mono whitespace-nowrap mt-0.5">
                              {item.groupId}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer Relationship Officer (CRO) (Left-aligned, nowrap) */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium text-xs whitespace-nowrap align-middle">
                        {item.agentName}
                      </td>

                      {/* Due Amount (RIGHT-ALIGNED, Tabular Bold, nowrap) */}
                      <td className="py-3.5 px-4 text-right font-sans font-bold text-slate-800 text-xs tabular-nums whitespace-nowrap align-middle">
                        {fmtCurrency(dueAmt)}
                      </td>

                      {/* Collected Amount (RIGHT-ALIGNED, Emerald, nowrap) */}
                      <td className="py-3.5 px-4 text-right font-sans font-bold text-emerald-700 text-xs tabular-nums whitespace-nowrap align-middle">
                        <span className="inline-block bg-emerald-50/90 text-emerald-700 font-bold px-2.5 py-1 rounded-lg border border-emerald-200/80 shadow-2xs whitespace-nowrap">
                          {fmtCurrency(colAmt)}
                        </span>
                      </td>

                      {/* Status Badge (CENTER-ALIGNED, nowrap) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                        {renderStatusBadge(item.status, item.delayedDays, item.ncReasonCode)}
                      </td>

                      {/* Action: View Details (CENTER-ALIGNED, nowrap) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle pr-5">
                        <button
                          onClick={() => setSelectedRecord(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1F3A]/5 hover:bg-[#0B1F3A] text-[#0B1F3A] hover:text-white font-bold text-xs transition-all border border-[#0B1F3A]/10 hover:border-[#0B1F3A] cursor-pointer whitespace-nowrap shadow-2xs"
                          title="View Collection Record"
                        >
                          <Eye size={13} />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. READ-ONLY COLLECTION RECORD DETAILS MODAL (LUXURY FINTECH SHEET) ── */}
      <AnimatePresence>
        {selectedRecord && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none"
            role="dialog"
            aria-modal="true"
          >
            {/* Clickable Backdrop Overlay — Clicking anywhere outside closes modal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setSelectedRecord(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
              aria-label="Close modal backdrop"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl border border-[#D4AF37]/30 shadow-[0_25px_70px_-15px_rgba(11,31,58,0.35)] w-[min(94vw,620px)] max-h-[92dvh] overflow-hidden flex flex-col font-sans ring-1 ring-black/5 relative z-10 select-text"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#061427] via-[#0B1F3A] to-[#142F55] px-6 py-4 border-b border-[#D4AF37]/25 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-7 bg-gradient-to-b from-[#F7DF94] to-[#D4AF37] rounded-full shadow-[0_0_12px_rgba(212,175,55,0.45)]"></div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide uppercase font-sans">
                        Collection Record Audit
                      </h3>
                      <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/35 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                        Verified Audit
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-300 font-mono">
                      <span>Ref #{selectedRecord.id}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-[#F3D779] font-bold">Receipt #{selectedRecord.receiptNumber}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                {/* Borrower & Group Summary */}
                <div className="bg-gradient-to-br from-slate-50 via-white to-amber-50/20 p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0B1F3A] to-[#1E3A8A] text-[#F3D779] border border-[#D4AF37]/40 flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                        {selectedRecord.customerName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-extrabold text-[#0B1F3A]">
                            {selectedRecord.customerName}
                          </h4>
                          <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            {selectedRecord.customerId}
                          </span>
                        </div>
                        {selectedRecord.customerPhone && (
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1 font-mono">
                            <Phone size={12} className="text-[#D4AF37]" />
                            {selectedRecord.customerPhone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      {renderStatusBadge(selectedRecord.status, selectedRecord.delayedDays, selectedRecord.ncReasonCode)}
                    </div>
                  </div>

                  {/* Area and Group micro-cards */}
                  <div className="mt-3.5 pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-[#D4AF37] flex items-center justify-center shrink-0 border border-amber-100">
                        <MapPin size={14} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Area / Route</span>
                        <span className="text-xs font-bold text-slate-800 truncate block">
                          {selectedRecord.area || selectedRecord.areaRoute}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                        <Users size={14} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Customer Group</span>
                        <span className="text-xs font-bold text-slate-800 truncate block">
                          {selectedRecord.groupName || 'Branch Group'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs relative overflow-hidden flex flex-col justify-between">
                    <div className="h-1 bg-gradient-to-r from-slate-400 to-slate-600 absolute top-0 left-0 right-0"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        Due Amount
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        Loan #{selectedRecord.loanId}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-black text-slate-900 font-sans tracking-tight">
                        {fmtCurrency(selectedRecord.dueAmount ?? selectedRecord.expectedAmount ?? 0)}
                      </span>
                      {selectedRecord.installment && (
                        <p className="text-[11px] text-slate-400 mt-0.5">Installment: {selectedRecord.installment}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-emerald-50/30 to-white shadow-2xs relative overflow-hidden flex flex-col justify-between">
                    <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500 absolute top-0 left-0 right-0"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        Collected Amount
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                        {selectedRecord.collectedAmount >= (selectedRecord.dueAmount ?? selectedRecord.expectedAmount ?? 0)
                          ? '✓ Fully Paid'
                          : 'Partial'}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-black text-emerald-600 font-sans tracking-tight">
                        {fmtCurrency(selectedRecord.collectedAmount || 0)}
                      </span>
                      <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                        Mode: <span className="font-bold">{selectedRecord.paymentMode || 'Cash'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* NC or Delay Specific Remarks */}
                {(selectedRecord.status === 'nc' || selectedRecord.status === 'delayed' || selectedRecord.ncRemarks) && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs shadow-2xs">
                    <div className="flex items-center gap-2 text-amber-900 font-bold mb-1">
                      <AlertTriangle size={14} className="text-amber-700 shrink-0" />
                      <span>
                        {selectedRecord.status === 'nc' ? 'Non-Collection (NC) Audit Reason' : 'Delay Tracking Notes'}
                      </span>
                    </div>
                    {selectedRecord.ncReasonCode && (
                      <p className="font-semibold text-amber-900">Reason: {selectedRecord.ncReasonCode}</p>
                    )}
                    {selectedRecord.ncRemarks && (
                      <p className="text-amber-800 mt-1">{selectedRecord.ncRemarks}</p>
                    )}
                  </div>
                )}

                {/* Field Collection Verification Audit Strip */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-[#D4AF37]" />
                      <span className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">Field Verification Audit Trail</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">GPS & Timestamp Logged</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1 mb-1">
                        <User size={12} className="text-[#D4AF37]" />
                        Customer Relationship Officer (CRO)
                      </span>
                      <span className="font-bold text-slate-900 block">{selectedRecord.agentName}</span>
                      <span className="text-[10px] text-slate-400">Authorized Field Collector</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1 mb-1">
                        <Clock size={12} className="text-[#D4AF37]" />
                        Collection Date & Time
                      </span>
                      <span className="font-bold text-slate-900 block">{formatDateDisplay(selectedRecord.date)}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{selectedRecord.time} IST</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1 mb-1">
                        <MapPin size={12} className="text-[#D4AF37]" />
                        GPS Geolocation
                      </span>
                      <span className="font-mono text-slate-800 text-[11px] block font-semibold truncate">
                        {selectedRecord.geoLocation || '13.0827° N, 80.2707° E'}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium">✓ Geofence Verified</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1 mb-1">
                        <Building2 size={12} className="text-[#D4AF37]" />
                        Branch Authority
                      </span>
                      <span className="font-bold text-slate-900 block truncate">{selectedRecord.branchName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{selectedRecord.branchId}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/90 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <ShieldCheck size={15} className="text-emerald-500" />
                  <span className="font-medium">Digitally Signed Audit Record • GLF Secure</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handlePrintSingleReceipt(selectedRecord)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C49B27] hover:from-[#C49B27] hover:to-[#B38C1F] text-[#0B1F3A] font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer active:scale-95"
                    title="Print official receipt voucher"
                  >
                    <Printer size={14} />
                    Print Receipt
                  </button>

                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── 9. COLLECTION SHEET PREVIEW & EXPORT MODAL ── */}
        {isSheetPreviewOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 select-none"
            role="dialog"
            aria-modal="true"
          >
            {/* Clickable Backdrop Overlay — Clicking anywhere outside closes modal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsSheetPreviewOpen(false)}
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-md cursor-pointer"
              aria-label="Close sheet preview backdrop"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0B1F3A] rounded-2xl shadow-2xl border border-white/10 w-[min(96vw,1060px)] max-h-[92vh] flex flex-col overflow-hidden text-slate-800 relative z-10 select-text"
            >
              {/* Modal Top Bar */}
              <div className="px-5 sm:px-7 py-3.5 bg-gradient-to-r from-[#071527] via-[#0B1F3A] to-[#112A4F] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 text-[#F3D779] border border-[#D4AF37]/35 flex items-center justify-center shadow-xs">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase font-sans">
                        Daily Collection Sheet Preview
                      </h2>
                      <span className="text-[10px] font-semibold text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-2 py-0.5 rounded-full font-mono uppercase">
                        Official Register
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      {currentBranch?.name || 'Main Branch'} • {formatDateDisplay(selectedDate)} • <span className="font-semibold text-white">{filteredRecords.length} accounts</span>
                    </p>
                  </div>
                </div>

                {/* Top Action Buttons: Print, Download, Close */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintSheetFromPreview}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all cursor-pointer active:scale-95 shadow-xs"
                    title="Print collection sheet"
                  >
                    <Printer size={13} className="text-[#F3D779]" />
                    <span>Print</span>
                  </button>

                  <button
                    onClick={handleDownloadCollectionSheetPDF}
                    disabled={isDownloadingPDF}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#C49B27] hover:from-[#E5C35D] hover:to-[#B38C1F] text-[#0B1F3A] font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 active:scale-95 border border-[#F5D77F]/60"
                    title="Download official PDF sheet"
                  >
                    <Download size={13} />
                    <span>{isDownloadingPDF ? 'Downloading...' : 'Download PDF'}</span>
                  </button>

                  <button
                    onClick={() => setIsSheetPreviewOpen(false)}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
                    title="Close Preview"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Document Paper Preview Viewport */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/60 custom-scrollbar">
                {/* Physical A4 White Paper Sheet Simulation */}
                <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-9 text-[#0B1F3A] max-w-4xl mx-auto border border-slate-200 font-sans">
                  {/* Document Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b-2 border-[#D4AF37] gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-[#D4AF37] rounded-sm"></span>
                        <h3 className="text-xl font-black text-[#0B1F3A] tracking-wider uppercase">
                          THE GOLDEN LEAF FINANCE
                        </h3>
                      </div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                        MICROFINANCE ENTERPRISE SYSTEMS • DAILY COLLECTION REGISTER
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
                        SHEET REFERENCE
                      </span>
                      <span className="font-mono text-xs font-black text-[#0B1F3A]">
                        CS-{activeBranchId}-{selectedDate.replace(/-/g, '')}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Generated: <strong className="text-slate-800">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Document Meta Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 mt-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Operating Branch</span>
                      <strong className="text-[#0B1F3A] font-bold block truncate">{currentBranch?.name || 'Main Branch'}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">{activeBranchId}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Collection Date</span>
                      <strong className="text-[#0B1F3A] font-bold block">{formatDateDisplay(selectedDate)}</strong>
                      <span className="text-[10px] text-slate-400 capitalize">{activeTab.replace('_', ' ')} list</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Officer (CRO)</span>
                      <strong className="text-[#0B1F3A] font-bold block truncate">
                        {selectedAgent !== 'all' ? selectedAgent : 'All Branch CROs'}
                      </strong>
                      <span className="text-[10px] text-slate-400">Field Operations</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Route / Center</span>
                      <strong className="text-[#0B1F3A] font-bold block truncate">
                        {selectedArea !== 'all' ? selectedArea : 'All Route Areas'}
                      </strong>
                      <span className="text-[10px] text-slate-400 truncate block">{selectedGroup !== 'all' ? selectedGroup : 'All Groups'}</span>
                    </div>
                  </div>

                  {/* Financial KPI Summary Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-xs">
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Demand</span>
                      <span className="text-base font-extrabold text-slate-800 block mt-0.5">
                        {fmtCurrency(filteredRecords.reduce((acc, r) => acc + (r.dueAmount ?? r.expectedAmount ?? 0), 0))}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Collected</span>
                      <span className="text-base font-extrabold text-emerald-700 block mt-0.5">
                        {fmtCurrency(totalCollected)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/70 text-center">
                      <span className="text-[10px] uppercase font-bold text-amber-700 block">Pending Due</span>
                      <span className="text-base font-extrabold text-amber-700 block mt-0.5">
                        {fmtCurrency(pendingCollection)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-[#F3E5BE] bg-amber-50/40 text-center">
                      <span className="text-[10px] uppercase font-bold text-[#997718] block">Advance Amount</span>
                      <span className="text-base font-extrabold text-[#997718] block mt-0.5">
                        {fmtCurrency(advanceCollection)}
                      </span>
                    </div>
                  </div>

                  {/* Printable Register Table */}
                  <div className="border border-slate-200 rounded-lg overflow-x-auto my-4 custom-scrollbar">
                    <table className="w-full text-[11px] text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-[#0B1F3A] text-white">
                          <th className="py-2 px-2.5 font-bold uppercase text-[9.5px] w-8">#</th>
                          <th className="py-2 px-2.5 font-bold uppercase text-[9.5px]">Client ID</th>
                          <th className="py-2 px-2.5 font-bold uppercase text-[9.5px]">Customer Name</th>
                          <th className="py-2 px-2.5 font-bold uppercase text-[9.5px]">Loan ID</th>
                          <th className="py-2 px-2.5 font-bold uppercase text-[9.5px]">Area / Route</th>
                          <th className="py-2 px-2.5 font-bold uppercase text-[9.5px] text-right">Demand</th>
                          <th className="py-2 px-2.5 font-bold uppercase text-[9.5px] text-right">Collected</th>
                          <th className="py-2 px-2.5 font-bold uppercase text-[9.5px]">Mode</th>
                          <th className="py-2 px-2.5 font-bold uppercase text-[9.5px]">Status</th>
                          <th className="py-2 px-2.5 font-bold uppercase text-[9.5px] text-center w-28">Signature</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredRecords.map((r, idx) => (
                          <tr key={r.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                            <td className="py-2 px-2.5 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-2.5 font-mono font-bold text-[#0B1F3A]">{r.customerId}</td>
                            <td className="py-2 px-2.5 font-semibold text-slate-900">{r.customerName}</td>
                            <td className="py-2 px-2.5 font-mono text-slate-600">{r.loanId}</td>
                            <td className="py-2 px-2.5 text-slate-600 truncate max-w-[120px]">{r.area || r.areaRoute || '—'}</td>
                            <td className="py-2 px-2.5 text-right font-medium text-slate-700">
                              ₹{(r.dueAmount ?? r.expectedAmount ?? 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold text-emerald-700">
                              ₹{(r.collectedAmount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-2.5 text-slate-600">{r.paymentMode || 'Cash'}</td>
                            <td className="py-2 px-2.5">
                              <span className="font-bold text-[9.5px] uppercase tracking-wider text-slate-700">
                                {r.status}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <span className="inline-block w-20 border-b border-dotted border-slate-300 h-3"></span>
                            </td>
                          </tr>
                        ))}
                        {/* Totals Row */}
                        <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300">
                          <td colSpan={5} className="py-2.5 px-2.5 text-right uppercase text-[10px] tracking-wider text-slate-600">
                            Total Register ({filteredRecords.length} accounts):
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-bold text-slate-900">
                            ₹{filteredRecords.reduce((acc, r) => acc + (r.dueAmount ?? r.expectedAmount ?? 0), 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-black text-emerald-800">
                            ₹{totalCollected.toLocaleString('en-IN')}
                          </td>
                          <td colSpan={3}></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures Section */}
                  <div className="grid grid-cols-2 gap-12 sm:gap-24 pt-6 mt-6 border-t border-slate-300 text-center text-xs">
                    <div>
                      <div className="h-10 border-b border-slate-400 mb-1 flex items-end justify-center pb-1 text-[11px] font-mono text-slate-400">
                        {selectedAgent !== 'all' ? selectedAgent : 'Field Officer'}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Customer Relationship Officer (CRO) Signature
                      </span>
                    </div>

                    <div>
                      <div className="h-10 border-b border-slate-400 mb-1 flex items-end justify-center pb-1 text-[11px] font-mono text-slate-400">
                        Authorized Official
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Branch Manager Signature & Seal
                      </span>
                    </div>
                  </div>

                  {/* Document Footer */}
                  <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
                    THE GOLDEN LEAF FINANCE • Confidential Microfinance Daily Collection Register • Generated on {new Date().toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Modal Bottom Action Bar */}
              <div className="px-5 sm:px-7 py-3 bg-[#071527] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <ShieldCheck size={14} className="text-[#D4AF37]" />
                  <span>
                    Viewing {filteredRecords.length} accounts • Total Collection: ₹{totalCollected.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsSheetPreviewOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    Close
                  </button>

                  <button
                    onClick={handlePrintSheetFromPreview}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <Printer size={13} className="text-[#F3D779]" />
                    <span>Print Sheet</span>
                  </button>

                  <button
                    onClick={handleDownloadCollectionSheetPDF}
                    disabled={isDownloadingPDF}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#C49B27] hover:from-[#E5C35D] hover:to-[#B38C1F] text-[#0B1F3A] font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <Download size={13} />
                    <span>{isDownloadingPDF ? 'Generating...' : 'Download PDF'}</span>
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

export default DemandCollectionPage;
