import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'revenueAnalytics',
  title: 'Revenue Analytics',
  type: 'document',
  fields: [
    defineField({
      name: 'period',
      title: 'Analytics Period',
      type: 'object',
      fields: [
        defineField({
          name: 'type',
          title: 'Period Type',
          type: 'string',
          options: {
            list: [
              { title: 'Daily', value: 'daily' },
              { title: 'Weekly', value: 'weekly' },
              { title: 'Monthly', value: 'monthly' },
              { title: 'Quarterly', value: 'quarterly' },
              { title: 'Yearly', value: 'yearly' },
            ],
          },
        }),
        defineField({
          name: 'startDate',
          title: 'Period Start',
          type: 'date',
        }),
        defineField({
          name: 'endDate',
          title: 'Period End',
          type: 'date',
        }),
        defineField({
          name: 'year',
          title: 'Year',
          type: 'number',
        }),
        defineField({
          name: 'month',
          title: 'Month',
          type: 'number',
        }),
        defineField({
          name: 'week',
          title: 'Week Number',
          type: 'number',
        }),
      ],
    }),
    defineField({
      name: 'totals',
      title: 'Revenue Totals',
      type: 'object',
      fields: [
        defineField({
          name: 'grossRevenue',
          title: 'Gross Revenue',
          type: 'number',
          description: 'Total revenue before any deductions',
        }),
        defineField({
          name: 'netRevenue',
          title: 'Net Revenue',
          type: 'number',
          description: 'Revenue after processing fees and refunds',
        }),
        defineField({
          name: 'platformRevenue',
          title: 'Platform Revenue',
          type: 'number',
          description: 'Revenue retained by platform',
        }),
        defineField({
          name: 'partnerRevenue',
          title: 'Partner Revenue',
          type: 'number',
          description: 'Revenue paid to partners',
        }),
        defineField({
          name: 'refunds',
          title: 'Total Refunds',
          type: 'number',
        }),
        defineField({
          name: 'chargebacks',
          title: 'Total Chargebacks',
          type: 'number',
        }),
        defineField({
          name: 'processingFees',
          title: 'Processing Fees',
          type: 'number',
          description: 'Fees paid to payment processors',
        }),
        defineField({
          name: 'taxesCollected',
          title: 'Taxes Collected',
          type: 'number',
        }),
      ],
    }),
    defineField({
      name: 'transactions',
      title: 'Transaction Metrics',
      type: 'object',
      fields: [
        defineField({
          name: 'totalCount',
          title: 'Total Transactions',
          type: 'number',
        }),
        defineField({
          name: 'successfulCount',
          title: 'Successful Transactions',
          type: 'number',
        }),
        defineField({
          name: 'failedCount',
          title: 'Failed Transactions',
          type: 'number',
        }),
        defineField({
          name: 'refundCount',
          title: 'Refunded Transactions',
          type: 'number',
        }),
        defineField({
          name: 'averageValue',
          title: 'Average Transaction Value',
          type: 'number',
        }),
        defineField({
          name: 'medianValue',
          title: 'Median Transaction Value',
          type: 'number',
        }),
        defineField({
          name: 'successRate',
          title: 'Success Rate (%)',
          type: 'number',
        }),
      ],
    }),
    defineField({
      name: 'products',
      title: 'Product Performance',
      type: 'object',
      fields: [
        defineField({
          name: 'topSelling',
          title: 'Top Selling Products',
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
                  name: 'units',
                  title: 'Units Sold',
                  type: 'number',
                }),
                defineField({
                  name: 'revenue',
                  title: 'Revenue Generated',
                  type: 'number',
                }),
                defineField({
                  name: 'rank',
                  title: 'Rank',
                  type: 'number',
                }),
              ],
            },
          ],
        }),
        defineField({
          name: 'totalProductsSold',
          title: 'Total Products Sold',
          type: 'number',
        }),
        defineField({
          name: 'uniqueProductsSold',
          title: 'Unique Products Sold',
          type: 'number',
        }),
        defineField({
          name: 'averageProductPrice',
          title: 'Average Product Price',
          type: 'number',
        }),
      ],
    }),
    defineField({
      name: 'customers',
      title: 'Customer Metrics',
      type: 'object',
      fields: [
        defineField({
          name: 'totalCustomers',
          title: 'Total Customers',
          type: 'number',
        }),
        defineField({
          name: 'newCustomers',
          title: 'New Customers',
          type: 'number',
        }),
        defineField({
          name: 'returningCustomers',
          title: 'Returning Customers',
          type: 'number',
        }),
        defineField({
          name: 'averageLifetimeValue',
          title: 'Average Customer LTV',
          type: 'number',
        }),
        defineField({
          name: 'averageOrderValue',
          title: 'Average Order Value',
          type: 'number',
        }),
        defineField({
          name: 'repeatPurchaseRate',
          title: 'Repeat Purchase Rate (%)',
          type: 'number',
        }),
      ],
    }),
    defineField({
      name: 'partners',
      title: 'Partner Analytics',
      type: 'object',
      fields: [
        defineField({
          name: 'totalPartners',
          title: 'Total Active Partners',
          type: 'number',
        }),
        defineField({
          name: 'topEarningPartners',
          title: 'Top Earning Partners',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'partner',
                  title: 'Partner',
                  type: 'reference',
                  to: [{ type: 'user' }],
                }),
                defineField({
                  name: 'earnings',
                  title: 'Period Earnings',
                  type: 'number',
                }),
                defineField({
                  name: 'sales',
                  title: 'Sales Count',
                  type: 'number',
                }),
                defineField({
                  name: 'rank',
                  title: 'Rank',
                  type: 'number',
                }),
              ],
            },
          ],
        }),
        defineField({
          name: 'totalCommissionsPaid',
          title: 'Total Commissions Paid',
          type: 'number',
        }),
        defineField({
          name: 'averageCommissionRate',
          title: 'Average Commission Rate (%)',
          type: 'number',
        }),
      ],
    }),
    defineField({
      name: 'geography',
      title: 'Geographic Distribution',
      type: 'object',
      fields: [
        defineField({
          name: 'topCountries',
          title: 'Top Countries by Revenue',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'country',
                  title: 'Country',
                  type: 'string',
                }),
                defineField({
                  name: 'revenue',
                  title: 'Revenue',
                  type: 'number',
                }),
                defineField({
                  name: 'transactions',
                  title: 'Transaction Count',
                  type: 'number',
                }),
                defineField({
                  name: 'percentage',
                  title: 'Percentage of Total',
                  type: 'number',
                }),
              ],
            },
          ],
        }),
        defineField({
          name: 'totalCountries',
          title: 'Total Countries Served',
          type: 'number',
        }),
      ],
    }),
    defineField({
      name: 'paymentMethods',
      title: 'Payment Method Analytics',
      type: 'object',
      fields: [
        defineField({
          name: 'breakdown',
          title: 'Payment Method Breakdown',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'method',
                  title: 'Payment Method',
                  type: 'string',
                }),
                defineField({
                  name: 'revenue',
                  title: 'Revenue',
                  type: 'number',
                }),
                defineField({
                  name: 'count',
                  title: 'Transaction Count',
                  type: 'number',
                }),
                defineField({
                  name: 'percentage',
                  title: 'Percentage of Total',
                  type: 'number',
                }),
                defineField({
                  name: 'successRate',
                  title: 'Success Rate (%)',
                  type: 'number',
                }),
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'trends',
      title: 'Trend Analysis',
      type: 'object',
      fields: [
        defineField({
          name: 'revenueGrowth',
          title: 'Revenue Growth (%)',
          type: 'number',
          description: 'Compared to previous period',
        }),
        defineField({
          name: 'transactionGrowth',
          title: 'Transaction Growth (%)',
          type: 'number',
        }),
        defineField({
          name: 'customerGrowth',
          title: 'Customer Growth (%)',
          type: 'number',
        }),
        defineField({
          name: 'averageOrderValueTrend',
          title: 'AOV Trend (%)',
          type: 'number',
        }),
        defineField({
          name: 'projectedRevenue',
          title: 'Projected Next Period Revenue',
          type: 'number',
        }),
      ],
    }),
    defineField({
      name: 'metadata',
      title: 'Metadata',
      type: 'object',
      fields: [
        defineField({
          name: 'generatedAt',
          title: 'Generated At',
          type: 'datetime',
        }),
        defineField({
          name: 'generatedBy',
          title: 'Generated By',
          type: 'string',
          initialValue: 'system',
        }),
        defineField({
          name: 'dataSource',
          title: 'Data Source',
          type: 'string',
          options: {
            list: [
              { title: 'Live Transactions', value: 'live' },
              { title: 'Demo Data', value: 'demo' },
              { title: 'Imported Data', value: 'imported' },
            ],
          },
        }),
        defineField({
          name: 'version',
          title: 'Schema Version',
          type: 'string',
          initialValue: '1.0',
        }),
      ],
    }),
  ],
  preview: {
    select: {
      type: 'period.type',
      startDate: 'period.startDate',
      revenue: 'totals.grossRevenue',
    },
    prepare({ type, startDate, revenue }) {
      return {
        title: `${type?.charAt(0).toUpperCase()}${type?.slice(1)} Analytics`,
        subtitle: `${startDate} - Revenue: $${revenue?.toLocaleString() || 0}`,
      }
    },
  },
  orderings: [
    {
      title: 'Period (Newest)',
      name: 'periodDesc',
      by: [{ field: 'period.startDate', direction: 'desc' }],
    },
    {
      title: 'Revenue (Highest)',
      name: 'revenueDesc',
      by: [{ field: 'totals.grossRevenue', direction: 'desc' }],
    },
  ],
})
