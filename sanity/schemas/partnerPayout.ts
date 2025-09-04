export default {
  name: 'partnerPayout',
  title: 'Partner Payout',
  type: 'document',
  fields: [
    {
      name: 'payoutId',
      title: 'Payout ID',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'Unique payout identifier'
    },
    {
      name: 'partner',
      title: 'Partner',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule: any) => Rule.required(),
      description: 'Partner receiving the payout'
    },
    {
      name: 'period',
      title: 'Payout Period',
      type: 'object',
      fields: [
        {
          name: 'type',
          title: 'Period Type',
          type: 'string',
          options: {
            list: [
              { title: 'Weekly', value: 'weekly' },
              { title: 'Bi-weekly', value: 'biweekly' },
              { title: 'Monthly', value: 'monthly' },
              { title: 'Quarterly', value: 'quarterly' },
              { title: 'Manual', value: 'manual' }
            ]
          },
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'startDate',
          title: 'Period Start',
          type: 'date',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'endDate',
          title: 'Period End',
          type: 'date',
          validation: (Rule: any) => Rule.required()
        }
      ]
    },
    {
      name: 'earnings',
      title: 'Earnings Breakdown',
      type: 'object',
      fields: [
        {
          name: 'grossEarnings',
          title: 'Gross Earnings',
          type: 'number',
          validation: (Rule: any) => Rule.required().min(0),
          description: 'Total commission before deductions'
        },
        {
          name: 'totalTransactions',
          title: 'Total Transactions',
          type: 'number',
          validation: (Rule: any) => Rule.required().min(0)
        },
        {
          name: 'averageCommissionRate',
          title: 'Average Commission Rate (%)',
          type: 'number',
          validation: (Rule: any) => Rule.min(0).max(100)
        },
        {
          name: 'topProducts',
          title: 'Top Earning Products',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'product',
                  title: 'Product',
                  type: 'reference',
                  to: [{ type: 'product' }]
                },
                {
                  name: 'sales',
                  title: 'Sales Count',
                  type: 'number'
                },
                {
                  name: 'earnings',
                  title: 'Earnings',
                  type: 'number'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'deductions',
      title: 'Deductions',
      type: 'object',
      fields: [
        {
          name: 'platformFees',
          title: 'Platform Fees',
          type: 'number',
          initialValue: 0
        },
        {
          name: 'chargebacks',
          title: 'Chargeback Deductions',
          type: 'number',
          initialValue: 0
        },
        {
          name: 'refunds',
          title: 'Refund Deductions',
          type: 'number',
          initialValue: 0
        },
        {
          name: 'adjustments',
          title: 'Manual Adjustments',
          type: 'number',
          initialValue: 0
        },
        {
          name: 'taxes',
          title: 'Tax Withholdings',
          type: 'number',
          initialValue: 0
        }
      ]
    },
    {
      name: 'netPayout',
      title: 'Net Payout Amount',
      type: 'number',
      validation: (Rule: any) => Rule.required(),
      description: 'Final amount to be paid out'
    },
    {
      name: 'currency',
      title: 'Currency',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      initialValue: 'USD'
    },
    {
      name: 'status',
      title: 'Payout Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Processing', value: 'processing' },
          { title: 'Completed', value: 'completed' },
          { title: 'Failed', value: 'failed' },
          { title: 'Cancelled', value: 'cancelled' },
          { title: 'On Hold', value: 'on_hold' }
        ]
      },
      validation: (Rule: any) => Rule.required(),
      initialValue: 'pending'
    },
    {
      name: 'paymentMethod',
      title: 'Payment Method',
      type: 'object',
      fields: [
        {
          name: 'type',
          title: 'Payment Type',
          type: 'string',
          options: {
            list: [
              { title: 'Bank Transfer', value: 'bank_transfer' },
              { title: 'PayPal', value: 'paypal' },
              { title: 'Stripe Transfer', value: 'stripe' },
              { title: 'Check', value: 'check' },
              { title: 'Wire Transfer', value: 'wire' }
            ]
          }
        },
        {
          name: 'details',
          title: 'Payment Details',
          type: 'object',
          fields: [
            {
              name: 'accountNumber',
              title: 'Account Number (Last 4)',
              type: 'string'
            },
            {
              name: 'routingNumber',
              title: 'Routing Number',
              type: 'string'
            },
            {
              name: 'paypalEmail',
              title: 'PayPal Email',
              type: 'string'
            },
            {
              name: 'reference',
              title: 'Payment Reference',
              type: 'string'
            }
          ]
        }
      ]
    },
    {
      name: 'processing',
      title: 'Processing Information',
      type: 'object',
      fields: [
        {
          name: 'processedAt',
          title: 'Processed At',
          type: 'datetime'
        },
        {
          name: 'processedBy',
          title: 'Processed By',
          type: 'reference',
          to: [{ type: 'user' }]
        },
        {
          name: 'externalTransactionId',
          title: 'External Transaction ID',
          type: 'string',
          description: 'ID from payment processor'
        },
        {
          name: 'estimatedArrival',
          title: 'Estimated Arrival Date',
          type: 'date'
        },
        {
          name: 'actualArrival',
          title: 'Actual Arrival Date',
          type: 'date'
        }
      ]
    },
    {
      name: 'taxInfo',
      title: 'Tax Information',
      type: 'object',
      fields: [
        {
          name: 'taxYear',
          title: 'Tax Year',
          type: 'number'
        },
        {
          name: 'taxWithheld',
          title: 'Tax Withheld',
          type: 'number'
        },
        {
          name: 'form1099Required',
          title: '1099 Form Required',
          type: 'boolean'
        },
        {
          name: 'form1099Generated',
          title: '1099 Form Generated',
          type: 'boolean'
        },
        {
          name: 'form1099SentAt',
          title: '1099 Form Sent At',
          type: 'datetime'
        }
      ]
    },
    {
      name: 'notes',
      title: 'Payout Notes',
      type: 'text',
      description: 'Internal notes about this payout'
    },
    {
      name: 'metadata',
      title: 'Metadata',
      type: 'object',
      fields: [
        {
          name: 'createdAt',
          title: 'Created At',
          type: 'datetime',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'createdBy',
          title: 'Created By',
          type: 'reference',
          to: [{ type: 'user' }]
        },
        {
          name: 'lastModifiedAt',
          title: 'Last Modified At',
          type: 'datetime'
        },
        {
          name: 'isRecurring',
          title: 'Is Recurring Payout',
          type: 'boolean',
          initialValue: true
        },
        {
          name: 'recurringSchedule',
          title: 'Recurring Schedule',
          type: 'string',
          description: 'Cron-like schedule for recurring payouts'
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'partner.name',
      subtitle: 'status',
      amount: 'netPayout',
      currency: 'currency',
      period: 'period.type',
      endDate: 'period.endDate'
    },
    prepare(selection: any) {
      const { title, subtitle, amount, currency, period, endDate } = selection
      const statusIcon = {
        pending: '⏳',
        processing: '⚙️',
        completed: '✅',
        failed: '❌',
        cancelled: '🚫',
        on_hold: '⏸️'
      }[subtitle] || '📄'

      return {
        title: title || 'Partner Payout',
        subtitle: `${statusIcon} ${subtitle} • ${currency} ${amount?.toLocaleString() || 0} • ${period} • ${endDate}`,
        media: '💰'
      }
    }
  },
  orderings: [
    {
      title: 'Payout Date (Newest)',
      name: 'dateDesc',
      by: [{ field: 'period.endDate', direction: 'desc' }]
    },
    {
      title: 'Amount (Highest)',
      name: 'amountDesc',
      by: [{ field: 'netPayout', direction: 'desc' }]
    },
    {
      title: 'Status',
      name: 'statusAsc',
      by: [{ field: 'status', direction: 'asc' }]
    },
    {
      title: 'Partner Name',
      name: 'partnerAsc',
      by: [{ field: 'partner.name', direction: 'asc' }]
    }
  ]
}
