'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  watchCollection,
  addItem,
  updateItem,
  deleteItem,
  type RecordItem,
} from '../../../lib/firestore';
import DataTable from '../../../components/DataTable';

export default function SelfDefenseAdminPage() {
  const [classes, setClasses] = useState<RecordItem[]>([]);
  const [courses, setCourses] = useState<RecordItem[]>([]);
  const [tab, setTab] = useState<'classes' | 'courses'>('classes');
  const [showAddClassModal, setShowAddClassModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [streamUrl, setStreamUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubs = [
      watchCollection('selfDefenseClasses', setClasses, 'scheduledAt'),
      watchCollection('selfDefenseContent', setCourses, 'updatedAt'),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !instructor) return;
    setLoading(true);
    try {
      await addItem('selfDefenseClasses', {
        title,
        instructor,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        durationMinutes: parseInt(durationMinutes, 10) || 45,
        streamUrl: streamUrl || 'https://meet.jit.si/rakshax-defense',
        status: 'scheduled',
      });
      setShowAddClassModal(false);
      setTitle('');
      setInstructor('');
      setStreamUrl('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassStatus = async (id: string, status: string) => {
    await updateItem('selfDefenseClasses', id, { status });
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Delete this class?')) return;
    await deleteItem('selfDefenseClasses', id);
  };

  const classRows = useMemo(() => {
    return classes.map((c) => {
      const isLive = c.status === 'live';
      return [
        <div key="title">
          <div className="font-bold text-white text-xs">{c.title}</div>
          <div className="text-[11px] text-slate-400">By {c.instructor}</div>
        </div>,
        <div key="duration" className="font-mono text-xs text-slate-300">
          {c.durationMinutes || 45} mins
        </div>,
        <div key="status">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
              isLive
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                : c.status === 'completed'
                ? 'bg-slate-800 text-slate-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            {c.status || 'SCHEDULED'}
          </span>
        </div>,
        <div key="actions" className="flex items-center gap-2">
          {c.status !== 'live' ? (
            <button
              onClick={() => handleClassStatus(c.id, 'live')}
              className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white hover:bg-red-500"
            >
              Go Live
            </button>
          ) : (
            <button
              onClick={() => handleClassStatus(c.id, 'completed')}
              className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
            >
              End Class
            </button>
          )}
          <button
            onClick={() => handleDeleteClass(c.id)}
            className="rounded bg-slate-800 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
          >
            Delete
          </button>
        </div>,
      ];
    });
  }, [classes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-black text-white">
            RakshaX Safety Academy Management
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Coordinate live interactive self-defense broadcasts, situational awareness curriculum, and course video libraries.
          </p>
        </div>
        <button
          onClick={() => setShowAddClassModal(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition"
        >
          + Schedule Live Class
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 text-xs">
        <button
          onClick={() => setTab('classes')}
          className={`rounded-lg px-3 py-1 font-bold transition ${
            tab === 'classes'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          Live & Upcoming Classes ({classes.length})
        </button>
      </div>

      {/* Classes Table */}
      <DataTable
        columns={['Class Title & Instructor', 'Duration', 'Live Status', 'Actions']}
        rows={classRows}
        emptyMessage="No classes scheduled. Click '+ Schedule Live Class' to broadcast."
      />

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0F172A] p-6 text-slate-200 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Schedule Safety Class</h2>
            <form onSubmit={handleCreateClass} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Course / Class Title
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Escaping Grabs & Situational Awareness"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Certified Instructor
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Sensei Priya Sharma"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Scheduled Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Live Stream / Meeting URL
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  Publish Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
