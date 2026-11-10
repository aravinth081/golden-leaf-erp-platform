// ──────────────────────────────────────────────────
// Golden Leaf Finance — Gold Loan Type Definitions
// Production-Ready • Appraisal & Vault Register • CRO 3-Field Referral
// ──────────────────────────────────────────────────

export type GoldCaratPurity = '18K' | '20K' | '22K';

export type GoldOrnamentType =
  | 'Chain'
  | 'Thali Chain'
  | 'Necklace'
  | 'Haram'
  | 'Bangles'
  | 'Bracelet'
  | 'Ring'
  | 'Earrings / Studs'
  | 'Waist Belt'
  | 'Locket'
  | 'Other Ornaments';

export type GoldRepaymentScheme =
  | 'Monthly Interest Servicing'
  | 'Bullet Repayment (3 Months)'
  | 'Bullet Repayment (6 Months)'
  | 'Bullet Repayment (12 Months)'
  | 'Monthly EMI';

export type GoldLoanStatus =
  | 'PENDING_APPRAISAL'          // Referral received from CRO, awaiting branch walk-in
  | 'APPRAISED_AWAITING_VAULT'    // Appraised, awaiting dual-custody vault lock
  | 'VAULT_LOCKED_PENDING_UTR'    // Sealed in packet & locked in safe; awaiting Admin UTR
  | 'ACTIVE_IN_VAULT'            // Disbursed, ornaments held in safe vault
  | 'OVERDUE_NOTICE_1'           // 1st Reminder Notice sent
  | 'OVERDUE_NOTICE_2'           // 2nd Reminder Notice sent
  | 'AUCTION_INTIMATION'         // Final Auction Intimation Notice generated
  | 'RENEWED_REPLEDGED'          // Settled previous interest, re-pledged under fresh account
  | 'REDEEMED_PACKET_RELEASED';  // Full principal + interest paid, packet handed back to borrower

export interface GoldRateMaster {
  daily22KRatePerGram: number; // e.g. Rs. 5,850
  maxPermittedLtvPercent: number; // e.g. 75%
  updatedAt: string;
  updatedByAdminName: string;
}

export interface CroGoldReferral {
  id: string; // e.g. GLF-REF-2026-001
  customerName: string;
  customerMobile: string;
  employeeId: string; // CRO Employee Code (e.g. GLF-CRO-105)
  referredAt: string;
  branchId: string;
  status: 'PENDING' | 'CONVERTED' | 'EXPIRED';
  convertedGoldLoanId?: string;
  notes?: string;
}

export interface GoldAppraisalItem {
  id: string;
  ornamentType: GoldOrnamentType;
  quantity: number;
  grossWeightGrams: number;
  stoneDeductionGrams: number;
  netWeightGrams: number; // Gross - Stone
  caratPurity: GoldCaratPurity;
  ratePerGram: number; // Derived from daily rate & carat formula
  eligibleMarketValue: number; // Net Wt * Rate/g
  conditionRemarks?: string; // Missing stones, bent hooks, etc.
}

export interface DualCustodyVaultSignoff {
  isCreditManagerAppraised: boolean;
  creditManagerName?: string;
  creditManagerSignedAt?: string;

  isBranchManagerVaultLocked: boolean;
  branchManagerName?: string;
  branchManagerSignedAt?: string;
}

export interface GoldInterestPaymentRecord {
  id: string;
  receiptNo: string;
  paymentDate: string;
  periodCoveredMonth: string;
  interestAmountPaid: number;
  penalInterestPaid?: number;
  collectedBy: string;
  paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER';
}

export interface GoldOverdueNoticeRecord {
  stage: 'NOTICE_1' | 'NOTICE_2' | 'AUCTION_INTIMATION';
  generatedDate: string;
  dispatchMode: 'SMS' | 'REGISTERED_POST' | 'IN_PERSON';
  daysOverdue: number;
  demandedAmount: number;
  auctionScheduledDate?: string;
}

export interface GoldRedemptionRecord {
  redemptionDate: string;
  totalPrincipalPaid: number;
  exactDayAccruedInterestPaid: number;
  totalSettledAmount: number;
  receiptNo: string;
  isOriginalPawnTicketSurrendered: boolean;
  isOrnamentTrayMatched: boolean;
  tamperProofPacketSerialVerified: string;
  releasedByBranchManager: string;
  borrowerAcknowledgedSignature: string;
  nocCertificateNo: string;
}

export interface GoldLoanRecord {
  id: string; // e.g. GLF-GL-2026-0001
  branchId: string;
  branchName: string;
  status: GoldLoanStatus;
  createdAt: string;
  updatedAt: string;

  // CRO Referral Association
  croReferralId?: string;
  referringEmployeeId?: string; // e.g. GLF-CRO-105

  // Borrower KYC & Nominee
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  aadhaarNumber: string;
  panNumber: string;
  nomineeName: string;
  nomineeRelationship: string;
  legalOwnershipDeclared: boolean;

  // Appraisal Itemization & Totals
  items: GoldAppraisalItem[];
  totalQuantity: number;
  totalGrossWeightGrams: number;
  totalStoneDeductionGrams: number;
  totalNetWeightGrams: number;
  totalAppraisedEligibleValue: number;

  // Live Captured Media
  liveOrnamentTrayPhotoUrl?: string; // High-res tray photo with weighing scale
  liveCustomerCounterPhotoUrl?: string; // Live photo of borrower at counter

  // Loan Scheme & Financials
  maxEligibleLoanAmount: number; // based on LTV (<= 75% of eligible value)
  sanctionedLoanAmount: number; // Requested / sanctioned
  repaymentScheme: GoldRepaymentScheme;
  tenureMonths: number;
  interestRateAnnual: number; // % p.a.
  monthlyInterestAmount: number;
  appraiserFeeAmount: number;
  netDisbursedAmount: number;
  maturityDate: string;

  // Tamper-Proof Vault Identification
  tamperProofPacketSerialNo: string; // e.g. GLF-PKT-2026-0412
  safeVaultLocation: {
    safeNumber: string; // e.g. Safe-01
    rackCabinet: string; // e.g. Rack-B
    traySlot: string;    // e.g. Tray-04
  };

  // Dual-Custody Vault Verification
  dualCustodySignoff: DualCustodyVaultSignoff;

  // Admin Disbursement
  adminUtrReference?: string;
  disbursedAt?: string;
  disbursedByAdminName?: string;

  // Operational Ledgers
  interestPayments: GoldInterestPaymentRecord[];
  totalInterestCollected: number;
  overdueNotices: GoldOverdueNoticeRecord[];

  // Redemption & Release Slip
  redemption?: GoldRedemptionRecord;
}
