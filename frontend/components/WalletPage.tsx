'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaArrowDown, FaArrowUp, FaBitcoin, FaCopy, FaEthereum, FaExchangeAlt, FaHistory, FaWallet } from 'react-icons/fa';
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

  const loadPaymentAccounts = async () => {
    // Removed - moved to dedicated deposits page
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

  const btcPrice = Number(marketPrices?.BTC?.price || 0);
  const ethPrice = Number(marketPrices?.ETH?.price || 0);
  const usdtPrice = Number(marketPrices?.USDT?.price || 1);

  const mcCoinBalance = financial.assets.MCCoin || Number(data?.balances?.['MC Coin'] ?? data?.balances?.mcCoin ?? balance ?? 0);
  const usdtBalance = financial.assets.USDT || Number(data?.balances?.USDT ?? data?.balances?.usdt ?? balance ?? 0);
  const ethBalance = financial.assets.ETH || Number(data?.balances?.ETH ?? data?.balances?.eth ?? 0);
  const btcBalance = financial.assets.BTC || Number(data?.balances?.BTC ?? data?.balances?.btc ?? 0);

  const assets = [
    { symbol: 'MC Coin', value: mcCoinBalance, units: mcCoinBalance.toFixed(2), icon: FaWallet, color: 'bg-cmblue-50 text-cmblue-600' },
    { symbol: 'USDT', value: usdtBalance, units: usdtBalance.toFixed(2), icon: SiTether, color: 'bg-emerald-50 text-emerald-600' },
    { symbol: 'BTC', value: btcBalance, units: btcBalance.toFixed(6), icon: FaBitcoin, color: 'bg-amber-50 text-amber-600' },
    { symbol: 'ETH', value: ethBalance, units: ethBalance.toFixed(6), icon: FaEthereum, color: 'bg-sky-50 text-cmblue-700' },
  ];

  const recentTransactions = (recent.length > 0 ? recent : []).map((tx: any) => ({
    label: tx.type ? (tx.type === 'deposit' ? 'Deposit' : tx.type === 'withdrawal' ? 'Withdrawal' : tx.type === 'purchase' ? 'Plan Purchase' : 'Mining Reward') : tx.label,
    value: `${Number(tx.amount || 0) >= 0 ? '+' : ''}$${Number(tx.amount || 0).toFixed(2)}`,
    status: tx.status || 'Completed',
  }));

  return (
    <div className="mc-page">
      <section className="mc-page-header">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Wallet</p>
          <h1 className="mc-title truncate">MC HASH Wallet</h1>
          <p className="mc-subtitle truncate">Balances, connected wallet, assets, and transaction activity.</p>
        </div>
        <div className="flex flex-col w-full sm:w-auto gap-2 sm:flex-row mt-3 sm:mt-0">
          <button onClick={copyAddress} className="mc-button-secondary order-2 sm:order-1">
            <FaCopy className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            <span className="sm:hidden">{copied ? 'Copied' : 'Address'}</span>
          </button>
          <Link href="/dashboard/deposits" className="mc-button order-1 sm:order-2">
            <FaArrowDown className="h-3.5 w-3.5" />
            Deposit
          </Link>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Large wallet hero — desktop/tablet only; mobile uses the compact
            action bar below so no functionality is lost */}
        <section className="mc-glass-blue hidden sm:block">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase text-white/75">Total Balance</p>
                <p className={`mt-2 font-extrabold sm:mt-3 truncate ${getBalanceFontSize(balance, 'text-2xl sm:text-3xl lg:text-4xl')}`}>${balance.toFixed(2)}</p>
                <p className="mt-1 text-xs sm:text-sm text-white/80 capitalize truncate">{walletType} on {chain}</p>
              </div>
              <FaWallet className="h-8 w-8 sm:h-10 sm:w-10 text-white/70 shrink-0" />
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-white/14 p-2.5 sm:p-3 ring-1 ring-white/25">
              <p className="text-[9px] sm:text-[10px] font-bold uppercase text-white/65">Connected Wallet</p>
              <p className="mt-1 truncate text-xs sm:text-sm font-bold break-all">{shortenAddress(walletAddress, 10) || 'No wallet connected'}</p>
            </div>
            <div className="grid w-full grid-cols-3 gap-1.5 sm:gap-2">
              {[
                { label: 'Deposit', href: '/dashboard/deposits', icon: FaArrowDown, className: 'bg-emerald-500 hover:bg-emerald-600' },
                { label: 'Withdraw', href: '/dashboard/withdrawals', icon: FaArrowUp, className: 'bg-rose-500 hover:bg-rose-600' },
                { label: 'Transfer', href: '/dashboard/transactions', icon: FaExchangeAlt, className: 'bg-cmblue-500 hover:bg-cmblue-600' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 rounded-lg sm:rounded-xl px-2 sm:px-3 py-2 text-center text-[9px] sm:text-xs font-bold text-white shadow-sm transition-colors ${item.className}`}
                >
                  <item.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="line-clamp-1">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mc-card">
          <div className="mb-3 sm:mb-4">
            <h2 className="text-base font-bold text-slate-950">Assets</h2>
            <p className="text-[10px] sm:text-xs text-slate-500">Asset balances and values</p>
          </div>
          <div className="space-y-2">
            {assets.map((asset) => (
              <div key={asset.symbol} className="flex items-center justify-between rounded-xl sm:rounded-2xl border border-sky-100 bg-sky-50/50 p-2.5 sm:p-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <span className={`mc-stat-icon shrink-0 ${asset.color}`}>
                    <asset.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-slate-950">{asset.symbol}</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 truncate">{asset.units} units</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-slate-950 shrink-0 ml-2">${asset.value.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ===== Mobile-only compact wallet actions (replaces the removed hero) ===== */}
      <section className="rounded-[24px] border border-cmblue-100 bg-gradient-to-br from-sky-50 via-white to-cmblue-50 p-4 shadow-[0_14px_36px_rgba(0,130,255,0.12)] sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Connected Wallet</p>
            <p className="mt-0.5 truncate text-xs font-bold text-slate-950">
              {shortenAddress(walletAddress, 10) || 'No wallet connected'}
            </p>
          </div>
          <button onClick={copyAddress} aria-label="Copy address" className="mc-icon-button h-9 w-9 shrink-0">
            <FaCopy className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Deposit', href: '/dashboard/deposits', icon: FaArrowDown, className: 'bg-gradient-to-r from-emerald-500 to-emerald-600' },
            { label: 'Withdraw', href: '/dashboard/withdrawals', icon: FaArrowUp, className: 'bg-gradient-to-r from-rose-500 to-rose-600' },
            { label: 'Transfer', href: '/dashboard/transactions', icon: FaExchangeAlt, className: 'bg-gradient-to-r from-cmblue-500 to-sky-500' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-center text-[10px] font-bold text-white shadow-md transition-all hover:brightness-110 ${item.className}`}
            >
              <item.icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mc-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Recent Activity</h2>
            <p className="text-xs text-slate-500">Clean transaction and wallet activity information</p>
          </div>
          <Link href="/dashboard/transactions" className="mc-button-secondary min-h-8 px-3 py-1">View all</Link>
        </div>
        <div className="grid gap-2 lg:grid-cols-2">
          {recentTransactions.slice(0, 6).map((item: any) => (
            <div key={item.label + item.value} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
              <div className="flex items-center gap-3">
                <span className="mc-stat-icon bg-white text-cmblue-600">
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
