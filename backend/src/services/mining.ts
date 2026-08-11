import prisma from '../lib/prisma';

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_ACCRUAL = 0.00000001;

function msBetween(start: Date, end: Date) {
  return Math.max(0, end.getTime() - start.getTime());
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
  const plan = purchase.plan;
  const startedAt = new Date(purchase.startedAt);
  const endsAt = new Date(purchase.endsAt);
  const totalMs = Math.max(1, endsAt.getTime() - startedAt.getTime());
  const elapsedMs = Math.min(totalMs, Math.max(0, now.getTime() - startedAt.getTime()));
  const remainingMs = Math.max(0, endsAt.getTime() - now.getTime());
  const hashRate = Number(plan.hashRate ?? plan.hashPower ?? 0);
  const dailyRate = Number(plan.dailyRate ?? (Number(plan.expectedYield || 0) / 100 / Math.max(1, Number(plan.durationDays || 1))));
  const dailyEarnings = calculateDailyEarnings(hashRate, dailyRate);
  const totalEarnings = calculateTotalEarnings(dailyEarnings, Number(plan.durationDays || 0));

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
    status: remainingMs > 0 ? 'active' : 'completed',
    packageType: purchase.packageType || 'mining',
  };
}

async function accruePurchase(purchase: any, packageType: 'mining' | 'hash_renting') {
  const now = new Date();
  const plan = purchase.plan;
  const hashRate = Number(plan.hashRate ?? plan.hashPower ?? 0);
  const dailyRate = Number(plan.dailyRate ?? (Number(plan.expectedYield || 0) / 100 / Math.max(1, Number(plan.durationDays || 1))));
  const dailyEarnings = calculateDailyEarnings(hashRate, dailyRate);
  const accrualEnd = new Date(Math.min(now.getTime(), purchase.endsAt.getTime()));

  let session = await prisma.miningSession.findFirst({
    where: { userId: purchase.userId, purchaseId: purchase.id },
    orderBy: { createdAt: 'desc' },
  });

  if (!session) {
    session = await prisma.miningSession.create({
      data: {
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
  const purchaseModel = packageType === 'mining' ? prisma.miningPurchase : prisma.hashRentingPurchase;

  if (earned > MIN_ACCRUAL) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: purchase.userId },
        data: {
          platformBalance: { increment: earned },
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
          userId: purchase.userId,
          type: 'mining',
          amount: earned,
          currency: 'USDT',
          chain: purchase.chain || plan.chain,
          status: 'completed',
          metadata: {
            purchaseId: purchase.id,
            planName: plan.name,
            packageType,
            accruedFrom: lastAccruedAt.toISOString(),
            accruedTo: accrualEnd.toISOString(),
          },
        },
      }),
    ]);
  }

  if (shouldComplete) {
    if (packageType === 'mining') {
      await prisma.miningPurchase.update({ where: { id: purchase.id }, data: { status: 'completed' } });
    } else {
      await prisma.hashRentingPurchase.update({ where: { id: purchase.id }, data: { status: 'completed' } });
    }

    await prisma.miningSession.updateMany({
      where: { userId: purchase.userId, purchaseId: purchase.id },
      data: { status: 'completed', lastPayoutAt: accrualEnd },
    });
  }
}

export async function refreshMiningForUser(userId: string) {
  const [miningPurchases, hashRentingPurchases] = await Promise.all([
    prisma.miningPurchase.findMany({
      where: { userId, status: 'active' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.hashRentingPurchase.findMany({
      where: { userId, status: 'active' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  for (const purchase of miningPurchases) {
    await accruePurchase({ ...purchase, packageType: 'mining' }, 'mining');
  }

  for (const purchase of hashRentingPurchases) {
    await accruePurchase({ ...purchase, packageType: 'hash_renting' }, 'hash_renting');
  }
}

export async function getActivePlan(userId: string) {
  await refreshMiningForUser(userId);
  const now = new Date();
  const [miningPurchase, hashRentingPurchase] = await Promise.all([
    prisma.miningPurchase.findFirst({
      where: { userId, status: 'active', endsAt: { gt: now } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.hashRentingPurchase.findFirst({
      where: { userId, status: 'active', endsAt: { gt: now } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const purchase = miningPurchase
    ? { ...miningPurchase, packageType: 'mining' }
    : hashRentingPurchase
    ? { ...hashRentingPurchase, packageType: 'hash_renting' }
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
