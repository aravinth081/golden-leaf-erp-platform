// ──────────────────────────────────────────────────
// Golden Leaf Finance — Staff Profile Security & RBAC Test Suite
// Validates: Admin Guard, Uniqueness, Complexity, Hashing, Soft-Delete & Login
// ──────────────────────────────────────────────────

declare const process: any;

import {
  createStaffProfile,
  getStaffProfiles,
  updateStaffProfile,
  updateStaffStatus,
  resetStaffPassword,
  deleteStaffProfile,
  authenticateStaffCredentials,
  validatePasswordComplexity,
  validateUsername,
  validateMobile,
  validateEmail,
  checkUniqueness,
} from '../src/services/staffService';
import type { AuthUser } from '../src/types/auth.types';

// Mock Actors
const adminActor: AuthUser = {
  uid: 'usr-admin-test',
  email: 'admin@goldenleaf.finance',
  displayName: 'Super Admin',
  photoURL: null,
  phoneNumber: '+91 98400 00000',
  emailVerified: true,
  customClaims: {
    role: 'admin',
    companyId: 'default',
  },
};

const hrActor: AuthUser = {
  uid: 'usr-hr-test',
  email: 'hr@goldenleaf.finance',
  displayName: 'HR Manager',
  photoURL: null,
  phoneNumber: '+91 98400 00001',
  emailVerified: true,
  customClaims: {
    role: 'hr_payroll_manager',
    companyId: 'default',
  },
};

const bmActor: AuthUser = {
  uid: 'usr-bm-test',
  email: 'bm@goldenleaf.finance',
  displayName: 'Branch Manager',
  photoURL: null,
  phoneNumber: '+91 98400 00002',
  emailVerified: true,
  customClaims: {
    role: 'branch_manager',
    branchId: 'BR-01',
    companyId: 'default',
  },
};

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

async function runStaffTestSuite() {
  console.log('\n======================================================');
  console.log(' RUNNING STAFF PROFILE MANAGEMENT SECURITY TEST SUITE');
  console.log('======================================================\n');

  // ── 1. ACCESS CONTROL TESTS ──
  console.log('1. ACCESS CONTROL (ADMIN ONLY GUARD):');
  
  // Non-admin cannot create profile
  let nonAdminBlocked = false;
  try {
    await createStaffProfile(
      {
        fullName: 'Test Staff',
        employeeId: 'EMP-901',
        email: 'teststaff@goldenleaf.finance',
        mobile: '9840011111',
        role: 'CRO',
        branchId: 'BR-01',
        username: 'test.cro',
        password: 'Password@123',
        status: 'active',
      },
      hrActor
    );
  } catch (err: any) {
    if (err.message.includes('403 Forbidden')) {
      nonAdminBlocked = true;
    }
  }
  assert(nonAdminBlocked, 'HR Manager blocked from creating staff profile (403 Forbidden)');

  let bmBlocked = false;
  try {
    getStaffProfiles({}, bmActor);
  } catch (err: any) {
    if (err.message.includes('403 Forbidden')) {
      bmBlocked = true;
    }
  }
  assert(bmBlocked, 'Branch Manager blocked from listing staff profiles (403 Forbidden)');

  // Admin CAN create another ADMIN role with full privileges
  const secondaryAdmin = await createStaffProfile(
    {
      fullName: 'Co Admin',
      employeeId: 'EMP-902',
      email: 'coadmin@goldenleaf.finance',
      mobile: '9840011112',
      role: 'ADMIN',
      branchId: null,
      username: 'co.admin',
      password: 'Password@123',
      status: 'active',
    },
    adminActor
  );
  assert(secondaryAdmin.profile.role === 'ADMIN', 'Admin can successfully provision another Admin account');

  // ── 2. INPUT VALIDATION TESTS ──
  console.log('\n2. FIELD VALIDATION & COMPLEXITY TESTS:');
  assert(!validateMobile('12345').valid, 'Mobile number < 10 digits rejected');
  assert(validateMobile('9876543210').valid, 'Valid 10-digit mobile number accepted');
  assert(!validateEmail('invalid-email').valid, 'Invalid email format rejected');
  assert(validateEmail('kavitha.m@goldenleaf.finance').valid, 'Valid corporate email accepted');
  assert(!validateUsername('ab').valid, 'Username < 4 characters rejected');
  assert(!validateUsername('user name').valid, 'Username with spaces rejected');
  assert(validateUsername('kavitha.bm').valid, 'Alphanumeric username with dot accepted');

  assert(!validatePasswordComplexity('simple').valid, 'Weak password rejected');
  assert(!validatePasswordComplexity('NoSpecial123').valid, 'Password missing special character rejected');
  assert(validatePasswordComplexity('StrongP@ssw0rd!').valid, 'Strong institutional password accepted');

  // ── 3. PROFILE CREATION & ONE-TIME PLAIN PASSWORD HANDOVER ──
  console.log('\n3. PROFILE CREATION & CREDENTIAL REVEAL:');
  const uniqueEmpId = `EMP-TEST-${Date.now().toString().slice(-4)}`;
  const uniqueUser = `cro.test.${Date.now().toString().slice(-4)}`;

  const created = await createStaffProfile(
    {
      fullName: 'Kavitha Murugan',
      employeeId: uniqueEmpId,
      email: `${uniqueUser}@goldenleaf.finance`,
      mobile: '9840198401',
      role: 'CRO',
      branchId: 'BR-01',
      username: uniqueUser,
      password: 'SecureP@ssw0rd2026',
      status: 'active',
    },
    adminActor
  );

  assert(created.profile.id.startsWith('STF-'), 'Staff profile provisioned with institutional UUID');
  assert(created.plainPassword === 'SecureP@ssw0rd2026', 'Plain password returned once for Admin handover memo');
  assert(created.profile.passwordHash !== 'SecureP@ssw0rd2026', 'Plain password is NOT saved directly (stored as secure hash)');
  assert(created.profile.branchName === 'Main Branch - Anna Nagar', 'Branch ID accurately resolved to branch name');

  // ── 4. UNIQUENESS CONSTRAINTS ──
  console.log('\n4. UNIQUENESS CONSTRAINTS:');
  const duplicateUserCheck = checkUniqueness({ username: uniqueUser });
  assert(!duplicateUserCheck.isUnique, 'Duplicate username detected and blocked');

  const duplicateEmpCheck = checkUniqueness({ employeeId: uniqueEmpId });
  assert(!duplicateEmpCheck.isUnique, 'Duplicate employee ID detected and blocked');

  // ── 5. STAFF CREDENTIAL LOGIN & DASHBOARD ROUTING ──
  console.log('\n5. CREDENTIAL LOGIN & LANDING REDIRECTION:');
  const loginSuccess = await authenticateStaffCredentials(uniqueUser, 'SecureP@ssw0rd2026');
  assert(loginSuccess.authUser.customClaims?.role === 'collection_agent', 'CRO role correctly mapped to internal role');
  assert(loginSuccess.landingPath === '/collections', 'CRO successfully redirected to collections dashboard');

  // ── 6. PROFILE UPDATE & ACCESS CONTROL ──
  console.log('\n6. PROFILE UPDATE & ACCESS CONTROL:');
  const updatedProfile = updateStaffProfile(
    created.profile.id,
    {
      fullName: 'Kavitha Murugan Updated',
      mobile: '9840298402',
    },
    adminActor
  );
  assert(updatedProfile.fullName === 'Kavitha Murugan Updated', 'Staff name successfully updated by Admin');
  assert(updatedProfile.mobile === '9840298402', 'Staff mobile successfully updated by Admin');

  let nonAdminUpdateBlocked = false;
  try {
    updateStaffProfile(created.profile.id, { fullName: 'Hacked Name' }, hrActor);
  } catch (err: any) {
    if (err.message.includes('403 Forbidden')) nonAdminUpdateBlocked = true;
  }
  assert(nonAdminUpdateBlocked, 'Non-admin blocked from updating staff profile (403)');

  // ── 7. PASSWORD RESET & SECURE RE-HASHING ──
  console.log('\n7. PASSWORD RESET & SECURE RE-HASHING:');
  const resetResult = await resetStaffPassword(
    created.profile.id,
    'BrandNewP@ss2026!',
    adminActor
  );
  assert(resetResult.plainPassword === 'BrandNewP@ss2026!', 'One-time plain reset password returned for Admin handover');
  assert(resetResult.profile.mustChangePassword === true, 'Flag mustChangePassword set to true on reset');

  // Verify staff can now authenticate with the new password
  const newLoginSuccess = await authenticateStaffCredentials(uniqueUser, 'BrandNewP@ss2026!');
  assert(newLoginSuccess.authUser.uid === created.profile.id, 'Staff successfully authenticated with reset password');

  // ── 8. DEACTIVATION & ACCESS REVOCATION ──
  console.log('\n8. STATUS TOGGLE & ACCESS REVOCATION:');
  updateStaffStatus(created.profile.id, 'inactive', adminActor);

  let deactivatedLoginBlocked = false;
  try {
    await authenticateStaffCredentials(uniqueUser, 'BrandNewP@ss2026!');
  } catch (err: any) {
    if (err.message.includes('account has been deactivated')) {
      deactivatedLoginBlocked = true;
    }
  }
  assert(deactivatedLoginBlocked, 'Deactivated staff member is strictly blocked from logging in (403)');

  // ── 9. SOFT DELETE ──
  console.log('\n9. SOFT DELETE BEHAVIOR:');
  deleteStaffProfile(created.profile.id, adminActor);

  let deletedLoginBlocked = false;
  try {
    await authenticateStaffCredentials(uniqueUser, 'BrandNewP@ss2026!');
  } catch (err: any) {
    if (err.message.includes('Invalid username or password')) {
      deletedLoginBlocked = true;
    }
  }
  assert(deletedLoginBlocked, 'Soft-deleted profile is omitted from authentication roster');

  console.log('\n======================================================');
  console.log(` TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStaffTestSuite();

