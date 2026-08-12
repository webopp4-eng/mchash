'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaClipboard, FaExclamationTriangle, FaPaste, FaShieldAlt, FaWallet, FaQrcode, FaSyncAlt } from 'react-icons/fa';
import Logo from './Logo';
import { API_URL } from '@/lib/auth';
import { validateWalletAddress, isMobileDevice, mobileWallets, openMobileWallet, getWalletInstallUrl } from '@/lib/wallet';
import { useAccount, useChainId, useSignMessage } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

type LoginMethod = 'wallet' | 'address' | 'qrcode' | 'mobile';

type SupportedChain = 'ethereum' | 'bnb';

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text || `Server returned ${res.status}` };
  }
}

function walletChainFromId(chainId: number | undefined): SupportedChain | null {
  if (chainId === 1) return 'ethereum';
  if (chainId === 56) return 'bnb';
  return null;
}

export default function WalletSignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref');
  const [agreed, setAgreed] = useState({ terms: false, privacy: false, risk: false });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('wallet');
  const [connectionStatus, setConnectionStatus] = useState('Detecting Wallet');
  const [mobileFallback, setMobileFallback] = useState<string | null>(null);

  const { address, connector, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const { openConnectModal } = useConnectModal();

  const allAgreed = agreed.terms && agreed.privacy && agreed.risk;
  const walletChain = useMemo(() => walletChainFromId(chainId), [chainId]);
  const walletType = connector?.name || 'Wallet';
  const isMobile = isMobileDevice();

  const completeAuth = (data: any) => {
    localStorage.setItem('cmhash_token', data.token);
    localStorage.setItem('cmhash_user', JSON.stringify(data.user));
    localStorage.setItem('cmhash_created', String(Boolean(data.created)));
    setAuthStatus(data.created ? 'New Account Created' : 'Welcome Back');
    setConnectionStatus('Connected');
    router.replace(data.user.role === 'admin' ? '/admin' : '/dashboard');
  };

  const authenticateConnectedWallet = async () => {
    if (!address) throw new Error('Wallet address is not available.');
    if (!walletChain) throw new Error('Unsupported network. Switch to Ethereum or BNB Smart Chain.');

    setConnectionStatus('Waiting for Approval');
    const nonceRes = await fetch(`${API_URL}/api/auth/nonce/${address}`);
    const nonceData = await safeJson(nonceRes);
    if (!nonceRes.ok) throw new Error(nonceData.error || 'Failed to get wallet nonce');

    const signature = await signMessageAsync({ message: nonceData.message });
    const authRes = await fetch(`${API_URL}/api/auth/wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        chain: walletChain,
        signature,
        message: nonceData.message,
        walletType,
        ...(referralCode ? { referredBy: referralCode } : {}),
      }),
    });
    const authData = await safeJson(authRes);
    if (!authRes.ok) throw new Error(authData.error || `Authentication failed (${authRes.status})`);
    completeAuth(authData);
  };

  useEffect(() => {
    if (!isConnected || !allAgreed || connecting) return;
    if (localStorage.getItem('cmhash_token')) return;

    setConnecting(true);
    setError(null);
    setConnectionStatus('Opening Wallet');

    authenticateConnectedWallet()
      .catch((err: any) => {
        console.error(err);
        setConnectionStatus('Connection Failed');
        setError(err?.message || 'Failed to authenticate wallet');
      })
      .finally(() => setConnecting(false));
  }, [isConnected, allAgreed, address, walletChain, walletType]);

  const handleConnectClick = async () => {
    setError(null);
    if (!allAgreed) {
      setError('Please accept all terms and conditions to continue.');
      return;
    }
    if (!openConnectModal) {
      setError('Wallet connect modal is unavailable. Install a supported wallet extension or open this page in a wallet-enabled browser.');
      return;
    }
    setConnectionStatus('Opening Wallet');
    openConnectModal();
  };

  const handleMobileWallet = (walletId: string) => {
    setError(null);
    setMobileFallback(null);
    if (!allAgreed) {
      setError('Please accept all terms and conditions to continue.');
      return;
    }
    if (walletId === 'walletconnect') {
      handleConnectClick();
      return;
    }
    setConnectionStatus('Opening Wallet');
    const result = openMobileWallet(walletId, '/login?autoconnect=1', (storeUrl) => {
      setMobileFallback(storeUrl);
    });
    if (!result.started) {
      setError('Could not open the wallet app. Please install it and try again.');
      setMobileFallback(getWalletInstallUrl(walletId));
    }
  };

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  const loadQrCode = async () => {
    setQrLoading(true);
    setQrError(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/qr/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionUri: '' }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Failed to create QR session');
      setQrCode(data.qrCodeDataUrl);
    } catch (err: any) {
      setQrError(err.message || 'Failed to load QR code');
    } finally {
      setQrLoading(false);
    }
  };

  const handleAddressLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const addressValue = walletAddress.trim();
    const validation = validateWalletAddress(addressValue);
    if (!validation.valid || !validation.chain) {
      setError(validation.error || 'Please enter a valid wallet address.');
      return;
    }

    if (!isConnected || !address) {
      setError('Connect your wallet before authenticating with an address.');
      return;
    }

    if (address.toLowerCase() !== addressValue.toLowerCase()) {
      setError('Connected wallet address does not match the pasted address.');
      return;
    }

    setConnecting(true);
    setError(null);
    setConnectionStatus('Waiting for Approval');

    authenticateConnectedWallet()
      .catch((err: any) => {
        console.error(err);
        setConnectionStatus('Connection Failed');
        setError(err?.message || 'Failed to authenticate wallet');
      })
      .finally(() => setConnecting(false));
  };

  const renderTerms = (
    <div className="mt-5 space-y-2.5 border-t border-slate-800 pt-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Agreements</p>
      {[
        ['terms', 'Terms & Conditions'],
        ['privacy', 'Privacy Policy'],
        ['risk', 'Risk Acknowledgement'],
      ].map(([key, label]) => (
        <label key={key} className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-400 transition hover:text-slate-300">
          <input
            type="checkbox"
            checked={agreed[key as keyof typeof agreed]}
            onChange={(e) => setAgreed({ ...agreed, [key]: e.target.checked })}
            className="h-3.5 w-3.5 shrink-0 rounded border-slate-600 bg-slate-800 text-cmblue-500 focus:ring-cmblue-500"
          />
          {label}
        </label>
      ))}
    </div>
  );

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
            {loginMethod === 'wallet' && (
              <div className="space-y-3">
                <button
                  onClick={handleConnectClick}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cmblue-600 to-cmblue-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(14,161,255,0.3)] transition-all hover:scale-[1.02]"
                  disabled={connecting}
                >
                  <FaWallet className="h-5 w-5" />
                  {isConnected ? 'Sign In with Wallet' : 'Connect Wallet'}
                </button>

                {isMobile && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="mb-3 text-xs font-semibold text-slate-300">Or choose a mobile wallet:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {mobileWallets.map((wallet) => (
                        <button
                          key={wallet.id}
                          onClick={() => handleMobileWallet(wallet.id)}
                          disabled={connecting}
                          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-medium text-slate-200 transition hover:border-cmblue-500/40 hover:bg-white/10 disabled:opacity-50"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cmblue-500/20 text-[10px] font-bold text-cmblue-300">
                            {wallet.name.charAt(0)}
                          </span>
                          {wallet.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isConnected && address && (
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-200">
                    <p className="font-semibold">Connected Wallet</p>
                    <p className="mt-1 break-words text-xs text-slate-400">{address}</p>
                    <p className="mt-2 text-xs text-slate-500">Network: {walletChain ?? 'Unsupported'}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setLoginMethod('mobile');
                      setError(null);
                    }}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-[10px] font-semibold text-white transition-all hover:bg-white/10"
                    disabled={connecting}
                  >
                    <FaWallet className="h-4 w-4" />
                    Mobile
                  </button>
                  <button
                    onClick={() => {
                      setLoginMethod('address');
                      setError(null);
                    }}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-[10px] font-semibold text-white transition-all hover:bg-white/10"
                    disabled={connecting}
                  >
                    <FaClipboard className="h-4 w-4" />
                    Address
                  </button>
                  <button
                    onClick={() => {
                      setLoginMethod('qrcode');
                      setError(null);
                      if (!qrCode) loadQrCode();
                    }}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-[10px] font-semibold text-white transition-all hover:bg-white/10"
                    disabled={connecting}
                  >
                    <FaQrcode className="h-4 w-4" />
                    QR Code
                  </button>
                </div>
              </div>
            )}

            {loginMethod === 'mobile' && (
              <div className="space-y-3">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-300">Choose a Wallet</h2>
                  <button
                    onClick={() => {
                      setLoginMethod('wallet');
                      setError(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    Back
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {mobileWallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => handleMobileWallet(wallet.id)}
                      disabled={connecting}
                      className="flex flex-col items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-cmblue-500/40 hover:bg-white/10 disabled:opacity-50"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cmblue-500/20 text-sm font-bold text-cmblue-300">
                        {wallet.name.charAt(0)}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{wallet.name}</p>
                        <p className="text-[10px] capitalize text-slate-500">{wallet.chain}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {mobileFallback && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                    <p>Wallet not detected. Install it to continue:</p>
                    <a
                      href={mobileFallback}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1.5 font-semibold text-amber-200 transition hover:bg-amber-500/30"
                    >
                      Install Wallet
                    </a>
                  </div>
                )}
              </div>
            )}

            {loginMethod === 'qrcode' && (
              <div className="space-y-3">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-300">Scan with Mobile Wallet</h2>
                  <button
                    onClick={() => {
                      setLoginMethod('wallet');
                      setQrCode(null);
                      setQrError(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    Back
                  </button>
                </div>

                {qrLoading && (
                  <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
                  </div>
                )}

                {qrError && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                    {qrError}
                  </div>
                )}

                {qrCode && !qrLoading && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="rounded-2xl bg-white p-4 shadow-[0_10px_40px_rgba(14,161,255,0.2)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrCode} alt="Scan with mobile wallet" className="h-48 w-48" />
                    </div>
                    <p className="text-center text-xs text-slate-400">
                      Scan this QR code with your mobile wallet app to connect.
                    </p>
                    <button
                      onClick={loadQrCode}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
                    >
                      <FaSyncAlt className="h-3.5 w-3.5" />
                      Refresh QR Code
                    </button>
                  </div>
                )}
              </div>
            )}

            {loginMethod === 'address' && (
              <div className="space-y-3">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-300">Enter Wallet Address</h2>
                  <button
                    onClick={() => {
                      setLoginMethod('wallet');
                      setWalletAddress('');
                      setError(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-300"
                    disabled={connecting}
                  >
                    Back
                  </button>
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
                    disabled={connecting}
                  >
                    <FaPaste className="h-3.5 w-3.5" />
                    Paste from Clipboard
                  </button>
                  <button
                    type="submit"
                    disabled={connecting || !walletAddress || Boolean(error)}
                    className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cmblue-600 to-cmblue-500 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {connecting ? 'Processing...' : 'Continue'}
                  </button>
                </form>
              </div>
            )}

            {renderTerms}

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

          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-500">
            <FaShieldAlt className="h-3 w-3" />
            Secured by blockchain signature verification
          </div>
        </div>
      </div>
    </div>
  );
}