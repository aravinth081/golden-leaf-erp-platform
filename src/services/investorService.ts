// ──────────────────────────────────────────────────
// Golden Leaf Finance — Investor Service & Data Layer
// Master Investor Directory (Admin Exclusive Access)
// ──────────────────────────────────────────────────

import type { Investor, InvestorFormData } from '../types/investor.types';
import { calculateAge, generateInvestorId } from '../utils/fdCalculations';
import {
  createDocumentWithId,
  updateDocument,
  queryDocuments,
  listenToCollection,
} from './firestore';

const COLLECTION = 'investors';
const STORAGE_KEY = 'glf_investors_cache_v1';

const INITIAL_INVESTORS: Investor[] = [];

function getLocalInvestors(): Investor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalInvestors(list: Investor[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('LocalStorage save failed', e);
  }
}

/**
 * Get all investors with optional branch scoping
 */
export async function getInvestors(branchId?: string): Promise<Investor[]> {
  try {
    const filters = branchId ? [{ field: 'branchId', operator: '==' as const, value: branchId }] : undefined;
    const remote = await queryDocuments<Investor>(COLLECTION, { filters });
    if (remote && remote.length > 0) {
      saveLocalInvestors(remote);
      return remote;
    }
  } catch (err) {
    console.info('Using local cache for investors', err);
  }

  const local = getLocalInvestors();
  if (branchId) {
    return local.filter((i) => i.branchId === branchId);
  }
  return local;
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
    totalPrincipal: 0,
    monthlyInterest: 0,
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
