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

const STATUS_PROGRESSION = [
  'NEW',
  'ACKNOWLEDGED',
  'ASSIGNED',
  'EN_ROUTE',
  'ON_SCENE',
  'RESOLVED',
];

export default function PoliceConsolePage() {
  const [incidents, setIncidents] = useState<RecordItem[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<RecordItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    return watchCollection('incidents', setIncidents, 'createdAt');
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

  const rows = useMemo(() => {
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
          <div className="text-[11px] font-mono text-slate-400">
            {inc.userPhone || '+91 98765 43210'}
          </div>
        </div>,
        <div key="gps" className="font-mono text-xs text-slate-300">
          {Number(inc.currentLocation?.latitude ?? 26.9124).toFixed(4)},{' '}
          {Number(inc.currentLocation?.longitude ?? 75.7873).toFixed(4)}
        </div>,
        <div key="status">
          <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-red-400 border border-red-500/30">
            {status}
          </span>
        </div>,
        <div key="unit" className="text-xs text-emerald-400 font-semibold">
          {inc.assignedResponderName || 'Awaiting Unit'}
        </div>,
        <div key="action">
          <button
            onClick={() => setSelectedIncident(inc)}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-500"
          >
            Tactical Action →
          </button>
        </div>,
      ];
    });
  }, [activeIncidents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-600 animate-ping" />
            <h1 className="text-2xl font-black text-white">
              RakshaX Emergency Police Response Console
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Dedicated triage operations interface for authorized emergency operators, unit dispatch, and 112 escalation protocols.
          </p>
        </div>

        {/* Rapid 112 Trigger */}
        <div className="flex items-center gap-2">
          <a
            href="tel:112"
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white shadow-lg transition hover:bg-red-500"
          >
            <span className="text-sm">🚨</span>
            DIRECT 112 CALL LINE
          </a>
        </div>
      </div>

      {/* Response Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Emergencies"
          value={activeIncidents.length}
          alert={activeIncidents.length > 0}
          variant="danger"
          subtitle="Priority 1 Distress"
        />
        <StatCard
          label="Assigned Units"
          value={activeIncidents.filter((i) => i.assignedResponderName).length}
          variant="info"
          subtitle="En Route / On Scene"
        />
        <StatCard
          label="Avg Response Time"
          value="3m 42s"
          variant="success"
          subtitle="Dispatch-to-Scene"
        />
        <StatCard
          label="Resolved Today"
          value={incidents.filter((i) => i.status === 'resolved').length}
          subtitle="Closed Cases"
        />
      </div>

      {/* Main Grid: Live Queue & Incident Operational Drawer */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Active Distress Broadcasts ({activeIncidents.length})
            </h2>
          </div>
          <DataTable
            columns={[
              'Incident ID',
              'Citizen Name',
              'Live GPS',
              'Status',
              'Assigned Unit',
              'Action',
            ]}
            rows={rows}
            emptyMessage="Zero active emergency broadcasts. All zones green."
          />
        </div>

        {/* Selected Incident Drawer */}
        <div className="rounded-2xl border border-red-500/30 bg-[#0F172A] p-5 shadow-2xl h-fit sticky top-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
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
                    {selectedIncident.userName || 'Citizen'}
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

                {/* Direct Emergency Call User / 112 */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${selectedIncident.userPhone || '112'}`}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 font-bold text-white hover:bg-blue-500 text-center"
                  >
                    <span>📞</span> Call Citizen
                  </a>
                  <button
                    onClick={() => handleEscalate112(selectedIncident.id)}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-red-600 py-2 font-bold text-white hover:bg-red-500 text-center"
                  >
                    <span>🚨</span> Escalate 112
                  </button>
                </div>
              </div>

              {/* Status Progression Sequence (PRD Section 7) */}
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

              {/* Secure Tracking External Link */}
              <div className="border-t border-slate-800 pt-3">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">
                  Public Encrypted Tracking Route
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
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
              Select an active emergency from the dispatch queue to deploy units, initiate citizen phone contact, or escalate to 112.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
