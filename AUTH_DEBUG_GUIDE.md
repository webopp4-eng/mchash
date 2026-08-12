/**
 * CM HASH Authentication Debug Guide
 * 
 * This document provides debugging information for the wallet authentication system.
 * All console logs are marked with [AUTH-DEBUG] tags for easy filtering.
 */

// Enable debug logging by running tests with:
// ENABLE_DEBUG_LOGGING=true npm run dev

// Or in browser console, run:
// localStorage.setItem('cmhash_debug', 'true');

// ============================================================================
// AUTHENTICATION PIPELINE DEBUGGING
// ============================================================================

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                  CM HASH AUTHENTICATION DEBUG MODE                         ║
║                                                                            ║
║  To enable debug logging:                                                 ║
║  1. Set ENABLE_DEBUG_LOGGING=true environment variable                    ║
║  2. Or in browser: localStorage.setItem('cmhash_debug', 'true')            ║
║                                                                            ║
║  Debug logs are marked with [AUTH-DEBUG] prefix                           ║
║  Filter in browser console: "AUTH-DEBUG"                                  ║
║                                                                            ║
║  Key checkpoints to monitor:                                              ║
║  - [AUTH-DEBUG:NONCE] Nonce generation and validation                     ║
║  - [AUTH-DEBUG:SIGNATURE] Signature verification                          ║
║  - [AUTH-DEBUG:SESSION] Session creation and cookie setting               ║
║  - [AUTH-DEBUG:STATE] Frontend state management                           ║
║  - [AUTH-DEBUG:REDIRECT] Navigation and redirect logic                    ║
║  - [AUTH-DEBUG:REQUEST] API request/response                              ║
║  - [AUTH-DEBUG:STORAGE] localStorage operations                           ║
║  - [AUTH-DEBUG:WALLET] Wallet model queries                               ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

// ============================================================================
// BACKEND DEBUGGING POINTS
// ============================================================================

/*
BACKEND DEBUG CHECKLIST:

1. NONCE GENERATION (GET /api/auth/nonce/:address?chain=)
   [ ] Request received with valid address and chain
   [ ] Rate limit check passes
   [ ] Nonce generated: base64(JSON with timestamp, address, chain, csrfToken)
   [ ] Message created with nonce included
   [ ] Nonce stored in issuedNonces Map with used=false
   
   Debug log markers:
   - [AUTH-DEBUG:NONCE] generateNonce() called
   - [AUTH-DEBUG:NONCE] Nonce stored in Map, size now: X
   - [AUTH-DEBUG:NONCE] Message created with nonce: [first 20 chars]

2. SIGNATURE VERIFICATION (POST /api/auth/wallet)
   [ ] Request received with: address, chain, signature, message
   [ ] Message format validated (has Nonce: field)
   [ ] Nonce extracted from message with regex
   [ ] verifyAndConsumeNonce() called
     [ ] Nonce found in issuedNonces Map
     [ ] Nonce not already used (used !== true)
     [ ] Nonce not expired (timestamp < 5 minutes ago)
     [ ] Address matches submitted address
     [ ] Chain matches submitted chain
   [ ] Signature verified using ethers (EVM) or nacl (Solana)
   [ ] verifyAndConsumeNonce() marks used=true and deletes from Map
   
   Debug log markers:
   - [AUTH-DEBUG:SIGNATURE] POST /api/auth/wallet received
   - [AUTH-DEBUG:SIGNATURE] Nonce extracted from message
   - [AUTH-DEBUG:SIGNATURE] verifyAndConsumeNonce() result: true/false
   - [AUTH-DEBUG:SIGNATURE] EVM signature verification: PASS/FAIL
   - [AUTH-DEBUG:SIGNATURE] Solana signature verification: PASS/FAIL

3. WALLET MODEL LOOKUP (findOrCreateUser)
   [ ] Query Wallet table first with address + chain
   [ ] If found:
     [ ] Load associated User from wallet.userId
     [ ] Update lastLoginAt timestamp
     [ ] Mark wallet.verifiedAt if not already set
     [ ] Return existing user with created=false
   [ ] If not found:
     [ ] Create new User with authMethod=WALLET
     [ ] Create new Wallet with isPrimary=true, verifiedAt=now()
     [ ] Return new user with created=true
   
   Debug log markers:
   - [AUTH-DEBUG:WALLET] Querying Wallet table for address
   - [AUTH-DEBUG:WALLET] Wallet found for address, userId: X
   - [AUTH-DEBUG:WALLET] Creating new wallet for user
   - [AUTH-DEBUG:WALLET] Wallet record created: X

4. SESSION CREATION
   [ ] JWT token generated with user.id
   [ ] httpOnly cookie set with:
     - httpOnly: true (secure against XSS)
     - secure: NODE_ENV=production (HTTPS only)
     - sameSite: lax (allows cross-site POST from wallets)
     - maxAge: 7 days
   [ ] Login history recorded in database
   [ ] Response includes: token, user data, created flag
   
   Debug log markers:
   - [AUTH-DEBUG:SESSION] JWT token generated
   - [AUTH-DEBUG:SESSION] httpOnly cookie set: cmhash_token
   - [AUTH-DEBUG:SESSION] Login history recorded
   - [AUTH-DEBUG:SESSION] Response sent with user data

5. RATE LIMITING
   [ ] IP address extracted from x-forwarded-for header or req.ip
   [ ] Rate limit checked: max 5 attempts per minute
   [ ] Rate limit data stored in rateLimitByIp Map
   [ ] If exceeded: 429 status with Retry-After header
   
   Debug log markers:
   - [AUTH-DEBUG:RATE] IP: X, attempts: Y/5
   - [AUTH-DEBUG:RATE] Rate limit exceeded for IP

*/

// ============================================================================
// FRONTEND DEBUGGING POINTS
// ============================================================================

/*
FRONTEND DEBUG CHECKLIST:

1. NONCE REQUEST
   [ ] GET /api/auth/nonce/:address?chain= request sent
   [ ] credentials: 'include' included in fetch options
   [ ] Response received: { nonce, message }
   [ ] Message parsed to extract nonce
   [ ] Message displayed to user
   
   Debug log markers:
   - [AUTH-DEBUG:REQUEST] GET /api/auth/nonce/0x... called
   - [AUTH-DEBUG:NONCE] Message received from backend
   - [AUTH-DEBUG:NONCE] Message length: X, contains Nonce: Y

2. WALLET SIGNATURE REQUEST
   [ ] User approves wallet connection modal
   [ ] Wallet app (MetaMask/Phantom/etc) opens
   [ ] User signs message in wallet app
   [ ] Signature returned to frontend
   [ ] Signature stored in state
   
   Debug log markers:
   - [AUTH-DEBUG:SIGNATURE] Requesting wallet signature
   - [AUTH-DEBUG:SIGNATURE] User confirmed, message sent to wallet
   - [AUTH-DEBUG:SIGNATURE] Signature received from wallet: [first 20 chars]

3. SIGNATURE SUBMISSION
   [ ] POST /api/auth/wallet request prepared with:
     - address: wallet address
     - chain: ethereum|bnb|solana
     - signature: signed message
     - message: original message with nonce
   [ ] credentials: 'include' included
   [ ] Request sent to API
   [ ] Response received: { token, user, created }
   
   Debug log markers:
   - [AUTH-DEBUG:REQUEST] POST /api/auth/wallet sending
   - [AUTH-DEBUG:REQUEST] Request body: address, chain, signature (first 20 chars)
   - [AUTH-DEBUG:REQUEST] Response received: status X

4. STATE MANAGEMENT
   [ ] User data extracted from response
   [ ] setUser() called with user object
     [ ] runtimeUserCache updated
     [ ] localStorage['cmhash_user'] set
   [ ] Authentication state verified
   [ ] isAuthenticated() returns true
   
   Debug log markers:
   - [AUTH-DEBUG:STATE] User data received: { id, username, walletAddress }
   - [AUTH-DEBUG:STATE] setUser() called
   - [AUTH-DEBUG:STATE] runtimeUserCache updated
   - [AUTH-DEBUG:STORAGE] localStorage['cmhash_user'] set
   - [AUTH-DEBUG:STATE] getUser() returns: { id, username }

5. REDIRECT
   [ ] Wait 200ms for state to settle
   [ ] router.push('/dashboard') called
   [ ] Navigation started
   [ ] Dashboard loads
   [ ] Dashboard layout checks authentication
     [ ] getUser() returns valid user (runtime cache)
     [ ] isAuthenticated() returns true
     [ ] 5-retry logic exits on first success
   [ ] Dashboard displays user profile
   
   Debug log markers:
   - [AUTH-DEBUG:REDIRECT] Redirect to /dashboard initiated
   - [AUTH-DEBUG:REDIRECT] Waiting 200ms for state settlement
   - [AUTH-DEBUG:STATE] Dashboard layout mounted
   - [AUTH-DEBUG:STATE] checkAuth() attempt 1: getUser() = user
   - [AUTH-DEBUG:REDIRECT] Authentication verified, rendering dashboard

6. COOKIE TRANSMISSION
   [ ] Response.headers['set-cookie'] includes cmhash_token
   [ ] Browser stores cookie as httpOnly
   [ ] Subsequent API requests include Cookie header
   [ ] Cookie NOT visible in JavaScript (secure)
   [ ] Cookie sent with credentials: 'include' on all requests
   
   Debug log markers:
   - [AUTH-DEBUG:STORAGE] httpOnly cookie set by server
   - [AUTH-DEBUG:REQUEST] Subsequent requests include Cookie header
   - [AUTH-DEBUG:STORAGE] JavaScript cannot access cookie (secure)

*/

// ============================================================================
// EMAIL ACCOUNT FLOW DEBUGGING
// ============================================================================

/*
EMAIL ACCOUNT DEBUG CHECKLIST:

1. EMAIL REGISTRATION (POST /api/auth/email/register)
   [ ] Request includes: email, password, confirmPassword, fullName, username
   [ ] Email validation: valid format
   [ ] Email unique check: not already registered
   [ ] Password validation: not empty (relaxed requirements)
   [ ] Password match check: password === confirmPassword
   [ ] Password hashing: bcryptjs with salt rounds
   [ ] User created with:
     - email: normalized
     - passwordHash: hashed password
     - authMethod: EMAIL
     - walletAddress: NULL (no wallet)
   [ ] NO wallet record created automatically
   
   Debug log markers:
   - [AUTH-DEBUG:EMAIL] POST /api/auth/email/register received
   - [AUTH-DEBUG:EMAIL] Email validation: PASS
   - [AUTH-DEBUG:EMAIL] Password hashing: salt rounds X
   - [AUTH-DEBUG:EMAIL] User created: id=X, email=Y
   - [AUTH-DEBUG:EMAIL] NO wallet record created (intentional)

2. EMAIL LOGIN (POST /api/auth/email/login)
   [ ] Request includes: email, password
   [ ] Email validation: valid format
   [ ] User lookup: findUnique by normalized email
   [ ] If not found: error "Invalid credentials"
   [ ] Password verification: bcryptjs.compare()
   [ ] If wrong password: error "Invalid credentials"
   [ ] User found and password correct:
     [ ] JWT token generated
     [ ] httpOnly cookie set
     [ ] User data returned
   
   Debug log markers:
   - [AUTH-DEBUG:EMAIL] POST /api/auth/email/login received
   - [AUTH-DEBUG:EMAIL] User lookup: found/not found
   - [AUTH-DEBUG:EMAIL] Password verification: PASS/FAIL
   - [AUTH-DEBUG:SESSION] Email login successful, token set

3. EMAIL USER CONNECTING WALLET (POST /api/auth/wallet/connect)
   [ ] Request includes: address, chain, signature, message
   [ ] User authenticated (middleware check)
   [ ] User is email account (authMethod === EMAIL)
   [ ] Wallet verification:
     [ ] Nonce extracted and validated
     [ ] Signature verified
   [ ] Duplicate check:
     [ ] Query Wallet table for address + chain
     [ ] If found with different userId: error "already connected"
   [ ] Create Wallet record:
     - userId: authenticated user's id
     - address: normalized address
     - chain: ethereum|bnb|solana
     - isPrimary: false (email user's first wallet is secondary)
     - verifiedAt: current timestamp
   [ ] Response: { message, wallet }
   
   Debug log markers:
   - [AUTH-DEBUG:WALLET] POST /api/auth/wallet/connect received
   - [AUTH-DEBUG:WALLET] User authenticated: email account
   - [AUTH-DEBUG:WALLET] Nonce validation: PASS
   - [AUTH-DEBUG:WALLET] Signature verification: PASS
   - [AUTH-DEBUG:WALLET] Duplicate check: not found (ok to create)
   - [AUTH-DEBUG:WALLET] Wallet record created: id=X
   - [AUTH-DEBUG:WALLET] Wallet linked to email user: X

*/

// ============================================================================
// COMMON FAILURE SCENARIOS & DEBUGGING
// ============================================================================

/*
SCENARIO 1: "Redirecting...redirecting...back to /login" (Redirect Loop)

Possible causes:
1. getUser() returns null but isAuthenticated() returns true (state inconsistency)
2. Runtime cache not syncing with localStorage
3. Hydration mismatch between server and client
4. localStorage write failed or cleared
5. Cookie not sent with requests (credentials: 'include' missing)

Debug steps:
a) Check localStorage:
   localStorage.getItem('cmhash_user')  // Should contain user object
   
b) Check runtime cache:
   // In browser console, add to auth.ts:
   window.debugRuntimeCache = () => runtimeUserCache;
   // Then: window.debugRuntimeCache()
   
c) Check cookie:
   document.cookie  // Should show cmhash_token (may be hidden if httpOnly)
   
d) Check network tab:
   // GET /api/auth/me or /api/user
   // Should include Cookie header
   // Should return 200 with user data
   
Debug log to add:
- [AUTH-DEBUG:STATE] getUser() called, returning: X
- [AUTH-DEBUG:STATE] isAuthenticated() called, returning: X
- [AUTH-DEBUG:REDIRECT] Dashboard layout checkAuth(), attempt: Y, result: X
- [AUTH-DEBUG:STORAGE] localStorage['cmhash_user']: X

*/

/*
SCENARIO 2: "Signature verification failed" (Invalid Signature)

Possible causes:
1. Message was modified after signing
2. Wrong wallet was used to sign (different private key)
3. Signature format incorrect (not base64 or hex)
4. Chain mismatch (signed for Ethereum but submitted as Solana)
5. Address doesn't match signer (recovered address mismatch)

Debug steps:
a) Verify message wasn't modified:
   // In browser console:
   console.log(message);  // Check if it matches what was signed
   
b) Check signature format:
   console.log(signature.length);  // Typical lengths:
   // EVM: 130 chars (65 bytes * 2 hex digits)
   // Solana: 172 chars (88 bytes base64)
   
c) Verify chain:
   console.log(chain);  // Must match: ethereum, bnb, or solana
   
d) Check recovered address:
   // In backend, add logging:
   const recovered = ethers.verifyMessage(message, signature);
   console.log(`Submitted: ${address}, Recovered: ${recovered}`);
   
Debug log to add:
- [AUTH-DEBUG:SIGNATURE] Message preview: [first 50 chars]
- [AUTH-DEBUG:SIGNATURE] Signature format: length=X
- [AUTH-DEBUG:SIGNATURE] Chain: ethereum|bnb|solana
- [AUTH-DEBUG:SIGNATURE] EVM recovery: submitted=X, recovered=Y
- [AUTH-DEBUG:SIGNATURE] Match: X === Y

*/

/*
SCENARIO 3: "Invalid or expired nonce" (Nonce Issues)

Possible causes:
1. Nonce older than 5 minutes
2. Nonce was already used (second login with same nonce)
3. Nonce format invalid (not valid base64)
4. Nonce not found in Map (server restarted, different instance)
5. Nonce corruption during message construction

Debug steps:
a) Check nonce age:
   // Decode nonce:
   const noncePayload = JSON.parse(atob(nonce));
   console.log(Date.now() - noncePayload.timestamp);  // Should be < 300000ms
   
b) Check if nonce was consumed:
   // Check issuedNonces Map in backend:
   console.log(issuedNonces.has(nonce));  // true = not consumed, false = consumed/not found
   
c) Verify nonce in message matches submitted nonce:
   // Message should contain exact nonce
   const nonceInMessage = message.match(/Nonce: ([A-Za-z0-9+/=]+)/)[1];
   console.log(nonceInMessage === nonce);  // Should be true
   
Debug log to add:
- [AUTH-DEBUG:NONCE] Nonce age: Xms (max 300000ms)
- [AUTH-DEBUG:NONCE] Nonce found in Map: true/false
- [AUTH-DEBUG:NONCE] Nonce consumption attempt: mark used=true
- [AUTH-DEBUG:NONCE] verifyAndConsumeNonce() result: PASS/FAIL
- [AUTH-DEBUG:NONCE] Reason for failure: [specific reason]

*/

/*
SCENARIO 4: "Cookie not being sent" (httpOnly Cookie Issues)

Possible causes:
1. credentials: 'include' missing from fetch options
2. Cookie set without Secure flag but on HTTPS
3. SameSite: Strict (prevents cross-site cookies)
4. Domain mismatch (cookie for different domain)
5. Path mismatch (cookie for different path)

Debug steps:
a) Check fetch options:
   // Should include: credentials: 'include'
   
b) Check cookie in DevTools:
   // Application → Cookies → http://localhost:3000
   // Should see: cmhash_token (HttpOnly, Secure off for localhost)
   
c) Check response headers:
   // Network tab, click response
   // Look for: Set-Cookie: cmhash_token=...
   
d) Check request headers:
   // Network tab, subsequent requests
   // Look for: Cookie: cmhash_token=...
   
Debug log to add:
- [AUTH-DEBUG:REQUEST] fetch options: { credentials: 'include', ... }
- [AUTH-DEBUG:STORAGE] Cookie received: cmhash_token
- [AUTH-DEBUG:REQUEST] Request headers include Cookie: X/false
- [AUTH-DEBUG:SESSION] httpOnly cookie set: name=cmhash_token, secure=X, sameSite=lax

*/

// ============================================================================
// TESTING COMMANDS
// ============================================================================

/*
QUICK TESTING IN BROWSER CONSOLE:

1. Check authentication state:
   localStorage.getItem('cmhash_user')
   JSON.parse(localStorage.getItem('cmhash_user') || 'null')
   
2. Check if authenticated:
   // Add to auth.ts: window.debugAuth = isAuthenticated;
   window.debugAuth()  // Should return true if logged in
   
3. Clear authentication (for testing logout):
   localStorage.removeItem('cmhash_user')
   localStorage.removeItem('cmhash_token')
   
4. Test nonce generation:
   fetch('http://localhost:4000/api/auth/nonce/0x1234...?chain=ethereum')
     .then(r => r.json())
     .then(d => console.log(d))
   
5. Monitor auth logs:
   // Set up filter in DevTools console
   // Type in filter: [AUTH-DEBUG]
   // All auth debug logs will show

*/

// ============================================================================
// SAFE LOGGING PRACTICES
// ============================================================================

/*
DO NOT LOG (Security Risk):
- Complete signatures (log first 20 chars + "...")
- Complete nonces (log first 20 chars + "...")
- Complete passwords (never log)
- Complete private keys (never log)
- Complete JWTs (log first 20 chars + "...")
- Complete API keys (never log)
- Complete email addresses (log first char + "****@****")

DO LOG (Safe for Debugging):
- Function names: [AUTH-DEBUG:NONCE] generateNonce()
- Transaction status: PASS/FAIL
- Data types: "type: string"
- Data lengths: "length: 130"
- First 20 chars: signature.substring(0, 20) + "..."
- Object keys (not values): Object.keys(data)
- API response status: 200, 401, 400, etc
- Timestamps: new Date().toISOString()
- User IDs: uuid format
- Error messages: without sensitive data

*/

export const AUTH_DEBUG_GUIDE = "See this file for comprehensive auth debugging guide";
