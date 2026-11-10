// ──────────────────────────────────────────────────
// Golden Leaf Finance — Create Loan Page (100% Real Data)
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calculator } from 'lucide-react';
import { PageHeader, Card, Button, Input, Select } from '../../components/ui';
import { calculateLoan } from '../../types';
import { getMonitoredCustomers, getBranchAgents } from '../../services/monitoringDataService';
import { useAuthStore } from '../../store';

const LoanCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const userBranch = user?.customClaims?.branchId || null;

  const [principal, setPrincipal] = useState(50000);
  const [customerOptions, setCustomerOptions] = useState<{ label: string; value: string }[]>([]);
  const [agentOptions, setAgentOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');

  useEffect(() => {
    const customers = getMonitoredCustomers(userBranch === 'all' ? null : userBranch);
    if (customers.length > 0) {
      setCustomerOptions(customers.map((c) => ({ label: `${c.name} (${c.id})`, value: c.id })));
    } else {
      setCustomerOptions([]);
    }

    const agents = getBranchAgents(userBranch === 'all' ? null : userBranch);
    if (agents.length > 0) {
      setAgentOptions(agents.map((a, idx) => ({ label: a, value: String(idx + 1) })));
    } else {
      setAgentOptions([]);
    }
  }, [userBranch]);

  const calc = calculateLoan(principal, 24, 'flat', 24);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 sm:p-5 lg:p-6 flex flex-col gap-6 font-body pb-12">
      <PageHeader title="Create New Loan" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Loans', href: '/loans' }, { label: 'New Loan' }]} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card padding="lg" className="lg:col-span-2">
          <h3 className="font-display font-semibold text-lg mb-4 text-[#0F1F38]">Loan Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Customer"
              placeholder={customerOptions.length > 0 ? "Select customer..." : "No customers registered yet"}
              required
              options={customerOptions}
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              containerClassName="md:col-span-2"
            />
            <Select
              label="Loan Plan"
              placeholder="Select plan..."
              required
              options={[
                { label: 'Weekly Microfinance — 24% flat, 24 weeks', value: '1' },
                { label: 'Small Business Loan — 20% flat, 32 weeks', value: '2' },
                { label: 'Seasonal Express Loan — 28% flat, 16 weeks', value: '3' },
              ]}
              containerClassName="md:col-span-2"
            />
            <Input label="Principal Amount (₹)" type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} required />
            <Select
              label="Assigned Agent"
              placeholder={agentOptions.length > 0 ? "Select agent..." : "No agents found for this branch"}
              required
              options={agentOptions}
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
            />
            <Input label="Remarks" placeholder="Optional notes..." containerClassName="md:col-span-2" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-surface-muted">
            <Button variant="ghost" onClick={() => navigate('/loans')} className="min-h-[44px]">Cancel</Button>
            <Button onClick={() => navigate('/loans')} className="min-h-[44px]">Submit for Approval</Button>
          </div>
        </Card>

        <Card padding="md" variant="gold">
          <div className="flex items-center gap-2 mb-4"><Calculator size={18} className="text-gold-600" /><h3 className="font-display font-semibold">Loan Calculator</h3></div>
          <div className="space-y-3">
            {[
              { label: 'Principal', value: `₹${calc.principal.toLocaleString('en-IN')}` },
              { label: 'Interest Rate', value: `${calc.interestRate}% p.a.` },
              { label: 'Interest Type', value: calc.interestType },
              { label: 'Tenure', value: `${calc.tenureWeeks} weeks` },
              { label: 'Total Interest', value: `₹${calc.totalInterest.toLocaleString('en-IN')}` },
              { label: 'Total Payable', value: `₹${calc.totalPayable.toLocaleString('en-IN')}` },
              { label: 'Weekly Installment', value: `₹${calc.weeklyInstallment.toLocaleString('en-IN')}` },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-rich-silver">{row.label}</span>
                <span className="font-semibold text-rich-black">{row.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default LoanCreatePage;

