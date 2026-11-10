// ──────────────────────────────────────────────────
// Golden Leaf Finance — Business Loan Type Definitions
// Production-Ready • 4-Box Layout • 5-Doc Checklist • 3-Step Pre-Closure
// ──────────────────────────────────────────────────

export type BusinessLoanCategory =
  | 'Retail / Kirana Shop'
  | 'Wholesale Trader'
  | 'Textiles & Garments'
  | 'Hotel / Bakery / Food'
  | 'Service & Repair Workshop'
  | 'Small Manufacturing'
  | 'Other';

export type BusinessPremisesType = 'Owned Shop' | 'Rented Shop';

export type BusinessRepaymentFrequency = 'Daily' | 'Weekly' | 'Monthly';

export type BusinessLoanStatus =
  | 'SUBMITTED_BY_CRO'        // Blue Badge: Created by CRO, waiting in CM queue
  | 'RETURNED_TO_CRO'         // Amber Badge: Returned by CM due to KYC/doc mistake
  | 'BRANCH_VERIFIED'         // Purple Badge: CM verified & BM sanctioned; awaiting Admin UTR
  | 'ACTIVE_COLLECTING'       // Emerald Green Badge: Disbursed, actively collecting
  | 'PRE_CLOSURE_REQUESTED'   // Crimson Badge: Pre-closure step 1 initiated by CRO
  | 'CLOSED_NOC_ISSUED';      // Slate Blue Badge: Admin approved closure, NOC issued

export interface BusinessCoApplicant {
  fullName: string;
  relationship: 'Spouse' | 'Father' | 'Mother' | 'Brother' | 'Partner' | 'Other';
  mobileNo: string;
  aadhaarNo: string;
  panNo: string;
  photoUrl?: string;
}

export interface BusinessDocumentItem {
  id: string;
  title: string;
  description: string;
  fileUrl?: string;
  fileName?: string;
  uploadedAt?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  remarks?: string;
}

export interface BusinessLoanDocumentChecklist {
  applicantAndGuarantorPhotos: BusinessDocumentItem;
  personalKycProofs: BusinessDocumentItem; // Aadhaar & PAN front/back
  liveShopPhoto: BusinessDocumentItem;     // Live photo with owner & nameboard
  businessProof: BusinessDocumentItem;     // MSME / GST / Trade License / Rental Deed / EB bill
  bankingProof: BusinessDocumentItem;      // Passbook / statement / cheque
}

export interface BusinessLoanCollectionRecord {
  id: string;
  loanId: string;
  receiptNo: string;
  collectionType: 'STANDARD' | 'ADVANCE';
  amountPaid: number;
  installmentsCovered: number;
  collectionDate: string;
  collectedByCroId: string;
  collectedByCroName: string;
  paymentMode: 'CASH' | 'UPI' | 'NEFT';
  notes?: string;
}

export interface BusinessLoanPreClosureInfo {
  initiatedByCroId?: string;
  initiatedByCroName?: string;
  initiatedAt?: string;
  croRemarks?: string;

  bmVerifiedBy?: string;
  bmVerifiedAt?: string;
  bmZeroOutstandingConfirmed?: boolean;
  bmRemarks?: string;

  adminApprovedBy?: string;
  adminApprovedAt?: string;
  adminUtrOrRef?: string;
  nocIssuedAt?: string;
  nocCertificateNo?: string;
  closureReason?: string;
}

export interface BusinessLoanRecord {
  id: string; // e.g. GLF-BL-2026-0001
  branchId: string;
  branchName: string;
  originatingCroId: string;
  originatingCroName: string;
  status: BusinessLoanStatus;
  createdAt: string;
  updatedAt: string;

  // ── BOX 1: APPLICANT & CO-APPLICANT DETAILS ──
  customerName: string;
  fatherOrSpouseName: string;
  dob: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  primaryMobile: string;
  alternateMobile?: string;
  residentialAddress: string;
  pinCode: string;
  aadhaarNumber: string;
  panNumber: string;
  coApplicant: BusinessCoApplicant;

  // ── BOX 2: SIMPLE BUSINESS / SHOP PROFILE ──
  businessName: string; // As on nameboard
  businessCategory: BusinessLoanCategory;
  premisesType: BusinessPremisesType;
  monthlyRentAmount?: number;
  rentalAgreementUrl?: string;
  businessVintageYears: number;
  shopAddress: string;
  gpsLocationTag?: string;
  estimatedDailySales: number;
  estimatedMonthlyTurnover: number;
  netMonthlyBusinessIncome: number;
  hasExistingLoanObligations: boolean;
  existingMonthlyEmiAmount?: number;
  isRepeatCustomer?: boolean;

  // ── BOX 3: LOAN TERMS & AUTO-EMI CALCULATOR ──
  requestedAmount: number; // Rs. 25,000 to Rs. 5,00,000
  sanctionedAmount: number;
  collectionFrequency: BusinessRepaymentFrequency;
  tenureUnits: number; // e.g. 100 Days / 25 Weeks / 12 Months
  interestRateAnnual: number; // % p.a.
  interestType: 'FLAT' | 'REDUCING';
  processingFeeAmount: number;
  documentChargesAmount: number;
  insuranceChargesAmount: number;
  totalUpfrontDeductions: number;
  netDisbursementAmount: number; // Sanctioned - Deductions
  exactEmiPerPeriod: number; // per Day / Week / Month
  totalInterestPayable: number;
  totalRepayableAmount: number;
  installmentStartDate: string;
  installmentEndDate: string;

  // Customer Bank Account
  customerBankName: string;
  customerBankAccountNo: string;
  customerBankIfsc: string;

  // Admin Disbursement Execution
  disbursementMode?: 'NEFT' | 'IMPS' | 'RTGS' | 'CHEQUE';
  adminDisbursementUtr?: string;
  disbursedAt?: string;
  disbursedByAdminName?: string;

  // ── BOX 4: CLEAN 5-DOC CHECKLIST & REVIEWS ──
  documents: BusinessLoanDocumentChecklist;

  // Credit Manager Review Logs
  cmReviewedBy?: string;
  cmReviewedAt?: string;
  cmRemarks?: string;
  returnReason?: string;

  // Branch Manager Review Logs
  bmSanctionedBy?: string;
  bmSanctionedAt?: string;
  bmRemarks?: string;

  // Active Collection Ledger
  totalCollectedTillDate: number;
  pendingOutstandingBalance: number;
  installmentsPaidCount: number;
  totalInstallmentsCount: number;
  collections: BusinessLoanCollectionRecord[];

  // Pre-Closure 3-Step Lifecycle
  preClosure?: BusinessLoanPreClosureInfo;
}
