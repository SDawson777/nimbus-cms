import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'variantInventory',
  type: 'document',
  title: 'Variant Inventory',
  fields: [
    defineField({
      name: 'store',
      type: 'reference',
      title: 'Store',
      to: [{type: 'store'}],
    }),
    defineField({name: 'variantId', type: 'string', title: 'Variant ID'}),
    defineField({name: 'price', type: 'number', title: 'Price'}),
    defineField({name: 'stock', type: 'number', title: 'Stock'}),
  ],
  preview: {
    select: {title: 'variantId', subtitle: 'store.name'},
  },
})
