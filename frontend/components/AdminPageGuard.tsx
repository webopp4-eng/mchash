'use client';

/**
 * CLIENT-SIDE ENFORCEMENT LAYER for employee dashboard page permissions.
 *
 * Renders an "Access Denied" screen when the signed-in EMPLOYEE lacks
 * permission for the dashboard section they navigated to (including direct
 * URL entry). This is defense-in-depth only — the primary enforcement is
 * server-side (`requirePagePermission` + route guards in the backend), so an
 * employee can never retrieve restricted DATA either way.
 *
 * SUPER_ADMIN is never restricted. Non-employee-page routes (staff hubs,
 * super-admin-only sections) are not affected here.
 */

import Link from 'next/link';
import { FaLock } from 'react-icons/fa';
import { hasPageAccess, pageKeyForPath, EMPLOYEE_PAGES } from '@/lib/employeePermissions';

export default function AdminPageGuard({
  pathname,
  role,
  pagePermissions,
  children,
}: {
  pathname: string;
  role: string | null | undefined;
  pagePermissions: string[] | null | undefined;
  children: React.ReactNode;
}) {
  const pageKey = pageKeyForPath(pathname);

  // Not a permission-guarded page (staff hubs, super-admin-only sections).
  if (!pageKey) return <>{children}</>;

  if (hasPageAccess(role, pagePermissions, pageKey)) return <>{children}</>;

  const pageLabel = EMPLOYEE_PAGES.find((p) => p.key === pageKey)?.label || pageKey;

  return (
    <div className="mc-page">
      <div className="mc-card flex flex-col items-center py-16 text-center">
        <span className="mc-stat-icon bg-rose-50 text-rose-600">
          <FaLock className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-lg font-extrabold text-slate-950">Access Denied</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Your account does not have permission to access {pageLabel}. Contact the main
          administrator if you believe this is a mistake.
        </p>
        <Link
          href="/admin"
          className="mt-6 rounded-xl bg-cmblue-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-cmblue-600"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
