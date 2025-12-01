import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'complianceMonitor',
  type: 'document',
  title: 'Compliance Monitor',
  fields: [
    defineField({
      name: 'lastRuns',
      title: 'Last runs',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'scope', type: 'string'},
            {name: 'snapshotId', type: 'string'},
            {name: 'ts', type: 'datetime'},
            {name: 'brandSlug', type: 'string'},
          ],
        },
      ],
    }),
  ],
})
