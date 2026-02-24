import { defineField, defineType } from "sanity";

export default defineType({
  name: "wayToShop",
  type: "document",
  title: "Way to Shop",
  description:
    'Tiles shown in the "Your Weed Your Way" section of the mobile home screen.',
  orderings: [
    {
      title: "Position",
      name: "position",
      by: [{ field: "position", direction: "asc" as const }],
    },
  ],
  fields: [
    defineField({
      name: "label",
      type: "string",
      title: "Label",
      description: "Short tile label (e.g. Shop Deals)",
      validation: (Rule) => Rule.required().max(30),
    }),
    defineField({
      name: "icon",
      type: "string",
      title: "Emoji Icon",
      description:
        "Single emoji character (e.g. 🏷️). Used when no image is set.",
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Tile Image",
      description:
        "96×96 recommended. Takes priority over emoji icon when set.",
      options: { hotspot: true },
    }),
    defineField({
      name: "link",
      type: "string",
      title: "Link / Filter",
      description:
        'Category slug (e.g. "deals", "edibles"), internal shortcut, or full https:// URL',
    }),
    defineField({
      name: "position",
      type: "number",
      title: "Display Order",
      description: "Lower numbers appear first",
      initialValue: 0,
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "link", media: "image" },
  },
});
