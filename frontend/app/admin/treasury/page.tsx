'use client';

import { useEffect, useState } from 'react';
import { FaWallet, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaSyncAlt } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';

interface TreasuryWallet {
  id: string;
  network: string;
  address: string;
  label: string | null;
  active: boolean;
  supportedCurrency: string;
  balance: any;
  transactions?: any[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminTreasury() {
  const [wallets, setWallets] = useState<TreasuryWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TreasuryWallet | null>(null);
  const [form, setForm] = useState({ network: 'ethereum', address: '', label: '', supportedCurrency: 'USDT', active: true });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const resetForm = () => {
    setForm({ network: 'ethereum', address: '', label: '', supportedCurrency: 'USDT', active: true });
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setShowForm(true);
  };

  const openEdit = (wallet: TreasuryWallet) => {
    setEditing(wallet);
    setForm({
      network: wallet.network,
      address: wallet.address,
      label: wallet.label || '',
      supportedCurrency: wallet.supportedCurrency || 'USDT',
      active: wallet.active,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.address) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = editing
        ? `/api/admin/receiving-wallets/${editing.id}`
        : '/api/admin/receiving-wallets';
      const method = editing ? 'PATCH' : 'POST';

      await apiFetch(endpoint, {
        method,
        body: JSON.stringify({
          network: form.network,
          address: form.address,
          label: form.label,
          supportedCurrency: form.supportedCurrency,
          active: form.active,
        }),
      });

      setSuccess(editing ? 'Wallet updated successfully!' : 'Wallet created successfully!');
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadWallets();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save wallet');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleWallet = async (id: string, active: boolean) => {
    try {
      await apiFetch(`/api/admin/receiving-wallets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !active }),
      });
      loadWallets();
    } catch (err) {
      console.error('Failed to toggle wallet:', err);
    }
  };

  const deleteWallet = async (id: string) => {
    if (!confirm('Are you sure you want to delete this receiving wallet?')) return;
    try {
      await apiFetch(`/api/admin/receiving-wallets/${id}`, {
        method: 'DELETE',
      });
      loadWallets();
    } catch (err) {
      console.error('Failed to delete wallet:', err);
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
          <h1 className="text-2xl font-bold">Receiving Wallets</h1>
          <p className="mt-1 text-sm text-slate-400">Manage treasury receiving wallets per blockchain network</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadWallets}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
          >
            <FaSyncAlt className="h-3 w-3" />
            Refresh
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-cmblue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cmblue-500"
          >
            <FaPlus className="h-3.5 w-3.5" />
            Add Wallet
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">{error}</div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">{success}</div>
      )}

      {showForm && (
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <h2 className="text-sm font-semibold text-cmblue-300">{editing ? 'Edit' : 'Add'} Receiving Wallet</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select
              value={form.network}
              onChange={(e) => setForm({ ...form, network: e.target.value })}
              disabled={!!editing}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cmblue-500/50 disabled:opacity-50"
            >
              <option value="solana">Solana (SOL)</option>
              <option value="ethereum">Ethereum (ETH)</option>
              <option value="bnb">BNB Smart Chain</option>
            </select>
            <select
              value={form.supportedCurrency}
              onChange={(e) => setForm({ ...form, supportedCurrency: e.target.value })}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cmblue-500/50"
            >
              <option value="USDT">USDT</option>
              <option value="USDC">USDC</option>
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
              className="sm:col-span-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cmblue-500/50"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.address || !form.network}
              className="rounded-xl bg-cmblue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cmblue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editing ? 'Update' : 'Create'} Wallet
            </button>
            <button
              onClick={() => { setShowForm(false); setEditing(null); resetForm(); setError(null); setSuccess(null); }}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
            >
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
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(wallet)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:text-blue-400"
                >
                  <FaEdit className="h-3 w-3" />
                </button>
                <button
                  onClick={() => deleteWallet(wallet.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:text-rose-400"
                >
                  <FaTrash className="h-3 w-3" />
                </button>
              </div>
            </div>
            <p className="mt-3 break-all text-[10px] text-slate-500">{wallet.address}</p>
            <p className="mt-1 text-[10px] text-slate-500">Currency: {wallet.supportedCurrency}</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm font-semibold">${Number(wallet.balance || 0).toFixed(2)}</p>
              <button
                onClick={() => toggleWallet(wallet.id, wallet.active)}
                className="flex items-center gap-1 text-[10px] font-medium ${
                  wallet.active ? 'text-emerald-400' : 'text-slate-500'
                }"
              >
                {wallet.active ? <FaToggleOn className="h-4 w-4" /> : <FaToggleOff className="h-4 w-4" />}
                {wallet.active ? 'Active' : 'Disabled'}
              </button>
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

      {wallets.length === 0 && !showForm && (
        <div className="rounded-[24px] border border-dashed border-white/20 p-8 text-center">
          <FaWallet className="mx-auto mb-3 h-6 w-6 text-slate-500" />
          <p className="text-sm text-slate-400">No receiving wallets configured</p>
          <p className="mt-1 text-xs text-slate-500">Add a receiving wallet to start accepting deposits on each chain.</p>
        </div>
      )}
    </div>
  );
}
