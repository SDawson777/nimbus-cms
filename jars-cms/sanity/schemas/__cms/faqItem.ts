import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'faqItem',
  type: 'document',
  title: 'FAQ Item',
  fields: [
    defineField({name: 'question', type: 'string', title: 'Question'}),
    defineField({name: 'answer', type: 'array', title: 'Answer', of: [{type: 'block'}]}),
  ],
})
