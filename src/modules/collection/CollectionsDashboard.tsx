// ──────────────────────────────────────────────────
// Golden Leaf Finance — Collections Operations Dashboard
// Central hub for daily collections, weekly schedules, advance pools & recovery
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, Clock, CheckCircle2, AlertTriangle,
  ArrowRight, Users, Calendar, MapPin, Download, RotateCcw,
  Sparkles, FileText, CheckSquare, ShieldCheck, DollarSign
} from 'lucide-react';
import { DataTable } from '../../components/ui';
import type { Column } from '../../components/ui';
import { generateReportPDF } from '../../utils/pdfGenerator';
import { useUIStore } from '../../store';
import {
  getMonitoredCollections,
  type MonitoredCollection,
} from '../../services/monitoringDataService';

interface TodayScheduleItem {
  id: string;
  center: string;
  group: string;
  agent: string;
  targetAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  completionRate: number;
  status: 'Completed' | 'In Progress' | 'Scheduled';
}

export const CollectionsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { addToast, selectedBranchId } = useUIStore();
  const [collections, setCollections] = useState<MonitoredCollection[]>([]);

  useEffect(() => {
    const list = getMonitoredCollections(selectedBranchId, 'all');
    setCollections(list);
  }, [selectedBranchId]);

  const schedules: TodayScheduleItem[] = React.useMemo(() => {
    const routeMap = new Map<string, {
      center: string;
      group: string;
      agent: string;
      targetAmount: number;
      collectedAmount: number;
      pendingAmount: number;
    }>();

    collections.forEach((c) => {
      const key = c.areaRoute || c.groupName || 'Main Route';
      const existing = routeMap.get(key) || {
        center: c.area || c.areaRoute || 'Branch Center',
        group: c.groupName || 'General Group',
        agent: c.agentName || 'Assigned CRO',
        targetAmount: 0,
        collectedAmount: 0,
        pendingAmount: 0,
      };
      existing.targetAmount += c.expectedAmount || 0;
      existing.collectedAmount += c.collectedAmount || 0;
      existing.pendingAmount += c.pendingAmount || 0;
      routeMap.set(key, existing);
    });

    return Array.from(routeMap.entries()).map(([key, val], idx) => {
      const rate = val.targetAmount > 0 ? Math.min(100, Math.round((val.collectedAmount / val.targetAmount) * 100)) : 100;
      const status: 'Completed' | 'In Progress' | 'Scheduled' =
        rate >= 100 ? 'Completed' : val.collectedAmount > 0 ? 'In Progress' : 'Scheduled';
      return {
        id: `SCH-${String(idx + 1).padStart(2, '0')}`,
        center: val.center,
        group: val.group,
        agent: val.agent,
        targetAmount: val.targetAmount,
        collectedAmount: val.collectedAmount,
        pendingAmount: val.pendingAmount,
        completionRate: rate,
        status,
      };
    });
  }, [collections]);

  const totalTarget = collections.reduce((sum, s) => sum + (s.expectedAmount || 0), 0);
  const totalCollected = collections.reduce((sum, s) => sum + (s.collectedAmount || 0), 0);
  const totalPending = collections.reduce((sum, s) => sum + (s.pendingAmount || 0), 0);
  const overallRate = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 100;
  const advancePoolAmount = collections.filter((c) => c.status === 'advance').reduce((sum, c) => sum + (c.collectedAmount || 0), 0);
  const activeRoutesCount = new Set(collections.map((c) => c.areaRoute).filter(Boolean)).size;
  const activeAgentsCount = new Set(collections.map((c) => c.agentName).filter(Boolean)).size;

  const handleExportSummary = () => {
    generateReportPDF({
      title: 'Daily Field Collection Operations Summary',
      subtitle: `Operations Date: ${new Date().toLocaleDateString('en-IN')}`,
      headers: ['Schedule ID', 'Center', 'Group', 'Assigned Officer (CRO)', 'Target', 'Collected', 'Pending', 'Progress', 'Status'],
      rows: schedules.map(s => [
        s.id,
        s.center,
        s.group,
        s.agent,
        `₹${s.targetAmount.toLocaleString('en-IN')}`,
        `₹${s.collectedAmount.toLocaleString('en-IN')}`,
        `₹${s.pendingAmount.toLocaleString('en-IN')}`,
        `${s.completionRate}%`,
        s.status
      ]),
    });
    addToast({ type: 'info', title: 'Export', message: 'Exporting Collection Summary Report...' });
  };

  const columns: Column<TodayScheduleItem>[] = [
    {
      key: 'id',
      header: 'Route ID',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs font-bold text-[#D4AF37]">
          {item.id}
        </span>
      ),
    },
    {
      key: 'center',
      header: 'Center & Group',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-bold text-sm text-[#0B1F3A] font-body">{item.center}</p>
          <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-bold text-gray-600 mt-0.5">
            {item.group}
          </span>
        </div>
      ),
    },
    {
      key: 'agent',
      header: 'Officer (CRO)',
      render: (item) => (
        <div className="text-xs font-semibold text-gray-800">
          {item.agent}
        </div>
      ),
    },
    {
      key: 'targetAmount',
      header: 'Demand Target',
      sortable: true,
      render: (item) => (
        <span className="text-xs font-bold text-gray-900">
          ₹{item.targetAmount.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'collectedAmount',
      header: 'Collected (₹)',
      sortable: true,
      render: (item) => (
        <div>
          <p className="text-xs font-black text-[#059669]">
            ₹{item.collectedAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-gray-400">
            Pending: ₹{item.pendingAmount.toLocaleString('en-IN')}
          </p>
        </div>
      ),
    },
    {
      key: 'completionRate',
      header: 'Progress',
      render: (item) => (
        <div className="w-28 space-y-1">
          <div className="flex justify-between text-[11px] font-bold">
            <span>{item.completionRate}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                item.completionRate === 100
                  ? 'bg-emerald-500'
                  : item.completionRate > 50
                  ? 'bg-[#D4AF37]'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${item.completionRate}%` }}
            ></div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        if (item.status === 'Completed') {
          return (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ✓ Completed
            </span>
          );
        }
        if (item.status === 'In Progress') {
          return (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              ⏳ In Progress
            </span>
          );
        }
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            📅 Scheduled
          </span>
        );
      },
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 font-body">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-1">
            <Wallet size={16} />
            Collections & Demand Module
          </div>
          <h1 className="text-2xl font-black text-[#0B1F3A] font-body tracking-tight">
            Collections Operations Dashboard
          </h1>
          <p className="text-xs text-[#6B7280]">
            Field collections, weekly schedules, advance ledger pool, and overdue recovery tracking
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate('/collections/weekly')}
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#C49E2A] text-white px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Calendar size={16} />
            <span>Weekly Collection</span>
          </button>
          <button
            onClick={() => navigate('/collections/advance')}
            className="flex items-center gap-2 bg-[#059669] hover:bg-[#047857] text-white px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <DollarSign size={16} />
            <span>Advance Collection</span>
          </button>
          <button
            onClick={handleExportSummary}
            className="flex items-center gap-2 bg-[#0B1F3A] hover:bg-[#162D4A] text-white px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Download size={16} className="text-[#D4AF37]" />
            <span>Export Summary</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            title: "TODAY'S COLLECTION",
            value: `₹${totalCollected.toLocaleString('en-IN')}`,
            subText: `${overallRate}% of daily target`,
            icon: <Wallet size={18} />,
            color: 'text-[#059669]',
            bg: 'bg-[#ECFDF5]',
          },
          {
            title: 'DAILY DEMAND TARGET',
            value: `₹${totalTarget.toLocaleString('en-IN')}`,
            subText: 'Scheduled route pool',
            icon: <TrendingUp size={18} />,
            color: 'text-[#0B1F3A]',
            bg: 'bg-[#F1F5F9]',
          },
          {
            title: 'PENDING DEMANDS',
            value: `₹${totalPending.toLocaleString('en-IN')}`,
            subText: 'Remaining field visits',
            icon: <Clock size={18} />,
            color: 'text-[#DC2626]',
            bg: 'bg-[#FEF2F2]',
          },
          {
            title: 'ADVANCE POOL',
            value: `₹${advancePoolAmount.toLocaleString('en-IN')}`,
            subText: 'Pre-paid EMI holding',
            icon: <CheckCircle2 size={18} />,
            color: 'text-[#D4AF37]',
            bg: 'bg-[#FFFBEB]',
          },
          {
            title: 'ACTIVE ROUTES',
            value: `${activeRoutesCount} Routes`,
            subText: `${activeAgentsCount} officers on-duty`,
            icon: <MapPin size={18} />,
            color: 'text-[#2563EB]',
            bg: 'bg-[#EFF6FF]',
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-[0_2px_10px_rgba(11,31,58,0.04)] flex flex-col justify-between hover:shadow-md transition-all group min-h-[110px]"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider truncate" title={item.title}>
                {item.title}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.bg} ${item.color} transition-transform`}>
                {item.icon}
              </div>
            </div>
            <div>
              <div className={`text-2xl font-black font-body tracking-tight leading-none ${item.color}`}>
                {item.value}
              </div>
              <div className="text-[11px] font-semibold text-gray-400 mt-1.5 flex items-center gap-1">
                {item.subText}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4 Operations Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Weekly Collection',
            desc: 'Center-wise weekly schedule & digital collection passbook',
            btnText: 'Open Weekly Routes',
            icon: <Calendar size={22} className="text-[#D4AF37]" />,
            action: () => navigate('/collections/weekly'),
            highlight: true,
          },
          {
            title: 'Advance Collection',
            desc: 'Record future EMI advances & manage holding ledgers',
            btnText: 'Open Advance Ledger',
            icon: <DollarSign size={22} className="text-[#059669]" />,
            action: () => navigate('/collections/advance'),
          },
          {
            title: 'Pending & Overdue',
            desc: 'Track overdue arrears, late fees & field recoveries',
            btnText: 'View Pending Dues',
            icon: <Clock size={22} className="text-[#DC2626]" />,
            action: () => navigate('/collections/pending'),
          },
          {
            title: 'Collection History',
            desc: 'Complete ledger records, receipts & PDF/CSV statement exports',
            btnText: 'Open Register Log',
            icon: <FileText size={22} className="text-[#0B1F3A]" />,
            action: () => navigate('/collections/history'),
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-2xl border transition-all ${
              card.highlight
                ? 'bg-gradient-to-br from-[#0B1F3A] to-[#1A365D] text-white border-[#D4AF37]/40 shadow-md'
                : 'bg-white border-gray-200 text-[#0B1F3A] hover:border-[#D4AF37]/50 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${card.highlight ? 'bg-white/10' : 'bg-[#F8F9FA]'}`}>
                {card.icon}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                card.highlight ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-gray-100 text-gray-500'
              }`}>
                Operations
              </span>
            </div>

            <h3 className="text-base font-bold mb-1 font-body">{card.title}</h3>
            <p className={`text-xs mb-4 ${card.highlight ? 'text-gray-300' : 'text-[#6B7280]'}`}>
              {card.desc}
            </p>

            <button
              onClick={card.action}
              className={`w-full py-2.5 px-3 min-h-[40px] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                card.highlight
                  ? 'bg-[#D4AF37] hover:bg-[#C49E2A] text-white shadow-md'
                  : 'bg-[#F8F9FA] hover:bg-gray-100 text-[#0B1F3A] border border-[#E5E7EB]'
              }`}
            >
              <span>{card.btnText}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Main Table: Today's Route Operations */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-[#0B1F3A] px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full"></div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-body">
              Today's Field Collection Routes & CRO Progress ({schedules.length})
            </h3>
          </div>
          <span className="text-xs font-bold text-[#D4AF37]">
            Overall Progress: {overallRate}%
          </span>
        </div>

        <div className="p-3 sm:p-4 lg:p-6">
          <DataTable
            data={schedules}
            columns={columns}
            keyExtractor={(item) => item.id}
            emptyMessage="No routes scheduled for today."
          />
        </div>
      </div>
    </motion.div>
  );
};

export default CollectionsDashboard;
