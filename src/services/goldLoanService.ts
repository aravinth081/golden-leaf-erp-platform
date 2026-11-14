// ──────────────────────────────────────────────────
// Golden Leaf Finance — Gold Loan Service
// Daily Gold Rate Master, Appraisal Engine, Vault Register & CRO 3-Field Referrals
// ──────────────────────────────────────────────────

import {
  type GoldLoanRecord,
  type GoldLoanStatus,
  type GoldRateMaster,
  type CroGoldReferral,
  type GoldAppraisalItem,
  type GoldCaratPurity,
  type GoldRepaymentScheme,
  type GoldInterestPaymentRecord,
  type GoldOverdueNoticeRecord,
  type GoldRedemptionRecord,
} from '../types/goldLoan.types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const RATE_STORAGE_KEY = 'glf_gold_rate_master_v1';
const LOANS_STORAGE_KEY = 'glf_gold_loans_v1';
const REFERRALS_STORAGE_KEY = 'glf_cro_gold_referrals_v1';

export const DEFAULT_GOLD_RATE: GoldRateMaster = {
  daily22KRatePerGram: 5850,
  maxPermittedLtvPercent: 75,
  updatedAt: new Date().toLocaleDateString('en-IN') + ' 09:00 AM',
  updatedByAdminName: 'Administrator',
};

export const INITIAL_CRO_REFERRALS: CroGoldReferral[] = [];

export const INITIAL_GOLD_LOANS: GoldLoanRecord[] = [];
class GoldLoanService {
  private rateMaster: GoldRateMaster = DEFAULT_GOLD_RATE;
  private loans: GoldLoanRecord[] = [];
  private referrals: CroGoldReferral[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const storedRate = localStorage.getItem(RATE_STORAGE_KEY);
      this.rateMaster = storedRate ? JSON.parse(storedRate) : DEFAULT_GOLD_RATE;

      const storedLoans = localStorage.getItem(LOANS_STORAGE_KEY);
      this.loans = storedLoans ? JSON.parse(storedLoans) : [];

      const storedRefs = localStorage.getItem(REFERRALS_STORAGE_KEY);
      this.referrals = storedRefs ? JSON.parse(storedRefs) : [];
    } catch {
      this.rateMaster = DEFAULT_GOLD_RATE;
      this.loans = [];
      this.referrals = [];
    }

    if (isSupabaseConfigured() && supabase) {
      void (async () => {
        try {
          const { data: rows, error } = await supabase!
            .from('documents')
            .select('collection, data')
            .in('collection', ['gold_loans', 'gold_referrals', 'gold_rate'])
            .eq('is_deleted', false);
          if (!error && Array.isArray(rows)) {
            const cloudLoans = rows.filter((r: any) => r.collection === 'gold_loans').map((r: any) => r.data).filter(Boolean);
            const cloudRefs = rows.filter((r: any) => r.collection === 'gold_referrals').map((r: any) => r.data).filter(Boolean);
            const cloudRate = rows.find((r: any) => r.collection === 'gold_rate')?.data;

            if (cloudLoans.length > 0) this.loans = cloudLoans;
            if (cloudRefs.length > 0) this.referrals = cloudRefs;
            if (cloudRate) this.rateMaster = cloudRate;
          }
        } catch (e: unknown) {
          console.warn('[Supabase] Failed to fetch gold loans:', e);
        }
      })();
    }
  }

  private saveState() {
    try {
      localStorage.setItem(RATE_STORAGE_KEY, JSON.stringify(this.rateMaster));
      localStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(this.loans));
      localStorage.setItem(REFERRALS_STORAGE_KEY, JSON.stringify(this.referrals));
    } catch (e) {
      console.warn('Failed to save gold loan state:', e);
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const upsertRows = [
          ...this.loans.map((l) => ({
            collection: 'gold_loans',
            id: l.id,
            data: l,
            is_deleted: false,
            updated_at: new Date().toISOString(),
          })),
          ...this.referrals.map((ref) => ({
            collection: 'gold_referrals',
            id: ref.id,
            data: ref,
            is_deleted: false,
            updated_at: new Date().toISOString(),
          })),
          {
            collection: 'gold_rate',
            id: 'master_rate',
            data: this.rateMaster,
            is_deleted: false,
            updated_at: new Date().toISOString(),
          },
        ];
        supabase.from('documents').upsert(upsertRows).then();
      } catch (err) {
        console.warn('[Supabase] Gold loan sync error:', err);
      }
    }
  }

  // ─── Daily Gold Rate Master & Carat Purity Adjustment ───
  public getRateMaster(): GoldRateMaster {
    return { ...this.rateMaster };
  }

  public updateRateMaster(ratePerGram: number, maxLtvPercent: number, adminName: string): GoldRateMaster {
    this.rateMaster = {
      daily22KRatePerGram: ratePerGram,
      maxPermittedLtvPercent: maxLtvPercent,
      updatedAt: new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      updatedByAdminName: adminName,
    };
    this.saveState();
    return this.rateMaster;
  }

  // Automatic Carat Rate Formula
  public getRateForPurity(purity: GoldCaratPurity): number {
    const rate22 = this.rateMaster.daily22KRatePerGram;
    if (purity === '22K') return rate22;
    if (purity === '20K') return Math.round(rate22 * (20 / 22));
    if (purity === '18K') return Math.round(rate22 * (18 / 22));
    return rate22;
  }

  // ─── CRO 3-Field Referral Management ───
  public getCroReferrals(): CroGoldReferral[] {
    return [...this.referrals];
  }

  public createCroReferral(data: {
    customerName: string;
    customerMobile: string;
    employeeId: string;
    branchId?: string;
    notes?: string;
  }): CroGoldReferral {
    const newRef: CroGoldReferral = {
      id: `GLF-REF-${new Date().getFullYear()}-${(this.referrals.length + 1).toString().padStart(3, '0')}`,
      customerName: data.customerName.trim(),
      customerMobile: data.customerMobile.replace(/[^0-9]/g, '').slice(-10),
      employeeId: data.employeeId.trim(),
      referredAt: new Date().toLocaleString('en-IN'),
      branchId: data.branchId || 'BR-01',
      status: 'PENDING',
      notes: data.notes,
    };
    this.referrals.unshift(newRef);
    this.saveState();
    return newRef;
  }

  public markReferralConverted(referralId: string, goldLoanId: string) {
    const idx = this.referrals.findIndex((r) => r.id === referralId);
    if (idx !== -1) {
      this.referrals[idx].status = 'CONVERTED';
      this.referrals[idx].convertedGoldLoanId = goldLoanId;
      this.saveState();
    }
  }

  // ─── Gold Loans Core Operations ───
  public getLoans(): GoldLoanRecord[] {
    return [...this.loans];
  }

  public getLoanById(id: string): GoldLoanRecord | undefined {
    return this.loans.find((l) => l.id.toLowerCase() === id.toLowerCase());
  }

  public searchLoans(term: string): GoldLoanRecord[] {
    const q = term.toLowerCase().trim();
    if (!q) return this.getLoans();
    return this.loans.filter(
      (l) =>
        l.customerName.toLowerCase().includes(q) ||
        l.customerMobile.includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.tamperProofPacketSerialNo.toLowerCase().includes(q)
    );
  }

  public createGoldLoan(data: Partial<GoldLoanRecord>): GoldLoanRecord {
    const year = new Date().getFullYear();
    const count = this.loans.length + 1;
    const newId = `GLF-GL-${year}-${count.toString().padStart(4, '0')}`;
    const pktNo = data.tamperProofPacketSerialNo || `GLF-PKT-${year}-${(count + 400).toString().padStart(4, '0')}`;

    const newRecord: GoldLoanRecord = {
      id: newId,
      branchId: data.branchId || 'BR-01',
      branchName: data.branchName || 'Main Branch',
      status: 'APPRAISED_AWAITING_VAULT',
      createdAt: new Date().toLocaleString('en-IN'),
      updatedAt: new Date().toLocaleString('en-IN'),

      croReferralId: data.croReferralId,
      referringEmployeeId: data.referringEmployeeId,

      customerName: data.customerName || '',
      customerMobile: data.customerMobile || '',
      customerAddress: data.customerAddress || '',
      aadhaarNumber: data.aadhaarNumber || '',
      panNumber: data.panNumber || '',
      nomineeName: data.nomineeName || '',
      nomineeRelationship: data.nomineeRelationship || 'Spouse',
      legalOwnershipDeclared: data.legalOwnershipDeclared ?? true,

      items: data.items || [],
      totalQuantity: data.totalQuantity || 0,
      totalGrossWeightGrams: data.totalGrossWeightGrams || 0,
      totalStoneDeductionGrams: data.totalStoneDeductionGrams || 0,
      totalNetWeightGrams: data.totalNetWeightGrams || 0,
      totalAppraisedEligibleValue: data.totalAppraisedEligibleValue || 0,

      liveOrnamentTrayPhotoUrl: data.liveOrnamentTrayPhotoUrl,
      liveCustomerCounterPhotoUrl: data.liveCustomerCounterPhotoUrl,

      maxEligibleLoanAmount: data.maxEligibleLoanAmount || 0,
      sanctionedLoanAmount: data.sanctionedLoanAmount || 0,
      repaymentScheme: data.repaymentScheme || 'Monthly Interest Servicing',
      tenureMonths: data.tenureMonths || 12,
      interestRateAnnual: data.interestRateAnnual || 12.0,
      monthlyInterestAmount: data.monthlyInterestAmount || 0,
      appraiserFeeAmount: data.appraiserFeeAmount || 500,
      netDisbursedAmount: data.netDisbursedAmount || 0,
      maturityDate: data.maturityDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),

      tamperProofPacketSerialNo: pktNo,
      safeVaultLocation: data.safeVaultLocation || {
        safeNumber: 'SAFE-01',
        rackCabinet: 'RACK-A',
        traySlot: 'TRAY-01',
      },

      dualCustodySignoff: data.dualCustodySignoff || {
        isCreditManagerAppraised: false,
        isBranchManagerVaultLocked: false,
      },

      interestPayments: [],
      totalInterestCollected: 0,
      overdueNotices: [],
    };

    if (data.croReferralId) {
      this.markReferralConverted(data.croReferralId, newId);
    }

    this.loans.unshift(newRecord);
    this.saveState();
    return newRecord;
  }

  // Dual-Custody Digital Vault Sign-off
  public dualCustodyVaultSign(
    loanId: string,
    role: 'credit_manager' | 'branch_manager',
    signerName: string
  ): GoldLoanRecord {
    const loan = this.getLoanById(loanId);
    if (!loan) throw new Error('Loan not found');

    const updatedSignoff = { ...loan.dualCustodySignoff };
    if (role === 'credit_manager') {
      updatedSignoff.isCreditManagerAppraised = true;
      updatedSignoff.creditManagerName = signerName;
      updatedSignoff.creditManagerSignedAt = new Date().toLocaleString('en-IN');
    } else {
      updatedSignoff.isBranchManagerVaultLocked = true;
      updatedSignoff.branchManagerName = signerName;
      updatedSignoff.branchManagerSignedAt = new Date().toLocaleString('en-IN');
    }

    const bothSigned = updatedSignoff.isCreditManagerAppraised && updatedSignoff.isBranchManagerVaultLocked;
    const newStatus: GoldLoanStatus = bothSigned ? 'VAULT_LOCKED_PENDING_UTR' : loan.status;

    return this.updateLoan(loanId, {
      dualCustodySignoff: updatedSignoff,
      status: newStatus,
    });
  }

  // Admin Release UTR & Disburse
  public disburseGoldLoan(loanId: string, utr: string, adminName: string): GoldLoanRecord {
    return this.updateLoan(loanId, {
      status: 'ACTIVE_IN_VAULT',
      adminUtrReference: utr,
      disbursedAt: new Date().toLocaleString('en-IN'),
      disbursedByAdminName: adminName,
    });
  }

  // Record Monthly Interest Payment
  public recordInterestPayment(
    loanId: string,
    amount: number,
    month: string,
    mode: 'CASH' | 'UPI' | 'BANK_TRANSFER',
    collectedBy: string
  ): GoldLoanRecord {
    const loan = this.getLoanById(loanId);
    if (!loan) throw new Error('Loan not found');

    const receipt: GoldInterestPaymentRecord = {
      id: `INT-${Date.now()}`,
      receiptNo: `GLF-GL-REC-${Date.now().toString().slice(-6)}`,
      paymentDate: new Date().toLocaleString('en-IN'),
      periodCoveredMonth: month,
      interestAmountPaid: amount,
      collectedBy,
      paymentMode: mode,
    };

    return this.updateLoan(loanId, {
      interestPayments: [receipt, ...loan.interestPayments],
      totalInterestCollected: loan.totalInterestCollected + amount,
    });
  }

  // Overdue Notices Generation
  public generateOverdueNotice(
    loanId: string,
    stage: 'NOTICE_1' | 'NOTICE_2' | 'AUCTION_INTIMATION',
    demandedAmount: number
  ): GoldLoanRecord {
    const loan = this.getLoanById(loanId);
    if (!loan) throw new Error('Loan not found');

    const notice: GoldOverdueNoticeRecord = {
      stage,
      generatedDate: new Date().toLocaleDateString('en-IN'),
      dispatchMode: 'SMS',
      daysOverdue: 15,
      demandedAmount,
      auctionScheduledDate: stage === 'AUCTION_INTIMATION' ? '2026-05-15' : undefined,
    };

    let nextStatus: GoldLoanStatus = 'OVERDUE_NOTICE_1';
    if (stage === 'NOTICE_2') nextStatus = 'OVERDUE_NOTICE_2';
    if (stage === 'AUCTION_INTIMATION') nextStatus = 'AUCTION_INTIMATION';

    return this.updateLoan(loanId, {
      status: nextStatus,
      overdueNotices: [notice, ...loan.overdueNotices],
    });
  }

  // Redemption & Safe Vault Release
  public redeemAndReleasePacket(
    loanId: string,
    data: {
      principalPaid: number;
      accruedInterestPaid: number;
      branchManagerName: string;
      borrowerSignatureName: string;
    }
  ): GoldLoanRecord {
    const loan = this.getLoanById(loanId);
    if (!loan) throw new Error('Loan not found');

    const total = data.principalPaid + data.accruedInterestPaid;
    const redemption: GoldRedemptionRecord = {
      redemptionDate: new Date().toLocaleString('en-IN'),
      totalPrincipalPaid: data.principalPaid,
      exactDayAccruedInterestPaid: data.accruedInterestPaid,
      totalSettledAmount: total,
      receiptNo: `GLF-REDM-${Date.now().toString().slice(-6)}`,
      isOriginalPawnTicketSurrendered: true,
      isOrnamentTrayMatched: true,
      tamperProofPacketSerialVerified: loan.tamperProofPacketSerialNo,
      releasedByBranchManager: data.branchManagerName,
      borrowerAcknowledgedSignature: data.borrowerSignatureName,
      nocCertificateNo: `GLF-NOC-GL-${Date.now().toString().slice(-6)}`,
    };

    return this.updateLoan(loanId, {
      status: 'REDEEMED_PACKET_RELEASED',
      redemption,
    });
  }

  private updateLoan(id: string, updates: Partial<GoldLoanRecord>): GoldLoanRecord {
    const idx = this.loans.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Gold Loan not found');
    this.loans[idx] = {
      ...this.loans[idx],
      ...updates,
      updatedAt: new Date().toLocaleString('en-IN'),
    };
    this.saveState();
    return this.loans[idx];
  }

  // Vault Audit KPI stats across all branches
  public getVaultStats() {
    const active = this.loans.filter((l) => l.status === 'ACTIVE_IN_VAULT' || l.status.startsWith('OVERDUE'));
    let totalGrossWeight = 0;
    let totalNetWeight = 0;
    let totalDisbursedCorpus = 0;
    let totalPacketsInSafe = active.length;

    active.forEach((l) => {
      totalGrossWeight += l.totalGrossWeightGrams;
      totalNetWeight += l.totalNetWeightGrams;
      totalDisbursedCorpus += l.sanctionedLoanAmount;
    });

    return {
      totalPacketsInSafe,
      totalGrossWeight: Math.round(totalGrossWeight * 1000) / 1000,
      totalNetWeight: Math.round(totalNetWeight * 1000) / 1000,
      totalDisbursedCorpus,
    };
  }
}

export const goldLoanService = new GoldLoanService();
