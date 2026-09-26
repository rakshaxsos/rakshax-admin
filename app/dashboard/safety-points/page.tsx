'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  watchCollection,
  addItem,
  updateItem,
  deleteItem,
  logAuditEvent,
  type RecordItem,
} from '../../../lib/firestore';
import DataTable from '../../../components/DataTable';

const CATEGORIES = [
  'Safe Haven',
  'Police Assistance Booth',
  '24/7 Pharmacy',
  'Campus Security Post',
  'Hospital / Emergency Clinic',
  'Women Support Desk',
  'Transit Security Center',
];

export default function SafetyPointsAdminPage() {
  const [points, setSafetyPoints] = useState<RecordItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [latitude, setLatitude] = useState('26.9124');
  const [longitude, setLongitude] = useState('75.7873');
  const [operatingHours, setOperatingHours] = useState('24/7');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return watchCollection('safetyPoints', setSafetyPoints, 'updatedAt');
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) return;
    setLoading(true);
    try {
      await addItem('safetyPoints', {
        name,
        category,
        address,
        phone,
        latitude: parseFloat(latitude) || 26.9124,
        longitude: parseFloat(longitude) || 75.7873,
        operatingHours,
        status: 'active',
      });
      await logAuditEvent(
        'admin',
        'ADMIN',
        'SAFETY_POINT_CREATED',
        `Safety Point: ${name}`,
        { category, address },
      );
      setShowAddModal(false);
      setName('');
      setAddress('');
      setPhone('');
    } catch (err) {
      console.error('Error creating safety point:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, ptName: string) => {
    if (!confirm(`Delete safety point "${ptName}"?`)) return;
    try {
      await deleteItem('safetyPoints', id);
      await logAuditEvent(
        'admin',
        'ADMIN',
        'SAFETY_POINT_DELETED',
        `Safety Point #${id}`,
      );
    } catch (err) {
      console.error('Error deleting safety point:', err);
    }
  };

  const rows = useMemo(() => {
    return points.map((p) => [
      <div key="name">
        <div className="font-bold text-white text-xs">{p.name}</div>
        <div className="text-[11px] text-slate-400">{p.address}</div>
      </div>,
      <div key="cat">
        <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
          {p.category}
        </span>
      </div>,
      <div key="coords" className="font-mono text-xs text-slate-400">
        {Number(p.latitude).toFixed(4)}, {Number(p.longitude).toFixed(4)}
      </div>,
      <div key="hours" className="text-xs text-emerald-400 font-medium">
        {p.operatingHours || '24/7'}
      </div>,
      <div key="contact" className="font-mono text-xs text-slate-300">
        {p.phone || 'Emergency Helpline'}
      </div>,
      <div key="actions" className="flex items-center gap-2">
        <button
          onClick={() => handleDelete(p.id, p.name || p.id)}
          className="rounded bg-red-500/20 px-2 py-1 text-[11px] font-bold text-red-400 hover:bg-red-500/30"
        >
          Delete
        </button>
      </div>,
    ]);
  }, [points]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-black text-white">
            Verified Safety Points Management
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Designate public safe havens, emergency shelters, police kiosks, and 24/7 assistance points visible on the RakshaX community map.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition"
        >
          + Add Safety Point
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0F172A] p-6 text-slate-200 shadow-2xl">
            <h2 className="text-lg font-bold text-white">
              Register New Community Safety Point
            </h2>
            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Facility Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Central Metro Police Booth"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Street Address
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Sector 4, MG Road"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Latitude
                  </label>
                  <input
                    required
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 font-mono text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Longitude
                  </label>
                  <input
                    required
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 font-mono text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Phone / Hotline
                  </label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-500 transition disabled:opacity-50"
                >
                  Save Safety Point
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Points Table */}
      <DataTable
        columns={[
          'Safety Point & Address',
          'Category',
          'Coordinates',
          'Hours',
          'Emergency Contact',
          'Actions',
        ]}
        rows={rows}
        emptyMessage="No safety points configured yet. Click '+ Add Safety Point' above."
      />
    </div>
  );
}
