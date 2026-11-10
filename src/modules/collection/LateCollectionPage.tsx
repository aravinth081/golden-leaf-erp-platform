// ──────────────────────────────────────────────────
// Golden Leaf Finance — Client / Late Collection Page
// Overdue collection, penalty tracking, arrears recovery & settlement
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, RotateCcw, Download, FileText, CheckCircle2,
  Clock, ShieldAlert, X, Phone, DollarSign, Calendar
} from 'lucide-react';
import { DataTable, Badge } from '../../components/ui';
import type { Column } from '../../components/ui';
import { generateReportPDF } from '../../utils/pdfGenerator';
import { useUIStore } from '../../store';
import { getMonitoredCollections, type MonitoredCollection } from '../../services/monitoringDataService';

interface LateRecord {
  id: string;
  clientId: string;
  customer: string;
  phone: string;
  loanId: string;
  center: string;
  overdueDays: number;
  agingBucket: '1-15 Days' | '16-30 Days' | '31-60 Days' | '60+ Days';
  principalDue: number;
  lateFee: number;
  totalDue: number;
  lastContact: string;
  riskLevel: 'Low' | 'Medium' | 'Critical NPA';
  status: 'Pending' | 'Followed Up' | 'Legal Notice' | 'Settled';
}

const LateCollectionPage: React.FC = () => {
  const { addToast, selectedBranchId } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [records, setRecords] = useState<LateRecord[]>([]);
  const [settleModalRecord, setSettleModalRecord] = useState<LateRecord | null>(null);
  const [waiveLateFee, setWaiveLateFee] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');

  useEffect(() => {
    const delayedCollections = getMonitoredCollections(selectedBranchId, 'delay_tracking');
    const mapped: LateRecord[] = delayedCollections.map((c, i) => {
      const delayedDays = c.delayedDays || 7;
      const agingBucket: '1-15 Days' | '16-30 Days' | '31-60 Days' | '60+ Days' =
        delayedDays > 60 ? '60+ Days' : delayedDays > 30 ? '31-60 Days' : delayedDays > 15 ? '16-30 Days' : '1-15 Days';
      const riskLevel: 'Low' | 'Medium' | 'Critical NPA' =
        delayedDays > 60 ? 'Critical NPA' : delayedDays > 30 ? 'Medium' : 'Low';
      const principalDue = c.pendingAmount || c.expectedAmount || 0;
      const lateFee = Math.round(principalDue * 0.05);
      return {
        id: c.id || `LATE-${i + 1}`,
        clientId: c.customerId,
        customer: c.customerName,
        phone: c.customerPhone || '—',
        loanId: c.loanId,
        center: c.areaRoute || c.branchName,
        overdueDays: delayedDays,
        agingBucket,
        principalDue,
        lateFee,
        totalDue: principalDue + lateFee,
        lastContact: c.ncRemarks || 'Scheduled Follow-up',
        riskLevel,
        status: 'Pending',
      };
    });
    setRecords(mapped);
  }, [selectedBranchId]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && settleModalRecord) {
        setSettleModalRecord(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settleModalRecord]);

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.clientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.loanId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery);
    const matchesBucket = selectedBucket === 'all' || r.agingBucket === selectedBucket;
    const matchesRisk = selectedRisk === 'all' || r.riskLevel === selectedRisk;
    return matchesSearch && matchesBucket && matchesRisk;
  });

  const totalArrears = filtered.reduce((s, r) => s + r.totalDue, 0);
  const totalPrincipal = filtered.reduce((s, r) => s + r.principalDue, 0);
  const totalLateFee = filtered.reduce((s, r) => s + r.lateFee, 0);
  const criticalCount = filtered.filter((r) => r.riskLevel === 'Critical NPA').length;

  const handleReset = () => {
    setSearchQuery('');
    setSelectedBucket('all');
    setSelectedRisk('all');
  };

  const handleOpenSettle = (rec: LateRecord) => {
    setSettleModalRecord(rec);
    setWaiveLateFee(false);
    setPaidAmount(String(rec.totalDue));
  };

  const handleConfirmSettlement = () => {
    if (!settleModalRecord) return;
    const amount = Number(paidAmount);
    if (!amount || amount <= 0) {
      addToast({ type: 'error', title: 'Invalid Amount', message: 'Enter a valid recovery amount.' });
      return;
    }

    setRecords((prev) =>
      prev.map((item) => {
        if (item.id === settleModalRecord.id) {
          return {
            ...item,
            totalDue: Math.max(0, item.totalDue - amount),
            status: amount >= item.totalDue ? 'Settled' : 'Followed Up',
          };
        }
        return item;
      })
    );

    addToast({
      type: 'success',
      title: 'Late Recovery Recorded',
      message: `Recovered ₹${amount.toLocaleString('en-IN')} from ${settleModalRecord.customer}.`,
    });
    setSettleModalRecord(null);
  };

  const handleExportPDF = () => {
    try {
      generateReportPDF({
        title: 'Client / Late Collection Register',
        subtitle: `Overdue & Arrears Statement (${filtered.length} accounts)`,
        branch: 'All Branches',
        headers: ['Client ID', 'Customer Name', 'Contact No', 'Loan ID', 'Overdue Days', 'Aging Bucket', 'Principal (₹)', 'Late Fee (₹)', 'Total Due (₹)', 'Risk Level', 'Status'],
        rows: filtered.map((r) => [
          r.clientId,
          r.customer,
          r.phone,
          r.loanId,
          `${r.overdueDays}d`,
          r.agingBucket,
          r.principalDue.toLocaleString('en-IN'),
          r.lateFee.toLocaleString('en-IN'),
          r.totalDue.toLocaleString('en-IN'),
          r.riskLevel,
          r.status,
        ]),
        summaryItems: [
          { label: 'Total Accounts', value: String(filtered.length) },
          { label: 'Principal Arrears', value: `₹${totalPrincipal.toLocaleString('en-IN')}` },
          { label: 'Late Fees Accrued', value: `₹${totalLateFee.toLocaleString('en-IN')}` },
          { label: 'Total Overdue', value: `₹${totalArrears.toLocaleString('en-IN')}` },
        ],
        fileName: 'client_late_collection_report.pdf',
      });
      addToast({ type: 'success', title: 'PDF Downloaded', message: 'Late Collection register exported as PDF.' });
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', title: 'Export Failed', message: 'Could not generate PDF.' });
    }
  };

  const handleExportCSV = () => {
    const headers = ['Client ID,Customer,Phone,Loan ID,Center,Overdue Days,Bucket,Principal Due,Late Fee,Total Due,Risk Level,Status'];
    const rows = filtered.map(
      (r) => `${r.clientId},"${r.customer}",${r.phone},${r.loanId},"${r.center}",${r.overdueDays},"${r.agingBucket}",${r.principalDue},${r.lateFee},${r.totalDue},"${r.riskLevel}","${r.status}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = 'client_late_collections.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast({ type: 'success', title: 'CSV Downloaded', message: 'Late Collection data exported as CSV.' });
  };

  const columns: Column<LateRecord>[] = [
    {
      key: 'clientId',
      header: 'Client ID',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-[#D4AF37]">{item.clientId}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer Details',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-semibold text-sm text-[#0B1F3A] font-body">{item.customer}</p>
          <p className="text-xs text-[#6B7280] flex items-center gap-1">
            <Phone size={11} /> {item.phone}
          </p>
        </div>
      ),
    },
    {
      key: 'overdueDays',
      header: 'Aging / Bucket',
      sortable: true,
      render: (item) => (
        <div>
          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
            {item.overdueDays} Days Overdue
          </span>
          <p className="text-[11px] text-[#6B7280] mt-1 font-body">{item.agingBucket}</p>
        </div>
      ),
    },
    {
      key: 'principalDue',
      header: 'Principal (₹)',
      align: 'right',
      render: (item) => (
        <span className="font-mono text-sm text-[#4B5563]">
          ₹{item.principalDue.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'lateFee',
      header: 'Late Fee (₹)',
      align: 'right',
      render: (item) => (
        <span className="font-mono text-sm font-semibold text-[#EF4444]">
          +₹{item.lateFee.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'totalDue',
      header: 'Total Due (₹)',
      align: 'right',
      render: (item) => (
        <span className="font-mono text-sm font-bold text-[#0B1F3A]">
          ₹{item.totalDue.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'riskLevel',
      header: 'Risk Level',
      render: (item) => {
        let variant: 'success' | 'warning' | 'error' = 'success';
        if (item.riskLevel === 'Medium') variant = 'warning';
        if (item.riskLevel === 'Critical NPA') variant = 'error';
        return <Badge variant={variant}>{item.riskLevel}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
          {item.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (item) => (
        <button
          onClick={() => handleOpenSettle(item)}
          className="px-3.5 py-1.5 min-h-[36px] text-xs font-semibold rounded-md bg-[#D4AF37] text-[#0B1F3A] hover:bg-[#C9A227] transition-colors cursor-pointer"
        >
          Recover
        </button>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col w-full gap-6 pb-16 font-body"
    >
      {/* Parameter Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-[0_2px_10px_rgba(11,31,58,0.04)] overflow-hidden flex-shrink-0"
      >
        <div className="bg-[#0B1F3A] px-4 sm:px-6 lg:px-8 py-4 border-b border-[#E5E7EB]/10 flex items-center gap-3">
          <div className="w-1 h-4 bg-[#D4AF37] rounded-full"></div>
          <h2 className="text-sm font-body font-semibold text-[#FFFFFF] tracking-wide uppercase">
            Client / Late Collection
          </h2>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search Input */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[0.85rem] font-semibold text-[#0B1F3A] font-body tracking-wide uppercase">
                Search Client / Loan / Phone
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter client ID, name, mobile..."
                className="w-full px-4 py-3.5 rounded-[10px] bg-[#FFFFFF] border border-[#E5E7EB] text-[#0B1F3A] placeholder:text-[#9CA3AF] font-body text-sm transition-all duration-200 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] hover:border-[#D4AF37]/50 shadow-sm"
              />
            </div>

            {/* Aging Bucket */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[0.85rem] font-semibold text-[#0B1F3A] font-body tracking-wide uppercase">
                Aging Bucket
              </label>
              <select
                value={selectedBucket}
                onChange={(e) => setSelectedBucket(e.target.value)}
                className="w-full px-4 py-3.5 rounded-[10px] bg-[#FFFFFF] border border-[#E5E7EB] text-[#0B1F3A] font-body text-sm transition-all duration-200 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] hover:border-[#D4AF37]/50 shadow-sm"
              >
                <option value="all">ALL AGING BUCKETS</option>
                <option value="1-15 Days">1-15 Days (Early Delinquency)</option>
                <option value="16-30 Days">16-30 Days (Moderate Arrears)</option>
                <option value="31-60 Days">31-60 Days (High Risk)</option>
                <option value="60+ Days">60+ Days (Critical NPA)</option>
              </select>
            </div>

            {/* Risk Category */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[0.85rem] font-semibold text-[#0B1F3A] font-body tracking-wide uppercase">
                Risk Classification
              </label>
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="w-full px-4 py-3.5 rounded-[10px] bg-[#FFFFFF] border border-[#E5E7EB] text-[#0B1F3A] font-body text-sm transition-all duration-200 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] hover:border-[#D4AF37]/50 shadow-sm"
              >
                <option value="all">ALL RISK LEVELS</option>
                <option value="Low">Low Risk (Standard)</option>
                <option value="Medium">Medium Risk (Watchlist)</option>
                <option value="Critical NPA">Critical NPA</option>
              </select>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 min-h-[44px] rounded-[10px] bg-[#EF4444] text-[#FFFFFF] font-semibold text-sm transition-all duration-200 hover:bg-[#DC2626] font-body min-w-[140px] shadow-sm hover:shadow-md cursor-pointer"
            >
              <RotateCcw size={18} />
              Reset Filters
            </motion.button>

            <div className="flex items-center gap-3 flex-wrap">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleExportPDF}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[44px] rounded-[10px] bg-[#D4AF37] text-[#0B1F3A] font-bold text-sm transition-all duration-200 hover:bg-[#C9A227] font-body shadow-sm hover:shadow-md cursor-pointer"
              >
                <FileText size={18} />
                Export PDF
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleExportCSV}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[44px] rounded-[10px] bg-[#0B1F3A] text-[#FFFFFF] font-semibold text-sm transition-all duration-200 hover:bg-[#1E50A0] font-body shadow-sm hover:shadow-md cursor-pointer"
              >
                <Download size={18} />
                Export CSV
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Overdue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E5E7EB] shadow-[0_2px_8px_rgba(11,31,58,0.03)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider font-body">Total Arrears Due</p>
            <p className="text-xl font-bold text-[#EF4444] mt-1 font-body">₹{totalArrears.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E5E7EB] shadow-[0_2px_8px_rgba(11,31,58,0.03)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider font-body">Principal Overdue</p>
            <p className="text-xl font-bold text-[#0B1F3A] mt-1 font-body">₹{totalPrincipal.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#0B1F3A]/10 text-[#0B1F3A] flex items-center justify-center">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E5E7EB] shadow-[0_2px_8px_rgba(11,31,58,0.03)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider font-body">Late Fees Accrued</p>
            <p className="text-xl font-bold text-[#F59E0B] mt-1 font-body">₹{totalLateFee.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E5E7EB] shadow-[0_2px_8px_rgba(11,31,58,0.03)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider font-body">Critical NPA Accounts</p>
            <p className="text-xl font-bold text-[#EF4444] mt-1 font-body">{criticalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <ShieldAlert size={20} />
          </div>
        </div>
      </div>

      {/* Overdue Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-[0_2px_10px_rgba(11,31,58,0.04)] overflow-hidden flex-1"
      >
        <div className="bg-[#0B1F3A] px-8 py-4 border-b border-[#E5E7EB]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4 bg-[#D4AF37] rounded-full"></div>
            <h2 className="text-sm font-body font-semibold text-[#FFFFFF] tracking-wide">
              Late Collection Portfolio ({filtered.length} Borrowers)
            </h2>
          </div>
        </div>

        <div className="p-6">
          <DataTable
            data={filtered}
            columns={columns}
            keyExtractor={(item) => item.id}
            emptyMessage="No late collection records found"
            emptyIcon={<AlertTriangle size={36} className="text-[#D4AF37]" />}
          />
        </div>
      </motion.div>

      {/* Settle Modal */}
      <AnimatePresence>
        {settleModalRecord && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none"
            role="dialog"
            aria-modal="true"
          >
            {/* Clickable Backdrop Overlay — Clicking anywhere outside closes modal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setSettleModalRecord(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs cursor-pointer"
              aria-label="Close modal backdrop"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-[min(94vw,448px)] max-h-[90dvh] overflow-hidden flex flex-col font-body relative z-10 select-text"
            >
              <div className="bg-[#0B1F3A] px-4 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#D4AF37] rounded-full"></div>
                  <h3 className="text-sm font-semibold text-white font-body">
                    Record Late Settlement / Recovery
                  </h3>
                </div>
                <button
                  onClick={() => setSettleModalRecord(null)}
                  className="w-10 h-10 min-h-[40px] flex items-center justify-center rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <p className="font-semibold text-sm text-[#0B1F3A]">{settleModalRecord.customer}</p>
                  <p className="text-xs text-gray-500">Loan #{settleModalRecord.loanId} • {settleModalRecord.center}</p>
                  <div className="mt-2 text-xs flex justify-between font-semibold">
                    <span>Principal: ₹{settleModalRecord.principalDue.toLocaleString('en-IN')}</span>
                    <span className="text-red-600">Late Fee: ₹{settleModalRecord.lateFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="mt-1 pt-1 border-t border-red-200 flex justify-between text-xs font-bold text-[#0B1F3A]">
                    <span>Total Arrears:</span>
                    <span>₹{(waiveLateFee ? settleModalRecord.principalDue : settleModalRecord.totalDue).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
                  <input
                    type="checkbox"
                    id="waive-fee"
                    checked={waiveLateFee}
                    onChange={(e) => {
                      setWaiveLateFee(e.target.checked);
                      if (e.target.checked) {
                        setPaidAmount(String(settleModalRecord.principalDue));
                      } else {
                        setPaidAmount(String(settleModalRecord.totalDue));
                      }
                    }}
                    className="w-4 h-4 text-[#D4AF37] rounded focus:ring-[#D4AF37]"
                  />
                  <label htmlFor="waive-fee" className="text-xs font-semibold text-[#0B1F3A] cursor-pointer">
                    Waive Late Penalty (Manager Approval)
                  </label>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-[#0B1F3A] uppercase">
                    Amount Recovered (₹)
                  </label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 min-h-[40px] rounded-lg border border-gray-300 text-sm font-bold text-[#0B1F3A] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
                  <button
                    onClick={() => setSettleModalRecord(null)}
                    className="px-4 py-2.5 min-h-[44px] text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSettlement}
                    className="px-5 py-2.5 min-h-[44px] text-xs font-semibold text-white bg-[#10B981] hover:bg-[#059669] rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    Confirm Recovery
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LateCollectionPage;
