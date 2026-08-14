Here is your **updated document with multi\-account support fully integrated per payment method and per user/admin configuration**, while preserving your structure and logic:

---

# Complete Platform Update — UI, Wallet, Payments, Admin Credit Tool, Market Prices & Data Integration

You are working on the existing platform\. **Do not rebuild the application from scratch\.** Preserve the current architecture, UI direction, branding, components, routes, authentication system, admin panel, user panel, and existing functionality unless a change below specifically requires modification\.

The current UI is already in a very good state\. The goal is to **polish, extend, and enhance functionality**, not replace it\.

---

# 1\. Wallet Connection System

Implement a professional wallet connection flow that works on both desktop and mobile\.

### Desktop

Use **RainbowKit \+ Wagmi** for the desktop wallet experience\.

### Mobile

Support **WalletConnect \+ deep\-link flows** for mobile wallet apps\.

### Unified Experience

Use a single:

**Connect Wallet**

button/modal\.

The system must detect device type and available providers automatically\.

If multiple wallets exist, allow user selection\.

### Security Requirement

Never request or store:

- Seed phrase
- Private key
- Recovery phrase
- Password

Wallet authentication must use standard signature\-based verification only\.

---

# 2\. Wallet Panel

Display connected wallet information:

- Wallet address
- Connection status
- Network info
- Copy Address button

### Copy Address

- Must copy the **real connected wallet address**
- Show confirmation: **Address copied**
- Never copy placeholder data

---

# 3\. Deposit Protection

If user clicks **Deposit** without a connected wallet:

1. Detect missing wallet connection
2. Redirect to Connect Wallet
3. Show message:
   **Connect your wallet to continue with a crypto deposit\.**
4. Highlight Connect Wallet button
5. After connection, return user to deposit flow

---

# 4\. USER PANEL — NEW MANUAL DEPOSIT FLOW \(IMPORTANT\)

Implement a clean manual deposit submission system inside the user panel\.

---

## Deposit Form Fields

### 1\. Payment Method Selection

- Bank Transfer
- Crypto Transfer
- Mobile Money \(MoMo\)
- OPay
- Other supported methods

---

## 1\.1 Multi\-Account Selection \(NEW IMPORTANT UPDATE\)

Each payment method must support **multiple active receiving accounts**\.

### Example:

If user selects **Bank Transfer**, they must see:

- Bank Account A \(Default\)
- Bank Account B
- Bank Account C

If user selects:

- MoMo → multiple phone numbers/accounts
- OPay → multiple OPay accounts
- Crypto → multiple wallet addresses per chain

### Rules:

- User must be able to select **which account they are sending to**
- System must display:
  - Account name
  - Account number / address
  - Status \(Active / Default\)
- Only **admin\-enabled accounts** are shown
- Disabled accounts must be hidden

---

### 2\. Amount Input

- Must validate positive numbers only
- Show currency clearly

---

### 3\. Transaction Reference / TXID

Required field:

- Fiat → Transaction Reference
- Crypto → TXID / Hash

---

### 4\. Upload Proof

- JPG
- PNG
- PDF \(optional\)

---

### 5\. Submit Button Behavior

On submit:

1. Validate all fields
2. Upload proof
3. Create **Pending Deposit Record**
4. Attach to authenticated user
5. Set status = **PENDING**
6. Trigger notification:
   **Deposit submitted and awaiting verification**

---

## Deposit Record Must Include:

- User ID
- Payment method
- Selected receiving account ID \(NEW\)
- Amount
- TXID / Reference
- Proof URL
- Status \(Pending\)
- Timestamp

---

## User View After Submission

- Show **Pending Verification**
- Display submitted details
- Prevent duplicate submissions

---

# 5\. ADMIN PANEL — DEPOSIT VERIFICATION SYSTEM

---

## Admin Deposit Table

- User
- Account ID
- Payment method
- Selected receiving account \(NEW\)
- Amount
- TXID / Reference
- Proof preview
- Date
- Status

---

## Admin Actions

### Approve

- Set status → APPROVED
- Credit user balance
- Create transaction: **MANUAL DEPOSIT CREDIT**
- Notify user

### Reject

- Set status → REJECTED
- Do NOT credit balance
- Optional rejection reason

---

## Balance Rule

Only update balance when admin approves\.

---

## Audit Log

Store:

- Admin ID
- User ID
- Action
- Amount
- Timestamp

---

# 6\. ADMIN PAYMENT ACCOUNTS MANAGEMENT SYSTEM \(ENHANCED MULTI\-ACCOUNT SUPPORT\)

---

## 6\.1 Supported Account Types

Admin must be able to manage:

### Crypto Wallets

- BTC wallet addresses \(multiple\)
- ETH wallet addresses \(multiple\)
- USDT TRC20 / ERC20 \(multiple\)
- Other chains

### Bank Accounts

- Multiple bank accounts per country
- Bank name
- Account name
- Account number
- SWIFT / IBAN
- Country

### Mobile Money \(MoMo\)

- Multiple numbers per provider
- MTN / Vodafone / Airtel etc\.
- Account name
- Country

### OPay Accounts

- Multiple OPay accounts
- Account name
- OPay number
- Email/ID if required

---

## 6\.2 Multi\-Account Rules \(NEW CORE LOGIC\)

Each payment method must support:

- Multiple accounts per method
- One **DEFAULT account per method**
- Multiple **ACTIVE accounts**
- Optional tagging \(e\.g\. “Fast processing”, “Backup account”\)

---

## 6\.3 Admin Features

Admin must be able to:

- Add new payment account
- Edit existing account
- Delete account
- Enable/disable account
- Set default account per method
- Switch active receiving account anytime
- Assign priority order \(NEW\)

---

## 6\.4 Dynamic Display Logic

User deposit page must:

- Fetch active accounts from database
- Group by payment method
- Show multiple selectable accounts
- Highlight default account
- Never hardcode payment details

---

## 6\.5 Security Requirement

- Only admin can modify accounts
- All changes must be logged
- Changes must reflect instantly

---

## 6\.6 Audit Log

Store:

- Admin ID
- Action performed
- Old value
- New value
- Timestamp

---

# 7\. MARKETPLACE MINING PLAN PURCHASE

Two methods:

### Fiat

- No wallet required
- Upload proof
- Admin approval required

### Crypto

- Wallet required
- TXID required
- Admin verification required

---

# 8\. DEFAULT MINING SYSTEM \(UNCHANGED CORE LOGIC\)

## 8\.1 Auto\-Start Mining on Account Creation

Every new user account must automatically start mining immediately after registration\.

---

## 8\.2 Default Mining Configuration

- Base mining rate
- Power level = 1
- Active = TRUE

---

## 8\.3 Earnings

Server\-controlled only\.

---

## 8\.4 Admin Controls

- Global rate multiplier
- User\-specific adjustment
- Pause/enable mining

---

# 9\. ADMIN ACCOUNT CREDIT SYSTEM

- Select user
- Choose balance type
- Enter amount
- Add reason
- Apply instantly
- Log all actions

---

# 10\. LIVE MARKET PRICES

- CoinGecko / CoinMarketCap API
- Real\-time updates

---

# 11\. MOBILE UI IMPROVEMENTS

- Responsive layout
- No overflow
- Clean spacing

---

# 12\. COLOR SYSTEM

- Green = success
- Red = error
- Yellow = pending
- Blue = info

---

# 13\. NOTIFICATIONS SYSTEM

- Deposit submitted
- Deposit approved/rejected
- Wallet events
- Mining updates

---

# 14\. RECENT ACTIVITY RESET

- All default values = 0\.00
- Remove fake transactions

---

# 15\. DATABASE\-DRIVEN USER PROFILE

Store:

- ID
- Username
- Email
- Wallet
- Avatar
- Referral data

---

# 16\. SYNC USER DATA

Ensure consistency across:

- Dashboard
- Wallet
- Marketplace
- Profile
- Notifications

---

# 17\. DEFAULT AVATARS

- 5 system avatars
- Random assignment
- Stored in DB

---

# 18\. AUTHENTICATION

- Real backend auth only
- No fake users
- Server validation required

---

# 19\. RESPONSIVE QUALITY

- No overflow
- Mobile optimized
- Desktop preserved

---

# 20\. PRESERVE EXISTING UI

Do not redesign\.

Only enhance functionality\.

---

# 21\. FINAL CHECKLIST

Verify:

- Wallet system works
- Multi\-account payment system works
- Deposit flow works
- Admin approval updates balance
- TXID \+ proof stored
- Market prices load
- Mining auto\-starts
- Admin can manage accounts
- Notifications work
- No fake data
- No console errors

---

If you want next step, I can also design:
✅ Database schema for multi\-account system
✅ Admin UI for managing payment accounts
✅ API structure \(Node/Next/Firebase\)
✅ Full system architecture diagram