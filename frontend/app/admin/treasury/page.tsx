'use client';

import { useEffect, useState } from 'react';
import { FaWallet, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaSyncAlt } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';
import { toastEmitter } from '@/components/NotificationToast';

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

const PAYMENT_METHOD_OPTIONS = [
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'crypto', label: 'Crypto Wallet' },
  { value: 'momo', label: 'Mobile Money' },
  { value: 'opay', label: 'OPay' },
  { value: 'other', label: 'Other' },
];

interface CurrencyOption {
  code?: string;
  symbol?: string;
  name: string;
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
  const [fiatCurrencies, setFiatCurrencies] = useState<CurrencyOption[]>([]);
  const [cryptoCurrencies, setCryptoCurrencies] = useState<CurrencyOption[]>([]);

  useEffect(() => {
    loadAccounts();
    loadCurrencyLists();
  }, []);

  // Supported fiat (ExchangeRate API) + crypto (CoinMarketCap) lists —
  // served from the backend's server-side cache; API keys stay backend-only.
  const loadCurrencyLists = async () => {
    try {
      const [fiatRes, cryptoRes] = await Promise.all([
        apiFetch('/api/currencies/fiat'),
        apiFetch('/api/currencies/crypto'),
      ]);
      setFiatCurrencies(fiatRes.currencies || []);
      setCryptoCurrencies(cryptoRes.currencies || []);
    } catch (err) {
      console.error('Failed to load currency lists:', err);
    }
  };

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

  // Reset the currency default when switching between crypto and fiat types.
  const handleTypeChange = (type: string) => {
    setForm((prev) => ({
      ...prev,
      type,
      currency: type === 'crypto' ? 'USDT' : 'USD',
    }));
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
    const normalizedType = form.type === 'card' ? 'other' : form.type;
    if (!form.name || !form.accountNumber) {
      setError('Account name and account number are required.');
      toastEmitter.error('Validation Error', 'Account name and account number are required');
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
          type: normalizedType,
          name: form.name,
          label: form.label || form.name,
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

      const message = editing ? 'Account updated successfully!' : 'Account created successfully!';
      setSuccess(message);
      if (editing) {
        toastEmitter.success('Account Updated', `${form.name} has been updated`);
      } else {
        toastEmitter.success('Account Created', `New payment account ${form.name} created`);
      }
      
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadAccounts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to save account';
      setError(errorMsg);
      toastEmitter.error('Save Failed', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAccount = async (id: string, active: boolean) => {
    try {
      const account = accounts.find(a => a.id === id);
      await apiFetch(`/api/admin/payment-accounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !active }),
      });
      
      const newStatus = !active ? 'Enabled' : 'Disabled';
      toastEmitter.success('Status Changed', `${account?.name} has been ${newStatus}`);
      loadAccounts();
    } catch (err: any) {
      toastEmitter.error('Toggle Failed', err.message || 'Failed to toggle account');
      console.error('Failed to toggle account:', err);
    }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm('Delete this payment account?')) return;
    try {
      const account = accounts.find(a => a.id === id);
      await apiFetch(`/api/admin/payment-accounts/${id}`, {
        method: 'DELETE',
      });
      toastEmitter.success('Account Deleted', `${account?.name} has been deleted`);
      loadAccounts();
    } catch (err: any) {
      toastEmitter.error('Delete Failed', err.message || 'Failed to delete account');
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
            <select value={form.type} onChange={(e) => handleTypeChange(e.target.value)} className="mc-input">
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Account Name" className="mc-input" />
            <input type="text" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="Account Number / Wallet Address" className="mc-input" />
            <input type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Display Label" className="mc-input sm:col-span-2" />
            <input type="text" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="Bank Name / Provider (optional)" className="mc-input" />
            <input type="text" value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })} placeholder="Account Holder (optional)" className="mc-input" />
            <input type="text" value={form.walletAddress} onChange={(e) => setForm({ ...form, walletAddress: e.target.value })} placeholder="Wallet Address (optional)" className="mc-input sm:col-span-2" />
            <select value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })} className="mc-input">
              <option value="ethereum">Ethereum</option>
              <option value="bnb">BNB Smart Chain</option>
              <option value="solana">Solana</option>
              <option value="bank">Bank</option>
            </select>
            {/* Dynamic currency field:
                crypto → searchable CoinMarketCap list; bank/momo/opay/other →
                searchable ExchangeRate API fiat list (alphabetical). */}
            <div className="sm:col-span-2">
              <input
                type="text"
                list="payment-account-currency-options"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                placeholder={form.type === 'crypto' ? 'Cryptocurrency (e.g. USDT)' : 'Fiat currency (e.g. USD, GHS, NGN)'}
                className="mc-input"
              />
              <datalist id="payment-account-currency-options">
                {(form.type === 'crypto' ? cryptoCurrencies : fiatCurrencies).map((option) => {
                  const code = option.code || option.symbol || '';
                  return (
                    <option key={code} value={code}>
                      {code} — {option.name}
                    </option>
                  );
                })}
              </datalist>
              <p className="mt-1 text-[10px] text-slate-500">
                {form.type === 'crypto'
                  ? 'Search any supported cryptocurrency — deposits are converted to USD via CoinMarketCap.'
                  : 'Search any supported fiat currency — deposits are converted to USD via the ExchangeRate API.'}
              </p>
            </div>
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
