'use client';

import { useEffect, useState } from 'react';
import { FaUsers, FaBolt, FaArrowDown, FaArrowUp, FaCoins, FaLayerGroup, FaUsers as FaReferrals, FaWallet } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const stats = [
    { label: 'Total Users', value: data?.totalUsers || 0, icon: FaUsers, color: 'text-cmblue-600 bg-cmblue-50' },
    { label: 'Active Miners', value: data?.activeMiners || 0, icon: FaBolt, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Total Deposits', value: `$${Number(data?.totalDeposits || 0).toFixed(2)}`, icon: FaArrowDown, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Total Withdrawals', value: `$${Number(data?.totalWithdrawals || 0).toFixed(2)}`, icon: FaArrowUp, color: 'text-rose-600 bg-rose-50' },
    { label: 'Revenue', value: `$${Number(data?.totalRevenue || 0).toFixed(2)}`, icon: FaCoins, color: 'text-amber-600 bg-amber-50' },
    { label: 'Mining Plans', value: data?.miningPlans || 0, icon: FaLayerGroup, color: 'text-purple-600 bg-purple-50' },
    { label: 'Referral Earnings', value: `$${Number(data?.referralEarnings || 0).toFixed(2)}`, icon: FaReferrals, color: 'text-pink-600 bg-pink-50' },
    { label: 'Treasury Wallets', value: data?.treasuryWallets?.length || 0, icon: FaWallet, color: 'text-cyan-600 bg-cyan-50' },
  ];

  return (
    <div className="space-y-6 text-slate-900">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Platform overview and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </span>
              <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{stat.label}</span>
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Treasury Wallets */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Treasury Wallets</h2>
          <p className="text-[10px] text-slate-500">Network receiving wallets</p>
        </div>

        {(data?.treasuryWallets || []).length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {(data.treasuryWallets as any[]).map((wallet: any) => (
              <div key={wallet.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold capitalize text-slate-900">{wallet.network} Treasury</p>
                  <span className={`text-[10px] font-medium ${wallet.active ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {wallet.active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p className="mt-2 text-[10px] text-slate-500">{wallet.address}</p>
                <p className="mt-1 text-sm font-semibold">${Number(wallet.balance || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">No treasury wallets configured</p>
        )}
      </div>
    </div>
  );
}