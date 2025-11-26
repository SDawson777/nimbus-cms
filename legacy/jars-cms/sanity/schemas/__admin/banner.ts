import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'banner',
  type: 'document',
  title: 'Banner',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({name: 'image', type: 'image', title: 'Image', options: {hotspot: true}}),
    defineField({name: 'ctaText', type: 'string', title: 'CTA Text'}),
    defineField({name: 'ctaLink', type: 'url', title: 'CTA Link'}),
    defineField({name: 'active', type: 'boolean', title: 'Active', initialValue: true}),
  ],
  preview: {
    select: {title: 'title', media: 'image'},
  },
})
