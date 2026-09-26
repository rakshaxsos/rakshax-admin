'use client';

import { useEffect, useState, useMemo } from 'react';
import DataTable from '../../../components/DataTable';
import StatCard from '../../../components/StatCard';
import RakshaXMap, { type MapMarkerData } from '../../../components/RakshaXMap';
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
      pending: items.filter((r) => r.verificationStatus === 'pending' || r.verificationStatus === 'pendingVerification').length,
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

  const selectedMapMarkers = useMemo(() => {
    if (!selectedResponder) return [];
    const lat = Number(selectedResponder.centerLatitude ?? selectedResponder.latitude ?? 26.92);
    const lng = Number(selectedResponder.centerLongitude ?? selectedResponder.longitude ?? 75.78);
    const radiusMeters = Number(selectedResponder.radiusMeters || 1000);

    const marker: MapMarkerData = {
      id: selectedResponder.id,
      type: 'responder',
      lat,
      lng,
      radiusMeters,
      title: selectedResponder.fullName || selectedResponder.name || 'Responder',
      subtitle: `Zone: ${selectedResponder.serviceArea || 'General'}`,
      status: String(selectedResponder.availability || 'AVAILABLE').toUpperCase(),
    };
    return [marker];
  }, [selectedResponder]);

  const rows = useMemo(() => {
    return filteredItems.map((item) => {
      const isApproved = item.verificationStatus === 'approved';
      const isPending = item.verificationStatus === 'pending' || item.verificationStatus === 'pendingVerification';
      const isSuspended = item.verificationStatus === 'suspended';
      const radiusKm = ((item.radiusMeters || 1000) / 1000).toFixed(1);

      return [
        <div key="name" className="cursor-pointer" onClick={() => setSelectedResponder(item)}>
          <div className="font-bold text-white text-xs hover:text-blue-400 transition">
            {item.fullName || item.name || 'Responder'}
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            {item.phone || '+91 98765 00000'}
          </div>
        </div>,
        <div key="zone" className="text-xs text-slate-300">
          <div>{item.serviceArea || item.zone || 'Central Sector'}</div>
          <div className="text-[10px] text-slate-400 font-mono">Radius: {radiusKm} km</div>
        </div>,
        <div key="org" className="text-xs text-slate-400">
          {item.organization || 'RakshaX Volunteer'}
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
        <div key="avail">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
              item.isOnline !== false
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {item.availability || 'AVAILABLE'}
          </span>
        </div>,
        <div key="actions" className="flex items-center gap-2">
          <button
            onClick={() => setSelectedResponder(item)}
            className="rounded bg-slate-800 px-2 py-1 text-xs text-blue-400 border border-slate-700 hover:bg-slate-700"
          >
            Inspect
          </button>
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
      {/* Header (PRD Section 7 & 8) */}
      <div>
        <h1 className="text-2xl font-black text-white">
          Authorized Responder Network
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Volunteer verification, geospatial service-area map coverage, response-radius circles, availability heartbeat, and incident dispatch readiness.
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

      {/* Layout with Table and Selected Coverage Inspector */}
      <div className="grid gap-6 xl:grid-cols-[1.7fr_1.1fr]">
        <DataTable
          columns={[
            'Responder / Phone',
            'Service Area',
            'Affiliation',
            'Verification',
            'Availability',
            'Actions',
          ]}
          rows={rows}
          emptyMessage="No responders found in this filter."
        />

        {/* Responder Service Area & Telemetry Inspector (PRD Section 7 & 8) */}
        <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-5 shadow-xl h-fit sticky top-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Service Area Coverage Inspector
            </h2>
            {selectedResponder && (
              <span className="font-mono text-xs font-bold text-slate-400">
                #{selectedResponder.id.slice(0, 8)}
              </span>
            )}
          </div>

          {selectedResponder ? (
            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl bg-[#162238] p-4 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-base font-black text-white">
                    {selectedResponder.fullName || selectedResponder.name}
                  </span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-400">
                    {selectedResponder.verificationStatus || 'APPROVED'}
                  </span>
                </div>
                <div className="text-slate-400 mb-2">
                  <div>Zone: {selectedResponder.serviceArea || 'General'}</div>
                  <div>Phone: {selectedResponder.phone || 'N/A'}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-700/60 pt-3 font-mono text-[11px] text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Base Lat/Lng</span>
                    <span>
                      {Number(selectedResponder.centerLatitude ?? selectedResponder.latitude ?? 26.92).toFixed(4)},{' '}
                      {Number(selectedResponder.centerLongitude ?? selectedResponder.longitude ?? 75.78).toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Response Radius</span>
                    <span className="text-emerald-400 font-bold">
                      {((selectedResponder.radiusMeters || 1000) / 1000).toFixed(1)} km ({selectedResponder.radiusMeters || 1000}m)
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex justify-between text-slate-400 text-[11px] border-t border-slate-700/60 pt-2">
                  <span>Current Assignment:</span>
                  <span className="font-bold text-white">
                    {selectedResponder.currentIncidentId ? `#${selectedResponder.currentIncidentId.slice(0, 8)}` : 'None (Available)'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px] pt-1">
                  <span>Heartbeat / Last Seen:</span>
                  <span className="font-mono text-emerald-400">
                    {selectedResponder.lastSeen ? new Date(selectedResponder.lastSeen?.toDate?.() || selectedResponder.lastSeen).toLocaleTimeString() : 'Online now'}
                  </span>
                </div>
              </div>

              {/* Real OpenStreetMap with Service Area Radius Circle */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Map Coverage Circle
                </p>
                <RakshaXMap
                  markers={selectedMapMarkers}
                  center={[
                    Number(selectedResponder.centerLatitude ?? selectedResponder.latitude ?? 26.92),
                    Number(selectedResponder.centerLongitude ?? selectedResponder.longitude ?? 75.78),
                  ]}
                  zoom={14}
                  height="260px"
                  showCoverageCircles={true}
                />
              </div>

              <button
                onClick={() => setSelectedResponder(null)}
                className="w-full rounded-lg bg-slate-800 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Close Inspector
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
              Click &quot;Inspect&quot; on any responder to examine their map coverage radius, base pin, availability, and dispatch assignments.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
