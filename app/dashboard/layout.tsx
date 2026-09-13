'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { auth, db } from '../../lib/firebase';
const TRUSTED_ADMIN_UID = '73EYKyVlcARLNY0AqYmqs7s5aQx1';
export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) { const router = useRouter(); const [ready, setReady] = useState(false); useEffect(() => { const stop = onAuthStateChanged(auth, async user => { if (!user) { setReady(false); router.replace('/login'); return; } try { const profile = await getDoc(doc(db, 'users', user.uid)); const role = String(profile.data()?.role || '').toLowerCase(); if (user.uid !== TRUSTED_ADMIN_UID && role !== 'admin') { await auth.signOut(); router.replace('/login'); return; } setReady(true); } catch { await auth.signOut(); setReady(false); router.replace('/login'); } }); return stop; }, [router]); if (!ready) return <main className="grid min-h-screen place-items-center text-navy">Checking access...</main>; return <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]"><Sidebar /><main className="p-5 md:p-8">{children}</main></div>; }
