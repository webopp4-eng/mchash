'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/auth';
import { FaWallet, FaUnlink, FaPlus, FaSpinner } from 'react-icons/fa';
import {
  connectSolanaWallet,
  connectEvmWallet,
  signSolanaMessage,
  signEvmMessage,
  detectWalletProvider,
  isWalletProviderAvailable,
  getAvailableMobileWallets,
  openMobileWallet,
  detectMobilePlatform,
  detectWalletBrowser,
  WalletInfo,
} from '@/lib/wallet';

interface Wallet {
  id: string;
  address: string;
  chain: string;
  isPrimary: boolean;
  verifiedAt?: string;
}

interface WalletConnectionPanelProps {
  compact?: boolean;
  showTitle?: boolean;
  darkMode?: boolean;
}

export default function WalletConnectionPanel({ compact = false, showTitle = true, darkMode = false }: WalletConnectionPanelProps) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedChain, setSelectedChain] = useState<'solana' | 'ethereum' | 'bnb'>('ethereum');
  const [availableWallets, setAvailableWallets] = useState<any[]>([]);
  const [mobileWallets, setMobileWallets] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Fetch connected wallets on mount
  useEffect(() => {
    fetchWallets();
    const platform = detectMobilePlatform();
    setIsMobile(platform.isMobile);
    setMobileWallets(getAvailableMobileWallets());
  }, []);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/auth/wallets`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setWallets(Array.isArray(data.wallets) ? data.wallets : []);
      }
    } catch (err) {
      console.error('Error fetching wallets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (walletId: string) => {
    if (!confirm('Are you sure you want to disconnect this wallet?')) return;

    try {
      const response = await fetch(`${API_URL}/api/auth/wallet/${walletId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setWallets(wallets.filter(w => w.id !== walletId));
      } else {
        setError('Failed to disconnect wallet');
      }
    } catch (err) {
      setError('Error disconnecting wallet');
      console.error(err);
    }
  };

  const getNonceAndMessage = async (address: string, chain: string) => {
    const response = await fetch(`${API_URL}/api/auth/nonce/${address}?chain=${chain}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to get nonce');
    }
    return response.json();
  };

  const connectWallet = async (chain: 'solana' | 'ethereum' | 'bnb', walletId?: string) => {
    setConnecting(true);
    setError(null);
    try {
      // Connect to wallet provider
      let walletInfo: WalletInfo;
      if (chain === 'solana') {
        walletInfo = await connectSolanaWallet(walletId);
      } else {
        walletInfo = await connectEvmWallet(chain, walletId);
      }

      // Get nonce and message from backend
      const { nonce, message } = await getNonceAndMessage(walletInfo.address, chain);

      // Sign the message
      let signature: string;
      if (chain === 'solana') {
        signature = await signSolanaMessage(message, walletId);
      } else {
        signature = await signEvmMessage(message, walletId);
      }

      // Send to backend to connect wallet to account
      const response = await fetch(`${API_URL}/api/auth/wallet/connect`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletInfo.address,
          chain,
          signature,
          message,
          walletType: walletInfo.walletType,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect wallet');
      }

      // Refresh wallets list
      await fetchWallets();
      setShowConnectModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Wallet connect error:', err);
    } finally {
      setConnecting(false);
    }
  };

  const handleMobileWallet = (walletId: string) => {
    const result = openMobileWallet(walletId, '/login?autoconnect=1');
    if (!result.started) {
      setError('Unable to open wallet app. Please install it first.');
    }
  };

  const detectAvailable = () => {
    const detected = detectWalletBrowser();
    const solana = detectWalletProvider('solana');
    const evm = detectWalletProvider('ethereum');
    const list: any[] = [];

    if (detected) {
      list.push({ id: detected.walletId, name: detected.name, chain: detected.chain, installed: true });
    }
    if (solana.available) {
      list.push({ id: 'phantom', name: 'Phantom', chain: 'solana', installed: true });
      list.push({ id: 'solflare', name: 'Solflare', chain: 'solana', installed: isWalletProviderAvailable('solflare') });
      list.push({ id: 'backpack', name: 'Backpack', chain: 'solana', installed: isWalletProviderAvailable('backpack') });
    }
    if (evm.available) {
      list.push({ id: 'metamask', name: 'MetaMask', chain: 'ethereum', installed: isWalletProviderAvailable('metamask') });
      list.push({ id: 'trust', name: 'Trust Wallet', chain: 'ethereum', installed: isWalletProviderAvailable('trust') });
      list.push({ id: 'binance-wallet', name: 'Binance Wallet', chain: 'bnb', installed: isWalletProviderAvailable('binance-wallet') });
    }
    setAvailableWallets(list);
  };

  const openConnectModal = () => {
    setShowConnectModal(true);
    setError(null);
    detectAvailable();
  };

  if (compact) {
    // Compact view for dashboard
    const bgClass = darkMode ? 'bg-slate-700' : 'bg-slate-50';
    const borderClass = darkMode ? 'border-slate-600' : 'border-slate-200';
    const textClass = darkMode ? 'text-white' : 'text-slate-900';
    const secondaryTextClass = darkMode ? 'text-slate-400' : 'text-slate-500';
    const buttonClass = darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-cmblue-600 hover:bg-cmblue-700';
    const buttonTextClass = 'text-white';

    return (
      <div className={`${bgClass} rounded-2xl p-4 border ${borderClass}`}>
        <div className="flex items-center gap-2 mb-3">
          <FaWallet className="text-cmblue-600" />
          <h3 className={`font-semibold ${textClass}`}>Wallet</h3>
        </div>

        {wallets.length === 0 ? (
          <div className={`text-sm ${secondaryTextClass} mb-3`}>
            No wallet connected
          </div>
        ) : (
          <div className="space-y-2 mb-3">
            {wallets.map(wallet => (
              <div key={wallet.id} className={`text-xs ${secondaryTextClass}`}>
                <div className="font-mono">
                  {wallet.address.length > 18 ? `${wallet.address.slice(0, 10)}...${wallet.address.slice(-8)}` : wallet.address}
                </div>
                <div className="text-slate-500">{wallet.chain}</div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={openConnectModal}
          className={`w-full ${buttonClass} ${buttonTextClass} font-semibold py-2 px-3 rounded-xl transition text-sm flex items-center justify-center gap-2`}
        >
          <FaPlus className="w-3 h-3" />
          {wallets.length === 0 ? 'Connect Wallet' : 'Add Wallet'}
        </button>

        {showConnectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase text-cmblue-600">Connect Wallet</p>
                  <h2 className="text-xl font-extrabold text-slate-950">Select a wallet</h2>
                </div>
                <button onClick={() => setShowConnectModal(false)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">Close</button>
              </div>

              {error && <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}

              <div className="mb-4">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Network</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[
                    { value: 'ethereum', label: 'Ethereum' },
                    { value: 'bnb', label: 'BNB Chain' },
                    { value: 'solana', label: 'Solana' },
                  ].map((chain) => (
                    <button
                      key={chain.value}
                      onClick={() => setSelectedChain(chain.value as any)}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold ${selectedChain === chain.value ? 'border-cmblue-500 bg-cmblue-50 text-cmblue-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                    >
                      {chain.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {isMobile ? (
                  <>
                    <p className="text-xs font-semibold text-slate-500">Mobile wallets</p>
                    {mobileWallets.slice(0, 5).map((wallet) => (
                      <button
                        key={wallet.id}
                        onClick={() => handleMobileWallet(wallet.id)}
                        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-left hover:border-cmblue-300"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-950">{wallet.name}</p>
                          <p className="text-[10px] text-slate-500">{wallet.description}</p>
                        </div>
                        {wallet.installed && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">Installed</span>}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-slate-500">Browser wallets</p>
                    {availableWallets.length > 0 ? (
                      availableWallets.map((wallet) => (
                        <button
                          key={wallet.id}
                          onClick={() => connectWallet(wallet.chain, wallet.id)}
                          disabled={connecting}
                          className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-left hover:border-cmblue-300 disabled:opacity-50"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-950">{wallet.name}</p>
                            <p className="text-[10px] capitalize text-slate-500">{wallet.chain}</p>
                          </div>
                          {wallet.installed && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">Installed</span>}
                        </button>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
                        No wallet extensions detected. Install MetaMask, Phantom, or Trust Wallet to connect.
                      </p>
                    )}
                  </>
                )}
              </div>

              {connecting && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-cmblue-600">
                  <FaSpinner className="h-4 w-4 animate-spin" />
                  Connecting wallet...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full view for profile/settings
  const textClass = darkMode ? 'text-white' : 'text-slate-900';
  const secondaryTextClass = darkMode ? 'text-slate-400' : 'text-slate-500';
  const bgClass = darkMode ? 'bg-slate-700' : 'bg-slate-50';
  const borderClass = darkMode ? 'border-slate-600' : 'border-slate-200';
  const cardBgClass = darkMode ? 'bg-slate-700' : 'bg-slate-50';

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center gap-2">
          <FaWallet className="text-cmblue-600" />
          <h2 className={`text-xl font-bold ${textClass}`}>Connected Wallets</h2>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading && wallets.length === 0 ? (
        <div className={secondaryTextClass}>Loading wallets...</div>
      ) : wallets.length === 0 ? (
        <div className={`${cardBgClass} rounded-2xl p-6 border ${borderClass} text-center`}>
          <FaWallet className={`w-12 h-12 mx-auto ${secondaryTextClass} mb-3`} />
          <p className={`${secondaryTextClass} mb-4`}>No wallet connected yet</p>
          <button
            onClick={openConnectModal}
            className="bg-cmblue-600 hover:bg-cmblue-700 text-white font-semibold py-2 px-6 rounded-xl transition inline-flex items-center gap-2"
          >
            <FaPlus className="w-4 h-4" />
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {wallets.map(wallet => (
            <div key={wallet.id} className={`${cardBgClass} rounded-2xl p-4 border ${borderClass} flex items-center justify-between`}>
              <div>
                <p className={`${textClass} font-mono`}>{wallet.address}</p>
                <p className={`text-sm ${secondaryTextClass} capitalize`}>{wallet.chain}</p>
              </div>
              <button
                onClick={() => handleDisconnect(wallet.id)}
                className="bg-rose-500 hover:bg-rose-600 text-white py-2 px-4 rounded-xl transition text-sm flex items-center gap-2"
              >
                <FaUnlink className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          ))}
          <button
            onClick={openConnectModal}
            className="w-full bg-cmblue-600 hover:bg-cmblue-700 text-white font-semibold py-2 px-4 rounded-xl transition flex items-center justify-center gap-2"
          >
            <FaPlus className="w-4 h-4" />
            Add Another Wallet
          </button>
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase text-cmblue-600">Connect Wallet</p>
                <h2 className="text-xl font-extrabold text-slate-950">Select a wallet</h2>
              </div>
              <button onClick={() => setShowConnectModal(false)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">Close</button>
            </div>

            {error && <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}

            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Network</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { value: 'ethereum', label: 'Ethereum' },
                  { value: 'bnb', label: 'BNB Chain' },
                  { value: 'solana', label: 'Solana' },
                ].map((chain) => (
                  <button
                    key={chain.value}
                    onClick={() => setSelectedChain(chain.value as any)}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold ${selectedChain === chain.value ? 'border-cmblue-500 bg-cmblue-50 text-cmblue-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                  >
                    {chain.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {isMobile ? (
                <>
                  <p className="text-xs font-semibold text-slate-500">Mobile wallets</p>
                  {mobileWallets.slice(0, 5).map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => handleMobileWallet(wallet.id)}
                      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-left hover:border-cmblue-300"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-950">{wallet.name}</p>
                        <p className="text-[10px] text-slate-500">{wallet.description}</p>
                      </div>
                      {wallet.installed && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">Installed</span>}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-slate-500">Browser wallets</p>
                  {availableWallets.length > 0 ? (
                    availableWallets.map((wallet) => (
                      <button
                        key={wallet.id}
                        onClick={() => connectWallet(wallet.chain, wallet.id)}
                        disabled={connecting}
                        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-left hover:border-cmblue-300 disabled:opacity-50"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-950">{wallet.name}</p>
                          <p className="text-[10px] capitalize text-slate-500">{wallet.chain}</p>
                        </div>
                        {wallet.installed && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">Installed</span>}
                      </button>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
                      No wallet extensions detected. Install MetaMask, Phantom, or Trust Wallet to connect.
                    </p>
                  )}
                </>
              )}
            </div>

            {connecting && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-cmblue-600">
                <FaSpinner className="h-4 w-4 animate-spin" />
                Connecting wallet...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}