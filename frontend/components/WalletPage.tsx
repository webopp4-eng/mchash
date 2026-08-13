'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaArrowDown, FaArrowUp, FaHistory, FaWifi, FaCopy } from 'react-icons/fa';
import { apiFetch, getUser, User } from '@/lib/auth';
import { shortenAddress } from '@/lib/wallet';

const actions = [
  { label: 'Deposit', description: 'Add funds to your account', href: '/dashboard/transactions', icon: FaArrowDown },
  { label: 'Withdraw', description: 'Request your earnings', href: '/dashboard/withdrawals', icon: FaArrowUp },
  { label: 'Transaction History', description: 'View all transactions', href: '/dashboard/transactions', icon: FaHistory },
];

export default function WalletPage() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUser(getUser());
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const res = await apiFetch('/api/wallet');
      setData(res);
    } catch (err) {
      console.error('Failed to load wallet:', err);
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

  const balance = data?.platformBalance || user?.platformBalance || '0.00';
  const walletAddress = data?.walletAddress || user?.walletAddress || '';
  const chain = data?.chain || user?.chain || 'ethereum';
  const walletType = data?.walletType || user?.walletType || 'Wallet';
  const recent = data?.recentTransactions || [];

  const recentTransactions = (recent.length > 0 ? recent : [
    { label: 'Mining Reward', value: '+ $2.45', status: 'Completed' },
    { label: 'Deposit', value: '+ $50.00', status: 'Completed' },
    { label: 'Withdrawal', value: '- $25.00', status: 'Completed' },
  ]).map((tx: any) => ({
    label: tx.type ? (tx.type === 'deposit' ? 'Deposit' : tx.type === 'withdrawal' ? 'Withdrawal' : tx.type === 'purchase' ? 'Plan Purchase' : 'Mining Reward') : tx.label,
    value: `${Number(tx.amount) >= 0 ? '+' : ''}$${Number(tx.amount || 0).toFixed(2)}`,
    status: tx.status || 'Completed',
  }));

  return (
    <div className="min-h-screen px-4 pb-28 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Mobile View - Matches wallets.png */}
        <section className="mobile-only glass-card mb-4 p-4">
          <div className="mb-3">
            <p className="text-[10px] text-slate-500">Wallet</p>
            <h1 className="mt-0.5 text-base font-semibold text-slate-900">CM HASH Wallet</h1>
          </div>

          {/* Credit/Debit Card Style Balance */}
          <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-cmblue-700 via-cmblue-600 to-cmblue-500 p-5 text-white shadow-blue-glow">
            <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-12 -left-6 h-36 w-36 rounded-full bg-white/5" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.24em] text-blue-100/80">CM HASH</p>
                  <p className="mt-0.5 text-[10px] text-blue-100/60">Cloud Mining</p>
                </div>
                <FaWifi className="h-4 w-4 rotate-90 text-blue-100/70" />
              </div>

              <div className="mt-6">
                <p className="text-[9px] uppercase tracking-[0.2em] text-blue-100/70">Available Balance</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight">${Number(balance).toFixed(2)}</p>
              </div>

              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-[8px] uppercase tracking-[0.18em] text-blue-100/60">Card Holder</p>
                  <p className="mt-0.5 text-xs font-medium">{user?.username || 'Wallet'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] uppercase tracking-[0.18em] text-blue-100/60">Network</p>
                  <p className="mt-0.5 text-xs font-medium capitalize">{chain}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] uppercase tracking-[0.18em] text-blue-100/60">Type</p>
                  <p className="mt-0.5 text-xs font-medium">{walletType}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-2">
            {actions.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-card transition hover:bg-cmblue-50/40"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-cmblue-50 text-cmblue-600">
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.description}</p>
                  </div>
                </div>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold text-cmblue-600 shadow-sm">Go</span>
              </Link>
            ))}
          </div>

          <div className="mt-3 rounded-[20px] border border-slate-200 bg-slate-50 p-3 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Recent Transactions</p>
              <Link href="/dashboard/transactions" className="text-xs font-medium text-cmblue-600 transition hover:text-cmblue-700">View All</Link>
            </div>
            <div className="mt-3 space-y-2">
              {recentTransactions.slice(0, 3).map((item: any) => (
                <div key={item.label} className="flex items-center justify-between rounded-[18px] bg-white px-3 py-2.5 shadow-sm">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.status}</p>
                  </div>
                  <p className={`text-xs font-semibold ${item.value.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Desktop View */}
        <section className="desktop-only hidden glass-card p-5">
          <div className="mb-4">
            <p className="text-xs text-slate-500">Wallet</p>
            <h1 className="text-lg font-semibold text-slate-900">CM HASH Wallet</h1>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Credit/Debit Card Style Balance */}
            <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-cmblue-700 via-cmblue-600 to-cmblue-500 p-6 text-white shadow-blue-glow">
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
                  <p className="text-[10px] uppercase tracking-[0.2em] text-blue-100/70">Available Balance</p>
                  <p className="mt-1 text-4xl font-semibold tracking-tight">${Number(balance).toFixed(2)}</p>
                </div>

                <div className="mt-6 flex items-center justify-between rounded-xl bg-white/10 p-3 backdrop-blur">
                  <div className="min-w-0">
                    <p className="text-[8px] uppercase tracking-[0.18em] text-blue-100/60">Connected Wallet</p>
                    <p className="mt-0.5 truncate text-xs font-medium">{shortenAddress(walletAddress, 8) || 'No wallet'}</p>
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

            <div className="grid gap-2">
              {actions.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-[20px] border border-slate-200 bg-slate-50 p-3 shadow-card transition hover:bg-cmblue-50/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-cmblue-50 text-cmblue-600">
                        <item.icon className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{item.label}</p>
                        <p className="text-[10px] text-slate-500">{item.description}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-cmblue-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">Go</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Transaction History</p>
                <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
              </div>
              <Link href="/dashboard/transactions" className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-900 shadow-sm transition hover:bg-slate-50">View all</Link>
            </div>
            <div className="space-y-2">
              {recentTransactions.slice(0, 5).map((item: any) => (
                <div key={item.label} className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-cmblue-50 text-cmblue-600">
                      <FaHistory className="h-3 w-3" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{item.label}</p>
                      <p className="text-[10px] text-slate-500">{item.status}</p>
                    </div>
                  </div>
                  <p className={`text-xs font-semibold ${item.value.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}