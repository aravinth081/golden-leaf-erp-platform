// ──────────────────────────────────────────────────
// Golden Leaf Finance — Compensation & Salary Fixation Page
// Admin Console to Fix Baseline Pay per Role and Individual Overrides per Employee
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Users,
  Building2,
  Edit2,
  Plus,
  Check,
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  TrendingUp,
  X,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  getRoleSalaries,
  getRoleSalary,
  fixRoleSalary,
  getEmployeeSalaries,
  getEmployeeSalary,
  fixEmployeeSalary,
  calculateSalaryBreakdown,
  buildPayslipPDF,
  getStaffPayslips,
} from '../../services/roleSalaryService';
import { getStoredBranches, type DetailedBranch } from '../../services/branchService';
import { getActiveStaffProfiles } from '../../services/staffService';
import { STAFF_ROLE_META } from '../../types/staff.types';
import type { UserRole } from '../../types/auth.types';
import type { RoleSalaryConfig, EmployeeSalaryConfig } from '../../types/roleSalary.types';
import type { CostCenter, EmploymentType } from '../../types/hrPayroll.types';

export const CompensationManagementPage: React.FC = () => {
  const currentUser = useAuthStore((s) => s.user);
  const { addToast } = useUIStore();
  const isAdmin = currentUser?.customClaims?.role === 'admin';

  // Active Tab: 'roles' (Fix Role Pay) | 'employees' (Fix Employee Pay)
  const [activeTab, setActiveTab] = useState<'roles' | 'employees'>('roles');

  // Role Salaries State
  const [roleSalaries, setRoleSalaries] = useState<Record<UserRole, RoleSalaryConfig>>({} as any);

  // Employee Salaries State
  const [employeeSalaries, setEmployeeSalaries] = useState<Record<string, EmployeeSalaryConfig>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  // Branches
  const [branches, setBranches] = useState<DetailedBranch[]>([]);

  // Modals
  const [editingRole, setEditingRole] = useState<RoleSalaryConfig | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeSalaryConfig | null>(null);

  // Form State for Role Fixation
  const [roleForm, setRoleForm] = useState({
    baseMonthly: 0,
    hraMonthly: 0,
    specialAllowance: 0,
    variablePayMonthly: 0,
    pfEmployeeMonthly: 0,
    esiEmployeeMonthly: 0,
    ptMonthly: 200,
    tdsMonthly: 0,
    costCenter: 'Operations' as CostCenter,
    employmentType: 'full_time' as EmploymentType,
  });

  // Form State for Employee Fixation
  const [employeeForm, setEmployeeForm] = useState({
    employeeId: '',
    employeeName: '',
    role: 'collection_agent' as UserRole,
    branchId: 'BR-01',
    baseMonthly: 0,
    hraMonthly: 0,
    specialAllowance: 0,
    variablePayMonthly: 0,
    pfEmployeeMonthly: 0,
    esiEmployeeMonthly: 0,
    ptMonthly: 200,
    tdsMonthly: 0,
    costCenter: 'Operations' as CostCenter,
    employmentType: 'full_time' as EmploymentType,
    bankAccountNumber: '10984523098',
    bankIfsc: 'HDFC0001723',
    bankName: 'HDFC Bank',
  });

  const loadData = () => {
    const roles = getRoleSalaries();
    setRoleSalaries(roles);

    const empSalaries = getEmployeeSalaries();
    setEmployeeSalaries(empSalaries);

    setBranches(getStoredBranches());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Edit Role Pay Modal
  const handleOpenEditRole = (cfg: RoleSalaryConfig) => {
    setEditingRole(cfg);
    setRoleForm({
      baseMonthly: cfg.baseMonthly,
      hraMonthly: cfg.hraMonthly,
      specialAllowance: cfg.specialAllowance,
      variablePayMonthly: cfg.variablePayMonthly,
      pfEmployeeMonthly: cfg.pfEmployeeMonthly,
      esiEmployeeMonthly: cfg.esiEmployeeMonthly,
      ptMonthly: cfg.ptMonthly,
      tdsMonthly: cfg.tdsMonthly,
      costCenter: cfg.costCenter,
      employmentType: cfg.employmentType,
    });
  };

  // Submit Role Pay Fixation
  const handleSaveRoleSalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editingRole) return;

    try {
      fixRoleSalary(editingRole.role, roleForm, currentUser);
      loadData();
      setEditingRole(null);
      addToast({
        type: 'success',
        title: 'Role Compensation Fixed',
        message: `Standard compensation structure updated for ${editingRole.roleTitle}.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Could not update role compensation.',
      });
    }
  };

  // Open Edit Employee Pay Modal
  const handleOpenEditEmployee = (empCfg: EmployeeSalaryConfig) => {
    setEditingEmployee(empCfg);
    setEmployeeForm({
      employeeId: empCfg.employeeId,
      employeeName: empCfg.employeeName,
      role: empCfg.role,
      branchId: empCfg.branchId || 'BR-01',
      baseMonthly: empCfg.baseMonthly,
      hraMonthly: empCfg.hraMonthly,
      specialAllowance: empCfg.specialAllowance,
      variablePayMonthly: empCfg.variablePayMonthly,
      pfEmployeeMonthly: empCfg.pfEmployeeMonthly,
      esiEmployeeMonthly: empCfg.esiEmployeeMonthly,
      ptMonthly: empCfg.ptMonthly,
      tdsMonthly: empCfg.tdsMonthly,
      costCenter: empCfg.costCenter,
      employmentType: empCfg.employmentType,
      bankAccountNumber: empCfg.bankAccountNumber || '10984523098',
      bankIfsc: empCfg.bankIfsc || 'HDFC0001723',
      bankName: empCfg.bankName || 'HDFC Bank',
    });
  };

  // 1-Click Apply Role Template to Employee
  const handleApplyRoleTemplate = () => {
    const roleCfg = getRoleSalary(employeeForm.role);
    setEmployeeForm((prev) => ({
      ...prev,
      baseMonthly: roleCfg.baseMonthly,
      hraMonthly: roleCfg.hraMonthly,
      specialAllowance: roleCfg.specialAllowance,
      variablePayMonthly: roleCfg.variablePayMonthly,
      pfEmployeeMonthly: roleCfg.pfEmployeeMonthly,
      esiEmployeeMonthly: roleCfg.esiEmployeeMonthly,
      ptMonthly: roleCfg.ptMonthly,
      tdsMonthly: roleCfg.tdsMonthly,
      costCenter: roleCfg.costCenter,
      employmentType: roleCfg.employmentType,
    }));
    addToast({
      type: 'info',
      title: 'Baseline Applied',
      message: `Standard ${roleCfg.roleTitle} salary baseline loaded into form.`,
    });
  };

  const openAddEmployeeCompensation = () => {
    const activeStaff = getActiveStaffProfiles();
    const first = activeStaff[0];
    const role: UserRole = first ? (STAFF_ROLE_META[first.role]?.internalRole as UserRole) : 'collection_agent';
    const roleCfg = roleSalaries[role] || getRoleSalary(role);

    setEditingEmployee({} as any);
    setEmployeeForm({
      employeeId: first ? first.employeeId : '',
      employeeName: first ? first.fullName : '',
      role,
      branchId: first?.branchId || 'BR-01',
      baseMonthly: roleCfg?.baseMonthly || 0,
      hraMonthly: roleCfg?.hraMonthly || 0,
      specialAllowance: roleCfg?.specialAllowance || 0,
      variablePayMonthly: roleCfg?.variablePayMonthly || 0,
      pfEmployeeMonthly: roleCfg?.pfEmployeeMonthly || 0,
      esiEmployeeMonthly: roleCfg?.esiEmployeeMonthly || 0,
      ptMonthly: roleCfg?.ptMonthly || 200,
      tdsMonthly: roleCfg?.tdsMonthly || 0,
      costCenter: roleCfg?.costCenter || 'Operations',
      employmentType: 'full_time',
      bankAccountNumber: '',
      bankIfsc: '',
      bankName: '',
    });
  };

  // Submit Employee Pay Fixation
  const handleSaveEmployeeSalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!employeeForm.employeeId.trim()) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Employee ID is required.' });
      return;
    }

    try {
      fixEmployeeSalary(employeeForm.employeeId, employeeForm, currentUser);
      loadData();
      setEditingEmployee(null);
      addToast({
        type: 'success',
        title: 'Employee Pay Fixed',
        message: `Custom compensation saved for ${employeeForm.employeeName} (${employeeForm.employeeId}).`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Could not update employee compensation.',
      });
    }
  };

  // Live Calculations for Role Form
  const roleBreakdown = calculateSalaryBreakdown(roleForm);

  // Live Calculations for Employee Form
  const employeeBreakdown = calculateSalaryBreakdown(employeeForm);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[50vh]">
        <h3 className="text-base font-bold text-slate-800">403 Forbidden: Admin Only</h3>
        <p className="text-xs text-slate-500 mt-1">
          Only Super Administrators can fix role and employee compensation packages.
        </p>
      </div>
    );
  }

  const roleList = Object.values(roleSalaries).filter((r) => r.role !== 'admin');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 sm:p-5 lg:p-6 flex flex-col gap-5 max-w-full font-sans text-slate-900 pb-16"
    >
      {/* ── Page Header ── */}
      <PageHeader
        title="Compensation & Salary Fixation"
        subtitle="Admin Control Center • Fix default salary baselines per role and customize compensation per employee"
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard' },
          { label: 'Compensation & Salary Fixation' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={openAddEmployeeCompensation}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132F58] text-white text-xs font-bold transition-all shadow-sm border border-[#D4AF37]/50 cursor-pointer"
            >
              <Plus size={15} className="text-[#D4AF37]" />
              <span>Fix Individual Employee Pay</span>
            </button>
          </div>
        }
      />

      {/* ── Tabs Switcher ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar sm:overflow-visible pb-px">
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'roles'
              ? 'border-[#0B1F3A] text-[#0B1F3A]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 size={15} />
          <span>Fix Pay by Role (Institutional Baseline)</span>
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'employees'
              ? 'border-[#0B1F3A] text-[#0B1F3A]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={15} />
          <span>Fix Pay by Employee (Custom Overrides)</span>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 1: ROLE PAY STRUCTURE (BASELINE FIXATION)                */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-[#0B1F3A] px-5 py-3.5 border-b border-slate-700/30 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
                <h3 className="text-xs font-bold tracking-wider uppercase font-sans">
                  Institutional Role Salary Packages
                </h3>
              </div>
              <span className="text-[11px] text-slate-300 font-semibold">
                {roleList.length} Operating Roles
              </span>
            </div>

            <div className="overflow-x-auto w-full custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse min-w-[920px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Role Title</th>
                    <th className="py-3 px-4">Basic Pay</th>
                    <th className="py-3 px-4">HRA</th>
                    <th className="py-3 px-4">Special Allowance</th>
                    <th className="py-3 px-4">Gross Pay (Monthly)</th>
                    <th className="py-3 px-4">Deductions (PF+ESI+PT+TDS)</th>
                    <th className="py-3 px-4 font-bold text-emerald-800">Net Take-Home</th>
                    <th className="py-3 px-4 font-bold text-amber-900">Annual CTC</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roleList.map((cfg) => {
                    const b = calculateSalaryBreakdown(cfg);
                    return (
                      <tr key={cfg.role} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-[13px]">{cfg.roleTitle}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{cfg.description}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          ₹{cfg.baseMonthly.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          ₹{cfg.hraMonthly.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          ₹{cfg.specialAllowance.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          ₹{b.grossMonthly.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-rose-700 font-semibold text-[11px]">
                          -₹{b.totalDeductions.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                          ₹{b.netSalary.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-amber-900 text-xs">
                          ₹{b.annualCtc.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleOpenEditRole(cfg)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-bold text-xs border border-slate-300 transition-all cursor-pointer"
                          >
                            <Edit2 size={12} />
                            <span>Fix Pay</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 2: EMPLOYEE CUSTOM OVERRIDES                             */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-[#0B1F3A] px-5 py-3.5 border-b border-slate-700/30 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
                <h3 className="text-xs font-bold tracking-wider uppercase font-sans">
                  Customized Employee Salary Packages
                </h3>
              </div>
              <span className="text-[11px] text-slate-300 font-semibold">
                {Object.keys(employeeSalaries).length} Custom Packages
              </span>
            </div>

            <div className="overflow-x-auto w-full custom-scrollbar">
              {Object.keys(employeeSalaries).length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-3">
                    <Users size={22} className="text-[#0B1F3A]" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">No custom employee overrides</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                    All employees currently inherit their role-level fixed baseline pay. Click "+ Fix Individual Employee Pay"
                    to set custom compensation for an employee.
                  </p>
                  <button
                    onClick={openAddEmployeeCompensation}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#132F58] text-white text-xs font-bold transition-all shadow-sm border border-[#D4AF37]/50 cursor-pointer"
                  >
                    <Plus size={14} className="text-[#D4AF37]" />
                    <span>+ Fix Individual Employee Pay</span>
                  </button>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Employee ID</th>
                      <th className="py-3 px-4">Employee Name</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Monthly Gross</th>
                      <th className="py-3 px-4">Deductions</th>
                      <th className="py-3 px-4 font-bold text-emerald-800">Net Take-Home</th>
                      <th className="py-3 px-4 font-bold text-amber-900">Annual CTC</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.values(employeeSalaries).map((sal) => {
                      const b = calculateSalaryBreakdown(sal);
                      return (
                        <tr key={sal.employeeId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {sal.employeeId}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{sal.employeeName}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              {getRoleSalary(sal.role).roleTitle}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            ₹{b.grossMonthly.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-rose-700 font-semibold">
                            -₹{b.totalDeductions.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                            ₹{b.netSalary.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-amber-900">
                            ₹{b.annualCtc.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleOpenEditEmployee(sal)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-bold text-xs border border-slate-300 transition-all cursor-pointer"
                            >
                              <Edit2 size={12} />
                              <span>Edit Package</span>
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
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL 1: EDIT ROLE PAY (ADMIN FIXATION)                      */}
      {/* ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden"
            >
              <div className="bg-[#0B1F3A] px-6 py-4.5 text-white flex items-center justify-between border-b border-[#D4AF37]/30">
                <div className="flex items-center gap-2">
                  <DollarSign size={18} className="text-[#D4AF37]" />
                  <h3 className="font-bold text-sm">Fix Salary for {editingRole.roleTitle}</h3>
                </div>
                <button
                  onClick={() => setEditingRole(null)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveRoleSalary} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Live Preview Card */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-emerald-800 font-bold uppercase">Monthly Gross</div>
                    <div className="text-base font-black text-emerald-950 mt-0.5">
                      ₹{roleBreakdown.grossMonthly.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-800 font-bold uppercase">Net Take-Home</div>
                    <div className="text-base font-black text-emerald-700 mt-0.5">
                      ₹{roleBreakdown.netSalary.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-amber-800 font-bold uppercase">Annual CTC</div>
                    <div className="text-base font-black text-amber-900 mt-0.5">
                      ₹{roleBreakdown.annualCtc.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Basic Salary (₹)</label>
                    <input
                      type="number"
                      value={roleForm.baseMonthly}
                      onChange={(e) => setRoleForm((p) => ({ ...p, baseMonthly: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">HRA (₹)</label>
                    <input
                      type="number"
                      value={roleForm.hraMonthly}
                      onChange={(e) => setRoleForm((p) => ({ ...p, hraMonthly: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Special Allowance (₹)</label>
                    <input
                      type="number"
                      value={roleForm.specialAllowance}
                      onChange={(e) => setRoleForm((p) => ({ ...p, specialAllowance: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Variable Pay / Incentive (₹)</label>
                    <input
                      type="number"
                      value={roleForm.variablePayMonthly}
                      onChange={(e) => setRoleForm((p) => ({ ...p, variablePayMonthly: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Monthly Deductions
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">PF Employee (₹)</label>
                      <input
                        type="number"
                        value={roleForm.pfEmployeeMonthly}
                        onChange={(e) => setRoleForm((p) => ({ ...p, pfEmployeeMonthly: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ESI Employee (₹)</label>
                      <input
                        type="number"
                        value={roleForm.esiEmployeeMonthly}
                        onChange={(e) => setRoleForm((p) => ({ ...p, esiEmployeeMonthly: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Professional Tax (PT ₹)</label>
                      <input
                        type="number"
                        value={roleForm.ptMonthly}
                        onChange={(e) => setRoleForm((p) => ({ ...p, ptMonthly: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Estimated TDS (₹)</label>
                      <input
                        type="number"
                        value={roleForm.tdsMonthly}
                        onChange={(e) => setRoleForm((p) => ({ ...p, tdsMonthly: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRole(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132F58] text-white text-xs font-bold cursor-pointer"
                  >
                    Save & Fix Role Pay
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL 2: EDIT EMPLOYEE CUSTOM PAY                            */}
      {/* ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="bg-[#0B1F3A] px-6 py-4.5 text-white flex items-center justify-between border-b border-[#D4AF37]/30">
                <div className="flex items-center gap-2">
                  <DollarSign size={18} className="text-[#D4AF37]" />
                  <h3 className="font-bold text-sm">
                    Fix Pay for {employeeForm.employeeName} ({employeeForm.employeeId})
                  </h3>
                </div>
                <button
                  onClick={() => setEditingEmployee(null)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEmployeeSalary} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* 1-Click Role Template Button */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-600">
                    Apply standard fixed baseline for <strong>{getRoleSalary(employeeForm.role).roleTitle}</strong>:
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyRoleTemplate}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    Apply Role Template
                  </button>
                </div>

                {/* Live Preview Card */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-emerald-800 font-bold uppercase">Monthly Gross</div>
                    <div className="text-base font-black text-emerald-950 mt-0.5">
                      ₹{employeeBreakdown.grossMonthly.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-800 font-bold uppercase">Net Take-Home</div>
                    <div className="text-base font-black text-emerald-700 mt-0.5">
                      ₹{employeeBreakdown.netSalary.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-amber-800 font-bold uppercase">Annual CTC</div>
                    <div className="text-base font-black text-amber-900 mt-0.5">
                      ₹{employeeBreakdown.annualCtc.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Employee ID <span className="text-slate-400 font-normal">(Pick or Type)</span>
                    </label>
                    <input
                      type="text"
                      list="active-staff-compensation-list"
                      value={employeeForm.employeeId}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        const found = getActiveStaffProfiles().find(
                          (p) => p.employeeId.toUpperCase() === val
                        );
                        if (found) {
                          const internalRole = (STAFF_ROLE_META[found.role]?.internalRole || 'collection_agent') as UserRole;
                          const rCfg = roleSalaries[internalRole] || getRoleSalary(internalRole);
                          setEmployeeForm((p) => ({
                            ...p,
                            employeeId: found.employeeId,
                            employeeName: found.fullName,
                            role: internalRole,
                            branchId: found.branchId || p.branchId,
                            baseMonthly: rCfg?.baseMonthly || p.baseMonthly,
                            hraMonthly: rCfg?.hraMonthly || p.hraMonthly,
                            specialAllowance: rCfg?.specialAllowance || p.specialAllowance,
                          }));
                        } else {
                          setEmployeeForm((p) => ({ ...p, employeeId: val }));
                        }
                      }}
                      placeholder="e.g. GLF-EMP-001"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold"
                    />
                    <datalist id="active-staff-compensation-list">
                      {getActiveStaffProfiles().map((p) => (
                        <option key={p.id} value={p.employeeId}>
                          {p.fullName} • {STAFF_ROLE_META[p.role]?.label || p.role}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Employee Name</label>
                    <input
                      type="text"
                      value={employeeForm.employeeName}
                      onChange={(e) => setEmployeeForm((p) => ({ ...p, employeeName: e.target.value }))}
                      placeholder="e.g. Full Legal Name"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Role</label>
                    <select
                      value={employeeForm.role}
                      onChange={(e) => setEmployeeForm((p) => ({ ...p, role: e.target.value as UserRole }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-semibold cursor-pointer"
                    >
                      <option value="hr_payroll_manager">HR & Payroll Manager</option>
                      <option value="branch_manager">Branch Manager</option>
                      <option value="credit_manager">Credit Manager</option>
                      <option value="collection_agent">Customer Relationship Officer (CRO)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Basic Pay (₹)</label>
                    <input
                      type="number"
                      value={employeeForm.baseMonthly}
                      onChange={(e) => setEmployeeForm((p) => ({ ...p, baseMonthly: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">HRA (₹)</label>
                    <input
                      type="number"
                      value={employeeForm.hraMonthly}
                      onChange={(e) => setEmployeeForm((p) => ({ ...p, hraMonthly: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Special Allowance (₹)</label>
                    <input
                      type="number"
                      value={employeeForm.specialAllowance}
                      onChange={(e) => setEmployeeForm((p) => ({ ...p, specialAllowance: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Variable Pay (₹)</label>
                    <input
                      type="number"
                      value={employeeForm.variablePayMonthly}
                      onChange={(e) => setEmployeeForm((p) => ({ ...p, variablePayMonthly: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">PF Deduction (₹)</label>
                    <input
                      type="number"
                      value={employeeForm.pfEmployeeMonthly}
                      onChange={(e) => setEmployeeForm((p) => ({ ...p, pfEmployeeMonthly: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ESI Deduction (₹)</label>
                    <input
                      type="number"
                      value={employeeForm.esiEmployeeMonthly}
                      onChange={(e) => setEmployeeForm((p) => ({ ...p, esiEmployeeMonthly: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Professional Tax (₹)</label>
                    <input
                      type="number"
                      value={employeeForm.ptMonthly}
                      onChange={(e) => setEmployeeForm((p) => ({ ...p, ptMonthly: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">TDS (₹)</label>
                    <input
                      type="number"
                      value={employeeForm.tdsMonthly}
                      onChange={(e) => setEmployeeForm((p) => ({ ...p, tdsMonthly: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingEmployee(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132F58] text-white text-xs font-bold cursor-pointer"
                  >
                    Save & Fix Employee Pay
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CompensationManagementPage;

