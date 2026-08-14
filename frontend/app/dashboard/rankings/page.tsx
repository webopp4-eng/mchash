'use client';

import { useEffect, useState } from 'react';
import { FaBolt, FaMedal, FaSyncAlt, FaTrophy, FaWallet } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';
import { shortenAddress } from '@/lib/wallet';

export default function RankingsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/rankings');
      setData(res);
    } catch (err: any) {
      console.error('Failed to load rankings:', err);
      setError(err.message || 'Failed to load rankings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankings();
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
        <button onClick={loadRankings} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-100">
          <FaSyncAlt className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const rankings = data?.rankings || [];
  const currentUserRank = data?.currentUserRank;

  return (
    <div className="mc-page">
      <section className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Analytics</p>
          <h1 className="mc-title">Mining Rankings</h1>
          <p className="mc-subtitle">Leaderboard ranked by mining hashrate and total earnings</p>
        </div>
        <button onClick={loadRankings} className="mc-button-secondary">
          <FaSyncAlt className="h-3.5 w-3.5" />
          Refresh
        </button>
      </section>

      {currentUserRank && (
        <section className="mc-card border-cmblue-200 bg-gradient-to-br from-cmblue-50/80 to-sky-50/80 ring-1 ring-cmblue-100">
          <div className="mb-2 text-xs font-bold uppercase text-cmblue-600">Your Ranking</div>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cmblue-600 to-cmblue-700 text-2xl font-black text-white shadow-[0_10px_24px_rgba(0,130,255,0.3)]">
                #{currentUserRank.rank}
              </span>
              <div>
                <p className="font-bold text-slate-950">{currentUserRank.username}</p>
                <p className="text-xs text-slate-500">{shortenAddress(currentUserRank.walletAddress, 6)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold text-slate-500 uppercase">TOTAL EARNED</p>
              <p className="text-2xl font-extrabold text-emerald-600">${Number(currentUserRank.totalEarned || 0).toFixed(2)}</p>
            </div>
          </div>
        </section>
      )}

      <section className="mc-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Top Miners</h2>
            <p className="text-xs text-slate-500">Ranked by total earnings and mining performance</p>
          </div>
          <div className="rounded-full bg-cmblue-50 px-3 py-1 text-sm font-bold text-cmblue-700">
            Top {rankings.length}
          </div>
        </div>
        {rankings.length > 0 ? (
          <div className="space-y-2">
            {rankings.map((entry: any) => (
              <div key={entry.id} className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${
                    entry.rank <= 3
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {entry.rank <= 3 ? <FaMedal className="h-4 w-4" /> : `#${entry.rank}`}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-950">{entry.username}</p>
                    <p className="text-[10px] text-slate-500">{shortenAddress(entry.walletAddress, 6)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-right sm:min-w-fit">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Earned</p>
                    <p className="text-sm font-extrabold text-emerald-600">${Number(entry.totalEarned || 0).toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Hashrate</p>
                    <p className="flex items-center justify-end gap-1 text-sm font-extrabold text-cmblue-600">
                      <FaBolt className="h-3 w-3" />
                      {Number(entry.hashRate || 0).toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Balance</p>
                    <p className="text-sm font-extrabold text-slate-950">${Number(entry.platformBalance || 0).toFixed(0)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <FaTrophy className="mx-auto h-10 w-10 text-cmblue-200" />
            <p className="mt-3 text-sm font-semibold text-slate-500">No ranking data yet</p>
          </div>
        )}
      </section>
    </div>
  );
}
