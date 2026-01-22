import { defineField, defineType } from "sanity";

/**
 * Category Schema - Conceptual Taxonomy
 * 
 * PURPOSE: Represents product taxonomy (Flower, Edibles, Vape, etc.)
 * Maps 1:1 with Prisma ProductCategory enum for stable database binding.
 * 
 * Contract:
 * - `key` is the stable identifier that maps to Prisma enum
 * - Display fields (title, description, icon) are purely presentational
 * - Multi-tenant scoping allows per-brand/store category customization
 */

// Match Prisma ProductCategory enum exactly
const PRODUCT_CATEGORIES = [
  { title: "Flower", value: "Flower" },
  { title: "Edibles", value: "Edibles" },
  { title: "Vape", value: "Vape" },
  { title: "Concentrate", value: "Concentrate" },
  { title: "Topical", value: "Topical" },
  { title: "Tincture", value: "Tincture" },
  { title: "Pre-Roll", value: "PreRoll" },
  { title: "Accessories / Gear", value: "Gear" },
  { title: "Other", value: "Other" },
] as const;

export default defineType({
  name: "category",
  type: "document",
  title: "Category",
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "display", title: "Display" },
    { name: "targeting", title: "Targeting" },
  ],
  fields: [
    // === IDENTITY GROUP ===
    defineField({
      name: "key",
      type: "string",
      title: "Category Key",
      group: "identity",
      description: "Stable identifier matching Prisma ProductCategory enum",
      options: {
        list: PRODUCT_CATEGORIES,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Display Name",
      group: "identity",
      description: "User-facing name (can differ from key)",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      options: { source: "title", maxLength: 96 },
      group: "identity",
      validation: (Rule) => Rule.required(),
    }),

    // === DISPLAY GROUP ===
    defineField({
      name: "description",
      type: "text",
      title: "Description",
      group: "display",
      rows: 3,
    }),
    defineField({
      name: "shortDescription",
      type: "string",
      title: "Short Description",
      group: "display",
      description: "One-liner for tooltips/cards (max 100 chars)",
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: "icon",
      type: "image",
      title: "Icon Image",
      group: "display",
      options: { hotspot: true },
    }),
    defineField({
      name: "iconEmoji",
      type: "string",
      title: "Icon Emoji",
      group: "display",
      description: "Fallback emoji if no image (e.g., 🌿, 🍪, 💨)",
    }),
    defineField({
      name: "color",
      type: "string",
      title: "Brand Color",
      group: "display",
      description: "Hex color for UI theming (e.g., #22C55E)",
      validation: (Rule) =>
        Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
          name: "hex color",
          invert: false,
        }),
    }),
    defineField({
      name: "displayOrder",
      type: "number",
      title: "Display Order",
      group: "display",
      description: "Sort order in menus (lower = first)",
      initialValue: 0,
    }),
    defineField({
      name: "featured",
      type: "boolean",
      title: "Featured",
      group: "display",
      description: "Show prominently on homepage?",
      initialValue: false,
    }),
    defineField({
      name: "heroImage",
      type: "image",
      title: "Hero Image",
      group: "display",
      description: "Large banner for category page header",
      options: { hotspot: true },
    }),

    // === TARGETING GROUP (MULTI-TENANT) ===
    defineField({
      name: "brand",
      type: "reference",
      title: "Brand",
      to: [{ type: "brand" }],
      group: "targeting",
      description: "Limit to specific brand (for brand-specific labeling)",
    }),
    defineField({
      name: "stores",
      type: "array",
      title: "Stores",
      of: [{ type: "reference", to: [{ type: "store" }] }],
      group: "targeting",
      description: "Limit to specific stores",
    }),
    defineField({
      name: "stateCode",
      type: "string",
      title: "State",
      group: "targeting",
      description: "State-specific naming (e.g., CO may use different terms)",
    }),
    defineField({
      name: "locale",
      type: "string",
      title: "Locale",
      group: "targeting",
      initialValue: "en-US",
      options: { list: ["en-US", "es-US", "fr-CA", "en-CA"] },
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
      active: "isActive",
      media: "icon",
    },
    prepare({ title, key, active, media }) {
      const status = active ? "🟢" : "⚪";
      return {
        title: `${status} ${title}`,
        subtitle: `Key: ${key || "NOT SET"}`,
        media,
      };
    },
  },
});
