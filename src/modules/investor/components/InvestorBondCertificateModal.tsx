// ──────────────────────────────────────────────────
// Golden Leaf Finance — Official Investor Bond Certificate
// Admin Auto-Generated Capital Contributor Legal Instrument
// Printable & Downloadable PDF Bond Certificate
// ──────────────────────────────────────────────────

import React, { useRef } from 'react';
import { Printer, Download, X, Shield, Award } from 'lucide-react';
import type { Investor } from '../../../types/investor.types';
import { numberToWords } from '../../../utils/fdCalculations';

const goldenLeafLogo = '/logo-icon.png';

interface InvestorBondCertificateModalProps {
  investor: Investor;
  onClose: () => void;
}

export const InvestorBondCertificateModal: React.FC<InvestorBondCertificateModalProps> = ({
  investor,
  onClose,
}) => {
  const certRef = useRef<HTMLDivElement>(null);

  const principal = Number(investor.investmentAmount || investor.totalPrincipal || 0);
  const interestRate = Number(investor.interestRate || (investor.category === 'Senior Citizen' ? 10.0 : 12.0));
  const tenureMonths = Number(investor.tenureMonths || 12);
  const tenureYears = Number(investor.tenureYears || Math.max(1, Math.round(tenureMonths / 12)));
  const payoutFreq = investor.payoutFrequency || 'Monthly';
  const monthlyPayout = investor.monthlyInterest || Math.round((principal * (interestRate / 100)) / 12);
  const totalInterest = investor.totalInterestPayable ?? Math.round(principal * (interestRate / 100) * (tenureMonths / 12));
  const maturityValue = investor.maturityAmount ?? (principal + totalInterest);

  const issueDateStr = investor.investmentDate || new Date(investor.createdAt || Date.now()).toISOString().slice(0, 10);
  const issueDateFormatted = new Date(issueDateStr).toLocaleDateString('en-IN');

  const maturityDateStr = (() => {
    if (investor.maturityDate) return new Date(investor.maturityDate).toLocaleDateString('en-IN');
    const d = new Date(issueDateStr);
    d.setMonth(d.getMonth() + tenureMonths);
    return d.toLocaleDateString('en-IN');
  })();

  const bondNumber = investor.bondNumber || `GLF/INV-BOND/${new Date().getFullYear()}/${investor.investorId.replace('GLF-INV-', '')}`;

  const fullAddress = investor.address
    ? `${investor.address.doorNo ? investor.address.doorNo + ', ' : ''}${investor.address.street || ''}, ${investor.address.town || ''}, ${investor.address.district || ''}, ${investor.address.state || 'Tamil Nadu'} - ${investor.address.pinCode || ''}`
    : 'Registered Capital Contributor Address on File';

  const handlePrint = () => {
    const printContent = certRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Investor Capital Bond - ${investor.investorId} - ${bondNumber}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              color: #1a1a1a;
              margin: 0;
              padding: 0;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .cert-outer {
              border: 4px double #8C6808;
              padding: 24px;
              position: relative;
              background: #FFFDF9;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-30deg);
              font-size: 54px;
              font-weight: bold;
              color: rgba(212, 175, 55, 0.08);
              text-transform: uppercase;
              letter-spacing: 6px;
              white-space: nowrap;
              pointer-events: none;
            }
            .cert-meta {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-family: Arial, sans-serif;
              font-size: 11px;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px solid #E2E8F0;
            }
            .cert-meta-left { text-align: left; flex: 1; }
            .cert-meta-center { text-align: center; flex: 1; }
            .cert-meta-right { text-align: right; flex: 1; }
            .cert-table {
              width: 100%;
              border-collapse: collapse;
              margin: 14px 0;
              font-size: 11.5px;
            }
            .cert-table th {
              background-color: #F8F3E6;
              border: 1px solid #C4A247;
              padding: 6px 10px;
              font-weight: bold;
              color: #5C4305;
            }
            .cert-table td {
              border: 1px solid #C4A247;
              padding: 6px 10px;
            }
            .text-left { text-align: left !important; }
            .text-right { text-align: right !important; }
            .text-center { text-align: center !important; }
            .font-mono { font-family: 'Courier New', Courier, monospace !important; }
            .sig-row {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
              padding-top: 10px;
            }
            .sig-box {
              width: 30%;
              border-top: 1px solid #333;
              padding-top: 6px;
              text-align: center;
              font-size: 11px;
            }
            .terms-box {
              margin-top: 16px;
              padding: 8px 12px;
              border: 1px dashed #C4A247;
              background-color: #FAF6ED;
              font-size: 9.5px;
              line-height: 1.45;
              color: #4A4A4A;
              text-align: justify;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[94dvh] flex flex-col overflow-hidden border border-[#D4AF37]/40 my-auto animate-fade-in">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-[#0B1F3A] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Award size={20} className="text-[#D4AF37] shrink-0" />
            <div>
              <span className="font-display font-bold text-sm sm:text-base tracking-wide block">
                Official Investor Capital Bond & Promissory Certificate
              </span>
              <span className="text-[10px] text-[#94A3B8]">
                Admin Master Register • GLF Capital Contributor Instrument
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-3.5 py-2 min-h-[38px] rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-[0.98]"
            >
              <Printer size={14} /> Print Certificate
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-3.5 py-2 min-h-[38px] rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <Download size={14} /> Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 min-h-[38px] min-w-[38px] rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer flex items-center justify-center shrink-0 ml-auto sm:ml-2"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Certificate Scroll Area */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-[#F8FAFC] custom-scrollbar">
          <div
            ref={certRef}
            className="cert-outer bg-[#FFFDF9] border-[3px] border-double border-[#8C6808] p-6 sm:p-8 rounded-xl shadow-lg relative max-w-3xl mx-auto text-[#1A1A1A] font-serif"
          >
            {/* Watermark */}
            <div className="watermark absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-30 text-5xl sm:text-7xl font-extrabold text-[#D4AF37]/[0.07] uppercase tracking-[8px] pointer-events-none select-none whitespace-nowrap">
              INVESTOR CAPITAL BOND
            </div>

            {/* Header */}
            <div className="text-center pb-3 border-b-2 border-[#8C6808] mb-4">
              <div className="flex items-center justify-center gap-3 mb-1">
                <img src={goldenLeafLogo} alt="Logo" className="w-10 h-10 object-contain" />
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#8C6808] tracking-widest uppercase font-serif">
                  GOLDENLEAF FINANCE
                </h1>
              </div>
              <p className="text-[11px] font-sans text-[#475569] font-medium tracking-wide">
                Registered Office / Branch: {investor.branchName} | Official Capital Contributor Bond Certificate
              </p>
            </div>

            {/* Meta Row (3 Columns) */}
            <div className="cert-meta grid grid-cols-3 items-center text-xs font-sans mb-3 pb-2 border-b border-[#E2E8F0]">
              <div className="cert-meta-left text-left">
                <strong className="text-[#475569]">Investor Bond No:</strong>{' '}
                <span className="font-mono font-bold text-[#8C6808]">{bondNumber}</span>
              </div>
              <div className="cert-meta-center text-center">
                <strong className="text-[#475569]">Investor ID:</strong>{' '}
                <span className="font-mono font-bold text-[#0B1F3A]">{investor.investorId}</span>
              </div>
              <div className="cert-meta-right text-right">
                <strong className="text-[#475569]">Issue Date:</strong>{' '}
                <span className="font-mono font-semibold text-[#0B1F3A]">{issueDateFormatted}</span>
              </div>
            </div>

            {/* Legal Certificate Preamble */}
            <div className="text-xs leading-relaxed text-justify mb-4 p-3 bg-[#FAF6ED] border border-[#E2D4B7] rounded-lg">
              <p>
                <strong>THIS IS TO CERTIFY THAT</strong> Goldenleaf Finance has registered and received from{' '}
                <strong className="text-[#0B1F3A] uppercase">{investor.fullName}</strong> (PAN:{' '}
                <strong className="font-mono">{investor.pan}</strong>, Aadhaar:{' '}
                <strong className="font-mono">{investor.aadhaar || 'Verified on File'}</strong>, Mobile:{' '}
                <strong className="font-mono">{investor.primaryMobile}</strong>, Residing at:{' '}
                <span>{fullAddress}</span>) a Capital Investment sum of{' '}
                <strong className="text-[#8C6808] font-mono">Rs. {principal.toLocaleString('en-IN')}/-</strong>{' '}
                (<em>Rupees {numberToWords(principal)} Only</em>) under the agreed terms, tenure, and fixed annual interest rate specified below, payable periodically to the designated bank account or upon maturity as per the registered standing instructions:
              </p>
            </div>

            {/* 4-Column Table */}
            <div className="overflow-x-auto w-full custom-scrollbar mb-4">
              <table className="cert-table w-full border-collapse border border-[#C4A247] text-xs min-w-[620px]">
                <thead>
                  <tr className="bg-[#F8F3E6] text-[#5C4305]">
                    <th className="border border-[#C4A247] p-2 text-left font-bold w-[26%]">CAPITAL INVESTMENT PARTICULARS</th>
                    <th className="border border-[#C4A247] p-2 text-left font-bold w-[24%]">VERIFIED BOND TERMS</th>
                    <th className="border border-[#C4A247] p-2 text-left font-bold w-[26%]">FINANCIAL RETURN SUMMARY</th>
                    <th className="border border-[#C4A247] p-2 text-right font-bold w-[24%]">VERIFIED FIGURES</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Investment Scheme & Payout</td>
                    <td className="border border-[#C4A247] p-2 capitalize">
                      Capital Contributor ({payoutFreq} Payout)
                    </td>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Principal Investment Amount</td>
                    <td className="border border-[#C4A247] p-2 text-right font-bold font-mono">
                      Rs. {principal.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Investor Category</td>
                    <td className="border border-[#C4A247] p-2">{investor.category}</td>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Agreed Annual Interest Rate</td>
                    <td className="border border-[#C4A247] p-2 text-right font-bold font-mono text-[#059669]">
                      {interestRate.toFixed(2)}% per annum
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Value Date (Commencement)</td>
                    <td className="border border-[#C4A247] p-2 font-mono">{issueDateFormatted}</td>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Monthly Periodic Payout</td>
                    <td className="border border-[#C4A247] p-2 text-right font-bold font-mono text-[#1E40AF]">
                      {payoutFreq === 'Cumulative' ? 'N.A. (At Maturity)' : `Rs. ${monthlyPayout.toLocaleString('en-IN')}`}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Investment Tenure</td>
                    <td className="border border-[#C4A247] p-2 font-mono">
                      {tenureYears} Year(s) ({tenureMonths} Months)
                    </td>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Total Interest Yield</td>
                    <td className="border border-[#C4A247] p-2 text-right font-bold font-mono">
                      Rs. {totalInterest.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Exact Maturity Date</td>
                    <td className="border border-[#C4A247] p-2 font-semibold font-mono">{maturityDateStr}</td>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">TDS Declaration Status</td>
                    <td className="border border-[#C4A247] p-2 text-right font-mono text-[11px]">
                      {investor.taxDeclaration === 'Standard TDS' ? 'Standard 10% TDS' : `${investor.taxDeclaration} Uploaded (0% TDS)`}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Payout Bank & Mode</td>
                    <td className="border border-[#C4A247] p-2 font-mono text-[11px]">
                      {investor.bankAccount?.bankName || 'Bank on File'} ({investor.bankAccount?.payoutMode || 'NEFT'})
                    </td>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Net Maturity / Total Return</td>
                    <td className="border border-[#C4A247] p-2 text-right font-bold font-mono text-[#8C6808] text-sm bg-[#FAF6ED]">
                      Rs. {maturityValue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Bank Account & IFSC</td>
                    <td className="border border-[#C4A247] p-2 font-mono text-[11px]">
                      A/C: ••••{investor.bankAccount?.accountNumber?.slice(-4) || 'XXXX'} | IFSC: {investor.bankAccount?.ifsc || 'N/A'}
                    </td>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">KYC & Governance Status</td>
                    <td className="border border-[#C4A247] p-2 text-right font-bold text-[11px] text-[#059669]">
                      ✓ {investor.kycStatus || 'VERIFIED'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="sig-row flex items-end justify-between mt-10 pt-4 text-center text-xs font-sans">
              <div className="sig-box w-[28%] border-t border-[#475569] pt-1.5">
                <p className="font-semibold text-[#0B1F3A]">Investor / Capital Contributor</p>
                <p className="text-[10px] text-[#64748B]">{investor.fullName}</p>
              </div>

              <div className="sig-box w-[28%] border-t border-[#475569] pt-1.5">
                <p className="font-semibold text-[#0B1F3A]">Verified By (Branch Manager)</p>
                <p className="text-[10px] text-[#64748B]">{investor.branchName}</p>
              </div>

              <div className="sig-box w-[34%] border-t border-[#475569] pt-1.5 relative">
                {/* Simulated Stamp Seal */}
                <div className="absolute -top-10 right-4 w-16 h-16 rounded-full border-2 border-dashed border-[#8C6808]/40 flex items-center justify-center text-[8px] font-bold text-[#8C6808]/60 uppercase rotate-12 pointer-events-none">
                  GLF SEAL
                </div>
                <p className="font-semibold text-[#0B1F3A]">Authorized Signatory</p>
                <p className="text-[10px] text-[#64748B]">For Goldenleaf Finance (Official Seal)</p>
              </div>
            </div>

            {/* Reverse Terms & Promissory Notes */}
            <div className="terms-box mt-6 p-2.5 border border-dashed border-[#C4A247] bg-[#FAF6ED] rounded text-[10px] leading-relaxed text-[#475569] text-justify font-sans">
              <p className="font-bold text-[#5C4305] mb-0.5">
                Capital Contributor Promissory & Security Conditions Printed on Reverse of Bond:
              </p>
              <p>
                <strong>Capital Contributor Instrument:</strong> This Investor Capital Bond acknowledges the receipt and registration of capital funds deployed into Goldenleaf Finance under company governance protocols. Interest payouts are transferred directly to the designated bank account on the scheduled payout cycle.
              </p>
              <p className="mt-0.5">
                <strong>Redemption & Premature Liquidation:</strong> Redemption upon maturity or premature withdrawal requires submission of written instructions along with this original Bond instrument. Premature closure is subject to administrative processing and applicable statutory guidelines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
