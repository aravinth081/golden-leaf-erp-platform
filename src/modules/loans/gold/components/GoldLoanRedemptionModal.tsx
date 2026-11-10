// ──────────────────────────────────────────────────
// Golden Leaf Finance — Gold Loan Redemption & Vault Release Modal
// Sample 12 Part B Compliant • Principal + Exact-Day Interest • Pawn Ticket Surrender
// ──────────────────────────────────────────────────

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, CheckCircle2, ShieldCheck, Lock, Award, AlertTriangle } from 'lucide-react';
import { type GoldLoanRecord } from '../../../../types/goldLoan.types';
import { goldLoanService } from '../../../../services/goldLoanService';
import { useAuthStore, useUIStore } from '../../../../store';

interface GoldLoanRedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: GoldLoanRecord | null;
  onRedemptionSuccess: (updated: GoldLoanRecord) => void;
}

export const GoldLoanRedemptionModal: React.FC<GoldLoanRedemptionModalProps> = ({
  isOpen,
  onClose,
  loan,
  onRedemptionSuccess,
}) => {
  const currentUser = useAuthStore((s) => s.user);
  const { addToast } = useUIStore();

  const [principalAmount] = useState<number>(loan?.sanctionedLoanAmount || 0);
  const [accruedInterest, setAccruedInterest] = useState<number>(
    Math.round(((loan?.sanctionedLoanAmount || 0) * (loan?.interestRateAnnual || 12)) / 100 / 12)
  );
  const [isPawnTicketSurrendered, setIsPawnTicketSurrendered] = useState(true);
  const [isTrayPhotoMatched, setIsTrayPhotoMatched] = useState(true);
  const [borrowerAcknowledgedName, setBorrowerAcknowledgedName] = useState(loan?.customerName || '');

  if (!isOpen || !loan) return null;

  const totalSettlement = principalAmount + accruedInterest;
  const isAlreadyRedeemed = loan.status === 'REDEEMED_PACKET_RELEASED';

  const handleExecuteRedemption = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPawnTicketSurrendered) {
      addToast({
        type: 'error',
        title: 'Original Pawn Ticket Required',
        message: 'Borrower must physically surrender original Pawn Ticket before release.',
      });
      return;
    }

    if (!isTrayPhotoMatched) {
      addToast({
        type: 'error',
        title: 'Tray Photo Verification Required',
        message: 'Must verify ornaments in sealed pouch against initial appraisal photo.',
      });
      return;
    }

    const updated = goldLoanService.redeemAndReleasePacket(loan.id, {
      principalPaid: principalAmount,
      accruedInterestPaid: accruedInterest,
      branchManagerName: currentUser?.displayName || 'Branch Manager',
      borrowerSignatureName: borrowerAcknowledgedName || loan.customerName,
    });

    addToast({
      type: 'success',
      title: 'Gold Loan Redeemed & Packet Released',
      message: `Sealed pouch ${loan.tamperProofPacketSerialNo} marked RELEASED. NOC Certificate generated.`,
    });

    onRedemptionSuccess(updated);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:z-auto font-body text-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col print:max-h-none print:shadow-none print:rounded-none"
        >
          {/* Header */}
          <div className="print:hidden px-4 sm:px-6 py-3.5 sm:py-4 bg-[#0B1F3A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-600 text-white">
                <ShieldCheck size={18} />
              </span>
              <div>
                <h3 className="font-extrabold text-sm">
                  {isAlreadyRedeemed ? 'Gold Ornament Release Slip (Sample 12 Part B)' : 'Redemption & Gold Packet Handover'}
                </h3>
                <p className="text-[11px] text-gray-300">
                  Loan A/C: <strong>{loan.id}</strong> • Sealed Pouch: <strong>{loan.tamperProofPacketSerialNo}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {isAlreadyRedeemed && (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[38px]"
                >
                  <Printer size={14} />
                  <span>Print Release Acknowledgment</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-5 grow">
            {/* Top Info Banner */}
            <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Pledged Custody Ornaments</span>
                <strong className="text-sm font-extrabold text-[#0B1F3A] block">
                  {loan.totalQuantity} Pieces ({loan.totalGrossWeightGrams}g Gross / {loan.totalNetWeightGrams}g Net)
                </strong>
                <span className="text-[11px] text-gray-600">
                  Safe Location: <strong>{loan.safeVaultLocation.safeNumber}</strong> • Tray: <strong>{loan.safeVaultLocation.traySlot}</strong>
                </span>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Tamper-Proof Pouch</span>
                <strong className="font-mono text-sm font-bold text-amber-900 block">
                  {loan.tamperProofPacketSerialNo}
                </strong>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {isAlreadyRedeemed ? 'RELEASED & DELIVERED' : 'IN SAFE VAULT'}
                </span>
              </div>
            </div>

            {/* If NOT redeemed yet, show settlement calculation & release form */}
            {!isAlreadyRedeemed ? (
              <form onSubmit={handleExecuteRedemption} className="space-y-4">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                  <span className="font-extrabold text-emerald-950 uppercase tracking-wider block text-xs">
                    Full Settlement Calculation (Principal + Exact-Day Accrued Interest)
                  </span>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Principal Amount (₹)</label>
                      <input
                        type="number"
                        disabled
                        value={principalAmount}
                        className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg font-black text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Accrued Interest (₹)</label>
                      <input
                        type="number"
                        value={accruedInterest}
                        onChange={(e) => setAccruedInterest(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg font-bold text-emerald-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1">Total Settlement (₹)</label>
                      <div className="px-2.5 py-1.5 bg-emerald-200/80 border border-emerald-400 rounded-lg font-black text-emerald-950 text-sm font-mono">
                        ₹{totalSettlement.toLocaleString('en-IN')}.00
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2-Step Physical Verification Checkboxes */}
                <div className="p-4 bg-amber-50/60 border border-amber-300 rounded-2xl space-y-2.5">
                  <span className="font-extrabold text-[#0B1F3A] uppercase tracking-wider block text-xs">
                    Mandatory Physical Release Checklist
                  </span>

                  <label className="flex items-start gap-2 text-[11px] text-gray-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPawnTicketSurrendered}
                      onChange={(e) => setIsPawnTicketSurrendered(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-700"
                    />
                    <span>
                      <strong>1. Original Pawn Ticket Surrendered:</strong> Borrower has presented and surrendered the physical original Pawn Ticket & Pledge Receipt issued during loan origination.
                    </span>
                  </label>

                  <label className="flex items-start gap-2 text-[11px] text-gray-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isTrayPhotoMatched}
                      onChange={(e) => setIsTrayPhotoMatched(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-700"
                    />
                    <span>
                      <strong>2. Ornament Matching:</strong> Branch Manager and borrower inspected the sealed pouch barcode ({loan.tamperProofPacketSerialNo}) and matched the {loan.totalQuantity} ornaments with the live appraisal tray photo.
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                    Borrower Signature / Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={borrowerAcknowledgedName}
                    onChange={(e) => setBorrowerAcknowledgedName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-bold text-[#0B1F3A]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>Confirm Settlement & Release Gold</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Already Redeemed: Official Printable Release Slip (Sample 12 Part B) */
              <div className="border border-gray-300 rounded-2xl p-6 sm:p-8 space-y-4 bg-white shadow-2xs">
                <div className="text-center border-b border-gray-200 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0B1F3A] text-white px-3 py-1 rounded-full">
                    PART B: GOLD ORNAMENT REDEMPTION & SAFE VAULT RELEASE ACKNOWLEDGMENT
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-[11px] bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase font-bold">Redemption Date</span>
                    <strong>{loan.redemption?.redemptionDate || new Date().toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase font-bold">Total Paid</span>
                    <strong className="text-emerald-800 font-mono text-sm">
                      ₹{loan.redemption?.totalSettledAmount.toLocaleString('en-IN')}.00
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase font-bold">Receipt Number</span>
                    <strong className="font-mono text-[#0B1F3A]">{loan.redemption?.receiptNo}</strong>
                  </div>
                </div>

                {/* Statutory Borrower Acknowledgment Statement */}
                <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-xl leading-relaxed text-gray-800 italic text-[11px]">
                  "I, <strong>{loan.customerName}</strong>, confirm that I have repaid my Gold Loan Account No.{' '}
                  <strong className="font-mono">{loan.id}</strong> in full, surrendered my original Pawn Ticket, and received back all{' '}
                  <strong>{loan.totalQuantity} pieces</strong> of my pledged gold ornaments (Gross Weight:{' '}
                  <strong>{loan.totalGrossWeightGrams}g</strong>) from Sealed Packet No.{' '}
                  <strong className="font-mono">{loan.tamperProofPacketSerialNo}</strong> in good and intact condition."
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-4 border-t-2 border-[#0B1F3A] text-center">
                  <div className="border border-gray-300 rounded-xl p-3 h-24 flex flex-col justify-between">
                    <span className="text-[9px] font-bold uppercase text-gray-500">
                      Borrower Signature on Ornament Delivery
                    </span>
                    <strong className="text-[#0B1F3A] truncate">{loan.redemption?.borrowerAcknowledgedSignature || loan.customerName}</strong>
                  </div>

                  <div className="border border-gray-300 rounded-xl p-3 h-24 flex flex-col justify-between">
                    <span className="text-[9px] font-bold uppercase text-gray-500">
                      Branch Manager Release Sign & Vault Stamp
                    </span>
                    <strong className="text-emerald-900 truncate">
                      {loan.redemption?.releasedByBranchManager || 'Branch Manager'}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
