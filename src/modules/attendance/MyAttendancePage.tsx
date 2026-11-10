// ──────────────────────────────────────────────────
// Golden Leaf Finance — My Attendance Page
// Read-only attendance history for logged-in employee
// ──────────────────────────────────────────────────

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, MapPin, CheckCircle2, AlertTriangle,
  XCircle, Camera, X, ChevronLeft, ChevronRight, Eye
} from 'lucide-react';
import { useAuthStore } from '../../store';
import {
  getEmployeeRecords,
  seedDemoGPSRecords,
  formatTime,
  type GPSAttendanceRecord,
} from '../../services/gpsAttendanceService';
import { useAttendanceStore } from '../../store/attendanceStore';
import { ROLE_LABELS } from '../../types';

const STATUS_BADGE: Record<string, string> = {
  present: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  late: 'bg-amber-50 text-amber-700 border border-amber-200',
  absent: 'bg-red-50 text-red-700 border border-red-200',
  outside_location: 'bg-orange-50 text-orange-700 border border-orange-200',
  half_day: 'bg-blue-50 text-blue-700 border border-blue-200',
};

export const MyAttendancePage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const { todayRecord, hasPunchedIn, hasPunchedOut } = useAttendanceStore();
  const [records, setRecords] = useState<GPSAttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selfieModal, setSelfieModal] = useState<{ url: string; label: string } | null>(null);

  // Load records
  useEffect(() => {
    const empId = user?.uid || '';
    if (empId) {
      const allRecords = getEmployeeRecords(empId);
      setRecords(allRecords);
    } else {
      setRecords([]);
    }
  }, [user]);

  // Filter by month
  const filteredRecords = useMemo(() => {
    return records.filter(r => r.date.startsWith(selectedMonth))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, selectedMonth]);

  // Summary stats
  const summary = useMemo(() => {
    const present = filteredRecords.filter(r => r.status === 'present').length;
    const late = filteredRecords.filter(r => r.status === 'late').length;
    const absent = filteredRecords.filter(r => r.status === 'absent').length;
    const outside = filteredRecords.filter(r => r.status === 'outside_location').length;
    const halfDay = filteredRecords.filter(r => r.status === 'half_day').length;
    const totalMins = filteredRecords.reduce((sum, r) => sum + (r.totalMinutes || 0), 0);
    const avgHours = filteredRecords.length > 0 ? Math.round(totalMins / filteredRecords.length / 60 * 10) / 10 : 0;
    return { present, late, absent, outside, halfDay, total: filteredRecords.length, avgHours };
  }, [filteredRecords]);

  // Month navigation
  const changeMonth = (direction: -1 | 1) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + direction, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = (() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  })();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 pb-10 font-body w-full min-w-0 max-w-full"
    >
      {/* Today's Status Card */}
      {hasPunchedIn && todayRecord && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_2px_10px_rgba(11,31,58,0.04)] overflow-hidden">
          <div className="bg-[#0B1F3A] px-4 sm:px-6 py-3 flex items-center gap-3">
            <div className="w-1 h-4 bg-[#D4AF37] rounded-full" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Today's Attendance</h2>
          </div>
          <div className="p-4 sm:p-5 flex flex-wrap items-center gap-4 sm:gap-6">
            {todayRecord.punchInSelfie && (
              <img
                src={todayRecord.punchInSelfie}
                alt="Punch In Selfie"
                className="w-14 h-14 rounded-xl object-cover border-2 border-[#D4AF37] cursor-pointer"
                onClick={() => setSelfieModal({ url: todayRecord.punchInSelfie, label: 'Punch In Selfie' })}
              />
            )}
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-[#D4AF37]" />
                <span className="font-bold text-[#0B1F3A]">Punched In: {formatTime(todayRecord.punchInTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-gray-400" />
                <span className="text-gray-600 truncate max-w-[250px]" title={todayRecord.punchInGPS.address}>
                  {todayRecord.punchInGPS.address.slice(0, 50)}...
                </span>
              </div>
              {hasPunchedOut && todayRecord.punchOutTime && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span className="font-bold text-emerald-700">
                    Punched Out: {formatTime(todayRecord.punchOutTime)} • {todayRecord.totalHoursWorked}
                  </span>
                </div>
              )}
              {!hasPunchedOut && (
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-amber-500" />
                  <span className="text-amber-700 font-semibold">Currently Working — Not yet punched out</span>
                </div>
              )}
            </div>
            <div className="ml-auto">
              <span className={`px-3 py-1 rounded-[6px] text-[11px] font-bold uppercase ${STATUS_BADGE[todayRecord.status] || STATUS_BADGE.present}`}>
                {todayRecord.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-[0_2px_10px_rgba(11,31,58,0.04)]">
          <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Total Days</div>
          <div className="text-2xl font-black text-[#0B1F3A] mt-1">{summary.total}</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-[0_2px_10px_rgba(11,31,58,0.04)]">
          <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Present</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{summary.present}</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-[0_2px_10px_rgba(11,31,58,0.04)]">
          <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Late</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{summary.late}</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-[0_2px_10px_rgba(11,31,58,0.04)]">
          <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Outside Loc</div>
          <div className="text-2xl font-black text-orange-600 mt-1">{summary.outside}</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-[0_2px_10px_rgba(11,31,58,0.04)]">
          <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Half Day</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{summary.halfDay}</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-[0_2px_10px_rgba(11,31,58,0.04)]">
          <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Avg Hours</div>
          <div className="text-2xl font-black text-[#D4AF37] mt-1">{summary.avgHours}h</div>
        </div>
      </div>

      {/* Month Selector + History Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_2px_10px_rgba(11,31,58,0.04)] overflow-hidden">
        <div className="bg-[#0B1F3A] px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4 bg-[#D4AF37] rounded-full" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Attendance History</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-target"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-[#D4AF37] min-w-[130px] text-center">{monthLabel}</span>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-target"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse font-body min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#6B7280] font-bold uppercase tracking-wider">
                <th className="pb-3 px-3">Date</th>
                <th className="pb-3 px-3">Punch In</th>
                <th className="pb-3 px-3">In Location</th>
                <th className="pb-3 px-3">Punch Out</th>
                <th className="pb-3 px-3">Out Location</th>
                <th className="pb-3 px-3">Hours</th>
                <th className="pb-3 px-3 text-center">Status</th>
                <th className="pb-3 px-3 text-center">Selfie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filteredRecords.map((rec) => {
                const dateObj = new Date(rec.date + 'T00:00:00');
                return (
                  <tr key={rec.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#0B1F3A]">
                        {dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {dateObj.toLocaleDateString('en-IN', { weekday: 'short' })}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-[#0B1F3A]">
                      {formatTime(rec.punchInTime)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-gray-600 truncate max-w-[120px] text-[10px]" title={rec.punchInGPS.address}>
                        {rec.punchInGPS.address.slice(0, 30)}...
                      </div>
                      {!rec.punchInWithinGeofence && (
                        <span className="text-[9px] text-orange-600 font-bold">⚠ Outside</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-[#0B1F3A]">
                      {rec.punchOutTime ? formatTime(rec.punchOutTime) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-3">
                      {rec.punchOutGPS ? (
                        <div className="text-gray-600 truncate max-w-[120px] text-[10px]" title={rec.punchOutGPS.address}>
                          {rec.punchOutGPS.address.slice(0, 30)}...
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#0B1F3A]">
                      {rec.totalHoursWorked || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase ${STATUS_BADGE[rec.status] || 'bg-gray-50 text-gray-600'}`}>
                        {rec.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {rec.punchInSelfie ? (
                        <button
                          onClick={() => setSelfieModal({ url: rec.punchInSelfie, label: `${rec.date} — Punch In` })}
                          className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-target mx-auto"
                        >
                          <Eye size={14} />
                        </button>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredRecords.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <Calendar size={36} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-sm text-gray-500">No records for {monthLabel}</p>
            </div>
          )}
        </div>
      </div>

      {/* Selfie Modal */}
      <AnimatePresence>
        {selfieModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelfieModal(null)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl overflow-hidden shadow-2xl w-[min(94vw,440px)] max-h-[90dvh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-[#0B1F3A] px-4 sm:px-5 py-3 flex items-center justify-between text-white shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wider">{selfieModal.label}</span>
                <button onClick={() => setSelfieModal(null)} className="text-gray-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center touch-target">
                  <X size={16} />
                </button>
              </div>
              <div className="overflow-y-auto custom-scrollbar flex-1">
                <img src={selfieModal.url} alt="Selfie" className="w-full aspect-[4/3] object-cover" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MyAttendancePage;
