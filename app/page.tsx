'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
export default function Home() { const router = useRouter(); useEffect(() => { const stop = onAuthStateChanged(auth, user => router.replace(user ? '/dashboard' : '/login')); return stop; }, [router]); return <main className="grid min-h-screen place-items-center text-navy">Loading RakshaX...</main>; }
