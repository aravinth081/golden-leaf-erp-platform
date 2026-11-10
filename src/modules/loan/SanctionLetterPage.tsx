// ──────────────────────────────────────────────────
// Golden Leaf Finance — Sanction Letter & Agreement Center
// Production-Ready • SaaS-Level Enterprise Document Management
// ──────────────────────────────────────────────────

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText, Search, Printer, CheckCircle2, Building,
  User, Sparkles, Filter, ChevronRight, ShieldCheck,
  Calendar, RotateCcw, AlertTriangle, ArrowRight
} from 'lucide-react';
import { SanctionLetterViewer } from './components/SanctionLetterViewer';
import { creditManagerService, type CreditApplicant } from '../../services/creditManagerService';
import { getStoredBranches, type DetailedBranch } from '../../services/branchService';
import { getMonitoredLoans } from '../../services/monitoringDataService';
import { SANCTION_TEMPLATE_METADATA } from '../../data/loanTermsData';
import { type SanctionLetterRecord } from '../../types/sanctionLetter.types';
import { useUIStore } from '../../store';

export const SanctionLetterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requestedLoanId = searchParams.get('loanId') || searchParams.get('id');

  const { addToast } = useUIStore();
  const branches = useMemo(() => getStoredBranches(), []);

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('all');

  // Load applicants from creditManagerService and active/disbursed loans
  const allApplicants = useMemo(() => {
    const list: CreditApplicant[] = [...creditManagerService.getApplicants()];

    // Also include genuine loans from monitored loans
    try {
      const monitoredLoans = getMonitoredLoans(null);
      for (const loan of monitoredLoans) {
        if (!list.some((a) => a.id === loan.id || a.sanctionLetterNo === loan.id)) {
          list.push({
            id: loan.id,
            customerId: loan.customerId,
            customerName: loan.customerName,
            branchId: loan.branchId,
            loanAmount: loan.principalAmount,
            recommendedAmount: loan.principalAmount,
            loanProduct: loan.planName,
            status: loan.status === 'Active' || loan.status === 'Disbursed' ? 'Approved' : 'In Review',
            appliedDate: loan.startDate,
            phone: '',
            address: `${loan.branchName || 'Branch Area'}`,
            aadhaarNumber: 'XXXX-XXXX-XXXX',
            proposedEmi: loan.weeklyAmount,
          } as unknown as CreditApplicant);
        }
      }
    } catch (e) {
      // Ignore
    }

    return list;
  }, []);

  const [selectedApplicantId, setSelectedApplicantId] = useState<string>(() => {
    if (requestedLoanId) return requestedLoanId;
    return allApplicants[0]?.id || '';
  });

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    return allApplicants.filter((app) => {
      const matchesBranch = selectedBranchId === 'all' || app.branchId === selectedBranchId;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        app.customerName.toLowerCase().includes(term) ||
        app.id.toLowerCase().includes(term) ||
        app.customerId.toLowerCase().includes(term) ||
        app.phone.includes(term);
      return matchesBranch && matchesSearch;
    });
  }, [allApplicants, selectedBranchId, searchTerm]);

  // Keep selected applicant valid when filter changes
  useEffect(() => {
    if (filteredApplicants.length > 0) {
      if (!filteredApplicants.some((a) => a.id === selectedApplicantId)) {
        setSelectedApplicantId(filteredApplicants[0].id);
      }
    } else {
      setSelectedApplicantId('');
    }
  }, [filteredApplicants, selectedApplicantId]);

  // Transform credit applicant to SanctionLetterRecord
  const transformApplicantToRecord = (app: CreditApplicant): Partial<SanctionLetterRecord> => {
    const loanAmt = app.recommendedAmount || app.loanAmount || 0;
    const docCharges = Math.round(loanAmt * 0.02);
    const gst = Math.round(docCharges * 0.18);
    const lifeIns = Math.round(loanAmt * 0.008);
    const genIns = loanAmt > 0 ? 300 : 0;
    const totalDeductions = docCharges + gst + lifeIns + genIns;
    const net = Math.max(0, loanAmt - totalDeductions);
    const branch = branches.find((b) => b.id === app.branchId);

    return {
      loanAccountNo: app.sanctionLetterNo || app.id,
      applicationFormNo: app.id,
      applicationDate: app.appliedDate || new Date().toLocaleDateString('en-GB'),
      sanctionDate: app.approvedAt ? app.approvedAt.slice(0, 10) : new Date().toLocaleDateString('en-GB'),
      place: branch ? `${branch.city.toUpperCase()} GLFL` : 'CHENNAI GLFL',
      branchName: branch ? branch.name : (app.branchId || 'Branch Office'),
      branchCode: app.branchId,

      applicantName: app.customerName,
      applicantPhone: app.phone,
      applicantAddress: app.address,
      applicantPan: app.panNumber || 'Not provided',
      applicantAadhaarMasked: app.aadhaarNumber,

      coApplicant1Name: app.fatherOrSpouseName || 'None',
      coApplicant1Relation: 'Co-Borrower',
      coApplicant2Name: app.nomineeName || 'None',
      coApplicant2Relation: app.nomineeRelation || 'Nominee',

      loanProduct: app.loanProduct || 'Standard Loan / Vyapaar Vriddhi',
      loanPurpose: app.loanPurpose || 'RETAIL TRADE & WORKING CAPITAL',
      fixedRoi: 24.5,
      loanAmount: loanAmt,
      tenureMonths: 24,
      numberOfEmis: 24,
      tentativeEmiAmount: app.proposedEmi || (loanAmt > 0 ? Math.round(loanAmt / 20) : 0),

      documentationCharges: docCharges,
      gstOnCharges: gst,
      lifeInsurancePremium: lifeIns,
      generalInsurancePremium: genIns,
      stampDutyCharges: 0,
      totalChargesDeducted: totalDeductions,
      existingLoanForeclosureAmount: 0,
      netDisbursementAmount: net,

      repaymentMode: 'NACH (National Automated Clearing House)',
      repaymentFrequency: 'Monthly',
      emiDueDate: 3,
      moratorium: 'NO (Not Applicable)',

      penalChargesText: '2% per month of the unpaid EMI or Rs. 300 whichever is higher',
      chequeBounceChargesText: '7.5% of the EMI outstanding + GST (minimum Rs. 400 + GST; maximum Rs. 1000 + GST)',
      swapChargesText: 'INR 500/- + GST as applicable',
      foreclosureChargesText: '4% of the principal outstanding amount + GST. For Micro & small tagged applications – Nil charge',
      foreclosureLockInDays: 180,
      partPaymentChargesText: '4% of Principal Loan Outstanding + GST as applicable',

      authorisedOfficerName: app.approvedBy?.split(' (')[0] || 'Authorised Branch Officer',
      authorisedOfficerEmpId: 'GLF-OFFICER',

      isElectronicallySigned: true,
      eSignTimestamp: `${app.appliedDate || new Date().toLocaleDateString('en-GB')} 04:30 PM`,
      eSignOtpReference: `OTP-${app.customerId.replace(/[^0-9]/g, '').slice(0, 6) || 'SECURE'}`,
      eSignSignerName: app.customerName,
    };
  };

  // Selected document data
  const activeRecord: Partial<SanctionLetterRecord> | null = useMemo(() => {
    if (!selectedApplicantId) return null;
    const found = allApplicants.find((a) => a.id === selectedApplicantId);
    if (found) {
      return transformApplicantToRecord(found);
    }
    return null;
  }, [selectedApplicantId, allApplicants, branches]);

  return (
    <div className="space-y-6 pb-12 font-body">
      {/* ─── Hero Header (Hidden in Print) ─── */}
      <div className="print:hidden bg-gradient-to-r from-[#0B1F3A] via-[#132c4e] to-[#0B1F3A] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold tracking-wide uppercase">
              <ShieldCheck size={14} className="text-[#D4AF37]" />
              RBI Fair Practices Code • Most Important Document (MID)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-serif text-white">
              Loan Sanction Letter & Terms Agreement
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Official bilingual sanction letters, schedule of charges, and 28 legal covenants compliant with the Information Technology Act 2000 and Indian Contract Act 1872.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 text-[#D4AF37] border border-white/20">
              {allApplicants.length} Registered Accounts
            </span>
          </div>
        </div>
      </div>

      {/* ─── Search & Loan Application Selector (Hidden in Print) ─── */}
      <div className="print:hidden bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search borrower, loan A/C or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#0B1F3A] outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Building size={14} className="text-gray-400 shrink-0" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none cursor-pointer"
            >
              <option value="all">All Operating Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Horizontal Scroller of Available System Applicants */}
        <div className="pt-2 border-t border-gray-100 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] uppercase font-bold text-gray-400 shrink-0">
            Select Account:
          </span>

          {filteredApplicants.length === 0 ? (
            <span className="text-xs text-gray-400 italic">No loan accounts found for this branch filter.</span>
          ) : (
            filteredApplicants.map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => setSelectedApplicantId(app.id)}
                className={`px-3 py-1.5 rounded-lg shrink-0 font-medium text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedApplicantId === app.id
                    ? 'bg-[#0B1F3A] text-white font-bold shadow-xs'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <User size={11} />
                <span>{app.customerName}</span>
                <span className="opacity-70 font-mono text-[10px]">
                  ₹{(app.recommendedAmount || app.loanAmount).toLocaleString('en-IN')}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ─── Embedded Sanction Letter Viewer Component or Clean Empty State ─── */}
      {activeRecord ? (
        <SanctionLetterViewer
          key={selectedApplicantId}
          initialData={activeRecord}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h2 className="text-base font-bold text-[#0B1F3A]">No Sanction Letters Generated</h2>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
            There are currently no credit applications or approved loan accounts in the database. Once a customer loan is sanctioned, their official bilingual agreement and Schedule of Charges will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default SanctionLetterPage;
