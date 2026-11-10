// ──────────────────────────────────────────────────
// Golden Leaf Finance — Employee Service
// Firestore CRUD + Cloudinary photo/ID uploads
// ──────────────────────────────────────────────────

import type {
  Employee,
  EmployeeFormData,
  EmployeeStatus,
} from '../types';
import type { UserRole } from '../types/auth.types';
import {
  createDocumentWithId,
  getDocument,
  updateDocument,
  softDeleteDocument,
  hardDeleteDocument,
  queryDocuments,
  listenToDocument,
  listenToCollection,
  type FirestoreFilter,
  type Unsubscribe,
} from './firestore';
import { uploadEmployeePhoto, uploadEmployeeIdProof } from './cloudinary';

const COLLECTION = 'employees';

// Local Cache for offline support & resilience
let localEmployeeCache: Employee[] = [];
try {
  const stored = localStorage.getItem('glf_employees_cache');
  if (stored) {
    localEmployeeCache = JSON.parse(stored);
  }
} catch (e) {
  console.error("Could not load local employee cache", e);
}

const saveLocalCache = () => {
  try {
    localStorage.setItem('glf_employees_cache', JSON.stringify(localEmployeeCache));
  } catch (e) {
    console.error("Could not save local employee cache", e);
  }
};

// ─── Create ───

/**
 * Create a new employee record.
 * The employee doc ID should match their Firebase Auth UID.
 * Uploads photo and ID proof to Cloudinary.
 */
export async function createEmployee(
  uid: string,
  formData: EmployeeFormData,
  companyId: string
): Promise<void> {
  // Upload photo to Cloudinary if provided
  let photoUrl: string | undefined;
  if (formData.photo) {
    photoUrl = await uploadEmployeePhoto(formData.photo, uid);
  }

  // Upload ID proof to Cloudinary if provided
  let idProofUrl: string | undefined;
  if (formData.idProof) {
    idProofUrl = await uploadEmployeeIdProof(formData.idProof, uid);
  }

  const employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> = {
    companyId,
    branchId: formData.branchId,
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    role: formData.role,
    photoUrl,
    idProofUrl,
    address: formData.address,
    status: 'active',
    isDeleted: false,
  };

  try {
    await createDocumentWithId<Employee>(COLLECTION, uid, employeeData);
  } catch (error) {
    console.warn("Firestore write failed. Falling back to local offline cache.", error);
    localEmployeeCache.push({
      ...employeeData,
      id: uid,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Employee);
    saveLocalCache();
  }
}

/**
 * Restore a deleted employee (used for Ctrl+Z undo)
 */
export async function restoreEmployee(employee: Employee): Promise<void> {
  try {
    const { id, ...data } = employee;
    await createDocumentWithId<Employee>(COLLECTION, id, data);
  } catch (error) {
    console.warn("Firestore restore failed, updating local cache.", error);
    if (!localEmployeeCache.find(e => e.id === employee.id)) {
      localEmployeeCache.push(employee);
      saveLocalCache();
    }
  }
}

// ─── Read ───

/**
 * Get an employee by UID.
 */
export async function getEmployee(uid: string): Promise<Employee | null> {
  return getDocument<Employee>(COLLECTION, uid);
}

/**
 * Get employees with filters.
 */
export async function getEmployees(filters?: {
  branchId?: string;
  role?: UserRole;
  status?: EmployeeStatus;
  companyId?: string;
}): Promise<Employee[]> {
  const queryFilters: FirestoreFilter[] = [];

  if (filters?.branchId) {
    queryFilters.push({ field: 'branchId', operator: '==', value: filters.branchId });
  }
  if (filters?.role) {
    queryFilters.push({ field: 'role', operator: '==', value: filters.role });
  }
  if (filters?.status) {
    queryFilters.push({ field: 'status', operator: '==', value: filters.status });
  }
  if (filters?.companyId) {
    queryFilters.push({ field: 'companyId', operator: '==', value: filters.companyId });
  }

  try {
    const firestoreEmployees = await queryDocuments<Employee>(COLLECTION, {
      filters: queryFilters,
      sort: { field: 'name', direction: 'asc' },
    });
    
    // Combine firestore employees with any created locally during offline session
    const combined = [...firestoreEmployees];
    for (const localEmp of localEmployeeCache) {
      if (!combined.some(e => e.id === localEmp.id)) {
        combined.push(localEmp);
      }
    }
    return combined;
  } catch (error) {
    console.warn("Firestore read failed. Returning local cache.", error);
    return [...localEmployeeCache];
  }
}

/**
 * Get Customer Relationship Officers (CROs) for a branch.
 */
export async function getCollectionAgents(branchId: string): Promise<Employee[]> {
  return getEmployees({ branchId, role: 'collection_agent', status: 'active' });
}

/**
 * Get all active employees for a branch.
 */
export async function getBranchEmployees(branchId: string): Promise<Employee[]> {
  return getEmployees({ branchId, status: 'active' });
}

// ─── Update ───

/**
 * Update employee details. Handles photo re-upload if a new file is provided.
 */
export async function updateEmployee(
  uid: string,
  formData: Partial<EmployeeFormData>
): Promise<void> {
  const updates: Record<string, unknown> = {};

  if (formData.name !== undefined) updates.name = formData.name;
  if (formData.email !== undefined) updates.email = formData.email;
  if (formData.phone !== undefined) updates.phone = formData.phone;
  if (formData.role !== undefined) updates.role = formData.role;
  if (formData.branchId !== undefined) updates.branchId = formData.branchId;
  if (formData.address !== undefined) updates.address = formData.address;

  // Handle photo upload
  if (formData.photo) {
    updates.photoUrl = await uploadEmployeePhoto(formData.photo, uid);
  }

  // Handle ID proof upload
  if (formData.idProof) {
    updates.idProofUrl = await uploadEmployeeIdProof(formData.idProof, uid);
  }

  if (Object.keys(updates).length > 0) {
    await updateDocument(COLLECTION, uid, updates);
  }
}

/**
 * Update employee status.
 */
export async function updateEmployeeStatus(
  uid: string,
  status: EmployeeStatus
): Promise<void> {
  try {
    await updateDocument(COLLECTION, uid, { status });
  } catch (error) {
    console.warn("Firestore update failed, updating local cache.", error);
    const emp = localEmployeeCache.find(e => e.id === uid);
    if (emp) {
      emp.status = status;
      saveLocalCache();
    }
  }
}

/**
 * Update last login timestamp.
 */
export async function updateLastLogin(uid: string): Promise<void> {
  await updateDocument(COLLECTION, uid, { lastLoginAt: new Date() });
}

// ─── Delete ───

/**
 * Soft-delete an employee.
 */
export async function deleteEmployee(
  uid: string,
  deletedBy: string
): Promise<void> {
  await softDeleteDocument(COLLECTION, uid, deletedBy);
}

/**
 * Hard-delete an employee completely from the database.
 */
export async function hardDeleteEmployee(uid: string): Promise<void> {
  try {
    await hardDeleteDocument(COLLECTION, uid);
  } catch (error) {
    console.warn("Firestore delete failed, updating local cache.", error);
    localEmployeeCache = localEmployeeCache.filter(e => e.id !== uid);
    saveLocalCache();
  }
}

// ─── Real-time Listeners ───

/**
 * Listen to a single employee in real-time.
 */
export function listenToEmployee(
  uid: string,
  callback: (employee: Employee | null) => void
): Unsubscribe {
  return listenToDocument<Employee>(COLLECTION, uid, callback);
}

/**
 * Listen to employees for a branch in real-time.
 */
export function listenToBranchEmployees(
  branchId: string,
  callback: (employees: Employee[]) => void
): Unsubscribe {
  return listenToCollection<Employee>(
    COLLECTION,
    {
      filters: [{ field: 'branchId', operator: '==', value: branchId }],
      sort: { field: 'name', direction: 'asc' },
    },
    callback
  );
}
