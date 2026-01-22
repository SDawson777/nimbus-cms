import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import {
  fetchQuizByArticleSlug,
  submitQuiz,
  getUserQuizStatus,
} from "../services/quizService";
import { logger } from "../lib/logger";

export const quizRouter = Router();

// Rate limit quiz submissions to prevent brute-force answer guessing
const quizSubmitLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // 10 attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    const userId = (req as any).user?.id;
    return userId || req.ip || "unknown";
  },
  message: { error: "Too many quiz submissions. Please wait before trying again." },
});

// ==========================================
// GET /api/v1/content/articles/:slug/quiz
// Fetch quiz for an article (no correct answers)
// ==========================================
quizRouter.get("/articles/:slug/quiz", async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = (req as any).user?.id; // Optional - from JWT middleware

    const quiz = await fetchQuizByArticleSlug(slug, userId);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found or not available" });
    }

    res.set("Cache-Control", "private, max-age=60");
    res.json(quiz);
  } catch (error) {
    logger.error("Error fetching quiz", { error, slug: req.params.slug });
    res.status(500).json({ error: "Failed to fetch quiz" });
  }
});

// ==========================================
// POST /api/v1/quizzes/:quizId/submit
// Submit quiz answers and receive score
// ==========================================
const submitSchema = z.object({
  answers: z.array(
    z.object({
      _key: z.string(),
      selectedIndex: z.number().int().min(0),
    })
  ),
});

quizRouter.post(
  "/quizzes/:quizId/submit",
  quizSubmitLimiter,
  async (req, res) => {
    try {
      // Require authentication
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { quizId } = req.params;

      // Validate request body
      const parseResult = submitSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid submission format",
          details: parseResult.error.issues,
        });
      }

      const result = await submitQuiz(quizId, userId, parseResult.data);

      // Return appropriate status
      if (result.alreadyRewarded && result.pointsAwarded === 0) {
        // Idempotent response for already-rewarded quiz
        return res.status(200).json({
          ...result,
          message: "Quiz already completed and rewarded",
        });
      }

      res.json(result);
    } catch (error: any) {
      logger.error("Error submitting quiz", {
        error: error.message,
        quizId: req.params.quizId,
        userId: (req as any).user?.id,
      });

      if (error.message === "Quiz not found") {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === "Maximum attempts exceeded") {
        return res.status(403).json({ error: error.message });
      }
      if (error.message?.includes("not available") || error.message?.includes("not published")) {
        return res.status(403).json({ error: error.message });
      }

      res.status(500).json({ error: "Failed to submit quiz" });
    }
  }
);

// ==========================================
// GET /api/v1/quizzes/:quizId/status
// Get user's quiz attempt status
// ==========================================
quizRouter.get("/quizzes/:quizId/status", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { quizId } = req.params;
    const status = await getUserQuizStatus(userId, quizId);

    if (!status) {
      return res.json({
        attemptCount: 0,
        passed: false,
        locked: false,
        alreadyRewarded: false,
      });
    }

    res.json(status);
  } catch (error) {
    logger.error("Error fetching quiz status", {
      error,
      quizId: req.params.quizId,
    });
    res.status(500).json({ error: "Failed to fetch quiz status" });
  }
});

export default quizRouter;
