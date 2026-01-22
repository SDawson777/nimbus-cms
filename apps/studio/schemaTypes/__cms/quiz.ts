import { defineField, defineType } from "sanity";

/**
 * Quiz Schema - Article-linked Quizzes with Loyalty Point Rewards
 * 
 * PURPOSE: Educational quizzes attached to articles that award loyalty points.
 * 
 * Contract:
 * - Quiz is linked to an Article via articleRef
 * - Questions contain correctIndex which is NEVER sent to mobile clients
 * - passThreshold determines minimum score percentage to pass (e.g., 0.8 = 80%)
 * - pointsReward is awarded once per user on first pass
 * - Schedule controls when quiz is available (startAt/endAt)
 * - maxAttempts limits retries (null = unlimited until pass)
 */
export default defineType({
  name: "quiz",
  type: "document",
  title: "Quiz",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "scoring", title: "Scoring & Rewards" },
    { name: "schedule", title: "Schedule" },
    { name: "settings", title: "Settings" },
  ],
  fields: [
    // === CONTENT GROUP ===
    defineField({
      name: "title",
      type: "string",
      title: "Quiz Title",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      options: { source: "title", maxLength: 96 },
      group: "content",
    }),
    defineField({
      name: "description",
      type: "text",
      title: "Description",
      group: "content",
      rows: 2,
      description: "Brief description shown before starting the quiz",
    }),
    defineField({
      name: "articleRef",
      type: "reference",
      title: "Linked Article",
      to: [{ type: "article" }, { type: "greenhouseArticle" }],
      group: "content",
      description: "Article this quiz is attached to",
    }),
    defineField({
      name: "coverImage",
      type: "image",
      title: "Cover Image",
      group: "content",
      options: { hotspot: true },
    }),

    // === QUESTIONS ARRAY ===
    defineField({
      name: "questions",
      title: "Questions",
      type: "array",
      group: "content",
      validation: (Rule) => Rule.required().min(1),
      of: [
        {
          type: "object",
          name: "question",
          title: "Question",
          fields: [
            defineField({
              name: "prompt",
              type: "string",
              title: "Question Text",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "explanation",
              type: "text",
              title: "Explanation",
              rows: 2,
              description: "Shown after answering (optional)",
            }),
            defineField({
              name: "options",
              type: "array",
              title: "Answer Options",
              of: [{ type: "string" }],
              validation: (Rule) => Rule.required().min(2).max(6),
            }),
            defineField({
              name: "correctIndex",
              type: "number",
              title: "Correct Answer Index",
              description: "0-based index of the correct option (NEVER sent to client)",
              validation: (Rule) => Rule.required().min(0),
            }),
          ],
          preview: {
            select: { title: "prompt", options: "options" },
            prepare({ title, options }) {
              return {
                title: title || "Untitled Question",
                subtitle: `${options?.length || 0} options`,
              };
            },
          },
        },
      ],
    }),

    // === SCORING & REWARDS GROUP ===
    defineField({
      name: "passThreshold",
      type: "number",
      title: "Pass Threshold",
      group: "scoring",
      description: "Minimum score to pass (0.0 - 1.0, e.g., 0.8 = 80%)",
      initialValue: 0.8,
      validation: (Rule) => Rule.required().min(0).max(1),
    }),
    defineField({
      name: "pointsReward",
      type: "number",
      title: "Points Reward",
      group: "scoring",
      description: "Loyalty points awarded on first pass",
      initialValue: 100,
      validation: (Rule) => Rule.required().min(0).integer(),
    }),
    defineField({
      name: "maxAttempts",
      type: "number",
      title: "Max Attempts",
      group: "scoring",
      description: "Maximum attempts allowed (leave empty for unlimited until pass)",
      validation: (Rule) => Rule.min(1).integer(),
    }),

    // === SCHEDULE GROUP ===
    defineField({
      name: "startAt",
      type: "datetime",
      title: "Start Date",
      group: "schedule",
      description: "When the quiz becomes available",
    }),
    defineField({
      name: "endAt",
      type: "datetime",
      title: "End Date",
      group: "schedule",
      description: "When the quiz expires",
    }),
    defineField({
      name: "isPublished",
      type: "boolean",
      title: "Published",
      group: "schedule",
      initialValue: false,
      description: "Must be true for quiz to be available",
    }),

    // === SETTINGS GROUP ===
    defineField({
      name: "randomizeQuestions",
      type: "boolean",
      title: "Randomize Questions",
      group: "settings",
      initialValue: false,
      description: "Shuffle question order for each attempt",
    }),
    defineField({
      name: "randomizeOptions",
      type: "boolean",
      title: "Randomize Options",
      group: "settings",
      initialValue: false,
      description: "Shuffle answer options for each question",
    }),
    defineField({
      name: "showExplanations",
      type: "boolean",
      title: "Show Explanations",
      group: "settings",
      initialValue: true,
      description: "Show explanations after each answer",
    }),
    defineField({
      name: "timeLimit",
      type: "number",
      title: "Time Limit (seconds)",
      group: "settings",
      description: "Optional time limit for the entire quiz",
    }),

    // === TARGETING (MULTI-TENANT) ===
    defineField({
      name: "brand",
      type: "reference",
      title: "Brand",
      to: [{ type: "brand" }],
      group: "settings",
      description: "Limit to specific brand",
    }),
    defineField({
      name: "stores",
      type: "array",
      title: "Stores",
      of: [{ type: "reference", to: [{ type: "store" }] }],
      group: "settings",
    }),
    defineField({
      name: "channels",
      type: "array",
      title: "Channels",
      of: [{ type: "string" }],
      group: "settings",
      options: {
        list: [
          { title: "Mobile App", value: "mobile" },
          { title: "Web", value: "web" },
          { title: "Kiosk", value: "kiosk" },
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: "title",
      questions: "questions",
      points: "pointsReward",
      published: "isPublished",
      media: "coverImage",
    },
    prepare({ title, questions, points, published, media }) {
      const status = published ? "🟢" : "⚪";
      const qCount = questions?.length || 0;
      return {
        title: `${status} ${title}`,
        subtitle: `${qCount} questions • ${points || 0} pts reward`,
        media,
      };
    },
  },
});
