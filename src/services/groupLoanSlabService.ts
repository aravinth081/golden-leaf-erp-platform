// ──────────────────────────────────────────────────
// Golden Leaf Finance — Group Loan Rate Slab & Fee Service
// Centralized interest rate, insurance fee & document fee engine
// Configured by Admin, BM, and CM; Auto-applied for CRE in field registration
// ──────────────────────────────────────────────────

import { isSupabaseConfigured, supabase } from '../lib/supabase';

export interface GroupLoanSlab {
  id: string;
  minWeeks: number;
  maxWeeks: number;
  label: string;
  interestRate: number; // Annual % p.a. (e.g. 24)
  insuranceFeeType: 'percentage' | 'fixed';
  insuranceFeeValue: number; // e.g. 1.0 (1%) or 150 (₹)
  documentFeeType: 'percentage' | 'fixed';
  documentFeeValue: number; // e.g. 250 (₹) or 1.0 (%)
  isActive: boolean;
}

export const DEFAULT_GROUP_LOAN_SLABS: GroupLoanSlab[] = [
  {
    id: 'slab-15-18',
    minWeeks: 15,
    maxWeeks: 18,
    label: '15 – 18 Weeks (~3.5 – 4.2 Months)',
    interestRate: 24.0,
    insuranceFeeType: 'percentage',
    insuranceFeeValue: 1.0, // 1% of Principal
    documentFeeType: 'fixed',
    documentFeeValue: 250, // ₹250
    isActive: true,
  },
  {
    id: 'slab-19-25',
    minWeeks: 19,
    maxWeeks: 25,
    label: '19 – 25 Weeks (~4.5 – 6.0 Months)',
    interestRate: 22.0,
    insuranceFeeType: 'percentage',
    insuranceFeeValue: 1.0, // 1% of Principal
    documentFeeType: 'fixed',
    documentFeeValue: 300, // ₹300
    isActive: true,
  },
  {
    id: 'slab-26-30',
    minWeeks: 26,
    maxWeeks: 30,
    label: '26 – 30 Weeks (~6.5 – 7.0 Months)',
    interestRate: 20.0,
    insuranceFeeType: 'percentage',
    insuranceFeeValue: 1.5, // 1.5% of Principal
    documentFeeType: 'fixed',
    documentFeeValue: 350, // ₹350
    isActive: true,
  },
  {
    id: 'slab-31-52',
    minWeeks: 31,
    maxWeeks: 52,
    label: '31 – 52 Weeks (~7.5 – 12.0 Months)',
    interestRate: 18.0,
    insuranceFeeType: 'percentage',
    insuranceFeeValue: 2.0, // 2% of Principal
    documentFeeType: 'fixed',
    documentFeeValue: 500, // ₹500
    isActive: true,
  },
];

const STORAGE_KEY = 'glf_group_loan_rate_slabs_master';

/**
 * Retrieves all group loan slabs (from LocalStorage or defaults)
 */
export function getGroupLoanSlabs(): GroupLoanSlab[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse group loan slabs from storage:', err);
  }
  return DEFAULT_GROUP_LOAN_SLABS;
}

/**
 * Updates group loan slabs and broadcasts change event
 */
export function saveGroupLoanSlabs(slabs: GroupLoanSlab[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slabs));
    window.dispatchEvent(new CustomEvent('glf-group-loan-slabs-updated', { detail: slabs }));

    // Sync to Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      const upsertRows = slabs.map((s) => ({
        collection: 'groupLoanSlabs',
        id: s.id,
        data: s,
        is_deleted: false,
        updated_at: new Date().toISOString(),
      }));
      supabase.from('documents').upsert(upsertRows).then(({ error }) => {
        if (error) console.warn('[Supabase] Group loan slabs sync error:', error);
      }).catch((e: unknown) => console.warn('[Supabase] Group loan slabs sync failed:', e));
    }
  } catch (err) {
    console.error('Failed to save group loan slabs:', err);
  }
}

/**
 * Finds the appropriate interest slab based on the loan tenor (in weeks)
 */
export function getGroupLoanSlabForWeeks(weeks: number): GroupLoanSlab {
  const slabs = getGroupLoanSlabs().filter((s) => s.isActive);
  if (slabs.length === 0) return DEFAULT_GROUP_LOAN_SLABS[0];

  const matched = slabs.find((s) => weeks >= s.minWeeks && weeks <= s.maxWeeks);
  if (matched) return matched;

  // If weeks is less than lowest slab, match first slab
  if (weeks < slabs[0].minWeeks) return slabs[0];

  // If weeks is higher than highest slab, match last slab
  return slabs[slabs.length - 1];
}

export interface LoanFeeCalculationResult {
  principal: number;
  weeks: number;
  interestRate: number;
  totalInterest: number;
  totalPayable: number;
  weeklyEMI: number;
  weeklyPrincipal: number;
  weeklyInterest: number;
  insuranceFee: number;
  documentFee: number;
  totalDeductions: number;
  netDisbursement: number;
  slab: GroupLoanSlab;
}

/**
 * Computes live EMI, interest, insurance fee, and document charges
 * automatically derived from the configured slab.
 */
export function calculateGroupLoanFees(
  principal: number,
  weeks: number,
  customInterestRate?: number | string
): LoanFeeCalculationResult {
  const P = Math.max(0, Number(principal) || 0);
  const w = Math.max(0, Number(weeks) || 0);
  const slab = getGroupLoanSlabForWeeks(w);

  // Use custom rate if provided (e.g. overridden by Admin/BM/CM), otherwise auto-derive from slab
  const parsedCustom = customInterestRate !== undefined && customInterestRate !== '' ? Number(customInterestRate) : NaN;
  const annualRate = !isNaN(parsedCustom) && parsedCustom > 0 ? parsedCustom : slab.interestRate;

  // Flat weekly interest computation: P * (rate / 100) * (weeks / 52)
  const totalInterest = w > 0 && annualRate > 0 ? Math.round(P * (annualRate / 100) * (w / 52)) : 0;
  const totalPayable = P + totalInterest;
  const weeklyEMI = w > 0 ? Math.round(totalPayable / w) : 0;
  const weeklyPrincipal = w > 0 ? Math.round(P / w) : 0;
  const weeklyInterest = w > 0 ? Math.round(totalInterest / w) : 0;

  // Calculate Insurance Fee
  let insuranceFee = 0;
  if (P > 0) {
    if (slab.insuranceFeeType === 'percentage') {
      insuranceFee = Math.round(P * (slab.insuranceFeeValue / 100));
    } else {
      insuranceFee = slab.insuranceFeeValue;
    }
  }

  // Calculate Document Fee
  let documentFee = 0;
  if (P > 0) {
    if (slab.documentFeeType === 'percentage') {
      documentFee = Math.round(P * (slab.documentFeeValue / 100));
    } else {
      documentFee = slab.documentFeeValue;
    }
  }

  const totalDeductions = insuranceFee + documentFee;
  const netDisbursement = Math.max(0, P - totalDeductions);

  return {
    principal: P,
    weeks: w,
    interestRate: annualRate,
    totalInterest,
    totalPayable,
    weeklyEMI,
    weeklyPrincipal,
    weeklyInterest,
    insuranceFee,
    documentFee,
    totalDeductions,
    netDisbursement,
    slab,
  };
}
