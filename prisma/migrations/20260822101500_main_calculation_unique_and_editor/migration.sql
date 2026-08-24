-- AlterTable
ALTER TABLE "MainCalculation" ADD COLUMN "lastEditedById" TEXT,
ADD COLUMN "lastEditedAt" TIMESTAMP(3);

-- DropIndex
DROP INDEX "MainCalculation_dailyCalculationId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "MainCalculation_dailyCalculationId_key" ON "MainCalculation"("dailyCalculationId");

-- AddForeignKey
ALTER TABLE "MainCalculation" ADD CONSTRAINT "MainCalculation_lastEditedById_fkey" FOREIGN KEY ("lastEditedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
