// ──────────────────────────────────────────────────
// Golden Leaf Finance — Collection Service
// Firestore CRUD + Cloudinary NC proof uploads
// ──────────────────────────────────────────────────

import type {
  Collection,
  CollectionFormData,
  CollectionStatus,
  CollectionSummary,
} from '../types';
import {
  getDocument,
  updateDocument,
  createDocumentWithId,
  queryDocuments,
  listenToCollection as listenToFirestoreCollection,
  serverTimestamp,
  runTransaction,
  writeBatch,
  doc,
  db,
  type FirestoreFilter,
  type Unsubscribe,
} from './firestore';
import { uploadNCProof } from './cloudinary';

const COLLECTION_NAME = 'collections';
const DAILY_CLOSING_COLLECTION = 'dailyClosing';

// ─── Record Collection ───

/**
 * Record a collection entry.
 * If NC, uploads photo proof to Cloudinary.
 * Updates the loan's collection totals.
 */
export async function recordCollection(
  formData: CollectionFormData,
  agentId: string,
  agentName: string,
  companyId: string,
  branchId: string,
  customerName: string,
  weekNumber: number,
  expectedAmount: number,
  geoLocation?: { latitude: number; longitude: number; accuracy?: number }
): Promise<string> {
  // Upload NC photo proof if provided
  let ncPhotoProofUrl: string | undefined;
  if (formData.status === 'nc' && formData.ncPhotoProof) {
    const tempId = `col_${Date.now()}`;
    ncPhotoProofUrl = await uploadNCProof(formData.ncPhotoProof, tempId);
  }

  const collectionId = `col_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const collectionData = {
    companyId,
    branchId,
    loanId: formData.loanId,
    customerId: formData.customerId,
    customerName,
    agentId,
    agentName,
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    weekNumber,
    amount: formData.status === 'nc' ? 0 : formData.amount,
    expectedAmount,
    status: formData.status,
    ncReasonCode: formData.ncReasonCode || null,
    ncRemarks: formData.ncRemarks || null,
    ncPhotoProofUrl: ncPhotoProofUrl || null,
    geoLocation: geoLocation || null,
    isReconciled: false,
    isDeleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Run in transaction to ensure consistency
  await runTransaction(db, async (transaction) => {
    const loanRef = doc(db, 'loans', formData.loanId);
    const loanDoc = await transaction.get(loanRef);
    
    if (!loanDoc.exists()) {
      throw new Error(`Loan ${formData.loanId} not found`);
    }

    const collectionRef = doc(db, COLLECTION_NAME, collectionId);
    transaction.set(collectionRef, collectionData);

    // Update loan totals if money was collected
    if (formData.status !== 'nc' && formData.amount > 0) {
      const data = loanDoc.data();
      const currentCollected = data.totalCollected || 0;
      const totalPayable = data.totalPayable || 0;
      const newTotalCollected = currentCollected + formData.amount;
      const newOutstanding = Math.max(0, totalPayable - newTotalCollected);

      transaction.update(loanRef, {
        totalCollected: newTotalCollected,
        outstanding: newOutstanding,
        lastCollectionDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  });

  return collectionId;
}

// ─── Read ───

/**
 * Get a single collection entry.
 */
export async function getCollection(collectionId: string): Promise<Collection | null> {
  return getDocument<Collection>(COLLECTION_NAME, collectionId);
}

/**
 * Get collections with filters.
 */
export async function getCollections(filters?: {
  loanId?: string;
  customerId?: string;
  agentId?: string;
  branchId?: string;
  date?: string;
  status?: CollectionStatus;
}, limitCount?: number): Promise<Collection[]> {
  const queryFilters: FirestoreFilter[] = [];

  if (filters?.loanId) {
    queryFilters.push({ field: 'loanId', operator: '==', value: filters.loanId });
  }
  if (filters?.customerId) {
    queryFilters.push({ field: 'customerId', operator: '==', value: filters.customerId });
  }
  if (filters?.agentId) {
    queryFilters.push({ field: 'agentId', operator: '==', value: filters.agentId });
  }
  if (filters?.branchId) {
    queryFilters.push({ field: 'branchId', operator: '==', value: filters.branchId });
  }
  if (filters?.date) {
    queryFilters.push({ field: 'date', operator: '==', value: filters.date });
  }
  if (filters?.status) {
    queryFilters.push({ field: 'status', operator: '==', value: filters.status });
  }

  return queryDocuments<Collection>(COLLECTION_NAME, {
    filters: queryFilters,
    sort: { field: 'createdAt', direction: 'desc' },
    limitCount,
  });
}

/**
 * Get today's collections for an agent.
 */
export async function getTodayCollections(agentId: string): Promise<Collection[]> {
  const today = new Date().toISOString().slice(0, 10);
  return getCollections({ agentId, date: today });
}

/**
 * Get collections for a loan.
 */
export async function getLoanCollections(loanId: string): Promise<Collection[]> {
  return getCollections({ loanId });
}

/**
 * Get collection summary for a branch on a given date.
 */
export async function getCollectionSummary(
  branchId: string,
  date: string
): Promise<CollectionSummary> {
  const collections = await getCollections({ branchId, date });

  const summary: CollectionSummary = {
    date,
    branchId,
    totalScheduled: collections.length,
    totalCollected: collections.filter((c) => c.status === 'collected').length,
    totalAmount: collections.reduce((sum, c) => sum + c.amount, 0),
    totalExpected: collections.reduce((sum, c) => sum + c.expectedAmount, 0),
    collectionRate: 0,
    ncCount: collections.filter((c) => c.status === 'nc').length,
    partialCount: collections.filter((c) => c.status === 'partial').length,
    advanceCount: collections.filter((c) => c.status === 'advance').length,
  };

  summary.collectionRate =
    summary.totalExpected > 0
      ? Math.round((summary.totalAmount / summary.totalExpected) * 100)
      : 0;

  return summary;
}

// ─── Verify / Reconcile ───

/**
 * Mark a collection as verified.
 */
export async function verifyCollection(
  collectionId: string,
  verifiedBy: string
): Promise<void> {
  await updateDocument(COLLECTION_NAME, collectionId, {
    verifiedBy,
    verifiedAt: new Date(),
  });
}

/**
 * Mark a collection as reconciled (part of daily closing).
 */
export async function reconcileCollection(collectionId: string): Promise<void> {
  await updateDocument(COLLECTION_NAME, collectionId, { isReconciled: true });
}

// ─── Daily Closing ───

/**
 * Create a daily closing record.
 */
export async function createDailyClosing(
  branchId: string,
  date: string,
  closedBy: string,
  cashInHand: number,
  remarks?: string
): Promise<string> {
  // Get all collections for the day
  const collections = await getCollections({ branchId, date });

  const totalAmount = collections.reduce((sum, c) => sum + c.amount, 0);
  const totalNC = collections.filter((c) => c.status === 'nc').length;
  const discrepancy = cashInHand - totalAmount;

  const closingId = `close_${Date.now()}`;
  const closingData = {
    branchId,
    date,
    closedBy,
    totalCollections: collections.length,
    totalAmount,
    totalNC,
    cashInHand,
    discrepancy,
    remarks: remarks || null,
    isLocked: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Perform a batched write for massive performance and atomicity
  const batch = writeBatch(db);
  
  const closingRef = doc(db, DAILY_CLOSING_COLLECTION, closingId);
  batch.set(closingRef, closingData);

  // Mark all collections as reconciled
  for (const col of collections) {
    const colRef = doc(db, COLLECTION_NAME, col.id);
    batch.update(colRef, { 
      isReconciled: true,
      updatedAt: serverTimestamp()
    });
  }

  await batch.commit();

  return closingId;
}

/**
 * Lock a daily closing (no more edits).
 */
export async function lockDailyClosing(closingId: string): Promise<void> {
  await updateDocument(DAILY_CLOSING_COLLECTION, closingId, { isLocked: true });
}

// ─── Real-time Listeners ───

/**
 * Listen to today's collections for a branch in real-time.
 */
export function listenToDailyCollections(
  branchId: string,
  date: string,
  callback: (collections: Collection[]) => void
): Unsubscribe {
  return listenToFirestoreCollection<Collection>(
    COLLECTION_NAME,
    {
      filters: [
        { field: 'branchId', operator: '==', value: branchId },
        { field: 'date', operator: '==', value: date },
      ],
      sort: { field: 'createdAt', direction: 'desc' },
    },
    callback
  );
}

/**
 * Listen to collections for a specific agent today.
 */
export function listenToAgentCollections(
  agentId: string,
  date: string,
  callback: (collections: Collection[]) => void
): Unsubscribe {
  return listenToFirestoreCollection<Collection>(
    COLLECTION_NAME,
    {
      filters: [
        { field: 'agentId', operator: '==', value: agentId },
        { field: 'date', operator: '==', value: date },
      ],
      sort: { field: 'createdAt', direction: 'desc' },
    },
    callback
  );
}
