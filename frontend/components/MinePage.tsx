'use client';

/**
 * MINING PAGE — consumes the SAME unified mining store and component as Home.
 * No separate mining state, timers, or calculations exist here; everything is
 * derived from lib/miningData.ts (single source of truth).
 */

import Link from 'next/link';
import { FaBolt, FaChartLine, FaClock, FaCoins, FaWallet } from 'react-icons/fa';
import MiningPools from './MiningPools';
import { useMiningPools, sumHashRate, totalLiveEarned } from '@/lib/miningData';

export default function MinePage() {
  const { pools } = useMiningPools();

  // Aggregates computed from the SAME pool list Home uses — always identical.
  const totalHashRate = sumHashRate(pools);
  const totalEarned = totalLiveEarned(pools);
  const activeCount = pools.filter((p) => p.status === 'active').length;

  const stats = [
    {
      label: 'Total Hashrate',
      value: `${totalHashRate.toFixed(2)} TH/s`,
      icon: FaBolt,
      color: 'bg-cmblue-50 text-cmblue-600',
    },
    {
      label: 'Live Earnings',
      value: totalEarned.toFixed(6),
      icon: FaCoins,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Active Pools',
      value: `${activeCount} / ${pools.length}`,
      icon: FaChartLine,
      color: 'bg-sky-50 text-cmblue-700',
    },
    {
      label: 'Daily Rate',
      value: `$${pools.reduce((s, p) => s + p.dailyEarnings, 0).toFixed(4)}`,
      icon: FaWallet,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="mc-page space-y-3 sm:space-y-5">
      {/* Unified multi-mining display — identical to Home */}
      <MiningPools
        title="My Mining Pools"
        subtitle="Purchase a plan to start earning — live progress and earnings"
      />

      {/* Aggregated performance strip — same data source */}
      <section className="mc-card">
        <div className="mb-3 sm:mb-4">
          <h2 className="text-base font-bold text-slate-950">Mining Performance</h2>
          <p className="text-[10px] sm:text-xs text-slate-500">Aggregated across all your active pools</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className={`rounded-2xl border border-sky-100 bg-sky-50/50 p-2.5 sm:p-3 transition-all ${
              item.label === 'Total Hashrate' && activeCount > 0 ? 'animate-mining-glow' : ''
            }`}>
              <span className={`mc-stat-icon ${item.color} ${
                item.label === 'Total Hashrate' && activeCount > 0 ? 'animate-pulse-glow' : ''
              }`}>
                <item.icon className="h-4 w-4" />
              </span>
              <p className="mt-2 sm:mt-3 text-[8px] sm:text-[10px] font-bold uppercase text-slate-500">{item.label}</p>
              <p className="mt-1 truncate text-xs sm:text-sm font-extrabold text-slate-950">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Per-pool details — same records shown in the cards above */}
      {pools.length > 0 && (
        <section className="mc-card">
          <div className="mb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-950">Pool Details</h2>
            <p className="text-[10px] sm:text-xs text-slate-500">Complete contract information for every pool</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {pools.map((pool) => (
              <div key={pool.id} className="flex flex-col gap-1 rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-bold text-slate-950">{pool.name}</p>
                  <span className={`mc-status shrink-0 ${
                    pool.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {pool.status === 'active' ? 'Running' : 'Ended'}
                  </span>
                </div>
                <div className="mt-1 space-y-1 text-[10px] font-semibold text-slate-500">
                  <p className="flex items-center justify-between gap-2">
                    <span>Rewards credit to</span>
                    <span className="font-bold text-cmblue-700">{pool.rewardAsset}</span>
                  </p>
                  <p className="flex items-center justify-between gap-2">
                    <span>Start</span>
                    <span className="font-bold text-slate-950">{new Date(pool.startedAt).toLocaleString()}</span>
                  </p>
                  <p className="flex items-center justify-between gap-2">
                    <FaClock className="h-2.5 w-2.5" />
                    <span className="font-bold text-slate-950">{pool.timeRemaining}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {pools.length === 0 && (
        <section className="mc-card text-center">
          <p className="text-sm font-semibold text-slate-500">No active mining pools yet</p>
          <Link href="/dashboard/plans" className="mc-button mx-auto mt-3 w-fit px-5">
            Browse Mining Plans
          </Link>
        </section>
      )}
    </div>
  );
}