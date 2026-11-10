// ──────────────────────────────────────────────────
// Golden Leaf Finance — CRO Gold Loan Referral Form
// Strict 3-Field Referral Only (Section 6 Specification)
// ──────────────────────────────────────────────────

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Phone, BadgeCheck, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react';
import { goldLoanService } from '../../../../services/goldLoanService';
import { useAuthStore, useUIStore } from '../../../../store';

export const CroGoldReferralForm: React.FC = () => {
  const currentUser = useAuthStore((s) => s.user);
  const { addToast } = useUIStore();

  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [employeeId, setEmployeeId] = useState(currentUser?.employeeId || 'GLF-CRO-101');
  const [notes, setNotes] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const existingReferrals = goldLoanService.getCroReferrals();

  const handleClear = () => {
    setCustomerName('');
    setCustomerMobile('');
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerMobile.trim() || !employeeId.trim()) {
      addToast({
        type: 'error',
        title: 'Mandatory Fields Missing',
        message: 'Please enter Customer Name, 10-Digit Mobile Number, and Employee ID.',
      });
      return;
    }

    const cleanMobile = customerMobile.replace(/[^0-9]/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      addToast({
        type: 'error',
        title: 'Invalid Mobile Number',
        message: 'Mobile number must be exactly 10 digits.',
      });
      return;
    }

    const newRef = goldLoanService.createCroReferral({
      customerName,
      customerMobile: cleanMobile,
      employeeId,
      branchId: currentUser?.customClaims?.branchId || 'BR-01',
      notes,
    });

    addToast({
      type: 'success',
      title: 'Gold Loan Referral Submitted',
      message: `Referral ${newRef.id} logged. Branch Manager and Credit Manager notified.`,
    });

    handleClear();
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-body pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#0B1F3A] via-[#132c4e] to-[#0B1F3A] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} />
            CRO Portal • Strict 3-Field Referral Screen
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-serif text-white">
            Gold Loan Customer Lead Referral
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            As a Customer Relationship Officer (CRO), refer prospective Gold Loan customers. Appraisal, purity testing, and sanctioning are handled at the branch counter.
          </p>
        </div>
      </div>

      {/* ─── RESTRICTED 3-FIELD REFERRAL FORM ─── */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-gray-100 pb-3">
          <h2 className="text-sm font-extrabold text-[#0B1F3A] uppercase tracking-wider flex items-center gap-2">
            <span>🪙</span> Gold Loan — Customer Referral Form
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tagged to your employee code so branch and Admin reports track your referral incentive.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Field 1: Customer Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                1. Customer Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  required
                  placeholder="Enter Customer Full Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#0B1F3A] outline-none transition-all"
                />
              </div>
            </div>

            {/* Field 2: Customer Mobile No. */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                2. Customer Mobile No. *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="Enter 10-Digit Mobile"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold font-mono focus:bg-white focus:border-[#0B1F3A] outline-none transition-all"
                />
              </div>
            </div>

            {/* Field 3: Employee ID */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                3. Employee ID *
              </label>
              <div className="relative">
                <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={16} />
                <input
                  type="text"
                  required
                  placeholder="e.g. GLF-CRO-105"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold font-mono focus:bg-white focus:border-[#0B1F3A] outline-none transition-all uppercase"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Referral Notes / Jewel Details (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Approximately 30g thali chain & bangles for emergency fund..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#0B1F3A] outline-none transition-all"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 min-h-[44px] rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase cursor-pointer flex items-center justify-center active:scale-[0.98]"
            >
              Clear Form
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 min-h-[44px] rounded-xl bg-[#0B1F3A] hover:bg-[#132c4e] text-white font-extrabold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Send size={15} />
              <span>Submit Gold Loan Referral</span>
            </button>
          </div>
        </form>
      </div>

      {/* ─── MY SUBMITTED REFERRALS QUEUE ─── */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-100 pb-2">
          <h3 className="font-extrabold text-[#0B1F3A] text-xs uppercase tracking-wider">
            My Gold Loan Referrals Queue ({existingReferrals.length})
          </h3>
          <span className="text-[10px] text-gray-500 font-medium">Branch Notified Automatically</span>
        </div>

        <div className="divide-y divide-gray-100">
          {existingReferrals.map((ref) => (
            <div key={ref.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div>
                <strong className="text-gray-900 block text-xs font-bold">{ref.customerName}</strong>
                <span className="text-[11px] text-gray-500 flex items-center gap-2 flex-wrap mt-0.5">
                  <span>📱 {ref.customerMobile}</span>
                  <span>• Referred: {ref.referredAt}</span>
                  <span>• Ref ID: <span className="font-mono">{ref.id}</span></span>
                </span>
                {ref.notes && <p className="text-[10.5px] text-gray-400 italic mt-0.5">{ref.notes}</p>}
              </div>

              <div className="shrink-0">
                {ref.status === 'PENDING' ? (
                  <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    ● PENDING WALK-IN
                  </span>
                ) : (
                  <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    ✓ SANCTIONED ({ref.convertedGoldLoanId})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
