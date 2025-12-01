import {defineField, defineType} from 'sanity'
// Note: Studio-time uniqueness validation uses the studio client. In some Studio
// setups `part:@sanity/base/client` is available; if your Studio differs you may
// need to adapt this import.
let studioClient: any
try {
  studioClient = require('part:@sanity/base/client')
} catch {
  studioClient = null
}

export default defineType({
  name: 'themeConfig',
  type: 'document',
  title: 'Theme Configuration',
  fields: [
    defineField({
      name: 'brand',
      type: 'reference',
      title: 'Brand',
      to: [{type: 'brand'}],
      validation: (Rule) =>
        Rule.required().custom(async (val: any, context: any) => {
          // val may be a reference object {_ref}
          const ref = val && (val._ref || val)
          if (!ref) return true
          if (!studioClient) return true // cannot validate here; allow server enforcement
          try {
            // Enforce uniqueness per brand+store pair. If store is set on this document,
            // ensure no other themeConfig exists for the same brand and store. If store
            // is not set, ensure no other brand-level themeConfig exists for the same brand.
            const storeRef =
              context.document &&
              context.document.store &&
              (context.document.store._ref || context.document.store)
            if (storeRef) {
              const q =
                '*[_type=="themeConfig" && brand._ref == $ref && store._ref == $store && _id != $id][0]{_id}'
              const existing = await studioClient.fetch(q, {
                ref,
                store: storeRef,
                id: context.document._id,
              })
              return existing ? 'A theme for this brand+store already exists' : true
            } else {
              const q =
                '*[_type=="themeConfig" && brand._ref == $ref && !defined(store) && _id != $id][0]{_id}'
              const existing = await studioClient.fetch(q, {ref, id: context.document._id})
              return existing ? 'A brand-level theme already exists for this brand' : true
            }
          } catch {
            return true
          }
        }),
    }),
    // NOTE: Intended to be one themeConfig per brand. Use the brand reference to scope configs.
    defineField({
      name: 'primaryColor',
      type: 'string',
      title: 'Primary Color',
      validation: (Rule) =>
        Rule.regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).error('Must be a hex color like #RRGGBB'),
    }),
    defineField({
      name: 'secondaryColor',
      type: 'string',
      title: 'Secondary Color',
      validation: (Rule) =>
        Rule.regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).error('Must be a hex color like #RRGGBB'),
    }),
    defineField({
      name: 'accentColor',
      type: 'string',
      title: 'Accent Color',
      validation: (Rule) =>
        Rule.regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).error('Must be a hex color like #RRGGBB'),
    }),
    defineField({
      name: 'surfaceColor',
      type: 'string',
      title: 'Surface Color',
      validation: (Rule) =>
        Rule.regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).error('Must be a hex color like #RRGGBB'),
    }),
    defineField({
      name: 'backgroundColor',
      type: 'string',
      title: 'Background Color',
      validation: (Rule) =>
        Rule.regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).error('Must be a hex color like #RRGGBB'),
    }),
    defineField({
      name: 'textColor',
      type: 'string',
      title: 'Text Color',
      validation: (Rule) =>
        Rule.regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).error('Must be a hex color like #RRGGBB'),
    }),
    defineField({name: 'logo', type: 'image', title: 'Logo', options: {hotspot: true}}),
    // Convenience field: store a logo URL for programmatic updates (admin API can set this)
    defineField({name: 'logoUrl', type: 'string', title: 'Logo URL (optional)'}),
    // Optional store override: when set, this themeConfig applies to a specific store under the brand
    defineField({
      name: 'store',
      type: 'reference',
      title: 'Store (optional)',
      to: [{type: 'store'}],
    }),
    defineField({
      name: 'typography',
      type: 'object',
      title: 'Typography',
      fields: [
        {name: 'fontFamily', type: 'string', title: 'Font Family'},
        {name: 'fontSize', type: 'string', title: 'Base Font Size'},
      ],
    }),
    defineField({
      name: 'mutedTextColor',
      type: 'string',
      title: 'Muted Text Color',
      validation: (Rule) =>
        Rule.regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).error('Must be a hex color like #RRGGBB'),
    }),
    defineField({
      name: 'darkModeEnabled',
      type: 'boolean',
      title: 'Dark mode enabled',
      initialValue: false,
    }),
    defineField({
      name: 'cornerRadius',
      type: 'string',
      title: 'Corner radius (e.g., 8px)',
      initialValue: '8px',
    }),
    defineField({
      name: 'elevationStyle',
      type: 'string',
      title: 'Elevation style',
      options: {list: ['flat', 'medium', 'high']},
      initialValue: 'flat',
    }),
  ],
  preview: {select: {title: 'brand'}},
})
