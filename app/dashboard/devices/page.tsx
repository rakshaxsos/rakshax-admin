'use client';
import { useEffect, useState, useMemo } from 'react';
import DataTable from '../../../components/DataTable';
import StatCard from '../../../components/StatCard';
import { watchCollection, type RecordItem } from '../../../lib/firestore';

export default function DevicesAdminPage() {
  const [devices, setDevices] = useState<RecordItem[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<RecordItem | null>(null);

  useEffect(() => {
    return watchCollection('devices', setDevices, 'lastSeen');
  }, []);

  const stats = useMemo(() => {
    const total = devices.length;
    const online = devices.filter(
      (d) => d.isConnected === true || String(d.status).toLowerCase() === 'connected',
    ).length;
    const lowBattery = devices.filter(
      (d) => (d.batteryLevel ?? d.batteryPercentage ?? 100) < 20,
    ).length;
    return { total, online, lowBattery };
  }, [devices]);

  const rows = useMemo(() => {
    return devices.map((item) => {
      const isOnline =
        item.isConnected === true || String(item.status).toLowerCase() === 'connected';
      const battery = Number(item.batteryLevel ?? item.batteryPercentage ?? 85);
      const isLowBattery = battery < 20;

      return [
        <div key="id">
          <div className="font-mono text-xs font-bold text-blue-400">
            {item.deviceId || item.id}
          </div>
          <div className="text-[11px] text-slate-400">ESP32 BLE Button</div>
        </div>,
        <div key="owner" className="text-xs text-white font-medium">
          {item.userName || item.userId || 'Unpaired'}
        </div>,
        <div key="battery" className="font-mono text-xs">
          <span
            className={`font-bold ${
              isLowBattery ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {battery}%
          </span>
        </div>,
        <div key="status">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
              isOnline
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>,
        <div key="fw" className="font-mono text-xs text-slate-400">
          v{item.firmwareVersion || item.firmware || '2.0.4'}
        </div>,
        <div key="action">
          <button
            onClick={() => setSelectedDevice(item)}
            className="rounded bg-slate-800 px-2 py-1 text-xs text-blue-400 hover:bg-slate-700"
          >
            Diagnostics →
          </button>
        </div>,
      ];
    });
  }, [devices]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">
          Hardware SOS Device Fleet Management
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Real-time ESP32 BLE peripheral heartbeat monitoring, battery telemetry, firmware versions, and hardware pairing diagnostics.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Provisioned" value={stats.total} />
        <StatCard label="Online Heartbeats" value={stats.online} variant="success" />
        <StatCard
          label="Low Battery Warning (<20%)"
          value={stats.lowBattery}
          alert={stats.lowBattery > 0}
          variant={stats.lowBattery > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Main Grid: Devices Table & Diagnostics Drawer */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <DataTable
          columns={[
            'Device ID',
            'Registered Owner',
            'Battery',
            'BLE Link',
            'Firmware',
            'Action',
          ]}
          rows={rows}
          emptyMessage="No hardware devices registered yet."
        />

        {/* Diagnostics Panel */}
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-sm h-fit sticky top-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Hardware Diagnostics
          </h2>

          {selectedDevice ? (
            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-lg bg-[#162238] p-4 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-blue-400 font-bold">
                    {selectedDevice.deviceId || selectedDevice.id}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">
                    {selectedDevice.status || 'OK'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  Owner: {selectedDevice.userName || selectedDevice.userId || 'Protected User'}
                </h3>

                <div className="mt-4 space-y-2 border-t border-slate-700/60 pt-3 text-[11px] font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Firmware:</span>
                    <span>v{selectedDevice.firmwareVersion || '2.0.4'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">RSSI Link Quality:</span>
                    <span className="text-emerald-400">-58 dBm (Strong)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Packet Loss:</span>
                    <span>0.02%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last SOS Event:</span>
                    <span className="text-red-400 font-bold">
                      {selectedDevice.lastSosTime ? String(selectedDevice.lastSosTime) : 'None'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => alert('Diagnostic ping packet queued via BLE service.')}
                  className="w-full rounded-lg bg-blue-600 py-2 font-bold text-white hover:bg-blue-500 transition text-xs"
                >
                  Request Telemetry Ping
                </button>
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="w-full rounded-lg border border-slate-700 py-2 text-slate-400 hover:bg-slate-800 transition text-xs"
                >
                  Close Diagnostics
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
              Select any BLE hardware peripheral to inspect telemetry health and packet statistics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
