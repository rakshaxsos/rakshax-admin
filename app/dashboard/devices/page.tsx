'use client';
import { useEffect, useState } from 'react';
import DataTable from '../../../components/DataTable';
import { watchCollection, type RecordItem } from '../../../lib/firestore';
export default function Devices() { const [items, setItems] = useState<RecordItem[]>([]); useEffect(() => watchCollection('devices', setItems, 'lastSeen'), []); return <><h1 className="text-4xl font-bold text-navy">Devices</h1><p className="mt-2 mb-8 text-slate-500">Hardware heartbeat and pairing inventory.</p><DataTable columns={['Device', 'Owner', 'Battery', 'Connected', 'Last seen']} rows={items.map(item => [item.deviceId || item.id, item.userId || 'Unpaired', item.batteryPercentage != null ? `${item.batteryPercentage}%` : 'Unknown', item.isConnected ? 'Online' : 'Offline', String(item.lastSeen?.toDate?.() || item.lastSeen || '')])} /></>; }
