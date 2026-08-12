/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_walletAddress_key";

-- AlterTable
ALTER TABLE "MiningPlan" ADD COLUMN     "expectedReturn" DECIMAL(18,8) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MiningPurchase" ADD COLUMN     "completedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TreasuryWallet" ADD COLUMN     "supportedCurrency" TEXT NOT NULL DEFAULT 'USDT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authMethod" TEXT NOT NULL DEFAULT 'WALLET',
ADD COLUMN     "country" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ALTER COLUMN "walletAddress" DROP NOT NULL,
ALTER COLUMN "chain" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "HashRentingPlan" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(18,8) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDT',
    "chain" TEXT NOT NULL DEFAULT 'ethereum',
    "hashPower" DECIMAL(18,8) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "expectedYield" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HashRentingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HashRentingPurchase" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "currency" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "txHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HashRentingPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HashRentingPurchase_userId_idx" ON "HashRentingPurchase"("userId");

-- CreateIndex
CREATE INDEX "HashRentingPurchase_planId_idx" ON "HashRentingPurchase"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_authMethod_idx" ON "User"("authMethod");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "Wallet_address_idx" ON "Wallet"("address");

-- AddForeignKey
ALTER TABLE "HashRentingPurchase" ADD CONSTRAINT "HashRentingPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HashRentingPurchase" ADD CONSTRAINT "HashRentingPurchase_planId_fkey" FOREIGN KEY ("planId") REFERENCES "HashRentingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
