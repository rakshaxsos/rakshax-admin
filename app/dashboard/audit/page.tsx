'use client';
import { useEffect, useState, useMemo } from 'react';
import DataTable from '../../../components/DataTable';
import { watchAuditLogs, type RecordItem } from '../../../lib/firestore';

const ACTION_FILTERS = [
  'ALL',
  'SOS',
  'DISPATCH',
  'REPORT',
  'MISSION',
  'USER',
  'DEVICE',
];

export default function AuditTimelineAdminPage() {
  const [items, setItems] = useState<RecordItem[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    return watchAuditLogs(setItems);
  }, []);

  const filteredLogs = useMemo(() => {
    return items.filter((log) => {
      const act = String(log.action || '').toUpperCase();
      if (filter !== 'ALL' && !act.includes(filter)) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        act.toLowerCase().includes(s) ||
        String(log.actor || '').toLowerCase().includes(s) ||
        String(log.target || '').toLowerCase().includes(s)
      );
    });
  }, [items, filter, search]);

  const rows = useMemo(() => {
    return filteredLogs.map((item) => {
      const act = String(item.action || 'EVENT');
      const isRed = act.includes('SOS') || act.includes('ESCALATED') || act.includes('SUSPENDED');
      const isGreen = act.includes('RESOLVED') || act.includes('VERIFIED') || act.includes('ACCEPTED');

      return [
        <div key="time" className="font-mono text-[11px] text-slate-400">
          {item.timestamp?.toDate?.()
            ? item.timestamp.toDate().toLocaleString()
            : String(item.timestamp || '').slice(0, 19)}
        </div>,
        <div key="action">
          <span
            className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
              isRed
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : isGreen
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            {act}
          </span>
        </div>,
        <div key="actor" className="text-xs text-white font-medium">
          {item.actor || 'system'}
          {item.role && (
            <span className="ml-1 text-[10px] text-slate-500 font-mono">
              ({item.role})
            </span>
          )}
        </div>,
        <div key="target" className="text-xs text-slate-300">
          {item.target || '—'}
        </div>,
        <div key="details" className="font-mono text-[11px] text-slate-400 max-w-xs truncate">
          {item.metadata ? JSON.stringify(item.metadata) : item.details || '—'}
        </div>,
      ];
    });
  }, [filteredLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">
          System Immutable Audit Trail
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Cryptographically recorded security logs, operational state transitions, authorization grants, and location stream authorizations.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#0F172A] p-4">
        <div className="flex flex-wrap gap-1.5 text-xs">
          {ACTION_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1 font-bold ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Filter by actor, action, or target ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
        />
      </div>

      <DataTable
        columns={['Timestamp', 'Security Action', 'Actor & Role', 'Target Entity', 'Metadata']}
        rows={rows}
        emptyMessage="No audit logs recorded for this category."
      />
    </div>
  );
}
