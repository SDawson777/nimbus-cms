import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'drop',
  type: 'document',
  title: 'Product Drop',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({name: 'dropDate', type: 'datetime', title: 'Drop Date'}),
    defineField({name: 'highlight', type: 'text', title: 'Highlight'}),
    defineField({
      name: 'products',
      type: 'array',
      title: 'Products',
      of: [{type: 'reference', to: [{type: 'product'}]}],
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
