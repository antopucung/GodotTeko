export default {
  name: 'downloadActivity',
  title: 'Download Activity',
  type: 'document',
  fields: [
    {
      name: 'token',
      title: 'Download Token',
      type: 'reference',
      to: [{ type: 'downloadToken' }],
      validation: (Rule: any) => Rule.required(),
      description: 'The download token used for this activity'
    },
    {
      name: 'fileKey',
      title: 'File Key',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'S3 key of the downloaded file'
    },
    {
      name: 'fileName',
      title: 'File Name',
      type: 'string',
      description: 'Original file name shown to user'
    },
    {
      name: 'downloadedAt',
      title: 'Downloaded At',
      type: 'datetime',
      validation: (Rule: any) => Rule.required(),
      description: 'When the download occurred'
    },
    {
      name: 'userIP',
      title: 'User IP Address',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'IP address of the downloader'
    },
    {
      name: 'userAgent',
      title: 'User Agent',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'Browser user agent string'
    },
    {
      name: 'fileSize',
      title: 'File Size (bytes)',
      type: 'number',
      validation: (Rule: any) => Rule.min(0),
      description: 'Size of the downloaded file in bytes'
    },
    {
      name: 'contentType',
      title: 'Content Type',
      type: 'string',
      description: 'MIME type of the downloaded file'
    },
    {
      name: 'success',
      title: 'Download Success',
      type: 'boolean',
      validation: (Rule: any) => Rule.required(),
      description: 'Whether the download was successful'
    },
    {
      name: 'error',
      title: 'Error Message',
      type: 'text',
      description: 'Error message if download failed'
    },
    {
      name: 'downloadMethod',
      title: 'Download Method',
      type: 'string',
      options: {
        list: [
          { title: 'Direct Download', value: 'direct' },
          { title: 'Streaming', value: 'streaming' },
          { title: 'Zip Download', value: 'zip' }
        ]
      },
      description: 'Method used for downloading'
    },
    {
      name: 'analytics',
      title: 'Analytics Data',
      type: 'object',
      fields: [
        {
          name: 'referrer',
          title: 'Referrer',
          type: 'string',
          description: 'HTTP referrer header'
        },
        {
          name: 'downloadSpeed',
          title: 'Download Speed (bytes/sec)',
          type: 'number',
          description: 'Calculated download speed'
        },
        {
          name: 'connectionType',
          title: 'Connection Type',
          type: 'string',
          description: 'Connection type if available'
        },
        {
          name: 'deviceType',
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
          type: 'string',
          description: 'Detected browser name and version'
        },
        {
          name: 'os',
          title: 'Operating System',
          type: 'string',
          description: 'Detected operating system'
        },
        {
          name: 'country',
          title: 'Country',
          type: 'string',
          description: 'Country detected from IP address'
        },
        {
          name: 'city',
          title: 'City',
          type: 'string',
          description: 'City detected from IP address'
        }
      ]
    },
    {
      name: 'security',
      title: 'Security Information',
      type: 'object',
      fields: [
        {
          name: 'ipValidationPassed',
          title: 'IP Validation Passed',
          type: 'boolean',
          description: 'Whether IP validation passed'
        },
        {
          name: 'userAgentValidationPassed',
          title: 'User Agent Validation Passed',
          type: 'boolean',
          description: 'Whether user agent validation passed'
        },
        {
          name: 'suspicious',
          title: 'Suspicious Activity',
          type: 'boolean',
          description: 'Whether this download was flagged as suspicious'
        },
        {
          name: 'suspicionReasons',
          title: 'Suspicion Reasons',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'Reasons why this download was flagged'
        }
      ]
    },
    {
      name: 'metadata',
      title: 'Additional Metadata',
      type: 'object',
      fields: [
        {
          name: 'sessionId',
          title: 'Session ID',
          type: 'string',
          description: 'User session identifier'
        },
        {
          name: 'downloadDuration',
          title: 'Download Duration (ms)',
          type: 'number',
          description: 'Time taken to complete download'
        },
        {
          name: 'retryCount',
          title: 'Retry Count',
          type: 'number',
          description: 'Number of retries before success/failure'
        },
        {
          name: 'cdnNode',
          title: 'CDN Node',
          type: 'string',
          description: 'CDN node that served the file'
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'fileName',
      subtitle: 'token.product.title',
      success: 'success',
      fileSize: 'fileSize',
      downloadedAt: 'downloadedAt',
      userIP: 'userIP'
    },
    prepare(selection: any) {
      const { title, subtitle, success, fileSize, downloadedAt, userIP } = selection
      const statusIcon = success ? '✅' : '❌'
      const fileSizeKB = fileSize ? Math.round(fileSize / 1024) : 0
      const date = downloadedAt ? new Date(downloadedAt).toLocaleDateString() : ''

      return {
        title: title || 'Download Activity',
        subtitle: `${statusIcon} ${subtitle} • ${fileSizeKB}KB • ${userIP} • ${date}`,
        media: success ? '⬇️' : '⚠️'
      }
    }
  },
  orderings: [
    {
      title: 'Download Date (Newest First)',
      name: 'downloadedAtDesc',
      by: [{ field: 'downloadedAt', direction: 'desc' }]
    },
    {
      title: 'File Size (Largest First)',
      name: 'fileSizeDesc',
      by: [{ field: 'fileSize', direction: 'desc' }]
    },
    {
      title: 'Success Status',
      name: 'successDesc',
      by: [{ field: 'success', direction: 'desc' }]
    }
  ]
}
