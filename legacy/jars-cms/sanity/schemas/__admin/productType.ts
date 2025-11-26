import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'productType',
  type: 'document',
  title: 'Product Type',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Type Name'}),
    defineField({name: 'description', type: 'text', title: 'Description'}),
  ],
  preview: {select: {title: 'title'}},
})
