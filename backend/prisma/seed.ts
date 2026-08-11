import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for beginners. Start mining with a small investment.',
      price: 50,
      currency: 'USDT',
      chain: 'ethereum',
      hashRate: 1.0,
      dailyRate: 0.02,
      durationDays: 7,
      bonusReward: 5,
      referralBonus: 5,
    },
    {
      name: 'Pro',
      description: 'For serious miners. Higher hash rate and better returns.',
      price: 200,
      currency: 'USDT',
      chain: 'ethereum',
      hashRate: 5.0,
      dailyRate: 0.025,
      durationDays: 15,
      bonusReward: 20,
      referralBonus: 7,
    },
    {
      name: 'Premium',
      description: 'Advanced mining with maximum efficiency.',
      price: 500,
      currency: 'USDT',
      chain: 'ethereum',
      hashRate: 15.0,
      dailyRate: 0.03,
      durationDays: 30,
      bonusReward: 60,
      referralBonus: 10,
    },
    {
      name: 'Enterprise',
      description: 'For institutional investors. Maximum returns.',
      price: 1000,
      currency: 'USDT',
      chain: 'ethereum',
      hashRate: 40.0,
      dailyRate: 0.035,
      durationDays: 60,
      bonusReward: 150,
      referralBonus: 12,
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.miningPlan.findUnique({ where: { name: plan.name } });
    if (!existing) {
      await prisma.miningPlan.create({ data: plan });
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