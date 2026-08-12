import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

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

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
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
  return fullName.trim().length >= 2 && fullName.trim().length <= 100;
}

/**
 * Validate username
 */
export function isValidUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  // Username: 3-20 chars, alphanumeric + underscore
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

  if (!usernameRegex.test(username)) {
    return {
      valid: false,
      error: 'Username must be 3-20 characters, alphanumeric and underscores only',
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
  } else {
    const passwordValidation = isValidPassword(data.password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.errors[0] || 'Password does not meet requirements';
    }
  }

  // Validate password confirmation
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // Validate full name
  if (!data.fullName) {
    errors.fullName = 'Full name is required';
  } else if (!isValidFullName(data.fullName)) {
    errors.fullName = 'Full name must be 2-100 characters';
  }

  // Validate username
  if (!data.username) {
    errors.username = 'Username is required';
  } else {
    const usernameValidation = isValidUsername(data.username);
    if (!usernameValidation.valid) {
      errors.username = usernameValidation.error || 'Invalid username';
    } else if (await isUsernameExists(data.username)) {
      errors.username = 'Username already taken';
    }
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
