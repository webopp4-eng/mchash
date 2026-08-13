'use client';

import Link from 'next/link';
import { FaHome, FaRedo, FaTachometerAlt } from 'react-icons/fa';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  console.error('[GlobalError]', error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 text-slate-900">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-rose-600">Error</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Something went wrong</h1>
        <p className="mt-3 text-sm text-slate-600">The page failed to render. You can retry or navigate back to a stable page.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <button onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cmblue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cmblue-700 shadow-sm">
            <FaRedo className="h-4 w-4" />
            Retry
          </button>
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 shadow-sm">
            <FaHome className="h-4 w-4" />
            Home
          </Link>
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 shadow-sm">
            <FaTachometerAlt className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
