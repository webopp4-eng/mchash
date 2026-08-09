'use client';

import { useState } from 'react';
import { FaWallet, FaShieldAlt, FaExclamationTriangle, FaLock } from 'react-icons/fa';
import Logo from './Logo';
import { connectSolanaWallet, connectEvmWallet, signSolanaMessage, signEvmMessage, Chain } from '@/lib/wallet';

interface WalletOption {
  id: string;
  name: string;
  chain: Chain;
  icon: string;
  color: string;
}

const wallets: WalletOption[] = [
  { id: 'phantom', name: 'Phantom', chain: 'solana', icon: '👻', color: 'from-purple-500 to-purple-700' },
  { id: 'solflare', name: 'Solflare', chain: 'solana', icon: '🌞', color: 'from-orange-400 to-orange-600' },
  { id: 'backpack', name: 'Backpack', chain: 'solana', icon: '🎒', color: 'from-blue-500 to-blue-700' },
  { id: 'glow', name: 'Glow', chain: 'solana', icon: '✨', color: 'from-yellow-400 to-yellow-600' },
  { id: 'metamask', name: 'MetaMask', chain: 'ethereum', icon: '🦊', color: 'from-orange-500 to-amber-700' },
  { id: 'trust', name: 'Trust Wallet', chain: 'ethereum', icon: '💎', color: 'from-blue-600 to-indigo-800' },
  { id: 'coinbase', name: 'Coinbase Wallet', chain: 'ethereum', icon: '🔵', color: 'from-blue-500 to-blue-700' },
  { id: 'rainbow', name: 'Rainbow', chain: 'ethereum', icon: '🌈', color: 'from-pink-500 to-purple-600' },
  { id: 'binance', name: 'Binance Wallet', chain: 'bnb', icon: '🟡', color: 'from-yellow-500 to-amber-600' },
];

export default function WalletSignIn() {
  const [agreed, setAgreed] = useState({ terms: false, privacy: false, risk: false });
  const [selectedWallet, setSelectedWallet] = useState<WalletOption | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWallets, setShowWallets] = useState(false);

  const allAgreed = agreed.terms && agreed.privacy && agreed.risk;

  const handleConnect = async () => {
    if (!allAgreed) {
      setError('Please accept all terms and conditions to continue.');
      return;
    }
    if (!selectedWallet) {
      setError('Please select a wallet to connect.');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      let walletInfo;
      if (selectedWallet.chain === 'solana') {
        walletInfo = await connectSolanaWallet();
      } else {
        walletInfo = await connectEvmWallet(selectedWallet.chain);
      }

      // Get nonce from backend
      const nonceRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/nonce/${walletInfo.address}`);
      const { nonce, message } = await nonceRes.json();

      // Sign message
      let signature;
      if (walletInfo.chain === 'solana') {
        signature = await signSolanaMessage(message);
      } else {
        signature = await signEvmMessage(message);
      }

      // Authenticate with backend
      const authRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletInfo.address,
          chain: walletInfo.chain,
          signature,
          message,
          walletType: walletInfo.walletType,
        }),
      });

      const data = await authRes.json();
      if (!authRes.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store token and user
      localStorage.setItem('cmhash_token', data.token);
      localStorage.setItem('cmhash_user', JSON.stringify(data.user));

      // Redirect to dashboard
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0e1a] text-white">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cmblue-500/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-purple-500/10 blur-[100px]" />
        <div className="absolute left-0 top-1/2 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo & Branding */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_0_40px_rgba(14,161,255,0.2)] backdrop-blur-xl">
              <Logo size={64} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">CM HASH</h1>
            <p className="mt-2 text-sm text-slate-400">Cloud Mining Platform</p>
            <p className="mt-1 text-xs text-slate-500">Connect your wallet to get started</p>
          </div>

          {/* Main Card */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            {/* Wallet Selection */}
            {!showWallets ? (
              <div className="space-y-4">
                <button
                  onClick={() => setShowWallets(true)}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cmblue-600 to-cmblue-500 px-6 py-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(14,161,255,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_10px_40px_rgba(14,161,255,0.4)]"
                >
                  <FaWallet className="h-5 w-5" />
                  Connect Wallet
                </button>
                <p className="text-center text-[10px] text-slate-500">
                  Supports Solana, Ethereum & BNB Smart Chain
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-300">Select Wallet</h2>
                  <button onClick={() => setShowWallets(false)} className="text-xs text-slate-500 hover:text-slate-300">
                    Back
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {wallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => setSelectedWallet(wallet)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all ${
                        selectedWallet?.id === wallet.id
                          ? 'border-cmblue-400 bg-cmblue-500/20 shadow-[0_0_20px_rgba(14,161,255,0.3)]'
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                      }`}
                    >
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${wallet.color} text-lg`}>
                        {wallet.icon}
                      </span>
                      <span className="text-[10px] font-medium text-slate-300">{wallet.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Checkboxes */}
            <div className="mt-6 space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={agreed.terms}
                  onChange={(e) => setAgreed({ ...agreed, terms: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-cmblue-500 focus:ring-cmblue-500"
                />
                <div>
                  <p className="text-xs font-medium text-slate-300">Terms & Conditions</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">I agree to the platform terms and conditions</p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={agreed.privacy}
                  onChange={(e) => setAgreed({ ...agreed, privacy: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-cmblue-500 focus:ring-cmblue-500"
                />
                <div>
                  <p className="text-xs font-medium text-slate-300">Privacy Policy</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">I agree to the privacy policy and data handling</p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={agreed.risk}
                  onChange={(e) => setAgreed({ ...agreed, risk: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-cmblue-500 focus:ring-cmblue-500"
                />
                <div>
                  <p className="text-xs font-medium text-slate-300">Risk Acknowledgement</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">I understand the risks of cryptocurrency mining</p>
                </div>
              </label>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                <FaExclamationTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Continue Button */}
            <button
              onClick={handleConnect}
              disabled={connecting || !allAgreed}
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-semibold transition-all ${
                allAgreed && !connecting
                  ? 'bg-gradient-to-r from-cmblue-600 to-cmblue-500 text-white shadow-[0_10px_30px_rgba(14,161,255,0.3)] hover:scale-[1.02]'
                  : 'cursor-not-allowed bg-slate-800 text-slate-500'
              }`}
            >
              {connecting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Connecting...
                </>
              ) : (
                <>
                  <FaLock className="h-4 w-4" />
                  Continue
                </>
              )}
            </button>
          </div>

          {/* Security Note */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-500">
            <FaShieldAlt className="h-3 w-3" />
            Secured by blockchain signature verification
          </div>
        </div>
      </div>
    </div>
  );
}