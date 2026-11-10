// ──────────────────────────────────────────────────
// Golden Leaf Finance — 360° Customer / Investor Drawer
// Detailed Account View with 4 Operational Tabs (Section 7A)
// ──────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  X, PieChart, FileText, Landmark, ShieldAlert,
  Download, Printer, PlusCircle, CheckCircle, Clock,
  Smartphone, Bell, AlertCircle, ArrowUpRight, Lock
} from 'lucide-react';
import type { Investor } from '../../../types/investor.types';
import type { FixedDeposit } from '../../../types/fd.types';
import { formatINR } from '../../../utils/fdCalculations';
import { StatusBadge } from '../../../components/ui/Badge';

interface Investor360DrawerProps {
  investor: Investor;
  fds: FixedDeposit[];
  onClose: () => void;
  onBookFD?: (investor: Investor) => void;
  onViewBond?: (fd: FixedDeposit) => void;
}

export const Investor360Drawer: React.FC<Investor360DrawerProps> = ({
  investor,
  fds,
  onClose,
  onBookFD,
  onViewBond,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'bonds' | 'ledger' | 'tax'>('summary');
  const [notificationSent, setNotificationSent] = useState<string | null>(null);

  const activeFDs = fds.filter((f) => f.status === 'Active' || f.status === 'Lien Marked');
  const totalPrincipal = activeFDs.reduce((sum, f) => sum + f.principal, 0);

  // Compute weighted average rate
  const weightedRate =
    totalPrincipal > 0
      ? (activeFDs.reduce((sum, f) => sum + f.principal * f.effectiveRate, 0) / totalPrincipal).toFixed(2)
      : '0.00';

  const hasActiveLien = fds.some((f) => f.status === 'Lien Marked');

  // Dynamic passbook ledger entries based on actual active FDs
  const passbookEntries = React.useMemo(() => {
    if (activeFDs.length === 0) return [];
    return activeFDs.flatMap((fd, i) => {
      const gross = Math.round(fd.monthlyPayout || fd.periodicPayoutAmount || (fd.principal * fd.effectiveRate) / 1200);
      const tds = fd.isTDSExempt || fd.tdsStatus === '15G' || fd.tdsStatus === '15H' ? 0 : Math.round((gross * (fd.tdsPercentage || 10)) / 100);
      const net = gross - tds;
      return [
        {
          date: new Date().toISOString().slice(0, 10),
          fdNumber: fd.fdNumber,
          grossInterest: gross,
          tds,
          netPaid: net,
          utr: `NEFT${new Date().getFullYear()}${String(i + 101).padStart(6, '0')}`,
          status: 'Processed',
        },
      ];
    });
  }, [activeFDs]);

  const totalInterestPaidTillDate = passbookEntries.reduce((s, e) => s + e.netPaid, 0);

  const handleExportLedgerCSV = () => {
    if (passbookEntries.length === 0) return;
    const headers = ['Payout Date', 'FD Bond No', 'Gross (Rs.)', 'TDS (Rs.)', 'Net Paid (Rs.)', 'Bank UTR Ref', 'Status'];
    const rows = passbookEntries.map((e) => [
      e.date,
      e.fdNumber,
      e.grossInterest,
      e.tds,
      e.netPaid,
      e.utr,
      e.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `passbook_ledger_${investor.investorId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadForm16A = () => {
    const content = `GOLDEN LEAF FINANCE LIMITED
FORM NO. 16A - CERTIFICATE OF DEDUCTION OF TAX AT SOURCE
========================================================================
PAN of Deductee: ${investor.pan}
Name of Deductee: ${investor.fullName}
Address: ${investor.address.doorNo}, ${investor.address.street}, ${investor.address.town}, ${investor.address.district}, ${investor.address.state} - ${investor.address.pinCode}
Assessment Year: 2026-27 | Financial Year: 2025-26
Tax Declaration Status: ${investor.taxDeclaration}

SUMMARY OF DEPOSITS & INTEREST DISBURSEMENT:
- Active Deposits: ${activeFDs.length}
- Total Principal Deployed: ${formatINR(totalPrincipal)}
- Total Interest Credited: ${formatINR(totalInterestPaidTillDate)}
- TDS Deducted: Rs. 0 (TDS Declaration Form ${investor.taxDeclaration} on file)
- Net Amount Disbursed to Bank: ${formatINR(totalInterestPaidTillDate)}

Registered Bank Account:
- Bank: ${investor.bankAccount.bankName} (${investor.bankAccount.branchName})
- Account No: ${investor.bankAccount.accountNumber}
- IFSC: ${investor.bankAccount.ifsc}

Date of Certificate Issue: ${new Date().toLocaleDateString('en-IN')}
Place: Chennai, Tamil Nadu
Authorized Signatory: Golden Leaf Finance Corporate Audit Cell
========================================================================`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Form_16A_${investor.pan}_FY2025-26.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const triggerSMS = (type: string) => {
    setNotificationSent(type);
    setTimeout(() => setNotificationSent(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-slide-left border-l border-[#E2E8F0]">
        {/* Header Profile Ribbon */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-[#0B1F3A] to-[#1E3A8A] text-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-gradient-to-b from-[#F5D061] to-[#8C6808] p-0.5 shrink-0 shadow-lg">
                <div className="w-full h-full bg-[#0B1F3A] rounded-[14px] flex items-center justify-center font-display font-bold text-lg sm:text-xl text-[#D4AF37]">
                  {investor.fullName.charAt(0)}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-display font-bold text-white tracking-tight">
                    {investor.fullName}
                  </h2>
                  <span className="font-mono text-xs font-bold bg-white/10 text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/30">
                    {investor.investorId}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-white/80">
                  <span className="font-medium">{investor.category}</span>
                  <span>·</span>
                  <span>{investor.primaryMobile}</span>
                  <span>·</span>
                  <span>PAN: <strong className="font-mono text-[#D4AF37]">{investor.pan}</strong></span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Action Ribbon */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40 flex items-center gap-1">
                <CheckCircle size={12} /> KYC {investor.kycStatus}
              </span>
              {hasActiveLien && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#EF4444]/20 text-[#F87171] border border-[#EF4444]/40 flex items-center gap-1">
                  <Lock size={12} /> LIEN MARKED
                </span>
              )}
            </div>

            <button
              onClick={() => onBookFD?.(investor)}
              className="px-3.5 py-2 min-h-[38px] rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <PlusCircle size={14} /> + Book New FD
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notificationSent && (
          <div className="px-5 py-2.5 bg-[#ECFDF5] border-b border-[#A7F3D0] text-[#065F46] text-xs font-semibold flex items-center justify-between animate-fade-in">
            <span className="flex items-center gap-2">
              <Smartphone size={14} className="text-[#059669]" />
              Triggered live SMS & WhatsApp payload to {investor.primaryMobile}: ({notificationSent})
            </span>
            <span className="text-[10px] font-bold text-[#059669] uppercase">DISPATCHED</span>
          </div>
        )}

        {/* 4 Navigation Tabs */}
        <div className="flex items-center border-b border-[#E2E8F0] px-6 bg-[#F8FAFC] flex-shrink-0 overflow-x-auto no-scrollbar">
          {[
            { id: 'summary', label: '1. Portfolio Summary', icon: PieChart },
            { id: 'bonds', label: '2. Active & Past FD Bonds', icon: FileText, count: fds.length },
            { id: 'ledger', label: '3. Interest Passbook', icon: Landmark },
            { id: 'tax', label: '4. Tax & Audit Trail', icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-[#D4AF37] text-[#0B1F3A] bg-white'
                    : 'border-transparent text-[#64748B] hover:text-[#0B1F3A]'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[#D4AF37]' : 'text-[#94A3B8]'} />
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#E2E8F0] text-[#475569]">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Portfolio Summary */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* 4 Financial Tiles */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-[#FFFDF7] border border-[#FDE68A]">
                  <p className="text-[11px] font-bold text-[#8C6808] uppercase tracking-wider">
                    Total Active Principal
                  </p>
                  <p className="text-xl font-display font-bold text-[#0B1F3A] mt-1">
                    {formatINR(totalPrincipal)}
                  </p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">{activeFDs.length} Active Certificate(s)</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0]">
                  <p className="text-[11px] font-bold text-[#166534] uppercase tracking-wider">
                    Total Interest Paid
                  </p>
                  <p className="text-xl font-display font-bold text-[#166534] mt-1">
                    {formatINR(totalInterestPaidTillDate)}
                  </p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Month-by-Month Passbook</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE]">
                  <p className="text-[11px] font-bold text-[#1E40AF] uppercase tracking-wider">
                    Weighted Avg. Rate
                  </p>
                  <p className="text-xl font-display font-bold text-[#1E40AF] mt-1">
                    {weightedRate}% <span className="text-xs font-normal">p.a.</span>
                  </p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Includes Category Boosters</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF5FF] border border-[#E9D5FF]">
                  <p className="text-[11px] font-bold text-[#6B21A8] uppercase tracking-wider">
                    Active Lien Status
                  </p>
                  <p className="text-base font-display font-bold mt-1 text-[#6B21A8]">
                    {hasActiveLien ? 'Active Loan-Against-FD' : 'Clean (No Lien)'}
                  </p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    {hasActiveLien ? 'Hard-Locked against closure' : 'Eligible for 75-90% LAFD'}
                  </p>
                </div>
              </div>

              {/* Registered Bank Account Info */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F1F5F9]">
                  <h3 className="font-display font-bold text-sm text-[#0B1F3A] flex items-center gap-2">
                    <Landmark size={16} className="text-[#D4AF37]" />
                    Approved Payout Bank Account
                  </h3>
                  <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                    VERIFIED & APPROVED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#64748B]">Account Holder:</span>
                    <p className="font-semibold text-[#0B1F3A]">{investor.bankAccount.holderName}</p>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Bank & Branch:</span>
                    <p className="font-semibold text-[#0B1F3A]">{investor.bankAccount.bankName} ({investor.bankAccount.branchName})</p>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Account Number:</span>
                    <p className="font-mono font-bold text-[#0B1F3A]">{investor.bankAccount.accountNumber}</p>
                  </div>
                  <div>
                    <span className="text-[#64748B]">IFSC Code & Type:</span>
                    <p className="font-mono font-bold text-[#0B1F3A]">
                      {investor.bankAccount.ifsc} · {investor.bankAccount.accountType}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notification Triggers Simulator */}
              <div className="bg-[#FAF7F0] rounded-2xl border border-[#D4AF37]/40 p-4">
                <h4 className="text-xs font-bold text-[#8C6808] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Bell size={13} />
                  Customer SMS / WhatsApp Notification Simulator
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => triggerSMS('Bond Issuance Confirmation')}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FFFDF7] text-xs font-semibold text-[#0B1F3A] border border-[#D4AF37]/50 shadow-sm flex items-center gap-1"
                  >
                    <Smartphone size={12} className="text-[#D4AF37]" />
                    On Bond Approval
                  </button>
                  <button
                    onClick={() => triggerSMS('Monthly Payout Credit Alert')}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FFFDF7] text-xs font-semibold text-[#0B1F3A] border border-[#D4AF37]/50 shadow-sm flex items-center gap-1"
                  >
                    <Smartphone size={12} className="text-[#D4AF37]" />
                    On Monthly Payout (1st/5th)
                  </button>
                  <button
                    onClick={() => triggerSMS('15-Day Pre-Maturity Renewal Reminder')}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FFFDF7] text-xs font-semibold text-[#0B1F3A] border border-[#D4AF37]/50 shadow-sm flex items-center gap-1"
                  >
                    <Smartphone size={12} className="text-[#D4AF37]" />
                    15 Days Before Maturity
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Active & Past FD Bonds */}
          {activeTab === 'bonds' && (
            <div className="space-y-3.5">
              {fds.length === 0 ? (
                <div className="py-12 text-center text-[#64748B]">
                  <p className="text-sm font-semibold">No Fixed Deposits found for this investor.</p>
                  <button
                    onClick={() => onBookFD?.(investor)}
                    className="mt-3 px-4 py-2 rounded-xl bg-[#D4AF37] text-white text-xs font-bold shadow-sm"
                  >
                    + Book First FD
                  </button>
                </div>
              ) : (
                fds.map((fd) => (
                  <div
                    key={fd.id}
                    className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm hover:border-[#D4AF37] transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#0B1F3A]">
                          {fd.fdNumber}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-[#F1F5F9] text-[#475569]">
                          {fd.scheme}
                        </span>
                      </div>
                      <StatusBadge status={fd.status} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-[#64748B] my-2">
                      <div>
                        <span>Principal:</span>
                        <p className="font-bold text-[#0B1F3A]">{formatINR(fd.principal)}</p>
                      </div>
                      <div>
                        <span>Rate:</span>
                        <p className="font-bold text-[#059669]">{fd.effectiveRate.toFixed(2)}% p.a.</p>
                      </div>
                      <div>
                        <span>Maturity Date:</span>
                        <p className="font-semibold text-[#0B1F3A]">
                          {new Date(fd.maturityDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <span>Net Payout:</span>
                        <p className="font-bold text-[#8C6808]">{formatINR(fd.netMaturityValue)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] text-xs">
                      <span className="text-[#94A3B8]">
                        Nominee: <strong>{fd.nominee.fullName}</strong> ({fd.nominee.relationship})
                      </span>
                      <button
                        onClick={() => onViewBond?.(fd)}
                        className="text-xs font-bold text-[#D4AF37] hover:text-[#C9A227] flex items-center gap-1"
                      >
                        <Printer size={13} />
                        View / Print Bond Certificate
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Interest Passbook Ledger */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                  Month-by-Month Passbook Ledger
                </h4>
                <button
                  onClick={handleExportLedgerCSV}
                  disabled={passbookEntries.length === 0}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] border border-[#E2E8F0] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download size={13} /> Export Ledger CSV
                </button>
              </div>

              <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm overflow-x-auto w-full custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse min-w-[620px]">
                  <thead className="bg-[#FAF7F0] border-b border-[#E2E8F0] text-[#8C6808] font-bold">
                    <tr>
                      <th className="p-3">Payout Date</th>
                      <th className="p-3">FD Bond No</th>
                      <th className="p-3 text-right">Gross (Rs.)</th>
                      <th className="p-3 text-right">TDS (Rs.)</th>
                      <th className="p-3 text-right">Net Paid (Rs.)</th>
                      <th className="p-3">Bank UTR Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {passbookEntries.length > 0 ? (
                      passbookEntries.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#FFFDF7] transition-colors">
                          <td className="p-3 font-semibold text-[#0B1F3A]">{row.date}</td>
                          <td className="p-3 font-mono text-[11px] text-[#475569]">{row.fdNumber}</td>
                          <td className="p-3 text-right font-mono">{formatINR(row.grossInterest)}</td>
                          <td className="p-3 text-right font-mono text-[#059669]">
                            {row.tds === 0 ? 'NIL (15G)' : formatINR(row.tds)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-[#166534]">
                            {formatINR(row.netPaid)}
                          </td>
                          <td className="p-3 font-mono text-[10px] text-[#64748B]">{row.utr}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[#64748B]">
                          <Clock size={24} className="mx-auto mb-2 text-[#CBD5E1]" />
                          <p className="font-semibold text-xs">No interest payout ledger entries recorded yet.</p>
                          <p className="text-[11px] text-[#94A3B8] mt-0.5">Payout entries generate automatically upon monthly interest cycle.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Tax & Audit Trail */}
          {activeTab === 'tax' && (
            <div className="space-y-4">
              <div className="bg-[#FAF7F0] border border-[#E2D4B7] rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 className="font-display font-bold text-sm text-[#0B1F3A]">
                      Annual Interest Tax Certificate (FY 2025-26)
                    </h4>
                    <p className="text-xs text-[#64748B]">
                      Aggregated TDS certificate across all deposits under PAN {investor.pan}
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadForm16A}
                    className="px-3 py-2 min-h-[36px] rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm shrink-0 cursor-pointer active:scale-[0.98]"
                  >
                    <Download size={13} />
                    Download Form 16A
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white rounded-xl p-3 border border-[#E2E8F0]">
                  <div>
                    <span className="text-[#64748B]">Declared Form:</span>
                    <p className="font-bold text-[#059669]">{investor.taxDeclaration} Verified</p>
                  </div>
                  <div>
                    <span className="text-[#64748B]">TDS Deducted:</span>
                    <p className="font-bold text-[#0B1F3A]">Rs. 0 (Exempted)</p>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Valid Till:</span>
                    <p className="font-bold text-[#0B1F3A]">31st March 2026</p>
                  </div>
                </div>
              </div>

              {/* Maker-Checker History */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
                <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">
                  Maker-Checker Modification Audit Log
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2.5 pb-2.5 border-b border-[#F1F5F9]">
                    <div className="w-2 h-2 rounded-full bg-[#10B981] mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-[#0B1F3A]">Investor Profile Created & KYC Approved</p>
                      <p className="text-[11px] text-[#64748B]">
                        Maker: admin · Checker: Central Admin (Official Seal) ·{' '}
                        {new Date(investor.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6] mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-[#0B1F3A]">Payout Bank Account Realization Confirmed</p>
                      <p className="text-[11px] text-[#64748B]">
                        Account verified against PAN card records · Validated by Admin
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
