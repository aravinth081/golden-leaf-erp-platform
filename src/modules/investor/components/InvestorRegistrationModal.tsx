// ──────────────────────────────────────────────────
// Golden Leaf Finance — Investor Registration Modal
// Strict Admin-Only 4-Section Form (Section 3 of Functional Spec)
// ──────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  X, User, MapPin, ShieldCheck, Landmark, CheckCircle,
  Upload, ArrowRight, ArrowLeft, Loader2, Coins, TrendingUp,
  Calendar, Percent, Calculator
} from 'lucide-react';
import type { Investor, InvestorCategory, TaxDeclaration, InvestorDocuments } from '../../../types/investor.types';
import { calculateAge, isSeniorCitizen, numberToWords } from '../../../utils/fdCalculations';
import { createInvestor } from '../../../services/investorService';
import { getStoredBranches } from '../../../services/branchService';
import { uploadImage } from '../../../services/cloudinary';
import { DobInput } from '../../../components/ui';

interface InvestorRegistrationModalProps {
  onClose: () => void;
  onSuccess: (newInvestor: Investor) => void;
}

const CATEGORIES: InvestorCategory[] = [
  'Individual',
  'Company Director',
  'Promoter',
  'Shareholder',
  'Partnership Firm',
  'HUF',
  'Senior Citizen',
];

const FALLBACK_BRANCHES = [
  { id: 'BR-01', name: 'Chennai Main Branch', code: 'GL-BR-001' },
  { id: 'BR-02', name: 'Madurai Central Branch', code: 'GL-BR-002' },
  { id: 'BR-03', name: 'Coimbatore South Branch', code: 'GL-BR-003' },
  { id: 'BR-04', name: 'Tiruchirappalli Junction Branch', code: 'GL-BR-004' },
];

const VAULT_DOCS: { key: keyof InvestorDocuments; name: string }[] = [
  { key: 'photoUrl', name: '1) Investor Photograph' },
  { key: 'panCopyUrl', name: '2) PAN Card Copy' },
  { key: 'aadhaarFrontUrl', name: '3) Aadhaar Card (Front & Back)' },
  { key: 'chequeCopyUrl', name: '4) Cancelled Cheque / Passbook' },
  { key: 'signatureUrl', name: '5) Signature Specimen' },
];

export const InvestorRegistrationModal: React.FC<InvestorRegistrationModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const branches = React.useMemo(() => {
    try {
      const stored = getStoredBranches();
      if (stored && stored.length > 0) {
        return stored.map((b) => ({ id: b.id, name: b.name, code: b.code }));
      }
    } catch (e) {
      console.warn('Failed to load branches for investor registration', e);
    }
    return FALLBACK_BRANCHES;
  }, []);

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loading, setLoading] = useState(false);

  // 01 Basic Identity
  const [category, setCategory] = useState<InvestorCategory>('Individual');
  const [fullName, setFullName] = useState('');
  const [fatherSpouseName, setFatherSpouseName] = useState('');
  const [dob, setDob] = useState('1980-01-01');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');

  // 02 Contact & Branch
  const [primaryMobile, setPrimaryMobile] = useState('');
  const [secondaryMobile, setSecondaryMobile] = useState('');
  const [email, setEmail] = useState('');
  const [doorNo, setDoorNo] = useState('');
  const [street, setStreet] = useState('');
  const [town, setTown] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [pinCode, setPinCode] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || 'BR-01');

  // 03 Mandatory KYC & Tax
  const [pan, setPan] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [taxDeclaration, setTaxDeclaration] = useState<TaxDeclaration>('Standard TDS');
  const [documents, setDocuments] = useState<InvestorDocuments>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // 04 Investment & Interest Terms (New Column / Section Before Payout Bank)
  const [investmentAmount, setInvestmentAmount] = useState<number | string>(500000);
  const [investmentDisplay, setInvestmentDisplay] = useState<string>((500000).toLocaleString('en-IN'));
  const [interestRate, setInterestRate] = useState<string>('12.00');
  const [tenureYears, setTenureYears] = useState<number>(1);
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [payoutFrequency, setPayoutFrequency] = useState<'Monthly' | 'Quarterly' | 'Cumulative'>('Monthly');
  const [investmentDate, setInvestmentDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const handleInvestmentChange = (rawStr: string) => {
    const raw = rawStr.replace(/,/g, '').replace(/\D/g, '');
    if (!raw) {
      setInvestmentDisplay('');
      setInvestmentAmount('');
      return;
    }
    const num = parseInt(raw, 10);
    setInvestmentAmount(num);
    setInvestmentDisplay(num.toLocaleString('en-IN'));
  };

  const handleQuickInvestment = (num: number) => {
    setInvestmentAmount(num);
    setInvestmentDisplay(num.toLocaleString('en-IN'));
  };

  // 05 Bank Account
  const [bankHolderName, setBankHolderName] = useState('');
  const [bankName, setBankName] = useState('State Bank of India');
  const [bankBranch, setBankBranch] = useState('Main Branch');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountNumberConfirm, setAccountNumberConfirm] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [accountType, setAccountType] = useState<'Savings' | 'Current'>('Savings');
  const [payoutMode, setPayoutMode] = useState<'NEFT' | 'RTGS' | 'IMPS' | 'UPI'>('NEFT');

  const age = calculateAge(dob);
  const isSenior = isSeniorCitizen(dob);

  // Auto-calculated interest and returns like FD
  const principalNum = Number(investmentAmount) || 0;
  const rateNum = Number(interestRate) || 0;
  const effectiveMonths = Number(tenureMonths) || (Number(tenureYears) * 12) || 12;
  const effectiveYears = Number(tenureYears) || Math.max(1, Math.round(effectiveMonths / 12));

  const monthlyInterestCalc = principalNum > 0 && rateNum > 0 ? Math.round((principalNum * (rateNum / 100)) / 12) : 0;
  const annualInterestCalc = principalNum > 0 && rateNum > 0 ? Math.round(principalNum * (rateNum / 100)) : 0;
  const totalInterestCalc = Math.round(principalNum * (rateNum / 100) * (effectiveMonths / 12));
  const maturityValueCalc = principalNum + totalInterestCalc;

  const calculatedMaturityDate = React.useMemo(() => {
    try {
      const d = new Date(investmentDate);
      d.setMonth(d.getMonth() + effectiveMonths);
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  }, [investmentDate, effectiveMonths]);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docKey: keyof InvestorDocuments
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(docKey);
    try {
      const res = await uploadImage(file, 'investors/vault');
      if (res?.secure_url) {
        setDocuments((prev) => ({
          ...prev,
          [docKey]: res.secure_url,
        }));
      }
    } catch (err: any) {
      console.warn('Cloudinary upload warning:', err);
      // Fallback: Read as data URL if offline/error so user data is retained
      const reader = new FileReader();
      reader.onload = () => {
        setDocuments((prev) => ({
          ...prev,
          [docKey]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
      alert(`Upload notification: ${err?.message || 'Upload error'}. Image saved in session.`);
    } finally {
      setUploadingDoc(null);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (accountNumber !== accountNumberConfirm) {
      alert('Bank Account numbers do not match. Please verify double-entry.');
      setActiveStep(5);
      return;
    }

    if (pan.trim().length !== 10) {
      alert('PAN must be exactly 10 characters.');
      setActiveStep(3);
      return;
    }

    if (principalNum <= 0) {
      alert('Please enter a valid investment amount.');
      setActiveStep(4);
      return;
    }

    if (rateNum <= 0) {
      alert('Please enter an agreed annual rate of interest.');
      setActiveStep(4);
      return;
    }

    try {
      setLoading(true);
      const branchObj = branches.find((b) => b.id === selectedBranchId) || branches[0];

      const created = await createInvestor({
        category: isSenior ? 'Senior Citizen' : category,
        fullName: fullName.trim(),
        fatherSpouseName: fatherSpouseName.trim(),
        dob,
        gender,
        investmentAmount: principalNum,
        interestRate: rateNum,
        tenureYears: effectiveYears,
        tenureMonths: effectiveMonths,
        payoutFrequency,
        investmentDate,
        maturityDate: calculatedMaturityDate,
        totalInterestPayable: totalInterestCalc,
        maturityAmount: maturityValueCalc,
        primaryMobile: primaryMobile.trim(),
        secondaryMobile: secondaryMobile.trim() || undefined,
        email: email.trim() || undefined,
        doorNo: doorNo.trim(),
        street: street.trim(),
        town: town.trim(),
        district: district.trim(),
        state: state.trim(),
        pinCode: pinCode.trim(),
        branchId: branchObj.id,
        branchName: branchObj.name,
        pan: pan.trim().toUpperCase(),
        aadhaar: aadhaar.trim(),
        taxDeclaration,
        bankHolderName: bankHolderName.trim() || fullName.trim(),
        bankName: bankName.trim(),
        bankBranch: bankBranch.trim(),
        accountNumber: accountNumber.trim(),
        accountNumberConfirm: accountNumberConfirm.trim(),
        ifsc: ifsc.trim().toUpperCase(),
        accountType,
        payoutMode,
        documents,
      });

      onSuccess(created);
    } catch (err: any) {
      alert(`Registration error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formScrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (formScrollRef.current) {
      formScrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeStep]);

  const handleNextStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (activeStep === 1) {
      if (!fullName.trim()) {
        alert('Please enter investor full name.');
        return;
      }
      if (!investmentAmount || Number(investmentAmount) <= 0) {
        alert('Please enter a valid investor investment amount.');
        return;
      }
    }
    if (activeStep === 2) {
      if (!primaryMobile || primaryMobile.replace(/\D/g, '').length < 10) {
        alert('Please enter a valid 10-digit primary mobile number.');
        return;
      }
      if (!doorNo.trim() || !street.trim() || !town.trim() || !district.trim()) {
        alert('Please fill in complete residential address details (Door No, Street, City, District).');
        return;
      }
      if (!pinCode || pinCode.replace(/\D/g, '').length !== 6) {
        alert('Please enter a valid 6-digit PIN code.');
        return;
      }
    }
    if (activeStep === 3) {
      if (pan.trim().length !== 10) {
        alert('PAN must be exactly 10 characters.');
        return;
      }
      if (aadhaar && aadhaar.replace(/\D/g, '').length !== 12) {
        alert('Aadhaar must be exactly 12 digits.');
        return;
      }
    }
    if (activeStep === 4) {
      if (!investmentAmount || Number(investmentAmount) <= 0) {
        alert('Please enter a valid investment amount.');
        return;
      }
      if (!interestRate || Number(interestRate) <= 0) {
        alert('Please enter an agreed annual rate of interest.');
        return;
      }
    }
    setActiveStep((s) => (Math.min(s + 1, 5)) as any);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <form
        noValidate
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92dvh] flex flex-col overflow-hidden border border-[#D4AF37]/40 animate-fade-in my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-[#0B1F3A] text-white shrink-0">
          <div>
            <h2 className="font-display font-bold text-base sm:text-lg text-white leading-tight">
              Register New Investor / Capital Contributor
            </h2>
            <p className="text-[11px] sm:text-xs text-[#D4AF37] font-medium mt-0.5">
              Admin Master Directory Registration (Promoters, Directors, HNW Individuals)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0 touch-manipulation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wizard Steps Bar */}
        <div className="grid grid-cols-5 border-b border-[#E2E8F0] bg-[#FAF7F0] shrink-0 text-xs">
          {[
            { num: 1, label: '01 Identity' },
            { num: 2, label: '02 Contact & Branch' },
            { num: 3, label: '03 KYC & Tax' },
            { num: 4, label: '04 Investment Terms' },
            { num: 5, label: '05 Payout Bank' },
          ].map((s) => (
            <button
              type="button"
              key={s.num}
              onClick={() => setActiveStep(s.num as any)}
              className={`py-2.5 sm:py-3 px-1.5 sm:px-2 text-center font-bold border-b-2 transition-all cursor-pointer touch-manipulation select-none ${
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
        <div ref={formScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 custom-scrollbar">
          {/* STEP 1: Basic Identity */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-[#F1F5F9]">
                <h3 className="font-display font-bold text-sm text-[#0B1F3A] uppercase tracking-wider">
                  01 Basic Identity & Investor Category Inputs
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                    Investor Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as InvestorCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#0B1F3A] bg-white outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#0B1F3A] bg-white outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                  Full Name (as per PAN Card) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name exactly as matching PAN"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#0B1F3A] outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                  Father's / Spouse's Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fatherSpouseName}
                  onChange={(e) => setFatherSpouseName(e.target.value)}
                  placeholder="Father or spouse name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0B1F3A] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <DobInput
                    label="Date of Birth (DOB)"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="!py-2 !text-xs !font-semibold"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#D4AF37]/40 text-xs">
                    <span className="text-[#64748B]">Auto-Calculated Age:</span>{' '}
                    <strong className="text-[#0B1F3A]">{age} Years</strong>
                    {isSenior && (
                      <span className="ml-2 font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded text-[10px]">
                        👴 Senior Citizen (+1.00% Booster Active)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                  Investor Investment Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm font-bold text-[#64748B]">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={investmentDisplay}
                    onChange={(e) => handleInvestmentChange(e.target.value)}
                    placeholder="Enter investment amount (e.g. 10,00,000)"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[#CBD5E1] font-mono text-sm font-bold text-[#0B1F3A] outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
                {Number(investmentAmount) > 0 && (
                  <p className="text-[11px] text-[#8C6808] font-serif italic mt-1 pl-1">
                    Rupees {numberToWords(Number(investmentAmount))} Only
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Contact & Branch Mapping */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-[#F1F5F9]">
                <h3 className="font-display font-bold text-sm text-[#0B1F3A] uppercase tracking-wider">
                  02 Contact & Branch Mapping Inputs
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                    Primary Mobile Number (Indexed for Quick Search) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={primaryMobile}
                    onChange={(e) => setPrimaryMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] font-mono text-xs font-bold text-[#0B1F3A] outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                    Secondary Mobile (Optional)
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={secondaryMobile}
                    onChange={(e) => setSecondaryMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="Alternate phone number"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] font-mono text-xs font-medium text-[#0B1F3A] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                  Email ID (For e-Statements & Annual Form 16A)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="investor@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0B1F3A] outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1">Door / Flat No *</label>
                  <input
                    type="text"
                    value={doorNo}
                    onChange={(e) => setDoorNo(e.target.value)}
                    placeholder="e.g. 12-A"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs text-[#0B1F3A] outline-none"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] text-[#64748B] mb-1">Street / Area *</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Street name & landmark"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs text-[#0B1F3A] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1">Town / City *</label>
                  <input
                    type="text"
                    value={town}
                    onChange={(e) => setTown(e.target.value)}
                    placeholder="City"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs text-[#0B1F3A] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1">District *</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="District"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs text-[#0B1F3A] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1">State *</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs text-[#0B1F3A] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1">PIN Code *</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="6 digits"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] font-mono text-xs text-[#0B1F3A] outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                  Assigned Branch / Head Office Mapping Tag <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#0B1F3A] bg-white outline-none"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 3: Mandatory KYC & Tax Compliance */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-[#F1F5F9]">
                <h3 className="font-display font-bold text-sm text-[#0B1F3A] uppercase tracking-wider">
                  03 Mandatory KYC & Tax Compliance Inputs
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider">
                      PAN Card Number (10 Characters) <span className="text-red-500">*</span>
                    </label>
                    <span className={`text-[10px] font-mono ${pan.length === 10 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                      {pan.length}/10
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={10}
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                    placeholder="e.g. ABCPK1234D"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] font-mono text-sm font-bold text-[#0B1F3A] outline-none focus:border-[#D4AF37]"
                    required
                  />
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">
                    Aggregates annual interest across all FDs for TDS limits
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider">
                      Aadhaar Number (12 Digits) <span className="text-red-500">*</span>
                    </label>
                    <span className={`text-[10px] font-mono ${aadhaar.length === 12 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                      {aadhaar.length}/12
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={12}
                    inputMode="numeric"
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder="12-digit Aadhaar number"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] font-mono text-sm font-bold text-[#0B1F3A] outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                  Tax Exemption Declaration <span className="text-red-500">*</span>
                </label>
                <select
                  value={taxDeclaration}
                  onChange={(e) => setTaxDeclaration(e.target.value as TaxDeclaration)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#0B1F3A] bg-white outline-none"
                >
                  <option value="Standard TDS">Standard TDS Applicable (10% over Rs. 40k/50k threshold)</option>
                  <option value="15G">Form 15G (Below 60 Yrs - NIL TDS deduction locked)</option>
                  <option value="15H">Form 15H (Senior Citizen 60+ Yrs - NIL TDS deduction locked)</option>
                </select>
              </div>

              {/* Digital Document Vault Uploads */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
                <p className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                  Digital Document Vault Uploads (5 Documents)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {VAULT_DOCS.map((doc) => {
                    const isAttached = !!documents[doc.key];
                    const isUploading = uploadingDoc === doc.key;

                    return (
                      <div
                        key={doc.key}
                        className="p-2.5 bg-white rounded-xl border border-[#E2E8F0] flex items-center justify-between gap-2"
                      >
                        <span className="text-[#334155] font-medium text-[11px] truncate">{doc.name}</span>
                        <label
                          className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0 ${
                            isAttached
                              ? 'bg-emerald-50 text-[#059669] border-emerald-300 hover:bg-emerald-100'
                              : 'bg-[#FAF7F0] hover:bg-[#F3EAD3] text-[#8C6808] border-[#D4AF37]/40'
                          } ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, doc.key)}
                            disabled={isUploading}
                          />
                          {isUploading ? (
                            <>
                              <Loader2 size={10} className="animate-spin text-[#D4AF37]" />
                              <span>Uploading...</span>
                            </>
                          ) : isAttached ? (
                            <>
                              <CheckCircle size={10} className="text-[#059669]" />
                              <span>Attached</span>
                            </>
                          ) : (
                            <>
                              <Upload size={10} />
                              <span>Attach</span>
                            </>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Capital Investment & Interest Terms (New Column / Section before Payout Bank) */}
          {activeStep === 4 && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-[#F1F5F9] flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-sm text-[#0B1F3A] uppercase tracking-wider flex items-center gap-1.5">
                    <Coins size={16} className="text-[#D4AF37]" />
                    04 Capital Investment & Interest Terms
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Configure principal investment, manual annual interest rate & auto-calculated payout yields
                  </p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FAF7F0] text-[#8C6808] border border-[#D4AF37]/40">
                  <Calculator size={11} /> Auto Interest Engine Active
                </span>
              </div>

              {/* Investment Principal Amount */}
              <div className="p-4 rounded-2xl bg-[#FFFDF7] border border-[#D4AF37]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                    Investment Principal Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-mono font-bold text-[#8C6808]">
                    Min ₹10,000
                  </span>
                </div>

                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-base font-bold text-[#8C6808]">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={investmentDisplay}
                    onChange={(e) => handleInvestmentChange(e.target.value)}
                    placeholder="Enter investment amount (e.g. 10,00,000)"
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#CBD5E1] font-mono text-base font-bold text-[#0B1F3A] outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] bg-white shadow-inner"
                    required
                  />
                </div>

                {/* Quick Amount Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-[#64748B] font-bold uppercase mr-1">Quick Select:</span>
                  {[100000, 200000, 500000, 1000000, 2500000, 5000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickInvestment(amt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        Number(investmentAmount) === amt
                          ? 'bg-[#8C6808] text-white shadow-sm'
                          : 'bg-white hover:bg-[#FAF7F0] text-[#475569] border border-[#CBD5E1]'
                      }`}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>

                {principalNum > 0 && (
                  <p className="text-xs text-[#8C6808] font-serif italic pl-0.5">
                    Rupees {numberToWords(principalNum)} Only
                  </p>
                )}
              </div>

              {/* Rate of Interest (Manual Typing Option + Presets) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[#CBD5E1] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center gap-1">
                      <Percent size={13} className="text-[#059669]" />
                      Annual Interest Rate (% p.a.) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-[#059669] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Manual Input
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="0.05"
                      min="1"
                      max="36"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      placeholder="e.g. 12.00"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] font-mono text-base font-bold text-[#059669] outline-none focus:border-[#059669] bg-emerald-50/20"
                      required
                    />
                    <span className="absolute right-3.5 text-xs font-bold text-[#64748B]">% per annum</span>
                  </div>

                  {/* Preset Quick Rate Chips */}
                  <div className="flex items-center gap-1 flex-wrap pt-1">
                    <span className="text-[10px] text-[#64748B] font-semibold mr-1">Presets:</span>
                    {['9.00', '10.00', '11.00', '12.00', '13.50', '15.00'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setInterestRate(r)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                          interestRate === r
                            ? 'bg-[#059669] text-white'
                            : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155]'
                        }`}
                      >
                        {r}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tenure Selector */}
                <div className="p-4 rounded-2xl bg-white border border-[#CBD5E1] space-y-2.5">
                  <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={13} className="text-[#1E40AF]" />
                    Investment Tenure <span className="text-red-500">*</span>
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] text-[#64748B] mb-0.5 font-bold">Years</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={tenureYears}
                        onChange={(e) => {
                          const y = Number(e.target.value) || 0;
                          setTenureYears(y);
                          setTenureMonths(y * 12);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] font-mono text-xs font-bold text-[#0B1F3A] outline-none"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#64748B] mb-0.5 font-bold">Total Months</span>
                      <input
                        type="number"
                        min="1"
                        max="240"
                        value={tenureMonths}
                        onChange={(e) => {
                          const m = Number(e.target.value) || 0;
                          setTenureMonths(m);
                          setTenureYears(Math.max(1, Math.round(m / 12)));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] font-mono text-xs font-bold text-[#0B1F3A] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-[#64748B] font-semibold mr-1">Quick:</span>
                    {[
                      { y: 1, m: 12, label: '1 Year' },
                      { y: 2, m: 24, label: '2 Years' },
                      { y: 3, m: 36, label: '3 Years' },
                      { y: 5, m: 60, label: '5 Years' },
                    ].map((t) => (
                      <button
                        key={t.m}
                        type="button"
                        onClick={() => {
                          setTenureYears(t.y);
                          setTenureMonths(t.m);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                          tenureMonths === t.m
                            ? 'bg-[#1E40AF] text-white'
                            : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payout Frequency & Value Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wider">
                    Interest Payout Frequency <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'Monthly', label: 'Monthly', desc: 'Direct Bank NEFT' },
                      { id: 'Quarterly', label: 'Quarterly', desc: 'Every 3 Mos' },
                      { id: 'Cumulative', label: 'Cumulative', desc: 'At Maturity' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPayoutFrequency(item.id as any)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          payoutFrequency === item.id
                            ? 'border-[#D4AF37] bg-[#FAF7F0] shadow-sm'
                            : 'border-[#CBD5E1] bg-white hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <div className="font-bold text-xs text-[#0B1F3A]">{item.label}</div>
                        <div className="text-[9px] text-[#64748B] mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wider">
                    Investment Value Date (Start Date) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={investmentDate}
                    onChange={(e) => setInvestmentDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#0B1F3A] outline-none"
                    required
                  />
                  {calculatedMaturityDate && (
                    <span className="text-[10px] text-[#64748B] mt-1 block">
                      Maturity Date: <strong className="font-mono text-[#0B1F3A]">{new Date(calculatedMaturityDate).toLocaleDateString('en-IN')}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Automatic Live Interest Calculation Box (Like FD) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0B1F3A] to-[#1E3A8A] text-white shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#D4AF37]" />
                    <span className="font-display font-bold text-xs uppercase tracking-wider text-white">
                      Live Interest & Return Yield Calculation (Auto Engine)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#D4AF37]">
                    {rateNum.toFixed(2)}% p.a. • {effectiveMonths} Mos
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-white/70 block uppercase">Principal</span>
                    <strong className="text-sm sm:text-base font-mono text-white block mt-0.5">
                      ₹{principalNum.toLocaleString('en-IN')}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-[#93C5FD] block uppercase">Monthly Interest</span>
                    <strong className="text-sm sm:text-base font-mono text-[#60A5FA] block mt-0.5">
                      {payoutFrequency === 'Cumulative' ? 'N.A. (Compounded)' : `₹${monthlyInterestCalc.toLocaleString('en-IN')}`}
                    </strong>
                    <span className="text-[9px] text-white/60">/ Month</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-[#86EFAC] block uppercase">Total Interest Yield</span>
                    <strong className="text-sm sm:text-base font-mono text-[#4ADE80] block mt-0.5">
                      ₹{totalInterestCalc.toLocaleString('en-IN')}
                    </strong>
                    <span className="text-[9px] text-white/60">Over {effectiveYears} Year(s)</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40">
                    <span className="text-[10px] text-[#FDE68A] block uppercase font-bold">Total Maturity Return</span>
                    <strong className="text-sm sm:text-base font-mono text-[#FCD34D] block mt-0.5">
                      ₹{maturityValueCalc.toLocaleString('en-IN')}
                    </strong>
                    <span className="text-[9px] text-white/70">Principal + Returns</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Payout Bank Account Inputs */}
          {activeStep === 5 && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-[#F1F5F9]">
                <h3 className="font-display font-bold text-sm text-[#0B1F3A] uppercase tracking-wider">
                  05 Investor Payout Bank Account Inputs
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Verified against Investor Name for monthly interest & maturity RTGS/NEFT transfers
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                    Account Holder Name (Verified vs PAN) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bankHolderName || fullName}
                    onChange={(e) => setBankHolderName(e.target.value)}
                    placeholder="Full name on bank account"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#0B1F3A] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                    Bank Name & Branch <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. State Bank of India, Anna Nagar"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0B1F3A] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                    Bank Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter account number"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] font-mono text-xs font-bold text-[#0B1F3A] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                    Confirm Account Number (Double-Entry) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountNumberConfirm}
                    onChange={(e) => setAccountNumberConfirm(e.target.value.replace(/\D/g, ''))}
                    placeholder="Re-enter account number"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] font-mono text-xs font-bold text-[#0B1F3A] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                    IFSC Code (11 Chars) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] font-mono text-xs font-bold text-[#0B1F3A] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                    Account Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0B1F3A] bg-white outline-none"
                  >
                    <option value="Savings">Savings Account</option>
                    <option value="Current">Current Account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1 uppercase tracking-wider">
                    Preferred Payout Mode <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={payoutMode}
                    onChange={(e) => setPayoutMode(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0B1F3A] bg-white outline-none"
                  >
                    <option value="NEFT">NEFT (Direct Bank Transfer)</option>
                    <option value="RTGS">RTGS (High Value ₹2L+)</option>
                    <option value="IMPS">IMPS (Instant 24x7)</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pinned Footer Navigation */}
        <div className="px-5 sm:px-6 py-3.5 bg-white border-t border-[#E2E8F0] shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 z-10">
          <div>
            {activeStep > 1 && (
              <button
                type="button"
                onClick={() => setActiveStep((s) => (Math.max(s - 1, 1)) as any)}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[40px] rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] touch-manipulation select-none"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 min-h-[40px] rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9] transition-colors cursor-pointer flex items-center justify-center active:scale-[0.98] touch-manipulation select-none"
            >
              Cancel
            </button>

            {activeStep < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 sm:flex-none px-5 py-2.5 min-h-[40px] rounded-xl bg-[#0B1F3A] hover:bg-[#1E3A8A] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-[0.98] touch-manipulation select-none"
              >
                Next Step <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-none px-6 py-2.5 min-h-[40px] rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] text-white text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-[0.98] touch-manipulation select-none"
              >
                {loading ? 'Creating Profile...' : '✓ Complete Registration'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
