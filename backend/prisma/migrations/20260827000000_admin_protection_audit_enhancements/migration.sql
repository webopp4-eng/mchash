-- Migration: Admin account protection, richer audit trail & support attribution
-- Safe / idempotent: uses ADD COLUMN IF NOT EXISTS and CREATE INDEX IF NOT EXISTS.
-- Preserves all existing production data.

-- ============ AUDIT LOG ENHANCEMENTS (richer audit trail) ============
-- Dedicated columns for staff attribution so the audit log is queryable
-- without parsing JSON. Historical name/role snapshots are preserved even
-- if a staff account is later renamed.
ALTER TABLE "AuditLog"
  ADD COLUMN IF NOT EXISTS "actorName" TEXT,
  ADD COLUMN IF NOT EXISTS "actorUsername" TEXT,
  ADD COLUMN IF NOT EXISTS "targetType" TEXT;

CREATE INDEX IF NOT EXISTS "AuditLog_targetType_idx" ON "AuditLog"("targetType");
CREATE INDEX IF NOT EXISTS "AuditLog_actorName_idx" ON "AuditLog"("actorName");
CREATE INDEX IF NOT EXISTS "AuditLog_actorUsername_idx" ON "AuditLog"("actorUsername");

-- ============ SUPPORT MESSAGE ATTRIBUTION ============
-- Permanently attribute every staff support reply to the person who sent it.
ALTER TABLE "SupportMessage"
  ADD COLUMN IF NOT EXISTS "senderName" TEXT;

CREATE INDEX IF NOT EXISTS "SupportMessage_senderName_idx" ON "SupportMessage"("senderName");

-- ============ DEPOSIT PROCESSOR ROLE (for "action by" display) ============
ALTER TABLE "Deposit"
  ADD COLUMN IF NOT EXISTS "processedByRole" TEXT;
CREATE INDEX IF NOT EXISTS "Deposit_processedByRole_idx" ON "Deposit"("processedByRole");

-- ============ DEPOSIT RESET-BALANCE GUARD FLAG (one-time balance reset) ============
-- Tracks whether the targeted admin balance has already been reset so it can
-- never run automatically / twice.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "balanceResetAt" TIMESTAMPTZ;

-- ============ WITHDRAWAL PROCESSOR ROLE (for "action by" display) ============
ALTER TABLE "Withdrawal"
  ADD COLUMN IF NOT EXISTS "processedByRole" TEXT;
CREATE INDEX IF NOT EXISTS "Withdrawal_processedByRole_idx" ON "Withdrawal"("processedByRole");
