'use client';
import { useEffect, useMemo, useState } from 'react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import { watchCollection, type RecordItem } from '../../lib/firestore';

const toDateValue = (value: unknown) => {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  return new Date();
};

export default function Dispatch() {
  const [incidents, setIncidents] = useState<RecordItem[]>([]);
  const [users, setUsers] = useState<RecordItem[]>([]);
  const [responders, setResponders] = useState<RecordItem[]>([]);

  useEffect(() => {
    const a = watchCollection('incidents', setIncidents, 'createdAt');
    const b = watchCollection('users', setUsers, 'createdAt');
    const c = watchCollection('responders', setResponders, 'updatedAt');
    return () => {
      a();
      b();
      c();
    };
  }, []);

  const active = useMemo(
    () => incidents.filter((item) => !['idle', 'resolved', 'cancelled', 'failed'].includes(String(item.status))).length,
    [incidents],
  );

  const critical = useMemo(
    () => incidents.filter((item) => !['idle', 'resolved', 'cancelled', 'failed'].includes(String(item.status))).slice(0, 5),
    [incidents],
  );

  const regionLoad = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of incidents) {
      const region = String(item.region || item.serviceArea || 'Unassigned');
      map.set(region, (map.get(region) ?? 0) + 1);
    }
    return Array.from(map.entries()).slice(0, 4);
  }, [incidents]);

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-bold uppercase tracking-widest text-signal">Live operations</p>
        <h1 className="mt-2 text-4xl font-bold text-navy">RakshaX Command Center</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Active SOS" value={active} alert={active > 0} />
        <StatCard label="Total users" value={users.length} />
        <StatCard label="Responders" value={responders.length} />
        <StatCard label="Resolved" value={incidents.filter((item) => item.status === 'resolved').length} />
        <StatCard label="Incidents" value={incidents.length} />
      </div>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-navy">Critical response queue</h2>
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">{active} live</span>
          </div>
          <div className="space-y-3">
            {critical.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                No active incidents. Systems are stable.
              </div>
            ) : (
              critical.map((incident) => (
                <div key={incident.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-navy">#{incident.incidentId || incident.id}</p>
                      <p className="text-sm text-slate-500">{incident.userName || 'Unknown user'}</p>
                    </div>
                    <span className="rounded-lg bg-red-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700">
                      {String(incident.status || 'active')}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                    <span>Source: {incident.source || 'mobile'}</span>
                    <span>Created: {String(toDateValue(incident.createdAt)).slice(0, 21)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-navy">Regional load</h2>
          <div className="mt-4 space-y-3">
            {regionLoad.length === 0 ? (
              <div className="text-sm text-slate-500">Waiting for activity data.</div>
            ) : (
              regionLoad.map(([region, count]) => (
                <div key={region}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{region}</span>
                    <span className="font-bold text-navy">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-navy" style={{ width: `${Math.min(count * 30, 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold text-navy">Active emergencies</h2>
        <DataTable
          columns={['Incident', 'User', 'Status', 'Source', 'Created']}
          rows={incidents
            .filter((item) => !['idle', 'resolved', 'cancelled', 'failed'].includes(String(item.status)))
            .map((item) => [
              item.incidentId || item.id,
              item.userName || 'Unknown',
              String(item.status || 'unknown'),
              item.source || 'mobile',
              String(toDateValue(item.createdAt)).slice(0, 21),
            ])}
        />
      </section>
    </>
  );
}
