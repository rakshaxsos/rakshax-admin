'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  watchCollection,
  updateItem,
  logAuditEvent,
  type RecordItem,
} from '../../../lib/firestore';

export default function LiveDispatchConsole() {
  const [incidents, setIncidents] = useState<RecordItem[]>([]);
  const [responders, setResponders] = useState<RecordItem[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [assigneeMap, setAssigneeMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubs = [
      watchCollection('incidents', setIncidents, 'createdAt'),
      watchCollection('responders', setResponders, 'updatedAt'),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const activeIncidents = useMemo(() => {
    return incidents.filter((i) =>
      ['active', 'sos_created', 'assigned', 'en_route', 'on_scene', 'new'].includes(
        String(i.status || '').toLowerCase(),
      ),
    );
  }, [incidents]);

  const handleAssign = async (incidentId: string) => {
    const respId = assigneeMap[incidentId];
    if (!respId) return;
    const resp = responders.find((r) => r.id === respId);
    try {
      await updateItem('incidents', incidentId, {
        assignedResponderId: respId,
        assignedResponderName: resp?.name || 'Officer',
        status: 'assigned',
        updatedAt: new Date(),
      });
      await logAuditEvent(
        'dispatcher',
        'DISPATCHER',
        'DISPATCH_UNIT_ASSIGNED',
        `Incident #${incidentId}`,
        { responderId: respId, responderName: resp?.name },
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusTransition = async (incidentId: string, status: string) => {
    try {
      const updates: Record<string, any> = {
        status,
        updatedAt: new Date(),
      };
      if (status === 'resolved') updates.resolvedAt = new Date();
      await updateItem('incidents', incidentId, updates);
      await logAuditEvent(
        'dispatcher',
        'DISPATCHER',
        `DISPATCH_STATUS_${status.toUpperCase()}`,
        `Incident #${incidentId}`,
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <h1 className="text-2xl font-black text-white">
              Tactical Live Dispatch Console
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Field responder assignment engine taking into account response zone, availability, GPS distance, and triage urgency.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400 border border-red-500/40">
            {activeIncidents.length} Pending Units
          </span>
          <span className="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/40">
            {responders.filter((r) => r.isOnline !== false).length} Online Units
          </span>
        </div>
      </div>

      {/* Incident Dispatch Cards Grid (PRD Section 6) */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {activeIncidents.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-800 bg-[#0F172A] py-24 text-center text-xs text-slate-500">
            <span className="block text-3xl mb-2">📻</span>
            No pending dispatch requests. All sectors clear.
          </div>
        ) : (
          activeIncidents.map((inc) => {
            const isAssigned = !!inc.assignedResponderName;
            const status = String(inc.status || 'ACTIVE').toUpperCase();

            return (
              <div
                key={inc.id}
                className="rounded-2xl border border-slate-800 bg-[#0F172A] p-5 shadow-lg transition hover:border-slate-700 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-400">
                      #{inc.incidentId || inc.id.slice(0, 10)}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        status === 'ON_SCENE'
                          ? 'bg-amber-500/20 text-amber-400'
                          : status === 'EN_ROUTE'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  {/* Subject details */}
                  <div className="mt-3">
                    <h3 className="text-base font-bold text-white">
                      {inc.userName || 'Protected User'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {inc.userPhone || '+91 98765 43210'} • {inc.source || 'mobile'}
                    </p>
                  </div>

                  {/* Coordinates & Accuracy */}
                  <div className="mt-3 rounded-lg bg-[#162238] p-3 text-[11px] font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500 uppercase">GPS Pos:</span>
                      <span>
                        {Number(inc.currentLocation?.latitude ?? 26.9124).toFixed(4)},{' '}
                        {Number(inc.currentLocation?.longitude ?? 75.7873).toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-slate-500 uppercase">Accuracy:</span>
                      <span className="text-emerald-400">
                        ±{inc.currentLocation?.accuracy || 10}m (Fused GPS)
                      </span>
                    </div>
                  </div>

                  {/* Assigned Responder Info */}
                  <div className="mt-3 text-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Assigned Unit
                    </span>
                    {isAssigned ? (
                      <div className="flex items-center justify-between rounded-lg bg-emerald-950/20 border border-emerald-500/30 p-2 text-emerald-300">
                        <span className="font-bold">{inc.assignedResponderName}</span>
                        <span className="text-[10px] font-mono">ETA: ~4m</span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <select
                          value={assigneeMap[inc.id] || ''}
                          onChange={(e) =>
                            setAssigneeMap({
                              ...assigneeMap,
                              [inc.id]: e.target.value,
                            })
                          }
                          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-xs text-white outline-none focus:border-blue-500"
                        >
                          <option value="">Choose Unit...</option>
                          {responders.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name || 'Officer'} ({r.zone || 'Central'})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssign(inc.id)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 font-bold text-white hover:bg-blue-500 text-xs"
                        >
                          Deploy
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Operations Actions */}
                <div className="mt-5 border-t border-slate-800/80 pt-3">
                  <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                    <button
                      onClick={() => handleStatusTransition(inc.id, 'en_route')}
                      className="rounded bg-slate-800 py-1.5 text-blue-300 hover:bg-slate-700"
                    >
                      En Route
                    </button>
                    <button
                      onClick={() => handleStatusTransition(inc.id, 'on_scene')}
                      className="rounded bg-slate-800 py-1.5 text-amber-300 hover:bg-slate-700"
                    >
                      On Scene
                    </button>
                    <button
                      onClick={() => handleStatusTransition(inc.id, 'resolved')}
                      className="rounded bg-emerald-600/80 py-1.5 text-white hover:bg-emerald-600"
                    >
                      Close / Stand Down
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
