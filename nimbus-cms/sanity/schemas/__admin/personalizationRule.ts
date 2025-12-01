import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'personalizationRule',
  type: 'document',
  title: 'Personalization Rule',
  fields: [
    defineField({name: 'name', type: 'string', title: 'Name'}),
    defineField({name: 'description', type: 'text', title: 'Description'}),
    defineField({
      name: 'conditions',
      type: 'array',
      title: 'Conditions',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'key', type: 'string', title: 'Key'},
            {
              name: 'operator',
              type: 'string',
              title: 'Operator',
              options: {list: ['equals', 'in', 'lessThan', 'greaterThanOrEqual']},
            },
            {name: 'value', type: 'string', title: 'Value'},
          ],
        },
      ],
    }),
    defineField({
      name: 'actions',
      type: 'array',
      title: 'Actions',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'targetType',
              type: 'string',
              title: 'Target Type',
              options: {list: ['article', 'deal', 'productCategory', 'banner']},
            },
            {name: 'targetSlugOrKey', type: 'string', title: 'Target Slug or Key'},
            {name: 'priorityBoost', type: 'number', title: 'Priority Boost'},
            {name: 'channel', type: 'string', title: 'Channel (optional)'},
          ],
        },
      ],
    }),
    // enabled flag to allow temporary disabling
    defineField({name: 'enabled', type: 'boolean', title: 'Enabled', initialValue: true}),
  ],
})
