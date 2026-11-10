// ──────────────────────────────────────────────────
// Golden Leaf Finance — Resignation & Handover Clearance Panel
// 3-Stage Security Gates • Mandatory Portfolio Lock • Live Working-Day Counter
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, ShieldCheck, Lock, UserCheck, AlertTriangle,
  Clock, CheckCircle2, UserX, Printer, Plus, Award,
  ArrowRight, HeartPulse, RefreshCw, Undo2, Users, Briefcase
} from 'lucide-react';
import { resignationService } from '../../services/resignationService';
import {
  type ResignationRecord,
  type ResignationStatus,
  type ResignationCategory,
} from '../../types/resignation.types';
import { useAuthStore, useUIStore } from '../../store';
import { type UserRole } from '../../types';

// Components & Modals
import { NoDuesClearanceModal } from './components/NoDuesClearanceModal';
import { RelievingLetterModal } from './components/RelievingLetterModal';
import { Stage1PortfolioReassignmentModal } from './components/Stage1PortfolioReassignmentModal';
import { ResignationApplicationModal } from './components/ResignationApplicationModal';

export const ResignationExitPanel: React.FC = () => {
  const currentUser = useAuthStore((s) => s.user);
  const userRole = (currentUser?.customClaims?.role || 'admin') as UserRole;
  const { addToast } = useUIStore();

  const isBranchManager = userRole === 'branch_manager';
  const isAdmin = userRole === 'admin';
  const isCreditManager = userRole === 'credit_manager';
  const isCRO = userRole === 'collection_agent';

  // Identity
  const currentEmpId = currentUser?.employeeId || (isCRO ? 'GLF-EMP-004' : isBranchManager ? 'GLF-EMP-002' : 'GLF-EMP-010');

  // State
  const [activeQueueTab, setActiveQueueTab] = useState<'my_exit' | 'stage1_queue' | 'stage2_queue' | 'stage3_queue' | 'all_records'>(
    isAdmin ? 'stage3_queue' : isBranchManager ? 'stage1_queue' : 'my_exit'
  );
  const [records, setRecords] = useState<ResignationRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedForStage1, setSelectedForStage1] = useState<ResignationRecord | null>(null);
  const [selectedForNoDues, setSelectedForNoDues] = useState<ResignationRecord | null>(null);
  const [selectedForRelieving, setSelectedForRelieving] = useState<ResignationRecord | null>(null);

  // Withdraw state
  const [withdrawModalRecord, setWithdrawModalRecord] = useState<ResignationRecord | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');

  // Load data
  const loadData = () => {
    setRecords(resignationService.getResignations());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('glf_resignation_updated', handleUpdate);
    return () => window.removeEventListener('glf_resignation_updated', handleUpdate);
  }, []);

  // Current employee's own resignation
  const myResignation = useMemo(() => {
    return records.find(
      (r) => r.employeeId.toLowerCase() === currentEmpId.toLowerCase() && r.status !== 'WITHDRAWN'
    );
  }, [records, currentEmpId]);

  // Filtered Queues
  const stage1PendingRecords = useMemo(() => {
    return records.filter((r) => r.status === 'SUBMITTED_STAGE_1_PENDING');
  }, [records]);

  const stage2ServingNoticeRecords = useMemo(() => {
    return records.filter((r) => r.status === 'STAGE_1_APPROVED_STAGE_2_PENDING');
  }, [records]);

  const stage3AdminPendingRecords = useMemo(() => {
    return records.filter((r) => r.status === 'STAGE_2_APPROVED_STAGE_3_PENDING');
  }, [records]);

  const relievedRecords = useMemo(() => {
    return records.filter((r) => r.status === 'STAGE_3_APPROVED_RELIEVED');
  }, [records]);

  // Action Handlers
  const handleApproveStage2HR = (rec: ResignationRecord, isWaiver: boolean = false) => {
    try {
      resignationService.approveStage2HR(
        rec.id,
        currentUser?.displayName || 'Divya Natarajan (Head of HR)',
        isWaiver
          ? 'Emergency medical relief approved. Notice working days waived under Clause 8.5.'
          : 'Working days attendance requirement verified 100%. Assets returned.',
        isWaiver
      );
      addToast({
        type: 'success',
        title: 'Stage 2 HR Clearance Approved',
        message: `Forwarded to Head Office Admin for final relieving & login deactivation.`,
      });
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Stage 2 Clearance Failed', message: err.message });
    }
  };

  const handleApproveStage3Admin = (rec: ResignationRecord) => {
    try {
      resignationService.approveStage3Admin(
        rec.id,
        currentUser?.displayName || 'Aravinth Sundaram (Managing Director / Admin)',
        'Final clearance granted. Portal login deactivated and official Relieving Letter issued.'
      );
      addToast({
        type: 'success',
        title: 'Stage 3 Final Clearance Approved',
        message: `Employee ${rec.employeeName} (${rec.employeeId}) marked as RELIEVED (INACTIVE). Official Relieving Letter unlocked.`,
      });
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Stage 3 Clearance Failed', message: err.message });
    }
  };

  const handleExecuteWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawModalRecord || !withdrawReason.trim()) return;

    try {
      resignationService.withdrawResignation(withdrawModalRecord.id, withdrawReason.trim());
      addToast({
        type: 'info',
        title: 'Resignation Withdrawn',
        message: 'Resignation has been cancelled. Employee retained in active status.',
      });
      setWithdrawModalRecord(null);
      setWithdrawReason('');
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Withdrawal Failed', message: err.message });
    }
  };

  const handleSimulateDayPunch = (rec: ResignationRecord) => {
    resignationService.incrementWorkingDay(rec.id);
    addToast({
      type: 'info',
      title: 'Working Day Attendance Logged',
      message: `Logged 1 day for ${rec.employeeName}. Counter updated to ${rec.actualWorkingDaysServed + 1} / ${rec.roleNoticeRequirementDays}.`,
    });
    loadData();
  };

  const getStatusBadge = (status: ResignationStatus) => {
    switch (status) {
      case 'SUBMITTED_STAGE_1_PENDING':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Stage 1: Pending BM Reassignment</span>;
      case 'STAGE_1_APPROVED_STAGE_2_PENDING':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Stage 2: Serving Notice (HR Gate)</span>;
      case 'STAGE_2_APPROVED_STAGE_3_PENDING':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Stage 3: Pending Admin Relieving</span>;
      case 'STAGE_3_APPROVED_RELIEVED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">Relieved (Inactive) • Documents Unlocked</span>;
      case 'WITHDRAWN':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">Withdrawn</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ── Top Header Banner ── */}
      <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1A365D] rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 text-[#D4AF37] flex items-center justify-center shrink-0 border border-white/15">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Employee Separation & Exit Clearance
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Manage handover portfolios, departmental sign-offs, and final exit clearance.
            </p>
          </div>
        </div>

        {/* Action Button: Apply Resignation (Staff) */}
        {!isAdmin && (
          <div className="shrink-0">
            {myResignation ? (
              <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5">
                <Clock size={14} className="text-[#D4AF37]" />
                <span>Notice Active ({myResignation.id})</span>
              </div>
            ) : (
              <button
                onClick={() => setIsApplyModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#E5C158] hover:to-[#B8860B] text-[#0B1F3A] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus size={15} strokeWidth={2.8} />
                <span>Initiate Resignation</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Top-Level KPI Ribbon ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Stage 1 Queue</span>
            <Lock size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-[#0B1F3A] font-manrope">
            {stage1PendingRecords.length}
          </div>
          <div className="text-[11px] text-amber-800 font-semibold mt-0.5">
            Zero Unassigned Customer Lock
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Serving Notice</span>
            <Clock size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-black text-[#0B1F3A] font-manrope">
            {stage2ServingNoticeRecords.length}
          </div>
          <div className="text-[11px] text-blue-800 font-semibold mt-0.5">
            Live Working-Day Countdowns
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Stage 3 Admin Clearance</span>
            <ShieldCheck size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-black text-[#0B1F3A] font-manrope">
            {stage3AdminPendingRecords.length}
          </div>
          <div className="text-[11px] text-purple-800 font-semibold mt-0.5">
            Awaiting Login Deactivation
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Relieved Employees</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[#0B1F3A] font-manrope">
            {relievedRecords.length}
          </div>
          <div className="text-[11px] text-emerald-800 font-semibold mt-0.5">
            Relieving Letters Generated
          </div>
        </div>
      </div>

      {/* ── Main Navigation Switcher Tabs ── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {!isAdmin && (
              <button
                onClick={() => setActiveQueueTab('my_exit')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeQueueTab === 'my_exit'
                    ? 'bg-[#0B1F3A] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>My Exit & Progress</span>
              </button>
            )}

            {(isBranchManager || isAdmin) && (
              <button
                onClick={() => setActiveQueueTab('stage1_queue')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
                  activeQueueTab === 'stage1_queue'
                    ? 'bg-[#0B1F3A] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>Stage 1: Portfolio Transfer</span>
                {stage1PendingRecords.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                    {stage1PendingRecords.length}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setActiveQueueTab('stage2_queue')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
                activeQueueTab === 'stage2_queue'
                  ? 'bg-[#0B1F3A] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Stage 2: Serving Notice</span>
              {stage2ServingNoticeRecords.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black">
                  {stage2ServingNoticeRecords.length}
                </span>
              )}
            </button>

            {(isAdmin || isBranchManager) && (
              <button
                onClick={() => setActiveQueueTab('stage3_queue')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
                  activeQueueTab === 'stage3_queue'
                    ? 'bg-[#0B1F3A] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>Stage 3: Admin Clearance</span>
                {stage3AdminPendingRecords.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black animate-pulse">
                    {stage3AdminPendingRecords.length}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setActiveQueueTab('all_records')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeQueueTab === 'all_records'
                  ? 'bg-[#0B1F3A] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>All Exit Records ({records.length})</span>
            </button>
          </div>

          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Employee, ID, or Ref..."
              className="w-full px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-[#0B1F3A] focus:outline-none focus:border-[#0B1F3A]"
            />
          </div>
        </div>

        {/* ── TAB 1: MY EXIT PROGRESS (EMPLOYEE VIEW) ── */}
        {activeQueueTab === 'my_exit' && (
          <div className="p-6 space-y-6">
            {myResignation ? (
              <div className="space-y-6">
                {/* Status Hero Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Resignation Ref:</span>
                        <strong className="font-mono text-sm text-[#0B1F3A]">{myResignation.id}</strong>
                      </div>
                      <h3 className="text-lg font-black text-[#0B1F3A] mt-1 font-display">
                        Notice Period & Handover Status
                      </h3>
                      <p className="text-xs text-slate-600">
                        Initiated on <strong>{myResignation.initiationDate}</strong> • Estimated LWD: <strong>{myResignation.finalLastWorkingDay}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(myResignation.status)}
                      {myResignation.status !== 'STAGE_3_APPROVED_RELIEVED' && (
                        <button
                          onClick={() => setWithdrawModalRecord(myResignation)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Undo2 size={13} />
                          <span>Withdraw Resignation</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 7A.2 Live Working-Day Attendance Counter Progress Bar */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <Clock size={15} className="text-blue-600" />
                        <span>Working-Day Attendance Completed:</span>
                      </span>
                      <span className="text-[#0B1F3A] font-extrabold font-mono text-sm">
                        {myResignation.actualWorkingDaysServed} / {myResignation.roleNoticeRequirementDays} Working Days
                        ({Math.min(100, Math.round((myResignation.actualWorkingDaysServed / myResignation.roleNoticeRequirementDays) * 100))}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (myResignation.actualWorkingDaysServed / myResignation.roleNoticeRequirementDays) * 100)}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Norm: {myResignation.designation} = {myResignation.roleNoticeRequirementDays} Working Days</span>
                      <span>
                        {myResignation.actualWorkingDaysServed >= myResignation.roleNoticeRequirementDays
                          ? '✓ Notice Period Requirement Fulfilled'
                          : `${myResignation.roleNoticeRequirementDays - myResignation.actualWorkingDaysServed} working days remaining`}
                      </span>
                    </div>
                  </div>

                  {/* 3-Stage Progress Timeline */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className={`p-3.5 rounded-2xl border ${myResignation.stage1.isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200 text-slate-600'}`}>
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>Stage 1: Portfolio Transfer</span>
                        {myResignation.stage1.isApproved ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Lock size={15} className="text-amber-600" />}
                      </div>
                      <div className="text-[11px] mt-1">
                        {myResignation.stage1.isApproved
                          ? `Cleared by BM • Handed to ${myResignation.stage1.replacementEmployeeId}`
                          : 'Awaiting Branch Manager route transfer'}
                      </div>
                    </div>

                    <div className={`p-3.5 rounded-2xl border ${myResignation.stage2.isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200 text-slate-600'}`}>
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>Stage 2: HR Working Days Gate</span>
                        {myResignation.stage2.isApproved ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Clock size={15} className="text-blue-600" />}
                      </div>
                      <div className="text-[11px] mt-1">
                        {myResignation.stage2.isApproved
                          ? 'Attendance & F&F verified by HR'
                          : `Requires ${myResignation.roleNoticeRequirementDays} working days served`}
                      </div>
                    </div>

                    <div className={`p-3.5 rounded-2xl border ${myResignation.stage3.isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200 text-slate-600'}`}>
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>Stage 3: Admin Final Clearance</span>
                        {myResignation.stage3.isApproved ? <CheckCircle2 size={16} className="text-emerald-600" /> : <ShieldCheck size={15} className="text-purple-600" />}
                      </div>
                      <div className="text-[11px] mt-1">
                        {myResignation.stage3.isApproved
                          ? `Relieved • Letter Ref: ${myResignation.stage3.officialRelievingLetterRefNo}`
                          : 'Final authorization & login deactivation'}
                      </div>
                    </div>
                  </div>

                  {/* Document Generation Quick Actions */}
                  <div className="pt-2 flex items-center justify-end gap-3 flex-wrap">
                    <button
                      onClick={() => setSelectedForNoDues(myResignation)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Printer size={14} />
                      <span>Print Template 1: No-Dues Form</span>
                    </button>

                    <button
                      onClick={() => setSelectedForRelieving(myResignation)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        myResignation.status === 'STAGE_3_APPROVED_RELIEVED'
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      <Award size={14} />
                      <span>Print Template 2: Relieving Letter</span>
                      {myResignation.status !== 'STAGE_3_APPROVED_RELIEVED' && <Lock size={12} />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 border border-slate-200/80 rounded-3xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mx-auto shadow-2xs">
                  <FileText size={22} />
                </div>
                <h3 className="text-sm font-bold text-[#0B1F3A]">No Active Resignation Record</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You are currently in active service with Goldenleaf Finance. To submit a resignation or emergency relief request, click below.
                </p>
                {!isAdmin && (
                  <button
                    onClick={() => setIsApplyModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#163359] text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs"
                  >
                    <Plus size={15} />
                    <span>Initiate Resignation</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: STAGE 1 QUEUE (BRANCH MANAGER PORTFOLIO REASSIGNMENT) ── */}
        {activeQueueTab === 'stage1_queue' && (
          <div className="p-4 space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-amber-700" />
                <span className="font-bold text-amber-950">
                  Section 7A.1 Mandatory Portfolio Reassignment Security Gate
                </span>
              </div>
              <span className="text-[11px] text-amber-900 font-semibold">
                Branch Managers must execute 1-Click route reassignment to eliminate unassigned customers before Stage 1 sign-off.
              </span>
            </div>

            <div className="overflow-x-auto w-full custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10.5px]">
                  <tr>
                    <th className="py-3 px-4">Exit ID & Date</th>
                    <th className="py-3 px-4">Resigning Employee</th>
                    <th className="py-3 px-4">Designation & Branch</th>
                    <th className="py-3 px-4">Active Accounts Assigned</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Stage 1 Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stage1PendingRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No resignations currently pending Stage 1 Portfolio Reassignment.
                      </td>
                    </tr>
                  ) : (
                    stage1PendingRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0B1F3A]">{r.id}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0B1F3A]">{r.employeeName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{r.employeeId}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{r.designation}</div>
                          <div className="text-[10px] text-slate-500">{r.branchName}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[11px]">
                            {r.activePortfolioItems.length} Unassigned Items
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {r.category === 'IMMEDIATE_EMERGENCY' ? (
                            <span className="text-rose-700 font-bold text-[11px]">Immediate (Medical)</span>
                          ) : (
                            <span className="text-blue-700 font-semibold text-[11px]">Standard Notice</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedForStage1(r)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#0B1F3A] hover:bg-[#163359] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <Lock size={13} className="text-[#D4AF37]" />
                            <span>Reassign & Approve</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: STAGE 2 QUEUE (SERVING NOTICE / HR WORKING DAYS COUNTER) ── */}
        {activeQueueTab === 'stage2_queue' && (
          <div className="p-4 space-y-4">
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-blue-700" />
                <span className="font-bold text-blue-950">
                  Section 7A.2 Live Working-Day Attendance Gate
                </span>
              </div>
              <span className="text-[11px] text-blue-900 font-semibold">
                Gate unlocks automatically upon 100% working days served or verified Emergency Medical Relief.
              </span>
            </div>

            <div className="overflow-x-auto w-full custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10.5px]">
                  <tr>
                    <th className="py-3 px-4">Exit ID</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Notice Progress</th>
                    <th className="py-3 px-4">LWD Date</th>
                    <th className="py-3 px-4 text-right">Stage 2 Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stage2ServingNoticeRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No employees currently serving notice in Stage 2.
                      </td>
                    </tr>
                  ) : (
                    stage2ServingNoticeRecords.map((r) => {
                      const isComplete = r.actualWorkingDaysServed >= r.roleNoticeRequirementDays;
                      const isEmergency = r.category === 'IMMEDIATE_EMERGENCY';

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#0B1F3A]">{r.id}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#0B1F3A]">{r.employeeName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{r.employeeId}</div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">{r.designation}</td>
                          <td className="py-3.5 px-4 min-w-[200px]">
                            {isEmergency ? (
                              <div className="text-[11px] font-bold text-rose-700">
                                Emergency Medical Waiver (Ref: {r.emergencyMedicalRefNo || 'MED-REF'})
                              </div>
                            ) : (
                              <div>
                                <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                                  <span>{r.actualWorkingDaysServed} / {r.roleNoticeRequirementDays} Days</span>
                                  <span>{Math.round((r.actualWorkingDaysServed / r.roleNoticeRequirementDays) * 100)}%</span>
                                </div>
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-blue-600 h-full rounded-full"
                                    style={{ width: `${(r.actualWorkingDaysServed / r.roleNoticeRequirementDays) * 100}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-800">{r.finalLastWorkingDay}</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Demo Punch */}
                              <button
                                onClick={() => handleSimulateDayPunch(r)}
                                title="Log 1 day attendance"
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                              >
                                +1 Day
                              </button>

                              {/* HR Approve */}
                              <button
                                onClick={() => handleApproveStage2HR(r, isEmergency)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                                  isComplete || isEmergency
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                }`}
                                disabled={!isComplete && !isEmergency}
                              >
                                {isEmergency ? 'Approve Medical Relief' : isComplete ? 'Clear Stage 2 (HR)' : 'Serving Notice'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 4: STAGE 3 QUEUE (ADMIN FINAL RELIEVING & LOGIN DEACTIVATION) ── */}
        {activeQueueTab === 'stage3_queue' && (
          <div className="p-4 space-y-4">
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-purple-700" />
                <span className="font-bold text-purple-950">
                  Section 7A.3 Automated Portal Login Deactivation & Audit Security
                </span>
              </div>
              <span className="text-[11px] text-purple-900 font-semibold">
                Approval changes employee status to RELIEVED (INACTIVE), revokes login, and generates official certificates.
              </span>
            </div>

            <div className="overflow-x-auto w-full custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10.5px]">
                  <tr>
                    <th className="py-3 px-4">Exit ID</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Stage 1 Handover</th>
                    <th className="py-3 px-4">Stage 2 HR Gate</th>
                    <th className="py-3 px-4 text-right">Stage 3 Admin Clearance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stage3AdminPendingRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No exit applications currently awaiting Stage 3 Admin final authorization.
                      </td>
                    </tr>
                  ) : (
                    stage3AdminPendingRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0B1F3A]">{r.id}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0B1F3A]">{r.employeeName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{r.employeeId}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{r.designation}</td>
                        <td className="py-3.5 px-4 text-emerald-800 font-semibold text-[11px]">
                          ✓ Reassigned ({r.stage1.replacementEmployeeId})
                        </td>
                        <td className="py-3.5 px-4 text-emerald-800 font-semibold text-[11px]">
                          ✓ Notice Verified ({r.stage2.approvedBy?.slice(0, 15)})
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleApproveStage3Admin(r)}
                            className="px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <UserX size={13} />
                            <span>Deactivate Login & Relieve</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 5: ALL RECORDS & DOCUMENT REPOSITORY ── */}
        {activeQueueTab === 'all_records' && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto w-full custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10.5px]">
                  <tr>
                    <th className="py-3 px-4">Exit ID</th>
                    <th className="py-3 px-4">Employee Details</th>
                    <th className="py-3 px-4">Role & Branch</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Print Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => {
                    const isRelieved = r.status === 'STAGE_3_APPROVED_RELIEVED';

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0B1F3A]">{r.id}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0B1F3A]">{r.employeeName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{r.employeeId}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{r.designation}</div>
                          <div className="text-[10px] text-slate-500">{r.branchName}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {r.category === 'IMMEDIATE_EMERGENCY' ? (
                            <span className="text-rose-700 font-bold text-[11px]">Emergency (Medical)</span>
                          ) : (
                            <span className="text-slate-700 text-[11px]">Standard Notice</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(r.status)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Template 1: No-Dues */}
                            <button
                              onClick={() => setSelectedForNoDues(r)}
                              title="Print Template 1: No-Dues & Handover Form"
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center gap-1"
                            >
                              <Printer size={12} />
                              <span>No-Dues</span>
                            </button>

                            {/* Template 2: Relieving Letter (Locked until Stage 3 approved) */}
                            <button
                              onClick={() => setSelectedForRelieving(r)}
                              title={isRelieved ? 'Print Relieving & Experience Letter' : 'Printing Locked (Section 9.5)'}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
                                isRelieved
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              }`}
                            >
                              <Award size={12} />
                              <span>Relieving Letter</span>
                              {!isRelieved && <Lock size={10} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals Integration ── */}
      {/* 1. Resignation Self-Service Application Modal */}
      <ResignationApplicationModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={loadData}
      />

      {/* 2. Stage 1 Mandatory Portfolio Reassignment Modal */}
      <Stage1PortfolioReassignmentModal
        isOpen={!!selectedForStage1}
        onClose={() => setSelectedForStage1(null)}
        record={selectedForStage1}
        onSuccess={loadData}
      />

      {/* 3. Sample Printable Template 1: No-Dues & Handover Clearance Modal */}
      <NoDuesClearanceModal
        isOpen={!!selectedForNoDues}
        onClose={() => setSelectedForNoDues(null)}
        record={selectedForNoDues}
      />

      {/* 4. Sample Printable Template 2: Relieving & Experience Letter Modal */}
      <RelievingLetterModal
        isOpen={!!selectedForRelieving}
        onClose={() => setSelectedForRelieving(null)}
        record={selectedForRelieving}
      />

      {/* 5. Resignation Withdrawal Modal */}
      {withdrawModalRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
            <h3 className="text-base font-extrabold text-[#0B1F3A] mb-1">
              Withdraw Resignation Application
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to withdraw resignation <strong>{withdrawModalRecord.id}</strong>? Your active service status will be restored.
            </p>

            <form onSubmit={handleExecuteWithdrawal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Resignation Withdrawal <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  placeholder="Explain why you wish to withdraw your resignation and continue your duties..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-[#0B1F3A] focus:outline-none focus:border-[#0B1F3A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWithdrawModalRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  Confirm Withdrawal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResignationExitPanel;
