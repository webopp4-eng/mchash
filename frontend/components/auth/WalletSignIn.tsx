'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaClipboard, FaExclamationTriangle, FaPaste, FaShieldAlt, FaWallet, FaQrcode, FaSyncAlt } from 'react-icons/fa';
import { API_URL } from '@/lib/auth';
import {
  validateWalletAddress,
  isMobileDevice,
  getAvailableMobileWallets,
  openMobileWallet,
  getWalletInstallUrl,
  connectPhantomWallet,
  signPhantomMessage,
  isPhantomProviderAvailable,
} from '@/lib/wallet';
import { useAccount, useChainId, useSignMessage } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

type LoginMethod = 'wallet' | 'address' | 'qrcode' | 'mobile';
type SupportedChain = 'ethereum' | 'bnb';

interface WalletSignInProps {
  onBack: () => void;
}

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

export default function WalletSignIn({ onBack }: WalletSignInProps) {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('wallet');
  const [connectionStatus, setConnectionStatus] = useState('Detecting Wallet');
  const [mobileFallback, setMobileFallback] = useState<string | null>(null);
  const [phantomAvailable, setPhantomAvailable] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  // Legal acceptance — required server-side when a NEW account is created
  // with this wallet. Existing wallet users can sign in without re-accepting
  // (they are handled by the in-app re-acceptance gate instead).
  const [legalAccepted, setLegalAccepted] = useState(false);

  const { address, connector, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const { openConnectModal } = useConnectModal();

  // Initialize on client
  useEffect(() => {
    setIsMounted(true);
    const phantom = isPhantomProviderAvailable();
    setPhantomAvailable(phantom);
  }, []);

  // Auto-connect when wallet becomes available
  useEffect(() => {
    if (!isMounted || !isConnected || !address) return;
    setWalletAddress(address);
    setConnectionStatus('Wallet Connected');
  }, [isConnected, address, isMounted]);

  const handleWalletConnect = useCallback(async () => {
    if (!isMounted || !address) {
      openConnectModal?.();
      return;
    }

    setConnecting(true);
    setError(null);
    setAuthStatus('Preparing to sign message...');

    try {
      const chain = walletChainFromId(chainId);
      if (!chain) {
        setError('Unsupported network. Please switch to Ethereum or BSC.');
        setConnecting(false);
        return;
      }

      // Get nonce
      setAuthStatus('Requesting authentication challenge...');
      const nonceRes = await fetch(`${API_URL}/api/auth/nonce/${address}?chain=${chain}`, {
        credentials: 'include',
      });

      if (!nonceRes.ok) {
        const retryAfter = nonceRes.headers.get('Retry-After');
        const data = await safeJson(nonceRes);
        setError(getAuthErrorMessage(nonceRes.status, data, retryAfter));
        setConnecting(false);
        return;
      }

      const { nonce, message } = await nonceRes.json();

      // Sign message
      setAuthStatus('Please sign the message in your wallet...');
      const signature = await signMessageAsync({ message });

      // Authenticate
      setAuthStatus('Verifying signature...');
      const authRes = await fetch(`${API_URL}/api/auth/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          address,
          chain,
          signature,
          message,
          walletType: connector?.name || 'unknown',
          legalAccepted,
        }),
      });

      const authData = await authRes.json();

      if (!authRes.ok) {
        setError(getAuthErrorMessage(authRes.status, authData));
        setConnecting(false);
        return;
      }

      setAuthStatus('Authentication successful! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Authentication failed';
      setError(errMsg);
      setConnecting(false);
    }
  }, [isMounted, address, chainId, signMessageAsync, connector, router, openConnectModal, legalAccepted]);

  const handleManualAddress = useCallback(async () => {
    if (!walletAddress.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    setConnecting(true);
    setError(null);
    setAuthStatus('Validating wallet address...');

    try {
      // Validate address format
      let chain: SupportedChain = 'ethereum';
      if (!validateWalletAddress(walletAddress, 'ethereum') && validateWalletAddress(walletAddress, 'bnb')) {
        chain = 'bnb';
      }

      // Get nonce
      setAuthStatus('Requesting authentication challenge...');
      const nonceRes = await fetch(`${API_URL}/api/auth/nonce/${walletAddress}?chain=${chain}`, {
        credentials: 'include',
      });

      if (!nonceRes.ok) {
        const data = await safeJson(nonceRes);
        setError(getAuthErrorMessage(nonceRes.status, data));
        setConnecting(false);
        return;
      }

      const { message } = await nonceRes.json();
      setError('Manual address entry requires wallet connection. Please use a connected wallet or QR code.');
      setConnecting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to authenticate');
      setConnecting(false);
    }
  }, [walletAddress]);

  if (!isMounted) {
    return <div className="min-h-96" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={onBack}
          className="text-slate-600 hover:text-slate-900 text-sm flex items-center gap-2 mb-4"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Connect Wallet</h2>
        <p className="text-slate-600 text-sm mt-1">Sign in with your crypto wallet</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex gap-2">
          <FaExclamationTriangle className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {authStatus && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm flex gap-2">
          <FaSyncAlt className="flex-shrink-0 mt-0.5 animate-spin" />
          <span>{authStatus}</span>
        </div>
      )}

      {/* Legal acceptance — required when a NEW account is created */}
      <div>
        <label
          className={`flex items-start gap-3 rounded-lg border p-3 text-sm cursor-pointer transition ${
            legalAccepted
              ? 'border-cmblue-200 bg-cmblue-50/60'
              : 'border-slate-300 bg-white'
          }`}
        >
          <input
            type="checkbox"
            checked={legalAccepted}
            onChange={(e) => setLegalAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-cmblue-600"
            disabled={connecting}
          />
          <span className="text-slate-700">
            I confirm that I have read and agree to the{' '}
            <Link href="/terms" target="_blank" className="font-semibold text-cmblue-600 hover:underline">
              Terms &amp; Conditions
            </Link>
            ,{' '}
            <Link href="/privacy-policy" target="_blank" className="font-semibold text-cmblue-600 hover:underline">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/risk-disclosure" target="_blank" className="font-semibold text-cmblue-600 hover:underline">
              Risk Disclosure
            </Link>{' '}
            of MCHash.site.
            <span className="mt-1 block text-xs text-slate-500">
              Required when creating a new account with this wallet.
            </span>
          </span>
        </label>
      </div>

      {/* Login Method Selection */}
      <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
        {(['wallet', 'address', 'qrcode'] as LoginMethod[]).map((method) => (
          <button
            key={method}
            onClick={() => {
              setLoginMethod(method);
              setError(null);
              setAuthStatus(null);
            }}
            disabled={connecting}
            className={`flex-1 py-2 px-3 rounded transition text-sm font-medium ${
              loginMethod === method
                ? 'bg-cmblue-600 text-white'
                : 'bg-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            {method === 'wallet' && <FaWallet className="inline mr-1" />}
            {method === 'address' && '📝'}
            {method === 'qrcode' && <FaQrcode className="inline mr-1" />}
            {method.charAt(0).toUpperCase() + method.slice(1)}
          </button>
        ))}
      </div>

      {/* Wallet Connection Method */}
      {loginMethod === 'wallet' && (
        <div className="space-y-4">
          {isConnected && address ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-emerald-700 text-sm mb-3 font-semibold">✓ Wallet Connected</p>
              <p className="text-slate-900 text-sm font-mono break-all mb-4">{address}</p>
              <button
                onClick={handleWalletConnect}
                disabled={connecting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-2 px-4 rounded-lg transition shadow-sm"
              >
                {connecting ? 'Signing...' : 'Sign & Connect'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleWalletConnect}
              disabled={connecting}
              className="w-full bg-cmblue-600 hover:bg-cmblue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
            >
              <FaWallet />
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      )}

      {/* Manual Address Entry */}
      {loginMethod === 'address' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Wallet Address</label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x... or 4A..."
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cmblue-500"
              disabled={connecting}
            />
          </div>
          <button
            onClick={handleManualAddress}
            disabled={connecting || !walletAddress.trim()}
            className="w-full bg-cmblue-600 hover:bg-cmblue-700 disabled:bg-slate-300 text-white font-semibold py-2 px-4 rounded-lg transition shadow-sm"
          >
            {connecting ? 'Processing...' : 'Continue'}
          </button>
        </div>
      )}

      {/* QR Code */}
      {loginMethod === 'qrcode' && (
        <div className="text-center text-slate-600 py-8">
          <FaQrcode className="text-4xl mx-auto mb-4" />
          <p className="text-sm">QR code login coming soon</p>
        </div>
      )}
    </div>
  );
}
