import { ethers } from 'ethers';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import prisma from '../lib/prisma';

type NonceRecord = {
  address: string;
  chain: string;
  timestamp: number;
  used: boolean;
};

const issuedNonces = new Map<string, NonceRecord>();

function cleanupNonces(maxAgeMs = 5 * 60 * 1000) {
  const now = Date.now();
  for (const [nonce, record] of issuedNonces.entries()) {
    if (record.used || now - record.timestamp > maxAgeMs) issuedNonces.delete(nonce);
  }
}

// Generate a nonce for wallet signing
export function generateNonce(address: string, chain: string): string {
  cleanupNonces();
  const payload = {
    address,
    chain,
    timestamp: Date.now(),
    random: crypto.randomBytes(16).toString('hex'),
  };
  const nonce = Buffer.from(JSON.stringify(payload)).toString('base64');
  issuedNonces.set(nonce, {
    address,
    chain,
    timestamp: payload.timestamp,
    used: false,
  });
  return nonce;
}

export function verifyNonce(nonce: string, maxAgeMs = 5 * 60 * 1000): { address: string; chain: string; timestamp: number } | null {
  try {
    const payload = JSON.parse(Buffer.from(nonce, 'base64').toString());
    if (Date.now() - payload.timestamp > maxAgeMs) return null;
    if (typeof payload.address !== 'string' || typeof payload.chain !== 'string') return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyAndConsumeNonce(nonce: string, address: string, chain: string, maxAgeMs = 5 * 60 * 1000): boolean {
  cleanupNonces(maxAgeMs);
  const record = issuedNonces.get(nonce);
  const payload = verifyNonce(nonce, maxAgeMs);
  if (!record || record.used || !payload) return false;
  if (record.address.toLowerCase() !== address.toLowerCase()) return false;
  if (record.chain.toLowerCase() !== chain.toLowerCase()) return false;
  if (payload.address.toLowerCase() !== address.toLowerCase()) return false;
  if (payload.chain.toLowerCase() !== chain.toLowerCase()) return false;
  record.used = true;
  issuedNonces.delete(nonce);
  return true;
}

export function createAuthMessage(address: string, chain: string, nonce: string, domain: string): string {
  const chainLabel = chain === 'solana' ? 'Solana' : chain === 'bnb' ? 'BNB Smart Chain' : 'Ethereum';
  const issuedAt = new Date().toISOString();
  const expiration = new Date(Date.now() + 5 * 60 * 1000).toISOString();
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
  ].join('\n');
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
    if (!isValidSolanaAddress(address)) return false;
    const publicKey = bs58.decode(address);
    const signatureBytes = Buffer.from(signature, 'base64');
    const messageBytes = new TextEncoder().encode(message);
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey);
  } catch {
    return false;
  }
}

// Ethereum/EVM signature verification
export function verifyEvmSignature(message: string, signature: string, address: string): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}

// Create or find user by wallet
export async function findOrCreateUser(walletAddress: string, chain: string, walletType?: string, referredBy?: string) {
  const normalizedAddress = walletAddress.trim().toLowerCase();

  if (!isValidWalletAddress(walletAddress, chain)) {
    throw new Error('Invalid wallet address');
  }

  const existing = await prisma.user.findFirst({
    where: {
      walletAddress: {
        equals: normalizedAddress,
        mode: 'insensitive',
      },
    },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        lastLoginAt: new Date(),
        walletType,
        chain,
        status: existing.status || 'active',
      },
    });

    const refreshedUser = await prisma.user.findUnique({ where: { id: existing.id } });
    if (!refreshedUser) {
      throw new Error('Wallet lookup succeeded but the refreshed user record is missing');
    }

    return { user: refreshedUser, created: false };
  }

  // Generate unique referral code
  let referralCode = '';
  do {
    referralCode = 'CMH' + crypto.randomBytes(4).toString('hex').toUpperCase();
  } while (await prisma.referral.findUnique({ where: { code: referralCode } }));

  const user = await prisma.user.create({
    data: {
      walletAddress: normalizedAddress,
      chain,
      walletType,
      referralCode,
      username: `User_${normalizedAddress.slice(0, 6)}`,
      referredBy: referredBy || null,
      status: 'active',
      platformBalance: 0,
    },
  });

  // Create referral record
  await prisma.referral.create({
    data: {
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
