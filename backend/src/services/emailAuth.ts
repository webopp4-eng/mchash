import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]*/;

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password || password.length === 0) {
    errors.push('Password is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate full name
 */
export function isValidFullName(fullName: string): boolean {
  return Boolean(fullName && fullName.trim().length > 0);
}

/**
 * Validate username
 */
export function isValidUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  // Just require that username exists and is not empty
  if (!username || username.trim().length === 0) {
    return {
      valid: false,
      error: 'Username is required',
    };
  }

  return { valid: true };
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if email is already registered
 */
export async function isEmailExists(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  return !!user;
}

/**
 * Check if username is already taken
 */
export async function isUsernameExists(username: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });
  return !!user;
}

/**
 * Normalize email to lowercase
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Validate signup data
 */
export async function validateSignupData(data: {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  username: string;
  country: string;
}): Promise<{ valid: boolean; errors: Record<string, string> }> {
  const errors: Record<string, string> = {};

  // Validate email
  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Invalid email format';
  } else if (await isEmailExists(normalizeEmail(data.email))) {
    errors.email = 'Email already registered';
  }

  // Validate password
  if (!data.password) {
    errors.password = 'Password is required';
  }

  // Validate password confirmation
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // Validate full name
  if (!data.fullName) {
    errors.fullName = 'Full name is required';
  }

  // Validate username
  if (!data.username) {
    errors.username = 'Username is required';
  } else if (await isUsernameExists(data.username)) {
    errors.username = 'Username already taken';
  }

  // Validate country
  if (!data.country || data.country.trim().length === 0) {
    errors.country = 'Country is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate login data
 */
export function validateLoginData(data: {
  email: string;
  password: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Invalid email format';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
