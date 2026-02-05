import { defineField, defineType } from "sanity";

export default defineType({
  name: "article",
  type: "document",
  title: "Article",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "metadata", title: "Metadata" },
    { name: "educational", title: "Educational" },
    { name: "distribution", title: "Distribution" },
  ],
  fields: [
    // === CONTENT GROUP ===
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      group: "content",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "excerpt",
      type: "text",
      title: "Short Excerpt",
      group: "content",
      rows: 3,
      description: "Brief preview text shown in article lists"
    }),
    defineField({
      name: "body",
      type: "array",
      title: "Body",
      group: "content",
      of: [{ type: "block" }, { type: "image" }],
    }),
    defineField({
      name: "mainImage",
      type: "image",
      title: "Thumbnail Image",
      group: "content",
      options: { hotspot: true },
    }),

    // === METADATA GROUP ===
    defineField({
      name: "publishedAt",
      type: "datetime",
      title: "Published Date",
      group: "metadata",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "category",
      type: "reference",
      group: "metadata",
      to: [{ type: "category" }],
      title: "Category",
    }),
    defineField({
      name: "author",
      type: "reference",
      group: "metadata",
      to: [{ type: "author" }],
      title: "Author",
    }),
    defineField({
      name: "readingTime",
      type: "string",
      group: "metadata",
      title: "Reading Time",
      description: "e.g., '5 min read'"
    }),
    defineField({
      name: "tags",
      type: "array",
      group: "metadata",
      title: "Tags",
      of: [{ type: "string" }],
    }),

    // === EDUCATIONAL GROUP ===
    defineField({
      name: "points",
      type: "number",
      group: "educational",
      title: "Learning Points",
      description: "Points awarded to user for completing this article (default: 10)",
      initialValue: 10,
      validation: (Rule) => Rule.min(0).max(500),
    }),
    defineField({
      name: "viewCount",
      type: "number",
      group: "educational",
      title: "View Count",
      description: "Automatically incremented when users view the article",
      readOnly: true,
      initialValue: 0,
    }),
    defineField({
      name: "difficulty",
      type: "string",
      group: "educational",
      title: "Difficulty Level",
      description: "Article complexity level for filtering",
      options: {
        list: [
          { title: "Beginner", value: "beginner" },
          { title: "Intermediate", value: "intermediate" },
          { title: "Advanced", value: "advanced" },
        ]
      }
    }),
    defineField({
      name: "estimatedCompletionTime",
      type: "number",
      group: "educational",
      title: "Estimated Completion Time (minutes)",
      description: "How long the article should take to read/complete",
      validation: (Rule) => Rule.min(1),
    }),

    // === DISTRIBUTION GROUP ===
    defineField({
      name: "channels",
      type: "array",
      group: "distribution",
      title: "Channels",
      description: "Where this article is distributed (mobile, web, kiosk, email, ads)",
      of: [{ type: "string" }],
      options: { list: ["mobile", "web", "kiosk", "email", "ads"] },
    }),
    defineField({
      name: "schedule",
      type: "object",
      group: "distribution",
      title: "Publishing Schedule",
      description: "Optional scheduling for retail operations",
      fields: [
        { name: "publishAt", type: "datetime", title: "Publish At (optional)" },
        {
          name: "unpublishAt",
          type: "datetime",
          title: "Unpublish At (optional)",
        },
        {
          name: "isScheduled",
          type: "boolean",
          title: "Is Scheduled?",
          initialValue: false,
        },
      ],
    }),
    defineField({
      name: "variants",
      type: "array",
      group: "distribution",
      title: "A/B Variants",
      description: "Optional content variations for A/B testing",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "variantKey",
              type: "string",
              title: "Variant Key (A/B/...)",
            },
            { name: "title", type: "string", title: "Title override" },
            { name: "excerpt", type: "text", title: "Excerpt override" },
            {
              name: "body",
              type: "array",
              title: "Body override",
              of: [{ type: "block" }, { type: "image" }],
            },
          ],
        },
      ],
    }),
    defineField({
      name: "brand",
      type: "reference",
      group: "distribution",
      title: "Brand",
      description: "Optional tenant/brand scoping",
      to: [{ type: "brand" }],
    }),
    defineField({
      name: "stores",
      type: "array",
      group: "distribution",
      title: "Store Overrides",
      description: "Optional store-specific content",
      of: [{ type: "reference", to: [{ type: "store" }] }],
    }),
    defineField({
      name: "published",
      type: "boolean",
      group: "distribution",
      title: "Published?",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "title", media: "mainImage" },
  },
});
