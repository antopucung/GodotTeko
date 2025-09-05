export default {
  name: 'emailTemplate',
  title: 'Email Template',
  type: 'document',
  fields: [
    {
      name: 'templateId',
      title: 'Template ID',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'Unique template identifier'
    },
    {
      name: 'name',
      title: 'Template Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'Descriptive name for the template'
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Description of template purpose and usage'
    },
    {
      name: 'category',
      title: 'Template Category',
      type: 'string',
      options: {
        list: [
          { title: 'Welcome/Onboarding', value: 'welcome' },
          { title: 'Abandoned Cart', value: 'abandoned_cart' },
          { title: 'Order Confirmation', value: 'order_confirmation' },
          { title: 'Newsletter', value: 'newsletter' },
          { title: 'Product Launch', value: 'product_launch' },
          { title: 'Re-engagement', value: 're_engagement' },
          { title: 'Promotional', value: 'promotional' },
          { title: 'Transactional', value: 'transactional' },
          { title: 'Support', value: 'support' },
          { title: 'Subscription Confirmation', value: 'subscription_confirmation' },
          { title: 'Subscription Renewal', value: 'subscription_renewal' },
          { title: 'Subscription Expiring', value: 'subscription_expiring' },
          { title: 'Subscription Cancelled', value: 'subscription_cancelled' },
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
          { title: 'Archived', value: 'archived' }
        ]
      },
      validation: (Rule: any) => Rule.required(),
      initialValue: 'draft'
    },
    {
      name: 'subject',
      title: 'Email Subject',
      type: 'object',
      fields: [
        {
          name: 'template',
          title: 'Subject Template',
          type: 'string',
          validation: (Rule: any) => Rule.required(),
          description: 'Use {{variables}} for personalization'
        },
        {
          name: 'preheader',
          title: 'Preheader Text',
          type: 'string',
          description: 'Preview text shown in email clients'
        },
        {
          name: 'abTestVariants',
          title: 'A/B Test Variants',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'variant',
                  title: 'Variant Name',
                  type: 'string'
                },
                {
                  name: 'subject',
                  title: 'Subject Line',
                  type: 'string'
                },
                {
                  name: 'weight',
                  title: 'Traffic Weight (%)',
                  type: 'number',
                  validation: (Rule: any) => Rule.min(0).max(100)
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'content',
      title: 'Email Content',
      type: 'object',
      fields: [
        {
          name: 'htmlTemplate',
          title: 'HTML Template',
          type: 'text',
          validation: (Rule: any) => Rule.required(),
          description: 'HTML email template with {{variables}} for personalization'
        },
        {
          name: 'textTemplate',
          title: 'Plain Text Template',
          type: 'text',
          description: 'Plain text version for accessibility'
        },
        {
          name: 'sections',
          title: 'Content Sections',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'sectionId',
                  title: 'Section ID',
                  type: 'string'
                },
                {
                  name: 'type',
                  title: 'Section Type',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Header', value: 'header' },
                      { title: 'Hero', value: 'hero' },
                      { title: 'Content Block', value: 'content' },
                      { title: 'Product Showcase', value: 'products' },
                      { title: 'Call to Action', value: 'cta' },
                      { title: 'Footer', value: 'footer' },
                      { title: 'Social Links', value: 'social' }
                    ]
                  }
                },
                {
                  name: 'content',
                  title: 'Section Content',
                  type: 'text'
                },
                {
                  name: 'dynamic',
                  title: 'Dynamic Content',
                  type: 'object',
                  fields: [
                    {
                      name: 'enabled',
                      title: 'Enable Dynamic Content',
                      type: 'boolean'
                    },
                    {
                      name: 'contentType',
                      title: 'Content Type',
                      type: 'string',
                      options: {
                        list: [
                          { title: 'Recommended Products', value: 'recommended_products' },
                          { title: 'Recently Viewed', value: 'recently_viewed' },
                          { title: 'Cart Items', value: 'cart_items' },
                          { title: 'User-specific Content', value: 'user_content' },
                          { title: 'Latest Products', value: 'latest_products' }
                        ]
                      }
                    },
                    {
                      name: 'limit',
                      title: 'Item Limit',
                      type: 'number',
                      initialValue: 4
                    }
                  ]
                },
                {
                  name: 'conditions',
                  title: 'Display Conditions',
                  type: 'array',
                  of: [
                    {
                      type: 'object',
                      fields: [
                        {
                          name: 'field',
                          title: 'User Field',
                          type: 'string'
                        },
                        {
                          name: 'operator',
                          title: 'Operator',
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
            }
          ]
        }
      ]
    },
    {
      name: 'design',
      title: 'Email Design',
      type: 'object',
      fields: [
        {
          name: 'theme',
          title: 'Design Theme',
          type: 'string',
          options: {
            list: [
              { title: 'Modern', value: 'modern' },
              { title: 'Classic', value: 'classic' },
              { title: 'Minimal', value: 'minimal' },
              { title: 'Bold', value: 'bold' },
              { title: 'Professional', value: 'professional' }
            ]
          },
          initialValue: 'modern'
        },
        {
          name: 'colors',
          title: 'Color Scheme',
          type: 'object',
          fields: [
            {
              name: 'primary',
              title: 'Primary Color',
              type: 'string',
              initialValue: '#3B82F6'
            },
            {
              name: 'secondary',
              title: 'Secondary Color',
              type: 'string',
              initialValue: '#10B981'
            },
            {
              name: 'background',
              title: 'Background Color',
              type: 'string',
              initialValue: '#FFFFFF'
            },
            {
              name: 'text',
              title: 'Text Color',
              type: 'string',
              initialValue: '#1F2937'
            }
          ]
        },
        {
          name: 'fonts',
          title: 'Typography',
          type: 'object',
          fields: [
            {
              name: 'heading',
              title: 'Heading Font',
              type: 'string',
              options: {
                list: [
                  { title: 'Arial', value: 'Arial, sans-serif' },
                  { title: 'Helvetica', value: 'Helvetica, sans-serif' },
                  { title: 'Georgia', value: 'Georgia, serif' },
                  { title: 'Times', value: 'Times, serif' }
                ]
              },
              initialValue: 'Arial, sans-serif'
            },
            {
              name: 'body',
              title: 'Body Font',
              type: 'string',
              options: {
                list: [
                  { title: 'Arial', value: 'Arial, sans-serif' },
                  { title: 'Helvetica', value: 'Helvetica, sans-serif' },
                  { title: 'Georgia', value: 'Georgia, serif' },
                  { title: 'Times', value: 'Times, serif' }
                ]
              },
              initialValue: 'Arial, sans-serif'
            }
          ]
        },
        {
          name: 'layout',
          title: 'Layout Settings',
          type: 'object',
          fields: [
            {
              name: 'width',
              title: 'Email Width (px)',
              type: 'number',
              initialValue: 600
            },
            {
              name: 'padding',
              title: 'Content Padding (px)',
              type: 'number',
              initialValue: 20
            },
            {
              name: 'borderRadius',
              title: 'Border Radius (px)',
              type: 'number',
              initialValue: 8
            }
          ]
        }
      ]
    },
    {
      name: 'personalization',
      title: 'Personalization Variables',
      type: 'object',
      fields: [
        {
          name: 'availableVariables',
          title: 'Available Variables',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'variable',
                  title: 'Variable Name',
                  type: 'string'
                },
                {
                  name: 'description',
                  title: 'Description',
                  type: 'string'
                },
                {
                  name: 'type',
                  title: 'Data Type',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Text', value: 'text' },
                      { title: 'Number', value: 'number' },
                      { title: 'Date', value: 'date' },
                      { title: 'Boolean', value: 'boolean' },
                      { title: 'Object', value: 'object' },
                      { title: 'Array', value: 'array' }
                    ]
                  }
                },
                {
                  name: 'defaultValue',
                  title: 'Default Value',
                  type: 'string'
                }
              ]
            }
          ],
          initialValue: [
            { variable: 'user.name', description: 'User first name', type: 'text', defaultValue: 'there' },
            { variable: 'user.email', description: 'User email address', type: 'text', defaultValue: '' },
            { variable: 'user.country', description: 'User country', type: 'text', defaultValue: '' },
            { variable: 'cart.total', description: 'Cart total amount', type: 'number', defaultValue: '0' },
            { variable: 'cart.items', description: 'Cart items array', type: 'array', defaultValue: '[]' },
            { variable: 'product.title', description: 'Product title', type: 'text', defaultValue: '' },
            { variable: 'order.number', description: 'Order number', type: 'text', defaultValue: '' },
            { variable: 'subscription.planName', description: 'Subscription plan name', type: 'text', defaultValue: '' },
            { variable: 'subscription.price', description: 'Subscription price', type: 'number', defaultValue: '0' },
            { variable: 'subscription.downloads', description: 'Daily downloads allowed', type: 'number', defaultValue: '0' },
            { variable: 'subscription.expiryDate', description: 'Subscription expiry date', type: 'date', defaultValue: '' },
            { variable: 'subscription.renewalDate', description: 'Next renewal date', type: 'date', defaultValue: '' },
            { variable: 'subscription.daysRemaining', description: 'Days until expiry', type: 'number', defaultValue: '0' },
            { variable: 'subscription.status', description: 'Subscription status', type: 'text', defaultValue: 'active' },
            { variable: 'subscription.cancelUrl', description: 'Cancellation URL', type: 'text', defaultValue: '' },
            { variable: 'subscription.manageUrl', description: 'Manage subscription URL', type: 'text', defaultValue: '' }
          ]
        },
        {
          name: 'customVariables',
          title: 'Custom Variables',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'name',
                  title: 'Variable Name',
                  type: 'string'
                },
                {
                  name: 'value',
                  title: 'Value',
                  type: 'string'
                },
                {
                  name: 'description',
                  title: 'Description',
                  type: 'string'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'tracking',
      title: 'Email Tracking',
      type: 'object',
      fields: [
        {
          name: 'trackOpens',
          title: 'Track Email Opens',
          type: 'boolean',
          initialValue: true
        },
        {
          name: 'trackClicks',
          title: 'Track Link Clicks',
          type: 'boolean',
          initialValue: true
        },
        {
          name: 'trackConversions',
          title: 'Track Conversions',
          type: 'boolean',
          initialValue: true
        },
        {
          name: 'utmParameters',
          title: 'UTM Parameters',
          type: 'object',
          fields: [
            {
              name: 'source',
              title: 'UTM Source',
              type: 'string',
              initialValue: 'email'
            },
            {
              name: 'medium',
              title: 'UTM Medium',
              type: 'string',
              initialValue: 'email'
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
            }
          ]
        }
      ]
    },
    {
      name: 'settings',
      title: 'Template Settings',
      type: 'object',
      fields: [
        {
          name: 'fromName',
          title: 'From Name',
          type: 'string',
          initialValue: 'UI8 Marketplace'
        },
        {
          name: 'fromEmail',
          title: 'From Email',
          type: 'string',
          initialValue: 'noreply@ui8marketplace.com'
        },
        {
          name: 'replyTo',
          title: 'Reply To Email',
          type: 'string',
          initialValue: 'support@ui8marketplace.com'
        },
        {
          name: 'priority',
          title: 'Email Priority',
          type: 'string',
          options: {
            list: [
              { title: 'Low', value: 'low' },
              { title: 'Normal', value: 'normal' },
              { title: 'High', value: 'high' }
            ]
          },
          initialValue: 'normal'
        },
        {
          name: 'unsubscribeLink',
          title: 'Include Unsubscribe Link',
          type: 'boolean',
          initialValue: true
        },
        {
          name: 'viewInBrowserLink',
          title: 'Include View in Browser Link',
          type: 'boolean',
          initialValue: true
        }
      ]
    },
    {
      name: 'testing',
      title: 'Testing Configuration',
      type: 'object',
      fields: [
        {
          name: 'testData',
          title: 'Test Data',
          type: 'object',
          description: 'Sample data for template preview',
          fields: [
            {
              name: 'user',
              title: 'Test User Data',
              type: 'object',
              fields: [
                {
                  name: 'name',
                  title: 'Name',
                  type: 'string',
                  initialValue: 'John Doe'
                },
                {
                  name: 'email',
                  title: 'Email',
                  type: 'string',
                  initialValue: 'john@example.com'
                },
                {
                  name: 'country',
                  title: 'Country',
                  type: 'string',
                  initialValue: 'United States'
                }
              ]
            },
            {
              name: 'cart',
              title: 'Test Cart Data',
              type: 'object',
              fields: [
                {
                  name: 'total',
                  title: 'Cart Total',
                  type: 'number',
                  initialValue: 99.99
                },
                {
                  name: 'itemCount',
                  title: 'Item Count',
                  type: 'number',
                  initialValue: 3
                }
              ]
            }
          ]
        },
        {
          name: 'previewDevices',
          title: 'Preview Devices',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: 'Desktop', value: 'desktop' },
              { title: 'Mobile', value: 'mobile' },
              { title: 'Tablet', value: 'tablet' }
            ]
          },
          initialValue: ['desktop', 'mobile']
        }
      ]
    },
    {
      name: 'analytics',
      title: 'Template Analytics',
      type: 'object',
      fields: [
        {
          name: 'totalSent',
          title: 'Total Sent',
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
          name: 'revenueGenerated',
          title: 'Revenue Generated',
          type: 'number',
          readOnly: true,
          initialValue: 0
        },
        {
          name: 'lastUsed',
          title: 'Last Used',
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
          title: 'Template Tags',
          type: 'array',
          of: [{ type: 'string' }]
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'category',
      status: 'status',
      sent: 'analytics.totalSent',
      openRate: 'analytics.openRate'
    },
    prepare(selection: any) {
      const { title, subtitle, status, sent, openRate } = selection
      const statusIcon = {
        draft: '📝',
        active: '✅',
        archived: '📦'
      }[status] || '📧'

      const categoryLabel = {
        welcome: 'Welcome',
        abandoned_cart: 'Cart Recovery',
        order_confirmation: 'Order Confirm',
        newsletter: 'Newsletter',
        product_launch: 'Product Launch',
        re_engagement: 'Re-engagement',
        promotional: 'Promotional',
        transactional: 'Transactional',
        support: 'Support',
        custom: 'Custom'
      }[subtitle] || subtitle

      return {
        title: title || 'Email Template',
        subtitle: `${statusIcon} ${categoryLabel} • ${sent || 0} sent • ${openRate || 0}% open rate`,
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
      title: 'Category',
      name: 'categoryAsc',
      by: [{ field: 'category', direction: 'asc' }]
    },
    {
      title: 'Most Used',
      name: 'sentDesc',
      by: [{ field: 'analytics.totalSent', direction: 'desc' }]
    },
    {
      title: 'Best Performance',
      name: 'openRateDesc',
      by: [{ field: 'analytics.openRate', direction: 'desc' }]
    }
  ]
}
