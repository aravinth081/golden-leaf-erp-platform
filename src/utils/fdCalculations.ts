// ──────────────────────────────────────────────────
// Golden Leaf Finance — FD & Investor Calculation Engine
// Compliant with RBI guidelines and Indian Financial Rules
// ──────────────────────────────────────────────────

export const DEFAULT_RATE_SLABS = [
  { id: 'slab-1', label: '180–364 Days', minDays: 180, maxDays: 364, baseRate: 8.5, isActive: true },
  { id: 'slab-2', label: '12–23 Months', minDays: 365, maxDays: 729, baseRate: 9.0, isActive: true },
  { id: 'slab-3', label: '24–36 Months', minDays: 730, maxDays: 1095, baseRate: 9.5, isActive: true },
  { id: 'slab-4', label: '36+ Months', minDays: 1096, maxDays: 99999, baseRate: 9.75, isActive: true },
];

export function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const today = new Date();
  const birth = new Date(dobString);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export function isSeniorCitizen(dobString: string): boolean {
  return calculateAge(dobString) >= 60;
}

export function addTenureToDate(
  startDateStr: string,
  years: number = 0,
  months: number = 0,
  days: number = 0
): string {
  const d = new Date(startDateStr || new Date().toISOString().split('T')[0]);
  d.setFullYear(d.getFullYear() + (years || 0));
  d.setMonth(d.getMonth() + (months || 0));
  d.setDate(d.getDate() + (days || 0));
  return d.toISOString().split('T')[0];
}

export function getDaysBetweenDates(startDateStr: string, endDateStr: string): number {
  const d1 = new Date(startDateStr);
  const d2 = new Date(endDateStr);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getBaseRateForDays(days: number, slabs = DEFAULT_RATE_SLABS): number {
  const found = slabs.find((s) => days >= s.minDays && days <= s.maxDays && s.isActive);
  return found ? found.baseRate : 8.5;
}

export interface FDCalculationInput {
  principal: number;
  tenureYears?: number;
  tenureMonths?: number;
  tenureDays?: number;
  scheme: 'cumulative' | 'non-cumulative';
  payoutFrequency?: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly' | 'At Maturity';
  baseRate: number;
  isSeniorCitizen?: boolean;
  isStaff?: boolean;
  isRenewal?: boolean;
  taxDeclaration?: '15G' | '15H' | 'Standard TDS';
  hasPAN?: boolean;
}

export interface FDCalculationResult {
  totalDays: number;
  effectiveRate: number;
  boosterRate: number;
  periodicPayoutAmount: number;
  totalGrossInterest: number;
  estimatedTDS: number;
  netMaturityValue: number;
}

export function computeFDReturns(input: FDCalculationInput): FDCalculationResult {
  const years = input.tenureYears || 0;
  const months = input.tenureMonths || 0;
  const days = input.tenureDays || 0;
  const totalDays = years * 365 + months * 30 + days;
  const tYears = totalDays / 365;

  let booster = 0;
  if (input.isSeniorCitizen) booster += 0.5;
  if (input.isStaff) booster += 1.0;
  if (input.isRenewal) booster += 0.25;
  if (input.principal >= 1500000) booster += 0.25; // High value bulk deposit booster

  const effectiveRate = input.baseRate + booster;
  const rateDecimal = effectiveRate / 100;

  let totalGrossInterest = 0;
  let periodicPayoutAmount = 0;
  let netMaturityValue = input.principal;

  if (input.scheme === 'cumulative') {
    // Quarterly compounding: A = P * (1 + r/n)^(n*t) with n = 4
    if (totalDays > 0) {
      const maturity = input.principal * Math.pow(1 + rateDecimal / 4, 4 * tYears);
      totalGrossInterest = Math.round(maturity - input.principal);
      netMaturityValue = Math.round(maturity);
    }
  } else {
    // Non-cumulative simple interest
    totalGrossInterest = Math.round(input.principal * rateDecimal * tYears);
    netMaturityValue = input.principal;

    const freq = input.payoutFrequency || 'Monthly';
    if (freq === 'Monthly') {
      periodicPayoutAmount = Math.round((input.principal * rateDecimal) / 12);
    } else if (freq === 'Quarterly') {
      periodicPayoutAmount = Math.round((input.principal * rateDecimal) / 4);
    } else if (freq === 'Half-Yearly') {
      periodicPayoutAmount = Math.round((input.principal * rateDecimal) / 2);
    } else if (freq === 'Yearly') {
      periodicPayoutAmount = Math.round(input.principal * rateDecimal);
    }
  }

  // TDS Engine
  let estimatedTDS = 0;
  if (input.taxDeclaration === '15G' || input.taxDeclaration === '15H') {
    estimatedTDS = 0;
  } else {
    const tdsLimit = input.isSeniorCitizen ? 50000 : 40000;
    const annualProjectedInterest = totalGrossInterest / Math.max(tYears, 1);
    if (annualProjectedInterest > tdsLimit) {
      const tdsRate = input.hasPAN === false ? 0.20 : 0.10;
      estimatedTDS = Math.round(totalGrossInterest * tdsRate);
    }
  }

  if (input.scheme === 'cumulative') {
    netMaturityValue = netMaturityValue - estimatedTDS;
  }

  return {
    totalDays,
    effectiveRate,
    boosterRate: booster,
    periodicPayoutAmount,
    totalGrossInterest,
    estimatedTDS,
    netMaturityValue,
  };
}

/**
 * Premature Closure Settlement Engine
 * Net Refundable Payout = Principal Deposit + Recalculated Interest (for Actual Run Days at Penalty Rate)
 *                       - Total Monthly Interest Already Paid Out - Applicable TDS
 */
export interface PrematureClosureInput {
  principal: number;
  actualRunDays: number;
  baseRateForActualDays: number;
  penaltyDeductionPercent: number; // e.g. 1.0% or 2.0%
  totalMonthlyInterestPaid: number;
  taxDeclaration?: '15G' | '15H' | 'Standard TDS';
}

export interface PrematureClosureResult {
  penaltyRate: number;
  recalculatedInterest: number;
  applicableTDS: number;
  netRefundablePayout: number;
}

export function computePrematureClosure(input: PrematureClosureInput): PrematureClosureResult {
  const penaltyRate = Math.max(0, input.baseRateForActualDays - input.penaltyDeductionPercent);
  const runYears = input.actualRunDays / 365;
  const recalculatedInterest = Math.round(input.principal * (penaltyRate / 100) * runYears);

  let applicableTDS = 0;
  if (input.taxDeclaration !== '15G' && input.taxDeclaration !== '15H') {
    if (recalculatedInterest > 40000) {
      applicableTDS = Math.round(recalculatedInterest * 0.10);
    }
  }

  const netRefundablePayout = Math.max(
    0,
    input.principal + recalculatedInterest - input.totalMonthlyInterestPaid - applicableTDS
  );

  return {
    penaltyRate,
    recalculatedInterest,
    applicableTDS,
    netRefundablePayout,
  };
}

export function formatINR(amount: number | undefined | null): string {
  if (amount == null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  if (!num || isNaN(num)) return '';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    let str = '';
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    } else if (n > 0) {
      str += a[n];
    }
    return str;
  }

  let n = Math.floor(num);
  let output = '';

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = Math.floor(n / 100);
  const rest = n % 100;

  if (crore > 0) output += inWords(crore) + ' Crore ';
  if (lakh > 0) output += inWords(lakh) + ' Lakh ';
  if (thousand > 0) output += inWords(thousand) + ' Thousand ';
  if (hundred > 0) output += a[hundred] + ' Hundred ';
  if (rest > 0) {
    if (output !== '') output += 'and ';
    output += inWords(rest) + ' ';
  }

  return output.trim();
}

export function generateInvestorId(seq: number): string {
  return `GLF-INV-${String(seq).padStart(4, '0')}`;
}

export function generateFDNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `GLF/FD/${year}/${String(seq).padStart(4, '0')}`;
}
