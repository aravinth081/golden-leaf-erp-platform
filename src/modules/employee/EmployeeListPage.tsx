// ──────────────────────────────────────────────────
// GOLDEN LEAF FINANCE — EMPLOYEE MANAGEMENT
// Complete Functional + PDF-Strict Implementation
// Module 3 — Employee Management:
// • Add Employee
// • Branch Assignment (uses real branchId)
// • Role Assignment (Admin, Branch Manager, Credit Manager, Customer Relationship Officer (CRO))
// • Employee Status (Active / Suspended)
// • Attendance (GPS Location, Selfie Capture, Login/Logout, Attendance Report)
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Edit2, MapPin, Calendar, Clock,
  ChevronDown, Filter, User,
  Camera, ShieldCheck, FileText
} from 'lucide-react';
import { PageHeader } from '../../components/ui';
import { useUIStore, useAuthStore } from '../../store';
import { getStoredBranches, type DetailedBranch } from '../../services/branchService';
import { getEmployeeRecords, type GPSAttendanceRecord } from '../../services/gpsAttendanceService';
import { canManageUser, type UserRole } from '../../types/auth.types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

// PDF-Strict Role Definitions
export type PDFRole = 'admin' | 'hr_payroll_manager' | 'branch_manager' | 'credit_manager' | 'collection_agent';

export const PDF_ROLES: { value: PDFRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'hr_payroll_manager', label: 'HR & Payroll Finance Manager' },
  { value: 'branch_manager', label: 'Branch Manager' },
  { value: 'credit_manager', label: 'Credit Manager' },
  { value: 'collection_agent', label: 'Customer Relationship Officer (CRO)' },
];

export const PDF_ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  hr_payroll_manager: 'HR & Payroll Finance Manager',
  branch_manager: 'Branch Manager',
  credit_manager: 'Credit Manager',
  collection_agent: 'Customer Relationship Officer (CRO)',
};

// PDF-Strict Employee Status
export type PDFEmployeeStatus = 'active' | 'suspended' | 'RELIEVED (INACTIVE)';

export interface PDFEmployee {
  id: string;
  name: string;
  role: PDFRole;
  branchId: string; // References real branch ID
  status: PDFEmployeeStatus;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'glf_pdf_strict_employees_master';

// Authoritative Initial Employee Dataset connected to actual branches
const INITIAL_EMPLOYEES: PDFEmployee[] = [];


export const EmployeeListPage: React.FC = () => {
  const { addToast } = useUIStore();
  const currentUser = useAuthStore((s) => s.user);
  const currentActorRole = (currentUser?.customClaims?.role || 'admin') as UserRole;
  const assignableRoles = PDF_ROLES.filter((r) => canManageUser(currentActorRole, r.value));

  // Global branch context
  const selectedBranchId = useUIStore((s) => s.selectedBranchId);
  const setSelectedBranchId = useUIStore((s) => s.setSelectedBranchId);

  // Dynamic branches from Branch Management source of truth
  const [branches, setBranches] = useState<DetailedBranch[]>([]);

  useEffect(() => {
    const loaded = getStoredBranches();
    setBranches(loaded);
  }, []);

  // Employees state with localStorage persistence
  const [employees, setEmployees] = useState<PDFEmployee[]>(() => {
    const MOCK_IDS = [
      'EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005',
      'EMP-006', 'EMP-007', 'EMP-008', 'EMP-009', 'EMP-010',
    ];
    const MOCK_NAMES = [
      'Sundaram', 'Karthik Raja', 'Priya Dharshini', 'Suresh Kumar',
      'Priya Sharma', 'Amit Das', 'Ramesh V.', 'Arun P.', 'K. Marimuthu',
    ];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (e: any) =>
              !MOCK_IDS.includes(e.id) &&
              !MOCK_NAMES.some((n) => e.name?.includes(n))
          );
          // Persist cleaned list back immediately
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }
    } catch (e) {
      console.error('Failed to parse stored employees', e);
    }
    return [];
  });

  // Load employees from Supabase on mount
  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      void (async () => {
        try {
          const { data: rows, error } = await supabase!
            .from('documents')
            .select('data')
            .eq('collection', 'employees')
            .eq('is_deleted', false);
          if (!error && Array.isArray(rows) && rows.length > 0) {
            const cloudEmps = rows.map((r: any) => r.data).filter(Boolean);
            setEmployees(cloudEmps);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudEmps));
          }
        } catch (e: unknown) {
          console.warn('[Supabase] Failed to fetch employees:', e);
        }
      })();
    }
  }, []);

  // Sync to localStorage & Supabase
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
      window.dispatchEvent(new CustomEvent('glf-employees-updated'));
      window.dispatchEvent(new CustomEvent('glf-storage-sync'));
    } catch (e) {
      console.error('Failed to save employees', e);
    }

    if (isSupabaseConfigured() && supabase && employees.length > 0) {
      const upsertRows = employees.map((emp) => ({
        collection: 'employees',
        id: emp.id,
        data: emp,
        is_deleted: emp.status === 'RELIEVED (INACTIVE)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      supabase.from('documents').upsert(upsertRows).then();
    }
  }, [employees]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<PDFEmployee | null>(null);
  const [attendanceEmployee, setAttendanceEmployee] = useState<PDFEmployee | null>(null);

  // Form State for Add Employee
  const [addForm, setAddForm] = useState({
    name: '',
    role: 'collection_agent' as PDFRole,
    branchId: '',
    status: 'active' as PDFEmployeeStatus,
  });

  // Form State for Edit Employee
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'collection_agent' as PDFRole,
    branchId: '',
    status: 'active' as PDFEmployeeStatus,
  });

  // Set default branch when branches load
  useEffect(() => {
    if (branches.length > 0 && !addForm.branchId) {
      setAddForm((prev) => ({ ...prev, branchId: branches[0].id }));
    }
  }, [branches]);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setEditingEmployee(null);
        setAttendanceEmployee(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper: Resolve branch display name from branchId
  const resolveBranchName = (branchId: string): string => {
    if (!branchId) return 'Unassigned';
    const found = branches.find((b) => b.id === branchId || b.name === branchId || b.code === branchId);
    return found ? found.name : branchId;
  };

  // Branch context filtering (Section 34, 35, 36)
  const activeBranchContext = branches.find((b) => b.id === selectedBranchId);
  const isValidBranchContext = Boolean(selectedBranchId && activeBranchContext);

  const displayedEmployees = employees.filter((emp) => {
    if (isValidBranchContext) {
      const branchMatches = emp.branchId === selectedBranchId || emp.branchId === activeBranchContext?.name;
      if (!branchMatches) return false;
    }
    return true;
  });

  // Open Edit Modal
  const handleOpenEdit = (emp: PDFEmployee) => {
    setEditingEmployee(emp);
    setEditForm({
      name: emp.name,
      role: emp.role,
      branchId: emp.branchId,
      status: emp.status,
    });
  };

  // ── ADD EMPLOYEE FLOW (Section 6, 7) ──
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Employee name is required.' });
      return;
    }

    const assignedBranchId = addForm.branchId || (branches[0] ? branches[0].id : 'BR-01');

    const newEmp: PDFEmployee = {
      id: `EMP-${String(employees.length + 1).padStart(3, '0')}`,
      name: addForm.name.trim(),
      role: addForm.role,
      branchId: assignedBranchId,
      status: addForm.status,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setEmployees((prev) => [newEmp, ...prev]);
    addToast({
      type: 'success',
      title: 'Employee Added',
      message: `${newEmp.name} assigned as ${PDF_ROLE_LABELS[newEmp.role]} to ${resolveBranchName(assignedBranchId)}.`,
    });

    setShowAddModal(false);
    setAddForm({
      name: '',
      role: 'collection_agent',
      branchId: branches[0] ? branches[0].id : 'BR-01',
      status: 'active',
    });
  };

  // ── EDIT EMPLOYEE FLOW (Section 39, 40, 41, 42) ──
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    if (!editForm.name.trim()) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Employee name is required.' });
      return;
    }

    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === editingEmployee.id
          ? {
              ...emp,
              name: editForm.name.trim(),
              role: editForm.role,
              branchId: editForm.branchId,
              status: editForm.status,
              updatedAt: new Date().toISOString().split('T')[0],
            }
          : emp
      )
    );

    addToast({
      type: 'success',
      title: 'Employee Updated',
      message: `${editForm.name} updated with role ${PDF_ROLE_LABELS[editForm.role]} at ${resolveBranchName(editForm.branchId)}.`,
    });

    setEditingEmployee(null);
  };

  // ── ATTENDANCE DATA RESOLUTION (Section 20 - 26) ──
  const getAttendanceForEmployee = (emp: PDFEmployee) => {
    // 1. Check gpsAttendanceService records
    const gpsRecords = getEmployeeRecords(emp.id);

    // 2. Check branchService attendance records
    const branchRecords: {
      id: string;
      date: string;
      loginTime: string;
      logoutTime: string;
      gpsLocation: string;
      selfieAvailable: boolean;
      status: string;
    }[] = [];

    branches.forEach((b) => {
      (b.attendanceRecords || []).forEach((att) => {
        if (att.employeeId === emp.id || att.employeeName.toLowerCase() === emp.name.toLowerCase()) {
          branchRecords.push({
            id: att.id,
            date: 'Today',
            loginTime: att.loginTime,
            logoutTime: att.logoutTime,
            gpsLocation: att.gpsLocation ? `${att.gpsLocation.lat.toFixed(4)}° N, ${att.gpsLocation.lng.toFixed(4)}° E • ${att.gpsLocation.address}` : 'Not available',
            selfieAvailable: att.selfieVerified,
            status: att.status,
          });
        }
      });
    });

    // Merge actual records
    const formattedGPS = gpsRecords.map((r: GPSAttendanceRecord) => ({
      id: r.id,
      date: r.date,
      loginTime: r.punchInTime ? new Date(r.punchInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Not available',
      logoutTime: r.punchOutTime ? new Date(r.punchOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Not available',
      gpsLocation: r.punchInGPS ? `${r.punchInGPS.lat.toFixed(4)}° N, ${r.punchInGPS.lng.toFixed(4)}° E • ${r.punchInGPS.address}` : 'Not available',
      selfieAvailable: Boolean(r.punchInSelfie),
      status: r.status === 'present' ? 'Present' : r.status === 'late' ? 'Late' : r.status,
    }));

    const combined = [...branchRecords, ...formattedGPS];

    // Deduplicate by ID
    const uniqueRecords = combined.filter(
      (rec, index, self) => index === self.findIndex((t) => t.id === rec.id)
    );

    return uniqueRecords;
  };

  const selectedAttendanceRecords = attendanceEmployee ? getAttendanceForEmployee(attendanceEmployee) : [];
  const latestAttendance = selectedAttendanceRecords[0] || null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 sm:p-5 lg:p-6 flex flex-col gap-5 pb-12 font-sans max-w-full text-[#0B1F3A]"
    >
      {/* ── 4. PAGE TITLE (Strict PDF Requirement: Section 4) ── */}
      <PageHeader
        title="Employee Management"
        subtitle="Manage employees, branch assignments, roles, status and attendance."
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard' },
          { label: 'Employee Management' },
        ]}
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132F58] text-white font-semibold text-xs transition-all shadow-sm border border-[#D4AF37]/50 active:scale-95 cursor-pointer"
          >
            <Plus size={15} className="text-[#D4AF37]" />
            <span>+ Add Employee</span>
          </button>
        }
      />

      {/* ── 5. BRANCH CONTEXT SWITCHER (Section 34, 35, 36) ── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-[0_1px_3px_rgba(11,31,58,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-[#D4AF37]" />
            <span className="text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wider font-sans">
              BRANCH CONTEXT:
            </span>
          </div>

          <div className="relative min-w-[240px] sm:min-w-[280px]">
            <select
              value={selectedBranchId || ''}
              onChange={(e) => setSelectedBranchId(e.target.value ? e.target.value : null)}
              className="w-full appearance-none pl-3.5 pr-9 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#CBD5E1] focus:border-[#D4AF37] text-xs font-semibold text-[#0B1F3A] transition-all cursor-pointer focus:outline-none"
            >
              <option value="">All Branches ({employees.length} Total Employees)</option>
              {branches.map((b) => {
                const count = employees.filter((e) => e.branchId === b.id || e.branchId === b.name).length;
                return (
                  <option key={b.id} value={b.id}>
                    {b.name} ({count} {count === 1 ? 'Employee' : 'Employees'})
                  </option>
                );
              })}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
          </div>
        </div>

        {isValidBranchContext && activeBranchContext && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              Filtered to: <strong>{activeBranchContext.name}</strong>
            </span>
            <button
              onClick={() => setSelectedBranchId(null)}
              className="ml-1 p-0.5 rounded hover:bg-amber-200/60 text-amber-800 transition-colors cursor-pointer"
              title="View All Branches"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── 6. MAIN EMPLOYEE DIRECTORY (Section 15, 48, 50) ── */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04),0_4px_12px_rgba(11,31,58,0.02)] overflow-hidden">
        {/* Table Header Bar */}
        <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 border-b border-[#E2E8F0]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
            <h2 className="text-sm font-semibold text-[#FFFFFF] tracking-wide uppercase font-sans">
              EMPLOYEE DIRECTORY
            </h2>
          </div>
          <span className="text-xs text-slate-300 font-manrope font-semibold tabular-nums">
            {displayedEmployees.length} {displayedEmployees.length === 1 ? 'Employee' : 'Employees'}
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto w-full custom-scrollbar">
          {displayedEmployees.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#64748B] mb-3">
                <User size={22} className="text-[#0B1F3A]" />
              </div>
              <h3 className="text-sm font-bold text-[#0B1F3A] font-sans">
                No employees found
              </h3>
              <p className="text-xs text-[#64748B] max-w-sm mt-1 mb-4 font-sans">
                {isValidBranchContext
                  ? `No employees are currently assigned to ${activeBranchContext?.name}.`
                  : 'No employee records are available.'}
              </p>
              {isValidBranchContext ? (
                <button
                  onClick={() => setSelectedBranchId(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-semibold text-xs transition-all border border-slate-200 cursor-pointer"
                >
                  <span>View All Branches</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#132F58] text-white font-semibold text-xs transition-all shadow-sm border border-[#D4AF37]/50 cursor-pointer"
                >
                  <Plus size={14} className="text-[#D4AF37]" />
                  <span>+ Add Employee</span>
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse font-sans min-w-[700px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50/70 text-[#64748B] font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-6 text-left">EMPLOYEE</th>
                  <th className="py-3.5 px-6 text-left">ROLE</th>
                  <th className="py-3.5 px-6 text-left">BRANCH</th>
                  <th className="py-3.5 px-6 text-center">STATUS</th>
                  <th className="py-3.5 px-6 text-center">ATTENDANCE</th>
                  <th className="py-3.5 px-6 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {displayedEmployees.map((emp) => {
                  const roleLabel = PDF_ROLE_LABELS[emp.role] || emp.role;
                  const branchName = resolveBranchName(emp.branchId);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. EMPLOYEE COLUMN (Section 16: LEFT aligned, Name + ID) */}
                      <td className="py-4 px-6 text-left">
                        <div className="font-bold text-[#0B1F3A] text-sm font-sans">{emp.name}</div>
                        {emp.id && (
                          <div className="text-[11.5px] text-[#64748B] font-mono mt-0.5">{emp.id}</div>
                        )}
                      </td>

                      {/* 2. ROLE COLUMN (Section 17: LEFT aligned, PDF Role names) */}
                      <td className="py-4 px-6 text-left">
                        <span className="font-semibold text-[#0B1F3A] text-xs">
                          {roleLabel}
                        </span>
                      </td>

                      {/* 3. BRANCH COLUMN (Section 18: LEFT aligned, Resolved from branchId) */}
                      <td className="py-4 px-6 text-left">
                        <span className="text-[#0B1F3A] text-xs font-medium">
                          {branchName}
                        </span>
                      </td>

                      {/* 4. STATUS COLUMN (Section 19: CENTER aligned, Subtle badge) */}
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            emp.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : emp.status === 'RELIEVED (INACTIVE)'
                              ? 'bg-slate-100 text-slate-700 border border-slate-300 font-bold'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              emp.status === 'active'
                                ? 'bg-emerald-600'
                                : emp.status === 'RELIEVED (INACTIVE)'
                                ? 'bg-slate-500'
                                : 'bg-amber-600'
                            }`}
                          />
                          <span>{emp.status === 'RELIEVED (INACTIVE)' ? 'Relieved (Inactive)' : emp.status}</span>
                        </span>
                      </td>

                      {/* 5. ATTENDANCE COLUMN (Section 20: CENTER aligned, View action) */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => setAttendanceEmployee(emp)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] text-xs font-semibold transition-all border border-slate-200 cursor-pointer active:scale-95"
                          title={`View Attendance details for ${emp.name}`}
                        >
                          <Calendar size={13} className="text-[#D4AF37]" />
                          <span>View</span>
                        </button>
                      </td>

                      {/* 6. ACTIONS COLUMN (Section 39: CENTER aligned, Edit action) */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#132F58] text-white text-xs font-semibold transition-all shadow-xs border border-[#D4AF37]/40 cursor-pointer active:scale-95"
                          title={`Edit ${emp.name}`}
                        >
                          <Edit2 size={12} className="text-[#D4AF37]" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════ */}
      {/* MODAL 1: ADD EMPLOYEE (Section 6, 7)              */}
      {/* ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAddModal && (
          <div
            onClick={() => setShowAddModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm cursor-pointer font-sans"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#E2E8F0] w-[min(94vw,520px)] max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl relative font-sans cursor-default"
            >
              {/* Header */}
              <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider font-sans">
                    Add Employee
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs font-sans">
                {/* Employee Name */}
                <div>
                  <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                    Employee Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white font-medium"
                  />
                </div>

                {/* Role Assignment (Section 10: PDF Roles) */}
                <div>
                  <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                    Role Assignment *
                  </label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value as PDFRole })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white font-medium cursor-pointer"
                  >
                    {assignableRoles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Branch Assignment (Section 8, 9: Real Branch IDs) */}
                <div>
                  <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                    Branch Assignment *
                  </label>
                  <select
                    value={addForm.branchId}
                    onChange={(e) => setAddForm({ ...addForm, branchId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white font-medium cursor-pointer"
                  >
                    {branches
                      .filter((b) => b.status === 'Active')
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Employee Status (Section 13: Active / Suspended) */}
                <div>
                  <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                    Employee Status *
                  </label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value as PDFEmployeeStatus })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white font-medium cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-semibold border border-slate-200 cursor-pointer min-h-[40px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl bg-[#0B1F3A] hover:bg-[#132F58] text-white font-bold shadow-sm border border-[#D4AF37]/50 cursor-pointer min-h-[40px] active:scale-95"
                  >
                    Save Employee
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════ */}
      {/* MODAL 2: EDIT EMPLOYEE (Section 39 - 42)          */}
      {/* ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {editingEmployee && (
          <div
            onClick={() => setEditingEmployee(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm cursor-pointer font-sans"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#E2E8F0] w-[min(94vw,520px)] max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl relative font-sans cursor-default"
            >
              {/* Header */}
              <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider font-sans">
                    Edit Employee: {editingEmployee.name}
                  </h3>
                </div>
                <button
                  onClick={() => setEditingEmployee(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveEdit} className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs font-sans">
                {/* Employee ID (Preserved) */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Employee ID:</span>
                  <span className="font-mono font-bold text-[#0B1F3A]">{editingEmployee.id}</span>
                </div>

                {/* Employee Name */}
                <div>
                  <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                    Employee Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white font-medium"
                  />
                </div>

                {/* Role Assignment (Section 41) */}
                <div>
                  <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                    Role Assignment *
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as PDFRole })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white font-medium cursor-pointer"
                  >
                    {assignableRoles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Branch Assignment (Section 40) */}
                <div>
                  <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                    Branch Assignment *
                  </label>
                  <select
                    value={editForm.branchId}
                    onChange={(e) => setEditForm({ ...editForm, branchId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white font-medium cursor-pointer"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.status === 'Disabled' ? '(Disabled Branch)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Employee Status (Section 42) */}
                <div>
                  <label className="block font-semibold text-[#0B1F3A] uppercase mb-1">
                    Employee Status *
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as PDFEmployeeStatus })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#D4AF37] text-xs min-h-[40px] bg-white font-medium cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingEmployee(null)}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-semibold border border-slate-200 cursor-pointer min-h-[40px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl bg-[#0B1F3A] hover:bg-[#132F58] text-white font-bold shadow-sm border border-[#D4AF37]/50 cursor-pointer min-h-[40px] active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════ */}
      {/* MODAL 3: ATTENDANCE DETAILS (Section 20 - 26)     */}
      {/* ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {attendanceEmployee && (
          <div
            onClick={() => setAttendanceEmployee(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm cursor-pointer font-sans"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#E2E8F0] w-[min(94vw,640px)] max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl relative font-sans cursor-default"
            >
              {/* Header */}
              <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider font-sans">
                      Attendance: {attendanceEmployee.name}
                    </h3>
                    <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                      {attendanceEmployee.id} • {PDF_ROLE_LABELS[attendanceEmployee.role]}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setAttendanceEmployee(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs font-sans">
                {/* Employee Identification Card (Section 22) */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block">Employee:</span>
                    <span className="font-bold text-[#0B1F3A]">{attendanceEmployee.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Branch:</span>
                    <span className="font-bold text-[#0B1F3A]">{resolveBranchName(attendanceEmployee.branchId)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Role:</span>
                    <span className="font-bold text-[#0B1F3A]">{PDF_ROLE_LABELS[attendanceEmployee.role]}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Status:</span>
                    <span className={`font-bold capitalize ${attendanceEmployee.status === 'active' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {attendanceEmployee.status}
                    </span>
                  </div>
                </div>

                {/* Section 21: GPS Location, Selfie Capture, Login Time, Logout Time */}
                {latestAttendance ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Login Time */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                          <Clock size={13} className="text-[#D4AF37]" />
                          <span>LOGIN TIME</span>
                        </div>
                        <div className="text-sm font-bold text-[#0B1F3A]">
                          {latestAttendance.loginTime || 'Not available'}
                        </div>
                      </div>

                      {/* Logout Time */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                          <Clock size={13} className="text-[#D4AF37]" />
                          <span>LOGOUT TIME</span>
                        </div>
                        <div className="text-sm font-bold text-[#0B1F3A]">
                          {latestAttendance.logoutTime || 'Not available'}
                        </div>
                      </div>
                    </div>

                    {/* GPS Location (Section 23) */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                        <MapPin size={13} className="text-[#D4AF37]" />
                        <span>GPS LOCATION</span>
                      </div>
                      <div className="text-xs font-bold text-[#0B1F3A] leading-relaxed">
                        {latestAttendance.gpsLocation || 'Not available'}
                      </div>
                    </div>

                    {/* Selfie Capture (Section 24) */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                        <Camera size={13} className="text-[#D4AF37]" />
                        <span>SELFIE CAPTURE</span>
                      </div>
                      {latestAttendance.selfieAvailable ? (
                        <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                          <ShieldCheck size={16} />
                          <span>Selfie Verified with GPS Punch</span>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 font-medium">
                          Selfie not available
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-5 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                    <p className="font-semibold text-xs text-[#0B1F3A]">No attendance records available for this employee</p>
                    <p className="text-[11px] mt-1 text-slate-400">GPS location, selfie, login time, and logout time will appear once attendance is logged.</p>
                  </div>
                )}

                {/* Section 26: Attendance Report */}
                <div>
                  <h4 className="font-bold text-[#0B1F3A] text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText size={13} className="text-[#D4AF37]" />
                    <span>Attendance Report</span>
                  </h4>

                  {selectedAttendanceRecords.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                      No report records available.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[10.5px] uppercase">
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Login</th>
                            <th className="py-2.5 px-3">Logout</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedAttendanceRecords.map((rec) => (
                            <tr key={rec.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-semibold text-[#0B1F3A]">{rec.date}</td>
                              <td className="py-2.5 px-3">{rec.loginTime}</td>
                              <td className="py-2.5 px-3">{rec.logoutTime}</td>
                              <td className="py-2.5 px-3">
                                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                                  {rec.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAttendanceEmployee(null)}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-semibold border border-slate-200 cursor-pointer text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EmployeeListPage;
