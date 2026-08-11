'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaClipboard, FaExclamationTriangle, FaPaste, FaShieldAlt, FaWallet } from 'react-icons/fa';
import Logo from './Logo';
import { API_URL } from '@/lib/auth';
import { validateWalletAddress } from '@/lib/wallet';
import { useAccount, useChainId, useSignMessage } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

type LoginMethod = 'wallet' | 'address';

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
  const [agreed, setAgreed] = useState({ terms: false, privacy: false, risk: false });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('wallet');
  const [connectionStatus, setConnectionStatus] = useState('Detecting Wallet');

  const { address, connector, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const { openConnectModal } = useConnectModal();

  const allAgreed = agreed.terms && agreed.privacy && agreed.risk;
  const walletChain = useMemo(() => walletChainFromId(chainId), [chainId]);
  const walletType = connector?.name || 'Wallet';

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
            {loginMethod === 'wallet' ? (
              <div className="space-y-4">
                <button
                  onClick={handleConnectClick}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cmblue-600 to-cmblue-500 px-6 py-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(14,161,255,0.3)] transition-all hover:scale-[1.02]"
                  disabled={connecting}
                >
                  <FaWallet className="h-5 w-5" />
                  {isConnected ? 'Sign In with Wallet' : 'Connect Wallet'}
                </button>

                {isConnected && address && (
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-200">
                    <p className="font-semibold">Connected Wallet</p>
                    <p className="mt-1 break-words text-xs text-slate-400">{address}</p>
                    <p className="mt-2 text-xs text-slate-500">Network: {walletChain ?? chain?.name ?? 'Unsupported'}</p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setLoginMethod('address');
                    setError(null);
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-white/10"
                  disabled={connecting}
                >
                  <FaClipboard className="h-5 w-5" />
                  Paste Wallet Address
                </button>
              </div>
            ) : (
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
