import assert from 'node:assert/strict';
import { buildMiningStats } from './mining';

const now = new Date();
const purchase = {
  id: 'purchase-1',
  userId: 'user-1',
  packageType: 'mining',
  startedAt: new Date(now.getTime() - 60 * 60 * 1000),
  endsAt: new Date(now.getTime() + 60 * 60 * 1000),
  completedAt: null,
  MiningPlan: {
    id: 'plan-1',
    name: 'Starter',
    hashRate: 100,
    dailyRate: 0.2,
    durationDays: 30,
    expectedYield: 10,
    currency: 'USDT',
    chain: 'ethereum',
  },
};

const stats = buildMiningStats(purchase as any);
assert.equal(stats.plan.name, 'Starter');
assert.equal(stats.hashRate, 100);
assert.equal(stats.dailyEarnings, 20);
console.log('mining stats test passed');
