'use client';

import { useEffect, useState } from 'react';
import { FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';

const AGE_STORAGE_KEY = 'mchash_age_verified_18plus';

/**
 * Site-wide 18+ age gate (Terms & Conditions, Section 2 — Age Requirement).
 * Every visitor must confirm they are 18 or older before using the platform.
 * The confirmation is remembered in localStorage; "Exit" sends under-18
 * visitors away from the site.
 */
export default function AgeGate() {
  const [visible, setVisible] = useState(false);
  const [rejected, setRejected] = useState(false);

  useEffect(() => {
    // Run after mount so SSR/static export never renders the gate (avoids
    // hydration mismatches) and crawlers can still read the public pages.
    let verified: string | null = null;
    try {
      verified = window.localStorage.getItem(AGE_STORAGE_KEY);
    } catch {
      verified = null;
    }
    if (verified !== 'true') {
      setVisible(true);
      // Lock page scroll while the gate is open.
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const confirm = () => {
    try {
      window.localStorage.setItem(AGE_STORAGE_KEY, 'true');
    } catch {
      /* storage unavailable — allow session-only confirmation */
    }
    setVisible(false);
    document.body.style.overflow = '';
  };

  const reject = () => {
    setRejected(true);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl border border-sky-100 bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-sky-100 px-6 py-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cmblue-50">
              <FaShieldAlt className="h-6 w-6 text-cmblue-600" />
            </div>
          </div>
          <h2 id="age-gate-title" className="text-lg font-bold text-slate-950">
            Adults Only (18+)
          </h2>
        </div>

        {/* Content */}
        {!rejected ? (
          <AgeGateConfirm onConfirm={confirm} onReject={reject} />
        ) : (
          <AgeGateRejected />
        )}
      </div>
    </div>
  );
}

function AgeGateConfirm({
  onConfirm,
  onReject,
}: {
  onConfirm: () => void;
  onReject: () => void;
}) {
  return (
    <>
      <div className="px-6 py-4">
        <p className="mb-4 text-sm text-slate-700">
          MCHash.site is a cryptocurrency cloud-mining platform intended
          strictly for adults. By entering, you confirm that:
        </p>
        <div className="space-y-2 rounded-xl bg-sky-50 p-4">
          <div className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-cmblue-600" />
            <p className="text-xs text-slate-700">
              You are at least <strong>18 years of age</strong> (or the age of
              legal majority in your jurisdiction).
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-cmblue-600" />
            <p className="text-xs text-slate-700">
              You have read and accept the{' '}
              <a href="/terms" className="font-semibold text-cmblue-600 hover:underline">
                Terms &amp; Conditions
              </a>
              ,{' '}
              <a href="/privacy-policy" className="font-semibold text-cmblue-600 hover:underline">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="/risk-disclosure" className="font-semibold text-cmblue-600 hover:underline">
                Risk Disclosure
              </a>
              .
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-cmblue-600" />
            <p className="text-xs text-slate-700">
              You understand that cryptocurrency mining involves financial
              risk.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-sky-100 px-6 py-4 flex gap-3">
        <button
          onClick={onReject}
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          I Am Under 18
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-gradient-to-r from-cmblue-600 to-cmblue-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,130,255,0.22)] hover:shadow-[0_16px_36px_rgba(0,130,255,0.32)] transition-all"
        >
          I Am 18 Or Older — Enter
        </button>
      </div>
    </>
  );
}

function AgeGateRejected() {
  return (
    <>
      <div className="px-6 py-4">
        <div className="mb-2 flex items-start gap-3 rounded-xl bg-red-50 p-4">
          <FaExclamationTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm text-slate-700">
            Access denied. You must be 18 years or older to use MCHash.site.
            Accounts created by minors violate our{' '}
            <a href="/terms" className="font-semibold text-cmblue-600 hover:underline">
              Terms &amp; Conditions
            </a>{' '}
            and will be terminated.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-sky-100 px-6 py-4">
        <button
          onClick={() => {
            window.location.href = 'https://www.google.com';
          }}
          className="w-full rounded-lg bg-gradient-to-r from-cmblue-600 to-cmblue-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,130,255,0.22)] hover:shadow-[0_16px_36px_rgba(0,130,255,0.32)] transition-all"
        >
          Leave Site
        </button>
      </div>
    </>
  );
}