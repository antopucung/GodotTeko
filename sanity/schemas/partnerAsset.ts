export default {
  name: 'partnerAsset',
  title: 'Partner Asset',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text'
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Design Files', value: 'design' },
          { title: 'Source Files', value: 'source' },
          { title: 'Video Files', value: 'video' },
          { title: 'Documents', value: 'document' }
        ]
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'asset',
      title: 'File Asset',
      type: 'file',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'fileType',
      title: 'File Type',
      type: 'string',
      readOnly: true
    },
    {
      name: 'originalFilename',
      title: 'Original Filename',
      type: 'string',
      readOnly: true
    },
    {
      name: 'fileSize',
      title: 'File Size (bytes)',
      type: 'number',
      readOnly: true
    },
    {
      name: 'uploadedBy',
      title: 'Uploaded By',
      type: 'reference',
      to: [{ type: 'user' }],
      readOnly: true
    },
    {
      name: 'product',
      title: 'Associated Product',
      type: 'reference',
      to: [{ type: 'product' }],
      description: 'Product this asset belongs to (optional)'
    },
    {
      name: 'uploadedAt',
      title: 'Uploaded At',
      type: 'datetime',
      readOnly: true
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Uploaded', value: 'uploaded' },
          { title: 'Processing', value: 'processing' },
          { title: 'Ready', value: 'ready' },
          { title: 'Error', value: 'error' }
        ]
      },
      initialValue: 'uploaded'
    },
    {
      name: 'downloadCount',
      title: 'Download Count',
      type: 'number',
      initialValue: 0,
      readOnly: true
    },
    {
      name: 'isPublic',
      title: 'Public Access',
      type: 'boolean',
      initialValue: false,
      description: 'Allow public access without license'
    },
    {
      name: 'metadata',
      title: 'Metadata',
      type: 'object',
      fields: [
        {
          name: 'version',
          title: 'Version',
          type: 'string'
        },
        {
          name: 'tags',
          title: 'Tags',
          type: 'array',
          of: [{ type: 'string' }]
        },
        {
          name: 'softwareUsed',
          title: 'Software Used',
          type: 'array',
          of: [{ type: 'string' }]
        },
        {
          name: 'dimensions',
          title: 'Dimensions',
          type: 'string',
          description: 'For design files: width x height, for video: resolution'
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
      filename: 'originalFilename',
      uploadedBy: 'uploadedBy.name'
    },
    prepare({ title, subtitle, filename, uploadedBy }: any) {
      return {
        title: title || filename,
        subtitle: `${subtitle} • Uploaded by ${uploadedBy || 'Unknown'}`,
        media: undefined // You could add an icon based on file type
      }
    }
  },
  orderings: [
    {
      title: 'Upload Date (newest first)',
      name: 'uploadedAtDesc',
      by: [{ field: 'uploadedAt', direction: 'desc' }]
    },
    {
      title: 'Title A-Z',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }]
    },
    {
      title: 'Category',
      name: 'categoryAsc',
      by: [{ field: 'category', direction: 'asc' }]
    }
  ]
}
