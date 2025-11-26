import {defineField, defineType} from 'sanity'

export default defineType({
  // Consolidated canonical schema name used by server-side queries
  name: 'legalDoc',
  type: 'document',
  title: 'Legal Doc',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {source: 'title', maxLength: 96},
    }),
    defineField({name: 'body', type: 'array', title: 'Body', of: [{type: 'block'}]}),
    // versioning and jurisdiction
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {list: ['terms', 'privacy', 'accessibility', 'ageGate', 'disclaimer']},
    }),
    defineField({name: 'stateCode', title: 'State code (optional)', type: 'string'}),
    defineField({name: 'version', title: 'Version', type: 'string'}),
    defineField({name: 'effectiveFrom', title: 'Effective from', type: 'datetime'}),
    defineField({name: 'effectiveTo', title: 'Effective to (optional)', type: 'datetime'}),
    defineField({name: 'notes', title: 'Internal notes', type: 'text'}),
    // Optional tenant scoping
    defineField({name: 'brand', type: 'reference', title: 'Brand', to: [{type: 'brand'}]}),
    defineField({
      name: 'stores',
      type: 'array',
      title: 'Store overrides',
      of: [{type: 'reference', to: [{type: 'store'}]}],
    }),
    // Channels this legal doc applies to. If empty/undefined the doc is considered global.
    defineField({
      name: 'channels',
      type: 'array',
      title: 'Channels',
      of: [{type: 'string'}],
      options: {list: ['mobile', 'web', 'kiosk', 'email', 'ads']},
    }),
  ],
})
