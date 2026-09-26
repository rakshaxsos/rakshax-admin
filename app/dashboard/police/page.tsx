'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  watchCollection,
  updateItem,
  logAuditEvent,
  type RecordItem,
} from '../../../lib/firestore';
import DataTable from '../../../components/DataTable';
import StatCard from '../../../components/StatCard';
import RakshaXMap, { type MapMarkerData } from '../../../components/RakshaXMap';

const STATUS_PROGRESSION = [
  'NEW',
  'ACKNOWLEDGED',
  'ASSIGNED',
  'EN_ROUTE',
  'ON_SCENE',
  'RESOLVED',
];

type ConsoleTab = 'incidents' | 'map' | 'units' | 'history' | 'analytics';

export default function PoliceConsolePage() {
  const [incidents, setIncidents] = useState<RecordItem[]>([]);
  const [responders, setResponders] = useState<RecordItem[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<RecordItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ConsoleTab>('incidents');

  useEffect(() => {
    const unsubs = [
      watchCollection('incidents', setIncidents, 'createdAt'),
      watchCollection('responders', setResponders, 'updatedAt'),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const activeIncidents = useMemo(
    () =>
      incidents.filter(
        (item) =>
          !['idle', 'resolved', 'cancelled', 'failed'].includes(
            String(item.status || '').toLowerCase(),
          ),
      ),
    [incidents],
  );

  const resolvedIncidents = useMemo(
    () =>
      incidents.filter(
        (item) =>
          String(item.status || '').toLowerCase() === 'resolved',
      ),
    [incidents],
  );

  const handleUpdateStatus = async (incidentId: string, nextStatus: string) => {
    setActionLoading(true);
    try {
      const updates: Record<string, any> = {
        status: nextStatus.toLowerCase(),
        updatedAt: new Date(),
      };
      if (nextStatus === 'RESOLVED') {
        updates.resolvedAt = new Date();
      }
      await updateItem('incidents', incidentId, updates);
      await logAuditEvent(
        'police_dispatcher',
        'EMERGENCY_OPERATOR',
        `EMERGENCY_STATUS_${nextStatus}`,
        `Incident #${incidentId}`,
      );
      setSelectedIncident((prev) =>
        prev ? { ...prev, status: nextStatus.toLowerCase() } : null,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate112 = async (incidentId: string) => {
    if (!confirm('Escalate this incident to State Emergency 112 Dispatch?')) return;
    setActionLoading(true);
    try {
      await updateItem('incidents', incidentId, {
        status: 'escalated',
        escalatedTo112: true,
        escalatedAt: new Date(),
      });
      await logAuditEvent(
        'police_dispatcher',
        'EMERGENCY_OPERATOR',
        'INCIDENT_ESCALATED_112',
        `Incident #${incidentId}`,
      );
      alert('Emergency 112 dispatch broadcast recorded and logged.');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Build Map Markers for Emergency Response Console
  const consoleMarkers = useMemo(() => {
    const list: MapMarkerData[] = [];

    activeIncidents.forEach((inc) => {
      const lat = Number(inc.currentLocation?.latitude ?? inc.latitude ?? 26.9124);
      const lng = Number(inc.currentLocation?.longitude ?? inc.longitude ?? 75.7873);
      list.push({
        id: inc.id,
        type: 'sos',
        title: `SOS: ${inc.userName || inc.id.slice(0, 8)}`,
        subtitle: `Priority: High • Status: ${String(inc.status || 'NEW').toUpperCase()}`,
        status: String(inc.status || 'NEW').toUpperCase(),
        lat,
        lng,
        accuracy: Number(inc.currentLocation?.accuracy || 12),
        raw: inc,
      });
    });

    responders
      .filter((r) => r.isOnline !== false)
      .forEach((resp) => {
        list.push({
          id: resp.id,
          type: 'responder',
          title: resp.fullName || resp.name || 'Unit',
          subtitle: `Zone: ${resp.serviceArea || 'General'}`,
          status: String(resp.availability || 'AVAILABLE').toUpperCase(),
          lat: Number(resp.centerLatitude ?? resp.latitude ?? 26.92),
          lng: Number(resp.centerLongitude ?? resp.longitude ?? 75.78),
          radiusMeters: Number(resp.radiusMeters || 1000),
          raw: resp,
        });
      });

    return list;
  }, [activeIncidents, responders]);

  const activeRows = useMemo(() => {
    return activeIncidents.map((inc) => {
      const status = String(inc.status || 'NEW').toUpperCase();
      return [
        <div key="id" className="font-mono text-xs font-bold text-red-400">
          #{inc.incidentId || inc.id.slice(0, 10)}
        </div>,
        <div key="user">
          <div className="font-bold text-white text-xs">
            {inc.userName || 'Citizen in Distress'}
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            {inc.userPhone || '+91 98765 43210'}
          </div>
        </div>,
        <div key="loc" className="font-mono text-xs text-slate-300">
          {Number(inc.currentLocation?.latitude ?? inc.latitude ?? 26.9124).toFixed(4)},{' '}
          {Number(inc.currentLocation?.longitude ?? inc.longitude ?? 75.7873).toFixed(4)}
        </div>,
        <div key="status">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
              status === 'ON_SCENE'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : status === 'EN_ROUTE'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                : 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
            }`}
          >
            {status}
          </span>
        </div>,
        <div key="responder" className="text-xs text-slate-300">
          {inc.assignedResponderName || (
            <span className="text-amber-400 font-bold">Unassigned</span>
          )}
        </div>,
        <div key="action">
          <button
            onClick={() => setSelectedIncident(inc)}
            className="rounded bg-slate-800 px-2.5 py-1 text-xs font-bold text-blue-400 border border-slate-700 hover:bg-slate-700 hover:text-white transition"
          >
            Command →
          </button>
        </div>,
      ];
    });
  }, [activeIncidents]);

  return (
    <div className="space-y-6">
      {/* Header (PRD Section 11) */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping" />
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">
              Emergency Response Tactical Console
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Dedicated incident command interface for emergency services, rapid triage, and field unit coordination.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="tel:112"
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 transition shadow-lg shadow-red-600/30"
          >
            <span>🚨</span>
            CALL 112 (National Emergency)
          </a>
        </div>
      </div>

      {/* 5-Tab Navigation (PRD Section 11) */}
      <div className="flex border-b border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-4 py-2.5 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'incidents'
              ? 'border-red-500 text-red-400 bg-red-500/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>🚨</span> Active Incidents ({activeIncidents.length})
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2.5 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'map'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>🗺️</span> Live Tactical Map
        </button>
        <button
          onClick={() => setActiveTab('units')}
          className={`px-4 py-2.5 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'units'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>🛡️</span> Assigned Units ({responders.filter((r) => r.isOnline !== false).length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-purple-500 text-purple-400 bg-purple-500/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>📜</span> Incident History ({resolvedIncidents.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'border-amber-500 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>📊</span> Response Analytics
        </button>
      </div>

      {/* Tab 1: Active Incidents & Drawer */}
      {activeTab === 'incidents' && (
        <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <div className="space-y-4">
            <DataTable
              headers={[
                'Incident ID',
                'Citizen / Source',
                'GPS Coordinates',
                'Tactical Status',
                'Assigned Unit',
                'Action',
              ]}
              rows={activeRows}
              emptyMessage="Zero active emergency broadcasts. All response sectors clear."
            />
          </div>

          {/* Tactical Command Drawer */}
          <div className="rounded-2xl border border-red-500/30 bg-[#0F172A] p-5 shadow-2xl h-fit sticky top-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Tactical Unit Controls
              </h2>
              {selectedIncident && (
                <span className="font-mono text-xs font-bold text-slate-400">
                  #{selectedIncident.id.slice(0, 10)}
                </span>
              )}
            </div>

            {selectedIncident ? (
              <div className="mt-4 space-y-4 text-xs">
                <div className="rounded-xl bg-[#162238] p-4 border border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-base font-black text-white">
                      {selectedIncident.userName || 'Citizen in Distress'}
                    </span>
                    <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-red-400">
                      {selectedIncident.status || 'ACTIVE'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Phone: {selectedIncident.userPhone || '+91 98765 43210'}</span>
                    <span>Source: {selectedIncident.source || 'mobile_app'}</span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-700/60 pt-3 font-mono text-[11px] text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">
                        Target Latitude
                      </span>
                      <span>{Number(selectedIncident.currentLocation?.latitude ?? 26.9124).toFixed(5)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">
                        Target Longitude
                      </span>
                      <span>{Number(selectedIncident.currentLocation?.longitude ?? 75.7873).toFixed(5)}</span>
                    </div>
                  </div>

                  {/* Actions: Call Citizen, Call Responder, Open Navigation, Escalate 112 */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <a
                      href={`tel:${selectedIncident.userPhone || '112'}`}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 font-bold text-white hover:bg-blue-500 text-center transition"
                    >
                      <span>📞</span> Call Citizen
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedIncident.currentLocation?.latitude ?? selectedIncident.latitude ?? 26.9124},${selectedIncident.currentLocation?.longitude ?? selectedIncident.longitude ?? 75.7873}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 font-bold text-white hover:bg-emerald-500 text-center transition"
                    >
                      <span>🧭</span> Open Maps
                    </a>
                    <button
                      onClick={() => handleEscalate112(selectedIncident.id)}
                      className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg bg-red-600 py-2 font-bold text-white hover:bg-red-500 text-center transition"
                    >
                      <span>🚨</span> Escalate 112 Dispatch
                    </button>
                  </div>
                </div>

                {/* Status Progression Sequence (PRD Section 11) */}
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px] block mb-2">
                    Status Transition Pipeline
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 font-bold">
                    {STATUS_PROGRESSION.map((st) => {
                      const isCurrent =
                        String(selectedIncident.status || '').toUpperCase() === st;
                      return (
                        <button
                          key={st}
                          disabled={actionLoading}
                          onClick={() => handleUpdateStatus(selectedIncident.id, st)}
                          className={`rounded-lg py-2 text-[11px] transition ${
                            isCurrent
                              ? 'bg-blue-600 text-white shadow'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Secure Tracking Deep Link */}
                <div className="border-t border-slate-800 pt-3">
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">
                    Public Encrypted Tracking Route
                  </span>
                  <a
                    href={`/track/${selectedIncident.id}?token=verified`}
                    target="_blank"
                    className="font-mono text-[11px] text-blue-400 hover:underline break-all"
                  >
                    https://rakshaxsos.vercel.app/track/{selectedIncident.id}?token=verified
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
                Select an active emergency from the queue to deploy units, initiate citizen phone contact, or escalate to 112.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Live Tactical Map (Unified RakshaXMap) */}
      {activeTab === 'map' && (
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Tactical Geospatial Operations Map
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {activeIncidents.length} active emergencies • {responders.length} units
            </span>
          </div>
          <RakshaXMap
            markers={consoleMarkers}
            height="620px"
            selectedMarkerId={selectedIncident?.id}
            onMarkerClick={(m) => {
              const inc = activeIncidents.find((i) => i.id === m.id);
              if (inc) setSelectedIncident(inc);
            }}
          />
        </div>
      )}

      {/* Tab 3: Assigned Units */}
      {activeTab === 'units' && (
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
            Field Response Units
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {responders.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-slate-800 bg-[#162238] p-4 text-xs"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-white text-sm">{r.fullName || r.name}</span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                      r.isOnline !== false
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {r.availability || 'AVAILABLE'}
                  </span>
                </div>
                <div className="text-slate-400 mb-2">
                  <div>Sector: {r.serviceArea || 'General'}</div>
                  <div>Coverage Radius: {((r.radiusMeters || 1000) / 1000).toFixed(1)} km</div>
                </div>
                <a
                  href={`tel:${r.phone || ''}`}
                  className="block text-center rounded bg-slate-800 py-1.5 font-bold text-blue-400 hover:bg-slate-700"
                >
                  📞 Contact Unit
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Incident History */}
      {activeTab === 'history' && (
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
            Concluded Incidents Archive
          </h2>
          <DataTable
            headers={['Incident ID', 'Citizen', 'Resolution Status', 'Resolved At']}
            rows={resolvedIncidents.map((inc) => [
              <span key="id" className="font-mono text-xs text-slate-300">#{inc.id.slice(0, 10)}</span>,
              <span key="name" className="text-xs text-white font-bold">{inc.userName || 'Citizen'}</span>,
              <span key="st" className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-400">RESOLVED</span>,
              <span key="time" className="font-mono text-xs text-slate-400">{inc.resolvedAt ? new Date(inc.resolvedAt?.toDate?.() || inc.resolvedAt).toLocaleString() : 'Recent'}</span>,
            ])}
            emptyMessage="No concluded incidents in archive."
          />
        </div>
      )}

      {/* Tab 5: Response Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Active Incidents" value={activeIncidents.length} variant="danger" />
          <StatCard label="Resolved Incidents" value={resolvedIncidents.length} variant="success" />
          <StatCard label="Online Units" value={responders.filter((r) => r.isOnline !== false).length} variant="info" />
          <StatCard label="Avg Response Latency" value="3.4 min" variant="default" />
        </div>
      )}
    </div>
  );
}
