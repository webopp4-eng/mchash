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
    const debugMode = localStorage.getItem('cmhash_debug') || process.env.NODE_ENV === 'development';
    
    // Check authentication with retry logic
    const checkAuth = async () => {
      let retries = 0;
      
      if (debugMode) {
        console.log(`[AUTH-DEBUG:STATE] Dashboard layout mounted, starting auth check`);
      }
      
      while (retries < MAX_RETRIES) {
        try {
          // Wait for localStorage to be ready
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          
          const userData = getUser();
          const authenticated = isAuthenticated();
          
          if (debugMode) {
            console.log(`[AUTH-DEBUG:STATE] checkAuth() attempt ${retries + 1}/${MAX_RETRIES}: authenticated=${authenticated}, hasUser=${!!userData}`);
          }
          
          // If we found a user, we're authenticated - stop checking
          if (authenticated && userData) {
            if (debugMode) {
              console.log(`[AUTH-DEBUG:STATE] checkAuth() PASSED, user=${userData.id}`);
            }
            setUser(userData);
            setIsAuth(true);
            setIsChecking(false);
            return;
          }
          
          retries++;
        } catch (err) {
          if (debugMode) {
            console.error(`[AUTH-DEBUG:STATE] checkAuth() error: ${err instanceof Error ? err.message : String(err)}`);
          }
          retries++;
        }
      }
      
      // After all retries, if still not authenticated, redirect
      if (debugMode) {
        console.log(`[AUTH-DEBUG:REDIRECT] checkAuth() failed after ${MAX_RETRIES} retries, redirecting to /login`);
      }
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
