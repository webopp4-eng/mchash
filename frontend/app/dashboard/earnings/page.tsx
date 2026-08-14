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
    <div className="mc-page">
      <section className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Rewards & Activity</p>
          <h1 className="mc-title">Your Earnings</h1>
          <p className="mc-subtitle">Track mining rewards, referral commissions, and activity history</p>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <section className="mc-card">
          <span className="mc-stat-icon bg-emerald-50 text-emerald-600">
            <FaCoins className="h-4 w-4" />
          </span>
          <p className="mt-3 text-[10px] font-bold uppercase text-slate-500">Total Earned</p>
          <p className="mt-1 text-xl font-extrabold text-slate-950">${Number(data?.totalEarned || 0).toFixed(2)}</p>
        </section>
        <section className="mc-card">
          <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
            <FaChartLine className="h-4 w-4" />
          </span>
          <p className="mt-3 text-[10px] font-bold uppercase text-slate-500">Platform Balance</p>
          <p className="mt-1 text-xl font-extrabold text-slate-950">${Number(data?.platformBalance || 0).toFixed(2)}</p>
        </section>
        <section className="mc-card">
          <span className="mc-stat-icon bg-purple-50 text-purple-600">
            <FaBolt className="h-4 w-4" />
          </span>
          <p className="mt-3 text-[10px] font-bold uppercase text-slate-500">Mining Rewards</p>
          <p className="mt-1 text-xl font-extrabold text-slate-950">{miningEarnings.length}</p>
        </section>
        <section className="mc-card">
          <span className="mc-stat-icon bg-amber-50 text-amber-600">
            <FaUsers className="h-4 w-4" />
          </span>
          <p className="mt-3 text-[10px] font-bold uppercase text-slate-500">Referral Rewards</p>
          <p className="mt-1 text-xl font-extrabold text-slate-950">{referralEarnings.length}</p>
        </section>
      </div>

      {/* Mining Earnings */}
      <section className="mc-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Mining Earnings</h2>
            <p className="text-xs text-slate-500">Your mining rewards history</p>
          </div>
          <div className="rounded-full bg-purple-50 px-3 py-1 text-sm font-bold text-purple-700">
            {miningEarnings.length}
          </div>
        </div>

        {miningEarnings.length > 0 ? (
          <div className="space-y-2">
            {miningEarnings.map((earning: any) => (
              <div key={earning.id} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
                <div className="flex items-center gap-3">
                  <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
                    <FaBolt className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-950">Mining Reward</p>
                    <p className="text-[10px] text-slate-500">{new Date(earning.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-sm font-extrabold text-emerald-600">+${Number(earning.amount).toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <FaBolt className="mx-auto h-10 w-10 text-cmblue-200" />
            <p className="mt-3 text-sm font-semibold text-slate-500">No mining earnings yet</p>
            <p className="text-xs text-slate-400">Start a mining plan to earn rewards</p>
          </div>
        )}
      </section>

      {/* Referral Earnings */}
      <section className="mc-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Team Earnings</h2>
            <p className="text-xs text-slate-500">Commissions from your referrals</p>
          </div>
          <div className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">
            {referralEarnings.length}
          </div>
        </div>

        {referralEarnings.length > 0 ? (
          <div className="space-y-2">
            {referralEarnings.map((earning: any) => (
              <div key={earning.id} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
                <div className="flex items-center gap-3">
                  <span className="mc-stat-icon bg-amber-50 text-amber-600">
                    <FaUsers className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-950">Referral Commission</p>
                    <p className="text-[10px] text-slate-500">{new Date(earning.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-emerald-600">+${Number(earning.amount).toFixed(2)}</p>
                  <span className="text-[10px] text-slate-500">Level {earning.level}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <FaUsers className="mx-auto h-10 w-10 text-cmblue-200" />
            <p className="mt-3 text-sm font-semibold text-slate-500">No referral earnings yet</p>
            <p className="text-xs text-slate-400">Invite friends to start earning commissions</p>
          </div>
        )}
      </section>
    </div>
  );
}