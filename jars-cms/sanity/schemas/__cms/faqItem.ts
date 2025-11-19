import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'faqItem',
  type: 'document',
  title: 'FAQ Item',
  fields: [
    defineField({name: 'question', type: 'string', title: 'Question'}),
    defineField({name: 'answer', type: 'array', title: 'Answer', of: [{type: 'block'}]}),
    // Optional tenant scoping
    defineField({name: 'brand', type: 'reference', title: 'Brand', to: [{type: 'brand'}]}),
    defineField({
      name: 'stores',
      type: 'array',
      title: 'Store overrides',
      of: [{type: 'reference', to: [{type: 'store'}]}],
    }),
    // Optional A/B variants for an FAQ (override question/answer)
    defineField({
      name: 'variants',
      type: 'array',
      title: 'Variants',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'variantKey', type: 'string', title: 'Variant Key (A/B/...)'},
            {name: 'question', type: 'string', title: 'Question override'},
            {name: 'answer', type: 'array', title: 'Answer override', of: [{type: 'block'}]},
          ],
        },
      ],
    }),
    // Channels this FAQ applies to
    defineField({
      name: 'channels',
      type: 'array',
      title: 'Channels',
      of: [{type: 'string'}],
      options: {list: ['mobile', 'web', 'kiosk', 'email', 'ads']},
    }),
  ],
})
