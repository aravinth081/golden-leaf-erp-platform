// ──────────────────────────────────────────────────
// Golden Leaf Finance — Dynamic KYC Document Generator
// Generates authentic, high-resolution vector (SVG) identity cards
// for manual verification (Aadhaar Front/Back, PAN, Voter ID)
// ──────────────────────────────────────────────────

import type { CreditApplicant } from '../services/creditManagerService';

/**
 * Escapes XML/SVG special characters
 */
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Formats Aadhaar number into standard 4-digit groups (e.g. XXXX XXXX 4512)
 */
export function formatAadhaarNumber(raw?: string): string {
  if (!raw) return 'XXXX XXXX 4512';
  const clean = raw.replace(/\s+/g, '').replace(/-/g, '');
  if (clean.length === 12) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)}`;
  }
  if (raw.includes('-')) {
    return raw.replace(/-/g, ' ');
  }
  return raw;
}

/**
 * Generates an authentic UIDAI Aadhaar Card SVG
 */
export function generateAadhaarCardSvg(
  applicant: CreditApplicant,
  side: 'front' | 'back' = 'front'
): string {
  const name = escapeXml(applicant.customerName || 'Customer');
  const fatherSpouse = escapeXml(applicant.fatherOrSpouseName || 'Spouse / Parent');
  const aadhaarFormatted = escapeXml(formatAadhaarNumber(applicant.aadhaarNumber));
  const address = escapeXml(applicant.address || 'Door 14, 2nd Cross, Malar Colony, Anna Nagar');
  const city = escapeXml(applicant.city || 'Chennai');
  const phone = escapeXml(applicant.phone || '+91 98401 23456');
  const photoUrl = applicant.customerPhotoUrl ? escapeXml(applicant.customerPhotoUrl) : '';

  if (side === 'back') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
      <defs>
        <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FF9933" />
          <stop offset="50%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="#138808" />
        </linearGradient>
        <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.15" />
        </filter>
        <pattern id="securityGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 20 M 0 0 L 20 20" fill="none" stroke="#E2E8F0" stroke-width="0.5" />
        </pattern>
      </defs>

      <!-- Card Base -->
      <rect x="10" y="10" width="780" height="480" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2" filter="url(#cardShadow)"/>
      <rect x="10" y="10" width="780" height="480" rx="18" fill="url(#securityGrid)" opacity="0.4" />

      <!-- Top Tricolor Accent Bar -->
      <path d="M 10 24 Q 10 10 24 10 L 776 10 Q 790 10 790 24 L 790 22 L 10 22 Z" fill="url(#headerGrad)"/>

      <!-- UIDAI Back Header -->
      <g transform="translate(30, 36)">
        <text x="0" y="20" font-family="'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="900" fill="#0B1F3A">भारतीय विशिष्ट पहचान प्राधिकरण</text>
        <text x="0" y="38" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#334155">Unique Identification Authority of India</text>
      </g>

      <!-- Center Divider Line -->
      <line x1="30" y1="90" x2="770" y2="90" stroke="#E2E8F0" stroke-width="1.5" />

      <!-- Address Content (Left Column) -->
      <g transform="translate(40, 115)">
        <text x="0" y="20" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#ED2A26">पता:</text>
        <text x="45" y="20" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#1E293B">आत्मज/पत्नी: ${fatherSpouse},</text>
        <text x="0" y="44" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#334155">${address},</text>
        <text x="0" y="68" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#334155">${city}, तमिलनाडु - 600040</text>

        <text x="0" y="115" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#ED2A26">Address:</text>
        <text x="70" y="115" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#1E293B">C/O: ${fatherSpouse},</text>
        <text x="0" y="139" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#334155">${address},</text>
        <text x="0" y="163" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#334155">${city}, Tamil Nadu - 600040</text>
        <text x="0" y="187" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#64748B">Registered Mobile: ${phone}</text>
      </g>

      <!-- Security QR Code Simulation (Right Column) -->
      <g transform="translate(560, 115)">
        <rect x="0" y="0" width="180" height="180" rx="12" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" />
        <!-- QR Matrix Blocks Simulation -->
        <rect x="15" y="15" width="40" height="40" fill="#0B1F3A" rx="4" />
        <rect x="23" y="23" width="24" height="24" fill="#FFFFFF" rx="2" />
        <rect x="29" y="29" width="12" height="12" fill="#0B1F3A" />

        <rect x="125" y="15" width="40" height="40" fill="#0B1F3A" rx="4" />
        <rect x="133" y="23" width="24" height="24" fill="#FFFFFF" rx="2" />
        <rect x="139" y="29" width="12" height="12" fill="#0B1F3A" />

        <rect x="15" y="125" width="40" height="40" fill="#0B1F3A" rx="4" />
        <rect x="23" y="133" width="24" height="24" fill="#FFFFFF" rx="2" />
        <rect x="29" y="139" width="12" height="12" fill="#0B1F3A" />

        <!-- Random-looking secure QR dots -->
        <circle cx="75" cy="30" r="5" fill="#0B1F3A"/>
        <circle cx="95" cy="45" r="4" fill="#0B1F3A"/>
        <circle cx="110" cy="25" r="5" fill="#0B1F3A"/>
        <circle cx="70" cy="70" r="6" fill="#ED2A26"/>
        <circle cx="90" cy="90" r="6" fill="#0B1F3A"/>
        <circle cx="110" cy="80" r="5" fill="#0B1F3A"/>
        <circle cx="135" cy="75" r="4" fill="#0B1F3A"/>
        <circle cx="80" cy="120" r="5" fill="#0B1F3A"/>
        <circle cx="100" cy="140" r="5" fill="#0B1F3A"/>
        <circle cx="140" cy="130" r="6" fill="#0B1F3A"/>

        <text x="90" y="202" font-family="'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#64748B" text-anchor="middle">UIDAI SECURE DIGITAL QR</text>
      </g>

      <!-- Bottom Bar with Aadhaar Number -->
      <g transform="translate(10, 370)">
        <rect x="0" y="0" width="780" height="75" fill="#FAFAFA" stroke="#E2E8F0" stroke-width="1" />
        <text x="390" y="42" font-family="'Courier New', monospace, sans-serif" font-size="28" font-weight="900" fill="#ED2A26" text-anchor="middle" letter-spacing="3">${aadhaarFormatted}</text>
        <line x1="30" y1="62" x2="750" y2="62" stroke="#ED2A26" stroke-width="3" />
      </g>

      <!-- Footer Helpdesk Line -->
      <g transform="translate(40, 465)">
        <text x="0" y="12" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#64748B">📞 1947  |  ✉ help@uidai.gov.in  |  🌐 www.uidai.gov.in</text>
        <text x="720" y="12" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#138808" text-anchor="end">✓ VERIFIED BY UIDAI</text>
      </g>
    </svg>`;
  }

  // Front Side
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <defs>
      <linearGradient id="headerGradFront" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#FF9933" />
        <stop offset="50%" stop-color="#FFFFFF" />
        <stop offset="100%" stop-color="#138808" />
      </linearGradient>
      <filter id="cardShadowFront" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.15" />
      </filter>
      <pattern id="securityGridFront" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 20 M 0 0 L 20 20" fill="none" stroke="#E2E8F0" stroke-width="0.5" />
      </pattern>
    </defs>

    <!-- Card Background -->
    <rect x="10" y="10" width="780" height="480" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2" filter="url(#cardShadowFront)"/>
    <rect x="10" y="10" width="780" height="480" rx="18" fill="url(#securityGridFront)" opacity="0.4" />

    <!-- Top Tricolor Accent Bar -->
    <path d="M 10 24 Q 10 10 24 10 L 776 10 Q 790 10 790 24 L 790 22 L 10 22 Z" fill="url(#headerGradFront)"/>

    <!-- Header Section -->
    <g transform="translate(30, 32)">
      <!-- Government of India / Bharat Sarkar -->
      <g>
        <circle cx="24" cy="24" r="22" fill="#F1F5F9" stroke="#CBD5E1" />
        <text x="24" y="28" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="900" fill="#0B1F3A" text-anchor="middle">GOI</text>
        <text x="56" y="20" font-family="'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="900" fill="#0B1F3A">भारत सरकार</text>
        <text x="56" y="38" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#334155">GOVERNMENT OF INDIA</text>
      </g>

      <!-- UIDAI Aadhaar Red Sun Emblem (Right) -->
      <g transform="translate(680, 2)">
        <circle cx="25" cy="22" r="22" fill="#ED2A26" />
        <circle cx="25" cy="22" r="16" fill="#FBBF24" />
        <circle cx="25" cy="22" r="10" fill="#ED2A26" />
        <text x="25" y="26" font-family="'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="900" fill="#FFFFFF" text-anchor="middle">UIDAI</text>
      </g>
    </g>

    <!-- Horizontal Divider -->
    <line x1="30" y1="88" x2="770" y2="88" stroke="#E2E8F0" stroke-width="1.5" />

    <!-- Photo Section (Left) -->
    <g transform="translate(45, 110)">
      <rect x="0" y="0" width="150" height="190" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2" />
      ${
        photoUrl
          ? `<image href="${photoUrl}" x="3" y="3" width="144" height="184" preserveAspectRatio="xMidYMid slice" rx="8" />`
          : `<circle cx="75" cy="80" r="35" fill="#CBD5E1" />
             <path d="M 35 160 Q 75 120 115 160 Z" fill="#94A3B8" />`
      }
      <rect x="10" y="160" width="130" height="22" rx="6" fill="#0B1F3A" opacity="0.85"/>
      <text x="75" y="175" font-family="'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" fill="#FFFFFF" text-anchor="middle">PHOTO ID VERIFIED</text>
    </g>

    <!-- Details Section (Middle) -->
    <g transform="translate(225, 115)">
      <text x="0" y="20" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#64748B">नाम / Name</text>
      <text x="0" y="48" font-family="'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" fill="#0B1F3A">${name}</text>

      <text x="0" y="90" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#64748B">जन्म तिथि / DOB</text>
      <text x="130" y="90" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="#1E293B">15/08/1988</text>

      <text x="0" y="125" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#64748B">लिंग / Gender</text>
      <text x="130" y="125" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="#1E293B">FEMALE / महिला</text>

      <text x="0" y="160" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#64748B">Customer ID</text>
      <text x="130" y="160" font-family="'Courier New', monospace" font-size="13" font-weight="800" fill="#1E293B">${escapeXml(applicant.customerId)}</text>
    </g>

    <!-- QR Code Graphic (Right) -->
    <g transform="translate(605, 125)">
      <rect x="0" y="0" width="140" height="140" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" />
      <rect x="12" y="12" width="32" height="32" fill="#0B1F3A" rx="3" />
      <rect x="18" y="18" width="20" height="20" fill="#FFFFFF" rx="2" />
      <rect x="23" y="23" width="10" height="10" fill="#0B1F3A" />

      <rect x="96" y="12" width="32" height="32" fill="#0B1F3A" rx="3" />
      <rect x="102" y="18" width="20" height="20" fill="#FFFFFF" rx="2" />
      <rect x="107" y="23" width="10" height="10" fill="#0B1F3A" />

      <rect x="12" y="96" width="32" height="32" fill="#0B1F3A" rx="3" />
      <rect x="18" y="102" width="20" height="20" fill="#FFFFFF" rx="2" />
      <rect x="23" y="107" width="10" height="10" fill="#0B1F3A" />

      <circle cx="58" cy="30" r="4" fill="#0B1F3A"/>
      <circle cx="75" cy="50" r="5" fill="#ED2A26"/>
      <circle cx="55" cy="70" r="5" fill="#0B1F3A"/>
      <circle cx="85" cy="85" r="4" fill="#0B1F3A"/>
      <circle cx="110" cy="65" r="4" fill="#0B1F3A"/>

      <text x="70" y="162" font-family="'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" fill="#64748B" text-anchor="middle">UIDAI DIGITAL SEAL</text>
    </g>

    <!-- Bottom Aadhaar Red Bar & Number -->
    <g transform="translate(10, 360)">
      <line x1="20" y1="0" x2="760" y2="0" stroke="#ED2A26" stroke-width="3" />
      <rect x="0" y="5" width="780" height="85" fill="#FFFFFF" />
      <text x="390" y="48" font-family="'Courier New', monospace, sans-serif" font-size="30" font-weight="900" fill="#ED2A26" text-anchor="middle" letter-spacing="4">${aadhaarFormatted}</text>
      <text x="390" y="74" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#0B1F3A" text-anchor="middle">मेरा आधार, मेरी पहचान</text>
    </g>

    <!-- Footer Security Notice -->
    <g transform="translate(40, 470)">
      <text x="0" y="10" font-family="'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="600" fill="#94A3B8">Golden Leaf Finance • Digital KYC Document Verification Portal</text>
      <text x="720" y="10" font-family="'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" fill="#138808" text-anchor="end">AUTHENTIC UIDAI RECORD</text>
    </g>
  </svg>`;
}

/**
 * Generates an authentic Income Tax Department PAN Card SVG
 */
export function generatePanCardSvg(applicant: CreditApplicant): string {
  const name = escapeXml(applicant.customerName || 'Customer').toUpperCase();
  const fatherName = escapeXml(applicant.fatherOrSpouseName || 'Parent / Spouse').toUpperCase();
  const pan = escapeXml(applicant.panNumber || 'ABCDE1234F').toUpperCase();
  const photoUrl = applicant.customerPhotoUrl ? escapeXml(applicant.customerPhotoUrl) : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <defs>
      <linearGradient id="panBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#E0F2FE" />
        <stop offset="50%" stop-color="#F0F9FF" />
        <stop offset="100%" stop-color="#BAE6FD" />
      </linearGradient>
      <linearGradient id="goldHolo" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FDE047" />
        <stop offset="50%" stop-color="#CA8A04" />
        <stop offset="100%" stop-color="#FEF08A" />
      </linearGradient>
      <filter id="panShadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.15" />
      </filter>
    </defs>

    <!-- Base Card -->
    <rect x="10" y="10" width="780" height="480" rx="18" fill="url(#panBg)" stroke="#93C5FD" stroke-width="2" filter="url(#panShadow)" />

    <!-- Top Header -->
    <g transform="translate(30, 25)">
      <!-- Left: Income Tax Department -->
      <text x="0" y="20" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="900" fill="#1E3A8A">आयकर विभाग</text>
      <text x="0" y="38" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#1E40AF">INCOME TAX DEPARTMENT</text>

      <!-- Center: Emblem -->
      <g transform="translate(350, 0)">
        <circle cx="20" cy="18" r="18" fill="#FFFFFF" stroke="#93C5FD" />
        <text x="20" y="23" font-family="'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="900" fill="#1E3A8A" text-anchor="middle">GOI</text>
      </g>

      <!-- Right: Govt of India -->
      <text x="740" y="20" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="900" fill="#1E3A8A" text-anchor="end">भारत सरकार</text>
      <text x="740" y="38" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#1E40AF" text-anchor="end">GOVT. OF INDIA</text>
    </g>

    <!-- Sub Header Bar -->
    <rect x="10" y="75" width="780" height="30" fill="#0B1F3A" />
    <text x="400" y="95" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#F8FAFC" text-anchor="middle" letter-spacing="1">
      स्थायी लेखा संख्या कार्ड  /  PERMANENT ACCOUNT NUMBER CARD
    </text>

    <!-- Photo (Left) -->
    <g transform="translate(45, 125)">
      <rect x="0" y="0" width="145" height="175" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.5" />
      ${
        photoUrl
          ? `<image href="${photoUrl}" x="3" y="3" width="139" height="169" preserveAspectRatio="xMidYMid slice" rx="6" />`
          : `<circle cx="72" cy="75" r="32" fill="#CBD5E1" />
             <path d="M 32 150 Q 72 110 112 150 Z" fill="#94A3B8" />`
      }
    </g>

    <!-- Hologram Sticker -->
    <g transform="translate(45, 315)">
      <rect x="0" y="0" width="60" height="60" rx="8" fill="url(#goldHolo)" stroke="#A16207" stroke-width="1.5" />
      <circle cx="30" cy="30" r="18" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="3,2" />
      <text x="30" y="34" font-family="'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="900" fill="#78350F" text-anchor="middle">ITD</text>
    </g>

    <!-- QR Code Graphic (Right) -->
    <g transform="translate(615, 125)">
      <rect x="0" y="0" width="135" height="135" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.5" />
      <rect x="12" y="12" width="30" height="30" fill="#0B1F3A" rx="2" />
      <rect x="17" y="17" width="20" height="20" fill="#FFFFFF" rx="1" />
      <rect x="22" y="22" width="10" height="10" fill="#0B1F3A" />

      <rect x="93" y="12" width="30" height="30" fill="#0B1F3A" rx="2" />
      <rect x="98" y="17" width="20" height="20" fill="#FFFFFF" rx="1" />
      <rect x="103" y="22" width="10" height="10" fill="#0B1F3A" />

      <rect x="12" y="93" width="30" height="30" fill="#0B1F3A" rx="2" />
      <rect x="17" y="98" width="20" height="20" fill="#FFFFFF" rx="1" />
      <rect x="22" y="103" width="10" height="10" fill="#0B1F3A" />

      <circle cx="55" cy="40" r="4" fill="#0B1F3A"/>
      <circle cx="70" cy="70" r="5" fill="#1E40AF"/>
      <circle cx="50" cy="85" r="4" fill="#0B1F3A"/>
      <circle cx="105" cy="75" r="4" fill="#0B1F3A"/>

      <text x="67" y="155" font-family="'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" fill="#64748B" text-anchor="middle">DIGITALLY SIGNED</text>
    </g>

    <!-- Details (Center) -->
    <g transform="translate(215, 125)">
      <!-- PAN Monospace Box -->
      <rect x="0" y="0" width="375" height="52" rx="10" fill="#0B1F3A" stroke="#D4AF37" stroke-width="2" />
      <text x="187" y="36" font-family="'Courier New', monospace, sans-serif" font-size="28" font-weight="900" fill="#F8FAFC" text-anchor="middle" letter-spacing="4">
        ${pan}
      </text>

      <!-- Name -->
      <g transform="translate(0, 75)">
        <text x="0" y="15" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#64748B">नाम / Name</text>
        <text x="0" y="40" font-family="'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="900" fill="#0B1F3A">${name}</text>
      </g>

      <!-- Father's Name -->
      <g transform="translate(0, 135)">
        <text x="0" y="15" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#64748B">पिता का नाम / Father's Name</text>
        <text x="0" y="38" font-family="'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800" fill="#1E293B">${fatherName}</text>
      </g>

      <!-- Date of Birth -->
      <g transform="translate(0, 195)">
        <text x="0" y="15" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#64748B">जन्म की तारीख / Date of Birth</text>
        <text x="0" y="38" font-family="'Courier New', monospace" font-size="16" font-weight="800" fill="#0B1F3A">14/05/1988</text>
      </g>
    </g>

    <!-- Signature Strip -->
    <g transform="translate(480, 320)">
      <rect x="0" y="0" width="270" height="60" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.5" />
      <text x="15" y="15" font-family="'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" fill="#94A3B8">हस्ताक्षर / Signature</text>
      <!-- Simulated Cursive Signature -->
      <text x="135" y="44" font-family="'Brush Script MT', 'Segoe Script', cursive, sans-serif" font-size="24" font-weight="bold" fill="#0B1F3A" text-anchor="middle" font-style="italic">
        ${name.split(' ')[0] || 'Meera'}
      </text>
    </g>

    <!-- Footer Security Notice -->
    <g transform="translate(40, 465)">
      <line x1="0" y1="0" x2="720" y2="0" stroke="#CBD5E1" stroke-width="1" />
      <text x="0" y="18" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#64748B">Golden Leaf Finance • Manual Document Verification Interface</text>
      <text x="720" y="18" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#15803D" text-anchor="end">✓ VERIFIED PAN RECORD</text>
    </g>
  </svg>`;
}

/**
 * Generates an authentic Election Commission of India Voter ID (EPIC) SVG
 */
export function generateVoterCardSvg(applicant: CreditApplicant): string {
  const name = escapeXml(applicant.customerName || 'Customer');
  const relationName = escapeXml(applicant.fatherOrSpouseName || 'Parent / Spouse');
  const voterId = escapeXml(applicant.voterId || 'TN/01/012/123456').toUpperCase();
  const centerName = escapeXml(applicant.centerName || 'Center 01 - Anna Nagar');
  const photoUrl = applicant.customerPhotoUrl ? escapeXml(applicant.customerPhotoUrl) : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <defs>
      <linearGradient id="voterTricolor" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#FF9933" />
        <stop offset="50%" stop-color="#FFFFFF" />
        <stop offset="100%" stop-color="#138808" />
      </linearGradient>
      <filter id="voterShadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.15" />
      </filter>
    </defs>

    <!-- Base Card -->
    <rect x="10" y="10" width="780" height="480" rx="18" fill="#FAFAFA" stroke="#CBD5E1" stroke-width="2" filter="url(#voterShadow)" />

    <!-- Top Tricolor Band -->
    <path d="M 10 24 Q 10 10 24 10 L 776 10 Q 790 10 790 24 L 790 22 L 10 22 Z" fill="url(#voterTricolor)"/>

    <!-- Header -->
    <g transform="translate(30, 32)">
      <circle cx="25" cy="22" r="20" fill="#F1F5F9" stroke="#CBD5E1" />
      <text x="25" y="27" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="900" fill="#0B1F3A" text-anchor="middle">ECI</text>

      <g transform="translate(60, 5)">
        <text x="0" y="16" font-family="'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="900" fill="#0B1F3A">भारत निर्वाचन आयोग</text>
        <text x="0" y="34" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#1E293B">ELECTION COMMISSION OF INDIA</text>
      </g>

      <g transform="translate(730, 10)">
        <text x="0" y="16" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#64748B" text-anchor="end">मतदाता फोटो पहचान पत्र</text>
        <text x="0" y="32" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#94A3B8" text-anchor="end">ELECTOR PHOTO IDENTITY CARD</text>
      </g>
    </g>

    <!-- Divider -->
    <line x1="30" y1="85" x2="770" y2="85" stroke="#CBD5E1" stroke-width="1.5" />

    <!-- EPIC Number Bar -->
    <g transform="translate(30, 98)">
      <rect x="0" y="0" width="740" height="40" rx="8" fill="#F1F5F9" stroke="#E2E8F0" />
      <text x="20" y="25" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#64748B">EPIC No. :</text>
      <text x="110" y="26" font-family="'Courier New', monospace" font-size="20" font-weight="900" fill="#B91C1C" letter-spacing="2">${voterId}</text>
    </g>

    <!-- Photo (Left) -->
    <g transform="translate(45, 155)">
      <rect x="0" y="0" width="150" height="185" rx="10" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2" />
      ${
        photoUrl
          ? `<image href="${photoUrl}" x="3" y="3" width="144" height="179" preserveAspectRatio="xMidYMid slice" rx="8" />`
          : `<circle cx="75" cy="80" r="35" fill="#CBD5E1" />
             <path d="M 35 155 Q 75 115 115 155 Z" fill="#94A3B8" />`
      }
      <rect x="10" y="155" width="130" height="20" rx="5" fill="#138808" />
      <text x="75" y="169" font-family="'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" fill="#FFFFFF" text-anchor="middle">OFFICIAL VOTER ID</text>
    </g>

    <!-- Holographic Strip Representation -->
    <g transform="translate(210, 155)">
      <rect x="0" y="0" width="16" height="185" rx="4" fill="#E2E8F0" stroke="#CBD5E1" />
      <text x="8" y="95" font-family="'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="900" fill="#64748B" text-anchor="middle" transform="rotate(-90 8 95)">ECI HOLOGRAM</text>
    </g>

    <!-- Details (Center) -->
    <g transform="translate(245, 155)">
      <g transform="translate(0, 10)">
        <text x="0" y="15" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#64748B">निर्वाचक का नाम / Elector's Name</text>
        <text x="0" y="42" font-family="'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="900" fill="#0B1F3A">${name}</text>
      </g>

      <g transform="translate(0, 75)">
        <text x="0" y="15" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#64748B">पिता / पति का नाम / Father's / Husband's Name</text>
        <text x="0" y="38" font-family="'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800" fill="#1E293B">${relationName}</text>
      </g>

      <g transform="translate(0, 135)">
        <text x="0" y="15" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#64748B">लिंग / Gender</text>
        <text x="130" y="15" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#0B1F3A">Female / महिला</text>

        <text x="0" y="40" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#64748B">विधान सभा निर्वाचन क्षेत्र / Constituency</text>
        <text x="0" y="62" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="#1E293B">${centerName}</text>
      </g>
    </g>

    <!-- Signature & Seal (Bottom Right) -->
    <g transform="translate(560, 310)">
      <line x1="20" y1="40" x2="190" y2="40" stroke="#94A3B8" stroke-dasharray="3,2" />
      <text x="105" y="32" font-family="'Brush Script MT', cursive, sans-serif" font-size="20" fill="#0B1F3A" text-anchor="middle">S. K. Raman</text>
      <text x="105" y="55" font-family="'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#64748B" text-anchor="middle">Electoral Registration Officer</text>
    </g>

    <!-- Footer -->
    <g transform="translate(40, 465)">
      <line x1="0" y1="0" x2="720" y2="0" stroke="#CBD5E1" stroke-width="1" />
      <text x="0" y="18" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#64748B">Golden Leaf Finance • Manual Document Verification Interface</text>
      <text x="720" y="18" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#15803D" text-anchor="end">✓ VERIFIED ELECTOR RECORD</text>
    </g>
  </svg>`;
}

/**
 * Returns document URL (prioritizing uploaded image, otherwise high-fidelity vector representation)
 */
export function getAadhaarDocUrl(
  applicant: CreditApplicant,
  side: 'front' | 'back' = 'front'
): string {
  // If customer has a real uploaded document (not placeholder unsplash)
  if (side === 'front' && applicant.aadhaarFrontUrl && !applicant.aadhaarFrontUrl.includes('unsplash')) {
    return applicant.aadhaarFrontUrl;
  }
  if (side === 'back' && applicant.aadhaarBackUrl && !applicant.aadhaarBackUrl.includes('unsplash')) {
    return applicant.aadhaarBackUrl;
  }

  // Return crisp authentic vector SVG data URI
  const svg = generateAadhaarCardSvg(applicant, side);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function getPanDocUrl(applicant: CreditApplicant): string {
  if (applicant.panCardUrl && !applicant.panCardUrl.includes('unsplash')) {
    return applicant.panCardUrl;
  }
  const svg = generatePanCardSvg(applicant);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function getVoterDocUrl(applicant: CreditApplicant): string {
  if (applicant.voterIdUrl && !applicant.voterIdUrl.includes('unsplash')) {
    return applicant.voterIdUrl;
  }
  const svg = generateVoterCardSvg(applicant);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
