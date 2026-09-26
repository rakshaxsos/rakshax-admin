'use client';
import { useEffect, useState, useMemo } from 'react';
import DataTable from '../../../components/DataTable';
import StatCard from '../../../components/StatCard';
import {
  setUserStatus,
  updateItem,
  watchCollection,
  logAuditEvent,
  type RecordItem,
} from '../../../lib/firestore';

export default function UsersAdminPage() {
  const [users, setUsers] = useState<RecordItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    return watchCollection('users', setUsers, 'createdAt');
  }, []);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status !== 'suspended').length,
      suspended: users.filter((u) => u.status === 'suspended').length,
      admins: users.filter((u) =>
        ['admin', 'super_admin'].includes(String(u.role)),
      ).length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole =
        roleFilter === 'ALL' ||
        String(u.role || 'user').toLowerCase() === roleFilter.toLowerCase();
      if (!matchRole) return false;
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return (
        u.name?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        u.phone?.toLowerCase().includes(s)
      );
    });
  }, [users, roleFilter, searchTerm]);

  const handleToggleStatus = async (id: string, current: string) => {
    const next = current === 'suspended' ? 'active' : 'suspended';
    await setUserStatus(id, next);
    await logAuditEvent(
      'admin',
      'ADMIN',
      next === 'suspended' ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
      `User #${id}`,
    );
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    await updateItem('users', id, { role: newRole });
    await logAuditEvent(
      'admin',
      'ADMIN',
      'USER_ROLE_CHANGED',
      `User #${id}`,
      { newRole },
    );
  };

  const rows = useMemo(() => {
    return filteredUsers.map((item) => {
      const isSuspended = item.status === 'suspended';
      const role = String(item.role || 'user').toUpperCase();

      return [
        <div key="name">
          <div className="font-bold text-white text-xs">{item.name || 'Citizen'}</div>
          <div className="text-[11px] text-slate-400 font-mono">
            {item.email || 'No email registered'}
          </div>
        </div>,
        <div key="phone" className="font-mono text-xs text-slate-300">
          {item.phone || '—'}
        </div>,
        <div key="role">
          <select
            value={item.role || 'user'}
            onChange={(e) => handleRoleChange(item.id, e.target.value)}
            className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-blue-400 outline-none"
          >
            <option value="user">User</option>
            <option value="responder">Responder</option>
            <option value="security">Security</option>
            <option value="emergency_operator">Emergency Operator</option>
            <option value="content_manager">Content Manager</option>
            <option value="professional">Professional</option>
            <option value="admin">Admin</option>
          </select>
        </div>,
        <div key="status">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
              isSuspended
                ? 'bg-red-500/20 text-red-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {item.status || 'ACTIVE'}
          </span>
        </div>,
        <div key="actions">
          <button
            onClick={() => handleToggleStatus(item.id, item.status || 'active')}
            className={`rounded px-2 py-1 text-xs font-bold ${
              isSuspended
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            }`}
          >
            {isSuspended ? 'Activate' : 'Suspend'}
          </button>
        </div>,
      ];
    });
  }, [filteredUsers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">
          User Identity &amp; Authorization Governance
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Manage protected citizen profiles, role elevations, and account suspension enforcement across the network.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Registered Users" value={stats.total} />
        <StatCard label="Active Citizens" value={stats.active} variant="success" />
        <StatCard
          label="Suspended Accounts"
          value={stats.suspended}
          alert={stats.suspended > 0}
          variant={stats.suspended > 0 ? 'danger' : 'default'}
        />
        <StatCard label="Admin & Operators" value={stats.admins} variant="info" />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#0F172A] p-4">
        <input
          type="text"
          placeholder="Search by name, email, or mobile..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
        />

        <div className="flex gap-1.5 text-xs">
          {['ALL', 'USER', 'RESPONDER', 'ADMIN'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-lg px-3 py-1 font-bold ${
                roleFilter === r
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={['User Profile', 'Phone', 'Assigned Role', 'Account Status', 'Action']}
        rows={rows}
        emptyMessage="No user profiles found."
      />
    </div>
  );
}
