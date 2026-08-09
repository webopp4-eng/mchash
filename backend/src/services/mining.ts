import prisma from '../lib/prisma';

// Get active mining plan for a user
export async function getActivePlan(userId: string) {
  const now = new Date();
  const purchase = await prisma.miningPurchase.findFirst({
    where: {
      userId,
      status: 'active',
      endsAt: { gt: now },
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });
  return purchase;
}

// Get user's mining sessions
export async function getMiningSessions(userId: string) {
  return prisma.miningSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

// Calculate daily earnings based on plan
export function calculateDailyEarnings(hashRate: number, dailyRate: number): number {
  return hashRate * dailyRate;
}

// Calculate estimated total earnings for a plan
export function calculateTotalEarnings(dailyEarnings: number, durationDays: number): number {
  return dailyEarnings * durationDays;
}

// Execute daily mining payout (called by cron/worker)
export async function processDailyPayouts() {
  const now = new Date();
  const activePurchases = await prisma.miningPurchase.findMany({
    where: {
      status: 'active',
      endsAt: { gt: now },
    },
    include: { plan: true, user: true },
  });

  const results = [];
  for (const purchase of activePurchases) {
    const plan = purchase.plan;
    const hashRate = Number(plan.hashRate);
    const dailyRate = Number(plan.dailyRate);
    const dailyEarnings = calculateDailyEarnings(hashRate, dailyRate);

    // Credit users' platform balance
    await prisma.user.update({
      where: { id: purchase.userId },
      data: {
        platformBalance: { increment: dailyEarnings },
        totalEarned: { increment: dailyEarnings },
      },
    });

    // Create transaction record
    const tx = await prisma.transaction.create({
      data: {
        userId: purchase.userId,
        type: 'mining',
        amount: dailyEarnings,
        currency: 'USDT',
        chain: plan.chain,
        status: 'completed',
        metadata: { purchaseId: purchase.id, planName: plan.name },
      },
    });

    // Update mining session
    await prisma.miningSession.updateMany({
      where: { userId: purchase.userId, status: 'active' },
      data: {
        totalMined: { increment: dailyEarnings },
        lastPayoutAt: now,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: purchase.userId,
        type: 'mining',
        title: 'Mining Reward Earned',
        message: `You earned ${dailyEarnings.toFixed(2)} USDT from ${plan.name} mining.`,
      },
    });

    // Calculate referral earnings
    if (purchase.user.referredBy) {
      const referrer = await prisma.user.findUnique({
        where: { id: purchase.user.referredBy },
      });
      if (referrer) {
        const referralAmount = dailyEarnings * (Number(plan.referralBonus) / 100);
        const referral = await prisma.referral.findUnique({
          where: { userId: referrer.id },
        });
        if (referral) {
          await prisma.referralEarning.create({
            data: {
              referralId: referral.id,
              userId: referrer.id,
              amount: referralAmount,
              level: 1,
              sourceType: 'mining',
              status: 'completed',
            },
          });
          await prisma.referral.update({
            where: { id: referral.id },
            data: { totalEarned: { increment: referralAmount } },
          });
        }
      }
    }

    results.push(tx);
  }

  return results;
}