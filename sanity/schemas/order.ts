import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'order',
  title: 'Order',
  type: 'document',
  fields: [
    defineField({
      name: 'orderNumber',
      title: 'Order Number',
      type: 'string',
      description: 'Unique order identifier (auto-generated)',
      readOnly: true,
    }),
    defineField({
      name: 'user',
      title: 'Customer',
      type: 'reference',
      to: [{ type: 'user' }],
      description: 'Customer who placed the order',
    }),
    defineField({
      name: 'items',
      title: 'Order Items',
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
            }),
            defineField({
              name: 'quantity',
              title: 'Quantity',
              type: 'number',
              initialValue: 1,
            }),
            defineField({
              name: 'price',
              title: 'Unit Price',
              type: 'number',
              description: 'Price at time of purchase',
            }),
            defineField({
              name: 'salePrice',
              title: 'Sale Price',
              type: 'number',
              description: 'Discounted price if applicable',
            }),
            defineField({
              name: 'partnerCommission',
              title: 'Partner Commission',
              type: 'object',
              fields: [
                defineField({
                  name: 'rate',
                  title: 'Commission Rate (%)',
                  type: 'number',
                }),
                defineField({
                  name: 'amount',
                  title: 'Commission Amount',
                  type: 'number',
                }),
                defineField({
                  name: 'partner',
                  title: 'Partner',
                  type: 'reference',
                  to: [{ type: 'user' }],
                }),
              ],
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'orderType',
      title: 'Order Type',
      type: 'string',
      options: {
        list: [
          { title: 'One-time Purchase', value: 'purchase' },
          { title: 'Access Pass Subscription', value: 'subscription' },
          { title: 'Free Download', value: 'free' },
        ],
      },
      initialValue: 'purchase',
    }),
    defineField({
      name: 'pricing',
      title: 'Pricing Details',
      type: 'object',
      fields: [
        defineField({
          name: 'subtotal',
          title: 'Subtotal',
          type: 'number',
        }),
        defineField({
          name: 'tax',
          title: 'Tax Amount',
          type: 'number',
        }),
        defineField({
          name: 'discount',
          title: 'Discount Amount',
          type: 'number',
        }),
        defineField({
          name: 'total',
          title: 'Total Amount',
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
      name: 'status',
      title: 'Order Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Processing', value: 'processing' },
          { title: 'Completed', value: 'completed' },
          { title: 'Failed', value: 'failed' },
          { title: 'Cancelled', value: 'cancelled' },
          { title: 'Refunded', value: 'refunded' },
        ],
      },
      initialValue: 'pending',
    }),
    defineField({
      name: 'paymentDetails',
      title: 'Payment Details',
      type: 'object',
      fields: [
        defineField({
          name: 'stripePaymentIntentId',
          title: 'Stripe Payment Intent ID',
          type: 'string',
        }),
        defineField({
          name: 'paymentMethod',
          title: 'Payment Method',
          type: 'string',
          options: {
            list: [
              { title: 'Credit Card', value: 'card' },
              { title: 'PayPal', value: 'paypal' },
              { title: 'Apple Pay', value: 'apple_pay' },
              { title: 'Google Pay', value: 'google_pay' },
              { title: 'Free', value: 'free' },
            ],
          },
        }),
        defineField({
          name: 'last4',
          title: 'Card Last 4 Digits',
          type: 'string',
        }),
        defineField({
          name: 'brand',
          title: 'Card Brand',
          type: 'string',
        }),
        defineField({
          name: 'country',
          title: 'Payment Country',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'fulfillment',
      title: 'Fulfillment Details',
      type: 'object',
      fields: [
        defineField({
          name: 'downloadTokens',
          title: 'Download Tokens',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'productId',
                  title: 'Product ID',
                  type: 'string',
                }),
                defineField({
                  name: 'token',
                  title: 'Download Token',
                  type: 'string',
                }),
                defineField({
                  name: 'expiresAt',
                  title: 'Token Expires At',
                  type: 'datetime',
                }),
                defineField({
                  name: 'downloadCount',
                  title: 'Download Count',
                  type: 'number',
                  initialValue: 0,
                }),
                defineField({
                  name: 'maxDownloads',
                  title: 'Max Downloads Allowed',
                  type: 'number',
                  initialValue: 10,
                }),
              ],
            },
          ],
        }),
        defineField({
          name: 'licenseKeys',
          title: 'License Keys',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'productId',
                  title: 'Product ID',
                  type: 'string',
                }),
                defineField({
                  name: 'licenseKey',
                  title: 'License Key',
                  type: 'string',
                }),
                defineField({
                  name: 'licenseType',
                  title: 'License Type',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Standard', value: 'standard' },
                      { title: 'Extended', value: 'extended' },
                      { title: 'Enterprise', value: 'enterprise' },
                    ],
                  },
                }),
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'analytics',
      title: 'Analytics Data',
      type: 'object',
      fields: [
        defineField({
          name: 'referralSource',
          title: 'Referral Source',
          type: 'string',
          description: 'How customer found the product',
        }),
        defineField({
          name: 'userAgent',
          title: 'User Agent',
          type: 'string',
        }),
        defineField({
          name: 'ipAddress',
          title: 'IP Address',
          type: 'string',
        }),
        defineField({
          name: 'location',
          title: 'Location',
          type: 'object',
          fields: [
            defineField({
              name: 'country',
              title: 'Country',
              type: 'string',
            }),
            defineField({
              name: 'city',
              title: 'City',
              type: 'string',
            }),
            defineField({
              name: 'timezone',
              title: 'Timezone',
              type: 'string',
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'timestamps',
      title: 'Important Timestamps',
      type: 'object',
      fields: [
        defineField({
          name: 'placedAt',
          title: 'Order Placed At',
          type: 'datetime',
        }),
        defineField({
          name: 'paidAt',
          title: 'Payment Completed At',
          type: 'datetime',
        }),
        defineField({
          name: 'completedAt',
          title: 'Order Completed At',
          type: 'datetime',
        }),
        defineField({
          name: 'cancelledAt',
          title: 'Cancelled At',
          type: 'datetime',
        }),
        defineField({
          name: 'refundedAt',
          title: 'Refunded At',
          type: 'datetime',
        }),
      ],
    }),
    defineField({
      name: 'notes',
      title: 'Order Notes',
      type: 'text',
      description: 'Internal notes about this order',
    }),
  ],
  preview: {
    select: {
      title: 'orderNumber',
      subtitle: 'status',
      media: 'user.image',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: `Order ${title}`,
        subtitle: `Status: ${subtitle?.charAt(0).toUpperCase()}${subtitle?.slice(1)}`,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Order Date (Newest)',
      name: 'orderDateDesc',
      by: [{ field: '_createdAt', direction: 'desc' }],
    },
    {
      title: 'Order Date (Oldest)',
      name: 'orderDateAsc',
      by: [{ field: '_createdAt', direction: 'asc' }],
    },
    {
      title: 'Order Total (Highest)',
      name: 'totalDesc',
      by: [{ field: 'pricing.total', direction: 'desc' }],
    },
  ],
})
