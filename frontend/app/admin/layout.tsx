'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaChartLine,
  FaChartPie,
  FaCoins,
  FaCogs,
  FaHeadset,
  FaHome,
  FaLayerGroup,
  FaLock,
  FaSignOutAlt,
  FaTable,
  FaThLarge,
  FaUsers,
  FaWallet,
  FaUserTie,
  FaClipboardList,
} from 'react-icons/fa';
import Logo from '@/components/Logo';
import { getUser, logout, User } from '@/lib/auth';
import { hasPageAccess, pageKeyForPath } from '@/lib/employeePermissions';

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
        await new Promise(resolve => setTimeout(resolve, 100));
        const localUser = getUser();
        setUser(localUser);

        // For EMPLOYEE accounts: re-hydrate pagePermissions from the server on
        // every page load so permission changes by the admin take effect
        // immediately (never trust stale localStorage for authorization data).
        if (localUser?.role === 'EMPLOYEE') {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://mchash.onrender.com'}/api/admin/permissions/me`, {
              credentials: 'include',
            });
            if (res.ok) {
              const data = await res.json();
              if (data.pagePermissions !== undefined) {
                setUser((prev) => prev ? { ...prev, pagePermissions: data.pagePermissions } : prev);
              }
            }
          } catch {
            // Network failure: fall back to localStorage permissions silently.
          }
        }
      } catch (err) {
        console.error('[AdminLayout] Optional user hydration failed:', err);
      } finally {
        setIsChecking(false);
      }
    };

    hydrateOptionalUser();
  }, []);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isEmployee = user?.role === 'EMPLOYEE';
  const isStaff = isSuperAdmin || isEmployee;

  // Employee page permissions: hide nav entries for pages the employee has
  // not been granted (the backend/API enforces this too — this is UI-only).
  const canSeePage = (href?: string): boolean => {
    if (!isEmployee || !href) return true;
    const pageKey = pageKeyForPath(href);
    if (!pageKey) return true; // not a permission-managed page
    return hasPageAccess(user?.role, user?.pagePermissions, pageKey);
  };

  // Build navigation based on role
  const adminNav = [
    { href: '/admin', label: 'Dashboard', icon: FaHome, show: isStaff },
    { href: '/admin/plans', label: 'Mining Center', icon: FaLayerGroup, show: isStaff },
    { href: '/admin/users', label: 'Bubble Team', icon: FaUsers, show: isStaff },
    // Wallet panel - SUPER_ADMIN ONLY
    { href: '/admin/treasury', label: 'Wallet', icon: FaWallet, show: isSuperAdmin },
    { href: '/admin/deposits', label: 'Transactions', icon: FaTable, show: isStaff },
    { href: '/admin/withdrawals', label: 'Rewards & Activity', icon: FaCoins, show: isStaff },
    { href: '/admin/settings', label: 'Settings', icon: FaCogs, show: isStaff },
    { href: '/admin/support', label: 'Support', icon: FaHeadset, show: isStaff },
    // Actions tab - SUPER_ADMIN ONLY (server-side /audit-logs is super-admin gated too)
    { href: '/admin/actions', label: 'Actions', icon: FaClipboardList, show: isSuperAdmin },
    // Restrictions tab - SUPER_ADMIN ONLY (employee permission management)
    { href: '/admin/restrictions', label: 'Restrictions', icon: FaLock, show: isSuperAdmin },
  ]
    .filter(item => item.show)
    .filter(item => canSeePage(item.href));

  const mobileNav = [
    { href: '/admin', label: 'Home', icon: FaHome, show: isStaff },
    { href: '/admin/plans', label: 'Mining', icon: FaLayerGroup, show: isStaff },
    // Featured Tabs button - opens the Tabs page with ALL other pages
    { href: '/admin/tabs', label: 'Tabs', icon: FaThLarge, show: isStaff, featured: true },
    { href: '/admin/users', label: 'Team', icon: FaUsers, show: isStaff },
    { href: '/admin/settings', label: 'More', icon: FaCogs, show: isStaff },
  ]
    .filter(item => item.show)
    .filter(item => canSeePage(item.href));

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

  // If not staff, redirect to login
  if (!isStaff) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  // URL access guard: an employee typing a restricted page URL directly into
  // the browser gets an Access Denied screen instead of the page content.
  // (APIs are independently protected server-side.)
  if (isEmployee) {
    const currentKey = pageKeyForPath(pathname);
    if (currentKey && !hasPageAccess(user?.role, user?.pagePermissions, currentKey)) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#f4fbff] px-4 text-slate-900">
          <div className="mc-card max-w-md text-center">
            <span className="mc-stat-icon mx-auto bg-rose-50 text-rose-600">
              <FaLock className="h-5 w-5" />
            </span>
            <h1 className="mt-4 text-xl font-extrabold text-slate-950">Access Denied</h1>
            <p className="mt-2 text-sm text-slate-500">
              You do not have permission to view this page. Please contact your administrator if you believe this is a mistake.
            </p>
            <button
              onClick={() => { window.location.href = '/admin'; }}
              className="mt-6 rounded-xl bg-cmblue-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-cmblue-600"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }
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
              <p className="truncate text-[10px] text-slate-500">
                {isSuperAdmin ? 'Super Admin' : isEmployee ? 'Employee' : user?.walletAddress || 'Direct admin access'}
              </p>
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

        <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
          <div className="relative mx-auto max-w-md">
            {/* Soft glowing gradient halo behind the dock */}
            <div
              aria-hidden
              className="absolute -inset-1 rounded-[30px] bg-gradient-to-r from-cmblue-400/30 via-sky-300/40 to-cmblue-400/30 blur-md"
            />

            {/* Floating glass dock */}
            <div className="relative grid grid-cols-5 items-end gap-1 rounded-[26px] border border-white/80 bg-white/95 p-1.5 shadow-[0_18px_44px_rgba(0,130,255,0.22)] backdrop-blur-xl">
              {mobileNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                // Featured Tabs button — circular, slightly larger than the other
                // nav buttons, raised above the dock, exactly in the center slot.
                if (item.featured) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex flex-col items-center justify-end gap-1"
                      aria-label={item.label}
                    >
                      <span
                        className={`relative -mt-8 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-cmblue-400 via-cmblue-500 to-sky-500 text-white shadow-[0_12px_28px_rgba(0,130,255,0.45)] ring-4 ring-white transition-all duration-200 ${
                          isActive ? 'scale-110 shadow-[0_16px_34px_rgba(0,130,255,0.55)]' : 'group-hover:scale-105'
                        }`}
                      >
                        {/* animated glow ring */}
                        <span
                          aria-hidden
                          className={`absolute inset-0 rounded-full bg-cmblue-400/40 ${isActive ? 'animate-ping' : ''}`}
                        />
                        <Icon className="relative h-6 w-6 drop-shadow" />
                      </span>
                      <span
                        className={`text-[10px] font-bold transition-colors ${
                          isActive ? 'text-cmblue-600' : 'text-slate-500 group-hover:text-cmblue-600'
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[18px] text-[10px] font-bold ${
                      isActive
                        ? 'bg-cmblue-500 text-white shadow-[0_10px_24px_rgba(0,130,255,0.28)]'
                        : 'text-slate-500 hover:bg-sky-50 hover:text-cmblue-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}