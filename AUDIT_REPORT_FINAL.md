# 🔴 WALLET INTEGRATION — COMPREHENSIVE AUDIT & REMEDIATION PLAN

**Project**: CM HASH  
**Date**: 2026-08-12  
**Status**: **CRITICAL ISSUES** (Production-Blocking)

---

# PART 1 — AUDIT FINDINGS

## Issue #1: 404 on Phantom Mobile Callback (ROOT CAUSE IDENTIFIED)

### The Problem
When a user clicks "Sign in with Phantom" on mobile:

```
1. User on: https://webopp4-eng.github.io/mchash/login
2. Clicks: "Sign in with Phantom"
3. Backend generates redirect URL:
   - getSafeWalletRedirectUrl('/login?autoconnect=1')
   - new URL('/login?autoconnect=1', 'https://webopp4-eng.github.io')
   - RESULT: 'https://webopp4-eng.github.io/login?autoconnect=1'  ❌ WRONG!
4. Encodes & sends to Phantom deep-link
5. Phantom approves & redirects to: https://webopp4-eng.github.io/login
6. GitHub Pages looks for /login route
7. Route doesn't exist (it's actually at /mchash/login)
8. GitHub Pages serves 404.html
9. User sees: "404 — Not Found"
```

### Root Cause
**next.config.mjs** sets:
```javascript
basePath: isGithubPages ? '/mchash' : ''
```

But `getSafeWalletRedirectUrl()` doesn't account for basePath:

**File**: `frontend/lib/wallet.ts` (line 321-333)
```typescript
export function getSafeWalletRedirectUrl(routeOrUrl?: string): string {
  if (typeof window === 'undefined') return '/login';
  const origin = window.location.origin;
  const fallback = `${origin}/login?autoconnect=1`;

  try {
    const candidate = new URL(routeOrUrl || '/login?autoconnect=1', origin);
    // ❌ BUG: Doesn't include basePath!
    // On live site: candidate.pathname = '/login'
    // Should be: candidate.pathname = '/mchash/login'
    
    if (candidate.origin !== origin) return fallback;
    if (!walletConnectionRoutes.has(candidate.pathname)) return fallback;
    // ❌ Validation fails because '/login' not in routes list
    if (!candidate.searchParams.has('autoconnect')) candidate.searchParams.set('autoconnect', '1');
    return candidate.toString();
  } catch {
    return fallback;
  }
}
```

### The Fix
Must extract basePath from `window.location.pathname` and include it in redirect URL:

```typescript
export function getSafeWalletRedirectUrl(routeOrUrl?: string): string {
  if (typeof window === 'undefined') return '/login';
  
  const origin = window.location.origin;
  const currentPathname = window.location.pathname;
  
  // Extract basePath from current location
  // E.g., /mchash/login → basePath = /mchash
  const basePath = currentPathname.split('/').slice(0, -1).join('/') || '';
  
  const fallback = `${origin}${basePath}/login?autoconnect=1`;

  try {
    // Prepend basePath to the route
    const routeWithBasePath = routeOrUrl?.startsWith('/') 
      ? `${basePath}${routeOrUrl}`
      : routeOrUrl;
      
    const candidate = new URL(routeWithBasePath || `${basePath}/login?autoconnect=1`, origin);
    
    if (candidate.origin !== origin) return fallback;
    // Now validate against full pathname with basePath
    if (!isValidWalletRedirectRoute(candidate.pathname)) return fallback;
    if (!candidate.searchParams.has('autoconnect')) candidate.searchParams.set('autoconnect', '1');
    return candidate.toString();
  } catch {
    return fallback;
  }
}

// Helper to validate routes (with or without basePath)
function isValidWalletRedirectRoute(pathname: string): boolean {
  // Accept routes both with and without basePath for flexibility
  const allowedRoutes = ['/login', '/dashboard', '/dashboard/wallet'];
  
  // Check without basePath
  if (allowedRoutes.some(route => pathname === route)) return true;
  
  // Check with common basePaths
  const basePaths = ['', '/mchash', '/cm-hash'];
  for (const base of basePaths) {
    for (const route of allowedRoutes) {
      if (pathname === `${base}${route}`) return true;
    }
  }
  
  return false;
}
```

---

## Issue #2: Mobile Wallet List Shows "Detected Wallet" Only

### The Problem
On mobile, instead of showing list of available wallets (Phantom, MetaMask, Trust, etc.), only shows "Detected Wallet" or blank.

### Root Cause
**File**: `frontend/components/WalletSignIn.tsx` (line 424-434)

The wallet detection logic is weak:

```typescript
// Current: Shows all wallets in array regardless of availability
{mobileWallets.map((wallet) => (
  <button key={wallet.id} ...>
    {wallet.name}  // Shows even if not installed!
  </button>
))}
```

When no wallets are detected as installed via `isWalletProviderAvailable()`, the UI falls back to showing mobile wallet list, but:
1. List might be rendering off-screen
2. Wallets aren't filtered by actual availability
3. "Detected Wallet" from `detectWalletBrowser()` isn't shown as first option

### The Fix
**Show detected wallets first, then app install links:**

```typescript
// In WalletSignIn.tsx
const detectedWallet = detectWalletBrowser();
const availableWallets = getWalletConnections().filter(w => 
  isWalletProviderAvailable(w.id) || detectedWallet?.walletId === w.id
);

// Render: Show detected first, then others, then install prompts
```

---

## Issue #3: Phantom Deep-Link Uses Outdated API Pattern

### Current (Outdated)
**File**: `frontend/lib/wallet.ts` (line 344)
```typescript
if (walletId === 'phantom') 
  return `https://phantom.app/ul/browse/${encoded}?ref=${ref}`;
```

This is an older API that may not work reliably on current Phantom versions.

### Modern Standard
Phantom now recommends:
1. **Desktop**: Use Solana Provider API (`window.solana.connect()`) — ✅ You do this
2. **Mobile with app**: Use app deep link  
3. **Mobile without app**: Fallback to mobile wallet browser or show install prompt

The `phantom.app/ul/browse` endpoint still works but is less reliable.

### Current Official Phantom Approach (Wallet Standard)
Phantom now supports Wallet Standard, which is the future:
```javascript
// Wallet Standard approach (more future-proof)
if (window.phantom?.solana) {
  // Use Phantom provider
}
```

Your current code already does this ✓. The deep-link is a fallback for when app isn't installed.

---

# PART 2 — SECURITY AUDIT

### Cryptographic Security ✅
| Item | Status | Notes |
|------|--------|-------|
| Nonce generation | ✅ Secure | `crypto.randomBytes(16)` + timestamp + random |
| Nonce expiration | ✅ Secure | 5-minute TTL |
| Single-use nonce | ✅ Secure | Consumed after verification, deleted |
| Signature verification | ✅ Secure | Proper Ed25519 (Solana) + ECDSA (EVM) |
| Message format | ✅ Secure | Clear human-readable message with all details |

### Session Security ⚠️
| Item | Status | Issue |
|------|--------|-------|
| JWT creation | ✅ Good | Proper JWT with user ID |
| JWT storage | ❌ **Risk** | localStorage (XSS vulnerable) |
| Session tokens | ⚠️ Limited | No refresh tokens, single JWT |
| CSRF protection | ❌ **Missing** | No CSRF token in nonce/message |
| Rate limiting | ❌ **Missing** | Can generate unlimited nonces from same IP |
| Device tracking | ⚠️ No fingerprinting | No device/session lock detection |

### Network Security ⚠️
| Item | Status | Issue |
|------|--------|-------|
| HTTPS enforcement | ✅ Yes | GitHub Pages/Render use HTTPS |
| CORS headers | ⚠️ Check | Not verified in headers |
| CSP headers | ❌ Missing | No Content-Security-Policy |
| X-Frame-Options | ❌ Missing | No clickjacking protection |

---

# PART 3 — CURRENT ARCHITECTURE

### Stack Summary
```
Frontend:
├── Next.js 16.3 (static export + basePath)
├── RainbowKit 2.2.11 (wallet UI)
├── Wagmi 2.19.4 (EVM connections)
└── Custom Phantom integration (Solana Provider API)

Backend:
├── Express.js
├── Prisma ORM
├── JWT authentication
├── Nonce-based signing
├── TweetNaCl (Solana sig verification)
└── Ethers.js (EVM sig verification)

Blockchain:
├── Solana (via window.solana provider)
├── Ethereum mainnet (chain ID 1)
└── BNB Smart Chain (chain ID 56)
```

### Current Routes
**Protected Routes** (require wallet login):
- `/dashboard` (main dashboard)
- `/admin` (admin panel)
- `/dashboard/wallet`
- `/dashboard/mining`
- etc.

**Public Routes**:
- `/login` (wallet authentication)
- `/` (homepage with redirects)
- `/mine`, `/profile`, `/settings`, `/wallet` (redirect to /dashboard/*)

---

# PART 4 — FILES REQUIRING CHANGES

| File | Changes Needed | Severity |
|------|----------------|----------|
| `frontend/lib/wallet.ts` | Fix basePath handling in getSafeWalletRedirectUrl() + improve mobile detection | **CRITICAL** |
| `frontend/components/WalletSignIn.tsx` | Improve mobile wallet list filtering + better error states | **HIGH** |
| `backend/src/routes/auth.ts` | Add rate limiting + CSRF token validation | **HIGH** |
| `backend/src/services/walletAuth.ts` | Add rate limiting + device fingerprinting | **MEDIUM** |
| `next.config.mjs` | Add explicit basePath handling (optional improvement) | LOW |

---

# PART 5 — DETAILED ROOT CAUSES

## Root Cause #1: basePath Mismatch in Wallet Redirects

**Why it happens:**
- Live site runs on GitHub Pages with basePath `/mchash`
- All routes are served under `/mchash/login`, `/mchash/dashboard`, etc.
- But `getSafeWalletRedirectUrl()` computes redirect without including basePath
- Result: Points to `/login` which doesn't exist

**When it occurs:**
- Mobile users only (desktop RainbowKit works because it doesn't redirect)
- When Phantom app is not installed (falls back to deep link)
- Only on GitHub Pages (basePath = '/mchash'), not localhost

**Impact:**
- ❌ Mobile Phantom users see 404
- ❌ Cannot complete wallet authentication on mobile
- ❌ Forces users to use address input instead

---

## Root Cause #2: Mobile Wallet Detection Insufficient

**Why it happens:**
- `isWalletProviderAvailable()` checks if provider exists in window
- On mobile Safari, no wallets have providers (extensions don't exist)
- Falls back to showing mobile wallet list
- But list shows all wallets, not just available ones

**When it occurs:**
- Mobile Safari without Phantom app installed
- Mobile Chrome without wallet extensions

**Impact:**
- ⚠️ UX is confusing (shows wallets that can't be installed)
- ✓ Functionally still works via deep links (just poor UX)

---

## Root Cause #3: GitHub Pages 404 Handling

**Why it happens:**
- GitHub Pages doesn't know about Next.js routes
- When Phantom redirects to `/login`, GitHub looks for `404.html` or `/index.html`
- Since basePath causes mismatch, `/login` doesn't exist
- GitHub serves `404.html`

**When it occurs:**
- Only on GitHub Pages deployment
- Local dev and Render backend work fine

---

# PART 6 — RECOMMENDED ARCHITECTURE AFTER FIXES

### Mobile Flow (After Fix)
```
User on https://webopp4-eng.github.io/mchash/login
→ Clicks "Sign in with Phantom"
→ isPhantomProviderAvailable() → false (not installed)
→ Falls back to mobile wallet UI
→ User clicks Phantom icon
→ openMobileWallet('phantom')
→ getSafeWalletRedirectUrl() computes:
   https://webopp4-eng.github.io/mchash/login?autoconnect=1  ✅ CORRECT!
→ Phantom app opens
→ User approves + signs
→ Phantom redirects to: /mchash/login?autoconnect=1
→ Next.js catches route ✅
→ autoconnect=1 triggers automatic re-authentication
→ Session restored
→ User logged in ✅
```

### Security Improvements (After Fixes)
```
1. Nonce now includes:
   - Timestamp + random + address + chain + CSRF token
   
2. Rate limiting enforced:
   - Max 5 nonce requests per IP per 60 seconds
   
3. Device tracking:
   - Fingerprint (UA + IP) stored with session
   - Multiple simultaneous sessions from same device OK
   - Cross-device suspicious activity logged
   
4. Session storage:
   - httpOnly cookie for JWT (XSS safe)
   - localStorage still used for non-sensitive state
   
5. CSP headers:
   - script-src: self + wallet provider CDNs
   - frame-ancestors: none
```

---

# PART 7 — TESTING PLAN

### Before You Deploy Fixes

**Desktop Test** (✓ Currently working)
```
1. Chrome on desktop
   - Visit https://localhost:3000/login
   - Install Phantom extension
   - Click "Connect Wallet"
   - Approve connection in extension
   - Sign message
   - Verify logged in to /dashboard
   
2. Safari on desktop
   - Same flow via MetaMask or other EVM wallet
```

**Mobile Test** (✗ Currently broken)
```
1. iPhone Safari
   - Visit https://webopp4-eng.github.io/mchash/login
   - Install Phantom mobile app
   - Click "Sign in with Phantom"
   - Phantom app opens
   - Approve connection + sign message  
   - Phantom should return to app
   - Should see /mchash/dashboard (NOT 404)
   - Verify logged in

2. Android Chrome
   - Same flow
   - Phantom mobile app handles deep link

3. Incognito mode on both
   - Verify fresh session works
```

### Negative Tests
```
✅ User rejects connection → Error message
✅ User closes wallet app → Timeout handling
✅ Nonce expires → Error message
✅ Reused nonce → Rejected (already used)
✅ Wrong signature → Verification fails
✅ Wrong chain → Unsupported network error
✅ No wallet installed → Show install prompt
```

---

# PART 8 — IMPLEMENTATION CHECKLIST

## Phase 1: Critical Fix (1-2 hours)
- [ ] Fix `getSafeWalletRedirectUrl()` to include basePath
- [ ] Improve mobile wallet list filtering
- [ ] Deploy to GitHub Pages
- [ ] Test mobile Phantom flow end-to-end
- [ ] Verify 404 is gone

## Phase 2: Security Hardening (2-3 hours)
- [ ] Add CSRF token to nonce/message
- [ ] Implement rate limiting on `/auth/nonce`
- [ ] Add device fingerprinting
- [ ] Migrate JWT to httpOnly cookies
- [ ] Add CSP headers

## Phase 3: Polish (1-2 hours)
- [ ] Better error messages
- [ ] Add "Phantom not installed" prompt
- [ ] Mobile-specific UX improvements
- [ ] Add analytics/logging for wallet flows

---

# PART 9 — ENVIRONMENT VARIABLES TO VERIFY

After fixes, ensure these are set:

```env
# Frontend (.env.production)
GITHUB_ACTIONS=true         # Enables basePath for GitHub Pages
NEXT_PUBLIC_API_URL=https://...  # Backend API endpoint

# Backend (.env)
DATABASE_URL=postgresql://...
JWT_SECRET=...
FRONTEND_URL=https://webopp4-eng.github.io/mchash
PUBLIC_FRONTEND_URL=https://webopp4-eng.github.io/mchash
NODE_ENV=production
```

---

# SUMMARY

| Finding | Severity | Fix Time | Impact |
|---------|----------|----------|--------|
| basePath mismatch in wallet redirects | **CRITICAL** | 30 min | Blocks all mobile Phantom logins |
| Mobile wallet list needs filtering | **HIGH** | 15 min | Poor UX but functional |
| Missing rate limiting | **HIGH** | 30 min | Open to brute force |
| No CSRF token | **MEDIUM** | 20 min | Cross-site forgery risk |
| JWT in localStorage | **MEDIUM** | 45 min | XSS vulnerability |
| Missing CSP headers | **MEDIUM** | 15 min | Clickjacking/injection risk |
| **TOTAL** | | **2-3 hours** | **Restore mobile Phantom + security hardening** |

---

**Next Step:** Approve this audit, and I'll implement all fixes with full explanations.
