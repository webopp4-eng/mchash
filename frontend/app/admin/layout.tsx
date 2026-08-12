'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaUsers, FaLayerGroup, FaWallet, FaArrowUp, FaArrowDown, FaCogs, FaSignOutAlt, FaChartLine } from 'react-icons/fa';
import Logo from '@/components/Logo';
import { getUser, isAuthenticated, User } from '@/lib/auth';

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: FaHome },
  { href: '/admin/users', label: 'Users', icon: FaUsers },
  { href: '/admin/plans', label: 'Mining Plans', icon: FaLayerGroup },
  { href: '/admin/treasury', label: 'Treasury', icon: FaWallet },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: FaArrowUp },
  { href: '/admin/deposits', label: 'Deposits', icon: FaArrowDown },
  { href: '/admin/settings', label: 'Settings', icon: FaCogs },
];

const MAX_RETRIES = 5;
const RETRY_DELAY = 100; // ms

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const deployMode = process.env.NEXT_PUBLIC_DEPLOY_MODE || 'public';
  const localAdminOnly = process.env.NEXT_PUBLIC_ADMIN_PANEL_LOCAL_ONLY === 'true';

  useEffect(() => {
    setIsMounted(true);
    
    // Check authentication and admin role with retry logic
    const checkAdminAccess = async () => {
      // Check if admin panel is available first
      if (deployMode !== 'local-admin' || !localAdminOnly) {
        console.warn('[AdminLayout] Public build detected. Admin routes are local-only.');
        setAccessDenied(true);
        setIsChecking(false);
        router.push('/');
        return;
      }

      let retries = 0;
      
      while (retries < MAX_RETRIES) {
        try {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          
          const userData = getUser();
          const authenticated = isAuthenticated();
          
          console.log(`[AdminLayout] Auth check attempt ${retries + 1}:`, { 
            authenticated, 
            hasUser: !!userData,
            isAdmin: userData?.role === 'admin'
          });
          
          if (authenticated && userData) {
            if (userData.role === 'admin') {
              console.log('[AdminLayout] Admin access verified');
              setUser(userData);
              setIsAdmin(true);
              setIsChecking(false);
              return;
            } else {
              console.log('[AdminLayout] User is not an admin, redirecting to dashboard');
              setAccessDenied(true);
              setIsChecking(false);
              router.push('/dashboard');
              return;
            }
          }
          
          retries++;
        } catch (err) {
          console.error('[AdminLayout] Auth check error:', err);
          retries++;
        }
      }
      
      // After retries, not authenticated
      console.log('[AdminLayout] Auth check failed after retries');
      setAccessDenied(true);
      setIsChecking(false);
      router.push('/login');
    };
    
    checkAdminAccess();
  }, [router, deployMode, localAdminOnly]);

  // Show loading while checking access
  if (isChecking || !isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] text-white">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (accessDenied || !isAdmin || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] text-white">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cmblue-500/10 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Admin Sidebar */}
        <aside className="fixed top-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-white/10 bg-[#0d1226]/95 backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-white/10 p-5">
            <Logo size={36} />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cmblue-400">Admin</p>
              <p className="text-[10px] text-slate-500">CM HASH Panel</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {adminNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cmblue-600/30 to-cmblue-500/10 text-cmblue-300'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
            >
              <FaChartLine className="h-3.5 w-3.5" />
              Back to User Dashboard
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-64 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}