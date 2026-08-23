-- Performance indexes for hot query paths (no business-logic changes).
-- Safe to re-run: IF NOT EXISTS guards make this idempotent.

-- Mining: hourly reward processor scans active purchases/sessions
CREATE INDEX IF NOT EXISTS "MiningPurchase_status_idx" ON "MiningPurchase"("status");
CREATE INDEX IF NOT EXISTS "MiningPurchase_userId_status_idx" ON "MiningPurchase"("userId", "status");
CREATE INDEX IF NOT EXISTS "HashRentingPurchase_status_idx" ON "HashRentingPurchase"("status");
CREATE INDEX IF NOT EXISTS "MiningSession_purchaseId_idx" ON "MiningSession"("purchaseId");
CREATE INDEX IF NOT EXISTS "MiningSession_status_lastPayoutAt_idx" ON "MiningSession"("status", "lastPayoutAt");

-- Dashboard/transactions: per-user recent activity lists
CREATE INDEX IF NOT EXISTS "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Deposit_userId_createdAt_idx" ON "Deposit"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Withdrawal_userId_requestedAt_idx" ON "Withdrawal"("userId", "requestedAt" DESC);

-- Notifications: unread counts per user
CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- Referrals: earnings lookups by user
CREATE INDEX IF NOT EXISTS "ReferralEarning_userId_idx" ON "ReferralEarning"("userId");