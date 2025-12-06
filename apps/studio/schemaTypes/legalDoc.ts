import {defineType, defineField} from 'sanity'
export default defineType({
  name: 'legalDoc',
  title: 'Legal Document',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: Rule => Rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title', maxLength: 96}}),
    defineField({name: 'version', title: 'Version', type: 'string'}),
    defineField({name: 'publishedAt', title: 'Published At', type: 'datetime'}),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [{type: 'block'}],
    }),
  ],
})