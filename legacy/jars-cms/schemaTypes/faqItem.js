export default {
  name: 'faqItem',
  title: 'FAQ Item',
  type: 'document',
  fields: [
    {name: 'question', type: 'string', title: 'Question'},
    {name: 'answer', type: 'array', title: 'Answer', of: [{type: 'block'}]},
  ],
}
