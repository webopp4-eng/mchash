import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    walletAddress?: string | null;
    role?: string;
    email?: string | null;
    username?: string | null;
    fullName?: string | null;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  // Try to get token from Authorization header first
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  
  // Fall back to httpOnly cookie if no Authorization header
  if (!token && req.cookies && req.cookies.cmhash_token) {
    token = req.cookies.cmhash_token;
  }
  
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-change-me') as { sub: string };
    req.user = { id: decoded.sub, walletAddress: '' };
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

export async function loadUser(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(401).json({ error: 'User not found' });
  if (user.status !== 'active' && user.status !== 'admin') {
    return res.status(403).json({ error: 'Account is ' + user.status });
  }

  // Check employee status for employee accounts
  if (user.role === 'EMPLOYEE' && user.employeeStatus !== 'active') {
    return res.status(403).json({ error: 'Employee account is ' + user.employeeStatus });
  }

  req.user = {
    id: user.id,
    walletAddress: user.walletAddress || undefined,
    role: user.role,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
  };
  next();
}
