import { defineField, defineType } from "sanity";

export default defineType({
  name: "product",
  type: "document",
  title: "Product",
  fields: [
    defineField({ name: "name", type: "string", title: "Name" }),
    defineField({ name: "description", type: "text", title: "Description" }),
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      options: { source: "name", maxLength: 96 },
    }),
    defineField({ name: "price", type: "number", title: "Price" }),
    defineField({
      name: "compareAtPrice",
      type: "number",
      title: "Compare at price",
    }),
    defineField({ name: "thcPercent", type: "number", title: "THC %" }),
    defineField({ name: "cbdPercent", type: "number", title: "CBD %" }),
    defineField({ name: "strainType", type: "string", title: "Strain type" }),
    defineField({ name: "weight", type: "string", title: "Weight" }),
    defineField({
      name: "effects",
      type: "array",
      of: [{ type: "string" }],
      title: "Effects",
    }),
    defineField({
      name: "productType",
      type: "reference",
      title: "Product Type",
      to: [{ type: "productType" }],
    }),
    // Multi-tenant fields (optional)
    defineField({
      name: "brand",
      type: "reference",
      title: "Brand",
      to: [{ type: "brand" }],
    }),
    defineField({
      name: "stores",
      type: "array",
      title: "Store overrides",
      of: [{ type: "reference", to: [{ type: "store" }] }],
    }),
    defineField({
      name: "availability",
      type: "string",
      title: "Availability",
    }),
    defineField({
      name: "inStock",
      type: "boolean",
      title: "In stock",
      initialValue: true,
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Image",
      options: { hotspot: true },
    }),
    defineField({
      name: "images",
      type: "array",
      title: "Gallery images",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "variants",
      type: "array",
      title: "Variants",
      of: [
        {
          type: "object",
          fields: [
            { name: "name", type: "string", title: "Name" },
            { name: "price", type: "number", title: "Price" },
            { name: "thcPercent", type: "number", title: "THC %" },
            { name: "cbdPercent", type: "number", title: "CBD %" },
            { name: "sku", type: "string", title: "SKU" },
            { name: "inStock", type: "boolean", title: "In stock" },
          ],
        },
      ],
    }),
    defineField({
      name: "popularity",
      type: "number",
      title: "Popularity score",
      description: "Higher means more popular",
    }),
    // Channels this product is available on
    defineField({
      name: "channels",
      type: "array",
      title: "Channels",
      of: [{ type: "string" }],
      options: { list: ["mobile", "web", "kiosk", "email", "ads"] },
    }),
    // Recall flags for retail operations
    defineField({
      name: "isRecalled",
      type: "boolean",
      title: "Recalled?",
      initialValue: false,
    }),
    defineField({
      name: "recallReason",
      type: "string",
      title: "Recall Reason (optional)",
    }),
  ],
  preview: {
    select: { title: "name", media: "image" },
  },
});
