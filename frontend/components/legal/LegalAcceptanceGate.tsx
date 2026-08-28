'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaFileContract } from 'react-icons/fa';
import { API_URL, isAuthenticated } from '@/lib/auth';

/**
 * Legal re-acceptance gate.
 *
 * On every dashboard visit it asks the backend (GET /api/legal/status) whether
 * the signed-in user has accepted the CURRENT versions of the Terms &
 * Conditions, Privacy Policy and Risk Disclosure. If not (e.g. after a
 * material document update), a full-screen gate blocks platform usage until
 * the updated documents are accepted via POST /api/legal/accept.
 *
 * Legacy users registered before acceptance records existed are grandfathered
 * server-side (unless REQUIRE_LEGAL_ACCEPTANCE_FOR_LEGACY_USERS=true), so this
 * gate only appears for users who genuinely need to re-accept.
 *
 * If the status check fails (network/backend issue) the gate fails OPEN so
 * users are never locked out of their accounts by an infrastructure error.
 */
export default function LegalAcceptanceGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'ok' | 'required'>('checking');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (!isAuthenticated()) {
        if (!cancelled) setStatus('ok');
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/legal/status`, {
          credentials: 'include',
        });
        if (!res.ok) {
          // Fail open on non-200 responses (e.g. transient auth refresh).
          if (!cancelled) setStatus('ok');
          return;
        }
        const data = await res.json();
        if (!cancelled) setStatus(data.compliant ? 'ok' : 'required');
      } catch {
        // Fail open — never lock users out due to a network error.
        if (!cancelled) setStatus('ok');
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'checking') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  if (status === 'ok') {
    return <>{children}</>;
  }

  const handleAccept = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/legal/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to record acceptance');
      }
      // Re-acceptance recorded — reload so the gate clears and the user
      // continues with the updated documents in force.
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record acceptance');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="mc-card w-full max-w-md !p-5 sm:!p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cmblue-400 to-cmblue-600 text-white shadow-[0_10px_24px_rgba(0,130,255,0.35)]">
            <FaFileContract className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-950">Updated legal documents</h2>
            <p className="text-xs text-slate-500">Please review and accept to continue</p>
          </div>
        </div>

        <p className="mb-4 text-sm text-slate-600">
          We have updated our legal documents. To continue using MCHash.site, please review and
          accept the updated{' '}
          <Link href="/terms" target="_blank" className="font-semibold text-cmblue-600 hover:underline">Terms &amp; Conditions</Link>,{' '}
          <Link href="/privacy-policy" target="_blank" className="font-semibold text-cmblue-600 hover:underline">Privacy Policy</Link> and{' '}
          <Link href="/risk-disclosure" target="_blank" className="font-semibold text-cmblue-600 hover:underline">Risk Disclosure</Link>.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleAccept}
          disabled={submitting}
          className="mc-button w-full"
        >
          {submitting ? 'Recording acceptance…' : 'I have read and accept the updated documents'}
        </button>
      </div>
    </div>
  );
}

