// ──────────────────────────────────────────────────
// Golden Leaf Finance — Group Loan Rate Slab & Fee Configuration
// Admin, BM & CM Matrix for Interest, Insurance & Document Fees
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  Settings, Plus, Edit2, Check, ShieldCheck, FileText,
  Percent, Save, RotateCcw, Trash2, CheckCircle2, Shield,
  Calculator, DollarSign, Clock, HelpCircle, ArrowRight
} from 'lucide-react';
import {
  getGroupLoanSlabs,
  saveGroupLoanSlabs,
  DEFAULT_GROUP_LOAN_SLABS,
  calculateGroupLoanFees,
  type GroupLoanSlab,
} from '../../services/groupLoanSlabService';
import { useAuthStore, useUIStore } from '../../store';
import { PageHeader, Card, Button, Modal } from '../../components/ui';

export const GroupLoanRateSlabsPage: React.FC = () => {
  const { addToast } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const rawRole = (user?.customClaims?.role || (user as any)?.role || 'admin').toString().toLowerCase();
  const role = rawRole === 'bm' ? 'branch_manager' : rawRole === 'cm' ? 'credit_manager' : rawRole;
  const isAuthorized = role === 'admin' || role === 'branch_manager' || role === 'credit_manager' || role === 'area_manager';

  const [slabs, setSlabs] = useState<GroupLoanSlab[]>(() => getGroupLoanSlabs());
  const [editingSlab, setEditingSlab] = useState<GroupLoanSlab | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  // Live Calculator Simulator State
  const [testPrincipal, setTestPrincipal] = useState(10000);
  const [testWeeks, setTestWeeks] = useState(18);

  const testCalc = calculateGroupLoanFees(testPrincipal, testWeeks);

  if (!isAuthorized) {
    return (
      <div className="py-20 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
          <Shield size={32} />
        </div>
        <h3 className="text-lg font-bold text-[#0B1F3A]">Access Restricted</h3>
        <p className="text-sm text-gray-500 mt-2">
          Group Loan Interest Slabs, Insurance & Document Fee policies can only be configured by
          Credit Manager (CM), Branch Manager (BM), or System Administrator.
        </p>
      </div>
    );
  }

  const handleOpenAdd = () => {
    setIsNew(true);
    setEditingSlab({
      id: `slab-${Date.now()}`,
      minWeeks: 1,
      maxWeeks: 12,
      label: 'New Custom Tenor Slab',
      interestRate: 24.0,
      insuranceFeeType: 'percentage',
      insuranceFeeValue: 1.0,
      documentFeeType: 'fixed',
      documentFeeValue: 300,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (slab: GroupLoanSlab) => {
    setIsNew(false);
    setEditingSlab({ ...slab });
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!editingSlab) return;
    if (editingSlab.minWeeks <= 0 || editingSlab.maxWeeks <= 0 || editingSlab.minWeeks > editingSlab.maxWeeks) {
      addToast({ type: 'error', title: 'Invalid Weeks', message: 'Min weeks must be greater than 0 and less than or equal to Max weeks.' });
      return;
    }
    if (editingSlab.interestRate <= 0) {
      addToast({ type: 'error', title: 'Invalid Rate', message: 'Interest rate must be greater than 0%.' });
      return;
    }

    let updated: GroupLoanSlab[];
    if (isNew) {
      updated = [...slabs, editingSlab].sort((a, b) => a.minWeeks - b.minWeeks);
    } else {
      updated = slabs.map((s) => (s.id === editingSlab.id ? editingSlab : s)).sort((a, b) => a.minWeeks - b.minWeeks);
    }

    setSlabs(updated);
    saveGroupLoanSlabs(updated);
    setIsModalOpen(false);
    setEditingSlab(null);
    addToast({
      type: 'success',
      title: isNew ? 'Slab Added' : 'Slab Updated',
      message: `${editingSlab.label} has been saved and will automatically apply in field registrations.`,
    });
  };

  const handleDelete = (id: string) => {
    if (slabs.length <= 1) {
      addToast({ type: 'warning', title: 'Action Denied', message: 'At least one active interest slab must remain in the system.' });
      return;
    }
    if (window.confirm('Are you sure you want to delete this slab?')) {
      const updated = slabs.filter((s) => s.id !== id);
      setSlabs(updated);
      saveGroupLoanSlabs(updated);
      addToast({ type: 'info', title: 'Slab Removed', message: 'The interest slab has been removed.' });
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all Group Loan slabs to standard institutional defaults?')) {
      setSlabs(DEFAULT_GROUP_LOAN_SLABS);
      saveGroupLoanSlabs(DEFAULT_GROUP_LOAN_SLABS);
      addToast({ type: 'success', title: 'Reset Complete', message: 'All rate slabs and fees restored to institutional defaults.' });
    }
  };

  const toggleStatus = (id: string) => {
    const updated = slabs.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s));
    setSlabs(updated);
    saveGroupLoanSlabs(updated);
    addToast({ type: 'info', title: 'Status Changed', message: 'Slab activation status updated.' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-fade-in">
      <PageHeader
        title="Group Loan Interest Slabs & Regulatory Fee Matrix"
        subtitle="Manage week-wise interest rates, mandatory borrower insurance, and document processing charges"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              title="Reset to default slabs"
            >
              <RotateCcw size={14} />
              Reset Defaults
            </button>
            <Button icon={<Plus size={14} />} onClick={handleOpenAdd}>
              Add Rate Slab
            </Button>
          </div>
        }
      />

      {/* Role Authority Banner */}
      <div className="bg-gradient-to-r from-[#0B1F3A] to-[#16365C] p-4 rounded-2xl text-white shadow-md flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Authorized Authority Mode ({role.toUpperCase()})
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                CRE-Protected
              </span>
            </h4>
            <p className="text-xs text-gray-300">
              Only Admin, BM & CM can modify these rates. In field registration (CRE), rates & fees auto-apply based on the selected weeks.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Slabs Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card padding="none">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-sm font-bold text-[#0B1F3A]">Configured Tenor Slabs</h3>
                <p className="text-xs text-gray-500">Auto-matches loan tenor weeks during customer registration</p>
              </div>
              <span className="text-xs font-bold text-gray-500">{slabs.length} Slabs Configured</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-[#FAFBFD] text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Tenor Range</th>
                    <th className="py-3 px-3">Interest Rate</th>
                    <th className="py-3 px-3">Insurance Fee</th>
                    <th className="py-3 px-3">Document Fee</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {slabs.map((slab) => (
                    <tr key={slab.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#0B1F3A] block text-sm">{slab.label}</span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {slab.minWeeks} to {slab.maxWeeks} Weeks
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[#0B1F3A] font-black text-xs">
                          {slab.interestRate}% p.a.
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-gray-800">
                          {slab.insuranceFeeType === 'percentage'
                            ? `${slab.insuranceFeeValue}% of Principal`
                            : `₹${slab.insuranceFeeValue} Flat`}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-gray-800">
                          {slab.documentFeeType === 'percentage'
                            ? `${slab.documentFeeValue}% of Principal`
                            : `₹${slab.documentFeeValue} Flat`}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStatus(slab.id)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            slab.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {slab.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(slab)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#0B1F3A] hover:bg-gray-100 transition-colors"
                            title="Edit Slab"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(slab.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Slab"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Live Simulator Preview Card */}
        <div className="space-y-4">
          <Card padding="md">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
              <Calculator size={18} className="text-[#D4AF37]" />
              <div>
                <h3 className="text-sm font-bold text-[#0B1F3A]">Live Registration Preview</h3>
                <p className="text-[11px] text-gray-500">Test how the slabs apply in real-time</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Test Principal Amount (₹)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={testPrincipal}
                  onChange={(e) => setTestPrincipal(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-[#0B1F3A] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Test Tenor (Weeks)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="104"
                    value={testWeeks}
                    onChange={(e) => setTestWeeks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-[#0B1F3A] focus:outline-none focus:border-[#D4AF37]"
                  />
                  <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Weeks</span>
                </div>
              </div>

              {/* Quick week testers */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {[15, 18, 20, 25, 28, 30, 50].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setTestWeeks(w)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      testWeeks === w ? 'bg-[#0B1F3A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {w}w
                  </button>
                ))}
              </div>

              {/* Simulation Result */}
              <div className="mt-4 p-4 rounded-xl bg-[#FAFBFD] border border-gray-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 font-bold">
                  <span className="text-gray-500">Matched Slab:</span>
                  <span className="text-[#0B1F3A]">{testCalc.slab?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Auto Interest Rate:</span>
                  <span className="font-bold text-[#0B1F3A]">{testCalc.interestRate}% p.a.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Insurance Fee:</span>
                  <span className="font-bold text-emerald-600">₹{testCalc.insuranceFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Document Processing Fee:</span>
                  <span className="font-bold text-blue-600">₹{testCalc.documentFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Upfront Deductions:</span>
                  <span className="font-bold text-red-600">₹{testCalc.totalDeductions}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200">
                  <span className="text-gray-700 font-bold">Net Disbursed to Borrower:</span>
                  <span className="font-black text-[#0B1F3A]">₹{testCalc.netDisbursement.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Estimated Total Interest:</span>
                  <span className="font-bold text-[#D4AF37]">₹{testCalc.totalInterest.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-bold">Total Repayment:</span>
                  <span className="font-black text-[#0B1F3A]">₹{testCalc.totalPayable.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Calculated EMI Display */}
              <div className="p-3 rounded-xl bg-[#0B1F3A] text-white">
                <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider block">
                  Calculated Weekly EMI
                </span>
                <p className="text-xl font-black text-[#D4AF37] mt-0.5">
                  ₹{testCalc.weeklyEMI.toLocaleString('en-IN')}
                  <span className="text-xs text-gray-300 font-normal"> / week</span>
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  Principal: ₹{testCalc.weeklyPrincipal} + Interest: ₹{testCalc.weeklyInterest}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit / Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isNew ? 'Create New Group Loan Slab' : 'Edit Rate Slab & Fees'}
      >
        {editingSlab && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Slab Title / Label *
              </label>
              <input
                type="text"
                value={editingSlab.label}
                onChange={(e) => setEditingSlab({ ...editingSlab, label: e.target.value })}
                placeholder="e.g. 15 – 18 Weeks Standard Scheme"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Min Weeks *</label>
                <input
                  type="number"
                  min="1"
                  max="104"
                  value={editingSlab.minWeeks}
                  onChange={(e) => setEditingSlab({ ...editingSlab, minWeeks: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-[#0B1F3A] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Max Weeks *</label>
                <input
                  type="number"
                  min="1"
                  max="104"
                  value={editingSlab.maxWeeks}
                  onChange={(e) => setEditingSlab({ ...editingSlab, maxWeeks: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-[#0B1F3A] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Interest Rate */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Annual Interest Rate (% p.a.) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="40"
                  value={editingSlab.interestRate}
                  onChange={(e) => setEditingSlab({ ...editingSlab, interestRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-[#0B1F3A] focus:outline-none focus:border-[#D4AF37]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">% p.a.</span>
              </div>
            </div>

            {/* Insurance Fee Configuration */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <label className="text-xs font-bold text-[#0B1F3A] block">
                Mandatory Insurance Fee
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={editingSlab.insuranceFeeType}
                  onChange={(e) => setEditingSlab({ ...editingSlab, insuranceFeeType: e.target.value as any })}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium bg-white"
                >
                  <option value="percentage">% of Principal Loan</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
                <div className="relative">
                  <input
                    type="number"
                    step={editingSlab.insuranceFeeType === 'percentage' ? '0.1' : '10'}
                    value={editingSlab.insuranceFeeValue}
                    onChange={(e) => setEditingSlab({ ...editingSlab, insuranceFeeValue: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-[#0B1F3A] bg-white"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                    {editingSlab.insuranceFeeType === 'percentage' ? '%' : '₹'}
                  </span>
                </div>
              </div>
            </div>

            {/* Document Fee Configuration */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <label className="text-xs font-bold text-[#0B1F3A] block">
                Document & Processing Fee
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={editingSlab.documentFeeType}
                  onChange={(e) => setEditingSlab({ ...editingSlab, documentFeeType: e.target.value as any })}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium bg-white"
                >
                  <option value="fixed">Fixed Amount (₹)</option>
                  <option value="percentage">% of Principal Loan</option>
                </select>
                <div className="relative">
                  <input
                    type="number"
                    step={editingSlab.documentFeeType === 'percentage' ? '0.1' : '10'}
                    value={editingSlab.documentFeeValue}
                    onChange={(e) => setEditingSlab({ ...editingSlab, documentFeeValue: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-[#0B1F3A] bg-white"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                    {editingSlab.documentFeeType === 'percentage' ? '%' : '₹'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <Button onClick={handleSaveModal}>
                Save Slab Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GroupLoanRateSlabsPage;
