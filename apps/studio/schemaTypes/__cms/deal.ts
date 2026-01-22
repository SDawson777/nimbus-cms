import { defineField, defineType } from "sanity";

/**
 * Deal Schema - Business Intent (Discounts, Promotions, Rewards)
 * 
 * PURPOSE: Represents a commercial offer with targeting rules.
 * NOT for visual placement (use Banner for that).
 * 
 * Contract:
 * - Deals have business logic (discount type, value, conditions)
 * - Deals can reference Prisma Coupons for redemption tracking
 * - Targeting rules determine who sees the deal (brand/store/state)
 * - Display metadata (title, description, badge) for rendering
 */
export default defineType({
  name: "deal",
  type: "document",
  title: "Deal",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "business", title: "Business Rules" },
    { name: "schedule", title: "Schedule" },
    { name: "targeting", title: "Targeting" },
  ],
  fields: [
    // === CONTENT GROUP ===
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      options: { source: "title", maxLength: 96 },
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      type: "array",
      title: "Description",
      of: [{ type: "block" }],
      group: "content",
    }),
    defineField({
      name: "shortDescription",
      type: "string",
      title: "Short Description",
      group: "content",
      description: "One-liner for cards and badges (max 80 chars)",
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Deal Image",
      group: "content",
      options: { hotspot: true },
    }),
    defineField({
      name: "badgeText",
      type: "string",
      title: "Badge Text",
      group: "content",
      description: "Short label for UI badges (e.g., '20% OFF', 'BOGO')",
    }),
    defineField({
      name: "badgeColor",
      type: "string",
      title: "Badge Color",
      group: "content",
      options: {
        list: [
          { title: "Green (Success)", value: "green" },
          { title: "Red (Urgent)", value: "red" },
          { title: "Blue (Info)", value: "blue" },
          { title: "Yellow (Warning)", value: "yellow" },
          { title: "Purple (Premium)", value: "purple" },
        ],
      },
      initialValue: "green",
    }),

    // === BUSINESS RULES GROUP ===
    defineField({
      name: "dealType",
      type: "string",
      title: "Deal Type",
      group: "business",
      options: {
        list: [
          { title: "Percentage Discount", value: "percentage" },
          { title: "Fixed Amount Off", value: "fixed" },
          { title: "Buy One Get One", value: "bogo" },
          { title: "Free Item", value: "freeItem" },
          { title: "Bundle", value: "bundle" },
          { title: "Loyalty Multiplier", value: "loyaltyMultiplier" },
          { title: "First-Time Buyer", value: "firstTime" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "discountValue",
      type: "number",
      title: "Discount Value",
      group: "business",
      description: "Percentage (0.1 = 10%) or fixed dollar amount",
    }),
    defineField({
      name: "minPurchase",
      type: "number",
      title: "Minimum Purchase",
      group: "business",
      description: "Minimum order value to qualify (optional)",
    }),
    defineField({
      name: "maxDiscount",
      type: "number",
      title: "Maximum Discount",
      group: "business",
      description: "Cap on total discount (optional)",
    }),
    defineField({
      name: "couponId",
      type: "string",
      title: "Prisma Coupon ID",
      group: "business",
      description: "Reference to Coupon record in database for redemption tracking",
    }),
    defineField({
      name: "couponCode",
      type: "string",
      title: "Coupon Code",
      group: "business",
      description: "User-facing code (e.g., SAVE20)",
    }),
    defineField({
      name: "applicableCategories",
      type: "array",
      title: "Applicable Categories",
      of: [{ type: "string" }],
      group: "business",
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
      name: "applicableProducts",
      type: "array",
      title: "Applicable Products",
      of: [{ type: "reference", to: [{ type: "product" }] }],
      group: "business",
      description: "Limit to specific products (optional)",
    }),
    defineField({
      name: "stackable",
      type: "boolean",
      title: "Stackable",
      group: "business",
      initialValue: false,
      description: "Can combine with other deals?",
    }),
    defineField({
      name: "usageLimit",
      type: "number",
      title: "Usage Limit",
      group: "business",
      description: "Max total redemptions (leave empty for unlimited)",
    }),
    defineField({
      name: "perUserLimit",
      type: "number",
      title: "Per-User Limit",
      group: "business",
      description: "Max uses per customer",
      initialValue: 1,
    }),

    // === SCHEDULE GROUP ===
    defineField({
      name: "startDate",
      type: "datetime",
      title: "Start Date",
      group: "schedule",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "endDate",
      type: "datetime",
      title: "End Date",
      group: "schedule",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "schedule",
      type: "object",
      title: "Advanced Schedule",
      group: "schedule",
      fields: [
        {
          name: "publishAt",
          type: "datetime",
          title: "Publish At",
          description: "When to make visible (can be before startDate)",
        },
        {
          name: "unpublishAt",
          type: "datetime",
          title: "Unpublish At",
          description: "When to hide (can be after endDate)",
        },
        {
          name: "daysOfWeek",
          type: "array",
          title: "Days of Week",
          of: [{ type: "string" }],
          options: {
            list: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
          },
          description: "Limit to specific days (e.g., Weekend Special)",
        },
        {
          name: "hoursStart",
          type: "number",
          title: "Hours Start (0-23)",
          description: "Happy hour start time",
        },
        {
          name: "hoursEnd",
          type: "number",
          title: "Hours End (0-23)",
          description: "Happy hour end time",
        },
      ],
    }),
    defineField({
      name: "isActive",
      type: "boolean",
      title: "Active",
      group: "schedule",
      initialValue: true,
    }),

    // === TARGETING GROUP (MULTI-TENANT) ===
    defineField({
      name: "brand",
      type: "reference",
      title: "Brand",
      to: [{ type: "brand" }],
      group: "targeting",
      description: "Limit to specific brand",
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
          { title: "Email", value: "email" },
          { title: "Ads", value: "ads" },
        ],
      },
    }),
    defineField({
      name: "customerSegments",
      type: "array",
      title: "Customer Segments",
      of: [{ type: "string" }],
      group: "targeting",
      options: {
        list: [
          { title: "All Customers", value: "all" },
          { title: "New Customers", value: "new" },
          { title: "Returning Customers", value: "returning" },
          { title: "VIP / Loyalty", value: "vip" },
          { title: "Lapsed (30+ days)", value: "lapsed" },
        ],
      },
    }),
    defineField({
      name: "tags",
      type: "array",
      title: "Tags",
      of: [{ type: "string" }],
      group: "content",
      description: "Internal tags for filtering/searching",
    }),
    defineField({
      name: "reason",
      type: "string",
      title: "Reason Text",
      group: "content",
      description: "Why this deal exists (e.g., 'Holiday Special', '420 Sale')",
    }),
  ],
  preview: {
    select: {
      title: "title",
      dealType: "dealType",
      value: "discountValue",
      active: "isActive",
      media: "image",
    },
    prepare({ title, dealType, value, active, media }) {
      const status = active ? "🟢" : "⚪";
      const discount = dealType === "percentage" && value ? `${value * 100}% off` : dealType || "";
      return {
        title: `${status} ${title}`,
        subtitle: discount,
        media,
      };
    },
  },
});
