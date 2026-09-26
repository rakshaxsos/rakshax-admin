'use client';

import { useEffect, useState, useMemo } from 'react';
import { watchCollection, type RecordItem } from '../../../lib/firestore';
import RakshaXMap, { type MapMarkerData } from '../../../components/RakshaXMap';

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
  const [showCoverageCircles, setShowCoverageCircles] = useState(true);

  const [selectedEntity, setSelectedEntity] = useState<MapMarkerData | null>(null);

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
        ['active', 'sos_created', 'assigned', 'en_route', 'on_scene', 'new'].includes(
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

  // Markers compilation adhering to PRD Section 4 & 40-42
  const mapMarkers = useMemo(() => {
    const list: MapMarkerData[] = [];

    activeIncidents.forEach((inc) => {
      const lat = Number(inc.currentLocation?.latitude ?? inc.latitude ?? 26.9124);
      const lng = Number(inc.currentLocation?.longitude ?? inc.longitude ?? 75.7873);
      list.push({
        id: inc.id,
        type: 'sos',
        title: `SOS: ${inc.userName || inc.id.slice(0, 8)}`,
        subtitle: `Source: ${inc.source || 'Mobile App'} • Accuracy: ${inc.currentLocation?.accuracy || 12}m`,
        status: String(inc.status || 'ACTIVE').toUpperCase(),
        lat,
        lng,
        accuracy: Number(inc.currentLocation?.accuracy || 15),
        raw: inc,
      });
    });

    tempReports.forEach((rep) => {
      const lat = Number(rep.location?.latitude ?? rep.latitude ?? 26.915);
      const lng = Number(rep.location?.longitude ?? rep.longitude ?? 75.782);
      list.push({
        id: rep.id,
        type: 'temp_report',
        title: rep.category || 'Temporary Hazard',
        subtitle: rep.description || 'Verified hazard reported by community',
        status: String(rep.status || 'VERIFIED').toUpperCase(),
        lat,
        lng,
        raw: rep,
      });
    });

    permReports.forEach((rep) => {
      const lat = Number(rep.location?.latitude ?? rep.latitude ?? 26.908);
      const lng = Number(rep.location?.longitude ?? rep.longitude ?? 75.795);
      list.push({
        id: rep.id,
        type: 'perm_report',
        title: rep.category || 'Permanent Hazard',
        subtitle: rep.description || 'Infrastructure concern requiring resolution',
        status: String(rep.status || 'VERIFIED').toUpperCase(),
        lat,
        lng,
        raw: rep,
      });
    });

    responders.forEach((resp) => {
      const lat = Number(resp.centerLatitude ?? resp.latitude ?? 26.92);
      const lng = Number(resp.centerLongitude ?? resp.longitude ?? 75.78);
      const radiusMeters = Number(resp.radiusMeters || 1000);
      list.push({
        id: resp.id,
        type: 'responder',
        title: resp.fullName || resp.name || 'Authorized Responder',
        subtitle: `Zone: ${resp.serviceArea || resp.zone || 'Central'} • Radius: ${(radiusMeters / 1000).toFixed(1)} km`,
        status: String(resp.availability || resp.verificationStatus || 'AVAILABLE').toUpperCase(),
        lat,
        lng,
        radiusMeters,
        raw: resp,
      });
    });

    safetyPoints.forEach((sp) => {
      const lat = Number(sp.latitude ?? 26.91);
      const lng = Number(sp.longitude ?? 75.79);
      list.push({
        id: sp.id,
        type: 'safety_point',
        title: sp.name || 'Safe Haven',
        subtitle: sp.category || 'Official Safety Resource',
        status: 'ACTIVE',
        lat,
        lng,
        raw: sp,
      });
    });

    return list;
  }, [activeIncidents, tempReports, permReports, responders, safetyPoints]);

  return (
    <div className="space-y-6">
      {/* Header & Layer Toggles (PRD Section 4, 40-42) */}
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <h1 className="text-2xl font-black text-white">
              RakshaX Operational Geospatial Map
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Unified GIS intelligence powered by OpenStreetMap: active SOS incidents, responder coverage radiuses, and verified hazard layers.
          </p>
        </div>

        {/* Layer Filters */}
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
            onClick={() => setShowCoverageCircles(!showCoverageCircles)}
            className={`rounded-lg px-3 py-1.5 font-bold transition flex items-center gap-1.5 ${
              showCoverageCircles
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            <span>⭕</span>
            Coverage Radiuses
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

      {/* Map Workspace Layout */}
      <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        {/* Real Unified OpenStreetMap Visualizer */}
        <RakshaXMap
          markers={mapMarkers}
          height="580px"
          showActiveSOS={showActiveSOS}
          showTempReports={showTempReports}
          showPermReports={showPermReports}
          showResponders={showResponders}
          showSafetyPoints={showSafetyPoints}
          showCoverageCircles={showCoverageCircles}
          selectedMarkerId={selectedEntity?.id}
          onMarkerClick={(m) => setSelectedEntity(m)}
        />

        {/* Selected Entity Inspector & Visible Objects List */}
        <div className="flex flex-col rounded-2xl border border-slate-800 bg-[#0F172A] p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Entity Inspector
          </h2>

          {selectedEntity ? (
            <div className="mt-4 space-y-4 rounded-xl border border-slate-700/60 bg-[#162238] p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="rounded bg-blue-500/20 px-2 py-0.5 font-bold uppercase tracking-wider text-blue-400 text-[10px]">
                  {selectedEntity.type.replace('_', ' ')}
                </span>
                {selectedEntity.status && (
                  <span className="font-mono text-emerald-400 font-bold uppercase text-[10px]">
                    {selectedEntity.status}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-white">
                  {selectedEntity.title}
                </h3>
                {selectedEntity.subtitle && (
                  <p className="mt-1 text-slate-400">{selectedEntity.subtitle}</p>
                )}
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

              {selectedEntity.radiusMeters && (
                <div className="border-t border-slate-700/60 pt-2 text-slate-400 font-mono text-[11px]">
                  Coverage Radius: {(selectedEntity.radiusMeters / 1000).toFixed(1)} km ({selectedEntity.radiusMeters}m)
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="w-full rounded-lg bg-slate-800 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Clear Inspector Selection
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
              Click any pin or coverage circle on the map to inspect real telemetry and records.
            </div>
          )}

          {/* Active Objects List */}
          <div className="mt-6 flex-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Visible Map Objects ({mapMarkers.length})
            </h3>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {mapMarkers.slice(0, 15).map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedEntity(m)}
                  className="cursor-pointer rounded-lg border border-slate-800 bg-[#162238]/60 p-2.5 transition hover:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          m.type === 'sos'
                            ? 'bg-red-500'
                            : m.type === 'temp_report'
                            ? 'bg-orange-500'
                            : m.type === 'perm_report'
                            ? 'bg-yellow-400'
                            : m.type === 'responder'
                            ? 'bg-emerald-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <span className="font-bold text-white text-xs truncate max-w-[160px]">
                        {m.title}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase">
                      {m.type.replace('_', ' ')}
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
