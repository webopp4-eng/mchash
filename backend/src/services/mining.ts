import { v4 as uuid } from 'uuid';
import prisma from '../lib/prisma';
import { getBalanceField } from './balances';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MIN_ACCRUAL = 0.00000001;

function msBetween(start: Date, end: Date) {
  return Math.max(0, end.getTime() - start.getTime());
}

function getPlanFromPurchase(purchase: any) {
  return purchase?.plan ?? purchase?.MiningPlan ?? purchase?.HashRentingPlan ?? null;
}

export function getMiningRewardCurrency(currency?: string | null): string {
  const normalized = String(currency || '').trim();
  if (!normalized) return 'USDT';
  const lower = normalized.toLowerCase();
  if (lower === 'mc coin' || lower === 'mccoin' || lower === 'mc') return 'MC Coin';
  if (lower === 'eth' || lower === 'ethereum') return 'ETH';
  if (lower === 'usdt' || lower === 'tether') return 'USDT';
  if (lower === 'usdc') return 'USDC';
  return normalized;
}

export function shouldRecordMiningReward(amount: number): boolean {
  return Number.isFinite(amount) && amount > MIN_ACCRUAL;
}

export function calculateDailyEarnings(hashRate: number, dailyRate: number): number {
  return hashRate * dailyRate;
}

export function calculateTotalEarnings(dailyEarnings: number, durationDays: number): number {
  return dailyEarnings * durationDays;
}

export function formatRemainingTime(remainingMs: number): string {
  const days = Math.floor(remainingMs / DAY_MS);
  const hours = Math.floor((remainingMs % DAY_MS) / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function buildMiningStats(purchase: any, session?: any) {
  const now = new Date();
  const plan = getPlanFromPurchase(purchase);
  const startedAt = new Date(purchase.startedAt);
  const endsAt = new Date(purchase.endsAt);
  const totalMs = Math.max(1, endsAt.getTime() - startedAt.getTime());
  const elapsedMs = Math.min(totalMs, Math.max(0, now.getTime() - startedAt.getTime()));
  const remainingMs = Math.max(0, endsAt.getTime() - now.getTime());
  const hashRate = Number(plan?.hashRate ?? plan?.hashPower ?? 0);
  const dailyRate = Number(plan?.dailyRate ?? (Number(plan?.expectedYield || 0) / 100 / Math.max(1, Number(plan?.durationDays || 1))));
  const dailyEarnings = calculateDailyEarnings(hashRate, dailyRate);
  const totalEarnings = calculateTotalEarnings(dailyEarnings, Number(plan?.durationDays || 0));

  return {
    plan,
    purchase,
    session,
    hashRate,
    dailyEarnings,
    totalEarnings,
    earnedToDate: Number(session?.totalMined || 0),
    progress: Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)),
    progressPercent: Math.round(Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100))),
    remainingMs,
    elapsedMs,
    durationMs: totalMs,
    timeRemaining: formatRemainingTime(remainingMs),
    startedAt,
    endsAt,
    completedAt: purchase.completedAt || null,
    status: remainingMs > 0 ? 'active' : 'completed',
    packageType: purchase.packageType || 'mining',
  };
}

/**
 * Accrue mining rewards for a single purchase in WHOLE-HOUR batches.
 *
 * Rewards are credited once per completed hour of mining (server-side). The
 * write is guarded by a conditional update on `lastPayoutAt`, which makes the
 * operation idempotent: if the same hour is processed twice (retry, server
 * restart, or two workers racing), only the first claim succeeds and the
 * balance is credited exactly once.
 */
async function accruePurchase(purchase: any, packageType: 'mining' | 'hash_renting') {
  const now = new Date();
  const plan = getPlanFromPurchase(purchase);
  if (!plan) {
    return;
  }

  const hashRate = Number(plan.hashRate ?? plan.hashPower ?? 0);
  const dailyRate = Number(plan.dailyRate ?? (Number(plan.expectedYield || 0) / 100 / Math.max(1, Number(plan?.durationDays || 1))));
  const dailyEarnings = calculateDailyEarnings(hashRate, dailyRate);
  const rewardCurrency = getMiningRewardCurrency(plan.currency || purchase.currency);
  const accrualEnd = new Date(Math.min(now.getTime(), purchase.endsAt.getTime()));

  let session = await prisma.miningSession.findFirst({
    where: { userId: purchase.userId, purchaseId: purchase.id },
    orderBy: { createdAt: 'desc' },
  });

  if (!session) {
    session = await prisma.miningSession.create({
      data: {
        id: uuid(),
        userId: purchase.userId,
        purchaseId: purchase.id,
        hashRate,
        status: purchase.endsAt > now ? 'active' : 'completed',
        startedAt: purchase.startedAt,
        lastPayoutAt: purchase.startedAt,
      },
    });
  }

  const lastAccruedAt = session.lastPayoutAt || purchase.startedAt;
  const elapsedMs = msBetween(lastAccruedAt, accrualEnd);
  const shouldComplete = purchase.endsAt <= now;

  // Hourly batching: only credit once at least one FULL hour has elapsed.
  // On completion, the final partial hour is settled so no earnings are lost.
  const wholeHours = Math.floor(elapsedMs / HOUR_MS);
  const billableMs = shouldComplete ? elapsedMs : wholeHours * HOUR_MS;
  const earned = (dailyEarnings * billableMs) / DAY_MS;
  const newLastPayoutAt = shouldComplete
    ? accrualEnd
    : new Date(lastAccruedAt.getTime() + wholeHours * HOUR_MS);

  if (shouldRecordMiningReward(earned)) {
    // Determine which per-asset balance to credit based on reward currency.
    // Uses the centralized helper so mining accrual always matches the same
    // column the withdrawal flow debits.
    const balanceField = getBalanceField(rewardCurrency);

    // Idempotent claim: the session row is only updated when lastPayoutAt still
    // equals the value we computed from. Concurrent/retried runs lose the race
    // and skip crediting, preventing duplicate rewards.
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.miningSession.updateMany({
        where: { id: session!.id, lastPayoutAt: lastAccruedAt },
        data: {
          totalMined: { increment: earned },
          lastPayoutAt: newLastPayoutAt,
          status: shouldComplete ? 'completed' : 'active',
        },
      });

      if (claimed.count === 0) {
        // Another worker already processed this hour window — do not double-pay.
        return;
      }

      await tx.user.update({
        where: { id: purchase.userId },
        data: {
          platformBalance: { increment: earned },
          [balanceField]: { increment: earned },
          totalEarned: { increment: earned },
        },
      });

      await tx.transaction.create({
        data: {
          id: uuid(),
          userId: purchase.userId,
          type: 'mining',
          amount: earned,
          currency: rewardCurrency,
          chain: purchase.chain || plan.chain,
          status: 'completed',
          metadata: {
            purchaseId: purchase.id,
            planName: plan.name,
            packageType,
            accruedFrom: lastAccruedAt.toISOString(),
            accruedTo: newLastPayoutAt.toISOString(),
            rewardCurrency,
          },
        },
      });
    });
  } else if (shouldComplete) {
    await prisma.miningSession.updateMany({
      where: { userId: purchase.userId, purchaseId: purchase.id },
      data: { status: 'completed', lastPayoutAt: accrualEnd },
    });
  }

  if (shouldComplete) {
    if (packageType === 'mining') {
      await prisma.miningPurchase.updateMany({
        where: { id: purchase.id, status: 'active' },
        data: {
          status: 'completed',
          completedAt: now,
        },
      });
    } else {
      await prisma.hashRentingPurchase.updateMany({
        where: { id: purchase.id, status: 'active' },
        data: {
          status: 'completed',
          completedAt: now,
        },
      });
    }

    // Credit bonus reward if not yet credited (idempotent per purchase)
    const bonusReward = Number(plan.bonusReward || 0);
    if (shouldRecordMiningReward(bonusReward)) {
      const alreadyCredited = await prisma.transaction.findFirst({
        where: {
          userId: purchase.userId,
          type: 'mining',
          AND: [
            { metadata: { path: ['bonusCredited'], equals: true } },
            { metadata: { path: ['purchaseId'], equals: purchase.id } },
          ],
        },
      });
      if (!alreadyCredited) {
        const bonusCurrency = getMiningRewardCurrency(plan.currency || purchase.currency);
        const bonusBalanceField = getBalanceField(bonusCurrency);

        await prisma.$transaction([
          prisma.user.update({
            where: { id: purchase.userId },
            data: {
              platformBalance: { increment: bonusReward },
              [bonusBalanceField]: { increment: bonusReward },
              totalEarned: { increment: bonusReward },
            },
          }),
          prisma.transaction.create({
            data: {
              id: uuid(),
              userId: purchase.userId,
              type: 'mining',
              amount: bonusReward,
              currency: getMiningRewardCurrency(plan.currency || purchase.currency),
              chain: purchase.chain || plan.chain,
              status: 'completed',
              metadata: {
                purchaseId: purchase.id,
                planName: plan.name,
                packageType,
                bonusCredited: true,
                rewardCurrency: getMiningRewardCurrency(plan.currency || purchase.currency),
              },
            },
          }),
        ]);
      }
    }
  }
}

export async function refreshMiningForUser(userId: string) {
  const [miningPurchases, hashRentingPurchases] = await Promise.all([
    prisma.miningPurchase.findMany({
      where: { userId, status: 'active' },
      include: { MiningPlan: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.hashRentingPurchase.findMany({
      where: { userId, status: 'active' },
      include: { HashRentingPlan: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  for (const purchase of miningPurchases) {
    await accruePurchase({ ...purchase, packageType: 'mining', plan: purchase.MiningPlan }, 'mining');
  }

  for (const purchase of hashRentingPurchases) {
    await accruePurchase({ ...purchase, packageType: 'hash_renting', plan: purchase.HashRentingPlan }, 'hash_renting');
  }
}

/** All simultaneously-active plans for a user (multi-mining support). */
export async function getActivePlans(userId: string) {
  await refreshMiningForUser(userId);
  const now = new Date();
  const [miningPurchases, hashRentingPurchases] = await Promise.all([
    prisma.miningPurchase.findMany({
      where: { userId, status: 'active', endsAt: { gt: now } },
      include: { MiningPlan: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.hashRentingPurchase.findMany({
      where: { userId, status: 'active', endsAt: { gt: now } },
      include: { HashRentingPlan: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const purchases = [
    ...miningPurchases.map((p) => ({ ...p, packageType: 'mining', plan: p.MiningPlan })),
    ...hashRentingPurchases.map((p) => ({ ...p, packageType: 'hash_renting', plan: p.HashRentingPlan })),
  ];

  if (purchases.length === 0) return [];

  const sessions = await prisma.miningSession.findMany({
    where: { userId, purchaseId: { in: purchases.map((p) => p.id) } },
    orderBy: { createdAt: 'desc' },
  });
  const sessionByPurchase = new Map<string | null, any>();
  for (const s of sessions) {
    if (!sessionByPurchase.has(s.purchaseId)) sessionByPurchase.set(s.purchaseId, s);
  }

  return purchases.map((p) => buildMiningStats(p, sessionByPurchase.get(p.id)));
}

export async function getActivePlan(userId: string) {
  const plans = await getActivePlans(userId);
  // Most recently purchased plan remains the "primary" active plan.
  return plans.length > 0 ? plans[plans.length - 1] : null;
}

export async function getMiningSessions(userId: string) {
  return prisma.miningSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * SERVER-SIDE SCHEDULED HOURLY REWARD PROCESSOR.
 *
 * Called once per hour by the scheduler in src/index.ts (not by frontend
 * timers). Efficiently batches work so thousands of concurrent miners are
 * handled with a small number of DB round-trips:
 *  1. One query fetches all active purchases (+plans).
 *  2. One query fetches all their mining sessions.
 *  3. Only sessions with a completed hour since lastPayoutAt are processed,
 *     in chunks, using idempotent claims (see accruePurchase).
 */
export async function processHourlyRewards(): Promise<{ scanned: number; processed: number }> {
  const now = new Date();
  const dueBefore = new Date(now.getTime() - HOUR_MS);

  const [miningPurchases, hashRentingPurchases] = await Promise.all([
    prisma.miningPurchase.findMany({
      where: { status: 'active' },
      select: {
        id: true, userId: true, startedAt: true, endsAt: true,
        currency: true, chain: true, MiningPlan: true,
      },
    }),
    prisma.hashRentingPurchase.findMany({
      where: { status: 'active' },
      select: {
        id: true, userId: true, startedAt: true, endsAt: true,
        currency: true, chain: true, HashRentingPlan: true,
      },
    }),
  ]);

  const purchases = [
    ...miningPurchases.map((p) => ({ ...p, packageType: 'mining' as const, plan: (p as any).MiningPlan })),
    ...hashRentingPurchases.map((p) => ({ ...p, packageType: 'hash_renting' as const, plan: (p as any).HashRentingPlan })),
  ];

  if (purchases.length === 0) return { scanned: 0, processed: 0 };

  const sessions = await prisma.miningSession.findMany({
    where: { purchaseId: { in: purchases.map((p) => p.id) } },
    orderBy: { createdAt: 'desc' },
  });
  const sessionByPurchase = new Map<string | null, any>();
  for (const s of sessions) {
    if (!sessionByPurchase.has(s.purchaseId)) sessionByPurchase.set(s.purchaseId, s);
  }

  // Only purchases whose session is due for an hourly payout (or that ended).
  const due = purchases.filter((p) => {
    const session = sessionByPurchase.get(p.id);
    const lastPayout = session?.lastPayoutAt ? new Date(session.lastPayoutAt) : new Date(p.startedAt);
    return lastPayout <= dueBefore || p.endsAt <= now;
  });

  const CHUNK_SIZE = 50;
  let processed = 0;
  for (let i = 0; i < due.length; i += CHUNK_SIZE) {
    const chunk = due.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map((p) =>
        accruePurchase(
          { ...p, plan: (p as any).plan ?? (p as any).MiningPlan ?? (p as any).HashRentingPlan },
          p.packageType
        ).catch((err) => {
          console.error(`Hourly reward processing failed for purchase ${p.id}:`, err);
        })
      )
    );
    processed += chunk.length;
  }

  return { scanned: purchases.length, processed };
}

export async function getReceivingWallet(chain: string): Promise<string | null> {
  const wallet = await prisma.treasuryWallet.findFirst({
    where: { network: chain, active: true },
    select: { address: true },
  });
  return wallet?.address || null;
}