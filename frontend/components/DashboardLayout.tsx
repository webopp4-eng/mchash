'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  FaHome, FaBolt, FaLayerGroup, FaWallet, FaChartLine, FaUsers,
  FaExchangeAlt, FaArrowUp, FaHeadset, FaCogs, FaSignOutAlt, FaBell
} from 'react-icons/fa';
import Logo from './Logo';
import { useRouter } from 'next/navigation';
import { getUser, logout, User } from '@/lib/auth';
import { shortenAddress } from '@/lib/wallet';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: FaHome },
  { href: '/dashboard/mining', label: 'Mining', icon: FaBolt },
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
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cmblue-500/10 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      {/* Mobile Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#0a0e1a]/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <span className="text-sm font-bold">CM HASH</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white">
            <FaBell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-cmblue-500" />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-white/10 bg-[#0d1226]/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 border-b border-white/10 p-5">
          <Logo size={40} />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cmblue-400">CM HASH</p>
            <p className="text-[10px] text-slate-500">Cloud Mining</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cmblue-600/30 to-cmblue-500/10 text-cmblue-300 shadow-[0_0_20px_rgba(14,161,255,0.15)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cmblue-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cmblue-500 to-cmblue-700 text-sm font-bold">
              {user?.username?.slice(0, 2).toUpperCase() || 'CM'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{user?.username || 'User'}</p>
              <p className="truncate text-[10px] text-slate-500">{user ? shortenAddress(user.walletAddress) : ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20"
          >
            <FaSignOutAlt className="h-3.5 w-3.5" />
            Disconnect Wallet
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen lg:pl-72">
        <div className="px-4 pb-10 pt-16 sm:px-6 lg:px-8 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}