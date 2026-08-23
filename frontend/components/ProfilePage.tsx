'use client';

/**
 * PROFILE PANEL — presentation-layer redesign only.
 * All logic (auth state, username editing, navigation, logout, financial
 * data hooks) is preserved exactly as before.
 */

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  FaBell, FaCogs, FaChevronRight, FaHeadset, FaLock, FaPencilAlt,
  FaSignOutAlt, FaCheck, FaWallet, FaMoneyBill, FaCoins, FaBitcoin,
  FaEthereum, FaFingerprint, FaIdBadge, FaNetworkWired, FaShieldAlt,
} from 'react-icons/fa';
import { getUser, logout, User } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { shortenAddress } from '@/lib/wallet';
import { useFinancialData } from '@/lib/financialData';
import { SiTether } from 'react-icons/si';

const items = [
  { icon: FaCogs, label: 'Settings', desc: 'Manage your preferences', href: '/dashboard/settings' },
  { icon: FaHeadset, label: 'Support', desc: 'Get help & contact us', href: '/dashboard/support' },
  { icon: FaBell, label: 'Notifications', desc: 'View all notifications', href: '/dashboard/withdrawals' },
  { icon: FaLock, label: 'Security', desc: 'Manage account security', href: '/dashboard/settings' },
  { icon: FaMoneyBill, label: 'Connect Payout Method', desc: 'Set up withdrawal destination', href: '/dashboard/profile/payout-methods' },
  { icon: FaWallet, label: 'Connect Wallet', desc: 'Coming Soon', href: '#', disabled: true },
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('User');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(username);
  const financial = useFinancialData();

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
    if (currentUser?.username) {
      setUsername(currentUser.username);
      setEditValue(currentUser.username);
    }
  }, []);

  const handleSaveUsername = () => {
    if (editValue.trim()) {
      setUsername(editValue.trim());
    }
    setIsEditing(false);
  };

  const avatarClass = user?.avatar === 'avatar-1' ? 'bg-gradient-to-br from-cmblue-500 to-cmblue-700' :
    user?.avatar === 'avatar-2' ? 'bg-gradient-to-br from-emerald-500 to-teal-700' :
    user?.avatar === 'avatar-3' ? 'bg-gradient-to-br from-amber-500 to-orange-700' :
    user?.avatar === 'avatar-4' ? 'bg-gradient-to-br from-rose-500 to-pink-700' :
    'bg-gradient-to-br from-violet-500 to-purple-700';

  return (
    <div className="mc-page mx-auto max-w-6xl space-y-4 sm:space-y-5">
      {/* ================= IDENTITY HERO ================= */}
      <section className="overflow-hidden rounded-[24px] border border-cmblue-100 bg-white shadow-[0_18px_50px_rgba(0,139,255,0.10)]">
        {/* Cover */}
        <div className="relative h-24 bg-gradient-to-r from-[#0a4aa8] via-cmblue-600 to-sky-400 sm:h-36">
          {/* decorative pattern */}
          <div aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" />
          <div aria-hidden className="pointer-events-none absolute -bottom-12 left-1/4 h-32 w-32 rounded-full bg-white/[0.07]" />
          <div aria-hidden className="pointer-events-none absolute right-1/3 top-3 h-14 w-14 rounded-full bg-white/10" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/10 to-transparent" />
        </div>

        <div className="px-4 pb-5 sm:px-6 sm:pb-6">
          {/* Avatar + identity row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end">
              {/* Avatar with gradient ring */}
              <div className={`relative -mt-9 flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-[1.35rem] p-[3px] shadow-[0_10px_28px_rgba(0,60,140,0.35)] sm:-mt-12 sm:h-24 sm:w-24 sm:rounded-[1.75rem] ${avatarClass}`}>
                <span className="grid h-full w-full place-items-center rounded-[1.2rem] bg-slate-900/20 text-xl font-black tracking-wide text-white backdrop-blur-[1px] sm:rounded-[1.6rem] sm:text-3xl">
                  {username?.slice(0, 2).toUpperCase() || 'MC'}
                </span>
                <span aria-hidden className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-emerald-500 sm:h-6 sm:w-6">
                  <FaCheck className="h-2 w-2 text-white" />
                </span>
              </div>

              <div className="text-center sm:text-left">
                {/* Editable username */}
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
                        className="mc-input w-44"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveUsername}
                        aria-label="Save username"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-cmblue-500 to-sky-500 text-white shadow-md transition-all hover:brightness-110"
                      >
                        <FaCheck className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-lg font-extrabold tracking-tight text-slate-950 sm:text-2xl">{username}</h1>
                      <button
                        onClick={() => {
                          setEditValue(username);
                          setIsEditing(true);
                        }}
                        aria-label="Edit username"
                        className="group flex h-7 w-7 items-center justify-center rounded-lg bg-cmblue-50 text-cmblue-600 ring-1 ring-cmblue-100 transition-all hover:bg-cmblue-600 hover:text-white"
                      >
                        <FaPencilAlt className="h-2.5 w-2.5 transition-transform group-hover:scale-110" />
                      </button>
                    </>
                  )}
                </div>

                {/* Chips */}
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50/80 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                    <FaWallet className="h-2.5 w-2.5 text-cmblue-600" />
                    {user?.walletAddress ? shortenAddress(user.walletAddress, 8) : 'No wallet connected'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-cmblue-50/80 px-2.5 py-1 text-[10px] font-bold text-cmblue-700">
                    <FaIdBadge className="h-2.5 w-2.5" />
                    ID: {user?.referralCode || 'CMH-0000'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Online
                  </span>
                </div>
              </div>
            </div>

            <span className="hidden items-center gap-1.5 self-start rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1.5 text-[10px] font-bold text-emerald-600 sm:inline-flex">
              <FaShieldAlt className="h-3 w-3" />
              Verified account
            </span>
          </div>

          {/* ===== Key stats ===== */}
          <p className="mb-2 mt-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Account overview</p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              {
                label: 'Balance',
                value: `$${(financial.platformBalance || Number(user?.platformBalance || 0)).toFixed(2)}`,
                icon: FaWallet,
                tint: 'from-cmblue-500 to-sky-500',
              },
              {
                label: 'Network',
                value: user?.chain || 'N/A',
                icon: FaNetworkWired,
                tint: 'from-violet-500 to-purple-500',
              },
              {
                label: 'Wallet Type',
                value: user?.walletType || 'Wallet',
                icon: FaShieldAlt,
                tint: 'from-emerald-500 to-teal-500',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-sky-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4"
              >
                <span className={`inline-grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br ${stat.tint} text-white shadow-sm`}>
                  <stat.icon className="h-3 w-3" />
                </span>
                <p className="mt-2 truncate text-sm font-extrabold capitalize text-slate-950 sm:text-base">{stat.value}</p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ===== Asset balances ===== */}
          <div className="mb-2 mt-5 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Asset balances</p>
            <Link href="/dashboard/wallet" className="text-[10px] font-bold text-cmblue-600 hover:text-cmblue-700">
              View wallet →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {[
              { symbol: 'USDT', value: financial.assets.USDT, icon: SiTether, color: 'bg-emerald-50 text-emerald-600', ring: 'ring-emerald-100' },
              { symbol: 'BTC', value: financial.assets.BTC, icon: FaBitcoin, color: 'bg-amber-50 text-amber-600', ring: 'ring-amber-100' },
              { symbol: 'ETH', value: financial.assets.ETH, icon: FaEthereum, color: 'bg-sky-50 text-cmblue-700', ring: 'ring-sky-100' },
              { symbol: 'MC Coin', value: financial.assets.MCCoin, icon: FaCoins, color: 'bg-cmblue-50 text-cmblue-600', ring: 'ring-cmblue-100' },
            ].map((asset) => (
              <div
                key={asset.symbol}
                className="rounded-2xl border border-sky-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className={`mc-stat-icon ${asset.color} ring-1 ${asset.ring}`}>
                    <asset.icon className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-[11px] font-extrabold tabular-nums text-slate-950">{asset.value.toFixed(6)}</p>
                </div>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">{asset.symbol}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        {/* ================= ACCOUNT OPTIONS ================= */}
        <section className="mc-card">
          <div className="mb-4 flex items-center gap-3">
            <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600 ring-1 ring-cmblue-100">
              <FaCogs className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Menu</p>
              <h2 className="text-base font-extrabold text-slate-950">Account Options</h2>
            </div>
          </div>

          <div className="grid gap-1.5">
            {items.map((item: any) => (
              <Link
                key={item.label}
                href={item.disabled ? '#' : (item.href || '#')}
                onClick={(e) => item.disabled && e.preventDefault()}
                className={`group flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all ${
                  item.disabled
                    ? 'cursor-not-allowed border-slate-100 bg-slate-50/50 opacity-60'
                    : 'border-transparent bg-slate-50/70 hover:-translate-y-px hover:border-cmblue-200 hover:bg-cmblue-50/80 hover:shadow-md'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`mc-stat-icon shrink-0 transition-colors ${
                    item.disabled
                      ? 'bg-slate-100 text-slate-400'
                      : 'bg-white text-cmblue-600 ring-1 ring-sky-100 group-hover:bg-gradient-to-br group-hover:from-cmblue-500 group-hover:to-sky-500 group-hover:text-white'
                  }`}>
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-950">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <FaChevronRight className={`h-3 w-3 shrink-0 transition-transform ${
                  item.disabled ? 'text-slate-300' : 'text-cmblue-400 group-hover:translate-x-0.5 group-hover:text-cmblue-600'
                }`} />
              </Link>
            ))}
          </div>
        </section>

        {/* ================= SECURITY & ACTIVITY ================= */}
        <section className="mc-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="mc-stat-icon bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <FaFingerprint className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Security</p>
                <h2 className="text-base font-extrabold text-slate-950">Account Activity</h2>
              </div>
            </div>
            <span className="mc-status bg-emerald-50 text-emerald-600">Online</span>
          </div>

          <div className="space-y-2">
            {[
              {
                icon: FaWallet,
                tint: 'text-cmblue-600',
                label: 'Wallet address',
                value: user?.walletAddress || 'No wallet connected',
                mono: true,
              },
              {
                icon: FaFingerprint,
                tint: 'text-emerald-600',
                label: 'Verification',
                value: 'User verified by wallet signature',
                mono: false,
              },
              {
                icon: FaIdBadge,
                tint: 'text-cmblue-600',
                label: 'Member since',
                value: user?.referralCode ? 'Active member' : 'New member',
                mono: false,
              },
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-gradient-to-b from-white to-sky-50/40 p-3 shadow-sm">
                <span className={`mc-stat-icon shrink-0 bg-white ring-1 ring-sky-100 ${row.tint}`}>
                  <row.icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{row.label}</p>
                  <p className={`mt-0.5 break-all text-sm font-bold text-slate-950 ${row.mono ? 'font-mono text-xs leading-relaxed' : ''}`}>
                    {row.value}
                  </p>
                </div>
              </div>
            ))}

            <button
              onClick={() => logout(router)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-3 py-3 text-xs font-bold text-white shadow-[0_10px_24px_rgba(239,68,68,0.25)] ring-1 ring-white/30 transition-all hover:brightness-110 hover:shadow-[0_14px_30px_rgba(239,68,68,0.35)]"
            >
              <FaSignOutAlt className="h-3.5 w-3.5" />
              Log Out
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}