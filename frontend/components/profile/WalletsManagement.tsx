'use client';

import { useEffect, useState } from 'react';
import { FaWallet, FaTrash, FaPlus, FaCheckCircle, FaExclamationTriangle, FaLink } from 'react-icons/fa';
import { API_URL } from '@/lib/auth';

interface Wallet {
  id: string;
  address: string;
  chain: string;
  isPrimary: boolean;
  balance?: string;
  verifiedAt?: string;
  createdAt: string;
}

export default function WalletsManagement() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/wallets`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please log in to view your wallets');
        } else {
          setError('Failed to load wallets');
        }
        return;
      }

      const data = await response.json();
      setWallets(data.wallets || []);
    } catch (err) {
      setError('An error occurred while loading wallets');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (walletId: string) => {
    if (!confirm('Are you sure you want to disconnect this wallet?')) return;

    try {
      setDeletingId(walletId);
      const response = await fetch(`${API_URL}/auth/wallet/${walletId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to disconnect wallet');
        return;
      }

      setWallets((prev) => prev.filter((w) => w.id !== walletId));
      setError(null);
    } catch (err) {
      setError('Failed to disconnect wallet');
      console.error('Error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const getChainLabel = (chain: string) => {
    const labels: Record<string, string> = {
      ethereum: 'Ethereum',
      bnb: 'BNB Smart Chain',
      solana: 'Solana',
    };
    return labels[chain] || chain;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-slate-700 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FaWallet /> Wallets
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage your connected wallets</p>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
        >
          <FaPlus /> Connect Wallet
        </button>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm flex gap-2">
          <FaExclamationTriangle className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {wallets.length === 0 ? (
        <div className="bg-slate-700 rounded-lg p-8 text-center border border-slate-600">
          <FaWallet className="text-4xl text-slate-500 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No wallets connected</h3>
          <p className="text-slate-400 text-sm mb-4">Connect a wallet to make blockchain payments and access wallet-based features.</p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Connect Your First Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className="bg-slate-700 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <FaCheckCircle className="text-green-400" />
                    <h3 className="text-white font-semibold">{getChainLabel(wallet.chain)}</h3>
                    {wallet.isPrimary && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Primary</span>
                    )}
                  </div>
                  <p className="text-slate-300 font-mono text-sm mb-2" title={wallet.address}>
                    {formatAddress(wallet.address)}
                  </p>
                  <p className="text-slate-500 text-xs">
                    Connected on {new Date(wallet.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDisconnect(wallet.id)}
                  disabled={deletingId === wallet.id}
                  className="bg-red-900 hover:bg-red-800 disabled:bg-slate-600 text-red-100 hover:text-red-50 p-2 rounded-lg transition"
                  title="Disconnect wallet"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => setShowConnectModal(true)}
            className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <FaPlus /> Connect Another Wallet
          </button>
        </div>
      )}

      {/* Connect Wallet Modal */}
      {showConnectModal && (
        <ConnectWalletModal
          onClose={() => setShowConnectModal(false)}
          onSuccess={() => {
            setShowConnectModal(false);
            fetchWallets();
          }}
        />
      )}
    </div>
  );
}

function ConnectWalletModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-md w-full border border-slate-700 p-6">
        <h3 className="text-xl font-bold text-white mb-4">Connect Wallet</h3>
        <p className="text-slate-400 text-sm mb-6">
          Wallet connection UI coming soon. For now, please use the wallet connection flow from your device.
        </p>
        <button
          onClick={onClose}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
