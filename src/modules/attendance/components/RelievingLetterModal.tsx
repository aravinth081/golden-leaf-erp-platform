// ──────────────────────────────────────────────────
// Golden Leaf Finance — Sample Printable Template 2
// Official Relieving Letter & Experience Certificate
// Production-Ready • Section 9 Specification Compliant • Print-Optimized
// ──────────────────────────────────────────────────

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, ShieldCheck, Award, Lock, CheckCircle2 } from 'lucide-react';
import { type ResignationRecord } from '../../../types/resignation.types';

interface RelievingLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ResignationRecord | null;
}

export const RelievingLetterModal: React.FC<RelievingLetterModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  if (!isOpen || !record) return null;

  // 9.5 System Control Rule for Printing Relieving & Experience Certificates
  // The Print button must remain locked until all three approval stages are marked APPROVED
  const isAllStagesApproved =
    record.status === 'STAGE_3_APPROVED_RELIEVED' &&
    record.stage1.isApproved &&
    record.stage2.isApproved &&
    record.stage3.isApproved;

  const handlePrint = () => {
    if (!isAllStagesApproved) return;
    window.print();
  };

  const letterRef = record.stage3.officialRelievingLetterRefNo || 'GLF/HR/REL/2026/001';
  const issueDate = record.stage3.approvedAt ? record.stage3.approvedAt.slice(0, 10) : record.finalLastWorkingDay;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:z-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col print:max-h-none print:shadow-none print:rounded-none font-serif text-xs"
        >
          {/* Top Bar (Hidden in Print) */}
          <div className="print:hidden px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 font-sans">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#0B1F3A] text-[#D4AF37]">
                <Award size={18} />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-[#0B1F3A]">
                  Relieving Letter & Experience Certificate
                </h3>
                <p className="text-[11px] text-gray-500">
                  Ref: <strong>{letterRef}</strong> • Status:{' '}
                  {isAllStagesApproved ? (
                    <strong className="text-emerald-700">All 3 Stages Approved (Unlocked)</strong>
                  ) : (
                    <strong className="text-amber-700">Pending Approval (Locked)</strong>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {/* 9.5 Strict System Control Rule */}
              {isAllStagesApproved ? (
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs min-h-[38px]"
                >
                  <Printer size={15} />
                  <span>Print Relieving Letter</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold min-h-[38px]">
                  <Lock size={14} className="text-amber-700" />
                  <span>Printing Locked</span>
                </div>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Locked Watermark Notice if not all approved */}
          {!isAllStagesApproved && (
            <div className="print:hidden bg-amber-50 border-b border-amber-200 p-3 text-center text-xs text-amber-900 font-sans font-semibold">
              ⚠️ Section 9.5 Security Lock Active: This certificate remains digitally locked until Stage 1 (Branch Manager), Stage 2 (HR Notice), and Stage 3 (Admin) approvals are recorded.
            </div>
          )}

          {/* Printable Document Body */}
          <div className="p-10 sm:p-14 overflow-y-auto print:overflow-visible print:p-8 space-y-7 text-slate-900 leading-relaxed">
            {/* Header / Letterhead */}
            <div className="border-b-2 border-[#0B1F3A] pb-5 text-center font-sans space-y-1">
              <div className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">
                CIN: U65923TN2020PLC134882 • Reserve Bank of India Registered NBFC
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0B1F3A] tracking-wider uppercase">
                GOLDENLEAF FINANCE LIMITED
              </h1>
              <p className="text-xs text-slate-600 font-semibold max-w-xl mx-auto">
                Registered & Head Office: Goldenleaf Towers, 7th Floor, No. 42 Anna Salai, Chennai, Tamil Nadu - 600002
              </p>
              <div className="text-[11px] text-slate-500 font-medium">
                Phone: +91 44 2855 4900 • Email: hr@goldenleaf.in • Web: www.goldenleaf.in
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="text-center font-sans">
              <span className="inline-block px-5 py-1.5 rounded-full bg-slate-100 border border-slate-300 text-xs font-black text-[#0B1F3A] uppercase tracking-wider">
                Official Relieving Letter & Experience Certificate
              </span>
            </div>

            {/* 9.1 Letter Identification Details */}
            <div className="flex justify-between items-start font-sans text-xs border-b border-slate-200 pb-3">
              <div>
                <span className="text-slate-500 font-medium">Letter Reference Number:</span>{' '}
                <strong className="font-mono text-[#0B1F3A]">{letterRef}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-medium">Issue Date:</span>{' '}
                <strong>{issueDate}</strong>
              </div>
            </div>

            {/* 9.2 Employee Details & Body Text */}
            <div className="space-y-4 text-xs font-serif leading-relaxed text-slate-800">
              <div className="font-sans space-y-0.5">
                <div className="font-bold text-slate-900">To,</div>
                <div className="text-sm font-extrabold text-[#0B1F3A]">{record.employeeName}</div>
                <div className="text-slate-600 font-mono text-[11px]">Employee ID: {record.employeeId}</div>
                <div className="text-slate-700 font-semibold">{record.designation}</div>
                <div className="text-slate-600">{record.branchName} Branch</div>
              </div>

              <div className="pt-2 font-sans font-bold text-sm text-[#0B1F3A] border-b border-slate-200 pb-1">
                Subject: Relieving Letter Cum Experience Certificate
              </div>

              <p className="text-justify text-sm">
                This is to certify that <strong>{record.employeeName}</strong> (Employee ID: <strong>{record.employeeId}</strong>) was employed with Goldenleaf Finance Limited as a <strong>{record.designation}</strong> at our <strong>{record.branchName}</strong> branch from <strong>{record.dateOfJoining}</strong> to <strong>{record.finalLastWorkingDay}</strong>.
              </p>

              <p className="text-justify text-sm">
                With reference to your resignation dated <strong>{record.resignationDate}</strong>, we hereby inform you that your resignation has been duly verified and accepted through our three-stage approval process involving the Branch Manager, HR Department, and Admin.
              </p>

              <p className="text-justify text-sm">
                Having completed your required notice period of{' '}
                <strong>
                  {record.category === 'IMMEDIATE_EMERGENCY'
                    ? 'Approved Medical / Accident Waiver (Ref: ' + (record.emergencyMedicalRefNo || 'MED-REF') + ')'
                    : `${record.roleNoticeRequirementDays} Working Days`}
                </strong>{' '}
                and handed over all company responsibilities, customer portfolios, and field materials, you are officially relieved from your duties at the close of working hours on <strong>{record.finalLastWorkingDay}</strong>.
              </p>
            </div>

            {/* 9.3 Employment Summary & Exit Clearance Table */}
            <div className="font-sans pt-2">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#0B1F3A] mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                <span>9.3 Employment Summary & Exit Clearance Particulars</span>
              </div>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10.5px]">
                    <th className="py-2.5 px-3.5 text-left border-r border-slate-300 w-1/4">Employment Summary</th>
                    <th className="py-2.5 px-3.5 text-left border-r border-slate-300 w-1/4">Verified Details</th>
                    <th className="py-2.5 px-3.5 text-left border-r border-slate-300 w-1/4">Exit & Clearance Summary</th>
                    <th className="py-2.5 px-3.5 text-left w-1/4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2.5 px-3.5 font-medium text-slate-600 border-r border-slate-200">Date of Joining</td>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900 border-r border-slate-200">{record.dateOfJoining}</td>
                    <td className="py-2.5 px-3.5 font-medium text-slate-600 border-r border-slate-200">Notice Period Norm</td>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">{record.roleNoticeRequirementDays} Working Days</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-medium text-slate-600 border-r border-slate-200">Last Working Day (LWD)</td>
                    <td className="py-2.5 px-3.5 font-bold text-[#0B1F3A] border-r border-slate-200">{record.finalLastWorkingDay}</td>
                    <td className="py-2.5 px-3.5 font-medium text-slate-600 border-r border-slate-200">No-Dues Clearance</td>
                    <td className="py-2.5 px-3.5 font-bold text-emerald-800">VERIFIED & CLEARED</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-medium text-slate-600 border-r border-slate-200">Last Held Designation</td>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900 border-r border-slate-200">{record.designation}</td>
                    <td className="py-2.5 px-3.5 font-medium text-slate-600 border-r border-slate-200">Conduct During Tenure</td>
                    <td className="py-2.5 px-3.5 font-bold text-emerald-800">Good & Satisfactory</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs font-serif text-slate-700 italic pt-2">
              We appreciate your valuable contributions during your association with Goldenleaf Finance and wish you the very best in all your future professional endeavors.
            </p>

            {/* 9.4 Verification & Authorization Signatures */}
            <div className="font-sans pt-8 border-t border-slate-200 flex justify-between items-end text-xs">
              <div className="space-y-1 text-center w-52">
                <div className="font-mono text-[10px] text-slate-400">Digitally Verified on HR Gate</div>
                <div className="h-10 border-b border-slate-400 flex items-center justify-center font-bold text-slate-800">
                  {record.stage2.approvedBy || 'Head of Human Resources'}
                </div>
                <div className="font-bold text-[#0B1F3A] uppercase tracking-wide text-[11px] pt-1">
                  Verified By — HR Department
                </div>
                <div className="text-[10px] text-slate-500">Human Resources — Goldenleaf Finance</div>
              </div>

              <div className="space-y-1 text-center w-56">
                <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37] border-dashed mx-auto flex items-center justify-center text-[9px] font-bold text-[#0B1F3A] uppercase tracking-widest text-center leading-tight p-1 bg-amber-50/50">
                  Official Seal & Stamp
                </div>
                <div className="h-4 border-b border-slate-400 flex items-center justify-center font-bold text-[#0B1F3A]">
                  {record.stage3.approvedBy || 'Authorized Signatory'}
                </div>
                <div className="font-bold text-[#0B1F3A] uppercase tracking-wide text-[11px] pt-1">
                  Approved & Issued By — Admin
                </div>
                <div className="text-[10px] text-slate-500">Authorized Signatory (Official Seal)</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RelievingLetterModal;
