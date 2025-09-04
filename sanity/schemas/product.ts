import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  icon: () => '📦',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required().max(100)
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: Rule => Rule.required().max(500)
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'string',
      validation: Rule => Rule.max(160)
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: Rule => Rule.required().min(0)
    }),
    defineField({
      name: 'originalPrice',
      title: 'Original Price (for discounts)',
      type: 'number',
      validation: Rule => Rule.min(0)
    }),
    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      options: {
        list: [
          {title: 'USD', value: 'USD'},
          {title: 'EUR', value: 'EUR'},
          {title: 'GBP', value: 'GBP'},
        ]
      },
      initialValue: 'USD'
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative text',
            }
          ]
        }
      ],
      validation: Rule => Rule.required().min(1).max(10)
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'author'}],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'tag'}]}]
    }),
    defineField({
      name: 'featured',
      title: 'Featured Product',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'freebie',
      title: 'Free Product',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Published', value: 'published'},
          {title: 'Archived', value: 'archived'},
          {title: 'Pending Review', value: 'pending'}
        ]
      },
      initialValue: 'draft'
    }),
    defineField({
      name: 'compatibleWith',
      title: 'Compatible With',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Figma', value: 'Figma'},
          {title: 'Sketch', value: 'Sketch'},
          {title: 'Adobe XD', value: 'Adobe XD'},
          {title: 'Photoshop', value: 'Photoshop'},
          {title: 'Illustrator', value: 'Illustrator'},
          {title: 'After Effects', value: 'After Effects'},
          {title: 'React', value: 'React'},
          {title: 'Vue.js', value: 'Vue.js'},
          {title: 'Angular', value: 'Angular'},
          {title: 'HTML/CSS', value: 'HTML/CSS'},
        ]
      }
    }),
    defineField({
      name: 'fileTypes',
      title: 'File Types',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: '.fig', value: 'fig'},
          {title: '.sketch', value: 'sketch'},
          {title: '.xd', value: 'xd'},
          {title: '.psd', value: 'psd'},
          {title: '.ai', value: 'ai'},
          {title: '.aep', value: 'aep'},
          {title: '.jsx', value: 'jsx'},
          {title: '.vue', value: 'vue'},
          {title: '.html', value: 'html'},
          {title: '.css', value: 'css'},
          {title: '.js', value: 'js'},
          {title: '.ts', value: 'ts'},
        ]
      }
    }),
    defineField({
      name: 'license',
      title: 'License Type',
      type: 'string',
      options: {
        list: [
          {title: 'Standard', value: 'standard'},
          {title: 'Extended', value: 'extended'},
          {title: 'Free', value: 'free'},
          {title: 'Custom', value: 'custom'}
        ]
      },
      initialValue: 'standard'
    }),
    defineField({
      name: 'preview',
      title: 'Preview URL',
      type: 'url',
      description: 'Link to live preview or demo'
    }),
    defineField({
      name: 'demoUrl',
      title: 'Demo URL',
      type: 'url',
      description: 'Link to interactive demo'
    }),
    defineField({
      name: 'fileSize',
      title: 'File Size',
      type: 'string',
      description: 'e.g., "45 MB"'
    }),
    defineField({
      name: 'version',
      title: 'Version',
      type: 'string',
      description: 'Product version number'
    }),
    defineField({
      name: 'lastUpdated',
      title: 'Last Updated',
      type: 'datetime'
    }),
    defineField({
      name: 'stats',
      title: 'Product Statistics',
      type: 'object',
      fields: [
        {
          name: 'views',
          title: 'Views',
          type: 'number',
          initialValue: 0
        },
        {
          name: 'downloads',
          title: 'Downloads',
          type: 'number',
          initialValue: 0
        },
        {
          name: 'likes',
          title: 'Likes',
          type: 'number',
          initialValue: 0
        },
        {
          name: 'rating',
          title: 'Rating',
          type: 'number',
          validation: Rule => Rule.min(0).max(5),
          initialValue: 0
        },
        {
          name: 'reviewsCount',
          title: 'Reviews Count',
          type: 'number',
          initialValue: 0
        }
      ],
      options: {
        collapsible: true,
        collapsed: false
      }
    })
  ],
  preview: {
    select: {
      title: 'title',
      media: 'images.0',
      price: 'price',
      currency: 'currency',
      featured: 'featured'
    },
    prepare(selection) {
      const {title, media, price, currency, featured} = selection
      return {
        title: title,
        subtitle: `${currency} ${price}${featured ? ' • Featured' : ''}`,
        media: media
      }
    }
  },
  orderings: [
    {
      title: 'Created Date, New',
      name: 'createdDesc',
      by: [
        {field: '_createdAt', direction: 'desc'}
      ]
    },
    {
      title: 'Price, High to Low',
      name: 'priceDesc',
      by: [
        {field: 'price', direction: 'desc'}
      ]
    },
    {
      title: 'Price, Low to High',
      name: 'priceAsc',
      by: [
        {field: 'price', direction: 'asc'}
      ]
    }
  ]
})
