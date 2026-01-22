import { defineField, defineType } from "sanity";

/**
 * Legal Document Schema - Enterprise Grade
 * 
 * CRITICAL: This schema supports legal defensibility for compliance audits.
 * Every version is immutable once published. Use `supersedes` to chain versions.
 * 
 * Query pattern for current effective doc:
 * *[_type=="legalDoc" && type==$type && stateCode==$state && isPublished==true 
 *   && effectiveFrom <= now() && (!defined(effectiveTo) || effectiveTo > now())]
 *   | order(effectiveFrom desc)[0]
 */
export default defineType({
  name: "legalDoc",
  type: "document",
  title: "Legal Document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "versioning", title: "Versioning & Compliance" },
    { name: "targeting", title: "Targeting & Scope" },
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
      name: "type",
      title: "Document Type",
      type: "string",
      group: "content",
      options: {
        list: [
          { title: "Terms of Service", value: "terms" },
          { title: "Privacy Policy", value: "privacy" },
          { title: "Accessibility Statement", value: "accessibility" },
          { title: "Age Gate / Verification", value: "ageGate" },
          { title: "Disclaimer", value: "disclaimer" },
          { title: "HIPAA Notice", value: "hipaa" },
          { title: "Return Policy", value: "returns" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "body",
      type: "array",
      title: "Body",
      group: "content",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "summary",
      type: "text",
      title: "Plain Language Summary",
      description: "Brief summary for user-facing display (optional)",
      group: "content",
      rows: 3,
    }),

    // === VERSIONING GROUP (NON-NEGOTIABLE FOR COMPLIANCE) ===
    defineField({
      name: "version",
      title: "Version",
      type: "string",
      group: "versioning",
      description: "Semantic version (e.g., 1.0.0, 2.1.0)",
      validation: (Rule) => Rule.required().regex(/^\d+\.\d+(\.\d+)?$/, {
        name: "semver",
        invert: false,
      }).error("Must be semver format: X.Y or X.Y.Z"),
    }),
    defineField({
      name: "effectiveFrom",
      title: "Effective From",
      type: "datetime",
      group: "versioning",
      description: "When this version becomes legally binding",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "effectiveTo",
      title: "Effective To",
      type: "datetime",
      group: "versioning",
      description: "When this version expires (usually set when superseded)",
    }),
    defineField({
      name: "supersedes",
      title: "Supersedes",
      type: "reference",
      to: [{ type: "legalDoc" }],
      group: "versioning",
      description: "Reference to the prior version this document replaces",
    }),
    defineField({
      name: "requiresReacceptance",
      title: "Requires Re-acceptance",
      type: "boolean",
      group: "versioning",
      initialValue: false,
      description: "If true, users must re-accept this version (material change)",
    }),
    defineField({
      name: "isPublished",
      title: "Published",
      type: "boolean",
      group: "versioning",
      initialValue: false,
      description: "Only published docs are served to users",
    }),
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
      group: "versioning",
      description: "Timestamp when this doc was published (immutable after set)",
    }),
    defineField({
      name: "approvedBy",
      title: "Approved By",
      type: "string",
      group: "versioning",
      description: "Legal reviewer who approved this version",
    }),
    defineField({
      name: "changeLog",
      title: "Change Log",
      type: "text",
      group: "versioning",
      description: "Summary of changes from prior version (for audit trail)",
    }),

    // === TARGETING GROUP (MULTI-TENANT SCOPING) ===
    defineField({
      name: "brand",
      type: "reference",
      title: "Brand",
      to: [{ type: "brand" }],
      group: "targeting",
      description: "If set, applies only to this brand. Otherwise global.",
    }),
    defineField({
      name: "stores",
      type: "array",
      title: "Store Overrides",
      of: [{ type: "reference", to: [{ type: "store" }] }],
      group: "targeting",
      description: "If set, applies only to these specific stores",
    }),
    defineField({
      name: "stateCode",
      title: "State/Jurisdiction",
      type: "string",
      group: "targeting",
      description: "Two-letter state code (e.g., MI, CA, AZ) for jurisdiction-specific docs",
      options: {
        list: [
          "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
          "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
          "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
          "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
          "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
        ],
      },
    }),
    defineField({
      name: "locale",
      title: "Locale",
      type: "string",
      group: "targeting",
      initialValue: "en-US",
      description: "Language/region code for localization",
      options: {
        list: ["en-US", "es-US", "fr-CA", "en-CA"],
      },
    }),
    defineField({
      name: "channels",
      type: "array",
      title: "Channels",
      of: [{ type: "string" }],
      group: "targeting",
      description: "Which platforms this doc applies to. Empty = all channels.",
      options: {
        list: [
          { title: "Mobile App", value: "mobile" },
          { title: "Web", value: "web" },
          { title: "In-Store Kiosk", value: "kiosk" },
          { title: "Admin Portal", value: "admin" },
          { title: "Email", value: "email" },
        ],
      },
    }),
    defineField({
      name: "notes",
      title: "Internal Notes",
      type: "text",
      group: "content",
      description: "Internal notes (not displayed to users)",
    }),
  ],
  preview: {
    select: {
      title: "title",
      version: "version",
      type: "type",
      state: "stateCode",
      published: "isPublished",
    },
    prepare({ title, version, type, state, published }) {
      const status = published ? "✅" : "📝";
      const jurisdiction = state ? ` (${state})` : "";
      return {
        title: `${status} ${title}`,
        subtitle: `v${version || "?"} · ${type || "?"}${jurisdiction}`,
      };
    },
  },
  orderings: [
    {
      title: "Effective Date (Newest)",
      name: "effectiveDateDesc",
      by: [{ field: "effectiveFrom", direction: "desc" }],
    },
    {
      title: "Version (Newest)",
      name: "versionDesc",
      by: [{ field: "version", direction: "desc" }],
    },
  ],
});
