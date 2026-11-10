// ──────────────────────────────────────────────────
// Golden Leaf Finance — Sanction Letter & Terms Document Viewer
// Production-Ready • Bilingual (English & தமிழ்) • Print-Optimized
// Source of Truth: IDFC FIRST Bank Vyapaar Vriddhi Master Sanction Letter
// ──────────────────────────────────────────────────

import React, { useState, useMemo, useRef } from 'react';
import {
  Printer, Download, Globe, ShieldCheck, CheckCircle2,
  FileText, Calendar, Building, User, Edit3, X, Check,
  AlertTriangle, RefreshCw, CheckSquare, Sparkles, MapPin,
  ChevronDown, ChevronUp, Lock, Award
} from 'lucide-react';
import {
  LOAN_TERMS_28_CLAUSES,
  ELECTRONIC_RECORD_DECLARATIONS,
  DELINQUENT_HANDLING_CHARGES,
  SANCTION_TEMPLATE_METADATA,
} from '../../../data/loanTermsData';
import {
  type DocumentLanguage,
  type DocumentViewSection,
  type SanctionLetterRecord,
} from '../../../types/sanctionLetter.types';

interface SanctionLetterViewerProps {
  initialData?: Partial<SanctionLetterRecord>;
  onClose?: () => void;
  isModal?: boolean;
}

export const SanctionLetterViewer: React.FC<SanctionLetterViewerProps> = ({
  initialData,
  onClose,
  isModal = false,
}) => {
  const [language, setLanguage] = useState<DocumentLanguage>('en');
  const [activeSection, setActiveSection] = useState<DocumentViewSection>('all');
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [expandedClause, setExpandedClause] = useState<number | null>(null);

  // Default initial data populated from the user's reference loan
  const [docData, setDocData] = useState<SanctionLetterRecord>(() => {
    const defaultSample = SANCTION_TEMPLATE_METADATA.sampleApplicantEn;
    return {
      loanAccountNo: initialData?.loanAccountNo || defaultSample.loanAccountNo,
      applicationFormNo: initialData?.applicationFormNo || defaultSample.loanAccountNo,
      applicationDate: initialData?.applicationDate || defaultSample.applicationDate,
      sanctionDate: initialData?.sanctionDate || defaultSample.applicationDate,
      place: initialData?.place || defaultSample.place,
      branchName: initialData?.branchName || 'Gobichettipalayam Branch',
      branchCode: initialData?.branchCode || 'BR-04',

      applicantName: initialData?.applicantName || defaultSample.applicantName,
      applicantPhone: initialData?.applicantPhone || '+91 98421 78901',
      applicantAddress: initialData?.applicantAddress || '42, Cutcherry Street, Gobichettipalayam, Erode - 638452',
      applicantPan: initialData?.applicantPan || 'ABCDE1234F',
      applicantAadhaarMasked: initialData?.applicantAadhaarMasked || 'XXXX-XXXX-9012',

      coApplicant1Name: initialData?.coApplicant1Name || defaultSample.coApplicant1Name,
      coApplicant1Relation: initialData?.coApplicant1Relation || 'Spouse',
      coApplicant2Name: initialData?.coApplicant2Name || 'None',
      coApplicant2Relation: initialData?.coApplicant2Relation || '—',

      loanProduct: initialData?.loanProduct || 'Vyapaar Vriddhi Loan / Business Loan',
      loanPurpose: initialData?.loanPurpose || defaultSample.loanPurpose,
      fixedRoi: initialData?.fixedRoi ?? defaultSample.fixedRoi,
      loanAmount: initialData?.loanAmount ?? defaultSample.loanAmount,
      tenureMonths: initialData?.tenureMonths ?? defaultSample.tenureMonths,
      numberOfEmis: initialData?.numberOfEmis ?? defaultSample.noOfEmis,
      tentativeEmiAmount: initialData?.tentativeEmiAmount ?? defaultSample.tentativeEmi,

      documentationCharges: initialData?.documentationCharges ?? defaultSample.docCharges,
      gstOnCharges: initialData?.gstOnCharges ?? defaultSample.gstCharges,
      lifeInsurancePremium: initialData?.lifeInsurancePremium ?? defaultSample.lifeInsurance,
      generalInsurancePremium: initialData?.generalInsurancePremium ?? defaultSample.generalInsurance,
      stampDutyCharges: initialData?.stampDutyCharges ?? defaultSample.stampDuty,
      totalChargesDeducted: initialData?.totalChargesDeducted ?? defaultSample.totalDeductions,
      existingLoanForeclosureAmount: initialData?.existingLoanForeclosureAmount ?? defaultSample.foreclosureAmount,
      netDisbursementAmount: initialData?.netDisbursementAmount ?? defaultSample.netDisbursement,

      repaymentMode: initialData?.repaymentMode || defaultSample.repaymentMode,
      repaymentFrequency: initialData?.repaymentFrequency || defaultSample.repaymentFrequency,
      emiDueDate: initialData?.emiDueDate ?? defaultSample.emiDueDate,
      moratorium: initialData?.moratorium || 'NO (Not Applicable)',

      penalChargesText: initialData?.penalChargesText || defaultSample.penalCharges,
      chequeBounceChargesText: initialData?.chequeBounceChargesText || defaultSample.bounceCharges,
      swapChargesText: initialData?.swapChargesText || defaultSample.swapCharges,
      foreclosureChargesText: initialData?.foreclosureChargesText || defaultSample.foreclosureCharges,
      foreclosureLockInDays: initialData?.foreclosureLockInDays ?? defaultSample.lockInDays,
      partPaymentChargesText: initialData?.partPaymentChargesText || defaultSample.partPaymentCharges,

      authorisedOfficerName: initialData?.authorisedOfficerName || defaultSample.authorisedOfficer,
      authorisedOfficerEmpId: initialData?.authorisedOfficerEmpId || defaultSample.authorisedOfficerEmpId,

      isElectronicallySigned: true,
      eSignTimestamp: '30/07/2025 04:45 PM IST',
      eSignOtpReference: 'OTP-VERIFIED-984210',
      eSignSignerName: initialData?.applicantName || defaultSample.applicantName,
    };
  });

  const printableRef = useRef<HTMLDivElement>(null);

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  // Recalculate net disbursal on customize
  const handleUpdateFinancials = (amount: number, doc: number, gst: number, life: number, gen: number, fore: number) => {
    const totalDeductions = doc + gst + life + gen;
    const net = amount - totalDeductions - fore;
    setDocData((prev) => ({
      ...prev,
      loanAmount: amount,
      documentationCharges: doc,
      gstOnCharges: gst,
      lifeInsurancePremium: life,
      generalInsurancePremium: gen,
      existingLoanForeclosureAmount: fore,
      totalChargesDeducted: totalDeductions,
      netDisbursementAmount: net,
    }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* ─── Top Control Toolbar (Hidden in Print) ─── */}
      <div className="print:hidden bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Language Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              language === 'en'
                ? 'bg-[#0B1F3A] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>🇬🇧</span> English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('ta')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              language === 'ta'
                ? 'bg-[#0B1F3A] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>🇮🇳</span> தமிழ் (Tamil)
          </button>
          <button
            type="button"
            onClick={() => setLanguage('bilingual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              language === 'bilingual'
                ? 'bg-[#D4AF37] text-[#0B1F3A] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Globe size={13} /> Bilingual (இருமொழி)
          </button>
        </div>

        {/* View Section Pills */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full text-xs">
          {[
            { id: 'all', label: language === 'ta' ? 'முழு ஆவணம்' : 'All Sections' },
            { id: 'schedule', label: language === 'ta' ? 'கட்டண அட்டவணை' : 'Schedule of Charges' },
            { id: 'clauses', label: language === 'ta' ? '28 விதிகள்' : '28 Terms & Clauses' },
            { id: 'signatures', label: language === 'ta' ? 'கையொப்பங்கள்' : 'Signatures' },
          ].map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id as DocumentViewSection)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSection === sec.id
                  ? 'bg-blue-50 text-[#0B1F3A] border border-blue-200'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#0B1F3A] text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            title="Edit Parameters"
          >
            <Edit3 size={15} />
            <span className="hidden sm:inline">Customize</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#132c4e] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Printer size={15} />
            <span>Print Official Doc</span>
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ─── Parameter Customizer Drawer (Hidden in Print) ─── */}
      {isCustomizeOpen && (
        <div className="print:hidden bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
            <span className="font-bold text-[#0B1F3A] flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#D4AF37]" />
              Live Sanction Letter Parameters Editor
            </span>
            <button
              type="button"
              onClick={() => setIsCustomizeOpen(false)}
              className="text-gray-500 hover:text-gray-800"
            >
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Applicant Name</label>
              <input
                type="text"
                value={docData.applicantName}
                onChange={(e) => setDocData({ ...docData, applicantName: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Co-Applicant 1</label>
              <input
                type="text"
                value={docData.coApplicant1Name}
                onChange={(e) => setDocData({ ...docData, coApplicant1Name: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Loan Account No</label>
              <input
                type="text"
                value={docData.loanAccountNo}
                onChange={(e) => setDocData({ ...docData, loanAccountNo: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Branch & Place</label>
              <input
                type="text"
                value={docData.place}
                onChange={(e) => setDocData({ ...docData, place: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Loan Amount (A)</label>
              <input
                type="number"
                value={docData.loanAmount}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  handleUpdateFinancials(
                    val,
                    docData.documentationCharges,
                    docData.gstOnCharges,
                    docData.lifeInsurancePremium,
                    docData.generalInsurancePremium,
                    docData.existingLoanForeclosureAmount
                  );
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-emerald-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Fixed ROI (%)</label>
              <input
                type="number"
                step="0.1"
                value={docData.fixedRoi}
                onChange={(e) => setDocData({ ...docData, fixedRoi: parseFloat(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Tenure (Months)</label>
              <input
                type="number"
                value={docData.tenureMonths}
                onChange={(e) => setDocData({ ...docData, tenureMonths: parseInt(e.target.value) || 0, numberOfEmis: parseInt(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Tentative EMI (₹)</label>
              <input
                type="number"
                value={docData.tentativeEmiAmount}
                onChange={(e) => setDocData({ ...docData, tentativeEmiAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium font-bold text-[#0B1F3A]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Doc & Enrolment Fee</label>
              <input
                type="number"
                value={docData.documentationCharges}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  const gst = Math.round(val * 0.18);
                  handleUpdateFinancials(
                    docData.loanAmount,
                    val,
                    gst,
                    docData.lifeInsurancePremium,
                    docData.generalInsurancePremium,
                    docData.existingLoanForeclosureAmount
                  );
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Life Insurance Premium</label>
              <input
                type="number"
                value={docData.lifeInsurancePremium}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  handleUpdateFinancials(
                    docData.loanAmount,
                    docData.documentationCharges,
                    docData.gstOnCharges,
                    val,
                    docData.generalInsurancePremium,
                    docData.existingLoanForeclosureAmount
                  );
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">General Insurance</label>
              <input
                type="number"
                value={docData.generalInsurancePremium}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  handleUpdateFinancials(
                    docData.loanAmount,
                    docData.documentationCharges,
                    docData.gstOnCharges,
                    docData.lifeInsurancePremium,
                    val,
                    docData.existingLoanForeclosureAmount
                  );
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Net Disbursal (Auto)</label>
              <div className="px-2.5 py-1.5 bg-emerald-100/70 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 font-mono">
                ₹{docData.netDisbursementAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PRINTABLE DOCUMENT CONTAINER ─── */}
      <div
        ref={printableRef}
        id="sanction-letter-print-area"
        className="bg-white rounded-2xl border border-gray-300 shadow-lg p-6 sm:p-10 text-gray-900 font-body relative overflow-hidden print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Print watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
          <span className="text-8xl font-black rotate-[-30deg] tracking-widest text-[#0B1F3A]">
            GOLDEN LEAF FINANCE
          </span>
        </div>

        {/* ─── DOCUMENT HEADER / LETTERHEAD ─── */}
        <header className="border-b-2 border-[#0B1F3A] pb-5 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#D4AF37] inline-block" />
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1F3A] uppercase">
                  {language === 'ta' ? SANCTION_TEMPLATE_METADATA.companyNameTa : SANCTION_TEMPLATE_METADATA.companyNameEn}
                </h1>
              </div>
              <p className="text-[11px] font-bold text-gray-600">
                {language === 'ta' ? SANCTION_TEMPLATE_METADATA.companyRegTa : SANCTION_TEMPLATE_METADATA.companyRegEn}
              </p>
              <p className="text-[10px] text-gray-500 max-w-xl">
                {language === 'ta' ? SANCTION_TEMPLATE_METADATA.registeredOfficeTa : SANCTION_TEMPLATE_METADATA.registeredOfficeEn}
              </p>
              <p className="text-[10px] text-gray-500">
                Customer Care / வாடிக்கையாளர் சேவை: <strong>{SANCTION_TEMPLATE_METADATA.customerCareNo}</strong> | Email: <strong>{SANCTION_TEMPLATE_METADATA.contactEmail}</strong>
              </p>
            </div>

            <div className="sm:text-right shrink-0 bg-gray-50 border border-gray-200 rounded-xl p-3">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#0B1F3A] text-white mb-1">
                Loan Sanction Reference
              </span>
              <div className="font-mono text-xs font-bold text-[#0B1F3A]">
                A/C: {docData.loanAccountNo}
              </div>
              <div className="text-[11px] text-gray-600">
                Date / தேதி: <strong>{docData.sanctionDate}</strong>
              </div>
              <div className="text-[11px] text-gray-600">
                Place / இடம்: <strong>{docData.place}</strong>
              </div>
            </div>
          </div>

          {/* Document Title Banner */}
          <div className="mt-4 pt-3 border-t border-gray-200 text-center">
            <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-[#0B1F3A]">
              {language === 'ta' ? (
                <>அட்டவணை / அனுமதி கடிதம் / மிக முக்கியமான ஆவணம் (MID)</>
              ) : language === 'bilingual' ? (
                <>
                  SCHEDULE OF CHARGES / SANCTION LETTER / MOST IMPORTANT DOCUMENT (MID)
                  <span className="block text-xs font-semibold text-gray-600">
                    அட்டவணை / கடன் அனுமதி கடிதம் / மிக முக்கியமான ஆவணம்
                  </span>
                </>
              ) : (
                <>SCHEDULE OF CHARGES CUM SANCTION LETTER / MOST IMPORTANT DOCUMENT (MID)</>
              )}
            </h2>
            <p className="text-[11px] text-gray-600 mt-0.5">
              {language === 'ta'
                ? `வியாபார் விருத்தி கடன் - பொருந்தக்கூடிய விதிகள் மற்றும் நிபந்தனைகள் (விண்ணப்ப படிவம் எண்: ${docData.loanAccountNo})`
                : `Terms and Conditions Applicable to Vyapaar Vriddhi Loan / Business Loan Facility (Application No: ${docData.loanAccountNo})`}
            </p>
          </div>
        </header>

        {/* ─── PREAMBLE NOTE (Insurance & Regulatory Note) ─── */}
        <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-[10px] leading-relaxed text-gray-700 mb-6">
          <p>
            <strong>
              {language === 'ta' ? 'காப்பீட்டு வழிகாட்டுதல்:' : 'Regulatory Notice & Voluntary Insurance:'}
            </strong>{' '}
            {language === 'ta' ? (
              <>
                காப்பீடு கட்டாயமில்லை என்பதையும், தானாக முன்வந்து அதைத் தேர்வுசெய்யும் வாடிக்கையாளருக்கு மட்டுமே வழங்கப்படும் என்பதையும் கடன் வாங்குபவர் அறிவார். கடன் ரத்து செய்யப்பட்டால், காப்பீட்டு பாலிசியும் காப்பீட்டு நிறுவனத்தால் தானாகவே ரத்து செய்யப்படும். நிறுவனத்தின் வலைத்தளத்தில் (investments-and-insurance) காப்பீட்டு விவரங்களை சரிபார்க்கலாம்.
              </>
            ) : (
              <>
                Borrower is aware that insurance is non-mandatory and offered only to customers who voluntarily choose to opt for the same. In case the loan is cancelled, the insurance policy will also get cancelled automatically by the Insurance Company. Golden Leaf Finance may receive permissible facilitation fees as per prevailing RBI/IRDAI guidelines.
              </>
            )}
          </p>
        </div>

        {/* ─── SECTION 1: SCHEDULE OF CHARGES (MID TABLE) ─── */}
        {(activeSection === 'all' || activeSection === 'schedule') && (
          <section className="space-y-4 mb-8">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#0B1F3A] flex items-center gap-1.5">
                <FileText size={15} className="text-[#D4AF37]" />
                {language === 'ta' ? 'பிரிவு 1: கடன் விவரங்கள் மற்றும் கட்டண அட்டவணை' : 'Section 1: Loan Particulars & Schedule of Charges'}
              </h3>
              <span className="text-[10px] font-mono text-gray-500 font-semibold">
                RBI Fair Practices Code Compliant
              </span>
            </div>

            {/* Structured Table matching IDFC First Bank Schedule */}
            <div className="border border-gray-300 rounded-xl overflow-hidden shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-300">
                {/* Column 1: Loan Details */}
                <div className="divide-y divide-gray-200">
                  <div className="bg-[#0B1F3A] text-white px-3.5 py-2 font-bold text-[11px] uppercase tracking-wider flex justify-between items-center">
                    <span>{language === 'ta' ? 'கடன் விவரங்கள் (Loan Details)' : 'Loan Details'}</span>
                    <span className="text-[10px] text-gray-300 font-normal">Particulars</span>
                  </div>

                  <div className="px-3.5 py-2 text-xs flex justify-between items-center bg-gray-50/50">
                    <span className="text-gray-600 font-medium">
                      {language === 'ta' ? 'விண்ணப்பதாரர் பெயர்' : 'Name of Applicant'}
                    </span>
                    <strong className="text-[#0B1F3A] font-semibold">{docData.applicantName}</strong>
                  </div>

                  <div className="px-3.5 py-2 text-xs flex justify-between items-center">
                    <span className="text-gray-600 font-medium">
                      {language === 'ta' ? 'இணை விண்ணப்பதாரர் 1' : 'Name of Co-applicant 1'}
                    </span>
                    <strong className="text-gray-800">{docData.coApplicant1Name || '—'}</strong>
                  </div>

                  <div className="px-3.5 py-2 text-xs flex justify-between items-center bg-gray-50/50">
                    <span className="text-gray-600 font-medium">
                      {language === 'ta' ? 'இணை விண்ணப்பதாரர் 2' : 'Name of Co-applicant 2'}
                    </span>
                    <strong className="text-gray-800">{docData.coApplicant2Name || 'None'}</strong>
                  </div>

                  <div className="px-3.5 py-2 text-xs flex justify-between items-center">
                    <span className="text-gray-600 font-medium">
                      {language === 'ta' ? 'கடன் கணக்கு எண்' : 'Loan Account Number'}
                    </span>
                    <strong className="font-mono text-[#0B1F3A] font-bold">{docData.loanAccountNo}</strong>
                  </div>

                  <div className="px-3.5 py-2 text-xs flex justify-between items-center bg-gray-50/50">
                    <span className="text-gray-600 font-medium">
                      {language === 'ta' ? 'கடனின் காலம் (மாதங்களில்)' : 'Tenure (in months)'}
                    </span>
                    <strong className="text-gray-800">{docData.tenureMonths} Months</strong>
                  </div>

                  <div className="px-3.5 py-2 text-xs flex justify-between items-center">
                    <span className="text-gray-600 font-medium">
                      {language === 'ta' ? 'இஎம்ஐ தவணைகளின் எண்ணிக்கை' : 'No. of EMIs'}
                    </span>
                    <strong className="text-gray-800">{docData.numberOfEmis}</strong>
                  </div>

                  <div className="px-3.5 py-2 text-xs flex justify-between items-center bg-gray-50/50">
                    <span className="text-gray-600 font-medium">
                      {language === 'ta' ? 'மாதாந்திர தவணைத் தொகை (தோராயமாக)' : 'Tentative Monthly EMI'}
                    </span>
                    <strong className="text-[#0B1F3A] font-bold text-sm">
                      ₹{docData.tentativeEmiAmount.toLocaleString('en-IN')}.00
                    </strong>
                  </div>

                  <div className="px-3.5 py-2 text-xs flex justify-between items-center">
                    <span className="text-gray-600 font-medium">
                      {language === 'ta' ? 'கடன் நோக்கம் / பயன்பாடு' : 'Loan Purpose / End Use'}
                    </span>
                    <strong className="text-gray-800 uppercase font-semibold">{docData.loanPurpose}</strong>
                  </div>
                </div>

                {/* Column 2: Rate and Charges */}
                <div className="divide-y divide-gray-200">
                  <div className="bg-[#0B1F3A] text-white px-3.5 py-2 font-bold text-[11px] uppercase tracking-wider flex justify-between items-center">
                    <span>{language === 'ta' ? 'விகிதம் & கட்டணங்கள் (Rate & Charges)' : 'Rate and Charges'}</span>
                    <span className="text-[10px] text-gray-300 font-normal">Amount (INR)</span>
                  </div>

                  <div className="px-3.5 py-2 text-xs flex justify-between items-center bg-gray-50/50">
                    <span className="text-gray-600 font-medium">
                      {language === 'ta' ? 'நிலையான வட்டி விகிதம் (Fixed ROI)' : 'Fixed ROI (%)'}
                    </span>
                    <strong className="text-emerald-700 font-bold">{docData.fixedRoi}% p.a.</strong>
                  </div>

                  <div className="px-3.5 py-2 text-xs flex justify-between items-center">
                    <span className="text-[#0B1F3A] font-bold">
                      {language === 'ta' ? 'கடன் அனுமதித் தொகை (A)' : 'Loan Amount Sanctioned (A)'}
                    </span>
                    <strong className="text-emerald-800 font-extrabold text-sm">
                      ₹{docData.loanAmount.toLocaleString('en-IN')}.00
                    </strong>
                  </div>

                  <div className="px-3.5 py-2 text-xs flex justify-between items-center bg-gray-50/50">
                    <span className="text-gray-600 font-medium">
                      {language === 'ta' ? 'ஆவண & சேர்க்கைக் கட்டணங்கள்' : 'Documentation & Enrolment Charges'}
                    </span>
                    <span className="font-mono text-gray-800">₹{docData.documentationCharges.toLocaleString('en-IN')}.00</span>
                  </div>

                  <div className="px-3.5 py-2 text-xs flex justify-between items-center">
                    <span className="text-gray-600 font-medium">
                      {language === 'ta' ? 'மேற்குறிப்பிட்டவற்றிற்கான GST (18%)' : 'GST on Documentation (18%)'}
                    </span>
                    <span className="font-mono text-gray-800">₹{docData.gstOnCharges.toLocaleString('en-IN')}.00</span>
                  </div>

                  <div className="px-3.5 py-2 text-xs flex justify-between items-center bg-gray-50/50">
                    <span className="text-gray-600 font-medium">
                      {language === 'ta' ? 'ஆயுள் காப்பீட்டு பிரீமியம்' : 'Life Insurance Premium'}
                    </span>
                    <span className="font-mono text-gray-800">₹{docData.lifeInsurancePremium.toLocaleString('en-IN')}.00</span>
                  </div>

                  <div className="px-3.5 py-2 text-xs flex justify-between items-center">
                    <span className="text-gray-600 font-medium">
                      {language === 'ta' ? 'பொதுக் காப்பீட்டு பிரீமியம்' : 'General Insurance Premium'}
                    </span>
                    <span className="font-mono text-gray-800">₹{docData.generalInsurancePremium.toLocaleString('en-IN')}.00</span>
                  </div>

                  <div className="px-3.5 py-2 text-xs flex justify-between items-center bg-gray-50/50">
                    <span className="text-gray-600 font-medium">
                      {language === 'ta' ? 'முத்திரைத்தாள் கட்டணம்' : 'Stamp Duty Charges'}
                    </span>
                    <span className="font-mono text-gray-800">₹{docData.stampDutyCharges.toLocaleString('en-IN')}.00</span>
                  </div>

                  <div className="px-3.5 py-2 text-xs flex justify-between items-center bg-red-50/40">
                    <span className="text-red-900 font-bold">
                      {language === 'ta' ? 'மொத்தப் பிடித்தங்கள் (B)' : 'Total Charges Deducted (B)'}
                    </span>
                    <strong className="text-red-700 font-mono font-bold">
                      ₹{docData.totalChargesDeducted.toLocaleString('en-IN')}.00
                    </strong>
                  </div>

                  <div className="px-3.5 py-2 text-xs flex justify-between items-center">
                    <span className="text-gray-600 font-medium">
                      {language === 'ta' ? 'முந்தைய கடன் முடித்தல் தொகை (C)' : 'Foreclosure of Existing Loan (C)'}
                    </span>
                    <span className="font-mono text-gray-800">₹{docData.existingLoanForeclosureAmount.toLocaleString('en-IN')}.00</span>
                  </div>

                  <div className="px-3.5 py-2.5 text-xs flex justify-between items-center bg-emerald-50 border-t-2 border-emerald-600">
                    <span className="text-emerald-950 font-black text-xs uppercase tracking-wide">
                      {language === 'ta' ? 'நிகர விநியோகத் தொகை (A - B - C)' : 'Net Disbursement Amount (A - B - C)'}
                    </span>
                    <strong className="text-emerald-900 font-black text-base font-mono">
                      ₹{docData.netDisbursementAmount.toLocaleString('en-IN')}.00
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Incidental Charges and Repayment Matrix */}
            <div className="border border-gray-300 rounded-xl overflow-hidden mt-4">
              <div className="bg-gray-100 px-3.5 py-2 font-bold text-[11px] uppercase tracking-wider text-gray-700 border-b border-gray-300">
                {language === 'ta' ? 'இதர கட்டணங்கள் மற்றும் விதிமுறைகள்' : 'Other Incidental Charges & Loan Terms'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 text-xs">
                <div className="p-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    {language === 'ta' ? 'திருப்பிச் செலுத்தும் முறை' : 'Repayment Mode & Frequency'}
                  </span>
                  <div className="font-semibold text-[#0B1F3A]">
                    {docData.repaymentMode} ({docData.repaymentFrequency})
                  </div>
                  <div className="text-[11px] text-gray-600">
                    {language === 'ta' ? 'தவணைத் தேதி: ஒவ்வொரு மாதமும்' : 'EMI Due Date: Every Month'} <strong>{docData.emiDueDate}</strong>th
                  </div>
                </div>

                <div className="p-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    {language === 'ta' ? 'தாமதக் கட்டணங்கள் (Penal Charges)' : 'Penal Charges for Delay'}
                  </span>
                  <div className="font-medium text-gray-800 leading-snug">
                    {docData.penalChargesText}
                  </div>
                </div>

                <div className="p-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    {language === 'ta' ? 'காசோலை/மண்டேட் திரும்புதல் கட்டணம்' : 'Cheque / Mandate Bounce'}
                  </span>
                  <div className="font-medium text-gray-800 leading-snug">
                    {docData.chequeBounceChargesText}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 text-xs bg-gray-50/50">
                <div className="p-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    {language === 'ta' ? 'காசோலை / ECS மாற்றுதல்' : 'Cheque / ECS Swap Charges'}
                  </span>
                  <div className="font-medium text-gray-800">{docData.swapChargesText}</div>
                </div>

                <div className="p-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    {language === 'ta' ? 'முன்கூட்டியே முடித்தல் & லாக்-இன்' : 'Foreclosure & Lock-in Period'}
                  </span>
                  <div className="font-medium text-gray-800 leading-snug">
                    Lock-in: <strong>{docData.foreclosureLockInDays} Days</strong>. {docData.foreclosureChargesText}
                  </div>
                </div>

                <div className="p-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    {language === 'ta' ? 'பகுதித் தொகை செலுத்துதல்' : 'Part-Payment Charges'}
                  </span>
                  <div className="font-medium text-gray-800">{docData.partPaymentChargesText}</div>
                </div>
              </div>
            </div>

            {/* Overdue Handling Charges Slabs */}
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] space-y-1.5">
              <span className="font-bold text-[#0B1F3A] uppercase tracking-wider block text-[10px]">
                {language === 'ta'
                  ? 'கடன் தவணை தவறிய கணக்குகளைக் கையாளுவதற்கான கட்டணங்கள் (Overdue Handling Charges):'
                  : 'Overdue Handling Charges (Delinquent Accounts):'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700">
                {(language === 'ta' ? DELINQUENT_HANDLING_CHARGES.ta : DELINQUENT_HANDLING_CHARGES.en).map((item) => (
                  <div key={item.rule} className="flex items-start gap-1.5">
                    <span className="font-bold text-[#0B1F3A] shrink-0 font-mono">{item.rule}.</span>
                    <div>
                      <strong className="text-gray-900">{item.fee}:</strong> {item.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cheque Instruction Note */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 text-blue-700 mt-0.5" />
              <p>
                <strong>{language === 'ta' ? 'குறிப்பு:' : 'Statutory Note:'}</strong>{' '}
                {language === 'ta' ? (
                  <>
                    வெற்று காசோலைகளை (Blank Cheques) வழங்க வேண்டாம். காசோலைகள் கணக்கு செலுத்துபவருக்கு மட்டுமே (Account Payee Only) என்றவாறு இருக்க வேண்டும். காசோலைகள் <strong>"Golden Leaf Finance Limited"</strong> என்ற பெயரில் கடன் கணக்கு எண்: <strong>{docData.loanAccountNo}</strong>-க்காக மட்டுமே வழங்கப்பட வேண்டும்.
                  </>
                ) : (
                  <>
                    Please do not issue blank cheque(s). The cheque(s) must be account payee only, in favour of <strong>"Golden Leaf Finance Limited"</strong> for Loan Account No: <strong>{docData.loanAccountNo}</strong>.
                  </>
                )}
              </p>
            </div>
          </section>
        )}

        {/* ─── SECTION 2: TERMS AND CONDITIONS (ALL 28 CLAUSES) ─── */}
        {(activeSection === 'all' || activeSection === 'clauses') && (
          <section className="space-y-4 mb-8 pt-4 border-t-2 border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#0B1F3A] flex items-center gap-1.5">
                  <Award size={15} className="text-[#D4AF37]" />
                  {language === 'ta'
                    ? 'பிரிவு 2: வியாபார் விருத்தி கடன் - பொருந்தக்கூடிய விதிகள் மற்றும் நிபந்தனைகள் (28 விதிகள்)'
                    : 'Section 2: Terms & Conditions Applicable to Vyapaar Vriddhi Loan (28 Clauses)'}
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {language === 'ta'
                    ? 'முழு சட்டப்பூர்வ ஆவணம் - இந்திய ஒப்பந்தச் சட்டம், 1872 மற்றும் ரிசர்வ் வங்கி விதிகளின்படி'
                    : 'Governed under the Indian Contract Act, 1872, RBI Master Directions and Indian Statutes'}
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#0B1F3A] border border-blue-200">
                28 Enforceable Clauses
              </span>
            </div>

            {/* Clauses List */}
            <div className="space-y-3">
              {LOAN_TERMS_28_CLAUSES.map((clause) => {
                const isExpanded = expandedClause === clause.number;
                return (
                  <div
                    key={clause.number}
                    className="border border-gray-200 rounded-xl p-3.5 bg-white hover:border-[#D4AF37]/50 transition-all text-xs print:border-b print:border-gray-300 print:rounded-none print:p-2"
                  >
                    <div
                      onClick={() => setExpandedClause(isExpanded ? null : clause.number)}
                      className="flex items-start justify-between gap-2 cursor-pointer select-none"
                    >
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {clause.number}
                        </span>
                        <div>
                          <h4 className="font-bold text-[#0B1F3A] text-xs">
                            {language === 'ta' ? clause.titleTa : clause.titleEn}
                          </h4>
                          {language === 'bilingual' && (
                            <p className="text-[10px] font-semibold text-gray-500">
                              {clause.titleTa}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="print:hidden text-gray-400 hover:text-gray-700 shrink-0"
                      >
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </div>

                    {/* Clause Body: Display English, Tamil or Bilingual */}
                    <div className="mt-2 pl-7 text-[11px] leading-relaxed text-gray-700">
                      {language === 'en' && <p>{clause.textEn}</p>}
                      {language === 'ta' && <p>{clause.textTa}</p>}
                      {language === 'bilingual' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div className="border-r border-gray-200 pr-3">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">English</span>
                            <p className="text-gray-800">{clause.textEn}</p>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">தமிழ்</span>
                            <p className="text-gray-800">{clause.textTa}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── SECTION 3: IT ACT 2000 ELECTRONIC DECLARATIONS ─── */}
        {(activeSection === 'all' || activeSection === 'signatures') && (
          <section className="space-y-4 mb-8 pt-4 border-t-2 border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#0B1F3A] flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-[#D4AF37]" />
                {language === 'ta'
                  ? 'பிரிவு 3: தகவல் தொழில்நுட்பச் சட்டம் 2000 - மின்னணு ஒப்புதல் உறுதிமொழி'
                  : 'Section 3: Information Technology Act, 2000 Electronic Declarations'}
              </h3>
              <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                IT Act 2000 Section 65B Compliant
              </span>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 text-[11px] leading-relaxed text-gray-700">
              {(language === 'ta' ? ELECTRONIC_RECORD_DECLARATIONS.ta : ELECTRONIC_RECORD_DECLARATIONS.en).map((dec) => (
                <div key={dec.clauseNo} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-gray-300 text-gray-800 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                    {dec.clauseNo}
                  </span>
                  <p>{dec.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── SECTION 4: EXECUTION & SIGNATURES BLOCK ─── */}
        {(activeSection === 'all' || activeSection === 'signatures') && (
          <section className="space-y-6 pt-4 border-t-2 border-[#0B1F3A]">
            <div className="text-center">
              <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                {language === 'ta'
                  ? 'கையொப்பமிடுவதற்கு முன் கவனமாகப் படிக்கவும் (Please Read Carefully Before Signing)'
                  : 'Please Read Carefully Before Signing'}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {language === 'ta'
                  ? 'கோல்டன் லீஃப் பைனான்ஸ் நிறுவனத்திடமிருந்து மிக முக்கியமான ஆவணம் மற்றும் கடன் அனுமதி கடிதத்தின் நகலைப் பெற்றுக்கொண்டதை உறுதிப்படுத்துகிறோம்.'
                  : 'I/We hereby confirm having received a copy of the Most Important Document cum Sanction Letter & Loan Agreement and confirm having read and understood the same.'}
              </p>
            </div>

            {/* Signature Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              {/* Applicant Signature */}
              <div className="border border-gray-300 rounded-xl p-3 flex flex-col justify-between h-36 bg-gray-50/40 text-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  {language === 'ta' ? 'விண்ணப்பதாரர் கையொப்பம்' : 'Signature of Applicant'}
                </span>
                <div className="border-b border-dashed border-gray-400 my-auto py-2">
                  {docData.isElectronicallySigned ? (
                    <div className="text-[10px] font-bold text-emerald-800">
                      ✓ Digitally E-Signed
                      <span className="block text-[8px] font-mono text-gray-500">{docData.eSignTimestamp}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">Sign Above</span>
                  )}
                </div>
                <div className="text-[10px] font-bold text-[#0B1F3A] truncate">{docData.applicantName}</div>
              </div>

              {/* Co-Applicant 1 Signature */}
              <div className="border border-gray-300 rounded-xl p-3 flex flex-col justify-between h-36 bg-gray-50/40 text-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  {language === 'ta' ? 'இணை விண்ணப்பதாரர் 1' : 'Signature of Co-Applicant 1'}
                </span>
                <div className="border-b border-dashed border-gray-400 my-auto py-2">
                  <span className="text-[10px] text-gray-400 italic">Sign Above</span>
                </div>
                <div className="text-[10px] font-bold text-gray-700 truncate">{docData.coApplicant1Name || '—'}</div>
              </div>

              {/* Co-Applicant 2 Signature */}
              <div className="border border-gray-300 rounded-xl p-3 flex flex-col justify-between h-36 bg-gray-50/40 text-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  {language === 'ta' ? 'இணை விண்ணப்பதாரர் 2' : 'Signature of Co-Applicant 2'}
                </span>
                <div className="border-b border-dashed border-gray-400 my-auto py-2">
                  <span className="text-[10px] text-gray-400 italic">Sign Above</span>
                </div>
                <div className="text-[10px] font-bold text-gray-700 truncate">{docData.coApplicant2Name || '—'}</div>
              </div>

              {/* Authorised Bank Officer & Seal */}
              <div className="border-2 border-[#0B1F3A] rounded-xl p-3 flex flex-col justify-between h-36 bg-blue-50/40 text-center relative overflow-hidden">
                <span className="text-[10px] font-bold text-[#0B1F3A] uppercase">
                  {language === 'ta' ? 'அங்கீகரிக்கப்பட்ட வங்கி அதிகாரி' : 'Authorised Officer'}
                </span>
                <div className="my-auto py-1">
                  <div className="inline-block px-2 py-0.5 rounded border border-emerald-600 bg-emerald-50 text-[9px] font-bold text-emerald-800">
                    APPROVED & VERIFIED
                  </div>
                  <div className="text-[9px] font-mono text-gray-500 mt-0.5">Emp ID: {docData.authorisedOfficerEmpId}</div>
                </div>
                <div className="text-[10px] font-extrabold text-[#0B1F3A] truncate">
                  {docData.authorisedOfficerName}
                </div>
              </div>
            </div>

            {/* Document Footer Metadata */}
            <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-500 gap-2">
              <div>
                Golden Leaf Finance LMS • Sanction Letter Version 4.2 • Page 1 of 1 • System Generated Document
              </div>
              <div className="font-mono">
                Date Generated: {new Date().toLocaleDateString('en-IN')} • Place: {docData.place}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
