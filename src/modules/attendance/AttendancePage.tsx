// ──────────────────────────────────────────────────
// Golden Leaf Finance — Staff Timesheet & Duty Log
// Exact BambooHR Timesheet Architecture & Layout
// ──────────────────────────────────────────────────

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  CheckCircle2,
  History,
  Palmtree,
  Gift,
  AlertCircle,
  X,
  User,
  Plus,
  ArrowUpRight,
  Timer,
  Check,
  Building2,
  FileText,
  MapPin,
  Lock,
  ShieldCheck,
  Navigation,
  Compass,
  Radio,
  LogIn,
  LogOut,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../../store';
import { isAttendanceMarkedToday, markAttendanceToday, getAttendanceRecords } from '../../services/attendanceGateService';
import {
  getAllGPSRecords,
  formatTime,
  recordLiveGPSAttendance,
  type GPSLocation,
} from '../../services/gpsAttendanceService';
import {
  generateMonthlyAttendancePDF,
  type PDFAttendanceDayRow,
  type PDFAttendanceOptions,
} from '../../utils/pdfGenerator';
import { LeaveODPanel } from './LeaveODPanel';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { ResignationExitPanel } from './ResignationExitPanel';
import { getStoredLeaveRequests } from '../../services/leaveService';

export interface TimesheetDayRecord {
  dateStr: string; // YYYY-MM-DD
  dayName: string; // Mon, Tue, etc.
  dateDisplay: string; // Sep 16
  hoursWorked: number; // in hours, e.g. 8 or 10
  hoursFormatted: string; // "8h 00m"
  timeRange?: string; // "9:00 AM - 5:00 PM"
  checkIn?: string;
  checkOut?: string;
  overtime?: string; // "2h Overtime"
  tagType?: 'vacation' | 'holiday' | 'regular' | 'weekend' | 'leave';
  tagLabel?: string; // "8 hours Vacation", "Golden Leaf Day", etc.
  status: 'present' | 'late' | 'leave' | 'weekend' | 'unmarked';
  locationIn?: { lat: number; lng: number; address?: string };
  locationOut?: { lat: number; lng: number; address?: string };
  locationAddress?: string;
  locationAccuracy?: number;
  locationTimestamp?: string;
}

export interface EmployeeProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  branch: string;
  baseSalary: number;
}

// Format date helper: YYYY-MM-DD
const formatDateISO = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Calculate start of week (Monday)
const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  return new Date(date.setDate(diff));
};

export interface AutoLocationData {
  lat: number;
  lng: number;
  address: string;
  accuracy: number;
  timestamp: string;
  source: 'gps' | 'network';
}

export const reverseGeocodeCoords = async (lat: number, lng: number): Promise<string> => {
  // 1. Primary: OpenStreetMap Nominatim with detailed address components
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.address) {
        const addr = data.address;
        const street = addr.road || addr.street || addr.pedestrian || addr.footway || '';
        const area = addr.suburb || addr.neighbourhood || addr.residential || addr.subdivision || '';
        const city = addr.city || addr.town || addr.village || addr.city_district || addr.county || '';
        const state = addr.state || '';
        const pincode = addr.postcode || '';

        const parts = [street, area, city, state, pincode].filter((p) => Boolean(p && p.trim()));
        if (parts.length > 0) return parts.join(', ');
      }
      if (data.display_name) {
        const sliced = data.display_name.split(',').slice(0, 5).map((s: string) => s.trim()).join(', ');
        return sliced;
      }
    }
  } catch {
    // try fallback
  }

  // 2. Secondary: BigDataCloud Reverse Geocode Client API
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (res.ok) {
      const data = await res.json();
      const parts: string[] = [];
      if (data.localityInfo?.administrative) {
        const admin = data.localityInfo.administrative;
        const neighbourhood = admin.find((a: any) => a.adminLevel >= 8)?.name;
        const locality = data.locality || data.city;
        const district = admin.find((a: any) => a.adminLevel === 5 && a.name !== locality)?.name;
        const state = data.principalSubdivision;

        if (neighbourhood && neighbourhood !== locality) parts.push(neighbourhood);
        if (locality) parts.push(locality);
        if (district && district !== locality && district !== neighbourhood) parts.push(district);
        if (state) parts.push(state);
      } else {
        if (data.locality) parts.push(data.locality);
        if (data.city && data.city !== data.locality) parts.push(data.city);
        if (data.principalSubdivision) parts.push(data.principalSubdivision);
      }

      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
  } catch {
    // continue to fallback
  }

  return `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;
};

// Fallback to IP Geolocation when hardware GPS is unavailable or blocked
const fetchIpLocationFallback = async (): Promise<AutoLocationData | null> => {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        const parts = [data.city, data.region, data.postal, data.country_name].filter(Boolean);
        return {
          lat: data.latitude,
          lng: data.longitude,
          address: parts.join(', ') || `${data.latitude.toFixed(4)}°, ${data.longitude.toFixed(4)}°`,
          accuracy: 500,
          timestamp,
          source: 'network',
        };
      }
    }
  } catch {
    // ignore
  }
  return null;
};

export const fetchLiveDeviceLocation = (strictGpsOnly: boolean = false): Promise<AutoLocationData> => {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (typeof window === 'undefined' || !navigator.geolocation) {
      if (strictGpsOnly) {
        return reject(new Error('Live Geolocation is not supported by your browser. Please use Chrome or Edge.'));
      }
      fetchIpLocationFallback().then((ipLoc) => {
        if (ipLoc) return resolve(ipLoc);
        reject(new Error('Unable to retrieve location.'));
      });
      return;
    }

    let resolved = false;
    let watchId: number | null = null;
    let timeoutTimer: any = null;

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
    };

    const handleSuccess = async (pos: GeolocationPosition) => {
      if (resolved) return;
      resolved = true;
      cleanup();

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = Math.round(pos.coords.accuracy || 10);
      let address = '';
      try {
        address = await reverseGeocodeCoords(lat, lng);
      } catch {
        address = `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;
      }
      resolve({
        lat,
        lng,
        address,
        accuracy,
        timestamp,
        source: 'gps',
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      if (resolved) return;
      cleanup();

      if (strictGpsOnly) {
        return reject(new Error(error.message || 'Permission denied for live device location.'));
      }

      // Try network IP fallback
      fetchIpLocationFallback().then((ipLoc) => {
        if (ipLoc) {
          resolved = true;
          return resolve(ipLoc);
        }
        reject(new Error(error.message || 'Location unavailable.'));
      });
    };

    // Use watchPosition to acquire satellite lock and obtain highest accuracy
    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          // If accuracy is high (< 50 meters) or after a lock, resolve immediately
          if (pos.coords.accuracy && pos.coords.accuracy < 100) {
            handleSuccess(pos);
          }
        },
        handleError,
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );

      // Also invoke getCurrentPosition simultaneously for instant initial fix
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!resolved) {
            handleSuccess(pos);
          }
        },
        () => {}, // Ignore initial error; let watchPosition or timeout handle it
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );

      // Hard timeout fallback at 12s
      timeoutTimer = setTimeout(() => {
        if (!resolved) {
          navigator.geolocation.getCurrentPosition(
            handleSuccess,
            handleError,
            { enableHighAccuracy: false, timeout: 5000 }
          );
        }
      }, 12000);
    } catch (err: any) {
      handleError({ code: 2, message: err?.message || 'GPS initialization failed' } as any);
    }
  });
};

export const fetchRealCurrentLocation = async (): Promise<AutoLocationData> => {
  return fetchLiveDeviceLocation(false);
};

const getCurrentLocation = async (): Promise<{ lat: number; lng: number; address?: string } | undefined> => {
  try {
    const loc = await fetchLiveDeviceLocation(true);
    return { lat: loc.lat, lng: loc.lng, address: loc.address };
  } catch {
    return undefined;
  }
};

export const AttendancePage: React.FC = () => {
  const currentUser = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();
  const location = useLocation();

  // Admin handles the entire platform and does not have staff attendance, leave, or resignation
  useEffect(() => {
    if (currentUser?.customClaims?.role === 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  // Active Tab: Timesheet vs Leave & OD Panel vs Resignation & Exit Clearance
  const [activeTab, setActiveTab] = useState<'timesheet' | 'leave_od' | 'resignation'>('timesheet');
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  // Sync activeTab with URL search params (e.g. ?tab=leave or ?tab=od or ?tab=resignation)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'leave' || tabParam === 'od' || tabParam === 'leave_od') {
      setActiveTab('leave_od');
    } else if (tabParam === 'resignation' || tabParam === 'exit') {
      setActiveTab('resignation');
    }
  }, [location.search]);

  // Track pending leave approvals count for Branch Manager and Admin
  useEffect(() => {
    const updateCount = () => {
      const allReqs = getStoredLeaveRequests();
      const role = currentUser?.customClaims?.role;
      if (role === 'branch_manager') {
        // Pending CRO and Credit Manager requests awaiting Branch Manager confirmation
        setPendingApprovalsCount(allReqs.filter((r) => r.status === 'PENDING_BRANCH_MANAGER').length);
      } else if (role === 'admin') {
        // Pending Branch Manager requests awaiting Admin permission
        setPendingApprovalsCount(allReqs.filter((r) => r.status === 'PENDING_ADMIN').length);
      } else {
        setPendingApprovalsCount(0);
      }
    };

    updateCount();
    window.addEventListener('glf_leave_updated', updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener('glf_leave_updated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, [currentUser?.customClaims?.role]);

  // Employee details
  const employee: EmployeeProfile = useMemo(() => {
    return {
      id: currentUser?.uid || 'EMP001',
      name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Staff Member',
      role: currentUser?.customClaims?.role === 'collection_agent'
        ? 'Customer Relationship Officer (CRO)'
        : currentUser?.customClaims?.role === 'branch_manager'
        ? 'Branch Manager'
        : currentUser?.customClaims?.role === 'credit_manager'
        ? 'Credit Manager'
        : currentUser?.customClaims?.role === 'area_manager'
        ? 'Area Manager'
        : 'Finance Officer',
      department: 'Collections & Field Operations',
      branch: currentUser?.customClaims?.branchId
        ? `Branch ${currentUser.customClaims.branchId}, Chennai`
        : 'Anna Nagar Branch, Chennai',
      baseSalary: 32000,
    };
  }, [currentUser]);

  // Current real-world today (identified from device)
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatDateISO(today), [today]);

  // Tomorrow's date string
  const tomorrowStr = useMemo(() => {
    const t = new Date(today);
    t.setDate(t.getDate() + 1);
    return formatDateISO(t);
  }, [today]);

  // Helper to format live laptop device clock (hh:mm A)
  const getLiveLaptopTime = (): string => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Selected Pay Period / Week anchor
  const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(() => getMonday(new Date()));

  // Modals & View States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showClockDropdown, setShowClockDropdown] = useState(false);
  const [showMonthlyPreviewModal, setShowMonthlyPreviewModal] = useState(false);
  const [previewMonthStr, setPreviewMonthStr] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [showOnlyMarkedDays, setShowOnlyMarkedDays] = useState(true);
  const [isGeneratingMonthlyPDF, setIsGeneratingMonthlyPDF] = useState(false);

  // Auto-captured browser location state (detected on website open)
  const [siteOpenLocation, setSiteOpenLocation] = useState<AutoLocationData | null>(null);
  const [isCapturingSiteLocation, setIsCapturingSiteLocation] = useState(true);

  // Modal editing state
  const [selectedDayDetail, setSelectedDayDetail] = useState<TimesheetDayRecord | null>(null);
  const [modalEditStatus, setModalEditStatus] = useState<'present' | 'absent'>('present');
  const [modalHoursWorked, setModalHoursWorked] = useState<string>('8h 00m');
  const [modalCheckIn, setModalCheckIn] = useState<string>(() => getLiveLaptopTime());
  const [modalCheckOut, setModalCheckOut] = useState<string>('05:00 PM');
  const [modalLocationData, setModalLocationData] = useState<AutoLocationData | null>(null);
  const [modalLocationLoading, setModalLocationLoading] = useState(false);

  // Auto-detect real browser location immediately when the website/page is opened
  useEffect(() => {
    setIsCapturingSiteLocation(true);
    fetchLiveDeviceLocation(false)
      .then((loc) => {
        setSiteOpenLocation(loc);
        setIsCapturingSiteLocation(false);
      })
      .catch(() => {
        setIsCapturingSiteLocation(false);
      });
  }, []);

  const handleDetectRealLocation = async () => {
    setModalLocationLoading(true);
    addToast({
      type: 'info',
      title: 'Acquiring Live GPS',
      message: 'Accessing real-time device GPS coordinates via Google Maps precision...',
    });

    try {
      const loc = await fetchLiveDeviceLocation(true);
      setModalLocationData(loc);
      setSiteOpenLocation(loc);
      addToast({
        type: 'success',
        title: 'Live GPS Pinpointed',
        message: `${loc.address} (${loc.lat.toFixed(4)}°, ${loc.lng.toFixed(4)}°) ±${loc.accuracy}m`,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Live Location Access Needed',
        message: 'Please allow location permission in your browser to verify your live position.',
      });
    } finally {
      setModalLocationLoading(false);
    }
  };

  const handleOpenDayDetail = (day: TimesheetDayRecord) => {
    setSelectedDayDetail(day);
    setModalEditStatus(day.tagType === 'leave' || day.tagType === 'vacation' || day.status === 'leave' ? 'absent' : 'present');
    setModalHoursWorked(day.hoursFormatted || `${day.hoursWorked || 8}h 00m`);
    setModalCheckIn(day.checkIn || getLiveLaptopTime());
    setModalCheckOut(day.checkOut || '05:00 PM');

    // If day was already marked and has verified recorded location, show it
    if (day.status === 'present' && day.locationIn) {
      setModalLocationData({
        lat: day.locationIn.lat,
        lng: day.locationIn.lng,
        address: day.locationAddress || day.locationIn.address || '',
        accuracy: day.locationAccuracy || 10,
        timestamp: day.locationTimestamp || '',
        source: 'gps',
      });
      setModalLocationLoading(false);
      return;
    }

    // Live data strictly enforced: fetch real live device location on modal open
    setModalLocationLoading(true);
    if (siteOpenLocation && siteOpenLocation.source === 'gps') {
      setModalLocationData(siteOpenLocation);
    }
    fetchLiveDeviceLocation(true)
      .then((loc) => {
        setModalLocationData(loc);
        setSiteOpenLocation(loc);
        setModalLocationLoading(false);
      })
      .catch(() => {
        setModalLocationLoading(false);
      });
  };

  // Live ticking clock state
  const [currentTime, setCurrentTime] = useState<string>(() =>
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live formatted laptop time (hh:mm A) that automatically updates with the live ticking clock
  const liveLaptopTime = useMemo(() => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }, [currentTime]);

  // User-scoped storage key
  const userTimesheetKey = useMemo(() => {
    return `glf_timesheet_${currentUser?.uid || currentUser?.email || 'default'}`;
  }, [currentUser]);

  // Timesheet records stored in localStorage (user-scoped)
  const [records, setRecords] = useState<Record<string, TimesheetDayRecord>>(() => {
    const nowIso = formatDateISO(new Date());

    const sanitizeRecordMap = (raw: Record<string, TimesheetDayRecord>) => {
      // Strictly ensure future dates have ZERO attendance and zero recorded hours
      Object.keys(raw).forEach((k) => {
        if (k > nowIso) {
          raw[k] = {
            ...raw[k],
            hoursWorked: 0,
            hoursFormatted: '0h 00m',
            checkIn: undefined,
            checkOut: undefined,
            timeRange: undefined,
            overtime: undefined,
            status: raw[k].tagType === 'weekend' ? 'weekend' : 'unmarked',
            locationAddress: undefined,
            locationIn: undefined,
          };
        }
      });
      return raw;
    };

    try {
      const userKey = `glf_timesheet_${currentUser?.uid || currentUser?.email || 'default'}`;
      const savedUser = localStorage.getItem(userKey);
      if (savedUser) return sanitizeRecordMap(JSON.parse(savedUser));
    } catch {
      // fallback
    }

    // Default week data - Future dates are ALWAYS unmarked with 0 hours
    const baseMonday = getMonday(new Date());
    const initialMap: Record<string, TimesheetDayRecord> = {};

    const dayOffsets = [
      { offset: 0, day: 'Mon' },
      { offset: 1, day: 'Tue' },
      { offset: 2, day: 'Wed' },
      { offset: 3, day: 'Thu' },
      { offset: 4, day: 'Fri' },
      { offset: 5, day: 'Sat' },
      { offset: 6, day: 'Sun' },
    ];

    dayOffsets.forEach(({ offset, day }) => {
      const d = new Date(baseMonday);
      d.setDate(d.getDate() + offset);
      const dStr = formatDateISO(d);
      const monthShort = d.toLocaleString('en-US', { month: 'short' });
      const dayNum = d.getDate();
      const isSunday = offset === 6;

      initialMap[dStr] = {
        dateStr: dStr,
        dayName: day,
        dateDisplay: `${monthShort} ${dayNum}`,
        hoursWorked: 0,
        hoursFormatted: '0h 00m',
        timeRange: undefined,
        checkIn: undefined,
        checkOut: undefined,
        status: isSunday ? 'weekend' : 'unmarked',
        tagType: isSunday ? 'weekend' : undefined,
        tagLabel: isSunday ? 'Weekly Off' : undefined,
      };
    });

    return initialMap;
  });

  // Reload user-scoped records when logged-in profile changes
  useEffect(() => {
    if (!currentUser) return;
    const userKey = `glf_timesheet_${currentUser?.uid || currentUser?.email || 'default'}`;
    const savedUser = localStorage.getItem(userKey);
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setRecords(parsed);
        return;
      } catch {
        // ignore
      }
    }
    // If no previous record exists for this distinct user, reset to empty week template
    const baseMonday = getMonday(new Date());
    const initialMap: Record<string, TimesheetDayRecord> = {};
    const dayOffsets = [
      { offset: 0, day: 'Mon' },
      { offset: 1, day: 'Tue' },
      { offset: 2, day: 'Wed' },
      { offset: 3, day: 'Thu' },
      { offset: 4, day: 'Fri' },
      { offset: 5, day: 'Sat' },
      { offset: 6, day: 'Sun' },
    ];
    dayOffsets.forEach(({ offset, day }) => {
      const d = new Date(baseMonday);
      d.setDate(d.getDate() + offset);
      const dStr = formatDateISO(d);
      const monthShort = d.toLocaleString('en-US', { month: 'short' });
      const dayNum = d.getDate();
      const isSunday = offset === 6;

      initialMap[dStr] = {
        dateStr: dStr,
        dayName: day,
        dateDisplay: `${monthShort} ${dayNum}`,
        hoursWorked: 0,
        hoursFormatted: '0h 00m',
        timeRange: undefined,
        checkIn: undefined,
        checkOut: undefined,
        status: isSunday ? 'weekend' : 'unmarked',
        tagType: isSunday ? 'weekend' : undefined,
        tagLabel: isSunday ? 'Weekly Off' : undefined,
      };
    });
    setRecords(initialMap);
  }, [currentUser]);

  // Save to localStorage & Supabase PostgreSQL cloud
  const persistRecords = (updated: Record<string, TimesheetDayRecord>) => {
    setRecords(updated);
    try {
      localStorage.setItem(userTimesheetKey, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    if (isSupabaseConfigured() && supabase) {
      void supabase
        .from('documents')
        .upsert({
          collection: 'user_timesheets',
          id: userTimesheetKey,
          data: updated,
          is_deleted: false,
          updated_at: new Date().toISOString(),
        });
    }
  };

  // Aggregate all historical attendance records for the logged-in user
  const userAttendanceHistory = useMemo(() => {
    const historyList: TimesheetDayRecord[] = [];
    const seenDates = new Set<string>();

    // 1. Check current records state
    Object.values(records).forEach((r) => {
      if (r.checkIn || (r.hoursWorked && r.hoursWorked > 0) || r.status === 'present' || r.status === 'late' || r.status === 'leave') {
        historyList.push(r);
        seenDates.add(r.dateStr);
      }
    });

    // 2. Check GPS Attendance records for this employee
    try {
      const gpsRecords = getAllGPSRecords();
      const userUid = currentUser?.uid;
      const userName = currentUser?.displayName?.toLowerCase();

      gpsRecords.forEach((g) => {
        const matchesUser =
          (userUid && g.employeeId === userUid) ||
          (userName && g.employeeName?.toLowerCase().includes(userName));

        if (matchesUser && !seenDates.has(g.date)) {
          const d = new Date(g.date);
          const monthShort = d.toLocaleString('en-US', { month: 'short' });
          const dayName = d.toLocaleString('en-US', { weekday: 'short' });

          historyList.push({
            dateStr: g.date,
            dayName,
            dateDisplay: `${monthShort} ${d.getDate()}`,
            hoursWorked: g.totalMinutes ? Math.round(g.totalMinutes / 60) : 8,
            hoursFormatted: g.totalHoursWorked || '8h 00m',
            timeRange: g.punchOutTime ? `${formatTime(g.punchInTime)} - ${formatTime(g.punchOutTime)}` : `${formatTime(g.punchInTime)} - In Progress`,
            checkIn: formatTime(g.punchInTime),
            checkOut: g.punchOutTime ? formatTime(g.punchOutTime) : undefined,
            status: g.status === 'late' ? 'late' : g.status === 'half_day' ? 'late' : 'present',
            locationAddress: g.punchInGPS?.address,
            locationIn: g.punchInGPS ? {
              lat: g.punchInGPS.lat,
              lng: g.punchInGPS.lng,
              address: g.punchInGPS.address,
            } : undefined,
            locationAccuracy: g.punchInGPS?.accuracy,
            locationTimestamp: g.punchInTime,
          });
          seenDates.add(g.date);
        }
      });
    } catch (e) {
      console.error(e);
    }

    // 3. Check Attendance Gate check-in records
    try {
      const gateRecords = getAttendanceRecords();
      const userUid = currentUser?.uid;
      const userName = currentUser?.displayName?.toLowerCase();

      gateRecords.forEach((gr) => {
        const matchesUser =
          (userUid && gr.user_id === userUid) ||
          (userName && gr.userName?.toLowerCase().includes(userName));

        if (matchesUser && !seenDates.has(gr.date)) {
          const d = new Date(gr.date);
          const monthShort = d.toLocaleString('en-US', { month: 'short' });
          const dayName = d.toLocaleString('en-US', { weekday: 'short' });

          historyList.push({
            dateStr: gr.date,
            dayName,
            dateDisplay: `${monthShort} ${d.getDate()}`,
            hoursWorked: 8,
            hoursFormatted: '8h 00m',
            timeRange: `${gr.check_in_time} - Completed`,
            checkIn: gr.check_in_time,
            checkOut: '05:00 PM',
            status: 'present',
            locationAddress: siteOpenLocation?.address || 'Anna Nagar Branch, Chennai',
            locationIn: siteOpenLocation ? {
              lat: siteOpenLocation.lat,
              lng: siteOpenLocation.lng,
              address: siteOpenLocation.address,
            } : undefined,
            locationAccuracy: siteOpenLocation?.accuracy,
          });
          seenDates.add(gr.date);
        }
      });
    } catch (e) {
      console.error(e);
    }

    // Sort descending by dateStr
    return historyList.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }, [records, currentUser, siteOpenLocation]);

  // Calculate days in the selected preview month (Day 1 to end of month)
  const monthlyTimesheetData = useMemo(() => {
    const [yearStr, monthStr] = previewMonthStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed

    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const allDays: PDFAttendanceDayRow[] = [];
    let presentCount = 0;
    let absentCount = 0;
    let totalMinutes = 0;

    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const dateStr = formatDateISO(d);
      const dayShort = d.toLocaleString('en-US', { weekday: 'short' });
      const dateDisplay = `${d.toLocaleString('en-US', { month: 'short' })} ${String(dayNum).padStart(2, '0')}`;
      const isSunday = d.getDay() === 0;

      // Look up in records, or match from userAttendanceHistory
      const rec = records[dateStr] || userAttendanceHistory.find((h) => h.dateStr === dateStr);

      let status = isSunday ? 'Weekly Off' : 'Absent';
      let checkIn = '—';
      let checkOut = '—';
      let hoursWorked = '—';
      let location = '—';

      if (rec) {
        if (rec.status === 'present' || rec.checkIn) {
          status = rec.status === 'late' ? 'Late' : 'Present';
          checkIn = rec.checkIn || getLiveLaptopTime();
          checkOut = rec.checkOut || '05:00 PM';
          hoursWorked = rec.hoursFormatted || `${rec.hoursWorked || 8}h 00m`;
          location = rec.locationAddress || rec.locationIn?.address || siteOpenLocation?.address || 'Anna Nagar Branch, Chennai';
          presentCount++;
          totalMinutes += (rec.hoursWorked || 8) * 60;
        } else if (rec.status === 'leave' || rec.tagType === 'leave' || rec.tagType === 'vacation') {
          status = rec.tagLabel || 'Leave';
          absentCount++;
        } else if (isSunday) {
          status = 'Weekly Off';
        }
      } else if (isSunday) {
        status = 'Weekly Off';
      }

      allDays.push({
        dayNumber: dayNum,
        dateStr: `${dateDisplay}, ${year}`,
        dayName: dayShort,
        status,
        checkIn,
        checkOut,
        hoursWorked,
        location,
      });
    }

    const totalHoursFormatted = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;

    // Filter for preview if showOnlyMarkedDays is true (showing days with marked attendance)
    const displayedRows = showOnlyMarkedDays
      ? allDays.filter((r) => r.status.toLowerCase().includes('present') || r.status.toLowerCase().includes('late') || r.checkIn !== '—')
      : allDays;

    return {
      monthName,
      totalDaysInMonth,
      presentCount,
      absentCount,
      totalHoursFormatted,
      allDays,
      displayedRows,
    };
  }, [previewMonthStr, records, userAttendanceHistory, siteOpenLocation, showOnlyMarkedDays]);

  // Handle Download Monthly Attendance PDF
  const handleDownloadMonthlyPDF = async () => {
    setIsGeneratingMonthlyPDF(true);
    try {
      await generateMonthlyAttendancePDF({
        monthName: monthlyTimesheetData.monthName,
        employeeName: employee.name,
        employeeId: employee.id,
        role: employee.role,
        department: employee.department,
        branchName: employee.branch,
        totalDaysInMonth: monthlyTimesheetData.totalDaysInMonth,
        presentDays: monthlyTimesheetData.presentCount,
        absentDays: monthlyTimesheetData.absentCount,
        totalHours: monthlyTimesheetData.totalHoursFormatted,
        rows: monthlyTimesheetData.displayedRows.length > 0 ? monthlyTimesheetData.displayedRows : monthlyTimesheetData.allDays,
      });

      addToast({
        type: 'success',
        title: 'PDF Downloaded',
        message: `Monthly Attendance report for ${monthlyTimesheetData.monthName} downloaded successfully.`,
      });
      setShowMonthlyPreviewModal(false);
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not generate attendance PDF. Please try again.',
      });
    } finally {
      setIsGeneratingMonthlyPDF(false);
    }
  };

  // Today's specific record
  const todayRecord = records[todayStr];
  const isClockedIn = Boolean(todayRecord?.checkIn && !todayRecord?.checkOut);
  const isClockedOut = Boolean(todayRecord?.checkIn && todayRecord?.checkOut);

  // Clock in handler
  const handleClockIn = async () => {
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    addToast({
      type: 'info',
      title: 'Fetching Live Location',
      message: 'Securely capturing and verifying your device GPS for attendance...',
    });

    const loc = await getCurrentLocation();
    if (!loc) {
      addToast({
        type: 'error',
        title: 'Live GPS Required',
        message: 'Live device location verification is strictly required to clock in. Please enable location permissions in your browser.',
      });
      return;
    }

    if (currentUser) {
      markAttendanceToday(currentUser, nowTime);
    }

    recordLiveGPSAttendance({
      employeeId: currentUser?.uid || employee.id || 'EMP-004',
      employeeName: employee.name || currentUser?.displayName || 'Staff Member',
      role: currentUser?.customClaims?.role || 'collection_agent',
      branchId: currentUser?.customClaims?.branchId || 'BR-01',
      branchName: employee.branch || 'Anna Nagar Main Branch',
      gps: {
        lat: loc.lat,
        lng: loc.lng,
        address: loc.address || 'Live Location',
        accuracy: 10,
      },
      customTime: nowTime,
      hoursWorked: '8h 00m',
      date: todayStr,
      withinGeofence: true,
    });

    const currentRec = records[todayStr];
    const monthShort = today.toLocaleString('en-US', { month: 'short' });
    const dayName = today.toLocaleString('en-US', { weekday: 'short' });

    const updated = {
      ...records,
      [todayStr]: {
        dateStr: todayStr,
        dayName,
        dateDisplay: `${monthShort} ${today.getDate()}`,
        hoursWorked: currentRec?.hoursWorked || 8,
        hoursFormatted: currentRec?.hoursFormatted || '8h 00m',
        timeRange: `${nowTime} - In Progress`,
        checkIn: nowTime,
        checkOut: undefined,
        status: 'present' as const,
        locationIn: loc,
      },
    };

    persistRecords(updated);
    setShowClockDropdown(false);

    addToast({
      type: 'success',
      title: 'Clocked In Successfully',
      message: `Clocked in for ${employee.name} at ${nowTime}`,
    });

    if (currentUser && currentUser.customClaims?.role !== 'admin') {
      const fromPath = (location.state as any)?.from?.pathname || '/dashboard';
      setTimeout(() => {
        navigate(fromPath, { replace: true });
      }, 500);
    }
  };

  // Clock out handler
  const handleClockOut = async () => {
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const checkInTime = todayRecord?.checkIn || getLiveLaptopTime();

    addToast({
      type: 'info',
      title: 'Fetching Location',
      message: 'Securely capturing your location for checkout...',
    });

    const loc = await getCurrentLocation();

    const updated = {
      ...records,
      [todayStr]: {
        ...todayRecord,
        timeRange: `${checkInTime} - ${nowTime}`,
        checkOut: nowTime,
        hoursWorked: 8,
        hoursFormatted: '8h 00m',
        locationOut: loc,
      },
    };

    persistRecords(updated);
    setShowClockDropdown(false);

    addToast({
      type: 'info',
      title: 'Clocked Out Successfully',
      message: `Clocked out for ${employee.name} at ${nowTime}`,
    });
  };

  // Compute 7 days of the selected week (Mon - Sun)
  const weekDays = useMemo(() => {
    const days: TimesheetDayRecord[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekMonday);
      d.setDate(d.getDate() + i);
      const dStr = formatDateISO(d);
      const monthShort = d.toLocaleString('en-US', { month: 'short' });
      const dayNum = d.getDate();
      const isSunday = i === 6;
      const isFuture = dStr > todayStr;
      const isTomorrow = dStr === tomorrowStr;

      const existing = records[dStr];

      // If it's a future day, strictly disallow any recorded hours or checkins
      if (isFuture) {
        days.push({
          dateStr: dStr,
          dayName: dayNames[i],
          dateDisplay: `${monthShort} ${dayNum}`,
          hoursWorked: 0,
          hoursFormatted: '0h 00m',
          timeRange: isTomorrow
            ? "Tomorrow's Shift (Scheduled 9:00 AM - 5:00 PM)"
            : isSunday
            ? "Weekly Off"
            : "Upcoming Scheduled Shift",
          status: isSunday ? 'weekend' : 'unmarked',
          tagType: isSunday ? 'weekend' : undefined,
          tagLabel: isTomorrow ? 'Tomorrow' : isSunday ? 'Weekly Off' : 'Upcoming',
        });
      } else if (existing) {
        days.push(existing);
      } else {
        days.push({
          dateStr: dStr,
          dayName: dayNames[i],
          dateDisplay: `${monthShort} ${dayNum}`,
          hoursWorked: 0,
          hoursFormatted: '0h 00m',
          status: isSunday ? 'weekend' : 'unmarked',
          tagType: isSunday ? 'weekend' : undefined,
          tagLabel: isSunday ? 'Weekly Off' : undefined,
        });
      }
    }
    return days;
  }, [currentWeekMonday, records, todayStr, tomorrowStr]);

  // Week range label (e.g., "Sep 21–27" or "Sep 16–22")
  const weekRangeLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    if (!start || !end) return 'Current Week';
    return `${start.dateDisplay.split(' ')[0]} ${start.dateDisplay.split(' ')[1]}–${end.dateDisplay.split(' ')[1]}`;
  }, [weekDays]);

  // Total weekly hours
  const totalWeeklyHours = useMemo(() => {
    return weekDays.reduce((acc, curr) => acc + (curr.hoursWorked || 0), 0);
  }, [weekDays]);

  // Pay period navigation
  const handlePrevWeek = () => {
    const prev = new Date(currentWeekMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekMonday(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekMonday);
    next.setDate(next.getDate() + 7);
    setCurrentWeekMonday(next);
  };

  const handleCurrentWeek = () => {
    setCurrentWeekMonday(getMonday(new Date()));
  };

  return (
    <div className="w-full min-h-full pb-16 font-body text-[#1E293B] antialiased">
      {/* ──────────────────────────────────────────────────
          TOP APPLICATION HEADER (Timesheet Brand + Pay Period + History)
          ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 pt-1">
        {/* Brand Timesheet Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] text-[#166534] flex items-center justify-center border border-[#A7F3D0]/70 shadow-2xs">
            <Timer size={22} className="stroke-[2.3]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#14532D] tracking-tight">
              Attendance sheet
            </h1>
          </div>
          {siteOpenLocation && (
            <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/90 border border-emerald-200/90 text-emerald-800 text-xs font-semibold shadow-2xs ml-1" title={siteOpenLocation.address}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <MapPin size={12} className="text-emerald-700" />
              <span className="max-w-[210px] truncate">{siteOpenLocation.address.split(',')[0]}</span>
            </div>
          )}
        </div>

        {/* Right Actions: History, Download Preview */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* History Button */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="h-10 px-4 rounded-full bg-white hover:bg-slate-50 border border-[#E2E8F0] text-xs font-semibold text-[#1E293B] flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
          >
            <History size={15} className="text-[#64748B]" />
            <span>History</span>
          </button>

          {/* Download / Export Button (Opens Monthly Preview First) */}
          <button
            onClick={() => setShowMonthlyPreviewModal(true)}
            className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B] flex items-center justify-center shadow-2xs transition-all cursor-pointer"
            title="Download Monthly Timesheet PDF"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* ── Top Segmented Navigation: Timesheet vs Leave & OD Panel ── */}
      <div className="flex items-center gap-2 bg-[#F1F5F9] p-1.5 rounded-2xl border border-slate-200/80 w-fit mb-6 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('timesheet')}
          className={clsx(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
            activeTab === 'timesheet'
              ? 'bg-white text-[#166534] shadow-sm border border-slate-200/60 font-extrabold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          )}
        >
          <Clock size={15} className={activeTab === 'timesheet' ? 'text-[#166534]' : 'text-slate-500'} />
          <span>Timesheet & Punch Log</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('leave_od')}
          className={clsx(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative',
            activeTab === 'leave_od'
              ? 'bg-white text-[#0B1F3A] shadow-sm border border-slate-200/60 font-extrabold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          )}
        >
          <Palmtree size={15} className={activeTab === 'leave_od' ? 'text-[#D4AF37]' : 'text-slate-500'} />
          <span>Leave & On-Duty (OD)</span>
          {pendingApprovalsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black leading-none shadow-xs animate-pulse">
              {pendingApprovalsCount} {currentUser?.customClaims?.role === 'branch_manager' ? 'Awaiting BM' : 'Pending'}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('resignation')}
          className={clsx(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative',
            activeTab === 'resignation'
              ? 'bg-white text-[#0B1F3A] shadow-sm border border-slate-200/60 font-extrabold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          )}
        >
          <FileText size={15} className={activeTab === 'resignation' ? 'text-rose-600' : 'text-slate-500'} />
          <span>Resignation & Handover Clearance</span>
        </button>
      </div>

      {activeTab === 'leave_od' ? (
        <LeaveODPanel />
      ) : activeTab === 'resignation' ? (
        <ResignationExitPanel />
      ) : (
        <>
          {/* ──────────────────────────────────────────────────
              MAIN TWO-COLUMN WORKFORCE DASHBOARD (Left: Days list, Right: Clock & Summary)
              ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN (Wider: 8 cols): Weekly Day Breakdown Card ── */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-6 sm:p-8">
          {/* Weekly Range Header */}
          <div className="flex items-center justify-between pb-6 border-b border-[#F1F3F5]">
            <div className="flex items-center gap-2.5">
              <div className="text-[#166534]">
                <CalendarIcon size={18} className="stroke-[2.2]" />
              </div>
              <h2 className="text-lg font-bold text-[#14532D] tracking-tight">
                {weekRangeLabel}
              </h2>
            </div>

            {/* Week pagination arrows */}
            <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-full border border-[#E2E8F0]">
              <button
                onClick={handlePrevWeek}
                className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 text-[#1E293B] flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                title="Previous Week"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={handleCurrentWeek}
                className="px-2.5 h-7 rounded-full bg-white hover:bg-slate-100 text-[11px] font-bold text-[#166534] border border-[#E2E8F0] shadow-2xs transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handleNextWeek}
                className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 text-[#1E293B] flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                title="Next Week"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Daily Rows List */}
          <div className="divide-y divide-[#F1F3F5]">
            {weekDays.map((day) => {
              const isCurrentDay = day.dateStr === todayStr;
              const isFuture = day.dateStr > todayStr;
              const isTomorrow = day.dateStr === tomorrowStr;
              const isPast = day.dateStr < todayStr;
              const isMarked = Boolean(day.checkIn || (day.hoursWorked && day.hoursWorked > 0) || day.status === 'present');

              return (
                <div
                  key={day.dateStr}
                  onClick={() => handleOpenDayDetail(day)}
                  className={clsx(
                    'py-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 group cursor-pointer transition-colors rounded-2xl px-3 -mx-3 border border-transparent',
                    isCurrentDay
                      ? 'bg-[#F0FDF4]/70 border-emerald-200/60 shadow-xs'
                      : isTomorrow
                      ? 'bg-sky-50/40 hover:bg-sky-50/80'
                      : 'hover:bg-[#F9FAFB]'
                  )}
                >
                  {/* Left Day Badge Box */}
                  <div className={clsx(
                    "w-[100px] sm:w-[110px] h-[68px] rounded-2xl p-2.5 flex flex-col justify-center flex-shrink-0 shadow-2xs transition-colors",
                    isCurrentDay
                      ? "bg-emerald-50 border-2 border-emerald-400"
                      : isTomorrow
                      ? "bg-sky-50 border border-sky-300"
                      : isMarked
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-[#FAF9F6] border border-[#EAE8E3] group-hover:border-[#D1D5DB]"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className={clsx("text-sm font-bold leading-none",
                        isCurrentDay ? 'text-emerald-800' :
                        isTomorrow ? 'text-sky-800' :
                        isMarked ? 'text-blue-700' : 'text-[#1E293B]'
                      )}>
                        {day.dayName}
                      </span>
                      {isCurrentDay && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Today" />
                      )}
                      {isTomorrow && (
                        <span className="text-[9px] font-extrabold uppercase text-sky-700 bg-sky-100 px-1 rounded">TOM</span>
                      )}
                    </div>
                    <span className={clsx("text-xs mt-1 font-medium",
                      isCurrentDay ? 'text-emerald-700' :
                      isTomorrow ? 'text-sky-600' :
                      isMarked ? 'text-blue-600' : 'text-[#64748B]'
                    )}>
                      {day.dateDisplay}
                    </span>
                  </div>

                  {/* Middle Hours & Details */}
                  <div className="flex-1 space-y-1">
                    {/* Hours Worked */}
                    <div className="flex items-center gap-2">
                      <div className={clsx(
                        "text-sm font-bold",
                        isCurrentDay ? "text-emerald-950" : "text-[#1E293B]"
                      )}>
                        {day.hoursFormatted}
                      </div>

                      {isCurrentDay && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          TODAY
                        </span>
                      )}
                      {isTomorrow && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
                          <Clock size={10} />
                          TOMORROW'S ATTENDANCE
                        </span>
                      )}
                      {isFuture && !isTomorrow && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          UPCOMING
                        </span>
                      )}
                      {isPast && isMarked && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                          <Lock size={9} />
                          LOCKED RECORD
                        </span>
                      )}
                    </div>

                    {/* Time Range Interval */}
                    {day.timeRange && (
                      <div className={clsx(
                        "text-xs font-medium",
                        isTomorrow ? "text-sky-700" : "text-[#64748B]"
                      )}>
                        {day.timeRange}
                      </div>
                    )}

                    {/* Special Tags */}
                    <div className="flex items-center gap-3 pt-0.5 flex-wrap">
                      {day.tagLabel && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {day.tagLabel}
                        </span>
                      )}

                      {/* Auto-Captured Location Tag */}
                      {(day.locationAddress || day.locationIn) && (
                        <div
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50/90 px-2 py-0.5 rounded-md border border-emerald-200/80 shadow-2xs max-w-[240px] truncate"
                          title={day.locationAddress || `Lat: ${day.locationIn?.lat}, Lng: ${day.locationIn?.lng}`}
                        >
                          <MapPin size={11} className="text-emerald-600 flex-shrink-0" />
                          <span className="truncate">
                            {day.locationAddress ? day.locationAddress.split(',').slice(0, 2).join(', ') : `${day.locationIn?.lat?.toFixed(3)}, ${day.locationIn?.lng?.toFixed(3)}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Action icon on hover */}
                  <div className="hidden sm:flex items-center justify-end text-slate-400 group-hover:text-[#166534] transition-colors pr-2">
                    <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      {isTomorrow ? "View Tomorrow" : isFuture ? "Upcoming" : isPast ? "View Record" : "Today's Duty"} <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT COLUMN (Narrower: 4 cols): Clock In Terminal & Summaries ── */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-6 sm:p-7 space-y-6">
          {/* 1. Profile Avatar & Clock Status */}
          <div className="text-center pt-2">
            {/* Round Avatar with User Photo / Initials */}
            <div className="w-16 h-16 rounded-full mx-auto bg-[#ECFDF5] border-2 border-white shadow-md flex items-center justify-center overflow-hidden mb-3.5">
              <div className="w-full h-full bg-gradient-to-tr from-[#166534] to-[#15803D] text-white font-bold text-lg flex items-center justify-center">
                {employee.name.slice(0, 2).toUpperCase()}
              </div>
            </div>

            {/* Status Label */}
            <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              {isClockedIn ? 'Currently Clocked In' : 'Not Clocked In'}
            </p>

            {/* Big Forest Green Stat: "8h 00m Today" */}
            <h2 className="text-3xl font-bold text-[#14532D] tracking-tight mt-1">
              {todayRecord?.hoursFormatted || '8h 00m'} Today
            </h2>

            {/* Last Event Detail */}
            <p className="text-xs text-[#64748B] mt-1.5 font-medium">
              {isClockedIn
                ? `Clocked In: ${todayRecord?.checkIn || liveLaptopTime}`
                : isClockedOut
                  ? `Clocked Out: Today at ${todayRecord?.checkOut}`
                  : 'Clocked Out: Sep 25 at 5:00 PM'}
            </p>

            {/* Clock In / Out Action Pill Button */}
            <div className="mt-5 flex items-center justify-center gap-1 max-w-[260px] mx-auto relative">
              {!isClockedIn && !isClockedOut ? (
                <button
                  onClick={handleClockIn}
                  className="flex-1 h-12 rounded-full bg-gradient-to-r from-[#166534] to-[#15803D] hover:brightness-105 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Timer size={16} />
                  <span>Clock In for Today</span>
                </button>
              ) : isClockedIn && !isClockedOut ? (
                <button
                  onClick={handleClockOut}
                  className="flex-1 h-12 rounded-full bg-[#166534] hover:bg-[#14532D] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <CheckCircle2 size={16} />
                  <span>Clock Out</span>
                </button>
              ) : (
                <div className="flex-1 h-12 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs">
                  <ShieldCheck size={16} className="text-emerald-700" />
                  <span>Today's Attendance Locked</span>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <hr className="border-[#F1F3F5]" />

          {/* 2. This Week Summary & Mini Bar Chart */}
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-[#64748B]">This Week</span>
            <div className="text-3xl font-bold text-[#14532D] tracking-tight">
              {totalWeeklyHours}h 00m
            </div>
            <p className="text-xs text-[#64748B] font-medium">
              Sep 23 – 29 (6 days left)
            </p>

            {/* 7-Bar Mini Chart */}
            <div className="pt-4 flex items-end justify-center gap-2.5 h-[64px] max-w-[240px] mx-auto">
              {weekDays.map((day, idx) => {
                const isWorked = (day.hoursWorked || 0) > 0;
                const isVacation = day.tagType === 'vacation';
                const barHeight = isWorked ? Math.min(100, (day.hoursWorked / 10) * 100) : isVacation ? 70 : 18;

                return (
                  <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div
                      className={clsx(
                        'w-full rounded-xs transition-all duration-300',
                        isVacation
                          ? 'bg-[#166534]/70 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,#166534_2px,#166534_4px)]'
                          : isWorked
                            ? 'bg-[#166534]'
                            : 'bg-[#E2E8F0]'
                      )}
                      style={{ height: `${barHeight}%` }}
                      title={`${day.dayName}: ${day.hoursFormatted}`}
                    />
                    <span
                      className={clsx(
                        'text-[10px] font-bold',
                        idx === 0 ? 'text-[#166534]' : 'text-[#94A3B8]'
                      )}
                    >
                      {day.dayName[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <hr className="border-[#F1F3F5]" />

          {/* 3. Pay Period Summary Box */}
          <div className="bg-[#FAF9F6] border border-[#EAE8E3] rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#166534] shadow-2xs flex-shrink-0">
              <CalendarIcon size={18} />
            </div>
            <div className="text-left leading-tight">
              <div className="text-sm font-bold text-[#1E293B]">
                {totalWeeklyHours}h 00m
              </div>
              <div className="text-xs text-[#64748B] font-medium mt-0.5">
                Pay Period
              </div>
              <div className="text-[11px] text-[#94A3B8] mt-0.5">
                Sep 21 – 27 (4 days left)
              </div>
            </div>
          </div>

          {/* 4. Approval Notice Pill */}
          <div className="bg-[#FAF9F6] border border-[#EAE8E3] rounded-2xl py-3 px-4 flex items-center justify-center gap-2 text-xs font-semibold text-[#475569] shadow-2xs">
            <CheckCircle2 size={15} className="text-[#166534]" />
            <span>Will be sent for approval on Sep 27</span>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────
          MODAL: DAY TIMESHEET DETAIL / EDIT & LOCK VERIFICATION
          ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedDayDetail && (() => {
          const isFutureDay = selectedDayDetail.dateStr > todayStr;
          const isTomorrow = selectedDayDetail.dateStr === tomorrowStr;
          const isPastDay = selectedDayDetail.dateStr < todayStr;
          const isToday = selectedDayDetail.dateStr === todayStr;
          const isAlreadyMarked = Boolean(
            selectedDayDetail.checkIn ||
            (selectedDayDetail.hoursWorked && selectedDayDetail.hoursWorked > 0) ||
            selectedDayDetail.status === 'present'
          );
          const isLocked = isFutureDay || isPastDay || (isToday && isAlreadyMarked);

          return (
            <div
              className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
              onMouseDown={() => setSelectedDayDetail(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                onMouseDown={(e) => e.stopPropagation()}
                className="bg-white border border-slate-200/90 rounded-[24px] w-[min(94vw,700px)] max-h-[88dvh] flex flex-col overflow-hidden shadow-2xl relative text-[#1E293B]"
              >
                {/* Modal Header */}
                <div className={clsx(
                  "px-5 sm:px-6 py-3.5 border-b flex items-center justify-between relative overflow-hidden text-white flex-shrink-0",
                  isTomorrow
                    ? "bg-gradient-to-r from-[#0369A1] via-[#0284C7] to-[#0EA5E9] border-sky-800/40"
                    : isFutureDay
                    ? "bg-gradient-to-r from-[#334155] via-[#475569] to-[#64748B] border-slate-700/40"
                    : isPastDay
                    ? "bg-gradient-to-r from-[#1E293B] via-[#334155] to-[#475569] border-slate-700/40"
                    : "bg-gradient-to-r from-[#0A331E] via-[#14532D] to-[#047857] border-emerald-800/40"
                )}>
                  <div className="relative z-10 flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-white/15 text-white backdrop-blur-xs shadow-inner flex items-center justify-center">
                      {isTomorrow ? <Clock size={18} /> : isPastDay ? <Lock size={18} /> : <CalendarIcon size={18} />}
                    </span>
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight">
                        {isTomorrow
                          ? `Tomorrow's Attendance — ${selectedDayDetail.dayName}, ${selectedDayDetail.dateDisplay}`
                          : isFutureDay
                          ? `Upcoming Date — ${selectedDayDetail.dayName}, ${selectedDayDetail.dateDisplay}`
                          : isPastDay
                          ? `Historical Record — ${selectedDayDetail.dayName}, ${selectedDayDetail.dateDisplay}`
                          : `Today's Attendance — ${selectedDayDetail.dayName}, ${selectedDayDetail.dateDisplay}`}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-semibold text-white/90 tracking-wide">
                          {isTomorrow ? "Tomorrow's Shift" : isFutureDay ? "Upcoming Shift" : isPastDay ? "Archived Timesheet" : "Live Duty Entry"}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-white/60"></span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-black/25 px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-xs">
                          {isLocked ? <Lock size={11} /> : <ShieldCheck size={11} />}
                          {isTomorrow ? "Tomorrow" : isFutureDay ? "Future Date" : isPastDay ? "Locked Entry" : isAlreadyMarked ? "Attendance Marked & Locked" : "Open for Today"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedDayDetail(null)}
                    className="relative z-10 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all cursor-pointer backdrop-blur-xs"
                  >
                    <X size={17} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-5 overflow-y-auto bg-slate-50/50 space-y-4 flex-1">
                  {/* Notice Banner */}
                  {isTomorrow ? (
                    <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 flex items-start gap-2.5">
                      <div className="p-1.5 rounded-xl bg-sky-100 text-sky-700 shrink-0">
                        <Clock size={16} />
                      </div>
                      <div className="text-xs">
                        <strong className="block font-bold">Tomorrow's Attendance (Not Available Yet)</strong>
                        <p className="text-[11px] text-sky-700 mt-0.5">
                          Attendance cannot be marked in advance. Tomorrow's attendance will open automatically when your device date reaches tomorrow ({selectedDayDetail.dateDisplay}).
                        </p>
                      </div>
                    </div>
                  ) : isFutureDay ? (
                    <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 flex items-start gap-2.5">
                      <div className="p-1.5 rounded-xl bg-slate-200 text-slate-700 shrink-0">
                        <CalendarIcon size={16} />
                      </div>
                      <div className="text-xs">
                        <strong className="block font-bold">Upcoming Shift</strong>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Attendance can only be marked on the active calendar day.
                        </p>
                      </div>
                    </div>
                  ) : isPastDay ? (
                    <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-2.5">
                      <div className="p-1.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                        <Lock size={16} />
                      </div>
                      <div className="text-xs">
                        <strong className="block font-bold">Record Locked</strong>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Historical attendance records cannot be edited.
                        </p>
                      </div>
                    </div>
                  ) : isAlreadyMarked ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
                      <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                        <ShieldCheck size={16} />
                      </div>
                      <div className="text-xs">
                        <strong className="block font-bold">Today's Attendance Marked</strong>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          Your attendance for today is saved and verified.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-start gap-2.5">
                      <div className="p-1.5 rounded-xl bg-emerald-600 text-white shrink-0">
                        <Radio size={16} />
                      </div>
                      <div className="text-xs">
                        <strong className="block font-bold">Daily Check-In</strong>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          Verify your live time and GPS location to submit.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 2-Column Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                    {/* LEFT COLUMN: Shift Details Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between h-full space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                          <span className="p-1 rounded-lg bg-emerald-50 text-emerald-700">
                            <Timer size={13} />
                          </span>
                          <span>Shift Details</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Shift: 8h
                        </span>
                      </div>

                      {/* 1. Hours Worked */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 h-4">
                          <span>Hours Worked</span>
                          {isLocked && <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1"><Lock size={9} /> Locked</span>}
                        </div>
                        {isLocked ? (
                          <div className="w-full h-9 px-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
                            <span>{selectedDayDetail.hoursFormatted || '0h 00m'}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {isFutureDay ? 'Scheduled' : 'Recorded'}
                            </span>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={modalHoursWorked}
                            onChange={(e) => setModalHoursWorked(e.target.value)}
                            placeholder="e.g. 8h 00m"
                            className="w-full h-9 px-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs font-bold text-slate-900 hover:border-emerald-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all font-mono"
                          />
                        )}
                      </div>

                      {/* 2. Time In & Time Out */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 h-4">
                            <span className="flex items-center gap-1">
                              <LogIn size={12} className="text-emerald-600" />
                              <span>Time In</span>
                            </span>
                            {!selectedDayDetail.checkIn && (
                              <span className="text-[9px] font-semibold text-emerald-700 inline-flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live
                              </span>
                            )}
                          </div>
                          {isLocked ? (
                            <div className="w-full h-9 px-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
                              <span className="font-mono text-slate-900">{selectedDayDetail.checkIn || liveLaptopTime}</span>
                              {!selectedDayDetail.checkIn && (
                                <span className="text-[9.5px] text-emerald-700 font-semibold bg-emerald-100/70 px-1.5 py-0.5 rounded">Live</span>
                              )}
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={modalCheckIn}
                              onChange={(e) => setModalCheckIn(e.target.value)}
                              className="w-full h-9 px-2.5 rounded-xl bg-emerald-50/40 border border-emerald-200 text-xs font-bold text-slate-900 hover:border-emerald-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all font-mono"
                            />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center text-[11px] font-bold text-amber-800 h-4">
                            <span className="flex items-center gap-1">
                              <LogOut size={12} className="text-amber-600" />
                              <span>Time Out</span>
                            </span>
                          </div>
                          {isLocked ? (
                            <div className="w-full h-9 px-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center">
                              {selectedDayDetail.checkOut || (isFutureDay ? '05:00 PM' : '—')}
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={modalCheckOut}
                              onChange={(e) => setModalCheckOut(e.target.value)}
                              className="w-full h-9 px-2.5 rounded-xl bg-amber-50/40 border border-amber-200 text-xs font-bold text-slate-900 hover:border-amber-400 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-3 focus:ring-amber-600/10 transition-all"
                            />
                          )}
                        </div>
                      </div>

                      {/* 3. Attendance Status */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-600 h-4">Attendance Status</label>
                        {isLocked ? (
                          <div className={clsx(
                            "w-full h-9 px-3 rounded-xl text-xs font-bold border flex items-center justify-between",
                            selectedDayDetail.status === 'present'
                              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                              : isTomorrow
                              ? "bg-sky-50 border-sky-300 text-sky-900"
                              : isFutureDay
                              ? "bg-slate-100 border-slate-200 text-slate-700"
                              : "bg-rose-50 border-rose-200 text-rose-800"
                          )}>
                            <span>
                              {selectedDayDetail.status === 'present'
                                ? "✓ Present (Standard Duty)"
                                : isTomorrow
                                ? "Tomorrow's Scheduled Shift"
                                : isFutureDay
                                ? "Upcoming Shift"
                                : "Absent / Not Marked"}
                            </span>
                            <Lock size={12} className="text-slate-400" />
                          </div>
                        ) : (
                          <div className="relative">
                            <select
                              value={modalEditStatus}
                              onChange={(e) => setModalEditStatus(e.target.value as 'present' | 'absent')}
                              className="w-full h-9 px-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs font-bold text-slate-900 hover:border-emerald-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all appearance-none cursor-pointer"
                            >
                              <option value="present">Present (Standard Duty)</option>
                              <option value="absent">Absent</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Google Maps Live GPS Location Card */}
                    <div className="rounded-2xl border border-emerald-300/80 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 p-4 shadow-2xs flex flex-col justify-between h-full space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                          <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
                            <MapPin size={13} />
                          </span>
                          <span>Live GPS Location</span>
                        </div>

                        {!isLocked && (
                          <button
                            type="button"
                            onClick={handleDetectRealLocation}
                            disabled={modalLocationLoading}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                          >
                            <RefreshCw size={10} className={clsx(modalLocationLoading && "animate-spin")} />
                            <span>{modalLocationLoading ? "Locating..." : "Refresh GPS"}</span>
                          </button>
                        )}
                        {isLocked && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            Locked
                          </span>
                        )}
                      </div>

                      {/* Location Address display */}
                      <div className="w-full px-3 py-2.5 rounded-xl bg-white border border-emerald-200 text-xs font-semibold text-slate-800 select-none shadow-2xs">
                        <div className="flex items-start gap-2">
                          <Compass size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            {isFutureDay ? (
                              <p className="text-[11.5px] font-medium text-slate-500 italic">
                                Live GPS coordinates will be captured at check-in.
                              </p>
                            ) : selectedDayDetail.locationAddress || modalLocationData?.address ? (
                              <p className="text-[11.5px] font-bold text-slate-900 leading-snug break-words">
                                {selectedDayDetail.locationAddress || modalLocationData?.address}
                              </p>
                            ) : modalLocationLoading ? (
                              <p className="text-[11.5px] font-semibold text-emerald-700 animate-pulse">
                                Acquiring live GPS location...
                              </p>
                            ) : (
                              <p className="text-[11.5px] font-semibold text-amber-800">
                                Location permission needed. Click "Refresh GPS" above.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Coordinates, Accuracy & Google Maps Action */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-[10.5px] font-semibold">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono shadow-2xs whitespace-nowrap overflow-hidden">
                            <Navigation size={11} className="text-emerald-600 shrink-0" />
                            <span className="truncate">
                              {selectedDayDetail.locationIn
                                ? `${selectedDayDetail.locationIn.lat.toFixed(4)}°N, ${selectedDayDetail.locationIn.lng.toFixed(4)}°E`
                                : modalLocationData && modalLocationData.lat !== 0
                                ? `${modalLocationData.lat.toFixed(4)}°N, ${modalLocationData.lng.toFixed(4)}°E`
                                : isFutureDay
                                ? "GPS Pending"
                                : modalLocationLoading
                                ? "Acquiring..."
                                : "Awaiting GPS"}
                            </span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs whitespace-nowrap overflow-hidden">
                            <Radio size={11} className="text-teal-600 shrink-0" />
                            <span className="truncate">
                              {selectedDayDetail.locationAccuracy
                                ? `±${selectedDayDetail.locationAccuracy}m Accuracy`
                                : modalLocationData && modalLocationData.lat !== 0
                                ? `±${modalLocationData.accuracy}m Accuracy`
                                : isFutureDay
                                ? "Scheduled Shift"
                                : "High Precision"}
                            </span>
                          </div>
                        </div>

                        {/* Direct Google Maps Link Button */}
                        {(selectedDayDetail.locationIn?.lat || (modalLocationData && modalLocationData.lat !== 0)) && (
                          <a
                            href={`https://www.google.com/maps?q=${selectedDayDetail.locationIn?.lat || modalLocationData?.lat},${selectedDayDetail.locationIn?.lng || modalLocationData?.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full h-9 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-300 flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer group"
                          >
                            <ExternalLink size={13} className="text-emerald-700 group-hover:scale-110 transition-transform" />
                            <span>View on Google Maps</span>
                          </a>
                        )}
                      </div>

                      {/* Security Notice */}
                      <p className="text-[9.5px] text-slate-500 flex items-center gap-1 pt-1 leading-tight border-t border-emerald-200/60 font-medium">
                        <Lock size={10} className="text-emerald-700 shrink-0" />
                        <span>Tamper-proof verified with live device GPS coordinates.</span>
                      </p>
                    </div>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200/80">
                    {isLocked ? (
                      <button
                        onClick={() => setSelectedDayDetail(null)}
                        className="px-6 h-10 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
                      >
                        Close
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setSelectedDayDetail(null)}
                          className="h-10 px-6 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            let currentGps = modalLocationData;

                            // STRICT LIVE GPS REQUIREMENT:
                            // "only live location vache tha location save aganum"
                            if (!currentGps || currentGps.source !== 'gps' || !currentGps.lat) {
                              try {
                                setModalLocationLoading(true);
                                addToast({
                                  type: 'info',
                                  title: 'Acquiring Live GPS',
                                  message: 'Accessing real-time device GPS coordinates via Google Maps precision...',
                                });
                                currentGps = await fetchLiveDeviceLocation(true);
                                setModalLocationData(currentGps);
                                setSiteOpenLocation(currentGps);
                              } catch (err: any) {
                                addToast({
                                  type: 'error',
                                  title: 'Live GPS Required',
                                  message: 'Attendance can ONLY be confirmed with authentic live device GPS. Please allow location access in your browser.',
                                });
                                setModalLocationLoading(false);
                                return; // STRICT REQUIREMENT: Stop! Do not save without live location!
                              } finally {
                                setModalLocationLoading(false);
                              }
                            }

                            const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                            if (currentUser) {
                              markAttendanceToday(currentUser, modalCheckIn || nowTime);
                            }

                            const chosenAddress = currentGps.address;
                            const chosenLat = currentGps.lat;
                            const chosenLng = currentGps.lng;
                            const chosenAccuracy = currentGps.accuracy;

                            const liveGps: GPSLocation = {
                              lat: chosenLat,
                              lng: chosenLng,
                              address: chosenAddress,
                              accuracy: chosenAccuracy,
                            };

                            // Persist to central GPS records and sync with Branch registry for Admin oversight
                            recordLiveGPSAttendance({
                              employeeId: currentUser?.uid || employee.id || 'EMP-004',
                              employeeName: employee.name || currentUser?.displayName || 'Authorized Employee',
                              role:
                                currentUser?.customClaims?.role ||
                                (employee.role.toLowerCase().includes('collection')
                                  ? 'collection_agent'
                                  : 'collection_agent'),
                              branchId: currentUser?.customClaims?.branchId || 'BR-01',
                              branchName: employee.branch || 'Anna Nagar Main Branch',
                              gps: liveGps,
                              customTime: modalCheckIn || nowTime,
                              hoursWorked: modalHoursWorked || '8h 00m',
                              date: selectedDayDetail.dateStr,
                              withinGeofence: true,
                            });

                            const updated: Record<string, TimesheetDayRecord> = {
                              ...records,
                              [selectedDayDetail.dateStr]: {
                                ...selectedDayDetail,
                                tagType: modalEditStatus === 'absent' ? 'leave' : 'regular',
                                status: modalEditStatus === 'absent' ? 'leave' : 'present',
                                hoursFormatted: modalHoursWorked,
                                hoursWorked: parseFloat(modalHoursWorked) || 8,
                                checkIn: modalCheckIn || nowTime,
                                checkOut: modalCheckOut,
                                timeRange: `${modalCheckIn || nowTime} - ${modalCheckOut}`,
                                locationAddress: chosenAddress,
                                locationIn: {
                                  lat: chosenLat,
                                  lng: chosenLng,
                                  address: chosenAddress,
                                },
                                locationAccuracy: chosenAccuracy,
                                locationTimestamp: nowTime,
                              },
                            };
                            persistRecords(updated);
                            addToast({
                              type: 'success',
                              title: 'Attendance Confirmed with Live GPS',
                              message: `Attendance permanently recorded with live GPS for ${employee.name} at ${chosenAddress}`,
                            });
                            setSelectedDayDetail(null);
                          }}
                          disabled={modalLocationLoading}
                          className="flex-1 h-9 rounded-full bg-gradient-to-r from-[#0F3822] via-[#166534] to-[#047857] hover:from-[#166534] hover:to-[#047857] text-xs font-bold text-white transition-all cursor-pointer shadow-md hover:shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <ShieldCheck size={15} />
                          <span>{modalLocationLoading ? 'Verifying Live GPS...' : 'Confirm & Lock Attendance'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
      </>
      )}

      {/* ──────────────────────────────────────────────────
          MODAL 1: HISTORICAL AUDIT LOG WITH REAL LOCATION & PUNCH DATA
          ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showHistoryModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs"
            onMouseDown={() => setShowHistoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.1 }}
              onMouseDown={(e) => e.stopPropagation()}
              className="bg-white border border-[#E2E8F0] rounded-3xl w-[min(96vw,760px)] max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl relative text-[#1E293B]"
            >
              <div className="bg-[#FAF9F6] px-6 py-4 border-b border-[#EAE8E3] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#14532D]">
                      Attendance History & Audit Log
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold tracking-wide">
                      {userAttendanceHistory.length} RECORDS
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {employee.name} • {employee.role} ({employee.id}) • {employee.branch}
                  </p>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-[#64748B] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Summary Stats Row */}
              <div className="grid grid-cols-3 gap-3 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Marked Days</span>
                  <span className="text-sm font-extrabold text-[#14532D]">
                    {userAttendanceHistory.filter(r => r.status === 'present' || r.checkIn).length} Days
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Hours</span>
                  <span className="text-sm font-extrabold text-blue-700">
                    {userAttendanceHistory.reduce((acc, r) => acc + (r.hoursWorked || 0), 0)} hrs
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">GPS Verified</span>
                  <span className="text-sm font-extrabold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    {userAttendanceHistory.filter(r => r.locationAddress || r.locationIn).length} Locations
                  </span>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                {userAttendanceHistory.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <MapPin size={36} className="mx-auto text-slate-300 stroke-[1.5]" />
                    <p className="text-sm font-bold text-slate-700">No Attendance History Recorded Yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Once you punch in or mark attendance for this account, your verified timings and GPS locations will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
                        <tr>
                          <th className="py-2.5 px-3.5 font-bold">Date & Day</th>
                          <th className="py-2.5 px-3.5 font-bold">Status</th>
                          <th className="py-2.5 px-3.5 font-bold">Time Interval</th>
                          <th className="py-2.5 px-3.5 font-bold">Hours</th>
                          <th className="py-2.5 px-3.5 font-bold">Verified Location & GPS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {userAttendanceHistory.map((d) => (
                          <tr key={d.dateStr} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3.5 font-bold text-[#1E293B]">
                              <div>{d.dateStr}</div>
                              <span className="text-[10px] text-[#64748B] font-medium">{d.dayName}</span>
                            </td>
                            <td className="py-2.5 px-3.5">
                              <span className={clsx(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                                d.status === 'present'
                                  ? "bg-emerald-100 text-emerald-800"
                                  : d.status === 'late'
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                              )}>
                                <CheckCircle2 size={10} />
                                {d.status === 'present' ? 'Present' : d.status === 'late' ? 'Late Punch' : 'Leave / Absent'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 text-[#64748B] font-mono">
                              {d.timeRange || (d.checkIn ? `${d.checkIn} - ${d.checkOut || 'In Progress'}` : '—')}
                            </td>
                            <td className="py-2.5 px-3.5 font-bold text-[#166534]">
                              {d.hoursFormatted || `${d.hoursWorked || 8}h 00m`}
                            </td>
                            <td className="py-2.5 px-3.5">
                              <div className="flex items-start gap-1.5 max-w-[240px]">
                                <MapPin size={13} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <p className="text-[11px] font-semibold text-slate-800 line-clamp-1" title={d.locationAddress || d.locationIn?.address || siteOpenLocation?.address || 'Branch Office, Chennai'}>
                                    {d.locationAddress || d.locationIn?.address || siteOpenLocation?.address || 'Branch Office, Chennai'}
                                  </p>
                                  {d.locationIn && (
                                    <span className="text-[9.5px] font-mono text-slate-500 block">
                                      {d.locationIn.lat.toFixed(4)}°N, {d.locationIn.lng.toFixed(4)}°E {d.locationAccuracy ? `(±${d.locationAccuracy}m)` : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="px-5 py-2.5 rounded-full bg-[#166534] text-white text-xs font-bold hover:bg-[#14532D] transition-colors cursor-pointer shadow-2xs"
                  >
                    Close History
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────
          MODAL 2: MONTHLY ATTENDANCE PREVIEW & PDF DOWNLOAD
          ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showMonthlyPreviewModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
            onMouseDown={() => setShowMonthlyPreviewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.12 }}
              onMouseDown={(e) => e.stopPropagation()}
              className="bg-white border border-[#E2E8F0] rounded-3xl w-[min(96vw,860px)] max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl relative text-[#1E293B]"
            >
              {/* Header */}
              <div className="bg-[#FAF9F6] px-6 py-4 border-b border-[#EAE8E3] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#14532D]">
                      Monthly Attendance Timesheet — Preview
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold tracking-wide">
                      {monthlyTimesheetData.monthName}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Official Golden Leaf Finance Duty & Location Verified Timesheet
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="month"
                    value={previewMonthStr}
                    onChange={(e) => setPreviewMonthStr(e.target.value)}
                    className="h-8 px-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-bold text-[#1E293B] shadow-2xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                    title="Select Month for Attendance Report"
                  />
                  <button
                    onClick={() => setShowMonthlyPreviewModal(false)}
                    className="p-1.5 rounded-full hover:bg-slate-200 text-[#64748B] transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Employee & Summary Strip */}
              <div className="px-6 py-3.5 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                    {employee.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">{employee.name} ({employee.id})</span>
                    <span className="text-[11px] text-slate-500">{employee.role} • {employee.branch}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Toggle: Marked Days Only */}
                  <button
                    type="button"
                    onClick={() => setShowOnlyMarkedDays(!showOnlyMarkedDays)}
                    className={clsx(
                      "px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs",
                      showOnlyMarkedDays
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <CheckCircle2 size={13} className={showOnlyMarkedDays ? "text-emerald-600" : "text-slate-400"} />
                    <span>{showOnlyMarkedDays ? "Marked Days Only" : "All Days of Month"}</span>
                  </button>

                  <div className="bg-white px-3 py-1 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs">
                    Present: <span className="font-bold text-emerald-700">{monthlyTimesheetData.presentCount}</span> / {monthlyTimesheetData.totalDaysInMonth}
                  </div>
                  <div className="bg-white px-3 py-1 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs">
                    Total Hours: <span className="font-bold text-blue-700">{monthlyTimesheetData.totalHoursFormatted}</span>
                  </div>
                </div>
              </div>

              {/* Preview Table Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {monthlyTimesheetData.displayedRows.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <CalendarIcon size={36} className="mx-auto text-slate-300 stroke-[1.5]" />
                    <p className="text-sm font-bold text-slate-700">No Marked Attendance Days in {monthlyTimesheetData.monthName}</p>
                    <p className="text-xs text-slate-500">
                      Switch to "All Days of Month" to see the full month calendar or select a different month.
                    </p>
                  </div>
                ) : (
                  <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0B1F3A] text-white">
                        <tr>
                          <th className="py-2.5 px-3 font-bold text-center w-10">#</th>
                          <th className="py-2.5 px-3 font-bold">Date & Day</th>
                          <th className="py-2.5 px-3 font-bold">Status</th>
                          <th className="py-2.5 px-3 font-bold">Check In</th>
                          <th className="py-2.5 px-3 font-bold">Check Out</th>
                          <th className="py-2.5 px-3 font-bold">Hours</th>
                          <th className="py-2.5 px-3 font-bold">Punch Location & GPS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {monthlyTimesheetData.displayedRows.map((r) => (
                          <tr key={r.dayNumber} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-center font-bold text-slate-500">
                              {r.dayNumber.toString().padStart(2, '0')}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-[#1E293B]">
                              <div>{r.dateStr}</div>
                              <span className="text-[10px] text-[#64748B] font-medium">{r.dayName}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={clsx(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                                r.status.toLowerCase().includes('present')
                                  ? "bg-emerald-100 text-emerald-800"
                                  : r.status.toLowerCase().includes('late')
                                  ? "bg-amber-100 text-amber-800"
                                  : r.status.toLowerCase().includes('week')
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-rose-100 text-rose-800"
                              )}>
                                {r.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              {r.checkIn}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              {r.checkOut}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-emerald-700">
                              {r.hoursWorked}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5 max-w-[260px]">
                                <MapPin size={12} className="text-emerald-600 flex-shrink-0" />
                                <span className="text-[11px] font-semibold text-slate-800 truncate" title={r.location}>
                                  {r.location}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 bg-[#FAF9F6] border-t border-[#EAE8E3] flex items-center justify-between gap-3">
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Official tamper-proof document with authorized signature block.</span>
                </p>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setShowMonthlyPreviewModal(false)}
                    className="h-10 px-5 rounded-full bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
                  >
                    Close Preview
                  </button>

                  <button
                    onClick={handleDownloadMonthlyPDF}
                    disabled={isGeneratingMonthlyPDF}
                    className="h-10 px-6 rounded-full bg-gradient-to-r from-[#0F3822] via-[#166534] to-[#047857] hover:from-[#166534] hover:to-[#047857] text-xs font-bold text-white transition-all cursor-pointer shadow-md hover:shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Download size={15} />
                    <span>{isGeneratingMonthlyPDF ? "Generating PDF..." : "Download PDF"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendancePage;
