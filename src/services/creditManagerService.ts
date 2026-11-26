// ──────────────────────────────────────────────────
// Golden Leaf Finance — Credit Manager Service & State
// Centralized Verification, KYC, Document Audit, Loan Appraisal & Approval State
// ──────────────────────────────────────────────────

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getStoredBranches } from './branchService';

export interface VerificationDocument {
  id: string;
  name: string;
  type: 'photo' | 'aadhaar' | 'pan' | 'aadhaar_front' | 'aadhaar_back' | 'nominee_photo' | 'address_proof' | string;
  fileName: string;
  fileUrl?: string;
  status: 'verified' | 'pending' | 'rejected' | 'missing';
  remarks?: string;
  verifiedAt?: string;
}

export interface CreditApplicant {
  id: string;
  customerId: string;
  customerName: string;
  fatherOrSpouseName: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  city: string;
  branchId: string;
  centerName: string;
  groupName: string;
  occupation: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  existingLoans: number;
  existingMonthlyEmi: number;
  creditScore: number;
  riskTier: 'Low Risk (Prime)' | 'Medium Risk' | 'High Risk';
  
  // Requested Loan
  loanAmount: number;
  loanProduct: string;
  tenorWeeks: number;
  proposedEmi: number;
  loanPurpose: string;

  // Stage 1: Customer Profile Verification
  customerVerificationStatus: 'Pending' | 'Verified' | 'Rejected';
  customerVerificationRemarks?: string;
  customerVerifiedBy?: string;
  customerVerifiedAt?: string;
  history?: {
    date: string;
    event: string;
    remarks: string;
  }[];

  // Stage 2: KYC Details
  aadhaarNumber: string;
  panNumber?: string;
  voterId?: string;
  rationCard?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  nomineePhotoUrl?: string;
  customerPhotoUrl?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  panCardUrl?: string;
  voterIdUrl?: string;
  smartCardUrl?: string;
  passbookUrl?: string;
  otherDocUrl?: string;
  otherDocTitle?: string;
  kycStatus: 'Pending' | 'Verified' | 'Rejected';
  kycRemarks?: string;
  kycVerifiedBy?: string;
  kycVerifiedAt?: string;

  // Stage 3: Documents (Strict PDF Module 5 Digital KYC Artifacts)
  documents: VerificationDocument[];
  documentStatus: 'Pending' | 'Verified' | 'Rejected' | 'Incomplete';

  // Stage 4: Loan Recommendation
  recommendationStatus: 'Pending' | 'Approved' | 'Rejected' | 'Escalated';
  recommendationNotes?: string;
  recommendedAmount?: number;
  recommendedTenor?: number;
  recommendedBy?: string;
  recommendedAt?: string;

  // Stage 5: Credit Manager Final Customer Approval
  finalApprovalStatus: 'Pending' | 'Approved' | 'Rejected';
  finalApprovalRemarks?: string;
  approvedBy?: string;
  approvedAt?: string;
  sanctionLetterNo?: string;

  // Stage 6: Branch Manager Approval (after Credit Manager completes Stages 1-5)
  branchManagerApprovalStatus: 'Not Reached' | 'Pending' | 'Approved' | 'Rejected';
  branchManagerRemarks?: string;
  branchManagerApprovedBy?: string;
  branchManagerApprovedAt?: string;
  branchManagerBranchId?: string;

  appliedDate: string;
}

export function createPdfCompliantDocuments(app: {
  id: string;
  customerName: string;
  customerPhotoUrl?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  nomineePhotoUrl?: string;
  documentStatus?: string;
}, existingDocs?: VerificationDocument[]): VerificationDocument[] {
  const nameSlug = (app.customerName || 'customer').toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  const isFullyVerifiedApplicant = app.documentStatus === 'Verified';

  const getDocStatus = (docIdSuffix: string): 'verified' | 'pending' | 'rejected' => {
    if (isFullyVerifiedApplicant) return 'verified';

    if (existingDocs && existingDocs.length > 0) {
      const exact = existingDocs.find(d => d.id === `${app.id}-${docIdSuffix}` || d.id.endsWith(docIdSuffix));
      if (exact && (exact.status === 'verified' || exact.status === 'rejected' || exact.status === 'pending')) {
        return exact.status;
      }
    }

    return 'pending';
  };

  const getDocRemarks = (docIdSuffix: string): string | undefined => {
    if (existingDocs && existingDocs.length > 0) {
      const match = existingDocs.find(d => d.id === `${app.id}-${docIdSuffix}` || d.id.endsWith(docIdSuffix));
      if (match?.remarks) return match.remarks;
    }
    return undefined;
  };

  return [
    {
      id: `${app.id}-customer-photo`,
      name: 'Customer Photo',
      type: 'photo',
      fileName: `${nameSlug}_customer_photo.jpg`,
      fileUrl: app.customerPhotoUrl,
      status: getDocStatus('customer-photo'),
      verifiedAt: getDocStatus('customer-photo') === 'verified' ? new Date().toISOString().split('T')[0] : undefined,
    },
    {
      id: `${app.id}-aadhaar-front`,
      name: 'Aadhaar Front',
      type: 'aadhaar_front',
      fileName: `${nameSlug}_aadhaar_front.jpg`,
      fileUrl: app.aadhaarFrontUrl,
      status: getDocStatus('aadhaar-front'),
      verifiedAt: getDocStatus('aadhaar-front') === 'verified' ? new Date().toISOString().split('T')[0] : undefined,
    },
    {
      id: `${app.id}-aadhaar-back`,
      name: 'Aadhaar Back',
      type: 'aadhaar_back',
      fileName: `${nameSlug}_aadhaar_back.jpg`,
      fileUrl: app.aadhaarBackUrl,
      status: getDocStatus('aadhaar-back'),
      remarks: getDocRemarks('aadhaar-back'),
      verifiedAt: getDocStatus('aadhaar-back') === 'verified' ? new Date().toISOString().split('T')[0] : undefined,
    },
    {
      id: `${app.id}-nominee-photo`,
      name: 'Nominee Photo',
      type: 'nominee_photo',
      fileName: `${nameSlug}_nominee_photo.jpg`,
      fileUrl: app.nomineePhotoUrl,
      status: getDocStatus('nominee-photo'),
      verifiedAt: getDocStatus('nominee-photo') === 'verified' ? new Date().toISOString().split('T')[0] : undefined,
    },
  ];
}

export function calculateOverallDocumentStatus(docs: VerificationDocument[]): 'Pending' | 'Verified' | 'Rejected' | 'Incomplete' {
  if (!docs || docs.length === 0) return 'Pending';
  const hasRejected = docs.some(d => d.status === 'rejected');
  if (hasRejected) return 'Rejected';
  const allVerified = docs.length === 4 && docs.every(d => d.status === 'verified');
  if (allVerified) return 'Verified';
  return 'Pending';
}

export function normalizeBranchId(id?: string | null): string {
  if (!id) return '';
  const lower = id.toLowerCase().trim();
  if (lower === 'all') return 'all';
  if (lower === 'b1' || lower === 'br-01' || lower === 'gl-br-001') return 'BR-01';
  if (lower === 'b2' || lower === 'br-02' || lower === 'gl-br-002') return 'BR-02';
  if (lower === 'b3' || lower === 'br-03' || lower === 'gl-br-003') return 'BR-03';
  if (lower === 'b4' || lower === 'br-04' || lower === 'gl-br-004') return 'BR-04';
  if (lower === 'b5' || lower === 'br-05' || lower === 'gl-br-005') return 'BR-05';
  return id;
}

/**
 * Robustly matches branch IDs, codes, names across all dynamically generated branches
 * (e.g. 'BR-6805' <-> 'GL-BR-002' <-> 'GOBI MAIN BRANCH', or 'b1' <-> 'BR-01').
 */
export function matchBranchId(filterBranchId?: string | null, appBranchId?: string | null): boolean {
  if (!filterBranchId || filterBranchId === 'all') return true;
  if (!appBranchId) return false;

  const f = filterBranchId.trim().toLowerCase();
  const a = appBranchId.trim().toLowerCase();
  if (f === a) return true;

  // Normalized standard IDs
  const normF = normalizeBranchId(filterBranchId).toLowerCase();
  const normA = normalizeBranchId(appBranchId).toLowerCase();
  if (normF && normA && normF === normA) return true;

  // Dynamic system branches lookup
  try {
    const branches = getStoredBranches();
    const branchF = branches.find(
      (b) =>
        b.id.toLowerCase() === f ||
        b.code.toLowerCase() === f ||
        normalizeBranchId(b.id).toLowerCase() === normF ||
        normalizeBranchId(b.code).toLowerCase() === normF ||
        b.name.toLowerCase() === f ||
        b.name.toLowerCase().includes(f) ||
        f.includes(b.name.toLowerCase())
    );
    const branchA = branches.find(
      (b) =>
        b.id.toLowerCase() === a ||
        b.code.toLowerCase() === a ||
        normalizeBranchId(b.id).toLowerCase() === normA ||
        normalizeBranchId(b.code).toLowerCase() === normA ||
        b.name.toLowerCase() === a ||
        b.name.toLowerCase().includes(a) ||
        a.includes(b.name.toLowerCase())
    );

    if (branchF && branchA && branchF.id === branchA.id) return true;
    if (branchF && (branchF.id.toLowerCase() === a || branchF.code.toLowerCase() === a || branchF.name.toLowerCase().includes(a) || a.includes(branchF.name.toLowerCase()))) return true;
    if (branchA && (branchA.id.toLowerCase() === f || branchA.code.toLowerCase() === f || branchA.name.toLowerCase().includes(f) || f.includes(branchA.name.toLowerCase()))) return true;
  } catch {
    // Ignore lookup errors
  }

  return false;
}

const STORAGE_KEY = 'glf_credit_manager_applicants_v5';

export const DEFAULT_APPLICANTS: CreditApplicant[] = [
  {
    id: 'APP-2024-001',
    customerId: 'GLF-C-21975',
    customerName: 'DEVI',
    fatherOrSpouseName: 'RAMASAMY',
    phone: '6380755445',
    address: 'D NO 248 KOTTUPULLAMPALAYAM',
    city: 'Chennai',
    branchId: 'BR-01',
    centerName: 'Center 01 - Anna Nagar',
    groupName: 'GRP-002 (ANNAMALAIYAR SHG)',
    occupation: 'Retail Shop',
    monthlyIncome: 25000,
    monthlyExpenses: 12000,
    existingLoans: 0,
    existingMonthlyEmi: 0,
    creditScore: 720,
    riskTier: 'Low Risk (Prime)',
    loanAmount: 25000,
    loanProduct: 'Weekly Micro-Loan (JLG)',
    tenorWeeks: 25,
    proposedEmi: 1250,
    loanPurpose: 'Livestock / Business expansion',
    customerVerificationStatus: 'Pending',
    aadhaarNumber: '789456123012',
    panNumber: 'ABCDE1234F',
    customerPhotoUrl: '',
    aadhaarFrontUrl: '',
    panCardUrl: '',
    kycStatus: 'Pending',
    documentStatus: 'Pending',
    recommendationStatus: 'Pending',
    finalApprovalStatus: 'Pending',
    branchManagerApprovalStatus: 'Not Reached',
    appliedDate: '23-11-2026',
    documents: [
      { id: 'd1', name: 'Applicant Photo', type: 'photo', fileName: 'photo.jpg', status: 'verified' },
      { id: 'd2', name: 'Aadhaar Card Front', type: 'aadhaar_front', fileName: 'aadhaar_front.jpg', status: 'verified' },
      { id: 'd3', name: 'Aadhaar Card Back', type: 'aadhaar_back', fileName: 'aadhaar_back.jpg', status: 'verified' },
      { id: 'd4', name: 'PAN Card', type: 'pan', fileName: 'pan.jpg', status: 'verified' },
    ],
    history: [
      {
        date: '23/11/2026',
        event: 'Customer Registration Completed',
        remarks: 'Enrolled via Customer Relationship Officer (CRO) - Saravanan',
      },
    ],
  },
  {
    id: 'APP-2024-003',
    customerId: 'GLF-C-37716',
    customerName: 'GOMATHY',
    fatherOrSpouseName: 'MURUGESAN',
    phone: '9944890549',
    address: '15 BHAG',
    city: 'Chennai',
    branchId: 'BR-01',
    centerName: 'Main Center',
    groupName: 'GRP-001 (DAVE HOUSE)',
    occupation: 'Small Enterprise',
    monthlyIncome: 30000,
    monthlyExpenses: 14000,
    existingLoans: 0,
    existingMonthlyEmi: 0,
    creditScore: 740,
    riskTier: 'Low Risk (Prime)',
    loanAmount: 35000,
    loanProduct: 'Weekly Micro-Loan (JLG)',
    tenorWeeks: 25,
    proposedEmi: 1750,
    loanPurpose: 'Textile stock purchase',
    customerVerificationStatus: 'Pending',
    aadhaarNumber: '987654321098',
    panNumber: 'FGHIJ5678K',
    kycStatus: 'Pending',
    documentStatus: 'Pending',
    recommendationStatus: 'Pending',
    finalApprovalStatus: 'Pending',
    branchManagerApprovalStatus: 'Not Reached',
    appliedDate: '23-11-2026',
    documents: [
      { id: 'd1', name: 'Applicant Photo', type: 'photo', fileName: 'photo.jpg', status: 'verified' },
      { id: 'd2', name: 'Aadhaar Card Front', type: 'aadhaar_front', fileName: 'aadhaar_front.jpg', status: 'verified' },
      { id: 'd3', name: 'Aadhaar Card Back', type: 'aadhaar_back', fileName: 'aadhaar_back.jpg', status: 'verified' },
      { id: 'd4', name: 'PAN Card', type: 'pan', fileName: 'pan.jpg', status: 'verified' },
    ],
    history: [
      {
        date: '23/11/2026',
        event: 'Customer Registration Completed',
        remarks: 'Enrolled via Customer Relationship Officer (CRO) - Saravanan',
      },
    ],
  },
  {
    id: 'APP-2024-011',
    customerId: 'GLF-C-71893',
    customerName: 'MAILAVATHI',
    fatherOrSpouseName: 'SELVAM',
    phone: '9362011433',
    address: 'NO 1 PERUMAL KOVIL STREET, KUGALUR',
    city: 'Chennai',
    branchId: 'BR-01',
    centerName: 'Main Center',
    groupName: 'GRP-002 (ANNAMALAIYAR SHG)',
    occupation: 'Tailoring / Garments',
    monthlyIncome: 28000,
    monthlyExpenses: 13000,
    existingLoans: 0,
    existingMonthlyEmi: 0,
    creditScore: 710,
    riskTier: 'Low Risk (Prime)',
    loanAmount: 25000,
    loanProduct: 'Weekly Micro-Loan (JLG)',
    tenorWeeks: 25,
    proposedEmi: 1250,
    loanPurpose: 'Sewing machinery & materials',
    customerVerificationStatus: 'Pending',
    aadhaarNumber: '891234567890',
    panNumber: 'KLMNO9012P',
    kycStatus: 'Pending',
    documentStatus: 'Pending',
    recommendationStatus: 'Pending',
    finalApprovalStatus: 'Pending',
    branchManagerApprovalStatus: 'Not Reached',
    appliedDate: '23-11-2026',
    documents: [
      { id: 'd1', name: 'Applicant Photo', type: 'photo', fileName: 'photo.jpg', status: 'verified' },
      { id: 'd2', name: 'Aadhaar Card Front', type: 'aadhaar_front', fileName: 'aadhaar_front.jpg', status: 'verified' },
      { id: 'd3', name: 'Aadhaar Card Back', type: 'aadhaar_back', fileName: 'aadhaar_back.jpg', status: 'verified' },
      { id: 'd4', name: 'PAN Card', type: 'pan', fileName: 'pan.jpg', status: 'verified' },
    ],
    history: [
      {
        date: '23/11/2026',
        event: 'Customer Registration Completed',
        remarks: 'Enrolled via Customer Relationship Officer (CRO) - Saravanan',
      },
    ],
  },
  {
    id: 'APP-2024-020',
    customerId: 'GLF-BL-2026-0003',
    customerName: 'manikandan',
    fatherOrSpouseName: 'SAGADEVAN',
    phone: '7887756452',
    alternatePhone: '8768465456',
    address: '15 ERODE MAIN ROAD KAVINDAPADI, 638116',
    city: 'GOBI MAIN BRANCH',
    branchId: 'BR-6805',
    centerName: 'Business Loan Division',
    groupName: 'velan grocery (Retail / Kirana Shop)',
    occupation: 'Retail / Kirana Shop',
    monthlyIncome: 50000,
    monthlyExpenses: 20000,
    existingLoans: 0,
    existingMonthlyEmi: 0,
    creditScore: 735,
    riskTier: 'Low Risk (Prime)',
    loanAmount: 25000,
    loanProduct: 'Business Loan (Daily)',
    tenorWeeks: 14,
    proposedEmi: 275,
    loanPurpose: 'velan grocery - Owned Shop',
    customerVerificationStatus: 'Pending',
    aadhaarNumber: '789786789679',
    panNumber: 'GGZPK7845F',
    kycStatus: 'Pending',
    documentStatus: 'Pending',
    recommendationStatus: 'Pending',
    finalApprovalStatus: 'Pending',
    branchManagerApprovalStatus: 'Not Reached',
    appliedDate: '23-11-2026',
    documents: [
      { id: 'DOC-1', name: 'Applicant & Guarantor Photos', type: 'photo', fileName: 'applicant_photos.jpg', status: 'verified' },
      { id: 'DOC-2', name: 'Personal KYC Proofs (Aadhaar & PAN)', type: 'aadhaar', fileName: 'personal_kyc.pdf', status: 'verified' },
      { id: 'DOC-3', name: 'Mandatory Live Shop Photo with Owner', type: 'address_proof', fileName: 'shop_photo.jpg', status: 'verified' },
      { id: 'DOC-4', name: 'Business Proof (MSME/GST/License)', type: 'business_proof', fileName: 'business_proof.pdf', status: 'verified' },
      { id: 'DOC-5', name: 'Banking Proof (Passbook/Statement)', type: 'bank_statement', fileName: 'bank_proof.pdf', status: 'verified' },
    ],
    history: [
      {
        date: '23/11/2026',
        event: 'Business Loan Application Submitted',
        remarks: 'Submitted by SARAVANAN (GLF007) - ₹25,000',
      },
    ],
  },
];

class CreditManagerService {
  private applicants: CreditApplicant[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed: CreditApplicant[] = JSON.parse(data);
        this.applicants = Array.isArray(parsed) && parsed.length > 0 ? this.deduplicateApplicants(parsed) : [...DEFAULT_APPLICANTS];
      } else {
        this.applicants = [...DEFAULT_APPLICANTS];
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.applicants));
      } catch {}
    } catch {
      this.applicants = [...DEFAULT_APPLICANTS];
    }

    if (isSupabaseConfigured() && supabase) {
      void (async () => {
        try {
          const { data: rows, error } = await supabase!
            .from('documents')
            .select('data')
            .eq('collection', 'credit_applicants')
            .eq('is_deleted', false);
          if (!error && Array.isArray(rows) && rows.length > 0) {
            const cloudApplicants = rows.map((r: any) => r.data).filter(Boolean);
            this.applicants = this.deduplicateApplicants(cloudApplicants);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(this.applicants));
            } catch {}
            this.notifyListeners();
          }
        } catch (e: unknown) {
          console.warn('[Supabase] Failed to fetch credit applicants:', e);
        }
      })();
    }
  }

  // Ensures strict 1 customer = 1 applicant entry
  public deduplicateApplicants(applicants: CreditApplicant[]): CreditApplicant[] {
    const seenCustIds = new Set<string>();
    const seenAadhaar = new Set<string>();
    const deduplicated: CreditApplicant[] = [];

    for (const app of applicants) {
      const cId = (app.customerId || '').trim().toUpperCase();
      const aId = app.aadhaarNumber ? app.aadhaarNumber.replace(/\D/g, '') : '';

      // Skip duplicate customerId
      if (cId && seenCustIds.has(cId)) {
        continue;
      }
      // Skip duplicate 12-digit Aadhaar UID
      if (aId && aId.length === 12 && seenAadhaar.has(aId)) {
        continue;
      }

      if (cId) seenCustIds.add(cId);
      if (aId && aId.length === 12) seenAadhaar.add(aId);
      deduplicated.push(app);
    }

    return deduplicated;
  }

  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Error in credit manager listener', e);
      }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('glf_credit_manager_updated'));
    }
  }

  public reloadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.applicants = Array.isArray(parsed) ? this.deduplicateApplicants(parsed) : [];
        this.notifyListeners();
      }
    } catch (e) {
      console.warn('Failed to reload from storage', e);
    }
  }

  private async saveState() {
    this.applicants = this.deduplicateApplicants(this.applicants);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.applicants));
      this.notifyListeners();
    } catch (e) {
      console.warn('Failed to save credit applicants to localStorage', e);
    }

    if (isSupabaseConfigured() && supabase && this.applicants.length > 0) {
      try {
        const upsertRows = this.applicants.map((app) => ({
          collection: 'credit_applicants',
          id: app.id,
          data: app,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        const { error } = await supabase.from('documents').upsert(upsertRows);
        if (error) {
          console.warn('[Supabase] Credit applicant save error:', error.message);
        }
      } catch (err) {
        console.warn('[Supabase] Credit applicant save network error:', err);
      }
    }
  }

  public getApplicants(): CreditApplicant[] {
    return this.deduplicateApplicants([...this.applicants]);
  }

  public getApplicantById(id: string): CreditApplicant | undefined {
    return this.applicants.find(a => a.id === id || a.customerId === id);
  }

  // 1. Update Customer Verification
  public updateCustomerVerification(
    id: string,
    status: 'Pending' | 'Verified' | 'Rejected',
    remarks: string,
    managerName = 'Credit Manager'
  ): CreditApplicant {
    this.applicants = this.applicants.map(app => {
      if (app.id === id) {
        const historyEntry = {
          date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
          event: status === 'Verified' ? 'Customer Profile Verification' : 'Customer Profile Rejected',
          remarks: remarks || (status === 'Verified' ? `Verified by ${managerName}` : `Rejected by ${managerName}`),
        };
        const existingHistory = app.history || [];

        return {
          ...app,
          customerVerificationStatus: status,
          customerVerificationRemarks: remarks,
          customerVerifiedBy: managerName,
          customerVerifiedAt: new Date().toLocaleString(),
          history: [historyEntry, ...existingHistory],
        };
      }
      return app;
    });
    this.saveState();
    return this.getApplicantById(id)!;
  }

  public getCustomerHistory(id: string): { date: string; event: string; remarks: string }[] {
    const applicant = this.getApplicantById(id);
    if (!applicant) return [];
    if (applicant.history && applicant.history.length > 0) {
      return applicant.history;
    }
    // Fallback default history if applicant was registered
    return [
      {
        date: applicant.appliedDate || new Date().toISOString().split('T')[0],
        event: 'Customer Registration',
        remarks: `Customer enrolled under ${applicant.groupName || 'Branch Collection'}`,
      }
    ];
  }

  // 2. Update KYC Verification
  public updateKycVerification(
    id: string,
    status: 'Pending' | 'Verified' | 'Rejected',
    remarks: string,
    managerName = 'Credit Manager'
  ): CreditApplicant {
    this.applicants = this.applicants.map(app => {
      if (app.id === id) {
        const historyEntry = {
          date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
          event: status === 'Verified' ? 'KYC Verification' : 'KYC Discrepancy Flagged',
          remarks: remarks || (status === 'Verified' ? `KYC verified by ${managerName}` : `KYC rejected by ${managerName}`),
        };
        const existingHistory = app.history || [];

        return {
          ...app,
          aadhaarFrontUrl: app.aadhaarFrontUrl,
          aadhaarBackUrl: app.aadhaarBackUrl,
          customerPhotoUrl: app.customerPhotoUrl,
          nomineePhotoUrl: app.nomineePhotoUrl,
          kycStatus: status,
          kycRemarks: remarks,
          kycVerifiedBy: managerName,
          kycVerifiedAt: new Date().toLocaleString(),
          history: [historyEntry, ...existingHistory],
        };
      }
      return app;
    });
    this.saveState();
    return this.getApplicantById(id)!;
  }

  // 3. Update Document Item Status (PDF Digital KYC Document Verification)
  public updateDocumentStatus(
    applicantId: string,
    docId: string,
    status: 'verified' | 'rejected' | 'pending',
    remarks?: string,
    managerName = 'Credit Manager'
  ): CreditApplicant {
    this.applicants = this.applicants.map(app => {
      if (app.id === applicantId) {
        // Ensure app.documents always has all 4 compliant documents
        const currentDocs = (app.documents && app.documents.length === 4)
          ? app.documents
          : createPdfCompliantDocuments(app, app.documents);

        let updatedDocName = 'Document';
        const updatedDocs = currentDocs.map(doc => {
          const cleanDocId = docId.toLowerCase().trim();
          const currentId = doc.id.toLowerCase().trim();
          const isMatch = currentId === cleanDocId ||
            currentId.endsWith(cleanDocId.replace(app.id.toLowerCase(), '').replace(/^-/, '')) ||
            (cleanDocId.includes('aadhaar-front') && currentId.includes('aadhaar-front')) ||
            (cleanDocId.includes('aadhaar-back') && currentId.includes('aadhaar-back')) ||
            (cleanDocId.includes('customer-photo') && currentId.includes('customer-photo')) ||
            (cleanDocId.includes('nominee-photo') && currentId.includes('nominee-photo')) ||
            (cleanDocId.includes('aadhaar_front') && currentId.includes('aadhaar-front')) ||
            (cleanDocId.includes('aadhaar_back') && currentId.includes('aadhaar-back'));

          if (isMatch) {
            updatedDocName = doc.name;
            return {
              ...doc,
              status,
              remarks: status === 'rejected' ? (remarks || 'Document discrepancy flagged') : undefined,
              verifiedAt: status === 'verified' ? new Date().toISOString().split('T')[0] : undefined,
            };
          }
          return doc;
        });

        const overallDocStatus = calculateOverallDocumentStatus(updatedDocs);

        const historyEntry = {
          date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
          event: 'Document Verification Updated',
          remarks: `${updatedDocName} marked as ${status.toUpperCase()} by ${managerName}${remarks ? `: ${remarks}` : ''}`,
        };
        const existingHistory = app.history || [];

        return {
          ...app,
          documents: updatedDocs,
          documentStatus: overallDocStatus,
          history: [historyEntry, ...existingHistory],
        };
      }
      return app;
    });
    this.saveState();
    return this.getApplicantById(applicantId)!;
  }

  // 4. Update Loan Recommendation (Strict PDF Module: Loan Recommendation)
  public updateLoanRecommendation(
    id: string,
    status: 'Approved' | 'Rejected' | 'Escalated',
    notes: string,
    recommendedAmount?: number,
    recommendedTenor?: number,
    managerName = 'Credit Manager'
  ): CreditApplicant {
    this.applicants = this.applicants.map(app => {
      if (app.id === id) {
        const historyEntry = {
          date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
          event: 'Loan Recommendation Submitted',
          remarks: `Recommendation: ${status === 'Approved' ? 'Recommended for Branch Manager Approval' : 'Not Recommended'}. Notes: ${notes || 'None'}. Manager: ${managerName}`,
        };
        const existingHistory = app.history || [];

        return {
          ...app,
          recommendationStatus: status,
          recommendationNotes: notes,
          recommendedAmount: recommendedAmount || app.loanAmount,
          recommendedTenor: recommendedTenor || app.tenorWeeks,
          recommendedBy: managerName,
          recommendedAt: new Date().toLocaleString(),
          history: [historyEntry, ...existingHistory],
        };
      }
      return app;
    });
    this.saveState();
    return this.getApplicantById(id)!;
  }

  // 5. Final Customer Approval (Strict PDF Workflow: Credit Manager → Branch Manager)
  public finalizeCustomerApproval(
    id: string,
    action: 'Approved' | 'Rejected',
    remarks: string,
    managerName = 'Credit Manager'
  ): CreditApplicant {
    const sanctionNo = action === 'Approved' ? `GLF-SAN-2024-${Math.floor(100 + Math.random() * 900)}` : undefined;

    this.applicants = this.applicants.map(app => {
      if (app.id === id) {
        const historyItem = {
          date: new Date().toLocaleString(),
          event: action === 'Approved' ? 'Customer Approval Completed' : 'Customer Approval Rejected',
          remarks: `Credit Manager (${managerName}): ${remarks}. Next stage: ${
            action === 'Approved' ? 'Submitted to Branch Manager for Sanction Approval' : 'Application Held'
          }.`,
        };

        return {
          ...app,
          finalApprovalStatus: action,
          finalApprovalRemarks: remarks,
          approvedBy: managerName,
          approvedAt: new Date().toLocaleString(),
          sanctionLetterNo: app.sanctionLetterNo || sanctionNo,
          branchManagerApprovalStatus: action === 'Approved' ? 'Pending' : 'Rejected',
          history: [...(app.history || []), historyItem],
        };
      }
      return app;
    });
    this.saveState();
    return this.getApplicantById(id)!;
  }

  // Update applicant profile fields (for corrections & edits)
  public updateApplicant(id: string, updates: Partial<CreditApplicant>): CreditApplicant {
    const cleanId = id.trim();
    this.applicants = this.applicants.map(app => {
      if (app.id === cleanId || app.customerId === cleanId) {
        return {
          ...app,
          ...updates,
          id: app.id,
          customerId: app.customerId,
          history: [
            {
              date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
              event: 'Applicant Details Corrected',
              remarks: 'Applicant profile details modified and saved.',
            },
            ...(app.history || []),
          ],
        };
      }
      return app;
    });
    this.saveState();
    return this.getApplicantById(cleanId)!;
  }

  // Add new applicant dynamically from customer registration / loan creation
  public addApplicant(applicantData: Partial<CreditApplicant> & { customerName: string; customerId: string }): CreditApplicant {
    const cleanAadhaar = applicantData.aadhaarNumber ? applicantData.aadhaarNumber.replace(/\D/g, '') : '';
    const cleanCustId = (applicantData.customerId || '').trim().toUpperCase();

    // Prevent duplicate applicant: Check if customerId or Aadhaar UID already exists
    const existingIndex = this.applicants.findIndex(a => {
      const aCustId = (a.customerId || '').trim().toUpperCase();
      const aAadhaar = a.aadhaarNumber ? a.aadhaarNumber.replace(/\D/g, '') : '';
      if (cleanCustId && aCustId === cleanCustId) return true;
      if (cleanAadhaar && cleanAadhaar.length === 12 && aAadhaar === cleanAadhaar) return true;
      return false;
    });

    if (existingIndex !== -1) {
      // Customer already exists! Merge/update existing record rather than creating duplicate
      const existing = this.applicants[existingIndex];
      const updatedApplicant: CreditApplicant = {
        ...existing,
        ...applicantData,
        id: existing.id, // Preserve original APP-ID
        customerId: existing.customerId,
        customerVerificationStatus: existing.customerVerificationStatus !== 'Pending' ? existing.customerVerificationStatus : (applicantData.customerVerificationStatus || existing.customerVerificationStatus),
        kycStatus: existing.kycStatus !== 'Pending' ? existing.kycStatus : (applicantData.kycStatus || existing.kycStatus),
      };
      this.applicants[existingIndex] = updatedApplicant;
      this.applicants = this.deduplicateApplicants(this.applicants);
      this.saveState();
      return updatedApplicant;
    }

    const newId = `APP-2024-${String(this.applicants.length + 1).padStart(3, '0')}`;
    const newApplicant: CreditApplicant = {
      id: newId,
      customerId: applicantData.customerId,
      customerName: applicantData.customerName,
      fatherOrSpouseName: applicantData.fatherOrSpouseName || 'Guardian',
      phone: applicantData.phone || '+91 98400 00000',
      alternatePhone: applicantData.alternatePhone,
      address: applicantData.address || 'Chennai',
      city: applicantData.city || 'Chennai',
      branchId: applicantData.branchId || 'BR-01',
      centerName: applicantData.centerName || 'Center 01 - Anna Nagar',
      groupName: applicantData.groupName || 'G-01 (Malar Sangam)',
      occupation: applicantData.occupation || 'Small Enterprise',
      monthlyIncome: applicantData.monthlyIncome || 25000,
      monthlyExpenses: applicantData.monthlyExpenses || 12000,
      existingLoans: applicantData.existingLoans || 0,
      existingMonthlyEmi: applicantData.existingMonthlyEmi || 0,
      creditScore: applicantData.creditScore || Math.floor(650 + Math.random() * 150),
      riskTier: applicantData.riskTier || 'Low Risk (Prime)',
      loanAmount: applicantData.loanAmount || 25000,
      loanProduct: applicantData.loanProduct || 'Weekly Micro-Loan (JLG)',
      tenorWeeks: applicantData.tenorWeeks || 25,
      proposedEmi: applicantData.proposedEmi || 1400,
      loanPurpose: applicantData.loanPurpose || 'Business development / livestock',
      customerVerificationStatus: 'Pending',
      aadhaarNumber: applicantData.aadhaarNumber || 'XXXX-XXXX-1234',
      panNumber: applicantData.panNumber,
      voterId: applicantData.voterId,
      rationCard: applicantData.rationCard,
      customerPhotoUrl: applicantData.customerPhotoUrl,
      aadhaarFrontUrl: applicantData.aadhaarFrontUrl,
      panCardUrl: applicantData.panCardUrl,
      voterIdUrl: applicantData.voterIdUrl,
      smartCardUrl: applicantData.smartCardUrl,
      passbookUrl: applicantData.passbookUrl,
      otherDocUrl: applicantData.otherDocUrl,
      otherDocTitle: applicantData.otherDocTitle,
      kycStatus: 'Pending',
      documents: applicantData.documents || [
        { id: 'DOC-1', name: 'Borrower Photo', type: 'photo', fileName: 'borrower_photo.jpg', status: 'verified' },
        { id: 'DOC-2', name: 'Aadhaar Card (Front)', type: 'aadhaar_front', fileName: 'aadhaar_doc_front.pdf', status: 'pending' },
        { id: 'DOC-3', name: 'Aadhaar Card (Back)', type: 'aadhaar_back', fileName: 'aadhaar_doc_back.pdf', status: 'pending' },
      ],
      documentStatus: 'Pending',
      recommendationStatus: 'Pending',
      finalApprovalStatus: 'Pending',
      branchManagerApprovalStatus: 'Not Reached',
      appliedDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
    };

    this.applicants.unshift(newApplicant);
    this.applicants = this.deduplicateApplicants(this.applicants);
    this.saveState();
    return newApplicant;
  }

  // KPIs
  public getDashboardKpis() {
    const list = this.getApplicants();
    const pendingVerifications = list.filter(
      a => a.customerVerificationStatus === 'Pending' || a.kycStatus === 'Pending' || a.documentStatus === 'Pending'
    ).length;

    const approvalsToday = list.filter(a => a.finalApprovalStatus === 'Approved').length;
    const loansInReview = list.filter(a => a.recommendationStatus === 'Pending' || a.recommendationStatus === 'Escalated').length;
    const rejectedCases = list.filter(a => a.finalApprovalStatus === 'Rejected' || a.recommendationStatus === 'Rejected').length;

    return {
      pendingVerifications,
      approvalsToday,
      loansInReview,
      rejectedCases,
      totalQueue: list.length,
    };
  }

  public resetToDefault() {
    this.applicants = DEFAULT_APPLICANTS;
    this.saveState();
  }

  // ─── Branch Manager Approval Methods ───

  /**
   * Get all applications that have completed Credit Manager stages and are
   * eligible for Branch Manager review. Optionally filtered by branchId.
   */
  public getApplicationsForBranchManagerApproval(branchId?: string): CreditApplicant[] {
    return this.applicants.filter(app => {
      // Only show applications where Credit Manager completed all stages:
      // - Customer verified
      // - KYC verified  
      // - Documents verified
      // - Recommendation approved
      // - Final CM approval approved
      const cmComplete =
        app.customerVerificationStatus === 'Verified' &&
        app.kycStatus === 'Verified' &&
        app.documentStatus === 'Verified' &&
        app.recommendationStatus === 'Approved' &&
        app.finalApprovalStatus === 'Approved';

      if (!cmComplete) return false;

      // Branch isolation (supports normalized IDs like 'b1' <-> 'BR-01', and 'all')
      if (branchId && branchId !== 'all') {
        if (!matchBranchId(branchId, app.branchId)) return false;
      }

      // Only show pending BM applications
      return app.branchManagerApprovalStatus === 'Pending';
    });
  }

  /**
   * Get all applications that have reached Branch Manager stage (any status).
   * For the "All" tab view. Optionally filtered by branchId.
   */
  public getBranchManagerQueue(branchId?: string): CreditApplicant[] {
    return this.applicants.filter(app => {
      const cmComplete =
        app.customerVerificationStatus === 'Verified' &&
        app.kycStatus === 'Verified' &&
        app.documentStatus === 'Verified' &&
        app.recommendationStatus === 'Approved' &&
        app.finalApprovalStatus === 'Approved';

      if (!cmComplete) return false;

      if (branchId && branchId !== 'all') {
        if (!matchBranchId(branchId, app.branchId)) return false;
      }

      return app.branchManagerApprovalStatus !== 'Not Reached';
    });
  }

  /**
   * Get Branch Manager approval history (approved + rejected). Optionally filtered by branchId.
   */
  public getBranchManagerApprovalHistory(branchId?: string): CreditApplicant[] {
    return this.applicants.filter(app => {
      if (branchId && branchId !== 'all') {
        if (!matchBranchId(branchId, app.branchId)) return false;
      }

      return app.branchManagerApprovalStatus === 'Approved' || app.branchManagerApprovalStatus === 'Rejected';
    });
  }

  /**
   * Branch Manager approves a loan application.
   * Moves application to "ready for Loan Disbursement" stage.
   * Does NOT auto-disburse.
   */
  public branchManagerApprove(
    id: string,
    remarks: string,
    managerName: string,
    branchId: string
  ): CreditApplicant {
    this.applicants = this.applicants.map(app => {
      if (app.id === id) {
        return {
          ...app,
          branchManagerApprovalStatus: 'Approved' as const,
          branchManagerRemarks: remarks,
          branchManagerApprovedBy: managerName,
          branchManagerApprovedAt: new Date().toLocaleString(),
          branchManagerBranchId: branchId,
        };
      }
      return app;
    });
    this.saveState();
    return this.getApplicantById(id)!;
  }

  /**
   * Branch Manager rejects a loan application.
   */
  public branchManagerReject(
    id: string,
    remarks: string,
    managerName: string,
    branchId: string
  ): CreditApplicant {
    this.applicants = this.applicants.map(app => {
      if (app.id === id) {
        return {
          ...app,
          branchManagerApprovalStatus: 'Rejected' as const,
          branchManagerRemarks: remarks,
          branchManagerApprovedBy: managerName,
          branchManagerApprovedAt: new Date().toLocaleString(),
          branchManagerBranchId: branchId,
        };
      }
      return app;
    });
    this.saveState();
    return this.getApplicantById(id)!;
  }
}

export const creditManagerService = new CreditManagerService();
