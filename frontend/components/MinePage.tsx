'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FaBolt, FaClock, FaChartLine, FaCoins, FaCalendarAlt, FaCheckCircle, FaLink, FaGift, FaWallet } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';

const DAY_MS = 24 * 60 * 60 * 1000;

function formatRemainingTime(ms: number) {
  const safeMs = Math.max(0, ms);
  const days = Math.floor(safeMs / DAY_MS);
  const hours = Math.floor((safeMs % DAY_MS) / (60 * 60 * 1000));
  const minutes = Math.floor((safeMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((safeMs % (60 * 1000)) / 1000);
  if (days > 0) return `${days}D ${hours}h ${minutes}m ${seconds}s`;
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

  const stats = [
    { label: 'Hash Rate', value: activePlan ? `${Number(activePlan.hashRate || 0).toFixed(2)} TH/s` : '0 TH/s', icon: FaBolt },
    { label: 'Daily Earnings', value: activePlan ? `$${Number(activePlan.dailyEarnings || 0).toFixed(2)}` : '$0.00', icon: FaBolt },
    { label: 'Total Earned', value: activePlan ? `$${Number(activePlan.liveEarned || 0).toFixed(2)}` : '$0.00', icon: FaChartLine },
  ];

  const miningDetails = [
    { label: 'Mining Plan', value: activePlan ? activePlan.plan?.name || 'Active' : 'No Plan', icon: FaBolt, badge: activePlan ? 'Active' : '—', badgeColor: activePlan ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600' },
    { label: 'Paid Plan', value: activePlan ? `$${Number(activePlan.amount || 0).toFixed(2)}` : '$0.00', icon: FaWallet, badge: activePlan ? 'Paid' : '—', badgeColor: activePlan ? 'bg-cmblue-50 text-cmblue-700' : 'bg-slate-100 text-slate-600' },
    { label: 'Status', value: activePlan && !activePlan.isExpired ? 'Mining in progress' : 'Not mining', icon: FaCheckCircle, badge: activePlan && !activePlan.isExpired ? 'Running' : 'Idle', badgeColor: activePlan && !activePlan.isExpired ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600' },
    { label: 'Hash Rate', value: activePlan ? `${Number(activePlan.hashRate || 0).toFixed(2)} TH/s` : '0 TH/s', icon: FaBolt, badge: activePlan ? 'Optimal' : '—', badgeColor: activePlan ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600' },
    { label: 'Start Time', value: activePlan ? new Date(activePlan.startedAt).toLocaleString() : '—', icon: FaCalendarAlt, badge: '-', badgeColor: 'bg-slate-100 text-slate-600' },
    { label: 'End Time', value: activePlan ? new Date(activePlan.endsAt).toLocaleString() : '—', icon: FaCalendarAlt, badge: '-', badgeColor: 'bg-slate-100 text-slate-600' },
    { label: 'Live Countdown', value: activePlan ? activePlan.timeRemaining : '—', icon: FaClock, badge: activePlan ? `${activePlan.progressPercent}%` : '-', badgeColor: activePlan ? 'bg-cmblue-50 text-cmblue-700' : 'bg-slate-100 text-slate-600' },
    { label: 'Daily Earnings', value: activePlan ? `$${Number(activePlan.dailyEarnings || 0).toFixed(2)} / day` : '$0.00', icon: FaBolt, badge: '+', badgeColor: 'bg-emerald-50 text-emerald-700' },
    { label: 'Total Earnings', value: `$${Number(data?.user?.totalEarned || 0).toFixed(2)}`, icon: FaChartLine, badge: '+', badgeColor: 'bg-emerald-50 text-emerald-700' },
  ];

  return (
    <div className="min-h-screen px-4 pb-28 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Mobile View - Matches mine.png */}
        <section className="mobile-only glass-card mb-4 p-4">
          <div className="flex flex-col gap-3 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-cmblue-600">Mining Dashboard</p>
              <h1 className="mt-1 text-base font-semibold text-slate-900">CM HASH Mine</h1>
            </div>
            <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-cmblue-500 to-cmblue-300 shadow-[0_0_40px_rgba(17,120,250,0.35)]">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/40 spin-slow" />
              <div className="absolute inset-4 rounded-full border border-white/50 bg-white/20 pulse-ring" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cmblue-200 spin-reverse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                <div>
                  <p className="text-xl font-semibold">{activePlan ? Number(activePlan.hashRate || 0).toFixed(2) : '0.00'}</p>
                  <p className="text-[9px] uppercase tracking-[0.22em] text-slate-500">TH/s</p>
                </div>
              </div>
            </div>
            <span className="inline-flex items-center justify-center rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-cmblue-700 shadow-card">
              Status: {activePlan && !activePlan.isExpired ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="mt-4 grid gap-2">
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Mining Plan</p>
                <span className="rounded-full bg-cmblue-50 px-2.5 py-0.5 text-[10px] font-semibold text-cmblue-700">
                  {activePlan ? 'Active' : 'No Plan'}
                </span>
              </div>
              <p className="mt-1.5 text-lg font-semibold text-slate-900">
                {activePlan ? activePlan.plan?.name || 'Active Plan' : 'No Active Plan'}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {stats.map((item) => (
                <div key={item.label} className="rounded-[18px] border border-slate-200 bg-slate-50 p-2.5 shadow-card">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Time Remaining</p>
                <p className="text-[10px] font-semibold text-slate-900">{activePlan ? `${activePlan.progressPercent}%` : '—'}</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cmblue-600 to-cmblue-400"
                  style={{ width: `${activePlan ? activePlan.progress : 0}%` }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-slate-500">
                {activePlan ? `${activePlan.timeRemaining} remaining` : 'No active session'}
              </p>
            </div>
            {!activePlan && (
              <Link
                href="/dashboard/plans"
                className="mt-1 rounded-2xl bg-cmblue-600 px-3 py-2.5 text-center text-[11px] font-semibold text-white shadow-blue-glow transition hover:bg-cmblue-700"
              >
                Buy Mining Plan
              </Link>
            )}
          </div>
        </section>

        {/* Desktop View */}
        <section className="desktop-only hidden glass-card p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-cmblue-600">Mining Dashboard</p>
              <h1 className="mt-1 text-lg font-semibold text-slate-900">CM HASH Mine</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {activePlan && !activePlan.isExpired ? 'Active' : 'Inactive'}
              </span>
              {activePlan && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cmblue-50 px-3 py-1.5 text-[11px] font-semibold text-cmblue-700 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-cmblue-500" />
                  {activePlan.plan?.name || 'Plan'}
                </span>
              )}
            </div>
          </div>

          <div className="mb-5 flex items-center justify-center">
            <div className="relative flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-br from-cmblue-500 to-cmblue-300 shadow-[0_0_48px_rgba(17,120,250,0.35)]">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/40 spin-slow" />
              <div className="absolute inset-4 rounded-full border border-white/50 bg-white/20 pulse-ring" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cmblue-200 spin-reverse" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                <div className="text-center">
                  <p className="text-2xl font-semibold">{activePlan ? Number(activePlan.hashRate || 0).toFixed(2) : '0.00'}</p>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">TH/s</p>
                </div>
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-cmblue-700 shadow-sm">
                Status: {activePlan && !activePlan.isExpired ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>

          <div className="mb-5 grid gap-2 rounded-[24px] border border-slate-200 bg-slate-50 p-4 lg:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-[18px] bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cmblue-50 text-cmblue-600">
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                    <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                  </div>
                </div>
                <span className="rounded-full bg-cmblue-50 px-2.5 py-0.5 text-[10px] font-semibold text-cmblue-700">Live</span>
              </div>
            ))}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-cmblue-50 text-cmblue-600">
                  <FaBolt className="h-3.5 w-3.5" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Mining Details</h2>
                  <p className="text-[10px] text-slate-500">Complete contract information</p>
                </div>
              </div>
              <Link href="/dashboard/plans" className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-900 shadow-sm transition hover:bg-slate-50">
                View Plans
              </Link>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {miningDetails.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-slate-50 p-3 transition hover:border-cmblue-200 hover:bg-cmblue-50/40">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-cmblue-600 shadow-sm">
                      <item.icon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-900">{item.value}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}