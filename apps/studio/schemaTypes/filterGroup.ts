import { defineType, defineField } from "sanity";

/**
 * FilterGroup Schema - UI/UX Presentation
 * 
 * PURPOSE: Defines filter facets for product browsing (Effects, Brand, THC%, Price).
 * Purely presentational - controls how filters appear in the UI.
 * 
 * Contract:
 * - `key` is the stable identifier used by frontend filtering logic
 * - Display fields (title, icon, color) control visual presentation
 * - `filterType` determines the UI widget (checkbox, range, select)
 * - `displayOrder` controls sort order in filter panel
 */
export default defineType({
  name: "filterGroup",
  title: "Filter Group",
  type: "document",
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "display", title: "Display" },
    { name: "behavior", title: "Behavior" },
    { name: "targeting", title: "Targeting" },
  ],
  fields: [
    // === IDENTITY GROUP ===
    defineField({
      name: "key",
      title: "Filter Key",
      type: "string",
      group: "identity",
      description: "Stable identifier for frontend filtering (e.g., 'effects', 'thcPercent', 'priceRange')",
      validation: (Rule) =>
        Rule.required().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
          name: "valid key",
          invert: false,
        }),
    }),
    defineField({
      name: "title",
      title: "Display Title",
      type: "string",
      group: "identity",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      group: "identity",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      group: "identity",
      rows: 2,
    }),

    // === DISPLAY GROUP ===
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      group: "display",
      description: "Icon name from icon library (e.g., 'filter-circle', 'tag')",
    }),
    defineField({
      name: "iconEmoji",
      title: "Icon Emoji",
      type: "string",
      group: "display",
      description: "Fallback emoji (e.g., 🎯, 💰, 🌿)",
    }),
    defineField({
      name: "color",
      title: "Accent Color",
      type: "string",
      group: "display",
      description: "Hex color for filter header (e.g., #6366F1)",
      validation: (Rule) =>
        Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
          name: "hex color",
          invert: false,
        }),
    }),
    defineField({
      name: "displayOrder",
      title: "Display Order",
      type: "number",
      group: "display",
      description: "Sort order in filter panel (lower = first)",
      initialValue: 0,
    }),
    defineField({
      name: "isCollapsible",
      title: "Collapsible",
      type: "boolean",
      group: "display",
      description: "Can user collapse this filter group?",
      initialValue: true,
    }),
    defineField({
      name: "defaultCollapsed",
      title: "Default Collapsed",
      type: "boolean",
      group: "display",
      description: "Start collapsed on page load?",
      initialValue: false,
    }),
    defineField({
      name: "showCount",
      title: "Show Count",
      type: "boolean",
      group: "display",
      description: "Show number of matching products per option?",
      initialValue: true,
    }),

    // === BEHAVIOR GROUP ===
    defineField({
      name: "filterType",
      title: "Filter Type",
      type: "string",
      group: "behavior",
      options: {
        list: [
          { title: "Checkbox (multi-select)", value: "checkbox" },
          { title: "Radio (single-select)", value: "radio" },
          { title: "Range Slider", value: "range" },
          { title: "Dropdown", value: "select" },
          { title: "Toggle (on/off)", value: "toggle" },
          { title: "Tag Cloud", value: "tags" },
        ],
      },
      initialValue: "checkbox",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "rangeConfig",
      title: "Range Config",
      type: "object",
      group: "behavior",
      hidden: ({ parent }) => parent?.filterType !== "range",
      fields: [
        { name: "min", type: "number", title: "Minimum Value" },
        { name: "max", type: "number", title: "Maximum Value" },
        { name: "step", type: "number", title: "Step Increment" },
        { name: "unit", type: "string", title: "Unit Label", description: "e.g., '%', '$', 'mg'" },
      ],
    }),
    defineField({
      name: "options",
      title: "Static Options",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "value", type: "string", title: "Value" },
            { name: "label", type: "string", title: "Label" },
            { name: "icon", type: "string", title: "Icon (optional)" },
          ],
        },
      ],
      group: "behavior",
      description: "Static options for checkbox/radio/select types",
    }),
    defineField({
      name: "dynamicSource",
      title: "Dynamic Source",
      type: "string",
      group: "behavior",
      description: "API endpoint or data source for dynamic options (optional)",
    }),
    defineField({
      name: "multiSelect",
      title: "Multi-Select",
      type: "boolean",
      group: "behavior",
      description: "Allow multiple selections?",
      initialValue: true,
    }),
    defineField({
      name: "searchable",
      title: "Searchable",
      type: "boolean",
      group: "behavior",
      description: "Show search box for long option lists?",
      initialValue: false,
    }),
    defineField({
      name: "maxVisible",
      title: "Max Visible Options",
      type: "number",
      group: "behavior",
      description: "Show 'See more' after this many options",
      initialValue: 5,
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
        ],
      },
    }),
    defineField({
      name: "isActive",
      type: "boolean",
      title: "Active",
      group: "identity",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
      key: "key",
      filterType: "filterType",
      active: "isActive",
    },
    prepare({ title, key, filterType, active }) {
      const status = active ? "🟢" : "⚪";
      const typeIcon =
        filterType === "checkbox" ? "☑️" :
        filterType === "radio" ? "🔘" :
        filterType === "range" ? "📊" :
        filterType === "select" ? "📋" :
        filterType === "toggle" ? "🔀" : "🏷️";
      return {
        title: `${status} ${title}`,
        subtitle: `${typeIcon} ${filterType || "checkbox"} • Key: ${key || "NOT SET"}`,
      };
    },
  },
});
