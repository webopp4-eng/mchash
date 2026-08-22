/**
 * Centralized Financial Data Hook
 * 
 * Single source of truth for all balance, balance components, and financial metrics
 * Replaces scattered API calls across dashboard, wallet, profile, and admin pages
 * 
 * Usage:
 * const financial = useFinancialData();
 * 
 * Exposes:
 * - platformBalance: Total USDT/balance in account
 * - walletBalance: Connected wallet balance
 * - assets: { USDT, ETH, BTC, MCCoin }
 * - miningEarnings: Current mining rewards
 * - totalDeposits: Lifetime deposits
 * - totalWithdrawals: Lifetime withdrawals
 * - refetch(): Manually refresh all data
 * - loading: Whether data is loading
 * - error: Error message if failed
 * - totalEarned: Total accumulated earnings
 * - referralEarnings: Referral commission earnings
 * - activePlan: Currently active mining plan
 * - availableBalance: Balance available for withdrawal
 * - pendingBalance: Balance pending processing
 */

import { useEffect, useState, useRef } from 'react';
import { apiFetch } from './auth';

export interface FinancialData {
  platformBalance: number;
  walletBalance: number;
  assets: {
    USDT: number;
    ETH: number;
    BTC: number;
    MCCoin: number;
  };
  miningEarnings: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalEarned: number;
  referralEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  activePlan: any | null;
  lastUpdated: number;
}

interface UseFinancialDataReturn extends FinancialData {
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isStale: boolean; // True if data is older than 30 seconds
}

const DEFAULT_DATA: FinancialData = {
  platformBalance: 0,
  walletBalance: 0,
  assets: {
    USDT: 0,
    ETH: 0,
    BTC: 0,
    MCCoin: 0,
  },
  miningEarnings: 0,
  totalDeposits: 0,
  totalWithdrawals: 0,
  totalEarned: 0,
  referralEarnings: 0,
  availableBalance: 0,
  pendingBalance: 0,
  activePlan: null,
  lastUpdated: 0,
};

// Global singleton for managing financial data updates across all components
let globalFinancialData = { ...DEFAULT_DATA };
const listeners = new Set<() => void>();

export function subscribeToFinancialData(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners() {
  listeners.forEach(listener => listener());
}

/**
 * Build the FinancialData object from raw API responses.
 * Shared by both useFinancialData.refetch and refreshFinancialData so the
 * transformation logic exists in exactly one place.
 */
function buildFinancialData(
  dashboardRes: any,
  walletRes: any,
  earningsRes: any,
  depositsRes: any,
  withdrawalsRes: any
): FinancialData {
  const walletBalance = Number(walletRes?.walletBalance || 0);
  const platformBalance = Number(walletRes?.platformBalance || dashboardRes?.user?.platformBalance || 0);

  const assets = {
    USDT: Number(walletRes?.balances?.USDT ?? walletRes?.balances?.usdt ?? 0),
    ETH: Number(walletRes?.balances?.ETH ?? walletRes?.balances?.eth ?? 0),
    BTC: Number(walletRes?.balances?.BTC ?? walletRes?.balances?.btc ?? 0),
    MCCoin: Number(walletRes?.balances?.['MC Coin'] ?? walletRes?.balances?.mcCoin ?? 0),
  };

  // Mining & referral earnings come from the real server-side aggregates
  // (totalMiningEarnings / totalReferralEarnings) so these are no longer 0.
  const miningEarnings = Number(earningsRes?.totalMiningEarnings || 0);
  const referralEarnings = Number(earningsRes?.totalReferralEarnings || 0);
  const totalEarned = Number(
    earningsRes?.totalEarned ||
      dashboardRes?.user?.totalEarned ||
      miningEarnings + referralEarnings
  );

  const deposits = Array.isArray(depositsRes?.deposits) ? depositsRes.deposits : [];
  const withdrawals = Array.isArray(withdrawalsRes?.withdrawals) ? withdrawalsRes.withdrawals : [];

  const totalDeposits = deposits.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
  const totalWithdrawals = withdrawals.reduce((sum: number, w: any) => sum + Number(w.amount || 0), 0);

  const activePlan = dashboardRes?.activePlan || null;

  const pendingAmount = withdrawals
    .filter((w: any) => w.status === 'pending')
    .reduce((sum: number, w: any) => sum + Number(w.amount || 0), 0);

  const availableBalance = Math.max(0, platformBalance - pendingAmount);
  const pendingBalance = pendingAmount;

  // Display the server-side platformBalance exactly as stored — it is already
  // debited atomically when a withdrawal is requested (e.g. $500 - $400 = $100).
  // Never mask it with Math.max() against raw per-asset sums, otherwise a
  // withdrawal would appear not to reduce the visible balance.
  return {
    platformBalance,
    walletBalance,
    assets,
    miningEarnings,
    totalDeposits,
    totalWithdrawals,
    totalEarned,
    referralEarnings,
    availableBalance,
    pendingBalance,
    activePlan,
    lastUpdated: Date.now(),
  };
}

/** Fetch all financial endpoints in parallel and return raw responses. */
async function fetchFinancialData(): Promise<{
  dashboardRes: any;
  walletRes: any;
  earningsRes: any;
  depositsRes: any;
  withdrawalsRes: any;
}> {
  const [dashboardRes, walletRes, earningsRes, depositsRes, withdrawalsRes] = await Promise.all([
    apiFetch('/api/dashboard').catch(() => ({})),
    apiFetch('/api/wallet').catch(() => ({})),
    apiFetch('/api/earnings').catch(() => ({})),
    apiFetch('/api/deposits').catch(() => ({})),
    apiFetch('/api/withdrawals').catch(() => ({})),
  ]);
  return { dashboardRes, walletRes, earningsRes, depositsRes, withdrawalsRes };
}

export function useFinancialData(): UseFinancialDataReturn {
  const [data, setData] = useState<FinancialData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetch = async () => {
    try {
      setError(null);
      const raw = await fetchFinancialData();
      const newData = buildFinancialData(
        raw.dashboardRes,
        raw.walletRes,
        raw.earningsRes,
        raw.depositsRes,
        raw.withdrawalsRes
      );
      globalFinancialData = newData;
      setData(newData);
      notifyListeners();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch financial data';
      setError(errorMsg);
      console.error('Financial data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();

    // Auto-refresh every 5 minutes. Mining rewards are processed server-side
    // once per hour, so frequent polling is unnecessary — the UI refreshes
    // immediately when the user returns to the tab instead.
    const interval = setInterval(refetch, 300000);

    // Instant resync when the user returns to the tab (no background polling)
    const resync = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    window.addEventListener('focus', resync);
    document.addEventListener('visibilitychange', resync);

    // Subscribe to global updates
    const unsubscribe = subscribeToFinancialData(() => {
      setData(globalFinancialData);
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', resync);
      document.removeEventListener('visibilitychange', resync);
      unsubscribe();
      if (refetchTimeoutRef.current) clearTimeout(refetchTimeoutRef.current);
    };
  }, []);

  const isStale = Date.now() - data.lastUpdated > 30000;

  return {
    ...data,
    loading,
    error,
    refetch,
    isStale,
  };
}

/**
 * Trigger a refetch of financial data across all components.
 * Call this after mutations like deposits, withdrawals, plan purchases.
 *
 * Optional `overrides` lets callers apply a server response (e.g. the fresh
 * balances returned by POST /api/withdrawals) immediately so the UI updates
 * without waiting for another round-trip. The refetch still runs to reconcile.
 */
export async function refreshFinancialData(overrides?: Partial<FinancialData>) {
  const raw = await fetchFinancialData();
  const newData = buildFinancialData(
    raw.dashboardRes,
    raw.walletRes,
    raw.earningsRes,
    raw.depositsRes,
    raw.withdrawalsRes
  );

  // Merge any instant overrides (e.g. balances already known from a POST response)
  const merged: FinancialData = { ...newData, ...overrides };
  globalFinancialData = merged;
  notifyListeners();
}

/**
 * Format currency for display
 * Used throughout app for consistent number formatting
 */
export function formatCurrency(value: number, symbol = '$'): string {
  return `${symbol}${Number(value).toFixed(2)}`;
}

/**
 * Format large numbers with K/M/B abbreviation
 * 1,000,000 -> 1.0M
 */
export function formatLargeNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return (value / 1e9).toFixed(1) + 'B';
  if (abs >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (abs >= 1e3) return (value / 1e3).toFixed(1) + 'K';
  return value.toFixed(2);
}

/**
 * Get CSS class for status badge based on balance change
 */
export function getBalanceStatusClass(current: number, previous: number): string {
  if (current > previous) return 'text-emerald-600 bg-emerald-50';
  if (current < previous) return 'text-rose-600 bg-rose-50';
  return 'text-slate-600 bg-slate-50';
}
