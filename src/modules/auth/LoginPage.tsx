// ──────────────────────────────────────────────────
// Golden Leaf Finance — Role-Based Instant Authentication
// Direct Institutional Role Selection • Main Roles Only
// Google Authenticator TOTP Two-Factor Authentication (Admin & BM)
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import * as OTPAuth from 'otpauth';
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
  QrCode,
  Smartphone,
  Copy,
  Check,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import type { AuthUser, UserRole } from '../../types';
import { authenticateStaffCredentials, getStoredStaffProfiles } from '../../services/staffService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

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

// Friendly role badge label helper
export const getRoleBadgeLabel = (role?: string): string => {
  const r = (role || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (r.includes('admin') || r.includes('administrator')) return 'Super Admin';
  if (r.includes('hr') || r.includes('payroll')) return 'HR & Payroll Finance Manager';
  if (r.includes('branch') || r === 'bm') return 'Branch Manager';
  if (r.includes('credit') || r === 'cm' || r.includes('underwrit')) return 'Credit Manager';
  if (r.includes('cro') || r.includes('collection') || r.includes('agent') || r.includes('recovery')) return 'Customer Relationship Officer (CRO)';
  return 'Staff Member';
};

type AuthStep = 'CREDENTIALS' | 'MFA_SETUP' | 'MFA_VERIFY';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  const addToast = useUIStore((s) => s.addToast);

  // Authentication Step Flow
  const [authStep, setAuthStep] = useState<AuthStep>('CREDENTIALS');
  const [pendingAuthResult, setPendingAuthResult] = useState<{
    authUser: AuthUser;
    profile: any;
    landingPath: string;
  } | null>(null);

  // MFA Setup & Verification States
  const [pendingSecret, setPendingSecret] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);
  const [showQrInVerify, setShowQrInVerify] = useState<boolean>(false);

  // Staff Credentials Form State
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [isAuthenticatingStaff, setIsAuthenticatingStaff] = useState(false);

  // Security: Brute-Force Rate Limiting & Account Protection
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      return parseInt(sessionStorage.getItem('glf_failed_login_attempts') || '0', 10) || 0;
    } catch {
      return 0;
    }
  });
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // If already authenticated, redirect immediately to dashboard
  useEffect(() => {
    if (isAuthenticated && user && authStep === 'CREDENTIALS') {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate, authStep]);

  // Complete Login and Redirect to Dashboard
  const completeLogin = (result: { authUser: AuthUser; profile: any; landingPath: string }) => {
    setUser(result.authUser);
    if (result.authUser.customClaims?.branchId) {
      useUIStore.getState().setSelectedBranchId(result.authUser.customClaims.branchId);
    }
    addToast({
      type: 'success',
      title: `Welcome, ${result.profile.fullName}!`,
      message: `Signed in as ${result.authUser.customClaims?.role.toUpperCase()} at ${
        result.authUser.customClaims?.branchName || 'HQ'
      }.`,
      duration: 2000,
    });
    navigate(result.landingPath, { replace: true });
  };

  // Step 1: Handle Staff Username & Password Submission
  const handleStaffCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');

    if (lockoutSeconds > 0) {
      setStaffError(`Security Protection: Please wait ${lockoutSeconds}s before attempting to sign in again.`);
      return;
    }

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
      const cleanUser = staffUsername
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim()
        .replace(/^@+|@+$/g, '');
      const cleanPass = staffPassword
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim();
      const result = await authenticateStaffCredentials(cleanUser, cleanPass);
      
      // Reset failed attempts counter on success
      setFailedAttempts(0);
      try {
        sessionStorage.removeItem('glf_failed_login_attempts');
      } catch {}

      // Direct instant authentication to dashboard
      completeLogin(result);
      return;
    } catch (err: any) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      try {
        sessionStorage.setItem('glf_failed_login_attempts', String(nextAttempts));
      } catch {}

      // Clear password field for security
      setStaffPassword('');

      if (nextAttempts >= 5) {
        setLockoutSeconds(60);
        setStaffError('Security Alert: 5 consecutive failed sign-in attempts. Login temporarily locked for 60 seconds.');
      } else {
        const remaining = 5 - nextAttempts;
        setStaffError(`${err.message || 'Login failed. Please verify your credentials.'} (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`);
      }
    } finally {
      setIsAuthenticatingStaff(false);
    }
  };

  // Step 2 (First-time): Verify setup OTP & activate MFA in database
  const handleVerifySetupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    const cleanOtp = otpCode.trim().replace(/\s+/g, '');
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setOtpError('Please enter a valid 6-digit verification code.');
      return;
    }

    if (!pendingAuthResult || !pendingSecret) {
      setOtpError('Session expired. Please sign in again.');
      setAuthStep('CREDENTIALS');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const roleName = getRoleBadgeLabel(pendingAuthResult.authUser.customClaims?.role || pendingAuthResult.profile.role);
      const rawPhone = (pendingAuthResult.profile.mobile || '').replace(/\D/g, '').slice(-10);
      const formattedPhone = rawPhone ? `+91 ${rawPhone}` : '';
      const authLabel = formattedPhone
        ? `${pendingAuthResult.profile.fullName} (${formattedPhone} • ${roleName})`
        : `${pendingAuthResult.profile.fullName} (${roleName})`;

      const totp = new OTPAuth.TOTP({
        issuer: 'Golden Leaf Finance',
        label: authLabel,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(pendingSecret),
      });

      const delta = totp.validate({ token: cleanOtp, window: 1 });

      if (delta === null) {
        setOtpError('Invalid 6-digit code. Please check your Google Authenticator app and try again.');
        setIsVerifyingOtp(false);
        return;
      }

      // Valid OTP! Persist MFA to Supabase PostgreSQL staff_users
      if (isSupabaseConfigured() && supabase) {
        try {
          const { error: updateErr } = await supabase
            .from('staff_users')
            .update({
              totp_secret: pendingSecret,
              is_mfa_enabled: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', pendingAuthResult.authUser.uid);

          if (updateErr) {
            console.warn('[Supabase] Retrying update with username match:', updateErr);
            await supabase
              .from('staff_users')
              .update({
                totp_secret: pendingSecret,
                is_mfa_enabled: true,
                updated_at: new Date().toISOString(),
              })
              .ilike('username', pendingAuthResult.profile.username);
          }
        } catch (dbErr) {
          console.warn('[Supabase] Failed to update staff_users with MFA secret:', dbErr);
        }
      }

      // Persist in local profile cache as well
      const stored = getStoredStaffProfiles();
      const pIdx = stored.findIndex(
        (p) =>
          p.id === pendingAuthResult.authUser.uid ||
          p.username.toLowerCase() === pendingAuthResult.profile.username.toLowerCase()
      );
      if (pIdx >= 0) {
        stored[pIdx].totpSecret = pendingSecret;
        stored[pIdx].isMfaEnabled = true;
        try {
          localStorage.setItem('glf_staff_profiles_master_v3', JSON.stringify(stored));
        } catch {}
      }

      addToast({
        type: 'success',
        title: 'MFA Setup Complete!',
        message: 'Google Authenticator successfully linked to your account.',
        duration: 3000,
      });

      completeLogin(pendingAuthResult);
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step 3 (Subsequent): Verify 6-digit OTP code with Supabase RPC / fallback
  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    const cleanOtp = otpCode.trim().replace(/\s+/g, '');
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setOtpError('Please enter a valid 6-digit verification code.');
      return;
    }

    if (!pendingAuthResult) {
      setOtpError('Session expired. Please sign in again.');
      setAuthStep('CREDENTIALS');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      let isValid = false;

      // Primary check: Supabase RPC server-side verification
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: rpcRes, error: rpcErr } = await supabase.rpc('verify_staff_totp', {
            p_staff_id: pendingAuthResult.authUser.uid,
            p_code: cleanOtp,
          });

          if (!rpcErr && rpcRes && rpcRes.valid === true) {
            isValid = true;
          }
        } catch (rpcCatch) {
          console.warn('[Supabase RPC Exception]', rpcCatch);
        }
      }

      // Secondary standard verification (RFC 6238 TOTP with +/- 30s window drift)
      if (!isValid) {
        const secretToUse =
          pendingSecret ||
          pendingAuthResult.profile?.totpSecret ||
          '';

        if (secretToUse) {
          try {
            const totp = new OTPAuth.TOTP({
              secret: OTPAuth.Secret.fromBase32(secretToUse),
              digits: 6,
              period: 30,
            });
            const delta = totp.validate({ token: cleanOtp, window: 1 });
            if (delta !== null) {
              isValid = true;
            }
          } catch (fallbackErr) {
            console.warn('[MFA Fallback check failed]', fallbackErr);
          }
        }
      }

      if (isValid) {
        completeLogin(pendingAuthResult);
      } else {
        setOtpError('Invalid or expired 6-digit code. Please verify the code on your Google Authenticator app.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const resetToCredentials = () => {
    setAuthStep('CREDENTIALS');
    setPendingAuthResult(null);
    setPendingSecret('');
    setQrCodeUrl('');
    setOtpCode('');
    setOtpError('');
    setShowQrInVerify(false);
  };

  return (
    <div className="w-full max-w-[420px] sm:max-w-[390px] px-2 sm:px-0 flex flex-col items-center select-none py-0">
      <AnimatePresence mode="wait">
        {/* VIEW 1: Standard Username & Password Login */}
        {authStep === 'CREDENTIALS' && (
          <motion.div
            key="credentials-view"
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="w-full flex flex-col items-center"
          >
            {/* Header section */}
            <div className="text-center mb-3 sm:mb-5 w-full flex flex-col items-center">
              <h2 className="text-[26px] sm:text-[clamp(22px,2.2vw,28px)] font-black text-[#0B1F3A] tracking-[0.08em] uppercase leading-tight font-serif drop-shadow-xs">
                SIGN IN
              </h2>
              {/* Sleek Golden Accent Motif */}
              <div className="flex items-center justify-center gap-2 mt-2 w-36" aria-hidden="true">
                <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent to-[#D4AF37]" />
                <div className="w-2 h-2 rotate-45 bg-[#D4AF37]" />
                <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent to-[#D4AF37]" />
              </div>
            </div>

            {/* Staff Credential Login Form */}
            <form onSubmit={handleStaffCredentialLogin} className="w-full space-y-4 sm:space-y-4.5">
              {staffError && (
                <div className="p-3 sm:p-3 rounded-2xl sm:rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-xs font-semibold flex items-start gap-2.5 shadow-xs">
                  <AlertCircle size={17} className="shrink-0 mt-0.5 text-rose-600" />
                  <span>{staffError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="staff-username"
                  className="block text-[13px] sm:text-xs font-bold text-[#0B1F3A] tracking-[0.06em] uppercase mb-1.5"
                >
                  USERNAME
                </label>
                <div className="relative group">
                  <span
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0B1F3A] transition-colors"
                    aria-hidden="true"
                  >
                    <User size={20} />
                  </span>
                  <input
                    id="staff-username"
                    name="username"
                    type="text"
                    value={staffUsername}
                    onChange={(e) => setStaffUsername(e.target.value)}
                    placeholder="Enter your username"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full h-[54px] sm:h-auto pl-12 pr-4 py-3 sm:py-3 rounded-2xl sm:rounded-xl bg-white focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-[#C59B27] focus:ring-3 focus:ring-[#D4AF37]/15 text-[16px] sm:text-sm font-semibold text-[#0B1F3A] placeholder:text-[15px] sm:placeholder:text-sm placeholder:text-slate-400 placeholder:font-normal focus:outline-none transition-all shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="staff-password"
                  className="block text-[13px] sm:text-xs font-bold text-[#0B1F3A] tracking-[0.06em] uppercase mb-1.5"
                >
                  PASSWORD
                </label>
                <div className="relative group">
                  <span
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0B1F3A] transition-colors"
                    aria-hidden="true"
                  >
                    <Lock size={20} />
                  </span>
                  <input
                    id="staff-password"
                    name="password"
                    type={showStaffPassword ? 'text' : 'password'}
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full h-[54px] sm:h-auto pl-12 pr-12 py-3 sm:py-3 rounded-2xl sm:rounded-xl bg-white focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-[#C59B27] focus:ring-3 focus:ring-[#D4AF37]/15 text-[16px] sm:text-sm font-semibold text-[#0B1F3A] placeholder:text-[15px] sm:placeholder:text-sm placeholder:text-slate-400 placeholder:font-normal focus:outline-none transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword((p) => !p)}
                    aria-label={showStaffPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0B1F3A] p-2 transition-colors cursor-pointer"
                  >
                    {showStaffPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticatingStaff || lockoutSeconds > 0}
                className="w-full h-[54px] sm:h-auto py-3.5 sm:py-3.5 px-4 rounded-2xl sm:rounded-xl bg-[#0B1F3A] hover:bg-[#122A4E] active:scale-[0.99] text-white text-[16px] sm:text-sm font-bold tracking-[0.08em] uppercase transition-all shadow-[0_8px_24px_rgba(11,31,58,0.28)] hover:shadow-[0_8px_28px_rgba(11,31,58,0.38)] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 mt-4 sm:mt-2"
              >
                {isAuthenticatingStaff ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-[#D4AF37] rounded-full animate-spin" />
                ) : (
                  <Key size={20} className="text-[#D4AF37]" />
                )}
                <span>
                  {lockoutSeconds > 0
                    ? `Locked (${lockoutSeconds}s)`
                    : isAuthenticatingStaff
                    ? 'Signing In...'
                    : 'SIGN IN'}
                </span>
              </button>
            </form>
          </motion.div>
        )}

        {/* VIEW 2: First-time MFA Setup (Google Authenticator QR Code) */}
        {authStep === 'MFA_SETUP' && (
          <motion.div
            key="mfa-setup-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="w-full flex flex-col items-center"
          >
            {/* Header */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mb-1.5 sm:mb-2 shadow-sm">
              <QrCode size={22} className="sm:w-[26px] sm:h-[26px]" />
            </div>
            <h2 className="text-lg sm:text-[22px] font-black text-[#0B1F3A] tracking-[0.04em] uppercase font-serif text-center">
              Setup Google Authenticator
            </h2>

            {/* Account & Mobile Identification Badge */}
            <div className="w-full bg-gradient-to-br from-amber-50 to-orange-50/50 border border-[#D4AF37]/40 rounded-xl p-2 sm:p-2.5 my-2 sm:my-2.5 text-center shadow-xs">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#0B1F3A] text-[#D4AF37] mb-1">
                {getRoleBadgeLabel(pendingAuthResult?.authUser.customClaims?.role || pendingAuthResult?.profile.role)}
              </span>
              <p className="text-[13.5px] sm:text-[14px] font-black text-[#0B1F3A] leading-tight">
                {pendingAuthResult?.profile.fullName}
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-1 text-xs font-semibold text-slate-700">
                <Smartphone size={13} className="text-[#0B1F3A]" />
                <span>Registered Phone:</span>
                <span className="font-mono font-bold text-[#0B1F3A]">
                  {pendingAuthResult?.profile.mobile ? `+91 ${pendingAuthResult.profile.mobile.replace(/\D/g, '').slice(-10)}` : 'Not Set'}
                </span>
              </div>
              <p className="text-[10px] text-amber-800 font-medium mt-0.5">
                Scan with Google Authenticator on this registered phone.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="p-2 sm:p-2.5 bg-white rounded-2xl border-2 border-[#D4AF37]/40 shadow-sm flex flex-col items-center mb-2.5 sm:mb-3">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Google Authenticator QR Code"
                  className="w-38 h-38 sm:w-44 sm:h-44 rounded-xl object-contain"
                />
              ) : (
                <div className="w-38 h-38 sm:w-44 sm:h-44 flex items-center justify-center">
                  <span className="w-8 h-8 border-3 border-[#0B1F3A]/20 border-t-[#D4AF37] rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Manual Key Section */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 sm:py-2 flex items-center justify-between gap-2 mb-2 sm:mb-2.5">
              <div className="text-left overflow-hidden">
                <span className="text-[9.5px] sm:text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Manual Entry Key
                </span>
                <span className="text-xs font-mono font-bold text-[#0B1F3A] truncate select-all block">
                  {pendingSecret}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(pendingSecret);
                  setCopiedSecret(true);
                  setTimeout(() => setCopiedSecret(false), 2000);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer shrink-0"
                title="Copy setup key"
              >
                {copiedSecret ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
              </button>
            </div>

            {/* Direct Deep Link for Mobile Phone Users */}
            {pendingSecret && (
              <a
                href={`otpauth://totp/Golden%20Leaf%20Finance:${encodeURIComponent(pendingAuthResult?.profile.fullName || 'Admin')}?secret=${pendingSecret}&issuer=Golden%20Leaf%20Finance&algorithm=SHA1&digits=6&period=30`}
                className="w-full py-2.5 px-3 mb-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 transition text-center shadow-2xs"
              >
                <Smartphone size={15} className="text-[#0B1F3A]" />
                <span>Open Google Authenticator App (1-Tap Link)</span>
              </a>
            )}

            {/* Verification Form */}
            <form onSubmit={handleVerifySetupOtp} className="w-full space-y-2.5 sm:space-y-3 pb-8 sm:pb-0">
              {otpError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2 shadow-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                  <span>{otpError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11.5px] font-bold text-[#0B1F3A] tracking-[0.05em] uppercase mb-1 text-center">
                  Enter 6-Digit App Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000 000"
                  autoFocus
                  className="w-full h-[52px] text-center tracking-[0.35em] font-mono text-2xl font-black text-[#0B1F3A] bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#C59B27] focus:ring-3 focus:ring-[#D4AF37]/15 rounded-xl focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || otpCode.length !== 6}
                className="w-full h-[50px] py-3 px-4 rounded-xl bg-gradient-to-r from-[#0B1F3A] via-[#122A4E] to-[#0B1F3A] hover:from-[#0F284B] hover:to-[#163563] text-white text-sm font-bold tracking-[0.05em] uppercase transition-all shadow-md border border-[#D4AF37]/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifyingOtp ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-[#D4AF37] rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 size={18} className="text-[#D4AF37]" />
                )}
                <span>{isVerifyingOtp ? 'Verifying...' : 'Verify & Complete Setup'}</span>
              </button>

              <button
                type="button"
                onClick={resetToCredentials}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-[#0B1F3A] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </form>
          </motion.div>
        )}

        {/* VIEW 3: Standard MFA Verification (Subsequent Logins) */}
        {authStep === 'MFA_VERIFY' && (
          <motion.div
            key="mfa-verify-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="w-full flex flex-col items-center"
          >
            {/* Header */}
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mb-2 shadow-sm">
              <Smartphone size={30} />
            </div>
            <h2 className="text-[23px] font-black text-[#0B1F3A] tracking-[0.04em] uppercase font-serif text-center">
              Security Verification
            </h2>

            {/* Account & Mobile Identification Badge */}
            <div className="w-full bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 rounded-xl p-2.5 my-2.5 text-center shadow-xs">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#0B1F3A] text-[#D4AF37] mb-1">
                {getRoleBadgeLabel(pendingAuthResult?.authUser.customClaims?.role || pendingAuthResult?.profile.role)}
              </span>
              <p className="text-[14px] font-black text-[#0B1F3A] leading-tight">
                {pendingAuthResult?.profile.fullName}
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-1 text-xs font-semibold text-slate-700">
                <Smartphone size={13} className="text-[#0B1F3A]" />
                <span>Registered Mobile:</span>
                <span className="font-mono font-bold text-[#0B1F3A]">
                  {pendingAuthResult?.profile.mobile ? `+91 ${pendingAuthResult.profile.mobile.replace(/\D/g, '').slice(-10)}` : 'Not Set'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                Enter code from Google Authenticator on your registered phone.
              </p>
            </div>

            {/* Quick QR code viewer for users on a new device or phone */}
            {showQrInVerify && qrCodeUrl && (
              <div className="w-full p-2.5 bg-white rounded-2xl border-2 border-[#D4AF37]/40 shadow-sm flex flex-col items-center mb-2.5">
                <img
                  src={qrCodeUrl}
                  alt="Google Authenticator QR Code"
                  className="w-36 h-36 sm:w-40 sm:h-40 rounded-xl object-contain"
                />
                <p className="text-[11px] text-[#0B1F3A] font-bold mt-1 text-center">
                  Scan this QR code with Google Authenticator on your phone.
                </p>
                {pendingSecret && (
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 mt-1.5 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-[#0B1F3A] truncate select-all">
                      {pendingSecret}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(pendingSecret);
                        setCopiedSecret(true);
                        setTimeout(() => setCopiedSecret(false), 2000);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-[#0B1F3A] transition cursor-pointer"
                      title="Copy setup key"
                    >
                      {copiedSecret ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowQrInVerify((prev) => !prev)}
              className="mb-2 text-[11px] font-bold text-[#B8860B] hover:text-[#0B1F3A] flex items-center gap-1.5 transition underline decoration-dotted cursor-pointer"
            >
              <QrCode size={13} />
              {showQrInVerify ? 'Hide QR Code' : 'Scan QR Code on Google Authenticator / New Phone'}
            </button>

            {/* Verification Form */}
            <form onSubmit={handleVerifyLoginOtp} className="w-full space-y-4 pb-8 sm:pb-0">
              {otpError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2 shadow-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                  <span>{otpError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11.5px] font-bold text-[#0B1F3A] tracking-[0.05em] uppercase mb-1.5 text-center">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000 000"
                  autoFocus
                  className="w-full h-[54px] text-center tracking-[0.35em] font-mono text-2xl font-black text-[#0B1F3A] bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#C59B27] focus:ring-3 focus:ring-[#D4AF37]/15 rounded-xl focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || otpCode.length !== 6}
                className="w-full h-[52px] py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0B1F3A] via-[#122A4E] to-[#0B1F3A] hover:from-[#0F284B] hover:to-[#163563] text-white text-sm font-bold tracking-[0.05em] uppercase transition-all shadow-md border border-[#D4AF37]/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifyingOtp ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-[#D4AF37] rounded-full animate-spin" />
                ) : (
                  <ShieldCheck size={18} className="text-[#D4AF37]" />
                )}
                <span>{isVerifyingOtp ? 'Verifying...' : 'Verify & Sign In'}</span>
              </button>

              <button
                type="button"
                onClick={resetToCredentials}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-[#0B1F3A] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
