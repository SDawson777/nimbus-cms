import { Router, Request, Response } from "express";
import { z } from "zod";
import getPrisma from "../lib/prisma";
import { fetchCMS } from "../lib/cms";
import { logger } from "../lib/logger";

export const userRewardsRouter = Router();

type BadgeRule = {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  criteriaType: "quizCount" | "totalPoints" | "perfectScoreCount";
  threshold: number;
};

type RewardsConfig = {
  baseQuizPoints: number;
  levelThresholds: number[];
  levelStepPoints: number;
  maxLevel: number;
  badgeRules: BadgeRule[];
};

const DEFAULT_REWARDS_CONFIG: RewardsConfig = {
  baseQuizPoints: 50,
  levelThresholds: [0, 50, 150, 300, 500, 750],
  levelStepPoints: 250,
  maxLevel: 20,
  badgeRules: [
    {
      badgeId: "first_quiz",
      name: "Quiz Master",
      description: "Complete your first quiz",
      icon: "🎯",
      criteriaType: "quizCount",
      threshold: 1,
    },
    {
      badgeId: "five_quizzes",
      name: "Quiz Scholar",
      description: "Complete 5 quizzes",
      icon: "📚",
      criteriaType: "quizCount",
      threshold: 5,
    },
    {
      badgeId: "ten_quizzes",
      name: "Quiz Expert",
      description: "Complete 10 quizzes",
      icon: "🏆",
      criteriaType: "quizCount",
      threshold: 10,
    },
    {
      badgeId: "hundred_points",
      name: "Point Collector",
      description: "Earn 100 points",
      icon: "⭐",
      criteriaType: "totalPoints",
      threshold: 100,
    },
    {
      badgeId: "five_hundred_points",
      name: "Point Master",
      description: "Earn 500 points",
      icon: "💎",
      criteriaType: "totalPoints",
      threshold: 500,
    },
    {
      badgeId: "perfect_score",
      name: "Perfect Mind",
      description: "Score 100% on a quiz",
      icon: "✨",
      criteriaType: "perfectScoreCount",
      threshold: 1,
    },
  ],
};

async function getRewardsConfig(): Promise<RewardsConfig> {
  try {
    const doc = await fetchCMS<any>(
      `*[_type=="rewardsConfig"][0]{
        baseQuizPoints,
        levelThresholds,
        levelStepPoints,
        maxLevel,
        badgeRules[]{
          badgeId,
          name,
          description,
          icon,
          criteriaType,
          threshold
        }
      }`,
      {},
    );

    if (!doc) return DEFAULT_REWARDS_CONFIG;

    const badgeRules = Array.isArray(doc.badgeRules) && doc.badgeRules.length > 0
      ? doc.badgeRules
          .filter((rule: any) => rule?.badgeId && rule?.criteriaType)
          .map((rule: any) => ({
            badgeId: String(rule.badgeId),
            name: String(rule.name || rule.badgeId),
            description: String(rule.description || ""),
            icon: String(rule.icon || "🏅"),
            criteriaType: rule.criteriaType as BadgeRule["criteriaType"],
            threshold: Number(rule.threshold || 0),
          }))
      : DEFAULT_REWARDS_CONFIG.badgeRules;

    return {
      baseQuizPoints: Number(doc.baseQuizPoints || DEFAULT_REWARDS_CONFIG.baseQuizPoints),
      levelThresholds: Array.isArray(doc.levelThresholds) && doc.levelThresholds.length > 0
        ? doc.levelThresholds.map((v: any) => Number(v)).filter((v: number) => !Number.isNaN(v))
        : DEFAULT_REWARDS_CONFIG.levelThresholds,
      levelStepPoints: Number(doc.levelStepPoints || DEFAULT_REWARDS_CONFIG.levelStepPoints),
      maxLevel: Number(doc.maxLevel || DEFAULT_REWARDS_CONFIG.maxLevel),
      badgeRules,
    };
  } catch (error: any) {
    logger.error("rewards.config.error", error);
    return DEFAULT_REWARDS_CONFIG;
  }
}

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
      basePoints: z.number().min(1).optional(),
    });

    const data = schema.parse(req.body);
    const prisma = getPrisma();
    const config = await getRewardsConfig();

    // Calculate points based on score
    const basePoints = data.basePoints ?? config.baseQuizPoints;
    const pointsEarned = Math.floor((data.score / 100) * basePoints);
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
    const badges = await checkAndAwardBadges(
      data.userId,
      prisma,
      config,
      isPerfectScore ? data.quizId : undefined,
    );

    // Get updated user stats
    const stats = await getUserStats(data.userId, prisma, config);

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
    const config = await getRewardsConfig();

    const stats = await getUserStats(userId, prisma, config);

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
    const config = await getRewardsConfig();

    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      orderBy: { unlockedAt: "desc" },
    });

    const badgeMap = new Map(
      config.badgeRules.map((rule) => [rule.badgeId, rule]),
    );

    const badgesWithDetails = userBadges.map((b) => {
      const def = badgeMap.get(b.badgeId);
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
async function getUserStats(userId: string, prisma: any, config: RewardsConfig) {
  const [rewards, badges, completions] = await Promise.all([
    prisma.userReward.findMany({ where: { userId } }),
    prisma.userBadge.findMany({ where: { userId } }),
    prisma.quizCompletion.findMany({ where: { userId } }),
  ]);

  const totalPoints = rewards.reduce((sum: number, r: any) => sum + r.points, 0);
  const level = calculateLevel(totalPoints, config);
  const quizzesCompleted = completions.length;
  const averageScore = completions.length > 0 
    ? Math.round(completions.reduce((sum: number, c: any) => sum + c.score, 0) / completions.length)
    : 0;

  return {
    userId,
    totalPoints,
    level,
    nextLevelPoints: getNextLevelPoints(level, config),
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
async function checkAndAwardBadges(
  userId: string,
  prisma: any,
  config: RewardsConfig,
  perfectQuizId?: string,
) {
  const awardedBadges = [];

  try {
    const stats = await getUserStats(userId, prisma, config);
    const existingBadges = await prisma.userBadge.findMany({ where: { userId } });
    const existingBadgeIds = new Set(existingBadges.map((b: any) => b.badgeId));

    for (const rule of config.badgeRules) {
      if (existingBadgeIds.has(rule.badgeId)) continue;

      const meetsCriteria = (() => {
        if (rule.criteriaType === "quizCount") {
          return stats.quizzesCompleted >= rule.threshold;
        }
        if (rule.criteriaType === "totalPoints") {
          return stats.totalPoints >= rule.threshold;
        }
        if (rule.criteriaType === "perfectScoreCount") {
          if (!perfectQuizId && stats.stats.perfectScores === 0) return false;
          return stats.stats.perfectScores >= rule.threshold;
        }
        return false;
      })();

      if (!meetsCriteria) continue;

      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: rule.badgeId,
          badgeName: rule.name,
        },
      });
      awardedBadges.push(rule.badgeId);
      logger.info("badge.awarded", { userId, badgeId: rule.badgeId });
    }
  } catch (error: any) {
    logger.error("badge.award.error", error);
  }

  return awardedBadges;
}

/**
 * Helper: Calculate user level based on points
 */
function calculateLevel(points: number, config: RewardsConfig): number {
  const thresholds = config.levelThresholds.length
    ? config.levelThresholds
    : DEFAULT_REWARDS_CONFIG.levelThresholds;

  let level = 1;
  for (let i = 1; i < thresholds.length; i += 1) {
    if (points >= thresholds[i]) level = i + 1;
    else break;
  }

  if (points >= thresholds[thresholds.length - 1]) {
    const extra = points - thresholds[thresholds.length - 1];
    level = thresholds.length + Math.floor(extra / config.levelStepPoints);
  }

  return Math.min(level, config.maxLevel);
}

/**
 * Helper: Get points needed for next level
 */
function getNextLevelPoints(currentLevel: number, config: RewardsConfig): number {
  const thresholds = config.levelThresholds.length
    ? config.levelThresholds
    : DEFAULT_REWARDS_CONFIG.levelThresholds;
  if (currentLevel < thresholds.length) {
    return thresholds[currentLevel];
  }

  const base = thresholds[thresholds.length - 1];
  const extraLevels = currentLevel - thresholds.length + 1;
  return base + extraLevels * config.levelStepPoints;
}
