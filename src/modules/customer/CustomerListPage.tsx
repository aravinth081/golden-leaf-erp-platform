// ──────────────────────────────────────────────────
// Golden Leaf Finance — Branch Manager → Manage Customers
// Strict PDF-Compliant Implementation (Module 12: Customer Management & Digital KYC)
// Fonts: Plus Jakarta Sans (Primary UI & Labels), Manrope (Financials & IDs)
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, RotateCcw, Eye, Edit2, Phone, MapPin,
  CheckCircle2, Clock, X, User, Calendar, ChevronDown,
  Upload, Shield, FileText, Check, AlertCircle, Building2, UserCheck, UserCog,
  UploadCloud, Camera, Trash2, Sparkles, Lock, ShieldCheck, Printer, CheckCircle,
  CreditCard
} from 'lucide-react';
import { useUIStore, useAuthStore } from '../../store';
import {
  getMonitoredCustomers,
  addMonitoredCustomer,
  updateMonitoredCustomer,
  getBranchCollectionGroups,
  type MonitoredCustomer,
  type BranchCollectionGroup
} from '../../services/monitoringDataService';
import { getStoredBranches, type DetailedBranch } from '../../services/branchService';
import { uploadImage } from '../../services/cloudinary';

// ── CUSTOM MODULAR SAAS DROPDOWN (Eliminates ugly OS popups & yellow focus rings) ──
interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  onNavigateLeft?: () => void;
  onNavigateRight?: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  onChange,
  options,
  onNavigateLeft,
  onNavigateRight,
  buttonRef,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const internalButtonRef = useRef<HTMLButtonElement>(null);
  const actualButtonRef = buttonRef || internalButtonRef;
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Close custom dropdown on outside click
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  const openDropdown = () => {
    const curIdx = options.findIndex((o) => o.value === value);
    setFocusedIndex(curIdx >= 0 ? curIdx : 0);
    setIsOpen(true);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    actualButtonRef.current?.focus();
  };

  // Auto-scroll the focused option into view when keyboard moves
  useEffect(() => {
    if (isOpen && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [focusedIndex, isOpen]);

  // Robust keyboard navigation for CustomSelect
  useEffect(() => {
    if (!isOpen || options.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % options.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + options.length) % options.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        closeDropdown();
        onNavigateLeft?.();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        closeDropdown();
        onNavigateRight?.();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const target = options[focusedIndex];
        if (target) {
          onChange(target.value);
          closeDropdown();
        }
      } else if (e.key === 'Escape' || e.key === 'Tab') {
        e.preventDefault();
        closeDropdown();
      } else if (e.key === 'Home') {
        e.preventDefault();
        setFocusedIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setFocusedIndex(options.length - 1);
      } else if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        const char = e.key.toLowerCase();
        const found = options.findIndex((o) => o.label.toLowerCase().startsWith(char));
        if (found !== -1) {
          setFocusedIndex(found);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, options, onChange, onNavigateLeft, onNavigateRight]);

  const selectedOption = options.find((o) => o.value === value) || options[0];
  const isFiltered = value !== 'all';

  return (
    <div className="relative font-jakarta" ref={containerRef}>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-jakarta">
        {label}
      </label>
      <button
        ref={actualButtonRef}
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
        onKeyDown={(e) => {
          if (!isOpen) {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              onNavigateLeft?.();
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              onNavigateRight?.();
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openDropdown();
            }
          }
        }}
        className={`w-full h-[42px] px-3.5 flex items-center justify-between text-xs rounded-xl transition-all cursor-pointer select-none font-semibold outline-none ${
          isOpen
            ? 'bg-white border-[#D4AF37] ring-2 ring-[#D4AF37]/25 shadow-sm text-[#0B1F3A]'
            : isFiltered
            ? 'bg-amber-50/60 border-[#D4AF37] text-[#0B1F3A] hover:bg-amber-50 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30'
            : 'bg-slate-50/90 hover:bg-slate-100/90 border-slate-200 hover:border-slate-300 text-slate-700 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30'
        } border`}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">{selectedOption?.label || label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {isFiltered && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
          )}
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#D4AF37]' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200/95 shadow-xl rounded-xl p-1 z-50 max-h-60 overflow-y-auto no-scrollbar font-jakarta animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isFocused = idx === focusedIndex;
            return (
              <button
                key={opt.value}
                ref={(el) => {
                  optionRefs.current[idx] = el;
                }}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setFocusedIndex(idx)}
                onClick={() => {
                  onChange(opt.value);
                  closeDropdown();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition-all duration-150 cursor-pointer rounded-xl my-0.5 outline-none select-none ${
                  isFocused
                    ? 'bg-amber-50/90 text-[#0B1F3A] font-extrabold ring-1.5 ring-[#D4AF37] shadow-xs'
                    : isSelected
                    ? 'bg-slate-50 text-[#0B1F3A] font-bold'
                    : 'text-slate-700 hover:bg-slate-50/70 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate pr-2">
                  {opt.icon && (
                    <span className={`shrink-0 transition-colors ${isFocused ? 'text-[#D4AF37]' : isSelected ? 'text-[#0B1F3A]' : 'text-slate-400'}`}>
                      {opt.icon}
                    </span>
                  )}
                  <span className="truncate">{opt.label}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {isSelected && (
                    <Check size={14} className="text-[#D4AF37] stroke-[2.5]" />
                  )}
                  {isFocused && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── MODAL FORM SELECT COMPONENT (Pixel-perfect alignment, zero double-borders, full-width dropdown) ──
interface ModalSelectOption {
  value: string;
  label: string;
}

interface ModalSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: ModalSelectOption[];
  icon: React.ReactNode;
  placeholder?: string;
  required?: boolean;
}

const ModalSelect: React.FC<ModalSelectProps> = ({
  label,
  value,
  onChange,
  options,
  icon,
  placeholder,
  required,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative font-jakarta" ref={containerRef}>
      <label className="block text-[11px] font-bold text-slate-600 mb-1.5 font-jakarta uppercase tracking-wider">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-[41px] flex items-center justify-between gap-2.5 px-3.5 rounded-xl transition-all shadow-xs text-xs font-bold font-jakarta cursor-pointer select-none text-left ${
          isOpen
            ? 'bg-white border-[#D4AF37] ring-2 ring-[#D4AF37]/25 shadow-sm'
            : 'bg-slate-50/80 hover:bg-white border-slate-200/90 hover:border-slate-300'
        } border`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="shrink-0 text-[#D4AF37] flex items-center">{icon}</span>
          <span className={`truncate ${selectedOption ? 'text-[#0B1F3A]' : 'text-slate-400'}`}>
            {selectedOption?.label || placeholder || 'Select Option'}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#D4AF37]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200/95 shadow-2xl rounded-xl p-1 z-50 max-h-56 overflow-y-auto no-scrollbar font-jakarta animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors cursor-pointer rounded-lg my-0.5 select-none font-jakarta ${
                  isSelected
                    ? 'bg-[#D4AF37]/15 text-[#0B1F3A] font-extrabold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#0B1F3A] font-semibold'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check size={14} className="text-[#D4AF37] stroke-[2.5] shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const CustomerListPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const selectedBranchId = useUIStore((s) => s.selectedBranchId);
  const addToast = useUIStore((s) => s.addToast);

  // ── 1. BRANCH CONTEXT & ISOLATION ──
  const [branches, setBranches] = useState<DetailedBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<DetailedBranch | null>(null);

  useEffect(() => {
    const list = getStoredBranches();
    setBranches(list);

    const userBranchClaim = user?.customClaims?.branchId;
    let target: DetailedBranch | undefined;

    if (selectedBranchId) {
      target = list.find((b) => b.id === selectedBranchId || b.code === selectedBranchId);
    }
    if (!target && userBranchClaim) {
      target = list.find(
        (b) =>
          b.id.toLowerCase() === userBranchClaim.toLowerCase() ||
          b.code.toLowerCase() === userBranchClaim.toLowerCase() ||
          (userBranchClaim === 'b1' && (b.id === 'BR-01' || b.code === 'GL-BR-001'))
      );
    }
    if (!target && list.length > 0) {
      target = list[0];
    }
    if (target) {
      setCurrentBranch(target);
    }
  }, [user, selectedBranchId]);

  const activeBranchId = currentBranch?.id || 'BR-01';
  const currentBranchName = currentBranch?.name || 'Main Branch - Anna Nagar';

  // ── 2. DATA SOURCE: UNIFIED MASTER CUSTOMERS & GROUPS ──
  const [allCustomers, setAllCustomers] = useState<MonitoredCustomer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadCustomerData = () => {
    try {
      setIsLoading(true);
      // Fetch all stored customers
      const masterList = getMonitoredCustomers(null);
      setAllCustomers(masterList);
    } catch (err) {
      console.error('Failed to load customers:', err);
      addToast({ type: 'error', title: 'Data Load Error', message: 'Unable to load customer records.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, []);

  // Available Collection Groups for this authorized branch
  const branchGroups = useMemo(() => {
    return getBranchCollectionGroups(activeBranchId);
  }, [activeBranchId]);

  // Branch-Isolated Customers: Only customers belonging to this authorized branch
  const branchCustomers = useMemo(() => {
    return allCustomers.filter(
      (c) =>
        c.branchId === activeBranchId ||
        c.branchName === currentBranchName ||
        (activeBranchId === 'BR-01' && (c.branchId === 'b1' || c.branchName?.includes('Anna Nagar')))
    );
  }, [allCustomers, activeBranchId, currentBranchName]);

  // ── 3. SEARCH & MODULAR DROPDOWN FILTERS ──
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedKycStatus, setSelectedKycStatus] = useState('all');
  const [selectedAccountStatus, setSelectedAccountStatus] = useState('all');

  // Keyboard Toolbar Navigation Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const groupButtonRef = useRef<HTMLButtonElement>(null);
  const kycButtonRef = useRef<HTMLButtonElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const resetBtnRef = useRef<HTMLButtonElement>(null);

  const groupOptions = useMemo(() => [
    { value: 'all', label: 'All Groups', icon: <Users size={13} className="text-slate-400" /> },
    ...branchGroups.map((g) => ({
      value: g.name,
      label: g.name,
      icon: <Users size={13} className="text-slate-400" />,
    })),
  ], [branchGroups]);

  const kycStatusOptions = useMemo(() => [
    { value: 'all', label: 'All KYC Status', icon: <Shield size={13} className="text-slate-400" /> },
    { value: 'Verified', label: 'Verified', icon: <CheckCircle2 size={13} className="text-emerald-500" /> },
    { value: 'Pending', label: 'Pending', icon: <Clock size={13} className="text-amber-500" /> },
    { value: 'Rejected', label: 'Rejected', icon: <AlertCircle size={13} className="text-rose-500" /> },
  ], []);

  const accountStatusOptions = useMemo(() => [
    { value: 'all', label: 'All Accounts', icon: <UserCheck size={13} className="text-slate-400" /> },
    { value: 'Active', label: 'Active', icon: <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> },
    { value: 'Inactive', label: 'Inactive', icon: <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> },
  ], []);

  const filteredCustomers = useMemo(() => {
    return branchCustomers.filter((c) => {
      // Search matches: Customer Name, Customer ID, Mobile Number
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q);

      // Collection Group Filter matches
      const matchesGroup =
        selectedGroup === 'all' ||
        c.groupName?.toLowerCase() === selectedGroup.toLowerCase() ||
        c.groupId === selectedGroup;

      // KYC Status Filter matches
      const matchesKyc =
        selectedKycStatus === 'all' ||
        c.kycStatus?.toLowerCase() === selectedKycStatus.toLowerCase() ||
        (selectedKycStatus === 'Rejected' && (c.kycStatus === 'Rejected' || c.kycStatus === 'Incomplete'));

      // Account Status Filter matches
      const matchesAccount =
        selectedAccountStatus === 'all' ||
        c.status?.toLowerCase() === selectedAccountStatus.toLowerCase();

      return matchesSearch && matchesGroup && matchesKyc && matchesAccount;
    });
  }, [branchCustomers, searchQuery, selectedGroup, selectedKycStatus, selectedAccountStatus]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGroup('all');
    setSelectedKycStatus('all');
    setSelectedAccountStatus('all');
  };

  // ── 4. CUSTOMER PROFILE VIEW (DRAWER / MODAL) ──
  const [profileCustomer, setProfileCustomer] = useState<MonitoredCustomer | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);

  // ── 5. REGISTRATION & EDIT MODAL STATE ──
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewDoc) {
          setPreviewDoc(null);
        } else if (isFormModalOpen) {
          setIsFormModalOpen(false);
        } else if (profileCustomer) {
          setProfileCustomer(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewDoc, isFormModalOpen, profileCustomer]);

  interface CustomerFormState {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    groupId: string;
    groupName: string;
    // Digital KYC
    aadhaarNumber: string;
    panNumber: string;
    voterId: string;
    // Nominee
    nomineeName: string;
    nomineeRelation: string;
    nomineePhone: string;
    // Photos & Documents
    customerPhotoUrl: string;
    nomineePhotoUrl: string;
    aadhaarFrontUrl: string;
    aadhaarBackUrl: string;
  }

  const initialFormState: CustomerFormState = {
    name: '',
    phone: '',
    address: '',
    city: currentBranch?.city || 'Chennai',
    state: 'Tamil Nadu',
    pincode: currentBranch?.pincode || '600001',
    groupId: branchGroups[0]?.id || '',
    groupName: branchGroups[0]?.name || 'Unassigned',
    aadhaarNumber: '',
    panNumber: '',
    voterId: '',
    nomineeName: '',
    nomineeRelation: 'Spouse',
    nomineePhone: '',
    customerPhotoUrl: '',
    nomineePhotoUrl: '',
    aadhaarFrontUrl: '',
    aadhaarBackUrl: '',
  };

  const [formData, setFormData] = useState<CustomerFormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Open Add Customer Form
  const handleOpenAdd = () => {
    setEditingCustomerId(null);
    setFormData({
      ...initialFormState,
      city: currentBranch?.city || 'Chennai',
      pincode: currentBranch?.pincode || '600001',
      groupId: branchGroups[0]?.id || '',
      groupName: branchGroups[0]?.name || 'Unassigned',
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Open Edit Customer Form
  const handleOpenEdit = (customer: MonitoredCustomer) => {
    setEditingCustomerId(customer.id);
    setFormData({
      name: customer.name,
      phone: customer.phone.replace('+91 ', ''),
      address: customer.address || '',
      city: customer.city || currentBranch?.city || 'Chennai',
      state: customer.state || 'Tamil Nadu',
      pincode: customer.pincode || currentBranch?.pincode || '600001',
      groupId: customer.groupId || '',
      groupName: customer.groupName || 'Unassigned',
      aadhaarNumber: customer.aadhaarNumber?.replace('XXXX-XXXX-', '') || '',
      panNumber: customer.panNumber && customer.panNumber !== 'Not Available' ? customer.panNumber : '',
      voterId: customer.voterId || '',
      nomineeName: customer.nomineeName || '',
      nomineeRelation: customer.nomineeRelation || 'Spouse',
      nomineePhone: customer.nomineePhone?.replace('+91 ', '') || '',
      customerPhotoUrl: customer.customerPhotoUrl || '',
      nomineePhotoUrl: customer.nomineePhotoUrl || '',
      aadhaarFrontUrl: customer.aadhaarFrontUrl || '',
      aadhaarBackUrl: customer.aadhaarBackUrl || '',
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Handle Form Submission
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Customer name is required';
    }

    const cleanPhone = formData.phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = 'Valid 10-digit mobile number is required';
    }

    if (!formData.address.trim()) {
      errors.address = 'Customer residence address is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast({ type: 'warning', title: 'Incomplete Details', message: 'Please fill in required fields.' });
      return;
    }

    setIsSaving(true);
    try {
      const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}` : formData.phone;

      if (editingCustomerId) {
        // UPDATE EXISTING CUSTOMER
        const existing = allCustomers.find((c) => c.id === editingCustomerId);
        const groupChanged = existing && existing.groupName !== formData.groupName;

        const updatedHistory = existing?.history ? [...existing.history] : [];
        if (groupChanged) {
          updatedHistory.push({
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            event: 'Group Reassignment',
            remarks: `Reassigned from ${existing?.groupName || 'Unassigned'} to ${formData.groupName}`,
          });
        }
        updatedHistory.push({
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          event: 'Profile Updated',
          remarks: 'Customer profile details updated by Branch Manager',
        });

        const patch: Partial<MonitoredCustomer> = {
          name: formData.name.trim(),
          phone: formattedPhone,
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          groupName: formData.groupName,
          groupId: formData.groupId,
          aadhaarNumber: formData.aadhaarNumber ? `XXXX-XXXX-${formData.aadhaarNumber.slice(-4)}` : existing?.aadhaarNumber || 'Not provided',
          aadhaarFrontAvailable: !!formData.aadhaarFrontUrl || existing?.aadhaarFrontAvailable || false,
          aadhaarBackAvailable: !!formData.aadhaarBackUrl || existing?.aadhaarBackAvailable || false,
          panNumber: formData.panNumber.trim() || existing?.panNumber || 'Not Available',
          voterId: formData.voterId.trim() || existing?.voterId || 'Not Available',
          customerPhotoAvailable: !!formData.customerPhotoUrl || existing?.customerPhotoAvailable || false,
          customerPhotoUrl: formData.customerPhotoUrl || existing?.customerPhotoUrl,
          nomineePhotoAvailable: !!formData.nomineePhotoUrl || existing?.nomineePhotoAvailable || false,
          nomineePhotoUrl: formData.nomineePhotoUrl || existing?.nomineePhotoUrl,
          nomineeName: formData.nomineeName.trim(),
          nomineeRelation: formData.nomineeRelation,
          nomineePhone: formData.nomineePhone.trim() ? `+91 ${formData.nomineePhone.trim()}` : '',
          history: updatedHistory,
        };

        updateMonitoredCustomer(editingCustomerId, patch);
        addToast({
          type: 'success',
          title: 'Customer Record Updated',
          message: `${formData.name}'s profile has been updated successfully.`,
        });

        // Update profile view if currently viewing
        if (profileCustomer && profileCustomer.id === editingCustomerId) {
          setProfileCustomer({ ...profileCustomer, ...patch });
        }
      } else {
        // REGISTER NEW CUSTOMER
        const existingIds = allCustomers
          .map((c) => parseInt(c.id.replace('GLF-C-', ''), 10))
          .filter((n) => !isNaN(n));
        const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 1010;
        const newCustomerId = `GLF-C-${maxId + 1}`;

        const newCustomer: MonitoredCustomer = {
          id: newCustomerId,
          name: formData.name.trim(),
          phone: formattedPhone,
          branchId: activeBranchId,
          branchName: currentBranchName,
          centerName: 'Center Route',
          groupName: formData.groupName || 'Unassigned',
          groupId: formData.groupId,
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          aadhaarNumber: formData.aadhaarNumber ? `XXXX-XXXX-${formData.aadhaarNumber.slice(-4)}` : 'XXXX-XXXX-0000',
          aadhaarFrontAvailable: !!formData.aadhaarFrontUrl,
          aadhaarFrontUrl: formData.aadhaarFrontUrl,
          aadhaarBackAvailable: !!formData.aadhaarBackUrl,
          aadhaarBackUrl: formData.aadhaarBackUrl,
          panNumber: formData.panNumber.trim() || 'Not Available',
          voterId: formData.voterId.trim() || 'Not Available',
          customerPhotoAvailable: !!formData.customerPhotoUrl,
          customerPhotoUrl: formData.customerPhotoUrl,
          nomineePhotoAvailable: !!formData.nomineePhotoUrl,
          nomineePhotoUrl: formData.nomineePhotoUrl,
          nomineeName: formData.nomineeName.trim(),
          nomineeRelation: formData.nomineeRelation,
          nomineePhone: formData.nomineePhone.trim() ? `+91 ${formData.nomineePhone.trim()}` : '',
          kycStatus: 'Pending', // Initial status awaiting Credit Manager verification
          status: 'Active',
          registrationDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          history: [
            {
              date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              event: 'Customer Registration',
              remarks: `Registered at ${currentBranchName} by Branch Manager`,
            },
            {
              date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              event: 'Group Assignment',
              remarks: `Assigned to ${formData.groupName}`,
            },
          ],
        };

        addMonitoredCustomer(newCustomer);
        addToast({
          type: 'success',
          title: 'Customer Registered',
          message: `${newCustomer.name} has been enrolled as ${newCustomer.id}.`,
        });
      }

      loadCustomerData();
      setIsFormModalOpen(false);
    } catch (err) {
      console.error('Save customer error:', err);
      addToast({ type: 'error', title: 'Save Failed', message: 'Could not save customer record.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper: Cloudinary file upload
  const handleFileUpload = async (field: keyof CustomerFormState, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const folderKey = field === 'customerPhotoUrl' ? 'photos' : field === 'nomineePhotoUrl' ? 'nominees' : 'kyc';
      const result = await uploadImage(file, `customers/${folderKey}`);
      if (result?.secure_url) {
        setFormData((prev) => ({ ...prev, [field]: result.secure_url }));
        addToast({
          type: 'success',
          title: 'Image Uploaded to Cloudinary',
          message: 'Secure Cloudinary image URL attached.',
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: err.message || 'Could not upload image to Cloudinary.',
      });
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveFile = (field: keyof CustomerFormState) => {
    setFormData((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <>
      <div className="space-y-6 font-jakarta pb-16">
      {/* ── 1. PAGE HEADER (PDF Strict: Title, Subtitle, Add Customer, Branch Badge) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B1F3A] rounded-2xl px-6 py-5 border border-[#243E66] shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-5 bg-[#D4AF37] rounded-full shrink-0" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-jakarta">
              Manage Customers
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#F5D061] border border-[#D4AF37]/40 font-jakarta shrink-0">
              {currentBranchName}
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-slate-300 mt-1.5 font-jakarta font-medium leading-relaxed max-w-2xl">
            Register, search and manage customer profiles and collection group assignments.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2f] text-[#0B1F3A] text-xs font-extrabold shadow-sm hover:shadow transition-all cursor-pointer font-jakarta shrink-0"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* ── 2. SEARCH & MODULAR SAAS DROPDOWN FILTERS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] font-jakarta">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
          {/* SEARCH CUSTOMERS */}
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-jakarta">
              Search Customers
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') {
                    const input = e.currentTarget;
                    if (input.selectionStart === input.value.length && input.selectionEnd === input.value.length) {
                      e.preventDefault();
                      groupButtonRef.current?.focus();
                    }
                  }
                }}
                placeholder="Search customer name, ID or mobile..."
                className="w-full h-[42px] pl-10 pr-4 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:bg-white text-[#0B1F3A] font-jakarta placeholder:text-slate-400 transition-colors"
              />
            </div>
          </div>

          {/* 1. COLLECTION GROUP FILTER */}
          <div className="sm:col-span-1 lg:col-span-3">
            <CustomSelect
              buttonRef={groupButtonRef}
              label="Collection Group"
              value={selectedGroup}
              onChange={setSelectedGroup}
              options={groupOptions}
              onNavigateLeft={() => {
                searchInputRef.current?.focus();
              }}
              onNavigateRight={() => {
                kycButtonRef.current?.focus();
              }}
            />
          </div>

          {/* 2. KYC STATUS FILTER */}
          <div className="sm:col-span-1 lg:col-span-2">
            <CustomSelect
              buttonRef={kycButtonRef}
              label="KYC Status"
              value={selectedKycStatus}
              onChange={setSelectedKycStatus}
              options={kycStatusOptions}
              onNavigateLeft={() => {
                groupButtonRef.current?.focus();
              }}
              onNavigateRight={() => {
                accountButtonRef.current?.focus();
              }}
            />
          </div>

          {/* 3. ACCOUNT STATUS FILTER */}
          <div className="sm:col-span-1 lg:col-span-2">
            <CustomSelect
              buttonRef={accountButtonRef}
              label="Account Status"
              value={selectedAccountStatus}
              onChange={setSelectedAccountStatus}
              options={accountStatusOptions}
              onNavigateLeft={() => {
                kycButtonRef.current?.focus();
              }}
              onNavigateRight={() => {
                resetBtnRef.current?.focus();
              }}
            />
          </div>

          {/* RESET BUTTON */}
          <div className="sm:col-span-1 lg:col-span-1 flex justify-end">
            <button
              ref={resetBtnRef}
              type="button"
              onClick={handleResetFilters}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  accountButtonRef.current?.focus();
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  searchInputRef.current?.focus();
                }
              }}
              title="Reset All Filters"
              className="w-full h-[42px] px-3.5 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-100/80 text-slate-600 text-xs font-bold transition-colors cursor-pointer font-jakarta focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30"
            >
              <RotateCcw size={13} />
              <span className="lg:hidden">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. DYNAMIC COUNTER & CUSTOMER DIRECTORY TABLE ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider font-jakarta">
              Total Customers:
            </span>
            <span className="text-xs font-black text-[#0B1F3A] font-manrope tabular-nums px-2.5 py-0.5 rounded-md bg-white border border-slate-200 shadow-2xs">
              {filteredCustomers.length}
            </span>
          </div>

          {searchQuery || selectedGroup !== 'all' || selectedKycStatus !== 'all' || selectedAccountStatus !== 'all' ? (
            <span className="text-[11px] text-slate-400 font-medium">
              Filtered from {branchCustomers.length} branch customers
            </span>
          ) : null}
        </div>

        <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs">
          {isLoading ? (
            <div className="p-8 space-y-4 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Users size={22} />
              </div>
              <p className="text-sm font-bold text-[#0B1F3A] font-jakarta">
                {branchCustomers.length === 0 ? 'No customers found.' : 'No customers match the selected filters.'}
              </p>
              <p className="text-xs text-slate-400 mt-1 font-jakarta font-medium max-w-sm">
                {branchCustomers.length === 0
                  ? `No customer records enrolled under ${currentBranchName} yet.`
                  : 'Try clearing your search keyword or active filters to view all branch records.'}
              </p>
              {(searchQuery || selectedGroup !== 'all' || selectedKycStatus !== 'all' || selectedAccountStatus !== 'all') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] text-xs font-bold transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div>
              {/* Desktop / Tablet Table View (Hidden on mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs font-jakarta table-fixed min-w-[760px]">
                  {/* PDF-Strict Columns: CUSTOMER, CONTACT, COLLECTION GROUP, KYC, ACTIONS */}
                  <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
                    <tr>
                      <th className="w-[32%] py-3.5 px-6 text-left">Customer</th>
                      <th className="w-[20%] py-3.5 px-5 text-left">Contact</th>
                      <th className="w-[24%] py-3.5 px-5 text-left">Collection Group</th>
                      <th className="w-[12%] py-3.5 px-4 text-center">KYC</th>
                      <th className="w-[12%] py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                        {/* 1. CUSTOMER: Name, ID, Registration Date */}
                        <td className="py-3.5 px-6 text-left">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#0B1F3A] text-[#D4AF37] flex items-center justify-center text-xs font-extrabold shrink-0 shadow-2xs select-none">
                              {customer.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-[13px] text-[#0B1F3A] font-jakarta tracking-tight truncate">
                                {customer.name}
                              </div>
                              <div className="text-[10.5px] font-semibold text-slate-400 font-jakarta flex items-center gap-1.5 mt-0.5">
                                <span className="font-manrope tabular-nums text-slate-500">{customer.id}</span>
                                <span>•</span>
                                <span>Enrolled {customer.registrationDate}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. CONTACT: Mobile Number */}
                        <td className="py-3.5 px-5 text-left">
                          <div className="flex items-center gap-2">
                            <Phone size={13} className="text-slate-400 shrink-0" />
                            <span className="font-manrope font-semibold text-xs text-slate-700 tabular-nums">
                              {customer.phone}
                            </span>
                          </div>
                        </td>

                        {/* 3. COLLECTION GROUP: Assigned Group */}
                        <td className="py-3.5 px-5 text-left">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <Users size={11} />
                            </div>
                            <span className="text-[12px] font-semibold text-slate-700 font-jakarta truncate">
                              {customer.groupName || 'Unassigned'}
                            </span>
                          </div>
                        </td>

                        {/* 4. KYC: Read-Only Status */}
                        <td className="py-3.5 px-4 text-center">
                          {customer.kycStatus === 'Verified' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-jakarta">
                              <CheckCircle2 size={11} className="text-emerald-500" />
                              Verified
                            </span>
                          ) : customer.kycStatus === 'Pending' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 font-jakarta">
                              <Clock size={11} className="text-amber-500" />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 border border-slate-200 font-jakarta">
                              <AlertCircle size={11} className="text-slate-400" />
                              Incomplete
                            </span>
                          )}
                        </td>

                        {/* 5. ACTIONS: View (Profile) & Edit */}
                        <td className="py-3.5 px-6 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => setProfileCustomer(customer)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#0B1F3A] hover:text-white text-slate-700 text-[11px] font-bold transition-all cursor-pointer font-jakarta"
                              title="View Complete Customer Profile"
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(customer)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 border border-transparent text-slate-700 text-[11px] font-bold transition-all cursor-pointer font-jakarta"
                              title="Edit Customer Profile & Group Assignment"
                            >
                              <Edit2 size={12} />
                              <span>Edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Responsive Cards View (Section 62-63: <md screens) */}
              <div className="md:hidden divide-y divide-slate-100 bg-white">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="p-4 space-y-3">
                    {/* Top Row: Name, ID, KYC */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[#0B1F3A] text-[#D4AF37] flex items-center justify-center text-xs font-extrabold shrink-0 select-none">
                          {customer.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[13px] text-[#0B1F3A] truncate font-jakarta">
                            {customer.name}
                          </div>
                          <div className="text-[11px] font-manrope font-semibold text-slate-400">
                            {customer.id}
                          </div>
                        </div>
                      </div>

                      {/* Read-Only KYC */}
                      <div className="shrink-0">
                        {customer.kycStatus === 'Verified' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={10} className="text-emerald-500" />
                            Verified
                          </span>
                        ) : customer.kycStatus === 'Pending' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={10} className="text-amber-500" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Incomplete
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Contact & Collection Group */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Mobile</span>
                        <div className="flex items-center gap-1.5 font-manrope font-semibold text-slate-700 text-[11px]">
                          <Phone size={11} className="text-slate-400" />
                          <span>{customer.phone}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Collection Group</span>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px] truncate">
                          <Users size={11} className="text-slate-400 shrink-0" />
                          <span className="truncate">{customer.groupName || 'Unassigned'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Actions (View, Edit) */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setProfileCustomer(customer)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-[#0B1F3A] hover:text-white text-[#0B1F3A] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer font-jakarta"
                      >
                        <Eye size={13} />
                        <span>View Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(customer)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer font-jakarta"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* ── 4. CUSTOMER PROFILE MODAL / DRAWER (PDF Section 24–31) ── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {profileCustomer && (
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setProfileCustomer(null);
                }
              }}
              className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm font-jakarta cursor-pointer"
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="bg-white rounded-3xl max-w-3xl w-full max-h-[92dvh] my-auto overflow-hidden shadow-[0_25px_70px_rgba(11,31,58,0.4)] border border-slate-200/90 flex flex-col font-jakarta"
              >


                {/* Profile Header */}
                <div className="bg-[#0B1F3A] px-6 py-5 border-b border-[#243E66] flex items-center justify-between text-white shrink-0">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* High-res Avatar or Gold Gradient Initials */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl p-[1.5px] bg-gradient-to-br from-[#F5D061] via-[#D4AF37] to-[#8C6808] shadow-[0_4px_12px_rgba(212,175,55,0.25)] flex items-center justify-center">
                        {profileCustomer.customerPhotoUrl ? (
                          <img
                            src={profileCustomer.customerPhotoUrl}
                            alt={profileCustomer.name}
                            className="w-full h-full object-cover rounded-[14px]"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#0B1F3A] rounded-[14px] flex items-center justify-center text-white font-black text-sm sm:text-base tracking-wider font-jakarta">
                            {profileCustomer.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-[#0B1F3A]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight font-jakarta truncate">
                          {profileCustomer.name}
                        </h2>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 leading-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {profileCustomer.status || 'Active'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300 font-jakarta mt-1 flex-wrap">
                        <span className="font-mono font-bold text-[#F5D061] bg-[#D4AF37]/15 px-2 py-0.5 rounded border border-[#D4AF37]/35 tracking-wider text-[11px]">
                          {profileCustomer.id}
                        </span>
                        <span className="text-white/25">•</span>
                        <span className="flex items-center gap-1 text-[11.5px] text-slate-300">
                          <Calendar size={12} className="text-[#D4AF37]" />
                          Enrolled {profileCustomer.registrationDate}
                        </span>
                        <span className="text-white/25">•</span>
                        <span className="flex items-center gap-1 text-[11.5px] text-slate-300">
                          <Building2 size={12} className="text-[#D4AF37]" />
                          {profileCustomer.branchName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      title="Print Customer Profile"
                      className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                    >
                      <Printer size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileCustomer(null)}
                      title="Close Profile"
                      className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                    >
                      <X size={17} />
                    </button>
                  </div>
                </div>

                {/* Profile Body (Scrollable with Sleek Background) */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs custom-scrollbar bg-slate-50/60">
                  {/* 1. Customer Personal & Residence Information */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#0B1F3A] flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-[#D4AF37]/15 text-[#B89320] flex items-center justify-center shrink-0">
                          <User size={12} />
                        </span>
                        Customer Information
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wide">
                        Verified Profile Data
                      </span>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-4 sm:p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Full Legal Name
                          </span>
                          <span className="font-extrabold text-[#0B1F3A] text-xs sm:text-[13px] block">
                            {profileCustomer.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Registered Mobile
                          </span>
                          <span className="font-manrope font-extrabold text-[#0B1F3A] text-xs sm:text-[13px] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            {profileCustomer.phone}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Collection Group
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#D4AF37]/15 text-[#0B1F3A] border border-[#D4AF37]/35 font-bold text-xs">
                            <Users size={12} className="text-[#B89320]" />
                            {profileCustomer.groupName}
                          </span>
                        </div>
                      </div>

                      {/* Address Bar */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200/60 text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin size={14} />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Address & Residence
                            </span>
                            <p className="font-medium text-slate-700 text-xs mt-0.5 leading-relaxed">
                              {profileCustomer.address}, {profileCustomer.city}, {profileCustomer.state} — <strong className="font-manrope font-bold text-[#0B1F3A]">{profileCustomer.pincode}</strong>
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 sm:text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Authorized Branch
                          </span>
                          <span className="font-bold text-[#0B1F3A] text-xs flex items-center sm:justify-end gap-1 mt-0.5">
                            <Building2 size={12} className="text-slate-400" />
                            {profileCustomer.branchName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Digital KYC Records (Strict RBAC Read-Only) */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#0B1F3A] flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <ShieldCheck size={12} />
                        </span>
                        Digital KYC Records (Read-Only)
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                        <Lock size={10} className="text-slate-500" /> Credit Manager Level
                      </span>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-4 sm:p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        {/* Aadhaar Card */}
                        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Aadhaar (UIDAI)
                          </span>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-extrabold text-xs tracking-wider text-[#0B1F3A]">
                              {profileCustomer.aadhaarNumber || 'XXXX-XXXX-XXXX'}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                              <CheckCircle2 size={11} /> Masked
                            </span>
                          </div>
                        </div>

                        {/* PAN Card */}
                        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            PAN Number
                          </span>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-extrabold text-xs tracking-wider text-[#0B1F3A]">
                              {profileCustomer.panNumber || 'Not Available'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">Govt ID</span>
                          </div>
                        </div>

                        {/* Voter ID */}
                        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Voter ID / EPIC
                          </span>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-extrabold text-xs tracking-wider text-[#0B1F3A]">
                              {profileCustomer.voterId || 'Not Available'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">ECI Card</span>
                          </div>
                        </div>
                      </div>

                      {/* Verification Status Banner */}
                      <div className="mt-3.5 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <CheckCircle2 size={13} className="stroke-[2.5]" />
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-emerald-900 font-jakarta block">
                              KYC Verification Status: {profileCustomer.kycStatus}
                            </span>
                            <span className="text-[10.5px] text-emerald-700 font-medium block">
                              Credit Manager verified • Strict RBAC compliance
                            </span>
                          </div>
                        </div>
                        <span className="text-[10.5px] font-semibold text-slate-500 italic bg-white/90 px-2.5 py-1 rounded-lg border border-slate-200/70 shrink-0 self-start sm:self-auto">
                          Branch Managers cannot verify/reject KYC
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Photos & Nominee Details */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#0B1F3A] flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-[#D4AF37]/15 text-[#B89320] flex items-center justify-center shrink-0">
                          <UserCheck size={12} />
                        </span>
                        Photos & Nominee Details
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">Biometric Match</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Customer Photo */}
                      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-xl p-[1.5px] bg-gradient-to-br from-[#F5D061] to-[#D4AF37] shrink-0 shadow-sm">
                          {profileCustomer.customerPhotoUrl ? (
                            <img
                              src={profileCustomer.customerPhotoUrl}
                              alt="Customer"
                              className="w-full h-full object-cover rounded-[10px]"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-100 rounded-[10px] flex flex-col items-center justify-center text-slate-400">
                              <Camera size={18} className="text-slate-400 mb-0.5" />
                              <span className="text-[8.5px] font-bold">Photo on file</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-extrabold text-[#0B1F3A] block text-xs">Customer Photo</span>
                          <span className="text-[10.5px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                            <CheckCircle2 size={11} /> Uploaded & on record
                          </span>
                          {profileCustomer.customerPhotoUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({ title: `${profileCustomer.name} - Photo`, url: profileCustomer.customerPhotoUrl || '' })}
                              className="text-[10.5px] text-[#0B1F3A] hover:text-[#D4AF37] font-bold inline-flex items-center gap-1 mt-1 cursor-pointer"
                            >
                              <Eye size={11} /> View Full Photo
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Nominee Details */}
                      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-xl p-[1.5px] bg-gradient-to-br from-slate-200 to-slate-300 shrink-0 shadow-sm">
                          {profileCustomer.nomineePhotoUrl ? (
                            <img
                              src={profileCustomer.nomineePhotoUrl}
                              alt="Nominee"
                              className="w-full h-full object-cover rounded-[10px]"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-100 rounded-[10px] flex flex-col items-center justify-center text-slate-400">
                              <User size={18} className="text-slate-400 mb-0.5" />
                              <span className="text-[8.5px] font-bold">Nominee</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-[#0B1F3A] text-xs truncate">
                              {profileCustomer.nomineeName || 'Nominee Not Specified'}
                            </span>
                            {profileCustomer.nomineeRelation && (
                              <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {profileCustomer.nomineeRelation}
                              </span>
                            )}
                          </div>
                          {profileCustomer.nomineePhone && (
                            <span className="text-[10.5px] text-slate-500 font-manrope font-semibold block mt-0.5">
                              {profileCustomer.nomineePhone}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 block mt-0.5">Nominee record verified</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. KYC Uploaded Documents */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#0B1F3A] flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-[#D4AF37]/15 text-[#B89320] flex items-center justify-center shrink-0">
                          <FileText size={12} />
                        </span>
                        KYC Uploaded Documents
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">2 Files Attached</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Aadhaar Front */}
                      <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 text-[#D4AF37] flex items-center justify-center shrink-0">
                            <FileText size={17} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-[#0B1F3A] block truncate">
                              Aadhaar Front (UIDAI)
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              PDF / Image • Document on record
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            ✓ Attached
                          </span>
                          {profileCustomer.aadhaarFrontUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({ title: 'Aadhaar Front', url: profileCustomer.aadhaarFrontUrl || '' })}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#0B1F3A] hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Preview Document"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Aadhaar Back */}
                      <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 text-[#D4AF37] flex items-center justify-center shrink-0">
                            <FileText size={17} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-[#0B1F3A] block truncate">
                              Aadhaar Back (UIDAI)
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              PDF / Image • Document on record
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            ✓ Attached
                          </span>
                          {profileCustomer.aadhaarBackUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({ title: 'Aadhaar Back', url: profileCustomer.aadhaarBackUrl || '' })}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#0B1F3A] hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Preview Document"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5. Customer History Timeline */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#0B1F3A] flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-[#D4AF37]/15 text-[#B89320] flex items-center justify-center shrink-0">
                          <Calendar size={12} />
                        </span>
                        Customer History Timeline
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">Audit Trail Log</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-4 sm:p-5">
                      <div className="space-y-4">
                        {profileCustomer.history && profileCustomer.history.length > 0 ? (
                          profileCustomer.history.map((h, i) => (
                            <div key={i} className="flex items-start gap-3 text-xs relative">
                              {/* Glowing Node */}
                              <div className="relative mt-1 shrink-0">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#F5D061] to-[#D4AF37] ring-4 ring-[#D4AF37]/20 shadow-xs" />
                              </div>
                              <div className="min-w-0 flex-1 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="font-extrabold text-[#0B1F3A] text-xs font-jakarta">
                                    {h.event}
                                  </span>
                                  <span className="text-[10.5px] font-mono font-bold text-[#D4AF37] bg-white px-2 py-0.5 rounded border border-slate-200/80">
                                    {h.date}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">
                                  {h.remarks}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 italic">No recorded historical events.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Footer */}
                <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const cust = profileCustomer;
                      setProfileCustomer(null);
                      handleOpenEdit(cust);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#142B4E] text-[#F5D061] hover:text-white border border-[#D4AF37]/50 shadow-sm transition-all duration-200 text-xs font-extrabold cursor-pointer active:scale-98"
                  >
                    <Edit2 size={13} className="text-[#D4AF37]" />
                    <span>Edit Customer Profile</span>
                  </button>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Printer size={13} />
                      <span>Print Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileCustomer(null)}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#0B1F3A] text-xs font-bold transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── 4b. DOCUMENT LIGHTBOX PREVIEW MODAL ── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {previewDoc && (
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setPreviewDoc(null);
                }
              }}
              className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-white/20 flex flex-col cursor-default"
              >
                <div className="bg-[#0B1F3A] px-5 py-3.5 flex items-center justify-between text-white border-b border-[#243E66]">
                  <span className="font-bold text-xs font-jakarta">{previewDoc.title}</span>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
                <div className="p-4 bg-slate-100 flex items-center justify-center max-h-[70vh] overflow-auto">
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.title}
                    className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── 5. REGISTRATION / EDIT MODAL (PDF Section 32–45) ── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isFormModalOpen && (
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsFormModalOpen(false);
                }
              }}
              className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm font-jakarta cursor-pointer"
            >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[92dvh] my-auto overflow-hidden shadow-[0_25px_70px_-15px_rgba(15,23,42,0.25)] border border-slate-200/90 flex flex-col font-jakarta cursor-default"
            >
              {/* Form Header */}
              <div className="relative bg-white px-6 sm:px-7 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 overflow-hidden">

                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FAF0D7] via-[#FDFBF7] to-[#F5E6BE] border border-[#D4AF37]/50 shadow-[0_4px_14px_-2px_rgba(212,175,55,0.25)] flex items-center justify-center text-[#B8860B] shrink-0">
                    <UserCog size={20} className="stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-sm sm:text-[16px] font-black uppercase tracking-[0.05em] text-[#0F1F38] font-jakarta leading-tight">
                        {editingCustomerId ? 'Edit Customer Profile' : 'Register New Customer'}
                      </h2>
                      {editingCustomerId && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FAF0D7] text-[#8C6207] border border-[#D4AF37]/45 shadow-2xs font-manrope tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                          {editingCustomerId}
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-[#64748B] font-medium font-jakarta mt-0.5 truncate">
                      {editingCustomerId
                        ? 'Update customer KYC details, collection route group, and verified documents'
                        : 'Enroll a new customer with Digital KYC and group assignment'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-400 hover:border-rose-200 border border-slate-200/80 shadow-2xs flex items-center justify-center transition-all cursor-pointer shrink-0 ml-3"
                  title="Close"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveCustomer} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs no-scrollbar bg-slate-50/40">
                  {/* SECTION 1: Customer Information */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 transition-all p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center gap-3 pb-3.5 mb-5 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#FAF0D7] via-[#FDF9EE] to-[#F3E5BA] border border-[#D4AF37]/60 text-[#8C6207] font-black text-xs flex items-center justify-center shadow-2xs font-manrope shrink-0">
                        1
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.06em] text-[#0F1F38] font-jakarta">
                          Customer Information
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium font-jakarta">
                          Primary identity and residential verification
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Legal Name */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5 font-jakarta uppercase tracking-wider">
                          Full Legal Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50/80 hover:bg-white focus-within:bg-white border border-slate-200/90 rounded-xl focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/25 transition-all shadow-xs">
                          <User size={15} className="text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Kavitha Murugan"
                            className="w-full bg-transparent text-xs text-[#0B1F3A] font-semibold outline-none placeholder-slate-400 font-jakarta"
                          />
                        </div>
                        {formErrors.name && <p className="text-rose-500 text-[10.5px] font-medium mt-1">{formErrors.name}</p>}
                      </div>

                      {/* Mobile Number */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5 font-jakarta uppercase tracking-wider">
                          Mobile Number <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50/80 hover:bg-white focus-within:bg-white border border-slate-200/90 rounded-xl focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/25 transition-all shadow-xs">
                          <Phone size={15} className="text-slate-400 shrink-0" />
                          <span className="text-xs font-bold text-slate-400 font-manrope pr-1 border-r border-slate-200">+91</span>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="98765 43210"
                            maxLength={10}
                            className="w-full bg-transparent text-xs text-[#0B1F3A] font-bold outline-none placeholder-slate-400 font-manrope tracking-wide"
                          />
                        </div>
                        {formErrors.phone && <p className="text-rose-500 text-[10.5px] font-medium mt-1">{formErrors.phone}</p>}
                      </div>

                      {/* Residence Address */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5 font-jakarta uppercase tracking-wider">
                          Residence Address <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50/80 hover:bg-white focus-within:bg-white border border-slate-200/90 rounded-xl focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/25 transition-all shadow-xs">
                          <MapPin size={15} className="text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Street address, door no., area landmark"
                            className="w-full bg-transparent text-xs text-[#0B1F3A] font-semibold outline-none placeholder-slate-400 font-jakarta"
                          />
                        </div>
                        {formErrors.address && <p className="text-rose-500 text-[10.5px] font-medium mt-1">{formErrors.address}</p>}
                      </div>

                      {/* City */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5 font-jakarta uppercase tracking-wider">
                          City
                        </label>
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50/80 hover:bg-white focus-within:bg-white border border-slate-200/90 rounded-xl focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/25 transition-all shadow-xs">
                          <Building2 size={15} className="text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="e.g. Coimbatore"
                            className="w-full bg-transparent text-xs text-[#0B1F3A] font-semibold outline-none font-jakarta"
                          />
                        </div>
                      </div>

                      {/* Pincode */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5 font-jakarta uppercase tracking-wider">
                          Pincode
                        </label>
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50/80 hover:bg-white focus-within:bg-white border border-slate-200/90 rounded-xl focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/25 transition-all shadow-xs">
                          <MapPin size={15} className="text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={formData.pincode}
                            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                            placeholder="641012"
                            maxLength={6}
                            className="w-full bg-transparent text-xs text-[#0B1F3A] font-bold outline-none font-manrope tracking-wider"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: Collection Group Assignment */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 transition-all p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center gap-3 pb-3.5 mb-5 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#FAF0D7] via-[#FDF9EE] to-[#F3E5BA] border border-[#D4AF37]/60 text-[#8C6207] font-black text-xs flex items-center justify-center shadow-2xs font-manrope shrink-0">
                        2
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.06em] text-[#0F1F38] font-jakarta">
                          Collection Group Assignment
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium font-jakarta">
                          Assign customer to field officer route & scheduled meeting cycle
                        </p>
                      </div>
                    </div>

                    <div>
                      <ModalSelect
                        label="Assigned Collection Group"
                        value={formData.groupName}
                        onChange={(val) => {
                          const chosen = branchGroups.find((g) => g.name === val);
                          setFormData({
                            ...formData,
                            groupName: val,
                            groupId: chosen?.id || '',
                          });
                        }}
                        icon={<Users size={16} />}
                        placeholder="Select Collection Group"
                        options={branchGroups.map((g) => ({
                          value: g.name,
                          label: `${g.name} (${g.id})`,
                        }))}
                      />
                      <p className="text-[10.5px] text-slate-400 mt-1.5 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                        Collection group defines field officer route & meeting scheduling.
                      </p>
                    </div>
                  </div>

                  {/* SECTION 3: Digital KYC Information */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 transition-all p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center gap-3 pb-3.5 mb-5 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#FAF0D7] via-[#FDF9EE] to-[#F3E5BA] border border-[#D4AF37]/60 text-[#8C6207] font-black text-xs flex items-center justify-center shadow-2xs font-manrope shrink-0">
                        3
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.06em] text-[#0F1F38] font-jakarta">
                          Digital KYC Information
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium font-jakarta">
                          Statutory identity documents and verification numbers
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Aadhaar */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5 font-jakarta uppercase tracking-wider">
                          Aadhaar Number
                        </label>
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50/80 hover:bg-white focus-within:bg-white border border-slate-200/90 rounded-xl focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/25 transition-all shadow-xs">
                          <Shield size={15} className="text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={formData.aadhaarNumber}
                            onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value.replace(/\D/g, '') })}
                            placeholder="e.g. 8234"
                            maxLength={12}
                            className="w-full bg-transparent text-xs text-[#0B1F3A] font-bold outline-none font-manrope tracking-wider"
                          />
                        </div>
                      </div>

                      {/* PAN */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5 font-jakarta uppercase tracking-wider">
                          PAN Number
                        </label>
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50/80 hover:bg-white focus-within:bg-white border border-slate-200/90 rounded-xl focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/25 transition-all shadow-xs">
                          <CreditCard size={15} className="text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={formData.panNumber}
                            onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                            placeholder="FLPKM9900L"
                            maxLength={10}
                            className="w-full bg-transparent text-xs text-[#0B1F3A] font-mono uppercase font-bold outline-none tracking-wider"
                          />
                        </div>
                      </div>

                      {/* Voter ID */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5 font-jakarta uppercase tracking-wider">
                          Voter ID
                        </label>
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50/80 hover:bg-white focus-within:bg-white border border-slate-200/90 rounded-xl focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/25 transition-all shadow-xs">
                          <FileText size={15} className="text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={formData.voterId}
                            onChange={(e) => setFormData({ ...formData, voterId: e.target.value.toUpperCase() })}
                            placeholder="TN/32/088/778899"
                            className="w-full bg-transparent text-xs text-[#0B1F3A] font-mono uppercase font-bold outline-none tracking-wider"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: Nominee & Documents */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 transition-all p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center gap-3 pb-3.5 mb-5 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#FAF0D7] via-[#FDF9EE] to-[#F3E5BA] border border-[#D4AF37]/60 text-[#8C6207] font-black text-xs flex items-center justify-center shadow-2xs font-manrope shrink-0">
                        4
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.06em] text-[#0F1F38] font-jakarta">
                          Nominee & Photo Uploads
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium font-jakarta">
                          Next-of-kin details and verified biometric document proofs
                        </p>
                      </div>
                    </div>

                    {/* Nominee Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5 font-jakarta uppercase tracking-wider">
                          Nominee Name
                        </label>
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50/80 hover:bg-white focus-within:bg-white border border-slate-200/90 rounded-xl focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/25 transition-all shadow-xs">
                          <User size={15} className="text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={formData.nomineeName}
                            onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                            placeholder="e.g. Murugan P"
                            className="w-full bg-transparent text-xs text-[#0B1F3A] font-semibold outline-none font-jakarta"
                          />
                        </div>
                      </div>

                      <ModalSelect
                        label="Nominee Relation"
                        value={formData.nomineeRelation}
                        onChange={(val) => setFormData({ ...formData, nomineeRelation: val })}
                        icon={<UserCheck size={15} />}
                        options={[
                          { value: 'Spouse', label: 'Spouse' },
                          { value: 'Mother', label: 'Mother' },
                          { value: 'Father', label: 'Father' },
                          { value: 'Son', label: 'Son' },
                          { value: 'Daughter', label: 'Daughter' },
                          { value: 'Brother', label: 'Brother' },
                          { value: 'Sister', label: 'Sister' },
                        ]}
                      />

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5 font-jakarta uppercase tracking-wider">
                          Nominee Phone
                        </label>
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50/80 hover:bg-white focus-within:bg-white border border-slate-200/90 rounded-xl focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/25 transition-all shadow-xs">
                          <Phone size={15} className="text-slate-400 shrink-0" />
                          <span className="text-xs font-bold text-slate-400 font-manrope pr-1 border-r border-slate-200">+91</span>
                          <input
                            type="tel"
                            value={formData.nomineePhone}
                            onChange={(e) => setFormData({ ...formData, nomineePhone: e.target.value })}
                            placeholder="98765 43224"
                            maxLength={10}
                            className="w-full bg-transparent text-xs text-[#0B1F3A] font-bold outline-none font-manrope tracking-wide"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Premium File Upload Dropzone Cards */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-2 font-jakarta uppercase tracking-wider">
                        KYC Documents & Photographs
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* 1. Customer Photo */}
                        <div
                          className={`rounded-xl border transition-all p-3.5 ${
                            formData.customerPhotoUrl
                              ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200'
                              : 'bg-slate-50/80 hover:bg-amber-50/30 border-dashed border-slate-300 hover:border-[#D4AF37]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
                                {formData.customerPhotoUrl ? (
                                  <img src={formData.customerPhotoUrl} alt="Customer" className="w-full h-full object-cover" />
                                ) : (
                                  <Camera size={20} className="text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-[#0B1F3A] truncate font-jakarta">Customer Photo</h4>
                                {formData.customerPhotoUrl ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md mt-0.5">
                                    <Check size={11} className="stroke-[3]" /> Photo Attached
                                  </span>
                                ) : (
                                  <p className="text-[10.5px] text-slate-400 font-medium truncate">JPG, PNG up to 5MB</p>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0">
                              {formData.customerPhotoUrl ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile('customerPhotoUrl')}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Remove photo"
                                >
                                  <Trash2 size={15} />
                                </button>
                              ) : (
                                <label className="px-3 py-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#163660] text-[#D4AF37] text-[11px] font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1">
                                  <Upload size={12} />
                                  <span>Browse</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload('customerPhotoUrl', e)}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 2. Nominee Photo */}
                        <div
                          className={`rounded-xl border transition-all p-3.5 ${
                            formData.nomineePhotoUrl
                              ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200'
                              : 'bg-slate-50/80 hover:bg-amber-50/30 border-dashed border-slate-300 hover:border-[#D4AF37]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
                                {formData.nomineePhotoUrl ? (
                                  <img src={formData.nomineePhotoUrl} alt="Nominee" className="w-full h-full object-cover" />
                                ) : (
                                  <UserCheck size={20} className="text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-[#0B1F3A] truncate font-jakarta">Nominee Photo</h4>
                                {formData.nomineePhotoUrl ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md mt-0.5">
                                    <Check size={11} className="stroke-[3]" /> Photo Attached
                                  </span>
                                ) : (
                                  <p className="text-[10.5px] text-slate-400 font-medium truncate">JPG, PNG up to 5MB</p>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0">
                              {formData.nomineePhotoUrl ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile('nomineePhotoUrl')}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Remove photo"
                                >
                                  <Trash2 size={15} />
                                </button>
                              ) : (
                                <label className="px-3 py-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#163660] text-[#D4AF37] text-[11px] font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1">
                                  <Upload size={12} />
                                  <span>Browse</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload('nomineePhotoUrl', e)}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 3. Aadhaar Front Document */}
                        <div
                          className={`rounded-xl border transition-all p-3.5 ${
                            formData.aadhaarFrontUrl
                              ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200'
                              : 'bg-slate-50/80 hover:bg-amber-50/30 border-dashed border-slate-300 hover:border-[#D4AF37]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
                                {formData.aadhaarFrontUrl ? (
                                  formData.aadhaarFrontUrl.startsWith('data:application/pdf') ? (
                                    <FileText size={20} className="text-emerald-600" />
                                  ) : (
                                    <img src={formData.aadhaarFrontUrl} alt="Aadhaar Front" className="w-full h-full object-cover" />
                                  )
                                ) : (
                                  <Shield size={20} className="text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-[#0B1F3A] truncate font-jakarta">Aadhaar Front Document</h4>
                                {formData.aadhaarFrontUrl ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md mt-0.5">
                                    <Check size={11} className="stroke-[3]" /> Document Attached
                                  </span>
                                ) : (
                                  <p className="text-[10.5px] text-slate-400 font-medium truncate">JPG, PNG, PDF up to 5MB</p>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0">
                              {formData.aadhaarFrontUrl ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile('aadhaarFrontUrl')}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Remove document"
                                >
                                  <Trash2 size={15} />
                                </button>
                              ) : (
                                <label className="px-3 py-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#163660] text-[#D4AF37] text-[11px] font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1">
                                  <Upload size={12} />
                                  <span>Browse</span>
                                  <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => handleFileUpload('aadhaarFrontUrl', e)}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 4. Aadhaar Back Document */}
                        <div
                          className={`rounded-xl border transition-all p-3.5 ${
                            formData.aadhaarBackUrl
                              ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200'
                              : 'bg-slate-50/80 hover:bg-amber-50/30 border-dashed border-slate-300 hover:border-[#D4AF37]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
                                {formData.aadhaarBackUrl ? (
                                  formData.aadhaarBackUrl.startsWith('data:application/pdf') ? (
                                    <FileText size={20} className="text-emerald-600" />
                                  ) : (
                                    <img src={formData.aadhaarBackUrl} alt="Aadhaar Back" className="w-full h-full object-cover" />
                                  )
                                ) : (
                                  <Shield size={20} className="text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-[#0B1F3A] truncate font-jakarta">Aadhaar Back Document</h4>
                                {formData.aadhaarBackUrl ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md mt-0.5">
                                    <Check size={11} className="stroke-[3]" /> Document Attached
                                  </span>
                                ) : (
                                  <p className="text-[10.5px] text-slate-400 font-medium truncate">JPG, PNG, PDF up to 5MB</p>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0">
                              {formData.aadhaarBackUrl ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile('aadhaarBackUrl')}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Remove document"
                                >
                                  <Trash2 size={15} />
                                </button>
                              ) : (
                                <label className="px-3 py-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#163660] text-[#D4AF37] text-[11px] font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1">
                                  <Upload size={12} />
                                  <span>Browse</span>
                                  <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => handleFileUpload('aadhaarBackUrl', e)}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Footer Actions */}
                <div className="bg-gradient-to-r from-[#FAF8F4] via-white to-[#FAF8F4] px-5 sm:px-7 py-4 border-t border-[#E8DFC8] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 font-jakarta">
                  <div className="text-[11.5px] text-[#64748B] font-medium flex items-center justify-center sm:justify-start gap-1">
                    <span>Fields marked with</span>
                    <span className="text-rose-500 font-bold">*</span>
                    <span>are mandatory</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setIsFormModalOpen(false)}
                      className="px-5 py-2.5 min-h-[44px] rounded-xl border border-slate-200/90 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center active:scale-[0.98]"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center justify-center gap-2 px-7 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-[#D8B042] via-[#E5C158] to-[#C99E2E] hover:from-[#E0B84A] hover:to-[#B8860B] text-[#0F1F38] text-xs font-black tracking-wide uppercase shadow-[0_8px_20px_-2px_rgba(212,175,55,0.5)] hover:shadow-[0_10px_24px_-2px_rgba(212,175,55,0.65)] transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      {isSaving ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-[#0F1F38]/30 border-t-[#0F1F38] rounded-full animate-spin" />
                          Saving Changes...
                        </span>
                      ) : (
                        <>
                          <Check size={15} strokeWidth={3} />
                          <span>{editingCustomerId ? 'Save Changes' : 'Enroll Customer'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
};

export default CustomerListPage;
