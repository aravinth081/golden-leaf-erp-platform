// ──────────────────────────────────────────────────
// Golden Leaf Finance — Branch Management Module (Admin)
// Strict PDF Specification + Real Functionality + Branch Context Switching
// • Add Branch
// • Edit Branch
// • Disable / Enable Branch (Disable ≠ Delete)
// • Branch Dashboard & Branch Context Filtering
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, Edit2, Ban, CheckCircle2,
  LayoutDashboard, X, AlertTriangle, ChevronDown, Filter,
  Search, MapPin, Phone, Mail, User, RotateCcw
} from 'lucide-react';
import {
  getStoredBranches, createNewBranch, updateExistingBranch,
  toggleBranchStatus, type DetailedBranch
} from '../../services/branchService';
import { useUIStore } from '../../store';
import { PageHeader } from '../../components/ui';

const getAvailableManagers = (): string[] => {
  try {
    const staffMaster = localStorage.getItem('glf_staff_profiles_master');
    if (staffMaster) {
      const list = JSON.parse(staffMaster);
      if (Array.isArray(list) && list.length > 0) {
        return list
          .filter((p: any) => !p.deletedAt && p.status === 'active')
          .map((p: any) => `${p.fullName} (${p.role === 'branch_manager' ? 'Branch Manager' : p.role})`);
      }
    }
    const cached = localStorage.getItem('glf_pdf_strict_employees_master') || localStorage.getItem('glf_employees_cache');
    if (cached) {
      const list = JSON.parse(cached);
      if (Array.isArray(list) && list.length > 0) {
        return list.map((emp: any) => `${emp.name || emp.fullName} (${emp.role || emp.designation || 'Staff'})`);
      }
    }
  } catch (e) {
    // ignore
  }
  return [];
};

export const BranchListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [branches, setBranches] = useState<DetailedBranch[]>([]);
  const addToast = useUIStore((s) => s.addToast);

  // Global & Local Branch Context
  const selectedBranchId = useUIStore((s) => s.selectedBranchId);
  const setSelectedBranchId = useUIStore((s) => s.setSelectedBranchId);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Disabled'>('all');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<DetailedBranch | null>(null);
  const [branchToToggle, setBranchToToggle] = useState<DetailedBranch | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '',
    phone: '',
    email: '',
    manager: '',
    openingDate: new Date().toISOString().split('T')[0],
    maxCapacity: 20,
    status: 'Active' as 'Active' | 'Disabled',
  });

  const loadBranches = () => {
    const list = getStoredBranches();
    setBranches(list);
  };

  useEffect(() => {
    loadBranches();
  }, []);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setBranchToToggle(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Open Add Branch Modal
  const handleOpenAddModal = () => {
    setEditingBranch(null);
    const currentList = getStoredBranches();
    const nextCode = `GL-BR-00${currentList.length + 1}`;
    setFormData({
      name: '',
      code: nextCode,
      address: '',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '',
      phone: '',
      email: `${nextCode.toLowerCase()}@goldenleaf.finance`,
      manager: '',
      openingDate: new Date().toISOString().split('T')[0],
      maxCapacity: 20,
      status: 'Active',
    });
    setShowAddModal(true);
  };

  // Auto-open Add Branch modal if user navigated to /branches/add
  useEffect(() => {
    if (location.pathname === '/branches/add') {
      handleOpenAddModal();
    }
  }, [location.pathname]);

  // Open Edit Branch Modal
  const handleOpenEditModal = (branch: DetailedBranch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      address: branch.address,
      city: branch.city,
      state: branch.state,
      pincode: branch.pincode,
      phone: branch.phone,
      email: branch.email,
      manager: branch.manager,
      openingDate: branch.openingDate,
      maxCapacity: branch.maxCapacity,
      status: branch.status,
    });
    setShowAddModal(true);
  };

  // Save Branch (Create or Update with Duplicate Prevention)
  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    const trimmedCode = formData.code.trim();

    if (!trimmedName || !formData.address.trim() || !formData.phone.trim()) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Please fill in all mandatory fields.' });
      return;
    }

    // Duplicate Branch Prevention (by name or code, case-insensitive)
    const currentBranches = getStoredBranches();
    const isDuplicate = currentBranches.some(
      (b) =>
        b.id !== editingBranch?.id &&
        (b.name.trim().toLowerCase() === trimmedName.toLowerCase() ||
         b.code.trim().toLowerCase() === trimmedCode.toLowerCase())
    );

    if (isDuplicate) {
      addToast({
        type: 'error',
        title: 'Duplicate Branch',
        message: `A branch with name "${trimmedName}" or code "${trimmedCode}" already exists.`,
      });
      return;
    }

    if (editingBranch) {
      updateExistingBranch(editingBranch.id, {
        ...formData,
        name: trimmedName,
        code: trimmedCode,
      });
      addToast({
        type: 'success',
        title: 'Branch Updated',
        message: `${trimmedName} details have been updated.`,
      });
    } else {
      const created = createNewBranch({
        ...formData,
        name: trimmedName,
        code: trimmedCode,
      });
      addToast({
        type: 'success',
        title: 'Branch Created',
        message: `${trimmedName} (${trimmedCode}) is now live.`,
      });
      // Optionally switch context to newly created branch
      setSelectedBranchId(created.id);
    }

    setShowAddModal(false);
    loadBranches();
  };

  // Confirm Disable / Enable Toggle
  const handleConfirmToggle = () => {
    if (!branchToToggle) return;
    const result = toggleBranchStatus(branchToToggle.id);
    if (result) {
      addToast({
        type: result.newStatus === 'Disabled' ? 'warning' : 'success',
        title: `Branch ${result.newStatus}`,
        message: `Branch ${branchToToggle.name} status changed to ${result.newStatus}.`,
      });
      loadBranches();
    }
    setBranchToToggle(null);
  };

  // Switch Branch Context
  const handleSelectBranchContext = (branchId: string | null) => {
    setSelectedBranchId(branchId);
  };

  // Metrics
  const totalBranchesCount = branches.length;
  const activeBranchesCount = branches.filter((b) => b.status === 'Active').length;
  const disabledBranchesCount = branches.filter((b) => b.status === 'Disabled').length;

  // Active Branch Context
  const activeBranch = branches.find((b) => b.id === selectedBranchId);
  const isValidBranchSelected = Boolean(selectedBranchId && activeBranch);

  // Filtered branches based on active branch context, status filter, and search
  const displayedBranches = branches.filter((b) => {
    // Branch context filter
    if (isValidBranchSelected && b.id !== selectedBranchId) return false;
    // Status filter
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = b.name.toLowerCase().includes(q);
      const matchCode = b.code.toLowerCase().includes(q);
      const matchCity = (b.city || '').toLowerCase().includes(q);
      const matchManager = (b.manager || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchCity && !matchManager) return false;
    }
    return true;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSelectedBranchId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 sm:p-5 lg:p-6 flex flex-col gap-5 pb-12 font-sans max-w-full"
    >
      {/* ── 1. HEADER (Strict PDF Spec) ── */}
      <PageHeader
        title="Branch Management"
        subtitle="Manage branches, operations and regional branch contexts."
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard' },
          { label: 'Branch Management' },
        ]}
        actions={
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0B1F3A] to-[#15345E] hover:from-[#15345E] hover:to-[#0B1F3A] text-white font-semibold text-xs transition-all shadow-sm border border-[#D4AF37]/50 active:scale-95 cursor-pointer"
          >
            <Plus size={15} className="text-[#D4AF37]" />
            <span>Add Branch</span>
          </button>
        }
      />

      {/* ── 2. SUMMARY KPI STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-[0_1px_3px_rgba(11,31,58,0.04)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Total Branches
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#0B1F3A] mt-1 font-manrope">
              {totalBranchesCount}
            </div>
            <span className="text-[11px] text-[#94A3B8] mt-0.5 block">
              Registered operational centers
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#0B1F3A]/5 border border-[#0B1F3A]/10 flex items-center justify-center text-[#0B1F3A]">
            <Building2 size={22} className="text-[#D4AF37]" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-[0_1px_3px_rgba(11,31,58,0.04)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Active Branches
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 font-manrope">
              {activeBranchesCount}
            </div>
            <span className="text-[11px] text-emerald-600/80 mt-0.5 block font-medium">
              Live & operational
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-[0_1px_3px_rgba(11,31,58,0.04)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Disabled Branches
            </span>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-1 font-manrope">
              {disabledBranchesCount}
            </div>
            <span className="text-[11px] text-rose-600/80 mt-0.5 block font-medium">
              Inactive / On-hold
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <Ban size={22} />
          </div>
        </div>
      </div>

      {/* ── 3. UNIFIED ALL BRANCHES MASTER PANEL ── */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04),0_4px_12px_rgba(11,31,58,0.02)] overflow-hidden"
      >
        {/* Unified Card Header with Context Selector */}
        <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 border-b border-[#E2E8F0]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
            <div>
              <h2 className="text-sm font-semibold text-[#FFFFFF] tracking-wide uppercase font-sans flex items-center gap-2">
                All Branches Directory
                <span className="text-[11px] font-normal font-sans px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  {displayedBranches.length} {displayedBranches.length === 1 ? 'Branch' : 'Branches'}
                </span>
              </h2>
            </div>
          </div>

          {/* Integrated Branch Context Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider hidden md:inline">
              Branch Context:
            </span>
            <div className="relative min-w-[210px] sm:min-w-[250px]">
              <select
                value={selectedBranchId || ''}
                onChange={(e) => setSelectedBranchId(e.target.value ? e.target.value : null)}
                className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-[#D4AF37]/50 text-xs font-semibold focus:outline-none focus:border-[#D4AF37] cursor-pointer shadow-xs transition-colors"
              >
                <option value="" className="text-[#0B1F3A] bg-white">All Branches (Global)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="text-[#0B1F3A] bg-white">
                    {b.name} {b.status === 'Disabled' ? '(Disabled)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Context Filtering Notice Banner (Visible only when filtering by a specific branch) */}
        {isValidBranchSelected && activeBranch && (
          <div className="bg-amber-50/90 border-b border-amber-200/80 px-5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>
                Currently filtered to Branch Context: <strong className="text-amber-950 font-bold">{activeBranch.name}</strong> ({activeBranch.code})
              </span>
            </div>
            <button
              onClick={() => setSelectedBranchId(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-all shadow-xs cursor-pointer w-fit"
            >
              <X size={13} />
              <span>Show All Branches</span>
            </button>
          </div>
        )}

        {/* Integrated Toolbar: Search & Status Filters */} 
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search branch by name, code, manager, city..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#D4AF37] text-xs bg-white hover:border-slate-300 focus:ring-1 focus:ring-[#D4AF37] transition-all font-medium text-[#0B1F3A]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#0B1F3A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0B1F3A]'
              }`}
            >
              All ({totalBranchesCount})
            </button>
            <button
              onClick={() => setStatusFilter('Active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'Active'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'Active' ? 'bg-white' : 'bg-emerald-500'}`} />
              Active ({activeBranchesCount})
            </button>
            <button
              onClick={() => setStatusFilter('Disabled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'Disabled'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'Disabled' ? 'bg-white' : 'bg-rose-500'}`} />
              Disabled ({disabledBranchesCount})
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto w-full custom-scrollbar">
          {displayedBranches.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#64748B] mb-3">
                <Building2 size={22} className="text-[#0B1F3A]" />
              </div>
              <h3 className="text-sm font-bold text-[#0B1F3A] font-sans">
                No matching branches found
              </h3>
              <p className="text-xs text-[#64748B] max-w-sm mt-1 mb-4 font-sans">
                {searchQuery || statusFilter !== 'all' || isValidBranchSelected
                  ? 'No branches match your active filters or search term.'
                  : 'No branch records found in the system.'}
              </p>
              {(searchQuery || statusFilter !== 'all' || isValidBranchSelected) && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-semibold text-xs transition-all border border-slate-200 cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse font-sans min-w-[640px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50/70 text-[#64748B] font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-6 text-left">Branch Details</th>
                  <th className="py-3.5 px-6 text-left">Manager & Contact</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {displayedBranches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* BRANCH DETAILS */}
                    <td className="py-4 px-6 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0B1F3A] text-sm font-sans">{b.name}</span>
                        {b.code && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] text-[#0B1F3A] font-mono font-semibold">
                            {b.code}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#64748B] flex items-center gap-1 mt-1">
                        <MapPin size={12} className="text-[#D4AF37] flex-shrink-0" />
                        <span>{b.city || 'Tamil Nadu'}, {b.state || 'India'}</span>
                      </div>
                    </td>

                    {/* MANAGER & CONTACT */}
                    <td className="py-4 px-6 text-left">
                      <div className="text-xs font-semibold text-[#0B1F3A] flex items-center gap-1.5">
                        <User size={13} className="text-slate-400 flex-shrink-0" />
                        <span>{b.manager || 'Not Assigned'}</span>
                      </div>
                      <div className="text-[11.5px] text-[#64748B] flex items-center gap-1.5 mt-0.5 font-mono">
                        <Phone size={12} className="text-slate-400 flex-shrink-0" />
                        <span>{b.phone || '-'}</span>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          b.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            b.status === 'Active' ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        />
                        {b.status}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Branch Dashboard */}
                        <button
                          onClick={() => {
                            setSelectedBranchId(b.id);
                            navigate(`/branches/${b.id}/dashboard`);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#132F58] text-white text-xs font-semibold transition-all shadow-xs border border-[#D4AF37]/40 active:scale-95 cursor-pointer"
                          title="Open Branch Dashboard"
                        >
                          <LayoutDashboard size={13} className="text-[#D4AF37]" />
                          <span>Dashboard</span>
                        </button>

                        {/* Edit Branch */}
                        <button
                          onClick={() => handleOpenEditModal(b)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] text-xs font-semibold transition-all border border-slate-200 active:scale-95 cursor-pointer"
                          title="Edit Branch"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>

                        {/* Disable / Enable Branch */}
                        <button
                          onClick={() => setBranchToToggle(b)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border active:scale-95 cursor-pointer ${
                            b.status === 'Active'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                          title={b.status === 'Active' ? 'Disable Branch' : 'Enable Branch'}
                        >
                          {b.status === 'Active' ? (
                            <>
                              <Ban size={13} />
                              <span>Disable</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={13} />
                              <span>Enable</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* ── 4. ADD / EDIT BRANCH MODAL ── */}
      <AnimatePresence>
        {showAddModal && (
          <div
            onClick={() => setShowAddModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#E2E8F0] w-[min(94vw,620px)] max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl relative font-sans cursor-default"
            >
              {/* Modal Header */}
              <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider font-sans truncate">
                    {editingBranch ? `Edit Branch: ${editingBranch.name}` : 'Add Branch'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form Body */}
              <form onSubmit={handleSaveBranch} className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
                {/* Branch Name & Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">Branch Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Madurai Central Branch"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">Branch Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. GL-BR-006"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-slate-50 font-mono text-xs min-h-[40px]"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Plot / Door No., Street, Landmark"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px]"
                  />
                </div>

                {/* City, State, Pincode */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">Pincode *</label>
                    <input
                      type="text"
                      required
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      placeholder="600001"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px]"
                    />
                  </div>
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">Contact Phone *</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 44 2345 6789"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="branch@goldenleaf.finance"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px]"
                    />
                  </div>
                </div>

                {/* Manager & Opening Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">Branch Manager</label>
                    <div className="relative">
                      <input
                        type="text"
                        list="branch-manager-options"
                        value={formData.manager}
                        onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                        placeholder="Type or select manager..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white font-medium"
                      />
                      <datalist id="branch-manager-options">
                        {getAvailableManagers().map((mgr) => (
                          <option key={mgr} value={mgr} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">Opening Date</label>
                    <input
                      type="date"
                      value={formData.openingDate}
                      onChange={(e) => setFormData({ ...formData, openingDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px]"
                    />
                  </div>
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-semibold border border-slate-200 cursor-pointer min-h-[40px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl bg-[#0B1F3A] hover:bg-[#132F58] text-white font-bold shadow-sm border border-[#D4AF37]/50 cursor-pointer min-h-[40px]"
                  >
                    {editingBranch ? 'Save Changes' : 'Add Branch'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 5. DISABLE / ENABLE CONFIRMATION DIALOG ── */}
      <AnimatePresence>
        {branchToToggle && (
          <div
            onClick={() => setBranchToToggle(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm font-sans cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#E2E8F0] w-[min(94vw,460px)] max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl relative cursor-default"
            >
              <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider font-sans">
                    {branchToToggle.status === 'Active' ? 'Disable Branch' : 'Enable Branch'}
                  </h3>
                </div>
                <button
                  onClick={() => setBranchToToggle(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto custom-scrollbar flex-1 font-sans">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                  <AlertTriangle size={20} className="flex-shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-amber-900">
                      {branchToToggle.status === 'Active'
                        ? 'Disable this branch?'
                        : 'Re-enable this branch?'}
                    </p>
                    <p className="mt-1 text-amber-700 leading-relaxed text-xs">
                      {branchToToggle.status === 'Active'
                        ? `Disabling "${branchToToggle.name}" marks the branch as inactive. Existing loans, collections, and borrower records remain preserved.`
                        : `Re-enabling "${branchToToggle.name}" restores the branch to Active status for operations.`}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Branch Name:</span>
                    <span className="font-bold text-[#0B1F3A]">{branchToToggle.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Branch Code:</span>
                    <span className="font-semibold text-slate-700 font-mono">{branchToToggle.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Current Status:</span>
                    <span className="font-semibold text-slate-700">{branchToToggle.status}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBranchToToggle(null)}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-semibold border border-slate-200 cursor-pointer flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmToggle}
                    className={`py-2.5 px-4 rounded-xl text-white font-bold shadow-sm cursor-pointer flex-1 ${
                      branchToToggle.status === 'Active'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {branchToToggle.status === 'Active' ? 'Confirm Disable' : 'Confirm Enable'}
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

export default BranchListPage;
