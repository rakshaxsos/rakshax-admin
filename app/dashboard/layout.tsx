'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { auth, db } from '../../lib/firebase';
export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) { const router = useRouter(); const [ready, setReady] = useState(false); useEffect(() => onAuthStateChanged(auth, async user => { if (!user) return router.replace('/login'); const profile = await getDoc(doc(db, 'users', user.uid)); if (profile.data()?.role !== 'admin') { await auth.signOut(); return router.replace('/login'); } setReady(true); }), [router]); if (!ready) return <main className="grid min-h-screen place-items-center text-navy">Checking access...</main>; return <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]"><Sidebar /><main className="p-5 md:p-8">{children}</main></div>; }
