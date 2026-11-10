// ──────────────────────────────────────────────────
// Golden Leaf Finance — Luxury Toast Notification System
// Sleek, executive fintech notifications with smooth spring motion,
// custom icon badges, frosted glass, and responsive typography.
// ──────────────────────────────────────────────────

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info, Building2 } from 'lucide-react';
import { useUIStore } from '../../store';
import type { Toast as ToastType } from '../../store';

const toastConfig: Record<
  ToastType['type'],
  {
    badgeClass: string;
    accentColor: string;
    icon: (title?: string) => React.ReactNode;
  }
> = {
  success: {
    badgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    accentColor: 'bg-emerald-500',
    icon: () => <CheckCircle2 size={18} className="stroke-[2.5]" />,
  },
  error: {
    badgeClass: 'bg-rose-50 text-rose-600 border-rose-200/80',
    accentColor: 'bg-rose-500',
    icon: () => <AlertCircle size={18} className="stroke-[2.5]" />,
  },
  warning: {
    badgeClass: 'bg-amber-50 text-amber-600 border-amber-200/80',
    accentColor: 'bg-amber-500',
    icon: () => <AlertTriangle size={18} className="stroke-[2.5]" />,
  },
  info: {
    badgeClass: 'bg-blue-50 text-blue-600 border-blue-200/80',
    accentColor: 'bg-blue-600',
    icon: (title) =>
      title?.toLowerCase().includes('branch') ? (
        <Building2 size={18} className="stroke-[2.2]" />
      ) : (
        <Info size={18} className="stroke-[2.2]" />
      ),
  },
};

const ToastItem: React.FC<{ toast: ToastType }> = ({ toast }) => {
  const removeToast = useUIStore((s) => s.removeToast);
  const cfg = toastConfig[toast.type] || toastConfig.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.94 }}
      transition={{ type: 'spring', damping: 22, stiffness: 340 }}
      className="w-[min(92vw,360px)] bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_16px_40px_rgba(11,31,58,0.14)] border border-slate-200/90 p-3.5 sm:p-4 flex items-start gap-3 relative overflow-hidden group font-sans"
    >
      {/* Top accent strip */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${cfg.accentColor}`} />

      {/* Frosted Icon Badge */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${cfg.badgeClass} mt-0.5`}
      >
        {cfg.icon(toast.title)}
      </div>

      {/* Text Content */}
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs sm:text-sm font-bold text-[#0B1F3A] tracking-tight font-sans">
          {toast.title}
        </p>
        {toast.message && (
          <p className="mt-1 text-[11.5px] sm:text-xs text-slate-600 font-medium leading-relaxed font-sans">
            {toast.message}
          </p>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#0B1F3A] hover:bg-slate-100 transition-colors cursor-pointer shrink-0 mt-0.5"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore((s) => s.toasts);

  return (
    <div className="fixed top-3 sm:top-4 right-3 sm:right-4 left-3 sm:left-auto z-[100] flex flex-col gap-2.5 pointer-events-none items-end max-sm:items-center">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
