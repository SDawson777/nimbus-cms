import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'contentMetric',
  type: 'document',
  title: 'Content Metric',
  fields: [
    defineField({
      name: 'contentType',
      title: 'Content Type',
      type: 'string',
      options: {list: ['article', 'faq', 'legal', 'product']},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'contentSlug',
      title: 'Content Slug',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'contentId', title: 'Content ID (optional)', type: 'string'}),
    defineField({name: 'brandSlug', title: 'Brand Slug (optional)', type: 'string'}),
    defineField({name: 'storeSlug', title: 'Store Slug (optional)', type: 'string'}),
    defineField({name: 'views', title: 'Views', type: 'number', initialValue: 0}),
    defineField({name: 'clickThroughs', title: 'Click Throughs', type: 'number', initialValue: 0}),
    defineField({name: 'lastUpdated', title: 'Last Updated', type: 'datetime', readOnly: true}),
  ],
  preview: {
    select: {
      title: 'contentSlug',
      subtitle: 'contentType',
    },
  },
})
