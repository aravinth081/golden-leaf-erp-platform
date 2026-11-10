// ──────────────────────────────────────────────────
// Golden Leaf Finance — Gold Loan Pawn Ticket & Pledge Receipt Modal
// Production-Ready • Sample 12 Part A Compliant • Official Vault Pledge Receipt
// ──────────────────────────────────────────────────

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, ShieldCheck, Award, FileText } from 'lucide-react';
import { type GoldLoanRecord } from '../../../../types/goldLoan.types';

interface GoldLoanPawnTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: GoldLoanRecord | null;
}

export const GoldLoanPawnTicketModal: React.FC<GoldLoanPawnTicketModalProps> = ({
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
          className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col print:max-h-none print:shadow-none print:rounded-none font-body text-xs"
        >
          {/* Top Bar (Hidden in Print) */}
          <div className="print:hidden px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#0B1F3A] text-white">
                <FileText size={18} />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-[#0B1F3A]">
                  Gold Loan Pawn Ticket & Ornament Pledge Receipt
                </h3>
                <p className="text-[11px] text-gray-500">
                  Loan A/C: <strong>{loan.id}</strong> • Sealed Packet: <strong>{loan.tamperProofPacketSerialNo}</strong>
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
                <span>Print Official Pawn Ticket</span>
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
          <div className="p-6 sm:p-10 overflow-y-auto text-gray-900 print:p-0 print:overflow-visible space-y-5">
            {/* Header */}
            <header className="border-b-2 border-[#0B1F3A] pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#D4AF37]" />
                    <h1 className="text-xl font-black text-[#0B1F3A] uppercase tracking-tight">
                      GOLDENLEAF FINANCE LIMITED
                    </h1>
                  </div>
                  <p className="text-[10px] font-bold text-gray-600 mt-0.5">
                    Branch Office: {loan.branchName} | Official Gold Loan Pawn Ticket & Ornament Pledge Receipt
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Reg. Office: Anna Nagar, Chennai | Custodian Vault Safe No: <strong>{loan.safeVaultLocation.safeNumber}</strong>
                  </p>
                </div>
                <div className="text-right shrink-0 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                  <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#0B1F3A] text-white">
                    PART A: PLEDGE RECEIPT
                  </span>
                  <div className="font-mono text-xs font-bold text-[#0B1F3A] mt-1">
                    {loan.id}
                  </div>
                  <div className="text-[10px] text-amber-900 font-mono font-bold">
                    Pouch: {loan.tamperProofPacketSerialNo}
                  </div>
                </div>
              </div>
            </header>

            {/* Borrower & Vault Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-[11px]">
              <div>
                <span className="text-gray-500 block text-[9px] uppercase font-bold">Borrower Name</span>
                <strong className="text-gray-900 text-xs">{loan.customerName}</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[9px] uppercase font-bold">Mobile Number</span>
                <strong className="text-gray-900">{loan.customerMobile}</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[9px] uppercase font-bold">Nominee Name</span>
                <strong className="text-gray-900">{loan.nomineeName} ({loan.nomineeRelationship})</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[9px] uppercase font-bold">Vault Slot Location</span>
                <strong className="text-[#0B1F3A] font-mono">
                  {loan.safeVaultLocation.safeNumber} / {loan.safeVaultLocation.rackCabinet} / {loan.safeVaultLocation.traySlot}
                </strong>
              </div>
            </div>

            {/* Pledged Ornaments Itemization Table */}
            <div className="border border-gray-300 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B1F3A] text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Pledged Ornament Description</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Gross Wt (g)</th>
                    <th className="p-2.5 text-right">Stone/Less (g)</th>
                    <th className="p-2.5 text-right">Net Wt (g)</th>
                    <th className="p-2.5 text-center">Purity</th>
                    <th className="p-2.5 text-right">Appraised Value (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loan.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="p-2.5 font-bold font-mono text-gray-500">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-gray-900">
                        {item.ornamentType}
                        {item.conditionRemarks && (
                          <span className="block text-[10px] text-gray-500 font-normal">{item.conditionRemarks}</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                      <td className="p-2.5 text-right font-mono">{item.grossWeightGrams.toFixed(3)}g</td>
                      <td className="p-2.5 text-right font-mono text-red-700">-{item.stoneDeductionGrams.toFixed(3)}g</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-800">{item.netWeightGrams.toFixed(3)}g</td>
                      <td className="p-2.5 text-center font-bold">{item.caratPurity}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-[#0B1F3A]">
                        ₹{item.eligibleMarketValue.toLocaleString('en-IN')}.00
                      </td>
                    </tr>
                  ))}

                  {/* Summary Total */}
                  <tr className="bg-amber-50/80 font-black text-xs border-t-2 border-amber-300">
                    <td colSpan={2} className="p-2.5 text-[#0B1F3A] uppercase tracking-wider">
                      TOTAL ORNAMENTS IN SEALED PACKET:
                    </td>
                    <td className="p-2.5 text-center font-mono">{loan.totalQuantity} Pcs</td>
                    <td className="p-2.5 text-right font-mono">{loan.totalGrossWeightGrams.toFixed(3)}g</td>
                    <td className="p-2.5 text-right font-mono text-red-700">-{loan.totalStoneDeductionGrams.toFixed(3)}g</td>
                    <td className="p-2.5 text-right font-mono text-emerald-900 text-sm">
                      {loan.totalNetWeightGrams.toFixed(3)}g
                    </td>
                    <td className="p-2.5 text-center font-bold text-gray-600">LTV 75%</td>
                    <td className="p-2.5 text-right font-mono font-black text-emerald-950 text-sm">
                      ₹{loan.totalAppraisedEligibleValue.toLocaleString('en-IN')}.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Financial Terms Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-blue-50/50 border border-blue-200 rounded-2xl text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Sanctioned Loan Amount</span>
                <strong className="text-emerald-900 text-sm font-black font-mono">
                  ₹{loan.sanctionedLoanAmount.toLocaleString('en-IN')}.00
                </strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Repayment Scheme</span>
                <strong className="text-[#0B1F3A] font-bold">{loan.repaymentScheme}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Interest Rate & Monthly Dues</span>
                <strong className="text-blue-900 font-bold">
                  {loan.interestRateAnnual}% p.a. (₹{loan.monthlyInterestAmount.toLocaleString('en-IN')}/mo)
                </strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Maturity Due Date</span>
                <strong className="text-red-700 font-bold">{loan.maturityDate}</strong>
              </div>
            </div>

            {/* Regulatory Notice */}
            {/* Live Captured Verification Photos (If Attached) */}
            {(loan.liveOrnamentTrayPhotoUrl || loan.liveCustomerCounterPhotoUrl) && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-gray-700 block">
                  Mandatory Verification Photos (Attached to Pawn Record)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {loan.liveOrnamentTrayPhotoUrl && (
                    <div className="border border-emerald-300 rounded-lg p-2 bg-white space-y-1">
                      <div className="h-28 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                        <img
                          src={loan.liveOrnamentTrayPhotoUrl}
                          alt="Ornament Tray on Scale"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-[9px] font-bold text-emerald-950 flex items-center justify-between">
                        <span>1. Ornament Tray & Scale</span>
                        <span className="text-emerald-700">✓ Verified</span>
                      </div>
                    </div>
                  )}

                  {loan.liveCustomerCounterPhotoUrl && (
                    <div className="border border-blue-300 rounded-lg p-2 bg-white space-y-1">
                      <div className="h-28 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                        <img
                          src={loan.liveCustomerCounterPhotoUrl}
                          alt="Borrower Counter Photo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-[9px] font-bold text-blue-950 flex items-center justify-between">
                        <span>2. Customer at Counter</span>
                        <span className="text-blue-700">✓ Verified</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-[10px] text-gray-600 space-y-1">
              <p>
                <strong>Terms of Pledge:</strong> 1) The original Pawn Ticket must be surrendered in person during redemption. 2) Monthly interest must be serviced regularly. Overdue accounts will attract reminder notices and statutory auction intimation under Section 176 of the Indian Contract Act 1872. 3) Ornaments will be returned in the original sealed pouch only after full payment of principal and interest.
              </p>
            </div>

            {/* Signature Blocks */}
            <div className="grid grid-cols-3 gap-6 pt-4 border-t-2 border-[#0B1F3A] text-center">
              <div className="border border-gray-300 rounded-xl p-3 h-28 flex flex-col justify-between bg-gray-50/40">
                <span className="text-[9px] font-bold uppercase text-gray-500">Borrower Pledge Signature</span>
                <div className="border-b border-dashed border-gray-400 my-auto py-1 text-[10px] text-gray-400 italic">
                  Sign Above
                </div>
                <strong className="text-[#0B1F3A] truncate">{loan.customerName}</strong>
              </div>

              <div className="border border-gray-300 rounded-xl p-3 h-28 flex flex-col justify-between bg-gray-50/40">
                <span className="text-[9px] font-bold uppercase text-gray-500">Appraiser / Credit Manager</span>
                <div className="my-auto py-1">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-bold">
                    PURITY VERIFIED
                  </span>
                </div>
                <strong className="text-blue-950 truncate">{loan.dualCustodySignoff.creditManagerName || 'Credit Manager'}</strong>
              </div>

              <div className="border-2 border-[#0B1F3A] rounded-xl p-3 h-28 flex flex-col justify-between bg-amber-50/40">
                <span className="text-[9px] font-bold uppercase text-[#0B1F3A]">Branch Manager / Custodian</span>
                <div className="my-auto py-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                    SEALED & VAULT LOCKED
                  </span>
                </div>
                <strong className="text-[#0B1F3A] truncate">{loan.dualCustodySignoff.branchManagerName || 'Branch Manager'}</strong>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
