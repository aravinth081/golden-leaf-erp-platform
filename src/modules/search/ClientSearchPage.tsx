// ──────────────────────────────────────────────────
// Golden Leaf Finance — Customer Relationship Officer (CRO): Customer Search
// Strictly aligned with Finance Collection & Loan Management System PDF
// Single source of truth customer directory search
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  RotateCcw,
  User,
  Phone,
  MapPin,
  Building2,
  Users,
  ChevronRight,
  Loader2,
  AlertCircle,
  SearchX,
  X,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { getMonitoredCustomers, type MonitoredCustomer } from '../../services/monitoringDataService';
import { queryDocuments } from '../../services/firestore';
import type { Customer } from '../../types';

export interface SearchCustomerRecord {
  id: string;
  name: string;
  phone: string;
  branchId: string;
  branchName: string;
  centerName: string;
  groupName: string;
  address: string;
  city: string;
  status: 'Active' | 'Inactive';
}

const ClientSearchPage: React.FC = () => {
  const navigate = useNavigate();

  // Search form state
  const [searchValue, setSearchValue] = useState('');
  const [validationError, setValidationError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoadError, setDataLoadError] = useState(false);

  // Customer repository & results state
  const [allCustomers, setAllCustomers] = useState<SearchCustomerRecord[]>([]);
  const [results, setResults] = useState<SearchCustomerRecord[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── 1. LOAD CUSTOMERS FROM AUTHORITATIVE SYSTEM SOURCES ──
  const loadCustomerDirectory = async () => {
    setDataLoadError(false);
    try {
      // 1. Central master repository (Monitored customers + Seed data)
      const monitored = getMonitoredCustomers(null);

      // 2. Enrolled clients from local registration cache
      let enrolledList: any[] = [];
      try {
        const rawEnrolled = localStorage.getItem('glf_registered_customers_master') || localStorage.getItem('glf_customers_cache');
        if (rawEnrolled) {
          const parsed = JSON.parse(rawEnrolled);
          if (Array.isArray(parsed)) enrolledList = parsed;
        }
      } catch (err) {
        console.warn('Unable to parse local enrolled clients cache', err);
      }

      // 3. Firestore customers collection (online fallback)
      let firestoreList: Customer[] = [];
      try {
        firestoreList = await queryDocuments<Customer>('customers', {});
      } catch (err) {
        // Safe offline/demo handling
      }

      // Consolidate into a unified deduplicated customer map
      const customerMap = new Map<string, SearchCustomerRecord>();

      // Populate from monitored records first
      for (const c of monitored) {
        if (!c.id) continue;
        customerMap.set(c.id, {
          id: c.id,
          name: c.name || 'Unknown Customer',
          phone: c.phone || 'N/A',
          branchId: c.branchId || 'BR-01',
          branchName: c.branchName || 'Main Branch - Anna Nagar',
          centerName: c.centerName || 'Center 01 - Anna Nagar East',
          groupName: c.groupName || 'Malar Magalir Sangam',
          address: c.address || '',
          city: c.city || 'Chennai',
          status: c.status === 'Active' ? 'Active' : 'Inactive',
        });
      }

      // Overlay newly enrolled clients
      for (const c of enrolledList) {
        if (!c.id) continue;
        if (!customerMap.has(c.id)) {
          const rawStatus = String(c.status || '').toLowerCase();
          customerMap.set(c.id, {
            id: c.id,
            name: c.name || 'Unknown Customer',
            phone: c.phone || 'N/A',
            branchId: c.branchId || 'BR-01',
            branchName: c.branchName || 'Main Branch',
            centerName: c.center || c.centerName || 'Center',
            groupName: c.group || c.groupName || 'Unassigned Group',
            address: c.address || '',
            city: c.city || 'Chennai',
            status: rawStatus === 'active' ? 'Active' : 'Inactive',
          });
        }
      }

      // Overlay Firestore customers if missing
      for (const c of firestoreList) {
        if (!c.id) continue;
        if (!customerMap.has(c.id)) {
          const rawStatus = String(c.status || '').toLowerCase();
          customerMap.set(c.id, {
            id: c.id,
            name: c.name || 'Unknown Customer',
            phone: c.phone || 'N/A',
            branchId: c.branchId || 'BR-01',
            branchName: c.branchId || 'Main Branch',
            centerName: 'Center 01',
            groupName: 'General Group',
            address: c.address || '',
            city: c.city || 'Chennai',
            status: rawStatus === 'active' ? 'Active' : 'Inactive',
          });
        }
      }

      const unifiedList = Array.from(customerMap.values());
      setAllCustomers(unifiedList);
    } catch (error) {
      console.error('Failed to load customer records:', error);
      setDataLoadError(true);
    }
  };

  useEffect(() => {
    loadCustomerDirectory();

    // Listen to updates from Customer Registration
    const handleUpdate = () => {
      loadCustomerDirectory();
    };
    window.addEventListener('glf-customers-updated', handleUpdate);
    return () => {
      window.removeEventListener('glf-customers-updated', handleUpdate);
    };
  }, []);

  // ── 2. SEARCH EXECUTION LOGIC ──
  const handleSearch = () => {
    const rawQuery = searchValue.trim();

    // Section 18: Empty input validation
    if (!rawQuery) {
      setValidationError('Enter a customer name, customer ID, or mobile number.');
      searchInputRef.current?.focus();
      return;
    }

    setValidationError('');
    setLoading(true);

    try {
      // Section 15: Search query normalization
      const queryLower = rawQuery.toLowerCase();
      const queryDigits = rawQuery.replace(/\D/g, '');

      // Section 6: Match customer records based on primary PDF identifiers
      const filtered = allCustomers.filter((customer) => {
        // 1. Customer Name match (case-insensitive, partial-match friendly)
        const nameMatch = customer.name.toLowerCase().includes(queryLower);

        // 2. Customer ID match (case-insensitive, exact or partial)
        const idMatch = customer.id.toLowerCase().includes(queryLower);

        // 3. Mobile Number match (digit-friendly normalization)
        let phoneMatch = false;
        if (queryDigits.length >= 2) {
          const cleanPhoneDigits = customer.phone.replace(/\D/g, '');
          phoneMatch = cleanPhoneDigits.includes(queryDigits);
        } else {
          phoneMatch = customer.phone.toLowerCase().includes(queryLower);
        }

        return nameMatch || idMatch || phoneMatch;
      });

      setResults(filtered);
      setHasSearched(true);
    } catch (err) {
      console.error('Search execution error:', err);
      setResults([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  // ── 3. RESET LOGIC ──
  // Section 16: Reset button clears input, active search state, and filtered results without full page reload
  const handleReset = () => {
    setSearchValue('');
    setValidationError('');
    setResults([]);
    setHasSearched(false);
    searchInputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    if (validationError) {
      setValidationError('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleClearInput = () => {
    setSearchValue('');
    setValidationError('');
    searchInputRef.current?.focus();
  };

  const handleNavigateToCustomer = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full w-full min-w-0 max-w-full pb-16 font-body"
    >
      {/* ── SEARCH CARD SECTION (Preserves existing layout & theme) ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-[0_2px_10px_rgba(11,31,58,0.04)] overflow-hidden mb-6 sm:mb-8 flex-shrink-0"
      >
        {/* Section Header: Dark Navy with Gold Accent */}
        <div className="bg-[#0B1F3A] px-4 sm:px-8 py-4 border-b border-[#E5E7EB]/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-[#D4AF37] rounded-full shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-[#FFFFFF] tracking-wide uppercase">
                Customer Search
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Find a registered customer by name, customer ID or mobile number.
              </p>
            </div>
          </div>
        </div>

        {/* Section Body: Unified Search Interface */}
        <div className="p-4 sm:p-6 md:p-8">
          <label
            htmlFor="customer-search-input"
            className="block text-xs font-bold text-[#0B1F3A] tracking-wider uppercase mb-2"
          >
            Search Customer
          </label>

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 sm:gap-4">
            {/* Search Input with in-field icon */}
            <div className="relative flex-1">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
                <Search size={18} />
              </div>
              <input
                ref={searchInputRef}
                id="customer-search-input"
                type="text"
                value={searchValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Search by customer name, customer ID or mobile number..."
                className={`w-full pl-10 pr-10 py-3 sm:py-3.5 rounded-[10px] bg-[#FFFFFF] border text-[#0B1F3A] placeholder:text-[#94A3B8] font-body text-xs sm:text-sm transition-all duration-200 focus:outline-none shadow-sm ${validationError
                    ? 'border-[#DC2626] ring-1 ring-[#DC2626] focus:border-[#DC2626]'
                    : 'border-[#E2E8F0] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] hover:border-[#D4AF37]/60'
                  }`}
                aria-label="Search customer by name, customer ID, or mobile number"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={handleClearInput}
                  aria-label="Clear search input"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-[#0B1F3A] transition-colors rounded-full"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Action Buttons: Search and Reset */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                id="customer-search-btn"
                onClick={handleSearch}
                disabled={loading}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-7 py-3 sm:py-3.5 rounded-[10px] bg-[#D4AF37] text-[#FFFFFF] font-semibold text-xs sm:text-sm transition-all duration-200 hover:bg-[#C9A227] min-w-[130px] min-h-[44px] shadow-sm hover:shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed touch-target"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                <span>{loading ? 'Searching...' : 'Search'}</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                id="customer-reset-btn"
                onClick={handleReset}
                disabled={loading}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 rounded-[10px] bg-[#F8F9FA] text-[#0B1F3A] font-semibold text-xs sm:text-sm border border-[#E2E8F0] hover:bg-[#E5E7EB]/60 transition-all duration-200 min-w-[110px] min-h-[44px] cursor-pointer touch-target"
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </motion.button>
            </div>
          </div>

          {/* Section 18: Inline Empty Input Validation Message */}
          {validationError && (
            <div className="flex items-center gap-1.5 mt-2.5 text-xs text-[#DC2626] font-medium animate-fadeIn">
              <AlertCircle size={14} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── ERROR STATE (Section 28: Data Load Failure) ── */}
      {dataLoadError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#FFFFFF] rounded-2xl border border-[#FCA5A5] p-8 sm:p-12 text-center flex flex-col items-center justify-center shadow-[0_2px_10px_rgba(11,31,58,0.02)] mb-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center mb-4 text-[#DC2626]">
            <AlertCircle size={30} />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#0B1F3A] mb-1.5">
            Unable to load customer records.
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-md leading-relaxed mb-6">
            There was a problem retrieving customer records from the system. Please try again.
          </p>
          <button
            type="button"
            onClick={loadCustomerDirectory}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[10px] bg-[#D4AF37] text-white text-xs sm:text-sm font-semibold hover:bg-[#C9A227] transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw size={15} />
            <span>Try Again</span>
          </button>
        </motion.div>
      )}

      {/* ── STATE 1: INITIAL EMPTY SEARCH STATE (Section 8) ── */}
      {!hasSearched && !dataLoadError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] p-8 sm:p-14 text-center flex flex-col items-center justify-center shadow-[0_2px_10px_rgba(11,31,58,0.02)]"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#0B1F3A]/5 border border-[#D4AF37]/30 flex items-center justify-center mb-4 text-[#D4AF37]">
            <Users size={32} />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#0B1F3A] mb-1.5">
            Search for a customer
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-md leading-relaxed">
            Enter a customer name, customer ID, or mobile number to view matching customer records.
          </p>
        </motion.div>
      )}

      {/* ── STATE 2: NO RESULTS FOUND (Section 9) ── */}
      {hasSearched && !dataLoadError && results.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] p-8 sm:p-14 text-center flex flex-col items-center justify-center shadow-[0_2px_10px_rgba(11,31,58,0.02)]"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center mb-4 text-[#DC2626]">
            <SearchX size={32} />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#0B1F3A] mb-1.5">
            No customers found
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-md leading-relaxed mb-6">
            Try checking the customer name, customer ID, or mobile number.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[10px] bg-[#0B1F3A] text-white text-xs sm:text-sm font-semibold hover:bg-[#15345e] transition-colors cursor-pointer shadow-sm"
          >
            <RotateCcw size={15} />
            <span>Clear Search</span>
          </button>
        </motion.div>
      )}

      {/* ── STATE 3: SEARCH RESULTS (Section 10 & 19) ── */}
      {hasSearched && !dataLoadError && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-[0_2px_10px_rgba(11,31,58,0.04)] overflow-hidden flex flex-col"
        >
          {/* Results Header with Dynamic Count (Section 19: Result Count) */}
          <div className="bg-[#0B1F3A] px-4 sm:px-8 py-4 border-b border-[#E5E7EB]/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-4 bg-[#D4AF37] rounded-full shrink-0" />
              <h2 className="text-sm font-semibold text-[#FFFFFF] tracking-wide uppercase">
                Search Results
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#D4AF37] px-3 py-1 bg-[#FFFFFF]/10 rounded-full border border-white/10">
              {results.length} {results.length === 1 ? 'customer' : 'customers'} found
            </span>
          </div>

          {/* ── DESKTOP & TABLET VIEW: SaaS Table ── */}
          <div className="hidden md:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead className="bg-[#F8F9FA] border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-3.5 px-6 text-[0.72rem] font-bold text-[#64748B] uppercase tracking-wider">
                    Customer ID
                  </th>
                  <th className="py-3.5 px-6 text-[0.72rem] font-bold text-[#64748B] uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="py-3.5 px-6 text-[0.72rem] font-bold text-[#64748B] uppercase tracking-wider">
                    Mobile Number
                  </th>
                  <th className="py-3.5 px-6 text-[0.72rem] font-bold text-[#64748B] uppercase tracking-wider">
                    Center / Group
                  </th>
                  <th className="py-3.5 px-6 text-[0.72rem] font-bold text-[#64748B] uppercase tracking-wider">
                    Address / City
                  </th>
                  <th className="py-3.5 px-6 text-[0.72rem] font-bold text-[#64748B] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3.5 px-6 text-right text-[0.72rem] font-bold text-[#64748B] uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {results.map((customer, index) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.025 }}
                    onClick={() => handleNavigateToCustomer(customer.id)}
                    className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                  >
                    {/* Customer ID */}
                    <td className="py-4 px-6 text-xs font-mono font-bold text-[#0B1F3A] whitespace-nowrap">
                      <span className="px-2 py-1 rounded bg-[#0B1F3A]/5 border border-[#0B1F3A]/10 text-[#0B1F3A]">
                        {customer.id}
                      </span>
                    </td>

                    {/* Customer Name */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar name={customer.name} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-[#0B1F3A] group-hover:text-[#D4AF37] transition-colors">
                            {customer.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Mobile Number */}
                    <td className="py-4 px-6 whitespace-nowrap text-xs text-[#475569] font-medium">
                      <div className="flex items-center gap-1.5">
                        <Phone size={13} className="text-[#94A3B8]" />
                        <span>{customer.phone}</span>
                      </div>
                    </td>

                    {/* Center / Group */}
                    <td className="py-4 px-6 text-xs text-[#475569] max-w-[200px] truncate">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={13} className="text-[#94A3B8] shrink-0" />
                        <span className="truncate">{customer.centerName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mt-0.5">
                        <Users size={12} className="text-[#94A3B8] shrink-0" />
                        <span className="truncate">{customer.groupName}</span>
                      </div>
                    </td>

                    {/* Address / City */}
                    <td className="py-4 px-6 text-xs text-[#475569] max-w-[200px] truncate">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-[#94A3B8] shrink-0" />
                        <span className="truncate">
                          {customer.address ? `${customer.address}, ` : ''}{customer.city}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${customer.status === 'Active'
                            ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                            : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                          }`}
                      >
                        {customer.status}
                      </span>
                    </td>

                    {/* Action: View Profile */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigateToCustomer(customer.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8F9FA] hover:bg-[#D4AF37] text-[#0B1F3A] hover:text-[#FFFFFF] border border-[#E2E8F0] hover:border-[#D4AF37] text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs"
                      >
                        <span>View Profile</span>
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── MOBILE VIEW: Responsive Cards (Section 25: Responsive Design) ── */}
          <div className="md:hidden divide-y divide-[#E5E7EB]">
            {results.map((customer) => (
              <div
                key={customer.id}
                onClick={() => handleNavigateToCustomer(customer.id)}
                className="p-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={customer.name} size="sm" />
                    <div>
                      <h4 className="text-sm font-bold text-[#0B1F3A]">
                        {customer.name}
                      </h4>
                      <span className="inline-block mt-0.5 font-mono text-[11px] font-semibold text-[#64748B]">
                        {customer.id}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${customer.status === 'Active'
                        ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                        : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                      }`}
                  >
                    {customer.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-1.5 text-xs text-[#475569]">
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-[#94A3B8] shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 size={13} className="text-[#94A3B8] shrink-0" />
                    <span className="truncate">{customer.centerName} • {customer.groupName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-[#94A3B8] shrink-0" />
                    <span className="truncate">
                      {customer.address ? `${customer.address}, ` : ''}{customer.city}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigateToCustomer(customer.id);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-semibold hover:bg-[#15345e] transition-colors cursor-pointer shadow-xs mt-1"
                >
                  <span>View Profile</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ClientSearchPage;
