import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  icon: () => '👤',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required().max(100)
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 4,
      validation: Rule => Rule.max(500)
    }),
    defineField({
      name: 'avatar',
      title: 'Avatar',
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
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url'
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      fields: [
        {
          name: 'dribbble',
          title: 'Dribbble',
          type: 'url'
        },
        {
          name: 'behance',
          title: 'Behance',
          type: 'url'
        },
        {
          name: 'instagram',
          title: 'Instagram',
          type: 'url'
        },
        {
          name: 'twitter',
          title: 'Twitter',
          type: 'url'
        },
        {
          name: 'linkedin',
          title: 'LinkedIn',
          type: 'url'
        }
      ]
    }),
    defineField({
      name: 'isVerified',
      title: 'Verified Author',
      type: 'boolean',
      description: 'Show verification badge',
      initialValue: false
    }),
    defineField({
      name: 'isFeatured',
      title: 'Featured Author',
      type: 'boolean',
      description: 'Show in featured authors section',
      initialValue: false
    }),
    defineField({
      name: 'stats',
      title: 'Author Statistics',
      type: 'object',
      fields: [
        {
          name: 'totalSales',
          title: 'Total Sales',
          type: 'number',
          initialValue: 0
        },
        {
          name: 'totalEarnings',
          title: 'Total Earnings',
          type: 'number',
          initialValue: 0
        },
        {
          name: 'averageRating',
          title: 'Average Rating',
          type: 'number',
          validation: Rule => Rule.min(0).max(5),
          initialValue: 0
        },
        {
          name: 'followers',
          title: 'Followers',
          type: 'number',
          initialValue: 0
        }
      ],
      options: {
        collapsible: true,
        collapsed: false
      }
    }),
    defineField({
      name: 'badges',
      title: 'Author Badges',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              title: 'Badge Name',
              type: 'string'
            },
            {
              name: 'icon',
              title: 'Icon',
              type: 'string'
            },
            {
              name: 'color',
              title: 'Color',
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
    }),
    defineField({
      name: 'joinedDate',
      title: 'Joined Date',
      type: 'datetime',
      description: 'When the author joined the platform'
    }),
    defineField({
      name: 'specialties',
      title: 'Specialties',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'UI Design', value: 'ui-design'},
          {title: 'UX Design', value: 'ux-design'},
          {title: 'Mobile Design', value: 'mobile-design'},
          {title: 'Web Design', value: 'web-design'},
          {title: 'Illustration', value: 'illustration'},
          {title: 'Branding', value: 'branding'},
          {title: 'Typography', value: 'typography'},
          {title: '3D Design', value: '3d-design'},
          {title: 'Animation', value: 'animation'},
          {title: 'Development', value: 'development'},
        ]
      }
    })
  ],
  preview: {
    select: {
      title: 'name',
      media: 'avatar',
      verified: 'isVerified',
      featured: 'isFeatured'
    },
    prepare(selection) {
      const {title, media, verified, featured} = selection
      let subtitle = ''
      if (verified) subtitle += '✓ Verified'
      if (featured) subtitle += (subtitle ? ' • ' : '') + '⭐ Featured'

      return {
        title: title,
        subtitle: subtitle || 'Author',
        media: media
      }
    }
  },
  orderings: [
    {
      title: 'Name A-Z',
      name: 'nameAsc',
      by: [
        {field: 'name', direction: 'asc'}
      ]
    },
    {
      title: 'Joined Date, New',
      name: 'joinedDesc',
      by: [
        {field: 'joinedDate', direction: 'desc'}
      ]
    }
  ]
})
