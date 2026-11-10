// ──────────────────────────────────────────────────
// Golden Leaf Finance — Investor Types
// Strict typing for Investor master module (Admin Only)
// ──────────────────────────────────────────────────

export type InvestorCategory =
  | 'Individual'
  | 'Company Director'
  | 'Promoter'
  | 'Shareholder'
  | 'Partnership Firm'
  | 'HUF'
  | 'Senior Citizen';

export type TaxDeclaration = '15G' | '15H' | 'Standard TDS';

export type InvestorKYCStatus = 'Verified' | 'Pending' | 'Rejected';

export interface InvestorAddress {
  doorNo: string;
  street: string;
  town: string;
  district: string;
  state: string;
  pinCode: string;
}

export interface InvestorBankAccount {
  holderName: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  ifsc: string;
  accountType: 'Savings' | 'Current';
  payoutMode: 'NEFT' | 'RTGS' | 'IMPS' | 'UPI';
}

export interface InvestorDocuments {
  photoUrl?: string;
  panCopyUrl?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  chequeCopyUrl?: string;
  signatureUrl?: string;
}

export interface Investor {
  id: string;
  investorId: string; // e.g. GLF-INV-0001
  companyId: string;
  branchId: string;
  branchName: string;
  category: InvestorCategory;
  fullName: string; // As per PAN
  fatherSpouseName: string;
  dob: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  primaryMobile: string; // 10 digits
  secondaryMobile?: string;
  email?: string;
  address: InvestorAddress;
  pan: string; // 10 chars
  aadhaar: string; // 12 digits
  taxDeclaration: TaxDeclaration;
  kycStatus: InvestorKYCStatus;
  documents: InvestorDocuments;
  bankAccount: InvestorBankAccount;
  activeFDsCount: number;
  totalPrincipal: number;
  monthlyInterest: number;
  isDeleted?: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface InvestorFormData {
  category: InvestorCategory;
  fullName: string;
  fatherSpouseName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  primaryMobile: string;
  secondaryMobile?: string;
  email?: string;
  doorNo: string;
  street: string;
  town: string;
  district: string;
  state: string;
  pinCode: string;
  branchId: string;
  branchName: string;
  pan: string;
  aadhaar: string;
  taxDeclaration: TaxDeclaration;
  bankHolderName: string;
  bankName: string;
  bankBranch: string;
  accountNumber: string;
  accountNumberConfirm: string;
  ifsc: string;
  accountType: 'Savings' | 'Current';
  payoutMode: 'NEFT' | 'RTGS' | 'IMPS' | 'UPI';
  documents?: InvestorDocuments;
}
