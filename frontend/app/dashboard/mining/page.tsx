'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FaBolt, FaClock, FaCoins, FaChartLine, FaCalendarAlt, FaCheckCircle } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';

const DAY_MS = 24 * 60 * 60 * 1000;

function formatRemainingTime(ms: number) {
  const safeMs = Math.max(0, ms);
  const days = Math.floor(safeMs / DAY_MS);
  const hours = Math.floor((safeMs % DAY_MS) / (60 * 60 * 1000));
  const minutes = Math.floor((safeMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((safeMs % (60 * 1000)) / 1000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
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

export default function MiningPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(Date.now());

  const loadMining = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await apiFetch('/api/mining');
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load mining');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMining(true);
    const poll = setInterval(() => loadMining(false), 5000);
    const clock = setInterval(() => setTick(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, []);

  const activePlan = useMemo(() => deriveLivePlan(data?.activePlan, tick), [data, tick]);
  const history = data?.history || [];
  const sessions = data?.sessions || [];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mining</h1>
        <p className="mt-1 text-sm text-slate-500">Monitor your active mining package in real time</p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {/* Main Mining Card - White */}
      <div className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-card">
        <div className="flex flex-col items-center gap-4">
          <div className={`relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-cmblue-500 to-cmblue-300 ${activePlan && !activePlan.isExpired ? 'mining-glow' : 'shadow-[0_0_40px_rgba(17,120,250,0.3)]'}`}>
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/40 spin-slow" />
            {activePlan && !activePlan.isExpired && <div className="absolute inset-4 rounded-full border border-white/50 bg-white/20 pulse-ring" />}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cmblue-200 spin-reverse" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
              <div className="text-center">
                <p className="text-2xl font-bold">{activePlan ? Number(activePlan.hashRate || 0).toFixed(2) : '0.00'}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">TH/s</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${activePlan ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${activePlan ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {activePlan ? 'Mining Active' : 'Mining Inactive'}
            </span>
            {activePlan && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cmblue-50 px-3 py-1.5 text-xs font-semibold text-cmblue-700">
                <FaBolt className="h-3 w-3" />
                {activePlan.plan.name}
              </span>
            )}
          </div>
        </div>

        {activePlan ? (
          <div className="mt-6 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-cmblue-600">
                  <FaBolt className="h-3.5 w-3.5" />
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Hash Power</p>
                </div>
                <p className="mt-1 text-lg font-bold text-slate-900">{Number(activePlan.hashRate || 0).toFixed(2)} TH/s</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-emerald-600">
                  <FaCoins className="h-3.5 w-3.5" />
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Daily Earnings</p>
                </div>
                <p className="mt-1 text-lg font-bold text-emerald-600">${Number(activePlan.dailyEarnings || 0).toFixed(4)}</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-purple-600">
                  <FaChartLine className="h-3.5 w-3.5" />
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Mined So Far</p>
                </div>
                <p className="mt-1 text-lg font-bold text-slate-900">${Number(activePlan.liveEarned || 0).toFixed(6)}</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-amber-600">
                  <FaClock className="h-3.5 w-3.5" />
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Time Left</p>
                </div>
                <p className="mt-1 text-lg font-bold text-slate-900">{activePlan.timeRemaining}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Mining Progress</p>
                <p className="text-xs font-semibold text-cmblue-600">{activePlan.progressPercent}%</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-cmblue-500 to-emerald-400 transition-all duration-500" style={{ width: `${activePlan.progress}%` }} />
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
                <p><FaCalendarAlt className="mr-1 inline h-3 w-3 text-cmblue-500" />Started {new Date(activePlan.startedAt).toLocaleString()}</p>
                <p><FaCheckCircle className="mr-1 inline h-3 w-3 text-emerald-500" />Ends {new Date(activePlan.endsAt).toLocaleString()}</p>
                <p>Expected total ${Number(activePlan.totalEarnings || 0).toFixed(4)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-500">No active mining package</p>
            <Link href="/dashboard/plans" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-cmblue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cmblue-500">
              <FaBolt className="h-3.5 w-3.5" />
              Buy Mining Time
            </Link>
          </div>
        )}
      </div>

      {/* Mining Sessions - White */}
      <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Mining Sessions</h2>
          <p className="text-[10px] text-slate-500">Live and completed simulator sessions</p>
        </div>
        {sessions.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {sessions.map((session: any) => (
              <div key={session.id} className="rounded-xl border border-slate-200/80 bg-slate-50 p-4">
                <p className={`text-xs font-semibold capitalize ${session.status === 'active' ? 'text-emerald-600' : 'text-slate-500'}`}>{session.status}</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{Number(session.hashRate || 0).toFixed(2)} TH/s</p>
                <p className="mt-1 text-[10px] text-slate-500">Total mined: ${Number(session.totalMined || 0).toFixed(6)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">No mining sessions yet</p>
        )}
      </div>

      {/* Mining History - White */}
      <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Mining History</h2>
          <p className="text-[10px] text-slate-500">Your purchased mining contracts</p>
        </div>

        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cmblue-50 text-cmblue-600">
                    <FaBolt className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{item.plan.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(item.startedAt).toLocaleDateString()} - {new Date(item.endsAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-900">${Number(item.amount).toFixed(2)}</p>
                  <span className={`text-[10px] font-medium ${item.status === 'active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">No mining history yet</p>
        )}
      </div>
    </div>
  );
}