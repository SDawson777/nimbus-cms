import { defineField, defineType } from "sanity";

export default defineType({
  name: "promo",
  type: "document",
  title: "Promo",
  fields: [
    defineField({ name: "title", type: "string", title: "Title" }),
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      options: { source: "title", maxLength: 96 },
    }),
    defineField({
      name: "code",
      type: "string",
      title: "Promo Code (optional)",
    }),
    defineField({
      name: "promoCode",
      type: "string",
      title: "Promo Code (canonical)",
      description: "Preferred promo code field. Legacy `code` is still supported.",
    }),
    defineField({
      name: "discountType",
      type: "string",
      title: "Discount Type",
      options: {
        list: [
          { title: "% Off", value: "percent_off" },
          { title: "$ Off", value: "amount_off" },
          { title: "BOGO", value: "bogo" },
          { title: "Free Item", value: "free_item" },
          { title: "Bundle", value: "bundle" },
        ],
      },
      initialValue: "percent_off",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "discount",
      type: "number",
      title: "Discount (decimal, e.g. 0.1 for 10%)",
    }),
    defineField({
      name: "discountValue",
      type: "number",
      title: "Discount Value",
      description: "Numeric value for discount type (e.g. 10 for 10% or $10)",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "applicationType",
      type: "string",
      title: "Application Type",
      options: {
        list: [
          { title: "Auto Apply", value: "auto" },
          { title: "Requires Promo Code", value: "code" },
        ],
      },
      initialValue: "auto",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "autoApply",
      type: "boolean",
      title: "Auto Apply",
      description: "When enabled, promo applies without entering a code",
      initialValue: true,
    }),
    defineField({
      name: "description",
      type: "array",
      title: "Description",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Image",
      options: { hotspot: true },
    }),
    // Channels this promo is targeted to
    defineField({
      name: "channels",
      type: "array",
      title: "Channels",
      of: [{ type: "string" }],
      options: { list: ["mobile", "web", "kiosk", "email", "ads"] },
    }),
    // Scheduling for operational control over promo visibility
    defineField({
      name: "schedule",
      type: "object",
      title: "Schedule",
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
    // Optional tenant scoping
    defineField({
      name: "brand",
      type: "reference",
      title: "Brand",
      to: [{ type: "brand" }],
    }),
    defineField({
      name: "stores",
      type: "array",
      title: "Stores",
      of: [{ type: "reference", to: [{ type: "store" }] }],
    }),
    defineField({
      name: "categories",
      type: "array",
      title: "Promo Categories",
      description: "Optional category filters for promo targeting",
      of: [{ type: "reference", to: [{ type: "category" }] }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "applicableCategories",
      type: "array",
      title: "Applicable Categories (legacy)",
      description: "Optional legacy category keys for compatibility",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Flower", value: "Flower" },
          { title: "Edibles", value: "Edibles" },
          { title: "Vape", value: "Vape" },
          { title: "Concentrate", value: "Concentrate" },
          { title: "Topical", value: "Topical" },
          { title: "Accessories", value: "Gear" },
          { title: "All Categories", value: "all" },
        ],
      },
    }),
    defineField({
      name: "active",
      type: "boolean",
      title: "Active?",
      initialValue: true,
    }),
  ],
  preview: { select: { title: "title", media: "image" } },
});
