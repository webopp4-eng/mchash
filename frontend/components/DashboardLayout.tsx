'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  FaHome, FaBolt, FaLayerGroup, FaWallet, FaChartLine, FaUsers,
  FaExchangeAlt, FaArrowUp, FaHeadset, FaCogs, FaSignOutAlt, FaBell, FaTrophy
} from 'react-icons/fa';
import Logo from './Logo';
import BottomNav from './BottomNav';
import { useRouter } from 'next/navigation';
import { getUser, logout, User } from '@/lib/auth';
import { shortenAddress } from '@/lib/wallet';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: FaHome },
  { href: '/dashboard/mining', label: 'Mining', icon: FaBolt },
  { href: '/dashboard/atrs', label: 'ATRs', icon: FaChartLine },
  { href: '/dashboard/rankings', label: 'Rankings', icon: FaTrophy },
  { href: '/dashboard/plans', label: 'Plans', icon: FaLayerGroup },
  { href: '/dashboard/wallet', label: 'Wallet', icon: FaWallet },
  { href: '/dashboard/earnings', label: 'Earnings', icon: FaChartLine },
  { href: '/dashboard/referrals', label: 'Referrals', icon: FaUsers },
  { href: '/dashboard/transactions', label: 'Transactions', icon: FaExchangeAlt },
  { href: '/dashboard/withdrawals', label: 'Withdrawals', icon: FaArrowUp },
  { href: '/dashboard/support', label: 'Support', icon: FaHeadset },
  { href: '/dashboard/settings', label: 'Settings', icon: FaCogs },
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
    <div className="min-h-screen bg-gradient-to-b from-[#f5f8ff] via-[#f0f4ff] to-[#ebf1ff] text-slate-800">
      {/* Subtle background accents */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-120px] h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-cmblue-500/10 blur-[110px]" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-blue-300/20 blur-[120px]" />
      </div>

      {/* Mobile Top Bar */}
      <div className="fixed left-0 top-0 z-40 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <Logo size={30} />
          <span className="text-sm font-bold text-slate-800">CM HASH</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm">
            <FaBell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-cmblue-500" />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-slate-200/80 bg-white/95 px-4 py-4 shadow-[0_0_30px_rgba(15,23,42,0.05)] backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
          <Logo size={36} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cmblue-600">CM HASH</p>
            <p className="text-[10px] text-slate-500">Cloud Mining</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-cmblue-50 text-cmblue-700 shadow-[0_6px_18px_rgba(17,120,250,0.12)]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${isActive ? 'bg-cmblue-600 text-white shadow-[0_8px_18px_rgba(17,120,250,0.3)]' : 'bg-slate-100 text-slate-500'}`}>
                  <item.icon className="h-3.5 w-3.5" />
                </span>
                {item.label}
                {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-cmblue-500" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cmblue-500 to-cmblue-700 text-xs font-bold text-white">
              {user?.username?.slice(0, 2).toUpperCase() || 'CM'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">{user?.username || 'User'}</p>
              <p className="truncate text-[10px] text-slate-500">{user ? shortenAddress(user.walletAddress) : ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-500 transition hover:bg-rose-100"
          >
            <FaSignOutAlt className="h-3.5 w-3.5" />
            Disconnect Wallet
          </button>
        </div>
      </aside>

      <main className="relative z-10 min-h-screen lg:pl-72">
        <div className="mx-auto max-w-[1600px] px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pb-10 lg:pt-6">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}