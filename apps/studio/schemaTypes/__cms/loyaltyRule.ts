import { defineField, defineType } from "sanity";

export default defineType({
  name: "loyaltyRule",
  title: "Loyalty Earning Rule",
  type: "document",
  fields: [
    defineField({
      name: "type",
      type: "string",
      options: {
        list: [
          { title: "Per Dollar Spent", value: "dollar" },
          { title: "Per Product", value: "product" },
          { title: "Per Order", value: "order" },
          { title: "Greenhouse Quiz", value: "quiz" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "points",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({ name: "productId", type: "string" }),
    defineField({ name: "quizId", type: "string" }),
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
