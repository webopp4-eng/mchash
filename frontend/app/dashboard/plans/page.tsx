'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaBolt, FaCheck, FaWallet, FaClock, FaGift, FaUsers, FaCube } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';
import { getUser } from '@/lib/auth';

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [hashRentingPlans, setHashRentingPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/plans');
      setPlans(res.plans || []);
      setHashRentingPlans(res.hashRentingPlans || []);
    } catch (err: any) {
      console.error('[Plans] Failed to load plans:', err);
      setError(err.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (plan: any) => {
    setPurchasing(plan.id);
    setError(null);
    setSuccess(null);

    try {
      const user = getUser();
      if (!user) throw new Error('Please connect your wallet first');

      const res = await apiFetch(`/api/plans/${plan.id}/purchase`, {
        method: 'POST',
        body: JSON.stringify({
          chain: user.chain,
        }),
      });

      if (res.platformBalance !== undefined) {
        const updatedUser = { ...user, platformBalance: res.platformBalance };
        localStorage.setItem('cmhash_user', JSON.stringify(updatedUser));
      }

      setSuccess(`${plan.name} plan activated successfully. Mining has started.`);
      setTimeout(() => router.push('/dashboard/mining'), 800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPurchasing(null);
    }
  };

  const handleHashRent = async (plan: any) => {
    setPurchasing(plan.id);
    setError(null);
    setSuccess(null);

    try {
      const user = getUser();
      if (!user) throw new Error('Please connect your wallet first');

      const res = await apiFetch(`/api/hash-renting/${plan.id}/purchase`, {
        method: 'POST',
        body: JSON.stringify({
          chain: user.chain,
        }),
      });

      if (res.platformBalance !== undefined) {
        const updatedUser = { ...user, platformBalance: res.platformBalance };
        localStorage.setItem('cmhash_user', JSON.stringify(updatedUser));
      }

      setSuccess(`${plan.name} hash renting activated. Mining has started.`);
      setTimeout(() => router.push('/dashboard/mining'), 800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPurchasing(null);
    }
  };

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
        <h1 className="text-2xl font-bold text-slate-900">Mining Plans</h1>
        <p className="mt-1 text-sm text-slate-500">Choose a plan and start mining instantly</p>
      </div>

      {error && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          <p>{error}</p>
          <button
            onClick={loadPlans}
            className="rounded-lg bg-rose-100 px-4 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-200"
          >
            Retry
          </button>
        </div>
      )}

      {!error && plans.length === 0 && hashRentingPlans.length === 0 && (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center shadow-card">
          <p className="text-sm text-slate-500">No mining plans available yet</p>
          <p className="mt-1 text-xs text-slate-400">Please check back later or contact support.</p>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-card transition-all hover:border-cmblue-300 hover:shadow-card-hover"
          >
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cmblue-50 text-cmblue-600">
                  <FaBolt className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{plan.description}</p>
            </div>

            <div className="mb-4">
              <p className="text-3xl font-bold text-slate-900">${Number(plan.price).toFixed(2)}</p>
              <p className="text-[10px] text-slate-500">{plan.currency}</p>
            </div>

            <div className="mb-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <FaBolt className="h-3 w-3 text-cmblue-500" />
                <span>{plan.hashRate} TH/s hash power</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <FaClock className="h-3 w-3 text-cmblue-500" />
                <span>{plan.durationDays} days duration</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <FaWallet className="h-3 w-3 text-cmblue-500" />
                <span>${(Number(plan.dailyRate) * 100).toFixed(1)}% daily rate</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <FaGift className="h-3 w-3 text-cmblue-500" />
                <span>${Number(plan.bonusReward).toFixed(2)} bonus reward</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <FaUsers className="h-3 w-3 text-cmblue-500" />
                <span>{plan.referralBonus}% referral commission</span>
              </div>
            </div>

            <button
              onClick={() => handlePurchase(plan)}
              disabled={purchasing === plan.id}
              className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cmblue-600 to-cmblue-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-blue-glow disabled:cursor-not-allowed disabled:opacity-50"
            >
              {purchasing === plan.id ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Processing...
                </>
              ) : (
                <>
                  <FaWallet className="h-4 w-4" />
                  Buy Plan
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Hash Renting Section */}
      {hashRentingPlans.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <FaCube className="h-5 w-5 text-cmblue-500" />
            <h2 className="text-xl font-bold text-slate-900">Hash Renting</h2>
          </div>
          <p className="mb-4 text-sm text-slate-500">Rent hash power and earn yields directly to your wallet.</p>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {hashRentingPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-col rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-card transition-all hover:border-cmblue-300 hover:shadow-card-hover"
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      <FaCube className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{plan.description}</p>
                </div>

                <div className="mb-4">
                  <p className="text-3xl font-bold text-slate-900">${Number(plan.price).toFixed(2)}</p>
                  <p className="text-[10px] text-slate-500">{plan.currency}</p>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <FaBolt className="h-3 w-3 text-cmblue-500" />
                    <span>{Number(plan.hashPower).toFixed(2)} TH/s hash power</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <FaClock className="h-3 w-3 text-cmblue-500" />
                    <span>{plan.durationDays} days duration</span>
                  </div>
                  {plan.expectedYield && Number(plan.expectedYield) > 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <FaGift className="h-3 w-3 text-cmblue-500" />
                      <span>{Number(plan.expectedYield).toFixed(1)}% expected yield</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleHashRent(plan)}
                  disabled={purchasing === plan.id}
                  className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-[0_10px_30px_rgba(147,51,234,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {purchasing === plan.id ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaWallet className="h-4 w-4" />
                      Rent Hash
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}