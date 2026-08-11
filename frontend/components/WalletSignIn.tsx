'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaWallet, FaShieldAlt, FaExclamationTriangle, FaLock, FaQrcode, FaClipboard } from 'react-icons/fa';
import Logo from './Logo';
import { connectSolanaWallet, connectEvmWallet, signSolanaMessage, signEvmMessage, detectWalletProvider, Chain, detectMobilePlatform, openMobileWallet, getWalletInstallUrl, mobileWallets } from '@/lib/wallet';
import { API_URL } from '@/lib/auth';

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
  { id: 'binance', name: 'Binance Wallet', chain: 'bnb', icon: '🟡', color: 'from-yellow-600 to-amber-600' },
];

type LoginMethod = 'wallet' | 'qr' | 'address';

// Helper to safely parse JSON responses
async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text || `Server returned ${res.status}` };
  }
}

export default function WalletSignIn() {
  const router = useRouter();
  const [agreed, setAgreed] = useState({ terms: false, privacy: false, risk: false });
  const [selectedWallet, setSelectedWallet] = useState<WalletOption | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWallets, setShowWallets] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('wallet');
  const [qrSession, setQrSession] = useState<any>(null);
  const [qrPolling, setQrPolling] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [mobileWalletModalOpen, setMobileWalletModalOpen] = useState(false);

  const allAgreed = agreed.terms && agreed.privacy && agreed.risk;

  const launchSelectedMobileWallet = (targetWalletId: string) => {
    const { isMobile, isIOS, isAndroid } = detectMobilePlatform();
    if (!isMobile) {
      handleWalletConnect();
      return;
    }

    const wallet = mobileWallets.find((w) => w.id === targetWalletId) || mobileWallets[0];
    const launchResult = openMobileWallet(wallet.id, window.location.origin);
    const installUrl = getWalletInstallUrl(wallet.id);

    if (isIOS) {
      setError(`Opening ${wallet.name}. If the app is not installed, Apple App Store will open.`);
    } else if (isAndroid) {
      setError(`Opening ${wallet.name}. If the app is not installed, Google Play Store will open.`);
    }

    if (installUrl) {
      window.setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = installUrl;
        }
      }, 900);
    }

    if (launchResult.started) {
      setMobileWalletModalOpen(false);
    }
  };

  const handleWalletConnect = async () => {
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
      console.log('[WalletSignIn] Fetching nonce for', walletInfo.address, 'from', `${API_URL}/api/auth/nonce/${walletInfo.address}`);
      const nonceRes = await fetch(`${API_URL}/api/auth/nonce/${walletInfo.address}`);
      if (!nonceRes.ok) {
        const errText = await nonceRes.text();
        console.error('[WalletSignIn] Nonce fetch failed:', nonceRes.status, errText);
        throw new Error(`Backend error (${nonceRes.status}): ${errText || 'Failed to get nonce'}`);
      }
      const { nonce, message } = await nonceRes.json();

      // Sign message
      let signature;
      if (walletInfo.chain === 'solana') {
        signature = await signSolanaMessage(message);
      } else {
        signature = await signEvmMessage(message);
      }

      // Authenticate with backend
      console.log('[WalletSignIn] Authenticating with backend', `${API_URL}/api/auth/wallet`);
      const authRes = await fetch(`${API_URL}/api/auth/wallet`, {
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

      const data = await safeJson(authRes);
      if (!authRes.ok) {
        console.error('[WalletSignIn] Auth failed:', data);
        throw new Error(data.error || `Authentication failed (${authRes.status})`);
      }
      console.log('[WalletSignIn] Auth success');

      // Store token and user
      localStorage.setItem('cmhash_token', data.token);
      localStorage.setItem('cmhash_user', JSON.stringify(data.user));
      localStorage.setItem('cmhash_created', String(Boolean(data.created)));
      setAuthStatus(data.created ? 'New Account Created' : 'Welcome Back');

      // Redirect based on role
      const target = data.user.role === 'admin' ? '/admin' : '/';
      console.log('[WalletSignIn] Redirecting to', target, 'for role', data.user.role);
      router.replace(target);
    } catch (err: any) {
      console.error('[WalletSignIn] Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  const createQRSession = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/qr/session`, {
        method: 'POST',
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Failed to create QR session');
      setQrSession(data);
      setQrPolling(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create QR session');
    }
  };

  const handleAddressLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress || walletAddress.length < 10) {
      setError('Please enter a valid wallet address');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      // Detect chain based on address format
      let chain: Chain = 'ethereum';
      if (walletAddress.startsWith('1') || walletAddress.startsWith('3') || walletAddress.startsWith('bc1')) {
        chain = 'ethereum';
      } else if (walletAddress.length === 44) {
        chain = 'solana';
      }

      // Get nonce
      const nonceRes = await fetch(`${API_URL}/api/auth/nonce/${walletAddress}`);
      if (!nonceRes.ok) {
        const errText = await nonceRes.text();
        throw new Error(`Backend error (${nonceRes.status}): ${errText || 'Failed to get nonce'}`);
      }
      const { nonce, message } = await nonceRes.json();

      // Prompt user to sign
      setError('Please sign the message in your wallet to complete login');

      let signature;
      if (chain === 'solana') {
        signature = await signSolanaMessage(message);
      } else {
        signature = await signEvmMessage(message);
      }

      // Authenticate
      const authRes = await fetch(`${API_URL}/api/auth/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress,
          chain,
          signature,
          message,
          walletType: 'Address Login',
        }),
      });

      const data = await safeJson(authRes);
      if (!authRes.ok) {
        console.error('[WalletSignIn] Auth failed:', data);
        throw new Error(data.error || `Authentication failed (${authRes.status})`);
      }

      // Store token and user
      localStorage.setItem('cmhash_token', data.token);
      localStorage.setItem('cmhash_user', JSON.stringify(data.user));
      localStorage.setItem('cmhash_created', String(Boolean(data.created)));
      setAuthStatus(data.created ? 'New Account Created' : 'Welcome Back');

      // Redirect based on role
      const target = data.user.role === 'admin' ? '/admin' : '/';
      console.log('[WalletSignIn] Redirecting to', target, 'for role', data.user.role);
      router.replace(target);
    } catch (err: any) {
      console.error('[WalletSignIn] Connection error:', err);
      setError(err.message || 'Failed to authenticate with wallet address');
    } finally {
      setConnecting(false);
    }
  };

  // Poll QR session status
  useEffect(() => {
    if (!qrPolling || !qrSession?.sessionId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/qr/session/${qrSession.sessionId}`);
        const data = await safeJson(res);

        if (res.ok && data.status === 'used' && data.address) {
          // QR login successful - complete authentication
          clearInterval(interval);
          setQrPolling(false);

          // Get nonce and sign
          const nonceRes = await fetch(`${API_URL}/api/auth/nonce/${data.address}`);
          if (!nonceRes.ok) {
            const errText = await nonceRes.text();
            throw new Error(`Backend error (${nonceRes.status}): ${errText || 'Failed to get nonce'}`);
          }
          const { message } = await nonceRes.json();

          setError('Please sign the message in your wallet to complete login');

          let signature;
          if (data.chain === 'solana') {
            signature = await signSolanaMessage(message);
          } else {
            signature = await signEvmMessage(message);
          }

          const authRes = await fetch(`${API_URL}/api/auth/qr/session/${qrSession.sessionId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: data.address,
              chain: data.chain,
              signature,
              message,
              walletType: data.walletType,
            }),
          });

          const authData = await safeJson(authRes);
          if (!authRes.ok) {
            throw new Error(authData.error || 'QR login failed');
          }

          localStorage.setItem('cmhash_token', authData.token);
          localStorage.setItem('cmhash_user', JSON.stringify(authData.user));
          localStorage.setItem('cmhash_created', String(Boolean(authData.created)));
          setAuthStatus(authData.created ? 'New Account Created' : 'Welcome Back');

          const target = authData.user.role === 'admin' ? '/admin' : '/';
          router.replace(target);
        }
      } catch (err: any) {
        console.error('[WalletSignIn] QR polling error:', err);
        setError(err.message || 'QR login failed');
        clearInterval(interval);
        setQrPolling(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [qrPolling, qrSession, router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#FFFFFF_0%,#EAF6FF_100%)] text-slate-900">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-sky-200/60 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-100/70 blur-[100px]" />
        <div className="absolute left-0 top-1/2 h-64 w-64 rounded-full bg-sky-100/90 blur-[80px]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo & Branding */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 rounded-3xl border border-sky-100 bg-white p-4 shadow-soft">
              <Logo size={64} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">CM HASH</h1>
            <p className="mt-2 text-sm text-sky-700">Cloud Mining Platform</p>
            <p className="mt-1 text-xs text-slate-500">Connect your wallet to get started</p>
          </div>

          {/* Main Card */}
          <div className="rounded-[2rem] border border-sky-100 bg-white/95 p-6 shadow-soft">
            {/* Login Method Selection */}
            {loginMethod === 'wallet' && !showWallets && !qrSession && (
              <div className="space-y-4">
                <button
                  onClick={() => setShowWallets(true)}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cmblue-600 to-cmblue-500 px-6 py-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(14,161,255,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_10px_40px_rgba(14,161,255,0.4)]"
                >
                  <FaWallet className="h-5 w-5" />
                  Connect Wallet
                </button>
                <button
                  onClick={createQRSession}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-white/10"
                >
                  <FaQrcode className="h-5 w-5" />
                  Scan QR Code
                </button>
                <button
                  onClick={() => setLoginMethod('address')}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-white/10"
                >
                  <FaClipboard className="h-5 w-5" />
                  Paste Wallet Address
                </button>
              </div>
            )}

            {/* Wallet Selection */}
            {showWallets && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-[2rem] border border-sky-100 bg-white p-5 shadow-[0_25px_90px_rgba(33,150,243,0.2)]">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-sky-600">Mobile wallet</p>
                      <h2 className="text-lg font-bold text-slate-900">Connect Wallet</h2>
                    </div>
                    <button onClick={() => setShowWallets(false)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-sky-50 hover:text-sky-700">
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {wallets.map((wallet) => (
                      <button
                        key={wallet.id}
                        onClick={() => {
                          setSelectedWallet(wallet);
                          const mobileEnv = detectMobilePlatform();
                          if (mobileEnv.isMobile) {
                            setMobileWalletModalOpen(true);
                          }
                        }}
                        className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all ${
                          selectedWallet?.id === wallet.id
                            ? 'border-sky-400 bg-sky-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/50'
                        }`}
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-sky-50 text-lg text-sky-700 shadow-sm">
                          {wallet.icon}
                        </span>
                        <span>
                          <span className="block text-xs font-bold text-slate-900">{wallet.name}</span>
                          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{wallet.chain}</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  {mobileWalletModalOpen && selectedWallet && (
                    <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-700">{selectedWallet.name}</p>
                          <p className="mt-1 text-xs text-slate-600">
                            {detectMobilePlatform().isIOS ? 'iOS wallet detection' : detectMobilePlatform().isAndroid ? 'Android wallet detection' : 'Desktop browser mode'}
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[10px] font-bold text-emerald-700 shadow-sm">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          {detectMobilePlatform().isMobile ? 'Open app' : 'Install wallet'}
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => launchSelectedMobileWallet(selectedWallet.id)}
                          className="flex-1 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700"
                        >
                          {detectMobilePlatform().isMobile ? 'Open Wallet' : 'Connect Wallet'}
                        </button>
                        <button
                          onClick={() => {
                            const installUrl = getWalletInstallUrl(selectedWallet.id);
                            if (installUrl) window.location.href = installUrl;
                          }}
                          className="flex-1 rounded-xl border border-sky-200 bg-white px-4 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-50"
                        >
                          Install
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleWalletConnect}
                    disabled={!selectedWallet || connecting || !allAgreed}
                    className="mt-4 w-full rounded-2xl bg-gradient-to-r from-sky-600 to-sky-500 px-6 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(33,150,243,0.24)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {connecting ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              </div>
            )}

            {/* QR Code Session */}
            {qrSession && (
              <div className="space-y-4 text-center">
                <h2 className="text-sm font-semibold text-slate-300">Scan QR Code</h2>
                <div className="flex justify-center">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    {qrSession.qrCodeDataUrl ? (
                      <img
                        src={qrSession.qrCodeDataUrl}
                        alt="CM HASH wallet authentication QR code"
                        className="h-56 w-56 rounded-xl bg-white object-contain p-2 shadow-2xl shadow-cmblue-900/30"
                        onError={() => setError('Unable to render QR code image')}
                      />
                    ) : (
                      <div className="flex h-56 w-56 items-center justify-center rounded-xl bg-slate-900/80 text-xs text-slate-400">
                        Generating QR...
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Scan this QR code with your wallet app to login
                </p>
                <button
                  onClick={() => { setQrSession(null); setQrPolling(false); }}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Address Login */}
            {loginMethod === 'address' && (
              <div className="space-y-3">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-300">Enter Wallet Address</h2>
                  <button onClick={() => { setLoginMethod('wallet'); setWalletAddress(''); }} className="text-xs text-slate-500 hover:text-slate-300">
                    Back
                  </button>
                </div>
                <form onSubmit={handleAddressLogin}>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Paste your wallet address"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cmblue-500/50"
                  />
                  <button
                    type="submit"
                    disabled={connecting || !walletAddress}
                    className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cmblue-600 to-cmblue-500 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {connecting ? 'Processing...' : 'Continue'}
                  </button>
                </form>
              </div>
            )}

            {/* Checkboxes */}
            {!qrSession && loginMethod !== 'address' && (
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
            )}

            {authStatus && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-xs font-semibold text-emerald-300">
                {authStatus}
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                <FaExclamationTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
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
