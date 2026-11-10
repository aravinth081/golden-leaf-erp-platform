// ──────────────────────────────────────────────────
// Golden Leaf Finance — Client Management Dashboard
// Central hub for customer onboarding, KYC pipelines & client directory
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, UserPlus, Search, FileCheck, ShieldCheck, CreditCard,
  TrendingUp, CheckCircle2, Clock, AlertTriangle, ArrowRight,
  Eye, Phone, MapPin, Download, Filter, Sparkles, Building
} from 'lucide-react';
import { QuickCustomerRegistrationModal } from '../../components/customer/QuickCustomerRegistrationModal';
import { DataTable } from '../../components/ui';
import type { Column } from '../../components/ui';
import { getClients, type ClientData } from '../../services/clientService';
import { getMonitoredCustomers, type MonitoredCustomer } from '../../services/monitoringDataService';
import { useUIStore } from '../../store';

interface ClientRecord {
  id: string;
  name: string;
  phone: string;
  center: string;
  group: string;
  loanTier: string;
  kycStatus: 'Verified' | 'Pending' | 'Rejected';
  status: 'Active' | 'Under Review' | 'New Lead';
  joinedDate: string;
}

export const ClientManagementDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isQuickRegOpen, setIsQuickRegOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKyc, setSelectedKyc] = useState('all');
  const [selectedCenter, setSelectedCenter] = useState('all');
  const [monitoredCustomers, setMonitoredCustomers] = useState<MonitoredCustomer[]>([]);
  const { addToast } = useUIStore();

  const loadData = () => {
    try {
      const data = getMonitoredCustomers();
      setMonitoredCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('glf-customers-updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('glf-customers-updated', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  const clientRecords: ClientRecord[] = useMemo(() => {
    return monitoredCustomers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      center: c.centerName || 'Direct / Branch Center',
      group: c.groupName || 'Individual Borrower',
      loanTier: c.activeLoanAmount ? `₹${c.activeLoanAmount.toLocaleString('en-IN')}` : 'No Active Loan',
      kycStatus: c.kycStatus === 'Verified' ? 'Verified' : c.kycStatus === 'Pending' ? 'Pending' : 'Rejected',
      status: c.status === 'Active' ? 'Active' : 'Under Review',
      joinedDate: c.registrationDate || 'Recent',
    }));
  }, [monitoredCustomers]);

  const totalClientsCount = clientRecords.length;
  const activeLoansCount = monitoredCustomers.filter((c) => c.activeLoanId || (c.activeLoanAmount && c.activeLoanAmount > 0)).length;
  const kycVerifiedCount = monitoredCustomers.filter((c) => c.kycStatus === 'Verified').length;
  const kycRate = totalClientsCount > 0 ? `${Math.round((kycVerifiedCount / totalClientsCount) * 100)}%` : '0%';
  const pendingKycCount = monitoredCustomers.filter((c) => c.kycStatus === 'Pending').length;

  const filtered = clientRecords.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    const matchesKyc = selectedKyc === 'all' || c.kycStatus === selectedKyc;
    const matchesCenter = selectedCenter === 'all' || c.center === selectedCenter;
    return matchesSearch && matchesKyc && matchesCenter;
  });

  const columns: Column<ClientRecord>[] = [
    {
      key: 'id',
      header: 'Client ID',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs font-bold text-[#D4AF37]">
          {item.id}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Customer Name & Contact',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-bold text-sm text-[#0B1F3A] font-body">{item.name}</p>
          <p className="text-xs text-[#6B7280]">{item.phone}</p>
        </div>
      ),
    },
    {
      key: 'center',
      header: 'Center / Group',
      sortable: true,
      render: (item) => (
        <div>
          <p className="text-xs font-semibold text-[#0B1F3A]">{item.center}</p>
          <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-bold text-gray-600 mt-0.5">
            {item.group}
          </span>
        </div>
      ),
    },
    {
      key: 'loanTier',
      header: 'Loan Tier',
      render: (item) => (
        <span className="text-xs font-semibold text-gray-800">
          {item.loanTier}
        </span>
      ),
    },
    {
      key: 'kycStatus',
      header: 'KYC Status',
      render: (item) => {
        if (item.kycStatus === 'Verified') {
          return (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ✓ Verified
            </span>
          );
        }
        if (item.kycStatus === 'Pending') {
          return (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              ⏳ Pending
            </span>
          );
        }
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            ✕ Rejected
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Account Status',
      render: (item) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-[#0B1F3A]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          {item.status}
        </span>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 font-body">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-1">
            <Users size={16} />
            Customer & Client Management
          </div>
          <h1 className="text-2xl font-black text-[#0B1F3A] font-body tracking-tight">
            Client Management Dashboard
          </h1>
          <p className="text-xs text-[#6B7280]">
            Overview of customer onboarding, KYC pipeline, group membership, and loan verification
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate('/client-search')}
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#C49E2A] text-white px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Search size={15} />
            <span>Directory Search</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            title: 'TOTAL CLIENTS',
            value: `${totalClientsCount}`,
            subText: 'Registered borrowers',
            icon: <Users size={18} />,
            color: 'text-[#0B1F3A]',
            bg: 'bg-[#F1F5F9]',
          },
          {
            title: 'ACTIVE LOANS',
            value: `${activeLoansCount}`,
            subText: 'Disbursed active',
            icon: <CreditCard size={18} />,
            color: 'text-[#059669]',
            bg: 'bg-[#ECFDF5]',
          },
          {
            title: 'KYC VERIFIED',
            value: kycRate,
            subText: 'Aadhaar & PAN linked',
            icon: <ShieldCheck size={18} />,
            color: 'text-[#D4AF37]',
            bg: 'bg-[#FFFBEB]',
          },
          {
            title: 'PENDING KYC',
            value: `${pendingKycCount} Clients`,
            subText: 'Requires review',
            icon: <Clock size={18} />,
            color: 'text-[#DC2626]',
            bg: 'bg-[#FEF2F2]',
          },
          {
            title: 'VERIFIED BORROWERS',
            value: `${kycVerifiedCount}`,
            subText: 'Ready for disbursement',
            icon: <TrendingUp size={18} />,
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

      {/* 4 Quick Operations Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Customer Registration',
            desc: 'Onboard new borrowers with instant applicant ID',
            btnText: 'Register Customer',
            icon: <UserPlus size={22} className="text-[#D4AF37]" />,
            action: () => setIsQuickRegOpen(true),
            highlight: true,
          },
          {
            title: 'Customer Search',
            desc: 'Search customer directory, passbooks & history',
            btnText: 'Open Search Directory',
            icon: <Search size={22} className="text-[#0B1F3A]" />,
            action: () => navigate('/client-search'),
          },
          {
            title: 'KYC Documents',
            desc: 'Review Aadhaar, Voter ID & address proof files',
            btnText: 'View Documents',
            icon: <FileCheck size={22} className="text-[#0B1F3A]" />,
            action: () => navigate('/client/kyc-documents'),
          },
          {
            title: 'Loan Onboarding',
            desc: 'Assign repayment schedule & passbook details',
            btnText: 'Onboard Loan',
            icon: <CreditCard size={22} className="text-[#0B1F3A]" />,
            action: () => navigate('/client/loan-onboarding'),
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
                Management
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

      {/* Main Table: Recent Enrolled Borrowers */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-[#0B1F3A] px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full"></div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-body">
              Client Directory & Onboarding Records ({filtered.length})
            </h3>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-full sm:w-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 min-h-[38px] w-full sm:w-auto bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-gray-400 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <select
              value={selectedKyc}
              onChange={(e) => setSelectedKyc(e.target.value)}
              className="px-2.5 py-1.5 min-h-[38px] bg-white/10 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="all" className="text-gray-900">All KYC</option>
              <option value="Verified" className="text-gray-900">Verified</option>
              <option value="Pending" className="text-gray-900">Pending</option>
            </select>
          </div>
        </div>

        <div className="p-3 sm:p-4 lg:p-6">
          <DataTable
            data={filtered}
            columns={columns}
            keyExtractor={(item) => item.id}
            emptyMessage="No client records found matching search."
          />
        </div>
      </div>

      {/* Quick Customer Registration Modal */}
      <QuickCustomerRegistrationModal
        isOpen={isQuickRegOpen}
        onClose={() => setIsQuickRegOpen(false)}
        onSuccess={() => {
          addToast({
            type: 'success',
            title: 'Registration Successful',
            message: 'Customer applicant registered successfully.',
          });
        }}
      />
    </motion.div>
  );
};

export default ClientManagementDashboard;
