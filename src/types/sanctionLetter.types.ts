// ──────────────────────────────────────────────────
// Golden Leaf Finance — Sanction Letter & Terms Types
// Enterprise NBFC Document Specification
// ──────────────────────────────────────────────────

export type DocumentLanguage = 'en' | 'ta' | 'bilingual';
export type DocumentViewSection = 'all' | 'schedule' | 'clauses' | 'signatures';

export interface SanctionLetterRecord {
  loanAccountNo: string;
  applicationFormNo: string;
  applicationDate: string;
  sanctionDate: string;
  place: string;
  branchName: string;
  branchCode: string;

  // Applicant & Co-Applicants
  applicantName: string;
  applicantPhone: string;
  applicantAddress: string;
  applicantPan?: string;
  applicantAadhaarMasked?: string;

  coApplicant1Name: string;
  coApplicant1Relation?: string;
  coApplicant2Name: string;
  coApplicant2Relation?: string;

  // Financial Slabs
  loanProduct: string;
  loanPurpose: string;
  fixedRoi: number;
  loanAmount: number; // (A)
  tenureMonths: number;
  numberOfEmis: number;
  tentativeEmiAmount: number;

  // Deductions (B)
  documentationCharges: number;
  gstOnCharges: number;
  lifeInsurancePremium: number;
  generalInsurancePremium: number;
  stampDutyCharges: number;
  otherFacilitationFees?: number;
  totalChargesDeducted: number; // (B)

  // Prior Loan Foreclosure (C)
  existingLoanForeclosureAmount: number; // (C)

  // Net Disbursal (A - B - C)
  netDisbursementAmount: number;

  // Repayment Details
  repaymentMode: string; // e.g. NACH
  repaymentFrequency: string; // Monthly
  emiDueDate: number; // e.g. 3rd of each month
  moratorium: string;

  // Delinquency & Charges
  penalChargesText: string;
  chequeBounceChargesText: string;
  swapChargesText: string;
  foreclosureChargesText: string;
  foreclosureLockInDays: number;
  partPaymentChargesText: string;

  // Officers & Signatories
  authorisedOfficerName: string;
  authorisedOfficerEmpId: string;
  creditManagerName?: string;
  branchManagerName?: string;

  // Digital E-Sign State (IT Act 2000)
  isElectronicallySigned?: boolean;
  eSignTimestamp?: string;
  eSignOtpReference?: string;
  eSignSignerName?: string;
}
