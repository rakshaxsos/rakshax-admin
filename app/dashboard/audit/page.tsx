'use client';
import { useEffect, useState } from 'react';
import DataTable from '../../../components/DataTable';
import { watchAuditLogs, type RecordItem } from '../../../lib/firestore';
export default function Audit() { const [items, setItems] = useState<RecordItem[]>([]); useEffect(() => watchAuditLogs(setItems), []); return <><h1 className="text-4xl font-bold text-navy">Audit timeline</h1><p className="mt-2 mb-8 text-slate-500">The latest 100 administrative and emergency events.</p><DataTable columns={['Time', 'Action', 'Actor', 'Target', 'Details']} rows={items.map(item => [String(item.timestamp?.toDate?.() || item.timestamp || ''), item.action || 'Event', item.actorName || item.actorId || 'System', item.targetId || '-', item.details || item.description || '-'])} /></>; }
