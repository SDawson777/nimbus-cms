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
    defineField({
      name: 'stores',
      type: 'array',
      title: 'Store overrides',
      of: [{type: 'reference', to: [{type: 'store'}]}],
    }),
    defineField({name: 'availability', type: 'string', title: 'Availability'}),
    defineField({name: 'image', type: 'image', title: 'Image', options: {hotspot: true}}),
    // Channels this product is available on
    defineField({
      name: 'channels',
      type: 'array',
      title: 'Channels',
      of: [{type: 'string'}],
      options: {list: ['mobile', 'web', 'kiosk', 'email', 'ads']},
    }),
    // Recall flags for retail operations
    defineField({name: 'isRecalled', type: 'boolean', title: 'Recalled?', initialValue: false}),
    defineField({name: 'recallReason', type: 'string', title: 'Recall Reason (optional)'}),
  ],
  preview: {
    select: {title: 'name', media: 'image'},
  },
})
