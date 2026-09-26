'use client';
import DataTable from '../../../components/DataTable';

const INTEGRATIONS = [
  {
    name: 'Firebase Cloud Messaging (FCM v1)',
    type: 'Mobile Push Notifications',
    status: 'CONNECTED',
    latency: '34ms',
    uptime: '99.98%',
    desc: 'High-priority APNs & Google Play Services push dispatch for distress broadcasts.',
  },
  {
    name: 'OpenStreetMap & CartoGIS',
    type: 'Geospatial Cartography',
    status: 'ACTIVE',
    latency: '112ms',
    uptime: '99.95%',
    desc: 'Tile caching layer and coordinate reverse geocoding for hazard mapping.',
  },
  {
    name: 'RakshaX ESP32 BLE GATT Protocol',
    type: 'Hardware Interface',
    status: 'CONNECTED',
    latency: '&lt; 15ms',
    uptime: '100.0%',
    desc: 'Encrypted Bluetooth Low Energy peripheral packet handshake (UUID 0xFFE0).',
  },
  {
    name: 'National Emergency 112 Gateway',
    type: 'PSAP Telephony & CAD Hook',
    status: 'READY',
    latency: '140ms',
    uptime: '99.99%',
    desc: 'Device emergency-call trigger fallback and operator handoff integration.',
  },
  {
    name: 'Cloud Firestore Realtime Sync',
    type: 'State Synchronization',
    status: 'CONNECTED',
    latency: '18ms',
    uptime: '100.0%',
    desc: 'Real-time WebSocket snapshot listeners for incident coordination.',
  },
];

export default function IntegrationsAdminPage() {
  const rows = INTEGRATIONS.map((item) => [
    <div key="name">
      <div className="font-bold text-white text-xs">{item.name}</div>
      <div className="text-[11px] text-slate-400">{item.desc}</div>
    </div>,
    <div key="type">
      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
        {item.type}
      </span>
    </div>,
    <div key="status">
      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-400">
        {item.status}
      </span>
    </div>,
    <div key="lat" className="font-mono text-xs text-slate-300">
      {item.latency}
    </div>,
    <div key="up" className="font-mono text-xs text-emerald-400">
      {item.uptime}
    </div>,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">
          External Infrastructure & Gateway Integrations
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Telemetry health, operational latency, and connection states for carrier networks, mapping services, and emergency gateways.
        </p>
      </div>

      <DataTable
        columns={[
          'Service Integration',
          'Protocol / Layer',
          'Link Status',
          'Network Latency',
          'SLA Uptime',
        ]}
        rows={rows}
      />
    </div>
  );
}
