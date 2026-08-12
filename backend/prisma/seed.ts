import { PrismaClient } from '@prisma/client';

declare const process: {
  exit(code?: number): never;
};

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      name: 'Starter',
      description: 'Perfect entry-level package. Low investment with quick returns.',
      price: 10,
      currency: 'USDT',
      chain: 'ethereum',
      hashRate: 0.50,
      dailyRate: 0.10,
      durationDays: 3,
      bonusReward: 0,
      referralBonus: 3,
      expectedReturn: 12,
    },
    {
      name: 'Bronze',
      description: 'Short-term mining with reliable returns. 3-day package.',
      price: 15,
      currency: 'USDT',
      chain: 'ethereum',
      hashRate: 0.90,
      dailyRate: 0.09,
      durationDays: 3,
      bonusReward: 1,
      referralBonus: 3,
      expectedReturn: 18,
    },
    {
      name: 'Silver',
      description: '7-day mining package with solid daily returns.',
      price: 20,
      currency: 'USDT',
      chain: 'ethereum',
      hashRate: 1.40,
      dailyRate: 0.10,
      durationDays: 7,
      bonusReward: 2,
      referralBonus: 4,
      expectedReturn: 42,
    },
    {
      name: 'Gold',
      description: 'Two-week premium mining with enhanced hash power.',
      price: 50,
      currency: 'USDT',
      chain: 'ethereum',
      hashRate: 3.20,
      dailyRate: 0.12,
      durationDays: 14,
      bonusReward: 5,
      referralBonus: 5,
      expectedReturn: 120,
    },
    {
      name: 'Platinum',
      description: '18-day high-yield mining package with premium returns.',
      price: 75,
      currency: 'USDT',
      chain: 'ethereum',
      hashRate: 5.0,
      dailyRate: 0.14,
      durationDays: 18,
      bonusReward: 10,
      referralBonus: 6,
      expectedReturn: 190,
    },
    {
      name: 'Diamond',
      description: 'Maximum 30-day mining package with highest returns.',
      price: 100,
      currency: 'USDT',
      chain: 'ethereum',
      hashRate: 7.0,
      dailyRate: 0.17,
      durationDays: 30,
      bonusReward: 20,
      referralBonus: 8,
      expectedReturn: 500,
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.miningPlan.findFirst({ where: { name: plan.name } });
    if (!existing) {
      await prisma.miningPlan.create({ data: plan });
    } else {
      await prisma.miningPlan.update({ where: { id: existing.id }, data: plan });
    }
  }

  const hashRentingPlans = [
    {
      name: 'Bronze Hash Pack',
      description: 'Entry-level hash renting with modest yields.',
      price: 100,
      currency: 'USDT',
      chain: 'ethereum',
      hashPower: 200.0,
      durationDays: 15,
      expectedYield: 3.5,
    },
    {
      name: 'Silver Hash Pack',
      description: 'Mid-tier hash renting with enhanced returns.',
      price: 500,
      currency: 'USDT',
      chain: 'ethereum',
      hashPower: 1000.0,
      durationDays: 30,
      expectedYield: 4.2,
    },
    {
      name: 'Gold Hash Pack',
      description: 'High-performance hash renting with premium yields.',
      price: 1500,
      currency: 'USDT',
      chain: 'ethereum',
      hashPower: 3500.0,
      durationDays: 60,
      expectedYield: 5.0,
    },
  ];

  for (const plan of hashRentingPlans) {
    const existing = await prisma.hashRentingPlan.findFirst({ where: { name: plan.name } });
    if (!existing) {
      await prisma.hashRentingPlan.create({ data: plan });
    } else {
      await prisma.hashRentingPlan.update({ where: { id: existing.id }, data: plan });
    }
  }

  const settings = [
    { key: 'min_withdrawal', value: '10' },
    { key: 'max_withdrawal', value: '10000' },
    { key: 'auto_approve_withdrawals', value: 'false' },
    { key: 'referral_levels', value: '3' },
    { key: 'platform_name', value: 'CM HASH' },
    { key: 'support_email', value: 'support@cmhash.io' },
  ];

  for (const setting of settings) {
    await prisma.adminSetting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting,
    });
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
