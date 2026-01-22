import { defineField, defineType } from "sanity";

/**
 * Banner Schema - Purely Presentational
 * 
 * PURPOSE: Visual placement units for marketing/branding.
 * NOT for business logic (discounts, rewards) - use Deal for that.
 * 
 * Contract:
 * - Banners are visual containers with CTA links
 * - Placement determines where they appear (home.hero, shop.top, etc.)
 * - Schedule determines when they're visible
 * - Priority determines ordering when multiple banners target same placement
 */
export default defineType({
  name: "banner",
  type: "document",
  title: "Banner",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "placement", title: "Placement & Schedule" },
    { name: "targeting", title: "Targeting" },
  ],
  fields: [
    // === CONTENT GROUP ===
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      group: "content",
      description: "Internal name (not always displayed)",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "headline",
      type: "string",
      title: "Headline",
      group: "content",
      description: "Display headline (optional, for hero banners)",
    }),
    defineField({
      name: "subheadline",
      type: "string",
      title: "Subheadline",
      group: "content",
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Image",
      group: "content",
      options: { hotspot: true },
      fields: [
        { name: "alt", type: "string", title: "Alt Text" },
      ],
    }),
    defineField({
      name: "mobileImage",
      type: "image",
      title: "Mobile Image (optional)",
      group: "content",
      options: { hotspot: true },
      description: "Separate image for mobile viewports",
    }),
    defineField({
      name: "ctaText",
      type: "string",
      title: "CTA Text",
      group: "content",
    }),
    defineField({
      name: "ctaLink",
      type: "url",
      title: "CTA Link",
      group: "content",
      validation: (Rule) => Rule.uri({ allowRelative: true }),
    }),
    defineField({
      name: "ctaStyle",
      type: "string",
      title: "CTA Style",
      group: "content",
      options: {
        list: [
          { title: "Primary Button", value: "primary" },
          { title: "Secondary Button", value: "secondary" },
          { title: "Text Link", value: "link" },
          { title: "None (Image-only)", value: "none" },
        ],
      },
      initialValue: "primary",
    }),

    // === PLACEMENT GROUP ===
    defineField({
      name: "placement",
      type: "string",
      title: "Placement",
      group: "placement",
      description: "Where this banner appears in the UI",
      options: {
        list: [
          { title: "Home - Hero", value: "home.hero" },
          { title: "Home - Carousel", value: "home.carousel" },
          { title: "Home - Secondary", value: "home.secondary" },
          { title: "Shop - Top", value: "shop.top" },
          { title: "Shop - Sidebar", value: "shop.sidebar" },
          { title: "Category - Header", value: "category.header" },
          { title: "Cart - Upsell", value: "cart.upsell" },
          { title: "Checkout - Promo", value: "checkout.promo" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "priority",
      type: "number",
      title: "Priority",
      group: "placement",
      description: "Higher priority = shown first (0-100)",
      initialValue: 50,
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      name: "schedule",
      type: "object",
      title: "Schedule",
      group: "placement",
      fields: [
        { name: "startAt", type: "datetime", title: "Start At" },
        { name: "endAt", type: "datetime", title: "End At" },
      ],
    }),
    defineField({
      name: "active",
      type: "boolean",
      title: "Active",
      group: "placement",
      initialValue: true,
      description: "Master on/off switch",
    }),

    // === TARGETING GROUP (MULTI-TENANT) ===
    defineField({
      name: "brand",
      type: "reference",
      title: "Brand",
      to: [{ type: "brand" }],
      group: "targeting",
      description: "If set, shows only for this brand",
    }),
    defineField({
      name: "stores",
      type: "array",
      title: "Stores",
      of: [{ type: "reference", to: [{ type: "store" }] }],
      group: "targeting",
      description: "If set, shows only at these stores",
    }),
    defineField({
      name: "stateCode",
      type: "string",
      title: "State",
      group: "targeting",
      description: "Limit to specific state/jurisdiction",
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
          { title: "Admin", value: "admin" },
        ],
      },
      description: "Empty = all channels",
    }),
  ],
  preview: {
    select: {
      title: "title",
      placement: "placement",
      active: "active",
      media: "image",
    },
    prepare({ title, placement, active, media }) {
      const status = active ? "🟢" : "⚪";
      return {
        title: `${status} ${title}`,
        subtitle: placement || "No placement",
        media,
      };
    },
  },
});
