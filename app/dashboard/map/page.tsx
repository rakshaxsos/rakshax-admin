'use client';
import { useEffect, useState, useMemo } from 'react';
import { watchCollection, type RecordItem } from '../../../lib/firestore';

export default function RakshaXMapPage() {
  const [incidents, setIncidents] = useState<RecordItem[]>([]);
  const [reports, setReports] = useState<RecordItem[]>([]);
  const [responders, setResponders] = useState<RecordItem[]>([]);
  const [safetyPoints, setSafetyPoints] = useState<RecordItem[]>([]);

  // Layer filters
  const [showActiveSOS, setShowActiveSOS] = useState(true);
  const [showTempReports, setShowTempReports] = useState(true);
  const [showPermReports, setShowPermReports] = useState(true);
  const [showResponders, setShowResponders] = useState(true);
  const [showSafetyPoints, setShowSafetyPoints] = useState(true);

  const [selectedEntity, setSelectedEntity] = useState<{
    type: string;
    title: string;
    subtitle: string;
    status: string;
    lat: number;
    lng: number;
    extra?: Record<string, any>;
  } | null>(null);

  useEffect(() => {
    const unsubs = [
      watchCollection('incidents', setIncidents),
      watchCollection('mapReports', setReports),
      watchCollection('responders', setResponders),
      watchCollection('safetyPoints', setSafetyPoints),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const activeIncidents = useMemo(
    () =>
      incidents.filter((i) =>
        ['active', 'sos_created', 'assigned', 'en_route', 'on_scene'].includes(
          String(i.status || '').toLowerCase(),
        ),
      ),
    [incidents],
  );

  const tempReports = useMemo(
    () =>
      reports.filter(
        (r) =>
          r.type === 'temporary' &&
          ['verified', 'active'].includes(String(r.status || '').toLowerCase()),
      ),
    [reports],
  );

  const permReports = useMemo(
    () =>
      reports.filter(
        (r) =>
          r.type !== 'temporary' &&
          ['verified', 'active'].includes(String(r.status || '').toLowerCase()),
      ),
    [reports],
  );

  // Markers compilation
  const markers = useMemo(() => {
    const list: Array<{
      id: string;
      type: string;
      color: string;
      bg: string;
      title: string;
      subtitle: string;
      status: string;
      lat: number;
      lng: number;
      data: RecordItem;
    }> = [];

    if (showActiveSOS) {
      activeIncidents.forEach((inc) => {
        const lat = Number(inc.currentLocation?.latitude ?? inc.latitude ?? 26.9124);
        const lng = Number(inc.currentLocation?.longitude ?? inc.longitude ?? 75.7873);
        list.push({
          id: inc.id,
          type: 'Active SOS',
          color: 'text-red-400',
          bg: 'bg-red-500',
          title: `SOS: ${inc.userName || inc.id}`,
          subtitle: `Source: ${inc.source || 'Mobile'} • Accuracy: ${inc.currentLocation?.accuracy || 12}m`,
          status: inc.status || 'ACTIVE',
          lat,
          lng,
          data: inc,
        });
      });
    }

    if (showTempReports) {
      tempReports.forEach((rep) => {
        const lat = Number(rep.location?.latitude ?? rep.latitude ?? 26.915);
        const lng = Number(rep.location?.longitude ?? rep.longitude ?? 75.782);
        list.push({
          id: rep.id,
          type: 'Temporary Issue',
          color: 'text-amber-400',
          bg: 'bg-amber-500',
          title: rep.category || 'Temporary Hazard',
          subtitle: rep.description || 'Temporary safety issue',
          status: rep.status || 'VERIFIED',
          lat,
          lng,
          data: rep,
        });
      });
    }

    if (showPermReports) {
      permReports.forEach((rep) => {
        const lat = Number(rep.location?.latitude ?? rep.latitude ?? 26.908);
        const lng = Number(rep.location?.longitude ?? rep.longitude ?? 75.795);
        list.push({
          id: rep.id,
          type: 'Permanent Issue',
          color: 'text-yellow-400',
          bg: 'bg-yellow-500',
          title: rep.category || 'Permanent Hazard',
          subtitle: rep.description || 'Infrastructure concern',
          status: rep.status || 'VERIFIED',
          lat,
          lng,
          data: rep,
        });
      });
    }

    if (showResponders) {
      responders.forEach((resp) => {
        const lat = Number(resp.latitude ?? 26.92);
        const lng = Number(resp.longitude ?? 75.78);
        list.push({
          id: resp.id,
          type: 'Authorized Responder',
          color: 'text-emerald-400',
          bg: 'bg-emerald-500',
          title: resp.name || 'Authorized Responder',
          subtitle: `Zone: ${resp.zone || 'Central'} • ${resp.phone || 'Available'}`,
          status: resp.verificationStatus || 'APPROVED',
          lat,
          lng,
          data: resp,
        });
      });
    }

    if (showSafetyPoints) {
      safetyPoints.forEach((sp) => {
        const lat = Number(sp.latitude ?? 26.91);
        const lng = Number(sp.longitude ?? 75.79);
        list.push({
          id: sp.id,
          type: 'Safety Point',
          color: 'text-blue-400',
          bg: 'bg-blue-500',
          title: sp.name || 'Safe Haven',
          subtitle: sp.category || 'Official Safety Resource',
          status: 'ACTIVE',
          lat,
          lng,
          data: sp,
        });
      });
    }

    return list;
  }, [
    showActiveSOS,
    showTempReports,
    showPermReports,
    showResponders,
    showSafetyPoints,
    activeIncidents,
    tempReports,
    permReports,
    responders,
    safetyPoints,
  ]);

  return (
    <div className="space-y-6">
      {/* Header & Layer Toggles */}
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <h1 className="text-2xl font-black text-white">
              RakshaX Operational Geospatial Map
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time geospatial intelligence, active SOS locations, responder tracking, and verified hazard layers.
          </p>
        </div>

        {/* Layer Filters (PRD Section 3 & 4) */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setShowActiveSOS(!showActiveSOS)}
            className={`rounded-lg px-3 py-1.5 font-bold transition flex items-center gap-1.5 ${
              showActiveSOS
                ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Active SOS ({activeIncidents.length})
          </button>

          <button
            onClick={() => setShowTempReports(!showTempReports)}
            className={`rounded-lg px-3 py-1.5 font-bold transition flex items-center gap-1.5 ${
              showTempReports
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Temporary Issues ({tempReports.length})
          </button>

          <button
            onClick={() => setShowPermReports(!showPermReports)}
            className={`rounded-lg px-3 py-1.5 font-bold transition flex items-center gap-1.5 ${
              showPermReports
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
            Permanent Issues ({permReports.length})
          </button>

          <button
            onClick={() => setShowResponders(!showResponders)}
            className={`rounded-lg px-3 py-1.5 font-bold transition flex items-center gap-1.5 ${
              showResponders
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Responders ({responders.length})
          </button>

          <button
            onClick={() => setShowSafetyPoints(!showSafetyPoints)}
            className={`rounded-lg px-3 py-1.5 font-bold transition flex items-center gap-1.5 ${
              showSafetyPoints
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Safety Points ({safetyPoints.length})
          </button>
        </div>
      </div>

      {/* Map Radar Workspace */}
      <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        {/* Interactive Map Visualizer */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-[#070D19] p-6 shadow-2xl min-h-[520px]">
          {/* Top overlay controls */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 rounded-lg bg-slate-900/90 px-3 py-1.5 border border-slate-800 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Telemetry Feed Active • OpenStreetMap GIS Grid</span>
            </div>
            <div className="rounded-lg bg-slate-900/90 px-3 py-1.5 border border-slate-800 text-slate-400 font-mono">
              Center: 26.9124° N, 75.7873° E
            </div>
          </div>

          {/* Central Radar / Pin Visualization Area */}
          <div className="relative my-auto flex items-center justify-center py-10">
            {/* Concentric radar rings */}
            <div className="absolute h-96 w-96 rounded-full border border-blue-500/10 pointer-events-none" />
            <div className="absolute h-64 w-64 rounded-full border border-blue-500/15 pointer-events-none" />
            <div className="absolute h-32 w-32 rounded-full border border-blue-500/20 pointer-events-none" />
            <div className="absolute h-2 w-2 rounded-full bg-blue-500 pointer-events-none" />

            {/* Plotted markers */}
            <div className="relative w-full max-w-lg h-80">
              {markers.slice(0, 15).map((m, idx) => {
                // Distribute pins across radar coordinates
                const angle = (idx * (360 / Math.max(markers.length, 6)) * Math.PI) / 180;
                const radius = 60 + ((idx * 27) % 90);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                  <button
                    key={m.id + idx}
                    onClick={() =>
                      setSelectedEntity({
                        type: m.type,
                        title: m.title,
                        subtitle: m.subtitle,
                        status: m.status,
                        lat: m.lat,
                        lng: m.lng,
                        extra: m.data,
                      })
                    }
                    style={{
                      transform: `translate(${x + 180}px, ${y + 120}px)`,
                    }}
                    className={`absolute group flex items-center gap-1 rounded-full p-1.5 transition-all hover:scale-125 hover:z-20 ${
                      m.bg
                    } shadow-lg`}
                    title={`${m.type}: ${m.title}`}
                  >
                    <span className="h-3 w-3 rounded-full bg-white/90" />
                    <span className="hidden group-hover:block absolute left-6 whitespace-nowrap rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white border border-slate-700 shadow">
                      {m.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Map Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                Red: Emergency SOS
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Orange: Temporary
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                Yellow: Permanent
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Green: Responder
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                Blue: Safety Point
              </span>
            </div>
            <div className="font-mono text-[10px] text-slate-500">
              {markers.length} objects plotted
            </div>
          </div>
        </div>

        {/* Selected Pin Details / Marker List Drawer */}
        <div className="flex flex-col rounded-2xl border border-slate-800 bg-[#0F172A] p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Entity Inspector
          </h2>

          {selectedEntity ? (
            <div className="mt-4 space-y-4 rounded-xl border border-slate-700/60 bg-[#162238] p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="rounded bg-blue-500/20 px-2 py-0.5 font-bold uppercase tracking-wider text-blue-400 text-[10px]">
                  {selectedEntity.type}
                </span>
                <span className="font-mono text-emerald-400 font-bold uppercase text-[10px]">
                  {selectedEntity.status}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">
                  {selectedEntity.title}
                </h3>
                <p className="mt-1 text-slate-400">{selectedEntity.subtitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-700/60 pt-3 font-mono text-[11px] text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">
                    Latitude
                  </span>
                  <span>{selectedEntity.lat.toFixed(5)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">
                    Longitude
                  </span>
                  <span>{selectedEntity.lng.toFixed(5)}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="w-full rounded-lg bg-slate-800 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
              Click any pin on the map or select from the live list below to inspect telemetry.
            </div>
          )}

          {/* Active Objects List */}
          <div className="mt-6 flex-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Visible Map Objects ({markers.length})
            </h3>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {markers.slice(0, 10).map((m) => (
                <div
                  key={m.id}
                  onClick={() =>
                    setSelectedEntity({
                      type: m.type,
                      title: m.title,
                      subtitle: m.subtitle,
                      status: m.status,
                      lat: m.lat,
                      lng: m.lng,
                      extra: m.data,
                    })
                  }
                  className="cursor-pointer rounded-lg border border-slate-800 bg-[#162238]/60 p-2.5 transition hover:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${m.bg}`} />
                      <span className="font-bold text-white text-xs truncate max-w-[160px]">
                        {m.title}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {m.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
