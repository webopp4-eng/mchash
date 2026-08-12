'use client';

import { useState } from 'react';
import { Suspense } from 'react';
import EmailSignUp from '@/components/auth/EmailSignUp';
import EmailLogIn from '@/components/auth/EmailLogIn';
import WalletSignIn from '@/components/auth/WalletSignIn';
import Logo from '@/components/Logo';

type AuthMode = 'choice' | 'email-signup' | 'email-login' | 'wallet';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('choice');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo />
          <h1 className="text-3xl font-bold text-white mt-4">CM HASH</h1>
          <p className="text-slate-400 mt-2">Cloud Mining Platform</p>
        </div>

        {/* Main Content */}
        <div className="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
          <Suspense fallback={<div className="min-h-96" />}>
            {mode === 'choice' && (
              <AuthChoice onSelectEmail={() => setMode('email-login')} onSelectWallet={() => setMode('wallet')} />
            )}
            {mode === 'email-login' && <EmailLogIn onBack={() => setMode('choice')} onSignUpClick={() => setMode('email-signup')} />}
            {mode === 'email-signup' && <EmailSignUp onBack={() => setMode('choice')} onLoginClick={() => setMode('email-login')} />}
            {mode === 'wallet' && <WalletSignIn onBack={() => setMode('choice')} />}
          </Suspense>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-400 text-sm">
            <span className="block">🔒 Secured by blockchain signature verification</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function AuthChoice({
  onSelectEmail,
  onSelectWallet,
}: {
  onSelectEmail: () => void;
  onSelectWallet: () => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white text-center">Welcome Back</h2>
      <p className="text-slate-300 text-center">Choose how you'd like to access CM HASH</p>

      {/* Email Option */}
      <div>
        <button
          onClick={onSelectEmail}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Continue with Email
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-slate-800 text-slate-400">or</span>
        </div>
      </div>

      {/* Wallet Option */}
      <div>
        <button
          onClick={onSelectWallet}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Continue with Wallet
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-slate-700 rounded-lg p-4 text-sm text-slate-300 border border-slate-600">
        <p className="font-semibold text-white mb-2">New to CM HASH?</p>
        <ul className="space-y-1 text-xs">
          <li>✓ Create an account with email</li>
          <li>✓ Sign in with your crypto wallet</li>
          <li>✓ Connect wallets to your profile anytime</li>
        </ul>
      </div>
    </div>
  );
}
