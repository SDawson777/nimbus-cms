import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'article',
  type: 'document',
  title: 'Article',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {source: 'title', maxLength: 96},
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      type: 'text',
      title: 'Short Excerpt',
      rows: 3,
    }),
    defineField({
      name: 'body',
      type: 'array',
      title: 'Body',
      of: [{type: 'block'}, {type: 'image'}],
    }),
    defineField({
      name: 'mainImage',
      type: 'image',
      title: 'Thumbnail Image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      title: 'Published Date',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'category',
      type: 'reference',
      to: [{type: 'category'}],
      title: 'Category',
    }),
    defineField({
      name: 'author',
      type: 'reference',
      to: [{type: 'author'}],
      title: 'Author',
    }),
    defineField({
      name: 'readingTime',
      type: 'string',
      title: 'Reading Time',
    }),
    defineField({
      name: 'tags',
      type: 'array',
      title: 'Tags',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'published',
      type: 'boolean',
      title: 'Published?',
      initialValue: true,
    }),
  ],
  preview: {
    select: {title: 'title', media: 'mainImage'},
  },
})
