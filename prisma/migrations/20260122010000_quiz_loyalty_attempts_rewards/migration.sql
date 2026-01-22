-- Quiz Loyalty Attempts & Rewards Migration
-- Adds quiz tracking for one-time loyalty point rewards

-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuizAttemptStatus') THEN
        CREATE TYPE "QuizAttemptStatus" AS ENUM ('in_progress', 'failed', 'passed', 'expired');
    END IF;
END $$;

-- Add quizId to LoyaltyTransaction if not exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'LoyaltyTransaction' AND column_name = 'quizId') THEN
        ALTER TABLE "LoyaltyTransaction" ADD COLUMN "quizId" TEXT;
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS "LoyaltyTransaction_quizId_idx" ON "LoyaltyTransaction"("quizId");

-- CreateTable QuizAttempt
CREATE TABLE IF NOT EXISTS "QuizAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "status" "QuizAttemptStatus" NOT NULL DEFAULT 'in_progress',
    "score" DOUBLE PRECISION,
    "passThreshold" DOUBLE PRECISION,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "passedAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable QuizReward
CREATE TABLE IF NOT EXISTS "QuizReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "pointsAwarded" INTEGER NOT NULL,
    "transactionId" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuizReward_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "QuizAttempt_userId_quizId_key" ON "QuizAttempt"("userId", "quizId");
CREATE UNIQUE INDEX IF NOT EXISTS "QuizReward_userId_quizId_key" ON "QuizReward"("userId", "quizId");

-- Create indexes
CREATE INDEX IF NOT EXISTS "QuizAttempt_userId_idx" ON "QuizAttempt"("userId");
CREATE INDEX IF NOT EXISTS "QuizAttempt_quizId_idx" ON "QuizAttempt"("quizId");
CREATE INDEX IF NOT EXISTS "QuizAttempt_status_idx" ON "QuizAttempt"("status");
CREATE INDEX IF NOT EXISTS "QuizReward_userId_idx" ON "QuizReward"("userId");
CREATE INDEX IF NOT EXISTS "QuizReward_quizId_idx" ON "QuizReward"("quizId");

-- Add foreign keys
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'QuizAttempt_userId_fkey') THEN
        ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'QuizReward_userId_fkey') THEN
        ALTER TABLE "QuizReward" ADD CONSTRAINT "QuizReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
