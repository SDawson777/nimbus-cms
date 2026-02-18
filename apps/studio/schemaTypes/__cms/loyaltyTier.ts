import { defineField, defineType } from "sanity";

export default defineType({
  name: "loyaltyTier",
  title: "Loyalty Tier",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "minPoints",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "multiplier",
      type: "number",
      description: "Point multiplier (1.0 = base)",
      initialValue: 1,
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({ name: "icon", type: "image" }),
    defineField({ name: "color", type: "string" }),
    defineField({ name: "active", type: "boolean", initialValue: true }),
    defineField({
      name: "enabled",
      type: "boolean",
      title: "Enabled",
      initialValue: true,
    }),
    defineField({ name: "startDate", type: "datetime", title: "Start Date" }),
    defineField({ name: "endDate", type: "datetime", title: "End Date" }),
    defineField({
      name: "schedule",
      type: "object",
      title: "Advanced Schedule",
      fields: [
        { name: "startAt", type: "datetime", title: "Start At" },
        { name: "endAt", type: "datetime", title: "End At" },
      ],
    }),
    defineField({
      name: "legalVersion",
      type: "string",
      title: "Legal Version",
      initialValue: "v1",
    }),
    defineField({
      name: "organization",
      type: "reference",
      to: [{ type: "organization" }],
    }),
    defineField({ name: "brand", type: "reference", to: [{ type: "brand" }] }),
    defineField({
      name: "stores",
      type: "array",
      of: [{ type: "reference", to: [{ type: "store" }] }],
    }),
  ],
});
