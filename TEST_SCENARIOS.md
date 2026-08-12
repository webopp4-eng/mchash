# CM HASH Authentication - Test Verification Guide

## Master Engineering Prompt Requirements

This document outlines comprehensive test scenarios for the refactored wallet authentication system, which uses the Wallet model as the source of truth for wallet identity, implements email account wallet linking, and provides secure cryptographic signature verification.

---

## Test Scenario 1: First-Time Wallet Login (NEW ACCOUNT)

### Objective
Verify that a wallet that has never logged in before creates a new user account and authenticates successfully.

### Prerequisites
- Fresh wallet address never used before on platform
- Valid wallet with ability to sign messages
- Backend running with proper Wallet model queries

### Steps
1. Open app → Click "Connect Wallet"
2. Select blockchain (e.g., Ethereum)
3. Connect wallet via modal (e.g., MetaMask)
4. Wallet address displayed
5. Click "Sign & Connect"
6. Sign the authentication message in wallet app
7. Message format should be:
   ```
   Sign in to CM HASH
   
   Chain: Ethereum
   Wallet: 0x1234...abcd
   
   Issued At: 2026-08-12T...
   Expires At: 2026-08-12T...
   
   Nonce: [base64_encoded_json]
   ```

### Expected Result ✓
- **Backend**: 
  - Nonce is validated (correct format, not expired, valid signature)
  - Wallet table queried, wallet record NOT found
  - New User created with `authMethod=WALLET`
  - New Wallet record created with `isPrimary=true` and `verifiedAt=now()`
  - JWT token generated and set as httpOnly cookie
  - Login history recorded
  - Response includes user data: `{id, walletAddress, chain, username, ...}`
- **Frontend**:
  - User data stored in localStorage via `setUser()`
  - Runtime cache updated with user object
  - Redirect to `/dashboard` successful
  - Dashboard loads with user profile visible

### Verification Queries
```sql
-- Check user created
SELECT * FROM "User" WHERE "walletAddress" = '0x...' LIMIT 1;

-- Check wallet record created
SELECT * FROM "Wallet" WHERE "address" = '0x...' AND "chain" = 'ethereum' LIMIT 1;

-- Verify isPrimary=true and verifiedAt set
SELECT "isPrimary", "verifiedAt" FROM "Wallet" WHERE "address" = '0x...' LIMIT 1;

-- Check login history
SELECT * FROM "LoginHistory" WHERE "userId" = (SELECT "id" FROM "User" WHERE "walletAddress" = '0x...' LIMIT 1);
```

---

## Test Scenario 2: Returning Wallet Login (EXISTING ACCOUNT)

### Objective
Verify that the same wallet can log in again and loads the existing user account without creating duplicates.

### Prerequisites
- Same wallet address as Scenario 1 (or another wallet from previous login)
- User account already exists in database
- Wallet record already exists in Wallet table

### Steps
1. Open app → Click "Connect Wallet"
2. Connect the SAME wallet address as before
3. Wallet shows previously connected address
4. Click "Sign & Connect"
5. Sign message in wallet app

### Expected Result ✓
- **Backend**:
  - Nonce validated
  - Wallet table QUERIED FIRST (source of truth)
  - Wallet found for this address + chain
  - Existing User loaded from `wallet.userId`
  - `lastLoginAt` updated to current timestamp
  - NO new User created (count remains same)
  - `verifiedAt` already set, not overwritten
  - JWT token generated
  - Login history recorded
  - Response includes existing user data
- **Frontend**:
  - Same user object loaded (ID matches)
  - Dashboard shows same profile, balance, data
  - No warning about new account

### Verification Queries
```sql
-- Count users (should be same as after Scenario 1)
SELECT COUNT(*) as user_count FROM "User";

-- Count wallets for this address (should be 1)
SELECT COUNT(*) FROM "Wallet" WHERE "address" = '0x...' AND "chain" = 'ethereum';

-- Verify lastLoginAt was updated
SELECT "lastLoginAt", "createdAt" FROM "User" WHERE "id" = '...';
```

---

## Test Scenario 3: Repeated Wallet Login (5+ Times)

### Objective
Verify that multiple consecutive logins with same wallet don't create duplicates or cause auth issues.

### Prerequisites
- Same wallet as Scenarios 1-2

### Steps
1. Login with wallet (as in Scenario 2)
2. Verify authenticated → Navigate to dashboard
3. Click Logout
4. Click "Connect Wallet" again
5. Login with same wallet
6. Verify authenticated → Navigate to dashboard
7. **Repeat Steps 3-6 at least 4 more times**

### Expected Result ✓
- **User Account**:
  - Still ONE User record (ID unchanged)
  - Still ONE Wallet record for this address
  - `lastLoginAt` updated each time (increasing timestamps)
  - `createdAt` unchanged (original creation time)
- **Authentication**:
  - Every login successful
  - No "wallet already linked" errors
  - No duplicate account creation
  - Dashboard accessible every time

### Verification Queries
```sql
-- After 5+ logins, still only 1 user
SELECT COUNT(*) FROM "User" WHERE "walletAddress" = '0x...';

-- Login history shows 5+ records
SELECT COUNT(*) FROM "LoginHistory" WHERE "walletAddress" = '0x...';

-- Verify createdAt unchanged, lastLoginAt increasing
SELECT "createdAt", "lastLoginAt", COUNT(*) as login_count 
FROM "LoginHistory" 
WHERE "userId" = '...' 
GROUP BY "userId";
```

---

## Test Scenario 4: Email Account Creation & Usage

### Objective
Verify that email accounts can be created independently and function without requiring wallet connection.

### Prerequisites
- New email address never registered before
- Valid password

### Steps
1. Click "Sign Up" / "Email Registration"
2. Enter email: `test-email-4@example.com`
3. Enter password: `TestPassword123`
4. Confirm password: `TestPassword123`
5. Click "Sign Up"
6. Should be redirected to login or dashboard

### Expected Result ✓
- **Backend**:
  - User created with `authMethod=EMAIL`
  - Email normalized and stored uniquely
  - Password hashed with bcrypt
  - No wallet created (Wallet table unchanged)
  - User.walletAddress = NULL
  - JWT token generated
- **Frontend**:
  - User data stored in localStorage
  - Redirected to dashboard
  - User profile shows email, no wallet

### Verification Queries
```sql
-- Check user created with EMAIL authMethod
SELECT * FROM "User" WHERE "email" = 'test-email-4@example.com';

-- Verify walletAddress NULL
SELECT "walletAddress", "authMethod" FROM "User" WHERE "email" = 'test-email-4@example.com';

-- Verify no Wallet created
SELECT COUNT(*) FROM "Wallet" WHERE "userId" = (SELECT "id" FROM "User" WHERE "email" = 'test-email-4@example.com');
```

---

## Test Scenario 5: Email Account Connecting Wallet

### Objective
Verify that email account users can connect wallets from Settings without logging out.

### Prerequisites
- Email user authenticated (from Scenario 4)
- Fresh wallet address not linked to any account
- Email user is on Settings page

### Steps
1. Email user logs in (Scenario 4)
2. Navigate to Dashboard → Settings
3. Scroll to "Connected Wallets" section
4. Click "Connect Wallet" button
5. Modal opens: Select Blockchain (e.g., Ethereum)
6. Select Wallet Type: "MetaMask"
7. Enter wallet address: `0x1234...`
8. Backend requests nonce: `GET /api/auth/nonce/0x1234...?chain=ethereum`
9. Modal displays: "Message to Sign"
10. User copies nonce from message
11. Signs in wallet app
12. Paste signature in "Signature" field
13. Click "Verify"

### Expected Result ✓
- **Backend**:
  - Request requires authentication (`authenticateToken` middleware)
  - User verified as email account
  - Nonce generated and returned in message
  - Signature verified cryptographically
  - Wallet table checked for duplicates → Not found for this address
  - New Wallet record created with:
    - `userId` = authenticated email user ID
    - `chain` = 'ethereum'
    - `address` = '0x1234...'
    - `isPrimary` = false (second wallet for this user)
    - `verifiedAt` = current timestamp
  - Response: `{message: "Wallet successfully connected", wallet: {...}}`
- **Frontend**:
  - Modal closes
  - Wallets list refreshed
  - New wallet shows in "Connected Wallets":
    ```
    Ethereum | 0x1234...
    Connected on: Aug 12, 2026
    [ Disconnect ]
    ```
  - Email user still authenticated (no logout)

### Verification Queries
```sql
-- Check email user now has wallet
SELECT * FROM "Wallet" WHERE "userId" = (SELECT "id" FROM "User" WHERE "email" = 'test-email-4@example.com');

-- Verify isPrimary=false (second wallet)
SELECT "isPrimary" FROM "Wallet" WHERE "address" = '0x1234...';

-- Verify user.walletAddress NOT automatically updated (should be null for email users)
SELECT "walletAddress" FROM "User" WHERE "email" = 'test-email-4@example.com';
```

---

## Test Scenario 6: Mobile Wallet Deep-Link (iOS/Android)

### Objective
Verify that mobile wallet deep-links work correctly and allow users to sign in from mobile apps.

### Prerequisites
- Mobile device (iOS or Android)
- Wallet app installed (Phantom, Solflare, or other)
- Network connection

### Steps (ANDROID - Solana)
1. Open app on Android device
2. Navigate to login page
3. Scroll down to Wallet Connection section
4. Click "Connect Wallet"
5. Select "Solana" blockchain
6. Click on "Solflare" wallet from mobile list
7. Deep-link activated: `https://solflare.com/ul/v1/browse/{encoded_return_url}`
8. Browser redirects to Solflare app
9. Solflare app opens with wallet selection
10. User selects wallet
11. Returns to app with wallet info
12. App automatically signs message and authenticates

### Steps (iOS - Phantom)
1. Similar flow but deep-link: `https://phantom.app/ul/browse/{encoded_url}`
2. Phantom app opens on iOS
3. User confirms wallet
4. Callback to app

### Expected Result ✓
- **Deep-Link Format**:
  - Properly encoded return URL with callback parameters
  - Wallet app recognizes format
  - Wallet app opens (not web browser)
- **Wallet App**:
  - Shows account selection
  - User selects account
  - Signature request shown
  - User confirms
- **Return to App**:
  - App receives callback with signed message
  - Authentication completes
  - User redirected to dashboard

### Known Issues to Monitor
- [ ] iOS deep-link behavior (sometimes opens Safari instead of app)
- [ ] Android browser compatibility
- [ ] Network latency during app switch
- [ ] Back button handling when returning from wallet

---

## Test Scenario 7: Invalid Signature Rejection

### Objective
Verify that invalid or mismatched signatures are properly rejected with clear error messages.

### Prerequisites
- Fresh wallet address
- Backend running with signature verification

### Steps
1. Request nonce: `GET /api/auth/nonce/0x1234...?chain=ethereum`
2. Get response with message containing nonce
3. **Intentionally create invalid signature**:
   - Copy message
   - Modify message content (change 1 character)
   - Sign modified message
   - OR Sign correct message but claim it's different address
4. Submit to `/api/auth/wallet`:
   ```json
   {
     "address": "0x1234...",
     "chain": "ethereum",
     "signature": "0xINVALID...",
     "message": "Sign in to CM HASH\n..."
   }
   ```

### Expected Result ✓
- **Backend**:
  - Signature verification fails
  - ethers.js `verifyMessage()` returns NULL or wrong address
  - Error response: `{error: "Signature verification failed"}` (401)
  - NO user created or authenticated
  - NO token generated
- **Frontend**:
  - Error message displayed: "Signature verification failed"
  - User can retry with valid signature
  - No redirect to dashboard

### Verification Queries
```sql
-- No login history should be created
SELECT COUNT(*) FROM "LoginHistory" WHERE "walletAddress" = '0x1234...';
```

---

## Test Scenario 8: Expired Nonce Rejection

### Objective
Verify that nonces older than 5 minutes are rejected.

### Prerequisites
- Nonce generation working
- System clock accurate

### Steps
1. Request nonce: `GET /api/auth/nonce/0x1234...?chain=ethereum`
2. Get nonce: base64-encoded JSON with `timestamp: now()`
3. **Wait 5+ minutes**
4. Sign the original message
5. Submit signature to `/api/auth/wallet`

### Expected Result ✓
- **Backend**:
  - `verifyNonce()` checks `Date.now() - payload.timestamp > 5 * 60 * 1000`
  - Expired nonce detected
  - Error response: `{error: "Invalid or expired nonce"}` (400)
  - NO authentication
  - NO token generated
- **Frontend**:
  - Error message: "Invalid or expired nonce. Try again."
  - User prompted to request new nonce

### Implementation Detail
- Backend: `maxAgeMs = 5 * 60 * 1000` (300,000ms)
- Verification: `verifyAndConsumeNonce()` checks timestamp against this threshold
- Nonce cleanup: Expired nonces deleted from `issuedNonces` Map

---

## Test Scenario 9: Replay Attack Prevention (Nonce Reuse)

### Objective
Verify that using the same nonce twice fails - nonces are single-use.

### Prerequisites
- Valid nonce that was previously used for authentication
- Same wallet address

### Steps
1. First login:
   - Request nonce: `GET /api/auth/nonce/0x1234...?chain=ethereum`
   - Receive nonce `abc123def456`
   - Sign message and authenticate: `POST /api/auth/wallet` → Success ✓
2. **Attempt replay**:
   - Try to authenticate again with SAME nonce
   - New signature (just signed with existing nonce)
   - Submit: `POST /api/auth/wallet` with same `{address, chain, signature, message}`

### Expected Result ✓
- **First Authentication**: Success
  - Nonce marked as `used: true`
  - Nonce deleted from `issuedNonces` Map after verification
  - User authenticated with token
- **Replay Attempt**: Failure
  - `verifyAndConsumeNonce()` checks `record.used === true`
  - Reused nonce not found in Map (was deleted)
  - Error response: `{error: "Invalid or expired nonce"}` (400)
  - NO second authentication
  - Original user still authenticated (token valid)

### Verification Queries
```sql
-- Two login history records for same wallet after this test
SELECT COUNT(*) FROM "LoginHistory" WHERE "walletAddress" = '0x1234...';
-- Should be 2 (first success, second attempt didn't create record)
```

### Code Implementation
```typescript
// In verifyAndConsumeNonce():
const record = issuedNonces.get(nonce);
if (!record || record.used || !payload) return false;  // ← Prevents reuse
record.used = true;
issuedNonces.delete(nonce);  // ← Deletes after use
```

---

## Test Scenario 10: Duplicate Wallet Prevention

### Objective
Verify that a wallet cannot be linked to multiple accounts simultaneously.

### Prerequisites
- User A with wallet address 0x1234... already linked
- User B attempting to log in or connect same wallet

### Steps (Login Attempt)
1. User B with fresh account tries to login
2. Select wallet: 0x1234... (the one User A already uses)
3. Sign message
4. Submit to `/api/auth/wallet`

### Expected Result ✓
- **Backend**:
  - `findOrCreateUser()` queries Wallet table
  - Wallet found: `address = 0x1234..., chain = ethereum`
  - **Associated User is User A** (different from attempting user)
  - ✓ Returns User A's account
  - User B gets User A's data (logged in as User A)
  - OR error if permission model requires new account
- **Current Implementation**:
  - Returns User A's data
  - User B is now logged into User A's account (credential theft scenario!)

### Expected Result ✓ (CORRECT IMPLEMENTATION)
- Should prevent linking same wallet to multiple accounts
- Scenario steps for `/api/auth/wallet/connect` (email account connecting):

1. Email User B authenticated
2. Navigate to Settings → Connect Wallet
3. Enter wallet address: 0x1234... (User A's wallet)
4. Sign message
5. Submit to `/api/auth/wallet/connect`

### Backend Check
```typescript
// Check if wallet already linked to different user
const existingWallet = await prisma.wallet.findFirst({
  where: { address: normalizedAddress, chain: chain }
});

if (existingWallet && existingWallet.userId !== user.id) {
  return res.status(400).json({
    error: 'This wallet is already connected to another account'
  });
}
```

### Expected Result ✓
- **Error Response**: 
  ```json
  {
    "error": "This wallet is already connected to another account"
  }
  ```
- **Status Code**: 400 (Bad Request)
- **Frontend**:
  - Error displayed in modal: "This wallet is already connected to another account"
  - User prompted to use different wallet
  - Wallet stays linked to User A
  - User B NOT authenticated

### Verification Queries
```sql
-- Wallet should only be in one user's records
SELECT "userId", COUNT(*) as wallet_count 
FROM "Wallet" 
WHERE "address" = '0x1234...' AND "chain" = 'ethereum'
GROUP BY "userId";
-- Should return 1 row with wallet_count=1
```

---

## Critical Security Checks

### Signature Verification
- [ ] EVM signatures verified with `ethers.verifyMessage(message, signature)`
- [ ] Solana signatures verified with `nacl.sign.detached.verify()`
- [ ] Message must match exactly (byte-for-byte)
- [ ] Address recovery must match submitted address

### Nonce Security
- [ ] Nonce is base64-encoded JSON with timestamp
- [ ] Timestamp validation: `Date.now() - nonce.timestamp < 5 * 60 * 1000`
- [ ] Nonce marked as used immediately after verification
- [ ] Nonce deleted from memory after use (single-use enforcement)
- [ ] Nonce format: `[base64_json]` containing `{address, chain, timestamp, csrfToken}`

### Rate Limiting
- [ ] Max 5 authentication attempts per minute per IP
- [ ] Rate limit headers returned: `RateLimit-Limit: 5`, `RateLimit-Remaining: 4`, `RateLimit-Reset: 1692...`
- [ ] 429 (Too Many Requests) returned when limit exceeded
- [ ] `Retry-After` header includes seconds until reset

### Wallet Model Integrity
- [ ] Wallet table is queried FIRST for wallet identity (source of truth)
- [ ] User.walletAddress kept in sync for denormalized performance
- [ ] `isPrimary` set to true for first wallet
- [ ] `verifiedAt` set to current timestamp after signature verification
- [ ] Unique constraint on (userId, chain, address)

### httpOnly Cookie Security
- [ ] JWT token set as httpOnly cookie (inaccessible from JavaScript)
- [ ] Secure flag enabled in production (`NODE_ENV === 'production'`)
- [ ] SameSite: lax (allows cross-site POST from wallet apps)
- [ ] Cookie path: `/` (sent with all requests)
- [ ] maxAge: 7 days
- [ ] Cleared on logout via `res.clearCookie()`

---

## Test Execution Checklist

### Setup
- [ ] Backend deployed to Render
- [ ] Frontend deployed to GitHub Pages
- [ ] Database migration run
- [ ] Environment variables set correctly
- [ ] Wallets available for testing (MetaMask, Phantom, etc.)

### Scenario 1-3 (Wallet Auth)
- [ ] Scenario 1: First-time wallet → New account
- [ ] Scenario 2: Returning wallet → Same account
- [ ] Scenario 3: Repeated login → No duplicates
- [ ] Verify Wallet table used as source of truth
- [ ] Verify `isPrimary=true` for first wallet

### Scenario 4-5 (Email Auth + Linking)
- [ ] Scenario 4: Email account creation works
- [ ] Scenario 5: Email user can connect wallet from Settings
- [ ] Verify new Wallet record created with `isPrimary=false`
- [ ] Verify email account still accessible after wallet connection

### Scenario 6 (Mobile)
- [ ] Deep-link format correct
- [ ] Wallet app opens on mobile
- [ ] Returns with signed message
- [ ] Authentication completes

### Scenario 7-10 (Security)
- [ ] Invalid signatures rejected
- [ ] Expired nonces rejected
- [ ] Replay attacks prevented
- [ ] Duplicate wallets prevented
- [ ] Error messages clear and actionable

### Sign-Off
- [ ] All 10 scenarios pass
- [ ] No console errors or warnings
- [ ] Rate limiting working
- [ ] Nonce cleanup working
- [ ] Auth state persists on refresh
- [ ] Logout clears auth state
- [ ] Mobile auth working
- [ ] Wallet linking working

---

## Debugging Commands

### Check nonce creation
```typescript
// In browser console
const response = await fetch('https://mchash.onrender.com/api/auth/nonce/0x1234...?chain=ethereum');
const data = await response.json();
console.log(data.message);
```

### Decode nonce
```typescript
// In browser console
const nonce = 'eyJhZGRyZXNzIjoiMHgxMjM0IiwiY2hhaW4iOiJldGhlcmV1bSIsInRpbWVzdGFtcCI6MTY5MjA0NDAwMDAwMH0=';
console.log(JSON.parse(atob(nonce)));
```

### Check localStorage
```typescript
// In browser console
console.log(JSON.parse(localStorage.getItem('cmhash_user')));
```

### Check runtime cache
```typescript
// In browser console
// getUser() will show both cache and localStorage values
```

---

## Expected Outcomes After All Tests Pass

1. **Wallet Authentication Fully Working**
   - First-time wallets create accounts with Wallet model
   - Returning wallets load existing accounts
   - No duplicate accounts ever created
   - Replay attacks prevented

2. **Email Authentication Fully Working**
   - Email signup creates email accounts
   - Email users can log in
   - Email users can connect wallets without logout

3. **Security Fully Working**
   - Signatures verified cryptographically
   - Nonces expire and are single-use
   - Rate limiting prevents brute force
   - httpOnly cookies secure token storage

4. **Mobile Support Working**
   - Deep-links open wallet apps
   - Signatures returned properly
   - Auth completes after wallet app returns

5. **User Experience Improved**
   - Clear error messages for all failure scenarios
   - Auth state persists correctly
   - No redirect loops
   - Dashboard accessible after login
