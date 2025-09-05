import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'transaction',
  title: 'Transaction',
  type: 'document',
  fields: [
    defineField({
      name: 'transactionId',
      title: 'Transaction ID',
      type: 'string',
      description: 'Unique transaction identifier',
      readOnly: true,
    }),
    defineField({
      name: 'order',
      title: 'Related Order',
      type: 'reference',
      to: [{ type: 'order' }],
      description: 'Order this transaction is related to',
    }),
    defineField({
      name: 'type',
      title: 'Transaction Type',
      type: 'string',
      options: {
        list: [
          { title: 'Payment', value: 'payment' },
          { title: 'Refund', value: 'refund' },
          { title: 'Partner Commission', value: 'commission' },
          { title: 'Platform Fee', value: 'platform_fee' },
          { title: 'Tax', value: 'tax' },
          { title: 'Chargeback', value: 'chargeback' },
          { title: 'Adjustment', value: 'adjustment' },
        ],
      },
    }),
    defineField({
      name: 'status',
      title: 'Transaction Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Completed', value: 'completed' },
          { title: 'Failed', value: 'failed' },
          { title: 'Cancelled', value: 'cancelled' },
          { title: 'Disputed', value: 'disputed' },
        ],
      },
      initialValue: 'pending',
    }),
    defineField({
      name: 'amount',
      title: 'Amount',
      type: 'object',
      fields: [
        defineField({
          name: 'gross',
          title: 'Gross Amount',
          type: 'number',
          description: 'Total amount before fees',
        }),
        defineField({
          name: 'net',
          title: 'Net Amount',
          type: 'number',
          description: 'Amount after fees',
        }),
        defineField({
          name: 'fees',
          title: 'Total Fees',
          type: 'number',
          description: 'Payment processing and platform fees',
        }),
        defineField({
          name: 'tax',
          title: 'Tax Amount',
          type: 'number',
        }),
        defineField({
          name: 'currency',
          title: 'Currency',
          type: 'string',
          initialValue: 'USD',
        }),
      ],
    }),
    defineField({
      name: 'participants',
      title: 'Transaction Participants',
      type: 'object',
      fields: [
        defineField({
          name: 'customer',
          title: 'Customer',
          type: 'reference',
          to: [{ type: 'user' }],
        }),
        defineField({
          name: 'partner',
          title: 'Partner (if applicable)',
          type: 'reference',
          to: [{ type: 'user' }],
        }),
        defineField({
          name: 'platform',
          title: 'Platform Share',
          type: 'object',
          fields: [
            defineField({
              name: 'amount',
              title: 'Platform Amount',
              type: 'number',
            }),
            defineField({
              name: 'percentage',
              title: 'Platform Fee %',
              type: 'number',
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'paymentProvider',
      title: 'Payment Provider Details',
      type: 'object',
      fields: [
        defineField({
          name: 'provider',
          title: 'Provider',
          type: 'string',
          options: {
            list: [
              { title: 'Stripe', value: 'stripe' },
              { title: 'PayPal', value: 'paypal' },
              { title: 'Square', value: 'square' },
              { title: 'Manual', value: 'manual' },
            ],
          },
        }),
        defineField({
          name: 'externalId',
          title: 'External Transaction ID',
          type: 'string',
          description: 'ID from payment provider (e.g., Stripe payment intent)',
        }),
        defineField({
          name: 'processingFee',
          title: 'Processing Fee',
          type: 'number',
          description: 'Fee charged by payment provider',
        }),
        defineField({
          name: 'metadata',
          title: 'Provider Metadata',
          type: 'object',
          fields: [
            defineField({
              name: 'paymentMethod',
              title: 'Payment Method',
              type: 'string',
            }),
            defineField({
              name: 'cardBrand',
              title: 'Card Brand',
              type: 'string',
            }),
            defineField({
              name: 'cardLast4',
              title: 'Card Last 4',
              type: 'string',
            }),
            defineField({
              name: 'bankAccount',
              title: 'Bank Account (for ACH)',
              type: 'string',
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'analytics',
      title: 'Analytics & Tracking',
      type: 'object',
      fields: [
        defineField({
          name: 'conversionSource',
          title: 'Conversion Source',
          type: 'string',
          description: 'Marketing channel that led to this transaction',
        }),
        defineField({
          name: 'campaignId',
          title: 'Campaign ID',
          type: 'string',
          description: 'Marketing campaign identifier',
        }),
        defineField({
          name: 'customerLifetimeValue',
          title: 'Customer LTV at Transaction',
          type: 'number',
          description: 'Customer total value at time of transaction',
        }),
        defineField({
          name: 'isFirstPurchase',
          title: 'Is First Purchase',
          type: 'boolean',
          description: 'Whether this is customer\'s first purchase',
        }),
        defineField({
          name: 'location',
          title: 'Transaction Location',
          type: 'object',
          fields: [
            defineField({
              name: 'country',
              title: 'Country',
              type: 'string',
            }),
            defineField({
              name: 'state',
              title: 'State/Province',
              type: 'string',
            }),
            defineField({
              name: 'city',
              title: 'City',
              type: 'string',
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'revenueDistribution',
      title: 'Revenue Distribution',
      type: 'object',
      description: 'How revenue is split between parties',
      fields: [
        defineField({
          name: 'partnerEarnings',
          title: 'Partner Earnings',
          type: 'number',
          description: 'Amount earned by product creator',
        }),
        defineField({
          name: 'platformEarnings',
          title: 'Platform Earnings',
          type: 'number',
          description: 'Amount earned by platform',
        }),
        defineField({
          name: 'affiliateEarnings',
          title: 'Affiliate Earnings',
          type: 'number',
          description: 'Amount earned by affiliate (if any)',
        }),
        defineField({
          name: 'taxAmount',
          title: 'Tax Collected',
          type: 'number',
        }),
        defineField({
          name: 'processingCosts',
          title: 'Processing Costs',
          type: 'number',
          description: 'Total cost of processing payment',
        }),
      ],
    }),
    defineField({
      name: 'reconciliation',
      title: 'Reconciliation Data',
      type: 'object',
      fields: [
        defineField({
          name: 'isReconciled',
          title: 'Is Reconciled',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'reconciledAt',
          title: 'Reconciled At',
          type: 'datetime',
        }),
        defineField({
          name: 'reconciledBy',
          title: 'Reconciled By',
          type: 'reference',
          to: [{ type: 'user' }],
        }),
        defineField({
          name: 'discrepancies',
          title: 'Discrepancies',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'type',
                  title: 'Discrepancy Type',
                  type: 'string',
                }),
                defineField({
                  name: 'amount',
                  title: 'Amount Difference',
                  type: 'number',
                }),
                defineField({
                  name: 'resolution',
                  title: 'Resolution',
                  type: 'text',
                }),
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'timestamps',
      title: 'Transaction Timestamps',
      type: 'object',
      fields: [
        defineField({
          name: 'initiatedAt',
          title: 'Initiated At',
          type: 'datetime',
        }),
        defineField({
          name: 'authorizedAt',
          title: 'Authorized At',
          type: 'datetime',
        }),
        defineField({
          name: 'capturedAt',
          title: 'Captured At',
          type: 'datetime',
        }),
        defineField({
          name: 'settledAt',
          title: 'Settled At',
          type: 'datetime',
        }),
        defineField({
          name: 'disputedAt',
          title: 'Disputed At',
          type: 'datetime',
        }),
      ],
    }),
    defineField({
      name: 'notes',
      title: 'Transaction Notes',
      type: 'text',
      description: 'Internal notes about this transaction',
    }),
  ],
  preview: {
    select: {
      title: 'transactionId',
      subtitle: 'type',
      amount: 'amount.gross',
      currency: 'amount.currency',
    },
    prepare({ title, subtitle, amount, currency }) {
      return {
        title: `Transaction ${title}`,
        subtitle: `${subtitle?.charAt(0).toUpperCase()}${subtitle?.slice(1)} - ${currency} ${amount?.toFixed(2)}`,
      }
    },
  },
  orderings: [
    {
      title: 'Date (Newest)',
      name: 'dateDesc',
      by: [{ field: '_createdAt', direction: 'desc' }],
    },
    {
      title: 'Amount (Highest)',
      name: 'amountDesc',
      by: [{ field: 'amount.gross', direction: 'desc' }],
    },
    {
      title: 'Status',
      name: 'status',
      by: [{ field: 'status', direction: 'asc' }],
    },
  ],
})
