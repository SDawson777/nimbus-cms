import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'legalPage',
  type: 'document',
  title: 'Legal Page',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({name: 'slug', type: 'slug', title: 'Slug', options: {source: 'title', maxLength: 96}}),
    defineField({name: 'body', type: 'array', title: 'Body', of: [{type: 'block'}]}),
  ],
})
