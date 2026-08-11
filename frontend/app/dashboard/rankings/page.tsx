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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rankings</h1>
          <p className="mt-1 text-sm text-slate-400">Leaderboard ranked by mining activity and rewards</p>
        </div>
        <button onClick={loadRankings} className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10">
          <FaSyncAlt className="h-4 w-4" />
        </button>
      </div>

      {currentUserRank && (
        <div className="rounded-[24px] border border-cmblue-500/30 bg-cmblue-500/10 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cmblue-300">Your Rank</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cmblue-500/20 text-xl font-black text-cmblue-200">#{currentUserRank.rank}</span>
              <div>
                <p className="font-semibold">{currentUserRank.username}</p>
                <p className="text-xs text-slate-400">{shortenAddress(currentUserRank.walletAddress, 6)}</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-emerald-300">${Number(currentUserRank.totalEarned || 0).toFixed(2)} earned</p>
          </div>
        </div>
      )}

      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <FaTrophy className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-cmblue-300">Leaderboard</h2>
        </div>
        {rankings.length > 0 ? (
          <div className="space-y-2">
            {rankings.map((entry: any) => (
              <div key={entry.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl font-black ${entry.rank <= 3 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-300'}`}>
                    {entry.rank <= 3 ? <FaMedal className="h-4 w-4" /> : `#${entry.rank}`}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{entry.username}</p>
                    <p className="text-[10px] text-slate-500">{shortenAddress(entry.walletAddress, 6)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-right text-xs sm:min-w-80">
                  <div>
                    <p className="text-slate-500">Earned</p>
                    <p className="font-semibold text-emerald-400">${Number(entry.totalEarned || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Hash</p>
                    <p className="font-semibold"><FaBolt className="mr-1 inline h-3 w-3 text-cmblue-400" />{Number(entry.hashRate || 0).toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Balance</p>
                    <p className="font-semibold"><FaWallet className="mr-1 inline h-3 w-3 text-purple-400" />${Number(entry.platformBalance || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">No ranking data yet</p>
        )}
      </div>
    </div>
  );
}
