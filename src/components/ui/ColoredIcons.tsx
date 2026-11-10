import React from 'react';

export const ColoredCalendarIcon = ({ size = 28 }: { size?: number }) => {
  const todayDate = new Date().getDate().toString();
  
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="14" width="76" height="74" rx="16" fill="#0B1F3A" stroke="#D4AF37" strokeWidth="2.5" />
      {/* Header bar */}
      <path d="M12 28C12 20.268 18.268 14 26 14H74C81.732 14 88 20.268 88 28V36H12V28Z" fill="#D4AF37" />
      {/* Binder rings */}
      <rect x="28" y="8" width="6" height="14" rx="3" fill="#FFFFFF" />
      <rect x="66" y="8" width="6" height="14" rx="3" fill="#FFFFFF" />
      {/* Body Area */}
      <rect x="18" y="42" width="64" height="40" rx="8" fill="#FFFFFF" fillOpacity="0.08" />
      {/* Dynamic Date Number */}
      <text
        x="50"
        y="72"
        fontFamily="'Inter', -apple-system, sans-serif"
        fontSize={todayDate.length > 1 ? "32" : "38"}
        fontWeight="900"
        fill="#FFFFFF"
        textAnchor="middle"
      >
        {todayDate}
      </text>
    </svg>
  );
};

export const ColoredCalculatorIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="12" width="72" height="76" rx="16" fill="#0B1F3A" stroke="#D4AF37" strokeWidth="2.5" />
    {/* Display Screen */}
    <rect x="22" y="22" width="56" height="18" rx="6" fill="#162D4A" stroke="#D4AF37" strokeOpacity="0.4" strokeWidth="1.5" />
    <rect x="58" y="27" width="14" height="8" rx="2" fill="#D4AF37" fillOpacity="0.8" />
    {/* Buttons */}
    {/* Row 1 */}
    <rect x="23" y="47" width="14" height="10" rx="3" fill="#FFFFFF" fillOpacity="0.15" />
    <rect x="43" y="47" width="14" height="10" rx="3" fill="#FFFFFF" fillOpacity="0.15" />
    <rect x="63" y="47" width="14" height="10" rx="3" fill="#D4AF37" />
    {/* Row 2 */}
    <rect x="23" y="61" width="14" height="10" rx="3" fill="#FFFFFF" fillOpacity="0.15" />
    <rect x="43" y="61" width="14" height="10" rx="3" fill="#FFFFFF" fillOpacity="0.15" />
    <rect x="63" y="61" width="14" height="10" rx="3" fill="#D4AF37" />
    {/* Row 3 */}
    <rect x="23" y="75" width="34" height="8" rx="3" fill="#FFFFFF" fillOpacity="0.15" />
    <rect x="63" y="75" width="14" height="8" rx="3" fill="#059669" />
  </svg>
);

export const MaleAvatarIcon = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="50" fill="#E2E8F0" />
    <circle cx="50" cy="35" r="18" fill="#FCD34D" />
    <path d="M20 90C20 73.4315 33.4315 60 50 60C66.5685 60 80 73.4315 80 90" fill="#3B82F6" />
    <path d="M50 35C45 35 42 30 42 25C42 20 46 15 50 15C54 15 58 20 58 25C58 30 55 35 50 35Z" fill="#1F2937" />
  </svg>
);

export const FemaleAvatarIcon = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="50" fill="#FDE68A" />
    <path d="M20 90C20 73.4315 33.4315 60 50 60C66.5685 60 80 73.4315 80 90" fill="#EC4899" />
    <circle cx="50" cy="35" r="16" fill="#FCA5A5" />
    <path d="M34 40C34 25 40 18 50 18C60 18 66 25 66 40C66 50 63 55 63 55L50 65L37 55C37 55 34 50 34 40Z" fill="#1F2937" />
  </svg>
);
