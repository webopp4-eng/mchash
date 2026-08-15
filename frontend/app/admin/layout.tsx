'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaBell,
  FaChartLine,
  FaChartPie,
  FaCoins,
  FaCogs,
  FaHeadset,
  FaHome,
  FaLayerGroup,
  FaSignOutAlt,
  FaStore,
  FaTable,
  FaUsers,
  FaWallet,
} from 'react-icons/fa';
import Logo from '@/components/Logo';
import { getUser, logout, User } from '@/lib/auth';

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: FaHome },
  { href: '/admin/plans', label: 'Mining Center', icon: FaLayerGroup },
  { href: '/admin/users', label: 'Bubble Team', icon: FaUsers },
  { href: '/admin/treasury', label: 'Wallet', icon: FaWallet },
  { href: '/admin/deposits', label: 'Transactions', icon: FaTable },
  { href: '/admin/withdrawals', label: 'Rewards & Activity', icon: FaCoins },
  { href: '/admin/plans', label: 'Marketplace', icon: FaStore },
  { href: '/admin/deposits', label: 'Reports', icon: FaChartPie },
  { href: '/admin/settings', label: 'Settings', icon: FaCogs },
  { href: '/admin/support', label: 'Support', icon: FaHeadset },
  { href: '/admin/withdrawals', label: 'Notifications', icon: FaBell },
  { href: '/admin', label: 'Analytics', icon: FaChartLine },
];

const mobileNav = [
  { href: '/admin', label: 'Home', icon: FaHome },
  { href: '/admin/plans', label: 'Mining', icon: FaLayerGroup },
  { href: '/admin/users', label: 'Team', icon: FaUsers },
  { href: '/admin/treasury', label: 'Wallet', icon: FaWallet },
  { href: '/admin/settings', label: 'More', icon: FaCogs },
];

const RETRY_DELAY = 100; // ms

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    setIsMounted(true);

    const hydrateOptionalUser = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        setUser(getUser());
      } catch (err) {
        console.error('[AdminLayout] Optional user hydration failed:', err);
      } finally {
        setIsChecking(false);
      }
    };

    hydrateOptionalUser();
  }, []);

  // Show loading while checking access
  if (isChecking || !isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4fbff] text-slate-900">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Checking admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900">
      <div className="relative z-10 flex min-h-screen">
        {/* Admin Sidebar */}
        <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-sky-100 bg-white/82 shadow-[12px_0_36px_rgba(0,139,255,0.07)] backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-3 border-b border-sky-100 p-5">
            <Logo size={40} />
            <div>
              <p className="text-lg font-extrabold leading-none text-slate-950">MC HASH</p>
              <p className="mt-1 text-[10px] font-semibold uppercase text-cmblue-600">Cloud Mining Admin</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.href ? pathname === item.href : false;
              return item.href ? (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-cmblue-50 text-cmblue-700 shadow-sm ring-1 ring-cmblue-100'
                      : 'text-slate-500 hover:bg-sky-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ) : (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300"
                  aria-disabled="true"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              );
            })}
          </nav>

          <div className="space-y-3 border-t border-sky-100 p-4">
            <div className="rounded-2xl bg-gradient-to-br from-cmblue-50 to-white p-3 ring-1 ring-sky-100">
              <p className="text-[10px] font-bold uppercase text-slate-400">Signed in</p>
              <p className="mt-1 truncate text-sm font-bold text-slate-900">{user?.username || 'Admin'}</p>
              <p className="truncate text-[10px] text-slate-500">{user?.walletAddress || 'Direct admin access'}</p>
            </div>
            <Link
              href="/dashboard"
              className="mc-button-secondary w-full"
            >
              <FaChartLine className="h-3.5 w-3.5" />
              User Dashboard
            </Link>
            <button onClick={() => logout(router)} className="mc-button w-full bg-slate-900 hover:bg-slate-800">
              <FaSignOutAlt className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </aside>

        <header className="fixed left-0 right-0 top-0 z-40 border-b border-sky-100 bg-white/86 px-4 py-3 shadow-sm backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo size={36} />
              <div>
                <p className="text-base font-extrabold leading-none text-slate-950">MC HASH</p>
                <p className="mt-1 text-[10px] font-semibold uppercase text-cmblue-600">Admin Console</p>
              </div>
            </div>
            <button onClick={() => logout(router)} className="mc-icon-button" aria-label="Sign out">
              <FaSignOutAlt className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full flex-1 px-4 pb-28 pt-24 sm:px-6 lg:ml-64 lg:px-8 lg:py-6">
          {children}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-sky-100 bg-white/92 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_38px_rgba(0,139,255,0.12)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto grid max-w-md grid-cols-5 gap-1 rounded-[22px] bg-sky-50/70 p-1 ring-1 ring-sky-100">
            {mobileNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[18px] text-[10px] font-bold ${
                    isActive
                      ? 'bg-cmblue-500 text-white shadow-[0_10px_24px_rgba(0,130,255,0.28)]'
                      : 'text-slate-500 hover:bg-white hover:text-cmblue-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
