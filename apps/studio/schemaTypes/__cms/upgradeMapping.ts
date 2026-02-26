import { defineField, defineType } from "sanity";

/**
 * Upgrade Mapping
 *
 * "Popular Upgrade" anchoring strategy:
 * When a user selects a specific product, show a premium alternative
 * alongside the original so the higher price is anchored against
 * what they already chose.
 *
 * Example:
 *   source = $25 eighth Blue Dream  →  upgrade = $35 premium eighth Gelato #41
 *   label  = "Popular Upgrade"
 */
export default defineType({
  name: "upgradeMapping",
  type: "document",
  title: "Upgrade Mapping",
  description:
    '"Popular Upgrade" positioning. Map a product to a premium alternative to increase average order size.',
  fields: [
    defineField({
      name: "sourceProduct",
      type: "reference",
      title: "Source Product",
      to: [{ type: "product" }],
      description: "The product the customer selected or is viewing.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "upgradeProduct",
      type: "reference",
      title: "Upgrade Product",
      to: [{ type: "product" }],
      description:
        "The premium alternative to show as an upgrade option.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "label",
      type: "string",
      title: "Upgrade Label",
      description:
        'Badge / chip text, e.g. "Popular Upgrade", "Go Premium", "Best Value"',
      initialValue: "Popular Upgrade",
      validation: (Rule) => Rule.required().max(30),
    }),
    defineField({
      name: "labelColor",
      type: "string",
      title: "Label Color",
      description: "Hex color for the label badge",
      initialValue: "#FFD700",
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
      title: "Upgrade Reason",
      description:
        'Persuasion copy shown below, e.g. "Higher potency, smoother taste"',
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "savingsNote",
      type: "string",
      title: "Savings / Value Note",
      description:
        'Optional value anchor, e.g. "Only $10 more for 2× potency"',
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "priority",
      type: "number",
      title: "Priority",
      description:
        "When multiple upgrades exist for one product, highest priority wins.",
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
      srcName: "sourceProduct.name",
      upgName: "upgradeProduct.name",
      label: "label",
      active: "active",
    },
    prepare({ srcName, upgName, label, active }) {
      return {
        title: `${active === false ? "[OFF] " : ""}${srcName || "?"} → ${upgName || "?"}`,
        subtitle: label || "Popular Upgrade",
      };
    },
  },
});
