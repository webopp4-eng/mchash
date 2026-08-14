'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FaBolt, FaClock, FaChartLine, FaCalendarAlt, FaCheckCircle, FaWallet } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';

const DAY_MS = 24 * 60 * 60 * 1000;

function formatRemainingTime(ms: number) {
  const safeMs = Math.max(0, ms);
  const days = Math.floor(safeMs / DAY_MS);
  const hours = Math.floor((safeMs % DAY_MS) / (60 * 60 * 1000));
  const minutes = Math.floor((safeMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((safeMs % (60 * 1000)) / 1000);
  if (days > 0) return `${days}D ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function deriveLivePlan(activePlan: any, tick: number) {
  if (!activePlan) return null;
  const now = tick;
  const startedAt = new Date(activePlan.startedAt || activePlan.purchase?.startedAt).getTime();
  const endsAt = new Date(activePlan.endsAt || activePlan.purchase?.endsAt).getTime();
  const totalMs = Math.max(1, endsAt - startedAt);
  const elapsedMs = Math.min(totalMs, Math.max(0, now - startedAt));
  const remainingMs = Math.max(0, endsAt - now);
  const lastPayoutAt = new Date(activePlan.session?.lastPayoutAt || activePlan.startedAt || activePlan.purchase?.startedAt).getTime();
  const liveDeltaMs = Math.max(0, Math.min(now, endsAt) - lastPayoutAt);
  const liveEarned = Number(activePlan.earnedToDate || 0) + (Number(activePlan.dailyEarnings || 0) * liveDeltaMs) / DAY_MS;

  return {
    ...activePlan,
    progress: Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)),
    progressPercent: Math.round(Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100))),
    remainingMs,
    timeRemaining: formatRemainingTime(remainingMs),
    liveEarned,
    isExpired: remainingMs <= 0,
  };
}

export default function MinePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    loadMining();
    const clock = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(clock);
  }, []);

  const loadMining = async () => {
    try {
      const res = await apiFetch('/api/mining');
      setData(res);
    } catch (err) {
      console.error('Failed to load mining:', err);
    } finally {
      setLoading(false);
    }
  };

  const activePlan = useMemo(() => deriveLivePlan(data?.activePlan, tick), [data, tick]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  const progress = activePlan ? activePlan.progressPercent : 0;
  const stats = [
    { label: 'Current Hashrate', value: activePlan ? `${Number(activePlan.hashRate || 0).toFixed(2)} TH/s` : '0 TH/s', icon: FaBolt, color: 'bg-cmblue-50 text-cmblue-600' },
    { label: 'Daily Earnings', value: activePlan ? `$${Number(activePlan.dailyEarnings || 0).toFixed(2)}` : '$0.00', icon: FaWallet, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Efficiency', value: activePlan && !activePlan.isExpired ? '98.6%' : '0%', icon: FaChartLine, color: 'bg-sky-50 text-cmblue-700' },
    { label: 'Time Left', value: activePlan ? activePlan.timeRemaining : 'No session', icon: FaClock, color: 'bg-amber-50 text-amber-600' },
  ];

  const miningDetails = [
    { label: 'Mining Plan', value: activePlan ? activePlan.plan?.name || 'Active Plan' : 'No Active Plan', icon: FaBolt, badge: activePlan ? 'Active' : 'Idle', badgeColor: activePlan ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600' },
    { label: 'Paid Plan', value: activePlan ? `$${Number(activePlan.amount || 0).toFixed(2)}` : '$0.00', icon: FaWallet, badge: activePlan ? 'Paid' : 'None', badgeColor: 'bg-cmblue-50 text-cmblue-700' },
    { label: 'Status', value: activePlan && !activePlan.isExpired ? 'Mining in progress' : 'Not mining', icon: FaCheckCircle, badge: activePlan && !activePlan.isExpired ? 'Running' : 'Idle', badgeColor: activePlan && !activePlan.isExpired ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600' },
    { label: 'Start Time', value: activePlan ? new Date(activePlan.startedAt).toLocaleString() : 'No start time', icon: FaCalendarAlt, badge: '-', badgeColor: 'bg-slate-100 text-slate-600' },
    { label: 'End Time', value: activePlan ? new Date(activePlan.endsAt).toLocaleString() : 'No end time', icon: FaCalendarAlt, badge: '-', badgeColor: 'bg-slate-100 text-slate-600' },
    { label: 'Total Earnings', value: `$${Number(data?.user?.totalEarned || 0).toFixed(2)}`, icon: FaChartLine, badge: '+', badgeColor: 'bg-emerald-50 text-emerald-700' },
  ];

  return (
    <div className="mc-page">
      <section className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Mining Center</p>
          <h1 className="mc-title">MC HASH Mine</h1>
          <p className="mc-subtitle">Track hashrate, rewards, efficiency, and active plan progress.</p>
        </div>
        <span className={`mc-status ${activePlan && !activePlan.isExpired ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
          {activePlan && !activePlan.isExpired ? 'Status: Active' : 'Status: Inactive'}
        </span>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="mc-card flex flex-col items-center justify-center text-center">
          <div className="grid h-48 w-48 place-items-center rounded-full" style={{ background: `conic-gradient(#008cff ${progress}%, #e3f3ff 0)` }}>
            <div className="grid h-36 w-36 place-items-center rounded-full bg-white shadow-inner">
              <div>
                <p className="text-4xl font-extrabold text-slate-950">{activePlan ? Number(activePlan.hashRate || 0).toFixed(2) : '0.00'}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">TH/s</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm font-bold text-cmblue-600">{progress}% mining progress</p>
          {!activePlan && (
            <Link href="/dashboard/plans" className="mc-button mt-4 w-full max-w-xs">
              Upgrade Plan
            </Link>
          )}
        </section>

        <section className="mc-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">Mining Performance</h2>
              <p className="text-xs text-slate-500">Live contract and reward performance</p>
            </div>
            <Link href="/dashboard/plans" className="mc-button-secondary min-h-8 px-3 py-1">
              View plans
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
                <span className={`mc-stat-icon ${item.color}`}>
                  <item.icon className="h-4 w-4" />
                </span>
                <p className="mt-3 text-[10px] font-bold uppercase text-slate-500">{item.label}</p>
                <p className="mt-1 text-sm font-extrabold text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 h-36 rounded-2xl border border-sky-100 bg-white/80 p-4">
            <div className="flex h-full items-end gap-2">
              {[36, 52, 44, 66, 58, 82, 74, 92, 76, 88].map((height, index) => (
                <div key={index} className="flex-1 rounded-t-xl bg-gradient-to-t from-cmblue-500 to-sky-300" style={{ height: `${activePlan ? height : 12}%` }} />
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="mc-card">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-950">Mining Details</h2>
          <p className="text-xs text-slate-500">Complete contract information</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {miningDetails.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
              <div className="flex items-center gap-3">
                <span className="mc-stat-icon bg-white text-cmblue-600">
                  <item.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">{item.label}</p>
                  <p className="mt-1 text-xs font-bold text-slate-950">{item.value}</p>
                </div>
              </div>
              <span className={`mc-status ${item.badgeColor}`}>{item.badge}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
