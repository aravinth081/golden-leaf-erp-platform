// ──────────────────────────────────────────────────
// Golden Leaf Finance — Sample Printable Template 1
// Official Employee Resignation, Notice Period & No-Dues Clearance Form
// Production-Ready • Section 8 Specification Compliant • Print-Optimized
// ──────────────────────────────────────────────────

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, ShieldCheck, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { type ResignationRecord } from '../../../types/resignation.types';

interface NoDuesClearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ResignationRecord | null;
}

export const NoDuesClearanceModal: React.FC<NoDuesClearanceModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:z-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col print:max-h-none print:shadow-none print:rounded-none font-sans text-xs"
        >
          {/* Top Bar (Hidden in Print) */}
          <div className="print:hidden px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#0B1F3A] text-[#D4AF37]">
                <FileText size={18} />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-[#0B1F3A]">
                  No-Dues & Handover Clearance Form
                </h3>
                <p className="text-[11px] text-gray-500">
                  Resignation ID: <strong>{record.id}</strong> • Employee: <strong>{record.employeeName}</strong> ({record.employeeId})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#163359] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs min-h-[38px]"
              >
                <Printer size={15} />
                <span>Print No-Dues Form</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable Document Container */}
          <div className="p-8 sm:p-10 overflow-y-auto print:overflow-visible print:p-8 space-y-6 text-slate-800 leading-normal">
            {/* ── Document Header ── */}
            <div className="border-b-2 border-[#0B1F3A] pb-4 text-center space-y-1">
              <div className="text-[11px] font-bold text-amber-700 tracking-widest uppercase">
                Goldenleaf Finance Limited
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#0B1F3A] uppercase tracking-wide">
                GOLDENLEAF FINANCE
              </h1>
              <p className="text-xs font-semibold text-slate-600">
                Branch / Office: <span className="font-bold text-[#0B1F3A]">{record.branchName}</span>
              </p>
              <div className="inline-block px-4 py-1 rounded-full bg-slate-100 border border-slate-300 text-[11px] font-extrabold text-[#0B1F3A] uppercase tracking-wider mt-1">
                Official Employee Resignation, Notice Period & No-Dues Clearance Form
              </div>
            </div>

            {/* ── 8.1 Form Identification Details ── */}
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-[#0B1F3A] mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                <span>8.1 Form Identification Details</span>
              </div>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="w-1/3 py-2 px-3.5 bg-slate-50 font-bold text-slate-600 border-r border-slate-200">
                      Resignation ID
                    </td>
                    <td className="py-2 px-3.5 font-mono font-black text-[#0B1F3A]">
                      {record.id}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="w-1/3 py-2 px-3.5 bg-slate-50 font-bold text-slate-600 border-r border-slate-200">
                      Employee ID
                    </td>
                    <td className="py-2 px-3.5 font-mono font-bold text-slate-900">
                      {record.employeeId}
                    </td>
                  </tr>
                  <tr>
                    <td className="w-1/3 py-2 px-3.5 bg-slate-50 font-bold text-slate-600 border-r border-slate-200">
                      Initiation Date
                    </td>
                    <td className="py-2 px-3.5 font-semibold text-slate-800">
                      {record.initiationDate}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── 8.2 Employee & Notice Particulars ── */}
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-[#0B1F3A] mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                <span>8.2 Employee & Notice Particulars</span>
              </div>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10.5px]">
                    <th className="py-2 px-3.5 text-left border-r border-slate-300 w-1/2">
                      Employee & Notice Particulars
                    </th>
                    <th className="py-2 px-3.5 text-left">Verified Record</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2 px-3.5 font-medium text-slate-600 border-r border-slate-200">
                      Employee Full Name
                    </td>
                    <td className="py-2 px-3.5 font-bold text-[#0B1F3A]">
                      {record.employeeName}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3.5 font-medium text-slate-600 border-r border-slate-200">
                      Designation & Branch
                    </td>
                    <td className="py-2 px-3.5 font-semibold text-slate-800">
                      {record.designation} – {record.branchName}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3.5 font-medium text-slate-600 border-r border-slate-200">
                      Relieving Category
                    </td>
                    <td className="py-2 px-3.5 font-bold">
                      {record.category === 'IMMEDIATE_EMERGENCY' ? (
                        <span className="text-rose-700">Immediate Relieving (Medical / Accident Emergency)</span>
                      ) : (
                        <span className="text-emerald-700">Standard Notice Period</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3.5 font-medium text-slate-600 border-r border-slate-200">
                      Role Notice Requirement
                    </td>
                    <td className="py-2 px-3.5 font-bold text-slate-900">
                      {record.roleNoticeRequirementDays} Working Days
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3.5 font-medium text-slate-600 border-r border-slate-200">
                      Actual Working Days Served
                    </td>
                    <td className="py-2 px-3.5 font-bold text-slate-900">
                      {record.actualWorkingDaysServed} Working Days Completed
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3.5 font-medium text-slate-600 border-r border-slate-200">
                      Final Last Working Day (LWD)
                    </td>
                    <td className="py-2 px-3.5 font-bold text-[#0B1F3A]">
                      {record.finalLastWorkingDay}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── 8.3 Clearance Department & Verification Status ── */}
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-[#0B1F3A] mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                <span>8.3 Clearance Department & Verification Status</span>
              </div>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10.5px]">
                    <th className="py-2 px-3.5 text-left border-r border-slate-300 w-1/2">
                      Clearance Department
                    </th>
                    <th className="py-2 px-3.5 text-left">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2.5 px-3.5 font-medium text-slate-700 border-r border-slate-200">
                      1. Field Cash & Receipt Books
                    </td>
                    <td className="py-2.5 px-3.5 font-bold text-emerald-800">
                      {record.stage1.fieldCashZeroDuesConfirmed ? 'Cleared – Rs. 0 Pending' : 'Pending Verification'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-medium text-slate-700 border-r border-slate-200">
                      2. Client / File Portfolio Handover
                    </td>
                    <td className="py-2.5 px-3.5 font-bold text-[#0B1F3A]">
                      {record.stage1.portfolioReassigned
                        ? `Handed Over to: ${record.stage1.replacementEmployeeId} (${record.stage1.replacementEmployeeName})`
                        : 'Pending Reassignment (Zero Unassigned Gate)'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-medium text-slate-700 border-r border-slate-200">
                      3. Vault Keys / Appraisal Files
                    </td>
                    <td className="py-2.5 px-3.5 font-bold text-emerald-800">
                      {record.stage1.vaultKeysAppraisalFilesHandedOver
                        ? 'Verified & Handed Over'
                        : 'Pending Vault Custody Handover'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-medium text-slate-700 border-r border-slate-200">
                      4. Company ID Card & Assets
                    </td>
                    <td className="py-2.5 px-3.5 font-bold text-emerald-800">
                      {record.stage2.companyIdCardAssetsReturned ? 'Returned to HR Dept' : 'Pending Return'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-medium text-slate-700 border-r border-slate-200">
                      5. Leave / OD & F&F Settlement
                    </td>
                    <td className="py-2.5 px-3.5 font-bold text-emerald-800">
                      {record.stage2.leaveOdFnfSettlementCalculated ? 'Verified by HR Dept' : 'Under HR Calculation'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-medium text-slate-700 border-r border-slate-200">
                      6. Portal Login Deactivation
                    </td>
                    <td className="py-2.5 px-3.5 font-bold text-indigo-900">
                      {record.stage3.loginDeactivated ? 'Executed — RELIEVED (INACTIVE)' : 'Scheduled on LWD'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── 8.5 Emergency / Accident Immediate Relieving Attachment Note ── */}
            {record.category === 'IMMEDIATE_EMERGENCY' && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                <div className="font-bold text-rose-900 uppercase tracking-wide text-[11px] mb-1">
                  8.5 Emergency / Accident Immediate Relieving Attachment Note
                </div>
                <p className="text-rose-800 text-[11px] leading-relaxed">
                  The employee has been relieved under the Immediate Relieving clause for an accident or serious medical emergency.
                  Verified Hospital Discharge Summary / Medical Certificate is attached to this digital clearance record.
                </p>
                <div className="mt-2 font-mono text-xs font-extrabold text-rose-950">
                  Medical Reference Number: <strong>{record.emergencyMedicalRefNo || 'MED-REF-PENDING'}</strong>
                </div>
                {record.emergencyHospitalDetails && (
                  <div className="text-[11px] text-rose-700 mt-0.5">
                    Hospital Details: {record.emergencyHospitalDetails}
                  </div>
                )}
              </div>
            )}

            {/* ── 8.4 Approval & Signature Section ── */}
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-[#0B1F3A] mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                <span>8.4 Approval & Signature Section</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {/* Employee Signature */}
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 flex flex-col justify-between h-28">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Employee Signature</div>
                  <div className="font-bold text-[#0B1F3A] text-xs">
                    {record.employeeName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ID: {record.employeeId}
                  </div>
                </div>

                {/* Stage 1 BM Signature */}
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 flex flex-col justify-between h-28">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Stage 1 — Branch Manager</div>
                  <div className="font-bold text-emerald-800 text-xs">
                    {record.stage1.isApproved ? (
                      <>
                        <div>✓ Approved</div>
                        <div className="text-[10px] font-medium text-slate-600">{record.stage1.approvedBy}</div>
                      </>
                    ) : (
                      <span className="text-amber-600 italic">Pending Reassignment</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">{record.stage1.approvedAt || '—'}</div>
                </div>

                {/* Stage 2 HR Signature */}
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 flex flex-col justify-between h-28">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Stage 2 — HR Department</div>
                  <div className="font-bold text-emerald-800 text-xs">
                    {record.stage2.isApproved ? (
                      <>
                        <div>✓ Verified & Approved</div>
                        <div className="text-[10px] font-medium text-slate-600">{record.stage2.approvedBy}</div>
                      </>
                    ) : (
                      <span className="text-amber-600 italic">Awaiting Notice Gate</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">{record.stage2.approvedAt || '—'}</div>
                </div>

                {/* Stage 3 Admin Signature */}
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 flex flex-col justify-between h-28">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Stage 3 — Admin Final</div>
                  <div className="font-bold text-emerald-800 text-xs">
                    {record.stage3.isApproved ? (
                      <>
                        <div>✓ Final Clearance</div>
                        <div className="text-[10px] font-medium text-slate-600">{record.stage3.approvedBy}</div>
                      </>
                    ) : (
                      <span className="text-amber-600 italic">Pending Final Authorization</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">{record.stage3.approvedAt || '—'}</div>
                </div>
              </div>

              <div className="text-right text-[11px] font-bold text-slate-600 mt-4">
                For Goldenleaf Finance Limited
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NoDuesClearanceModal;
