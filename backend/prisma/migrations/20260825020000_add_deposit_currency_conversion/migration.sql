-- Currency conversion for manual deposits.
-- Adds the locked exchange-rate fields to Deposit. Nullable so existing
-- deposits (created before this feature) remain valid and are credited
-- with their raw amount exactly as before.

ALTER TABLE "Deposit" ADD COLUMN "exchangeRate" DECIMAL(18,8);
ALTER TABLE "Deposit" ADD COLUMN "usdAmount" DECIMAL(18,8);
ALTER TABLE "Deposit" ADD COLUMN "rateSource" TEXT;