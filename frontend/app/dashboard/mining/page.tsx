'use client';

import { useEffect, useState } from 'react';
import { FaBolt, FaClock, FaCoins, FaChartLine, FaCalendarAlt, FaCheckCircle, FaLink, FaGift, FaWallet } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';

export default function MiningPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMining();
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  const activePlan = data?.activePlan;
  const history = data?.history || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mining</h1>
        <p className="mt-1 text-sm text-slate-400">Monitor your mining operations</p>
      </div>

      {/* Mining Status */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-4">
          {/* Progress Circle */}
          <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-cmblue-500 to-cmblue-300 shadow-[0_0_40px_rgba(14,161,255,0.3)]">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/40 spin-slow" />
            <div className="absolute inset-4 rounded-full border border-white/50 bg-white/20 pulse-ring" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cmblue-200 spin-reverse" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
              <div className="text-center">
                <p className="text-2xl font-bold">{activePlan ? activePlan.plan.hashRate : '0'}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">TH/s</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {activePlan ? 'Mining Active' : 'Mining Inactive'}
            </span>
            {activePlan && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cmblue-500/20 px-3 py-1.5 text-xs font-semibold text-cmblue-300">
                <FaBolt className="h-3 w-3" />
                {activePlan.plan.name}
              </span>
            )}
          </div>
        </div>

        {activePlan && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 text-cmblue-400">
                <FaBolt className="h-3.5 w-3.5" />
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Hash Power</p>
              </div>
              <p className="mt-1 text-lg font-bold">{activePlan.plan.hashRate} TH/s</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <FaCoins className="h-3.5 w-3.5" />
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Daily Earnings</p>
              </div>
              <p className="mt-1 text-lg font-bold text-emerald-400">${activePlan.dailyEarnings.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 text-purple-400">
                <FaChartLine className="h-3.5 w-3.5" />
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Est. Total</p>
              </div>
              <p className="mt-1 text-lg font-bold">${activePlan.totalEarnings.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 text-amber-400">
                <FaClock className="h-3.5 w-3.5" />
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Time Left</p>
              </div>
              <p className="mt-1 text-lg font-bold">{activePlan.timeRemaining}</p>
            </div>
          </div>
        )}
      </div>

      {/* Mining History */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-cmblue-300">Mining History</h2>
          <p className="text-[10px] text-slate-500">Your mining contracts</p>
        </div>

        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cmblue-500/20 text-cmblue-400">
                    <FaBolt className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold">{item.plan.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(item.startedAt).toLocaleDateString()} - {new Date(item.endsAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold">${Number(item.amount).toFixed(2)}</p>
                  <span className={`text-[10px] font-medium ${item.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
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