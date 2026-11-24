// ──────────────────────────────────────────────────
// Golden Leaf Finance — Date & DOB Utility Functions
// Reliable parsing, formatting, and age calculation
// Supports DD-MM-YYYY, DD/MM/YYYY, and YYYY-MM-DD
// ──────────────────────────────────────────────────

/**
 * Robustly parses a date-of-birth string into a valid Date object.
 * Supports:
 * - DD-MM-YYYY or DD/MM/YYYY
 * - YYYY-MM-DD or YYYY/MM/DD
 * - ISO string
 */
export function parseDobToDate(dobStr: string | null | undefined): Date | null {
  if (!dobStr || typeof dobStr !== 'string') return null;
  const trimmed = dobStr.trim();
  if (!trimmed) return null;

  // 1. DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY (handles spaces e.g. "01 - 01 - 2000")
  const dmyMatch = trimmed.match(/^(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const date = new Date(year, month, day);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    ) {
      return date;
    }
    return null;
  }

  // 2. YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = trimmed.match(/^(\d{4})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const date = new Date(year, month, day);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    ) {
      return date;
    }
    return null;
  }

  // 3. Fallback to standard Date parsing if valid
  const fallback = new Date(trimmed);
  if (!isNaN(fallback.getTime())) {
    return fallback;
  }

  return null;
}

/**
 * Calculates accurate age from any supported DOB format.
 */
export function calculateAge(dobStr: string | null | undefined): number {
  if (!dobStr) return 0;
  const birth = parseDobToDate(dobStr);
  if (!birth) return 0;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Returns true if age is 60 or above (Senior Citizen).
 */
export function isSeniorCitizen(dobStr: string | null | undefined): boolean {
  return calculateAge(dobStr) >= 60;
}

/**
 * Converts a DOB string from any format (like YYYY-MM-DD or 8-digit raw) to standard DD-MM-YYYY.
 */
export function formatToStandardDob(dobStr: string | null | undefined): string {
  if (!dobStr || typeof dobStr !== 'string') return '';
  const trimmed = dobStr.trim();
  if (!trimmed) return '';

  // Already standard DD-MM-YYYY (no spaces)
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // DD-MM-YYYY, DD/MM/YYYY, or with spaces like "01 - 01 - 2000"
  const dmyMatch = trimmed.match(/^(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    return `${d}-${m}-${dmyMatch[3]}`;
  }

  // YYYY-MM-DD or with spaces
  const ymdMatch = trimmed.match(/^(\d{4})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${d}-${m}-${y}`;
  }

  // Raw 8 digits (DDMMYYYY)
  if (/^\d{8}$/.test(trimmed)) {
    const d = trimmed.slice(0, 2);
    const m = trimmed.slice(2, 4);
    const y = trimmed.slice(4, 8);
    return `${d}-${m}-${y}`;
  }

  return trimmed;
}

/**
 * Converts a standard DD-MM-YYYY to ISO YYYY-MM-DD for systems requiring ISO format.
 */
export function formatDobToIso(dobStr: string | null | undefined): string {
  if (!dobStr || typeof dobStr !== 'string') return '';
  const trimmed = dobStr.trim();
  if (!trimmed) return '';

  const dmyMatch = trimmed.match(/^(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  return trimmed;
}
