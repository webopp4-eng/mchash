/*
  Warnings:

  - You are about to drop the column `avatar` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `chain` on the `Withdrawal` table. All the data in the column will be lost.
  - You are about to drop the column `destinationAddress` on the `Withdrawal` table. All the data in the column will be lost.
  - Added the required column `asset` to the `Withdrawal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payoutMethodId` to the `Withdrawal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatar";

-- AlterTable
ALTER TABLE "Withdrawal" DROP COLUMN "chain",
DROP COLUMN "destinationAddress",
ADD COLUMN     "asset" TEXT NOT NULL,
ADD COLUMN     "payoutMethodId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "PayoutMethod" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "network" TEXT,
    "solanaAddress" TEXT,
    "momoNumber" TEXT,
    "momoName" TEXT,
    "bankName" TEXT,
    "accountHolder" TEXT,
    "accountNumber" TEXT,
    "bankCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PayoutMethod_userId_idx" ON "PayoutMethod"("userId");

-- CreateIndex
CREATE INDEX "PayoutMethod_type_idx" ON "PayoutMethod"("type");

-- CreateIndex
CREATE INDEX "Withdrawal_payoutMethodId_idx" ON "Withdrawal"("payoutMethodId");

-- CreateIndex
CREATE INDEX "Withdrawal_status_idx" ON "Withdrawal"("status");

-- AddForeignKey
ALTER TABLE "PayoutMethod" ADD CONSTRAINT "PayoutMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_payoutMethodId_fkey" FOREIGN KEY ("payoutMethodId") REFERENCES "PayoutMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
