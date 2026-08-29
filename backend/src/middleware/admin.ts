import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from './auth';
import { hasPageAccess } from '../lib/employeePermissions';

// Role constants
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  USER: 'user',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/**
 * Require SUPER_ADMIN role
 * Only the super admin can access these routes
 */
export async function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(401).json({ error: 'User not found' });
  
  if (user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super admin access required' });
  }

  req.user = {
    ...req.user,
    role: user.role,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
  };
  next();
}

/**
 * Require EMPLOYEE role
 */
export async function requireEmployee(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(401).json({ error: 'User not found' });
  
  if (user.role !== 'EMPLOYEE') {
    return res.status(403).json({ error: 'Employee access required' });
  }

  if (user.employeeStatus !== 'active') {
    return res.status(403).json({ error: 'Employee account is ' + user.employeeStatus });
  }

  req.user = {
    ...req.user,
    role: user.role,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
  };
  next();
}

/**
 * Require SUPER_ADMIN or EMPLOYEE role
 * Used for admin dashboard routes that employees can access
 */
export async function requireAdminOrEmployee(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(401).json({ error: 'User not found' });
  
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'EMPLOYEE') {
    return res.status(403).json({ error: 'Admin or employee access required' });
  }

  // Check employee status for employee accounts
  if (user.role === 'EMPLOYEE' && user.employeeStatus !== 'active') {
    return res.status(403).json({ error: 'Employee account is ' + user.employeeStatus });
  }

  req.user = {
    ...req.user,
    role: user.role,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    pagePermissions: user.pagePermissions ?? null,
  };
  next();
}

/**
 * Backward-compatible requireAdmin - now requires SUPER_ADMIN
 */
export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  return requireSuperAdmin(req, res, next);
}

/**
 * Require access to a specific admin dashboard page/section (RBAC).
 *
 * Must be mounted AFTER `loadUser` / `requireAdminOrEmployee` so that
 * `req.user.pagePermissions` is populated. SUPER_ADMIN always passes;
 * EMPLOYEE access is governed by their persisted `pagePermissions`
 * whitelist (null = legacy full access). This is the server-side
 * enforcement that prevents employees from reaching restricted sections
 * by calling the API directly — the UI only mirrors these rules.
 */
export function requirePage(pageKey: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    // Re-read the employee from the database on EVERY request so permission
    // changes take effect immediately (never trust a stale JWT/session).
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    if (!hasPageAccess(user.role, user.pagePermissions, pageKey)) {
      return res.status(403).json({
        error: 'Access denied: you do not have permission to access this section.',
        code: 'PAGE_PERMISSION_DENIED',
        page: pageKey,
      });
    }

    next();
  };
}
