#!/usr/bin/env npx tsx
/**
 * Sanity Quiz Seeder
 *
 * Seeds a demo article and quiz to Sanity for buyer demonstration.
 * Requires SANITY_WRITE_TOKEN environment variable.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=xxx npx tsx scripts/seedSanityQuiz.ts
 */

import { createClient } from "@sanity/client";

const SANITY_PROJECT_ID =
  process.env.SANITY_PROJECT_ID ||
  process.env.SANITY_STUDIO_PROJECT_ID ||
  "ygbu28p2";

const SANITY_DATASET =
  process.env.SANITY_DATASET ||
  process.env.SANITY_STUDIO_DATASET ||
  process.env.SANITY_DATASET_DEFAULT ||
  "nimbus_demo";

const SANITY_TOKEN =
  process.env.SANITY_WRITE_TOKEN ||
  process.env.SANITY_API_TOKEN ||
  process.env.SANITY_TOKEN;

if (!SANITY_TOKEN) {
  console.error("❌ Missing SANITY_WRITE_TOKEN environment variable");
  process.exit(1);
}

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: SANITY_TOKEN,
  useCdn: false,
});

// Demo Article: Intro to Terpenes
const DEMO_ARTICLE_ID = "article-intro-to-terpenes";
const demoArticle = {
  _id: DEMO_ARTICLE_ID,
  _type: "article",
  title: "Introduction to Terpenes: The Aromatic Compounds of Cannabis",
  slug: { _type: "slug", current: "intro-to-terpenes" },
  excerpt:
    "Discover the fascinating world of terpenes – the aromatic compounds that give cannabis its distinctive flavors and contribute to its therapeutic effects.",
  authorName: "Nimbus Education Team",
  publishedAt: new Date().toISOString(),
  body: [
    {
      _type: "block",
      _key: "intro1",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "span1",
          text: "Terpenes are aromatic compounds found in many plants, including cannabis. They are responsible for the distinctive smells and flavors of different cannabis strains, from the citrusy aroma of Lemon Haze to the earthy notes of OG Kush.",
        },
      ],
    },
    {
      _type: "block",
      _key: "intro2",
      style: "h2",
      children: [
        {
          _type: "span",
          _key: "span2",
          text: "What Are Terpenes?",
        },
      ],
    },
    {
      _type: "block",
      _key: "intro3",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "span3",
          text: "Terpenes are organic hydrocarbons produced by the resin glands of cannabis plants. Over 200 different terpenes have been identified in cannabis, though only a handful are present in significant concentrations. These compounds serve various purposes in nature, from deterring herbivores to attracting pollinators.",
        },
      ],
    },
    {
      _type: "block",
      _key: "intro4",
      style: "h2",
      children: [
        {
          _type: "span",
          _key: "span4",
          text: "Common Cannabis Terpenes",
        },
      ],
    },
    {
      _type: "block",
      _key: "intro5",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "span5",
          text: "Myrcene: The most common terpene in cannabis, myrcene has an earthy, musky aroma with hints of cloves. It's also found in mangoes, lemongrass, and hops. Myrcene is believed to have relaxing properties.",
        },
      ],
    },
    {
      _type: "block",
      _key: "intro6",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "span6",
          text: "Limonene: As the name suggests, limonene has a strong citrus aroma. It's found in lemon rinds, orange peels, and juniper. This terpene is associated with elevated mood and stress relief.",
        },
      ],
    },
    {
      _type: "block",
      _key: "intro7",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "span7",
          text: "Pinene: The most common terpene in nature, pinene smells like pine needles. It's found in pine trees, rosemary, and basil. Pinene may support alertness and memory retention.",
        },
      ],
    },
    {
      _type: "block",
      _key: "intro8",
      style: "h2",
      children: [
        {
          _type: "span",
          _key: "span8",
          text: "The Entourage Effect",
        },
      ],
    },
    {
      _type: "block",
      _key: "intro9",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "span9",
          text: "Scientists believe that terpenes work synergistically with cannabinoids like THC and CBD in what's called the 'entourage effect.' This theory suggests that the therapeutic benefits of cannabis are enhanced when its various compounds work together rather than in isolation.",
        },
      ],
    },
  ],
};

// Demo Quiz: Terpenes Knowledge Check
const DEMO_QUIZ_ID = "quiz-intro-to-terpenes";
const now = new Date();
const startAt = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Yesterday
const endAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

const demoQuiz = {
  _id: DEMO_QUIZ_ID,
  _type: "quiz",
  title: "Terpenes Knowledge Check",
  slug: { _type: "slug", current: "terpenes-quiz" },
  description:
    "Test your knowledge about cannabis terpenes! Complete this quiz to earn loyalty points.",
  articleRef: { _type: "reference", _ref: DEMO_ARTICLE_ID },
  passThreshold: 0.7, // 70% to pass (5 out of 7 correct)
  pointsReward: 100,
  maxAttempts: null, // Unlimited until pass
  startAt: startAt.toISOString(),
  endAt: endAt.toISOString(),
  isPublished: true,
  randomizeQuestions: false,
  randomizeOptions: false,
  showExplanations: true,
  questions: [
    {
      _type: "question",
      _key: "q1",
      prompt: "What are terpenes?",
      options: [
        "Synthetic additives used in cannabis products",
        "Aromatic compounds found in many plants including cannabis",
        "A type of cannabinoid similar to THC",
        "Chemicals added during cultivation",
      ],
      correctIndex: 1,
      explanation:
        "Terpenes are naturally occurring aromatic compounds found in many plants, including cannabis. They're responsible for the distinctive smells and flavors of different strains.",
    },
    {
      _type: "question",
      _key: "q2",
      prompt: "Which terpene is the most common in cannabis?",
      options: ["Limonene", "Pinene", "Myrcene", "Linalool"],
      correctIndex: 2,
      explanation:
        "Myrcene is the most abundant terpene in cannabis, known for its earthy, musky aroma with hints of cloves.",
    },
    {
      _type: "question",
      _key: "q3",
      prompt: "What does limonene smell like?",
      options: ["Pine needles", "Lavender", "Citrus", "Pepper"],
      correctIndex: 2,
      explanation:
        "Limonene has a strong citrus aroma and is also found in lemon rinds and orange peels.",
    },
    {
      _type: "question",
      _key: "q4",
      prompt: "Where is pinene commonly found in nature?",
      options: [
        "Only in cannabis plants",
        "In citrus fruits",
        "In pine trees, rosemary, and basil",
        "In tropical flowers",
      ],
      correctIndex: 2,
      explanation:
        "Pinene is the most common terpene in nature and is found in pine trees, rosemary, basil, and many other plants.",
    },
    {
      _type: "question",
      _key: "q5",
      prompt: "What is the 'entourage effect'?",
      options: [
        "The social aspect of cannabis consumption",
        "The synergistic interaction between terpenes and cannabinoids",
        "The after-effects of cannabis use",
        "A marketing term with no scientific basis",
      ],
      correctIndex: 1,
      explanation:
        "The entourage effect is the theory that cannabis compounds work better together than in isolation, with terpenes enhancing the therapeutic benefits of cannabinoids.",
    },
    {
      _type: "question",
      _key: "q6",
      prompt: "How many different terpenes have been identified in cannabis?",
      options: [
        "About 10",
        "Around 50",
        "Over 200",
        "Exactly 100",
      ],
      correctIndex: 2,
      explanation:
        "Over 200 different terpenes have been identified in cannabis, though only a handful are present in significant concentrations in any given strain.",
    },
    {
      _type: "question",
      _key: "q7",
      prompt: "What is one potential benefit associated with limonene?",
      options: [
        "Sedation and sleep",
        "Elevated mood and stress relief",
        "Increased appetite",
        "Pain relief",
      ],
      correctIndex: 1,
      explanation:
        "Limonene is associated with elevated mood and stress relief. It's being studied for potential anti-anxiety and antidepressant properties.",
    },
  ],
};

async function seedQuizData() {
  console.log("🌱 Seeding Sanity quiz data...");
  console.log(`   Project: ${SANITY_PROJECT_ID}`);
  console.log(`   Dataset: ${SANITY_DATASET}`);

  try {
    // Create or update the demo article
    console.log("\n📝 Upserting demo article...");
    await client.createOrReplace(demoArticle);
    console.log(`   ✅ Article created: ${demoArticle.title}`);
    console.log(`      Slug: ${demoArticle.slug.current}`);

    // Create or update the demo quiz
    console.log("\n📝 Upserting demo quiz...");
    await client.createOrReplace(demoQuiz);
    console.log(`   ✅ Quiz created: ${demoQuiz.title}`);
    console.log(`      Points reward: ${demoQuiz.pointsReward}`);
    console.log(`      Pass threshold: ${demoQuiz.passThreshold * 100}%`);
    console.log(`      Questions: ${demoQuiz.questions.length}`);
    console.log(`      Active: ${startAt.toISOString()} - ${endAt.toISOString()}`);

    console.log("\n✅ Sanity quiz seed complete!");
    console.log("\n📱 Test endpoints:");
    console.log(
      `   GET  /api/v1/content/articles/intro-to-terpenes/quiz`
    );
    console.log(`   POST /api/v1/quizzes/${DEMO_QUIZ_ID}/submit`);
  } catch (error) {
    console.error("❌ Error seeding quiz data:", error);
    process.exit(1);
  }
}

seedQuizData();
