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
    <div className="mc-page">
      <section className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Bubble Team</p>
          <h1 className="mc-title">Referral Program</h1>
          <p className="mc-subtitle">Invite friends and earn commissions on their mining activity</p>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <section className="mc-card">
          <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
            <FaUsers className="h-4 w-4" />
          </span>
          <p className="mt-3 text-[10px] font-bold uppercase text-slate-500">Total Referrals</p>
          <p className="mt-1 text-xl font-extrabold text-slate-950">{data?.totalReferrals || 0}</p>
        </section>
        <section className="mc-card">
          <span className="mc-stat-icon bg-emerald-50 text-emerald-600">
            <FaUserPlus className="h-4 w-4" />
          </span>
          <p className="mt-3 text-[10px] font-bold uppercase text-slate-500">Active</p>
          <p className="mt-1 text-xl font-extrabold text-slate-950">{data?.activeReferrals || 0}</p>
        </section>
        <section className="mc-card">
          <span className="mc-stat-icon bg-amber-50 text-amber-600">
            <FaCoins className="h-4 w-4" />
          </span>
          <p className="mt-3 text-[10px] font-bold uppercase text-slate-500">Total Earned</p>
          <p className="mt-1 text-xl font-extrabold text-slate-950">${Number(data?.totalEarned || 0).toFixed(2)}</p>
        </section>
        <section className="mc-card">
          <span className="mc-stat-icon bg-purple-50 text-purple-600">
            <FaLink className="h-4 w-4" />
          </span>
          <p className="mt-3 text-[10px] font-bold uppercase text-slate-500">Referral Code</p>
          <p className="mt-1 text-lg font-extrabold text-slate-950">{data?.referralCode || 'N/A'}</p>
        </section>
      </div>

      {/* Referral Link */}
      <section className="mc-card">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-950">Your Referral Link</h2>
          <p className="text-xs text-slate-500">Share this link to invite friends and earn commissions</p>
        </div>
        <div className="flex gap-2">
          <input
            readOnly
            value={data?.referralLink || ''}
            className="mc-input flex-1"
          />
          <button
            onClick={copyLink}
            className="mc-button min-w-max"
          >
            <FaCopy className="h-3.5 w-3.5" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </section>

      {/* Referred Users */}
      <section className="mc-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Team Members</h2>
            <p className="text-xs text-slate-500">Users who joined through your referral link</p>
          </div>
          <div className="rounded-full bg-cmblue-50 px-3 py-1 text-sm font-bold text-cmblue-700">
            {referredUsers.length}
          </div>
        </div>

        {referredUsers.length > 0 ? (
          <div className="space-y-2">
            {referredUsers.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
                <div className="flex items-center gap-3">
                  <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
                    <FaUsers className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-950">{user.username}</p>
                    <p className="text-[10px] text-slate-500">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`mc-status ${user.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {user.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <FaUsers className="mx-auto h-10 w-10 text-cmblue-200" />
            <p className="mt-3 text-sm font-semibold text-slate-500">No referrals yet</p>
            <p className="text-xs text-slate-400">Share your link to start earning</p>
          </div>
        )}
      </section>

      {/* Referral Earnings */}
      <section className="mc-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Commission History</h2>
            <p className="text-xs text-slate-500">Your team reward earnings</p>
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
            {earnings.length}
          </div>
        </div>

        {earnings.length > 0 ? (
          <div className="space-y-2">
            {earnings.map((earning: any) => (
              <div key={earning.id} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
                <div className="flex items-center gap-3">
                  <span className="mc-stat-icon bg-amber-50 text-amber-600">
                    <FaCoins className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-950">{earning.sourceType} Commission</p>
                    <p className="text-[10px] text-slate-500">{new Date(earning.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-sm font-extrabold text-emerald-600">+${Number(earning.amount).toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <FaCoins className="mx-auto h-10 w-10 text-cmblue-200" />
            <p className="mt-3 text-sm font-semibold text-slate-500">No earnings yet</p>
            <p className="text-xs text-slate-400">Invite friends to start earning commissions</p>
          </div>
        )}
      </section>
    </div>
  );
}