// ──────────────────────────────────────────────────
// Golden Leaf Finance — Premature Closure & Partial Withdrawal Simulator
// RBI-Compliant Automated Settlement Formula (Section 6 & Tab 5)
// ──────────────────────────────────────────────────

import React, { useState } from 'react';
import { X, AlertTriangle, Calculator, CheckCircle, FileText, ArrowRight } from 'lucide-react';
import type { FixedDeposit } from '../../../types/fd.types';
import {
  computePrematureClosure,
  getDaysBetweenDates,
  formatINR,
  getBaseRateForDays,
} from '../../../utils/fdCalculations';
import { executePrematureClosure } from '../../../services/fdService';

interface PrematureClosureModalProps {
  fd: FixedDeposit;
  onClose: () => void;
  onSuccess: (updatedFD: FixedDeposit) => void;
}

export const PrematureClosureModal: React.FC<PrematureClosureModalProps> = ({
  fd,
  onClose,
  onSuccess,
}) => {
  const [penaltyPercent, setPenaltyPercent] = useState<number>(1.0); // Standard 1.0% penalty
  const [closureDate, setClosureDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [surrenderedBond, setSurrenderedBond] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // Compute actual days run
  const actualRunDays = Math.max(1, getDaysBetweenDates(fd.valueDate, closureDate));
  const baseRateForActualDays = getBaseRateForDays(actualRunDays);

  // Estimate monthly interest already paid out till today
  const monthsElapsed = Math.floor(actualRunDays / 30);
  const totalMonthlyInterestPaid =
    fd.scheme === 'non-cumulative'
      ? Math.round(monthsElapsed * fd.periodicPayoutAmount)
      : 0;

  const result = computePrematureClosure({
    principal: fd.principal,
    actualRunDays,
    baseRateForActualDays,
    penaltyDeductionPercent: penaltyPercent,
    totalMonthlyInterestPaid,
    taxDeclaration: fd.tdsStatus,
  });

  const handleExecute = async () => {
    if (!surrenderedBond) {
      alert('Physical FD Bond Certificate surrender must be confirmed prior to payout.');
      return;
    }

    try {
      setLoading(true);
      const updated = await executePrematureClosure(
        fd.id,
        {
          isPreclosed: true,
          requestedDate: closureDate,
          effectiveRunDays: actualRunDays,
          originalRate: fd.effectiveRate,
          penaltyRatePercent: penaltyPercent,
          recalculatedRate: result.penaltyRate,
          recalculatedInterest: result.recalculatedInterest,
          totalMonthlyInterestPaid,
          tdsDeducted: result.applicableTDS,
          netRefundablePayout: result.netRefundablePayout,
        },
        'admin'
      );
      onSuccess(updated);
    } catch (err: any) {
      alert(`Closure failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-red-200 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#991B1B] to-[#B91C1C] text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={20} className="text-[#FDE68A]" />
            <div>
              <h2 className="font-display font-bold text-base">
                Interactive Premature Closure Simulator
              </h2>
              <p className="text-[11px] text-white/80 font-mono">
                Bond No: {fd.fdNumber} · {fd.investorName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Simulator Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Formula Banner */}
          <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-[#991B1B]">
            <p className="font-bold uppercase tracking-wider mb-0.5">Automated Premature Settlement Formula:</p>
            <p className="font-mono text-[11px]">
              Net Refundable = Principal + Recalculated Interest (Run Days @ Penalty Rate) - Monthly Interest Already Paid - TDS
            </p>
          </div>

          {/* Input Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#475569] font-bold uppercase tracking-wider mb-1">
                Requested Closure Date
              </label>
              <input
                type="date"
                value={closureDate}
                onChange={(e) => setClosureDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] font-semibold text-[#0B1F3A] outline-none"
              />
              <span className="text-[11px] text-[#64748B] mt-0.5 block">
                Actual Run Days: <strong>{actualRunDays} days</strong> ({monthsElapsed} months elapsed)
              </span>
            </div>

            <div>
              <label className="block text-[#475569] font-bold uppercase tracking-wider mb-1">
                Premature Penalty Reduction
              </label>
              <select
                value={penaltyPercent}
                onChange={(e) => setPenaltyPercent(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] font-semibold text-[#0B1F3A] outline-none"
              >
                <option value={1.0}>1.00% Lower than Slab Rate</option>
                <option value={1.5}>1.50% Lower than Slab Rate</option>
                <option value={2.0}>2.00% Lower than Slab Rate</option>
              </select>
              <span className="text-[11px] text-[#64748B] mt-0.5 block">
                Original: {fd.effectiveRate}% → Penalty Rate: <strong>{result.penaltyRate.toFixed(2)}% p.a.</strong>
              </span>
            </div>
          </div>

          {/* Step-by-Step Breakdown Ledger */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-2.5">
            <h4 className="font-bold text-[#0B1F3A] uppercase tracking-wider text-[11px] pb-2 border-b border-[#E2E8F0]">
              Settlement Calculation Breakdown
            </h4>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748B]">Original Deposited Principal:</span>
              <span className="font-mono font-bold text-[#0B1F3A]">{formatINR(fd.principal)}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748B]">
                + Recalculated Interest ({actualRunDays} days @ {result.penaltyRate.toFixed(2)}%):
              </span>
              <span className="font-mono font-bold text-[#059669]">
                + {formatINR(result.recalculatedInterest)}
              </span>
            </div>

            {fd.scheme === 'non-cumulative' && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">
                  - Total Monthly Interest Already Paid Out ({monthsElapsed} payouts):
                </span>
                <span className="font-mono font-bold text-[#DC2626]">
                  - {formatINR(totalMonthlyInterestPaid)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748B]">- Applicable TDS Deductions:</span>
              <span className="font-mono font-bold text-[#DC2626]">
                - {formatINR(result.applicableTDS)}
              </span>
            </div>

            <div className="pt-3 border-t-2 border-[#CBD5E1] flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-[#991B1B]">
                  Net Refundable Payout Amount
                </span>
                <p className="text-[10px] text-[#64748B]">Credit to registered bank account</p>
              </div>
              <span className="text-xl font-display font-bold text-[#991B1B] font-mono">
                {formatINR(result.netRefundablePayout)}
              </span>
            </div>
          </div>

          {/* Compliance Checkbox */}
          <label className="flex items-center gap-2 p-3 rounded-xl bg-[#FAF7F0] border border-[#D4AF37]/50 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={surrenderedBond}
              onChange={(e) => setSurrenderedBond(e.target.checked)}
              className="rounded text-[#D4AF37] focus:ring-0"
            />
            <span className="font-semibold text-[#0B1F3A]">
              Original physical Fixed Deposit Bond Certificate surrendered & signed closure request verified.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#E2E8F0]">
            Cancel
          </button>
          <button
            onClick={handleExecute}
            disabled={loading || !surrenderedBond}
            className="px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing Pre-Closure...' : 'Authorize Premature Closure & Release Refund'}
          </button>
        </div>
      </div>
    </div>
  );
};
