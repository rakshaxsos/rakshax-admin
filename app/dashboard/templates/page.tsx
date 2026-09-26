'use client';
import { useState } from 'react';
import DataTable from '../../../components/DataTable';

const DEFAULT_TEMPLATES = [
  {
    id: 'TPL-SMS-01',
    channel: 'SMS',
    name: 'Emergency SOS Broadcast with Tracking URL',
    content:
      '🆘 EMERGENCY — {{userName}} needs immediate help!\nTrack live GPS: {{trackingUrl}}\nIncident: {{incidentId}}\nSent via RakshaX Safety Network',
  },
  {
    id: 'TPL-PUSH-01',
    channel: 'PUSH',
    name: 'Nearby Verified Safety Alert',
    content:
      '⚠️ Safety Alert Nearby — A verified safety issue ({{category}}) has been confirmed near your location. Tap to view on RakshaX Map.',
  },
  {
    id: 'TPL-PUSH-02',
    channel: 'PUSH',
    name: 'Mission Overdue Check-in Escalation',
    content:
      '⏰ Safety Mission Overdue: You have passed your expected arrival at {{destination}}. Please tap "I am Safe" or request help.',
  },
  {
    id: 'TPL-SMS-02',
    channel: 'SMS',
    name: 'Safe Check-in Confirmation',
    content:
      '✅ RakshaX Safe Check-in: {{userName}} checked in safely at {{timestamp}} during mission {{missionId}}.',
  },
];

export default function TemplatesAdminPage() {
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);

  const rows = templates.map((t) => [
    <div key="id" className="font-mono text-xs font-bold text-blue-400">
      {t.id}
    </div>,
    <div key="chan">
      <span
        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
          t.channel === 'SMS'
            ? 'bg-amber-500/20 text-amber-400'
            : 'bg-blue-500/20 text-blue-400'
        }`}
      >
        {t.channel}
      </span>
    </div>,
    <div key="name" className="text-xs font-bold text-white">
      {t.name}
    </div>,
    <div key="content" className="font-mono text-[11px] text-slate-300 max-w-sm truncate">
      {t.content}
    </div>,
    <div key="status">
      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
        ACTIVE
      </span>
    </div>,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">
          Emergency Dispatch Communication Templates
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Standardized SMS and FCM push dispatch templates equipped with live GPS tracking URL token interpolation.
        </p>
      </div>

      <DataTable
        columns={['Template ID', 'Channel', 'Name', 'Message Format', 'Status']}
        rows={rows}
      />
    </div>
  );
}
