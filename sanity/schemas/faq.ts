import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  icon: () => '❓',
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: Rule => Rule.required().max(200)
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'text',
      rows: 4,
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'General', value: 'general'},
          {title: 'Payments', value: 'payments'},
          {title: 'Earnings', value: 'earnings'},
          {title: 'Licensing', value: 'licensing'},
          {title: 'Technical', value: 'technical'},
          {title: 'Account', value: 'account'}
        ]
      }
    }),
    defineField({
      name: 'order',
      title: 'Sort Order',
      type: 'number',
      description: 'Lower numbers appear first',
      initialValue: 0
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Show this FAQ on the website',
      initialValue: true
    })
  ],
  preview: {
    select: {
      title: 'question',
      subtitle: 'category',
      order: 'order',
      isActive: 'isActive'
    },
    prepare(selection) {
      const {title, subtitle, order, isActive} = selection
      return {
        title: title,
        subtitle: `${subtitle || 'General'} • Order: ${order}${!isActive ? ' • Inactive' : ''}`
      }
    }
  },
  orderings: [
    {
      title: 'Sort Order',
      name: 'orderAsc',
      by: [
        {field: 'order', direction: 'asc'}
      ]
    }
  ]
})
