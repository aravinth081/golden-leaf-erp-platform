// ──────────────────────────────────────────────────
// Golden Leaf Finance — Investor Service & Data Layer
// Master Investor Directory (Admin Exclusive Access)
// ──────────────────────────────────────────────────

import type { Investor, InvestorFormData } from '../types/investor.types';
import { calculateAge, generateInvestorId, isSeniorCitizen } from '../utils/fdCalculations';
import {
  createDocumentWithId,
  updateDocument,
  queryDocuments,
  listenToCollection,
} from './firestore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const COLLECTION = 'investors';
const STORAGE_KEY = 'glf_investors_cache_v1';

const INITIAL_INVESTORS: Investor[] = [];

/**
 * Link and calculate real-time FD metrics for an investor
 */
export function syncInvestorWithFDs(inv: Investor, allFDs?: any[]): Investor {
  let fds = allFDs;
  if (!fds) {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('glf_fixed_deposits_cache_v1') : null;
      fds = raw ? JSON.parse(raw) : [];
    } catch {
      fds = [];
    }
  }

  const linked = (fds || []).filter((f: any) => {
    if (!f) return false;
    if (f.investorId && (
      f.investorId.trim().toUpperCase() === inv.investorId.trim().toUpperCase() ||
      f.investorId === inv.id
    )) return true;
    if (f.investorPan && inv.pan && f.investorPan.trim().toUpperCase() === inv.pan.trim().toUpperCase()) return true;
    if (f.investorMobile && inv.primaryMobile && f.investorMobile.replace(/\D/g, '') === inv.primaryMobile.replace(/\D/g, '')) return true;
    if (f.investorName && inv.fullName && f.investorName.trim().toLowerCase() === inv.fullName.trim().toLowerCase()) return true;
    return false;
  });

  const activeFDs = linked.filter((f: any) => f.status === 'Active' || f.status === 'Maturing Soon' || f.status === 'Lien Marked');
  const activeCount = activeFDs.length;

  const fdPrincipal = linked.reduce((sum: number, f: any) => sum + (Number(f.principal) || 0), 0);
  const directPrincipal = Number(inv.investmentAmount) || Number(inv.totalPrincipal) || 0;
  const principal = fdPrincipal > 0 ? fdPrincipal : directPrincipal;

  // Monthly Outflow (Monthly Interest Commitment)
  let monthly = 0;
  if (activeFDs.length > 0) {
    monthly = activeFDs.reduce((sum: number, f: any) => {
      if (f.monthlyPayout && f.monthlyPayout > 0) return sum + Number(f.monthlyPayout);
      if (f.periodicPayoutAmount && f.payoutFrequency === 'Monthly') return sum + Number(f.periodicPayoutAmount);
      if (f.periodicPayoutAmount && f.payoutFrequency === 'Quarterly') return sum + Math.round(Number(f.periodicPayoutAmount) / 3);
      if (f.periodicPayoutAmount && f.payoutFrequency === 'Yearly') return sum + Math.round(Number(f.periodicPayoutAmount) / 12);
      return sum + Math.round((Number(f.principal) * (Number(f.effectiveRate) / 100)) / 12);
    }, 0);
  } else if (principal > 0) {
    const rate = Number(inv.interestRate) || (inv.category === 'Senior Citizen' ? 10.0 : 12.0);
    monthly = Number(inv.monthlyInterest) > 0 ? Number(inv.monthlyInterest) : Math.round((principal * (rate / 100)) / 12);
  }

  // Weighted Effective Rate
  let rate = Number(inv.interestRate) || 0;
  if (activeFDs.length > 0 && fdPrincipal > 0) {
    rate = activeFDs.reduce((sum: number, f: any) => sum + (Number(f.principal) * Number(f.effectiveRate)), 0) / fdPrincipal;
  }
  if (rate <= 0) {
    rate = inv.category === 'Senior Citizen' ? 10.0 : 12.0;
  }

  return {
    ...inv,
    activeFDsCount: activeCount,
    totalPrincipal: principal,
    investmentAmount: principal,
    monthlyInterest: monthly,
    interestRate: rate,
  };
}

export function getLocalInvestors(): Investor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const list: Investor[] = JSON.parse(raw);
    return list.map((i) => syncInvestorWithFDs(i));
  } catch {
    return [];
  }
}

export function saveLocalInvestors(list: Investor[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('glf_investor_updated', { detail: list }));
    }
  } catch (e) {
    console.warn('LocalStorage save failed', e);
  }

  // Persistent Cloud Sync to Supabase
  if (isSupabaseConfigured() && supabase && list.length > 0) {
    const upsertRows = list.map((inv) => ({
      collection: COLLECTION,
      id: inv.id,
      data: inv,
      is_deleted: false,
      updated_at: new Date().toISOString(),
    }));
    void supabase.from('documents').upsert(upsertRows).then();
  }
}

/**
 * Get all investors with optional branch scoping
 */
export async function getInvestors(branchId?: string): Promise<Investor[]> {
  let list: Investor[] = [];
  try {
    const filters = branchId ? [{ field: 'branchId', operator: '==' as const, value: branchId }] : undefined;
    const remote = await queryDocuments<Investor>(COLLECTION, { filters });
    if (remote && remote.length > 0) {
      list = remote;
    }
  } catch (err) {
    console.info('Using local cache for investors', err);
  }

  if (list.length === 0) {
    list = getLocalInvestors();
  }

  const synced = list.map((i) => syncInvestorWithFDs(i));
  saveLocalInvestors(synced);

  if (branchId) {
    return synced.filter((i) => i.branchId === branchId);
  }
  return synced;
}

/**
 * Get single investor by ID or InvestorID code
 */
export async function getInvestorById(idOrCode: string): Promise<Investor | null> {
  const all = await getInvestors();
  return all.find((i) => i.id === idOrCode || i.investorId === idOrCode) || null;
}

/**
 * Register a new Investor
 */
export async function createInvestor(
  data: InvestorFormData,
  companyId: string = 'company_main',
  registeredBy: string = 'admin'
): Promise<Investor> {
  const current = getLocalInvestors();
  const nextSeq = current.length + 1;
  const investorId = generateInvestorId(nextSeq);
  const age = calculateAge(data.dob);

    const principal = Number(data.investmentAmount) || 0;
    const isSenior = isSeniorCitizen(data.dob);
    const interestRate = Number(data.interestRate) > 0 ? Number(data.interestRate) : (isSenior ? 10.0 : 12.0);
    const tenureMonths = Number(data.tenureMonths) || 12;
    const tenureYears = Number(data.tenureYears) || Math.max(1, Math.round(tenureMonths / 12));
    const payoutFrequency = data.payoutFrequency || 'Monthly';
    const investmentDate = data.investmentDate || new Date().toISOString().slice(0, 10);
    
    // Calculate maturity date based on tenureMonths
    const calcMaturityDate = () => {
      if (data.maturityDate) return data.maturityDate;
      const d = new Date(investmentDate);
      d.setMonth(d.getMonth() + tenureMonths);
      return d.toISOString().slice(0, 10);
    };
    const maturityDate = calcMaturityDate();
    
    // Auto-calculate interest returns like FD
    const monthlyInterest = principal > 0 ? Math.round((principal * (interestRate / 100)) / 12) : 0;
    const totalInterestPayable = data.totalInterestPayable ?? Math.round(principal * (interestRate / 100) * (tenureMonths / 12));
    const maturityAmount = data.maturityAmount ?? (principal + totalInterestPayable);
    const bondNumber = `GLF/INV-BOND/${new Date().getFullYear()}/${String(nextSeq).padStart(4, '0')}`;

    const newInvestor: Investor = {
      id: `inv_${Date.now()}`,
      investorId,
      companyId,
      branchId: data.branchId || 'branch_chennai',
      branchName: data.branchName || 'Chennai Main Branch',
      category: data.category,
      fullName: data.fullName.trim(),
      fatherSpouseName: data.fatherSpouseName.trim(),
      dob: data.dob,
      age,
      gender: data.gender,
      primaryMobile: data.primaryMobile.trim(),
      secondaryMobile: data.secondaryMobile?.trim() || '',
      email: data.email?.trim() || '',
      address: {
        doorNo: data.doorNo.trim(),
        street: data.street.trim(),
        town: data.town.trim(),
        district: data.district.trim(),
        state: data.state.trim(),
        pinCode: data.pinCode.trim(),
      },
      pan: data.pan.trim().toUpperCase(),
      aadhaar: data.aadhaar.trim(),
      taxDeclaration: data.taxDeclaration,
      kycStatus: data.pan && data.aadhaar ? 'Verified' : 'Pending',
      documents: data.documents || {},
      bankAccount: {
        holderName: data.bankHolderName.trim(),
        bankName: data.bankName.trim(),
        branchName: data.bankBranch.trim(),
        accountNumber: data.accountNumber.trim(),
        ifsc: data.ifsc.trim().toUpperCase(),
        accountType: data.accountType,
        payoutMode: data.payoutMode,
      },
      activeFDsCount: 0,
      totalPrincipal: principal,
      investmentAmount: principal,
      interestRate,
      tenureYears,
      tenureMonths,
      payoutFrequency,
      investmentDate,
      maturityDate,
      totalInterestPayable,
      maturityAmount,
      bondNumber,
      monthlyInterest,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

  try {
    await createDocumentWithId(COLLECTION, newInvestor.id, newInvestor);
  } catch (err) {
    console.warn('Firestore write failed, saved locally:', err);
  }

  const updated = [newInvestor, ...current];
  saveLocalInvestors(updated);
  return newInvestor;
}

/**
 * Update existing investor
 */
export async function updateInvestor(
  id: string,
  updates: Partial<Investor>
): Promise<Investor> {
  const current = getLocalInvestors();
  const index = current.findIndex((i) => i.id === id);
  if (index === -1) throw new Error('Investor not found');

  const updatedInvestor = {
    ...current[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  current[index] = updatedInvestor;
  saveLocalInvestors(current);

  try {
    await updateDocument(COLLECTION, id, updates);
  } catch (err) {
    console.warn('Firestore update failed:', err);
  }

  return updatedInvestor;
}

/**
 * Instant Search Engine (sub-second lookup by mobile, name, PAN, or Investor ID)
 * Scoped to branch for Branch Manager, company-wide for Admin
 */
export function searchInvestorsLocally(queryText: string, branchId?: string): Investor[] {
  const list = getLocalInvestors();
  const q = queryText.trim().toLowerCase();
  if (!q) return [];

  return list.filter((inv) => {
    const matchesBranch = !branchId || inv.branchId === branchId;
    const matchesQuery =
      inv.primaryMobile.includes(q) ||
      inv.fullName.toLowerCase().includes(q) ||
      inv.pan.toLowerCase().includes(q) ||
      inv.investorId.toLowerCase().includes(q);
    return matchesBranch && matchesQuery;
  });
}

/**
 * Aggregate KPI stats for Investor module
 */
export function getInvestorMetrics(branchId?: string) {
  const all = getLocalInvestors();
  const filtered = branchId ? all.filter((i) => i.branchId === branchId) : all;

  return {
    totalInvestors: filtered.length,
    totalPrincipal: filtered.reduce((sum, i) => sum + (i.totalPrincipal || 0), 0),
    totalMonthlyInterest: filtered.reduce((sum, i) => sum + (i.monthlyInterest || 0), 0),
    totalActiveFDs: filtered.reduce((sum, i) => sum + (i.activeFDsCount || 0), 0),
    seniorCitizens: filtered.filter((i) => i.category === 'Senior Citizen' || i.age >= 60).length,
    verifiedKYC: filtered.filter((i) => i.kycStatus === 'Verified').length,
    pendingKYC: filtered.filter((i) => i.kycStatus === 'Pending').length,
  };
}
