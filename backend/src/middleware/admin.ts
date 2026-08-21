import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from './auth';

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
  };
  next();
}

/**
 * Backward-compatible requireAdmin - now requires SUPER_ADMIN
 */
export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  return requireSuperAdmin(req, res, next);
}
