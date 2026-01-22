import { fetchCMS } from "../lib/cms";
import getPrisma from "../lib/prisma";
import { logger } from "../lib/logger";
import { QuizAttemptStatus } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface SanityQuizQuestion {
  _key: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface SanityQuiz {
  _id: string;
  title: string;
  slug?: { current: string };
  description?: string;
  articleRef?: { _id: string; slug?: { current: string } };
  coverImage?: { asset?: { url: string } };
  questions: SanityQuizQuestion[];
  passThreshold: number;
  pointsReward: number;
  maxAttempts?: number;
  startAt?: string;
  endAt?: string;
  isPublished: boolean;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  showExplanations?: boolean;
  timeLimit?: number;
}

export interface QuizForClient {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  questions: {
    _key: string;
    prompt: string;
    options: string[];
    // NO correctIndex - never sent to client
  }[];
  passThreshold: number;
  pointsReward: number;
  maxAttempts?: number;
  timeLimit?: number;
  showExplanations: boolean;
  // User attempt status
  attemptStatus: {
    attemptCount: number;
    passed: boolean;
    locked: boolean;
    remainingAttempts: number | null; // null = unlimited
    alreadyRewarded: boolean;
  };
}

export interface QuizSubmission {
  answers: { _key: string; selectedIndex: number }[];
}

export interface QuizSubmitResult {
  passed: boolean;
  score: number;
  correctCount: number;
  totalQuestions: number;
  pointsAwarded: number;
  locked: boolean;
  alreadyRewarded: boolean;
  explanations?: { _key: string; correct: boolean; explanation?: string }[];
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function isQuizActive(quiz: SanityQuiz): { active: boolean; reason?: string } {
  if (!quiz.isPublished) {
    return { active: false, reason: "Quiz is not published" };
  }
  const now = new Date();
  if (quiz.startAt && new Date(quiz.startAt) > now) {
    return { active: false, reason: "Quiz has not started yet" };
  }
  if (quiz.endAt && new Date(quiz.endAt) < now) {
    return { active: false, reason: "Quiz has expired" };
  }
  return { active: true };
}

// ==========================================
// FETCH QUIZ BY ARTICLE SLUG
// ==========================================

export async function fetchQuizByArticleSlug(
  articleSlug: string,
  userId?: string
): Promise<QuizForClient | null> {
  const prisma = getPrisma();

  // Fetch quiz linked to article
  const quiz = await fetchCMS<SanityQuiz | null>(
    `*[_type == "quiz" && (
      articleRef->slug.current == $slug ||
      articleRef._ref in *[_type in ["article", "greenhouseArticle"] && slug.current == $slug]._id
    )][0]{
      _id,
      title,
      "slug": slug.current,
      description,
      "coverImage": coverImage.asset->url,
      questions[]{
        _key,
        prompt,
        options,
        correctIndex,
        explanation
      },
      passThreshold,
      pointsReward,
      maxAttempts,
      startAt,
      endAt,
      isPublished,
      randomizeQuestions,
      randomizeOptions,
      showExplanations,
      timeLimit
    }`,
    { slug: articleSlug }
  );

  if (!quiz) {
    return null;
  }

  // Check if quiz is active
  const { active, reason } = isQuizActive(quiz);
  if (!active) {
    logger.info("Quiz not active", { quizId: quiz._id, reason });
    return null;
  }

  // Get user's attempt status
  let attemptStatus = {
    attemptCount: 0,
    passed: false,
    locked: false,
    remainingAttempts: quiz.maxAttempts ?? null,
    alreadyRewarded: false,
  };

  if (userId) {
    const [attempt, reward] = await Promise.all([
      prisma.quizAttempt.findUnique({
        where: { userId_quizId: { userId, quizId: quiz._id } },
      }),
      prisma.quizReward.findUnique({
        where: { userId_quizId: { userId, quizId: quiz._id } },
      }),
    ]);

    if (attempt) {
      attemptStatus.attemptCount = attempt.attemptCount;
      attemptStatus.passed = attempt.status === "passed";
      attemptStatus.locked = attempt.locked;
      if (quiz.maxAttempts) {
        attemptStatus.remainingAttempts = Math.max(
          0,
          quiz.maxAttempts - attempt.attemptCount
        );
      }
    }

    attemptStatus.alreadyRewarded = !!reward;
  }

  // Prepare questions for client (NO correctIndex)
  let clientQuestions = quiz.questions.map((q) => ({
    _key: q._key,
    prompt: q.prompt,
    options: quiz.randomizeOptions ? shuffleArray(q.options) : q.options,
  }));

  if (quiz.randomizeQuestions) {
    clientQuestions = shuffleArray(clientQuestions);
  }

  return {
    id: quiz._id,
    title: quiz.title,
    description: quiz.description,
    coverImage: quiz.coverImage?.asset?.url,
    questions: clientQuestions,
    passThreshold: quiz.passThreshold,
    pointsReward: quiz.pointsReward,
    maxAttempts: quiz.maxAttempts,
    timeLimit: quiz.timeLimit,
    showExplanations: quiz.showExplanations ?? true,
    attemptStatus,
  };
}

// ==========================================
// FETCH QUIZ BY ID (for submission)
// ==========================================

export async function fetchQuizById(quizId: string): Promise<SanityQuiz | null> {
  return fetchCMS<SanityQuiz | null>(
    `*[_type == "quiz" && _id == $quizId][0]{
      _id,
      title,
      "slug": slug.current,
      description,
      questions[]{
        _key,
        prompt,
        options,
        correctIndex,
        explanation
      },
      passThreshold,
      pointsReward,
      maxAttempts,
      startAt,
      endAt,
      isPublished,
      showExplanations
    }`,
    { quizId }
  );
}

// ==========================================
// SUBMIT QUIZ AND SCORE
// ==========================================

export async function submitQuiz(
  quizId: string,
  userId: string,
  submission: QuizSubmission
): Promise<QuizSubmitResult> {
  const prisma = getPrisma();

  // Fetch quiz with correct answers
  const quiz = await fetchQuizById(quizId);
  if (!quiz) {
    throw new Error("Quiz not found");
  }

  // Check if quiz is active
  const { active, reason } = isQuizActive(quiz);
  if (!active) {
    throw new Error(reason || "Quiz is not available");
  }

  // Check existing attempt
  const existingAttempt = await prisma.quizAttempt.findUnique({
    where: { userId_quizId: { userId, quizId } },
  });

  // Check if already locked (passed and rewarded)
  if (existingAttempt?.locked) {
    const existingReward = await prisma.quizReward.findUnique({
      where: { userId_quizId: { userId, quizId } },
    });
    return {
      passed: true,
      score: existingAttempt.score ?? 1,
      correctCount: quiz.questions.length,
      totalQuestions: quiz.questions.length,
      pointsAwarded: 0,
      locked: true,
      alreadyRewarded: !!existingReward,
    };
  }

  // Check max attempts
  if (quiz.maxAttempts && existingAttempt) {
    if (existingAttempt.attemptCount >= quiz.maxAttempts) {
      throw new Error("Maximum attempts exceeded");
    }
  }

  // Score the quiz
  let correctCount = 0;
  const explanations: { _key: string; correct: boolean; explanation?: string }[] = [];

  for (const question of quiz.questions) {
    const answer = submission.answers.find((a) => a._key === question._key);
    const isCorrect = answer?.selectedIndex === question.correctIndex;
    if (isCorrect) correctCount++;

    explanations.push({
      _key: question._key,
      correct: isCorrect,
      explanation: question.explanation,
    });
  }

  const totalQuestions = quiz.questions.length;
  const score = totalQuestions > 0 ? correctCount / totalQuestions : 0;
  const passed = score >= quiz.passThreshold;

  // Update or create attempt
  const newAttemptCount = (existingAttempt?.attemptCount ?? 0) + 1;
  const attemptStatus: QuizAttemptStatus = passed ? "passed" : "failed";

  const attempt = await prisma.quizAttempt.upsert({
    where: { userId_quizId: { userId, quizId } },
    create: {
      userId,
      quizId,
      attemptCount: 1,
      status: attemptStatus,
      score,
      passThreshold: quiz.passThreshold,
      locked: passed,
      passedAt: passed ? new Date() : null,
      lastAttemptAt: new Date(),
    },
    update: {
      attemptCount: newAttemptCount,
      status: attemptStatus,
      score,
      locked: passed ? true : existingAttempt?.locked ?? false,
      passedAt: passed ? new Date() : existingAttempt?.passedAt,
      lastAttemptAt: new Date(),
    },
  });

  // Award points if passed and not already rewarded
  let pointsAwarded = 0;
  let alreadyRewarded = false;

  if (passed) {
    const existingReward = await prisma.quizReward.findUnique({
      where: { userId_quizId: { userId, quizId } },
    });

    if (existingReward) {
      alreadyRewarded = true;
    } else {
      // Award points in a transaction
      pointsAwarded = quiz.pointsReward;

      await prisma.$transaction(async (tx) => {
        // Create loyalty transaction
        const loyaltyTx = await tx.loyaltyTransaction.create({
          data: {
            id: `lt-quiz-${quizId}-${userId}-${Date.now()}`,
            userId,
            type: "quiz_reward",
            amount: pointsAwarded,
            description: `Quiz completed: ${quiz.title}`,
            quizId,
          },
        });

        // Create quiz reward record
        await tx.quizReward.create({
          data: {
            userId,
            quizId,
            pointsAwarded,
            transactionId: loyaltyTx.id,
          },
        });

        // Update loyalty status points
        await tx.loyaltyStatus.updateMany({
          where: { userId },
          data: {
            points: { increment: pointsAwarded },
            lifetimePoints: { increment: pointsAwarded },
          },
        });
      });

      // Lock the attempt after successful reward
      await prisma.quizAttempt.update({
        where: { userId_quizId: { userId, quizId } },
        data: { locked: true },
      });

      logger.info("Quiz reward issued", {
        userId,
        quizId,
        pointsAwarded,
        score,
      });
    }
  }

  return {
    passed,
    score,
    correctCount,
    totalQuestions,
    pointsAwarded,
    locked: passed,
    alreadyRewarded,
    explanations: quiz.showExplanations ? explanations : undefined,
  };
}

// ==========================================
// GET USER QUIZ STATUS
// ==========================================

export async function getUserQuizStatus(
  userId: string,
  quizId: string
): Promise<{
  attemptCount: number;
  passed: boolean;
  locked: boolean;
  alreadyRewarded: boolean;
  lastScore?: number;
} | null> {
  const prisma = getPrisma();

  const [attempt, reward] = await Promise.all([
    prisma.quizAttempt.findUnique({
      where: { userId_quizId: { userId, quizId } },
    }),
    prisma.quizReward.findUnique({
      where: { userId_quizId: { userId, quizId } },
    }),
  ]);

  if (!attempt) return null;

  return {
    attemptCount: attempt.attemptCount,
    passed: attempt.status === "passed",
    locked: attempt.locked,
    alreadyRewarded: !!reward,
    lastScore: attempt.score ?? undefined,
  };
}
