// ──────────────────────────────────────────────────
// Golden Leaf Finance — Fixed Deposit (FD) Module Workspace
// 5 Daily Operational Tabs (Section 7 of Functional Spec)
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  Shield, Clock, CalendarCheck, AlertTriangle,
  Lock, Printer, Download, Plus, CheckCircle, RefreshCw,
  Search, Eye, Filter, ArrowUpRight, BarChart3, PiggyBank
} from 'lucide-react';
import type { FixedDeposit, FDStatus } from '../../types/fd.types';
import type { Investor } from '../../types/investor.types';
import {
  getFixedDeposits,
  approveFixedDeposit,
  rolloverFDRenewal,
  getFDKPIMetrics,
} from '../../services/fdService';
import { getInvestors } from '../../services/investorService';
import { formatINR } from '../../utils/fdCalculations';
import { StatusBadge } from '../../components/ui/Badge';
import { FDKPIRibbon } from './components/FDKPIRibbon';
import { InstantCustomerSearch } from './components/InstantCustomerSearch';
import { FDBookingModal } from './components/FDBookingModal';
import { FDBondCertificateModal } from './components/FDBondCertificateModal';
import { PrematureClosureModal } from './components/PrematureClosureModal';
import { LAFDLienModal } from './components/LAFDLienModal';
import { MaturityLadderHeatmap } from './components/MaturityLadderHeatmap';
import { Investor360Drawer } from '../investor/components/Investor360Drawer';
import { useAuthStore } from '../../store';

type TabKey = 'active' | 'pending' | 'payouts' | 'maturing' | 'preclose';

export const FDListPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [fds, setFDs] = useState<FixedDeposit[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [prefilledInvestor, setPrefilledInvestor] = useState<Investor | null>(null);
  const [selectedBondFD, setSelectedBondFD] = useState<FixedDeposit | null>(null);
  const [precloseFD, setPrecloseFD] = useState<FixedDeposit | null>(null);
  const [lienFD, setLienFD] = useState<FixedDeposit | null>(null);
  const [drawerInvestor, setDrawerInvestor] = useState<Investor | null>(null);

  const user = useAuthStore((s) => s.user);
  const role = user?.customClaims?.role || 'admin';
  const isAdmin = role === 'admin' || role === 'area_manager';
  const isBranchManager = role === 'branch_manager';
  const userBranchId = isBranchManager ? user?.customClaims?.branchId : undefined;

  const loadData = async () => {
    try {
      setLoading(true);
      // Branch Manager sees only own branch records; Admin sees all
      const [fdList, invList] = await Promise.all([
        getFixedDeposits(userBranchId),
        getInvestors(userBranchId),
      ]);
      setFDs(fdList);
      setInvestors(invList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userBranchId]);

  const metrics = getFDKPIMetrics(userBranchId);

  // Filter FDs for active tab
  const getTabFDs = (tab: TabKey): FixedDeposit[] => {
    let list: FixedDeposit[] = [];
    switch (tab) {
      case 'active':
        list = fds.filter((f) => f.status === 'Active');
        break;
      case 'pending':
        list = fds.filter((f) => f.status === 'Pending Approval');
        break;
      case 'payouts':
        // Monthly interest queue (Active + non-cumulative monthly payout)
        list = fds.filter((f) => f.status === 'Active' && f.scheme === 'non-cumulative');
        break;
      case 'maturing':
        list = fds.filter((f) => f.status === 'Maturing Soon');
        break;
      case 'preclose':
        list = fds.filter((f) => f.status === 'Lien Marked' || f.status === 'Pre-Close Requested' || f.status === 'Matured & Settled');
        break;
      default:
        list = fds;
    }

    if (searchFilter.trim()) {
      const q = searchFilter.trim().toLowerCase();
      return list.filter(
        (f) =>
          f.fdNumber.toLowerCase().includes(q) ||
          f.investorName.toLowerCase().includes(q) ||
          f.investorMobile.includes(q) ||
          f.investorId.toLowerCase().includes(q)
      );
    }

    return list;
  };

  const currentTabFDs = getTabFDs(activeTab);

  // Checker Approval Action (Admin Only)
  const handleApproveFD = async (fd: FixedDeposit) => {
    if (!window.confirm(`Confirm verification that deposit funds of ₹${fd.principal.toLocaleString('en-IN')} are realized in Goldenleaf Finance bank account and issue official FD Bond Certificate?`)) {
      return;
    }

    try {
      await approveFixedDeposit(fd.id, user?.displayName || 'Admin Checker');
      await loadData();
      alert(`FD Bond ${fd.fdNumber} approved and Bond Certificate generated successfully.`);
    } catch (e: any) {
      alert(`Approval error: ${e.message}`);
    }
  };

  // 1-Click Renewal Rollover (Admin & BM)
  const handleRollover = async (fd: FixedDeposit) => {
    if (!window.confirm(`Initiate 1-Click FD Renewal Rollover for ${fd.fdNumber} (${fd.investorName})?`)) {
      return;
    }

    try {
      const renewed = await rolloverFDRenewal(fd.id, 'Principal + Interest', user?.displayName || 'Admin');
      await loadData();
      setSelectedBondFD(renewed);
    } catch (e: any) {
      alert(`Renewal error: ${e.message}`);
    }
  };

  const handleBulkNEFTExport = () => {
    if (currentTabFDs.length === 0) return;
    const headers = ['Beneficiary Account No', 'Beneficiary Name', 'Bank Name', 'IFSC Code', 'Amount (INR)', 'Value Date', 'FD Bond No', 'Payment Reference'];
    const rows = currentTabFDs.map((f) => {
      const inv = investors.find((i) => i.investorId === f.investorId);
      const accNo = inv?.bankAccount?.accountNumber || 'GLF-HOLD';
      const holder = inv?.bankAccount?.holderName || f.investorName;
      const bank = inv?.bankAccount?.bankName || 'State Bank of India';
      const ifsc = inv?.bankAccount?.ifsc || 'SBIN0000123';
      const amt = f.monthlyPayout || f.periodicPayoutAmount || Math.round((f.principal * f.effectiveRate) / 1200);
      return [
        `"${accNo}"`,
        `"${holder.replace(/"/g, '""')}"`,
        `"${bank.replace(/"/g, '""')}"`,
        ifsc,
        amt,
        new Date().toISOString().slice(0, 10),
        f.fdNumber,
        `INT-PAYOUT-${f.fdNumber}`,
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bulk_neft_payout_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#0B1F3A]">
            Fixed Deposit (FD) Module Workspace
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            {isAdmin
              ? 'Central Admin Checker Oversight · Multi-Branch Portfolio, Realization Verification & Bond Issuance'
              : `Branch Operations & Maker Bookings · ${user?.customClaims?.branchId || 'Assigned Branch Records Isolated'}`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#CBD5E1] text-[#334155] font-semibold text-xs hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <BarChart3 size={14} className="text-[#D4AF37]" />
              {showHeatmap ? 'Hide Liquidity Heatmap' : '12-Month Liquidity Heatmap'}
            </button>
          )}

          <button
            onClick={() => {
              setPrefilledInvestor(null);
              setIsBookingOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md"
          >
            <Plus size={15} /> + Book New FD Application
          </button>
        </div>
      </div>

      {/* Top-Level KPI Ribbon */}
      <FDKPIRibbon
        metrics={metrics}
        onCardClick={(type) => {
          if (type === 'active') setActiveTab('active');
          if (type === 'payouts') setActiveTab('payouts');
          if (type === 'maturing') setActiveTab('maturing');
        }}
      />

      {/* 12-Month Liquidity Heatmap (Admin Toggle) */}
      {isAdmin && showHeatmap && <MaturityLadderHeatmap />}

      {/* Instant Customer Identification Quick-Search Bar (Top of FD Column - Section 4) */}
      <InstantCustomerSearch
        onSelectInvestor={(inv) => {
          setDrawerInvestor(inv);
        }}
        onBookNewFD={(inv) => {
          setPrefilledInvestor(inv);
          setIsBookingOpen(true);
        }}
      />

      {/* 5-Tab Operational Workspace (Section 7) */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="flex items-center overflow-x-auto custom-scrollbar sm:grid sm:grid-cols-5 border-b border-[#E2E8F0] bg-[#FAF7F0] text-xs font-bold">
          {[
            {
              id: 'active',
              label: 'Tab 1: Active FDs',
              count: fds.filter((f) => f.status === 'Active').length,
              icon: PiggyBank,
            },
            {
              id: 'pending',
              label: 'Tab 2: Pending Approval',
              count: fds.filter((f) => f.status === 'Pending Approval').length,
              icon: Clock,
              alert: fds.filter((f) => f.status === 'Pending Approval').length > 0,
            },
            {
              id: 'payouts',
              label: 'Tab 3: Monthly Payout Queue',
              count: fds.filter((f) => f.status === 'Active' && f.scheme === 'non-cumulative').length,
              icon: CalendarCheck,
            },
            {
              id: 'maturing',
              label: 'Tab 4: Maturing Soon (30d)',
              count: fds.filter((f) => f.status === 'Maturing Soon').length,
              icon: AlertTriangle,
              warning: fds.filter((f) => f.status === 'Maturing Soon').length > 0,
            },
            {
              id: 'preclose',
              label: 'Tab 5: Premature & Lien',
              count: fds.filter((f) => f.status === 'Lien Marked' || f.status === 'Pre-Close Requested').length,
              icon: Lock,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabKey)}
                className={`py-4 px-3 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#D4AF37] text-[#0B1F3A] bg-white'
                    : 'border-transparent text-[#64748B] hover:text-[#0B1F3A]'
                }`}
              >
                <Icon
                  size={15}
                  className={
                    isActive
                      ? 'text-[#D4AF37]'
                      : tab.alert
                      ? 'text-[#EAB308]'
                      : tab.warning
                      ? 'text-[#F59E0B]'
                      : 'text-[#94A3B8]'
                  }
                />
                <span className="truncate">{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive
                      ? 'bg-[#D4AF37] text-white'
                      : tab.alert
                      ? 'bg-[#FEF9C3] text-[#A16207] font-bold'
                      : 'bg-[#E2E8F0] text-[#475569]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Sub-Header Actions */}
        <div className="p-4 bg-white border-b border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#0B1F3A]">
              Showing {currentTabFDs.length} record(s) in {activeTab.toUpperCase()} queue
            </span>
            {userBranchId && (
              <span className="text-[10px] font-bold text-[#D4AF37] bg-[#FFFDF7] px-2 py-0.5 rounded border border-[#D4AF37]/40">
                BRANCH ISOLATED
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {activeTab === 'payouts' && isAdmin && (
              <button
                onClick={handleBulkNEFTExport}
                disabled={currentTabFDs.length === 0}
                className="px-3 py-1.5 rounded-xl bg-[#0B1F3A] hover:bg-[#1E3A8A] text-white font-bold transition-colors flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Download size={13} /> 1-Click Bulk NEFT Export
              </button>
            )}

            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter tab table..."
              className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-xs outline-none w-44"
            />
          </div>
        </div>

        {/* Tab 1-5 Operational Table */}
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse min-w-[950px]">
            <thead className="bg-[#FAF7F0] border-b border-[#E2E8F0] text-[#8C6808] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Bond / Application No</th>
                <th className="p-3.5">Customer / Depositor</th>
                <th className="p-3.5">Branch</th>
                <th className="p-3.5">Scheme & Payout</th>
                <th className="p-3.5 text-right">Principal</th>
                <th className="p-3.5 text-right">Effective Rate</th>
                <th className="p-3.5">Value Date</th>
                <th className="p-3.5">Maturity Date</th>
                <th className="p-3.5 text-center">Status Badge</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F1F5F9]">
              {currentTabFDs.length > 0 ? (
                currentTabFDs.map((fd) => {
                  const inv = investors.find((i) => i.investorId === fd.investorId);

                  return (
                    <tr
                      key={fd.id}
                      onClick={() => setSelectedBondFD(fd)}
                      className="hover:bg-[#FFFDF7] transition-colors cursor-pointer group"
                    >
                      {/* Bond Number */}
                      <td className="p-3.5 font-mono font-bold text-[#8C6808] whitespace-nowrap">
                        {fd.fdNumber}
                      </td>

                      {/* Customer */}
                      <td className="p-3.5">
                        <div className="font-display font-bold text-[#0B1F3A] group-hover:text-[#D4AF37] transition-colors">
                          {fd.investorName}
                        </div>
                        <div className="text-[10px] text-[#64748B] flex items-center gap-1.5 mt-0.5">
                          <span>{fd.investorMobile}</span>
                          <span>·</span>
                          <span className="font-mono">{fd.investorId}</span>
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="p-3.5 text-[#334155] whitespace-nowrap">
                        {fd.branchName}
                      </td>

                      {/* Scheme & Payout */}
                      <td className="p-3.5">
                        <div className="font-semibold text-[#0B1F3A] capitalize">
                          {fd.scheme}
                        </div>
                        <div className="text-[10px] text-[#64748B]">
                          {fd.scheme === 'cumulative' ? 'At Maturity' : `${fd.payoutFrequency} (${fd.payoutDate})`}
                        </div>
                      </td>

                      {/* Principal */}
                      <td className="p-3.5 text-right font-mono font-bold text-[#0B1F3A]">
                        {formatINR(fd.principal)}
                      </td>

                      {/* Effective Rate */}
                      <td className="p-3.5 text-right font-mono font-bold text-[#059669]">
                        {fd.effectiveRate.toFixed(2)}% p.a.
                      </td>

                      {/* Value Date */}
                      <td className="p-3.5 font-mono text-[#475569] whitespace-nowrap">
                        {fd.valueDate}
                      </td>

                      {/* Maturity Date */}
                      <td className="p-3.5 font-mono font-semibold text-[#0B1F3A] whitespace-nowrap">
                        {fd.maturityDate}
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <StatusBadge status={fd.status} />
                      </td>

                      {/* Action buttons per tab */}
                      <td
                        className="p-3.5 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Checker approve in pending tab */}
                          {activeTab === 'pending' && isAdmin && (
                            <button
                              onClick={() => handleApproveFD(fd)}
                              className="px-2.5 py-1 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                            >
                              <CheckCircle size={12} /> Approve FD
                            </button>
                          )}

                          {/* Print Bond Certificate */}
                          {fd.bondIssued && (
                            <button
                              onClick={() => setSelectedBondFD(fd)}
                              className="px-2.5 py-1 rounded-lg bg-[#FAF7F0] hover:bg-[#F3EAD3] text-[#8C6808] border border-[#D4AF37]/40 text-xs font-bold transition-colors inline-flex items-center gap-1"
                              title="Print Official FD Bond Certificate"
                            >
                              <Printer size={12} /> Bond
                            </button>
                          )}

                          {/* 1-Click Renewal in Maturing tab */}
                          {activeTab === 'maturing' && (
                            <button
                              onClick={() => handleRollover(fd)}
                              className="px-2.5 py-1 rounded-lg bg-[#D4AF37] hover:bg-[#C9A227] text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <RefreshCw size={12} /> Rollover
                            </button>
                          )}

                          {/* LAFD Lien Action */}
                          {(activeTab === 'active' || activeTab === 'preclose') && (
                            <button
                              onClick={() => setLienFD(fd)}
                              className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                                fd.status === 'Lien Marked'
                                  ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]'
                                  : 'bg-[#F8FAFC] text-[#334155] border-[#CBD5E1] hover:bg-[#F1F5F9]'
                              }`}
                            >
                              <Lock size={12} />
                            </button>
                          )}

                          {/* Premature Closure Action */}
                          {(activeTab === 'active' || activeTab === 'preclose') && (
                            <button
                              onClick={() => setPrecloseFD(fd)}
                              className="px-2.5 py-1 rounded-lg bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] text-xs font-bold transition-colors"
                            >
                              Pre-Close
                            </button>
                          )}

                          {/* View Investor 360 */}
                          {inv && (
                            <button
                              onClick={() => setDrawerInvestor(inv)}
                              className="p-1 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]"
                              title="View Customer 360° Drawer"
                            >
                              <Eye size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#64748B]">
                    <PiggyBank size={32} className="mx-auto mb-2 text-[#CBD5E1]" />
                    <p className="font-semibold text-sm">No Fixed Deposit records found in this queue.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Form Modal */}
      {isBookingOpen && (
        <FDBookingModal
          initialInvestor={prefilledInvestor}
          onClose={() => {
            setIsBookingOpen(false);
            setPrefilledInvestor(null);
          }}
          onSuccess={(newFD) => {
            setIsBookingOpen(false);
            setPrefilledInvestor(null);
            loadData();
            setSelectedBondFD(newFD);
          }}
        />
      )}

      {/* Bond Certificate Modal */}
      {selectedBondFD && (
        <FDBondCertificateModal
          fd={selectedBondFD}
          investor={investors.find((i) => i.investorId === selectedBondFD.investorId) || null}
          onClose={() => setSelectedBondFD(null)}
        />
      )}

      {/* Premature Closure Simulator Modal */}
      {precloseFD && (
        <PrematureClosureModal
          fd={precloseFD}
          onClose={() => setPrecloseFD(null)}
          onSuccess={() => {
            setPrecloseFD(null);
            loadData();
          }}
        />
      )}

      {/* LAFD Lien Modal */}
      {lienFD && (
        <LAFDLienModal
          fd={lienFD}
          onClose={() => setLienFD(null)}
          onSuccess={() => {
            setLienFD(null);
            loadData();
          }}
        />
      )}

      {/* Investor 360° Drawer */}
      {drawerInvestor && (
        <Investor360Drawer
          investor={drawerInvestor}
          fds={fds.filter((f) => f.investorId === drawerInvestor.investorId)}
          onClose={() => setDrawerInvestor(null)}
          onBookFD={(inv) => {
            setDrawerInvestor(null);
            setPrefilledInvestor(inv);
            setIsBookingOpen(true);
          }}
          onViewBond={(fd) => setSelectedBondFD(fd)}
        />
      )}
    </div>
  );
};

export default FDListPage;
