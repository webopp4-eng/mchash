/**
 * Validation utilities for payout methods
 */

/**
 * Validate Solana wallet address
 * Solana addresses are 44 characters long and base58 encoded
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  
  // Solana addresses are 44 characters long (when base58 encoded)
  if (address.length !== 44) return false;
  
  // Check if only valid base58 characters
  const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
  return base58Regex.test(address);
}

/**
 * Validate Ethereum / BSC address
 * Must be 42 characters starting with 0x
 */
export function isValidEthereumAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  
  // Ethereum addresses must be 42 chars (0x + 40 hex chars)
  if (address.length !== 42) return false;
  
  // Must start with 0x
  if (!address.startsWith('0x')) return false;
  
  // Check if remaining characters are valid hex
  const hexRegex = /^0x[0-9a-fA-F]{40}$/;
  return hexRegex.test(address);
}

/**
 * Validate BNB Chain address (same as Ethereum)
 */
export function isValidBnbAddress(address: string): boolean {
  return isValidEthereumAddress(address);
}

/**
 * Validate MoMo phone number
 * Supports various African country formats
 * Basic validation for phone numbers
 */
export function isValidMomoNumber(number: string): boolean {
  if (!number || typeof number !== 'string') return false;
  
  // Remove all non-digit characters except leading +
  const cleaned = number.replace(/[^\d+]/g, '');
  
  // Must be 10-15 digits (E.164 format typically 10-15)
  if (cleaned.length < 10 || cleaned.length > 15) return false;
  
  // If starts with +, must have country code
  if (cleaned.startsWith('+') && cleaned.length < 11) return false;
  
  return true;
}

/**
 * Validate bank account number
 * Varies by country, basic validation for length and format
 */
export function isValidBankAccountNumber(accountNumber: string): boolean {
  if (!accountNumber || typeof accountNumber !== 'string') return false;
  
  // Remove spaces and hyphens
  const cleaned = accountNumber.replace(/[\s\-]/g, '');
  
  // Account numbers typically 8-34 characters (IBAN max is 34)
  if (cleaned.length < 8 || cleaned.length > 34) return false;
  
  // Must contain at least some alphanumeric characters
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  return alphanumericRegex.test(cleaned);
}

/**
 * Validate crypto address based on network
 */
export function isValidCryptoAddress(address: string, network: string): boolean {
  const networkLower = network.toLowerCase();
  
  if (networkLower === 'ethereum') {
    return isValidEthereumAddress(address);
  } else if (networkLower === 'bnb') {
    return isValidBnbAddress(address);
  } else if (networkLower === 'solana') {
    return isValidSolanaAddress(address);
  }
  
  return false;
}

/**
 * Validate payout method data based on type
 */
export function isValidPayoutMethod(
  type: string,
  data: Record<string, any>
): { valid: boolean; error?: string } {
  const typeStr = type.toLowerCase();
  
  if (typeStr === 'solana') {
    if (!data.solanaAddress) {
      return { valid: false, error: 'Solana address is required' };
    }
    if (!isValidSolanaAddress(data.solanaAddress)) {
      return { valid: false, error: 'Invalid Solana wallet address' };
    }
    if (!data.name || data.name.trim().length === 0) {
      return { valid: false, error: 'Payout method name is required' };
    }
    return { valid: true };
  }
  
  if (typeStr === 'crypto') {
    if (!data.address) {
      return { valid: false, error: 'Wallet address is required' };
    }
    if (!data.network) {
      return { valid: false, error: 'Network is required' };
    }
    if (!isValidCryptoAddress(data.address, data.network)) {
      return { valid: false, error: `Invalid address for ${data.network}` };
    }
    if (!data.name || data.name.trim().length === 0) {
      return { valid: false, error: 'Payout method name is required' };
    }
    return { valid: true };
  }
  
  if (typeStr === 'momo') {
    if (!data.momoNumber) {
      return { valid: false, error: 'MoMo number is required' };
    }
    if (!isValidMomoNumber(data.momoNumber)) {
      return { valid: false, error: 'Invalid MoMo number format' };
    }
    if (!data.momoName || data.momoName.trim().length === 0) {
      return { valid: false, error: 'Account holder name is required' };
    }
    if (!data.name || data.name.trim().length === 0) {
      return { valid: false, error: 'Payout method name is required' };
    }
    return { valid: true };
  }
  
  if (typeStr === 'bank') {
    if (!data.accountNumber) {
      return { valid: false, error: 'Account number is required' };
    }
    if (!isValidBankAccountNumber(data.accountNumber)) {
      return { valid: false, error: 'Invalid account number format' };
    }
    if (!data.accountHolder || data.accountHolder.trim().length === 0) {
      return { valid: false, error: 'Account holder name is required' };
    }
    if (!data.bankName || data.bankName.trim().length === 0) {
      return { valid: false, error: 'Bank name is required' };
    }
    if (!data.name || data.name.trim().length === 0) {
      return { valid: false, error: 'Payout method name is required' };
    }
    return { valid: true };
  }
  
  return { valid: false, error: 'Unknown payout method type' };
}
