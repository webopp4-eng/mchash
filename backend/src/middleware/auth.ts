import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    walletAddress: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
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

  req.user = { id: user.id, walletAddress: user.walletAddress };
  next();
}