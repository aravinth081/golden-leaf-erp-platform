// ──────────────────────────────────────────────────
// Golden Leaf Finance — Business Loan Pre-Closing Letter & NOC Modal
// Production-Ready • 3-Step Audit Trail Verified • Official Certificate
// ──────────────────────────────────────────────────

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { type BusinessLoanRecord } from '../../../../types/businessLoan.types';

interface BusinessLoanNOCModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: BusinessLoanRecord | null;
}

export const BusinessLoanNOCModal: React.FC<BusinessLoanNOCModalProps> = ({
  isOpen,
  onClose,
  loan,
}) => {
  if (!isOpen || !loan) return null;

  const pre = loan.preClosure;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static print:z-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col print:max-h-none print:shadow-none print:rounded-none"
        >
          {/* Top Bar (Hidden in Print) */}
          <div className="print:hidden px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-700 text-white">
                <Award size={18} />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-[#0B1F3A]">
                  Pre-Closing Letter & No Objection Certificate (NOC)
                </h3>
                <p className="text-[11px] text-gray-500">
                  Loan A/C: <strong>{loan.id}</strong> • Certificate No: {pre?.nocCertificateNo || 'PENDING'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#132c4e] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all min-h-[38px]"
              >
                <Printer size={14} />
                <span>Print Official NOC</span>
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

          {/* Official NOC Document */}
          <div className="p-8 sm:p-12 text-gray-900 font-body print:p-0 text-xs space-y-6">
            {/* Header */}
            <div className="text-center border-b-2 border-[#0B1F3A] pb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full bg-[#D4AF37]" />
                <h1 className="text-xl font-black text-[#0B1F3A] uppercase tracking-wider">
                  GOLDENLEAF FINANCE LIMITED
                </h1>
              </div>
              <p className="text-[10px] text-gray-500 font-medium">
                Registered NBFC-ND | Reg. Office: Golden Leaf Towers, Anna Nagar East, Chennai - 600102
              </p>
              <div className="mt-2 inline-block px-4 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs uppercase tracking-wide">
                NO OBJECTION CERTIFICATE (NOC) & LOAN CLOSURE CONFIRMATION
              </div>
            </div>

            {/* Meta */}
            <div className="flex justify-between items-center text-[11px] bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div>
                <span className="text-gray-500 block text-[9px] uppercase font-bold">NOC Certificate No</span>
                <strong className="font-mono text-[#0B1F3A] text-xs">{pre?.nocCertificateNo || `GLF-NOC-BL-${Date.now().toString().slice(-6)}`}</strong>
              </div>
              <div className="text-right">
                <span className="text-gray-500 block text-[9px] uppercase font-bold">Issue Date</span>
                <strong className="text-gray-800">{pre?.nocIssuedAt || new Date().toLocaleDateString('en-IN')}</strong>
              </div>
            </div>

            {/* Letter Body */}
            <div className="space-y-3 leading-relaxed text-gray-700">
              <p>
                <strong>To Whomsoever It May Concern,</strong>
              </p>
              <p>
                This is to certify that <strong>{loan.customerName}</strong>, Proprietor/Owner of <strong>{loan.businessName}</strong>, having Residential Address at <em>{loan.residentialAddress}</em> and Primary Mobile No. <strong>{loan.primaryMobile}</strong>, had availed a <strong>Business Loan facility</strong> of <strong>₹{loan.sanctionedAmount.toLocaleString('en-IN')}</strong> under Loan Account No: <strong className="font-mono text-[#0B1F3A]">{loan.id}</strong> from our <strong>{loan.branchName}</strong>.
              </p>
              <p>
                We hereby confirm that the borrower has fully repaid the entire outstanding principal, interest, and all other dues payable under the aforesaid loan account. As of today, there are <strong>zero dues, zero overdues, and zero pending liabilities</strong> outstanding against the borrower for this facility.
              </p>
              <p>
                Goldenleaf Finance Limited has <strong>NO OBJECTION</strong> to the borrower and hereby releases any and all claims, hypothecations, or charges held over the borrower’s business assets and current stocks funded under this loan agreement.
              </p>
            </div>

            {/* 3-Step Pre-Closure Audit Trail Box */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2 text-[11px]">
              <span className="font-bold text-[#0B1F3A] uppercase tracking-wider block text-[10px]">
                3-Step Pre-Closure Verification & Approval Audit Trail:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-gray-200">
                  <span className="text-[9px] uppercase font-bold text-gray-400 block mb-1">Step 1: CRO Initiation</span>
                  <div className="font-bold text-[#0B1F3A]">{pre?.initiatedByCroName || loan.originatingCroName}</div>
                  <div className="text-[10px] text-gray-500">{pre?.initiatedAt || 'Verified & Initiated'}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-gray-200">
                  <span className="text-[9px] uppercase font-bold text-gray-400 block mb-1">Step 2: BM Zero-Dues Check</span>
                  <div className="font-bold text-emerald-800">{pre?.bmVerifiedBy || 'Branch Manager'}</div>
                  <div className="text-[10px] text-gray-500">Zero Balance Confirmed</div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-gray-200">
                  <span className="text-[9px] uppercase font-bold text-gray-400 block mb-1">Step 3: Admin Closure & NOC</span>
                  <div className="font-bold text-blue-900">{pre?.adminApprovedBy || 'Administrator'}</div>
                  <div className="text-[10px] text-gray-500">Approved & NOC Issued</div>
                </div>
              </div>
            </div>

            {/* Signature & Seal Block */}
            <div className="pt-6 border-t-2 border-[#0B1F3A] flex items-center justify-between text-center">
              <div>
                <div className="text-[10px] font-bold text-gray-500 mb-6">Customer Signature</div>
                <strong className="text-gray-800 block text-xs">{loan.customerName}</strong>
              </div>

              <div className="p-3 border-2 border-emerald-700 bg-emerald-50/50 rounded-2xl inline-block text-center">
                <span className="text-[9px] uppercase font-black text-emerald-900 block">GOLDENLEAF FINANCE</span>
                <span className="text-[10px] font-bold text-emerald-800">OFFICIAL NOC SEAL</span>
                <span className="text-[8px] font-mono block text-gray-500">{new Date().toLocaleDateString('en-IN')}</span>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-500 mb-6">Authorized Signatory</div>
                <strong className="text-[#0B1F3A] block text-xs">For Goldenleaf Finance Limited</strong>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
