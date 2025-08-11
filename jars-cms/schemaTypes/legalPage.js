export default {
  name: 'legalPage',
  title: 'Legal Page',
  type: 'document',
  fields: [
    { name: 'title', type: 'string', title: 'Title' },
    { name: 'slug', type: 'slug', title: 'Slug' },
    { name: 'body', type: 'array', title: 'Body', of: [{ type: 'block' }] }
  ]
}
