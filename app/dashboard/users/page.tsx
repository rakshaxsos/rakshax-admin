'use client';
import { useEffect, useState } from 'react';
import DataTable from '../../../components/DataTable';
import { setUserStatus, watchCollection, type RecordItem } from '../../../lib/firestore';
export default function Users() { const [items, setItems] = useState<RecordItem[]>([]); useEffect(() => watchCollection('users', setItems, 'createdAt'), []); return <><h1 className="text-4xl font-bold text-navy">Users</h1><p className="mt-2 mb-8 text-slate-500">Monitor accounts and suspend compromised profiles.</p><DataTable columns={['Name', 'Email', 'Phone', 'Role', 'Status', 'Action']} rows={items.map(item => [item.name || item.id, item.email || 'Not provided', item.phone || 'Not provided', item.role || 'user', item.status || 'active', <button className="font-bold text-signal" onClick={() => setUserStatus(item.id, item.status === 'suspended' ? 'active' : 'suspended')}>{item.status === 'suspended' ? 'Activate' : 'Suspend'}</button>])} /></>; }
