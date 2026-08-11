'use client';

import { useEffect, useState } from 'react';
import { FaUsers, FaCopy, FaLink, FaCoins, FaUserPlus } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';

export default function ReferralsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    try {
      const res = await apiFetch('/api/referrals');
      setData(res);
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  const referredUsers = data?.referredUsers || [];
  const earnings = data?.earnings || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Referrals</h1>
        <p className="mt-1 text-sm text-slate-400">Invite friends and earn commissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-cmblue-400">
            <FaUsers className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Total Referrals</span>
          </div>
          <p className="mt-2 text-xl font-bold">{data?.totalReferrals || 0}</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-emerald-400">
            <FaUserPlus className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Active</span>
          </div>
          <p className="mt-2 text-xl font-bold">{data?.activeReferrals || 0}</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-amber-400">
            <FaCoins className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Earned</span>
          </div>
          <p className="mt-2 text-xl font-bold">${Number(data?.totalEarned || 0).toFixed(2)}</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-purple-400">
            <FaLink className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Code</span>
          </div>
          <p className="mt-2 text-xl font-bold">{data?.referralCode || 'N/A'}</p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <h2 className="text-sm font-semibold text-cmblue-300">Your Referral Link</h2>
        <p className="mt-1 text-[10px] text-slate-500">Share this link to earn commissions</p>
        <div className="mt-3 flex gap-2">
          <input
            readOnly
            value={data?.referralLink || ''}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 outline-none focus:border-cmblue-500/50"
          />
          <button
            onClick={copyLink}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-cmblue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cmblue-500"
          >
            <FaCopy className="h-3.5 w-3.5" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Referred Users */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-cmblue-300">Referred Users</h2>
          <p className="text-[10px] text-slate-500">Users who joined through your link</p>
        </div>

        {referredUsers.length > 0 ? (
          <div className="space-y-2">
            {referredUsers.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cmblue-500/20 text-cmblue-400">
                    <FaUsers className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold">{user.username}</p>
                    <p className="text-[10px] text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-medium ${user.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {user.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">No referrals yet</p>
        )}
      </div>

      {/* Referral Earnings */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-cmblue-300">Referral History</h2>
          <p className="text-[10px] text-slate-500">Your commission earnings</p>
        </div>

        {earnings.length > 0 ? (
          <div className="space-y-2">
            {earnings.map((earning: any) => (
              <div key={earning.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                    <FaCoins className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold capitalize">{earning.sourceType} Commission</p>
                    <p className="text-[10px] text-slate-500">{new Date(earning.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-emerald-400">+${Number(earning.amount).toFixed(2)}</p>
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