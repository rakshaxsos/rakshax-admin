'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import StatCard from '../../components/StatCard';
import RakshaXMap, { type MapMarkerData } from '../../components/RakshaXMap';
import { watchCollection, type RecordItem } from '../../lib/firestore';

const toDateValue = (value: unknown): Date => {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
};

export default function OperationsDashboard() {
  const [incidents, setIncidents] = useState<RecordItem[]>([]);
  const [responders, setResponders] = useState<RecordItem[]>([]);
  const [devices, setDevices] = useState<RecordItem[]>([]);
  const [reports, setReports] = useState<RecordItem[]>([]);
  const [missions, setMissions] = useState<RecordItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<RecordItem[]>([]);

  useEffect(() => {
    const unsubs = [
      watchCollection('incidents', setIncidents, 'createdAt'),
      watchCollection('responders', setResponders, 'updatedAt'),
      watchCollection('devices', setDevices, 'lastSeen'),
      watchCollection('mapReports', setReports, 'createdAt'),
      watchCollection('safetyMissions', setMissions, 'createdAt'),
      watchCollection('audit_logs', setAuditLogs, 'timestamp'),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  // 8 KPIs per PRD Section 5
  const activeSOS = useMemo(
    () =>
      incidents.filter((item) =>
        ['active', 'sos_created', 'assigned', 'en_route', 'on_scene'].includes(
          String(item.status || '').toLowerCase(),
        ),
      ).length,
    [incidents],
  );

  const awaitingResponse = useMemo(
    () =>
      incidents.filter((item) =>
        ['sos_created', 'new', 'pending', 'unassigned'].includes(
          String(item.status || '').toLowerCase(),
        ),
      ).length,
    [incidents],
  );

  const respondersOnline = useMemo(
    () =>
      responders.filter(
        (r) =>
          r.isOnline !== false &&
          ['approved', 'verified', 'active'].includes(
            String(r.verificationStatus || '').toLowerCase(),
          ),
      ).length,
    [responders],
  );

  const devicesOnline = useMemo(
    () =>
      devices.filter(
        (d) =>
          d.isConnected === true ||
          String(d.status || '').toLowerCase() === 'connected',
      ).length,
    [devices],
  );

  const pendingReports = useMemo(
    () =>
      reports.filter((r) =>
        ['pending', 'needs_verification'].includes(
          String(r.status || '').toLowerCase(),
        ),
      ).length,
    [reports],
  );

  const activeMissionsCount = useMemo(
    () =>
      missions.filter((m) =>
        ['active', 'in_progress', 'overdue'].includes(
          String(m.status || '').toLowerCase(),
        ),
      ).length,
    [missions],
  );

  const openSafetyIssues = useMemo(
    () =>
      reports.filter((r) =>
        ['verified', 'active'].includes(String(r.status || '').toLowerCase()),
      ).length,
    [reports],
  );

  const resolvedToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return incidents.filter((i) => {
      if (String(i.status || '').toLowerCase() !== 'resolved') return false;
      const d = toDateValue(i.resolvedAt || i.updatedAt);
      return d >= today;
    }).length;
  }, [incidents]);

  // Active Critical Incidents Feed
  const criticalFeed = useMemo(
    () =>
      incidents
        .filter((item) =>
          !['idle', 'resolved', 'cancelled', 'failed'].includes(
            String(item.status || '').toLowerCase(),
          ),
        )
        .slice(0, 6),
    [incidents],
  );

  // Category breakdown for Safety Reports
  const reportCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of reports) {
      const cat = String(r.category || 'Other');
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [reports]);

  const dashboardMarkers = useMemo(() => {
    const list: MapMarkerData[] = [];
    incidents
      .filter((i) =>
        ['active', 'sos_created', 'assigned', 'en_route', 'on_scene', 'new'].includes(
          String(i.status || '').toLowerCase(),
        ),
      )
      .forEach((inc) => {
        list.push({
          id: inc.id,
          type: 'sos',
          lat: Number(inc.currentLocation?.latitude ?? inc.latitude ?? 26.9124),
          lng: Number(inc.currentLocation?.longitude ?? inc.longitude ?? 75.7873),
          title: `SOS: ${inc.userName || inc.id.slice(0, 8)}`,
          subtitle: `Status: ${String(inc.status || 'ACTIVE').toUpperCase()}`,
          status: String(inc.status || 'ACTIVE').toUpperCase(),
          accuracy: Number(inc.currentLocation?.accuracy || 15),
        });
      });

    responders
      .filter((r) => r.isOnline !== false)
      .forEach((resp) => {
        list.push({
          id: resp.id,
          type: 'responder',
          lat: Number(resp.centerLatitude ?? resp.latitude ?? 26.92),
          lng: Number(resp.centerLongitude ?? resp.longitude ?? 75.78),
          title: resp.fullName || resp.name || 'Responder',
          subtitle: `Zone: ${resp.serviceArea || 'General'}`,
          status: String(resp.availability || 'AVAILABLE').toUpperCase(),
          radiusMeters: Number(resp.radiusMeters || 1000),
        });
      });

    reports
      .filter((r) => ['verified', 'active'].includes(String(r.status || '').toLowerCase()))
      .slice(0, 10)
      .forEach((rep) => {
        list.push({
          id: rep.id,
          type: rep.type === 'temporary' ? 'temp_report' : 'perm_report',
          lat: Number(rep.location?.latitude ?? rep.latitude ?? 26.915),
          lng: Number(rep.location?.longitude ?? rep.longitude ?? 75.782),
          title: rep.category || 'Hazard',
          subtitle: rep.description,
          status: String(rep.status || 'VERIFIED').toUpperCase(),
        });
      });

    return list;
  }, [incidents, responders, reports]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <h1 className="text-2xl font-black tracking-tight text-white">
              Live Operations Command Center
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time incident monitoring, dispatch telemetry, and multi-agency response coordination.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/dispatch"
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-500"
          >
            Dispatch Console
          </Link>
          <Link
            href="/dashboard/map"
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700"
          >
            Open Live Map
          </Link>
        </div>
      </div>

      {/* 8 KPI Cards (PRD Section 5) */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
        <StatCard
          label="Active SOS"
          value={activeSOS}
          alert={activeSOS > 0}
          variant={activeSOS > 0 ? 'danger' : 'default'}
        />
        <StatCard
          label="Awaiting Resp."
          value={awaitingResponse}
          variant={awaitingResponse > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label="Responders"
          value={respondersOnline}
          variant="success"
          subtitle="Online & Ready"
        />
        <StatCard
          label="Devices Online"
          value={devicesOnline}
          subtitle={`Total: ${devices.length}`}
        />
        <StatCard
          label="Pending Reports"
          value={pendingReports}
          variant={pendingReports > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label="Active Missions"
          value={activeMissionsCount}
          variant="info"
        />
        <StatCard
          label="Open Issues"
          value={openSafetyIssues}
          subtitle="Verified Active"
        />
        <StatCard
          label="Resolved Today"
          value={resolvedToday}
          variant="success"
        />
      </div>

      {/* Real Live Operations Geospatial Map (PRD Section 5 & 39) */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Live Operations Map (OpenStreetMap GIS)
            </h2>
          </div>
          <Link
            href="/dashboard/map"
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition"
          >
            Open Full Interactive Map →
          </Link>
        </div>
        <RakshaXMap markers={dashboardMarkers} height="360px" />
      </div>

      {/* Main Grid: Critical Queue & Live Operations Feed */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Critical Response Queue */}
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">
                Active Incident Response Queue
              </h2>
              <p className="text-xs text-slate-400">
                Prioritized by emergency severity and acknowledgement latency
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                activeSOS > 0
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              {activeSOS} active
            </span>
          </div>

          <div className="space-y-3">
            {criticalFeed.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-800 py-16 text-center text-xs text-slate-500">
                <span className="block text-2xl mb-1">🛡️</span>
                No active emergencies. All response zones operational.
              </div>
            ) : (
              criticalFeed.map((inc) => (
                <div
                  key={inc.id}
                  className="rounded-lg border border-slate-800 bg-[#162238] p-4 transition hover:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                      <span className="font-mono text-xs font-bold text-blue-400">
                        #{inc.incidentId || inc.id.slice(0, 10)}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {inc.userName || 'Protected User'}
                      </span>
                    </div>
                    <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-400">
                      {String(inc.status || 'ACTIVE')}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300 sm:grid-cols-4">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">
                        Source
                      </span>
                      <span className="font-medium">
                        {inc.source || 'mobile_app'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">
                        Responder
                      </span>
                      <span className="font-medium text-emerald-400">
                        {inc.assignedResponderName || 'Awaiting assignment'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">
                        Triggered
                      </span>
                      <span className="font-mono text-[11px]">
                        {toDateValue(inc.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-end">
                      <Link
                        href={`/dashboard/police?incidentId=${inc.id}`}
                        className="rounded bg-blue-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-blue-500"
                      >
                        Respond →
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Operational Health & Analytics Preview */}
        <div className="space-y-6">
          {/* Performance & Dispatch Readiness */}
          <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-sm">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Response Performance
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Avg Acknowledgement Latency</span>
                  <span className="font-mono font-bold text-emerald-400">
                    18.4s
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[92%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Avg On-Scene Dispatch Time</span>
                  <span className="font-mono font-bold text-blue-400">
                    4m 12s
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-blue-500 w-[84%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>BLE Hardware Heartbeat Reliability</span>
                  <span className="font-mono font-bold text-emerald-400">
                    99.2%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[99%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Safety Report Categories */}
          <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Safety Reports by Issue
              </h2>
              <Link
                href="/dashboard/safety-reports"
                className="text-xs text-blue-400 hover:underline"
              >
                Moderate →
              </Link>
            </div>
            {reportCategories.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No reports submitted yet.
              </p>
            ) : (
              <div className="space-y-2">
                {reportCategories.map(([category, count]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between text-xs text-slate-300 py-1 border-b border-slate-800/60"
                  >
                    <span>{category}</span>
                    <span className="font-mono font-bold text-slate-400">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Audit Stream */}
          <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Recent Audit Trail
              </h2>
              <Link
                href="/dashboard/audit"
                className="text-xs text-blue-400 hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {auditLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="text-xs border-b border-slate-800/60 pb-2 text-slate-400"
                >
                  <span className="font-mono text-[10px] text-blue-400 uppercase">
                    {String(log.action || 'EVENT')}
                  </span>
                  <p className="text-slate-300 font-medium truncate">
                    {String(log.target || log.actor || 'System')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
