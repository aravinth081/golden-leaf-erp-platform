// ──────────────────────────────────────────────────
// Golden Leaf Finance — Center Service
// Local-First Persistent Center Directory
// ──────────────────────────────────────────────────

import { createDocument, queryDocuments } from './firestore';

const COLLECTION = 'centers';
const LOCAL_STORAGE_KEY = 'golden_leaf_centers_master';

export interface Center {
  id: string;
  shortId: string;
  name: string;
  latitude: string;
  longitude: string;
  leader: string;
  mobileNumber: string;
  isDeleted: boolean;
  createdAt: Date;
}

export let localCentersCache: Center[] = [];

try {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    localCentersCache = JSON.parse(stored).map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt)
    }));
  }
} catch (error) {
  console.warn("Failed to load centers from localStorage", error);
}

export function saveLocalCenters() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localCentersCache));
  } catch (error) {
    console.warn("Failed to save centers to localStorage", error);
  }
}

function generateShortId(index: number): string {
  const nextId = 1 + index;
  return nextId.toString().padStart(3, '0');
}

export async function createCenter(
  data: Omit<Center, 'id' | 'shortId' | 'createdAt' | 'isDeleted'>
): Promise<void> {
  const currentCenters = await getCenters();
  const shortId = generateShortId(currentCenters.length);
  
  const centerData = {
    ...data,
    shortId,
    isDeleted: false,
    createdAt: new Date(),
  };

  await createDocument(COLLECTION, centerData as any);
  localCentersCache.push({
    ...centerData,
    id: `center-${shortId}-${Date.now()}`
  });
  saveLocalCenters();
}

export async function getCenters(): Promise<Center[]> {
  try {
    const docs = await queryDocuments<Center>(COLLECTION, {}, true);
    if (docs.length > 0) {
      return docs;
    }
  } catch (error) {
    console.warn("Using local centers cache:", error);
  }

  return localCentersCache.filter(c => !c.isDeleted);
}
