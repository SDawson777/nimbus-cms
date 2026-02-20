import { defineField, defineType } from "sanity";
import { createClient } from "@sanity/client";

// Hardcoded for Sanity-hosted Studio (env vars not available at runtime)
const studioClient = createClient({
  projectId: "ygbu28p2",
  dataset: "nimbus_demo",
  useCdn: false,
  apiVersion: "2024-08-01",
});

export default defineType({
  name: "whiteLabelConfig",
  type: "document",
  title: "White-Label Configuration",
  fields: [
    defineField({
      name: "brand",
      type: "reference",
      title: "Brand",
      to: [{ type: "brand" }],
      validation: (Rule) =>
        Rule.required().custom(async (val: any, context: any) => {
          const ref = val && (val._ref || val);
          if (!ref) return true;
          if (!studioClient) return true;
          try {
            const storeRef =
              context.document &&
              context.document.store &&
              (context.document.store._ref || context.document.store);
            if (storeRef) {
              const q =
                '*[_type=="whiteLabelConfig" && brand._ref == $ref && store._ref == $store && _id != $id][0]{_id}';
              const existing = await studioClient.fetch(q, {
                ref,
                store: storeRef,
                id: context.document._id,
              });
              return existing
                ? "A white-label config for this brand+store already exists"
                : true;
            } else {
              const q =
                '*[_type=="whiteLabelConfig" && brand._ref == $ref && !defined(store) && _id != $id][0]{_id}';
              const existing = await studioClient.fetch(q, {
                ref,
                id: context.document._id,
              });
              return existing
                ? "A brand-level white-label config already exists for this brand"
                : true;
            }
          } catch {
            return true;
          }
        }),
    }),
    defineField({
      name: "store",
      type: "reference",
      title: "Store (optional - leave empty for brand-level)",
      to: [{ type: "store" }],
      description:
        "If set, this config applies to this specific store. Otherwise, it applies to the entire brand.",
    }),
    defineField({
      name: "weatherRecommendationsWidget",
      type: "object",
      title: "Weather Recommendations Widget",
      fields: [
        // Enable + placement
        defineField({
          name: "enabled",
          type: "boolean",
          title: "Enabled",
          initialValue: false,
        }),
        defineField({
          name: "placement",
          type: "string",
          title: "Placement",
          options: {
            list: [
              { title: "Home Top", value: "home_top" },
              { title: "Home Mid", value: "home_mid" },
              { title: "Home Bottom", value: "home_bottom" },
              { title: "Hidden", value: "hidden" },
            ],
          },
          initialValue: "home_top",
        }),
        defineField({
          name: "priority",
          type: "number",
          title: "Priority (for ordering among Home modules)",
          validation: (Rule) => Rule.integer().min(0),
          initialValue: 10,
        }),
        defineField({
          name: "title",
          type: "string",
          title: "Title",
          initialValue: "Recommended for today",
        }),
        defineField({
          name: "subtitle",
          type: "string",
          title: "Subtitle (optional)",
        }),
        defineField({
          name: "ctaText",
          type: "string",
          title: "CTA Text",
          initialValue: "See all",
        }),
        defineField({
          name: "ctaRoute",
          type: "string",
          title: "CTA Route",
          initialValue: "WeatherPicks",
        }),

        // Location + units
        defineField({
          name: "locationSource",
          type: "string",
          title: "Location Source",
          options: {
            list: [
              { title: "Store Location", value: "store_location" },
              { title: "Device Location", value: "device_location" },
              { title: "Hybrid (Device with Store fallback)", value: "hybrid" },
            ],
          },
          initialValue: "hybrid",
        }),
        defineField({
          name: "units",
          type: "string",
          title: "Units",
          options: {
            list: [
              { title: "Imperial (F)", value: "imperial" },
              { title: "Metric (C)", value: "metric" },
              { title: "Inherit from Device", value: "inherit_device" },
            ],
          },
          initialValue: "inherit_device",
        }),
        defineField({
          name: "fallbackMode",
          type: "string",
          title: "Fallback Mode (when weather unavailable)",
          options: {
            list: [
              { title: "Time of Day", value: "time_of_day" },
              { title: "Top Sellers", value: "top_sellers" },
              { title: "For You (Personalized)", value: "for_you" },
            ],
          },
          initialValue: "time_of_day",
        }),

        // Visual engine
        defineField({
          name: "visualEnabled",
          type: "boolean",
          title: "Visual Effects Enabled",
          initialValue: true,
        }),
        defineField({
          name: "visualStyle",
          type: "string",
          title: "Visual Style",
          options: {
            list: [
              {
                title: "Premium Atmosphere (Apple-like)",
                value: "premium_atmosphere",
              },
              { title: "Minimal Gradient", value: "minimal_gradient" },
              { title: "Static Image", value: "static_image" },
            ],
          },
          initialValue: "premium_atmosphere",
        }),
        defineField({
          name: "motionIntensity",
          type: "number",
          title: "Motion Intensity (0-1)",
          validation: (Rule) => Rule.min(0).max(1),
          initialValue: 0.35,
        }),
        defineField({
          name: "particlesEnabled",
          type: "boolean",
          title: "Particles Enabled",
          initialValue: true,
        }),
        defineField({
          name: "parallaxEnabled",
          type: "boolean",
          title: "Parallax Enabled (battery intensive)",
          initialValue: false,
        }),
        defineField({
          name: "transitionMs",
          type: "number",
          title: "Transition Duration (ms)",
          validation: (Rule) => Rule.integer().min(0),
          initialValue: 450,
        }),
        defineField({
          name: "reducedMotionOverride",
          type: "string",
          title: "Reduced Motion Override",
          options: {
            list: [
              { title: "Follow OS", value: "follow_os" },
              { title: "Force Reduced", value: "force_reduced" },
              { title: "Force Full", value: "force_full" },
            ],
          },
          initialValue: "follow_os",
        }),
        defineField({
          name: "paletteMode",
          type: "string",
          title: "Palette Mode",
          options: {
            list: [
              { title: "Brand Tinted", value: "brand_tinted" },
              { title: "Neutral Apple-like", value: "neutral_apple_like" },
            ],
          },
          initialValue: "brand_tinted",
        }),
        defineField({
          name: "brandTintStrength",
          type: "number",
          title: "Brand Tint Strength (0-1)",
          validation: (Rule) => Rule.min(0).max(1),
          initialValue: 0.15,
        }),

        // Recommendation rules
        defineField({
          name: "maxItems",
          type: "number",
          title: "Max Items",
          validation: (Rule) => Rule.integer().min(1),
          initialValue: 6,
        }),
        defineField({
          name: "minItems",
          type: "number",
          title: "Min Items",
          validation: (Rule) => Rule.integer().min(1),
          initialValue: 3,
        }),
        defineField({
          name: "allowCategories",
          type: "array",
          title: "Allow Categories",
          of: [{ type: "string" }],
          options: {
            list: [
              { title: "Flower", value: "Flower" },
              { title: "PreRoll", value: "PreRoll" },
              { title: "Vape", value: "Vape" },
              { title: "Edibles", value: "Edibles" },
              { title: "Tincture", value: "Tincture" },
              { title: "Concentrate", value: "Concentrate" },
              { title: "Topical", value: "Topical" },
            ],
          },
        }),
        defineField({
          name: "excludeCategories",
          type: "array",
          title: "Exclude Categories",
          of: [{ type: "string" }],
          options: {
            list: [
              { title: "Flower", value: "Flower" },
              { title: "PreRoll", value: "PreRoll" },
              { title: "Vape", value: "Vape" },
              { title: "Edibles", value: "Edibles" },
              { title: "Tincture", value: "Tincture" },
              { title: "Concentrate", value: "Concentrate" },
              { title: "Topical", value: "Topical" },
            ],
          },
        }),
        defineField({
          name: "excludeTags",
          type: "array",
          title: "Exclude Tags",
          of: [{ type: "string" }],
          description: 'e.g. "highTHC", "daytimeOnly"',
        }),
        defineField({
          name: "includeTopicalsWhenCold",
          type: "boolean",
          title: "Include Topicals When Cold",
          initialValue: false,
        }),
        defineField({
          name: "includeSleepWhenSnow",
          type: "boolean",
          title: "Include Sleep Products When Snow",
          initialValue: true,
        }),
        defineField({
          name: "upliftBiasWhenSunny",
          type: "number",
          title: "Uplift Bias When Sunny (0-1)",
          validation: (Rule) => Rule.min(0).max(1),
          initialValue: 0.3,
        }),
        defineField({
          name: "relaxBiasWhenRainy",
          type: "number",
          title: "Relax Bias When Rainy (0-1)",
          validation: (Rule) => Rule.min(0).max(1),
          initialValue: 0.4,
        }),
        defineField({
          name: "cozyBiasWhenCold",
          type: "number",
          title: "Cozy Bias When Cold (0-1)",
          validation: (Rule) => Rule.min(0).max(1),
          initialValue: 0.35,
        }),

        // Explainability
        defineField({
          name: "reasonChipsEnabled",
          type: "boolean",
          title: "Reason Chips Enabled",
          initialValue: true,
        }),
        defineField({
          name: "maxReasonChips",
          type: "number",
          title: "Max Reason Chips",
          validation: (Rule) => Rule.integer().min(0).max(5),
          initialValue: 3,
        }),
        defineField({
          name: "chipStyle",
          type: "string",
          title: "Chip Style",
          options: {
            list: [
              { title: "Pill", value: "pill" },
              { title: "Soft", value: "soft" },
              { title: "Minimal", value: "minimal" },
            ],
          },
          initialValue: "pill",
        }),
        defineField({
          name: "whyModalEnabled",
          type: "boolean",
          title: "'Why?' Modal Enabled",
          initialValue: true,
        }),
        defineField({
          name: "whyModalCopy",
          type: "text",
          title: "'Why?' Modal Copy (optional)",
          rows: 3,
        }),

        // Compliance
        defineField({
          name: "showMedicalDisclaimer",
          type: "boolean",
          title: "Show Medical Disclaimer",
          initialValue: true,
        }),
        defineField({
          name: "disclaimerText",
          type: "text",
          title: "Disclaimer Text (brand specific)",
          rows: 2,
        }),
        defineField({
          name: "ageGateDependency",
          type: "boolean",
          title: "Age Gate Dependency",
          description: "Widget only shows if user passed age gate",
          initialValue: true,
        }),

        // Caching
        defineField({
          name: "weatherTtlSeconds",
          type: "number",
          title: "Weather Cache TTL (seconds)",
          validation: (Rule) => Rule.integer().min(0),
          initialValue: 1800, // 30 min
        }),
        defineField({
          name: "recommendationsTtlSeconds",
          type: "number",
          title: "Recommendations Cache TTL (seconds)",
          validation: (Rule) => Rule.integer().min(0),
          initialValue: 1800, // 30 min
        }),
        defineField({
          name: "staleWhileRevalidateSeconds",
          type: "number",
          title: "Stale While Revalidate (seconds)",
          validation: (Rule) => Rule.integer().min(0),
          initialValue: 86400, // 24h
        }),

        // Provider
        defineField({
          name: "providerMode",
          type: "string",
          title: "Provider Mode",
          options: {
            list: [
              { title: "Server Managed (Recommended)", value: "server_managed" },
              { title: "Brand Selected", value: "brand_selected" },
            ],
          },
          initialValue: "server_managed",
          description:
            "Server Managed: Backend chooses provider. Brand Selected: Brand can choose provider (requires provider config setup).",
        }),
        defineField({
          name: "provider",
          type: "string",
          title: "Provider (if Brand Selected)",
          options: {
            list: [
              { title: "WeatherKit (Apple)", value: "weatherkit" },
              { title: "OpenWeather", value: "openweather" },
              { title: "Tomorrow.io", value: "tomorrowio" },
            ],
          },
          hidden: ({ parent }) => parent?.providerMode !== "brand_selected",
        }),
        defineField({
          name: "providerConfigRef",
          type: "string",
          title: "Provider Config Reference (ID only, no secrets)",
          description:
            "Reference to server-managed secrets. DO NOT store API keys here.",
          hidden: ({ parent }) => parent?.providerMode !== "brand_selected",
        }),
      ],
    }),
  ],
  preview: {
    select: {
      brand: "brand.name",
      store: "store.name",
      enabled: "weatherRecommendationsWidget.enabled",
    },
    prepare({ brand, store, enabled }) {
      return {
        title: store ? `${brand} - ${store}` : brand || "Global",
        subtitle: `Weather Widget: ${enabled ? "Enabled" : "Disabled"}`,
      };
    },
  },
});
