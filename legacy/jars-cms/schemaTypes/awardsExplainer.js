export default {
  name: 'awardsExplainer',
  title: 'Awards Explainer',
  type: 'document',
  fields: [
    {name: 'title', type: 'string', title: 'Title'},
    {name: 'body', type: 'array', of: [{type: 'block'}]},
  ],
}
