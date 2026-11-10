// ──────────────────────────────────────────────────
// Golden Leaf Finance — 12-Month Maturity Ladder & Liquidity Heatmap
// Compares Upcoming FD Maturities against Expected Loan EMI Collections (Section 6)
// ──────────────────────────────────────────────────

import React from 'react';
import { TrendingDown, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';
import { formatINR } from '../../../utils/fdCalculations';

interface MonthData {
  month: string;
  maturingPrincipal: number; // Outflow
  expectedCollections: number; // Inflow
  netSurplus: number;
}

export const MaturityLadderHeatmap: React.FC = () => {
  // 12-Month simulated cashflow schedule
  const schedule: MonthData[] = [
    { month: 'Mar 2026', maturingPrincipal: 350000, expectedCollections: 1250000, netSurplus: 900000 },
    { month: 'Apr 2026', maturingPrincipal: 500000, expectedCollections: 1300000, netSurplus: 800000 },
    { month: 'May 2026', maturingPrincipal: 200000, expectedCollections: 1280000, netSurplus: 1080000 },
    { month: 'Jun 2026', maturingPrincipal: 750000, expectedCollections: 1400000, netSurplus: 650000 },
    { month: 'Jul 2026', maturingPrincipal: 400000, expectedCollections: 1350000, netSurplus: 950000 },
    { month: 'Aug 2026', maturingPrincipal: 300000, expectedCollections: 1320000, netSurplus: 1020000 },
    { month: 'Sep 2026', maturingPrincipal: 600000, expectedCollections: 1450000, netSurplus: 850000 },
    { month: 'Oct 2026', maturingPrincipal: 250000, expectedCollections: 1380000, netSurplus: 1130000 },
    { month: 'Nov 2026', maturingPrincipal: 900000, expectedCollections: 1500000, netSurplus: 600000 },
    { month: 'Dec 2026', maturingPrincipal: 450000, expectedCollections: 1420000, netSurplus: 970000 },
    { month: 'Jan 2027', maturingPrincipal: 1200000, expectedCollections: 1600000, netSurplus: 400000 },
    { month: 'Feb 2027', maturingPrincipal: 550000, expectedCollections: 1480000, netSurplus: 930000 },
  ];

  const maxOutflow = Math.max(...schedule.map((s) => s.maturingPrincipal));

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F1F5F9] gap-2">
        <div>
          <h3 className="font-display font-bold text-base text-[#0B1F3A] flex items-center gap-2">
            <BarChart3 size={18} className="text-[#D4AF37]" />
            12-Month Maturity Ladder & Bank Liquidity Heatmap
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Forecast comparing Upcoming FD Maturities (Cash Outflow) vs Expected Loan EMI Collections (Cash Inflow)
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#EF4444]" />
            <span className="text-[#64748B] font-medium">FD Maturity Outflow</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#10B981]" />
            <span className="text-[#64748B] font-medium">Loan EMI Inflow</span>
          </div>
        </div>
      </div>

      {/* Grid Heatmap */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-5">
        {schedule.map((item, idx) => {
          const outflowIntensity = (item.maturingPrincipal / maxOutflow) * 100;
          const isHeavyMonth = item.maturingPrincipal >= 750000;

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border transition-all ${
                isHeavyMonth
                  ? 'border-[#FCA5A5] bg-[#FEF2F2]/60 shadow-sm'
                  : 'border-[#E2E8F0] bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-[#0B1F3A]">{item.month}</span>
                {isHeavyMonth && (
                  <span className="text-[9px] font-bold text-[#DC2626] bg-[#FEE2E2] px-1.5 py-0.2 rounded">
                    HIGH
                  </span>
                )}
              </div>

              {/* Mini visual comparison bar */}
              <div className="space-y-1.5 text-[11px]">
                <div>
                  <div className="flex justify-between text-[#DC2626] font-semibold text-[10px]">
                    <span>Outflow:</span>
                    <span className="font-mono">{formatINR(item.maturingPrincipal)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-[#EF4444] rounded-full"
                      style={{ width: `${outflowIntensity}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#059669] font-semibold text-[10px]">
                    <span>Inflow:</span>
                    <span className="font-mono">{formatINR(item.expectedCollections)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-[#10B981] rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] flex justify-between text-[10px]">
                  <span className="text-[#64748B]">Net Surplus:</span>
                  <span className="font-mono font-bold text-[#047857]">
                    +{formatINR(item.netSurplus)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
