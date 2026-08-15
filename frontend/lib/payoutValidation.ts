/**
 * Client-side validation utilities for payout methods
 */

export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  if (address.length !== 44) return false;
  const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
  return base58Regex.test(address);
}

export function isValidEthereumAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  if (address.length !== 42) return false;
  if (!address.startsWith('0x')) return false;
  const hexRegex = /^0x[0-9a-fA-F]{40}$/;
  return hexRegex.test(address);
}

export function isValidBnbAddress(address: string): boolean {
  return isValidEthereumAddress(address);
}

export function isValidMomoNumber(number: string): boolean {
  if (!number || typeof number !== 'string') return false;
  const cleaned = number.replace(/[^\d+]/g, '');
  if (cleaned.length < 10 || cleaned.length > 15) return false;
  if (cleaned.startsWith('+') && cleaned.length < 11) return false;
  return true;
}

export function isValidBankAccountNumber(accountNumber: string): boolean {
  if (!accountNumber || typeof accountNumber !== 'string') return false;
  const cleaned = accountNumber.replace(/[\s\-]/g, '');
  if (cleaned.length < 8 || cleaned.length > 34) return false;
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  return alphanumericRegex.test(cleaned);
}
