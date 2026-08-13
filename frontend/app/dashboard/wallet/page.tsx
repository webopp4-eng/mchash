'use client';

import { useEffect, useState } from 'react';
import { FaWallet, FaWifi, FaArrowDown, FaArrowUp, FaHistory, FaCopy } from 'react-icons/fa';
import { apiFetch, getUser, User } from '@/lib/auth';
import { shortenAddress } from '@/lib/wallet';
import Link from 'next/link';

export default function WalletPage() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUser(getUser());
    loadWallet();
  }, []);

  const loadWallet = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/wallet');
      setData(res);
    } catch (err: any) {
      console.error('Failed to load wallet:', err);
      setError(err.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    const address = data?.walletAddress || user?.walletAddress || '';
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center text-sm text-rose-600">
          <p>{error}</p>
        </div>
        <button
          onClick={loadWallet}
          className="rounded-xl bg-cmblue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cmblue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  const balance = data?.platformBalance || user?.platformBalance || '0.00';
  const walletAddress = data?.walletAddress || user?.walletAddress || '';
  const chain = data?.chain || user?.chain || 'ethereum';
  const walletType = data?.walletType || user?.walletType || 'Wallet';

  const actions = [
    { label: 'Deposit', desc: 'View deposit history', href: '/dashboard/transactions', icon: FaArrowDown, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Withdraw', desc: 'Request your earnings', href: '/dashboard/withdrawals', icon: FaArrowUp, color: 'text-rose-600 bg-rose-50' },
    { label: 'History', desc: 'View all transactions', href: '/dashboard/transactions', icon: FaHistory, color: 'text-cmblue-600 bg-cmblue-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your funds and transactions</p>
      </div>

      {/* Credit/Debit Card Style Balance - vivid blue */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-cmblue-700 via-cmblue-600 to-cmblue-500 p-6 text-white shadow-[0_20px_60px_rgba(17,120,250,0.35)]">
        <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-14 -left-8 h-44 w-44 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-blue-100/80">CM HASH</p>
              <p className="mt-0.5 text-[11px] text-blue-100/60">Cloud Mining</p>
            </div>
            <FaWifi className="h-5 w-5 rotate-90 text-blue-100/70" />
          </div>

          <div className="mt-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-blue-100/70">Platform Balance</p>
            <p className="mt-1 text-4xl font-bold tracking-tight">${Number(balance).toFixed(2)}</p>
            <p className="mt-1 text-[10px] text-blue-100/60">USD equivalent</p>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl bg-white/10 p-3 backdrop-blur">
            <div className="min-w-0">
              <p className="text-[8px] uppercase tracking-[0.18em] text-blue-100/60">Connected Wallet</p>
              <p className="mt-0.5 truncate text-xs font-medium">{shortenAddress(walletAddress, 8)}</p>
              <p className="mt-0.5 text-[10px] capitalize text-blue-100/60">{walletType} • {chain}</p>
            </div>
            <button
              onClick={copyAddress}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white transition hover:bg-white/30"
            >
              <FaCopy className="h-3.5 w-3.5" />
            </button>
          </div>

          {copied && (
            <p className="mt-2 text-center text-[10px] font-semibold text-emerald-300">Address copied!</p>
          )}
        </div>
      </div>

      {/* Actions - White */}
      <div className="grid gap-3 sm:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 rounded-[20px] border border-slate-200/80 bg-white p-4 text-left shadow-card transition-all hover:border-cmblue-300 hover:shadow-card-hover"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color}`}>
              <action.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{action.label}</p>
              <p className="text-[10px] text-slate-500">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Deposits - White */}
      <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Deposit History</h2>
          <p className="text-[10px] text-slate-500">Your deposit transactions</p>
        </div>

        {(data?.deposits || []).length > 0 ? (
          <div className="space-y-2">
            {(data.deposits as any[]).map((deposit: any) => (
              <div key={deposit.id} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <FaArrowDown className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{deposit.token} Deposit</p>
                    <p className="text-[10px] text-slate-500">{new Date(deposit.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600">+${Number(deposit.amount).toFixed(2)}</p>
                  <span className={`text-[10px] font-medium ${deposit.status === 'confirmed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {deposit.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">No deposits yet</p>
        )}
      </div>
    </div>
  );
}