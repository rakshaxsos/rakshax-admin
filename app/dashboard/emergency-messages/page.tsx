'use client';
import { useEffect, useState } from 'react';
import {
  watchCollection,
  addItem,
  logAuditEvent,
  type RecordItem,
} from '../../../lib/firestore';

export default function EmergencyMessagesAdminPage() {
  const [reports, setReports] = useState<RecordItem[]>([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [radiusKm, setRadiusKm] = useState('2.5');
  const [alertTitle, setAlertTitle] = useState('⚠️ Safety Alert Nearby');
  const [alertBody, setAlertBody] = useState(
    'A verified safety hazard has been confirmed near your current area. Exercise caution.',
  );
  const [broadcastLog, setBroadcastLog] = useState<string[]>([]);
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    return watchCollection('mapReports', setReports, 'createdAt');
  }, []);

  const verifiedReports = reports.filter(
    (r) => String(r.status).toLowerCase() === 'verified',
  );

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportId) return;
    setBroadcasting(true);
    try {
      const rep = reports.find((r) => r.id === selectedReportId);
      await addItem('notifications', {
        title: alertTitle,
        body: `${alertBody} [Category: ${rep?.category || 'Hazard'}]`,
        targetAudience: `GEOPOLYGON_RADIUS_${radiusKm}KM`,
        status: 'broadcasted',
        reportId: selectedReportId,
        sentAt: new Date(),
      });
      await logAuditEvent(
        'admin',
        'ADMIN',
        'NEARBY_SAFETY_ALERT_TRIGGERED',
        `Report #${selectedReportId}`,
        { radiusKm, alertTitle },
      );
      setBroadcastLog((prev) => [
        `[${new Date().toLocaleTimeString()}] Broadcasted "${alertTitle}" to users within ${radiusKm}km radius of report #${selectedReportId.slice(0, 8)}`,
        ...prev,
      ]);
      alert('Geofenced emergency broadcast transmitted successfully.');
    } catch (err) {
      console.error(err);
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">
          Nearby Geofenced Emergency Alert Dispatcher
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Trigger targeted safety alerts to citizens and nearby responders within a geofenced radius of a verified safety incident.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Form */}
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
            Geofenced Alert Parameters
          </h2>
          <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Select Verified Incident / Safety Report
              </label>
              <select
                required
                value={selectedReportId}
                onChange={(e) => {
                  setSelectedReportId(e.target.value);
                  const found = reports.find((r) => r.id === e.target.value);
                  if (found) {
                    setAlertBody(
                      `⚠️ Verified ${found.category}: "${found.description || 'Hazard reported'}". Stay alert.`,
                    );
                  }
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
              >
                <option value="">Select verified report...</option>
                {verifiedReports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.category} — {r.description?.slice(0, 40) || r.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Geofence Radius (Kilometers)
              </label>
              <div className="flex gap-2">
                {['1.0', '2.5', '5.0', '10.0'].map((rad) => (
                  <button
                    key={rad}
                    type="button"
                    onClick={() => setRadiusKm(rad)}
                    className={`rounded-lg px-3 py-1 font-bold ${
                      radiusKm === rad
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {rad} km
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Notification Headline
              </label>
              <input
                required
                type="text"
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Broadcast Body Text
              </label>
              <textarea
                required
                rows={3}
                value={alertBody}
                onChange={(e) => setAlertBody(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={broadcasting || !selectedReportId}
              className="w-full rounded-lg bg-red-600 py-3 font-bold text-white hover:bg-red-500 transition disabled:opacity-50"
            >
              {broadcasting ? 'Transmitting Geofence Alert...' : '🚀 Broadcast Geofence Alert'}
            </button>
          </form>
        </div>

        {/* Live Broadcast Feed */}
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
            Geofence Dispatch Stream
          </h2>
          {broadcastLog.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-800 p-12 text-center text-xs text-slate-500">
              No geofence broadcasts triggered in this session.
            </div>
          ) : (
            <div className="space-y-2 text-xs font-mono">
              {broadcastLog.map((log, idx) => (
                <div key={idx} className="rounded bg-[#162238] p-2.5 text-emerald-400 border border-slate-800">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
