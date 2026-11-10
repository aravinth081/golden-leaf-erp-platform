// ──────────────────────────────────────────────────
// Golden Leaf Finance — End of Day (EOD) Cash & Collection Settlement Service
// Multi-Tier Workflow:
// 1. CRO (Customer Relationship Officer) enters collected notes count (₹500, ₹2000, ₹100, ₹50, etc.)
// 2. Branch Manager inspects physical cash, counts notes, and verifies into safe vault
// 3. Admin views consolidated verified data across all branches and exports official PDF reports
// ──────────────────────────────────────────────────

export interface DenominationBreakdown {
  notes2000?: number; // ₹2000 notes (withdrawn from circulation)
  notes500: number;  // ₹500 notes
  notes200: number;  // ₹200 notes
  notes100: number;  // ₹100 notes
  notes50: number;   // ₹50 notes
  notes20: number;   // ₹20 notes
  notes10: number;   // ₹10 notes
  coins: number;     // Coins total amount (₹1, ₹2, ₹5, ₹10)
}

export type EODSettlementStatus =
  | 'PENDING_BRANCH_MANAGER' // Submitted by CRO, awaiting BM physical verification
  | 'VERIFIED'               // Confirmed and verified by Branch Manager into safe vault
  | 'REJECTED';              // Returned to CRO for recount/rectification

export interface EODSettlementRecord {
  id: string; // e.g. "EOD-20261014-001"
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO
  displayTime: string; // "14 Oct 2026, 05:30 PM"

  // Officer / Submitter Info (CRO)
  agentId: string;
  agentName: string;
  agentRole: string; // "Customer Relationship Officer (CRO)"
  branchId: string;
  branchName: string;
  centersCovered: string; // e.g. "Center 01, Center 03 - Shenoy Nagar"

  // System Recorded Demand & Collections
  systemExpectedCash: number;  // System cash receipts
  systemDigitalAmount: number; // UPI / Bank transfer receipts
  systemTotalCollected: number; // Cash + UPI
  totalReceiptsCount: number;  // Number of borrowers collected from

  // Physical Cash Denominations (Notes Count)
  denominations: DenominationBreakdown;
  physicalCashTotal: number; // Computed: 500*c + 200*c + 100*c + 50*c + 20*c + 10*c + coins

  // Digital Collections Summary
  upiTransactionCount: number;
  upiTotalAmount: number;

  // Reconciliation Variance
  variance: number; // physicalCashTotal - systemExpectedCash (0 = balanced)
  reconciliationStatus: 'BALANCED' | 'SHORTAGE' | 'EXCESS';

  // CRO Handover remarks
  croRemarks: string;

  // Branch Manager Verification Block
  status: EODSettlementStatus;
  verifiedBy?: {
    userId: string;
    userName: string;
    role: string;
    verifiedAt: string;
    verifiedAtDisplay: string;
  };
  bmRemarks?: string;
  safeBoxReference?: string; // e.g. "Branch Locker Safe #A-02"
}

export interface CreateEODInput {
  agentId: string;
  agentName: string;
  agentRole: string;
  branchId: string;
  branchName: string;
  centersCovered: string;
  date: string;
  systemExpectedCash: number;
  systemDigitalAmount: number;
  totalReceiptsCount: number;
  denominations: DenominationBreakdown;
  upiTransactionCount: number;
  upiTotalAmount: number;
  croRemarks: string;
}

export interface VerifyEODInput {
  settlementId: string;
  bmId: string;
  bmName: string;
  bmRole: string;
  bmRemarks: string;
  safeBoxReference: string;
}

const STORAGE_KEY = 'glf_eod_settlements_v2';

// Calculate total cash value from note counts
export function calculatePhysicalCashTotal(d: DenominationBreakdown): number {
  return (
    ((d.notes2000 ? Number(d.notes2000) * 2000 : 0)) +
    (Number(d.notes500) || 0) * 500 +
    (Number(d.notes200) || 0) * 200 +
    (Number(d.notes100) || 0) * 100 +
    (Number(d.notes50) || 0) * 50 +
    (Number(d.notes20) || 0) * 20 +
    (Number(d.notes10) || 0) * 10 +
    (Number(d.coins) || 0)
  );
}

const SEED_EOD_SETTLEMENTS: EODSettlementRecord[] = [];
export function getStoredEODSettlements(): EODSettlementRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Failed to get EOD settlements:', e);
    return [];
  }
}

export function saveStoredEODSettlements(records: EODSettlementRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('glf_eod_updated', { detail: { records } }));
    }
  } catch (e) {
    console.error('Failed to save EOD settlements:', e);
  }
}

export function submitEODSettlement(input: CreateEODInput): EODSettlementRecord {
  const current = getStoredEODSettlements();
  const now = new Date();
  const dateCompact = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const countToday = current.filter((r) => r.date === input.date).length + 1;
  const newId = `EOD-${dateCompact}-${String(countToday).padStart(3, '0')}`;

  const physicalCashTotal = calculatePhysicalCashTotal(input.denominations);
  const variance = physicalCashTotal - input.systemExpectedCash;
  const reconciliationStatus: 'BALANCED' | 'SHORTAGE' | 'EXCESS' =
    variance === 0 ? 'BALANCED' : variance < 0 ? 'SHORTAGE' : 'EXCESS';

  const displayTime =
    now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' +
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const record: EODSettlementRecord = {
    id: newId,
    date: input.date,
    timestamp: now.toISOString(),
    displayTime,
    agentId: input.agentId,
    agentName: input.agentName,
    agentRole: input.agentRole,
    branchId: input.branchId,
    branchName: input.branchName,
    centersCovered: input.centersCovered,
    systemExpectedCash: input.systemExpectedCash,
    systemDigitalAmount: input.systemDigitalAmount,
    systemTotalCollected: input.systemExpectedCash + input.systemDigitalAmount,
    totalReceiptsCount: input.totalReceiptsCount,
    denominations: input.denominations,
    physicalCashTotal,
    upiTransactionCount: input.upiTransactionCount,
    upiTotalAmount: input.upiTotalAmount,
    variance,
    reconciliationStatus,
    croRemarks: input.croRemarks,
    status: 'PENDING_BRANCH_MANAGER',
  };

  const updated = [record, ...current];
  saveStoredEODSettlements(updated);
  return record;
}

export function verifyEODSettlement(input: VerifyEODInput): EODSettlementRecord | null {
  const current = getStoredEODSettlements();
  const idx = current.findIndex((r) => r.id === input.settlementId);
  if (idx === -1) return null;

  const now = new Date();
  const verifiedAtDisplay =
    now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' +
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const updated: EODSettlementRecord = {
    ...current[idx],
    status: 'VERIFIED',
    verifiedBy: {
      userId: input.bmId,
      userName: input.bmName,
      role: input.bmRole,
      verifiedAt: now.toISOString(),
      verifiedAtDisplay,
    },
    bmRemarks: input.bmRemarks || 'Physical note denomination verified and deposited into branch cash vault.',
    safeBoxReference: input.safeBoxReference || 'Main Branch Safe Locker #01',
  };

  current[idx] = updated;
  saveStoredEODSettlements(current);
  return updated;
}

export function rejectEODSettlement(
  settlementId: string,
  bmName: string,
  bmRole: string,
  rejectionReason: string
): EODSettlementRecord | null {
  const current = getStoredEODSettlements();
  const idx = current.findIndex((r) => r.id === settlementId);
  if (idx === -1) return null;

  const now = new Date();
  const verifiedAtDisplay =
    now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' +
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const updated: EODSettlementRecord = {
    ...current[idx],
    status: 'REJECTED',
    verifiedBy: {
      userId: 'BM-ACT',
      userName: bmName,
      role: bmRole,
      verifiedAt: now.toISOString(),
      verifiedAtDisplay,
    },
    bmRemarks: rejectionReason || 'Denomination mismatch observed. Returned to CRO for recount.',
  };

  current[idx] = updated;
  saveStoredEODSettlements(current);
  return updated;
}
