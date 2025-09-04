export default {
  name: 'taxReport',
  title: 'Tax Report',
  type: 'document',
  fields: [
    {
      name: 'reportId',
      title: 'Report ID',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'Unique tax report identifier'
    },
    {
      name: 'reportType',
      title: 'Report Type',
      type: 'string',
      options: {
        list: [
          { title: 'Sales Tax Summary', value: 'sales_tax' },
          { title: 'VAT Report', value: 'vat' },
          { title: '1099 Report', value: '1099' },
          { title: 'Income Summary', value: 'income' },
          { title: 'Quarterly Tax', value: 'quarterly' },
          { title: 'Annual Tax', value: 'annual' },
          { title: 'State Tax', value: 'state' },
          { title: 'International Tax', value: 'international' }
        ]
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'period',
      title: 'Reporting Period',
      type: 'object',
      fields: [
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
        },
        {
          name: 'taxYear',
          title: 'Tax Year',
          type: 'number',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'quarter',
          title: 'Quarter (if applicable)',
          type: 'number',
          options: {
            list: [
              { title: 'Q1', value: 1 },
              { title: 'Q2', value: 2 },
              { title: 'Q3', value: 3 },
              { title: 'Q4', value: 4 }
            ]
          }
        }
      ]
    },
    {
      name: 'jurisdiction',
      title: 'Tax Jurisdiction',
      type: 'object',
      fields: [
        {
          name: 'country',
          title: 'Country',
          type: 'string',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'state',
          title: 'State/Province',
          type: 'string'
        },
        {
          name: 'city',
          title: 'City',
          type: 'string'
        },
        {
          name: 'taxIdNumber',
          title: 'Tax ID Number',
          type: 'string'
        }
      ]
    },
    {
      name: 'summary',
      title: 'Tax Summary',
      type: 'object',
      fields: [
        {
          name: 'totalRevenue',
          title: 'Total Revenue',
          type: 'number',
          validation: (Rule: any) => Rule.required().min(0)
        },
        {
          name: 'taxableRevenue',
          title: 'Taxable Revenue',
          type: 'number',
          validation: (Rule: any) => Rule.required().min(0)
        },
        {
          name: 'totalTaxCollected',
          title: 'Total Tax Collected',
          type: 'number',
          validation: (Rule: any) => Rule.min(0)
        },
        {
          name: 'totalTaxOwed',
          title: 'Total Tax Owed',
          type: 'number',
          validation: (Rule: any) => Rule.min(0)
        },
        {
          name: 'netTaxLiability',
          title: 'Net Tax Liability',
          type: 'number'
        },
        {
          name: 'currency',
          title: 'Currency',
          type: 'string',
          validation: (Rule: any) => Rule.required(),
          initialValue: 'USD'
        }
      ]
    },
    {
      name: 'breakdown',
      title: 'Tax Breakdown',
      type: 'object',
      fields: [
        {
          name: 'salesTax',
          title: 'Sales Tax Details',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'jurisdiction',
                  title: 'Jurisdiction',
                  type: 'string'
                },
                {
                  name: 'rate',
                  title: 'Tax Rate (%)',
                  type: 'number'
                },
                {
                  name: 'taxableAmount',
                  title: 'Taxable Amount',
                  type: 'number'
                },
                {
                  name: 'taxCollected',
                  title: 'Tax Collected',
                  type: 'number'
                },
                {
                  name: 'transactionCount',
                  title: 'Transaction Count',
                  type: 'number'
                }
              ]
            }
          ]
        },
        {
          name: 'vatDetails',
          title: 'VAT Details',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'country',
                  title: 'Country',
                  type: 'string'
                },
                {
                  name: 'vatRate',
                  title: 'VAT Rate (%)',
                  type: 'number'
                },
                {
                  name: 'netSales',
                  title: 'Net Sales',
                  type: 'number'
                },
                {
                  name: 'vatAmount',
                  title: 'VAT Amount',
                  type: 'number'
                },
                {
                  name: 'vatNumber',
                  title: 'VAT Number',
                  type: 'string'
                }
              ]
            }
          ]
        },
        {
          name: 'partnerTax',
          title: 'Partner Tax Information',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'partner',
                  title: 'Partner',
                  type: 'reference',
                  to: [{ type: 'user' }]
                },
                {
                  name: 'totalEarnings',
                  title: 'Total Earnings',
                  type: 'number'
                },
                {
                  name: 'taxWithheld',
                  title: 'Tax Withheld',
                  type: 'number'
                },
                {
                  name: 'form1099Required',
                  title: '1099 Required',
                  type: 'boolean'
                },
                {
                  name: 'form1099Amount',
                  title: '1099 Amount',
                  type: 'number'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'exemptions',
      title: 'Tax Exemptions',
      type: 'object',
      fields: [
        {
          name: 'exemptTransactions',
          title: 'Exempt Transactions',
          type: 'number',
          initialValue: 0
        },
        {
          name: 'exemptAmount',
          title: 'Exempt Amount',
          type: 'number',
          initialValue: 0
        },
        {
          name: 'exemptionReasons',
          title: 'Exemption Reasons',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'reason',
                  title: 'Exemption Reason',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Non-profit organization', value: 'nonprofit' },
                      { title: 'Government entity', value: 'government' },
                      { title: 'Educational institution', value: 'education' },
                      { title: 'International customer', value: 'international' },
                      { title: 'Reseller certificate', value: 'reseller' },
                      { title: 'Other', value: 'other' }
                    ]
                  }
                },
                {
                  name: 'amount',
                  title: 'Exempt Amount',
                  type: 'number'
                },
                {
                  name: 'certificateNumber',
                  title: 'Certificate Number',
                  type: 'string'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'compliance',
      title: 'Compliance Information',
      type: 'object',
      fields: [
        {
          name: 'filingDeadline',
          title: 'Filing Deadline',
          type: 'date'
        },
        {
          name: 'paymentDue',
          title: 'Payment Due Date',
          type: 'date'
        },
        {
          name: 'filedAt',
          title: 'Filed At',
          type: 'datetime'
        },
        {
          name: 'paidAt',
          title: 'Paid At',
          type: 'datetime'
        },
        {
          name: 'confirmationNumber',
          title: 'Filing Confirmation Number',
          type: 'string'
        },
        {
          name: 'paymentReference',
          title: 'Payment Reference Number',
          type: 'string'
        }
      ]
    },
    {
      name: 'status',
      title: 'Report Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Under Review', value: 'review' },
          { title: 'Approved', value: 'approved' },
          { title: 'Filed', value: 'filed' },
          { title: 'Paid', value: 'paid' },
          { title: 'Amended', value: 'amended' },
          { title: 'Archived', value: 'archived' }
        ]
      },
      validation: (Rule: any) => Rule.required(),
      initialValue: 'draft'
    },
    {
      name: 'documents',
      title: 'Supporting Documents',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'documentType',
              title: 'Document Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Tax Return', value: 'tax_return' },
                  { title: '1099 Forms', value: '1099' },
                  { title: 'Sales Tax Return', value: 'sales_tax_return' },
                  { title: 'VAT Return', value: 'vat_return' },
                  { title: 'Supporting Schedules', value: 'schedules' },
                  { title: 'Payment Confirmation', value: 'payment_confirmation' }
                ]
              }
            },
            {
              name: 'fileName',
              title: 'File Name',
              type: 'string'
            },
            {
              name: 'fileUrl',
              title: 'File URL',
              type: 'url'
            },
            {
              name: 'generatedAt',
              title: 'Generated At',
              type: 'datetime'
            }
          ]
        }
      ]
    },
    {
      name: 'notes',
      title: 'Report Notes',
      type: 'text',
      description: 'Internal notes about this tax report'
    },
    {
      name: 'metadata',
      title: 'Metadata',
      type: 'object',
      fields: [
        {
          name: 'generatedAt',
          title: 'Generated At',
          type: 'datetime',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'generatedBy',
          title: 'Generated By',
          type: 'reference',
          to: [{ type: 'user' }]
        },
        {
          name: 'lastModifiedAt',
          title: 'Last Modified At',
          type: 'datetime'
        },
        {
          name: 'dataSource',
          title: 'Data Source',
          type: 'string',
          options: {
            list: [
              { title: 'Live Transactions', value: 'live' },
              { title: 'Demo Data', value: 'demo' },
              { title: 'Imported Data', value: 'imported' }
            ]
          }
        },
        {
          name: 'reportVersion',
          title: 'Report Version',
          type: 'string',
          initialValue: '1.0'
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'reportType',
      subtitle: 'status',
      taxYear: 'period.taxYear',
      totalTax: 'summary.totalTaxCollected',
      currency: 'summary.currency',
      jurisdiction: 'jurisdiction.country'
    },
    prepare(selection: any) {
      const { title, subtitle, taxYear, totalTax, currency, jurisdiction } = selection
      const statusIcon = {
        draft: '📝',
        review: '👀',
        approved: '✅',
        filed: '📄',
        paid: '💰',
        amended: '🔄',
        archived: '📦'
      }[subtitle] || '📋'

      const reportTypeLabel = {
        sales_tax: 'Sales Tax',
        vat: 'VAT',
        '1099': '1099',
        income: 'Income',
        quarterly: 'Quarterly',
        annual: 'Annual',
        state: 'State',
        international: 'International'
      }[title] || title

      return {
        title: `${reportTypeLabel} Report ${taxYear}`,
        subtitle: `${statusIcon} ${subtitle} • ${jurisdiction} • ${currency} ${totalTax?.toLocaleString() || 0}`,
        media: '📊'
      }
    }
  },
  orderings: [
    {
      title: 'Tax Year (Newest)',
      name: 'taxYearDesc',
      by: [{ field: 'period.taxYear', direction: 'desc' }]
    },
    {
      title: 'Generated Date (Newest)',
      name: 'generatedDesc',
      by: [{ field: 'metadata.generatedAt', direction: 'desc' }]
    },
    {
      title: 'Status',
      name: 'statusAsc',
      by: [{ field: 'status', direction: 'asc' }]
    },
    {
      title: 'Tax Amount (Highest)',
      name: 'taxAmountDesc',
      by: [{ field: 'summary.totalTaxCollected', direction: 'desc' }]
    }
  ]
}
