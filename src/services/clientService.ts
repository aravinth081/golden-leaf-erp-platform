import { createDocumentWithId, hardDeleteDocument, queryDocuments } from './firestore';
import { creditManagerService } from './creditManagerService';

const COLLECTION = 'clients';
const LOCAL_STORAGE_KEY = 'glf_clients_cache';

export interface ClientData {
  id?: string;
  kycData: any;
  formData: any;
  isDeleted: boolean;
  createdAt: Date;
}

// ─── Local Client Cache State ───
export let localClients: ClientData[] = [];

try {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    localClients = JSON.parse(stored).map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt)
    }));
  }
} catch (error) {
  console.warn("Failed to load clients from localStorage", error);
}

export function saveLocalClients() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localClients));
  } catch (error) {
    console.warn("Failed to save clients to localStorage", error);
  }
}

export async function createClientEnrollment(
  kycData: any,
  formData: any
): Promise<void> {
  const clientData = {
    kycData,
    formData,
    isDeleted: false,
    createdAt: new Date(),
  };

  const docId = formData.clientId;
  if (!docId) {
    throw new Error("Client ID is required to save.");
  }

  // 1. Immediately persist to local memory & localStorage (< 2ms)
  localClients = localClients.filter(c => c.id !== docId);
  localClients.unshift({
    ...clientData,
    id: docId
  });
  saveLocalClients();

  // 2. Also cache to glf_registered_customers_master so search & lists see it immediately
  try {
    const rawCusts = localStorage.getItem('glf_registered_customers_master');
    let custs = rawCusts ? JSON.parse(rawCusts) : [];
    custs = custs.filter((c: any) => c.id !== docId);

    const resolvedName = formData.fullName || formData.clientName || formData.name || 'New Client';
    const resolvedCenter = formData.centerName || formData.center || 'Main Center';
    const resolvedGroup = formData.groupId || formData.group || 'General Route';

    custs.unshift({
      id: docId,
      companyId: 'GLF-CO-001',
      branchId: formData.branchId || 'BR-01',
      registeredBy: formData.registeredBy || 'Field Officer',
      name: resolvedName,
      phone: formData.phone || formData.mobile || '',
      alternatePhone: formData.alternatePhone || '',
      email: formData.email || '',
      dateOfBirth: formData.dob || '',
      gender: formData.gender || '',
      address: formData.address || '',
      city: formData.city || 'Chennai',
      state: formData.state || 'Tamil Nadu',
      pincode: formData.pincode || '',
      landmark: formData.landmark || '',
      photoUrl: kycData?.photoUrl || '',
      kyc: {
        aadhaarNumber: formData.aadhaarNumber || '',
        panNumber: formData.panNumber || '',
        voterIdNumber: formData.voterId || '',
        status: 'verified',
        isMobileVerified: true,
      },
      status: 'active',
      totalCollected: 0,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('glf_registered_customers_master', JSON.stringify(custs.slice(0, 100)));

    // Also sync directly to glf_monitored_customers_master
    const rawMonitored = localStorage.getItem('glf_monitored_customers_master');
    let monitoredCusts = rawMonitored ? JSON.parse(rawMonitored) : [];
    if (Array.isArray(monitoredCusts)) {
      monitoredCusts = monitoredCusts.filter((c: any) => c.id !== docId);
      monitoredCusts.unshift({
        id: docId,
        name: resolvedName,
        phone: formData.phone || formData.mobile || '',
        branchId: formData.branchId || 'BR-01',
        branchName: formData.branchName || 'Main Branch',
        centerName: resolvedCenter,
        groupName: resolvedGroup,
        address: formData.address || '',
        city: formData.city || 'Chennai',
        state: formData.state || 'Tamil Nadu',
        pincode: formData.pincode || '',
        aadhaarNumber: formData.aadhaarNumber || '',
        aadhaarFrontAvailable: !!kycData?.aadhaarUrl,
        aadhaarBackAvailable: !!kycData?.aadhaarBackUrl,
        panNumber: formData.panNumber || '',
        voterId: formData.voterId || '',
        customerPhotoAvailable: !!kycData?.photoUrl,
        nomineePhotoAvailable: !!kycData?.nomineePhotoUrl,
        nomineeName: formData.nomineeName || '',
        nomineeRelation: formData.nomineeRelation || '',
        nomineePhone: formData.nomineePhone || '',
        kycStatus: 'Verified',
        status: 'Active',
        registrationDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        history: [
          { date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), event: 'Customer Registration', remarks: 'Enrolled via Customer Relationship Officer (CRO)' }
        ],
      });
      localStorage.setItem('glf_monitored_customers_master', JSON.stringify(monitoredCusts));
      window.dispatchEvent(new CustomEvent('glf-customers-updated'));
    }

    // Also feed straight into Credit Verification Queue
    creditManagerService.addApplicant({
      customerId: docId,
      customerName: resolvedName,
      phone: formData.phone || formData.mobile || '+91 98400 00000',
      alternatePhone: formData.alternatePhone,
      address: formData.address || '',
      city: formData.city || 'Chennai',
      branchId: formData.branchId || 'BR-01',
      centerName: resolvedCenter,
      groupName: resolvedGroup,
      occupation: formData.occupation || 'Micro Enterprise',
      monthlyIncome: Number(formData.monthlyIncome) || 25000,
      monthlyExpenses: Number(formData.monthlyExpenses) || 12000,
      loanAmount: Number(formData.requestedAmount || formData.loanAmount) || 25000,
      loanProduct: formData.loanProduct || 'Weekly Micro-Loan (JLG)',
      aadhaarNumber: formData.aadhaarNumber || '',
      panNumber: formData.panNumber || '',
      voterId: formData.voterId || '',
    });
  } catch (err) {
    // Non-critical local cache
  }

  // 3. Fast persistent database save
  try {
    await createDocumentWithId(COLLECTION, docId, {
      ...clientData,
      kycData
    } as any);
  } catch (error) {
    console.warn("Local storage state preserved:", error);
  }
}

export async function deleteClientEnrollment(clientId: string): Promise<void> {
  if (!clientId) return;
  await hardDeleteDocument(COLLECTION, clientId);
  localClients = localClients.filter(c => c.id !== clientId);
  saveLocalClients();
}

export async function getClients(): Promise<ClientData[]> {
  try {
    const docs = await queryDocuments<ClientData>(COLLECTION, {}, true);
    if (docs.length > 0) return docs;
  } catch (error) {
    console.warn("Using local clients cache:", error);
  }

  return localClients.filter(c => !c.isDeleted);
}
