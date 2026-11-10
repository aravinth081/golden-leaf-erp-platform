// ──────────────────────────────────────────────────
// Golden Leaf Finance — Roles & User Accounts Management (Admin)
// Role Authorization, Account Provisioning, Credentials & Session Tracking
// • Admin, Branch Manager, Credit Manager, Customer Relationship Officer (CRO)
// • Create Account with Username & Password
// • Edit Username & Credentials
// • Hold / Suspend / Activate Account
// • Remove / Delete Account
// • Account Creation Timestamp (Date & Time)
// • Live Online / Offline Presence Tracking
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Shield, Key, Lock, Eye, EyeOff, CheckCircle2,
  AlertTriangle, X, Edit2, Trash2, PauseCircle, PlayCircle, Clock,
  Calendar, Search, Filter, RotateCcw, Building2, MapPin, Check,
  ChevronDown, Activity, Phone, Mail, Sparkles, UserCheck, ShieldAlert,
  PhoneCall, Copy, ShieldCheck, DollarSign, FileCheck, Wallet
} from 'lucide-react';
import { PageHeader } from '../../components/ui';
import { useUIStore, useAuthStore } from '../../store';
import { getStoredBranches } from '../../services/branchService';
import { canManageUser, type UserRole } from '../../types/auth.types';

export type UserRoleType = 'admin' | 'hr_payroll_manager' | 'branch_manager' | 'credit_manager' | 'collection_agent';

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRoleType;
  branchName: string;
  status: 'active' | 'on_hold';
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  phone: string;
  email: string;
}

const STORAGE_KEY = 'golden_leaf_roles_user_accounts_master';

const ROLE_METADATA: Record<UserRoleType, { label: string; tag: string; badgeClass: string }> = {
  admin: {
    label: 'Admin',
    tag: 'System Master Authority',
    badgeClass: 'bg-[#0B1F3A] text-[#D4AF37] border border-[#D4AF37]/40',
  },
  hr_payroll_manager: {
    label: 'HR & Payroll Finance Manager',
    tag: 'Corporate HR, Compensation & Statutory Compliance',
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-300',
  },
  branch_manager: {
    label: 'Branch Manager',
    tag: 'Cluster & Branch Operations',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  credit_manager: {
    label: 'Credit Manager',
    tag: 'KYC & Risk Underwriting',
    badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200',
  },
  collection_agent: {
    label: 'Customer Relationship Officer (CRO)',
    tag: 'Recovery & Route Receipts',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
};

const RoleIcon: React.FC<{ role: UserRoleType; size?: number; className?: string }> = ({ role, size = 14, className }) => {
  switch (role) {
    case 'admin':
      return <ShieldCheck size={size} className={className || 'text-[#D4AF37]'} />;
    case 'hr_payroll_manager':
      return <DollarSign size={size} className={className || 'text-amber-600'} />;
    case 'branch_manager':
      return <Building2 size={size} className={className || 'text-blue-600'} />;
    case 'credit_manager':
      return <FileCheck size={size} className={className || 'text-purple-600'} />;
    case 'collection_agent':
      return <Wallet size={size} className={className || 'text-emerald-600'} />;
    default:
      return <Shield size={size} className={className} />;
  }
};

export const RolesPermissionsPage: React.FC = () => {
  const { addToast } = useUIStore();
  const currentUser = useAuthStore((s) => s.user);
  const currentActorRole = (currentUser?.customClaims?.role || 'admin') as UserRole;

  // Hierarchically assignable roles for the current user
  const assignableRoles: UserRoleType[] = (
    ['admin', 'hr_payroll_manager', 'branch_manager', 'credit_manager', 'collection_agent'] as UserRoleType[]
  ).filter((r) => canManageUser(currentActorRole, r));

  // Retrieve stored accounts
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load accounts from localStorage', e);
    }
    return [];
  });

  // Available branches from branchService
  const [branches, setBranches] = useState<string[]>([]);

  useEffect(() => {
    const list = getStoredBranches().map((b) => b.name);
    setBranches(list);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.error('Failed to persist accounts', e);
    }
  }, [accounts]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRoleType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'active' | 'on_hold'>('all');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<UserAccount | null>(null);
  const [accountToHold, setAccountToHold] = useState<UserAccount | null>(null);

  // Form State for Create Account
  const [createForm, setCreateForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'branch_manager' as UserRoleType,
    branchName: 'Main Branch (Chennai)',
    phone: '',
    email: '',
    status: 'active' as 'active' | 'on_hold',
    isOnline: false,
  });

  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'branch_manager' as UserRoleType,
    branchName: '',
    phone: '',
    email: '',
  });

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCreateModal(false);
        setEditingAccount(null);
        setAccountToDelete(null);
        setAccountToHold(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Format current date and time
  const getCurrentFormattedDateTime = () => {
    const now = new Date();
    return now.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Quick Contact & Copy State
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const handleCopyPhone = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone.replace(/\s+/g, ''));
    setCopiedPhone(phone);
    addToast({
      type: 'success',
      title: 'Copied',
      message: `Phone number ${phone} copied to clipboard!`,
    });
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Open Edit Modal
  const handleOpenEdit = (acc: UserAccount) => {
    if (!canManageUser(currentActorRole, acc.role)) {
      addToast({
        type: 'error',
        title: 'Action Prohibited',
        message: `Hierarchy violation: Role [${currentActorRole}] cannot edit or reassign an account of role [${ROLE_METADATA[acc.role]?.label || acc.role}].`,
      });
      return;
    }
    setEditingAccount(acc);
    setEditForm({
      name: acc.name,
      username: acc.username,
      password: acc.password || '',
      role: acc.role,
      branchName: acc.branchName,
      phone: acc.phone,
      email: acc.email,
    });
  };

  // Handle Create Account Submission
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.username.trim() || !createForm.password.trim()) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Name, username, and password are required.' });
      return;
    }

    if (!canManageUser(currentActorRole, createForm.role)) {
      addToast({
        type: 'error',
        title: 'Hierarchy Violation',
        message: `Your role [${currentActorRole}] is not authorized to create accounts with role [${ROLE_METADATA[createForm.role]?.label || createForm.role}].`,
      });
      return;
    }

    const cleanUsername = createForm.username.trim().toLowerCase().replace(/\s+/g, '.');

    // Check username uniqueness
    if (accounts.some((a) => a.username.toLowerCase() === cleanUsername)) {
      addToast({ type: 'error', title: 'Username Taken', message: `Username "${cleanUsername}" is already in use. Please choose another.` });
      return;
    }

    const newAccount: UserAccount = {
      id: `USR-${String(accounts.length + 1).padStart(3, '0')}`,
      name: createForm.name.trim(),
      username: cleanUsername,
      password: createForm.password,
      role: createForm.role,
      branchName: createForm.branchName || branches[0] || 'Main Branch (Chennai)',
      status: createForm.status,
      isOnline: createForm.isOnline,
      lastSeen: createForm.isOnline ? 'Online now' : `Registered on ${getCurrentFormattedDateTime()}`,
      createdAt: getCurrentFormattedDateTime(),
      phone: createForm.phone.trim() || '+91 98401 00000',
      email: createForm.email.trim() || `${cleanUsername}@goldenleaf.finance`,
    };

    setAccounts((prev) => [newAccount, ...prev]);
    addToast({
      type: 'success',
      title: 'Account Created',
      message: `${ROLE_METADATA[newAccount.role].label} account created for @${newAccount.username}.`,
    });

    setShowCreateModal(false);
    setCreateForm({
      name: '',
      username: '',
      password: '',
      role: 'branch_manager',
      branchName: branches[0] || 'Main Branch (Chennai)',
      phone: '',
      email: '',
      status: 'active',
      isOnline: false,
    });
  };

  // Handle Save Edited Account
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    if (!editForm.name.trim() || !editForm.username.trim()) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Name and username cannot be empty.' });
      return;
    }

    const cleanUsername = editForm.username.trim().toLowerCase().replace(/\s+/g, '.');

    if (!canManageUser(currentActorRole, editForm.role)) {
      addToast({
        type: 'error',
        title: 'Hierarchy Violation',
        message: `Your role [${currentActorRole}] is not authorized to assign role [${ROLE_METADATA[editForm.role]?.label || editForm.role}].`,
      });
      return;
    }

    // Check username uniqueness if changed
    if (
      cleanUsername !== editingAccount.username.toLowerCase() &&
      accounts.some((a) => a.id !== editingAccount.id && a.username.toLowerCase() === cleanUsername)
    ) {
      addToast({ type: 'error', title: 'Username Taken', message: `Username "${cleanUsername}" is already in use.` });
      return;
    }

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === editingAccount.id
          ? {
              ...a,
              name: editForm.name.trim(),
              username: cleanUsername,
              password: editForm.password || a.password,
              role: editForm.role,
              branchName: editForm.branchName || a.branchName,
              phone: editForm.phone.trim() || a.phone,
              email: editForm.email.trim() || a.email,
            }
          : a
      )
    );

    addToast({
      type: 'success',
      title: 'Account Updated',
      message: `Account @${cleanUsername} updated successfully.`,
    });
    setEditingAccount(null);
  };

  // Toggle Hold / Active status
  const handleToggleHold = (acc: UserAccount) => {
    if (!canManageUser(currentActorRole, acc.role)) {
      addToast({
        type: 'error',
        title: 'Action Prohibited',
        message: `Hierarchy violation: Role [${currentActorRole}] cannot modify hold status for an account of role [${ROLE_METADATA[acc.role]?.label || acc.role}].`,
      });
      setAccountToHold(null);
      return;
    }
    const newStatus = acc.status === 'active' ? 'on_hold' : 'active';
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === acc.id
          ? {
              ...a,
              status: newStatus,
              isOnline: newStatus === 'on_hold' ? false : a.isOnline,
              lastSeen: newStatus === 'on_hold' ? `Placed on hold on ${getCurrentFormattedDateTime()}` : a.lastSeen,
            }
          : a
      )
    );

    addToast({
      type: newStatus === 'on_hold' ? 'warning' : 'success',
      title: newStatus === 'on_hold' ? 'Account Placed On Hold' : 'Account Re-Activated',
      message: `@${acc.username} is now ${newStatus === 'on_hold' ? 'On Hold (Suspended)' : 'Active'}.`,
    });
    setAccountToHold(null);
  };

  // Toggle Live Online / Offline state
  const handleToggleOnline = (acc: UserAccount) => {
    const nextOnline = !acc.isOnline;
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === acc.id
          ? {
              ...a,
              isOnline: nextOnline,
              lastSeen: nextOnline ? 'Online now' : `Went offline on ${getCurrentFormattedDateTime()}`,
            }
          : a
      )
    );

    addToast({
      type: nextOnline ? 'success' : 'info',
      title: nextOnline ? 'User Online' : 'User Offline',
      message: `@${acc.username} presence marked as ${nextOnline ? 'Online' : 'Offline'}.`,
    });
  };

  // Confirm Delete Account
  const handleConfirmDelete = () => {
    if (!accountToDelete) return;
    if (!canManageUser(currentActorRole, accountToDelete.role)) {
      addToast({
        type: 'error',
        title: 'Action Prohibited',
        message: `Hierarchy violation: Role [${currentActorRole}] cannot delete an account of role [${ROLE_METADATA[accountToDelete.role]?.label || accountToDelete.role}].`,
      });
      setAccountToDelete(null);
      return;
    }
    const removedName = accountToDelete.name;
    const removedUsername = accountToDelete.username;
    setAccounts((prev) => prev.filter((a) => a.id !== accountToDelete.id));
    addToast({
      type: 'info',
      title: 'Account Removed',
      message: `Account @${removedUsername} (${removedName}) permanently deleted.`,
    });
    setAccountToDelete(null);
  };

  // Metrics
  const totalCount = accounts.length;
  const onlineCount = accounts.filter((a) => a.isOnline).length;
  const activeCount = accounts.filter((a) => a.status === 'active').length;
  const holdCount = accounts.filter((a) => a.status === 'on_hold').length;

  // Filtered Accounts
  const displayedAccounts = accounts.filter((a) => {
    // Role filter
    if (roleFilter !== 'all' && a.role !== roleFilter) return false;
    // Status filter
    if (statusFilter === 'online' && !a.isOnline) return false;
    if (statusFilter === 'active' && a.status !== 'active') return false;
    if (statusFilter === 'on_hold' && a.status !== 'on_hold') return false;
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = a.name.toLowerCase().includes(q);
      const matchUsername = a.username.toLowerCase().includes(q);
      const matchBranch = a.branchName.toLowerCase().includes(q);
      const matchRole = ROLE_METADATA[a.role]?.label.toLowerCase().includes(q);
      if (!matchName && !matchUsername && !matchBranch && !matchRole) return false;
    }
    return true;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 font-sans pb-12 w-full min-w-0 max-w-full">
      {/* ── 1. PAGE HEADER ── */}
      <PageHeader
        title="Roles & User Account Access"
        subtitle="Provision accounts with username and password, manage role authorization, status hold controls, and live activity tracking."
        breadcrumbs={[
          { label: 'Employee Management', href: '/employees' },
          { label: 'Roles & User Accounts' },
        ]}
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0B1F3A] to-[#15345E] hover:from-[#15345E] hover:to-[#0B1F3A] text-white font-semibold text-xs transition-all shadow-sm border border-[#D4AF37]/50 active:scale-95 cursor-pointer"
          >
            <UserPlus size={15} className="text-[#D4AF37]" />
            <span>Create User Account</span>
          </button>
        }
      />

      {/* ── 2. KPI SUMMARY METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Accounts */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-[0_1px_3px_rgba(11,31,58,0.04)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Total Accounts
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#0B1F3A] mt-1 font-manrope">
              {totalCount}
            </div>
            <span className="text-[10px] text-[#94A3B8] mt-0.5 block truncate">
              Across 4 institutional roles
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#0B1F3A]/5 border border-[#0B1F3A]/10 flex items-center justify-center text-[#0B1F3A]">
            <Users size={20} className="text-[#D4AF37]" />
          </div>
        </div>

        {/* Online Now */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-[0_1px_3px_rgba(11,31,58,0.04)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Online Now
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 font-manrope flex items-center gap-2">
              {onlineCount}
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            </div>
            <span className="text-[10px] text-emerald-700/80 mt-0.5 block truncate font-medium">
              Active sessions currently
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Activity size={20} />
          </div>
        </div>

        {/* Active Accounts */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-[0_1px_3px_rgba(11,31,58,0.04)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Active Users
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#0B1F3A] mt-1 font-manrope">
              {activeCount}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
              Authorized login status
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* On Hold Accounts */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-[0_1px_3px_rgba(11,31,58,0.04)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              On Hold / Suspended
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-1 font-manrope">
              {holdCount}
            </div>
            <span className="text-[10px] text-amber-700/80 mt-0.5 block truncate font-medium">
              Access temporarily restricted
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <PauseCircle size={20} />
          </div>
        </div>
      </div>

      {/* ── 3. MASTER USER ACCOUNTS DIRECTORY ── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04),0_4px_12px_rgba(11,31,58,0.02)] overflow-hidden">
        {/* Card Header */}
        <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 border-b border-[#E2E8F0]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
            <div>
              <h2 className="text-sm font-semibold text-[#FFFFFF] tracking-wide uppercase font-sans flex items-center gap-2">
                User Accounts & Role Credentials
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  {displayedAccounts.length} {displayedAccounts.length === 1 ? 'User' : 'Users'}
                </span>
              </h2>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#C9A227] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer w-fit"
          >
            <UserPlus size={13} />
            <span>+ Add New Account</span>
          </button>
        </div>

        {/* Role Tabs Bar */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-3 sm:px-6 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === 'all'
                  ? 'bg-[#0B1F3A] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Roles ({totalCount})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                roleFilter === 'admin'
                  ? 'bg-[#0B1F3A] text-[#D4AF37] shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <RoleIcon role="admin" size={13} />
              <span>Admin ({accounts.filter((a) => a.role === 'admin').length})</span>
            </button>
            <button
              onClick={() => setRoleFilter('hr_payroll_manager')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                roleFilter === 'hr_payroll_manager'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <RoleIcon role="hr_payroll_manager" size={13} />
              <span>HR & Payroll ({accounts.filter((a) => a.role === 'hr_payroll_manager').length})</span>
            </button>
            <button
              onClick={() => setRoleFilter('branch_manager')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                roleFilter === 'branch_manager'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <RoleIcon role="branch_manager" size={13} />
              <span>Branch Manager ({accounts.filter((a) => a.role === 'branch_manager').length})</span>
            </button>
            <button
              onClick={() => setRoleFilter('credit_manager')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                roleFilter === 'credit_manager'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <RoleIcon role="credit_manager" size={13} />
              <span>Credit Manager ({accounts.filter((a) => a.role === 'credit_manager').length})</span>
            </button>
            <button
              onClick={() => setRoleFilter('collection_agent')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                roleFilter === 'collection_agent'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <RoleIcon role="collection_agent" size={13} />
              <span>Customer Relationship Officer (CRO) ({accounts.filter((a) => a.role === 'collection_agent').length})</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Search and Status Filters */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username, full name, branch..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#D4AF37] text-xs bg-slate-50/50 hover:bg-white focus:bg-white transition-all font-medium text-[#0B1F3A]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Quick Filters */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-[#0B1F3A] shadow-xs' : 'text-slate-600 hover:text-[#0B1F3A]'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('online')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'online' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Online ({onlineCount})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'active' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('on_hold')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'on_hold' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              On Hold ({holdCount})
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          {displayedAccounts.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#64748B] mb-3">
                <Users size={22} className="text-[#0B1F3A]" />
              </div>
              <h3 className="text-sm font-bold text-[#0B1F3A] font-sans">No matching user accounts</h3>
              <p className="text-xs text-[#64748B] max-w-sm mt-1 mb-4 font-sans">
                No user accounts match your search query or active filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-semibold text-xs transition-all border border-slate-200 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset Filters</span>
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse font-sans min-w-[1050px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50/70 text-[#64748B] font-bold text-[11px] uppercase tracking-wider select-none">
                  <th className="py-3.5 px-5 text-left whitespace-nowrap">User &amp; Username</th>
                  <th className="py-3.5 px-4 text-left whitespace-nowrap">Assigned Role</th>
                  <th className="py-3.5 px-4 text-left whitespace-nowrap">Contact Number</th>
                  <th className="py-3.5 px-4 text-left whitespace-nowrap">Branch Location</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Online Presence</th>
                  <th className="py-3.5 px-4 text-left whitespace-nowrap">Created Timestamp</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-5 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {displayedAccounts.map((acc) => {
                  const roleMeta = ROLE_METADATA[acc.role] || ROLE_METADATA.branch_manager;
                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* USER & USERNAME */}
                      <td className="py-4 px-5 text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                            {acc.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-[#0B1F3A] text-xs sm:text-sm">{acc.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[11.5px] font-bold text-[#0B1F3A] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                @{acc.username}
                              </span>
                              <button
                                onClick={() => handleOpenEdit(acc)}
                                className="text-[10px] text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
                                title="Click to edit username or password"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ROLE */}
                      <td className="py-4 px-4 text-left">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${roleMeta.badgeClass}`}
                        >
                          <RoleIcon role={acc.role} size={13} />
                          <span>{roleMeta.label}</span>
                        </span>
                        <div className="text-[10px] text-[#64748B] mt-0.5">{roleMeta.tag}</div>
                      </td>

                      {/* CONTACT NUMBER */}
                      <td className="py-4 px-4 text-left whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${acc.phone.replace(/\s+/g, '')}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/80 hover:bg-blue-100 text-[#0B1F3A] hover:text-blue-900 border border-blue-200/90 font-mono text-xs font-bold transition-all shadow-2xs group cursor-pointer"
                            title={`Click to call ${acc.name}: ${acc.phone}`}
                          >
                            <div className="w-5.5 h-5.5 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs group-hover:bg-[#0B1F3A] transition-colors">
                              <PhoneCall size={11} />
                            </div>
                            <span className="font-semibold tracking-tight">{acc.phone}</span>
                          </a>

                          <button
                            type="button"
                            onClick={(e) => handleCopyPhone(e, acc.phone)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-[#0B1F3A] border border-slate-200 transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Copy number to clipboard"
                          >
                            {copiedPhone === acc.phone ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* BRANCH */}
                      <td className="py-4 px-4 text-left whitespace-nowrap">
                        <div className="font-semibold text-[#0B1F3A] text-xs flex items-center gap-1.5">
                          <MapPin size={13} className="text-[#D4AF37] flex-shrink-0" />
                          <span>{acc.branchName}</span>
                        </div>
                        <div className="text-[10px] text-[#64748B] mt-0.5 font-medium">
                          Assigned Branch
                        </div>
                      </td>

                      {/* ONLINE PRESENCE */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <button
                            type="button"
                            onClick={() => handleToggleOnline(acc)}
                            title="Click to toggle Online/Offline simulation"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                              acc.isOnline
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                acc.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              }`}
                            />
                            <span>{acc.isOnline ? 'Online' : 'Offline'}</span>
                          </button>
                          <span className="text-[10px] text-[#94A3B8] mt-1 font-medium max-w-[140px] truncate">
                            {acc.lastSeen}
                          </span>
                        </div>
                      </td>

                      {/* CREATED AT */}
                      <td className="py-4 px-4 text-left">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0B1F3A]">
                          <Calendar size={12} className="text-[#D4AF37] flex-shrink-0" />
                          <span>{acc.createdAt}</span>
                        </div>
                        <div className="text-[10px] text-[#64748B] flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          <span>Registered record</span>
                        </div>
                      </td>

                      {/* STATUS (ACTIVE / ON HOLD) */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            acc.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              acc.status === 'active' ? 'bg-emerald-600' : 'bg-amber-600'
                            }`}
                          />
                          {acc.status === 'active' ? 'Active' : 'On Hold'}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit Username / Account */}
                          <button
                            onClick={() => handleOpenEdit(acc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] text-xs font-semibold border border-slate-200 cursor-pointer transition-all active:scale-95"
                            title="Edit Username & Credentials"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>

                          {/* Hold / Unhold Toggle */}
                          <button
                            onClick={() => handleToggleHold(acc)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all active:scale-95 ${
                              acc.status === 'active'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                            title={acc.status === 'active' ? 'Put Account On Hold' : 'Reactivate Account'}
                          >
                            {acc.status === 'active' ? (
                              <>
                                <PauseCircle size={12} />
                                <span>Hold</span>
                              </>
                            ) : (
                              <>
                                <PlayCircle size={12} />
                                <span>Unhold</span>
                              </>
                            )}
                          </button>

                          {/* Delete Account */}
                          <button
                            onClick={() => setAccountToDelete(acc)}
                            className="inline-flex items-center gap-1 p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 cursor-pointer transition-all active:scale-95"
                            title="Delete Account"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════ */}
      {/* MODAL 1: CREATE ACCOUNT                          */}
      {/* ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCreateModal && (
          <div
            onClick={() => setShowCreateModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#E2E8F0] w-[min(94vw,560px)] max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl relative font-sans cursor-default"
            >
              {/* Modal Header */}
              <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider font-sans">
                    Create User Account
                  </h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleCreateSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs font-sans">
                {/* Role Selection */}
                <div>
                  <label className="block font-semibold text-[#0B1F3A] uppercase mb-1.5">
                    Assign Role *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {assignableRoles.map((r) => {
                      const meta = ROLE_METADATA[r];
                      const isSelected = createForm.role === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setCreateForm({ ...createForm, role: r })}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[#0B1F3A] bg-[#0B1F3A] text-white shadow-sm'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <RoleIcon role={r} size={13} className={isSelected ? 'text-white' : undefined} />
                            <span>{meta.label}</span>
                          </div>
                          <div className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            {meta.tag}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Full Name & Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                      Username *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">@</span>
                      <input
                        type="text"
                        required
                        value={createForm.username}
                        onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                        placeholder="ramesh.kumar"
                        className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white font-mono font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Password & Branch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showCreatePassword ? 'text' : 'password'}
                        required
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        placeholder="Enter password..."
                        className="w-full px-3.5 pr-9 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCreatePassword(!showCreatePassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        {showCreatePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                      Branch Assignment *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        list="account-branch-options"
                        required
                        value={createForm.branchName}
                        onChange={(e) => setCreateForm({ ...createForm, branchName: e.target.value })}
                        placeholder="Select or type branch..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white font-medium"
                      />
                      <datalist id="account-branch-options">
                        {branches.map((b) => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* Phone & Email (Optional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      placeholder="+91 98401 00000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="user@goldenleaf.finance"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white"
                    />
                  </div>
                </div>

                {/* Initial Status & Presence */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                      Initial Status
                    </label>
                    <select
                      value={createForm.status}
                      onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as 'active' | 'on_hold' })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white cursor-pointer"
                    >
                      <option value="active">Active (Can log in)</option>
                      <option value="on_hold">On Hold (Access restricted)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                      Initial Presence
                    </label>
                    <select
                      value={createForm.isOnline ? 'online' : 'offline'}
                      onChange={(e) => setCreateForm({ ...createForm, isOnline: e.target.value === 'online' })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white cursor-pointer"
                    >
                      <option value="offline">Offline</option>
                      <option value="online">Online (Active now)</option>
                    </select>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-semibold border border-slate-200 cursor-pointer min-h-[40px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#0B1F3A] to-[#15345E] text-white font-bold shadow-sm border border-[#D4AF37]/50 cursor-pointer min-h-[40px] active:scale-95"
                  >
                    Create User Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════ */}
      {/* MODAL 2: EDIT ACCOUNT & USERNAME                 */}
      {/* ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {editingAccount && (
          <div
            onClick={() => setEditingAccount(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#E2E8F0] w-[min(94vw,520px)] max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl relative font-sans cursor-default"
            >
              <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider font-sans">
                    Edit Account & Username
                  </h3>
                </div>
                <button
                  onClick={() => setEditingAccount(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs font-sans">
                {/* Username Input (Primary feature requested) */}
                <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200">
                  <label className="block font-bold text-amber-900 uppercase mb-1">
                    Username * (Login Identifier)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-700 font-mono text-xs font-bold">@</span>
                    <input
                      type="text"
                      required
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white font-mono font-bold text-[#0B1F3A]"
                    />
                  </div>
                  <span className="text-[10px] text-amber-700 mt-1 block">
                    User will log into the system using this exact username.
                  </span>
                </div>

                {/* Full Name & Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                      Role *
                    </label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRoleType })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white cursor-pointer font-medium"
                    >
                      {assignableRoles.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_METADATA[r].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password Reset (Optional) */}
                <div>
                  <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                    Password / Reset Password
                  </label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder="Enter new password to reset..."
                      className="w-full px-3.5 pr-9 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showEditPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Branch Location */}
                <div>
                  <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                    Branch Assignment *
                  </label>
                  <input
                    type="text"
                    list="edit-account-branch-options"
                    required
                    value={editForm.branchName}
                    onChange={(e) => setEditForm({ ...editForm, branchName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white font-medium"
                  />
                  <datalist id="edit-account-branch-options">
                    {branches.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-semibold border border-slate-200 cursor-pointer min-h-[40px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl bg-[#0B1F3A] hover:bg-[#132F58] text-white font-bold shadow-sm border border-[#D4AF37]/50 cursor-pointer min-h-[40px]"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════ */}
      {/* MODAL 3: DELETE / REMOVE CONFIRMATION            */}
      {/* ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {accountToDelete && (
          <div
            onClick={() => setAccountToDelete(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#E2E8F0] w-[min(94vw,440px)] max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl relative font-sans cursor-default"
            >
              <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-4 bg-rose-500 rounded-full" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider font-sans">
                    Delete User Account
                  </h3>
                </div>
                <button
                  onClick={() => setAccountToDelete(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-4 text-xs font-sans">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                  <AlertTriangle size={20} className="flex-shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-rose-900">
                      Permanently remove this account?
                    </p>
                    <p className="mt-1 text-rose-700 leading-relaxed text-xs">
                      Deleting <strong>@{accountToDelete.username}</strong> ({accountToDelete.name}) will revoke all access privileges permanently.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Username:</span>
                    <span className="font-bold text-[#0B1F3A] font-mono">@{accountToDelete.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Role:</span>
                    <span className="font-semibold text-slate-700">{ROLE_METADATA[accountToDelete.role]?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Created On:</span>
                    <span className="font-semibold text-slate-700">{accountToDelete.createdAt}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAccountToDelete(null)}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-semibold border border-slate-200 cursor-pointer flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm cursor-pointer flex-1"
                  >
                    Confirm Delete
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

export default RolesPermissionsPage;
