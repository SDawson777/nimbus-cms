import { defineType, defineField } from "sanity";

/**
 * EffectTag Schema - Product Effect Metadata
 * 
 * PURPOSE: Tags products with effects/feelings (Relaxed, Energetic, Creative, etc.)
 * Used for personalization, search boosting, and recommendation explainability.
 * 
 * Contract:
 * - `key` is the stable identifier used by recommendation engine
 * - `boostWeight` influences search/recommendation scoring
 * - `relatedTags` enables effect clustering for "You might also like"
 * - Display fields (title, icon, color) for UI presentation
 */
export default defineType({
  name: "effectTag",
  title: "Effect Tag",
  type: "document",
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "display", title: "Display" },
    { name: "recommendation", title: "Recommendation" },
    { name: "targeting", title: "Targeting" },
  ],
  fields: [
    // === IDENTITY GROUP ===
    defineField({
      name: "key",
      title: "Effect Key",
      type: "string",
      group: "identity",
      description: "Stable identifier for recommendation engine (e.g., 'relaxed', 'energetic', 'creative')",
      validation: (Rule) =>
        Rule.required().regex(/^[a-z][a-z0-9_]*$/, {
          name: "lowercase key",
          invert: false,
        }),
    }),
    defineField({
      name: "title",
      title: "Display Title",
      type: "string",
      group: "identity",
      description: "User-facing name (e.g., 'Relaxed', 'Energetic')",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      group: "identity",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      group: "identity",
      rows: 2,
      description: "Explain this effect to users",
    }),

    // === DISPLAY GROUP ===
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      group: "display",
      description: "Icon name from icon library (e.g., 'sun', 'moon', 'zap')",
    }),
    defineField({
      name: "iconEmoji",
      title: "Icon Emoji",
      type: "string",
      group: "display",
      description: "Fallback emoji (e.g., 😌, ⚡, 🎨, 😴)",
    }),
    defineField({
      name: "color",
      title: "Tag Color",
      type: "string",
      group: "display",
      description: "Hex color for tag chip (e.g., #22C55E for green)",
      validation: (Rule) =>
        Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
          name: "hex color",
          invert: false,
        }),
    }),
    defineField({
      name: "backgroundColor",
      title: "Background Color",
      type: "string",
      group: "display",
      description: "Light background for tag chip (e.g., #DCFCE7)",
      validation: (Rule) =>
        Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
          name: "hex color",
          invert: false,
        }),
    }),
    defineField({
      name: "displayOrder",
      title: "Display Order",
      type: "number",
      group: "display",
      description: "Sort order in effect lists (lower = first)",
      initialValue: 0,
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      group: "display",
      description: "Show prominently in filters?",
      initialValue: false,
    }),
    defineField({
      name: "image",
      title: "Illustration",
      type: "image",
      group: "display",
      description: "Optional illustration for effect page",
      options: { hotspot: true },
    }),

    // === RECOMMENDATION GROUP ===
    defineField({
      name: "boostWeight",
      title: "Boost Weight",
      type: "number",
      group: "recommendation",
      description: "Influences search/recommendation scoring (0-10, higher = more weight)",
      initialValue: 5,
      validation: (Rule) => Rule.min(0).max(10),
    }),
    defineField({
      name: "relatedTags",
      title: "Related Effects",
      type: "array",
      of: [{ type: "reference", to: [{ type: "effectTag" }] }],
      group: "recommendation",
      description: "Effects often experienced together (for 'You might also like')",
    }),
    defineField({
      name: "oppositeTag",
      title: "Opposite Effect",
      type: "reference",
      to: [{ type: "effectTag" }],
      group: "recommendation",
      description: "Mutually exclusive effect (e.g., Energetic ↔ Sleepy)",
    }),
    defineField({
      name: "category",
      title: "Effect Category",
      type: "string",
      group: "recommendation",
      options: {
        list: [
          { title: "Mind", value: "mind" },
          { title: "Body", value: "body" },
          { title: "Mood", value: "mood" },
          { title: "Medical", value: "medical" },
          { title: "Activity", value: "activity" },
        ],
      },
      description: "Grouping for recommendation clustering",
    }),
    defineField({
      name: "intensity",
      title: "Typical Intensity",
      type: "string",
      group: "recommendation",
      options: {
        list: [
          { title: "Subtle", value: "subtle" },
          { title: "Moderate", value: "moderate" },
          { title: "Strong", value: "strong" },
        ],
      },
    }),
    defineField({
      name: "searchTerms",
      title: "Search Terms",
      type: "array",
      of: [{ type: "string" }],
      group: "recommendation",
      description: "Alternative words users might search (e.g., 'chill', 'calm' for Relaxed)",
    }),

    // === TARGETING GROUP (MULTI-TENANT) ===
    defineField({
      name: "brand",
      type: "reference",
      title: "Brand",
      to: [{ type: "brand" }],
      group: "targeting",
      description: "Limit to specific brand",
    }),
    defineField({
      name: "stores",
      type: "array",
      title: "Stores",
      of: [{ type: "reference", to: [{ type: "store" }] }],
      group: "targeting",
    }),
    defineField({
      name: "channels",
      type: "array",
      title: "Channels",
      of: [{ type: "string" }],
      group: "targeting",
      options: {
        list: [
          { title: "Mobile App", value: "mobile" },
          { title: "Web", value: "web" },
          { title: "Kiosk", value: "kiosk" },
        ],
      },
    }),
    defineField({
      name: "isActive",
      type: "boolean",
      title: "Active",
      group: "identity",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
      key: "key",
      emoji: "iconEmoji",
      color: "color",
      weight: "boostWeight",
      active: "isActive",
    },
    prepare({ title, key, emoji, color, weight, active }) {
      const status = active ? "🟢" : "⚪";
      const icon = emoji || "🏷️";
      const weightDisplay = weight !== undefined ? `⚖️${weight}` : "";
      return {
        title: `${status} ${icon} ${title}`,
        subtitle: `Key: ${key || "NOT SET"} ${weightDisplay}`,
      };
    },
  },
});
