-- CreateTable
CREATE TABLE IF NOT EXISTS "LoyaltyAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "tierId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LoyaltyAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LoyaltyAccount_userId_key" ON "LoyaltyAccount"("userId");
CREATE INDEX IF NOT EXISTS "LoyaltyAccount_tierId_idx" ON "LoyaltyAccount"("tierId");

-- AlterTable
ALTER TABLE "LoyaltyTransaction"
  ADD COLUMN IF NOT EXISTS "points" INTEGER,
  ADD COLUMN IF NOT EXISTS "metadata" JSONB,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

UPDATE "LoyaltyTransaction"
SET "updatedAt" = COALESCE("updatedAt", "createdAt"),
    "points" = COALESCE("points", "amount")
WHERE "updatedAt" IS NULL OR "points" IS NULL;
