// ──────────────────────────────────────────────────
// Golden Leaf Finance — Admin Daily Gold Rate Master Modal
// Centralized Morning Rate Entry (Admin Only) • Auto Carat Formula (18K–22K)
// ──────────────────────────────────────────────────

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { goldLoanService } from '../../../../services/goldLoanService';
import { useAuthStore, useUIStore } from '../../../../store';

interface AdminGoldRateMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRateUpdated: () => void;
}

export const AdminGoldRateMasterModal: React.FC<AdminGoldRateMasterModalProps> = ({
  isOpen,
  onClose,
  onRateUpdated,
}) => {
  const currentRate = goldLoanService.getRateMaster();
  const currentUser = useAuthStore((s) => s.user);
  const { addToast } = useUIStore();

  const [rate22K, setRate22K] = useState<number>(currentRate.daily22KRatePerGram);
  const [maxLtv, setMaxLtv] = useState<number>(currentRate.maxPermittedLtvPercent);

  if (!isOpen) return null;

  // Formula previews
  const rate20K = Math.round(rate22K * (20 / 22));
  const rate18K = Math.round(rate22K * (18 / 22));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (rate22K <= 1000) {
      addToast({ type: 'error', title: 'Invalid Rate', message: 'Enter a realistic 22K gold rate per gram.' });
      return;
    }

    goldLoanService.updateRateMaster(
      rate22K,
      maxLtv,
      currentUser?.displayName || 'Administrator'
    );

    addToast({
      type: 'success',
      title: 'Daily Gold Rate Master Updated',
      message: `22K rate set to ₹${rate22K}/g (Max ${maxLtv}% LTV). Carat formulas adjusted across all branches.`,
    });

    onRateUpdated();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden font-body text-xs max-h-[92dvh] flex flex-col"
        >
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 bg-[#0B1F3A] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-white/10 text-[#D4AF37] shrink-0">
                <Sparkles size={16} />
              </span>
              <div>
                <h3 className="font-extrabold text-sm leading-tight">Centralized Morning Gold Rate Master</h3>
                <p className="text-[10px] text-gray-300">Admin Only • Branch override locked</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Daily 22K Market Gold Rate per Gram (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    step="10"
                    required
                    value={rate22K}
                    onChange={(e) => setRate22K(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-black text-base text-[#0B1F3A] focus:bg-white focus:border-[#0B1F3A] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Maximum Permitted LTV % (RBI Cap: 75%) *
                </label>
                <input
                  type="number"
                  min="50"
                  max="75"
                  required
                  value={maxLtv}
                  onChange={(e) => setMaxLtv(parseFloat(e.target.value) || 75)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-emerald-800 focus:bg-white focus:border-[#0B1F3A] outline-none"
                />
              </div>
            </div>

            {/* Carat Conversion Preview Table */}
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
              <span className="font-bold text-[#0B1F3A] uppercase text-[10px] block">
                Automatic Carat Purity Scale Matrix:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-white rounded-xl border border-emerald-300">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">22 Karat</span>
                  <strong className="text-emerald-800 text-xs font-mono font-black">₹{rate22K.toLocaleString('en-IN')}/g</strong>
                </div>
                <div className="p-2 bg-white rounded-xl border border-blue-200">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">20 Karat (20/22)</span>
                  <strong className="text-blue-900 text-xs font-mono font-bold">₹{rate20K.toLocaleString('en-IN')}/g</strong>
                </div>
                <div className="p-2 bg-white rounded-xl border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">18 Karat (18/22)</span>
                  <strong className="text-amber-900 text-xs font-mono font-bold">₹{rate18K.toLocaleString('en-IN')}/g</strong>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-gray-500 bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 flex items-start gap-1.5">
              <ShieldCheck size={14} className="text-blue-700 shrink-0 mt-0.5" />
              <span>
                Saving this updates the live valuation across all branches instantaneously. Branch staff are strictly locked from overriding these rates.
              </span>
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 min-h-[40px] rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center cursor-pointer active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 min-h-[40px] rounded-xl bg-[#0B1F3A] hover:bg-[#132c4e] text-white font-extrabold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <Check size={14} />
                <span>Save Morning Gold Rate</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
