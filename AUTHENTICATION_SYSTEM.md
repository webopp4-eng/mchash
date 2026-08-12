# 🔐 CM Hash Dual-Path Authentication System - Implementation Guide

## Overview

This document summarizes the comprehensive **Email + Wallet Authentication System** implemented for CM Hash. Users can now sign up with either email or connect a wallet directly, with the ability to link wallets later.

---

## Architecture

### Authentication Paths

```
┌─────────────────────────────────────┐
│  /auth/page.tsx (Choice Screen)     │
└────────────┬────────────────────────┘
             │
     ┌───────┴───────┐
     ▼               ▼
┌──────────┐    ┌──────────┐
│  EMAIL   │    │  WALLET  │
└────┬─────┘    └────┬─────┘
     │               │
  ┌──┴──┐         ┌──┴──┐
  ▼     ▼         ▼     ▼
 Sign  Log    Connect  QR
 Up    In     Wallet   Code
```

### User Model Flexibility

```typescript
// Email User
User {
  authMethod: "EMAIL",
  email: "user@example.com",
  passwordHash: "bcrypt($2b$10$...)",
  fullName: "John Doe",
  walletAddress: null,  // Can connect later
  wallets: []  // Can have multiple
}

// Wallet User
User {
  authMethod: "WALLET",
  email: null,
  passwordHash: null,
  walletAddress: "0x123...",  // Primary wallet
  wallets: [
    { address: "0x123...", chain: "ethereum", verifiedAt: timestamp },
    { address: "0x456...", chain: "bnb", verifiedAt: timestamp }
  ]
}

// Linked User (Email + Wallet)
User {
  authMethod: "EMAIL",
  email: "user@example.com",
  passwordHash: "bcrypt(...)",
  walletAddress: "0x123...",  // Optional
  wallets: [
    { address: "0x123...", chain: "ethereum" },
    { address: "0x456...", chain: "bnb" }
  ]
}
```

---

## Component Structure

### Frontend Components

#### 1. `/app/auth/page.tsx` (Entry Point)
**Purpose**: Main authentication page with dual-path choice

**States**:
- `choice` - Initial selection screen
- `email-signup` - Email registration form
- `email-login` - Email login form
- `wallet` - Wallet connection

**Features**:
- Clear visual distinction between paths
- Logo and branding
- Responsive design

#### 2. `/components/auth/EmailSignUp.tsx`
**Purpose**: Email account registration

**Form Fields**:
```
- Full Name (required, 2-50 chars)
- Email (required, valid format)
- Username (required, 3-20 chars, alphanumeric)
- Password (required, 8+ chars, strong requirements)
- Confirm Password
- Country (dropdown)
```

**Validation**:
- Real-time field errors
- Backend comprehensive validation
- Duplicate email/username checking
- Password strength meter

**On Success**:
- Redirect to `/dashboard`
- User authenticated with httpOnly cookie

#### 3. `/components/auth/EmailLogIn.tsx`
**Purpose**: Email account login

**Form Fields**:
```
- Email (required)
- Password (required)
```

**Features**:
- Error messages for invalid credentials
- Loading state during authentication
- "Forgot Password?" link (future implementation)

#### 4. `/components/auth/WalletSignIn.tsx`
**Purpose**: Wallet connection and authentication

**Connection Methods**:
1. **Wallet Button** - Uses RainbowKit modal
   - Supports: MetaMask, Trust Wallet, WalletConnect
   - Shows connected address
   - Sign message for authentication

2. **Manual Address** - For users with connected wallets
   - Enter address directly
   - Validates format (EVM or Solana)

3. **QR Code** - Future implementation
   - Mobile-friendly wallet connection

**Supported Chains**:
- `ethereum` (Chain ID: 1)
- `bnb` (Chain ID: 56)

#### 5. `/components/profile/WalletsManagement.tsx`
**Purpose**: View and manage connected wallets

**Features**:
- List all connected wallets with addresses
- Display connection timestamp
- Mark primary wallet
- Disconnect wallet button
- Connect additional wallets
- Empty state messaging

---

## Backend Implementation

### Database Schema Changes

```prisma
model User {
  id                String      @id @default(cuid())
  email             String?     @unique  // Email users only
  passwordHash      String?              // Email users only
  username          String?    @unique   // Email users only
  fullName          String?              // Email users only
  country           String?              // Email users only
  emailVerifiedAt   DateTime?            // Future: email verification
  authMethod        String      @default("WALLET")  // EMAIL or WALLET
  
  // Original wallet fields (made optional)
  walletAddress     String?     @unique  // Primary wallet
  chain             String?              // ethereum, bnb, solana
  
  // Relations
  wallets           Wallet[]    // All connected wallets
  created           DateTime    @default(now())
  lastLogin         DateTime?
}

model Wallet {
  id                String      @id @default(cuid())
  address           String      // Blockchain address
  chain             String      // ethereum, bnb, solana
  userId            String
  user              User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  isPrimary         Boolean     @default(false)
  verifiedAt        DateTime    @default(now())  // Signature verification timestamp
  balance           String?     // Cached balance
  
  @@unique([userId, address, chain])
}
```

### API Endpoints

#### Email Authentication

**POST `/auth/email/register`**
```typescript
Request: {
  email: string,
  username: string,
  password: string,
  fullName: string,
  country: string
}

Response: {
  success: boolean,
  user?: {
    id, email, username, fullName,
    referralCode, platformBalance, role
  },
  errors?: { field: string[] }
}
```

**POST `/auth/email/login`**
```typescript
Request: {
  email: string,
  password: string
}

Response: {
  success: boolean,
  user?: { ... },
  error?: string
}
```

#### Wallet Management

**POST `/auth/wallet/connect`** (Authenticated)
```typescript
Request: {
  address: string,
  chain: "ethereum" | "bnb" | "solana",
  signature: string,
  message: string
}

Response: {
  success: boolean,
  wallet: {
    id, address, chain, verifiedAt
  }
}
```

**GET `/auth/wallets`** (Authenticated)
```typescript
Response: {
  wallets: [
    { id, address, chain, isPrimary, verifiedAt, createdAt }
  ]
}
```

**DELETE `/auth/wallet/:walletId`** (Authenticated)
```typescript
Response: { success: boolean }
```

### Services

#### `backend/src/services/emailAuth.ts`

**Functions**:
- `isValidEmail(email)` - RFC 5322 validation
- `isValidPassword(password)` - 8+ chars, uppercase, lowercase, number, special char
- `isValidUsername(username)` - 3-20 alphanumeric + underscore
- `isValidFullName(name)` - 2-50 characters
- `hashPassword(password)` - bcryptjs with 10 salt rounds
- `verifyPassword(password, hash)` - Constant-time comparison
- `validateSignupData(data)` - Comprehensive validation
- `validateLoginData(data)` - Email + password validation
- `isEmailExists(email)` - Database lookup
- `isUsernameExists(username)` - Database lookup

---

## Security Features

### Password Security
- **Hashing**: bcryptjs with 10 salt rounds (industry standard)
- **Never Stored**: Plaintext passwords never stored or logged
- **Constant-Time Comparison**: Protection against timing attacks

### Wallet Authentication
- **Signature Verification**: Server-side only
- **Nonce-Based**: Prevents replay attacks
- **CSRF Protection**: CSRF token embedded in nonce payload
- **Chain Verification**: Checks supported chains

### Session Management
- **HTTP-Only Cookies**: XSS protection
- **Secure Flag**: Only transmitted over HTTPS
- **SameSite=lax**: CSRF protection
- **7-Day Expiration**: Automatic session timeout

### Rate Limiting
- **Nonce Requests**: 5 per 60 seconds per IP
- **Login Attempts**: Future implementation
- **Signup**: Unique email/username validation

---

## User Flows

### Flow 1: Email Signup → Email Login

```
1. User clicks "Continue with Email"
2. Click "Create Account"
3. Enter: Full Name, Email, Username, Password, Country
4. Backend validates all fields
5. Password hashed and stored
6. User redirected to /dashboard
7. Next time: Click "Log In" → Enter email/password
```

### Flow 2: Wallet Login

```
1. User clicks "Continue with Wallet"
2. Click "Connect Wallet"
3. RainbowKit modal opens
4. User connects MetaMask/Trust/WalletConnect
5. Backend requests nonce for wallet address
6. User signs message in wallet
7. Signature verified server-side
8. User redirected to /dashboard
```

### Flow 3: Email User Adds Wallet Later

```
1. User logged in with email (in /dashboard)
2. Navigate to Profile → Wallets
3. Click "Connect Wallet"
4. Connect wallet using same flow as wallet login
5. Wallet added to user's wallet list
6. Can now use wallet features
```

---

## Testing & Validation

### Email Validation Tests
```
✓ Valid: john@example.com
✓ Valid: user.name+tag@example.co.uk
✗ Invalid: invalid.email
✗ Invalid: user@
✗ Invalid: @example.com
```

### Password Strength Requirements
```
✓ Valid: MyPassword123!
✓ Valid: SecureP@ss1
✗ Invalid: password (no uppercase, number, special)
✗ Invalid: Pass1! (only 6 chars)
✗ Invalid: ABCDEF123 (no special char)
```

### Wallet Address Validation
```
✓ Valid EVM: 0x1234...abcd
✓ Valid Solana: 4A...xyz
✗ Invalid: 0x123 (too short)
✗ Invalid: invalid_address
```

---

## Deployment Checklist

### Backend (Render)
- [ ] Database migration applied: `npx prisma migrate deploy`
- [ ] bcryptjs installed: `npm install bcryptjs`
- [ ] Environment variables set:
  - `DATABASE_URL` (PostgreSQL)
  - `JWT_SECRET` (secure random string)
  - `CORS_ORIGIN` (frontend URL)
- [ ] Email routes deployed
- [ ] Wallet routes deployed

### Frontend (GitHub Pages)
- [ ] Components created in `/components/auth/`
- [ ] Auth page created at `/app/auth/page.tsx`
- [ ] Login redirect updated
- [ ] Environment variables set:
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_RENDER_API_URL`
- [ ] Build successful: `npm run build`
- [ ] Deploy to GitHub Pages

### Testing
- [ ] Email signup with valid data
- [ ] Email signup with invalid email (should reject)
- [ ] Duplicate email (should reject)
- [ ] Weak password (should reject)
- [ ] Email login with correct password
- [ ] Email login with wrong password (should fail)
- [ ] Wallet connection via RainbowKit
- [ ] Wallet signature verification
- [ ] Profile → Wallets section displays correctly
- [ ] Disconnect wallet functionality
- [ ] Session persistence across page refreshes

---

## Future Enhancements

1. **Email Verification**
   - Send verification email on signup
   - Verify before account activation
   - Resend verification link

2. **Two-Factor Authentication (2FA)**
   - TOTP apps (Google Authenticator)
   - Backup codes
   - SMS backup (optional)

3. **Password Reset**
   - Email-based password reset
   - Secure token with expiration
   - Password reset confirmation

4. **Social Authentication**
   - Google OAuth
   - Discord OAuth
   - Twitter OAuth

5. **Wallet Features**
   - Primary wallet selection
   - Wallet nickname system
   - Wallet permissions/scopes

6. **Advanced Security**
   - Device fingerprinting
   - Login notifications
   - Suspicious activity alerts
   - IP whitelist

---

## Code Examples

### Email Signup Service
```typescript
import { validateSignupData, hashPassword } from '@/services/emailAuth';
import { prisma } from '@/lib/prisma';

export async function registerEmail(data) {
  const validation = validateSignupData(data);
  if (!validation.valid) {
    return { error: validation.errors };
  }

  const passwordHash = await hashPassword(data.password);
  
  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      passwordHash,
      fullName: data.fullName,
      country: data.country,
      authMethod: 'EMAIL'
    }
  });

  return { user };
}
```

### Wallet Connection
```typescript
import { verifyWalletSignature } from '@/services/walletAuth';

export async function connectWallet(userId, address, chain, signature, message) {
  // Verify signature
  const isValid = await verifyWalletSignature(address, message, signature, chain);
  if (!isValid) {
    throw new Error('Signature verification failed');
  }

  // Check wallet not already connected
  const existing = await prisma.wallet.findFirst({
    where: { address, chain }
  });
  
  if (existing && existing.userId !== userId) {
    throw new Error('Wallet already connected to another account');
  }

  // Create or update wallet
  const wallet = await prisma.wallet.upsert({
    where: { userId_address_chain: { userId, address, chain } },
    update: { verifiedAt: new Date() },
    create: { userId, address, chain, verifiedAt: new Date() }
  });

  return wallet;
}
```

### Email Login API
```typescript
// frontend/components/auth/EmailLogIn.tsx
async function handleLogin(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/email/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Important: send cookies
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Login failed');
  }

  const { user } = await response.json();
  localStorage.setItem('cmhash_user', JSON.stringify(user));
  router.push('/dashboard');
}
```

---

## Support

For questions or issues, refer to:
- Backend routes: `backend/src/routes/auth.ts`
- Email service: `backend/src/services/emailAuth.ts`
- Frontend components: `frontend/components/auth/`
- Database schema: `backend/prisma/schema.prisma`

---

**Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Status**: Implementation Complete
