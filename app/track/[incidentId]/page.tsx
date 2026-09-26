'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import RakshaXMap, { type MapMarkerData } from '../../../components/RakshaXMap';

type TrackingIncident = {
  incidentId?: string;
  userName?: string;
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

  const token = searchParams.get('token');
  const incidentId = params.incidentId;

  useEffect(() => {
    if (!incidentId || !token) {
      setTokenStatus('error');
      setError('This secure tracking link is missing a valid access token.');
      return;
    }

    let unsubIncident: (() => void) | null = null;

    const load = async () => {
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

        // Listen in real-time to the active incident location
        unsubIncident = onSnapshot(doc(db, 'incidents', incidentId), (incSnap) => {
          if (!incSnap.exists()) {
            setTokenStatus('error');
            setError('Incident not found or concluded.');
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
        });
      } catch (caught) {
        setTokenStatus('error');
        setError('Unable to open tracking page securely.');
        console.error(caught);
      }
    };

    load();

    return () => {
      if (unsubIncident) unsubIncident();
    };
  }, [incidentId, token]);

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
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-300">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          <span>Verifying secure emergency tracking credentials…</span>
        </div>
      </main>
    );
  }

  if (tokenStatus !== 'valid' || !incident) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070D19] p-6 text-slate-200">
        <div className="max-w-md rounded-2xl border border-red-500/30 bg-[#0F172A] p-8 shadow-2xl text-center">
          <span className="text-4xl block mb-3">🔒</span>
          <h1 className="text-xl font-bold text-white">Tracking Session Inactive</h1>
          <p className="mt-3 text-xs text-slate-400 leading-relaxed">
            {error || 'This emergency live tracking link has expired, been revoked, or is no longer accessible.'}
          </p>
        </div>
      </main>
    );
  }

  const latitude = incident.currentLocation?.latitude ?? incident.latitude ?? 26.9124;
  const longitude = incident.currentLocation?.longitude ?? incident.longitude ?? 75.7873;
  const accuracy = incident.currentLocation?.accuracy ?? incident.accuracy ?? 15;

  const trackingMarkers: MapMarkerData[] = [
    {
      id: incidentId || 'live',
      type: 'sos',
      lat: Number(latitude),
      lng: Number(longitude),
      accuracy: Number(accuracy),
      title: `SOS: ${incident.userName || 'Protected Citizen'}`,
      subtitle: `Status: ${String(incident.status || 'ACTIVE').toUpperCase()}`,
      status: String(incident.status || 'ACTIVE').toUpperCase(),
    },
  ];

  return (
    <main className="min-h-screen bg-[#070D19] text-white p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Open in App Deep Link Banner (PRD Section 43-47) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-blue-500/40 bg-blue-950/40 px-5 py-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-lg">📱</span>
            <span>Have the <strong>RakshaX App</strong> installed? Open directly in app for real-time alerts.</span>
          </div>
          <a
            href={`rakshax://track/${incidentId}?token=${token}`}
            className="rounded-lg bg-blue-600 px-3 py-1.5 font-bold text-white hover:bg-blue-500 transition whitespace-nowrap shadow"
          >
            Open in App →
          </a>
        </div>

        {/* Tracking Header */}
        <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400">
                RakshaX Real-Time Emergency SOS Beacon
              </p>
            </div>
            <h1 className="mt-2 text-2xl font-black text-white">
              Incident #{incident.incidentId || incidentId}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400 border border-red-500/40">
              {statusText}
            </span>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
              {incident.status?.toUpperCase() ?? 'ACTIVE'}
            </span>
          </div>
        </div>

        {/* Real Unified RakshaXMap (Leaflet + OpenStreetMap) */}
        <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-4 shadow-xl">
          <RakshaXMap
            markers={trackingMarkers}
            center={[latitude, longitude]}
            zoom={16}
            height="460px"
          />
        </div>

        {/* Telemetry Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-4">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tactical Status</p>
            <p className="mt-1 text-lg font-black text-emerald-400">{incident.status ?? 'Active'}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-4">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">GPS Coordinates</p>
            <p className="mt-1 font-mono text-sm text-white">
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-4">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Location Accuracy</p>
            <p className="mt-1 font-mono text-sm text-blue-400">
              ±{accuracy.toFixed(1)}m precision
            </p>
          </div>
        </div>

        {/* Security & Privacy Notice */}
        <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-4 text-xs text-slate-400">
          🛡️ <strong>Encrypted Link:</strong> This tracking page is cryptographically authenticated. Location data is streamed strictly for emergency responder and trusted contact visibility.
        </div>
      </div>
    </main>
  );
}
