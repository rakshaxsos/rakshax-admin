'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  watchCollection,
  updateItem,
  logAuditEvent,
  type RecordItem,
} from '../../../lib/firestore';

const CATEGORIES = [
  'All',
  'Broken Street Light',
  'CCTV Issue',
  'Unsafe Area',
  'Security Concern',
  'Road/Infrastructure',
  'Blockage',
  'Suspicious Activity',
  'Medical/Safety Concern',
  'Unsafe Entry/Exit',
  'Other',
];

const STATUS_FILTERS = [
  'ALL',
  'PENDING',
  'NEEDS_VERIFICATION',
  'VERIFIED',
  'REJECTED',
  'RESOLVED',
  'EXPIRED',
];

export default function SafetyReportsAdminPage() {
  const [reports, setReports] = useState<RecordItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedReport, setSelectedReport] = useState<RecordItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    return watchCollection('mapReports', setReports, 'createdAt');
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const s = String(r.status || 'pending').toUpperCase();
      if (statusFilter !== 'ALL' && s !== statusFilter) return false;
      if (categoryFilter !== 'All' && r.category !== categoryFilter) return false;
      return true;
    });
  }, [reports, statusFilter, categoryFilter]);

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedReport) return;
    setActionLoading(true);
    try {
      await updateItem('mapReports', selectedReport.id, {
        status: newStatus.toLowerCase(),
        moderatedAt: new Date(),
        moderatedBy: 'admin',
      });
      await logAuditEvent(
        'admin',
        'ADMIN',
        `REPORT_${newStatus.toUpperCase()}`,
        `Report #${selectedReport.id}`,
        { previousStatus: selectedReport.status, newStatus },
      );
      setSelectedReport((prev) =>
        prev ? { ...prev, status: newStatus.toLowerCase() } : null,
      );
    } catch (e) {
      console.error('Error updating report status:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendExpiry = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    try {
      const currentExpiry = selectedReport.expiresAt
        ? new Date(selectedReport.expiresAt.toDate?.() || selectedReport.expiresAt)
        : new Date();
      const newExpiry = new Date(currentExpiry.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

      await updateItem('mapReports', selectedReport.id, {
        expiresAt: newExpiry,
        status: 'verified',
      });
      await logAuditEvent(
        'admin',
        'ADMIN',
        'REPORT_EXTENDED',
        `Report #${selectedReport.id}`,
        { extendedUntil: newExpiry },
      );
    } catch (e) {
      console.error('Error extending report expiry:', e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-black text-white">
            Safety Reports Moderation Workspace
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Review community incident submissions, perform geo-verification, publish alerts to the RakshaX Map, and manage hazard lifecycles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-400 border border-blue-500/20">
            {reports.filter((r) => String(r.status).toLowerCase() === 'pending').length} Pending Review
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#0F172A] p-4">
        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                statusFilter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-200 outline-none focus:border-blue-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Layout: List & Inspection Workspace */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Reports Table/Cards */}
        <div className="space-y-3">
          {filteredReports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 py-20 text-center text-xs text-slate-500 bg-[#0F172A]">
              No reports matching current status/category filters.
            </div>
          ) : (
            filteredReports.map((r) => {
              const isSelected = selectedReport?.id === r.id;
              const status = String(r.status || 'pending').toUpperCase();

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    isSelected
                      ? 'border-blue-500 bg-[#162238] shadow-md'
                      : 'border-slate-800 bg-[#0F172A] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {r.category || 'Safety Issue'}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            status === 'VERIFIED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : status === 'REJECTED'
                              ? 'bg-red-500/20 text-red-400'
                              : status === 'RESOLVED'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {status}
                        </span>
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                          {r.type === 'temporary' ? 'Temporary' : 'Permanent'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-300 line-clamp-2">
                        {r.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2 text-[11px] text-slate-500">
                    <span>
                      Reporter: {r.userName || r.userId || 'Anonymous'}
                    </span>
                    <span className="font-mono">
                      GPS: {Number(r.location?.latitude ?? r.latitude ?? 0).toFixed(4)}, {Number(r.location?.longitude ?? r.longitude ?? 0).toFixed(4)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detailed Moderation Panel */}
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-sm h-fit sticky top-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Moderator Action Console
          </h2>

          {selectedReport ? (
            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-lg bg-[#162238] p-4 border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-blue-400 font-bold">
                    #{selectedReport.id.slice(0, 12)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Reported by {selectedReport.userName || 'Community User'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  {selectedReport.category}
                </h3>
                <p className="mt-2 text-slate-300 leading-relaxed">
                  {selectedReport.description}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-700/60 pt-3 font-mono text-[11px] text-slate-400">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">
                      Classification
                    </span>
                    <span className="capitalize text-slate-200">
                      {selectedReport.type || 'permanent'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">
                      Current State
                    </span>
                    <span className="text-amber-400 font-bold uppercase">
                      {selectedReport.status || 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons (PRD Section 10) */}
              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Moderation Decision
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleStatusChange('verified')}
                    className="rounded-lg bg-emerald-600 py-2.5 font-bold text-white hover:bg-emerald-500 transition disabled:opacity-50"
                  >
                    ✓ Verify & Publish
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleStatusChange('rejected')}
                    className="rounded-lg bg-red-600/80 py-2.5 font-bold text-white hover:bg-red-600 transition disabled:opacity-50"
                  >
                    ✕ Reject Report
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleStatusChange('needs_verification')}
                    className="rounded-lg border border-slate-700 bg-slate-800 py-2 text-slate-300 hover:bg-slate-700 transition disabled:opacity-50"
                  >
                    Request Evidence
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleStatusChange('resolved')}
                    className="rounded-lg border border-slate-700 bg-slate-800 py-2 text-slate-300 hover:bg-slate-700 transition disabled:opacity-50"
                  >
                    Mark Resolved
                  </button>
                </div>

                {selectedReport.type === 'temporary' && (
                  <button
                    disabled={actionLoading}
                    onClick={handleExtendExpiry}
                    className="w-full mt-2 rounded-lg border border-blue-500/40 bg-blue-950/20 py-2 text-blue-300 hover:bg-blue-900/30 transition disabled:opacity-50 font-semibold"
                  >
                    Extend Expiry (+7 Days)
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
              Select any safety issue from the list to evaluate details and perform verification actions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
