// ──────────────────────────────────────────────────
// Golden Leaf Finance — FD Booking Form Modal
// Maker-Checker Booking Form (Section 5) with Live Math
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  X, Calculator, CheckCircle2, DollarSign, Calendar,
  Shield, User, Upload, ArrowRight, ArrowLeft
} from 'lucide-react';
import type { Investor } from '../../../types/investor.types';
import type { FixedDeposit, FDHoldingPattern, FDSchemeType, FDPayoutFrequency, FDPayoutDate, FDFundingMode, FDMaturityInstruction } from '../../../types/fd.types';
import {
  computeFDReturns,
  getBaseRateForDays,
  formatINR,
  numberToWords,
  addTenureToDate,
  isSeniorCitizen,
} from '../../../utils/fdCalculations';
import { bookFixedDeposit, getRateSlabs } from '../../../services/fdService';
import { InstantCustomerSearch } from './InstantCustomerSearch';
import { useAuthStore } from '../../../store';

interface FDBookingModalProps {
  initialInvestor?: Investor | null;
  onClose: () => void;
  onSuccess: (newFD: FixedDeposit) => void;
}

export const FDBookingModal: React.FC<FDBookingModalProps> = ({
  initialInvestor,
  onClose,
  onSuccess,
}) => {
  const user = useAuthStore((s) => s.user);
  const role = user?.customClaims?.role || 'admin';
  const isAdmin = role === 'admin' || role === 'area_manager';

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(initialInvestor || null);
  const [loading, setLoading] = useState(false);

  // Sec 1
  const [holdingPattern, setHoldingPattern] = useState<FDHoldingPattern>('Single Holder');
  const [secondApplicantName, setSecondApplicantName] = useState('');
  const [branchName, setBranchName] = useState('Chennai Main Branch');
  const [branchCode, setBranchCode] = useState('CHN-01');

  // Sec 2
  const [scheme, setScheme] = useState<FDSchemeType>('non-cumulative');
  const [payoutFrequency, setPayoutFrequency] = useState<FDPayoutFrequency>('Monthly');
  const [payoutDate, setPayoutDate] = useState<FDPayoutDate>('1st');
  const [principal, setPrincipal] = useState<number>(100000);
  const [tenureYears, setTenureYears] = useState<number>(1);
  const [tenureMonths, setTenureMonths] = useState<number>(0);
  const [tenureDays, setTenureDays] = useState<number>(0);

  // Boosters
  const isAutoSenior = selectedInvestor ? isSeniorCitizen(selectedInvestor.dob) : false;
  const [seniorBooster, setSeniorBooster] = useState(isAutoSenior);
  const [staffBooster, setStaffBooster] = useState(false);
  const [renewalBooster, setRenewalBooster] = useState(false);
  const [valueDate, setValueDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Sec 4
  const [fundingMode, setFundingMode] = useState<FDFundingMode>('NEFT');
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('Spouse');
  const [nomineeDob, setNomineeDob] = useState('1985-06-15');
  const [guardianName, setGuardianName] = useState('');
  const [maturityInstruction, setMaturityInstruction] = useState<FDMaturityInstruction>(
    'Auto-Renew Principal + Interest'
  );

  // Sync auto senior booster if investor changes
  useEffect(() => {
    if (selectedInvestor) {
      setSeniorBooster(isSeniorCitizen(selectedInvestor.dob));
    }
  }, [selectedInvestor]);

  // Calculations
  const totalDays = tenureYears * 365 + tenureMonths * 30 + tenureDays;
  const rateSlabs = getRateSlabs();
  const baseRate = getBaseRateForDays(totalDays, rateSlabs);

  const calc = computeFDReturns({
    principal,
    tenureYears,
    tenureMonths,
    tenureDays,
    scheme,
    payoutFrequency,
    baseRate,
    isSeniorCitizen: seniorBooster,
    isStaff: staffBooster,
    isRenewal: renewalBooster,
    taxDeclaration: selectedInvestor?.taxDeclaration || 'Standard TDS',
    hasPAN: Boolean(selectedInvestor?.pan),
  });

  const maturityDate = addTenureToDate(valueDate, tenureYears, tenureMonths, tenureDays);

  const applyQuickTenure = (years: number, months: number, days: number) => {
    setTenureYears(years);
    setTenureMonths(months);
    setTenureDays(days);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestor) {
      alert('Please link or select an investor customer.');
      setActiveStep(1);
      return;
    }
    if (!utrNumber.trim()) {
      alert('Please enter UTR / Cheque / Transaction reference number.');
      setActiveStep(4);
      return;
    }
    if (!nomineeName.trim()) {
      alert('Please provide nominee full name.');
      setActiveStep(4);
      return;
    }

    try {
      setLoading(true);
      const newFD = await bookFixedDeposit(
        {
          companyId: 'company_main',
          branchId: selectedInvestor.branchId || 'branch_chennai',
          branchName: selectedInvestor.branchName || branchName,
          branchCode,
          investorId: selectedInvestor.investorId,
          investorName: selectedInvestor.fullName,
          investorMobile: selectedInvestor.primaryMobile,
          investorPan: selectedInvestor.pan,
          holdingPattern,
          jointApplicant:
            holdingPattern !== 'Single Holder'
              ? { fullName: secondApplicantName }
              : undefined,
          scheme,
          payoutFrequency,
          payoutDate,
          principal,
          tenureYears,
          tenureMonths,
          tenureDays,
          totalDays: calc.totalDays,
          baseRate,
          boosterRate: calc.boosterRate,
          effectiveRate: calc.effectiveRate,
          isSeniorCitizen: seniorBooster,
          isStaff: staffBooster,
          isRenewal: renewalBooster,
          valueDate,
          maturityDate,
          periodicPayoutAmount: calc.periodicPayoutAmount,
          totalGrossInterest: calc.totalGrossInterest,
          tdsStatus: selectedInvestor.taxDeclaration,
          estimatedTDS: calc.estimatedTDS,
          netMaturityValue: calc.netMaturityValue,
          fundingMode,
          utrNumber: utrNumber.trim(),
          paymentDate,
          nominee: {
            fullName: nomineeName.trim(),
            relationship: nomineeRelation,
            dob: nomineeDob,
            guardianName: guardianName.trim() || undefined,
          },
          maturityInstruction,
        },
        role
      );

      onSuccess(newFD);
    } catch (err: any) {
      alert(`Booking failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92dvh] flex flex-col overflow-hidden border border-[#D4AF37]/40 animate-fade-in my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-[#0B1F3A] text-white shrink-0">
          <div>
            <h2 className="font-display font-bold text-base sm:text-lg text-white leading-tight">
              Fixed Deposit (FD) Booking Form
            </h2>
            <p className="text-[11px] sm:text-xs text-[#D4AF37] font-medium mt-0.5">
              Maker-Checker Dual Governance · Branch Operations & Central Approval
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* 4 Steps Wizard Ribbon */}
        <div className="grid grid-cols-4 border-b border-[#E2E8F0] bg-[#FAF7F0] shrink-0 text-xs">
          {[
            { num: 1, label: 'Customer Linking' },
            { num: 2, label: 'Scheme & Rate' },
            { num: 3, label: 'Live Math Preview' },
            { num: 4, label: 'Payment & Nominee' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setActiveStep(s.num as any)}
              className={`py-2.5 sm:py-3 px-1.5 sm:px-2 text-center font-bold border-b-2 transition-all cursor-pointer ${
                activeStep === s.num
                  ? 'border-[#D4AF37] text-[#0B1F3A] bg-white'
                  : activeStep > s.num
                  ? 'border-[#10B981] text-[#059669]'
                  : 'border-transparent text-[#94A3B8]'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                    activeStep === s.num
                      ? 'bg-[#D4AF37] text-white'
                      : activeStep > s.num
                      ? 'bg-[#10B981] text-white'
                      : 'bg-[#E2E8F0] text-[#64748B]'
                  }`}
                >
                  {activeStep > s.num ? '✓' : s.num}
                </span>
                <span className="hidden sm:inline truncate">{s.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar">
          {/* STEP 1: Customer Linking & Holding Pattern */}
          {activeStep === 1 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                <h3 className="font-display font-bold text-sm text-[#0B1F3A] uppercase tracking-wider">
                  Sec 1: Customer Linking & Holding Pattern
                </h3>
                <span className="text-xs font-semibold text-[#8C6808] bg-[#FAF7F0] px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
                  Auto Bond ID Allocated
                </span>
              </div>

              {/* Instant Search Bar */}
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wider">
                  Quick Search Customer (Mobile or Name) <span className="text-red-500">*</span>
                </label>
                <InstantCustomerSearch
                  onSelectInvestor={(inv) => setSelectedInvestor(inv)}
                  onBookNewFD={(inv) => setSelectedInvestor(inv)}
                />
              </div>

              {/* Linked Customer Summary Card */}
              {selectedInvestor ? (
                <div className="p-4 rounded-2xl bg-[#FFFDF7] border-2 border-[#D4AF37]/50 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-bold text-base text-[#0B1F3A]">
                        {selectedInvestor.fullName}
                      </h4>
                      <span className="font-mono text-xs font-bold bg-[#FAF7F0] text-[#8C6808] px-2 py-0.5 rounded border border-[#D4AF37]/40">
                        {selectedInvestor.investorId}
                      </span>
                      <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded">
                        KYC VERIFIED
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-1">
                      Mobile: <strong>{selectedInvestor.primaryMobile}</strong> · PAN: <strong className="font-mono">{selectedInvestor.pan}</strong> · {selectedInvestor.category}
                    </p>
                    <p className="text-[11px] text-[#8C6808] mt-0.5 font-medium">
                      🏦 Bank: {selectedInvestor.bankAccount.bankName} (A/C: {selectedInvestor.bankAccount.accountNumber}) · Form: {selectedInvestor.taxDeclaration}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedInvestor(null)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E]">
                  ⚠️ Please select or search an existing Customer/Investor to auto-fill PAN, KYC, and Bank Account details.
                </div>
              )}

              {/* Holding Pattern Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wider">
                    Holding Pattern <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={holdingPattern}
                    onChange={(e) => setHoldingPattern(e.target.value as FDHoldingPattern)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0B1F3A] bg-white outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Single Holder">Single Holder</option>
                    <option value="Joint Holder (Either or Survivor)">Joint Holder (Either or Survivor)</option>
                    <option value="Joint Holder (Anyone or Survivor)">Joint Holder (Anyone or Survivor)</option>
                  </select>
                </div>

                {holdingPattern !== 'Single Holder' && (
                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wider">
                      Second Applicant Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={secondApplicantName}
                      onChange={(e) => setSecondApplicantName(e.target.value)}
                      placeholder="Second Applicant Name"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0B1F3A] bg-white outline-none focus:border-[#D4AF37]"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Scheme, Principal, Tenure & Rates */}
          {activeStep === 2 && (
            <div className="space-y-5">
              <div className="pb-2 border-b border-[#F1F5F9]">
                <h3 className="font-display font-bold text-sm text-[#0B1F3A] uppercase tracking-wider">
                  Sec 2: Deposit Scheme, Principal, Tenure & Rate Inputs
                </h3>
              </div>

              {/* Scheme Radios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div
                  onClick={() => setScheme('non-cumulative')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    scheme === 'non-cumulative'
                      ? 'border-[#D4AF37] bg-[#FFFDF7] shadow-sm'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-[#0B1F3A]">
                      1. Non-Cumulative
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E]">
                      REGULAR PAYOUT
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">
                    Interest credited periodically (Monthly/Quarterly). Full principal returned upon maturity.
                  </p>
                </div>

                <div
                  onClick={() => setScheme('cumulative')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    scheme === 'cumulative'
                      ? 'border-[#D4AF37] bg-[#FFFDF7] shadow-sm'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-[#0B1F3A]">
                      2. Cumulative
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EDE9FE] text-[#6D28D9]">
                      MONEY MULTIPLIER
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">
                    Interest compounded quarterly and paid together with principal on maturity date.
                  </p>
                </div>
              </div>

              {/* Non-Cumulative Specifics */}
              {scheme === 'non-cumulative' && (
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF7F0] border border-[#D4AF37]/30">
                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                      Payout Frequency
                    </label>
                    <select
                      value={payoutFrequency}
                      onChange={(e) => setPayoutFrequency(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0B1F3A] bg-white outline-none"
                    >
                      <option value="Monthly">Monthly Cash Payout</option>
                      <option value="Quarterly">Quarterly Cash Payout</option>
                      <option value="Half-Yearly">Half-Yearly Payout</option>
                      <option value="Yearly">Yearly Payout</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                      Monthly Payout Day
                    </label>
                    <select
                      value={payoutDate}
                      onChange={(e) => setPayoutDate(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0B1F3A] bg-white outline-none"
                    >
                      <option value="1st">1st of Every Month</option>
                      <option value="5th">5th of Every Month</option>
                      <option value="Anniversary">Deposit Anniversary Date</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Principal Input + Words */}
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                  Deposit Principal Amount (Rs.) <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-base font-bold text-[#64748B]">₹</span>
                  <input
                    type="number"
                    min="10000"
                    step="5000"
                    value={principal}
                    onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-9 pr-4 py-3 rounded-2xl border-2 border-[#CBD5E1] text-lg font-bold font-mono text-[#0B1F3A] outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
                <p className="text-xs text-[#8C6808] font-serif italic mt-1.5 pl-1">
                  Rupees {numberToWords(principal)} Only
                </p>
              </div>

              {/* Tenure Selectors + Quick Buttons */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                    Deposit Tenure Selector <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#64748B] font-medium mr-1">Quick Sets:</span>
                    <button
                      type="button"
                      onClick={() => applyQuickTenure(0, 0, 180)}
                      className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155]"
                    >
                      180d
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickTenure(1, 0, 0)}
                      className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155]"
                    >
                      1 Yr
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickTenure(2, 0, 0)}
                      className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155]"
                    >
                      2 Yrs
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickTenure(3, 0, 0)}
                      className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155]"
                    >
                      3 Yrs
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[11px] text-[#64748B]">Years</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={tenureYears}
                      onChange={(e) => setTenureYears(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#0B1F3A] outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#64748B]">Months</span>
                    <input
                      type="number"
                      min="0"
                      max="11"
                      value={tenureMonths}
                      onChange={(e) => setTenureMonths(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#0B1F3A] outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#64748B]">Days</span>
                    <input
                      type="number"
                      min="0"
                      max="364"
                      value={tenureDays}
                      onChange={(e) => setTenureDays(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#0B1F3A] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Rate Slab & Boosters Ribbon */}
              <div className="p-4 rounded-2xl bg-[#FFFDF7] border border-[#FDE68A] space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#FDE68A]">
                  <div>
                    <span className="text-[#64748B]">Admin Rate Slab Base:</span>
                    <span className="font-bold text-[#0B1F3A] ml-1.5">{baseRate.toFixed(2)}% p.a.</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#64748B]">Effective Return:</span>
                    <span className="font-display font-bold text-sm text-[#059669] ml-1.5">
                      {calc.effectiveRate.toFixed(2)}% p.a.
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs font-medium text-[#334155]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seniorBooster}
                      onChange={(e) => setSeniorBooster(e.target.checked)}
                      className="rounded text-[#D4AF37] focus:ring-0"
                    />
                    <span>Senior Citizen (+0.50%)</span>
                    {isAutoSenior && (
                      <span className="text-[10px] text-[#059669] font-bold">Auto</span>
                    )}
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={staffBooster}
                      onChange={(e) => setStaffBooster(e.target.checked)}
                      className="rounded text-[#D4AF37] focus:ring-0"
                    />
                    <span>Staff / Employee (+1.00%)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={renewalBooster}
                      onChange={(e) => setRenewalBooster(e.target.checked)}
                      className="rounded text-[#D4AF37] focus:ring-0"
                    />
                    <span>Renewal Loyalty (+0.25%)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Live Auto-Calculated Output Preview */}
          {activeStep === 3 && (
            <div className="space-y-5">
              <div className="pb-2 border-b border-[#F1F5F9]">
                <h3 className="font-display font-bold text-sm text-[#0B1F3A] uppercase tracking-wider">
                  Sec 3: Live Auto-Calculated Output Preview
                </h3>
              </div>

              {/* 4 Cards Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase">FD Value Date</span>
                  <p className="font-semibold text-xs text-[#0B1F3A] mt-1">{valueDate}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A]">
                  <span className="text-[10px] font-bold text-[#92400E] uppercase">Exact Maturity Date</span>
                  <p className="font-bold text-xs text-[#92400E] mt-1">{maturityDate}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0]">
                  <span className="text-[10px] font-bold text-[#065F46] uppercase">Effective Rate</span>
                  <p className="font-display font-bold text-sm text-[#059669] mt-1">
                    {calc.effectiveRate.toFixed(2)}% p.a.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE]">
                  <span className="text-[10px] font-bold text-[#1E40AF] uppercase">Total Tenure</span>
                  <p className="font-semibold text-xs text-[#1E40AF] mt-1">{calc.totalDays} Days</p>
                </div>
              </div>

              {/* Big Financial Summary Box */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0B1F3A] to-[#1E3A8A] text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
                  <span className="text-white/70">Deposit Principal</span>
                  <span className="font-mono font-bold text-base">{formatINR(principal)}</span>
                </div>

                {scheme === 'non-cumulative' && (
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
                    <span className="text-white/70">
                      Periodic {payoutFrequency} Cash Payout
                    </span>
                    <span className="font-mono font-bold text-base text-[#34D399]">
                      {formatINR(calc.periodicPayoutAmount)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
                  <span className="text-white/70">Total Gross Interest Earned</span>
                  <span className="font-mono font-bold text-sm text-[#FDE68A]">
                    {formatINR(calc.totalGrossInterest)}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
                  <span className="text-white/70">
                    Estimated TDS ({selectedInvestor?.taxDeclaration === '15G' || selectedInvestor?.taxDeclaration === '15H' ? `${selectedInvestor.taxDeclaration} Verified - 0%` : 'Standard 10%'})
                  </span>
                  <span className="font-mono font-bold text-sm text-[#F87171]">
                    {calc.estimatedTDS > 0 ? `- ${formatINR(calc.estimatedTDS)}` : 'Rs. 0 (NIL TDS)'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#D4AF37] font-bold">
                      Final Net Maturity Payout
                    </span>
                    <p className="text-[11px] text-white/70">
                      {scheme === 'cumulative' ? 'Principal + Accumulated Interest' : 'Principal Returned'}
                    </p>
                  </div>
                  <span className="font-display font-bold text-2xl text-[#D4AF37]">
                    {formatINR(calc.netMaturityValue)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Funding Receipt, Nominee & SI */}
          {activeStep === 4 && (
            <div className="space-y-5">
              <div className="pb-2 border-b border-[#F1F5F9]">
                <h3 className="font-display font-bold text-sm text-[#0B1F3A] uppercase tracking-wider">
                  Sec 4: Funding Receipt, Nominee & Standing Instructions
                </h3>
              </div>

              {/* Funding Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                    Funding Mode <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={fundingMode}
                    onChange={(e) => setFundingMode(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0B1F3A] bg-white outline-none"
                  >
                    <option value="NEFT">NEFT Direct Bank Transfer</option>
                    <option value="RTGS">RTGS High-Value Transfer</option>
                    <option value="IMPS">IMPS Instant Bank Transfer</option>
                    <option value="UPI">UPI Payment</option>
                    <option value="Cheque">Banker's Cheque</option>
                    <option value="Demand Draft">Demand Draft</option>
                    <option value="Cash">Cash (Within Legal Limits)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                    UTR No / Transaction Ref <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. SBIN2026022812345"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-mono font-bold text-[#0B1F3A] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0B1F3A] outline-none"
                    required
                  />
                </div>
              </div>

              {/* Nominee Details */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <h4 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                  Mandatory Nominee Registration
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#64748B] mb-1">Nominee Full Name *</label>
                    <input
                      type="text"
                      value={nomineeName}
                      onChange={(e) => setNomineeName(e.target.value)}
                      placeholder="Nominee Name"
                      className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0B1F3A] bg-white outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#64748B] mb-1">Relationship *</label>
                    <select
                      value={nomineeRelation}
                      onChange={(e) => setNomineeRelation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0B1F3A] bg-white outline-none"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#64748B] mb-1">Nominee DOB *</label>
                    <input
                      type="date"
                      value={nomineeDob}
                      onChange={(e) => setNomineeDob(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0B1F3A] bg-white outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Standing Instruction Selection */}
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                  Maturity Standing Instruction (SI) <span className="text-red-500">*</span>
                </label>
                <select
                  value={maturityInstruction}
                  onChange={(e) => setMaturityInstruction(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0B1F3A] bg-white outline-none"
                >
                  <option value="Auto-Renew Principal + Interest">
                    Auto-Renew Principal + Interest (Cumulative Rollover)
                  </option>
                  <option value="Auto-Renew Principal Only">
                    Auto-Renew Principal Only (Payout Interest to Registered Bank)
                  </option>
                  <option value="Auto-Close & Credit to Bank">
                    Auto-Close & Credit Entire Maturity to Bank Account
                  </option>
                </select>
              </div>
            </div>
          )}

          {/* Footer Navigation Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-4 border-t border-[#E2E8F0] shrink-0">
            <div>
              {activeStep > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveStep((s) => (s - 1) as any)}
                  className="w-full sm:w-auto px-4 py-2.5 min-h-[40px] rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 min-h-[40px] rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9] transition-colors cursor-pointer flex items-center justify-center active:scale-[0.98]"
              >
                Cancel
              </button>

              {activeStep < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeStep === 1 && !selectedInvestor) {
                      alert('Please select a customer first.');
                      return;
                    }
                    setActiveStep((s) => (s + 1) as any);
                  }}
                  className="flex-1 sm:flex-none px-5 py-2.5 min-h-[40px] rounded-xl bg-[#0B1F3A] hover:bg-[#1E3A8A] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-[0.98]"
                >
                  Next Step <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none px-6 py-2.5 min-h-[40px] rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] text-white text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                >
                  {loading ? 'Submitting Application...' : 'Submit FD Application'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
