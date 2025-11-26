export default {
  name: 'transparencyPage',
  title: 'Transparency Page',
  type: 'document',
  fields: [
    {name: 'title', type: 'string', title: 'Title'},
    {name: 'body', type: 'array', of: [{type: 'block'}]},
  ],
}
