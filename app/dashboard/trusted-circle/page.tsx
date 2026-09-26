'use client';
import { useEffect, useState, useMemo } from 'react';
import { watchCollection, type RecordItem } from '../../../lib/firestore';
import DataTable from '../../../components/DataTable';
import StatCard from '../../../components/StatCard';

export default function TrustedCircleAdminPage() {
  const [contacts, setContacts] = useState<RecordItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    return watchCollection('trustedContacts', setContacts, 'updatedAt');
  }, []);

  const stats = useMemo(() => {
    const active = contacts.filter((c) => c.status !== 'revoked').length;
    const sosEnabled = contacts.filter(
      (c) => c.status !== 'revoked' && c.permissions?.sosAlerts !== false,
    ).length;
    const missionsEnabled = contacts.filter(
      (c) => c.status !== 'revoked' && c.permissions?.missionUpdates === true,
    ).length;
    return {
      total: contacts.length,
      active,
      sosEnabled,
      missionsEnabled,
    };
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    if (!searchTerm) return contacts;
    const s = searchTerm.toLowerCase();
    return contacts.filter(
      (c) =>
        c.contactName?.toLowerCase().includes(s) ||
        c.contactPhone?.toLowerCase().includes(s) ||
        c.userId?.toLowerCase().includes(s),
    );
  }, [contacts, searchTerm]);

  const rows = useMemo(() => {
    return filteredContacts.map((c) => {
      const perms = c.permissions || {};
      const isActive = c.status !== 'revoked';

      return [
        <div key="id" className="font-mono text-xs font-bold text-blue-400">
          #{c.id.slice(0, 10)}
        </div>,
        <div key="user" className="text-xs text-slate-300">
          {c.userId || 'USER'}
        </div>,
        <div key="contact" className="text-xs font-semibold text-white">
          {c.contactName || 'Contact'}
        </div>,
        <div key="phone" className="font-mono text-xs text-slate-400">
          {c.contactPhone || '—'}
        </div>,
        <div key="perms" className="flex flex-wrap gap-1 text-[10px]">
          {perms.sosAlerts !== false && (
            <span className="rounded bg-red-500/20 px-1.5 py-0.5 font-bold text-red-400">
              SOS
            </span>
          )}
          {perms.missionUpdates && (
            <span className="rounded bg-blue-500/20 px-1.5 py-0.5 font-bold text-blue-400">
              Mission
            </span>
          )}
          {perms.checkInUpdates && (
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-bold text-emerald-400">
              Check-in
            </span>
          )}
          {perms.liveLocationSharing && (
            <span className="rounded bg-purple-500/20 px-1.5 py-0.5 font-bold text-purple-400">
              Live Location
            </span>
          )}
        </div>,
        <div key="status">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
              isActive
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {c.status || 'ACTIVE'}
          </span>
        </div>,
      ];
    });
  }, [filteredContacts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">
          Trusted Circle Network Support
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Audit user-delegated safety permissions, emergency SMS recipients, and peer live location authorization channels.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Contacts" value={stats.total} />
        <StatCard label="Active Delegations" value={stats.active} variant="success" />
        <StatCard label="SOS Alert Channels" value={stats.sosEnabled} variant="danger" />
        <StatCard label="Mission Listeners" value={stats.missionsEnabled} variant="info" />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0F172A] p-4">
        <input
          type="text"
          placeholder="Search by contact name, phone number, or user ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={[
          'ID',
          'Protected User',
          'Trusted Contact',
          'Phone',
          'Authorized Channels',
          'Status',
        ]}
        rows={rows}
        emptyMessage="No trusted circle contacts found."
      />
    </div>
  );
}
