import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'accessPass',
  title: 'Access Pass',
  type: 'document',
  fields: [
    defineField({
      name: 'user',
      title: 'Pass Owner',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'passType',
      title: 'Pass Type',
      type: 'string',
      options: {
        list: [
          { title: 'Monthly', value: 'monthly' },
          { title: 'Yearly', value: 'yearly' },
          { title: 'Lifetime', value: 'lifetime' }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'status',
      title: 'Pass Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Cancelled', value: 'cancelled' },
          { title: 'Expired', value: 'expired' },
          { title: 'Past Due', value: 'past_due' },
          { title: 'Paused', value: 'paused' }
        ]
      },
      initialValue: 'active',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'stripeSubscriptionId',
      title: 'Stripe Subscription ID',
      type: 'string',
      description: 'For recurring subscriptions (monthly/yearly)'
    }),
    defineField({
      name: 'stripeCustomerId',
      title: 'Stripe Customer ID',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'currentPeriodStart',
      title: 'Current Period Start',
      type: 'datetime',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'currentPeriodEnd',
      title: 'Current Period End',
      type: 'datetime',
      description: 'When the current billing period ends (null for lifetime)'
    }),
    defineField({
      name: 'cancelAtPeriodEnd',
      title: 'Cancel at Period End',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'pricing',
      title: 'Pricing Information',
      type: 'object',
      fields: [
        defineField({
          name: 'amount',
          title: 'Amount Paid',
          type: 'number',
          description: 'Amount in cents'
        }),
        defineField({
          name: 'currency',
          title: 'Currency',
          type: 'string',
          initialValue: 'USD'
        }),
        defineField({
          name: 'interval',
          title: 'Billing Interval',
          type: 'string',
          options: {
            list: [
              { title: 'Monthly', value: 'month' },
              { title: 'Yearly', value: 'year' },
              { title: 'One-time', value: 'one_time' }
            ]
          }
        })
      ]
    }),
    defineField({
      name: 'usage',
      title: 'Usage Statistics',
      type: 'object',
      fields: [
        defineField({
          name: 'totalDownloads',
          title: 'Total Downloads',
          type: 'number',
          initialValue: 0
        }),
        defineField({
          name: 'downloadsThisPeriod',
          title: 'Downloads This Period',
          type: 'number',
          initialValue: 0
        }),
        defineField({
          name: 'lastDownloadAt',
          title: 'Last Download',
          type: 'datetime'
        })
      ]
    })
  ],
  preview: {
    select: {
      userName: 'user.name',
      passType: 'passType',
      status: 'status',
      amount: 'pricing.amount'
    },
    prepare(selection) {
      const { userName, passType, status, amount } = selection
      const price = amount ? `$${(amount / 100).toFixed(2)}` : 'Free'

      return {
        title: `${passType} Pass - ${userName}`,
        subtitle: `${status} • ${price}`,
        media: null
      }
    }
  }
})
