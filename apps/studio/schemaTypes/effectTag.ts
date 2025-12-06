import {defineType, defineField} from 'sanity'
export default defineType({
  name: 'effectTag',
  title: 'Effect Tag',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: Rule => Rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title', maxLength: 96}}),
    defineField({name: 'description', title: 'Description', type: 'text'}),
  ],
})