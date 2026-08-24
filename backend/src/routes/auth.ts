import { Router, Request } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
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
  checkRateLimit,
  generateDeviceFingerprint,
  verifyTokenPayload,
} from '../services/walletAuth';
import {
  hashPassword,
  verifyPassword,
  validateSignupData,
  validateLoginData,
  normalizeEmail,
} from '../services/emailAuth';
import { authenticateToken, loadUser, AuthRequest } from '../middleware/auth';

const router = Router();

// Helper to resolve the client IP consistently (handles proxies)
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

// Helper to compute the device fingerprint for the current request
function getDeviceFingerprint(req: Request): string {
  const userAgent = req.headers['user-agent'] || 'unknown';
  return generateDeviceFingerprint(userAgent, getClientIp(req));
}

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

  // Check rate limit
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'unknown';
  const rateLimitCheck = checkRateLimit(clientIp);
  
  if (!rateLimitCheck.allowed) {
    const resetTimeSeconds = Math.ceil((rateLimitCheck.resetTime! - Date.now()) / 1000);
    res.set('RateLimit-Limit', '5');
    res.set('RateLimit-Remaining', '0');
    res.set('RateLimit-Reset', String(Math.ceil(rateLimitCheck.resetTime! / 1000)));
    return res.status(429).json({ 
      error: `Rate limit exceeded. Please try again in ${resetTimeSeconds} seconds.`,
      retryAfter: resetTimeSeconds,
    });
  }

  // Generate device fingerprint
  const userAgent = req.headers['user-agent'] || 'unknown';
  const deviceFingerprint = generateDeviceFingerprint(userAgent, clientIp);

  const nonce = generateNonce(address, chain, deviceFingerprint, clientIp);
  const message = createAuthMessage(address, chain, nonce, process.env.FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL || 'https://mchash.site');
  
  // Set rate limit headers
  res.set('RateLimit-Limit', '5');
  res.set('RateLimit-Remaining', String(rateLimitCheck.remaining));
  res.set('RateLimit-Reset', String(Math.ceil(rateLimitCheck.resetTime! / 1000)));
  
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
        url: process.env.FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL || '',
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

    const nonceMatch = typeof message === 'string' ? message.match(/Nonce:\s*([A-Za-z0-9+/=]+)/) : null;
    if (!nonceMatch || !verifyAndConsumeNonce(nonceMatch[1], address, chain, 5 * 60 * 1000, getDeviceFingerprint(req), getClientIp(req))) {
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

    // Set JWT as httpOnly cookie (secure against XSS)
    res.cookie('cmhash_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Record login
    await prisma.loginHistory.create({
      data: {
        id: uuid(),
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
  address: z.string().min(1),
  chain: z.enum(['solana', 'ethereum', 'bnb']),
  signature: z.string().min(1),
  message: z.string(),
  walletType: z.string().optional(),
  referredBy: z.string().optional(),
});

router.post('/wallet', async (req, res) => {
  try {
    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:REQUEST] POST /api/auth/wallet received`);
      console.log(`[AUTH-DEBUG:REQUEST] Body: address=${req.body.address?.substring(0, 10)}..., chain=${req.body.chain}`);
    }

    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success) {
      if (process.env.ENABLE_DEBUG_LOGGING) {
        console.log(`[AUTH-DEBUG:REQUEST] Validation failed: ${JSON.stringify(parsed.error.errors)}`);
      }
      return res.status(400).json({ error: 'Invalid request data', details: parsed.error.errors });
    }

    const { address, chain, signature, message, walletType, referredBy } = parsed.data;

    // Verify nonce from message
    if (!isValidWalletAddress(address, chain)) {
      if (process.env.ENABLE_DEBUG_LOGGING) {
        console.log(`[AUTH-DEBUG:REQUEST] Invalid wallet address: ${address}`);
      }
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const nonceMatch = message.match(/Nonce:\s*([A-Za-z0-9+/=]+)/);
    if (!nonceMatch) {
      if (process.env.ENABLE_DEBUG_LOGGING) {
        console.log(`[AUTH-DEBUG:NONCE] Message does not contain valid Nonce field`);
        console.log(`[AUTH-DEBUG:NONCE] Message preview: ${message.substring(0, 100)}...`);
      }
      return res.status(400).json({ error: 'Invalid message format. Missing nonce.' });
    }

    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:NONCE] Nonce extracted from message: ${nonceMatch[1].substring(0, 20)}...`);
    }

    if (!verifyAndConsumeNonce(nonceMatch[1], address, chain, 5 * 60 * 1000, getDeviceFingerprint(req), getClientIp(req))) {
      if (process.env.ENABLE_DEBUG_LOGGING) {
        console.log(`[AUTH-DEBUG:NONCE] Nonce verification failed`);
      }
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
      if (process.env.ENABLE_DEBUG_LOGGING) {
        console.log(`[AUTH-DEBUG:SIGNATURE] Signature verification FAILED`);
      }
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:SIGNATURE] Signature verification PASSED`);
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
        if (process.env.ENABLE_DEBUG_LOGGING) {
          console.log(`[AUTH-DEBUG:REQUEST] Referrer found: ${referrerId}`);
        }
      }
    }

    // Find or create user
    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:SESSION] Calling findOrCreateUser()`);
    }

    const { user, created } = await findOrCreateUser(address, chain, walletType, referrerId);
    if (!user) {
      if (process.env.ENABLE_DEBUG_LOGGING) {
        console.log(`[AUTH-DEBUG:SESSION] findOrCreateUser returned null user`);
      }
      return res.status(500).json({ error: 'Unable to materialize wallet account' });
    }

    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:SESSION] User resolved: id=${user.id}, created=${created}`);
    }

    // Record login history
    await prisma.loginHistory.create({
      data: {
        id: uuid(),
        userId: user.id,
        walletAddress: address.toLowerCase(),
        chain,
        deviceInfo: req.headers['user-agent'] || null,
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:SESSION] Login history recorded`);
    }

    // Create notification
    await prisma.notification.create({
      data: {
        id: uuid(),
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

    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:SESSION] JWT token generated: ${token.substring(0, 20)}...`);
    }

    // Set JWT as httpOnly cookie (secure against XSS)
    // Using 'sameSite: lax' for cross-site POST requests from wallet apps
    res.cookie('cmhash_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:SESSION] httpOnly cookie set: cmhash_token, httpOnly=true, secure=${process.env.NODE_ENV === 'production'}, sameSite=lax`);
    }

    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:REQUEST] POST /api/auth/wallet response: status=200, user.id=${user.id}, created=${created}`);
    }

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

// Connect wallet to existing email account
const connectWalletSchema = z.object({
  address: z.string().min(1),
  chain: z.enum(['solana', 'ethereum', 'bnb']),
  signature: z.string().min(1),
  message: z.string(),
  walletType: z.string().optional(),
});

router.post('/wallet/connect', authenticateToken, loadUser, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:WALLET] POST /api/auth/wallet/connect received, user=${user.id}`);
    }

    const parsed = connectWalletSchema.safeParse(req.body);
    if (!parsed.success) {
      if (process.env.ENABLE_DEBUG_LOGGING) {
        console.log(`[AUTH-DEBUG:WALLET] Validation failed: ${JSON.stringify(parsed.error.errors)}`);
      }
      return res.status(400).json({ error: 'Invalid request data', details: parsed.error.errors });
    }

    const { address, chain, signature, message, walletType } = parsed.data;

    // Validate wallet address
    if (!isValidWalletAddress(address, chain)) {
      if (process.env.ENABLE_DEBUG_LOGGING) {
        console.log(`[AUTH-DEBUG:WALLET] Invalid wallet address: ${address}`);
      }
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // Verify nonce from message
    const nonceMatch = message.match(/Nonce:\s*([A-Za-z0-9+/=]+)/);
    if (!nonceMatch) {
      if (process.env.ENABLE_DEBUG_LOGGING) {
        console.log(`[AUTH-DEBUG:WALLET] Message format invalid, no Nonce found`);
      }
      return res.status(400).json({ error: 'Invalid message format. Missing nonce.' });
    }

    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:NONCE] Verifying nonce for wallet connect`);
    }

    if (!verifyAndConsumeNonce(nonceMatch[1], address, chain, 5 * 60 * 1000, getDeviceFingerprint(req), getClientIp(req))) {
      if (process.env.ENABLE_DEBUG_LOGGING) {
        console.log(`[AUTH-DEBUG:NONCE] Nonce verification failed`);
      }
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
      if (process.env.ENABLE_DEBUG_LOGGING) {
        console.log(`[AUTH-DEBUG:SIGNATURE] Signature verification failed for wallet connect`);
      }
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:SIGNATURE] Signature verification PASSED for wallet connect`);
    }

    const normalizedAddress = address.toLowerCase();

    // Check if this wallet is already associated with another account
    const existingWallet = await prisma.wallet.findFirst({
      where: {
        address: normalizedAddress,
        chain: chain,
      },
    });

    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:WALLET] Existing wallet check: found=${!!existingWallet}`);
      if (existingWallet) {
        console.log(`[AUTH-DEBUG:WALLET] Existing wallet userId: ${existingWallet.userId}, current user: ${user.id}`);
      }
    }

    if (existingWallet && existingWallet.userId !== user.id) {
      if (process.env.ENABLE_DEBUG_LOGGING) {
        console.log(`[AUTH-DEBUG:WALLET] Duplicate prevention: wallet belongs to different user`);
      }
      return res.status(400).json({ 
        error: 'This wallet is already connected to another account' 
      });
    }

    // If wallet exists and belongs to this user, just mark it verified and return success
    if (existingWallet) {
      if (process.env.ENABLE_DEBUG_LOGGING) {
        console.log(`[AUTH-DEBUG:WALLET] Wallet already belongs to this user`);
      }
      
      if (!existingWallet.verifiedAt) {
        await prisma.wallet.update({
          where: { id: existingWallet.id },
          data: { verifiedAt: new Date() },
        });
        if (process.env.ENABLE_DEBUG_LOGGING) {
          console.log(`[AUTH-DEBUG:WALLET] Marked wallet as verified`);
        }
      }

      return res.json({
        message: 'Wallet already connected',
        wallet: {
          id: existingWallet.id,
          address: existingWallet.address,
          chain: existingWallet.chain,
          isPrimary: existingWallet.isPrimary,
          verifiedAt: existingWallet.verifiedAt,
        },
      });
    }

    // Create new wallet record for this user
    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:WALLET] Creating new wallet for user: ${normalizedAddress} on ${chain}`);
    }
    
    const wallet = await prisma.wallet.create({
      data: {
        id: uuid(),
        userId: user.id,
        chain,
        address: normalizedAddress,
        verifiedAt: new Date(),
        isPrimary: false,
        updatedAt: new Date(),
      },
    });

    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:WALLET] Wallet created: id=${wallet.id}, address=${normalizedAddress}, isPrimary=false`);
    }

    // Update user to reflect they have a connected wallet
    await prisma.user.update({
      where: { id: user.id },
      data: {
        walletType: walletType || undefined,
      },
    });

    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:WALLET] User updated with wallet connection`);
      console.log(`[AUTH-DEBUG:REQUEST] POST /api/auth/wallet/connect response: status=201, wallet=${wallet.id}`);
    }

    res.status(201).json({
      message: 'Wallet successfully connected',
      wallet: {
        id: wallet.id,
        address: wallet.address,
        chain: wallet.chain,
        isPrimary: wallet.isPrimary,
        verifiedAt: wallet.verifiedAt,
      },
    });
  } catch (error) {
    console.error('[connectWallet] Error:', error);
    res.status(500).json({ error: 'Failed to connect wallet' });
  }
});

// Check if session is valid (returns user data from httpOnly cookie, no auth middleware needed)
router.get('/session-check', async (req, res) => {
  try {
    // Get token from httpOnly cookie
    const token = req.cookies?.cmhash_token;
    if (!token) {
      return res.json({ authenticated: false });
    }

    // Verify token is valid
    const decoded = verifyTokenPayload(token);
    if (!decoded) {
      res.clearCookie('cmhash_token');
      return res.json({ authenticated: false });
    }

    // Load user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { Wallet: true },
    });

    if (!user) {
      res.clearCookie('cmhash_token');
      return res.json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        chain: user.chain,
        walletType: user.walletType,
        username: user.username,
        referralCode: user.referralCode,
        platformBalance: user.platformBalance,
        role: user.role,
        status: user.status,
        employeeStatus: user.employeeStatus,
      },
    });
  } catch (error) {
    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.error('[AUTH-DEBUG:SESSION] session-check error:', error);
    }
    res.json({ authenticated: false });
  }
});

// Get current user
router.get('/me', authenticateToken, loadUser, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        Wallet: true,
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
        employeeStatus: user.employeeStatus,
        createdAt: user.createdAt,
        wallets: user.Wallet,
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

// Logout endpoint - clears httpOnly cookie
router.post('/logout', (req, res) => {
  res.clearCookie('cmhash_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  res.json({ message: 'Logged out successfully' });
});

// ============ EMAIL AUTHENTICATION ROUTES ============

// Email signup
router.post('/email/register', async (req, res) => {
  try {
    const { email, password, confirmPassword, fullName, username, country } = req.body;

    // Basic validation - only require email and password
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const normalizedEmail = normalizeEmail(email);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate unique username if not provided
    let finalUsername = username || email.split('@')[0];
    let usernameAttempt = finalUsername;
    let usernameTaken = await prisma.user.findUnique({ where: { username: usernameAttempt } });
    let counter = 1;
    while (usernameTaken) {
      usernameAttempt = `${finalUsername}${counter}`;
      counter++;
      usernameTaken = await prisma.user.findUnique({ where: { username: usernameAttempt } });
    }
    finalUsername = usernameAttempt;

    // Generate unique referral code
    let referralCode = '';
    do {
      referralCode = 'CMH' + crypto.randomBytes(4).toString('hex').toUpperCase();
    } while (await prisma.referral.findUnique({ where: { code: referralCode } }));

    // Create user
    const user = await prisma.user.create({
      data: {
        id: uuid(),
        email: normalizedEmail,
        passwordHash,
        fullName: fullName || email.split('@')[0],
        username: finalUsername,
        country: country || 'Not specified',
        authMethod: 'EMAIL',
        referralCode,
        status: 'active',
        role: 'user',
        platformBalance: 0,
        updatedAt: new Date(),
      },
    });

    // Create referral record
    await prisma.referral.create({
      data: {
        id: uuid(),
        userId: user.id,
        code: referralCode,
      },
    });

    // Generate JWT
    const token = generateJWT(user.id);

    // Set JWT as httpOnly cookie
    res.cookie('cmhash_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Record login
    await prisma.loginHistory.create({
      data: {
        id: uuid(),
        userId: user.id,
        walletAddress: 'email-signup',
        chain: 'none',
        deviceInfo: req.headers['user-agent'] || null,
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        id: uuid(),
        userId: user.id,
        type: 'login',
        title: 'Welcome to CM HASH',
        message: 'Your account has been created successfully. You can now sign in and start using the platform.',
      },
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        username: user.username,
        country: user.country,
        authMethod: user.authMethod,
        referralCode: user.referralCode,
        platformBalance: user.platformBalance,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Email signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Email login
router.post('/email/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const validation = validateLoginData({ email, password });
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
    }

    const normalizedEmail = normalizeEmail(email);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Your account is not active. Please contact support.' });
    }

    // Verify password
    if (!user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT
    const token = generateJWT(user.id);

    // Set JWT as httpOnly cookie
    res.cookie('cmhash_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Record login
    await prisma.loginHistory.create({
      data: {
        id: uuid(),
        userId: user.id,
        walletAddress: 'email-login',
        chain: 'none',
        deviceInfo: req.headers['user-agent'] || null,
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        id: uuid(),
        userId: user.id,
        type: 'login',
        title: 'Welcome Back',
        message: 'You have successfully logged in.',
      },
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        username: user.username,
        country: user.country,
        authMethod: user.authMethod,
        referralCode: user.referralCode,
        platformBalance: user.platformBalance,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Email login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ============ COMMENT: Duplicate /wallet/connect removed - see line 452 ============

// Get user's wallets
router.get('/wallets', authenticateToken, loadUser, async (req: AuthRequest, res) => {
  try {
    const wallets = await prisma.wallet.findMany({
      where: { userId: req.user!.id },
      select: {
        id: true,
        address: true,
        chain: true,
        isPrimary: true,
        balance: true,
        verifiedAt: true,
        createdAt: true,
      },
    });

    res.json({ wallets });
  } catch (error) {
    console.error('Get wallets error:', error);
    res.status(500).json({ error: 'Failed to fetch wallets' });
  }
});

// Disconnect wallet
router.delete('/wallet/:walletId', authenticateToken, loadUser, async (req: AuthRequest, res) => {
  try {
    const { walletId } = req.params;

    // Verify wallet belongs to user
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    if (wallet.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete the wallet
    await prisma.wallet.delete({
      where: { id: walletId },
    });

    res.json({ message: 'Wallet disconnected successfully' });
  } catch (error) {
    console.error('Disconnect wallet error:', error);
    res.status(500).json({ error: 'Failed to disconnect wallet' });
  }
});

export default router;
