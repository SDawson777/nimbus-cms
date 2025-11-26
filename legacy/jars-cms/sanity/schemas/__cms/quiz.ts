import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'quiz',
  type: 'document',
  title: 'Quiz',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Quiz Title'}),
    defineField({
      name: 'linkedArticle',
      type: 'reference',
      title: 'Linked Article',
      to: [{type: 'article'}],
    }),
    defineField({
      name: 'questions',
      title: 'Questions',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'question',
          fields: [
            defineField({name: 'prompt', type: 'string', title: 'Question'}),
            defineField({name: 'choices', type: 'array', of: [{type: 'string'}]}),
            defineField({name: 'correctAnswer', type: 'string', title: 'Correct Answer'}),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
