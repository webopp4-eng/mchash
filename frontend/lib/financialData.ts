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
 * - assetsBreakdown: { USDT, ETH, BTC, MCCoin }
 * - miningEarnings: Current mining rewards
 * - totalDeposits: Lifetime deposits
 * - totalWithdrawals: Lifetime withdrawals
 * - refetch(): Manually refresh all data
 * - loading: Whether data is loading
 * - error: Error message if failed
 */

import { useEffect, useState } from 'react';
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
  availableBalance: number;
  pendingBalance: number;
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
  availableBalance: 0,
  pendingBalance: 0,
  lastUpdated: 0,
};

export function useFinancialData(): UseFinancialDataReturn {
  const [data, setData] = useState<FinancialData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    try {
      setError(null);
      
      // Fetch wallet data (includes balance and assets)
      const walletRes = await apiFetch('/api/wallet');
      
      // Fetch admin/dashboard data (includes deposit/withdrawal stats)
      let adminData: any = { totalDeposits: 0, totalWithdrawals: 0 };
      try {
        adminData = await apiFetch('/api/admin/dashboard');
      } catch {
        // Fallback if admin endpoint not available
      }

      // Parse wallet data
      const walletBalance = Number(walletRes?.walletBalance || 0);
      const platformBalance = Number(walletRes?.platformBalance || 0);
      
      const assets = {
        USDT: Number(walletRes?.balances?.USDT ?? walletRes?.balances?.usdt ?? 0),
        ETH: Number(walletRes?.balances?.ETH ?? walletRes?.balances?.eth ?? 0),
        BTC: Number(walletRes?.balances?.BTC ?? walletRes?.balances?.btc ?? 0),
        MCCoin: Number(walletRes?.balances?.['MC Coin'] ?? walletRes?.balances?.mcCoin ?? 0),
      };

      // Calculate totals
      const totalAssets = Object.values(assets).reduce((sum, val) => sum + val, 0);

      // Parse mining earnings from wallet data
      const miningEarnings = Number(walletRes?.miningEarnings || 0);

      // Use admin dashboard data for deposits/withdrawals if available
      const totalDeposits = Number(adminData?.totalDeposits || 0);
      const totalWithdrawals = Number(adminData?.totalWithdrawals || 0);

      // Calculate available vs pending
      const availableBalance = Math.max(0, platformBalance - (Number(walletRes?.pendingAmount || 0)));
      const pendingBalance = Number(walletRes?.pendingAmount || 0);

      setData({
        platformBalance: Math.max(platformBalance, totalAssets),
        walletBalance,
        assets,
        miningEarnings,
        totalDeposits,
        totalWithdrawals,
        availableBalance,
        pendingBalance,
        lastUpdated: Date.now(),
      });
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

    // Auto-refresh every 30 seconds
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
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
