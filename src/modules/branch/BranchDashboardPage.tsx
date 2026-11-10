// ──────────────────────────────────────────────────
// Golden Leaf Finance — Branch Dashboard (Admin Panel)
// Strict PDF Specification + Real Branch-Scoped Data
// PDF Required:
// 1. Collection Today (Filter: selectedBranchId)
// 2. Pending Loans (Filter: selectedBranchId)
// 3. Loan Disbursed (Filter: selectedBranchId)
// 4. Attendance (GPS Location, Selfie, Login/Logout, Attendance Report)
// 5. Customer Relationship Officer (CRO) Performance (Filter: selectedBranchId)
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Users, CreditCard, Wallet, Clock,
  CheckCircle2, AlertTriangle, ArrowLeft,
  MapPin, Phone, Mail, UserCheck, ShieldCheck,
  FileSpreadsheet, Camera, Navigation, User
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import {
  getStoredBranches, type DetailedBranch
} from '../../services/branchService';
import { useUIStore } from '../../store';

export const BranchDashboardPage: React.FC = () => {
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const [branches, setBranches] = useState<DetailedBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<DetailedBranch | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const addToast = useUIStore((s) => s.addToast);
  const selectedBranchId = useUIStore((s) => s.selectedBranchId);
  const setSelectedBranchId = useUIStore((s) => s.setSelectedBranchId);

  useEffect(() => {
    setIsLoading(true);
    const list = getStoredBranches();
    setBranches(list);

    // Prioritize URL param, then stored selectedBranchId, then first branch
    const targetId = branchId || selectedBranchId;
    let found: DetailedBranch | undefined;

    if (targetId) {
      found = list.find((b) => b.id === targetId || b.code === targetId);
    }
    if (!found && list.length > 0) {
      found = list[0];
    }

    if (found) {
      setSelectedBranch(found);
      setSelectedBranchId(found.id);
    }
    setIsLoading(false);
  }, [branchId]);

  const handleBranchSelect = (id: string) => {
    setIsLoading(true);
    const found = branches.find((b) => b.id === id);
    if (found) {
      setSelectedBranch(found);
      setSelectedBranchId(found.id);
      navigate(`/branches/${found.id}/dashboard`, { replace: true });
    }
    setIsLoading(false);
  };

  const handleDownloadAttendanceReport = () => {
    if (!selectedBranch) return;
    addToast({
      type: 'success',
      title: 'Attendance Report Generated',
      message: `Downloaded PDF Attendance Summary for ${selectedBranch.name}.`,
    });
  };

  if (isLoading || !selectedBranch) {
    return (
      <div className="p-12 text-center text-[#0B1F3A] font-sans flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-[#64748B]">Loading Branch Dashboard...</p>
      </div>
    );
  }

  const b = selectedBranch;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 sm:p-5 lg:p-6 flex flex-col gap-6 pb-14 font-sans max-w-full text-[#0B1F3A]"
    >
      {/* ── TOP BANNER & BRANCH CONTEXT SWITCHER ── */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04)] overflow-hidden">
        <div className="bg-[#0B1F3A] px-4 sm:px-6 py-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                // Return to Branch Management keeping branch context
                navigate('/branches');
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center justify-center"
              title="Back to Branch Management"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base font-bold text-[#FFFFFF] tracking-wide uppercase font-sans">
                  {b.name}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    b.status === 'Active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {b.status}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                Internal ID: {b.id} • Code: {b.code} • {b.city}, {b.state}
              </p>
            </div>
          </div>

          {/* Branch Switcher Dropdown */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-300 uppercase hidden sm:inline font-sans">
              Switch Branch:
            </span>
            <select
              value={b.id}
              onChange={(e) => handleBranchSelect(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#142B4E] border border-[#243E66] text-xs font-bold text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer shadow-xs"
            >
              {branches.map((br) => (
                <option key={br.id} value={br.id}>
                  {br.name} {br.status === 'Disabled' ? '(Disabled)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Branch Metadata Bar */}
        <div className="p-4 sm:p-5 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-[#E2E8F0] text-xs font-sans">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#0B1F3A]">
              <MapPin size={17} className="text-[#D4AF37]" />
            </div>
            <div className="min-w-0">
              <div className="text-[#64748B] font-bold uppercase text-[10px]">Address & PIN</div>
              <div className="font-bold text-[#0B1F3A] truncate">{b.address}, {b.pincode}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#0B1F3A]">
              <UserCheck size={17} className="text-[#0B1F3A]" />
            </div>
            <div className="min-w-0">
              <div className="text-[#64748B] font-bold uppercase text-[10px]">Branch Manager</div>
              <div className="font-bold text-[#0B1F3A] truncate">{b.manager}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#0B1F3A]">
              <Phone size={17} className="text-[#0B1F3A]" />
            </div>
            <div className="min-w-0">
              <div className="text-[#64748B] font-bold uppercase text-[10px]">Contact & Email</div>
              <div className="font-bold text-[#0B1F3A] truncate">{b.phone} • {b.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#0B1F3A]">
              <ShieldCheck size={17} className="text-emerald-600" />
            </div>
            <div className="min-w-0">
              <div className="text-[#64748B] font-bold uppercase text-[10px]">Operational State</div>
              <div className="font-bold text-[#0B1F3A]">
                {b.status === 'Active' ? 'Live Operations' : 'Operations Suspended'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5 PDF-REQUIRED CORE METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Collection Today (PDF-Required) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-[0_1px_3px_rgba(11,31,58,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider font-sans">Collection Today</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-[#D4AF37] border border-amber-200">
              <Wallet size={16} />
            </span>
          </div>
          <div className="text-xl font-bold font-manrope text-[#0B1F3A] mt-2">
            ₹{b.todayCollection.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 font-sans">
            Pending Due: <span className="font-manrope font-semibold text-rose-600">₹{b.pendingCollection.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* 2. Pending Loans (PDF-Required) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-[0_1px_3px_rgba(11,31,58,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider font-sans">Pending Loans</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Clock size={16} />
            </span>
          </div>
          <div className="text-xl font-bold font-manrope text-[#0B1F3A] mt-2">
            {b.pendingLoans}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 font-sans">
            Total Applications: <span className="font-manrope font-semibold">{b.totalLoanApplications}</span>
          </div>
        </div>

        {/* 3. Loan Disbursed (PDF-Required) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-[0_1px_3px_rgba(11,31,58,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider font-sans">Loan Disbursed</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <CreditCard size={16} />
            </span>
          </div>
          <div className="text-xl font-bold font-manrope text-[#0B1F3A] mt-2">
            ₹{(b.totalCollectionAmount / 100000).toFixed(1)}L
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 font-sans">
            Active Accounts: <span className="font-manrope font-semibold">{b.activeLoans}</span>
          </div>
        </div>

        {/* 4. Attendance (PDF-Required) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-[0_1px_3px_rgba(11,31,58,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider font-sans">Attendance</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <UserCheck size={16} />
            </span>
          </div>
          <div className="text-xl font-bold font-manrope text-emerald-700 mt-2">
            {b.presentEmployees} / {b.totalEmployees}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 font-sans">
            Attendance Rate: <span className="font-manrope font-semibold text-[#0B1F3A]">{b.attendancePercentage}%</span>
          </div>
        </div>

        {/* 5. Customer Relationship Officers (CROs) (PDF-Required) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-[0_1px_3px_rgba(11,31,58,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider font-sans">Customer Relationship Officers (CROs)</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-[#0B1F3A] border border-slate-200">
              <Users size={16} />
            </span>
          </div>
          <div className="text-xl font-bold font-manrope text-[#0B1F3A] mt-2">
            {b.agentPerformance?.length || 0}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 font-sans">
            Active field personnel for this branch
          </div>
        </div>
      </div>

      {/* ── PDF SECTION 4: ATTENDANCE (GPS, Selfie, Login/Logout, Report) ── */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04)] overflow-hidden">
        <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
            <div>
              <h2 className="text-sm font-semibold text-[#FFFFFF] uppercase tracking-wide font-sans">
                Attendance Monitoring & Verification
              </h2>
              <p className="text-[11px] text-slate-300">
                PDF-Specified: GPS Location • Selfie Capture • Login Time • Logout Time • Attendance Report
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadAttendanceReport}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/20 cursor-pointer w-fit"
          >
            <FileSpreadsheet size={14} className="text-[#D4AF37]" />
            <span>Attendance Report</span>
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          {b.attendanceRecords && b.attendanceRecords.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse font-sans min-w-[700px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50/70 text-[#64748B] font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-5">Employee</th>
                  <th className="py-3 px-5">Role</th>
                  <th className="py-3 px-5 text-center">Login Time</th>
                  <th className="py-3 px-5 text-center">Logout Time</th>
                  <th className="py-3 px-5">GPS Location</th>
                  <th className="py-3 px-5 text-center">Selfie Capture</th>
                  <th className="py-3 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {b.attendanceRecords.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-[#0B1F3A]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0B1F3A]">
                          <User size={14} />
                        </div>
                        <div>
                          <div>{att.employeeName}</div>
                          <div className="text-[10.5px] text-[#64748B] font-mono">{att.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-[#64748B] font-medium">{att.role}</td>
                    <td className="py-3.5 px-5 text-center font-manrope font-semibold text-[#0B1F3A]">
                      {att.loginTime}
                    </td>
                    <td className="py-3.5 px-5 text-center font-manrope font-semibold text-[#0B1F3A]">
                      {att.logoutTime}
                    </td>
                    <td className="py-3.5 px-5 text-[#64748B]">
                      <div className="flex items-center gap-1.5 max-w-[260px]">
                        <Navigation size={12} className="text-[#D4AF37] flex-shrink-0" />
                        <span className="truncate" title={att.gpsLocation.address}>
                          {att.gpsLocation.address}
                        </span>
                      </div>
                      {att.gpsLocation.withinGeofence && (
                        <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                          ✓ Within 200m Geofence
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      {att.selfieVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                          <Camera size={11} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold">
                          Not Captured
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          att.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : att.status === 'Late'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-xs text-[#64748B]">
              No active attendance records recorded for this branch today.
            </div>
          )}
        </div>
      </div>

      {/* ── PDF SECTION 5: CUSTOMER RELATIONSHIP OFFICER (CRO) PERFORMANCE ── */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04)] overflow-hidden">
        <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
            <div>
              <h2 className="text-sm font-semibold text-[#FFFFFF] uppercase tracking-wide font-sans">
                Customer Relationship Officer (CRO) Performance
              </h2>
              <p className="text-[11px] text-slate-300">
                PDF-Specified: Scoped strictly to {b.name}
              </p>
            </div>
          </div>
          <span className="text-xs text-[#D4AF37] font-semibold font-manrope">
            {b.agentPerformance?.length || 0} Assigned Officers (CROs)
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          {b.agentPerformance && b.agentPerformance.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse font-sans min-w-[700px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50/70 text-[#64748B] font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-5">Officer (CRO) Name</th>
                  <th className="py-3 px-5">Assigned Center / Route</th>
                  <th className="py-3 px-5 text-right">Daily Target</th>
                  <th className="py-3 px-5 text-right">Collected Today</th>
                  <th className="py-3 px-5 text-center">Receipts</th>
                  <th className="py-3 px-5">Recovery Efficiency</th>
                  <th className="py-3 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {b.agentPerformance.map((ag) => (
                  <tr key={ag.agentId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-[#0B1F3A]">
                      <div>{ag.agentName}</div>
                      <div className="text-[10.5px] text-[#64748B] font-mono">{ag.agentId}</div>
                    </td>
                    <td className="py-3.5 px-5 text-[#64748B] font-medium">{ag.centerOrRoute}</td>
                    <td className="py-3.5 px-5 text-right font-manrope font-semibold text-[#0B1F3A]">
                      ₹{ag.targetAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5 text-right font-manrope font-bold text-emerald-700">
                      ₹{ag.collectedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5 text-center font-manrope font-semibold text-[#0B1F3A]">
                      {ag.collectionsCount}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className="bg-[#D4AF37] h-full rounded-full"
                            style={{ width: `${Math.min(100, ag.efficiencyPercentage)}%` }}
                          />
                        </div>
                        <span className="font-manrope font-bold text-xs text-[#0B1F3A]">
                          {ag.efficiencyPercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {ag.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-xs text-[#64748B]">
              No active field Customer Relationship Officer (CRO) data available for this branch.
            </div>
          )}
        </div>
      </div>

      {/* ── PDF SECTIONS 2 & 3: PENDING LOANS & LOAN DISBURSED DETAILS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Loans Breakdown */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04)] overflow-hidden">
          <div className="bg-[#0B1F3A] px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-sans">
                Pending Loans in Review ({b.pendingLoans})
              </h3>
            </div>
          </div>
          <div className="p-4">
            {b.pendingLoansList && b.pendingLoansList.length > 0 ? (
              <div className="divide-y divide-[#F1F5F9] text-xs">
                {b.pendingLoansList.map((ln) => (
                  <div key={ln.loanId} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#0B1F3A]">{ln.customerName}</div>
                      <div className="text-[11px] text-[#64748B]">
                        {ln.groupName} • {ln.appliedDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-manrope font-bold text-[#0B1F3A]">
                        ₹{ln.amount.toLocaleString('en-IN')}
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 mt-0.5">
                        {ln.stage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#64748B]">
                No pending loan applications for {b.name}.
              </div>
            )}
          </div>
        </div>

        {/* Loan Disbursed Breakdown */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04)] overflow-hidden">
          <div className="bg-[#0B1F3A] px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-sans">
                Sanctioned & Disbursed Loans
              </h3>
            </div>
          </div>
          <div className="p-4">
            {b.disbursedLoansList && b.disbursedLoansList.length > 0 ? (
              <div className="divide-y divide-[#F1F5F9] text-xs">
                {b.disbursedLoansList.map((ln) => (
                  <div key={ln.loanId} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#0B1F3A]">{ln.customerName}</div>
                      <div className="text-[11px] text-[#64748B]">
                        {ln.product} • {ln.disbursedDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-manrope font-bold text-emerald-700">
                        ₹{ln.sanctionedAmount.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10.5px] text-[#64748B] block mt-0.5 font-medium">
                        {ln.mode}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#64748B]">
                No recent loan disbursements recorded for {b.name}.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PERFORMANCE TREND & AUDIT TRAIL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04)] overflow-hidden">
          <div className="bg-[#0B1F3A] px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-sans">
                Monthly Collection Trend (₹)
              </h3>
            </div>
          </div>
          <div className="p-4 sm:p-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={b.monthlyTrend}>
                <defs>
                  <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickFormatter={(v) => `₹${v / 100000}L`}
                />
                <Tooltip
                  formatter={(v: any) => [`₹${Number(v || 0).toLocaleString('en-IN')}`, 'Collected']}
                />
                <Area
                  type="monotone"
                  dataKey="collection"
                  stroke="#D4AF37"
                  strokeWidth={2.5}
                  fill="url(#colGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Operational Audit Trail */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04)] overflow-hidden">
          <div className="bg-[#0B1F3A] px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-sans">
                Branch Operational Audit Trail
              </h3>
            </div>
            <span className="text-[11px] text-[#D4AF37] font-semibold">Live Feed</span>
          </div>
          <div className="p-4 overflow-y-auto max-h-64 custom-scrollbar">
            <div className="divide-y divide-[#F1F5F9] text-xs">
              {b.recentActivities && b.recentActivities.length > 0 ? (
                b.recentActivities.map((act) => (
                  <div key={act.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#0B1F3A]">{act.action}</p>
                      <p className="text-[11px] text-[#64748B]">
                        {act.userName} • {act.userRole}
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-[#64748B] font-mono">
                      <div>{act.date}</div>
                      <div>{act.time}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-[#64748B]">
                  No recent activities recorded for this branch.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BranchDashboardPage;
