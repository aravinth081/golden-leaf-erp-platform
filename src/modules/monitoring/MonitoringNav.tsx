// ──────────────────────────────────────────────────
// GOLDEN LEAF FINANCE — MONITORING NAVIGATION HEADER
// Shared top bar for Admin Monitoring suite:
// • Page Title & Description (Section 44)
// • Submenu Tabs: Customer | Loan | Collection | Attendance
// • Global Branch Context Selector (Section 33-36)
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Filter, ChevronDown, X, Users, CreditCard, Wallet, Clock, Keyboard } from 'lucide-react';
import { PageHeader } from '../../components/ui';
import { useUIStore } from '../../store';
import { getStoredBranches, type DetailedBranch } from '../../services/branchService';

interface MonitoringNavProps {
  currentTab: 'customers' | 'loans' | 'collections' | 'attendance';
}

export const MonitoringNav: React.FC<MonitoringNavProps> = ({ currentTab }) => {
  const navigate = useNavigate();
  const selectedBranchId = useUIStore((s) => s.selectedBranchId);
  const setSelectedBranchId = useUIStore((s) => s.setSelectedBranchId);
  const [branches, setBranches] = useState<DetailedBranch[]>([]);

  useEffect(() => {
    setBranches(getStoredBranches());
  }, []);

  const activeBranch = branches.find((b) => b.id === selectedBranchId);
  const isBranchFiltered = Boolean(selectedBranchId && activeBranch);

  const tabLabels: Record<string, string> = {
    customers: 'Customer Monitoring',
    loans: 'Loan Monitoring',
    collections: 'Collection Monitoring',
    attendance: 'Attendance Monitoring',
  };

  const navItems = [
    { key: 'customers', label: 'Customer Monitoring', path: '/admin/customers', icon: Users, shortcut: '1' },
    { key: 'loans', label: 'Loan Monitoring', path: '/admin/loans', icon: CreditCard, shortcut: '2' },
    { key: 'collections', label: 'Collection Monitoring', path: '/admin/collections', icon: Wallet, shortcut: '3' },
    { key: 'attendance', label: 'Attendance Monitoring', path: '/admin/attendance', icon: Clock, shortcut: '4' },
  ];

  // ── Keyboard Navigation (Left / Right / 1-4 / Alt+Left / Alt+Right) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in form controls
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const currentIndex = navItems.findIndex((item) => item.key === currentTab);
      if (currentIndex === -1) return;

      // Number keys 1, 2, 3, 4 jump directly
      if (e.key === '1') {
        e.preventDefault();
        navigate(navItems[0].path);
      } else if (e.key === '2') {
        e.preventDefault();
        navigate(navItems[1].path);
      } else if (e.key === '3') {
        e.preventDefault();
        navigate(navItems[2].path);
      } else if (e.key === '4') {
        e.preventDefault();
        navigate(navItems[3].path);
      }

      // Alt + Left / Right Arrow navigation across panels (preserves plain arrows for table horizontal scrolling)
      if (e.altKey && e.key === 'ArrowRight') {
        // Only if modal is not open (no backdrop dialog)
        if (!document.querySelector('[role="dialog"]')) {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % navItems.length;
          navigate(navItems[nextIndex].path);
        }
      } else if (e.altKey && e.key === 'ArrowLeft') {
        if (!document.querySelector('[role="dialog"]')) {
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + navItems.length) % navItems.length;
          navigate(navItems[prevIndex].path);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTab, navigate]);

  return (
    <div className="flex flex-col gap-4 font-sans">
      {/* ── Page Header (Section 44) ── */}
      <PageHeader
        title="Monitoring"
        subtitle="Monitor customers, loans, collections and attendance."
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard' },
          { label: 'Monitoring' },
          { label: tabLabels[currentTab] },
        ]}
      />

      {/* ── Monitoring Submenu Tabs (Section 44) ── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-1.5 shadow-[0_1px_3px_rgba(11,31,58,0.04)] flex flex-wrap items-center justify-between gap-1.5 overflow-x-auto">
        <div className="flex items-center gap-1.5 flex-wrap">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.key;
            return (
              <NavLink
                key={item.key}
                to={item.path}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0B1F3A] text-white shadow-sm border border-[#D4AF37]/50'
                    : 'text-[#64748B] hover:text-[#0B1F3A] hover:bg-slate-50'
                }`}
                title={`Press '${item.shortcut}' or Left/Right arrows to switch`}
              >
                <Icon size={14} className={isActive ? 'text-[#D4AF37]' : 'text-[#64748B]'} />
                <span>{item.label}</span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                    isActive ? 'bg-white/20 text-[#F5D061]' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {item.shortcut}
                </span>
              </NavLink>
            );
          })}
        </div>

        {/* Keyboard navigation quick hint badge */}
        <div className="hidden lg:inline-flex items-center gap-2 text-[10.5px] font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 mr-1 shadow-2xs">
          <Keyboard size={13} className="text-[#D4AF37]" />
          <span>
            <strong>←</strong> <strong>→</strong> or <strong>1-4</strong>: Panels · <strong>↑</strong> <strong>↓</strong>: Rows · <strong>Enter</strong>: Inspect · <strong>Esc</strong>: Close
          </span>
        </div>
      </div>

      {/* ── Branch Context Selector Bar (Section 33-36) ── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(11,31,58,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              <option value="">All Branches (Complete Organization View)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
          </div>
        </div>

        {isBranchFiltered && activeBranch && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              Filtered to: <strong>{activeBranch.name}</strong>
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
    </div>
  );
};
