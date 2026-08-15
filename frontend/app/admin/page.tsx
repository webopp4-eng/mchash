'use client';

import { useEffect, useState } from 'react';
import { FaArrowDown, FaArrowUp, FaBolt, FaCoins, FaGift, FaLayerGroup, FaShieldAlt, FaUsers, FaWallet } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';
import { useFinancialData } from '@/lib/financialData';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const financial = useFinancialData();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await apiFetch('/api/admin/dashboard');
      setData(res);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
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

  const totalDeposits = Number(data?.totalDeposits || financial.totalDeposits || 0);
  const totalWithdrawals = Number(data?.totalWithdrawals || financial.totalWithdrawals || 0);
  const totalRevenue = Number(data?.totalRevenue || 0);
  const activeMiners = Number(data?.activeMiners || 0);
  const totalUsers = Number(data?.totalUsers || 0);
  const miningProgress = Math.min(96, Math.max(18, totalUsers ? Math.round((activeMiners / totalUsers) * 100) : 42));

  const stats = [
    { label: 'Active Hashrate', value: activeMiners, detail: 'online miners', icon: FaBolt, color: 'text-cmblue-600 bg-cmblue-50' },
    { label: 'TVS Metric', value: `$${totalDeposits.toFixed(2)}`, detail: 'total value supplied', icon: FaArrowDown, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Mining Status', value: data?.miningPlans || 0, detail: 'configured plans', icon: FaLayerGroup, color: 'text-amber-600 bg-amber-50' },
    { label: 'Earnings', value: `$${totalRevenue.toFixed(2)}`, detail: 'platform revenue', icon: FaCoins, color: 'text-cyan-600 bg-cyan-50' },
  ];

  return (
    <div className="mc-page">
      <div className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Dashboard</p>
          <h1 className="mc-title">Welcome back, MC Hash admin</h1>
          <p className="mc-subtitle">Real-time platform health, mining performance, and treasury activity.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-cmblue-50 px-3 py-2 text-xs font-bold text-cmblue-700 ring-1 ring-cmblue-100">
          <FaShieldAlt className="h-3.5 w-3.5" />
          Secure admin session
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="mc-glass-blue">
          <div className="relative z-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-white/75">Total Balance</p>
              <p className="mt-3 text-4xl font-extrabold tracking-normal sm:text-5xl">${(totalDeposits - totalWithdrawals).toFixed(2)}</p>
              <p className="mt-2 text-sm text-white/80">Deposits minus withdrawals across MC HASH treasury flows.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-64">
              <div className="rounded-2xl bg-white/18 p-3 ring-1 ring-white/25">
                <p className="text-[10px] font-bold uppercase text-white/70">Deposits</p>
                <p className="mt-1 text-lg font-bold">+${totalDeposits.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl bg-white/18 p-3 ring-1 ring-white/25">
                <p className="text-[10px] font-bold uppercase text-white/70">Withdrawals</p>
                <p className="mt-1 text-lg font-bold">-${totalWithdrawals.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mc-card flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Mining Progress</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-950">{activeMiners}</p>
            <p className="text-sm font-semibold text-cmblue-600">Active miners</p>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Status: Active
            </span>
          </div>
          <div
            className="grid h-32 w-32 shrink-0 place-items-center rounded-full"
            style={{ background: `conic-gradient(#008cff ${miningProgress}%, #e3f3ff 0)` }}
          >
            <div className="grid h-24 w-24 place-items-center rounded-full bg-white shadow-inner">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-slate-950">{miningProgress}%</p>
                <p className="text-[10px] font-bold text-slate-400">TVS</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="mc-card">
            <div className="flex items-center gap-2">
              <span className={`mc-stat-icon ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold uppercase text-slate-500">{stat.label}</span>
            </div>
            <p className="mt-3 text-xl font-extrabold text-slate-950">{stat.value}</p>
            <p className="mt-1 text-[10px] font-medium text-slate-400">{stat.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
      <section className="mc-card">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-950">Treasury Wallets</h2>
          <p className="text-xs text-slate-500">Network receiving wallets and balances</p>
        </div>

        {(data?.treasuryWallets || []).length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {(data.treasuryWallets as any[]).map((wallet: any) => (
              <div key={wallet.id} className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold capitalize text-slate-950">{wallet.network} Treasury</p>
                  <span className={`mc-status ${wallet.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {wallet.active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p className="mt-2 text-[10px] text-slate-500">{wallet.address}</p>
                <p className="mt-2 text-lg font-extrabold text-slate-950">${Number(wallet.balance || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">No treasury wallets configured</p>
        )}
      </section>

      <section className="mc-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Recent Activity</h2>
            <p className="text-xs text-slate-500">Rewards, funds, and account movement</p>
          </div>
          <FaGift className="h-5 w-5 text-cmblue-500" />
        </div>
        <div className="space-y-3">
          {[
            ['Total users', totalUsers, 'bg-cmblue-50 text-cmblue-600', FaUsers],
            ['Referral earnings', `$${Number(data?.referralEarnings || 0).toFixed(2)}`, 'bg-emerald-50 text-emerald-600', FaGift],
            ['Treasury wallets', data?.treasuryWallets?.length || 0, 'bg-amber-50 text-amber-600', FaWallet],
          ].map(([label, value, color, Icon]: any) => (
            <div key={label} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-white/70 p-3">
              <div className="flex items-center gap-3">
                <span className={`mc-stat-icon ${color}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <p className="text-sm font-bold text-slate-700">{label}</p>
              </div>
              <p className="text-sm font-extrabold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      </section>
      </div>
    </div>
  );
}
