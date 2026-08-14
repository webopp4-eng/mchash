import { ethers } from 'ethers';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { v4 as uuid } from 'uuid';
import prisma from '../lib/prisma';

export type TokenPayload = {
  userId: string;
  iat?: number;
  exp?: number;
};

type NonceRecord = {
  address: string;
  chain: string;
  timestamp: number;
  used: boolean;
  csrfToken: string;
  deviceFingerprint?: string;
  ipAddress?: string;
};

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

const issuedNonces = new Map<string, NonceRecord>();
const rateLimitByIp = new Map<string, RateLimitRecord>();

const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function cleanupNonces(maxAgeMs = 5 * 60 * 1000) {
  const now = Date.now();
  for (const [nonce, record] of issuedNonces.entries()) {
    if (record.used || now - record.timestamp > maxAgeMs) issuedNonces.delete(nonce);
  }
}

function cleanupRateLimit() {
  const now = Date.now();
  for (const [ip, record] of rateLimitByIp.entries()) {
    if (now > record.resetTime) {
      rateLimitByIp.delete(ip);
    }
  }
}

/**
 * Check if IP has exceeded rate limit
 */
export function checkRateLimit(ipAddress: string): { allowed: boolean; remaining: number; resetTime?: number } {
  cleanupRateLimit();
  
  const record = rateLimitByIp.get(ipAddress);
  const now = Date.now();
  
  if (!record || now > record.resetTime) {
    // Create new window
    rateLimitByIp.set(ipAddress, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count, resetTime: record.resetTime };
}

/**
 * Generate device fingerprint from user-agent and IP
 */
export function generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
  return crypto
    .createHash('sha256')
    .update(`${userAgent}|${ipAddress}`)
    .digest('hex')
    .substring(0, 16);
}

// Generate a nonce for wallet signing
export function generateNonce(address: string, chain: string, deviceFingerprint?: string, ipAddress?: string): string {
  cleanupNonces();
  
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const payload = {
    address,
    chain,
    timestamp: Date.now(),
    random: crypto.randomBytes(16).toString('hex'),
    csrfToken,
  };
  const nonce = Buffer.from(JSON.stringify(payload)).toString('base64');
  issuedNonces.set(nonce, {
    address,
    chain,
    timestamp: payload.timestamp,
    used: false,
    csrfToken,
    deviceFingerprint,
    ipAddress,
  });
  
  if (process.env.ENABLE_DEBUG_LOGGING) {
    console.log(`[AUTH-DEBUG:NONCE] generateNonce() called for ${address} on ${chain}`);
    console.log(`[AUTH-DEBUG:NONCE] Nonce stored in Map, size now: ${issuedNonces.size}`);
    console.log(`[AUTH-DEBUG:NONCE] Nonce (first 20 chars): ${nonce.substring(0, 20)}...`);
  }
  
  return nonce;
}

export function verifyNonce(nonce: string, maxAgeMs = 5 * 60 * 1000): { address: string; chain: string; timestamp: number; csrfToken: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(nonce, 'base64').toString());
    if (Date.now() - payload.timestamp > maxAgeMs) return null;
    if (typeof payload.address !== 'string' || typeof payload.chain !== 'string' || typeof payload.csrfToken !== 'string') return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyAndConsumeNonce(nonce: string, address: string, chain: string, maxAgeMs = 5 * 60 * 1000): boolean {
  cleanupNonces(maxAgeMs);
  const record = issuedNonces.get(nonce);
  const payload = verifyNonce(nonce, maxAgeMs);
  
  if (process.env.ENABLE_DEBUG_LOGGING) {
    console.log(`[AUTH-DEBUG:NONCE] verifyAndConsumeNonce() called`);
    console.log(`[AUTH-DEBUG:NONCE] Nonce found in Map: ${!!record}`);
    console.log(`[AUTH-DEBUG:NONCE] Payload valid: ${!!payload}`);
    if (record) console.log(`[AUTH-DEBUG:NONCE] Nonce already used: ${record.used}`);
  }
  
  if (!record || record.used || !payload) {
    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:NONCE] Nonce validation FAILED: ${!record ? 'not found' : record.used ? 'already used' : 'invalid payload'}`);
    }
    return false;
  }
  
  if (record.address.toLowerCase() !== address.toLowerCase()) {
    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:NONCE] Address mismatch: ${record.address} !== ${address}`);
    }
    return false;
  }
  
  if (record.chain.toLowerCase() !== chain.toLowerCase()) {
    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:NONCE] Chain mismatch: ${record.chain} !== ${chain}`);
    }
    return false;
  }
  
  if (payload.address.toLowerCase() !== address.toLowerCase() ||
      payload.chain.toLowerCase() !== chain.toLowerCase()) {
    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:NONCE] Payload address/chain mismatch`);
    }
    return false;
  }
  
  record.used = true;
  issuedNonces.delete(nonce);
  
  if (process.env.ENABLE_DEBUG_LOGGING) {
    console.log(`[AUTH-DEBUG:NONCE] Nonce CONSUMED and deleted from Map`);
    console.log(`[AUTH-DEBUG:NONCE] verifyAndConsumeNonce() PASSED`);
  }
  
  return true;
}

export function createAuthMessage(address: string, chain: string, nonce: string, domain: string): string {
  const chainLabel = chain === 'solana' ? 'Solana' : chain === 'bnb' ? 'BNB Smart Chain' : 'Ethereum';
  const issuedAt = new Date().toISOString();
  const expiration = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  
  // Extract CSRF token from nonce if available
  let csrfNote = '';
  try {
    const noncePayload = JSON.parse(Buffer.from(nonce, 'base64').toString());
    if (noncePayload.csrfToken) {
      csrfNote = `\nCSRF Token: ${noncePayload.csrfToken.substring(0, 8)}...`;
    }
  } catch {
    // Ignore if nonce format unexpected
  }
  
  return [
    'Sign in to CM HASH',
    '',
    `Wallet: ${address}`,
    `Chain: ${chainLabel}`,
    `Domain: ${domain}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Expiration: ${expiration}`,
    '',
    'This signature is used only to authenticate your wallet.',
    'It does not authorize a blockchain transaction.',
    csrfNote,
  ].filter(line => line !== '').join('\n');
}

// Solana address validation (58-char base58, starts with specific patterns)
export function isValidSolanaAddress(address: string): boolean {
  // Base58 characters: 1-9, A-H, J-N, P-Z, a-k, m-z (no O, I, l, 0)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

export function isValidEvmAddress(address: string): boolean {
  return ethers.isAddress(address);
}

export function isValidWalletAddress(address: string, chain?: string): boolean {
  if (chain === 'solana') return isValidSolanaAddress(address);
  if (chain === 'ethereum' || chain === 'bnb') return isValidEvmAddress(address);
  return isValidSolanaAddress(address) || isValidEvmAddress(address);
}

export function verifySolanaSignature(message: string, signature: string, address: string): boolean {
  try {
    if (!isValidSolanaAddress(address)) {
      if (process.env.ENABLE_DEBUG_LOGGING) console.log(`[AUTH-DEBUG:SIGNATURE] Solana address invalid: ${address}`);
      return false;
    }
    const publicKey = bs58.decode(address);
    const signatureBytes = Buffer.from(signature, 'base64');
    const messageBytes = new TextEncoder().encode(message);
    const result = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey);
    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:SIGNATURE] Solana signature verification: ${result ? 'PASS' : 'FAIL'}`);
    }
    return result;
  } catch (err) {
    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:SIGNATURE] Solana signature error: ${err instanceof Error ? err.message : String(err)}`);
    }
    return false;
  }
}

// Ethereum/EVM signature verification
export function verifyEvmSignature(message: string, signature: string, address: string): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    const match = recoveredAddress.toLowerCase() === address.toLowerCase();
    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:SIGNATURE] EVM recovery: submitted=${address.substring(0, 10)}..., recovered=${recoveredAddress.substring(0, 10)}...`);
      console.log(`[AUTH-DEBUG:SIGNATURE] EVM signature verification: ${match ? 'PASS' : 'FAIL'}`);
    }
    return match;
  } catch (err) {
    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:SIGNATURE] EVM signature error: ${err instanceof Error ? err.message : String(err)}`);
    }
    return false;
  }
}

// Create or find user by wallet
export async function findOrCreateUser(walletAddress: string, chain: string, walletType?: string, referredBy?: string) {
  const normalizedAddress = walletAddress.trim().toLowerCase();

  if (!isValidWalletAddress(walletAddress, chain)) {
    throw new Error('Invalid wallet address');
  }

  if (process.env.ENABLE_DEBUG_LOGGING) {
    console.log(`[AUTH-DEBUG:WALLET] findOrCreateUser() called for ${normalizedAddress} on ${chain}`);
  }

  // First, look up the wallet record using the Wallet model
  // This is the source of truth for wallet identity
  let wallet = await prisma.wallet.findFirst({
    where: {
      address: normalizedAddress,
      chain: chain,
    },
    include: { User: true },
  });

  // If wallet exists, load the associated user
  if (wallet) {
    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:WALLET] Wallet found in database for ${normalizedAddress}, userId=${wallet.userId}`);
    }
    
    // Update the user's last login and wallet type
    const updatedUser = await prisma.user.update({
      where: { id: wallet.userId },
      data: {
        lastLoginAt: new Date(),
        walletType: walletType || wallet.User?.walletType,
        // Keep walletAddress in sync with primary wallet
        ...(wallet.isPrimary ? { walletAddress: normalizedAddress, chain } : {}),
      },
    });

    // Mark wallet as verified if not already
    if (!wallet.verifiedAt) {
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { verifiedAt: new Date() },
      });
      if (process.env.ENABLE_DEBUG_LOGGING) {
        console.log(`[AUTH-DEBUG:WALLET] Wallet marked as verified: ${wallet.id}`);
      }
    }

    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:WALLET] Returning existing user: id=${updatedUser.id}, created=false`);
    }

    return { user: updatedUser, created: false };
  }

  // Wallet doesn't exist - create new user and wallet
  if (process.env.ENABLE_DEBUG_LOGGING) {
    console.log(`[AUTH-DEBUG:WALLET] Wallet NOT found, creating new user and wallet`);
  }

  // Generate unique referral code
  let referralCode = '';
  do {
    referralCode = 'CMH' + crypto.randomBytes(4).toString('hex').toUpperCase();
  } while (await prisma.referral.findUnique({ where: { code: referralCode } }));

  // Create user
  const user = await prisma.user.create({
    data: {
      id: uuid(),
      walletAddress: normalizedAddress,
      chain,
      walletType: walletType || undefined,
      referralCode,
      username: `User_${normalizedAddress.slice(0, 6)}`,
      referredBy: referredBy || null,
      status: 'active',
      role: 'user',
      platformBalance: 0,
      authMethod: 'WALLET',
      updatedAt: new Date(),
    },
  });

  // Create wallet record
  const newWallet = await prisma.wallet.create({
    data: {
      id: uuid(),
      userId: user.id,
      chain,
      address: normalizedAddress,
      isPrimary: true,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  if (process.env.ENABLE_DEBUG_LOGGING) {
    console.log(`[AUTH-DEBUG:WALLET] Created user: id=${user.id}`);
    console.log(`[AUTH-DEBUG:WALLET] Created wallet: id=${newWallet.id}, address=${normalizedAddress}, isPrimary=true`);
    console.log(`[AUTH-DEBUG:WALLET] Returning new user: id=${user.id}, created=true`);
  }

  // Create referral record
  await prisma.referral.create({
    data: {
      id: uuid(),
      userId: user.id,
      code: referralCode,
    },
  });

  // Increment referrer's referral count if this user was referred
  if (referredBy) {
    await prisma.referral.updateMany({
      where: { userId: referredBy },
      data: {
        totalReferrals: { increment: 1 },
        activeReferrals: { increment: 1 },
      },
    });
  }

  return { user, created: true };
}

// Generate JWT token
export function generateJWT(userId: string): string {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET || 'super-secret-key-change-me',
    { expiresIn: '7d' }
  );
}

// Verify JWT
export function verifyJWT(token: string): string | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-change-me') as { sub: string };
    return decoded.sub;
  } catch {
    return null;
  }
}

// Verify token and return decoded payload
export function verifyTokenPayload(token: string): { sub: string } | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-change-me') as { sub: string };
    return decoded;
  } catch (error) {
    if (process.env.ENABLE_DEBUG_LOGGING) {
      console.log(`[AUTH-DEBUG:TOKEN] Token verification failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    return null;
  }
}
