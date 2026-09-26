'use client';
import { useEffect, useState, useMemo } from 'react';
import DataTable from '../../../components/DataTable';
import StatCard from '../../../components/StatCard';
import {
  setResponderVerification,
  updateItem,
  watchCollection,
  logAuditEvent,
  type RecordItem,
} from '../../../lib/firestore';

export default function RespondersAdminPage() {
  const [items, setItems] = useState<RecordItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'SUSPENDED'>('ALL');
  const [selectedResponder, setSelectedResponder] = useState<RecordItem | null>(null);

  useEffect(() => {
    return watchCollection('responders', setItems, 'updatedAt');
  }, []);

  const stats = useMemo(() => {
    return {
      total: items.length,
      approved: items.filter((r) => r.verificationStatus === 'approved').length,
      pending: items.filter((r) => r.verificationStatus === 'pending').length,
      online: items.filter((r) => r.isOnline !== false).length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filter === 'ALL') return items;
    return items.filter(
      (r) =>
        String(r.verificationStatus || '').toLowerCase() === filter.toLowerCase(),
    );
  }, [items, filter]);

  const handleToggleVerification = async (id: string, current: string) => {
    const next = current === 'approved' ? 'rejected' : 'approved';
    await setResponderVerification(id, next);
    await logAuditEvent(
      'admin',
      'ADMIN',
      `RESPONDER_${next.toUpperCase()}`,
      `Responder #${id}`,
    );
  };

  const handleSuspend = async (id: string, isSuspended: boolean) => {
    const nextStatus = isSuspended ? 'approved' : 'suspended';
    await updateItem('responders', id, { verificationStatus: nextStatus });
    await logAuditEvent(
      'admin',
      'ADMIN',
      isSuspended ? 'RESPONDER_UNSUSPENDED' : 'RESPONDER_SUSPENDED',
      `Responder #${id}`,
    );
  };

  const rows = useMemo(() => {
    return filteredItems.map((item) => {
      const isApproved = item.verificationStatus === 'approved';
      const isPending = item.verificationStatus === 'pending';
      const isSuspended = item.verificationStatus === 'suspended';

      return [
        <div key="name">
          <div className="font-bold text-white text-xs">
            {item.fullName || item.name || 'Responder'}
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            {item.phone || '+91 98765 00000'}
          </div>
        </div>,
        <div key="zone" className="text-xs text-slate-300">
          {item.serviceArea || item.zone || 'Central Sector'}
        </div>,
        <div key="org" className="text-xs text-slate-400">
          {item.organization || 'RakshaX Corps'}
        </div>,
        <div key="status">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
              isApproved
                ? 'bg-emerald-500/20 text-emerald-400'
                : isSuspended
                ? 'bg-red-500/20 text-red-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {item.verificationStatus || 'PENDING'}
          </span>
        </div>,
        <div key="perf" className="font-mono text-xs text-slate-300">
          {item.acknowledgementRate || '98%'} • {item.avgResponseTime || '3.8m'}
        </div>,
        <div key="actions" className="flex items-center gap-2">
          <button
            onClick={() =>
              handleToggleVerification(item.id, item.verificationStatus || 'pending')
            }
            className={`rounded px-2 py-1 text-xs font-bold ${
              isApproved
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isApproved ? 'Revoke' : 'Approve'}
          </button>
          <button
            onClick={() => handleSuspend(item.id, isSuspended)}
            className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-400 hover:bg-slate-700"
          >
            {isSuspended ? 'Restore' : 'Suspend'}
          </button>
        </div>,
      ];
    });
  }, [filteredItems]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">
          Authorized Responder Network
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Credential verification, sector assignment, field performance auditing, and disciplinary controls for emergency responders.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Responders" value={stats.total} />
        <StatCard label="Active / Verified" value={stats.approved} variant="success" />
        <StatCard label="Pending Approval" value={stats.pending} alert={stats.pending > 0} variant={stats.pending > 0 ? 'warning' : 'default'} />
        <StatCard label="Currently Online" value={stats.online} variant="info" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 text-xs">
        {(['ALL', 'APPROVED', 'PENDING', 'SUSPENDED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1 font-bold transition ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={[
          'Responder / Phone',
          'Assigned Zone',
          'Affiliation',
          'Verification',
          'Ack / Avg Response',
          'Actions',
        ]}
        rows={rows}
        emptyMessage="No responders found in this filter."
      />
    </div>
  );
}
