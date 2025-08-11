export default {
  name: 'deal',
  title: 'Deal',
  type: 'document',
  fields: [
    { name: 'title', type: 'string', title: 'Title' },
    { name: 'slug', type: 'slug', title: 'Slug' },
    { name: 'description', type: 'array', of: [{ type: 'block' }] },
    { name: 'startDate', type: 'datetime', title: 'Start Date' },
    { name: 'endDate', type: 'datetime', title: 'End Date' },
    { name: 'tags', type: 'array', of: [{ type: 'string' }] },
    { name: 'reason', type: 'string', title: 'Reason Text' }
  ]
}
