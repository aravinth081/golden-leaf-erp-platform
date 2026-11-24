// ──────────────────────────────────────────────────
// Golden Leaf Finance — Centralized KYC De-Duplication & Identity Service
// Strict anti-duplication engine: ensures 1 customer = 1 entry across
// all registration channels, credit approval queues & customer master lists.
// ──────────────────────────────────────────────────

export interface ExistingCustomerSummary {
  customerId: string;
  customerName: string;
  phone: string;
  centerName: string;
  groupName: string;
  aadhaarNumber?: string;
  panNumber?: string;
  status?: string;
  sourceStore?: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedField?: 'aadhaar' | 'pan' | 'phone';
  matchedValue?: string;
  existingRecord?: ExistingCustomerSummary;
  message?: string;
}

interface DuplicateCheckParams {
  aadhaarNumber?: string;
  panNumber?: string;
  phone?: string;
  currentClientId?: string;
}

/**
 * Normalizes an Aadhaar number to 12 raw digits
 */
export function normalizeAadhaar(raw?: string | null): string {
  if (!raw) return '';
  return raw.replace(/\D/g, '').slice(0, 12);
}

/**
 * Normalizes a PAN number to 10 uppercase characters
 */
export function normalizePan(raw?: string | null): string {
  if (!raw) return '';
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}

/**
 * Normalizes a Phone number to 10 digits
 */
export function normalizePhone(raw?: string | null): string {
  if (!raw) return '';
  return raw.replace(/\D/g, '').slice(-10);
}

/**
 * Scans all persistent local storage caches and returns all unique registered customer records.
 */
export function getAllRegisteredCustomers(): ExistingCustomerSummary[] {
  const recordsMap = new Map<string, ExistingCustomerSummary>();

  const addRecord = (
    id: string | undefined,
    name: string | undefined,
    phone: string | undefined,
    center: string | undefined,
    group: string | undefined,
    aadhaar: string | undefined,
    pan: string | undefined,
    status: string | undefined,
    source: string
  ) => {
    if (!id && !aadhaar && !pan) return;
    const key = (id || aadhaar || pan || '').trim().toUpperCase();
    if (!key) return;

    if (!recordsMap.has(key)) {
      recordsMap.set(key, {
        customerId: id || 'GLF-C-UNKNOWN',
        customerName: name || 'Registered Customer',
        phone: phone || '',
        centerName: center || 'Assigned Center',
        groupName: group || 'Assigned Group',
        aadhaarNumber: aadhaar || '',
        panNumber: pan || '',
        status: status || 'Active',
        sourceStore: source,
      });
    }
  };

  // 1. Scan glf_monitored_customers_master
  try {
    const rawMonitored = localStorage.getItem('glf_monitored_customers_master');
    if (rawMonitored) {
      const list = JSON.parse(rawMonitored);
      if (Array.isArray(list)) {
        for (const item of list) {
          addRecord(
            item.id || item.customerId,
            item.name || item.customerName,
            item.phone,
            item.centerName,
            item.groupName,
            item.aadhaarNumber || item.kyc?.aadhaarNumber,
            item.panNumber || item.kyc?.panNumber,
            item.status,
            'Monitored Customers'
          );
        }
      }
    }
  } catch (err) {
    console.warn('Error reading monitored customers:', err);
  }

  // 2. Scan glf_credit_manager_applicants_v5
  try {
    const rawApplicants = localStorage.getItem('glf_credit_manager_applicants_v5');
    if (rawApplicants) {
      const list = JSON.parse(rawApplicants);
      if (Array.isArray(list)) {
        for (const item of list) {
          addRecord(
            item.customerId || item.id,
            item.customerName,
            item.phone,
            item.centerName,
            item.groupName,
            item.aadhaarNumber,
            item.panNumber,
            item.customerVerificationStatus || item.finalApprovalStatus,
            'Credit Appraisal Queue'
          );
        }
      }
    }
  } catch (err) {
    console.warn('Error reading credit applicants:', err);
  }

  // 3. Scan glf_registered_customers_master
  try {
    const rawRegistered = localStorage.getItem('glf_registered_customers_master');
    if (rawRegistered) {
      const list = JSON.parse(rawRegistered);
      if (Array.isArray(list)) {
        for (const item of list) {
          addRecord(
            item.id,
            item.name,
            item.phone,
            item.centerName,
            item.groupName,
            item.kyc?.aadhaarNumber || item.aadhaarNumber,
            item.kyc?.panNumber || item.panNumber,
            item.status,
            'Registered Customers'
          );
        }
      }
    }
  } catch (err) {
    console.warn('Error reading registered customers:', err);
  }

  // 4. Scan glf_clients_cache
  try {
    const rawClients = localStorage.getItem('glf_clients_cache');
    if (rawClients) {
      const list = JSON.parse(rawClients);
      if (Array.isArray(list)) {
        for (const item of list) {
          addRecord(
            item.id,
            item.clientName || item.fullName || item.name,
            item.phone || item.mobile,
            item.centerName,
            item.groupId,
            item.aadhaarNumber || item.kycData?.aadhaarNumber,
            item.panNumber || item.kycData?.panNumber,
            item.status,
            'Clients Cache'
          );
        }
      }
    }
  } catch (err) {
    console.warn('Error reading clients cache:', err);
  }

  return Array.from(recordsMap.values());
}

/**
 * Checks whether an Aadhaar, PAN, or Phone is already registered to another customer.
 */
export function checkKycDuplicates(params: DuplicateCheckParams): DuplicateCheckResult {
  const cleanAadhaar = normalizeAadhaar(params.aadhaarNumber);
  const cleanPan = normalizePan(params.panNumber);
  const cleanPhone = normalizePhone(params.phone);
  const excludeClientId = (params.currentClientId || '').trim().toUpperCase();

  // If no identifiers provided, return clean
  if (!cleanAadhaar && !cleanPan && !cleanPhone) {
    return { isDuplicate: false };
  }

  const allCustomers = getAllRegisteredCustomers();

  for (const cust of allCustomers) {
    const custId = cust.customerId.trim().toUpperCase();
    // Exclude the current customer itself if updating
    if (excludeClientId && custId === excludeClientId) {
      continue;
    }

    // 1. Aadhaar UID Match Check (Highest Priority KYC Identifier)
    if (cleanAadhaar && cleanAadhaar.length === 12) {
      const custAadhaar = normalizeAadhaar(cust.aadhaarNumber);
      if (custAadhaar === cleanAadhaar) {
        return {
          isDuplicate: true,
          matchedField: 'aadhaar',
          matchedValue: cleanAadhaar,
          existingRecord: cust,
          message: `Already registered! Aadhaar UID is linked to ${cust.customerName} (${cust.customerId}). Duplicate registration is not allowed.`,
        };
      }
    }

    // 2. PAN Card Match Check
    if (cleanPan && cleanPan.length === 10) {
      const custPan = normalizePan(cust.panNumber);
      if (custPan === cleanPan) {
        return {
          isDuplicate: true,
          matchedField: 'pan',
          matchedValue: cleanPan,
          existingRecord: cust,
          message: `Already registered! PAN Number is linked to ${cust.customerName} (${cust.customerId}). Duplicate registration is not allowed.`,
        };
      }
    }

    // 3. Phone Number Match Check (Only if 10 digits provided)
    if (cleanPhone && cleanPhone.length === 10) {
      const custPhone = normalizePhone(cust.phone);
      if (custPhone === cleanPhone) {
        return {
          isDuplicate: true,
          matchedField: 'phone',
          matchedValue: cleanPhone,
          existingRecord: cust,
          message: `Already registered! Mobile number is registered to ${cust.customerName} (${cust.customerId}).`,
        };
      }
    }
  }

  return { isDuplicate: false };
}
