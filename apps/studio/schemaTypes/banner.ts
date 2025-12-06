import {defineType, defineField} from 'sanity'
export default defineType({
  name: 'banner',
  title: 'Banner',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: Rule => Rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title', maxLength: 96}}),
    defineField({name: 'image', title: 'Image', type: 'image', validation: Rule => Rule.required()}),
    defineField({name: 'url', title: 'Link URL', type: 'url'}),
    defineField({name: 'startDate', title: 'Start Date', type: 'datetime'}),
    defineField({name: 'endDate', title: 'End Date', type: 'datetime'}),
    defineField({name: 'active', title: 'Active', type: 'boolean', initialValue: true}),
  ],
})