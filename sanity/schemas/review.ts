import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'review',
  title: 'Product Review',
  type: 'document',
  icon: () => '⭐',
  fields: [
    defineField({
      name: 'product',
      title: 'Product',
      type: 'reference',
      to: [{ type: 'product' }],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'number',
      validation: Rule => Rule.required().min(1).max(5),
      description: 'Rating from 1 to 5 stars'
    }),
    defineField({
      name: 'title',
      title: 'Review Title',
      type: 'string',
      validation: Rule => Rule.max(100)
    }),
    defineField({
      name: 'comment',
      title: 'Review Comment',
      type: 'text',
      rows: 4,
      validation: Rule => Rule.max(1000)
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Published', value: 'published' },
          { title: 'Pending', value: 'pending' },
          { title: 'Hidden', value: 'hidden' }
        ]
      },
      initialValue: 'published'
    }),
    defineField({
      name: 'helpful',
      title: 'Helpful Votes',
      type: 'number',
      initialValue: 0,
      description: 'Number of users who found this review helpful'
    })
  ],
  preview: {
    select: {
      title: 'title',
      rating: 'rating',
      user: 'user.name',
      product: 'product.title'
    },
    prepare(selection) {
      const { title, rating, user, product } = selection
      const stars = '⭐'.repeat(rating || 0)
      return {
        title: title || `Review by ${user}`,
        subtitle: `${stars} • ${product}`,
      }
    }
  },
  orderings: [
    {
      title: 'Newest',
      name: 'newest',
      by: [{ field: '_createdAt', direction: 'desc' }]
    },
    {
      title: 'Most Helpful',
      name: 'helpful',
      by: [{ field: 'helpful', direction: 'desc' }]
    },
    {
      title: 'Highest Rating',
      name: 'highestRating',
      by: [{ field: 'rating', direction: 'desc' }]
    }
  ]
})
