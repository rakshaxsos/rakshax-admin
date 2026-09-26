'use client';
import { useState } from 'react';

export default function SettingsAdminPage() {
  const [trackingDomain, setTrackingDomain] = useState('https://rakshaxsos.vercel.app');
  const [gpsUpdateIntervalSec, setGpsUpdateIntervalSec] = useState('8');
  const [defaultReportExpiryDays, setDefaultReportExpiryDays] = useState('7');
  const [autoEscalateOverdueMinutes, setAutoEscalateOverdueMinutes] = useState('15');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-white">
          System Operational Configuration & Policy
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Global dispatch parameters, telemetry streaming frequencies, hazard lifecycles, and security token policies.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Tracking link & privacy policy */}
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Emergency Tracking & Domain Configuration
          </h2>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">
              Live SOS Tracking Web Host (PRD Section 18)
            </label>
            <input
              type="text"
              value={trackingDomain}
              onChange={(e) => setTrackingDomain(e.target.value)}
              className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-800 p-2 font-mono text-white outline-none focus:border-blue-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Format: <code>{trackingDomain}/track/{'{incidentId}'}?token={'{secureToken}'}</code>
            </p>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">
              Active GPS Streaming Interval (Seconds)
            </label>
            <input
              type="number"
              value={gpsUpdateIntervalSec}
              onChange={(e) => setGpsUpdateIntervalSec(e.target.value)}
              className="w-32 rounded-lg border border-slate-700 bg-slate-800 p-2 font-mono text-white outline-none focus:border-blue-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Rate of high-accuracy GPS coordinates emitted to Firestore during active emergency SOS.
            </p>
          </div>
        </div>

        {/* Hazard & Mission Policies */}
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Safety Hazard & Mission Rules
          </h2>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">
              Default Expiry for Temporary Safety Reports (Days)
            </label>
            <input
              type="number"
              value={defaultReportExpiryDays}
              onChange={(e) => setDefaultReportExpiryDays(e.target.value)}
              className="w-32 rounded-lg border border-slate-700 bg-slate-800 p-2 font-mono text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">
              Safety Mission Overdue Prompt Threshold (Minutes)
            </label>
            <input
              type="number"
              value={autoEscalateOverdueMinutes}
              onChange={(e) => setAutoEscalateOverdueMinutes(e.target.value)}
              className="w-32 rounded-lg border border-slate-700 bg-slate-800 p-2 font-mono text-white outline-none focus:border-blue-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Time elapsed after expected arrival before sending contextual safe check-in prompt to user.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-2.5 font-bold text-white hover:bg-blue-500 transition"
          >
            Save Configuration
          </button>
          {saved && (
            <span className="font-bold text-emerald-400 text-xs">
              ✓ System configuration updated successfully.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
