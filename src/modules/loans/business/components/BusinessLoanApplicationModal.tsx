// ──────────────────────────────────────────────────
// Golden Leaf Finance — Business Loan Application Modal
// Neat 4-Box Layout • 5-Doc Checklist • Fast Repeat Customer Autofill
// ──────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, Sparkles, Building, User, Store, Calculator,
  Upload, Camera, ShieldCheck, AlertCircle, FileText,
  DollarSign, MapPin, Search
} from 'lucide-react';
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
  const [age, setAge] = useState(36);
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
  const [requestedAmount, setRequestedAmount] = useState<number>(100000);
  const [collectionFrequency, setCollectionFrequency] = useState<BusinessRepaymentFrequency>('Daily');
  const [tenureUnits, setTenureUnits] = useState<number>(100);
  const [interestRate, setInterestRate] = useState<number>(24);
  const [interestType, setInterestType] = useState<'FLAT' | 'REDUCING'>('FLAT');
  const [processingFeePercent, setProcessingFeePercent] = useState<number>(2.0); // 2%
  const [docCharges, setDocCharges] = useState<number>(1000);
  const [insuranceCharges, setInsuranceCharges] = useState<number>(800);

  // Bank Account
  const [bankName, setBankName] = useState('State Bank of India');
  const [accountNo, setAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('SBIN0001245');

  // Document Uploads Status
  const [uploadedDocs, setUploadedDocs] = useState<{
    doc1: boolean;
    doc2: boolean;
    doc3: boolean;
    doc4: boolean;
    doc5: boolean;
  }>({
    doc1: true,
    doc2: true,
    doc3: true,
    doc4: true,
    doc5: true,
  });

  // Calculations
  const calculations = useMemo(() => {
    const principal = requestedAmount;
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

      totalInterest = Math.round(principal * (interestRate / 100) * tenureFractionOfYear);
      totalRepayable = principal + totalInterest;
      exactEmi = Math.ceil(totalRepayable / tenureUnits);
    } else {
      // Reducing Balance approximation
      const r = interestRate / 12 / 100;
      const n = collectionFrequency === 'Monthly' ? tenureUnits : Math.ceil(tenureUnits / 30);
      exactEmi = Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
      totalRepayable = exactEmi * n;
      totalInterest = totalRepayable - principal;
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
    const num = requestedAmount;
    if (num >= 100000) {
      const lakhs = num / 100000;
      return `${lakhs.toLocaleString('en-IN')} Lakh Rupees`;
    }
    return `${(num / 1000).toLocaleString('en-IN')} Thousand Rupees`;
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

      requestedAmount,
      sanctionedAmount: requestedAmount,
      collectionFrequency,
      tenureUnits,
      interestRateAnnual: interestRate,
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
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-2/3 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-[11px]"
                      />
                      <input
                        type="number"
                        min="21"
                        max="60"
                        value={age}
                        onChange={(e) => setAge(parseInt(e.target.value) || 21)}
                        className="w-1/3 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-center"
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
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Primary Mobile (10 Digits) *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit mobile"
                      value={primaryMobile}
                      onChange={(e) => setPrimaryMobile(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-bold font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Alternate Mobile</label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="Alternate mobile"
                      value={alternateMobile}
                      onChange={(e) => setAlternateMobile(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Aadhaar No (12 Digits) *</label>
                    <input
                      type="text"
                      placeholder="XXXX-XXXX-XXXX"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-mono font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">PAN Card No (10 Chars)</label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="ABCDE1234F"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
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
                        placeholder="Guarantor Mobile No"
                        value={guarantorMobile}
                        onChange={(e) => setGuarantorMobile(e.target.value)}
                        className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Guarantor Aadhaar / PAN"
                        value={guarantorAadhaar}
                        onChange={(e) => setGuarantorAadhaar(e.target.value)}
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
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                      Requested Loan Principal (₹25,000 to ₹5,00,000) *
                    </label>
                    <input
                      type="number"
                      min="25000"
                      max="500000"
                      step="5000"
                      value={requestedAmount}
                      onChange={(e) => setRequestedAmount(parseFloat(e.target.value) || 25000)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-black text-emerald-900 text-sm"
                    />
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
                      value={interestRate}
                      onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-blue-900"
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

              {/* ─── BOX 4: CLEAN 5-DOC CHECKLIST & UPLOADS ─── */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="font-extrabold text-[#0B1F3A] uppercase tracking-wider text-xs flex items-center gap-2">
                    <Upload size={15} className="text-[#D4AF37]" />
                    Box 4: Clean 5-Document Checklist
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    5/5 Ready
                  </span>
                </div>

                <div className="space-y-2 text-[11px]">
                  {/* Doc 1 */}
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between gap-2">
                    <div>
                      <strong className="block text-gray-900">1) Applicant & Guarantor Passport Photos</strong>
                      <span className="text-[10px] text-gray-500">Live facial photo captured at shop counter</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      ✓ Attached
                    </span>
                  </div>

                  {/* Doc 2 */}
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between gap-2">
                    <div>
                      <strong className="block text-gray-900">2) Personal KYC Proofs</strong>
                      <span className="text-[10px] text-gray-500">Aadhaar & PAN Card (Front & Back scans)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      ✓ Attached
                    </span>
                  </div>

                  {/* Doc 3 - Live Shop Photo */}
                  <div className="p-2.5 rounded-xl border-2 border-emerald-600 bg-emerald-50/30 flex items-center justify-between gap-2">
                    <div>
                      <strong className="block text-emerald-950 font-black">
                        3) Mandatory Live Shop Photo with Owner & Nameboard
                      </strong>
                      <span className="text-[10px] text-emerald-800">
                        Owner standing at shop entrance with legible nameboard
                      </span>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1">
                      <Camera size={12} /> Live Captured
                    </span>
                  </div>

                  {/* Doc 4 */}
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between gap-2">
                    <div>
                      <strong className="block text-gray-900">4) Business Proof Document</strong>
                      <span className="text-[10px] text-gray-500">Udyam Registration / GST / Trade License / Rental Deed</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      ✓ Attached
                    </span>
                  </div>

                  {/* Doc 5 */}
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between gap-2">
                    <div>
                      <strong className="block text-gray-900">5) Banking Proof</strong>
                      <span className="text-[10px] text-gray-500">Last 6 months Bank Statement / Passbook Front Page</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      ✓ Attached
                    </span>
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
