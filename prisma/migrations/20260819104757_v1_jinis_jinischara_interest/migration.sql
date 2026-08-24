/*
  Warnings:

  - You are about to drop the `Todo` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "JinisType" AS ENUM ('GOLD', 'SILVER', 'BOTH', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "JinisItemType" AS ENUM ('GOLD', 'SILVER');

-- DropTable
DROP TABLE "Todo";

-- CreateTable
CREATE TABLE "Jinis" (
    "id" TEXT NOT NULL,
    "slNo" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL,
    "phoneNo" TEXT NOT NULL,
    "credit" INTEGER NOT NULL,
    "type" "JinisType" NOT NULL,
    "goldWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "silverWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "settledAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jinis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JinisItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wet" DOUBLE PRECISION NOT NULL,
    "type" "JinisItemType" NOT NULL,
    "jinisId" TEXT NOT NULL,

    CONSTRAINT "JinisItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JinisChara" (
    "id" TEXT NOT NULL,
    "slNo" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL,
    "phoneNo" TEXT NOT NULL,
    "credit" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "settledAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JinisChara_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "jinisId" TEXT,
    "jinisCharaId" TEXT,
    "personName" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Jinis_slNo_idx" ON "Jinis"("slNo");

-- CreateIndex
CREATE INDEX "Jinis_name_idx" ON "Jinis"("name");

-- CreateIndex
CREATE INDEX "Jinis_phoneNo_idx" ON "Jinis"("phoneNo");

-- CreateIndex
CREATE INDEX "Jinis_date_idx" ON "Jinis"("date");

-- CreateIndex
CREATE INDEX "Jinis_active_idx" ON "Jinis"("active");

-- CreateIndex
CREATE INDEX "Jinis_settledAt_idx" ON "Jinis"("settledAt");

-- CreateIndex
CREATE INDEX "JinisItem_jinisId_idx" ON "JinisItem"("jinisId");

-- CreateIndex
CREATE INDEX "JinisItem_type_idx" ON "JinisItem"("type");

-- CreateIndex
CREATE INDEX "JinisChara_slNo_idx" ON "JinisChara"("slNo");

-- CreateIndex
CREATE INDEX "JinisChara_name_idx" ON "JinisChara"("name");

-- CreateIndex
CREATE INDEX "JinisChara_phoneNo_idx" ON "JinisChara"("phoneNo");

-- CreateIndex
CREATE INDEX "JinisChara_date_idx" ON "JinisChara"("date");

-- CreateIndex
CREATE INDEX "JinisChara_active_idx" ON "JinisChara"("active");

-- CreateIndex
CREATE INDEX "JinisChara_settledAt_idx" ON "JinisChara"("settledAt");

-- CreateIndex
CREATE INDEX "Interest_date_idx" ON "Interest"("date");

-- CreateIndex
CREATE INDEX "Interest_jinisId_idx" ON "Interest"("jinisId");

-- CreateIndex
CREATE INDEX "Interest_jinisCharaId_idx" ON "Interest"("jinisCharaId");

-- CreateIndex
CREATE INDEX "Interest_personName_idx" ON "Interest"("personName");

-- AddForeignKey
ALTER TABLE "Jinis" ADD CONSTRAINT "Jinis_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JinisItem" ADD CONSTRAINT "JinisItem_jinisId_fkey" FOREIGN KEY ("jinisId") REFERENCES "Jinis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JinisChara" ADD CONSTRAINT "JinisChara_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_jinisId_fkey" FOREIGN KEY ("jinisId") REFERENCES "Jinis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_jinisCharaId_fkey" FOREIGN KEY ("jinisCharaId") REFERENCES "JinisChara"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
