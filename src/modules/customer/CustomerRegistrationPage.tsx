// ──────────────────────────────────────────────────
// Golden Leaf Finance — Complete Multi-Step Customer Registration
// Enterprise Microfinance Onboarding with Full Step Validation, 
// Live EMI Calculation, KYC Uploads, Bank Details & Verification
// ──────────────────────────────────────────────────

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, CheckCircle2, User, Shield, Users,
  UploadCloud, FileText, Check, RotateCcw, Save, Lock, AlertCircle,
  CreditCard, Landmark, DollarSign, Calculator, Eye, Trash2, CheckCircle,
  ChevronDown, Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import { useUIStore, useAuthStore } from '../../store';
import { createClientEnrollment } from '../../services/clientService';
import { creditManagerService } from '../../services/creditManagerService';
import { getCenters } from '../../services/centerService';
import { getBranchCollectionGroups } from '../../services/monitoringDataService';
import { uploadCustomerPhoto, uploadKYCDocument, uploadImage } from '../../services/cloudinary';

interface StepDef {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}

const steps: StepDef[] = [
  { id: 'personal', label: '1. PERSONAL INFO', subtitle: 'Identity, socio-economic & address', icon: <User size={15} /> },
  { id: 'kyc_bank', label: '2. KYC & BANK DETAILS', subtitle: 'Aadhaar, PAN, Bank A/C & docs', icon: <Shield size={15} /> },
  { id: 'nominee_guarantor', label: '3. NOMINEE & GUARANTOR', subtitle: 'Family nominee & co-borrower', icon: <Users size={15} /> },
  { id: 'loan_setup', label: '4. LOAN & EMI SETUP', subtitle: 'Product, principal & EMI schedule', icon: <Calculator size={15} /> },
  { id: 'review_submit', label: '5. REVIEW & SUBMIT', subtitle: 'Compliance check & enrollment', icon: <CheckCircle2 size={15} /> },
];

const QUICK_AMOUNTS = [15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000];

export const OCCUPATION_OPTIONS = [
  { value: 'Agri & Dairy Livestock', label: 'Agri & Dairy Livestock', icon: '🌾' },
  { value: 'Petty Grocery / Kirana Shop', label: 'Petty Grocery / Kirana Shop', icon: '🛒' },
  { value: 'Tailoring & Garment Works', label: 'Tailoring & Garment Works', icon: '🧵' },
  { value: 'Street Vending / Vegetable Sales', label: 'Street Vending / Vegetable Sales', icon: '🍎' },
  { value: 'Small Eatery / Tea Stall', label: 'Small Eatery / Tea Stall', icon: '☕' },
  { value: 'Handicrafts & Handloom', label: 'Handicrafts & Handloom', icon: '🧶' },
  { value: 'Electrician / Plumber / Mechanic', label: 'Electrician / Plumber / Mechanic', icon: '⚡' },
  { value: 'Auto / Cab / Commercial Driver', label: 'Auto / Cab / Commercial Driver', icon: '🛺' },
  { value: 'Construction & Daily Wage Worker', label: 'Construction & Daily Wage Worker', icon: '🧱' },
  { value: 'Salaried Worker / Domestic Help', label: 'Salaried Worker / Domestic Help', icon: '🧹' },
  { value: 'Beauty Parlour / Wellness', label: 'Beauty Parlour / Wellness', icon: '💇' },
  { value: 'Carpentry & Woodwork', label: 'Carpentry & Woodwork', icon: '🪚' },
  { value: 'Fisheries & Meat Vending', label: 'Fisheries & Meat Vending', icon: '🐟' },
  { value: 'Other Self-Employed', label: 'Other Self-Employed / Business', icon: '💼' },
];

export const HOUSE_OWNERSHIP_OPTIONS = [
  { value: 'Own House', label: 'Own House' },
  { value: 'Rented House', label: 'Rented House' },
  { value: 'Family / Ancestral Property', label: 'Family / Ancestral Property' },
  { value: 'Lease Agreement', label: 'Lease Agreement' },
  { value: 'Company / Staff Quarters', label: 'Company / Staff Quarters' },
];

export const CENTER_OPTIONS: Array<{ value: string; label: string }> = [];

export const GROUP_OPTIONS: Array<{ value: string; label: string }> = [];

export const BANK_OPTIONS = [
  { value: 'State Bank of India (SBI)', label: 'State Bank of India (SBI)' },
  { value: 'Indian Bank', label: 'Indian Bank' },
  { value: 'Canara Bank', label: 'Canara Bank' },
  { value: 'Bank of Baroda', label: 'Bank of Baroda' },
  { value: 'HDFC Bank', label: 'HDFC Bank' },
  { value: 'ICICI Bank', label: 'ICICI Bank' },
  { value: 'Tamilnad Mercantile Bank (TMB)', label: 'Tamilnad Mercantile Bank (TMB)' },
  { value: 'Axis Bank', label: 'Axis Bank' },
  { value: 'Punjab National Bank (PNB)', label: 'Punjab National Bank (PNB)' },
  { value: 'Union Bank of India', label: 'Union Bank of India' },
  { value: 'Tamil Nadu Grama Bank', label: 'Tamil Nadu Grama Bank' },
  { value: 'City Union Bank (CUB)', label: 'City Union Bank (CUB)' },
  { value: 'Karur Vysya Bank (KVB)', label: 'Karur Vysya Bank (KVB)' },
  { value: 'Equitas Small Finance Bank', label: 'Equitas Small Finance Bank' },
  { value: 'Ujjivan Small Finance Bank', label: 'Ujjivan Small Finance Bank' },
  { value: 'Other Scheduled Bank', label: 'Other Scheduled Bank' },
];

export const NOMINEE_RELATION_OPTIONS = [
  { value: 'Spouse', label: 'Spouse (Husband / Wife)' },
  { value: 'Husband', label: 'Husband' },
  { value: 'Wife', label: 'Wife' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Father', label: 'Father' },
  { value: 'Son', label: 'Son' },
  { value: 'Daughter', label: 'Daughter' },
  { value: 'Brother', label: 'Brother' },
  { value: 'Sister', label: 'Sister' },
  { value: 'Uncle', label: 'Uncle' },
  { value: 'Aunt', label: 'Aunt' },
  { value: 'Other Relative', label: 'Other Relative' },
];

export const GUARANTOR_RELATION_OPTIONS = [
  { value: 'Husband', label: 'Husband' },
  { value: 'Father', label: 'Father' },
  { value: 'Brother', label: 'Brother' },
  { value: 'Adult Son', label: 'Adult Son' },
  { value: 'JLG Center Leader', label: 'JLG Center Leader' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Sister', label: 'Sister' },
  { value: 'Adult Daughter', label: 'Adult Daughter' },
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Uncle', label: 'Uncle' },
  { value: 'Friend / Neighbor', label: 'Friend / Neighbor' },
  { value: 'Relative / Other', label: 'Relative / Other' },
];

export const LOAN_PURPOSE_OPTIONS = [
  { value: 'Working capital for small trade / retail shop', label: 'Working capital for small trade / retail shop' },
  { value: 'Dairy livestock & cattle fodder purchase', label: 'Dairy livestock & cattle fodder purchase' },
  { value: 'Kirana / provision grocery stock purchase', label: 'Kirana / provision grocery stock purchase' },
  { value: 'Agriculture inputs, seeds & seasonal farming', label: 'Agriculture inputs, seeds & seasonal farming' },
  { value: 'Tailoring & garment manufacturing equipment', label: 'Tailoring & garment manufacturing equipment' },
  { value: 'Vegetable & fruit market vending capital', label: 'Vegetable & fruit market vending capital' },
  { value: 'Handicrafts, pottery & raw materials', label: 'Handicrafts, pottery & raw materials' },
  { value: 'Children school / college educational expenses', label: 'Children school / college educational expenses' },
  { value: 'Home renovation & roof / sanitation repair', label: 'Home renovation & roof / sanitation repair' },
  { value: 'Medical & emergency family needs', label: 'Medical & emergency family needs' },
  { value: 'Other micro-business / livelihood activity', label: 'Other micro-business / livelihood activity' },
];

export const LOAN_PRODUCT_OPTIONS = [
  { value: 'Weekly Micro-Loan (JLG / SHG Standard)', label: 'Weekly Micro-Loan (JLG / SHG Standard)' },
  { value: 'Daily Business Trader Loan (Kirana / Market)', label: 'Daily Business Trader Loan (Kirana / Market)' },
  { value: 'Agri & Livestock Term Loan', label: 'Agri & Livestock Term Loan' },
  { value: 'Women Entrepreneur Emergency Loan', label: 'Women Entrepreneur Emergency Loan' },
  { value: 'Micro-Enterprise Growth Loan', label: 'Micro-Enterprise Growth Loan' },
  { value: 'Seasonal Festive Merchant Loan', label: 'Seasonal Festive Merchant Loan' },
  { value: 'Other Loan Product Scheme', label: 'Other Loan Product Scheme' },
];

const CustomerRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const currentUser = useAuthStore((s) => s.user);

  const [currentStep, setCurrentStep] = useState(0);
  const [maxCompletedStep, setMaxCompletedStep] = useState(-1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Combobox states for Dropdown + Manual Entry
  const [isOccupationOpen, setIsOccupationOpen] = useState(false);
  const [isHouseOpen, setIsHouseOpen] = useState(false);
  const [isCenterOpen, setIsCenterOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [isNomineeRelationOpen, setIsNomineeRelationOpen] = useState(false);
  const [isGuarantorRelationOpen, setIsGuarantorRelationOpen] = useState(false);
  const [isLoanPurposeOpen, setIsLoanPurposeOpen] = useState(false);
  const [isLoanProductOpen, setIsLoanProductOpen] = useState(false);

  const occupationRef = useRef<HTMLDivElement>(null);
  const houseRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const bankRef = useRef<HTMLDivElement>(null);
  const nomineeRelationRef = useRef<HTMLDivElement>(null);
  const guarantorRelationRef = useRef<HTMLDivElement>(null);
  const loanPurposeRef = useRef<HTMLDivElement>(null);
  const loanProductRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (occupationRef.current && !occupationRef.current.contains(e.target as Node)) {
        setIsOccupationOpen(false);
      }
      if (houseRef.current && !houseRef.current.contains(e.target as Node)) {
        setIsHouseOpen(false);
      }
      if (centerRef.current && !centerRef.current.contains(e.target as Node)) {
        setIsCenterOpen(false);
      }
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) {
        setIsGroupOpen(false);
      }
      if (bankRef.current && !bankRef.current.contains(e.target as Node)) {
        setIsBankOpen(false);
      }
      if (nomineeRelationRef.current && !nomineeRelationRef.current.contains(e.target as Node)) {
        setIsNomineeRelationOpen(false);
      }
      if (guarantorRelationRef.current && !guarantorRelationRef.current.contains(e.target as Node)) {
        setIsGuarantorRelationOpen(false);
      }
      if (loanPurposeRef.current && !loanPurposeRef.current.contains(e.target as Node)) {
        setIsLoanPurposeOpen(false);
      }
      if (loanProductRef.current && !loanProductRef.current.contains(e.target as Node)) {
        setIsLoanProductOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamically loaded centers & collection groups (from manual entry / storage)
  const [centerOptions, setCenterOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [groupOptions, setGroupOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    getCenters().then((centers) => {
      if (Array.isArray(centers) && centers.length > 0) {
        setCenterOptions(
          centers.map((c) => ({
            value: `${c.shortId} - ${c.name}`,
            label: `${c.shortId} - ${c.name}`,
          }))
        );
      } else {
        setCenterOptions([]);
      }
    });

    const branch = currentUser?.customClaims?.branchId || null;
    const groups = getBranchCollectionGroups(branch);
    if (Array.isArray(groups) && groups.length > 0) {
      setGroupOptions(
        groups.map((g) => ({
          value: `${g.id} (${g.name})`,
          label: `${g.id} (${g.name})`,
        }))
      );
    } else {
      setGroupOptions([]);
    }
  }, [currentUser]);

  // Auto-generate client ID
  const [generatedClientId] = useState(() => `GLF-C-${Math.floor(10000 + Math.random() * 90000)}`);

  // Document Upload State & Previews
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [aadhaarDocName, setAadhaarDocName] = useState<string | null>(null);
  const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(null);
  const [passbookDocName, setPassbookDocName] = useState<string | null>(null);
  const [passbookPreview, setPassbookPreview] = useState<string | null>(null);

  // Form State - Starts completely empty so all data is entered manually
  const [formData, setFormData] = useState({
    clientId: generatedClientId,
    // Step 1: Personal & Socio-Economic Info
    fullName: '',
    guardianName: '',
    phone: '',
    alternatePhone: '',
    email: '',
    dob: '',
    age: '',
    gender: '',
    maritalStatus: '',
    occupation: '',
    monthlyIncome: '',
    monthlyExpenses: '',
    houseOwnership: '',
    yearsInResidence: '',
    address: '',
    landmark: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    branchId: '',
    centerName: '',
    groupId: '',

    // Step 2: KYC & Bank Info
    aadhaarNumber: '',
    panNumber: '',
    voterId: '',
    rationCard: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountHolderName: '',

    // Step 3: Nominee & Guarantor Info
    nomineeName: '',
    nomineeRelation: '',
    nomineePhone: '',
    nomineeAadhaar: '',
    nomineeAge: '',
    nomineeSameAddress: false,
    nomineeAddress: '',
    guarantorName: '',
    guarantorRelation: '',
    guarantorPhone: '',
    guarantorAadhaar: '',
    guarantorIncome: '',
    groupGuaranteeConsent: false,

    // Step 4: Loan Requirements & Repayment Setup
    loanProduct: '',
    requestedAmount: '',
    tenorWeeks: '',
    repaymentFrequency: '',
    interestRateAnnual: '',
    loanPurpose: '',

    // Step 5: Officer Declaration
    physicalVisitDone: false,
    originalDocsVerified: false,
    groupConsentVerified: false,
    officerRemarks: '',
  });

  // Calculate Age from DOB
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dobVal = e.target.value;
    let computedAge = formData.age;
    if (dobVal) {
      const birthDate = new Date(dobVal);
      const diff = Date.now() - birthDate.getTime();
      const ageDate = new Date(diff);
      const calc = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (!isNaN(calc) && calc > 0 && calc < 100) {
        computedAge = String(calc);
      }
    }
    setFormData(prev => ({ ...prev, dob: dobVal, age: computedAge }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));

    if (errors[name]) {
      setErrors(prev => {
        const n = { ...prev };
        delete n[name];
        return n;
      });
    }
  };

  // Customer Photo Upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        addToast({ type: 'success', title: 'Photo Uploaded', message: `${file.name} attached successfully.` });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocUpload = (type: 'aadhaar' | 'passbook', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'aadhaar') {
        setAadhaarDocName(file.name);
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setAadhaarPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        } else {
          setAadhaarPreview(null);
        }
      }
      if (type === 'passbook') {
        setPassbookDocName(file.name);
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPassbookPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        } else {
          setPassbookPreview(null);
        }
      }
      addToast({ type: 'success', title: 'Document Uploaded', message: `${file.name} attached successfully.` });
    }
  };

  // Dynamic EMI Calculation
  const loanCalculations = useMemo(() => {
    const P = Number(formData.requestedAmount) || 0;
    const weeks = Number(formData.tenorWeeks) || 0;
    const annualRate = Number(formData.interestRateAnnual) || 18;
    
    // Flat / Weekly interest computation
    const totalInterest = (weeks > 0 && annualRate > 0) ? Math.round((P * (annualRate / 100) * (weeks / 52))) : 0;
    const totalPayable = P + totalInterest;
    const weeklyEMI = weeks > 0 ? Math.ceil(totalPayable / weeks) : 0;
    const weeklyPrincipal = weeks > 0 ? Math.round(P / weeks) : 0;
    const weeklyInterest = weeks > 0 ? Math.round(totalInterest / weeks) : 0;

    return {
      principal: P,
      totalInterest,
      totalPayable,
      weeklyEMI,
      weeklyPrincipal,
      weeklyInterest,
    };
  }, [formData.requestedAmount, formData.tenorWeeks, formData.interestRateAnnual]);

  // Step Validation Logic
  const validateStep = (stepIdx: number): boolean => {
    const newErrors: Record<string, string> = {};

    // ── STEP 1: PERSONAL INFO VALIDATION ──
    if (stepIdx === 0) {
      if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
        newErrors.fullName = 'Full Name is required (minimum 3 characters)';
      }
      if (!formData.guardianName.trim() || formData.guardianName.trim().length < 3) {
        newErrors.guardianName = "Father's / Spouse name is required";
      }
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        newErrors.phone = 'Valid 10-digit primary phone number is required';
      }
      if (!formData.address.trim() || formData.address.trim().length < 5) {
        newErrors.address = 'Residential street address is required';
      }
      if (!formData.city.trim()) {
        newErrors.city = 'City / Village is required';
      }
      const cleanPin = formData.pincode.replace(/\D/g, '');
      if (!cleanPin || cleanPin.length !== 6) {
        newErrors.pincode = 'Valid 6-digit Pincode is required';
      }
      if (!formData.monthlyIncome || Number(formData.monthlyIncome) <= 0) {
        newErrors.monthlyIncome = 'Monthly household income is required';
      }
      if (!formData.occupation || !formData.occupation.trim()) {
        newErrors.occupation = 'Primary Occupation is required (select or enter manually)';
      }
    }

    // ── STEP 2: KYC & BANK VALIDATION ──
    else if (stepIdx === 1) {
      const cleanAadhaar = formData.aadhaarNumber.replace(/\D/g, '');
      if (!cleanAadhaar || cleanAadhaar.length < 12) {
        newErrors.aadhaarNumber = 'Valid 12-digit Aadhaar UID number is required';
      }
      if (formData.panNumber && formData.panNumber.trim().length !== 10) {
        newErrors.panNumber = 'PAN Card must be exactly 10 alphanumeric characters';
      }
      if (!formData.accountNumber.trim() || formData.accountNumber.trim().length < 8) {
        newErrors.accountNumber = 'Valid Bank Account Number is required';
      }
      if (formData.accountNumber !== formData.confirmAccountNumber) {
        newErrors.confirmAccountNumber = 'Account Number and Confirm Account Number must match';
      }
      if (!formData.ifscCode.trim() || formData.ifscCode.trim().length < 8) {
        newErrors.ifscCode = 'Valid Bank IFSC Code is required';
      }
      if (!formData.bankName || !formData.bankName.trim()) {
        newErrors.bankName = 'Bank Name is required (select from dropdown or type)';
      }
      if (!formData.accountHolderName.trim()) {
        newErrors.accountHolderName = 'Account Holder Name is required';
      }
    }

    // ── STEP 3: NOMINEE & GUARANTOR VALIDATION ──
    else if (stepIdx === 2) {
      if (!formData.nomineeName.trim() || formData.nomineeName.trim().length < 3) {
        newErrors.nomineeName = 'Nominee Full Name is required';
      }
      const cleanNomineePhone = formData.nomineePhone.replace(/\D/g, '');
      if (formData.nomineePhone && cleanNomineePhone.length < 10) {
        newErrors.nomineePhone = 'Nominee phone must be 10 digits';
      }
      if (!formData.guarantorName.trim() || formData.guarantorName.trim().length < 3) {
        newErrors.guarantorName = 'Co-Borrower / Guarantor Name is required';
      }
      const cleanGuarantorPhone = formData.guarantorPhone.replace(/\D/g, '');
      if (formData.guarantorPhone && cleanGuarantorPhone.length < 10) {
        newErrors.guarantorPhone = 'Guarantor phone must be 10 digits';
      }
    }

    // ── STEP 4: LOAN SETUP VALIDATION ──
    else if (stepIdx === 3) {
      if (!formData.loanProduct || !formData.loanProduct.trim()) {
        newErrors.loanProduct = 'Loan Product Scheme is required (select from dropdown or type)';
      }
      if (!formData.requestedAmount || Number(formData.requestedAmount) < 5000) {
        newErrors.requestedAmount = 'Requested loan amount must be at least ₹5,000';
      }
      if (!formData.tenorWeeks || Number(formData.tenorWeeks) <= 0) {
        newErrors.tenorWeeks = 'Valid loan tenor is required';
      }
    }

    // ── STEP 5: REVIEW VALIDATION ──
    else if (stepIdx === 4) {
      if (!formData.physicalVisitDone || !formData.originalDocsVerified) {
        newErrors.compliance = 'Please confirm all compliance checklists before submission';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      addToast({
        type: 'warning',
        title: `${steps[stepIdx].label} Incomplete`,
        message: firstError,
      });
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    setMaxCompletedStep(prev => Math.max(prev, currentStep));
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = (targetIndex: number) => {
    if (targetIndex === currentStep) return;

    // Jumping backward is always free
    if (targetIndex < currentStep) {
      setCurrentStep(targetIndex);
      return;
    }

    // Validate current step before advancing
    if (!validateStep(currentStep)) return;

    // Check if target step is unlocked
    if (targetIndex > maxCompletedStep + 1 && targetIndex > currentStep + 1) {
      addToast({
        type: 'warning',
        title: 'Step Locked',
        message: `Please complete Step ${currentStep + 1} (${steps[currentStep].label}) first before moving ahead.`,
      });
      return;
    }

    setMaxCompletedStep(prev => Math.max(prev, currentStep));
    setCurrentStep(targetIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear all registration fields?")) {
      setFormData({
        clientId: `GLF-C-${Math.floor(10000 + Math.random() * 90000)}`,
        fullName: '', guardianName: '', phone: '', alternatePhone: '', email: '', dob: '', age: '',
        gender: '', maritalStatus: '', occupation: '', monthlyIncome: '',
        monthlyExpenses: '', houseOwnership: '', yearsInResidence: '', address: '',
        landmark: '', city: '', district: '', state: '', pincode: '',
        branchId: '', centerName: '', groupId: '',
        aadhaarNumber: '', panNumber: '', voterId: '', rationCard: '', bankName: '',
        accountNumber: '', confirmAccountNumber: '', ifscCode: '', accountHolderName: '',
        nomineeName: '', nomineeRelation: '', nomineePhone: '', nomineeAadhaar: '', nomineeAge: '',
        nomineeSameAddress: false, nomineeAddress: '', guarantorName: '', guarantorRelation: '',
        guarantorPhone: '', guarantorAadhaar: '', guarantorIncome: '', groupGuaranteeConsent: false,
        loanProduct: '', requestedAmount: '', tenorWeeks: '', repaymentFrequency: '',
        interestRateAnnual: '', loanPurpose: '',
        physicalVisitDone: false, originalDocsVerified: false, groupConsentVerified: false,
        officerRemarks: '',
      });
      setPhotoPreview(null);
      setAadhaarDocName(null);
      setAadhaarPreview(null);
      setPassbookDocName(null);
      setPassbookPreview(null);
      setErrors({});
      setMaxCompletedStep(-1);
      setCurrentStep(0);
      addToast({ type: 'info', title: 'Form Reset', message: 'All inputs have been cleared.' });
    }
  };

  // Submit and Store Registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(0) || !validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload customer photo & KYC documents permanently to Cloudinary
      let cloudPhotoUrl = photoPreview || undefined;
      let cloudAadhaarUrl = aadhaarPreview || undefined;
      let cloudPassbookUrl = passbookPreview || undefined;

      try {
        if (photoPreview && (photoPreview.startsWith('data:') || photoPreview.startsWith('blob:'))) {
          const res = await uploadCustomerPhoto(photoPreview as any, formData.clientId);
          if (res) cloudPhotoUrl = res;
        }
      } catch (err) {
        console.warn('Customer photo Cloudinary upload notice:', err);
      }

      try {
        if (aadhaarPreview && (aadhaarPreview.startsWith('data:') || aadhaarPreview.startsWith('blob:'))) {
          const res = await uploadKYCDocument(aadhaarPreview as any, formData.clientId, 'aadhaar_front');
          if (res) cloudAadhaarUrl = res;
        }
      } catch (err) {
        console.warn('Aadhaar Cloudinary upload notice:', err);
      }

      try {
        if (passbookPreview && (passbookPreview.startsWith('data:') || passbookPreview.startsWith('blob:'))) {
          const res = await uploadImage(passbookPreview as any, `kyc/${formData.clientId}/passbook`);
          if (res?.secure_url) cloudPassbookUrl = res.secure_url;
        }
      } catch (err) {
        console.warn('Passbook Cloudinary upload notice:', err);
      }

      const kycData = {
        aadhaarNumber: formData.aadhaarNumber,
        panNumber: formData.panNumber,
        voterId: formData.voterId,
        rationCard: formData.rationCard,
        status: 'verified',
        isMobileVerified: true,
        photoUrl: cloudPhotoUrl,
        aadhaarUrl: cloudAadhaarUrl,
        passbookUrl: cloudPassbookUrl,
      };

      await createClientEnrollment(kycData, {
        ...formData,
        calculatedEMI: loanCalculations.weeklyEMI,
        totalPayable: loanCalculations.totalPayable,
        registeredBy: currentUser?.displayName || 'Subash (Field Officer)',
        enrolledDate: new Date().toISOString(),
      });

      // Synchronize seamlessly into Credit Manager's appraisal queue
      creditManagerService.addApplicant({
        customerId: formData.clientId,
        customerName: formData.fullName,
        fatherOrSpouseName: formData.guardianName || 'Guardian',
        phone: formData.phone,
        alternatePhone: formData.alternatePhone,
        address: formData.address || 'Chennai',
        city: formData.city,
        centerName: formData.centerName,
        groupName: formData.groupId,
        occupation: formData.occupation,
        monthlyIncome: Number(formData.monthlyIncome) || 25000,
        monthlyExpenses: Number(formData.monthlyExpenses) || 12000,
        existingLoans: 0,
        existingMonthlyEmi: 0,
        loanAmount: Number(formData.requestedAmount) || 25000,
        loanProduct: formData.loanProduct,
        tenorWeeks: Number(formData.tenorWeeks) || 25,
        proposedEmi: loanCalculations.weeklyEMI,
        loanPurpose: formData.loanPurpose,
        aadhaarNumber: formData.aadhaarNumber,
        panNumber: formData.panNumber,
        voterId: formData.voterId,
        rationCard: formData.rationCard,
      });

      addToast({
        type: 'success',
        title: 'Customer Onboarded Successfully!',
        message: `${formData.fullName} (ID: ${formData.clientId}) successfully enrolled in ${formData.centerName}!`,
      });

      navigate('/client/enrollment');
    } catch (err: any) {
      console.error('Registration failed:', err);
      addToast({
        type: 'error',
        title: 'Registration Error',
        message: 'Could not complete registration. Please check inputs and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 pb-16 font-body pr-1"
    >
      {/* Top Header Card */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-[0_2px_10px_rgba(11,31,58,0.04)] overflow-hidden">
        <div className="bg-[#0B1F3A] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-[#E5E7EB]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full"></div>
              <h1 className="text-base font-bold text-white tracking-wide uppercase font-body">
                Customer Registration & KYC Portal
              </h1>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                {formData.clientId}
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1 pl-4">
              Golden Leaf Finance • End-to-end verified microfinance applicant onboarding workflow
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Workflow Progress</span>
              <span className="text-xs font-bold text-[#D4AF37]">
                Step {currentStep + 1} of {steps.length} ({Math.round(((currentStep + 1) / steps.length) * 100)}%)
              </span>
            </div>
            <div className="w-28 bg-white/10 h-2.5 rounded-full overflow-hidden border border-white/10">
              <div
                className="bg-[#D4AF37] h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(212,175,55,0.6)]"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Multi-Step Stepper Navigation Bar */}
        <div className="p-3 sm:p-5 lg:p-6 bg-[#FAFBFD] border-b border-[#E5E7EB]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isPast = index < currentStep || index <= maxCompletedStep;
              const isLocked = index > currentStep && index > maxCompletedStep + 1;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(index)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left relative ${
                    isActive
                      ? 'bg-[#0B1F3A] text-white border-[#0B1F3A] shadow-md ring-2 ring-[#D4AF37]/50'
                      : isPast
                      ? 'bg-[#ECFDF5] text-[#059669] border-[#059669]/30 hover:border-[#059669] cursor-pointer'
                      : isLocked
                      ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-70'
                      : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#D4AF37]/50 cursor-pointer'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      isActive
                        ? 'bg-[#D4AF37] text-[#0B1F3A]'
                        : isPast
                        ? 'bg-[#059669] text-white'
                        : isLocked
                        ? 'bg-gray-200 text-gray-500'
                        : 'bg-[#F3F4F6] text-[#6B7280]'
                    }`}
                  >
                    {isPast && !isActive ? (
                      <Check size={14} />
                    ) : isLocked ? (
                      <Lock size={12} />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="truncate flex-1">
                    <p className={`text-[11px] font-bold font-body uppercase tracking-wider truncate ${isActive ? 'text-white' : ''}`}>
                      {step.label.replace(/^\d+\.\s*/, '')}
                    </p>
                    <p className={`text-[9px] truncate ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                      {isLocked ? 'Complete prior step' : step.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Body */}
        <div className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {/* ══════════════════════════════════════════════════════ */}
            {/* STEP 1: PERSONAL & RESIDENTIAL INFORMATION */}
            {/* ══════════════════════════════════════════════════════ */}
            {currentStep === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Section Header */}
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#0B1F3A] font-body tracking-tight">
                      Section 1: Basic Borrower Identity & Family Profile
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Enter personal identification, phone contacts, socio-economic profile, and branch assignment
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                    * Mandatory Fields
                  </span>
                </div>

                {/* Sub-section A: Identity & Contact */}
                <div>
                  <h4 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User size={14} className="text-[#D4AF37]" /> A. Borrower Particulars & Contact
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Full Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Full Name (as per Aadhaar) *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="e.g. Meera Devi"
                        className={`w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] font-body focus:outline-none focus:ring-1 shadow-sm ${
                          errors.fullName ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]'
                        }`}
                      />
                      {errors.fullName && <span className="text-[11px] text-red-500 font-semibold flex items-center gap-1"><AlertCircle size={12} /> {errors.fullName}</span>}
                    </div>

                    {/* Father / Husband Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Father's / Husband's Name *
                      </label>
                      <input
                        type="text"
                        name="guardianName"
                        value={formData.guardianName}
                        onChange={handleChange}
                        placeholder="e.g. Ramanathan K"
                        className={`w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] font-body focus:outline-none focus:ring-1 shadow-sm ${
                          errors.guardianName ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]'
                        }`}
                      />
                      {errors.guardianName && <span className="text-[11px] text-red-500 font-semibold flex items-center gap-1"><AlertCircle size={12} /> {errors.guardianName}</span>}
                    </div>

                    {/* Primary Phone */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Primary Mobile Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="9840123456"
                        maxLength={10}
                        className={`w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] font-body focus:outline-none focus:ring-1 shadow-sm ${
                          errors.phone ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]'
                        }`}
                      />
                      {errors.phone && <span className="text-[11px] text-red-500 font-semibold flex items-center gap-1"><AlertCircle size={12} /> {errors.phone}</span>}
                    </div>

                    {/* Alternate Phone */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Alternate / WhatsApp Phone
                      </label>
                      <input
                        type="tel"
                        name="alternatePhone"
                        value={formData.alternatePhone}
                        onChange={handleChange}
                        placeholder="Optional contact"
                        maxLength={10}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0B1F3A] font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                      />
                    </div>

                    {/* DOB & Age */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Date of Birth / Age
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="date"
                          name="dob"
                          value={formData.dob}
                          onChange={handleDobChange}
                          className="col-span-2 px-3 py-3 rounded-xl bg-white border border-gray-200 text-xs text-[#0B1F3A] font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                        />
                        <input
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleChange}
                          placeholder="Age"
                          className="px-3 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0B1F3A] font-body text-center focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Gender *
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0B1F3A] font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                      >
                        <option value="">-- Select Gender --</option>
                        <option value="female">Female (SHG / JLG Borrower)</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Marital Status */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Marital Status
                      </label>
                      <select
                        name="maritalStatus"
                        value={formData.maritalStatus}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0B1F3A] font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                      >
                        <option value="">-- Select Marital Status --</option>
                        <option value="married">Married</option>
                        <option value="single">Single</option>
                        <option value="widowed">Widowed</option>
                        <option value="divorced">Divorced</option>
                      </select>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="borrower@example.com"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0B1F3A] font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-section B: Socio-Economic Profile */}
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <DollarSign size={14} className="text-[#D4AF37]" /> B. Socio-Economic Profile & Income
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    {/* Occupation */}
                    <div className="flex flex-col gap-1.5 relative" ref={occupationRef}>
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Primary Occupation *
                      </label>
                      
                      <div className="relative">
                        <input
                          type="text"
                          name="occupation"
                          id="primary-occupation-input"
                          list="occupation-presets"
                          value={formData.occupation}
                          onChange={handleChange}
                          onFocus={() => setIsOccupationOpen(true)}
                          placeholder="Select or enter occupation..."
                          autoComplete="off"
                          className={clsx(
                            "w-full pl-3.5 pr-10 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] font-body transition-all shadow-sm",
                            "focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]",
                            errors.occupation ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 hover:border-gray-300'
                          )}
                        />
                        <button
                          type="button"
                          id="occupation-dropdown-toggle"
                          tabIndex={-1}
                          onClick={() => setIsOccupationOpen(prev => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-[#0B1F3A] hover:bg-gray-100 transition-colors"
                          title="Click to view all occupations"
                        >
                          <ChevronDown size={17} className={clsx("transition-transform duration-200", isOccupationOpen && "rotate-180 text-[#D4AF37]")} />
                        </button>
                      </div>

                      {/* Datalist for native autocomplete suggestion */}
                      <datalist id="occupation-presets">
                        {OCCUPATION_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value} />
                        ))}
                      </datalist>

                      {/* Dropdown Floating Options Menu */}
                      <AnimatePresence>
                        {isOccupationOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-2xl border border-amber-100/90 overflow-hidden py-1 max-h-64 overflow-y-auto"
                          >
                            <div className="px-3 py-1.5 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-900">
                              <span>Standard Occupations</span>
                              <span className="text-[9px] font-medium text-amber-700/80">Click to pick or type above</span>
                            </div>
                            <div className="p-1 space-y-0.5">
                              {OCCUPATION_OPTIONS.map((opt) => {
                                const isSelected = formData.occupation?.trim().toLowerCase() === opt.value.toLowerCase();
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, occupation: opt.value }));
                                      setIsOccupationOpen(false);
                                      if (errors.occupation) {
                                        setErrors(prev => {
                                          const n = { ...prev };
                                          delete n.occupation;
                                          return n;
                                        });
                                      }
                                    }}
                                    className={clsx(
                                      "w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors",
                                      isSelected
                                        ? "bg-[#D4AF37]/15 text-[#0B1F3A] font-bold"
                                        : "text-gray-700 hover:bg-amber-50 hover:text-[#0B1F3A]"
                                    )}
                                  >
                                    <span className="flex items-center gap-2">
                                      <span className="text-sm">{opt.icon}</span>
                                      <span>{opt.label}</span>
                                    </span>
                                    {isSelected && <Check size={14} className="text-[#D4AF37] shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {errors.occupation && (
                        <p className="text-[11px] text-red-500 mt-0.5">{errors.occupation}</p>
                      )}
                    </div>

                    {/* Monthly Income */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Monthly Income (₹) *
                      </label>
                      <input
                        type="number"
                        name="monthlyIncome"
                        value={formData.monthlyIncome}
                        onChange={handleChange}
                        placeholder="25000"
                        className={`w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] font-body focus:outline-none focus:ring-1 shadow-sm ${
                          errors.monthlyIncome ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]'
                        }`}
                      />
                    </div>

                    {/* Monthly Expenses */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Monthly Expenses (₹)
                      </label>
                      <input
                        type="number"
                        name="monthlyExpenses"
                        value={formData.monthlyExpenses}
                        onChange={handleChange}
                        placeholder="12000"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0B1F3A] font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                      />
                    </div>

                    {/* House Ownership */}
                    <div className="flex flex-col gap-1.5 relative" ref={houseRef}>
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        House Ownership
                      </label>

                      <div className="relative">
                        <input
                          type="text"
                          name="houseOwnership"
                          id="house-ownership-input"
                          list="house-presets"
                          value={formData.houseOwnership}
                          onChange={handleChange}
                          onFocus={() => setIsHouseOpen(true)}
                          placeholder="Select or enter ownership..."
                          autoComplete="off"
                          className="w-full pl-3.5 pr-10 py-3 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-sm text-[#0B1F3A] font-body transition-all shadow-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                        />
                        <button
                          type="button"
                          id="house-dropdown-toggle"
                          tabIndex={-1}
                          onClick={() => setIsHouseOpen(prev => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-[#0B1F3A] hover:bg-gray-100 transition-colors"
                          title="Click to view all ownership types"
                        >
                          <ChevronDown size={17} className={clsx("transition-transform duration-200", isHouseOpen && "rotate-180 text-[#D4AF37]")} />
                        </button>
                      </div>

                      {/* Datalist */}
                      <datalist id="house-presets">
                        {HOUSE_OWNERSHIP_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value} />
                        ))}
                      </datalist>

                      {/* Dropdown Floating Options Menu */}
                      <AnimatePresence>
                        {isHouseOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden py-1 max-h-56 overflow-y-auto"
                          >
                            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-600">
                              <span>Standard Ownership Types</span>
                              <span className="text-[9px] font-medium text-gray-400">Click to pick or type above</span>
                            </div>
                            <div className="p-1 space-y-0.5">
                              {HOUSE_OWNERSHIP_OPTIONS.map((opt) => {
                                const isSelected = formData.houseOwnership?.trim().toLowerCase() === opt.value.toLowerCase();
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, houseOwnership: opt.value }));
                                      setIsHouseOpen(false);
                                    }}
                                    className={clsx(
                                      "w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors",
                                      isSelected
                                        ? "bg-[#D4AF37]/15 text-[#0B1F3A] font-bold"
                                        : "text-gray-700 hover:bg-amber-50 hover:text-[#0B1F3A]"
                                    )}
                                  >
                                    <span>{opt.label}</span>
                                    {isSelected && <Check size={14} className="text-[#D4AF37] shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Sub-section C: Residential Address & Center Allocation */}
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Landmark size={14} className="text-[#D4AF37]" /> C. Residential Address & Center Allocation
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Street Address */}
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Residential Door No & Street Address *
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Door No. 14, 2nd Street, Malar Colony"
                        className={`w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] font-body focus:outline-none focus:ring-1 shadow-sm ${
                          errors.address ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]'
                        }`}
                      />
                      {errors.address && <span className="text-[11px] text-red-500 font-semibold flex items-center gap-1"><AlertCircle size={12} /> {errors.address}</span>}
                    </div>

                    {/* Landmark */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Nearby Landmark
                      </label>
                      <input
                        type="text"
                        name="landmark"
                        value={formData.landmark}
                        onChange={handleChange}
                        placeholder="Near Mariamman Temple"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0B1F3A] font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                      />
                    </div>

                    {/* City */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        City / Village *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="e.g. Chennai"
                        className={`w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] font-body focus:outline-none focus:ring-1 shadow-sm ${
                          errors.city ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]'
                        }`}
                      />
                    </div>

                    {/* Pincode */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="600001"
                        maxLength={6}
                        className={`w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] font-body focus:outline-none focus:ring-1 shadow-sm ${
                          errors.pincode ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]'
                        }`}
                      />
                    </div>

                    {/* State */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        State
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="e.g. Tamil Nadu"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0B1F3A] font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                      />
                    </div>

                    {/* Center Assignment - Dropdown + Manual Entry */}
                    <div className="flex flex-col gap-1.5 relative" ref={centerRef}>
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Center Assignment *
                      </label>

                      <div className="relative">
                        <input
                          type="text"
                          name="centerName"
                          id="center-assignment-input"
                          list="center-presets"
                          value={formData.centerName}
                          onChange={handleChange}
                          onFocus={() => setIsCenterOpen(true)}
                          placeholder="Select or enter center name..."
                          autoComplete="off"
                          className={clsx(
                            "w-full pl-3.5 pr-10 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] font-body transition-all shadow-sm",
                            "focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]",
                            errors.centerName ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 hover:border-gray-300'
                          )}
                        />
                        <button
                          type="button"
                          id="center-dropdown-toggle"
                          tabIndex={-1}
                          onClick={() => setIsCenterOpen(prev => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-[#0B1F3A] hover:bg-gray-100 transition-colors"
                          title="Click to view all centers"
                        >
                          <ChevronDown size={17} className={clsx("transition-transform duration-200", isCenterOpen && "rotate-180 text-[#D4AF37]")} />
                        </button>
                      </div>

                      {/* Native datalist */}
                      <datalist id="center-presets">
                        {centerOptions.map(opt => (
                          <option key={opt.value} value={opt.value} />
                        ))}
                      </datalist>

                      {/* Floating Dropdown */}
                      <AnimatePresence>
                        {isCenterOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden py-1 max-h-60 overflow-y-auto"
                          >
                            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-600">
                              <span>Configured Centers</span>
                              <span className="text-[9px] font-medium text-gray-400">Click to pick or type above</span>
                            </div>
                            <div className="p-1 space-y-0.5">
                              {centerOptions.length === 0 ? (
                                <div className="p-3 text-center text-[11px] text-gray-500">
                                  No pre-configured centers found. Type your center name directly above.
                                </div>
                              ) : (
                                centerOptions.map((opt) => {
                                  const isSelected = formData.centerName?.trim().toLowerCase() === opt.value.toLowerCase();
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, centerName: opt.value }));
                                        setIsCenterOpen(false);
                                        if (errors.centerName) {
                                          setErrors(prev => {
                                            const n = { ...prev };
                                            delete n.centerName;
                                            return n;
                                          });
                                        }
                                      }}
                                      className={clsx(
                                        "w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors",
                                        isSelected
                                          ? "bg-[#D4AF37]/15 text-[#0B1F3A] font-bold"
                                          : "text-gray-700 hover:bg-amber-50 hover:text-[#0B1F3A]"
                                      )}
                                    >
                                      <span>{opt.label}</span>
                                      {isSelected && <Check size={14} className="text-[#D4AF37] shrink-0" />}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {errors.centerName && <p className="text-[11px] text-red-500 mt-0.5">{errors.centerName}</p>}
                    </div>

                    {/* Group Assignment - Dropdown + Manual Entry */}
                    <div className="flex flex-col gap-1.5 md:col-span-2 relative" ref={groupRef}>
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        JLG Group / Route Name *
                      </label>

                      <div className="relative">
                        <input
                          type="text"
                          name="groupId"
                          id="group-assignment-input"
                          list="group-presets"
                          value={formData.groupId}
                          onChange={handleChange}
                          onFocus={() => setIsGroupOpen(true)}
                          placeholder="Select or enter JLG group name / route..."
                          autoComplete="off"
                          className={clsx(
                            "w-full pl-3.5 pr-10 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] font-body transition-all shadow-sm",
                            "focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]",
                            errors.groupId ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 hover:border-gray-300'
                          )}
                        />
                        <button
                          type="button"
                          id="group-dropdown-toggle"
                          tabIndex={-1}
                          onClick={() => setIsGroupOpen(prev => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-[#0B1F3A] hover:bg-gray-100 transition-colors"
                          title="Click to view all groups"
                        >
                          <ChevronDown size={17} className={clsx("transition-transform duration-200", isGroupOpen && "rotate-180 text-[#D4AF37]")} />
                        </button>
                      </div>

                      {/* Native datalist */}
                      <datalist id="group-presets">
                        {groupOptions.map(opt => (
                          <option key={opt.value} value={opt.value} />
                        ))}
                      </datalist>

                      {/* Floating Dropdown */}
                      <AnimatePresence>
                        {isGroupOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden py-1 max-h-60 overflow-y-auto"
                          >
                            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-600">
                              <span>Configured JLG Groups & Routes</span>
                              <span className="text-[9px] font-medium text-gray-400">Click to pick or type above</span>
                            </div>
                            <div className="p-1 space-y-0.5">
                              {groupOptions.length === 0 ? (
                                <div className="p-3 text-center text-[11px] text-gray-500">
                                  No pre-configured groups found. Type your group name directly above.
                                </div>
                              ) : (
                                groupOptions.map((opt) => {
                                  const isSelected = formData.groupId?.trim().toLowerCase() === opt.value.toLowerCase();
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, groupId: opt.value }));
                                        setIsGroupOpen(false);
                                        if (errors.groupId) {
                                          setErrors(prev => {
                                            const n = { ...prev };
                                            delete n.groupId;
                                            return n;
                                          });
                                        }
                                      }}
                                      className={clsx(
                                        "w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors",
                                        isSelected
                                          ? "bg-[#D4AF37]/15 text-[#0B1F3A] font-bold"
                                          : "text-gray-700 hover:bg-amber-50 hover:text-[#0B1F3A]"
                                      )}
                                    >
                                      <span>{opt.label}</span>
                                      {isSelected && <Check size={14} className="text-[#D4AF37] shrink-0" />}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {errors.groupId && <p className="text-[11px] text-red-500 mt-0.5">{errors.groupId}</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* STEP 2: KYC & BANK ACCOUNT DETAILS */}
            {/* ══════════════════════════════════════════════════════ */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#0B1F3A] font-body tracking-tight">
                      Section 2: Government Identity Proofs & Bank Disbursal Account
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Verify Aadhaar, PAN, Bank account particulars and attach KYC documents
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                    Step 1 Verified ✓
                  </span>
                </div>

                {/* Sub-section A: Government Identity Numbers */}
                <div>
                  <h4 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Shield size={14} className="text-[#D4AF37]" /> A. Government Identification Numbers
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Aadhaar Number */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Aadhaar Number (UIDAI) *
                      </label>
                      <input
                        type="text"
                        name="aadhaarNumber"
                        value={formData.aadhaarNumber}
                        onChange={handleChange}
                        placeholder="12-digit UID (e.g. 984012345678)"
                        maxLength={14}
                        className={`w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] font-body focus:outline-none focus:ring-1 shadow-sm ${
                          errors.aadhaarNumber ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]'
                        }`}
                      />
                      {errors.aadhaarNumber && <span className="text-[11px] text-red-500 font-semibold flex items-center gap-1"><AlertCircle size={12} /> {errors.aadhaarNumber}</span>}
                    </div>

                    {/* PAN Card */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        PAN Card Number
                      </label>
                      <input
                        type="text"
                        name="panNumber"
                        value={formData.panNumber}
                        onChange={handleChange}
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        className={`w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] uppercase font-body focus:outline-none focus:ring-1 shadow-sm ${
                          errors.panNumber ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]'
                        }`}
                      />
                      {errors.panNumber && <span className="text-[11px] text-red-500 font-semibold flex items-center gap-1"><AlertCircle size={12} /> {errors.panNumber}</span>}
                    </div>

                    {/* Voter ID */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Voter ID / EPIC Number
                      </label>
                      <input
                        type="text"
                        name="voterId"
                        value={formData.voterId}
                        onChange={handleChange}
                        placeholder="e.g. TN/01/012/123456"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0B1F3A] uppercase font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                      />
                    </div>

                    {/* Ration Card */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Smart Card / Ration Card Number
                      </label>
                      <input
                        type="text"
                        name="rationCard"
                        value={formData.rationCard}
                        onChange={handleChange}
                        placeholder="e.g. 02/G/0123456"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0B1F3A] font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-section B: Bank Account Details */}
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <CreditCard size={14} className="text-[#D4AF37]" /> B. Bank Account for Direct Loan Disbursal
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Bank Name - Dropdown + Manual Entry */}
                    <div className="flex flex-col gap-1.5 relative" ref={bankRef}>
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Bank Name *
                      </label>

                      <div className="relative">
                        <input
                          type="text"
                          name="bankName"
                          id="bank-name-input"
                          list="bank-presets"
                          value={formData.bankName}
                          onChange={handleChange}
                          onFocus={() => setIsBankOpen(true)}
                          placeholder="Select or enter bank name..."
                          autoComplete="off"
                          className={clsx(
                            "w-full pl-3.5 pr-10 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] font-body transition-all shadow-sm",
                            "focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]",
                            errors.bankName ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 hover:border-gray-300'
                          )}
                        />
                        <button
                          type="button"
                          id="bank-dropdown-toggle"
                          tabIndex={-1}
                          onClick={() => setIsBankOpen(prev => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-[#0B1F3A] hover:bg-gray-100 transition-colors"
                          title="Click to view bank suggestions"
                        >
                          <ChevronDown size={17} className={clsx("transition-transform duration-200", isBankOpen && "rotate-180 text-[#D4AF37]")} />
                        </button>
                      </div>

                      {/* Native datalist */}
                      <datalist id="bank-presets">
                        {BANK_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value} />
                        ))}
                      </datalist>

                      {/* Floating Dropdown */}
                      <AnimatePresence>
                        {isBankOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden py-1 max-h-60 overflow-y-auto"
                          >
                            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-600">
                              <span>Standard Scheduled Banks</span>
                              <span className="text-[9px] font-medium text-gray-400">Click to pick or type above</span>
                            </div>
                            <div className="p-1 space-y-0.5">
                              {(() => {
                                const q = (formData.bankName || '').trim().toLowerCase();
                                const filtered = q
                                  ? BANK_OPTIONS.filter(opt => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q))
                                  : BANK_OPTIONS;
                                const list = filtered.length > 0 ? filtered : BANK_OPTIONS;

                                return list.map((opt) => {
                                  const isSelected = formData.bankName?.trim().toLowerCase() === opt.value.toLowerCase();
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, bankName: opt.value }));
                                        setIsBankOpen(false);
                                        if (errors.bankName) {
                                          setErrors(prev => {
                                            const n = { ...prev };
                                            delete n.bankName;
                                            return n;
                                          });
                                        }
                                      }}
                                      className={clsx(
                                        "w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors",
                                        isSelected
                                          ? "bg-[#D4AF37]/15 text-[#0B1F3A] font-bold"
                                          : "text-gray-700 hover:bg-amber-50 hover:text-[#0B1F3A]"
                                      )}
                                    >
                                      <span>{opt.label}</span>
                                      {isSelected && <Check size={14} className="text-[#D4AF37] shrink-0" />}
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {errors.bankName && <p className="text-[11px] text-red-500 mt-0.5">{errors.bankName}</p>}
                    </div>

                    {/* Account Number */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Savings Account Number *
                      </label>
                      <input
                        type="password"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        placeholder="Enter A/C Number"
                        className={`w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] font-mono focus:outline-none focus:ring-1 shadow-sm ${
                          errors.accountNumber ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]'
                        }`}
                      />
                      {errors.accountNumber && <span className="text-[11px] text-red-500 font-semibold flex items-center gap-1"><AlertCircle size={12} /> {errors.accountNumber}</span>}
                    </div>

                    {/* Confirm Account Number */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Confirm Account Number *
                      </label>
                      <input
                        type="text"
                        name="confirmAccountNumber"
                        value={formData.confirmAccountNumber}
                        onChange={handleChange}
                        placeholder="Re-enter A/C Number"
                        className={`w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] font-mono focus:outline-none focus:ring-1 shadow-sm ${
                          errors.confirmAccountNumber ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]'
                        }`}
                      />
                      {errors.confirmAccountNumber && <span className="text-[11px] text-red-500 font-semibold flex items-center gap-1"><AlertCircle size={12} /> {errors.confirmAccountNumber}</span>}
                    </div>

                    {/* IFSC Code */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        IFSC Code *
                      </label>
                      <input
                        type="text"
                        name="ifscCode"
                        value={formData.ifscCode}
                        onChange={handleChange}
                        placeholder="SBIN0001234"
                        maxLength={11}
                        className={`w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] uppercase font-mono focus:outline-none focus:ring-1 shadow-sm ${
                          errors.ifscCode ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]'
                        }`}
                      />
                    </div>

                    {/* Account Holder Name */}
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Account Holder Name (as in Passbook) *
                      </label>
                      <input
                        type="text"
                        name="accountHolderName"
                        value={formData.accountHolderName}
                        onChange={handleChange}
                        placeholder="e.g. Meera Devi"
                        className={`w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] font-body focus:outline-none focus:ring-1 shadow-sm ${
                          errors.accountHolderName ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-section C: Document Attachments */}
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <UploadCloud size={14} className="text-[#D4AF37]" /> C. KYC & Passbook Document Attachments
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Borrower Photo Card */}
                    <div className="border-2 border-dashed border-gray-200 hover:border-[#D4AF37] rounded-2xl p-5 text-center bg-[#FAFBFD] transition-all flex flex-col items-center justify-between">
                      <div className="flex flex-col items-center">
                        {photoPreview ? (
                          <div className="relative mb-2">
                            <img src={photoPreview} alt="Borrower" className="w-20 h-20 object-cover rounded-xl border border-[#D4AF37] shadow-sm" />
                            <button
                              type="button"
                              onClick={() => setPhotoPreview(null)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full text-[10px]"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ) : (
                          <UploadCloud size={28} className="text-[#D4AF37] mb-2" />
                        )}
                        <p className="text-xs font-bold text-[#0B1F3A] uppercase">Borrower Passport Photo</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">JPEG / PNG under 5MB</p>
                      </div>
                      <label className="mt-3 px-4 py-2 rounded-lg bg-[#0B1F3A] text-white hover:bg-[#162D4A] text-xs font-bold cursor-pointer transition-all">
                        {photoPreview ? 'Change Photo' : 'Select Photo'}
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>

                    {/* Aadhaar Scan Card */}
                    <div className="border-2 border-dashed border-gray-200 hover:border-[#D4AF37] rounded-2xl p-5 text-center bg-[#FAFBFD] transition-all flex flex-col items-center justify-between">
                      <div className="flex flex-col items-center">
                        {aadhaarPreview ? (
                          <div className="relative mb-2">
                            <img
                              src={aadhaarPreview}
                              alt="Aadhaar Card"
                              className="w-20 h-20 object-cover rounded-xl border border-[#D4AF37] shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setAadhaarPreview(null);
                                setAadhaarDocName(null);
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full text-[10px] hover:bg-red-600 transition-colors shadow-sm"
                              title="Remove file"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ) : (
                          <FileText size={28} className="text-[#0B1F3A] mb-2" />
                        )}
                        <p className="text-xs font-bold text-[#0B1F3A] uppercase">Aadhaar Card Scan (Front & Back)</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[180px]">{aadhaarDocName || 'PDF or Image proof'}</p>
                      </div>
                      <label className="mt-3 px-4 py-2 rounded-lg bg-[#0B1F3A] text-white hover:bg-[#162D4A] text-xs font-bold cursor-pointer transition-all">
                        {aadhaarPreview || aadhaarDocName ? 'Change Aadhaar' : 'Upload Aadhaar'}
                        <input type="file" accept="image/*,.pdf" onChange={(e) => handleDocUpload('aadhaar', e)} className="hidden" />
                      </label>
                    </div>

                    {/* Passbook Scan Card */}
                    <div className="border-2 border-dashed border-gray-200 hover:border-[#D4AF37] rounded-2xl p-5 text-center bg-[#FAFBFD] transition-all flex flex-col items-center justify-between">
                      <div className="flex flex-col items-center">
                        {passbookPreview ? (
                          <div className="relative mb-2">
                            <img
                              src={passbookPreview}
                              alt="Bank Passbook"
                              className="w-20 h-20 object-cover rounded-xl border border-[#D4AF37] shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPassbookPreview(null);
                                setPassbookDocName(null);
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full text-[10px] hover:bg-red-600 transition-colors shadow-sm"
                              title="Remove file"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ) : (
                          <CreditCard size={28} className="text-[#059669] mb-2" />
                        )}
                        <p className="text-xs font-bold text-[#0B1F3A] uppercase">Bank Passbook / Cheque</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[180px]">{passbookDocName || 'Account statement scan'}</p>
                      </div>
                      <label className="mt-3 px-4 py-2 rounded-lg bg-[#0B1F3A] text-white hover:bg-[#162D4A] text-xs font-bold cursor-pointer transition-all">
                        {passbookPreview || passbookDocName ? 'Change Passbook' : 'Upload Passbook'}
                        <input type="file" accept="image/*,.pdf" onChange={(e) => handleDocUpload('passbook', e)} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* STEP 3: NOMINEE & CO-BORROWER GUARANTOR */}
            {/* ══════════════════════════════════════════════════════ */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#0B1F3A] font-body tracking-tight">
                      Section 3: Family Nominee & Co-Borrower Guarantor
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Required for microfinance insurance policy and joint liability group cross-guarantee
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                    Step 1 & 2 Verified ✓
                  </span>
                </div>

                {/* Sub-section A: Nominee Details */}
                <div>
                  <h4 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Users size={14} className="text-[#D4AF37]" /> A. Nominee Particulars
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Nominee Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Nominee Full Name *
                      </label>
                      <input
                        type="text"
                        name="nomineeName"
                        value={formData.nomineeName}
                        onChange={handleChange}
                        placeholder="e.g. Ramesh Kumar"
                        className={`w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] font-body focus:outline-none focus:ring-1 shadow-sm ${
                          errors.nomineeName ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]'
                        }`}
                      />
                      {errors.nomineeName && <span className="text-[11px] text-red-500 font-semibold flex items-center gap-1"><AlertCircle size={12} /> {errors.nomineeName}</span>}
                    </div>

                    {/* Nominee Relation */}
                    <div className="flex flex-col gap-1.5 relative" ref={nomineeRelationRef}>
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Relationship to Borrower *
                      </label>

                      <div className="relative">
                        <input
                          type="text"
                          name="nomineeRelation"
                          id="nominee-relation-input"
                          list="nominee-relation-presets"
                          value={formData.nomineeRelation}
                          onChange={handleChange}
                          onFocus={() => setIsNomineeRelationOpen(true)}
                          placeholder="Select or enter relationship (e.g. Spouse, Mother)..."
                          autoComplete="off"
                          className={clsx(
                            "w-full pl-3.5 pr-10 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] font-body transition-all shadow-sm",
                            "focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]",
                            errors.nomineeRelation ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 hover:border-gray-300'
                          )}
                        />
                        <button
                          type="button"
                          id="nominee-relation-dropdown-toggle"
                          tabIndex={-1}
                          onClick={() => setIsNomineeRelationOpen(prev => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-[#0B1F3A] hover:bg-gray-100 transition-colors"
                          title="Click to view all relationships"
                        >
                          <ChevronDown size={17} className={clsx("transition-transform duration-200", isNomineeRelationOpen && "rotate-180 text-[#D4AF37]")} />
                        </button>
                      </div>

                      {/* Native datalist for quick autocomplete */}
                      <datalist id="nominee-relation-presets">
                        {NOMINEE_RELATION_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value} />
                        ))}
                      </datalist>

                      {/* Dropdown Floating Options Menu */}
                      <AnimatePresence>
                        {isNomineeRelationOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden py-1 max-h-56 overflow-y-auto"
                          >
                            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-600">
                              <span>Standard Relationships</span>
                              <span className="text-[9px] font-medium text-gray-400">Click to pick or type above</span>
                            </div>
                            <div className="p-1 space-y-0.5">
                              {NOMINEE_RELATION_OPTIONS.map((opt) => {
                                const isSelected = formData.nomineeRelation?.trim().toLowerCase() === opt.value.toLowerCase();
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, nomineeRelation: opt.value }));
                                      setIsNomineeRelationOpen(false);
                                      if (errors.nomineeRelation) {
                                        setErrors(prev => {
                                          const n = { ...prev };
                                          delete n.nomineeRelation;
                                          return n;
                                        });
                                      }
                                    }}
                                    className={clsx(
                                      "w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors",
                                      isSelected
                                        ? "bg-[#D4AF37]/15 text-[#0B1F3A] font-bold"
                                        : "text-gray-700 hover:bg-amber-50 hover:text-[#0B1F3A]"
                                    )}
                                  >
                                    <span>{opt.label}</span>
                                    {isSelected && <Check size={14} className="text-[#D4AF37] shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {errors.nomineeRelation && (
                        <p className="text-[11px] text-red-500 mt-0.5">{errors.nomineeRelation}</p>
                      )}
                    </div>

                    {/* Nominee Phone */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Nominee Mobile Phone
                      </label>
                      <input
                        type="tel"
                        name="nomineePhone"
                        value={formData.nomineePhone}
                        onChange={handleChange}
                        placeholder="9840100000"
                        maxLength={10}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0B1F3A] font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                      />
                    </div>

                    {/* Nominee Aadhaar */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Nominee Aadhaar UID
                      </label>
                      <input
                        type="text"
                        name="nomineeAadhaar"
                        value={formData.nomineeAadhaar}
                        onChange={handleChange}
                        placeholder="12-digit UID"
                        maxLength={14}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0B1F3A] font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                      />
                    </div>

                    {/* Nominee Age */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Nominee Age (Years)
                      </label>
                      <input
                        type="number"
                        name="nomineeAge"
                        value={formData.nomineeAge}
                        onChange={handleChange}
                        placeholder="e.g. 32"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0B1F3A] font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                      />
                    </div>

                    {/* Address Checkbox */}
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="nomineeSameAddress"
                        name="nomineeSameAddress"
                        checked={formData.nomineeSameAddress}
                        onChange={handleChange}
                        className="w-4 h-4 rounded text-[#0B1F3A] focus:ring-[#D4AF37]"
                      />
                      <label htmlFor="nomineeSameAddress" className="text-xs font-semibold text-gray-700 cursor-pointer">
                        Same residential address as borrower
                      </label>
                    </div>
                  </div>
                </div>

                {/* Sub-section B: Co-Borrower / Guarantor Details */}
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Shield size={14} className="text-[#D4AF37]" /> B. Co-Borrower / Guarantor Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Guarantor Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Guarantor Full Name *
                      </label>
                      <input
                        type="text"
                        name="guarantorName"
                        value={formData.guarantorName}
                        onChange={handleChange}
                        placeholder="e.g. Ramanathan K"
                        className={`w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] font-body focus:outline-none focus:ring-1 shadow-sm ${
                          errors.guarantorName ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]'
                        }`}
                      />
                      {errors.guarantorName && <span className="text-[11px] text-red-500 font-semibold flex items-center gap-1"><AlertCircle size={12} /> {errors.guarantorName}</span>}
                    </div>

                    {/* Guarantor Relation */}
                    <div className="flex flex-col gap-1.5 relative" ref={guarantorRelationRef}>
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Relationship to Borrower
                      </label>

                      <div className="relative">
                        <input
                          type="text"
                          name="guarantorRelation"
                          id="guarantor-relation-input"
                          list="guarantor-relation-presets"
                          value={formData.guarantorRelation}
                          onChange={handleChange}
                          onFocus={() => setIsGuarantorRelationOpen(true)}
                          placeholder="Select or enter relationship (e.g. Husband, Father)..."
                          autoComplete="off"
                          className="w-full pl-3.5 pr-10 py-3 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-sm text-[#0B1F3A] font-body transition-all shadow-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                        />
                        <button
                          type="button"
                          id="guarantor-relation-dropdown-toggle"
                          tabIndex={-1}
                          onClick={() => setIsGuarantorRelationOpen(prev => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-[#0B1F3A] hover:bg-gray-100 transition-colors"
                          title="Click to view all relationships"
                        >
                          <ChevronDown size={17} className={clsx("transition-transform duration-200", isGuarantorRelationOpen && "rotate-180 text-[#D4AF37]")} />
                        </button>
                      </div>

                      {/* Native datalist for quick autocomplete */}
                      <datalist id="guarantor-relation-presets">
                        {GUARANTOR_RELATION_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value} />
                        ))}
                      </datalist>

                      {/* Dropdown Floating Options Menu */}
                      <AnimatePresence>
                        {isGuarantorRelationOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden py-1 max-h-56 overflow-y-auto"
                          >
                            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-600">
                              <span>Standard Relationships</span>
                              <span className="text-[9px] font-medium text-gray-400">Click to pick or type above</span>
                            </div>
                            <div className="p-1 space-y-0.5">
                              {GUARANTOR_RELATION_OPTIONS.map((opt) => {
                                const isSelected = formData.guarantorRelation?.trim().toLowerCase() === opt.value.toLowerCase();
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, guarantorRelation: opt.value }));
                                      setIsGuarantorRelationOpen(false);
                                    }}
                                    className={clsx(
                                      "w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors",
                                      isSelected
                                        ? "bg-[#D4AF37]/15 text-[#0B1F3A] font-bold"
                                        : "text-gray-700 hover:bg-amber-50 hover:text-[#0B1F3A]"
                                    )}
                                  >
                                    <span>{opt.label}</span>
                                    {isSelected && <Check size={14} className="text-[#D4AF37] shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Guarantor Phone */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Guarantor Phone Number
                      </label>
                      <input
                        type="tel"
                        name="guarantorPhone"
                        value={formData.guarantorPhone}
                        onChange={handleChange}
                        placeholder="9840112233"
                        maxLength={10}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0B1F3A] font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                      />
                    </div>

                    {/* Guarantor Aadhaar */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Guarantor Aadhaar UID
                      </label>
                      <input
                        type="text"
                        name="guarantorAadhaar"
                        value={formData.guarantorAadhaar}
                        onChange={handleChange}
                        placeholder="12 digits"
                        maxLength={14}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0B1F3A] font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                      />
                    </div>

                    {/* Guarantor Monthly Income */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Guarantor Monthly Income (₹)
                      </label>
                      <input
                        type="number"
                        name="guarantorIncome"
                        value={formData.guarantorIncome}
                        onChange={handleChange}
                        placeholder="28000"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0B1F3A] font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                      />
                    </div>

                    {/* Group Guarantee Consent */}
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="groupGuaranteeConsent"
                        name="groupGuaranteeConsent"
                        checked={formData.groupGuaranteeConsent}
                        onChange={handleChange}
                        className="w-4 h-4 rounded text-[#0B1F3A] focus:ring-[#D4AF37]"
                      />
                      <label htmlFor="groupGuaranteeConsent" className="text-xs font-semibold text-gray-700 cursor-pointer">
                        Group Cross-Guarantee Consent Signed
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* STEP 4: LOAN REQUIREMENT & EMI SETUP */}
            {/* ══════════════════════════════════════════════════════ */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#0B1F3A] font-body tracking-tight">
                      Section 4: Microfinance Loan Product & Repayment EMI Setup
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Configure requested principal, loan duration, interest rate, and dynamic weekly EMI computation
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                    Step 1, 2 & 3 Verified ✓
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Loan Configuration Inputs */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Loan Product */}
                    <div className="flex flex-col gap-1.5 relative" ref={loanProductRef}>
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Loan Product Scheme *
                      </label>

                      <div className="relative">
                        <input
                          type="text"
                          name="loanProduct"
                          id="loan-product-input"
                          list="loan-product-presets"
                          value={formData.loanProduct}
                          onChange={handleChange}
                          onFocus={() => setIsLoanProductOpen(true)}
                          placeholder="Select or enter loan product scheme..."
                          autoComplete="off"
                          className={clsx(
                            "w-full pl-3.5 pr-10 py-3 rounded-xl bg-white border text-sm text-[#0B1F3A] font-body transition-all shadow-sm",
                            "focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]",
                            errors.loanProduct ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-200 hover:border-gray-300'
                          )}
                        />
                        <button
                          type="button"
                          id="loan-product-dropdown-toggle"
                          tabIndex={-1}
                          onClick={() => setIsLoanProductOpen(prev => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-[#0B1F3A] hover:bg-gray-100 transition-colors"
                          title="Click to view all loan product schemes"
                        >
                          <ChevronDown size={17} className={clsx("transition-transform duration-200", isLoanProductOpen && "rotate-180 text-[#D4AF37]")} />
                        </button>
                      </div>

                      {/* Native datalist for quick suggestions */}
                      <datalist id="loan-product-presets">
                        {LOAN_PRODUCT_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value} />
                        ))}
                      </datalist>

                      {/* Dropdown Floating Options Menu */}
                      <AnimatePresence>
                        {isLoanProductOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden py-1 max-h-56 overflow-y-auto"
                          >
                            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-600">
                              <span>Standard Loan Schemes</span>
                              <span className="text-[9px] font-medium text-gray-400">Click to pick or type above</span>
                            </div>
                            <div className="p-1 space-y-0.5">
                              {LOAN_PRODUCT_OPTIONS.map((opt) => {
                                const isSelected = formData.loanProduct?.trim().toLowerCase() === opt.value.toLowerCase();
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, loanProduct: opt.value }));
                                      setIsLoanProductOpen(false);
                                      if (errors.loanProduct) {
                                        setErrors(prev => {
                                          const n = { ...prev };
                                          delete n.loanProduct;
                                          return n;
                                        });
                                      }
                                    }}
                                    className={clsx(
                                      "w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors",
                                      isSelected
                                        ? "bg-[#D4AF37]/15 text-[#0B1F3A] font-bold"
                                        : "text-gray-700 hover:bg-amber-50 hover:text-[#0B1F3A]"
                                    )}
                                  >
                                    <span>{opt.label}</span>
                                    {isSelected && <Check size={14} className="text-[#D4AF37] shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {errors.loanProduct && (
                        <p className="text-[11px] text-red-500 mt-0.5">{errors.loanProduct}</p>
                      )}
                    </div>

                    {/* Requested Principal Amount */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Requested Principal Loan Amount (₹) *
                      </label>
                      <input
                        type="number"
                        name="requestedAmount"
                        value={formData.requestedAmount}
                        onChange={handleChange}
                        placeholder="e.g. 25000"
                        className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-200 text-lg font-black text-[#0B1F3A] font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                      />

                      {/* Quick Amount Chips */}
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <span className="text-[11px] font-bold text-gray-400">Quick Select:</span>
                        {QUICK_AMOUNTS.map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, requestedAmount: String(amt) }))}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              Number(formData.requestedAmount) === amt
                                ? 'bg-[#0B1F3A] text-white shadow-sm'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            ₹{(amt / 1000)}k
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Tenor in Weeks */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                          Loan Tenor (Weeks) *
                        </label>
                        <select
                          name="tenorWeeks"
                          value={formData.tenorWeeks}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0B1F3A] font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                        >
                          <option value="">-- Select Loan Tenor --</option>
                          <option value="15">15 Weeks (~3.5 Months)</option>
                          <option value="20">20 Weeks (~4.5 Months)</option>
                          <option value="25">25 Weeks (~6 Months)</option>
                          <option value="30">30 Weeks (~7 Months)</option>
                          <option value="50">50 Weeks (~12 Months)</option>
                        </select>
                      </div>

                      {/* Repayment Frequency */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                          Repayment Cycle *
                        </label>
                        <select
                          name="repaymentFrequency"
                          value={formData.repaymentFrequency}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0B1F3A] font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                        >
                          <option value="">-- Select Repayment Cycle --</option>
                          <option value="Weekly">Weekly Center Collection</option>
                          <option value="Daily">Daily Field Collection</option>
                          <option value="Monthly">Monthly Branch Collection</option>
                        </select>
                      </div>

                      {/* Interest Rate */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                          Interest Rate (% p.a.)
                        </label>
                        <input
                          type="number"
                          name="interestRateAnnual"
                          value={formData.interestRateAnnual}
                          onChange={handleChange}
                          placeholder="e.g. 18"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0B1F3A] font-body focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Purpose of Loan */}
                    <div className="flex flex-col gap-1.5 relative" ref={loanPurposeRef}>
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        End Purpose of Borrowed Funds
                      </label>

                      <div className="relative">
                        <input
                          type="text"
                          name="loanPurpose"
                          id="loan-purpose-input"
                          list="loan-purpose-presets"
                          value={formData.loanPurpose}
                          onChange={handleChange}
                          onFocus={() => setIsLoanPurposeOpen(true)}
                          placeholder="Select or enter loan purpose manually (e.g. Kirana store, dairy farming)..."
                          autoComplete="off"
                          className="w-full pl-3.5 pr-10 py-3 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-sm text-[#0B1F3A] font-body transition-all shadow-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                        />
                        <button
                          type="button"
                          id="loan-purpose-dropdown-toggle"
                          tabIndex={-1}
                          onClick={() => setIsLoanPurposeOpen(prev => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-[#0B1F3A] hover:bg-gray-100 transition-colors"
                          title="Click to view common loan purposes"
                        >
                          <ChevronDown size={17} className={clsx("transition-transform duration-200", isLoanPurposeOpen && "rotate-180 text-[#D4AF37]")} />
                        </button>
                      </div>

                      {/* Native datalist for quick suggestions */}
                      <datalist id="loan-purpose-presets">
                        {LOAN_PURPOSE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value} />
                        ))}
                      </datalist>

                      {/* Dropdown Floating Options Menu */}
                      <AnimatePresence>
                        {isLoanPurposeOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden py-1 max-h-56 overflow-y-auto"
                          >
                            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-600">
                              <span>Standard Loan Purposes</span>
                              <span className="text-[9px] font-medium text-gray-400">Click to pick or type above</span>
                            </div>
                            <div className="p-1 space-y-0.5">
                              {LOAN_PURPOSE_OPTIONS.map((opt) => {
                                const isSelected = formData.loanPurpose?.trim().toLowerCase() === opt.value.toLowerCase();
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, loanPurpose: opt.value }));
                                      setIsLoanPurposeOpen(false);
                                    }}
                                    className={clsx(
                                      "w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors",
                                      isSelected
                                        ? "bg-[#D4AF37]/15 text-[#0B1F3A] font-bold"
                                        : "text-gray-700 hover:bg-amber-50 hover:text-[#0B1F3A]"
                                    )}
                                  >
                                    <span>{opt.label}</span>
                                    {isSelected && <Check size={14} className="text-[#D4AF37] shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Right Column: Live EMI Calculation Summary Card */}
                  <div className="bg-[#FAFBFD] p-6 rounded-2xl border border-[#E5E7EB] flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                        <span className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">EMI Breakdown</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {formData.repaymentFrequency} Cycle
                        </span>
                      </div>

                      <div className="space-y-3 mt-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">Requested Principal:</span>
                          <span className="font-bold text-[#0B1F3A]">₹{loanCalculations.principal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">Tenor:</span>
                          <span className="font-bold text-[#0B1F3A]">{formData.tenorWeeks} Weeks</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">Interest Rate:</span>
                          <span className="font-bold text-[#0B1F3A]">{formData.interestRateAnnual}% p.a.</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">Estimated Total Interest:</span>
                          <span className="font-bold text-[#D4AF37]">₹{loanCalculations.totalInterest.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-200">
                          <span className="text-gray-700 font-bold">Total Repayment:</span>
                          <span className="font-black text-[#0B1F3A] text-sm">₹{loanCalculations.totalPayable.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 rounded-xl bg-[#0B1F3A] text-white">
                      <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider block">
                        Calculated {formData.repaymentFrequency} EMI
                      </span>
                      <p className="text-2xl font-black text-[#D4AF37] font-body mt-0.5">
                        ₹{loanCalculations.weeklyEMI.toLocaleString('en-IN')}
                        <span className="text-xs text-gray-300 font-normal"> / week</span>
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Principal: ₹{loanCalculations.weeklyPrincipal} + Interest: ₹{loanCalculations.weeklyInterest}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* STEP 5: REVIEW, COMPLIANCE & COMPLETE ENROLLMENT */}
            {/* ══════════════════════════════════════════════════════ */}
            {currentStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#0B1F3A] font-body tracking-tight">
                      Section 5: 360° Borrower Profile Review & Field Officer Certification
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Verify complete customer particulars, review compliance declaration, and submit final registration
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                    All 4 Steps Completed ✓
                  </span>
                </div>

                {/* 360° Profile Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Identity & Address */}
                  <div className="bg-[#FAFBFD] p-5 rounded-2xl border border-gray-200 space-y-3">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                      <User size={16} className="text-[#D4AF37]" />
                      <h4 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">Borrower Particulars</h4>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div><span className="text-gray-400 block text-[10px]">FULL NAME</span><span className="font-bold text-[#0B1F3A] text-sm">{formData.fullName}</span></div>
                      <div><span className="text-gray-400 block text-[10px]">FATHER / HUSBAND</span><span className="font-semibold text-gray-800">{formData.guardianName}</span></div>
                      <div><span className="text-gray-400 block text-[10px]">MOBILE NUMBER</span><span className="font-semibold text-blue-600 font-mono">{formData.phone}</span></div>
                      <div><span className="text-gray-400 block text-[10px]">RESIDENTIAL ADDRESS</span><span className="text-gray-700">{formData.address}, {formData.city} - {formData.pincode}</span></div>
                      <div><span className="text-gray-400 block text-[10px]">CENTER & GROUP</span><span className="font-bold text-[#D4AF37]">{formData.centerName} ({formData.groupId})</span></div>
                    </div>
                  </div>

                  {/* Card 2: KYC & Bank Particulars */}
                  <div className="bg-[#FAFBFD] p-5 rounded-2xl border border-gray-200 space-y-3">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                      <Shield size={16} className="text-[#D4AF37]" />
                      <h4 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">KYC & Bank Accounts</h4>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div><span className="text-gray-400 block text-[10px]">AADHAAR NUMBER</span><span className="font-mono font-bold text-[#0B1F3A]">{formData.aadhaarNumber}</span></div>
                      <div><span className="text-gray-400 block text-[10px]">PAN NUMBER</span><span className="font-mono font-semibold text-gray-800">{formData.panNumber || 'Not Submitted'}</span></div>
                      <div><span className="text-gray-400 block text-[10px]">DISBURSAL BANK</span><span className="font-semibold text-gray-800">{formData.bankName}</span></div>
                      <div><span className="text-gray-400 block text-[10px]">ACCOUNT NUMBER</span><span className="font-mono font-bold text-[#059669]">A/C {formData.accountNumber}</span></div>
                      <div><span className="text-gray-400 block text-[10px]">IFSC CODE</span><span className="font-mono text-gray-700">{formData.ifscCode}</span></div>
                    </div>
                  </div>

                  {/* Card 3: Nominee & Loan Setup */}
                  <div className="bg-[#FAFBFD] p-5 rounded-2xl border border-gray-200 space-y-3">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                      <Calculator size={16} className="text-[#D4AF37]" />
                      <h4 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">Nominee & Loan Proposal</h4>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div><span className="text-gray-400 block text-[10px]">NOMINEE</span><span className="font-bold text-[#0B1F3A]">{formData.nomineeName} ({formData.nomineeRelation})</span></div>
                      <div><span className="text-gray-400 block text-[10px]">GUARANTOR</span><span className="font-semibold text-gray-800">{formData.guarantorName} ({formData.guarantorRelation})</span></div>
                      <div><span className="text-gray-400 block text-[10px]">REQUESTED LOAN</span><span className="font-black text-[#0B1F3A] text-sm">₹{loanCalculations.principal.toLocaleString('en-IN')}</span></div>
                      <div><span className="text-gray-400 block text-[10px]">WEEKLY EMI</span><span className="font-black text-[#D4AF37] text-sm">₹{loanCalculations.weeklyEMI.toLocaleString('en-IN')} ({formData.tenorWeeks} wks)</span></div>
                      <div><span className="text-gray-400 block text-[10px]">TOTAL PAYABLE</span><span className="font-bold text-gray-800">₹{loanCalculations.totalPayable.toLocaleString('en-IN')}</span></div>
                    </div>
                  </div>
                </div>

                {/* Field Officer Compliance & Declarations */}
                <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#D4AF37]" /> Field Officer Certification & Verification
                  </h4>

                  <div className="space-y-3">
                    <label className="flex items-start gap-2.5 text-xs text-amber-950 cursor-pointer">
                      <input
                        type="checkbox"
                        name="physicalVisitDone"
                        checked={formData.physicalVisitDone}
                        onChange={handleChange}
                        className="mt-0.5 w-4 h-4 rounded text-[#0B1F3A] focus:ring-[#D4AF37]"
                      />
                      <span>
                        <strong>Physical House & Business Visit Completed:</strong> I certify that I have physically visited the applicant's residence and verified occupation details.
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 text-xs text-amber-950 cursor-pointer">
                      <input
                        type="checkbox"
                        name="originalDocsVerified"
                        checked={formData.originalDocsVerified}
                        onChange={handleChange}
                        className="mt-0.5 w-4 h-4 rounded text-[#0B1F3A] focus:ring-[#D4AF37]"
                      />
                      <span>
                        <strong>Original KYC Documents Verified:</strong> Original Aadhaar UID and Bank Passbook have been inspected in accordance with Golden Leaf Finance compliance guidelines.
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 text-xs text-amber-950 cursor-pointer">
                      <input
                        type="checkbox"
                        name="groupConsentVerified"
                        checked={formData.groupConsentVerified}
                        onChange={handleChange}
                        className="mt-0.5 w-4 h-4 rounded text-[#0B1F3A] focus:ring-[#D4AF37]"
                      />
                      <span>
                        <strong>JLG Group Peer Guarantee Acknowledged:</strong> Center Leader and group members have confirmed mutual guarantee consent.
                      </span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button Navigation Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between mt-10 pt-6 border-t border-[#E5E7EB] gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-xl bg-[#EF4444] text-white hover:bg-[#DC2626] font-bold font-body text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer active:scale-[0.98]"
            >
              <RotateCcw size={15} /> Reset Form
            </button>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-[#0B1F3A] text-white hover:bg-[#162D4A] font-bold font-body text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer active:scale-[0.98]"
                >
                  <ArrowLeft size={15} /> Previous Step
                </button>
              )}

              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 min-h-[44px] rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] text-[#0B1F3A] font-bold font-body text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-[0.98]"
                >
                  Proceed to {steps[currentStep + 1].label.replace(/^\d+\.\s*/, '')} <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 min-h-[48px] rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] text-[#0B1F3A] font-black font-body text-sm uppercase tracking-wider transition-all shadow-xl cursor-pointer active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Saving Customer...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Complete Customer Registration
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CustomerRegistrationPage;
