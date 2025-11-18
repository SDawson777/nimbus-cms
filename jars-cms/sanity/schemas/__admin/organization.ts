import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'organization',
  type: 'document',
  title: 'Organization',
  fields: [
    defineField({name: 'name', type: 'string', title: 'Name'}),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {source: 'name', maxLength: 96},
    }),
    defineField({name: 'primaryContact', type: 'string', title: 'Primary contact'}),
    defineField({name: 'notes', type: 'text', title: 'Notes'}),
  ],
  preview: {select: {title: 'name'}},
})
