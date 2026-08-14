import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import prisma from '../lib/prisma';
import { authenticateToken, loadUser, AuthRequest } from '../middleware/auth';
import { getActivePlan, getMiningSessions } from '../services/mining';

const router = Router();

// ============ PUBLIC ROUTES (no auth required) ============

// Plans - public endpoint so Home page and unauthenticated users can browse
router.get('/plans', async (_req, res) => {
  try {
    const plans = await prisma.miningPlan.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    });
    const hashRentingPlans = await prisma.hashRentingPlan.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    });
    res.json({ plans, hashRentingPlans });
  } catch (error) {
    console.error('Plans error:', error);
    res.status(500).json({ error: 'Failed to load plans' });
  }
});

// Hash Renting - public endpoint
router.get('/hash-renting', async (_req, res) => {
  try {
    const plans = await prisma.hashRentingPlan.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    });
    res.json({ plans });
  } catch (error) {
    console.error('Hash renting plans error:', error);
    res.status(500).json({ error: 'Failed to load hash renting plans' });
  }
});

// All remaining dashboard routes require auth
router.use(authenticateToken, loadUser);

// ============ DASHBOARD ============
router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const activePlan = await getActivePlan(userId);
    const sessions = await getMiningSessions(userId);
    const recentTx = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const notifications = await prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    res.json({
      user,
      activePlan,
      miningSessions: sessions,
      recentTransactions: recentTx,
      notifications,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// ============ MINING ============
router.get('/mining', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const activePlan = await getActivePlan(userId);
    const sessions = await getMiningSessions(userId);
    const history = await prisma.miningPurchase.findMany({
      where: { userId },
      include: { MiningPlan: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ activePlan, sessions, history });
  } catch (error) {
    console.error('Mining error:', error);
    res.status(500).json({ error: 'Failed to load mining data' });
  }
});

router.get('/rankings', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const [users, activePlans, sessions] = await Promise.all([
      prisma.user.findMany({
        where: { status: 'active' },
        select: {
          id: true,
          username: true,
          walletAddress: true,
          platformBalance: true,
          totalEarned: true,
          totalDeposited: true,
          createdAt: true,
        },
        orderBy: [{ totalEarned: 'desc' }, { platformBalance: 'desc' }],
        take: 100,
      }),
      prisma.miningPurchase.findMany({
        where: { status: 'active' },
        include: { MiningPlan: true },
      }),
      prisma.miningSession.groupBy({
        by: ['userId'],
        _sum: { hashRate: true, totalMined: true },
      }),
    ]);

    const activePlanMap = new Map(activePlans.map((purchase) => [purchase.userId, purchase]));
    const sessionMap = new Map(sessions.map((session) => [session.userId, session]));

    const rankings = users
      .map((user) => {
        const session = sessionMap.get(user.id);
        const activePlan = activePlanMap.get(user.id);
        const score =
          Number(user.totalEarned || 0) * 10 +
          Number(user.platformBalance || 0) +
          Number(session?._sum.hashRate || 0) * 5 +
          (activePlan ? 250 : 0);

        return {
          id: user.id,
          username: user.username || `Miner ${user.walletAddress?.slice(0, 6) || 'User'}`,
          walletAddress: user.walletAddress || '',

          totalEarned: user.totalEarned,
          platformBalance: user.platformBalance,
          hashRate: session?._sum.hashRate || 0,
          totalMined: session?._sum.totalMined || 0,
          activePlan: activePlan?.MiningPlan.name || null,
          score,
          joinedAt: user.createdAt,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    res.json({
      rankings,
      currentUserRank: rankings.find((entry) => entry.id === userId) || null,
      leaderboard: rankings.slice(0, 10),
    });
  } catch (error) {
    console.error('Rankings error:', error);
    res.status(500).json({ error: 'Failed to load rankings' });
  }
});

router.get('/atrs', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const [user, activePlan, sessions, transactions, referral] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      getActivePlan(userId),
      getMiningSessions(userId),
      prisma.transaction.findMany({
        where: { userId, type: { in: ['mining', 'referral', 'hash_renting'] } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.referral.findUnique({ where: { userId } }),
    ]);

    const totalHashRate = sessions
      .filter((session) => session.status === 'active')
      .reduce((sum, session) => sum + Number(session.hashRate || 0), 0);
    const totalMined = sessions.reduce((sum, session) => sum + Number(session.totalMined || 0), 0);
    const activeDailyReward = activePlan?.dailyEarnings || 0;

    res.json({
      summary: {
        availableRewards: user?.platformBalance || 0,
        totalEarned: user?.totalEarned || 0,
        totalHashRate,
        totalMined,
        activeDailyReward,
        referralEarned: referral?.totalEarned || 0,
        activePlan: activePlan?.plan.name || null,
      },
      activePlan,
      sessions,
      rewards: transactions,
    });
  } catch (error) {
    console.error('ATRs error:', error);
    res.status(500).json({ error: 'Failed to load ATRs' });
  }
});

// ============ PURCHASE ============

// Purchase a plan
router.post('/plans/:planId/purchase', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { planId } = req.params;
    const { txHash, chain } = req.body;

    const plan = await prisma.miningPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.active) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existing = await getActivePlan(userId);
    if (existing) {
      return res.status(400).json({ error: 'You already have an active mining package' });
    }

    const platformBalance = Number(user.platformBalance);
    const planPrice = Number(plan.price);
    if (planPrice > 0 && platformBalance < planPrice) {
      return res.status(400).json({ error: `Insufficient platform balance. You need ${planPrice.toFixed(2)} ${plan.currency}.` });
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const [updatedUser, purchase] = await prisma.$transaction(async (tx) => {
      const updated = planPrice > 0
        ? await tx.user.update({
            where: { id: userId },
            data: { platformBalance: { decrement: planPrice } },
          })
        : user;

      const createdPurchase = await tx.miningPurchase.create({
        data: {
          id: uuid(),
          userId,
          planId,
          amount: planPrice,
          currency: plan.currency,
          chain: chain || plan.chain,
          txHash: txHash || null,
          status: 'active',
          startedAt: now,
          endsAt,
        },
      });

      await tx.miningSession.create({
        data: {
          id: uuid(),
          userId,
          purchaseId: createdPurchase.id,
          hashRate: plan.hashRate,
          status: 'active',
          startedAt: now,
          lastPayoutAt: now,
        },
      });

      await tx.transaction.create({
        data: {
          id: uuid(),
          userId,
          type: 'purchase',
          amount: planPrice > 0 ? -planPrice : 0,
          currency: plan.currency,
          chain: chain || plan.chain,
          txHash: txHash || null,
          status: 'completed',
          metadata: { planId: plan.id, planName: plan.name, packageType: 'mining' },
        },
      });

      await tx.notification.create({
        data: {
          id: uuid(),
          userId,
          type: 'purchase',
          title: 'Plan Activated',
          message: `${plan.name} mining plan activated successfully. Mining has started!`,
        },
      });

      return [updated, createdPurchase];
    });

    // Referral commission
    if (user.referredBy) {
      const referrer = await prisma.user.findUnique({ where: { id: user.referredBy } });
      if (referrer) {
        const commission = Number(plan.price) * (Number(plan.referralBonus) / 100);
        const referral = await prisma.referral.findUnique({ where: { userId: referrer.id } });
        if (referral) {
          await prisma.referralEarning.create({
            data: {
              id: uuid(),
              referralId: referral.id,
              userId: referrer.id,
              amount: commission,
              level: 1,
              sourceType: 'purchase',
              status: 'completed',
            },
          });
          await prisma.referral.update({
            where: { id: referral.id },
            data: { totalEarned: { increment: commission } },
          });
          await prisma.notification.create({
            data: {
              id: uuid(),
              userId: referrer.id,
              type: 'referral',
              title: 'Referral Commission',
              message: `You earned ${commission.toFixed(2)} USDT from a referral purchase.`,
            },
          });
        }
      }
    }

    const activePlan = await getActivePlan(userId);
    res.json({ success: true, purchase, activePlan, platformBalance: updatedUser.platformBalance });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Failed to purchase plan' });
  }
});

// Hash Renting purchase
router.post('/hash-renting/:planId/purchase', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { planId } = req.params;
    const { txHash, chain } = req.body;

    const plan = await prisma.hashRentingPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.active) {
      return res.status(404).json({ error: 'Hash renting plan not found' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existing = await getActivePlan(userId);
    if (existing) {
      return res.status(400).json({ error: 'You already have an active mining package' });
    }

    // Validate balance only for paid plans
    const platformBalance = Number(user.platformBalance);
    const planPrice = Number(plan.price);
    if (planPrice > 0 && platformBalance < planPrice) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const [updatedUser, purchase] = await prisma.$transaction(async (tx) => {
      const updated = planPrice > 0
        ? await tx.user.update({
            where: { id: userId },
            data: { platformBalance: { decrement: planPrice } },
          })
        : user;

      const createdPurchase = await tx.hashRentingPurchase.create({
        data: {
          id: uuid(),
          userId,
          planId,
          amount: planPrice,
          currency: plan.currency,
          chain: chain || user.chain,
          txHash: txHash || null,
          status: 'active',
          startedAt: now,
          endsAt,
        },
      });

      await tx.miningSession.create({
        data: {
          id: uuid(),
          userId,
          purchaseId: createdPurchase.id,
          hashRate: plan.hashPower,
          status: 'active',
          startedAt: now,
          lastPayoutAt: now,
        },
      });

      await tx.transaction.create({
        data: {
          id: uuid(),
          userId,
          type: 'hash_renting',
          amount: planPrice > 0 ? -planPrice : 0,
          currency: plan.currency,
          chain: chain || user.chain,
          txHash: txHash || null,
          status: 'completed',
          metadata: { planId: plan.id, planName: plan.name, packageType: 'hash_renting' },
        },
      });

      await tx.notification.create({
        data: {
          id: uuid(),
          userId,
          type: 'hash_renting',
          title: 'Hash Renting Activated',
          message: `${plan.name} hash renting plan activated successfully. Mining has started!`,
        },
      });

      return [updated, createdPurchase];
    });

    const activePlan = await getActivePlan(userId);
    res.json({ success: true, purchase, activePlan, platformBalance: updatedUser.platformBalance });
  } catch (error) {
    console.error('Hash renting purchase error:', error);
    res.status(500).json({ error: 'Failed to purchase hash renting plan' });
  }
});

// ============ WALLET ============
router.get('/wallet', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Wallet: true },
    });
    const deposits = await prisma.deposit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      platformBalance: user?.platformBalance,
      walletAddress: user?.walletAddress,
      chain: user?.chain,
      walletType: user?.walletType,
      wallets: user?.Wallet,
      deposits,
    });
  } catch (error) {
    console.error('Wallet error:', error);
    res.status(500).json({ error: 'Failed to load wallet' });
  }
});

// ============ EARNINGS ============
router.get('/earnings', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const miningTx = await prisma.transaction.findMany({
      where: { userId, type: 'mining' },
      orderBy: { createdAt: 'desc' },
    });
    const referralEarnings = await prisma.referralEarning.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      totalEarned: user?.totalEarned,
      platformBalance: user?.platformBalance,
      miningEarnings: miningTx,
      referralEarnings,
    });
  } catch (error) {
    console.error('Earnings error:', error);
    res.status(500).json({ error: 'Failed to load earnings' });
  }
});

// ============ REFERRALS ============
router.get('/referrals', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const referral = await prisma.referral.findUnique({ where: { userId } });
    const referredUsers = await prisma.user.findMany({
      where: { referredBy: userId },
      select: { id: true, username: true, walletAddress: true, createdAt: true, status: true },
    });
    const earnings = await prisma.referralEarning.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Build the production/public referral URL — never default to localhost.
    const publicOrigin =
      process.env.PUBLIC_FRONTEND_URL ||
      process.env.RENDER_FRONTEND_URL ||
      process.env.FRONTEND_URL ||
      process.env.NEXTAUTH_URL ||
      '';
    // If no production env var is configured, fall back to the request origin.
    const requestOrigin = req.protocol + '://' + req.get('host');
    const origin = publicOrigin && publicOrigin !== 'http://localhost:3000'
      ? publicOrigin.replace(/\/$/, '')
      : requestOrigin;

    res.json({
      referralCode: user?.referralCode,
      referralLink: `${origin}/?ref=${user?.referralCode}`,
      totalReferrals: referral?.totalReferrals || 0,
      activeReferrals: referral?.activeReferrals || 0,
      totalEarned: referral?.totalEarned || 0,
      referredUsers,
      earnings,
    });
  } catch (error) {
    console.error('Referrals error:', error);
    res.status(500).json({ error: 'Failed to load referrals' });
  }
});

// ============ TRANSACTIONS ============
router.get('/transactions', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ transactions });
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ error: 'Failed to load transactions' });
  }
});

// ============ WITHDRAWALS ============
router.get('/withdrawals', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
    });
    res.json({ withdrawals });
  } catch (error) {
    console.error('Withdrawals error:', error);
    res.status(500).json({ error: 'Failed to load withdrawals' });
  }
});

// Request withdrawal
router.post('/withdrawals', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { amount, currency, chain } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (Number(user.platformBalance) < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct balance
    await prisma.user.update({
      where: { id: userId },
      data: {
        platformBalance: { decrement: amount },
        totalWithdrawn: { increment: amount },
      },
    });

    if (!user.walletAddress) {
      return res.status(400).json({ error: 'No wallet connected for withdrawal' });
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        id: uuid(),
        userId,
        amount,
        currency: currency || 'USDT',
        chain: chain || user.chain,
        destinationAddress: user.walletAddress,
        status: 'pending',
      },
    });

    await prisma.transaction.create({
      data: {
        id: uuid(),
        userId,
        type: 'withdrawal',
        amount: -amount,
        currency: currency || 'USDT',
        chain: chain || user.chain,
        status: 'pending',
        metadata: { withdrawalId: withdrawal.id },
      },
    });

    await prisma.notification.create({
      data: {
        id: uuid(),
        userId,
        type: 'withdrawal',
        title: 'Withdrawal Requested',
        message: `Withdrawal of ${amount} ${currency || 'USDT'} is pending approval.`,
      },
    });

    res.json({ success: true, withdrawal });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

// ============ SUPPORT ============
router.get('/support/tickets', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      include: { SupportMessage: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ tickets });
  } catch (error) {
    console.error('Support tickets error:', error);
    res.status(500).json({ error: 'Failed to load tickets' });
  }
});

router.post('/support/tickets', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { subject, category, priority, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message required' });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        id: uuid(),
        userId,
        subject,
        category: category || 'general',
        priority: priority || 'normal',
        status: 'open',
        updatedAt: new Date(),
        SupportMessage: {
          create: {
            id: uuid(),
            senderId: userId,
            senderRole: 'user',
            message,
          },
        },
      },
      include: { SupportMessage: true },
    });

    res.json({ success: true, ticket });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

router.post('/support/tickets/:ticketId/messages', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!message) return res.status(400).json({ error: 'Message required' });

    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, userId },
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const msg = await prisma.supportMessage.create({
      data: {
        id: uuid(),
        ticketId,
        senderId: userId,
        senderRole: 'user',
        message,
      },
    });

    res.json({ success: true, message: msg });
  } catch (error) {
    console.error('Ticket message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============ NOTIFICATIONS ============
router.get('/notifications', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unread = notifications.filter((n: { read: boolean }) => !n.read).length;
    res.json({ notifications, unread });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

router.patch('/notifications/:id/read', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark notification' });
  }
});

// ============ SETTINGS ============
router.get('/settings', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const settings = await prisma.adminSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s: { key: string; value: string }) => { settingsMap[s.key] = s.value; });

    res.json({
      user: {
        username: user?.username,
        walletAddress: user?.walletAddress,
        chain: user?.chain,
        walletType: user?.walletType,
      },
      platformSettings: settingsMap,
    });
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

export default router;
