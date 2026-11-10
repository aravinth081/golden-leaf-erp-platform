// ──────────────────────────────────────────────────
// Golden Leaf Finance — Stage 1 Mandatory Portfolio Reassignment Lock Modal
// Section 7A.1 Specification • Zero Unassigned Customers • 1-Click Route Transfer
// ──────────────────────────────────────────────────

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Lock, ArrowRight, ShieldAlert, CheckCircle2,
  Users, Briefcase, FileCheck, AlertTriangle
} from 'lucide-react';
import { resignationService } from '../../../services/resignationService';
import { getActiveStaffProfiles } from '../../../services/staffService';
import { STAFF_ROLE_META } from '../../../types/staff.types';
import { type ResignationRecord } from '../../../types/resignation.types';
import { useAuthStore, useUIStore } from '../../../store';

interface Stage1PortfolioReassignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ResignationRecord | null;
  onSuccess: () => void;
}

export const Stage1PortfolioReassignmentModal: React.FC<Stage1PortfolioReassignmentModalProps> = ({
  isOpen,
  onClose,
  record,
  onSuccess,
}) => {
  const currentUser = useAuthStore((s) => s.user);
  const { addToast } = useUIStore();

  const availableStaff = useMemo(() => {
    const allActive = getActiveStaffProfiles();
    return allActive
      .filter((p) => p.employeeId !== record?.employeeId && p.id !== record?.employeeId)
      .map((p) => ({
        id: p.employeeId,
        name: p.fullName,
        role: STAFF_ROLE_META[p.role]?.label || p.role,
      }));
  }, [record]);

  const [replacementId, setReplacementId] = useState('');
  const [routeDetails, setRouteDetails] = useState('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (availableStaff.length > 0 && !replacementId) {
      setReplacementId(availableStaff[0].id);
    }
  }, [availableStaff, replacementId]);

  if (!isOpen || !record) return null;

  const hasUnassignedItems = record.activePortfolioItems.length > 0;
  const selectedReplacement = availableStaff.find((r) => r.id === replacementId);

  const handleExecuteReassignment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!replacementId) {
      addToast({
        type: 'error',
        title: 'Replacement Employee Required',
        message: 'You must select an active replacement employee ID before completing Stage 1 clearance.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      resignationService.reassignPortfolioAndApproveStage1(
        record.id,
        replacementId,
        selectedReplacement?.name || 'Authorized Replacement Officer',
        currentUser?.displayName || 'Branch Manager',
        comments,
        routeDetails
      );

      addToast({
        type: 'success',
        title: 'Stage 1 Clearance & Portfolio Transferred',
        message: `Successfully transferred ${record.activePortfolioItems.length} active customer accounts to ${selectedReplacement?.name}. Stage 1 gate unlocked.`,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Stage 1 Handover Failed',
        message: err.message || 'Could not execute portfolio transfer.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden font-sans text-xs border border-slate-200 max-h-[92dvh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-[#0B1F3A] px-4 sm:px-6 py-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/20 text-[#D4AF37] border border-amber-500/30">
                <Lock size={18} />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  Stage 1 Mandatory Portfolio Reassignment Lock
                </h3>
                <p className="text-[11px] text-slate-300">
                  Zero Unassigned Customers Security Gate • Resigning: <strong>{record.employeeName}</strong> ({record.employeeId})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleExecuteReassignment} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar flex-1">
            {/* Security Gate Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-950">
                <ShieldAlert size={16} className="text-amber-700 shrink-0" />
                <span>Section 7A.1 Zero Unassigned Customers Security Rule</span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                If a resigning CRO holds active Group Loans or Business Loans, or if a CM/BM holds vault custody keys, Stage 1 approval is strictly locked until a 1-click route reassignment is executed to an active branch employee.
              </p>
            </div>

            {/* Active Portfolio to be Reassigned */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Active Customer Accounts Pending Handover:</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold">
                  {record.activePortfolioItems.length} Accounts Assigned
                </span>
              </div>

              {hasUnassignedItems ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto divide-y divide-slate-100">
                  {record.activePortfolioItems.map((item) => (
                    <div key={item.id} className="p-2.5 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/60">
                      <div>
                        <div className="font-bold text-[#0B1F3A] flex items-center gap-1.5">
                          {item.type === 'GROUP_LOAN' ? <Users size={12} className="text-blue-600" /> : <Briefcase size={12} className="text-emerald-600" />}
                          <span>{item.customerName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {item.loanId} • {item.centerGroup || item.customerMobile}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-extrabold text-[#0B1F3A]">
                          ₹{(item.balanceAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <div className="text-[10px] text-rose-600 font-semibold">Active Principal</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-emerald-800 font-semibold text-xs">
                  ✓ All customer accounts have already been transferred.
                </div>
              )}
            </div>

            {/* Replacement Employee Selector */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1-Click Route & Portfolio Transfer Replacement Employee <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={replacementId}
                  onChange={(e) => setReplacementId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-[#0B1F3A] focus:border-[#0B1F3A] focus:outline-none bg-slate-50"
                >
                  {availableStaff.length === 0 ? (
                    <option value="">No other active staff available (Register staff in Admin panel)</option>
                  ) : (
                    availableStaff.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.id}) — {r.role}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Collection Route / Territory Scope
                </label>
                <input
                  type="text"
                  value={routeDetails}
                  onChange={(e) => setRouteDetails(e.target.value)}
                  placeholder="e.g. Center Route 01 & 04 East"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-[#0B1F3A] focus:border-[#0B1F3A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Branch Manager Verification Remarks
                </label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-[#0B1F3A] focus:border-[#0B1F3A] focus:outline-none"
                />
              </div>
            </div>

            {/* Handover Checklist Confirmation */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-semibold">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 size={13} />
                <span>Field cash balance confirmed: Rs. 0 pending collection</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 size={13} />
                <span>Receipt books & counterfoil registers verified and surrendered</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 size={13} />
                <span>Vault combination keys / physical appraisal files handed over</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#163359] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 min-h-[44px]"
              >
                <span>Transfer Portfolio & Approve Stage 1</span>
                <ArrowRight size={14} className="text-[#D4AF37]" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Stage1PortfolioReassignmentModal;
