import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'store',
  type: 'document',
  title: 'Store',
  fields: [
    defineField({name: 'name', type: 'string', title: 'Name'}),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {source: 'name', maxLength: 96},
    }),
    defineField({name: 'brand', type: 'reference', to: [{type: 'brand'}], title: 'Brand'}),
    defineField({name: 'address', type: 'string', title: 'Address'}),
    defineField({name: 'city', type: 'string', title: 'City'}),
    defineField({name: 'stateCode', type: 'string', title: 'State code'}),
    defineField({name: 'zip', type: 'string', title: 'ZIP'}),
    defineField({name: 'phone', type: 'string', title: 'Phone'}),
    defineField({name: 'isActive', type: 'boolean', title: 'Is active', initialValue: true}),
  ],
  preview: {
    select: {title: 'name'},
  },
})
