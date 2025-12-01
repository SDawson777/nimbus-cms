import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'promo',
  type: 'document',
  title: 'Promo',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {source: 'title', maxLength: 96},
    }),
    defineField({name: 'code', type: 'string', title: 'Promo Code (optional)'}),
    defineField({name: 'discount', type: 'number', title: 'Discount (decimal, e.g. 0.1 for 10%)'}),
    defineField({name: 'description', type: 'array', title: 'Description', of: [{type: 'block'}]}),
    defineField({name: 'image', type: 'image', title: 'Image', options: {hotspot: true}}),
    // Channels this promo is targeted to
    defineField({
      name: 'channels',
      type: 'array',
      title: 'Channels',
      of: [{type: 'string'}],
      options: {list: ['mobile', 'web', 'kiosk', 'email', 'ads']},
    }),
    // Scheduling for operational control over promo visibility
    defineField({
      name: 'schedule',
      type: 'object',
      title: 'Schedule',
      fields: [
        {name: 'publishAt', type: 'datetime', title: 'Publish At (optional)'},
        {name: 'unpublishAt', type: 'datetime', title: 'Unpublish At (optional)'},
        {name: 'isScheduled', type: 'boolean', title: 'Is Scheduled?', initialValue: false},
      ],
    }),
    // Optional tenant scoping
    defineField({name: 'brand', type: 'reference', title: 'Brand', to: [{type: 'brand'}]}),
    defineField({
      name: 'stores',
      type: 'array',
      title: 'Stores',
      of: [{type: 'reference', to: [{type: 'store'}]}],
    }),
    defineField({name: 'active', type: 'boolean', title: 'Active?', initialValue: true}),
  ],
  preview: {select: {title: 'title', media: 'image'}},
})
