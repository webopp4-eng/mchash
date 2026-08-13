'use client';

import Link from 'next/link';
import { FaHome, FaTachometerAlt } from 'react-icons/fa';
import Logo from '@/components/Logo';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 text-slate-900">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
          <Logo size={42} />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cmblue-600">Route</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-3 text-sm text-slate-600">This route does not exist or has moved.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cmblue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cmblue-700 shadow-sm">
            <FaHome className="h-4 w-4" />
            Home
          </Link>
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 shadow-sm">
            <FaTachometerAlt className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
