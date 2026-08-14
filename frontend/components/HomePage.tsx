'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaArrowDown, FaArrowUp, FaBolt, FaCoins, FaGift, FaHistory, FaShieldAlt, FaUserCircle, FaWallet } from 'react-icons/fa';
import WalletConnectionPanel from './WalletConnectionPanel';
import { apiFetch, getUser, User } from '@/lib/auth';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  const displayName = data?.user?.username || user?.username || 'MC Hash Miner';
  const displayEmail = data?.user?.email || 'wallet connected';
  const balance = Number(data?.user?.platformBalance || user?.platformBalance || 0);
  const activePlan = data?.activePlan;
  const progress = Math.min(100, Math.max(0, Number(activePlan?.progressPercent || 0)));
  const recentTx = data?.recentTransactions || [];

  const quickStats = [
    { label: 'Active Hashrate', value: activePlan ? `${Number(activePlan.hashRate || 0).toFixed(2)} TH/s` : '0 TH/s', icon: FaBolt, color: 'bg-cmblue-50 text-cmblue-600' },
    { label: 'TVS Metric', value: activePlan ? `${progress}%` : '0%', icon: FaCoins, color: 'bg-sky-50 text-cmblue-700' },
    { label: 'Mining Status', value: activePlan ? 'Active' : 'Idle', icon: FaShieldAlt, color: activePlan ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500' },
    { label: 'Earnings', value: `$${Number(data?.user?.totalEarned || 0).toFixed(2)}`, icon: FaArrowUp, color: 'bg-amber-50 text-amber-600' },
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
    <div className="mc-page">
      <section className="mc-page-header">
        <div className="flex items-center gap-3">
          <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
            <FaUserCircle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase text-cmblue-600">Dashboard</p>
            <h1 className="mc-title">Welcome back, {displayName}</h1>
            <p className="mc-subtitle">{displayEmail}</p>
          </div>
        </div>
        <Link href="/dashboard/settings" className="mc-button-secondary">
          Profile & settings
        </Link>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="mc-glass-blue">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-white/75">Total Balance</p>
              <p className="mt-3 text-4xl font-extrabold sm:text-5xl">${balance.toFixed(2)}</p>
              <p className="mt-2 text-sm text-white/80">
                {activePlan ? `${progress}% active plan progress` : 'No active mining plan yet'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-64">
              <Link href="/dashboard/transactions" className="rounded-2xl bg-white/18 p-3 text-center text-xs font-bold text-white ring-1 ring-white/25 hover:bg-white/25">
                Deposit
              </Link>
              <Link href="/dashboard/withdrawals" className="rounded-2xl bg-white/18 p-3 text-center text-xs font-bold text-white ring-1 ring-white/25 hover:bg-white/25">
                Withdraw
              </Link>
            </div>
          </div>
        </section>

        <section className="mc-card flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Mining Progress</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-950">
              {activePlan ? Number(activePlan.hashRate || 0).toFixed(2) : '0.00'}
            </p>
            <p className="text-sm font-semibold text-cmblue-600">TH/s active hashrate</p>
            <span className={`mt-3 mc-status ${activePlan ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
              {activePlan ? 'Status: Active' : 'Status: Idle'}
            </span>
          </div>
          <div className="grid h-32 w-32 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#008cff ${progress}%, #e3f3ff 0)` }}>
            <div className="grid h-24 w-24 place-items-center rounded-full bg-white shadow-inner">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-slate-950">{progress}%</p>
                <p className="text-[10px] font-bold text-slate-400">TVS</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {quickStats.map((item) => (
          <section key={item.label} className="mc-card">
            <span className={`mc-stat-icon ${item.color}`}>
              <item.icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-[10px] font-bold uppercase text-slate-500">{item.label}</p>
            <p className="mt-1 text-xl font-extrabold text-slate-950">{item.value}</p>
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
        </section>
      </div>
    </div>
  );
}
