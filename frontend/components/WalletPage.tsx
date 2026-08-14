'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaArrowDown, FaArrowUp, FaBitcoin, FaCopy, FaEthereum, FaExchangeAlt, FaHistory, FaWallet } from 'react-icons/fa';
import { SiTether } from 'react-icons/si';
import { apiFetch, getUser, User } from '@/lib/auth';
import { shortenAddress } from '@/lib/wallet';

const actions = [
  { label: 'Deposit', href: '/dashboard/transactions', icon: FaArrowDown, className: 'bg-emerald-500 hover:bg-emerald-600' },
  { label: 'Withdraw', href: '/dashboard/withdrawals', icon: FaArrowUp, className: 'bg-rose-500 hover:bg-rose-600' },
  { label: 'Transfer', href: '/dashboard/transactions', icon: FaExchangeAlt, className: 'bg-cmblue-500 hover:bg-cmblue-600' },
];

export default function WalletPage() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUser(getUser());
    loadWallet();
  }, []);

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

  const balance = Number(data?.platformBalance || user?.platformBalance || 0);
  const walletAddress = data?.walletAddress || user?.walletAddress || '';
  const chain = data?.chain || user?.chain || 'ethereum';
  const walletType = data?.walletType || user?.walletType || 'Wallet';
  const recent = data?.recentTransactions || [];

  const assets = [
    { symbol: 'MC Coin', value: balance, units: balance.toFixed(2), icon: FaWallet, color: 'bg-cmblue-50 text-cmblue-600' },
    { symbol: 'USDT', value: balance * 0.42, units: (balance * 0.42).toFixed(2), icon: SiTether, color: 'bg-emerald-50 text-emerald-600' },
    { symbol: 'BTC', value: balance * 0.18, units: '0.0045', icon: FaBitcoin, color: 'bg-amber-50 text-amber-600' },
    { symbol: 'ETH', value: balance * 0.24, units: '0.0821', icon: FaEthereum, color: 'bg-sky-50 text-cmblue-700' },
  ];

  const recentTransactions = (recent.length > 0 ? recent : [
    { label: 'Mining Reward', amount: 2.45, status: 'Completed' },
    { label: 'Deposit', amount: 50, status: 'Completed' },
    { label: 'Withdrawal', amount: -25, status: 'Completed' },
  ]).map((tx: any) => ({
    label: tx.type ? (tx.type === 'deposit' ? 'Deposit' : tx.type === 'withdrawal' ? 'Withdrawal' : tx.type === 'purchase' ? 'Plan Purchase' : 'Mining Reward') : tx.label,
    value: `${Number(tx.amount || 0) >= 0 ? '+' : ''}$${Number(tx.amount || 0).toFixed(2)}`,
    status: tx.status || 'Completed',
  }));

  return (
    <div className="mc-page">
      <section className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Wallet</p>
          <h1 className="mc-title">MC HASH Wallet</h1>
          <p className="mc-subtitle">Balances, connected wallet, assets, and transaction activity.</p>
        </div>
        <button onClick={copyAddress} className="mc-button-secondary">
          <FaCopy className="h-3.5 w-3.5" />
          {copied ? 'Copied' : 'Copy address'}
        </button>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="mc-glass-blue">
          <div className="flex flex-col gap-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-white/75">Total Balance</p>
                <p className="mt-3 text-4xl font-extrabold sm:text-5xl">${balance.toFixed(2)}</p>
                <p className="mt-2 text-sm text-white/80 capitalize">{walletType} on {chain}</p>
              </div>
              <FaWallet className="h-10 w-10 text-white/70" />
            </div>
            <div className="rounded-2xl bg-white/14 p-3 ring-1 ring-white/25">
              <p className="text-[10px] font-bold uppercase text-white/65">Connected Wallet</p>
              <p className="mt-1 truncate text-sm font-bold">{shortenAddress(walletAddress, 10) || 'No wallet connected'}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {actions.map((item) => (
                <Link key={item.label} href={item.href} className={`rounded-xl px-3 py-2 text-center text-xs font-bold text-white shadow-sm ${item.className}`}>
                  <item.icon className="mx-auto mb-1 h-3.5 w-3.5" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mc-card">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-950">Assets</h2>
            <p className="text-xs text-slate-500">Asset balances and values</p>
          </div>
          <div className="space-y-2">
            {assets.map((asset) => (
              <div key={asset.symbol} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
                <div className="flex items-center gap-3">
                  <span className={`mc-stat-icon ${asset.color}`}>
                    <asset.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-950">{asset.symbol}</p>
                    <p className="text-[10px] text-slate-500">{asset.units} units</p>
                  </div>
                </div>
                <p className="text-sm font-extrabold text-slate-950">${asset.value.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

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
