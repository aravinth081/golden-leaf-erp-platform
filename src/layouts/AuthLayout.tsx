// ──────────────────────────────────────────────────
// Golden Leaf Finance — Auth Layout
// Strictly Ratio-Locked Luxury Card Layout across All Laptop/Computer Devices
// ──────────────────────────────────────────────────

import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
const goldenLeafLogo = '/logo-icon.png';

export const AuthLayout: React.FC = () => {
  // Completely lock mobile screen so window cannot be scrolled down to reveal empty space
  React.useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverscroll = document.body.style.overscrollBehavior;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    const lockMobileViewport = () => {
      if (window.innerWidth < 640) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none';
        document.documentElement.style.overscrollBehavior = 'none';
        window.scrollTo(0, 0);
      } else {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overscrollBehavior = prevBodyOverscroll;
        document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
      }
    };

    lockMobileViewport();
    window.addEventListener('resize', lockMobileViewport);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overscrollBehavior = prevBodyOverscroll;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
      window.removeEventListener('resize', lockMobileViewport);
    };
  }, []);

  return (
    <div className="max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:overflow-hidden max-sm:overscroll-none h-[100dvh] sm:min-h-[100dvh] w-full flex items-center justify-center max-sm:bg-white bg-gradient-to-br from-[#ECE6DC] via-[#F3EDE3] to-[#E7E0D4] font-body selection:bg-[#D4A017]/20 selection:text-[#0A1628] max-sm:p-0 p-2 sm:p-4 md:p-6 sm:overflow-y-auto overflow-x-hidden">

      {/* Card Container — Locked to 16:9 on laptops/desktops, full edge-to-edge native layout on mobile */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="login-card-ratio w-full max-sm:h-full max-sm:max-h-full max-sm:overflow-hidden max-sm:rounded-none max-sm:border-none max-sm:shadow-none max-sm:m-0 sm:w-[min(94vw,1160px,calc((100dvh-36px)*1.778))] sm:aspect-[16/9] sm:max-h-[calc(100dvh-24px)] bg-white sm:rounded-[32px] lg:rounded-[36px] sm:shadow-[0_25px_65px_-15px_rgba(15,23,42,0.14),0_0_0_1px_rgba(232,223,200,0.85)] sm:border sm:border-[#E8DFC8] flex flex-col sm:flex-row overflow-hidden relative sm:my-auto"
      >
        {/* Left Panel (Strictly 50% width on laptops/computers) */}
        <div className="hidden sm:flex sm:w-1/2 h-full bg-[#FAF8F5] relative overflow-hidden flex-col items-center justify-center p-6 lg:p-8 text-[#0B1F3A] border-r border-[#E8DFC8] z-10 select-none">

          {/* Sweeping Concentric Gold Ribbons — Top Left Corner */}
          <div className="absolute top-0 left-0 w-[45%] aspect-square pointer-events-none z-0">
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
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
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
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
                  <img
                    src={goldenLeafLogo}
                    alt="Golden Leaf Emblem"
                    className="w-full h-full object-contain rounded-[22px] transform group-hover:scale-105 transition-transform duration-400"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('pwa-512x512.png')) {
                        target.src = '/pwa-512x512.png';
                      } else if (!target.src.includes('favicon.png')) {
                        target.src = '/favicon.png';
                      }
                    }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Typography */}
            <motion.h2
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-serif text-[clamp(22px,2.2vw,32px)] font-black tracking-[0.07em] uppercase leading-tight text-[#0F1F38] drop-shadow-xs"
            >
              GOLDEN LEAF
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="font-body text-[clamp(9.5px,0.78vw,11.5px)] font-extrabold tracking-[0.26em] text-[#C59B27] uppercase mt-1 drop-shadow-xs"
            >
              FINANCE & LOAN MANAGEMENT
            </motion.p>

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

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[#475569] text-[clamp(11px,0.85vw,13px)] font-body text-center max-w-[340px] leading-relaxed font-semibold px-4"
            >
              Empowering your financial future with smart, secure, and seamless loan management solutions.
            </motion.p>
          </div>
        </div>

        {/* Right Panel - Form Area (Strictly 50% width on laptops/computers, full-height edge-to-edge on mobile) */}
        <div className="w-full sm:w-1/2 h-full max-sm:h-full max-sm:overflow-hidden flex flex-col justify-center items-center bg-white px-4 sm:px-8 lg:px-12 py-3 sm:py-6 relative z-10 sm:overflow-y-auto">
          {/* Sweeping Concentric Gold Ribbons — Top Left Corner (Mobile View) */}
          <div className="sm:hidden absolute top-0 left-0 w-[36%] aspect-square pointer-events-none z-0 opacity-35">
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
          <div className="sm:hidden absolute bottom-0 left-0 w-[36%] aspect-square pointer-events-none z-0 opacity-35">
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
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
          <div className="absolute top-0 right-0 w-[36%] sm:w-[45%] aspect-square pointer-events-none z-0 opacity-35 sm:opacity-100">
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
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
          <div className="absolute bottom-0 right-0 w-[36%] sm:w-[45%] aspect-square pointer-events-none z-0 opacity-35 sm:opacity-100">
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
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

          {/* Mobile-only single brand header */}
          <div className="sm:hidden flex flex-col items-center pt-1 mb-2 text-center relative z-10 w-full shrink-0">
            <div className="relative w-[76px] h-[76px] mb-2 flex items-center justify-center">
              {/* Soft ambient golden glow behind the emblem */}
              <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-[22px] blur-md -z-10" />
              <img
                src={goldenLeafLogo}
                alt="Golden Leaf Finance"
                className="w-full h-full object-contain rounded-[20px] drop-shadow-[0_8px_18px_rgba(212,175,55,0.3)]"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('pwa-512x512.png')) {
                    target.src = '/pwa-512x512.png';
                  }
                }}
              />
            </div>
            <h1 className="font-serif font-black text-[19px] text-[#0F1F38] uppercase tracking-[0.09em] leading-tight">
              Golden Leaf
            </h1>
            <p className="text-[10px] font-extrabold text-[#A88219] uppercase tracking-[0.24em] mt-0.5">
              Finance & Loan Management
            </p>
          </div>

          <div className="w-full max-w-[380px] sm:max-w-[440px] mx-auto relative z-10 my-0 sm:my-auto shrink-0">
            <Outlet />
          </div>
        </div>
      </motion.div>
    </div>
  );
};


