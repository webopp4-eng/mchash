import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import crypto from 'crypto';
import QRCode from 'qrcode';
import {
  generateNonce,
  verifyAndConsumeNonce,
  verifyEvmSignature,
  verifySolanaSignature,
  findOrCreateUser,
  generateJWT,
  isValidWalletAddress,
  createAuthMessage,
} from '../services/walletAuth';
import { authenticateToken, loadUser, AuthRequest } from '../middleware/auth';

const router = Router();

// Store for QR code sessions
const qrSessions = new Map<string, {
  address?: string;
  chain?: string;
  walletType?: string;
  connectionUri?: string;
  nonce: string;
  expiresAt: Date;
  used: boolean;
}>();

// Clean up expired QR sessions periodically
setInterval(() => {
  const now = new Date();
  for (const [id, session] of qrSessions.entries()) {
    if (session.expiresAt < now) {
      qrSessions.delete(id);
    }
  }
}, 60000);

// Get nonce for wallet signing
router.get('/nonce/:address', (req, res) => {
  const { address } = req.params;
  const chain = String(req.query.chain || '').toLowerCase();
  if (!address || !chain || !isValidWalletAddress(address, chain)) {
    return res.status(400).json({ error: 'Invalid wallet address or chain' });
  }

  const nonce = generateNonce(address, chain);
  const message = createAuthMessage(address, chain, nonce, process.env.FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL || 'https://mchash.onrender.com');
  res.json({ nonce, message });
});

// Generate QR code session
router.post('/qr/session', async (req, res) => {
  try {
    const connectionUri = typeof req.body?.connectionUri === 'string' ? req.body.connectionUri.trim() : '';
    if (connectionUri && !connectionUri.startsWith('wc:')) {
      return res.status(400).json({ error: 'Invalid WalletConnect URI' });
    }

    const sessionId = crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(16).toString('base64');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const qrPayload = {
      type: 'cmhash_wallet_auth',
      sessionId,
      nonce,
      connectionUri: connectionUri || null,
      metadata: {
        name: 'CM HASH',
        description: 'Wallet address sign-in for CM HASH',
        url: process.env.FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL || 'https://mchash.vercel.app',
      },
      issuedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    const qrData = connectionUri || JSON.stringify(qrPayload);
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 240,
      margin: 1,
      color: {
        dark: '#1c9aff',
        light: '#ffffff',
      },
    });

    qrSessions.set(sessionId, {
      connectionUri: connectionUri || undefined,
      nonce,
      expiresAt,
      used: false,
    });

    res.json({
      sessionId,
      qrData,
      qrCodeDataUrl,
      expiresAt,
      connectionUri: connectionUri || null,
      metadata: qrPayload.metadata,
    });
  } catch (error) {
    console.error('QR session error:', error);
    res.status(500).json({ error: 'Failed to create QR session' });
  }
});

// Check QR session status
router.get('/qr/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = qrSessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.used) {
    return res.json({ status: 'used', address: session.address, chain: session.chain, walletType: session.walletType });
  }

  if (session.expiresAt < new Date()) {
    qrSessions.delete(sessionId);
    return res.status(404).json({ error: 'Session expired' });
  }

  res.json({ status: 'pending' });
});

// Complete QR login
router.post('/qr/session/:sessionId/complete', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { address, chain, signature, message, walletType } = req.body;

    const session = qrSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.used) {
      return res.status(400).json({ error: 'Session already used' });
    }

    if (session.expiresAt < new Date()) {
      qrSessions.delete(sessionId);
      return res.status(400).json({ error: 'Session expired' });
    }

    const nonceMatch = typeof message === 'string' ? message.match(/Nonce:\s*([A-Za-z0-9+/=]+)$/) : null;
    if (!nonceMatch || !verifyAndConsumeNonce(nonceMatch[1], address, chain)) {
      return res.status(400).json({ error: 'Invalid or expired nonce' });
    }

    // Verify signature
    let valid = false;
    if (chain === 'solana') {
      valid = verifySolanaSignature(message, signature, address);
    } else {
      valid = verifyEvmSignature(message, signature, address);
    }

    if (!valid) {
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    // Mark session as used
    session.used = true;
    session.address = address;
    session.chain = chain;
    session.walletType = walletType;

    // Find or create user
    const { user, created } = await findOrCreateUser(address, chain, walletType);
    if (!user) {
      return res.status(500).json({ error: 'Unable to materialize wallet account' });
    }

    // Generate JWT
    const token = generateJWT(user.id);

    // Record login
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        walletAddress: address.toLowerCase(),
        chain,
        deviceInfo: req.headers['user-agent'] || null,
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    res.json({
      token,
      created,
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
    console.error('QR complete error:', error);
    res.status(500).json({ error: 'Failed to complete QR login' });
  }
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
    if (!isValidWalletAddress(address, chain)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const nonceMatch = message.match(/Nonce:\s*([A-Za-z0-9+/=]+)$/);
    if (!nonceMatch) {
      return res.status(400).json({ error: 'Invalid message format' });
    }
    if (!verifyAndConsumeNonce(nonceMatch[1], address, chain)) {
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

    // Resolve referral code to referrer user ID if provided
    let referrerId: string | undefined;
    if (referredBy) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referredBy },
        select: { id: true },
      });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    // Find or create user
    const { user, created } = await findOrCreateUser(address, chain, walletType, referrerId);
    if (!user) {
      return res.status(500).json({ error: 'Unable to materialize wallet account' });
    }

    // Record login history
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        walletAddress: address.toLowerCase(),
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
        title: created ? 'New Account Created' : 'Welcome Back',
        message: created
          ? `New wallet account created for ${chain} wallet.`
          : `Successfully logged in with ${chain} wallet.`,
      },
    });

    // Generate JWT
    const token = generateJWT(user.id);

    res.json({
      token,
      created,
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
