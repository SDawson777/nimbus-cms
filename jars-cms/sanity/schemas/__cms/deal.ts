import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'deal',
  type: 'document',
  title: 'Deal',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {source: 'title', maxLength: 96},
    }),
    defineField({name: 'description', type: 'array', title: 'Description', of: [{type: 'block'}]}),
    defineField({name: 'startDate', type: 'datetime', title: 'Start Date'}),
    defineField({name: 'endDate', type: 'datetime', title: 'End Date'}),
    defineField({name: 'tags', type: 'array', title: 'Tags', of: [{type: 'string'}]}),
    defineField({name: 'reason', type: 'string', title: 'Reason Text'}),
    // Channels this deal is targeted to
    defineField({
      name: 'channels',
      type: 'array',
      title: 'Channels',
      of: [{type: 'string'}],
      options: {list: ['mobile', 'web', 'kiosk', 'email', 'ads']},
    }),
    // Scheduling for operational control over deal visibility
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
  ],
})
