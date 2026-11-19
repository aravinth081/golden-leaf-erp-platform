// ──────────────────────────────────────────────────
// Golden Leaf Finance — Employee Resignation Self-Service Application Modal
// Section 10 Specification • Auto-fetch Profile • Role Notice Calculation • Medical Waiver
// ──────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Calendar, Clock, AlertTriangle, ShieldCheck,
  Send, FileText, Upload, HeartPulse
} from 'lucide-react';
import { resignationService } from '../../../services/resignationService';
import { type ResignationCategory } from '../../../types/resignation.types';
import { useAuthStore, useUIStore } from '../../../store';
import { type UserRole } from '../../../types';

interface ResignationApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResignationApplicationModal: React.FC<ResignationApplicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const currentUser = useAuthStore((s) => s.user);
  const userRole = (currentUser?.customClaims?.role || 'collection_agent') as UserRole;
  const { addToast } = useUIStore();

  // Employee Profile Identity
  const employeeId = currentUser?.employeeId || (userRole === 'collection_agent' ? 'GLF-EMP-004' : userRole === 'branch_manager' ? 'GLF-EMP-002' : 'GLF-EMP-010');
  const employeeName = currentUser?.displayName || 'Authorized Employee';
  const branchId = currentUser?.customClaims?.branchId || 'BR-01';
  const branchName = 'Main Branch - Anna Nagar';
  const dateOfJoining = '2024-06-15';

  const designationMap: Record<string, 'Customer Relationship Officer (CRO)' | 'Credit Manager' | 'HR Official' | 'Branch Manager'> = {
    collection_agent: 'Customer Relationship Officer (CRO)',
    credit_manager: 'Credit Manager',
    branch_manager: 'Branch Manager',
  };
  const designation = designationMap[userRole] || 'Customer Relationship Officer (CRO)';

  // Form State
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role Notice Requirement
  const noticeDaysRequired = resignationService.getNoticeDaysForRole(userRole);
  const todayStr = new Date().toISOString().slice(0, 10);
  const calculatedLWD = useMemo(() => {
    return resignationService.calculateEstimatedLastWorkingDay(todayStr, noticeDaysRequired);
  }, [todayStr, noticeDaysRequired]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      addToast({
        type: 'warning',
        title: 'Reason Required',
        message: 'Please provide a comprehensive explanation for your resignation.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      resignationService.submitResignation({
        employeeId,
        employeeName,
        designation,
        role: userRole,
        branchId,
        branchName,
        dateOfJoining,
        category: 'STANDARD_NOTICE',
        reason: reason.trim(),
      });

      addToast({
        type: 'success',
        title: 'Resignation Initiated',
        message: 'Standard resignation submitted successfully. Forwarded to Branch Manager for Stage 1 Portfolio Reassignment.',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'Could not submit resignation application.',
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
          className="relative bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden font-sans text-xs border border-slate-200 max-h-[92dvh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-[#0B1F3A] px-4 sm:px-6 py-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-white/10 text-[#D4AF37]">
                <FileText size={18} />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  Employee Resignation & Handover Initiation
                </h3>
                <p className="text-[11px] text-slate-300">
                  Goldenleaf Finance Limited • Official Exit Self-Service Portal
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

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
            {/* Auto-Fetched Profile Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Employee Name & ID</span>
                <span className="font-extrabold text-[#0B1F3A]">{employeeName}</span>
                <span className="text-slate-500 font-mono text-[11px] block">{employeeId}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Designation & Branch</span>
                <span className="font-bold text-slate-800">{designation}</span>
                <span className="text-slate-500 text-[11px] block">{branchName}</span>
              </div>
            </div>

            {/* Relieving Category: Standard Relieving Only */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Relieving Category
              </label>
              <div className="p-3.5 rounded-2xl border border-[#0B1F3A] bg-blue-50/40 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0B1F3A] text-xs">Standard Relieving</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      Company Norm
                    </span>
                  </div>
                  <Clock size={16} className="text-blue-600" />
                </div>
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  Serve required <strong>{noticeDaysRequired} Working Days</strong> per Golden Leaf employment guidelines. Handover schedule and final relieving terms will be verified and coordinated with HR Management.
                </div>
              </div>
            </div>

            {/* Notice Period & Estimated LWD Banner */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between text-xs">
              <div>
                <div className="text-[10px] font-bold uppercase text-amber-900">Standard Notice Requirement</div>
                <div className="font-extrabold text-[#0B1F3A]">
                  {noticeDaysRequired} Working Days ({userRole === 'branch_manager' ? 'BM 90 Days' : userRole === 'credit_manager' ? 'CM 60 Days' : 'CRO 30 Days'})
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase text-amber-900">Estimated Last Working Day</div>
                <div className="font-extrabold text-emerald-800 font-mono text-sm">{calculatedLWD}</div>
              </div>
            </div>

            {/* Reason for Resignation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Resignation & Handover Scope <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the operational reasons for resignation and detail pending responsibilities to be transferred..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-[#0B1F3A] focus:outline-none focus:border-[#0B1F3A]"
              />
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
                <Send size={13} className="text-[#D4AF37]" />
                <span>Submit Resignation</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ResignationApplicationModal;
