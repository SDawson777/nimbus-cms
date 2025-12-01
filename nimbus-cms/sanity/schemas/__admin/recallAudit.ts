import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'recallAudit',
  type: 'document',
  title: 'Product Recall Audit',
  fields: [
    defineField({name: 'productId', type: 'string', title: 'Product ID'}),
    defineField({name: 'changedBy', type: 'string', title: 'Changed By (email)'}),
    defineField({name: 'role', type: 'string', title: 'Role'}),
    defineField({
      name: 'previous',
      type: 'object',
      title: 'Previous State',
      fields: [
        {name: 'isRecalled', type: 'boolean'},
        {name: 'recallReason', type: 'string'},
      ],
    }),
    defineField({
      name: 'current',
      type: 'object',
      title: 'Current State',
      fields: [
        {name: 'isRecalled', type: 'boolean'},
        {name: 'recallReason', type: 'string'},
      ],
    }),
    defineField({name: 'reason', type: 'string', title: 'Operator Reason (optional)'}),
    defineField({
      name: 'ts',
      type: 'datetime',
      title: 'Timestamp',
      initialValue: () => new Date().toISOString(),
    }),
  ],
})
