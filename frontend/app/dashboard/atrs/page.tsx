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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ATRs</h1>
          <p className="mt-1 text-sm text-slate-400">Active total rewards and mining reward activity</p>
        </div>
        <button onClick={loadATRs} className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10">
          <FaSyncAlt className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[20px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </span>
              <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{stat.label}</span>
            </div>
            <p className="mt-3 text-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-cmblue-300">Reward Activity</h2>
          <p className="text-[10px] text-slate-500">Mining, referrals, and hash renting rewards</p>
        </div>
        {rewards.length > 0 ? (
          <div className="space-y-2">
            {rewards.map((reward: any) => (
              <div key={reward.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cmblue-500/20 text-cmblue-400">
                    <FaGift className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold capitalize">{reward.type.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-slate-500">{new Date(reward.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-emerald-400">+${Number(reward.amount || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">No reward activity yet</p>
        )}
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <h2 className="text-sm font-semibold text-cmblue-300">Mining Sessions</h2>
        {sessions.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {sessions.map((session: any) => (
              <div key={session.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold capitalize">{session.status}</p>
                <p className="mt-2 text-lg font-bold">{Number(session.hashRate || 0).toFixed(2)} TH/s</p>
                <p className="mt-1 text-[10px] text-slate-500">Total mined: {Number(session.totalMined || 0).toFixed(4)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">No mining sessions yet</p>
        )}
      </div>
    </div>
  );
}
