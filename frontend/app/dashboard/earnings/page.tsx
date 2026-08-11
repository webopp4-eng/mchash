'use client';

import { useEffect, useState } from 'react';
import { FaCoins, FaChartLine, FaBolt, FaUsers, FaArrowUp } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';

export default function EarningsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const res = await apiFetch('/api/earnings');
      setData(res);
    } catch (err) {
      console.error('Failed to load earnings:', err);
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

  const miningEarnings = data?.miningEarnings || [];
  const referralEarnings = data?.referralEarnings || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="mt-1 text-sm text-slate-400">Track all your earnings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-emerald-400">
            <FaCoins className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Total Earned</span>
          </div>
          <p className="mt-2 text-xl font-bold">${Number(data?.totalEarned || 0).toFixed(2)}</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-cmblue-400">
            <FaChartLine className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Platform Balance</span>
          </div>
          <p className="mt-2 text-xl font-bold">${Number(data?.platformBalance || 0).toFixed(2)}</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-purple-400">
            <FaBolt className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Mining Rewards</span>
          </div>
          <p className="mt-2 text-xl font-bold">{miningEarnings.length}</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-amber-400">
            <FaUsers className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Referral Rewards</span>
          </div>
          <p className="mt-2 text-xl font-bold">{referralEarnings.length}</p>
        </div>
      </div>

      {/* Mining Earnings */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-cmblue-300">Mining Earnings</h2>
          <p className="text-[10px] text-slate-500">Your mining rewards history</p>
        </div>

        {miningEarnings.length > 0 ? (
          <div className="space-y-2">
            {miningEarnings.map((earning: any) => (
              <div key={earning.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cmblue-500/20 text-cmblue-400">
                    <FaBolt className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold">Mining Reward</p>
                    <p className="text-[10px] text-slate-500">{new Date(earning.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-emerald-400">+${Number(earning.amount).toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">No mining earnings yet</p>
        )}
      </div>

      {/* Referral Earnings */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-cmblue-300">Referral Earnings</h2>
          <p className="text-[10px] text-slate-500">Commissions from your referrals</p>
        </div>

        {referralEarnings.length > 0 ? (
          <div className="space-y-2">
            {referralEarnings.map((earning: any) => (
              <div key={earning.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                    <FaUsers className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold">Referral Commission</p>
                    <p className="text-[10px] text-slate-500">{new Date(earning.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-400">+${Number(earning.amount).toFixed(2)}</p>
                  <span className="text-[10px] text-slate-500">Level {earning.level}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">No referral earnings yet</p>
        )}
      </div>
    </div>
  );
}