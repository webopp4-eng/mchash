import { v4 as uuid } from 'uuid';
import prisma from '../lib/prisma';
import { getBalanceField } from './balances';

const DAY_MS = 24 * 60 * 60 * 1000;
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

async function accruePurchase(purchase: any, packageType: 'mining' | 'hash_renting') {
  const now = new Date();
  const plan = getPlanFromPurchase(purchase);
  if (!plan) {
    return;
  }

  const hashRate = Number(plan.hashRate ?? plan.hashPower ?? 0);
  const dailyRate = Number(plan.dailyRate ?? (Number(plan.expectedYield || 0) / 100 / Math.max(1, Number(plan.durationDays || 1))));
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
  const earned = (dailyEarnings * elapsedMs) / DAY_MS;
  const shouldComplete = purchase.endsAt <= now;

  if (shouldRecordMiningReward(earned)) {
    // Determine which per-asset balance to credit based on reward currency.
    // Uses the centralized helper so mining accrual always matches the same
    // column the withdrawal flow debits.
    const balanceField = getBalanceField(rewardCurrency);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: purchase.userId },
        data: {
          platformBalance: { increment: earned },
          [balanceField]: { increment: earned },
          totalEarned: { increment: earned },
        },
      }),
      prisma.miningSession.update({
        where: { id: session.id },
        data: {
          totalMined: { increment: earned },
          lastPayoutAt: accrualEnd,
          status: shouldComplete ? 'completed' : 'active',
        },
      }),
      prisma.transaction.create({
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
            accruedTo: accrualEnd.toISOString(),
            rewardCurrency,
          },
        },
      }),
    ]);
  }

  if (shouldComplete) {
    if (packageType === 'mining') {
      await prisma.miningPurchase.update({
        where: { id: purchase.id },
        data: {
          status: 'completed',
          completedAt: now,
        },
      });
    } else {
      await prisma.hashRentingPurchase.update({
        where: { id: purchase.id },
        data: {
          status: 'completed',
          completedAt: now,
        },
      });
    }

    await prisma.miningSession.updateMany({
      where: { userId: purchase.userId, purchaseId: purchase.id },
      data: { status: 'completed', lastPayoutAt: accrualEnd },
    });

    // Credit bonus reward if not yet credited
    const bonusReward = Number(plan.bonusReward || 0);
    if (shouldRecordMiningReward(bonusReward)) {
      const alreadyCredited = await prisma.transaction.findFirst({
        where: {
          userId: purchase.userId,
          type: 'mining',
          metadata: { path: ['bonusCredited'], equals: true },
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

export async function getActivePlan(userId: string) {
  await refreshMiningForUser(userId);
  const now = new Date();
  const [miningPurchase, hashRentingPurchase] = await Promise.all([
    prisma.miningPurchase.findFirst({
      where: { userId, status: 'active', endsAt: { gt: now } },
      include: { MiningPlan: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.hashRentingPurchase.findFirst({
      where: { userId, status: 'active', endsAt: { gt: now } },
      include: { HashRentingPlan: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const purchase = miningPurchase
    ? { ...miningPurchase, packageType: 'mining', plan: miningPurchase.MiningPlan }
    : hashRentingPurchase
    ? { ...hashRentingPurchase, packageType: 'hash_renting', plan: hashRentingPurchase.HashRentingPlan }
    : null;
  if (!purchase) return null;

  const session = await prisma.miningSession.findFirst({
    where: { userId, purchaseId: purchase.id },
    orderBy: { createdAt: 'desc' },
  });

  return buildMiningStats(purchase, session);
}

export async function getMiningSessions(userId: string) {
  return prisma.miningSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function processDailyPayouts() {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const user of users) {
    await refreshMiningForUser(user.id);
  }
  return prisma.transaction.findMany({
    where: { type: 'mining' },
    orderBy: { createdAt: 'desc' },
    take: users.length,
  });
}

export async function getReceivingWallet(chain: string): Promise<string | null> {
  const wallet = await prisma.treasuryWallet.findFirst({
    where: { network: chain, active: true },
    select: { address: true },
  });
  return wallet?.address || null;
}
