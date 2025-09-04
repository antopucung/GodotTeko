import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'subscriptionPlan',
  title: 'Subscription Plans',
  type: 'document',
  fields: [
    defineField({
      name: 'planId',
      title: 'Plan ID',
      type: 'string',
      description: 'Unique identifier for the plan (e.g., student, individual, professional, team)',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'name',
      title: 'Plan Name',
      type: 'string',
      description: 'Display name for the plan (e.g., Student, Individual, Professional, Team)',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Brief description of the plan and who it\'s for'
    }),
    defineField({
      name: 'price',
      title: 'Current Price',
      type: 'number',
      description: 'Current price in USD',
      validation: Rule => Rule.required().min(0)
    }),
    defineField({
      name: 'originalPrice',
      title: 'Original Price',
      type: 'number',
      description: 'Original price (before discount) in USD',
      validation: Rule => Rule.required().min(0)
    }),
    defineField({
      name: 'period',
      title: 'Billing Period Display',
      type: 'string',
      description: 'Human-readable billing period (e.g., "per month", "per year")',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'billingCycle',
      title: 'Billing Cycle',
      type: 'string',
      options: {
        list: [
          { title: 'Monthly', value: 'monthly' },
          { title: 'Quarterly', value: 'quarterly' },
          { title: 'Yearly', value: 'yearly' },
          { title: 'One-time', value: 'one-time' }
        ]
      },
      description: 'How often the user is charged',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'downloadLimit',
      title: 'Downloads Per Month',
      type: 'number',
      description: 'Number of downloads allowed per month',
      validation: Rule => Rule.required().min(1)
    }),
    defineField({
      name: 'trialDays',
      title: 'Trial Period (Days)',
      type: 'number',
      description: 'Number of free trial days (0 for no trial)',
      validation: Rule => Rule.min(0).max(90),
      initialValue: 0
    }),
    defineField({
      name: 'planGroup',
      title: 'Plan Group',
      type: 'string',
      description: 'Groups related plans together (e.g., "student", "individual") for monthly/yearly variants',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'targetAudience',
      title: 'Target Audience',
      type: 'string',
      description: 'Who this plan is designed for (e.g., "Students, beginners")'
    }),
    defineField({
      name: 'features',
      title: 'Plan Features',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'List of features included in this plan (simple text list)'
    }),
    defineField({
      name: 'highlighted',
      title: 'Highlighted Plan',
      type: 'boolean',
      description: 'Mark this plan as featured/recommended',
      initialValue: false
    }),
    defineField({
      name: 'badge',
      title: 'Badge Text',
      type: 'string',
      description: 'Optional badge text (e.g., "Best Value", "Most Popular")'
    }),
    defineField({
      name: 'enabled',
      title: 'Plan Enabled',
      type: 'boolean',
      description: 'Whether this plan is active and visible to users',
      initialValue: true
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      description: 'Order in which plans appear (lower numbers appear first)',
      initialValue: 0
    }),
    defineField({
      name: 'metadata',
      title: 'Metadata',
      type: 'object',
      fields: [
        {
          name: 'stripePriceId',
          title: 'Stripe Price ID',
          type: 'string',
          description: 'Stripe price ID for payment processing'
        },
        {
          name: 'paypalPlanId',
          title: 'PayPal Plan ID',
          type: 'string',
          description: 'PayPal subscription plan ID'
        },
        {
          name: 'maxUsers',
          title: 'Maximum Users',
          type: 'number',
          description: 'Maximum number of users for this plan',
          initialValue: 1
        },
        {
          name: 'renewalDiscount',
          title: 'Renewal Discount (%)',
          type: 'number',
          description: 'Discount percentage for renewals',
          validation: Rule => Rule.min(0).max(100)
        },
        {
          name: 'createdAt',
          title: 'Created At',
          type: 'datetime',
          description: 'When this plan was created'
        },
        {
          name: 'createdBy',
          title: 'Created By',
          type: 'string',
          description: 'Who created this plan'
        },
        {
          name: 'version',
          title: 'Version',
          type: 'number',
          description: 'Plan version number',
          initialValue: 1
        },
        {
          name: 'autoSeeded',
          title: 'Auto Seeded',
          type: 'boolean',
          description: 'Whether this plan was automatically created',
          initialValue: false
        }
      ]
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'period',
      price: 'price',
      enabled: 'enabled',
      highlighted: 'highlighted'
    },
    prepare(selection) {
      const { title, subtitle, price, enabled, highlighted } = selection
      return {
        title: `${title} - $${price}`,
        subtitle: `${subtitle} ${enabled ? '✅' : '❌'} ${highlighted ? '⭐' : ''}`,
        media: enabled ? (highlighted ? '🌟' : '💎') : '💤'
      }
    }
  },
  orderings: [
    {
      title: 'Sort Order',
      name: 'sortOrder',
      by: [{ field: 'sortOrder', direction: 'asc' }]
    },
    {
      title: 'Price (Low to High)',
      name: 'priceAsc',
      by: [{ field: 'price', direction: 'asc' }]
    },
    {
      title: 'Price (High to Low)',
      name: 'priceDesc',
      by: [{ field: 'price', direction: 'desc' }]
    },
    {
      title: 'Target Audience',
      name: 'audience',
      by: [{ field: 'targetAudience', direction: 'asc' }]
    }
  ]
})
