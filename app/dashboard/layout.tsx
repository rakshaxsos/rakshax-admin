'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { auth, db } from '../../lib/firebase';

const TRUSTED_ADMIN_UID = '73EYKyVlcARLNY0AqYmqs7s5aQx1';

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    const stop = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setReady(false);
        router.replace('/login');
        return;
      }
      try {
        const profile = await getDoc(doc(db, 'users', user.uid));
        const role = String(profile.data()?.role || '').toLowerCase();
        if (user.uid !== TRUSTED_ADMIN_UID && role !== 'admin') {
          await auth.signOut();
          router.replace('/login');
          return;
        }
        setAdminEmail(user.email);
        setReady(true);
      } catch {
        await auth.signOut();
        setReady(false);
        router.replace('/login');
      }
    });
    return stop;
  }, [router]);

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#070D19] text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Verifying Command Center Clearance...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 lg:grid lg:grid-cols-[250px_1fr]">
      <Sidebar />
      <div className="flex min-h-screen flex-col overflow-x-hidden">
        {/* Top Operational Bar */}
        <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-[#0E1626]/80 px-6 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-300">
              RakshaX National Dispatch Network
            </span>
            <span className="ml-2 rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
              SECURE
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>{adminEmail || 'admin@rakshax.gov'}</span>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
              ADMIN
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
