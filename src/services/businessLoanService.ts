// ──────────────────────────────────────────────────
// Golden Leaf Finance — Business Loan Service
// State Management, 4-Box Form Origination, 5-Doc Checks & 3-Step Pre-Closure
// ──────────────────────────────────────────────────

import {
  type BusinessLoanRecord,
  type BusinessLoanCollectionRecord,
} from '../types/businessLoan.types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { creditManagerService } from './creditManagerService';

const STORAGE_KEY = 'glf_business_loans_v2';

export const REPEAT_BUSINESS_CUSTOMERS: any[] = [];

const INITIAL_BUSINESS_LOANS: BusinessLoanRecord[] = [
  {
    id: 'GLF-BL-2026-0003',
    branchId: 'BR-6805',
    branchName: 'GOBI MAIN BRANCH',
    originatingCroId: 'GLF007',
    originatingCroName: 'SARAVANAN',
    status: 'SUBMITTED_BY_CRO',
    createdAt: '23/11/2026, 08:13:00 am',
    updatedAt: '23/11/2026, 08:13:00 am',

    customerName: 'manikandan',
    fatherOrSpouseName: 'SAGADEVAN',
    dob: '2000-01-01',
    age: 26,
    gender: 'Male',
    primaryMobile: '7887756452',
    alternateMobile: '8768465456',
    residentialAddress: '638116',
    pinCode: '638116',
    aadhaarNumber: '789786789679',
    panNumber: 'GGZPK7845F',
    coApplicant: {
      fullName: 'sagadevan',
      relationship: 'Father',
      mobileNo: '8768465456',
      aadhaarNo: '787867885454',
      panNo: 'XXXXX0000X',
    },

    businessName: 'velan grocery',
    businessCategory: 'Retail / Kirana Shop',
    premisesType: 'Owned Shop',
    businessVintageYears: 5,
    shopAddress: '15 ERODE MAIN ROAD KAVINDAPADI',
    gpsLocationTag: '12.9716° N, 80.2435° E',
    estimatedDailySales: 1000,
    estimatedMonthlyTurnover: 30000,
    netMonthlyBusinessIncome: 20000,
    hasExistingLoanObligations: false,
    isRepeatCustomer: false,

    requestedAmount: 25000,
    sanctionedAmount: 25000,
    collectionFrequency: 'Daily',
    tenureUnits: 100,
    interestRateAnnual: 24,
    interestType: 'FLAT',
    processingFeeAmount: 500,
    documentChargesAmount: 1000,
    insuranceChargesAmount: 800,
    totalUpfrontDeductions: 2300,
    netDisbursementAmount: 22700,
    exactEmiPerPeriod: 275,
    totalInterestPayable: 1644,
    totalRepayableAmount: 26644,
    installmentStartDate: '2026-11-23',
    installmentEndDate: '2027-03-03',

    customerBankName: 'State Bank of India',
    customerBankAccountNo: '787865464646',
    customerBankIfsc: 'SBIN0001245',

    documents: {
      applicantAndGuarantorPhotos: {
        id: 'DOC-1',
        title: 'Applicant & Guarantor Photos',
        description: 'Personal KYC Photos',
        status: 'VERIFIED',
      },
      personalKycProofs: {
        id: 'DOC-2',
        title: 'Personal KYC Proofs (Aadhaar & PAN)',
        description: 'Aadhaar & PAN Scans',
        status: 'VERIFIED',
      },
      liveShopPhoto: {
        id: 'DOC-3',
        title: 'Live Shop Photo with Nameboard',
        description: 'Shop photo at kavindapadi',
        status: 'VERIFIED',
      },
      businessProof: {
        id: 'DOC-4',
        title: 'Business Proof (MSME/GST/License)',
        description: 'Trade License',
        status: 'VERIFIED',
      },
      bankingProof: {
        id: 'DOC-5',
        title: 'Banking Proof (Passbook/Statement)',
        description: 'SBI Passbook Front Page',
        status: 'VERIFIED',
      },
    },

    totalCollectedTillDate: 0,
    pendingOutstandingBalance: 25000,
    installmentsPaidCount: 0,
    totalInstallmentsCount: 100,
    collections: [],
  },
];

class BusinessLoanService {
  private loans: BusinessLoanRecord[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.loans = Array.isArray(parsed) && parsed.length > 0 ? parsed : [...INITIAL_BUSINESS_LOANS];
      } else {
        this.loans = [...INITIAL_BUSINESS_LOANS];
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.loans));
      } catch {}
      this.syncAllToCreditManager();
    } catch {
      this.loans = [...INITIAL_BUSINESS_LOANS];
    }

    if (isSupabaseConfigured() && supabase) {
      void (async () => {
        try {
          const { data: rows, error } = await supabase!
            .from('documents')
            .select('data')
            .eq('collection', 'business_loans')
            .eq('is_deleted', false);
          if (!error && Array.isArray(rows) && rows.length > 0) {
            const cloudLoans = rows.map((r: any) => r.data).filter(Boolean);
            this.loans = cloudLoans;
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudLoans));
            } catch {}
            this.syncAllToCreditManager();
          }
        } catch (e: unknown) {
          console.warn('[Supabase] Failed to fetch business loans:', e);
        }
      })();
    }
  }

  public syncToCreditManager(loan: BusinessLoanRecord) {
    try {
      creditManagerService.addApplicant({
        customerId: loan.id,
        customerName: loan.customerName,
        fatherOrSpouseName: loan.fatherOrSpouseName || 'Guardian',
        phone: loan.primaryMobile || '+91 98400 00000',
        alternatePhone: loan.alternateMobile,
        address: `${loan.residentialAddress || ''}${loan.pinCode ? ', ' + loan.pinCode : ''}`,
        city: loan.branchName || 'Main Branch',
        branchId: loan.branchId || 'BR-01',
        centerName: 'Business Loan Division',
        groupName: `${loan.businessName || 'Business Enterprise'} (${loan.businessCategory})`,
        occupation: loan.businessCategory,
        monthlyIncome: loan.netMonthlyBusinessIncome || loan.estimatedMonthlyTurnover || 50000,
        monthlyExpenses: Math.round((loan.netMonthlyBusinessIncome || 50000) * 0.4),
        loanAmount: loan.sanctionedAmount || loan.requestedAmount || 50000,
        loanProduct: `Business Loan (${loan.collectionFrequency})`,
        tenorWeeks:
          loan.collectionFrequency === 'Daily'
            ? Math.max(1, Math.round(loan.tenureUnits / 7))
            : loan.collectionFrequency === 'Weekly'
            ? loan.tenureUnits
            : loan.tenureUnits * 4,
        proposedEmi: loan.exactEmiPerPeriod || 500,
        loanPurpose: `${loan.businessName || 'Shop'} - ${loan.premisesType}`,
        customerVerificationStatus:
          loan.status === 'RETURNED_TO_CRO'
            ? 'Rejected'
            : loan.cmReviewedBy
            ? 'Verified'
            : 'Pending',
        customerVerificationRemarks: loan.returnReason || loan.cmRemarks,
        aadhaarNumber: loan.aadhaarNumber || 'XXXX-XXXX-0000',
        panNumber: loan.panNumber,
        customerPhotoUrl: loan.documents?.applicantAndGuarantorPhotos?.fileUrl,
        aadhaarFrontUrl: loan.documents?.personalKycProofs?.fileUrl,
        panCardUrl: loan.documents?.businessProof?.fileUrl,
        documents: [
          {
            id: 'DOC-1',
            name: 'Applicant & Guarantor Photos',
            type: 'photo',
            fileName: 'applicant_photos.jpg',
            fileUrl: loan.documents?.applicantAndGuarantorPhotos?.fileUrl,
            status: loan.documents?.applicantAndGuarantorPhotos?.status === 'VERIFIED' ? 'verified' : 'pending',
          },
          {
            id: 'DOC-2',
            name: 'Personal KYC Proofs (Aadhaar & PAN)',
            type: 'aadhaar',
            fileName: 'personal_kyc.pdf',
            fileUrl: loan.documents?.personalKycProofs?.fileUrl,
            status: loan.documents?.personalKycProofs?.status === 'VERIFIED' ? 'verified' : 'pending',
          },
          {
            id: 'DOC-3',
            name: 'Mandatory Live Shop Photo with Owner',
            type: 'address_proof',
            fileName: 'shop_photo.jpg',
            fileUrl: loan.documents?.liveShopPhoto?.fileUrl,
            status: loan.documents?.liveShopPhoto?.status === 'VERIFIED' ? 'verified' : 'pending',
          },
          {
            id: 'DOC-4',
            name: 'Business Proof (MSME/GST/License)',
            type: 'business_proof',
            fileName: 'business_proof.pdf',
            fileUrl: loan.documents?.businessProof?.fileUrl,
            status: loan.documents?.businessProof?.status === 'VERIFIED' ? 'verified' : 'pending',
          },
          {
            id: 'DOC-5',
            name: 'Banking Proof (Passbook/Statement)',
            type: 'bank_statement',
            fileName: 'bank_proof.pdf',
            fileUrl: loan.documents?.bankingProof?.fileUrl,
            status: loan.documents?.bankingProof?.status === 'VERIFIED' ? 'verified' : 'pending',
          },
        ],
        history: [
          {
            date: loan.createdAt || new Date().toLocaleDateString('en-IN'),
            event: 'Business Loan Application Submitted',
            remarks: `Submitted by ${loan.originatingCroName} (${loan.originatingCroId}) - ₹${loan.requestedAmount.toLocaleString('en-IN')}`,
          },
        ],
      });
    } catch (err) {
      console.warn('Failed to sync business loan to creditManagerService:', err);
    }
  }

  public syncAllToCreditManager() {
    this.loans.forEach((loan) => {
      this.syncToCreditManager(loan);
    });
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.loans));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('glf-business-loan-updated'));
      }
    } catch (e) {
      console.warn('Failed to save business loans state:', e);
    }

    if (isSupabaseConfigured() && supabase && this.loans.length > 0) {
      const upsertRows = this.loans.map((loan) => ({
        collection: 'business_loans',
        id: loan.id,
        data: loan,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      void supabase.from('documents').upsert(upsertRows);
    }
  }

  public getLoans(): BusinessLoanRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.loans = parsed;
        }
      }
    } catch {}
    return [...this.loans];
  }

  public getLoanById(id: string): BusinessLoanRecord | undefined {
    return this.loans.find((l) => l.id.toLowerCase() === id.toLowerCase());
  }

  public searchLoans(term: string): BusinessLoanRecord[] {
    const q = term.toLowerCase().trim();
    if (!q) return this.getLoans();
    return this.loans.filter(
      (l) =>
        l.customerName.toLowerCase().includes(q) ||
        l.primaryMobile.includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.businessName.toLowerCase().includes(q)
    );
  }

  public findRepeatCustomerByMobile(mobile: string) {
    const clean = mobile.replace(/[^0-9]/g, '').slice(-10);
    const existing = this.loans.find((l) => l.primaryMobile.replace(/[^0-9]/g, '').slice(-10) === clean);
    if (existing) {
      return {
        primaryMobile: existing.primaryMobile,
        customerName: existing.customerName,
        fatherOrSpouseName: existing.fatherOrSpouseName,
        dob: existing.dob,
        age: existing.age,
        gender: existing.gender,
        alternateMobile: existing.alternateMobile,
        residentialAddress: existing.residentialAddress,
        pinCode: existing.pinCode,
        aadhaarNumber: existing.aadhaarNumber,
        panNumber: existing.panNumber,
        coApplicant: existing.coApplicant,
        businessName: existing.businessName,
        businessCategory: existing.businessCategory,
        premisesType: existing.premisesType,
        businessVintageYears: existing.businessVintageYears,
        shopAddress: existing.shopAddress,
        gpsLocationTag: existing.gpsLocationTag,
        estimatedDailySales: existing.estimatedDailySales,
        estimatedMonthlyTurnover: existing.estimatedMonthlyTurnover,
        netMonthlyBusinessIncome: existing.netMonthlyBusinessIncome,
        hasExistingLoanObligations: existing.hasExistingLoanObligations,
        customerBankName: existing.customerBankName,
        customerBankAccountNo: existing.customerBankAccountNo,
        customerBankIfsc: existing.customerBankIfsc,
      };
    }
    return undefined;
  }

  public createApplication(data: Partial<BusinessLoanRecord>): BusinessLoanRecord {
    const year = new Date().getFullYear();
    const count = this.loans.length + 1;
    const newId = `GLF-BL-${year}-${count.toString().padStart(4, '0')}`;

    const newRecord: BusinessLoanRecord = {
      id: newId,
      branchId: data.branchId || 'BR-01',
      branchName: data.branchName || 'Main Branch',
      originatingCroId: data.originatingCroId || 'GLF-CRO-101',
      originatingCroName: data.originatingCroName || 'Current CRO',
      status: 'SUBMITTED_BY_CRO',
      createdAt: new Date().toLocaleString('en-IN'),
      updatedAt: new Date().toLocaleString('en-IN'),

      customerName: data.customerName || '',
      fatherOrSpouseName: data.fatherOrSpouseName || '',
      dob: data.dob || '1990-01-01',
      age: data.age || 35,
      gender: data.gender || 'Male',
      primaryMobile: data.primaryMobile || '',
      alternateMobile: data.alternateMobile || '',
      residentialAddress: data.residentialAddress || '',
      pinCode: data.pinCode || '',
      aadhaarNumber: data.aadhaarNumber || '',
      panNumber: data.panNumber || '',
      coApplicant: data.coApplicant || {
        fullName: '',
        relationship: 'Spouse',
        mobileNo: '',
        aadhaarNo: '',
        panNo: '',
      },

      businessName: data.businessName || '',
      businessCategory: data.businessCategory || 'Retail / Kirana Shop',
      premisesType: data.premisesType || 'Owned Shop',
      monthlyRentAmount: data.monthlyRentAmount,
      businessVintageYears: data.businessVintageYears || 1,
      shopAddress: data.shopAddress || '',
      gpsLocationTag: data.gpsLocationTag,
      estimatedDailySales: data.estimatedDailySales || 0,
      estimatedMonthlyTurnover: data.estimatedMonthlyTurnover || 0,
      netMonthlyBusinessIncome: data.netMonthlyBusinessIncome || 0,
      hasExistingLoanObligations: data.hasExistingLoanObligations || false,
      existingMonthlyEmiAmount: data.existingMonthlyEmiAmount,
      isRepeatCustomer: data.isRepeatCustomer || false,

      requestedAmount: data.requestedAmount || 50000,
      sanctionedAmount: data.sanctionedAmount || data.requestedAmount || 50000,
      collectionFrequency: data.collectionFrequency || 'Daily',
      tenureUnits: data.tenureUnits || 100,
      interestRateAnnual: data.interestRateAnnual || 24,
      interestType: data.interestType || 'FLAT',
      processingFeeAmount: data.processingFeeAmount || 1000,
      documentChargesAmount: data.documentChargesAmount || 500,
      insuranceChargesAmount: data.insuranceChargesAmount || 400,
      totalUpfrontDeductions: data.totalUpfrontDeductions || 1900,
      netDisbursementAmount: data.netDisbursementAmount || 48100,
      exactEmiPerPeriod: data.exactEmiPerPeriod || 600,
      totalInterestPayable: data.totalInterestPayable || 10000,
      totalRepayableAmount: data.totalRepayableAmount || 60000,
      installmentStartDate: data.installmentStartDate || new Date().toISOString().slice(0, 10),
      installmentEndDate: data.installmentEndDate || new Date().toISOString().slice(0, 10),

      customerBankName: data.customerBankName || '',
      customerBankAccountNo: data.customerBankAccountNo || '',
      customerBankIfsc: data.customerBankIfsc || '',

      documents: data.documents || {
        applicantAndGuarantorPhotos: { id: 'DOC-1', title: 'Applicant & Guarantor Photos', description: 'Pending upload', status: 'PENDING' },
        personalKycProofs: { id: 'DOC-2', title: 'Aadhaar & PAN Card', description: 'Pending upload', status: 'PENDING' },
        liveShopPhoto: { id: 'DOC-3', title: 'Mandatory Live Shop Photo with Owner & Nameboard', description: 'Pending capture', status: 'PENDING' },
        businessProof: { id: 'DOC-4', title: 'Business Proof (MSME/GST/License)', description: 'Pending upload', status: 'PENDING' },
        bankingProof: { id: 'DOC-5', title: 'Bank Statement / Passbook', description: 'Pending upload', status: 'PENDING' },
      },

      totalCollectedTillDate: 0,
      pendingOutstandingBalance: data.sanctionedAmount || 50000,
      installmentsPaidCount: 0,
      totalInstallmentsCount: data.tenureUnits || 100,
      collections: [],
    };

    this.loans.unshift(newRecord);
    this.saveState();
    this.syncToCreditManager(newRecord);
    return newRecord;
  }

  public updateApplication(id: string, updates: Partial<BusinessLoanRecord>): BusinessLoanRecord {
    const idx = this.loans.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Business Loan not found');
    this.loans[idx] = {
      ...this.loans[idx],
      ...updates,
      updatedAt: new Date().toLocaleString('en-IN'),
    };
    this.saveState();
    return this.loans[idx];
  }

  // Credit Manager Action: Return to CRO with mistakes
  public returnToCro(id: string, reason: string, cmName: string): BusinessLoanRecord {
    const updated = this.updateApplication(id, {
      status: 'RETURNED_TO_CRO',
      returnReason: reason,
      cmReviewedBy: cmName,
      cmReviewedAt: new Date().toLocaleString('en-IN'),
      cmRemarks: `Returned to CRO: ${reason}`,
    });
    this.syncToCreditManager(updated);
    return updated;
  }

  // Credit Manager Action: Approve KYC & Documents
  public verifyByCreditManager(id: string, cmName: string, remarks?: string): BusinessLoanRecord {
    const loan = this.getLoanById(id);
    if (!loan) throw new Error('Loan not found');

    const updatedDocs = { ...loan.documents };
    Object.keys(updatedDocs).forEach((k) => {
      (updatedDocs as any)[k].status = 'VERIFIED';
    });

    const updated = this.updateApplication(id, {
      documents: updatedDocs,
      cmReviewedBy: cmName,
      cmReviewedAt: new Date().toLocaleString('en-IN'),
      cmRemarks: remarks || 'All 5 KYC proofs and live shop photo verified by Credit Manager.',
    });
    this.syncToCreditManager(updated);
    return updated;
  }

  // Branch Manager Action: Sanction Loan
  public sanctionByBranchManager(id: string, bmName: string, remarks?: string): BusinessLoanRecord {
    const updated = this.updateApplication(id, {
      status: 'BRANCH_VERIFIED',
      bmSanctionedBy: bmName,
      bmSanctionedAt: new Date().toLocaleString('en-IN'),
      bmRemarks: remarks || 'Sanction endorsed for branch disbursement.',
    });
    this.syncToCreditManager(updated);
    return updated;
  }

  // CRO Action: Resubmit Loan with corrections
  public resubmitByCro(id: string, notes: string, croName: string): BusinessLoanRecord {
    const loan = this.getLoanById(id);
    if (!loan) throw new Error('Loan not found');
    const updated = this.updateApplication(id, {
      status: 'SUBMITTED_BY_CRO',
      returnReason: undefined,
      cmRemarks: `Resubmitted by CRO (${croName}): ${notes}`,
      updatedAt: new Date().toLocaleString('en-IN'),
    });
    this.syncToCreditManager(updated);
    return updated;
  }

  // Admin Action: Disburse with Bank Transfer UTR
  public disburseByAdmin(
    id: string,
    utr: string,
    mode: 'NEFT' | 'IMPS' | 'RTGS' | 'CHEQUE',
    adminName: string
  ): BusinessLoanRecord {
    return this.updateApplication(id, {
      status: 'ACTIVE_COLLECTING',
      adminDisbursementUtr: utr,
      disbursementMode: mode,
      disbursedByAdminName: adminName,
      disbursedAt: new Date().toLocaleString('en-IN'),
    });
  }

  // Collection Action: Standard or Advance Receipt
  public recordCollection(
    id: string,
    amount: number,
    installments: number,
    collectionType: 'STANDARD' | 'ADVANCE',
    mode: 'CASH' | 'UPI' | 'NEFT',
    croId: string,
    croName: string,
    notes?: string
  ): { loan: BusinessLoanRecord; receipt: BusinessLoanCollectionRecord } {
    const loan = this.getLoanById(id);
    if (!loan) throw new Error('Loan not found');

    const receiptNo = `GLF-REC-${Date.now().toString().slice(-6)}`;
    const newCollection: BusinessLoanCollectionRecord = {
      id: `COL-${Date.now()}`,
      loanId: id,
      receiptNo,
      collectionType,
      amountPaid: amount,
      installmentsCovered: installments,
      collectionDate: new Date().toLocaleString('en-IN'),
      collectedByCroId: croId,
      collectedByCroName: croName,
      paymentMode: mode,
      notes,
    };

    const newCollectedTotal = loan.totalCollectedTillDate + amount;
    const newPending = Math.max(0, loan.totalRepayableAmount - newCollectedTotal);
    const newPaidCount = loan.installmentsPaidCount + installments;

    const updated = this.updateApplication(id, {
      totalCollectedTillDate: newCollectedTotal,
      pendingOutstandingBalance: newPending,
      installmentsPaidCount: newPaidCount,
      collections: [newCollection, ...(loan.collections || [])],
    });

    return { loan: updated, receipt: newCollection };
  }

  // Pre-Closure Step 1: CRO Initiates
  public initiatePreClosure(id: string, croId: string, croName: string, remarks: string): BusinessLoanRecord {
    return this.updateApplication(id, {
      status: 'PRE_CLOSURE_REQUESTED',
      preClosure: {
        initiatedByCroId: croId,
        initiatedByCroName: croName,
        initiatedAt: new Date().toLocaleString('en-IN'),
        croRemarks: remarks,
      },
    });
  }

  // Pre-Closure Step 2: Branch Manager Verifies Zero Dues
  public verifyPreClosureByBm(id: string, bmName: string, remarks?: string): BusinessLoanRecord {
    const loan = this.getLoanById(id);
    if (!loan) throw new Error('Loan not found');
    return this.updateApplication(id, {
      preClosure: {
        ...loan.preClosure,
        bmVerifiedBy: bmName,
        bmVerifiedAt: new Date().toLocaleString('en-IN'),
        bmZeroOutstandingConfirmed: true,
        bmRemarks: remarks || 'Zero outstanding balance and zero penal charges confirmed.',
      },
    });
  }

  // Pre-Closure Step 3: Admin Approves & Issues NOC
  public approvePreClosureByAdmin(id: string, adminName: string, reason?: string): BusinessLoanRecord {
    const loan = this.getLoanById(id);
    if (!loan) throw new Error('Loan not found');
    const nocCert = `GLF-NOC-BL-${Date.now().toString().slice(-6)}`;

    return this.updateApplication(id, {
      status: 'CLOSED_NOC_ISSUED',
      pendingOutstandingBalance: 0,
      preClosure: {
        ...loan.preClosure,
        adminApprovedBy: adminName,
        adminApprovedAt: new Date().toLocaleString('en-IN'),
        nocIssuedAt: new Date().toLocaleString('en-IN'),
        nocCertificateNo: nocCert,
        closureReason: reason || 'Full and final early settlement verified.',
      },
    });
  }

  // Live Admin Monitoring Sequence
  public getLiveCollectionStats() {
    const active = this.loans.filter((l) => l.status === 'ACTIVE_COLLECTING');
    let totalCollectedTillTime = 0;
    let pendingCollection = 0;
    let todayCollected = 0;

    active.forEach((l) => {
      totalCollectedTillTime += l.totalCollectedTillDate;
      pendingCollection += l.pendingOutstandingBalance;
      // Filter today's collections
      const todayDate = new Date().toLocaleDateString('en-IN');
      (l.collections || []).forEach((c) => {
        if (c.collectionDate.includes(todayDate)) {
          todayCollected += c.amountPaid;
        }
      });
    });

    return {
      todayCollected,
      totalCollectedTillTime,
      pendingCollection,
      activeLoansCount: active.length,
    };
  }
}

export const businessLoanService = new BusinessLoanService();
