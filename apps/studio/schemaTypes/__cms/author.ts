import { defineField, defineType } from "sanity";

export default defineType({
  name: "author",
  type: "document",
  title: "Author",
  fields: [
    defineField({ name: "name", type: "string", title: "Name" }),
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      options: { source: "name", maxLength: 96 },
    }),
    defineField({ name: "bio", type: "text", title: "Bio" }),
    defineField({
      name: "avatar",
      type: "image",
      title: "Avatar",
      options: { hotspot: true },
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Image (alias)",
      options: { hotspot: true },
      description: "Alternative field name for API compatibility",
    }),
  ],
});
