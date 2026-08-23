'use client';

/**
 * SHARED MINING POOLS COMPONENT — the ONE mining UI used by both the Home
 * page and the Mining page, on mobile and desktop.
 *
 * Data comes exclusively from lib/miningData.ts (single source of truth):
 *  - Same pools, same progress, same live earnings, same start/end times,
 *    same status on every page.
 *  - Mobile: swipeable carousel with arrows + dots when multiple pools exist.
 *  - Desktop: responsive grid of pool cards.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FaBolt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useMiningPools, type LiveMiningPool } from '@/lib/miningData';

const ASSET_STYLES: Record<string, string> = {
  USDT: 'bg-emerald-50 text-emerald-600',
  BTC: 'bg-amber-50 text-amber-600',
  ETH: 'bg-sky-50 text-cmblue-700',
  'MC Coin': 'bg-cmblue-50 text-cmblue-600',
};

function PoolCard({ pool }: { pool: LiveMiningPool }) {
  const active = pool.status === 'active';
  return (
    <div className="flex h-full flex-col rounded-[24px] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cmblue-50 p-4 shadow-[0_14px_36px_rgba(0,130,255,0.12)] sm:p-5">
      {/* Header: plan name + asset badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-950">{pool.name}</p>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
            {pool.hashRate.toFixed(2)} TH/s · ${pool.dailyEarnings.toFixed(4)}/day
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${ASSET_STYLES[pool.rewardAsset] || ASSET_STYLES.USDT}`}>
          Earns {pool.rewardAsset}
        </span>
      </div>

      {/* Prominent circular progress metric */}
      <div className="relative mx-auto mt-4 grid h-40 w-40 place-items-center rounded-full" style={{ background: `conic-gradient(#008cff ${pool.progressPercent}%, #dcefff 0)` }}>
        <div className="grid h-[8.5rem] w-[8.5rem] place-items-center rounded-full bg-white shadow-inner ring-1 ring-sky-100">
          <div className="text-center">
            <p className="text-3xl font-black leading-none text-slate-950">
              {pool.progressPercent}
              <span className="text-base font-extrabold text-cmblue-500">%</span>
            </p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">Progress</p>
          </div>
        </div>
      </div>

      {/* Live earnings — derived from rate × elapsed time (no DB writes) */}
      <div className="mt-4 rounded-2xl border border-sky-100 bg-white/80 p-3 text-center backdrop-blur">
        <p className="text-lg font-black tabular-nums leading-none text-slate-950">{pool.liveEarned.toFixed(6)}</p>
        <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">
          {pool.rewardAsset} earned (live)
        </p>
      </div>

      {/* Supporting info */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl border border-sky-100 bg-white/70 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Started</p>
          <p className="mt-0.5 truncate px-1 text-[11px] font-bold text-slate-950">
            {new Date(pool.startedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="rounded-xl border border-sky-100 bg-white/70 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Ends</p>
          <p className="mt-0.5 truncate px-1 text-[11px] font-bold text-slate-950">
            {new Date(pool.endsAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Status footer */}
      <div className="mt-3 flex items-center justify-between gap-2 pt-1">
        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
          active ? 'bg-emerald-100/80 text-emerald-600' : 'bg-slate-200/70 text-slate-500'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${active ? 'animate-pulse bg-emerald-500' : 'bg-slate-400'}`} />
          {active ? 'Active' : 'Completed'}
        </span>
        <span className="text-[10px] font-bold text-cmblue-600">{pool.timeRemaining} left</span>
      </div>
    </div>
  );
}

export default function MiningPools({
  title = 'Mining Pool',
  subtitle = 'Your active mining pools — live progress and earnings',
}: {
  title?: string;
  subtitle?: string;
}) {
  const { pools, loading } = useMiningPools();
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // Keep carousel index valid as the pool list changes
  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(0, pools.length - 1)));
  }, [pools.length]);

  const canSwipe = pools.length > 1;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!canSwipe) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!canSwipe || touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < 40) return;
    setIndex((current) =>
      deltaX < 0 ? Math.min(pools.length - 1, current + 1) : Math.max(0, current - 1)
    );
  };

  if (loading && pools.length === 0) {
    return (
      <section className="mc-card flex min-h-[16rem] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </section>
    );
  }

  return (
    <section
      className={`relative overflow-hidden rounded-[24px] border border-cmblue-100 bg-gradient-to-br from-sky-50 via-white to-cmblue-50 p-4 shadow-[0_18px_44px_rgba(0,130,255,0.16)] mc-sheen sm:p-5 ${
        pools.length > 0 ? 'animate-mc-breathe' : ''
      }`}
    >
      {/* Soft decorative glows */}
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-cmblue-300/30 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-sky-300/40 blur-2xl" />

      {/* Header: title + dynamic active count */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cmblue-500 to-sky-500 text-white shadow-md">
            <FaBolt className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-slate-950">{title}</p>
            <p className="text-[10px] font-semibold text-slate-500">
              {pools.length > 0
                ? `${pools.length} pool${pools.length > 1 ? 's' : ''} running`
                : subtitle}
            </p>
          </div>
        </div>
        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
          pools.length > 0 ? 'bg-emerald-100/80 text-emerald-600' : 'bg-slate-200/70 text-slate-500'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${pools.length > 0 ? 'animate-pulse bg-emerald-500' : 'bg-slate-400'}`} />
          {pools.length > 0 ? `Active (${pools.length})` : 'Idle'}
        </span>
      </div>

      {pools.length === 0 ? (
        /* Empty state */
        <div className="relative mt-6 py-6 text-center">
          <Link href="/dashboard/plans" className="mc-button mx-auto w-fit px-5">
            Browse Mining Plans
          </Link>
        </div>
      ) : (
        <>
          {/* ===== Mobile: swipeable carousel with arrows/dots when multiple ===== */}
          <div className="relative mt-5 lg:hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {canSwipe && (
              <>
                <button
                  type="button"
                  aria-label="Previous pool"
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  disabled={index === 0}
                  className="absolute left-0 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-sky-100 bg-white/95 text-cmblue-600 shadow-md backdrop-blur transition-all hover:bg-cmblue-50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <FaChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Next pool"
                  onClick={() => setIndex((i) => Math.min(pools.length - 1, i + 1))}
                  disabled={index >= pools.length - 1}
                  className="absolute right-0 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-sky-100 bg-white/95 text-cmblue-600 shadow-md backdrop-blur transition-all hover:bg-cmblue-50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <FaChevronRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}

            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {pools.map((pool) => (
                <div key={pool.id} className="w-full shrink-0 px-1">
                  <PoolCard pool={pool} />
                </div>
              ))}
            </div>

            {canSwipe && (
              <div className="relative mt-4 flex items-center justify-center gap-1.5">
                {pools.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to pool ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === index ? 'w-5 bg-cmblue-500' : 'w-1.5 bg-sky-200 hover:bg-cmblue-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ===== Desktop: grid of the SAME pool cards ===== */}
          <div className="relative mt-5 hidden gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-3">
            {pools.map((pool) => (
              <PoolCard key={pool.id} pool={pool} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}