'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/auth';
import { FaWallet, FaUnlink, FaPlus } from 'react-icons/fa';

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

  // Fetch connected wallets on mount
  useEffect(() => {
    fetchWallets();
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
          onClick={() => setShowConnectModal(true)}
          className={`w-full ${buttonClass} ${buttonTextClass} font-semibold py-2 px-3 rounded-xl transition text-sm flex items-center justify-center gap-2`}
        >
          <FaPlus className="w-3 h-3" />
          {wallets.length === 0 ? 'Connect Wallet' : 'Add Wallet'}
        </button>
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
            onClick={() => setShowConnectModal(true)}
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
            onClick={() => setShowConnectModal(true)}
            className="w-full bg-cmblue-600 hover:bg-cmblue-700 text-white font-semibold py-2 px-4 rounded-xl transition flex items-center justify-center gap-2"
          >
            <FaPlus className="w-4 h-4" />
            Add Another Wallet
          </button>
        </div>
      )}

      {/* Connect Modal - TODO: implement full wallet connection flow */}
      {showConnectModal && (
        <div className={`${cardBgClass} rounded-2xl p-6 border ${borderClass}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold ${textClass}`}>Connect Wallet</h3>
            <button
              onClick={() => setShowConnectModal(false)}
              className={`${secondaryTextClass} hover:${textClass}`}
            >
              ✕
            </button>
          </div>
          <p className={`${secondaryTextClass} text-sm`}>
            Wallet connection feature coming soon. This allows you to link your crypto wallet to your account.
          </p>
          <button
            onClick={() => setShowConnectModal(false)}
            className={`mt-4 ${darkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-slate-200 hover:bg-slate-300'} ${darkMode ? 'text-white' : 'text-slate-900'} py-2 px-4 rounded-xl transition`}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}