-- CreateEnum
CREATE TYPE "MainCalculationRecordStatus" AS ENUM ('DRAFT', 'FINALIZED');

-- CreateTable
CREATE TABLE "MainCalculation" (
    "id" TEXT NOT NULL,
    "calculationDate" TIMESTAMP(3) NOT NULL,
    "totalTabil" INTEGER NOT NULL,
    "dailyCalculationId" TEXT NOT NULL,
    "interest" INTEGER NOT NULL,
    "bandak" INTEGER NOT NULL,
    "jinisChara" INTEGER NOT NULL,
    "cash" INTEGER NOT NULL,
    "leftTotal" INTEGER NOT NULL,
    "rightTotal" INTEGER NOT NULL,
    "difference" INTEGER NOT NULL,
    "balanceStatus" "DailyCalculationBalanceStatus" NOT NULL,
    "recordStatus" "MainCalculationRecordStatus" NOT NULL DEFAULT 'DRAFT',
    "finalizedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MainCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MainCalculation_calculationDate_idx" ON "MainCalculation"("calculationDate");

-- CreateIndex
CREATE INDEX "MainCalculation_dailyCalculationId_idx" ON "MainCalculation"("dailyCalculationId");

-- CreateIndex
CREATE INDEX "MainCalculation_recordStatus_idx" ON "MainCalculation"("recordStatus");

-- CreateIndex
CREATE INDEX "MainCalculation_balanceStatus_idx" ON "MainCalculation"("balanceStatus");

-- AddForeignKey
ALTER TABLE "MainCalculation" ADD CONSTRAINT "MainCalculation_dailyCalculationId_fkey" FOREIGN KEY ("dailyCalculationId") REFERENCES "DailyCalculation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MainCalculation" ADD CONSTRAINT "MainCalculation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
