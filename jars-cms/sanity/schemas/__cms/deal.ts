import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'deal',
  type: 'document',
  title: 'Deal',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({name: 'slug', type: 'slug', title: 'Slug', options: {source: 'title', maxLength: 96}}),
    defineField({name: 'description', type: 'array', title: 'Description', of: [{type: 'block'}]}),
    defineField({name: 'startDate', type: 'datetime', title: 'Start Date'}),
    defineField({name: 'endDate', type: 'datetime', title: 'End Date'}),
    defineField({name: 'tags', type: 'array', title: 'Tags', of: [{type: 'string'}]}),
    defineField({name: 'reason', type: 'string', title: 'Reason Text'}),
  ],
})
