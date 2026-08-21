import { v4 as uuid } from 'uuid';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export interface AuditLogData {
  action: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry for an administrative action
 */
export async function createAuditLog(
  req: AuthRequest,
  data: AuditLogData
) {
  const actorId = req.user?.id;
  const actorRole = req.user?.role || 'user';

  return prisma.auditLog.create({
    data: {
      id: uuid(),
      userId: actorId,
      actorRole,
      action: data.action,
      targetId: data.targetId,
      details: data.details as any,
      ipAddress: data.ipAddress || req.ip || null,
      userAgent: data.userAgent || req.headers['user-agent'] || null,
    },
  });
}

/**
 * Get the display name of the current actor
 */
export function getActorName(req: AuthRequest): string {
  return req.user?.fullName || req.user?.username || req.user?.email || req.user?.id || 'Unknown';
}