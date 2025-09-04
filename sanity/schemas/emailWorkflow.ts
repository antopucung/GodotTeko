export default {
  name: 'emailWorkflow',
  title: 'Email Workflow',
  type: 'document',
  fields: [
    {
      name: 'workflowId',
      title: 'Workflow ID',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'Unique workflow identifier'
    },
    {
      name: 'name',
      title: 'Workflow Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'Descriptive name for the workflow'
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Detailed description of the workflow purpose'
    },
    {
      name: 'type',
      title: 'Workflow Type',
      type: 'string',
      options: {
        list: [
          { title: 'Welcome Series', value: 'welcome' },
          { title: 'Abandoned Cart', value: 'abandoned_cart' },
          { title: 'Post Purchase', value: 'post_purchase' },
          { title: 'Re-engagement', value: 're_engagement' },
          { title: 'Newsletter', value: 'newsletter' },
          { title: 'Product Launch', value: 'product_launch' },
          { title: 'Birthday/Anniversary', value: 'special_occasion' },
          { title: 'Subscription Management', value: 'subscription' },
          { title: 'Custom', value: 'custom' }
        ]
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Active', value: 'active' },
          { title: 'Paused', value: 'paused' },
          { title: 'Archived', value: 'archived' }
        ]
      },
      validation: (Rule: any) => Rule.required(),
      initialValue: 'draft'
    },
    {
      name: 'trigger',
      title: 'Workflow Trigger',
      type: 'object',
      fields: [
        {
          name: 'type',
          title: 'Trigger Type',
          type: 'string',
          options: {
            list: [
              { title: 'User Signup', value: 'user_signup' },
              { title: 'Cart Abandonment', value: 'cart_abandoned' },
              { title: 'Purchase Complete', value: 'purchase_complete' },
              { title: 'Product View', value: 'product_view' },
              { title: 'Download Complete', value: 'download_complete' },
              { title: 'No Activity', value: 'no_activity' },
              { title: 'Date/Time', value: 'scheduled' },
              { title: 'Subscription Started', value: 'subscription_started' },
              { title: 'Subscription Renewed', value: 'subscription_renewed' },
              { title: 'Subscription Expiring', value: 'subscription_expiring' },
              { title: 'Subscription Expired', value: 'subscription_expired' },
              { title: 'Subscription Cancelled', value: 'subscription_cancelled' },
              { title: 'Subscription Upgrade', value: 'subscription_upgrade' },
              { title: 'Subscription Downgrade', value: 'subscription_downgrade' },
              { title: 'Custom Event', value: 'custom_event' }
            ]
          },
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'conditions',
          title: 'Trigger Conditions',
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
                      { title: 'User Role', value: 'user.role' },
                      { title: 'User Country', value: 'user.country' },
                      { title: 'Cart Value', value: 'cart.total' },
                      { title: 'Product Category', value: 'product.category' },
                      { title: 'Days Since Signup', value: 'user.daysSinceSignup' },
                      { title: 'Purchase History', value: 'user.purchaseCount' },
                      { title: 'Last Activity', value: 'user.lastActivity' },
                      { title: 'Subscription Plan', value: 'subscription.planId' },
                      { title: 'Subscription Status', value: 'subscription.status' },
                      { title: 'Days Until Expiry', value: 'subscription.daysUntilExpiry' },
                      { title: 'Subscription Duration', value: 'subscription.duration' },
                      { title: 'Downloads Used', value: 'subscription.downloadsUsed' }
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
                      { title: 'Not Contains', value: 'not_contains' }
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
          name: 'delay',
          title: 'Initial Delay',
          type: 'object',
          fields: [
            {
              name: 'amount',
              title: 'Delay Amount',
              type: 'number',
              validation: (Rule: any) => Rule.min(0)
            },
            {
              name: 'unit',
              title: 'Time Unit',
              type: 'string',
              options: {
                list: [
                  { title: 'Minutes', value: 'minutes' },
                  { title: 'Hours', value: 'hours' },
                  { title: 'Days', value: 'days' },
                  { title: 'Weeks', value: 'weeks' }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      name: 'steps',
      title: 'Workflow Steps',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'stepId',
              title: 'Step ID',
              type: 'string',
              validation: (Rule: any) => Rule.required()
            },
            {
              name: 'name',
              title: 'Step Name',
              type: 'string',
              validation: (Rule: any) => Rule.required()
            },
            {
              name: 'type',
              title: 'Step Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Send Email', value: 'send_email' },
                  { title: 'Wait/Delay', value: 'wait' },
                  { title: 'Condition Check', value: 'condition' },
                  { title: 'Add Tag', value: 'add_tag' },
                  { title: 'Remove Tag', value: 'remove_tag' },
                  { title: 'End Workflow', value: 'end' }
                ]
              },
              validation: (Rule: any) => Rule.required()
            },
            {
              name: 'position',
              title: 'Position',
              type: 'object',
              fields: [
                {
                  name: 'x',
                  title: 'X Position',
                  type: 'number'
                },
                {
                  name: 'y',
                  title: 'Y Position',
                  type: 'number'
                }
              ]
            },
            {
              name: 'emailTemplate',
              title: 'Email Template',
              type: 'reference',
              to: [{ type: 'emailTemplate' }],
              hidden: ({ parent }: any) => parent?.type !== 'send_email'
            },
            {
              name: 'delay',
              title: 'Delay Settings',
              type: 'object',
              hidden: ({ parent }: any) => parent?.type !== 'wait',
              fields: [
                {
                  name: 'amount',
                  title: 'Delay Amount',
                  type: 'number',
                  validation: (Rule: any) => Rule.min(0)
                },
                {
                  name: 'unit',
                  title: 'Time Unit',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Minutes', value: 'minutes' },
                      { title: 'Hours', value: 'hours' },
                      { title: 'Days', value: 'days' },
                      { title: 'Weeks', value: 'weeks' }
                    ]
                  }
                }
              ]
            },
            {
              name: 'conditions',
              title: 'Conditions',
              type: 'array',
              hidden: ({ parent }: any) => parent?.type !== 'condition',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'field',
                      title: 'Field to Check',
                      type: 'string'
                    },
                    {
                      name: 'operator',
                      title: 'Operator',
                      type: 'string',
                      options: {
                        list: [
                          { title: 'Equals', value: 'equals' },
                          { title: 'Greater Than', value: 'greater_than' },
                          { title: 'Less Than', value: 'less_than' },
                          { title: 'Contains', value: 'contains' }
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
              name: 'tags',
              title: 'Tags to Add/Remove',
              type: 'array',
              of: [{ type: 'string' }],
              hidden: ({ parent }: any) => !['add_tag', 'remove_tag'].includes(parent?.type)
            },
            {
              name: 'nextSteps',
              title: 'Next Steps',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'stepId',
                      title: 'Next Step ID',
                      type: 'string'
                    },
                    {
                      name: 'condition',
                      title: 'Condition',
                      type: 'string',
                      options: {
                        list: [
                          { title: 'Always', value: 'always' },
                          { title: 'If True', value: 'if_true' },
                          { title: 'If False', value: 'if_false' }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'type'
            }
          }
        }
      ]
    },
    {
      name: 'segmentation',
      title: 'Audience Segmentation',
      type: 'object',
      fields: [
        {
          name: 'targetAudience',
          title: 'Target Audience',
          type: 'string',
          options: {
            list: [
              { title: 'All Users', value: 'all' },
              { title: 'New Users', value: 'new_users' },
              { title: 'Existing Customers', value: 'existing_customers' },
              { title: 'Partners', value: 'partners' },
              { title: 'Custom Segment', value: 'custom' }
            ]
          }
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
                  title: 'User Field',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Role', value: 'role' },
                      { title: 'Country', value: 'country' },
                      { title: 'Purchase Count', value: 'purchaseCount' },
                      { title: 'Total Spent', value: 'totalSpent' },
                      { title: 'Days Since Signup', value: 'daysSinceSignup' },
                      { title: 'Last Activity', value: 'lastActivity' }
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
                      { title: 'Greater Than', value: 'greater_than' },
                      { title: 'Less Than', value: 'less_than' },
                      { title: 'In', value: 'in' }
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
        }
      ]
    },
    {
      name: 'settings',
      title: 'Workflow Settings',
      type: 'object',
      fields: [
        {
          name: 'maxExecutions',
          title: 'Maximum Executions per User',
          type: 'number',
          description: 'How many times this workflow can run for the same user',
          initialValue: 1
        },
        {
          name: 'cooldownPeriod',
          title: 'Cooldown Period (days)',
          type: 'number',
          description: 'Minimum days between workflow executions for the same user',
          initialValue: 0
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
          name: 'abTesting',
          title: 'A/B Testing',
          type: 'object',
          fields: [
            {
              name: 'enabled',
              title: 'Enable A/B Testing',
              type: 'boolean',
              initialValue: false
            },
            {
              name: 'splitPercentage',
              title: 'Split Percentage',
              type: 'number',
              validation: (Rule: any) => Rule.min(0).max(100),
              initialValue: 50
            },
            {
              name: 'testDuration',
              title: 'Test Duration (days)',
              type: 'number',
              initialValue: 7
            }
          ]
        }
      ]
    },
    {
      name: 'analytics',
      title: 'Workflow Analytics',
      type: 'object',
      fields: [
        {
          name: 'totalExecutions',
          title: 'Total Executions',
          type: 'number',
          readOnly: true,
          initialValue: 0
        },
        {
          name: 'activeUsers',
          title: 'Currently Active Users',
          type: 'number',
          readOnly: true,
          initialValue: 0
        },
        {
          name: 'completionRate',
          title: 'Completion Rate (%)',
          type: 'number',
          readOnly: true,
          initialValue: 0
        },
        {
          name: 'averageOpenRate',
          title: 'Average Open Rate (%)',
          type: 'number',
          readOnly: true,
          initialValue: 0
        },
        {
          name: 'averageClickRate',
          title: 'Average Click Rate (%)',
          type: 'number',
          readOnly: true,
          initialValue: 0
        },
        {
          name: 'revenueGenerated',
          title: 'Revenue Generated',
          type: 'number',
          readOnly: true,
          initialValue: 0
        },
        {
          name: 'lastUpdated',
          title: 'Analytics Last Updated',
          type: 'datetime',
          readOnly: true
        }
      ]
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
          name: 'version',
          title: 'Version',
          type: 'number',
          initialValue: 1
        },
        {
          name: 'tags',
          title: 'Workflow Tags',
          type: 'array',
          of: [{ type: 'string' }]
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'type',
      status: 'status',
      executions: 'analytics.totalExecutions',
      openRate: 'analytics.averageOpenRate'
    },
    prepare(selection: any) {
      const { title, subtitle, status, executions, openRate } = selection
      const statusIcon = {
        draft: '📝',
        active: '✅',
        paused: '⏸️',
        archived: '📦'
      }[status] || '📧'

      const typeLabel = {
        welcome: 'Welcome',
        abandoned_cart: 'Cart Recovery',
        post_purchase: 'Post Purchase',
        re_engagement: 'Re-engagement',
        newsletter: 'Newsletter',
        product_launch: 'Product Launch',
        special_occasion: 'Special',
        custom: 'Custom'
      }[subtitle] || subtitle

      return {
        title: title || 'Email Workflow',
        subtitle: `${statusIcon} ${typeLabel} • ${executions || 0} executions • ${openRate || 0}% open rate`,
        media: '📧'
      }
    }
  },
  orderings: [
    {
      title: 'Created Date (Newest)',
      name: 'createdDesc',
      by: [{ field: 'metadata.createdAt', direction: 'desc' }]
    },
    {
      title: 'Name (A-Z)',
      name: 'nameAsc',
      by: [{ field: 'name', direction: 'asc' }]
    },
    {
      title: 'Status',
      name: 'statusAsc',
      by: [{ field: 'status', direction: 'asc' }]
    },
    {
      title: 'Executions (Most)',
      name: 'executionsDesc',
      by: [{ field: 'analytics.totalExecutions', direction: 'desc' }]
    }
  ]
}
