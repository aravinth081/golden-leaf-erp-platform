// ──────────────────────────────────────────────────
// Golden Leaf Finance — Employee Self-Service My Payslips Page
// Direct Payslip Inspection & Institutional PDF Download for All Non-Admin Staff Roles
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Building2,
  DollarSign,
  CheckCircle2,
  TrendingUp,
  Shield,
  CreditCard,
  User,
  ArrowRight,
  Sparkles,
  Lock,
  Clock,
  Printer,
  ChevronRight,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../../store';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  getStaffPayslips,
  getEmployeeSalary,
  getEmployeeSalaries,
  getRoleSalary,
  calculateSalaryBreakdown,
  buildPayslipPDF,
} from '../../services/roleSalaryService';
import type { PayslipDownloadData, EmployeeSalaryConfig, RoleSalaryConfig } from '../../types/roleSalary.types';
import { ROLE_LABELS, type UserRole } from '../../types/auth.types';

export const MyPayslipsPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  const userRole = (user?.customClaims?.role || 'collection_agent') as UserRole;
  const isAdmin = userRole === 'admin';

  const [payslips, setPayslips] = useState<PayslipDownloadData[]>([]);
  const [selectedSlip, setSelectedSlip] = useState<PayslipDownloadData | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [salaryConfig, setSalaryConfig] = useState<EmployeeSalaryConfig | null>(null);

  useEffect(() => {
    if (!isAdmin && user) {
      const slips = getStaffPayslips(user);
      setPayslips(slips);

      const empId = user.employeeId || (user.uid && !user.uid.startsWith('usr-') ? user.uid : '');
      const allEmployees = getEmployeeSalaries();
      if (empId && allEmployees[empId]) {
        setSalaryConfig(allEmployees[empId]);
      } else {
        setSalaryConfig(null);
      }
    }
  }, [isAdmin, user, userRole]);

  const handleDownload = (slip: PayslipDownloadData) => {
    try {
      setIsDownloading(slip.id);
      buildPayslipPDF(slip, true);
      addToast({
        type: 'success',
        title: 'Payslip Downloaded',
        message: `Payslip for ${slip.period} downloaded successfully.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Download Failed',
        message: err?.message || 'Could not generate payslip PDF. Please retry.',
      });
    } finally {
      setIsDownloading(null);
    }
  };

  // If Admin somehow navigates here, show executive notice
  if (isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Payslips & Compensation"
          subtitle="Enterprise remuneration overview"
        />

        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-[#D4AF37]">
            <Shield size={32} />
          </div>
          <h2 className="text-xl font-bold text-[#0B1F3A] mb-2 font-display">
            Super Administrator Account
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-6 font-sans">
            Administrative accounts represent corporate ownership and governing authority.
            Payslips are issued exclusively to salaried operational roles. As Super Admin,
            you have full authority to fix and adjust the monthly compensation, allowances,
            and deductions for all staff roles and employees.
          </p>
          <button
            onClick={() => navigate('/admin/compensation')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0B1F3A] hover:bg-[#132F58] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <DollarSign size={16} />
            Go to Fix Role & Staff Pay
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  const latestSlip = payslips[0];
  const breakdown = salaryConfig ? calculateSalaryBreakdown(salaryConfig) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Payslips & Compensation"
        subtitle="View and download verified monthly salary statements and institutional breakdown"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'My Payslips' },
        ]}
      />

      {/* Salary Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Monthly Gross Pay
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0B1F3A] font-display">
            ₹{(breakdown?.grossMonthly || 0).toLocaleString('en-IN')}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-sans">
            <span>Base: ₹{(salaryConfig?.baseMonthly || 0).toLocaleString('en-IN')}</span>
            <span>•</span>
            <span>HRA: ₹{(salaryConfig?.hraMonthly || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Monthly Deductions
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 font-display">
            ₹{(breakdown?.totalDeductions || 0).toLocaleString('en-IN')}
          </p>
          <p className="mt-2 text-xs text-slate-500 font-sans">
            Statutory PF, ESI, PT & TDS
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
              Net Take-Home Pay
            </span>
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-2xl font-black font-display tracking-tight">
            ₹{(breakdown?.netSalary || 0).toLocaleString('en-IN')}
          </p>
          <p className="mt-2 text-xs text-emerald-100 flex items-center gap-1 font-sans">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            {salaryConfig ? 'Fixed by Corporate Administration' : 'Pending Corporate Fixation'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Annual CTC
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#0B1F3A]/5 border border-[#0B1F3A]/10 flex items-center justify-center text-[#0B1F3A]">
              <Sparkles size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0B1F3A] font-display">
            ₹{(((breakdown?.annualCtc || 0) / 100000)).toFixed(2)} L
          </p>
          <p className="mt-2 text-xs text-slate-500 font-sans">
            Cost to Company (Annualized)
          </p>
        </div>
      </div>

      {/* Employee & Bank Verification Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-[#0B1F3A] mb-4 flex items-center gap-2 font-display">
          <CreditCard size={16} className="text-[#D4AF37]" />
          Disbursement Profile & Statutory Identifiers
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              Employee ID
            </span>
            <p className="mt-1 font-bold text-[#0B1F3A] font-mono">
              {user?.employeeId || (user?.uid && !user.uid.startsWith('usr-') ? user.uid : 'Not Assigned')}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              Role / Designation
            </span>
            <p className="mt-1 font-bold text-[#0B1F3A] truncate" title={ROLE_LABELS[userRole]}>
              {ROLE_LABELS[userRole] || userRole}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              Branch Name
            </span>
            <p className="mt-1 font-bold text-[#0B1F3A] truncate">
              {user?.customClaims?.branchName || 'Not Assigned'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              Bank & Account
            </span>
            <p className="mt-1 font-bold text-[#0B1F3A] font-mono truncate">
              {salaryConfig?.bankAccountNumber
                ? `${salaryConfig.bankName || 'Bank'} •••• ${salaryConfig.bankAccountNumber.slice(-4)}`
                : 'Not Linked'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              IFSC Code
            </span>
            <p className="mt-1 font-bold text-[#0B1F3A] font-mono">
              {salaryConfig?.bankIfsc || 'Not Linked'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              PAN / UAN
            </span>
            <p className="mt-1 font-bold text-[#0B1F3A] font-mono truncate">
              {(user?.customClaims as any)?.pan || (salaryConfig as any)?.employeePan || 'Not Linked'}
            </p>
          </div>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#0B1F3A] font-display">
              Monthly Salary Statements
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Instant PDF generation with institutional verification seal and itemized breakdown
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full self-start sm:self-auto flex items-center gap-1.5 ${
            payslips.length > 0
              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/80'
              : 'text-slate-600 bg-slate-100 border border-slate-200'
          }`}>
            <CheckCircle2 size={13} />
            {payslips.length === 0 ? 'No Statements Issued' : `${payslips.length} Statements Ready`}
          </span>
        </div>

        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 font-semibold">Period</th>
                <th className="py-3.5 px-4 font-semibold">Attendance</th>
                <th className="py-3.5 px-4 font-semibold text-right">Gross Earnings</th>
                <th className="py-3.5 px-4 font-semibold text-right">Deductions</th>
                <th className="py-3.5 px-4 font-semibold text-right">Net Credited</th>
                <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {payslips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 px-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                      <FileText size={22} />
                    </div>
                    <p className="text-sm font-bold text-slate-700 font-display">No Salary Statements Issued</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-sans leading-relaxed">
                      No monthly salary statements have been processed or issued yet. Once Corporate HR & Finance finalize an active payroll cycle, your verified statements will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                payslips.map((slip) => {
                  const totalDeductions =
                    slip.pfDeduction + slip.esiDeduction + slip.ptDeduction + slip.tdsDeduction;

                  return (
                    <tr key={slip.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#D4AF37]">
                            <FileText size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-[#0B1F3A] text-xs">
                              {new Date(slip.period + '-01').toLocaleDateString('en-IN', {
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Ref: {slip.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-sans">
                          <span className="font-bold text-[#0B1F3A]">{slip.workingDays}</span>
                          <span className="text-slate-400">/ {slip.totalMonthDays} Days</span>
                          {slip.lopDays > 0 ? (
                            <span className="text-rose-600 font-bold text-[10px] ml-1">
                              ({slip.lopDays} LOP)
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-bold text-[10px] ml-1">
                              (0 LOP)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">
                        ₹{slip.proRataGross.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                        -₹{totalDeductions.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                        ₹{slip.netSalary.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <CheckCircle2 size={11} /> Credited
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedSlip(slip)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-[#0B1F3A] font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            title="View Breakdown"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleDownload(slip)}
                            disabled={isDownloading === slip.id}
                            className="px-3 py-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#132F58] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                            title="Download PDF"
                          >
                            <Download size={13} />
                            <span>{isDownloading === slip.id ? 'Generating...' : 'PDF'}</span>
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

      {/* Payslip View Modal */}
      <AnimatePresence>
        {selectedSlip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] overflow-y-auto"
            >
              {/* Institutional Header */}
              <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] flex items-center justify-center text-[#D4AF37] font-bold font-display shadow-xs shrink-0">
                    GL
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#0B1F3A] font-display">
                      GOLDEN LEAF FINANCE LIMITED
                    </h3>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Payslip for {new Date(selectedSlip.period + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSlip(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Employee Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Employee</span>
                    <p className="font-bold text-[#0B1F3A]">{selectedSlip.employeeName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{selectedSlip.employeeId}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Designation</span>
                    <p className="font-bold text-[#0B1F3A]">{selectedSlip.designation}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Branch</span>
                    <p className="font-bold text-[#0B1F3A]">{selectedSlip.branchName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Bank Account</span>
                    <p className="font-bold text-[#0B1F3A] font-mono">{selectedSlip.bankName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{selectedSlip.bankAccountNumber}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">IFSC</span>
                    <p className="font-bold text-[#0B1F3A] font-mono">{selectedSlip.bankIfsc}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Attendance</span>
                    <p className="font-bold text-[#0B1F3A]">
                      {selectedSlip.workingDays} / {selectedSlip.totalMonthDays} Days
                    </p>
                  </div>
                </div>

                {/* Earnings vs Deductions 2-Column Table */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Earnings Column */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-xs text-[#0B1F3A] flex justify-between">
                      <span>Earnings</span>
                      <span>Amount (₹)</span>
                    </div>
                    <div className="p-3 space-y-2 text-xs divide-y divide-slate-100">
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-600">Basic Salary</span>
                        <span className="font-bold font-mono">₹{selectedSlip.baseMonthly.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-600">House Rent Allowance (HRA)</span>
                        <span className="font-bold font-mono">₹{selectedSlip.hraMonthly.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-600">Special Allowance</span>
                        <span className="font-bold font-mono">₹{selectedSlip.specialAllowance.toLocaleString('en-IN')}</span>
                      </div>
                      {(selectedSlip.variableIncentive || 0) > 0 && (
                        <div className="flex justify-between pt-1.5 text-emerald-600">
                          <span>Performance Incentive</span>
                          <span className="font-bold font-mono">+₹{(selectedSlip.variableIncentive || 0).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-[#0B1F3A]">
                        <span>Total Gross</span>
                        <span className="font-mono text-blue-700">₹{selectedSlip.proRataGross.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions Column */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-xs text-[#0B1F3A] flex justify-between">
                      <span>Deductions</span>
                      <span>Amount (₹)</span>
                    </div>
                    <div className="p-3 space-y-2 text-xs divide-y divide-slate-100">
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-600">Provident Fund (PF)</span>
                        <span className="font-bold font-mono">₹{selectedSlip.pfDeduction.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-600">Employees' State Insurance (ESI)</span>
                        <span className="font-bold font-mono">₹{selectedSlip.esiDeduction.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-600">Professional Tax (PT)</span>
                        <span className="font-bold font-mono">₹{selectedSlip.ptDeduction.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-600">Income Tax (TDS)</span>
                        <span className="font-bold font-mono">₹{selectedSlip.tdsDeduction.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-rose-600">
                        <span>Total Deductions</span>
                        <span className="font-mono">
                          -₹{(selectedSlip.pfDeduction + selectedSlip.esiDeduction + selectedSlip.ptDeduction + selectedSlip.tdsDeduction).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Pay Highlight Banner */}
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                      Net Take-Home Pay
                    </span>
                    <p className="text-2xl font-black text-emerald-700 font-display">
                      ₹{selectedSlip.netSalary.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 size={14} /> Direct NEFT Transfer
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSlip(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition-colors text-center cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownload(selectedSlip);
                    setSelectedSlip(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132F58] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Download size={14} />
                  Download Institutional PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyPayslipsPage;
