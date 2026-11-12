// ──────────────────────────────────────────────────
// Golden Leaf Finance — Role-Based Instant Authentication
// Direct Institutional Role Selection • Main Roles Only
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Building2,
  FileCheck,
  Wallet,
  DollarSign,
  Sparkles,
  ArrowRight,
  Key,
  User,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import type { AuthUser, UserRole } from '../../types';
import { authenticateStaffCredentials } from '../../services/staffService';

export interface RoleLoginProfile {
  role: UserRole;
  title: string;
  scope: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentColor: string;
  badgeClass: string;
  rank: number;
}

// The 5 Main Institutional Roles
export const MAIN_ROLES: RoleLoginProfile[] = [
  {
    role: 'admin',
    title: 'Super Admin',
    scope: 'Company-Wide Master Authority',
    description: 'System settings, user management, and security audit',
    icon: ShieldCheck,
    accentColor: 'from-[#0B1F3A] to-[#1a3860]',
    badgeClass: 'bg-amber-500/15 text-amber-800 border-amber-300',
    rank: 100,
  },
  {
    role: 'hr_payroll_manager',
    title: 'HR & Payroll Finance Manager',
    scope: 'Corporate-Wide (All Branches)',
    description: 'Salary CTC builder, maker-checker payroll runs & statutory compliance',
    icon: DollarSign,
    accentColor: 'from-[#8C6207] to-[#B8860B]',
    badgeClass: 'bg-yellow-500/15 text-yellow-900 border-yellow-400',
    rank: 80,
  },
  {
    role: 'branch_manager',
    title: 'Branch Manager',
    scope: 'Main Branch — Anna Nagar',
    description: 'Branch collections, 1st-step approvals & staff oversight',
    icon: Building2,
    accentColor: 'from-[#1E3A8A] to-[#2563EB]',
    badgeClass: 'bg-blue-500/15 text-blue-800 border-blue-300',
    rank: 60,
  },
  {
    role: 'credit_manager',
    title: 'Credit Manager',
    scope: 'Risk & Underwriting Desk',
    description: 'KYC document verification, credit assessment & approvals',
    icon: FileCheck,
    accentColor: 'from-[#4C1D95] to-[#7C3AED]',
    badgeClass: 'bg-purple-500/15 text-purple-800 border-purple-300',
    rank: 50,
  },
  {
    role: 'collection_agent',
    title: 'Customer Relationship Officer (CRO)',
    scope: 'Route Collections & Field Operations',
    description: 'Daily collection receipts, center visits & EOD reconciliations',
    icon: Wallet,
    accentColor: 'from-[#065F46] to-[#059669]',
    badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-300',
    rank: 10,
  },
];

// Preserved for backward compatibility
export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', icon: ShieldCheck },
  { value: 'hr_payroll_manager', label: 'HR & Payroll Finance Manager', icon: DollarSign },
  { value: 'branch_manager', label: 'Branch Manager', icon: Building2 },
  { value: 'credit_manager', label: 'Credit Manager', icon: FileCheck },
  { value: 'collection_agent', label: 'Customer Relationship Officer (CRO)', icon: Wallet },
] as const;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  const addToast = useUIStore((s) => s.addToast);

  const [loggingInRole, setLoggingInRole] = useState<UserRole | null>(null);

  // Default to 'credentials' for authentic employee workplace usage; 'direct' available for sandbox evaluation
  const [loginMode, setLoginMode] = useState<'credentials' | 'direct'>('credentials');

  // Staff Credentials Form State
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [isAuthenticatingStaff, setIsAuthenticatingStaff] = useState(false);

  // If already authenticated, redirect immediately to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleRoleSelect = (profile: RoleLoginProfile) => {
    if (loggingInRole) return;
    setLoggingInRole(profile.role);

    // Determine branch isolation
    const isCompanyWide =
      profile.role === 'admin' || profile.role === 'hr_payroll_manager';

    const authUser: AuthUser = {
      uid: `usr-${profile.role}-demo`,
      email: `${profile.role.replace('_', '.')}@goldenleaf.finance`,
      displayName: profile.title,
      photoURL: null,
      phoneNumber: '+91 98400 00000',
      emailVerified: true,
      customClaims: {
        role: profile.role,
        branchId: isCompanyWide ? undefined : 'BR-01',
        branchName: isCompanyWide ? 'Corporate HQ (All Branches)' : 'Main Branch - Anna Nagar',
        companyId: 'default',
      },
    };

    setTimeout(() => {
      setUser(authUser);
      addToast({
        type: 'success',
        title: `Welcome, ${profile.title}!`,
        message: `Signed in with ${profile.scope}.`,
        duration: 2000,
      });
      navigate('/dashboard', { replace: true });
    }, 280);
  };

  // Handle Staff Username & Password Submission
  const handleStaffCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');

    if (!staffUsername.trim()) {
      setStaffError('Please enter your username.');
      return;
    }
    if (!staffPassword) {
      setStaffError('Please enter your password.');
      return;
    }

    setIsAuthenticatingStaff(true);
    try {
      const result = await authenticateStaffCredentials(staffUsername, staffPassword);
      setUser(result.authUser);
      addToast({
        type: 'success',
        title: `Welcome, ${result.profile.fullName}!`,
        message: `Signed in as ${result.authUser.customClaims?.role.toUpperCase()} at ${
          result.authUser.customClaims?.branchName || 'HQ'
        }.`,
        duration: 2000,
      });
      navigate(result.landingPath, { replace: true });
    } catch (err: any) {
      setStaffError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsAuthenticatingStaff(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] sm:max-w-[380px] px-2 sm:px-0 flex flex-col items-center select-none py-0">
      {/* Header section */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="text-center mb-4 sm:mb-6 w-full flex flex-col items-center"
      >
        <h2 className="text-[25px] sm:text-[clamp(22px,2.2vw,28px)] font-black text-[#0B1F3A] tracking-[0.08em] uppercase leading-tight font-serif drop-shadow-2xs">
          Sign In
        </h2>
        {/* Sleek Golden Accent Motif */}
        <div className="flex items-center justify-center gap-2 mt-2 w-32 sm:w-28">
          <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent to-[#D4AF37]" />
          <div className="w-1.5 h-1.5 rotate-45 bg-[#D4AF37]" />
          <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent to-[#D4AF37]" />
        </div>
      </motion.div>

      {/* Staff Credential Login Form - Seamless with page, no separate image-like box */}
      <motion.form
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        onSubmit={handleStaffCredentialLogin}
        className="w-full space-y-4 sm:space-y-4.5"
      >
        {staffError && (
          <div className="p-3.5 sm:p-3 rounded-2xl sm:rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-xs font-semibold flex items-start gap-2.5 shadow-xs">
            <AlertCircle size={17} className="shrink-0 mt-0.5 text-rose-600" />
            <span>{staffError}</span>
          </div>
        )}

        <div>
          <label className="block text-[12.5px] sm:text-xs font-bold text-[#0B1F3A] tracking-[0.05em] uppercase mb-1.5 sm:mb-1.5">
            Username
          </label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0B1F3A] transition-colors">
              <User size={19} />
            </span>
            <input
              type="text"
              value={staffUsername}
              onChange={(e) => setStaffUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              className="w-full h-[52px] sm:h-auto pl-12 pr-4 py-3 sm:py-3 rounded-2xl sm:rounded-xl bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-[#C59B27] focus:ring-3 focus:ring-[#D4AF37]/15 text-[15px] sm:text-sm font-semibold text-[#0B1F3A] placeholder:text-slate-400 placeholder:font-normal focus:outline-none transition-all shadow-2xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-[12.5px] sm:text-xs font-bold text-[#0B1F3A] tracking-[0.05em] uppercase mb-1.5 sm:mb-1.5">
            Password
          </label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0B1F3A] transition-colors">
              <Lock size={19} />
            </span>
            <input
              type={showStaffPassword ? 'text' : 'password'}
              value={staffPassword}
              onChange={(e) => setStaffPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full h-[52px] sm:h-auto pl-12 pr-12 py-3 sm:py-3 rounded-2xl sm:rounded-xl bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-[#C59B27] focus:ring-3 focus:ring-[#D4AF37]/15 text-[15px] sm:text-sm font-semibold text-[#0B1F3A] placeholder:text-slate-400 placeholder:font-normal focus:outline-none transition-all shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowStaffPassword((p) => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0B1F3A] p-2 transition-colors cursor-pointer"
            >
              {showStaffPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isAuthenticatingStaff}
          className="w-full h-[52px] sm:h-auto py-3.5 sm:py-3.5 px-4 rounded-2xl sm:rounded-xl bg-gradient-to-r from-[#0B1F3A] via-[#122A4E] to-[#0B1F3A] hover:from-[#0F284B] hover:to-[#163563] active:scale-[0.99] text-white text-[15px] sm:text-sm font-bold tracking-[0.05em] uppercase transition-all shadow-[0_4px_16px_rgba(11,31,58,0.25)] hover:shadow-[0_6px_22px_rgba(212,175,55,0.35)] border border-[#D4AF37]/60 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 mt-3 sm:mt-2"
        >
          {isAuthenticatingStaff ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-[#D4AF37] rounded-full animate-spin" />
          ) : (
            <Key size={18} className="text-[#D4AF37]" />
          )}
          <span>{isAuthenticatingStaff ? 'Signing In...' : 'Sign In'}</span>
        </button>
      </motion.form>
    </div>
  );
};

export default LoginPage;
