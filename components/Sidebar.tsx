'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Logo from './Logo';

const links = [
  ['/dashboard', 'Live Dispatch'],
  ['/dashboard/police', 'Police Console'],
  ['/dashboard/responders', 'Responders'],
  ['/dashboard/users', 'Users'],
  ['/dashboard/devices', 'Devices'],
  ['/dashboard/audit', 'Audit Timeline'],
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="border-r border-slate-200 bg-white p-5 lg:min-h-screen">
      <Logo />
      <nav className="mt-10 space-y-1">
        {links.map(([href, label]) => (
          <Link
            className={`block rounded-xl px-3 py-3 text-sm font-bold transition ${
              path === href ? 'bg-navy text-white' : 'text-ink hover:bg-slate-100'
            }`}
            href={href}
            key={href}
          >
            {label}
          </Link>
        ))}
      </nav>
      <button className="mt-12 text-sm font-bold text-signal" onClick={() => signOut(auth)}>
        Sign out
      </button>
    </aside>
  );
}
