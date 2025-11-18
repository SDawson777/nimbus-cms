import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'product',
  type: 'document',
  title: 'Product',
  fields: [
    defineField({name: 'name', type: 'string', title: 'Name'}),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {source: 'name', maxLength: 96},
    }),
    defineField({name: 'price', type: 'number', title: 'Price'}),
    defineField({name: 'effects', type: 'array', of: [{type: 'string'}], title: 'Effects'}),
    defineField({
      name: 'productType',
      type: 'reference',
      title: 'Product Type',
      to: [{type: 'productType'}],
    }),
    // Multi-tenant fields (optional)
  defineField({name: 'brand', type: 'reference', title: 'Brand', to: [{type: 'brand'}]}),
    defineField({name: 'stores', type: 'array', title: 'Store overrides', of: [{type: 'reference', to: [{type: 'store'}]}]}),
    defineField({name: 'availability', type: 'string', title: 'Availability'}),
    defineField({name: 'image', type: 'image', title: 'Image', options: {hotspot: true}}),
  ],
  preview: {
    select: {title: 'name', media: 'image'},
  },
})
