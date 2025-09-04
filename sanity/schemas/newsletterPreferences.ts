export default {
  name: 'newsletterPreferences',
  title: 'Newsletter Preferences',
  type: 'document',
  fields: [
    {
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule: any) => Rule.required(),
      description: 'User these preferences belong to'
    },
    {
      name: 'globalStatus',
      title: 'Global Email Status',
      type: 'string',
      options: {
        list: [
          { title: 'Subscribed', value: 'subscribed' },
          { title: 'Unsubscribed', value: 'unsubscribed' },
          { title: 'Bounced', value: 'bounced' },
          { title: 'Suppressed', value: 'suppressed' },
          { title: 'Pending Confirmation', value: 'pending' }
        ]
      },
      validation: (Rule: any) => Rule.required(),
      initialValue: 'subscribed'
    },
    {
      name: 'subscriptions',
      title: 'Email Subscriptions',
      type: 'object',
      fields: [
        {
          name: 'newsletter',
          title: 'Newsletter',
          type: 'object',
          fields: [
            {
              name: 'subscribed',
              title: 'Subscribed to Newsletter',
              type: 'boolean',
              initialValue: true
            },
            {
              name: 'frequency',
              title: 'Newsletter Frequency',
              type: 'string',
              options: {
                list: [
                  { title: 'Daily', value: 'daily' },
                  { title: 'Weekly', value: 'weekly' },
                  { title: 'Bi-weekly', value: 'biweekly' },
                  { title: 'Monthly', value: 'monthly' }
                ]
              },
              initialValue: 'weekly'
            },
            {
              name: 'bestTimeToSend',
              title: 'Best Time to Send',
              type: 'object',
              fields: [
                {
                  name: 'dayOfWeek',
                  title: 'Preferred Day',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Monday', value: 'monday' },
                      { title: 'Tuesday', value: 'tuesday' },
                      { title: 'Wednesday', value: 'wednesday' },
                      { title: 'Thursday', value: 'thursday' },
                      { title: 'Friday', value: 'friday' },
                      { title: 'Saturday', value: 'saturday' },
                      { title: 'Sunday', value: 'sunday' }
                    ]
                  },
                  initialValue: 'tuesday'
                },
                {
                  name: 'hour',
                  title: 'Preferred Hour (24h)',
                  type: 'number',
                  validation: (Rule: any) => Rule.min(0).max(23),
                  initialValue: 10
                }
              ]
            }
          ]
        },
        {
          name: 'productUpdates',
          title: 'Product Updates',
          type: 'object',
          fields: [
            {
              name: 'subscribed',
              title: 'Subscribed to Product Updates',
              type: 'boolean',
              initialValue: true
            },
            {
              name: 'categories',
              title: 'Product Categories',
              type: 'array',
              of: [{ type: 'string' }],
              options: {
                list: [
                  { title: 'UI Kits', value: 'ui_kits' },
                  { title: 'Icons', value: 'icons' },
                  { title: 'Illustrations', value: 'illustrations' },
                  { title: 'Templates', value: 'templates' },
                  { title: 'Mockups', value: 'mockups' },
                  { title: 'Fonts', value: 'fonts' },
                  { title: 'Photos', value: 'photos' }
                ]
              }
            },
            {
              name: 'newReleases',
              title: 'New Product Releases',
              type: 'boolean',
              initialValue: true
            },
            {
              name: 'featuredProducts',
              title: 'Featured Products',
              type: 'boolean',
              initialValue: true
            },
            {
              name: 'salesAndPromotions',
              title: 'Sales & Promotions',
              type: 'boolean',
              initialValue: true
            }
          ]
        },
        {
          name: 'transactional',
          title: 'Transactional Emails',
          type: 'object',
          fields: [
            {
              name: 'orderConfirmations',
              title: 'Order Confirmations',
              type: 'boolean',
              initialValue: true,
              readOnly: true,
              description: 'Required for account functionality'
            },
            {
              name: 'downloadNotifications',
              title: 'Download Notifications',
              type: 'boolean',
              initialValue: true
            },
            {
              name: 'accountUpdates',
              title: 'Account Updates',
              type: 'boolean',
              initialValue: true,
              readOnly: true,
              description: 'Required for account security'
            },
            {
              name: 'passwordResets',
              title: 'Password Reset Emails',
              type: 'boolean',
              initialValue: true,
              readOnly: true,
              description: 'Required for account security'
            },
            {
              name: 'paymentNotifications',
              title: 'Payment Notifications',
              type: 'boolean',
              initialValue: true
            }
          ]
        },
        {
          name: 'marketing',
          title: 'Marketing Emails',
          type: 'object',
          fields: [
            {
              name: 'personalizedRecommendations',
              title: 'Personalized Recommendations',
              type: 'boolean',
              initialValue: true
            },
            {
              name: 'abandonedCartReminders',
              title: 'Abandoned Cart Reminders',
              type: 'boolean',
              initialValue: true
            },
            {
              name: 'reEngagementCampaigns',
              title: 'Re-engagement Campaigns',
              type: 'boolean',
              initialValue: true
            },
            {
              name: 'surveys',
              title: 'Surveys & Feedback Requests',
              type: 'boolean',
              initialValue: false
            },
            {
              name: 'eventInvitations',
              title: 'Event Invitations',
              type: 'boolean',
              initialValue: false
            }
          ]
        },
        {
          name: 'partnerCommunications',
          title: 'Partner Communications',
          type: 'object',
          hidden: ({ document }: any) => document?.user?.role !== 'partner',
          fields: [
            {
              name: 'earningsReports',
              title: 'Earnings Reports',
              type: 'boolean',
              initialValue: true
            },
            {
              name: 'payoutNotifications',
              title: 'Payout Notifications',
              type: 'boolean',
              initialValue: true
            },
            {
              name: 'partnerTips',
              title: 'Partner Tips & Best Practices',
              type: 'boolean',
              initialValue: true
            },
            {
              name: 'platformUpdates',
              title: 'Platform Updates',
              type: 'boolean',
              initialValue: true
            },
            {
              name: 'competitionNotifications',
              title: 'Competition Notifications',
              type: 'boolean',
              initialValue: false
            }
          ]
        }
      ]
    },
    {
      name: 'contentPreferences',
      title: 'Content Preferences',
      type: 'object',
      fields: [
        {
          name: 'preferredLanguage',
          title: 'Preferred Language',
          type: 'string',
          options: {
            list: [
              { title: 'English', value: 'en' },
              { title: 'Spanish', value: 'es' },
              { title: 'French', value: 'fr' },
              { title: 'German', value: 'de' },
              { title: 'Japanese', value: 'ja' },
              { title: 'Chinese', value: 'zh' }
            ]
          },
          initialValue: 'en'
        },
        {
          name: 'interests',
          title: 'Design Interests',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: 'Web Design', value: 'web_design' },
              { title: 'Mobile Design', value: 'mobile_design' },
              { title: 'Graphic Design', value: 'graphic_design' },
              { title: 'Illustration', value: 'illustration' },
              { title: 'Photography', value: 'photography' },
              { title: 'Typography', value: 'typography' },
              { title: 'Branding', value: 'branding' },
              { title: 'UX/UI', value: 'ux_ui' },
              { title: 'Print Design', value: 'print_design' }
            ]
          }
        },
        {
          name: 'skillLevel',
          title: 'Skill Level',
          type: 'string',
          options: {
            list: [
              { title: 'Beginner', value: 'beginner' },
              { title: 'Intermediate', value: 'intermediate' },
              { title: 'Advanced', value: 'advanced' },
              { title: 'Expert', value: 'expert' }
            ]
          }
        },
        {
          name: 'contentTypes',
          title: 'Preferred Content Types',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: 'Tutorials', value: 'tutorials' },
              { title: 'Design Inspiration', value: 'inspiration' },
              { title: 'Industry News', value: 'news' },
              { title: 'Product Reviews', value: 'reviews' },
              { title: 'Case Studies', value: 'case_studies' },
              { title: 'Free Resources', value: 'freebies' },
              { title: 'Design Tools', value: 'tools' }
            ]
          }
        }
      ]
    },
    {
      name: 'deliverySettings',
      title: 'Delivery Settings',
      type: 'object',
      fields: [
        {
          name: 'timezone',
          title: 'Timezone',
          type: 'string',
          options: {
            list: [
              { title: 'UTC', value: 'UTC' },
              { title: 'US/Eastern', value: 'US/Eastern' },
              { title: 'US/Central', value: 'US/Central' },
              { title: 'US/Mountain', value: 'US/Mountain' },
              { title: 'US/Pacific', value: 'US/Pacific' },
              { title: 'Europe/London', value: 'Europe/London' },
              { title: 'Europe/Paris', value: 'Europe/Paris' },
              { title: 'Asia/Tokyo', value: 'Asia/Tokyo' },
              { title: 'Asia/Shanghai', value: 'Asia/Shanghai' },
              { title: 'Australia/Sydney', value: 'Australia/Sydney' }
            ]
          },
          initialValue: 'UTC'
        },
        {
          name: 'emailFormat',
          title: 'Email Format',
          type: 'string',
          options: {
            list: [
              { title: 'HTML', value: 'html' },
              { title: 'Plain Text', value: 'text' },
              { title: 'Both', value: 'both' }
            ]
          },
          initialValue: 'html'
        },
        {
          name: 'frequency',
          title: 'Overall Email Frequency',
          type: 'object',
          fields: [
            {
              name: 'maxEmailsPerDay',
              title: 'Maximum Emails per Day',
              type: 'number',
              validation: (Rule: any) => Rule.min(0).max(10),
              initialValue: 3
            },
            {
              name: 'maxEmailsPerWeek',
              title: 'Maximum Emails per Week',
              type: 'number',
              validation: (Rule: any) => Rule.min(0).max(50),
              initialValue: 10
            },
            {
              name: 'quietHours',
              title: 'Quiet Hours',
              type: 'object',
              fields: [
                {
                  name: 'enabled',
                  title: 'Enable Quiet Hours',
                  type: 'boolean',
                  initialValue: false
                },
                {
                  name: 'startHour',
                  title: 'Start Hour (24h)',
                  type: 'number',
                  validation: (Rule: any) => Rule.min(0).max(23),
                  initialValue: 22
                },
                {
                  name: 'endHour',
                  title: 'End Hour (24h)',
                  type: 'number',
                  validation: (Rule: any) => Rule.min(0).max(23),
                  initialValue: 8
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'engagement',
      title: 'Engagement History',
      type: 'object',
      fields: [
        {
          name: 'totalEmailsReceived',
          title: 'Total Emails Received',
          type: 'number',
          readOnly: true,
          initialValue: 0
        },
        {
          name: 'totalEmailsOpened',
          title: 'Total Emails Opened',
          type: 'number',
          readOnly: true,
          initialValue: 0
        },
        {
          name: 'totalLinksClicked',
          title: 'Total Links Clicked',
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
          name: 'lastEmailOpened',
          title: 'Last Email Opened',
          type: 'datetime',
          readOnly: true
        },
        {
          name: 'lastEmailClicked',
          title: 'Last Email Clicked',
          type: 'datetime',
          readOnly: true
        },
        {
          name: 'engagementScore',
          title: 'Engagement Score (0-100)',
          type: 'number',
          readOnly: true,
          initialValue: 50,
          description: 'Calculated engagement score based on email interactions'
        }
      ]
    },
    {
      name: 'suppression',
      title: 'Suppression Settings',
      type: 'object',
      fields: [
        {
          name: 'suppressionList',
          title: 'Suppression Lists',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: 'Hard Bounce', value: 'hard_bounce' },
              { title: 'Spam Complaint', value: 'spam' },
              { title: 'Manual Suppression', value: 'manual' },
              { title: 'Unsubscribed', value: 'unsubscribed' },
              { title: 'Invalid Email', value: 'invalid' }
            ]
          }
        },
        {
          name: 'suppressionReason',
          title: 'Suppression Reason',
          type: 'string'
        },
        {
          name: 'suppressedAt',
          title: 'Suppressed At',
          type: 'datetime'
        },
        {
          name: 'suppressedBy',
          title: 'Suppressed By',
          type: 'reference',
          to: [{ type: 'user' }]
        }
      ]
    },
    {
      name: 'timestamps',
      title: 'Subscription Timestamps',
      type: 'object',
      fields: [
        {
          name: 'subscribedAt',
          title: 'First Subscribed At',
          type: 'datetime',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'lastUpdatedAt',
          title: 'Last Updated At',
          type: 'datetime'
        },
        {
          name: 'confirmedAt',
          title: 'Email Confirmed At',
          type: 'datetime'
        },
        {
          name: 'unsubscribedAt',
          title: 'Unsubscribed At',
          type: 'datetime'
        },
        {
          name: 'resubscribedAt',
          title: 'Resubscribed At',
          type: 'datetime'
        }
      ]
    },
    {
      name: 'source',
      title: 'Subscription Source',
      type: 'object',
      fields: [
        {
          name: 'subscriptionSource',
          title: 'How They Subscribed',
          type: 'string',
          options: {
            list: [
              { title: 'Website Signup', value: 'website' },
              { title: 'Checkout Process', value: 'checkout' },
              { title: 'Email Referral', value: 'email_referral' },
              { title: 'Social Media', value: 'social' },
              { title: 'API Import', value: 'api' },
              { title: 'Manual Addition', value: 'manual' },
              { title: 'Partner Signup', value: 'partner_signup' }
            ]
          }
        },
        {
          name: 'referralSource',
          title: 'Referral Source',
          type: 'string'
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
            }
          ]
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'user.name',
      subtitle: 'globalStatus',
      userEmail: 'user.email',
      engagementScore: 'engagement.engagementScore',
      lastUpdated: 'timestamps.lastUpdatedAt'
    },
    prepare(selection: any) {
      const { title, subtitle, userEmail, engagementScore, lastUpdated } = selection
      const statusIcon = {
        subscribed: '✅',
        unsubscribed: '❌',
        bounced: '⚠️',
        suppressed: '🚫',
        pending: '⏳'
      }[subtitle] || '📧'

      const date = lastUpdated ? new Date(lastUpdated).toLocaleDateString() : ''

      return {
        title: title || userEmail || 'Newsletter Preferences',
        subtitle: `${statusIcon} ${subtitle} • Score: ${engagementScore || 0} • ${date}`,
        media: '📧'
      }
    }
  },
  orderings: [
    {
      title: 'Subscribed Date (Newest)',
      name: 'subscribedDesc',
      by: [{ field: 'timestamps.subscribedAt', direction: 'desc' }]
    },
    {
      title: 'User Name (A-Z)',
      name: 'userAsc',
      by: [{ field: 'user.name', direction: 'asc' }]
    },
    {
      title: 'Engagement Score (Highest)',
      name: 'engagementDesc',
      by: [{ field: 'engagement.engagementScore', direction: 'desc' }]
    },
    {
      title: 'Status',
      name: 'statusAsc',
      by: [{ field: 'globalStatus', direction: 'asc' }]
    }
  ]
}
