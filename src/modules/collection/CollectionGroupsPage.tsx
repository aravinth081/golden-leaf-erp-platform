// ──────────────────────────────────────────────────
// GOLDEN LEAF FINANCE — COLLECTION GROUPS
// PDF-Strict Branch Manager Module:
// • Source of Truth: Branch Manager explicitly includes "Create Collection Groups"
// • Customer Management explicitly includes "Group Assignment"
// • Scoped strictly to authenticated Branch Context (branchId)
// • Dynamic Customer Count (derived from actual customer records)
// • Group Details with real assigned customer directory
// • Clean, production-ready SaaS layout: data-driven computations
// • Typography: Inter (UI/labels) & Manrope/tabular-nums (counts/IDs)
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  X,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import { getStoredBranches, type DetailedBranch } from '../../services/branchService';
import {
  getBranchCollectionGroups,
  addBranchCollectionGroup,
  generateNextGroupId,
  getMonitoredCustomers,
  type BranchCollectionGroup,
  type MonitoredCustomer,
} from '../../services/monitoringDataService';

export const CollectionGroupsPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const selectedBranchId = useUIStore((s) => s.selectedBranchId);
  const setSelectedBranchId = useUIStore((s) => s.setSelectedBranchId);
  const addToast = useUIStore((s) => s.addToast);

  // ── 1. AUTHENTICATED BRANCH CONTEXT & ISOLATION ──
  const [branches, setBranches] = useState<DetailedBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<DetailedBranch | null>(null);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isModalBranchDropdownOpen, setIsModalBranchDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<BranchCollectionGroup | null>(null);
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const modalBranchDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
      if (modalBranchDropdownRef.current && !modalBranchDropdownRef.current.contains(event.target as Node)) {
        setIsModalBranchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalBranchDropdownOpen) {
          setIsModalBranchDropdownOpen(false);
        } else if (isCreateModalOpen) {
          setIsCreateModalOpen(false);
        } else if (selectedGroupDetails) {
          setSelectedGroupDetails(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen, selectedGroupDetails, isModalBranchDropdownOpen]);

  useEffect(() => {
    const list = getStoredBranches();
    setBranches(list);

    const userBranchClaim = user?.customClaims?.branchId;
    let target: DetailedBranch | undefined;

    if (selectedBranchId) {
      target = list.find((b) => b.id === selectedBranchId || b.code === selectedBranchId);
    }
    if (!target && userBranchClaim) {
      target = list.find(
        (b) =>
          b.id.toLowerCase() === userBranchClaim.toLowerCase() ||
          b.code.toLowerCase() === userBranchClaim.toLowerCase() ||
          (userBranchClaim === 'b1' && (b.id === 'BR-01' || b.code === 'GL-BR-001'))
      );
    }
    if (!target && list.length > 0) {
      target = list[0];
    }
    if (target) {
      setCurrentBranch(target);
    }
  }, [user, selectedBranchId]);

  const activeBranchId = currentBranch?.id || 'BR-01';
  const currentBranchName = currentBranch?.name || 'Main Branch - Anna Nagar';

  const handleSelectBranch = (branch: DetailedBranch) => {
    setSelectedBranchId(branch.id);
    setCurrentBranch(branch);
    setIsBranchDropdownOpen(false);
    addToast({
      type: 'info',
      title: 'Branch Switched',
      message: `Viewing collection groups for ${branch.name} (${branch.id})`,
    });
  };

  // ── 2. DATA SOURCE: GROUPS & ASSIGNED CUSTOMERS ──
  const [groups, setGroups] = useState<BranchCollectionGroup[]>([]);
  const [allCustomers, setAllCustomers] = useState<MonitoredCustomer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = () => {
    try {
      setIsLoading(true);
      // Load groups scoped strictly to active branch
      const branchGroups = getBranchCollectionGroups(activeBranchId);
      setGroups(branchGroups);

      // Load all monitored master customers
      const custs = getMonitoredCustomers(null);
      setAllCustomers(custs);
    } catch (err) {
      console.error('Failed to load collection groups:', err);
      addToast({
        type: 'error',
        title: 'Data Load Error',
        message: 'Unable to load collection groups for this branch.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener('glf-collection-groups-updated', handleSync);
    window.addEventListener('glf-customers-updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('glf-collection-groups-updated', handleSync);
      window.removeEventListener('glf-customers-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [activeBranchId, currentBranchName]);

  // ── 3. REAL CUSTOMER-GROUP RELATIONSHIP HELPER ──
  // Calculate assigned customers strictly from relational records
  const getAssignedCustomers = (group: BranchCollectionGroup): MonitoredCustomer[] => {
    return allCustomers.filter(
      (c) =>
        (c.groupId === group.id || c.groupName?.trim().toLowerCase() === group.name.trim().toLowerCase()) &&
        (c.branchId === activeBranchId ||
          c.branchName === currentBranchName ||
          (activeBranchId === 'BR-01' && (c.branchId === 'b1' || c.branchName?.includes('Anna Nagar'))))
    );
  };

  // ── 4. SEARCH & FILTERING (STRICTLY ON ACTUAL RECORDS) ──
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.id.toLowerCase().includes(q)
    );
  }, [groups, searchQuery]);

  // ── 5. MODAL STATES ──
  const [modalBranchId, setModalBranchId] = useState<string>(activeBranchId);
  const [focusedModalBranchIndex, setFocusedModalBranchIndex] = useState<number>(0);

  const [groupIdInput, setGroupIdInput] = useState('');
  const [idError, setIdError] = useState('');
  const [groupNameInput, setGroupNameInput] = useState('');
  const [nameError, setNameError] = useState('');

  const selectedModalBranch =
    branches.find((b) => b.id === modalBranchId) || currentBranch || branches[0];

  // Keyboard navigation for modal branch dropdown
  const handleModalBranchKeyDown = (e: React.KeyboardEvent) => {
    if (!isModalBranchDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const curIdx = branches.findIndex((b) => b.id === modalBranchId);
        setFocusedModalBranchIndex(curIdx >= 0 ? curIdx : 0);
        setIsModalBranchDropdownOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedModalBranchIndex((prev) => (prev + 1) % branches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedModalBranchIndex((prev) => (prev - 1 + branches.length) % branches.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const chosen = branches[focusedModalBranchIndex];
      if (chosen) {
        handleSelectModalBranch(chosen);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsModalBranchDropdownOpen(false);
    }
  };

  const handleSelectModalBranch = (branch: DetailedBranch) => {
    setModalBranchId(branch.id);
    setIsModalBranchDropdownOpen(false);
    // If ID is empty or default GRP-xxx prefix, refresh suggested ID for this branch
    if (!groupIdInput || groupIdInput.startsWith('GRP-')) {
      setGroupIdInput(generateNextGroupId(branch.id));
    }
  };

  // ── 6. HANDLERS ──
  const handleOpenCreate = () => {
    setModalBranchId(activeBranchId);
    setIsModalBranchDropdownOpen(false);
    const initialId = generateNextGroupId(activeBranchId);
    setGroupIdInput(initialId);
    setIdError('');
    setGroupNameInput('');
    setNameError('');
    setIsCreateModalOpen(true);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = groupIdInput.trim().toUpperCase();
    const trimmedName = groupNameInput.trim();

    let hasError = false;

    if (!trimmedId) {
      setIdError('Group identifier is required.');
      hasError = true;
    } else {
      // Validate unique ID across all collection groups
      const allGroups = getBranchCollectionGroups(null);
      const duplicateId = allGroups.find(
        (g) => g.id.toLowerCase() === trimmedId.toLowerCase()
      );
      if (duplicateId) {
        setIdError(`Group ID "${trimmedId}" is already in use.`);
        hasError = true;
      }
    }

    if (!trimmedName) {
      setNameError('Collection group name is required.');
      hasError = true;
    } else {
      // Check duplicate name within the chosen branch
      const branchGroups = getBranchCollectionGroups(modalBranchId);
      const duplicateName = branchGroups.find(
        (g) => g.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicateName) {
        setNameError(`A collection group named "${trimmedName}" already exists in this branch.`);
        hasError = true;
      }
    }

    if (hasError) return;

    try {
      const targetBranch = branches.find((b) => b.id === modalBranchId) || currentBranch;
      const targetBranchName = targetBranch?.name || currentBranchName;

      const newGroup: BranchCollectionGroup = {
        id: trimmedId,
        name: trimmedName,
        branchId: modalBranchId,
        branchName: targetBranchName,
      };
      addBranchCollectionGroup(newGroup);
      addToast({
        type: 'success',
        title: 'Group Created',
        message: `Collection group "${trimmedName}" (${trimmedId}) created successfully.`,
      });
      if (modalBranchId !== activeBranchId) {
        setSelectedBranchId(modalBranchId);
      } else {
        loadData();
      }
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Failed to create collection group:', err);
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: 'Unable to create collection group. Please try again.',
      });
    }
  };

  return (
    <div className="space-y-6 font-sans antialiased text-[#0B1F3A] pb-12">
      {/* ── 1. CLEAN EXECUTIVE PAGE HEADER ── */}
      <div className="bg-[#0B1F3A] rounded-2xl p-6 sm:p-7 shadow-[0_4px_20px_rgba(11,31,58,0.12)] border border-[#0B1F3A]/60 flex flex-col md:flex-row md:items-center justify-between gap-5 text-white relative z-30">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-1.5 h-5 bg-[#D4AF37] rounded-full shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Collection Groups
            </h1>

            {/* Interactive Branch Switcher Dropdown */}
            <div className="relative inline-block" ref={branchDropdownRef}>
              <button
                type="button"
                onClick={() => setIsBranchDropdownOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-all cursor-pointer shadow-xs select-none ${
                  isBranchDropdownOpen
                    ? 'bg-white/20 text-white border border-[#D4AF37] ring-2 ring-[#D4AF37]/40'
                    : 'bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/30'
                }`}
                aria-haspopup="listbox"
                aria-expanded={isBranchDropdownOpen}
                aria-label="Switch Branch"
              >
                <Building2 size={12} className="text-[#D4AF37] shrink-0" />
                <span className="truncate max-w-[190px] sm:max-w-[260px]">
                  {currentBranchName} ({activeBranchId})
                </span>
                <ChevronDown
                  size={12}
                  className={`text-slate-300 shrink-0 transition-transform duration-200 ${
                    isBranchDropdownOpen ? 'rotate-180 text-[#D4AF37]' : ''
                  }`}
                />
              </button>

              {/* Floating Branch Selection Menu */}
              {isBranchDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-[#0B1F3A] border border-[#243E66] shadow-[0_16px_40px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-sans">
                  <div className="px-4 py-2 border-b border-white/[0.08] text-[10.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Select Branch</span>
                    <span className="text-[#D4AF37] text-[10px] font-semibold">{branches.length} Branches</span>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto no-scrollbar py-1 divide-y divide-white/[0.04]">
                    {branches.map((b) => {
                      const isSelected = b.id === activeBranchId;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => handleSelectBranch(b)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs transition-all cursor-pointer outline-none ${
                            isSelected
                              ? 'bg-[#D4AF37]/15 text-[#F5D061] font-bold'
                              : 'text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <div className="truncate font-bold text-xs flex items-center gap-1.5">
                              <span>{b.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[#D4AF37] font-semibold">{b.id}</span>
                              <span>•</span>
                              <span>{b.city}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <Check size={15} className="text-[#D4AF37] shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            Create and manage collection groups for customer group assignment.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-[#D4AF37] hover:bg-[#c49f2f] active:bg-[#b08d24] text-[#0B1F3A] font-bold text-xs sm:text-sm shadow-md transition-all duration-200 cursor-pointer shrink-0 w-full sm:w-auto"
          aria-label="Create Collection Group"
        >
          <Plus size={16} className="stroke-[3]" />
          <span>Create Collection Group</span>
        </button>
      </div>

      {/* ── 2. SEARCH BAR (STRICTLY CLEAN — UNSUPPORTED TOTAL GROUPS KPI REMOVED) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <div className="relative max-w-md w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collection group..."
            className="w-full h-[44px] pl-10 pr-4 text-xs bg-slate-50/90 border border-slate-200 rounded-xl focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:bg-white text-[#0B1F3A] font-sans placeholder:text-slate-400 transition-colors"
            aria-label="Search collection group"
          />
        </div>
      </div>

      {/* ── 3. GROUP DIRECTORY GRID (3 cols desktop, 2 cols tablet, 1 col mobile) ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 rounded w-16" />
                <div className="h-4 bg-slate-200 rounded w-28" />
              </div>
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="h-12 bg-slate-100 rounded-xl" />
              <div className="h-4 bg-slate-200 rounded w-24 pt-2" />
            </div>
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Users size={28} />
          </div>
          <h3 className="text-base font-bold text-[#0B1F3A] mb-1">
            {searchQuery ? 'No collection groups match your search.' : 'No collection groups found.'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            {searchQuery
              ? `No collection group matching "${searchQuery}" was found in this branch.`
              : 'Create collection groups to assign customers enrolled under this branch.'}
          </p>
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#0B1F3A] bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Clear Search Filter
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2f] text-[#0B1F3A] font-bold text-xs transition-colors cursor-pointer"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>Create Collection Group</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {filteredGroups.map((group) => {
            const assignedCustomers = getAssignedCustomers(group);
            const customerCount = assignedCustomers.length;

            return (
              <div
                key={group.id}
                onClick={() => setSelectedGroupDetails(group)}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-md transition-colors duration-200 flex flex-col justify-between overflow-hidden cursor-pointer group p-5 sm:p-6 relative"
              >
                {/* Subtle top royal blue glow line on hover */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Content Section */}
                <div className="space-y-3.5">
                  {/* Top Row: Group Icon + ID on left, Branch Badge on right */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100/80 text-blue-600 flex items-center justify-center font-bold text-xs shadow-2xs group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300 shrink-0">
                        <Users size={16} />
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 group-hover:bg-blue-50 text-[#0B1F3A] group-hover:text-blue-700 text-xs font-bold font-mono tracking-wider border border-slate-200/70 group-hover:border-blue-200 transition-colors truncate">
                        {group.id}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/70 text-[11px] font-medium text-slate-500 truncate max-w-[50%]">
                      <Building2 size={11} className="text-[#D4AF37] shrink-0" />
                      <span className="truncate">{group.branchName || currentBranchName}</span>
                    </span>
                  </div>

                  {/* Group Name & Status Tag */}
                  <div className="pt-1">
                    <h3 className="text-base sm:text-[17px] font-bold text-[#0B1F3A] group-hover:text-blue-600 transition-colors leading-snug tracking-tight line-clamp-1">
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                          customerCount > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : 'bg-slate-100 text-slate-500 border border-slate-200/70'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            customerCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        {customerCount > 0 ? `${customerCount} Assigned` : 'No Members Yet'}
                      </span>
                    </div>
                  </div>

                  {/* Customer Metric Capsule Tile */}
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50/20 group-hover:from-blue-50/50 group-hover:to-indigo-50/30 rounded-xl p-3 sm:p-3.5 border border-slate-100 group-hover:border-blue-200/80 transition-all flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                        CUSTOMERS
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
                        {customerCount === 1 ? '1 Customer Enrolled' : `${customerCount} Customers Enrolled`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl font-black text-[#0B1F3A] group-hover:text-blue-600 font-mono tabular-nums transition-colors">
                        {customerCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Action Button */}
                <div className="mt-4 pt-3.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGroupDetails(group);
                    }}
                    className="w-full h-[40px] px-3.5 sm:px-4 rounded-xl bg-slate-50 group-hover:bg-blue-600 border border-slate-200/80 group-hover:border-blue-600 text-[#0B1F3A] group-hover:text-white font-bold text-xs flex items-center justify-between shadow-2xs group-hover:shadow-md transition-all duration-200 cursor-pointer"
                    aria-label={`View details for ${group.name}`}
                  >
                    <span>View Group Details</span>
                    <div className="w-6 h-6 rounded-lg bg-white/80 group-hover:bg-white/20 flex items-center justify-center text-slate-500 group-hover:text-white transition-colors shrink-0">
                      <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 4. CREATE COLLECTION GROUP MODAL (PDF-STRICT: NO UNNECESSARY FIELDS) ── */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsCreateModalOpen(false);
              }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0B1F3A]/60 backdrop-blur-xs cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 w-[min(94vw,500px)] overflow-hidden shadow-2xl relative font-sans flex flex-col !m-0 cursor-default"
            >
              {/* Modal Header */}
              <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex items-center justify-between text-white border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Create Collection Group
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateGroup} className="p-5 sm:p-6 space-y-4">
                {/* 1. Branch Context Dropdown (All branches, with keyboard arrow navigation) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Authorized Branch Context
                  </label>
                  <div className="relative" ref={modalBranchDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsModalBranchDropdownOpen((prev) => !prev)}
                      onKeyDown={handleModalBranchKeyDown}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold text-[#0B1F3A] flex items-center justify-between gap-2 transition-all cursor-pointer outline-none ${
                        isModalBranchDropdownOpen
                          ? 'bg-white border-blue-600 ring-2 ring-blue-500/20'
                          : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                      }`}
                      aria-haspopup="listbox"
                      aria-expanded={isModalBranchDropdownOpen}
                      aria-label="Select Branch"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Building2 size={14} className="text-[#D4AF37] shrink-0" />
                        <span className="truncate">
                          {selectedModalBranch?.name} ({selectedModalBranch?.id})
                        </span>
                      </div>
                      <ChevronDown
                        size={14}
                        className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                          isModalBranchDropdownOpen ? 'rotate-180 text-blue-600' : ''
                        }`}
                      />
                    </button>

                    {/* Floating Dropdown List with Keyboard Navigation */}
                    {isModalBranchDropdownOpen && (
                      <div
                        role="listbox"
                        className="absolute left-0 right-0 top-full mt-1.5 bg-[#0B1F3A] border border-[#243E66] shadow-[0_16px_40px_rgba(0,0,0,0.55)] rounded-2xl overflow-hidden py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 font-sans"
                      >
                        <div className="px-3.5 py-2 border-b border-white/[0.08] text-[10.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Select Branch (Use ↑/↓ Keys)</span>
                          <span className="text-[#D4AF37] text-[10px] font-semibold">{branches.length} Branches</span>
                        </div>
                        <div className="max-h-[220px] overflow-y-auto no-scrollbar py-1 divide-y divide-white/[0.04]">
                          {branches.map((b, idx) => {
                            const isSelected = b.id === modalBranchId;
                            const isFocused = idx === focusedModalBranchIndex;
                            return (
                              <button
                                key={b.id}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onMouseEnter={() => setFocusedModalBranchIndex(idx)}
                                onClick={() => handleSelectModalBranch(b)}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition-all cursor-pointer outline-none ${
                                  isFocused
                                    ? 'bg-white/[0.15] ring-1 ring-inset ring-[#D4AF37]'
                                    : isSelected
                                    ? 'bg-[#D4AF37]/15'
                                    : 'hover:bg-white/[0.08]'
                                } ${isSelected ? 'text-[#F5D061] font-bold' : 'text-white'}`}
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <div className="truncate font-bold text-xs flex items-center gap-1.5">
                                    <span>{b.name}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono text-[#D4AF37] font-semibold">{b.id}</span>
                                    <span>•</span>
                                    <span>{b.city}</span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check size={14} className="text-[#D4AF37] shrink-0 ml-1" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Select target branch using mouse or keyboard (Up/Down arrow keys & Enter).
                  </p>
                </div>

                {/* 2. Group Identifier (Manually editable input) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Group Identifier <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={groupIdInput}
                    onChange={(e) => {
                      setGroupIdInput(e.target.value);
                      if (idError) setIdError('');
                    }}
                    placeholder="e.g. GRP-010"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border ${
                      idError ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200'
                    } text-xs font-mono font-bold text-[#0B1F3A] placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all`}
                  />
                  {idError ? (
                    <p className="text-[11px] font-medium text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      <span>{idError}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Unique group identifier (prefilled or enter custom ID).
                    </p>
                  )}
                </div>

                {/* 3. Group Name Input (Manually editable input) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Collection Group Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={groupNameInput}
                    onChange={(e) => {
                      setGroupNameInput(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    placeholder="e.g. Malar Magalir Sangam"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border ${
                      nameError ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200'
                    } text-xs font-semibold text-[#0B1F3A] placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all`}
                  />
                  {nameError && (
                    <p className="text-[11px] font-medium text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      <span>{nameError}</span>
                    </p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="submit"
                    className="flex-1 h-[44px] rounded-xl bg-[#D4AF37] hover:bg-[#c49f2f] active:bg-[#b08d24] text-[#0B1F3A] font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                  >
                    Create Group
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-5 h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 5. GROUP DETAILS MODAL (STRICTLY REAL DATA: NO INVENTED METRICS) ── */}
      <AnimatePresence>
        {selectedGroupDetails && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedGroupDetails(null);
              }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0B1F3A]/60 backdrop-blur-xs cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 w-[min(94vw,680px)] max-h-[85vh] overflow-hidden shadow-2xl relative font-sans flex flex-col !m-0 cursor-default"
            >
              {/* Header */}
              <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex items-center justify-between text-white border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {selectedGroupDetails.name}
                    </h3>
                    <p className="text-[11px] text-slate-300 font-mono">
                      ID: {selectedGroupDetails.id} • {selectedGroupDetails.branchName || currentBranchName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedGroupDetails(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close details"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
                {/* Real Data Context Strip */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Total Assigned Customers
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-[#0B1F3A] font-mono tabular-nums">
                      {getAssignedCustomers(selectedGroupDetails).length} Customers
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Branch
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-[#0B1F3A] truncate block mt-1">
                      {selectedGroupDetails.branchName || currentBranchName}
                    </span>
                  </div>
                </div>

                {/* Assigned Customers List (Real Customer Management Dataset) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Assigned Customers ({getAssignedCustomers(selectedGroupDetails).length})
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Assigned via Customer Management
                    </span>
                  </div>

                  {getAssignedCustomers(selectedGroupDetails).length === 0 ? (
                    <div className="text-center py-8 px-4 bg-slate-50/80 rounded-xl border border-dashed border-slate-200">
                      <Users size={24} className="text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-600 mb-0.5">
                        No customers assigned to this group yet.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Assign customers to this group under Customer Management → Group Assignment.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse min-w-[480px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                            <th className="py-2.5 px-3.5">Customer ID</th>
                            <th className="py-2.5 px-3.5">Name</th>
                            <th className="py-2.5 px-3.5">Contact</th>
                            <th className="py-2.5 px-3.5">KYC</th>
                            <th className="py-2.5 px-3.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {getAssignedCustomers(selectedGroupDetails).map((cust) => (
                            <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-2.5 px-3.5 font-mono font-bold text-slate-700">
                                {cust.id}
                              </td>
                              <td className="py-2.5 px-3.5 font-semibold text-[#0B1F3A]">
                                {cust.name}
                              </td>
                              <td className="py-2.5 px-3.5 font-mono text-slate-600">
                                {cust.phone}
                              </td>
                              <td className="py-2.5 px-3.5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    cust.kycStatus === 'Verified'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {cust.kycStatus === 'Verified' ? (
                                    <CheckCircle2 size={10} />
                                  ) : (
                                    <Clock size={10} />
                                  )}
                                  {cust.kycStatus}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-medium">
                                <span
                                  className={`text-[11px] font-bold ${
                                    cust.status === 'Active' ? 'text-emerald-600' : 'text-slate-400'
                                  }`}
                                >
                                  {cust.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer (No unsupported actions) */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedGroupDetails(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollectionGroupsPage;
