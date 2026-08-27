/**
 * ONE-TIME ADMIN BALANCE RESET (safeguard)
 *
 * Explicitly resets the affected ADMIN account's spendable balance to 0.00.
 *
 * SAFETY GUARANTEES:
 *  - Identifies the TARGET ONLY via an environment variable:
 *      ADMIN_RESET_TARGET_EMAIL    (preferred)
 *      ADMIN_RESET_TARGET_USERNAME
 *      ADMIN_RESET_TARGET_ID
 *    Nothing is ever reset automatically; this script must be run explicitly.
 *  - Only that ONE account is touched. The target MUST be a SUPER_ADMIN. Normal
 *    user balances are never modified.
 *  - Idempotent: runs at most once per account (guarded by "balanceResetAt").
 *  - Records the reset in the AuditLog as an administrative correction.
 *
 * Usage (from backend/):
 *   $env:ADMIN_RESET_TARGET_EMAIL='qwerty7yh@gmail.com'; node scripts/admin-balance-reset.js
 */
require('dotenv').config();
const { v4: uuid } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const targetEmail = (process.env.ADMIN_RESET_TARGET_EMAIL || '').toLowerCase();
  const targetUsername = process.env.ADMIN_RESET_TARGET_USERNAME || '';
  const targetId = process.env.ADMIN_RESET_TARGET_ID || '';

  if (!targetEmail && !targetUsername && !targetId) {
    console.error('✗ No reset target configured.');
    console.error('  Set ADMIN_RESET_TARGET_EMAIL, ADMIN_RESET_TARGET_USERNAME, or ADMIN_RESET_TARGET_ID.');
    process.exit(1);
  }

  console.log('Resolving target admin account...');
  const target = await prisma.user.findFirst({
    where: {
      OR: [
        ...(targetEmail ? [{ email: targetEmail }] : []),
        ...(targetUsername ? [{ username: targetUsername }] : []),
        ...(targetId ? [{ id: targetId }] : []),
      ],
    },
  });

  if (!target) {
    console.error('✗ Target admin account not found.');
    process.exit(1);
  }

  if (String(target.role).toUpperCase() !== 'SUPER_ADMIN') {
    console.error(`✗ ${target.email} is role "${target.role}" — only a SUPER_ADMIN may be reset. Aborting.`);
    process.exit(1);
  }

  if (target.balanceResetAt) {
    console.error(`✗ ${target.email} was already reset at ${target.balanceResetAt.toISOString()}. No-op.`);
    process.exit(0);
  }

  const before = {
    platformBalance: Number(target.platformBalance || 0),
    balanceUSDT: Number(target.balanceUSDT || 0),
    balanceBTC: Number(target.balanceBTC || 0),
    balanceETH: Number(target.balanceETH || 0),
    balanceMCCoin: Number(target.balanceMCCoin || 0),
  };
  const resetAt = new Date();

  console.log(`Target: ${target.email} (${target.username}, ${target.role})`);
  console.log('Before:', JSON.stringify(before));

  await prisma.$transaction([
    prisma.user.update({
      where: { id: target.id },
      data: {
        platformBalance: 0,
        balanceUSDT: 0,
        balanceBTC: 0,
        balanceETH: 0,
        balanceMCCoin: 0,
        balanceResetAt: resetAt,
        updatedAt: resetAt,
      },
    }),
    prisma.auditLog.create({
      data: {
        id: uuid(),
        userId: target.id,
        actorRole: 'SUPER_ADMIN',
        actorName: target.fullName || target.username,
        actorUsername: target.username,
        action: 'ADMIN_BALANCE_RESET',
        targetType: 'user',
        targetId: target.id,
        details: {
          reason: 'Administrative correction: reset affected admin account balance to 0.00',
          before,
          after: { platformBalance: 0, balanceUSDT: 0, balanceBTC: 0, balanceETH: 0, balanceMCCoin: 0 },
          performedBy: 'system-admin-reset-script',
          resetAt: resetAt.toISOString(),
        },
      },
    }),
  ]);

  console.log('✓ Balance reset to 0.00 (administrative correction). Only the target admin account was affected.');
  await prisma.$disconnect();
})().catch((e) => {
  console.error('Reset failed:', e.message);
  process.exit(1);
});
