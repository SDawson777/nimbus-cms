-- Extend JournalEntry for attachments and richer content/search
ALTER TABLE "JournalEntry"
  ADD COLUMN IF NOT EXISTS "title" TEXT,
  ADD COLUMN IF NOT EXISTS "body" TEXT,
  ADD COLUMN IF NOT EXISTS "images" JSONB,
  ADD COLUMN IF NOT EXISTS "drawings" JSONB,
  ADD COLUMN IF NOT EXISTS "attachedProducts" JSONB;

-- Make legacy product link optional to support multi-product attachment model
ALTER TABLE "JournalEntry"
  ALTER COLUMN "productId" DROP NOT NULL;

-- Ensure updatedAt exists and is initialized
ALTER TABLE "JournalEntry"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

UPDATE "JournalEntry"
SET "updatedAt" = COALESCE("updatedAt", "createdAt")
WHERE "updatedAt" IS NULL;

-- Helpful indexes for date/user filtering and title lookup
CREATE INDEX IF NOT EXISTS "JournalEntry_userId_createdAt_idx" ON "JournalEntry"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "JournalEntry_title_idx" ON "JournalEntry"("title");
