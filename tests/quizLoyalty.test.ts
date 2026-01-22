/**
 * Quiz Loyalty Integration Tests
 * 
 * Tests:
 * - Quiz fetch does not include correct answers
 * - Submit requires authentication
 * - Schedule enforcement
 * - Attempt status tracking
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

// Mock fetchCMS before importing app
var fetchCMSMock: any;
vi.mock("../server/src/lib/cms", () => {
  fetchCMSMock = vi.fn();
  return { fetchCMS: fetchCMSMock };
});

// Mock Prisma
var mockPrismaClient: any;
vi.mock("../server/src/lib/prisma", () => {
  mockPrismaClient = {
    quizAttempt: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    quizReward: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    loyaltyTransaction: {
      create: vi.fn(),
    },
    loyaltyStatus: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => fn(mockPrismaClient)),
  };
  return { default: () => mockPrismaClient };
});

import app from "../server/src";

// Sample quiz data from Sanity
const sampleQuiz = {
  _id: "quiz-test-123",
  title: "Test Quiz",
  description: "A test quiz",
  questions: [
    {
      _key: "q1",
      prompt: "What is 2+2?",
      options: ["3", "4", "5", "6"],
      correctIndex: 1,
      explanation: "2+2=4",
    },
    {
      _key: "q2",
      prompt: "What color is the sky?",
      options: ["Red", "Blue", "Green"],
      correctIndex: 1,
    },
    {
      _key: "q3",
      prompt: "Capital of France?",
      options: ["London", "Paris", "Berlin", "Madrid"],
      correctIndex: 1,
    },
  ],
  passThreshold: 0.6,
  pointsReward: 100,
  isPublished: true,
  startAt: new Date(Date.now() - 86400000).toISOString(),
  endAt: new Date(Date.now() + 86400000 * 30).toISOString(),
  showExplanations: true,
};

beforeEach(() => {
  fetchCMSMock.mockReset();
  mockPrismaClient.quizAttempt.findUnique.mockReset();
  mockPrismaClient.quizAttempt.upsert.mockReset();
  mockPrismaClient.quizAttempt.update.mockReset();
  mockPrismaClient.quizReward.findUnique.mockReset();
  mockPrismaClient.quizReward.create.mockReset();
  mockPrismaClient.loyaltyTransaction.create.mockReset();
  mockPrismaClient.loyaltyStatus.updateMany.mockReset();
});

describe("GET /api/v1/content/articles/:slug/quiz - Security", () => {
  it("should NOT include correctIndex in response", async () => {
    fetchCMSMock.mockResolvedValueOnce(sampleQuiz);
    mockPrismaClient.quizAttempt.findUnique.mockResolvedValue(null);
    mockPrismaClient.quizReward.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/api/v1/content/articles/test-article/quiz");

    expect(res.status).toBe(200);
    expect(res.body.questions).toBeDefined();
    
    // CRITICAL: correctIndex must NOT be present in any question
    for (const question of res.body.questions) {
      expect(question).not.toHaveProperty("correctIndex");
    }
  });

  it("should NOT include explanations before submission", async () => {
    fetchCMSMock.mockResolvedValueOnce(sampleQuiz);
    mockPrismaClient.quizAttempt.findUnique.mockResolvedValue(null);
    mockPrismaClient.quizReward.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/api/v1/content/articles/test-article/quiz");

    expect(res.status).toBe(200);
    for (const question of res.body.questions) {
      expect(question).not.toHaveProperty("explanation");
    }
  });

  it("should include question prompt and options", async () => {
    fetchCMSMock.mockResolvedValueOnce(sampleQuiz);
    mockPrismaClient.quizAttempt.findUnique.mockResolvedValue(null);
    mockPrismaClient.quizReward.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/api/v1/content/articles/test-article/quiz");

    expect(res.status).toBe(200);
    expect(res.body.questions[0].prompt).toBe("What is 2+2?");
    expect(res.body.questions[0].options).toEqual(["3", "4", "5", "6"]);
    expect(res.body.questions[0]._key).toBe("q1");
  });
});

describe("GET /api/v1/content/articles/:slug/quiz - Schedule Enforcement", () => {
  it("should return 404 for quiz before startAt", async () => {
    const futureQuiz = {
      ...sampleQuiz,
      startAt: new Date(Date.now() + 86400000).toISOString(),
    };
    fetchCMSMock.mockResolvedValueOnce(futureQuiz);

    const res = await request(app).get("/api/v1/content/articles/future-quiz/quiz");

    expect(res.status).toBe(404);
  });

  it("should return 404 for quiz after endAt", async () => {
    const expiredQuiz = {
      ...sampleQuiz,
      endAt: new Date(Date.now() - 86400000).toISOString(),
    };
    fetchCMSMock.mockResolvedValueOnce(expiredQuiz);

    const res = await request(app).get("/api/v1/content/articles/expired-quiz/quiz");

    expect(res.status).toBe(404);
  });

  it("should return 404 for unpublished quiz", async () => {
    const unpublishedQuiz = {
      ...sampleQuiz,
      isPublished: false,
    };
    fetchCMSMock.mockResolvedValueOnce(unpublishedQuiz);

    const res = await request(app).get("/api/v1/content/articles/unpublished-quiz/quiz");

    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/content/articles/:slug/quiz - Attempt Status", () => {
  it("should include attempt status in response for unauthenticated user", async () => {
    fetchCMSMock.mockResolvedValueOnce(sampleQuiz);
    // Unauthenticated user gets default status
    mockPrismaClient.quizAttempt.findUnique.mockResolvedValue(null);
    mockPrismaClient.quizReward.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/api/v1/content/articles/test-article/quiz");

    expect(res.status).toBe(200);
    expect(res.body.attemptStatus).toBeDefined();
    // Unauthenticated users get default status (0 attempts)
    expect(res.body.attemptStatus.attemptCount).toBe(0);
    expect(res.body.attemptStatus.passed).toBe(false);
    expect(res.body.attemptStatus.locked).toBe(false);
    expect(res.body.attemptStatus.alreadyRewarded).toBe(false);
  });
});

describe("POST /api/v1/quizzes/:quizId/submit - Authentication", () => {
  it("should require authentication", async () => {
    const res = await request(app)
      .post("/api/v1/quizzes/quiz-test-123/submit")
      .send({ answers: [] });

    expect(res.status).toBe(401);
  });
});
