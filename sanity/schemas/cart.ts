import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'cart',
  title: 'Shopping Cart',
  type: 'document',
  fields: [
    defineField({
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'items',
      title: 'Cart Items',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'product',
              title: 'Product',
              type: 'reference',
              to: [{ type: 'product' }],
              validation: Rule => Rule.required()
            }),
            defineField({
              name: 'quantity',
              title: 'Quantity',
              type: 'number',
              initialValue: 1,
              validation: Rule => Rule.min(1).max(10)
            }),
            defineField({
              name: 'addedAt',
              title: 'Added At',
              type: 'datetime',
              initialValue: () => new Date().toISOString()
            })
          ]
        }
      ]
    }),
    defineField({
      name: 'sessionId',
      title: 'Session ID',
      type: 'string',
      description: 'For anonymous users before login'
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last Updated',
      type: 'datetime',
      initialValue: () => new Date().toISOString()
    }),
    defineField({
      name: 'expiresAt',
      title: 'Expires At',
      type: 'datetime',
      description: 'When the cart expires (for cleanup)',
      initialValue: () => {
        const expiry = new Date()
        expiry.setDate(expiry.getDate() + 30) // 30 days from now
        return expiry.toISOString()
      }
    })
  ],
  preview: {
    select: {
      userName: 'user.name',
      userEmail: 'user.email',
      itemCount: 'items',
      updatedAt: 'updatedAt'
    },
    prepare(selection) {
      const { userName, userEmail, itemCount, updatedAt } = selection
      const count = Array.isArray(itemCount) ? itemCount.length : 0
      const user = userName || userEmail || 'Anonymous'
      const date = updatedAt ? new Date(updatedAt).toLocaleDateString() : ''

      return {
        title: `${user}'s Cart`,
        subtitle: `${count} item${count !== 1 ? 's' : ''} • Updated ${date}`,
        media: null
      }
    }
  }
})
