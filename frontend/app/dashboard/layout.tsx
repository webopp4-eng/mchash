'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { getUser, isAuthenticated, User } from '@/lib/auth';

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Mark as mounted to handle hydration
    setIsMounted(true);
    
    // Check authentication after hydration
    const checkAuth = async () => {
      try {
        // Small delay to ensure localStorage is fully initialized
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const userData = getUser();
        const authenticated = isAuthenticated();
        
        console.log('[DashboardLayout] Auth check:', { authenticated, hasUser: !!userData });
        
        setUser(userData);
        setIsAuth(authenticated);
        
        if (!authenticated) {
          console.log('[DashboardLayout] Not authenticated, redirecting to /login');
          setRedirecting(true);
          router.push('/login');
          return;
        }
      } catch (err) {
        console.error('[DashboardLayout] Auth check error:', err);
        setRedirecting(true);
        router.push('/login');
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, [router]);

  // Show loading while checking authentication
  if (isChecking || !isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] text-white">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If redirecting, show loading
  if (redirecting || !isAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] text-white">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
