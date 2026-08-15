# Production-Ready App Update & Full Synchronization Master Prompt

## Objective

Bring the entire application to a **production-ready state**. Fix all existing broken flows, make the user and admin dashboards fully synchronized, ensure all financial values use one consistent source of truth, improve the mobile UI without changing the existing color palette, and make every major feature functional end-to-end.

Do not create duplicate versions of features that already exist. Where the same feature appears in multiple locations, make every entry point use the **same underlying page, component, state, and data**.

---

# 1. Admin Mining Plan Management

### Mining plans
- On the admin dashboard, make sure administrators can:
  - Create mining plans.
  - Edit mining plans.
  - Delete mining plans successfully.
- Fix the current delete functionality.
- Clicking **Delete Mining Plan** must actually delete the selected plan.
- Do not show an incorrect `"Failed to delete plan"` message when the deletion succeeds.
- Handle loading, success, and error states correctly.
- After deletion, refresh the relevant data/state so the deleted plan disappears everywhere immediately.

### User mining
- Users must be able to successfully purchase mining plans.
- Users must be able to activate and mine multiple plans simultaneously.
- Each active mining plan must maintain its own correct state, rewards, progress, and calculations.
- All mining calculations must remain consistent with the backend/source of truth.

---

# 2. Multiple Mining Plans UI

When a user has multiple active mining plans:

- Display the mining plans inside the mining-progress section.
- The mining progress card should support multiple plans.
- Add left and right navigation arrows when more than one plan exists.
- Clicking the left arrow displays the previous mining plan.
- Clicking the right arrow displays the next mining plan.
- The transition should feel smooth and polished.
- Do not duplicate the mining component unnecessarily; use a reusable component/data structure.
- Ensure the circular mining-progress UI has more visual energy while preserving the existing color palette.

---

# 3. Global Financial/Data Synchronization

This is critical.

Create a **single source of truth** for all financial/account values.

The following must remain synchronized across the entire application:

- Current balance.
- Total balance.
- Available balance.
- Mining earnings/rewards.
- Deposits.
- Withdrawals.
- Pending withdrawals.
- Approved withdrawals.
- Declined withdrawals.
- User account balances.
- Payment/payout methods.
- Dashboard financial statistics.
- Wallet financial statistics.
- Admin financial statistics.
- Any other displayed financial number.

If a value changes in one location, every relevant location must reflect the updated value.

Do not maintain separate hardcoded or independently calculated values for the same financial metric.

Use consistent currency formatting throughout the application, including the application's configured **USD/USDT representation**. Do not allow one page to display a different currency/value interpretation from another.

---

# 4. Balance Display & Dynamic Typography

Fix all balance containers so large balances never overflow.

When the displayed monetary value becomes longer:

- Automatically reduce the balance font size responsively.
- Keep the balance centered.
- Keep the entire value visible.
- Prevent text from overflowing the card/container.
- Prevent the balance from pushing surrounding UI elements outside the container.
- Preserve proper spacing and alignment.

This must work for:

- Small balances.
- Large balances.
- Very large balances.
- Desktop.
- Tablet.
- Mobile.

Use responsive typography rather than simply hiding, clipping, truncating, or wrapping the amount unnecessarily.

---

# 5. Withdrawals

### Unified withdrawal page

There must be **one primary withdrawal experience** used throughout the application.

Every withdrawal button/card/link must point to the same withdrawal page/component, including:

- Home/dashboard withdrawal button.
- Wallet withdrawal button.
- Any withdrawal section elsewhere in the application.

Do not create separate withdrawal implementations that can become inconsistent.

### Withdrawal functionality

Users must be able to:

- Open the withdrawal page.
- Enter the required withdrawal information.
- Submit a withdrawal request.
- See the correct balance and available amount.
- Receive accurate validation.
- See the correct request status.

Withdrawal requests must be persisted correctly and synchronized with the admin panel.

### Admin withdrawal approval

Enable the admin withdrawal workflow.

Admins must be able to:

- View incoming withdrawal requests.
- See the user and requested amount.
- See relevant withdrawal/payout information.
- Approve authentic/valid withdrawal requests.
- Decline/reject invalid or unauthenticated requests.
- See the correct status after approval or rejection.

Statuses should remain synchronized between the admin panel and the user's application.

The existing minimum withdrawal requirement should remain unchanged.

---

# 6. Deposits

Fix the deposit navigation and deposit experience.

### Home dashboard

When a user clicks **Deposit** on the home/dashboard:

- Do NOT send the user to Transaction History.
- Send the user directly to the dedicated Deposit page.

### Wallet

The Deposit option in the Wallet section must open the **same Deposit page**.

### Deposit page design

The Deposit page must:

- Be a complete dedicated page.
- NOT be a popup/modal.
- Be visually polished.
- Use the same design quality and visual language as the payout/payment-method pages.
- Be responsive.
- Use the application's existing color palette.
- Have proper spacing, hierarchy, cards, forms, and states.

All deposit-related values and status information must synchronize with the application's central financial state.

---

# 7. Payout / Payment Method

Create a unified **Connect Payout Method** experience.

The same payout-method functionality should be accessible from:

### Home/Dashboard
Place the payout/payment-method option alongside the wallet/connect-wallet area where appropriate.

### Profile
Under:

**Account Options & Settings**

add:

**Connect Payout Method**

The profile option must open the exact same payout-method page/component used elsewhere.

Do not create a separate profile-specific payout implementation.

### Connect Wallet

Keep the **Connect Wallet** option available, but mark it clearly as:

**Coming Soon**

Do not make the Coming Soon wallet connection appear functional if the actual wallet connection functionality is not implemented.

---

# 8. Profile Page

Update the profile/account options menu.

Under the existing account/settings options, add:

- Connect Payout Method.
- Connect Wallet — Coming Soon.

The payout method must link to the unified payout-method page.

Ensure navigation works correctly on desktop and mobile.

---

# 9. Admin Accounts & Payment Methods

On the admin dashboard, provide proper account/payment-method management.

When adding a payment/payout method or account:

- Use the same visual style as the existing user payout-method container.
- Match the same card quality, spacing, hierarchy, borders, gradients, and interaction energy.
- Do not introduce an unrelated visual style.
- Make the admin version reusable and consistent with the user-side component where appropriate.

Admin-created/updated payment-method information must synchronize correctly with the relevant user-facing data.

---

# 10. Support System

The support system must be fully functional.

### User support page

Users should be able to:

- Open the Support page.
- Create a support ticket.
- Submit their issue/request.
- View their submitted tickets.
- Receive responses/status updates.

### Admin support page

The admin panel Support section must be active and functional.

Admins should be able to:

- Receive user support tickets.
- View ticket details.
- Identify the associated user.
- Respond to tickets.
- Update ticket status.
- Manage incoming support requests.

User and admin support data must synchronize properly.

Do not leave the support page as a static/non-functional screen.

---

# 11. Leaderboard

The existing leaderboard should remain functional.

Make sure ranking data is based on the correct synchronized account/financial data.

Rank users in descending order according to the required balance/earnings metric:

- #1 = highest qualifying balance/earnings.
- #2 = next highest.
- Continue sequentially.

The leaderboard must update when the underlying values change.

Do not use stale or hardcoded ranking values.

---

# 12. Dashboard Synchronization

The dashboard must use the same synchronized data source as the rest of the application.

Verify synchronization for:

- Current balance.
- Total balance.
- Mining earnings.
- Active mining plans.
- Deposit information.
- Withdrawal information.
- Payment/payout method.
- Account information.
- Leaderboard data.
- Any displayed financial statistics.

The admin dashboard and user dashboard must reflect the appropriate current state.

---

# 13. Mobile Responsiveness — High Priority

The application must be **100% responsive**.

Do not simply shrink the desktop layout.

Build proper responsive behavior for:

- Mobile phones.
- Tablets.
- Desktop screens.
- Different viewport widths.
- Long financial values.
- Long usernames/content.
- Multiple mining plans.

Nothing should overlap, disappear behind another element, overflow horizontally, or become unusable.

### Mobile navigation

Fix the mobile navigation.

- Properly align navigation items.
- Center the navigation where appropriate.
- Maintain consistent spacing.
- Ensure icons and labels are visible.
- Ensure the navigation does not feel excessively flat or transparent.
- Preserve the existing color palette.
- Give the navigation more visual depth and energy through subtle gradients, layering, shadows, borders, and tonal variation.

---

# 14. Mobile Card & Container Design

The current mobile interface feels too flat.

Improve the visual treatment without changing the established color palette.

Use:

- Subtle gradients.
- Appropriate color weights.
- Depth.
- Layering.
- Soft shadows.
- Better borders.
- Proper contrast.
- Stronger white surfaces where white is already used.
- More intentional spacing.

The goal is to make the UI feel more alive and polished without introducing a completely new visual identity.

### Important

Do **not** randomly change the application's primary colors.

Keep the existing colors, but improve their visual treatment.

---

# 15. Mobile Container Sizing

The smaller cards/containers on mobile — including areas such as:

- Active plans.
- Mining sections.
- TVS/matrix-related cards.
- Mining start/status containers.
- Small dashboard statistic cards.
- Other compact UI containers.

should be reduced to appropriate mobile dimensions.

Do not simply scale desktop containers down proportionally.

Instead:

- Reduce unnecessary padding.
- Reduce excessive gaps.
- Reduce card height where appropriate.
- Adjust typography.
- Adjust icon sizes.
- Maintain readable content.
- Keep touch targets usable.
- Prevent cards from taking unnecessary screen space.

The result should feel intentionally designed for mobile rather than like a compressed desktop page.

---

# 16. Mining Progress Mobile UI

The circular mining-progress component should be visually stronger.

Improve:

- Circular progress presentation.
- Visual hierarchy.
- Progress indicators.
- Spacing.
- Typography.
- Card depth.
- Gradients.
- Subtle animation/energy where appropriate.

When multiple mining plans exist, the left/right arrows should remain easily accessible and usable on mobile.

---

# 17. Desktop vs Mobile Consistency

The desktop and mobile versions must use the same underlying functionality and data.

Mobile should not be a broken or simplified version of the application.

Ensure:

- Same functionality.
- Same calculations.
- Same balances.
- Same navigation destinations.
- Same withdrawal system.
- Same deposit system.
- Same payout-method system.
- Same mining state.
- Same support system.
- Same account information.

Only the presentation/layout should adapt responsively.

---

# 18. Desktop Experience Notice

When a user visits/logs into the platform, display a small, polished informational popup notifying mobile users that the platform is optimized for desktop/full experience.

Suggested message:

**“This platform is optimized for desktop for the full experience. On mobile, some features may be limited.”**

Provide two actions:

- **Continue**
- **Cancel**

The notice should be:

- Small and unobtrusive.
- Professionally designed.
- Responsive.
- Dismissible.
- Clearly informative rather than blocking unnecessarily.

Do not prevent mobile users from accessing the application after dismissing the notice.

---

# 19. Navigation Consistency

Audit every button and navigation destination.

Specifically verify:

### Deposit buttons
All Deposit buttons → **same Deposit page**

### Withdraw buttons
All Withdraw buttons → **same Withdrawal page**

### Payout method buttons
All Connect Payout Method buttons → **same Payout Method page**

### Connect Wallet
All Connect Wallet buttons → unified wallet destination/status, currently marked **Coming Soon**

### Support
All Support links → functional Support page

Remove incorrect routes, duplicate routes, dead links, and accidental redirects to unrelated pages such as Transaction History.

---

# 20. Data Integrity & State Management

Do a complete synchronization audit.

Avoid:

- Hardcoded balances.
- Duplicate financial calculations.
- Separate local values pretending to be authoritative.
- Stale cached dashboard numbers.
- Inconsistent currency formatting.
- Different withdrawal states between pages.
- Different deposit states between pages.
- Different user balances between dashboard/account/wallet/admin views.

Use a reliable centralized data/state architecture and refresh/invalidate data appropriately after mutations.

After actions such as:

- Purchasing a mining plan.
- Mining.
- Depositing.
- Requesting withdrawal.
- Approving withdrawal.
- Declining withdrawal.
- Updating payout method.
- Updating account information.

the affected UI should immediately reflect the correct synchronized state.

---

# 21. Production-Readiness Audit

Before considering the work complete, test the entire application end-to-end.

### User flows

Test:

- Registration/login.
- Dashboard.
- Wallet.
- Deposit.
- Withdrawal.
- Payout method.
- Profile.
- Support.
- Mining plan purchase.
- Multiple active mining plans.
- Mining progression.
- Leaderboard.
- Account/balance updates.

### Admin flows

Test:

- Admin login.
- Dashboard.
- Mining plan creation.
- Mining plan editing.
- Mining plan deletion.
- User/account management.
- Payment/payout method management.
- Withdrawal approval.
- Withdrawal rejection.
- Support ticket reception.
- Support ticket response.
- Financial statistics.

### Responsive testing

Test at multiple viewport sizes.

Verify:

- No horizontal overflow.
- No overlapping elements.
- No clipped text.
- No overflowing balances.
- No broken cards.
- No broken navigation.
- No inaccessible buttons.
- No hidden content.
- No broken modals/popups.
- No layout shifts that break usability.

### Error handling

Every major API/action must have:

- Loading state.
- Success state.
- Error state.
- Appropriate user feedback.
- Correct data refresh/synchronization.

Do not display false error messages after successful operations.

---

# 22. Final Acceptance Criteria

The implementation is complete only when:

1. Admins can successfully delete mining plans.
2. Users can purchase and activate multiple mining plans.
3. Multiple mining plans can be navigated using left/right controls.
4. Deposits open the dedicated Deposit page instead of Transaction History.
5. All Deposit buttons use the same Deposit page.
6. All Withdraw buttons use the same Withdrawal page.
7. Withdrawal requests work end-to-end.
8. Admins can approve or decline withdrawals.
9. Payout methods use one unified page/component.
10. Payout methods are accessible from Home and Profile.
11. Connect Wallet is clearly marked Coming Soon.
12. Support works for both users and admins.
13. All financial values synchronize across the application.
14. Account balances synchronize correctly.
15. Leaderboard values use synchronized data.
16. Large balances automatically reduce font size to prevent overflow.
17. Desktop and mobile use the same underlying functionality.
18. Mobile layouts are genuinely responsive rather than simply compressed.
19. Mobile cards/containers are appropriately resized.
20. Mobile navigation is properly aligned and visually polished.
21. Existing colors are preserved while gradients, depth, contrast, and visual energy are improved.
22. The desktop/full-experience notice appears appropriately for mobile users.
23. No major buttons lead to incorrect pages.
24. No duplicate financial sources of truth remain.
25. No false success/error states remain.
26. No major console/runtime/API errors remain.
27. The complete application passes end-to-end testing and is ready for production.

**Important implementation principle:** prioritize correctness, synchronization, data integrity, and responsive behavior first. Then refine the visual polish. Do not sacrifice functionality or state consistency for visual effects.