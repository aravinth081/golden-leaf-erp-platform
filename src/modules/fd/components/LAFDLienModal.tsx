// ──────────────────────────────────────────────────
// Golden Leaf Finance — Loan Against Fixed Deposit (LAFD) Lien Modal
// Hard-Locks Deposit up to 75-90% at FD Rate + 2.0% (Section 6 & Tab 5)
// ──────────────────────────────────────────────────

import React, { useState } from 'react';
import { X, Lock, ShieldCheck, DollarSign, AlertCircle } from 'lucide-react';
import type { FixedDeposit } from '../../../types/fd.types';
import { formatINR } from '../../../utils/fdCalculations';
import { markFDLien, removeFDLien } from '../../../services/fdService';

interface LAFDLienModalProps {
  fd: FixedDeposit;
  onClose: () => void;
  onSuccess: (updatedFD: FixedDeposit) => void;
}

export const LAFDLienModal: React.FC<LAFDLienModalProps> = ({
  fd,
  onClose,
  onSuccess,
}) => {
  const isCurrentlyLiened = fd.status === 'Lien Marked';

  const maxLoanAmount = Math.round(fd.principal * 0.90); // 90% limit
  const defaultLoanAmount = Math.round(fd.principal * 0.75); // 75% default
  const [loanAmount, setLoanAmount] = useState<number>(defaultLoanAmount);
  const [reason, setReason] = useState<string>('Urgent liquidity against Fixed Deposit collateral');
  const [loanRefNo, setLoanRefNo] = useState<string>(`LAFD-${Date.now().toString().slice(-6)}`);
  const [loading, setLoading] = useState<boolean>(false);

  const loanRate = fd.effectiveRate + 2.0;

  const handleMarkLien = async () => {
    if (loanAmount <= 0 || loanAmount > maxLoanAmount) {
      alert(`Loan amount must be between ₹1,000 and ₹${maxLoanAmount.toLocaleString('en-IN')}`);
      return;
    }

    try {
      setLoading(true);
      const updated = await markFDLien(fd.id, {
        loanAmount,
        reason,
        loanReferenceNo: loanRefNo,
      });
      onSuccess(updated);
    } catch (err: any) {
      alert(`Failed to mark lien: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLien = async () => {
    if (!window.confirm('Confirm that the linked loan has been settled in full and remove the lien?')) {
      return;
    }

    try {
      setLoading(true);
      const updated = await removeFDLien(fd.id);
      onSuccess(updated);
    } catch (err: any) {
      alert(`Failed to remove lien: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#D4AF37]/40 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0B1F3A] text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Lock size={18} className="text-[#D4AF37]" />
            <div>
              <h2 className="font-display font-bold text-base">
                {isCurrentlyLiened ? 'Manage Active Loan Lien' : 'Mark Loan-Against-FD (LAFD) Lien'}
              </h2>
              <p className="text-[11px] text-[#D4AF37] font-mono">
                {fd.fdNumber} · {fd.investorName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Status info */}
          {isCurrentlyLiened ? (
            <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-pulse" />
                ACTIVE LIEN HARD-LOCKED
              </div>
              <p>
                This Fixed Deposit is currently pledged under Loan Reference{' '}
                <strong className="font-mono">{fd.lienDetails?.loanReferenceNo}</strong> for an active loan of{' '}
                <strong className="font-mono">{formatINR(fd.lienDetails?.loanAmount)}</strong>.
              </p>
              <p className="text-[11px] text-[#7F1D1D]">
                Premature withdrawal and maturity payouts are locked until the loan is closed.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#FFFDF7] border border-[#FDE68A] space-y-2 text-[#8C6808]">
              <p className="font-bold uppercase tracking-wider">LAFD Lending Policy:</p>
              <ul className="list-disc pl-4 space-y-1 text-xs text-[#64748B]">
                <li>Eligible Loan Limit: <strong>75% to 90%</strong> of Principal ({formatINR(maxLoanAmount)} max)</li>
                <li>Interest Charged: <strong>FD Rate + 2.00% = {loanRate.toFixed(2)}% p.a.</strong></li>
                <li>Customer avoids breaking deposit and keeps earning full FD interest</li>
              </ul>
            </div>
          )}

          {!isCurrentlyLiened ? (
            <div className="space-y-4">
              <div>
                <label className="block text-[#475569] font-bold uppercase tracking-wider mb-1">
                  Sanctioned Loan Amount (Rs.) *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm font-bold text-[#64748B]">₹</span>
                  <input
                    type="number"
                    max={maxLoanAmount}
                    min="5000"
                    step="5000"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[#CBD5E1] text-base font-bold font-mono text-[#0B1F3A] outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
                <span className="text-[11px] text-[#64748B] mt-1 block">
                  Maximum permitted: <strong className="text-[#0B1F3A]">{formatINR(maxLoanAmount)}</strong> (90% of {formatINR(fd.principal)})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#475569] font-bold uppercase tracking-wider mb-1">
                    Loan Reference No *
                  </label>
                  <input
                    type="text"
                    value={loanRefNo}
                    onChange={(e) => setLoanRefNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] font-mono text-xs font-bold text-[#0B1F3A] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-bold uppercase tracking-wider mb-1">
                    Loan Interest Rate
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${loanRate.toFixed(2)}% p.a. (FD + 2.0%)`}
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] bg-[#F1F5F9] font-bold text-[#059669] text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#475569] font-bold uppercase tracking-wider mb-1">
                  Purpose / Loan Details
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs text-[#0B1F3A] outline-none resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-2">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Sanctioned Loan Amount:</span>
                <span className="font-mono font-bold text-[#0B1F3A]">{formatINR(fd.lienDetails?.loanAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Loan Interest Rate:</span>
                <span className="font-bold text-[#059669]">{fd.lienDetails?.loanInterestRate.toFixed(2)}% p.a.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Lien Date:</span>
                <span className="text-[#0B1F3A]">{new Date(fd.lienDetails?.lienMarkedDate || '').toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#E2E8F0]">
            Close
          </button>

          {isCurrentlyLiened ? (
            <button
              onClick={handleRemoveLien}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-md transition-colors"
            >
              {loading ? 'Releasing Lien...' : 'Release Lien (Loan Closed)'}
            </button>
          ) : (
            <button
              onClick={handleMarkLien}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#B45309] hover:bg-[#92400E] text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
            >
              <Lock size={13} />
              {loading ? 'Locking FD...' : 'Mark Lien / Issue LAFD'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
