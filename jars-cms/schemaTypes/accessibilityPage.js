export default {
  name: 'accessibilityPage',
  title: 'Accessibility Page',
  type: 'document',
  fields: [
    { name: 'title', type: 'string', title: 'Title' },
    { name: 'body', type: 'array', of: [{ type: 'block' }] }
  ]
}
