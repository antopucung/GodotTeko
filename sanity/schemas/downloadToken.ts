export default {
  name: 'downloadToken',
  title: 'Download Token',
  type: 'document',
  fields: [
    {
      name: 'token',
      title: 'Token String',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'Unique token string for secure downloads'
    },
    {
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule: any) => Rule.required(),
      description: 'User who owns this download token'
    },
    {
      name: 'order',
      title: 'Order',
      type: 'reference',
      to: [{ type: 'order' }],
      validation: (Rule: any) => Rule.required(),
      description: 'Order that generated this download token'
    },
    {
      name: 'product',
      title: 'Product',
      type: 'reference',
      to: [{ type: 'product' }],
      validation: (Rule: any) => Rule.required(),
      description: 'Product associated with this download token'
    },
    {
      name: 'fileKeys',
      title: 'File Keys',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (Rule: any) => Rule.required().min(1),
      description: 'S3 keys for files accessible with this token'
    },
    {
      name: 'maxDownloads',
      title: 'Maximum Downloads',
      type: 'number',
      validation: (Rule: any) => Rule.required().min(1).max(100),
      description: 'Maximum number of downloads allowed with this token'
    },
    {
      name: 'downloadCount',
      title: 'Download Count',
      type: 'number',
      initialValue: 0,
      validation: (Rule: any) => Rule.min(0),
      description: 'Number of times this token has been used'
    },
    {
      name: 'expiresAt',
      title: 'Expires At',
      type: 'datetime',
      validation: (Rule: any) => Rule.required(),
      description: 'When this token expires'
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      validation: (Rule: any) => Rule.required(),
      description: 'When this token was created'
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Inactive', value: 'inactive' },
          { title: 'Expired', value: 'expired' },
          { title: 'Suspended', value: 'suspended' }
        ]
      },
      initialValue: 'active',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'metadata',
      title: 'Metadata',
      type: 'object',
      fields: [
        {
          name: 'userIP',
          title: 'User IP Address',
          type: 'string',
          description: 'IP address when token was created'
        },
        {
          name: 'userAgent',
          title: 'User Agent',
          type: 'string',
          description: 'Browser user agent when token was created'
        },
        {
          name: 'orderNumber',
          title: 'Order Number',
          type: 'string',
          description: 'Human-readable order number'
        },
        {
          name: 'productTitle',
          title: 'Product Title',
          type: 'string',
          description: 'Product title at time of token creation'
        }
      ]
    },
    {
      name: 'restrictions',
      title: 'Security Restrictions',
      type: 'object',
      fields: [
        {
          name: 'ipValidation',
          title: 'IP Validation',
          type: 'boolean',
          description: 'Validate IP address on download',
          initialValue: true
        },
        {
          name: 'userAgentValidation',
          title: 'User Agent Validation',
          type: 'boolean',
          description: 'Validate user agent on download',
          initialValue: true
        },
        {
          name: 'singleUse',
          title: 'Single Use',
          type: 'boolean',
          description: 'Deactivate token after first use',
          initialValue: false
        }
      ]
    },
    {
      name: 'deactivatedAt',
      title: 'Deactivated At',
      type: 'datetime',
      description: 'When this token was deactivated'
    },
    {
      name: 'deactivationReason',
      title: 'Deactivation Reason',
      type: 'string',
      options: {
        list: [
          { title: 'Expired', value: 'expired' },
          { title: 'Download Limit Reached', value: 'download_limit_reached' },
          { title: 'Download Completed', value: 'download_completed' },
          { title: 'Manual Deactivation', value: 'manual' },
          { title: 'Security Issue', value: 'security' }
        ]
      },
      description: 'Reason why token was deactivated'
    },
    {
      name: 'regeneratedAt',
      title: 'Regenerated At',
      type: 'datetime',
      description: 'When this token was last regenerated'
    },
    {
      name: 'regenerationReason',
      title: 'Regeneration Reason',
      type: 'string',
      description: 'Reason for token regeneration'
    }
  ],
  preview: {
    select: {
      title: 'product.title',
      subtitle: 'user.name',
      status: 'status',
      downloadCount: 'downloadCount',
      maxDownloads: 'maxDownloads',
      expiresAt: 'expiresAt'
    },
    prepare(selection: any) {
      const { title, subtitle, status, downloadCount, maxDownloads, expiresAt } = selection
      const isExpired = new Date(expiresAt) < new Date()
      const statusIcon = status === 'active' && !isExpired ? '🟢' : '🔴'

      return {
        title: title || 'Download Token',
        subtitle: `${subtitle} • ${statusIcon} ${status} • ${downloadCount}/${maxDownloads} downloads`,
        media: '⬇️'
      }
    }
  },
  orderings: [
    {
      title: 'Created Date (Newest First)',
      name: 'createdAtDesc',
      by: [{ field: 'createdAt', direction: 'desc' }]
    },
    {
      title: 'Expires Date (Soonest First)',
      name: 'expiresAtAsc',
      by: [{ field: 'expiresAt', direction: 'asc' }]
    },
    {
      title: 'Status',
      name: 'statusAsc',
      by: [{ field: 'status', direction: 'asc' }]
    },
    {
      title: 'Download Count (Highest First)',
      name: 'downloadCountDesc',
      by: [{ field: 'downloadCount', direction: 'desc' }]
    }
  ]
}
