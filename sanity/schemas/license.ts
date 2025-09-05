import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'license',
  title: 'License',
  type: 'document',
  fields: [
    defineField({
      name: 'userId',
      title: 'User ID',
      type: 'string',
      description: 'The user who owns this license',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'productId',
      title: 'Product ID',
      type: 'string',
      description: 'The product this license is for',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'orderId',
      title: 'Order ID',
      type: 'string',
      description: 'The order that created this license',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'licenseType',
      title: 'License Type',
      type: 'string',
      options: {
        list: [
          { title: 'Standard License', value: 'standard' },
          { title: 'Extended License', value: 'extended' }
        ]
      },
      initialValue: 'standard',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'downloadLimit',
      title: 'Download Limit',
      type: 'number',
      description: 'Maximum number of downloads allowed',
      initialValue: 10,
      validation: Rule => Rule.required().min(1)
    }),
    defineField({
      name: 'downloadCount',
      title: 'Download Count',
      type: 'number',
      description: 'Number of times this has been downloaded',
      initialValue: 0,
      validation: Rule => Rule.required().min(0)
    }),
    defineField({
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      description: 'Whether this license is currently active',
      initialValue: true
    }),
    defineField({
      name: 'expiresAt',
      title: 'Expires At',
      type: 'datetime',
      description: 'When this license expires (optional)'
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString()
    }),
    defineField({
      name: 'updatedAt',
      title: 'Updated At',
      type: 'datetime',
      initialValue: () => new Date().toISOString()
    })
  ],
  preview: {
    select: {
      title: 'productId',
      subtitle: 'licenseType',
      description: 'userId'
    },
    prepare(selection) {
      const { title, subtitle, description } = selection
      return {
        title: `License for ${title}`,
        subtitle: `${subtitle} license`,
        description: `User: ${description}`
      }
    }
  },
  orderings: [
    {
      title: 'Created At, Newest',
      name: 'createdAtDesc',
      by: [{ field: 'createdAt', direction: 'desc' }]
    },
    {
      title: 'Created At, Oldest',
      name: 'createdAtAsc',
      by: [{ field: 'createdAt', direction: 'asc' }]
    }
  ]
})
