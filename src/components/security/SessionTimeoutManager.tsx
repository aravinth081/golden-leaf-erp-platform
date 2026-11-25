// ──────────────────────────────────────────────────
// Golden Leaf Finance — Session Inactivity & Security Manager
// Banking-grade Session Timeout: 15 Minutes Inactivity Auto-Logout
// Interactive Warning Modal at 13 Minutes (2-minute countdown)
// Tab-close session destruction & Background Tab Visibility Guard
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Clock, LogOut, RefreshCw, Lock } from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';

// Institutional Configuration
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes Inactivity Limit
const WARNING_THRESHOLD_MS = 13 * 60 * 1000; // Warning shown at 13 minutes (2 min before timeout)
const ACTIVITY_THROTTLE_MS = 4000; // Update activity at most once every 4s

export const SessionTimeoutManager: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const updateLastActivity = useAuthStore((s) => s.updateLastActivity);
  const logout = useAuthStore((s) => s.logout);
  const addToast = useUIStore((s) => s.addToast);

  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);

  const lastActivityRef = useRef<number>(useAuthStore.getState().lastActivity || Date.now());

  const lastThrottleRef = useRef<number>(Date.now());
  const isWarningModalOpenRef = useRef<boolean>(false);
  isWarningModalOpenRef.current = showWarningModal;

  // Handle immediate auto-logout due to inactivity
  const handleTimeoutLogout = useCallback(() => {
    setShowWarningModal(false);
    logout();
    addToast({
      type: 'warning',
      title: 'Session Expired (பாதுகாப்பு அமர்வு முடிந்தது)',
      message: 'Your session timed out due to 15 minutes of inactivity for security reasons. Please enter your credentials to log in again.',
      duration: 5000,
    });
    navigate('/login', { replace: true });
  }, [logout, addToast, navigate]);

  // Keep session alive
  const handleStayLoggedIn = useCallback(() => {
    updateLastActivity();
    setShowWarningModal(false);
    setSecondsRemaining(120);
    addToast({
      type: 'success',
      title: 'Session Extended',
      message: 'Your session has been securely refreshed.',
      duration: 2000,
    });
  }, [updateLastActivity, addToast]);

  // Explicit logout from warning modal
  const handleExplicitLogout = useCallback(() => {
    setShowWarningModal(false);
    logout();
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been securely signed out.',
      duration: 2000,
    });
    navigate('/login', { replace: true });
  }, [logout, addToast, navigate]);

  // Register throttled user activity events
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const handleUserInteraction = () => {
      // Don't auto-reset while warning modal is shown; user must explicitly click "Stay Logged In"
      if (isWarningModalOpenRef.current) return;

      const now = Date.now();
      if (now - lastThrottleRef.current > ACTIVITY_THROTTLE_MS) {
        lastThrottleRef.current = now;
        lastActivityRef.current = now;
        updateLastActivity();
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'wheel', 'click'];
    events.forEach((evt) => window.addEventListener(evt, handleUserInteraction, { passive: true }));

    // Throttled mousemove
    let mouseThrottle: number | null = null;
    const handleMouseMove = () => {
      if (isWarningModalOpenRef.current) return;
      if (!mouseThrottle) {
        mouseThrottle = window.setTimeout(() => {
          mouseThrottle = null;
          handleUserInteraction();
        }, ACTIVITY_THROTTLE_MS);
      }
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserInteraction));
      window.removeEventListener('mousemove', handleMouseMove);
      if (mouseThrottle) clearTimeout(mouseThrottle);
    };
  }, [isAuthenticated, user, updateLastActivity]);

  // Main 1-second interval clock to evaluate idle elapsed time
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setShowWarningModal(false);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        handleTimeoutLogout();
      } else if (elapsed >= WARNING_THRESHOLD_MS) {
        const remaining = Math.max(0, Math.ceil((INACTIVITY_TIMEOUT_MS - elapsed) / 1000));
        setSecondsRemaining(remaining);
        if (!showWarningModal) {
          setShowWarningModal(true);
        }
      } else {
        if (showWarningModal) {
          setShowWarningModal(false);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, showWarningModal, handleTimeoutLogout]);

  // Visibility Change / Tab Switching Guard
  // When user returns after minimizing tab for > 15 mins, instantly terminate session
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const elapsed = now - lastActivityRef.current;
        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          handleTimeoutLogout();
        } else if (elapsed >= WARNING_THRESHOLD_MS) {
          const remaining = Math.max(0, Math.ceil((INACTIVITY_TIMEOUT_MS - elapsed) / 1000));
          setSecondsRemaining(remaining);
          setShowWarningModal(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, user, handleTimeoutLogout]);

  if (!isAuthenticated || !user) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / 120) * 100));

  return (
    <AnimatePresence>
      {showWarningModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0B1F3A]/70 backdrop-blur-md animate-in fade-in duration-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="session-warning-title"
            aria-describedby="session-warning-desc"
            className="w-full max-w-md bg-white rounded-3xl shadow-[0_24px_70px_rgba(11,31,58,0.45)] border-2 border-[#D4AF37]/50 overflow-hidden font-sans"
          >
            {/* Header with Golden Accent Banner */}
            <div className="bg-gradient-to-r from-[#0B1F3A] via-[#163563] to-[#0B1F3A] px-6 py-5 text-white flex items-center gap-3.5 border-b border-[#D4AF37]/40 relative">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/60 flex items-center justify-center shrink-0 shadow-inner">
                <ShieldAlert size={26} className="text-[#F5D77F] animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] font-mono">
                    Security Protection
                  </span>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                </div>
                <h3 id="session-warning-title" className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                  Session Inactivity Warning
                </h3>
              </div>
            </div>

            {/* Modal Body with Timer */}
            <div className="p-6 sm:p-7 text-center space-y-5">
              {/* Digital Countdown Timer Display */}
              <div className="inline-flex flex-col items-center justify-center p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 w-full shadow-inner">
                <div className="flex items-center gap-2 text-amber-900 mb-1">
                  <Clock size={16} className="text-amber-700 animate-spin" style={{ animationDuration: '6s' }} />
                  <span className="text-xs font-bold uppercase tracking-wider">Time Remaining</span>
                </div>
                <div className="font-mono text-4xl sm:text-5xl font-black text-[#0B1F3A] tracking-wider my-1 drop-shadow-xs">
                  {formattedCountdown}
                </div>
                <p className="text-[11px] text-amber-800 font-semibold">
                  Automatic logout in {secondsRemaining} seconds
                </p>

                {/* Animated Depletion Bar */}
                <div className="w-full bg-amber-200/80 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-[#D4AF37] transition-all duration-1000 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Security Explanation */}
              <div id="session-warning-desc" className="space-y-1.5 text-left bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0B1F3A]">
                  <Lock size={14} className="text-[#D4AF37]" />
                  <span>Financial Data Protection Safeguard</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your session has been idle for 13 minutes. To protect sensitive customer loan and collection records, your session will automatically terminate unless you confirm you are still working.
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  அமர்வு 15 நிமிடங்களில் காலாவதியாகும். தொடர்ந்து பணியாற்ற கீழே உள்ள பட்டனை அழுத்தவும்.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleStayLoggedIn}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0B1F3A] to-[#1E3A5F] hover:from-[#122A4E] hover:to-[#244773] text-white text-xs sm:text-sm font-bold tracking-wide transition-all shadow-md hover:shadow-lg border border-[#D4AF37]/50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <RefreshCw size={15} className="text-[#D4AF37]" />
                  <span>Stay Logged In</span>
                </button>

                <button
                  type="button"
                  onClick={handleExplicitLogout}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs sm:text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <LogOut size={15} />
                  <span>Sign Out Now</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
