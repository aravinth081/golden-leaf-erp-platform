// ──────────────────────────────────────────────────
// Golden Leaf Finance — Business Loan Application Modal
// Neat 4-Box Layout • 5-Doc Checklist • Fast Repeat Customer Autofill
// ──────────────────────────────────────────────────

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, Sparkles, Building, User, Store, Calculator,
  Upload, Camera, ShieldCheck, AlertCircle, FileText,
  DollarSign, MapPin, Search, Loader2, CheckCircle2, Cloud
} from 'lucide-react';
import { uploadImage } from '../../../../services/cloudinary';
import {
  businessLoanService,
  REPEAT_BUSINESS_CUSTOMERS,
} from '../../../../services/businessLoanService';
import {
  type BusinessLoanRecord,
  type BusinessLoanCategory,
  type BusinessPremisesType,
  type BusinessRepaymentFrequency,
} from '../../../../types/businessLoan.types';
import { useUIStore, useAuthStore } from '../../../../store';
import { DobInput } from '../../../../components/ui';
import { calculateAge, parseDobToDate } from '../../../../utils/dateUtils';

interface BusinessLoanApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLoan: BusinessLoanRecord) => void;
}

export const BusinessLoanApplicationModal: React.FC<BusinessLoanApplicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useUIStore();
  const currentUser = useAuthStore((s) => s.user);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [fatherOrSpouseName, setFatherOrSpouseName] = useState('');
  const [dob, setDob] = useState('1990-05-15');
  const [age, setAge] = useState<number>(() => calculateAge('1990-05-15') || 34);

  // Auto-calculate Age whenever DOB updates
  useEffect(() => {
    if (dob) {
      const computed = calculateAge(dob);
      if (computed > 0 && computed < 120 && computed !== age) {
        setAge(computed);
      }
    }
  }, [dob]);

  const handleDobChange = (newDob: string) => {
    setDob(newDob);
    const computed = calculateAge(newDob);
    if (computed > 0 && computed < 120) {
      setAge(computed);
    }
  };

  const handleAgeChange = (newAge: number) => {
    setAge(newAge);
    if (newAge >= 18 && newAge <= 100) {
      const birthYear = new Date().getFullYear() - newAge;
      const parsed = parseDobToDate(dob);
      if (parsed) {
        const d = String(parsed.getDate()).padStart(2, '0');
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        setDob(`${d}-${m}-${birthYear}`);
      } else {
        setDob(`01-01-${birthYear}`);
      }
    }
  };
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [primaryMobile, setPrimaryMobile] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [residentialAddress, setResidentialAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');

  // Co-Applicant
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorRelation, setGuarantorRelation] = useState<'Spouse' | 'Father' | 'Mother' | 'Brother' | 'Partner' | 'Other'>('Spouse');
  const [guarantorMobile, setGuarantorMobile] = useState('');
  const [guarantorAadhaar, setGuarantorAadhaar] = useState('');
  const [guarantorPan, setGuarantorPan] = useState('');

  // Business Profile
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState<BusinessLoanCategory>('Retail / Kirana Shop');
  const [premisesType, setPremisesType] = useState<BusinessPremisesType>('Owned Shop');
  const [monthlyRent, setMonthlyRent] = useState<number>(0);
  const [businessVintage, setBusinessVintage] = useState<number>(5);
  const [shopAddress, setShopAddress] = useState('');
  const [gpsTag, setGpsTag] = useState('12.9716° N, 80.2435° E');
  const [dailySales, setDailySales] = useState<number>(20000);
  const [monthlyTurnover, setMonthlyTurnover] = useState<number>(500000);
  const [netMonthlyIncome, setNetMonthlyIncome] = useState<number>(65000);
  const [hasExistingLoan, setHasExistingLoan] = useState(false);
  const [existingMonthlyEmi, setExistingMonthlyEmi] = useState<number>(0);

  // Loan Terms
  const [requestedAmount, setRequestedAmount] = useState<number | ''>(25000);
  const [collectionFrequency, setCollectionFrequency] = useState<BusinessRepaymentFrequency>('Daily');
  const [tenureUnits, setTenureUnits] = useState<number>(100);
  const [interestRate, setInterestRate] = useState<number | ''>(24);
  const [interestType, setInterestType] = useState<'FLAT' | 'REDUCING'>('FLAT');
  const [processingFeePercent, setProcessingFeePercent] = useState<number>(2.0); // 2%
  const [docCharges, setDocCharges] = useState<number>(1000);
  const [insuranceCharges, setInsuranceCharges] = useState<number>(800);

  // Bank Account
  const [bankName, setBankName] = useState('State Bank of India');
  const [accountNo, setAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('SBIN0001245');

  // Document Uploads Status & Cloudinary URLs
  const [docUrls, setDocUrls] = useState<{
    doc1: string; // Applicant & Guarantor Photos
    doc2: string; // Personal KYC Proofs (Aadhaar & PAN)
    doc3: string; // Mandatory Live Shop Photo with Owner & Nameboard
    doc4: string; // Business Proof (MSME/GST/License)
    doc5: string; // Banking Proof
  }>({
    doc1: '',
    doc2: '',
    doc3: '',
    doc4: '',
    doc5: '',
  });

  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const fileInputDoc1 = useRef<HTMLInputElement>(null);
  const fileInputDoc2 = useRef<HTMLInputElement>(null);
  const fileInputDoc3 = useRef<HTMLInputElement>(null);
  const fileInputDoc4 = useRef<HTMLInputElement>(null);
  const fileInputDoc5 = useRef<HTMLInputElement>(null);

  const handleDocUpload = async (docKey: 'doc1' | 'doc2' | 'doc3' | 'doc4' | 'doc5', file: File) => {
    if (!file) return;
    setUploadingDoc(docKey);
    try {
      const res = await uploadImage(file, 'business_loans/kyc');
      if (res?.secure_url) {
        setDocUrls((prev) => ({ ...prev, [docKey]: res.secure_url }));
        addToast({
          type: 'success',
          title: 'Uploaded to Cloudinary',
          message: 'Document uploaded to Cloudinary and secured successfully.',
        });
      }
    } catch (err: any) {
      console.warn('Document Cloudinary upload error:', err);
      // Fallback: Read as data URL for offline preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setDocUrls((prev) => ({ ...prev, [docKey]: e.target!.result as string }));
        }
      };
      reader.readAsDataURL(file);
      addToast({
        type: 'info',
        title: 'Document Saved Locally',
        message: 'Document saved in active session.',
      });
    } finally {
      setUploadingDoc(null);
    }
  };

  // Calculations
  const calculations = useMemo(() => {
    const principal = typeof requestedAmount === 'number' ? requestedAmount : (parseFloat(String(requestedAmount)) || 0);
    const rate = typeof interestRate === 'number' ? interestRate : (parseFloat(String(interestRate)) || 0);
    const procFee = Math.round((principal * processingFeePercent) / 100);
    const totalDeductions = procFee + docCharges + insuranceCharges;
    const netDisbursal = Math.max(0, principal - totalDeductions);

    let totalInterest = 0;
    let totalRepayable = 0;
    let exactEmi = 0;

    if (interestType === 'FLAT') {
      let tenureFractionOfYear = 0;
      if (collectionFrequency === 'Daily') tenureFractionOfYear = tenureUnits / 365;
      else if (collectionFrequency === 'Weekly') tenureFractionOfYear = tenureUnits / 52;
      else tenureFractionOfYear = tenureUnits / 12;

      totalInterest = Math.round(principal * (rate / 100) * tenureFractionOfYear);
      totalRepayable = principal + totalInterest;
      exactEmi = tenureUnits > 0 ? Math.ceil(totalRepayable / tenureUnits) : 0;
    } else {
      // Reducing Balance approximation
      const r = rate / 12 / 100;
      const n = collectionFrequency === 'Monthly' ? tenureUnits : Math.ceil(tenureUnits / 30);
      if (r > 0 && n > 0) {
        exactEmi = Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
      } else {
        exactEmi = n > 0 ? Math.round(principal / n) : 0;
      }
      totalRepayable = exactEmi * n;
      totalInterest = Math.max(0, totalRepayable - principal);
    }

    return {
      procFee,
      totalDeductions,
      netDisbursal,
      totalInterest,
      totalRepayable,
      exactEmi,
    };
  }, [
    requestedAmount,
    processingFeePercent,
    docCharges,
    insuranceCharges,
    interestRate,
    interestType,
    collectionFrequency,
    tenureUnits,
  ]);

  // Convert number to words helper
  const amountInWords = useMemo(() => {
    const num = typeof requestedAmount === 'number' ? requestedAmount : (parseFloat(String(requestedAmount)) || 0);
    if (num >= 100000) {
      const lakhs = num / 100000;
      return `${lakhs.toLocaleString('en-IN')} Lakh Rupees`;
    }
    if (num > 0) {
      return `${(num / 1000).toLocaleString('en-IN')} Thousand Rupees`;
    }
    return '₹0';
  }, [requestedAmount]);

  // Fast Auto-Fill for Repeat Customer
  const handleAutofillCustomer = (customer: typeof REPEAT_BUSINESS_CUSTOMERS[0]) => {
    setCustomerName(customer.customerName);
    setFatherOrSpouseName(customer.fatherOrSpouseName);
    setDob(customer.dob);
    setAge(customer.age);
    setGender(customer.gender);
    setPrimaryMobile(customer.primaryMobile);
    setAlternateMobile(customer.alternateMobile || '');
    setResidentialAddress(customer.residentialAddress);
    setPinCode(customer.pinCode);
    setAadhaarNumber(customer.aadhaarNumber);
    setPanNumber(customer.panNumber);

    setGuarantorName(customer.coApplicant.fullName);
    setGuarantorRelation(customer.coApplicant.relationship);
    setGuarantorMobile(customer.coApplicant.mobileNo);
    setGuarantorAadhaar(customer.coApplicant.aadhaarNo);
    setGuarantorPan(customer.coApplicant.panNo);

    setBusinessName(customer.businessName);
    setBusinessCategory(customer.businessCategory);
    setPremisesType(customer.premisesType);
    setMonthlyRent(customer.monthlyRentAmount || 0);
    setBusinessVintage(customer.businessVintageYears);
    setShopAddress(customer.shopAddress);
    setGpsTag(customer.gpsLocationTag || '12.9716° N, 80.2435° E');
    setDailySales(customer.estimatedDailySales);
    setMonthlyTurnover(customer.estimatedMonthlyTurnover);
    setNetMonthlyIncome(customer.netMonthlyBusinessIncome);
    setHasExistingLoan(customer.hasExistingLoanObligations);

    setBankName(customer.customerBankName);
    setAccountNo(customer.customerBankAccountNo);
    setIfscCode(customer.customerBankIfsc);

    addToast({
      type: 'success',
      title: 'Repeat Customer Profile Loaded',
      message: `Populated Box 1 & Box 2 for ${customer.customerName} (${customer.businessName}).`,
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !primaryMobile || !businessName || !shopAddress) {
      addToast({
        type: 'error',
        title: 'Mandatory Fields Missing',
        message: 'Please fill Borrower Name, Mobile, Business Name, and Shop Address.',
      });
      return;
    }

    if (primaryMobile && primaryMobile.length !== 10) {
      addToast({
        type: 'error',
        title: 'Invalid Mobile Number',
        message: 'Primary Mobile number must be exactly 10 digits.',
      });
      return;
    }

    if (aadhaarNumber && aadhaarNumber.length !== 12) {
      addToast({
        type: 'error',
        title: 'Invalid Aadhaar Number',
        message: 'Aadhaar Number must be exactly 12 digits.',
      });
      return;
    }

    if (panNumber && panNumber.length !== 10) {
      addToast({
        type: 'error',
        title: 'Invalid PAN Number',
        message: 'PAN Card Number must be exactly 10 alphanumeric characters (e.g. ABCDE1234F).',
      });
      return;
    }

    if (age < 21 || age > 60) {
      addToast({
        type: 'error',
        title: 'Age Eligibility Rule Violation',
        message: 'Borrower age must be between 21 and 60 years.',
      });
      return;
    }

    const startDate = new Date().toISOString().slice(0, 10);
    const endDate = new Date(Date.now() + tenureUnits * (collectionFrequency === 'Daily' ? 86400000 : collectionFrequency === 'Weekly' ? 7 * 86400000 : 30 * 86400000)).toISOString().slice(0, 10);

    const newLoan = businessLoanService.createApplication({
      branchId: currentUser?.customClaims?.branchId || 'BR-01',
      branchName: currentUser?.customClaims?.branchName || 'Main Branch',
      customerName,
      fatherOrSpouseName,
      dob,
      age,
      gender,
      primaryMobile,
      alternateMobile,
      residentialAddress,
      pinCode,
      aadhaarNumber,
      panNumber,
      coApplicant: {
        fullName: guarantorName || 'Co-Applicant',
        relationship: guarantorRelation,
        mobileNo: guarantorMobile || primaryMobile,
        aadhaarNo: guarantorAadhaar || 'XXXX-XXXX-0000',
        panNo: guarantorPan || 'XXXXX0000X',
      },

      businessName,
      businessCategory,
      premisesType,
      monthlyRentAmount: premisesType === 'Rented Shop' ? monthlyRent : undefined,
      businessVintageYears: businessVintage,
      shopAddress,
      gpsLocationTag: gpsTag,
      estimatedDailySales: dailySales,
      estimatedMonthlyTurnover: monthlyTurnover,
      netMonthlyBusinessIncome: netMonthlyIncome,
      hasExistingLoanObligations: hasExistingLoan,
      existingMonthlyEmiAmount: hasExistingLoan ? existingMonthlyEmi : undefined,
      isRepeatCustomer: !!businessLoanService.findRepeatCustomerByMobile(primaryMobile),

      requestedAmount: typeof requestedAmount === 'number' ? requestedAmount : (parseFloat(String(requestedAmount)) || 10000),
      sanctionedAmount: typeof requestedAmount === 'number' ? requestedAmount : (parseFloat(String(requestedAmount)) || 10000),
      collectionFrequency,
      tenureUnits,
      interestRateAnnual: typeof interestRate === 'number' ? interestRate : (parseFloat(String(interestRate)) || 24),
      interestType,
      processingFeeAmount: calculations.procFee,
      documentChargesAmount: docCharges,
      insuranceChargesAmount: insuranceCharges,
      totalUpfrontDeductions: calculations.totalDeductions,
      netDisbursementAmount: calculations.netDisbursal,
      exactEmiPerPeriod: calculations.exactEmi,
      totalInterestPayable: calculations.totalInterest,
      totalRepayableAmount: calculations.totalRepayable,
      installmentStartDate: startDate,
      installmentEndDate: endDate,

      customerBankName: bankName,
      customerBankAccountNo: accountNo || '000012345678',
      customerBankIfsc: ifscCode,

      documents: {
        applicantAndGuarantorPhotos: {
          id: 'DOC-1',
          title: 'Applicant & Guarantor Photos',
          description: 'Live facial photo captured at shop counter',
          fileUrl: docUrls.doc1 || undefined,
          status: docUrls.doc1 ? 'VERIFIED' : 'PENDING',
          uploadedAt: docUrls.doc1 ? new Date().toISOString() : undefined,
        },
        personalKycProofs: {
          id: 'DOC-2',
          title: 'Personal KYC Proofs (Aadhaar & PAN)',
          description: 'Aadhaar & PAN Card scans',
          fileUrl: docUrls.doc2 || undefined,
          status: docUrls.doc2 ? 'VERIFIED' : 'PENDING',
          uploadedAt: docUrls.doc2 ? new Date().toISOString() : undefined,
        },
        liveShopPhoto: {
          id: 'DOC-3',
          title: 'Mandatory Live Shop Photo with Owner & Nameboard',
          description: 'Owner standing at shop entrance with legible nameboard',
          fileUrl: docUrls.doc3 || undefined,
          status: docUrls.doc3 ? 'VERIFIED' : 'PENDING',
          uploadedAt: docUrls.doc3 ? new Date().toISOString() : undefined,
        },
        businessProof: {
          id: 'DOC-4',
          title: 'Business Proof (MSME/GST/License)',
          description: 'Udyam Registration / GST / Trade License / Rental Deed',
          fileUrl: docUrls.doc4 || undefined,
          status: docUrls.doc4 ? 'VERIFIED' : 'PENDING',
          uploadedAt: docUrls.doc4 ? new Date().toISOString() : undefined,
        },
        bankingProof: {
          id: 'DOC-5',
          title: 'Banking Proof (Passbook / Statement)',
          description: 'Last 6 months Bank Statement / Passbook Front Page',
          fileUrl: docUrls.doc5 || undefined,
          status: docUrls.doc5 ? 'VERIFIED' : 'PENDING',
          uploadedAt: docUrls.doc5 ? new Date().toISOString() : undefined,
        },
      },

      originatingCroId: currentUser?.employeeId || 'GLF-CRO-101',
      originatingCroName: currentUser?.displayName || 'Customer Relationship Officer',
    });

    addToast({
      type: 'success',
      title: 'Business Loan Application Submitted',
      message: `Application ${newLoan.id} forwarded to Credit Manager KYC verification queue.`,
    });

    onSuccess(newLoan);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative bg-gray-50 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col font-body"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-[#0B1F3A] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-white/10 text-[#D4AF37]">
                <Store size={20} />
              </span>
              <div>
                <h2 className="text-base font-extrabold tracking-tight">
                  New Business Loan Application (4-Box Form)
                </h2>
                <p className="text-xs text-gray-300">
                  CRO Field Origination • Live Geotag • 5-Document Checklist
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Repeat Customer Autofill Strip */}
          <div className="px-6 py-3 bg-amber-50/90 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold">
              <Sparkles size={14} className="text-[#D4AF37]" />
              <span>Fast Auto-Fill for Repeat Customers:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {REPEAT_BUSINESS_CUSTOMERS.map((c) => (
                <button
                  key={c.primaryMobile}
                  type="button"
                  onClick={() => handleAutofillCustomer(c)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100/70 text-[#0B1F3A] font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <span>{c.customerName.split(' ')[0]}</span>
                  <span className="text-[10px] text-gray-500 font-mono">({c.primaryMobile.slice(-4)})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Body: Neat 4-Box Layout */}
          <form onSubmit={handleCreate} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 grow text-xs custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* ─── BOX 1: APPLICANT & CO-APPLICANT DETAILS ─── */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="font-extrabold text-[#0B1F3A] uppercase tracking-wider text-xs flex items-center gap-2">
                    <User size={15} className="text-[#D4AF37]" />
                    Box 1: Applicant & Co-Applicant
                  </h3>
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-bold">
                    Age 21–60
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Customer Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="As per PAN / Aadhaar"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium focus:bg-white focus:border-[#0B1F3A] outline-none"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Father's / Spouse Name</label>
                    <input
                      type="text"
                      placeholder="Father / Spouse Name"
                      value={fatherOrSpouseName}
                      onChange={(e) => setFatherOrSpouseName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium focus:bg-white focus:border-[#0B1F3A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">DOB & Age (21-60)</label>
                    <div className="flex gap-1.5">
                      <DobInput
                        value={dob}
                        onChange={(e) => handleDobChange(e.target.value)}
                        onAgeCalculated={(newAge) => {
                          if (newAge > 0 && newAge < 120) setAge(newAge);
                        }}
                        containerClassName="w-2/3 !gap-0"
                        className="!px-2 !py-1.5 !bg-gray-50 !border-gray-200 !rounded-lg !font-medium !text-[11px]"
                        placeholder="DD-MM-YYYY"
                      />
                      <input
                        type="number"
                        min="18"
                        max="100"
                        value={age || ''}
                        onChange={(e) => handleAgeChange(parseInt(e.target.value) || 0)}
                        className="w-1/3 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-center"
                        title="Applicant Age (Auto-calculated from DOB or editable)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">Primary Mobile (10 Digits) *</label>
                      <span className={`text-[10px] font-mono ${primaryMobile.length === 10 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                        {primaryMobile.length}/10
                      </span>
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      inputMode="numeric"
                      placeholder="10-digit mobile"
                      value={primaryMobile}
                      onChange={(e) => setPrimaryMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-bold font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">Alternate Mobile</label>
                      <span className={`text-[10px] font-mono ${alternateMobile.length === 10 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                        {alternateMobile.length}/10
                      </span>
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      inputMode="numeric"
                      placeholder="Alternate mobile"
                      value={alternateMobile}
                      onChange={(e) => setAlternateMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">Aadhaar No (12 Digits) *</label>
                      <span className={`text-[10px] font-mono ${aadhaarNumber.length === 12 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                        {aadhaarNumber.length}/12
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      inputMode="numeric"
                      placeholder="12-digit Aadhaar UID"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">PAN Card No (10 Chars)</label>
                      <span className={`text-[10px] font-mono ${panNumber.length === 10 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                        {panNumber.length}/10
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="ABCDE1234F"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-mono font-bold uppercase"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Full Residential Address & PIN Code</label>
                    <input
                      type="text"
                      placeholder="Door No, Street, Village, PIN Code"
                      value={residentialAddress}
                      onChange={(e) => setResidentialAddress(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium"
                    />
                  </div>
                </div>

                {/* Co-Applicant Subsection */}
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">
                    Co-Applicant / Guarantor Details
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Guarantor Full Name"
                        value={guarantorName}
                        onChange={(e) => setGuarantorName(e.target.value)}
                        className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium"
                      />
                    </div>
                    <div>
                      <select
                        value={guarantorRelation}
                        onChange={(e) => setGuarantorRelation(e.target.value as any)}
                        className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium"
                      >
                        <option value="Spouse">Spouse</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Brother">Brother</option>
                        <option value="Partner">Partner</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="tel"
                        maxLength={10}
                        inputMode="numeric"
                        placeholder="Guarantor Mobile (10 Digits)"
                        value={guarantorMobile}
                        onChange={(e) => setGuarantorMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        maxLength={12}
                        placeholder="Guarantor Aadhaar (12 Digits) / PAN"
                        value={guarantorAadhaar}
                        onChange={(e) => setGuarantorAadhaar(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12))}
                        className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── BOX 2: SIMPLE BUSINESS / SHOP PROFILE ─── */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="font-extrabold text-[#0B1F3A] uppercase tracking-wider text-xs flex items-center gap-2">
                    <Store size={15} className="text-[#D4AF37]" />
                    Box 2: Business & Shop Profile
                  </h3>
                  <span className="text-[10px] font-mono text-gray-500 font-bold">
                    GPS Geotagged
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                      Business / Shop Name (As on Nameboard) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sri Murugan Provisions & General Merchant"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-[#0B1F3A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Business Category</label>
                    <select
                      value={businessCategory}
                      onChange={(e) => setBusinessCategory(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium"
                    >
                      <option value="Retail / Kirana Shop">Retail / Kirana Shop</option>
                      <option value="Wholesale Trader">Wholesale Trader</option>
                      <option value="Textiles & Garments">Textiles & Garments</option>
                      <option value="Hotel / Bakery / Food">Hotel / Bakery / Food</option>
                      <option value="Service & Repair Workshop">Service & Repair Workshop</option>
                      <option value="Small Manufacturing">Small Manufacturing</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Premises Type</label>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          checked={premisesType === 'Owned Shop'}
                          onChange={() => setPremisesType('Owned Shop')}
                        />
                        <span>Owned</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          checked={premisesType === 'Rented Shop'}
                          onChange={() => setPremisesType('Rented Shop')}
                        />
                        <span>Rented</span>
                      </label>
                    </div>
                  </div>

                  {premisesType === 'Rented Shop' && (
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Monthly Shop Rent (₹)</label>
                      <input
                        type="number"
                        value={monthlyRent}
                        onChange={(e) => setMonthlyRent(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium"
                      />
                    </div>
                  )}

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Full Shop Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="Shop door no, street, landmark, area"
                      value={shopAddress}
                      onChange={(e) => setShopAddress(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Business Vintage (Years)</label>
                    <input
                      type="number"
                      min="1"
                      value={businessVintage}
                      onChange={(e) => setBusinessVintage(parseInt(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">GPS Location Tag</label>
                    <input
                      type="text"
                      value={gpsTag}
                      onChange={(e) => setGpsTag(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Estimated Daily Sales (₹)</label>
                    <input
                      type="number"
                      value={dailySales}
                      onChange={(e) => setDailySales(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Net Monthly Income (₹)</label>
                    <input
                      type="number"
                      value={netMonthlyIncome}
                      onChange={(e) => setNetMonthlyIncome(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-[#0B1F3A]"
                    />
                  </div>
                </div>
              </div>

              {/* ─── BOX 3: LOAN TERMS & AUTO-EMI CALCULATOR ─── */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="font-extrabold text-[#0B1F3A] uppercase tracking-wider text-xs flex items-center gap-2">
                    <Calculator size={15} className="text-[#D4AF37]" />
                    Box 3: Loan Terms & Auto-Calculator
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {amountInWords}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">
                        Requested Loan Principal (₹10,000 to ₹5,00,000) *
                      </label>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Min ₹10k for Small Shops
                      </span>
                    </div>
                    <input
                      type="number"
                      min="10000"
                      max="500000"
                      step="1000"
                      placeholder="e.g. 25000"
                      value={requestedAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRequestedAmount(val === '' ? '' : parseFloat(val) || 0);
                      }}
                      onBlur={() => {
                        if (requestedAmount === '' || Number(requestedAmount) < 10000) {
                          setRequestedAmount(Math.max(10000, Number(requestedAmount) || 10000));
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-black text-emerald-900 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />

                    {/* Quick Select Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Quick Select:</span>
                      {[10000, 15000, 20000, 25000, 50000, 75000, 100000, 200000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setRequestedAmount(amt)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            Number(requestedAmount) === amt
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                          }`}
                        >
                          ₹{amt >= 100000 ? `${amt / 100000}L` : `${amt / 1000}k`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Collection Frequency</label>
                    <div className="flex gap-1.5">
                      {(['Daily', 'Weekly', 'Monthly'] as BusinessRepaymentFrequency[]).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setCollectionFrequency(mode);
                            if (mode === 'Daily') setTenureUnits(100);
                            else if (mode === 'Weekly') setTenureUnits(25);
                            else setTenureUnits(12);
                          }}
                          className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                            collectionFrequency === mode
                              ? 'bg-[#0B1F3A] text-white shadow-xs'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                      Tenure ({collectionFrequency === 'Daily' ? 'Days' : collectionFrequency === 'Weekly' ? 'Weeks' : 'Months'})
                    </label>
                    <input
                      type="number"
                      value={tenureUnits}
                      onChange={(e) => setTenureUnits(parseInt(e.target.value) || 10)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Interest Rate (% p.a.)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      placeholder="e.g. 24"
                      value={interestRate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInterestRate(val === '' ? '' : parseFloat(val) || 0);
                      }}
                      onBlur={() => {
                        if (interestRate === '' || isNaN(Number(interestRate))) {
                          setInterestRate(24);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-blue-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Upfront Deductions (Fee + Doc + Ins)</label>
                    <div className="px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-lg text-red-800 font-bold font-mono">
                      ₹{calculations.totalDeductions.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Auto-Calculated Output Box */}
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-950 uppercase text-[10px]">Net Disbursement Payable:</span>
                    <strong className="text-emerald-900 font-black text-sm font-mono">
                      ₹{calculations.netDisbursal.toLocaleString('en-IN')}.00
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-600">
                      Exact Installment ({collectionFrequency}):
                    </span>
                    <strong className="text-[#0B1F3A] font-bold font-mono text-sm">
                      ₹{calculations.exactEmi.toLocaleString('en-IN')}.00 / {collectionFrequency === 'Daily' ? 'Day' : collectionFrequency === 'Weekly' ? 'Wk' : 'Mo'}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-600">
                    <span>Total Repayable: ₹{calculations.totalRepayable.toLocaleString('en-IN')}</span>
                    <span>Total Interest: ₹{calculations.totalInterest.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Bank Info */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                  <input
                    type="text"
                    placeholder="Customer Bank Name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Bank Account Number"
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                    className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* ─── BOX 4: CLEAN 5-DOC CHECKLIST & CLOUDINARY UPLOADS ─── */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="font-extrabold text-[#0B1F3A] uppercase tracking-wider text-xs flex items-center gap-2">
                    <Upload size={15} className="text-[#D4AF37]" />
                    Box 4: Clean 5-Document Checklist
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    Object.values(docUrls).filter(Boolean).length === 5
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-amber-700 bg-amber-50'
                  }`}>
                    {Object.values(docUrls).filter(Boolean).length}/5 Uploaded
                  </span>
                </div>

                <div className="space-y-2 text-[11px]">
                  {/* Hidden inputs */}
                  <input
                    type="file"
                    ref={fileInputDoc1}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleDocUpload('doc1', f);
                    }}
                  />
                  <input
                    type="file"
                    ref={fileInputDoc2}
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleDocUpload('doc2', f);
                    }}
                  />
                  <input
                    type="file"
                    ref={fileInputDoc3}
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleDocUpload('doc3', f);
                    }}
                  />
                  <input
                    type="file"
                    ref={fileInputDoc4}
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleDocUpload('doc4', f);
                    }}
                  />
                  <input
                    type="file"
                    ref={fileInputDoc5}
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleDocUpload('doc5', f);
                    }}
                  />

                  {/* Doc 1 */}
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {docUrls.doc1 ? (
                        <img src={docUrls.doc1} alt="Doc 1" className="w-10 h-10 object-cover rounded-lg border border-emerald-300" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                          <User size={18} />
                        </div>
                      )}
                      <div>
                        <strong className="block text-gray-900">1) Applicant & Guarantor Passport Photos</strong>
                        <span className="text-[10px] text-gray-500">Live facial photo captured at shop counter</span>
                      </div>
                    </div>
                    <div>
                      {uploadingDoc === 'doc1' ? (
                        <span className="px-2 py-1 rounded bg-amber-50 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                          <Loader2 size={12} className="animate-spin" /> Uploading...
                        </span>
                      ) : docUrls.doc1 ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 size={11} /> Cloudinary
                          </span>
                          <button
                            type="button"
                            onClick={() => fileInputDoc1.current?.click()}
                            className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputDoc1.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-[#0B1F3A] hover:bg-[#132c4e] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Upload size={11} /> Upload Photo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Doc 2 */}
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {docUrls.doc2 ? (
                        <img src={docUrls.doc2} alt="Doc 2" className="w-10 h-10 object-cover rounded-lg border border-emerald-300" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                          <FileText size={18} />
                        </div>
                      )}
                      <div>
                        <strong className="block text-gray-900">2) Personal KYC Proofs</strong>
                        <span className="text-[10px] text-gray-500">Aadhaar & PAN Card (Front & Back scans)</span>
                      </div>
                    </div>
                    <div>
                      {uploadingDoc === 'doc2' ? (
                        <span className="px-2 py-1 rounded bg-amber-50 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                          <Loader2 size={12} className="animate-spin" /> Uploading...
                        </span>
                      ) : docUrls.doc2 ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 size={11} /> Cloudinary
                          </span>
                          <button
                            type="button"
                            onClick={() => fileInputDoc2.current?.click()}
                            className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputDoc2.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-[#0B1F3A] hover:bg-[#132c4e] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Upload size={11} /> Upload KYC
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Doc 3 - Mandatory Live Shop Photo */}
                  <div className={`p-2.5 rounded-xl border-2 transition-all flex items-center justify-between gap-2 ${
                    docUrls.doc3 ? 'border-emerald-500 bg-emerald-50/40' : 'border-amber-400 bg-amber-50/30'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {docUrls.doc3 ? (
                        <img src={docUrls.doc3} alt="Shop Front" className="w-10 h-10 object-cover rounded-lg border-2 border-emerald-500" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                          <Camera size={18} />
                        </div>
                      )}
                      <div>
                        <strong className="block text-[#0B1F3A] font-bold">
                          3) Mandatory Live Shop Photo with Owner & Nameboard
                        </strong>
                        <span className="text-[10px] text-gray-500">
                          Owner standing at shop entrance with legible nameboard
                        </span>
                      </div>
                    </div>
                    <div>
                      {uploadingDoc === 'doc3' ? (
                        <span className="px-2 py-1 rounded bg-amber-50 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                          <Loader2 size={12} className="animate-spin" /> Uploading...
                        </span>
                      ) : docUrls.doc3 ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-1 rounded-lg bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 size={11} /> Live Captured
                          </span>
                          <button
                            type="button"
                            onClick={() => fileInputDoc3.current?.click()}
                            className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                          >
                            Retake
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputDoc3.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                        >
                          <Camera size={12} /> Capture Photo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Doc 4 - Business Proof */}
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {docUrls.doc4 ? (
                        <img src={docUrls.doc4} alt="Doc 4" className="w-10 h-10 object-cover rounded-lg border border-emerald-300" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                          <Building size={18} />
                        </div>
                      )}
                      <div>
                        <strong className="block text-gray-900">4) Business Proof Document</strong>
                        <span className="text-[10px] text-gray-500">Udyam Registration / GST / Trade License / Rental Deed</span>
                      </div>
                    </div>
                    <div>
                      {uploadingDoc === 'doc4' ? (
                        <span className="px-2 py-1 rounded bg-amber-50 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                          <Loader2 size={12} className="animate-spin" /> Uploading...
                        </span>
                      ) : docUrls.doc4 ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 size={11} /> Cloudinary
                          </span>
                          <button
                            type="button"
                            onClick={() => fileInputDoc4.current?.click()}
                            className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputDoc4.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-[#0B1F3A] hover:bg-[#132c4e] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Upload size={11} /> Upload Proof
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Doc 5 - Banking Proof */}
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {docUrls.doc5 ? (
                        <img src={docUrls.doc5} alt="Doc 5" className="w-10 h-10 object-cover rounded-lg border border-emerald-300" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                          <DollarSign size={18} />
                        </div>
                      )}
                      <div>
                        <strong className="block text-gray-900">5) Banking Proof</strong>
                        <span className="text-[10px] text-gray-500">Last 6 months Bank Statement / Passbook Front Page</span>
                      </div>
                    </div>
                    <div>
                      {uploadingDoc === 'doc5' ? (
                        <span className="px-2 py-1 rounded bg-amber-50 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                          <Loader2 size={12} className="animate-spin" /> Uploading...
                        </span>
                      ) : docUrls.doc5 ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 size={11} /> Cloudinary
                          </span>
                          <button
                            type="button"
                            onClick={() => fileInputDoc5.current?.click()}
                            className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputDoc5.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-[#0B1F3A] hover:bg-[#132c4e] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Upload size={11} /> Upload Passbook
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-3 border-t border-gray-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase cursor-pointer text-center"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132c4e] text-white font-extrabold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px]"
              >
                <Check size={16} />
                <span>Submit to Credit Manager Queue</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
