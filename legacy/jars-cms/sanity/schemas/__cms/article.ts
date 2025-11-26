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
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
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
    // Channels this article is intended for (mobile, web, kiosk, email, etc.)
    defineField({
      name: 'channels',
      type: 'array',
      title: 'Channels',
      of: [{type: 'string'}],
      options: {list: ['mobile', 'web', 'kiosk', 'email', 'ads']},
    }),
    // Scheduling for retail operations: optional schedule object
    defineField({
      name: 'schedule',
      type: 'object',
      title: 'Schedule',
      fields: [
        {name: 'publishAt', type: 'datetime', title: 'Publish At (optional)'},
        {name: 'unpublishAt', type: 'datetime', title: 'Unpublish At (optional)'},
        {name: 'isScheduled', type: 'boolean', title: 'Is Scheduled?', initialValue: false},
      ],
    }),
    // Optional A/B variants
    defineField({
      name: 'variants',
      type: 'array',
      title: 'Variants',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'variantKey', type: 'string', title: 'Variant Key (A/B/...)'},
            {name: 'title', type: 'string', title: 'Title override'},
            {name: 'excerpt', type: 'text', title: 'Excerpt override'},
            {
              name: 'body',
              type: 'array',
              title: 'Body override',
              of: [{type: 'block'}, {type: 'image'}],
            },
          ],
        },
      ],
    }),
    // Optional tenant scoping
    defineField({name: 'brand', type: 'reference', title: 'Brand', to: [{type: 'brand'}]}),
    defineField({
      name: 'stores',
      type: 'array',
      title: 'Store overrides',
      of: [{type: 'reference', to: [{type: 'store'}]}],
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
