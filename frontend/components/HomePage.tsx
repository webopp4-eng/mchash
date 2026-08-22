'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaArrowDown, FaArrowUp, FaBolt, FaCoins, FaGift, FaHistory, FaShieldAlt, FaUserCircle, FaWallet } from 'react-icons/fa';
import WalletConnectionPanel from './WalletConnectionPanel';
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
    const interval = setInterval(loadDashboard, 10000);
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
  const activePlan = data?.activePlan;
  const progress = Math.min(100, Math.max(0, Number(activePlan?.progressPercent || 0)));
  const recentTx = data?.recentTransactions || [];

  const quickStats = [
    { label: 'Active Hashrate', value: activePlan ? `${Number(activePlan.hashRate || 0).toFixed(2)} TH/s` : '0 TH/s', icon: FaBolt, color: 'bg-cmblue-50 text-cmblue-600' },
    { label: 'TVS Metric', value: activePlan ? `${progress}%` : '0%', icon: FaCoins, color: 'bg-sky-50 text-cmblue-700' },
    { label: 'Mining Status', value: activePlan ? 'Active' : 'Idle', icon: FaShieldAlt, color: activePlan ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500' },
    { label: 'Earnings', value: `$${(financial.miningEarnings || Number(data?.user?.totalEarned || 0)).toFixed(2)}`, icon: FaArrowUp, color: 'bg-amber-50 text-amber-600' },
  ];

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
      icon: type === 'deposit' ? FaArrowDown : type === 'withdrawal' ? FaArrowUp : type === 'referral' ? FaGift : FaBolt,
      iconClass: type === 'deposit' ? 'bg-emerald-50 text-emerald-600' : type === 'withdrawal' ? 'bg-rose-50 text-rose-600' : type === 'referral' ? 'bg-amber-50 text-amber-600' : 'bg-cmblue-50 text-cmblue-600',
    };
  });

  return (
    <div className="mc-page space-y-3 sm:space-y-5">
      <section className="mc-page-header">
        {/* Profile icon aligned side-by-side with the welcome text — compact
            and balanced on mobile screens */}
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

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="mc-glass-blue">
          <div className="flex flex-col gap-4 sm:gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase text-white/75">Total Balance</p>
              <p className={`mt-2 font-extrabold sm:mt-3 ${getBalanceFontSize(balance, 'text-3xl sm:text-4xl lg:text-5xl')}`}>${balance.toFixed(2)}</p>
              <p className="mt-1 text-xs sm:mt-2 sm:text-sm text-white/80">
                {activePlan ? `${progress}% active plan progress` : 'No active mining plan yet'}
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-56">
              {/* Mobile: energetic gradient buttons; desktop keeps translucent style */}
              <Link href="/dashboard/deposits" className="rounded-xl bg-gradient-to-r from-cmblue-500 to-sky-500 px-3 py-2.5 text-center text-xs font-bold text-white shadow-[0_8px_20px_rgba(0,130,255,0.35)] ring-1 ring-white/30 transition-all hover:brightness-110 sm:rounded-2xl sm:bg-white/18 sm:p-3 sm:text-xs sm:shadow-none sm:ring-white/25 sm:hover:bg-white/25">
                Deposit
              </Link>
              <Link href="/dashboard/withdrawals" className="rounded-xl bg-gradient-to-r from-cmblue-500 to-sky-500 px-3 py-2.5 text-center text-xs font-bold text-white shadow-[0_8px_20px_rgba(0,130,255,0.35)] ring-1 ring-white/30 transition-all hover:brightness-110 sm:rounded-2xl sm:bg-white/18 sm:p-3 sm:text-xs sm:shadow-none sm:ring-white/25 sm:hover:bg-white/25">
                Withdraw
              </Link>
            </div>
          </div>
        </section>

        {/* Desktop/tablet-only progress card — mobile uses the unified Mining Pool card below.
            Gentle breathing glow + sheen communicate active mining. */}
        <section className={`mc-card hidden flex-col items-center justify-between gap-4 sm:flex-row lg:flex mc-sheen ${activePlan ? 'animate-mc-breathe' : ''}`}>
          <div className="w-full sm:flex-1">
            <p className="text-[10px] font-bold uppercase text-slate-400">Mining Progress</p>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-950">
              {activePlan ? Number(activePlan.hashRate || 0).toFixed(2) : '0.00'}
            </p>
            <p className="text-xs sm:text-sm font-semibold text-cmblue-600">TH/s active hashrate</p>
            <span className={`mt-2 mc-status ${activePlan ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
              {activePlan ? 'Status: Active' : 'Status: Idle'}
            </span>
          </div>
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full sm:h-32 sm:w-32" style={{ background: `conic-gradient(#008cff ${progress}%, #e3f3ff 0)` }}>
            <div className="grid h-16 w-16 place-items-center rounded-full bg-white shadow-inner sm:h-24 sm:w-24">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-extrabold text-slate-950">{progress}%</p>
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400">TVS</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ===== MOBILE ONLY: one clean, unified Mining Pool card ===== */}
      <section className={`relative overflow-hidden rounded-[24px] border border-cmblue-100 bg-gradient-to-br from-sky-50 via-white to-cmblue-50 p-5 shadow-[0_18px_44px_rgba(0,130,255,0.16)] mc-sheen animate-mc-float lg:hidden ${activePlan ? 'animate-mc-breathe' : ''}`}>
        {/* Soft decorative glows */}
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-cmblue-300/30 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-sky-300/40 blur-2xl" />

        {/* Header: title + live status pill */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cmblue-500 to-sky-500 text-white shadow-md">
              <FaBolt className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-slate-950">Mining Pool</p>
              <p className="text-[10px] font-semibold text-slate-500">
                {activePlan ? 'Your active mining package' : 'Start mining to earn rewards'}
              </p>
            </div>
          </div>
          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
            activePlan ? 'bg-emerald-100/80 text-emerald-600' : 'bg-slate-200/70 text-slate-500'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${activePlan ? 'animate-pulse bg-emerald-500' : 'bg-slate-400'}`} />
            {activePlan ? 'Active' : 'Idle'}
          </span>
        </div>

        {/* Prominent circular TVS metric */}
        <div
          className="relative mx-auto mt-6 grid h-44 w-44 place-items-center rounded-full"
          style={{ background: `conic-gradient(#008cff ${progress}%, #dcefff 0)` }}
        >
          <div className="grid h-[9.5rem] w-[9.5rem] place-items-center rounded-full bg-white shadow-inner ring-1 ring-sky-100">
            <div className="text-center">
              <p className="text-4xl font-black leading-none text-slate-950">
                {progress}
                <span className="text-lg font-extrabold text-cmblue-500">%</span>
              </p>
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">TVS Metric</p>
            </div>
          </div>
        </div>

        {/* Supporting metrics — compact, neat, secondary to the main metric */}
        <div className="relative mt-6 grid grid-cols-3 divide-x divide-sky-100 rounded-2xl border border-sky-100 bg-white/80 py-3 backdrop-blur">
          <div className="px-2 text-center">
            <p className="text-sm font-extrabold text-slate-950">
              {activePlan ? Number(activePlan.hashRate || 0).toFixed(2) : '0.00'}
              <span className="ml-0.5 text-[9px] font-bold text-cmblue-600">TH/s</span>
            </p>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">Hashrate</p>
          </div>
          <div className="px-2 text-center">
            <p className="text-sm font-extrabold text-slate-950">
              ${(financial.miningEarnings || Number(data?.user?.totalEarned || 0)).toFixed(2)}
            </p>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">Earnings</p>
          </div>
          <div className="px-2 text-center">
            <p className={`text-sm font-extrabold ${activePlan ? 'text-emerald-600' : 'text-slate-400'}`}>
              {activePlan ? 'On' : 'Off'}
            </p>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">Mining</p>
          </div>
        </div>
      </section>

      {/* Desktop-only quick stats (mobile uses the unified Mining Pool card above) */}
      <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((item) => (
          <section key={item.label} className="mc-card">
            <span className={`mc-stat-icon ${item.color}`}>
              <item.icon className="h-4 w-4" />
            </span>
            <p className="mt-2 text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 line-clamp-2">{item.label}</p>
            <p className="mt-1 text-lg sm:text-xl font-extrabold text-slate-950 line-clamp-2">{item.value}</p>
          </section>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <section className="mc-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">Recent Activity</h2>
              <p className="text-xs text-slate-500">Rewards, deposits, withdrawals, and team bonuses</p>
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
                    <item.icon className="h-4 w-4" />
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
