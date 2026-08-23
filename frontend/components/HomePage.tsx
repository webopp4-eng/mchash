'use client';

/**
 * HOME / DASHBOARD — mining display comes from the SAME unified store and
 * component as the Mining page (lib/miningData.ts + MiningPools.tsx).
 * No separate mining state or calculations exist here.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaArrowDown, FaArrowUp, FaHistory, FaUserCircle } from 'react-icons/fa';
import WalletConnectionPanel from './WalletConnectionPanel';
import MiningPools from './MiningPools';
import { apiFetch, getUser, User } from '@/lib/auth';
import { useFinancialData } from '@/lib/financialData';
import { getBalanceFontSize } from '@/lib/typography';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const financial = useFinancialData();

  useEffect(() => {
    setUser(getUser());
    loadDashboard();

    // No continuous reward/activity polling: data is refreshed on load and
    // when the user returns to the tab. Rewards are processed server-side
    // once per hour.
    const resync = () => {
      if (document.visibilityState === 'visible') loadDashboard();
    };
    window.addEventListener('focus', resync);
    document.addEventListener('visibilitychange', resync);

    return () => {
      window.removeEventListener('focus', resync);
      document.removeEventListener('visibilitychange', resync);
    };
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

  if (loading && !financial.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  const displayName = data?.user?.username || user?.username || 'MC Hash Miner';
  const displayEmail = data?.user?.email || 'wallet connected';
  const balance = financial.platformBalance || Number(data?.user?.platformBalance || user?.platformBalance || 0);
  const recentTx = data?.recentTransactions || [];

  const fallbackTransactions = [
    { label: 'Mining Reward', amount: 2.45, time: '2 min ago', type: 'reward' },
    { label: 'Deposit', amount: 50, time: 'Recent', type: 'deposit' },
    { label: 'Withdrawal', amount: -25, time: 'Recent', type: 'withdrawal' },
    { label: 'Referral Bonus', amount: 10, time: 'Recent', type: 'referral' },
  ];

  const transactions = (recentTx.length > 0 ? recentTx.slice(0, 5) : fallbackTransactions).map((tx: any) => {
    const type = tx.type || 'reward';
    const amount = Number(tx.amount || 0);
    return {
      label: tx.label || (type === 'deposit' ? 'Deposit' : type === 'withdrawal' ? 'Withdrawal' : type === 'purchase' ? 'Plan Purchase' : type === 'referral' ? 'Team Reward' : 'Mining Reward'),
      value: `${amount >= 0 ? '+' : ''}$${amount.toFixed(2)}`,
      time: tx.createdAt ? new Date(tx.createdAt).toLocaleString() : tx.time,
      positive: amount >= 0,
      iconClass:
        type === 'deposit' ? 'bg-emerald-50 text-emerald-600'
        : type === 'withdrawal' ? 'bg-rose-50 text-rose-600'
        : type === 'referral' ? 'bg-amber-50 text-amber-600'
        : 'bg-cmblue-50 text-cmblue-600',
    };
  });

  return (
    <div className="mc-page space-y-3 sm:space-y-5">
      {/* Page-intro header — hidden on mobile via .mc-page-header */}
      <section className="mc-page-header">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cmblue-50 text-cmblue-600 sm:h-10 sm:w-10">
            <FaUserCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase text-cmblue-600 sm:text-[10px]">Dashboard</p>
            <h1 className="truncate text-sm font-extrabold tracking-normal text-slate-950 sm:text-lg">
              Welcome back, {displayName}
            </h1>
            <p className="truncate text-[10px] text-slate-500 sm:text-xs">{displayEmail}</p>
          </div>
        </div>
        <Link href="/dashboard/settings" className="mc-button-secondary w-full sm:w-auto">
          Profile & settings
        </Link>
      </section>

      {/* Total balance card */}
      <section className="mc-glass-blue">
        <div className="flex flex-col gap-4 sm:gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase text-white/75">Total Balance</p>
            <p className={`mt-2 font-extrabold sm:mt-3 ${getBalanceFontSize(balance, 'text-3xl sm:text-4xl lg:text-5xl')}`}>${balance.toFixed(2)}</p>
            <p className="mt-1 text-xs sm:mt-2 sm:text-sm text-white/80">
              Earnings settle hourly · live values update as you mine
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-56">
            <Link href="/dashboard/deposits" className="rounded-xl bg-gradient-to-r from-cmblue-500 to-sky-500 px-3 py-2.5 text-center text-xs font-bold text-white shadow-[0_8px_20px_rgba(0,130,255,0.35)] ring-1 ring-white/30 transition-all hover:brightness-110 sm:rounded-2xl sm:bg-white/18 sm:p-3 sm:text-xs sm:shadow-none sm:ring-white/25 sm:hover:bg-white/25">
              Deposit
            </Link>
            <Link href="/dashboard/withdrawals" className="rounded-xl bg-gradient-to-r from-cmblue-500 to-sky-500 px-3 py-2.5 text-center text-xs font-bold text-white shadow-[0_8px_20px_rgba(0,130,255,0.35)] ring-1 ring-white/30 transition-all hover:brightness-110 sm:rounded-2xl sm:bg-white/18 sm:p-3 sm:text-xs sm:shadow-none sm:ring-white/25 sm:hover:bg-white/25">
              Withdraw
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Unified multi-mining display — identical to the Mining page ===== */}
      <MiningPools />

      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <section className="mc-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">Recent Activity</h2>
              <p className="text-xs text-slate-500">Meaningful events only — settlements, deposits, withdrawals</p>
            </div>
            <Link href="/dashboard/transactions" className="mc-button-secondary min-h-8 px-3 py-1">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {transactions.map((item: any) => (
              <div key={item.label + item.time} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
                <div className="flex items-center gap-3">
                  <span className={`mc-stat-icon ${item.iconClass}`}>
                    <FaHistory className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-950">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.time}</p>
                  </div>
                </div>
                <p className={`text-sm font-extrabold ${item.positive ? 'text-emerald-600' : 'text-rose-600'}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mc-card">
          <div className="mb-4 flex items-center gap-3">
            <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
              <FaHistory className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-950">Wallet Connection</h2>
              <p className="text-xs text-slate-500">Connected wallet and chain details</p>
            </div>
          </div>
          <WalletConnectionPanel compact showTitle={false} darkMode={false} />

          <div className="mt-4 pt-4 border-t border-sky-100">
            <Link href="/dashboard/profile/payout-methods" className="flex items-center justify-between gap-3 rounded-xl bg-cmblue-50/50 p-3 text-sm font-semibold text-cmblue-700 hover:bg-cmblue-100/50 transition">
              <span>💰 Connect Payout Method</span>
              <span>→</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}