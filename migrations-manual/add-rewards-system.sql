-- CreateTable for QuizCompletion
CREATE TABLE IF NOT EXISTS "QuizCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "quizTitle" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "pointsEarned" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuizCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable for UserReward
CREATE TABLE IF NOT EXISTS "UserReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable for UserBadge
CREATE TABLE IF NOT EXISTS "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "badgeName" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for QuizCompletion
CREATE INDEX IF NOT EXISTS "QuizCompletion_userId_idx" ON "QuizCompletion"("userId");
CREATE INDEX IF NOT EXISTS "QuizCompletion_quizId_idx" ON "QuizCompletion"("quizId");
CREATE INDEX IF NOT EXISTS "QuizCompletion_completedAt_idx" ON "QuizCompletion"("completedAt");

-- CreateIndex for UserReward
CREATE INDEX IF NOT EXISTS "UserReward_userId_idx" ON "UserReward"("userId");
CREATE INDEX IF NOT EXISTS "UserReward_rewardType_idx" ON "UserReward"("rewardType");
CREATE INDEX IF NOT EXISTS "UserReward_earnedAt_idx" ON "UserReward"("earnedAt");

-- CreateIndex for UserBadge
CREATE UNIQUE INDEX IF NOT EXISTS "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");
CREATE INDEX IF NOT EXISTS "UserBadge_userId_idx" ON "UserBadge"("userId");
