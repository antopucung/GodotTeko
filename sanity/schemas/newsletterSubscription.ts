import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'newsletterSubscription',
  title: 'Newsletter Subscription',
  type: 'document',
  icon: () => '📧',
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      type: 'email',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'subscribedAt',
      title: 'Subscribed At',
      type: 'datetime',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Active', value: 'active'},
          {title: 'Unsubscribed', value: 'unsubscribed'},
          {title: 'Bounced', value: 'bounced'}
        ]
      },
      initialValue: 'active'
    }),
    defineField({
      name: 'unsubscribedAt',
      title: 'Unsubscribed At',
      type: 'datetime'
    })
  ],
  preview: {
    select: {
      title: 'email',
      status: 'status',
      subscribedAt: 'subscribedAt'
    },
    prepare(selection) {
      const {title, status, subscribedAt} = selection
      const date = new Date(subscribedAt).toLocaleDateString()
      return {
        title: title,
        subtitle: `${status} • ${date}`
      }
    }
  }
})
