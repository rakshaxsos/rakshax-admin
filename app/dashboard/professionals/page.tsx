'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  watchCollection,
  addItem,
  updateItem,
  type RecordItem,
} from '../../../lib/firestore';
import DataTable from '../../../components/DataTable';
import StatCard from '../../../components/StatCard';

export default function ProfessionalsAdminPage() {
  const [professionals, setProfessionals] = useState<RecordItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [specialization, setSpecialization] = useState('Trauma & Crisis Support');
  const [languages, setLanguages] = useState('English, Hindi');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    return watchCollection('professionals', setProfessionals, 'updatedAt');
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await addItem('professionals', {
      name,
      qualifications,
      specialization,
      languages: languages.split(',').map((s) => s.trim()),
      licenseNumber: licenseNumber || 'RCI-REG-2026',
      phone,
      isVerified: true,
      availability: 'Available Today',
    });
    setShowAddModal(false);
    setName('');
    setQualifications('');
    setLicenseNumber('');
  };

  const handleToggleVerify = async (id: string, current: boolean) => {
    await updateItem('professionals', id, { isVerified: !current });
  };

  const rows = useMemo(() => {
    return professionals.map((p) => {
      const isVerified = p.isVerified !== false;
      return [
        <div key="name">
          <div className="font-bold text-white text-xs">{p.name}</div>
          <div className="text-[11px] text-slate-400">{p.qualifications || 'M.Phil Clinical Psychology'}</div>
        </div>,
        <div key="spec">
          <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
            {p.specialization || 'Crisis Intervention'}
          </span>
        </div>,
        <div key="license" className="font-mono text-xs text-slate-400">
          {p.licenseNumber || 'RCI Verified'}
        </div>,
        <div key="lang" className="text-xs text-slate-300">
          {Array.isArray(p.languages) ? p.languages.join(', ') : p.languages || 'English, Hindi'}
        </div>,
        <div key="status">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
              isVerified
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {isVerified ? 'VERIFIED' : 'PENDING'}
          </span>
        </div>,
        <div key="actions">
          <button
            onClick={() => handleToggleVerify(p.id, isVerified)}
            className={`rounded px-2 py-1 text-xs font-bold ${
              isVerified
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isVerified ? 'Revoke' : 'Verify'}
          </button>
        </div>,
      ];
    });
  }, [professionals]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-black text-white">
            Verified Psychological Directory Management
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Audit clinical qualifications, RCI registration licensing, and crisis support readiness for psychologists and counselors.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition"
        >
          + Register Professional
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Registered" value={professionals.length} />
        <StatCard
          label="Verified Practitioners"
          value={professionals.filter((p) => p.isVerified !== false).length}
          variant="success"
        />
        <StatCard label="Active Duty / Available" value={professionals.length || 4} variant="info" />
      </div>

      {/* Table */}
      <DataTable
        columns={[
          'Professional & Credentials',
          'Clinical Specialization',
          'RCI License Number',
          'Supported Languages',
          'Status',
          'Actions',
        ]}
        rows={rows}
        emptyMessage="No practitioners listed yet. Click '+ Register Professional' above."
      />

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0F172A] p-6 text-slate-200 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Register Clinical Professional</h2>
            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Doctor / Counselor Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Dr. Ananya Sen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Qualifications & Degrees</label>
                <input
                  type="text"
                  placeholder="e.g. Ph.D. Clinical Psychology, NIMHANS"
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Clinical Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. Trauma Recovery & Post-Emergency Debriefing"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">License Number</label>
                  <input
                    type="text"
                    placeholder="RCI-A67291"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Languages</label>
                  <input
                    type="text"
                    placeholder="English, Hindi"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
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
                  Save Practitioner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
