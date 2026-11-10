// ──────────────────────────────────────────────────
// Golden Leaf Finance — Business Loan Sanction Letter & Key Fact Statement (KFS)
// Production-Ready • Sample 11 Print Compliant • Official NBFC Format
// ──────────────────────────────────────────────────

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, ShieldCheck, Building, CheckCircle2, FileText } from 'lucide-react';
import { type BusinessLoanRecord } from '../../../../types/businessLoan.types';

interface BusinessLoanSanctionLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: BusinessLoanRecord | null;
}

export const BusinessLoanSanctionLetterModal: React.FC<BusinessLoanSanctionLetterModalProps> = ({
  isOpen,
  onClose,
  loan,
}) => {
  if (!isOpen || !loan) return null;

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
          className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col print:max-h-none print:shadow-none print:rounded-none"
        >
          {/* Modal Toolbar (Hidden in Print) */}
          <div className="print:hidden px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#0B1F3A] text-white">
                <FileText size={18} />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-[#0B1F3A]">
                  Business Loan Sanction Letter & Key Fact Statement (KFS)
                </h3>
                <p className="text-[11px] text-gray-500">
                  Loan A/C: <strong>{loan.id}</strong> • Customer: {loan.customerName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#132c4e] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all min-h-[38px]"
              >
                <Printer size={14} />
                <span>Print Official Sanction Letter</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable Document Area */}
          <div className="p-6 sm:p-10 overflow-y-auto text-gray-900 font-body print:p-0 print:overflow-visible text-xs">
            {/* Bank Header */}
            <header className="border-b-2 border-[#0B1F3A] pb-4 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#D4AF37] inline-block" />
                    <h1 className="text-xl font-black text-[#0B1F3A] uppercase tracking-tight">
                      GOLDENLEAF FINANCE LIMITED
                    </h1>
                  </div>
                  <p className="text-[10px] font-bold text-gray-600 mt-0.5">
                    RBI Registered NBFC-ND | Reg. Office: Golden Leaf Towers, Anna Nagar, Chennai - 600102
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Branch Office: <strong>{loan.branchName}</strong> | Customer Care: 1800 10 888
                  </p>
                </div>
                <div className="text-right shrink-0 bg-gray-50 border border-gray-200 rounded-xl p-2.5">
                  <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#0B1F3A] text-white">
                    SANCTION CUM KFS
                  </span>
                  <div className="font-mono text-xs font-bold text-[#0B1F3A] mt-1">
                    {loan.id}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Sanction Date: {loan.bmSanctionedAt ? loan.bmSanctionedAt.slice(0, 10) : new Date().toLocaleDateString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-100 text-center">
                <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#0B1F3A]">
                  Official Business Loan Sanction Letter & Key Fact Statement (KFS)
                </h2>
              </div>
            </header>

            {/* Borrower & Co-Borrower Particulars */}
            <div className="mb-4 bg-gray-50/70 border border-gray-200 rounded-xl p-3.5 leading-relaxed">
              <p>
                <strong>To:</strong> <strong className="text-[#0B1F3A]">{loan.customerName}</strong> (Proprietor / Owner of{' '}
                <strong>{loan.businessName}</strong>, Shop Address: {loan.shopAddress}, Mobile: {loan.primaryMobile}) &{' '}
                <strong>Co-Applicant / Guarantor:</strong> {loan.coApplicant.fullName} (Relation: {loan.coApplicant.relationship}, Mobile: {loan.coApplicant.mobileNo}).
              </p>
              <p className="mt-1 text-gray-600">
                We are pleased to inform you that Goldenleaf Finance Limited has sanctioned your Business Loan facility under the terms and repayment schedule detailed below:
              </p>
            </div>

            {/* Sanction Terms Matrix Table (Sample 11 Format) */}
            <div className="border border-gray-300 rounded-xl overflow-hidden mb-6 shadow-xs">
              <div className="grid grid-cols-2 divide-x divide-gray-300 bg-[#0B1F3A] text-white px-3 py-2 font-bold text-[10px] uppercase tracking-wider">
                <span>BUSINESS LOAN PARTICULARS</span>
                <span>REPAYMENT & DEDUCTION SUMMARY</span>
              </div>
              <div className="grid grid-cols-2 divide-x divide-gray-300 divide-y divide-gray-200 text-xs">
                <div className="p-2.5 flex justify-between bg-gray-50/40">
                  <span className="text-gray-600 font-medium">Sanctioned Loan Principal</span>
                  <strong className="text-emerald-800 text-sm font-bold">
                    ₹{loan.sanctionedAmount.toLocaleString('en-IN')}.00
                  </strong>
                </div>
                <div className="p-2.5 flex justify-between bg-gray-50/40">
                  <span className="text-gray-600 font-medium">Processing & Upfront Deductions</span>
                  <strong className="text-red-700 font-mono">
                    ₹{loan.totalUpfrontDeductions.toLocaleString('en-IN')}.00
                  </strong>
                </div>

                <div className="p-2.5 flex justify-between">
                  <span className="text-gray-600 font-medium">Repayment Collection Mode</span>
                  <strong className="text-[#0B1F3A] uppercase font-bold">
                    {loan.collectionFrequency} COLLECTION
                  </strong>
                </div>
                <div className="p-2.5 flex justify-between bg-emerald-50/60">
                  <span className="text-emerald-950 font-bold uppercase text-[10px]">Net Disbursed Amount</span>
                  <strong className="text-emerald-900 font-black text-sm font-mono">
                    ₹{loan.netDisbursementAmount.toLocaleString('en-IN')}.00
                  </strong>
                </div>

                <div className="p-2.5 flex justify-between bg-gray-50/40">
                  <span className="text-gray-600 font-medium">Loan Tenure & Total Installments</span>
                  <strong className="text-gray-800">
                    {loan.tenureUnits} {loan.collectionFrequency === 'Daily' ? 'Days' : loan.collectionFrequency === 'Weekly' ? 'Weeks' : 'Months'} ({loan.totalInstallmentsCount} Installments)
                  </strong>
                </div>
                <div className="p-2.5 flex justify-between bg-gray-50/40">
                  <span className="text-gray-600 font-medium">Disbursement Bank & UTR</span>
                  <strong className="text-gray-800 font-mono text-[11px]">
                    {loan.disbursementMode || 'NEFT'} • {loan.adminDisbursementUtr || 'PENDING DISBURSEMENT'}
                  </strong>
                </div>

                <div className="p-2.5 flex justify-between">
                  <span className="text-gray-600 font-medium">Interest Rate (% p.a.)</span>
                  <strong className="text-gray-800">{loan.interestRateAnnual}% p.a. ({loan.interestType})</strong>
                </div>
                <div className="p-2.5 flex justify-between">
                  <span className="text-gray-600 font-medium">Installment (EMI) Amount</span>
                  <strong className="text-[#0B1F3A] font-extrabold text-sm font-mono">
                    ₹{loan.exactEmiPerPeriod.toLocaleString('en-IN')}.00 / {loan.collectionFrequency === 'Daily' ? 'Day' : loan.collectionFrequency === 'Weekly' ? 'Week' : 'Month'}
                  </strong>
                </div>

                <div className="p-2.5 flex justify-between bg-gray-50/40">
                  <span className="text-gray-600 font-medium">First Installment Start Date</span>
                  <strong className="text-gray-800">{loan.installmentStartDate}</strong>
                </div>
                <div className="p-2.5 flex justify-between bg-gray-50/40">
                  <span className="text-gray-600 font-medium">Last Installment End Date</span>
                  <strong className="text-gray-800">{loan.installmentEndDate}</strong>
                </div>

                <div className="p-2.5 flex justify-between">
                  <span className="text-gray-600 font-medium">Originated CRO Employee ID</span>
                  <strong className="text-gray-800">
                    {loan.originatingCroName} ({loan.originatingCroId})
                  </strong>
                </div>
                <div className="p-2.5 flex justify-between">
                  <span className="text-gray-600 font-medium">Verified By Credit Manager</span>
                  <strong className="text-blue-900">
                    {loan.cmReviewedBy || 'Credit Manager'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Mandatory Terms Printed on Business Loan Sanction Letter */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] space-y-1.5 mb-8 text-gray-800">
              <span className="font-extrabold text-[#0B1F3A] uppercase tracking-wide block">
                Mandatory Regulatory Terms Printed on Business Loan Sanction Letter:
              </span>
              <p>
                <strong>1. Official Printed Receipts Only:</strong> Borrowers must collect an official printed Collection Receipt or Advance Collection Receipt from the Customer Relationship Officer (CRO) for every installment payment made. Cash payments without a receipt will not be credited.
              </p>
              <p>
                <strong>2. 3-Step Pre-Closure Rule:</strong> Early loan closure requires initiation by the CRO, zero-dues verification by the Branch Manager, and final approval by the Admin to generate the official Pre-Closing Letter & No Objection Certificate (NOC).
              </p>
            </div>

            {/* Signature Blocks */}
            <div className="grid grid-cols-3 gap-6 pt-4 border-t-2 border-[#0B1F3A] text-center">
              <div className="border border-gray-300 rounded-xl p-3 h-28 flex flex-col justify-between bg-gray-50/40">
                <span className="text-[9px] font-bold uppercase text-gray-500">Borrower Acceptance Signature</span>
                <div className="border-b border-dashed border-gray-400 my-auto py-1 text-[10px] text-gray-400 italic">
                  Sign Above
                </div>
                <strong className="text-[#0B1F3A] truncate">{loan.customerName}</strong>
              </div>

              <div className="border border-gray-300 rounded-xl p-3 h-28 flex flex-col justify-between bg-gray-50/40">
                <span className="text-[9px] font-bold uppercase text-gray-500">Co-Applicant / Guarantor Signature</span>
                <div className="border-b border-dashed border-gray-400 my-auto py-1 text-[10px] text-gray-400 italic">
                  Sign Above
                </div>
                <strong className="text-gray-700 truncate">{loan.coApplicant.fullName}</strong>
              </div>

              <div className="border-2 border-[#0B1F3A] rounded-xl p-3 h-28 flex flex-col justify-between bg-blue-50/40">
                <span className="text-[9px] font-bold uppercase text-[#0B1F3A]">Authorized Signatory</span>
                <div className="my-auto py-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                    SANCTIONED & VERIFIED
                  </span>
                </div>
                <strong className="text-[#0B1F3A] truncate">For Goldenleaf Finance Limited</strong>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
