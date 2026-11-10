// ──────────────────────────────────────────────────
// Golden Leaf Finance — Staff FD Referral Portal
// Credit Manager & Customer Relationship Officer (CRO) Supporting Sub-Feature (Section 8.2)
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, Phone, User, BadgeAlert, Clock, Sparkles } from 'lucide-react';
import { submitFDReferral, getFDReferrals } from '../../services/fdService';
import type { FDReferral } from '../../types/fd.types';
import { useAuthStore } from '../../store';

export const FDReferralPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [employeeCode, setEmployeeCode] = useState(user?.phoneNumber || 'GLF-CRO-0042');
  const [notes, setNotes] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myReferrals, setMyReferrals] = useState<FDReferral[]>([]);

  const loadReferrals = async () => {
    const list = await getFDReferrals();
    setMyReferrals(list);
  };

  useEffect(() => {
    loadReferrals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || customerPhone.trim().length !== 10) {
      alert('Please provide valid customer name and 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);
      await submitFDReferral(
        customerName,
        customerPhone,
        employeeCode,
        user?.uid || 'user_cro',
        user?.displayName || 'CRO Staff',
        user?.customClaims?.branchId || 'branch_chennai',
        notes
      );

      setSubmittedSuccess(true);
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      await loadReferrals();
      setTimeout(() => setSubmittedSuccess(false), 4000);
    } catch (err: any) {
      alert(`Referral failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-display font-bold text-[#0B1F3A] flex items-center gap-2.5">
          <Send className="text-[#D4AF37]" size={26} />
          Customer Fixed Deposit Lead Referral
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Credit Manager & Customer Relationship Officer (CRO) Supporting Lead Submission Screen
        </p>
      </div>

      {submittedSuccess && (
        <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 size={18} className="text-[#059669]" />
          <div>
            <p className="font-bold">Customer Lead Successfully Dispatched!</p>
            <p className="text-[11px] text-[#047857]">
              The Branch Manager and Central Admin have been notified to follow up and process the Fixed Deposit under your employee referral code.
            </p>
          </div>
        </div>
      )}

      {/* Restricted 3-Field Referral Form (Section 1 & 8.2) */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-5">
        <div className="pb-3 border-b border-[#F1F5F9]">
          <h3 className="font-display font-bold text-sm text-[#0B1F3A] uppercase tracking-wider">
            Restricted 3-Field Lead Entry
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Submit customer contact details for prompt branch deposit mobilization
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Field 1: Customer Name */}
          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wider">
              1. Customer Name <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-[#94A3B8]">
                <User size={16} />
              </span>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer full name"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#0B1F3A] outline-none focus:border-[#D4AF37]"
                required
              />
            </div>
          </div>

          {/* Field 2: Customer Phone Number */}
          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wider">
              2. Customer Phone Number (10 Digits) <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-[#94A3B8]">
                <Phone size={16} />
              </span>
              <input
                type="tel"
                maxLength={10}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit customer mobile number"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CBD5E1] font-mono text-xs font-bold text-[#0B1F3A] outline-none focus:border-[#D4AF37]"
                required
              />
            </div>
          </div>

          {/* Field 3: Employee Code / ID */}
          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wider">
              3. Referring Employee Code / ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
              placeholder="e.g. GLF-CRO-0042"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] font-mono text-xs font-bold text-[#0B1F3A] outline-none"
              required
            />
          </div>

          {/* Optional notes */}
          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wider">
              Customer Deposit Interest / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Interested in Rs. 3 Lakhs 2-year deposit; requested branch manager call tomorrow"
              className="w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] text-xs text-[#0B1F3A] outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 min-h-[44px] rounded-2xl bg-[#D4AF37] hover:bg-[#C9A227] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
          >
            <Send size={15} />
            {loading ? 'Transmitting Lead...' : 'Submit Customer Lead Referral'}
          </button>
        </form>
      </div>

      {/* Submitted Referrals List */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-4 bg-[#FAF7F0] border-b border-[#E2E8F0] flex items-center justify-between">
          <span className="font-bold text-xs text-[#8C6808] uppercase tracking-wider">
            My Submitted Referrals & Mobilization Status ({myReferrals.length})
          </span>
        </div>

        <div className="divide-y divide-[#F1F5F9] text-xs">
          {myReferrals.map((ref) => (
            <div key={ref.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <p className="font-bold text-[#0B1F3A]">{ref.customerName}</p>
                <p className="text-[11px] text-[#64748B] mt-0.5 font-mono">
                  Phone: {ref.customerPhone} · Tag: {ref.employeeCode}
                </p>
                {ref.notes && <p className="text-[11px] text-[#8C6808] italic mt-0.5">{ref.notes}</p>}
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    ref.status === 'Booked'
                      ? 'bg-[#D1FAE5] text-[#065F46]'
                      : ref.status === 'Followed Up'
                      ? 'bg-[#DBEAFE] text-[#1E40AF]'
                      : 'bg-[#FEF9C3] text-[#A16207]'
                  }`}
                >
                  {ref.status.toUpperCase()}
                </span>
                <p className="text-[10px] text-[#94A3B8] mt-1">
                  {new Date(ref.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FDReferralPage;
