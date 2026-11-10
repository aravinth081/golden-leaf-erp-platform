// ──────────────────────────────────────────────────
// Golden Leaf Finance — Customer Relationship Officer (CRO) Overview Dashboard
// Displays strictly relevant field metrics & daily stop schedules
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Wallet, Clock, CheckCircle2,
  Phone, Navigation, Check,
  CreditCard, X, UserPlus, FileText,
  Banknote, Calendar, ArrowRight, ShieldCheck
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import { getTodayCheckInRecord } from '../../services/attendanceGateService';
import { getMonitoredCollections } from '../../services/monitoringDataService';
import { Avatar } from '../../components/ui/Avatar';

interface FieldStop {
  id: string;
  customer: string;
  phone: string;
  loanId: string;
  center: string;
  group: string;
  address: string;
  amount: number;
  installmentNo: string;
  status: 'pending' | 'collected';
}

const initialStops: FieldStop[] = [];

export const AgentDashboard: React.FC = () => {
  const { addToast } = useUIStore();
  const currentUser = useAuthStore((s) => s.user);
  const userBranchClaim = currentUser?.customClaims?.branchId || 'BR-01';

  const [stops, setStops] = useState<FieldStop[]>(initialStops);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'collected'>('all');
  const [collectingStop, setCollectingStop] = useState<FieldStop | null>(null);
  const [collectMode, setCollectMode] = useState<'Cash' | 'UPI'>('UPI');

  // Load genuine field stops from live collections
  useEffect(() => {
    const todayCols = getMonitoredCollections(userBranchClaim, 'today');
    if (todayCols && todayCols.length > 0) {
      const mappedStops: FieldStop[] = todayCols.map((c) => ({
        id: c.id,
        customer: c.customerName,
        phone: c.customerPhone || '—',
        loanId: c.loanId,
        center: c.areaRoute || 'Center Route',
        group: c.groupName || 'Group',
        address: c.geoLocation || `${c.branchName}`,
        amount: c.expectedAmount || c.dueAmount || c.collectedAmount || 0,
        installmentNo: c.installment || 'Installment',
        status: c.status === 'collected' ? 'collected' : 'pending',
      }));
      setStops(mappedStops);
    } else {
      setStops([]);
    }
  }, [userBranchClaim]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && collectingStop) {
        setCollectingStop(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [collectingStop]);

  const todayCheckIn = getTodayCheckInRecord(currentUser);

  // Computed metrics
  const totalTarget = stops.reduce((sum, s) => sum + s.amount, 0);
  const totalCollected = stops.filter(s => s.status === 'collected').reduce((sum, s) => sum + s.amount, 0);
  const totalPending = stops.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0);
  const completedCount = stops.filter(s => s.status === 'collected').length;
  const pendingCount = stops.filter(s => s.status === 'pending').length;
  const progressPct = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

  const filteredStops = stops.filter(s => {
    if (filterTab === 'pending') return s.status === 'pending';
    if (filterTab === 'collected') return s.status === 'collected';
    return true;
  });

  const handleConfirmCollection = () => {
    if (!collectingStop) return;

    setStops(prev => prev.map(s => s.id === collectingStop.id ? { ...s, status: 'collected' } : s));
    addToast({
      type: 'success',
      title: 'EMI Collected',
      message: `₹${collectingStop.amount.toLocaleString('en-IN')} successfully collected from ${collectingStop.customer} via ${collectMode}!`,
    });
    setCollectingStop(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 font-body pb-12 pr-1">
      {/* Top Header Card */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-[0_2px_10px_rgba(11,31,58,0.04)] overflow-hidden">
        <div className="bg-[#0B1F3A] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-[#E5E7EB]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-1 h-4 bg-[#D4AF37] rounded-full"></div>
              <h1 className="text-base font-bold text-white tracking-wide uppercase font-body">
                Customer Relationship Officer (CRO) Field Overview
              </h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                Route Active
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1 pl-4">
              Assigned to: <strong className="text-white">{currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Field Officer'}</strong> • Route: <span className="text-[#D4AF37] font-semibold">{stops[0]?.center || (currentUser?.customClaims?.branchId ? `Branch ${currentUser.customClaims.branchId} Route` : 'Daily Field Route')}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Today's Shift</span>
              <span className={`text-xs font-bold flex items-center justify-end gap-1 ${todayCheckIn ? 'text-emerald-400' : 'text-amber-400'}`}>
                {todayCheckIn ? <CheckCircle2 size={13} /> : <Clock size={13} />} {todayCheckIn ? `Checked In: ${todayCheckIn.check_in_time}` : 'Not Checked In'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Field Target & Recovery Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TODAY TARGET */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] p-5 shadow-[0_2px_10px_rgba(11,31,58,0.04)] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-[#6B7280] font-body uppercase tracking-wider">
              TODAY'S TARGET
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F1F5F9] text-[#0B1F3A] flex items-center justify-center">
              <Wallet size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-[#0B1F3A] font-body tracking-tight">
              ₹{totalTarget.toLocaleString('en-IN')}
            </p>
            <p className="text-xs font-semibold text-gray-400 mt-1">
              {stops.length} Borrower Dues Allocated
            </p>
          </div>
        </div>

        {/* COLLECTED SO FAR */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] p-5 shadow-[0_2px_10px_rgba(11,31,58,0.04)] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-[#059669] font-body uppercase tracking-wider">
              COLLECTED SO FAR
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-[#059669] font-body tracking-tight">
              ₹{totalCollected.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#059669] h-full rounded-full transition-all" style={{ width: `${progressPct}%` }}></div>
              </div>
              <span className="text-xs font-bold text-[#059669]">{progressPct}%</span>
            </div>
          </div>
        </div>

        {/* REMAINING TO COLLECT */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] p-5 shadow-[0_2px_10px_rgba(11,31,58,0.04)] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-[#DC2626] font-body uppercase tracking-wider">
              REMAINING DUES
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-[#DC2626] font-body tracking-tight">
              ₹{totalPending.toLocaleString('en-IN')}
            </p>
            <p className="text-xs font-semibold text-gray-400 mt-1">
              {pendingCount} borrowers remaining
            </p>
          </div>
        </div>

        {/* ROUTE PROGRESS */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] p-5 shadow-[0_2px_10px_rgba(11,31,58,0.04)] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-[#D4AF37] font-body uppercase tracking-wider">
              STOPS COMPLETED
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FFFBEB] text-[#D4AF37] flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-[#0B1F3A] font-body tracking-tight">
              {completedCount} <span className="text-sm font-semibold text-gray-400">/ {stops.length} Stops</span>
            </p>
            <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              ● {stops.length > 0 ? (stops[0]?.center || 'Scheduled Route') : 'No active route'}
            </p>
          </div>
        </div>
      </div>

      {/* Field Operations Quick Action Toolbar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-[0_2px_10px_rgba(11,31,58,0.04)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-body">
            CRO Quick Actions & Workflows
          </span>
          <span className="text-[10.5px] font-semibold text-slate-400">
            Field Officer Operations Desk
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <Link
            to="/client/enrollment"
            className="p-3 rounded-xl bg-slate-50 hover:bg-[#0B1F3A] text-slate-700 hover:text-white border border-slate-200 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-2xs hover:shadow-sm"
          >
            <UserPlus size={18} className="text-[#0B1F3A] group-hover:text-[#D4AF37] mb-1.5 transition-colors" />
            <span className="text-[11px] font-bold leading-tight">Enroll Customer</span>
          </Link>
          <Link
            to="/collections/weekly"
            className="p-3 rounded-xl bg-slate-50 hover:bg-[#0B1F3A] text-slate-700 hover:text-white border border-slate-200 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-2xs hover:shadow-sm"
          >
            <Calendar size={18} className="text-[#0B1F3A] group-hover:text-[#D4AF37] mb-1.5 transition-colors" />
            <span className="text-[11px] font-bold leading-tight">Weekly Route</span>
          </Link>
          <Link
            to="/collections/advance"
            className="p-3 rounded-xl bg-slate-50 hover:bg-[#0B1F3A] text-slate-700 hover:text-white border border-slate-200 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-2xs hover:shadow-sm"
          >
            <Banknote size={18} className="text-[#0B1F3A] group-hover:text-[#D4AF37] mb-1.5 transition-colors" />
            <span className="text-[11px] font-bold leading-tight">Advance Payment</span>
          </Link>
          <Link
            to="/collections/eod"
            className="p-3 rounded-xl bg-slate-50 hover:bg-[#0B1F3A] text-slate-700 hover:text-white border border-slate-200 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-2xs hover:shadow-sm"
          >
            <ShieldCheck size={18} className="text-[#0B1F3A] group-hover:text-[#D4AF37] mb-1.5 transition-colors" />
            <span className="text-[11px] font-bold leading-tight">EOD Settlement</span>
          </Link>
          <Link
            to="/attendance"
            className="p-3 rounded-xl bg-slate-50 hover:bg-[#0B1F3A] text-slate-700 hover:text-white border border-slate-200 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-2xs hover:shadow-sm"
          >
            <Clock size={18} className="text-[#0B1F3A] group-hover:text-[#D4AF37] mb-1.5 transition-colors" />
            <span className="text-[11px] font-bold leading-tight">Duty Timesheet</span>
          </Link>
          <Link
            to="/my-payslips"
            className="p-3 rounded-xl bg-slate-50 hover:bg-[#0B1F3A] text-slate-700 hover:text-white border border-slate-200 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-2xs hover:shadow-sm"
          >
            <FileText size={18} className="text-[#D4AF37] mb-1.5 transition-colors" />
            <span className="text-[11px] font-bold leading-tight">My Payslips</span>
          </Link>
        </div>
      </div>

      {/* Main Stop Schedule & Direct Collection Table */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-[0_2px_10px_rgba(11,31,58,0.04)] overflow-hidden">
        {/* Table Banner with Filter Tabs */}
        <div className="bg-[#0B1F3A] px-4 sm:px-6 lg:px-8 py-4 border-b border-[#E5E7EB]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4 bg-[#D4AF37] rounded-full"></div>
            <h2 className="text-sm font-body font-semibold text-[#FFFFFF] tracking-wide uppercase">
              Today's Field Collection Stops ({filteredStops.length})
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-bold transition-all ${
                filterTab === 'all' ? 'bg-[#D4AF37] text-[#0B1F3A]' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              All Stops ({stops.length})
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-bold transition-all ${
                filterTab === 'pending' ? 'bg-[#EF4444] text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterTab('collected')}
              className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-bold transition-all ${
                filterTab === 'collected' ? 'bg-[#059669] text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Collected ({completedCount})
            </button>
          </div>
        </div>

        {/* Stop Cards List */}
        <div className="p-3 sm:p-5 lg:p-6">
          {filteredStops.length === 0 ? (
            <div className="py-10 px-4 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-[#0B1F3A] mx-auto flex items-center justify-center mb-3 shadow-inner">
                <Users size={22} className="text-[#D4AF37]" />
              </div>
              <h3 className="text-sm font-bold text-[#0B1F3A] font-body">No Active Dues Pending On Route</h3>
              <p className="text-xs text-slate-500 mt-1">
                {filterTab === 'all'
                  ? 'All scheduled borrower collections for your assigned center have been recorded, or no active dues were scheduled for today.'
                  : `There are no stops currently marked as "${filterTab}".`}
              </p>
              <div className="mt-5 flex items-center justify-center gap-2.5 flex-wrap">
                <Link
                  to="/client/enrollment"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1F3A] text-white text-xs font-bold hover:bg-[#132F58] transition-colors"
                >
                  <UserPlus size={14} className="text-[#D4AF37]" />
                  <span>Register Customer</span>
                </Link>
                <Link
                  to="/collections/weekly"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  <span>Open Weekly Route Sheet</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStops.map((stop, idx) => {
                const isDone = stop.status === 'collected';
                return (
                  <div
                    key={stop.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      isDone
                        ? 'bg-[#F9FAFB] border-[#E5E7EB] opacity-90'
                        : 'bg-white border-[#E5E7EB] hover:border-[#D4AF37] shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <Avatar name={stop.customer} size="sm" className="!rounded-xl !w-9 !h-9 shadow-2xs mt-0.5" />

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-[#0B1F3A] text-sm font-body">{stop.customer}</h4>
                          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            {stop.loanId}
                          </span>
                          <span className="text-[11px] text-gray-500 font-semibold">
                            ({stop.installmentNo})
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Navigation size={12} className="text-[#D4AF37]" />
                            {stop.address}
                          </span>
                          <span className="font-semibold text-[#0B1F3A]">
                            Group: {stop.group}
                          </span>
                          <a
                            href={`tel:${stop.phone}`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                          >
                            <Phone size={12} /> {stop.phone}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Amount & Collect Action */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                          Due Amount
                        </span>
                        <span className="text-base font-black text-[#0B1F3A] font-body">
                          ₹{stop.amount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div>
                        {isDone ? (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1.5 rounded-lg bg-[#ECFDF5] text-[#059669] text-xs font-bold border border-[#059669]/20 flex items-center gap-1">
                              <CheckCircle2 size={13} /> Collected
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setStops(prev => prev.map(s => s.id === stop.id ? { ...s, status: 'pending' } : s));
                                addToast({ type: 'info', title: 'Status Updated', message: `Marked ${stop.customer} as Pending.` });
                              }}
                              className="text-xs text-gray-400 hover:text-red-500 underline"
                            >
                              Undo
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCollectingStop(stop)}
                            className="px-5 py-2.5 min-h-[44px] rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] text-[#0B1F3A] font-bold text-xs shadow-md transition-all cursor-pointer transform active:scale-95 flex items-center justify-center"
                          >
                            Collect EMI →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Collect Payment Modal */}
      <AnimatePresence>
        {collectingStop && (
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
              onClick={() => setCollectingStop(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
              aria-label="Close modal backdrop"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-[min(94vw,448px)] max-h-[90dvh] overflow-hidden font-body flex flex-col relative z-10 select-text"
            >
              <div className="bg-[#0B1F3A] px-4 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-1 h-4 bg-[#D4AF37] rounded-full"></div>
                  <h3 className="text-sm font-bold tracking-wide uppercase">
                    Collect EMI Payment
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCollectingStop(null)}
                  className="w-10 h-10 min-h-[40px] flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-300 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                <div className="bg-[#FAFBFD] p-4 rounded-xl border border-[#E5E7EB]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Customer</span>
                    <span className="text-sm font-bold text-[#0B1F3A]">{collectingStop.customer}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Loan ID</span>
                    <span className="text-xs font-mono font-bold text-[#D4AF37]">{collectingStop.loanId}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-xs font-bold text-gray-700">Collection Amount</span>
                    <span className="text-lg font-black text-[#059669]">₹{collectingStop.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                    Payment Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCollectMode('UPI')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        collectMode === 'UPI'
                          ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CreditCard size={15} /> UPI / QR Scan
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollectMode('Cash')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        collectMode === 'Cash'
                          ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Wallet size={15} /> Cash Received
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmCollection}
                    className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] text-[#0B1F3A] font-black text-sm uppercase tracking-wider shadow-md transition-all cursor-pointer"
                  >
                    Confirm ₹{collectingStop.amount.toLocaleString('en-IN')} Received
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

export default AgentDashboard;
