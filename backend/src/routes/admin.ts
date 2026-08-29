import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { authenticateToken, loadUser, AuthRequest } from '../middleware/auth';
import { requireSuperAdmin, requireAdminOrEmployee, requirePage } from '../middleware/admin';
import { hashPassword } from '../services/emailAuth';
import { createAuditLog, getActorName } from '../services/auditLog';
import { sanitizeDepositForViewer, sanitizeDepositsForViewer, sanitizeWithdrawalsForViewer } from '../services/transactionVisibility';
import { getBalanceField } from '../services/balances';
import { isProtectedRole, isTargetProtectedFrom } from '../lib/privileges';
import { EMPLOYEE_PAGES, normalizePagePermissions } from '../lib/employeePermissions';

const router = Router();

// All admin routes require authentication
router.use(authenticateToken, loadUser);

/**
 * Guard helper — refuses a restricted administrative action when the target
 * account is protected from the currently-authenticated actor.
 *
 * This is the SERVER-SIDE enforcement that protects ADMIN accounts from
 * EMPLOYEE staff even when the frontend is bypassed or the API request is
 * hand-crafted. Call it from every sensitive route before mutating.
 *
 * Returns an error response (and `true`) when the action is forbidden, or
 * `false` when the action may proceed.
 */
function forbidRestrictedAction(
  req: AuthRequest,
  res: import('express').Response,
  targetRole: string | null | undefined
): boolean {
  if (isTargetProtectedFrom(req.user?.role, targetRole)) {
    res.status(403).json({
      error: 'This account is protected. You do not have permission to modify an account with equal or higher privileges.',
    });
    return true;
  }
  return false;
}

// ============ EMPLOYEE MANAGEMENT (SUPER_ADMIN ONLY) ============

// List all employees
// ============ EMPLOYEE RESTRICTIONS (SUPER_ADMIN ONLY) ============

// GET /api/admin/employees/restrictions — all employees + the canonical page registry
router.get('/employees/restrictions', requireSuperAdmin, async (_req, res) => {
  try {
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      select: { id: true, username: true, fullName: true, email: true, employeeStatus: true, pagePermissions: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ employees, pages: EMPLOYEE_PAGES });
  } catch (error) {
    console.error('List employee restrictions error:', error);
    res.status(500).json({ error: 'Failed to load employee restrictions' });
  }
});

// PUT /api/admin/employees/restrictions/:id — replace an employee's page whitelist
router.put('/employees/restrictions/:id', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body ?? {};

    const employee = await prisma.user.findUnique({ where: { id } });
    if (!employee || employee.role !== 'EMPLOYEE') {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Normalize + validate against the canonical registry (drops unknown keys).
    const normalized = normalizePagePermissions(permissions);

    const updated = await prisma.user.update({
      where: { id },
      data: { pagePermissions: normalized === null ? Prisma.JsonNull : (normalized as any) },
      select: { id: true, username: true, fullName: true, email: true, employeeStatus: true, pagePermissions: true },
    });

    await createAuditLog(req, {
      action: 'EMPLOYEE_PERMISSIONS_UPDATE',
      targetType: 'user',
      targetId: id,
      details: {
        employeeId: id,
        employeeName: employee.username,
        permissions: normalized,
        configured: normalized !== null,
      },
    });

    res.json({ success: true, employee: updated });
  } catch (error) {
    console.error('Update employee restrictions error:', error);
    res.status(500).json({ error: 'Failed to update employee restrictions' });
  }
});

router.get('/employees', requireSuperAdmin, async (_req, res) => {
  try {
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      select: {
        id: true, email: true, fullName: true, username: true,
        role: true, employeeStatus: true, status: true,
        createdAt: true, updatedAt: true, lastLoginAt: true,
        pagePermissions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ employees });
  } catch (error) {
    console.error('List employees error:', error);
    res.status(500).json({ error: 'Failed to load employees' });
  }
});

// ============ EMPLOYEE PAGE PERMISSIONS (SUPER_ADMIN ONLY) ============

// Catalog of all restrict-able dashboard pages — drives the Restrictions UI.
router.get('/employees/permissions/catalog', requireSuperAdmin, async (_req, res) => {
  res.json({ pages: EMPLOYEE_PAGES });
});

// Read one employee's current page permissions.
router.get('/employees/:id/permissions', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, fullName: true, role: true, employeeStatus: true, pagePermissions: true },
    });
    if (!employee || employee.role !== 'EMPLOYEE') {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ employee });
  } catch (error) {
    console.error('Get employee permissions error:', error);
    res.status(500).json({ error: 'Failed to load employee permissions' });
  }
});

// Update one employee's page permissions (persisted in the database).
// SUPER_ADMIN only — employees can never modify their own (or any) permissions.
router.patch('/employees/:id/permissions', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { pagePermissions } = req.body ?? {};

    const employee = await prisma.user.findUnique({ where: { id } });
    if (!employee || employee.role !== 'EMPLOYEE') {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Validate + normalize: only known page keys survive; null resets to the
    // unconfigured (full access) state. Accepts [] = deny all pages.
    const normalized = normalizePagePermissions(pagePermissions);

    const updated = await prisma.user.update({
      where: { id },
      data: {
        pagePermissions: normalized === null ? Prisma.JsonNull : (normalized as Prisma.InputJsonValue),
        updatedAt: new Date(),
      },
      select: { id: true, email: true, fullName: true, role: true, employeeStatus: true, pagePermissions: true },
    });

    await createAuditLog(req, {
      action: 'EMPLOYEE_PERMISSIONS_CHANGE',
      targetId: id,
      details: {
        changedBy: getActorName(req),
        employeeEmail: employee.email,
        previousPermissions: employee.pagePermissions ?? null,
        newPermissions: normalized,
      },
    });

    res.json({ success: true, employee: updated });
  } catch (error) {
    console.error('Update employee permissions error:', error);
    res.status(500).json({ error: 'Failed to update employee permissions' });
  }
});

// An employee's OWN permissions — used by the frontend router/nav guard.
// Employees may read their own access; they can never change it here.
router.get('/permissions/me', requireAdminOrEmployee, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, role: true, pagePermissions: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ role: user.role, pagePermissions: user.pagePermissions ?? null, pages: EMPLOYEE_PAGES });
  } catch (error) {
    console.error('Own permissions error:', error);
    res.status(500).json({ error: 'Failed to load permissions' });
  }
});

// Create employee (SUPER_ADMIN only)
router.post('/employees', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, email, password, status } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Only allow creating EMPLOYEE accounts - never SUPER_ADMIN
    const passwordHash = await hashPassword(password);

    // Generate unique username
    let username = name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20);
    let usernameAttempt = username;
    let counter = 1;
    while (await prisma.user.findUnique({ where: { username: usernameAttempt } })) {
      usernameAttempt = `${username}${counter}`;
      counter++;
    }

    // Generate unique referral code
    let referralCode = '';
    do {
      referralCode = 'CMH' + crypto.randomBytes(4).toString('hex').toUpperCase();
    } while (await prisma.referral.findUnique({ where: { code: referralCode } }));

    const employee = await prisma.user.create({
      data: {
        id: uuid(),
        email: normalizedEmail,
        passwordHash,
        fullName: name,
        username: usernameAttempt,
        authMethod: 'EMAIL',
        referralCode,
        status: 'active',
        employeeStatus: status === 'disabled' ? 'disabled' : 'active',
        role: 'EMPLOYEE',
        platformBalance: 0,
        updatedAt: new Date(),
      },
      select: {
        id: true, email: true, fullName: true, username: true,
        role: true, employeeStatus: true, status: true, createdAt: true,
      },
    });

    await createAuditLog(req, {
      action: 'EMPLOYEE_CREATE',
      targetId: employee.id,
      details: { email: employee.email, name: employee.fullName, createdBy: getActorName(req) },
    });

    res.status(201).json({ success: true, employee });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// Update employee (SUPER_ADMIN only)
router.patch('/employees/:id', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, status, role } = req.body;

    const employee = await prisma.user.findUnique({ where: { id } });
    if (!employee || employee.role !== 'EMPLOYEE') {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Prevent changing role to SUPER_ADMIN
    if (role && role !== 'EMPLOYEE') {
      return res.status(400).json({ error: 'Employees can only have the EMPLOYEE role' });
    }

    const data: Record<string, unknown> = { updatedAt: new Date() };

    if (name) data.fullName = name;
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const existing = await prisma.user.findFirst({
        where: { email: normalizedEmail, id: { not: id } },
      });
      if (existing) return res.status(400).json({ error: 'Email already in use' });
      data.email = normalizedEmail;
    }
    if (password) {
      if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
      data.passwordHash = await hashPassword(password);
    }
    if (status) {
      if (!['active', 'disabled'].includes(status)) return res.status(400).json({ error: 'Invalid employee status' });
      data.employeeStatus = status;
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, email: true, fullName: true, username: true,
        role: true, employeeStatus: true, status: true, updatedAt: true,
      },
    });

    await createAuditLog(req, {
      action: 'EMPLOYEE_UPDATE',
      targetId: id,
      details: { updatedFields: Object.keys(data).filter(k => k !== 'updatedAt'), updatedBy: getActorName(req) },
    });

    res.json({ success: true, employee: updated });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Disable/enable employee (SUPER_ADMIN only)
router.patch('/employees/:id/status', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be active or disabled' });
    }

    const employee = await prisma.user.findUnique({ where: { id } });
    if (!employee || employee.role !== 'EMPLOYEE') {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { employeeStatus: status, updatedAt: new Date() },
      select: { id: true, email: true, fullName: true, role: true, employeeStatus: true },
    });

    await createAuditLog(req, {
      action: 'EMPLOYEE_STATUS_CHANGE',
      targetId: id,
      details: { newStatus: status, changedBy: getActorName(req) },
    });

    res.json({ success: true, employee: updated });
  } catch (error) {
    console.error('Employee status error:', error);
    res.status(500).json({ error: 'Failed to update employee status' });
  }
});

// Delete/revoke employee (SUPER_ADMIN only) - soft delete to preserve audit logs
router.delete('/employees/:id', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const employee = await prisma.user.findUnique({ where: { id } });
    if (!employee || employee.role !== 'EMPLOYEE') {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await prisma.user.update({
      where: { id },
      data: { employeeStatus: 'disabled', status: 'suspended', updatedAt: new Date() },
    });

    await createAuditLog(req, {
      action: 'EMPLOYEE_REVOKE',
      targetId: id,
      details: { revokedBy: getActorName(req), email: employee.email },
    });

    res.json({ success: true, message: 'Employee account revoked' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Failed to revoke employee' });
  }
});

// Reset employee password (SUPER_ADMIN only)
router.post('/employees/:id/reset-password', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const employee = await prisma.user.findUnique({ where: { id } });
    if (!employee || employee.role !== 'EMPLOYEE') {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id }, data: { passwordHash, updatedAt: new Date() } });

    await createAuditLog(req, {
      action: 'EMPLOYEE_PASSWORD_RESET',
      targetId: id,
      details: { resetBy: getActorName(req) },
    });

    res.json({ success: true, message: 'Employee password reset successfully' });
  } catch (error) {
    console.error('Reset employee password error:', error);
    res.status(500).json({ error: 'Failed to reset employee password' });
  }
});

// ============ ADMIN DASHBOARD (SUPER_ADMIN or EMPLOYEE) ============
router.get('/dashboard', requireAdminOrEmployee, requirePage('dashboard'), async (_req, res) => {
  try {
    // ANALYSIS SCOPE: every flow metric below is restricted to NORMAL users.
    // Staff accounts (SUPER_ADMIN / ADMIN / EMPLOYEE) hold house liquidity,
    // correction credits and internal top-ups — none of that is customer
    // volume, so it must never appear in the Analysis dashboard figures.
    const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'];
    const excludeStaffOwner = {
      User: { role: { mode: 'insensitive' as const, notIn: STAFF_ROLES } },
    };

    const [totalUsers, activeMiners, totalDeposits, totalWithdrawals, totalMinedEarnings, totalRevenue, miningPlans, referrals, treasuryWallets] = await Promise.all([
      prisma.user.count(),
      prisma.miningPurchase.count({ where: { status: 'active', ...excludeStaffOwner } }),
      // Only count deposits that actually funded the user. Rejected deposits
      // must NOT show in analytics, and pending ones haven't been credited
      // yet (they are credited only on approval), so both are excluded.
      // Analytics are reported in USD: deposits can be paid in any currency
      // (USDT, BTC, GHS...), so sum the locked `usdAmount` stored at
      // submission time. This keeps the admin Analysis dashboard
      // currency-consistent regardless of the mix of payment currencies.
      prisma.deposit.aggregate({
        _sum: { usdAmount: true },
        where: { status: { in: ['approved', 'completed'] }, ...excludeStaffOwner },
      }),
      // Only SUCCESSFUL withdrawals count as payouts. Rejected withdrawals
      // return the funds to the user's balance, so they must not inflate the
      // payout total. Pending ones are still held (not yet paid out).
      prisma.withdrawal.aggregate({
        _sum: { amount: true },
        where: { status: { in: ['approved', 'completed'] }, ...excludeStaffOwner },
      }),
      // Total mined earnings: every completed mining reward transaction
      // credited to normal users. Tracked INDEPENDENTLY of deposits so the
      // Analysis "Net Balance" can include legitimate mining profit — users
      // may withdraw more than they deposited, which must never make any
      // analytics value negative.
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'mining', status: 'completed', ...excludeStaffOwner },
      }),
      // Plan sales are stored as NEGATIVE amounts on user transactions
      // (money leaving the USER's balance), for both mining plans ('purchase')
      // and hash renting ('hash_renting'). Flip the sign below so this metric
      // reports positive platform REVENUE from sales.
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: { in: ['purchase', 'hash_renting'] }, ...excludeStaffOwner } }),
      prisma.miningPlan.count(),
      prisma.referral.aggregate({ _sum: { totalEarned: true }, where: { ...excludeStaffOwner } }),
      prisma.treasuryWallet.findMany(),
    ]);


    res.json({
      totalUsers,
      activeMiners,
      // Analytics values must NEVER be negative — clamp every independent
      // total at zero (e.g. legacy/corrupt records cannot drag a metric under 0).
      totalDeposits: Math.max(0, Number(totalDeposits._sum.usdAmount || 0)),
      totalWithdrawals: Math.max(0, Number(totalWithdrawals._sum.amount || 0)),
      totalMinedEarnings: Math.max(0, Number(totalMinedEarnings._sum.amount || 0)),
      // Negate because sale transactions are stored as negative amounts
      totalRevenue: totalRevenue._sum.amount ? -Number(totalRevenue._sum.amount) : 0,
      miningPlans,
      referralEarnings: referrals._sum.totalEarned || 0,
      treasuryWallets,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to load admin dashboard' });
  }
});

// ============ USER MANAGEMENT (SUPER_ADMIN or EMPLOYEE) ============
router.get('/users', requireAdminOrEmployee, requirePage('users'), async (req, res) => {
  try {
    const { search, status } = req.query;
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { walletAddress: { contains: String(search) } },
        { username: { contains: String(search) } },
      ];
    }
    if (status) where.status = String(status);

    const users = await prisma.user.findMany({
      where,
      include: {
        Wallet: true,
        _count: { select: { Transaction: true, Deposit: true, Withdrawal: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Annotate each account: is it a protected admin? can the current actor
    // manage it? The frontend uses these to hide restricted actions, but the
    // backend still enforces them independently on every mutation route.
    const actorRole = (req as AuthRequest).user?.role;
    const annotated = users.map((user) => ({
      ...user,
      protectedRole: isProtectedRole(user.role),
      role: user.role || 'user',
      canManage: !isTargetProtectedFrom(actorRole, user.role),
    }));

    res.json({ users: annotated });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// Change a user's account status (ban / suspend / activate)
router.patch('/users/:id/status', requireAdminOrEmployee, requirePage('users'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    // SERVER-SIDE PROTECTION: employees/admins can never ban, suspend,
    // unban or otherwise change the status of a protected admin account.
    if (forbidRestrictedAction(req, res, target.role)) return;

    const previousStatus = target.status;
    const updated = await prisma.user.update({ where: { id }, data: { status } });

    await createAuditLog(req, {
      action: 'USER_STATUS_CHANGE',
      targetType: 'user',
      targetId: id,
      details: {
        status,
        previousStatus,
        adminName: getActorName(req),
        actorRole: req.user?.role,
        actorUsername: req.user?.username,
      },
    });

    res.json({ success: true, user: updated });
  } catch (error) {
    console.error('User status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// ============ ADMIN CREDIT SYSTEM (SUPER_ADMIN ONLY - wallet sensitive) ============
router.post('/users/:id/credit', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { amount, balanceType, reason } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Credit amount must be greater than 0' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Protected-account guard — even super admins cannot credit other admins.
    if (forbidRestrictedAction(req, res, user.role)) return;

    const creditAmount = Number(amount);
    const type = balanceType || 'platformBalance';
    const validTypes = ['platformBalance', 'totalEarned', 'totalDeposited'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid balance type' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        [type]: { increment: creditAmount },
        // Real (withdrawable) credits land in the platform balance and the
        // matching per-asset balance so they are available for withdrawal and
        // show up consistently everywhere in the app. Counter-only types
        // (totalEarned / totalDeposited) are left untouched.
        ...(type === 'platformBalance'
          ? { [getBalanceField('USDT')]: { increment: creditAmount } }
          : {}),
      },
    });

    await prisma.transaction.create({
      data: {
        id: uuid(), userId: id, type: 'admin_credit', amount: creditAmount,
        currency: 'USDT', chain: user.chain || 'ethereum', status: 'completed',
        metadata: { balanceType: type, reason: reason || 'Admin credit', adminId: req.user?.id },
      },
    });

    await prisma.notification.create({
      data: {
        id: uuid(), userId: id, type: 'credit', title: 'Account Credited',
        message: `Your account has been credited with ${creditAmount.toFixed(2)} USDT.${reason ? ` Reason: ${reason}` : ''}`,
      },
    });

    await createAuditLog(req, {
      action: 'ADMIN_CREDIT',
      targetType: 'user',
      targetId: id,
      details: { amount: creditAmount, balanceType: type, reason: reason || null, adminName: getActorName(req) },
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Admin credit error:', error);
    res.status(500).json({ error: 'Failed to credit user' });
  }
});

// Debit (deduct / reverse) a user balance — records who performed it.
// SUPER_ADMIN only (wallet-sensitive).
router.post('/users/:id/debit', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { amount, balanceType, reason } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Debit amount must be greater than 0' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Protected-account guard — super admins cannot debit other admins.
    if (forbidRestrictedAction(req, res, user.role)) return;

    const debitAmount = Number(amount);
    const type = balanceType || 'platformBalance';
    const validTypes = ['platformBalance', 'totalEarned', 'totalDeposited'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid balance type' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        [type]: { decrement: debitAmount },
        ...(type === 'platformBalance'
          ? { [getBalanceField('USDT')]: { decrement: debitAmount } }
          : {}),
      },
    });

    await prisma.transaction.create({
      data: {
        id: uuid(), userId: id, type: 'admin_debit', amount: -debitAmount,
        currency: 'USDT', chain: user.chain || 'ethereum', status: 'completed',
        metadata: { balanceType: type, reason: reason || 'Admin debit', adminId: req.user?.id },
      },
    });

    await prisma.notification.create({
      data: {
        id: uuid(), userId: id, type: 'debit', title: 'Account Debited',
        message: `Your account was debited by ${debitAmount.toFixed(2)} USDT.${reason ? ` Reason: ${reason}` : ''}`,
      },
    });

    await createAuditLog(req, {
      action: 'ADMIN_DEBIT',
      targetType: 'user',
      targetId: id,
      details: { amount: debitAmount, balanceType: type, reason: reason || null, adminName: getActorName(req) },
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Admin debit error:', error);
    res.status(500).json({ error: 'Failed to debit user' });
  }
});

// Reset a user's (normal account's) password — guarded against admins.
router.post('/users/:id/reset-password', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (forbidRestrictedAction(req, res, target.role)) return;

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id }, data: { passwordHash, updatedAt: new Date() } });

    await createAuditLog(req, {
      action: 'USER_PASSWORD_RESET',
      targetType: 'user',
      targetId: id,
      details: { resetBy: getActorName(req), actorRole: req.user?.role },
    });

    res.json({ success: true, message: 'User password reset successfully' });
  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({ error: 'Failed to reset user password' });
  }
});

router.get('/users/:id/mining', requireAdminOrEmployee, requirePage('users'), async (req, res) => {
  try {
    const { id } = req.params;
    const [purchases, sessions] = await Promise.all([
      prisma.miningPurchase.findMany({ where: { userId: id }, include: { MiningPlan: true }, orderBy: { createdAt: 'desc' } }),
      prisma.hashRentingPurchase.findMany({ where: { userId: id }, include: { HashRentingPlan: true }, orderBy: { createdAt: 'desc' } }),
    ]);
    res.json({ purchases, hashRentingPurchases: sessions });
  } catch (error) {
    console.error('User mining error:', error);
    res.status(500).json({ error: 'Failed to load user mining data' });
  }
});

// ============ MINING PLAN MANAGEMENT ============
router.get('/plans', requireAdminOrEmployee, requirePage('mining'), async (_req, res) => {
  try {
    const plans = await prisma.miningPlan.findMany({ orderBy: { price: 'asc' } });
    res.json({ plans });
  } catch (error) {
    console.error('Admin plans error:', error);
    res.status(500).json({ error: 'Failed to load plans' });
  }
});

router.post('/plans', requireSuperAdmin, async (req, res) => {
  try {
    const { name, description, price, currency, chain, hashRate, dailyRate, durationDays, bonusReward, referralBonus, expectedReturn, maxPurchasesPerUser } = req.body;
    const plan = await prisma.miningPlan.create({
      data: {
        id: uuid(), name, description,
        price: Number(price), currency: currency || 'USDT', chain: chain || 'ethereum',
        hashRate: Number(hashRate), dailyRate: Number(dailyRate), durationDays: Number(durationDays),
        bonusReward: Number(bonusReward || 0), referralBonus: Number(referralBonus || 0),
        expectedReturn: Number(expectedReturn || 0),
        // Blank / 0 / invalid means "no limit" for how often a single user can buy this plan
        maxPurchasesPerUser: maxPurchasesPerUser !== undefined && maxPurchasesPerUser !== null && maxPurchasesPerUser !== '' && Number(maxPurchasesPerUser) > 0
          ? Math.floor(Number(maxPurchasesPerUser))
          : null,
        updatedAt: new Date(),
      },
    });
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

router.patch('/plans/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.price) data.price = Number(data.price);
    if (data.hashRate) data.hashRate = Number(data.hashRate);
    if (data.dailyRate) data.dailyRate = Number(data.dailyRate);
    if (data.durationDays) data.durationDays = Number(data.durationDays);
    if (data.bonusReward) data.bonusReward = Number(data.bonusReward);
    if (data.referralBonus) data.referralBonus = Number(data.referralBonus);
    if (data.expectedReturn) data.expectedReturn = Number(data.expectedReturn);
    if (data.maxPurchasesPerUser !== undefined) {
      // Empty string / 0 clears the limit (unlimited purchases per user)
      const parsedMax = Number(data.maxPurchasesPerUser);
      data.maxPurchasesPerUser = data.maxPurchasesPerUser !== null && data.maxPurchasesPerUser !== '' && parsedMax > 0
        ? Math.floor(parsedMax)
        : null;
    }

    const plan = await prisma.miningPlan.update({ where: { id }, data });
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

router.delete('/plans/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await prisma.miningPlan.findUnique({ where: { id } });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const activePurchases = await prisma.miningPurchase.count({ where: { planId: id, status: 'active' } });

    if (activePurchases > 0) {
      const updatedPlan = await prisma.miningPlan.update({
        where: { id }, data: { active: false, updatedAt: new Date() },
      });
      return res.json({ success: true, softDeleted: true, plan: updatedPlan, message: 'Plan is still active for users and was deactivated instead of being deleted.' });
    }

    await prisma.miningPlan.delete({ where: { id } });
    res.json({ success: true, deleted: true });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

// ============ RECEIVING WALLET MANAGEMENT (SUPER_ADMIN ONLY - wallet sensitive) ============
router.get('/treasury', requireSuperAdmin, async (_req, res) => {
  try {
    const wallets = await prisma.treasuryWallet.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ wallets });
  } catch (error) {
    console.error('Treasury wallets error:', error);
    res.status(500).json({ error: 'Failed to load treasury wallets' });
  }
});

router.get('/receiving-wallets', requireSuperAdmin, async (_req, res) => {
  try {
    const wallets = await prisma.treasuryWallet.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ wallets });
  } catch (error) {
    console.error('Receiving wallets error:', error);
    res.status(500).json({ error: 'Failed to load receiving wallets' });
  }
});

router.post('/receiving-wallets', requireSuperAdmin, async (req, res) => {
  try {
    const { network, address, label, supportedCurrency, active } = req.body;
    if (!['solana', 'ethereum', 'bnb'].includes(network)) {
      return res.status(400).json({ error: 'Invalid network. Must be solana, ethereum, or bnb.' });
    }
    if (!address) return res.status(400).json({ error: 'Address is required' });

    const existing = await prisma.treasuryWallet.findUnique({ where: { network } });
    if (existing) return res.status(400).json({ error: `A receiving wallet for ${network} already exists` });

    const wallet = await prisma.treasuryWallet.create({
      data: {
        id: uuid(), network, address, label,
        supportedCurrency: supportedCurrency || 'USDT',
        active: active !== undefined ? Boolean(active) : true,
        updatedAt: new Date(),
      },
    });
    res.json({ success: true, wallet });
  } catch (error) {
    console.error('Create receiving wallet error:', error);
    res.status(500).json({ error: 'Failed to create receiving wallet' });
  }
});

router.patch('/receiving-wallets/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { address, label, supportedCurrency, active } = req.body;
    const wallet = await prisma.treasuryWallet.update({
      where: { id },
      data: {
        address: address || undefined, label: label || undefined,
        supportedCurrency: supportedCurrency || undefined,
        active: active !== undefined ? Boolean(active) : undefined,
      },
    });
    res.json({ success: true, wallet });
  } catch (error) {
    console.error('Update receiving wallet error:', error);
    res.status(500).json({ error: 'Failed to update receiving wallet' });
  }
});

router.delete('/receiving-wallets/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.treasuryWallet.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete receiving wallet error:', error);
    res.status(500).json({ error: 'Failed to delete receiving wallet' });
  }
});

// ============ PAYMENT ACCOUNT MANAGEMENT (SUPER_ADMIN ONLY - wallet sensitive) ============
router.get('/payment-accounts', requireSuperAdmin, async (_req, res) => {
  try {
    const accounts = await prisma.paymentAccount.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
    res.json({ paymentAccounts: accounts });
  } catch (error) {
    console.error('Payment accounts error:', error);
    res.status(500).json({ error: 'Failed to load payment accounts' });
  }
});

router.post('/payment-accounts', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { type, name, label, bankName, accountHolder, accountNumber, walletAddress, network, currency, isDefault, active, sortOrder } = req.body;
    const validTypes = ['bank', 'crypto', 'momo', 'opay', 'other'];
    const normalizedType = validTypes.includes(type) ? type : 'other';

    if (!name || !accountNumber) {
      return res.status(400).json({ error: 'Account name and account number are required.' });
    }

    const payload = {
      id: uuid(), type: normalizedType, name, label: label || name,
      bankName: bankName || null, accountHolder: accountHolder || null,
      accountNumber: accountNumber || null, walletAddress: walletAddress || null,
      network: network || null, currency: currency || 'USDT',
      isDefault: Boolean(isDefault), active: active !== undefined ? Boolean(active) : true,
      sortOrder: Number(sortOrder || 0), updatedAt: new Date(),
    };

    if (payload.isDefault) {
      await prisma.paymentAccount.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }

    const account = await prisma.paymentAccount.create({ data: payload });

    await createAuditLog(req, {
      action: 'PAYMENT_ACCOUNT_CREATE',
      targetId: account.id,
      details: { name: account.name, type: account.type, adminName: getActorName(req) },
    });

    res.status(201).json({ success: true, paymentAccount: account });
  } catch (error) {
    console.error('Create payment account error:', error);
    res.status(500).json({ error: 'Failed to create payment account' });
  }
});

router.patch('/payment-accounts/:id', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { type, name, label, bankName, accountHolder, accountNumber, walletAddress, network, currency, isDefault, active, sortOrder } = req.body;
    const validTypes = ['bank', 'crypto', 'momo', 'opay', 'other'];
    const normalizedType = type && validTypes.includes(type) ? type : type === 'card' ? 'other' : undefined;

    const data: Record<string, unknown> = {
      type: normalizedType || undefined, name: name || undefined, label: label || undefined,
      bankName: bankName || undefined, accountHolder: accountHolder || undefined,
      accountNumber: accountNumber || undefined, walletAddress: walletAddress || undefined,
      network: network || undefined, currency: currency || undefined,
      isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined,
      active: active !== undefined ? Boolean(active) : undefined,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      updatedAt: new Date(),
    };

    if (data.isDefault === true) {
      await prisma.paymentAccount.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }

    const account = await prisma.paymentAccount.update({ where: { id }, data });

    await createAuditLog(req, {
      action: 'PAYMENT_ACCOUNT_UPDATE',
      targetId: id,
      details: { updatedFields: Object.keys(data).filter((key) => data[key] !== undefined), adminName: getActorName(req) },
    });

    res.json({ success: true, paymentAccount: account });
  } catch (error) {
    console.error('Update payment account error:', error);
    res.status(500).json({ error: 'Failed to update payment account' });
  }
});

router.delete('/payment-accounts/:id', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.paymentAccount.delete({ where: { id } });

    await createAuditLog(req, {
      action: 'PAYMENT_ACCOUNT_DELETE',
      targetId: id,
      details: { adminName: getActorName(req) },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete payment account error:', error);
    res.status(500).json({ error: 'Failed to delete payment account' });
  }
});

// ============ FINANCIAL MANAGEMENT ============

// Deposits - employees can view and process deposits
router.get('/deposits', requireAdminOrEmployee, requirePage('deposits'), async (req: AuthRequest, res) => {
  try {
    const deposits = await prisma.deposit.findMany({
      include: {
        User: { select: { username: true, walletAddress: true, email: true } },
        PaymentAccount: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    // RBAC: approval/action history (who processed, when, internal notes) is
    // visible ONLY to the main Admin. Employees receive sanitized records so
    // they can work their pending queue but cannot inspect action history —
    // enforced server-side, not just hidden in the UI.
    res.json({ deposits: sanitizeDepositsForViewer(deposits, req.user?.role) });
  } catch (error) {
    console.error('Admin deposits error:', error);
    res.status(500).json({ error: 'Failed to load deposits' });
  }
});

// Approve/reject deposits - employees can do this (if they have Deposits access)
router.patch('/deposits/:id', requireAdminOrEmployee, requirePage('deposits'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid deposit status' });
    }

    const deposit = await prisma.deposit.findUnique({
      where: { id },
      include: { User: { select: { role: true } } },
    });
    if (!deposit) return res.status(404).json({ error: 'Deposit not found' });

    // SERVER-SIDE PROTECTION: approving a deposit CREDITS the deposit
    // owner's balance, so staff must never be able to process a deposit
    // that belongs to a protected account of equal or higher privilege
    // (e.g. an employee approving an admin's own deposit to inflate its
    // balance). This closes the indirect-credit bypass on this
    // employee-reachable route.
    if (forbidRestrictedAction(req, res, deposit.User?.role)) return;

    const actorName = getActorName(req);
    const actorRole = req.user?.role || 'user';
    const previousStatus = deposit.status;

    if (status === 'rejected') {
      const updated = await prisma.deposit.update({
        where: { id },
        data: {
          status: 'rejected', note: adminNote || deposit.note, approvedAt: null,
          processedById: req.user?.id, processedByName: actorName, processedByRole: actorRole,
        },
      });

      await prisma.notification.create({
        data: {
          id: uuid(), userId: deposit.userId, type: 'deposit', title: 'Deposit Rejected',
          message: `Your deposit request for ${Number(deposit.amount).toFixed(2)} ${deposit.currency} was rejected.${adminNote ? ` Reason: ${adminNote}` : ''}`,
        },
      });

      await createAuditLog(req, {
        action: 'DEPOSIT_REJECT',
        targetType: 'deposit',
        targetId: id,
        details: {
          transactionId: id, employeeId: req.user?.id, employeeName: actorName, employeeRole: actorRole,
          previousStatus, newStatus: 'rejected',
          amount: Number(deposit.amount), currency: deposit.currency,
        },
      });

      // RBAC: employees may perform the approval but must not receive the
      // action/attribution fields back (only the main Admin sees those).
      return res.json({ success: true, deposit: sanitizeDepositForViewer(updated, req.user?.role) });
    }

    if (status === 'approved' || status === 'completed') {
      if (deposit.status === 'approved' || deposit.status === 'completed') {
        return res.status(400).json({ error: 'Deposit has already been processed' });
      }

      // Credit the LOCKED USD amount stored with the deposit at submission
      // time — never recalculate using a newer exchange rate. Legacy deposits
      // created before currency conversion have no usdAmount and keep the
      // original behaviour (credit their raw amount).
      const originalAmount = Number(deposit.amount);
      const creditedAmount = deposit.usdAmount != null ? Number(deposit.usdAmount) : originalAmount;

      const processed = await prisma.$transaction([
        prisma.user.update({
          where: { id: deposit.userId },
          data: {
            platformBalance: { increment: creditedAmount },
            // Credit the withdrawable per-asset balance too (USDT is the base
            // currency for USD-valued deposits) so deposited funds are
            // immediately available for withdrawal and stay consistent with
            // the mining/admin flows across the whole app.
            [getBalanceField('USDT')]: { increment: creditedAmount },
            totalDeposited: { increment: creditedAmount },
          },
        }),
        prisma.deposit.update({
          where: { id },
          data: {
            status: status === 'completed' ? 'completed' : 'approved',
            approvedAt: new Date(),
            confirmedAt: status === 'completed' ? new Date() : deposit.confirmedAt,
            note: adminNote || deposit.note,
            processedById: req.user?.id, processedByName: actorName, processedByRole: actorRole,
          },
        }),
        prisma.transaction.create({
          data: {
            id: uuid(), userId: deposit.userId, type: 'deposit', amount: creditedAmount,
            currency: 'USD', chain: deposit.chain || 'ethereum',
            txHash: deposit.txHash || null, status: 'completed',
            metadata: {
              depositId: deposit.id, source: deposit.method || 'manual', paymentAccountId: deposit.paymentAccountId,
              originalAmount, originalCurrency: deposit.currency,
              exchangeRate: deposit.exchangeRate != null ? Number(deposit.exchangeRate) : null,
              usdAmount: creditedAmount, rateSource: deposit.rateSource || null,
            },
          },
        }),
        prisma.notification.create({
          data: {
            id: uuid(), userId: deposit.userId, type: 'deposit', title: 'Deposit Approved',
            message: `Your ${deposit.currency} deposit of ${originalAmount.toFixed(2)} (≈ $${creditedAmount.toFixed(2)} USD) has been approved and $${creditedAmount.toFixed(2)} USD has been credited to your balance.`,
          },
        }),
      ]);

      await createAuditLog(req, {
        action: 'DEPOSIT_APPROVE',
        targetType: 'deposit',
        targetId: id,
        details: {
          transactionId: id, employeeId: req.user?.id, employeeName: actorName, employeeRole: actorRole,
          previousStatus, newStatus: status === 'completed' ? 'completed' : 'approved',
          originalAmount, originalCurrency: deposit.currency,
          exchangeRate: deposit.exchangeRate != null ? Number(deposit.exchangeRate) : null,
          usdAmount: creditedAmount, rateSource: deposit.rateSource || null,
        },
      });

      // RBAC: strip action/attribution fields for non-admin actors.
      return res.json({ success: true, deposit: sanitizeDepositForViewer(processed[1], req.user?.role) });
    }

    const updated = await prisma.deposit.update({
      where: { id },
      data: { status, note: adminNote || deposit.note },
    });

    res.json({ success: true, deposit: sanitizeDepositForViewer(updated, req.user?.role) });
  } catch (error) {
    console.error('Deposit update error:', error);
    res.status(500).json({ error: 'Failed to update deposit' });
  }
});

// Withdrawals - employees can view, only SUPER_ADMIN can process
router.get('/withdrawals', requireAdminOrEmployee, requirePage('withdrawals'), async (req: AuthRequest, res) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      include: {
        User: { select: { id: true, username: true, walletAddress: true, email: true } },
        PayoutMethod: {
          select: {
            type: true, name: true, address: true, solanaAddress: true,
            momoNumber: true, momoName: true, bankName: true,
            accountNumber: true, accountHolder: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
      take: 100,
    });
    // RBAC: approval/action history (who processed, internal notes) is
    // visible ONLY to the main Admin — enforced server-side so employees
    // cannot retrieve it by calling the API directly.
    res.json({ withdrawals: sanitizeWithdrawalsForViewer(withdrawals, req.user?.role) });
  } catch (error) {
    console.error('Admin withdrawals error:', error);
    res.status(500).json({ error: 'Failed to load withdrawals' });
  }
});

router.patch('/withdrawals/:id', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote, txHash } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });

    const user = await prisma.user.findUnique({ where: { id: withdrawal.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // SERVER-SIDE PROTECTION: a withdrawal decision moves the OWNER's funds
    // (a rejection credits the balances back), so staff must never process a
    // withdrawal belonging to a protected account of equal or higher
    // privilege. Route is SUPER_ADMIN-only; this additionally blocks
    // admin-on-admin fund movements per the strict hierarchy.
    if (forbidRestrictedAction(req, res, user.role)) return;

    const actorName = getActorName(req);
    const actorRole = req.user?.role || 'user';
    const previousStatus = withdrawal.status;

    const transactionWhere = {
      userId: withdrawal.userId,
      type: 'withdrawal',
      metadata: { equals: { withdrawalId: withdrawal.id } },
    } as const;

    if (status === 'approved') {
      const updatedWithdrawal = await prisma.withdrawal.update({
        where: { id },
        data: {
          status: 'approved', adminNote: adminNote || undefined,
          processedById: req.user?.id, processedByName: actorName, processedByRole: actorRole,
        },
      });

      await prisma.notification.create({
        data: {
          id: uuid(), userId: withdrawal.userId, type: 'withdrawal', title: 'Withdrawal Approved',
          message: `Your withdrawal request for ${withdrawal.amount} ${withdrawal.currency} is approved and awaiting completion.`,
        },
      });

      await prisma.transaction.updateMany({ where: transactionWhere, data: { status: 'pending' } });

      await createAuditLog(req, {
        action: 'WITHDRAWAL_APPROVE',
        targetType: 'withdrawal',
        targetId: id,
        details: {
          transactionId: id, employeeId: req.user?.id, employeeName: actorName, employeeRole: actorRole,
          previousStatus, newStatus: 'approved',
          amount: Number(withdrawal.amount), currency: withdrawal.currency,
        },
      });

      return res.json({ success: true, withdrawal: updatedWithdrawal });
    }

    if (status === 'rejected') {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            platformBalance: { increment: withdrawal.amount },
            totalWithdrawn: { decrement: withdrawal.amount },
            // Restore the SAME per-asset balance that was debited at withdrawal time
            [getBalanceField(withdrawal.asset || 'USDT')]: { increment: withdrawal.amount },
          } as any,
        }),
        prisma.withdrawal.update({
          where: { id },
          data: {
            status: 'rejected', adminNote: adminNote || undefined, processedAt: new Date(),
            processedById: req.user?.id, processedByName: actorName, processedByRole: actorRole,
          },
        }),
        prisma.transaction.updateMany({ where: transactionWhere, data: { status: 'failed' } }),
        prisma.notification.create({
          data: {
            id: uuid(), userId: withdrawal.userId, type: 'withdrawal', title: 'Withdrawal Rejected',
            message: `Your withdrawal request for ${withdrawal.amount} ${withdrawal.currency} was rejected. Funds have been returned to your account.`,
          },
        }),
      ]);

      await createAuditLog(req, {
        action: 'WITHDRAWAL_REJECT',
        targetType: 'withdrawal',
        targetId: id,
        details: {
          transactionId: id, employeeId: req.user?.id, employeeName: actorName, employeeRole: actorRole,
          previousStatus, newStatus: 'rejected',
          amount: Number(withdrawal.amount), currency: withdrawal.currency,
        },
      });

      return res.json({ success: true, withdrawal: { ...withdrawal, status: 'rejected' } });
    }

    if (status === 'completed') {
      if (!txHash) {
        return res.status(400).json({ error: 'Transaction hash is required to complete a withdrawal' });
      }

      const updatedWithdrawal = await prisma.withdrawal.update({
        where: { id },
        data: {
          status: 'completed', txHash, adminNote: adminNote || undefined,
          processedAt: new Date(), processedById: req.user?.id, processedByName: actorName, processedByRole: actorRole,
        },
      });

      await prisma.transaction.updateMany({ where: transactionWhere, data: { status: 'completed', txHash } });

      await prisma.notification.create({
        data: {
          id: uuid(), userId: withdrawal.userId, type: 'withdrawal', title: 'Withdrawal Completed',
          message: `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency} is complete.`,
        },
      });

      await createAuditLog(req, {
        action: 'WITHDRAWAL_COMPLETE',
        targetType: 'withdrawal',
        targetId: id,
        details: {
          transactionId: id, employeeId: req.user?.id, employeeName: actorName, employeeRole: actorRole,
          previousStatus, newStatus: 'completed',
          amount: Number(withdrawal.amount), currency: withdrawal.currency, txHash,
        },
      });

      return res.json({ success: true, withdrawal: updatedWithdrawal });
    }

    res.status(400).json({ error: 'Unsupported status transition' });
  } catch (error) {
    console.error('Withdrawal update error:', error);
    res.status(500).json({ error: 'Failed to update withdrawal' });
  }
});

// ============ SETTINGS (SUPER_ADMIN ONLY) ============
router.get('/settings', requireSuperAdmin, async (_req, res) => {
  try {
    const settings = await prisma.adminSetting.findMany();
    res.json({ settings });
  } catch (error) {
    console.error('Admin settings error:', error);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

router.put('/settings', requireSuperAdmin, async (req, res) => {
  try {
    const { key, value } = req.body;
    const setting = await prisma.adminSetting.upsert({
      where: { key },
      update: { value, updatedAt: new Date() },
      create: { id: uuid(), key, value, updatedAt: new Date() },
    });
    res.json({ success: true, setting });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// ============ AUDIT / ACTION LOG (SUPER_ADMIN or EMPLOYEE) ============
// Centralized activity + audit log used by the "Actions" tab. Read-only.
// Newest activity always first, with optional filtering by role / action group.
router.get('/audit-logs', requireSuperAdmin, async (req, res) => {
  try {
    const { role, action } = req.query;
    const take = Math.min(Number(req.query.take) || 100, 500);

    const where: Record<string, unknown> = {};
    if (role) {
      const normalized = String(role).toUpperCase();
      if (normalized === 'ADMIN' || normalized === 'SUPER_ADMIN') {
        where.actorRole = { in: ['SUPER_ADMIN', 'admin', 'Admin'] };
      } else if (normalized === 'EMPLOYEE') {
        where.actorRole = 'EMPLOYEE';
      }
    }
    if (action) {
      where.OR = [
        { action: { contains: String(action), mode: 'insensitive' } },
        { targetType: { contains: String(action), mode: 'insensitive' } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: { User: true },
      orderBy: { createdAt: 'desc' },
      take,
    });
    res.json({ logs });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ error: 'Failed to load audit logs' });
  }
});

// ============ ONE-TIME ADMIN BALANCE RESET (SAFEGUARD) ============
// Safely resets the affected admin account's balance to exactly 0.00.
//
// SAFETY GUARANTEES:
//  - Identifies the target admin ONLY via an explicit environment variable
//    (ADMIN_RESET_TARGET_EMAIL, ADMIN_RESET_TARGET_USERNAME or
//    ADMIN_RESET_TARGET_ID). Nothing is ever reset automatically.
//  - Only that ONE account is touched — normal user balances are never
//    affected. The target must be a SUPER_ADMIN (role == 'SUPER_ADMIN').
//  - Idempotent: runs at most once, ever, per account (guarded by the
//    "balanceResetAt" column). Re-running after a successful reset is a no-op.
//  - Every reset is recorded in the audit / action log as an administrative
//    correction.
router.post('/admin-balance-reset', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    // Env var that unambiguously identifies the affected admin account.
    const targetEnv = [
      process.env.ADMIN_RESET_TARGET_EMAIL,
      process.env.ADMIN_RESET_TARGET_USERNAME,
      process.env.ADMIN_RESET_TARGET_ID,
    ].find(Boolean);

    if (!targetEnv) {
      return res.status(400).json({
        error: 'No reset target configured. Set ADMIN_RESET_TARGET_EMAIL / ADMIN_RESET_TARGET_USERNAME / ADMIN_RESET_TARGET_ID to proceed.',
      });
    }

    // Resolve the target account by the strongest identifier present.
    const targetEmail = process.env.ADMIN_RESET_TARGET_EMAIL?.toLowerCase();
    const targetUsername = process.env.ADMIN_RESET_TARGET_USERNAME;
    const targetId = process.env.ADMIN_RESET_TARGET_ID;

    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(targetEmail ? [{ email: targetEmail as string }] : []),
          ...(targetUsername ? [{ username: targetUsername as string }] : []),
          ...(targetId ? [{ id: targetId as string }] : []),
        ],
      },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Reset target account was not found' });
    }

    // Hard safety: only an administrator account may be reset this way.
    if (String(targetUser.role).toUpperCase() !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Reset target is not an admin account; aborting.' });
    }

    // Idempotency guard — never reset twice.
    if (targetUser.balanceResetAt) {
      return res.status(409).json({ error: 'This admin balance has already been reset.' });
    }

    const before = {
      platformBalance: Number(targetUser.platformBalance || 0),
      balanceUSDT: Number(targetUser.balanceUSDT || 0),
      balanceBTC: Number(targetUser.balanceBTC || 0),
      balanceETH: Number(targetUser.balanceETH || 0),
      balanceMCCoin: Number(targetUser.balanceMCCoin || 0),
    };

    const resetNow = new Date();

    // Reset the four spendable balances and platform balance to exactly 0.
    // NOTE: totalDeposited / totalEarned / totalWithdrawn (historical counters)
    // are intentionally left untouched so accounting history is preserved.
    const updated = await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        platformBalance: 0,
        balanceUSDT: 0,
        balanceBTC: 0,
        balanceETH: 0,
        balanceMCCoin: 0,
        balanceResetAt: resetNow,
        updatedAt: resetNow,
      },
    });

    await createAuditLog(req, {
      action: 'ADMIN_BALANCE_RESET',
      targetType: 'user',
      targetId: targetUser.id,
      details: {
        reason: 'Administrative correction: reset affected admin account balance to 0.00',
        before,
        after: {
          platformBalance: 0,
          balanceUSDT: 0,
          balanceBTC: 0,
          balanceETH: 0,
          balanceMCCoin: 0,
        },
        performedBy: getActorName(req),
        actorRole: req.user?.role,
        resetAt: resetNow.toISOString(),
      },
    });

    res.json({
      success: true,
      message: 'Admin balance reset to 0.00 (administrative correction).',
      target: { id: targetUser.id, email: targetUser.email, username: targetUser.username, role: targetUser.role },
      before,
      after: { platformBalance: 0, balanceUSDT: 0, balanceBTC: 0, balanceETH: 0, balanceMCCoin: 0 },
    });
  } catch (error) {
    console.error('Admin balance reset error:', error);
    res.status(500).json({ error: 'Failed to reset admin balance' });
  }
});

// ============ SUPPORT SYSTEM (SUPER_ADMIN or EMPLOYEE) ============

// Get all support conversations - shared across staff
router.get('/support/tickets', requireAdminOrEmployee, requirePage('support'), async (_req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        User: { select: { id: true, username: true, walletAddress: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    const ticketsWithMessages = await Promise.all(
      tickets.map(async (ticket) => {
        const messages = await prisma.supportMessage.findMany({
          where: { ticketId: ticket.id },
          orderBy: { createdAt: 'asc' },
        });

        const unreadStaffMessages = messages.filter(m => m.senderRole === 'user' && !m.readByStaff).length;

        return {
          id: ticket.id,
          userId: ticket.userId,
          user: ticket.User,
          subject: ticket.subject,
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status,
          assignedStaffId: ticket.assignedStaffId,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
          unreadStaffMessages,
          responses: messages.map((msg) => ({
            id: msg.id,
            message: msg.message,
            createdAt: msg.createdAt,
            senderId: msg.senderId,
            senderRole: msg.senderRole,
            senderName: msg.senderName,
            isAdmin: msg.senderRole !== 'user',
            readByUser: msg.readByUser,
            readByStaff: msg.readByStaff,
          })),
        };
      })
    );

    res.json({ tickets: ticketsWithMessages });
  } catch (error) {
    console.error('Admin support tickets error:', error);
    res.status(500).json({ error: 'Failed to load support tickets' });
  }
});

// Get single conversation with full message history
router.get('/support/tickets/:ticketId', requireAdminOrEmployee, requirePage('support'), async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        User: { select: { id: true, username: true, walletAddress: true, email: true } },
        SupportMessage: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Mark staff messages as read
    await prisma.supportMessage.updateMany({
      where: { ticketId, senderRole: 'user', readByStaff: false },
      data: { readByStaff: true },
    });

    res.json({ ticket });
  } catch (error) {
    console.error('Admin support ticket detail error:', error);
    res.status(500).json({ error: 'Failed to load conversation' });
  }
});

// Update conversation status
router.patch('/support/tickets/:ticketId', requireAdminOrEmployee, requirePage('support'), async (req: AuthRequest, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    const validStatuses = ['open', 'pending', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const previousStatus = ticket.status;

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status, updatedAt: new Date() },
    });

    await createAuditLog(req, {
      action: 'SUPPORT_TICKET_STATUS',
      targetType: 'support_ticket',
      targetId: ticketId,
      details: {
        conversationId: ticketId, previousStatus, newStatus: status,
        employeeName: getActorName(req),
      },
    });

    res.json({ success: true, ticket: updated });
  } catch (error) {
    console.error('Update support ticket error:', error);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

// Reply to a conversation - shared across staff
router.post('/support/tickets/:ticketId/respond', requireAdminOrEmployee, requirePage('support'), async (req: AuthRequest, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { User: { select: { username: true, email: true } } },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const staffMessage = await prisma.supportMessage.create({
      data: {
        id: uuid(),
        ticketId,
        senderId: req.user?.id || '',
        senderRole: req.user?.role === 'SUPER_ADMIN' ? 'admin' : 'employee',
        senderName: getActorName(req),
        message: message.trim(),
        readByUser: false,
        readByStaff: true,
      },
    });

    // Update ticket status to pending if it's open
    if (ticket.status === 'open') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'pending', updatedAt: new Date() },
      });
    }

    // Create notification for user
    await prisma.notification.create({
      data: {
        id: uuid(),
        userId: ticket.userId,
        type: 'support',
        title: 'Support Team replied to your support conversation',
        message: `Support Team replied to your support conversation: "${ticket.subject}"`,
        conversationId: ticketId,
      },
    });

    await createAuditLog(req, {
      action: 'SUPPORT_ADMIN_RESPONSE',
      targetType: 'support_ticket',
      targetId: ticketId,
      details: {
        conversationId: ticketId, messageId: staffMessage.id,
        employeeName: getActorName(req), employeeRole: req.user?.role,
      },
    });

    res.json({ success: true, message: staffMessage });
  } catch (error) {
    console.error('Support admin response error:', error);
    res.status(500).json({ error: 'Failed to send response' });
  }
});

export default router;