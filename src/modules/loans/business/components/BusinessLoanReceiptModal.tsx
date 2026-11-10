// ──────────────────────────────────────────────────
// Golden Leaf Finance — Business Loan Collection Receipt Modal
// Standard Collection Receipt & Advance Collection Receipt (Print-Ready)
// ──────────────────────────────────────────────────

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, CheckCircle2, Receipt } from 'lucide-react';
import {
  type BusinessLoanRecord,
  type BusinessLoanCollectionRecord,
} from '../../../../types/businessLoan.types';

interface BusinessLoanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: BusinessLoanRecord | null;
  receipt: BusinessLoanCollectionRecord | null;
}

export const BusinessLoanReceiptModal: React.FC<BusinessLoanReceiptModalProps> = ({
  isOpen,
  onClose,
  loan,
  receipt,
}) => {
  if (!isOpen || !loan || !receipt) return null;

  const isAdvance = receipt.collectionType === 'ADVANCE';

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
          className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col print:max-h-none print:shadow-none print:rounded-none"
        >
          {/* Top Bar (Hidden in Print) */}
          <div className="print:hidden px-4 sm:px-5 py-3 sm:py-3.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <span className={`p-2 rounded-xl text-white ${isAdvance ? 'bg-amber-600' : 'bg-[#0B1F3A]'}`}>
                <Receipt size={16} />
              </span>
              <div>
                <h3 className="text-xs font-bold text-[#0B1F3A]">
                  {isAdvance ? 'Advance Collection Receipt' : 'Standard Collection Receipt'}
                </h3>
                <p className="text-[10px] text-gray-500 font-mono">{receipt.receiptNo}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#132c4e] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all min-h-[36px]"
              >
                <Printer size={13} />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Thermal / Laser Printable Receipt Slip */}
          <div className="p-6 text-gray-900 font-body print:p-0 text-xs space-y-4">
            {/* Header */}
            <div className="text-center border-b border-dashed border-gray-400 pb-3">
              <h2 className="text-sm font-black text-[#0B1F3A] uppercase tracking-wider">
                GOLDENLEAF FINANCE LIMITED
              </h2>
              <p className="text-[10px] text-gray-500">{loan.branchName}</p>
              <div className="mt-1.5 inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white bg-[#0B1F3A]">
                {isAdvance ? 'ADVANCE COLLECTION RECEIPT' : 'STANDARD COLLECTION RECEIPT'}
              </div>
            </div>

            {/* Receipt Meta */}
            <div className="flex justify-between items-center text-[11px] pb-2 border-b border-gray-200">
              <div>
                <span className="text-gray-500 block text-[9px] uppercase font-bold">Receipt Number</span>
                <strong className="font-mono text-[#0B1F3A]">{receipt.receiptNo}</strong>
              </div>
              <div className="text-right">
                <span className="text-gray-500 block text-[9px] uppercase font-bold">Collection Date & Time</span>
                <strong className="text-gray-700">{receipt.collectionDate}</strong>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-200 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Loan Account No:</span>
                <strong className="font-mono text-[#0B1F3A]">{loan.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer Name:</span>
                <strong className="text-gray-900">{loan.customerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shop / Business:</span>
                <strong className="text-gray-800 truncate max-w-[200px]">{loan.businessName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mobile Number:</span>
                <strong className="text-gray-800">{loan.primaryMobile}</strong>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border border-gray-300 rounded-xl overflow-hidden divide-y divide-gray-200 text-xs">
              <div className="p-2.5 flex justify-between bg-emerald-50/70">
                <span className="font-bold text-emerald-950 uppercase text-[10px]">Amount Collected</span>
                <strong className="text-emerald-900 font-black text-base font-mono">
                  ₹{receipt.amountPaid.toLocaleString('en-IN')}.00
                </strong>
              </div>
              <div className="p-2.5 flex justify-between bg-gray-50/50">
                <span className="text-gray-600">Installments Covered:</span>
                <strong className="text-gray-900">
                  {receipt.installmentsCovered} {loan.collectionFrequency === 'Daily' ? 'Days' : loan.collectionFrequency === 'Weekly' ? 'Weeks' : 'Months'}
                </strong>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-gray-600">Payment Mode:</span>
                <strong className="text-gray-900 uppercase">{receipt.paymentMode}</strong>
              </div>
              <div className="p-2.5 flex justify-between bg-gray-50/50">
                <span className="text-gray-600">Balance Pending:</span>
                <strong className="text-gray-900 font-mono">
                  ₹{loan.pendingOutstandingBalance.toLocaleString('en-IN')}.00
                </strong>
              </div>
            </div>

            {/* Collected By Footer */}
            <div className="pt-2 border-t border-dashed border-gray-400 flex items-center justify-between text-[10px] text-gray-600">
              <div>
                Collected By: <strong>{receipt.collectedByCroName}</strong> ({receipt.collectedByCroId})
              </div>
              <div className="text-right">
                <span className="text-emerald-700 font-bold">✓ Verified E-Receipt</span>
              </div>
            </div>

            <div className="text-center text-[9px] text-gray-400 pt-1">
              Thank you for banking with Goldenleaf Finance. Keep this receipt for your records.
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
