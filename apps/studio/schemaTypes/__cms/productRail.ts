import { defineField, defineType } from "sanity";

export default defineType({
  name: "productRail",
  type: "document",
  title: "Product Rail",
  description:
    "Horizontal product carousels on the mobile home screen. Each rail can be CMS-curated or hydrated by the backend at serve-time.",
  orderings: [
    {
      title: "Position",
      name: "position",
      by: [{ field: "position", direction: "asc" as const }],
    },
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: 'Rail header, e.g. "Staff Picks 🔥"',
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: "subtitle",
      type: "string",
      title: "Subtitle",
      description: "Optional tagline beneath the title",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "strategy",
      type: "string",
      title: "Strategy",
      description: "Determines how this rail is populated",
      validation: (Rule) => Rule.required(),
      options: {
        list: [
          { title: "For You (behavioral)", value: "for_you" },
          { title: "Trending", value: "trending" },
          { title: "Limited Drop", value: "limited_drop" },
          { title: "Top Rated", value: "top_rated" },
          { title: "Because You Bought", value: "because_you_bought" },
          { title: "Staff Picks", value: "staff_picks" },
          { title: "Members Only", value: "members_only" },
          { title: "New Arrivals", value: "new_arrivals" },
          { title: "Seasonal", value: "seasonal" },
          { title: "High Value", value: "high_value" },
          { title: "Custom", value: "custom" },
        ],
      },
    }),
    defineField({
      name: "source",
      type: "string",
      title: "Data Source",
      description:
        "cms = operator picks items here; behavioral/system = backend hydrates at serve-time; fallback = shown when others fail",
      validation: (Rule) => Rule.required(),
      options: {
        list: [
          { title: "CMS (manual picks)", value: "cms" },
          { title: "Behavioral (per-user)", value: "behavioral" },
          { title: "System (algorithmic)", value: "system" },
          { title: "Fallback", value: "fallback" },
        ],
      },
      initialValue: "cms",
    }),
    defineField({
      name: "position",
      type: "number",
      title: "Display Order",
      description: "Lower numbers appear higher on screen",
      validation: (Rule) => Rule.required().integer().min(0),
      initialValue: 0,
    }),
    defineField({
      name: "icon",
      type: "string",
      title: "Icon",
      description: "Emoji or lucide icon name (e.g. 🔥 or flame)",
    }),
    defineField({
      name: "ctaLink",
      type: "string",
      title: "CTA Link",
      description:
        '"See All" deep-link. Category slug, screen shortcut, or full URL',
    }),
    defineField({
      name: "visible",
      type: "boolean",
      title: "Visible",
      description: "Hide without deleting",
      initialValue: true,
    }),
    defineField({
      name: "scheduleStart",
      type: "datetime",
      title: "Schedule Start",
      description: "Show rail only after this time (leave empty for always)",
    }),
    defineField({
      name: "scheduleEnd",
      type: "datetime",
      title: "Schedule End",
      description: "Hide rail after this time (leave empty for never)",
    }),
    defineField({
      name: "audience",
      type: "array",
      title: "Audience (Loyalty Tiers)",
      description:
        "Restrict to specific loyalty tiers. Leave empty to show to everyone.",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Standard", value: "standard" },
          { title: "Silver", value: "silver" },
          { title: "Gold", value: "gold" },
          { title: "Platinum", value: "platinum" },
          { title: "Employee", value: "employee" },
        ],
      },
    }),
    defineField({
      name: "storeIds",
      type: "array",
      title: "Store Scope",
      description:
        "Limit to specific store IDs. Leave empty to show at all stores.",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "items",
      type: "array",
      title: "Products",
      description:
        "For CMS-sourced rails, drag products here. For behavioral/system rails, leave empty — backend hydrates at serve-time.",
      of: [
        {
          type: "object",
          name: "railItem",
          title: "Rail Item",
          fields: [
            defineField({
              name: "product",
              type: "reference",
              title: "Product",
              to: [{ type: "product" }],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "badge",
              type: "string",
              title: "Badge",
              description: 'Optional badge text, e.g. "Staff Pick", "NEW"',
            }),
            defineField({
              name: "badgeColor",
              type: "string",
              title: "Badge Color",
              description: "Hex color for the badge background",
              validation: (Rule) =>
                Rule.custom((val) => {
                  if (!val) return true;
                  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)
                    ? true
                    : "Must be a hex color like #RRGGBB";
                }),
            }),
            defineField({
              name: "reason",
              type: "string",
              title: "Reason",
              description:
                'Personalization reason, e.g. "Because you love Indica"',
            }),
          ],
          preview: {
            select: {
              title: "product.name",
              subtitle: "badge",
              media: "product.image",
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      strategy: "strategy",
      source: "source",
      position: "position",
      visible: "visible",
    },
    prepare({ title, strategy, source, position, visible }) {
      const vis = visible === false ? " [HIDDEN]" : "";
      return {
        title: `${title || "Untitled Rail"}${vis}`,
        subtitle: `#${position ?? "?"} · ${strategy ?? "?"} · ${source ?? "?"}`,
      };
    },
  },
});
