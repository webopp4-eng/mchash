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
  const walletType = data?.user?.walletType || user?.walletType || 'Wallet';
  const activePlan = data?.activePlan;
  const recentTx = data?.recentTransactions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Welcome back, {data?.user?.username || user?.username || 'Miner'}</p>
      </div>

      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-cmblue-700 via-cmblue-600 to-cmblue-500 p-6 text-white shadow-[0_20px_60px_rgba(14,161,255,0.3)]">
        <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-14 -left-8 h-44 w-44 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-cmblue-100/80">CM HASH</p>
              <p className="mt-0.5 text-[11px] text-cmblue-100/60">Cloud Mining</p>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-semibold text-emerald-300">
              ● Connected
            </span>
          </div>

          <div className="mt-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-cmblue-100/70">Platform Balance</p>
            <p className="mt-1 text-4xl font-bold tracking-tight">${Number(balance).toFixed(2)}</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] text-cmblue-100/60">Wallet Balance</p>
              <p className="mt-0.5 text-sm font-semibold">0.00</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] text-cmblue-100/60">Wallet</p>
              <p className="mt-0.5 text-sm font-semibold">{shortenAddress(walletAddress)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] text-cmblue-100/60">Network</p>
              <p className="mt-0.5 text-sm font-semibold capitalize">{chain}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] text-cmblue-100/60">Status</p>
              <p className="mt-0.5 text-sm font-semibold text-emerald-300">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-cmblue-400">
            <FaBolt className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Hash Rate</span>
          </div>
          <p className="mt-2 text-xl font-bold">{activePlan ? `${Number(activePlan.hashRate || 0).toFixed(2)} TH/s` : '0 TH/s'}</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-emerald-400">
            <FaCoins className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Total Earned</span>
          </div>
          <p className="mt-2 text-xl font-bold">${Number(data?.user?.totalEarned || 0).toFixed(2)}</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-purple-400">
            <FaUsers className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Referrals</span>
          </div>
          <p className="mt-2 text-xl font-bold">0</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-amber-400">
            <FaExchangeAlt className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Transactions</span>
          </div>
          <p className="mt-2 text-xl font-bold">{recentTx.length}</p>
        </div>
      </div>

      {/* Active Mining Plan */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-cmblue-300">Active Mining Plan</h2>
            <p className="text-[10px] text-slate-500">Your current mining contract</p>
          </div>
          {activePlan ? (
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-semibold text-emerald-300">Active</span>
          ) : (
            <span className="rounded-full bg-slate-500/20 px-3 py-1 text-[10px] font-semibold text-slate-400">No Plan</span>
          )}
        </div>

        {activePlan ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] text-slate-500">Plan</p>
              <p className="mt-1 text-sm font-semibold">{activePlan.plan.name}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] text-slate-500">Daily Earnings</p>
              <p className="mt-1 text-sm font-semibold text-emerald-400">${activePlan.dailyEarnings.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] text-slate-500">Progress</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700">
                <div className="h-full rounded-full bg-gradient-to-r from-cmblue-500 to-cmblue-400" style={{ width: `${activePlan.progress}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-slate-400">{activePlan.progressPercent || Math.round(activePlan.progress || 0)}%</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] text-slate-500">Time Remaining</p>
              <p className="mt-1 text-sm font-semibold">{activePlan.timeRemaining}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/20 p-6 text-center">
            <p className="text-sm text-slate-400">No active mining plan</p>
            <Link href="/dashboard/plans" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-cmblue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cmblue-500">
              <FaBolt className="h-3.5 w-3.5" />
              View Plans
            </Link>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-cmblue-300">Recent Transactions</h2>
            <p className="text-[10px] text-slate-500">Your latest activity</p>
          </div>
          <Link href="/dashboard/transactions" className="text-xs font-medium text-cmblue-400 hover:text-cmblue-300">View All</Link>
        </div>

        {recentTx.length > 0 ? (
          <div className="space-y-2">
            {recentTx.slice(0, 5).map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                    tx.type === 'deposit' ? 'bg-emerald-500/20 text-emerald-400' :
                    tx.type === 'withdrawal' ? 'bg-rose-500/20 text-rose-400' :
                    tx.type === 'purchase' ? 'bg-cmblue-500/20 text-cmblue-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {tx.type === 'deposit' ? <FaArrowDown className="h-3.5 w-3.5" /> :
                     tx.type === 'withdrawal' ? <FaArrowUp className="h-3.5 w-3.5" /> :
                     tx.type === 'purchase' ? <FaWallet className="h-3.5 w-3.5" /> :
                     <FaBolt className="h-3.5 w-3.5" />}
                  </span>
                  <div>
                    <p className="text-xs font-semibold capitalize">{tx.type}</p>
                    <p className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${Number(tx.amount) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
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
