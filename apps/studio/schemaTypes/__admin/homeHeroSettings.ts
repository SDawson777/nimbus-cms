import { defineField, defineType } from "sanity";

export default defineType({
  name: "homeHeroSettings",
  type: "document",
  title: "Home Hero Settings",
  fields: [
    defineField({
      name: "rotationMs",
      type: "number",
      title: "Rotation speed (ms)",
      description: "Default rotation speed for the home hero carousel",
      initialValue: 15000,
      validation: (Rule) => Rule.min(1000).max(60000),
    }),
    defineField({
      name: "autoplay",
      type: "boolean",
      title: "Autoplay",
      description: "Automatically rotate hero banners",
      initialValue: true,
    }),
    defineField({
      name: "transitionStyle",
      type: "string",
      title: "Transition style",
      options: {
        list: [
          { title: "Fade", value: "fade" },
          { title: "Slide", value: "slide" },
          { title: "None", value: "none" },
        ],
      },
      initialValue: "fade",
    }),
    defineField({
      name: "homeCategoryLimit",
      type: "number",
      title: "Home category limit",
      description:
        "Maximum number of categories shown on the mobile homescreen. Leave empty to show all categories.",
      validation: (Rule) => Rule.integer().min(1).max(50),
    }),
  ],
  preview: {
    prepare() {
      return { title: "Home Hero Settings" };
    },
  },
});
