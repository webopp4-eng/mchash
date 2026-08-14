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
    <div className="mc-page">
      <div className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Wallet</p>
          <h1 className="mc-title">Receiving Wallets</h1>
          <p className="mc-subtitle">Manage treasury receiving wallets per blockchain network.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadWallets}
            className="mc-button-secondary"
          >
            <FaSyncAlt className="h-3 w-3" />
            Refresh
          </button>
          <button
            onClick={openCreate}
            className="mc-button"
          >
            <FaPlus className="h-3.5 w-3.5" />
            Add Wallet
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm font-semibold text-rose-600">{error}</div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-600">{success}</div>
      )}

      <div className="mc-glass-blue">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-white/75">Wallet Total Balance</p>
            <p className="mt-3 text-4xl font-extrabold">${wallets.reduce((sum, wallet) => sum + Number(wallet.balance || 0), 0).toFixed(2)}</p>
            <p className="mt-2 text-sm text-white/80">{wallets.length} configured receiving wallets across supported chains.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['Deposit', 'Withdraw', 'Transfer'].map((action) => (
              <button
                key={action}
                onClick={action === 'Deposit' ? openCreate : undefined}
                className="rounded-xl bg-white/18 px-3 py-2 text-xs font-bold text-white ring-1 ring-white/25 hover:bg-white/25"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="mc-card">
          <h2 className="text-base font-bold text-slate-950">{editing ? 'Edit' : 'Add'} Receiving Wallet</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select
              value={form.network}
              onChange={(e) => setForm({ ...form, network: e.target.value })}
              disabled={!!editing}
              className="mc-input disabled:opacity-50"
            >
              <option value="solana">Solana (SOL)</option>
              <option value="ethereum">Ethereum (ETH)</option>
              <option value="bnb">BNB Smart Chain</option>
            </select>
            <select
              value={form.supportedCurrency}
              onChange={(e) => setForm({ ...form, supportedCurrency: e.target.value })}
              className="mc-input"
            >
              <option value="USDT">USDT</option>
              <option value="USDC">USDC</option>
            </select>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Wallet Address"
              className="mc-input sm:col-span-2"
            />
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Label (optional)"
              className="mc-input sm:col-span-2"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.address || !form.network}
              className="mc-button"
            >
              {submitting ? 'Saving...' : editing ? 'Update' : 'Create'} Wallet
            </button>
            <button
              onClick={() => { setShowForm(false); setEditing(null); resetForm(); setError(null); setSuccess(null); }}
              className="mc-button-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Treasury Wallets Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {wallets.map((wallet) => (
          <div key={wallet.id} className="mc-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
                  <FaWallet className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold capitalize text-slate-950">{wallet.network} Treasury</p>
                  {wallet.label && <p className="text-[10px] text-slate-500">{wallet.label}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(wallet)}
                  className="mc-icon-button h-8 w-8"
                >
                  <FaEdit className="h-3 w-3" />
                </button>
                <button
                  onClick={() => deleteWallet(wallet.id)}
                  className="mc-icon-button h-8 w-8 hover:text-rose-600"
                >
                  <FaTrash className="h-3 w-3" />
                </button>
              </div>
            </div>
            <p className="mt-3 break-all text-[10px] text-slate-500">{wallet.address}</p>
            <p className="mt-1 text-[10px] font-semibold text-slate-500">Currency: {wallet.supportedCurrency}</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-lg font-extrabold text-slate-950">${Number(wallet.balance || 0).toFixed(2)}</p>
              <button
                onClick={() => toggleWallet(wallet.id, wallet.active)}
                className="flex items-center gap-1 text-[10px] font-medium ${
                  wallet.active ? 'text-emerald-600' : 'text-slate-500'
                }"
              >
                {wallet.active ? <FaToggleOn className="h-4 w-4" /> : <FaToggleOff className="h-4 w-4" />}
                {wallet.active ? 'Active' : 'Disabled'}
              </button>
            </div>
            {wallet.transactions && wallet.transactions.length > 0 && (
              <div className="mt-3 border-t border-sky-100 pt-3">
                <p className="text-[10px] text-slate-500">Recent Activity</p>
                {wallet.transactions.slice(0, 3).map((tx: any) => (
                  <p key={tx.id} className="mt-1 text-[10px] text-slate-500">
                    {tx.type} • {Number(tx.amount).toFixed(2)} {tx.currency}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {wallets.length === 0 && !showForm && (
        <div className="mc-card border-dashed text-center">
          <FaWallet className="mx-auto mb-3 h-6 w-6 text-slate-500" />
          <p className="text-sm text-slate-500">No receiving wallets configured</p>
          <p className="mt-1 text-xs text-slate-500">Add a receiving wallet to start accepting deposits on each chain.</p>
        </div>
      )}
    </div>
  );
}
