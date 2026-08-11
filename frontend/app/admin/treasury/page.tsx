'use client';

import { useEffect, useState } from 'react';
import { FaWallet, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';

export default function AdminTreasury() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ network: 'ethereum', address: '', label: '' });

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const res = await apiFetch('/api/admin/treasury');
      setWallets(res.wallets || []);
    } catch (err) {
      console.error('Failed to load treasury:', err);
    } finally {
      setLoading(false);
    }
  };

  const addWallet = async () => {
    try {
      await apiFetch('/api/admin/treasury', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm({ network: 'ethereum', address: '', label: '' });
      loadWallets();
    } catch (err) {
      console.error('Failed to add wallet:', err);
    }
  };

  const toggleWallet = async (id: string, active: boolean) => {
    try {
      await apiFetch(`/api/admin/treasury/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !active }),
      });
      loadWallets();
    } catch (err) {
      console.error('Failed to toggle wallet:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Treasury Wallets</h1>
          <p className="mt-1 text-sm text-slate-400">Manage network receiving wallets</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-cmblue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cmblue-500"
        >
          <FaPlus className="h-3.5 w-3.5" />
          Add Wallet
        </button>
      </div>

      {showForm && (
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <h2 className="text-sm font-semibold text-cmblue-300">Add Treasury Wallet</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <select
              value={form.network}
              onChange={(e) => setForm({ ...form, network: e.target.value })}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cmblue-500/50"
            >
              <option value="solana">Solana</option>
              <option value="ethereum">Ethereum</option>
              <option value="bnb">BNB Smart Chain</option>
            </select>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Wallet Address"
              className="sm:col-span-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cmblue-500/50"
            />
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Label (optional)"
              className="sm:col-span-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cmblue-500/50"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={addWallet} className="rounded-xl bg-cmblue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cmblue-500">
              Save Wallet
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Treasury Wallets Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {wallets.map((wallet) => (
          <div key={wallet.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cmblue-500/20 text-cmblue-400">
                  <FaWallet className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold capitalize">{wallet.network} Treasury</p>
                  {wallet.label && <p className="text-[10px] text-slate-500">{wallet.label}</p>}
                </div>
              </div>
              <button
                onClick={() => toggleWallet(wallet.id, wallet.active)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  wallet.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                }`}
              >
                {wallet.active ? <FaToggleOn className="h-4 w-4" /> : <FaToggleOff className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-3 break-all text-[10px] text-slate-500">{wallet.address}</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm font-semibold">${Number(wallet.balance || 0).toFixed(2)}</p>
              <span className={`text-[10px] font-medium ${wallet.active ? 'text-emerald-400' : 'text-slate-500'}`}>
                {wallet.active ? 'Active' : 'Disabled'}
              </span>
            </div>
            {wallet.transactions && wallet.transactions.length > 0 && (
              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="text-[10px] text-slate-500">Recent Activity</p>
                {wallet.transactions.slice(0, 3).map((tx: any) => (
                  <p key={tx.id} className="mt-1 text-[10px] text-slate-400">
                    {tx.type} • {Number(tx.amount).toFixed(2)} {tx.currency}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}