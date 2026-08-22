'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaBolt, FaCheck, FaWallet, FaClock, FaGift, FaUsers, FaCube, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { apiFetch, getUser } from '@/lib/auth';
import { refreshFinancialData } from '@/lib/financialData';
import { toastEmitter } from '@/components/NotificationToast';

const getVisiblePlanCount = () => {
  if (typeof window === 'undefined') return 4;
  if (window.innerWidth < 640) return 1;
  if (window.innerWidth < 1024) return 2;
  return 4;
};

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [hashRentingPlans, setHashRentingPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [visiblePlanCount, setVisiblePlanCount] = useState(4);
  const [planStartIndex, setPlanStartIndex] = useState(0);
  const [hashStartIndex, setHashStartIndex] = useState(0);

  useEffect(() => {
    loadPlans();

    // Live synchronization: silently re-fetch plans so any change made in the
    // admin panel (create / activate / deactivate / price / duration / hashrate)
    // appears here automatically without a manual reload.
    const interval = setInterval(() => loadPlans(true), 30000);
    const resync = () => {
      if (document.visibilityState === 'visible') loadPlans(true);
    };
    window.addEventListener('focus', resync);
    document.addEventListener('visibilitychange', resync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', resync);
      document.removeEventListener('visibilitychange', resync);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setVisiblePlanCount(getVisiblePlanCount());
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setPlanStartIndex((current) => Math.min(current, Math.max(0, plans.length - visiblePlanCount)));
  }, [plans.length, visiblePlanCount]);

  useEffect(() => {
    setHashStartIndex((current) => Math.min(current, Math.max(0, hashRentingPlans.length - visiblePlanCount)));
  }, [hashRentingPlans.length, visiblePlanCount]);

  // `silent` skips the full-screen loading state for background re-syncs
  const loadPlans = async (silent = false) => {
    if (!silent) setLoading(true);
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
      if (!user) {
        throw new Error('Please connect your wallet first');
      }

      const balance = Number(user.platformBalance || 0);
      const cost = Number(plan.price || 0);
      
      if (balance < cost) {
        const needed = (cost - balance).toFixed(2);
        throw new Error(`Insufficient balance. You need $${needed} more to purchase this plan`);
      }

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

      const message = `${plan.name} plan activated successfully. Mining has started.`;
      setSuccess(message);
      toastEmitter.success('Mining Started', `${plan.name} plan purchased for $${cost.toFixed(2)}`);
      
      // Refresh financial data across the app
      await refreshFinancialData();
      
      setTimeout(() => router.push('/dashboard/mining'), 1000);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to purchase plan';
      setError(errorMsg);
      toastEmitter.error('Purchase Failed', errorMsg);
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
      if (!user) {
        throw new Error('Please connect your wallet first');
      }

      const balance = Number(user.platformBalance || 0);
      const cost = Number(plan.price || 0);
      
      if (balance < cost) {
        const needed = (cost - balance).toFixed(2);
        throw new Error(`Insufficient balance. You need $${needed} more to rent this hash power`);
      }

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

      const message = `${plan.name} hash renting activated. Mining has started.`;
      setSuccess(message);
      toastEmitter.success('Hash Renting Started', `${plan.name} rented for $${cost.toFixed(2)}`);
      
      // Refresh financial data across the app
      await refreshFinancialData();
      
      
      setTimeout(() => router.push('/dashboard/mining'), 1000);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to rent hash power';
      setError(errorMsg);
      toastEmitter.error('Rental Failed', errorMsg);
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
    <div className="mc-page">
      <section className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Marketplace</p>
          <h1 className="mc-title">Mining Plans</h1>
          <p className="mc-subtitle">Choose a mining package and start earning instantly</p>
        </div>
      </section>

      {error && (
        <div className="flex flex-col gap-3 rounded-[22px] border border-rose-200/80 bg-rose-50/80 p-4 backdrop-blur-xl">
          <p className="text-sm font-semibold text-rose-600">{error}</p>
          <button
            onClick={() => loadPlans()}
            className="mc-button-secondary w-fit"
          >
            Retry
          </button>
        </div>
      )}

      {!error && plans.length === 0 && hashRentingPlans.length === 0 && (
        <section className="mc-card text-center">
          <p className="text-sm font-semibold text-slate-500">No mining plans available yet</p>
          <p className="mt-1 text-xs text-slate-400">Please check back later or contact support.</p>
        </section>
      )}

      {success && (
        <div className="rounded-[22px] border border-emerald-200/80 bg-emerald-50/80 p-4 text-sm font-semibold text-emerald-600 backdrop-blur-xl">
          {success}
        </div>
      )}

      {plans.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950">Mining Contracts</h2>
              <p className="text-xs text-slate-500">Lock in hashrate and earn daily mining rewards</p>
            </div>
            {plans.length > visiblePlanCount && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlanStartIndex((current) => Math.max(0, current - 1))}
                  disabled={planStartIndex === 0}
                  className="mc-icon-button h-9 w-9 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous mining plans"
                >
                  <FaChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPlanStartIndex((current) => Math.min(plans.length - visiblePlanCount, current + 1))}
                  disabled={planStartIndex >= plans.length - visiblePlanCount}
                  className="mc-icon-button h-9 w-9 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next mining plans"
                >
                  <FaChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${planStartIndex * (100 / visiblePlanCount)}%)` }}
            >
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex-shrink-0 px-1 sm:px-2"
                  style={{ width: `${100 / visiblePlanCount}%` }}
                >
                  <div className="flex h-full flex-col rounded-[24px] border border-sky-100 bg-white/80 p-4 shadow-[0_18px_50px_rgba(0,139,255,0.08)] backdrop-blur-xl transition-all hover:border-cmblue-200 hover:shadow-[0_24px_64px_rgba(0,139,255,0.16)]">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-slate-950">{plan.name}</h3>
                        <p className="mt-1 text-xs text-slate-500">{plan.description}</p>
                      </div>
                      <span className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cmblue-50 text-cmblue-600">
                        <FaBolt className="h-4 w-4" />
                      </span>
                    </div>

                    <div className="mb-4 border-t border-sky-100 pt-4">
                      <p className="text-3xl font-extrabold text-slate-950">${Number(plan.price).toFixed(0)}</p>
                      <p className="text-[10px] font-semibold text-slate-500">{plan.currency}</p>
                    </div>

                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <FaBolt className="h-3.5 w-3.5 text-cmblue-500" />
                        <span>{plan.hashRate} TH/s hashrate</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <FaClock className="h-3.5 w-3.5 text-cmblue-500" />
                        <span>{plan.durationDays} days</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <FaWallet className="h-3.5 w-3.5 text-cmblue-500" />
                        <span>${(Number(plan.dailyRate) * 100).toFixed(2)}% daily</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <FaGift className="h-3.5 w-3.5 text-cmblue-500" />
                        <span>+${Number(plan.bonusReward).toFixed(2)} bonus</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePurchase(plan)}
                      disabled={purchasing === plan.id}
                      className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cmblue-600 to-cmblue-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,130,255,0.22)] transition-all hover:shadow-[0_16px_36px_rgba(0,130,255,0.32)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {purchasing === plan.id ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Activating...
                        </>
                      ) : (
                        <>
                          <FaWallet className="h-3.5 w-3.5" />
                          Buy Plan
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {hashRentingPlans.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950">Hash Renting</h2>
              <p className="text-xs text-slate-500">Rent hashpower with direct wallet yields</p>
            </div>
            {hashRentingPlans.length > visiblePlanCount && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHashStartIndex((current) => Math.max(0, current - 1))}
                  disabled={hashStartIndex === 0}
                  className="mc-icon-button h-9 w-9 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous hash renting plans"
                >
                  <FaChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setHashStartIndex((current) => Math.min(hashRentingPlans.length - visiblePlanCount, current + 1))}
                  disabled={hashStartIndex >= hashRentingPlans.length - visiblePlanCount}
                  className="mc-icon-button h-9 w-9 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next hash renting plans"
                >
                  <FaChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${hashStartIndex * (100 / visiblePlanCount)}%)` }}
            >
              {hashRentingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex-shrink-0 px-1 sm:px-2"
                  style={{ width: `${100 / visiblePlanCount}%` }}
                >
                  <div className="flex h-full flex-col rounded-[24px] border border-sky-100 bg-white/80 p-4 shadow-[0_18px_50px_rgba(0,139,255,0.08)] backdrop-blur-xl transition-all hover:border-purple-200 hover:shadow-[0_24px_64px_rgba(0,139,255,0.16)]">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-slate-950">{plan.name}</h3>
                        <p className="mt-1 text-xs text-slate-500">{plan.description}</p>
                      </div>
                      <span className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                        <FaCube className="h-4 w-4" />
                      </span>
                    </div>

                    <div className="mb-4 border-t border-sky-100 pt-4">
                      <p className="text-3xl font-extrabold text-slate-950">${Number(plan.price).toFixed(0)}</p>
                      <p className="text-[10px] font-semibold text-slate-500">{plan.currency}</p>
                    </div>

                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <FaBolt className="h-3.5 w-3.5 text-cmblue-500" />
                        <span>{Number(plan.hashPower).toFixed(2)} TH/s power</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <FaClock className="h-3.5 w-3.5 text-cmblue-500" />
                        <span>{plan.durationDays} days</span>
                      </div>
                      {plan.expectedYield && Number(plan.expectedYield) > 0 && (
                        <div className="flex items-center gap-2.5 text-xs text-slate-600">
                          <FaGift className="h-3.5 w-3.5 text-cmblue-500" />
                          <span>{Number(plan.expectedYield).toFixed(1)}% yield</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleHashRent(plan)}
                      disabled={purchasing === plan.id}
                      className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(147,51,234,0.22)] transition-all hover:shadow-[0_16px_36px_rgba(147,51,234,0.32)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {purchasing === plan.id ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Activating...
                        </>
                      ) : (
                        <>
                          <FaWallet className="h-3.5 w-3.5" />
                          Rent Hash
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}