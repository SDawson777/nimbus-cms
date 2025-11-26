import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'awardsExplainer',
  type: 'document',
  title: 'Awards Explainer',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({name: 'body', type: 'array', title: 'Body', of: [{type: 'block'}]}),
  ],
})
