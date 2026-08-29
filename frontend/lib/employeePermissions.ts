/**
 * FRONTEND MIRROR of `backend/src/lib/employeePermissions.ts`
 * (the backend registry is authoritative for validation + API enforcement).
 *
 * Keys must stay in sync with the backend registry.
 */

export interface AdminPageDefinition {
  key: string;
  label: string;
  description: string;
  path: string;
}

/** Pages that can be granted to / denied for EMPLOYEE accounts. */
export const EMPLOYEE_PAGES: AdminPageDefinition[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Admin overview, platform statistics and analytics',
    path: '/admin',
  },
  {
    key: 'deposits',
    label: 'Transactions & Deposits',
    description: 'Deposit review, transaction records and reports',
    path: '/admin/deposits',
  },
  {
    key: 'withdrawals',
    label: 'Withdrawals & Payouts',
    description: 'Withdrawal requests and reward payouts',
    path: '/admin/withdrawals',
  },
  {
    key: 'mining',
    label: 'Mining Center & Marketplace',
    description: 'Mining plans, hash power packages and marketplace items',
    path: '/admin/plans',
  },
  {
    key: 'users',
    label: 'Users (Bubble Team)',
    description: 'User accounts, balances and mining overview',
    path: '/admin/users',
  },
  {
    key: 'support',
    label: 'Support',
    description: 'Support tickets and user messages',
    path: '/admin/support',
  },
];

/**
 * Resolve which dashboard page a given admin pathname belongs to
 * (longest-prefix match, mirroring the backend resolver).
 */
export function pageKeyForPath(pathname: string): string | null {
  const path = String(pathname || '').split('?')[0].split('#')[0];
  let best: AdminPageDefinition | null = null;
  for (const page of EMPLOYEE_PAGES) {
    if (path === page.path || path.startsWith(page.path + '/')) {
      if (!best || page.path.length > best.path.length) best = page;
    }
  }
  return best ? best.key : null;
}

/** True when role+permissions allow access to `pageKey`. */
export function hasPageAccess(
  role: string | null | undefined,
  pagePermissions: string[] | null | undefined,
  pageKey: string
): boolean {
  const normalized = String(role || '').toUpperCase();
  if (normalized === 'SUPER_ADMIN' || normalized === 'ADMIN') return true;
  if (normalized !== 'EMPLOYEE') return false;
  // Not configured yet -> legacy default: full staff access.
  if (pagePermissions === null || pagePermissions === undefined) return true;
  return pagePermissions.includes(pageKey);
}
