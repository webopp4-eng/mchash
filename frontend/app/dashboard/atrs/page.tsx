'use client';

import { useEffect, useState } from 'react';
import { FaBolt, FaChartLine, FaCoins, FaGift, FaSyncAlt, FaUsers } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';

export default function ATRsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadATRs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/atrs');
      setData(res);
    } catch (err: any) {
      console.error('Failed to load ATRs:', err);
      setError(err.message || 'Failed to load ATRs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadATRs();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-300">
        <p>{error}</p>
        <button onClick={loadATRs} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-100">
          <FaSyncAlt className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const summary = data?.summary || {};
  const rewards = data?.rewards || [];
  const sessions = data?.sessions || [];

  const stats = [
    { label: 'Available Rewards', value: `$${Number(summary.availableRewards || 0).toFixed(2)}`, icon: FaCoins, color: 'text-emerald-400 bg-emerald-500/20' },
    { label: 'Total Earned', value: `$${Number(summary.totalEarned || 0).toFixed(2)}`, icon: FaChartLine, color: 'text-cmblue-400 bg-cmblue-500/20' },
    { label: 'Hash Rate', value: `${Number(summary.totalHashRate || 0).toFixed(2)} TH/s`, icon: FaBolt, color: 'text-amber-400 bg-amber-500/20' },
    { label: 'Referral Rewards', value: `$${Number(summary.referralEarned || 0).toFixed(2)}`, icon: FaUsers, color: 'text-purple-400 bg-purple-500/20' },
  ];

  return (
    <div className="mc-page">
      <section className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Reports</p>
          <h1 className="mc-title">Activity Reports</h1>
          <p className="mc-subtitle">Active total rewards (ATR), mining history, and performance</p>
        </div>
        <button onClick={loadATRs} className="mc-button-secondary">
          <FaSyncAlt className="h-3.5 w-3.5" />
          Refresh
        </button>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <section key={stat.label} className="mc-card">
            <span className="mc-stat-icon bg-emerald-50 text-emerald-600">
              <stat.icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-[10px] font-bold uppercase text-slate-500">{stat.label}</p>
            <p className="mt-1 text-xl font-extrabold text-slate-950">{stat.value}</p>
          </section>
        ))}
      </div>

      <section className="mc-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Reward Activity</h2>
            <p className="text-xs text-slate-500">Mining, referral, and renting rewards history</p>
          </div>
          <div className="rounded-full bg-cmblue-50 px-3 py-1 text-sm font-bold text-cmblue-700">
            {rewards.length}
          </div>
        </div>
        {rewards.length > 0 ? (
          <div className="space-y-2">
            {rewards.map((reward: any) => (
              <div key={reward.id} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
                <div className="flex items-center gap-3">
                  <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
                    <FaGift className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-950 capitalize">{reward.type.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-slate-500">{new Date(reward.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-sm font-extrabold text-emerald-600">+${Number(reward.amount || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <FaGift className="mx-auto h-10 w-10 text-cmblue-200" />
            <p className="mt-3 text-sm font-semibold text-slate-500">No reward activity yet</p>
          </div>
        )}
      </section>

      <section className="mc-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Mining Sessions</h2>
            <p className="text-xs text-slate-500">Your active and completed mining sessions</p>
          </div>
          <div className="rounded-full bg-cmblue-50 px-3 py-1 text-sm font-bold text-cmblue-700">
            {sessions.length}
          </div>
        </div>
        {sessions.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {sessions.map((session: any) => (
              <div key={session.id} className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase text-slate-600">
                    <span className={`mc-status ${session.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {session.status}
                    </span>
                  </p>
                </div>
                <p className="mt-3 text-2xl font-extrabold text-slate-950">{Number(session.hashRate || 0).toFixed(2)}</p>
                <p className="text-xs font-semibold text-slate-500">TH/s Hashrate</p>
                <p className="mt-2 text-[10px] text-slate-600">Mined: {Number(session.totalMined || 0).toFixed(4)} BTC</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <FaBolt className="mx-auto h-10 w-10 text-cmblue-200" />
            <p className="mt-3 text-sm font-semibold text-slate-500">No mining sessions yet</p>
          </div>
        )}
      </section>
    </div>
  );
}
