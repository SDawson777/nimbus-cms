import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  awardQuizPoints,
  calculateLoyalty,
  getLoyaltyConfig,
  getLoyaltyRewards,
  getLoyaltyTiers,
  redeemLoyaltyReward,
} from "../services/loyaltyService";
import { logger } from "../lib/logger";

export const loyaltyRouter = Router();

const scopeSchema = z.object({
  organization: z.string().optional(),
  brand: z.string().optional(),
  store: z.string().optional(),
});

loyaltyRouter.get("/config", async (req: Request, res: Response) => {
  try {
    const scope = scopeSchema.parse(req.query || {});
    const config = await getLoyaltyConfig(scope);
    res.json(config);
  } catch (error: any) {
    logger.error("loyalty.config.error", error);
    res
      .status(400)
      .json({ error: error?.message || "FAILED_TO_LOAD_LOYALTY_CONFIG" });
  }
});

loyaltyRouter.get("/rewards", async (req: Request, res: Response) => {
  try {
    const scope = scopeSchema.parse(req.query || {});
    const rewards = await getLoyaltyRewards(scope);
    res.json({ rewards });
  } catch (error: any) {
    logger.error("loyalty.rewards.error", error);
    res
      .status(400)
      .json({ error: error?.message || "FAILED_TO_LOAD_LOYALTY_REWARDS" });
  }
});

loyaltyRouter.get("/tiers", async (req: Request, res: Response) => {
  try {
    const scope = scopeSchema.parse(req.query || {});
    const tiers = await getLoyaltyTiers(scope);
    res.json({ tiers });
  } catch (error: any) {
    logger.error("loyalty.tiers.error", error);
    res
      .status(400)
      .json({ error: error?.message || "FAILED_TO_LOAD_LOYALTY_TIERS" });
  }
});

loyaltyRouter.post("/calculate", async (req: Request, res: Response) => {
  try {
    const payload = z
      .object({
        userId: z.string().min(1),
        organization: z.string().optional(),
        brand: z.string().optional(),
        store: z.string().optional(),
        orderTotal: z.number().min(0).optional(),
        productIds: z.array(z.string()).optional(),
        quizId: z.string().optional(),
      })
      .parse(req.body || {});

    const result = await calculateLoyalty(payload);
    res.json(result);
  } catch (error: any) {
    logger.error("loyalty.calculate.error", error);
    res
      .status(400)
      .json({ error: error?.message || "FAILED_TO_CALCULATE_LOYALTY" });
  }
});

loyaltyRouter.post("/redeem", async (req: Request, res: Response) => {
  try {
    const payload = z
      .object({
        userId: z.string().min(1),
        rewardId: z.string().min(1),
        quantity: z.number().int().positive().optional(),
        legalVersionAccepted: z.string().optional(),
        organization: z.string().optional(),
        brand: z.string().optional(),
        store: z.string().optional(),
      })
      .parse(req.body || {});

    const result = await redeemLoyaltyReward(payload);
    res.json(result);
  } catch (error: any) {
    logger.error("loyalty.redeem.error", error);
    res
      .status(400)
      .json({ error: error?.message || "FAILED_TO_REDEEM_LOYALTY_REWARD" });
  }
});

loyaltyRouter.post("/quiz-earned", async (req: Request, res: Response) => {
  try {
    const payload = z
      .object({
        userId: z.string().min(1),
        quizId: z.string().min(1),
        organization: z.string().optional(),
        brand: z.string().optional(),
        store: z.string().optional(),
      })
      .parse(req.body || {});

    const result = await awardQuizPoints(payload);
    res.json(result);
  } catch (error: any) {
    logger.error("loyalty.quiz_earned.error", error);
    res
      .status(400)
      .json({ error: error?.message || "FAILED_TO_AWARD_QUIZ_LOYALTY" });
  }
});

export default loyaltyRouter;
