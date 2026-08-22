'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FaBell, FaCogs, FaChevronRight, FaHeadset, FaLock, FaPencilAlt, FaSignOutAlt, FaCheck, FaWallet, FaMoneyBill, FaCoins, FaBitcoin, FaEthereum, FaFingerprint, FaIdBadge, FaNetworkWired } from 'react-icons/fa';
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
    <div className="mc-page max-w-6xl">
      {/* ===== Identity card ===== */}
      <section className="mc-card overflow-hidden p-0">
        {/* Cover banner */}
        <div className="relative h-28 bg-gradient-to-r from-cmblue-700 via-cmblue-600 to-sky-400 sm:h-36">
          <div className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-10 left-1/4 h-28 w-28 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute right-1/3 top-4 h-16 w-16 rounded-full bg-white/10" />
        </div>

        <div className="px-4 pb-5 sm:px-6">
          {/* Avatar + identity */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end">
              <div className={`-mt-10 flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-white text-white shadow-[0_8px_24px_rgba(0,0,0,0.24)] sm:-mt-12 sm:h-24 sm:w-24 ${avatarClass}`}>
                <span className="text-2xl font-extrabold sm:text-3xl">{username?.slice(0, 2).toUpperCase() || 'MC'}</span>
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
                        className="mc-input w-40"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveUsername}
                        aria-label="Save username"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-cmblue-600 text-white transition hover:bg-cmblue-700"
                      >
                        <FaCheck className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl">{username}</h1>
                      <button
                        onClick={() => {
                          setEditValue(username);
                          setIsEditing(true);
                        }}
                        aria-label="Edit username"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-cmblue-50 text-cmblue-600 transition hover:bg-cmblue-100"
                      >
                        <FaPencilAlt className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {user?.walletAddress ? shortenAddress(user.walletAddress, 8) : 'No wallet connected'}
                </p>
                <p className="mc-status mt-1.5 inline-flex items-center gap-1 bg-cmblue-50 text-cmblue-700">
                  <FaIdBadge className="h-2.5 w-2.5" />
                  ID: {user?.referralCode || 'CMH-0000'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 sm:justify-end">
              <span className="mc-status bg-emerald-50 text-emerald-600">Verified</span>
              <span className="mc-status bg-cmblue-50 text-cmblue-600">Online</span>
            </div>
          </div>

          {/* Key stats */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-sky-100 bg-gradient-to-b from-white to-sky-50/60 p-3 text-center shadow-sm">
              <p className="text-base font-extrabold text-slate-950 sm:text-lg">
                ${(financial.platformBalance || Number(user?.platformBalance || 0)).toFixed(2)}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">Balance</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-gradient-to-b from-white to-sky-50/60 p-3 text-center shadow-sm">
              <p className="truncate text-base font-extrabold capitalize text-slate-950 sm:text-lg">{user?.chain || 'N/A'}</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">Network</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-gradient-to-b from-white to-sky-50/60 p-3 text-center shadow-sm">
              <p className="truncate text-base font-extrabold capitalize text-slate-950 sm:text-lg">{user?.walletType || 'Wallet'}</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">Type</p>
            </div>
          </div>

          {/* Asset balances */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { symbol: 'USDT', value: financial.assets.USDT, icon: SiTether, color: 'bg-emerald-50 text-emerald-600' },
              { symbol: 'BTC', value: financial.assets.BTC, icon: FaBitcoin, color: 'bg-amber-50 text-amber-600' },
              { symbol: 'ETH', value: financial.assets.ETH, icon: FaEthereum, color: 'bg-sky-50 text-cmblue-700' },
              { symbol: 'MC Coin', value: financial.assets.MCCoin, icon: FaCoins, color: 'bg-cmblue-50 text-cmblue-600' },
            ].map((asset) => (
              <div key={asset.symbol} className="flex items-center gap-2.5 rounded-2xl border border-sky-100 bg-white/80 p-2.5 shadow-sm transition-colors hover:border-cmblue-200">
                <span className={`mc-stat-icon shrink-0 ${asset.color}`}>
                  <asset.icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-950 truncate">{asset.symbol}</p>
                  <p className="text-[10px] font-extrabold text-slate-600">{asset.value.toFixed(6)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        {/* ===== Account options ===== */}
        <section className="mc-card">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase text-cmblue-600">Menu</p>
            <h2 className="mt-1 text-base font-bold text-slate-950">Account Options</h2>
          </div>

          <div className="grid gap-1.5">
            {items.map((item: any) => (
              <Link
                key={item.label}
                href={item.disabled ? '#' : (item.href || '#')}
                onClick={(e) => item.disabled && e.preventDefault()}
                className={`group flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all ${
                  item.disabled
                    ? 'border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed'
                    : 'border-transparent bg-slate-50/70 hover:border-cmblue-200 hover:bg-cmblue-50/80 hover:shadow-sm'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`mc-stat-icon shrink-0 transition-colors ${
                    item.disabled ? 'bg-slate-100 text-slate-400' : 'bg-white text-cmblue-600 ring-1 ring-sky-100 group-hover:bg-cmblue-600 group-hover:text-white'
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

        {/* ===== Account activity & security ===== */}
        <section className="mc-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-cmblue-600">Security</p>
              <h2 className="mt-1 text-base font-bold text-slate-950">Account Activity</h2>
            </div>
            <span className="mc-status bg-cmblue-50 text-cmblue-600">Online</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-slate-50/70 p-3">
              <span className="mc-stat-icon shrink-0 bg-white text-cmblue-600 ring-1 ring-sky-100">
                <FaWallet className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Wallet address</p>
                <p className="mt-0.5 break-all text-sm font-bold text-slate-950">{user?.walletAddress || 'No wallet connected'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-slate-50/70 p-3">
              <span className="mc-stat-icon shrink-0 bg-white text-emerald-600 ring-1 ring-sky-100">
                <FaFingerprint className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Verification</p>
                <p className="mt-0.5 text-sm font-bold text-slate-950">User verified by wallet signature</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-slate-50/70 p-3">
              <span className="mc-stat-icon shrink-0 bg-white text-cmblue-600 ring-1 ring-sky-100">
                <FaNetworkWired className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Member since</p>
                <p className="mt-0.5 text-sm font-bold text-slate-950">{user?.referralCode ? 'Active member' : 'New member'}</p>
              </div>
            </div>
            <button
              onClick={() => logout(router)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-3 py-2.5 text-xs font-bold text-white shadow-[0_10px_24px_rgba(239,68,68,0.22)] transition-all hover:brightness-110 hover:shadow-[0_14px_30px_rgba(239,68,68,0.32)]"
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