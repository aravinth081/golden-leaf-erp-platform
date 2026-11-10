// ──────────────────────────────────────────────────
// Golden Leaf Finance — Page Header Component
// Bespoke Fintech Header with Breadcrumbs, Badges, and Action Bar
// ──────────────────────────────────────────────────

import React from 'react';
import { clsx } from 'clsx';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  badge?: string;
  badgePosition?: 'inline' | 'below';
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  badgePosition = 'inline',
  breadcrumbs,
  actions,
  className,
}) => {
  return (
    <div className={clsx('mb-6', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 mb-2.5 flex-wrap" aria-label="Breadcrumb">
          <a
            href="/dashboard"
            className="text-slate-400 hover:text-[#D4AF37] transition-colors p-1 rounded-md hover:bg-slate-100"
            title="Dashboard"
          >
            <Home size={13} />
          </a>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              <ChevronRight size={12} className="text-slate-300" />
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="text-xs font-semibold text-slate-500 hover:text-[#0B1F3A] transition-colors font-body px-1.5 py-0.5 rounded hover:bg-slate-100"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-xs font-bold text-[#0B1F3A] font-body px-1.5 py-0.5 bg-slate-100/80 rounded-md">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] font-display tracking-tight leading-tight">
              {title}
            </h1>
            {badge && badgePosition === 'inline' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D4AF37]/15 text-[#9A7209] border border-[#D4AF37]/30">
                {badge}
              </span>
            )}
          </div>
          {(subtitle || (badge && badgePosition === 'below')) && (
            <div className="mt-1.5 flex items-center gap-2.5 flex-wrap">
              {badge && badgePosition === 'below' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D4AF37]/15 text-[#9A7209] border border-[#D4AF37]/30 shadow-2xs">
                  {badge}
                </span>
              )}
              {badge && badgePosition === 'below' && subtitle && (
                <span className="text-slate-300 hidden sm:inline">•</span>
              )}
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-500 font-body font-normal max-w-3xl leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
