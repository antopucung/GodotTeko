export default {
  name: 'emailActivity',
  title: 'Email Activity',
  type: 'document',
  fields: [
    {
      name: 'activityId',
      title: 'Activity ID',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'Unique activity identifier'
    },
    {
      name: 'type',
      title: 'Activity Type',
      type: 'string',
      options: {
        list: [
          { title: 'Sent', value: 'sent' },
          { title: 'Delivered', value: 'delivered' },
          { title: 'Opened', value: 'opened' },
          { title: 'Clicked', value: 'clicked' },
          { title: 'Bounced', value: 'bounced' },
          { title: 'Unsubscribed', value: 'unsubscribed' },
          { title: 'Spam Reported', value: 'spam' },
          { title: 'Failed', value: 'failed' },
          { title: 'Deferred', value: 'deferred' }
        ]
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule: any) => Rule.required(),
      description: 'User who performed the activity'
    },
    {
      name: 'campaign',
      title: 'Email Campaign',
      type: 'reference',
      to: [{ type: 'emailCampaign' }],
      description: 'Campaign this activity belongs to'
    },
    {
      name: 'workflow',
      title: 'Email Workflow',
      type: 'reference',
      to: [{ type: 'emailWorkflow' }],
      description: 'Workflow this activity belongs to'
    },
    {
      name: 'template',
      title: 'Email Template',
      type: 'reference',
      to: [{ type: 'emailTemplate' }],
      description: 'Template used for this email'
    },
    {
      name: 'email',
      title: 'Email Details',
      type: 'object',
      fields: [
        {
          name: 'messageId',
          title: 'Message ID',
          type: 'string',
          description: 'Unique email message identifier'
        },
        {
          name: 'subject',
          title: 'Email Subject',
          type: 'string'
        },
        {
          name: 'fromEmail',
          title: 'From Email',
          type: 'string'
        },
        {
          name: 'toEmail',
          title: 'To Email',
          type: 'string'
        },
        {
          name: 'variant',
          title: 'A/B Test Variant',
          type: 'string',
          description: 'A/B test variant if applicable'
        }
      ]
    },
    {
      name: 'clickData',
      title: 'Click Data',
      type: 'object',
      hidden: ({ parent }: any) => parent?.type !== 'clicked',
      fields: [
        {
          name: 'url',
          title: 'Clicked URL',
          type: 'url'
        },
        {
          name: 'linkText',
          title: 'Link Text',
          type: 'string'
        },
        {
          name: 'linkId',
          title: 'Link ID',
          type: 'string'
        },
        {
          name: 'position',
          title: 'Link Position',
          type: 'string',
          description: 'Position of link in email (header, body, footer)'
        }
      ]
    },
    {
      name: 'bounceData',
      title: 'Bounce Data',
      type: 'object',
      hidden: ({ parent }: any) => parent?.type !== 'bounced',
      fields: [
        {
          name: 'bounceType',
          title: 'Bounce Type',
          type: 'string',
          options: {
            list: [
              { title: 'Hard Bounce', value: 'hard' },
              { title: 'Soft Bounce', value: 'soft' },
              { title: 'Block Bounce', value: 'block' }
            ]
          }
        },
        {
          name: 'bounceCode',
          title: 'Bounce Code',
          type: 'string'
        },
        {
          name: 'bounceReason',
          title: 'Bounce Reason',
          type: 'string'
        },
        {
          name: 'diagnosticInfo',
          title: 'Diagnostic Information',
          type: 'text'
        }
      ]
    },
    {
      name: 'unsubscribeData',
      title: 'Unsubscribe Data',
      type: 'object',
      hidden: ({ parent }: any) => parent?.type !== 'unsubscribed',
      fields: [
        {
          name: 'unsubscribeType',
          title: 'Unsubscribe Type',
          type: 'string',
          options: {
            list: [
              { title: 'One-click Unsubscribe', value: 'one_click' },
              { title: 'Manual Unsubscribe', value: 'manual' },
              { title: 'Global Unsubscribe', value: 'global' },
              { title: 'List Unsubscribe', value: 'list' }
            ]
          }
        },
        {
          name: 'reason',
          title: 'Unsubscribe Reason',
          type: 'string',
          options: {
            list: [
              { title: 'Too Many Emails', value: 'too_many' },
              { title: 'Not Relevant', value: 'not_relevant' },
              { title: 'Never Subscribed', value: 'never_subscribed' },
              { title: 'Inappropriate Content', value: 'inappropriate' },
              { title: 'Other', value: 'other' }
            ]
          }
        },
        {
          name: 'feedback',
          title: 'User Feedback',
          type: 'text'
        }
      ]
    },
    {
      name: 'deviceData',
      title: 'Device & Location Data',
      type: 'object',
      fields: [
        {
          name: 'userAgent',
          title: 'User Agent',
          type: 'string'
        },
        {
          name: 'device',
          title: 'Device Type',
          type: 'string',
          options: {
            list: [
              { title: 'Desktop', value: 'desktop' },
              { title: 'Mobile', value: 'mobile' },
              { title: 'Tablet', value: 'tablet' },
              { title: 'Unknown', value: 'unknown' }
            ]
          }
        },
        {
          name: 'browser',
          title: 'Browser',
          type: 'string'
        },
        {
          name: 'operatingSystem',
          title: 'Operating System',
          type: 'string'
        },
        {
          name: 'emailClient',
          title: 'Email Client',
          type: 'string',
          options: {
            list: [
              { title: 'Gmail', value: 'gmail' },
              { title: 'Outlook', value: 'outlook' },
              { title: 'Apple Mail', value: 'apple_mail' },
              { title: 'Yahoo Mail', value: 'yahoo' },
              { title: 'Thunderbird', value: 'thunderbird' },
              { title: 'Other', value: 'other' }
            ]
          }
        },
        {
          name: 'ipAddress',
          title: 'IP Address',
          type: 'string'
        },
        {
          name: 'location',
          title: 'Geographic Location',
          type: 'object',
          fields: [
            {
              name: 'country',
              title: 'Country',
              type: 'string'
            },
            {
              name: 'region',
              title: 'Region/State',
              type: 'string'
            },
            {
              name: 'city',
              title: 'City',
              type: 'string'
            },
            {
              name: 'timezone',
              title: 'Timezone',
              type: 'string'
            },
            {
              name: 'latitude',
              title: 'Latitude',
              type: 'number'
            },
            {
              name: 'longitude',
              title: 'Longitude',
              type: 'number'
            }
          ]
        }
      ]
    },
    {
      name: 'engagement',
      title: 'Engagement Metrics',
      type: 'object',
      fields: [
        {
          name: 'timeToOpen',
          title: 'Time to Open (seconds)',
          type: 'number',
          description: 'Time from send to first open'
        },
        {
          name: 'timeToClick',
          title: 'Time to Click (seconds)',
          type: 'number',
          description: 'Time from open to first click'
        },
        {
          name: 'readTime',
          title: 'Estimated Read Time (seconds)',
          type: 'number',
          description: 'Estimated time spent reading email'
        },
        {
          name: 'scrollDepth',
          title: 'Scroll Depth (%)',
          type: 'number',
          description: 'How far user scrolled through email'
        },
        {
          name: 'forwardCount',
          title: 'Forward Count',
          type: 'number',
          description: 'Number of times email was forwarded'
        },
        {
          name: 'printCount',
          title: 'Print Count',
          type: 'number',
          description: 'Number of times email was printed'
        }
      ]
    },
    {
      name: 'conversion',
      title: 'Conversion Data',
      type: 'object',
      fields: [
        {
          name: 'converted',
          title: 'Converted',
          type: 'boolean',
          initialValue: false
        },
        {
          name: 'conversionType',
          title: 'Conversion Type',
          type: 'string',
          options: {
            list: [
              { title: 'Purchase', value: 'purchase' },
              { title: 'Download', value: 'download' },
              { title: 'Signup', value: 'signup' },
              { title: 'Trial', value: 'trial' },
              { title: 'Form Submit', value: 'form_submit' },
              { title: 'Page Visit', value: 'page_visit' }
            ]
          }
        },
        {
          name: 'conversionValue',
          title: 'Conversion Value',
          type: 'number',
          description: 'Monetary value of conversion'
        },
        {
          name: 'conversionAt',
          title: 'Conversion Time',
          type: 'datetime'
        },
        {
          name: 'attributionWindow',
          title: 'Attribution Window (hours)',
          type: 'number',
          description: 'Time between email activity and conversion'
        },
        {
          name: 'orderId',
          title: 'Order ID',
          type: 'string',
          description: 'Associated order/transaction ID'
        }
      ]
    },
    {
      name: 'tracking',
      title: 'Tracking Information',
      type: 'object',
      fields: [
        {
          name: 'openTrackingEnabled',
          title: 'Open Tracking Enabled',
          type: 'boolean'
        },
        {
          name: 'clickTrackingEnabled',
          title: 'Click Tracking Enabled',
          type: 'boolean'
        },
        {
          name: 'pixelLoaded',
          title: 'Tracking Pixel Loaded',
          type: 'boolean'
        },
        {
          name: 'imagesBlocked',
          title: 'Images Blocked',
          type: 'boolean'
        },
        {
          name: 'utmParameters',
          title: 'UTM Parameters',
          type: 'object',
          fields: [
            {
              name: 'source',
              title: 'UTM Source',
              type: 'string'
            },
            {
              name: 'medium',
              title: 'UTM Medium',
              type: 'string'
            },
            {
              name: 'campaign',
              title: 'UTM Campaign',
              type: 'string'
            },
            {
              name: 'content',
              title: 'UTM Content',
              type: 'string'
            },
            {
              name: 'term',
              title: 'UTM Term',
              type: 'string'
            }
          ]
        }
      ]
    },
    {
      name: 'timestamps',
      title: 'Activity Timestamps',
      type: 'object',
      fields: [
        {
          name: 'activityAt',
          title: 'Activity Occurred At',
          type: 'datetime',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'recordedAt',
          title: 'Recorded At',
          type: 'datetime',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'processedAt',
          title: 'Processed At',
          type: 'datetime'
        }
      ]
    },
    {
      name: 'metadata',
      title: 'Activity Metadata',
      type: 'object',
      fields: [
        {
          name: 'source',
          title: 'Data Source',
          type: 'string',
          options: {
            list: [
              { title: 'Webhook', value: 'webhook' },
              { title: 'API', value: 'api' },
              { title: 'Manual', value: 'manual' },
              { title: 'Import', value: 'import' }
            ]
          }
        },
        {
          name: 'rawData',
          title: 'Raw Webhook Data',
          type: 'text',
          description: 'Original webhook/API response data'
        },
        {
          name: 'processingStatus',
          title: 'Processing Status',
          type: 'string',
          options: {
            list: [
              { title: 'Pending', value: 'pending' },
              { title: 'Processed', value: 'processed' },
              { title: 'Failed', value: 'failed' },
              { title: 'Ignored', value: 'ignored' }
            ]
          },
          initialValue: 'pending'
        },
        {
          name: 'errorMessage',
          title: 'Error Message',
          type: 'text',
          description: 'Error message if processing failed'
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'type',
      subtitle: 'user.name',
      campaign: 'campaign.name',
      activityAt: 'timestamps.activityAt',
      userEmail: 'email.toEmail'
    },
    prepare(selection: any) {
      const { title, subtitle, campaign, activityAt, userEmail } = selection
      const activityIcon = {
        sent: '📤',
        delivered: '✅',
        opened: '👁️',
        clicked: '🖱️',
        bounced: '⚠️',
        unsubscribed: '❌',
        spam: '🚫',
        failed: '💥',
        deferred: '⏳'
      }[title] || '📧'

      const date = activityAt ? new Date(activityAt).toLocaleDateString() : ''

      return {
        title: `${activityIcon} ${title?.charAt(0).toUpperCase()}${title?.slice(1)}`,
        subtitle: `${subtitle || userEmail} • ${campaign} • ${date}`,
        media: '📊'
      }
    }
  },
  orderings: [
    {
      title: 'Activity Time (Newest)',
      name: 'activityDesc',
      by: [{ field: 'timestamps.activityAt', direction: 'desc' }]
    },
    {
      title: 'Activity Type',
      name: 'typeAsc',
      by: [{ field: 'type', direction: 'asc' }]
    },
    {
      title: 'User',
      name: 'userAsc',
      by: [{ field: 'user.name', direction: 'asc' }]
    },
    {
      title: 'Campaign',
      name: 'campaignAsc',
      by: [{ field: 'campaign.name', direction: 'asc' }]
    }
  ]
}
