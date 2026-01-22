/**
 * Fix quiz documents to set isPublished = true
 */
import { createClient } from "@sanity/client";

const projectId = "ygbu28p2";
const dataset = "nimbus_demo";
const token = process.env.SANITY_WRITE_TOKEN;

if (!token) {
  console.error("Missing SANITY_WRITE_TOKEN");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  useCdn: false,
  apiVersion: "2024-01-01",
});

async function fixQuizzes() {
  console.log("🔧 Fixing quiz isPublished flags...\n");

  const quizzes = await client.fetch('*[_type == "quiz"]{_id, title, isPublished}');
  console.log(`Found ${quizzes.length} quizzes to update`);

  for (const quiz of quizzes) {
    if (quiz.isPublished !== true) {
      await client.patch(quiz._id).set({ isPublished: true }).commit();
      console.log(`✅ Published: ${quiz.title}`);
    } else {
      console.log(`⏭️ Already published: ${quiz.title}`);
    }
  }

  // Verify
  const updated = await client.fetch('*[_type == "quiz"]{_id, title, isPublished, pointsReward, passThreshold}');
  console.log("\n📋 Final quiz status:");
  updated.forEach((q: any) => {
    console.log(`  - ${q.title}: published=${q.isPublished}, ${q.pointsReward} pts, ${q.passThreshold * 100}% to pass`);
  });

  console.log("\n✅ Quiz fix complete!");
}

fixQuizzes().catch(console.error);
