import { v4 as uuid } from 'uuid';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export interface AuditLogData {
  action: string;
  targetType?: string;          // 'user' | 'transaction' | 'deposit' | 'withdrawal' | 'support_ticket' | 'setting' | ...
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry for an administrative action.
 *
 * Records the authenticated actor's unique id, full name, username and role,
 * plus the action, affected target, timestamp and (where applicable) before /
 * after status. The actor name/username/role are snapshotted at creation time
 * so the audit trail stays correct even if a staff account is later renamed.
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
      actorName: req.user?.fullName || req.user?.username || null,
      actorUsername: req.user?.username || null,
      action: data.action,
      targetType: data.targetType || null,
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

/**
 * Get the display role of the current actor for UI attribution.
 * e.g. SUPER_ADMIN -> "Admin", EMPLOYEE -> "Employee"
 */
export function getActorRoleLabel(role: string | undefined | null): string {
  const normalized = String(role || '').toUpperCase();
  if (normalized === 'SUPER_ADMIN' || normalized === 'ADMIN') return 'Admin';
  if (normalized === 'EMPLOYEE') return 'Employee';
  return 'User';
}
