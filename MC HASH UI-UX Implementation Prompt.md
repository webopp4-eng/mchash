# MC HASH — Clean UI/UX Redesign Implementation Prompt

Use the attached **MC HASH UI/UX Design System reference image** as the primary visual source of truth.

Redesign and implement the existing MC HASH application UI to closely match the reference while **preserving the application's existing functionality, routes, data, API integrations, authentication, and business logic**.

## 1. Overall Design Direction

Create a polished, modern fintech/Web3/cloud-mining dashboard using:

- Bright sky blue + white color palette
- Clean glassmorphism
- Soft shadows
- Subtle gradients
- Rounded cards and controls
- Generous spacing
- Professional dashboard typography
- Poppins-style typography
- Thin blue-gray borders
- Minimal visual noise
- Responsive layouts
- Consistent iconography

The result should feel like a **real production application**, not a static mockup.

Do **not** blindly recreate the image as one large page. Extract its design system and apply it properly to the existing application.

---

## 2. Desktop Navigation

For desktop/tablet layouts, use a **left-side navigation layout** similar to the reference.

The sidebar should contain:

- MC HASH logo
- Dashboard
- Mining Center
- Bubble Team
- Wallet
- Transactions
- Rewards & Activity
- Marketplace
- Reports
- Settings
- Support
- Notifications
- Analytics

The active navigation item should have a subtle blue background/highlight.

The sidebar should remain visually clean and compact.

The main application content should sit to the right of the sidebar.

---

## 3. Mobile Navigation — IMPORTANT

The mobile experience must **not simply shrink the desktop sidebar**.

Create a dedicated mobile layout.

### Mobile top area

At the top of the screen:

- Display the MC HASH logo/brand.
- Keep the header clean.
- Do **not** put the primary navigation links inside this header.
- Do not create a traditional desktop-style top navigation bar.

The existing contextual controls such as the user's name/profile, wallet information, and settings should remain accessible according to the application's existing functionality without turning the entire header into a navigation menu.

### Mobile content

The main page must be:

- Vertically scrollable
- Comfortable to use with one hand
- Properly padded from screen edges
- Free from horizontal overflow
- Optimized for touch interactions

### Mobile bottom navigation

Add a **fixed bottom navigation bar**.

Use the most important destinations:

1. Home / Dashboard
2. Mining
3. Team
4. Wallet
5. Profile / More

Requirements:

- Fixed to the bottom of the viewport
- Always accessible while content scrolls
- Rounded/icon-based design
- Active item clearly highlighted in MC HASH blue
- Respect mobile safe-area insets
- Main content must have enough bottom padding so the navigation never covers content

---

## 4. Dashboard

Rebuild the dashboard using the visual hierarchy from the reference.

Include:

### Welcome section

Show:

- User greeting/name
- Short contextual message
- Profile/settings access where appropriate

### Balance card

Large primary card showing:

- Total balance
- Currency
- Supporting balance information
- Relevant action buttons

Use the bright blue glassmorphism treatment from the reference.

### Mining statistics

Create compact metric cards for:

- Active Hashrate
- TVS / mining metric
- Mining status
- Earnings
- Other existing application metrics

### Mining progress

Create a visually prominent circular mining-progress component.

Use:

- Large numeric value
- Unit
- Percentage/status
- Blue gradient ring
- Small status indicator

### Activity

Add recent activity/rewards/transactions using clean list cards.

---

## 5. Mining Center

Create a dashboard-style mining screen containing:

- Circular hashrate visualization
- Current hashrate
- Mining status
- Mining performance
- Daily earnings
- Efficiency
- Mining plan
- Upgrade-plan CTA
- Performance chart

Use cards and sections instead of dense tables wherever possible.

---

## 6. Bubble Team

Create a team dashboard containing:

- Team hashrate
- Team members
- Team performance
- Team levels
- Member statistics
- Performance chart

Use visual hierarchy and compact cards.

---

## 7. Wallet

The wallet page should visually follow the reference:

- Total balance
- Deposit
- Withdraw
- Transfer actions
- Asset list
- Asset balances
- Asset values
- Cryptocurrency icons
- Clean transaction/activity information

Primary actions should be visually obvious without overwhelming the screen.

---

## 8. Transactions

Create a clean transaction interface with:

- Filter tabs
- Deposit
- Withdrawal
- Transfer
- Mining reward
- Team reward
- Service charges
- Status indicators
- Amount
- Date/time

Use semantic colors:

- Green → incoming/success
- Red → outgoing/negative
- Blue → neutral/information
- Yellow → pending

---

## 9. Rewards & Activity

Create sections for:

- Total rewards
- Mining rewards
- Team bonuses
- Achievement bonuses
- Activity timeline

Use cards with clear reward values and timestamps.

---

## 10. Additional Screens

Apply the same design system consistently to:

- Marketplace
- Reports
- Settings
- Support
- Notifications
- Analytics

Do not redesign these pages as unrelated interfaces.

They must feel like they belong to the same MC HASH product.

---

## 11. Design System

Create reusable design tokens/components instead of duplicating styles.

### Colors

Primary:

- Bright Sky Blue
- Secondary Sky Blue
- White
- Light background
- Dark text

Semantic:

- Success Green
- Danger Red
- Warning Yellow
- Informational Blue

Use the reference image as the visual guide for exact tonal relationships.

### Components

Create reusable components for:

- Cards
- Glass cards
- Buttons
- Secondary buttons
- Inputs
- Dropdowns
- Switches
- Tabs
- Navigation items
- Bottom navigation
- Metric cards
- Charts
- Progress rings
- Tables/lists
- Status badges
- Empty states
- Loading states
- Modals
- Toasts

---

## 12. Responsive Behavior

Implement responsive breakpoints properly.

### Desktop

- Sidebar navigation
- Multi-column dashboard
- Large cards
- Charts beside relevant metrics

### Tablet

- Compact sidebar or collapsible navigation
- Reduced card spacing
- Adaptive grid

### Mobile

- No desktop sidebar
- Clean logo header
- Scrollable content
- Fixed bottom navigation
- One-column cards where appropriate
- Horizontally scrollable metric/card groups only when necessary
- No horizontal page overflow

Do not merely scale desktop components down.

---

## 13. Visual Quality

The implementation should match the reference's visual language:

- Soft rounded corners
- Subtle borders
- Glass-like surfaces
- Light shadows
- Blue highlights
- Clean white backgrounds
- Strong but restrained typography
- Consistent spacing
- Consistent icon sizes
- Consistent card heights
- Smooth hover/pressed states
- Subtle transitions

Avoid:

- Excessive gradients
- Huge text
- Heavy shadows
- Random colors
- Crowded layouts
- Inconsistent border radii
- Generic Bootstrap-looking components
- Placeholder-looking UI

---

## 14. Preserve Existing Functionality

This is critical.

**Do not break or remove existing functionality.**

Before changing components:

1. Inspect the current project structure.
2. Identify the framework and styling system.
3. Identify existing routes.
4. Identify reusable components.
5. Identify API/data dependencies.
6. Identify authentication/session logic.
7. Identify existing navigation behavior.
8. Reuse existing functionality wherever possible.
9. Refactor only where necessary.

The redesign is primarily a **UI/UX implementation**, not a rewrite of the application's business logic.

---

## 15. Implementation Quality

Use reusable, maintainable components.

Avoid:

- Duplicated JSX/templates
- Hardcoded repeated styles
- Page-specific navigation implementations
- Unnecessary dependencies
- Breaking existing routes
- Fake data when real application data already exists

Make the UI responsive and production-ready.

Ensure:

- No console errors
- No broken routes
- No horizontal overflow
- No inaccessible buttons
- Proper loading states
- Proper empty states
- Proper error states
- Keyboard accessibility where applicable
- Mobile touch targets are sufficiently large

---

## 16. Final Requirement

Treat the attached reference image as the **design system reference**, not as a screenshot to copy literally.

The final application should feel like:

> **MC HASH — a premium cloud-mining/crypto dashboard with a bright sky-blue glassmorphism design system, clean desktop sidebar navigation, a dedicated mobile layout, scrollable mobile content, and a persistent mobile bottom navigation.**

Most importantly, **keep the existing application functionality intact while replacing the current visual layer with this cleaner, more consistent UI system.**