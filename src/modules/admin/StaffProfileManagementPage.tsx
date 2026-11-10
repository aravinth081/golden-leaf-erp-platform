// ──────────────────────────────────────────────────
// Golden Leaf Finance — Staff Profile Management Page
// Admin-Exclusive Provisioning Console for 4 Institutional Staff Roles
// (HR, Branch Manager, Credit Manager, Customer Relationship Officer)
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  ShieldCheck,
  Search,
  Filter,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Building2,
  Sparkles,
  AlertTriangle,
  Lock,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  X,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  createStaffProfile,
  getStaffProfiles,
  updateStaffProfile,
  updateStaffStatus,
  resetStaffPassword,
  deleteStaffProfile,
  generateStrongPassword,
  validatePasswordComplexity,
  validateUsername,
  validateMobile,
  validateEmail,
  checkUniqueness,
  getStaffAuditLogs,
} from '../../services/staffService';
import { getStoredBranches, type DetailedBranch } from '../../services/branchService';
import type {
  StaffProfile,
  StaffProfileCreateDTO,
  StaffProfileUpdateDTO,
  StaffRole,
  StaffStatus,
  StaffAuditLogEntry,
} from '../../types/staff.types';
import { STAFF_ROLE_META } from '../../types/staff.types';

export const StaffProfileManagementPage: React.FC = () => {
  const currentUser = useAuthStore((s) => s.user);
  const { addToast } = useUIStore();

  const isUserAdmin = currentUser?.customClaims?.role === 'admin';

  // State
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | StaffRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | StaffStatus>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Available branches
  const [branches, setBranches] = useState<DetailedBranch[]>([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Selected item for action
  const [selectedProfile, setSelectedProfile] = useState<StaffProfile | null>(null);

  // One-time Plain Password Reveal
  const [revealedCredentials, setRevealedCredentials] = useState<{
    profile: StaffProfile;
    plainPassword: string;
    actionType: 'CREATED' | 'RESET';
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showRevealedPassword, setShowRevealedPassword] = useState(false);

  // Create Form State
  const initialCreateForm: StaffProfileCreateDTO = {
    fullName: '',
    employeeId: '',
    email: '',
    mobile: '',
    role: 'CRO',
    branchId: '',
    username: '',
    password: '',
    confirmPassword: '',
    status: 'active',
    mustChangePassword: true,
  };
  const [createForm, setCreateForm] = useState<StaffProfileCreateDTO>(initialCreateForm);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState<StaffProfileUpdateDTO>({
    fullName: '',
    email: '',
    mobile: '',
    role: 'CRO',
    branchId: '',
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Reset Password Form State
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetConfirmVal, setResetConfirmVal] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetError, setResetError] = useState('');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<StaffAuditLogEntry[]>([]);

  // Load branches
  useEffect(() => {
    const list = getStoredBranches();
    setBranches(list);
    if (list.length > 0 && !createForm.branchId) {
      setCreateForm((prev) => ({ ...prev, branchId: list[0].id }));
    }
  }, []);

  // Fetch Profiles
  const loadProfiles = () => {
    if (!currentUser || !isUserAdmin) return;
    setIsLoading(true);
    try {
      const res = getStaffProfiles(
        {
          search: searchQuery,
          role: roleFilter,
          status: statusFilter,
          page: currentPage,
          pageSize: 8,
        },
        currentUser
      );
      setProfiles(res.profiles);
      setTotalProfiles(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error Loading Staff',
        message: err.message || 'Could not retrieve staff profiles.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [searchQuery, roleFilter, statusFilter, currentPage, currentUser]);

  // Real-time Validation for Create Form
  const validateCreateField = (field: keyof StaffProfileCreateDTO, value: string) => {
    const errors = { ...createErrors };

    switch (field) {
      case 'fullName':
        if (!value.trim()) errors.fullName = 'Full Name is required.';
        else if (value.trim().length < 2) errors.fullName = 'Minimum 2 characters.';
        else delete errors.fullName;
        break;

      case 'employeeId':
        if (!value.trim()) errors.employeeId = 'Employee ID is required (e.g. EMP-101).';
        else {
          const u = checkUniqueness({ employeeId: value });
          if (!u.isUnique) errors.employeeId = u.message || 'Employee ID already taken.';
          else delete errors.employeeId;
        }
        break;

      case 'email': {
        const emailCheck = validateEmail(value);
        if (!emailCheck.valid) errors.email = emailCheck.message || 'Invalid email.';
        else {
          const u = checkUniqueness({ email: value });
          if (!u.isUnique) errors.email = u.message || 'Email already exists.';
          else delete errors.email;
        }
        break;
      }

      case 'mobile': {
        const mobCheck = validateMobile(value);
        if (!mobCheck.valid) errors.mobile = mobCheck.message || 'Must be 10 digits.';
        else delete errors.mobile;
        break;
      }

      case 'username': {
        const userCheck = validateUsername(value);
        if (!userCheck.valid) errors.username = userCheck.message || 'Invalid username.';
        else {
          const u = checkUniqueness({ username: value });
          if (!u.isUnique) errors.username = u.message || 'Username already taken.';
          else delete errors.username;
        }
        break;
      }

      case 'password': {
        const pCheck = validatePasswordComplexity(value);
        if (!pCheck.valid) errors.password = pCheck.message || 'Password does not meet complexity.';
        else delete errors.password;
        break;
      }

      case 'confirmPassword':
        if (value !== createForm.password) errors.confirmPassword = 'Passwords do not match.';
        else delete errors.confirmPassword;
        break;

      case 'branchId':
        if (createForm.role !== 'HR' && !value) errors.branchId = 'Branch assignment is required.';
        else delete errors.branchId;
        break;
    }

    setCreateErrors(errors);
  };

  // Generate strong password in create form
  const handleGenerateCreatePassword = () => {
    const strong = generateStrongPassword();
    setCreateForm((prev) => ({
      ...prev,
      password: strong,
      confirmPassword: strong,
    }));
    setShowCreatePassword(true);
    setCreateErrors((prev) => {
      const e = { ...prev };
      delete e.password;
      delete e.confirmPassword;
      return e;
    });
    addToast({
      type: 'info',
      title: 'Strong Password Generated',
      message: 'Generated institutional password meeting all security rules.',
    });
  };

  // Submit Create Profile
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Full validation sweep
    const errors: Record<string, string> = {};
    if (!createForm.fullName.trim()) errors.fullName = 'Full Name is required.';
    if (!createForm.employeeId.trim()) errors.employeeId = 'Employee ID is required.';
    const emailV = validateEmail(createForm.email);
    if (!emailV.valid) errors.email = emailV.message || 'Invalid email.';
    const mobV = validateMobile(createForm.mobile);
    if (!mobV.valid) errors.mobile = mobV.message || 'Invalid mobile.';
    const userV = validateUsername(createForm.username);
    if (!userV.valid) errors.username = userV.message || 'Invalid username.';
    const pwdV = validatePasswordComplexity(createForm.password);
    if (!pwdV.valid) errors.password = pwdV.message || 'Invalid password.';
    if (createForm.password !== createForm.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    if (createForm.role !== 'HR' && !createForm.branchId) errors.branchId = 'Branch is required.';

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      addToast({
        type: 'error',
        title: 'Validation Incomplete',
        message: 'Please resolve highlighted errors before submitting.',
      });
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const result = await createStaffProfile(createForm, currentUser);
      setShowCreateModal(false);
      setCreateForm(initialCreateForm);
      setCreateErrors({});
      loadProfiles();

      // Trigger One-time Credentials Modal
      setRevealedCredentials({
        profile: result.profile,
        plainPassword: result.plainPassword,
        actionType: 'CREATED',
      });
      setShowRevealedPassword(true);
      setShowCredentialsModal(true);

      addToast({
        type: 'success',
        title: 'Staff Profile Provisioned',
        message: `Login profile for @${result.profile.username} successfully created!`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Unable to create staff profile.',
      });
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (profile: StaffProfile) => {
    setSelectedProfile(profile);
    setEditForm({
      fullName: profile.fullName,
      email: profile.email,
      mobile: profile.mobile,
      role: profile.role,
      branchId: profile.branchId || '',
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  // Submit Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedProfile) return;

    try {
      updateStaffProfile(selectedProfile.id, editForm, currentUser);
      setShowEditModal(false);
      setSelectedProfile(null);
      loadProfiles();
      addToast({
        type: 'success',
        title: 'Profile Updated',
        message: `Staff details for @${selectedProfile.username} updated.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not update profile.',
      });
    }
  };

  // Toggle Status
  const handleToggleStatus = (profile: StaffProfile) => {
    if (!currentUser) return;
    const nextStatus: StaffStatus = profile.status === 'active' ? 'inactive' : 'active';
    try {
      updateStaffStatus(profile.id, nextStatus, currentUser);
      loadProfiles();
      addToast({
        type: 'success',
        title: nextStatus === 'active' ? 'Account Activated' : 'Account Deactivated',
        message: `@${profile.username} is now ${nextStatus.toUpperCase()}. ${
          nextStatus === 'inactive' ? 'Login is blocked.' : 'Staff can now log in.'
        }`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Could not change status.',
      });
    }
  };

  // Open Reset Password Modal
  const handleOpenReset = (profile: StaffProfile) => {
    setSelectedProfile(profile);
    const generated = generateStrongPassword();
    setResetPasswordVal(generated);
    setResetConfirmVal(generated);
    setResetError('');
    setShowResetPassword(true);
    setShowResetModal(true);
  };

  // Submit Password Reset
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedProfile) return;

    const v = validatePasswordComplexity(resetPasswordVal);
    if (!v.valid) {
      setResetError(v.message || 'Invalid password.');
      return;
    }
    if (resetPasswordVal !== resetConfirmVal) {
      setResetError('Passwords do not match.');
      return;
    }

    try {
      const result = await resetStaffPassword(selectedProfile.id, resetPasswordVal, currentUser);
      setShowResetModal(false);

      // Trigger One-time Credentials Modal
      setRevealedCredentials({
        profile: result.profile,
        plainPassword: result.plainPassword,
        actionType: 'RESET',
      });
      setShowRevealedPassword(true);
      setShowCredentialsModal(true);

      addToast({
        type: 'success',
        title: 'Password Reset Successful',
        message: `New credentials generated for @${selectedProfile.username}.`,
      });
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password.');
    }
  };

  // Soft Delete
  const handleConfirmDelete = () => {
    if (!currentUser || !selectedProfile) return;
    try {
      deleteStaffProfile(selectedProfile.id, currentUser);
      setShowDeleteModal(false);
      setSelectedProfile(null);
      loadProfiles();
      addToast({
        type: 'success',
        title: 'Profile Deleted',
        message: `@${selectedProfile.username} has been soft-deleted and removed from the active roster.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete staff profile.',
      });
    }
  };

  // View Audit Logs
  const handleOpenAuditLogs = () => {
    if (!currentUser) return;
    try {
      const logs = getStaffAuditLogs(currentUser);
      setAuditLogs(logs);
      setShowAuditModal(true);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Audit Access Denied',
        message: err.message || 'Could not retrieve audit trail.',
      });
    }
  };

  // Copy Credentials Memo to Clipboard
  const handleCopyAllCredentials = () => {
    if (!revealedCredentials) return;
    const memo = `=========================================
GOLDEN LEAF FINANCE — STAFF LOGIN CREDENTIALS
=========================================
Staff Name   : ${revealedCredentials.profile.fullName}
Employee ID  : ${revealedCredentials.profile.employeeId}
Role         : ${STAFF_ROLE_META[revealedCredentials.profile.role].label}
Branch       : ${revealedCredentials.profile.branchName || 'Corporate HQ'}
Username     : ${revealedCredentials.profile.username}
Password     : ${revealedCredentials.plainPassword}
Access Portal: http://localhost:3000/
=========================================`;

    navigator.clipboard.writeText(memo);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
    addToast({
      type: 'success',
      title: 'Credentials Copied',
      message: 'Full credential memo copied to clipboard ready to share with staff.',
    });
  };

  // Stats Breakdown
  const stats = useMemo(() => {
    const hr = profiles.filter((p) => p.role === 'HR').length;
    const bm = profiles.filter((p) => p.role === 'BRANCH_MANAGER').length;
    const cm = profiles.filter((p) => p.role === 'CREDIT_MANAGER').length;
    const cro = profiles.filter((p) => p.role === 'CRO').length;
    const active = profiles.filter((p) => p.status === 'active').length;
    return { hr, bm, cm, cro, active };
  }, [profiles]);

  // Access check guard
  if (!isUserAdmin) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">403 Forbidden: Admin Access Required</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Staff Profile Management is strictly restricted to Super Administrators. Non-admin roles cannot create,
          manage, or view staff login profiles.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 sm:p-5 lg:p-6 flex flex-col gap-5 max-w-full font-sans text-slate-900 pb-16"
    >
      {/* ── Page Header ── */}
      <PageHeader
        title="Staff Profile Management"
        subtitle="Admin Provisioning Console • Create and manage institutional login credentials for staff roles"
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard' },
          { label: 'Staff Profile Management' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAuditLogs}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-all cursor-pointer shadow-xs"
              title="View immutable provisioning audit log"
            >
              <FileText size={15} className="text-[#0B1F3A]" />
              <span>Audit Trail</span>
            </button>
            <button
              onClick={() => {
                setCreateForm(initialCreateForm);
                setCreateErrors({});
                if (branches.length > 0) {
                  setCreateForm((p) => ({ ...p, branchId: branches[0].id }));
                }
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132F58] text-white text-xs font-bold transition-all shadow-sm border border-[#D4AF37]/50 active:scale-95 cursor-pointer"
            >
              <UserPlus size={15} className="text-[#D4AF37]" />
              <span>+ Create Staff Profile</span>
            </button>
          </div>
        }
      />

      {/* ── Metric Highlights ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Staff</div>
          <div className="text-xl font-black text-[#0B1F3A] mt-1 tabular-nums">{totalProfiles}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">● {stats.active} Active accounts</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">HR Managers</div>
          <div className="text-xl font-black text-amber-900 mt-1 tabular-nums">{stats.hr}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Company-Wide Scope</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Branch Managers</div>
          <div className="text-xl font-black text-blue-900 mt-1 tabular-nums">{stats.bm}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Branch Assigned</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Credit Managers</div>
          <div className="text-xl font-black text-purple-900 mt-1 tabular-nums">{stats.cm}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Risk & Underwriting</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Field Officers (CRO)</div>
          <div className="text-xl font-black text-emerald-900 mt-1 tabular-nums">{stats.cro}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Collections & Routes</div>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full min-w-0">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Name, Username (@), Employee ID or Email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 focus:border-[#0B1F3A] focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none transition-all"
          />
        </div>

        {/* Role & Status Filters */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial min-w-[140px]">
            <Filter size={14} className="text-slate-400 shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 focus:border-[#0B1F3A] text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Super Administrator</option>
              <option value="HR">HR & Payroll Manager</option>
              <option value="BRANCH_MANAGER">Branch Manager</option>
              <option value="CREDIT_MANAGER">Credit Manager</option>
              <option value="CRO">Customer Relationship Officer (CRO)</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 focus:border-[#0B1F3A] text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Profiles List Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-[#0B1F3A] px-5 py-3.5 border-b border-slate-700/30 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
            <h3 className="text-xs font-bold tracking-wider uppercase font-sans">Staff Login Profiles Directory</h3>
          </div>
          <span className="text-[11px] text-slate-300 font-semibold tabular-nums">
            {totalProfiles} {totalProfiles === 1 ? 'Record' : 'Records'}
          </span>
        </div>

        <div className="overflow-x-auto w-full custom-scrollbar">
          {profiles.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-3">
                <UserCheck size={22} className="text-[#0B1F3A]" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No staff profiles found</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'No profiles match your active search filters.'
                  : 'No staff profiles have been created yet. Click "+ Create Staff Profile" to provision the first account.'}
              </p>
              <button
                onClick={() => {
                  setCreateForm(initialCreateForm);
                  setCreateErrors({});
                  if (branches.length > 0) {
                    setCreateForm((p) => ({ ...p, branchId: branches[0].id }));
                  }
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#132F58] text-white text-xs font-bold transition-all shadow-sm border border-[#D4AF37]/50 cursor-pointer"
              >
                <UserPlus size={14} className="text-[#D4AF37]" />
                <span>+ Create Staff Profile</span>
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Branch Assignment</th>
                  <th className="py-3 px-4">Login Username</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.map((p) => {
                  const meta = STAFF_ROLE_META[p.role];
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Employee ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-[11px]">
                          {p.employeeId}
                        </span>
                      </td>

                      {/* Staff Member */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-[13px]">{p.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{p.email}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">+91 {p.mobile}</div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border tracking-wide uppercase ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </td>

                      {/* Branch Assignment */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Building2 size={13} className="text-slate-400 shrink-0" />
                          <span>{p.branchName || (p.role === 'HR' ? 'Corporate HQ (All Branches)' : 'Unassigned')}</span>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        <span className="text-[#0B1F3A] font-bold">@{p.username}</span>
                        {p.mustChangePassword && (
                          <span
                            className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
                            title="Staff must change password upon next login"
                          >
                            Must Change Pwd
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                            p.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                          }`}
                          title={p.status === 'active' ? 'Click to Deactivate' : 'Click to Activate'}
                        >
                          {p.status === 'active' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          <span className="uppercase">{p.status}</span>
                        </button>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                            title="Edit Profile Details"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleOpenReset(p)}
                            className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-50 border border-amber-200 transition-all cursor-pointer"
                            title="Reset Staff Password"
                          >
                            <Key size={13} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProfile(p);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-900 hover:bg-rose-50 border border-rose-200 transition-all cursor-pointer"
                            title="Soft Delete Profile"
                          >
                            <Trash2 size={13} />
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

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. CREATE STAFF PROFILE MODAL                               */}
      {/* ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-6"
            >
              <div className="bg-[#0B1F3A] px-6 py-4.5 text-white flex items-center justify-between border-b border-[#D4AF37]/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-wide">Create New Staff Login Profile</h3>
                    <p className="text-[11px] text-slate-300 mt-0.5">Admin-Only Institutional Account Provisioning</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={createForm.fullName}
                      onChange={(e) => {
                        setCreateForm((p) => ({ ...p, fullName: e.target.value }));
                        validateCreateField('fullName', e.target.value);
                      }}
                      placeholder="e.g. Ramesh Sundaram"
                      className={`w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs font-semibold focus:bg-white focus:outline-none ${
                        createErrors.fullName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-[#0B1F3A]'
                      }`}
                    />
                    {createErrors.fullName && (
                      <p className="text-[11px] text-rose-500 font-semibold mt-1">{createErrors.fullName}</p>
                    )}
                  </div>

                  {/* Employee ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Employee ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={createForm.employeeId}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setCreateForm((p) => ({ ...p, employeeId: val }));
                        validateCreateField('employeeId', val);
                      }}
                      placeholder="e.g. EMP-101"
                      className={`w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs font-mono font-semibold focus:bg-white focus:outline-none ${
                        createErrors.employeeId ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-[#0B1F3A]'
                      }`}
                    />
                    {createErrors.employeeId && (
                      <p className="text-[11px] text-rose-500 font-semibold mt-1">{createErrors.employeeId}</p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => {
                        setCreateForm((p) => ({ ...p, email: e.target.value }));
                        validateCreateField('email', e.target.value);
                      }}
                      placeholder="e.g. ramesh@goldenleaf.finance"
                      className={`w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs font-semibold focus:bg-white focus:outline-none ${
                        createErrors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-[#0B1F3A]'
                      }`}
                    />
                    {createErrors.email && (
                      <p className="text-[11px] text-rose-500 font-semibold mt-1">{createErrors.email}</p>
                    )}
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number (10 Digits) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={createForm.mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setCreateForm((p) => ({ ...p, mobile: val }));
                        validateCreateField('mobile', val);
                      }}
                      placeholder="e.g. 9840123456"
                      className={`w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs font-mono font-semibold focus:bg-white focus:outline-none ${
                        createErrors.mobile ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-[#0B1F3A]'
                      }`}
                    />
                    {createErrors.mobile && (
                      <p className="text-[11px] text-rose-500 font-semibold mt-1">{createErrors.mobile}</p>
                    )}
                  </div>

                  {/* Staff Role */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Staff Role <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={createForm.role}
                      onChange={(e) => {
                        const r = e.target.value as StaffRole;
                        setCreateForm((p) => ({ ...p, role: r }));
                        if (r === 'ADMIN' || r === 'HR') {
                          setCreateErrors((prev) => {
                            const n = { ...prev };
                            delete n.branchId;
                            return n;
                          });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#0B1F3A] focus:outline-none cursor-pointer"
                    >
                      <option value="ADMIN">Super Administrator (Full Admin Authority)</option>
                      <option value="HR">HR & Payroll Finance Manager</option>
                      <option value="BRANCH_MANAGER">Branch Manager</option>
                      <option value="CREDIT_MANAGER">Credit Manager</option>
                      <option value="CRO">Customer Relationship Officer (CRO)</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">{STAFF_ROLE_META[createForm.role].description}</p>
                  </div>

                  {/* Branch Assignment */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Branch Assignment{' '}
                      {createForm.role === 'ADMIN' || createForm.role === 'HR' ? (
                        <span className="text-slate-400 font-normal">(Optional for Admin & HR)</span>
                      ) : (
                        <span className="text-rose-500">*</span>
                      )}
                    </label>
                    <select
                      value={createForm.branchId || ''}
                      onChange={(e) => {
                        setCreateForm((p) => ({ ...p, branchId: e.target.value }));
                        validateCreateField('branchId', e.target.value);
                      }}
                      className={`w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none cursor-pointer ${
                        createErrors.branchId ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-[#0B1F3A]'
                      }`}
                    >
                      {createForm.role === 'HR' && <option value="">Corporate HQ (All Branches)</option>}
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                    {createErrors.branchId && (
                      <p className="text-[11px] text-rose-500 font-semibold mt-1">{createErrors.branchId}</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 mt-2">
                  <h4 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-3">
                    Institutional Login Credentials
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Username */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Username <span className="text-rose-500">*</span>{' '}
                        <span className="text-[10px] text-slate-400 font-normal">(4-20 chars, no spaces)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">
                          @
                        </span>
                        <input
                          type="text"
                          value={createForm.username}
                          onChange={(e) => {
                            const val = e.target.value.toLowerCase().replace(/\s/g, '');
                            setCreateForm((p) => ({ ...p, username: val }));
                            validateCreateField('username', val);
                          }}
                          placeholder="e.g. staff.username"
                          className={`w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border text-xs font-mono font-semibold focus:bg-white focus:outline-none ${
                            createErrors.username
                              ? 'border-rose-400 bg-rose-50/30'
                              : 'border-slate-300 focus:border-[#0B1F3A]'
                          }`}
                        />
                      </div>
                      {createErrors.username && (
                        <p className="text-[11px] text-rose-500 font-semibold mt-1">{createErrors.username}</p>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                      <div className="flex items-center gap-3 mt-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                          <input
                            type="radio"
                            name="status"
                            checked={createForm.status === 'active'}
                            onChange={() => setCreateForm((p) => ({ ...p, status: 'active' }))}
                            className="text-[#0B1F3A]"
                          />
                          <span>Active</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                          <input
                            type="radio"
                            name="status"
                            checked={createForm.status === 'inactive'}
                            onChange={() => setCreateForm((p) => ({ ...p, status: 'inactive' }))}
                            className="text-[#0B1F3A]"
                          />
                          <span>Inactive (Locked)</span>
                        </label>
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Password <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateCreatePassword}
                          className="text-[11px] font-bold text-amber-800 hover:text-amber-900 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles size={12} className="text-amber-600" />
                          <span>Generate Strong</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showCreatePassword ? 'text' : 'password'}
                          value={createForm.password}
                          onChange={(e) => {
                            setCreateForm((p) => ({ ...p, password: e.target.value }));
                            validateCreateField('password', e.target.value);
                          }}
                          placeholder="Min 8 chars, Aa, 123, !@#"
                          className={`w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 border text-xs font-mono font-semibold focus:bg-white focus:outline-none ${
                            createErrors.password
                              ? 'border-rose-400 bg-rose-50/30'
                              : 'border-slate-300 focus:border-[#0B1F3A]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCreatePassword((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showCreatePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {createErrors.password && (
                        <p className="text-[11px] text-rose-500 font-semibold mt-1">{createErrors.password}</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Confirm Password <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type={showCreatePassword ? 'text' : 'password'}
                        value={createForm.confirmPassword}
                        onChange={(e) => {
                          setCreateForm((p) => ({ ...p, confirmPassword: e.target.value }));
                          validateCreateField('confirmPassword', e.target.value);
                        }}
                        placeholder="Retype password"
                        className={`w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs font-mono font-semibold focus:bg-white focus:outline-none ${
                          createErrors.confirmPassword
                            ? 'border-rose-400 bg-rose-50/30'
                            : 'border-slate-300 focus:border-[#0B1F3A]'
                        }`}
                      />
                      {createErrors.confirmPassword && (
                        <p className="text-[11px] text-rose-500 font-semibold mt-1">{createErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="mustChangePassword"
                      checked={createForm.mustChangePassword}
                      onChange={(e) => setCreateForm((p) => ({ ...p, mustChangePassword: e.target.checked }))}
                      className="rounded text-[#0B1F3A] cursor-pointer"
                    />
                    <label htmlFor="mustChangePassword" className="text-xs text-slate-600 font-medium cursor-pointer">
                      Force staff member to change password upon initial login (Recommended)
                    </label>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCreate}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132F58] text-white text-xs font-bold transition-all shadow-sm border border-[#D4AF37]/50 disabled:opacity-50 cursor-pointer"
                  >
                    <UserPlus size={14} className="text-[#D4AF37]" />
                    <span>{isSubmittingCreate ? 'Provisioning...' : 'Provision Staff Profile'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. ONE-TIME CREDENTIALS REVEAL MODAL                        */}
      {/* ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCredentialsModal && revealedCredentials && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="bg-[#0B1F3A] px-6 py-5 text-white flex items-center justify-between border-b border-[#D4AF37]/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base tracking-wide">
                      {revealedCredentials.actionType === 'CREATED'
                        ? 'Staff Profile Provisioned!'
                        : 'Staff Password Reset!'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">One-time plain text credential handover</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCredentialsModal(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2.5 font-sans">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs text-slate-500">Staff Member:</span>
                    <span className="text-xs font-bold text-slate-900">{revealedCredentials.profile.fullName}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs text-slate-500">Employee ID:</span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {revealedCredentials.profile.employeeId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs text-slate-500">Assigned Role:</span>
                    <span className="text-xs font-bold text-slate-900">
                      {STAFF_ROLE_META[revealedCredentials.profile.role].label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs text-slate-500">Branch:</span>
                    <span className="text-xs font-semibold text-slate-900">
                      {revealedCredentials.profile.branchName || 'Corporate HQ'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs text-slate-500 font-semibold">Login Username:</span>
                    <span className="text-xs font-mono font-black text-[#0B1F3A] bg-slate-200/60 px-2 py-0.5 rounded">
                      @{revealedCredentials.profile.username}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500 font-semibold">Login Password:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                        {showRevealedPassword ? revealedCredentials.plainPassword : '••••••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowRevealedPassword((p) => !p)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700"
                      >
                        {showRevealedPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                  <button
                    onClick={handleCopyAllCredentials}
                    className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-950 border border-amber-300 font-bold text-xs transition-all cursor-pointer"
                  >
                    {copiedKey ? <Check size={15} className="text-emerald-700" /> : <Copy size={15} />}
                    <span>{copiedKey ? 'Credentials Copied!' : 'Copy Credential Memo'}</span>
                  </button>

                  <button
                    onClick={() => setShowCredentialsModal(false)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132F58] text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    Done & Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. EDIT STAFF PROFILE MODAL                                 */}
      {/* ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showEditModal && selectedProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="bg-[#0B1F3A] px-6 py-4.5 text-white flex items-center justify-between border-b border-[#D4AF37]/30">
                <div className="flex items-center gap-2">
                  <Edit2 size={16} className="text-[#D4AF37]" />
                  <h3 className="font-bold text-sm">Edit Profile (@{selectedProfile.username})</h3>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.fullName || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[#0B1F3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[#0B1F3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={editForm.mobile || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, '') }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-semibold focus:outline-none focus:border-[#0B1F3A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Staff Role</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value as StaffRole }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      <option value="ADMIN">Super Administrator</option>
                      <option value="HR">HR Manager</option>
                      <option value="BRANCH_MANAGER">Branch Manager</option>
                      <option value="CREDIT_MANAGER">Credit Manager</option>
                      <option value="CRO">CRO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Branch</label>
                    <select
                      value={editForm.branchId || ''}
                      onChange={(e) => setEditForm((p) => ({ ...p, branchId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      {editForm.role === 'HR' && <option value="">Corporate HQ</option>}
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132F58] text-white text-xs font-bold cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 4. RESET PASSWORD MODAL                                     */}
      {/* ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showResetModal && selectedProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-[#0B1F3A] px-6 py-4.5 text-white flex items-center justify-between border-b border-[#D4AF37]/30">
                <div className="flex items-center gap-2">
                  <Key size={16} className="text-[#D4AF37]" />
                  <h3 className="font-bold text-sm">Reset Password (@{selectedProfile.username})</h3>
                </div>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
                <div className="text-xs text-slate-500">
                  Setting a new password will force <strong>@{selectedProfile.username}</strong> to change it on their
                  next login.
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">New Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        const g = generateStrongPassword();
                        setResetPasswordVal(g);
                        setResetConfirmVal(g);
                        setShowResetPassword(true);
                      }}
                      className="text-[11px] font-bold text-amber-800 hover:text-amber-900 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles size={12} className="text-amber-600" />
                      <span>Generate Strong</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      value={resetPasswordVal}
                      onChange={(e) => setResetPasswordVal(e.target.value)}
                      className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-semibold focus:outline-none focus:border-[#0B1F3A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showResetPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={resetConfirmVal}
                    onChange={(e) => setResetConfirmVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-semibold focus:outline-none focus:border-[#0B1F3A]"
                  />
                </div>

                {resetError && <p className="text-xs text-rose-500 font-semibold">{resetError}</p>}

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Reset & Reveal Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 5. SOFT DELETE CONFIRMATION MODAL                            */}
      {/* ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteModal && selectedProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} />
              </div>
              <h3 className="font-bold text-base text-slate-900">Delete Staff Profile?</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Are you sure you want to delete profile for <strong>{selectedProfile.fullName}</strong> (@
                {selectedProfile.username})? This is an institutional soft-delete; the login access will be immediately
                revoked.
              </p>
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 6. IMMUTABLE AUDIT TRAIL MODAL                              */}
      {/* ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAuditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden"
            >
              <div className="bg-[#0B1F3A] px-6 py-4.5 text-white flex items-center justify-between border-b border-[#D4AF37]/30">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[#D4AF37]" />
                  <h3 className="font-bold text-sm">Staff Provisioning Audit Trail (Append-Only)</h3>
                </div>
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {auditLogs.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-8">No audit events recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-[#0B1F3A]">
                            @{log.targetUsername} — <span className="text-amber-800">{log.action}</span>
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {new Date(log.timestamp).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Actor: <strong>{log.actorRole}</strong> ({log.actorId}) • IP: {log.ipAddress}
                        </div>
                        {log.newValue && (
                          <pre className="mt-1.5 p-2 rounded-xl bg-slate-100 text-[10.5px] font-mono text-slate-700 overflow-x-auto">
                            {JSON.stringify(log.newValue, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StaffProfileManagementPage;

