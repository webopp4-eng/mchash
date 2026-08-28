'use client';

import { useState, Suspense } from 'react';
import EmailSignUp from '@/components/auth/EmailSignUp';
import EmailLogIn from '@/components/auth/EmailLogIn';
import Logo from '@/components/Logo';
import SiteFooter from '@/components/SiteFooter'

type AuthMode = 'choice' | 'email-signup' | 'email-login';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('choice');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4ff] via-white to-[#eef3ff] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo />
          <h1 className="text-3xl font-bold text-slate-900 mt-4">CM HASH</h1>
          <p className="text-slate-500 mt-2">Cloud Mining Platform</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-[24px] shadow-card border border-slate-200/80 p-8">
          <Suspense fallback={<div className="min-h-96" />}>
            {mode === 'choice' && (
              <AuthChoice onSelectEmail={() => setMode('email-login')} />
            )}
            {mode === 'email-login' && <EmailLogIn onBack={() => setMode('choice')} onSignUpClick={() => setMode('email-signup')} />}
            {mode === 'email-signup' && <EmailSignUp onBack={() => setMode('choice')} onLoginClick={() => setMode('email-login')} />}
          </Suspense>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-500 text-sm">
            <span className="block">🔒 Secured by industry-standard authentication</span>
          </p>
        </div>

        {/* Legal footer links (accessible without logging in) */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-semibold">
          <a href="/terms" className="text-slate-400 transition-colors hover:text-cmblue-600">Terms &amp; Conditions</a>
          <a href="/privacy-policy" className="text-slate-400 transition-colors hover:text-cmblue-600">Privacy Policy</a>
          <a href="/risk-disclosure" className="text-slate-400 transition-colors hover:text-cmblue-600">Risk Disclosure</a>
          <a href="mailto:support@mchash.site" className="text-slate-400 transition-colors hover:text-cmblue-600">Contact / Support</a>
        </div>
      </div>
      <div className="w-full">
        <SiteFooter />
      </div>
    </div>
  );
}

function AuthChoice({
  onSelectEmail,
}: {
  onSelectEmail: () => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 text-center">Welcome to CM HASH</h2>
      <p className="text-slate-500 text-center">Log in or create an account to get started</p>

      {/* Email Option */}
      <div>
        <button
          onClick={onSelectEmail}
          className="w-full bg-cmblue-600 hover:bg-cmblue-700 text-white font-semibold py-3 px-4 rounded-2xl transition duration-200 flex items-center justify-center gap-2 shadow-blue-glow"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Continue with Email
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 border border-slate-200/80">
        <p className="font-semibold text-slate-900 mb-2">Account Features:</p>
        <ul className="space-y-1 text-xs">
          <li>✓ Email & password login</li>
          <li>✓ Connect wallet anytime</li>
          <li>✓ Start mining instantly</li>
        </ul>
      </div>
    </div>
  );
}