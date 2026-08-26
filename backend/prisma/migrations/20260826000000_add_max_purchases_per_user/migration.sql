-- AlterTable: maximum number of times a single user may buy a mining plan.
-- NULL means the plan can be purchased an unlimited number of times per user.
ALTER TABLE "MiningPlan" ADD COLUMN "maxPurchasesPerUser" INTEGER;