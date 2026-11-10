// ──────────────────────────────────────────────────
// Golden Leaf Finance — Compensation & Payslip Automated Test Suite
// Validates:
// 1. Admin Exclusive Control to Fix Pay by Role and Employee
// 2. Non-Admin 403 Forbidden Access Protection
// 3. Exclusion of Super Admin from Payslip Downloads
// 4. Guaranteed Payslip Download for All Operational Roles (HR, BM, CM, CRO)
// 5. Accurate Gross, Net, Deductions, and Annual CTC Calculations
// 6. Institutional PDF Generator Integrity
// ──────────────────────────────────────────────────

import {
  getRoleSalaries,
  getRoleSalary,
  fixRoleSalary,
  getEmployeeSalaries,
  getEmployeeSalary,
  fixEmployeeSalary,
  getStaffPayslips,
  calculateSalaryBreakdown,
  buildPayslipPDF,
} from '../src/services/roleSalaryService';
import type { AuthUser, UserRole } from '../src/types/auth.types';

// Mock Actors
const adminActor: AuthUser = {
  uid: 'usr-admin-01',
  email: 'admin@goldenleaf.finance',
  displayName: 'Corporate Administrator',
  photoURL: null,
  phoneNumber: '+91 98400 00000',
  emailVerified: true,
  customClaims: {
    role: 'admin',
    companyId: 'default',
  },
};

const hrActor: AuthUser = {
  uid: 'usr-hr-01',
  employeeId: 'EMP-HR-001',
  email: 'hr@goldenleaf.finance',
  displayName: 'Priya Sharma (HR)',
  photoURL: null,
  phoneNumber: '+91 98400 11111',
  emailVerified: true,
  customClaims: {
    role: 'hr_payroll_manager',
    companyId: 'default',
  },
};

const bmActor: AuthUser = {
  uid: 'usr-bm-01',
  employeeId: 'EMP-BM-001',
  email: 'bm@goldenleaf.finance',
  displayName: 'Ramesh Sundaram (BM)',
  photoURL: null,
  phoneNumber: '+91 98400 22222',
  emailVerified: true,
  customClaims: {
    role: 'branch_manager',
    branchId: 'BR-01',
    branchName: 'Main Branch - Anna Nagar',
    companyId: 'default',
  },
};

const cmActor: AuthUser = {
  uid: 'usr-cm-01',
  employeeId: 'EMP-CM-001',
  email: 'cm@goldenleaf.finance',
  displayName: 'Karthik Raja (CM)',
  photoURL: null,
  phoneNumber: '+91 98400 33333',
  emailVerified: true,
  customClaims: {
    role: 'credit_manager',
    branchId: 'BR-01',
    branchName: 'Main Branch - Anna Nagar',
    companyId: 'default',
  },
};

const croActor: AuthUser = {
  uid: 'usr-cro-01',
  employeeId: 'EMP-CRO-001',
  email: 'cro@goldenleaf.finance',
  displayName: 'Amit Das (CRO)',
  photoURL: null,
  phoneNumber: '+91 98400 44444',
  emailVerified: true,
  customClaims: {
    role: 'collection_agent',
    branchId: 'BR-02',
    branchName: 'Salem Regional Branch',
    companyId: 'default',
  },
};

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  ✓ ${desc}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${desc}`);
    failCount++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log(' GOLDEN LEAF — COMPENSATION & PAYSLIP TEST SUITE');
  console.log('======================================================\n');

  // ── TEST 1: Admin Authorization Guard on Role Pay Fixation ──
  console.log('1. Admin Authorization Guard on Role Pay Fixation:');

  const beforeFix = getRoleSalary('collection_agent');
  assert(beforeFix.baseMonthly > 0, 'Retrieves initial default salary for collection_agent');

  // Admin fixes collection_agent base salary to 22,000
  const updatedRole = fixRoleSalary(
    'collection_agent',
    { baseMonthly: 22000, hraMonthly: 8800, specialAllowance: 6000 },
    adminActor
  );
  assert(updatedRole.baseMonthly === 22000, 'Admin successfully updates collection_agent base salary to 22000');
  assert(getRoleSalary('collection_agent').baseMonthly === 22000, 'Fixed role salary is persisted in system master');

  // Non-Admin (HR) attempts to fix role salary -> Must fail 403
  let hrBlocked = false;
  try {
    fixRoleSalary('collection_agent', { baseMonthly: 50000 }, hrActor);
  } catch (err: any) {
    hrBlocked = err.message.includes('403');
  }
  assert(hrBlocked, 'HR Manager blocked from fixing role salary with 403 Forbidden');

  // Non-Admin (CRO) attempts to fix role salary -> Must fail 403
  let croBlocked = false;
  try {
    fixRoleSalary('collection_agent', { baseMonthly: 99999 }, croActor);
  } catch (err: any) {
    croBlocked = err.message.includes('403');
  }
  assert(croBlocked, 'CRO blocked from fixing role salary with 403 Forbidden');

  // ── TEST 2: Admin Authorization Guard on Employee Pay Fixation ──
  console.log('\n2. Admin Authorization Guard on Employee Pay Fixation:');

  const testEmpId = 'EMP-CRO-888';
  const customFixed = fixEmployeeSalary(
    testEmpId,
    {
      employeeName: 'Special Senior CRO',
      role: 'collection_agent',
      baseMonthly: 28000,
      hraMonthly: 11200,
      specialAllowance: 7000,
      variablePayMonthly: 3000,
      pfEmployeeMonthly: 3360,
      esiEmployeeMonthly: 0,
      ptMonthly: 200,
      tdsMonthly: 1200,
      costCenter: 'Collections',
      employmentType: 'full_time',
      bankAccountNumber: '98765432101',
      bankIfsc: 'HDFC0001723',
      bankName: 'HDFC Bank',
    },
    adminActor
  );
  assert(customFixed.baseMonthly === 28000, 'Admin successfully fixed individual salary override for EMP-CRO-888');

  const fetchedCustom = getEmployeeSalary(testEmpId, 'collection_agent');
  assert(fetchedCustom.baseMonthly === 28000, 'Individual override returned accurately from repository');

  // Non-Admin (Branch Manager) attempts to fix employee salary -> Must fail 403
  let bmBlocked = false;
  try {
    fixEmployeeSalary(testEmpId, { employeeName: 'Hacked', role: 'collection_agent', baseMonthly: 90000 }, bmActor);
  } catch (err: any) {
    bmBlocked = err.message.includes('403');
  }
  assert(bmBlocked, 'Branch Manager blocked from fixing employee salary with 403 Forbidden');

  // ── TEST 3: Strict Exclusion of Admin from Payslips ──
  console.log('\n3. Strict Exclusion of Admin from Payslips:');
  const adminSlips = getStaffPayslips(adminActor);
  assert(Array.isArray(adminSlips) && adminSlips.length === 0, 'Admin user receives 0 payslips (Admin cannot download payslips)');

  // ── TEST 4: Payslip Availability for All Operational Roles ──
  console.log('\n4. Guaranteed Payslip Download for All Operational Staff Roles:');

  const hrSlips = getStaffPayslips(hrActor);
  assert(hrSlips.length >= 1, `HR Manager receives ${hrSlips.length} monthly payslips ready for download`);
  assert(hrSlips[0].employeeId === 'EMP-HR-001', 'HR payslip is tagged to employeeId EMP-HR-001');

  const bmSlips = getStaffPayslips(bmActor);
  assert(bmSlips.length >= 1, `Branch Manager receives ${bmSlips.length} monthly payslips`);
  assert(bmSlips[0].designation.includes('Branch Manager'), 'Branch Manager designation matches corporate title');

  const cmSlips = getStaffPayslips(cmActor);
  assert(cmSlips.length >= 1, `Credit Manager receives ${cmSlips.length} monthly payslips`);

  const croSlips = getStaffPayslips(croActor);
  assert(croSlips.length >= 1, `CRO receives ${croSlips.length} monthly payslips`);
  assert(croSlips[0].netSalary > 0, `CRO net salary computed as ₹${croSlips[0].netSalary.toLocaleString('en-IN')}`);

  // ── TEST 5: Math Calculations & CTC Breakdown ──
  console.log('\n5. Remuneration Math & CTC Calculations:');

  const sampleMath = calculateSalaryBreakdown({
    baseMonthly: 30000,
    hraMonthly: 12000,
    specialAllowance: 8000,
    variablePayMonthly: 2000,
    pfEmployeeMonthly: 3600,
    esiEmployeeMonthly: 375,
    ptMonthly: 200,
    tdsMonthly: 2500,
  });

  assert(sampleMath.grossMonthly === 52000, 'Gross Monthly = 30000 + 12000 + 8000 + 2000 = 52000');
  assert(sampleMath.totalDeductions === 6675, 'Total Deductions = 3600 + 375 + 200 + 2500 = 6675');
  assert(sampleMath.netSalary === 45325, 'Net Salary = 52000 - 6675 = 45325');
  assert(sampleMath.annualCtc === 624000, 'Annual CTC = 52000 * 12 = 624000 (₹6.24 Lakhs)');

  // ── TEST 6: Institutional PDF Generation ──
  console.log('\n6. Institutional Payslip PDF Generator Integrity:');

  const targetSlip = croSlips[0];
  const pdfDoc = buildPayslipPDF(targetSlip, false);
  assert(pdfDoc !== null && typeof pdfDoc === 'object', 'buildPayslipPDF returns valid jsPDF instance');

  const pdfOutput = pdfDoc.output('arraybuffer');
  assert(pdfOutput.byteLength > 1000, `PDF generated successfully with ${pdfOutput.byteLength} bytes`);

  // Summary
  console.log('\n======================================================');
  console.log(` TEST RUN COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests();

