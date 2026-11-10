// ──────────────────────────────────────────────────
// Golden Leaf Finance — Main Responsive App Layout
// Seamless support across Mobile (320-768px), Laptop (769-1440px) & Large Monitor (1441px+)
// ──────────────────────────────────────────────────

import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { Sidebar } from '../components/layout/Sidebar';
import { TopBar } from '../components/layout/TopBar';
import { useUIStore } from '../store';
import { usePlatformSmoothScroll } from '../hooks/usePlatformSmoothScroll';

export const AppLayout: React.FC = () => {
  const { isSidebarCollapsed, isMobile, setIsMobile, setSidebarOpen } = useUIStore();
  const location = useLocation();

  // Mount platform-wide natural mouse scroll and 4-way keyboard arrow navigation
  usePlatformSmoothScroll();

  // Reset scroll position on route change
  useEffect(() => {
    const mainEl = document.getElementById('main-content-scroll');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  // Responsive viewport detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobile, setSidebarOpen]);

  const sidebarWidth = isMobile ? 0 : isSidebarCollapsed ? 0 : 260;

  return (
    <div className="h-[100dvh] w-full bg-[#F8FAFC] overflow-hidden flex relative">
      {/* Accessible skip link for keyboard users */}
      <a
        href="#main-content-scroll"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#D4AF37] focus:text-[#0B1F3A] focus:font-bold focus:rounded-xl focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
      >
        Skip to main content
      </a>

      {/* Sidebar (handles desktop fixed and mobile/tablet slide-in drawer) */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={clsx(
          "transition-all duration-300 flex-1 h-[100dvh] flex flex-col min-w-0 overflow-hidden",
          isMobile || isSidebarCollapsed ? "ml-0" : "ml-0 lg:ml-[260px]"
        )}
        style={{ marginLeft: isMobile ? 0 : sidebarWidth }}
      >
        <TopBar />
        <main
          id="main-content-scroll"
          tabIndex={-1}
          role="main"
          className="px-2.5 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-6 w-full flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar min-h-0 min-w-0 outline-none overscroll-y-contain"
        >
          <div className="w-full max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
