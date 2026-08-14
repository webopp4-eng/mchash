-- AlterTable
ALTER TABLE "Deposit" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USDT',
ADD COLUMN     "method" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "note" TEXT,
ADD COLUMN     "paymentAccountId" UUID,
ADD COLUMN     "proofUrl" TEXT,
ALTER COLUMN "walletAddress" DROP NOT NULL,
ALTER COLUMN "chain" DROP NOT NULL,
ALTER COLUMN "token" SET DEFAULT 'USDT',
ALTER COLUMN "txHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PaymentAccount" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'bank',
    "name" TEXT NOT NULL,
    "label" TEXT,
    "bankName" TEXT,
    "accountHolder" TEXT,
    "accountNumber" TEXT,
    "walletAddress" TEXT,
    "network" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USDT',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentAccount_active_idx" ON "PaymentAccount"("active");

-- CreateIndex
CREATE INDEX "PaymentAccount_type_idx" ON "PaymentAccount"("type");

-- CreateIndex
CREATE INDEX "Deposit_paymentAccountId_idx" ON "Deposit"("paymentAccountId");

-- CreateIndex
CREATE INDEX "Deposit_status_idx" ON "Deposit"("status");

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "PaymentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
