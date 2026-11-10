// ──────────────────────────────────────────────────
// Golden Leaf Finance — Premium Responsive Sidebar Navigation
// Supports Mobile Drawer (Slide-in) & Desktop Responsive Sidebar
// ──────────────────────────────────────────────────

import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Key, FileText, ChevronDown, Grid,
  GitBranch, ShieldAlert, Activity, Settings,
  LogOut, CheckSquare, Lock, Printer, LayoutDashboard,
  ShieldCheck, FileCheck, CreditCard, UserCheck, CheckCircle2,
  Wallet, Clock, X, BarChart3, UserCog, MapPin,
  AlertTriangle, Calendar, Shield, Eye, Briefcase,
  Database, Server, ClipboardList, TrendingUp, Banknote, Coins,
  Landmark, Send, DollarSign, Building2
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import { ROLE_LABELS, type UserRole } from '../../types';
import { Avatar } from '../ui/Avatar';
const goldenLeafLogo = '/logo-icon.png';

interface SubNavItem {
  path: string;
  label: string;
  roles: UserRole[];
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
  badge?: number;
  subItems?: SubNavItem[];
}

const navItems: NavItem[] = [
  // ── ADMIN EXCLUSIVE NAVIGATION ──
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin'] },
  {
    path: '/investors',
    label: 'Investor Directory',
    icon: <Users size={20} />,
    roles: ['admin'],
  },
  {
    path: '/fixed-deposits',
    label: 'Fixed Deposit (FD)',
    icon: <Landmark size={20} />,
    roles: ['admin'],
    subItems: [
      { path: '/fixed-deposits', label: 'All Operations & Tabs', roles: ['admin'] },
      { path: '/fixed-deposits/rates', label: 'Rate Slabs & Settings', roles: ['admin'] },
    ],
  },
  {
    path: '/loans',
    label: 'Loans',
    icon: <Briefcase size={20} />,
    roles: ['admin'],
    subItems: [
      { path: '/admin/loans', label: 'Group Loans', roles: ['admin'] },
      { path: '/loans/gold', label: 'Gold Loans', roles: ['admin'] },
      { path: '/loans/business', label: 'Business Loans', roles: ['admin'] },
    ],
  },
  {
    path: '/branches',
    label: 'Branch Management',
    icon: <GitBranch size={20} />,
    roles: ['admin'],
    subItems: [
      { path: '/branches', label: 'All Branches', roles: ['admin'] },
    ],
  },
  {
    path: '/employees',
    label: 'Employee Management',
    icon: <Users size={20} />,
    roles: ['admin'],
    subItems: [
      { path: '/employees', label: 'All Employees', roles: ['admin'] },
      { path: '/admin/staff-profiles', label: 'Staff Profile Management', roles: ['admin'] },
      { path: '/admin/compensation', label: 'Fix Role & Staff Pay', roles: ['admin'] },
      { path: '/admin/roles-permissions', label: 'Roles & Permissions', roles: ['admin'] },
    ],
  },
  {
    path: '/admin/staff-profiles',
    label: 'Staff Profiles (Admin)',
    icon: <UserCog size={20} />,
    roles: ['admin'],
  },
  {
    path: '/admin/compensation',
    label: 'Fix Role & Staff Pay',
    icon: <DollarSign size={20} />,
    roles: ['admin'],
  },
  {
    path: '/admin/monitoring',
    label: 'Monitoring',
    icon: <Eye size={20} />,
    roles: ['admin'],
    subItems: [
      { path: '/admin/customers', label: 'Customer Monitoring', roles: ['admin'] },
      { path: '/admin/loans', label: 'Loan Monitoring', roles: ['admin'] },
      { path: '/admin/collections', label: 'Collection Monitoring', roles: ['admin'] },
      { path: '/admin/attendance', label: 'Attendance Monitoring', roles: ['admin'] },
      { path: '/admin/eod', label: 'EOD Settlement Audit & PDF', roles: ['admin'] },
    ],
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: <FileText size={20} />,
    roles: ['admin'],
    subItems: [
      { path: '/reports/all', label: 'All Reports', roles: ['admin'] },
      { path: '/reports/customer', label: 'Customer Report', roles: ['admin'] },
      { path: '/reports/collection', label: 'Collection Report', roles: ['admin'] },
      { path: '/reports/daily', label: 'Daily Report', roles: ['admin'] },
      { path: '/reports/monthly', label: 'Monthly Report', roles: ['admin'] },
      { path: '/reports/pending', label: 'Pending Report', roles: ['admin'] },
      { path: '/reports/outstanding', label: 'Outstanding Report', roles: ['admin'] },
      { path: '/reports/loan', label: 'Loan Report', roles: ['admin'] },
      { path: '/reports/employee', label: 'Employee Report', roles: ['admin'] },
      { path: '/reports/attendance', label: 'Attendance Report', roles: ['admin'] },
      { path: '/reports/branch', label: 'Branch Report', roles: ['admin'] },
    ],
  },
  { path: '/sanction-letter', label: 'Sanction Letter & T&C', icon: <FileCheck size={20} />, roles: ['admin'] },
  { path: '/hr-payroll', label: 'HR & Payroll Finance', icon: <DollarSign size={20} />, roles: ['admin'] },
  { path: '/audit-logs', label: 'Audit Logs', icon: <ShieldAlert size={20} />, roles: ['admin'] },

  // ── HR & PAYROLL FINANCE MANAGER (COMPANY-WIDE) ──
  { path: '/dashboard', label: 'HR & Payroll Dashboard', icon: <LayoutDashboard size={20} />, roles: ['hr_payroll_manager'] },
  {
    path: '/hr-payroll',
    label: 'HR & Payroll Finance',
    icon: <DollarSign size={20} />,
    roles: ['hr_payroll_manager'],
    subItems: [
      { path: '/hr-payroll', label: 'Payroll Engine & NEFT', roles: ['hr_payroll_manager'] },
      { path: '/employees', label: 'Employee Master & KYC', roles: ['hr_payroll_manager'] },
      { path: '/attendance', label: 'Attendance & Leave Approvals', roles: ['hr_payroll_manager'] },
    ],
  },
  {
    path: '/customers',
    label: 'Manage Customers',
    icon: <Users size={20} />,
    roles: ['hr_payroll_manager'],
  },
  {
    path: '/loans',
    label: 'Loans',
    icon: <Briefcase size={20} />,
    roles: ['hr_payroll_manager'],
    subItems: [
      { path: '/approvals', label: 'Group Loans', roles: ['hr_payroll_manager'] },
      { path: '/loans/gold', label: 'Gold Loans', roles: ['hr_payroll_manager'] },
      { path: '/loans/business', label: 'Business Loans', roles: ['hr_payroll_manager'] },
    ],
  },
  {
    path: '/collections/daily',
    label: 'Collections',
    icon: <Wallet size={20} />,
    roles: ['hr_payroll_manager'],
  },
  {
    path: '/daily-closing',
    label: 'Daily Closing',
    icon: <Lock size={20} />,
    roles: ['hr_payroll_manager'],
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: <FileText size={20} />,
    roles: ['hr_payroll_manager'],
    subItems: [
      { path: '/reports/all', label: 'All Reports', roles: ['hr_payroll_manager'] },
      { path: '/reports/customer', label: 'Customer Report', roles: ['hr_payroll_manager'] },
      { path: '/reports/collection', label: 'Collection Report', roles: ['hr_payroll_manager'] },
      { path: '/reports/daily', label: 'Daily Report', roles: ['hr_payroll_manager'] },
    ],
  },
  { path: '/my-payslips', label: 'My Payslips', icon: <FileText size={20} />, roles: ['hr_payroll_manager'] },

  // ── BRANCH MANAGER EXCLUSIVE NAVIGATION ──
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['branch_manager'] },
  {
    path: '/loans',
    label: 'Loans',
    icon: <Briefcase size={20} />,
    roles: ['branch_manager'],
    subItems: [
      { path: '/approvals', label: 'Group Loans', roles: ['branch_manager'] },
      { path: '/loans/gold', label: 'Gold Loans', roles: ['branch_manager'] },
      { path: '/loans/business', label: 'Business Loans', roles: ['branch_manager'] },
    ],
  },
  { path: '/fixed-deposits', label: 'Fixed Deposit (FD)', icon: <Landmark size={20} />, roles: ['branch_manager'] },
  { path: '/customers', label: 'Manage Customers', icon: <Users size={20} />, roles: ['branch_manager'] },
  { path: '/collection-groups', label: 'Create Collection Groups', icon: <Grid size={20} />, roles: ['branch_manager'] },
  { path: '/collections/daily', label: 'View Daily Collections', icon: <Wallet size={20} />, roles: ['branch_manager'] },
  { path: '/approvals', label: 'Approve Loans', icon: <CheckSquare size={20} />, roles: ['branch_manager'] },
  { path: '/daily-closing', label: 'Daily Closing', icon: <Lock size={20} />, roles: ['branch_manager'] },
  { path: '/collections/eod', label: 'EOD Physical Notes Verification', icon: <Banknote size={20} />, roles: ['branch_manager'] },
  { path: '/printing', label: 'Print Collection Sheets', icon: <Printer size={20} />, roles: ['branch_manager'] },
  { path: '/sanction-letter', label: 'Sanction Letter & T&C', icon: <FileCheck size={20} />, roles: ['branch_manager'] },
  { path: '/attendance', label: 'Attendance, Leave & Exit', icon: <Clock size={20} />, roles: ['branch_manager'] },
  {
    path: '/reports',
    label: 'Reports',
    icon: <FileText size={20} />,
    roles: ['branch_manager'],
    subItems: [
      { path: '/reports/all', label: 'All Reports', roles: ['branch_manager'] },
      { path: '/reports/customer', label: 'Customer Report', roles: ['branch_manager'] },
      { path: '/reports/collection', label: 'Collection Report', roles: ['branch_manager'] },
      { path: '/reports/daily', label: 'Daily Report', roles: ['branch_manager'] },
      { path: '/reports/monthly', label: 'Monthly Report', roles: ['branch_manager'] },
      { path: '/reports/pending', label: 'Pending Report', roles: ['branch_manager'] },
      { path: '/reports/outstanding', label: 'Outstanding Report', roles: ['branch_manager'] },
      { path: '/reports/loan', label: 'Loan Report', roles: ['branch_manager'] },
      { path: '/reports/employee', label: 'Employee Report', roles: ['branch_manager'] },
      { path: '/reports/attendance', label: 'Attendance Report', roles: ['branch_manager'] },
      { path: '/reports/branch', label: 'Branch Report', roles: ['branch_manager'] },
    ],
  },
  { path: '/my-payslips', label: 'My Payslips', icon: <FileText size={20} />, roles: ['branch_manager'] },

  // ── CREDIT MANAGER EXCLUSIVE NAVIGATION ──
  { path: '/dashboard', label: 'Dashboard Overview', icon: <LayoutDashboard size={20} />, roles: ['credit_manager'] },
  {
    path: '/loans',
    label: 'Loans',
    icon: <Briefcase size={20} />,
    roles: ['credit_manager'],
    subItems: [
      { path: '/verification/approval', label: 'Group Loans', roles: ['credit_manager'] },
      { path: '/loans/gold', label: 'Gold Loans', roles: ['credit_manager'] },
      { path: '/loans/business', label: 'Business Loans', roles: ['credit_manager'] },
    ],
  },
  { path: '/fixed-deposits/referral', label: 'FD Lead Referral', icon: <Send size={20} />, roles: ['credit_manager'] },
  { path: '/verification/customer', label: 'Customer Verification', icon: <UserCheck size={20} />, roles: ['credit_manager'] },
  { path: '/verification/kyc', label: 'KYC Verification', icon: <ShieldCheck size={20} />, roles: ['credit_manager'] },
  { path: '/verification/docs', label: 'Document Verification', icon: <FileCheck size={20} />, roles: ['credit_manager'] },
  { path: '/verification/recommend', label: 'Loan Recommendation', icon: <CreditCard size={20} />, roles: ['credit_manager'] },
  { path: '/verification/approval', label: 'Customer Approval', icon: <CheckCircle2 size={20} />, roles: ['credit_manager'] },
  { path: '/sanction-letter', label: 'Sanction Letter & T&C', icon: <FileCheck size={20} />, roles: ['credit_manager'] },
  { path: '/attendance', label: 'Attendance, Leave & Exit', icon: <Clock size={20} />, roles: ['credit_manager'] },
  { path: '/my-payslips', label: 'My Payslips', icon: <FileText size={20} />, roles: ['credit_manager'] },

  // ── CUSTOMER RELATIONSHIP OFFICER (CRO) NAVIGATION ──
  { path: '/dashboard', label: 'Field Collection Workspace', icon: <LayoutDashboard size={20} />, roles: ['collection_agent'] },
  { path: '/fixed-deposits/referral', label: 'FD Lead Referral', icon: <Send size={20} />, roles: ['collection_agent'] },
  {
    path: '/loans',
    label: 'Loans',
    icon: <Briefcase size={20} />,
    roles: ['collection_agent'],
    subItems: [
      { path: '/loans/business', label: 'Business Loans', roles: ['collection_agent'] },
      { path: '/loans/gold', label: 'Gold Loans (Referral)', roles: ['collection_agent'] },
    ],
  },
  {
    path: '/client',
    label: 'Client Management',
    icon: <Grid size={20} />,
    roles: ['collection_agent'],
    subItems: [
      { path: '/client/enrollment', label: 'Customer Registration', roles: ['collection_agent'] },
      { path: '/client-search', label: 'Customer Search', roles: ['collection_agent'] },
    ]
  },
  {
    path: '/collections',
    label: 'Collections',
    icon: <Grid size={20} />,
    roles: ['collection_agent'],
    subItems: [
      { path: '/collections/weekly', label: 'Weekly Collection', roles: ['collection_agent'] },
      { path: '/collections/advance', label: 'Advance Collection', roles: ['collection_agent'] },
      { path: '/collections/pending', label: 'Pending Collection', roles: ['collection_agent'] },
      { path: '/collections/history', label: 'Collection History', roles: ['collection_agent'] },
      { path: '/collections/eod', label: 'End of Day (EOD) Settlement', roles: ['collection_agent'] },
    ],
  },
  { path: '/attendance', label: 'Attendance, Leave & Exit', icon: <Clock size={20} />, roles: ['collection_agent'] },
  { path: '/my-payslips', label: 'My Payslips', icon: <FileText size={20} />, roles: ['collection_agent'] },
];

// Module-level persistent scroll offset across menu open / close cycles
let savedSidebarScrollTop = 0;

export const Sidebar: React.FC = () => {
  const [expandedMenus, setExpandedMenus] = React.useState<Record<string, boolean>>({
    '/fixed-deposits': true,
    '/loans': true,
    '/branches': true,
    '/employees': true,
    '/admin/monitoring': true,
    '/reports': true,
    '/client': true,
    '/collections': true,
  });

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { isSidebarCollapsed, setSidebarCollapsed, isSidebarOpen, setSidebarOpen, isMobile } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();

  const userRole = (user?.customClaims?.role || 'admin') as UserRole;

  const displayRoleName = userRole === 'collection_agent'
    ? 'Customer Relationship Officer (CRO)'
    : (ROLE_LABELS[userRole] || userRole?.replace('_', ' ') || 'Credit Manager');

  const displayName = (() => {
    const raw = user?.displayName?.trim();
    if (!raw) {
      return displayRoleName;
    }
    if (raw.toLowerCase() === 'agent' || raw.toLowerCase() === 'collection agent') {
      return 'Customer Relationship Officer (CRO)';
    }
    return raw.replace(/collection\s*agent/gi, 'Customer Relationship Officer (CRO)').replace(/\bagent\b/gi, 'CRO');
  })();

  const isNameSameAsRole =
    displayName.toLowerCase().replace(/[^a-z]/g, '') ===
    displayRoleName.toLowerCase().replace(/[^a-z]/g, '');

  const branchLabel =
    user?.customClaims?.branchName ||
    (user?.customClaims?.branchId
      ? `Branch ${user.customClaims.branchId}`
      : userRole === 'admin' || userRole === 'hr_payroll_manager'
      ? 'Corporate HQ'
      : 'Main Branch - Anna Nagar');

  const profileSubtitle = isNameSameAsRole ? branchLabel : displayRoleName;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const filteredItems = navItems.filter((item) =>
    userRole && item.roles.includes(userRole)
  );

  const handleLinkClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Close on Escape key press (both mobile and desktop)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMobile && isSidebarOpen) {
          setSidebarOpen(false);
        } else if (!isMobile && !isSidebarCollapsed) {
          setSidebarCollapsed(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, isSidebarOpen, setSidebarOpen, isSidebarCollapsed, setSidebarCollapsed]);

  // Ref to the desktop sidebar container for detecting click outside
  const sidebarRef = React.useRef<HTMLElement | null>(null);

  // Desktop view: Close sidebar when clicking on empty space outside
  React.useEffect(() => {
    if (isMobile || isSidebarCollapsed) return;

    const handleDesktopClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Do nothing if click is inside the sidebar itself
      if (sidebarRef.current && sidebarRef.current.contains(target)) {
        return;
      }

      // Do nothing if click is on the sidebar toggle button
      if (target.closest('[data-sidebar-toggle="true"]')) {
        return;
      }

      // Click is on empty space / outside the sidebar -> close the menu
      setSidebarCollapsed(true);
    };

    document.addEventListener('mousedown', handleDesktopClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleDesktopClickOutside);
    };
  }, [isMobile, isSidebarCollapsed, setSidebarCollapsed]);

  // Ref to the navigation scroll container
  const navRef = React.useRef<HTMLElement | null>(null);

  // Instantly align nav container to the active element
  const scrollToActiveElement = React.useCallback((node: HTMLElement | null) => {
    if (!node) return;
    const activeEl = node.querySelector<HTMLElement>('[data-nav-active="true"]');
    if (activeEl) {
      const navRect = node.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      
      const currentScroll = node.scrollTop;
      const elOffsetFromNavTop = (elRect.top - navRect.top) + currentScroll;
      const navVisibleHeight = node.clientHeight || 500;
      const elHeight = elRect.height || 44;

      // Position active item right in the comfortable center reading area
      const targetScroll = Math.max(0, elOffsetFromNavTop - (navVisibleHeight / 2) + (elHeight / 2));
      
      node.scrollTop = targetScroll;
      savedSidebarScrollTop = targetScroll;
    } else if (savedSidebarScrollTop > 0) {
      node.scrollTop = savedSidebarScrollTop;
    }
  }, []);

  // Multi-frame alignment guarantee (Frame 0 instant + next frame + transition completion)
  const syncNavigationPosition = React.useCallback((node: HTMLElement | null) => {
    if (!node) return;
    scrollToActiveElement(node);
    requestAnimationFrame(() => scrollToActiveElement(node));
    setTimeout(() => scrollToActiveElement(node), 30);
    setTimeout(() => scrollToActiveElement(node), 100);
    setTimeout(() => scrollToActiveElement(node), 280);
  }, [scrollToActiveElement]);

  // Frame 0 instant position initialization on mount (runs before browser paint)
  const setNavRef = React.useCallback(
    (node: HTMLElement | null) => {
      navRef.current = node;
      if (node) {
        syncNavigationPosition(node);
      }
    },
    [syncNavigationPosition]
  );

  // Auto-expand parent menu of current active route so sub-item is rendered in DOM
  React.useEffect(() => {
    const parentItems = navItems.filter(item =>
      item.subItems?.some(sub => location.pathname === sub.path || location.pathname.startsWith(sub.path + '/'))
    );
    if (parentItems.length > 0) {
      setExpandedMenus(prev => {
        const next = { ...prev };
        parentItems.forEach(p => {
          next[p.path] = true;
        });
        return next;
      });
    }
  }, [location.pathname]);

  // Synchronously ensure menu opens directly at the active section (both Mobile drawer and Desktop sidebar)
  React.useLayoutEffect(() => {
    const isOpen = isMobile ? isSidebarOpen : !isSidebarCollapsed;
    if (isOpen && navRef.current) {
      syncNavigationPosition(navRef.current);
    }
  }, [isSidebarOpen, isSidebarCollapsed, isMobile, location.pathname, syncNavigationPosition]);

  // Check if a nav item or any of its sub-items is active
  const isItemActive = (item: NavItem): boolean => {
    if (location.pathname === item.path) return true;
    if (item.subItems) {
      return item.subItems.some(sub => location.pathname === sub.path || location.pathname.startsWith(sub.path + '/'));
    }
    // For items without sub-items, check prefix match (except parent-group paths)
    if (!item.subItems && item.path !== '/client' && item.path !== '/collections' && item.path !== '/reports' && item.path !== '/admin/monitoring') {
      return (location.pathname === item.path || location.pathname.startsWith(item.path + '/')) && item.path !== '/dashboard';
    }
    return false;
  };

  const sidebarInnerContent = (
    <>
      {/* Brand Logo Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#243B55]">
          <div className="flex items-center gap-3.5">
            <div className="w-[48px] h-[48px] rounded-[13px] p-[1.5px] bg-gradient-to-b from-[#F5D061] via-[#D4AF37] to-[#8C6808] flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(212,175,55,0.25)]">
              <div className="w-full h-full bg-white rounded-[11px] overflow-hidden flex items-center justify-center p-0.5">
                <img
                  src={goldenLeafLogo}
                  alt="Golden Leaf Logo"
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('pwa-512x512.png')) {
                      target.src = '/pwa-512x512.png';
                    } else if (!target.src.includes('logo-icon.png')) {
                      target.src = '/logo-icon.png';
                    } else if (!target.src.includes('favicon.png')) {
                      target.src = '/favicon.png';
                    }
                  }}
                />
              </div>
            </div>
            <AnimatePresence>
              {(!isSidebarCollapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <p className="text-[#FFFFFF] font-display text-[17px] font-semibold tracking-[0.05em] leading-none uppercase mb-1 pt-1">
                    GOLDEN LEAF
                  </p>
                  <p className="text-[#D4AF37] font-body text-[10px] font-bold tracking-[0.28em] uppercase pl-[1px] leading-none">
                    FINANCE
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Close button on mobile */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg text-[#8EA1B5] hover:text-white hover:bg-white/10 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav
          ref={setNavRef}
          onScroll={(e) => {
            const st = e.currentTarget.scrollTop;
            if (st > 0) {
              savedSidebarScrollTop = st;
            }
          }}
          className="flex-1 overflow-y-auto py-4 px-3 space-y-1 no-scrollbar overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {filteredItems.map((item) => {
            const isActive = isItemActive(item);
            const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
            const hasActiveSubItem = Boolean(
              item.subItems?.some(
                sub => location.pathname === sub.path || location.pathname.startsWith(sub.path + '/')
              )
            );
            const isExpanded = hasActiveSubItem || (expandedMenus[item.path] !== undefined ? expandedMenus[item.path] : isActive);

            return (
              <div key={item.path + item.label} className="flex flex-col">
                {hasSubItems ? (
                  <div
                    onClick={() => {
                      setExpandedMenus(prev => ({ ...prev, [item.path]: !prev[item.path] }));
                    }}
                    data-nav-active={isActive && !hasActiveSubItem ? "true" : undefined}
                    className={clsx(
                      'flex items-center justify-between gap-3 px-3 py-2.5 rounded-[10px] w-full text-left cursor-pointer min-h-[44px]',
                      'font-semibold text-sm font-body',
                      'transition-all duration-200 ease-out active:scale-[0.98]',
                      'group relative overflow-hidden',
                      isExpanded || isActive
                        ? 'text-[#FFFFFF] bg-[#C9A227]/15'
                        : 'text-[#D9E1EA] hover:bg-[#C9A227]/10 hover:text-[#FFFFFF]'
                    )}
                    title={isSidebarCollapsed && !isMobile ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={clsx("relative z-10 flex-shrink-0 transition-colors duration-200", (isExpanded || isActive) ? "text-[#D4AF37]" : "text-[#D9E1EA] group-hover:text-[#FFFFFF]")}>
                        {item.icon}
                      </span>
                      {(!isSidebarCollapsed || isMobile) && (
                        <span className="truncate relative z-10">
                          {item.label}
                        </span>
                      )}
                    </div>
                    {(!isSidebarCollapsed || isMobile) && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedMenus(prev => ({ ...prev, [item.path]: !prev[item.path] }));
                        }}
                        className="p-1 rounded hover:bg-white/10 text-[#D9E1EA] hover:text-white transition-colors cursor-pointer"
                        title="Toggle dropdown"
                      >
                        <ChevronDown size={16} className={clsx("transition-transform duration-200", isExpanded ? "rotate-180" : "")} />
                      </span>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to={item.path}
                    onClick={handleLinkClick}
                    data-nav-active={isActive ? "true" : undefined}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-[10px] min-h-[44px]',
                      'font-semibold text-sm font-body',
                      'transition-all duration-200 ease-out active:scale-[0.98]',
                      'group relative overflow-hidden',
                      isActive
                        ? 'bg-[#D4AF37] text-[#FFFFFF] shadow-sm font-bold'
                        : 'text-[#D9E1EA] hover:bg-[#C9A227]/10 hover:text-[#FFFFFF]'
                    )}
                    title={isSidebarCollapsed && !isMobile ? item.label : undefined}
                  >
                    <span className={clsx("relative z-10 flex-shrink-0 transition-colors duration-200", isActive ? "text-[#FFFFFF]" : "text-[#D9E1EA] group-hover:text-[#FFFFFF]")}>
                      {item.icon}
                    </span>
                    {(!isSidebarCollapsed || isMobile) && (
                      <span className="truncate relative z-10">
                        {item.label}
                      </span>
                    )}
                    {item.badge && (!isSidebarCollapsed || isMobile) && (
                      <span className="relative z-10 ml-auto px-2 py-0.5 rounded-full bg-status-error text-[#FFFFFF] text-[10px] font-bold shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                )}

                {/* SubItems with Smooth Spring Accordion */}
                <AnimatePresence initial={false}>
                  {hasSubItems && isExpanded && (!isSidebarCollapsed || isMobile) && (
                    <motion.div
                      initial={false}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden"
                    >
                      <div className="pl-9 pr-3 py-1.5 flex flex-col gap-1">
                        {item.subItems!.filter(sub => userRole && sub.roles.includes(userRole)).map(sub => {
                          const isSubActive = location.pathname === sub.path || location.pathname.startsWith(sub.path + '/');
                          return (
                            <NavLink
                              key={sub.path}
                              to={sub.path}
                              onClick={handleLinkClick}
                              data-nav-active={isSubActive ? "true" : undefined}
                              className={clsx(
                                'flex items-center justify-between px-2.5 py-2 rounded-md min-h-[40px]',
                                'font-medium text-[0.8rem] font-body transition-all duration-150 ease-out active:scale-[0.98]',
                                isSubActive
                                  ? 'text-[#60A5FA] bg-blue-500/20 font-bold border-l-2 border-[#3B82F6] pl-2.5 shadow-sm'
                                  : 'text-[#8EA1B5] hover:text-[#FFFFFF] hover:bg-[#243B55]/50'
                              )}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className={clsx("text-[0.75rem] font-bold transition-colors", isSubActive ? "text-[#60A5FA]" : "opacity-60")}>&gt;</span>
                                <span className="truncate">{sub.label}</span>
                              </div>
                            </NavLink>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Bottom section — User Profile & Sign Out (Executive Luxury SaaS) */}
        <div className="border-t border-[#1E3A5F]/50 p-2.5 sm:p-3 bg-gradient-to-b from-[#08172E] to-[#040C18] space-y-2">
          {/* Executive Profile Card */}
          <div className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-[#D4AF37]/35 transition-all duration-300 group relative">
            <div className="flex items-center gap-2.5 relative z-10">
              {/* Avatar with Metallic Gold Bevel Ring */}
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-br from-[#F5D061] via-[#D4AF37] to-[#8C6808] shadow-[0_2px_8px_rgba(212,175,55,0.25)]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#071326] flex items-center justify-center">
                    <Avatar
                      name={displayName}
                      src={user?.photoURL}
                      size="sm"
                    />
                  </div>
                </div>
                {/* Active Presence Indicator Dot */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#071326] shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              </div>

              {(!isSidebarCollapsed || isMobile) && (
                <div className="flex-1 min-w-0 pr-1">
                  <p
                    className="text-white text-[13px] font-bold truncate tracking-tight font-sans group-hover:text-[#F5D061] transition-colors leading-snug"
                    title={displayName}
                  >
                    {displayName}
                  </p>
                  <p
                    className="text-[11px] font-medium text-slate-400 group-hover:text-slate-300 truncate font-sans leading-tight mt-0.5 flex items-center gap-1"
                    title={profileSubtitle}
                  >
                    {isNameSameAsRole ? (
                      <Building2 size={11} className="text-[#D4AF37] shrink-0" />
                    ) : null}
                    <span className="truncate">{profileSubtitle}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Clean Executive Sign Out Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-rose-500/15 text-slate-300 hover:text-rose-300 text-xs font-semibold font-sans border border-white/[0.06] hover:border-rose-500/30 transition-all duration-200 cursor-pointer group shadow-2xs active:scale-[0.99]"
          >
            <LogOut size={13} className="text-slate-400 group-hover:text-rose-400 group-hover:-translate-x-0.5 transition-all" />
            {(!isSidebarCollapsed || isMobile) && (
              <span className="tracking-wide">Sign out</span>
            )}
          </button>
        </div>
    </>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Mobile Backdrop Overlay */}
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] lg:hidden"
            />
            {/* Mobile Slide-in Drawer */}
            <motion.aside
              key="sidebar-mobile-drawer"
              role="navigation"
              aria-label="Mobile Navigation"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.28 }}
              className="fixed left-0 top-0 h-[100dvh] bg-[#0B1F3A] flex flex-col shadow-sidebar overflow-hidden z-[70] w-[280px] max-w-[85vw]"
            >
              <div className="w-[280px] max-w-[85vw] h-full flex flex-col shrink-0 overflow-hidden">
                {sidebarInnerContent}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop Responsive Sidebar
  return (
    <motion.aside
      ref={sidebarRef}
      role="navigation"
      aria-label="Desktop Navigation"
      aria-hidden={isSidebarCollapsed}
      animate={{ width: isSidebarCollapsed ? 0 : 260 }}
      transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
      className={clsx(
        "fixed left-0 top-0 h-[100dvh] bg-[#0B1F3A] flex flex-col shadow-sidebar overflow-hidden z-40",
        isSidebarCollapsed ? "w-0 pointer-events-none" : "w-[260px]"
      )}
    >
      <div className="w-[260px] h-full flex flex-col shrink-0 overflow-hidden">
        {sidebarInnerContent}
      </div>
    </motion.aside>
  );
};

export default Sidebar;
