/**
 * EMPLOYEE DASHBOARD PAGE PERMISSIONS
 *
 * Canonical registry of every Admin Dashboard page/section an EMPLOYEE can be
 * granted or denied access to, plus the enforcement helpers.
 *
 * Rules:
 *  - SUPER_ADMIN always has access to everything (permissions never apply).
 *  - An employee's `pagePermissions` column stores a JSON array of page keys.
 *      - `null`  -> not configured yet: legacy default, FULL staff access.
 *      - `[...]` -> explicit configuration: the employee may ONLY access the
 *                   pages whose keys appear in the array (may be empty = no
 *                   pages at all).
 *  - Admin-only sections (Settings, Treasury/Wallet, Actions/Audit log,
 *    Restrictions, Employees management) are NOT grantable to employees.
 *
 * The frontend keeps a mirror of this registry in
 * `frontend/lib/employeePermissions.ts` — keep the two in sync. The backend
 * registry is authoritative for validation and API enforcement.
 */

export interface AdminPageDefinition {
  /** Stable key stored in the database and used by the enforcement middleware. */
  key: string;
  /** Human-readable label shown in the Restrictions management UI. */
  label: string;
  /** Short description of what the page contains. */
  description: string;
  /** Primary frontend route of the page. */
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

const GRANTABLE_KEYS = new Set(EMPLOYEE_PAGES.map((p) => p.key));

/**
 * Normalize/validate a permissions payload coming from the API.
 * Returns `null` when the input is not a valid array (=> treat as unconfigured).
 * Unknown keys are dropped so stale clients cannot inject arbitrary data.
 */
export function normalizePagePermissions(input: unknown): string[] | null {
  if (input === null || input === undefined) return null;
  if (!Array.isArray(input)) return null;
  const seen = new Set<string>();
  for (const entry of input) {
    if (typeof entry === 'string' && GRANTABLE_KEYS.has(entry)) {
      seen.add(entry);
    }
  }
  // Preserve registry order for stable storage.
  return EMPLOYEE_PAGES.filter((p) => seen.has(p.key)).map((p) => p.key);
}

/**
 * Read and normalize the permissions of a user record (Prisma Json value).
 */
export function permissionsOfUser(pagePermissions: unknown): string[] | null {
  return normalizePagePermissions(pagePermissions);
}

/**
 * True when the given role + permissions allow access to `pageKey`.
 *
 *  - SUPER_ADMIN / ADMIN: always true.
 *  - EMPLOYEE: `null` permissions = full legacy access; otherwise the key
 *    must be present in the array.
 *  - Any other role: false.
 */
export function hasPageAccess(
  role: string | null | undefined,
  pagePermissions: unknown,
  pageKey: string
): boolean {
  const normalized = String(role || '').toUpperCase();
  if (normalized === 'SUPER_ADMIN' || normalized === 'ADMIN') return true;
  if (normalized !== 'EMPLOYEE') return false;

  const perms = normalizePagePermissions(pagePermissions);
  // Not configured yet -> legacy default: full staff access.
  if (perms === null) return true;
  return perms.includes(pageKey);
}

/**
 * Resolve which dashboard page a given admin pathname belongs to.
 * Returns the page key, or `null` when the path is not a permission-guarded
 * employee page (e.g. staff hub pages or super-admin-only sections).
 */
export function pageKeyForPath(pathname: string): string | null {
  const path = String(pathname || '').split('?')[0].split('#')[0];
  // Longest prefix match so nested routes (e.g. /admin/users/:id/mining)
  // resolve to their parent section.
  let best: AdminPageDefinition | null = null;
  for (const page of EMPLOYEE_PAGES) {
    if (path === page.path || path.startsWith(page.path + '/')) {
      if (!best || page.path.length > best.path.length) best = page;
    }
  }
  return best ? best.key : null;
}
