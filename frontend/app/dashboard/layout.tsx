'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { getUser, isAuthenticated, User } from '@/lib/auth';

const MAX_RETRIES = 5;
const RETRY_DELAY = 100; // ms

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check authentication with retry logic
    const checkAuth = async () => {
      let retries = 0;
      
      while (retries < MAX_RETRIES) {
        try {
          // Wait for localStorage to be ready
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          
          const userData = getUser();
          const authenticated = isAuthenticated();
          
          console.log(`[DashboardLayout] Auth check attempt ${retries + 1}:`, { authenticated, hasUser: !!userData });
          
          // If we found a user, we're authenticated - stop checking
          if (authenticated && userData) {
            console.log('[DashboardLayout] Authentication verified, user:', userData.id);
            setUser(userData);
            setIsAuth(true);
            setIsChecking(false);
            return;
          }
          
          retries++;
        } catch (err) {
          console.error('[DashboardLayout] Auth check error:', err);
          retries++;
        }
      }
      
      // After all retries, if still not authenticated, redirect
      console.log('[DashboardLayout] Auth check failed after retries, redirecting to /login');
      setIsChecking(false);
      setRedirecting(true);
      router.push('/login');
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
