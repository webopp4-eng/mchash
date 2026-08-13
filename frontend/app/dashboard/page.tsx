'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaBolt, FaWallet, FaArrowUp, FaArrowDown, FaCoins, FaUsers, FaExchangeAlt } from 'react-icons/fa';
import { apiFetch, getUser, User } from '@/lib/auth';
import { shortenAddress } from '@/lib/wallet';

interface DashboardData {
  user: any;
  activePlan: any;
  recentTransactions: any[];
  notifications: any[];
}

export default function DashboardHome() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUser());
    loadDashboard();
    const interval = setInterval(loadDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await apiFetch('/api/dashboard');
      setData(res);
      if (res.user) {
        localStorage.setItem('cmhash_user', JSON.stringify(res.user));
        setUser(res.user);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  const balance = data?.user?.platformBalance || user?.platformBalance || '0.00';
  const walletAddress = data?.user?.walletAddress || user?.walletAddress || '';
  const chain = data?.user?.chain || user?.chain || 'ethereum';
  const activePlan = data?.activePlan;
  const recentTx = data?.recentTransactions || [];

  return (
    <div className="space-y-6 text-slate-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cmblue-600">Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Welcome back, {data?.user?.username || user?.username || 'Miner'}</h1>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Connected
        </span>
      </div>

      {/* Balance Hero Card - vivid blue gradient */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0b5fd4] via-[#1178fa] to-[#4a9dff] p-6 text-white shadow-[0_24px_60px_rgba(17,120,250,0.3)]">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 left-0 h-40 w-40 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-blue-100">CM HASH</p>
              <p className="mt-1 text-sm text-blue-100/80">Cloud Mining</p>
            </div>
            <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
              Live
            </div>
          </div>

          <div className="mt-8 grid items-end gap-5 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-blue-100/80">Platform Balance</p>
              <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">${Number(balance).toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-[0.2em] text-blue-100/80">Wallet</p>
              <p className="mt-2 text-base font-semibold">{shortenAddress(walletAddress) || 'No wallet linked'}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5">
              <p className="text-[9px] uppercase tracking-[0.16em] text-blue-100/75">Wallet Balance</p>
              <p className="mt-1 text-sm font-semibold">0.00</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5">
              <p className="text-[9px] uppercase tracking-[0.16em] text-blue-100/75">Network</p>
              <p className="mt-1 text-sm font-semibold capitalize">{chain}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5">
              <p className="text-[9px] uppercase tracking-[0.16em] text-blue-100/75">Status</p>
              <p className="mt-1 text-sm font-semibold text-emerald-200">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - clean white */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-card">
          <div className="flex items-center gap-2 text-cmblue-600">
            <FaBolt className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Hash Rate</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{activePlan ? `${Number(activePlan.hashRate || 0).toFixed(2)} TH/s` : '0 TH/s'}</p>
        </div>
        <div className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-card">
          <div className="flex items-center gap-2 text-emerald-500">
            <FaCoins className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Total Earned</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">${Number(data?.user?.totalEarned || 0).toFixed(2)}</p>
        </div>
        <div className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-card">
          <div className="flex items-center gap-2 text-violet-500">
            <FaUsers className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Referrals</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">0</p>
        </div>
        <div className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-card">
          <div className="flex items-center gap-2 text-amber-500">
            <FaExchangeAlt className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Transactions</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{recentTx.length}</p>
        </div>
      </div>

      {/* Active Mining Plan - white card */}
      <div className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Active Mining Plan</h2>
            <p className="text-xs text-slate-500">Your current mining contract</p>
          </div>
          {activePlan ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-600">Active</span>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">No Plan</span>
          )}
        </div>

        {activePlan ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Plan</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{activePlan.plan.name}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Daily Earnings</p>
              <p className="mt-1 text-sm font-semibold text-emerald-600">${activePlan.dailyEarnings.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Progress</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-cmblue-500 to-cmblue-400" style={{ width: `${activePlan.progress}%` }} />
              </div>
              <p className="mt-2 text-[10px] text-slate-500">{activePlan.progressPercent || Math.round(activePlan.progress || 0)}%</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Time Remaining</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{activePlan.timeRemaining}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-500">No active mining plan</p>
            <Link href="/dashboard/plans" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cmblue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cmblue-500">
              <FaBolt className="h-3.5 w-3.5" />
              View Plans
            </Link>
          </div>
        )}
      </div>

      {/* Recent Transactions - white card */}
      <div className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
            <p className="text-xs text-slate-500">Your latest activity</p>
          </div>
          <Link href="/dashboard/transactions" className="text-xs font-semibold text-cmblue-600 hover:text-cmblue-700">View All</Link>
        </div>

        {recentTx.length > 0 ? (
          <div className="space-y-2">
            {recentTx.slice(0, 5).map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    tx.type === 'deposit' ? 'bg-emerald-100 text-emerald-600' :
                    tx.type === 'withdrawal' ? 'bg-rose-100 text-rose-600' :
                    tx.type === 'purchase' ? 'bg-cmblue-100 text-cmblue-600' :
                    'bg-violet-100 text-violet-600'
                  }`}>
                    {tx.type === 'deposit' ? <FaArrowDown className="h-3.5 w-3.5" /> :
                     tx.type === 'withdrawal' ? <FaArrowUp className="h-3.5 w-3.5" /> :
                     tx.type === 'purchase' ? <FaWallet className="h-3.5 w-3.5" /> :
                     <FaBolt className="h-3.5 w-3.5" />}
                  </span>
                  <div>
                    <p className="text-xs font-semibold capitalize text-slate-800">{tx.type}</p>
                    <p className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${Number(tx.amount) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {Number(tx.amount) >= 0 ? '+' : ''}{Number(tx.amount).toFixed(2)} {tx.currency}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">No transactions yet</p>
        )}
      </div>
    </div>
  );
}