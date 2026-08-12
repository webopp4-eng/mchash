# WALLET INTEGRATION AUDIT & FIX PLAN

**Date**: 2026-08-12  
**Status**: Critical Issues Identified  
**Severity**: High (production-blocking)

---

## EXECUTIVE SUMMARY

Your wallet login flow has **3 critical issues** preventing Phantom mobile authentication:

1. **basePath Routing Mismatch** — Phantom deep-link callback returns to `/mchash/login`, but validation only allows `/login` → **404**
2. **Phantom Deep-Link Not Current** — Using outdated `phantom.app/ul/browse` pattern instead of official Wallet Standard
3. **Mobile Wallet List Filtering Missing** — Shows all wallets regardless of installation status → **confusing UX**

The live deployment already has your latest code (verified ✓), but mobile users hit a 404 when Phantom tries to return.

---

## PART 1 — CURRENT WALLET LIBRARIES

| Component | Library | Version | Purpose |
|-----------|---------|---------|---------|
| EVM Wallets | RainbowKit | v2.2.11 | MetaMask, Trust, Binance (Ethereum/BSC) |
| EVM Wallets | Wagmi | v2.19.4 | Wallet connection & signing (EVM) |
| EVM Wallets | @wagmi/connectors | v6.1.4 | Connector implementations |
| Blockchain | Viem | v2.21.59 | EVM interactions |
| Solana | Custom + window.solana | N/A | Phantom SDK via Provider API |
| Crypto | Ethers.js | (transitive) | EVM signature verification |
| Crypto | TweetNaCl | (backend) | Solana signature verification |
| Crypto | bs58 | (backend) | Solana address encoding |

---

## PART 2 — CURRENT PHANTOM INTEGRATION

### Desktop Flow (✓ Works)
```
User on https://mchash.vercel.app/login
→ Clicks "Connect Wallet"
→ RainbowKit modal opens
→ User selects Phantom browser extension
→ window.solana.connect() called
→ Phantom extension approval popup
→ Connection succeeds, address returned
→ User clicks "Sign In"
→ window.solana.signMessage(message) called
→ User approves signature in extension
→ Signature verified on backend
→ JWT created, user logged in
```

### Mobile Flow (✗ Broken — 404 on callback)
```
User on https://webopp4-eng.github.io/mchash/login (GitHub Pages)
→ Clicks "Sign in with Phantom" (mobile)
→ isPhantomProviderAvailable() checks window.solana.isPhantom
→ If Phantom app NOT installed: calls openMobileWallet('phantom')
→ getWalletOpenUrl() generates:
    https://phantom.app/ul/browse/{encoded_url}?ref={ref}
   where {encoded_url} = /mchash/login?autoconnect=1
→ Phantom app opens
→ User approves connection + signs message
→ Phantom redirects back to: /mchash/login?autoconnect=1
→ BUT: getSafeWalletRedirectUrl() validates against:
    walletConnectionRoutes = Set(['/login', '/', '/dashboard'])
→ /mchash/login is NOT in the set → falls back to /login
→ Route mismatch → GitHub Pages serves 404 for /mchash/login
→ User sees "Not Found"
```

### Root Cause
**Location**: `frontend/lib/wallet.ts` line 321

```typescript
// BUGGY CODE
const walletConnectionRoutes = new Set(['/login', '/', '/dashboard']);

export function getSafeWalletRedirectUrl(routeOrUrl?: string): string {
  // ...
  const candidate = new URL(routeOrUrl || '/login?autoconnect=1', origin);
  // candidate.pathname = '/mchash/login' on live site
  // walletConnectionRoutes has '/login' (without basePath)
  if (!walletConnectionRoutes.has(candidate.pathname)) return fallback;
  // FAILS! /mchash/login !== /login
  return candidate.toString();
}
```

---

## PART 3 — MOBILE WALLET LIST ISSUE

**Location**: `frontend/components/WalletSignIn.tsx` lines 415-445

**Problem**: Displays ALL wallets in `mobileWallets[]` array regardless of installation status:

```typescript
{mobileWallets.map((wallet) => (
  <button key={wallet.id} onClick={() => handleMobileWallet(wallet.id)}>
    {wallet.name}
  </button>
))}
```

**Result on Mobile**: User sees "Phantom", "Solflare", "Backpack", "MetaMask", "Trust", "Binance" even if none are installed.

**Proper Behavior**: Should show:
1. Installed wallets via `isWalletProviderAvailable()`
2. "Detected Wallet" if running inside wallet app (via `detectWalletBrowser()`)
3. A fallback list for install if none available

---

## PART 4 — SECURITY AUDIT

### Positive Controls
- ✅ Server-side nonce generation
- ✅ Nonce has 5-minute TTL
- ✅ Nonce consumed after use (single-use, replay-protected)
- ✅ Wallet address format validation
- ✅ Cryptographic signature verification (Solana + EVM)
- ✅ User lookup/creation before JWT issuance

### Security Gaps
- ⚠️  **No CSRF token** in authentication message
- ⚠️  **No rate limiting** on `/auth/nonce` endpoint (can generate unlimited nonces)
- ⚠️  **No device fingerprinting** (same user can auth from many devices simultaneously)
- ⚠️  **LocalStorage for JWT** (vulnerable to XSS; should use httpOnly cookies)
- ⚠️  **No Content Security Policy** headers evident
- ⚠️  **No verification that nonce timestamp matches** signature message timestamp
- ⚠️  **Frontend stores raw user object in localStorage** (can be tampered)

### Recommended Fixes (Priority)
1. Add `X-CSRF-Token` to auth message
2. Implement rate limiting (5 nonce requests per IP per 60s)
3. Use `httpOnly` cookies instead of localStorage
4. Add `X-Frame-Options`, `Content-Security-Policy` headers
5. Verify message contains exact nonce that was issued

---

## PART 5 — CURRENT BACKEND FLOW

### Endpoints
| Method | Route | Purpose | Status |
|--------|-------|---------|--------|
| GET | `/api/auth/nonce/:address` | Generate nonce for signing | ✓ Works |
| POST | `/api/auth/wallet` | Verify signature & create session | ✓ Works |
| POST | `/api/auth/qr/session` | Create QR code session | ✓ Works |
| GET | `/api/auth/qr/session/:id` | Check QR session status | ✓ Works |
| POST | `/api/auth/qr/session/:id/complete` | Complete QR login | ✓ Works |

### Missing
- ❌ Mobile callback validation route
- ❌ Explicit "close wallet app" handling
- ❌ Device/session tracking

---

## PART 6 — CURRENT CALLBACK/REDIRECT URLs

### Hardcoded URLs Found

**frontend/lib/wallet.ts**:
```typescript
// Line 344
if (walletId === 'phantom') 
  return `https://phantom.app/ul/browse/${encoded}?ref=${ref}`;
// ✗ Using OLD API pattern
```

**frontend/components/WalletSignIn.tsx**:
```typescript
// Line 257
const result = openMobileWallet(walletId, '/login?autoconnect=1', ...);
// ✓ Safe (validated), but fails due to basePath issue
```

**backend/src/routes/auth.ts**:
```typescript
// Line 56
url: process.env.FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL || 'https://mchash.onrender.com'
// Uses env var, good practice ✓
```

---

## PART 7 — EXACT CAUSE OF 404

### Trace Through Live Site

**Step 1**: User visits https://webopp4-eng.github.io/mchash/login
- Window location: `https://webopp4-eng.github.io/mchash/login`
- Window origin: `https://webopp4-eng.github.io`

**Step 2**: Clicks "Sign in with Phantom"
```javascript
openMobileWallet('phantom', '/login?autoconnect=1')
  → getWalletOpenUrl('phantom', '/login?autoconnect=1')
    → getSafeWalletRedirectUrl('/login?autoconnect=1')
      → new URL('/login?autoconnect=1', 'https://webopp4-eng.github.io')
      → resolves to 'https://webopp4-eng.github.io/login?autoconnect=1'
      → candidate.pathname = '/login'
      → '/login' IS in walletConnectionRoutes ✓
      → returns 'https://webopp4-eng.github.io/login?autoconnect=1'
```

**Step 3**: openMobileWallet encodes this:
```javascript
const encoded = encodeURIComponent('https://webopp4-eng.github.io/login?autoconnect=1')
const ref = encodeURIComponent('https://webopp4-eng.github.io')
// generates: https://phantom.app/ul/browse/{encoded}?ref={ref}
// Phantom receives target URL: https://webopp4-eng.github.io/login?autoconnect=1
```

**Step 4**: Phantom approves, returns to: `https://webopp4-eng.github.io/login?autoconnect=1`
- ✓ Correct! Route should exist...

**WAIT — I need to re-examine this.** Let me check if the issue is actually with the basePath when Phantom opens from the deep link.

Actually, I think I see it now. When Phantom opens, it's inside the Phantom app context. The `getSafeWalletRedirectUrl()` is called BEFORE Phantom opens (to generate the URL to pass to Phantom). So at that point, `window.location.origin` is correct. But when Phantom returns, it's supposed to open the link in the browser again.

The real issue might be: **Phantom app might not be passing the URL correctly on mobile**, OR **the GitHub Pages deployment isn't serving the route correctly**.

Let me refocus. The user said they see old behavior, and we confirmed the latest code IS deployed. So this is a **runtime behavioral issue**, not a stale deployment.

Let me revise the audit to focus on what's actually wrong.
