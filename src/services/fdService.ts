// ──────────────────────────────────────────────────
// Golden Leaf Finance — Fixed Deposit (FD) Service
// Complete Maker-Checker, Automation Engines & Operational Queues
// ──────────────────────────────────────────────────

import type {
  FixedDeposit,
  FDStatus,
  FDReferral,
  FDRateSlab,
  CertificateTitleOption,
  FDLienDetails,
  FDPrematureDetails,
} from '../types/fd.types';
import {
  computeFDReturns,
  computePrematureClosure,
  generateFDNumber,
  DEFAULT_RATE_SLABS,
} from '../utils/fdCalculations';
import {
  createDocumentWithId,
  updateDocument,
  queryDocuments,
} from './firestore';

const FD_COLLECTION = 'fixed_deposits';
const REFERRALS_COLLECTION = 'fd_referrals';
const SETTINGS_COLLECTION = 'system_settings';

const STORAGE_KEY_FDS = 'glf_fixed_deposits_cache_v1';
const STORAGE_KEY_REFERRALS = 'glf_fd_referrals_cache_v1';
const STORAGE_KEY_SLABS = 'glf_fd_rate_slabs_cache_v1';
const STORAGE_KEY_SETTINGS = 'glf_fd_settings_cache_v1';

// Initial Seed Fixed Deposits
const INITIAL_FDS: FixedDeposit[] = [];

// Initial Referrals Seed
const INITIAL_REFERRALS: FDReferral[] = [];

function getLocalFDs(): FixedDeposit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FDS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalFDs(list: FixedDeposit[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_FDS, JSON.stringify(list));
  } catch (e) {
    console.warn('LocalStorage save failed', e);
  }
}

function getLocalReferrals(): FDReferral[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REFERRALS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalReferrals(list: FDReferral[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REFERRALS, JSON.stringify(list));
  } catch (e) {
    console.warn('LocalStorage save failed', e);
  }
}

/**
 * Get all Fixed Deposits (optionally filtered by branch for BM isolation)
 */
export async function getFixedDeposits(branchId?: string): Promise<FixedDeposit[]> {
  try {
    const filters = branchId ? [{ field: 'branchId', operator: '==' as const, value: branchId }] : undefined;
    const remote = await queryDocuments<FixedDeposit>(FD_COLLECTION, { filters });
    if (remote && remote.length > 0) {
      saveLocalFDs(remote);
      return remote;
    }
  } catch (err) {
    console.info('Using local cache for FDs', err);
  }

  const local = getLocalFDs();
  if (branchId) {
    return local.filter((fd) => fd.branchId === branchId);
  }
  return local;
}

/**
 * Get single FD by ID
 */
export async function getFDById(id: string): Promise<FixedDeposit | null> {
  const all = await getFixedDeposits();
  return all.find((fd) => fd.id === id) || null;
}

/**
 * Book a new Fixed Deposit (Maker action)
 */
export async function bookFixedDeposit(
  data: Omit<FixedDeposit, 'id' | 'fdNumber' | 'status' | 'bondIssued' | 'createdAt' | 'updatedAt'>,
  bookedBy: string = 'branch_manager'
): Promise<FixedDeposit> {
  const current = getLocalFDs();
  const nextSeq = current.length + 1;
  const fdNumber = generateFDNumber(nextSeq);

  const newFD: FixedDeposit = {
    ...data,
    id: `fd_${Date.now()}`,
    fdNumber,
    status: 'Pending Approval',
    bondIssued: false,
    bookedBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await createDocumentWithId(FD_COLLECTION, newFD.id, newFD);
  } catch (err) {
    console.warn('Firestore write failed, saved locally:', err);
  }

  const updated = [newFD, ...current];
  saveLocalFDs(updated);
  return newFD;
}

/**
 * Approve Fixed Deposit & Issue Bond Number (Checker / Admin action)
 */
export async function approveFixedDeposit(
  id: string,
  approvedBy: string = 'admin'
): Promise<FixedDeposit> {
  const current = getLocalFDs();
  const index = current.findIndex((fd) => fd.id === id);
  if (index === -1) throw new Error('FD not found');

  const updated: FixedDeposit = {
    ...current[index],
    status: 'Active',
    bondIssued: true,
    bondIssuedAt: new Date().toISOString(),
    approvedBy,
    approvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  current[index] = updated;
  saveLocalFDs(current);

  try {
    await updateDocument(FD_COLLECTION, id, {
      status: 'Active',
      bondIssued: true,
      bondIssuedAt: updated.bondIssuedAt,
      approvedBy,
      approvedAt: updated.approvedAt,
    });
  } catch (err) {
    console.warn('Firestore update failed:', err);
  }

  return updated;
}

/**
 * Mark Loan Against FD (LAFD) Lien
 */
export async function markFDLien(
  id: string,
  lienDetails: { loanAmount: number; reason?: string; loanReferenceNo?: string; markedBy?: string }
): Promise<FixedDeposit> {
  const current = getLocalFDs();
  const index = current.findIndex((fd) => fd.id === id);
  if (index === -1) throw new Error('FD not found');

  const target = current[index];
  const fullLien: FDLienDetails = {
    isLienMarked: true,
    loanAmount: lienDetails.loanAmount,
    loanInterestRate: target.effectiveRate + 2.0, // FD Rate + 2.0%
    lienMarkedDate: new Date().toISOString(),
    reason: lienDetails.reason || 'Loan Against Fixed Deposit (LAFD)',
    loanReferenceNo: lienDetails.loanReferenceNo || `LAFD-${Date.now().toString().slice(-6)}`,
    markedBy: lienDetails.markedBy || 'admin',
  };

  const updated: FixedDeposit = {
    ...target,
    status: 'Lien Marked',
    lienDetails: fullLien,
    updatedAt: new Date().toISOString(),
  };

  current[index] = updated;
  saveLocalFDs(current);

  try {
    await updateDocument(FD_COLLECTION, id, {
      status: 'Lien Marked',
      lienDetails: fullLien,
    });
  } catch (err) {
    console.warn('Firestore update failed:', err);
  }

  return updated;
}

/**
 * Remove LAFD Lien once loan is repaid
 */
export async function removeFDLien(id: string): Promise<FixedDeposit> {
  const current = getLocalFDs();
  const index = current.findIndex((fd) => fd.id === id);
  if (index === -1) throw new Error('FD not found');

  const updated: FixedDeposit = {
    ...current[index],
    status: 'Active',
    lienDetails: undefined,
    updatedAt: new Date().toISOString(),
  };

  current[index] = updated;
  saveLocalFDs(current);

  try {
    await updateDocument(FD_COLLECTION, id, {
      status: 'Active',
      lienDetails: null,
    });
  } catch (err) {
    console.warn('Firestore update failed:', err);
  }

  return updated;
}

/**
 * Approve Premature Closure
 */
export async function executePrematureClosure(
  id: string,
  prematureDetails: FDPrematureDetails,
  approvedBy: string = 'admin'
): Promise<FixedDeposit> {
  const current = getLocalFDs();
  const index = current.findIndex((fd) => fd.id === id);
  if (index === -1) throw new Error('FD not found');

  const updated: FixedDeposit = {
    ...current[index],
    status: 'Matured & Settled',
    prematureDetails: {
      ...prematureDetails,
      isPreclosed: true,
      approvedBy,
      approvalDate: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };

  current[index] = updated;
  saveLocalFDs(current);

  try {
    await updateDocument(FD_COLLECTION, id, {
      status: 'Matured & Settled',
      prematureDetails: updated.prematureDetails,
    });
  } catch (err) {
    console.warn('Firestore update failed:', err);
  }

  return updated;
}

/**
 * 1-Click FD Renewal Rollover
 */
export async function rolloverFDRenewal(
  id: string,
  mode: 'Principal + Interest' | 'Principal Only',
  approvedBy: string = 'admin'
): Promise<FixedDeposit> {
  const current = getLocalFDs();
  const original = current.find((fd) => fd.id === id);
  if (!original) throw new Error('FD not found');

  // Mark old as settled
  original.status = 'Matured & Settled';
  original.updatedAt = new Date().toISOString();

  // Create renewed FD
  const newPrincipal = mode === 'Principal + Interest' ? original.netMaturityValue : original.principal;
  const returns = computeFDReturns({
    principal: newPrincipal,
    tenureYears: original.tenureYears,
    tenureMonths: original.tenureMonths,
    tenureDays: original.tenureDays,
    scheme: original.scheme,
    payoutFrequency: original.payoutFrequency,
    baseRate: original.baseRate,
    isSeniorCitizen: original.isSeniorCitizen,
    isStaff: original.isStaff,
    isRenewal: true, // Loyalty bonus
    taxDeclaration: original.tdsStatus,
  });

  const nextSeq = current.length + 1;
  const renewedFD: FixedDeposit = {
    ...original,
    id: `fd_${Date.now()}`,
    fdNumber: generateFDNumber(nextSeq),
    principal: newPrincipal,
    isRenewal: true,
    effectiveRate: returns.effectiveRate,
    boosterRate: returns.boosterRate,
    valueDate: new Date().toISOString().split('T')[0],
    maturityDate: new Date(Date.now() + original.totalDays * 86400000).toISOString().split('T')[0],
    periodicPayoutAmount: returns.periodicPayoutAmount,
    totalGrossInterest: returns.totalGrossInterest,
    estimatedTDS: returns.estimatedTDS,
    netMaturityValue: returns.netMaturityValue,
    status: 'Active',
    bondIssued: true,
    bondIssuedAt: new Date().toISOString(),
    approvedBy,
    approvedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedList = [renewedFD, ...current];
  saveLocalFDs(updatedList);
  return renewedFD;
}

/**
 * FD Referral Engine (Credit Manager & CRO 3-field form)
 */
export async function submitFDReferral(
  customerName: string,
  customerPhone: string,
  employeeCode: string,
  referredByUid: string,
  referredByName: string,
  branchId: string = 'branch_chennai',
  notes?: string
): Promise<FDReferral> {
  const current = getLocalReferrals();
  const newReferral: FDReferral = {
    id: `ref_${Date.now()}`,
    companyId: 'company_main',
    branchId,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    employeeCode: employeeCode.trim().toUpperCase(),
    referredByUid,
    referredByName,
    status: 'Pending',
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await createDocumentWithId(REFERRALS_COLLECTION, newReferral.id, newReferral);
  } catch (err) {
    console.warn('Firestore write failed, saved locally:', err);
  }

  const updated = [newReferral, ...current];
  saveLocalReferrals(updated);
  return newReferral;
}

export async function getFDReferrals(branchId?: string): Promise<FDReferral[]> {
  const local = getLocalReferrals();
  if (branchId) {
    return local.filter((r) => r.branchId === branchId);
  }
  return local;
}

/**
 * Rate Slabs Management
 */
export function getRateSlabs(): FDRateSlab[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SLABS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SLABS, JSON.stringify(DEFAULT_RATE_SLABS));
      return DEFAULT_RATE_SLABS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_RATE_SLABS;
  }
}

export function updateRateSlabs(slabs: FDRateSlab[]): void {
  localStorage.setItem(STORAGE_KEY_SLABS, JSON.stringify(slabs));
}

/**
 * Regulatory Certificate Title Setting
 */
export function getCertificateTitleSetting(): CertificateTitleOption {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.certTitle) return parsed.certTitle;
    }
  } catch {}
  return 'Fixed Deposit (FD) Bond';
}

export function setCertificateTitleSetting(title: CertificateTitleOption): void {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) || '{}');
    current.certTitle = title;
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(current));
  } catch (e) {
    console.warn('Setting save error', e);
  }
}

/**
 * 3-Second Visual Clarity Top-Level KPI Ribbon Metrics
 * Scoped by branch for Branch Manager, Company-wide for Admin
 */
export function getFDKPIMetrics(branchId?: string) {
  const all = getLocalFDs();
  const list = branchId ? all.filter((fd) => fd.branchId === branchId) : all;

  const activeFDs = list.filter((fd) => fd.status === 'Active');
  const maturingFDs = list.filter((fd) => fd.status === 'Maturing Soon');
  const pendingFDs = list.filter((fd) => fd.status === 'Pending Approval');
  const lienFDs = list.filter((fd) => fd.status === 'Lien Marked');

  // Total FD Corpus: Active + Cumulative Pool
  const totalCorpus = activeFDs.reduce((sum, fd) => sum + (fd.principal || 0), 0);

  // This Month Payout: 1st & 5th queue
  const monthlyPayoutCommitment = activeFDs
    .filter((fd) => fd.scheme === 'non-cumulative' && fd.payoutFrequency === 'Monthly')
    .reduce((sum, fd) => sum + (fd.periodicPayoutAmount || 0), 0);

  return {
    totalCorpus,
    activeBondsCount: activeFDs.length,
    monthlyPayoutCommitment,
    maturingCount: maturingFDs.length,
    pendingCount: pendingFDs.length,
    lienCount: lienFDs.length,
    totalCount: list.length,
  };
}
