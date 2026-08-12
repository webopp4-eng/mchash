# CM HASH Debug Logging - Quick Start Guide

## Enable Debug Logging

### Backend
1. **Start backend with debug enabled**:
   ```bash
   cd backend
   ENABLE_DEBUG_LOGGING=true npm run dev
   ```
   All debug logs marked with `[AUTH-DEBUG:*]` prefix will appear in terminal

### Frontend
1. **In browser console** (F12), run:
   ```javascript
   localStorage.setItem('cmhash_debug', 'true');
   ```
   All debug logs marked with `[AUTH-DEBUG:*]` prefix will appear in browser console

2. **Or set in .env.local** (if NODE_ENV=development):
   ```
   NEXT_PUBLIC_DEBUG=true
   NODE_ENV=development
   ```

---

## What Gets Logged

### Backend Logs (`[AUTH-DEBUG:*]` in terminal)
- `[AUTH-DEBUG:NONCE]` - Nonce generation, validation, consumption
- `[AUTH-DEBUG:SIGNATURE]` - Signature verification results
- `[AUTH-DEBUG:WALLET]` - Wallet model queries, creation, linking
- `[AUTH-DEBUG:SESSION]` - JWT token, httpOnly cookie setting
- `[AUTH-DEBUG:REQUEST]` - API request/response status
- `[AUTH-DEBUG:RATE]` - Rate limiting checks
- `[AUTH-DEBUG:EMAIL]` - Email authentication flow

### Frontend Logs (`[AUTH-DEBUG:*]` in browser console)
- `[AUTH-DEBUG:REQUEST]` - API calls, fetch responses
- `[AUTH-DEBUG:NONCE]` - Nonce receipt, message validation
- `[AUTH-DEBUG:SIGNATURE]` - Wallet signature requests/responses
- `[AUTH-DEBUG:STATE]` - User state management, getUser(), setUser()
- `[AUTH-DEBUG:STORAGE]` - localStorage operations
- `[AUTH-DEBUG:REDIRECT]` - Navigation and redirect logic
- `[AUTH-DEBUG:SESSION]` - Session/token handling

---

## Testing Checklist

### Test Scenario 1: First-time Wallet Login
```
1. Open http://localhost:3000/login
2. Click "Connect Wallet"
3. In browser console, you should see:
   - [AUTH-DEBUG:REQUEST] GET /api/auth/nonce/0x...
   - [AUTH-DEBUG:NONCE] Message received from backend
   - [AUTH-DEBUG:SIGNATURE] User signed message
   - [AUTH-DEBUG:REQUEST] POST /api/auth/wallet sending
   - [AUTH-DEBUG:STATE] completeAuth() called
   - [AUTH-DEBUG:REDIRECT] Redirect target: /dashboard

4. In backend terminal, you should see:
   - [AUTH-DEBUG:NONCE] generateNonce() called
   - [AUTH-DEBUG:SIGNATURE] EVM signature verification: PASS
   - [AUTH-DEBUG:WALLET] findOrCreateUser() called
   - [AUTH-DEBUG:WALLET] Wallet NOT found, creating new user
   - [AUTH-DEBUG:WALLET] Created user: id=...
   - [AUTH-DEBUG:SESSION] JWT token generated
   - [AUTH-DEBUG:SESSION] httpOnly cookie set
```

### Test Scenario 2: Returning Wallet Login
```
1. Click Disconnect (clear localStorage if needed)
2. Click "Connect Wallet" again
3. In backend terminal, should see:
   - [AUTH-DEBUG:WALLET] Wallet found in database for 0x..., userId=...
   - [AUTH-DEBUG:WALLET] Returning existing user: id=..., created=false
   (Not "Creating new user" this time)

4. Dashboard should show same profile
```

### Test Scenario 3: Invalid Signature
```
1. Browser dev tools Network tab, modify signature before sending
2. Backend terminal should show:
   - [AUTH-DEBUG:SIGNATURE] EVM signature verification: FAIL
3. Browser should show error: "Signature verification failed"
```

### Test Scenario 4: Expired Nonce
```
1. Request nonce: GET /api/auth/nonce/0x...
2. Wait > 5 minutes
3. Try to submit signature
4. Backend should show:
   - [AUTH-DEBUG:NONCE] Nonce verification failed
5. Error: "Invalid or expired nonce"
```

### Test Scenario 5: Replay Attack Prevention
```
1. Request nonce and sign message
2. Submit signature once (should succeed)
3. Try same signature again
4. Backend should show:
   - [AUTH-DEBUG:NONCE] Nonce verification FAILED: already used
5. Error: "Invalid or expired nonce"
```

### Test Scenario 6: Email Account Creation
```
1. Click "Sign Up"
2. Enter email, password, agree terms
3. Backend terminal should show:
   - [AUTH-DEBUG:EMAIL] POST /api/auth/email/register received
   - [AUTH-DEBUG:EMAIL] User created: id=X, email=Y
   - NO wallet record created (intentional)
```

### Test Scenario 7: Email User Connecting Wallet
```
1. Logged in as email user
2. Go to Settings/profile
3. Click "Connect Wallet"
4. Sign message in wallet app
5. Backend terminal should show:
   - [AUTH-DEBUG:WALLET] POST /api/auth/wallet/connect received
   - [AUTH-DEBUG:WALLET] Wallet created: id=..., isPrimary=false
6. Wallet appears in "Connected Wallets" list
```

---

## Common Issues & Debug Steps

### Issue: "Redirecting...redirecting...back to /login"
**Debug Steps**:
1. Check browser console for `[AUTH-DEBUG:STATE]` logs
2. Look for where `getUser()` returns null
3. Check `localStorage['cmhash_user']` in DevTools Application tab
4. Run in console: `JSON.parse(localStorage.getItem('cmhash_user'))`

**Common causes**:
- localStorage not synced (increase 200ms delay)
- httpOnly cookie not sent (check credentials: 'include')
- Runtime cache cleared

### Issue: "Signature verification failed"
**Debug Steps**:
1. Check backend terminal for `[AUTH-DEBUG:SIGNATURE]` logs
2. Verify wallet address matches submitted address
3. Check message wasn't modified between signing and submission
4. Verify chain matches (ethereum/bnb/solana)

### Issue: "Invalid or expired nonce"
**Debug Steps**:
1. Check nonce age in backend: `[AUTH-DEBUG:NONCE] Nonce age: Xms`
2. Should be < 300000ms (5 minutes)
3. Check if nonce was already consumed
4. Run in backend:
   ```javascript
   console.log(issuedNonces.size);  // Should show Map size
   ```

### Issue: Rate limiting (429 error)
**Debug Steps**:
1. Check backend terminal for `[AUTH-DEBUG:RATE]` logs
2. Wait 60 seconds
3. Verify IP-based limiting working correctly
4. Modify rate limit in walletAuth.ts for testing

---

## Browser DevTools Tips

### View Cookies
1. F12 → Application tab
2. Storage → Cookies → http://localhost:3000
3. Look for: `cmhash_token` (should show HttpOnly flag, not accessible to JS)

### Monitor Network Requests
1. F12 → Network tab
2. Click "Connect Wallet"
3. Look for:
   - `GET /api/auth/nonce/...` (response includes nonce)
   - `POST /api/auth/wallet` (includes signature)

### Filter Console Logs
1. F12 → Console tab
2. In filter box, type: `[AUTH-DEBUG]`
3. Shows only auth-related logs

---

## Disabling Debug Logging
```bash
# Backend: Just run normally
npm run dev

# Frontend: In browser console
localStorage.removeItem('cmhash_debug');
// Refresh page
```

---

## Safe Debugging Practices

### What IS Safe to Log
✅ Function names
✅ Transaction status (PASS/FAIL)
✅ Data types
✅ Data lengths
✅ First 20 chars of sensitive values + "..."
✅ HTTP status codes
✅ User IDs
✅ Timestamps

### What IS NOT Safe to Log
❌ Complete signatures
❌ Complete nonces
❌ Complete passwords
❌ Complete private keys
❌ Complete JWT tokens
❌ Complete API keys
❌ Complete wallet addresses (except first 10 chars)
❌ Database sensitive fields

All [AUTH-DEBUG] logs follow safe logging practices.
