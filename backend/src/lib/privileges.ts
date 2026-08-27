/**
 * CENTRALIZED PRIVILEGE / GUARD HELPERS
 *
 * Single source of truth for "who may modify whom" on the platform.
 *
 * Privilege hierarchy (lowest to highest):
 *   user  <  EMPLOYEE  <  SUPER_ADMIN
 *
 * Rules enforced everywhere a staff member can touch another account:
 *  - A staff member may NEVER perform a restricted action (ban / delete /
 *    suspend / change role / change permissions / reset password / credit /
 *    debit / edit sensitive settings) against an account whose privilege
 *    level is HIGHER than or EQUAL to their own — this protects SUPER_ADMIN
 *    (admin) accounts from EMPLOYEE staff even if the frontend or the API
 *    request is manipulated.
 *  - Only a SUPER_ADMIN can manage SUPER_ADMIN accounts.
 *
 * These helpers MUST be used by the admin routes. Hiding buttons in the UI is
 * cosmetic only — the real enforcement lives here, on the backend.
 */

/** Highest-priority role constants (aligned with middleware/admin.ts). */
export const ROLE_SUPER_ADMIN = 'SUPER_ADMIN';
export const ROLE_EMPLOYEE = 'EMPLOYEE';
export const ROLE_USER = 'user';

const PRIVILEGE_ORDER = new Map<string, number>([
  [ROLE_USER, 0],
  [ROLE_EMPLOYEE, 1],
  [ROLE_SUPER_ADMIN, 2],
]);

const USER_TIER = PRIVILEGE_ORDER.get(ROLE_USER) ?? 0;

/** Numeric privilege of a role (unknown roles default to the USER tier). */
export function privilegeOf(role: string | null | undefined): number {
  if (!role) return USER_TIER;
  // Normalize legacy / casing variants: 'admin'/'ADMIN' are protected admins.
  const normalized = String(role).toUpperCase();
  if (normalized === 'ADMIN' || normalized === ROLE_SUPER_ADMIN) return PRIVILEGE_ORDER.get(ROLE_SUPER_ADMIN) ?? USER_TIER;
  return PRIVILEGE_ORDER.get(role) ?? USER_TIER;
}

/** True if `role` is a protected administrator account. */
export function isProtectedRole(role: string | null | undefined): boolean {
  const normalized = String(role || '').toUpperCase();
  return normalized === ROLE_SUPER_ADMIN || normalized === 'ADMIN';
}

/**
 * True when `actor` may NOT modify `target`'s protected account because the
 * target's privilege is higher than OR equal to the actor's. Employees can
 * therefore never act on admins, and a SUPER_ADMIN can manage other
 * SUPER_ADMINs. Non-staff target roles (normal users) are never "protected".
 */
export function isTargetProtectedFrom(actorRole: string | null | undefined, targetRole: string | null | undefined): boolean {
  const actorPriv = privilegeOf(actorRole);
  const targetPriv = privilegeOf(targetRole);
  // Blank / unknown target roles are treated as normal users — never protected.
  if (!targetRole) return false;
  // Normal users are never protected.
  if (targetPriv === USER_TIER) return false;
  return targetPriv >= actorPriv;
}