'use client';

/**
 * WALLET PANEL — premium credit-card style redesign (UI only).
 * All data sources and handlers are unchanged: /api/wallet, /api/market-prices,
 * useFinancialData balances, copy-to-clipboard, and navigation links.
 *
 * Layout: bank card on top → grouped action buttons → assets → recent activity.
 * Identical structure on mobile and desktop.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaArrowDown, FaArrowUp, FaBitcoin, FaCopy, FaCheck, FaEthereum,
  FaExchangeAlt, FaHistory, FaWallet,
} from 'react-icons/fa';
import { SiTether } from 'react-icons/si';
import { apiFetch, getUser, User } from '@/lib/auth';
import { useFinancialData } from '@/lib/financialData';
import { shortenAddress } from '@/lib/wallet';
import { getBalanceFontSize } from '@/lib/typography';

export default function WalletPage() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [marketPrices, setMarketPrices] = useState<any>(null);
  const financial = useFinancialData();

  useEffect(() => {
    setUser(getUser());
    loadWallet();
    loadMarketPrices();
  }, []);

  const loadMarketPrices = async () => {
    try {
      const res = await apiFetch('/api/market-prices');
      setMarketPrices(res.prices || null);
    } catch (err) {
      console.error('Failed to load market prices:', err);
    }
  };

  const loadWallet = async () => {
    try {
      const res = await apiFetch('/api/wallet');
      setData(res);
    } catch (err) {
      console.error('Failed to load wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    const address = data?.walletAddress || user?.walletAddress || '';
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  const balance = financial.platformBalance || Number(data?.platformBalance || user?.platformBalance || 0);
  const walletAddress = data?.walletAddress || user?.walletAddress || '';
  const chain = data?.chain || user?.chain || 'ethereum';
  const walletType = data?.walletType || user?.walletType || 'Wallet';
  const recent = data?.recentTransactions || [];

  const mcCoinBalance = financial.assets.MCCoin || Number(data?.balances?.['MC Coin'] ?? data?.balances?.mcCoin ?? balance ?? 0);
  const usdtBalance = financial.assets.USDT || Number(data?.balances?.USDT ?? data?.balances?.usdt ?? balance ?? 0);
  const ethBalance = financial.assets.ETH || Number(data?.balances?.ETH ?? data?.balances?.eth ?? 0);
  const btcBalance = financial.assets.BTC || Number(data?.balances?.BTC ?? data?.balances?.btc ?? 0);

  const assets = [
    { symbol: 'MC Coin', value: mcCoinBalance, units: mcCoinBalance.toFixed(2), icon: FaWallet, color: 'bg-cmblue-50 text-cmblue-600', ring: 'ring-cmblue-100' },
    { symbol: 'USDT', value: usdtBalance, units: usdtBalance.toFixed(2), icon: SiTether, color: 'bg-emerald-50 text-emerald-600', ring: 'ring-emerald-100' },
    { symbol: 'BTC', value: btcBalance, units: btcBalance.toFixed(6), icon: FaBitcoin, color: 'bg-amber-50 text-amber-600', ring: 'ring-amber-100' },
    { symbol: 'ETH', value: ethBalance, units: ethBalance.toFixed(6), icon: FaEthereum, color: 'bg-sky-50 text-cmblue-700', ring: 'ring-sky-100' },
  ];

  const recentTransactions = (recent.length > 0 ? recent : []).map((tx: any) => ({
    label: tx.type ? (tx.type === 'deposit' ? 'Deposit' : tx.type === 'withdrawal' ? 'Withdrawal' : tx.type === 'purchase' ? 'Plan Purchase' : 'Mining Reward') : tx.label,
    value: `${Number(tx.amount || 0) >= 0 ? '+' : ''}$${Number(tx.amount || 0).toFixed(2)}`,
    status: tx.status || 'Completed',
  }));

  const actions = [
    { label: 'Deposit', href: '/dashboard/deposits', icon: FaArrowDown, className: 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-[0_8px_20px_rgba(16,185,129,0.30)]' },
    { label: 'Withdraw', href: '/dashboard/withdrawals', icon: FaArrowUp, className: 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-[0_8px_20px_rgba(244,63,94,0.30)]' },
    { label: 'Transfer', href: '/dashboard/transactions', icon: FaExchangeAlt, className: 'bg-gradient-to-r from-cmblue-500 to-sky-500 shadow-[0_8px_20px_rgba(0,130,255,0.30)]' },
  ];

  return (
    <div className="mc-page mx-auto max-w-4xl space-y-4 sm:space-y-5">
      {/* ================= PREMIUM BANK CARD ================= */}
      <section
        className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[26px] p-5 text-white shadow-[0_24px_60px_rgba(2,80,180,0.40)] ring-1 ring-white/20 sm:p-7"
        style={{ background: 'linear-gradient(135deg, #0a3a7d 0%, #1178fa 45%, #18aaff 75%, #4a9dff 100%)' }}
      >
        {/* decorative sheen + circles */}
        <div aria-hidden className="pointer-events-none absolute -right-14 -top-16 h-52 w-52 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-white/[0.08]" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />

        {/* Card top row: brand + network label */}
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">MC Hash Wallet</p>
            <p className="mt-1 text-xs font-bold capitalize text-white/90">{walletType} · {chain}</p>
          </div>
          {/* EMV-style chip */}
          <div className="flex flex-col items-end gap-2">
            <span className="text-sm font-black tracking-widest text-white/90">MC HASH</span>
            <span className="grid h-7 w-9 place-items-center rounded-md bg-gradient-to-br from-amber-200 to-yellow-500 shadow-inner">
              <span className="grid grid-cols-2 gap-px">
                <span className="h-1.5 w-1 bg-yellow-700/40" /><span className="h-1.5 w-1 bg-yellow-700/40" />
                <span className="h-1.5 w-1 bg-yellow-700/40" /><span className="h-1.5 w-1 bg-yellow-700/40" />
              </span>
            </span>
          </div>
        </div>

        {/* Prominent balance */}
        <div className="relative mt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">Total Balance</p>
          <p className={`mt-2 font-black tabular-nums tracking-tight ${getBalanceFontSize(balance, 'text-4xl sm:text-5xl')}`}>
            ${balance.toFixed(2)}
          </p>
        </div>

        {/* Card number style address + copy */}
        <div className="relative mt-6 flex items-center justify-between gap-3 rounded-xl bg-black/15 px-3 py-2.5 ring-1 ring-white/15 backdrop-blur-sm">
          <p className="truncate font-mono text-sm font-bold tracking-wider text-white/95">
            {shortenAddress(walletAddress, 12) || 'No wallet connected'}
          </p>
          <button
            onClick={copyAddress}
            aria-label="Copy wallet address"
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-[10px] font-bold text-white ring-1 ring-white/25 transition-colors hover:bg-white/25"
          >
            {copied ? <FaCheck className="h-3 w-3" /> : <FaCopy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </section>

      {/* ================= GROUPED ACTION BUTTONS ================= */}
      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:brightness-110 ${action.className}`}
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Link>
        ))}
      </section>

      {/* ================= ASSETS (below the card) ================= */}
      <section className="mc-card">
        <div className="mb-3 sm:mb-4">
          <h2 className="text-base font-extrabold text-slate-950">Assets</h2>
          <p className="text-[10px] sm:text-xs text-slate-500">Asset balances and holdings</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {assets.map((asset) => (
            <div key={asset.symbol} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-cmblue-200 hover:shadow-md">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className={`mc-stat-icon shrink-0 ring-1 ${asset.color} ${asset.ring}`}>
                  <asset.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-950 sm:text-sm">{asset.symbol}</p>
                  <p className="truncate text-[9px] text-slate-500 sm:text-[10px]">{asset.units} units</p>
                </div>
              </div>
              <p className="ml-2 shrink-0 text-xs font-extrabold tabular-nums text-slate-950 sm:text-sm">${asset.value.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= RECENT ACTIVITY ================= */}
      <section className="mc-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-950">Recent Activity</h2>
            <p className="text-xs text-slate-500">Transaction and wallet activity information</p>
          </div>
          <Link href="/dashboard/transactions" className="mc-button-secondary min-h-8 px-3 py-1">View all</Link>
        </div>
        <div className="grid gap-2 lg:grid-cols-2">
          {recentTransactions.slice(0, 6).map((item: any) => (
            <div key={item.label + item.value} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
              <div className="flex items-center gap-3">
                <span className="mc-stat-icon bg-white text-cmblue-600 ring-1 ring-sky-100">
                  <FaHistory className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-950">{item.label}</p>
                  <p className="text-[10px] text-slate-500">{item.status}</p>
                </div>
              </div>
              <p className={`text-sm font-extrabold ${item.value.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}