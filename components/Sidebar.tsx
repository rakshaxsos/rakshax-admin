'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Logo from './Logo';

interface NavSection {
  title: string;
  items: { href: string; label: string; icon?: string }[];
}

const navSections: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { href: '/dashboard', label: 'Live Operations' },
      { href: '/dashboard/map', label: 'RakshaX Map' },
    ],
  },
  {
    title: 'SAFETY',
    items: [
      { href: '/dashboard/safety-reports', label: 'Safety Reports' },
      { href: '/dashboard/safety-missions', label: 'Safety Missions' },
      { href: '/dashboard/trusted-circle', label: 'Trusted Circle' },
      { href: '/dashboard/safety-points', label: 'Safety Points' },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { href: '/dashboard/incidents', label: 'Incidents' },
      { href: '/dashboard/dispatch', label: 'Live Dispatch' },
      { href: '/dashboard/responders', label: 'Responders' },
      { href: '/dashboard/police', label: 'Emergency Response' },
      { href: '/dashboard/devices', label: 'Devices' },
    ],
  },
  {
    title: 'CONTENT',
    items: [
      { href: '/dashboard/self-defense', label: 'Safety Academy' },
      { href: '/dashboard/mental-wellness', label: 'Mental Wellness' },
      { href: '/dashboard/professionals', label: 'Professionals' },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      { href: '/dashboard/notifications', label: 'Notifications' },
      { href: '/dashboard/emergency-messages', label: 'Emergency Messages' },
      { href: '/dashboard/templates', label: 'Templates' },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { href: '/dashboard/analytics/response', label: 'Response Analytics' },
      { href: '/dashboard/analytics/safety', label: 'Safety Analytics' },
      { href: '/dashboard/analytics/devices', label: 'Device Analytics' },
    ],
  },
  {
    title: 'GOVERNANCE',
    items: [
      { href: '/dashboard/users', label: 'Users' },
      { href: '/dashboard/organizations', label: 'Organizations' },
      { href: '/dashboard/roles', label: 'Roles & Perms' },
      { href: '/dashboard/audit', label: 'Audit Timeline' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { href: '/dashboard/settings', label: 'Settings' },
      { href: '/dashboard/integrations', label: 'Integrations' },
    ],
  },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="flex flex-col border-r border-slate-800 bg-[#070D19] p-4 text-slate-300 lg:h-screen lg:overflow-y-auto">
      <div className="pb-4 pt-1">
        <Logo />
        <div className="mt-2 flex items-center gap-2 px-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Ops Center 2.0
          </span>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-5 pb-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
              {section.title}
            </p>
            <div className="mt-1 space-y-0.5">
              {section.items.map((item) => {
                const isActive = path === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800/80 pt-3">
        <button
          onClick={() => signOut(auth)}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/10"
        >
          <span>Sign Out</span>
          <span className="text-[10px] text-slate-500">Secure</span>
        </button>
      </div>
    </aside>
  );
}
