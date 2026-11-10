// ──────────────────────────────────────────────────
// Golden Leaf Finance — Instant Customer Search Engine
// Sub-Second Lookup (Mobile No. or Customer Name)
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { Search, UserCheck, ShieldCheck, ArrowRight, PlusCircle, X, Phone, Building } from 'lucide-react';
import type { Investor } from '../../../types/investor.types';
import { searchInvestorsLocally } from '../../../services/investorService';
import { formatINR } from '../../../utils/fdCalculations';
import { useAuthStore } from '../../../store';

interface InstantCustomerSearchProps {
  onSelectInvestor?: (investor: Investor) => void;
  onBookNewFD?: (investor: Investor) => void;
  placeholder?: string;
}

export const InstantCustomerSearch: React.FC<InstantCustomerSearchProps> = ({
  onSelectInvestor,
  onBookNewFD,
  placeholder,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Investor[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((s) => s.user);
  const role = user?.customClaims?.role || 'admin';
  const branchId = role === 'branch_manager' ? user?.customClaims?.branchId : undefined;
  const isAdmin = role === 'admin' || role === 'area_manager';

  // Instant sub-second search (debounced slightly to prevent render thrashing)
  useEffect(() => {
    const q = query.trim();
    if (q.length >= 2) {
      const matches = searchInvestorsLocally(q, branchId);
      setResults(matches);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query, branchId]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (inv: Investor) => {
    setIsOpen(false);
    onSelectInvestor?.(inv);
  };

  const handleBook = (e: React.MouseEvent, inv: Investor) => {
    e.stopPropagation();
    setIsOpen(false);
    onBookNewFD?.(inv);
  };

  return (
    <div ref={containerRef} className="relative w-full mb-6 z-30">
      {/* Search Input Bar */}
      <div className="relative flex items-center bg-white rounded-2xl border-2 border-[#D4AF37]/50 shadow-sm focus-within:border-[#D4AF37] focus-within:shadow-[0_0_0_4px_rgba(212,175,55,0.15)] transition-all">
        <div className="pl-4 pr-2 text-[#D4AF37] flex items-center justify-center">
          <Search size={20} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            placeholder ||
            '🔍 Quick Search: Enter 10-Digit Customer Mobile No. OR Customer Name...'
          }
          className="w-full py-3.5 pr-10 text-sm font-medium text-[#0B1F3A] placeholder-[#94A3B8] bg-transparent outline-none"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 p-1 rounded-full hover:bg-[#F1F5F9] text-[#64748B] transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Instant Dropdown Preview */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl overflow-hidden max-h-[460px] overflow-y-auto z-50">
          <div className="px-4 py-2.5 bg-[#FAF7F0] border-b border-[#E2E8F0] flex items-center justify-between text-xs">
            <span className="font-bold text-[#8C6808] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              Live Auto-Suggest Match Preview ({results.length} found)
            </span>
            <span className="text-[11px] font-semibold text-[#64748B]">
              {isAdmin ? 'Company-Wide Directory' : 'Branch Records Isolated'}
            </span>
          </div>

          {results.length > 0 ? (
            <div className="divide-y divide-[#F1F5F9]">
              {results.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => handleSelect(inv)}
                  className="p-4 hover:bg-[#FFFDF7] transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B1F3A] to-[#1E3A8A] text-[#D4AF37] font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                      {inv.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-[#0B1F3A] group-hover:text-[#D4AF37] transition-colors">
                          {inv.fullName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F1F5F9] text-[#475569]">
                          {inv.investorId}
                        </span>
                        {inv.kycStatus === 'Verified' && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                            <ShieldCheck size={11} /> KYC VERIFIED
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[#64748B]">
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-[#94A3B8]" />
                          <strong className="text-[#334155]">{inv.primaryMobile}</strong>
                        </span>
                        <span>·</span>
                        <span>PAN: <strong className="font-mono text-[#334155]">{inv.pan}</strong></span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Building size={12} className="text-[#94A3B8]" />
                          {inv.branchName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio & Actions */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9]">
                    <div className="text-left sm:text-right">
                      <div className="text-xs font-semibold text-[#0B1F3A]">
                        Active FDs: <span className="text-[#059669] font-bold">{inv.activeFDsCount}</span>
                      </div>
                      <div className="text-[11px] font-bold text-[#D4AF37]">
                        {formatINR(inv.totalPrincipal)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSelect(inv)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0] transition-colors whitespace-nowrap"
                      >
                        View Portfolio
                      </button>
                      <button
                        onClick={(e) => handleBook(e, inv)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#D4AF37] hover:bg-[#C9A227] text-white shadow-sm transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <PlusCircle size={13} />
                        + Book New FD
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm font-semibold text-[#64748B]">
                No customer matching "<span className="text-[#0B1F3A]">{query}</span>"
              </p>
              <p className="text-xs text-[#94A3B8] mt-1">
                Please verify the 10-digit mobile number or customer name spelling.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
