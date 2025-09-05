export default {
  name: 'emailCampaign',
  title: 'Email Campaign',
  type: 'document',
  fields: [
    {
      name: 'campaignId',
      title: 'Campaign ID',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'Unique campaign identifier'
    },
    {
      name: 'name',
      title: 'Campaign Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'Descriptive name for the campaign'
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Campaign description and objectives'
    },
    {
      name: 'type',
      title: 'Campaign Type',
      type: 'string',
      options: {
        list: [
          { title: 'One-time Broadcast', value: 'broadcast' },
          { title: 'Automated Workflow', value: 'workflow' },
          { title: 'A/B Test Campaign', value: 'ab_test' },
          { title: 'Newsletter', value: 'newsletter' },
          { title: 'Promotional', value: 'promotional' },
          { title: 'Transactional', value: 'transactional' }
        ]
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'status',
      title: 'Campaign Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Scheduled', value: 'scheduled' },
          { title: 'Sending', value: 'sending' },
          { title: 'Sent', value: 'sent' },
          { title: 'Paused', value: 'paused' },
          { title: 'Cancelled', value: 'cancelled' },
          { title: 'Completed', value: 'completed' }
        ]
      },
      validation: (Rule: any) => Rule.required(),
      initialValue: 'draft'
    },
    {
      name: 'workflow',
      title: 'Associated Workflow',
      type: 'reference',
      to: [{ type: 'emailWorkflow' }],
      description: 'Link to workflow if this is an automated campaign'
    },
    {
      name: 'template',
      title: 'Email Template',
      type: 'reference',
      to: [{ type: 'emailTemplate' }],
      validation: (Rule: any) => Rule.required(),
      description: 'Template used for this campaign'
    },
    {
      name: 'audience',
      title: 'Target Audience',
      type: 'object',
      fields: [
        {
          name: 'segmentType',
          title: 'Segment Type',
          type: 'string',
          options: {
            list: [
              { title: 'All Subscribers', value: 'all' },
              { title: 'Custom Segment', value: 'custom' },
              { title: 'User List', value: 'list' },
              { title: 'Specific Users', value: 'specific' }
            ]
          },
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'filters',
          title: 'Audience Filters',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'field',
                  title: 'Field',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'User Role', value: 'role' },
                      { title: 'Country', value: 'country' },
                      { title: 'Signup Date', value: 'signupDate' },
                      { title: 'Last Purchase', value: 'lastPurchase' },
                      { title: 'Total Spent', value: 'totalSpent' },
                      { title: 'Email Engagement', value: 'emailEngagement' },
                      { title: 'Tags', value: 'tags' }
                    ]
                  }
                },
                {
                  name: 'operator',
                  title: 'Operator',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Equals', value: 'equals' },
                      { title: 'Not Equals', value: 'not_equals' },
                      { title: 'Greater Than', value: 'greater_than' },
                      { title: 'Less Than', value: 'less_than' },
                      { title: 'Contains', value: 'contains' },
                      { title: 'In', value: 'in' },
                      { title: 'Not In', value: 'not_in' }
                    ]
                  }
                },
                {
                  name: 'value',
                  title: 'Value',
                  type: 'string'
                }
              ]
            }
          ]
        },
        {
          name: 'excludeFilters',
          title: 'Exclude Filters',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'field',
                  title: 'Field',
                  type: 'string'
                },
                {
                  name: 'value',
                  title: 'Value',
                  type: 'string'
                }
              ]
            }
          ]
        },
        {
          name: 'estimatedSize',
          title: 'Estimated Audience Size',
          type: 'number',
          readOnly: true
        }
      ]
    },
    {
      name: 'scheduling',
      title: 'Campaign Scheduling',
      type: 'object',
      fields: [
        {
          name: 'sendType',
          title: 'Send Type',
          type: 'string',
          options: {
            list: [
              { title: 'Send Now', value: 'immediate' },
              { title: 'Schedule for Later', value: 'scheduled' },
              { title: 'Optimal Send Time', value: 'optimal' },
              { title: 'Triggered by Event', value: 'triggered' }
            ]
          },
          validation: (Rule: any) => Rule.required(),
          initialValue: 'immediate'
        },
        {
          name: 'scheduledAt',
          title: 'Scheduled Send Time',
          type: 'datetime',
          hidden: ({ parent }: any) => parent?.sendType !== 'scheduled'
        },
        {
          name: 'timeZone',
          title: 'Time Zone',
          type: 'string',
          options: {
            list: [
              { title: 'UTC', value: 'UTC' },
              { title: 'US/Eastern', value: 'US/Eastern' },
              { title: 'US/Pacific', value: 'US/Pacific' },
              { title: 'Europe/London', value: 'Europe/London' },
              { title: 'Asia/Tokyo', value: 'Asia/Tokyo' }
            ]
          },
          initialValue: 'UTC'
        },
        {
          name: 'sendingWindow',
          title: 'Sending Window',
          type: 'object',
          fields: [
            {
              name: 'startHour',
              title: 'Start Hour (24h)',
              type: 'number',
              validation: (Rule: any) => Rule.min(0).max(23),
              initialValue: 9
            },
            {
              name: 'endHour',
              title: 'End Hour (24h)',
              type: 'number',
              validation: (Rule: any) => Rule.min(0).max(23),
              initialValue: 17
            },
            {
              name: 'allowWeekends',
              title: 'Allow Weekend Sending',
              type: 'boolean',
              initialValue: false
            }
          ]
        },
        {
          name: 'throttling',
          title: 'Sending Throttling',
          type: 'object',
          fields: [
            {
              name: 'enabled',
              title: 'Enable Throttling',
              type: 'boolean',
              initialValue: false
            },
            {
              name: 'emailsPerHour',
              title: 'Emails per Hour',
              type: 'number',
              validation: (Rule: any) => Rule.min(1),
              initialValue: 1000
            },
            {
              name: 'emailsPerDay',
              title: 'Emails per Day',
              type: 'number',
              validation: (Rule: any) => Rule.min(1),
              initialValue: 10000
            }
          ]
        }
      ]
    },
    {
      name: 'abTesting',
      title: 'A/B Testing Configuration',
      type: 'object',
      fields: [
        {
          name: 'enabled',
          title: 'Enable A/B Testing',
          type: 'boolean',
          initialValue: false
        },
        {
          name: 'testType',
          title: 'Test Type',
          type: 'string',
          options: {
            list: [
              { title: 'Subject Line', value: 'subject' },
              { title: 'From Name', value: 'from_name' },
              { title: 'Send Time', value: 'send_time' },
              { title: 'Content', value: 'content' },
              { title: 'Template', value: 'template' }
            ]
          }
        },
        {
          name: 'variants',
          title: 'Test Variants',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'name',
                  title: 'Variant Name',
                  type: 'string'
                },
                {
                  name: 'percentage',
                  title: 'Traffic Percentage',
                  type: 'number',
                  validation: (Rule: any) => Rule.min(0).max(100)
                },
                {
                  name: 'template',
                  title: 'Template',
                  type: 'reference',
                  to: [{ type: 'emailTemplate' }]
                },
                {
                  name: 'subject',
                  title: 'Subject Line',
                  type: 'string'
                },
                {
                  name: 'fromName',
                  title: 'From Name',
                  type: 'string'
                }
              ]
            }
          ]
        },
        {
          name: 'testDuration',
          title: 'Test Duration (hours)',
          type: 'number',
          initialValue: 24
        },
        {
          name: 'winnerSelection',
          title: 'Winner Selection Criteria',
          type: 'string',
          options: {
            list: [
              { title: 'Highest Open Rate', value: 'open_rate' },
              { title: 'Highest Click Rate', value: 'click_rate' },
              { title: 'Highest Conversion Rate', value: 'conversion_rate' },
              { title: 'Highest Revenue', value: 'revenue' },
              { title: 'Manual Selection', value: 'manual' }
            ]
          },
          initialValue: 'open_rate'
        }
      ]
    },
    {
      name: 'performance',
      title: 'Campaign Performance',
      type: 'object',
      fields: [
        {
          name: 'targeting',
          title: 'Targeting Stats',
          type: 'object',
          fields: [
            {
              name: 'targetedUsers',
              title: 'Targeted Users',
              type: 'number',
              readOnly: true,
              initialValue: 0
            },
            {
              name: 'excludedUsers',
              title: 'Excluded Users',
              type: 'number',
              readOnly: true,
              initialValue: 0
            },
            {
              name: 'suppressedUsers',
              title: 'Suppressed Users',
              type: 'number',
              readOnly: true,
              initialValue: 0
            }
          ]
        },
        {
          name: 'delivery',
          title: 'Delivery Stats',
          type: 'object',
          fields: [
            {
              name: 'sent',
              title: 'Emails Sent',
              type: 'number',
              readOnly: true,
              initialValue: 0
            },
            {
              name: 'delivered',
              title: 'Emails Delivered',
              type: 'number',
              readOnly: true,
              initialValue: 0
            },
            {
              name: 'bounced',
              title: 'Bounced',
              type: 'number',
              readOnly: true,
              initialValue: 0
            },
            {
              name: 'failed',
              title: 'Failed',
              type: 'number',
              readOnly: true,
              initialValue: 0
            }
          ]
        },
        {
          name: 'engagement',
          title: 'Engagement Stats',
          type: 'object',
          fields: [
            {
              name: 'opens',
              title: 'Total Opens',
              type: 'number',
              readOnly: true,
              initialValue: 0
            },
            {
              name: 'uniqueOpens',
              title: 'Unique Opens',
              type: 'number',
              readOnly: true,
              initialValue: 0
            },
            {
              name: 'clicks',
              title: 'Total Clicks',
              type: 'number',
              readOnly: true,
              initialValue: 0
            },
            {
              name: 'uniqueClicks',
              title: 'Unique Clicks',
              type: 'number',
              readOnly: true,
              initialValue: 0
            },
            {
              name: 'unsubscribes',
              title: 'Unsubscribes',
              type: 'number',
              readOnly: true,
              initialValue: 0
            },
            {
              name: 'spamReports',
              title: 'Spam Reports',
              type: 'number',
              readOnly: true,
              initialValue: 0
            }
          ]
        },
        {
          name: 'conversions',
          title: 'Conversion Stats',
          type: 'object',
          fields: [
            {
              name: 'conversions',
              title: 'Total Conversions',
              type: 'number',
              readOnly: true,
              initialValue: 0
            },
            {
              name: 'revenue',
              title: 'Revenue Generated',
              type: 'number',
              readOnly: true,
              initialValue: 0
            },
            {
              name: 'averageOrderValue',
              title: 'Average Order Value',
              type: 'number',
              readOnly: true,
              initialValue: 0
            }
          ]
        },
        {
          name: 'rates',
          title: 'Calculated Rates',
          type: 'object',
          fields: [
            {
              name: 'deliveryRate',
              title: 'Delivery Rate (%)',
              type: 'number',
              readOnly: true,
              initialValue: 0
            },
            {
              name: 'openRate',
              title: 'Open Rate (%)',
              type: 'number',
              readOnly: true,
              initialValue: 0
            },
            {
              name: 'clickRate',
              title: 'Click Rate (%)',
              type: 'number',
              readOnly: true,
              initialValue: 0
            },
            {
              name: 'clickToOpenRate',
              title: 'Click-to-Open Rate (%)',
              type: 'number',
              readOnly: true,
              initialValue: 0
            },
            {
              name: 'conversionRate',
              title: 'Conversion Rate (%)',
              type: 'number',
              readOnly: true,
              initialValue: 0
            },
            {
              name: 'unsubscribeRate',
              title: 'Unsubscribe Rate (%)',
              type: 'number',
              readOnly: true,
              initialValue: 0
            },
            {
              name: 'spamRate',
              title: 'Spam Rate (%)',
              type: 'number',
              readOnly: true,
              initialValue: 0
            }
          ]
        }
      ]
    },
    {
      name: 'timestamps',
      title: 'Campaign Timestamps',
      type: 'object',
      fields: [
        {
          name: 'createdAt',
          title: 'Created At',
          type: 'datetime',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'scheduledAt',
          title: 'Scheduled At',
          type: 'datetime'
        },
        {
          name: 'startedAt',
          title: 'Started At',
          type: 'datetime'
        },
        {
          name: 'completedAt',
          title: 'Completed At',
          type: 'datetime'
        },
        {
          name: 'pausedAt',
          title: 'Paused At',
          type: 'datetime'
        },
        {
          name: 'cancelledAt',
          title: 'Cancelled At',
          type: 'datetime'
        }
      ]
    },
    {
      name: 'metadata',
      title: 'Campaign Metadata',
      type: 'object',
      fields: [
        {
          name: 'createdBy',
          title: 'Created By',
          type: 'reference',
          to: [{ type: 'user' }]
        },
        {
          name: 'lastModifiedBy',
          title: 'Last Modified By',
          type: 'reference',
          to: [{ type: 'user' }]
        },
        {
          name: 'tags',
          title: 'Campaign Tags',
          type: 'array',
          of: [{ type: 'string' }]
        },
        {
          name: 'notes',
          title: 'Campaign Notes',
          type: 'text'
        },
        {
          name: 'budget',
          title: 'Campaign Budget',
          type: 'number'
        },
        {
          name: 'costPerSend',
          title: 'Cost per Send',
          type: 'number'
        },
        {
          name: 'roi',
          title: 'Return on Investment',
          type: 'number',
          readOnly: true
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'type',
      status: 'status',
      sent: 'performance.delivery.sent',
      openRate: 'performance.rates.openRate'
    },
    prepare(selection: any) {
      const { title, subtitle, status, sent, openRate } = selection
      const statusIcon = {
        draft: '📝',
        scheduled: '📅',
        sending: '📤',
        sent: '✅',
        paused: '⏸️',
        cancelled: '❌',
        completed: '🏁'
      }[status] || '📧'

      const typeLabel = {
        broadcast: 'Broadcast',
        workflow: 'Workflow',
        ab_test: 'A/B Test',
        newsletter: 'Newsletter',
        promotional: 'Promotional',
        transactional: 'Transactional'
      }[subtitle] || subtitle

      return {
        title: title || 'Email Campaign',
        subtitle: `${statusIcon} ${typeLabel} • ${sent || 0} sent • ${openRate || 0}% open`,
        media: '📧'
      }
    }
  },
  orderings: [
    {
      title: 'Created Date (Newest)',
      name: 'createdDesc',
      by: [{ field: 'timestamps.createdAt', direction: 'desc' }]
    },
    {
      title: 'Campaign Name (A-Z)',
      name: 'nameAsc',
      by: [{ field: 'name', direction: 'asc' }]
    },
    {
      title: 'Status',
      name: 'statusAsc',
      by: [{ field: 'status', direction: 'asc' }]
    },
    {
      title: 'Performance (Best)',
      name: 'performanceDesc',
      by: [{ field: 'performance.rates.openRate', direction: 'desc' }]
    },
    {
      title: 'Sent Count (Most)',
      name: 'sentDesc',
      by: [{ field: 'performance.delivery.sent', direction: 'desc' }]
    }
  ]
}
