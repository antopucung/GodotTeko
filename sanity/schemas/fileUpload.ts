export default {
  name: 'fileUpload',
  title: 'File Upload',
  type: 'document',
  fields: [
    {
      name: 'fileName',
      title: 'File Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'Sanitized file name for storage'
    },
    {
      name: 'originalName',
      title: 'Original File Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'Original file name as uploaded by user'
    },
    {
      name: 'fileSize',
      title: 'File Size (bytes)',
      type: 'number',
      validation: (Rule: any) => Rule.required().min(0),
      description: 'Size of the file in bytes'
    },
    {
      name: 'mimeType',
      title: 'MIME Type',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'MIME type of the file'
    },
    {
      name: 'fileKey',
      title: 'File Key',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'S3 key for the uploaded file'
    },
    {
      name: 'user',
      title: 'Uploaded By',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule: any) => Rule.required(),
      description: 'User who uploaded this file'
    },
    {
      name: 'product',
      title: 'Associated Product',
      type: 'reference',
      to: [{ type: 'product' }],
      description: 'Product this file belongs to (if applicable)'
    },
    {
      name: 'category',
      title: 'File Category',
      type: 'string',
      options: {
        list: [
          { title: 'Product Files', value: 'products' },
          { title: 'User Avatars', value: 'avatars' },
          { title: 'Cover Images', value: 'covers' },
          { title: 'Temporary Files', value: 'temp' }
        ]
      },
      validation: (Rule: any) => Rule.required(),
      description: 'Category of the uploaded file'
    },
    {
      name: 'status',
      title: 'Upload Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Uploading', value: 'uploading' },
          { title: 'Processing', value: 'processing' },
          { title: 'Completed', value: 'completed' },
          { title: 'Error', value: 'error' },
          { title: 'Cancelled', value: 'cancelled' }
        ]
      },
      validation: (Rule: any) => Rule.required(),
      initialValue: 'pending'
    },
    {
      name: 'uploadedAt',
      title: 'Uploaded At',
      type: 'datetime',
      validation: (Rule: any) => Rule.required(),
      description: 'When the upload was initiated'
    },
    {
      name: 'processedAt',
      title: 'Processed At',
      type: 'datetime',
      description: 'When the file processing was completed'
    },
    {
      name: 'cancelledAt',
      title: 'Cancelled At',
      type: 'datetime',
      description: 'When the upload was cancelled'
    },
    {
      name: 'metadata',
      title: 'File Metadata',
      type: 'object',
      fields: [
        {
          name: 'checksum',
          title: 'File Checksum',
          type: 'string',
          description: 'SHA-256 hash of the file'
        },
        {
          name: 'width',
          title: 'Width',
          type: 'number',
          description: 'Image width in pixels'
        },
        {
          name: 'height',
          title: 'Height',
          type: 'number',
          description: 'Image height in pixels'
        },
        {
          name: 'duration',
          title: 'Duration',
          type: 'number',
          description: 'Video/audio duration in seconds'
        },
        {
          name: 'type',
          title: 'File Type',
          type: 'string',
          options: {
            list: [
              { title: 'Image', value: 'image' },
              { title: 'Video', value: 'video' },
              { title: 'Audio', value: 'audio' },
              { title: 'Archive', value: 'archive' },
              { title: 'Document', value: 'document' },
              { title: 'Other', value: 'other' }
            ]
          }
        },
        {
          name: 'thumbnailGenerated',
          title: 'Thumbnail Generated',
          type: 'boolean',
          description: 'Whether thumbnails were generated for this file'
        },
        {
          name: 'virusScanResult',
          title: 'Virus Scan Result',
          type: 'string',
          options: {
            list: [
              { title: 'Clean', value: 'clean' },
              { title: 'Infected', value: 'infected' },
              { title: 'Pending', value: 'pending' },
              { title: 'Error', value: 'error' }
            ]
          }
        },
        {
          name: 'scannedAt',
          title: 'Scanned At',
          type: 'datetime',
          description: 'When virus scan was completed'
        },
        {
          name: 'compressed',
          title: 'Compressed',
          type: 'boolean',
          description: 'Whether the file was compressed'
        },
        {
          name: 'compressionRatio',
          title: 'Compression Ratio',
          type: 'number',
          description: 'Compression ratio achieved'
        }
      ]
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Tags associated with this file'
    },
    {
      name: 'errorMessage',
      title: 'Error Message',
      type: 'text',
      description: 'Error message if upload failed'
    },
    {
      name: 'uploadProgress',
      title: 'Upload Progress',
      type: 'object',
      fields: [
        {
          name: 'percentage',
          title: 'Percentage Complete',
          type: 'number',
          validation: (Rule: any) => Rule.min(0).max(100)
        },
        {
          name: 'speed',
          title: 'Upload Speed (bytes/sec)',
          type: 'number'
        },
        {
          name: 'eta',
          title: 'ETA (seconds)',
          type: 'number'
        }
      ]
    },
    {
      name: 'accessControl',
      title: 'Access Control',
      type: 'object',
      fields: [
        {
          name: 'public',
          title: 'Public Access',
          type: 'boolean',
          description: 'Whether this file is publicly accessible'
        },
        {
          name: 'downloadable',
          title: 'Downloadable',
          type: 'boolean',
          description: 'Whether this file can be downloaded',
          initialValue: true
        },
        {
          name: 'maxDownloads',
          title: 'Maximum Downloads',
          type: 'number',
          description: 'Maximum number of downloads allowed'
        },
        {
          name: 'expiresAt',
          title: 'Expires At',
          type: 'datetime',
          description: 'When this file expires and should be deleted'
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'fileName',
      subtitle: 'user.name',
      status: 'status',
      fileSize: 'fileSize',
      mimeType: 'mimeType',
      uploadedAt: 'uploadedAt'
    },
    prepare(selection: any) {
      const { title, subtitle, status, fileSize, mimeType, uploadedAt } = selection

      const statusIcons = {
        pending: '⏳',
        uploading: '⬆️',
        processing: '⚙️',
        completed: '✅',
        error: '❌',
        cancelled: '🚫'
      }

      const fileSizeKB = fileSize ? Math.round(fileSize / 1024) : 0
      const fileType = mimeType ? mimeType.split('/')[0] : 'unknown'
      const date = uploadedAt ? new Date(uploadedAt).toLocaleDateString() : ''

      return {
        title: title || 'File Upload',
        subtitle: `${statusIcons[status as keyof typeof statusIcons] || '📄'} ${subtitle} • ${fileType} • ${fileSizeKB}KB • ${date}`,
        media: '📁'
      }
    }
  },
  orderings: [
    {
      title: 'Upload Date (Newest First)',
      name: 'uploadedAtDesc',
      by: [{ field: 'uploadedAt', direction: 'desc' }]
    },
    {
      title: 'File Size (Largest First)',
      name: 'fileSizeDesc',
      by: [{ field: 'fileSize', direction: 'desc' }]
    },
    {
      title: 'Status',
      name: 'statusAsc',
      by: [{ field: 'status', direction: 'asc' }]
    },
    {
      title: 'File Name',
      name: 'fileNameAsc',
      by: [{ field: 'fileName', direction: 'asc' }]
    }
  ]
}
