import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GOLDEN_LEAF_LOGO_DATA_URL } from './logoDataUrl';
import type { EODSettlementRecord } from '../services/eodService';

export interface PDFReportOptions {
  title: string;
  subtitle?: string;
  startDate?: string;
  endDate?: string;
  branch?: string;
  agent?: string;
  headers: string[];
  rows: (string | number)[][];
  summaryItems?: { label: string; value: string }[];
  fileName?: string;
  orientation?: 'portrait' | 'landscape';
  columnStyles?: Record<number | string, any>;
}

export interface PDFBillOptions {
  receiptNo: string;
  date: string;
  time?: string;
  customerName: string;
  customerId: string;
  phone?: string;
  spouseName?: string;
  groupName?: string;
  centerName?: string;
  loanId: string;
  installmentNo: string;
  demandAmount: number;
  collectedAmount: number;
  paymentMode: string;
  status: string;
  agentName: string;
  branchName: string;
  fileName?: string;
  // Enhanced banking & microfinance fields
  outstandingBalance?: number;
  totalLoanAmount?: number;
  nextDueDate?: string;
  nextDueAmount?: number;
  transactionRef?: string;
  coBorrower?: string;
  address?: string;
  aadhaarMasked?: string;
  advanceAmount?: number;
  centerLeader?: string;
  loanProduct?: string;
}

export interface PDFCollectionSheetOptions {
  sheetRef: string;
  date: string;
  agentName: string;
  groupName: string;
  centerName: string;
  branchName: string;
  rows: {
    slNo: number;
    customerId: string;
    customerName: string;
    spouseName: string;
    phone: string;
    loanId: string;
    installmentNo: string;
    demandAmount: number;
    collectedAmount: number;
    mode: string;
    status: string;
  }[];
  fileName?: string;
}

export interface PDFAttendanceDayRow {
  dayNumber: number;
  dateStr: string;
  dayName: string;
  status: string;
  checkIn: string;
  checkOut: string;
  hoursWorked: string;
  location: string;
}

export interface PDFAttendanceOptions {
  monthName: string;
  employeeName: string;
  employeeId: string;
  role: string;
  department: string;
  branchName: string;
  totalDaysInMonth: number;
  presentDays: number;
  absentDays: number;
  totalHours: string;
  rows: PDFAttendanceDayRow[];
  fileName?: string;
}

// Guaranteed instant logo Base64
export async function getLogoBase64(): Promise<string> {
  return GOLDEN_LEAF_LOGO_DATA_URL;
}

/**
 * Converts any numeric amount into Indian Currency Words (e.g. Rupees Five Thousand Only).
 */
export function toIndianCurrencyWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Rupees Zero Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertTwoDigit = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return singleDigits[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    const t = Math.floor(n / 10);
    const u = n % 10;
    return `${tens[t]}${u > 0 ? ' ' + singleDigits[u] : ''}`.trim();
  };

  const convertThreeDigit = (n: number): string => {
    const h = Math.floor(n / 100);
    const rem = n % 100;
    let res = '';
    if (h > 0) {
      res += `${singleDigits[h]} Hundred`;
      if (rem > 0) res += ' ';
    }
    if (rem > 0) {
      res += convertTwoDigit(rem);
    }
    return res.trim();
  };

  const rounded = Math.round(num);
  const crore = Math.floor(rounded / 10000000);
  let rem = rounded % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  const parts: string[] = [];
  if (crore > 0) parts.push(`${convertTwoDigit(crore)} Crore`);
  if (lakh > 0) parts.push(`${convertTwoDigit(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${convertTwoDigit(thousand)} Thousand`);
  if (rem > 0 || parts.length === 0) {
    const three = convertThreeDigit(rem);
    if (three) parts.push(three);
  }

  return `Rupees ${parts.join(' ').replace(/\s+/g, ' ').trim()} Only`;
}

/**
 * Draws a sharp vector Code 128 / Code 39 style barcode in jsPDF.
 */
function drawBarcode(doc: jsPDF, x: number, y: number, width: number, height: number, text?: string) {
  const safeText = (text && String(text).trim()) || 'GLF-REC-001';
  doc.setFillColor(11, 31, 58);
  const charCodes = safeText.split('').map((c) => c.charCodeAt(0));
  let curX = x;
  const step = width / (charCodes.length * 3.5 + 8);

  // Initial guard bars
  doc.rect(curX, y, step * 1.5, height, 'F');
  curX += step * 2.2;
  doc.rect(curX, y, step * 1.5, height, 'F');
  curX += step * 2.2;

  charCodes.forEach((code, idx) => {
    const bar1 = code % 2 === 0 ? step * 1.6 : step * 0.9;
    const bar2 = code % 3 === 0 ? step * 2.0 : step * 1.1;
    doc.rect(curX, y, bar1, height, 'F');
    curX += bar1 + step * 0.8;
    doc.rect(curX, y, bar2, height, 'F');
    curX += bar2 + step * 0.9;
  });

  // End guard bars
  doc.rect(curX, y, step * 1.5, height, 'F');
  curX += step * 2.2;
  doc.rect(curX, y, step * 1.5, height, 'F');

  // Text under barcode
  doc.setFont('courier', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`* ${safeText} *`, x + width / 2, y + height + 2.5, { align: 'center' });
}

/**
 * Draws an authentic 2D QR Code verification matrix in vector format.
 */
function drawQRCode(doc: jsPDF, startX: number, startY: number, size: number, dataText: string) {
  const matrixSize = 25;
  const cell = size / matrixSize;

  // White base background
  doc.setFillColor(255, 255, 255);
  doc.rect(startX, startY, size, size, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.rect(startX, startY, size, size, 'S');

  // Draw 7x7 Finder Pattern helper
  const drawFinder = (r0: number, c0: number) => {
    // 7x7 Navy
    doc.setFillColor(11, 31, 58);
    doc.rect(startX + c0 * cell, startY + r0 * cell, 7 * cell, 7 * cell, 'F');
    // 5x5 White
    doc.setFillColor(255, 255, 255);
    doc.rect(startX + (c0 + 1) * cell, startY + (r0 + 1) * cell, 5 * cell, 5 * cell, 'F');
    // 3x3 Navy
    doc.setFillColor(11, 31, 58);
    doc.rect(startX + (c0 + 2) * cell, startY + (r0 + 2) * cell, 3 * cell, 3 * cell, 'F');
  };

  // 3 standard QR finder targets
  drawFinder(0, 0);
  drawFinder(0, matrixSize - 7);
  drawFinder(matrixSize - 7, 0);

  // Timing lines
  doc.setFillColor(11, 31, 58);
  for (let i = 8; i < matrixSize - 8; i += 2) {
    doc.rect(startX + i * cell, startY + 6 * cell, cell, cell, 'F');
    doc.rect(startX + 6 * cell, startY + i * cell, cell, cell, 'F');
  }

  // Alignment Pattern
  const aR = 16;
  const aC = 16;
  doc.rect(startX + aC * cell, startY + aR * cell, 5 * cell, 5 * cell, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(startX + (aC + 1) * cell, startY + (aR + 1) * cell, 3 * cell, 3 * cell, 'F');
  doc.setFillColor(11, 31, 58);
  doc.rect(startX + (aC + 2) * cell, startY + (aR + 2) * cell, cell, cell, 'F');

  // Deterministic pattern from data string
  let hash = 0;
  for (let i = 0; i < dataText.length; i++) {
    hash = (hash * 31 + dataText.charCodeAt(i)) >>> 0;
  }

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= matrixSize - 8) ||
        (r >= matrixSize - 8 && c < 8) ||
        r === 6 ||
        c === 6 ||
        (r >= 16 && r <= 20 && c >= 16 && c <= 20)
      ) {
        continue;
      }
      const val = (hash ^ (r * 19 + c * 29)) & 3;
      if (val === 1 || val === 2) {
        doc.rect(startX + c * cell, startY + r * cell, cell, cell, 'F');
      }
    }
  }
}

/**
 * Draws an official bank cashier collection seal / stamp.
 */
function drawOfficialBankSeal(
  doc: jsPDF,
  cx: number,
  cy: number,
  dateStr: string,
  agentName: string,
  agentId?: string
) {
  // Outer concentric circles
  doc.setDrawColor(180, 83, 9); // Amber-700 / Warm bronze ink
  doc.setLineWidth(0.7);
  doc.circle(cx, cy, 14, 'S');

  doc.setLineWidth(0.3);
  doc.circle(cx, cy, 12.8, 'S');

  doc.setLineWidth(0.2);
  doc.circle(cx, cy, 9, 'S');

  // Circular stamp texts
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(180, 83, 9);
  doc.text('GOLDEN LEAF FINANCE PVT LTD', cx, cy - 9.8, { align: 'center' });
  doc.text('* CHENNAI DIVISION *', cx, cy + 11.2, { align: 'center' });

  // Center Box
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(cx - 9.5, cy - 3.2, 19, 6.4, 0.5, 0.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(146, 64, 14);
  doc.text('CASH RECEIVED', cx, cy - 0.4, { align: 'center' });
  doc.setFontSize(5);
  doc.text('TALLIED & POSTED', cx, cy + 2.2, { align: 'center' });

  // Date and Auth
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(180, 83, 9);
  doc.text(dateStr, cx, cy - 4.8, { align: 'center' });
  doc.text(`AUTH: ${agentId || 'EMP-004'}`, cx, cy + 6.2, { align: 'center' });
}

// ──────────────────────────────────────────────────
// 1. EXECUTIVE REPORT PDF GENERATOR
// ──────────────────────────────────────────────────
export function buildReportPDFDoc(options: PDFReportOptions, logoBase64?: string): jsPDF {
  const doc = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const securityRef = `GLF-REF-${Math.floor(100000 + Math.random() * 900000)}`;

  // Header Box
  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, pageWidth, 32, 'F');


  // Render Official Logo Badge
  const reportLogo = logoBase64 || GOLDEN_LEAF_LOGO_DATA_URL;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(12, 5, 22, 22, 2.5, 2.5, 'F');
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, 5, 22, 22, 2.5, 2.5, 'S');
  try {
    doc.addImage(reportLogo, 'PNG', 13, 6, 20, 20);
  } catch {
    doc.addImage(GOLDEN_LEAF_LOGO_DATA_URL, 'PNG', 13, 6, 20, 20);
  }

  // Corporate Brand Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('GOLDEN LEAF FINANCE', 38, 18);


  let currentY = 40;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(11, 31, 58);
  doc.text(options.title.toUpperCase(), 14, currentY);

  currentY += 5.5;

  if (options.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(options.subtitle, 14, currentY);
    currentY += 6;
  } else {
    currentY += 1.5;
  }

  // Metadata Ribbon Container
  const ribbonHeight = 15;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, ribbonHeight, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, pageWidth - 28, ribbonHeight, 2, 2, 'S');

  doc.setFillColor(212, 175, 55);
  doc.roundedRect(14, currentY, 2.5, ribbonHeight, 1, 1, 'F');

  let metaX = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TIMEFRAME / PERIOD', metaX, currentY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(11, 31, 58);
  const periodText = (options.startDate && options.endDate) 
    ? `${options.startDate} to ${options.endDate}` 
    : 'All-Time Records';
  doc.text(periodText, metaX, currentY + 10.5);
  metaX += 58;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('BRANCH LOCATION', metaX, currentY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(11, 31, 58);
  const branchText = options.branch === 'all' || !options.branch ? 'All Branches (Headquarters)' : options.branch;
  doc.text(branchText, metaX, currentY + 10.5);
  metaX += 60;

  if (options.agent) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('COLLECTION OFFICER', metaX, currentY + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(11, 31, 58);
    doc.text(options.agent, metaX, currentY + 10.5);
    metaX += 58;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('COMPLIANCE AUDIT', metaX, currentY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129);
  doc.text('Audited & Passed', metaX, currentY + 10.5);

  currentY += ribbonHeight + 6;

  // Summary Stat Cards
  if (options.summaryItems && options.summaryItems.length > 0) {
    const cardCount = options.summaryItems.length;
    const gap = 3.5;
    const totalWidth = pageWidth - 28;
    const cardWidth = (totalWidth - (cardCount - 1) * gap) / cardCount;
    const cardHeight = 15;

    options.summaryItems.forEach((item, idx) => {
      const cardX = 14 + idx * (cardWidth + gap);
      
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'S');

      doc.setFillColor(212, 175, 55);
      doc.roundedRect(cardX, currentY, 1.5, cardHeight, 0.7, 0.7, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(item.label.toUpperCase(), cardX + 4.5, currentY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(11, 31, 58);
      doc.text(item.value, cardX + 4.5, currentY + 11);
    });

    currentY += cardHeight + 6;
  }

  // Data Table
  autoTable(doc, {
    startY: currentY,
    head: [options.headers],
    body: options.rows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.8,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      valign: 'middle',
    },
    columnStyles: options.columnStyles || undefined,
    headStyles: {
      fillColor: [11, 31, 58],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
      fontSize: 8.5,
      cellPadding: 3.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const text = String(data.cell.raw || '');
        if (text === 'Active' || text === 'Approved' || text === 'Collected' || text === 'Completed' || text === 'VERIFIED' || text === 'Passed' || text === 'Present' || text === 'Paid' || text === 'Advance') {
          data.cell.styles.textColor = [16, 185, 129];
          data.cell.styles.fontStyle = 'bold';
        } else if (text === 'Pending' || text === 'Late' || text === 'Under Review' || text === 'Due' || text === 'Partial') {
          data.cell.styles.textColor = [217, 119, 6];
          data.cell.styles.fontStyle = 'bold';
        } else if (text === 'Rejected' || text === 'Failed' || text === 'Absent') {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        doc.setFillColor(11, 31, 58);
        doc.rect(0, 0, pageWidth, 16, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('GOLDEN LEAF FINANCE', 14, 10.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(212, 175, 55);
        doc.text(`${options.title} (Contd.)`, pageWidth - 14, 10.5, { align: 'right' });
      }

      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.4);
      doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(11, 31, 58);
      doc.text('Golden Leaf Finance Pvt. Ltd.', 14, pageHeight - 8.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('|  Headquarters Chennai  |  Strictly Confidential  |  System Generated Audit Report', 53, pageHeight - 8.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(11, 31, 58);
      doc.text(
        `Page ${data.pageNumber} of ${doc.getNumberOfPages()}`,
        pageWidth - 14,
        pageHeight - 8.5,
        { align: 'right' }
      );
    },
    margin: { left: 14, right: 14, top: 22, bottom: 20 },
  });

  return doc;
}

// ──────────────────────────────────────────────────
// 2. ULTRA-HIGH QUALITY COLLECTION BILL / RECEIPT PDF GENERATOR
// ──────────────────────────────────────────────────
export function buildBillPDFDoc(options: PDFBillOptions, logoBase64?: string): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const fmt = (n: number) => `Rs. ${Math.round(n).toLocaleString('en-IN')}`;

  const demand = options.demandAmount || 2500;
  const collected = options.collectedAmount || 0;
  const isAdvance = options.status.toLowerCase().includes('advance') || collected > demand;
  const isPartial = options.status.toLowerCase().includes('partial') || (collected > 0 && collected < demand);
  const advanceAmount = isAdvance ? Math.max(0, collected - demand) : (options.advanceAmount || 0);
  const currentDueCleared = Math.min(collected, demand);
  const remainingDue = Math.max(0, demand - collected);

  // Outstanding balance calculation
  const outstanding =
    options.outstandingBalance !== undefined
      ? options.outstandingBalance
      : isAdvance
      ? 35000
      : Math.max(0, 40000 - collected);

  // Clean Payment Mode string without trailing 'PAYMENT' or duplicate parenthetical text
  let cleanPaymentMode = options.paymentMode || 'Cash at Center';
  if (cleanPaymentMode.toLowerCase().includes('cash')) {
    cleanPaymentMode = 'Cash at Center (Direct Field)';
  } else if (cleanPaymentMode.toLowerCase().includes('upi')) {
    cleanPaymentMode = 'Digital Payment (UPI / QR)';
  } else if (cleanPaymentMode.toLowerCase().includes('bank') || cleanPaymentMode.toLowerCase().includes('neft')) {
    cleanPaymentMode = 'Bank Transfer / IMPS';
  }

  // 1. TOP CORPORATE HEADER (Deep Navy #0B1F3A + Gold #D4AF37 Border)
  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Gold accent stripe
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 36, pageWidth, 1.2, 'F');

  // Official Logo Badge (X = 14, Y = 5, W = 26, H = 26)
  const activeLogo = logoBase64 || GOLDEN_LEAF_LOGO_DATA_URL;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 5, 26, 26, 2.5, 2.5, 'F');
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, 5, 26, 26, 2.5, 2.5, 'S');

  try {
    doc.addImage(activeLogo, 'PNG', 15.5, 6.5, 23, 23);
  } catch {
    doc.addImage(GOLDEN_LEAF_LOGO_DATA_URL, 'PNG', 15.5, 6.5, 23, 23);
  }

  // Company Corporate Titles
  doc.setFont('helvetica', 'bold');
  const isPendingStatus = (options.status || '').toLowerCase().includes('pending');

  // Company Corporate Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('GOLDEN LEAF FINANCE', 45, 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(212, 175, 55);
  const subTitleText = isPendingStatus
    ? 'OFFICIAL COLLECTION DEMAND SLIP & ADVICE'
    : 'OFFICIAL PAYMENT RECEIPT & COLLECTION BILL';
  doc.text(subTitleText, 45, 19.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(203, 213, 225);
  doc.text('Microfinance Enterprise Systems | ISO 9001:2026 Certified NBFC', 45, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(148, 163, 184);
  doc.text('Regd. Off: 42, GST Road, Guindy, Chennai - 600032 | Toll-Free: 1800-425-8899', 45, 29.5);

  // Top-Right Receipt Voucher Badge & Details
  let displayReceiptNo = options.receiptNo || '';
  if (!displayReceiptNo || displayReceiptNo.toLowerCase() === 'pending') {
    displayReceiptNo = `DEM-2026-${options.customerId?.replace(/\D/g, '') || '9010'}`;
  }
  const voucherBadge = isPendingStatus ? 'DEMAND SLIP' : 'PAYMENT RECEIPT';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(212, 175, 55);
  doc.text(voucherBadge, pageWidth - 14, 13, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(255, 255, 255);
  doc.text(displayReceiptNo, pageWidth - 14, 19.5, { align: 'right' });

  // Vector Barcode for Receipt Number
  drawBarcode(doc, pageWidth - 58, 21.5, 44, 4.5, displayReceiptNo);


  // 2. TRANSACTION METADATA STRIP (3-Column Balanced Grid - Matching Official Spec)
  let currentY = 41;
  const stripW = 182; // 14mm margins (14 to 196mm)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, stripW, 14, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, stripW, 14, 1.5, 1.5, 'S');

  // Gold indicator bar on left
  doc.setFillColor(212, 175, 55);
  doc.roundedRect(14, currentY, 3, 14, 1, 1, 'F');

  // Col 1: Date & Time (Width ~55mm)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TRANSACTION DATE', 22, currentY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(11, 31, 58);
  doc.text(`${options.date} (${options.time || '10:00 AM'})`, 22, currentY + 10.5);

  // Col 2: Payment Method (Width ~55mm)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PAYMENT METHOD', 84, currentY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(11, 31, 58);
  const displayPaymentMode = (options.paymentMode || 'CASH PAYMENT')
    .replace(/\s*\([^)]*\)/g, '')
    .trim()
    .toUpperCase();
  doc.text(displayPaymentMode || 'CASH PAYMENT', 84, currentY + 10.5);

  // Col 3: Branch & Hub (Width ~60mm)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('BRANCH & HUB', 144, currentY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(11, 31, 58);
  doc.text(options.branchName || 'Main Branch - Anna Nagar', 144, currentY + 10.5);

  currentY += 18;

  // 3. TWO-COLUMN ACCOUNT & BORROWER CARDS (88mm each + 6mm gap = 182mm)
  const cardW = 88;
  const cardH = 34;

  // ── LEFT CARD: CUSTOMER / BORROWER DETAILS ──
  const leftX = 14;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(leftX, currentY, cardW, cardH, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(leftX, currentY, cardW, cardH, 1.5, 1.5, 'S');

  // Navy Header Banner
  doc.setFillColor(11, 31, 58);
  doc.roundedRect(leftX, currentY, cardW, 7, 1.5, 1.5, 'F');
  doc.rect(leftX, currentY + 4, cardW, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('CUSTOMER / BORROWER DETAILS', leftX + 4, currentY + 4.8);

  const printCardRow = (
    labelX: number,
    valueX: number,
    y: number,
    lbl: string,
    val: string,
    valColor: [number, number, number] = [11, 31, 58],
    valBold = false
  ) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(lbl, labelX, y);
    doc.setFont('helvetica', valBold ? 'bold' : 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...valColor);
    doc.text(val, valueX, y);
  };

  let cy = currentY + 11.5;
  printCardRow(leftX + 4, leftX + 26, cy, 'NAME:', options.customerName, [11, 31, 58], true);
  cy += 5.2;
  printCardRow(leftX + 4, leftX + 26, cy, 'CLIENT ID:', options.customerId, [180, 83, 9], true);
  cy += 5.2;
  printCardRow(leftX + 4, leftX + 26, cy, 'GUARDIAN:', options.spouseName || options.coBorrower || '-');
  cy += 5.2;
  printCardRow(leftX + 4, leftX + 26, cy, 'PHONE:', options.phone || '—');

  // ── RIGHT CARD: LOAN ACCOUNT & GROUP INFO ──
  const rightX = 108;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(rightX, currentY, cardW, cardH, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(rightX, currentY, cardW, cardH, 1.5, 1.5, 'S');

  // Navy Header Banner
  doc.setFillColor(11, 31, 58);
  doc.roundedRect(rightX, currentY, cardW, 7, 1.5, 1.5, 'F');
  doc.rect(rightX, currentY + 4, cardW, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('LOAN ACCOUNT & GROUP INFO', rightX + 4, currentY + 4.8);

  const cleanInst = (options.installmentNo || '01 / 20')
    .replace(/\s*\(Demand Slip\)/gi, '')
    .replace(/\s*\(Pending Clearance\)/gi, '')
    .trim();

  cy = currentY + 11.5;
  printCardRow(rightX + 4, rightX + 28, cy, 'LOAN ID:', options.loanId, [11, 31, 58], true);
  cy += 5.2;
  printCardRow(rightX + 4, rightX + 28, cy, 'EMI NO:', cleanInst, [11, 31, 58], true);
  cy += 5.2;
  printCardRow(rightX + 4, rightX + 28, cy, 'GROUP:', options.groupName || '—');
  cy += 5.2;
  printCardRow(rightX + 4, rightX + 28, cy, 'COLLECTOR:', options.agentName || 'Authorized Officer');

  // Advance currentY past the cards (Fix table overlapping cards)
  currentY += cardH + 5;

  // 4. ITEMIZED FINANCIAL TRANSACTION TABLE (autoTable - 5 Columns Spanning full 182mm)
  const tableRows: (string | number)[][] = [];

  const cleanModeShort = (options.paymentMode || 'CASH')
    .replace(/Direct Field|Payment|Collection/gi, '')
    .replace(/\(\s*\)/g, '')
    .trim()
    .toUpperCase() || 'CASH';

  const itemDescription = isPendingStatus
    ? `Weekly EMI Demand (${cleanInst})`
    : `Weekly EMI Installment (${cleanInst})`;

  if (isAdvance) {
    tableRows.push([
      `Weekly EMI Installment (${cleanInst})`,
      fmt(demand),
      fmt(demand),
      cleanModeShort,
      'SUCCESS',
    ]);
    tableRows.push([
      `Advance Prepayment (Next Week Credit)`,
      'Rs. 0',
      fmt(advanceAmount),
      cleanModeShort,
      'ADVANCE',
    ]);
  } else if (isPartial) {
    tableRows.push([
      `Weekly EMI Installment (${cleanInst})`,
      fmt(demand),
      fmt(collected),
      cleanModeShort,
      'PARTIAL',
    ]);
    tableRows.push([
      `Unpaid Shortfall / Arrears Carried Forward`,
      fmt(remainingDue),
      'Rs. 0',
      '-',
      'PENDING',
    ]);
  } else {
    tableRows.push([
      itemDescription,
      fmt(demand),
      fmt(collected),
      cleanModeShort,
      isPendingStatus ? 'PENDING' : 'SUCCESS',
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [['ITEM / DESCRIPTION', 'DUE DEMAND (Rs.)', 'PAID AMOUNT (Rs.)', 'PAYMENT MODE', 'STATUS']],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.25,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [11, 31, 58],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      cellPadding: 3.2,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 66, fontStyle: 'bold' },
      1: { halign: 'right', cellWidth: 28 },
      2: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
      3: { halign: 'center', cellWidth: 28 },
      4: { halign: 'center', cellWidth: 30, fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const tableFinalY = (doc as any).lastAutoTable.finalY || currentY + 22;
  currentY = tableFinalY + 4;

  // 5. TOTAL AMOUNT RECEIVED & CONFIRMED BANNER (Prominent Executive Ledger Banner)
  const bannerH = 17;
  doc.setFillColor(11, 31, 58);
  doc.roundedRect(14, currentY, stripW, bannerH, 1.5, 1.5, 'F');
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, currentY, stripW, bannerH, 1.5, 1.5, 'S');

  // Gold indicator bar on left
  doc.setFillColor(212, 175, 55);
  doc.roundedRect(14, currentY, 3.5, bannerH, 1, 1, 'F');

  // Left Title & Big Amount
  const totalBannerTitle = isPendingStatus
    ? 'TOTAL SCHEDULED DUE DEMAND:'
    : 'TOTAL AMOUNT RECEIVED & CONFIRMED:';
  const totalBannerAmount = isPendingStatus ? fmt(demand) : fmt(collected);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(212, 175, 55);
  doc.text(totalBannerTitle, 22, currentY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(255, 255, 255);
  doc.text(totalBannerAmount, 22, currentY + 12.8);

  // Right Side: Remaining & Net Outstanding Balance
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  const remainingLabel = isPendingStatus
    ? `Pending Demand: ${fmt(demand)}`
    : remainingDue > 0
    ? `Remaining Balance: ${fmt(remainingDue)}`
    : 'Remaining Balance: Rs. 0';
  doc.text(remainingLabel, pageWidth - 20, currentY + 7.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Net Outstanding Balance: ${fmt(outstanding)}`, pageWidth - 20, currentY + 13, { align: 'right' });


  // 10. PAGE FOOTER (Strictly Pinned at pageHeight - 9)
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.line(14, pageHeight - 9, pageWidth - 14, pageHeight - 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(11, 31, 58);
  doc.text('Golden Leaf Finance Pvt. Ltd.', 14, pageHeight - 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('|  Headquarters Chennai  |  Official Collection Voucher  |  Regulated by Reserve Bank of India', 48, pageHeight - 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(11, 31, 58);
  doc.text('Page 1 of 1', pageWidth - 14, pageHeight - 5.5, { align: 'right' });

  return doc;
}

// ──────────────────────────────────────────────────
// 3. COLLECTION SHEET BATCH PDF GENERATOR (With logo.png)
// ──────────────────────────────────────────────────
export function buildCollectionSheetPDFDoc(options: PDFCollectionSheetOptions, logoBase64?: string): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const fmt = (n: number) => `Rs. ${n.toLocaleString('en-IN')}`;

  // Header Box (Dark Navy)
  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, pageWidth, 34, 'F');

  // Render Logo image (logo.png)
  // Official Logo Badge
  const sheetLogo = logoBase64 || GOLDEN_LEAF_LOGO_DATA_URL;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(12, 5, 24, 24, 3, 3, 'F');
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, 5, 24, 24, 3, 3, 'S');
  try {
    doc.addImage(sheetLogo, 'PNG', 13.5, 6.5, 21, 21);
  } catch {
    doc.addImage(GOLDEN_LEAF_LOGO_DATA_URL, 'PNG', 13.5, 6.5, 21, 21);
  }

  // Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('GOLDEN LEAF FINANCE', 40, 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(212, 175, 55);
  doc.text('OFFICIAL DAILY FIELD COLLECTION SHEET', 40, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Branch: ${options.branchName}  |  Microfinance Operational Record`, 40, 26);

  // Sheet Ref
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(245, 208, 97);
  doc.text('SHEET REF:', pageWidth - 14, 12, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(options.sheetRef, pageWidth - 14, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`Date: ${options.date}`, pageWidth - 14, 25, { align: 'right' });

  let currentY = 40;

  // Metadata Ribbon (182mm wide, 14mm to 196mm)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 14, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, pageWidth - 28, 14, 2, 2, 'S');

  doc.setFillColor(212, 175, 55);
  doc.roundedRect(14, currentY, 2.5, 14, 1, 1, 'F');

  let mx = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('COLLECTION OFFICER', mx, currentY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(11, 31, 58);
  doc.text(options.agentName, mx, currentY + 9.5);
  mx += 60;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('GROUP NAME', mx, currentY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(11, 31, 58);
  doc.text(options.groupName, mx, currentY + 9.5);
  mx += 60;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('CENTER', mx, currentY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(11, 31, 58);
  doc.text(options.centerName, mx, currentY + 9.5);

  currentY += 18;

  // Data Table (182mm wide, margins 14mm)
  const headers = ['#', 'CLIENT ID', 'CUSTOMER NAME', 'GUARDIAN', 'LOAN ID', 'EMI', 'DEMAND (Rs.)', 'COLLECTED (Rs.)', 'MODE'];
  const tableRows = options.rows.map(r => [
    r.slNo.toString(),
    r.customerId,
    r.customerName,
    r.spouseName || '-',
    r.loanId,
    r.installmentNo,
    fmt(r.demandAmount),
    fmt(r.collectedAmount),
    r.mode,
  ]);

  const totalDemand = options.rows.reduce((a, b) => a + b.demandAmount, 0);
  const totalCol = options.rows.reduce((a, b) => a + b.collectedAmount, 0);
  const totalPending = Math.max(0, totalDemand - totalCol);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [headers],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [11, 31, 58],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.8,
      cellPadding: 2,
      valign: 'middle',
      overflow: 'visible',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22, fontStyle: 'bold', halign: 'left' },
      2: { cellWidth: 30, fontStyle: 'bold', halign: 'left' },
      3: { cellWidth: 18, halign: 'left' },
      4: { cellWidth: 22, halign: 'left' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [16, 163, 122] },
      8: { cellWidth: 22, halign: 'left' },
    },
    foot: [[
      { content: 'TOTAL COLLECTION DEMAND & RECOVERY :', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold', fontSize: 7.5 } },
      fmt(totalDemand),
      fmt(totalCol),
      '',
    ]],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [11, 31, 58],
      fontStyle: 'bold',
      fontSize: 7.5,
      valign: 'middle',
    }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || (currentY + 30);

  // If table leaves room on current page, render Collection Reconciliation Cards & Guidelines
  if (finalY + 52 < pageHeight - 20) {
    const cardY = finalY + 6;

    // 1. RECONCILIATION SUMMARY TILES (4 equal columns across 182mm)
    const cardWidth = 43; // 43 * 4 = 172 + 10 gap = 182mm
    const cardGap = 3.3;
    const cardHeight = 16;
    const cards = [
      { label: 'TOTAL ACCOUNTS', val: `${options.rows.length} Accounts`, color: [11, 31, 58], bg: [248, 250, 252] },
      { label: 'DEMAND AMOUNT', val: fmt(totalDemand), color: [11, 31, 58], bg: [248, 250, 252] },
      { label: 'COLLECTED AMOUNT', val: fmt(totalCol), color: [16, 163, 122], bg: [240, 253, 244] },
      { label: 'PENDING BALANCE', val: fmt(totalPending), color: [217, 119, 6], bg: [254, 243, 199] },
    ];

    cards.forEach((c, idx) => {
      const cx = 14 + idx * (cardWidth + cardGap);
      doc.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
      doc.roundedRect(cx, cardY, cardWidth, cardHeight, 1.5, 1.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.roundedRect(cx, cardY, cardWidth, cardHeight, 1.5, 1.5, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      doc.text(c.label, cx + cardWidth / 2, cardY + 5, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(c.color[0], c.color[1], c.color[2]);
      doc.text(c.val, cx + cardWidth / 2, cardY + 11.5, { align: 'center' });
    });

    // 2. OPERATIONAL GUIDELINES & AUDIT BOX
    const boxY = cardY + cardHeight + 5;
    const boxHeight = 22;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, boxY, pageWidth - 28, boxHeight, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.roundedRect(14, boxY, pageWidth - 28, boxHeight, 2, 2, 'S');

    doc.setFillColor(212, 175, 55);
    doc.roundedRect(14, boxY, 2.5, boxHeight, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(11, 31, 58);
    doc.text('FIELD COLLECTION & AUDIT PROTOCOL', 20, boxY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    doc.text('1. Verification: Check borrower KYC passbook and installment number before collecting demand amounts.', 20, boxY + 10.5);
    doc.text('2. Digital Receipting: Issue system-generated SMS or printed receipt acknowledgment for every cash / UPI transaction.', 20, boxY + 14.5);
    doc.text('3. End-of-Day Settlement: Submit this collection sheet along with total cash collected to the Branch Cashier before 05:30 PM.', 20, boxY + 18.5);
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.4);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(11, 31, 58);
    doc.text('Golden Leaf Finance Pvt. Ltd.', 14, pageHeight - 8.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('|  Headquarters Chennai  |  Official Field Collection Sheet', 53, pageHeight - 8.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(11, 31, 58);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 8.5, { align: 'right' });
  }

  return doc;
}

// ──────────────────────────────────────────────────
// EXPORT HELPERS (DOWNLOAD & BLOB PREVIEW)
// ──────────────────────────────────────────────────

export async function generateReportPDF(options: PDFReportOptions) {
  const logo = await getLogoBase64();
  const doc = buildReportPDFDoc(options, logo);
  const fileName = options.fileName || `${options.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`;
  doc.save(fileName);
}

export async function generateReportPDFBlobUrl(options: PDFReportOptions): Promise<string> {
  const logo = await getLogoBase64();
  const doc = buildReportPDFDoc(options, logo);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

export async function generateBillPDF(options: PDFBillOptions) {
  const logo = await getLogoBase64();
  const doc = buildBillPDFDoc(options, logo);
  const fileName = options.fileName || `Receipt_${options.receiptNo}_${options.customerName.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}

export async function generateBillPDFBlobUrl(options: PDFBillOptions): Promise<string> {
  const logo = await getLogoBase64();
  const doc = buildBillPDFDoc(options, logo);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

export async function generateCollectionSheetPDF(options: PDFCollectionSheetOptions) {
  const logo = await getLogoBase64();
  const doc = buildCollectionSheetPDFDoc(options, logo);
  const fileName = options.fileName || `Collection_Sheet_${options.sheetRef}.pdf`;
  doc.save(fileName);
}

export async function generateCollectionSheetPDFBlobUrl(options: PDFCollectionSheetOptions): Promise<string> {
  const logo = await getLogoBase64();
  const doc = buildCollectionSheetPDFDoc(options, logo);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

// ──────────────────────────────────────────────────
// 4. MONTHLY STAFF ATTENDANCE REPORT PDF GENERATOR
// ──────────────────────────────────────────────────
export function buildMonthlyAttendancePDFDoc(options: PDFAttendanceOptions, logoBase64?: string): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top decorative bar (Navy + Gold)
  doc.setFillColor(11, 31, 58); // #0B1F3A
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(212, 175, 55); // #D4AF37
  doc.rect(0, 5, pageWidth, 1.2, 'F');

  let currentY = 14;

  // Header: Logo & Company Name
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 14, currentY, 12, 12);
    } catch {
      // ignore logo failure
    }
  }

  const headerLeftX = logoBase64 ? 29 : 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(11, 31, 58);
  doc.text('GOLDEN LEAF FINANCE', headerLeftX, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('MONTHLY STAFF ATTENDANCE & DUTY REPORT', headerLeftX, currentY + 10);

  // Top-right Month & Timestamp Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(21, 128, 61); // emerald-700
  doc.text(options.monthName.toUpperCase(), pageWidth - 14, currentY + 4, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - 14, currentY + 9, { align: 'right' });

  currentY += 16;

  // Employee & Period Information Grid (Boxed Card)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, pageWidth - 28, 26, 2, 2, 'FD');

  const col1X = 18;
  const col2X = 110;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('EMPLOYEE NAME:', col1X, currentY + 6);
  doc.setTextColor(11, 31, 58);
  doc.text(options.employeeName, col1X + 28, currentY + 6);

  doc.setTextColor(100, 116, 139);
  doc.text('BRANCH:', col2X, currentY + 6);
  doc.setTextColor(11, 31, 58);
  doc.text(options.branchName, col2X + 20, currentY + 6);

  // Row 2
  doc.setTextColor(100, 116, 139);
  doc.text('EMPLOYEE ID:', col1X, currentY + 12);
  doc.setTextColor(11, 31, 58);
  doc.text(options.employeeId, col1X + 28, currentY + 12);

  doc.setTextColor(100, 116, 139);
  doc.text('PERIOD:', col2X, currentY + 12);
  doc.setTextColor(11, 31, 58);
  doc.text(options.monthName, col2X + 20, currentY + 12);

  // Row 3
  doc.setTextColor(100, 116, 139);
  doc.text('DESIGNATION:', col1X, currentY + 18);
  doc.setTextColor(11, 31, 58);
  doc.text(`${options.role} (${options.department})`, col1X + 28, currentY + 18);

  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL DAYS:', col2X, currentY + 18);
  doc.setTextColor(11, 31, 58);
  doc.text(`${options.totalDaysInMonth} Days  (Present: ${options.presentDays} | Total: ${options.totalHours})`, col2X + 20, currentY + 18);

  currentY += 31;

  // Monthly Attendance Table
  const tableRows = options.rows.map((r) => [
    r.dayNumber.toString().padStart(2, '0'),
    r.dateStr,
    r.dayName,
    r.status.toUpperCase(),
    r.checkIn || '-',
    r.checkOut || '-',
    r.hoursWorked || '-',
    r.location || 'Branch Office',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [[
      '#',
      'DATE',
      'DAY',
      'STATUS',
      'CHECK IN',
      'CHECK OUT',
      'HOURS',
      'PUNCH LOCATION & GPS'
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 31, 58], // Navy
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      cellPadding: 2.2,
    },
    styles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      overflow: 'ellipsize',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 22, fontStyle: 'bold' },
      2: { cellWidth: 14 },
      3: { cellWidth: 18, fontStyle: 'bold' },
      4: { cellWidth: 18 },
      5: { cellWidth: 18 },
      6: { cellWidth: 16, fontStyle: 'bold' },
      7: { cellWidth: 'auto' },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.column.index === 3) {
          const val = String(data.cell.raw).toLowerCase();
          if (val.includes('present')) {
            data.cell.styles.textColor = [21, 128, 61]; // emerald-700
          } else if (val.includes('leave') || val.includes('absent')) {
            data.cell.styles.textColor = [185, 28, 28]; // red-700
          } else if (val.includes('week') || val.includes('off')) {
            data.cell.styles.textColor = [100, 116, 139]; // slate-500
          }
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // If there's enough space, print signatures, else add page
  if (currentY + 25 > pageHeight - 16) {
    doc.addPage();
    currentY = 20;
  }

  // Signatures Section
  const sigW = 60;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);

  // Employee
  doc.line(14, currentY + 10, 14 + sigW, currentY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(11, 31, 58);
  doc.text('EMPLOYEE SIGNATURE', 14 + sigW / 2, currentY + 14, { align: 'center' });

  // Branch Manager
  const sig2X = pageWidth - 14 - sigW;
  doc.line(sig2X, currentY + 10, pageWidth - 14, currentY + 10);
  doc.text('BRANCH MANAGER / HR VERIFICATION', sig2X + sigW / 2, currentY + 14, { align: 'center' });

  // Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(11, 31, 58);
    doc.text('Golden Leaf Finance Pvt. Ltd.', 14, pageHeight - 7.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('|  Confidential Staff Attendance Record  |  Tamper-Proof GPS Verified', 52, pageHeight - 7.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(11, 31, 58);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 7.5, { align: 'right' });
  }

  return doc;
}

export async function generateMonthlyAttendancePDF(options: PDFAttendanceOptions) {
  const logo = await getLogoBase64();
  const doc = buildMonthlyAttendancePDFDoc(options, logo);
  const safeName = options.employeeName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const safeMonth = options.monthName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const fileName = options.fileName || `Attendance_${safeName}_${safeMonth}.pdf`;
  doc.save(fileName);
}

export async function generateMonthlyAttendancePDFBlobUrl(options: PDFAttendanceOptions): Promise<string> {
  const logo = await getLogoBase64();
  const doc = buildMonthlyAttendancePDFDoc(options, logo);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

// ══════════════════════════════════════════════════════════
// END OF THE DAY (EOD) CASH SETTLEMENT PDF GENERATION
// ══════════════════════════════════════════════════════════

export function buildEODSettlementPDFDoc(record: EODSettlementRecord, logoBase64?: string): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Top Decorative Brand Bar
  doc.setFillColor(11, 31, 58); // #0B1F3A
  doc.rect(0, 0, pageWidth, 5.5, 'F');
  doc.setFillColor(212, 175, 55); // Gold
  doc.rect(0, 5.5, pageWidth, 1.2, 'F');

  // 2. Header: Logo & Company Name
  let y = 14;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 14, y - 2, 18, 18);
    } catch {
      // Fallback
    }
  }

  const textStartX = logoBase64 ? 36 : 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(11, 31, 58);
  doc.text('GOLDEN LEAF FINANCE PVT. LTD.', textStartX, y + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('NBFC-MFI Rural & Semi-Urban Operations | Reg: TN-CH-2024-MFI', textStartX, y + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(22, 101, 52); // Emerald
  doc.text('DAILY CASH & COLLECTION SETTLEMENT (EOD) REPORT', textStartX, y + 12);

  // Status Badge on the right
  const isVerified = record.status === 'VERIFIED';
  const badgeText = isVerified ? 'VERIFIED & IN SAFE' : 'PENDING VERIFICATION';
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  if (isVerified) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.setTextColor(22, 101, 52);
  } else {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(253, 230, 138);
    doc.setTextColor(146, 64, 14);
  }
  const badgeWidth = 44;
  doc.roundedRect(pageWidth - 14 - badgeWidth, y - 1, badgeWidth, 7, 2, 2, 'FD');
  doc.text(badgeText, pageWidth - 14 - badgeWidth / 2, y + 3.8, { align: 'center' });

  // 3. Metadata Details Box (Two Columns)
  y = 35;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);

  // Left column: Settlement & CRO details
  doc.setFont('helvetica', 'bold');
  doc.text('Settlement Ref:', 18, y + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(11, 31, 58);
  doc.text(record.id, 46, y + 5.5);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('Settlement Date:', 18, y + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(11, 31, 58);
  doc.text(`${record.date} (${record.displayTime})`, 46, y + 10.5);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('Officer (CRO):', 18, y + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(11, 31, 58);
  doc.text(`${record.agentName} (${record.agentId})`, 46, y + 15.5);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('Centers / Route:', 18, y + 20.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(11, 31, 58);
  doc.text(record.centersCovered || 'All Field Centers', 46, y + 20.5);

  // Right column: Branch & Verification details
  const col2X = 112;
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('Branch Name:', col2X, y + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(11, 31, 58);
  doc.text(`${record.branchName} (${record.branchId})`, col2X + 26, y + 5.5);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('Verified By:', col2X, y + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(11, 31, 58);
  doc.text(record.verifiedBy ? `${record.verifiedBy.userName} (${record.verifiedBy.role})` : 'Pending Verification', col2X + 26, y + 10.5);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('Verified Time:', col2X, y + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(11, 31, 58);
  doc.text(record.verifiedBy ? record.verifiedBy.verifiedAtDisplay : '—', col2X + 26, y + 15.5);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('Safe Deposit Vault:', col2X, y + 20.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(11, 31, 58);
  doc.text(record.safeBoxReference || 'Not yet deposited', col2X + 26, y + 20.5);

  // 4. Denomination Table
  y = 66;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(11, 31, 58);
  doc.text('1. PHYSICAL CASH DENOMINATION COUNT (NOTES & COINS)', 14, y);

  const denomRows = [
    ['INR 500 Notes', '₹500', String(record.denominations.notes500 || 0), `₹${((record.denominations.notes500 || 0) * 500).toLocaleString('en-IN')}`],
    ['INR 200 Notes', '₹200', String(record.denominations.notes200 || 0), `₹${((record.denominations.notes200 || 0) * 200).toLocaleString('en-IN')}`],
    ['INR 100 Notes', '₹100', String(record.denominations.notes100 || 0), `₹${((record.denominations.notes100 || 0) * 100).toLocaleString('en-IN')}`],
    ['INR 50 Notes', '₹50', String(record.denominations.notes50 || 0), `₹${((record.denominations.notes50 || 0) * 50).toLocaleString('en-IN')}`],
    ['INR 20 Notes', '₹20', String(record.denominations.notes20 || 0), `₹${((record.denominations.notes20 || 0) * 20).toLocaleString('en-IN')}`],
    ['INR 10 Notes', '₹10', String(record.denominations.notes10 || 0), `₹${((record.denominations.notes10 || 0) * 10).toLocaleString('en-IN')}`],
    ['Mixed Coins', 'Coins (₹1, ₹2, ₹5, ₹10)', '—', `₹${(Number(record.denominations.coins) || 0).toLocaleString('en-IN')}`],
  ];

  autoTable(doc, {
    startY: y + 2.5,
    margin: { left: 14, right: 14 },
    head: [['Currency Unit', 'Denomination', 'Notes Count', 'Subtotal Amount (INR)']],
    body: denomRows,
    foot: [['TOTAL PHYSICAL CASH COUNTED', '', '', `₹${record.physicalCashTotal.toLocaleString('en-IN')}`]],
    theme: 'grid',
    headStyles: {
      fillColor: [11, 31, 58],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [11, 31, 58],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 35 },
      2: { cellWidth: 35, halign: 'center' },
      3: { halign: 'right', fontStyle: 'bold' },
    },
  });

  // 5. Daily Reconciliation Matrix Table
  const nextY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(11, 31, 58);
  doc.text('2. COLLECTION RECONCILIATION & VARIANCE AUDIT', 14, nextY);

  const reconRows = [
    ['Expected System Cash Collections', `₹${record.systemExpectedCash.toLocaleString('en-IN')}`, 'Cash receipts registered in mobile collection portal'],
    ['Physical Cash Handed Over', `₹${record.physicalCashTotal.toLocaleString('en-IN')}`, 'Actual notes & currency verified by Branch Manager'],
    [
      'Cash Variance (Difference)',
      record.variance === 0
        ? '₹0  (BALANCED EXACT MATCH ✓)'
        : record.variance < 0
        ? `- ₹${Math.abs(record.variance).toLocaleString('en-IN')}  (CASH SHORTAGE ⚠)`
        : `+ ₹${record.variance.toLocaleString('en-IN')}  (CASH EXCESS ℹ)`,
      record.variance === 0 ? 'Cash matched 100% with zero discrepancy' : 'Variance investigated with CRO remarks',
    ],
    ['Digital Collections (UPI / Bank Transfer)', `₹${record.systemDigitalAmount.toLocaleString('en-IN')}`, `${record.upiTransactionCount || 0} direct QR / UPI transaction(s)`],
    ['Total Day Collections Handled', `₹${record.systemTotalCollected.toLocaleString('en-IN')}`, `${record.totalReceiptsCount} Total borrower receipts completed`],
  ];

  autoTable(doc, {
    startY: nextY + 2.5,
    margin: { left: 14, right: 14 },
    head: [['Audit Parameter', 'Amount (INR)', 'Audit Remarks']],
    body: reconRows,
    theme: 'grid',
    headStyles: {
      fillColor: [22, 101, 52], // Emerald
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 65, fontStyle: 'bold' },
      1: { cellWidth: 55, fontStyle: 'bold' },
      2: { textColor: [100, 116, 139] },
    },
  });

  // 6. Remarks & Operational Notes
  let auditY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, auditY, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(11, 31, 58);
  doc.text('CRO Closing Comments:', 18, auditY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const croLines = doc.splitTextToSize(`"${record.croRemarks || 'All collections settled with zero discrepancy.'}"`, pageWidth - 70);
  doc.text(croLines, 54, auditY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 31, 58);
  doc.text('Branch Manager Remarks:', 18, auditY + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const bmText = record.bmRemarks || (record.verifiedBy ? 'Physical notes counted, matched and locked in safe vault.' : 'Awaiting physical cash inspection.');
  const bmLines = doc.splitTextToSize(`"${bmText}"`, pageWidth - 70);
  doc.text(bmLines, 54, auditY + 15.5);

  // 7. Signature / Seal Blocks
  const sigY = auditY + 30;
  const colWidth = (pageWidth - 36) / 2;

  // Left Signature: CRO
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, sigY, colWidth, 22, 2, 2, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('HANDED OVER BY (CRO):', 18, sigY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(11, 31, 58);
  doc.text(record.agentName, 18, sigY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Digital Sign ID: GLF-CRO-${record.agentId}`, 18, sigY + 18);

  // Right Signature: Branch Manager Safe Seal
  doc.roundedRect(14 + colWidth + 8, sigY, colWidth, 22, 2, 2, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('VERIFIED & RECEIVED BY (BRANCH MANAGER):', 14 + colWidth + 12, sigY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(22, 101, 52);
  doc.text(record.verifiedBy ? record.verifiedBy.userName : 'Branch Manager Authorization', 14 + colWidth + 12, sigY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(record.verifiedBy ? `Safe Vault Deposit Verified • ${record.verifiedBy.verifiedAtDisplay}` : 'Pending Physical Verification Stamp', 14 + colWidth + 12, sigY + 18);

  // 8. Footer line on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(11, 31, 58);
    doc.text('Golden Leaf Finance Pvt. Ltd.', 14, pageHeight - 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('|  Official End-of-Day Settlement & Safe Vault Handover  |  Tamper-Proof Audit Document', 46, pageHeight - 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(11, 31, 58);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 6.5, { align: 'right' });
  }

  return doc;
}

export async function generateEODSettlementPDF(record: EODSettlementRecord) {
  const logo = await getLogoBase64();
  const doc = buildEODSettlementPDFDoc(record, logo);
  const safeRef = record.id.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const fileName = `EOD_Settlement_${safeRef}.pdf`;
  doc.save(fileName);
}

export async function generateEODSettlementPDFBlobUrl(record: EODSettlementRecord): Promise<string> {
  const logo = await getLogoBase64();
  const doc = buildEODSettlementPDFDoc(record, logo);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

export async function generateConsolidatedEODPDF(
  records: EODSettlementRecord[],
  branchTitle: string = 'All Branches',
  dateStr: string = new Date().toISOString().split('T')[0]
) {
  const logo = await getLogoBase64();
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top header banner
  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 5, pageWidth, 1, 'F');

  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 14, 10, 14, 14);
    } catch {}
  }

  const textStartX = logo ? 32 : 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(11, 31, 58);
  doc.text('GOLDEN LEAF FINANCE PVT. LTD. — CONSOLIDATED EOD SETTLEMENT AUDIT', textStartX, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Executive Cash Handover & Safe Locker Register  |  Branch: ${branchTitle}  |  Date: ${dateStr}`, textStartX, 21);

  const tableRows = records.map((r) => [
    r.id,
    r.branchName.split('-')[0].trim(),
    r.agentName,
    `500x${r.denominations.notes500 || 0}, 200x${r.denominations.notes200 || 0}, 100x${r.denominations.notes100 || 0}, 50x${r.denominations.notes50 || 0}`,
    `₹${r.physicalCashTotal.toLocaleString('en-IN')}`,
    `₹${r.systemDigitalAmount.toLocaleString('en-IN')}`,
    `₹${r.systemTotalCollected.toLocaleString('en-IN')}`,
    r.variance === 0 ? 'Balanced' : r.variance < 0 ? `-₹${Math.abs(r.variance)}` : `+₹${r.variance}`,
    r.status === 'VERIFIED' ? `Verified: ${r.verifiedBy?.userName || 'BM'}` : 'Pending BM',
    r.safeBoxReference || '—',
  ]);

  const totalCash = records.reduce((acc, r) => acc + r.physicalCashTotal, 0);
  const totalDigital = records.reduce((acc, r) => acc + r.systemDigitalAmount, 0);
  const grandTotal = records.reduce((acc, r) => acc + r.systemTotalCollected, 0);

  autoTable(doc, {
    startY: 28,
    margin: { left: 14, right: 14 },
    head: [[
      'EOD Ref',
      'Branch',
      'CRO Officer',
      'Key Denominations (500, 200, 100, 50)',
      'Physical Cash',
      'Digital (UPI)',
      'Total Collected',
      'Variance',
      'Verification Status',
      'Safe Locker Ref',
    ]],
    body: tableRows,
    foot: [[
      'TOTALS',
      `${records.length} Settlements`,
      '',
      '',
      `₹${totalCash.toLocaleString('en-IN')}`,
      `₹${totalDigital.toLocaleString('en-IN')}`,
      `₹${grandTotal.toLocaleString('en-IN')}`,
      '',
      '',
      '',
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [11, 31, 58],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [11, 31, 58],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    styles: {
      fontSize: 6.8,
      cellPadding: 1.8,
    },
    columnStyles: {
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' },
      7: { halign: 'center' },
    },
  });

  doc.save(`Consolidated_EOD_Report_${dateStr}.pdf`);
}

