// ──────────────────────────────────────────────────
// Golden Leaf Finance — Business Loan Detail & Lifecycle Modal
// Role-Based Actions • Credit Verification • Pre-Closure 3-Step Lifecycle
// ──────────────────────────────────────────────────

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle2, AlertTriangle, Printer, RotateCcw,
  CheckSquare, ArrowRight, ShieldCheck, DollarSign,
  FileText, Store, User, Building, MapPin, Receipt, Award
} from 'lucide-react';
import {
  type BusinessLoanRecord,
  type BusinessLoanStatus,
} from '../../../../types/businessLoan.types';
import { businessLoanService } from '../../../../services/businessLoanService';
import { useAuthStore, useUIStore } from '../../../../store';

interface BusinessLoanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: BusinessLoanRecord | null;
  onLoanUpdated: (updatedLoan: BusinessLoanRecord) => void;
  onOpenSanctionLetter: (loan: BusinessLoanRecord) => void;
  onOpenReceipt: (loan: BusinessLoanRecord, receipt: any) => void;
  onOpenNOC: (loan: BusinessLoanRecord) => void;
}

export const BusinessLoanDetailModal: React.FC<BusinessLoanDetailModalProps> = ({
  isOpen,
  onClose,
  loan,
  onLoanUpdated,
  onOpenSanctionLetter,
  onOpenReceipt,
  onOpenNOC,
}) => {
  const currentUser = useAuthStore((s) => s.user);
  const userRole = currentUser?.customClaims?.role || 'admin';
  const { addToast } = useUIStore();

  // Action states
  const [returnReason, setReturnReason] = useState('');
  const [isReturnInputOpen, setIsReturnInputOpen] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [disbursementMode, setDisbursementMode] = useState<'NEFT' | 'IMPS' | 'RTGS' | 'CHEQUE'>('NEFT');
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);

  // Collection recording
  const [collectionAmount, setCollectionAmount] = useState<number>(loan?.exactEmiPerPeriod || 1800);
  const [installmentsCovered, setInstallmentsCovered] = useState<number>(1);
  const [collectionType, setCollectionType] = useState<'STANDARD' | 'ADVANCE'>('STANDARD');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'NEFT'>('CASH');
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);

  // Pre-closure
  const [preClosureRemarks, setPreClosureRemarks] = useState('');
  const [isPreClosureOpen, setIsPreClosureOpen] = useState(false);

  if (!isOpen || !loan) return null;

  // Status Badge Component
  const renderStatusBadge = (status: BusinessLoanStatus) => {
    switch (status) {
      case 'SUBMITTED_BY_CRO':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            ● SUBMITTED BY CRO
          </span>
        );
      case 'RETURNED_TO_CRO':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
            ⚠ RETURNED TO CRO
          </span>
        );
      case 'BRANCH_VERIFIED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            ★ BRANCH VERIFIED (AWAITING UTR)
          </span>
        );
      case 'ACTIVE_COLLECTING':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            ✓ ACTIVE – COLLECTING
          </span>
        );
      case 'PRE_CLOSURE_REQUESTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-800 border border-red-300">
            ⧗ PRE-CLOSURE REQUESTED
          </span>
        );
      case 'CLOSED_NOC_ISSUED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
            ✔ CLOSED & NOC ISSUED
          </span>
        );
      default:
        return null;
    }
  };

  // Credit Manager Return to CRO
  const handleReturnToCro = () => {
    if (!returnReason.trim()) {
      addToast({ type: 'error', title: 'Reason Mandatory', message: 'Please specify the KYC or document correction needed.' });
      return;
    }
    const updated = businessLoanService.returnToCro(loan.id, returnReason, currentUser?.displayName || 'Credit Manager');
    addToast({ type: 'info', title: 'Application Returned to CRO', message: 'CRO notified with correction notes.' });
    onLoanUpdated(updated);
    setIsReturnInputOpen(false);
  };

  // Credit Manager Approve Docs
  const handleApproveCredit = () => {
    const updated = businessLoanService.verifyByCreditManager(loan.id, currentUser?.displayName || 'Credit Manager');
    addToast({ type: 'success', title: 'KYC & Documents Approved', message: 'Application passed to Branch Manager for sanction.' });
    onLoanUpdated(updated);
  };

  // Branch Manager Sanction
  const handleSanctionLoan = () => {
    const updated = businessLoanService.sanctionByBranchManager(loan.id, currentUser?.displayName || 'Branch Manager');
    addToast({ type: 'success', title: 'Loan Sanctioned', message: 'Endorsed for branch target. Awaiting Admin UTR release.' });
    onLoanUpdated(updated);
  };

  // Admin Release UTR & Disburse
  const handleDisburseAdmin = () => {
    if (!utrInput.trim()) {
      addToast({ type: 'error', title: 'UTR Number Mandatory', message: 'Please enter bank NEFT/IMPS reference number.' });
      return;
    }
    const updated = businessLoanService.disburseByAdmin(loan.id, utrInput, disbursementMode, currentUser?.displayName || 'Admin');
    addToast({ type: 'success', title: 'Loan Disbursed', message: 'Funds released. Account moved to Active Collection Schedule.' });
    onLoanUpdated(updated);
    setIsDisburseModalOpen(false);
  };

  // Collect Installment
  const handleRecordCollection = () => {
    if (collectionAmount <= 0) {
      addToast({ type: 'error', title: 'Invalid Amount', message: 'Enter a valid collection amount.' });
      return;
    }
    const { loan: updated, receipt } = businessLoanService.recordCollection(
      loan.id,
      collectionAmount,
      installmentsCovered,
      collectionType,
      paymentMode,
      currentUser?.employeeId || loan.originatingCroId,
      currentUser?.displayName || loan.originatingCroName,
      'Installment collected on-site.'
    );
    addToast({ type: 'success', title: 'Collection Receipt Generated', message: `Collected ₹${collectionAmount.toLocaleString('en-IN')}.` });
    onLoanUpdated(updated);
    setIsCollectionOpen(false);
    onOpenReceipt(updated, receipt);
  };

  // Pre-Closure Step 1: CRO Initiates
  const handleCroInitiatePreClosure = () => {
    if (!preClosureRemarks.trim()) {
      addToast({ type: 'error', title: 'Remarks Mandatory', message: 'Enter reason for early pre-closure.' });
      return;
    }
    const updated = businessLoanService.initiatePreClosure(
      loan.id,
      currentUser?.employeeId || loan.originatingCroId,
      currentUser?.displayName || loan.originatingCroName,
      preClosureRemarks
    );
    addToast({ type: 'info', title: 'Pre-Closure Step 1 Initiated', message: 'Forwarded to Branch Manager for zero-dues check.' });
    onLoanUpdated(updated);
    setIsPreClosureOpen(false);
  };

  // Pre-Closure Step 2: Branch Manager Verifies
  const handleBmVerifyPreClosure = () => {
    const updated = businessLoanService.verifyPreClosureByBm(loan.id, currentUser?.displayName || 'Branch Manager');
    addToast({ type: 'success', title: 'Step 2: Zero Dues Verified', message: 'Forwarded to Admin for final closure & NOC issuance.' });
    onLoanUpdated(updated);
  };

  // Pre-Closure Step 3: Admin Approves & Issues NOC
  const handleAdminApprovePreClosure = () => {
    const updated = businessLoanService.approvePreClosureByAdmin(loan.id, currentUser?.displayName || 'Admin');
    addToast({ type: 'success', title: 'Step 3: Loan Closed & NOC Issued', message: 'No Objection Certificate generated.' });
    onLoanUpdated(updated);
    onOpenNOC(updated);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col font-body text-xs"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#0B1F3A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base font-black tracking-tight">{loan.customerName}</h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-gray-200">
                  {loan.id}
                </span>
                {renderStatusBadge(loan.status)}
              </div>
              <p className="text-[11px] text-gray-300">
                {loan.businessName} • {loan.branchName} • Originated By: {loan.originatingCroName} ({loan.originatingCroId})
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => onOpenSanctionLetter(loan)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all min-h-[36px]"
              >
                <FileText size={14} />
                <span>Sanction Letter & KFS</span>
              </button>
              {loan.status === 'CLOSED_NOC_ISSUED' && (
                <button
                  type="button"
                  onClick={() => onOpenNOC(loan)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all min-h-[36px]"
                >
                  <Award size={14} />
                  <span>View NOC</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Return Reason Warning (if returned) */}
          {loan.status === 'RETURNED_TO_CRO' && (
            <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex items-start gap-2 text-amber-900">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Returned to CRO by {loan.cmReviewedBy}:</strong> {loan.returnReason}
                <div className="text-[10px] text-amber-700 mt-0.5">
                  Remarks: {loan.cmRemarks}
                </div>
              </div>
            </div>
          )}

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-5 grow">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Sanctioned Amount</span>
                <strong className="text-emerald-800 text-sm font-bold">₹{loan.sanctionedAmount.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Net Disbursal</span>
                <strong className="text-gray-900 font-mono">₹{loan.netDisbursementAmount.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Installment (EMI)</span>
                <strong className="text-[#0B1F3A] font-bold">
                  ₹{loan.exactEmiPerPeriod.toLocaleString('en-IN')} / {loan.collectionFrequency === 'Daily' ? 'Day' : loan.collectionFrequency === 'Weekly' ? 'Wk' : 'Mo'}
                </strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Balance Pending</span>
                <strong className="text-red-700 font-bold">₹{loan.pendingOutstandingBalance.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            {/* 4-Box Overview Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box 1 View */}
              <div className="p-4 rounded-2xl border border-gray-200 bg-white space-y-2">
                <span className="font-extrabold text-[#0B1F3A] uppercase tracking-wider block text-[11px] pb-1 border-b border-gray-100 flex items-center gap-1.5">
                  <User size={13} className="text-[#D4AF37]" /> Box 1: Borrower & Co-Borrower
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-gray-500">Phone:</span> <strong>{loan.primaryMobile}</strong></div>
                  <div><span className="text-gray-500">DOB / Age:</span> <strong>{loan.dob} ({loan.age} yrs)</strong></div>
                  <div><span className="text-gray-500">Aadhaar:</span> <span className="font-mono">{loan.aadhaarNumber}</span></div>
                  <div><span className="text-gray-500">PAN:</span> <span className="font-mono">{loan.panNumber}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">Address:</span> {loan.residentialAddress}</div>
                  <div className="col-span-2 pt-1 border-t border-gray-100">
                    <span className="text-gray-500">Guarantor:</span> <strong>{loan.coApplicant.fullName}</strong> ({loan.coApplicant.relationship}) • {loan.coApplicant.mobileNo}
                  </div>
                </div>
              </div>

              {/* Box 2 View */}
              <div className="p-4 rounded-2xl border border-gray-200 bg-white space-y-2">
                <span className="font-extrabold text-[#0B1F3A] uppercase tracking-wider block text-[11px] pb-1 border-b border-gray-100 flex items-center gap-1.5">
                  <Store size={13} className="text-[#D4AF37]" /> Box 2: Shop & Business Profile
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-gray-500">Category:</span> <strong>{loan.businessCategory}</strong></div>
                  <div><span className="text-gray-500">Premises:</span> <strong>{loan.premisesType}</strong></div>
                  <div><span className="text-gray-500">Vintage:</span> <strong>{loan.businessVintageYears} Years</strong></div>
                  <div><span className="text-gray-500">Daily Sales:</span> <strong className="text-emerald-700">₹{loan.estimatedDailySales.toLocaleString('en-IN')}</strong></div>
                  <div className="col-span-2"><span className="text-gray-500">Shop Address:</span> {loan.shopAddress}</div>
                  <div className="col-span-2 text-[10px] text-gray-500">GPS: {loan.gpsLocationTag}</div>
                </div>
              </div>

              {/* Box 3 View */}
              <div className="p-4 rounded-2xl border border-gray-200 bg-white space-y-2">
                <span className="font-extrabold text-[#0B1F3A] uppercase tracking-wider block text-[11px] pb-1 border-b border-gray-100 flex items-center gap-1.5">
                  <DollarSign size={13} className="text-[#D4AF37]" /> Box 3: Terms & Banking
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-gray-500">Frequency:</span> <strong>{loan.collectionFrequency}</strong></div>
                  <div><span className="text-gray-500">Tenure:</span> <strong>{loan.tenureUnits} {loan.collectionFrequency === 'Daily' ? 'Days' : loan.collectionFrequency === 'Weekly' ? 'Wks' : 'Mos'}</strong></div>
                  <div><span className="text-gray-500">Bank:</span> <strong>{loan.customerBankName}</strong></div>
                  <div><span className="text-gray-500">Account:</span> <span className="font-mono">{loan.customerBankAccountNo}</span></div>
                  <div><span className="text-gray-500">IFSC:</span> <span className="font-mono">{loan.customerBankIfsc}</span></div>
                  <div><span className="text-gray-500">Bank UTR:</span> <span className="font-mono font-bold text-blue-900">{loan.adminDisbursementUtr || 'Not Disbursed'}</span></div>
                </div>
              </div>

              {/* Box 4 View: 5-Document Checklist */}
              <div className="p-4 rounded-2xl border border-gray-200 bg-white space-y-2">
                <span className="font-extrabold text-[#0B1F3A] uppercase tracking-wider block text-[11px] pb-1 border-b border-gray-100 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-[#D4AF37]" /> Box 4: 5-Document Verification
                </span>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>1. Applicant & Guarantor Photos:</span>
                    <strong className="text-emerald-700">✓ Verified</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>2. Personal KYC (Aadhaar & PAN):</span>
                    <strong className={loan.documents.personalKycProofs.status === 'REJECTED' ? 'text-red-700' : 'text-emerald-700'}>
                      {loan.documents.personalKycProofs.status}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>3. Live Shop Photo with Nameboard:</span>
                    <strong className={loan.documents.liveShopPhoto.status === 'REJECTED' ? 'text-red-700' : 'text-emerald-700'}>
                      {loan.documents.liveShopPhoto.status}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>4. Business Proof (MSME/GST/License):</span>
                    <strong className="text-emerald-700">✓ Verified</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>5. Banking Proof (Statement/Passbook):</span>
                    <strong className="text-emerald-700">✓ Verified</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Collection Ledger (if active) */}
            {loan.collections && loan.collections.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <span className="font-bold text-[#0B1F3A] uppercase tracking-wider block text-[11px]">
                  Recent Collection Receipts:
                </span>
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {loan.collections.slice(0, 5).map((col) => (
                    <div key={col.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-gray-50">
                      <div>
                        <strong className="text-[#0B1F3A]">{col.receiptNo}</strong>
                        <span className="text-gray-500 text-[10px] ml-2">
                          {col.collectionDate} • {col.collectionType}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <strong className="text-emerald-800 font-mono">₹{col.amountPaid.toLocaleString('en-IN')}</strong>
                        <button
                          type="button"
                          onClick={() => onOpenReceipt(loan, col)}
                          className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-[#0B1F3A] text-[10px] font-bold"
                        >
                          Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── ACTION TOOLBAR ACCORDING TO ROLE ─── */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Left: Pre-Closure 3-Step Action */}
            <div className="flex items-center gap-2">
              {loan.status === 'ACTIVE_COLLECTING' && (
                <button
                  type="button"
                  onClick={() => setIsPreClosureOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Initiate Pre-Closure (Step 1)</span>
                </button>
              )}

              {loan.status === 'PRE_CLOSURE_REQUESTED' && !loan.preClosure?.bmZeroOutstandingConfirmed && (
                <button
                  type="button"
                  onClick={handleBmVerifyPreClosure}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 size={14} />
                  <span>BM: Verify Zero Dues (Step 2)</span>
                </button>
              )}

              {loan.status === 'PRE_CLOSURE_REQUESTED' && loan.preClosure?.bmZeroOutstandingConfirmed && (
                <button
                  type="button"
                  onClick={handleAdminApprovePreClosure}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Award size={14} />
                  <span>Admin: Close Loan & Issue NOC (Step 3)</span>
                </button>
              )}
            </div>

            {/* Right: Operational Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Credit Manager Verification */}
              {loan.status === 'SUBMITTED_BY_CRO' && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsReturnInputOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle size={14} />
                    <span>Return to CRO (Mistakes)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleApproveCredit}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckSquare size={14} />
                    <span>Approve KYC & Documents</span>
                  </button>
                </>
              )}

              {/* Branch Manager Sanction */}
              {loan.status === 'SUBMITTED_BY_CRO' && loan.cmReviewedBy && (
                <button
                  type="button"
                  onClick={handleSanctionLoan}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 size={14} />
                  <span>Sanction for Branch</span>
                </button>
              )}

              {/* Admin Disbursement */}
              {loan.status === 'BRANCH_VERIFIED' && (
                <button
                  type="button"
                  onClick={() => setIsDisburseModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <DollarSign size={14} />
                  <span>Release Bank Transfer UTR</span>
                </button>
              )}

              {/* Record Collection (When Active) */}
              {loan.status === 'ACTIVE_COLLECTING' && (
                <button
                  type="button"
                  onClick={() => setIsCollectionOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#132c4e] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Receipt size={14} />
                  <span>Collect Installment</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          {/* ─── RETURN TO CRO SUB-DRAWER ─── */}
          {isReturnInputOpen && (
            <div className="p-4 bg-amber-50 border-t border-amber-300 text-xs space-y-2">
              <span className="font-bold text-amber-900 block">
                Specify Reason for Returning Application to CRO:
              </span>
              <textarea
                rows={2}
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="e.g. Aadhaar card back image is blurred. Retake wide shop photo with clear signboard..."
                className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-medium outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReturnInputOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReturnToCro}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                >
                  Confirm Return to CRO
                </button>
              </div>
            </div>
          )}

          {/* ─── DISBURSEMENT UTR SUB-DRAWER ─── */}
          {isDisburseModalOpen && (
            <div className="p-4 bg-blue-50 border-t border-blue-200 text-xs space-y-3">
              <span className="font-bold text-blue-900 block">
                Admin Bank Disbursement Execution (Net Amount: ₹{loan.netDisbursementAmount.toLocaleString('en-IN')})
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Disbursement Mode</label>
                  <select
                    value={disbursementMode}
                    onChange={(e) => setDisbursementMode(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg font-medium"
                  >
                    <option value="NEFT">NEFT (National Electronic Fund Transfer)</option>
                    <option value="IMPS">IMPS (Immediate Payment Service)</option>
                    <option value="RTGS">RTGS (Real Time Gross Settlement)</option>
                    <option value="CHEQUE">Bank Cheque / Pay Order</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Bank UTR / Transaction No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SBIN02607149021"
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value.toUpperCase())}
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg font-mono font-bold uppercase"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDisburseModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDisburseAdmin}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  Confirm Disbursement
                </button>
              </div>
            </div>
          )}

          {/* ─── COLLECTION RECEIPT SUB-DRAWER ─── */}
          {isCollectionOpen && (
            <div className="p-4 bg-emerald-50 border-t border-emerald-200 text-xs space-y-3">
              <span className="font-bold text-emerald-950 block">
                Record Installment Collection & Generate Receipt:
              </span>
              <div className="grid grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Receipt Type</label>
                  <select
                    value={collectionType}
                    onChange={(e) => setCollectionType(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg font-bold"
                  >
                    <option value="STANDARD">Standard Due Receipt</option>
                    <option value="ADVANCE">Advance Early Receipt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Installments Covered</label>
                  <input
                    type="number"
                    min="1"
                    value={installmentsCovered}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 1;
                      setInstallmentsCovered(count);
                      setCollectionAmount(count * loan.exactEmiPerPeriod);
                    }}
                    className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    value={collectionAmount}
                    onChange={(e) => setCollectionAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg font-black text-emerald-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg font-medium"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / QR</option>
                    <option value="NEFT">Bank Transfer</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCollectionOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRecordCollection}
                  className="px-4 py-1.5 rounded-lg bg-[#0B1F3A] text-white font-bold text-xs shadow-xs"
                >
                  Generate & Print Official Receipt
                </button>
              </div>
            </div>
          )}

          {/* ─── PRE-CLOSURE INITIATION SUB-DRAWER ─── */}
          {isPreClosureOpen && (
            <div className="p-4 bg-red-50 border-t border-red-200 text-xs space-y-2">
              <span className="font-bold text-red-950 block">
                Step 1: Initiate Early Loan Pre-Closure Request (Pending: ₹{loan.pendingOutstandingBalance.toLocaleString('en-IN')}):
              </span>
              <textarea
                rows={2}
                value={preClosureRemarks}
                onChange={(e) => setPreClosureRemarks(e.target.value)}
                placeholder="Reason for early closure (e.g., Borrower paid remaining balance in lump-sum, moving shop)..."
                className="w-full p-2.5 bg-white border border-red-300 rounded-xl text-xs font-medium outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreClosureOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCroInitiatePreClosure}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs"
                >
                  Submit Pre-Closure to Branch Manager
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
