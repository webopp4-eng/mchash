'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FaUserCircle, FaUsers, FaChartLine, FaExchangeAlt, FaArrowUp,
  FaCogs, FaHeadset, FaSignOutAlt, FaWallet, FaBolt, FaChevronRight
} from 'react-icons/fa';
import { getUser, logout, User } from '@/lib/auth';
import { shortenAddress } from '@/lib/wallet';
import WalletConnectionPanel from '@/components/WalletConnectionPanel';

const secondaryItems = [
  { href: '/dashboard/referrals', label: 'Referral', desc: 'Invite friends & earn commissions', icon: FaUsers, color: 'text-cmblue-600 bg-cmblue-50' },
  { href: '/dashboard/earnings', label: 'Earnings', desc: 'Track your mining income', icon: FaChartLine, color: 'text-emerald-600 bg-emerald-50' },
  { href: '/dashboard/transactions', label: 'Transactions', desc: 'View all account activity', icon: FaExchangeAlt, color: 'text-purple-600 bg-purple-50' },
  { href: '/dashboard/withdrawals', label: 'Withdraw', desc: 'Request your earnings', icon: FaArrowUp, color: 'text-rose-600 bg-rose-50' },
  { href: '/dashboard/settings', label: 'Settings', desc: 'Manage your preferences', icon: FaCogs, color: 'text-amber-600 bg-amber-50' },
  { href: '/dashboard/support', label: 'Support', desc: 'Get help & contact us', icon: FaHeadset, color: 'text-slate-600 bg-slate-100' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogout = () => {
    logout(router);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-cmblue-500/10 blur-2xl" />
        <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cmblue-600 to-cmblue-500 text-white shadow-[0_10px_30px_rgba(14,161,255,0.3)]">
            <FaUserCircle className="h-10 w-10" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl font-bold">{user?.username || 'Miner'}</h1>
            <p className="mt-1 text-xs text-slate-400">{user ? shortenAddress(user.walletAddress, 8) : ''}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Active
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cmblue-500/20 px-3 py-1 text-[10px] font-semibold text-cmblue-300">
                <FaWallet className="h-3 w-3" />
                {user?.chain || 'ethereum'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-lg font-bold text-cmblue-300">${Number(user?.platformBalance || 0).toFixed(2)}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-500">Balance</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-lg font-bold text-emerald-300">0.00</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-500">Earned</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-lg font-bold text-purple-300">0</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-500">Referrals</p>
          </div>
        </div>
      </div>

      {/* Secondary Features */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-cmblue-300">Account</h2>
          <p className="text-[10px] text-slate-500">Manage your mining account</p>
        </div>
        <div className="grid gap-2">
          {secondaryItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition-all hover:border-cmblue-500/30 hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
                  <item.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-[10px] text-slate-500">{item.desc}</p>
                </div>
              </div>
              <FaChevronRight className="h-3.5 w-3.5 text-slate-500 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <WalletConnectionPanel darkMode={true} />
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20"
      >
        <FaSignOutAlt className="h-4 w-4" />
        Disconnect Wallet
      </button>
    </div>
  );
}