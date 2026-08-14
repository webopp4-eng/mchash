import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';

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
      await prisma.miningPlan.create({ data: { id: uuid(), ...plan, updatedAt: new Date() } });
    } else {
      await prisma.miningPlan.update({ where: { id: existing.id }, data: { ...plan, updatedAt: new Date() } });
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
      await prisma.hashRentingPlan.create({ data: { id: uuid(), ...plan, updatedAt: new Date() } });
    } else {
      await prisma.hashRentingPlan.update({ where: { id: existing.id }, data: { ...plan, updatedAt: new Date() } });
    }
  }

  // Payment accounts — multiple accounts per payment method (bank, crypto, momo, opay, other)
  const paymentAccounts = [
    {
      type: 'bank',
      name: 'Bank Account A',
      label: 'Primary Bank Account',
      bankName: 'Access Bank',
      accountHolder: 'CM HASH LTD',
      accountNumber: '0234567890',
      currency: 'NGN',
      isDefault: true,
      active: true,
      sortOrder: 1,
    },
    {
      type: 'bank',
      name: 'Bank Account B',
      label: 'Backup Bank Account',
      bankName: 'GTBank',
      accountHolder: 'CM HASH LTD',
      accountNumber: '0456789012',
      currency: 'NGN',
      isDefault: false,
      active: true,
      sortOrder: 2,
    },
    {
      type: 'crypto',
      name: 'USDT TRC20 Wallet',
      label: 'USDT (TRC20)',
      walletAddress: 'TXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      network: 'tron',
      currency: 'USDT',
      isDefault: true,
      active: true,
      sortOrder: 1,
    },
    {
      type: 'crypto',
      name: 'USDT ERC20 Wallet',
      label: 'USDT (ERC20)',
      walletAddress: '0x0000000000000000000000000000000000000000',
      network: 'ethereum',
      currency: 'USDT',
      isDefault: false,
      active: true,
      sortOrder: 2,
    },
    {
      type: 'momo',
      name: 'MoMo MTN',
      label: 'MTN Mobile Money',
      accountHolder: 'CM HASH',
      accountNumber: '0245556789',
      bankName: 'MTN',
      currency: 'GHS',
      isDefault: true,
      active: true,
      sortOrder: 1,
    },
    {
      type: 'momo',
      name: 'MoMo Vodafone',
      label: 'Vodafone Cash',
      accountHolder: 'CM HASH',
      accountNumber: '0502223344',
      bankName: 'Vodafone',
      currency: 'GHS',
      isDefault: false,
      active: true,
      sortOrder: 2,
    },
    {
      type: 'opay',
      name: 'OPay Account A',
      label: 'OPay Primary',
      accountHolder: 'CM HASH',
      accountNumber: '7012345678',
      currency: 'NGN',
      isDefault: true,
      active: true,
      sortOrder: 1,
    },
  ];

  for (const account of paymentAccounts) {
    const existing = await prisma.paymentAccount.findFirst({ where: { name: account.name } });
    if (!existing) {
      await prisma.paymentAccount.create({
        data: {
          id: uuid(),
          ...account,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.paymentAccount.update({
        where: { id: existing.id },
        data: {
          ...account,
          updatedAt: new Date(),
        },
      });
    }
  }

  const settings = [
    { key: 'min_withdrawal', value: '10' },
    { key: 'max_withdrawal', value: '10000' },
    { key: 'auto_approve_withdrawals', value: 'false' },
    { key: 'referral_levels', value: '3' },
    { key: 'platform_name', value: 'CM HASH' },
    { key: 'support_email', value: 'support@cmhash.io' },
    { key: 'default_currency', value: 'USDT' },
  ];

  for (const setting of settings) {
    await prisma.adminSetting.upsert({
      where: { key: setting.key },
      update: { ...setting, updatedAt: new Date() },
      create: { id: uuid(), ...setting, updatedAt: new Date() },
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
