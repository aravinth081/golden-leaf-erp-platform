// ──────────────────────────────────────────────────
// Golden Leaf Finance — Gold Loan Appraisal & Sanction Workspace
// Multi-Row Ornament Table • Automatic Carat Formula • Dual-Custody Vault Lock
// ──────────────────────────────────────────────────

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Trash2, Camera, ShieldCheck, Sparkles,
  Calculator, Lock, CheckCircle2, User, Phone, Check,
  AlertTriangle, Upload, Eye, Loader2, Cloud
} from 'lucide-react';
import { goldLoanService } from '../../../../services/goldLoanService';
import { uploadImage } from '../../../../services/cloudinary';
import {
  type GoldLoanRecord,
  type GoldAppraisalItem,
  type GoldOrnamentType,
  type GoldCaratPurity,
  type GoldRepaymentScheme,
  type CroGoldReferral,
} from '../../../../types/goldLoan.types';
import { useAuthStore, useUIStore } from '../../../../store';

interface GoldLoanAppraisalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLoan: GoldLoanRecord) => void;
  initialReferral?: CroGoldReferral | null;
}

// Client-side image compressor: Keeps photos crisp while saving easily into local persistent store
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const maxWidth = 960;
        const maxHeight = 960;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => resolve(event.target?.result as string);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const GoldLoanAppraisalModal: React.FC<GoldLoanAppraisalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialReferral,
}) => {
  const { addToast } = useUIStore();
  const currentUser = useAuthStore((s) => s.user);
  const rateMaster = goldLoanService.getRateMaster();
  const pendingReferrals = goldLoanService.getCroReferrals().filter((r) => r.status === 'PENDING');

  // Live Verification Photos State (Manual Upload, Cloudinary Cloud Hosting & Preview)
  const [ornamentTrayPhoto, setOrnamentTrayPhoto] = useState<string | null>(null);
  const [customerCounterPhoto, setCustomerCounterPhoto] = useState<string | null>(null);
  const [isUploadingTray, setIsUploadingTray] = useState(false);
  const [isUploadingCounter, setIsUploadingCounter] = useState(false);
  const [previewPhotoModal, setPreviewPhotoModal] = useState<{ url: string; title: string } | null>(null);
  const trayInputRef = useRef<HTMLInputElement>(null);
  const counterInputRef = useRef<HTMLInputElement>(null);

  // Photo Upload (Cloudinary Cloud Storage with instant local preview)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'tray' | 'counter') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'tray') {
      setIsUploadingTray(true);
    } else {
      setIsUploadingCounter(true);
    }

    try {
      // 1. Instant local preview
      const localCompressed = await compressImage(file);
      if (type === 'tray') {
        setOrnamentTrayPhoto(localCompressed);
      } else {
        setCustomerCounterPhoto(localCompressed);
      }

      // 2. Upload to Cloudinary
      try {
        const folder = type === 'tray' ? 'gold-loans/ornament-trays' : 'gold-loans/counter-photos';
        const res = await uploadImage(file, folder);
        if (res?.secure_url) {
          if (type === 'tray') {
            setOrnamentTrayPhoto(res.secure_url);
            addToast({
              type: 'success',
              title: 'Saved in Cloudinary',
              message: 'Ornament tray photo uploaded to Cloudinary successfully.',
            });
          } else {
            setCustomerCounterPhoto(res.secure_url);
            addToast({
              type: 'success',
              title: 'Saved in Cloudinary',
              message: 'Customer counter photo uploaded to Cloudinary successfully.',
            });
          }
        }
      } catch (cloudErr: any) {
        console.warn('Cloudinary upload notification (using persistent local copy):', cloudErr);
        addToast({
          type: 'info',
          title: 'Photo Saved Locally',
          message: 'Saved to local vault. Will sync with Cloudinary automatically.',
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: err.message || 'Failed to process selected image file.',
      });
    } finally {
      if (type === 'tray') {
        setIsUploadingTray(false);
      } else {
        setIsUploadingCounter(false);
      }
    }

    // Reset input value so same file can be selected again if removed
    e.target.value = '';
  };

  const handleRemovePhoto = (e: React.MouseEvent, type: 'tray' | 'counter') => {
    e.stopPropagation();
    if (type === 'tray') {
      setOrnamentTrayPhoto(null);
      if (trayInputRef.current) trayInputRef.current.value = '';
      addToast({
        type: 'info',
        title: 'Photo Removed',
        message: 'Ornament tray photo was removed.',
      });
    } else {
      setCustomerCounterPhoto(null);
      if (counterInputRef.current) counterInputRef.current.value = '';
      addToast({
        type: 'info',
        title: 'Photo Removed',
        message: 'Customer counter photo was removed.',
      });
    }
  };

  // Borrower State
  const [customerName, setCustomerName] = useState(initialReferral?.customerName || '');
  const [customerMobile, setCustomerMobile] = useState(initialReferral?.customerMobile || '');
  const [customerAddress, setCustomerAddress] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('Spouse');
  const [croReferralId, setCroReferralId] = useState(initialReferral?.id || '');
  const [referringEmployeeId, setReferringEmployeeId] = useState(initialReferral?.employeeId || '');
  const [legalOwnershipDeclared, setLegalOwnershipDeclared] = useState(true);

  // Ornament Appraisal Rows
  const [items, setItems] = useState<GoldAppraisalItem[]>([
    {
      id: 'ITEM-1',
      ornamentType: 'Thali Chain',
      quantity: 1,
      grossWeightGrams: 24.8,
      stoneDeductionGrams: 0.8,
      netWeightGrams: 24.0,
      caratPurity: '22K',
      ratePerGram: rateMaster.daily22KRatePerGram,
      eligibleMarketValue: Math.round(24.0 * rateMaster.daily22KRatePerGram),
      conditionRemarks: 'Solid hallmark 22K, hook intact',
    },
    {
      id: 'ITEM-2',
      ornamentType: 'Bangles',
      quantity: 2,
      grossWeightGrams: 16.5,
      stoneDeductionGrams: 0.5,
      netWeightGrams: 16.0,
      caratPurity: '22K',
      ratePerGram: rateMaster.daily22KRatePerGram,
      eligibleMarketValue: Math.round(16.0 * rateMaster.daily22KRatePerGram),
      conditionRemarks: 'Good wearable condition',
    },
  ]);

  // Loan Scheme & Financials
  const [repaymentScheme, setRepaymentScheme] = useState<GoldRepaymentScheme>('Monthly Interest Servicing');
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [sanctionedAmount, setSanctionedAmount] = useState<number>(180000);
  const [interestRateAnnual, setInterestRateAnnual] = useState<number>(12.0); // 1% per month
  const [appraiserFee, setAppraiserFee] = useState<number>(500);

  // Tamper-Proof Packet & Vault Slot
  const [packetSerialNo, setPacketSerialNo] = useState(`GLF-PKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [safeNo, setSafeNo] = useState('SAFE-01');
  const [rackNo, setRackNo] = useState('RACK-B');
  const [traySlot, setTraySlot] = useState('TRAY-04');

  // Dual-Custody Sign-offs
  const [isCmSigned, setIsCmSigned] = useState(true);
  const [isBmSigned, setIsBmSigned] = useState(true);

  // Appraisal Sum Calculations
  const appraisalTotals = useMemo(() => {
    let totalQty = 0;
    let totalGross = 0;
    let totalStone = 0;
    let totalNet = 0;
    let totalMarketVal = 0;

    items.forEach((item) => {
      totalQty += item.quantity || 0;
      totalGross += item.grossWeightGrams || 0;
      totalStone += item.stoneDeductionGrams || 0;
      totalNet += item.netWeightGrams || 0;
      totalMarketVal += item.eligibleMarketValue || 0;
    });

    const maxEligible = Math.round((totalMarketVal * rateMaster.maxPermittedLtvPercent) / 100);

    return {
      totalQty,
      totalGross: Math.round(totalGross * 1000) / 1000,
      totalStone: Math.round(totalStone * 1000) / 1000,
      totalNet: Math.round(totalNet * 1000) / 1000,
      totalMarketVal,
      maxEligible,
    };
  }, [items, rateMaster.maxPermittedLtvPercent]);

  // Auto-sync default sanctioned amount when eligible changes
  React.useEffect(() => {
    if (sanctionedAmount > appraisalTotals.maxEligible || sanctionedAmount === 0) {
      setSanctionedAmount(appraisalTotals.maxEligible);
    }
  }, [appraisalTotals.maxEligible]);

  // Monthly interest amount
  const monthlyInterest = Math.round((sanctionedAmount * (interestRateAnnual / 100)) / 12);
  const netDisbursal = Math.max(0, sanctionedAmount - appraiserFee);

  // Add Item Row
  const handleAddItem = () => {
    const rate = goldLoanService.getRateForPurity('22K');
    const newItem: GoldAppraisalItem = {
      id: `ITEM-${Date.now()}`,
      ornamentType: 'Ring',
      quantity: 1,
      grossWeightGrams: 8.0,
      stoneDeductionGrams: 0.0,
      netWeightGrams: 8.0,
      caratPurity: '22K',
      ratePerGram: rate,
      eligibleMarketValue: Math.round(8.0 * rate),
      conditionRemarks: '',
    };
    setItems([...items, newItem]);
  };

  // Remove Item Row
  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) {
      addToast({ type: 'info', title: 'At Least One Item Required', message: 'You must maintain at least one pledged item.' });
      return;
    }
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
  };

  // Update Item Row with Auto Carat & Net Weight calculations
  const handleUpdateItem = (idx: number, field: keyof GoldAppraisalItem, value: any) => {
    const updated = [...items];
    const current = { ...updated[idx], [field]: value };

    // Auto Net Weight Calculation: Gross - Stone
    if (field === 'grossWeightGrams' || field === 'stoneDeductionGrams') {
      const gross = field === 'grossWeightGrams' ? parseFloat(value) || 0 : current.grossWeightGrams;
      const stone = field === 'stoneDeductionGrams' ? parseFloat(value) || 0 : current.stoneDeductionGrams;
      current.netWeightGrams = Math.max(0, Math.round((gross - stone) * 1000) / 1000);
    }

    // Auto Carat Purity Adjustment: Carat rate formula
    if (field === 'caratPurity') {
      current.ratePerGram = goldLoanService.getRateForPurity(value as GoldCaratPurity);
    }

    // Auto Market Value: Net Wt * Rate/g
    current.eligibleMarketValue = Math.round(current.netWeightGrams * current.ratePerGram);

    updated[idx] = current;
    setItems(updated);
  };

  // Pull from referral queue
  const handlePullReferral = (ref: CroGoldReferral) => {
    setCustomerName(ref.customerName);
    setCustomerMobile(ref.customerMobile);
    setCroReferralId(ref.id);
    setReferringEmployeeId(ref.employeeId);
    addToast({
      type: 'success',
      title: 'Referral Loaded',
      message: `Pulled ${ref.customerName} (Referred by ${ref.employeeId}).`,
    });
  };

  const handleCreateGoldLoan = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerMobile || !nomineeName) {
      addToast({ type: 'error', title: 'Mandatory Fields Missing', message: 'Enter Borrower Name, Mobile, and Nominee details.' });
      return;
    }

    if (sanctionedAmount > appraisalTotals.maxEligible) {
      addToast({
        type: 'error',
        title: 'LTV Violation (Max 75% Limit)',
        message: `Sanctioned amount ₹${sanctionedAmount.toLocaleString('en-IN')} cannot exceed max eligible limit ₹${appraisalTotals.maxEligible.toLocaleString('en-IN')}.`,
      });
      return;
    }

    const newLoan = goldLoanService.createGoldLoan({
      customerName,
      customerMobile,
      customerAddress: customerAddress || 'Door 14, High Road, Chennai',
      aadhaarNumber: aadhaarNumber || 'XXXX-XXXX-4512',
      panNumber: panNumber || 'ABCDE1234F',
      nomineeName,
      nomineeRelationship: nomineeRelation,
      legalOwnershipDeclared,
      croReferralId: croReferralId || undefined,
      referringEmployeeId: referringEmployeeId || undefined,

      items,
      totalQuantity: appraisalTotals.totalQty,
      totalGrossWeightGrams: appraisalTotals.totalGross,
      totalStoneDeductionGrams: appraisalTotals.totalStone,
      totalNetWeightGrams: appraisalTotals.totalNet,
      totalAppraisedEligibleValue: appraisalTotals.totalMarketVal,

      liveOrnamentTrayPhotoUrl: ornamentTrayPhoto || undefined,
      liveCustomerCounterPhotoUrl: customerCounterPhoto || undefined,

      maxEligibleLoanAmount: appraisalTotals.maxEligible,
      sanctionedLoanAmount: sanctionedAmount,
      repaymentScheme,
      tenureMonths,
      interestRateAnnual,
      monthlyInterestAmount: monthlyInterest,
      appraiserFeeAmount: appraiserFee,
      netDisbursedAmount: netDisbursal,

      tamperProofPacketSerialNo: packetSerialNo,
      safeVaultLocation: {
        safeNumber: safeNo,
        rackCabinet: rackNo,
        traySlot,
      },

      dualCustodySignoff: {
        isCreditManagerAppraised: isCmSigned,
        creditManagerName: isCmSigned ? currentUser?.displayName || 'Credit Manager' : undefined,
        creditManagerSignedAt: isCmSigned ? new Date().toLocaleString('en-IN') : undefined,
        isBranchManagerVaultLocked: isBmSigned,
        branchManagerName: isBmSigned ? currentUser?.displayName || 'Branch Manager' : undefined,
        branchManagerSignedAt: isBmSigned ? new Date().toLocaleString('en-IN') : undefined,
      },
    });

    addToast({
      type: 'success',
      title: 'Gold Loan Appraised & Sealed',
      message: `Account ${newLoan.id} sealed in packet ${packetSerialNo} and locked in ${safeNo}.`,
    });

    onSuccess(newLoan);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative bg-white rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col font-body text-xs"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-[#0B1F3A] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-white/10 text-[#D4AF37]">
                <Sparkles size={20} />
              </span>
              <div>
                <h2 className="text-base font-extrabold tracking-tight">
                  Gold Loan Appraisal & Safe Vault Sanction Workspace
                </h2>
                <p className="text-xs text-gray-300">
                  Daily 22K Rate: <strong className="text-[#D4AF37]">₹{rateMaster.daily22KRatePerGram}/g</strong> (Max {rateMaster.maxPermittedLtvPercent}% LTV) • Dual-Custody Vault Verification
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Pull from CRO Referral Queue Bar */}
          {pendingReferrals.length > 0 && (
            <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-2 overflow-x-auto text-xs">
              <span className="text-amber-900 font-bold shrink-0">
                Incoming CRO Referrals ({pendingReferrals.length}):
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {pendingReferrals.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handlePullReferral(r)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100/70 text-[#0B1F3A] font-bold text-[11px] shrink-0 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>{r.customerName}</span>
                    <span className="text-[10px] text-gray-500 font-mono">({r.customerMobile.slice(-4)})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form Body */}
          <form onSubmit={handleCreateGoldLoan} className="p-5 sm:p-6 overflow-y-auto space-y-5 grow">
            {/* ─── SECTION 1: BORROWER KYC & NOMINEE ─── */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
              <span className="font-extrabold text-[#0B1F3A] uppercase tracking-wider block text-xs">
                Section 1: Borrower KYC, Nominee & Ownership Declaration
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Borrower Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Borrower name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg font-bold text-[#0B1F3A]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Mobile Number (10 Digits) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Nominee Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nominee name"
                    value={nomineeName}
                    onChange={(e) => setNomineeName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Nominee Relationship</label>
                  <select
                    value={nomineeRelation}
                    onChange={(e) => setNomineeRelation(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg font-medium"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Brother">Brother</option>
                  </select>
                </div>
              </div>

              {/* Ownership Checkbox */}
              <label className="flex items-center gap-2 pt-1 text-[11px] text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={legalOwnershipDeclared}
                  onChange={(e) => setLegalOwnershipDeclared(e.target.checked)}
                  className="rounded text-[#0B1F3A]"
                />
                <span>
                  <strong>Legal Ownership Declaration:</strong> I hereby declare and confirm that all gold ornaments tendered for pledge are my sole, absolute personal property free from any family disputes, prior liens, or encumbrances.
                </span>
              </label>
            </div>

            {/* ─── SECTION 2: ORNAMENT ITEMIZATION TABLE (APPRAISAL MATRIX) ─── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-[#0B1F3A] uppercase tracking-wider text-xs">
                    Section 2: Ornament Appraisal Itemization
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    Net Weight (g) = Gross Weight (g) − Stone/Dirt Deduction (g). Carat rate scaled automatically.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132c4e] text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Plus size={13} />
                  <span>Add Ornament Row</span>
                </button>
              </div>

              {/* Table */}
              <div className="border border-gray-300 rounded-2xl overflow-x-auto w-full custom-scrollbar shadow-2xs">
                <table className="w-full text-left text-xs min-w-[850px]">
                  <thead className="bg-[#0B1F3A] text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Ornament Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Gross Wt (g)</th>
                      <th className="p-2.5 text-right">Stone Less (g)</th>
                      <th className="p-2.5 text-right">Net Wt (g)</th>
                      <th className="p-2.5 text-center">Purity</th>
                      <th className="p-2.5 text-right">Rate / g</th>
                      <th className="p-2.5 text-right">Eligible Value (₹)</th>
                      <th className="p-2.5">Condition Remarks</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50/60">
                        <td className="p-2.5 font-bold font-mono text-gray-500">{idx + 1}</td>
                        <td className="p-2">
                          <select
                            value={item.ornamentType}
                            onChange={(e) => handleUpdateItem(idx, 'ornamentType', e.target.value)}
                            className="w-full p-1.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-[#0B1F3A]"
                          >
                            <option value="Thali Chain">Thali Chain</option>
                            <option value="Chain">Chain</option>
                            <option value="Necklace">Necklace</option>
                            <option value="Haram">Haram</option>
                            <option value="Bangles">Bangles</option>
                            <option value="Bracelet">Bracelet</option>
                            <option value="Ring">Ring</option>
                            <option value="Earrings / Studs">Earrings / Studs</option>
                            <option value="Waist Belt">Waist Belt</option>
                            <option value="Locket">Locket</option>
                            <option value="Other Ornaments">Other Ornaments</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-12 p-1.5 text-center bg-gray-50 border border-gray-200 rounded-lg font-bold"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            step="0.001"
                            value={item.grossWeightGrams}
                            onChange={(e) => handleUpdateItem(idx, 'grossWeightGrams', e.target.value)}
                            className="w-20 p-1.5 text-right bg-gray-50 border border-gray-200 rounded-lg font-mono font-bold"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            step="0.001"
                            value={item.stoneDeductionGrams}
                            onChange={(e) => handleUpdateItem(idx, 'stoneDeductionGrams', e.target.value)}
                            className="w-20 p-1.5 text-right bg-gray-50 border border-gray-200 rounded-lg font-mono text-red-700"
                          />
                        </td>
                        <td className="p-2 text-right font-mono font-extrabold text-emerald-800">
                          {item.netWeightGrams.toFixed(3)}g
                        </td>
                        <td className="p-2 text-center">
                          <select
                            value={item.caratPurity}
                            onChange={(e) => handleUpdateItem(idx, 'caratPurity', e.target.value)}
                            className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs"
                          >
                            <option value="22K">22K</option>
                            <option value="20K">20K</option>
                            <option value="18K">18K</option>
                          </select>
                        </td>
                        <td className="p-2 text-right font-mono text-gray-700">
                          ₹{item.ratePerGram.toLocaleString('en-IN')}
                        </td>
                        <td className="p-2 text-right font-mono font-extrabold text-[#0B1F3A]">
                          ₹{item.eligibleMarketValue.toLocaleString('en-IN')}
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Stones missing / hooks"
                            value={item.conditionRemarks || ''}
                            onChange={(e) => handleUpdateItem(idx, 'conditionRemarks', e.target.value)}
                            className="w-full p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[11px]"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* SUM ROW */}
                    <tr className="bg-amber-50/80 font-black text-xs border-t-2 border-amber-300">
                      <td colSpan={2} className="p-2.5 text-[#0B1F3A] uppercase tracking-wider">
                        TOTAL APPRAISED SUMMARY:
                      </td>
                      <td className="p-2.5 text-center font-mono">{appraisalTotals.totalQty} Pcs</td>
                      <td className="p-2.5 text-right font-mono">{appraisalTotals.totalGross.toFixed(3)}g</td>
                      <td className="p-2.5 text-right font-mono text-red-700">-{appraisalTotals.totalStone.toFixed(3)}g</td>
                      <td className="p-2.5 text-right font-mono text-emerald-900 text-sm">
                        {appraisalTotals.totalNet.toFixed(3)}g
                      </td>
                      <td className="p-2.5 text-center text-gray-500">MIX</td>
                      <td className="p-2.5 text-right text-[10px] text-gray-500 uppercase font-bold">MAX 75% LTV:</td>
                      <td className="p-2.5 text-right font-mono font-black text-emerald-950 text-sm">
                        ₹{appraisalTotals.maxEligible.toLocaleString('en-IN')}
                      </td>
                      <td colSpan={2} className="p-2.5 text-[10px] text-gray-500">
                        Total Value: ₹{appraisalTotals.totalMarketVal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ─── SECTION 3: LIVE PHOTOS & LOAN SCHEME ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Photo Verification Box */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#0B1F3A] uppercase tracking-wider block text-xs">
                    Mandatory Live Photos (Webcam / Upload)
                  </span>
                  <span className="text-[10px] text-gray-500 font-semibold">
                    Manual Upload
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  {/* Photo 1: Ornament Tray Photo */}
                  <div
                    className={`p-3 bg-white rounded-xl border-2 ${
                      ornamentTrayPhoto
                        ? 'border-emerald-500 shadow-xs'
                        : 'border-dashed border-emerald-400'
                    } space-y-2 flex flex-col justify-between transition-all`}
                  >
                    <input
                      ref={trayInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, 'tray')}
                    />

                    {ornamentTrayPhoto ? (
                      <div className="relative group w-full">
                        <div
                          onClick={() =>
                            setPreviewPhotoModal({
                              url: ornamentTrayPhoto,
                              title: '1. Ornament Tray Photo (Jewels on Weighing Scale)',
                            })
                          }
                          className="w-full h-24 rounded-lg overflow-hidden border border-emerald-200 bg-gray-100 flex items-center justify-center cursor-pointer relative"
                        >
                          <img
                            src={ornamentTrayPhoto}
                            alt="Ornament Tray on Scale"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye size={18} />
                          </div>

                          {isUploadingTray && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-1 z-20">
                              <Loader2 size={20} className="animate-spin text-[#D4AF37]" />
                              <span className="text-[9px] font-bold">Uploading to Cloudinary...</span>
                            </div>
                          )}
                        </div>

                        {/* Remove Button — ONLY removes photo when user explicitly clicks */}
                        <button
                          type="button"
                          onClick={(e) => handleRemovePhoto(e, 'tray')}
                          className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md transition-all cursor-pointer flex items-center justify-center hover:scale-110 z-10"
                          title="Remove Photo"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => !isUploadingTray && trayInputRef.current?.click()}
                        className="w-full h-24 bg-emerald-50 hover:bg-emerald-100/70 rounded-lg flex flex-col items-center justify-center text-emerald-800 cursor-pointer transition-all border border-emerald-200/60 group relative"
                      >
                        {isUploadingTray ? (
                          <div className="flex flex-col items-center justify-center gap-1">
                            <Loader2 size={22} className="animate-spin text-emerald-700" />
                            <span className="text-[9px] font-bold text-emerald-900">Uploading to Cloudinary...</span>
                          </div>
                        ) : (
                          <>
                            <Camera size={24} className="mb-1 text-emerald-600 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold text-emerald-900">Upload Photo</span>
                            <span className="text-[9px] text-emerald-700 font-medium">Click to choose image</span>
                          </>
                        )}
                      </div>
                    )}

                    <div className="space-y-0.5">
                      <strong className="block text-[11px] text-emerald-950">1. Ornament Tray Photo</strong>
                      <span className="text-[9px] text-gray-500 block leading-tight">All jewels placed on weighing scale tray</span>
                    </div>

                    <div className="pt-1 flex items-center justify-center gap-1.5">
                      {ornamentTrayPhoto ? (
                        <>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px] flex items-center gap-1">
                            {ornamentTrayPhoto.startsWith('http') ? (
                              <>
                                <Cloud size={10} className="text-emerald-700" />
                                <span>Cloudinary Stored</span>
                              </>
                            ) : (
                              <>
                                <Check size={10} />
                                <span>High-Res Attached</span>
                              </>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => trayInputRef.current?.click()}
                            className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[9px] cursor-pointer transition-colors"
                          >
                            Change
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => trayInputRef.current?.click()}
                          disabled={isUploadingTray}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                        >
                          <Upload size={11} />
                          <span>Select Photo</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Photo 2: Customer Counter Photo */}
                  <div
                    className={`p-3 bg-white rounded-xl border-2 ${
                      customerCounterPhoto
                        ? 'border-blue-500 shadow-xs'
                        : 'border-dashed border-blue-400'
                    } space-y-2 flex flex-col justify-between transition-all`}
                  >
                    <input
                      ref={counterInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, 'counter')}
                    />

                    {customerCounterPhoto ? (
                      <div className="relative group w-full">
                        <div
                          onClick={() =>
                            setPreviewPhotoModal({
                              url: customerCounterPhoto,
                              title: '2. Customer Counter Photo (Borrower at Counter)',
                            })
                          }
                          className="w-full h-24 rounded-lg overflow-hidden border border-blue-200 bg-gray-100 flex items-center justify-center cursor-pointer relative"
                        >
                          <img
                            src={customerCounterPhoto}
                            alt="Borrower at Counter"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye size={18} />
                          </div>

                          {isUploadingCounter && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-1 z-20">
                              <Loader2 size={20} className="animate-spin text-[#D4AF37]" />
                              <span className="text-[9px] font-bold">Uploading to Cloudinary...</span>
                            </div>
                          )}
                        </div>

                        {/* Remove Button — ONLY removes photo when user explicitly clicks */}
                        <button
                          type="button"
                          onClick={(e) => handleRemovePhoto(e, 'counter')}
                          className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md transition-all cursor-pointer flex items-center justify-center hover:scale-110 z-10"
                          title="Remove Photo"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => !isUploadingCounter && counterInputRef.current?.click()}
                        className="w-full h-24 bg-blue-50 hover:bg-blue-100/70 rounded-lg flex flex-col items-center justify-center text-blue-800 cursor-pointer transition-all border border-blue-200/60 group relative"
                      >
                        {isUploadingCounter ? (
                          <div className="flex flex-col items-center justify-center gap-1">
                            <Loader2 size={22} className="animate-spin text-blue-700" />
                            <span className="text-[9px] font-bold text-blue-900">Uploading to Cloudinary...</span>
                          </div>
                        ) : (
                          <>
                            <User size={24} className="mb-1 text-blue-600 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold text-blue-900">Upload Photo</span>
                            <span className="text-[9px] text-blue-700 font-medium">Click to choose image</span>
                          </>
                        )}
                      </div>
                    )}

                    <div className="space-y-0.5">
                      <strong className="block text-[11px] text-blue-950">2. Customer Counter Photo</strong>
                      <span className="text-[9px] text-gray-500 block leading-tight">Borrower executing pledge at branch</span>
                    </div>

                    <div className="pt-1 flex items-center justify-center gap-1.5">
                      {customerCounterPhoto ? (
                        <>
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[9px] flex items-center gap-1">
                            {customerCounterPhoto.startsWith('http') ? (
                              <>
                                <Cloud size={10} className="text-blue-700" />
                                <span>Cloudinary Stored</span>
                              </>
                            ) : (
                              <>
                                <Check size={10} />
                                <span>Attached</span>
                              </>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => counterInputRef.current?.click()}
                            className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[9px] cursor-pointer transition-colors"
                          >
                            Change
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => counterInputRef.current?.click()}
                          disabled={isUploadingCounter}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                        >
                          <Upload size={11} />
                          <span>Select Photo</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan Scheme & Sanction Input */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-3">
                <span className="font-extrabold text-[#0B1F3A] uppercase tracking-wider block text-xs">
                  Loan Scheme, Tenure & Sanction Amount
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                      Requested Sanction Amount (Max: ₹{appraisalTotals.maxEligible.toLocaleString('en-IN')}) *
                    </label>
                    <input
                      type="number"
                      max={appraisalTotals.maxEligible}
                      value={sanctionedAmount}
                      onChange={(e) => setSanctionedAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl font-black text-emerald-900 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Repayment Scheme</label>
                    <select
                      value={repaymentScheme}
                      onChange={(e) => setRepaymentScheme(e.target.value as any)}
                      className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-bold"
                    >
                      <option value="Monthly Interest Servicing">Monthly Interest Servicing</option>
                      <option value="Bullet Repayment (3 Months)">Bullet Repayment (3M)</option>
                      <option value="Bullet Repayment (6 Months)">Bullet Repayment (6M)</option>
                      <option value="Bullet Repayment (12 Months)">Bullet Repayment (12M)</option>
                      <option value="Monthly EMI">Monthly EMI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Tenure (Months)</label>
                    <input
                      type="number"
                      value={tenureMonths}
                      onChange={(e) => setTenureMonths(parseInt(e.target.value) || 12)}
                      className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Interest Rate (% p.a.)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={interestRateAnnual}
                      onChange={(e) => setInterestRateAnnual(parseFloat(e.target.value) || 12)}
                      className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Monthly Interest (₹)</label>
                    <div className="px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg font-bold font-mono text-blue-900">
                      ₹{monthlyInterest.toLocaleString('en-IN')}/mo
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── SECTION 4: TAMPER-PROOF VAULT SLOT & DUAL-CUSTODY ─── */}
            <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-2xl space-y-3">
              <span className="font-extrabold text-[#0B1F3A] uppercase tracking-wider block text-xs flex items-center gap-2">
                <Lock size={15} className="text-[#D4AF37]" />
                Tamper-Proof Pouch Serial & Dual-Custody Safe Vault Verification
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                    Tamper-Proof Pouch Serial No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={packetSerialNo}
                    onChange={(e) => setPacketSerialNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-mono font-black text-amber-950 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Safe Vault & Rack No</label>
                  <div className="flex gap-1.5">
                    <select
                      value={safeNo}
                      onChange={(e) => setSafeNo(e.target.value)}
                      className="w-1/2 px-2 py-1.5 bg-white border border-amber-300 rounded-lg font-bold"
                    >
                      <option value="SAFE-01">SAFE-01</option>
                      <option value="SAFE-02">SAFE-02</option>
                    </select>
                    <select
                      value={rackNo}
                      onChange={(e) => setRackNo(e.target.value)}
                      className="w-1/2 px-2 py-1.5 bg-white border border-amber-300 rounded-lg font-bold"
                    >
                      <option value="RACK-A">RACK-A</option>
                      <option value="RACK-B">RACK-B</option>
                      <option value="RACK-C">RACK-C</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Tray Slot Position</label>
                  <input
                    type="text"
                    value={traySlot}
                    onChange={(e) => setTraySlot(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              {/* Dual Custody Digital Sign-off Checkboxes */}
              <div className="pt-2 border-t border-amber-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="p-2.5 rounded-xl bg-white border border-amber-200 flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isCmSigned}
                    onChange={(e) => setIsCmSigned(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600"
                  />
                  <div>
                    <strong className="block text-gray-900 text-[11px]">1. Credit Manager (Appraiser) Sign-Off</strong>
                    <span className="text-[10px] text-gray-500">Confirmed weight, stone deduction & 18K-22K testing.</span>
                  </div>
                </label>

                <label className="p-2.5 rounded-xl bg-white border border-amber-200 flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isBmSigned}
                    onChange={(e) => setIsBmSigned(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600"
                  />
                  <div>
                    <strong className="block text-gray-900 text-[11px]">2. Branch Manager (Vault Custodian) Sign-Off</strong>
                    <span className="text-[10px] text-gray-500">Confirmed ornaments sealed in pouch & locked in safe.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-3 border-t border-gray-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-center"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132c4e] text-white font-extrabold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px]"
              >
                <Check size={16} />
                <span>Sanction & Lock Gold in Safe Vault</span>
              </button>
            </div>
          </form>
        </motion.div>

        {/* Full Image Preview Modal */}
        {previewPhotoModal && (
          <div
            onClick={() => setPreviewPhotoModal(null)}
            className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-[#0B1F3A] rounded-2xl overflow-hidden shadow-2xl border border-white/20"
            >
              <div className="p-3 bg-[#0B1F3A] text-white flex items-center justify-between border-b border-white/10">
                <span className="font-bold text-xs">{previewPhotoModal.title}</span>
                <button
                  type="button"
                  onClick={() => setPreviewPhotoModal(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-3 bg-black/40 flex items-center justify-center max-h-[70vh]">
                <img
                  src={previewPhotoModal.url}
                  alt={previewPhotoModal.title}
                  className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
