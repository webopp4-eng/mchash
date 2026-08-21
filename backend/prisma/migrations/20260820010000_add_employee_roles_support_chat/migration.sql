-- Migration: Add employee roles, support chat enhancements, audit logging improvements
-- This migration preserves all existing production data.

-- ============ USER TABLE ENHANCEMENTS ============
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "employeeStatus" TEXT DEFAULT 'active';
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_employeeStatus_idx" ON "User"("employeeStatus");

-- ============ AUDIT LOG ENHANCEMENTS ============
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "actorRole" TEXT DEFAULT 'user';
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "targetId" TEXT;
CREATE INDEX IF NOT EXISTS "AuditLog_actorRole_idx" ON "AuditLog"("actorRole");
CREATE INDEX IF NOT EXISTS "AuditLog_targetId_idx" ON "AuditLog"("targetId");

-- ============ DEPOSIT ENHANCEMENTS ============
ALTER TABLE "Deposit" ADD COLUMN IF NOT EXISTS "processedById" UUID;
ALTER TABLE "Deposit" ADD COLUMN IF NOT EXISTS "processedByName" TEXT;
CREATE INDEX IF NOT EXISTS "Deposit_processedById_idx" ON "Deposit"("processedById");

-- ============ WITHDRAWAL ENHANCEMENTS ============
ALTER TABLE "Withdrawal" ADD COLUMN IF NOT EXISTS "processedById" UUID;
ALTER TABLE "Withdrawal" ADD COLUMN IF NOT EXISTS "processedByName" TEXT;
CREATE INDEX IF NOT EXISTS "Withdrawal_processedById_idx" ON "Withdrawal"("processedById");

-- ============ NOTIFICATION ENHANCEMENTS ============
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "conversationId" UUID;
CREATE INDEX IF NOT EXISTS "Notification_conversationId_idx" ON "Notification"("conversationId");

-- ============ SUPPORT TICKET ENHANCEMENTS ============
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "assignedStaffId" UUID;
CREATE INDEX IF NOT EXISTS "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE INDEX IF NOT EXISTS "SupportTicket_assignedStaffId_idx" ON "SupportTicket"("assignedStaffId");

-- ============ SUPPORT MESSAGE ENHANCEMENTS ============
ALTER TABLE "SupportMessage" ADD COLUMN IF NOT EXISTS "readByUser" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SupportMessage" ADD COLUMN IF NOT EXISTS "readByStaff" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "SupportMessage_senderId_idx" ON "SupportMessage"("senderId");
CREATE INDEX IF NOT EXISTS "SupportMessage_readByUser_idx" ON "SupportMessage"("readByUser");
CREATE INDEX IF NOT EXISTS "SupportMessage_readByStaff_idx" ON "SupportMessage"("readByStaff");

-- ============ DATA MIGRATION ============
UPDATE "User" SET "role" = 'SUPER_ADMIN' WHERE "role" = 'admin';
UPDATE "User" SET "employeeStatus" = 'active' WHERE "employeeStatus" IS NULL;
UPDATE "AuditLog" al SET "actorRole" = u."role" FROM "User" u WHERE al."userId" = u."id" AND al."actorRole" IS NULL;