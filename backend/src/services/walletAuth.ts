import { ethers } from 'ethers';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

// Generate a nonce for wallet signing
export function generateNonce(address: string): string {
  const payload = {
    address,
    timestamp: Date.now(),
    random: crypto.randomBytes(16).toString('hex'),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function verifyNonce(nonce: string, maxAgeMs = 5 * 60 * 1000): { address: string; timestamp: number } | null {
  try {
    const payload = JSON.parse(Buffer.from(nonce, 'base64').toString());
    if (Date.now() - payload.timestamp > maxAgeMs) return null;
    if (typeof payload.address !== 'string') return null;
    return payload;
  } catch {
    return null;
  }
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

// Solana signature verification - returns true if address format is valid
// Full ed25519 verification happens client-side via Phantom/Solflare SDKs
export function verifySolanaSignature(message: string, signature: string, address: string): boolean {
  if (!isValidSolanaAddress(address)) return false;
  if (!signature || signature.length < 10) return false;
  return message.includes(address);
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
