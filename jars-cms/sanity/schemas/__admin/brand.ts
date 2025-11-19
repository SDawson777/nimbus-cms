import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'brand',
  type: 'document',
  title: 'Brand',
  fields: [
    defineField({name: 'name', type: 'string', title: 'Name'}),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {source: 'name', maxLength: 96},
    }),
    defineField({
      name: 'organization',
      type: 'reference',
      to: [{type: 'organization'}],
      title: 'Organization',
    }),
    defineField({name: 'logo', type: 'image', title: 'Logo', options: {hotspot: true}}),
    defineField({
      name: 'primaryColor',
      type: 'string',
      title: 'Primary color',
      description: 'Hex or CSS color',
    }),
    defineField({
      name: 'secondaryColor',
      type: 'string',
      title: 'Secondary color',
      description: 'Hex or CSS color',
    }),
    defineField({name: 'notes', type: 'text', title: 'Notes'}),
  ],
  preview: {select: {title: 'name', media: 'logo'}},
})
