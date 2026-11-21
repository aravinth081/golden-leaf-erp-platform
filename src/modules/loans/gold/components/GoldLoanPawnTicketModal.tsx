// ──────────────────────────────────────────────────
// Golden Leaf Finance — Gold Loan Pawn Ticket & Pledge Receipt Modal
// Production-Ready • Sample 12 Part A Compliant • Official Vault Pledge Receipt
// ──────────────────────────────────────────────────

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, FileDown, ExternalLink, FileText, Sparkles } from 'lucide-react';
import { type GoldLoanRecord } from '../../../../types/goldLoan.types';
import {
  generateGoldLoanPawnTicketPDF,
  generateGoldLoanPawnTicketPDFBlobUrl,
} from '../../../../utils/pdfGenerator';

interface GoldLoanPawnTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: GoldLoanRecord | null;
  onProceedToDisburse?: (loan: GoldLoanRecord) => void;
}

export const GoldLoanPawnTicketModal: React.FC<GoldLoanPawnTicketModalProps> = ({
  isOpen,
  onClose,
  loan,
  onProceedToDisburse,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen || !loan) return null;

  const safeLocation = loan.safeVaultLocation || {
    safeNumber: 'SAFE-01',
    rackCabinet: 'RACK-B',
    traySlot: 'TRAY-04',
  };
  const dualSign = loan.dualCustodySignoff || {
    isCreditManagerAppraised: false,
    isBranchManagerVaultLocked: false,
  };
  const items = Array.isArray(loan.items) ? loan.items : [];

  // ── 1. CLEAN ISOLATED PRINT (Zero website elements, pure Pawn Ticket) ──
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=880,height=1100');
    if (!printWindow) {
      window.print();
      return;
    }

    const itemsHtml = items
      .map(
        (item, idx) => `
      <tr>
        <td style="padding: 7px 10px; border-bottom: 1px solid #E2E8F0; text-align: center; font-weight: bold; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #E2E8F0; font-weight: bold; color: #0F172A;">
          ${item.ornamentType}
          ${item.conditionRemarks ? `<span style="display: block; font-size: 8.5px; color: #64748B; font-weight: normal;">${item.conditionRemarks}</span>` : ''}
        </td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #E2E8F0; text-align: center; font-weight: bold;">${item.quantity}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #E2E8F0; text-align: right; font-family: monospace;">${Number(item.grossWeightGrams || 0).toFixed(3)}g</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #E2E8F0; text-align: right; font-family: monospace; color: #B91C1C;">-${Number(item.stoneDeductionGrams || 0).toFixed(3)}g</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #E2E8F0; text-align: right; font-family: monospace; font-weight: bold; color: #065F46;">${Number(item.netWeightGrams || 0).toFixed(3)}g</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #E2E8F0; text-align: center; font-weight: bold;">${item.caratPurity}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #E2E8F0; text-align: right; font-family: monospace; font-weight: bold; color: #0B1F3A;">₹${Number(item.eligibleMarketValue || 0).toLocaleString('en-IN')}.00</td>
      </tr>
    `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gold Loan Pawn Ticket - ${loan.id}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0B1F3A; background: #fff; padding: 15px; font-size: 11px; line-height: 1.4; }
            .header-bar { border-bottom: 2.5px solid #0B1F3A; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start; }
            .brand-name { font-size: 20px; font-weight: 900; color: #0B1F3A; letter-spacing: 0.5px; }
            .brand-sub { font-size: 10px; font-weight: 700; color: #996515; margin-top: 3px; }
            .brand-reg { font-size: 9px; color: #64748B; margin-top: 2px; }
            .badge-box { background: #FEF3C7; border: 1.5px solid #F59E0B; border-radius: 8px; padding: 6px 12px; text-align: right; }
            .badge-tag { background: #0B1F3A; color: #fff; font-size: 8px; font-weight: 800; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-family: monospace; }
            .badge-id { font-size: 12px; font-weight: 900; color: #0B1F3A; margin-top: 3px; font-family: monospace; }
            .badge-pouch { font-size: 9.5px; font-weight: 700; color: #92400E; font-family: monospace; }
            .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; }
            .meta-item { display: flex; flex-direction: column; }
            .meta-label { font-size: 8.5px; font-weight: 800; color: #64748B; text-transform: uppercase; margin-bottom: 2px; }
            .meta-val { font-size: 11px; font-weight: 700; color: #0B1F3A; }
            .meta-val-mono { font-family: monospace; font-size: 11px; font-weight: 800; color: #0B1F3A; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 10px; border: 1px solid #CBD5E1; border-radius: 8px; overflow: hidden; }
            th { background: #0B1F3A; color: #fff; padding: 8px 10px; font-weight: 800; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
            tr:nth-child(even) td { background: #F8FAFC; }
            .total-row td { background: #FEF3C7 !important; font-weight: 900; border-top: 2px solid #F59E0B; border-bottom: none; font-size: 11px; }
            .finance-box { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: 10px; padding: 10px 14px; margin-bottom: 12px; }
            .finance-val { font-size: 13px; font-weight: 900; color: #065F46; font-family: monospace; margin-top: 2px; }
            .terms-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px 12px; font-size: 8.5px; color: #475569; line-height: 1.45; margin-bottom: 14px; }
            .sig-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; border-top: 2px solid #0B1F3A; padding-top: 14px; text-align: center; }
            .sig-card { border: 1px solid #CBD5E1; border-radius: 8px; padding: 8px; height: 90px; display: flex; flex-direction: column; justify-content: space-between; background: #FAFAFA; }
            .sig-card.bm { border: 2px solid #0B1F3A; background: #FFFBEB; }
            .sig-label { font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #64748B; }
            .sig-card.bm .sig-label { color: #0B1F3A; }
            .sig-tag { display: inline-block; font-size: 8px; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin: auto; }
            .sig-name { font-size: 10px; font-weight: 800; color: #0B1F3A; }
            .footer-note { text-align: center; font-size: 8px; color: #94A3B8; margin-top: 12px; border-top: 1px dashed #CBD5E1; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div>
              <div class="brand-name">GOLDENLEAF FINANCE LIMITED</div>
              <div class="brand-sub">Branch Office: ${loan.branchName || 'Main Branch'} (${loan.branchId}) | Official Gold Loan Pawn Ticket & Ornament Pledge Receipt</div>
              <div class="brand-reg">Regd. Office: Anna Nagar, Chennai | Custodian Vault Safe No: <strong>${safeLocation.safeNumber}</strong> | Form GL-PLG-12A</div>
            </div>
            <div class="badge-box">
              <span class="badge-tag">PART A: PLEDGE RECEIPT</span>
              <div class="badge-id">${loan.id}</div>
              <div class="badge-pouch">Pouch: ${loan.tamperProofPacketSerialNo}</div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item"><span class="meta-label">Borrower Full Name</span><span class="meta-val">${loan.customerName}</span></div>
            <div class="meta-item"><span class="meta-label">Mobile Number</span><span class="meta-val">+91 ${loan.customerMobile.replace('+91', '').trim()}</span></div>
            <div class="meta-item"><span class="meta-label">Nominee Name & Relationship</span><span class="meta-val">${loan.nomineeName || 'Nominee'} (${loan.nomineeRelationship || 'Family'})</span></div>
            <div class="meta-item"><span class="meta-label">Safe Vault Slot Location</span><span class="meta-val-mono">${safeLocation.safeNumber} / ${safeLocation.rackCabinet} / ${safeLocation.traySlot}</span></div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="text-align: left;">Pledged Ornament Description</th>
                <th style="width: 45px; text-align: center;">Qty</th>
                <th style="width: 85px; text-align: right;">Gross Wt (g)</th>
                <th style="width: 85px; text-align: right;">Stone/Less (g)</th>
                <th style="width: 90px; text-align: right;">Net Gold Wt (g)</th>
                <th style="width: 55px; text-align: center;">Purity</th>
                <th style="width: 115px; text-align: right;">Appraised Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr class="total-row">
                <td colspan="2" style="padding: 8px 10px; text-transform: uppercase;">TOTAL ORNAMENTS IN SEALED PACKET:</td>
                <td style="padding: 8px 10px; text-align: center; font-family: monospace;">${loan.totalQuantity} Pcs</td>
                <td style="padding: 8px 10px; text-align: right; font-family: monospace;">${Number(loan.totalGrossWeightGrams || 0).toFixed(3)}g</td>
                <td style="padding: 8px 10px; text-align: right; font-family: monospace; color: #B91C1C;">-${Number(loan.totalStoneDeductionGrams || 0).toFixed(3)}g</td>
                <td style="padding: 8px 10px; text-align: right; font-family: monospace; font-size: 12px; color: #065F46;">${Number(loan.totalNetWeightGrams || 0).toFixed(3)}g</td>
                <td style="padding: 8px 10px; text-align: center;">LTV 75%</td>
                <td style="padding: 8px 10px; text-align: right; font-family: monospace; font-size: 12px;">₹${Number(loan.totalAppraisedEligibleValue || 0).toLocaleString('en-IN')}.00</td>
              </tr>
            </tbody>
          </table>

          <div class="finance-box">
            <div><span class="meta-label">Sanctioned Loan Principal</span><div class="finance-val">₹${Number(loan.sanctionedLoanAmount || 0).toLocaleString('en-IN')}.00</div></div>
            <div><span class="meta-label">Repayment Scheme</span><div class="meta-val" style="margin-top: 2px;">${loan.repaymentScheme || 'Monthly Interest Servicing'}</div></div>
            <div><span class="meta-label">Interest Rate & Monthly Dues</span><div class="meta-val" style="color: #1E40AF; margin-top: 2px;">${loan.interestRateAnnual || 12}% p.a. (₹${Number(loan.monthlyInterestAmount || 0).toLocaleString('en-IN')}/mo)</div></div>
            <div><span class="meta-label">Maturity Due Date</span><div class="meta-val" style="color: #B91C1C; margin-top: 2px;">${loan.maturityDate || '-'}</div></div>
          </div>

          <div class="terms-box">
            <strong>Terms of Pledge:</strong> 1) The original Pawn Ticket must be surrendered in person during redemption. 2) Monthly interest must be serviced regularly. Overdue accounts will attract reminder notices and statutory auction intimation under Section 176 of the Indian Contract Act 1872. 3) Ornaments are secured in a double-custody fireproof vault in a sealed tamper-proof pouch and returned in identical condition upon full closure.
          </div>

          <div class="sig-grid">
            <div class="sig-card">
              <span class="sig-label">Borrower Pledge Signature</span>
              <div style="border-bottom: 1px dashed #94A3B8; margin: auto 0; font-size: 9px; color: #94A3B8; font-style: italic;">Sign Above</div>
              <span class="sig-name">${loan.customerName}</span>
            </div>
            <div class="sig-card">
              <span class="sig-label">Appraiser / Credit Manager</span>
              <div style="margin: auto 0;"><span class="sig-tag" style="background: #DBEAFE; color: #1E40AF;">PURITY & WT VERIFIED</span></div>
              <span class="sig-name">${dualSign.creditManagerName || 'Credit Manager'}</span>
            </div>
            <div class="sig-card bm">
              <span class="sig-label">Branch Manager / Custodian</span>
              <div style="margin: auto 0;"><span class="sig-tag" style="background: #D1FAE5; color: #065F46;">SEALED & VAULT LOCKED</span></div>
              <span class="sig-name">${dualSign.branchManagerName || 'Branch Manager'}</span>
            </div>
          </div>

          <div class="footer-note">
            Golden Leaf Finance Pvt. Ltd. • Official Pawn Ticket & Pledge Receipt • Computer Generated Security Record • ${new Date().toLocaleString('en-IN')}
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ── 2. HIGH-RESOLUTION VECTOR PDF DOWNLOAD ──
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await generateGoldLoanPawnTicketPDF(loan);
    } catch (err) {
      console.error('Failed to generate Pawn Ticket PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // ── 3. OPEN VECTOR PDF IN NEW BROWSER TAB ──
  const handleOpenPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const url = await generateGoldLoanPawnTicketPDFBlobUrl(loan);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to open Pawn Ticket PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        data-gold-modal="true"
        className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:z-auto"
      >
        {/* Global Print Isolation Style to ensure native print also ignores background page */}
        <style>{`
          @media print {
            body {
              visibility: hidden !important;
              background: #fff !important;
            }
            #gold-loan-pawn-ticket-print-area,
            #gold-loan-pawn-ticket-print-area * {
              visibility: visible !important;
            }
            #gold-loan-pawn-ticket-print-area {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 12mm !important;
              background: white !important;
              z-index: 999999 !important;
            }
          }
        `}</style>

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col print:max-h-none print:shadow-none print:rounded-none font-body text-xs"
        >
          {/* Top Bar (Hidden in Print) */}
          <div className="print:hidden px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#0B1F3A] text-[#D4AF37]">
                <FileText size={18} />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-[#0B1F3A]">
                  Gold Loan Pawn Ticket & Ornament Pledge Receipt
                </h3>
                <p className="text-[11px] text-gray-500 font-mono">
                  Loan A/C: <strong>{loan.id}</strong> • Sealed Packet: <strong>{loan.tamperProofPacketSerialNo}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {onProceedToDisburse &&
                (loan.status === 'VAULT_LOCKED_PENDING_UTR' || loan.status === 'APPRAISED_AWAITING_VAULT') && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onProceedToDisburse(loan);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all min-h-[38px]"
                  >
                    <Sparkles size={14} />
                    <span>Approve & Disburse</span>
                  </button>
                )}

              {/* Download Vector PDF */}
              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={handleDownloadPdf}
                title="Download Official High-Resolution PDF"
                className="px-3 py-2 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#8C6808] border border-[#D4AF37]/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all min-h-[38px]"
              >
                <FileDown size={14} className="text-[#8C6808]" />
                <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
              </button>

              {/* Open in PDF Viewer */}
              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={handleOpenPdf}
                title="Open Clean Official PDF in New Tab"
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all min-h-[38px]"
              >
                <ExternalLink size={14} />
                <span>Open PDF</span>
              </button>

              {/* Clean Print Window */}
              <button
                type="button"
                onClick={handlePrint}
                title="Print Clean Official Pawn Ticket"
                className="px-3.5 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#132c4e] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all min-h-[38px]"
              >
                <Printer size={14} className="text-[#D4AF37]" />
                <span>Print Ticket</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="p-2 rounded-xl hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable Document Area */}
          <div
            id="gold-loan-pawn-ticket-print-area"
            className="p-6 sm:p-10 overflow-y-auto text-gray-900 print:p-0 print:overflow-visible space-y-5"
          >
            {/* Header */}
            <header className="border-b-2 border-[#0B1F3A] pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#D4AF37] shrink-0" />
                    <h1 className="text-xl font-black text-[#0B1F3A] uppercase tracking-tight font-display">
                      GOLDENLEAF FINANCE LIMITED
                    </h1>
                  </div>
                  <p className="text-[10px] font-bold text-gray-700 mt-0.5">
                    Branch Office: {loan.branchName || 'Main Branch'} ({loan.branchId}) | Official Gold Loan Pawn Ticket & Ornament Pledge Receipt
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Reg. Office: Anna Nagar, Chennai | Custodian Vault Safe No: <strong>{safeLocation.safeNumber}</strong> | Form GL-PLG-12A
                  </p>
                </div>
                <div className="text-right shrink-0 bg-amber-50 border border-amber-300 rounded-xl p-2.5 shadow-2xs">
                  <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#0B1F3A] text-white">
                    PART A: PLEDGE RECEIPT
                  </span>
                  <div className="font-mono text-xs font-black text-[#0B1F3A] mt-1">
                    {loan.id}
                  </div>
                  <div className="text-[10px] text-amber-900 font-mono font-bold">
                    Pouch: {loan.tamperProofPacketSerialNo}
                  </div>
                </div>
              </div>
            </header>

            {/* Borrower & Vault Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-[11px]">
              <div>
                <span className="text-gray-500 block text-[9px] uppercase font-bold">Borrower Full Name</span>
                <strong className="text-gray-900 text-xs font-bold">{loan.customerName}</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[9px] uppercase font-bold">Mobile Number</span>
                <strong className="text-gray-900 font-bold">+91 {loan.customerMobile.replace('+91', '').trim()}</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[9px] uppercase font-bold">Nominee Details</span>
                <strong className="text-gray-900 font-medium">{loan.nomineeName || 'Nominee'} ({loan.nomineeRelationship || 'Family'})</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[9px] uppercase font-bold">Vault Slot Location</span>
                <strong className="text-[#0B1F3A] font-mono font-bold">
                  {safeLocation.safeNumber} / {safeLocation.rackCabinet} / {safeLocation.traySlot}
                </strong>
              </div>
            </div>

            {/* Pledged Ornaments Itemization Table */}
            <div className="border border-gray-300 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B1F3A] text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-2.5 text-center w-8">#</th>
                    <th className="p-2.5">Pledged Ornament Description</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Gross Wt (g)</th>
                    <th className="p-2.5 text-right">Stone/Less (g)</th>
                    <th className="p-2.5 text-right">Net Wt (g)</th>
                    <th className="p-2.5 text-center">Purity</th>
                    <th className="p-2.5 text-right">Appraised Value (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-gray-50/50">
                      <td className="p-2.5 font-bold font-mono text-gray-500 text-center">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-gray-900">
                        {item.ornamentType}
                        {item.conditionRemarks && (
                          <span className="block text-[10px] text-gray-500 font-normal">{item.conditionRemarks}</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                      <td className="p-2.5 text-right font-mono">{Number(item.grossWeightGrams || 0).toFixed(3)}g</td>
                      <td className="p-2.5 text-right font-mono text-red-700">-{Number(item.stoneDeductionGrams || 0).toFixed(3)}g</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-800">{Number(item.netWeightGrams || 0).toFixed(3)}g</td>
                      <td className="p-2.5 text-center font-bold">{item.caratPurity}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-[#0B1F3A]">
                        ₹{Number(item.eligibleMarketValue || 0).toLocaleString('en-IN')}.00
                      </td>
                    </tr>
                  ))}

                  {/* Summary Total */}
                  <tr className="bg-amber-50/90 font-black text-xs border-t-2 border-amber-300">
                    <td colSpan={2} className="p-2.5 text-[#0B1F3A] uppercase tracking-wider font-extrabold">
                      TOTAL ORNAMENTS IN SEALED PACKET:
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold">{loan.totalQuantity} Pcs</td>
                    <td className="p-2.5 text-right font-mono">{Number(loan.totalGrossWeightGrams || 0).toFixed(3)}g</td>
                    <td className="p-2.5 text-right font-mono text-red-700">-{Number(loan.totalStoneDeductionGrams || 0).toFixed(3)}g</td>
                    <td className="p-2.5 text-right font-mono text-emerald-900 text-sm font-black">
                      {Number(loan.totalNetWeightGrams || 0).toFixed(3)}g
                    </td>
                    <td className="p-2.5 text-center font-bold text-gray-700">LTV 75%</td>
                    <td className="p-2.5 text-right font-mono font-black text-emerald-950 text-sm">
                      ₹{Number(loan.totalAppraisedEligibleValue || 0).toLocaleString('en-IN')}.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Financial Terms Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Sanctioned Loan Amount</span>
                <strong className="text-emerald-900 text-sm font-black font-mono">
                  ₹{Number(loan.sanctionedLoanAmount || 0).toLocaleString('en-IN')}.00
                </strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Repayment Scheme</span>
                <strong className="text-[#0B1F3A] font-bold">{loan.repaymentScheme || 'Monthly Interest Servicing'}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Interest Rate & Monthly Dues</span>
                <strong className="text-blue-900 font-bold">
                  {Number(loan.interestRateAnnual || 12)}% p.a. (₹{Number(loan.monthlyInterestAmount || 0).toLocaleString('en-IN')}/mo)
                </strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Maturity Due Date</span>
                <strong className="text-red-700 font-bold">{loan.maturityDate || '-'}</strong>
              </div>
            </div>

            {/* Statutory Terms */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-[10px] text-gray-600 space-y-1">
              <p>
                <strong>Terms of Pledge:</strong> 1) The original Pawn Ticket must be surrendered in person during redemption. 2) Monthly interest must be serviced regularly. Overdue accounts will attract reminder notices and statutory auction intimation under Section 176 of the Indian Contract Act 1872. 3) Ornaments are secured in a double-custody fireproof vault in a sealed pouch and returned in identical condition upon full closure.
              </p>
            </div>

            {/* Signature Blocks */}
            <div className="grid grid-cols-3 gap-6 pt-4 border-t-2 border-[#0B1F3A] text-center">
              <div className="border border-gray-300 rounded-xl p-3 h-28 flex flex-col justify-between bg-gray-50/40">
                <span className="text-[9px] font-bold uppercase text-gray-500">Borrower Pledge Signature</span>
                <div className="border-b border-dashed border-gray-400 my-auto py-1 text-[10px] text-gray-400 italic">
                  Sign Above
                </div>
                <strong className="text-[#0B1F3A] truncate font-bold">{loan.customerName}</strong>
              </div>

              <div className="border border-gray-300 rounded-xl p-3 h-28 flex flex-col justify-between bg-gray-50/40">
                <span className="text-[9px] font-bold uppercase text-gray-500">Appraiser / Credit Manager</span>
                <div className="my-auto py-1">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-bold">
                    PURITY VERIFIED
                  </span>
                </div>
                <strong className="text-blue-950 truncate font-bold">{dualSign.creditManagerName || 'Credit Manager'}</strong>
              </div>

              <div className="border-2 border-[#0B1F3A] rounded-xl p-3 h-28 flex flex-col justify-between bg-amber-50/50">
                <span className="text-[9px] font-bold uppercase text-[#0B1F3A]">Branch Manager / Custodian</span>
                <div className="my-auto py-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                    SEALED & VAULT LOCKED
                  </span>
                </div>
                <strong className="text-[#0B1F3A] truncate font-bold">{dualSign.branchManagerName || 'Branch Manager'}</strong>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
