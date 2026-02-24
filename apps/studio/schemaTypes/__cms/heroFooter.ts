import { defineField, defineType } from "sanity";

export default defineType({
  name: "heroFooter",
  type: "document",
  title: "Hero Footer",
  description:
    "Singleton banner displayed at the bottom of the mobile home screen with a CTA link.",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: "Main heading shown on the footer banner",
      validation: (Rule) => Rule.required().max(80),
      initialValue: "Discover Something New",
    }),
    defineField({
      name: "subtitle",
      type: "string",
      title: "Subtitle",
      description: "Supporting text beneath the title",
      validation: (Rule) => Rule.max(120),
      initialValue: "Curated content handpicked for you",
    }),
    defineField({
      name: "cta",
      type: "string",
      title: "CTA Button Label",
      description: "Text shown on the call-to-action button",
      validation: (Rule) => Rule.max(30),
      initialValue: "Explore",
    }),
    defineField({
      name: "link",
      type: "string",
      title: "Link / Navigation Target",
      description:
        'Shortcut (shop, shop-all, strain-finder, terpenes, deals, loyalty) or a full https:// URL',
      validation: (Rule) => Rule.required(),
      initialValue: "shop-all",
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Background Image",
      description: "Optional background image for the footer banner",
      options: { hotspot: true },
    }),
    defineField({
      name: "backgroundColor",
      type: "string",
      title: "Background Color",
      description: "Hex background color (used when no image is set)",
      initialValue: "#2E5D46",
      validation: (Rule) =>
        Rule.custom((val) => {
          if (!val) return true;
          return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)
            ? true
            : "Must be a hex color like #RRGGBB";
        }),
    }),
    defineField({
      name: "textColor",
      type: "string",
      title: "Text Color",
      description: "Hex color for title, subtitle, and CTA text",
      initialValue: "#FFFFFF",
      validation: (Rule) =>
        Rule.custom((val) => {
          if (!val) return true;
          return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)
            ? true
            : "Must be a hex color like #RRGGBB";
        }),
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "subtitle", media: "image" },
    prepare({ title, subtitle, media }) {
      return {
        title: title || "Hero Footer",
        subtitle: subtitle || "",
        media,
      };
    },
  },
});
