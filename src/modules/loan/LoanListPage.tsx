// ──────────────────────────────────────────────────
// Golden Leaf Finance — Loan List Page (100% Real Data)
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, CreditCard, Filter, Download } from 'lucide-react';
import { PageHeader, Button, DataTable, SearchInput, StatusBadge } from '../../components/ui';
import type { Column } from '../../components/ui';
import { getMonitoredLoans, type MonitoredLoan } from '../../services/monitoringDataService';
import { useAuthStore } from '../../store';

const columns: Column<MonitoredLoan>[] = [
  { key: 'id', header: 'Loan ID', sortable: true, render: (item) => <span className="font-mono text-xs text-gold-600 font-bold">{item.id}</span> },
  { key: 'customerName', header: 'Customer', sortable: true, render: (item) => <span className="font-semibold text-[#0F1F38]">{item.customerName}</span> },
  { key: 'principalAmount', header: 'Principal', sortable: true, align: 'right', render: (item) => <span className="font-medium">₹{item.principalAmount.toLocaleString('en-IN')}</span> },
  { key: 'outstandingAmount', header: 'Outstanding', sortable: true, align: 'right', render: (item) => <span className={`font-medium ${item.outstandingAmount > 0 ? 'text-status-error' : 'text-status-success'}`}>₹{item.outstandingAmount.toLocaleString('en-IN')}</span> },
  { key: 'weeklyAmount', header: 'Weekly EMI', align: 'right', render: (item) => `₹${item.weeklyAmount.toLocaleString('en-IN')}` },
  { key: 'tenorWeeks', header: 'Tenure', render: (item) => `${item.tenorWeeks} weeks` },
  { key: 'branchName', header: 'Branch', sortable: true },
  { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status.toLowerCase().replace(' ', '_')} /> },
];

const LoanListPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const userBranch = user?.customClaims?.branchId || null;
  const [loans, setLoans] = useState<MonitoredLoan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const list = getMonitoredLoans(userBranch === 'all' ? null : userBranch);
    setLoans(list);
  }, [userBranch]);

  const filtered = loans.filter(l =>
    l.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.branchName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 sm:p-5 lg:p-6 flex flex-col gap-6 font-body pb-12">
      <PageHeader
        title="Loan Management"
        subtitle={`${loans.length} active loans registered`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Loans' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" icon={<Download size={14} />} className="min-h-[44px]">
              Export
            </Button>
            <Button icon={<Plus size={16} />} onClick={() => navigate('/loans/new')} className="min-h-[44px]">
              New Loan
            </Button>
          </div>
        }
      />
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <SearchInput
          placeholder="Search by loan ID or customer..."
          onSearch={setSearchQuery}
          className="w-full sm:max-w-md"
        />
        <Button variant="outline" size="sm" icon={<Filter size={14} />} className="min-h-[44px]">
          Filters
        </Button>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(item) => item.id}
          onRowClick={(item) => navigate(`/loans/${item.id}`)}
          emptyMessage="No loans found. Create a new loan application to begin."
          emptyIcon={<CreditCard size={32} className="text-gold-400" />}
          pagination={{ page: 1, pageSize: 10, totalItems: filtered.length, onPageChange: () => {} }}
        />
      </div>
    </motion.div>
  );
};

export default LoanListPage;

