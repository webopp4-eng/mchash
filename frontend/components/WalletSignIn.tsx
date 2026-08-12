'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaClipboard, FaExclamationTriangle, FaPaste, FaShieldAlt, FaWallet, FaQrcode, FaSyncAlt } from 'react-icons/fa';
import Logo from './Logo';
import { API_URL } from '@/lib/auth';
import { validateWalletAddress, isMobileDevice, getAvailableMobileWallets, openMobileWallet, getWalletInstallUrl, connectPhantomWallet, signPhantomMessage, isPhantomProviderAvailable } from '@/lib/wallet';
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

function getAuthErrorMessage(status: number, data: any, retryAfter?: string | null): string {
  if (status === 429) {
    // Rate limit error
    const seconds = retryAfter ? parseInt(retryAfter) : 60;
    return `Too many authentication attempts. Please try again in ${seconds} second${seconds !== 1 ? 's' : ''}.`;
  }
  if (status === 401) {
    return 'Signature verification failed. Please try signing the message again.';
  }
  if (status === 400) {
    return data.error || 'Invalid request. Please check your wallet address and try again.';
  }
  if (status === 403) {
    return 'Your account is no longer active. Please contact support for assistance.';
  }
  return data.error || `Authentication failed (${status})`;
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
  const [agreed, setAgreed] = useState(() => {
    if (typeof window === 'undefined') {
      return { terms: false, privacy: false, risk: false };
    }
    try {
      const stored = window.localStorage.getItem('cmhash_agreed');
      return stored ? JSON.parse(stored) : { terms: false, privacy: false, risk: false };
    } catch {
      return { terms: false, privacy: false, risk: false };
    }
  });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('wallet');
  const [connectionStatus, setConnectionStatus] = useState('Detecting Wallet');
  const [mobileFallback, setMobileFallback] = useState<string | null>(null);
  const [autoConnect, setAutoConnect] = useState(false);
  const [phantomAvailable, setPhantomAvailable] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const { address, connector, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const { openConnectModal } = useConnectModal();

  const allAgreed = agreed.terms && agreed.privacy && agreed.risk;
  const walletChain = useMemo(() => walletChainFromId(chainId), [chainId]);
  const walletType = connector?.name || 'Wallet';
  const isMobile = isMobileDevice();

  // Hydration safety: mark as mounted after client hydration
  useEffect(() => {
    setIsMounted(true);
    setPhantomAvailable(isPhantomProviderAvailable());
  }, []);

  useEffect(() => {
    window.localStorage.setItem('cmhash_agreed', JSON.stringify(agreed));
  }, [agreed]);

  useEffect(() => {
    const shouldAuto = searchParams.get('autoconnect') === '1';
    setAutoConnect(shouldAuto);
    if (typeof window !== 'undefined') {
      const returnUrl = window.localStorage.getItem('cmhash_return_url');
      if (returnUrl && shouldAuto) {
        setConnectionStatus('Processing wallet connection...');
      }
    }
  }, [searchParams]);

  const completeAuth = useCallback((data: any) => {
    try {
      console.log('[completeAuth] Starting auth completion with user:', data.user?.id);
      
      // Store authentication data
      localStorage.setItem('cmhash_token', data.token);
      localStorage.setItem('cmhash_user', JSON.stringify(data.user));
      localStorage.setItem('cmhash_created', String(Boolean(data.created)));
      localStorage.removeItem('cmhash_return_url');
      localStorage.removeItem('cmhash_autoconnect'); // Clear autoconnect flag
      
      // Verify data was stored
      const storedUser = localStorage.getItem('cmhash_user');
      if (!storedUser) {
        console.error('[completeAuth] Failed to store user data');
        setError('Failed to save authentication data');
        setConnecting(false);
        return;
      }
      
      setAuthStatus(data.created ? 'New Account Created' : 'Welcome Back');
      setConnectionStatus('Connected');
      
      // Redirect after a short delay to ensure localStorage is synced
      const redirectUrl = data.user.role === 'admin' ? '/admin' : '/dashboard';
      console.log('[completeAuth] Redirecting to:', redirectUrl);
      
      setTimeout(() => {
        console.log('[completeAuth] Executing redirect');
        router.push(redirectUrl); // Use push instead of replace to avoid race conditions
      }, 150);
    } catch (err) {
      console.error('[completeAuth] Error during auth completion:', err);
      setError('Failed to complete authentication');
      setConnecting(false);
    }
  }, [router]);

  const authenticatePhantomWallet = useCallback(async () => {
    const wallet = await connectPhantomWallet();
    const nonceRes = await fetch(`${API_URL}/api/auth/nonce/${wallet.address}?chain=solana`, {
      credentials: 'include',
    });
    const nonceData = await safeJson(nonceRes);
    if (!nonceRes.ok) {
      const retryAfter = nonceRes.headers.get('retry-after');
      throw new Error(getAuthErrorMessage(nonceRes.status, nonceData, retryAfter));
    }

    const signature = await signPhantomMessage(nonceData.message);
    const authRes = await fetch(`${API_URL}/api/auth/wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        address: wallet.address,
        chain: 'solana',
        signature,
        message: nonceData.message,
        walletType: 'Phantom',
        ...(referralCode ? { referredBy: referralCode } : {}),
      }),
    });
    const authData = await safeJson(authRes);
    if (!authRes.ok) {
      const retryAfter = authRes.headers.get('retry-after');
      throw new Error(getAuthErrorMessage(authRes.status, authData, retryAfter));
    }
    completeAuth(authData);
  }, [referralCode, completeAuth]);

  const authenticateConnectedWallet = useCallback(async () => {
    if (!address) throw new Error('Wallet address is not available.');
    if (!walletChain) throw new Error('Unsupported network. Switch to Ethereum or BNB Smart Chain.');

    setConnectionStatus('Waiting for Approval');
    const nonceRes = await fetch(`${API_URL}/api/auth/nonce/${address}?chain=${encodeURIComponent(walletChain)}`, {
      credentials: 'include',
    });
    const nonceData = await safeJson(nonceRes);
    if (!nonceRes.ok) {
      const retryAfter = nonceRes.headers.get('retry-after');
      throw new Error(getAuthErrorMessage(nonceRes.status, nonceData, retryAfter));
    }

    const signature = await signMessageAsync({ message: nonceData.message });
    const authRes = await fetch(`${API_URL}/api/auth/wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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
    if (!authRes.ok) {
      const retryAfter = authRes.headers.get('retry-after');
      throw new Error(getAuthErrorMessage(authRes.status, authData, retryAfter));
    }
    completeAuth(authData);
  }, [address, walletChain, walletType, referralCode, completeAuth]);

  useEffect(() => {
    if (!isConnected || !allAgreed || !autoConnect || connecting) return;
    // Don't auto-auth if already logged in
    if (localStorage.getItem('cmhash_token') && localStorage.getItem('cmhash_user')) return;

    setConnecting(true);
    setError(null);
    setConnectionStatus('Opening Wallet');

    authenticateConnectedWallet()
      .catch((err: any) => {
        console.error(err);
        setConnectionStatus('Connection Failed');
        setError(err?.message || 'Failed to authenticate wallet');
        setConnecting(false);
      });
  }, [isConnected, allAgreed, autoConnect, connecting, authenticateConnectedWallet]);

  useEffect(() => {
    if (!allAgreed || !autoConnect || connecting) return;
    if (localStorage.getItem('cmhash_token')) return;
    if (isConnected && walletChain) return;
    if (!phantomAvailable) return;

    setConnecting(true);
    setError(null);
    setConnectionStatus('Opening Phantom Wallet');

    authenticatePhantomWallet()
      .catch((err: any) => {
        console.error(err);
        setConnectionStatus('Connection Failed');
        setError(err?.message || 'Failed to authenticate Phantom wallet');
      })
      .finally(() => setConnecting(false));
  }, [allAgreed, autoConnect, connecting, phantomAvailable, isConnected, walletChain, authenticatePhantomWallet]);

  // Handle wallet app redirect callback
  useEffect(() => {
    const handleWalletAuth = (event: Event) => {
      const customEvent = event as CustomEvent<{ fromWallet?: boolean; returnUrl?: string }>;
      const fromWallet = customEvent?.detail?.fromWallet || (event as PopStateEvent)?.state?.fromWallet;
      if (!fromWallet) return;

      const returnUrl = window.localStorage.getItem('cmhash_return_url');
      if (!returnUrl) return;

      setConnectionStatus('Processing wallet connection...');
      setAutoConnect(true);

      if (!isConnected || !allAgreed) return;
      setConnecting(true);
      authenticateConnectedWallet()
        .catch((err: any) => {
          console.error(err);
          setConnectionStatus('Connection Failed');
          setError(err?.message || 'Failed to authenticate wallet');
        })
        .finally(() => setConnecting(false));
    };

    window.addEventListener('cmhash:wallet-auth', handleWalletAuth as EventListener);
    window.addEventListener('popstate', handleWalletAuth as EventListener);
    return () => {
      window.removeEventListener('cmhash:wallet-auth', handleWalletAuth as EventListener);
      window.removeEventListener('popstate', handleWalletAuth as EventListener);
    };
  }, [authenticateConnectedWallet, allAgreed, isConnected]);

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
    if (walletId === 'phantom' && isPhantomProviderAvailable()) {
      setConnectionStatus('Opening Phantom Wallet');
      setConnecting(true);
      authenticatePhantomWallet()
        .catch((err: any) => {
          console.error(err);
          setConnectionStatus('Connection Failed');
          setError(err?.message || 'Failed to authenticate Phantom wallet');
        })
        .finally(() => setConnecting(false));
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
        credentials: 'include',
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
                  suppressHydrationWarning
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cmblue-600 to-cmblue-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(14,161,255,0.3)] transition-all hover:scale-[1.02]"
                  disabled={connecting}
                >
                  <FaWallet className="h-5 w-5" />
                  {isConnected ? 'Sign In with Wallet' : 'Connect Wallet'}
                </button>

                {isMobile && (
                  <div className="rounded-2xl border border-cmblue-500/30 bg-gradient-to-b from-cmblue-500/10 to-cmblue-500/5 p-4 shadow-[0_0_20px_rgba(14,161,255,0.1)]">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-cmblue-300">Mobile Wallets Available</p>
                    <div className="grid grid-cols-2 gap-2">
                      {getAvailableMobileWallets().map((wallet) => (
                        <button
                          key={wallet.id}
                          onClick={() => handleMobileWallet(wallet.id)}
                          disabled={connecting}
                          className="group relative flex items-center gap-2 overflow-hidden rounded-xl border border-cmblue-500/20 bg-gradient-to-br from-cmblue-500/15 to-cmblue-500/5 px-3 py-2.5 text-xs font-medium text-slate-200 transition-all duration-200 hover:border-cmblue-500/50 hover:from-cmblue-500/25 hover:to-cmblue-500/15 hover:shadow-[0_0_15px_rgba(14,161,255,0.2)] disabled:opacity-50"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-cmblue-400 to-cmblue-600 text-[10px] font-bold text-white shadow-lg group-hover:shadow-xl">
                            {wallet.name.charAt(0)}
                          </span>
                          <span className="truncate">{wallet.name}</span>
                          <span className="absolute right-2 opacity-0 transition-opacity group-hover:opacity-100">→</span>
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500">Tap to open wallet or install</p>
                  </div>
                )}

                {isMounted && isConnected && address && (
                  <div
                    suppressHydrationWarning
                    className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="font-semibold text-emerald-300">Wallet Connected</p>
                    </div>
                    <p className="mb-3 break-words text-xs text-emerald-200/80">{address}</p>
                    <p className="mb-4 text-xs text-emerald-200/60">Network: {walletChain ? walletChain.charAt(0).toUpperCase() + walletChain.slice(1) : 'Unsupported'}</p>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setConnecting(true);
                          setError(null);
                          authenticateConnectedWallet()
                            .catch((err: any) => {
                              console.error(err);
                              setConnectionStatus('Connection Failed');
                              setError(err?.message || 'Failed to authenticate wallet');
                              setConnecting(false);
                            });
                        }}
                        disabled={connecting}
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                      >
                        {connecting ? 'Signing Message...' : 'Sign & Connect'}
                      </button>
                      
                      <button
                        onClick={() => {
                          setConnecting(false);
                          setError(null);
                          setLoginMethod('wallet');
                        }}
                        disabled={connecting}
                        className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        Disconnect
                      </button>
                    </div>
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
              <div className="space-y-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-300">Connect Mobile Wallet</h2>
                    <p className="mt-1 text-xs text-slate-500">Choose from available wallet apps</p>
                  </div>
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
                <div className="space-y-2">
                  {getAvailableMobileWallets().map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => handleMobileWallet(wallet.id)}
                      disabled={connecting}
                      className="group relative flex w-full items-center gap-4 overflow-hidden rounded-xl border border-cmblue-500/20 bg-gradient-to-r from-cmblue-500/10 to-transparent p-4 transition-all duration-200 hover:border-cmblue-500/50 hover:from-cmblue-500/20 hover:shadow-[0_0_20px_rgba(14,161,255,0.15)] disabled:opacity-50"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cmblue-400 to-cmblue-600 text-lg font-bold text-white shadow-lg">
                        {wallet.name.charAt(0)}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-slate-200">{wallet.name}</p>
                        <p className="text-xs capitalize text-slate-500">{wallet.chain} Wallet</p>
                      </div>
                      <FaWallet className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>

                {mobileFallback && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
                    <p className="font-semibold mb-2">Wallet Not Installed</p>
                    <p className="text-xs mb-3">Download the wallet app to continue:</p>
                    <a
                      href={mobileFallback}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500/30 to-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-200 transition hover:from-amber-500/40 hover:to-amber-500/30"
                    >
                      Install from App Store
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