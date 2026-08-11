'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { getUser, isAuthenticated } from '@/lib/auth';

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = getUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      console.log('[DashboardLayout] Not authenticated, redirecting to /login');
      router.replace('/login');
      return;
    }
  }, [router, user]);

  if (!isAuthenticated() || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] text-white">
        <div className="text-center">
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
