import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'author',
  type: 'document',
  title: 'Author',
  fields: [
    defineField({name: 'name', type: 'string', title: 'Name'}),
    defineField({name: 'bio', type: 'text', title: 'Bio'}),
    defineField({name: 'avatar', type: 'image', title: 'Avatar', options: {hotspot: true}}),
  ],
})
