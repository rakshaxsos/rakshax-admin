'use client';
import { useEffect, useState, useMemo } from 'react';
import { watchCollection, type RecordItem } from '../../../lib/firestore';
import StatCard from '../../../components/StatCard';
import DataTable from '../../../components/DataTable';

export default function SafetyMissionsAdminPage() {
  const [missions, setMissions] = useState<RecordItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    return watchCollection('safetyMissions', setMissions, 'createdAt');
  }, []);

  const stats = useMemo(() => {
    return {
      active: missions.filter((m) =>
        ['active', 'in_progress'].includes(String(m.status).toLowerCase()),
      ).length,
      overdue: missions.filter(
        (m) => String(m.status).toLowerCase() === 'overdue',
      ).length,
      completed: missions.filter((m) =>
        ['completed', 'completedsafe', 'completed_safe'].includes(
          String(m.status).toLowerCase(),
        ),
      ).length,
      cancelled: missions.filter(
        (m) => String(m.status).toLowerCase() === 'cancelled',
      ).length,
    };
  }, [missions]);

  const filteredMissions = useMemo(() => {
    if (statusFilter === 'ALL') return missions;
    return missions.filter(
      (m) => String(m.status || '').toLowerCase() === statusFilter.toLowerCase(),
    );
  }, [missions, statusFilter]);

  const rows = useMemo(() => {
    return filteredMissions.map((m) => {
      const status = String(m.status || 'created').toUpperCase();
      const isOverdue = status === 'OVERDUE';
      const isActive = status === 'ACTIVE';

      return [
        <div key="id" className="font-mono text-xs font-bold text-blue-400">
          #{m.id.slice(0, 10)}
        </div>,
        <div key="user" className="text-xs font-semibold text-white">
          {m.userName || m.userId || 'Protected User'}
        </div>,
        <div key="route" className="text-xs text-slate-300 max-w-[200px] truncate">
          {m.destination?.address || m.destination?.label || 'Destination'}
        </div>,
        <div key="dist" className="font-mono text-xs text-slate-400">
          {m.distanceMeters ? `${(m.distanceMeters / 1000).toFixed(1)} km` : '1.8 km'}
        </div>,
        <div key="status">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
              isOverdue
                ? 'bg-red-500/20 text-red-400'
                : isActive
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {status}
          </span>
        </div>,
        <div key="sharing" className="text-xs">
          {m.liveLocationEnabled ? (
            <span className="text-emerald-400 font-semibold">✓ Active</span>
          ) : (
            <span className="text-slate-500">Disabled</span>
          )}
        </div>,
        <div key="checkins" className="font-mono text-xs text-slate-300">
          {(m.checkIns as any[])?.length ?? 0} logged
        </div>,
      ];
    });
  }, [filteredMissions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-black text-white">
            Safety Missions Operational Oversight
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Aggregate monitoring of journey tracking, arrival ETAs, Safe Check-in schedules, and overdue escalation events.
          </p>
        </div>
      </div>

      {/* Aggregate Stats (PRD Section 11) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Missions"
          value={stats.active}
          variant={stats.active > 0 ? 'info' : 'default'}
          subtitle="En-route Journeys"
        />
        <StatCard
          label="Overdue Missions"
          value={stats.overdue}
          alert={stats.overdue > 0}
          variant={stats.overdue > 0 ? 'danger' : 'default'}
          subtitle="Requires Check-in"
        />
        <StatCard
          label="Completed Safe"
          value={stats.completed}
          variant="success"
          subtitle="Arrived Safely"
        />
        <StatCard
          label="Cancelled"
          value={stats.cancelled}
          subtitle="User Cancelled"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 text-xs">
        {['ALL', 'ACTIVE', 'OVERDUE', 'COMPLETED_SAFE', 'CANCELLED'].map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`rounded-lg px-3 py-1 font-bold transition ${
              statusFilter === f
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={[
          'Mission ID',
          'User',
          'Destination',
          'Distance',
          'Status',
          'Live Sharing',
          'Safe Check-ins',
        ]}
        rows={rows}
        emptyMessage="No safety missions found matching current filter."
      />
    </div>
  );
}
