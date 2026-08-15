import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import prisma from '../lib/prisma';
import { authenticateToken, loadUser, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

router.use(authenticateToken, loadUser, requireAdmin);

// ============ ADMIN DASHBOARD ============
router.get('/dashboard', async (_req, res) => {
  try {
    const [totalUsers, activeMiners, totalDeposits, totalWithdrawals, totalRevenue, miningPlans, referrals, treasuryWallets] = await Promise.all([
      prisma.user.count(),
      prisma.miningPurchase.count({ where: { status: 'active' } }),
      prisma.deposit.aggregate({ _sum: { amount: true } }),
      prisma.withdrawal.aggregate({ _sum: { amount: true } }),
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'purchase' } }),
      prisma.miningPlan.count(),
      prisma.referral.aggregate({ _sum: { totalEarned: true } }),
      prisma.treasuryWallet.findMany(),
    ]);

    res.json({
      totalUsers,
      activeMiners,
      totalDeposits: totalDeposits._sum.amount || 0,
      totalWithdrawals: totalWithdrawals._sum.amount || 0,
      totalRevenue: totalRevenue._sum.amount || 0,
      miningPlans,
      referralEarnings: referrals._sum.totalEarned || 0,
      treasuryWallets,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to load admin dashboard' });
  }
});

// ============ USER MANAGEMENT ============
router.get('/users', async (req, res) => {
  try {
    const { search, status } = req.query;
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { walletAddress: { contains: String(search) } },
        { username: { contains: String(search) } },
      ];
    }
    if (status) where.status = String(status);

    const users = await prisma.user.findMany({
      where,
      include: {
        Wallet: true,
        _count: { select: { Transaction: true, Deposit: true, Withdrawal: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ users });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const user = await prisma.user.update({ where: { id }, data: { status } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        userId: id,
        action: 'USER_STATUS_CHANGE',
        details: { status, adminId: (req as AuthRequest).user?.id },
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error('User status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// ============ ADMIN CREDIT SYSTEM ============
router.post('/users/:id/credit', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, balanceType, reason } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Credit amount must be greater than 0' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const creditAmount = Number(amount);
    const type = balanceType || 'platformBalance';

    // Validate balance type
    const validTypes = ['platformBalance', 'totalEarned', 'totalDeposited'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid balance type' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { [type]: { increment: creditAmount } },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        id: uuid(),
        userId: id,
        type: 'admin_credit',
        amount: creditAmount,
        currency: 'USDT',
        chain: user.chain || 'ethereum',
        status: 'completed',
        metadata: { balanceType: type, reason: reason || 'Admin credit', adminId: (req as AuthRequest).user?.id },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        id: uuid(),
        userId: id,
        type: 'credit',
        title: 'Account Credited',
        message: `Your account has been credited with ${creditAmount.toFixed(2)} USDT.${reason ? ` Reason: ${reason}` : ''}`,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        userId: id,
        action: 'ADMIN_CREDIT',
        details: { amount: creditAmount, balanceType: type, reason: reason || null, adminId: (req as AuthRequest).user?.id },
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Admin credit error:', error);
    res.status(500).json({ error: 'Failed to credit user' });
  }
});

router.get('/users/:id/mining', async (req, res) => {
  try {
    const { id } = req.params;
    const [purchases, sessions] = await Promise.all([
      prisma.miningPurchase.findMany({ where: { userId: id }, include: { MiningPlan: true }, orderBy: { createdAt: 'desc' } }),
      prisma.hashRentingPurchase.findMany({ where: { userId: id }, include: { HashRentingPlan: true }, orderBy: { createdAt: 'desc' } }),
    ]);
    res.json({ purchases, hashRentingPurchases: sessions });
  } catch (error) {
    console.error('User mining error:', error);
    res.status(500).json({ error: 'Failed to load user mining data' });
  }
});

// ============ MINING PLAN MANAGEMENT ============
router.get('/plans', async (_req, res) => {
  try {
    const plans = await prisma.miningPlan.findMany({ orderBy: { price: 'asc' } });
    res.json({ plans });
  } catch (error) {
    console.error('Admin plans error:', error);
    res.status(500).json({ error: 'Failed to load plans' });
  }
});

router.post('/plans', async (req, res) => {
  try {
    const { name, description, price, currency, chain, hashRate, dailyRate, durationDays, bonusReward, referralBonus, expectedReturn } = req.body;
    const plan = await prisma.miningPlan.create({
      data: {
        id: uuid(),
        name,
        description,
        price: Number(price),
        currency: currency || 'USDT',
        chain: chain || 'ethereum',
        hashRate: Number(hashRate),
        dailyRate: Number(dailyRate),
        durationDays: Number(durationDays),
        bonusReward: Number(bonusReward || 0),
        referralBonus: Number(referralBonus || 0),
        expectedReturn: Number(expectedReturn || 0),
        updatedAt: new Date(),
      },
    });
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

router.patch('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.price) data.price = Number(data.price);
    if (data.hashRate) data.hashRate = Number(data.hashRate);
    if (data.dailyRate) data.dailyRate = Number(data.dailyRate);
    if (data.durationDays) data.durationDays = Number(data.durationDays);
    if (data.bonusReward) data.bonusReward = Number(data.bonusReward);
    if (data.referralBonus) data.referralBonus = Number(data.referralBonus);
    if (data.expectedReturn) data.expectedReturn = Number(data.expectedReturn);

    const plan = await prisma.miningPlan.update({ where: { id }, data });
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

router.delete('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await prisma.miningPlan.findUnique({ where: { id } });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const activePurchases = await prisma.miningPurchase.count({
      where: {
        planId: id,
        status: 'active',
      },
    });

    if (activePurchases > 0) {
      const updatedPlan = await prisma.miningPlan.update({
        where: { id },
        data: {
          active: false,
          updatedAt: new Date(),
        },
      });

      return res.json({
        success: true,
        softDeleted: true,
        plan: updatedPlan,
        message: 'Plan is still active for users and was deactivated instead of being deleted.',
      });
    }

    await prisma.miningPlan.delete({ where: { id } });
    res.json({ success: true, deleted: true });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

// ============ RECEIVING WALLET MANAGEMENT ============
router.get('/treasury', async (_req, res) => {
  try {
    const wallets = await prisma.treasuryWallet.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ wallets });
  } catch (error) {
    console.error('Treasury wallets error:', error);
    res.status(500).json({ error: 'Failed to load treasury wallets' });
  }
});

router.get('/receiving-wallets', async (_req, res) => {
  try {
    const wallets = await prisma.treasuryWallet.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ wallets });
  } catch (error) {
    console.error('Receiving wallets error:', error);
    res.status(500).json({ error: 'Failed to load receiving wallets' });
  }
});

router.post('/receiving-wallets', async (req, res) => {
  try {
    const { network, address, label, supportedCurrency, active } = req.body;
    if (!['solana', 'ethereum', 'bnb'].includes(network)) {
      return res.status(400).json({ error: 'Invalid network. Must be solana, ethereum, or bnb.' });
    }
    if (!address) return res.status(400).json({ error: 'Address is required' });

    const existing = await prisma.treasuryWallet.findUnique({ where: { network } });
    if (existing) {
      return res.status(400).json({ error: `A receiving wallet for ${network} already exists` });
    }

    const wallet = await prisma.treasuryWallet.create({
      data: {
        id: uuid(),
        network,
        address,
        label,
        supportedCurrency: supportedCurrency || 'USDT',
        active: active !== undefined ? Boolean(active) : true,
        updatedAt: new Date(),
      },
    });
    res.json({ success: true, wallet });
  } catch (error) {
    console.error('Create receiving wallet error:', error);
    res.status(500).json({ error: 'Failed to create receiving wallet' });
  }
});

router.patch('/receiving-wallets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { address, label, supportedCurrency, active } = req.body;
    const wallet = await prisma.treasuryWallet.update({
      where: { id },
      data: {
        address: address || undefined,
        label: label || undefined,
        supportedCurrency: supportedCurrency || undefined,
        active: active !== undefined ? Boolean(active) : undefined,
      },
    });
    res.json({ success: true, wallet });
  } catch (error) {
    console.error('Update receiving wallet error:', error);
    res.status(500).json({ error: 'Failed to update receiving wallet' });
  }
});

router.delete('/receiving-wallets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.treasuryWallet.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete receiving wallet error:', error);
    res.status(500).json({ error: 'Failed to delete receiving wallet' });
  }
});

// ============ PAYMENT ACCOUNT MANAGEMENT ============
router.get('/payment-accounts', async (_req, res) => {
  try {
    const accounts = await prisma.paymentAccount.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ paymentAccounts: accounts });
  } catch (error) {
    console.error('Payment accounts error:', error);
    res.status(500).json({ error: 'Failed to load payment accounts' });
  }
});

router.post('/payment-accounts', async (req, res) => {
  try {
    const { type, name, label, bankName, accountHolder, accountNumber, walletAddress, network, currency, isDefault, active, sortOrder } = req.body;
    const validTypes = ['bank', 'crypto', 'momo', 'opay', 'other'];
    const normalizedType = validTypes.includes(type) ? type : 'other';

    if (!name || !accountNumber) {
      return res.status(400).json({ error: 'Account name and account number are required.' });
    }

    const payload = {
      id: uuid(),
      type: normalizedType,
      name,
      label: label || name,
      bankName: bankName || null,
      accountHolder: accountHolder || null,
      accountNumber: accountNumber || null,
      walletAddress: walletAddress || null,
      network: network || null,
      currency: currency || 'USDT',
      isDefault: Boolean(isDefault),
      active: active !== undefined ? Boolean(active) : true,
      sortOrder: Number(sortOrder || 0),
      updatedAt: new Date(),
    };

    if (payload.isDefault) {
      await prisma.paymentAccount.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const account = await prisma.paymentAccount.create({ data: payload });

    // Audit log
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        action: 'PAYMENT_ACCOUNT_CREATE',
        details: { accountId: account.id, name: account.name, type: account.type, adminId: (req as AuthRequest).user?.id },
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    res.status(201).json({ success: true, paymentAccount: account });
  } catch (error) {
    console.error('Create payment account error:', error);
    res.status(500).json({ error: 'Failed to create payment account' });
  }
});

router.patch('/payment-accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, name, label, bankName, accountHolder, accountNumber, walletAddress, network, currency, isDefault, active, sortOrder } = req.body;
    const validTypes = ['bank', 'crypto', 'momo', 'opay', 'other'];
    const normalizedType = type && validTypes.includes(type) ? type : type === 'card' ? 'other' : undefined;

    const data: Record<string, unknown> = {
      type: normalizedType || undefined,
      name: name || undefined,
      label: label || undefined,
      bankName: bankName || undefined,
      accountHolder: accountHolder || undefined,
      accountNumber: accountNumber || undefined,
      walletAddress: walletAddress || undefined,
      network: network || undefined,
      currency: currency || undefined,
      isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined,
      active: active !== undefined ? Boolean(active) : undefined,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      updatedAt: new Date(),
    };

    if (data.isDefault === true) {
      await prisma.paymentAccount.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const account = await prisma.paymentAccount.update({
      where: { id },
      data,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        action: 'PAYMENT_ACCOUNT_UPDATE',
        details: {
          accountId: id,
          updatedFields: Object.keys(data).filter((key) => data[key] !== undefined),
          adminId: (req as AuthRequest).user?.id,
        },
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    res.json({ success: true, paymentAccount: account });
  } catch (error) {
    console.error('Update payment account error:', error);
    res.status(500).json({ error: 'Failed to update payment account' });
  }
});

router.delete('/payment-accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.paymentAccount.delete({ where: { id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        action: 'PAYMENT_ACCOUNT_DELETE',
        details: { accountId: id, adminId: (req as AuthRequest).user?.id },
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete payment account error:', error);
    res.status(500).json({ error: 'Failed to delete payment account' });
  }
});

// ============ FINANCIAL MANAGEMENT ============
router.get('/deposits', async (_req, res) => {
  try {
    const deposits = await prisma.deposit.findMany({
      include: {
        User: { select: { username: true, walletAddress: true, email: true } },
        PaymentAccount: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ deposits });
  } catch (error) {
    console.error('Admin deposits error:', error);
    res.status(500).json({ error: 'Failed to load deposits' });
  }
});

router.patch('/deposits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid deposit status' });
    }

    const deposit = await prisma.deposit.findUnique({ where: { id } });
    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    if (status === 'rejected') {
      const updated = await prisma.deposit.update({
        where: { id },
        data: {
          status: 'rejected',
          note: adminNote || deposit.note,
          approvedAt: null,
        },
      });

      await prisma.notification.create({
        data: {
          id: uuid(),
          userId: deposit.userId,
          type: 'deposit',
          title: 'Deposit Rejected',
          message: `Your deposit request for ${Number(deposit.amount).toFixed(2)} ${deposit.currency} was rejected.${adminNote ? ` Reason: ${adminNote}` : ''}`,
        },
      });

      return res.json({ success: true, deposit: updated });
    }

    if (status === 'approved' || status === 'completed') {
      if (deposit.status === 'approved' || deposit.status === 'completed') {
        return res.status(400).json({ error: 'Deposit has already been processed' });
      }

      const amount = Number(deposit.amount);
      const processed = await prisma.$transaction([
        prisma.user.update({
          where: { id: deposit.userId },
          data: {
            platformBalance: { increment: amount },
            totalDeposited: { increment: amount },
          },
        }),
        prisma.deposit.update({
          where: { id },
          data: {
            status: status === 'completed' ? 'completed' : 'approved',
            approvedAt: new Date(),
            confirmedAt: status === 'completed' ? new Date() : deposit.confirmedAt,
            note: adminNote || deposit.note,
          },
        }),
        prisma.transaction.create({
          data: {
            id: uuid(),
            userId: deposit.userId,
            type: 'deposit',
            amount,
            currency: deposit.currency,
            chain: deposit.chain || 'ethereum',
            txHash: deposit.txHash || null,
            status: 'completed',
            metadata: { depositId: deposit.id, source: deposit.method || 'manual', paymentAccountId: deposit.paymentAccountId },
          },
        }),
        prisma.notification.create({
          data: {
            id: uuid(),
            userId: deposit.userId,
            type: 'deposit',
            title: 'Deposit Approved',
            message: `Your ${deposit.currency} deposit of ${amount.toFixed(2)} has been approved and credited to your balance.`,
          },
        }),
      ]);

      return res.json({ success: true, deposit: processed[1] });
    }

    const updated = await prisma.deposit.update({
      where: { id },
      data: {
        status,
        note: adminNote || deposit.note,
      },
    });

    res.json({ success: true, deposit: updated });
  } catch (error) {
    console.error('Deposit update error:', error);
    res.status(500).json({ error: 'Failed to update deposit' });
  }
});

router.get('/withdrawals', async (_req, res) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      include: { 
        User: { select: { id: true, username: true, walletAddress: true, email: true } },
        PayoutMethod: {
          select: {
            type: true,
            name: true,
            address: true,
            solanaAddress: true,
            momoNumber: true,
            momoName: true,
            bankName: true,
            accountNumber: true,
            accountHolder: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
      take: 100,
    });
    res.json({ withdrawals });
  } catch (error) {
    console.error('Admin withdrawals error:', error);
    res.status(500).json({ error: 'Failed to load withdrawals' });
  }
});

router.patch('/withdrawals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote, txHash } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    const user = await prisma.user.findUnique({ where: { id: withdrawal.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transactionWhere = {
      userId: withdrawal.userId,
      type: 'withdrawal',
      metadata: { equals: { withdrawalId: withdrawal.id } },
    } as const;

    if (status === 'approved') {
      const updatedWithdrawal = await prisma.withdrawal.update({
        where: { id },
        data: {
          status: 'approved',
          adminNote: adminNote || undefined,
        },
      });

      await prisma.notification.create({
        data: {
          id: uuid(),
          userId: withdrawal.userId,
          type: 'withdrawal',
          title: 'Withdrawal Approved',
          message: `Your withdrawal request for ${withdrawal.amount} ${withdrawal.currency} is approved and awaiting completion.`,
        },
      });

      await prisma.transaction.updateMany({
        where: transactionWhere,
        data: { status: 'pending' },
      });

      return res.json({ success: true, withdrawal: updatedWithdrawal });
    }

    if (status === 'rejected') {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            platformBalance: { increment: withdrawal.amount },
            totalWithdrawn: { decrement: withdrawal.amount },
          },
        }),
        prisma.withdrawal.update({
          where: { id },
          data: {
            status: 'rejected',
            adminNote: adminNote || undefined,
            processedAt: new Date(),
          },
        }),
        prisma.transaction.updateMany({
          where: transactionWhere,
          data: { status: 'failed' },
        }),
        prisma.notification.create({
          data: {
            id: uuid(),
            userId: withdrawal.userId,
            type: 'withdrawal',
            title: 'Withdrawal Rejected',
            message: `Your withdrawal request for ${withdrawal.amount} ${withdrawal.currency} was rejected. Funds have been returned to your account.`,
          },
        }),
      ]);

      return res.json({ success: true, withdrawal: { ...withdrawal, status: 'rejected' } });
    }

    if (status === 'completed') {
      if (!txHash) {
        return res.status(400).json({ error: 'Transaction hash is required to complete a withdrawal' });
      }

      const updatedWithdrawal = await prisma.withdrawal.update({
        where: { id },
        data: {
          status: 'completed',
          txHash,
          adminNote: adminNote || undefined,
          processedAt: new Date(),
        },
      });

      await prisma.transaction.updateMany({
        where: transactionWhere,
        data: { status: 'completed', txHash },
      });

      await prisma.notification.create({
        data: {
          id: uuid(),
          userId: withdrawal.userId,
          type: 'withdrawal',
          title: 'Withdrawal Completed',
          message: `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency} is complete.`,
        },
      });

      return res.json({ success: true, withdrawal: updatedWithdrawal });
    }

    res.status(400).json({ error: 'Unsupported status transition' });
  } catch (error) {
    console.error('Withdrawal update error:', error);
    res.status(500).json({ error: 'Failed to update withdrawal' });
  }
});

// ============ SETTINGS ============
router.get('/settings', async (_req, res) => {
  try {
    const settings = await prisma.adminSetting.findMany();
    res.json({ settings });
  } catch (error) {
    console.error('Admin settings error:', error);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    const setting = await prisma.adminSetting.upsert({
      where: { key },
      update: { value, updatedAt: new Date() },
      create: { id: uuid(), key, value, updatedAt: new Date() },
    });
    res.json({ success: true, setting });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// ============ AUDIT LOGS ============
router.get('/audit-logs', async (_req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { User: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ logs });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ error: 'Failed to load audit logs' });
  }
});

export default router;
