// ──────────────────────────────────────────────────
// Golden Leaf Finance — Interest Rate Slab Configuration
// Admin Rate Slab Matrix & Regulatory Certificate Title Toggle (Section 2 & 6)
// ──────────────────────────────────────────────────

import React, { useState } from 'react';
import { Settings, Plus, Edit2, Check, ShieldCheck, FileText, Percent, Save } from 'lucide-react';
import {
  getRateSlabs,
  updateRateSlabs,
  getCertificateTitleSetting,
  setCertificateTitleSetting,
} from '../../services/fdService';
import type { FDRateSlab, CertificateTitleOption } from '../../types/fd.types';
import { useAuthStore } from '../../store';

export const FDRateSlabPage: React.FC = () => {
  const [slabs, setSlabs] = useState<FDRateSlab[]>(getRateSlabs());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState<number>(0);
  const [certTitle, setCertTitle] = useState<CertificateTitleOption>(getCertificateTitleSetting());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const user = useAuthStore((s) => s.user);
  const role = user?.customClaims?.role || 'admin';
  const isAdmin = role === 'admin' || role === 'area_manager';

  if (!isAdmin) {
    return (
      <div className="py-20 text-center text-sm font-semibold text-[#64748B]">
        Rate Slab and Certificate Settings are restricted to Administrator role.
      </div>
    );
  }

  const handleStartEdit = (slab: FDRateSlab) => {
    setEditingId(slab.id);
    setEditRate(slab.baseRate);
  };

  const handleSaveEdit = (id: string) => {
    const updated = slabs.map((s) => (s.id === id ? { ...s, baseRate: editRate } : s));
    setSlabs(updated);
    updateRateSlabs(updated);
    setEditingId(null);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTitleChange = (newTitle: CertificateTitleOption) => {
    setCertTitle(newTitle);
    setCertificateTitleSetting(newTitle);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-display font-bold text-[#0B1F3A] flex items-center gap-2.5">
          <Settings className="text-[#D4AF37]" size={26} />
          FD Rate Slab & Regulatory Certificate Settings
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Admin rate slab master table preventing unauthorized manual rate modifications by branch staff
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl text-xs font-semibold text-[#065F46] flex items-center gap-2 animate-fade-in">
          <Check size={16} className="text-[#059669]" />
          Settings successfully saved and synchronized across all branches.
        </div>
      )}

      {/* 1. Master Rate Slab Table */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#F1F5F9] flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-sm text-[#0B1F3A]">
              1. Master Interest Rate Slab by Tenure
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              System auto-fetches these rates during booking so staff cannot manually alter unauthorized base rates.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse min-w-[580px]">
            <thead className="bg-[#FAF7F0] border-b border-[#E2E8F0] text-[#8C6808] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Tenure Bracket</th>
                <th className="p-3.5">Min Days</th>
                <th className="p-3.5">Max Days</th>
                <th className="p-3.5 text-right">Base Interest Rate (% p.a.)</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {slabs.map((slab) => (
                <tr key={slab.id} className="hover:bg-[#FFFDF7] transition-colors">
                  <td className="p-3.5 font-bold text-[#0B1F3A]">{slab.label}</td>
                  <td className="p-3.5 font-mono text-[#475569]">{slab.minDays}</td>
                  <td className="p-3.5 font-mono text-[#475569]">
                    {slab.maxDays === 99999 ? 'No Limit' : slab.maxDays}
                  </td>
                  <td className="p-3.5 text-right">
                    {editingId === slab.id ? (
                      <input
                        type="number"
                        step="0.05"
                        min="1"
                        max="20"
                        value={editRate}
                        onChange={(e) => setEditRate(Number(e.target.value))}
                        className="w-24 px-2 py-1 border border-[#D4AF37] rounded-lg text-right font-bold text-xs font-mono outline-none"
                      />
                    ) : (
                      <span className="font-mono font-bold text-sm text-[#059669]">
                        {slab.baseRate.toFixed(2)}% p.a.
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    {editingId === slab.id ? (
                      <button
                        onClick={() => handleSaveEdit(slab.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer active:scale-[0.98]"
                      >
                        <Save size={12} /> Save
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(slab)}
                        className="px-2.5 py-1 rounded-lg bg-[#FAF7F0] hover:bg-[#F3EAD3] text-[#8C6808] border border-[#D4AF37]/40 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer active:scale-[0.98]"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Special Category Boosters Display */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 shadow-sm space-y-3">
        <h3 className="font-display font-bold text-sm text-[#0B1F3A] flex items-center gap-2">
          <Percent size={16} className="text-[#D4AF37]" />
          2. Category Booster Rules (System Rule-Applied)
        </h3>
        <p className="text-xs text-[#64748B]">
          These boosters are dynamically stacked on top of the base slab rate by automated system rules:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-between">
            <div>
              <p className="font-bold text-[#065F46]">Senior Citizen Booster</p>
              <p className="text-[11px] text-[#047857]">Auto-detected when age is 60+ from DOB</p>
            </div>
            <span className="font-mono font-bold text-sm text-[#059669]">+0.50% p.a.</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between">
            <div>
              <p className="font-bold text-[#1E40AF]">Staff / Employee Booster</p>
              <p className="text-[11px] text-[#1D4ED8]">Applicable to registered employees</p>
            </div>
            <span className="font-mono font-bold text-sm text-[#2563EB]">+1.00% p.a.</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF5FF] border border-[#E9D5FF] flex items-center justify-between">
            <div>
              <p className="font-bold text-[#6B21A8]">Renewal Loyalty Bonus</p>
              <p className="text-[11px] text-[#7E22CE]">Applied on 1-click renewal rollover</p>
            </div>
            <span className="font-mono font-bold text-sm text-[#9333EA]">+0.25% p.a.</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-between">
            <div>
              <p className="font-bold text-[#92400E]">High-Value Bulk Deposit</p>
              <p className="text-[11px] text-[#B45309]">Deposits of Rs. 15 Lakhs and above</p>
            </div>
            <span className="font-mono font-bold text-sm text-[#D97706]">+0.25% p.a.</span>
          </div>
        </div>
      </div>

      {/* 3. Customizable Regulatory Receipt Header Toggle (Section 2) */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 shadow-sm space-y-3">
        <h3 className="font-display font-bold text-sm text-[#0B1F3A] flex items-center gap-2">
          <FileText size={16} className="text-[#D4AF37]" />
          3. Customizable Regulatory Certificate Title Toggle
        </h3>
        <p className="text-xs text-[#64748B]">
          Supports statutory compliance across diverse financial registrations. Toggles the title printed on the official certificate without altering the underlying math calculation engine.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          {[
            'Fixed Deposit (FD) Bond',
            'Member Deposit Receipt',
            'Subordinated Debt / Investor Promissory Note',
          ].map((title) => {
            const isSelected = certTitle === title;
            return (
              <div
                key={title}
                onClick={() => handleTitleChange(title as CertificateTitleOption)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#D4AF37] bg-[#FFFDF7] shadow-sm'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#0B1F3A]">{title}</span>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-[#D4AF37]' : 'border-[#CBD5E1]'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
                  </div>
                </div>
                <span className="text-[11px] text-[#64748B]">
                  {title === 'Fixed Deposit (FD) Bond'
                    ? 'Standard Finance Company Deposit Bond'
                    : title === 'Member Deposit Receipt'
                    ? 'Nidhi / Society Statutory Receipt'
                    : 'Unsecured Promissory Note'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FDRateSlabPage;
