// ──────────────────────────────────────────────────
// Golden Leaf Finance — Enterprise Settings Page
// Comprehensive Configuration: General Profile, Loan Products & Policies,
// Branch Defaults, Notifications, Access Control & Security
// ──────────────────────────────────────────────────

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, CreditCard, Building2, UserCog, Bell,
  Database, Shield, Save, RefreshCw, CheckCircle2,
  HardDrive, Lock, Globe, AlertTriangle, Plus,
  Trash2, Edit3, Check, X, ArrowUpRight, IndianRupee,
  Sliders, ToggleLeft, ToggleRight, Smartphone, ShieldCheck
} from 'lucide-react';
import { PageHeader, Card, Button, Input, Select, Tabs } from '../../components/ui';
import { useUIStore } from '../../store';

interface LoanPlan {
  id: string;
  name: string;
  principal: number;
  weeks: number;
  weeklyAmount: number;
  interestRate: number;
  processingFee: number;
  isActive: boolean;
}

const INITIAL_LOAN_PLANS: LoanPlan[] = [
  { id: 'PLAN-01', name: 'Bronze Community Plan', principal: 20000, weeks: 20, weeklyAmount: 1000, interestRate: 12.0, processingFee: 400, isActive: true },
  { id: 'PLAN-02', name: 'Silver Growth Plan', principal: 40000, weeks: 20, weeklyAmount: 2000, interestRate: 12.5, processingFee: 800, isActive: true },
  { id: 'PLAN-03', name: 'Gold Prosperity Plan', principal: 50000, weeks: 20, weeklyAmount: 2500, interestRate: 14.0, processingFee: 1000, isActive: true },
  { id: 'PLAN-04', name: 'Platinum Enterprise Plan', principal: 75000, weeks: 20, weeklyAmount: 3750, interestRate: 15.0, processingFee: 1500, isActive: true },
  { id: 'PLAN-05', name: 'Micro Business Term Plan', principal: 100000, weeks: 50, weeklyAmount: 2400, interestRate: 16.0, processingFee: 2000, isActive: false },
];

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useUIStore();
  const [isSaving, setIsSaving] = useState(false);
  const [plans, setPlans] = useState<LoanPlan[]>(() => {
    try {
      const saved = localStorage.getItem('glf_loan_plans_master');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_LOAN_PLANS;
  });
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [newPlan, setNewPlan] = useState<Partial<LoanPlan>>({
    name: '',
    principal: 30000,
    weeks: 20,
    weeklyAmount: 1500,
    interestRate: 13.0,
    processingFee: 600,
    isActive: true
  });

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('glf_loan_plans_master', JSON.stringify(plans));
    } catch (e) {
      console.error('Failed to save plans', e);
    }
    setTimeout(() => {
      setIsSaving(false);
      addToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'System preferences and parameters have been successfully updated.'
      });
    }, 500);
  };

  const togglePlanStatus = (id: string) => {
    setPlans(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p);
      try {
        localStorage.setItem('glf_loan_plans_master', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save plans', e);
      }
      return updated;
    });
    addToast({
      type: 'info',
      title: 'Plan Updated',
      message: 'Loan product active status has been toggled.'
    });
  };

  const handleCreatePlan = () => {
    if (!newPlan.name || !newPlan.principal) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Please enter plan name and principal amount.' });
      return;
    }
    const created: LoanPlan = {
      id: `PLAN-0${plans.length + 1}`,
      name: newPlan.name,
      principal: Number(newPlan.principal),
      weeks: Number(newPlan.weeks || 20),
      weeklyAmount: Number(newPlan.weeklyAmount || 1000),
      interestRate: Number(newPlan.interestRate || 12),
      processingFee: Number(newPlan.processingFee || 500),
      isActive: true,
    };
    const updated = [...plans, created];
    setPlans(updated);
    try {
      localStorage.setItem('glf_loan_plans_master', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save plans', e);
    }
    setShowAddPlanModal(false);
    setNewPlan({ name: '', principal: 30000, weeks: 20, weeklyAmount: 1500, interestRate: 13.0, processingFee: 600, isActive: true });
    addToast({ type: 'success', title: 'Plan Created', message: `${created.name} is now available for field origination.` });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 font-body pb-8 w-full min-w-0 max-w-full">
      <PageHeader
        title="System Settings"
        subtitle="Manage institution profile, loan plans, operational defaults, RBAC matrix, and security policies"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/admin/security')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-bold text-[#0B1F3A] hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
            >
              <ShieldCheck size={14} className="text-[#D4AF37]" />
              Security Console
            </button>
            <Button icon={<Save size={14} />} onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
        }
      />

      <Tabs
        defaultTab={searchParams.get('tab') || 'general'}
        tabs={[
          // 1. GENERAL TAB
          {
            id: 'general',
            label: 'General Profile',
            icon: <Building2 size={16} />,
            content: (
              <Card padding="lg">
                <div className="border-b border-gray-100 pb-4 mb-6">
                  <h3 className="text-base font-bold text-[#0B1F3A]">Institution & Localization Profile</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Primary legal identification, regional formats, and operational headquarters</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="Institution Legal Name" defaultValue="The Golden Leaf Microfinance Ltd" />
                  <Input label="Corporate Tagline" defaultValue="Empowering Community Prosperity" />
                  <Input label="Registration Number / CIN" defaultValue="U65923TN2020PLC123456" />
                  <Input label="RBI / NBFC Registration No." defaultValue="B-07.00412" />
                  <Input label="Official Contact Email" defaultValue="admin@goldenleaf.finance" />
                  <Input label="Support Helpline Number" defaultValue="+91 44 2615 0000" />
                  <Select
                    label="Operating Currency"
                    defaultValue="inr"
                    options={[
                      { label: 'Indian Rupee (₹ - INR)', value: 'inr' },
                      { label: 'US Dollar ($ - USD)', value: 'usd' }
                    ]}
                  />
                  <Select
                    label="System Date Format"
                    defaultValue="dd/mm/yyyy"
                    options={[
                      { label: 'DD/MM/YYYY (e.g. 15/06/2026)', value: 'dd/mm/yyyy' },
                      { label: 'YYYY-MM-DD (e.g. 2026-06-15)', value: 'yyyy-mm-dd' }
                    ]}
                  />
                  <Input label="Headquarters Address" defaultValue="12/4, Anna Nagar 2nd Avenue, Chennai, Tamil Nadu - 600040" containerClassName="md:col-span-2" />
                </div>
                <div className="mt-6 flex justify-end">
                  <Button icon={<Save size={14} />} onClick={handleSave}>Save General Profile</Button>
                </div>
              </Card>
            ),
          },

          // 2. LOAN PLANS & PRODUCTS TAB
          {
            id: 'loan-products',
            label: 'Loan Products & Plans',
            icon: <CreditCard size={16} />,
            content: (
              <div className="space-y-6">
                <Card padding="lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-[#0B1F3A]">Standard Loan Products</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Define pre-configured loan amounts, weekly EMI schedules, and interest rates</p>
                    </div>
                    <button
                      onClick={() => setShowAddPlanModal(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#15345E] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <Plus size={14} className="text-[#D4AF37]" />
                      Add New Loan Plan
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E5E7EB] text-[#6B7280] font-bold uppercase tracking-wider text-[10px]">
                          <th className="pb-3 px-3">Plan ID & Name</th>
                          <th className="pb-3 px-3">Principal Amount</th>
                          <th className="pb-3 px-3">Tenure</th>
                          <th className="pb-3 px-3">Weekly Installment</th>
                          <th className="pb-3 px-3">Annual Interest</th>
                          <th className="pb-3 px-3">Proc. Fee</th>
                          <th className="pb-3 px-3 text-center">Status</th>
                          <th className="pb-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {plans.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-bold text-[#0B1F3A] block">{p.name}</span>
                              <span className="text-[10px] font-mono text-[#D4AF37] font-semibold">{p.id}</span>
                            </td>
                            <td className="py-3 px-3 font-black text-[#0B1F3A]">
                              ₹{p.principal.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-gray-600 font-semibold">{p.weeks} Weeks</td>
                            <td className="py-3 px-3 font-bold text-emerald-700">
                              ₹{p.weeklyAmount.toLocaleString('en-IN')}/wk
                            </td>
                            <td className="py-3 px-3 text-gray-700">{p.interestRate}% p.a.</td>
                            <td className="py-3 px-3 text-gray-500">₹{p.processingFee}</td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => togglePlanStatus(p.id)}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                  p.isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {p.isActive ? 'Active' : 'Disabled'}
                              </button>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => togglePlanStatus(p.id)}
                                className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                              >
                                {p.isActive ? 'Disable' : 'Enable'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Global Lending Rules */}
                <Card padding="lg">
                  <div className="border-b border-gray-100 pb-4 mb-6">
                    <h3 className="text-base font-bold text-[#0B1F3A]">Global Lending Governance</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Parameters governing overdue penalties, grace windows, and maximum borrower exposure</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Input label="Max Exposure Per Borrower (₹)" type="number" defaultValue="150000" />
                    <Input label="Default Grace Period (Days)" type="number" defaultValue="7" hint="Days before classification as overdue" />
                    <Input label="Late Payment Penalty (%)" type="number" defaultValue="2" hint="Assessed weekly on unpaid dues" />
                    <Select
                      label="Interest Method"
                      defaultValue="flat"
                      options={[
                        { label: 'Flat Weekly Calculation', value: 'flat' },
                        { label: 'Diminishing Reducing Balance', value: 'reducing' }
                      ]}
                    />
                    <Select
                      label="Default Disbursal Channel"
                      defaultValue="bank_transfer"
                      options={[
                        { label: 'Direct Bank NEFT / IMPS', value: 'bank_transfer' },
                        { label: 'Branch Cash Window', value: 'cash' }
                      ]}
                    />
                    <Input label="Mandatory Co-applicant KYC" defaultValue="Applicable for loans ≥ ₹40,000" />
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button icon={<Save size={14} />} onClick={handleSave}>Save Lending Governance</Button>
                  </div>
                </Card>
              </div>
            ),
          },

          // 3. NOTIFICATIONS TAB
          {
            id: 'notifications',
            label: 'Notifications & Alerts',
            icon: <Bell size={16} />,
            content: (
              <Card padding="lg">
                <div className="border-b border-gray-100 pb-4 mb-6">
                  <h3 className="text-base font-bold text-[#0B1F3A]">Communications & Automated Delivery</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Automated borrower SMS receipts, WhatsApp reminders, and administrative alerts</p>
                </div>
                <div className="space-y-4">
                  {[
                    { title: 'Digital SMS Payment Receipt', desc: 'Instantly transmit digital receipt SMS to borrower upon cash collection entry in the field', defaultChecked: true },
                    { title: 'WhatsApp EMI Reminders (24h Notice)', desc: 'Send automated WhatsApp payment summary with payment link before scheduled center meeting', defaultChecked: true },
                    { title: 'Executive Daily Financial Dispatch', desc: 'Email high-level collections and disbursement totals to Admin and Branch Managers at 08:00 PM daily', defaultChecked: true },
                    { title: 'Default Escalation Alert', desc: 'Trigger management escalation when an account accumulates 3 consecutive missed installments', defaultChecked: true },
                    { title: 'Geofence Deviation Trigger', desc: 'Alert branch manager if field collection is logged >500m outside center coordinates', defaultChecked: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                      <div>
                        <p className="text-sm font-bold text-[#0B1F3A]">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={item.defaultChecked}
                        className="w-5 h-5 rounded text-[#D4AF37] focus:ring-[#D4AF37] border-gray-300 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button icon={<Save size={14} />} onClick={handleSave}>Save Notification Preferences</Button>
                </div>
              </Card>
            ),
          },

          // 4. ROLES TAB
          {
            id: 'roles',
            label: 'Roles & Access Matrix',
            icon: <UserCog size={16} />,
            content: (
              <Card padding="lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-[#0B1F3A]">Role-Based Access Control (RBAC)</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Overview of assigned permissions across administrative tiers</p>
                  </div>
                  <button
                    onClick={() => navigate('/admin/roles-permissions')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#15345E] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Open Full Permission Matrix
                    <ArrowUpRight size={14} className="text-[#D4AF37]" />
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                    { role: 'System Admin (Super User)', perms: 'Master authority: Company profiles, branch oversight, personnel, underwriting policies, system audits, and global settings', level: 'Full Master Access' },
                    { role: 'Branch Manager', perms: 'Local branch jurisdiction: Customer creation, collection groups, loan recommendations, day closing, and agent monitoring', level: 'Branch Level' },
                    { role: 'Credit Manager', perms: 'Underwriting authority: Customer verification, KYC documentation validation, credit scoring, and loan approval decisions', level: 'Approval Authority' },
                    { role: 'Customer Relationship Officer (CRO)', perms: 'Field operations: Center meeting attendance, cash installment receipts, and new client onboarding', level: 'Field Operations' },
                  ].map((r) => (
                    <div key={r.role} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-[#0B1F3A]">{r.role}</p>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {r.level}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{r.perms}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate('/admin/roles-permissions')}>
                        Configure Privileges
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            ),
          },

          // 5. SECURITY & BACKUP TAB
          {
            id: 'security-backup',
            label: 'Security & Snapshots',
            icon: <Shield size={16} />,
            content: (
              <Card padding="lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-[#0B1F3A]">Security, Cloud Replicas & Snapshots</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Automated database snapshots, session security, and disaster recovery</p>
                  </div>
                  <button
                    onClick={() => navigate('/admin/security')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#15345E] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Open Security Console
                    <ArrowUpRight size={14} className="text-[#D4AF37]" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <HardDrive size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0B1F3A]">Daily Database Snapshot</p>
                        <p className="text-xs text-gray-500">Last snapshot: Today at 03:00 AM (Size: 42.4 MB)</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={13} /> Encrypted & Verified (AES-256)
                      </span>
                      <Button size="sm" variant="outline" onClick={() => addToast({ type: 'info', title: 'Snapshot Created', message: 'Manual snapshot generated successfully.' })}>
                        Create Snapshot
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Globe size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0B1F3A]">Multi-Region Cloud Mirror</p>
                        <p className="text-xs text-gray-500">AWS Mumbai (ap-south-1) Hot Standby</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-blue-700 font-semibold flex items-center gap-1">
                        <RefreshCw size={13} className="animate-spin" /> Real-time Streaming Active
                      </span>
                      <Button size="sm" variant="outline" onClick={() => addToast({ type: 'success', title: 'Health Checked', message: 'Replication latency is 14ms.' })}>
                        Test Latency
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold mb-0.5">Disaster Recovery & Rollback Policy</p>
                    <p className="text-amber-800">
                      Restoring from a prior snapshot requires dual administrative approval and initiates a 5-minute read-only audit window across field collection apps.
                    </p>
                  </div>
                </div>
              </Card>
            ),
          },
        ]}
      />

      {/* ── ADD LOAN PLAN MODAL ── */}
      <AnimatePresence>
        {showAddPlanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="bg-[#0B1F3A] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Add New Loan Product
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddPlanModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <Input
                  label="Product / Plan Name"
                  placeholder="e.g. Diamond Business 100K"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Principal Amount (₹)"
                    type="number"
                    value={newPlan.principal}
                    onChange={(e) => setNewPlan({ ...newPlan, principal: Number(e.target.value) })}
                  />
                  <Input
                    label="Tenure (Weeks)"
                    type="number"
                    value={newPlan.weeks}
                    onChange={(e) => setNewPlan({ ...newPlan, weeks: Number(e.target.value) })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Weekly EMI (₹)"
                    type="number"
                    value={newPlan.weeklyAmount}
                    onChange={(e) => setNewPlan({ ...newPlan, weeklyAmount: Number(e.target.value) })}
                  />
                  <Input
                    label="Interest (% p.a.)"
                    type="number"
                    value={newPlan.interestRate}
                    onChange={(e) => setNewPlan({ ...newPlan, interestRate: Number(e.target.value) })}
                  />
                  <Input
                    label="Proc. Fee (₹)"
                    type="number"
                    value={newPlan.processingFee}
                    onChange={(e) => setNewPlan({ ...newPlan, processingFee: Number(e.target.value) })}
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowAddPlanModal(false)}>
                    Cancel
                  </Button>
                  <Button icon={<Check size={14} />} onClick={handleCreatePlan}>
                    Create Plan
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SettingsPage;
