export default {
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    {name: 'title', type: 'string', title: 'Title'},
    {name: 'slug', type: 'slug', title: 'Slug'},
    {name: 'summary', type: 'text', title: 'Summary'},
    {name: 'coverImage', type: 'image', title: 'Cover Image'},
    {name: 'body', type: 'array', of: [{type: 'block'}]},
    {name: 'category', type: 'reference', to: [{type: 'category'}]},
    {name: 'author', type: 'reference', to: [{type: 'author'}]},
    {name: 'readingTime', type: 'string', title: 'Reading Time'},
  ],
}
