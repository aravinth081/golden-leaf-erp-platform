// ──────────────────────────────────────────────────
// Golden Leaf Finance — Loan Detail Page (100% Real Data)
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, User, Wallet, FileText, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { PageHeader, Card, Badge, StatusBadge, Button } from '../../components/ui';
import { getMonitoredLoans, type MonitoredLoan } from '../../services/monitoringDataService';

const LoanDetailPage: React.FC = () => {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState<MonitoredLoan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loanId) {
      const allLoans = getMonitoredLoans(null);
      const found = allLoans.find((l) => l.id.toLowerCase() === loanId.toLowerCase());
      setLoan(found || null);
    }
    setLoading(false);
  }, [loanId]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-500">Loading loan records...</div>;
  }

  if (!loan) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[40vh]">
        <AlertCircle size={40} className="text-amber-500 mb-3" />
        <h3 className="text-lg font-bold text-[#0F1F38]">Loan Record Not Found</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm text-center">
          No loan with ID <span className="font-mono font-bold text-gray-700">{loanId}</span> exists in the system database.
        </p>
        <Button onClick={() => navigate('/loans')} className="mt-4" icon={<ArrowLeft size={14} />}>
          Back to Loan List
        </Button>
      </div>
    );
  }

  const schedule = loan.schedule || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 sm:p-5 lg:p-6 flex flex-col gap-6 font-body pb-12">
      <PageHeader
        title={`Loan ${loan.id}`}
        subtitle={`${loan.planName || 'Microfinance Loan'} — ${loan.customerName}`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Loans', href: '/loans' }, { label: loan.id }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" icon={<FileText size={14} />} className="min-h-[44px]">
              Print Statement
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/loans')} icon={<ArrowLeft size={14} />} className="min-h-[44px]">
              Back
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card padding="md" className="lg:col-span-2">
          <h3 className="font-display font-semibold text-rich-black mb-4">Loan Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Principal', value: `₹${loan.principalAmount.toLocaleString('en-IN')}`, icon: <CreditCard size={14} /> },
              { label: 'Tenure', value: `${loan.tenorWeeks} weeks`, icon: <Calendar size={14} /> },
              { label: 'Weekly EMI', value: `₹${loan.weeklyAmount.toLocaleString('en-IN')}`, icon: <Clock size={14} /> },
              { label: 'Paid Amount', value: `₹${loan.paidAmount.toLocaleString('en-IN')}`, icon: <Wallet size={14} /> },
              { label: 'Outstanding', value: `₹${loan.outstandingAmount.toLocaleString('en-IN')}`, icon: <Wallet size={14} /> },
              { label: 'Weeks Done', value: `${loan.weeksCompleted} / ${loan.tenorWeeks}`, icon: <Clock size={14} /> },
              { label: 'Start Date', value: loan.startDate || '—', icon: <Calendar size={14} /> },
              { label: 'Branch', value: loan.branchName, icon: <Wallet size={14} /> },
            ].map((stat) => (
              <div key={stat.label} className="flex items-start gap-2">
                <span className="text-gold-500 mt-0.5">{stat.icon}</span>
                <div>
                  <p className="text-xs text-rich-silver">{stat.label}</p>
                  <p className="text-sm font-semibold text-rich-black">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card padding="md">
          <h3 className="font-display font-semibold text-rich-black mb-3">Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-rich-silver">Loan Status</span>
              <StatusBadge status={loan.status.toLowerCase().replace(' ', '_')} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-rich-silver">Customer</span>
              <span className="text-sm font-medium text-gold-600">{loan.customerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-rich-silver">Branch</span>
              <span className="text-sm font-medium">{loan.branchName}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="none">
        <div className="px-5 py-4 border-b border-surface-muted">
          <h3 className="font-display font-semibold text-rich-black">Repayment Schedule</h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar p-3 sm:p-5">
          {schedule.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              No schedule records generated for this loan yet.
            </div>
          ) : (
            <table className="table-premium w-full min-w-[500px]">
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Due Date</th>
                  <th className="text-right">Expected Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr key={row.week}>
                    <td className="font-mono text-xs">{row.week}</td>
                    <td>{row.dueDate}</td>
                    <td className="text-right font-semibold">₹{row.expectedAmount.toLocaleString('en-IN')}</td>
                    <td><StatusBadge status={row.status.toLowerCase()} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default LoanDetailPage;
