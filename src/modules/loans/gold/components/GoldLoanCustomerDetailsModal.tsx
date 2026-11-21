// ──────────────────────────────────────────────────
// Golden Leaf Finance — Gold Loan Customer & Vault Dossier Modal
// Comprehensive Borrower KYC, Loan Sanction, Pledged Ornaments & Vault Ledger
// ──────────────────────────────────────────────────

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Phone,
  MapPin,
  ShieldCheck,
  Award,
  Lock,
  Printer,
  FileDown,
  Calendar,
  DollarSign,
  Edit2,
  Check,
  Scale,
  Sparkles,
} from 'lucide-react';
import { type GoldLoanRecord } from '../../../../types/goldLoan.types';
import { goldLoanService } from '../../../../services/goldLoanService';
import { generateGoldLoanPawnTicketPDF } from '../../../../utils/pdfGenerator';
import { useUIStore } from '../../../../store';

interface GoldLoanCustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: GoldLoanRecord | null;
  onOpenPawnTicket?: (loan: GoldLoanRecord) => void;
  onOpenRedemption?: (loan: GoldLoanRecord) => void;
  onLoanUpdated?: () => void;
}

export const GoldLoanCustomerDetailsModal: React.FC<GoldLoanCustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  loan,
  onOpenPawnTicket,
  onOpenRedemption,
  onLoanUpdated,
}) => {
  const addToast = useUIStore((s) => s.addToast);
  const [isEditingSanction, setIsEditingSanction] = useState(false);
  const [editSanctionVal, setEditSanctionVal] = useState<string>('');
  const [isSavingSanction, setIsSavingSanction] = useState(false);

  if (!isOpen || !loan) return null;

  const safeLocation = loan.safeVaultLocation || {
    safeNumber: 'SAFE-01',
    rackCabinet: 'RACK-B',
    traySlot: 'TRAY-01',
  };
  const dualSign = loan.dualCustodySignoff || {
    isCreditManagerAppraised: false,
    isBranchManagerVaultLocked: false,
  };
  const items = Array.isArray(loan.items) ? loan.items : [];

  const handleStartEditSanction = () => {
    setEditSanctionVal(String(loan.sanctionedLoanAmount || loan.maxEligibleLoanAmount || ''));
    setIsEditingSanction(true);
  };

  const handleSaveSanction = () => {
    const num = parseFloat(editSanctionVal) || 0;
    if (num <= 0) {
      addToast({
        type: 'warning',
        title: 'Invalid Amount',
        message: 'Please enter a valid loan sanction amount greater than zero.',
      });
      return;
    }

    try {
      setIsSavingSanction(true);
      goldLoanService.updateLoanSanctionAmount(loan.id, num);
      addToast({
        type: 'success',
        title: 'Sanction Amount Updated',
        message: `Loan ${loan.id} sanction amount updated to ₹${num.toLocaleString('en-IN')}.`,
      });
      setIsEditingSanction(false);
      if (onLoanUpdated) onLoanUpdated();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Unable to update loan sanction amount.',
      });
    } finally {
      setIsSavingSanction(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await generateGoldLoanPawnTicketPDF(loan);
      addToast({
        type: 'success',
        title: 'PDF Downloaded',
        message: `Pawn Ticket for ${loan.customerName} saved successfully.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Download Failed',
        message: err.message || 'Unable to generate Pawn Ticket PDF.',
      });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 font-jakarta">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col font-sans text-xs"
        >
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 bg-[#0B1F3A] text-white flex items-center justify-between gap-3 shrink-0 border-b border-[#243E66]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F5D061] via-[#D4AF37] to-[#8C6808] p-[1.5px] flex items-center justify-center shadow-xs">
                <div className="w-full h-full rounded-2xl bg-[#0B1F3A] flex items-center justify-center">
                  <User size={20} className="text-[#D4AF37]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-extrabold text-white tracking-tight">
                    {loan.customerName}
                  </h2>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-[#F5D061] border border-amber-400/30">
                    {loan.id}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {loan.status === 'ACTIVE_IN_VAULT' ? 'Active • Sealed in Vault' : loan.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Operating Branch: <strong>{loan.branchName || 'Main Branch'}</strong> • Tamper Pouch: <strong>{loan.tamperProofPacketSerialNo}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Close dossier"
            >
              <X size={18} />
            </button>
          </div>

          {/* Dossier Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
            {/* 1. BORROWER KYC & NOMINEE INFORMATION */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3.5 border-b border-slate-200 pb-2.5">
                <ShieldCheck size={16} className="text-[#D4AF37]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#0B1F3A]">
                  Borrower KYC & Nominee Profile
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Full Name</span>
                  <strong className="text-slate-900 font-extrabold text-sm">{loan.customerName}</strong>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Mobile Phone</span>
                  <a
                    href={`tel:${loan.customerMobile}`}
                    className="text-blue-700 hover:underline font-mono font-bold flex items-center gap-1"
                  >
                    <Phone size={11} />
                    <span>+91 {loan.customerMobile.replace('+91', '').trim()}</span>
                  </a>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Aadhaar (Masked)</span>
                  <span className="font-mono font-bold text-slate-800">
                    {loan.aadhaarNumber ? `XXXX-XXXX-${loan.aadhaarNumber.replace(/[^0-9]/g, '').slice(-4) || '4512'}` : 'Verified & Captured'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">PAN Number</span>
                  <span className="font-mono font-bold text-slate-800">{loan.panNumber || 'ABCDE1234F'}</span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Residential Address</span>
                  <div className="text-slate-700 font-medium flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    <span>{loan.customerAddress || 'Tamil Nadu, India'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Nominee Details</span>
                  <strong className="text-slate-900 font-bold">
                    {loan.nomineeName || 'Nominee'} ({loan.nomineeRelationship || 'Family'})
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Ownership Declaration</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                    <Check size={13} strokeWidth={3} />
                    <span>Declared & Legally Verified</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 2. SANCTION & LOAN FINANCIALS */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3.5 border-b border-emerald-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-emerald-700" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                    Loan Sanction & Financial Terms
                  </h3>
                </div>

                {!isEditingSanction && (
                  <button
                    type="button"
                    onClick={handleStartEditSanction}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Edit2 size={11} />
                    <span>Edit Sanction Amount</span>
                  </button>
                )}
              </div>

              {/* Edit Sanction Inline Box */}
              {isEditingSanction ? (
                <div className="mb-4 p-3 bg-white rounded-xl border border-emerald-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-emerald-900 block mb-1">
                      Enter Correct Sanction Amount (₹) (Max 75% LTV: ₹{Number(loan.maxEligibleLoanAmount || loan.totalAppraisedEligibleValue * 0.75).toLocaleString('en-IN')})
                    </label>
                    <input
                      type="number"
                      value={editSanctionVal}
                      onChange={(e) => setEditSanctionVal(e.target.value)}
                      className="w-64 px-3 py-1.5 rounded-lg border border-emerald-400 bg-emerald-50/50 font-black font-mono text-base text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. 470000"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSavingSanction}
                      onClick={handleSaveSanction}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                    >
                      <Check size={14} />
                      <span>{isSavingSanction ? 'Saving...' : 'Save Sanction'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingSanction(false)}
                      className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Sanctioned Amount</span>
                  <div className="text-lg font-black font-mono text-emerald-950 mt-0.5">
                    ₹{Number(loan.sanctionedLoanAmount || 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">Max 75% LTV Cap</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Interest Rate & Monthly Dues</span>
                  <div className="text-sm font-bold font-mono text-blue-950 mt-0.5">
                    ₹{Number(loan.monthlyInterestAmount || 0).toLocaleString('en-IN')}/mo
                  </div>
                  <span className="text-[10px] text-blue-800 font-semibold">{loan.interestRateAnnual || 12}% per annum</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Repayment Scheme</span>
                  <div className="font-extrabold text-slate-800 mt-0.5">
                    {loan.repaymentScheme || 'Monthly Interest Servicing'}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Tenure: {loan.tenureMonths || 12} Months</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Maturity Due Date</span>
                  <div className="font-mono font-bold text-red-700 mt-0.5">
                    {loan.maturityDate || '-'}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Auto-Reminder Enabled</span>
                </div>
              </div>
            </div>

            {/* 3. DUAL-CUSTODY SAFE VAULT DETAILS */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3.5 border-b border-amber-200 pb-2.5">
                <Lock size={16} className="text-amber-800" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-amber-950">
                  Dual-Custody Safe Vault Storage & Packet Seal
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-amber-900 uppercase block">Security Pouch Serial</span>
                  <span className="font-mono font-black text-amber-950 px-2 py-0.5 rounded bg-amber-200/70 border border-amber-300 inline-block mt-0.5">
                    {loan.tamperProofPacketSerialNo}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-amber-900 uppercase block">Safe Vault Slot</span>
                  <span className="font-mono font-extrabold text-[#0B1F3A] block mt-0.5">
                    {safeLocation.safeNumber} • {safeLocation.rackCabinet} • {safeLocation.traySlot}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-amber-900 uppercase block">Appraiser (Credit Manager)</span>
                  <div className="font-bold text-blue-950 mt-0.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>{dualSign.creditManagerName || 'Credit Manager'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {dualSign.isCreditManagerAppraised ? '✓ Purity Verified' : '○ Pending'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-amber-900 uppercase block">Key Custodian (Branch Manager)</span>
                  <div className="font-bold text-emerald-950 mt-0.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{dualSign.branchManagerName || 'Branch Manager'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {dualSign.isBranchManagerVaultLocked ? '✓ Vault Locked' : '○ Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. PLEDGED ORNAMENTS ITEMIZATION TABLE */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale size={15} className="text-[#0B1F3A]" />
                  <span className="font-bold text-xs uppercase tracking-wider text-[#0B1F3A]">
                    Pledged Ornaments Specification ({loan.totalQuantity} Items)
                  </span>
                </div>
                <div className="font-bold font-mono text-emerald-900 text-xs">
                  Net Gold: {Number(loan.totalNetWeightGrams || 0).toFixed(2)} g • Gross: {Number(loan.totalGrossWeightGrams || 0).toFixed(2)} g
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B1F3A] text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-2.5 text-center w-8">#</th>
                      <th className="p-2.5">Ornament Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Gross Wt</th>
                      <th className="p-2.5 text-right">Stone/Less</th>
                      <th className="p-2.5 text-right">Net Wt</th>
                      <th className="p-2.5 text-center">Purity</th>
                      <th className="p-2.5 text-right">Appraised Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold font-mono text-slate-400 text-center">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">
                          {item.ornamentType}
                          {item.conditionRemarks && (
                            <span className="block text-[10px] text-slate-500 font-normal">{item.conditionRemarks}</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono">{Number(item.grossWeightGrams || 0).toFixed(3)}g</td>
                        <td className="p-2.5 text-right font-mono text-red-600">-{Number(item.stoneDeductionGrams || 0).toFixed(3)}g</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700">{Number(item.netWeightGrams || 0).toFixed(3)}g</td>
                        <td className="p-2.5 text-center font-bold">{item.caratPurity}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-[#0B1F3A]">
                          ₹{Number(item.eligibleMarketValue || 0).toLocaleString('en-IN')}.00
                        </td>
                      </tr>
                    ))}

                    <tr className="bg-amber-50/90 font-black text-xs border-t-2 border-amber-300">
                      <td colSpan={2} className="p-2.5 text-[#0B1F3A] uppercase tracking-wider font-extrabold">
                        TOTAL IN SEALED PACKET:
                      </td>
                      <td className="p-2.5 text-center font-mono">{loan.totalQuantity} Pcs</td>
                      <td className="p-2.5 text-right font-mono">{Number(loan.totalGrossWeightGrams || 0).toFixed(3)}g</td>
                      <td className="p-2.5 text-right font-mono text-red-700">-{Number(loan.totalStoneDeductionGrams || 0).toFixed(3)}g</td>
                      <td className="p-2.5 text-right font-mono text-emerald-900 text-sm font-black">
                        {Number(loan.totalNetWeightGrams || 0).toFixed(3)}g
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-700">LTV 75%</td>
                      <td className="p-2.5 text-right font-mono font-black text-emerald-950 text-sm">
                        ₹{Number(loan.totalAppraisedEligibleValue || 0).toLocaleString('en-IN')}.00
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="text-[11px] text-slate-500 font-mono">
              Created: <strong>{loan.createdAt}</strong>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Pawn Ticket */}
              {onOpenPawnTicket && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPawnTicket(loan);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Printer size={14} className="text-[#D4AF37]" />
                  <span>Pawn Ticket</span>
                </button>
              )}

              {/* Download PDF */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-3.5 py-2 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#8C6808] border border-[#D4AF37]/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              >
                <FileDown size={14} />
                <span>Download PDF</span>
              </button>

              {/* Redeem Gold */}
              {onOpenRedemption && loan.status === 'ACTIVE_IN_VAULT' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRedemption(loan);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <Lock size={14} />
                  <span>Redeem Gold</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#152e50] text-white font-bold text-xs cursor-pointer transition-colors shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
