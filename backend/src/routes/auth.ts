import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import {
  generateNonce,
  verifyNonce,
  verifyEvmSignature,
  verifySolanaSignature,
  findOrCreateUser,
  generateJWT,
} from '../services/walletAuth';
import { authenticateToken, loadUser, AuthRequest } from '../middleware/auth';

const router = Router();

// Get nonce for wallet signing
router.get('/nonce/:address', (req, res) => {
  const { address } = req.params;
  if (!address || address.length < 10) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }
  const nonce = generateNonce(address);
  res.json({ nonce, message: `Sign this message to authenticate with CM HASH:\n\n${nonce}` });
});

// Wallet authentication
const authSchema = z.object({
  address: z.string().min(10),
  chain: z.enum(['solana', 'ethereum', 'bnb']),
  signature: z.string().min(10),
  message: z.string(),
  walletType: z.string().optional(),
  referredBy: z.string().optional(),
});

router.post('/wallet', async (req, res) => {
  try {
    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request data', details: parsed.error.errors });
    }

    const { address, chain, signature, message, walletType, referredBy } = parsed.data;

    // Verify nonce from message
    const nonceMatch = message.match(/\n\n([A-Za-z0-9+/=]+)$/);
    if (!nonceMatch) {
      return res.status(400).json({ error: 'Invalid message format' });
    }
    const nonceData = verifyNonce(nonceMatch[1]);
    if (!nonceData || nonceData.address.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({ error: 'Invalid or expired nonce' });
    }

    // Verify signature based on chain
    let valid = false;
    if (chain === 'solana') {
      valid = verifySolanaSignature(message, signature, address);
    } else {
      valid = verifyEvmSignature(message, signature, address);
    }

    if (!valid) {
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    // Find or create user
    const user = await findOrCreateUser(address, chain, walletType, referredBy);

    // Record login history
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        walletAddress: address,
        chain,
        deviceInfo: req.headers['user-agent'] || null,
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'login',
        title: 'New Login',
        message: `Successfully logged in with ${chain} wallet.`,
      },
    });

    // Generate JWT
    const token = generateJWT(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        chain: user.chain,
        walletType: user.walletType,
        username: user.username,
        referralCode: user.referralCode,
        platformBalance: user.platformBalance,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Wallet auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, loadUser, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        wallets: true,
        referrals: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        chain: user.chain,
        walletType: user.walletType,
        username: user.username,
        referralCode: user.referralCode,
        platformBalance: user.platformBalance,
        totalEarned: user.totalEarned,
        totalDeposited: user.totalDeposited,
        totalWithdrawn: user.totalWithdrawn,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        wallets: user.wallets,
        referral: user.referrals[0] || null,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update username
router.patch('/username', authenticateToken, loadUser, async (req: AuthRequest, res) => {
  try {
    const { username } = req.body;
    if (!username || username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be 3-30 characters' });
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { username },
    });

    res.json({ username: user.username });
  } catch (error) {
    console.error('Update username error:', error);
    res.status(500).json({ error: 'Failed to update username' });
  }
});

export default router;