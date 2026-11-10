// ──────────────────────────────────────────────────
// Golden Leaf Finance — Premium Top Bar & User Menu
// Header with search, notifications, branch context & executive user profile menu
// ──────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Menu, LogOut, ChevronDown, ChevronRight,
  Shield, User, Key, CheckCircle2, FileText, DollarSign,
  Building2, Clock, UserCog, Calendar
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../../store';
import { Avatar } from '../ui/Avatar';
import { ROLE_LABELS } from '../../types';

export const TopBar: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { isSidebarCollapsed, setSidebarCollapsed, isSidebarOpen, setSidebarOpen, isMobile } = useUIStore();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Live IST Financial Date & Clock for Employee Workstation
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const dateStr = now.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      setCurrentTime(`${timeStr} • ${dateStr}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleName = user?.customClaims?.role
    ? ROLE_LABELS[user.customClaims.role]
    : 'Credit Manager';

  const displayName = (() => {
    const raw = user?.displayName?.trim();
    if (!raw) {
      return roleName;
    }
    if (raw.toLowerCase() === 'agent' || raw.toLowerCase() === 'collection agent') {
      return 'Customer Relationship Officer (CRO)';
    }
    return raw.replace(/collection\s*agent/gi, 'Customer Relationship Officer (CRO)').replace(/\bagent\b/gi, 'CRO');
  })();

  const isNameSameAsRole =
    displayName.toLowerCase().replace(/[^a-z]/g, '') ===
    roleName.toLowerCase().replace(/[^a-z]/g, '');

  const branchLabel =
    user?.customClaims?.branchName ||
    (user?.customClaims?.branchId
      ? `Branch ${user.customClaims.branchId}`
      : user?.customClaims?.role === 'admin' || user?.customClaims?.role === 'hr_payroll_manager'
      ? 'Corporate HQ'
      : 'Main Branch - Anna Nagar');

  const topBarSubtitle = isNameSameAsRole ? branchLabel : roleName;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-[0_1px_4px_rgba(11,31,58,0.03)] font-sans">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Left section: Hamburger toggle & Mobile Logo & Global Search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            data-sidebar-toggle="true"
            onClick={() => {
              if (isMobile) {
                setSidebarOpen(!isSidebarOpen);
              } else {
                setSidebarCollapsed(!isSidebarCollapsed);
              }
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-[#0B1F3A] hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>

          {/* Mobile Logo Brand Header */}
          <div className="flex items-center gap-2 lg:hidden pl-0.5">
            <div className="w-[36px] h-[36px] p-[1.5px] rounded-[10px] bg-gradient-to-b from-[#F5D061] via-[#D4AF37] to-[#8C6808] flex-shrink-0 shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[8px] overflow-hidden flex items-center justify-center">
                <img
                  src="/logo-icon.png"
                  alt="Golden Leaf"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-xs tracking-[0.06em] text-[#0B1F3A]">GOLDEN LEAF</span>
              <span className="font-body font-bold text-[8px] tracking-[0.22em] text-[#D4AF37]">FINANCE</span>
            </div>
          </div>

          {/* Search bar */}
          {!isMobile && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const query = (form.elements.namedItem('search') as HTMLInputElement)?.value;
                if (query?.trim()) {
                  navigate(`/customer/list?q=${encodeURIComponent(query.trim())}`);
                }
              }}
              className="w-full max-w-md hidden md:block"
            >
              <div className="relative group">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0B1F3A] transition-colors" />
                <input
                  name="search"
                  type="text"
                  aria-label="Search platform records"
                  placeholder="Search customers, loans, branches..."
                  className="w-full pl-10 pr-12 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[#0B1F3A] placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/15 focus:bg-white transition-all min-h-[40px] shadow-xs"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] text-slate-400 font-sans shadow-2xs">
                  ⌘K
                </kbd>
              </div>
            </form>
          )}
        </div>

        {/* Right section: System Status & User Profile Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Operational Branch Context Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-semibold text-[#0B1F3A]">
            <Building2 size={13} className="text-[#D4AF37]" />
            <span className="truncate max-w-[190px]">
              {user?.customClaims?.branchName ||
                (user?.customClaims?.branchId ? `Branch ${user.customClaims.branchId}` : 'Corporate HQ (All Branches)')}
            </span>
          </div>

          {/* Live Financial Clock (IST) */}
          {currentTime && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-mono font-medium text-slate-600">
              <Clock size={13} className="text-slate-400" />
              <span>{currentTime}</span>
            </div>
          )}

          {/* Duty / Attendance Status Badge (Staff Only — Admin is exempt) */}
          {user?.customClaims?.role !== 'admin' && (
            <Link
              to="/attendance"
              title="View Timesheet & Shift Log"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold text-emerald-800 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Shift Active</span>
            </Link>
          )}

          {/* Executive User Profile Trigger */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-expanded={showProfileMenu}
              aria-haspopup="true"
              aria-label="User profile and settings menu"
              className="flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-[#D4AF37]/60 transition-all duration-200 min-h-[44px] cursor-pointer shadow-xs hover:shadow-sm group"
            >
              {/* Avatar with Gold Border Ring */}
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-br from-[#F5D061] via-[#D4AF37] to-[#8C6808] shadow-xs">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#0B1F3A] flex items-center justify-center">
                    <Avatar
                      name={displayName}
                      src={user?.photoURL}
                      size="sm"
                    />
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              {/* User Label Info */}
              <div className="hidden sm:flex flex-col text-left justify-center min-w-0 max-w-[170px]">
                <span className="text-xs font-bold text-[#0B1F3A] group-hover:text-blue-900 transition-colors leading-tight truncate" title={displayName}>
                  {displayName}
                </span>
                <span className="text-[10.5px] font-semibold text-slate-500 leading-none mt-0.5 truncate flex items-center gap-1" title={topBarSubtitle}>
                  {isNameSameAsRole && <Building2 size={10} className="text-[#D4AF37] shrink-0" />}
                  <span className="truncate">{topBarSubtitle}</span>
                </span>
              </div>

              <ChevronDown
                size={14}
                className={`hidden sm:block text-slate-400 group-hover:text-[#0B1F3A] transition-transform duration-200 ${
                  showProfileMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-[3.35rem] w-[min(calc(100vw-24px),19.5rem)] bg-white rounded-2xl shadow-[0_12px_40px_rgba(11,31,58,0.14)] border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 p-2.5">
                {/* Header User Card inside Dropdown */}
                <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/70">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-br from-[#F5D061] via-[#D4AF37] to-[#8C6808] shadow-xs">
                        <div className="w-full h-full rounded-full overflow-hidden bg-[#0B1F3A] flex items-center justify-center">
                          <Avatar
                            name={displayName}
                            src={user?.photoURL}
                            size="md"
                          />
                        </div>
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white shadow-2xs" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-[#0B1F3A] truncate font-sans" title={displayName}>
                          {displayName}
                        </p>
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-extrabold flex items-center gap-0.5 shrink-0">
                          <CheckCircle2 size={9} /> Verified
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate font-sans mt-0.5" title={user?.email || 'staff@goldenleaf.finance'}>
                        {user?.email || 'staff@goldenleaf.finance'}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-600 truncate" title={branchLabel}>
                        <Building2 size={11} className="text-[#D4AF37] shrink-0" />
                        <span className="truncate">
                          {branchLabel}
                          {!isNameSameAsRole ? ` • ${roleName}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Operational Links */}
                <div className="mt-2 pt-2 border-t border-slate-100 space-y-0.5">
                  {user?.customClaims?.role !== 'admin' && (
                    <Link
                      to="/attendance"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:text-[#0B1F3A] hover:bg-slate-100 transition-colors"
                    >
                      <Clock size={14} className="text-slate-500" />
                      <span>My Duty Timesheet & GPS</span>
                    </Link>
                  )}

                  {user?.customClaims?.role === 'admin' ? (
                    <>
                      <Link
                        to="/admin/staff-profiles"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:text-[#0B1F3A] hover:bg-slate-100 transition-colors"
                      >
                        <UserCog size={14} className="text-[#0B1F3A]" />
                        <span>Staff Profile Management</span>
                      </Link>
                      <Link
                        to="/admin/compensation"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:text-[#0B1F3A] hover:bg-slate-100 transition-colors"
                      >
                        <DollarSign size={14} className="text-[#D4AF37]" />
                        <span>Fix Role & Staff Pay</span>
                      </Link>
                    </>
                  ) : (
                    <Link
                      to="/my-payslips"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:text-[#0B1F3A] hover:bg-slate-100 transition-colors"
                    >
                      <FileText size={14} className="text-[#D4AF37]" />
                      <span>My Payslips & Downloads</span>
                    </Link>
                  )}
                </div>

                {/* Direct Sign Out Button */}
                <div className="mt-2.5 pt-2 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200/70 hover:border-rose-200 transition-all duration-200 cursor-pointer group active:scale-[0.99]"
                  >
                    <LogOut size={13} className="text-slate-400 group-hover:text-rose-500 group-hover:-translate-x-0.5 transition-all" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
