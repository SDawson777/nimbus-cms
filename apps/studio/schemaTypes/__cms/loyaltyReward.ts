import { defineField, defineType } from "sanity";

export default defineType({
  name: "loyaltyReward",
  title: "Loyalty Reward",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "description", type: "text" }),
    defineField({
      name: "costPoints",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "rewardType",
      type: "string",
      options: {
        list: [
          { title: "Dollar Off", value: "dollar_off" },
          { title: "Percent Off", value: "percent_off" },
          { title: "Free Product", value: "free_product" },
          { title: "Gear", value: "gear" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "discountValue", type: "number" }),
    defineField({
      name: "tierRequired",
      type: "reference",
      to: [{ type: "loyaltyTier" }],
    }),
    defineField({ name: "image", type: "image" }),
    defineField({ name: "active", type: "boolean", initialValue: true }),
    defineField({
      name: "enabled",
      type: "boolean",
      title: "Enabled",
      initialValue: true,
    }),
    defineField({ name: "startDate", type: "datetime" }),
    defineField({ name: "endDate", type: "datetime" }),
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
