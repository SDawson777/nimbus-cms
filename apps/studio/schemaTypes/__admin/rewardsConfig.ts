import { defineField, defineType } from "sanity";

export default defineType({
  name: "rewardsConfig",
  type: "document",
  title: "Rewards Config",
  fields: [
    defineField({
      name: "baseQuizPoints",
      type: "number",
      title: "Base quiz points",
      initialValue: 50,
    }),
    defineField({
      name: "levelThresholds",
      type: "array",
      title: "Level thresholds",
      of: [{ type: "number" }],
      description: "Points required to reach each level (starting at level 1)",
    }),
    defineField({
      name: "levelStepPoints",
      type: "number",
      title: "Level step points",
      description: "Points per level after thresholds are exhausted",
      initialValue: 250,
    }),
    defineField({
      name: "maxLevel",
      type: "number",
      title: "Max level",
      initialValue: 20,
    }),
    defineField({
      name: "badgeRules",
      type: "array",
      title: "Badge rules",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "badgeId",
              type: "string",
              title: "Badge ID",
              description: "Stable identifier used in the API",
            },
            { name: "name", type: "string", title: "Name" },
            { name: "description", type: "text", title: "Description" },
            { name: "icon", type: "string", title: "Icon" },
            {
              name: "criteriaType",
              type: "string",
              title: "Criteria type",
              options: {
                list: ["quizCount", "totalPoints", "perfectScoreCount"],
              },
            },
            {
              name: "threshold",
              type: "number",
              title: "Threshold",
            },
          ],
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Rewards Config" };
    },
  },
});
