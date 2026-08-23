'use client';

/**
 * PROFILE PANEL — complete structural redesign (UI/UX only).
 *
 * New layout:
 *   1. Profile header (identity)
 *   2. Account Overview — Balance + Wallet Type ONLY (network list removed
 *      from the overview UI; network data/logic remains intact elsewhere)
 *   3. Wallet & Payout Information
 *   4. Account Settings (grouped quick actions)
 *   5. Security
 *
 * Every handler, hook, link target, and data source is preserved exactly as
 * before — no logic was modified, duplicated, or removed.
 */

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  FaBell, FaCogs, FaChevronRight, FaHeadset, FaLock, FaPencilAlt,
  FaSignOutAlt, FaCheck, FaWallet, FaMoneyBill, FaCoins, FaBitcoin,
  FaEthereum, FaFingerprint, FaIdBadge, FaShieldAlt,
} from 'react-icons/fa';
import { getUser, logout, User } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { shortenAddress } from '@/lib/wallet';
import { useFinancialData } from '@/lib/financialData';
import { SiTether } from 'react-icons/si';

const settingsGroups = [
  {
    group: 'Preferences',
    items: [
      { icon: FaCogs, label: 'Settings', desc: 'Manage your preferences', href: '/dashboard/settings' },
      { icon: FaBell, label: 'Notifications', desc: 'View all notifications', href: '/dashboard/withdrawals' },
    ],
  },
  {
    group: 'Financial',
    items: [
      { icon: FaMoneyBill, label: 'Connect Payout Method', desc: 'Set up withdrawal destination', href: '/dashboard/profile/payout-methods' },
      { icon: FaWallet, label: 'Connect Wallet', desc: 'Coming Soon', href: '#', disabled: true },
    ],
  },
  {
    group: 'Help',
    items: [
      { icon: FaHeadset, label: 'Support', desc: 'Get help & contact us', href: '/dashboard/support' },
      { icon: FaLock, label: 'Security Center', desc: 'Manage account security', href: '/dashboard/settings' },
    ],
  },
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
      {/* ================= 1. PROFILE HEADER ================= */}
      <section className="relative overflow-hidden rounded-[24px] border border-cmblue-100 bg-white shadow-[0_18px_50px_rgba(0,139,255,0.10)]">
        {/* Slim gradient accent strip */}
        <div aria-hidden className="h-1.5 w-full bg-gradient-to-r from-cmblue-600 via-sky-400 to-cmblue-600" />
        {/* soft glow */}
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cmblue-100/40 blur-3xl" />

        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-black tracking-wide text-white shadow-[0_10px_24px_rgba(0,60,140,0.30)] sm:h-20 sm:w-20 sm:text-2xl ${avatarClass}`}>
              {username?.slice(0, 2).toUpperCase() || 'MC'}
              <span aria-hidden className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-emerald-500 sm:h-6 sm:w-6">
                <FaCheck className="h-2 w-2 text-white" />
              </span>
            </div>

            <div className="min-w-0">
              {/* Editable username */}
              <div className="flex items-center gap-2">
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
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-cmblue-500 to-sky-500 text-white shadow-md transition-all hover:brightness-110"
                    >
                      <FaCheck className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="truncate text-lg font-extrabold tracking-tight text-slate-950 sm:text-2xl">{username}</h1>
                    <button
                      onClick={() => {
                        setEditValue(username);
                        setIsEditing(true);
                      }}
                      aria-label="Edit username"
                      className="group flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cmblue-50 text-cmblue-600 ring-1 ring-cmblue-100 transition-all hover:bg-cmblue-600 hover:text-white"
                    >
                      <FaPencilAlt className="h-2.5 w-2.5 transition-transform group-hover:scale-110" />
                    </button>
                  </>
                )}
              </div>
              <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                <FaIdBadge className="h-3 w-3 text-cmblue-600" />
                Member ID: {user?.referralCode || 'CMH-0000'}
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-1.5 self-start rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1.5 text-[10px] font-bold text-emerald-600 sm:self-auto">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Verified · Online
          </span>
        </div>
      </section>

      {/* ================= 2. ACCOUNT OVERVIEW ================= */}
      <section>
        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Account Overview</p>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {/* Balance — hero stat */}
          <div className="mc-glass-blue relative p-5 sm:p-6">
            <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Total Balance</p>
                <p className="mt-2 text-3xl font-black tabular-nums tracking-tight sm:text-4xl">
                  ${(financial.platformBalance || Number(user?.platformBalance || 0)).toFixed(2)}
                </p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
                <FaWallet className="h-4 w-4" />
              </span>
            </div>
            <Link
              href="/dashboard/wallet"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-[11px] font-bold text-white ring-1 ring-white/25 transition-colors hover:bg-white/25"
            >
              Open wallet <FaChevronRight className="h-2.5 w-2.5" />
            </Link>
          </div>

          {/* Wallet type */}
          <div className="flex flex-col justify-between rounded-[24px] border border-sky-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Wallet Type</p>
                <p className="mt-2 truncate text-2xl font-extrabold capitalize text-slate-950 sm:text-3xl">
                  {user?.walletType || 'Wallet'}
                </p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm">
                <FaShieldAlt className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/70 px-3 py-1 text-[10px] font-bold text-emerald-600">
              <FaFingerprint className="h-2.5 w-2.5" />
              Secured by wallet signature
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ================= 3. WALLET & PAYOUT INFORMATION ================= */}
        <section className="mc-card">
          <div className="mb-4 flex items-center gap-3">
            <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600 ring-1 ring-cmblue-100">
              <FaWallet className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Financial</p>
              <h2 className="text-base font-extrabold text-slate-950">Wallet & Payout</h2>
            </div>
          </div>

          {/* Wallet address */}
          <div className="rounded-2xl border border-sky-100 bg-gradient-to-b from-white to-sky-50/40 p-3 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Connected wallet address</p>
            <p className="mt-1 break-all font-mono text-xs font-semibold leading-relaxed text-slate-950">
              {user?.walletAddress || 'No wallet connected'}
            </p>
          </div>

          {/* Asset balances */}
          <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Assets</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { symbol: 'USDT', value: financial.assets.USDT, icon: SiTether, color: 'bg-emerald-50 text-emerald-600', ring: 'ring-emerald-100' },
              { symbol: 'BTC', value: financial.assets.BTC, icon: FaBitcoin, color: 'bg-amber-50 text-amber-600', ring: 'ring-amber-100' },
              { symbol: 'ETH', value: financial.assets.ETH, icon: FaEthereum, color: 'bg-sky-50 text-cmblue-700', ring: 'ring-sky-100' },
              { symbol: 'MC Coin', value: financial.assets.MCCoin, icon: FaCoins, color: 'bg-cmblue-50 text-cmblue-600', ring: 'ring-cmblue-100' },
            ].map((asset) => (
              <div key={asset.symbol} className="rounded-2xl border border-sky-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
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

          {/* Payout shortcut */}
          <Link
            href="/dashboard/profile/payout-methods"
            className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-cmblue-100 bg-cmblue-50/50 p-3 transition-colors hover:border-cmblue-300 hover:bg-cmblue-100/50"
          >
            <span className="flex items-center gap-2.5 text-xs font-bold text-cmblue-700">
              <FaMoneyBill className="h-3.5 w-3.5" />
              Manage payout methods
            </span>
            <FaChevronRight className="h-3 w-3 text-cmblue-500" />
          </Link>
        </section>

        {/* ================= 4. ACCOUNT SETTINGS ================= */}
        <section className="mc-card">
          <div className="mb-4 flex items-center gap-3">
            <span className="mc-stat-icon bg-violet-50 text-violet-600 ring-1 ring-violet-100">
              <FaCogs className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Configuration</p>
              <h2 className="text-base font-extrabold text-slate-950">Account Settings</h2>
            </div>
          </div>

          <div className="space-y-4">
            {settingsGroups.map((group) => (
              <div key={group.group}>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{group.group}</p>
                <div className="grid gap-1.5">
                  {group.items.map((item: any) => (
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
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ================= 5. SECURITY ================= */}
      <section className="mc-card">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="mc-stat-icon bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <FaLock className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Protection</p>
              <h2 className="text-base font-extrabold text-slate-950">Security</h2>
            </div>
          </div>
          <span className="mc-status bg-emerald-50 text-emerald-600">Online</span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-gradient-to-b from-white to-sky-50/40 p-3 shadow-sm">
            <span className="mc-stat-icon shrink-0 bg-white text-emerald-600 ring-1 ring-emerald-100">
              <FaFingerprint className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Verification</p>
              <p className="mt-0.5 text-sm font-bold text-slate-950">Verified by wallet signature</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-gradient-to-b from-white to-sky-50/40 p-3 shadow-sm">
            <span className="mc-stat-icon shrink-0 bg-white text-cmblue-600 ring-1 ring-sky-100">
              <FaIdBadge className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Membership</p>
              <p className="mt-0.5 text-sm font-bold text-slate-950">{user?.referralCode ? 'Active member' : 'New member'}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => logout(router)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-3 py-3 text-xs font-bold text-white shadow-[0_10px_24px_rgba(239,68,68,0.25)] ring-1 ring-white/30 transition-all hover:brightness-110 hover:shadow-[0_14px_30px_rgba(239,68,68,0.35)] sm:w-fit sm:px-6"
        >
          <FaSignOutAlt className="h-3.5 w-3.5" />
          Log Out
        </button>
      </section>
    </div>
  );
}