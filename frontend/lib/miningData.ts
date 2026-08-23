'use client';

/**
 * UNIFIED MINING DATA STORE — single source of truth for active mining pools.
 *
 * Home, Mining, and any other surface consume this exact same store:
 *  - One fetch of /api/mining shared across all components (global singleton).
 *  - One local clock drives smooth live values — zero extra network requests.
 *  - Live earnings are DERIVED (rate × elapsed time), never written to the DB
 *    per tick; the backend settles balances once per hour and remains the
 *    authoritative source.
 */

import { useEffect, useState } from 'react';
import { apiFetch } from './auth';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface LiveMiningPool {
  id: string;
  name: string;
  packageType: string;
  /** Asset whose balance receives this pool's earnings (e.g. USDT / BTC / ETH / MC Coin) */
  rewardAsset: string;
  progress: number;
  progressPercent: number;
  hashRate: number;
  dailyEarnings: number;
  /** Settled earnings from the server (authoritative) */
  earnedToDate: number;
  /** earnedToDate + rate × time since last hourly settlement (display only) */
  liveEarned: number;
  startedAt: string;
  endsAt: string;
  remainingMs: number;
  timeRemaining: string;
  status: 'active' | 'completed';
}

/** Map a plan currency to the canonical asset symbol it credits. */
export function toAssetSymbol(currency?: string | null): string {
  const v = String(currency || '').trim().toUpperCase().replace(/\s+/g, '');
  if (v === 'BTC' || v === 'BITCOIN') return 'BTC';
  if (v === 'ETH' || v === 'ETHEREUM') return 'ETH';
  if (v === 'MCCOIN' || v === 'MCC' || v === 'MCOIN' || v === 'MCHASH') return 'MC Coin';
  return 'USDT';
}

function formatRemaining(ms: number): string {
  const safe = Math.max(0, ms);
  const days = Math.floor(safe / DAY_MS);
  const hours = Math.floor((safe % DAY_MS) / (60 * 60 * 1000));
  const minutes = Math.floor((safe % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((safe % (60 * 1000)) / 1000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

/** Derive live per-pool stats from raw server data + current local time. */
function derivePool(raw: any, now: number): LiveMiningPool | null {
  if (!raw) return null;
  const startedAtMs = new Date(raw.startedAt || raw.purchase?.startedAt).getTime();
  const endsAtMs = new Date(raw.endsAt || raw.purchase?.endsAt).getTime();
  if (!Number.isFinite(startedAtMs) || !Number.isFinite(endsAtMs)) return null;

  const totalMs = Math.max(1, endsAtMs - startedAtMs);
  const clampedNow = Math.min(now, endsAtMs);
  const elapsedMs = Math.min(totalMs, Math.max(0, clampedNow - startedAtMs));
  const remainingMs = Math.max(0, endsAtMs - now);

  // Live earnings: settled amount + rate × time since the last hourly
  // settlement. Purely a display calculation — no DB writes involved.
  const dailyEarnings = Number(raw.dailyEarnings || 0);
  const earnedToDate = Number(raw.earnedToDate || 0);
  const lastPayoutMs = raw.session?.lastPayoutAt
    ? new Date(raw.session.lastPayoutAt).getTime()
    : startedAtMs;
  const liveDeltaMs = Math.max(0, Math.min(clampedNow, endsAtMs) - Math.min(lastPayoutMs, endsAtMs));
  const liveEarned = earnedToDate + (dailyEarnings * liveDeltaMs) / DAY_MS;

  return {
    id: String(raw.id || raw.purchase?.id || ''),
    name: raw.plan?.name || 'Active Plan',
    packageType: raw.packageType || 'mining',
    rewardAsset: toAssetSymbol(raw.plan?.currency || raw.purchase?.currency),
    progress: Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)),
    progressPercent: Math.round(Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100))),
    hashRate: Number(raw.hashRate || 0),
    dailyEarnings,
    earnedToDate,
    liveEarned,
    startedAt: new Date(startedAtMs).toISOString(),
    endsAt: new Date(endsAtMs).toISOString(),
    remainingMs,
    timeRemaining: formatRemaining(remainingMs),
    status: now < endsAtMs ? 'active' : 'completed',
  };
}

// ===== Global singleton (mirrors financialData.ts pattern) =====
let rawPlans: any[] = [];
let loading = true;
let fetchPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

/** Fetch active plans once; concurrent callers share the same request. */
export function refreshMiningPlans(): Promise<void> {
  if (!fetchPromise) {
    fetchPromise = apiFetch('/api/mining')
      .then((res) => {
        rawPlans = Array.isArray(res?.activePlans) ? res.activePlans : [];
        loading = false;
        notify();
      })
      .catch(() => {
        loading = false;
        notify();
      })
      .finally(() => {
        fetchPromise = null;
      });
  }
  return fetchPromise;
}

export function useMiningPools(): { pools: LiveMiningPool[]; loading: boolean; refetch: () => Promise<void> } {
  const [, setVersion] = useState(0);
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    refreshMiningPlans();

    const listener = () => setVersion((v) => v + 1);
    listeners.add(listener);

    // Resync when returning to the tab — no background polling.
    const resync = () => {
      if (document.visibilityState === 'visible') refreshMiningPlans();
    };
    window.addEventListener('focus', resync);
    document.addEventListener('visibilitychange', resync);

    // Local clock only — drives smooth live values without any requests.
    const clock = setInterval(() => setTick(Date.now()), 1000);

    return () => {
      listeners.delete(listener);
      window.removeEventListener('focus', resync);
      document.removeEventListener('visibilitychange', resync);
      clearInterval(clock);
    };
  }, []);

  const pools = rawPlans
    .map((p) => derivePool(p, tick))
    .filter(Boolean) as LiveMiningPool[];

  return { pools, loading, refetch: refreshMiningPlans };
}

/** Aggregate helpers — computed from the SAME pool list everywhere. */
export function sumHashRate(pools: LiveMiningPool[]): number {
  return pools.reduce((sum, p) => sum + p.hashRate, 0);
}

export function totalLiveEarned(pools: LiveMiningPool[]): number {
  return pools.reduce((sum, p) => sum + p.liveEarned, 0);
}