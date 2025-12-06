import {defineType, defineField} from 'sanity'
export default defineType({
  name: 'deal',
  title: 'Deal',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: Rule => Rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title', maxLength: 96}}),
    defineField({name: 'description', title: 'Description', type: 'text'}),
    defineField({name: 'discount', title: 'Discount Percent', type: 'number'}),
    defineField({name: 'startDate', title: 'Start Date', type: 'datetime'}),
    defineField({name: 'endDate', title: 'End Date', type: 'datetime'}),
    defineField({name: 'active', title: 'Active', type: 'boolean', initialValue: true}),
  ],
})