-- Add per-asset balance columns to User table
ALTER TABLE "User" ADD COLUMN "balanceUSDT" DECIMAL(18,8) NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "balanceBTC" DECIMAL(18,8) NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "balanceETH" DECIMAL(18,8) NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "balanceMCCoin" DECIMAL(18,8) NOT NULL DEFAULT 0;

-- Backfill existing platformBalance into USDT balance for existing users
UPDATE "User" SET "balanceUSDT" = "platformBalance" WHERE "platformBalance" > 0;