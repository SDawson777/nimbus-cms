import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'accessibilityPage',
  type: 'document',
  title: 'Accessibility Page',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({name: 'body', type: 'array', title: 'Body', of: [{type: 'block'}]}),
  ],
})
