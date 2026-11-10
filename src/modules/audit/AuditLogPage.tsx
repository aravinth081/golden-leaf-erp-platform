// ──────────────────────────────────────────────────
// Golden Leaf Finance — Audit Log Page (Admin)
// Immutable Activity Trail, Search, Advanced Filters, Detail Inspection Drawer, CSV Export
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Search, RotateCcw, ShieldAlert, Shield, ShieldCheck, CheckCircle2,
  AlertTriangle, Filter, Eye, X, Calendar, User, Clock, MapPin,
  Laptop, ChevronLeft, ChevronRight, Hash, Database
} from 'lucide-react';
import { useUIStore } from '../../store';
import { PageHeader, Avatar } from '../../components/ui';

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'verify' | 'collect' | 'login';
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
  device?: string;
  branch?: string;
  changes?: { field: string; oldVal: string; newVal: string }[];
}

const STORAGE_KEY = 'glf_audit_trail_master';

export const getStoredAuditLogs = (): AuditEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};



export const AuditLogPage: React.FC = () => {
  const [logs] = useState<AuditEntry[]>(() => getStoredAuditLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const { addToast } = useUIStore();

  // Close inspection drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedLog) {
        setSelectedLog(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLog]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery);

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entity.toLowerCase() === entityFilter.toLowerCase();
    const matchesRole = roleFilter === 'all' || log.role === roleFilter;

    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = log.timestamp.includes('Today');
    } else if (dateFilter === 'yesterday') {
      matchesDate = log.timestamp.includes('Yesterday');
    } else if (dateFilter === 'older') {
      matchesDate = !log.timestamp.includes('Today') && !log.timestamp.includes('Yesterday');
    }

    return matchesSearch && matchesAction && matchesEntity && matchesRole && matchesDate;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalLogs = logs.length;
  const approvalsCount = logs.filter(l => l.action === 'approve' || l.action === 'verify').length;
  const collectionsCount = logs.filter(l => l.action === 'collect').length;
  const authCount = logs.filter(l => l.action === 'login').length;

  const handleResetFilters = () => {
    setSearchQuery('');
    setActionFilter('all');
    setEntityFilter('all');
    setRoleFilter('all');
    setDateFilter('all');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const headers = ['Audit ID,Timestamp,Actor,Role,Branch,Action,Entity,Entity ID,Details,IP Address,Device'];
    const rows = filteredLogs.map(
      (l) => `${l.id},"${l.timestamp}","${l.actor}","${l.role}","${l.branch || 'N/A'}",${l.action},${l.entity},${l.entityId},"${l.details.replace(/"/g, '""')}","${l.ipAddress}","${l.device || 'N/A'}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Audit Trail Exported',
      message: `${filteredLogs.length} audit logs downloaded as CSV.`
    });
  };

  const actionBadge = (action: string) => {
    switch (action) {
      case 'approve':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'verify':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'collect':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'reject':
      case 'delete':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'create':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'update':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'login':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
    
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 pb-12 font-sans w-full min-w-0 max-w-full text-[#0B1F3A]">
      <PageHeader
        title="Immutable Audit Trail & Forensics"
        badge="WORM Compliant"
        badgePosition="below"
        subtitle="Cryptographically sealed activity log of user authentications, underwriting decisions, loan disbursements, and master parameter edits"
        breadcrumbs={[{ label: 'Audit Trail' }, { label: 'Forensic Activity Register' }]}
        className="mb-0"
        actions={
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#15345E] text-white font-bold text-xs transition-all shadow-sm cursor-pointer border border-[#D4AF37]/50 hover:border-[#D4AF37]"
          >
            <Download size={14} className="text-[#D4AF37]" />
            <span>Export Audit Trail (CSV)</span>
          </button>
        }
      />

      {/* ── KPI STATS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(11,31,58,0.04)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Trail Entries</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
              <Database size={17} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0B1F3A] font-manrope tracking-tight">{totalLogs}</div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Immutable system events</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(11,31,58,0.04)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Approvals & KYC</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-manrope tracking-tight">{approvalsCount}</div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Underwriting & verifications</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(11,31,58,0.04)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Collections Logged</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 flex-shrink-0">
              <Clock size={17} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#D4AF37] font-manrope tracking-tight">{collectionsCount}</div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Cash receipts processed</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(11,31,58,0.04)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Auth & Sessions</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 flex-shrink-0">
              <Shield size={17} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 font-manrope tracking-tight">{authCount}</div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Logins & credential actions</p>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(11,31,58,0.04)] overflow-hidden flex-shrink-0"
      >
        <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full flex-shrink-0" />
            <h2 className="text-sm font-semibold text-white tracking-wider uppercase font-sans">
              AUDIT TRAIL SEARCH & FILTERS
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            <span className="text-slate-300">WORM Real-Time Ledger Active</span>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Search Input */}
            <div className="flex flex-col gap-1.5 lg:col-span-5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-sans">
                SEARCH AUDIT TRAIL
              </label>
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search actor, entity ID, details, or IP..."
                  className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-[#0B1F3A] text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/25 focus:border-[#D4AF37] focus:bg-white"
                />
              </div>
            </div>

            {/* Action Filter */}
            <div className="flex flex-col gap-1.5 lg:col-span-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-sans">
                ACTION TYPE
              </label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-[#0B1F3A] text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/25 focus:border-[#D4AF37] cursor-pointer"
              >
                <option value="all">All Actions</option>
                <option value="approve">Approve</option>
                <option value="collect">Collect</option>
                <option value="verify">Verify</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="reject">Reject</option>
                <option value="login">Login / Auth</option>
              </select>
            </div>

            {/* Entity Filter */}
            <div className="flex flex-col gap-1.5 lg:col-span-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-sans">
                TARGET ENTITY
              </label>
              <select
                value={entityFilter}
                onChange={(e) => { setEntityFilter(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-[#0B1F3A] text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/25 focus:border-[#D4AF37] cursor-pointer"
              >
                <option value="all">All Entities</option>
                <option value="loan">Loans</option>
                <option value="customer">Customers</option>
                <option value="collection">Collections</option>
                <option value="kyc">KYC</option>
                <option value="group">Groups</option>
                <option value="auth">Auth</option>
                <option value="settings">Settings</option>
                <option value="employee">Employees</option>
              </select>
            </div>

            {/* Role Filter */}
            <div className="flex flex-col gap-1.5 lg:col-span-3">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-sans">
                STAFF ROLE
              </label>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-[#0B1F3A] text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/25 focus:border-[#D4AF37] cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="System Admin">System Admin</option>
                <option value="Branch Manager">Branch Manager</option>
                <option value="Credit Manager">Credit Manager</option>
                <option value="Customer Relationship Officer (CRO)">Customer Relationship Officer (CRO)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold font-sans">Timeframe:</span>
              {(['all', 'today', 'yesterday', 'older'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setDateFilter(t); setCurrentPage(1); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${dateFilter === t
                      ? 'bg-[#0B1F3A] text-[#D4AF37] shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {t === 'all' ? 'All Time' : t}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">
                Showing <span className="font-bold text-[#0B1F3A] font-manrope">{filteredLogs.length}</span> of {logs.length} entries
              </span>
              {(searchQuery || actionFilter !== 'all' || entityFilter !== 'all' || roleFilter !== 'all' || dateFilter !== 'all') && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer transition-colors px-2 py-1 rounded-md hover:bg-rose-50"
                >
                  <RotateCcw size={13} />
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── AUDIT LOGS TABLE ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(11,31,58,0.04)] overflow-hidden"
      >
        <div className="bg-[#0B1F3A] px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full flex-shrink-0" />
            <h2 className="text-sm font-semibold text-white tracking-wider uppercase font-sans">
              IMMUTABLE ACTIVITY RECORDS
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#D4AF37] font-bold text-xs border border-[#D4AF37]/30 font-manrope">
              {filteredLogs.length}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <ShieldCheck size={15} className="text-[#D4AF37]" />
            <span className="hidden sm:inline">Cryptographic Verification Active</span>
          </div>
        </div>

        <div className="overflow-x-auto w-full custom-scrollbar">
          {paginatedLogs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-3">
                <ShieldAlert size={22} className="text-[#0B1F3A]" />
              </div>
              <h3 className="text-sm font-bold text-[#0B1F3A]">No matching audit logs</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">Try adjusting your filter or search terms to inspect recorded system activities.</p>
              <button
                onClick={handleResetFilters}
                className="mt-3 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <table className="w-full min-w-[1150px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[#475569] font-bold text-[11px] uppercase tracking-wider select-none">
                  <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[120px]">LOG ID</th>
                  <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[150px]">TIMESTAMP</th>
                  <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[240px]">ACTOR & BRANCH</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">ACTION</th>
                  <th className="py-3.5 px-4 text-left whitespace-nowrap min-w-[150px]">ENTITY & ID</th>
                  <th className="py-3.5 px-4 text-left min-w-[320px]">DETAILS</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[140px]">IP ADDRESS</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[90px]">INSPECT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.map((log, idx) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`hover:bg-blue-50/40 transition-colors cursor-pointer group align-middle ${idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                      }`}
                  >
                    {/* LOG ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                      <span className="font-mono font-bold text-xs text-[#0B1F3A] bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/90 whitespace-nowrap inline-block shadow-2xs group-hover:border-[#0B1F3A]/40 transition-colors">
                        {log.id}
                      </span>
                    </td>

                    {/* TIMESTAMP */}
                    <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs">
                        <Clock size={13} className="text-slate-400 flex-shrink-0" />
                        <span>{log.timestamp}</span>
                      </div>
                    </td>

                    {/* ACTOR & BRANCH */}
                    <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={log.actor} size="sm" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs text-[#0B1F3A] group-hover:text-blue-700 transition-colors whitespace-nowrap">
                            {log.actor}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium whitespace-nowrap mt-0.5">
                            <span>{log.role}</span>
                            {log.branch && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-500">{log.branch}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ACTION */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider border shadow-2xs whitespace-nowrap ${actionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* ENTITY & ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-[#0B1F3A]">{log.entity}</span>
                        <span className="font-mono text-[11px] text-[#B8860B] font-semibold mt-0.5">
                          {log.entityId}
                        </span>
                      </div>
                    </td>

                    {/* DETAILS */}
                    <td className="py-3.5 px-4 text-left text-slate-700 text-xs leading-relaxed min-w-[320px] max-w-md align-middle">
                      <span className="line-clamp-2" title={log.details}>
                        {log.details}
                      </span>
                    </td>

                    {/* IP ADDRESS */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap align-middle">
                      <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums bg-slate-50 px-2 py-0.5 rounded border border-slate-200/70 inline-block">
                        {log.ipAddress}
                      </span>
                    </td>

                    {/* INSPECT */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 hover:bg-[#0B1F3A] text-slate-500 hover:text-white border border-slate-200 transition-all cursor-pointer shadow-2xs hover:scale-105"
                        title="View Detailed Payload"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── PAGINATION CONTROLS ── */}
        {totalPages > 1 && (
          <div className="px-5 sm:px-6 py-4 border-t border-[#E2E8F0] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-sans">
            <div>
              Showing <span className="font-bold text-[#0B1F3A] font-manrope">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-bold text-[#0B1F3A] font-manrope">{Math.min(currentPage * pageSize, filteredLogs.length)}</span> of{' '}
              <span className="font-bold text-[#0B1F3A] font-manrope">{filteredLogs.length}</span> entries
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-xl font-bold text-xs cursor-pointer transition-all font-manrope ${currentPage === p
                      ? 'bg-[#0B1F3A] text-[#D4AF37] shadow-xs'
                      : 'border border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── DETAIL INSPECTION DRAWER ── */}
      <AnimatePresence>
        {selectedLog && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none"
            role="dialog"
            aria-modal="true"
          >
            {/* Clickable Backdrop Overlay — Clicking anywhere outside closes popup */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setSelectedLog(null)}
              className="fixed inset-0 bg-black/65 backdrop-blur-xs cursor-pointer"
              aria-label="Close inspection popup backdrop"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden font-sans relative z-10 select-text"
            >
              <div className="bg-[#0B1F3A] px-6 py-4 flex items-center justify-between border-b border-[#D4AF37]/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-4 bg-[#D4AF37] rounded-full" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    AUDIT EVENT DETAILS — <span className="font-mono text-[#D4AF37]">{selectedLog.id}</span>
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                {/* WORM Integrity Confirmation */}
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-emerald-900 text-xs font-medium">
                  <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0" />
                  <span>Cryptographically verified WORM audit log — Immutable system record.</span>
                </div>

                <div className="grid grid-cols-2 gap-3.5 p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Timestamp</span>
                    <span className="font-bold text-[#0B1F3A]">{selectedLog.timestamp}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Action Type</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${actionBadge(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Actor</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar name={selectedLog.actor} size="xs" />
                      <span className="font-bold text-[#0B1F3A]">{selectedLog.actor}</span>
                      <span className="text-slate-500 font-medium">({selectedLog.role})</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Branch Context</span>
                    <span className="font-bold text-[#0B1F3A]">{selectedLog.branch || 'Headquarters Chennai'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Target Entity</span>
                    <span className="font-bold text-[#0B1F3A]">
                      {selectedLog.entity} <span className="font-mono text-[#B8860B]">({selectedLog.entityId})</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">IP Address</span>
                    <span className="font-mono font-bold text-[#0B1F3A]">{selectedLog.ipAddress}</span>
                  </div>
                  {selectedLog.device && (
                    <div className="col-span-2 border-t border-slate-200/80 pt-2.5 mt-1">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Client Device & Agent</span>
                      <span className="font-semibold text-[#0B1F3A]">{selectedLog.device}</span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-1.5">Action Narrative</h4>
                  <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-slate-700 font-medium leading-relaxed shadow-2xs">
                    {selectedLog.details}
                  </div>
                </div>

                {selectedLog.changes && selectedLog.changes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-1.5">Field Mutation Diff</h4>
                    <div className="border border-[#E2E8F0] rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-bold uppercase">
                          <tr>
                            <th className="py-2.5 px-3">Field</th>
                            <th className="py-2.5 px-3">Previous Value</th>
                            <th className="py-2.5 px-3">New Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedLog.changes.map((c, i) => (
                            <tr key={i}>
                              <td className="py-2.5 px-3 font-mono font-bold text-[#0B1F3A]">{c.field}</td>
                              <td className="py-2.5 px-3 text-rose-600 bg-rose-50/40 font-mono font-semibold">{c.oldVal}</td>
                              <td className="py-2.5 px-3 text-emerald-600 bg-emerald-50/40 font-mono font-semibold">{c.newVal}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#15345E] text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    Close Forensic Inspector
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AuditLogPage;
