import { Router, Request, Response } from "express";
import { z } from "zod";
import getPrisma from "../lib/prisma";
import { logger } from "../lib/logger";

export const userRewardsRouter = Router();

// Badge definitions
const BADGE_DEFINITIONS = {
  first_quiz: {
    id: "first_quiz",
    name: "Quiz Master",
    description: "Complete your first quiz",
    icon: "🎯",
    requiredCount: 1,
  },
  five_quizzes: {
    id: "five_quizzes",
    name: "Quiz Scholar",
    description: "Complete 5 quizzes",
    icon: "📚",
    requiredCount: 5,
  },
  ten_quizzes: {
    id: "ten_quizzes",
    name: "Quiz Expert",
    description: "Complete 10 quizzes",
    icon: "🏆",
    requiredCount: 10,
  },
  hundred_points: {
    id: "hundred_points",
    name: "Point Collector",
    description: "Earn 100 points",
    icon: "⭐",
    requiredPoints: 100,
  },
  five_hundred_points: {
    id: "five_hundred_points",
    name: "Point Master",
    description: "Earn 500 points",
    icon: "💎",
    requiredPoints: 500,
  },
  perfect_score: {
    id: "perfect_score",
    name: "Perfect Mind",
    description: "Score 100% on a quiz",
    icon: "✨",
    requiresPerfect: true,
  },
};

/**
 * POST /api/v1/user/rewards/quiz-completion
 * Track quiz completion and award points
 */
userRewardsRouter.post("/quiz-completion", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      userId: z.string().min(1),
      quizId: z.string().min(1),
      quizTitle: z.string(),
      score: z.number().min(0).max(100),
      totalQuestions: z.number().min(1),
      basePoints: z.number().min(1).default(50),
    });

    const data = schema.parse(req.body);
    const prisma = getPrisma();

    // Calculate points based on score
    const pointsEarned = Math.floor((data.score / 100) * data.basePoints);
    const isPerfectScore = data.score === 100;

    // Record quiz completion
    const completion = await prisma.quizCompletion.create({
      data: {
        userId: data.userId,
        quizId: data.quizId,
        quizTitle: data.quizTitle,
        score: data.score,
        totalQuestions: data.totalQuestions,
        pointsEarned,
        completedAt: new Date(),
      },
    });

    // Award points as user reward
    await prisma.userReward.create({
      data: {
        userId: data.userId,
        rewardType: "quiz_completion",
        points: pointsEarned,
        description: `Completed quiz: ${data.quizTitle}`,
      },
    });

    // Check and award badges
    const badges = await checkAndAwardBadges(data.userId, prisma, isPerfectScore ? data.quizId : undefined);

    // Get updated user stats
    const stats = await getUserStats(data.userId, prisma);

    logger.info("quiz.completion.recorded", {
      userId: data.userId,
      quizId: data.quizId,
      score: data.score,
      pointsEarned,
    });

    res.json({
      success: true,
      completion: {
        id: completion.id,
        quizId: completion.quizId,
        score: completion.score,
        pointsEarned,
        completedAt: completion.completedAt,
      },
      userStats: stats,
      newBadges: badges,
    });
  } catch (error: any) {
    logger.error("quiz.completion.error", error);
    res.status(400).json({ error: error.message || "Failed to record quiz completion" });
  }
});

/**
 * GET /api/v1/user/rewards/:userId
 * Get user's total points, badges, and reward history
 */
userRewardsRouter.get("/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const prisma = getPrisma();

    const stats = await getUserStats(userId, prisma);

    res.json(stats);
  } catch (error: any) {
    logger.error("user.rewards.error", error);
    res.status(400).json({ error: "Failed to fetch user rewards" });
  }
});

/**
 * GET /api/v1/user/rewards/:userId/quizzes
 * Get user's quiz completion history
 */
userRewardsRouter.get("/:userId/quizzes", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const schema = z.object({
      limit: z.coerce.number().min(1).max(50).default(20),
      offset: z.coerce.number().min(0).default(0),
    });

    const params = schema.parse(req.query);
    const prisma = getPrisma();

    const [completions, total] = await Promise.all([
      prisma.quizCompletion.findMany({
        where: { userId },
        orderBy: { completedAt: "desc" },
        take: params.limit,
        skip: params.offset,
      }),
      prisma.quizCompletion.count({ where: { userId } }),
    ]);

    res.json({
      userId,
      quizzes: completions.map((c) => ({
        id: c.id,
        quizId: c.quizId,
        quizTitle: c.quizTitle,
        score: c.score,
        totalQuestions: c.totalQuestions,
        pointsEarned: c.pointsEarned,
        completedAt: c.completedAt,
      })),
      total,
      limit: params.limit,
      offset: params.offset,
    });
  } catch (error: any) {
    logger.error("user.quizzes.history.error", error);
    res.status(400).json({ error: "Failed to fetch quiz history" });
  }
});

/**
 * GET /api/v1/user/rewards/:userId/badges
 * Get user's earned badges
 */
userRewardsRouter.get("/:userId/badges", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const prisma = getPrisma();

    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      orderBy: { unlockedAt: "desc" },
    });

    const badgesWithDetails = userBadges.map((b) => {
      const def = BADGE_DEFINITIONS[b.badgeId as keyof typeof BADGE_DEFINITIONS];
      return {
        id: b.id,
        badgeId: b.badgeId,
        badgeName: b.badgeName,
        icon: def?.icon || "🏅",
        description: def?.description || "",
        unlockedAt: b.unlockedAt,
      };
    });

    res.json({
      userId,
      badges: badgesWithDetails,
      total: badgesWithDetails.length,
    });
  } catch (error: any) {
    logger.error("user.badges.error", error);
    res.status(400).json({ error: "Failed to fetch badges" });
  }
});

/**
 * Helper: Get user's complete stats
 */
async function getUserStats(userId: string, prisma: any) {
  const [rewards, badges, completions] = await Promise.all([
    prisma.userReward.findMany({ where: { userId } }),
    prisma.userBadge.findMany({ where: { userId } }),
    prisma.quizCompletion.findMany({ where: { userId } }),
  ]);

  const totalPoints = rewards.reduce((sum: number, r: any) => sum + r.points, 0);
  const level = calculateLevel(totalPoints);
  const quizzesCompleted = completions.length;
  const averageScore = completions.length > 0 
    ? Math.round(completions.reduce((sum: number, c: any) => sum + c.score, 0) / completions.length)
    : 0;

  return {
    userId,
    totalPoints,
    level,
    nextLevelPoints: getNextLevelPoints(level),
    quizzesCompleted,
    averageScore,
    badges: badges.length,
    lastActivityAt: completions.length > 0 
      ? completions[0].completedAt 
      : null,
    stats: {
      totalRewards: rewards.length,
      totalBadges: badges.length,
      totalQuizzes: quizzesCompleted,
      perfectScores: completions.filter((c: any) => c.score === 100).length,
    },
  };
}

/**
 * Helper: Check and award badges
 */
async function checkAndAwardBadges(userId: string, prisma: any, perfectQuizId?: string) {
  const awardedBadges = [];

  try {
    const stats = await getUserStats(userId, prisma);
    const existingBadges = await prisma.userBadge.findMany({ where: { userId } });
    const existingBadgeIds = new Set(existingBadges.map((b: any) => b.badgeId));

    // Check first quiz
    if (stats.quizzesCompleted === 1 && !existingBadgeIds.has("first_quiz")) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: "first_quiz",
          badgeName: BADGE_DEFINITIONS.first_quiz.name,
        },
      });
      awardedBadges.push("first_quiz");
      logger.info("badge.awarded", { userId, badgeId: "first_quiz" });
    }

    // Check 5 quizzes
    if (stats.quizzesCompleted >= 5 && !existingBadgeIds.has("five_quizzes")) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: "five_quizzes",
          badgeName: BADGE_DEFINITIONS.five_quizzes.name,
        },
      });
      awardedBadges.push("five_quizzes");
      logger.info("badge.awarded", { userId, badgeId: "five_quizzes" });
    }

    // Check 10 quizzes
    if (stats.quizzesCompleted >= 10 && !existingBadgeIds.has("ten_quizzes")) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: "ten_quizzes",
          badgeName: BADGE_DEFINITIONS.ten_quizzes.name,
        },
      });
      awardedBadges.push("ten_quizzes");
      logger.info("badge.awarded", { userId, badgeId: "ten_quizzes" });
    }

    // Check 100 points
    if (stats.totalPoints >= 100 && !existingBadgeIds.has("hundred_points")) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: "hundred_points",
          badgeName: BADGE_DEFINITIONS.hundred_points.name,
        },
      });
      awardedBadges.push("hundred_points");
      logger.info("badge.awarded", { userId, badgeId: "hundred_points" });
    }

    // Check 500 points
    if (stats.totalPoints >= 500 && !existingBadgeIds.has("five_hundred_points")) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: "five_hundred_points",
          badgeName: BADGE_DEFINITIONS.five_hundred_points.name,
        },
      });
      awardedBadges.push("five_hundred_points");
      logger.info("badge.awarded", { userId, badgeId: "five_hundred_points" });
    }

    // Check perfect score
    if (perfectQuizId && !existingBadgeIds.has("perfect_score")) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: "perfect_score",
          badgeName: BADGE_DEFINITIONS.perfect_score.name,
        },
      });
      awardedBadges.push("perfect_score");
      logger.info("badge.awarded", { userId, badgeId: "perfect_score" });
    }
  } catch (error: any) {
    logger.error("badge.award.error", error);
  }

  return awardedBadges;
}

/**
 * Helper: Calculate user level based on points
 */
function calculateLevel(points: number): number {
  if (points < 50) return 1;
  if (points < 150) return 2;
  if (points < 300) return 3;
  if (points < 500) return 4;
  if (points < 750) return 5;
  return Math.min(Math.floor(points / 250) + 1, 20); // Max level 20
}

/**
 * Helper: Get points needed for next level
 */
function getNextLevelPoints(currentLevel: number): number {
  const levelThresholds = [0, 50, 150, 300, 500, 750];
  if (currentLevel < levelThresholds.length) {
    return levelThresholds[currentLevel];
  }
  return currentLevel * 250;
}
