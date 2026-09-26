'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  watchCollection,
  updateItem,
  logAuditEvent,
  type RecordItem,
} from '../../../lib/firestore';
import DataTable from '../../../components/DataTable';

const STATUS_OPTIONS = [
  'ALL',
  'active',
  'sos_created',
  'assigned',
  'en_route',
  'on_scene',
  'resolved',
  'cancelled',
];

export default function IncidentsAdminPage() {
  const [incidents, setIncidents] = useState<RecordItem[]>([]);
  const [responders, setResponders] = useState<RecordItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIncident, setSelectedIncident] = useState<RecordItem | null>(null);
  const [assignedResponder, setAssignedResponder] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const unsubs = [
      watchCollection('incidents', setIncidents, 'createdAt'),
      watchCollection('responders', setResponders, 'updatedAt'),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const filteredIncidents = useMemo(() => {
    if (statusFilter === 'ALL') return incidents;
    return incidents.filter(
      (i) => String(i.status || '').toLowerCase() === statusFilter.toLowerCase(),
    );
  }, [incidents, statusFilter]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedIncident) return;
    setActionLoading(true);
    try {
      const updates: Record<string, any> = {
        status: newStatus,
        updatedAt: new Date(),
      };
      if (newStatus === 'resolved') {
        updates.resolvedAt = new Date();
      }
      await updateItem('incidents', selectedIncident.id, updates);
      await logAuditEvent(
        'admin',
        'ADMIN',
        `INCIDENT_STATUS_${newStatus.toUpperCase()}`,
        `Incident #${selectedIncident.id}`,
      );
      setSelectedIncident((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (err) {
      console.error('Error updating incident status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignResponder = async () => {
    if (!selectedIncident || !assignedResponder) return;
    setActionLoading(true);
    try {
      const respObj = responders.find((r) => r.id === assignedResponder);
      await updateItem('incidents', selectedIncident.id, {
        assignedResponderId: assignedResponder,
        assignedResponderName: respObj?.name || 'Assigned Officer',
        status: 'assigned',
        updatedAt: new Date(),
      });
      await logAuditEvent(
        'admin',
        'ADMIN',
        'RESPONDER_ASSIGNED',
        `Incident #${selectedIncident.id}`,
        { responderId: assignedResponder, name: respObj?.name },
      );
      setSelectedIncident((prev) =>
        prev
          ? {
              ...prev,
              assignedResponderId: assignedResponder,
              assignedResponderName: respObj?.name,
              status: 'assigned',
            }
          : null,
      );
    } catch (err) {
      console.error('Error assigning responder:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const rows = useMemo(() => {
    return filteredIncidents.map((inc) => {
      const status = String(inc.status || 'active').toUpperCase();
      const isActive = ['ACTIVE', 'SOS_CREATED', 'ASSIGNED', 'EN_ROUTE'].includes(
        status,
      );

      return [
        <div key="id" className="font-mono text-xs font-bold text-blue-400">
          #{inc.incidentId || inc.id.slice(0, 10)}
        </div>,
        <div key="user">
          <div className="font-bold text-white text-xs">
            {inc.userName || 'Protected User'}
          </div>
          <div className="text-[11px] text-slate-400">{inc.userPhone || '—'}</div>
        </div>,
        <div key="source" className="text-xs">
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
            {inc.source || 'mobile_app'}
          </span>
        </div>,
        <div key="status">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
              isActive
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : status === 'RESOLVED'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {status}
          </span>
        </div>,
        <div key="responder" className="text-xs text-slate-300">
          {inc.assignedResponderName || (
            <span className="text-amber-400 text-[11px]">Unassigned</span>
          )}
        </div>,
        <div key="action">
          <button
            onClick={() => setSelectedIncident(inc)}
            className="rounded bg-slate-800 px-2.5 py-1 text-xs font-semibold text-blue-400 hover:bg-slate-700"
          >
            Inspect →
          </button>
        </div>,
      ];
    });
  }, [filteredIncidents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">
          Emergency Incident Master Workspace
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Comprehensive audit, operational dispatch state-machine transitions, and unit deployment control for all RakshaX emergency activations.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 text-xs">
        {STATUS_OPTIONS.map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`rounded-lg px-3 py-1 font-bold transition ${
              statusFilter === f
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {f.toUpperCase().replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Main Grid: Table & Inspection Modal/Drawer */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <DataTable
          columns={[
            'Incident ID',
            'Subject',
            'Trigger Source',
            'Current Status',
            'Assigned Unit',
            'Action',
          ]}
          rows={rows}
          emptyMessage="No incidents found matching current filter."
        />

        {/* Detailed Inspector Panel */}
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-sm h-fit sticky top-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Incident Operations Drawer
          </h2>

          {selectedIncident ? (
            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-lg bg-[#162238] p-4 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-blue-400 font-bold">
                    #{selectedIncident.incidentId || selectedIncident.id}
                  </span>
                  <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-red-400">
                    {selectedIncident.status || 'ACTIVE'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  {selectedIncident.userName || 'Protected User'}
                </h3>
                <p className="text-slate-400">
                  Phone: {selectedIncident.userPhone || '+91 98765 43210'}
                </p>

                {/* GPS Telemetry */}
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-700/60 pt-3 font-mono text-[11px] text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">
                      GPS Coordinates
                    </span>
                    <span>
                      {Number(selectedIncident.currentLocation?.latitude ?? 26.9124).toFixed(4)},{' '}
                      {Number(selectedIncident.currentLocation?.longitude ?? 75.7873).toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">
                      GPS Accuracy
                    </span>
                    <span className="text-emerald-400">
                      ±{selectedIncident.currentLocation?.accuracy || 12}m
                    </span>
                  </div>
                </div>

                {/* Tracking Link Preview */}
                <div className="mt-3 border-t border-slate-700/60 pt-3">
                  <span className="text-[10px] text-slate-500 block uppercase mb-1">
                    Live Tracking Route
                  </span>
                  <a
                    href={`/track/${selectedIncident.id}?token=verified`}
                    target="_blank"
                    className="font-mono text-[11px] text-blue-400 hover:underline break-all"
                  >
                    https://rakshaxsos.vercel.app/track/{selectedIncident.id}
                  </a>
                </div>
              </div>

              {/* Assignment Controls */}
              <div className="rounded-lg bg-[#162238] p-4 border border-slate-800 space-y-3">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block">
                  Assign Authorized Responder
                </span>
                <div className="flex gap-2">
                  <select
                    value={assignedResponder}
                    onChange={(e) => setAssignedResponder(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500 text-xs"
                  >
                    <option value="">Select available unit...</option>
                    {responders.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name || 'Officer'} ({r.zone || 'Central'})
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={!assignedResponder || actionLoading}
                    onClick={handleAssignResponder}
                    className="rounded-lg bg-blue-600 px-3 py-2 font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
              </div>

              {/* State Transitions */}
              <div className="space-y-2">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px] block">
                  Update Operational Status
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('en_route')}
                    className="rounded-lg border border-blue-500/40 bg-blue-950/20 py-2 font-bold text-blue-300 hover:bg-blue-900/30"
                  >
                    En Route
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('on_scene')}
                    className="rounded-lg border border-amber-500/40 bg-amber-950/20 py-2 font-bold text-amber-300 hover:bg-amber-900/30"
                  >
                    On Scene
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('resolved')}
                    className="rounded-lg bg-emerald-600 py-2 font-bold text-white hover:bg-emerald-500"
                  >
                    Resolve Incident
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('cancelled')}
                    className="rounded-lg border border-slate-700 bg-slate-800 py-2 font-bold text-slate-400 hover:bg-slate-700"
                  >
                    Cancel / Stand Down
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
              Select any incident from the table to view real-time location stream and manage responder deployments.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
