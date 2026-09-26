'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

type TrackingIncident = {
  incidentId?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  tracking?: {
    enabled?: boolean;
    revoked?: boolean;
    expiresAt?: { toDate?: () => Date } | string | null;
    token?: string;
  };
  currentLocation?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    timestamp?: { toDate?: () => Date } | string | null;
  };
  updatedAt?: { toDate?: () => Date } | string | null;
};

function toDate(value: unknown) {
  if (!value) return null;
  if (typeof value === 'string') return new Date(value);
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

export default function TrackingPage() {
  const params = useParams<{ incidentId: string }>();
  const searchParams = useSearchParams();
  const [tokenStatus, setTokenStatus] = useState<'loading' | 'valid' | 'expired' | 'error'>('loading');
  const [incident, setIncident] = useState<TrackingIncident | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const incidentId = params.incidentId;
      const token = searchParams.get('token');

      if (!incidentId || !token) {
        setTokenStatus('error');
        setError('This secure tracking link is missing a valid access token.');
        return;
      }

      try {
        const tokenDoc = await getDoc(doc(db, 'tracking_tokens', token));
        const tokenData = tokenDoc.data();

        if (!tokenDoc.exists() || !tokenData) {
          setTokenStatus('expired');
          setError('This tracking link is invalid or has expired.');
          return;
        }

        const expiresAt = toDate(tokenData.expiresAt);
        if (expiresAt && expiresAt.getTime() <= Date.now()) {
          setTokenStatus('expired');
          setError('This tracking link has expired and is no longer active.');
          return;
        }

        if (tokenData.revoked || tokenData.incidentId !== incidentId) {
          setTokenStatus('expired');
          setError('This tracking session is no longer authorized.');
          return;
        }

        const incSnap = await getDoc(doc(db, 'incidents', incidentId));
        if (!incSnap.exists()) {
          setTokenStatus('error');
          setError('Incident not found.');
          return;
        }

        const nextIncident = incSnap.data() as TrackingIncident;
        const tracking = nextIncident.tracking;
        const windowOpen = tracking?.enabled === true && tracking?.revoked !== true;
        const validTrackingWindow = !tracking?.expiresAt || (toDate(tracking.expiresAt)?.getTime() ?? 0) > Date.now();

        if (!windowOpen || !validTrackingWindow) {
          setTokenStatus('expired');
          setError('Live tracking is no longer available for this incident.');
          return;
        }

        setIncident(nextIncident);
        setTokenStatus('valid');
      } catch (caught) {
        setTokenStatus('error');
        setError('Unable to open tracking page securely.');
        console.error(caught);
      }
    };

    load();
  }, [params.incidentId, searchParams]);

  const statusText = useMemo(() => {
    const stamp = toDate(incident?.currentLocation?.timestamp ?? incident?.updatedAt);
    if (!stamp) return 'Awaiting live update';
    const secondsAgo = Math.max(0, (Date.now() - stamp.getTime()) / 1000);
    if (secondsAgo <= 10) return 'LIVE';
    if (secondsAgo <= 30) return 'UPDATING';
    if (secondsAgo <= 120) return 'STALE';
    return 'OFFLINE';
  }, [incident]);

  if (tokenStatus === 'loading') {
    return <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">Verifying secure tracking link…</main>;
  }

  if (tokenStatus !== 'valid' || !incident) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><div className="max-w-lg rounded-2xl bg-white p-8 shadow-xl"><h1 className="text-2xl font-bold text-navy">Tracking unavailable</h1><p className="mt-3 text-sm text-slate-600">{error || 'This emergency tracking link is no longer available.'}</p></div></main>;
  }

  const latitude = incident.currentLocation?.latitude ?? incident.latitude ?? null;
  const longitude = incident.currentLocation?.longitude ?? incident.longitude ?? null;
  const accuracy = incident.currentLocation?.accuracy ?? incident.accuracy ?? null;

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Secure SOS tracking</p>
            <h1 className="mt-2 text-3xl font-bold text-navy">Incident #{incident.incidentId || params.incidentId}</h1>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{statusText}</span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{incident.status ?? 'Active'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Latitude</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{latitude == null ? '—' : latitude.toFixed(5)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Longitude</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{longitude == null ? '—' : longitude.toFixed(5)}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Location precision</p>
          <p className="mt-2 text-lg font-semibold text-slate-800">{accuracy == null ? 'Awaiting GPS signal' : `±${accuracy.toFixed(1)}m accuracy`}</p>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This page is intentionally read-only and exposes only the minimum emergency location data necessary for trusted contacts and responders.
        </div>
      </div>
    </main>
  );
}
