// ──────────────────────────────────────────────────
// Golden Leaf Finance — Aravinth Admin Seeding & Auth Verification Suite
// ──────────────────────────────────────────────────

declare const process: any;

import {
  getStoredStaffProfiles,
  authenticateStaffCredentials,
  ARAVINTH_ADMIN_PROFILE,
  MASTER_ADMIN_PROFILE,
} from '../src/services/staffService';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runAravinthAdminTestSuite() {
  console.log('\n======================================================');
  console.log(' RUNNING ARAVINTH ADMIN SEED & AUTH VERIFICATION SUITE');
  console.log('======================================================\n');

  // 1. Profile Seeding Verification
  console.log('1. PROFILE SEEDING VERIFICATION:');
  const storedProfiles = getStoredStaffProfiles();
  const aravinth = storedProfiles.find((p) => p.username.toLowerCase() === 'aravinth');

  assert(!!aravinth, 'Aravinth Admin profile exists in stored staff profiles feed');
  assert(aravinth?.username === 'aravinth', 'Username is exactly "aravinth"');
  assert(aravinth?.role === 'ADMIN', 'Role is explicitly "ADMIN"');
  assert(aravinth?.mobile === '6374995585', 'Phone number is exactly "6374995585"');
  assert(aravinth?.status === 'active', 'Account status is active');
  assert(aravinth?.mustChangePassword === false, 'mustChangePassword is false');
  assert(aravinth?.branchId === null, 'Branch ID is null (Company-Wide Master Authority)');

  // 2. Authentication with Username & Password
  console.log('\n2. AUTHENTICATION (USERNAME + PASSWORD):');
  const loginRes = await authenticateStaffCredentials('aravinth', 'Innovationhacks');
  assert(Boolean(loginRes.authUser.displayName && loginRes.authUser.displayName.toLowerCase().includes('aravinth')), 'AuthUser display name contains Aravinth');
  assert(loginRes.authUser.customClaims?.role === 'admin', 'AuthUser custom claim role is "admin"');
  assert(loginRes.authUser.phoneNumber === '+91 6374995585', 'AuthUser phone number formatted correctly');
  assert(loginRes.profile.role === 'ADMIN', 'Profile role is ADMIN');
  assert(loginRes.landingPath === '/dashboard', 'Landing path resolves to /dashboard');

  // 3. Authentication with Handle / @ prefix
  console.log('\n3. AUTHENTICATION WITH @ HANDLE:');
  const atLoginRes = await authenticateStaffCredentials('@aravinth', 'Innovationhacks');
  assert(atLoginRes.profile.username === 'aravinth', 'Logged in seamlessly with @aravinth handle');

  // 4. Authentication with Phone Number
  console.log('\n4. AUTHENTICATION WITH PHONE NUMBER:');
  const phoneLoginRes = await authenticateStaffCredentials('6374995585', 'Innovationhacks');
  assert(phoneLoginRes.profile.username === 'aravinth', 'Logged in seamlessly with mobile 6374995585');

  // 5. Authentication with Email
  console.log('\n5. AUTHENTICATION WITH CORPORATE EMAIL:');
  const emailLoginRes = await authenticateStaffCredentials('aravinth@goldenleaf.finance', 'Innovationhacks');
  assert(emailLoginRes.profile.username === 'aravinth', 'Logged in seamlessly with corporate email');

  // 6. Security: Rejection of Invalid Credentials
  console.log('\n6. SECURITY: INVALID CREDENTIAL REJECTION:');
  let wrongPassBlocked = false;
  try {
    await authenticateStaffCredentials('aravinth', 'WrongPassword123');
  } catch (err: any) {
    if (err.message.includes('401 Unauthorized')) {
      wrongPassBlocked = true;
    }
  }
  assert(wrongPassBlocked, 'Invalid password strictly rejected with 401 Unauthorized');

  // 7. Preservation of Master Admin
  console.log('\n7. PRESERVATION OF EXISTING MASTER ADMIN:');
  const masterAdmin = storedProfiles.find((p) => p.id === MASTER_ADMIN_PROFILE.id);
  assert(!!masterAdmin, 'Master Admin (Karthikkannan D) preserved intact');
  const masterLoginRes = await authenticateStaffCredentials('Karthikkannan D', 'golden@karthick');
  assert(masterLoginRes.authUser.customClaims?.role === 'admin', 'Master Admin can authenticate normally');

  console.log('\n======================================================');
  console.log(` TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAravinthAdminTestSuite();
