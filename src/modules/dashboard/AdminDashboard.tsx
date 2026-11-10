// ──────────────────────────────────────────────────
// Golden Leaf Finance — Executive Admin Dashboard
// Enterprise SaaS-Grade Financial Operations Hub
// Features: Total Customers · Total Loans · Collection Today ·
//           Pending Collection · Branch Performance ·
//           Total Outstanding · Employee Status · Quick Access
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Building2, GitBranch, Activity,
  TrendingUp, Wallet, CreditCard, Clock,
  ChevronRight, RefreshCw, MapPin, ArrowRight,
  PieChart as PieIcon, BarChart3, X, ArrowUp,
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

import {
  getInitialDashboardStats,
  getInitialTodayCollectionStats,
  getInitialCollectionTrend,
  getInitialLoanPortfolio,
  getBranchPerformanceData,
  getInitialEmployeeAttendance,
  getDashboardStats,
  getTodayCollectionStats,
  getCollectionTrend,
  getLoanPortfolioBreakdown,
  getEmployeeAttendanceToday,
  listenToTodayCollections,
  formatINR,
  formatINRFull,
  formatIndianNumber,
  type DashboardStats,
  type TodayCollectionStats,
  type CollectionMetricType,
  type CollectionTrendPoint,
  type LoanPortfolioItem,
  type BranchPerformanceRow,
  type EmployeeAttendanceRow,
  type EmployeeStatusCounts,
} from '../../services/dashboardService';

const RADIAN = Math.PI / 180;

// ─── Stable Counter Hook (Steady, Standard Numbers Without Blinking/Flickering) ───
function useAnimatedCounter(target: number): number {
  return target;
}

// ─── Live Dynamic Date & Time Component (Isolated 1s ticker prevents dashboard re-renders) ───
const LiveHeaderDateTime: React.FC = () => {
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = currentDateTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-md border border-white/15 text-xs text-white shadow-sm transition-colors">
      <Clock size={14} className="text-[#F5D061]" />
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-200">{formattedDate}</span>
        <span className="text-[#D4AF37]/60 font-bold">•</span>
        <span className="font-number text-[#F5D061] font-bold tracking-wide tabular-nums">{formattedTime}</span>
      </div>
    </div>
  );
};

// ─── Table Scroll Chaining Hook ───
// Guarantees vertical mouse wheel deltas chain seamlessly to the page scroll container (<main>)
// so the page never freezes or gets trapped when scrolling over either table.
function useTableScrollChaining() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // If purely horizontal wheel, let table scroll naturally
      if (Math.abs(e.deltaY) === 0) return;

      // If scrolling vertically or mostly vertically
      if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        const mainContainer = el.closest('main') || document.querySelector('main');
        if (mainContainer) {
          mainContainer.scrollBy({
            top: e.deltaY,
            behavior: 'auto',
          });
          e.preventDefault();
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return ref;
}

// ─── Main Admin Dashboard Component ───

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const branchTableWrapperRef = useTableScrollChaining();
  const attendanceTableWrapperRef = useTableScrollChaining();

  // Floating Back to Top state
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;

    const handleScroll = () => {
      setShowScrollTop(mainEl.scrollTop > 350);
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ─── Synchronous Initial State (0ms loading freeze) ───
  const [stats, setStats] = useState<DashboardStats>(getInitialDashboardStats());
  const [collectionToday, setCollectionToday] = useState<TodayCollectionStats>(getInitialTodayCollectionStats());
  const [trendDays, setTrendDays] = useState<number>(7);
  const [activeCollectionMetric, setActiveCollectionMetric] = useState<CollectionMetricType>('today');
  const [trendData, setTrendData] = useState<CollectionTrendPoint[]>(getInitialCollectionTrend(7, 'today'));
  const [loanPortfolio, setLoanPortfolio] = useState<LoanPortfolioItem[]>(getInitialLoanPortfolio());
  const [branchPerformance, setBranchPerformance] = useState<BranchPerformanceRow[]>(getBranchPerformanceData());
  const [attendanceData, setAttendanceData] = useState<{
    rows: EmployeeAttendanceRow[];
    counts: EmployeeStatusCounts;
  }>(getInitialEmployeeAttendance());

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animated Numbers
  const animCustomers = useAnimatedCounter(stats.totalCustomers);
  const animLoans = useAnimatedCounter(stats.totalLoans);
  const animCollected = useAnimatedCounter(collectionToday.collectedAmount);
  const animPending = useAnimatedCounter(collectionToday.pendingAmount);
  const animOutstanding = useAnimatedCounter(stats.totalOutstanding);

  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [selectedPortfolioCategory, setSelectedPortfolioCategory] = useState<string | null>(null);
  const [pinnedTrend, setPinnedTrend] = useState<{ date: string; amount: number; index: number } | null>(null);
  const trendChartContainerRef = useRef<HTMLDivElement>(null);
  const lastBarClickTimeRef = useRef<number>(0);

  const handleSelectTrendBar = useCallback((entry: { date: string; amount: number }, index: number) => {
    const now = Date.now();
    if (now - lastBarClickTimeRef.current < 250) {
      return;
    }
    lastBarClickTimeRef.current = now;

    setPinnedTrend((prev) => {
      if (prev?.date === entry.date) {
        return null;
      }
      return {
        date: entry.date,
        amount: entry.amount,
        index,
      };
    });
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (trendChartContainerRef.current && trendChartContainerRef.current.contains(target)) {
        return;
      }
      if (target.closest?.('[data-chart-container="trend-chart"]')) {
        return;
      }
      setPinnedTrend(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const selectedCategoryItem = useMemo(() => {
    return loanPortfolio.find((i) => i.name === selectedPortfolioCategory) || null;
  }, [loanPortfolio, selectedPortfolioCategory]);

  // Metric visual & chart configurations (Styled with Image 1 & 2 references)
  const METRIC_CONFIGS: Record<CollectionMetricType, {
    label: string;
    chartTitle: string;
    chartSubtitle: string;
    strokeColor: string;
    barColor: string;
    gradId: string;
    tooltipTitle: string;
  }> = {
    today: {
      label: "Today's Collection",
      chartTitle: "Daily Collection Trend",
      chartSubtitle: "Collection Management & History",
      strokeColor: "#38BDF8", // Sky Blue (Image 1 reference)
      barColor: "#38BDF8",    // Exact Sky Blue from Image 1
      gradId: "goldCollectionGrad",
      tooltipTitle: "Collection Amount",
    },
    pending: {
      label: "Pending Collection",
      chartTitle: "Daily Pending Collection Trend",
      chartSubtitle: "Pending Dues & Recovery Tracking",
      strokeColor: "#F59E0B",
      barColor: "#F59E0B",    // Warm Amber (Image 2 Yellow/Amber)
      gradId: "amberPendingGrad",
      tooltipTitle: "Pending Balance",
    },
    advance: {
      label: "Advance Collection",
      chartTitle: "Daily Advance Collection Trend",
      chartSubtitle: "Pre-collections & Advance Receipts",
      strokeColor: "#3B82F6",
      barColor: "#3B82F6",    // Royal Azure (Image 2 Blue)
      gradId: "blueAdvanceGrad",
      tooltipTitle: "Advance Received",
    },
    tomorrow: {
      label: "Tomorrow Collection",
      chartTitle: "Tomorrow Collection Schedule",
      chartSubtitle: "Route Planning & Due Pipeline",
      strokeColor: "#8B5CF6",
      barColor: "#8B5CF6",    // Vibrant Violet/Indigo
      gradId: "purpleTomorrowGrad",
      tooltipTitle: "Scheduled Due",
    },
  };

  const currentMetricConfig = METRIC_CONFIGS[activeCollectionMetric];

  // Image 1 Reference: Exact value/percentage rendered directly above each bar with smart highlights
  const renderCustomBarLabel = useCallback((props: any) => {
    const { x, y, width, value, index } = props;
    if (!value || trendData.length === 0) return null;

    const isToday = index === trendData.length - 1;
    const maxVal = Math.max(...trendData.map((d) => d.amount));
    const isPeak = value === maxVal;

    const formatted = value >= 100000
      ? `₹${(value / 100000).toFixed(1)}L`
      : value >= 1000
        ? `₹${Math.round(value / 1000)}k`
        : `₹${value}`;

    // 7D View: Show value above all 7 bars
    if (trendDays <= 7) {
      return (
        <text
          x={x + width / 2}
          y={y - 8}
          fill={isToday ? '#0284C7' : '#0B1F3A'}
          textAnchor="middle"
          fontSize={10.5}
          fontFamily="Manrope"
          fontWeight="800"
          className="tabular-nums select-none pointer-events-none"
        >
          {formatted}
        </text>
      );
    }

    // 15D View: Show on alternate bars + Today
    if (trendDays === 15) {
      if (index % 2 === 0 || isToday) {
        return (
          <text
            x={x + width / 2}
            y={y - 8}
            fill={isToday ? '#0284C7' : '#0B1F3A'}
            textAnchor="middle"
            fontSize={9.5}
            fontFamily="Manrope"
            fontWeight="800"
            className="tabular-nums select-none pointer-events-none"
          >
            {formatted}
          </text>
        );
      }
      return null;
    }

    // 30D View: Prominently badge the Peak Day and Today
    if (trendDays === 30) {
      if (isToday) {
        return (
          <g className="pointer-events-none">
            <rect
              x={x + width / 2 - 22}
              y={y - 25}
              width={44}
              height={17}
              rx={4}
              fill="#0B1F3A"
              stroke="#38BDF8"
              strokeWidth={1}
            />
            <text
              x={x + width / 2}
              y={y - 13}
              fill="#38BDF8"
              textAnchor="middle"
              fontSize={9}
              fontFamily="Manrope"
              fontWeight="800"
              className="tabular-nums select-none pointer-events-none"
            >
              {formatted}
            </text>
          </g>
        );
      }

      if (isPeak) {
        return (
          <g className="pointer-events-none">
            <rect
              x={x + width / 2 - 22}
              y={y - 25}
              width={44}
              height={17}
              rx={4}
              fill="#FEF3C7"
              stroke="#D97706"
              strokeWidth={1}
            />
            <text
              x={x + width / 2}
              y={y - 13}
              fill="#B45309"
              textAnchor="middle"
              fontSize={9}
              fontFamily="Manrope"
              fontWeight="800"
              className="tabular-nums select-none pointer-events-none"
            >
              {formatted}
            </text>
          </g>
        );
      }
    }

    return null;
  }, [trendDays, trendData]);

  // Image 2 Reference: Bold percentage centered directly inside each solid pie slice
  const renderPieCustomizedLabel = useCallback((props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, index } = props;
    const item = loanPortfolio[index];
    const pct = typeof percent === 'number' && !isNaN(percent)
      ? percent
      : item?.percentage ? item.percentage / 100 : 0;

    if (!pct || pct < 0.04) return null;

    const rInner = innerRadius || 0;
    const rOuter = outerRadius || 96;
    const radius = rInner + (rOuter - rInner) * 0.58;
    const angle = midAngle != null ? midAngle : 0;
    const x = (cx || 150) + radius * Math.cos(-angle * RADIAN);
    const y = (cy || 120) + radius * Math.sin(-angle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#FFFFFF"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12.5}
        fontFamily="Manrope"
        fontWeight="800"
        style={{ pointerEvents: 'none' }}
        className="drop-shadow-sm select-none tabular-nums"
      >
        {`${Math.round(pct * 100)}%`}
      </text>
    );
  }, [loanPortfolio]);

  // ─── Background Data Refresh ───
  const loadDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);

    try {
      const [
        statsRes,
        collectionRes,
        trendRes,
        portfolioRes,
        branchRes,
        attendanceRes,
      ] = await Promise.all([
        getDashboardStats(),
        getTodayCollectionStats(),
        getCollectionTrend(trendDays, activeCollectionMetric),
        getLoanPortfolioBreakdown(),
        Promise.resolve(getBranchPerformanceData()),
        getEmployeeAttendanceToday(),
      ]);

      setStats(statsRes);
      setCollectionToday(collectionRes);
      setTrendData(trendRes);
      setLoanPortfolio(portfolioRes);
      setBranchPerformance(branchRes);
      setAttendanceData(attendanceRes);
    } catch (err) {
      console.warn('Silent data sync skipped:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [trendDays, activeCollectionMetric]);

  const handleMetricChange = (metric: CollectionMetricType) => {
    setActiveCollectionMetric(metric);
    setTrendData(getInitialCollectionTrend(trendDays, metric));
    setPinnedTrend(null);
  };

  const handleTimeframeChange = (days: number) => {
    setTrendDays(days);
    setTrendData(getInitialCollectionTrend(days, activeCollectionMetric));
    setPinnedTrend(null);
  };

  // Full page reload matching F5 browser refresh
  const handleFullRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 120);
  };

  useEffect(() => {
    loadDashboardData(false);
    const interval = setInterval(() => loadDashboardData(false), 60000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  useEffect(() => {
    const unsubscribe = listenToTodayCollections((liveCollections) => {
      if (!Array.isArray(liveCollections) || liveCollections.length === 0) return;

      const liveCollected = liveCollections
        .filter((c) => c.status !== 'nc')
        .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

      if (liveCollected > 0) {
        setCollectionToday((prev) => {
          const target = prev.targetAmount;
          const pending = Math.max(0, target - liveCollected);
          return {
            ...prev,
            collectedAmount: liveCollected,
            pendingAmount: pending,
            collectionPercent: target > 0 ? Math.round((liveCollected / target) * 1000) / 10 : prev.collectionPercent,
            totalEntries: liveCollections.length,
          };
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const periodTotal = trendData.reduce((sum, d) => sum + (d.amount || 0), 0);
  const periodAvg = trendData.length > 0 ? Math.round(periodTotal / trendData.length) : 0;

  // Dynamic Ratio Calculations
  const activeCustPct = stats.totalCustomers > 0 ? (stats.activeCustomers / stats.totalCustomers) * 100 : 91.5;
  const activeLoansPct = stats.totalLoans > 0 ? (stats.activeLoans / stats.totalLoans) * 100 : 87.0;

  const todayPendingPct = collectionToday.targetAmount > 0
    ? Math.min(100, Math.max(0, (collectionToday.pendingAmount / collectionToday.targetAmount) * 100))
    : 20.7;

  const outstandingDisbursedRatio = stats.totalDisbursed > 0
    ? Math.round((stats.totalOutstanding / stats.totalDisbursed) * 100)
    : 68;

  const formatYAxisCurrency = (val: number): string => {
    if (val === 0) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) {
      const lakhs = val / 100000;
      return lakhs % 1 === 0 ? `₹${lakhs.toFixed(0)}L` : `₹${lakhs.toFixed(1)}L`;
    }
    if (val >= 1000) return `₹${Math.round(val / 1000)}k`;
    return `₹${val}`;
  };

  // Dynamically calculate sensible Y-axis scale and Lakh ticks based on actual collection data
  const yAxisConfig = useMemo(() => {
    if (!trendData || trendData.length === 0) {
      return { max: 700000, ticks: [0, 100000, 200000, 300000, 400000, 500000, 600000, 700000] };
    }
    const maxVal = Math.max(...trendData.map((d) => d.amount || 0));

    // Determine clean step size based on data magnitude
    let step = 100000;
    if (maxVal <= 50000) {
      step = 10000;
    } else if (maxVal <= 150000) {
      step = 25000;
    } else if (maxVal <= 300000) {
      step = 50000;
    } else if (maxVal <= 1000000) {
      step = 100000; // 1 Lakh steps (₹0, ₹1L, ₹2L, ₹3L...)
    } else if (maxVal <= 2500000) {
      step = 250000;
    } else {
      step = 500000;
    }

    const ceiling = Math.max(step, Math.ceil((maxVal * 1.1) / step) * step);
    const ticks: number[] = [];
    for (let t = 0; t <= ceiling; t += step) {
      ticks.push(t);
    }
    return { max: ceiling, ticks };
  }, [trendData]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="w-full space-y-5 font-sans text-[#0B1F3A] pb-16"
    >

      {/* ── 1. DASHBOARD HEADER CARD (Executive Banking Tier with Ambient Gold Glow) ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#07172C] via-[#0B1F3A] to-[#0A1828] p-5 sm:p-6 border border-white/10 shadow-[0_8px_30px_rgba(11,31,58,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-4 border-t-2 border-t-[#D4AF37]/80">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* LEFT: Finance Pulse Icon + Main Title */}
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFE699] via-[#D4AF37] to-[#8C6808] p-[1.5px] shadow-[0_4px_16px_rgba(212,175,55,0.35)] shrink-0 transition-transform hover:scale-105 duration-200">
            <div className="w-full h-full rounded-[14px] bg-[#071527] flex items-center justify-center">
              <Activity size={22} className="text-[#F5D061] drop-shadow-[0_0_8px_rgba(245,208,97,0.5)]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans">
                Executive Financial Dashboard
              </h1>
            </div>
          </div>
        </div>

        {/* RIGHT: Date / Time Pill + Refresh Button */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {/* Live Indian Calendar Date & Time Pill (Isolated ticker) */}
          <LiveHeaderDateTime />

          {/* Refresh Button (Golden Leaf Radiant Button - Full F5 Reload) */}
          <button
            onClick={handleFullRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#B8860B] hover:from-[#FFE699] hover:via-[#F5D061] hover:to-[#D4AF37] text-[#0A1828] text-xs font-extrabold tracking-wide transition-all shadow-[0_4px_16px_rgba(212,175,55,0.35)] hover:shadow-[0_6px_24px_rgba(212,175,55,0.55)] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Complete page reload (F5)"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-[#0A1828]' : 'text-[#0A1828]'} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. DASHBOARD KPI CARDS (Executive Swiss Banking Precision) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 font-sans">

        {/* CARD 1: TOTAL CUSTOMERS */}
        <div
          onClick={() => navigate('/admin/customers')}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_10px_rgba(11,31,58,0.04)] hover:shadow-[0_8px_24px_rgba(37,99,235,0.1)] hover:border-blue-400 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[146px] cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-transparent group-hover:bg-blue-600 transition-colors" />
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans group-hover:text-blue-700 transition-colors leading-tight">
                Total Customers
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
                <Users size={15} />
              </div>
            </div>

            <div className="my-2.5">
              <span className="text-2xl sm:text-[28px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums block truncate">
                {formatIndianNumber(animCustomers)}
              </span>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100/90 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span>Active: <strong className="text-blue-700 font-bold tabular-nums">{formatIndianNumber(stats.activeCustomers)}</strong></span>
            <span className="text-slate-300">•</span>
            <span>KYC Due: <strong className="text-[#0B1F3A] font-bold tabular-nums">{stats.kycPending}</strong></span>
          </div>
        </div>

        {/* CARD 2: TOTAL LOANS */}
        <div
          onClick={() => navigate('/admin/loans')}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_10px_rgba(11,31,58,0.04)] hover:shadow-[0_8px_24px_rgba(212,175,55,0.12)] hover:border-amber-400 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[146px] cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-transparent group-hover:bg-[#D4AF37] transition-colors" />
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans group-hover:text-[#B8860B] transition-colors leading-tight">
                Total Loans
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#B8860B] border border-amber-200/80 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
                <CreditCard size={15} />
              </div>
            </div>

            <div className="my-2.5">
              <span className="text-2xl sm:text-[28px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums block truncate">
                {formatIndianNumber(animLoans)}
              </span>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100/90 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span>Active: <strong className="text-[#B8860B] font-bold tabular-nums">{formatIndianNumber(stats.activeLoans)}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Settled: <strong className="text-[#0B1F3A] font-bold tabular-nums">{formatIndianNumber(stats.closedLoans)}</strong></span>
          </div>
        </div>

        {/* CARD 3: COLLECTION TODAY */}
        <div
          onClick={() => {
            handleMetricChange('today');
            document.getElementById('analytics-charts-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_10px_rgba(11,31,58,0.04)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.12)] hover:border-emerald-400 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[146px] cursor-pointer group relative overflow-hidden"
          title="Click to view Today's Collection trend in chart below"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-transparent group-hover:bg-emerald-600 transition-colors" />
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans group-hover:text-emerald-700 transition-colors leading-tight">
                Collection Today
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
                <Wallet size={15} />
              </div>
            </div>

            <div className="my-2.5">
              <span className="text-2xl sm:text-[28px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums block truncate">
                {formatINR(animCollected)}
              </span>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100/90 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span>Target: <strong className="text-[#0B1F3A] font-bold tabular-nums">{formatINR(collectionToday.targetAmount)}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Left: <strong className="text-emerald-700 font-bold tabular-nums">{formatINR(collectionToday.pendingAmount)}</strong></span>
          </div>
        </div>

        {/* CARD 4: PENDING COLLECTION */}
        <div
          onClick={() => {
            handleMetricChange('pending');
            document.getElementById('analytics-charts-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_10px_rgba(11,31,58,0.04)] hover:shadow-[0_8px_24px_rgba(244,63,94,0.12)] hover:border-rose-400 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[146px] cursor-pointer group relative overflow-hidden"
          title="Click to view Pending Collection trend in chart below"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-transparent group-hover:bg-rose-500 transition-colors" />
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans group-hover:text-rose-700 transition-colors leading-tight">
                Pending Collection
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/80 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
                <Clock size={15} />
              </div>
            </div>

            <div className="my-2.5">
              <span className="text-2xl sm:text-[28px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums block truncate">
                {formatINR(animPending)}
              </span>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100/90 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span>Due: <strong className="text-blue-700 font-bold tabular-nums">{formatINR(collectionToday.dueThisWeek)}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Overdue: <strong className="text-rose-600 font-bold tabular-nums">{collectionToday.ncCount} Cases</strong></span>
          </div>
        </div>

        {/* CARD 5: TOTAL OUTSTANDING */}
        <div
          onClick={() => navigate('/admin/loans')}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_10px_rgba(11,31,58,0.04)] hover:shadow-[0_8px_24px_rgba(11,31,58,0.1)] hover:border-slate-500 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[146px] cursor-pointer group relative overflow-hidden sm:col-span-2 lg:col-span-1"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-transparent group-hover:bg-[#0B1F3A] transition-colors" />
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans group-hover:text-[#0B1F3A] transition-colors leading-tight">
                Total Outstanding
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#0B1F3A] border border-slate-200/90 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
                <TrendingUp size={15} />
              </div>
            </div>

            <div className="my-2.5">
              <span className="text-2xl sm:text-[28px] font-extrabold text-[#0B1F3A] font-manrope tracking-tight tabular-nums block truncate">
                {formatINR(animOutstanding)}
              </span>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100/90 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium truncate">
            <span>Disb: <strong className="text-[#0B1F3A] font-bold tabular-nums">{formatINR(stats.totalDisbursed)}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Coll: <strong className="text-emerald-700 font-bold tabular-nums">{formatINR(stats.totalCollected)}</strong></span>
          </div>
        </div>

      </div>

      {/* ── 3. ANALYTICS CHARTS (Sections 27 & 28) ── */}
      <div id="analytics-charts-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 scroll-mt-6">

        {/* DAILY COLLECTION TREND (8 Columns, Section 27 — Image 1 Reference) */}
        <div className="lg:col-span-8 bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04)] overflow-hidden flex flex-col justify-between">
          {/* Professional Navy Section Header — Customer Relationship Officer (CRO) Reference Styling */}
          <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-bold text-white tracking-wider uppercase font-sans whitespace-nowrap">
                    {currentMetricConfig.chartTitle}
                  </h2>
                  <span className="text-[10px] font-manrope font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-[#F5D061] border border-[#D4AF37]/30 tabular-nums shrink-0">
                    {trendDays}D View
                  </span>
                </div>
                <span className="text-[11px] text-slate-300 font-medium tracking-normal mt-0.5 block truncate">
                  {currentMetricConfig.chartSubtitle}
                </span>
              </div>
            </div>

            {/* View Mode Toggle (Bar / Curve) & Period Switcher */}
            <div className="flex items-center flex-wrap gap-2.5 md:ml-auto">
              {trendData.length > 0 && (
                <div className="hidden 2xl:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-manrope tabular-nums text-slate-300 shadow-inner">
                  <span>Total: <strong className="text-white font-bold">{formatINR(periodTotal)}</strong></span>
                  <span className="text-white/20">·</span>
                  <span>Avg: <strong className="text-[#F5D061] font-bold">{formatINR(periodAvg)}</strong></span>
                </div>
              )}

              {/* View Mode Toggle (Bar / Curve) */}
              <div className="flex items-center bg-[#07172C] p-1 rounded-xl border border-white/15 text-xs gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    chartType === 'bar'
                      ? 'bg-gradient-to-r from-[#F5D061] to-[#D4AF37] text-[#0A1828] font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/10 font-semibold'
                  }`}
                  title="Column / Bar Chart"
                >
                  <BarChart3 size={13} />
                  <span>Columns</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('area')}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    chartType === 'area'
                      ? 'bg-gradient-to-r from-[#F5D061] to-[#D4AF37] text-[#0A1828] font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/10 font-semibold'
                  }`}
                  title="Smooth Curve Chart"
                >
                  <TrendingUp size={13} />
                  <span>Curve</span>
                </button>
              </div>

              {/* Period Switcher (7D, 15D, 30D) */}
              <div className="flex items-center bg-[#07172C] p-1 rounded-xl border border-white/15 text-xs gap-1 shadow-inner">
                {[7, 15, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleTimeframeChange(days)}
                    className={`px-2.5 py-1 rounded-lg font-manrope transition-all duration-200 cursor-pointer tabular-nums text-xs ${
                      trendDays === days
                        ? 'bg-gradient-to-r from-[#F5D061] to-[#D4AF37] text-[#0A1828] font-bold shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-white/10 font-bold'
                    }`}
                  >
                    {days}D
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
            <div ref={trendChartContainerRef} data-chart-container="trend-chart" className="h-64 sm:h-72 w-full relative select-none">
              {trendData.length > 0 ? (
                chartType === 'bar' ? (
                  /* ─── Image 1 Reference: Modern Column / Bar Chart with Dotted Gridlines & Top Value Labels ─── */
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={trendData}
                      margin={{ top: 28, right: 12, left: -10, bottom: 4 }}
                      barCategoryGap={trendDays === 30 ? '18%' : '14%'}
                      onClick={(e: any) => {
                        if (e && (e.activePayload?.length > 0 || typeof e.activeTooltipIndex === 'number' || e.activeLabel)) {
                          const idx = typeof e.activeTooltipIndex === 'number'
                            ? e.activeTooltipIndex
                            : trendData.findIndex((t) => t.date === e.activeLabel);
                          if (idx >= 0 && trendData[idx]) {
                            handleSelectTrendBar(trendData[idx], idx);
                            return;
                          }
                        }
                        const now = Date.now();
                        if (now - lastBarClickTimeRef.current > 250) {
                          setPinnedTrend(null);
                        }
                      }}
                    >
                      <defs>
                        {/* Collection gradient: Vibrant Sky to Ocean Blue */}
                        <linearGradient id="barGradToday" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38BDF8" stopOpacity={1} />
                          <stop offset="100%" stopColor="#0284C7" stopOpacity={0.85} />
                        </linearGradient>
                        {/* Today active bar */}
                        <linearGradient id="barGradActiveDay" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0EA5E9" stopOpacity={1} />
                          <stop offset="100%" stopColor="#0369A1" stopOpacity={1} />
                        </linearGradient>
                        {/* Pending gradient: Warm Golden Amber */}
                        <linearGradient id="barGradPending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FBBF24" stopOpacity={1} />
                          <stop offset="100%" stopColor="#D97706" stopOpacity={0.88} />
                        </linearGradient>
                        {/* Advance gradient: Electric Royal Blue */}
                        <linearGradient id="barGradAdvance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#60A5FA" stopOpacity={1} />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity={0.88} />
                        </linearGradient>
                        {/* Tomorrow gradient: Vibrant Violet */}
                        <linearGradient id="barGradTomorrow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#A78BFA" stopOpacity={1} />
                          <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.88} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 4" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#94A3B8"
                        fontSize={trendDays === 15 ? 10 : 11}
                        tickLine={false}
                        interval={trendDays === 30 ? 4 : trendDays === 15 ? 1 : 0}
                        tick={{ fill: '#64748B', fontSize: trendDays === 30 ? 10.5 : 11, fontWeight: 600, cursor: 'pointer' }}
                        dy={6}
                        style={{ fontFamily: 'Manrope', fontVariantNumeric: 'tabular-nums' }}
                      />
                      <YAxis
                        orientation="left"
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        domain={[0, yAxisConfig.max]}
                        ticks={yAxisConfig.ticks}
                        tickFormatter={formatYAxisCurrency}
                        tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                        style={{ fontFamily: 'Manrope', fontVariantNumeric: 'tabular-nums' }}
                      />
                      <Tooltip
                        cursor={pinnedTrend ? false : { fill: 'rgba(56, 189, 248, 0.07)', radius: 6 }}
                        formatter={(v: any) => [formatINRFull(Number(v || 0)), currentMetricConfig.tooltipTitle]}
                        content={pinnedTrend ? () => null : undefined}
                        contentStyle={{
                          backgroundColor: '#0B1F3A',
                          borderRadius: '12px',
                          color: '#FFFFFF',
                          border: `1px solid ${currentMetricConfig.barColor}`,
                          fontSize: '12px',
                          fontFamily: 'Manrope',
                          fontVariantNumeric: 'tabular-nums',
                          padding: '10px 14px',
                          boxShadow: '0 10px 25px -5px rgba(11,31,58,0.3)',
                        }}
                        labelStyle={{ color: '#E2E8F0', fontWeight: '600', fontFamily: 'Inter', marginBottom: '4px' }}
                        itemStyle={{ color: currentMetricConfig.barColor, fontWeight: '800', fontFamily: 'Manrope', fontSize: '13px' }}
                      />
                      <Bar
                        dataKey="amount"
                        radius={[5, 5, 1, 1]}
                        maxBarSize={trendDays === 7 ? 44 : trendDays === 15 ? 22 : 14}
                        isAnimationActive={false}
                        onClick={(data: any, index: number) => {
                          const item = trendData[index] || data;
                          if (item && item.date) {
                            handleSelectTrendBar(item, index);
                          }
                        }}
                      >
                        {trendData.map((entry, index) => {
                          const isToday = index === trendData.length - 1;
                          const isPinned = pinnedTrend?.date === entry.date;
                          const gradId = activeCollectionMetric === 'pending'
                            ? 'url(#barGradPending)'
                            : activeCollectionMetric === 'advance'
                              ? 'url(#barGradAdvance)'
                              : activeCollectionMetric === 'tomorrow'
                                ? 'url(#barGradTomorrow)'
                                : isToday
                                  ? 'url(#barGradActiveDay)'
                                  : 'url(#barGradToday)';

                          return (
                            <Cell
                              key={`bar-cell-${index}`}
                              fill={isPinned ? '#38BDF8' : gradId}
                              stroke={isPinned ? '#FFFFFF' : 'none'}
                              strokeWidth={isPinned ? 2.5 : 0}
                              className="transition-all duration-200 hover:opacity-90 cursor-pointer"
                            />
                          );
                        })}
                        <LabelList dataKey="amount" content={renderCustomBarLabel} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  /* ─── Area Curve Chart Mode ─── */
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                      onClick={(e: any) => {
                        if (e && (e.activePayload?.length > 0 || typeof e.activeTooltipIndex === 'number' || e.activeLabel)) {
                          const idx = typeof e.activeTooltipIndex === 'number'
                            ? e.activeTooltipIndex
                            : trendData.findIndex((t) => t.date === e.activeLabel);
                          if (idx >= 0 && trendData[idx]) {
                            handleSelectTrendBar(trendData[idx], idx);
                            return;
                          }
                        }
                        const now = Date.now();
                        if (now - lastBarClickTimeRef.current > 250) {
                          setPinnedTrend(null);
                        }
                      }}
                    >
                      <defs>
                        <linearGradient id="goldCollectionGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.24} />
                          <stop offset="100%" stopColor="#38BDF8" stopOpacity={0.01} />
                        </linearGradient>
                        <linearGradient id="amberPendingGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.24} />
                          <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.01} />
                        </linearGradient>
                        <linearGradient id="blueAdvanceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.24} />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.01} />
                        </linearGradient>
                        <linearGradient id="purpleTomorrowGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.24} />
                          <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#94A3B8"
                        fontSize={trendDays === 15 ? 10 : 11}
                        tickLine={false}
                        interval={trendDays === 30 ? 4 : trendDays === 15 ? 1 : 0}
                        tick={{ fill: '#64748B', fontSize: trendDays === 30 ? 10.5 : 11, fontWeight: 600, cursor: 'pointer' }}
                        dy={6}
                        style={{ fontFamily: 'Manrope', fontVariantNumeric: 'tabular-nums' }}
                      />
                      <YAxis
                        orientation="left"
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        domain={[0, yAxisConfig.max]}
                        ticks={yAxisConfig.ticks}
                        tickFormatter={formatYAxisCurrency}
                        tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                        style={{ fontFamily: 'Manrope', fontVariantNumeric: 'tabular-nums' }}
                      />
                      <Tooltip
                        formatter={(v: any) => [formatINRFull(Number(v || 0)), currentMetricConfig.tooltipTitle]}
                        content={pinnedTrend ? () => null : undefined}
                        contentStyle={{
                          backgroundColor: '#0B1F3A',
                          borderRadius: '10px',
                          color: '#FFFFFF',
                          border: `1px solid ${currentMetricConfig.barColor}`,
                          fontSize: '12px',
                          fontFamily: 'Manrope',
                          fontVariantNumeric: 'tabular-nums',
                          padding: '8px 12px',
                          boxShadow: '0 8px 20px rgba(11,31,58,0.25)',
                        }}
                        labelStyle={{ color: '#FFFFFF', fontWeight: '600', fontFamily: 'Inter', marginBottom: '2px' }}
                        itemStyle={{ color: currentMetricConfig.barColor, fontWeight: '700', fontFamily: 'Manrope' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke={currentMetricConfig.barColor}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fillOpacity={1}
                        fill={`url(#${currentMetricConfig.gradId})`}
                        dot={false}
                        activeDot={{ r: 4.5, fill: currentMetricConfig.barColor, stroke: '#FFFFFF', strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center rounded-xl bg-[#F8FAFC] border border-dashed border-[#CBD5E1] p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm flex items-center justify-center text-[#64748B] mb-3">
                    <Clock size={22} className="text-[#0B1F3A]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0B1F3A] font-sans">
                    No Tomorrow Collection Data Available
                  </h3>
                  <p className="text-xs text-[#64748B] max-w-sm mt-1 font-sans leading-relaxed">
                    Tomorrow&apos;s field collection schedules and daily route targets are generated automatically at 07:00 AM on field route initialization.
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMetricChange('today')}
                      className="px-3.5 py-1.5 rounded-lg bg-[#0B1F3A] text-[#FFFFFF] text-xs font-semibold hover:bg-[#132F58] transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <span>View Today&apos;s Collection</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* Persistent Pinned Tooltip Overlay Card (Stays until clicked elsewhere) */}
              {pinnedTrend && (
                <div
                  className="absolute z-30 pointer-events-none transition-all duration-300 ease-out animate-in fade-in zoom-in-95"
                  style={{
                    left: `${Math.min(78, Math.max(22, 8 + ((pinnedTrend.index + 0.5) / trendData.length) * 88))}%`,
                    top: '40%',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="bg-[#0B1F3A] rounded-xl text-white border border-[#38BDF8]/60 px-4 py-3 shadow-[0_14px_30px_rgba(11,31,58,0.65)] min-w-[210px] pointer-events-auto">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-[13px] text-[#FFFFFF] font-bold font-sans flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
                        {pinnedTrend.date}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPinnedTrend(null);
                        }}
                        className="text-slate-400 hover:text-white hover:bg-white/10 w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer text-xs"
                        title="Dismiss"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="text-[13px] font-extrabold text-[#38BDF8] font-manrope tabular-nums">
                      {currentMetricConfig.tooltipTitle} : {formatINRFull(pinnedTrend.amount)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lower Summary Strip — Interactive Metric Switchers (Executive Collection Ledger Style) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-3 border-t border-[#E2E8F0]">
              {/* Box 1: Today's Collection */}
              <button
                type="button"
                onClick={() => handleMetricChange('today')}
                className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer text-left relative flex flex-col justify-between group min-h-[96px] ${
                  activeCollectionMetric === 'today'
                    ? 'bg-emerald-50/50 border-emerald-500 ring-1 ring-emerald-500/20 shadow-sm'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10.5px] font-bold uppercase tracking-wider block font-sans truncate ${
                    activeCollectionMetric === 'today' ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-700'
                  }`}>
                    Today&apos;s Collection
                  </span>
                  {activeCollectionMetric === 'today' ? (
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-full border border-emerald-300/50 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-600 transition-colors shrink-0">
                      Select
                    </span>
                  )}
                </div>
                <span className="text-lg sm:text-[21px] font-manrope font-extrabold text-[#0B1F3A] block tabular-nums tracking-tight my-0.5">
                  {formatINR(collectionToday.collectedAmount)}
                </span>
                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500 font-medium truncate">
                  <span className="truncate">Reconciled Daily Inflow</span>
                </div>
              </button>

              {/* Box 2: Pending Collection */}
              <button
                type="button"
                onClick={() => handleMetricChange('pending')}
                className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer text-left relative flex flex-col justify-between group min-h-[96px] ${
                  activeCollectionMetric === 'pending'
                    ? 'bg-amber-50/50 border-amber-500 ring-1 ring-amber-500/20 shadow-sm'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10.5px] font-bold uppercase tracking-wider block font-sans truncate ${
                    activeCollectionMetric === 'pending' ? 'text-amber-700' : 'text-slate-500 group-hover:text-slate-700'
                  }`}>
                    Pending Collection
                  </span>
                  {activeCollectionMetric === 'pending' ? (
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded-full border border-amber-300/50 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-600 transition-colors shrink-0">
                      Select
                    </span>
                  )}
                </div>
                <span className="text-lg sm:text-[21px] font-manrope font-extrabold text-[#0B1F3A] block tabular-nums tracking-tight my-0.5">
                  {formatINR(collectionToday.pendingAmount)}
                </span>
                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500 font-medium truncate">
                  <span className="truncate">Outstanding Due Accounts</span>
                </div>
              </button>

              {/* Box 3: Advance Collection */}
              <button
                type="button"
                onClick={() => handleMetricChange('advance')}
                className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer text-left relative flex flex-col justify-between group min-h-[96px] ${
                  activeCollectionMetric === 'advance'
                    ? 'bg-blue-50/50 border-blue-500 ring-1 ring-blue-500/20 shadow-sm'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10.5px] font-bold uppercase tracking-wider block font-sans truncate ${
                    activeCollectionMetric === 'advance' ? 'text-blue-700' : 'text-slate-500 group-hover:text-slate-700'
                  }`}>
                    Advance Collection
                  </span>
                  {activeCollectionMetric === 'advance' ? (
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded-full border border-blue-300/50 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-600 transition-colors shrink-0">
                      Select
                    </span>
                  )}
                </div>
                <span className="text-lg sm:text-[21px] font-manrope font-extrabold text-[#0B1F3A] block tabular-nums tracking-tight my-0.5">
                  {formatINR(collectionToday.advanceAmount || 0)}
                </span>
                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500 font-medium truncate">
                  <span className="truncate">Prepaid Early Settlements</span>
                </div>
              </button>

              {/* Box 4: Tomorrow Collection */}
              <button
                type="button"
                onClick={() => handleMetricChange('tomorrow')}
                className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer text-left relative flex flex-col justify-between group min-h-[96px] ${
                  activeCollectionMetric === 'tomorrow'
                    ? 'bg-purple-50/50 border-purple-500 ring-1 ring-purple-500/20 shadow-sm'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10.5px] font-bold uppercase tracking-wider block font-sans truncate ${
                    activeCollectionMetric === 'tomorrow' ? 'text-purple-700' : 'text-slate-500 group-hover:text-slate-700'
                  }`}>
                    Tomorrow Collection
                  </span>
                  {activeCollectionMetric === 'tomorrow' ? (
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-purple-700 bg-purple-100/80 px-1.5 py-0.5 rounded-full border border-purple-300/50 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-600 transition-colors shrink-0">
                      Select
                    </span>
                  )}
                </div>
                <span className="text-lg sm:text-[21px] font-manrope font-extrabold text-[#0B1F3A] block tabular-nums tracking-tight my-0.5">
                  {formatINR(collectionToday.tomorrowAmount || 0)}
                </span>
                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500 font-medium truncate">
                  <span className="truncate">
                    {collectionToday.tomorrowDuesCount || 0} Dues · Due Pipeline
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* LOAN PORTFOLIO STATUS (4 Columns, Section 28 — Image 2 Reference) */}
        <div className="lg:col-span-4 bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04)] overflow-hidden flex flex-col justify-between">
          <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-bold text-white tracking-wider uppercase font-sans whitespace-nowrap truncate">
                  Loan Portfolio Status
                </h2>
                <span className="text-[11px] text-slate-300 font-medium tracking-normal mt-0.5 block truncate">
                  Loan Management &amp; Closure
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-[#07172C] border border-white/15 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-inner">
                <span className="text-slate-300 text-xs font-medium font-sans">
                  {selectedPortfolioCategory ? 'Selected:' : 'Total:'}
                </span>
                <strong className="text-[#F5D061] font-extrabold font-manrope text-xs tracking-wider tabular-nums">
                  {selectedPortfolioCategory
                    ? formatIndianNumber(loanPortfolio.find((i) => i.name === selectedPortfolioCategory)?.value || 0)
                    : formatIndianNumber(stats.totalLoans)}
                </strong>
              </div>
              <PieIcon size={16} className="text-[#D4AF37] ml-0.5 shrink-0" />
            </div>
          </div>

          <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between items-center">
            {/* ─── Image 2 Reference: Solid Circular Pie Chart with Bold Percentage Labels Inside Slices ─── */}
            <div className="relative w-full h-56 sm:h-60 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={loanPortfolio}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={96}
                    paddingAngle={1.5}
                    dataKey="value"
                    labelLine={false}
                    label={renderPieCustomizedLabel}
                    isAnimationActive={false}
                    onClick={(entry: any) => {
                      if (entry && entry.name) {
                        setSelectedPortfolioCategory(selectedPortfolioCategory === entry.name ? null : entry.name);
                      }
                    }}
                  >
                    {loanPortfolio.map((entry, index) => {
                      const isSelected = selectedPortfolioCategory === entry.name;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke={isSelected ? '#38BDF8' : '#FFFFFF'}
                          strokeWidth={isSelected ? 4 : 2}
                          className="cursor-pointer transition-all duration-200 hover:opacity-90"
                          onClick={() => setSelectedPortfolioCategory(selectedPortfolioCategory === entry.name ? null : entry.name)}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#0B1F3A] text-white px-3 py-2 rounded-xl border border-sky-400 shadow-xl text-xs font-sans">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
                              <strong className="text-white text-xs font-bold">{data.name}</strong>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-300 font-number">{formatIndianNumber(data.value)} Loans</span>
                              <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-extrabold font-number text-xs">
                                {data.percentage}%
                              </span>
                            </div>
                            <span className="text-[10px] text-sky-200/70 block mt-1">
                              Click to lock details
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Interactive Selected Category Detail Showcase */}
            {selectedCategoryItem ? (
              <div className="w-full bg-[#0B1F3A] border border-[#D4AF37]/40 rounded-xl p-3 mb-2.5 shadow-sm flex items-center justify-between transition-all duration-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white/30"
                    style={{ backgroundColor: selectedCategoryItem.color }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white font-sans truncate">
                        {selectedCategoryItem.name}
                      </span>
                      <span className="text-[10px] font-bold text-[#0A1828] bg-gradient-to-r from-[#F5D061] to-[#D4AF37] px-1.5 py-0.5 rounded font-sans">
                        Selected
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-300 font-sans block mt-0.5">
                      {formatIndianNumber(selectedCategoryItem.value)} of {formatIndianNumber(stats.totalLoans)} Total Loans
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 pl-2">
                  <div className="text-right">
                    <span className="text-base font-extrabold font-manrope text-[#F5D061] tabular-nums block leading-tight">
                      {selectedCategoryItem.percentage}%
                    </span>
                    <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wider font-sans">
                      Share
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPortfolioCategory(null);
                    }}
                    className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                    title="Clear selection"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 mb-2.5 text-center text-xs text-slate-500 font-sans flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                <span>Click any slice or box to view category &amp; percentage</span>
              </div>
            )}

            {/* 4-Category Breakdown Grid (Executive Collection Ledger Style) */}
            <div className="w-full grid grid-cols-2 gap-2.5 pt-3 border-t border-[#E2E8F0]">
              {loanPortfolio.map((item) => {
                const isSelected = selectedPortfolioCategory === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedPortfolioCategory(selectedPortfolioCategory === item.name ? null : item.name)}
                    className={`flex flex-col p-3 rounded-xl border text-xs transition-all duration-200 cursor-pointer text-left justify-between ${
                      isSelected
                        ? 'bg-blue-50/50 border-blue-500 ring-1 ring-blue-500/20 shadow-sm'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
                    }`}
                    title={`Click to filter / highlight ${item.name}`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/5" style={{ backgroundColor: item.color }} />
                        <span className="text-[#0B1F3A] font-bold font-sans truncate text-xs">{item.name}</span>
                      </div>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100">
                      <span className="font-manrope font-extrabold text-[#0B1F3A] tabular-nums text-sm sm:text-base">
                        {formatIndianNumber(item.value)}
                      </span>
                      <span
                        className="text-[10.5px] font-manrope font-bold px-2 py-0.5 rounded-full border border-current/20 tabular-nums"
                        style={{ backgroundColor: `${item.color}15`, color: item.color }}
                      >
                        {item.percentage}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ── 4. BRANCH PERFORMANCE & STAFF STATUS (Stacked Full-Width Ledgers) ── */}
      <div className="flex flex-col gap-6">

        {/* 4A. BRANCH PERFORMANCE (Full-Width Institutional Regional Ledger) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04)]">
          {/* Section Header */}
          <div className="bg-[#0B1F3A] rounded-t-2xl px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full shrink-0" />
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-bold text-white tracking-wider uppercase font-sans">
                    Branch Performance &amp; Regional Ledger
                  </h2>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-[#F5D061] border border-white/15">
                    {branchPerformance.length} {branchPerformance.length === 1 ? 'Operational Branch' : 'Operational Branches'}
                  </span>
                </div>
                <span className="text-xs text-slate-300 font-medium block mt-0.5">
                  Tamil Nadu regional branch collections, active portfolio &amp; recovery metrics
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/branches')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#F5D061] hover:text-white border border-white/15 text-xs font-bold transition-all cursor-pointer"
            >
              <span>View All Branches</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div
            ref={branchTableWrapperRef}
            className="overflow-x-auto w-full custom-scrollbar rounded-b-2xl overscroll-x-auto overscroll-y-auto"
            style={{ overscrollBehaviorX: 'auto', overscrollBehaviorY: 'auto', touchAction: 'pan-x pan-y' }}
          >
            <table className="w-full text-left text-xs border-collapse min-w-[900px] font-sans">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50/90 text-slate-600 font-bold text-[11px] uppercase tracking-wider select-none font-sans">
                  <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[240px]">Branch Office</th>
                  <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[170px]">Branch Manager</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[150px]">Today&apos;s Inflow (₹)</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[130px]">Active Loans</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[150px]">Outstanding Debt (₹)</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">Recovery Rate</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {branchPerformance.map((b, idx) => (
                  <tr
                    key={b.id}
                    onClick={() => navigate(`/branches/${b.id}/dashboard`)}
                    className={`hover:bg-blue-50/40 transition-colors cursor-pointer group align-middle ${
                      idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                    }`}
                  >
                    {/* Branch Office */}
                    <td className="py-3.5 px-5 text-left whitespace-nowrap align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/80 text-[#D4AF37] flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                          <GitBranch size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#0B1F3A] group-hover:text-blue-700 transition-colors text-xs sm:text-[13px] font-sans truncate">
                              {b.name}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                              {b.code}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                            <MapPin size={11} className="text-emerald-600 shrink-0" />
                            <span>{b.city}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Manager */}
                    <td className="py-3.5 px-4 text-left whitespace-nowrap align-middle">
                      <div className="font-bold text-[#0B1F3A] text-xs sm:text-[13px] font-sans">
                        {b.manager}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Regional Executive
                      </div>
                    </td>

                    {/* Today's Inflow */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap align-middle">
                      <span className="font-manrope font-extrabold text-emerald-700 tabular-nums text-xs sm:text-sm">
                        {b.todayCollection}
                      </span>
                    </td>

                    {/* Active Loans */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap align-middle">
                      <span className="font-manrope font-bold text-[#0B1F3A] tabular-nums text-xs sm:text-sm">
                        {formatIndianNumber(b.loansCount)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium ml-1">
                        Loans
                      </span>
                    </td>

                    {/* Outstanding */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap align-middle">
                      <span className="font-manrope font-bold text-[#0B1F3A] tabular-nums text-xs sm:text-sm">
                        {b.outstanding}
                      </span>
                    </td>

                    {/* Recovery Rate */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                      <div className="flex items-center justify-center">
                        <span className="inline-flex items-center justify-center text-[11px] font-manrope font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 tabular-nums shadow-2xs">
                          {b.collectionRate}% Rate
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                      <div className="flex items-center justify-center">
                        <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Operational</span>
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4B. STAFF STATUS & ATTENDANCE (Full-Width Institutional Daily Register) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,31,58,0.04)]">
          {/* Section Header */}
          <div className="bg-[#0B1F3A] rounded-t-2xl px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full shrink-0" />
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-bold text-white tracking-wider uppercase font-sans">
                    Staff Status &amp; Daily Attendance Register
                  </h2>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tabular-nums">
                    {attendanceData.counts.attendancePercent}% Present Today
                  </span>
                </div>
                <span className="text-xs text-slate-300 font-medium block mt-0.5">
                  Real-time GPS geofence logins, route verification &amp; workforce readiness
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Metric Pills */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] bg-white/10 text-white px-2.5 py-1 rounded-full font-bold tabular-nums border border-white/15">
                  {attendanceData.counts.totalStaff} Total
                </span>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-bold border border-emerald-500/30 tabular-nums">
                  {attendanceData.counts.activeCount} Present
                </span>
                <span className="text-[11px] bg-rose-500/20 text-rose-300 px-2.5 py-1 rounded-full font-bold border border-rose-500/30 tabular-nums">
                  {attendanceData.counts.absentCount} Absent
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin/attendance')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#F5D061] hover:text-white border border-white/15 text-xs font-bold transition-all cursor-pointer ml-1"
              >
                <span>Full Attendance Log</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div
            ref={attendanceTableWrapperRef}
            className="overflow-x-auto w-full custom-scrollbar rounded-b-2xl overscroll-x-auto overscroll-y-auto"
            style={{ overscrollBehaviorX: 'auto', overscrollBehaviorY: 'auto', touchAction: 'pan-x pan-y' }}
          >
            <table className="w-full text-left text-xs border-collapse min-w-[900px] font-sans">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50/90 text-slate-600 font-bold text-[11px] uppercase tracking-wider select-none font-sans">
                  <th className="py-3.5 px-5 text-left whitespace-nowrap min-w-[220px]">Staff Member</th>
                  <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[160px]">Designation</th>
                  <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[180px]">Assigned Branch</th>
                  <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[260px]">Live Geofence Location</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[130px]">Login Time</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">Duty Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {attendanceData.rows.slice(0, 8).map((emp, idx) => (
                  <tr
                    key={emp.id}
                    className={`hover:bg-blue-50/40 transition-colors group align-middle ${
                      idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                    }`}
                  >
                    {/* Staff Member */}
                    <td className="py-3.5 px-5 text-left whitespace-nowrap align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold bg-gradient-to-br from-[#0B1F3A] to-[#1e3a61] text-[#F5D061] border border-[#D4AF37]/30 shrink-0 font-sans shadow-2xs">
                          {emp.initials || emp.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[#0B1F3A] text-xs sm:text-[13px] font-sans truncate">
                            {emp.name}
                          </div>
                          <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                            {emp.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Designation */}
                    <td className="py-3.5 px-4 text-left whitespace-nowrap align-middle">
                      <span className="font-semibold text-slate-800 text-xs font-sans">
                        {emp.role}
                      </span>
                    </td>

                    {/* Assigned Branch */}
                    <td className="py-3.5 px-4 text-left whitespace-nowrap align-middle">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <Building2 size={13} className="text-[#D4AF37] shrink-0" />
                        <span>{emp.branch}</span>
                      </div>
                    </td>

                    {/* Live Geofence Location */}
                    <td className="py-3.5 px-4 text-left whitespace-nowrap align-middle">
                      {emp.location ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium max-w-[260px] truncate" title={emp.location}>
                          <MapPin size={12} className="text-emerald-600 shrink-0" />
                          <span className="truncate">{emp.location}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic font-medium">Location Pending</span>
                      )}
                    </td>

                    {/* Login Time */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        <Clock size={11} className="text-slate-400 shrink-0" />
                        <span className="font-manrope font-bold text-[#0B1F3A] tabular-nums text-xs sm:text-[13px]">
                          {emp.inTime}
                        </span>
                      </div>
                    </td>

                    {/* Duty Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                      <div className="flex items-center justify-center">
                        <span
                          className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            emp.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              emp.status === 'Present' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>{emp.status}</span>
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── 5. COMPACT QUICK ACCESS (Sections 32 & 42) ── */}
      {/* Navigation shortcuts with rich Royal Blue interaction states */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-blue-600" />
            <h3 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider font-sans">
              Quick Access
            </h3>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-sans">
              4 Modules
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Administrative direct shortcuts</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Shortcut 1: Loan Management */}
          <div
            onClick={() => navigate('/admin/loans')}
            className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-500 hover:shadow-[0_4px_16px_rgba(37,99,235,0.12)] active:scale-[0.98] active:border-blue-600 p-4 transition-all duration-200 flex items-center justify-between cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-700 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 group-hover:shadow-[0_4px_12px_rgba(37,99,235,0.3)] group-active:bg-blue-700 flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0">
                <CreditCard size={18} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[#0B1F3A] group-hover:text-blue-700 transition-colors font-sans truncate">
                  Loan Management
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                  Sanctions, dues &amp; portfolio
                </p>
              </div>
            </div>
            
            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 group-hover:bg-blue-600 group-hover:border-blue-600 group-active:bg-blue-700 flex items-center justify-center transition-all duration-200 shrink-0 ml-2">
              <ArrowRight size={13} className="text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* Shortcut 2: Customer Management */}
          <div
            onClick={() => navigate('/admin/customers')}
            className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-500 hover:shadow-[0_4px_16px_rgba(37,99,235,0.12)] active:scale-[0.98] active:border-blue-600 p-4 transition-all duration-200 flex items-center justify-between cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-700 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 group-hover:shadow-[0_4px_12px_rgba(37,99,235,0.3)] group-active:bg-blue-700 flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0">
                <Users size={18} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[#0B1F3A] group-hover:text-blue-700 transition-colors font-sans truncate">
                  Customer Management
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                  Profiles, KYC &amp; credit records
                </p>
              </div>
            </div>
            
            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 group-hover:bg-blue-600 group-hover:border-blue-600 group-active:bg-blue-700 flex items-center justify-center transition-all duration-200 shrink-0 ml-2">
              <ArrowRight size={13} className="text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* Shortcut 3: Collection Management */}
          <div
            onClick={() => navigate('/admin/collections')}
            className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-500 hover:shadow-[0_4px_16px_rgba(37,99,235,0.12)] active:scale-[0.98] active:border-blue-600 p-4 transition-all duration-200 flex items-center justify-between cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-700 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 group-hover:shadow-[0_4px_12px_rgba(37,99,235,0.3)] group-active:bg-blue-700 flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0">
                <Wallet size={18} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[#0B1F3A] group-hover:text-blue-700 transition-colors font-sans truncate">
                  Collection Management
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                  Daily demand &amp; cash closing
                </p>
              </div>
            </div>
            
            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 group-hover:bg-blue-600 group-hover:border-blue-600 group-active:bg-blue-700 flex items-center justify-center transition-all duration-200 shrink-0 ml-2">
              <ArrowRight size={13} className="text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* Shortcut 4: Branch Management */}
          <div
            onClick={() => navigate('/branches')}
            className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-500 hover:shadow-[0_4px_16px_rgba(37,99,235,0.12)] active:scale-[0.98] active:border-blue-600 p-4 transition-all duration-200 flex items-center justify-between cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-700 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 group-hover:shadow-[0_4px_12px_rgba(37,99,235,0.3)] group-active:bg-blue-700 flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0">
                <Building2 size={18} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[#0B1F3A] group-hover:text-blue-700 transition-colors font-sans truncate">
                  Branch Management
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                  Tamil Nadu operational network
                </p>
              </div>
            </div>
            
            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 group-hover:bg-blue-600 group-hover:border-blue-600 group-active:bg-blue-700 flex items-center justify-center transition-all duration-200 shrink-0 ml-2">
              <ArrowRight size={13} className="text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Smooth Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            type="button"
            title="Scroll smoothly back to top"
            aria-label="Scroll to top"
            className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-[#0B1F3A] hover:bg-[#15325b] text-[#F5D061] border border-[#D4AF37]/50 shadow-[0_8px_25px_rgba(11,31,58,0.4)] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group"
          >
            <ArrowUp size={20} className="group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default AdminDashboard;
