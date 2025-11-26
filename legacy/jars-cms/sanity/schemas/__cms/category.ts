import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'category',
  type: 'document',
  title: 'Category',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Category Name'}),
    defineField({name: 'description', type: 'text', title: 'Description'}),
    defineField({name: 'icon', type: 'image', title: 'Icon Image', options: {hotspot: true}}),
  ],
  preview: {
    select: {title: 'title', media: 'icon'},
  },
})
