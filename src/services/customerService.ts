// ──────────────────────────────────────────────────
// Golden Leaf Finance — Customer Service
// Firestore CRUD + Cloudinary image uploads for customers
// ──────────────────────────────────────────────────

import type {
  Customer,
  CustomerFormData,
  CustomerStatus,
  CustomerApprovalStatus,
  CustomerSearchFilters,
  KYCStatus,
} from '../types';
import {
  createDocument,
  getDocument,
  updateDocument,
  softDeleteDocument,
  queryDocuments,
  listenToDocument,
  listenToCollection,
  type FirestoreFilter,
  type FirestoreQueryOptions,
  type Unsubscribe,
} from './firestore';
import {
  uploadCustomerPhoto,
  uploadKYCDocument,
  uploadNomineePhoto,
} from './cloudinary';

const COLLECTION = 'customers';

// ─── Create ───

/**
 * Register a new customer.
 * Uploads photo and KYC documents to Cloudinary, then creates Firestore document.
 */
export async function createCustomer(
  formData: CustomerFormData,
  companyId: string,
  branchId: string,
  registeredBy: string
): Promise<string> {
  // Generate a temporary ID for organizing uploads
  const tempId = `cust_${Date.now()}`;

  // Upload photo to Cloudinary if provided
  let photoUrl: string | undefined;
  if (formData.photo) {
    photoUrl = await uploadCustomerPhoto(formData.photo, tempId);
  }

  // Upload KYC documents to Cloudinary
  let aadhaarFrontUrl: string | undefined;
  let aadhaarBackUrl: string | undefined;
  if (formData.aadhaarFront) {
    aadhaarFrontUrl = await uploadKYCDocument(formData.aadhaarFront, tempId, 'aadhaar_front');
  }
  if (formData.aadhaarBack) {
    aadhaarBackUrl = await uploadKYCDocument(formData.aadhaarBack, tempId, 'aadhaar_back');
  }

  // Upload nominee photo if provided
  let nomineePhotoUrl: string | undefined;
  if (formData.nomineeName && formData.nomineePhone) {
    // Nominee exists
    if ((formData as any).nomineePhoto) {
      nomineePhotoUrl = await uploadNomineePhoto((formData as any).nomineePhoto, tempId);
    }
  }

  // Build customer document
  const customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> = {
    companyId,
    branchId,
    registeredBy,
    name: formData.name,
    phone: formData.phone,
    alternatePhone: formData.alternatePhone,
    email: formData.email,
    dateOfBirth: formData.dateOfBirth,
    gender: formData.gender,
    address: formData.address,
    city: formData.city,
    state: formData.state,
    pincode: formData.pincode,
    landmark: formData.landmark,
    photoUrl,
    kyc: {
      aadhaarNumber: formData.aadhaarNumber,
      aadhaarFrontUrl,
      aadhaarBackUrl,
      panNumber: formData.panNumber,
      voterIdNumber: formData.voterIdNumber,
      status: 'pending' as KYCStatus,
      isMobileVerified: false,
    },
    nominee: formData.nomineeName
      ? {
          name: formData.nomineeName,
          relation: formData.nomineeRelation || '',
          phone: formData.nomineePhone || '',
          photoUrl: nomineePhotoUrl,
        }
      : undefined,
    status: 'active',
    approvalStatus: 'pending_registration',
    totalLoans: 0,
    activeLoans: 0,
    totalCollected: 0,
    isDeleted: false,
  };

  return createDocument<Customer>(COLLECTION, customerData);
}

// ─── Read ───

/**
 * Get a single customer by ID.
 */
export async function getCustomer(customerId: string): Promise<Customer | null> {
  return getDocument<Customer>(COLLECTION, customerId);
}

/**
 * Get customers with filters.
 */
export async function getCustomers(
  searchFilters?: CustomerSearchFilters,
  limitCount?: number
): Promise<Customer[]> {
  const filters: FirestoreFilter[] = [];

  if (searchFilters?.branchId) {
    filters.push({ field: 'branchId', operator: '==', value: searchFilters.branchId });
  }
  if (searchFilters?.status) {
    filters.push({ field: 'status', operator: '==', value: searchFilters.status });
  }
  if (searchFilters?.approvalStatus) {
    filters.push({ field: 'approvalStatus', operator: '==', value: searchFilters.approvalStatus });
  }
  if (searchFilters?.groupId) {
    filters.push({ field: 'groupId', operator: '==', value: searchFilters.groupId });
  }
  if (searchFilters?.agentId) {
    filters.push({ field: 'registeredBy', operator: '==', value: searchFilters.agentId });
  }

  const options: FirestoreQueryOptions = {
    filters,
    sort: { field: 'createdAt', direction: 'desc' },
    limitCount,
  };

  return queryDocuments<Customer>(COLLECTION, options);
}

/**
 * Get customers for a specific branch.
 */
export async function getCustomersByBranch(branchId: string): Promise<Customer[]> {
  return getCustomers({ branchId });
}

// ─── Update ───

/**
 * Update customer details. Handles photo re-upload if a new file is provided.
 */
export async function updateCustomer(
  customerId: string,
  formData: Partial<CustomerFormData>
): Promise<void> {
  const updates: Record<string, unknown> = {};

  // Handle text fields
  if (formData.name !== undefined) updates.name = formData.name;
  if (formData.phone !== undefined) updates.phone = formData.phone;
  if (formData.alternatePhone !== undefined) updates.alternatePhone = formData.alternatePhone;
  if (formData.email !== undefined) updates.email = formData.email;
  if (formData.dateOfBirth !== undefined) updates.dateOfBirth = formData.dateOfBirth;
  if (formData.gender !== undefined) updates.gender = formData.gender;
  if (formData.address !== undefined) updates.address = formData.address;
  if (formData.city !== undefined) updates.city = formData.city;
  if (formData.state !== undefined) updates.state = formData.state;
  if (formData.pincode !== undefined) updates.pincode = formData.pincode;
  if (formData.landmark !== undefined) updates.landmark = formData.landmark;

  // Handle photo upload
  if (formData.photo) {
    updates.photoUrl = await uploadCustomerPhoto(formData.photo, customerId);
  }

  // Handle KYC document uploads
  if (formData.aadhaarFront) {
    updates['kyc.aadhaarFrontUrl'] = await uploadKYCDocument(
      formData.aadhaarFront, customerId, 'aadhaar_front'
    );
  }
  if (formData.aadhaarBack) {
    updates['kyc.aadhaarBackUrl'] = await uploadKYCDocument(
      formData.aadhaarBack, customerId, 'aadhaar_back'
    );
  }
  if (formData.aadhaarNumber !== undefined) {
    updates['kyc.aadhaarNumber'] = formData.aadhaarNumber;
  }
  if (formData.panNumber !== undefined) {
    updates['kyc.panNumber'] = formData.panNumber;
  }
  if (formData.voterIdNumber !== undefined) {
    updates['kyc.voterIdNumber'] = formData.voterIdNumber;
  }

  // Handle nominee updates
  if (formData.nomineeName !== undefined) {
    updates['nominee.name'] = formData.nomineeName;
    updates['nominee.relation'] = formData.nomineeRelation || '';
    updates['nominee.phone'] = formData.nomineePhone || '';
  }

  if (Object.keys(updates).length > 0) {
    await updateDocument(COLLECTION, customerId, updates);
  }
}

/**
 * Update customer status.
 */
export async function updateCustomerStatus(
  customerId: string,
  status: CustomerStatus
): Promise<void> {
  await updateDocument(COLLECTION, customerId, { status });
}

/**
 * Update customer approval status.
 */
export async function updateCustomerApprovalStatus(
  customerId: string,
  approvalStatus: CustomerApprovalStatus,
  rejectionReason?: string
): Promise<void> {
  const updates: Record<string, unknown> = { approvalStatus };
  if (rejectionReason) updates.rejectionReason = rejectionReason;
  await updateDocument(COLLECTION, customerId, updates);
}

/**
 * Verify customer KYC.
 */
export async function verifyCustomerKYC(
  customerId: string,
  verifiedBy: string,
  status: KYCStatus,
  remarks?: string,
  rejectionReason?: string
): Promise<void> {
  const updates: Record<string, unknown> = {
    'kyc.status': status,
    'kyc.verifiedBy': verifiedBy,
    'kyc.verifiedAt': new Date(),
  };
  if (remarks) updates['kyc.remarks'] = remarks;
  if (rejectionReason) updates['kyc.rejectionReason'] = rejectionReason;

  // Also update top-level approval status
  if (status === 'verified') {
    updates.approvalStatus = 'kyc_verified';
  } else if (status === 'rejected') {
    updates.approvalStatus = 'kyc_rejected';
  }

  await updateDocument(COLLECTION, customerId, updates);
}

// ─── Delete ───

/**
 * Soft-delete a customer.
 */
export async function deleteCustomer(
  customerId: string,
  deletedBy: string
): Promise<void> {
  await softDeleteDocument(COLLECTION, customerId, deletedBy);
}

// ─── Real-time Listeners ───

/**
 * Listen to a single customer in real-time.
 */
export function listenToCustomer(
  customerId: string,
  callback: (customer: Customer | null) => void
): Unsubscribe {
  return listenToDocument<Customer>(COLLECTION, customerId, callback);
}

/**
 * Listen to customers by branch in real-time.
 */
export function listenToCustomersByBranch(
  branchId: string,
  callback: (customers: Customer[]) => void
): Unsubscribe {
  return listenToCollection<Customer>(
    COLLECTION,
    {
      filters: [{ field: 'branchId', operator: '==', value: branchId }],
      sort: { field: 'createdAt', direction: 'desc' },
    },
    callback
  );
}
