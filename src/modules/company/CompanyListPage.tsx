// ──────────────────────────────────────────────────
// Golden Leaf Finance — Admin Company Management
// Strict PDF-based implementation: Clean Admin-level company administration
// ──────────────────────────────────────────────────

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Settings, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { PageHeader } from '../../components/ui';

export const CompanyListPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 font-sans max-w-7xl mx-auto w-full"
    >
      {/* ── Page Header: Strict PDF-compliant title & description ── */}
      <PageHeader
        title="Company Management"
        subtitle="Manage company-level administration."
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard' },
          { label: 'Company Management' },
        ]}
      />

      {/* ── Company Management Admin Overview Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Main Administration Card (2 columns on lg) */}
        <div className="lg:col-span-2 bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04)] overflow-hidden flex flex-col justify-between">
          {/* Top Navy Header */}
          <div className="bg-[#0B1F3A] px-6 py-4 flex items-center justify-between border-b border-white/10 min-h-[58px]">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-[#D4AF37] rounded-full" />
              <h2 className="text-sm font-bold text-[#FFFFFF] tracking-wider uppercase font-sans">
                Company Administration
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-sans">
              Admin Section
            </span>
          </div>

          <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#0B1F3A]/5 border border-[#E2E8F0] flex items-center justify-center text-[#0B1F3A]">
                <Building2 size={24} className="text-[#0B1F3A]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#0B1F3A] font-sans">
                  Company-Level Administration Overview
                </h3>
                <p className="text-sm text-[#64748B] font-sans leading-relaxed">
                  Company Management is an Admin-level section in the Golden Leaf Finance system. Institutional settings and company profile configurations are managed centrally under Settings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E2E8F0]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <ShieldCheck size={16} className="text-[#16A37A]" />
                    <span className="text-xs font-bold text-[#0B1F3A] font-sans uppercase tracking-wider">
                      Role Access
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] font-sans leading-relaxed">
                    Exclusive to System Administrators. Branch managers and staff operate within their designated branch scope.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E2E8F0]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileText size={16} className="text-[#D4AF37]" />
                    <span className="text-xs font-bold text-[#0B1F3A] font-sans uppercase tracking-wider">
                      Central Architecture
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] font-sans leading-relaxed">
                    Operates in strict alignment with the Finance Collection &amp; Loan Management System specifications.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[#64748B] font-medium font-sans">
                For company profile and institutional configuration:
              </span>
              <button
                type="button"
                onClick={() => navigate('/settings?tab=general')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132F58] text-[#FFFFFF] text-xs font-bold transition-all shadow-sm cursor-pointer font-sans"
              >
                <span>Open Company Profile</span>
                <ArrowRight size={14} className="text-[#D4AF37]" />
              </button>
            </div>
          </div>
        </div>

        {/* Company Profile Settings Link Card (1 column on lg) */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04)] overflow-hidden flex flex-col justify-between">
          <div className="bg-[#0B1F3A] px-6 py-4 flex items-center justify-between border-b border-white/10 min-h-[58px]">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-[#D4AF37] rounded-full" />
              <h2 className="text-sm font-bold text-[#FFFFFF] tracking-wider uppercase font-sans">
                Company Profile
              </h2>
            </div>
            <Settings size={16} className="text-[#D4AF37]" />
          </div>

          <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <h4 className="text-base font-bold text-[#0B1F3A] font-sans">
                Settings &rarr; Company Profile
              </h4>
              <p className="text-xs sm:text-sm text-[#64748B] font-sans leading-relaxed">
                Manage company profile settings from Settings. Company profile configuration belongs under the Settings module according to system requirements.
              </p>

              <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E2E8F0] space-y-2.5">
                <div className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider font-sans">
                  Available in Settings
                </div>
                <ul className="text-xs text-[#64748B] space-y-2 font-sans">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
                    <span>Company Profile</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
                    <span>Loan Plans</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
                    <span>Branch Settings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
                    <span>Employee Roles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
                    <span>System Preferences</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => navigate('/settings?tab=general')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#B8860B] hover:to-[#D4AF37] text-[#FFFFFF] text-xs font-bold transition-all shadow-sm cursor-pointer font-sans"
              >
                <span>Open Company Profile</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CompanyListPage;
