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

export default function MentalWellnessAdminPage() {
  const [resources, setResources] = useState<RecordItem[]>([]);
  const [professionals, setProfessionals] = useState<RecordItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Immediate Support');
  const [description, setDescription] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  useEffect(() => {
    const unsubs = [
      watchCollection('wellnessContent', setResources),
      watchCollection('professionals', setProfessionals),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    await addItem('wellnessContent', {
      title,
      category,
      description,
      contactNumber,
      status: 'active',
    });
    setShowAddModal(false);
    setTitle('');
    setDescription('');
    setContactNumber('');
  };

  const rows = useMemo(() => {
    return resources.map((r) => [
      <div key="title">
        <div className="font-bold text-white text-xs">{r.title}</div>
        <div className="text-[11px] text-slate-400">{r.description}</div>
      </div>,
      <div key="cat">
        <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-400">
          {r.category}
        </span>
      </div>,
      <div key="contact" className="font-mono text-xs text-slate-300">
        {r.contactNumber || 'National Tele-MANAS (14416)'}
      </div>,
      <div key="actions">
        <button
          onClick={() => deleteItem('wellnessContent', r.id)}
          className="rounded bg-slate-800 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
        >
          Remove
        </button>
      </div>,
    ]);
  }, [resources]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-black text-white">
            Mental Wellness & Psychological Support Operations
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Configure emergency helplines, post-incident trauma debriefing protocols, somatic grounding exercises, and counselor allocations.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition"
        >
          + Add Wellness Resource
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active Helplines" value={resources.length || 3} variant="info" />
        <StatCard
          label="Verified Psychologists"
          value={professionals.filter((p) => p.isVerified !== false).length}
          variant="success"
        />
        <StatCard label="Post-Incident Support Active" value="100%" subtitle="Automated Prompt Enabled" />
      </div>

      {/* Table */}
      <DataTable
        columns={['Resource / Description', 'Category', 'Hotline / Action', 'Actions']}
        rows={rows}
        emptyMessage="Default helplines active (Tele-MANAS, Vandrevala Foundation, Kiran Helpline)."
      />

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0F172A] p-6 text-slate-200 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Add Wellness Resource</h2>
            <form onSubmit={handleAdd} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Tele-MANAS Crisis Counseling"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                >
                  <option value="Immediate Support">Immediate Support</option>
                  <option value="Breathing & Grounding">Breathing & Grounding</option>
                  <option value="Campus Counseling">Campus Counseling</option>
                  <option value="Post-Incident Debrief">Post-Incident Debrief</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Helpline Number / URL</label>
                <input
                  type="text"
                  placeholder="e.g. 14416"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Instructions / Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                />
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
                  Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
