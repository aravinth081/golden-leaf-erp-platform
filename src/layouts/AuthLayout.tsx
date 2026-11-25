// ──────────────────────────────────────────────────
// Golden Leaf Finance — Auth Layout
// Strictly Ratio-Locked Luxury Card Layout across All Laptop/Computer Devices
// ──────────────────────────────────────────────────

import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GOLDEN_LEAF_LOGO_DATA_URL } from '../utils/logoDataUrl';

const AuthBrandLogo: React.FC<{ sizeClass: string; isMobile?: boolean }> = ({ sizeClass, isMobile }) => {
  const [imgSrc, setImgSrc] = React.useState<string>(GOLDEN_LEAF_LOGO_DATA_URL || '/logo-icon.png');
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return (
      <svg viewBox="0 0 100 100" className={`${sizeClass} object-contain p-1`} fill="none" aria-label="Golden Leaf Logo">
        <circle cx="50" cy="50" r="46" fill="url(#glf-gold-bg)" stroke="#8C6808" strokeWidth="2.5" />
        <path d="M50 14 C28 35 24 68 50 84 C76 68 72 35 50 14 Z" fill="url(#glf-leaf-grad)" />
        <path d="M50 20 L50 80 M50 36 L36 28 M50 48 L64 38 M50 60 L36 50 M50 72 L62 62" stroke="#684A04" strokeWidth="2.5" strokeLinecap="round" />
        <defs>
          <linearGradient id="glf-gold-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF9E6" />
            <stop offset="100%" stopColor="#F5E4B3" />
          </linearGradient>
          <linearGradient id="glf-leaf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2A3" />
            <stop offset="40%" stopColor="#E5C158" />
            <stop offset="80%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8C6207" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <img
      src={imgSrc}
      alt="Golden Leaf Logo"
      width={isMobile ? 88 : 160}
      height={isMobile ? 88 : 160}
      fetchPriority="high"
      className={`${sizeClass} object-contain rounded-[20px] transform group-hover:scale-105 transition-transform duration-400`}
      onError={() => {
        if (imgSrc !== '/logo-icon.png') {
          setImgSrc('/logo-icon.png');
        } else {
          setFailed(true);
        }
      }}
    />
  );
};

export const AuthLayout: React.FC = () => {
  return (
    <main
      id="main-content"
      role="main"
      className="fixed inset-0 sm:relative sm:inset-auto w-full h-[100dvh] max-h-[100dvh] sm:min-h-[100dvh] flex items-center justify-center bg-white sm:bg-gradient-to-br sm:from-[#ECE6DC] sm:via-[#F3EDE3] sm:to-[#E7E0D4] font-body selection:bg-[#D4A017]/20 selection:text-[#0A1628] p-0 sm:p-4 md:p-6 overflow-hidden sm:overflow-y-auto overscroll-none select-none sm:select-auto"
    >
      {/* Card Container — Locked to 16:9 on laptops/desktops, clean responsive layout on mobile */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="login-card-ratio w-full h-full sm:h-auto sm:min-h-0 sm:w-[min(94vw,1160px,calc((100dvh-36px)*1.778))] sm:aspect-[16/9] sm:max-h-[calc(100dvh-24px)] bg-white sm:rounded-[32px] lg:rounded-[36px] sm:shadow-[0_25px_65px_-15px_rgba(15,23,42,0.14),0_0_0_1px_rgba(232,223,200,0.85)] sm:border sm:border-[#E8DFC8] flex flex-col sm:flex-row relative sm:my-auto max-sm:rounded-none max-sm:border-none max-sm:shadow-none max-sm:m-0 overflow-hidden"
      >
        {/* Left Panel (Strictly 50% width on laptops/computers) */}
        <div className="hidden sm:flex sm:w-1/2 h-full bg-[#FAF8F5] relative overflow-hidden flex-col items-center justify-center p-6 lg:p-8 text-[#0B1F3A] border-r border-[#E8DFC8] z-10 select-none">

          {/* Sweeping Concentric Gold Ribbons — Top Left Corner */}
          <div className="absolute top-0 left-0 w-[45%] aspect-square pointer-events-none z-0">
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id="gold-wedge-tl" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF0B3" />
                  <stop offset="40%" stopColor="#E5C158" />
                  <stop offset="80%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#A67B13" />
                </linearGradient>
                <linearGradient id="gold-ribbon-tl" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF5C2" />
                  <stop offset="35%" stopColor="#F5D061" />
                  <stop offset="70%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#996D0E" />
                </linearGradient>
              </defs>
              {/* Solid Corner Wedge */}
              <circle cx="0" cy="0" r="68" fill="url(#gold-wedge-tl)" />
              {/* Ribbon Band */}
              <circle cx="0" cy="0" r="102" stroke="url(#gold-ribbon-tl)" strokeWidth="18" fill="none" />
              {/* Accent Ring 1 */}
              <circle cx="0" cy="0" r="130" stroke="url(#gold-ribbon-tl)" strokeWidth="5.5" fill="none" />
              {/* Accent Ring 2 */}
              <circle cx="0" cy="0" r="150" stroke="url(#gold-ribbon-tl)" strokeWidth="2.5" fill="none" />
            </svg>
          </div>

          {/* Sweeping Concentric Gold Ribbons — Bottom Left Corner */}
          <div className="absolute bottom-0 left-0 w-[45%] aspect-square pointer-events-none z-0">
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id="gold-wedge-bl" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFF0B3" />
                  <stop offset="40%" stopColor="#E5C158" />
                  <stop offset="80%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#A67B13" />
                </linearGradient>
                <linearGradient id="gold-ribbon-bl" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFF5C2" />
                  <stop offset="35%" stopColor="#F5D061" />
                  <stop offset="70%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#996D0E" />
                </linearGradient>
              </defs>
              {/* Solid Corner Wedge */}
              <circle cx="0" cy="200" r="68" fill="url(#gold-wedge-bl)" />
              {/* Ribbon Band */}
              <circle cx="0" cy="200" r="102" stroke="url(#gold-ribbon-bl)" strokeWidth="18" fill="none" />
              {/* Accent Ring 1 */}
              <circle cx="0" cy="200" r="130" stroke="url(#gold-ribbon-bl)" strokeWidth="5.5" fill="none" />
              {/* Accent Ring 2 */}
              <circle cx="0" cy="200" r="150" stroke="url(#gold-ribbon-bl)" strokeWidth="2.5" fill="none" />
            </svg>
          </div>

          {/* Center Brand Identity (Medallion + Typography) */}
          <div className="relative z-10 flex flex-col items-center text-center my-auto">
            {/* Medallion Tile with 3D Bevel Frame */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative w-[clamp(120px,13vw,165px)] h-[clamp(120px,13vw,165px)] mb-3 group"
            >
              {/* Ambient Gold Glow */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-[#D4AF37]/35 via-[#F5D061]/40 to-[#8C6207]/25 rounded-[32px] blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-400" />

              {/* 3D Metallic Beveled Gold Frame */}
              <div className="relative w-full h-full p-[2.5px] rounded-[28px] bg-gradient-to-b from-[#F7E7A9] via-[#D4AF37] to-[#8C6207] shadow-[0_16px_36px_-6px_rgba(180,140,40,0.35)] flex items-center justify-center">
                {/* Clean Inner Base matching White Carrara Marble */}
                <div className="w-full h-full rounded-[25px] overflow-hidden bg-white shadow-inner flex items-center justify-center p-1">
                  <AuthBrandLogo sizeClass="w-full h-full" />
                </div>
              </div>
            </motion.div>

            {/* Typography */}
            <h2 className="font-serif text-[clamp(22px,2.2vw,32px)] font-black tracking-[0.07em] uppercase leading-tight text-[#0F1F38] drop-shadow-xs">
              GOLDEN LEAF
            </h2>

            <p className="font-body text-[clamp(9.5px,0.78vw,11.5px)] font-extrabold tracking-[0.26em] text-[#8C6207] uppercase mt-1 drop-shadow-xs">
              FINANCE & LOAN MANAGEMENT
            </p>

            {/* Classical Gold Diamond Divider */}
            <div className="flex items-center justify-center gap-2.5 my-2.5 sm:my-3 w-full max-w-[240px]">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-[#C59B27]" />
              <div className="flex items-center gap-1.5 text-[#C59B27]">
                <span className="w-1 h-1 rounded-full bg-[#D4AF37]" />
                <span className="w-2 h-2 rotate-45 bg-[#D4AF37]" />
                <span className="w-1 h-1 rounded-full bg-[#D4AF37]" />
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#D4AF37] to-[#C59B27]" />
            </div>

            <p className="text-[#475569] text-[clamp(11px,0.85vw,13px)] font-body text-center max-w-[340px] leading-relaxed font-semibold px-4">
              Empowering your financial future with smart, secure, and seamless loan management solutions.
            </p>
          </div>
        </div>

        {/* Right Panel - Form Area (Strictly 50% width on laptops/computers, clean universally responsive layout on all mobiles) */}
        <div className="w-full sm:w-1/2 h-full max-sm:h-[100dvh] flex flex-col justify-center items-center bg-white px-3 sm:px-8 lg:px-12 py-2 sm:py-6 relative z-10 overflow-hidden sm:overflow-y-auto custom-scrollbar">
          {/* Sweeping Concentric Gold Ribbons — Top Left Corner (Mobile View) */}
          <div className="sm:hidden max-sm:fixed max-sm:top-0 max-sm:left-0 w-[clamp(90px,28vw,150px)] aspect-square pointer-events-none z-0 opacity-90">
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
              <defs>
                <linearGradient id="gold-wedge-tl-mob" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF0B3" />
                  <stop offset="40%" stopColor="#E5C158" />
                  <stop offset="80%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#A67B13" />
                </linearGradient>
                <linearGradient id="gold-ribbon-tl-mob" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF5C2" />
                  <stop offset="35%" stopColor="#F5D061" />
                  <stop offset="70%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#996D0E" />
                </linearGradient>
              </defs>
              {/* Solid Corner Wedge */}
              <circle cx="0" cy="0" r="68" fill="url(#gold-wedge-tl-mob)" />
              {/* Ribbon Band */}
              <circle cx="0" cy="0" r="102" stroke="url(#gold-ribbon-tl-mob)" strokeWidth="18" fill="none" />
              {/* Accent Ring 1 */}
              <circle cx="0" cy="0" r="130" stroke="url(#gold-ribbon-tl-mob)" strokeWidth="5.5" fill="none" />
              {/* Accent Ring 2 */}
              <circle cx="0" cy="0" r="150" stroke="url(#gold-ribbon-tl-mob)" strokeWidth="2.5" fill="none" />
            </svg>
          </div>

          {/* Sweeping Concentric Gold Ribbons — Bottom Left Corner (Mobile View) */}
          <div className="sm:hidden max-sm:fixed max-sm:bottom-0 max-sm:left-0 w-[clamp(90px,28vw,150px)] aspect-square pointer-events-none z-0 opacity-90">
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id="gold-wedge-bl-mob" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFF0B3" />
                  <stop offset="40%" stopColor="#E5C158" />
                  <stop offset="80%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#A67B13" />
                </linearGradient>
                <linearGradient id="gold-ribbon-bl-mob" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFF5C2" />
                  <stop offset="35%" stopColor="#F5D061" />
                  <stop offset="70%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#996D0E" />
                </linearGradient>
              </defs>
              {/* Solid Corner Wedge */}
              <circle cx="0" cy="200" r="68" fill="url(#gold-wedge-bl-mob)" />
              {/* Ribbon Band */}
              <circle cx="0" cy="200" r="102" stroke="url(#gold-ribbon-bl-mob)" strokeWidth="18" fill="none" />
              {/* Accent Ring 1 */}
              <circle cx="0" cy="200" r="130" stroke="url(#gold-ribbon-bl-mob)" strokeWidth="5.5" fill="none" />
              {/* Accent Ring 2 */}
              <circle cx="0" cy="200" r="150" stroke="url(#gold-ribbon-bl-mob)" strokeWidth="2.5" fill="none" />
            </svg>
          </div>

          {/* Sweeping Concentric Gold Ribbons — Top Right Corner */}
          <div className="max-sm:fixed max-sm:top-0 max-sm:right-0 sm:absolute sm:top-0 sm:right-0 w-[clamp(90px,28vw,150px)] sm:w-[45%] aspect-square pointer-events-none z-0 opacity-90 sm:opacity-100">
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id="gold-wedge-tr" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFF0B3" />
                  <stop offset="40%" stopColor="#E5C158" />
                  <stop offset="80%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#A67B13" />
                </linearGradient>
                <linearGradient id="gold-ribbon-tr" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFF5C2" />
                  <stop offset="35%" stopColor="#F5D061" />
                  <stop offset="70%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#996D0E" />
                </linearGradient>
              </defs>
              {/* Solid Corner Wedge */}
              <circle cx="200" cy="0" r="68" fill="url(#gold-wedge-tr)" />
              {/* Ribbon Band */}
              <circle cx="200" cy="0" r="102" stroke="url(#gold-ribbon-tr)" strokeWidth="18" fill="none" />
              {/* Accent Ring 1 */}
              <circle cx="200" cy="0" r="130" stroke="url(#gold-ribbon-tr)" strokeWidth="5.5" fill="none" />
              {/* Accent Ring 2 */}
              <circle cx="200" cy="0" r="150" stroke="url(#gold-ribbon-tr)" strokeWidth="2.5" fill="none" />
            </svg>
          </div>

          {/* Sweeping Concentric Gold Ribbons — Bottom Right Corner */}
          <div className="max-sm:fixed max-sm:bottom-0 max-sm:right-0 sm:absolute sm:bottom-0 sm:right-0 w-[clamp(90px,28vw,150px)] sm:w-[45%] aspect-square pointer-events-none z-0 opacity-90 sm:opacity-100">
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id="gold-wedge-br" x1="100%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#FFF0B3" />
                  <stop offset="40%" stopColor="#E5C158" />
                  <stop offset="80%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#A67B13" />
                </linearGradient>
                <linearGradient id="gold-ribbon-br" x1="100%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#FFF5C2" />
                  <stop offset="35%" stopColor="#F5D061" />
                  <stop offset="70%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#996D0E" />
                </linearGradient>
              </defs>
              {/* Solid Corner Wedge */}
              <circle cx="200" cy="200" r="68" fill="url(#gold-wedge-br)" />
              {/* Ribbon Band */}
              <circle cx="200" cy="200" r="102" stroke="url(#gold-ribbon-br)" strokeWidth="18" fill="none" />
              {/* Accent Ring 1 */}
              <circle cx="200" cy="200" r="130" stroke="url(#gold-ribbon-br)" strokeWidth="5.5" fill="none" />
              {/* Accent Ring 2 */}
              <circle cx="200" cy="200" r="150" stroke="url(#gold-ribbon-br)" strokeWidth="2.5" fill="none" />
            </svg>
          </div>

          {/* Centralized Brand & Form Container — Universally Centered on All Mobile Devices */}
          <div className="w-full max-w-[410px] sm:max-w-[440px] mx-auto relative z-10 my-auto flex flex-col items-center justify-center shrink-0 px-3 sm:px-0">
            {/* Mobile-only single brand header */}
            <div className="sm:hidden flex flex-col items-center pt-0 pb-1 mb-2 text-center relative z-10 w-full shrink-0">
              <div className="relative w-[90px] h-[90px] mb-2 flex items-center justify-center">
                {/* Soft ambient golden glow behind the emblem */}
                <div className="absolute inset-0 bg-[#D4AF37]/35 rounded-[24px] blur-md -z-10" />
                <AuthBrandLogo sizeClass="w-full h-full drop-shadow-[0_10px_25px_rgba(212,175,55,0.4)]" isMobile />
              </div>
              <h1 className="font-serif font-black text-[26px] text-[#0B1F3A] uppercase tracking-[0.08em] leading-tight drop-shadow-xs">
                GOLDEN LEAF
              </h1>
              <p className="text-[11.5px] font-extrabold text-[#B8860B] uppercase tracking-[0.24em] mt-1">
                FINANCE & LOAN MANAGEMENT
              </p>
            </div>

            <div className="w-full">
              <Outlet />
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
};


