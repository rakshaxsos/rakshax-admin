'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  watchCollection,
  addItem,
  deleteItem,
  type RecordItem,
} from '../../../lib/firestore';
import DataTable from '../../../components/DataTable';
import StatCard from '../../../components/StatCard';

export default function OrganizationsAdminPage() {
  const [orgs, setOrgs] = useState<RecordItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState('University Campus');
  const [sector, setSector] = useState('');
  const [pocName, setPocName] = useState('');
  const [pocPhone, setPocPhone] = useState('');

  useEffect(() => {
    return watchCollection('organizations', setOrgs, 'createdAt');
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await addItem('organizations', {
      name,
      type,
      sector,
      pocName,
      pocPhone,
      status: 'active',
      memberCount: 250,
    });
    setShowAddModal(false);
    setName('');
    setSector('');
    setPocName('');
    setPocPhone('');
  };

  const rows = useMemo(() => {
    return orgs.map((o) => [
      <div key="name">
        <div className="font-bold text-white text-xs">{o.name}</div>
        <div className="text-[11px] text-slate-400">{o.sector || 'Main Campus'}</div>
      </div>,
      <div key="type">
        <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
          {o.type || 'Enterprise'}
        </span>
      </div>,
      <div key="poc" className="text-xs text-slate-300">
        <div>{o.pocName || 'Security Lead'}</div>
        <div className="font-mono text-[10px] text-slate-400">{o.pocPhone || '—'}</div>
      </div>,
      <div key="status">
        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-400">
          {o.status || 'ACTIVE'}
        </span>
      </div>,
      <div key="actions">
        <button
          onClick={() => deleteItem('organizations', o.id)}
          className="rounded bg-slate-800 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
        >
          Remove
        </button>
      </div>,
    ]);
  }, [orgs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-black text-white">
            Institutional Organizations & Safety Partners
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Enterprise campuses, transit authorities, university security networks, and municipal emergency partnerships.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition"
        >
          + Add Organization
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Affiliated Institutions" value={orgs.length || 6} />
        <StatCard label="Covered Populations" value="48,500+" variant="success" />
        <StatCard label="Designated Response Zones" value="14 Sectors" variant="info" />
      </div>

      <DataTable
        columns={['Organization & Sector', 'Type', 'Security Officer (POC)', 'Status', 'Actions']}
        rows={rows}
        emptyMessage="No partner organizations created yet."
      />

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0F172A] p-6 text-slate-200 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Add Institutional Partner</h2>
            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Organization Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. National Institute of Technology"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Entity Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                >
                  <option value="University Campus">University Campus</option>
                  <option value="Corporate Tech Park">Corporate Tech Park</option>
                  <option value="Transit Authority">Transit Authority</option>
                  <option value="Hospital Network">Hospital Network</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Assigned Sector / Area</label>
                <input
                  type="text"
                  placeholder="e.g. North Zone - Campus Sector 1"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Security Lead Name</label>
                  <input
                    type="text"
                    placeholder="Chief Security Officer"
                    value={pocName}
                    onChange={(e) => setPocName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Hotline / Mobile</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={pocPhone}
                    onChange={(e) => setPocPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-500"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
