'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaClipboard, FaExclamationTriangle, FaPaste, FaQrcode, FaShieldAlt, FaWallet } from 'react-icons/fa';
import Logo from './Logo';
import { API_URL } from '@/lib/auth';
import {
  Chain,
  WalletConnectionState,
  connectEvmWallet,
  connectSolanaWallet,
  detectMobilePlatform,
  detectWalletBrowser,
  getSafeWalletRedirectUrl,
  getWalletInstallUrl,
  isWalletProviderAvailable,
  mobileWallets,
  openMobileWallet,
  signEvmMessage,
  signSolanaMessage,
  validateWalletAddress,
} from '@/lib/wallet';

type WalletKind = Chain | 'walletconnect';

interface WalletOption {
  id: string;
  name: string;
  chain: WalletKind;
  icon: string;
}

const wallets: WalletOption[] = [
  { id: 'phantom', name: 'Phantom', chain: 'solana', icon: 'PH' },
  { id: 'solflare', name: 'Solflare', chain: 'solana', icon: 'SF' },
  { id: 'backpack', name: 'Backpack', chain: 'solana', icon: 'BP' },
  { id: 'metamask', name: 'MetaMask', chain: 'ethereum', icon: 'MM' },
  { id: 'trust', name: 'Trust Wallet', chain: 'ethereum', icon: 'TW' },
  { id: 'binance-wallet', name: 'Binance Wallet', chain: 'bnb', icon: 'BN' },
  { id: 'walletconnect', name: 'WalletConnect', chain: 'walletconnect', icon: 'WC' },
];

type LoginMethod = 'wallet' | 'qr' | 'address';

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text || `Server returned ${res.status}` };
  }
}

function walletConnectProjectId() {
  return process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
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
  const [walletAddress, setWalletAddress] = useState('');
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [mobileWalletModalOpen, setMobileWalletModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<WalletConnectionState>('Detecting Wallet');
  const wcClientRef = useRef<any>(null);
  const qrTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const qrRunRef = useRef(0);

  const allAgreed = agreed.terms && agreed.privacy && agreed.risk;
  const availableWallets = useMemo(
    () => wallets.filter((wallet) => wallet.chain !== 'walletconnect' && isWalletProviderAvailable(wallet.id)),
    [showWallets, connecting],
  );
  const unavailableWallets = useMemo(
    () => wallets.filter((wallet) => wallet.chain !== 'walletconnect' && !isWalletProviderAvailable(wallet.id)),
    [showWallets, connecting],
  );

  const completeAuth = (data: any) => {
    localStorage.setItem('cmhash_token', data.token);
    localStorage.setItem('cmhash_user', JSON.stringify(data.user));
    localStorage.setItem('cmhash_created', String(Boolean(data.created)));
    setAuthStatus(data.created ? 'New Account Created' : 'Welcome Back');
    setConnectionStatus('Connected');
    router.replace(data.user.role === 'admin' ? '/admin' : '/dashboard');
  };

  const authenticateWallet = async (walletInfo: { address: string; chain: Chain; walletType: string }, walletId?: string) => {
    const nonceRes = await fetch(`${API_URL}/api/auth/nonce/${walletInfo.address}`);
    const nonceData = await safeJson(nonceRes);
    if (!nonceRes.ok) throw new Error(nonceData.error || 'Failed to get wallet nonce');

    setConnectionStatus('Waiting for Approval');
    const signature = walletInfo.chain === 'solana'
      ? await signSolanaMessage(nonceData.message, walletId)
      : await signEvmMessage(nonceData.message, walletId);

    const authRes = await fetch(`${API_URL}/api/auth/wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: walletInfo.address,
        chain: walletInfo.chain,
        signature,
        message: nonceData.message,
        walletType: walletInfo.walletType,
      }),
    });
    const data = await safeJson(authRes);
    if (!authRes.ok) throw new Error(data.error || `Authentication failed (${authRes.status})`);
    completeAuth(data);
  };

  const connectWalletOption = async (wallet: WalletOption, bypassAgreement = false) => {
    if (!bypassAgreement && !allAgreed) {
      setError('Please accept all terms and conditions to continue.');
      return;
    }
    if (wallet.chain === 'walletconnect') {
      await createQRSession();
      return;
    }

    setConnecting(true);
    setSelectedWallet(wallet);
    setError(null);
    setConnectionStatus('Detecting Wallet');

    try {
      setConnectionStatus('Opening Wallet');
      const walletInfo = wallet.chain === 'solana'
        ? await connectSolanaWallet(wallet.id)
        : await connectEvmWallet(wallet.chain, wallet.id);
      await authenticateWallet(walletInfo, wallet.id);
    } catch (err: any) {
      setConnectionStatus('Connection Failed');
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectClick = async () => {
    setError(null);
    const platform = detectMobilePlatform();

    if (!allAgreed) {
      setError('Please accept all terms and conditions to continue.');
      return;
    }

    if (platform.isMobile) {
      setShowWallets(true);
      return;
    }

    if (availableWallets.length === 1) {
      await connectWalletOption(availableWallets[0]);
      return;
    }

    setShowWallets(true);
  };

  const handleWalletConnect = async () => {
    if (!selectedWallet) {
      setError('Please select a wallet to connect.');
      return;
    }
    if (!detectMobilePlatform().isMobile && selectedWallet.chain !== 'walletconnect' && !isWalletProviderAvailable(selectedWallet.id)) {
      window.location.href = getWalletInstallUrl(selectedWallet.id);
      return;
    }
    await connectWalletOption(selectedWallet);
  };

  const launchSelectedMobileWallet = (targetWalletId: string) => {
    const platform = detectMobilePlatform();
    const wallet = mobileWallets.find((w) => w.id === targetWalletId);
    if (!wallet) return;

    if (!platform.isMobile) {
      handleWalletConnect();
      return;
    }

    setError(`Opening ${wallet.name}. If it is not installed, the official install page will open.`);
    setConnectionStatus('Opening Wallet');
    const returnUrl = getSafeWalletRedirectUrl(`/login?wallet=${encodeURIComponent(wallet.id)}&autoconnect=1`);
    const launchResult = openMobileWallet(wallet.id, returnUrl, (storeUrl) => {
      setConnectionStatus('Connection Failed');
      setError(`${wallet.name} did not open. Redirecting to the official install page.`);
      window.location.href = storeUrl;
    });

    if (launchResult.started) {
      setConnectionStatus('Waiting for Approval');
      setMobileWalletModalOpen(false);
    } else {
      setConnectionStatus('Connection Failed');
      setError(`${wallet.name} could not be opened.`);
    }
  };

  const createQRSession = async () => {
    setLoginMethod('qr');
    setError(null);
    setQrSession(null);

    const projectId = walletConnectProjectId();
    if (!projectId) {
      setError('WalletConnect QR login needs NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to be configured.');
      return;
    }

    const runId = qrRunRef.current + 1;
    qrRunRef.current = runId;
    if (qrTimerRef.current) clearTimeout(qrTimerRef.current);

    try {
      setConnectionStatus('Opening Wallet');
      const SignClient = (await import('@walletconnect/sign-client')).default;
      if (!wcClientRef.current) {
        wcClientRef.current = await SignClient.init({
          projectId,
          metadata: {
            name: 'CM HASH',
            description: 'Wallet address sign-in for CM HASH',
            url: window.location.origin,
            icons: [`${window.location.origin}/favicon.ico`],
          },
        });
      }

      const { uri, approval } = await wcClientRef.current.connect({
        requiredNamespaces: {
          eip155: {
            methods: ['personal_sign'],
            chains: ['eip155:1', 'eip155:56'],
            events: ['accountsChanged', 'chainChanged', 'disconnect'],
          },
        },
      });

      if (!uri) throw new Error('WalletConnect did not return a pairing URI.');

      const qrRes = await fetch(`${API_URL}/api/auth/qr/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionUri: uri }),
      });
      const qrData = await safeJson(qrRes);
      if (!qrRes.ok) throw new Error(qrData.error || 'Failed to create QR session');

      setQrSession({ ...qrData, status: 'Scan with your wallet app' });
      setConnectionStatus('Waiting for Approval');
      qrTimerRef.current = setTimeout(() => {
        if (qrRunRef.current === runId) createQRSession();
      }, Math.max(30_000, new Date(qrData.expiresAt).getTime() - Date.now() - 1000));

      const session = await approval();
      if (qrRunRef.current !== runId) return;

      const account = session.namespaces?.eip155?.accounts?.[0];
      if (!account) throw new Error('No EVM account was approved by the wallet.');
      const [namespace, chainReference, address] = account.split(':');
      const chainId = `${namespace}:${chainReference}`;
      const chain: Chain = chainReference === '56' ? 'bnb' : 'ethereum';

      const nonceRes = await fetch(`${API_URL}/api/auth/nonce/${address}`);
      const nonceData = await safeJson(nonceRes);
      if (!nonceRes.ok) throw new Error(nonceData.error || 'Failed to get wallet nonce');

      setConnectionStatus('Waiting for Approval');
      const signature = await wcClientRef.current.request({
        topic: session.topic,
        chainId,
        request: {
          method: 'personal_sign',
          params: [nonceData.message, address],
        },
      });

      const authRes = await fetch(`${API_URL}/api/auth/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          chain,
          signature,
          message: nonceData.message,
          walletType: 'WalletConnect',
        }),
      });
      const authData = await safeJson(authRes);
      if (!authRes.ok) throw new Error(authData.error || 'QR login failed');
      completeAuth(authData);
    } catch (err: any) {
      if (qrRunRef.current === runId) {
        setConnectionStatus('Connection Failed');
        setError(err.message || 'QR login failed');
      }
    }
  };

  const handleAddressLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = walletAddress.trim();
    const validation = validateWalletAddress(address);
    if (!validation.valid || !validation.chain) {
      setError(validation.error || 'Please enter a valid wallet address');
      return;
    }

    setConnecting(true);
    setError(null);
    setConnectionStatus('Waiting for Approval');

    try {
      const walletInfo = validation.chain === 'solana'
        ? await connectSolanaWallet()
        : await connectEvmWallet(validation.chain);

      if (walletInfo.address.toLowerCase() !== address.toLowerCase()) {
        throw new Error('The connected wallet does not match the address you entered.');
      }

      await authenticateWallet({ ...walletInfo, walletType: 'Address Login' });
    } catch (err: any) {
      setConnectionStatus('Connection Failed');
      setError(err.message || 'Failed to authenticate with wallet address');
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedWallet = params.get('wallet');
    const shouldAutoConnect = params.get('autoconnect') === '1' || Boolean(detectWalletBrowser());
    if (!shouldAutoConnect || connecting || localStorage.getItem('cmhash_token')) return;

    const detected = detectWalletBrowser();
    const walletId = requestedWallet || detected?.walletId;
    const wallet = wallets.find((item) => item.id === walletId);
    if (!wallet || wallet.chain === 'walletconnect') return;

    setAgreed({ terms: true, privacy: true, risk: true });
    const timer = setTimeout(() => connectWalletOption(wallet, true), 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (qrTimerRef.current) clearTimeout(qrTimerRef.current);
      qrRunRef.current += 1;
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0e1a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,161,255,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.12),transparent_30%)]" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_0_40px_rgba(14,161,255,0.2)] backdrop-blur-xl">
              <Logo size={64} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">CM HASH</h1>
            <p className="mt-2 text-sm text-slate-400">Cloud Mining Platform</p>
            <p className="mt-1 text-xs text-slate-500">Connect your wallet to get started</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            {loginMethod === 'wallet' && !showWallets && !qrSession && (
              <div className="space-y-4">
                <button onClick={handleConnectClick} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cmblue-600 to-cmblue-500 px-6 py-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(14,161,255,0.3)] transition-all hover:scale-[1.02]">
                  <FaWallet className="h-5 w-5" />
                  Connect Wallet
                </button>
                <button onClick={createQRSession} className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-white/10">
                  <FaQrcode className="h-5 w-5" />
                  Scan QR Code
                </button>
                <button onClick={() => setLoginMethod('address')} className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-white/10">
                  <FaClipboard className="h-5 w-5" />
                  Paste Wallet Address
                </button>
              </div>
            )}

            {showWallets && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-3xl border border-sky-100 bg-white p-5 text-slate-900 shadow-[0_25px_90px_rgba(33,150,243,0.2)]">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-sky-600">Wallet</p>
                      <h2 className="text-lg font-bold">Connect Wallet</h2>
                    </div>
                    <button onClick={() => setShowWallets(false)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-sky-50">
                      Close
                    </button>
                  </div>

                  <div className="space-y-4">
                    {availableWallets.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-700">Available</p>
                        <div className="grid grid-cols-2 gap-3">
                          {availableWallets.map((wallet) => (
                            <button
                              key={wallet.id}
                              onClick={() => {
                                setSelectedWallet(wallet);
                                setConnectionStatus('Detecting Wallet');
                                if (detectMobilePlatform().isMobile) setMobileWalletModalOpen(true);
                              }}
                              className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all ${selectedWallet?.id === wallet.id ? 'border-sky-400 bg-sky-50 shadow-sm' : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/50'}`}
                            >
                              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-sky-50 text-xs font-black text-sky-700 shadow-sm">{wallet.icon}</span>
                              <span>
                                <span className="block text-xs font-bold">{wallet.name}</span>
                                <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600">Detected</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Install or open app</p>
                      <div className="grid grid-cols-2 gap-3">
                        {unavailableWallets.map((wallet) => (
                          <button
                            key={wallet.id}
                            onClick={() => {
                              setSelectedWallet(wallet);
                              setConnectionStatus('Detecting Wallet');
                              if (detectMobilePlatform().isMobile) setMobileWalletModalOpen(true);
                            }}
                            className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all ${selectedWallet?.id === wallet.id ? 'border-sky-400 bg-sky-50 shadow-sm' : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/50'}`}
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-600 shadow-sm">{wallet.icon}</span>
                            <span>
                              <span className="block text-xs font-bold">{wallet.name}</span>
                              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Unavailable</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {mobileWalletModalOpen && selectedWallet && (
                    <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-700">{selectedWallet.name}</p>
                          <p className="mt-1 text-xs text-slate-600">{detectMobilePlatform().isIOS ? 'iOS wallet launch' : 'Android wallet launch'}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-emerald-700 shadow-sm">{connectionStatus}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => launchSelectedMobileWallet(selectedWallet.id)} className="flex-1 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700">
                          Open Wallet
                        </button>
                        <button onClick={() => { window.location.href = getWalletInstallUrl(selectedWallet.id); }} className="flex-1 rounded-xl border border-sky-200 bg-white px-4 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-50">
                          Install
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50 px-3 py-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Status</span>
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-sky-700 shadow-sm">{connectionStatus}</span>
                  </div>

                  <button onClick={handleWalletConnect} disabled={!selectedWallet || connecting || !allAgreed} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-sky-600 to-sky-500 px-6 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(33,150,243,0.24)] disabled:cursor-not-allowed disabled:opacity-50">
                    {connecting ? 'Connecting...' : selectedWallet && !isWalletProviderAvailable(selectedWallet.id) && !detectMobilePlatform().isMobile ? 'Install Wallet' : 'Connect'}
                  </button>
                </div>
              </div>
            )}

            {qrSession && (
              <div className="space-y-4 text-center">
                <h2 className="text-sm font-semibold text-slate-300">Scan QR Code</h2>
                <div className="flex justify-center">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    {qrSession.qrCodeDataUrl ? (
                      <img src={qrSession.qrCodeDataUrl} alt="CM HASH WalletConnect login QR code" className="h-56 w-56 rounded-xl bg-white object-contain p-2 shadow-2xl shadow-cmblue-900/30" onError={() => setError('Unable to render QR code image')} />
                    ) : (
                      <div className="flex h-56 w-56 items-center justify-center rounded-xl bg-slate-900/80 text-xs text-slate-400">Generating QR...</div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500">{qrSession.status || 'Scan with a WalletConnect-compatible wallet'}</p>
                <button onClick={() => { qrRunRef.current += 1; setQrSession(null); setLoginMethod('wallet'); if (qrTimerRef.current) clearTimeout(qrTimerRef.current); }} className="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
              </div>
            )}

            {loginMethod === 'address' && (
              <div className="space-y-3">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-300">Enter Wallet Address</h2>
                  <button onClick={() => { setLoginMethod('wallet'); setWalletAddress(''); setError(null); }} className="text-xs text-slate-500 hover:text-slate-300">Back</button>
                </div>
                <form onSubmit={handleAddressLogin}>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => {
                      setWalletAddress(e.target.value);
                      const validation = validateWalletAddress(e.target.value);
                      setError(e.target.value && !validation.valid ? validation.error || null : null);
                    }}
                    placeholder="Paste your wallet address"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cmblue-500/50"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        setWalletAddress(text.trim());
                        const validation = validateWalletAddress(text.trim());
                        setError(validation.valid ? null : validation.error || 'Invalid wallet address');
                      } catch {
                        setError('Clipboard paste is blocked by this browser. Paste the address manually.');
                      }
                    }}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
                  >
                    <FaPaste className="h-3.5 w-3.5" />
                    Paste from Clipboard
                  </button>
                  <button type="submit" disabled={connecting || !walletAddress || Boolean(error)} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cmblue-600 to-cmblue-500 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                    {connecting ? 'Processing...' : 'Continue'}
                  </button>
                </form>
              </div>
            )}

            {!qrSession && loginMethod !== 'address' && (
              <div className="mt-6 space-y-3">
                {[
                  ['terms', 'Terms & Conditions', 'I agree to the platform terms and conditions'],
                  ['privacy', 'Privacy Policy', 'I agree to the privacy policy and data handling'],
                  ['risk', 'Risk Acknowledgement', 'I understand the risks of cryptocurrency mining'],
                ].map(([key, title, text]) => (
                  <label key={key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10">
                    <input
                      type="checkbox"
                      checked={agreed[key as keyof typeof agreed]}
                      onChange={(e) => setAgreed({ ...agreed, [key]: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-cmblue-500 focus:ring-cmblue-500"
                    />
                    <div>
                      <p className="text-xs font-medium text-slate-300">{title}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">{text}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {authStatus && <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-xs font-semibold text-emerald-300">{authStatus}</div>}
            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                <FaExclamationTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-500">
            <FaShieldAlt className="h-3 w-3" />
            Secured by blockchain signature verification
          </div>
        </div>
      </div>
    </div>
  );
}
