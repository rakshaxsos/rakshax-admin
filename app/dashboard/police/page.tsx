'use client';

import { useEffect, useState } from 'react';
import DataTable from '../../../components/DataTable';
import { watchCollection, type RecordItem } from '../../../lib/firestore';

const toDateValue = (value: unknown) => {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  return new Date();
};

export default function PoliceConsolePage() {
  const [incidents, setIncidents] = useState<RecordItem[]>([]);

  useEffect(() => {
    const unsubscribe = watchCollection('incidents', setIncidents, 'createdAt');
    return unsubscribe;
  }, []);

  const activeIncidents = incidents.filter(
    (item) => !['idle', 'resolved', 'cancelled', 'failed'].includes(String(item.status)),
  );

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-bold uppercase tracking-widest text-signal">Emergency response</p>
        <h1 className="mt-2 text-4xl font-bold text-navy">Police Console</h1>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Open calls</p>
          <p className="mt-3 text-3xl font-black text-navy">{activeIncidents.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Priority</p>
          <p className="mt-3 text-3xl font-black text-red-600">
            {activeIncidents.filter((item) => String(item.priority || '').toLowerCase() === 'high').length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Avg response</p>
          <p className="mt-3 text-3xl font-black text-navy">4.8m</p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-navy">Dispatch queue</h2>
        <DataTable
          columns={['Incident', 'Location', 'Priority', 'Status', 'Updated']}
          rows={activeIncidents.map((item) => [
            item.incidentId || item.id,
            `${item.latitude ?? 'N/A'}, ${item.longitude ?? 'N/A'}`,
            String(item.priority || 'normal'),
            String(item.status || 'active'),
            String(toDateValue(item.updatedAt || item.createdAt)).slice(0, 21),
          ])}
        />
      </section>
    </>
  );
}
