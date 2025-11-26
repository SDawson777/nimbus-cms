import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'transparencyPage',
  type: 'document',
  title: 'Transparency Page',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({name: 'body', type: 'array', title: 'Body', of: [{type: 'block'}]}),
  ],
})
