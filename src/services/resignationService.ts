// ──────────────────────────────────────────────────
// Golden Leaf Finance — Employee Resignation & Exit Clearance Service
// 3-Stage Security Gate • Mandatory Portfolio Reassignment • Automated Login Deactivation
// ──────────────────────────────────────────────────

import {
  type ResignationRecord,
  type ResignationStatus,
  type ResignationCategory,
  type ResignationPortfolioItem,
} from '../types/resignation.types';
import { type UserRole } from '../types';

const STORAGE_KEY = 'glf_resignation_records_v2';
const EMPLOYEES_STORAGE_KEY = 'glf_pdf_strict_employees_master';

export const INITIAL_RESIGNATIONS: ResignationRecord[] = [];
class ResignationService {
  private records: ResignationRecord[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.records = JSON.parse(stored);
      } else {
        this.records = [];
        this.saveState();
      }
    } catch {
      this.records = [];
    }
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
      window.dispatchEvent(new Event('glf_resignation_updated'));
    } catch (e) {
      console.error('Failed to save resignation state:', e);
    }
  }

  public getResignations(): ResignationRecord[] {
    return [...this.records];
  }

  public getResignationById(id: string): ResignationRecord | undefined {
    return this.records.find((r) => r.id.toLowerCase() === id.toLowerCase());
  }

  public getResignationByEmployeeId(empId: string): ResignationRecord | undefined {
    return this.records.find(
      (r) => r.employeeId.toLowerCase() === empId.toLowerCase() && r.status !== 'WITHDRAWN'
    );
  }

  // Notice Period Norm by Role: CRO = 30, CM/HR = 60, BM = 90
  public getNoticeDaysForRole(role: UserRole): 30 | 60 | 90 {
    switch (role) {
      case 'collection_agent':
        return 30;
      case 'credit_manager':
      case 'accountant':
      case 'auditor':
        return 60;
      case 'branch_manager':
      case 'area_manager':
        return 90;
      default:
        return 60;
    }
  }

  // Calculate Last Working Day skipping Sundays
  public calculateEstimatedLastWorkingDay(startDateStr: string, requiredWorkingDays: number): string {
    const d = new Date(startDateStr);
    if (isNaN(d.getTime())) return startDateStr;

    let daysCounted = 0;
    while (daysCounted < requiredWorkingDays) {
      d.setDate(d.getDate() + 1);
      const dayOfWeek = d.getDay(); // 0 is Sunday
      if (dayOfWeek !== 0) {
        daysCounted++;
      }
    }
    return d.toISOString().slice(0, 10);
  }

  // Employee Self-Service: Submit Resignation
  public submitResignation(data: {
    employeeId: string;
    employeeName: string;
    designation: 'Customer Relationship Officer (CRO)' | 'Credit Manager' | 'HR Official' | 'Branch Manager';
    role: UserRole;
    branchId: string;
    branchName: string;
    dateOfJoining: string;
    category: ResignationCategory;
    reason: string;
    emergencyMedicalRefNo?: string;
    emergencyHospitalDetails?: string;
    emergencyProofDocUrl?: string;
  }): ResignationRecord {
    const year = new Date().getFullYear();
    const count = this.records.length + 1;
    const newId = `GLF/EXIT/${year}/${count.toString().padStart(3, '0')}`;
    const today = new Date().toISOString().slice(0, 10);
    const noticeDays = this.getNoticeDaysForRole(data.role);
    const estimatedLWD =
      data.category === 'IMMEDIATE_EMERGENCY'
        ? today
        : this.calculateEstimatedLastWorkingDay(today, noticeDays);

    // Active portfolio items loaded dynamically from live loan records or empty
    const initialPortfolio: ResignationPortfolioItem[] = [];

    const newRecord: ResignationRecord = {
      id: newId,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      designation: data.designation,
      role: data.role,
      branchId: data.branchId,
      branchName: data.branchName,
      dateOfJoining: data.dateOfJoining || '2024-01-01',
      initiationDate: today,
      resignationDate: today,
      category: data.category,
      roleNoticeRequirementDays: noticeDays,
      actualWorkingDaysServed: 1,
      finalLastWorkingDay: estimatedLWD,
      reason: data.reason.trim(),
      emergencyMedicalRefNo: data.emergencyMedicalRefNo,
      emergencyHospitalDetails: data.emergencyHospitalDetails,
      emergencyProofDocUrl: data.emergencyProofDocUrl,
      status: 'SUBMITTED_STAGE_1_PENDING',
      stage1: {
        isApproved: false,
        portfolioReassigned: false,
        transferredItemsCount: 0,
        fieldCashZeroDuesConfirmed: false,
        receiptBooksSurrendered: false,
        vaultKeysAppraisalFilesHandedOver: false,
      },
      stage2: {
        isApproved: false,
        workingDaysServedVerified: false,
        medicalEmergencyWaiverApproved: false,
        companyIdCardAssetsReturned: false,
        leaveOdFnfSettlementCalculated: false,
      },
      stage3: {
        isApproved: false,
        loginDeactivated: false,
      },
      activePortfolioItems: initialPortfolio,
      createdAt: new Date().toLocaleString('en-IN'),
      updatedAt: new Date().toLocaleString('en-IN'),
    };

    this.records.unshift(newRecord);
    this.saveState();
    return newRecord;
  }

  // ─── Stage 1: Branch Manager Portfolio Reassignment & Clearance Gate ───
  public reassignPortfolioAndApproveStage1(
    resignationId: string,
    replacementEmployeeId: string,
    replacementEmployeeName: string,
    approverName: string,
    comments: string,
    routeDetails?: string
  ): ResignationRecord {
    const record = this.getResignationById(resignationId);
    if (!record) throw new Error('Resignation record not found');

    const transferredCount = record.activePortfolioItems.length;

    record.stage1 = {
      isApproved: true,
      approvedBy: approverName,
      approvedAt: new Date().toLocaleString('en-IN'),
      comments: comments.trim() || 'Portfolio reassignment and physical clearances verified.',
      portfolioReassigned: true,
      replacementEmployeeId,
      replacementEmployeeName,
      transferredItemsCount: transferredCount,
      reassignedRouteDetails: routeDetails || 'Branch operational territory handover',
      fieldCashZeroDuesConfirmed: true,
      receiptBooksSurrendered: true,
      vaultKeysAppraisalFilesHandedOver: true,
    };

    // Clear unassigned portfolio items
    record.activePortfolioItems = [];
    record.status = 'STAGE_1_APPROVED_STAGE_2_PENDING';
    record.updatedAt = new Date().toLocaleString('en-IN');

    this.saveState();
    return record;
  }

  // ─── Stage 2: HR Attendance Working-Days Counter Gate ───
  public approveStage2HR(
    resignationId: string,
    approverName: string,
    comments: string,
    isMedicalWaiver: boolean
  ): ResignationRecord {
    const record = this.getResignationById(resignationId);
    if (!record) throw new Error('Resignation record not found');

    if (!record.stage1.isApproved) {
      throw new Error('Stage 1 Branch Manager approval must be completed first.');
    }

    const isWorkingDaysComplete = record.actualWorkingDaysServed >= record.roleNoticeRequirementDays;
    const canUnlock = isWorkingDaysComplete || (record.category === 'IMMEDIATE_EMERGENCY' && isMedicalWaiver);

    if (!canUnlock) {
      throw new Error(
        `Working days requirement not met. Served: ${record.actualWorkingDaysServed} / ${record.roleNoticeRequirementDays} working days.`
      );
    }

    record.stage2 = {
      isApproved: true,
      approvedBy: approverName,
      approvedAt: new Date().toLocaleString('en-IN'),
      comments: comments.trim() || 'Working days attendance verified and F&F settlement initiated.',
      workingDaysServedVerified: isWorkingDaysComplete,
      medicalEmergencyWaiverApproved: record.category === 'IMMEDIATE_EMERGENCY' && isMedicalWaiver,
      companyIdCardAssetsReturned: true,
      leaveOdFnfSettlementCalculated: true,
    };

    record.status = 'STAGE_2_APPROVED_STAGE_3_PENDING';
    record.updatedAt = new Date().toLocaleString('en-IN');

    this.saveState();
    return record;
  }

  // ─── Stage 3: Admin Final Approval & Automated Portal Login Deactivation ───
  public approveStage3Admin(
    resignationId: string,
    approverName: string,
    comments: string
  ): ResignationRecord {
    const record = this.getResignationById(resignationId);
    if (!record) throw new Error('Resignation record not found');

    if (!record.stage1.isApproved || !record.stage2.isApproved) {
      throw new Error('Stages 1 (Branch Manager) and Stage 2 (HR) must be approved before final Admin clearance.');
    }

    const year = new Date().getFullYear();
    const relSeq = this.records.filter((r) => r.stage3.isApproved).length + 1;
    const relievingRefNo = `GLF/HR/REL/${year}/${relSeq.toString().padStart(3, '0')}`;

    record.stage3 = {
      isApproved: true,
      approvedBy: approverName,
      approvedAt: new Date().toLocaleString('en-IN'),
      comments: comments.trim() || 'Final relieving granted. Access revoked and official credentials archived.',
      loginDeactivated: true,
      relievedAt: new Date().toLocaleString('en-IN'),
      officialRelievingLetterRefNo: relievingRefNo,
    };

    record.status = 'STAGE_3_APPROVED_RELIEVED';
    record.updatedAt = new Date().toLocaleString('en-IN');

    // ── Execute Automated Login Deactivation ──
    this.deactivateEmployeeLogin(record.employeeId);

    this.saveState();
    return record;
  }

  // Deactivate login in employee master
  private deactivateEmployeeLogin(employeeId: string) {
    try {
      const stored = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
      if (stored) {
        const employees = JSON.parse(stored);
        const idx = employees.findIndex(
          (e: any) => e.id.toLowerCase() === employeeId.toLowerCase()
        );
        if (idx !== -1) {
          employees[idx].status = 'RELIEVED (INACTIVE)';
          employees[idx].updatedAt = new Date().toISOString().slice(0, 10);
          localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
          window.dispatchEvent(new Event('glf_employee_updated'));
        }
      }
    } catch (e) {
      console.error('Failed to deactivate employee login:', e);
    }
  }

  // Resignation Withdrawal
  public withdrawResignation(resignationId: string, reason: string): ResignationRecord {
    const record = this.getResignationById(resignationId);
    if (!record) throw new Error('Resignation record not found');

    if (record.status === 'STAGE_3_APPROVED_RELIEVED') {
      throw new Error('Cannot withdraw resignation after final Stage 3 Admin approval and relieving.');
    }

    record.status = 'WITHDRAWN';
    record.withdrawnAt = new Date().toLocaleString('en-IN');
    record.withdrawalReason = reason.trim();
    record.updatedAt = new Date().toLocaleString('en-IN');

    this.saveState();
    return record;
  }

  // Demo utility: increment working days served
  public incrementWorkingDay(resignationId: string): ResignationRecord {
    const record = this.getResignationById(resignationId);
    if (!record) throw new Error('Resignation record not found');

    if (record.actualWorkingDaysServed < record.roleNoticeRequirementDays) {
      record.actualWorkingDaysServed += 1;
      record.updatedAt = new Date().toLocaleString('en-IN');
      this.saveState();
    }
    return record;
  }
}

export const resignationService = new ResignationService();
