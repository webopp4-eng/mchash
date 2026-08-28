'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  FaHome, FaBolt, FaLayerGroup, FaWallet, FaChartLine, FaUsers,
  FaExchangeAlt, FaArrowUp, FaHeadset, FaCogs, FaSignOutAlt, FaBell, FaTrophy, FaStore, FaChartPie
} from 'react-icons/fa';
import Logo from './Logo';
import BottomNav from './BottomNav';
import SiteFooter from './SiteFooter';
import LegalAcceptanceGate from './legal/LegalAcceptanceGate';
import { useRouter } from 'next/navigation';
import { getUser, logout, User } from '@/lib/auth';
import { shortenAddress } from '@/lib/wallet';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: FaHome },
  { href: '/dashboard/mining', label: 'Mining Center', icon: FaBolt },
  { href: '/dashboard/referrals', label: 'Bubble Team', icon: FaUsers },
  { href: '/dashboard/wallet', label: 'Wallet', icon: FaWallet },
  { href: '/dashboard/transactions', label: 'Transactions', icon: FaExchangeAlt },
  { href: '/dashboard/earnings', label: 'Rewards & Activity', icon: FaChartLine },
  { href: '/dashboard/plans', label: 'Marketplace', icon: FaStore },
  { href: '/dashboard/atrs', label: 'Reports', icon: FaChartPie },
  { href: '/dashboard/settings', label: 'Settings', icon: FaCogs },
  { href: '/dashboard/support', label: 'Support', icon: FaHeadset },
  { href: '/dashboard/withdrawals', label: 'Notifications', icon: FaBell },
  { href: '/dashboard/rankings', label: 'Analytics', icon: FaTrophy },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogout = () => {
    logout(router);
  };

  return (
    <div className="min-h-screen text-slate-900">
      {/* Mobile Top Bar */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-sky-100 bg-white/86 px-4 py-3 shadow-sm backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <div>
            <p className="text-base font-extrabold leading-none text-slate-950">MC HASH</p>
            <p className="mt-1 text-[10px] font-semibold uppercase text-cmblue-600">Cloud Mining</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="mc-icon-button relative" aria-label="Notifications">
            <FaBell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-cmblue-500" />
          </button>
          <button
            onClick={handleLogout}
            className="mc-icon-button"
            aria-label="Disconnect wallet"
          >
            <FaSignOutAlt className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-sky-100 bg-white/80 shadow-[12px_0_36px_rgba(0,139,255,0.07)] backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-3 border-b border-sky-100 p-5">
          <Logo size={40} />
          <div>
            <p className="text-lg font-extrabold leading-none text-slate-950">MC HASH</p>
            <p className="mt-1 text-[10px] font-semibold uppercase text-cmblue-600">Cloud Mining Platform</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-cmblue-50 text-cmblue-700 shadow-sm ring-1 ring-cmblue-100'
                    : 'text-slate-500 hover:bg-sky-50 hover:text-slate-900'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-sky-100 p-4">
          <div className="rounded-2xl bg-gradient-to-br from-cmblue-50 to-white p-3 ring-1 ring-sky-100">
          <div className="mb-3 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-white ${
              user?.avatar === 'avatar-1' ? 'bg-gradient-to-br from-cmblue-500 to-cmblue-700' :
              user?.avatar === 'avatar-2' ? 'bg-gradient-to-br from-emerald-500 to-teal-700' :
              user?.avatar === 'avatar-3' ? 'bg-gradient-to-br from-amber-500 to-orange-700' :
              user?.avatar === 'avatar-4' ? 'bg-gradient-to-br from-rose-500 to-pink-700' :
              'bg-gradient-to-br from-violet-500 to-purple-700'
            }`}>
              {user?.username?.slice(0, 2).toUpperCase() || 'MC'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">{user?.username || 'User'}</p>
              <p className="truncate text-[10px] text-slate-500">{user ? shortenAddress(user.walletAddress) : ''}</p>
            </div>
          </div>
          </div>
          <button
            onClick={handleLogout}
            className="mc-button w-full bg-slate-900 hover:bg-slate-800"
          >
            <FaSignOutAlt className="h-3.5 w-3.5" />
            Disconnect Wallet
          </button>
        </div>
      </aside>

      <main className="relative z-10 flex min-h-[100dvh] flex-col pt-20 lg:pl-64 lg:pt-0">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 lg:px-8 lg:py-6">
            {/* Legal re-acceptance gate: blocks platform usage when the user
                must accept updated Terms / Privacy Policy / Risk Disclosure */}
            <LegalAcceptanceGate>{children}</LegalAcceptanceGate>
          </div>
          {/* Mobile bottom spacer for navbar */}
          <div className="h-24 lg:h-0" />
        </div>
        <SiteFooter />
      </main>

      <BottomNav />
    </div>
  );
}
