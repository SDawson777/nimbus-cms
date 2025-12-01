import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'complianceSnapshot',
  type: 'document',
  title: 'Compliance Snapshot',
  fields: [
    defineField({name: 'orgSlug', type: 'string', title: 'Organization Slug'}),
    defineField({name: 'brandSlug', type: 'string', title: 'Brand Slug (optional)'}),
    defineField({name: 'ts', type: 'datetime', title: 'Snapshot timestamp'}),
    defineField({
      name: 'results',
      title: 'Results',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'storeSlug', type: 'string'},
            {name: 'stateCode', type: 'string'},
            {name: 'complianceScore', type: 'number'},
            {name: 'missingTypes', type: 'array', of: [{type: 'string'}]},
            {
              name: 'currentLegalDocs',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {name: 'type', type: 'string'},
                    {name: 'version', type: 'string'},
                    {name: 'effectiveFrom', type: 'datetime'},
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
  ],
})
