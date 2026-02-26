import { defineField, defineType } from "sanity";

/**
 * Cross-Sell Rule
 *
 * "Complete Your Session" logic:
 * When a cart contains products from the **trigger category**, surface the
 * listed companion products.  The mobile app renders these BELOW the cart
 * items under a CMS-controlled heading.
 *
 * Examples:
 *   trigger = Flower  → companions = lighter, rolling tray, grinder
 *   trigger = Edible  → companions = beverage, sleep tincture
 */
export default defineType({
  name: "crossSellRule",
  type: "document",
  title: "Cross-Sell Rule",
  description:
    'Pair trigger categories with companion products to increase average cart spend ("Complete Your Session").',
  fields: [
    defineField({
      name: "name",
      type: "string",
      title: "Rule Name",
      description: 'Internal label, e.g. "Flower → Accessories Pairing"',
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: "triggerCategory",
      type: "reference",
      title: "Trigger Category",
      to: [{ type: "productType" }],
      description:
        "When the cart contains a product of this type, surface the companions below.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "heading",
      type: "string",
      title: "Section Heading",
      description:
        'Displayed above the companions, e.g. "Complete Your Session"',
      initialValue: "Complete Your Session",
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: "subheading",
      type: "string",
      title: "Sub-heading",
      description: 'E.g. "Pairs perfectly with your flower"',
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "companions",
      type: "array",
      title: "Companion Products",
      description:
        "Ordered list of products to feature. Shown in price-anchor order (mid → premium → value) by the API.",
      of: [
        {
          type: "object",
          name: "companionItem",
          title: "Companion",
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
              description: '"Essential", "Pairs Well", "Add-On"',
            }),
            defineField({
              name: "badgeColor",
              type: "string",
              title: "Badge Color",
              description: "Hex color, e.g. #FFD700",
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
            select: {
              title: "product.name",
              subtitle: "badge",
              media: "product.image",
            },
          },
        },
      ],
      validation: (Rule) => Rule.min(1).max(8),
    }),
    defineField({
      name: "priority",
      type: "number",
      title: "Priority",
      description:
        "When multiple rules match, the highest-priority rule wins. Higher = more important.",
      initialValue: 0,
      validation: (Rule) => Rule.integer(),
    }),
    defineField({
      name: "active",
      type: "boolean",
      title: "Active",
      initialValue: true,
    }),
    defineField({
      name: "brand",
      type: "reference",
      title: "Brand (White-Label Owner)",
      to: [{ type: "brand" }],
      description: "Scope to a brand. Leave empty for global.",
    }),
  ],
  preview: {
    select: {
      title: "name",
      triggerCat: "triggerCategory.name",
      active: "active",
    },
    prepare({ title, triggerCat, active }) {
      return {
        title: `${active === false ? "[OFF] " : ""}${title || "Untitled Rule"}`,
        subtitle: `Trigger: ${triggerCat || "?"}`,
      };
    },
  },
});
