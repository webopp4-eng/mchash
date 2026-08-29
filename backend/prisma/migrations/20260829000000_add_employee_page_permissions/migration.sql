-- Admin dashboard page permissions for EMPLOYEE accounts.
-- NULL = not configured (legacy default: full staff access);
-- JSON array = explicit whitelist of page keys.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pagePermissions" JSONB;
