-- Backfill blanks, then enforce NOT NULL with default 5
UPDATE "JinisChara" SET "percentage" = 5 WHERE "percentage" IS NULL;
ALTER TABLE "JinisChara" ALTER COLUMN "percentage" SET DEFAULT 5;
ALTER TABLE "JinisChara" ALTER COLUMN "percentage" SET NOT NULL;
