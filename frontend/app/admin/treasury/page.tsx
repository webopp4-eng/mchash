'use client';

import { useEffect, useState } from 'react';
import { FaWallet, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaSyncAlt } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';

interface PaymentAccount {
  id: string;
  type: string;
  name: string;
  label: string | null;
  bankName?: string | null;
  accountHolder?: string | null;
  accountNumber?: string | null;
  walletAddress?: string | null;
  network?: string | null;
  currency: string;
  active: boolean;
  isDefault?: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTreasury() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PaymentAccount | null>(null);
  const [form, setForm] = useState({
    type: 'bank',
    name: '',
    label: '',
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    walletAddress: '',
    network: 'ethereum',
    currency: 'USDT',
    active: true,
    isDefault: false,
    sortOrder: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await apiFetch('/api/admin/payment-accounts');
      setAccounts(res.paymentAccounts || []);
    } catch (err) {
      console.error('Failed to load payment accounts:', err);
      try {
        const fallback = await apiFetch('/api/admin/treasury');
        setAccounts((fallback.wallets || []).map((item: any) => ({
          id: item.id,
          type: item.network || 'wallet',
          name: item.label || item.network,
          label: item.label,
          walletAddress: item.address,
          network: item.network,
          currency: item.supportedCurrency || 'USDT',
          active: item.active,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })));
      } catch {
        setAccounts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      type: 'bank',
      name: '',
      label: '',
      bankName: '',
      accountHolder: '',
      accountNumber: '',
      walletAddress: '',
      network: 'ethereum',
      currency: 'USDT',
      active: true,
      isDefault: false,
      sortOrder: 0,
    });
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setShowForm(true);
  };

  const openEdit = (account: PaymentAccount) => {
    setEditing(account);
    setForm({
      type: account.type,
      name: account.name,
      label: account.label || '',
      bankName: account.bankName || '',
      accountHolder: account.accountHolder || '',
      accountNumber: account.accountNumber || '',
      walletAddress: account.walletAddress || '',
      network: account.network || 'ethereum',
      currency: account.currency || 'USDT',
      active: account.active,
      isDefault: Boolean(account.isDefault),
      sortOrder: account.sortOrder || 0,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      setError('Account name is required');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = editing ? `/api/admin/payment-accounts/${editing.id}` : '/api/admin/payment-accounts';
      const method = editing ? 'PATCH' : 'POST';

      await apiFetch(endpoint, {
        method,
        body: JSON.stringify({
          type: form.type,
          name: form.name,
          label: form.label,
          bankName: form.bankName,
          accountHolder: form.accountHolder,
          accountNumber: form.accountNumber,
          walletAddress: form.walletAddress,
          network: form.network,
          currency: form.currency,
          active: form.active,
          isDefault: form.isDefault,
          sortOrder: form.sortOrder,
        }),
      });

      setSuccess(editing ? 'Account updated successfully!' : 'Account created successfully!');
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadAccounts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save account');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAccount = async (id: string, active: boolean) => {
    try {
      await apiFetch(`/api/admin/payment-accounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !active }),
      });
      loadAccounts();
    } catch (err) {
      console.error('Failed to toggle account:', err);
    }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm('Delete this payment account?')) return;
    try {
      await apiFetch(`/api/admin/payment-accounts/${id}`, {
        method: 'DELETE',
      });
      loadAccounts();
    } catch (err) {
      console.error('Failed to delete account:', err);
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
          <h1 className="mc-title">Payment Accounts</h1>
          <p className="mc-subtitle">Manage deposit receiving accounts for bank, crypto, and wallet transfers.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={loadAccounts} className="mc-button-secondary">
            <FaSyncAlt className="h-3 w-3" />
            Refresh
          </button>
          <button onClick={openCreate} className="mc-button">
            <FaPlus className="h-3.5 w-3.5" />
            Add Account
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm font-semibold text-rose-600">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-600">{success}</div>}

      {showForm && (
        <div className="mc-card">
          <h2 className="text-base font-bold text-slate-950">{editing ? 'Edit' : 'Add'} Payment Account</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mc-input">
              <option value="bank">Bank Transfer</option>
              <option value="crypto">Crypto Wallet</option>
              <option value="card">Card</option>
            </select>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Account Name" className="mc-input" />
            <input type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Display Label" className="mc-input sm:col-span-2" />
            <input type="text" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="Bank Name (optional)" className="mc-input" />
            <input type="text" value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })} placeholder="Account Holder" className="mc-input" />
            <input type="text" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="Account / Wallet Number" className="mc-input sm:col-span-2" />
            <input type="text" value={form.walletAddress} onChange={(e) => setForm({ ...form, walletAddress: e.target.value })} placeholder="Wallet Address (for crypto)" className="mc-input sm:col-span-2" />
            <select value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })} className="mc-input">
              <option value="ethereum">Ethereum</option>
              <option value="bnb">BNB Smart Chain</option>
              <option value="solana">Solana</option>
              <option value="bank">Bank</option>
            </select>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="mc-input">
              <option value="USDT">USDT</option>
              <option value="USDC">USDC</option>
              <option value="USD">USD</option>
            </select>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
              Default account
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleSubmit} disabled={submitting || !form.name} className="mc-button">
              {submitting ? 'Saving...' : editing ? 'Update' : 'Create'} Account
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); resetForm(); setError(null); setSuccess(null); }} className="mc-button-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {accounts.map((account) => (
          <div key={account.id} className="mc-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
                  <FaWallet className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-950">{account.name}</p>
                  {account.label && <p className="text-[10px] text-slate-500">{account.label}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(account)} className="mc-icon-button h-8 w-8"><FaEdit className="h-3 w-3" /></button>
                <button onClick={() => deleteAccount(account.id)} className="mc-icon-button h-8 w-8 hover:text-rose-600"><FaTrash className="h-3 w-3" /></button>
              </div>
            </div>
            <p className="mt-3 text-[10px] font-semibold uppercase text-slate-500">{account.type} • {account.currency}</p>
            {account.bankName && <p className="mt-1 text-[10px] text-slate-500">Bank: {account.bankName}</p>}
            {account.accountHolder && <p className="mt-1 text-[10px] text-slate-500">Holder: {account.accountHolder}</p>}
            {(account.accountNumber || account.walletAddress) && (
              <p className="mt-1 break-all text-[10px] text-slate-500">{account.accountNumber || account.walletAddress}</p>
            )}
            <div className="mt-3 flex items-center justify-between">
              <p className="text-lg font-extrabold text-slate-950">{account.isDefault ? 'Default' : 'Standard'}</p>
              <button onClick={() => toggleAccount(account.id, account.active)} className={`flex items-center gap-1 text-[10px] font-medium ${account.active ? 'text-emerald-600' : 'text-slate-500'}`}>
                {account.active ? <FaToggleOn className="h-4 w-4" /> : <FaToggleOff className="h-4 w-4" />}
                {account.active ? 'Active' : 'Disabled'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && !showForm && (
        <div className="mc-card border-dashed text-center">
          <FaWallet className="mx-auto mb-3 h-6 w-6 text-slate-500" />
          <p className="text-sm text-slate-500">No payment accounts configured</p>
          <p className="mt-1 text-xs text-slate-500">Add a bank or wallet account to accept deposit requests.</p>
        </div>
      )}
    </div>
  );
}
