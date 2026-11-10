// ──────────────────────────────────────────────────
// Golden Leaf Finance — Sample Printable FD Bond Certificate
// Admin Auto-Generated Official Legal Document (Section 9)
// ──────────────────────────────────────────────────

import React, { useRef } from 'react';
import { Printer, Download, X, Shield, CheckCircle } from 'lucide-react';
import type { FixedDeposit } from '../../../types/fd.types';
import type { Investor } from '../../../types/investor.types';
import { formatINR, numberToWords } from '../../../utils/fdCalculations';
import { getCertificateTitleSetting } from '../../../services/fdService';
const goldenLeafLogo = '/logo-icon.png';

interface FDBondCertificateModalProps {
  fd: FixedDeposit;
  investor?: Investor | null;
  onClose: () => void;
}

export const FDBondCertificateModal: React.FC<FDBondCertificateModalProps> = ({
  fd,
  investor,
  onClose,
}) => {
  const certRef = useRef<HTMLDivElement>(null);
  const certTitle = getCertificateTitleSetting();

  const handlePrint = () => {
    const printContent = certRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${certTitle} - ${fd.fdNumber}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm;
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
              font-size: 60px;
              font-weight: bold;
              color: rgba(212, 175, 55, 0.08);
              text-transform: uppercase;
              letter-spacing: 6px;
              white-space: nowrap;
              pointer-events: none;
            }
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
              text-align: left;
              font-weight: bold;
              color: #5C4305;
            }
            .cert-table td {
              border: 1px solid #C4A247;
              padding: 6px 10px;
            }
            .sig-row {
              display: flex;
              justify-content: space-between;
              margin-top: 45px;
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
              margin-top: 18px;
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

  const fullAddress = investor?.address
    ? `${investor.address.doorNo}, ${investor.address.street}, ${investor.address.town}, ${investor.address.district}, ${investor.address.state} - ${investor.address.pinCode}`
    : 'Registered Depositor Address on File';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92dvh] flex flex-col overflow-hidden border border-[#D4AF37]/40 my-auto">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-[#0B1F3A] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Shield size={18} className="text-[#D4AF37] shrink-0" />
            <span className="font-display font-bold text-sm sm:text-base tracking-wide">
              Official FD Bond Certificate Preview
            </span>
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

        {/* Certificate Container */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-[#F8FAFC] custom-scrollbar">
          <div
            ref={certRef}
            className="cert-outer bg-[#FFFDF9] border-[3px] border-double border-[#8C6808] p-6 sm:p-8 rounded-xl shadow-lg relative max-w-3xl mx-auto text-[#1A1A1A] font-serif"
          >
            {/* Watermark */}
            <div className="watermark absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-30 text-5xl sm:text-7xl font-extrabold text-[#D4AF37]/[0.07] uppercase tracking-[8px] pointer-events-none select-none whitespace-nowrap">
              GOLDENLEAF FINANCE
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
                Registered Office / Branch: {fd.branchName} | Official {certTitle}
              </p>
            </div>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center justify-between text-xs font-sans mb-3 pb-2 border-b border-[#E2E8F0] gap-2">
              <div>
                <strong>FD Bond / Receipt No:</strong>{' '}
                <span className="font-mono font-bold text-[#8C6808]">{fd.fdNumber}</span>
              </div>
              <div>
                <strong>Investor ID:</strong>{' '}
                <span className="font-mono font-bold">{fd.investorId}</span>
              </div>
              <div>
                <strong>Issue Date:</strong>{' '}
                <span>{new Date(fd.bondIssuedAt || fd.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
            </div>

            {/* Legal Certificate Preamble */}
            <div className="text-xs leading-relaxed text-justify mb-4 p-3 bg-[#FAF6ED] border border-[#E2D4B7] rounded-lg">
              <p>
                <strong>THIS IS TO CERTIFY THAT</strong> Goldenleaf Finance has received from{' '}
                <strong className="text-[#0B1F3A] uppercase">{fd.investorName}</strong> (PAN:{' '}
                <strong className="font-mono">{fd.investorPan}</strong>, Mobile:{' '}
                <strong>{fd.investorMobile}</strong>, Residing at:{' '}
                <span>{fullAddress}</span>) a sum of{' '}
                <strong className="text-[#8C6808]">Rs. {fd.principal.toLocaleString('en-IN')}/-</strong>{' '}
                (<em>Rupees {numberToWords(fd.principal)} Only</em>) as a Fixed Deposit under the terms, tenure, and interest rate specified below, payable upon maturity or as per the registered standing instructions:
              </p>
            </div>

            {/* 2-Column Table */}
            <div className="overflow-x-auto w-full custom-scrollbar mb-4">
              <table className="cert-table w-full border-collapse border border-[#C4A247] text-xs min-w-[620px]">
                <thead>
                  <tr className="bg-[#F8F3E6] text-[#5C4305]">
                    <th className="border border-[#C4A247] p-2 text-left font-bold w-1/4">DEPOSIT PARTICULARS</th>
                    <th className="border border-[#C4A247] p-2 text-left font-bold w-1/4">VERIFIED BOND TERMS</th>
                    <th className="border border-[#C4A247] p-2 text-left font-bold w-1/4">FINANCIAL SUMMARY</th>
                    <th className="border border-[#C4A247] p-2 text-left font-bold w-1/4">VERIFIED FIGURES</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Deposit Scheme & Payout</td>
                    <td className="border border-[#C4A247] p-2 capitalize">
                      {fd.scheme === 'cumulative' ? 'Cumulative (Re-Investment)' : `Non-Cumulative (${fd.payoutFrequency})`}
                    </td>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Principal Deposit Amount</td>
                    <td className="border border-[#C4A247] p-2 font-bold font-mono">
                      Rs. {fd.principal.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Holding Pattern</td>
                    <td className="border border-[#C4A247] p-2">{fd.holdingPattern}</td>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Effective Interest Rate</td>
                    <td className="border border-[#C4A247] p-2 font-bold text-[#059669]">
                      {fd.effectiveRate.toFixed(2)}% per annum
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Value Date (Start Date)</td>
                    <td className="border border-[#C4A247] p-2">{new Date(fd.valueDate).toLocaleDateString('en-IN')}</td>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Periodic Interest Payout</td>
                    <td className="border border-[#C4A247] p-2">
                      {fd.periodicPayoutAmount > 0 ? `Rs. ${fd.periodicPayoutAmount.toLocaleString('en-IN')}` : 'N.A. (At Maturity)'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Deposit Tenure</td>
                    <td className="border border-[#C4A247] p-2">
                      {fd.tenureYears > 0 ? `${fd.tenureYears} Year(s) ` : ''}
                      {fd.tenureMonths > 0 ? `${fd.tenureMonths} Month(s) ` : ''}
                      ({fd.totalDays} Days)
                    </td>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Total Interest Payable</td>
                    <td className="border border-[#C4A247] p-2 font-bold font-mono">
                      Rs. {fd.totalGrossInterest.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Exact Maturity Date</td>
                    <td className="border border-[#C4A247] p-2 font-semibold">{new Date(fd.maturityDate).toLocaleDateString('en-IN')}</td>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">TDS Status (15G / 15H)</td>
                    <td className="border border-[#C4A247] p-2">
                      {fd.tdsStatus === 'Standard TDS' ? 'Standard 10% TDS' : `${fd.tdsStatus} Uploaded (0% TDS)`}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Registered Nominee</td>
                    <td className="border border-[#C4A247] p-2">
                      {fd.nominee.fullName} ({fd.nominee.relationship})
                    </td>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Final Maturity Value</td>
                    <td className="border border-[#C4A247] p-2 font-bold font-mono text-[#8C6808] text-sm">
                      Rs. {fd.netMaturityValue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Payment Mode & UTR/Chq</td>
                    <td className="border border-[#C4A247] p-2 font-mono text-[11px]">
                      {fd.fundingMode} - {fd.utrNumber}
                    </td>
                    <td className="border border-[#C4A247] p-2 font-semibold bg-[#FFFDF7]">Maturity Instruction (SI)</td>
                    <td className="border border-[#C4A247] p-2">{fd.maturityInstruction}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Three Signatures */}
            <div className="sig-row flex items-end justify-between mt-10 pt-4 text-center text-xs font-sans">
              <div className="sig-box w-[28%] border-t border-[#475569] pt-1.5">
                <p className="font-semibold text-[#0B1F3A]">Depositor / Investor</p>
                <p className="text-[10px] text-[#64748B]">{fd.investorName}</p>
              </div>

              <div className="sig-box w-[28%] border-t border-[#475569] pt-1.5">
                <p className="font-semibold text-[#0B1F3A]">Verified By (Branch Manager)</p>
                <p className="text-[10px] text-[#64748B]">{fd.branchName}</p>
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

            {/* Reverse Terms & Security Notice */}
            <div className="terms-box mt-6 p-2.5 border border-dashed border-[#C4A247] bg-[#FAF6ED] rounded text-[10px] leading-relaxed text-[#475569] text-justify font-sans">
              <p className="font-bold text-[#5C4305] mb-0.5">
                Certificate Security, Lien & Surrender Terms Printed on Reverse of Bond:
              </p>
              <p>
                <strong>Non-Transferable Instrument:</strong> This Fixed Deposit Bond is non-negotiable and cannot be transferred or pledged without written lien authorization from Goldenleaf Finance.
              </p>
              <p className="mt-0.5">
                <strong>Premature Closure & Bank Payouts:</strong> Premature withdrawal requires surrendering the original Bond with a signed request; penalty interest rates and adjustment of periodic interest already paid apply.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
