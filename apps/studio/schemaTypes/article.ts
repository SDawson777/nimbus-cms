import {defineType, defineField} from 'sanity'
export default defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: Rule => Rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title', maxLength: 96}}),
    defineField({name: 'excerpt', title: 'Excerpt', type: 'text'}),
    defineField({name: 'mainImage', title: 'Main Image', type: 'image'}),
    defineField({name: 'authorName', title: 'Author Name', type: 'string'}),
    defineField({name: 'publishedAt', title: 'Published At', type: 'datetime'}),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{type: 'block'}, {type: 'image'}],
    }),
  ],
})