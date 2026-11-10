// ──────────────────────────────────────────────────
// Golden Leaf Finance — Top-Level FD & Investor KPI Ribbon
// 3-Second Visual Clarity (Admin & Branch Manager View)
// ──────────────────────────────────────────────────

import React from 'react';
import { DollarSign, ShieldCheck, CalendarCheck, AlertTriangle } from 'lucide-react';
import { formatINR } from '../../../utils/fdCalculations';
import { useAuthStore } from '../../../store';

interface FDKPIRibbonProps {
  metrics: {
    totalCorpus: number;
    activeBondsCount: number;
    monthlyPayoutCommitment: number;
    maturingCount: number;
    pendingCount?: number;
    lienCount?: number;
  };
  onCardClick?: (type: 'all' | 'active' | 'payouts' | 'maturing') => void;
}

export const FDKPIRibbon: React.FC<FDKPIRibbonProps> = ({ metrics, onCardClick }) => {
  const user = useAuthStore((s) => s.user);
  const role = user?.customClaims?.role || 'admin';
  const isAdmin = role === 'admin' || role === 'area_manager';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* 1. TOTAL FD CORPUS */}
      <div
        onClick={() => onCardClick?.('all')}
        className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
            1. Total FD Corpus
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center text-[#B45309]">
            <DollarSign size={16} />
          </div>
        </div>
        <div className="text-2xl font-display font-bold text-[#0B1F3A] tracking-tight">
          {formatINR(metrics.totalCorpus)}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-[#64748B]">Active + Cumulative Pool</span>
          <span className="font-semibold text-[#D4AF37] bg-[#FFFBEB] px-1.5 py-0.5 rounded text-[10px]">
            {isAdmin ? 'Company-Wide' : 'Own Branch'}
          </span>
        </div>
      </div>

      {/* 2. ACTIVE FD BONDS */}
      <div
        onClick={() => onCardClick?.('active')}
        className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
            2. Active FD Bonds
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#059669]">
            <ShieldCheck size={16} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-display font-bold text-[#065F46] tracking-tight">
            {metrics.activeBondsCount}
          </div>
          <span className="text-xs font-semibold text-[#047857]">Active Bonds</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D1FAE5] text-[#065F46] border border-[#34D399]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            EMERALD GREEN · VERIFIED
          </span>
        </div>
      </div>

      {/* 3. THIS MONTH PAYOUT */}
      <div
        onClick={() => onCardClick?.('payouts')}
        className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
            3. This Month Payout
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
            <CalendarCheck size={16} />
          </div>
        </div>
        <div className="text-2xl font-display font-bold text-[#1E40AF] tracking-tight">
          {formatINR(metrics.monthlyPayoutCommitment)}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-[#64748B]">1st & 5th Payout Queue</span>
          <span className="text-[10px] font-bold text-[#2563EB] bg-[#DBEAFE] px-1.5 py-0.5 rounded">
            NEFT / IMPS Ready
          </span>
        </div>
      </div>

      {/* 4. MATURING IN 30 DAYS */}
      <div
        onClick={() => onCardClick?.('maturing')}
        className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
            4. Maturing in 30 Days
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center text-[#D97706]">
            <AlertTriangle size={16} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-display font-bold text-[#B45309] tracking-tight">
            {metrics.maturingCount}
          </div>
          <span className="text-xs font-semibold text-[#92400E]">Maturing Soon</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            AMBER / GOLD · RENEWAL ALERT
          </span>
        </div>
      </div>
    </div>
  );
};
