// ──────────────────────────────────────────────────
// Golden Leaf Finance — Leave & On-Duty (OD) Management Panel
// Integrated with Staff Attendance for CRO, Credit Manager, and Branch Manager
// Multi-Tier Hierarchy:
// - CRO & Credit Manager -> Approved by Branch Manager
// - Branch Manager -> Granted by System Admin
// - Admin -> Review & grant approvals (Admin does not apply for leave)
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Send,
  X,
  Palmtree,
  Car,
  Briefcase,
  User,
  ShieldCheck,
  Building2,
  FileText,
  Filter,
  Check,
  MessageSquare,
  HelpCircle,
  Phone,
  MapPin,
  ChevronRight,
  TrendingUp,
  Inbox,
  UserCheck,
  Shield,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import type { UserRole } from '../../types';
import {
  getStoredLeaveRequests,
  submitLeaveODRequest,
  approveLeaveODRequest,
  rejectLeaveODRequest,
  cancelLeaveODRequest,
  getLeaveBalance,
  type LeaveODRequest,
  type LeaveCategory,
  type LeaveType,
  type LeaveStatus,
} from '../../services/leaveService';

const LEAVE_TYPES: LeaveType[] = [
  'Casual Leave (CL)',
  'Sick / Medical Leave (SL)',
  'Emergency Leave',
  'Compensatory Off',
];

const OD_TYPES: LeaveType[] = [
  'Field Center Meeting & Collection',
  'Client Onboarding & KYC Field Audit',
  'Recovery Drive / Irregular Accounts',
  'Bank Deposit & Cash Transit',
  'Regional / Head Office Training',
  'Legal / Court Hearing',
  'Other Official Duty',
];

export const LeaveODPanel: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);

  const userRole = (user?.customClaims?.role || 'collection_agent') as UserRole;
  const isAdmin = userRole === 'admin';
  const isHR = userRole === 'hr_payroll_manager';
  const isBranchManager = userRole === 'branch_manager';
  const isCreditManager = userRole === 'credit_manager';
  const isCRO = userRole === 'collection_agent';

  // State
  const [records, setRecords] = useState<LeaveODRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'my_requests' | 'approvals'>(
    isAdmin || isHR ? 'approvals' : 'my_requests'
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal: Apply Leave/OD
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [category, setCategory] = useState<LeaveCategory>('LEAVE');
  const [leaveType, setLeaveType] = useState<LeaveType>('Casual Leave (CL)');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState<'Morning' | 'Afternoon'>('Morning');
  const [reason, setReason] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [emergencyContact, setEmergencyContact] = useState(user?.phoneNumber || '+91 98401 22334');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal: Action Remarks (Approval / Rejection)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'APPROVE' | 'REJECT';
    request: LeaveODRequest | null;
    remarks: string;
  }>({
    isOpen: false,
    type: 'APPROVE',
    request: null,
    remarks: '',
  });

  // Load records
  const loadData = () => {
    setRecords(getStoredLeaveRequests());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('glf_leave_updated', handleUpdate);
    return () => window.removeEventListener('glf_leave_updated', handleUpdate);
  }, []);

  // Current employee identity
  const employeeId = useMemo(() => {
    if (userRole === 'collection_agent') return 'EMP-004';
    if (userRole === 'branch_manager') return 'EMP-002';
    if (userRole === 'credit_manager') return 'EMP-010';
    return user?.uid || 'EMP-001';
  }, [userRole, user?.uid]);

  const employeeName = useMemo(() => {
    if (user?.displayName && user.displayName.trim().toLowerCase() !== 'agent') {
      return user.displayName;
    }
    return user?.email?.split('@')[0] || 'Authorized Staff';
  }, [user?.displayName, user?.email]);

  const roleTitle = useMemo(() => {
    if (userRole === 'collection_agent') return 'Customer Relationship Officer (CRO)';
    if (userRole === 'branch_manager') return 'Branch Manager';
    if (userRole === 'credit_manager') return 'Credit Manager';
    return 'Staff Official';
  }, [userRole]);

  const branchId = user?.customClaims?.branchId || 'BR-01';
  const branchName = 'Main Branch - Anna Nagar';

  // Balances
  const balances = useMemo(() => getLeaveBalance(employeeId), [employeeId, records]);

  // Filtered "My Requests"
  const myRequests = useMemo(() => {
    return records.filter((r) => {
      // Show user's own requests
      const isOwner = r.employeeId === employeeId || r.employeeName.toLowerCase() === employeeName.toLowerCase();
      if (!isOwner) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      return true;
    });
  }, [records, employeeId, employeeName, statusFilter, categoryFilter]);

  // Filtered "Pending Approvals" for Managers & Admin & HR
  const pendingApprovals = useMemo(() => {
    return records.filter((r) => {
      if (isAdmin || isHR) {
        // Admin and HR & Payroll Manager can approve all requests company-wide
        if (statusFilter === 'all') return r.status === 'PENDING_ADMIN' || r.status === 'PENDING_BRANCH_MANAGER';
        return r.status === statusFilter;
      }
      if (isBranchManager) {
        // Branch Manager approves CRO & Credit Manager requests in their branch
        const isEligibleRole = r.role === 'collection_agent' || r.role === 'credit_manager';
        if (!isEligibleRole) return false;
        // Check branch match
        const isSameBranch = r.branchId === branchId || r.branchName.includes('Anna Nagar');
        if (!isSameBranch) return false;
        if (statusFilter === 'all') return r.status === 'PENDING_BRANCH_MANAGER';
        return r.status === statusFilter;
      }
      return false;
    });
  }, [records, isAdmin, isHR, isBranchManager, branchId, statusFilter]);

  // Pending count badge
  const pendingCount = useMemo(() => {
    if (isAdmin || isHR) {
      return records.filter(
        (r) => r.status === 'PENDING_ADMIN' || r.status === 'PENDING_BRANCH_MANAGER'
      ).length;
    }
    if (isBranchManager) {
      return records.filter(
        (r) =>
          (r.role === 'collection_agent' || r.role === 'credit_manager') &&
          r.status === 'PENDING_BRANCH_MANAGER'
      ).length;
    }
    return 0;
  }, [records, isAdmin, isHR, isBranchManager]);

  // Duration calculation
  const calculatedDuration = useMemo(() => {
    if (isHalfDay) return 0.5;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return 1;
    const diffDays = Math.round((end - start) / (1000 * 3600 * 24)) + 1;
    return Math.max(1, diffDays);
  }, [startDate, endDate, isHalfDay]);

  // Switch category updates default leave type
  const handleCategorySwitch = (cat: LeaveCategory) => {
    setCategory(cat);
    if (cat === 'LEAVE') {
      setLeaveType(LEAVE_TYPES[0]);
    } else {
      setLeaveType(OD_TYPES[0]);
    }
  };

  // Submit Application
  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      addToast({
        type: 'warning',
        title: 'Reason Required',
        message: 'Please provide a comment explaining why you are taking leave or on duty.',
      });
      return;
    }

    if (reason.trim().length < 10) {
      addToast({
        type: 'warning',
        title: 'Detailed Reason Required',
        message: 'Please provide at least 10 characters explaining your operational reason.',
      });
      return;
    }

    // Policy check: Max 12 days annual leave
    if (category === 'LEAVE') {
      const remainingQuota = balances.totalAnnualLeave.remaining;
      if (calculatedDuration > remainingQuota) {
        addToast({
          type: 'warning',
          title: 'Exceeds Annual Leave Quota',
          message: `You only have ${remainingQuota} day(s) of annual leave available out of your 12 days yearly entitlement.`,
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      submitLeaveODRequest({
        employeeId,
        employeeName,
        role: userRole,
        roleTitle,
        branchId,
        branchName,
        category,
        leaveType,
        startDate,
        endDate: isHalfDay ? startDate : endDate,
        durationDays: calculatedDuration,
        isHalfDay,
        halfDaySession: isHalfDay ? halfDaySession : undefined,
        reason: reason.trim(),
        destinationLocation: category === 'OD' ? destinationLocation.trim() || undefined : undefined,
        emergencyContact: emergencyContact.trim() || undefined,
      });

      addToast({
        type: 'success',
        title: `${category === 'LEAVE' ? 'Leave' : 'On-Duty'} Application Submitted`,
        message: isBranchManager
          ? 'Application forwarded to Head Office Admin for permission.'
          : 'Application forwarded to Branch Manager for confirmation.',
      });

      // Reset and close
      setIsApplyModalOpen(false);
      setReason('');
      setDestinationLocation('');
      setIsHalfDay(false);
    } catch (err) {
      console.error('Failed to submit leave request:', err);
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: 'Could not register application. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action handlers
  const handleOpenActionModal = (req: LeaveODRequest, type: 'APPROVE' | 'REJECT') => {
    setActionModal({
      isOpen: true,
      type,
      request: req,
      remarks: type === 'APPROVE' ? 'Approved and authorized for duty schedule.' : '',
    });
  };

  const handleConfirmAction = () => {
    if (!actionModal.request) return;

    const approverName = employeeName;
    const approverRoleTitle = roleTitle;

    if (actionModal.type === 'APPROVE') {
      approveLeaveODRequest(
        actionModal.request.id,
        approverName,
        approverRoleTitle,
        actionModal.remarks.trim() || 'Approved and authorized for duty schedule.'
      );
      addToast({
        type: 'success',
        title: 'Application Approved',
        message: `${actionModal.request.employeeName}'s ${actionModal.request.category} request has been confirmed.`,
      });
    } else {
      if (!actionModal.remarks.trim()) {
        addToast({
          type: 'warning',
          title: 'Rejection Reason Required',
          message: 'Please provide comments stating why the request is rejected.',
        });
        return;
      }
      rejectLeaveODRequest(
        actionModal.request.id,
        approverName,
        approverRoleTitle,
        actionModal.remarks.trim()
      );
      addToast({
        type: 'info',
        title: 'Application Rejected',
        message: `${actionModal.request.employeeName}'s ${actionModal.request.category} request was rejected.`,
      });
    }

    setActionModal({ isOpen: false, type: 'APPROVE', request: null, remarks: '' });
  };

  const handleCancelMyRequest = (requestId: string) => {
    if (window.confirm('Are you sure you want to withdraw this application?')) {
      cancelLeaveODRequest(requestId);
      addToast({
        type: 'info',
        title: 'Application Withdrawn',
        message: 'Your request has been cancelled.',
      });
    }
  };

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'PENDING_BRANCH_MANAGER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock size={11} className="text-amber-600 animate-pulse" />
            Pending Branch Manager
          </span>
        );
      case 'PENDING_ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <Clock size={11} className="text-purple-600 animate-pulse" />
            Pending Admin Permission
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={11} className="text-emerald-600" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle size={11} className="text-rose-600" />
            Rejected
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Withdrawn
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── 1. LEAVE BALANCES CARDS (TOTAL 12 DAYS ANNUAL LEAVE POLICY) ── */}
      {!isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Annual Leave */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-[0_2px_8px_rgba(11,31,58,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider font-sans">Total Annual Leave</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/70">
                <Calendar size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#0B1F3A] font-manrope">
                  {balances.totalAnnualLeave.remaining}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  / {balances.totalAnnualLeave.total} Days Available
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(balances.totalAnnualLeave.used / balances.totalAnnualLeave.total) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-1.5">
                Yearly Quota: 12 Days Total (1 Day / Month)
              </span>
            </div>
          </div>

          {/* Card 2: Casual Leave */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-[0_2px_8px_rgba(11,31,58,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider font-sans">Casual Leave (CL)</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/70">
                <Palmtree size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#0B1F3A] font-manrope">
                  {balances.casualLeave.remaining}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  / {balances.casualLeave.total} Days Available
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(balances.casualLeave.used / balances.casualLeave.total) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-1.5">
                Allocation: 6 Days / Year
              </span>
            </div>
          </div>

          {/* Card 3: Sick Leave */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-[0_2px_8px_rgba(11,31,58,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider font-sans">Sick Leave (SL)</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/70">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#0B1F3A] font-manrope">
                  {balances.sickLeave.remaining}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  / {balances.sickLeave.total} Days Available
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(balances.sickLeave.used / balances.sickLeave.total) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-1.5">
                Allocation: 6 Days / Year
              </span>
            </div>
          </div>

          {/* Card 4: On Duty (OD) Logged */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-[0_2px_8px_rgba(11,31,58,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider font-sans">On Duty (OD) Active</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/70">
                <Car size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#0B1F3A] font-manrope">
                  {balances.onDutyDaysThisMonth}
                </span>
                <span className="text-xs font-semibold text-slate-400">Days Authorized (This Month)</span>
              </div>
              <p className="text-[11px] text-purple-700 font-semibold mt-2 flex items-center gap-1">
                <Briefcase size={11} /> Field Duty & Center Recovery
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. HEADER BAR ── */}
      <div className="bg-gradient-to-r from-[#0B1F3A] to-[#162D4A] rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 text-[#D4AF37] flex items-center justify-center shrink-0 border border-white/15">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Leave & On Duty (OD) Authorizations
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Review and process employee leave applications and on-duty requests.
            </p>
          </div>
        </div>

        {/* Action Button: Apply Leave (Not for Admin) */}
        {!isAdmin && (
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#E5C158] hover:to-[#B8860B] text-[#0B1F3A] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(212,175,55,0.35)] hover:shadow-lg transition-all cursor-pointer shrink-0 active:scale-[0.98]"
          >
            <Plus size={15} strokeWidth={2.8} />
            <span>Apply Leave / OD</span>
          </button>
        )}
      </div>

      {/* ── 3. MAIN SECTION WITH TABS ── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Navigation Switcher Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {!isAdmin && (
              <button
                onClick={() => setActiveTab('my_requests')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'my_requests'
                    ? 'bg-[#0B1F3A] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <User size={14} />
                <span>My Applications ({myRequests.length})</span>
              </button>
            )}

            {(isBranchManager || isAdmin) && (
              <button
                onClick={() => setActiveTab('approvals')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
                  activeTab === 'approvals'
                    ? 'bg-[#0B1F3A] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <UserCheck size={14} />
                <span>
                  {isAdmin ? 'Branch Manager Approvals' : 'Branch Staff Approvals'}
                </span>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse">
                    {pendingCount} Pending
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Types (Leave & OD)</option>
              <option value="LEAVE">Leave Only</option>
              <option value="OD">On Duty (OD) Only</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING_BRANCH_MANAGER">Pending Branch Manager</option>
              <option value="PENDING_ADMIN">Pending Admin</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6">
          {/* TAB 1: MY REQUESTS */}
          {activeTab === 'my_requests' && !isAdmin && (
            <div>
              {myRequests.length === 0 ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
                    <Inbox size={26} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">No Leave / OD applications found</h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    You haven't submitted any leave or on-duty requests under the selected filter.
                  </p>
                  <button
                    onClick={() => setIsApplyModalOpen(true)}
                    className="mt-2 px-4 py-2 rounded-xl bg-[#0B1F3A] text-white text-xs font-bold hover:bg-[#162D4A] transition-all cursor-pointer"
                  >
                    Submit New Application
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-[0_2px_8px_rgba(11,31,58,0.02)] flex flex-col gap-3.5"
                    >
                      {/* Top Row: ID, Category Badge, Dates, Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[#0B1F3A] bg-slate-100 px-2 py-0.5 rounded-md">
                            {req.id}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                              req.category === 'OD'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {req.category === 'OD' ? <Car size={11} /> : <Palmtree size={11} />}
                            {req.category}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{req.leaveType}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {getStatusBadge(req.status)}
                          {(req.status === 'PENDING_BRANCH_MANAGER' || req.status === 'PENDING_ADMIN') && (
                            <button
                              onClick={() => handleCancelMyRequest(req.id)}
                              className="text-[11px] text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                            >
                              Withdraw
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Middle Row: Duration & Registered Comment Section */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Dates info */}
                        <div className="md:col-span-4 text-xs space-y-1.5">
                          <div className="flex items-center gap-2 text-slate-500">
                            <Calendar size={13} className="text-slate-400 shrink-0" />
                            <span>
                              {req.startDate} {req.startDate !== req.endDate ? `to ${req.endDate}` : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-700 font-semibold">
                            <Clock size={13} className="text-slate-400 shrink-0" />
                            <span>
                              {req.durationDays} Day{req.durationDays > 1 ? 's' : ''}{' '}
                              {req.isHalfDay ? `(${req.halfDaySession} Session)` : 'Full Day'}
                            </span>
                          </div>
                          {req.destinationLocation && (
                            <div className="flex items-center gap-2 text-purple-700 font-semibold">
                              <MapPin size={13} className="shrink-0" />
                              <span className="truncate">{req.destinationLocation}</span>
                            </div>
                          )}
                          <div className="text-[11px] text-slate-400">
                            Applied on {req.appliedAtDisplay}
                          </div>
                        </div>

                        {/* Registered Comment / Reason */}
                        <div className="md:col-span-8 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                            <MessageSquare size={12} className="text-[#D4AF37]" />
                            Registered Reason & Justification
                          </span>
                          <p className="text-xs text-slate-700 italic leading-relaxed">
                            "{req.reason}"
                          </p>
                        </div>
                      </div>

                      {/* Bottom Row: Approval confirmation or notes */}
                      {(req.approvedBy || req.approvalRemarks) && (
                        <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/70 flex items-start gap-2.5 text-xs text-emerald-900">
                          <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-1 font-bold">
                              <span>Decision by {req.approvedBy}</span>
                              {req.actionedAtDisplay && (
                                <span className="text-[10.5px] font-normal text-emerald-700">
                                  {req.actionedAtDisplay}
                                </span>
                              )}
                            </div>
                            {req.approvalRemarks && (
                              <p className="mt-1 text-emerald-800 text-[11.5px]">{req.approvalRemarks}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APPROVALS (FOR BRANCH MANAGER & ADMIN) */}
          {(activeTab === 'approvals' || isAdmin) && (
            <div>
              {pendingApprovals.length === 0 ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
                    <CheckCircle2 size={26} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">
                    No pending requests requiring approval
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    {isAdmin
                      ? 'All Branch Manager leave and OD applications have been reviewed.'
                      : 'All CRO and Credit Manager requests in this branch have been actioned.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((req) => (
                    <div
                      key={req.id}
                      className="p-5 rounded-2xl border-2 border-slate-200 bg-white hover:border-[#D4AF37]/50 transition-all shadow-xs flex flex-col gap-4"
                    >
                      {/* Header with Applicant info */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-sm">
                            {req.employeeName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-extrabold text-[#0B1F3A]">{req.employeeName}</h4>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                                {req.employeeId}
                              </span>
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                {req.roleTitle}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <Building2 size={12} className="text-slate-400" />
                              {req.branchName} • Applied on {req.appliedAtDisplay}
                            </p>
                          </div>
                        </div>

                        {/* Status */}
                        <div>{getStatusBadge(req.status)}</div>
                      </div>

                      {/* Request details & Registered comment */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60 text-xs space-y-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Application Type
                            </span>
                            <strong className="text-slate-800 block mt-0.5 font-bold">
                              {req.leaveType} ({req.category})
                            </strong>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Duration &amp; Schedule
                            </span>
                            <span className="text-slate-700 block font-semibold mt-0.5">
                              {req.startDate} {req.startDate !== req.endDate ? `to ${req.endDate}` : ''}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              Total: {req.durationDays} Day{req.durationDays > 1 ? 's' : ''}{' '}
                              {req.isHalfDay ? `(${req.halfDaySession})` : ''}
                            </span>
                          </div>

                          {req.destinationLocation && (
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Field Location / Center
                              </span>
                              <span className="text-purple-700 font-semibold block mt-0.5">
                                {req.destinationLocation}
                              </span>
                            </div>
                          )}

                          {req.emergencyContact && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                              <Phone size={12} className="text-slate-400" />
                              <span>Emergency Contact: {req.emergencyContact}</span>
                            </div>
                          )}
                        </div>

                        {/* Applicant's Reason Comment */}
                        <div className="md:col-span-8 flex flex-col justify-between bg-amber-50/50 p-4 rounded-xl border border-amber-200/60">
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <MessageSquare size={13} className="text-amber-600" />
                              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                                Registered Reason for Leave / OD
                              </span>
                            </div>
                            <p className="text-xs text-slate-800 leading-relaxed font-medium">
                              "{req.reason}"
                            </p>
                          </div>

                          {/* Approval Actions bar */}
                          {(req.status === 'PENDING_BRANCH_MANAGER' || req.status === 'PENDING_ADMIN') && (
                            <div className="pt-4 mt-3 border-t border-amber-200/60 flex flex-wrap sm:flex-nowrap items-center justify-end gap-2.5">
                              <button
                                onClick={() => handleOpenActionModal(req, 'REJECT')}
                                className="w-full sm:w-auto px-4 py-2.5 min-h-[40px] rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                              >
                                <XCircle size={14} />
                                <span>Reject Request</span>
                              </button>
                              <button
                                onClick={() => handleOpenActionModal(req, 'APPROVE')}
                                className="w-full sm:w-auto px-5 py-2.5 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                              >
                                <Check size={14} strokeWidth={2.8} />
                                <span>Approve &amp; Confirm</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 4. MODAL: APPLY FOR LEAVE / OD (NOT FOR ADMIN) ── */}
      <AnimatePresence>
        {isApplyModalOpen && !isAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-auto max-h-[92dvh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-[#0B1F3A] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 text-[#D4AF37] flex items-center justify-center shrink-0">
                    {category === 'LEAVE' ? <Palmtree size={20} /> : <Car size={20} />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">
                      Apply for {category === 'LEAVE' ? 'Leave' : 'On-Duty (OD)'}
                    </h3>
                    <p className="text-xs text-slate-300">
                      Applicant: {employeeName} ({roleTitle})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsApplyModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 min-h-[36px] min-w-[36px]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmitApplication} className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                {/* 1. Category Switcher: Leave vs On Duty */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Application Type
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleCategorySwitch('LEAVE')}
                      className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        category === 'LEAVE'
                          ? 'bg-white text-[#0B1F3A] shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Palmtree size={15} className={category === 'LEAVE' ? 'text-amber-500' : ''} />
                      <span>Leave (Personal / Medical)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCategorySwitch('OD')}
                      className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        category === 'OD'
                          ? 'bg-white text-[#0B1F3A] shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Car size={15} className={category === 'OD' ? 'text-purple-600' : ''} />
                      <span>On Duty - OD (Field / Official)</span>
                    </button>
                  </div>
                </div>

                {/* 2. Specific Type Dropdown */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    {category === 'LEAVE' ? 'Leave Type' : 'On-Duty Activity Category'}
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#0B1F3A] focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    {(category === 'LEAVE' ? LEAVE_TYPES : OD_TYPES).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Dates & Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (e.target.value > endDate) setEndDate(e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#D4AF37]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      disabled={isHalfDay}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#D4AF37] disabled:bg-slate-100 disabled:text-slate-400"
                      required
                    />
                  </div>
                </div>

                {/* Half Day Option */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isHalfDay}
                      onChange={(e) => setIsHalfDay(e.target.checked)}
                      className="rounded text-[#D4AF37] focus:ring-0 cursor-pointer"
                    />
                    <span>Half-Day Session Only</span>
                  </label>

                  {isHalfDay && (
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 font-semibold">
                      <button
                        type="button"
                        onClick={() => setHalfDaySession('Morning')}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold min-h-[36px] transition-colors ${
                          halfDaySession === 'Morning'
                            ? 'bg-[#0B1F3A] text-white'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        Morning (09 AM - 01:30 PM)
                      </button>
                      <button
                        type="button"
                        onClick={() => setHalfDaySession('Afternoon')}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold min-h-[36px] transition-colors ${
                          halfDaySession === 'Afternoon'
                            ? 'bg-[#0B1F3A] text-white'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        Afternoon (01:30 PM - 06 PM)
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. OD Specific field: Destination */}
                {category === 'OD' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Field Destination / Center / Ward (Required for OD)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Center 04 (Shenoy Nagar) or Madurai Regional HQ"
                      value={destinationLocation}
                      onChange={(e) => setDestinationLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#D4AF37]"
                      required={category === 'OD'}
                    />
                  </div>
                )}

                {/* 5. MANDATORY COMMENT SECTION: WHY TAKING LEAVE / OD */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare size={13} className="text-[#D4AF37]" />
                      Reason &amp; Operational Comments (Mandatory)
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {reason.length} / 500 chars
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    placeholder={
                      category === 'LEAVE'
                        ? 'Detail the specific reason for taking leave (e.g., attending urgent family medical checkup / personal urgent work)...'
                        : 'Detail the operational reason for on-duty activity (e.g., conducting recovery drive in center 03, resolving borrower dispute)...'
                    }
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#D4AF37] resize-none font-medium leading-relaxed"
                    required
                  />
                  <p className="text-[10.5px] text-slate-500 mt-1 italic">
                    This justification will be registered in your official attendance record and reviewed by your approval authority.
                  </p>
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>


                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 min-h-[44px] rounded-xl bg-[#0B1F3A] hover:bg-[#162D4A] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60 active:scale-[0.98]"
                  >
                    <Send size={13} />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Application'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 5. MODAL: ACTION REMARKS (APPROVE / REJECT WITH COMMENTS) ── */}
      <AnimatePresence>
        {actionModal.isOpen && actionModal.request && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden max-h-[92dvh] flex flex-col"
            >
              <div
                className={`p-4 text-white flex items-center justify-between shrink-0 ${
                  actionModal.type === 'APPROVE' ? 'bg-emerald-700' : 'bg-rose-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {actionModal.type === 'APPROVE' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  <h4 className="text-sm font-bold leading-tight">
                    {actionModal.type === 'APPROVE' ? 'Approve & Confirm Request' : 'Reject Request'}
                  </h4>
                </div>
                <button
                  onClick={() => setActionModal({ isOpen: false, type: 'APPROVE', request: null, remarks: '' })}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer min-h-[32px] min-w-[32px]"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto custom-scrollbar flex-1">
                <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-800">
                    {actionModal.request.employeeName} ({actionModal.request.roleTitle})
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    {actionModal.request.leaveType} • {actionModal.request.durationDays} Day(s)
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 italic">
                    Reason: "{actionModal.request.reason}"
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    {actionModal.type === 'APPROVE'
                      ? 'Approval Remarks / Notes (Optional)'
                      : 'Reason for Rejection (Required)'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={
                      actionModal.type === 'APPROVE'
                        ? 'e.g., Authorized. Field duties covered by coworker Subash.'
                        : 'e.g., Rejected due to scheduled month-end collection drive.'
                    }
                    value={actionModal.remarks}
                    onChange={(e) => setActionModal((prev) => ({ ...prev, remarks: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#D4AF37] resize-none font-medium leading-relaxed"
                    required={actionModal.type === 'REJECT'}
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setActionModal({ isOpen: false, type: 'APPROVE', request: null, remarks: '' })}
                    className="px-4 py-2.5 min-h-[40px] rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer flex items-center justify-center active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAction}
                    className={`px-5 py-2.5 min-h-[40px] rounded-xl text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center active:scale-[0.98] ${
                      actionModal.type === 'APPROVE'
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
                        : 'bg-rose-600 hover:bg-rose-700 shadow-sm'
                    }`}
                  >
                    {actionModal.type === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeaveODPanel;
