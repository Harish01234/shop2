-- CreateEnum
CREATE TYPE "DailyCalculationRecordStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "DailyCalculationBalanceStatus" AS ENUM ('CORRECT', 'INCORRECT');

-- CreateTable
CREATE TABLE "DailyCalculation" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "tabil" INTEGER NOT NULL,
    "cashInHome" INTEGER NOT NULL,
    "cashInShop" INTEGER NOT NULL,
    "asol" INTEGER NOT NULL,
    "sudh" INTEGER NOT NULL,
    "deoya" INTEGER NOT NULL,
    "personMoneyTotal" INTEGER NOT NULL,
    "leftTotal" INTEGER NOT NULL,
    "rightTotal" INTEGER NOT NULL,
    "difference" INTEGER NOT NULL,
    "balanceStatus" "DailyCalculationBalanceStatus" NOT NULL,
    "recordStatus" "DailyCalculationRecordStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastEditedById" TEXT,
    "lastEditedAt" TIMESTAMP(3),

    CONSTRAINT "DailyCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCalculationPersonMoney" (
    "id" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "remarks" TEXT,
    "dailyCalculationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCalculationPersonMoney_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyCalculation_periodStart_idx" ON "DailyCalculation"("periodStart");

-- CreateIndex
CREATE INDEX "DailyCalculation_periodEnd_idx" ON "DailyCalculation"("periodEnd");

-- CreateIndex
CREATE INDEX "DailyCalculation_recordStatus_idx" ON "DailyCalculation"("recordStatus");

-- CreateIndex
CREATE INDEX "DailyCalculation_balanceStatus_idx" ON "DailyCalculation"("balanceStatus");

-- CreateIndex
CREATE INDEX "DailyCalculationPersonMoney_dailyCalculationId_idx" ON "DailyCalculationPersonMoney"("dailyCalculationId");

-- AddForeignKey
ALTER TABLE "DailyCalculation" ADD CONSTRAINT "DailyCalculation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCalculation" ADD CONSTRAINT "DailyCalculation_lastEditedById_fkey" FOREIGN KEY ("lastEditedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCalculationPersonMoney" ADD CONSTRAINT "DailyCalculationPersonMoney_dailyCalculationId_fkey" FOREIGN KEY ("dailyCalculationId") REFERENCES "DailyCalculation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
